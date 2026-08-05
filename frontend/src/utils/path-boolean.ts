/**
 * Pathfinder / boolean operations on shapes.
 *
 * Each element is flattened to world-space polygon rings (curves sampled to a
 * tolerance — a quality trade-off noted in the roadmap), the requested boolean is run
 * via `polygon-clipping`, and the result polygons are converted to corner-anchor
 * subpaths for new `path` elements. A polygon's outer ring + any inner rings (holes)
 * become a multi-subpath path rendered with the even-odd fill rule.
 */

import polygonClipping from 'polygon-clipping';
import type { DrawingElement, PathAnchor, PathSubpath } from '../types';
import { getShapeGeometry } from './shape-geometry';
import { PathUtils, type PathCommand } from './math/path-utils';
import { catmullRomAnchors } from './curve-fit';

export type BooleanOp = 'union' | 'subtract' | 'intersect' | 'exclude';

export type Ring = [number, number][];
export type Poly = Ring[];
type MultiPoly = Poly[];

/**
 * How far a flattened polyline may stray from the true curve, in world units.
 *
 * Polygon clipping can only work on polygons, so every curve has to become line segments
 * somewhere — the only question is how many. A *tolerance* (rather than a fixed sample
 * count) puts the segments where the curvature is: a near-straight span gets two points, a
 * tight corner gets as many as it needs. At a quarter of a unit the deviation is under half
 * a screen pixel until you zoom past 2×, and a plain circle costs roughly 40 points instead
 * of the 64 the old fixed sampling spent regardless of its size.
 */
const FLATTEN_TOLERANCE = 0.25;

/** Hard cap on the recursion, so a pathological (NaN, cusp, huge) curve can't hang the app. */
const FLATTEN_MAX_DEPTH = 16;

/**
 * Adaptively flatten a cubic into `out`, appending everything after p0 (the caller has
 * already emitted the start point). Subdivides while the control points sit farther than
 * the tolerance from the chord — the standard flatness test.
 */
function flattenCubic(
    p0: { x: number; y: number }, p1: { x: number; y: number },
    p2: { x: number; y: number }, p3: { x: number; y: number },
    out: { x: number; y: number }[], depth = 0,
): void {
    if (depth >= FLATTEN_MAX_DEPTH) { out.push(p3); return; }

    // Distance of the two control points from the chord p0→p3.
    const dx = p3.x - p0.x, dy = p3.y - p0.y;
    const chord = Math.hypot(dx, dy);
    let d1: number, d2: number;
    if (chord < 1e-12) {
        // Degenerate chord (a loop back to the start): fall back to raw control distances,
        // else the flatness test reads "flat" for a curve that is anything but.
        d1 = Math.hypot(p1.x - p0.x, p1.y - p0.y);
        d2 = Math.hypot(p2.x - p0.x, p2.y - p0.y);
    } else {
        d1 = Math.abs((p1.x - p0.x) * dy - (p1.y - p0.y) * dx) / chord;
        d2 = Math.abs((p2.x - p0.x) * dy - (p2.y - p0.y) * dx) / chord;
    }
    if (Math.max(d1, d2) <= FLATTEN_TOLERANCE) { out.push(p3); return; }

    // de Casteljau at t = 0.5.
    const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const a1 = mid(p0, p1), b1 = mid(p1, p2), c1 = mid(p2, p3);
    const a2 = mid(a1, b1), b2 = mid(b1, c1);
    const m = mid(a2, b2);
    flattenCubic(p0, a1, a2, m, out, depth + 1);
    flattenCubic(m, b2, c1, p3, out, depth + 1);
}

/**
 * Flatten one contour's worth of parsed path commands into a point list, in the command's
 * own coordinate frame. Quadratics are lifted to cubics so there is one flattener to trust.
 */
