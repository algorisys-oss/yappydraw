/**
 * Office 2016 charts (`cx:chartSpace`, PowerPoint's "chartEx" part): waterfall, funnel, histogram,
 * Pareto, box & whisker, treemap and sunburst, laid out as the same drawing operations as data
 * charts (chart-layout.ts). PowerPoint import draws them once from the values the file caches —
 * a picture made of shapes, not an editable data chart. Pure.
 *
 * The treemap (squarified), sunburst and funnel follow DeckCraft `crates/render/src/chartex.rs`
 * (MIT/Apache); waterfall, histogram binning, Pareto and box statistics follow Office's documented
 * behaviour.
 */
import { niceScale, formatValue, SERIES_COLORS, LIGHT, type ChartOp, type ChartColors } from './chart-layout';

export type ChartexKind = 'waterfall' | 'funnel' | 'histogram' | 'pareto' | 'boxWhisker' | 'treemap' | 'sunburst';

export interface ChartexSeries {
    name: string;
    values: (number | null)[];
    /** Box & whisker: each value's group (its category); absent = the chart's categories. */
    categories?: string[];
}

export interface ChartexSpec {
    kind: ChartexKind;
    title?: string;
    /** One per point: the innermost category level (a treemap's leaves, a waterfall's bars). */
    categories: string[];
    /** Treemap / sunburst: the outer levels, innermost first, one entry per point. */
    levels?: string[][];
    series: ChartexSeries[];
    /** Waterfall: points that are totals (drawn from zero), by index. */
    subtotals?: number[];
    /** Histogram / Pareto: bin by value (`binning`): a bin count or width, else automatic. Without
     *  it, values are summed by category. */
    binning?: { count?: number; size?: number };
    /** Box & whisker: inclusive quartiles (else exclusive, Excel's default). */
    inclusive?: boolean;
    dataLabels?: boolean;
    legend?: 'top' | 'bottom' | 'none';
    /** The palette (the deck's theme accents). */
    colors?: string[];
}

const palette = (spec: ChartexSpec) => (spec.colors?.length ? spec.colors : SERIES_COLORS);
const color = (spec: ChartexSpec, i: number) => palette(spec)[((i % palette(spec).length) + palette(spec).length) % palette(spec).length];

/** `hex` mixed toward white by k (0..1). */
export function lighten(hex: string, k: number): string {
    const m = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!m) return hex;
    const n = parseInt(m[1], 16), t = Math.max(0, Math.min(0.85, k));
    const ch = (v: number) => Math.round(v + (255 - v) * t).toString(16).padStart(2, '0');
    return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

// ── Statistics and binning ───────────────────────────────────────────────────────────────────

/** A quartile of sorted data: exclusive (Excel's QUARTILE.EXC, the box chart's default) or inclusive. */
export function quartile(sorted: number[], q: number, inclusive: boolean): number {
    const n = sorted.length;
    if (!n) return NaN;
    if (n === 1) return sorted[0];
    let pos = inclusive ? q * (n - 1) : q * (n + 1) - 1;   // 0-based
    pos = Math.max(0, Math.min(n - 1, pos));
    const lo = Math.floor(pos), f = pos - lo;
    return sorted[lo] + (sorted[Math.min(n - 1, lo + 1)] - sorted[lo]) * f;
}

export interface BoxStats { q1: number; median: number; q3: number; lo: number; hi: number; mean: number; outliers: number[] }

/** Box & whisker statistics: whiskers to the furthest values within 1.5 × IQR, the rest outliers. */
export function boxStats(values: number[], inclusive = false): BoxStats | null {
    const v = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (!v.length) return null;
    const q1 = quartile(v, 0.25, inclusive), q3 = quartile(v, 0.75, inclusive), median = quartile(v, 0.5, true);
    const iqr = q3 - q1, lf = q1 - 1.5 * iqr, uf = q3 + 1.5 * iqr;
    const inside = v.filter(x => x >= lf && x <= uf);
    return { q1, median, q3, lo: inside[0] ?? q1, hi: inside[inside.length - 1] ?? q3, mean: v.reduce((a, b) => a + b, 0) / v.length, outliers: v.filter(x => x < lf || x > uf) };
}

