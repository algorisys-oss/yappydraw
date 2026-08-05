/**
 * Cutting a path *where you clicked*.
 *
 * The Scissors tool used to split at the nearest existing **anchor**, which is why cuts
 * "didn't follow the path": click halfway along a curve and the cut jumps to whichever
 * anchor happened to be closest, often a long way off and always in a place you didn't
 * choose. A path drawn with four anchors could only be cut in four places.
 *
 * This finds the closest point on the actual outline — including the interior of Bézier
 * segments — and subdivides that segment there with de Casteljau, which is exact: the two
 * halves reproduce the original curve, so nothing about the shape moves when you cut it.
 * Everything here is pure so it can be tested without a store, a canvas, or a pointer.
 */

import type { PathAnchor } from '../types';

export interface CutSubpath {
    anchors: PathAnchor[];
    closed: boolean;
}

/** Where on a path a point lands: which subpath, which segment, and how far along it. */
export interface PathLocation {
    sub: number;
    seg: number;
    /** Parameter along the segment's cubic, 0..1. */
    t: number;
    /** Distance from the query point to the outline, in the same units as the input. */
    distance: number;
    /** The point on the outline itself. */
    x: number;
    y: number;
}

const clone = (a: PathAnchor): PathAnchor => ({ ...a });

/** The four control points of the cubic from `a` to `b` (a straight run is a degenerate cubic). */
function controlPoints(a: PathAnchor, b: PathAnchor) {
    return [
        { x: a.x, y: a.y },
        { x: a.x + (a.outX ?? 0), y: a.y + (a.outY ?? 0) },
        { x: b.x + (b.inX ?? 0), y: b.y + (b.inY ?? 0) },
        { x: b.x, y: b.y },
    ] as const;
}

/** Point on a cubic at parameter t. */
export function cubicAt(a: PathAnchor, b: PathAnchor, t: number): { x: number; y: number } {
    const [p0, p1, p2, p3] = controlPoints(a, b);
    const mt = 1 - t;
    const w0 = mt * mt * mt, w1 = 3 * mt * mt * t, w2 = 3 * mt * t * t, w3 = t * t * t;
    return {
        x: w0 * p0.x + w1 * p1.x + w2 * p2.x + w3 * p3.x,
        y: w0 * p0.y + w1 * p1.y + w2 * p2.y + w3 * p3.y,
    };
}

/** How many segments a subpath has (a closed one has the extra wrap-around segment). */
export const segmentCount = (sp: CutSubpath): number =>
    sp.anchors.length < 2 ? 0 : (sp.closed ? sp.anchors.length : sp.anchors.length - 1);

/**
 * Closest point on a set of subpaths to (`px`, `py`), in the same (element-local) frame.
 *
 * Coarse sample then refine. The coarse pass alone — which is all the anchor-insertion code
 * did — quantises the answer to 1/24th of a segment, so on a long segment the cut can land
 * several pixels from where you clicked. The refinement is a few golden-section iterations
 * around the best sample, which costs nothing and takes the error to well under a pixel.
 */
export function closestPointOnSubpaths(
    subs: CutSubpath[], px: number, py: number, coarse = 24, refineIters = 24,
): PathLocation | null {
    let best: PathLocation | null = null;

    for (let s = 0; s < subs.length; s++) {
        const sp = subs[s];
        const n = sp.anchors.length;
        const segs = segmentCount(sp);
        for (let g = 0; g < segs; g++) {
            const a = sp.anchors[g], b = sp.anchors[(g + 1) % n];
            const distAt = (t: number) => {
                const p = cubicAt(a, b, t);
                return Math.hypot(p.x - px, p.y - py);
            };

            // Coarse scan for the basin containing the minimum.
            let bt = 0, bd = Infinity;
            for (let k = 0; k <= coarse; k++) {
                const t = k / coarse, d = distAt(t);
                if (d < bd) { bd = d; bt = t; }
            }

            // Golden-section search inside the neighbouring samples. The distance function
            // along a cubic can have several minima, but not inside one coarse cell, so
            // bracketing to the cell either side of the best sample is safe.
            let lo = Math.max(0, bt - 1 / coarse), hi = Math.min(1, bt + 1 / coarse);
            const phi = (Math.sqrt(5) - 1) / 2;
            let c = hi - phi * (hi - lo), d2 = lo + phi * (hi - lo);
            let fc = distAt(c), fd = distAt(d2);
            for (let i = 0; i < refineIters && hi - lo > 1e-9; i++) {
                if (fc < fd) { hi = d2; d2 = c; fd = fc; c = hi - phi * (hi - lo); fc = distAt(c); }
                else { lo = c; c = d2; fc = fd; d2 = lo + phi * (hi - lo); fd = distAt(d2); }
            }
            const t = (lo + hi) / 2;
            const dist = distAt(t);
            if (!best || dist < best.distance) {
                const p = cubicAt(a, b, t);
                best = { sub: s, seg: g, t, distance: dist, x: p.x, y: p.y };
            }
        }
    }
    return best;
}