function flattenCommands(cmds: PathCommand[]): { x: number; y: number }[] {
    if (!cmds.length) return [];
    const out: { x: number; y: number }[] = [cmds[0].start];
    for (const c of cmds) {
        if (c.type === 'L') {
            out.push(c.points[0]);
        } else if (c.type === 'C') {
            flattenCubic(c.start, c.points[0], c.points[1], c.points[2], out);
        } else if (c.type === 'Q') {
            const [q, end] = c.points;
            const c1 = { x: c.start.x + (2 / 3) * (q.x - c.start.x), y: c.start.y + (2 / 3) * (q.y - c.start.y) };
            const c2 = { x: end.x + (2 / 3) * (q.x - end.x), y: end.y + (2 / 3) * (q.y - end.y) };
            flattenCubic(c.start, c1, c2, end, out);
        } else if (c.type === 'Z') {
            // ringFromPoints closes the ring itself; an explicit duplicate would only add a
            // zero-length edge for the clipper to trip over.
        }
    }
    return out;
}

function ringFromPoints(pts: { x: number; y: number }[]): Ring {
    const r: Ring = pts.map(p => [p.x, p.y]);
    if (r.length > 1) {
        const a = r[0], b = r[r.length - 1];
        if (a[0] !== b[0] || a[1] !== b[1]) r.push([a[0], a[1]]);
    }
    return r;
}

/** Flatten one shape's geometry into world-space rings (one polygon per ring). */
function geometryToRings(geo: any, cx: number, cy: number, angle = 0): Ring[] {
    // getShapeGeometry returns the shape's *unrotated, center-local* geometry. Apply the
    // element's rotation about its centre so polygon ops (Pathfinder, Shape Builder, Knife,
    // Distort, Live Paint) match what the user actually sees for rotated shapes.
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const W = (x: number, y: number): [number, number] => [cx + x * cos - y * sin, cy + x * sin + y * cos];
    const WP = (p: { x: number; y: number }) => ({ x: cx + p.x * cos - p.y * sin, y: cy + p.x * sin + p.y * cos });
    if (!geo) return [];
    if (geo.type === 'rect') {
        const { x, y, w, h } = geo;
        return [[W(x, y), W(x + w, y), W(x + w, y + h), W(x, y + h), W(x, y)]];
    }
    if (geo.type === 'ellipse') {
        // Segment count from the same tolerance the curves use, rather than a flat 64. An
        // inscribed N-gon of radius r deviates by r(1 − cos(π/N)), so a big circle needs more
        // segments than a small one to look equally round — at a fixed 64 a 1000-unit circle
        // was over a unit off the true curve, which is exactly the kind of visible drift that
        // makes a cut piece not line up with the shape it came from.
        const r = Math.max(Math.abs(geo.rx), Math.abs(geo.ry));
        const ratio = Math.max(0, Math.min(1, 1 - FLATTEN_TOLERANCE / Math.max(r, 1e-6)));
        const N = Math.max(16, Math.min(512, Math.ceil(Math.PI / Math.acos(ratio))));
        const ring: Ring = [];
        for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2; ring.push(W(geo.cx + Math.cos(a) * geo.rx, geo.cy + Math.sin(a) * geo.ry)); }
        return [ring];
    }
    if (geo.type === 'points') {
        return [ringFromPoints(geo.points.map((p: any) => WP(p)))];
    }
    if (geo.type === 'path') {
        const cmds = PathUtils.parsePath(geo.path);
        if (!cmds.length) return [];
        // One ring per contour, each flattened adaptively.
        //
        // This used to take 96 samples at uniform `t` across the path's TOTAL arc length and
        // call the result a single ring. Two things were wrong with that. A multi-contour
        // path (a donut, an 'O', outlined text) has no contour boundaries in the sample
        // stream, so every contour was welded into one ring — knifing outlined text produced
        // nonsense. And 96 samples spread over the whole path is a budget, not a tolerance:
        // a detailed path got a handful of samples per curve and came back visibly faceted,
        // which is what "the knife doesn't follow the shape" looks like.
        const byContour = new Map<number, PathCommand[]>();
        for (const c of cmds) {
            const list = byContour.get(c.subpath);
            if (list) list.push(c); else byContour.set(c.subpath, [c]);
        }
        const rings: Ring[] = [];
        for (const list of byContour.values()) {
            const pts = flattenCommands(list);
            if (pts.length >= 3) rings.push(ringFromPoints(pts.map(WP)));
        }
        return rings;
    }
    if (geo.type === 'multi') {
        return geo.shapes.flatMap((s: any) => geometryToRings(s, cx, cy, angle));
    }
    return [];
}

