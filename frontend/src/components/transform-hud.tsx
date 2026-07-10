import { Show } from 'solid-js';
import { store } from '../store/app-store';
import { worldToScreen } from '../utils/viewport-transforms';
import { getSelectionBoundingBox } from '../utils/handle-detection';
import './transform-hud.css';

/**
 * Transform HUD — a small screen-space badge that follows the current selection and
 * reads its live dimensions while you move / resize / rotate. Purely derived from the
 * store (no listeners): the selection's element fields update during a gesture, so the
 * badge follows automatically.
 *
 * - Single selection: the element's own W × H, position X, Y, and rotation ∠ (degrees).
 * - Multi selection: the union bounding box's W × H and position (no meaningful angle).
 *
 * Passive UI chrome — `pointer-events: none`, so it never blocks canvas interaction.
 * Hidden in presentation mode and while the Measure tool is active (avoids overlap).
 */

/** Compact number format: at most 1 decimal, trailing `.0` dropped. */
const fmt = (n: number) => {
    const r = Math.round(n * 10) / 10;
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

export const TransformHud = () => {
    const info = () => {
        if (store.selection.length === 0) return null;
        if (store.appMode === 'presentation' || store.measureActive) return null;

        const bbox = getSelectionBoundingBox(store.elements, store.selection);
        if (!bbox) return null;

        const vp = store.viewState as any;
        // Project the (axis-aligned) selection box corners to screen so the badge sits
        // under the visible selection even when the viewport is panned/zoomed/rotated.
        const corners = [
            worldToScreen(bbox.x, bbox.y, vp),
            worldToScreen(bbox.x + bbox.width, bbox.y, vp),
            worldToScreen(bbox.x + bbox.width, bbox.y + bbox.height, vp),
            worldToScreen(bbox.x, bbox.y + bbox.height, vp),
        ];
        const xs = corners.map(c => c.x);
        const ys = corners.map(c => c.y);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const bottom = Math.max(...ys);

        // Single selection reports the element's intrinsic frame + rotation; multi uses the union box.
        const single = store.selection.length === 1
            ? store.elements.find(e => e.id === store.selection[0]) ?? null
            : null;
        const w = single ? single.width : bbox.width;
        const h = single ? single.height : bbox.height;
        const x = single ? single.x : bbox.x;
        const y = single ? single.y : bbox.y;
        const angle = single ? (single.angle ?? 0) : null;

        return { cx, bottom, w, h, x, y, angle };
    };

    return (
        <Show when={info()}>
            {(i) => (
                <div class="transform-hud-layer">
                    <div class="transform-hud" style={{ left: `${i().cx}px`, top: `${i().bottom}px` }}>
                        <span class="thud-dim">{fmt(i().w)} × {fmt(i().h)}</span>
                        <span class="thud-sub">
                            {fmt(i().x)}, {fmt(i().y)}
                            <Show when={i().angle != null && Math.abs(i().angle as number) > 0.05}>
                                {' · '}{fmt(i().angle as number)}°
                            </Show>
                        </span>
                    </div>
                </div>
            )}
        </Show>
    );
};

export default TransformHud;
