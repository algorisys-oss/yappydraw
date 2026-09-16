import { describe, it, expect } from "bun:test";
import { scribbleStrokes } from "./scribble";

/**
 * Scribble fill used the element's bounding box for every row, so a star or a heart got a
 * zig-zag across the whole rectangle around it (Anshika, Sep 2026 screenshot). Rows must be
 * clipped to the outline itself.
 */
const inside = (p: { x: number; y: number }, ring: [number, number][]) => {
    let c = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i], [xj, yj] = ring[j];
        if ((yi > p.y) !== (yj > p.y) && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
};

// A triangle: apex (100,0), base (0,100)-(200,100). Its box is 200 wide at every height.
const tri: [number, number][] = [[100, 0], [200, 100], [0, 100], [100, 0]];
// An L: a concave shape whose top row is half the box width.
const L: [number, number][] = [[0, 0], [50, 0], [50, 50], [100, 50], [100, 100], [0, 100], [0, 0]];

const segments = (strokes: { x: number; y: number }[][]) =>
    strokes.flatMap(s => s.slice(1).map((b, i) => ({ a: s[i], b })));

describe("scribbleStrokes stays inside the outline", () => {
    it("every horizontal pass of a triangle lies inside the triangle", () => {
        const strokes = scribbleStrokes([[tri]], 10, 0);
        expect(strokes.length).toBeGreaterThan(0);
        for (const { a, b } of segments(strokes)) {
            if (Math.abs(a.y - b.y) > 1e-6) continue; // the short hop between rows
            expect(inside({ x: (a.x + b.x) / 2, y: a.y }, tri)).toBe(true);
        }
    });

    it("near the apex a pass is narrow, not the full box width", () => {
        const strokes = scribbleStrokes([[tri]], 10, 0);
        const passes = segments(strokes).filter(s => Math.abs(s.a.y - s.b.y) < 1e-6);
        const top = passes.reduce((m, s) => (s.a.y < m.a.y ? s : m));
        expect(Math.abs(top.b.x - top.a.x)).toBeLessThan(100);
    });

    it("a concave L is not filled across its notch", () => {
        const strokes = scribbleStrokes([[L]], 8, 0);
        for (const { a, b } of segments(strokes)) {
            if (Math.abs(a.y - b.y) > 1e-6) continue;
            expect(inside({ x: (a.x + b.x) / 2, y: a.y }, L)).toBe(true);
        }
    });

    it("an angled scribble still stays inside", () => {
        const strokes = scribbleStrokes([[tri]], 10, Math.PI / 4);
        expect(strokes.length).toBeGreaterThan(0);
        for (const s of strokes) for (const p of s) {
            expect(p.x).toBeGreaterThanOrEqual(-1e-6); expect(p.x).toBeLessThanOrEqual(200 + 1e-6);
            expect(p.y).toBeGreaterThanOrEqual(-1e-6); expect(p.y).toBeLessThanOrEqual(100 + 1e-6);
        }
    });
});
