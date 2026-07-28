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

/** How an axis maps values to distance. */
export type AxisScale = 'linear' | 'log';

/** A coordinate system: the plain-data result of `Yappy.plot.axes(...)`. */
export interface AxesSpec {
    /**
     * Pixel position of each axis's *reference* value: 0 on a linear axis, `xMin`/`yMin`
     * on a log axis (a log axis has no zero). `toPixel`/`toCoords` handle the difference —
     * don't do the arithmetic by hand.
     */
    ox: number;
    oy: number;
    /** Pixels per unit — or, on a log axis, pixels per DECADE. */
    sx: number;
    sy: number;
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    /** Scale of each axis. Absent means 'linear' (older specs stay valid). */
    xScale?: AxisScale;
    yScale?: AxisScale;
    /** Ids of the elements drawn for the axes (lines, ticks, labels). */
    elementIds: string[];
}

export interface AxesOptions {
    /** Pixel position of the reference value (0, or the min on a log axis). */
    ox?: number;
    oy?: number;
    /** Pixels per unit — or pixels per decade on a log axis. */
    sx?: number;
    sy?: number;
    xMin?: number;
    xMax?: number;
    yMin?: number;
    yMax?: number;
    /**
     * Axis scaling. `scale` sets both; `xScale`/`yScale` override per axis — a
     * semi-log plot is `{ yScale: 'log' }`.
     *
     * A log axis needs a strictly positive range: `{ yScale: 'log', yMin: 0.1, yMax: 1000 }`.
     * A non-positive min is clamped to a small positive value rather than producing NaN.
     */
    scale?: AxisScale;
    xScale?: AxisScale;
    yScale?: AxisScale;
    /** Draw tick marks. Default true. */
    ticks?: boolean;
    /** Draw numeric labels under/beside the ticks. Default true. */
    labels?: boolean;
    /** Unit step between ticks (linear axes only; log axes tick per decade). Default 1. */
    step?: number;
    /** Log axes: also mark 2…9 within each decade, unlabelled. Default true. */
    minorTicks?: boolean;
    color?: string;
    labelColor?: string;
    fontSize?: number;
}

/** Smallest value a log axis will accept, so a 0 or negative bound can't produce NaN. */
const LOG_FLOOR = 1e-12;

const log10 = (v: number) => Math.log10(Math.max(v, LOG_FLOOR));

/**
 * Distance in pixels from an axis's reference position to `value`.
 * Linear: proportional to the value. Log: proportional to decades above the min.
 */
export function axisOffset(value: number, min: number, pxPerUnit: number, scale: AxisScale | undefined): number {
    return scale === 'log'
        ? (log10(value) - log10(min)) * pxPerUnit
        : value * pxPerUnit;
}

/** Inverse of `axisOffset`. */
export function axisValue(offset: number, min: number, pxPerUnit: number, scale: AxisScale | undefined): number {
    return scale === 'log'
        ? Math.pow(10, offset / pxPerUnit + log10(min))
        : offset / pxPerUnit;
}

export type PlotFn = (x: number) => number;

/** A vector field: (x, y) → [dx, dy] in coordinate units. */
export type VectorFn = (x: number, y: number) => [number, number];

export interface VectorFieldOptions {
    /** Grid spacing in coordinate units. Default 1. */
    step?: number;
    /** Length of the LONGEST arrow, in coordinate units; the rest scale proportionally. */
    maxLength?: number;
}

/**
 * Normalise the two call shapes into one vector function:
 *   `toVectorFn(fn)`           — fn returns [dx, dy]
 *   `toVectorFn(fxSrc, fySrc)` — two scalar functions/strings in x and y
 * String bodies get `x` and `y` in scope so fields can be driven over the embed bridge.
 */
export function toVectorFn(fx: VectorFn | PlotFn | string, fy?: VectorFn | PlotFn | string): VectorFn {
    // Same two string shapes as `toFn`: an expression body, or a whole arrow function.
    const compile = (src: VectorFn | PlotFn | string) => {
        if (typeof src === 'function') return src as (x: number, y: number) => unknown;
        // eslint-disable-next-line no-new-func
        const c = new Function('x', 'y', `"use strict"; return (${src});`) as (x: number, y: number) => unknown;
        return (x: number, y: number) => {
            const out = c(x, y);
            return typeof out === 'function' ? (out as (x: number, y: number) => unknown)(x, y) : out;
        };
    };

    if (fy === undefined) {
        const f = compile(fx);
        return (x, y) => {
            const v = f(x, y);
            return Array.isArray(v) ? [Number(v[0]), Number(v[1])] : [NaN, NaN];
        };
    }
    const a = compile(fx);
    const b = compile(fy);
    return (x, y) => [Number(a(x, y)), Number(b(x, y))];
}

