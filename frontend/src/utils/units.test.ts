import { describe, it, expect } from "bun:test";
import { pxToUnit, formatValue, formatLength, formatArea } from "./units";

describe("pxToUnit", () => {
    it("px is identity", () => expect(pxToUnit(120, 'px')).toBe(120));
    it("96px = 1in", () => expect(pxToUnit(96, 'in')).toBeCloseTo(1, 9));
    it("96px = 25.4mm", () => expect(pxToUnit(96, 'mm')).toBeCloseTo(25.4, 9));
});

describe("formatLength", () => {
    it("px → whole number + suffix", () => expect(formatLength(120.4, 'px')).toBe("120 px"));
    it("mm → 1 decimal", () => expect(formatLength(96, 'mm')).toBe("25.4 mm"));
    it("in → 2 decimals", () => expect(formatLength(120, 'in')).toBe("1.25 in"));
    it("defaults to px", () => expect(formatLength(50)).toBe("50 px"));
});

describe("formatArea", () => {
    it("px² unchanged", () => expect(formatArea(5000, 'px')).toBe("5000 px²"));
    it("scales by the square for in²", () => {
        // 96×96 px = 1×1 in = 1 in²
        expect(formatArea(96 * 96, 'in')).toBe("1.00 in²");
    });
});

describe("formatValue", () => {
    it("no suffix", () => expect(formatValue(96, 'mm')).toBe("25.4"));
});
