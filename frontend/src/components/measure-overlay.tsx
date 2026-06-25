import { Show, createSignal, onMount, onCleanup } from 'solid-js';
import { store, toggleMeasure } from '../store/app-store';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import './measure-overlay.css';

/**
 * Measure tool. While `store.measureActive`, the overlay captures pointer events:
 * drag to lay down a measuring line and read its length (in canvas units) and
 * angle. The line stays until the next drag; Esc / toggling off exits.
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
        setM(p => p ? { ...p, x2: w.x, y2: w.y } : p);
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
        const dx = v.x2 - v.x1, dy = v.y2 - v.y1;
        const dist = Math.hypot(dx, dy);
        // Angle from the positive x-axis, CCW positive (screen y is down → negate).
        const angle = Math.atan2(-dy, dx) * 180 / Math.PI;
        return { a, b, dist, angle, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    };

    return (
        <Show when={store.measureActive}>
            <div class="measure-overlay" onPointerDown={onDown}>
                <Show when={seg()}>
                    {(s) => (
                        <>
                            <svg class="measure-svg">
                                <line x1={s().a.x} y1={s().a.y} x2={s().b.x} y2={s().b.y} stroke="#e11d48" stroke-width="1.5" />
                                <circle cx={s().a.x} cy={s().a.y} r="3.5" fill="#fff" stroke="#e11d48" stroke-width="1.5" />
                                <circle cx={s().b.x} cy={s().b.y} r="3.5" fill="#fff" stroke="#e11d48" stroke-width="1.5" />
                            </svg>
                            <Show when={s().dist > 1}>
                                <div class="measure-label" style={{ left: `${s().mx}px`, top: `${s().my}px` }}>
                                    {s().dist.toFixed(1)} px · {s().angle.toFixed(1)}°
                                </div>
                            </Show>
                        </>
                    )}
                </Show>
                <div class="measure-hint">Measure — drag to read distance &amp; angle · Esc to exit</div>
            </div>
        </Show>
    );
};