/**
 * Histogram bins, as Excel makes them: from the smallest value, of the width asked for (or the
 * count asked for, or Scott's rule: 3.5 σ / n^⅓), the first closed `[a, b]`, the others `(a, b]`.
 */
export function histogramBins(values: number[], binning: { count?: number; size?: number } = {}): { label: string; count: number }[] {
    const v = values.filter(Number.isFinite);
    if (!v.length) return [];
    const min = Math.min(...v), max = Math.max(...v);
    let width: number;
    if (binning.size && binning.size > 0) width = binning.size;
    else if (binning.count && binning.count > 0) width = (max - min) / binning.count || 1;
    else {
        const mean = v.reduce((a, b) => a + b, 0) / v.length;
        const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, v.length - 1));
        width = (3.5 * sd) / Math.cbrt(v.length) || 1;
    }
    const count = Math.max(1, Math.min(500, binning.count && !binning.size ? binning.count : Math.ceil((max - min) / width - 1e-9) || 1));
    const bins = Array.from({ length: count }, (_, i) => {
        const a = min + width * i, b = min + width * (i + 1);
        return { label: `${i ? '(' : '['}${formatValue(round(a))}, ${formatValue(round(b))}]`, count: 0 };
    });
    for (const x of v) {
        let i = Math.ceil((x - min) / width - 1e-9) - 1;
        i = Math.max(0, Math.min(count - 1, i));
        bins[i].count++;
    }
    return bins;
}
const round = (v: number) => Math.round(v * 1e6) / 1e6;

/** Values summed by category, in first-seen order (a histogram or Pareto over text categories). */
function byCategory(cats: string[], values: (number | null)[]): { label: string; count: number }[] {
    const out = new Map<string, number>();
    values.forEach((v, i) => { const k = cats[i] || String(i + 1); out.set(k, (out.get(k) ?? 0) + (v ?? 0)); });
    return [...out].map(([label, count]) => ({ label, count }));
}

// ── Hierarchy ────────────────────────────────────────────────────────────────────────────────

export interface TreeNode { name: string; value: number; children: TreeNode[] }

/**
 * The hierarchy of a treemap or sunburst: each point's path runs from the outermost level to its
 * own category. An outer level names a group only where the group starts (its other rows are
 * blank), so blanks repeat the name above; a blank leaf ends the path one level up.
 */
export function buildTree(categories: string[], levels: string[][], values: (number | null)[]): TreeNode[] {
    const outer = [...levels].reverse();   // outermost first
    const filled = outer.map(lvl => { let last = ''; return categories.map((_, i) => (lvl[i] ? (last = lvl[i]) : last)); });
    const roots: TreeNode[] = [];
    categories.forEach((leaf, i) => {
        const v = values[i];
        if (v === null || v === undefined || !(v > 0)) return;
        const path = [...filled.map(l => l[i]), leaf].filter((p, k, all) => p !== '' || k < all.length - 1);
        while (path.length > 1 && path[path.length - 1] === '') path.pop();
        let nodes = roots;
        for (const name of path) {
            let node = nodes.find(n => n.name === name);
            if (!node) { node = { name, value: 0, children: [] }; nodes.push(node); }
            node.value += v;
            nodes = node.children;
        }
    });
    return roots;
}

// ── Treemap ──────────────────────────────────────────────────────────────────────────────────

type Rect = { x: number; y: number; w: number; h: number };

