import { type Component, For, Show, createMemo, createEffect, createSignal, untrack, onMount, onCleanup } from 'solid-js';
import { store, setStore, toggleKeyframePanel, pushToHistory, updateElement } from '../store/app-store';
import { effectiveTime } from '../utils/animation/animation-engine';
import { evaluateCompositionAt } from '../utils/animation/composition-evaluator';
import type { PropertyTrack, TimedKeyframe, BezierEase } from '../types/motion-types';
import { Play, Pause, RotateCcw, Repeat, X, KeyRound, Diamond, Trash2, Crosshair } from 'lucide-solid';
import './keyframe-panel.css';

type PropKind = 'number' | 'angle' | 'opacity' | 'color';
interface PropDef { key: string; label: string; kind: PropKind }

/** Transform/appearance channels available on every element (Phase 1 set). */
const BASE_PROPS: PropDef[] = [
    { key: 'x', label: 'Position X', kind: 'number' },
    { key: 'y', label: 'Position Y', kind: 'number' },
    { key: 'width', label: 'Width', kind: 'number' },
    { key: 'height', label: 'Height', kind: 'number' },
    { key: 'angle', label: 'Rotation', kind: 'angle' },
    { key: 'opacity', label: 'Opacity', kind: 'opacity' },
    { key: 'backgroundColor', label: 'Fill', kind: 'color' },
    { key: 'strokeColor', label: 'Stroke', kind: 'color' },
    { key: 'strokeWidth', label: 'Stroke Width', kind: 'number' },
];

/**
 * Keyframable live-effect params (Phase 4). These are flat numeric/colour element fields
 * that the render pipeline reads directly, so the composition override animates them for
 * free. Feather works on any shape (0 = off); glow/shadow params only matter once the
 * effect is enabled, so they're shown conditionally per the focused element.
 */
const FEATHER_PROP: PropDef = { key: 'featherRadius', label: 'Feather', kind: 'number' };
const IMAGE_BLUR_PROP: PropDef = { key: 'filterBlur', label: 'Blur', kind: 'number' };
const GLOW_PROPS: PropDef[] = [
    { key: 'glowBlur', label: 'Glow Radius', kind: 'number' },
    { key: 'glowColor', label: 'Glow Color', kind: 'color' },
];
const SHADOW_PROPS: PropDef[] = [
    { key: 'shadowBlur', label: 'Shadow Blur', kind: 'number' },
    { key: 'shadowOffsetX', label: 'Shadow X', kind: 'number' },
    { key: 'shadowOffsetY', label: 'Shadow Y', kind: 'number' },
    { key: 'shadowColor', label: 'Shadow Color', kind: 'color' },
];

/** The animatable channels for a specific element: base transform + its active effects. */
function animatablePropsFor(el: any): PropDef[] {
    if (!el) return BASE_PROPS;
    const props = [...BASE_PROPS, FEATHER_PROP];
    if (el.type === 'image' || el.type === 'video') props.push(IMAGE_BLUR_PROP);
    if (el.glowEnabled) props.push(...GLOW_PROPS);
    if (el.shadowEnabled) props.push(...SHADOW_PROPS);
    return props;
}

/** Snap a time to 0.05s so hand-dragged keys land on tidy values. */
const snapT = (t: number) => Math.round(t / 0.05) * 0.05;

const LINEAR_EASE: BezierEase = { ox: 0, oy: 0, ix: 1, iy: 1 };

