import { describe, it, expect } from "bun:test";
import {
    buildDoodle, resolveDoodleParams, DOODLE_GENERATORS, getDoodleGenerator,
    type DoodleSpec, type DoodleLayer,
} from "./index";
import { smoothThrough, chainSegments } from "./curves";
import type { PathAnchor } from "../../types";

const REGION = { x: 100, y: 50, width: 420, height: 560 };

const spec = (kind: DoodleSpec['kind'], params: DoodleSpec['params'] = {}, seed = 7): DoodleSpec =>
    ({ kind, seed, params, ...REGION });

const anchorsOf = (layers: DoodleLayer[]) => layers.flatMap(l => l.subpaths.flatMap(sp => sp.anchors));
const layer = (layers: DoodleLayer[], role: string) => layers.find(l => l.role === role);

/** Is (x,y) on the edge of the box (within `tol`)? */
const onEdge = (p: { x: number; y: number }, b: { x: number; y: number; w: number; h: number }, tol = 0.5) =>
    Math.abs(p.x - b.x) < tol || Math.abs(p.x - (b.x + b.w)) < tol ||
    Math.abs(p.y - b.y) < tol || Math.abs(p.y - (b.y + b.h)) < tol;

describe("registry", () => {
    it("every generator builds something with its defaults, deterministically", () => {
        for (const g of DOODLE_GENERATORS) {
            const a = buildDoodle(spec(g.id));
            const b = buildDoodle(spec(g.id));
            expect(anchorsOf(a).length).toBeGreaterThan(10);
            expect(JSON.stringify(a)).toBe(JSON.stringify(b));
        }
    });

    it("a different seed gives a different doodle", () => {
        for (const g of DOODLE_GENERATORS) {
            const a = JSON.stringify(buildDoodle(spec(g.id, {}, 1)));
            const b = JSON.stringify(buildDoodle(spec(g.id, {}, 2)));
            expect(a).not.toBe(b);
        }
    });

    it("every anchor stays inside the region", () => {
        for (const g of DOODLE_GENERATORS) {
            for (const p of anchorsOf(buildDoodle(spec(g.id)))) {
                expect(p.x).toBeGreaterThanOrEqual(REGION.x - 1e-6);
                expect(p.x).toBeLessThanOrEqual(REGION.x + REGION.width + 1e-6);
                expect(p.y).toBeGreaterThanOrEqual(REGION.y - 1e-6);
                expect(p.y).toBeLessThanOrEqual(REGION.y + REGION.height + 1e-6);
            }
        }
    });

    it("no NaN anywhere — the dialog drags sliders through odd states", () => {
        for (const g of DOODLE_GENERATORS) {
            const json = JSON.stringify(buildDoodle({ ...spec(g.id), width: 3, height: 3 }));
            expect(json.includes("null")).toBe(false);   // NaN serialises as null
        }
    });

    it("an empty or inverted region builds nothing instead of throwing", () => {
        for (const g of DOODLE_GENERATORS) {
            expect(buildDoodle({ ...spec(g.id), width: 0 })).toEqual([]);
            expect(buildDoodle({ ...spec(g.id), height: -20 })).toEqual([]);
        }
    });

    it("unknown generator builds nothing", () => {
        expect(buildDoodle({ ...spec('truchet'), kind: 'nope' as any })).toEqual([]);
        expect(getDoodleGenerator('nope')).toBeUndefined();
    });
});

describe("resolveDoodleParams", () => {
    const g = getDoodleGenerator('truchet')!;
    it("fills defaults, clamps ranges, rejects bad choices and junk", () => {
        const r = resolveDoodleParams(g, { tileSize: 99999, lines: NaN, style: 'bogus', shade: 'yes' as any, extra: 1 });
        const tile = g.params.find(p => p.key === 'tileSize')!;
        expect(r.tileSize).toBe((tile as any).max);
        expect(r.lines).toBe((g.params.find(p => p.key === 'lines') as any).default);
        expect(r.style).toBe((g.params.find(p => p.key === 'style') as any).default);
        expect(typeof r.shade).toBe('boolean');
        expect('extra' in r).toBe(false);
    });
    it("snaps integer-step ranges", () => {
        expect(resolveDoodleParams(g, { lines: 2.6 }).lines).toBe(3);
    });
});