/** Squarified treemap (Bruls, Huizing, van Wijk): one rectangle per value, in input order. */
export function squarify(vals: number[], r: Rect): Rect[] {
    const out: Rect[] = vals.map(() => ({ x: r.x, y: r.y, w: 0, h: 0 }));
    const total = vals.reduce((a, b) => a + (b > 0 ? b : 0), 0);
    if (!(total > 0) || !(r.w > 0 && r.h > 0)) return out;
    const scale = (r.w * r.h) / total;
    const order = vals.map((_, i) => i).filter(i => vals[i] > 0).sort((a, b) => vals[b] - vals[a]);
    let free = { ...r };
    let i = 0;
    const worst = (sum: number, max: number, min: number, s2: number) => Math.max((s2 * max) / (sum * sum), (sum * sum) / (s2 * min));
    while (i < order.length) {
        const short = Math.min(free.w, free.h);
        if (!(short > 1e-9)) break;
        const s2 = short * short;
        let sum = vals[order[i]] * scale, max = sum, min = sum, cur = worst(sum, max, min, s2), end = i + 1;
        while (end < order.length) {
            const a = vals[order[end]] * scale;
            const w2 = worst(sum + a, Math.max(max, a), Math.min(min, a), s2);
            if (!(w2 <= cur)) break;
            sum += a; max = Math.max(max, a); min = Math.min(min, a); cur = w2; end++;
        }
        const thick = sum / short;
        let at = 0;
        for (const k of order.slice(i, end)) {
            const len = (vals[k] * scale) / thick;
            out[k] = free.w >= free.h ? { x: free.x, y: free.y + at, w: thick, h: len } : { x: free.x + at, y: free.y, w: len, h: thick };
            at += len;
        }
        free = free.w >= free.h ? { x: free.x + thick, y: free.y, w: free.w - thick, h: free.h } : { x: free.x, y: free.y + thick, w: free.w, h: free.h - thick };
        i = end;
    }
    return out;
}

// ── Layout ───────────────────────────────────────────────────────────────────────────────────

/** Lay a 2016 chart out in a box. */
export function layoutChartex(spec: ChartexSpec, x: number, y: number, w: number, h: number, colors: ChartColors = LIGHT): ChartOp[] {
    const ops: ChartOp[] = [];
    if (!(w > 4 && h > 4)) return ops;
    const fs = Math.max(8, Math.min(18, Math.min(w, h) * 0.045));
    let top = y + fs * 0.6, bottom = y + h - fs * 0.6;
    const left = x + fs * 0.6, right = x + w - fs * 0.6;
    if (spec.title) {
        ops.push({ op: 'text', x: x + w / 2, y: top, text: spec.title, size: fs * 1.35, align: 'center', baseline: 'top', color: colors.text, bold: true });
        top += fs * 2.1;
    }
    // Legend: a row of entries, where Office shows one.
    const entries = legendOf(spec);
    if (entries.length && spec.legend && spec.legend !== 'none') {
        const sw = fs * 0.8, gap = fs * 0.5, widthOf = (t: string) => sw + gap + t.length * fs * 0.55 + fs;
        const total = entries.reduce((a, e) => a + widthOf(e.label), 0);
        const ly = spec.legend === 'top' ? top : bottom - fs * 1.5;
        let lx = x + (w - total) / 2;
        for (const e of entries) {
            ops.push({ op: 'rect', x: lx, y: ly + (fs * 1.5 - sw) / 2, w: sw, h: sw, fill: e.color });
            ops.push({ op: 'text', x: lx + sw + gap, y: ly + fs * 0.75, text: e.label, size: fs, align: 'left', baseline: 'middle', color: colors.muted });
            lx += widthOf(e.label);
        }
        if (spec.legend === 'top') top += fs * 2; else bottom -= fs * 2;
    }
    const area = { l: left, t: top, r: right, b: bottom };
    switch (spec.kind) {
        case 'waterfall': waterfall(spec, ops, area, fs, colors); break;
        case 'funnel': funnel(spec, ops, area, fs, colors); break;
        case 'histogram': case 'pareto': histogram(spec, ops, area, fs, colors); break;
        case 'boxWhisker': boxes(spec, ops, area, fs, colors); break;
        case 'treemap': treemap(spec, ops, area, fs); break;
        case 'sunburst': sunburst(spec, ops, area, fs); break;
    }
    return ops;
}

function legendOf(spec: ChartexSpec): { label: string; color: string }[] {
    switch (spec.kind) {
        case 'waterfall': return [{ label: 'Increase', color: color(spec, 0) }, { label: 'Decrease', color: color(spec, 1) }, { label: 'Total', color: color(spec, 2) }];
        case 'boxWhisker': return spec.series.map((s, i) => ({ label: s.name || `Series ${i + 1}`, color: color(spec, i) }));
        case 'treemap': case 'sunburst': return buildTree(spec.categories, spec.levels ?? [], spec.series[0]?.values ?? []).map((n, i) => ({ label: n.name, color: color(spec, i) }));
        default: return [];
    }
}

type Area = { l: number; t: number; r: number; b: number };

