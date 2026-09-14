/**
 * Menu → File → Import tinyfly animation…: pick a tinyfly timeline JSON and attach it
 * to the document through `Yappy.tinyfly.add`, reporting what it did in a toast.
 *
 * Goes through `window.Yappy` (as other menu actions do) rather than importing api.ts,
 * which would pull the whole API into the menu's module graph.
 */
import { showToast } from '../components/toast';
import { t } from '../i18n';

type AddResult = { id: string; bound: number; unbound: string[]; unsupported: string[]; duration: number };

export async function importTinyflyText(text: string): Promise<AddResult | null> {
    const Y = (window as any).Yappy;
    try {
        // The clip takes the animation's own name (or id) from the JSON, not the file name.
        const r: AddResult = await Y.tinyfly.add(text, { requireMatch: true });
        if (r.bound === 0) {
            showToast(t('tinyfly.nothingBound', { names: r.unbound.join(', ') }), 'error', 8000);
            return null;
        }
        const notes: string[] = [];
        if (r.unbound.length) notes.push(t('tinyfly.unbound', { names: r.unbound.join(', ') }));
        if (r.unsupported.length) notes.push(t('tinyfly.unsupported', { names: r.unsupported.join(', ') }));
        showToast([t('tinyfly.imported', { count: r.bound }), ...notes].join(' '), notes.length ? 'info' : 'success', notes.length ? 8000 : 4000);
        // Open the Scene Timeline so the clip can be played and scrubbed straight away.
        Y.toggleSceneTimeline(true);
        return r;
    } catch (err: any) {
        showToast(t('tinyfly.failed', { message: String(err?.message ?? err) }), 'error', 8000);
        return null;
    }
}

export function pickTinyflyFile(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async () => {
        const file = input.files?.[0];
        if (file) await importTinyflyText(await file.text());
    };
    input.click();
}
