import { describe, it, expect } from "bun:test";
import { cssColorToHex, cssColorToRgb255, p3ToSrgb } from "./color-utils";

/**
 * These run under Bun, where there is no DOM — so the canvas fallback inside
 * `cssColorToRgb255` returns null. That is deliberate coverage: the forms the app itself
 * writes (hex, `color(display-p3 …)`, `oklch(…)`) must all be parsed HERE, without a
 * browser, because they are the ones a document can hold. `rgb()`/`hsl()`/named colours
 * arrive from imported SVG and are delegated to the browser; they are exercised in the
 * `color-picker-p3` Playwright spec instead.
 */

describe("cssColorToHex — hex", () => {
    it("accepts the three lengths and normalises to #rrggbb", () => {
        expect(cssColorToHex("#abc")).toBe("#aabbcc");
        expect(cssColorToHex("#E03131")).toBe("#e03131");
        expect(cssColorToHex("#ff000080")).toBe("#ff0000");   // alpha dropped, not misread
    });

    it("rejects nonsense rather than guessing", () => {
        expect(cssColorToHex("#gg0000")).toBeNull();
        expect(cssColorToHex("#12345")).toBeNull();
    });
});

describe("cssColorToHex — no colour at all", () => {
    it("treats the empty cases as null, not black", () => {
        for (const v of ["transparent", "none", "", "  ", null, undefined, "currentColor"]) {
            expect(cssColorToHex(v as never)).toBeNull();
        }
    });
});

describe("cssColorToHex — Display P3", () => {
    /**
     * The regression this file exists for: every swatch in the P3 Wide-Gamut palette is a
     * `color(display-p3 …)` string, and the colour picker's hex-only parser rejected all of
     * them — so picking one moved the swatch but left the picker showing the old colour.
     */
    it("maps the palette's primaries to their sRGB equivalents", () => {
        expect(cssColorToHex("color(display-p3 1 0 0)")).toBe("#ff0000");
        expect(cssColorToHex("color(display-p3 0 1 0)")).toBe("#00ff00");
        expect(cssColorToHex("color(display-p3 0 0 1)")).toBe("#0000ff");
        expect(cssColorToHex("color(display-p3 1 1 0)")).toBe("#ffff00");
        expect(cssColorToHex("color(display-p3 1 0 1)")).toBe("#ff00ff");
        expect(cssColorToHex("color(display-p3 0 1 1)")).toBe("#00ffff");
    });

    it("keeps the hue of an in-gamut P3 colour", () => {
        // P3 orange: red-dominant, mid green, no blue — the ordering must survive.
        const rgb = cssColorToRgb255("color(display-p3 1 0.5 0)")!;
        expect(rgb[0]).toBe(255);
        expect(rgb[1]).toBeGreaterThan(90);
        expect(rgb[1]).toBeLessThan(160);
        expect(rgb[2]).toBeLessThan(20);
    });

    it("accepts percentages, an alpha tail, and the srgb space", () => {
        expect(cssColorToHex("color(display-p3 100% 0% 0%)")).toBe("#ff0000");
        expect(cssColorToHex("color(display-p3 1 0 0 / 0.5)")).toBe("#ff0000");
        expect(cssColorToHex("color(srgb 1 0.5 0)")).toBe("#ff8000");
    });

    it("round-trips greys, where P3 and sRGB agree", () => {
        expect(cssColorToHex("color(display-p3 0 0 0)")).toBe("#000000");
        expect(cssColorToHex("color(display-p3 1 1 1)")).toBe("#ffffff");
    });

    it("rejects a malformed color() rather than throwing", () => {
        expect(cssColorToHex("color(display-p3 1 0)")).toBeNull();
        expect(cssColorToHex("color(display-p3 a b c)")).toBeNull();
    });
});

describe("p3ToSrgb", () => {
    it("leaves the neutral axis alone", () => {
        for (const v of [0, 0.25, 0.5, 1]) {
            const c = p3ToSrgb(v, v, v);
            expect(c.r).toBeCloseTo(v, 5);
            expect(c.g).toBeCloseTo(v, 5);
            expect(c.b).toBeCloseTo(v, 5);
        }
    });

    it("reports saturated P3 as out of the sRGB gamut instead of silently clamping", () => {
        // Callers clamp; the conversion itself must stay honest, or "is this displayable?"
        // becomes unanswerable.
        const red = p3ToSrgb(1, 0, 0);
        expect(red.r).toBeGreaterThan(1);
        expect(red.g).toBeLessThan(0);
    });
});

describe("cssColorToHex — oklch", () => {
    it("parses the advanced picker's own output", () => {
        const hex = cssColorToHex("oklch(0.7 0.15 30)");
        expect(hex).toMatch(/^#[0-9a-f]{6}$/);
        const [r, g, b] = cssColorToRgb255("oklch(0.7 0.15 30)")!;
        expect(r).toBeGreaterThan(g);      // hue 30° is warm
        expect(r).toBeGreaterThan(b);
    });

    it("accepts a percentage lightness and an alpha tail", () => {
        expect(cssColorToHex("oklch(70% 0.15 30)")).toBe(cssColorToHex("oklch(0.7 0.15 30)"));
        expect(cssColorToHex("oklch(0.7 0.15 30 / 50%)")).toBe(cssColorToHex("oklch(0.7 0.15 30)"));
    });
});