/**
 * A category axis along the bottom and a value axis on the left (and, for a Pareto line, a 0–100 %
 * axis on the right): gridlines, tick and category labels. Returns where things go.
 */
function axisFrame(ops: ChartOp[], cats: string[], lo: number, hi: number, a: Area, fs: number, colors: ChartColors, opts: { gridlines?: boolean; pct?: boolean } = {}) {
    const scale = niceScale(lo, hi);
    const ticks: number[] = [];
    for (let t = scale.min; t <= scale.max + scale.step * 1e-6 && ticks.length < 100; t += scale.step) ticks.push(Math.round(t * 1e9) / 1e9);
    const tickW = Math.max(...ticks.map(t => formatValue(t).length)) * fs * 0.6 + fs * 0.6;
    const plot = { l: a.l + tickW, t: a.t + fs * 0.5, r: a.r - (opts.pct ? fs * 2.8 : 0), b: a.b - fs * 1.6 };
    const pw = plot.r - plot.l, ph = plot.b - plot.t;
    const span = scale.max - scale.min || 1;
    const vpos = (v: number) => plot.b - ((v - scale.min) / span) * ph;
    for (const t of ticks) {
        if (opts.gridlines !== false) ops.push({ op: 'line', points: [[plot.l, vpos(t)], [plot.r, vpos(t)]], stroke: colors.grid, width: 1 });
        ops.push({ op: 'text', x: plot.l - fs * 0.4, y: vpos(t), text: formatValue(t), size: fs, align: 'right', baseline: 'middle', color: colors.muted });
    }
    if (opts.pct) for (let p = 0; p <= 100; p += 20) {
        ops.push({ op: 'text', x: plot.r + fs * 0.4, y: plot.b - (p / 100) * ph, text: `${p}%`, size: fs, align: 'left', baseline: 'middle', color: colors.muted });
    }
    const n = Math.max(1, cats.length), band = pw / n;
    const catW = Math.max(...cats.map(c => c.length), 1) * fs * 0.55 + fs * 0.6;
    const every = Math.max(1, Math.ceil(catW / Math.max(1, band)));
    cats.forEach((c, i) => { if (!(i % every)) ops.push({ op: 'text', x: plot.l + band * (i + 0.5), y: plot.b + fs * 0.4, text: c, size: fs, align: 'center', baseline: 'top', color: colors.muted }); });
    const zero = vpos(Math.min(Math.max(0, scale.min), scale.max));
    return { plot, band, vpos, zero, ok: pw > 4 && ph > 4 };
}

/** Bars that float from the running total; totals (subtotals) stand on zero. Connectors join them. */
function waterfall(spec: ChartexSpec, ops: ChartOp[], a: Area, fs: number, colors: ChartColors) {
    const vals = spec.series[0]?.values ?? [];
    const totals = new Set(spec.subtotals ?? []);
    let run = 0, lo = 0, hi = 0;
    const bars = vals.map((v, i) => {
        const val = v ?? 0;
        const from = totals.has(i) ? 0 : run, to = totals.has(i) ? val : run + val;
        run = to;
        lo = Math.min(lo, from, to); hi = Math.max(hi, from, to);
        return { from, to, total: totals.has(i), v: val };
    });
    // A bar per value; values without a category name are numbered, as Office does.
    const f = axisFrame(ops, vals.map((_, i) => spec.categories[i] || String(i + 1)), lo, hi, a, fs, colors);
    if (!f.ok) return;
    const pad = f.band * 0.2;
    bars.forEach((b, i) => {
        const fill = color(spec, b.total ? 2 : b.to >= b.from ? 0 : 1);
        const y0 = f.vpos(Math.max(b.from, b.to)), y1 = f.vpos(Math.min(b.from, b.to));
        const x0 = f.plot.l + f.band * i + pad;
        ops.push({ op: 'rect', x: x0, y: y0, w: f.band - pad * 2, h: Math.max(1, y1 - y0), fill, series: i });
        if (i < bars.length - 1) {
            const yy = f.vpos(b.to);
            ops.push({ op: 'line', points: [[x0 + f.band - pad * 2, yy], [x0 + f.band, yy]], stroke: colors.axis, width: 1 });
        }
        if (spec.dataLabels) ops.push({ op: 'text', x: x0 + (f.band - pad * 2) / 2, y: y0 - fs * 0.2, text: formatValue(b.v), size: fs * 0.9, align: 'center', baseline: 'bottom', color: colors.text });
    });
    ops.push({ op: 'line', points: [[f.plot.l, f.zero], [f.plot.r, f.zero]], stroke: colors.axis, width: 1 });
}

