/**
 * Coordinate systems and function plotting — manim's `Axes` / `get_graph`.
 *
 * The gap this closes: Yappy could always DRAW a curve (`createPath` takes arbitrary
 * points), but nothing owned the unit→pixel mapping, so every plot meant hand-writing
 * the arithmetic — ~25 lines and 19 elements for one `sin(x)`. An `AxesSpec` is that
 * mapping, kept as a PLAIN serialisable object (no closures) so it survives the embed
 * bridge and can be stored in a document.
 *
 * Sampling is uniform in the parameter, with non-finite samples (poles, domain errors)
 * splitting the curve into separate subpaths rather than drawing a spike through them.
 */

/** A coordinate system: the plain-data result of `Yappy.plot.axes(...)`. */
export interface AxesSpec {
    /** Pixel position of the coordinate origin (0, 0). */
    ox: number;
    oy: number;
    /** Pixels per unit on each axis. */
    sx: number;
    sy: number;
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    /** Ids of the elements drawn for the axes (lines, ticks, labels). */
    elementIds: string[];
}

export interface AxesOptions {
    /** Pixel position of the origin. Defaults to a comfortable spot on a 960×640 page. */
    ox?: number;
    oy?: number;
    /** Pixels per unit. */
    sx?: number;
    sy?: number;
    xMin?: number;
    xMax?: number;
    yMin?: number;
    yMax?: number;
    /** Draw tick marks. Default true. */
    ticks?: boolean;
    /** Draw numeric labels under/beside the ticks. Default true. */
    labels?: boolean;
    /** Unit step between ticks. Default 1. */
    step?: number;
    color?: string;
    labelColor?: string;
    fontSize?: number;
}

export type PlotFn = (x: number) => number;

/** Accepts a real function or a string body in `x` (so it can cross postMessage). */
export function toFn(fn: PlotFn | string, param = 'x'): PlotFn {
    if (typeof fn === 'function') return fn;
    // eslint-disable-next-line no-new-func
    const compiled = new Function(param, `"use strict"; return (${fn});`) as PlotFn;
    return compiled;
}

/** Coordinates → pixels. manim's `axes.c2p(x, y)`. */
export function toPixel(axes: AxesSpec, x: number, y: number): { x: number; y: number } {
    return { x: axes.ox + x * axes.sx, y: axes.oy - y * axes.sy };
}

/** Pixels → coordinates (inverse of `toPixel`), for hit-testing and readouts. */
export function toCoords(axes: AxesSpec, px: number, py: number): { x: number; y: number } {
    return { x: (px - axes.ox) / axes.sx, y: (axes.oy - py) / axes.sy };
}

/**
 * Sample `fn` across `[from, to]` into pixel-space subpaths.
 *
 * Splits on any non-finite value (1/x at 0, sqrt of a negative, tan's poles) and on
 * samples far outside the axes' y-range, so a pole becomes a gap instead of a near-
 * vertical spike joining +∞ to −∞.
 */
export function samplePoints(
    axes: AxesSpec,
    fn: PlotFn,
    from: number,
    to: number,
    samples: number,
): { x: number; y: number }[][] {
    const out: { x: number; y: number }[][] = [];
    let run: { x: number; y: number }[] = [];
    const span = to - from;
    const n = Math.max(2, Math.floor(samples));
    // Generous clamp: keep points that are merely off-canvas, cut the true blow-ups.
    const yLimit = Math.abs(axes.yMax - axes.yMin) * 10 + 1000;

    for (let i = 0; i <= n; i++) {
        const x = from + (span * i) / n;
        let y: number;
        try {
            y = fn(x);
        } catch {
            y = NaN;
        }
        if (!Number.isFinite(y) || Math.abs(y) > yLimit) {
            if (run.length > 1) out.push(run);
            run = [];
            continue;
        }
        run.push(toPixel(axes, x, y));
    }
    if (run.length > 1) out.push(run);
    return out;
}

/** Sample a parametric pair (fx(t), fy(t)) the same way. */
export function sampleParametric(
    axes: AxesSpec,
    fx: PlotFn,
    fy: PlotFn,
    from: number,
    to: number,
    samples: number,
): { x: number; y: number }[][] {
    const out: { x: number; y: number }[][] = [];
    let run: { x: number; y: number }[] = [];
    const span = to - from;
    const n = Math.max(2, Math.floor(samples));

    for (let i = 0; i <= n; i++) {
        const t = from + (span * i) / n;
        let px: number, py: number;
        try {
            px = fx(t);
            py = fy(t);
        } catch {
            px = NaN;
            py = NaN;
        }
        if (!Number.isFinite(px) || !Number.isFinite(py)) {
            if (run.length > 1) out.push(run);
            run = [];
            continue;
        }
        run.push(toPixel(axes, px, py));
    }
    if (run.length > 1) out.push(run);
    return out;
}

/** Tick positions for one axis, excluding the origin. */
export function tickValues(min: number, max: number, step: number): number[] {
    const out: number[] = [];
    if (!(step > 0)) return out;
    const start = Math.ceil(min / step) * step;
    for (let v = start; v <= max + 1e-9; v += step) {
        // Round away float drift so labels read "0.3", not "0.30000000000000004".
        const r = Math.abs(v) < 1e-9 ? 0 : Number(v.toFixed(6));
        if (r !== 0) out.push(r);
    }
    return out;
}

/** Resolve `AxesOptions` to a fully-populated spec (minus the element ids). */
export function resolveAxes(options: AxesOptions = {}): Omit<AxesSpec, 'elementIds'> {
    const xMin = options.xMin ?? -4;
    const xMax = options.xMax ?? 4;
    const yMin = options.yMin ?? -3;
    const yMax = options.yMax ?? 3;
    return {
        ox: options.ox ?? 480,
        oy: options.oy ?? 340,
        sx: options.sx ?? 70,
        sy: options.sy ?? 70,
        xMin,
        xMax,
        yMin,
        yMax,
    };
}
