import { describe, it, expect } from "bun:test";
import { connectorGeometry, defaultControlPoints } from "./connector-geometry";

const deg = (r: number) => Math.round((r * 180 / Math.PI) * 1000) / 1000;
/** Compare angles modulo 360 so ±180 doesn't spuriously fail. */
const sameAngle = (a: number, b: number) => {
    let d = deg(a) - b;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return Math.abs(d) < 1e-6;
};

const arrow = (over: any = {}) => ({
    type: 'arrow', x: 0, y: 0, width: 100, height: 100, curveType: 'bezier', ...over,
});

describe("connectorGeometry — bezier with default control points", () => {
    // The whole bug: default cps are axis-aligned, so the tangents are exactly ±90°/0°/180°
    // no matter how far off-axis the other endpoint is. The chord is NOT the answer.
    it("vertical-dominant leaves north and arrives south, whatever the x offset", () => {
        for (const dx of [0, -140, 140, -399, 399]) {
            const g = connectorGeometry(arrow({ width: dx, height: 400 }));
            expect(sameAngle(g.startAngle, -90)).toBe(true);
            expect(sameAngle(g.endAngle, 90)).toBe(true);
        }
    });

    it("horizontal-dominant leaves west and arrives east, whatever the y offset", () => {
        for (const dy of [0, -140, 140, -399, 399]) {
            const g = connectorGeometry(arrow({ width: 400, height: dy }));
            expect(sameAngle(g.startAngle, 180)).toBe(true);
            expect(sameAngle(g.endAngle, 0)).toBe(true);
        }
    });

    it("negative dominant axes flip both ends", () => {
        const up = connectorGeometry(arrow({ width: 0, height: -400 }));
        expect(sameAngle(up.startAngle, 90)).toBe(true);
        expect(sameAngle(up.endAngle, -90)).toBe(true);

        const left = connectorGeometry(arrow({ width: -400, height: 0 }));
        expect(sameAngle(left.startAngle, 0)).toBe(true);
        expect(sameAngle(left.endAngle, 180)).toBe(true);
    });

    it("the regression case from the spec: 41.5° of error becomes 0", () => {
        // The left-hand child in 09-strategy/structure.svg: chord 131.5°, true tangent 90°.
        const g = connectorGeometry(arrow({ x: 217.5, y: 426, width: -239, height: 270 }));
        const chord = Math.atan2(270, -239) * 180 / Math.PI;      // what export used to use
        expect(Math.round(chord * 10) / 10).toBe(131.5);
        expect(Math.round((chord - 90) * 10) / 10).toBe(41.5);    // the documented error
        expect(sameAngle(g.endAngle, 90)).toBe(true);             // the new answer
    });
});

describe("connectorGeometry — departure follows the anchored edge, not the chord", () => {
    // docs/connector-anchor-direction-spec.md. The departure direction at the start is
    // `cp1 − start`; at the end the away-direction is `cp2 − end`. Both must equal the
    // outward normal of the edge the endpoint is anchored to.
    const bind = (fx: number, fy: number) => ({ elementId: 'n', focus: 0, gap: 5, anchorFractionX: fx, anchorFractionY: fy });
    const EDGE = {
        top: { b: bind(0.5, 0), normal: -90 },
        bottom: { b: bind(0.5, 1), normal: 90 },
        left: { b: bind(0, 0.5), normal: 180 },
        right: { b: bind(1, 0.5), normal: 0 },
    } as const;

    const departure = (g: any) => deg(Math.atan2(g.cp1.y - g.start.y, g.cp1.x - g.start.x));
    const arrivalAway = (g: any) => deg(Math.atan2(g.cp2.y - g.end.y, g.cp2.x - g.end.x));

    it("every edge × every chord quadrant leaves along that edge's normal", () => {
        for (const [name, e] of Object.entries(EDGE)) {
            for (const [w, h] of [[500, 400], [-500, 400], [500, -400], [-500, -400],
                                  [400, 500], [-400, 500], [400, -500], [-400, -500]]) {
                const g = connectorGeometry(arrow({ width: w, height: h, startBinding: e.b }));
                expect(sameAngle(departure(g) * Math.PI / 180, e.normal),
                    `${name} edge, chord ${w}x${h}: departed ${departure(g)}° want ${e.normal}°`).toBe(true);
            }
        }
    });

    it("the reported case: horizontally dominant, but anchored on a bottom edge", () => {
        // Abstract Factory's Button → MacButton spans dx = −507, dy = +442, so the chord is
        // horizontally dominant while the anchor is on Button's bottom edge. The old rule
        // sent the curve out sideways, exactly parallel to the edge it was leaving.
        const g = connectorGeometry(arrow({
            width: -507, height: 442,
            startBinding: EDGE.bottom.b, endBinding: EDGE.top.b,
        }));
        expect(sameAngle(departure(g) * Math.PI / 180, 90)).toBe(true);      // down, off the bottom edge
        expect(sameAngle(arrivalAway(g) * Math.PI / 180, -90)).toBe(true);   // up, off the top edge
        // …and the arrowheads follow, since they come from the same control points.
        expect(sameAngle(g.startAngle, -90)).toBe(true);
        expect(sameAngle(g.endAngle, 90)).toBe(true);
    });

    it("keeps the offset magnitude, so already-correct curves are byte-identical", () => {
        // Vertically dominant + top/bottom anchors is the case the two rules agreed on.
        const opts = { width: 120, height: 400 };
        const before = connectorGeometry(arrow(opts));
        const after = connectorGeometry(arrow({
            ...opts, startBinding: EDGE.bottom.b, endBinding: EDGE.top.b,
        }));
        expect(after.cp1).toEqual(before.cp1!);
        expect(after.cp2).toEqual(before.cp2!);
        expect(after.d).toBe(before.d!);
    });

    it("the two ends are independent — bottom edge out, left edge in", () => {
        const g = connectorGeometry(arrow({
            width: 600, height: 200, startBinding: EDGE.bottom.b, endBinding: EDGE.left.b,
        }));
        expect(sameAngle(departure(g) * Math.PI / 180, 90)).toBe(true);
        expect(sameAngle(arrivalAway(g) * Math.PI / 180, 180)).toBe(true);
    });

    it("unbound ends, corner anchors and non-box anchors keep the chord rule", () => {
        const plain = connectorGeometry(arrow({ width: 500, height: 400 }));
        // Corner: two fractions at an extreme at once — no single normal.
        const corner = connectorGeometry(arrow({
            width: 500, height: 400, startBinding: bind(0, 0), endBinding: bind(1, 1),
        }));
        // A circle/diamond anchor lands at neither 0 nor 1.
        const round = connectorGeometry(arrow({
            width: 500, height: 400, startBinding: bind(0.15, 0.22), endBinding: bind(0.8, 0.7),
        }));
        expect(corner.d).toBe(plain.d!);
        expect(round.d).toBe(plain.d!);
    });

    it("a binding without anchor fractions falls back rather than throwing", () => {
        const g = connectorGeometry(arrow({
            width: 500, height: 400, startBinding: { elementId: 'n', focus: 0, gap: 5 },
        }));
        expect(g.d).toBe(connectorGeometry(arrow({ width: 500, height: 400 })).d!);
    });
});