/** Bars centred on one axis, as wide as their value, in the order given: names left, values inside. */
function funnel(spec: ChartexSpec, ops: ChartOp[], a: Area, fs: number, colors: ChartColors) {
    const vals = (spec.series[0]?.values ?? []).map(v => Math.max(0, v ?? 0));
    const max = Math.max(1e-9, ...vals);
    const gutter = Math.min((a.r - a.l) * 0.4, Math.max(0, ...spec.categories.map(c => c.length)) * fs * 0.55 + fs);
    const pl = a.l + gutter, pw = a.r - pl, band = (a.b - a.t) / Math.max(1, vals.length), cx = pl + pw / 2;
    vals.forEach((v, i) => {
        const bw = (v / max) * pw, y0 = a.t + band * i;
        ops.push({ op: 'rect', x: cx - bw / 2, y: y0 + band * 0.05, w: bw, h: band * 0.9, fill: color(spec, 0), series: i });
        if (spec.categories[i]) ops.push({ op: 'text', x: pl - fs * 0.4, y: y0 + band / 2, text: spec.categories[i], size: fs, align: 'right', baseline: 'middle', color: colors.muted });
        ops.push({ op: 'text', x: cx, y: y0 + band / 2, text: formatValue(v), size: fs, align: 'center', baseline: 'middle', color: '#ffffff' });
    });
}

/** Histogram: columns of the bins (or of category sums), touching. Pareto: sorted, with the cumulative share as a line on a 0–100 % axis. */
function histogram(spec: ChartexSpec, ops: ChartOp[], a: Area, fs: number, colors: ChartColors) {
    const s = spec.series[0];
    if (!s) return;
    let bins = spec.binning ? histogramBins(s.values.filter((v): v is number => v !== null), spec.binning) : byCategory(spec.categories, s.values);
    const pareto = spec.kind === 'pareto';
    if (pareto) bins = [...bins].sort((p, q) => q.count - p.count);
    const hi = Math.max(0, ...bins.map(b => b.count)), lo = Math.min(0, ...bins.map(b => b.count));
    const f = axisFrame(ops, bins.map(b => b.label), lo, hi, a, fs, colors, { pct: pareto });
    if (!f.ok) return;
    // Bins touch (Office's histogram gap is 0); category sums and Pareto bars keep a small gap.
    const pad = spec.binning && !pareto ? 0 : f.band * 0.08;
    bins.forEach((b, i) => {
        const y0 = f.vpos(Math.max(0, b.count)), y1 = f.vpos(Math.min(0, b.count));
        ops.push({ op: 'rect', x: f.plot.l + f.band * i + pad, y: y0, w: f.band - pad * 2, h: Math.max(0, y1 - y0), fill: color(spec, 0), stroke: pad ? undefined : '#ffffff', series: 0 });
        if (spec.dataLabels) ops.push({ op: 'text', x: f.plot.l + f.band * (i + 0.5), y: y0 - fs * 0.2, text: formatValue(b.count), size: fs * 0.9, align: 'center', baseline: 'bottom', color: colors.text });
    });
    if (pareto) {
        const total = bins.reduce((t, b) => t + Math.max(0, b.count), 0) || 1;
        let run = 0;
        const ph = f.plot.b - f.plot.t;
        const pts = bins.map((b, i) => { run += Math.max(0, b.count); return [f.plot.l + f.band * (i + 0.5), f.plot.b - (run / total) * ph] as [number, number]; });
        ops.push({ op: 'line', points: pts, stroke: color(spec, 1), width: Math.max(1.5, fs * 0.18), series: 1 });
        pts.forEach(([px, py]) => ops.push({ op: 'dot', x: px, y: py, r: Math.max(2, fs * 0.22), fill: color(spec, 1) }));
    }
    ops.push({ op: 'line', points: [[f.plot.l, f.zero], [f.plot.r, f.zero]], stroke: colors.axis, width: 1 });
}

