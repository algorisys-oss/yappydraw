/**
 * Turning a flattened polygon back into a curve — without rounding off its corners.
 *
 * Polygon clipping (Pathfinder, Knife, Shape Builder) only works on straight-edged rings, so
 * everything it returns is a dense polyline: a knifed circle came back as ~40 corner anchors
 * sitting on the arc. Geometrically accurate, but not something you can then *edit* — grab a
 * point and you find a corner where the shape plainly has a curve, and there are dozens of
 * them where the original had four.
 *
 * The naive fix (run the whole ring through a Catmull-Rom spline) is worse: it rounds off the
 * genuine corners too, so a knifed rectangle comes back with bulging edges and the straight
 * line the knife just cut turns into a curve. The corner is exactly the information the
 * flattening threw away and the refit has to recover.
 *
 * So: find the corners, keep them sharp, and fit smooth curves only to the runs between them.
 * A cut across a circle gives two anchors at the ends of the straight cut and a handful of
 * smooth ones along the arc — which is what a person would have drawn.
 */

import type { PathAnchor } from '../types';

export type Pt = { x: number; y: number };

export interface RefitOptions {
    /**
     * Turn (in degrees) above which a vertex counts as a corner rather than a point along a
     * curve. A flattened curve turns by a small amount at every vertex — bounded by the
     * flattening tolerance — while a real corner turns sharply, so the two populations are
     * well separated and the exact threshold is not delicate. 32° comfortably splits them.
     */
    cornerAngleDeg?: number;
    /**
     * How much the outline may turn between one anchor and the next, in degrees.
     *
     * This is the thinning budget, and it is deliberately *not* a distance tolerance. The
     * obvious approach — Douglas–Peucker on the polyline — measures how far the dropped
     * points sit from the straight **chord** between the survivors, but what actually
     * replaces them is a **curve** that bulges out to follow the arc. Judging by the chord
     * therefore refuses to drop anything: on a 48-point circle of radius 100 the sagitta
     * across even two segments is 0.86 units, so every point is "too far" and all 48 survive.
     * Spending anchors per unit of *curvature* is both the right measure and the one that
     * gives a predictable count — a circle gets 360/45 = 8 anchors whether it is 48 points
     * or 500, and a straight run gets 2.
     */
    maxTurnPerAnchorDeg?: number;
}

const DEFAULTS = { cornerAngleDeg: 32, maxTurnPerAnchorDeg: 45 };

const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const len = (p: Pt) => Math.hypot(p.x, p.y);

/** Turn angle at `b` going a → b → c, in degrees. 0 = dead straight. */
function turnDeg(a: Pt, b: Pt, c: Pt): number {
    const u = sub(b, a), v = sub(c, b);
    const lu = len(u), lv = len(v);
    if (lu < 1e-12 || lv < 1e-12) return 0;
    const cos = Math.max(-1, Math.min(1, (u.x * v.x + u.y * v.y) / (lu * lv)));
    return (Math.acos(cos) * 180) / Math.PI;
}

/**
 * Pick `count` indices spread evenly by *accumulated turn* over `cum` (a cumulative-turn
 * array whose last entry is the total).
 *
 * Even spacing is the whole point, and the reason this isn't the obvious "walk along and emit
 * whenever the running total passes the budget". That greedy version leaves whatever is left
 * over as a final short chunk against the seam: on a 48-gon it emitted every 7th vertex (52.5°
 * of turn) and then had only one vertex left before wrapping, so the last arc was 7.5° while
 * its neighbours were 52.5°. The handles derived from that stub are ~6× too short, and the
 * two segments either side of the seam picked up 5.9 units of error on a 100-unit circle
 * while every other segment was within 0.5. Dividing the total into equal parts up front has
 * no leftover and no seam.
 */
function pickEvenlyByTurn(cum: number[], count: number): number[] {
    const total = cum[cum.length - 1];
    const idx: number[] = [];
    let from = 0;
    for (let j = 1; j < count; j++) {
        const target = (total * j) / count;
        // Cumulative turn is non-decreasing, so scan forward from the previous pick.
        let best = from, bestD = Infinity;
        for (let i = from; i < cum.length; i++) {
            const d = Math.abs(cum[i] - target);
            if (d < bestD) { bestD = d; best = i; }
            else if (cum[i] > target) break;
        }
        if (best > from) { idx.push(best); from = best; }
    }
    return idx;
}

