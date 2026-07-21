/**
 * Shape recognition for "smart shape" hold-to-correct.
 *
 * Classifies a freehand pen stroke into a clean primitive (line, rectangle,
 * ellipse, triangle, diamond) so a dwell at the end of a stroke can snap the
 * ink into a real geometric element. Originally ported from happypaint's
 * engine/stroke/quick-shape.ts `recognizeShape`.
 *
 * Pure geometry, JS-only — runs once per stroke (on dwell / finish), never on
 * the hot per-point path, so it needs no WASM counterpart.
 *
 * All inputs/outputs are in the stroke's LOCAL coordinate space (points
 * relative to element.x / element.y). The caller offsets by element.x/y.
 *
 * ── How it decides ──
 * The hard part isn't judging how well a polygon fits — it's deciding how many
 * corners the stroke has. Reading the corner count straight off RDP is fragile:
 * RDP leaves redundant points on straight edges, and hand tremor adds more, so
 * the same rectangle drawn twice can report 4 corners and then 9. That made
 * hold-to-correct feel random, especially with a mouse.
 *
 * So the count is never trusted. RDP produces a generous corner set, then
 * corners are removed one at a time — each time dropping whichever corner costs
 * the least fit accuracy — recording the best polygon at every size on the way
 * down. That yields a 3-corner and a 4-corner candidate for ANY stroke, which
 * are then judged on fit alone, against an absolute error gate. A stroke that
 * isn't really a polygon (scribble, spiral) still produces candidates, but they
 * fit badly and the gate rejects them, so it stays as freehand ink.
 */

export type Pt = { x: number; y: number };

export type RecognizedShape =
    | { kind: 'line'; a: Pt; b: Pt }
    | { kind: 'rect'; minX: number; minY: number; maxX: number; maxY: number }
    | { kind: 'ellipse'; minX: number; minY: number; maxX: number; maxY: number }
    | { kind: 'triangle'; minX: number; minY: number; maxX: number; maxY: number }
    | { kind: 'diamond'; minX: number; minY: number; maxX: number; maxY: number };

const MIN_POINTS = 8;     // too few points → can't tell anything
const MIN_DIAG = 24;      // tiny scribbles aren't shapes (in world units)

// A stroke counts as closed when its endpoints land within this fraction of the
// bounding diagonal. Generous on purpose: with a mouse you rarely return to the
// exact pixel you started on, and both stopping short and running past the start
// are normal. Only closed strokes are considered for rect/tri/diamond/ellipse.
const CLOSE_FRAC = 0.25;

// Mean point-to-edge distance a polygon fit must beat, as a fraction of the
// diagonal. This is what keeps the loosened corner-counting honest: greedy
// reduction hands back a 3- and 4-corner candidate for a scribble too, and this
// is the gate that throws them out.
const POLY_GATE = 0.055;
const ELLIPSE_GATE = 0.11;

// Straightness thresholds for the line case, as fractions of the end-to-end
// length. Mean is the real test — a single mouse jerk shouldn't disqualify an
// otherwise straight stroke — with max as a backstop against arcs, which have a
// modest mean deviation but bow far away in the middle.
const LINE_MEAN_PERP = 0.05;
const LINE_MAX_PERP = 0.15;
// Ratio of travelled path length to end-to-end distance. A stroke that doubles
// back (scrubbing, a narrow "V") can hug its own axis while being nothing like
// a line; real lines travel barely further than the distance they cover.
const LINE_MAX_WANDER = 1.3;

// Points used to score a candidate fit. Greedy reduction is O(corners³·points),
// so a slow deliberate stroke (which can carry a couple of thousand samples)
// would otherwise cost tens of milliseconds — and this runs from the dwell timer
// with the pen still down, where a hitch is felt. Every metric here is a MEAN
// over the stroke, so an evenly-spaced subsample gives the same answer for a
// fraction of the work; the full stroke is still used for the bounding box,
// closure and straightness tests, which are all linear.
const FIT_SAMPLES = 240;

// Upper bound on the corner set fed to greedy reduction. Reduction is O(n²·pts),
// so this caps a pathological scribble's cost; such strokes fail the gate anyway.
// Enforced by loosening the RDP epsilon rather than by dropping corners from the
// list — evenly-spaced thinning discards true corners along with the noise.
const MAX_CORNERS = 24;

// A corner is "real" only if the stroke actually turns there. Below this the
// corner sits on what is effectively a straight edge, so a quad containing one
// is a triangle with a redundant point. Distinguishing a triangle from a
// rectangle this way is far steadier than comparing their fit errors: a quad
// fits a wobbly triangle almost as well as a triangle does (it spends its spare
// corner shaving jitter), so the error ratio barely separates the two cases.
const MIN_TURN_DEG = 45;

