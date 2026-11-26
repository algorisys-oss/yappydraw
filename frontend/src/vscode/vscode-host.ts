/**
 * Detects the VS Code webview host. Deliberately tiny and free of store imports: `index.tsx`
 * calls `prepareVSCodeBoot()` before the router reads the URL, and `app.tsx` asks
 * `isVSCode()` to skip what a file-backed editor must not do (autosave restore, the service
 * worker, the gallery quick-save).
 */
import type { WebviewMessage } from './protocol';

interface VSCodeApi {
    postMessage(message: WebviewMessage): void;
}

declare const acquireVsCodeApi: (() => VSCodeApi) | undefined;

let api: VSCodeApi | null | undefined;

/** True when running inside a VS Code (or Cursor / VSCodium) webview. */
export function isVSCode(): boolean {
    return typeof acquireVsCodeApi === 'function';
}

/** The webview API. `acquireVsCodeApi` may be called only once per page, so it is cached. */
export function vscodeApi(): VSCodeApi | null {
    if (api === undefined) {
        try {
            api = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;
        } catch {
            api = null;
        }
    }
    return api;
}

/**
 * Run before the first render. The webview's URL is `vscode-webview://<id>/index.html`, which
 * the path router would treat as an unknown page; the editor lives at `/`. Assets are
 * unaffected: the extension injects a `<base href>` pointing at the bundled build.
 */
export function prepareVSCodeBoot(): void {
    if (!isVSCode()) return;
    vscodeApi();
    try {
        // Absolute, built from location.href: a relative URL would resolve against the injected
        // <base href> (a different origin) and replaceState would throw a SecurityError.
        if (window.location.pathname !== '/') {
            const url = new URL('/', window.location.href);
            url.search = window.location.search;
            history.replaceState(history.state, '', url.href);
        }
    } catch { /* a refused replaceState only costs the route */ }
    try { document.documentElement.setAttribute('data-host', 'vscode'); } catch { /* ignore */ }
}

/** Ask the host to open a URL in the user's browser (a webview cannot navigate away). */
export function openExternal(url: string): void {
    vscodeApi()?.postMessage({ type: 'openExternal', url });
}

// ── Exports ──────────────────────────────────────────────────────────────
// A webview cannot download files: `<a download>` does nothing and `showSaveFilePicker` is
// refused in its cross-origin frame. Exports go to the host instead, which shows VS Code's
// Save dialog. `utils/save-file.ts` calls `saveViaHost`; `installDownloadInterceptor` catches
// the remaining `<a download>` call sites (video, HTML export, …) and any added later.

let nextSaveId = 1;
const pendingSaves = new Map<number, (saved: boolean) => void>();
let resultListener = false;

function listenForSaveResults(): void {
    if (resultListener) return;
    resultListener = true;
    window.addEventListener('message', (e: MessageEvent) => {
        const m = e.data;
        if (m && m.type === 'saveFileResult' && typeof m.requestId === 'number') {
            pendingSaves.get(m.requestId)?.(!!m.saved);
            pendingSaves.delete(m.requestId);
        }
    });
}

/** Save `blob` through VS Code's Save dialog. Resolves false if the user cancelled. */
export async function saveViaHost(blob: Blob, name: string, accept: Record<string, string[]> = {}, description?: string): Promise<boolean> {
    const api = vscodeApi();
    if (!api) return false;
    listenForSaveResults();
    const bytes = Array.from(new Uint8Array(await blob.arrayBuffer()));
    // VS Code's filter format: label → extensions without the dot.
    const exts = Object.values(accept).flat().map(x => x.replace(/^\./, ''));
    const filters: Record<string, string[]> = exts.length ? { [description || exts[0].toUpperCase()]: exts } : {};
    const requestId = nextSaveId++;
    return new Promise<boolean>((resolve) => {
        pendingSaves.set(requestId, resolve);
        api.postMessage({ type: 'saveFile', requestId, name, bytes, filters });
    });
}

let downloadsIntercepted = false;

/** Route every `<a download>` click to `saveViaHost`. No-op outside VS Code; idempotent. */
export function installDownloadInterceptor(): void {
    if (downloadsIntercepted || !isVSCode()) return;
    downloadsIntercepted = true;
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        const href = this.href;
        if (this.hasAttribute('download') && /^(blob|data):/i.test(href)) {
            const name = this.getAttribute('download') || 'download';
            void fetch(href).then(r => r.blob()).then(b => saveViaHost(b, name)).catch(err => {
                console.error('[vscode] export failed:', err);
            });
            return;
        }
        return originalClick.call(this);
    };
}
