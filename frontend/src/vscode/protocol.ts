/**
 * Messages between the VS Code extension (`vscode/src/`) and the editor running in its webview
 * (`vscode-bridge.ts`). Both sides import this file, so a renamed field is a compile error on
 * both ends rather than a message one side silently ignores.
 *
 * File bytes travel as plain `number[]`: webview `postMessage` uses structured clone, but older
 * VS Code builds serialised messages as JSON, where a `Uint8Array` turns into an object with
 * numeric keys. An array survives both.
 */

export type ThemeKind = 'light' | 'dark';

/** Extension → webview. */
export type HostMessage =
    /** Load this document. `bytes` empty = a new, empty drawing. */
    | { type: 'load'; bytes: number[]; fileName: string; theme: ThemeKind }
    /** Snapshot the document and answer with `bytes` carrying the same `requestId`. */
    | { type: 'getBytes'; requestId: number }
    | { type: 'theme'; theme: ThemeKind }
    /** Answer to `saveFile`: false when the user cancelled the Save dialog or the write failed. */
    | { type: 'saveFileResult'; requestId: number; saved: boolean };

/** Webview → extension. */
export type WebviewMessage =
    /** The editor has mounted and is listening; the host answers with `load`. */
    | { type: 'ready' }
    /** The document changed since the last `load` (marks the tab dirty). */
    | { type: 'edit' }
    | { type: 'bytes'; requestId: number; bytes: number[] }
    | { type: 'bytesError'; requestId: number; message: string }
    /** Loading failed; the host shows it as a VS Code error. */
    | { type: 'loadError'; message: string }
    /** Open a link in the user's browser. Only http(s) URLs are honoured. */
    | { type: 'openExternal'; url: string }
    /**
     * An export (PNG, SVG, PDF, …). A webview cannot download, so the host shows VS Code's
     * Save dialog, next to the open drawing, and writes the file.
     */
    | { type: 'saveFile'; requestId: number; name: string; bytes: number[]; filters: Record<string, string[]> };
