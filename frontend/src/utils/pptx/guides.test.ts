import { describe, it, expect } from "bun:test";
import { evalFormula, evalGuides, geometryPathsPx, connectionSitesPx, textRectPx, loadPresets, type GeomDef } from "./guides";
import { cmdsBounds } from "./custgeom";

const lookup = (m: Record<string, number>) => (t: string) => m[t] ?? Number(t);

describe("evalFormula", () => {
    it("implements every ECMA operator", () => {
        const L = lookup({ a: 3, b: 4, c: 2 });
        expect(evalFormula('*/ a b c', L)).toBe(6);
        expect(evalFormula('+- a b c', L)).toBe(5);
        expect(evalFormula('+/ a b c', L)).toBe(3.5);
        expect(evalFormula('?: a b c', L)).toBe(4);
        expect(evalFormula('?: -1 b c', L)).toBe(2);
        expect(evalFormula('abs -7', L)).toBe(7);
        expect(evalFormula('at2 1 1', L)).toBeCloseTo(45 * 60000, 3);
        expect(evalFormula('cos 10 5400000', L)).toBeCloseTo(0, 9);
        expect(evalFormula('sin 10 5400000', L)).toBeCloseTo(10, 9);
        expect(evalFormula('mod 3 4 0', L)).toBe(5);
        expect(evalFormula('pin 0 120 100', L)).toBe(100);
        expect(evalFormula('pin 0 -5 100', L)).toBe(0);
        expect(evalFormula('sqrt 16', L)).toBe(4);
        expect(evalFormula('max a b', L)).toBe(4);
        expect(evalFormula('val 16667', L)).toBe(16667);
    });
    it("tolerates double spaces and never returns NaN", () => {
        expect(evalFormula('*/ a  b c', lookup({ a: 2, b: 3, c: 1 }))).toBe(6);
        expect(evalFormula('*/ 1 2 0', lookup({}))).toBe(0);
        expect(evalFormula('bogus 1', lookup({}))).toBe(0);
    });
});

describe("evalGuides", () => {
    it("knows the built-ins and the wdN/hdN/ssdN family", () => {
        const def: GeomDef = { gd: [['q', '*/ wd4 1 1'], ['s', '*/ ssd8 1 1']], paths: [] };
        const g = evalGuides(def, 400, 200);
        expect(g.get('hc')).toBe(200);
        expect(g.get('q')).toBe(100);
        expect(g.get('s')).toBe(25);
    });
    it("lets the shape's own adjust value override the preset default", () => {
        const def: GeomDef = { av: [['adj', 'val 16667']], gd: [['x', '*/ ss adj 100000']], paths: [] };
        expect(evalGuides(def, 1000, 1000).get('x')).toBeCloseTo(166.67, 2);
        expect(evalGuides(def, 1000, 1000, { adj: 'val 50000' }).get('x')).toBe(500);
    });
});

describe("presets", () => {
    it("has the whole ECMA table", async () => {
        const p = await loadPresets();
        expect(Object.keys(p).length).toBe(187);
        for (const k of ['rect', 'roundRect', 'ellipse', 'star5', 'cloud', 'can', 'flowChartDocument', 'rightArrow', 'wedgeRoundRectCallout']) expect(p[k], k).toBeDefined();
    });
    it("evaluates every preset at a few sizes to finite paths inside a sane box", async () => {
        const p = await loadPresets();
        for (const [name, def] of Object.entries(p)) {
            for (const [w, h] of [[200, 100], [50, 300], [1, 1]]) {
                const paths = geometryPathsPx(def, w, h);
                for (const path of paths) for (const c of path.cmds) {
                    for (const v of Object.values(c)) if (typeof v === 'number') expect(Number.isFinite(v), `${name} ${w}x${h}`).toBe(true);
                }
                const b = cmdsBounds(paths.flatMap(q => q.cmds));
                if (b) {
                    // Callouts and arrows can reach outside the box; nothing should be wildly out.
                    expect(b.minX, name).toBeGreaterThan(-w * 3 - 10);
                    expect(b.maxY, name).toBeLessThan(h * 4 + 10);
                }
            }
        }
    });
    it("draws an ellipse that touches its box at the four midpoints", async () => {
        const p = await loadPresets();
        const b = cmdsBounds(geometryPathsPx(p.ellipse, 200, 100)[0].cmds)!;
        expect(b.minX).toBeCloseTo(0, 6); expect(b.maxX).toBeCloseTo(200, 6);
        // Control points of a cubic arc approximation sit on the tangents, i.e. on the box.
        expect(b.minY).toBeCloseTo(0, 6); expect(b.maxY).toBeCloseTo(100, 6);
    });
    it("gives roundRect its corner radius from adj, and rect's sites in top-left-bottom-right order", async () => {
        const p = await loadPresets();
        const [path] = geometryPathsPx(p.roundRect, 200, 100, { adj: 'val 50000' });
        // adj 50000 of the shorter side (100) = a 50px radius: the first point is (0, 50).
        expect(path.cmds[0]).toEqual({ op: 'M', x: 0, y: 50 });
        const sites = connectionSitesPx(p.rect, 200, 100);
        expect(sites).toEqual([{ x: 100, y: 0 }, { x: 0, y: 50 }, { x: 100, y: 100 }, { x: 200, y: 50 }]);
    });
    it("keeps text inside a shape's text rectangle", async () => {
        const p = await loadPresets();
        const r = textRectPx(p.ellipse, 200, 100);
        expect(r.l).toBeGreaterThan(20); expect(r.r).toBeLessThan(180);
        expect(textRectPx(p.rect, 200, 100)).toEqual({ l: 0, t: 0, r: 200, b: 100 });
    });
});
