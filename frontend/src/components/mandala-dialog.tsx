/**
 * Mandala generator dialog.
 *
 * Presets first, sliders second: "I need a colouring page" should be one click, and the
 * per-band controls are there when you want to push it further. Bands are edited as a
 * list — add, remove, change each one's motif — rather than as a fixed number of ring
 * slots, because the designs worth having differ in how many bands they use.
 *
 * **The preview is an SVG overlay, not real elements.** The first version created the
 * mandala on the canvas and regenerated it on every slider tick, which is how live
 * symmetry previews strokes (`syncLiveSymmetry` makes real elements mid-stroke). That is
 * wrong here: `addElement` pushes an undo snapshot per element, so one preview of a
 * hundred-path design pushed a hundred entries, and a slider drag would have flushed the
 * user's entire undo stack (default depth 50) to generate scaffolding. The overlay writes
 * nothing to the store, so dragging a slider costs no history, no dirty-revision churn
 * and no element churn.
 *
 * The tradeoff, stated plainly because it is visible: the overlay draws clean outlines, so
 * in **sketch** render style the committed mandala will have rough.js wobble the preview
 * doesn't show. Layout, counts and radii are exact — both come from the same
 * `buildMandala` — it is only the line quality that differs.
 */
import { createSignal, createMemo, Show, For, batch } from 'solid-js';
import { store } from '../store/app-store';
import { YappyAPI } from '../api';
import {
    buildMandala, MANDALA_PRESETS, MANDALA_MOTIFS, ringOuterRadius,
    type MandalaRing, type MandalaMotifId,
} from '../utils/mandala';
import { worldToWindow, windowToWorld, canvasOrigin, canvasSize } from '../utils/overlay-transform';
import { onEscapeKey } from '../utils/use-escape';

const [isOpen, setIsOpen] = createSignal(false);
export const openMandalaDialog = () => setIsOpen(true);
export const mandalaDialogOpen = isOpen;

/**
 * Centre of the visible DRAWING AREA in world coordinates — where a generated mandala
 * lands.
 *
 * Deliberately not `window.innerWidth / 2`: the docked toolbar and the Properties panel
 * take real space, so the window centre is ~110px right of the canvas centre, which put a
 * 220px-radius mandala visibly off-centre with its right side under the panel. Worse, that
 * arithmetic mixes frames — it feeds a WINDOW x into a formula expecting CANVAS-LOCAL x.
 * Going through `windowToWorld` keeps one conversion path.
 */
const viewCentre = () => {
    const o = canvasOrigin();
    const s = canvasSize();
    return windowToWorld(o.x + s.w / 2, o.y + s.h / 2);
};

const cloneRings = (rings: MandalaRing[]) => rings.map(r => ({ ...r }));

/** Scale a band list so its outermost edge sits at `radius`. */
const scaleRings = (rings: MandalaRing[], radius: number): MandalaRing[] => {
    const current = ringOuterRadius({ cx: 0, cy: 0, rings });
    if (!(current > 0) || !(radius > 0)) return rings;
    const k = radius / current;
    return rings.map(r => ({ ...r, rInner: r.rInner * k, rOuter: r.rOuter * k }));
};

