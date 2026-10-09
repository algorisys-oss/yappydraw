import { type Component, For, Show, createEffect, createMemo, createResource, createSignal, on, untrack } from 'solid-js';
import { store, setSwatchCmyk, setSwatchSpot } from '../store/app-store';
import { t } from '../i18n';
import type { Cmyk, Rgb } from '../utils/color-management';

/** An async action the editor runs with a busy state and error capture. */
interface AsyncTask { (): Promise<void> }

/** How far (sRGB distance) a colour may move on the way to ink before we call it out of gamut. */
const GAMUT_WARN = 18;

const CHANNELS = ['c', 'm', 'y', 'k'] as const;

/**
 * Print colour for one swatch: exact C/M/Y/K inks with a live preview of how they print, and an
 * optional spot-ink name (docs/cmyk-print-plan.md, P2).
 *
 * The colour engine (LittleCMS + a press profile, ~130 kB) loads when this opens, never before.
 * Sliders edit a draft; **Apply** writes it as one undo step (`setSwatchCmyk`), which also moves
 * the swatch's screen colour — and every linked object — to the printed preview.
 */
const SwatchPrintEditor: Component<{ swatchId: string; onClose: () => void }> = (props) => {
    const swatch = () => store.swatches.find(s => s.id === props.swatchId);
    const loadEngine = async () => (await import('../utils/color-management')).loadColorEngine();
    const [engine] = createResource(loadEngine);
    const [helpers] = createResource(() => import('../utils/color-management'));

    const [draft, setDraft] = createSignal([0, 0, 0, 0] as Cmyk);
    const [spotOn, setSpotOn] = createSignal(false);
    const [spotName, setSpotName] = createSignal('');
    const [busy, setBusy] = createSignal(false);
    const [error, setError] = createSignal('');

    const screenRgb = (): Rgb | null => {
        const h = helpers();
        const sw = swatch();
        return h && sw ? h.parseRgb(sw.color) : null;
    };

    // Start from the swatch's inks, or — for a screen-only colour — what the profile makes of it.
    // Keyed on the swatch id and the engine only: re-running on every store change would throw
    // away a draft the moment anything else in the document moved.
    createEffect(on(() => [props.swatchId, engine()] as const, ([, e]) => {
        const sw = untrack(swatch);
        if (!sw) return;
        setSpotOn(!!sw.spot);
        setSpotName(sw.spot?.name ?? '');
        if (sw.cmyk) setDraft([...sw.cmyk] as Cmyk);
        else if (e) { const rgb = untrack(screenRgb); if (rgb) setDraft(e.rgbToCmyk(rgb)); }
    }));

    const preview = createMemo(() => {
        const e = engine();
        const h = helpers();
        return e && h ? h.rgbToHex(e.cmykToRgb(draft())) : null;
    });

    /** For a swatch with no inks yet: does its screen colour survive printing? */
    const outOfGamut = createMemo(() => {
        const e = engine();
        const rgb = screenRgb();
        if (!e || !rgb || swatch()?.cmyk) return false;
        const p = e.proof(rgb);
        return Math.hypot(p[0] - rgb[0], p[1] - rgb[1], p[2] - rgb[2]) > GAMUT_WARN;
    });

    const setChannel = (i: number, v: number) => {
        const next = [...draft()] as Cmyk;
        next[i] = Math.min(100, Math.max(0, Number.isFinite(v) ? Math.round(v * 10) / 10 : 0));
        setDraft(next);
    };

    const run = async (fn: AsyncTask) => {
        setBusy(true);
        setError('');
        try { await fn(); } catch (err) { setError(err instanceof Error ? err.message : String(err)); } finally { setBusy(false); }
    };

    const apply = () => run(async () => {
        await setSwatchCmyk(props.swatchId, draft());
        const sw = swatch();
        const name = spotOn() ? spotName().trim() : '';
        if (spotOn() && !name) throw new Error(t('swatchPrint.spotNameRequired'));
        if ((sw?.spot?.name ?? '') !== name) await setSwatchSpot(props.swatchId, name || null);
        props.onClose();
    });

    const clear = () => run(async () => {
        await setSwatchCmyk(props.swatchId, null);
        props.onClose();
    });

    return (
        <Show when={swatch()}>
            {(sw) => (
                <div class="sw-print" role="group" aria-label={t('swatchPrint.title', { name: sw().name })}>
                    <div class="sw-print-head">
                        <span class="sw-print-title">{t('swatchPrint.title', { name: sw().name })}</span>
                        <button class="sw-act" title={t('swatchPrint.close')} aria-label={t('swatchPrint.close')} onClick={() => props.onClose()}>×</button>
                    </div>
                    <Show when={!engine.error} fallback={<div class="sw-print-note">{t('swatchPrint.engineFailed')}</div>}>
                        <Show when={engine()} fallback={<div class="sw-print-note">{t('swatchPrint.loading')}</div>}>
                            <div class="sw-print-compare">
                                <div class="sw-print-chip" style={{ background: sw().color }}><span>{t('swatchPrint.screen')}</span></div>
                                <div class="sw-print-chip" style={{ background: preview() ?? 'transparent' }}><span>{t('swatchPrint.print')}</span></div>
                            </div>
                            <Show when={outOfGamut()}>
                                <div class="sw-print-note sw-print-warn" role="note">{t('swatchPrint.outOfGamut')}</div>
                            </Show>
                            <For each={CHANNELS}>
                                {(ch, i) => (
                                    <label class="sw-print-row">
                                        <span class={`sw-print-ink sw-ink-${ch}`}>{ch.toUpperCase()}</span>
                                        <input type="range" min="0" max="100" step="0.5" value={draft()[i()]}
                                            aria-label={t(`swatchPrint.${ch}`)}
                                            onInput={(e) => setChannel(i(), parseFloat(e.currentTarget.value))} />
                                        <input type="number" class="sw-print-num" min="0" max="100" step="0.1" value={draft()[i()]}
                                            aria-label={t(`swatchPrint.${ch}`)}
                                            onChange={(e) => setChannel(i(), parseFloat(e.currentTarget.value))} />
                                        <span class="sw-print-pct">%</span>
                                    </label>
                                )}
                            </For>
                            <label class="sw-print-spot">
                                <input type="checkbox" checked={spotOn()} onChange={(e) => setSpotOn(e.currentTarget.checked)} />
                                {t('swatchPrint.spot')}
                            </label>
                            <Show when={spotOn()}>
                                <input class="sw-print-spot-name" placeholder={t('swatchPrint.spotPlaceholder')} value={spotName()}
                                    aria-label={t('swatchPrint.spotName')}
                                    onInput={(e) => setSpotName(e.currentTarget.value)} />
                                <div class="sw-print-note">{t('swatchPrint.spotHint')}</div>
                            </Show>
                            <Show when={error()}><div class="sw-print-note sw-print-warn" role="alert">{error()}</div></Show>
                            <div class="sw-print-actions">
                                <Show when={sw().cmyk}>
                                    <button class="sw-print-btn" disabled={busy()} onClick={clear}>{t('swatchPrint.clear')}</button>
                                </Show>
                                <button class="sw-print-btn sw-print-primary" disabled={busy()} onClick={apply}>{t('swatchPrint.apply')}</button>
                            </div>
                        </Show>
                    </Show>
                </div>
            )}
        </Show>
    );
};

export default SwatchPrintEditor;