/**
 * Thin an **open** run, keeping both ends, spending roughly one anchor per `maxTurn` degrees
 * of turning. Collinear stretches contribute no turn and so cost no anchors.
 */
function thinRun(pts: Pt[], maxTurn: number): Pt[] {
    if (pts.length <= 2) return pts.slice();
    // Cumulative turn at each interior vertex (ends have no turn of their own).
    const cum: number[] = [0];
    for (let i = 1; i < pts.length - 1; i++) cum.push(cum[cum.length - 1] + turnDeg(pts[i - 1], pts[i], pts[i + 1]));
    const total = cum[cum.length - 1];
    if (total < 1e-9) return [pts[0], pts[pts.length - 1]];   // dead straight

    // The epsilon matters: a full turn accumulated from acos() lands on 359.9999 or
    // 360.0001 depending on how densely the ring was sampled, and a bare ceil() turns that
    // into 8 anchors or 9 for the same circle.
    const count = Math.max(1, Math.ceil(total / maxTurn - 1e-6));
    const interior = pickEvenlyByTurn(cum, count);
    return [pts[0], ...interior.map(i => pts[i]), pts[pts.length - 1]];
}

/** Thin a **closed** loop the same way, wrapping the turn measurement across the seam. */
function thinClosed(pts: Pt[], maxTurn: number): Pt[] {
    const n = pts.length;
    if (n <= 4) return pts.slice();
    const at = (i: number) => pts[((i % n) + n) % n];

    const cum: number[] = [0];
    for (let i = 1; i <= n; i++) cum.push(cum[cum.length - 1] + turnDeg(at(i - 1), at(i), at(i + 1)));
    const total = cum[cum.length - 1];
    if (total < 1e-9) return pts.slice();

    // At least 3 to enclose any area; a full 360° loop at 45° gives 8. See thinRun for why
    // the epsilon is there.
    const count = Math.max(3, Math.ceil(total / maxTurn - 1e-6));
    const interior = pickEvenlyByTurn(cum, count).filter(i => i < n);
    const out = [pts[0], ...interior.map(i => at(i))];
    return out.length >= 3 ? out : pts.slice();
}

/**
 * Refit a closed flattened ring to anchors, keeping corners sharp.
 *
 * `points` must not repeat its first point at the end. Returns corner-and-smooth anchors
 * ready for a `PathSubpath`. A ring with no detected corners (a circle) is fitted as one
 * continuous smooth loop; a ring that is *all* corners (a rectangle) comes back with no
 * handles at all, i.e. exactly the polygon it started as.
 */
export function refitClosedRing(points: Pt[], options: RefitOptions = {}): PathAnchor[] {
    const { cornerAngleDeg, maxTurnPerAnchorDeg } = { ...DEFAULTS, ...options };
    const n = points.length;
    if (n < 3) return points.map(p => ({ x: p.x, y: p.y, kind: 'corner' as const }));

    const at = (i: number) => points[((i % n) + n) % n];
    const isCorner: boolean[] = [];
    for (let i = 0; i < n; i++) isCorner.push(turnDeg(at(i - 1), at(i), at(i + 1)) >= cornerAngleDeg);

    const cornerIdx = isCorner.map((c, i) => (c ? i : -1)).filter(i => i >= 0);

    // No corners at all — a closed smooth loop (a circle, an ellipse, a blob). Thin it as one
    // cyclic run and give every surviving point a smooth tangent.
    if (cornerIdx.length === 0) {
        return smoothAnchors(thinClosed(points, maxTurnPerAnchorDeg), true);
    }

    // Walk corner to corner. Each run keeps its two corner endpoints and is thinned in
    // between; the corners themselves become anchors with one-sided handles, so the curve
    // leaves them in the right direction without rounding the corner off.
    const anchors: PathAnchor[] = [];
    for (let c = 0; c < cornerIdx.length; c++) {
        const start = cornerIdx[c];
        const end = cornerIdx[(c + 1) % cornerIdx.length];

        const run: Pt[] = [];
        for (let i = start; ; i++) {
            run.push(at(i));
            if (((i % n) + n) % n === ((end % n) + n) % n) break;
            if (run.length > n) break; // guard: only one corner, wrapped the whole way
        }

        const thinned = thinRun(run, maxTurnPerAnchorDeg);
        const runAnchors = smoothAnchors(thinned, false);
        // The run's endpoints ARE corners, so drop the handle that would round them off and
        // mark them corner. The last one is the next run's first, so it is emitted there.
        runAnchors[0].kind = 'corner';
        delete runAnchors[0].inX; delete runAnchors[0].inY;
        const last = runAnchors[runAnchors.length - 1];
        last.kind = 'corner';
        delete last.outX; delete last.outY;
        // A two-point run is a straight edge between corners: no handles at all, or the
        // straight cut the knife just made would bow.
        if (runAnchors.length === 2) {
            delete runAnchors[0].outX; delete runAnchors[0].outY;
            delete last.inX; delete last.inY;
        }
        anchors.push(...runAnchors.slice(0, -1));
    }
    return anchors;
}

