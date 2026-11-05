import { describe, it, expect } from "bun:test";
import { layoutChartex, quartile, boxStats, histogramBins, buildTree, squarify, chartexSummary, lighten } from "./chartex-layout";

const box = [0, 0, 600, 400] as const;
const rects = (ops: any[]) => ops.filter(o => o.op === 'rect' && o.series !== undefined);

describe("statistics", () => {
    it("quartiles match Excel's QUARTILE.EXC and QUARTILE.INC", () => {
        const v = [1, 2, 3, 4, 5, 6, 7, 8];
        expect(quartile(v, 0.25, false)).toBeCloseTo(2.25, 9);   // QUARTILE.EXC(1..8, 1)
        expect(quartile(v, 0.75, false)).toBeCloseTo(6.75, 9);
        expect(quartile(v, 0.25, true)).toBeCloseTo(2.75, 9);    // QUARTILE.INC(1..8, 1)
        expect(quartile(v, 0.5, true)).toBeCloseTo(4.5, 9);
    });
    it("box statistics: whiskers within 1.5 IQR, the rest outliers, the mean", () => {
        const s = boxStats([1, 2, 3, 4, 5, 6, 7, 8, 100])!;
        expect(s.outliers).toEqual([100]);
        expect(s.hi).toBe(8);
        expect(s.lo).toBe(1);
        expect(s.mean).toBeCloseTo(136 / 9, 9);
        expect(boxStats([])).toBeNull();
    });
    it("histogram bins: a width, a count, or automatic; first bin closed, all values counted", () => {
        const v = [1, 2, 2, 3, 4, 5, 9, 10];
        const bySize = histogramBins(v, { size: 3 });
        expect(bySize.map(b => b.label)).toEqual(['[1, 4]', '(4, 7]', '(7, 10]']);
        expect(bySize.map(b => b.count)).toEqual([5, 1, 2]);
        expect(histogramBins(v, { count: 2 }).map(b => b.count)).toEqual([6, 2]);
        const auto = histogramBins(v);
        expect(auto.reduce((t, b) => t + b.count, 0)).toBe(v.length);
    });
});

describe("hierarchy", () => {
    it("builds a tree from levels where only a group's first row names it", () => {
        const t = buildTree(['a1', 'a2', 'b1'], [['A', '', 'B']], [1, 2, 4]);
        expect(t.map(n => [n.name, n.value, n.children.map(c => c.name)])).toEqual([['A', 3, ['a1', 'a2']], ['B', 4, ['b1']]]);
    });
    it("squarify fills the box with areas in proportion", () => {
        const r = squarify([6, 6, 4, 3, 2, 2, 1], { x: 0, y: 0, w: 6, h: 4 });
        const area = r.reduce((t, q) => t + q.w * q.h, 0);
        expect(area).toBeCloseTo(24, 6);
        expect(r[0].w * r[0].h).toBeCloseTo(6, 6);
        for (const q of r) { expect(q.x).toBeGreaterThanOrEqual(-1e-9); expect(q.x + q.w).toBeLessThanOrEqual(6 + 1e-9); }
    });
});

