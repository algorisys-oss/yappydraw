/**
 * Doodle dialog — pick a generator, turn its knobs, reroll, paint it.
 *
 * **It edits the real doodle live**, unlike the Mandala dialog's SVG preview. The Mandala
 * overlay exists because a mandala is a hundred elements and regenerating them per slider
 * tick would flood history; a doodle is at most five elements (one per colour role) and
 * `updateDoodle` rewrites them in place. So the preview IS the result, in the real render
 * style — sketch wobble included — and there is no preview/result mismatch to explain.
 *
 * History: the dialog owns exactly one undo snapshot. Opening "new" creates the doodle
 * (createDoodle pushes it); opening "edit" pushes it on the first change. Every live
 * update after that runs under `withoutHistory`. Cancel takes that snapshot back with
 * `discardLastSnapshot` — but only if it is still on top; if anything else was pushed while
 * the dialog was open (it is non-modal), undoing would revert the wrong thing, so Cancel
 * restores the doodle directly instead.
 */
import { createSignal, createMemo, Show, For, batch, onCleanup, untrack } from 'solid-js';
import { store, pushToHistory, withoutHistory, discardLastSnapshot, deleteElements } from '../store/app-store';
import { showToast } from './toast';
import { YappyAPI, doodleKeyOf } from '../api';
import {
    DOODLE_GENERATORS, getDoodleGenerator, defaultDoodleParams, resolveDoodleParams, buildDoodle,
    randomDoodleSeed, DEFAULT_DOODLE_PALETTE, type DoodleKind, type DoodleParams, type DoodleParamDef, type DoodleLayer,
} from '../utils/doodles';
import { subpathsToPathData } from '../utils/math/path-utils';
import type { DoodlePalette } from '../types';
import { windowToWorld, canvasOrigin, canvasSize } from '../utils/overlay-transform';
import { onEscapeKey } from '../utils/use-escape';
import { t } from '../i18n';

interface Settings {
    kind: DoodleKind;
    seed: number;
    params: DoodleParams;
    palette: DoodlePalette;
    lineWeight: number;
    colouring: boolean;
}

/** Colour presets. Paper 'transparent' means the doodle sits straight on the canvas. */
export const DOODLE_PALETTES: { name: string; palette: DoodlePalette }[] = [
    { name: 'Ink & coral', palette: DEFAULT_DOODLE_PALETTE },
    { name: 'Harbour', palette: { paper: '#eef6f8', ink: '#0b3954', fill1: '#087e8b', fill2: '#bfd7ea' } },
    { name: 'Moss', palette: { paper: '#f3f1e7', ink: '#2d3a2e', fill1: '#6b8f4e', fill2: '#d9b44a' } },
    { name: 'Clay', palette: { paper: '#f6ede3', ink: '#5b3a29', fill1: '#c8553d', fill2: '#f0b67f' } },
    { name: 'Midnight', palette: { paper: '#1b1b2f', ink: '#e8e8f0', fill1: '#e43f6f', fill2: '#f6c90e' } },
    { name: 'Pencil', palette: { paper: 'transparent', ink: '#111111', fill1: '#9ca3af', fill2: '#e5e7eb' } },
];

const freshSettings = (kind: DoodleKind = 'truchet'): Settings => ({
    kind, seed: randomDoodleSeed(), params: defaultDoodleParams(kind),
    palette: { ...DEFAULT_DOODLE_PALETTE }, lineWeight: 1.5, colouring: false,
});

const [isOpen, setIsOpen] = createSignal(false);
const [doodleId, setDoodleId] = createSignal<string | null>(null);
const [settings, setSettings] = createSignal<Settings>(freshSettings());
const [variationNonce, setVariationNonce] = createSignal(0);

/** Per-open bookkeeping for Cancel (see the header comment). */
let session = { created: false, touched: false, baseline: 0, original: null as Settings | null };
/** The last doodle's settings, so "new" starts where you left off (with a new seed). */
let lastUsed: Settings | null = null;

export const doodleDialogOpen = isOpen;

