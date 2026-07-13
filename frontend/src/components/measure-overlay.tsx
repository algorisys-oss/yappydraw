import { Show, createSignal, onMount, onCleanup } from 'solid-js';
import { store, toggleMeasure } from '../store/app-store';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import { measureLine, shapeMetrics } from '../utils/measure-readout';
import { constrainToAngle } from '../utils/angle-constrain';
import './measure-overlay.css';

/**
 * Measure tool. While `store.measureActive`, the overlay captures pointer events:
 * drag to lay down a measuring line and read its length, angle, and Δx/Δy (drawn
 * as a right triangle). When exactly one shape is selected it also shows that
 * shape's W/H, area, and perimeter. The line stays until the next drag; Esc /
 * toggling off exits.
 */
export const MeasureOverlay = () => {
    // Measurement endpoints in WORLD coords.
    const [m, setM] = createSignal<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
    let dragging = false;

    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);

    const onDown = (e: PointerEvent) => {
        if (!store.measureActive) return;
        e.preventDefault();
        const w = toWorld(e);
        setM({ x1: w.x, y1: w.y, x2: w.x, y2: w.y });
        dragging = true;
    };
    const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const w = toWorld(e);
        setM(p => {
            if (!p) return p;
            // Shift constrains the measuring line to clean 15° increments.
            if (e.shiftKey) { const c = constrainToAngle(p.x1, p.y1, w.x, w.y, 15); return { ...p, x2: c.x, y2: c.y }; }
            return { ...p, x2: w.x, y2: w.y };
        });
    };
    const onUp = () => { dragging = false; };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && store.measureActive) { e.preventDefault(); toggleMeasure(false); } };
        window.addEventListener('keydown', onKey);
        onCleanup(() => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('keydown', onKey);
        });
    });

    const seg = () => {
        const v = m(); if (!v) return null;
        const a = worldToScreen(v.x1, v.y1, store.viewState as any);
        const b = worldToScreen(v.x2, v.y2, store.viewState as any);
        // Right-angle corner of the Δx/Δy triangle (screen space).
        const c = worldToScreen(v.x2, v.y1, store.viewState as any);
        const r = measureLine(v.x1, v.y1, v.x2, v.y2);
        return {
            a, b, c,
            dist: r.dist, angle: r.angle, dx: Math.abs(r.dx), dy: Math.abs(r.dy),
            mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2,
        };
    };

    // Metrics for a single selected shape (independent of any active drag).
    const metrics = () => {
        if (store.selection.length !== 1) return null;
        const el = store.elements.find(e => e.id === store.selection[0]);
        if (!el) return null;
        const p = worldToScreen(el.x, el.y, store.viewState as any);
        return { m: shapeMetrics(el), sx: p.x, sy: p.y };
    };

    const fmt = (n: number) => n >= 1000 ? Math.round(n).toLocaleString() : n.toFixed(n < 10 ? 1 : 0);

    return (
        <Show when={store.measureActive}>
            <div class="measure-overlay" onPointerDown={onDown}>
                <Show when={seg()}>
                    {(s) => (
                        <>
                            <svg class="measure-svg">
                                {/* Δx/Δy right-triangle legs (only when there's a real 2-D span) */}
                                <Show when={s().dx > 1 && s().dy > 1}>
                                    <line x1={s().a.x} y1={s().a.y} x2={s().c.x} y2={s().c.y} stroke="#e11d48" stroke-width="1" stroke-dasharray="4 3" opacity="0.75" />
                                    <line x1={s().c.x} y1={s().c.y} x2={s().b.x} y2={s().b.y} stroke="#e11d48" stroke-width="1" stroke-dasharray="4 3" opacity="0.75" />
                                </Show>
                                {/* Hypotenuse */}
                                <line x1={s().a.x} y1={s().a.y} x2={s().b.x} y2={s().b.y} stroke="#e11d48" stroke-width="1.5" />
                                <circle cx={s().a.x} cy={s().a.y} r="3.5" fill="#fff" stroke="#e11d48" stroke-width="1.5" />
                                <circle cx={s().b.x} cy={s().b.y} r="3.5" fill="#fff" stroke="#e11d48" stroke-width="1.5" />
                            </svg>
                            <Show when={s().dist > 1}>
                                <div class="measure-label" style={{ left: `${s().mx}px`, top: `${s().my}px` }}>
                                    {s().dist.toFixed(1)} px · {s().angle.toFixed(1)}°
                                </div>
                                <Show when={s().dx > 1 && s().dy > 1}>
                                    <div class="measure-leg" style={{ left: `${(s().a.x + s().c.x) / 2}px`, top: `${s().c.y}px` }}>Δx {fmt(s().dx)}</div>
                                    <div class="measure-leg" style={{ left: `${s().c.x}px`, top: `${(s().c.y + s().b.y) / 2}px` }}>Δy {fmt(s().dy)}</div>
                                </Show>
                            </Show>
                        </>
                    )}
                </Show>

                <Show when={metrics()}>
                    {(mm) => (
                        <div class="measure-metrics" style={{ left: `${mm().sx}px`, top: `${mm().sy}px` }}>
                            <div><span>W</span> {fmt(mm().m.width)} <span>H</span> {fmt(mm().m.height)}</div>
                            <div><span>Area</span> {fmt(mm().m.area)} px²</div>
                            <div><span>Perimeter</span> {fmt(mm().m.perimeter)} px</div>
                        </div>
                    )}
                </Show>

                <div class="measure-hint">Measure — drag for distance · Δx/Δy · angle{metrics() ? ' · selection W/H/area' : ''} · Esc to exit</div>
            </div>
        </Show>
    );
};
