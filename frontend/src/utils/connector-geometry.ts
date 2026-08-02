/**
 * connector-geometry — the one place that answers "where does this connector actually go,
 * and which way do its arrowheads point".
 *
 * Before this module the derivation (endpoints → control points → path → arrowhead angles)
 * was written out longhand in six places: `definePath`, `renderBezier`, `renderElbow`,
 * `renderStraight`, `renderArchitectural` and `renderFlow` in the connector renderer, plus
 * `connectorCurvePath` in the SVG exporter. Five of them agreed. The two that didn't caused
 * `docs/arrowhead-orientation-spec.md`:
 *
 *   - **export** rotated every arrowhead to the bounding-box *chord*
 *     (`atan2(el.height, el.width)`) while the stroke it terminates is a cubic whose default
 *     control points are axis-aligned — so the glyph and the line disagreed by up to 45°.
 *   - **renderArchitectural** omitted the default-control-point fallback the other five have.
 *     With no explicit `controlPoints` (which is every DSL- and API-authored edge, since
 *     neither `api.connect()` nor `dsl-engine` ever writes them) it fell back to
 *     `cp1 = cp2 = start`, making the start angle `atan2(0, 0)` — due east — and the end
 *     angle the chord again.
 *
 * The fix is structural rather than three more copies of the correct maths: callers ask for
 * geometry and get the path and the angles from the same numbers, so they cannot drift apart.
 *
 * ANGLE CONVENTION: both angles are **outward** — the direction the arrowhead's tip faces.
 * The start head therefore points back out of the start (`atan2(start − cp1)`) and the end
 * head along the direction of travel (`atan2(end − cp2)`). This matches what `drawArrowhead`,
 * `drawArrowheadArchitectural` and `umlArrowheadGlyph` already expect.
 */

import { normalizePoints } from './points';

export interface Pt { x: number; y: number }

export interface ConnectorGeometry {
    /** Tip position for the start arrowhead. */
    start: Pt;
    /** Tip position for the end arrowhead. */
    end: Pt;
    /** Radians, outward (pointing back out of the start). */
    startAngle: number;
    /** Radians, outward (the direction of travel at the end). */
    endAngle: number;
    /** Effective cubic control points, or null for straight/elbow. For a quadratic
     *  (one authored control point) both are the same point. */
    cp1: Pt | null;
    cp2: Pt | null;
    /** True when the element carries exactly one control point, i.e. a quadratic. */
    quadratic: boolean;
    /** Deduped polyline vertices for an elbow, else null. */
    points: Pt[] | null;
    /** SVG path data for the stroke; null ⇒ a straight chord, the caller draws a line. */
    d: string | null;
    /** Where a label sits: the midpoint OF THE PATH, which for a curve is not the midpoint
     *  of its bounding box. Mirrors what the canvas label renderer has always computed. */
    mid: Pt;
}

/** Cubic Bézier coordinate at `t` (kept local so this module stays a leaf). */
const cubicAt = (p0: number, p1: number, p2: number, p3: number, t: number) => {
    const k = 1 - t;
    return k * k * k * p0 + 3 * k * k * t * p1 + 3 * k * t * t * p2 + t * t * t * p3;
};

/** Point half way along a polyline, measured by arc length. */
function polylineMidpoint(pts: Pt[]): Pt {
    let total = 0;
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
        const len = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
        segs.push({ a: pts[i], b: pts[i + 1], len });
        total += len;
    }
    const half = total / 2;
    let acc = 0;
    for (const s of segs) {
        if (acc + s.len >= half) {
            const t = s.len ? (half - acc) / s.len : 0;
            return { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t };
        }
        acc += s.len;
    }
    return pts[0];
}

/** Below this, two points are the same point and the direction between them is meaningless. */
const EPS = 1e-6;
/** Consecutive elbow vertices closer than this collapse (matches `renderElbow`'s cleanup). */
const DEDUPE = 0.1;

/**
 * Outward angle at `tip`, measured away from the first candidate that is actually a
 * distinct point.
 *
 * The walk matters. `atan2(0, 0)` is 0, not an error, so a control point sitting exactly on
 * its endpoint silently aims the head due east — the architectural bug above. For a cubic
 * whose `cp1` coincides with the start, the true tangent is toward `cp2`, so stepping along
 * the control polygon recovers the right answer; the chord is only the last resort.
 */
function outwardAngle(tip: Pt, candidates: (Pt | null | undefined)[]): number {
    for (const c of candidates) {
        if (!c) continue;
        const dx = tip.x - c.x, dy = tip.y - c.y;
        if (Math.abs(dx) > EPS || Math.abs(dy) > EPS) return Math.atan2(dy, dx);
    }
    return 0; // every candidate degenerate: a zero-length connector has no direction
}

/** Drop consecutive duplicates so a repeated waypoint can't yield a zero-length segment. */
function dedupe(pts: Pt[]): Pt[] {
    return pts.filter((p, i, self) =>
        i === 0 || Math.abs(p.x - self[i - 1].x) > DEDUPE || Math.abs(p.y - self[i - 1].y) > DEDUPE);
}

