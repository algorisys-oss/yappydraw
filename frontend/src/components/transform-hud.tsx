import { Show } from 'solid-js';
import { store } from '../store/app-store';
// WINDOW px: `.transform-hud-layer` is `position: fixed; inset: 0`, so it is in window
// space, while `worldToScreen` speaks canvas-local px. The two differ by the docked
// chrome's inset, which put the badge 46px left and 52px above the selection it labels.
import { worldToWindow } from '../utils/overlay-transform';
import { getSelectionBoundingBox } from '../utils/handle-detection';
import { pxToUnit } from '../utils/units';
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
 * OFF by default — toggle it from the ruler button in the top bar (globalSettings.showDimensions).
 * Also hidden in presentation mode and while the Measure tool is active (avoids overlap).
 */

/** Compact number format: at most 1 decimal, trailing `.0` dropped. */
const fmt = (n: number) => {
    const r = Math.round(n * 10) / 10;
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

export const TransformHud = () => {
    const info = () => {
        if (store.selection.length === 0) return null;
        // Off unless asked for — the badge sits on top of the artwork and the quick-connect
        // handle, so it is opt-in via the ruler button in the top bar.
        if (!store.globalSettings.showDimensions) return null;
        if (store.appMode === 'presentation' || store.measureActive) return null;

        const bbox = getSelectionBoundingBox(store.elements, store.selection);
        if (!bbox) return null;

        const single0 = store.selection.length === 1
            ? store.elements.find(e => e.id === store.selection[0]) ?? null
            : null;
        // World corners: a single rotated element uses its ROTATED corners so the badge
        // sits under its true visual bottom; otherwise the axis-aligned selection box.
        let worldCorners: { x: number; y: number }[];
        if (single0 && single0.angle) {
            const cx = single0.x + single0.width / 2, cy = single0.y + single0.height / 2;
            const c = Math.cos(single0.angle), s = Math.sin(single0.angle);
            worldCorners = [
                [single0.x, single0.y], [single0.x + single0.width, single0.y],
                [single0.x + single0.width, single0.y + single0.height], [single0.x, single0.y + single0.height],
            ].map(([px, py]) => { const dx = px - cx, dy = py - cy; return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c }; });
        } else {
            worldCorners = [
                { x: bbox.x, y: bbox.y }, { x: bbox.x + bbox.width, y: bbox.y },
                { x: bbox.x + bbox.width, y: bbox.y + bbox.height }, { x: bbox.x, y: bbox.y + bbox.height },
            ];
        }
        const corners = worldCorners.map(p => worldToWindow(p.x, p.y));
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

        const unit = store.globalSettings.measurementUnit ?? 'px';
        const conv = (n: number) => pxToUnit(n, unit);
        return { cx, bottom, w: conv(w), h: conv(h), x: conv(x), y: conv(y), angle, unit };
    };

    return (
        <Show when={info()}>
            {(i) => (
                <div class="transform-hud-layer">
                    <div class="transform-hud" style={{ left: `${i().cx}px`, top: `${i().bottom}px` }}>
                        <span class="thud-dim">{fmt(i().w)} × {fmt(i().h)}{i().unit !== 'px' ? ` ${i().unit}` : ''}</span>
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
