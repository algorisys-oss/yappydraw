/**
 * The `.yappy` custom editor: the YappyDraw editor running in a webview, with the file on disk
 * as its document.
 *
 * Edits are reported as content changes (no VS Code-side undo stack): Yappy keeps its own
 * history, and Ctrl+Z reaches the editor before the workbench, so mirroring edits into VS Code
 * would undo everything twice. Saving asks the webview for a snapshot of the document
 * (`getBytes`) and writes what comes back.
 */
import * as vscode from 'vscode';
import type { HostMessage, ThemeKind, WebviewMessage } from '../../frontend/src/vscode/protocol';
import { buildEditorHtml, makeNonce } from './webview-html';

export const VIEW_TYPE = 'yappy.editor';

/** How long a save waits for the editor's snapshot before giving up. Large drawings with
 *  embedded images gzip in well under a second; this is for a webview that has died. */
const SNAPSHOT_TIMEOUT_MS = 30_000;

class YappyDocument implements vscode.CustomDocument {
    /** The webview editing this document (one per document: see supportsMultipleEditorsPerDocument). */
    webview: vscode.Webview | undefined;
    /** Bytes to show the next time the editor asks (`ready`) — the file, or a hot-exit backup. */
    bytes: Uint8Array;
    private nextRequestId = 1;
    private pending = new Map<number, { resolve: (b: Uint8Array) => void; reject: (e: Error) => void }>();

    constructor(readonly uri: vscode.Uri, bytes: Uint8Array) {
        this.bytes = bytes;
    }

    /** Ask the editor for the current document as `.yappy` bytes. */
    snapshot(): Promise<Uint8Array> {
        const webview = this.webview;
        if (!webview) return Promise.resolve(this.bytes);
        const requestId = this.nextRequestId++;
        return new Promise<Uint8Array>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(requestId);
                reject(new Error('The Yappy editor did not respond.'));
            }, SNAPSHOT_TIMEOUT_MS);
            this.pending.set(requestId, {
                resolve: (b) => { clearTimeout(timer); resolve(b); },
                reject: (e) => { clearTimeout(timer); reject(e); },
            });
            void webview.postMessage({ type: 'getBytes', requestId } satisfies HostMessage);
        });
    }

    settle(requestId: number, result: Uint8Array | Error): void {
        const p = this.pending.get(requestId);
        if (!p) return;
        this.pending.delete(requestId);
        if (result instanceof Error) p.reject(result);
        else p.resolve(result);
    }

    dispose(): void {
        for (const p of this.pending.values()) p.reject(new Error('Editor closed.'));
        this.pending.clear();
        this.webview = undefined;
    }
}

function themeKind(): ThemeKind {
    const k = vscode.window.activeColorTheme.kind;
    return k === vscode.ColorThemeKind.Light || k === vscode.ColorThemeKind.HighContrastLight ? 'light' : 'dark';
}

function fileName(uri: vscode.Uri): string {
    return uri.path.split('/').pop() || 'Untitled.yappy';
}

export class YappyEditorProvider implements vscode.CustomEditorProvider<YappyDocument> {
    private readonly changeEmitter = new vscode.EventEmitter<vscode.CustomDocumentContentChangeEvent<YappyDocument>>();
    readonly onDidChangeCustomDocument = this.changeEmitter.event;
    private readonly documents = new Set<YappyDocument>();

