import { describe, it, expect, beforeEach } from "bun:test";
import { encode } from "uqr";
import {
    buildQrMatrix, qrRuns, qrLayout, qrWarnings, contrastRatio, clearQrCache,
    QR_DEFAULTS, QR_LOGO_BUDGET, isFinderModule, qrAlignmentCentres, qrLogoBox, qrLogoCoverage,
    traceQrModules, traceQrAlignment, traceQrFinders, type QrPathSink,
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

/** Records path calls so tracer output can be counted without a canvas. */
function recorder() {
    const calls: { op: string; args: number[] }[] = [];
    const rec = (op: string) => (...args: any[]) => { calls.push({ op, args }); };
    const sink: QrPathSink = {
        moveTo: rec("moveTo"), lineTo: rec("lineTo"), bezierCurveTo: rec("bezierCurveTo"),
        arc: rec("arc"), rect: rec("rect"), closePath: rec("closePath"),
    };
    return { sink, calls, count: (op: string) => calls.filter(c => c.op === op).length };
}

function matrix(data: string, ecc: "L" | "M" | "Q" | "H" = "M") {
    const m = buildQrMatrix(data, ecc);
    if ("error" in m) throw new Error(m.error);
    return m;
}

describe("isFinderModule", () => {
    it("marks exactly the three 7x7 corner eyes", () => {
        let n = 0;
        for (let y = 0; y < 25; y++) for (let x = 0; x < 25; x++) if (isFinderModule(x, y, 25)) n++;
        expect(n).toBe(3 * 49);
        expect(isFinderModule(6, 6, 25)).toBe(true);
        expect(isFinderModule(7, 0, 25)).toBe(false);
        expect(isFinderModule(18, 0, 25)).toBe(true);
        expect(isFinderModule(18, 18, 25)).toBe(false); // no eye bottom-right
    });
});

describe("qrAlignmentCentres", () => {
    it("has none in version 1 and one in version 2", () => {
        expect(qrAlignmentCentres(21)).toEqual([]);
        expect(qrAlignmentCentres(25)).toEqual([[18, 18]]);
    });

    it("lands on a real alignment pattern in every version uqr produces", () => {
        // Numeric data reaches version 40 well within uqr's limits.
        for (let len = 1; len <= 7000; len += 97) {
            let qr;
            try { qr = encode("7".repeat(len), { ecc: "L", border: 0 }); } catch { break; }
            for (const [cx, cy] of qrAlignmentCentres(qr.size)) {
                for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
                    expect(qr.data[cy + dy][cx + dx]).toBe(Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
                }
            }
        }
    });
});

describe("qrLogoBox / qrLogoCoverage", () => {
    it("centres the cleared square with a one-module margin", () => {
        const box = qrLogoBox(45, 0.2)!;
        expect(box.side).toBeCloseTo(9);
        expect(box.from + box.to).toBe(44); // symmetric about the centre module
        expect(box.to - box.from + 1).toBeGreaterThanOrEqual(Math.ceil(box.side) + 2);
    });

    it("clamps the size and never clears into a finder zone", () => {
        for (let size = 21; size <= 177; size += 4) {
            const box = qrLogoBox(size, 5)!;
            expect(box.from).toBeGreaterThanOrEqual(8);
            expect(box.to).toBeLessThanOrEqual(size - 9);
            expect(box.side).toBeLessThanOrEqual(0.35 * size + 1e-9);
        }
        expect(qrLogoBox(25, 0)).toBeNull();
    });

    it("grows with the logo size", () => {
        expect(qrLogoCoverage(57, 0.3)).toBeGreaterThan(qrLogoCoverage(57, 0.15));
        expect(qrLogoCoverage(57, 0)).toBe(0);
    });
});

describe("traceQrModules", () => {
    const m = matrix("https://yappydraw.com/r/abc123", "Q");
    const darkData = () => {
        let n = 0;
        m.modules.forEach((row, y) => row.forEach((on, x) => { if (on && !isFinderModule(x, y, m.size)) n++; }));
        return n;
    };

    it("square: merged runs covering every dark non-eye module", () => {
        const r = recorder();
        const runs = traceQrModules(r.sink, m.modules, 0, 0, 1, "square");
        expect(r.count("rect")).toBe(runs);
        const covered = r.calls.reduce((sum, c) => sum + c.args[2], 0);
        expect(covered).toBe(darkData());
    });

    it("dots: one circle per module, each starting with moveTo so arcs never join", () => {
        const r = recorder();
        const n = traceQrModules(r.sink, m.modules, 0, 0, 10, "dots");
        const alignmentDark = 17; // 5x5 ring + centre: 16 + 1
        expect(n).toBe(darkData() - alignmentDark * qrAlignmentCentres(m.size).length);
        r.calls.forEach((c, i) => { if (c.op === "arc") expect(r.calls[i - 1].op).toBe("moveTo"); });
    });

    it("rounded: rounds only corners with no dark neighbour on either side", () => {
        const r = recorder();
        // Version-1-sized grid with modules placed clear of the eyes.
        const grid = (on: [number, number][]) => {
            const g = Array.from({ length: 21 }, () => Array(21).fill(false));
            on.forEach(([x, y]) => { g[y][x] = true; });
            return g;
        };
        // A lone module gets four curves; a 2-module run gets two curves per module.
        expect(traceQrModules(r.sink, grid([[10, 10]]), 0, 0, 10, "rounded")).toBe(1);
        expect(r.count("bezierCurveTo")).toBe(4);
        const pair = recorder();
        traceQrModules(pair.sink, grid([[10, 10], [11, 10]]), 0, 0, 10, "rounded");
        expect(pair.count("bezierCurveTo")).toBe(4);
        // An L-shape: the inside corner stays square on all three modules.
        const ell = recorder();
        traceQrModules(ell.sink, grid([[10, 10], [11, 10], [10, 11]]), 0, 0, 10, "rounded");
        expect(ell.count("bezierCurveTo")).toBe(2 + 2 + 1);
    });

    it("leaves the logo square empty", () => {
        const logo = qrLogoBox(m.size, 0.3)!;
        const r = recorder();
        const withLogo = traceQrModules(r.sink, m.modules, 0, 0, 1, "dots", logo);
        const without = traceQrModules(recorder().sink, m.modules, 0, 0, 1, "dots");
        expect(withLogo).toBeLessThan(without);
        for (const c of r.calls.filter(c => c.op === "arc")) {
            const [cx, cy] = [Math.floor(c.args[0]), Math.floor(c.args[1])];
            const inside = cx >= logo.from && cx <= logo.to && cy >= logo.from && cy <= logo.to;
            expect(inside).toBe(false);
        }
    });
});

describe("traceQrAlignment / traceQrFinders", () => {
    it("draws alignment rings only for styled codes, skipping one under the logo", () => {
        const size = 57; // version 10: 6 alignment patterns, one in the centre
        expect(traceQrAlignment(recorder().sink, size, 0, 0, 1, "square")).toBe(0);
        expect(traceQrAlignment(recorder().sink, size, 0, 0, 1, "dots")).toBe(6);
        expect(traceQrAlignment(recorder().sink, size, 0, 0, 1, "rounded", qrLogoBox(size, 0.2))).toBe(5);
    });

    it("draws ring, gap and pupil for each of the three eyes in every style", () => {
        const sq = recorder();
        traceQrFinders(sq.sink, 25, 0, 0, 1, "square");
        expect(sq.count("rect")).toBe(9);
        const circ = recorder();
        traceQrFinders(circ.sink, 25, 0, 0, 1, "circle");
        expect(circ.count("arc")).toBe(9);
        const rnd = recorder();
        traceQrFinders(rnd.sink, 25, 0, 0, 1, "rounded");
        expect(rnd.count("closePath")).toBe(9);
    });
});

describe("qrWarnings — styling and logo", () => {
    const base = { qrData: "https://yappydraw.com/r/abc123", strokeColor: "#000000", backgroundColor: "#ffffff" };

    it("checks the corner colour's contrast too", () => {
        expect(qrWarnings({ ...base, qrFinderColor: "#eeeeee" })[0]).toMatch(/contrast/i);
        expect(qrWarnings({ ...base, qrFinderColor: "#1e3a8a" })).toEqual([]);
    });

    it("warns when the logo covers more than the level's budget, and not otherwise", () => {
        const small = { ...base, qrLogo: "data:image/png;base64,x", qrLogoSize: 0.1 };
        expect(qrWarnings({ ...small, qrErrorCorrection: "H" })).toEqual([]);
        expect(qrWarnings({ ...small, qrLogoSize: 0.35, qrErrorCorrection: "L" }).join()).toMatch(/logo/i);
        expect(qrWarnings({ ...small, qrLogoSize: 0.35, qrErrorCorrection: "H" }).join()).toMatch(/smaller/i);
    });

    it("keeps each level's budget below the next level's", () => {
        expect(QR_LOGO_BUDGET.L).toBeLessThan(QR_LOGO_BUDGET.M);
        expect(QR_LOGO_BUDGET.M).toBeLessThan(QR_LOGO_BUDGET.Q);
        expect(QR_LOGO_BUDGET.Q).toBeLessThan(QR_LOGO_BUDGET.H);
    });
});
