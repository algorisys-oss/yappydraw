import { describe, it, expect } from "bun:test";
import { recognizeStrokeShape, type Pt } from "./shape-recognition";

/**
 * Synthetic strokes standing in for real input.
 *
 * The interesting axis is JITTER: a stylus lays down a smooth, densely sampled
 * path, while a mouse produces a coarser one with hand-tremor and the small
 * overshoot/undershoot you get from dragging a puck. `jitter` is expressed as a
 * fraction of the shape's diagonal so the tests read as "how sloppy was the
 * user", independent of size.
 *
 * Deterministic PRNG — a seeded LCG, not Math.random — so a failure is always
 * reproducible and the suite can't flake.
 */
function rng(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0x100000000;
    };
}

/** Walk a polyline through `corners`, sampling `per` points per edge. */
function tracePolyline(corners: Pt[], per: number, jitter: number, seed: number, close: boolean): Pt[] {
    const rand = rng(seed);
    const pts: Pt[] = [];
    const loop = close ? corners.length : corners.length - 1;
    for (let i = 0; i < loop; i++) {
        const a = corners[i];
        const b = corners[(i + 1) % corners.length];
        for (let t = 0; t < per; t++) {
            const f = t / per;
            pts.push({
                x: a.x + (b.x - a.x) * f + (rand() - 0.5) * 2 * jitter,
                y: a.y + (b.y - a.y) * f + (rand() - 0.5) * 2 * jitter,
            });
        }
    }
    if (!close) pts.push({ ...corners[corners.length - 1] });
    else pts.push({ ...corners[0] });
    return pts;
}

function traceEllipse(cx: number, cy: number, rx: number, ry: number, n: number, jitter: number, seed: number): Pt[] {
    const rand = rng(seed);
    const pts: Pt[] = [];
    for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        pts.push({
            x: cx + Math.cos(a) * rx + (rand() - 0.5) * 2 * jitter,
            y: cy + Math.sin(a) * ry + (rand() - 0.5) * 2 * jitter,
        });
    }
    return pts;
}

const RECT: Pt[] = [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 120 }, { x: 0, y: 120 }];
const TRI: Pt[] = [{ x: 100, y: 0 }, { x: 200, y: 160 }, { x: 0, y: 160 }];
const DIAMOND: Pt[] = [{ x: 100, y: 0 }, { x: 200, y: 80 }, { x: 100, y: 160 }, { x: 0, y: 80 }];
// 200x120 rect → diagonal ~233. 3% jitter ≈ 7px of wobble, a realistic mouse.
const MOUSE_JITTER = 7;

describe("recognizeStrokeShape — clean strokes (stylus-like)", () => {
    it("recognizes a rectangle", () => {
        const s = recognizeStrokeShape(tracePolyline(RECT, 12, 0.5, 1, true));
        expect(s?.kind).toBe("rect");
    });

    it("recognizes a triangle", () => {
        const s = recognizeStrokeShape(tracePolyline(TRI, 12, 0.5, 2, true));
        expect(s?.kind).toBe("triangle");
    });

    it("recognizes a diamond", () => {
        const s = recognizeStrokeShape(tracePolyline(DIAMOND, 12, 0.5, 3, true));
        expect(s?.kind).toBe("diamond");
    });

    it("recognizes an ellipse", () => {
        const s = recognizeStrokeShape(traceEllipse(100, 60, 100, 60, 64, 0.5, 4));
        expect(s?.kind).toBe("ellipse");
    });

    it("recognizes a straight line", () => {
        const s = recognizeStrokeShape(tracePolyline([{ x: 0, y: 0 }, { x: 240, y: 40 }], 30, 0.5, 5, false));
        expect(s?.kind).toBe("line");
    });
});

describe("recognizeStrokeShape — sloppy strokes (mouse-like)", () => {
    // Each seed is a different "attempt" by the user. Smart shapes felt
    // unreliable because some attempts landed and some didn't, so the bar is
    // that EVERY seed recognizes — not that one lucky one does.
    const seeds = [11, 22, 33, 44, 55, 66, 77, 88];

    it("recognizes a wobbly rectangle on every attempt", () => {
        for (const seed of seeds) {
            const s = recognizeStrokeShape(tracePolyline(RECT, 10, MOUSE_JITTER, seed, true));
            expect([seed, s?.kind]).toEqual([seed, "rect"]);
        }
    });

    it("recognizes a wobbly triangle on every attempt", () => {
        for (const seed of seeds) {
            const s = recognizeStrokeShape(tracePolyline(TRI, 10, MOUSE_JITTER, seed, true));
            expect([seed, s?.kind]).toEqual([seed, "triangle"]);
        }
    });

    it("recognizes a wobbly ellipse on every attempt", () => {
        for (const seed of seeds) {
            const s = recognizeStrokeShape(traceEllipse(100, 60, 100, 60, 40, MOUSE_JITTER, seed));
            expect([seed, s?.kind]).toEqual([seed, "ellipse"]);
        }
    });

    it("recognizes a wobbly line on every attempt", () => {
        for (const seed of seeds) {
            const s = recognizeStrokeShape(
                tracePolyline([{ x: 0, y: 0 }, { x: 240, y: 40 }], 24, MOUSE_JITTER * 0.6, seed, false));
            expect([seed, s?.kind]).toEqual([seed, "line"]);
        }
    });

    it("recognizes a rectangle left open at the corner (mouse released early)", () => {
        // Stops 18px short of where it started — very common with a mouse.
        for (const seed of seeds) {
            const pts = tracePolyline(RECT, 10, MOUSE_JITTER, seed, true).slice(0, -3);
            const s = recognizeStrokeShape(pts);
            expect([seed, s?.kind]).toEqual([seed, "rect"]);
        }
    });

    it("recognizes a rectangle drawn past its own start (overshoot)", () => {
        for (const seed of seeds) {
            const pts = tracePolyline(RECT, 10, MOUSE_JITTER, seed, true);
            pts.push({ x: 22, y: 3 }, { x: 34, y: 1 }); // ran along the top edge again
            const s = recognizeStrokeShape(pts);
            expect([seed, s?.kind]).toEqual([seed, "rect"]);
        }
    });
});