    static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new YappyEditorProvider(context);
        return vscode.Disposable.from(
            vscode.window.registerCustomEditorProvider(VIEW_TYPE, provider, {
                // Kept alive when hidden: reloading a large drawing on every tab switch is slow,
                // and the undo history lives in the webview.
                webviewOptions: { retainContextWhenHidden: true },
                supportsMultipleEditorsPerDocument: false,
            }),
            vscode.window.onDidChangeActiveColorTheme(() => provider.broadcastTheme()),
        );
    }

    private constructor(private readonly context: vscode.ExtensionContext) {}

    private editorRoot(): vscode.Uri {
        return vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor');
    }

    async openCustomDocument(
        uri: vscode.Uri,
        openContext: vscode.CustomDocumentOpenContext,
    ): Promise<YappyDocument> {
        // A hot-exit backup wins over the file: it holds the unsaved edits.
        const source = openContext.backupId ? vscode.Uri.parse(openContext.backupId) : uri;
        const bytes = uri.scheme === 'untitled' && !openContext.backupId
            ? new Uint8Array()
            : await vscode.workspace.fs.readFile(source);
        const doc = new YappyDocument(uri, bytes);
        this.documents.add(doc);
        return doc;
    }

    async resolveCustomEditor(doc: YappyDocument, panel: vscode.WebviewPanel): Promise<void> {
        const webview = panel.webview;
        doc.webview = webview;
        webview.options = { enableScripts: true, localResourceRoots: [this.editorRoot()] };
        webview.html = await this.html(webview);

        const sub = webview.onDidReceiveMessage((m: WebviewMessage) => this.onMessage(doc, webview, m));
        panel.onDidDispose(() => {
            sub.dispose();
            doc.dispose();
            this.documents.delete(doc);
        });
    }

    private onMessage(doc: YappyDocument, webview: vscode.Webview, m: WebviewMessage): void {
        switch (m?.type) {
            case 'ready':
                void webview.postMessage({
                    type: 'load', bytes: Array.from(doc.bytes), fileName: fileName(doc.uri), theme: themeKind(),
                } satisfies HostMessage);
                break;
            case 'edit':
                this.changeEmitter.fire({ document: doc });
                break;
            case 'bytes':
                doc.settle(m.requestId, Uint8Array.from(m.bytes));
                break;
            case 'bytesError':
                doc.settle(m.requestId, new Error(m.message));
                break;
            case 'loadError':
                void vscode.window.showErrorMessage(`Yappy could not open ${fileName(doc.uri)}: ${m.message}`);
                break;
            case 'saveFile':
                void this.saveExport(doc, webview, m.requestId, m.name, m.bytes, m.filters);
                break;
            case 'openExternal':
                if (/^https?:\/\//i.test(m.url)) void vscode.env.openExternal(vscode.Uri.parse(m.url));
                break;
        }
    }

    /** An export from the editor (PNG, SVG, PDF, …): ask where, defaulting next to the drawing. */
    private async saveExport(
        doc: YappyDocument, webview: vscode.Webview, requestId: number,
        name: string, bytes: number[], filters: Record<string, string[]>,
    ): Promise<void> {
        let saved = false;
        try {
            // Only the last path segment of the suggested name: it comes from the webview.
            const safeName = (name.split(/[\\/]/).pop() || 'export').trim() || 'export';
            const folder = doc.uri.scheme === 'untitled'
                ? vscode.workspace.workspaceFolders?.[0]?.uri
                : vscode.Uri.joinPath(doc.uri, '..');
            const target = await vscode.window.showSaveDialog({
                defaultUri: folder ? vscode.Uri.joinPath(folder, safeName) : undefined,
                filters: Object.keys(filters).length ? filters : undefined,
                saveLabel: 'Export',
            });
            if (target) {
                await vscode.workspace.fs.writeFile(target, Uint8Array.from(bytes));
                saved = true;
                void vscode.window.showInformationMessage(`Exported ${target.path.split('/').pop()}`);
            }
        } catch (e) {
            void vscode.window.showErrorMessage(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
        }
        void webview.postMessage({ type: 'saveFileResult', requestId, saved } satisfies HostMessage);
    }

    private async html(webview: vscode.Webview): Promise<string> {
        const root = this.editorRoot();
        let index: string;
        try {
            index = new TextDecoder().decode(await vscode.workspace.fs.readFile(vscode.Uri.joinPath(root, 'index.html')));
        } catch {
            return '<body style="font-family:sans-serif;padding:2em">The Yappy editor build is missing from this extension (media/editor). Rebuild it with <code>npm run build:vscode</code>.</body>';
        }
        return buildEditorHtml(index, {
            baseUri: webview.asWebviewUri(root).toString(),
            cspSource: webview.cspSource,
            nonce: makeNonce(),
        });
    }

    private broadcastTheme(): void {
        const theme = themeKind();
        for (const d of this.documents) void d.webview?.postMessage({ type: 'theme', theme } satisfies HostMessage);
    }

    async saveCustomDocument(doc: YappyDocument): Promise<void> {
        await this.saveCustomDocumentAs(doc, doc.uri);
    }

    async saveCustomDocumentAs(doc: YappyDocument, destination: vscode.Uri): Promise<void> {
        const bytes = await doc.snapshot();
        await vscode.workspace.fs.writeFile(destination, bytes);
        // After Save As the editor shows the new file; keep the in-memory copy current either way.
        doc.bytes = bytes;
    }

    async revertCustomDocument(doc: YappyDocument): Promise<void> {
        // An untitled drawing has no file to go back to: revert means empty.
        doc.bytes = doc.uri.scheme === 'untitled' ? new Uint8Array() : await vscode.workspace.fs.readFile(doc.uri);
        void doc.webview?.postMessage({
            type: 'load', bytes: Array.from(doc.bytes), fileName: fileName(doc.uri), theme: themeKind(),
        } satisfies HostMessage);
    }

    async backupCustomDocument(
        doc: YappyDocument,
        context: vscode.CustomDocumentBackupContext,
    ): Promise<vscode.CustomDocumentBackup> {
        const bytes = await doc.snapshot();
        await vscode.workspace.fs.writeFile(context.destination, bytes);
        return {
            id: context.destination.toString(),
            delete: () => { void vscode.workspace.fs.delete(context.destination).then(undefined, () => undefined); },
        };
    }
}