function dist(a: Pt, b: Pt): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function perpDist(p: Pt, a: Pt, b: Pt): number {
    const len = dist(a, b);
    if (len < 1e-6) return dist(p, a);
    return Math.abs((p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x)) / len;
}

/** Distance from p to the SEGMENT ab (not the infinite line through a and b). */
function segDist(p: Pt, a: Pt, b: Pt): number {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 < 1e-12) return dist(p, a);
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

// Ramer–Douglas–Peucker simplification → candidate corner points.
function rdp(pts: Pt[], eps: number): Pt[] {
    if (pts.length < 3) return pts.slice();
    let dmax = 0;
    let idx = 0;
    const a = pts[0];
    const b = pts[pts.length - 1];
    for (let i = 1; i < pts.length - 1; i++) {
        const d = perpDist(pts[i], a, b);
        if (d > dmax) { dmax = d; idx = i; }
    }
    if (dmax > eps) {
        return rdp(pts.slice(0, idx + 1), eps).slice(0, -1).concat(rdp(pts.slice(idx), eps));
    }
    return [a, b];
}

/**
 * Mean distance from every stroke point to the nearest polygon edge.
 *
 * Uses SEGMENT distance, not perpendicular distance to the infinite line: with
 * few corners the infinite-line version reports a suspiciously good fit for
 * points that are nowhere near the actual edge, which flatters bad candidates
 * exactly when the gate needs to reject them.
 */
function meanEdgeDist(pts: Pt[], corners: Pt[]): number {
    let sum = 0;
    for (const p of pts) {
        let best = Infinity;
        for (let i = 0; i < corners.length; i++) {
            const a = corners[i];
            const b = corners[(i + 1) % corners.length];
            const d = segDist(p, a, b);
            if (d < best) best = d;
        }
        sum += best;
    }
    return sum / pts.length;
}

/**
 * Greedily reduce a corner set, recording the best polygon at each size.
 * At every step the corner whose removal costs the least fit accuracy is
 * dropped, so the n-corner entry is a good n-corner approximation of the
 * stroke regardless of how many corners RDP originally produced.
 */
function reduceCorners(pts: Pt[], corners: Pt[]): Map<number, { corners: Pt[]; err: number }> {
    const out = new Map<number, { corners: Pt[]; err: number }>();
    let cur = corners;
    out.set(cur.length, { corners: cur, err: meanEdgeDist(pts, cur) });
    while (cur.length > 3) {
        let bestCorners: Pt[] | null = null;
        let bestErr = Infinity;
        for (let i = 0; i < cur.length; i++) {
            const cand = cur.slice(0, i).concat(cur.slice(i + 1));
            const err = meanEdgeDist(pts, cand);
            if (err < bestErr) { bestErr = err; bestCorners = cand; }
        }
        if (!bestCorners) break;
        cur = bestCorners;
        out.set(cur.length, { corners: cur, err: bestErr });
    }
    return out;
}

/** Evenly-spaced subsample, capped at `max` points. Always keeps the endpoints. */
function subsample(pts: Pt[], max: number): Pt[] {
    if (pts.length <= max) return pts;
    const out: Pt[] = [];
    const step = (pts.length - 1) / (max - 1);
    for (let i = 0; i < max; i++) out.push(pts[Math.round(i * step)]);
    return out;
}

/**
 * Smallest turn (in degrees) at any corner of a closed polygon. 0° means the
 * path continues straight through that corner; 90° is a right angle.
 */
function minTurnDeg(corners: Pt[]): number {
    let min = 180;
    for (let i = 0; i < corners.length; i++) {
        const prev = corners[(i - 1 + corners.length) % corners.length];
        const cur = corners[i];
        const next = corners[(i + 1) % corners.length];
        const inAng = Math.atan2(cur.y - prev.y, cur.x - prev.x);
        const outAng = Math.atan2(next.y - cur.y, next.x - cur.x);
        let turn = Math.abs(((outAng - inAng) * 180) / Math.PI) % 360;
        if (turn > 180) turn = 360 - turn;
        if (turn < min) min = turn;
    }
    return min;
}

/**
 * Try to recognize a clean shape from a freehand stroke (local coords).
 * Returns null when the stroke is ambiguous — the caller should then keep the
 * original freehand ink rather than forcing a (wrong) shape.
 */
