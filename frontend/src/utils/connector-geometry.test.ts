import { describe, it, expect } from "bun:test";
import { connectorGeometry } from "./connector-geometry";

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
