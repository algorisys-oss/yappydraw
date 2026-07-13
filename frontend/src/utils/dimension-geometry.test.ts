import { describe, it, expect } from "bun:test";
import { dimensionGeometry, dimensionLabel, type DimensionAnnotation } from "./dimension-geometry";

const box = { x: 100, y: 200, width: 80, height: 60 };

describe("dimensionGeometry — linear (axis-aligned)", () => {
    it("measures width along the bottom edge, offset below", () => {
        const dim: DimensionAnnotation = { id: "d1", targetId: "t", measure: "width", offset: 24 };
        const g = dimensionGeometry(dim, box);
        expect(g.kind).toBe("linear");
        expect(g.value).toBe(80);
        expect(g.orientation).toBe("horizontal");
        expect(g.e1).toEqual({ x: 100, y: 260 });
        expect(g.e2).toEqual({ x: 180, y: 260 });
        expect(g.d1).toEqual({ x: 100, y: 284 });
        expect(g.d2).toEqual({ x: 180, y: 284 });
        expect(g.mid).toEqual({ x: 140, y: 284 });
    });

    it("measures height along the right edge, offset to the right", () => {
        const dim: DimensionAnnotation = { id: "d2", targetId: "t", measure: "height", offset: 24 };
        const g = dimensionGeometry(dim, box);
        expect(g.value).toBe(60);
        expect(g.orientation).toBe("vertical");
        expect(g.e1).toEqual({ x: 180, y: 200 });
        expect(g.d1).toEqual({ x: 204, y: 200 });
        expect(g.d2).toEqual({ x: 204, y: 260 });
    });

    it("defaults the offset when unset", () => {
        const dim = { id: "d4", targetId: "t", measure: "width" } as DimensionAnnotation;
        expect(dimensionGeometry(dim, box).d1!.y).toBe(260 + 24);
    });
});

describe("dimensionGeometry — rotation-aware", () => {
    it("width value is unchanged but endpoints follow a 90° rotation", () => {
        const dim: DimensionAnnotation = { id: "d", targetId: "t", measure: "width", offset: 24 };
        const g = dimensionGeometry(dim, { ...box, angle: Math.PI / 2 });
        expect(g.value).toBe(80); // still the width
        // Under a 90° rotation the bottom edge is no longer horizontal.
        expect(Math.abs(g.e1!.y - g.e2!.y)).toBeGreaterThan(1); // edge became ~vertical
        // Dimension line stays `off` (24) away from the edge.
        expect(Math.hypot(g.d1!.x - g.e1!.x, g.d1!.y - g.e1!.y)).toBeCloseTo(24, 6);
    });
});

describe("dimensionGeometry — radial", () => {
    it("radius: centre → right rim, one arrowhead, value = w/2", () => {
        const g = dimensionGeometry({ id: "r", targetId: "t", measure: "radius", offset: 0 }, box);
        expect(g.kind).toBe("radial");
        expect(g.value).toBe(40);
        expect(g.arrowsBothEnds).toBe(false);
        expect(g.e1).toEqual({ x: 140, y: 230 }); // centre
        expect(g.e2).toEqual({ x: 180, y: 230 }); // right rim
    });
    it("diameter: left rim → right rim, value = w", () => {
        const g = dimensionGeometry({ id: "d", targetId: "t", measure: "diameter", offset: 0 }, box);
        expect(g.value).toBe(80);
        expect(g.arrowsBothEnds).toBe(true);
        expect(g.e1).toEqual({ x: 100, y: 230 });
        expect(g.e2).toEqual({ x: 180, y: 230 });
    });
});

describe("dimensionGeometry — angular", () => {
    it("reports the element's rotation in degrees with an arc", () => {
        const g = dimensionGeometry({ id: "a", targetId: "t", measure: "angle", offset: 0 }, { ...box, angle: Math.PI / 4 });
        expect(g.kind).toBe("angular");
        expect(g.value).toBeCloseTo(45, 6);
        expect(g.center).toEqual({ x: 140, y: 230 });
        expect(g.startAngle).toBe(0);
        expect(g.endAngle).toBeCloseTo(Math.PI / 4, 6);
    });
});

describe("dimensionLabel", () => {
    it("formats a linear value in the active unit", () => {
        const dim: DimensionAnnotation = { id: "d", targetId: "t", measure: "width", offset: 24 };
        const g = dimensionGeometry(dim, box);
        expect(dimensionLabel(dim, g, 'px')).toBe("80 px");
    });
    it("angular labels are degrees", () => {
        const dim: DimensionAnnotation = { id: "a", targetId: "t", measure: "angle", offset: 0 };
        const g = dimensionGeometry(dim, { ...box, angle: Math.PI / 4 });
        expect(dimensionLabel(dim, g, 'px')).toBe("45°");
    });
    it("honours a label override", () => {
        const dim: DimensionAnnotation = { id: "d", targetId: "t", measure: "width", offset: 24, label: "2 cm" };
        const g = dimensionGeometry(dim, box);
        expect(dimensionLabel(dim, g, 'mm')).toBe("2 cm");
    });
});
