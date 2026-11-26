/**
 * VS Code bridge — active only when Yappy runs as the custom editor of the VS Code extension
 * (`vscode/`). The file on disk is the document: the extension sends its bytes in (`load`),
 * asks for them back on save (`getBytes`), and is told about every edit so it can mark the tab
 * dirty. Undo/redo stay Yappy's own (Ctrl+Z reaches the editor first; VS Code has no edits of
 * ours to undo). Same shape as `desktop/desktop-bridge.ts` for the Tauri shell.
 */
import { createRoot } from 'solid-js';
import { store, loadDocument, resetToNewDocument, setStore, setTheme } from '../store/app-store';
import { buildSlideDocument, gzipString, decodeDocumentBytes } from '../utils/document-io';
import { watchDocumentEdits } from '../storage/auto-save';
import { showToast } from '../components/toast';
import { editableFormat, extractScene, type EditableFormat } from '../utils/embedded-scene';
import { isVSCode, vscodeApi, installDownloadInterceptor } from './vscode-host';
import type { HostMessage, ThemeKind, WebviewMessage } from './protocol';

const post = (m: WebviewMessage) => vscodeApi()?.postMessage(m);

/** Name stored in the document's metadata: the file name without its extension. */
let fileBaseName = 'Untitled';
/** What the open file is: a `.yappy` drawing, or an editable `.yappy.svg` / `.yappy.png` image. */
let format: EditableFormat = 'yappy';

/** True while a `load` is being applied, so the store churn it causes is not reported as an edit. */
let loading = false;

function applyTheme(theme: ThemeKind): void {
    // Only follow VS Code while the user hasn't picked a theme of their own in this editor.
    if (store.theme === 'system' || store.theme === 'light' || store.theme === 'dark') setTheme(theme);
}

async function handleLoad(bytes: number[], fileName: string, theme: ThemeKind): Promise<void> {
    fileBaseName = fileName.replace(/\.(yappy(\.(svg|png))?|json)$/i, '') || 'Untitled';
    format = editableFormat(fileName) ?? 'yappy';
    loading = true;
    try {
        let docBytes: Uint8Array = new Uint8Array(bytes);
        if (format !== 'yappy' && docBytes.length > 0) {
            const scene = extractScene(docBytes);
            if (!scene) throw new Error(`it is a plain ${format.toUpperCase()} image with no YappyDraw drawing inside. Saving here would replace the image with a new drawing.`);
            docBytes = scene;
        }
        if (docBytes.length === 0) {
            // An empty file (just created, or `touch`ed): start a fresh drawing and let the
            // welcome screen offer the document types.
            resetToNewDocument('infinite');
            setStore('welcomeDismissed', false);
        } else {
            const doc = await decodeDocumentBytes(docBytes);
            loadDocument(doc);
            setStore('welcomeDismissed', true);
        }
        // After the load, not before: a document carries its own theme in globalSettings and
        // loadDocument applies it. The editor should open matching VS Code, not the theme the
        // file happened to be saved under.
        applyTheme(theme);
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        post({ type: 'loadError', message });
        showToast(`Could not open ${fileName}: ${message}`, 'error', 0);
    } finally {
        // The edit watcher's effect runs synchronously after each store write, so by the time
        // this microtask runs every load-caused change has already been seen and ignored.
        queueMicrotask(() => { loading = false; });
    }
}

async function handleGetBytes(requestId: number): Promise<void> {
    try {
        let bytes: Uint8Array;
        if (format === 'yappy') {
            bytes = await gzipString(JSON.stringify(buildSlideDocument(fileBaseName)));
        } else {
            // Lazy: the exporter is a large chunk a plain .yappy file never needs.
            const { renderEditableImage } = await import('../utils/editable-image');
            bytes = await renderEditableImage(format, fileBaseName);
        }
        post({ type: 'bytes', requestId, bytes: Array.from(bytes) });
    } catch (e) {
        post({ type: 'bytesError', requestId, message: e instanceof Error ? e.message : String(e) });
    }
}

function onMessage(event: MessageEvent): void {
    const m = event.data as HostMessage | undefined;
    if (!m || typeof m !== 'object' || typeof (m as { type?: unknown }).type !== 'string') return;
    switch (m.type) {
        case 'load': void handleLoad(m.bytes ?? [], m.fileName ?? 'Untitled', m.theme); break;
        case 'getBytes': void handleGetBytes(m.requestId); break;
        case 'theme': applyTheme(m.theme); break;
    }
}

let initialized = false;

/** Initialize the VS Code bridge (no-op elsewhere). Call once, after the app has mounted. */
export function initVSCode(): void {
    if (initialized || !isVSCode()) return;
    initialized = true;

    installDownloadInterceptor();
    window.addEventListener('message', onMessage);
    // Own root: the watcher must outlive whichever component happened to call init.
    createRoot(() => watchDocumentEdits(() => { if (!loading) post({ type: 'edit' }); }));
    post({ type: 'ready' });
}
