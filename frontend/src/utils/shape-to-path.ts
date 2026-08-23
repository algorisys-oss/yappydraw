import { cornerRadiiPx } from './corner-radius';
/**
 * Convert a shape's geometry into editable vector-path anchors.
 *
 * Produces clean output for the common cases — ellipse/circle → 4 smooth Bézier
 * anchors, rectangle → 4 corners, polygonal shapes → exact corner anchors — and converts
 * arbitrary `path`/`multi` geometry command-by-command, so arcs and curves come through
 * unchanged (sampling + Ramer–Douglas–Peucker survives only as a fallback for geometry
 * that yields no usable contour). Anchors are returned in element-origin coords
 * (0..width / 0..height), so a `path` element placed at the shape's x/y/width/height
 * matches the original.
 */

import type { DrawingElement, PathAnchor, PathSubpath } from '../types';
import { getShapeGeometry } from './shape-geometry';
import { PathUtils, type PathCommand } from './math/path-utils';
import { geometryToRings, unionPolys } from './path-boolean';

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

/** Two handles are "smooth" when they are collinear and point opposite ways. */
function isSmoothPair(a: PathAnchor): boolean {
    if (a.inX === undefined || a.outX === undefined) return false;
    const ix = a.inX, iy = a.inY ?? 0, ox = a.outX, oy = a.outY ?? 0;
    const m = Math.hypot(ix, iy) * Math.hypot(ox, oy);
    if (m <= 0) return false;
    const dot = ix * ox + iy * oy;
    const cross = ix * oy - iy * ox;
    return dot < 0 && Math.abs(cross) / m < 1e-3;
}

const HANDLE_EPS = 1e-6;
const SEAM_EPS = 1e-4;

/**
 * SVG commands → path anchors, EXACTLY — no sampling.
 *
 * The old fallback walked the outline at 96 even steps and ran Ramer–Douglas–Peucker over
 * the result, which turned every curve into a polygon: converting a `database` (or any
 * other arc-based shape) to a path produced a faceted silhouette with visibly straight
 * chords where the barrel and the cap had been. `parsePath` already lowers `A` to cubics,
 * so every command has an exact anchor+handle form and there is nothing to approximate.
 *
 * Commands are regrouped by `subpath`, so a multi-contour path converts to one entry per
 * contour instead of being welded into a single ring.
 */
