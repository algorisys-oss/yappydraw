import { describe, it, expect } from "bun:test";
import { segmentIntersection, elementSegments, getIntersectionPoints } from "./path-intersection";

describe("segmentIntersection", () => {
    it("finds the crossing of two diagonals", () => {
        const p = segmentIntersection({ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }, { x: 100, y: 0 });
        expect(p).toEqual({ x: 50, y: 50 });
    });
    it("returns null for parallel segments", () => {
        expect(segmentIntersection({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 10 }, { x: 100, y: 10 })).toBeNull();
    });
    it("returns null when the crossing is beyond a segment's extent", () => {
        // lines cross at (50,50) but the second segment stops at y=40
        expect(segmentIntersection({ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 40 }, { x: 30, y: 40 })).toBeNull();
    });
});

describe("elementSegments", () => {
    it("a rectangle yields its 4 bbox edges", () => {
        expect(elementSegments({ id: 'r', x: 0, y: 0, width: 100, height: 50 })).toHaveLength(4);
    });
    it("a line yields a single segment end to end", () => {
        const segs = elementSegments({ id: 'l', x: 10, y: 20, width: 80, height: 40, type: 'line' });
        expect(segs).toHaveLength(1);
        expect(segs[0]).toEqual({ a: { x: 10, y: 20 }, b: { x: 90, y: 60 } });
    });
    it("a path yields a closed polyline through its anchors", () => {
        const segs = elementSegments({ id: 'p', x: 0, y: 0, width: 10, height: 10, pathAnchors: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }] });
        expect(segs).toHaveLength(3); // closed triangle
    });
});

describe("getIntersectionPoints", () => {
    const line = (id: string, x: number, y: number, w: number, h: number) =>
        ({ id, x, y, width: w, height: h, type: 'line', layerId: 'L1' });

    it("two crossing lines intersect at their crossing point", () => {
        const a = line('a', 0, 0, 100, 100);   // (0,0)→(100,100)
        const b = line('b', 0, 100, 100, -100); // (0,100)→(100,0)
        const pts = getIntersectionPoints([a, b]);
        expect(pts).toHaveLength(1);
        expect(pts[0].x).toBeCloseTo(50, 6);
        expect(pts[0].y).toBeCloseTo(50, 6);
    });

    it("two overlapping rectangles cross their edges at two points", () => {
        const r1 = { id: 'r1', x: 0, y: 0, width: 100, height: 100, layerId: 'L1' };
        const r2 = { id: 'r2', x: 50, y: 50, width: 100, height: 100, layerId: 'L1' };
        const pts = getIntersectionPoints([r1, r2]);
        // r2's left edge crosses r1's bottom edge at (50,100); r2's top edge crosses r1's right at (100,50)
        expect(pts).toHaveLength(2);
        expect(pts.some(p => Math.abs(p.x - 50) < 1e-6 && Math.abs(p.y - 100) < 1e-6)).toBe(true);
        expect(pts.some(p => Math.abs(p.x - 100) < 1e-6 && Math.abs(p.y - 50) < 1e-6)).toBe(true);
    });

    it("non-overlapping bboxes produce no intersections (broad-phase skip)", () => {
        const r1 = { id: 'r1', x: 0, y: 0, width: 40, height: 40, layerId: 'L1' };
        const r2 = { id: 'r2', x: 200, y: 200, width: 40, height: 40, layerId: 'L1' };
        expect(getIntersectionPoints([r1, r2])).toHaveLength(0);
    });
});
