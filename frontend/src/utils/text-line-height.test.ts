/**
 * Line spacing (leading).
 *
 * The 1.2× factor was written out at seven separate sites — canvas renderer, three measurement
 * helpers, text-to-outlines, rich-text layout, the typewriter animation and both editing
 * overlays. Making it a setting meant routing all of them through one definition, because a
 * single missed site shows up as the editor disagreeing with the canvas, or the export
 * disagreeing with both.
 */

import { describe, it, expect } from "bun:test";
import {
    lineHeightFactorOf, lineHeightPx,
    DEFAULT_LINE_HEIGHT, MIN_LINE_HEIGHT, MAX_LINE_HEIGHT,
} from "./text-line-height";

describe("lineHeightFactorOf", () => {
    it("defaults to the 1.2 every text element used before the setting existed", () => {
        expect(lineHeightFactorOf(undefined)).toBe(DEFAULT_LINE_HEIGHT);
        expect(lineHeightFactorOf(null)).toBe(DEFAULT_LINE_HEIGHT);
        expect(lineHeightFactorOf({})).toBe(DEFAULT_LINE_HEIGHT);
        expect(lineHeightFactorOf({ lineHeight: undefined })).toBe(DEFAULT_LINE_HEIGHT);
    });

    it("uses the element's own value when it has one", () => {
        expect(lineHeightFactorOf({ lineHeight: 1 })).toBe(1);
        expect(lineHeightFactorOf({ lineHeight: 2.5 })).toBe(2.5);
    });

    it("clamps to sane bounds, so a bad value can't collapse or explode the layout", () => {
        expect(lineHeightFactorOf({ lineHeight: 0.1 })).toBe(MIN_LINE_HEIGHT);
        expect(lineHeightFactorOf({ lineHeight: 99 })).toBe(MAX_LINE_HEIGHT);
    });

    it("falls back rather than propagating junk from a file or the API", () => {
        expect(lineHeightFactorOf({ lineHeight: 0 })).toBe(DEFAULT_LINE_HEIGHT);
        expect(lineHeightFactorOf({ lineHeight: -2 })).toBe(DEFAULT_LINE_HEIGHT);
        expect(lineHeightFactorOf({ lineHeight: NaN })).toBe(DEFAULT_LINE_HEIGHT);
        expect(lineHeightFactorOf({ lineHeight: Infinity })).toBe(DEFAULT_LINE_HEIGHT);
        expect(lineHeightFactorOf({ lineHeight: "1.5" as any })).toBe(DEFAULT_LINE_HEIGHT);
    });
});

describe("lineHeightPx", () => {
    it("is the font size times the factor", () => {
        expect(lineHeightPx(20, { lineHeight: 1.5 })).toBe(30);
        expect(lineHeightPx(32, { lineHeight: 2 })).toBe(64);
    });

    it("reproduces the old hardcoded behaviour when unset", () => {
        for (const size of [8, 12, 20, 28, 32, 96, 400]) {
            expect(lineHeightPx(size)).toBeCloseTo(size * 1.2, 9);
            expect(lineHeightPx(size, {})).toBeCloseTo(size * 1.2, 9);
        }
    });

    it("scales with the font size, so resizing text keeps the spacing proportional", () => {
        const tight = { lineHeight: 0.9 };
        expect(lineHeightPx(40, tight) / lineHeightPx(20, tight)).toBeCloseTo(2, 9);
    });

    it("a factor of 1 sets the lines solid — the leading equals the font size", () => {
        expect(lineHeightPx(48, { lineHeight: 1 })).toBe(48);
    });
});
