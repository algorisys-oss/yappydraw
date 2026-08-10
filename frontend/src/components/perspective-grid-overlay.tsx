import { Show, For, createSignal, onMount, onCleanup } from 'solid-js';
import { store, togglePerspectiveGrid, setPerspectiveGrid, resetPerspectiveGrid, projectToPlane } from '../store/app-store';
import { perspectiveVPs, type PerspectiveMode, type PerspectivePlane } from '../utils/perspective-snap';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import './perspective-grid-overlay.css';

const PLANES: { id: PerspectivePlane; label: string; title: string }[] = [
    { id: 'off', label: 'Off', title: 'Shape tools draw normally' },
    { id: 'left', label: '◧', title: 'Draw shapes on the left wall' },
    { id: 'floor', label: '▢', title: 'Draw shapes on the floor / ground plane' },
    { id: 'right', label: '◨', title: 'Draw shapes on the right wall' },
];

/**
 * Perspective Grid (1-, 2- or 3-point). Draws a horizon with its vanishing points and a
 * fan of converging lines per VP. Drag a VP or the horizon to re-aim it; the gear opens
 * mode / density / snap settings. With a shape selected, the plane buttons project it
 * (foreshortened toward the VPs via a 4-corner warp). Esc exits.
 *
 * Every line is defined by two WORLD points and clipped in screen space, so the fan is
 * anchored to the drawing: it pans, zooms and rotates with the canvas instead of sliding
 * about underneath it (the rays used to be aimed at fixed points on the window edge, so
 * the "same" line moved every time you panned — useless to align to).
 */