describe("truchet", () => {
    /** Tiled area: whole tiles, centred in the region. */
    const tiled = (size: number) => {
        const cols = Math.floor(REGION.width / size), rows = Math.floor(REGION.height / size);
        return {
            x: REGION.x + (REGION.width - cols * size) / 2, y: REGION.y + (REGION.height - rows * size) / 2,
            w: cols * size, h: rows * size, n: cols * rows,
        };
    };

    for (const style of ['arcs', 'diagonal', 'mixed']) {
        it(`${style}: lines join into continuous curves that only end on the tiled edge`, () => {
            // The property that makes a Truchet read as one woven pattern rather than a
            // grid of stamps: every line leaving a tile is picked up by its neighbour.
            // An interior loose end means the edge crossings don't match up.
            const layers = buildDoodle(spec('truchet', { tileSize: 40, lines: 3, style }));
            const ink = layer(layers, 'ink')!;
            const box = tiled(40);
            for (const sp of ink.subpaths) {
                if (sp.closed) continue;
                expect(onEdge(sp.anchors[0], box)).toBe(true);
                expect(onEdge(sp.anchors[sp.anchors.length - 1], box)).toBe(true);
            }
            // Chained, not one subpath per arc.
            expect(ink.subpaths.length).toBeLessThan(box.n * 2 * 3 / 2);
        });
    }

    it("arcs are true curves (Bézier handles), diagonals are straight", () => {
        const arcs = layer(buildDoodle(spec('truchet', { style: 'arcs' })), 'ink')!;
        expect(arcs.subpaths[0].anchors.some(a => a.outX !== undefined)).toBe(true);
        const diag = layer(buildDoodle(spec('truchet', { style: 'diagonal' })), 'ink')!;
        expect(diag.subpaths.every(sp => sp.anchors.every(a => a.outX === undefined && a.inX === undefined))).toBe(true);
    });

    it("shade corners adds two fill layers; off drops them", () => {
        const on = buildDoodle(spec('truchet', { shade: true }));
        expect(layer(on, 'fill1')?.subpaths.length).toBeGreaterThan(0);
        expect(layer(on, 'fill2')?.subpaths.length).toBeGreaterThan(0);
        expect(layer(on, 'fill1')!.subpaths.every(sp => sp.closed)).toBe(true);
        const off = buildDoodle(spec('truchet', { shade: false }));
        expect(layer(off, 'fill1')).toBeUndefined();
        expect(layer(off, 'fill2')).toBeUndefined();
    });

    it("fills sit behind ink (layer order is back-to-front)", () => {
        const roles = buildDoodle(spec('truchet', { shade: true })).map(l => l.role);
        expect(roles.indexOf('fill1')).toBeLessThan(roles.indexOf('ink'));
    });
});

describe("flowField", () => {
    it("streamlines keep their distance from each other", () => {
        // Evenly spaced streamlines are the whole look; lines that touch read as a smear.
        const spacing = 18;
        const ink = layer(buildDoodle(spec('flowField', { spacing })), 'ink')!;
        expect(ink.subpaths.length).toBeGreaterThan(10);
        const pts = ink.subpaths.map((sp, i) => sp.anchors.map(a => ({ x: a.x, y: a.y, i })));
        const flat = pts.flat();
        let closest = Infinity;
        for (let a = 0; a < flat.length; a++) {
            for (let b = a + 1; b < flat.length; b++) {
                if (flat[a].i === flat[b].i) continue;
                closest = Math.min(closest, Math.hypot(flat[a].x - flat[b].x, flat[a].y - flat[b].y));
            }
        }
        expect(closest).toBeGreaterThan(spacing * 0.35);
    });

    it("covers the page evenly — no bald patches", () => {
        // The widest gap anywhere should be about one spacing. Seeding from a grid alone
        // measured ~1.4 spacings (holes opened wherever a seed landed near a line); seeding
        // each new line one spacing beside an existing one (Jobard–Lefer) keeps it ~1.0.
        const spacing = 16;
        for (const seed of [1, 5, 7]) {
            const pts = layer(buildDoodle(spec('flowField', { spacing }, seed)), 'ink')!.subpaths.flatMap(sp => sp.anchors);
            let worst = 0;
            for (let y = REGION.y + 10; y < REGION.y + REGION.height - 10; y += 8) {
                for (let x = REGION.x + 10; x < REGION.x + REGION.width - 10; x += 8) {
                    let best = Infinity;
                    for (const p of pts) best = Math.min(best, Math.hypot(p.x - x, p.y - y));
                    worst = Math.max(worst, best);
                }
            }
            expect(worst).toBeLessThan(spacing * 1.15);
        }
    });

    it("longer lines mean fewer, longer streamlines", () => {
        const short = layer(buildDoodle(spec('flowField', { length: 60 })), 'ink')!.subpaths.length;
        const long = layer(buildDoodle(spec('flowField', { length: 500 })), 'ink')!.subpaths.length;
        expect(long).toBeLessThan(short);
    });

    it("dots option adds a fill layer of closed circles", () => {
        const l = layer(buildDoodle(spec('flowField', { dots: true })), 'fill1')!;
        expect(l.subpaths.length).toBeGreaterThan(0);
        expect(l.subpaths.every(sp => sp.closed)).toBe(true);
    });
});

