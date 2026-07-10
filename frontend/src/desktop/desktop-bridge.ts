/**
 * Desktop (Tauri) bridge — active only when Yappy runs inside the native shell. Wires the
 * native menu bar to store actions, native file Open/Save of `.yappy`/`.json` documents, a
 * recent-files list (native File ▸ Open Recent), file-association / launch-file opening, and
 * auto-update. The web build is unaffected: everything is behind `isTauri()`.
 */
import { store, loadDocument, resetToNewDocument, undo, redo, zoomToFit, togglePropertyPanel } from "../store/app-store";
import { showToast } from "../components/toast";
import { buildSlideDocument, gzipString, decodeDocumentBytes } from "../utils/document-io";
import { exportToPng, exportToSvg } from "../utils/export";

type TauriGlobal = {
    core: { invoke: (cmd: string, args?: any) => Promise<any> };
    event: { listen: (event: string, cb: (e: { payload: any }) => void) => Promise<() => void> };
};

export function isTauri(): boolean {
    return typeof window !== 'undefined' && typeof (window as any).__TAURI__ !== 'undefined';
}

function tauri(): TauriGlobal | null {
    return isTauri() ? (window as any).__TAURI__ : null;
}

const invoke = (cmd: string, args?: any) => tauri()!.core.invoke(cmd, args);

/** Absolute path of the document currently open on disk (for plain Save vs Save As). */
let currentPath: string | null = null;

// ── Recent files (localStorage-backed; surfaced in the native Open Recent submenu) ──
const RECENT_KEY = 'yappy.recentFiles';
type Recent = { path: string; name: string };

function getRecents(): Recent[] {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function pushRecent(path: string): void {
    const name = path.split(/[\\/]/).pop() || path;
    const next = [{ path, name }, ...getRecents().filter(r => r.path !== path)].slice(0, 10);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    void invoke('set_recent_files', { items: next }).catch(() => { /* ignore */ });
}

function docName(): string {
    return store.slides?.[0]?.name || 'Untitled';
}

async function saveDocument(saveAs: boolean): Promise<void> {
    if (!isTauri()) return;
    try {
        const doc = buildSlideDocument(docName());
        const bytes = await gzipString(JSON.stringify(doc));
        const path: string | null = await invoke('save_file', {
            defaultName: `${doc.metadata?.name || 'drawing'}.yappy`,
            data: Array.from(bytes),
            existingPath: saveAs ? null : currentPath,
        });
        if (path) { currentPath = path; pushRecent(path); showToast(`Saved ${path.split(/[\\/]/).pop()}`, 'success'); }
    } catch (e) {
        showToast(`Save failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    }
}

async function loadFromBytes(path: string, dataArr: number[]): Promise<void> {
    const doc = await decodeDocumentBytes(new Uint8Array(dataArr));
    loadDocument(doc);
    currentPath = path;
    pushRecent(path);
    showToast(`Opened ${path.split(/[\\/]/).pop()}`, 'success');
}

async function openDocument(): Promise<void> {
    if (!isTauri()) return;
    try {
        const res: [string, number[]] | null = await invoke('open_file');
        if (res) await loadFromBytes(res[0], res[1]);
    } catch (e) {
        showToast(`Open failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    }
}

/** Open a known path (recent file / launch file / file association) without a dialog. */
async function openPath(path: string): Promise<void> {
    if (!isTauri() || !path) return;
    try {
        const bytes: number[] = await invoke('read_file', { path });
        await loadFromBytes(path, bytes);
    } catch (e) {
        showToast(`Open failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    }
}

async function checkForUpdates(interactive = true): Promise<void> {
    if (!isTauri()) return;
    try {
        const version: string | null = await invoke('check_update');
        if (!version) { if (interactive) showToast('You’re on the latest version', 'info'); return; }
        const ok = window.confirm(`Yappy ${version} is available. Download and install now? The app will restart.`);
        if (ok) { showToast(`Updating to ${version}…`, 'loading', 0); await invoke('install_update'); }
    } catch (e) {
        if (interactive) showToast(`Update check failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    }
}

const MENU_ACTIONS: Record<string, () => void> = {
    new: () => { currentPath = null; resetToNewDocument('slides'); },
    open: () => { void openDocument(); },
    save: () => { void saveDocument(false); },
    saveAs: () => { void saveDocument(true); },
    exportPng: () => { void exportToPng(2, true, false); },
    exportSvg: () => { void exportToSvg(false); },
    undo: () => undo(),
    redo: () => redo(),
    resetView: () => zoomToFit(),
    togglePanel: () => togglePropertyPanel(),
    checkUpdate: () => { void checkForUpdates(true); },
};

let initialized = false;

/** Initialize the desktop bridge (no-op on web). Safe to call once at app mount. */
export function initDesktop(): void {
    if (initialized || !isTauri()) return;
    initialized = true;
    const t = tauri()!;

    t.event.listen('menu-action', (e) => { MENU_ACTIONS[String(e.payload)]?.(); }).catch(() => { /* ignore */ });
    // A `.yappy` opened via double-click / file association / second instance.
    t.event.listen('open-path', (e) => { void openPath(String(e.payload)); }).catch(() => { /* ignore */ });

    // Seed the native Open Recent submenu, then open a launch file (if any).
    const recents = getRecents();
    if (recents.length) void invoke('set_recent_files', { items: recents }).catch(() => { /* ignore */ });
    void invoke('get_launch_file').then((p: string | null) => { if (p) void openPath(p); }).catch(() => { /* ignore */ });

    try { document.documentElement.setAttribute('data-desktop', 'tauri'); } catch { /* ignore */ }
}
