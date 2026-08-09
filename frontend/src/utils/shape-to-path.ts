import { cornerRadiiPx } from './corner-radius';
/**
 * Convert a shape's geometry into editable vector-path anchors.
 *
 * Produces clean output for the common cases — ellipse/circle → 4 smooth Bézier
 * anchors, rectangle → 4 corners, polygonal shapes → exact corner anchors — and
 * falls back to sampling the outline (with Ramer–Douglas–Peucker simplification) for
 * arbitrary `path`/`multi` geometry. Anchors are returned in element-origin coords
 * (0..width / 0..height), so a `path` element placed at the shape's x/y/width/height
 * matches the original.
 */

import type { DrawingElement, PathAnchor } from '../types';
import { getShapeGeometry } from './shape-geometry';
import { PathUtils } from './math/path-utils';

const KAPPA = 0.5522847498307936; // circle → 4 cubic Béziers

/** Ramer–Douglas–Peucker: drop points that don't deviate from the chord by > eps. */
function rdp(points: { x: number; y: number }[], eps: number): { x: number; y: number }[] {
    if (points.length < 3) return points;
    let maxD = -1, idx = 0;
    const a = points[0], b = points[points.length - 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len2 = dx * dx + dy * dy || 1;
    for (let i = 1; i < points.length - 1; i++) {
        const p = points[i];
        const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
        const px = a.x + t * dx, py = a.y + t * dy;
        const d = Math.hypot(p.x - px, p.y - py);
        if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD <= eps) return [a, b];
    const left = rdp(points.slice(0, idx + 1), eps);
    const right = rdp(points.slice(idx), eps);
    return left.slice(0, -1).concat(right);
}

const corner = (x: number, y: number): PathAnchor => ({ x, y, kind: 'corner' });

/** Normalize `el.points` (packed number[] or {x,y}[]) to {x,y}[]. */
function normalizePoints(points: any): { x: number; y: number }[] {
    if (!points || !points.length) return [];
    if (typeof points[0] === 'object') return points.map((p: any) => ({ x: p.x, y: p.y }));
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < points.length - 1; i += 2) out.push({ x: points[i], y: points[i + 1] });
    return out;
}

/**
 * @returns anchors (element-origin coords) + closed flag, or null if the shape can't
 * be converted (already a path, or no geometry).
 */
