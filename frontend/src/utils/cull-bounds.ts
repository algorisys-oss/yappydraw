import type { DrawingElement } from '../types';
import { normalizePoints } from './points';

export interface CullBox { x: number; y: number; width: number; height: number }

const CONNECTOR_TYPES = new Set(['line', 'arrow', 'bezier', 'organicBranch']);

/**
 * The world-space box viewport culling should test an element against, with a
 * non-negative width/height.
 *
 * For a connector, x/y/width/height is only the start→end chord, but what gets drawn
 * is the routed polyline in `points` (relative to x/y) or the curve through
 * `controlPoints` (absolute), and either can run far outside the chord. An elbow routed
 * around an obstacle is the usual case. Culling by the chord made such a connector vanish
 * as soon as the chord left the screen, even with most of its path still in view.
 *
 * A connector drawn right-to-left or bottom-to-top also has a negative width or height,
 * which the old edge tests read as the wrong edge. Normalising fixes that for every element.
 *
 * Only connectors read their points: they have a handful, while a freehand stroke can have
 * thousands and already keeps its bounds in sync with them (normalizePencil).
 */
export function cullBounds(el: DrawingElement): CullBox {
    let minX = Math.min(el.x, el.x + el.width);
    let maxX = Math.max(el.x, el.x + el.width);
    let minY = Math.min(el.y, el.y + el.height);
    let maxY = Math.max(el.y, el.y + el.height);

    if (CONNECTOR_TYPES.has(el.type)) {
        for (const p of normalizePoints(el.points)) {
            if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
            const wx = el.x + p.x, wy = el.y + p.y;
            if (wx < minX) minX = wx; else if (wx > maxX) maxX = wx;
            if (wy < minY) minY = wy; else if (wy > maxY) maxY = wy;
        }
        if (Array.isArray(el.controlPoints)) {
            for (const c of el.controlPoints) {
                if (!c || !Number.isFinite(c.x) || !Number.isFinite(c.y)) continue;
                if (c.x < minX) minX = c.x; else if (c.x > maxX) maxX = c.x;
                if (c.y < minY) minY = c.y; else if (c.y > maxY) maxY = c.y;
            }
        }
    }

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
