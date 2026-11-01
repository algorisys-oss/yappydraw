/**
 * Data charts (`chart` elements): the spec, its defaults, and the layout — a chart turned into a
 * list of drawing operations (rectangles, polylines, wedges, text) in the element's own box.
 * Both render styles (shapes/renderers/chart-renderer.ts) draw the same operations, so sketch and
 * architectural show the same chart, and the geometry unit-tests under bun. Pure.
 */

export type ChartKind = 'column' | 'bar' | 'line' | 'area' | 'pie' | 'doughnut';
export type LegendPos = 'right' | 'bottom' | 'top' | 'none';

export interface ChartSeries {
    name: string;
    /** One per category; null is a gap. */
    values: (number | null)[];
    color?: string;
}

export interface ChartSpec {
    kind: ChartKind;
    categories: string[];
    series: ChartSeries[];
    title?: string;
    /** Bars/columns/areas/lines on top of each other instead of side by side. */
    stacked?: boolean;
    legend?: LegendPos;
    dataLabels?: boolean;
    /** Horizontal value gridlines (default on). */
    gridlines?: boolean;
    /** Fixed value-axis range; absent = automatic. */
    yMin?: number;
    yMax?: number;
}

export const CHART_KINDS: readonly ChartKind[] = ['column', 'bar', 'line', 'area', 'pie', 'doughnut'];

/** Office's default series colours (accent 1–6), then a few more. */
export const SERIES_COLORS = ['#4472c4', '#ed7d31', '#a5a5a5', '#ffc000', '#5b9bd5', '#70ad47', '#264478', '#9e480e', '#636363', '#997300'];

export const isRound = (k: ChartKind) => k === 'pie' || k === 'doughnut';

/** A sample chart, as Insert ▸ Chart places it. */
export function defaultChartSpec(kind: ChartKind = 'column', names?: { categories: string[]; series: string[] }): ChartSpec {
    return {
        kind,
        categories: names?.categories ?? ['Q1', 'Q2', 'Q3', 'Q4'],
        series: (names?.series ?? ['Series 1', 'Series 2', 'Series 3']).map((name, i) => ({
            name, values: [[4.3, 2.5, 3.5, 4.5], [2.4, 4.4, 1.8, 2.8], [2, 2, 3, 5]][i % 3],
        })),
        legend: 'bottom',
        gridlines: true,
    };
}

/** Make any stored spec safe to lay out: known kind, arrays, finite numbers, at least one series. */
export function normalizeChart(spec: Partial<ChartSpec> | undefined): ChartSpec {
    const kind = CHART_KINDS.includes(spec?.kind as ChartKind) ? spec!.kind! : 'column';
    const categories = Array.isArray(spec?.categories) ? spec!.categories.map(c => String(c ?? '')) : [];
    const series = (Array.isArray(spec?.series) ? spec!.series : []).map((s, i) => ({
        name: String(s?.name ?? `Series ${i + 1}`),
        values: (Array.isArray(s?.values) ? s.values : []).map(v => (typeof v === 'number' && Number.isFinite(v) ? v : null)),
        ...(typeof s?.color === 'string' && s.color && { color: s.color }),
    }));
    const n = Math.max(categories.length, ...series.map(s => s.values.length), 0);
    while (categories.length < n) categories.push(String(categories.length + 1));
    for (const s of series) while (s.values.length < n) s.values.push(null);
    return {
        kind, categories, series: series.length ? series : [{ name: 'Series 1', values: categories.map(() => null) }],
        ...(spec?.title && { title: String(spec.title) }),
        ...(spec?.stacked && !isRound(kind) && { stacked: true }),
        legend: (['right', 'bottom', 'top', 'none'] as const).includes(spec?.legend as LegendPos) ? spec!.legend : 'bottom',
        ...(spec?.dataLabels && { dataLabels: true }),
        gridlines: spec?.gridlines !== false,
        ...(typeof spec?.yMin === 'number' && Number.isFinite(spec.yMin) && { yMin: spec.yMin }),
        ...(typeof spec?.yMax === 'number' && Number.isFinite(spec.yMax) && { yMax: spec.yMax }),
    };
}

