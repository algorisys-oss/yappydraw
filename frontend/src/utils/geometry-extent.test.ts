/**
 * `geometryExtent` solves curve and arc extrema from the maths. These tests check it two
 * ways: against answers worked out by hand, and against the numerical flattener in
 * `shape-box-fit.test.ts`, which arrives at the same numbers by walking the curve instead of
 * solving it. Two implementations that agree are worth far more than one that passes.
 *
 * The stakes are asymmetric, which is why the analytic version exists at all: this sizes the
 * buffer for pattern, mesh, image and inflate fills, and an extent that comes out too SMALL
 * clips the artwork — the exact symptom of bug #322.
 */

import { describe, it, expect } from "bun:test";
import { geometryExtent, fillBufferRect } from "./geometry-extent";
import { samplePath } from "./shape-box-fit.test";
import { getShapeGeometry } from "./shape-geometry";
import type { DrawingElement } from "../types";

const sampled = (d: string) => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    samplePath(d, (x, y) => {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
    });
    return { minX, maxX, minY, maxY };
};
const solved = (d: string) => geometryExtent({ type: 'path', path: d } as any)!;

describe("geometryExtent — worked by hand", () => {
    it("takes a rect and an ellipse at face value", () => {
        expect(geometryExtent({ type: 'rect', x: -10, y: -20, w: 30, h: 40 } as any))
            .toEqual({ minX: -10, minY: -20, maxX: 20, maxY: 20 });
        expect(geometryExtent({ type: 'ellipse', cx: 5, cy: 0, rx: 15, ry: 25 } as any))
            .toEqual({ minX: -10, minY: -25, maxX: 20, maxY: 25 });
    });

    it("finds a cubic's peak, not its control points", () => {
        // Symmetric cubic with both controls at y = -100: the curve peaks at t = 0.5, where
        // y = 0.375·(-100) + 0.375·(-100) = -75. A naive control-point box would say -100.
        const e = solved("M 0 0 C 0 -100 100 -100 100 0");
        expect(e.minY).toBeCloseTo(-75, 6);
        expect(e.maxY).toBeCloseTo(0, 6);
        expect(e.minX).toBeCloseTo(0, 6);
        expect(e.maxX).toBeCloseTo(100, 6);
    });

    it("finds a quadratic's peak", () => {
        // Peak at t = 0.5 → y = 0.5·(-80) = -40.
        expect(solved("M 0 0 Q 50 -80 100 0").minY).toBeCloseTo(-40, 6);
    });

    it("honours the arc's x-axis-rotation", () => {
        // The same ellipse upright and turned 90°: the extents swap. Assuming the extremes
        // sit at the axis angles — true only for an UNROTATED ellipse — gets this wrong.
        const flat = solved("M -40 0 A 40 10 0 0 1 40 0 A 40 10 0 0 1 -40 0 Z");
        const turned = solved("M 0 -40 A 40 10 90 0 1 0 40 A 40 10 90 0 1 0 -40 Z");
        expect(flat.maxX - flat.minX).toBeCloseTo(80, 4);
        expect(flat.maxY - flat.minY).toBeCloseTo(20, 4);
        expect(turned.maxX - turned.minX).toBeCloseTo(20, 4);
        expect(turned.maxY - turned.minY).toBeCloseTo(80, 4);
    });

    it("applies the spec's radius correction for a chord that will not fit", () => {
        // r=100 across a 300 chord is impossible; SVG grows it to 150 (F.6.6).
        expect(solved("M -150 0 A 100 100 0 1 1 150 0").minY).toBeCloseTo(-150, 4);
    });

    it("only counts extremes the arc actually sweeps through", () => {
        // A quarter arc from (50,0) to (0,50) never reaches the top or the left of its
        // circle, so its box is exactly the quarter, not the whole circle.
        const e = solved("M 50 0 A 50 50 0 0 1 0 50");
        expect(e.minX).toBeCloseTo(0, 4);
        expect(e.maxX).toBeCloseTo(50, 4);
        expect(e.minY).toBeCloseTo(0, 4);
        expect(e.maxY).toBeCloseTo(50, 4);
    });

    it("reads relative commands and smooth curves", () => {
        const abs = solved("M 0 0 C 0 -60 60 -60 60 0 C 60 60 120 60 120 0");
        const smooth = solved("M 0 0 C 0 -60 60 -60 60 0 S 120 60 120 0");
        expect(smooth.minY).toBeCloseTo(abs.minY, 6);
        expect(smooth.maxY).toBeCloseTo(abs.maxY, 6);
        expect(solved("M 10 10 l 40 0 l 0 40 z").maxX).toBeCloseTo(50, 6);
    });

    it("survives a malformed path instead of looping", () => {
        expect(() => solved("M 0 0 L 10 10 ? 5")).not.toThrow();
        expect(geometryExtent({ type: 'path', path: "" } as any)).toBeNull();
        expect(geometryExtent(null)).toBeNull();
    });
});