export function shapeToPath(el: DrawingElement): { anchors: PathAnchor[]; closed: boolean } | null {
    if (el.type === 'path') return null;

    // Line / connector / freehand elements store `el.points` in ELEMENT-ORIGIN coords
    // (0,0 = top-left), unlike the centred geometry other shapes emit — so use them
    // directly, WITHOUT the centre offset, or the path shifts by (w/2, h/2).
    if (el.points && el.points.length > 0) {
        const pts = normalizePoints(el.points);
        if (pts.length < 2) return null;
        return { anchors: pts.map(p => corner(p.x, p.y)), closed: false };
    }

    const geo = getShapeGeometry(el);
    if (!geo) return null;
    const w = el.width, h = el.height;
    const hw = w / 2, hh = h / 2;
    // Geometry is centred at the element centre; element-origin = centre + (w/2, h/2).
    const L = (gx: number, gy: number) => ({ x: gx + hw, y: gy + hh });

    if (geo.type === 'ellipse') {
        const rx = geo.rx, ry = geo.ry, cx = geo.cx, cy = geo.cy;
        const kx = KAPPA * rx, ky = KAPPA * ry;
        const top = L(cx, cy - ry), right = L(cx + rx, cy), bottom = L(cx, cy + ry), left = L(cx - rx, cy);
        return {
            closed: true,
            anchors: [
                { ...top, kind: 'smooth', inX: -kx, inY: 0, outX: kx, outY: 0 },
                { ...right, kind: 'smooth', inX: 0, inY: -ky, outX: 0, outY: ky },
                { ...bottom, kind: 'smooth', inX: kx, inY: 0, outX: -kx, outY: 0 },
                { ...left, kind: 'smooth', inX: 0, inY: ky, outX: 0, outY: -ky },
            ],
        };
    }
    if (geo.type === 'rect') {
        const { x, y, w: gw, h: gh } = geo;
        // Rounded corners have to survive the conversion. Everything that turns a shape into
        // a path goes through here — Knife/Scissors, Warp, Pathfinder, Convert to Path — and
        // emitting four sharp corners silently squared off every rounded rectangle the moment
        // you cut or warped it. The radius uses the same formula as `rectangle-renderer` and
        // `shape-geometry` (percent of the shorter side, clamped to half of it).
        // Per-corner radii, so a shape with only one rounded corner converts as drawn.
        const [rTL, rTR, rBR, rBL] = cornerRadiiPx({ ...(el as any), width: gw, height: gh });
        if (rTL > 0 || rTR > 0 || rBR > 0 || rBL > 0) {
            // Each corner becomes two anchors joined by a quarter-circle Bézier: the handles
            // point along the edges, KAPPA·r long, which is the standard circular approximation.
            //
            // Only the handle a corner actually uses is written. A zero-valued handle is NOT
            // the same as an absent one — `anchorsToPathData` emits a cubic whenever either
            // endpoint has any handle defined, so explicit zeros would turn all four straight
            // edges into degenerate curves and hang phantom handles off every anchor in the
            // node editor. `kind: 'corner'` for the same reason: the arc meets the edge
            // tangentially, but pairing the handles would mean dragging one bends the straight
            // edge next to it.
            const x0 = x, y0 = y, x1 = x + gw, y1 = y + gh;
            const k = (r: number) => KAPPA * r;
            const a = (px: number, py: number, h: Partial<PathAnchor>): PathAnchor => {
                const p = L(px, py);
                return { x: p.x, y: p.y, kind: 'corner', ...h };
            };
            // Walking clockwise from the end of the top-left arc. Each straight edge runs
            // between an anchor with no out-handle and one with no in-handle. A corner with
            // zero radius collapses its two anchors onto the corner point with no handles,
            // which is exactly a sharp corner — so mixed sharp/round rectangles just work.
            return {
                closed: true,
                anchors: [
                    a(x0 + rTL, y0, rTL ? { inX: -k(rTL), inY: 0 } : {}),
                    a(x1 - rTR, y0, rTR ? { outX: k(rTR), outY: 0 } : {}),
                    a(x1, y0 + rTR, rTR ? { inX: 0, inY: -k(rTR) } : {}),
                    a(x1, y1 - rBR, rBR ? { outX: 0, outY: k(rBR) } : {}),
                    a(x1 - rBR, y1, rBR ? { inX: k(rBR), inY: 0 } : {}),
                    a(x0 + rBL, y1, rBL ? { outX: -k(rBL), outY: 0 } : {}),
                    a(x0, y1 - rBL, rBL ? { inX: 0, inY: k(rBL) } : {}),
                    a(x0, y0 + rTL, rTL ? { outX: 0, outY: -k(rTL) } : {}),
                ],
            };
        }
        return { closed: true, anchors: [L(x, y), L(x + gw, y), L(x + gw, y + gh), L(x, y + gh)].map(p => corner(p.x, p.y)) };
    }
    if (geo.type === 'points') {
        const pts = geo.points.map((p: any) => L(p.x, p.y));
        if (pts.length < 2) return null;
        return { closed: geo.isClosed !== false, anchors: pts.map(p => corner(p.x, p.y)) };
    }
    // path / multi: sample the first ring's outline, simplify, emit corner anchors.
    let path: string | undefined;
    if (geo.type === 'path') path = geo.path;
    else if (geo.type === 'multi') {
        const pg = geo.shapes.find((s: any) => s.type === 'path') as any;
        path = pg ? pg.path : undefined;
    }
    if (!path) return null;
    const cmds = PathUtils.parsePath(path);
    if (!cmds.length) return null;
    const N = 96; const raw: { x: number; y: number }[] = [];
    for (let i = 0; i < N; i++) { const p = PathUtils.getPointOnPath(cmds, i / N); raw.push(L(p.x, p.y)); }
    const eps = Math.max(1, Math.min(w, h) * 0.01);
    const simplified = rdp(raw, eps);
    if (simplified.length < 3) return null;
    return { closed: true, anchors: simplified.map(p => corner(p.x, p.y)) };
}