const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(3).replace(/\.?0+$/, ''));

/**
 * Resolve a connector element to its drawn geometry.
 *
 * Endpoints come from `el.points` when there are at least two (so a rerouted connector is
 * honoured — the exporter used to ignore them and always span the bounding box), otherwise
 * from the bounding box.
 */
export function connectorGeometry(el: any): ConnectorGeometry {
    const pts = normalizePoints(el.points);
    const hasPts = pts.length >= 2;
    const start: Pt = hasPts
        ? { x: el.x + pts[0].x, y: el.y + pts[0].y }
        : { x: el.x, y: el.y };
    const end: Pt = hasPts
        ? { x: el.x + pts[pts.length - 1].x, y: el.y + pts[pts.length - 1].y }
        : { x: el.x + el.width, y: el.y + el.height };

    const chordMid: Pt = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    const base = { start, end, cp1: null, cp2: null, quadratic: false, points: null, d: null, mid: chordMid };

    // ── Elbow: a polyline through the waypoints, or a synthesised mid-jog ────────────
    if (el.curveType === 'elbow') {
        const verts = pts.length > 0
            ? dedupe(pts.map(p => ({ x: el.x + p.x, y: el.y + p.y })))
            : synthesiseElbow(start, end, el.width, el.height);
        const clean = verts.length >= 2 ? verts : [start, end];
        const n = clean.length;
        // A standalone polyline (neither end bound) labels at its bounding-box centre; a
        // connected elbow labels half way along the path. Matches the canvas renderer.
        const standalone = !el.startBinding && !el.endBinding;
        let mid: Pt;
        if (standalone && pts.length >= 2) {
            const xs = clean.map(p => p.x), ys = clean.map(p => p.y);
            mid = {
                x: (Math.min(...xs) + Math.max(...xs)) / 2,
                y: (Math.min(...ys) + Math.max(...ys)) / 2,
            };
        } else {
            mid = polylineMidpoint(clean);
        }
        return {
            ...base,
            points: clean,
            mid,
            d: `M ${fmt(clean[0].x)} ${fmt(clean[0].y)} ` +
                clean.slice(1).map(p => `L ${fmt(p.x)} ${fmt(p.y)}`).join(' '),
            // Angles come from the first and last non-degenerate segment.
            startAngle: outwardAngle(clean[0], [clean[1], clean[2], end]),
            endAngle: outwardAngle(clean[n - 1], [clean[n - 2], clean[n - 3], start]),
        };
    }

    // ── Bezier ───────────────────────────────────────────────────────────────────────
    if (el.curveType === 'bezier') {
        const cps = el.controlPoints;
        let cp1: Pt, cp2: Pt, quadratic = false, d: string;

        if (cps && cps.length > 1) {
            cp1 = cps[0]; cp2 = cps[1];
            d = `M ${fmt(start.x)} ${fmt(start.y)} C ${fmt(cp1.x)} ${fmt(cp1.y)}, ${fmt(cp2.x)} ${fmt(cp2.y)}, ${fmt(end.x)} ${fmt(end.y)}`;
        } else if (cps && cps.length === 1) {
            cp1 = cps[0]; cp2 = cps[0]; quadratic = true;
            d = `M ${fmt(start.x)} ${fmt(start.y)} Q ${fmt(cp1.x)} ${fmt(cp1.y)}, ${fmt(end.x)} ${fmt(end.y)}`;
        } else {
            // The default control points every unstyled connector gets. Direction from the
            // edge each end is anchored to, magnitude from the chord's dominant axis — see
            // defaultControlPoints. This is also the branch the arrowhead bug lived in: the
            // true tangent here is always horizontal or vertical, never the diagonal chord.
            [cp1, cp2] = defaultControlPoints(
                start, end, el.width, el.height,
                anchorEdge(el.startBinding), anchorEdge(el.endBinding),
            );
            d = `M ${fmt(start.x)} ${fmt(start.y)} C ${fmt(cp1.x)} ${fmt(cp1.y)}, ${fmt(cp2.x)} ${fmt(cp2.y)}, ${fmt(end.x)} ${fmt(end.y)}`;
        }

        return {
            ...base, cp1, cp2, quadratic, d,
            mid: {
                x: cubicAt(start.x, cp1.x, cp2.x, end.x, 0.5),
                y: cubicAt(start.y, cp1.y, cp2.y, end.y, 0.5),
            },
            startAngle: outwardAngle(start, [cp1, cp2, end]),
            endAngle: outwardAngle(end, [cp2, cp1, start]),
        };
    }

    // ── Straight: the chord IS the path, so the chord is the correct angle ───────────
    return {
        ...base,
        startAngle: outwardAngle(start, [end]),
        endAngle: outwardAngle(end, [start]),
    };
}

/** The four box edges a bound endpoint can sit on. */
export type AnchorEdge = 'top' | 'bottom' | 'left' | 'right';

/** Outward unit normal of each edge, in screen coordinates (y grows downward). */
/**
 * Smallest control-point offset, in px.
 *
 * Below this a cubic is visually a straight line and the arrowhead angle starts chasing
 * floating point noise, so short connectors get this much curve regardless.
 */