function commandsToSubpaths(cmds: PathCommand[]): PathSubpath[] {
    const bySub = new Map<number, PathCommand[]>();
    for (const c of cmds) {
        const arr = bySub.get(c.subpath);
        if (arr) arr.push(c); else bySub.set(c.subpath, [c]);
    }

    const out: PathSubpath[] = [];
    for (const group of bySub.values()) {
        const segs = group.filter(c => c.type !== 'Z');
        if (!segs.length) continue;
        let closed = group.some(c => c.type === 'Z');

        const anchors: PathAnchor[] = [{ x: segs[0].start.x, y: segs[0].start.y, kind: 'corner' }];
        for (const c of segs) {
            const prev = anchors[anchors.length - 1];
            if (c.type === 'L') {
                const p = c.points[0];
                anchors.push({ x: p.x, y: p.y, kind: 'corner' });
                continue;
            }
            // Q is raised to its equivalent cubic (control point at 2/3 of the way from each
            // end) so anchors only ever carry one kind of handle.
            let c1: { x: number; y: number }, c2: { x: number; y: number }, end: { x: number; y: number };
            if (c.type === 'C') { c1 = c.points[0]; c2 = c.points[1]; end = c.points[2]; }
            else {
                const q = c.points[0]; end = c.points[1];
                c1 = { x: c.start.x + (2 / 3) * (q.x - c.start.x), y: c.start.y + (2 / 3) * (q.y - c.start.y) };
                c2 = { x: end.x + (2 / 3) * (q.x - end.x), y: end.y + (2 / 3) * (q.y - end.y) };
            }
            // Zero handles are left ABSENT rather than written as 0 — `anchorsToPathData`
            // emits a cubic as soon as either endpoint has any handle, so explicit zeros
            // turn straight edges into degenerate curves (same rule as the rounded-rect
            // branch above).
            const ox = c1.x - c.start.x, oy = c1.y - c.start.y;
            if (Math.abs(ox) > HANDLE_EPS || Math.abs(oy) > HANDLE_EPS) { prev.outX = ox; prev.outY = oy; }
            const a: PathAnchor = { x: end.x, y: end.y, kind: 'corner' };
            const ix = c2.x - end.x, iy = c2.y - end.y;
            if (Math.abs(ix) > HANDLE_EPS || Math.abs(iy) > HANDLE_EPS) { a.inX = ix; a.inY = iy; }
            anchors.push(a);
        }

        // A contour that walks back to where it started is closed whether or not it says `Z`
        // (shape-geometry writes several such paths). Merge the duplicate end anchor into the
        // first, carrying its in-handle across, so the seam is a normal joint and not a
        // doubled anchor with a zero-length segment.
        const first = anchors[0], last = anchors[anchors.length - 1];
        if (anchors.length > 2 && Math.hypot(last.x - first.x, last.y - first.y) < SEAM_EPS) {
            if (last.inX !== undefined) { first.inX = last.inX; first.inY = last.inY; }
            anchors.pop();
            closed = true;
        }
        if (anchors.length < 2) continue;
        for (const a of anchors) if (isSmoothPair(a)) a.kind = 'smooth';
        out.push({ anchors, closed });
    }
    return out;
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
 * Result of a conversion.
 *
 * `anchors`/`closed` are the primary contour and stay the whole answer for every caller
 * that only wants one ring (Knife, Scissors, Pathfinder, Warp, Turntable). `subpaths` is
 * populated ONLY when the geometry genuinely has more than one contour, so those callers
 * can keep ignoring it; Convert to Path uses it to keep compound shapes compound.
 */
export interface ShapeToPathResult {
    anchors: PathAnchor[];
    closed: boolean;
    subpaths?: PathSubpath[];
}

/**
 * @returns anchors (element-origin coords) + closed flag, or null if the shape can't
 * be converted (already a path, or no geometry).
 */
export function shapeToPath(el: DrawingElement): ShapeToPathResult | null {
    if (el.type === 'path') return null;

    // Line / connector / freehand elements store `el.points` in ELEMENT-ORIGIN coords
    // (0,0 = top-left), unlike the centred geometry other shapes emit — so use them
    // directly, WITHOUT the centre offset, or the path shifts by (w/2, h/2).
    if (el.points && el.points.length > 0) {
        const pts = normalizePoints(el.points);
        if (pts.length < 2) return null;
        return { anchors: pts.map(p => corner(p.x, p.y)), closed: false };
    }

    // A line or arrow created from a bounding box carries NO `points` — its geometry is
    // just the two endpoints, (x, y) → (x + width, y + height). `getShapeGeometry` has no
    // case for these types, so without this they converted to nothing at all: the Knife
    // silently skipped a line it was dragged straight across, and the Scissors answered
    // "cannot split this shape". Keep the element's own sign convention (w/h may be
    // negative for a line drawn right-to-left) rather than normalizing it here.
    if (el.type === 'line' || el.type === 'arrow') {
        return { anchors: [corner(0, 0), corner(el.width, el.height)], closed: false };
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
    // path / multi: convert the outline command by command (see `commandsToSubpaths`).
    let path: string | undefined;
    if (geo.type === 'multi') {
        // A solid that publishes its silhouette (`outline`) gets converted as the whole solid.
        path = (geo as any).outline;
        if (!path) {
            // Otherwise, union the faces into one silhouette. The 3D block primitives —
            // isometricCube, solidBlock, perspectiveBlock, openBox — are several `points`
            // faces and no `path` face at all, so the old "first path face" guess found
            // nothing and they simply could not be converted, warped, knifed, turned on a
            // turntable or fed to the Pathfinder. ("The 3d shapes do not have an option to
            // convert them to path and tweak nodes into desired shape.")
            const solid = solidSilhouette(geo, w, h);
            if (solid) return solid;
            const pg = geo.shapes.find((s: any) => s.type === 'path') as any;
            path = pg ? pg.path : undefined;
        }
    } else if (geo.type === 'path') {
        path = geo.path;
    }
    if (!path) return null;
    const cmds = PathUtils.parsePath(path);
    if (!cmds.length) return null;

    // Exact first: every command has an anchor+handle form, so the curves survive the
    // conversion unchanged. Sampling is kept only as a safety net for a path this can't
    // make at least one usable contour out of.
    const exact = commandsToSubpaths(cmds);
    if (exact.length) {
        const moved = exact.map(sp => ({
            closed: sp.closed,
            anchors: sp.anchors.map(a => { const p = L(a.x, a.y); return { ...a, x: p.x, y: p.y }; }),
        }));
        // Biggest contour first: it is the outline, and it is what single-ring callers read.
        moved.sort((a, b) => contourArea(b.anchors) - contourArea(a.anchors));
        const primary = moved[0];
        return moved.length > 1
            ? { anchors: primary.anchors, closed: primary.closed, subpaths: moved }
            : { anchors: primary.anchors, closed: primary.closed };
    }

    const N = 96; const raw: { x: number; y: number }[] = [];
    for (let i = 0; i < N; i++) { const p = PathUtils.getPointOnPath(cmds, i / N); raw.push(L(p.x, p.y)); }
    const eps = Math.max(1, Math.min(w, h) * 0.01);
    const simplified = rdp(raw, eps);
    if (simplified.length < 3) return null;
    return { closed: true, anchors: simplified.map(p => corner(p.x, p.y)) };
}

/**
 * Silhouette of a multi-face solid: the union of its faces, as corner anchors.
 *
 * A block primitive publishes its faces (top / left / front quads) and nothing that says
 * "this is the outline", so converters had to guess and came up empty. The union of the
 * faces is the honest answer — it is the shape's real silhouette, holes included (an
 * `openBox` genuinely has an opening) — and the faces are polygons, so nothing is lost by
 * flattening. Note this converts the SILHOUETTE: the interior edges that make the block read
 * as 3D are shading, not outline, and do not survive (the same trade the Pathfinder makes).
 *
 * Flattened at `cx`/`cy` = `w/2`, `h/2` and angle 0, which turns the centre-local geometry
 * into the element-origin frame the rest of this module returns. Rotation is deliberately not
 * applied: path anchors are stored unrotated, and the element keeps its own `angle`.
 */
function solidSilhouette(geo: any, w: number, h: number): ShapeToPathResult | null {
    let polys: [number, number][][][];
    try {
        // Raw rings, one per face — NOT `elementToMultiPolygon`, whose containment pass would
        // read one overlapping face as a hole in another and hand back nonsense. The faces are
        // then genuinely unioned, so a cube converts to one hexagonal outline instead of to
        // its three separate quads, and any real opening falls out as a hole of the union.
        const rings = geometryToRings(geo, w / 2, h / 2, 0).filter(r => r.length >= 4);
        if (!rings.length) return null;
        polys = unionPolys(rings.map(r => [r])) as any;
    } catch { return null; }
    if (!polys.length) return null;

    // Rings arrive closed (first point repeated); drop the duplicate before it becomes an
    // anchor sitting exactly on top of another one.
    const toSubpath = (ring: [number, number][]): PathSubpath | null => {
        const pts = ring.slice();
        if (pts.length > 1) {
            const a = pts[0], b = pts[pts.length - 1];
            if (Math.abs(a[0] - b[0]) < SEAM_EPS && Math.abs(a[1] - b[1]) < SEAM_EPS) pts.pop();
        }
        if (pts.length < 3) return null;
        return { closed: true, anchors: pts.map(([x, y]) => corner(x, y)) };
    };

    const subs: PathSubpath[] = [];
    for (const poly of polys) for (const ring of poly) {
        const sp = toSubpath(ring as [number, number][]);
        if (sp) subs.push(sp);
    }
    if (!subs.length) return null;
    subs.sort((a, b) => contourArea(b.anchors) - contourArea(a.anchors));
    if (contourArea(subs[0].anchors) <= 0) return null;
    return subs.length > 1
        ? { anchors: subs[0].anchors, closed: true, subpaths: subs }
        : { anchors: subs[0].anchors, closed: true };
}

/** |signed area| of the anchor polygon — good enough to rank contours by size. */
function contourArea(anchors: PathAnchor[]): number {
    let a = 0;
    for (let i = 0; i < anchors.length; i++) {
        const p = anchors[i], q = anchors[(i + 1) % anchors.length];
        a += p.x * q.y - q.x * p.y;
    }
    return Math.abs(a) / 2;
}

/**
 * Stroke-only decoration a shape's RENDERER draws but its fill geometry does not carry —
 * the `database` cap, the bars of a `predefinedProcess`, the rules of an `internalStorage`.
 *
 * `getShapeGeometry` deliberately returns only the silhouette (it is what fills and clips
 * get built from), so converting one of these shapes to a path used to drop the decoration
 * on the floor: a converted database came back as a bare barrel with no cap, which is what
 * made it useless as a starting point for a hand-built cylinder. Convert to Path emits
 * these as separate sibling paths rather than extra subpaths of the body, because subpaths
 * fill even-odd — a cap ring merged into the body would punch a hole in the lid.
 *
 * Coordinates are element-origin (0..width / 0..height), matching `shapeToPath`.
 */
export function shapeDecorationSubpaths(el: DrawingElement): PathSubpath[] {
    const w = Math.abs(el.width), h = Math.abs(el.height);
    if (w <= 0 || h <= 0) return [];
    const seg = (x1: number, y1: number, x2: number, y2: number): PathSubpath =>
        ({ closed: false, anchors: [corner(x1, y1), corner(x2, y2)] });

    switch (el.type) {
        case 'database': {
            // The cap ellipse, as drawn by `flowchart-renderer.getDatabaseTopPath`:
            // centre (w/2, eH), radii (w/2, eH) with eH = h * 0.1. Four smooth anchors,
            // the same circle approximation `shapeToPath` uses for a real ellipse.
            const eH = h * 0.1, rx = w / 2, ry = eH, cx = w / 2, cy = eH;
            const kx = KAPPA * rx, ky = KAPPA * ry;
            return [{
                closed: true,
                anchors: [
                    { x: cx, y: cy - ry, kind: 'smooth', inX: -kx, inY: 0, outX: kx, outY: 0 },
                    { x: cx + rx, y: cy, kind: 'smooth', inX: 0, inY: -ky, outX: 0, outY: ky },
                    { x: cx, y: cy + ry, kind: 'smooth', inX: kx, inY: 0, outX: -kx, outY: 0 },
                    { x: cx - rx, y: cy, kind: 'smooth', inX: 0, inY: ky, outX: 0, outY: -ky },
                ],
            }];
        }
        case 'predefinedProcess': {
            const b = w * 0.1;
            return [seg(b, 0, b, h), seg(w - b, 0, w - b, h)];
        }
        case 'internalStorage': {
            const o = Math.min(w, h) * 0.15;
            return [seg(o, 0, o, h), seg(0, o, w, o)];
        }
        default:
            return [];
    }
}