/** Quick easing presets applied to the selected keyframe's incoming segment. */
const EASING_PRESETS: { key: string; label: string; ease?: BezierEase; hold?: boolean }[] = [
    { key: 'linear', label: 'Linear', ease: { ox: 0, oy: 0, ix: 1, iy: 1 } },
    { key: 'in', label: 'Ease In', ease: { ox: 0.42, oy: 0, ix: 1, iy: 1 } },
    { key: 'out', label: 'Ease Out', ease: { ox: 0, oy: 0, ix: 0.58, iy: 1 } },
    { key: 'inout', label: 'Ease In-Out', ease: { ox: 0.42, oy: 0, ix: 0.58, iy: 1 } },
    { key: 'hold', label: 'Hold', hold: true },
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
/** Which preset (if any) a keyframe's easing currently matches, for button highlight. */
const matchPreset = (k: TimedKeyframe | null): string => {
    if (!k) return '';
    if (k.hold) return 'hold';
    const e = k.ease;
    if (!e) return '';
    const near = (a: number, b: number) => Math.abs(a - b) < 0.02;
    for (const p of EASING_PRESETS) {
        if (!p.ease) continue;
        if (near(e.ox, p.ease.ox) && near(e.oy, p.ease.oy) && near(e.ix, p.ease.ix) && near(e.iy, p.ease.iy)) return p.key;
    }
    return '';
};

const formatValue = (kind: PropKind, v: number | string | undefined): string => {
    if (v === undefined || v === null) return '—';
    if (kind === 'color') return String(v);
    const n = Number(v);
    if (isNaN(n)) return '—';
    if (kind === 'angle') return `${Math.round((n * 180) / Math.PI)}°`;
    if (kind === 'opacity') return `${Math.round(n)}%`;
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
};

const KeyframePanel: Component = () => {
    // Focus the first selected element (dope sheets are single-target in Phase 1).
    const focusId = createMemo(() => store.selection[0] ?? null);
    const focusEl = createMemo(() => store.elements.find(e => e.id === focusId()) ?? null);

    const dur = () => Math.max(0.5, store.storyDuration);
    const frac = () => Math.max(0, Math.min(1, store.storyTime / dur()));

    // Keys for one property of the focused element.
    const keysFor = (property: string): TimedKeyframe[] => {
        const id = focusId();
        if (!id) return [];
        return store.compositionTracks.find(t => t.elementId === id && t.property === property)?.keys ?? [];
    };

    // Live evaluated value at the playhead (falls back to the stored property).
    const valueAt = (p: PropDef): number | string | undefined => {
        const el = focusEl();
        if (!el) return undefined;
        const ov = evaluateCompositionAt(store.storyTime, store.compositionTracks).get(el.id);
        const v = ov && (p.key in ov) ? (ov as any)[p.key] : (el as any)[p.key];
        // Numeric effect params default to 0 when unset (0 = off) so they read + keyframe from 0.
        if (v === undefined && p.kind !== 'color') return 0;
        return v;
    };

    // ---- Mutations (history-aware) --------------------------------------

    const upsertKey = (property: string, t: number, value: number | string, snapshot = true) => {
        const id = focusId();
        if (!id) return;
        if (snapshot) pushToHistory();
        setStore('compositionTracks', (tracks: PropertyTrack[]) => {
            const next = tracks.map(tr => ({ ...tr, keys: [...tr.keys] }));
            let track = next.find(tr => tr.elementId === id && tr.property === property);
            if (!track) { track = { elementId: id, property, keys: [] }; next.push(track); }
            const key: TimedKeyframe = { t, value };
            const at = track.keys.findIndex(k => Math.abs(k.t - t) < 1e-4);
            if (at >= 0) track.keys[at] = { ...track.keys[at], ...key };
            else track.keys.push(key);
            track.keys.sort((a, b) => a.t - b.t);
            return next;
        });
    };

    const moveKey = (property: string, index: number, newT: number) => {
        const id = focusId();
        if (!id) return;
        setStore('compositionTracks', (tracks: PropertyTrack[]) =>
            tracks.map(tr => {
                if (tr.elementId !== id || tr.property !== property) return tr;
                const keys = tr.keys.map((k, i) => (i === index ? { ...k, t: newT } : k));
                keys.sort((a, b) => a.t - b.t);
                return { ...tr, keys };
            })
        );
    };

    const deleteKey = (property: string, index: number) => {
        const id = focusId();
        if (!id) return;
        pushToHistory();
        setStore('compositionTracks', (tracks: PropertyTrack[]) =>
            tracks
                .map(tr => {
                    if (tr.elementId !== id || tr.property !== property) return tr;
                    return { ...tr, keys: tr.keys.filter((_, i) => i !== index) };
                })
                .filter(tr => tr.keys.length > 0)
        );
        setSelKey(null);
    };

    /**
     * Stopwatch: snapshot the element's CURRENT STORED property value into a keyframe
     * at the playhead. Reads the stored value (what the user just set via the Property
     * panel), NOT the evaluated value — otherwise, once a track exists it would hold at
     * the previous key and every new key would clone the same value.
     */
    const addKeyHere = (p: PropDef) => {
        const el = focusEl();
        if (!el) return;
        let v = (el as any)[p.key];
        // Numeric effect params (feather/glow/shadow…) are undefined when off — key from 0.
        if ((v === undefined || v === null) && p.kind !== 'color') v = 0;
        if (v === undefined || v === null) return;
        upsertKey(p.key, snapT(store.storyTime), v);
    };

    // ---- Transform parenting (pick-whip) --------------------------------
    const elLabel = (el: any): string =>
        el.isNullObject ? `⊕ Null ${String(el.id).slice(-4)}`
            : (el.name || (el.text ? String(el.text).slice(0, 14) : `${el.type} ${String(el.id).slice(-4)}`));
    // Candidate parents: any element except self and any of its own descendants (avoids cycles).
    const parentCandidates = createMemo(() => {
        const id = focusId();
        if (!id) return [] as any[];
        const elMap = new Map(store.elements.map(e => [e.id, e]));
        const wouldCycle = (startId: string) => {
            let cur = elMap.get(startId);
            const seen = new Set<string>();
            while (cur?.transformParentId && !seen.has(cur.id)) {
                seen.add(cur.id);
                if (cur.transformParentId === id) return true;
                cur = elMap.get(cur.transformParentId);
            }
            return false;
        };
        return store.elements.filter(e => e.id !== id && !wouldCycle(e.id));
    });
    const setParent = (pid: string | null) => {
        const id = focusId();
        if (!id) return;
        updateElement(id, { transformParentId: pid }, true);
    };
    // Create a null object at the viewport centre (world coords) and select it.
    const addNull = () => {
        const { scale, panX, panY } = store.viewState;
        const cx = (window.innerWidth / 2 - panX) / scale;
        const cy = (window.innerHeight / 2 - panY) / scale;
        (window as any).Yappy?.createNull(cx, cy);
    };

    // ---- Selection of a keyframe (for delete / highlight / easing) ------
    const [selKey, setSelKey] = createSignal<{ property: string; index: number } | null>(null);
    const [selAnchorX, setSelAnchorX] = createSignal(0); // screen x of the selected diamond (popover anchor)
    const isSel = (property: string, index: number) => {
        const s = selKey();
        return !!s && s.property === property && s.index === index;
    };

    // The selected keyframe's data, and whether it owns an incoming segment (index > 0).
    const selKeyData = createMemo<TimedKeyframe | null>(() => {
        const s = selKey();
        if (!s) return null;
        return keysFor(s.property)[s.index] ?? null;
    });
    const selHasSegment = createMemo(() => {
        const s = selKey();
        return !!s && s.index > 0;
    });

    // Patch the selected keyframe's easing fields. One history entry per gesture.
    const patchSelKey = (patch: Partial<TimedKeyframe>, snapshot = true) => {
        const s = selKey();
        const id = focusId();
        if (!s || !id) return;
        if (snapshot) pushToHistory();
        setStore('compositionTracks', (tracks: PropertyTrack[]) =>
            tracks.map(tr => {
                if (tr.elementId !== id || tr.property !== s.property) return tr;
                return { ...tr, keys: tr.keys.map((k, i) => (i === s.index ? { ...k, ...patch } : k)) };
            })
        );
    };
    const applyPreset = (p: typeof EASING_PRESETS[number]) => {
        if (p.hold) patchSelKey({ hold: true, ease: undefined, easing: undefined });
        else patchSelKey({ hold: false, easing: undefined, ease: p.ease });
    };
    /** Ease shown in the graph — the key's bezier, or linear when it has none/hold. */
    const graphEase = createMemo<BezierEase>(() => selKeyData()?.ease ?? LINEAR_EASE);

    // ---- Timeline geometry helpers --------------------------------------
    let bodyRef: HTMLDivElement | undefined;
    const laneRectOf = (evtTarget: HTMLElement) => {
        const lane = evtTarget.closest('.kf-lane') as HTMLElement | null;
        return lane ? lane.getBoundingClientRect() : null;
    };
    const timeFromLane = (clientX: number, rect: DOMRect) =>
        Math.max(0, Math.min(dur(), ((clientX - rect.left) / rect.width) * dur()));

    // Drag a keyframe diamond to retime it. One history entry per gesture.
    const startDragKey = (e: PointerEvent, property: string, index: number) => {
        e.stopPropagation();
        e.preventDefault();
        const rect = laneRectOf(e.currentTarget as HTMLElement);
        if (!rect) return;
        setSelKey({ property, index });
        setSelAnchorX(e.clientX);
        pushToHistory();
        let curIndex = index;
        let moved = false;
        const startX = e.clientX;
        const move = (ev: PointerEvent) => {
            if (!moved && Math.abs(ev.clientX - startX) < 3) return;
            moved = true;
            const nt = snapT(timeFromLane(ev.clientX, rect));
            // After re-sort the dragged key's index may change; track it by identity of time.
            moveKey(property, curIndex, nt);
            const keys = keysFor(property);
            const ni = keys.findIndex(k => Math.abs(k.t - nt) < 1e-4);
            if (ni >= 0) { curIndex = ni; setSelKey({ property, index: ni }); }
        };
        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    // Click an empty lane → seek there.
    const seekFromLane = (e: PointerEvent) => {
        const rect = laneRectOf(e.currentTarget as HTMLElement);
        if (!rect) return;
        setStore({ storyTime: timeFromLane(e.clientX, rect), storyPlaying: false } as any);
    };

    // ---- Easing graph handle drag ---------------------------------------
    // The graph draws in a [PAD..100-PAD] viewBox square; drags read the SVG's
    // client rect so mapping is resolution-independent.
    let graphRef: SVGSVGElement | undefined;
    const GRAPH_PAD = 0.12; // fraction of the square reserved as margin
    const vx = (nx: number) => GRAPH_PAD * 100 + nx * (100 - 2 * GRAPH_PAD * 100);
    const vy = (ny: number) => GRAPH_PAD * 100 + (1 - ny) * (100 - 2 * GRAPH_PAD * 100);
    const startHandleDrag = (e: PointerEvent, which: 'o' | 'i') => {
        e.stopPropagation();
        e.preventDefault();
        if (!graphRef) return;
        const rect = graphRef.getBoundingClientRect();
        pushToHistory();
        const move = (ev: PointerEvent) => {
            const fx = (ev.clientX - rect.left) / rect.width;
            const fy = (ev.clientY - rect.top) / rect.height;
            const nx = clamp((fx - GRAPH_PAD) / (1 - 2 * GRAPH_PAD), 0, 1);
            const ny = clamp(1 - (fy - GRAPH_PAD) / (1 - 2 * GRAPH_PAD), -0.4, 1.4);
            const cur = selKeyData()?.ease ?? LINEAR_EASE;
            const ease: BezierEase = which === 'o'
                ? { ...cur, ox: nx, oy: ny }
                : { ...cur, ix: nx, iy: ny };
            patchSelKey({ ease, hold: false, easing: undefined }, false);
        };
        const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    // ---- Ruler / playhead scrub -----------------------------------------
    let rulerRef: HTMLDivElement | undefined;
    const seekFromRuler = (clientX: number) => {
        if (!rulerRef) return;
        const r = rulerRef.getBoundingClientRect();
        const f = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
        setStore({ storyTime: f * dur(), storyPlaying: false } as any);
    };
    const onRulerDown = (e: PointerEvent) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        seekFromRuler(e.clientX);
        const move = (ev: PointerEvent) => seekFromRuler(ev.clientX);
        const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    // ---- Transport (shares the storyTime clock) -------------------------
    let last = 0;
    onMount(() => { last = effectiveTime() / 1000; });
    createEffect(() => {
        const et = effectiveTime();          // re-run each frame
        if (!store.showKeyframePanel) return;
        untrack(() => {
            const now = et / 1000;
            const dt = Math.min(0.1, Math.max(0, now - last));
            last = now;
            if (!store.storyPlaying) return;
            let nt = store.storyTime + dt;
            if (nt >= dur()) {
                if (store.storyLoop) nt = nt % dur();
                else { nt = dur(); setStore('storyPlaying', false); }
            }
            setStore('storyTime', nt);
        });
    });

    const play = () => setStore('storyPlaying', !store.storyPlaying);
    const restart = () => setStore({ storyTime: 0, storyPlaying: true } as any);

    // Delete the selected keyframe with the keyboard while the panel is focused.
    const onKeyDown = (e: KeyboardEvent) => {
        const s = selKey();
        if (s && (e.key === 'Delete' || e.key === 'Backspace')) {
            e.preventDefault();
            e.stopPropagation();
            deleteKey(s.property, s.index);
        }
    };

    // Deselect the keyframe if the focused element changes.
    createEffect(() => { focusId(); setSelKey(null); });

    onCleanup(() => { setStore('storyPlaying', false); });

    return (
        <Show when={store.showKeyframePanel}>
            <div class="keyframe-panel" tabindex="0" ref={bodyRef} onKeyDown={onKeyDown}>
                <div class="kf-bar">
                    <div class="kf-title"><KeyRound size={14} /> Keyframes</div>
                    <button class="kf-btn" title="Restart" onClick={restart}><RotateCcw size={15} /></button>
                    <button class="kf-btn kf-play" title={store.storyPlaying ? 'Pause' : 'Play'} onClick={play}>
                        <Show when={store.storyPlaying} fallback={<Play size={16} />}><Pause size={16} /></Show>
                    </button>
                    <button class={`kf-btn ${store.storyLoop ? 'active' : ''}`} title="Loop" onClick={() => setStore('storyLoop', !store.storyLoop)}><Repeat size={15} /></button>
                    <span class="kf-time">{store.storyTime.toFixed(2)}s</span>
                    <label class="kf-dur" title="Composition duration (seconds)">
                        dur
                        <input type="number" min="0.5" step="0.5" value={dur()}
                            onChange={(e) => setStore('storyDuration', Math.max(0.5, parseFloat(e.currentTarget.value) || 6))} />
                    </label>
                    <Show when={focusEl()}>
                        <label class="kf-parent" title="Transform parent — this element inherits the parent's animated position, rotation & scale">
                            parent
                            <select value={focusEl()!.transformParentId ?? ''}
                                onChange={(e) => setParent(e.currentTarget.value || null)}>
                                <option value="" selected={!focusEl()!.transformParentId}>None</option>
                                <For each={parentCandidates()}>
                                    {(el) => <option value={el.id} selected={focusEl()!.transformParentId === el.id}>{elLabel(el)}</option>}
                                </For>
                            </select>
                        </label>
                    </Show>
                    <div class="kf-spacer" />
                    <button class="kf-btn" title="Add a null object (invisible transform parent)" onClick={addNull}><Crosshair size={15} /></button>
                    <Show when={selKey()}>
                        <button class="kf-btn danger" title="Delete selected keyframe (Del)"
                            onClick={() => { const s = selKey(); if (s) deleteKey(s.property, s.index); }}><Trash2 size={15} /></button>
                    </Show>
                    <button class="kf-btn" title="Close" onClick={() => toggleKeyframePanel(false)}><X size={15} /></button>
                </div>

                <Show when={focusEl()} fallback={
                    <div class="kf-empty">Select an element, then click the ◆ on a property row to keyframe it at the playhead. Scrub the ruler to preview.</div>
                }>
                    <div class="kf-scroll">
                        <div class="kf-tracks">
                            <For each={animatablePropsFor(focusEl())}>
                                {(p) => {
                                    const keys = createMemo(() => keysFor(p.key));
                                    return (
                                        <div class="kf-track" classList={{ active: keys().length > 0 }}>
                                            <div class="kf-label">
                                                <button class="kf-stopwatch" title={`Add ${p.label} keyframe at ${store.storyTime.toFixed(2)}s`}
                                                    onClick={() => addKeyHere(p)}>
                                                    <Diamond size={12} />
                                                </button>
                                                <span class="kf-pname">{p.label}</span>
                                                <span class="kf-pval" classList={{ swatch: p.kind === 'color' }}
                                                    style={p.kind === 'color' ? { '--sw': String(valueAt(p) ?? '#000') } : undefined}>
                                                    {p.kind === 'color'
                                                        ? <span class="kf-chip" style={{ background: String(valueAt(p) ?? '#000') }} />
                                                        : formatValue(p.kind, valueAt(p))}
                                                </span>
                                            </div>
                                            <div class="kf-lane" onPointerDown={(e) => { if (e.target === e.currentTarget) seekFromLane(e); }}>
                                                <For each={keys()}>
                                                    {(k, i) => (
                                                        <div class="kf-diamond" classList={{ sel: isSel(p.key, i()), hold: !!k.hold }}
                                                            title={`${p.label} = ${formatValue(p.kind, k.value)} @ ${k.t.toFixed(2)}s${k.hold ? ' · hold' : ''} — drag to retime, double-click to delete`}
                                                            style={{ left: `${(k.t / dur()) * 100}%` }}
                                                            onPointerDown={(e) => startDragKey(e, p.key, i())}
                                                            onDblClick={(e) => { e.stopPropagation(); deleteKey(p.key, i()); }} />
                                                    )}
                                                </For>
                                            </div>
                                        </div>
                                    );
                                }}
                            </For>
                        </div>
                    </div>
                    <div class="kf-ruler" ref={rulerRef} onPointerDown={onRulerDown}>
                        <For each={Array.from({ length: Math.floor(dur()) + 1 })}>
                            {(_, i) => <div class="kf-tick" style={{ left: `${(i() / dur()) * 100}%` }}><span>{i()}s</span></div>}
                        </For>
                    </div>
                    <div class="kf-playhead" style={{ left: `calc(var(--kf-gutter) + (100% - var(--kf-gutter)) * ${frac()})` }} />

                    {/* Easing / graph editor for the selected keyframe's incoming segment */}
                    <Show when={selKey() && selHasSegment()}>
                        <div class="kf-ease" style={{ left: `${clamp(selAnchorX() - 108, 8, window.innerWidth - 224)}px` }}
                            onPointerDown={(e) => e.stopPropagation()}>
                            <div class="kf-ease-head">Easing<span>segment into this key</span></div>
                            <div class="kf-ease-presets">
                                <For each={EASING_PRESETS}>
                                    {(p) => (
                                        <button class="kf-preset" classList={{ on: matchPreset(selKeyData()) === p.key }}
                                            title={p.label} onClick={() => applyPreset(p)}>{p.label}</button>
                                    )}
                                </For>
                            </div>
                            <Show when={!selKeyData()?.hold} fallback={<div class="kf-ease-hold">Hold — value steps at this keyframe (no interpolation).</div>}>
                                <svg class="kf-graph" ref={graphRef} viewBox="0 0 100 100" width="150" height="150">
                                    {/* unit square + linear reference diagonal */}
                                    <rect class="kf-graph-box" x={vx(0)} y={vy(1)} width={vx(1) - vx(0)} height={vy(0) - vy(1)} />
                                    <line class="kf-graph-ref" x1={vx(0)} y1={vy(0)} x2={vx(1)} y2={vy(1)} />
                                    {/* handle stems */}
                                    <line class="kf-graph-stem" x1={vx(0)} y1={vy(0)} x2={vx(graphEase().ox)} y2={vy(graphEase().oy)} />
                                    <line class="kf-graph-stem" x1={vx(1)} y1={vy(1)} x2={vx(graphEase().ix)} y2={vy(graphEase().iy)} />
                                    {/* the easing curve */}
                                    <path class="kf-graph-curve"
                                        d={`M ${vx(0)} ${vy(0)} C ${vx(graphEase().ox)} ${vy(graphEase().oy)}, ${vx(graphEase().ix)} ${vy(graphEase().iy)}, ${vx(1)} ${vy(1)}`} />
                                    {/* draggable handles */}
                                    <circle class="kf-graph-handle" cx={vx(graphEase().ox)} cy={vy(graphEase().oy)} r="4.5"
                                        onPointerDown={(e) => startHandleDrag(e, 'o')} />
                                    <circle class="kf-graph-handle" cx={vx(graphEase().ix)} cy={vy(graphEase().iy)} r="4.5"
                                        onPointerDown={(e) => startHandleDrag(e, 'i')} />
                                </svg>
                            </Show>
                        </div>
                    </Show>
                </Show>
            </div>
        </Show>
    );
};

export default KeyframePanel;
