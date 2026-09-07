/**
 * Saving a file the way a desktop app does: ask for the name and the folder.
 *
 * Every save and export in the app used to be an `<a download>` with a name baked into the
 * source — `yappy_drawing.png`, `yappy_drawing.jpg`, `yappy_drawing.svg` — so the file landed
 * in the browser's Downloads folder under a name the user never chose, and a second export
 * silently became `yappy_drawing (1).png`. Naming and filing every export by hand afterwards is
 * exactly the friction Anshika reported in Sep 2026 ("Yappy draw should prompt to rename the
 * file and ask for the location to save the file").
 *
 * `showSaveFilePicker` (File System Access API) gives the real thing — a native Save dialog with
 * an editable name and a folder — in Chrome, Edge and the desktop build. Everywhere else
 * (Firefox, Safari) we fall back to the anchor download, which is exactly what happened before,
 * so nothing regresses on those browsers.
 */

type SaveOpts = {
    /** Human label for the file kind, shown in the picker's type dropdown. */
    description: string;
    /** MIME type → extension(s), e.g. { 'image/png': ['.png'] }. */
    accept: Record<string, string[]>;
};

const canPick = (): boolean =>
    typeof window !== 'undefined' && typeof (window as any).showSaveFilePicker === 'function';

/** The anchor-download path — the only option on Firefox/Safari, and the fallback everywhere. */
const anchorDownload = (blob: Blob, suggestedName: string): void => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = suggestedName;
    link.href = url;
    link.click();
    // Revoke on the next tick: revoking synchronously can beat the download starting.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

/**
 * Save `blob`, prompting for a name and location where the browser supports it.
 *
 * Returns true if the file was written or the download started, false if the user cancelled.
 * A cancelled picker is a normal outcome, not an error — it must NOT fall through to a silent
 * download, or "Cancel" would still drop a file in Downloads.
 */
export const saveBlob = async (blob: Blob, suggestedName: string, opts: SaveOpts): Promise<boolean> => {
    if (canPick()) {
        try {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName,
                types: [{ description: opts.description, accept: opts.accept }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return true;
        } catch (err: any) {
            // The user closed the dialog — respect that and write nothing.
            if (err?.name === 'AbortError') return false;
            // Anything else (a sandboxed iframe, a permissions policy, a cross-origin context)
            // means the picker is unusable here rather than unwanted: fall back to the download.
        }
    }
    anchorDownload(blob, suggestedName);
    return true;
};

/** `saveBlob` for something already rendered to a canvas. */
export const saveCanvas = async (
    canvas: HTMLCanvasElement,
    suggestedName: string,
    mime: 'image/png' | 'image/jpeg',
    quality?: number,
): Promise<boolean> => {
    const blob: Blob | null = await new Promise(res => canvas.toBlob(res, mime, quality));
    if (!blob) return false;
    const ext = mime === 'image/png' ? '.png' : '.jpg';
    return saveBlob(blob, suggestedName, {
        description: mime === 'image/png' ? 'PNG image' : 'JPEG image',
        accept: { [mime]: [ext] },
    });
};
