import { describe, it, expect } from "bun:test";
import { measureLine, shapeMetrics } from "./measure-readout";

describe("measureLine", () => {
    it("horizontal (rightward) → angle 0, dy 0", () => {
        const r = measureLine(100, 100, 300, 100);
        expect(r.dx).toBe(200);
        expect(r.dy).toBe(0);
        expect(r.dist).toBe(200);
        expect(r.angle).toBe(0);
    });

    it("vertical (upward on screen) → angle +90", () => {
        const r = measureLine(100, 300, 100, 100); // y decreases → up
        expect(r.dx).toBe(0);
        expect(r.dy).toBe(-200);
        expect(r.dist).toBe(200);
        expect(r.angle).toBe(90);
    });

    it("3-4-5 diagonal → dist 5, 45°-ish up-right", () => {
        const r = measureLine(0, 4, 3, 0); // dx=3, dy=-4 → up-right
        expect(r.dist).toBe(5);
        expect(r.dx).toBe(3);
        expect(r.dy).toBe(-4);
        expect(Math.round(r.angle)).toBe(53); // atan2(4,3) ≈ 53.13°
    });
});

describe("shapeMetrics", () => {
    it("rectangle → bbox area & perimeter", () => {
        const m = shapeMetrics({ type: "rectangle", width: 100, height: 50 });
        expect(m.area).toBe(5000);
        expect(m.perimeter).toBe(300);
    });

    it("circle (ellipse) → πab area and Ramanujan circumference", () => {
        const m = shapeMetrics({ type: "circle", width: 100, height: 100 }); // r=50
        expect(m.area).toBeCloseTo(Math.PI * 2500, 6);
        expect(m.perimeter).toBeCloseTo(2 * Math.PI * 50, 3); // circle → exact 2πr
    });

    it("ellipse (unequal axes) → area πab, perimeter between the two circle bounds", () => {
        const m = shapeMetrics({ type: "circle", width: 200, height: 100 }); // a=100,b=50
        expect(m.area).toBeCloseTo(Math.PI * 100 * 50, 6);
        // Ramanujan approx is very close to the true value; sanity-bound it.
        expect(m.perimeter).toBeGreaterThan(2 * Math.PI * 50);
        expect(m.perimeter).toBeLessThan(2 * Math.PI * 100);
    });

    it("line → zero area, perimeter = segment length", () => {
        const m = shapeMetrics({ type: "line", width: 30, height: 40 });
        expect(m.area).toBe(0);
        expect(m.perimeter).toBe(50);
    });

    it("negative extents are normalised to magnitudes", () => {
        const m = shapeMetrics({ type: "rectangle", width: -100, height: -50 });
        expect(m.width).toBe(100);
        expect(m.area).toBe(5000);
    });
});