describe("topography", () => {
    it("contours are either closed loops or end on the region edge", () => {
        const layers = buildDoodle(spec('topography', { levels: 12, indexEvery: 0 }));
        const box = { x: REGION.x, y: REGION.y, w: REGION.width, h: REGION.height };
        const ink = layer(layers, 'ink')!;
        expect(ink.subpaths.length).toBeGreaterThan(3);
        for (const sp of ink.subpaths) {
            if (sp.closed) continue;
            expect(onEdge(sp.anchors[0], box, 1)).toBe(true);
            expect(onEdge(sp.anchors[sp.anchors.length - 1], box, 1)).toBe(true);
        }
    });

    it("index lines go to a bold layer; off puts everything in ink", () => {
        const on = buildDoodle(spec('topography', { levels: 12, indexEvery: 4 }));
        expect(layer(on, 'inkBold')?.subpaths.length).toBeGreaterThan(0);
        const off = buildDoodle(spec('topography', { levels: 12, indexEvery: 0 }));
        expect(layer(off, 'inkBold')).toBeUndefined();
    });

    it("more levels, more contours", () => {
        const few = layer(buildDoodle(spec('topography', { levels: 5, indexEvery: 0 })), 'ink')!.subpaths.length;
        const many = layer(buildDoodle(spec('topography', { levels: 25, indexEvery: 0 })), 'ink')!.subpaths.length;
        expect(many).toBeGreaterThan(few);
    });
});

describe("curves", () => {
    it("smoothThrough passes through every input point", () => {
        const pts = [{ x: 0, y: 0 }, { x: 10, y: 5 }, { x: 20, y: -3 }, { x: 30, y: 8 }];
        const a = smoothThrough(pts, false);
        expect(a.map(p => [p.x, p.y])).toEqual(pts.map(p => [p.x, p.y]));
        // Interior anchors have mirrored handles (G1-continuous).
        expect(a[1].inX).toBeCloseTo(-(a[1].outX as number));
        expect(a[1].inY).toBeCloseTo(-(a[1].outY as number));
    });

    it("chainSegments joins end-to-end, reversing where needed, and closes loops", () => {
        const s = (x0: number, y0: number, x1: number, y1: number): PathAnchor[] =>
            [{ x: x0, y: y0, kind: 'corner' }, { x: x1, y: y1, kind: 'corner' }];
        // A square drawn as four segments, one of them backwards.
        const out = chainSegments([s(0, 0, 10, 0), s(10, 10, 10, 0), s(10, 10, 0, 10), s(0, 10, 0, 0)]);
        expect(out).toHaveLength(1);
        expect(out[0].closed).toBe(true);
        expect(out[0].anchors).toHaveLength(4);
        // An open chain keeps its ends.
        const open = chainSegments([s(0, 0, 5, 0), s(5, 0, 5, 5)]);
        expect(open).toHaveLength(1);
        expect(open[0].closed).toBe(false);
        expect(open[0].anchors).toHaveLength(3);
    });

    it("chainSegments keeps both handles at a join and flips them on reversal", () => {
        // Segment B is stored backwards; after reversal its handles must swap sides.
        const A: PathAnchor[] = [{ x: 0, y: 0, kind: 'smooth', outX: 3, outY: 0 }, { x: 10, y: 0, kind: 'smooth', inX: -3, inY: 0 }];
        const B: PathAnchor[] = [{ x: 20, y: 0, kind: 'smooth', outX: -3, outY: 1 }, { x: 10, y: 0, kind: 'smooth', inX: 3, inY: 1 }];
        const [c] = chainSegments([A, B]);
        const j = c.anchors[1];
        expect([j.x, j.inX, j.outX, j.outY]).toEqual([10, -3, 3, 1]);
        expect(c.anchors[2].inX).toBe(-3);
        expect(c.anchors[2].inY).toBe(1);
    });
});
