import { describe, it, expect } from "bun:test";
import { arrowheadSize, defaultArrowheadSize, ARROWHEAD_MAX, ARROWHEAD_MIN } from "./arrowhead-size";

describe("defaultArrowheadSize", () => {
    it("scales with the stroke and clamps to 10–28", () => {
        expect(defaultArrowheadSize(1.5)).toBe(14);
        expect(defaultArrowheadSize(2)).toBe(16);
        expect(defaultArrowheadSize(4)).toBe(26);
        expect(defaultArrowheadSize(6)).toBe(ARROWHEAD_MAX);
        expect(defaultArrowheadSize(0.5)).toBe(ARROWHEAD_MIN);
    });
    it("treats a missing or zero stroke as the 2px default", () => {
        expect(defaultArrowheadSize(undefined)).toBe(16);
        expect(defaultArrowheadSize(0)).toBe(16);
    });
});

describe("arrowheadSize", () => {
    it("prefers an explicit size on that end", () => {
        expect(arrowheadSize({ strokeWidth: 1.5, startArrowheadSize: 40 }, "start")).toBe(40);
        expect(arrowheadSize({ strokeWidth: 1.5, startArrowheadSize: 40 }, "end")).toBe(14);
    });
    it("ignores a zero or negative explicit size", () => {
        expect(arrowheadSize({ strokeWidth: 3, endArrowheadSize: 0 }, "end")).toBe(21);
    });
});
