/**
 * Rounded corners must survive shape → path conversion.
 *
 * `shapeToPath` is the single door every "make this a real path" feature goes through —
 * Knife/Scissors, Warp presets, Pathfinder, Convert to Path. It emitted a rectangle as four
 * sharp corner anchors and never looked at `borderRadius`, so cutting a rounded rectangle
 * squared it off. Reported after a packaging design lost its rounded corners to the Knife.
 */

import { describe, it, expect } from "bun:test";
import { shapeToPath } from "./shape-to-path";
import type { DrawingElement } from "../types";

const rect = (over: Partial<DrawingElement> = {}): DrawingElement =>
    ({ id: "r1", type: "rectangle", x: 0, y: 0, width: 200, height: 100, ...over } as any);

/** Distance of a point from the rect's edges, for "is this anchor on the outline" checks. */
const nearly = (a: number, b: number) => Math.abs(a - b) < 1e-9;

describe("shapeToPath — sharp rectangles (unchanged)", () => {
    it("emits four corner anchors when there is no radius", () => {
        const r = shapeToPath(rect())!;
        expect(r.closed).toBe(true);
        expect(r.anchors.length).toBe(4);
        expect(r.anchors.every(a => a.kind === "corner")).toBe(true);
        expect(r.anchors.map(a => [a.x, a.y])).toEqual([[0, 0], [200, 0], [200, 100], [0, 100]]);
    });

    it("treats borderRadius 0 as sharp", () => {
        const r = shapeToPath(rect({ borderRadius: 0 }))!;
        expect(r.anchors.length).toBe(4);
        expect(r.anchors.every(a => a.kind === "corner")).toBe(true);
    });
});

describe("shapeToPath — rounded rectangles", () => {
    it("emits eight anchors, two per corner", () => {
        const r = shapeToPath(rect({ borderRadius: 20 }))!;
        expect(r.closed).toBe(true);
        expect(r.anchors.length).toBe(8);
    });

    it("leaves the unused side of each anchor with NO handle at all", () => {
        // A zero-length handle is not the same as a missing one: anchorsToPathData emits a
        // cubic whenever either endpoint defines any handle, so explicit zeros would turn
        // the four straight edges into degenerate curves.
        const r = shapeToPath(rect({ borderRadius: 20 }))!;
        for (const a of r.anchors) {
            const hasIn = a.inX !== undefined || a.inY !== undefined;
            const hasOut = a.outX !== undefined || a.outY !== undefined;
            expect(hasIn !== hasOut).toBe(true);   // exactly one side, never both, never neither
        }
    });

    it("insets each corner by the radius — percent of the SHORTER side", () => {
        // 200×100, 20% → r = 100 * 0.2 = 20
        const r = shapeToPath(rect({ borderRadius: 20 }))!;
        const xs = r.anchors.map(a => a.x), ys = r.anchors.map(a => a.y);
        expect(Math.min(...xs)).toBe(0);
        expect(Math.max(...xs)).toBe(200);
        expect(Math.min(...ys)).toBe(0);
        expect(Math.max(...ys)).toBe(100);
        // The two anchors on the top edge sit r in from each end.
        const topEdge = r.anchors.filter(a => nearly(a.y, 0)).map(a => a.x).sort((p, q) => p - q);
        expect(topEdge).toEqual([20, 180]);
        const leftEdge = r.anchors.filter(a => nearly(a.x, 0)).map(a => a.y).sort((p, q) => p - q);
        expect(leftEdge).toEqual([20, 80]);
    });

    it("clamps the radius to half the shorter side, so 50% is a stadium not a tangle", () => {
        const r = shapeToPath(rect({ borderRadius: 50 }))!;   // r = 50 = h/2
        const topEdge = r.anchors.filter(a => nearly(a.y, 0)).map(a => a.x).sort((p, q) => p - q);
        expect(topEdge).toEqual([50, 150]);
        const leftEdge = r.anchors.filter(a => nearly(a.x, 0)).map(a => a.y).sort((p, q) => p - q);
        expect(leftEdge).toEqual([50, 50]);   // the two left anchors meet at the middle
    });

    it("never lets an over-large radius push anchors outside the box", () => {
        const r = shapeToPath(rect({ borderRadius: 500 }))!;
        expect(r.anchors.every(a => a.x >= 0 && a.x <= 200 && a.y >= 0 && a.y <= 100)).toBe(true);
    });

    it("points every handle along its own edge, never diagonally", () => {
        const r = shapeToPath(rect({ borderRadius: 20 }))!;
        for (const a of r.anchors) {
            const hx = a.inX ?? a.outX ?? 0;
            const hy = a.inY ?? a.outY ?? 0;
            expect(hx === 0 || hy === 0).toBe(true);
        }
    });

    it("uses the KAPPA circular approximation, so corners look like quarter-circles", () => {
        const r = shapeToPath(rect({ borderRadius: 20 }))!;   // radius 20
        const KAPPA = 0.5522847498307936;
        for (const a of r.anchors) {
            const hx = a.inX ?? a.outX ?? 0;
            const hy = a.inY ?? a.outY ?? 0;
            expect(Math.hypot(hx, hy)).toBeCloseTo(KAPPA * 20, 9);
        }
    });

    it("honours the legacy `roundness` flag when borderRadius is absent", () => {
        const r = shapeToPath(rect({ roundness: true } as any))!;
        expect(r.anchors.length).toBe(8);
        const topEdge = r.anchors.filter(a => nearly(a.y, 0)).map(a => a.x).sort((p, q) => p - q);
        expect(topEdge).toEqual([15, 185]);   // 0.15 × 100
    });

    it("scales the radius with the shape, not the width alone", () => {
        const tall = shapeToPath(rect({ width: 100, height: 400, borderRadius: 25 }))!;
        const topEdge = tall.anchors.filter(a => nearly(a.y, 0)).map(a => a.x).sort((p, q) => p - q);
        expect(topEdge).toEqual([25, 75]);    // 25% of the shorter side (100)
    });
});
