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

describe("scatter, bubble, radar and stock", () => {
    const box = [0, 0, 600, 400] as const;
    const dots = (ops: any[], si?: number) => ops.filter(o => o.op === 'dot' && (si === undefined || o.series === si));

    it("scatter puts each point at its X value, not in a category slot", () => {
        const spec = { kind: 'scatter' as const, categories: ['1', '2', '4'], series: [{ name: 's', values: [10, 20, 40] }], legend: 'none' as const };
        const pts = dots(layoutChart(spec, ...box), 0);
        expect(pts.length).toBe(3);
        // x = 1, 2, 4: the gap from 2 to 4 is twice the gap from 1 to 2.
        expect(pts[2].x - pts[1].x).toBeCloseTo((pts[1].x - pts[0].x) * 2, 6);
        // y = 10, 20, 40: on a line through the origin, so equal slopes.
        expect((pts[0].y - pts[1].y) / (pts[1].x - pts[0].x)).toBeCloseTo((pts[1].y - pts[2].y) / (pts[2].x - pts[1].x), 6);
        expect(layoutChart(spec, ...box).some((o: any) => o.op === 'line' && o.series === 0)).toBe(false);   // markers only
    });
    it("scatter numbers its points when X isn't numeric, and draws lines when asked", () => {
        const ops = layoutChart({ kind: 'scatter', lines: true, categories: ['a', 'b', 'c'], series: [{ name: 's', values: [1, 2, 3] }], legend: 'none' }, ...box);
        const pts = dots(ops, 0);
        expect(pts[1].x - pts[0].x).toBeCloseTo(pts[2].x - pts[1].x, 6);
        expect(ops.filter((o: any) => o.op === 'line' && o.series === 0).length).toBe(1);
    });
    it("a smooth line passes through every point, with more points than the data", () => {
        const ops = layoutChart({ kind: 'scatter', lines: true, smooth: true, categories: ['0', '1', '2', '3'], series: [{ name: 's', values: [0, 3, 1, 2] }], legend: 'none' }, ...box);
        const line = ops.find((o: any) => o.op === 'line' && o.series === 0) as any;
        expect(line.points.length).toBeGreaterThan(4);
        for (const p of dots(ops, 0)) expect(line.points.some(([x, y]: number[]) => Math.hypot(x - p.x, y - p.y) < 1e-6)).toBe(true);
    });
    it("X years don't start the axis at zero", () => {
        const pts = dots(layoutChart({ kind: 'scatter', categories: ['2000', '2010', '2020'], series: [{ name: 's', values: [1, 2, 3] }], legend: 'none' }, ...box), 0);
        // 2000 to 2020 fills most of the plot instead of the last 1% of a 0–2000 axis.
        expect(pts[2].x - pts[0].x).toBeGreaterThan(300);
    });
    it("bubble areas follow their sizes", () => {
        const pts = dots(layoutChart({ kind: 'bubble', categories: ['1', '2'], series: [{ name: 's', values: [1, 1], sizes: [1, 4] }], legend: 'none' }, ...box), 0);
        expect(pts.length).toBe(2);
        expect(pts[1].r).toBeCloseTo(pts[0].r * 2, 6);    // 4× the area = 2× the radius
        expect(pts[0].opacity).toBeLessThan(1);
    });
    it("radar draws one closed polygon per series, a value on each spoke", () => {
        const spec = { kind: 'radar' as const, categories: ['a', 'b', 'c', 'd'], series: [{ name: 's', values: [4, 4, 4, 4] }], legend: 'none' as const };
        const poly = layoutChart(spec, ...box).find((o: any) => o.op === 'line' && o.series === 0) as any;
        expect(poly.closed).toBe(true);
        expect(poly.fill).toBeUndefined();
        expect(poly.points.length).toBe(4);
        // Equal values: every vertex the same distance from the centre, the first straight up.
        const cx = poly.points[0][0], cy = (poly.points[0][1] + poly.points[2][1]) / 2;
        const d = poly.points.map(([x, y]: number[]) => Math.hypot(x - cx, y - cy));
        for (const v of d) expect(v).toBeCloseTo(d[0], 6);
        expect(layoutChart(spec, ...box).filter((o: any) => o.op === 'text').map((o: any) => o.text)).toEqual(expect.arrayContaining(['a', 'b', 'c', 'd']));
        const filled = layoutChart({ ...spec, kind: 'filledRadar' }, ...box).find((o: any) => o.op === 'line' && o.series === 0) as any;
        expect(filled.fill).toBeDefined();
    });
    it("stock draws a high-low line and an open-close box per day, hollow when the price rose", () => {
        const spec = { kind: 'stock' as const, categories: ['d1', 'd2'], legend: 'none' as const, series: [
            { name: 'Open', values: [10, 14] }, { name: 'High', values: [15, 16] }, { name: 'Low', values: [8, 9] }, { name: 'Close', values: [14, 10] }] };
        const ops = layoutChart(spec, ...box) as any[];
        const boxes = ops.filter(o => o.op === 'rect' && o.stroke);
        expect(boxes.length).toBe(2);
        expect(boxes[0].fill).toBe('#ffffff');                 // rose: 10 → 14
        expect(boxes[1].fill).not.toBe('#ffffff');             // fell: 14 → 10
        const wicks = ops.filter(o => o.op === 'line' && o.points.length === 2 && o.points[0][0] === o.points[1][0] && o.stock);
        expect(wicks.length).toBe(2);
        // The wick spans high to low, the box open to close: the box sits inside the wick.
        expect(Math.min(wicks[0].points[0][1], wicks[0].points[1][1])).toBeLessThan(boxes[0].y);
        // High-low-close (3 series): a close tick, no box.
        const hlc = layoutChart({ ...spec, series: spec.series.slice(1) }, ...box) as any[];
        expect(hlc.filter(o => o.op === 'rect' && o.stroke).length).toBe(0);
        expect(hlc.filter(o => o.op === 'line' && o.stock).length).toBe(4);
    });
    it("normalize keeps bubble sizes, scatter options and the new kinds; no stacking for them", () => {
        const s = normalizeChart({ kind: 'bubble', stacked: true, categories: ['1', '2'], series: [{ name: 's', values: [1, 2], sizes: [3] as any }] });
        expect(s.kind).toBe('bubble');
        expect(s.series[0].sizes).toEqual([3, null]);
        expect(s.stacked).toBeUndefined();
        expect(normalizeChart({ kind: 'scatter', lines: true, smooth: true }).smooth).toBe(true);
        expect(normalizeChart({ kind: 'filledRadar' }).kind).toBe('filledRadar');
        expect(normalizeChart({ kind: 'stock' }).kind).toBe('stock');
    });
    it("every kind's sample lays out", () => {
        for (const k of ['scatter', 'bubble', 'radar', 'filledRadar', 'stock'] as const) {
            const ops = layoutChart(defaultChartSpec(k), ...box);
            expect(ops.length).toBeGreaterThan(10);
            for (const o of ops as any[]) for (const v of [o.x, o.y, o.w, o.h, o.r]) if (v !== undefined) expect(Number.isFinite(v)).toBe(true);
        }
    });
});