export const PerspectiveGridOverlay = () => {
    const [drag, setDrag] = createSignal<'left' | 'right' | 'vertical' | 'horizon' | null>(null);
    const [showConfig, setShowConfig] = createSignal(false);
    const active = () => store.perspectiveGridActive && !!store.perspectiveGrid;
    const g = () => store.perspectiveGrid!;
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);
    const w2s = (x: number, y: number) => worldToScreen(x, y, store.viewState as any);

    const grab = (which: 'left' | 'right' | 'vertical' | 'horizon') => (e: PointerEvent) => { e.preventDefault(); e.stopPropagation(); setDrag(which); };
    const onMove = (e: PointerEvent) => {
        const d = drag(); if (!d) return;
        const w = toWorld(e);
        if (d === 'left') setPerspectiveGrid({ leftVPx: w.x });
        else if (d === 'right') setPerspectiveGrid({ rightVPx: w.x });
        else if (d === 'vertical') setPerspectiveGrid({ verticalVPx: w.x, verticalVPy: w.y });
        else setPerspectiveGrid({ horizonY: w.y });
    };
    const onUp = () => setDrag(null);

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && store.perspectiveGridActive) { e.preventDefault(); togglePerspectiveGrid(false); } };
        window.addEventListener('keydown', onKey);
        onCleanup(() => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('keydown', onKey); });
    });

    /**
     * Clip the INFINITE line through two screen points to the viewport (Liang–Barsky over
     * an unbounded parameter). Returns null when the line misses the screen entirely, or
     * when the two points coincide and there is no line to speak of.
     */
    const clipInfinite = (x1: number, y1: number, x2: number, y2: number, W: number, H: number) => {
        const dx = x2 - x1, dy = y2 - y1;
        if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return null;
        let t0 = -Infinity, t1 = Infinity;
        const ps = [-dx, dx, -dy, dy];
        const qs = [x1, W - x1, y1, H - y1];
        for (let i = 0; i < 4; i++) {
            const p = ps[i], q = qs[i];
            if (Math.abs(p) < 1e-12) { if (q < 0) return null; continue; }
            const r = q / p;
            if (p < 0) { if (r > t1) return null; if (r > t0) t0 = r; }
            else { if (r < t0) return null; if (r < t1) t1 = r; }
        }
        if (!Number.isFinite(t0) || !Number.isFinite(t1)) return null;
        return { x1: x1 + t0 * dx, y1: y1 + t0 * dy, x2: x1 + t1 * dx, y2: y1 + t1 * dy };
    };

    /** World line → clipped screen segment. */
    const worldLine = (ax: number, ay: number, bx: number, by: number, cls: string, W: number, H: number) => {
        const a = w2s(ax, ay), b = w2s(bx, by);
        const seg = clipInfinite(a.x, a.y, b.x, b.y, W, H);
        return seg ? { ...seg, cls } : null;
    };

    // The fans, plus the free vertical/horizontal families the mode leaves un-converged.
    const lines = () => {
        const gr = g();
        const W = window.innerWidth, H = window.innerHeight;
        const segs: { x1: number; y1: number; x2: number; y2: number; cls: string }[] = [];
        const push = (s: ReturnType<typeof worldLine>) => { if (s) segs.push(s); };

        // Everything is measured off the VP separation, so the grid keeps its proportions
        // as you drag the vanishing points apart.
        const span = Math.max(200, Math.abs(gr.rightVPx - gr.leftVPx));
        const cx = (gr.leftVPx + gr.rightVPx) / 2;
        const refY = gr.horizonY + span * 0.25;
        const N = Math.max(2, Math.round(gr.density));
        const refX = (i: number) => cx - span * 0.75 + (i / N) * span * 1.5;

        const CLS: Record<string, string> = { vp: 'pg-line pg-left', left: 'pg-line pg-left', right: 'pg-line pg-right', vertical: 'pg-line pg-third' };
        for (const vp of perspectiveVPs(gr)) {
            // Verticals rise from the horizon; the ground fans sweep the reference depth.
            const throughY = vp.kind === 'vertical' ? gr.horizonY : refY;
            for (let i = 0; i <= N; i++) push(worldLine(vp.x, vp.y, refX(i), throughY, CLS[vp.kind], W, H));
        }

        if (gr.mode !== 3) {
            for (let i = 0; i <= N; i++) push(worldLine(refX(i), gr.horizonY, refX(i), gr.horizonY + span, 'pg-line pg-faint', W, H));
        }
        if (gr.mode === 1) {
            // A receding floor: each successive horizontal is further away, so they bunch
            // toward the horizon the way real ones do.
            for (let i = 0; i < N; i++) {
                const y = gr.horizonY + span * 0.25 * (N + 1) / (N + 1 - i);
                push(worldLine(cx - span, y, cx + span, y, 'pg-line pg-faint', W, H));
            }
        }

        const horizon = worldLine(cx - span, gr.horizonY, cx + span, gr.horizonY, 'pg-horizon', W, H);
        const guide = store.perspectiveSnapGuide;
        const active = guide
            ? worldLine(guide.ax, guide.ay, guide.ax + guide.dx * span, guide.ay + guide.dy * span, 'pg-active', W, H)
            : null;

        const vpDots = perspectiveVPs(gr)
            .map(vp => ({ kind: vp.kind, ...w2s(vp.x, vp.y) }))
            .filter(d => d.x > -40 && d.x < W + 40 && d.y > -40 && d.y < H + 40);

        return { segs, horizon, active, vpDots };
    };

    const hasSel = () => store.selection.length > 0;
    const set = (patch: Parameters<typeof setPerspectiveGrid>[0]) => setPerspectiveGrid(patch);

    return (
        <Show when={active()}>
            <div class="pg-overlay" classList={{ 'pg-dragging': !!drag() }}>
                <svg class="pg-svg">
                    {(() => { const L = lines(); return <>
                        <For each={L.segs}>{(s) => <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} class={s.cls} />}</For>
                        <Show when={L.active}>{(s) => <line x1={s().x1} y1={s().y1} x2={s().x2} y2={s().y2} class={s().cls} />}</Show>
                        <Show when={L.horizon}>{(s) => <line x1={s().x1} y1={s().y1} x2={s().x2} y2={s().y2} class="pg-horizon" onPointerDown={grab('horizon')} />}</Show>
                        <For each={L.vpDots}>{(d) => (
                            <circle cx={d.x} cy={d.y} r={9} class="pg-vp"
                                onPointerDown={grab(d.kind === 'vp' ? 'left' : d.kind)} />
                        )}</For>
                    </>; })()}
                </svg>

                <div class="pg-hint">
                    <span class="pg-lead">{g().mode}-point{g().snap ? ' · Alt = free-hand' : ''}</span>
                    {/* Draw-on-plane: shape drags become quads lying on the chosen plane. */}
                    <span class="pg-sep">·</span>
                    <span class="pg-label-inline">Draw on</span>
                    <div class="pg-seg pg-seg-plane">
                        <For each={PLANES}>{(p) => (
                            <button classList={{ 'pg-on': g().drawPlane === p.id }} title={p.title}
                                onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); setPerspectiveGrid({ drawPlane: p.id }); }}>{p.label}</button>
                        )}</For>
                    </div>
                    <Show when={hasSel()}>
                        <span class="pg-sep">·</span>
                        <span class="pg-label-inline">Project</span>
                        <button class="pg-btn" title="Foreshorten the selection onto the left wall" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); projectToPlane([...store.selection], 'left'); }}>◧</button>
                        <button class="pg-btn" title="Foreshorten the selection onto the floor" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); projectToPlane([...store.selection], 'floor'); }}>▢</button>
                        <button class="pg-btn" title="Foreshorten the selection onto the right wall" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); projectToPlane([...store.selection], 'right'); }}>◨</button>
                    </Show>
                    <button class="pg-btn pg-gear" classList={{ 'pg-on': showConfig() }} title="Grid settings"
                        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); setShowConfig(v => !v); }}>⚙</button>
                    <button class="pg-done" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); togglePerspectiveGrid(false); }}>Done ✕</button>
                </div>

                <Show when={showConfig()}>
                    <div class="pg-config" onPointerDown={(e) => e.stopPropagation()}>
                        <div class="pg-row">
                            <span class="pg-label">Mode</span>
                            {/* Distinct class from the hint bar's plane picker: both are
                                segmented controls, and a bare `.pg-seg` selector matches
                                two of them. */}
                            <div class="pg-seg pg-seg-mode">
                                <For each={[1, 2, 3] as PerspectiveMode[]}>{(m) => (
                                    <button classList={{ 'pg-on': g().mode === m }} onClick={() => set({ mode: m })}>{m}-pt</button>
                                )}</For>
                            </div>
                        </div>
                        <div class="pg-row">
                            <span class="pg-label">Density</span>
                            <input type="range" min={4} max={40} step={1} value={g().density}
                                onInput={e => set({ density: +e.currentTarget.value })} />
                            <span class="pg-val">{g().density}</span>
                        </div>
                        <Show when={g().mode === 3}>
                            <div class="pg-row">
                                <span class="pg-label">3rd VP</span>
                                <input type="range" min={200} max={20000} step={100}
                                    value={Math.round(Math.abs(g().verticalVPy - g().horizonY))}
                                    onInput={e => set({ verticalVPy: g().horizonY + +e.currentTarget.value })} />
                                <span class="pg-val">{Math.round(Math.abs(g().verticalVPy - g().horizonY))}</span>
                            </div>
                        </Show>
                        <label class="pg-row pg-check">
                            <input type="checkbox" checked={g().snap} onChange={e => set({ snap: e.currentTarget.checked })} />
                            <span>Snap to perspective lines</span>
                        </label>
                        <Show when={g().snap}>
                            <div class="pg-row">
                                <span class="pg-label">Tolerance</span>
                                <input type="range" min={1} max={30} step={1} value={g().snapAngle}
                                    onInput={e => set({ snapAngle: +e.currentTarget.value })} />
                                <span class="pg-val">{g().snapAngle}°</span>
                            </div>
                            <div class="pg-row">
                                <span class="pg-label">Strength</span>
                                <input type="range" min={0} max={100} step={5} value={Math.round(g().snapStrength * 100)}
                                    onInput={e => set({ snapStrength: +e.currentTarget.value / 100 })} />
                                <span class="pg-val">{Math.round(g().snapStrength * 100)}%</span>
                            </div>
                            <p class="pg-note">
                                100% locks onto the ray; lower values just bias it, so curves and freehand
                                strokes stay drawable. Hold <strong>Alt</strong> to ignore the grid, <strong>Shift</strong> for the
                                plain 15° constraint.
                            </p>
                        </Show>
                        <div class="pg-row pg-actions">
                            <button class="pg-btn" onClick={() => resetPerspectiveGrid()}>Reset grid</button>
                        </div>
                    </div>
                </Show>
            </div>
        </Show>
    );
};
