/**
 * Menu → File → Import tinyfly animation…: pick a tinyfly JSON file and bring it in
 * through `Yappy.tinyfly.import`, reporting what it did in a toast. An Animation
 * Document or Project brings its own shapes; a timeline binds to shapes already here.
 *
 * Goes through `window.Yappy` (as other menu actions do) rather than importing api.ts,
 * which would pull the whole API into the menu's module graph.
 */
import { showToast } from '../components/toast';
import { t } from '../i18n';

type ImportResult = {
    id: string; bound: number; unbound: string[]; unsupported: string[]; duration: number;
    created: string[]; skipped: string[]; scenes: number;
};

export async function importTinyflyText(text: string): Promise<ImportResult | null> {
    const Y = (window as any).Yappy;
    try {
        // The clip takes the animation's own name (or id) from the JSON, not the file name.
        const r: ImportResult = await Y.tinyfly.import(text);
        if (r.created.length === 0 && r.bound === 0) {
            showToast(t('tinyfly.nothingBound', { names: r.unbound.join(', ') }), 'error', 10000);
            return null;
        }
        const notes: string[] = [];
        // Shapes the file brought are bound by construction, so only a timeline's misses matter.
        if (r.unbound.length && r.created.length === 0) notes.push(t('tinyfly.unbound', { names: r.unbound.join(', ') }));
        if (r.skipped.length) notes.push(t('tinyfly.skipped', { types: [...new Set(r.skipped)].join(', ') }));
        if (r.scenes > 1) notes.push(t('tinyfly.oneScene', { count: r.scenes }));
        if (r.unsupported.length) notes.push(t('tinyfly.unsupported', { names: r.unsupported.join(', ') }));
        const headline = r.created.length
            ? t('tinyfly.created', { name: Y.tinyfly.list().find((c: { id: string }) => c.id === r.id)?.name ?? '', count: r.created.length })
            : t('tinyfly.imported', { count: r.bound });
        showToast([headline, ...notes].join(' '), notes.length ? 'info' : 'success', notes.length ? 8000 : 4000);
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
