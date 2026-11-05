/**
 * Data charts (`chart` elements): the spec, its defaults, and the layout — a chart turned into a
 * list of drawing operations (rectangles, polylines, wedges, text) in the element's own box.
 * Both render styles (shapes/renderers/chart-renderer.ts) draw the same operations, so sketch and
 * architectural show the same chart, and the geometry unit-tests under bun. Pure.
 */

export type ChartKind = 'column' | 'bar' | 'line' | 'area' | 'pie' | 'doughnut' | 'scatter' | 'bubble' | 'radar' | 'filledRadar' | 'stock';
export type LegendPos = 'right' | 'bottom' | 'top' | 'none';

export interface ChartSeries {
    name: string;
    /** One per category; null is a gap. Scatter/bubble: the Y values. */
    values: (number | null)[];
    /** Bubble charts: each bubble's size (its area), one per category. */
    sizes?: (number | null)[];
    color?: string;
    /** Combination charts: this series drawn as another type than the chart's (column, line and area charts only). */
    kind?: 'column' | 'line' | 'area';
    /** Combination charts: measured on the secondary value axis, on the right. */
    secondary?: boolean;
}

export interface ChartSpec {
    kind: ChartKind;
    categories: string[];
    series: ChartSeries[];
    title?: string;
    /** Bars/columns/areas/lines on top of each other instead of side by side. In a combination
     *  chart, only the series of the chart's own type stack. */
    stacked?: boolean;
    /** With `stacked`: each category's stack is 100 %, every series its share of it. */
    percent?: boolean;
    legend?: LegendPos;
    dataLabels?: boolean;
    /** Horizontal value gridlines (default on). */
    gridlines?: boolean;
    /** Fixed value-axis range; absent = automatic. */
    yMin?: number;
    yMax?: number;
    /** Scatter: join the points with lines (else markers only), and smooth those lines. */
    lines?: boolean;
    smooth?: boolean;
}

export const CHART_KINDS: readonly ChartKind[] = ['column', 'bar', 'line', 'area', 'pie', 'doughnut', 'scatter', 'bubble', 'radar', 'filledRadar', 'stock'];

/** Office's default series colours (accent 1–6), then a few more. */
export const SERIES_COLORS = ['#4472c4', '#ed7d31', '#a5a5a5', '#ffc000', '#5b9bd5', '#70ad47', '#264478', '#9e480e', '#636363', '#997300'];

export const isRound = (k: ChartKind) => k === 'pie' || k === 'doughnut';
/** Scatter and bubble: the category column holds numeric X values. */
export const isXY = (k: ChartKind) => k === 'scatter' || k === 'bubble';
export const isRadar = (k: ChartKind) => k === 'radar' || k === 'filledRadar';
/** Kinds whose series can stack on each other. */
export const canStack = (k: ChartKind) => k === 'column' || k === 'bar' || k === 'line' || k === 'area';
/** Kinds that combine: a column, line or area chart can draw any series as another of the three, on either axis. */
export const canCombine = (k: ChartKind | undefined): k is 'column' | 'line' | 'area' => k === 'column' || k === 'line' || k === 'area';
/** The type a series is drawn as: its own in a combination chart, else the chart's. */
export const seriesKind = (spec: ChartSpec, s: ChartSeries): ChartKind => (canCombine(spec.kind) && canCombine(s.kind) ? s.kind : spec.kind);
/** On the secondary axis (combination charts only). */
export const onSecondary = (spec: ChartSpec, s: ChartSeries) => !!s.secondary && canCombine(spec.kind);

/** A category as an X value: a finite number, else null ("1,234" and "12%" read as numbers). */
export function xValue(c: string): number | null {
    const t = String(c).trim().replace(/[,\s]/g, '').replace(/%$/, '');
    if (!t) return null;
    const v = Number(t);
    return Number.isFinite(v) ? v : null;
}

