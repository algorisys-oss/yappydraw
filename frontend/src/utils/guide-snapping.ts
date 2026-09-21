/**
 * guide-snapping — pull a moving bounding box onto ruler guides.
 *
 * Kept apart from utils/object-snapping.ts on purpose: that module has a WASM twin that must
 * produce identical results, and guides are not elements (no layer, no id in the element list).
 * The selection handler runs this after object snapping, on each axis object snapping left
 * alone, so an element edge still wins over a guide when both are in reach.
 */
import type { Guide } from '../types';

export interface GuideSnapResult {
    dx: number;
    dy: number;
    /** The guide positions snapped to, for drawing the feedback line. */
    x: number | null;
    y: number | null;
}

/**
 * `box` is the selection's bounds BEFORE the move; dx/dy the proposed move. Each axis tests the
 * box's near edge, centre and far edge against every guide on that axis and takes the closest
 * within `threshold` (world units).
 */
export function snapBoxToGuides(
    box: { minX: number; minY: number; maxX: number; maxY: number },
    dx: number,
    dy: number,
    guides: readonly Guide[],
    threshold: number,
    axes: { x: boolean; y: boolean } = { x: true, y: true },
): GuideSnapResult {
    const res: GuideSnapResult = { dx, dy, x: null, y: null };
    if (!guides.length || !(threshold > 0)) return res;
    const best = (lines: number[], axis: 'h' | 'v'): { d: number; at: number } | null => {
        let out: { d: number; at: number } | null = null;
        for (const g of guides) {
            if (g.axis !== axis || !Number.isFinite(g.pos)) continue;
            for (const l of lines) {
                const d = g.pos - l;
                if (Math.abs(d) <= threshold && (!out || Math.abs(d) < Math.abs(out.d))) out = { d, at: g.pos };
            }
        }
        return out;
    };
    if (axes.x) {
        const x0 = box.minX + dx, x1 = box.maxX + dx;
        const b = best([x0, (x0 + x1) / 2, x1], 'v');
        if (b) { res.dx = dx + b.d; res.x = b.at; }
    }
    if (axes.y) {
        const y0 = box.minY + dy, y1 = box.maxY + dy;
        const b = best([y0, (y0 + y1) / 2, y1], 'h');
        if (b) { res.dy = dy + b.d; res.y = b.at; }
    }
    return res;
}