describe("connectorGeometry — label midpoint", () => {
    it("a bezier labels at the curve midpoint, not the bounding-box centre", () => {
        const g = connectorGeometry(arrow({
            width: 0, height: 400,
            controlPoints: [{ x: 200, y: 100 }, { x: 200, y: 300 }],
        }));
        // Symmetric control points either side push the curve out to x = 150 at t = 0.5,
        // while the bounding box centre is x = 0.
        expect(Math.round(g.mid.x)).toBe(150);
        expect(Math.round(g.mid.y)).toBe(200);
    });

    it("a straight connector labels at the chord midpoint", () => {
        const g = connectorGeometry(arrow({ width: 100, height: 200, curveType: 'straight' }));
        expect(g.mid).toEqual({ x: 50, y: 100 });
    });

    it("a connected elbow labels half way along the path", () => {
        const g = connectorGeometry(arrow({
            width: 200, height: 0, curveType: 'elbow',
            points: [0, 0, 100, 0, 100, 100, 200, 100],
            startBinding: { elementId: 'a' }, endBinding: { elementId: 'b' },
        }));
        // Total length 300; half way is 50px down the middle segment.
        expect(g.mid).toEqual({ x: 100, y: 50 });
    });
});

describe("connectorGeometry — bezier with authored control points", () => {
    it("two control points: angles measured against cp1 and cp2", () => {
        const g = connectorGeometry(arrow({
            width: 100, height: 0,
            controlPoints: [{ x: 0, y: -50 }, { x: 100, y: -50 }],
        }));
        expect(sameAngle(g.startAngle, 90)).toBe(true);   // start(0,0) − cp1(0,−50) → +y is down, so north
        expect(sameAngle(g.endAngle, 90)).toBe(true);     // end(100,0) − cp2(100,−50)
        expect(g.quadratic).toBe(false);
        expect(g.d).toContain(" C ");
    });

    it("one control point is a quadratic and both ends measure against it", () => {
        const g = connectorGeometry(arrow({
            width: 100, height: 0, controlPoints: [{ x: 50, y: -50 }],
        }));
        expect(g.quadratic).toBe(true);
        expect(g.d).toContain(" Q ");
        expect(sameAngle(g.startAngle, 135)).toBe(true);
        expect(sameAngle(g.endAngle, 45)).toBe(true);
    });
});