/**
 * Handle length as a fraction of the chord, for a cubic spanning `turn` radians of arc.
 *
 * The familiar chord/3 is the small-angle limit of this and is 4% short at 45°, which put the
 * refitted circle 0.29 units off a 100-unit radius — small, but a systematic *inward* bias on
 * every segment, so a cut piece sat visibly inside the shape it came from. The exact factor
 * for a circular arc is (4/3)·tan(θ/4) of the radius, and the chord is 2R·sin(θ/2); their
 * ratio is below, and it takes the same circle to ~0.001.
 */
function handleFraction(turn: number): number {
    if (turn < 1e-6) return 1 / 3;                       // straight: the limit
    const t = Math.min(turn, Math.PI * 0.9);             // guard against a near-reversal
    return ((4 / 3) * Math.tan(t / 4)) / (2 * Math.sin(t / 2));
}

/**
 * Fit Bézier handles to a run of points, tangent-continuous at every interior point.
 *
 * Two passes: a unit tangent per point (from the neighbours, as Catmull-Rom does), then a
 * handle per *segment* sized from that segment's own turn. Sizing per segment rather than per
 * point is what lets the arc factor above be applied — the turn is a property of the span
 * between two anchors, not of either one.
 */
function smoothAnchors(pts: Pt[], closed: boolean): PathAnchor[] {
    const n = pts.length;
    if (n < 2) return pts.map(p => ({ x: p.x, y: p.y, kind: 'corner' as const }));
    const at = (i: number) => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);

    // Unit tangent at each point.
    const tan: Pt[] = pts.map((p, i) => {
        const dir = sub(at(i + 1), at(i - 1));
        const l = len(dir);
        if (l > 1e-12) return { x: dir.x / l, y: dir.y / l };
        const fb = sub(at(i + 1), p);
        const fl = len(fb);
        return fl > 1e-12 ? { x: fb.x / fl, y: fb.y / fl } : { x: 0, y: 0 };
    });

    const anchors: PathAnchor[] = pts.map(p => ({ x: p.x, y: p.y, kind: 'smooth' as const }));
    const segCount = closed ? n : n - 1;
    for (let i = 0; i < segCount; i++) {
        const j = (i + 1) % n;
        const chord = len(sub(pts[j], pts[i]));
        if (chord < 1e-12) continue;
        // Turn across this segment = angle between the two endpoint tangents.
        const dot = Math.max(-1, Math.min(1, tan[i].x * tan[j].x + tan[i].y * tan[j].y));
        const d = chord * handleFraction(Math.acos(dot));
        anchors[i].outX = tan[i].x * d; anchors[i].outY = tan[i].y * d;
        anchors[j].inX = -tan[j].x * d; anchors[j].inY = -tan[j].y * d;
    }

    // A point with no usable tangent can't be smooth.
    for (let i = 0; i < n; i++) {
        if (len(tan[i]) < 1e-12) {
            anchors[i].kind = 'corner';
            delete anchors[i].inX; delete anchors[i].inY;
            delete anchors[i].outX; delete anchors[i].outY;
        }
    }
    return anchors;
}
