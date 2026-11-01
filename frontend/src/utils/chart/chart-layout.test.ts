import { describe, it, expect } from "bun:test";
import { layoutChart, niceScale, normalizeChart, formatValue, defaultChartSpec } from "./chart-layout";

describe("niceScale", () => {
    it("rounds to 1/2/2.5/5 steps covering the data", () => {
        expect(niceScale(0, 4.5)).toEqual({ min: 0, max: 5, step: 1 });
        expect(niceScale(0, 97)).toEqual({ min: 0, max: 100, step: 20 });
        expect(niceScale(-12, 30)).toEqual({ min: -20, max: 30, step: 10 });
        expect(niceScale(0, 0).max).toBeGreaterThan(0);
    });
    it("formats values compactly", () => {
        expect(formatValue(2.5)).toBe('2.5');
        expect(formatValue(12500)).toBe('12.5k');
        expect(formatValue(3_000_000)).toBe('3M');
    });
});

describe("normalizeChart", () => {
    it("fills gaps, drops junk and pads categories", () => {
        const s = normalizeChart({ kind: 'nope' as any, categories: ['a'], series: [{ name: 'x', values: [1, NaN as any, 'q' as any, 4] }] });
        expect(s.kind).toBe('column');
        expect(s.categories).toEqual(['a', '2', '3', '4']);
        expect(s.series[0].values).toEqual([1, null, null, 4]);
        expect(normalizeChart({ kind: 'pie', stacked: true }).stacked).toBeUndefined();
        expect(normalizeChart(undefined).series.length).toBe(1);
    });
});

describe("layoutChart", () => {
    const box = [0, 0, 600, 400] as const;
    it("draws one bar per value, side by side, growing up from zero", () => {
        const spec = { kind: 'column' as const, categories: ['a', 'b'], series: [{ name: 's1', values: [1, 2] }, { name: 's2', values: [3, -1] }], legend: 'none' as const };
        const bars = layoutChart(spec, ...box).filter(o => o.op === 'rect') as any[];
        expect(bars.length).toBe(4);
        const [a1, a2] = bars.filter(b => b.series === 0);
        expect(a2.h).toBeCloseTo(a1.h * 2, 6);                         // 2 is twice as tall as 1
        const neg = bars.find(b => b.series === 1 && b.h < bars.find(x => x.series === 1).h);
        expect(neg).toBeDefined();
        // Side by side: series 2's bar starts where series 1's ends.
        expect(bars[1].x).toBeCloseTo(bars[0].x + bars[0].w, 6);
    });
    it("stacks bars on top of each other", () => {
        const spec = { kind: 'column' as const, stacked: true, categories: ['a'], series: [{ name: 's1', values: [1] }, { name: 's2', values: [3] }], legend: 'none' as const };
        const [b1, b2] = layoutChart(spec, ...box).filter(o => o.op === 'rect') as any[];
        expect(b1.x).toBe(b2.x);
        expect(b2.y + b2.h).toBeCloseTo(b1.y, 6);                       // s2 sits on s1
        expect(b2.h).toBeCloseTo(b1.h * 3, 6);
    });
    it("bars run horizontally", () => {
        const r = layoutChart({ kind: 'bar', categories: ['a'], series: [{ name: 's', values: [5] }] }, ...box).find(o => o.op === 'rect' && (o as any).series === 0) as any;
        expect(r.w).toBeGreaterThan(r.h);
    });
    it("pie slices add up to a full turn from 12 o'clock", () => {
        const wedges = layoutChart({ kind: 'pie', categories: ['a', 'b', 'c'], series: [{ name: 's', values: [1, 1, 2] }] }, ...box).filter(o => o.op === 'wedge') as any[];
        expect(wedges.length).toBe(3);
        expect(wedges[0].a0).toBeCloseTo(-Math.PI / 2, 6);
        expect(wedges[2].a1 - wedges[2].a0).toBeCloseTo(Math.PI, 6);   // 2 of 4 = half
        expect(wedges[2].a1).toBeCloseTo(-Math.PI / 2 + Math.PI * 2, 6);
        expect(layoutChart({ kind: 'doughnut', categories: ['a'], series: [{ name: 's', values: [1] }] }, ...box).find(o => o.op === 'wedge')).toEqual(expect.objectContaining({ inner: expect.any(Number) }));
    });
    it("a line breaks at a gap; a legend lists each series", () => {
        const ops = layoutChart({ kind: 'line', categories: ['a', 'b', 'c', 'd'], series: [{ name: 'up', values: [1, 2, null, 4] }, { name: 'down', values: [4, 3, 2, 1] }] }, ...box);
        const lines = ops.filter(o => o.op === 'line' && (o as any).series === 0);
        expect(lines.length).toBe(1);                                   // [1,2] joined; 4 alone has no line
        expect(ops.filter(o => o.op === 'text').map((o: any) => o.text)).toEqual(expect.arrayContaining(['up', 'down']));
    });
    it("the default chart lays out with a title", () => {
        const ops = layoutChart({ ...defaultChartSpec(), title: 'Sales' }, ...box);
        expect(ops.find((o: any) => o.op === 'text' && o.text === 'Sales')).toBeDefined();
        expect(ops.filter(o => o.op === 'rect').length).toBeGreaterThanOrEqual(12);
    });
});
