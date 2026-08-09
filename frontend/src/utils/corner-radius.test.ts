/**
 * Independent corner radii for rectangles.
 *
 * `borderRadius` rounds all four corners equally. Packaging, UI cards and logo work routinely
 * need one or two corners rounded and the rest sharp, which previously meant drawing a custom
 * path. The per-corner fields override `borderRadius` corner by corner, in the SAME unit
 * (percent of the shorter side) so a resize keeps the shape's character.
 */

import { describe, it, expect } from "bun:test";
import {
    cornerRadiiPx, uniformRadiusPx, roundRectRadii, hasPerCornerRadius, roundedRectPath,
} from "./corner-radius";

const rect = (over: Record<string, any> = {}) => ({ width: 200, height: 100, ...over } as any);

describe("uniformRadiusPx — the pre-existing behaviour, unchanged", () => {
    it("is a percent of the SHORTER side", () => {
        expect(uniformRadiusPx(rect({ borderRadius: 20 }))).toBe(20);      // 20% of 100
        expect(uniformRadiusPx(rect({ width: 100, height: 400, borderRadius: 25 }))).toBe(25);
    });

    it("is zero with no radius and no legacy roundness", () => {
        expect(uniformRadiusPx(rect())).toBe(0);
    });

    it("honours the legacy roundness flag", () => {
        expect(uniformRadiusPx(rect({ roundness: { type: 3 } }))).toBeCloseTo(15, 9);   // 0.15 × 100
        expect(uniformRadiusPx(rect({ roundness: null }))).toBe(0);
    });
});

describe("hasPerCornerRadius", () => {
    it("is false for a plain or uniformly rounded rectangle", () => {
        expect(hasPerCornerRadius(rect())).toBe(false);
        expect(hasPerCornerRadius(rect({ borderRadius: 30 }))).toBe(false);
        expect(hasPerCornerRadius(null)).toBe(false);
    });

    it("is true as soon as any single corner is set — including to zero", () => {
        expect(hasPerCornerRadius(rect({ radiusTL: 10 }))).toBe(true);
        expect(hasPerCornerRadius(rect({ radiusBR: 0 }))).toBe(true);
    });
});

describe("cornerRadiiPx", () => {
    it("gives four equal corners for a uniform radius", () => {
        expect(cornerRadiiPx(rect({ borderRadius: 20 }))).toEqual([20, 20, 20, 20]);
    });

    it("lets each corner differ, in TL/TR/BR/BL order", () => {
        const r = cornerRadiiPx(rect({ radiusTL: 20, radiusTR: 10, radiusBR: 0, radiusBL: 50 }));
        expect(r).toEqual([20, 10, 0, 50]);
    });

    it("falls back to borderRadius for corners left unset — one corner doesn't square the rest", () => {
        // This is the whole point: set the top-left only, and the other three keep the
        // uniform rounding they already had.
        expect(cornerRadiiPx(rect({ borderRadius: 10, radiusTL: 40 }))).toEqual([40, 10, 10, 10]);
    });

    it("treats an explicit 0 as sharp, not as 'inherit'", () => {
        expect(cornerRadiiPx(rect({ borderRadius: 30, radiusTR: 0 }))).toEqual([30, 0, 30, 30]);
    });

    it("caps each corner at half the shorter side so the arcs can't cross", () => {
        expect(cornerRadiiPx(rect({ radiusTL: 100, radiusTR: 80 }))).toEqual([50, 50, 0, 0]);
    });

    it("never returns a negative radius", () => {
        expect(cornerRadiiPx(rect({ radiusTL: -20 }))).toEqual([0, 0, 0, 0]);
    });

    it("scales with the shape, being a percentage", () => {
        const small = cornerRadiiPx(rect({ width: 200, height: 100, radiusTL: 20 }))[0];
        const big = cornerRadiiPx(rect({ width: 400, height: 200, radiusTL: 20 }))[0];
        expect(big).toBe(small * 2);
    });
});

describe("roundRectRadii", () => {
    it("collapses to a single number when all four agree — the common case", () => {
        expect(roundRectRadii(rect({ borderRadius: 20 }))).toBe(20);
        expect(roundRectRadii(rect())).toBe(0);
    });

    it("returns the tuple only when the corners actually differ", () => {
        expect(roundRectRadii(rect({ radiusTL: 20 }))).toEqual([20, 0, 0, 0]);
    });
});

describe("roundedRectPath", () => {
    it("closes the path and starts after the top-left arc", () => {
        const d = roundedRectPath(0, 0, 200, 100, [10, 10, 10, 10]);
        expect(d.startsWith("M 10 0")).toBe(true);
        expect(d.trim().endsWith("Z")).toBe(true);
        expect((d.match(/Q/g) || []).length).toBe(4);
    });

    it("omits the curve for a sharp corner, so edges meet square", () => {
        const d = roundedRectPath(0, 0, 200, 100, [10, 0, 0, 0]);
        expect((d.match(/Q/g) || []).length).toBe(1);
        expect(d).toContain("L 200 0");     // straight into the sharp top-right
    });

    it("draws no curves at all when every corner is sharp", () => {
        expect(roundedRectPath(0, 0, 200, 100, [0, 0, 0, 0])).not.toContain("Q");
    });

    it("stays within the box for maximum radii", () => {
        const d = roundedRectPath(0, 0, 200, 100, [50, 50, 50, 50]);
        const nums = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map(m => parseFloat(m[0]));
        expect(Math.min(...nums)).toBeGreaterThanOrEqual(0);
        expect(Math.max(...nums)).toBeLessThanOrEqual(200);
    });
});