/**
 * Split the segment between `a` and `b` at `t`, de Casteljau.
 *
 * Mutates `a.out` and `b.in` to the shortened tangents and returns the new anchor sitting
 * between them. The two resulting curves are exactly the original one, so the outline does
 * not shift by a pixel when a cut is made. A straight segment stays straight, and gets a
 * plain corner anchor rather than handles that would make it subtly bend later.
 */
export function splitSegmentAt(a: PathAnchor, b: PathAnchor, t: number): PathAnchor {
    const curved = a.outX !== undefined || a.outY !== undefined || b.inX !== undefined || b.inY !== undefined;
    const lerp = (p: { x: number; y: number }, q: { x: number; y: number }) =>
        ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });

    if (!curved) {
        const m = lerp({ x: a.x, y: a.y }, { x: b.x, y: b.y });
        return { x: m.x, y: m.y, kind: 'corner' };
    }

    const [p0, p1, p2, p3] = controlPoints(a, b);
    const A = lerp(p0, p1), B = lerp(p1, p2), C = lerp(p2, p3);
    const D = lerp(A, B), E = lerp(B, C);
    const F = lerp(D, E); // the point on the curve at t

    a.outX = A.x - a.x; a.outY = A.y - a.y;
    b.inX = C.x - b.x; b.inY = C.y - b.y;
    return { x: F.x, y: F.y, inX: D.x - F.x, inY: D.y - F.y, outX: E.x - F.x, outY: E.y - F.y, kind: 'smooth' };
}

/**
 * How close to an existing anchor counts as "at" it. Splitting at t≈0 or t≈1 would insert a
 * duplicate anchor a fraction of a unit from one that already exists, leaving a zero-length
 * segment that every downstream consumer then has to defend against.
 */
const T_EPSILON = 1e-6;

/**
 * Cut a subpath at (`seg`, `t`), returning the resulting **open** anchor lists.
 *
 * A closed subpath opens up at the cut and becomes one open path that starts and ends there
 * (the cut point appears at both ends). An open subpath becomes two. Returns `null` when
 * the cut wouldn't actually divide anything — cutting an open path at its very first or
 * last anchor would just hand back the original with an orphaned single point.
 */
export function cutSubpathAt(
    anchors: PathAnchor[], closed: boolean, seg: number, t: number,
): PathAnchor[][] | null {
    if (anchors.length < 2) return null;
    const out = anchors.map(clone);
    const n = out.length;

    // Where the cut lands in the anchor list, inserting a new anchor unless it coincides
    // with one that is already there.
    let k: number;
    if (t <= T_EPSILON) {
        k = seg;
    } else if (t >= 1 - T_EPSILON) {
        k = (seg + 1) % n;
    } else {
        const a = out[seg], b = out[(seg + 1) % n];
        const mid = splitSegmentAt(a, b, t);
        out.splice(seg + 1, 0, mid);
        k = seg + 1;
    }

    if (closed) {
        // Reopen the ring at k: walk all the way round and come back to the cut point, which
        // therefore appears at both ends. `out.length` is re-read because the split above may
        // have grown the array.
        const m = out.length;
        const rotated: PathAnchor[] = [];
        for (let i = 0; i <= m; i++) rotated.push(clone(out[(k + i) % m]));
        return rotated.length >= 2 ? [rotated] : null;
    }

    // Open path: cutting at an endpoint doesn't divide it.
    if (k <= 0 || k >= out.length - 1) return null;
    const first = out.slice(0, k + 1).map(clone);
    const second = out.slice(k).map(clone);
    if (first.length < 2 || second.length < 2) return null;
    return [first, second];
}
