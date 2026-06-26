import { Show, createSignal, onMount, onCleanup } from 'solid-js';
import { store, toggleWidthTool, setWidthPoint } from '../store/app-store';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import { nearestTOnPath } from '../utils/variable-width';
import type { DrawingElement } from '../types';
import './width-tool-overlay.css';

/**
 * Width tool. With the tool active, press on a path and drag perpendicular to it: the drag
 * distance becomes the stroke width at that point, so the stroke swells and tapers like a
 * calligraphic nib. Releasing commits a width point. Targets the selection (or any path
 * under the cursor). Esc exits.
 */
export const WidthToolOverlay = () => {
    const [anchor, setAnchor] = createSignal<{ sx: number; sy: number; id: string; t: number } | null>(null);
    const [cursor, setCursor] = createSignal<{ x: number; y: number } | null>(null);
    let dragging = false;

    const active = () => store.widthToolActive;
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);

    const candidatePaths = (): DrawingElement[] => {
        const sel = store.selection.map(id => store.elements.find(e => e.id === id)).filter((e): e is DrawingElement => !!e && !e.pathClosed);
        if (sel.length) return sel;
        return store.elements.filter(e => e.type === 'path' && !e.pathClosed && !e.livePaintFillFor);
    };

    const onDown = (e: PointerEvent) => {
        if (!active()) return;
        e.preventDefault();
        const w = toWorld(e);
        // pick the nearest path within a tolerance
        let best: { id: string; t: number; d: number } | null = null;
        for (const el of candidatePaths()) {
            const n = nearestTOnPath(el, w);
            if (n && n.dist < (best?.d ?? Infinity)) best = { id: el.id, t: n.t, d: n.dist };
        }
        const tol = 18 / (store.viewState?.scale ?? 1);
        if (!best || best.d > tol) return;
        setAnchor({ sx: e.clientX, sy: e.clientY, id: best.id, t: best.t });
        setCursor(w);
        dragging = true;
    };
    const onMove = (e: PointerEvent) => { if (dragging) setCursor(toWorld(e)); };
    const onUp = (e: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        const a = anchor();
        if (a) {
            // width = 2 × perpendicular drag distance (in world units)
            const distScreen = Math.hypot(e.clientX - a.sx, e.clientY - a.sy);
            const width = (distScreen / (store.viewState?.scale ?? 1)) * 2;
            setWidthPoint(a.id, a.t, Math.max(0, width));
        }
        setAnchor(null); setCursor(null);
    };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && store.widthToolActive) { e.preventDefault(); toggleWidthTool(false); } };
        window.addEventListener('keydown', onKey);
        onCleanup(() => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('keydown', onKey);
        });
    });

    const guide = () => {
        const a = anchor(), c = cursor(); if (!a || !c) return null;
        const s = worldToScreen(c.x, c.y, store.viewState as any);
        return { ax: a.sx, ay: a.sy, cx: s.x, cy: s.y };
    };

    return (
        <Show when={active()}>
            <div class="wt-overlay" onPointerDown={onDown}>
                <svg class="wt-svg">
                    <Show when={guide()}>
                        {(g) => <>
                            <line x1={g().ax} y1={g().ay} x2={g().cx} y2={g().cy} class="wt-guide" />
                            <circle cx={g().cx} cy={g().cy} r={4} class="wt-dot" />
                        </>}
                    </Show>
                </svg>
                <div class="wt-hint">Width tool — drag across a path to swell its stroke · Esc to exit</div>
            </div>
        </Show>
    );
};