/** A member id of the doodle the whole selection belongs to, or null if it is anything else. */
export function selectedDoodleId(): string | null {
    const sel = store.selection;
    if (!sel.length) return null;
    let key: string | null = null;
    for (const sid of sel) {
        const el = store.elements.find(e => e.id === sid);
        const k = el ? doodleKeyOf(el) : null;
        if (!k || (key && k !== key)) return null;
        key = k;
    }
    return sel[0];
}

/** A page-shaped region (A-series portrait) centred in the visible drawing area. */
function defaultRegion() {
    const o = canvasOrigin(), s = canvasSize();
    const c = windowToWorld(o.x + s.w / 2, o.y + s.h / 2);
    const scale = store.viewState.scale || 1;
    let h = (s.h * 0.75) / scale;
    let w = h / Math.SQRT2;
    const maxW = (s.w * 0.6) / scale;
    if (w > maxW) { w = maxW; h = w * Math.SQRT2; }
    return { x: c.x - w / 2, y: c.y - h / 2, width: w, height: h };
}

/**
 * Open the dialog. With a doodle (or member) id it edits that doodle; without, it makes a
 * new one in the middle of the view and edits that.
 */
export function openDoodleDialog(editId?: string) {
    if (isOpen()) closeDialog(true);
    if (editId) {
        const d = YappyAPI.getDoodle(editId);
        if (!d) return;
        const s: Settings = {
            kind: d.spec.kind, seed: d.spec.seed, params: d.spec.params,
            palette: d.palette, lineWeight: d.lineWeight, colouring: d.colouring,
        };
        session = { created: false, touched: false, baseline: 0, original: s };
        batch(() => { setSettings(s); setDoodleId(d.id); setIsOpen(true); });
        return;
    }
    const s = lastUsed ? { ...lastUsed, seed: randomDoodleSeed() } : freshSettings();
    const r = defaultRegion();
    const id = YappyAPI.createDoodle(s.kind, r.x, r.y, r.width, r.height, s);
    if (!id) { showToast(t('doodle.tooSmall'), 'info'); return; }
    session = { created: true, touched: false, baseline: store.undoStackLength, original: null };
    batch(() => { setSettings(s); setDoodleId(id); setIsOpen(true); });
}

let frame = 0;
/** Push the current settings into the doodle, at most once per animation frame. */
function scheduleApply() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
        frame = 0;
        const id = doodleId();
        if (!id || !isOpen()) return;
        if (!YappyAPI.getDoodle(id)) { setIsOpen(false); return; }   // deleted under us
        if (!session.created && !session.touched) {
            pushToHistory();
            session.touched = true;
            session.baseline = store.undoStackLength;
        }
        applySettings(id);
    });
}

/** Rebuild the doodle from the dialog's settings. A rebuild replaces its elements, so
 *  keep tracking whichever member id comes back. */
function applySettings(id: string) {
    const next = withoutHistory(() => YappyAPI.updateDoodle(id, settings()));
    if (next) setDoodleId(next);
}

function change(patch: Partial<Settings>) {
    setSettings(s => ({ ...s, ...patch }));
    scheduleApply();
}

function flushPending() {
    if (!frame) return;
    cancelAnimationFrame(frame);
    frame = 0;
    const id = doodleId();
    if (id && YappyAPI.getDoodle(id)) {
        if (!session.created && !session.touched) { pushToHistory(); session.touched = true; session.baseline = store.undoStackLength; }
        applySettings(id);
    }
}

/** Close, keeping (`keep`) or reverting what the dialog did. */
function closeDialog(keep: boolean) {
    const id = doodleId();
    if (keep) {
        flushPending();
        lastUsed = settings();
    } else {
        if (frame) { cancelAnimationFrame(frame); frame = 0; }
        if (id && (session.created || session.touched)) {
            if (store.undoStackLength === session.baseline) {
                discardLastSnapshot();
            } else if (session.created) {
                const d = YappyAPI.getDoodle(id);
                if (d) withoutHistory(() => deleteElements(d.elementIds));
            } else if (session.original) {
                withoutHistory(() => YappyAPI.updateDoodle(id, session.original!));
            }
        }
    }
    batch(() => { setIsOpen(false); setDoodleId(null); });
}

