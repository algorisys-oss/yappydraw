import { describe, it, expect } from "bun:test";
import { dimensionGeometry, dimensionLabel, type DimensionAnnotation } from "./dimension-geometry";

const box = { x: 100, y: 200, width: 80, height: 60 };

describe("dimensionGeometry", () => {
    it("measures width along the bottom edge, offset below", () => {
        const dim: DimensionAnnotation = { id: "d1", targetId: "t", measure: "width", offset: 24 };
        const g = dimensionGeometry(dim, box);
        expect(g.value).toBe(80);
        expect(g.orientation).toBe("horizontal");
        // edge endpoints on the bottom of the box
        expect(g.e1).toEqual({ x: 100, y: 260 });
        expect(g.e2).toEqual({ x: 180, y: 260 });
        // dimension line 24px below the bottom edge
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
        expect(g.e2).toEqual({ x: 180, y: 260 });
        expect(g.d1).toEqual({ x: 204, y: 200 });
        expect(g.d2).toEqual({ x: 204, y: 260 });
        expect(g.mid).toEqual({ x: 204, y: 230 });
    });

    it("auto-updates: a resized box yields a new value", () => {
        const dim: DimensionAnnotation = { id: "d3", targetId: "t", measure: "width", offset: 24 };
        expect(dimensionGeometry(dim, { ...box, width: 250 }).value).toBe(250);
    });

    it("defaults the offset when unset", () => {
        const dim = { id: "d4", targetId: "t", measure: "width" } as DimensionAnnotation;
        const g = dimensionGeometry(dim, box);
        expect(g.d1.y).toBe(260 + 24);
    });
});

describe("dimensionLabel", () => {
    it("rounds the measured value to px", () => {
        const dim: DimensionAnnotation = { id: "d", targetId: "t", measure: "width", offset: 24 };
        expect(dimensionLabel(dim, 80.4)).toBe("80 px");
    });
    it("honours a label override", () => {
        const dim: DimensionAnnotation = { id: "d", targetId: "t", measure: "width", offset: 24, label: "2 cm" };
        expect(dimensionLabel(dim, 80)).toBe("2 cm");
    });
});