export const seriesColor = (spec: ChartSpec, i: number) => spec.series[i]?.color || SERIES_COLORS[i % SERIES_COLORS.length];

/** "Nice" axis bounds and step (1, 2, 2.5 or 5 × 10ⁿ), covering [lo, hi] with about `target` steps. */
export function niceScale(lo: number, hi: number, target = 5): { min: number; max: number; step: number } {
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return { min: 0, max: 1, step: 0.2 };
    if (hi < lo) [lo, hi] = [hi, lo];
    if (hi === lo) { hi = lo === 0 ? 1 : lo + Math.abs(lo) * 0.5; if (lo > 0) lo = 0; }
    const raw = (hi - lo) / Math.max(1, target);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw - 1e-12) ?? 10 * mag;
    const min = Math.floor(lo / step + 1e-9) * step;
    const max = Math.ceil(hi / step - 1e-9) * step;
    return { min, max: max === min ? min + step : max, step };
}

/** A number as an axis or data label: thousands as k / M, at most 2 decimals. */
export function formatValue(v: number): string {
    const a = Math.abs(v);
    const trim = (n: number) => String(Math.round(n * 100) / 100);
    if (a >= 1e9) return trim(v / 1e9) + 'B';
    if (a >= 1e6) return trim(v / 1e6) + 'M';
    if (a >= 1e4) return trim(v / 1e3) + 'k';
    return trim(v);
}

export type ChartOp =
    | { op: 'rect'; x: number; y: number; w: number; h: number; fill?: string; stroke?: string; series?: number }
    | { op: 'line'; points: [number, number][]; stroke: string; width: number; closed?: boolean; fill?: string; series?: number }
    | { op: 'wedge'; cx: number; cy: number; r: number; inner: number; a0: number; a1: number; fill: string; series?: number }
    | { op: 'dot'; x: number; y: number; r: number; fill: string }
    | { op: 'text'; x: number; y: number; text: string; size: number; align: 'left' | 'center' | 'right'; baseline: 'top' | 'middle' | 'bottom'; color: string; bold?: boolean };

export interface ChartColors { text: string; muted: string; grid: string; axis: string; background?: string }
export const LIGHT: ChartColors = { text: '#1f2937', muted: '#4b5563', grid: '#e5e7eb', axis: '#9ca3af' };

