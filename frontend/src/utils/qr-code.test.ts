import { describe, it, expect, beforeEach } from "bun:test";
import {
    buildQrMatrix, qrRuns, qrLayout, qrWarnings, contrastRatio, clearQrCache,
    QR_DEFAULTS,
} from "./qr-code";

beforeEach(() => clearQrCache());

describe("buildQrMatrix", () => {
    it("encodes data into a square matrix with no built-in border", () => {
        const m = buildQrMatrix("https://yappydraw.com", "M");
        if ("error" in m) throw new Error(m.error);
        expect(m.size).toBe(25); // version 2
        expect(m.modules.length).toBe(25);
        expect(m.modules.every(r => r.length === 25)).toBe(true);
        // Finder pattern corner module is dark — proves the border was not added.
        expect(m.modules[0][0]).toBe(true);
        expect(m.modules[0][24]).toBe(true);
        expect(m.modules[24][0]).toBe(true);
    });

    it("reports empty data instead of encoding an empty string", () => {
        expect(buildQrMatrix("", "M")).toEqual({ error: "empty" });
        expect(buildQrMatrix("   ", "M")).toEqual({ error: "empty" });
    });

    it("reports data too long for the chosen error-correction level", () => {
        const long = "x".repeat(2000);
        expect(buildQrMatrix(long, "H")).toEqual({ error: "too-long" });
        expect("error" in buildQrMatrix(long, "L")).toBe(false);
    });

    it("falls back to the default level for an unknown one", () => {
        const a = buildQrMatrix("hello", "Z" as any);
        const b = buildQrMatrix("hello", QR_DEFAULTS.errorCorrection);
        expect(a).toEqual(b);
    });

    it("returns the same matrix object for repeated calls (renders every frame)", () => {
        expect(buildQrMatrix("hello", "M")).toBe(buildQrMatrix("hello", "M"));
        expect(buildQrMatrix("hello", "M")).not.toBe(buildQrMatrix("hello", "Q"));
    });
});

describe("qrRuns", () => {
    it("covers exactly the dark modules with horizontal runs", () => {
        const m = buildQrMatrix("run coverage", "Q");
        if ("error" in m) throw new Error(m.error);
        const painted = m.modules.map(r => r.map(() => false));
        for (const run of qrRuns(m.modules)) {
            for (let x = run.x; x < run.x + run.w; x++) {
                expect(painted[run.y][x]).toBe(false); // no overlap
                painted[run.y][x] = true;
            }
        }
        expect(painted).toEqual(m.modules);
    });

    it("merges adjacent dark modules into one run", () => {
        expect(qrRuns([[true, true, false, true]])).toEqual([
            { x: 0, y: 0, w: 2 }, { x: 3, y: 0, w: 1 },
        ]);
    });
});

describe("qrLayout", () => {
    it("fits the code plus quiet zone into the shorter side, centred", () => {
        const l = qrLayout({ x: 10, y: 20, width: 300, height: 200 }, 21, 2);
        expect(l.cell).toBeCloseTo(200 / 25);
        expect(l.originX).toBeCloseTo(10 + (300 - 200) / 2 + 2 * l.cell);
        expect(l.originY).toBeCloseTo(20 + 2 * l.cell);
    });

    it("handles negative sizes from a mid-drag element", () => {
        const l = qrLayout({ x: 100, y: 100, width: -50, height: -50 }, 21, 0);
        expect(l.cell).toBeCloseTo(50 / 21);
        expect(l.originX).toBeCloseTo(50);
        expect(l.originY).toBeCloseTo(50);
    });

    it("clamps the quiet zone to 0..10 modules", () => {
        expect(qrLayout({ x: 0, y: 0, width: 100, height: 100 }, 21, -3).cell).toBeCloseTo(100 / 21);
        expect(qrLayout({ x: 0, y: 0, width: 100, height: 100 }, 21, 99).cell).toBeCloseTo(100 / 41);
    });
});

describe("contrastRatio", () => {
    it("matches WCAG for black on white and identical colours", () => {
        expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
        expect(contrastRatio("#777777", "#777777")).toBeCloseTo(1, 5);
        expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 1);
    });

    it("returns null for colours it cannot read", () => {
        expect(contrastRatio("transparent", "#fff")).toBeNull();
        expect(contrastRatio("rgb(0,0,0)", "#fff")).toBeNull();
    });
});

describe("qrWarnings", () => {
    const base = { qrData: "https://yappydraw.com", qrErrorCorrection: "M" as const, strokeColor: "#000000", backgroundColor: "#ffffff" };

    it("is quiet for a normal code", () => {
        expect(qrWarnings(base)).toEqual([]);
    });

    it("warns about empty and too-long data", () => {
        expect(qrWarnings({ ...base, qrData: "" })[0]).toMatch(/no data/i);
        expect(qrWarnings({ ...base, qrData: "x".repeat(2000), qrErrorCorrection: "H" })[0]).toMatch(/too long/i);
    });

    it("warns when the colours are too close to scan", () => {
        expect(qrWarnings({ ...base, strokeColor: "#bbbbbb" })[0]).toMatch(/contrast/i);
    });

    it("warns when the code is lighter than its background", () => {
        expect(qrWarnings({ ...base, strokeColor: "#ffffff", backgroundColor: "#000000" })[0]).toMatch(/lighter/i);
    });

    it("does not judge contrast against a transparent background", () => {
        expect(qrWarnings({ ...base, backgroundColor: "transparent" })).toEqual([]);
    });
});