/** A sample chart, as Insert ▸ Chart places it. */
export function defaultChartSpec(kind: ChartKind = 'column', names?: { categories: string[]; series: string[] }): ChartSpec {
    if (kind === 'scatter' || kind === 'bubble') return {
        kind, categories: ['0.7', '1.8', '2.6', '3.2', '4.5'],
        series: [{ name: names?.series[0] ?? 'Series 1', values: [2.7, 3.2, 0.8, 4.1, 2.2], ...(kind === 'bubble' && { sizes: [10, 4, 8, 6, 12] }) },
            { name: names?.series[1] ?? 'Series 2', values: [1.2, 1.9, 2.8, 2.4, 3.6], ...(kind === 'bubble' && { sizes: [5, 9, 3, 7, 4] }) }],
        legend: 'bottom', gridlines: true,
    };
    if (kind === 'stock') return {
        kind, categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        series: [{ name: 'Open', values: [44, 25, 38, 50, 34] }, { name: 'High', values: [55, 57, 57, 58, 58] },
            { name: 'Low', values: [11, 12, 13, 11, 25] }, { name: 'Close', values: [25, 38, 50, 35, 43] }],
        legend: 'none', gridlines: true,
    };
    if (kind === 'radar' || kind === 'filledRadar') return {
        kind, categories: names?.categories ?? ['Speed', 'Power', 'Range', 'Comfort', 'Price'],
        series: [{ name: names?.series[0] ?? 'Series 1', values: [4, 3, 5, 2, 4] }, { name: names?.series[1] ?? 'Series 2', values: [2, 5, 3, 4, 3] }],
        legend: 'bottom', gridlines: true,
    };
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
        values: (Array.isArray(s?.values) ? s.values : []).map(finite),
        ...(Array.isArray(s?.sizes) && { sizes: s.sizes.map(finite) }),
        ...(typeof s?.color === 'string' && s.color && { color: s.color }),
        ...(canCombine(kind) && canCombine(s?.kind) && s.kind !== kind && { kind: s.kind }),
        ...(canCombine(kind) && s?.secondary && { secondary: true }),
    })) as ChartSeries[];
    const n = Math.max(categories.length, ...series.map(s => s.values.length), 0);
    while (categories.length < n) categories.push(String(categories.length + 1));
    for (const s of series) {
        while (s.values.length < n) s.values.push(null);
        if (s.sizes) { s.sizes.length = Math.min(s.sizes.length, n); while (s.sizes.length < n) s.sizes.push(null); }
    }
    return {
        kind, categories, series: series.length ? series : [{ name: 'Series 1', values: categories.map(() => null) }],
        ...(spec?.title && { title: String(spec.title) }),
        ...(spec?.stacked && canStack(kind) && { stacked: true }),
        ...(spec?.stacked && spec.percent && canStack(kind) && { percent: true }),
        legend: (['right', 'bottom', 'top', 'none'] as const).includes(spec?.legend as LegendPos) ? spec!.legend : 'bottom',
        ...(spec?.dataLabels && { dataLabels: true }),
        gridlines: spec?.gridlines !== false,
        ...(typeof spec?.yMin === 'number' && Number.isFinite(spec.yMin) && { yMin: spec.yMin }),
        ...(typeof spec?.yMax === 'number' && Number.isFinite(spec.yMax) && { yMax: spec.yMax }),
        ...(spec?.lines && { lines: true }),
        ...(spec?.smooth && { smooth: true }),
    };
}

const finite = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * An automatic axis range over [lo, hi], as Office picks one: from zero, unless the data sits far
 * from it (the range is under a sixth of the largest magnitude), as years or share prices do.
 */
function autoRange(lo: number, hi: number): [number, number] {
    if (!(hi >= lo)) return [0, 1];
    if (lo > 0 && (hi - lo) < hi / 6) return [lo, hi];
    if (hi < 0 && (hi - lo) < -lo / 6) return [lo, hi];
    return [Math.min(lo, 0), Math.max(hi, 0)];
}