describe("geometryExtent — agrees with flattening the same curve", () => {
    const el = (type: string, width: number, height: number): DrawingElement => ({
        id: 'e1', type, x: 0, y: 0, width, height,
        strokeColor: '#000000', backgroundColor: 'transparent', fillStyle: 'solid',
        strokeWidth: 2, strokeStyle: 'solid', roughness: 0, opacity: 100, angle: 0,
        renderStyle: 'architectural', seed: 3,
    }) as DrawingElement;

    // A spread of real geometry: arcs, cubics, quadratics, rotated arcs, multi-part shapes,
    // and the two shapes that deliberately overflow.
    const shapes = ['cloud', 'heart', 'lightbulb', 'magnet', 'scroll', 'puzzlePiece', 'cylinder',
        'star', 'capsule', 'speechBubble', 'gauge', 'flag', 'solidBlock', 'burstBlob'];

    it("matches the sampler on every one of them", () => {
        for (const type of shapes) {
            for (const [w, h] of [[300, 300], [600, 200]] as const) {
                const geo: any = getShapeGeometry(el(type, w, h));
                if (!geo || geo.type !== 'path') continue;
                const a = solved(geo.path), s = sampled(geo.path);
                // Flattening can only ever fall short of the true extent, never exceed it,
                // so the solved box must contain the sampled one and be no more than a
                // sampling step larger.
                const slack = Math.max(w, h) * 0.004;
                expect(a.minX).toBeLessThanOrEqual(s.minX + 1e-6);
                expect(a.maxX).toBeGreaterThanOrEqual(s.maxX - 1e-6);
                expect(a.minY).toBeLessThanOrEqual(s.minY + 1e-6);
                expect(a.maxY).toBeGreaterThanOrEqual(s.maxY - 1e-6);
                expect(a.minX).toBeGreaterThan(s.minX - slack);
                expect(a.maxX).toBeLessThan(s.maxX + slack);
                expect(a.minY).toBeGreaterThan(s.minY - slack);
                expect(a.maxY).toBeLessThan(s.maxY + slack);
            }
        }
    });
});

describe("fillBufferRect", () => {
    const el = (type: string, width: number, height: number): DrawingElement => ({
        id: 'e1', type, x: 0, y: 0, width, height,
        strokeColor: '#000000', backgroundColor: 'transparent', fillStyle: 'solid',
        strokeWidth: 2, strokeStyle: 'solid', roughness: 0, opacity: 100, angle: 0,
        renderStyle: 'architectural',
    }) as DrawingElement;

    it("is exactly the element's box for a shape that fits inside it", () => {
        const r = fillBufferRect(getShapeGeometry(el('cloud', 300, 200)), 300, 200);
        expect(r).toEqual({ x: -150, y: -100, w: 300, h: 200 });
    });

    it("grows to cover a shape that overflows on purpose", () => {
        // The puzzle piece's tabs protrude, and used to come out unfilled because the
        // buffer stopped at the box.
        const geo = getShapeGeometry(el('puzzlePiece', 300, 300));
        const r = fillBufferRect(geo, 300, 300);
        const e = geometryExtent(geo)!;
        expect(r.w).toBeGreaterThan(300);
        expect(r.x).toBeLessThanOrEqual(e.minX + 1e-6);
        expect(r.y).toBeLessThanOrEqual(e.minY + 1e-6);
        expect(r.x + r.w).toBeGreaterThanOrEqual(e.maxX - 1e-6);
        expect(r.y + r.h).toBeGreaterThanOrEqual(e.maxY - 1e-6);
    });

    it("never shrinks below the element, so a small shape keeps a full-size buffer", () => {
        // Pattern scale and phase come from the buffer, and a buffer that tracked the
        // artwork would make them shift as the shape is edited.
        const r = fillBufferRect({ type: 'rect', x: -10, y: -10, w: 20, h: 20 } as any, 300, 300);
        expect(r).toEqual({ x: -150, y: -150, w: 300, h: 300 });
    });

    it("falls back to the box rather than allocating something absurd", () => {
        const r = fillBufferRect({ type: 'rect', x: -50000, y: -50000, w: 100000, h: 100000 } as any, 100, 100);
        expect(r).toEqual({ x: -50, y: -50, w: 100, h: 100 });
    });

    it("copes with no geometry at all", () => {
        expect(fillBufferRect(null, 80, 60)).toEqual({ x: -40, y: -30, w: 80, h: 60 });
    });
});