/**
 * Accepts a real function or a string (so plots can cross postMessage, where functions
 * can't go). Both string shapes work, because both are natural to write:
 *
 *   `'Math.sin(x)'`   — an expression body in the parameter
 *   `'x => Math.sin(x)'` — a whole arrow function
 *
 * The second compiles to a function that *returns a function*; calling through once
 * collapses that, so the caller doesn't have to care which form was used.
 */
export function toFn(fn: PlotFn | string, param = 'x'): PlotFn {
    if (typeof fn === 'function') return fn;
    // eslint-disable-next-line no-new-func
    const compiled = new Function(param, `"use strict"; return (${fn});`) as (v: number) => unknown;
    return (v: number) => {
        const out = compiled(v);
        return typeof out === 'function' ? (out as PlotFn)(v) : (out as number);
    };
}

/** Coordinates → pixels. manim's `axes.c2p(x, y)`. Handles log axes. */
export function toPixel(axes: AxesSpec, x: number, y: number): { x: number; y: number } {
    return {
        x: axes.ox + axisOffset(x, axes.xMin, axes.sx, axes.xScale),
        y: axes.oy - axisOffset(y, axes.yMin, axes.sy, axes.yScale),
    };
}

/** Pixels → coordinates (inverse of `toPixel`), for hit-testing and readouts. */
export function toCoords(axes: AxesSpec, px: number, py: number): { x: number; y: number } {
    return {
        x: axisValue(px - axes.ox, axes.xMin, axes.sx, axes.xScale),
        y: axisValue(axes.oy - py, axes.yMin, axes.sy, axes.yScale),
    };
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
    // On a log x-axis, step GEOMETRICALLY. Uniform steps would crowd almost every
    // sample into the last decade — where the axis is most compressed — and leave the
    // first decades drawn from two or three points.
    const logX = axes.xScale === 'log' && from > 0 && to > 0;
    const ratio = logX ? Math.pow(to / from, 1 / n) : 1;

    for (let i = 0; i <= n; i++) {
        const x = logX ? from * Math.pow(ratio, i) : from + (span * i) / n;
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

/** Tick positions for one LINEAR axis, excluding the origin. */
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

/**
 * Tick positions for a LOG axis: one per decade (…0.1, 1, 10, 100…), plus the
 * unlabelled 2…9 within each decade when `minor` is set — the classic log-paper look
 * that makes it obvious at a glance the axis isn't linear.
 */
export function logTickValues(min: number, max: number, minor = true): { value: number; major: boolean }[] {
    const out: { value: number; major: boolean }[] = [];
    const lo = Math.floor(log10(min));
    const hi = Math.ceil(log10(max));
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi - lo > 24) return out;   // sanity cap
    for (let d = lo; d <= hi; d++) {
        const decade = Math.pow(10, d);
        if (decade >= min - 1e-12 && decade <= max + 1e-12) out.push({ value: decade, major: true });
        if (!minor) continue;
        for (let m = 2; m <= 9; m++) {
            const v = decade * m;
            if (v >= min - 1e-12 && v <= max + 1e-12) out.push({ value: v, major: false });
        }
    }
    return out;
}

/** Format a log tick so 0.001 reads as "0.001" and 1e6 as "1e+6" rather than a long decimal. */
export function formatTick(v: number): string {
    if (v === 0) return '0';
    const abs = Math.abs(v);
    if (abs >= 1e5 || abs < 1e-3) return v.toExponential(0).replace('e', 'e');
    return String(Number(v.toPrecision(6)));
}

/** Resolve `AxesOptions` to a fully-populated spec (minus the element ids). */
export function resolveAxes(options: AxesOptions = {}): Omit<AxesSpec, 'elementIds'> {
    const xScale: AxisScale = options.xScale ?? options.scale ?? 'linear';
    const yScale: AxisScale = options.yScale ?? options.scale ?? 'linear';
    // A log axis has no zero, so its default range is a few decades starting at 1, and a
    // caller-supplied non-positive bound is clamped rather than silently producing NaN.
    const clampPositive = (v: number, fallback: number) => (v > 0 ? v : fallback);

    const xMin = xScale === 'log' ? clampPositive(options.xMin ?? 1, 1) : (options.xMin ?? -4);
    const xMax = xScale === 'log' ? clampPositive(options.xMax ?? 1000, 1000) : (options.xMax ?? 4);
    const yMin = yScale === 'log' ? clampPositive(options.yMin ?? 1, 1) : (options.yMin ?? -3);
    const yMax = yScale === 'log' ? clampPositive(options.yMax ?? 1000, 1000) : (options.yMax ?? 3);

    return {
        ox: options.ox ?? 480,
        oy: options.oy ?? 340,
        // On a log axis the unit is a DECADE, so the linear default (70 px) would give a
        // cramped plot; 110 px per decade reads better.
        sx: options.sx ?? (xScale === 'log' ? 110 : 70),
        sy: options.sy ?? (yScale === 'log' ? 110 : 70),
        xMin,
        xMax,
        yMin,
        yMax,
        xScale,
        yScale,
    };
}
