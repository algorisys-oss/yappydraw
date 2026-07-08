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