export function recognizeStrokeShape(pts: Pt[]): RecognizedShape | null {
    if (pts.length < MIN_POINTS) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pts) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }
    const w = maxX - minX;
    const h = maxY - minY;
    const diag = Math.hypot(w, h);
    if (diag < MIN_DIAG) return null;

    const start = pts[0];
    const end = pts[pts.length - 1];
    const closed = dist(start, end) < CLOSE_FRAC * diag;

    // ── Line: open stroke whose points hug the start→end axis ──
    if (!closed) {
        const lineLen = Math.max(1, dist(start, end));
        let maxPerp = 0;
        let sumPerp = 0;
        for (const p of pts) {
            const perp = perpDist(p, start, end);
            if (perp > maxPerp) maxPerp = perp;
            sumPerp += perp;
        }
        const meanPerp = sumPerp / pts.length;
        let pathLen = 0;
        for (let i = 1; i < pts.length; i++) pathLen += dist(pts[i - 1], pts[i]);
        if (meanPerp < LINE_MEAN_PERP * lineLen
            && maxPerp < LINE_MAX_PERP * lineLen
            && pathLen < LINE_MAX_WANDER * lineLen) {
            return { kind: 'line', a: { x: start.x, y: start.y }, b: { x: end.x, y: end.y } };
        }
        // An open stroke that isn't a line isn't a closed primitive either.
        // Bailing here is what stops a wide arc from being "fitted" to a
        // triangle whose third edge is the chord the user never drew.
        return null;
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    // Everything below scores candidate fits, so it works off the subsample.
    const fitPts = subsample(pts, FIT_SAMPLES);

    // ── Ellipse fit error (mean deviation from the boundary, in world units) ──
    const rx = Math.max(1, w / 2);
    const ry = Math.max(1, h / 2);
    let ellipseErr = 0;
    for (const p of fitPts) {
        ellipseErr += Math.abs(Math.hypot((p.x - cx) / rx, (p.y - cy) / ry) - 1) * Math.min(rx, ry);
    }
    ellipseErr /= fitPts.length;

    // ── Polygon candidates ──
    // A tight epsilon on purpose: over-supplying corners is free (reduction
    // removes them), under-supplying is not (a real corner can't be recovered).
    let eps = 0.02 * diag;
    let corners = rdp(pts, eps);
    // Too many corners means noise, not detail — coarsen until the set is a
    // workable size. RDP drops the shallowest deviations first, so real corners
    // survive; picking every Nth corner instead would throw them away at random.
    while (corners.length > MAX_CORNERS && eps < diag) {
        eps *= 1.6;
        corners = rdp(pts, eps);
    }
    // The stroke is closed, so its first and last corner are the same corner.
    if (corners.length > 3 && dist(corners[0], corners[corners.length - 1]) < 0.12 * diag) {
        corners = corners.slice(0, -1);
    }

    const polyGate = POLY_GATE * diag;
    let tri: { corners: Pt[]; err: number } | undefined;
    let quad: { corners: Pt[]; err: number } | undefined;
    if (corners.length >= 3) {
        const candidates = reduceCorners(fitPts, corners);
        tri = candidates.get(3);
        quad = candidates.get(4);
    }

    const triErr = tri && tri.err <= polyGate ? tri.err : Infinity;
    const quadErr = quad && quad.err <= polyGate ? quad.err : Infinity;
    const ellipseOk = ellipseErr <= ELLIPSE_GATE * diag ? ellipseErr : Infinity;
    const bestPoly = Math.min(triErr, quadErr);

    if (bestPoly === Infinity && ellipseOk === Infinity) return null;

    // Curves beat corners on a tie: a circle can be approximated by a quad
    // closely enough to pass the gate, but an ellipse fit describes it better.
    if (ellipseOk <= bestPoly) {
        return { kind: 'ellipse', minX, minY, maxX, maxY };
    }

    // Prefer the simpler shape unless the fourth corner is a genuine corner.
    // A quad can always fit at least as well as a triangle, so its lower error
    // is not evidence of a fourth corner — the stroke turning there is.
    const quadHasFakeCorner = quadErr === Infinity
        || (quad != null && minTurnDeg(quad.corners) < MIN_TURN_DEG);
    if (triErr !== Infinity && (quadHasFakeCorner || triErr <= quadErr)) {
        return { kind: 'triangle', minX, minY, maxX, maxY };
    }

    if (quadErr !== Infinity && quad) {
        const near = (a: Pt, b: Pt) => dist(a, b) < 0.2 * diag;
        const bboxCorners = [
            { x: minX, y: minY }, { x: maxX, y: minY },
            { x: maxX, y: maxY }, { x: minX, y: maxY },
        ];
        const edgeMids = [
            { x: cx, y: minY }, { x: maxX, y: cy },
            { x: cx, y: maxY }, { x: minX, y: cy },
        ];
        const axisAligned = bboxCorners.every(bc => quad.corners.some(c => near(c, bc)));
        const diamondLike = edgeMids.every(m => quad.corners.some(c => near(c, m)));
        // Prefer diamond only when it matches and rect doesn't.
        if (diamondLike && !axisAligned) {
            return { kind: 'diamond', minX, minY, maxX, maxY };
        }
        return { kind: 'rect', minX, minY, maxX, maxY };
    }

    return null;
}