describe("recognizeStrokeShape — reliability across attempts", () => {
    // The original complaint wasn't "it never works", it was "it works
    // sometimes" — so the property worth testing is the RATE over many
    // independent attempts, not a single happy path. 100 seeds at realistic
    // mouse jitter; a regression that reintroduces unstable corner counting
    // shows up here as a rate collapse even if the spot-check cases still pass.
    const SEEDS = 100;

    function rate(make: (seed: number) => Pt[], want: string): number {
        let hit = 0;
        for (let s = 1; s <= SEEDS; s++) if (recognizeStrokeShape(make(s))?.kind === want) hit++;
        return hit / SEEDS;
    }

    it("recognizes a mouse-drawn rectangle at least 95% of the time", () => {
        expect(rate(s => tracePolyline(RECT, 10, MOUSE_JITTER, s, true), "rect")).toBeGreaterThanOrEqual(0.95);
    });

    it("recognizes a mouse-drawn square as a rectangle at least 95% of the time", () => {
        const SQUARE: Pt[] = [{ x: 0, y: 0 }, { x: 150, y: 0 }, { x: 150, y: 150 }, { x: 0, y: 150 }];
        expect(rate(s => tracePolyline(SQUARE, 10, MOUSE_JITTER, s, true), "rect")).toBeGreaterThanOrEqual(0.95);
    });

    it("recognizes a mouse-drawn triangle at least 90% of the time", () => {
        // Lowest of the set: a quad fits a wobbly triangle nearly as well, so
        // this leans on the turn-angle test rather than on fit error.
        expect(rate(s => tracePolyline(TRI, 10, MOUSE_JITTER, s, true), "triangle")).toBeGreaterThanOrEqual(0.90);
    });

    it("recognizes a mouse-drawn diamond at least 95% of the time", () => {
        expect(rate(s => tracePolyline(DIAMOND, 10, MOUSE_JITTER, s, true), "diamond")).toBeGreaterThanOrEqual(0.95);
    });

    it("recognizes a mouse-drawn circle as an ellipse at least 95% of the time", () => {
        expect(rate(s => traceEllipse(100, 100, 90, 90, 40, MOUSE_JITTER, s), "ellipse")).toBeGreaterThanOrEqual(0.95);
    });
});

describe("recognizeStrokeShape — stays out of the way", () => {
    it("keeps a scribble as freehand ink", () => {
        const rand = rng(99);
        const pts: Pt[] = [];
        for (let i = 0; i < 120; i++) pts.push({ x: rand() * 200, y: rand() * 200 });
        expect(recognizeStrokeShape(pts)).toBeNull();
    });

    it("keeps an S-curve as freehand ink", () => {
        const pts: Pt[] = [];
        for (let i = 0; i <= 80; i++) {
            const t = i / 80;
            pts.push({ x: t * 240, y: Math.sin(t * Math.PI * 2) * 60 });
        }
        expect(recognizeStrokeShape(pts)).toBeNull();
    });

    it("keeps a spiral as freehand ink", () => {
        const pts: Pt[] = [];
        for (let i = 0; i <= 200; i++) {
            const a = (i / 200) * Math.PI * 6;
            const r = 10 + a * 10;
            pts.push({ x: 150 + Math.cos(a) * r, y: 150 + Math.sin(a) * r });
        }
        expect(recognizeStrokeShape(pts)).toBeNull();
    });

    it("keeps a tiny stroke as freehand ink", () => {
        const pts = tracePolyline([{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 8 }, { x: 0, y: 8 }], 4, 0, 7, true);
        expect(recognizeStrokeShape(pts)).toBeNull();
    });

    it("keeps a stroke with too few points as freehand ink", () => {
        expect(recognizeStrokeShape([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }])).toBeNull();
    });

    it("keeps a wide arc as freehand ink (not a line)", () => {
        const pts: Pt[] = [];
        for (let i = 0; i <= 60; i++) {
            const t = i / 60;
            pts.push({ x: t * 240, y: Math.sin(t * Math.PI) * 70 });
        }
        expect(recognizeStrokeShape(pts)?.kind).not.toBe("line");
    });
});