const MIN_CONTROL_OFFSET = 12;

const EDGE_NORMAL: Record<AnchorEdge, Pt> = {
    top: { x: 0, y: -1 },
    bottom: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
};

/**
 * Which edge of its bound node this endpoint is anchored to, if any.
 *
 * `api.connect()` records `anchorFractionX/Y` — the endpoint's position across the node's
 * bounding box — and its `intersect()` puts a box endpoint exactly on a boundary, so the
 * relevant fraction lands on exactly 0 or 1.
 *
 * Returns null (⇒ caller falls back to the chord rule) for: an unbound end, a *corner*
 * anchor where two edges meet and there is no single normal, and non-box shapes such as
 * circles and diamonds, whose anchors sit at neither 0 nor 1.
 */
export function anchorEdge(binding: any): AnchorEdge | null {
    if (!binding) return null;
    const { anchorFractionX: fx, anchorFractionY: fy } = binding;
    if (typeof fx !== 'number' || typeof fy !== 'number') return null;
    const at = (v: number, t: number) => Math.abs(v - t) < 1e-6;
    const hits: AnchorEdge[] = [];
    if (at(fy, 0)) hits.push('top');
    if (at(fy, 1)) hits.push('bottom');
    if (at(fx, 0)) hits.push('left');
    if (at(fx, 1)) hits.push('right');
    return hits.length === 1 ? hits[0] : null;
}

/**
 * Default cubic control points.
 *
 * The offset MAGNITUDE is half the dominant axis of the chord, as it has always been. The
 * offset DIRECTION, though, comes from the edge each endpoint is anchored to — not from the
 * chord's dominant axis.
 *
 * Those two rules agree most of the time, which is why the difference went unnoticed: a
 * tree-down layout anchors top/bottom *and* is vertically dominant. They diverge exactly on
 * the wide cross-hierarchy edges, where a node is far enough sideways that |dx| > |dy| while
 * the anchor is still on a horizontal edge. The old rule then sent the curve out of a bottom
 * edge heading *sideways* — hugging the box and sliding past its corner — and since the
 * arrowhead faithfully follows the curve, the glyph ended up lying flat against the edge.
 * See docs/connector-anchor-direction-spec.md; 97 of 653 edge-anchored endpoints in the
 * kata corpus left or arrived exactly parallel to their own edge.
 *
 * Keeping the magnitude is what makes this surgical: where the dominant axis already agreed
 * with the edge normal the control point is bit-for-bit unchanged, so the ~85% of connectors
 * that looked right re-render identically.
 */
export function defaultControlPoints(
    start: Pt, end: Pt, width: number, height: number,
    startEdge: AnchorEdge | null = null, endEdge: AnchorEdge | null = null,
): [Pt, Pt] {
    const horizontal = Math.abs(width) > Math.abs(height);
    const k = (horizontal ? Math.abs(width) : Math.abs(height)) / 2;

    // The chord rule, kept for unbound ends, corner anchors and non-box shapes.
    const [fbStart, fbEnd]: [Pt, Pt] = horizontal
        ? [{ x: start.x + width / 2, y: start.y }, { x: end.x - width / 2, y: end.y }]
        : [{ x: start.x, y: start.y + height / 2 }, { x: end.x, y: end.y - height / 2 }];

    // Both control points sit on the far side of their endpoint from the box, so each is
    // offset along its own edge's OUTWARD normal.
    //
    // The magnitude is measured along the axis the control point actually MOVES in, not
    // along the chord's dominant axis. Those agree whenever the anchor edge faces the way
    // the chord runs, which is the common case and re-renders unchanged. They diverge when
    // a connector is far sideways but close vertically: the old rule then pushed the
    // control point out by half the horizontal span, so a 40px vertical gap got a 75px
    // vertical bulge. The curve ballooned, and on a short hop it looped back through the
    // shape it was pointing at, which is how an arrowhead ended up arriving from inside the
    // target. Measuring along the normal's own axis keeps a short hop short.
    const along = (p: Pt, e: AnchorEdge): Pt => {
        const n = EDGE_NORMAL[e];
        const span = n.x !== 0 ? Math.abs(width) : Math.abs(height);
        // A floor, so a connector between touching shapes still leaves as a curve rather
        // than a spike; capped by the old rule so nothing gets LARGER than it used to be.
        const magnitude = Math.min(k, Math.max(MIN_CONTROL_OFFSET, span / 2));
        return { x: p.x + n.x * magnitude, y: p.y + n.y * magnitude };
    };

    return [
        startEdge ? along(start, startEdge) : fbStart,
        endEdge ? along(end, endEdge) : fbEnd,
    ];
}

/** The three-segment jog an elbow falls back to when it carries no waypoints. */
function synthesiseElbow(start: Pt, end: Pt, width: number, height: number): Pt[] {
    return Math.abs(width) > Math.abs(height)
        ? [start, { x: start.x + width / 2, y: start.y }, { x: start.x + width / 2, y: end.y }, end]
        : [start, { x: start.x, y: start.y + height / 2 }, { x: end.x, y: start.y + height / 2 }, end];
}