/** Signed area of a ring (shoelace). Sign gives the winding direction. */
function ringArea(ring: Ring): number {
    let a = 0;
    for (let i = 0, n = ring.length; i < n; i++) {
        const [x1, y1] = ring[i], [x2, y2] = ring[(i + 1) % n];
        a += x1 * y2 - x2 * y1;
    }
    return a / 2;
}

/** Is `p` inside `ring`? Ray casting; used only to nest holes inside their outer ring. */
function pointInRing(p: [number, number], ring: Ring): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i], [xj, yj] = ring[j];
        if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

/**
 * A single element as a MultiPolygon, rotation included.
 *
 * Rings are **nested**: a ring contained by an odd number of others is a hole and is
 * attached to its immediate parent, matching the even-odd rule the renderer fills with.
 * This used to be `rings.map(r => [r])` — every ring its own solid polygon — so a shape
 * with counters lost them the moment it went through any polygon operation. Knifing a
 * donut filled in the middle; knifing outlined text filled every 'o' and 'e'.
 */
export function elementToMultiPolygon(el: DrawingElement): MultiPoly {
    const geo = getShapeGeometry(el);
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    const rings = geometryToRings(geo, cx, cy, el.angle || 0).filter(r => r.length >= 4);
    if (rings.length <= 1) return rings.map(r => [r]);

    // Largest first, so a ring's parent is always already placed when we get to it.
    const order = rings.map((r, i) => ({ r, i, area: Math.abs(ringArea(r)) }))
        .sort((a, b) => b.area - a.area);

    const polys: Poly[] = [];
    const polyIndexOf = new Map<number, number>();   // ring index → index in `polys`
    const depthOf = new Map<number, number>();       // ring index → nesting depth

    for (const { r, i } of order) {
        // A representative interior point: ray casting on a vertex is ambiguous, so use the
        // midpoint of the first edge, which lies on the boundary but not on a vertex of any
        // *other* ring except by coincidence.
        const probe: [number, number] = [(r[0][0] + r[1][0]) / 2, (r[0][1] + r[1][1]) / 2];

        // Deepest already-placed ring that contains this one is its parent.
        let parent = -1, parentDepth = -1;
        for (const { i: j } of order) {
            if (j === i || !depthOf.has(j)) continue;
            const d = depthOf.get(j)!;
            if (d > parentDepth && pointInRing(probe, rings[j])) { parent = j; parentDepth = d; }
        }

        const depth = parent === -1 ? 0 : parentDepth + 1;
        depthOf.set(i, depth);

        if (depth % 2 === 1 && parent !== -1) {
            // Odd depth → a hole in its parent's polygon.
            polys[polyIndexOf.get(parent)!].push(r);
            polyIndexOf.set(i, polyIndexOf.get(parent)!);
        } else {
            // Even depth → solid: either an outer ring, or an island sitting inside a hole.
            polyIndexOf.set(i, polys.length);
            polys.push([r]);
        }
    }
    return polys;
}

