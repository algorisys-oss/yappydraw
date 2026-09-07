import { describe, it, expect } from "bun:test";
import { elementToMultiPolygon, runBooleanOp, polyToPathSubpaths } from "./path-boolean";

/**
 * Position fidelity of the boolean/pathfinder pipeline.
 *
 * A Pathfinder or Shape Builder result must occupy exactly the world-space region its inputs
 * described — a union of two rectangles cannot come out translated. Anshika reported the
 * merged shape landing "at a different position (to the left of the bigger shape)" in Sep 2026,
 * so this pins the whole chain (element → world polygon → boolean → path element bbox) at every
 * step, for each geometry family, rather than eyeballing it.
 */

const rect = (x: number, y: number, width: number, height: number, extra: any = {}) =>
    ({ id: `r${x}_${y}`, type: 'rectangle', x, y, width, height, angle: 0, ...extra }) as any;

/** World-space bbox of a MultiPoly / poly list. */
const bboxOf = (polys: any[]) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const poly of polys) for (const ring of poly) for (const [x, y] of ring) {
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    return { minX, minY, maxX, maxY };
};

describe("elementToMultiPolygon puts geometry in WORLD space", () => {
    it("a rectangle maps to its own x/y/w/h", () => {
        const b = bboxOf(elementToMultiPolygon(rect(100, 200, 60, 40)));
        expect(b).toEqual({ minX: 100, minY: 200, maxX: 160, maxY: 240 });
    });

    it("an ellipse maps to its own bounding box", () => {
        // Flattening inscribes a polygon, so the bbox sits a fraction INSIDE the true ellipse
        // (FLATTEN_TOLERANCE, sub-pixel). A whole-pixel tolerance is the honest assertion here;
        // what matters is that it is not off by a half-width.
        const b = bboxOf(elementToMultiPolygon(rect(300, 50, 80, 80, { type: 'ellipse' })));
        expect(b.minX).toBeCloseTo(300, 0);
        expect(b.minY).toBeCloseTo(50, 0);
        expect(b.maxX).toBeCloseTo(380, 0);
        expect(b.maxY).toBeCloseTo(130, 0);
    });

    it("an editable path maps by its anchors, not by its stored width/height", () => {
        const el = rect(10, 20, 100, 50, {
            type: 'path',
            pathClosed: true,
            pathAnchors: [
                { x: 0, y: 0, kind: 'corner' },
                { x: 100, y: 0, kind: 'corner' },
                { x: 100, y: 50, kind: 'corner' },
                { x: 0, y: 50, kind: 'corner' },
            ],
        });
        const b = bboxOf(elementToMultiPolygon(el));
        expect(b.minX).toBeCloseTo(10, 3);
        expect(b.minY).toBeCloseTo(20, 3);
        expect(b.maxX).toBeCloseTo(110, 3);
        expect(b.maxY).toBeCloseTo(70, 3);
    });

    it("a far-from-origin shape does not drift toward the origin", () => {
        const b = bboxOf(elementToMultiPolygon(rect(4000, -2500, 120, 90)));
        expect(b).toEqual({ minX: 4000, minY: -2500, maxX: 4120, maxY: -2410 });
    });
});

describe("boolean results stay where the inputs were", () => {
    it("union of two overlapping rects spans both", () => {
        const b = bboxOf(runBooleanOp([rect(100, 100, 100, 100), rect(150, 150, 100, 100)], 'union'));
        expect(b).toEqual({ minX: 100, minY: 100, maxX: 250, maxY: 250 });
    });

    it("intersection covers only the overlap", () => {
        const b = bboxOf(runBooleanOp([rect(100, 100, 100, 100), rect(150, 150, 100, 100)], 'intersect'));
        expect(b).toEqual({ minX: 150, minY: 150, maxX: 200, maxY: 200 });
    });

    it("subtract keeps the backmost shape's own extent", () => {
        const b = bboxOf(runBooleanOp([rect(100, 100, 100, 100), rect(150, 150, 100, 100)], 'subtract'));
        expect(b).toEqual({ minX: 100, minY: 100, maxX: 200, maxY: 200 });
    });

    it("a mixed rect + ellipse union is not offset by either shape's half-size", () => {
        const b = bboxOf(runBooleanOp(
            [rect(200, 200, 100, 100), rect(250, 250, 100, 100, { type: 'ellipse' })], 'union'));
        expect(b.minX).toBeCloseTo(200, 1);
        expect(b.minY).toBeCloseTo(200, 1);
        expect(b.maxX).toBeCloseTo(350, 1);
        expect(b.maxY).toBeCloseTo(350, 1);
    });
});

describe("the result element's origin equals the result geometry's origin", () => {
    it("polyToPathSubpaths reports the true world min and rebases anchors to it", () => {
        const polys = runBooleanOp([rect(100, 100, 100, 100), rect(150, 150, 100, 100)], 'union');
        const world = bboxOf(polys);
        const norm = polyToPathSubpaths(polys[0])!;

        // x/y of the created element
        expect(norm.minX).toBeCloseTo(world.minX, 3);
        expect(norm.minY).toBeCloseTo(world.minY, 3);
        // width/height of the created element
        expect(norm.width).toBeCloseTo(world.maxX - world.minX, 3);
        expect(norm.height).toBeCloseTo(world.maxY - world.minY, 3);

        // Every anchor is inside [0,width] x [0,height] — i.e. genuinely relative to that origin,
        // so element.x + anchor.x reproduces the world point exactly.
        for (const sp of norm.subpaths) for (const a of sp.anchors) {
            expect(a.x).toBeGreaterThanOrEqual(-1e-6);
            expect(a.y).toBeGreaterThanOrEqual(-1e-6);
            expect(a.x).toBeLessThanOrEqual(norm.width + 1e-6);
            expect(a.y).toBeLessThanOrEqual(norm.height + 1e-6);
        }
    });
});
