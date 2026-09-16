/**
 * Scribble fill geometry: back-and-forth strokes that fill a shape's OUTLINE.
 *
 * Rows are scanlines at `spacing`, turned by `angle` about the shape's centre, and each row is
 * cut to the spans that lie inside the polygons (even-odd, so holes stay empty). Consecutive
 * rows join into one zig-zag stroke while their spans overlap; where the shape splits (a star's
 * arms, the two lobes of a heart) each part gets its own stroke rather than a line jumping
 * across empty space.
 */
import type { Poly } from './path-boolean';

type Pt = { x: number; y: number };

export function scribbleStrokes(polys: Poly[], spacing: number, angle: number): Pt[][] {
    const rings = polys.flat().filter(r => r.length >= 3);
    if (!rings.length || !(spacing > 0)) return [];

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const r of rings) for (const [x, y] of r) {
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    // Work in a frame where the rows are horizontal, then rotate the result back.
    const toLocal = ([x, y]: [number, number]): [number, number] =>
        [cx + (x - cx) * cos + (y - cy) * sin, cy - (x - cx) * sin + (y - cy) * cos];
    const toWorld = (p: Pt): Pt =>
        ({ x: cx + (p.x - cx) * cos - (p.y - cy) * sin, y: cy + (p.x - cx) * sin + (p.y - cy) * cos });
    const local = rings.map(r => r.map(toLocal));

    let top = Infinity, bottom = -Infinity;
    for (const r of local) for (const [, y] of r) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
    const height = bottom - top;
    if (height <= 0) return [];
    const rows = Math.max(2, Math.floor(height / spacing));

    type Chain = { pts: Pt[]; span: [number, number]; row: number };
    const open: Chain[] = [];
    const done: Pt[][] = [];

    for (let r = 0; r <= rows; r++) {
        // Nudge the first and last rows inside, or they graze a vertex and find no span.
        const y = top + (r / rows) * height + (r === 0 ? 1e-6 : r === rows ? -1e-6 : 0);
        const xs: number[] = [];
        for (const ring of local) {
            for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                const [x1, y1] = ring[j], [x2, y2] = ring[i];
                if ((y1 > y) !== (y2 > y)) xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
            }
        }
        xs.sort((a, b) => a - b);
        const spans: [number, number][] = [];
        for (let i = 0; i + 1 < xs.length; i += 2) if (xs[i + 1] - xs[i] > 1e-6) spans.push([xs[i], xs[i + 1]]);

        for (const span of spans) {
            // Continue a chain only when the hop to this row is short. A long hop runs across the
            // gap where the shape splits (between a star's legs) instead of staying inside it.
            const hop = (c: Chain) => {
                const last = c.pts[c.pts.length - 1];
                return Math.min(Math.abs(last.x - span[0]), Math.abs(last.x - span[1]));
            };
            const chain = open.find(c => c.row === r - 1 && c.span[0] <= span[1] && span[0] <= c.span[1] && hop(c) <= spacing * 2.5);
            if (chain) {
                const last = chain.pts[chain.pts.length - 1];
                const [near, far] = Math.abs(last.x - span[0]) <= Math.abs(last.x - span[1]) ? [span[0], span[1]] : [span[1], span[0]];
                chain.pts.push({ x: near, y }, { x: far, y });
                chain.span = span;
                chain.row = r;
            } else {
                open.push({ pts: [{ x: span[0], y }, { x: span[1], y }], span, row: r });
            }
        }
        // Chains that found nothing in this row are finished.
        for (let i = open.length - 1; i >= 0; i--) {
            if (open[i].row < r) { done.push(open[i].pts); open.splice(i, 1); }
        }
    }
    for (const c of open) done.push(c.pts);
    return done.map(pts => pts.map(toWorld));
}