/** Outer-ring of a result polygon → corner anchors (relative to its own bbox). */
export function ringToPathAnchors(ring: Ring): { anchors: PathAnchor[]; minX: number; minY: number; width: number; height: number } | null {
    // Drop the duplicated closing point.
    let pts = ring.slice();
    if (pts.length > 1) {
        const a = pts[0], b = pts[pts.length - 1];
        if (a[0] === b[0] && a[1] === b[1]) pts = pts.slice(0, -1);
    }
    if (pts.length < 3) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of pts) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
    const anchors: PathAnchor[] = pts.map(([x, y]) => ({ x: x - minX, y: y - minY, kind: 'corner' as const }));
    return { anchors, minX, minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

/** Drop the duplicated closing point and return a clean ring (≥3 distinct points) or null. */
function cleanRing(ring: Ring): Ring | null {
    let pts = ring.slice();
    if (pts.length > 1) {
        const a = pts[0], b = pts[pts.length - 1];
        if (a[0] === b[0] && a[1] === b[1]) pts = pts.slice(0, -1);
    }
    return pts.length >= 3 ? pts : null;
}

/**
 * A result polygon (outer ring + holes) → multiple corner-anchor subpaths, all relative
 * to the polygon's combined bbox. The outer ring + every inner hole become subpaths;
 * even-odd fill turns the inner rings into holes. Returns null if the outer ring is degenerate.
 */
export function polyToPathSubpaths(poly: Poly): { subpaths: PathSubpath[]; minX: number; minY: number; width: number; height: number } | null {
    const rings = poly.map(cleanRing).filter((r): r is Ring => !!r);
    if (rings.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const r of rings) for (const [x, y] of r) {
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    const subpaths: PathSubpath[] = rings.map(r => ({
        anchors: r.map(([x, y]) => ({ x: x - minX, y: y - minY, kind: 'corner' as const })),
        closed: true,
    }));
    return { subpaths, minX, minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

/**
 * Like {@link polyToPathSubpaths}, but each ring becomes SMOOTH Bézier anchors (a curved
 * edge) rather than straight corner anchors — used by the Blob Brush so its outline reads as
 * smooth, not faceted. Each ring is RDP-simplified by `simplifyEps` (drops union/scallop
 * noise) then a closed Catmull-Rom spline is fitted through the survivors. Bézier handles are
 * included in the bbox so they aren't clipped.
 */
export function polyToSmoothSubpaths(poly: Poly, simplifyEps = 0): { subpaths: PathSubpath[]; minX: number; minY: number; width: number; height: number } | null {
    const ringAnchors: PathAnchor[][] = [];
    for (const ring of poly) {
        const cleaned = cleanRing(simplifyEps > 0 ? simplifyRing(ring, simplifyEps) : ring);
        if (!cleaned) continue;
        const anchors = catmullRomAnchors(cleaned.map(([x, y]) => ({ x, y })), true);
        if (anchors.length >= 3) ringAnchors.push(anchors);
    }
    if (ringAnchors.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const anchors of ringAnchors) for (const a of anchors) {
        const xs = [a.x, a.x + (a.outX ?? 0), a.x + (a.inX ?? 0)];
        const ys = [a.y, a.y + (a.outY ?? 0), a.y + (a.inY ?? 0)];
        minX = Math.min(minX, ...xs); maxX = Math.max(maxX, ...xs);
        minY = Math.min(minY, ...ys); maxY = Math.max(maxY, ...ys);
    }
    const subpaths: PathSubpath[] = ringAnchors.map(anchors => ({
        anchors: anchors.map(a => ({ ...a, x: a.x - minX, y: a.y - minY })),
        closed: true,
    }));
    return { subpaths, minX, minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

/**
 * Run a boolean op over elements (in the given order — `subtract` is first minus the
 * rest). Returns the result polygons (world-space; each = outer ring + holes), or [] if empty.
 */
export function runBooleanOp(elements: DrawingElement[], op: BooleanOp): Poly[] {
    if (elements.length < 2) return [];
    const polys = elements.map(elementToMultiPolygon).filter(mp => mp.length > 0);
    if (polys.length < 2) return [];
    const [first, ...rest] = polys;
    let result: MultiPoly;
    try {
        if (op === 'union') result = polygonClipping.union(first, ...rest) as MultiPoly;
        else if (op === 'intersect') result = polygonClipping.intersection(first, ...rest) as MultiPoly;
        else if (op === 'exclude') result = polygonClipping.xor(first, ...rest) as MultiPoly;
        else result = polygonClipping.difference(first, ...rest) as MultiPoly; // subtract
    } catch {
        return [];
    }
    // Each result polygon keeps its outer ring + any holes (even-odd subpaths downstream).
    return (result || []).filter(poly => poly && poly.length > 0 && poly[0] && poly[0].length >= 4);
}

// ── Face-level Shape Builder ─────────────────────────────────────────────────
// Decompose a set of (overlapping) shapes into atomic "faces" — the maximal
// regions each bounded by a unique subset of the input shapes. This is what
// Illustrator's Shape Builder operates on: you paint over individual faces (e.g.
// just the lens where two circles overlap) to merge or delete them, rather than
// whole shapes.

/** A maximal region covered by exactly the shapes in `subset` (indices into the input). */
export interface ShapeFace {
    key: string;          // stable id = sorted subset, e.g. "0|2"
    subset: number[];     // indices of input elements covering this face
    region: MultiPoly;    // world-space geometry (outer ring + holes per poly)
}

function multiPolyArea(mp: MultiPoly): number {
    let area = 0;
    for (const poly of mp) {
        for (const ring of poly) {
            let a = 0;
            for (let i = 0, n = ring.length - 1; i < n; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
            area += Math.abs(a) / 2;
        }
    }
    return area;
}

/** Point-in-region test honouring holes: inside an odd number of rings of any poly. */
export function pointInMultiPoly(mp: MultiPoly, x: number, y: number): boolean {
    for (const poly of mp) {
        let inside = false;
        for (const ring of poly) {
            for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
                if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-12) + xi)) inside = !inside;
            }
        }
        if (inside) return true;
    }
    return false;
}

/**
 * Compute the atomic faces of `elements`. For every non-empty subset S of the
 * inputs, the face is `(∩ shapes in S) − (∪ shapes not in S)`; empty results are
 * dropped. Bounded to `maxN` shapes (2^N subsets) — callers should fall back to
 * whole-shape union beyond that. Faces are returned largest-first so a stroke
 * point that lands on overlapping faces (it shouldn't, they're disjoint) is stable.
 */
export function computeShapeFaces(elements: DrawingElement[], maxN = 8): ShapeFace[] {
    const mps = elements.map(elementToMultiPolygon);
    const n = mps.length;
    if (n < 2 || n > maxN) return [];
    const faces: ShapeFace[] = [];
    for (let mask = 1; mask < (1 << n); mask++) {
        const subset: number[] = [];
        for (let i = 0; i < n; i++) if (mask & (1 << i)) subset.push(i);
        const inside = subset.map(i => mps[i]).filter(mp => mp.length);
        if (inside.length !== subset.length) continue; // some shape had no geometry
        let region: MultiPoly;
        try {
            region = inside.length === 1 ? inside[0]
                : polygonClipping.intersection(inside[0] as any, ...inside.slice(1) as any) as MultiPoly;
            if (!region || !region.length) continue;
            const outside = mps.filter((_, i) => !subset.includes(i)).filter(mp => mp.length);
            if (outside.length) {
                region = polygonClipping.difference(region as any, ...outside as any) as MultiPoly;
            }
        } catch { continue; }
        region = (region || []).filter(p => p && p[0] && p[0].length >= 4);
        if (!region.length || multiPolyArea(region) < 0.5) continue;
        faces.push({ key: subset.join('|'), subset, region });
    }
    faces.sort((a, b) => multiPolyArea(b.region) - multiPolyArea(a.region));
    return faces;
}

/**
 * Knife — split a region into the two pieces lying on either side of the infinite line
 * through p0→p1. Builds a large half-plane quad per side and intersects. Returns
 * [posSide, negSide]; a side is [] when the line misses the region on that side.
 */
export function splitMultiPolyByLine(mp: MultiPoly, p0: [number, number], p1: [number, number]): [MultiPoly, MultiPoly] {
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;   // along line
    const nx = -uy, ny = ux;              // normal
    const L = 1e6;
    const A: [number, number] = [p0[0] - ux * L, p0[1] - uy * L];
    const B: [number, number] = [p1[0] + ux * L, p1[1] + uy * L];
    const posQuad: Poly = [[A, B, [B[0] + nx * L, B[1] + ny * L], [A[0] + nx * L, A[1] + ny * L], A]];
    const negQuad: Poly = [[A, B, [B[0] - nx * L, B[1] - ny * L], [A[0] - nx * L, A[1] - ny * L], A]];
    let pos: MultiPoly = [], neg: MultiPoly = [];
    try { pos = polygonClipping.intersection(mp as any, [posQuad] as any) as MultiPoly; } catch { /* noop */ }
    try { neg = polygonClipping.intersection(mp as any, [negQuad] as any) as MultiPoly; } catch { /* noop */ }
    const clean = (m: MultiPoly) => (m || []).filter(p => p && p[0] && p[0].length >= 4);
    return [clean(pos), clean(neg)];
}

/** Chaikin corner-cutting on a closed ring — rounds off the scalloped union-of-disks outline
 *  into a smooth blob edge. Each iteration replaces every corner with two points at 1/4 & 3/4. */
export function chaikinRing(ring: Ring, iterations = 2): Ring {
    let pts: Ring = ring;
    for (let it = 0; it < iterations; it++) {
        const n = pts.length;
        if (n < 4) break;
        const closed = pts[0][0] === pts[n - 1][0] && pts[0][1] === pts[n - 1][1];
        const src = closed ? pts.slice(0, n - 1) : pts;
        const m = src.length;
        const out: Ring = [];
        for (let i = 0; i < m; i++) {
            const a = src[i], b = src[(i + 1) % m];
            out.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]]);
            out.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
        }
        out.push([out[0][0], out[0][1]]); // close
        pts = out;
    }
    return pts;
}