describe("layoutChartex", () => {
    it("waterfall: bars float from the running total; a total stands on zero", () => {
        const ops = layoutChartex({ kind: 'waterfall', categories: ['Start', 'Up', 'Down', 'End'], series: [{ name: 's', values: [10, 5, -3, 12] }], subtotals: [0, 3] }, ...box) as any[];
        const [start, up, down, end] = rects(ops);
        expect(up.y + up.h).toBeCloseTo(start.y, 6);           // "Up" starts where Start ends
        expect(down.y).toBeCloseTo(up.y, 6);                    // "Down" hangs from Up's top
        expect(end.y + end.h).toBeCloseTo(start.y + start.h, 6); // End stands on zero
        expect(new Set([start.fill, up.fill, down.fill])).toEqual(new Set([start.fill, up.fill, down.fill]));
        expect(up.fill).not.toBe(down.fill);
        expect(start.fill).toBe(end.fill);                      // both totals
    });
    it("funnel: bars centred, as wide as their value", () => {
        const [a, b] = rects(layoutChartex({ kind: 'funnel', categories: ['x', 'y'], series: [{ name: 's', values: [100, 50] }] }, ...box) as any[]);
        expect(b.w).toBeCloseTo(a.w / 2, 6);
        expect(a.x + a.w / 2).toBeCloseTo(b.x + b.w / 2, 6);
    });
    it("histogram counts bins; Pareto sorts them and adds the cumulative line to 100%", () => {
        const spec = { kind: 'histogram' as const, categories: [], series: [{ name: 's', values: [1, 2, 2, 3, 9, 10] }], binning: { size: 3 } };
        expect(rects(layoutChartex(spec, ...box) as any[]).length).toBe(3);
        const p = layoutChartex({ kind: 'pareto', categories: ['a', 'b', 'a', 'c'], series: [{ name: 's', values: [1, 5, 1, 2] }] }, ...box) as any[];
        const bars = rects(p).filter(r => r.series === 0);
        expect(bars.map(r => r.h)).toEqual([...bars.map(r => r.h)].sort((x, y) => y - x));   // descending
        const line = p.find(o => o.op === 'line' && o.series === 1);
        expect(line.points.length).toBe(3);
        expect(p.some(o => o.op === 'text' && o.text === '100%')).toBe(true);
    });
    it("box & whisker: a box per group and series, outliers as dots", () => {
        // g1 is 1..8 and 100: 100 is past Q3 + 1.5 IQR (exclusive quartiles).
        const ops = layoutChartex({ kind: 'boxWhisker', categories: [...Array(9).fill('g1'), 'g2', 'g2', 'g2'], series: [{ name: 's', values: [1, 2, 3, 4, 5, 6, 7, 8, 100, 5, 6, 7] }] }, ...box) as any[];
        expect(rects(ops).length).toBe(2);
        expect(ops.filter(o => o.op === 'dot').length).toBe(1);
    });
    it("treemap: a banner rect per group and a tile per leaf; sunburst: a ring per level", () => {
        const spec = { categories: ['a1', 'a2', 'b1'], levels: [['A', '', 'B']], series: [{ name: 's', values: [1, 2, 4] }] };
        const tm = layoutChartex({ ...spec, kind: 'treemap' }, ...box) as any[];
        expect(tm.filter(o => o.op === 'rect' && o.stroke).length).toBe(5);   // 2 groups + 3 leaves
        const sb = layoutChartex({ ...spec, kind: 'sunburst' }, ...box) as any[];
        const wedges = sb.filter(o => o.op === 'wedge');
        expect(wedges.length).toBe(5);
        const inner = wedges.filter(w => w.inner === Math.min(...wedges.map(x => x.inner)));
        expect(inner.reduce((t, w) => t + (w.a1 - w.a0), 0)).toBeCloseTo(Math.PI * 2, 6);
    });
    it("every kind lays out with finite numbers, and the summary carries the data", () => {
        for (const kind of ['waterfall', 'funnel', 'histogram', 'pareto', 'boxWhisker', 'treemap', 'sunburst'] as const) {
            const ops = layoutChartex({ kind, title: 'T', legend: 'top', categories: ['a', 'b', 'c'], series: [{ name: 's', values: [3, 1, 2] }] }, ...box) as any[];
            expect(ops.length).toBeGreaterThan(2);
            for (const o of ops) for (const v of [o.x, o.y, o.w, o.h, o.r, o.a0, o.a1]) if (v !== undefined) expect(Number.isFinite(v)).toBe(true);
        }
        expect(chartexSummary({ kind: 'funnel', title: 'Sales', categories: ['Leads', 'Won'], series: [{ name: '', values: [100, 20] }] })).toBe('Funnel chart: Sales. Leads 100, Won 20');
        expect(lighten('#000000', 0.5)).toBe('#808080');
    });
});

describe("charts saved without category names", () => {
    it("a waterfall numbers its bars instead of piling them into one band", () => {
        const ops = layoutChartex({ kind: 'waterfall', categories: [], series: [{ name: 's', values: [2, 5, -3] }] }, ...box) as any[];
        const bars = rects(ops);
        expect(bars.length).toBe(3);
        expect(bars[1].x).toBeGreaterThan(bars[0].x + bars[0].w - 1e-6);
        expect(bars[2].x + bars[2].w).toBeLessThanOrEqual(600);
        expect(ops.filter(o => o.op === 'text').map(o => o.text)).toEqual(expect.arrayContaining(['1', '2', '3']));
    });
});