export const MandalaDialog = () => {
    const [presetId, setPresetId] = createSignal(MANDALA_PRESETS[0].id);
    const [rings, setRings] = createSignal<MandalaRing[]>(cloneRings(MANDALA_PRESETS[0].rings));
    const [radius, setRadius] = createSignal(220);
    const [strokeWidth, setStrokeWidth] = createSignal(2);
    const [armSymmetry, setArmSymmetry] = createSignal(true);
    const [expanded, setExpanded] = createSignal(false);

    const scaled = createMemo(() => scaleRings(rings(), radius()));

    /** Preview outlines as window-space SVG point lists. */
    const previewPolys = createMemo(() => {
        if (!isOpen()) return [];
        const c = viewCentre();
        return buildMandala({ cx: c.x, cy: c.y, rings: scaled() }).map(p =>
            p.anchors.map(a => {
                const w = worldToWindow(a.x, a.y);
                return `${w.x.toFixed(1)},${w.y.toFixed(1)}`;
            }).join(' '));
    });

    /** Path count, so a design that will produce 400 elements says so before you Apply. */
    const pathCount = createMemo(() => previewPolys().length);

    const close = () => setIsOpen(false);
    onEscapeKey(isOpen, close);

    const apply = () => {
        const c = viewCentre();
        // No pushToHistory here — createMandala takes exactly one snapshot for the whole
        // design, so one undo removes it. Pushing again would cost an extra empty step.
        // Leave the selection exactly as createMandala left it — every member of the group.
        // Narrowing it to the returned id selected ONE small path (the centre dot), so the
        // Properties panel described a 21px shape instead of the mandala you just made.
        YappyAPI.createMandala(c.x, c.y, {
            rings: rings(), radius: radius(), armSymmetry: armSymmetry(),
        }, {
            strokeWidth: strokeWidth(),
            strokeColor: store.defaultElementStyles.strokeColor || '#111111',
            backgroundColor: 'transparent',
        });
        setIsOpen(false);
    };

    const usePreset = (id: string) => {
        const p = MANDALA_PRESETS.find(x => x.id === id);
        if (!p) return;
        batch(() => {
            setPresetId(id);
            setRings(cloneRings(p.rings));
        });
    };

    const patchRing = (i: number, patch: Partial<MandalaRing>) =>
        setRings(rs => rs.map((r, k) => (k === i ? { ...r, ...patch } : r)));

    const addRing = () => setRings(rs => {
        const outer = ringOuterRadius({ cx: 0, cy: 0, rings: rs });
        return [...rs, { motif: 'petal' as MandalaMotifId, count: 12, rInner: outer + 2, rOuter: outer + 60, phase: 0, width: 0.8 }];
    });
    const removeRing = (i: number) => setRings(rs => rs.filter((_, k) => k !== i));

    const label = { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: '8px', 'font-size': '12px' } as const;
    const num = { width: '58px', padding: '3px 5px', 'border-radius': '5px', border: '1px solid var(--border-color, #d1d5db)', background: 'var(--bg-secondary, #fff)', color: 'inherit', 'font-size': '12px' } as const;
    const btn = { padding: '5px', 'border-radius': '6px', cursor: 'pointer', 'font-size': '11px', border: '1px solid var(--border-color,#d1d5db)', background: 'transparent', color: 'inherit' } as const;

    return (
        <Show when={isOpen()}>
            {/* Preview overlay — above the canvas, below the dialog, never interactive. */}
            <svg
                class="mandala-preview-svg"
                width="100%" height="100%"
                style={{ position: 'fixed', inset: '0', 'pointer-events': 'none', 'z-index': 19990, overflow: 'visible' }}
            >
                <For each={previewPolys()}>{(pts) => (
                    <polygon
                        points={pts}
                        fill="none"
                        stroke="var(--accent, #3b82f6)"
                        stroke-width={Math.max(1, strokeWidth() * (store.viewState.scale || 1))}
                        stroke-linejoin="round"
                        opacity="0.9"
                    />
                )}</For>
            </svg>

            {/* Docked right, so the mandala forming at the viewport centre stays visible. */}
            <div
                style={{
                    position: 'fixed', top: '0', right: '0', bottom: '0',
                    display: 'flex', 'align-items': 'center', 'z-index': 20000, padding: '20px',
                    'pointer-events': 'none',
                }}
            >
                <div style={{
                    width: '340px', 'max-height': '90vh', 'overflow-y': 'auto', 'pointer-events': 'auto',
                    background: 'var(--bg-panel, #fff)', color: 'var(--text-primary, #1f2937)',
                    'border-radius': '12px', padding: '16px',
                    'box-shadow': '0 12px 40px rgba(0,0,0,0.28)',
                    display: 'flex', 'flex-direction': 'column', gap: '11px',
                }}>
                    <div style={{ 'font-weight': 600, 'font-size': '15px' }}>Mandala</div>
                    <div style={{ 'font-size': '11px', opacity: 0.7, 'margin-top': '-7px' }}>
                        Outline preview on the canvas. Apply draws it in your current style;
                        Cancel leaves nothing behind.
                    </div>

                    <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '5px' }}>
                        <For each={MANDALA_PRESETS}>{(p) => (
                            <button
                                title={p.hint}
                                onClick={() => usePreset(p.id)}
                                style={{
                                    ...btn,
                                    padding: '5px 9px',
                                    background: presetId() === p.id ? 'var(--accent,#3b82f6)' : 'transparent',
                                    color: presetId() === p.id ? '#fff' : 'inherit',
                                }}
                            >{p.name}</button>
                        )}</For>
                    </div>

                    <label style={label}>Size
                        <input type="range" min="60" max="600" step="10" value={radius()}
                            onInput={(e) => setRadius(parseInt(e.currentTarget.value, 10))} />
                        <span style={{ 'min-width': '34px', 'text-align': 'right' }}>{radius()}</span>
                    </label>
                    <label style={label}>Line weight
                        <input type="range" min="1" max="8" step="0.5" value={strokeWidth()}
                            onInput={(e) => setStrokeWidth(parseFloat(e.currentTarget.value))} />
                        <span style={{ 'min-width': '34px', 'text-align': 'right' }}>{strokeWidth()}</span>
                    </label>
                    <label style={label} title="Point Kaleidoscope symmetry at this mandala, so anything you draw next lands on its spokes">
                        Arm symmetry after
                        <input type="checkbox" checked={armSymmetry()}
                            onChange={(e) => setArmSymmetry(e.currentTarget.checked)} />
                    </label>

                    <div style={{ 'font-size': '11px', opacity: 0.7 }}>
                        {pathCount()} shapes
                        <Show when={pathCount() > 250}> — heavy; consider fewer copies per band</Show>
                    </div>

                    <button onClick={() => setExpanded(v => !v)} style={btn}>
                        {expanded() ? 'Hide bands' : `Edit bands (${rings().length})`}
                    </button>

                    <Show when={expanded()}>
                        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
                            <For each={rings()}>{(ring, i) => (
                                <div style={{
                                    border: '1px solid var(--border-color,#e5e7eb)', 'border-radius': '8px',
                                    padding: '8px', display: 'flex', 'flex-direction': 'column', gap: '6px',
                                }}>
                                    <div style={{ display: 'flex', gap: '6px', 'align-items': 'center' }}>
                                        <select
                                            value={ring.motif}
                                            onChange={(e) => patchRing(i(), { motif: e.currentTarget.value as MandalaMotifId })}
                                            style={{ flex: 1, 'font-size': '11px', padding: '3px' }}
                                        >
                                            <For each={MANDALA_MOTIFS}>{(m) => (
                                                <option value={m.id} title={m.hint}>{m.label}</option>
                                            )}</For>
                                        </select>
                                        <button title="Remove this band" onClick={() => removeRing(i())}
                                            style={{ ...btn, padding: '2px 7px' }}>✕</button>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <label style={{ ...label, flex: 1 }} title="Copies around the centre">n
                                            <input style={num} type="number" min="1" max="120" value={ring.count}
                                                onInput={(e) => patchRing(i(), { count: Math.max(1, parseInt(e.currentTarget.value, 10) || 1) })} />
                                        </label>
                                        <label style={{ ...label, flex: 1 }} title="Rotate this band against its neighbours (degrees)">∠
                                            <input style={num} type="number" step="1" value={Math.round(ring.phase)}
                                                onInput={(e) => patchRing(i(), { phase: parseFloat(e.currentTarget.value) || 0 })} />
                                        </label>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <label style={{ ...label, flex: 1 }} title="Inner edge of the band">in
                                            <input style={num} type="number" min="0" value={Math.round(ring.rInner)}
                                                onInput={(e) => patchRing(i(), { rInner: Math.max(0, parseFloat(e.currentTarget.value) || 0) })} />
                                        </label>
                                        <label style={{ ...label, flex: 1 }} title="Outer edge of the band">out
                                            <input style={num} type="number" min="1" value={Math.round(ring.rOuter)}
                                                onInput={(e) => patchRing(i(), { rOuter: Math.max(1, parseFloat(e.currentTarget.value) || 1) })} />
                                        </label>
                                    </div>
                                    <label style={label} title="How fat the motif is within its wedge">width
                                        <input type="range" min="0.1" max="1" step="0.05" value={ring.width}
                                            onInput={(e) => patchRing(i(), { width: parseFloat(e.currentTarget.value) })} />
                                        <span style={{ 'min-width': '26px', 'text-align': 'right' }}>{ring.width.toFixed(2)}</span>
                                    </label>
                                </div>
                            )}</For>
                            <button onClick={addRing} style={{ ...btn, border: '1px dashed var(--border-color,#d1d5db)' }}>
                                + Add band
                            </button>
                        </div>
                    </Show>

                    <div style={{ display: 'flex', 'justify-content': 'flex-end', gap: '8px', 'margin-top': '2px' }}>
                        <button onClick={close} style={{ ...btn, padding: '6px 14px' }}>Cancel</button>
                        <button onClick={apply} style={{ padding: '6px 14px', 'border-radius': '6px', border: 'none', background: 'var(--accent,#3b82f6)', color: '#fff', cursor: 'pointer' }}>Apply</button>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default MandalaDialog;