/** Ramer-Douglas-Peucker simplify of a closed ring (drops near-collinear / noise vertices). */
export function simplifyRing(ring: Ring, eps: number): Ring {
    if (ring.length < 5 || eps <= 0) return ring;
    const closed = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];
    const src = closed ? ring.slice(0, ring.length - 1) : ring;
    const n = src.length;
    if (n < 4) return ring;
    const keep = new Array(n).fill(false);
    keep[0] = true; keep[n - 1] = true;
    const seg = (lo: number, hi: number) => {
        let maxD = -1, idx = -1;
        const a = src[lo], b = src[hi];
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const len2 = dx * dx + dy * dy || 1;
        for (let i = lo + 1; i < hi; i++) {
            const t = ((src[i][0] - a[0]) * dx + (src[i][1] - a[1]) * dy) / len2;
            const px = a[0] + t * dx, py = a[1] + t * dy;
            const d = Math.hypot(src[i][0] - px, src[i][1] - py);
            if (d > maxD) { maxD = d; idx = i; }
        }
        if (maxD > eps && idx > lo) { keep[idx] = true; seg(lo, idx); seg(idx, hi); }
    };
    seg(0, n - 1);
    const out: Ring = []; for (let i = 0; i < n; i++) if (keep[i]) out.push(src[i]);
    out.push([out[0][0], out[0][1]]); // close
    return out;
}

