import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import polygonClipping from "polygon-clipping";
import { clipMultiPolys, runBooleanOpDetailed } from "./path-boolean";

/**
 * When the clipping engine throws, Pathfinder must not pass the crash off as a legitimately
 * empty result ("those shapes overlap exactly…").
 *
 * The fixture was found by fuzzing polygon-clipping (2026-10-07): three 63-point rings whose
 * edges nearly coincide (offsets around 1e-10, the float noise a duplicated and transformed
 * shape carries) blow the engine's stack on `xor`. Retrying with coordinates snapped to a
 * 1e-6 grid fixed all 3,305 such inputs the fuzzer produced, so the retry is the first line
 * of defence and an honest failure the second.
 */
const fixture = JSON.parse(readFileSync(join(import.meta.dir, "path-boolean-failure.fixture.json"), "utf8")) as { op: 'xor'; ins: any[] };
const inputs = fixture.ins.map(ring => [ring]);

const rect = (x: number, y: number, width: number, height: number) =>
    ({ id: `r${x}_${y}`, type: 'rectangle', x, y, width, height, angle: 0 }) as any;

describe("clipMultiPolys retries a crashing clip on a snapped grid", () => {
    it("the fixture really does crash polygon-clipping unsnapped", () => {
        expect(() => (polygonClipping as any).xor(...inputs)).toThrow();
    });

    it("succeeds on the fixture via the snapped retry", () => {
        const r = clipMultiPolys('exclude', inputs);
        expect(r.failed).toBe(false);
        expect(r.result.length).toBeGreaterThan(0);
    });

    it("reports failure (not an empty result) when the retry crashes too", () => {
        const alwaysThrows = () => { throw new RangeError('Maximum call stack size exceeded'); };
        const r = clipMultiPolys('union', inputs, alwaysThrows);
        expect(r.failed).toBe(true);
        expect(r.result).toEqual([]);
    });

    it("does not touch inputs that clip cleanly (no snapping on the normal path)", () => {
        const a = [[[0, 0], [10.123456789, 0], [10.123456789, 10], [0, 10], [0, 0]]];
        const b = [[[5, 5], [15, 5], [15, 15], [5, 15], [5, 5]]];
        const r = clipMultiPolys('union', [a as any, b as any]);
        expect(r.failed).toBe(false);
        const xs = r.result.flat(2).map(p => p[0]);
        expect(xs).toContain(10.123456789);
    });
});

describe("runBooleanOpDetailed separates 'empty' from 'failed'", () => {
    it("disjoint intersect is empty, not failed", () => {
        const r = runBooleanOpDetailed([rect(0, 0, 10, 10), rect(100, 100, 10, 10)], 'intersect');
        expect(r).toEqual({ polys: [], failed: false });
    });

    it("an overlapping union succeeds", () => {
        const r = runBooleanOpDetailed([rect(0, 0, 10, 10), rect(5, 5, 10, 10)], 'union');
        expect(r.failed).toBe(false);
        expect(r.polys.length).toBe(1);
    });
});