/** Six nearby designs: same generator, new seeds, each range knob nudged. */
function makeVariations(base: Settings, n = 6): Settings[] {
    const gen = getDoodleGenerator(base.kind);
    if (!gen) return [];
    return Array.from({ length: n }, () => {
        const p: Partial<DoodleParams> = { ...base.params };
        for (const def of gen.params) {
            if (def.type !== 'range') continue;
            const span = def.max - def.min;
            p[def.key] = (base.params[def.key] as number) + (Math.random() - 0.5) * span * 0.35;
        }
        return { ...base, seed: randomDoodleSeed(), params: resolveDoodleParams(gen, p) };
    });
}

const thumbPaint = (role: DoodleLayer['role'], pal: DoodlePalette) => {
    switch (role) {
        case 'paper': return { fill: pal.paper, stroke: 'none', w: 0 };
        case 'fill1': return { fill: pal.fill1, stroke: 'none', w: 0 };
        case 'fill2': return { fill: pal.fill2, stroke: 'none', w: 0 };
        case 'ink': return { fill: 'none', stroke: pal.ink, w: 0.6 };
        case 'inkBold': return { fill: 'none', stroke: pal.ink, w: 1.2 };
    }
};

export const DoodleDialog = () => {
    onEscapeKey(isOpen, () => closeDialog(false));
    onCleanup(() => { if (frame) cancelAnimationFrame(frame); });

    const gen = createMemo(() => getDoodleGenerator(settings().kind));

    /** Variation thumbnails — rebuilt on open, kind change or "More", not on every tick. */
    const kind = createMemo(() => settings().kind);
    const variations = createMemo(() => {
        variationNonce();
        const id = doodleId();
        kind();   // switching generator refreshes the strip; nothing else should
        if (!isOpen() || !id) return [];
        // Untracked: reading the settings or the store here would rebuild six doodles on
        // every slider tick, which is exactly the lag this strip must not add.
        return untrack(() => {
        const d = YappyAPI.getDoodle(id);
        if (!d) return [];
        const base = settings();
        const { x, y, width, height } = d.spec;
        return makeVariations(base).map(v => {
            let layers = buildDoodle({ kind: v.kind, seed: v.seed, params: v.params, x, y, width, height });
            if (v.colouring) layers = layers.filter(l => l.role !== 'fill1' && l.role !== 'fill2');
            return { settings: v, layers, box: { x, y, width, height } };
        });
        });
    }, undefined, { equals: false });

    const pickKind = (kind: DoodleKind) => {
        if (kind === settings().kind) return;
        change({ kind, params: defaultDoodleParams(kind) });
    };
    const setParam = (key: string, value: number | string | boolean) =>
        change({ params: { ...settings().params, [key]: value } });

    const label = { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: '8px', 'font-size': '12px' } as const;
    const btn = { padding: '5px 9px', 'border-radius': '6px', cursor: 'pointer', 'font-size': '11px', border: '1px solid var(--border-color,#d1d5db)', background: 'transparent', color: 'inherit' } as const;
    const on = { background: 'var(--accent,#3b82f6)', color: '#fff', border: '1px solid var(--accent,#3b82f6)' } as const;
    const section = { 'font-size': '11px', 'font-weight': 600, 'text-transform': 'uppercase', 'letter-spacing': '0.04em', opacity: 0.6, 'margin-top': '4px' } as const;

    const Knob = (props: { def: DoodleParamDef }) => {
        const v = () => settings().params[props.def.key];
        const def = props.def;
        if (def.type === 'range') {
            return (
                <label style={label} title={def.hint}>{def.label}
                    <input type="range" min={def.min} max={def.max} step={def.step} value={v() as number}
                        data-doodle-param={def.key}
                        onInput={(e) => setParam(def.key, parseFloat(e.currentTarget.value))} />
                    <span style={{ 'min-width': '34px', 'text-align': 'right' }}>{v() as number}</span>
                </label>
            );
        }
        if (def.type === 'choice') {
            return (
                <div style={label} title={def.hint}>{def.label}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <For each={def.options}>{(o) => (
                            <button style={{ ...btn, ...(v() === o.value ? on : {}) }} data-doodle-param={def.key}
                                onClick={() => setParam(def.key, o.value)}>{o.label}</button>
                        )}</For>
                    </div>
                </div>
            );
        }
        return (
            <label style={label} title={def.hint}>{def.label}
                <input type="checkbox" checked={v() as boolean} data-doodle-param={def.key}
                    onChange={(e) => setParam(def.key, e.currentTarget.checked)} />
            </label>
        );
    };

    const ColourField = (props: { role: keyof DoodlePalette; name: string }) => {
        const value = () => settings().palette[props.role];
        const none = () => value() === 'transparent';
        return (
            <label style={{ ...label, 'justify-content': 'flex-start' }}>
                <input type="color" value={none() ? '#ffffff' : value()} disabled={none()}
                    data-doodle-colour={props.role}
                    onInput={(e) => change({ palette: { ...settings().palette, [props.role]: e.currentTarget.value } })}
                    style={{ width: '28px', height: '22px', padding: '0', border: 'none', background: 'none', opacity: none() ? 0.35 : 1 }} />
                <span>{props.name}</span>
                <Show when={props.role === 'paper'}>
                    <span style={{ 'margin-left': 'auto', display: 'flex', gap: '4px', 'align-items': 'center', opacity: 0.8 }}>
                        <input type="checkbox" checked={!none()}
                            onChange={(e) => change({ palette: { ...settings().palette, paper: e.currentTarget.checked ? '#fbf8f1' : 'transparent' } })} />
                        {t('doodle.showPaper')}
                    </span>
                </Show>
            </label>
        );
    };

    return (
        <Show when={isOpen()}>
            <div style={{
                position: 'fixed', top: '0', right: '0', bottom: '0', display: 'flex', 'align-items': 'center',
                'z-index': 20000, padding: '20px', 'pointer-events': 'none',
            }}>
                <div class="doodle-dialog" style={{
                    width: '340px', 'max-height': '92vh', 'overflow-y': 'auto', 'pointer-events': 'auto',
                    background: 'var(--bg-panel, #fff)', color: 'var(--text-primary, #1f2937)',
                    'border-radius': '12px', padding: '16px', 'box-shadow': '0 12px 40px rgba(0,0,0,0.28)',
                    display: 'flex', 'flex-direction': 'column', gap: '10px',
                }}>
                    <div style={{ 'font-weight': 600, 'font-size': '15px' }}>{t('doodle.title')}</div>
                    <div style={{ 'font-size': '11px', opacity: 0.7, 'margin-top': '-6px' }}>
                        {t('doodle.hint')}
                    </div>

                    <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '5px' }}>
                        <For each={DOODLE_GENERATORS}>{(g) => (
                            <button title={g.hint} data-doodle-kind={g.id}
                                style={{ ...btn, ...(settings().kind === g.id ? on : {}) }}
                                onClick={() => pickKind(g.id)}>{g.name}</button>
                        )}</For>
                    </div>

                    <div style={section}>{t('doodle.pattern')}</div>
                    <For each={gen()?.params ?? []}>{(def) => <Knob def={def} />}</For>

                    <div style={label} title={t('doodle.seedHint')}>
                        {t('doodle.seed')}
                        <div style={{ display: 'flex', gap: '5px', 'align-items': 'center' }}>
                            <input type="number" min="1" value={settings().seed} data-doodle-seed
                                onChange={(e) => { const n = parseInt(e.currentTarget.value, 10); if (n > 0) change({ seed: n }); }}
                                style={{ width: '84px', padding: '3px 5px', 'border-radius': '5px', border: '1px solid var(--border-color,#d1d5db)', background: 'var(--bg-secondary,#fff)', color: 'inherit', 'font-size': '12px' }} />
                            <button style={btn} data-doodle-reroll title={t('doodle.rerollHint')}
                                onClick={() => change({ seed: randomDoodleSeed() })}>{t('doodle.reroll')}</button>
                        </div>
                    </div>

                    <div style={{ ...label, ...section }}>
                        {t('doodle.variations')}
                        <button style={{ ...btn, 'text-transform': 'none', 'font-weight': 400, 'letter-spacing': 0 }}
                            onClick={() => setVariationNonce(n => n + 1)}>{t('doodle.more')}</button>
                    </div>
                    <div style={{ display: 'grid', 'grid-template-columns': 'repeat(3, 1fr)', gap: '6px' }}>
                        <For each={variations()}>{(v) => (
                            <button class="doodle-variation" title={t('doodle.useVariation')}
                                onClick={() => change({ seed: v.settings.seed, params: v.settings.params })}
                                style={{ padding: '0', border: '1px solid var(--border-color,#e5e7eb)', 'border-radius': '6px', background: 'transparent', cursor: 'pointer', overflow: 'hidden', 'aspect-ratio': `${v.box.width} / ${v.box.height}` }}>
                                <svg viewBox={`${v.box.x} ${v.box.y} ${v.box.width} ${v.box.height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                                    <Show when={settings().palette.paper !== 'transparent'}>
                                        <rect x={v.box.x} y={v.box.y} width={v.box.width} height={v.box.height} fill={settings().palette.paper} />
                                    </Show>
                                    <For each={v.layers}>{(l) => {
                                        const p = thumbPaint(l.role, settings().palette);
                                        return <path d={subpathsToPathData(l.subpaths)} fill={p.fill} stroke={p.stroke}
                                            stroke-width={p.w} vector-effect="non-scaling-stroke" fill-rule="evenodd" />;
                                    }}</For>
                                </svg>
                            </button>
                        )}</For>
                    </div>

                    <div style={section}>{t('doodle.colour')}</div>
                    <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '5px' }}>
                        <For each={DOODLE_PALETTES}>{(p) => (
                            <button title={p.name} data-doodle-palette={p.name}
                                onClick={() => change({ palette: { ...p.palette } })}
                                style={{ ...btn, padding: '3px', display: 'flex', gap: '0' }}>
                                <For each={[p.palette.paper, p.palette.ink, p.palette.fill1, p.palette.fill2]}>{(c) => (
                                    <span style={{
                                        width: '11px', height: '16px',
                                        background: c === 'transparent' ? 'repeating-linear-gradient(45deg,#ddd 0 3px,#fff 3px 6px)' : c,
                                    }} />
                                )}</For>
                            </button>
                        )}</For>
                    </div>
                    <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '6px' }}>
                        <ColourField role="paper" name={t('doodle.paper')} />
                        <ColourField role="ink" name={t('doodle.ink')} />
                        <ColourField role="fill1" name={t('doodle.fill1')} />
                        <ColourField role="fill2" name={t('doodle.fill2')} />
                    </div>
                    <label style={label}>{t('doodle.lineWeight')}
                        <input type="range" min="0.5" max="6" step="0.25" value={settings().lineWeight}
                            onInput={(e) => change({ lineWeight: parseFloat(e.currentTarget.value) })} />
                        <span style={{ 'min-width': '34px', 'text-align': 'right' }}>{settings().lineWeight}</span>
                    </label>
                    <label style={label} title={t('doodle.lineArtHint')}>
                        {t('doodle.lineArt')}
                        <input type="checkbox" checked={settings().colouring} data-doodle-colouring
                            onChange={(e) => change({ colouring: e.currentTarget.checked })} />
                    </label>

                    <div style={{ display: 'flex', 'justify-content': 'flex-end', gap: '8px', 'margin-top': '4px' }}>
                        <button onClick={() => closeDialog(false)} style={{ ...btn, padding: '6px 14px' }}>{t('doodle.cancel')}</button>
                        <button onClick={() => closeDialog(true)} data-doodle-done
                            style={{ padding: '6px 14px', 'border-radius': '6px', border: 'none', background: 'var(--accent,#3b82f6)', color: '#fff', cursor: 'pointer' }}>{t('doodle.done')}</button>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default DoodleDialog;
