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

    const base = { start, end, cp1: null, cp2: null, quadratic: false, points: null, d: null };

    // ── Elbow: a polyline through the waypoints, or a synthesised mid-jog ────────────
    if (el.curveType === 'elbow') {
        const verts = pts.length > 0
            ? dedupe(pts.map(p => ({ x: el.x + p.x, y: el.y + p.y })))
            : synthesiseElbow(start, end, el.width, el.height);
        const clean = verts.length >= 2 ? verts : [start, end];
        const n = clean.length;
        return {
            ...base,
            points: clean,
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
            // The default control points every unstyled connector gets: offset half the
            // dominant axis, which makes the curve leave and arrive exactly axis-aligned.
            // This is the branch the arrowhead bug lived in — the true tangent here is
            // always horizontal or vertical, never the diagonal chord.
            [cp1, cp2] = defaultControlPoints(start, end, el.width, el.height);
            d = `M ${fmt(start.x)} ${fmt(start.y)} C ${fmt(cp1.x)} ${fmt(cp1.y)}, ${fmt(cp2.x)} ${fmt(cp2.y)}, ${fmt(end.x)} ${fmt(end.y)}`;
        }

        return {
            ...base, cp1, cp2, quadratic, d,
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

/** Default cubic control points: half the dominant axis, axis-aligned at both ends. */
export function defaultControlPoints(start: Pt, end: Pt, width: number, height: number): [Pt, Pt] {
    return Math.abs(width) > Math.abs(height)
        ? [{ x: start.x + width / 2, y: start.y }, { x: end.x - width / 2, y: end.y }]
        : [{ x: start.x, y: start.y + height / 2 }, { x: end.x, y: end.y - height / 2 }];
}

/** The three-segment jog an elbow falls back to when it carries no waypoints. */
function synthesiseElbow(start: Pt, end: Pt, width: number, height: number): Pt[] {
    return Math.abs(width) > Math.abs(height)
        ? [start, { x: start.x + width / 2, y: start.y }, { x: start.x + width / 2, y: end.y }, end]
        : [start, { x: start.x, y: start.y + height / 2 }, { x: end.x, y: start.y + height / 2 }, end];
}