/** Box & whisker: per category, a box from Q1 to Q3 per series, the median line, whiskers, the mean (×) and outliers. */
function boxes(spec: ChartexSpec, ops: ChartOp[], a: Area, fs: number, colors: ChartColors) {
    const groups: string[] = [];
    const catsOf = (s: ChartexSeries) => s.categories ?? spec.categories;
    for (const s of spec.series) s.values.forEach((_, i) => { const g = catsOf(s)[i] ?? ''; if (!groups.includes(g)) groups.push(g); });
    if (!groups.length) groups.push('');
    const stats = spec.series.map(s => groups.map(g => boxStats(s.values.filter((v, i): v is number => v !== null && (catsOf(s)[i] ?? '') === g), spec.inclusive)));
    let lo = Infinity, hi = -Infinity;
    for (const row of stats) for (const st of row) if (st) { lo = Math.min(lo, st.lo, ...st.outliers); hi = Math.max(hi, st.hi, ...st.outliers); }
    if (!Number.isFinite(lo)) return;
    const f = axisFrame(ops, groups, Math.min(0, lo), hi, a, fs, colors);
    if (!f.ok) return;
    const k = Math.max(1, spec.series.length), pad = f.band * 0.15, bw = (f.band - pad * 2) / k;
    stats.forEach((row, si) => row.forEach((st, gi) => {
        if (!st) return;
        const c = color(spec, si), x0 = f.plot.l + f.band * gi + pad + bw * si, xm = x0 + bw / 2, inset = bw * 0.12;
        ops.push({ op: 'line', points: [[xm, f.vpos(st.hi)], [xm, f.vpos(st.q3)]], stroke: colors.text, width: 1 });
        ops.push({ op: 'line', points: [[xm, f.vpos(st.q1)], [xm, f.vpos(st.lo)]], stroke: colors.text, width: 1 });
        for (const v of [st.hi, st.lo]) ops.push({ op: 'line', points: [[xm - bw * 0.2, f.vpos(v)], [xm + bw * 0.2, f.vpos(v)]], stroke: colors.text, width: 1 });
        const y0 = f.vpos(st.q3), y1 = f.vpos(st.q1);
        ops.push({ op: 'rect', x: x0 + inset, y: y0, w: bw - inset * 2, h: Math.max(1, y1 - y0), fill: c, stroke: c, series: si });
        ops.push({ op: 'line', points: [[x0 + inset, f.vpos(st.median)], [x0 + bw - inset, f.vpos(st.median)]], stroke: '#ffffff', width: 1.5 });
        const my = f.vpos(st.mean), mr = Math.max(2, fs * 0.25);
        ops.push({ op: 'line', points: [[xm - mr, my - mr], [xm + mr, my + mr]], stroke: '#ffffff', width: 1.5 });
        ops.push({ op: 'line', points: [[xm - mr, my + mr], [xm + mr, my - mr]], stroke: '#ffffff', width: 1.5 });
        for (const o of st.outliers) ops.push({ op: 'dot', x: xm, y: f.vpos(o), r: Math.max(2, fs * 0.2), fill: c, series: si });
    }));
    ops.push({ op: 'line', points: [[f.plot.l, f.zero], [f.plot.r, f.zero]], stroke: colors.axis, width: 1 });
}