describe("connectorGeometry — degenerate control points", () => {
    // atan2(0,0) is 0, not an error: a cp sitting on its endpoint used to aim the head
    // due east. The walk along the control polygon recovers the real tangent.
    it("cp1 exactly on the start falls through to cp2, not to due east", () => {
        const g = connectorGeometry(arrow({
            width: 0, height: 400,
            controlPoints: [{ x: 0, y: 0 }, { x: 0, y: 200 }],
        }));
        expect(deg(g.startAngle)).not.toBe(0);
        expect(sameAngle(g.startAngle, -90)).toBe(true);
    });

    it("both control points collapsed onto the start falls back to the chord", () => {
        const g = connectorGeometry(arrow({
            width: 100, height: 100,
            controlPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }],
        }));
        expect(sameAngle(g.startAngle, -135)).toBe(true);  // start − end
        expect(sameAngle(g.endAngle, 45)).toBe(true);      // end − start
    });

    it("a zero-length connector reports 0 rather than NaN", () => {
        const g = connectorGeometry(arrow({ width: 0, height: 0, curveType: 'straight' }));
        expect(Number.isFinite(g.startAngle)).toBe(true);
        expect(Number.isFinite(g.endAngle)).toBe(true);
    });
});

describe("connectorGeometry — straight", () => {
    it("angles are the chord and the path is left to the caller", () => {
        const g = connectorGeometry(arrow({ width: 100, height: 100, curveType: 'straight' }));
        expect(g.d).toBeNull();
        expect(sameAngle(g.endAngle, 45)).toBe(true);
        expect(sameAngle(g.startAngle, -135)).toBe(true);
    });

    it("honours el.points over the bounding box", () => {
        const g = connectorGeometry(arrow({
            x: 10, y: 20, width: 100, height: 100, curveType: 'straight',
            points: [0, 0, 0, 100],
        }));
        expect(g.start).toEqual({ x: 10, y: 20 });
        expect(g.end).toEqual({ x: 10, y: 120 });
        expect(sameAngle(g.endAngle, 90)).toBe(true);
    });
});

describe("connectorGeometry — elbow", () => {
    it("takes angles from the first and last segment of the polyline", () => {
        const g = connectorGeometry(arrow({
            x: 0, y: 0, width: 200, height: 100, curveType: 'elbow',
            points: [0, 0, 100, 0, 100, 100, 200, 100],
        }));
        expect(sameAngle(g.startAngle, 180)).toBe(true);  // first segment runs east
        expect(sameAngle(g.endAngle, 0)).toBe(true);      // last segment runs east
        expect(g.points!.length).toBe(4);
    });

    it("collapses duplicated waypoints instead of reading a zero-length segment", () => {
        const g = connectorGeometry(arrow({
            x: 0, y: 0, width: 0, height: 200, curveType: 'elbow',
            points: [0, 0, 0, 0, 0, 100, 0, 200, 0, 200],
        }));
        expect(g.points!.length).toBe(3);
        expect(sameAngle(g.startAngle, -90)).toBe(true);
        expect(sameAngle(g.endAngle, 90)).toBe(true);
    });

    it("synthesises an axis-aligned jog when there are no waypoints", () => {
        const g = connectorGeometry(arrow({ width: 0, height: 200, curveType: 'elbow' }));
        expect(g.d).toContain('L');
        expect(sameAngle(g.startAngle, -90)).toBe(true);
        expect(sameAngle(g.endAngle, 90)).toBe(true);
    });
});

describe('defaultControlPoints magnitude', () => {
    /**
     * A callout sitting far to the side but close vertically. The control points leave
     * through horizontal edges, so their offset must come from the VERTICAL span, which is
     * the axis they move in. The old rule used half the dominant (horizontal) span and
     * produced a bulge nearly twice the gap it was crossing, which looped the curve back
     * through the shape it pointed at.
     */
    it('scales a vertical offset by the vertical span, not the dominant one', () => {
        const start = { x: 0, y: 0 };
        const end = { x: 200, y: 40 };
        const [cp1, cp2] = defaultControlPoints(start, end, 200, 40, 'bottom', 'top');

        // Vertical span is 40, so each control point moves 20px, not 100px.
        expect(cp1.y).toBe(20);
        expect(cp2.y).toBe(20);
        expect(cp1.x).toBe(0);
        expect(cp2.x).toBe(200);
    });

    it('leaves the aligned case unchanged', () => {
        // Vertically dominant AND anchored top/bottom: the two rules agree, so this must
        // render bit-for-bit as it did before.
        const [cp1, cp2] = defaultControlPoints({ x: 0, y: 0 }, { x: 40, y: 200 }, 40, 200, 'bottom', 'top');
        expect(cp1.y).toBe(100);
        expect(cp2.y).toBe(100);
    });

    it('never exceeds the previous magnitude', () => {
        // The cap means no connector can get larger than it used to be, so this change can
        // only tighten curves.
        const [cp1] = defaultControlPoints({ x: 0, y: 0 }, { x: 300, y: 10 }, 300, 10, 'bottom', 'top');
        expect(cp1.y).toBeLessThanOrEqual(150);
    });

    it('gives a short hop a floor so it still curves', () => {
        const [cp1] = defaultControlPoints({ x: 0, y: 0 }, { x: 100, y: 4 }, 100, 4, 'bottom', 'top');
        expect(cp1.y).toBe(12);
    });
});