/** Simplify (optional) then Chaikin-smooth every ring of a polygon (outer + holes). */
export function smoothPoly(poly: Poly, iterations = 2, simplifyEps = 0): Poly {
    return poly.map(ring => chaikinRing(simplifyEps > 0 ? simplifyRing(ring, simplifyEps) : ring, iterations));
}

/** A regular-polygon disk ring (closed) approximating a circle. */
export function diskRing(cx: number, cy: number, r: number, seg = 16): Ring {
    const ring: Ring = [];
    for (let i = 0; i <= seg; i++) { const a = (i / seg) * Math.PI * 2; ring.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return ring;
}

/** Do two MultiPolygons actually overlap (not just bbox)? Used to limit Blob-Brush merging. */
export function polysIntersect(a: Poly[], b: Poly[]): boolean {
    if (!a.length || !b.length) return false;
    try {
        const out = polygonClipping.intersection(a as any, b as any) as MultiPoly;
        return !!(out && out.length && out[0] && out[0][0] && out[0][0].length >= 4);
    } catch { return false; }
}

/** Union a list of single-polygons into a MultiPoly (used by the Blob Brush: union of disks). */
export function unionPolys(polys: Poly[]): Poly[] {
    const valid = polys.filter(p => p && p[0] && p[0].length >= 4);
    if (!valid.length) return [];
    if (valid.length === 1) return [valid[0]];
    try {
        const mps = valid.map(p => [p] as any);
        const out = polygonClipping.union(mps[0], ...mps.slice(1)) as MultiPoly;
        return (out || []).filter(p => p && p[0] && p[0].length >= 4);
    } catch { return [valid[0]]; }
}

/** Subtract `cutters` from a target MultiPoly (Path Eraser carving a swath out of a shape). */
export function subtractPolys(target: Poly[], cutters: Poly[]): Poly[] {
    if (!target.length) return [];
    if (!cutters.length) return target;
    try {
        const out = polygonClipping.difference(target as any, ...cutters.map(c => [c]) as any) as MultiPoly;
        return (out || []).filter(p => p && p[0] && p[0].length >= 4);
    } catch { return target; }
}

/** Union several faces' regions into one MultiPoly (empty → []). */
export function unionFaces(faces: ShapeFace[]): MultiPoly {
    const regions = faces.map(f => f.region).filter(r => r.length);
    if (!regions.length) return [];
    if (regions.length === 1) return regions[0];
    try {
        return polygonClipping.union(regions[0] as any, ...regions.slice(1) as any) as MultiPoly;
    } catch { return regions[0]; }
}
