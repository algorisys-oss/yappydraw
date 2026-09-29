import { type Component, Show, For, createSignal, createEffect, on, onCleanup, untrack } from "solid-js";
import { Portal } from "solid-js/web";
import { X, Shuffle } from "lucide-solid";
import { store, applyDistort, applyScribble, previewEffect, endEffectPreview, beginEffectPreview, closeDistortDialog } from "../store/app-store";
import { defaultDistortParams, type DistortKind, type DistortParams } from "../utils/path-distort";
import { t } from "../i18n";
import "./effect-dialog.css";

/** The dialog's effect list. Pucker and Bloat are one effect with a signed amount, as in Illustrator. */
type EffectId = 'puckerBloat' | 'twirl' | 'zigzag' | 'roughen' | 'crystallize' | 'scribble';
const EFFECTS: EffectId[] = ['puckerBloat', 'twirl', 'zigzag', 'roughen', 'crystallize', 'scribble'];

const toEffectId = (k: DistortKind | 'scribble'): EffectId => (k === 'pucker' || k === 'bloat') ? 'puckerBloat' : k;

type SliderKey = 'amount' | 'angle' | 'size' | 'ridges' | 'detail' | 'spacing' | 'scribbleAngle' | 'lineWidth';
interface SliderSpec { key: SliderKey; min: number; max: number; step: number; unit: string }

const SLIDERS: Record<EffectId, SliderSpec[]> = {
    puckerBloat: [{ key: 'amount', min: -100, max: 100, step: 1, unit: '%' }],
    twirl: [{ key: 'angle', min: -720, max: 720, step: 1, unit: '°' }],
    zigzag: [{ key: 'size', min: 0, max: 200, step: 0.5, unit: 'px' }, { key: 'ridges', min: 1, max: 50, step: 1, unit: '' }],
    roughen: [{ key: 'size', min: 0, max: 100, step: 0.5, unit: 'px' }, { key: 'detail', min: 1, max: 60, step: 1, unit: '/100px' }],
    crystallize: [{ key: 'size', min: 0, max: 200, step: 0.5, unit: 'px' }, { key: 'detail', min: 1, max: 40, step: 1, unit: '/100px' }],
    scribble: [{ key: 'spacing', min: 2, max: 60, step: 1, unit: 'px' }, { key: 'scribbleAngle', min: -90, max: 90, step: 1, unit: '°' }, { key: 'lineWidth', min: 0.5, max: 12, step: 0.5, unit: 'px' }],
};

type Values = Record<string, number | string>;

/**
 * Effect dialog — Distort & Transform (Pucker & Bloat, Twirl, Zig-Zag, Roughen, Crystallize) and
 * Scribble, with Illustrator's parameters and a live preview on the real shapes.
 *
 * Floats beside the canvas so the preview is visible, over a transparent backdrop that blocks
 * other edits while it is open: the preview restores a snapshot before every update, and anything
 * edited meanwhile would be restored away. OK = one undo step; Cancel / Esc leaves no trace.
 */