/** Ticks of a nice scale between vmin and vmax. */
function ticksOf(scale: { min: number; step: number }, vmin: number, vmax: number): number[] {
    const out: number[] = [];
    for (let t = scale.min; t <= vmax + scale.step * 1e-6 && out.length < 200; t += scale.step) if (t >= vmin - scale.step * 1e-6) out.push(Math.round(t * 1e9) / 1e9);
    return out;
}

/**
 * Points along a smooth curve through `pts` (a Catmull-Rom spline, as near as a polyline gets to
 * Office's smoothed lines); every input point is on it.
 */
export function smoothPoints(pts: [number, number][], steps = 12): [number, number][] {
    if (pts.length < 3) return pts.slice();
    const out: [number, number][] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
        for (let k = 1; k <= steps; k++) {
            const t = k / steps, t2 = t * t, t3 = t2 * t;
            const f = (a: number, b: number, c: number, d: number) =>
                0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
            out.push(k === steps ? p2 : [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
        }
    }
    return out;
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
    /** `stock`: a stock chart's high-low line or close tick. */
    | { op: 'line'; points: [number, number][]; stroke: string; width: number; closed?: boolean; fill?: string; series?: number; stock?: boolean }
    | { op: 'wedge'; cx: number; cy: number; r: number; inner: number; a0: number; a1: number; fill: string; series?: number }
    /** `opacity` < 1 for bubbles, which overlap; `stroke` outlines them. */
    | { op: 'dot'; x: number; y: number; r: number; fill: string; series?: number; opacity?: number; stroke?: string }
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
    if (isRadar(spec.kind)) {
        layoutRadar(spec, ops, left, top, right, bottom, fs, colors);
        return ops;
    }
    if (isXY(spec.kind)) {
        layoutXY(spec, ops, left, top, right, bottom, fs, colors);
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

/** One value axis: its range, ticks, a value → position function and its label format. */
interface ValueAxis { vmin: number; vmax: number; ticks: number[]; fmt: (v: number) => string; pos: (v: number) => number }

/**
 * Column, bar, line, area and stock charts: a category axis and one or two value axes. In a
 * combination chart each series has its own type (areas are drawn first, then columns, then lines)
 * and axis; only the series of the chart's own type stack. 100 % stacking divides each value by its
 * category's total (of magnitudes) in that stack; the axis then reads 0–100 % and data labels keep
 * the values.
 */
function layoutAxes(spec: ChartSpec, ops: ChartOp[], left: number, top: number, right: number, bottom: number, fs: number, colors: ChartColors) {
    const horizontal = spec.kind === 'bar';
    const n = spec.categories.length || 1;
    const S = spec.series;
    const kindOf = S.map(s => seriesKind(spec, s));
    const axisOf = S.map(s => (onSecondary(spec, s) ? 1 : 0));
    const stackedOf = S.map((_, i) => !!spec.stacked && kindOf[i] === spec.kind);
    const dual = axisOf.includes(1) && !horizontal;
    // 100 %: each stack's total per category, per axis.
    const totals = [0, 1].map(a => Array.from({ length: n }, (_, c) => S.reduce((t, s, i) => {
        const v = s.values[c];
        return stackedOf[i] && axisOf[i] === a && v !== null ? t + Math.abs(v) : t;
    }, 0)));
    const shown = (i: number, c: number): number | null => {
        const v = S[i].values[c];
        if (v === null || !(spec.percent && stackedOf[i])) return v;
        const t = totals[axisOf[i]][c];
        return t ? v / t : 0;
    };
    // Each axis's range: stacks by their per-category sums (positives and negatives apart), other
    // series by their values. Stock prices cover the data, not zero to the data.
    const range = (a: number): [number, number] => {
        let lo = 0, hi = 0;
        if (spec.kind === 'stock') {
            lo = Infinity; hi = -Infinity;
            for (const s of S) for (const v of s.values) if (v !== null) { hi = Math.max(hi, v); lo = Math.min(lo, v); }
            return Number.isFinite(lo) ? autoRange(lo, hi) : [0, 1];
        }
        for (let c = 0; c < n; c++) {
            let pos = 0, neg = 0;
            S.forEach((_, i) => {
                if (axisOf[i] !== a) return;
                const v = shown(i, c);
                if (v === null) return;
                if (stackedOf[i]) { if (v >= 0) pos += v; else neg += v; }
                else { hi = Math.max(hi, v); lo = Math.min(lo, v); }
            });
            hi = Math.max(hi, pos); lo = Math.min(lo, neg);
        }
        return [lo, hi];
    };
    const pctAxis = (a: number) => !!spec.percent && S.some((_, i) => stackedOf[i] && axisOf[i] === a);
    const axisFor = (a: number): Omit<ValueAxis, 'pos'> => {
        const [lo, hi] = range(a);
        const fixed = a === 0;   // yMin / yMax set the primary axis
        const scale = niceScale(fixed ? spec.yMin ?? lo : lo, fixed ? spec.yMax ?? hi : hi);
        const vmin = (fixed ? spec.yMin : undefined) ?? scale.min, vmax = (fixed ? spec.yMax : undefined) ?? scale.max;
        const pct = pctAxis(a);
        return { vmin, vmax, ticks: ticksOf(scale, vmin, vmax), fmt: pct ? (v: number) => `${formatValue(Math.round(v * 1000) / 10)}%` : formatValue };
    };
    const ax0 = axisFor(0), ax1 = dual ? axisFor(1) : null;

    // Room for the value labels (left, right for a secondary axis, or below for bars) and the category labels.
    const widthOf = (ax: Omit<ValueAxis, 'pos'>) => Math.max(...ax.ticks.map(t => ax.fmt(t).length)) * fs * 0.6 + fs * 0.6;
    const tickW = widthOf(ax0);
    const catW = Math.max(...spec.categories.map(c => c.length), 1) * fs * 0.55 + fs * 0.6;
    const plot = horizontal
        ? { l: left + Math.min(catW, (right - left) * 0.35), t: top, r: right - fs * 0.5, b: bottom - fs * 1.6 }
        : { l: left + tickW, t: top + fs * 0.5, r: right - (ax1 ? widthOf(ax1) : 0), b: bottom - fs * 1.6 };
    const pw = plot.r - plot.l, ph = plot.b - plot.t;
    if (!(pw > 4 && ph > 4)) return;
    const withPos = (ax: Omit<ValueAxis, 'pos'>): ValueAxis => {
        const span = ax.vmax - ax.vmin || 1;
        return { ...ax, pos: (v: number) => horizontal ? plot.l + ((v - ax.vmin) / span) * pw : plot.b - ((v - ax.vmin) / span) * ph };
    };
    const axes = [withPos(ax0), ...(ax1 ? [withPos(ax1)] : [])];
    const vpos = (a: number, v: number) => axes[a].pos(v);
    const zeroOf = (a: number) => vpos(a, Math.min(Math.max(0, axes[a].vmin), axes[a].vmax));
    const zero = zeroOf(0);

    for (const t of axes[0].ticks) {
        const p = vpos(0, t);
        if (horizontal) {
            if (spec.gridlines) ops.push({ op: 'line', points: [[p, plot.t], [p, plot.b]], stroke: colors.grid, width: 1 });
            ops.push({ op: 'text', x: p, y: plot.b + fs * 0.4, text: axes[0].fmt(t), size: fs, align: 'center', baseline: 'top', color: colors.muted });
        } else {
            if (spec.gridlines) ops.push({ op: 'line', points: [[plot.l, p], [plot.r, p]], stroke: colors.grid, width: 1 });
            ops.push({ op: 'text', x: plot.l - fs * 0.4, y: p, text: axes[0].fmt(t), size: fs, align: 'right', baseline: 'middle', color: colors.muted });
        }
    }
    if (axes[1]) for (const t of axes[1].ticks) {
        ops.push({ op: 'text', x: plot.r + fs * 0.4, y: vpos(1, t), text: axes[1].fmt(t), size: fs, align: 'left', baseline: 'middle', color: colors.muted });
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

    if (spec.kind === 'stock') {
        layoutStock(spec, ops, n, band, bandStart, v => vpos(0, v), colors);
    } else {
        // Line and area points sit at the band's centre; stacks build on a running total per axis.
        const xs = spec.categories.map((_, i) => bandStart(i) + band / 2);
        const running = [new Array(n).fill(0), new Array(n).fill(0)];
        const pointsOf = (i: number) => {
            const a = axisOf[i];
            const base = running[a].slice();
            const pts: ([number, number] | null)[] = S[i].values.map((_, c) => {
                const v = shown(i, c);
                if (v === null) return null;
                const val = stackedOf[i] ? running[a][c] + v : v;
                if (stackedOf[i]) running[a][c] += v;
                return [xs[c], vpos(a, val)];
            });
            return { pts, base };
        };
        // Areas first (behind everything).
        S.forEach((s, i) => {
            if (kindOf[i] !== 'area') return;
            const color = seriesColor(spec, i), a = axisOf[i];
            const { pts, base } = pointsOf(i);
            const topEdge = pts.map((p, c) => p ?? [xs[c], vpos(a, stackedOf[i] ? running[a][c] : 0)] as [number, number]);
            const floor = xs.map((xx, c) => [xx, stackedOf[i] ? vpos(a, base[c]) : zeroOf(a)] as [number, number]).reverse();
            ops.push({ op: 'line', points: [...topEdge, ...floor], stroke: color, width: 1, closed: true, fill: color, series: i });
            s.values.forEach((v, c) => { const p = pts[c]; if (v !== null && p) label(v, p[0], p[1] - fs * 0.3); });
        });
        // Columns / bars: side by side in the band, a stack taking one slot.
        const colKind = horizontal ? 'bar' : 'column';
        const slotKeys: string[] = [];
        S.forEach((_, i) => { if (kindOf[i] !== colKind) return; const key = stackedOf[i] ? `stack${axisOf[i]}` : `s${i}`; if (!slotKeys.includes(key)) slotKeys.push(key); });
        if (slotKeys.length) {
            const groupPad = band * 0.2;
            const k = slotKeys.length;
            const bw = (band - groupPad * 2) / k;
            for (let c = 0; c < n; c++) {
                const pos = [0, 0], neg = [0, 0];
                S.forEach((s, si) => {
                    if (kindOf[si] !== colKind) return;
                    const v = s.values[c], sv = shown(si, c), ax = axisOf[si];
                    if (v === null || sv === null) return;
                    let a: number, b: number;
                    if (stackedOf[si]) {
                        const base0 = sv >= 0 ? pos[ax] : neg[ax];
                        a = vpos(ax, base0); b = vpos(ax, base0 + sv);
                        if (sv >= 0) pos[ax] += sv; else neg[ax] += sv;
                    } else { a = zeroOf(ax); b = vpos(ax, sv); }
                    const idx = slotKeys.indexOf(stackedOf[si] ? `stack${ax}` : `s${si}`);
                    // Side by side; in a bar chart the first series is the bottom one, as in Office.
                    const slot = horizontal ? k - 1 - idx : idx;
                    const off = bandStart(c) + groupPad + bw * slot;
                    const fill = seriesColor(spec, si);
                    if (horizontal) ops.push({ op: 'rect', x: Math.min(a, b), y: off, w: Math.abs(b - a), h: bw, fill, series: si });
                    else ops.push({ op: 'rect', x: off, y: Math.min(a, b), w: bw, h: Math.abs(b - a), fill, series: si });
                    // A stacked bar's label sits inside its segment (it would run into the next one), as a stacked column's does.
                    if (horizontal) { if (spec.dataLabels) ops.push(stackedOf[si]
                        ? { op: 'text', x: (a + b) / 2, y: off + bw / 2, text: formatValue(v), size: fs * 0.9, align: 'center', baseline: 'middle', color: '#ffffff' }
                        : { op: 'text', x: Math.max(a, b) + fs * 0.3, y: off + bw / 2, text: formatValue(v), size: fs * 0.9, align: 'left', baseline: 'middle', color: colors.text }); }
                    else label(v, off + bw / 2, stackedOf[si] ? (a + b) / 2 : Math.min(a, b) - fs * 0.2, stackedOf[si]);
                });
            }
        }
        // Lines last, over the columns.
        S.forEach((s, i) => {
            if (kindOf[i] !== 'line') return;
            const color = seriesColor(spec, i);
            const { pts } = pointsOf(i);
            // Gaps break the line.
            let run: [number, number][] = [];
            const flush = () => { if (run.length > 1) ops.push({ op: 'line', points: run, stroke: color, width: Math.max(1.5, fs * 0.18), series: i }); run = []; };
            pts.forEach(p => { if (p) run.push(p); else flush(); });
            flush();
            pts.forEach(p => { if (p) ops.push({ op: 'dot', x: p[0], y: p[1], r: Math.max(2, fs * 0.25), fill: color }); });
            s.values.forEach((v, c) => { const p = pts[c]; if (v !== null && p) label(v, p[0], p[1] - fs * 0.3); });
        });
    }
    // Axis lines last, over the bars.
    if (horizontal) ops.push({ op: 'line', points: [[zero, plot.t], [zero, plot.b]], stroke: colors.axis, width: 1 });
    else ops.push({ op: 'line', points: [[plot.l, zero], [plot.r, zero]], stroke: colors.axis, width: 1 });
}

/**
 * A stock chart, one mark per category: a high-low line over every series' value, then, with four
 * series (open, high, low, close), a box from open to close — hollow when the price rose, filled
 * when it fell, PowerPoint's up/down bars — or, with three (high, low, close), a tick at the close.
 * Follows DeckCraft `crates/render/src/radar.rs` `stock_marks` (MIT/Apache).
 */
function layoutStock(spec: ChartSpec, ops: ChartOp[], n: number, band: number, bandStart: (c: number) => number, vpos: (v: number) => number, colors: ChartColors) {
    const ink = colors.text;
    const k = spec.series.length;
    for (let c = 0; c < n; c++) {
        const vals = spec.series.map(s => s.values[c]).filter((v): v is number => v !== null);
        if (vals.length < 2) continue;
        const x = bandStart(c) + band / 2;
        ops.push({ op: 'line', points: [[x, vpos(Math.max(...vals))], [x, vpos(Math.min(...vals))]], stroke: ink, width: 1, stock: true });
        const open = spec.series[0].values[c], close = spec.series[k - 1].values[c];
        if (k >= 4 && open !== null && close !== null) {
            const w = band * 0.4, y0 = vpos(Math.max(open, close)), y1 = vpos(Math.min(open, close));
            // A rise is hollow (the paper's colour), a fall filled with ink, in either theme.
            ops.push({ op: 'rect', x: x - w / 2, y: y0, w, h: Math.max(1, y1 - y0), fill: close >= open ? (colors.background ?? '#ffffff') : ink, stroke: ink });
        } else if (close !== null) {
            const y = vpos(close);
            ops.push({ op: 'line', points: [[x, y], [x + band * 0.18, y]], stroke: seriesColor(spec, k - 1), width: 2.5, stock: true, series: k - 1 });
        }
    }
}

/**
 * Scatter and bubble charts: X is a value axis too. X values are the categories read as numbers
 * (when none is a number, the points are numbered 1, 2, 3… as Office does). Bubbles' areas follow
 * their sizes, the largest a quarter of the plot's shorter side across (Office's bubble scale 100).
 */
function layoutXY(spec: ChartSpec, ops: ChartOp[], left: number, top: number, right: number, bottom: number, fs: number, colors: ChartColors) {
    const parsed = spec.categories.map(xValue);
    const numbered = parsed.every(v => v === null);
    const xs = numbered ? spec.categories.map((_, i) => i + 1) : parsed;
    const bubble = spec.kind === 'bubble';
    let xlo = Infinity, xhi = -Infinity, ylo = Infinity, yhi = -Infinity;
    spec.series.forEach(s => s.values.forEach((v, i) => {
        const xv = xs[i];
        if (v === null || xv === null) return;
        xlo = Math.min(xlo, xv); xhi = Math.max(xhi, xv); ylo = Math.min(ylo, v); yhi = Math.max(yhi, v);
    }));
    if (!Number.isFinite(xlo)) { xlo = 0; xhi = 1; ylo = 0; yhi = 1; }
    const xs0 = niceScale(...autoRange(xlo, xhi));
    const [ya, yb] = autoRange(ylo, yhi);
    const ys0 = niceScale(spec.yMin ?? ya, spec.yMax ?? yb);
    const vmin = spec.yMin ?? ys0.min, vmax = spec.yMax ?? ys0.max;
    const yt = ticksOf(ys0, vmin, vmax), xt = ticksOf(xs0, xs0.min, xs0.max);
    const tickW = Math.max(...yt.map(t => formatValue(t).length)) * fs * 0.6 + fs * 0.6;
    const plot = { l: left + tickW, t: top + fs * 0.5, r: right - fs * 0.8, b: bottom - fs * 1.6 };
    const pw = plot.r - plot.l, ph = plot.b - plot.t;
    if (!(pw > 4 && ph > 4)) return;
    const X = (v: number) => plot.l + ((v - xs0.min) / (xs0.max - xs0.min || 1)) * pw;
    const Y = (v: number) => plot.b - ((v - vmin) / (vmax - vmin || 1)) * ph;
    for (const t of yt) {
        if (spec.gridlines) ops.push({ op: 'line', points: [[plot.l, Y(t)], [plot.r, Y(t)]], stroke: colors.grid, width: 1 });
        ops.push({ op: 'text', x: plot.l - fs * 0.4, y: Y(t), text: formatValue(t), size: fs, align: 'right', baseline: 'middle', color: colors.muted });
    }
    const every = Math.max(1, Math.ceil((Math.max(...xt.map(t => formatValue(t).length)) * fs * 0.6 + fs) / Math.max(1, pw / Math.max(1, xt.length - 1))));
    xt.forEach((t, i) => { if (!(i % every)) ops.push({ op: 'text', x: X(t), y: plot.b + fs * 0.4, text: formatValue(t), size: fs, align: 'center', baseline: 'top', color: colors.muted }); });
    const maxSize = bubble ? Math.max(0, ...spec.series.flatMap(s => (s.sizes ?? []).map(v => (v !== null && v > 0 ? v : 0)))) : 0;
    const maxR = Math.min(pw, ph) * 0.125;
    spec.series.forEach((s, si) => {
        const color = seriesColor(spec, si);
        const pts: ([number, number] | null)[] = s.values.map((v, i) => (v === null || xs[i] === null ? null : [X(xs[i]!), Y(v)]));
        if (spec.lines && !bubble) {
            let run: [number, number][] = [];
            const flush = () => { if (run.length > 1) ops.push({ op: 'line', points: spec.smooth ? smoothPoints(run) : run, stroke: color, width: Math.max(1.5, fs * 0.18), series: si }); run = []; };
            pts.forEach(p => { if (p) run.push(p); else flush(); });
            flush();
        }
        pts.forEach((p, i) => {
            if (!p) return;
            if (bubble) {
                const size = s.sizes?.[i];
                if (size === null || size === undefined || !(size > 0) || !(maxSize > 0)) return;
                ops.push({ op: 'dot', x: p[0], y: p[1], r: Math.max(1, Math.sqrt(size / maxSize) * maxR), fill: color, opacity: 0.75, stroke: color, series: si });
            } else ops.push({ op: 'dot', x: p[0], y: p[1], r: Math.max(2, fs * 0.25), fill: color, series: si });
            if (spec.dataLabels) ops.push({ op: 'text', x: p[0], y: p[1] - fs * 0.4, text: formatValue(s.values[i]!), size: fs * 0.9, align: 'center', baseline: 'bottom', color: colors.text });
        });
    });
    ops.push({ op: 'line', points: [[plot.l, plot.t], [plot.l, plot.b], [plot.r, plot.b]], stroke: colors.axis, width: 1 });
}

/**
 * Radar charts: a spoke per category from 12 o'clock clockwise, the value scale along each spoke,
 * gridlines as polygons at each tick, a closed outline per series (filled for a filled radar).
 * Missing values sit at the centre. Follows DeckCraft `crates/render/src/radar.rs` (MIT/Apache).
 */
function layoutRadar(spec: ChartSpec, ops: ChartOp[], left: number, top: number, right: number, bottom: number, fs: number, colors: ChartColors) {
    const n = spec.categories.length;
    if (n < 3) return;   // nothing to draw (the data dialog says why)
    let lo = 0, hi = 0;
    for (const s of spec.series) for (const v of s.values) if (v !== null) { hi = Math.max(hi, v); lo = Math.min(lo, v); }
    const scale = niceScale(spec.yMin ?? lo, spec.yMax ?? hi);
    const vmin = spec.yMin ?? scale.min, vmax = spec.yMax ?? scale.max, span = vmax - vmin || 1;
    const ticks = ticksOf(scale, vmin, vmax);
    const cx = (left + right) / 2, cy = (top + bottom) / 2;
    const r = Math.max(fs, Math.min(right - left, bottom - top) / 2 - fs * 1.9);
    const at = (i: number, frac: number): [number, number] => {
        const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
        return [cx + Math.cos(a) * r * frac, cy + Math.sin(a) * r * frac];
    };
    const frac = (v: number) => Math.max(0, Math.min(1.2, (v - vmin) / span));
    if (spec.gridlines) for (const t of ticks) {
        if (t === vmin) continue;
        ops.push({ op: 'line', points: Array.from({ length: n }, (_, i) => at(i, frac(t))), stroke: colors.grid, width: 1, closed: true });
    }
    for (let i = 0; i < n; i++) {
        ops.push({ op: 'line', points: [[cx, cy], at(i, 1)], stroke: colors.grid, width: 1 });
        const [qx, qy] = at(i, 1 + (fs * 1.1) / r);
        ops.push({ op: 'text', x: qx, y: qy, text: spec.categories[i], size: fs, align: Math.abs(qx - cx) < fs ? 'center' : qx > cx ? 'left' : 'right', baseline: 'middle', color: colors.muted });
    }
    for (const t of ticks) {
        const [qx, qy] = at(0, frac(t));
        ops.push({ op: 'text', x: qx - fs * 0.3, y: qy, text: formatValue(t), size: fs * 0.9, align: 'right', baseline: 'middle', color: colors.muted });
    }
    const filled = spec.kind === 'filledRadar';
    spec.series.forEach((s, si) => {
        const color = seriesColor(spec, si);
        const pts = Array.from({ length: n }, (_, i) => at(i, frac(s.values[i] ?? vmin)));
        ops.push({ op: 'line', points: pts, stroke: color, width: filled ? 1 : Math.max(1.5, fs * 0.18), closed: true, ...(filled && { fill: color }), series: si });
        if (!filled) pts.forEach(([px, py]) => ops.push({ op: 'dot', x: px, y: py, r: Math.max(2, fs * 0.22), fill: color, series: si }));
        if (spec.dataLabels) pts.forEach(([px, py], i) => {
            const v = s.values[i];
            if (v !== null) ops.push({ op: 'text', x: px, y: py - fs * 0.3, text: formatValue(v), size: fs * 0.9, align: 'center', baseline: 'bottom', color: colors.text });
        });
    });
}