/** Lay a chart out in a box (x, y, w, h). */
export function layoutChart(raw: Partial<ChartSpec> | undefined, x: number, y: number, w: number, h: number, colors: ChartColors = LIGHT): ChartOp[] {
    const spec = normalizeChart(raw);
    const ops: ChartOp[] = [];
    if (!(w > 4 && h > 4)) return ops;
    const fs = Math.max(8, Math.min(18, Math.min(w, h) * 0.045));   // base font size
    let top = y + fs * 0.6, bottom = y + h - fs * 0.6, left = x + fs * 0.6, right = x + w - fs * 0.6;

    if (spec.title) {
        ops.push({ op: 'text', x: x + w / 2, y: top, text: spec.title, size: fs * 1.35, align: 'center', baseline: 'top', color: colors.text, bold: true });
        top += fs * 2.1;
    }

    // Legend: one entry per series, or per category for pie/doughnut.
    const round = isRound(spec.kind);
    const entries = round
        ? spec.categories.map((c, i) => ({ label: c, color: spec.series[0]?.color && spec.categories.length === 1 ? spec.series[0].color! : SERIES_COLORS[i % SERIES_COLORS.length] }))
        : spec.series.map((s, i) => ({ label: s.name, color: seriesColor(spec, i) }));
    if (spec.legend !== 'none' && entries.length && (round || spec.series.length > 1 || spec.legend)) {
        const sw = fs * 0.8, gap = fs * 0.5;
        const widthOf = (t: string) => sw + gap + t.length * fs * 0.55 + fs;
        if (spec.legend === 'right') {
            const lw = Math.min(w * 0.35, Math.max(...entries.map(e => widthOf(e.label))));
            const lx = right - lw;
            let ly = top + (bottom - top) / 2 - (entries.length * fs * 1.5) / 2;
            for (const e of entries) {
                ops.push({ op: 'rect', x: lx, y: ly + (fs * 1.5 - sw) / 2, w: sw, h: sw, fill: e.color });
                ops.push({ op: 'text', x: lx + sw + gap, y: ly + fs * 0.75, text: e.label, size: fs, align: 'left', baseline: 'middle', color: colors.muted });
                ly += fs * 1.5;
            }
            right = lx - fs;
        } else {
            const rows: { label: string; color: string }[][] = [[]];
            let rowW = 0;
            for (const e of entries) {
                const ew = widthOf(e.label);
                if (rowW + ew > (right - left) && rows[rows.length - 1].length) { rows.push([]); rowW = 0; }
                rows[rows.length - 1].push(e); rowW += ew;
            }
            const lh = fs * 1.5;
            let ly = spec.legend === 'top' ? top : bottom - rows.length * lh;
            for (const row of rows) {
                const total = row.reduce((s, e) => s + widthOf(e.label), 0);
                let lx = x + (w - total) / 2;
                for (const e of row) {
                    ops.push({ op: 'rect', x: lx, y: ly + (lh - sw) / 2, w: sw, h: sw, fill: e.color });
                    ops.push({ op: 'text', x: lx + sw + gap, y: ly + lh / 2, text: e.label, size: fs, align: 'left', baseline: 'middle', color: colors.muted });
                    lx += widthOf(e.label);
                }
                ly += lh;
            }
            if (spec.legend === 'top') top += rows.length * lh + fs * 0.5; else bottom -= rows.length * lh + fs * 0.5;
        }
    }

    if (round) {
        layoutRound(spec, ops, left, top, right, bottom, fs, colors);
        return ops;
    }
    layoutAxes(spec, ops, left, top, right, bottom, fs, colors);
    return ops;
}

function layoutRound(spec: ChartSpec, ops: ChartOp[], left: number, top: number, right: number, bottom: number, fs: number, colors: ChartColors) {
    const s = spec.series[0];
    const vals = s.values.map(v => (v !== null && v > 0 ? v : 0));
    const total = vals.reduce((a, b) => a + b, 0);
    const cx = (left + right) / 2, cy = (top + bottom) / 2;
    const r = Math.max(4, Math.min(right - left, bottom - top) / 2 - fs * 0.5);
    const inner = spec.kind === 'doughnut' ? r * 0.5 : 0;
    if (!(total > 0)) {
        ops.push({ op: 'wedge', cx, cy, r, inner, a0: 0, a1: Math.PI * 2, fill: colors.grid });
        return;
    }
    let a = -Math.PI / 2;   // from 12 o'clock, clockwise, as Office draws them
    vals.forEach((v, i) => {
        if (!v) return;
        const a1 = a + (v / total) * Math.PI * 2;
        ops.push({ op: 'wedge', cx, cy, r, inner, a0: a, a1, fill: SERIES_COLORS[i % SERIES_COLORS.length], series: i });
        if (spec.dataLabels) {
            const mid = (a + a1) / 2, rr = inner ? (r + inner) / 2 : r * 0.65;
            ops.push({ op: 'text', x: cx + Math.cos(mid) * rr, y: cy + Math.sin(mid) * rr, text: `${Math.round((v / total) * 100)}%`, size: fs, align: 'center', baseline: 'middle', color: '#ffffff', bold: true });
        }
        a = a1;
    });
}