const EffectDialog: Component = () => {
    const target = () => store.effectDialog;
    const [effect, setEffect] = createSignal('twirl' as EffectId);
    const [values, setValues] = createSignal({} as Values);
    const [preview, setPreview] = createSignal(true);

    /** Largest selected shape's diagonal — sizes the defaults so the first look is sensible. */
    const diag = () => {
        const ids = target()?.ids ?? [];
        let d = 0;
        for (const e of store.elements) if (ids.includes(e.id)) d = Math.max(d, Math.hypot(e.width, e.height));
        return d || 200;
    };
    const defaultsFor = (id: EffectId): Values => {
        if (id === 'scribble') return { spacing: 8, scribbleAngle: 0, lineWidth: 2 };
        const p = defaultDistortParams(id === 'puckerBloat' ? 'bloat' : id, untrack(diag));
        return { ...p } as unknown as Values;
    };

    // Opening: pick the effect it was opened for, start a preview session.
    createEffect(on(() => target(), (tg, prev) => {
        if (tg && !prev) {
            const id = toEffectId(tg.kind);
            setEffect(id);
            const v = defaultsFor(id);
            if (tg.kind === 'pucker') v.amount = -Math.abs(Number(v.amount));
            setValues(v);
            beginEffectPreview();
        }
    }));

    const run = (preview: boolean) => {
        const tg = target(); if (!tg) return;
        const id = effect(), v = values();
        if (id === 'scribble') {
            applyScribble(tg.ids, { spacing: Number(v.spacing), angle: Number(v.scribbleAngle), strokeWidth: Number(v.lineWidth), preview });
            return;
        }
        const kind: DistortKind = id === 'puckerBloat' ? (Number(v.amount) < 0 ? 'pucker' : 'bloat') : id;
        const params: DistortParams = {
            amount: Number(v.amount), angle: Number(v.angle), size: Number(v.size), ridges: Number(v.ridges),
            detail: Number(v.detail), seed: Number(v.seed), points: v.points === 'smooth' ? 'smooth' : 'corner',
        };
        applyDistort(tg.ids, kind, params, { preview });
    };

    // Live preview, coalesced to one per frame while a slider is dragged.
    let raf = 0;
    createEffect(() => {
        if (!target()) return;
        effect(); values(); const on = preview();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
            if (!target()) return;
            if (on) previewEffect(() => run(true)); else previewEffect(() => { });
        });
    });
    onCleanup(() => cancelAnimationFrame(raf));

    const finish = (ok: boolean) => {
        cancelAnimationFrame(raf);
        endEffectPreview(ok ? () => run(false) : undefined);
        closeDistortDialog();
    };

    const onKey = (e: KeyboardEvent) => {
        if (!target()) return;
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(false); }
        else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); e.stopPropagation(); finish(true); }
    };
    createEffect(() => {
        if (!target()) return;
        window.addEventListener('keydown', onKey, true);
        onCleanup(() => window.removeEventListener('keydown', onKey, true));
    });

    const set = (key: string, v: number | string) => setValues({ ...values(), [key]: v });
    const switchEffect = (id: EffectId) => { setEffect(id); setValues(defaultsFor(id)); };
    const hasPoints = () => effect() !== 'scribble';
    const hasSeed = () => effect() === 'roughen' || effect() === 'crystallize';

    return (
        <Show when={target()}>
            <Portal>
                <div class="efd-backdrop" data-testid="effect-dialog-backdrop" />
                <div class="efd-panel" role="dialog" aria-label={t('effectDialog.title')} data-testid="effect-dialog">
                    <div class="efd-header">
                        <h2>{t('effectDialog.title')}</h2>
                        <button class="efd-close" type="button" onClick={() => finish(false)} aria-label={t('effectDialog.cancel')}><X size={16} /></button>
                    </div>
                    <div class="efd-body">
                        <label class="efd-row">
                            <span>{t('effectDialog.effect')}</span>
                            <select value={effect()} data-testid="effect-dialog-kind" onChange={(e) => switchEffect(e.currentTarget.value as EffectId)}>
                                <For each={EFFECTS}>{(id) => <option value={id}>{t(`effectDialog.kind.${id}`)}</option>}</For>
                            </select>
                        </label>
                        <For each={SLIDERS[effect()]}>{(sp) => (
                            <label class="efd-row">
                                <span>{t(`effectDialog.param.${sp.key}`)}</span>
                                <div class="efd-slider">
                                    <input type="range" min={sp.min} max={sp.max} step={sp.step} value={Number(values()[sp.key] ?? 0)}
                                        data-testid={`effect-dialog-${sp.key}`} onInput={(e) => set(sp.key, Number(e.currentTarget.value))} />
                                    <input type="number" min={sp.min} max={sp.max} step={sp.step} value={Number(values()[sp.key] ?? 0)}
                                        onInput={(e) => { const n = Number(e.currentTarget.value); if (Number.isFinite(n)) set(sp.key, n); }} />
                                    <span class="efd-unit">{sp.unit}</span>
                                </div>
                            </label>
                        )}</For>
                        <Show when={effect() === 'puckerBloat'}>
                            <p class="efd-note">{t('effectDialog.puckerBloatHint')}</p>
                        </Show>
                        <Show when={hasPoints()}>
                            <div class="efd-row">
                                <span>{t('effectDialog.points')}</span>
                                <div class="efd-seg" role="radiogroup">
                                    <button type="button" class={values().points === 'smooth' ? 'active' : ''} onClick={() => set('points', 'smooth')}>{t('effectDialog.smooth')}</button>
                                    <button type="button" class={values().points !== 'smooth' ? 'active' : ''} onClick={() => set('points', 'corner')}>{t('effectDialog.corner')}</button>
                                </div>
                            </div>
                        </Show>
                        <Show when={hasSeed()}>
                            <div class="efd-row">
                                <span />
                                <button type="button" class="efd-secondary" data-testid="effect-dialog-seed" onClick={() => set('seed', Number(values().seed ?? 1) + 1)}>
                                    <Shuffle size={13} /> {t('effectDialog.newVariation')}
                                </button>
                            </div>
                        </Show>
                        <label class="efd-check">
                            <input type="checkbox" checked={preview()} onChange={(e) => setPreview(e.currentTarget.checked)} />
                            {t('effectDialog.preview')}
                        </label>
                        <div class="efd-actions">
                            <button type="button" class="efd-secondary" onClick={() => finish(false)}>{t('effectDialog.cancel')}</button>
                            <button type="button" class="efd-primary" data-testid="effect-dialog-ok" onClick={() => finish(true)}>{t('effectDialog.ok')}</button>
                        </div>
                    </div>
                </div>
            </Portal>
        </Show>
    );
};

export default EffectDialog;