/** Treemap: top-level groups squarified by their totals, each with a banner naming it, its children inside; a group keeps one colour. */
function treemap(spec: ChartexSpec, ops: ChartOp[], a: Area, fs: number) {
    const tree = buildTree(spec.categories, spec.levels ?? [], spec.series[0]?.values ?? []);
    const place = (nodes: TreeNode[], r: Rect, fill: (i: number) => string, depth: number) => {
        squarify(nodes.map(n => n.value), r).forEach((t, i) => {
            const n = nodes[i];
            if (!(t.w > 0 && t.h > 0)) return;
            const c = fill(i);
            if (n.children.length) {
                const banner = Math.min(t.h * 0.3, fs * 1.5);
                ops.push({ op: 'rect', x: t.x, y: t.y, w: t.w, h: t.h, fill: c, stroke: '#ffffff' });
                if (t.w > fs * 2) ops.push({ op: 'text', x: t.x + fs * 0.3, y: t.y + banner / 2, text: n.name, size: fs * 0.9, align: 'left', baseline: 'middle', color: '#ffffff', bold: true });
                place(n.children, { x: t.x + 1, y: t.y + banner, w: t.w - 2, h: t.h - banner - 1 }, () => lighten(c, 0.12 * (depth + 1)), depth + 1);
                return;
            }
            ops.push({ op: 'rect', x: t.x, y: t.y, w: t.w, h: t.h, fill: c, stroke: '#ffffff', series: i });
            if (t.w > fs * 2 && t.h > fs * 1.4) {
                ops.push({ op: 'text', x: t.x + fs * 0.3, y: t.y + fs * 0.3, text: n.name, size: fs * 0.9, align: 'left', baseline: 'top', color: '#ffffff' });
                if (spec.dataLabels && t.h > fs * 2.6) ops.push({ op: 'text', x: t.x + fs * 0.3, y: t.y + fs * 1.4, text: formatValue(n.value), size: fs * 0.9, align: 'left', baseline: 'top', color: '#ffffff' });
            }
        });
    };
    place(tree, { x: a.l, y: a.t, w: a.r - a.l, h: a.b - a.t }, i => color(spec, i), 0);
}

/** Sunburst: a ring per level from the centre out, each node's sweep its share; a branch keeps its top-level colour, lighter outward. */
function sunburst(spec: ChartexSpec, ops: ChartOp[], a: Area, fs: number) {
    const tree = buildTree(spec.categories, spec.levels ?? [], spec.series[0]?.values ?? []);
    const depthOf = (ns: TreeNode[]): number => (ns.length ? 1 + Math.max(...ns.map(n => depthOf(n.children))) : 0);
    const levels = Math.max(1, depthOf(tree));
    const cx = (a.l + a.r) / 2, cy = (a.t + a.b) / 2;
    const R = Math.max(fs, Math.min(a.r - a.l, a.b - a.t) / 2 * 0.95), hole = R * 0.12, ring = (R - hole) / levels;
    const total = tree.reduce((t, n) => t + n.value, 0);
    if (!(total > 0)) return;
    const draw = (nodes: TreeNode[], a0: number, sweep: number, depth: number, base: string | null) => {
        const sum = nodes.reduce((t, n) => t + n.value, 0) || 1;
        let at = a0;
        nodes.forEach((n, i) => {
            const s = (n.value / sum) * sweep, c = base ? lighten(base, 0.18 * depth) : color(spec, i);
            const inner = hole + ring * depth, outer = inner + ring;
            ops.push({ op: 'wedge', cx, cy, r: outer, inner, a0: at, a1: at + s, fill: c, series: i });
            if (s * ((inner + outer) / 2) > fs * 2.5 && ring > fs * 1.2) {
                const mid = at + s / 2, rr = (inner + outer) / 2;
                ops.push({ op: 'text', x: cx + Math.cos(mid) * rr, y: cy + Math.sin(mid) * rr, text: n.name, size: fs * 0.85, align: 'center', baseline: 'middle', color: '#ffffff' });
            }
            if (n.children.length) draw(n.children, at, s, depth + 1, base ?? c);
            at += s;
        });
    };
    draw(tree, -Math.PI / 2, Math.PI * 2, 0, null);
}

/** A plain-text summary of the data, for the chart's alt text (the drawing itself has no data). */
export function chartexSummary(spec: ChartexSpec): string {
    const names: Record<ChartexKind, string> = { waterfall: 'Waterfall', funnel: 'Funnel', histogram: 'Histogram', pareto: 'Pareto', boxWhisker: 'Box and whisker', treemap: 'Treemap', sunburst: 'Sunburst' };
    const head = `${names[spec.kind]} chart${spec.title ? `: ${spec.title}` : ''}.`;
    const rows = spec.series.map(s => {
        const cats = s.categories ?? spec.categories;
        const pts = s.values.map((v, i) => (v === null ? null : `${cats[i] || i + 1} ${v}`)).filter(Boolean).slice(0, 200);
        return `${s.name ? s.name + ': ' : ''}${pts.join(', ')}`;
    });
    return [head, ...rows].join(' ').slice(0, 4000);
}