function layoutAxes(spec: ChartSpec, ops: ChartOp[], left: number, top: number, right: number, bottom: number, fs: number, colors: ChartColors) {
    const horizontal = spec.kind === 'bar';
    const n = spec.categories.length || 1;
    // Value range: per category sums when stacked (positives and negatives apart), else every value.
    let lo = 0, hi = 0;
    if (spec.stacked) {
        for (let c = 0; c < n; c++) {
            let pos = 0, neg = 0;
            for (const s of spec.series) { const v = s.values[c]; if (v === null) continue; if (v >= 0) pos += v; else neg += v; }
            hi = Math.max(hi, pos); lo = Math.min(lo, neg);
        }
    } else {
        for (const s of spec.series) for (const v of s.values) if (v !== null) { hi = Math.max(hi, v); lo = Math.min(lo, v); }
    }
    const scale = niceScale(spec.yMin ?? lo, spec.yMax ?? hi);
    const vmin = spec.yMin ?? scale.min, vmax = spec.yMax ?? scale.max;
    const ticks: number[] = [];
    for (let t = scale.min; t <= vmax + scale.step * 1e-6; t += scale.step) if (t >= vmin - scale.step * 1e-6) ticks.push(Math.round(t * 1e9) / 1e9);

    // Room for the value labels (left, or below for bars) and the category labels.
    const tickW = Math.max(...ticks.map(t => formatValue(t).length)) * fs * 0.6 + fs * 0.6;
    const catW = Math.max(...spec.categories.map(c => c.length), 1) * fs * 0.55 + fs * 0.6;
    const plot = horizontal
        ? { l: left + Math.min(catW, (right - left) * 0.35), t: top, r: right - fs * 0.5, b: bottom - fs * 1.6 }
        : { l: left + tickW, t: top + fs * 0.5, r: right, b: bottom - fs * 1.6 };
    const pw = plot.r - plot.l, ph = plot.b - plot.t;
    if (!(pw > 4 && ph > 4)) return;
    const span = vmax - vmin || 1;
    // Value → position along the value axis.
    const vpos = (v: number) => horizontal ? plot.l + ((v - vmin) / span) * pw : plot.b - ((v - vmin) / span) * ph;
    const zero = vpos(Math.min(Math.max(0, vmin), vmax));

    for (const t of ticks) {
        const p = vpos(t);
        if (horizontal) {
            if (spec.gridlines) ops.push({ op: 'line', points: [[p, plot.t], [p, plot.b]], stroke: colors.grid, width: 1 });
            ops.push({ op: 'text', x: p, y: plot.b + fs * 0.4, text: formatValue(t), size: fs, align: 'center', baseline: 'top', color: colors.muted });
        } else {
            if (spec.gridlines) ops.push({ op: 'line', points: [[plot.l, p], [plot.r, p]], stroke: colors.grid, width: 1 });
            ops.push({ op: 'text', x: plot.l - fs * 0.4, y: p, text: formatValue(t), size: fs, align: 'right', baseline: 'middle', color: colors.muted });
        }
    }

    const band = (horizontal ? ph : pw) / n;
    // Where category c's band starts along the category axis. A bar chart runs bottom-up, as
    // Office draws it (first category at the bottom), so a PowerPoint round trip looks the same.
    const bandStart = (c: number) => (horizontal ? plot.b - band * (c + 1) : plot.l + band * c);
    // Category labels, thinned when they would collide.
    const every = Math.max(1, Math.ceil((catW * (horizontal ? 0 : 1) + fs * (horizontal ? 1.4 : 0)) / Math.max(1, band)));
    spec.categories.forEach((c, i) => {
        if (i % every) return;
        const mid = bandStart(i) + band / 2;
        if (horizontal) ops.push({ op: 'text', x: plot.l - fs * 0.4, y: mid, text: c, size: fs, align: 'right', baseline: 'middle', color: colors.muted });
        else ops.push({ op: 'text', x: mid, y: plot.b + fs * 0.4, text: c, size: fs, align: 'center', baseline: 'top', color: colors.muted });
    });

    const label = (v: number, px: number, py: number, inside = false) => {
        if (spec.dataLabels) ops.push({ op: 'text', x: px, y: py, text: formatValue(v), size: fs * 0.9, align: 'center', baseline: inside ? 'middle' : 'bottom', color: inside ? '#ffffff' : colors.text });
    };

    if (spec.kind === 'column' || spec.kind === 'bar') {
        const groupPad = band * 0.2;
        const k = spec.stacked ? 1 : spec.series.length;
        const bw = (band - groupPad * 2) / Math.max(1, k);
        for (let c = 0; c < n; c++) {
            let pos = 0, neg = 0;
            spec.series.forEach((s, si) => {
                const v = s.values[c];
                if (v === null) return;
                let a: number, b: number;
                if (spec.stacked) { const base = v >= 0 ? pos : neg; a = vpos(base); b = vpos(base + v); if (v >= 0) pos += v; else neg += v; }
                else { a = zero; b = vpos(v); }
                // Side by side; in a bar chart the first series is the bottom one, as in Office.
                const slot = spec.stacked ? 0 : horizontal ? k - 1 - si : si;
                const off = bandStart(c) + groupPad + bw * slot;
                const fill = seriesColor(spec, si);
                if (horizontal) ops.push({ op: 'rect', x: Math.min(a, b), y: off, w: Math.abs(b - a), h: bw, fill, series: si });
                else ops.push({ op: 'rect', x: off, y: Math.min(a, b), w: bw, h: Math.abs(b - a), fill, series: si });
                if (horizontal) { if (spec.dataLabels) ops.push({ op: 'text', x: Math.max(a, b) + fs * 0.3, y: off + bw / 2, text: formatValue(v), size: fs * 0.9, align: 'left', baseline: 'middle', color: colors.text }); }
                else label(v, off + bw / 2, spec.stacked ? (a + b) / 2 : Math.min(a, b) - fs * 0.2, spec.stacked);
            });
        }
    } else {
        // Line and area: a point per category at the band's centre.
        const xs = spec.categories.map((_, i) => plot.l + band * (i + 0.5));
        const running = new Array(n).fill(0);
        spec.series.forEach((s, si) => {
            const color = seriesColor(spec, si);
            const base = running.slice();
            const pts: ([number, number] | null)[] = s.values.map((v, i) => {
                if (v === null) return null;
                const val = spec.stacked ? running[i] + v : v;
                if (spec.stacked) running[i] += v;
                return [xs[i], vpos(val)];
            });
            if (spec.kind === 'area') {
                const top = pts.map((p, i) => p ?? [xs[i], vpos(spec.stacked ? running[i] : 0)] as [number, number]);
                const floor = xs.map((xx, i) => [xx, spec.stacked ? vpos(base[i]) : zero] as [number, number]).reverse();
                ops.push({ op: 'line', points: [...top, ...floor], stroke: color, width: 1, closed: true, fill: color, series: si });
            } else {
                // Gaps break the line.
                let run: [number, number][] = [];
                const flush = () => { if (run.length > 1) ops.push({ op: 'line', points: run, stroke: color, width: Math.max(1.5, fs * 0.18), series: si }); run = []; };
                pts.forEach(p => { if (p) run.push(p); else flush(); });
                flush();
                pts.forEach(p => { if (p) ops.push({ op: 'dot', x: p[0], y: p[1], r: Math.max(2, fs * 0.25), fill: color }); });
            }
            s.values.forEach((v, i) => { const p = pts[i]; if (v !== null && p) label(v, p[0], p[1] - fs * 0.3); });
        });
    }
    // Axis lines last, over the bars.
    if (horizontal) ops.push({ op: 'line', points: [[zero, plot.t], [zero, plot.b]], stroke: colors.axis, width: 1 });
    else ops.push({ op: 'line', points: [[plot.l, zero], [plot.r, zero]], stroke: colors.axis, width: 1 });
}
