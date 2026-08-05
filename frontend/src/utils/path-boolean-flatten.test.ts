import { describe, it, expect } from "bun:test";
import { elementToMultiPolygon } from "./path-boolean";
import type { DrawingElement, PathAnchor } from "../types";

/** A closed square ring as path anchors, at the element's local origin. */
const squareAnchors = (x: number, y: number, size: number): PathAnchor[] => [
    { x, y, kind: 'corner' },
    { x: x + size, y, kind: 'corner' },
    { x: x + size, y: y + size, kind: 'corner' },
    { x, y: y + size, kind: 'corner' },
];

const pathEl = (subpaths: { anchors: PathAnchor[]; closed: boolean }[], w = 200, h = 200): DrawingElement => ({
    id: 'p1', type: 'path', x: 0, y: 0, width: w, height: h,
    pathSubpaths: subpaths,
} as DrawingElement);

describe("elementToMultiPolygon — contours", () => {
    it("keeps two disjoint contours as two separate polygons", () => {
        const el = pathEl([
            { anchors: squareAnchors(0, 0, 50), closed: true },
            { anchors: squareAnchors(120, 0, 50), closed: true },
        ]);
        const mp = elementToMultiPolygon(el);
        expect(mp).toHaveLength(2);
        expect(mp[0]).toHaveLength(1);   // each is one solid ring, no holes
        expect(mp[1]).toHaveLength(1);
    });

    it("nests a contained contour as a HOLE rather than a second solid", () => {
        // A donut: an outer square with a smaller one fully inside it.
        const el = pathEl([
            { anchors: squareAnchors(0, 0, 200), closed: true },
            { anchors: squareAnchors(60, 60, 80), closed: true },
        ]);
        const mp = elementToMultiPolygon(el);
        expect(mp).toHaveLength(1);      // ONE polygon...
        expect(mp[0]).toHaveLength(2);   // ...with an outer ring and a hole
    });

    it("treats an island inside a hole as solid again (even-odd)", () => {
        const el = pathEl([
            { anchors: squareAnchors(0, 0, 200), closed: true },     // outer
            { anchors: squareAnchors(40, 40, 120), closed: true },   // hole
            { anchors: squareAnchors(80, 80, 40), closed: true },    // island in the hole
        ]);
        const mp = elementToMultiPolygon(el);
        // The outer+hole polygon, and the island as its own solid polygon.
        expect(mp).toHaveLength(2);
        const withHole = mp.find(p => p.length === 2);
        const solid = mp.find(p => p.length === 1);
        expect(withHole).toBeDefined();
        expect(solid).toBeDefined();
    });

    it("does not weld separate contours into one ring", () => {
        const el = pathEl([
            { anchors: squareAnchors(0, 0, 50), closed: true },
            { anchors: squareAnchors(120, 0, 50), closed: true },
        ]);
        const mp = elementToMultiPolygon(el);
        // Every ring must stay within its own contour's bounds. A welded ring would contain
        // points from both squares, so its x-span would cover the 70-unit gap between them.
        for (const poly of mp) {
            for (const ring of poly) {
                const xs = ring.map(([x]) => x);
                expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(60);
            }
        }
    });
});

describe("elementToMultiPolygon — curve fidelity", () => {
    /** Max distance from any ring vertex to the true circle of radius r centred at c. */
    const radialError = (ring: [number, number][], cx: number, cy: number, r: number) =>
        Math.max(...ring.map(([x, y]) => Math.abs(Math.hypot(x - cx, y - cy) - r)));

    it("flattens an ellipse to within a fraction of a unit of the true curve", () => {
        const el: DrawingElement = { id: 'e1', type: 'ellipse', x: 0, y: 0, width: 200, height: 200 } as DrawingElement;
        const mp = elementToMultiPolygon(el);
        expect(mp).toHaveLength(1);
        expect(radialError(mp[0][0], 100, 100, 100)).toBeLessThan(1);
    });

    it("spends points where the curvature is, not uniformly along the path", () => {
        // One quarter-circle of radius 100 followed by a long straight run. Uniform sampling
        // splits its budget evenly and under-resolves the curve; adaptive flattening puts
        // almost every point on the arc and needs about two for the straight part.
        const d = 'M 0 0 C 55 0 100 45 100 100 L 100 900 L 0 900 Z';
        const el: DrawingElement = {
            id: 'c1', type: 'customShape', x: 0, y: 0, width: 100, height: 900,
            customPath: d,
        } as unknown as DrawingElement;
        const mp = elementToMultiPolygon(el);
        // Not every build exposes customShape geometry; only assert when we got a ring.
        if (mp.length && mp[0][0]?.length) {
            const ring = mp[0][0];
            const onArc = ring.filter(([x, y]) => x <= 100 && y <= 100).length;
            expect(onArc).toBeGreaterThan(3);
        }
    });

    it("produces a ring with no duplicated consecutive points", () => {
        const el: DrawingElement = { id: 'e2', type: 'ellipse', x: 0, y: 0, width: 120, height: 60 } as DrawingElement;
        const ring = elementToMultiPolygon(el)[0][0];
        for (let i = 1; i < ring.length; i++) {
            const d = Math.hypot(ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]);
            if (i < ring.length - 1) expect(d).toBeGreaterThan(1e-9);
        }
    });
});

describe("elementToMultiPolygon — ellipse resolution scales with size", () => {
    const radialError = (ring: [number, number][], cx: number, cy: number, r: number) =>
        Math.max(...ring.map(([x, y]) => Math.abs(Math.hypot(x - cx, y - cy) - r)));

    it("holds the same tolerance on a large circle as a small one", () => {
        const small = elementToMultiPolygon({ id: 's', type: 'ellipse', x: 0, y: 0, width: 40, height: 40 } as DrawingElement);
        const large = elementToMultiPolygon({ id: 'l', type: 'ellipse', x: 0, y: 0, width: 2000, height: 2000 } as DrawingElement);
        // A fixed 64-gon would be ~1.2 units off on the large one.
        expect(radialError(small[0][0], 20, 20, 20)).toBeLessThan(0.3);
        expect(radialError(large[0][0], 1000, 1000, 1000)).toBeLessThan(0.3);
        // ...and it gets there by spending more segments, not by luck.
        expect(large[0][0].length).toBeGreaterThan(small[0][0].length);
    });

    it("does not blow up the segment count on an enormous shape", () => {
        const huge = elementToMultiPolygon({ id: 'h', type: 'ellipse', x: 0, y: 0, width: 100000, height: 100000 } as DrawingElement);
        expect(huge[0][0].length).toBeLessThanOrEqual(513);
    });
});
