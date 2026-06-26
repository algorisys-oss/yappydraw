import { Show, createSignal, onMount, onCleanup } from 'solid-js';
import { store, toggleSliceTool } from '../store/app-store';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import { exportRegion } from '../utils/export';
import './slice-tool-overlay.css';

/**
 * Slice tool. Drag a rectangle over any part of the canvas; on release that exact region is
 * exported to a PNG (clipped to the rectangle). A lightweight, one-shot export region — for
 * persistent named regions use Artboards. Esc exits.
 */
export const SliceToolOverlay = () => {
    const [a, setA] = createSignal<{ x: number; y: number } | null>(null);
    const [b, setB] = createSignal<{ x: number; y: number } | null>(null);
    let n = 0;

    const active = () => store.sliceToolActive;
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);

    const onDown = (e: PointerEvent) => { if (!active() || e.button !== 0) return; e.preventDefault(); const w = toWorld(e); setA(w); setB(w); };
    const onMove = (e: PointerEvent) => { if (a()) setB(toWorld(e)); };
    const onUp = () => {
        const p0 = a(), p1 = b();
        setA(null); setB(null);
        if (!p0 || !p1) return;
        const x = Math.min(p0.x, p1.x), y = Math.min(p0.y, p1.y);
        const w = Math.abs(p1.x - p0.x), h = Math.abs(p1.y - p0.y);
        if (w > 4 && h > 4) exportRegion(Math.round(x), Math.round(y), Math.round(w), Math.round(h), `slice-${++n}`, 2, true);
    };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', () => { setA(null); setB(null); });
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && store.sliceToolActive) { e.preventDefault(); toggleSliceTool(false); } };
        window.addEventListener('keydown', onKey);
        onCleanup(() => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('keydown', onKey); });
    });

    const rect = () => {
        const p0 = a(), p1 = b(); if (!p0 || !p1) return null;
        const s0 = worldToScreen(Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), store.viewState as any);
        const s1 = worldToScreen(Math.max(p0.x, p1.x), Math.max(p0.y, p1.y), store.viewState as any);
        return { x: s0.x, y: s0.y, w: s1.x - s0.x, h: s1.y - s0.y };
    };

    return (
        <Show when={active()}>
            <div class="sl-overlay" onPointerDown={onDown}>
                <svg class="sl-svg">
                    <Show when={rect()}>{(r) => <rect x={r().x} y={r().y} width={r().w} height={r().h} class="sl-rect" />}</Show>
                </svg>
                <div class="sl-hint">
                    Slice — drag a rectangle to export that region as PNG
                    <button class="sl-done" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); toggleSliceTool(false); }}>Done ✕</button>
                </div>
            </div>
        </Show>
    );
};