describe("100% stacked and combination charts", () => {
    const box = [0, 0, 600, 400] as const;
    it("100% stacking makes every column the same height, split by share", () => {
        const spec = { kind: 'column' as const, stacked: true, percent: true, legend: 'none' as const, categories: ['a', 'b'],
            series: [{ name: 's1', values: [1, 30] }, { name: 's2', values: [3, 10] }] };
        const ops = layoutChart(spec, ...box) as any[];
        const bars = ops.filter(o => o.op === 'rect');
        const a = bars.filter(b => b.x === bars[0].x), b = bars.filter(b => b.x !== bars[0].x);
        const h = (xs: any[]) => xs.reduce((t, r) => t + r.h, 0);
        expect(h(a)).toBeCloseTo(h(b), 6);                       // both columns are 100%
        expect(a[0].h / h(a)).toBeCloseTo(0.25, 6);              // 1 of 4
        expect(b[0].h / h(b)).toBeCloseTo(0.75, 6);              // 30 of 40
        expect(ops.filter(o => o.op === 'text').map(o => o.text)).toEqual(expect.arrayContaining(['100%', '0%']));
        expect(normalizeChart({ kind: 'column', percent: true }).percent).toBeUndefined();   // only with stacking
    });
    it("a series can be a line over columns", () => {
        const spec = { kind: 'column' as const, legend: 'none' as const, categories: ['a', 'b', 'c'],
            series: [{ name: 'sales', values: [1, 2, 3] }, { name: 'trend', values: [2, 2, 2], kind: 'line' as const }] };
        const ops = layoutChart(spec, ...box) as any[];
        expect(ops.filter(o => o.op === 'rect' && o.series === 0).length).toBe(3);
        expect(ops.filter(o => o.op === 'rect' && o.series === 1).length).toBe(0);
        const line = ops.find(o => o.op === 'line' && o.series === 1);
        expect(line.points.length).toBe(3);
        // The line's points sit over the middle of each column's band, and the one column slot is the full group.
        const bar = ops.find(o => o.op === 'rect' && o.series === 0);
        expect(line.points[0][0]).toBeCloseTo(bar.x + bar.w / 2, 6);
    });
    it("a series on the secondary axis is scaled to its own range, labelled on the right", () => {
        const spec = { kind: 'column' as const, legend: 'none' as const, categories: ['a', 'b'],
            series: [{ name: 'units', values: [10, 20] }, { name: 'rate', values: [0.1, 0.2], kind: 'line' as const, secondary: true }] };
        const ops = layoutChart(spec, ...box) as any[];
        const bar = ops.filter(o => o.op === 'rect' && o.series === 0)[1];         // 20 units
        const pt = ops.find(o => o.op === 'line' && o.series === 1).points[1];      // 0.2
        // On its own axis 0.2 is as high as 20 is on the primary one: both are the top of their range.
        expect(pt[1]).toBeCloseTo(bar.y, 0);
        const right = ops.filter(o => o.op === 'text' && o.align === 'left' && o.text === '0.2');
        expect(right.length).toBe(1);
    });
    it("normalize keeps series kinds and axes only where they apply", () => {
        const s = normalizeChart({ kind: 'line', series: [{ name: 'a', values: [1], kind: 'column', secondary: true }, { name: 'b', values: [1], kind: 'pie' as any }] });
        expect([s.series[0].kind, s.series[0].secondary, s.series[1].kind]).toEqual(['column', true, undefined]);
        const p = normalizeChart({ kind: 'pie', series: [{ name: 'a', values: [1], kind: 'line', secondary: true }] });
        expect([p.series[0].kind, p.series[0].secondary]).toEqual([undefined, undefined]);
    });
});
