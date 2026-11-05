/**
 * Path operations and the shape builders that turn WMF/EMF rectangles, ellipses and arcs into
 * cubic Béziers (the classic 4/3·tan(Δ/4) approximation, at most 90° per piece). Ported from
 * DeckCraft's `crates/metafile/src/geom.rs` (MIT/Apache).
 */
import type { P } from './bytes';

export type Op =
    | { k: 'M'; p: P }
    | { k: 'L'; p: P }
    | { k: 'C'; a: P; b: P; p: P }
    | { k: 'Z' };

export const M = (p: P): Op => ({ k: 'M', p });
export const L = (p: P): Op => ({ k: 'L', p });
export const C = (a: P, b: P, p: P): Op => ({ k: 'C', a, b, p });
export const Z: Op = { k: 'Z' };

const TAU = Math.PI * 2;
const HALF_PI = Math.PI / 2;

/** Euclidean remainder (always non-negative for a positive divisor), as Rust's `rem_euclid`. */
export function remEuclid(a: number, b: number): number {
    const r = a % b;
    return r < 0 ? r + Math.abs(b) : r;
}

export function rect(l: number, t: number, r: number, b: number): Op[] {
    return [M([l, t]), L([r, t]), L([r, b]), L([l, b]), Z];
}

/** Corner radii are half the EMF/WMF corner ellipse size, clamped so the corners never overlap. */
export function roundRect(l0: number, t0: number, r0: number, b0: number, ew: number, eh: number): Op[] {
    // Reversed corners (right < left, bottom < top) describe the same rectangle.
    const l = Math.min(l0, r0), r = Math.max(l0, r0);
    const t = Math.min(t0, b0), b = Math.max(t0, b0);
    const rx = Math.min(Math.abs(ew / 2), (r - l) / 2);
    const ry = Math.min(Math.abs(eh / 2), (b - t) / 2);
    return [
        M([l + rx, t]), L([r - rx, t]),
        ...arc(r - rx, t + ry, rx, ry, -HALF_PI, HALF_PI),
        L([r, b - ry]),
        ...arc(r - rx, b - ry, rx, ry, 0, HALF_PI),
        L([l + rx, b]),
        ...arc(l + rx, b - ry, rx, ry, HALF_PI, HALF_PI),
        L([l, t + ry]),
        ...arc(l + rx, t + ry, rx, ry, Math.PI, HALF_PI),
        Z,
    ];
}

export function ellipse(l: number, t: number, r: number, b: number): Op[] {
    const [cx, cy, rx, ry] = center(l, t, r, b);
    return [M([cx + rx, cy]), ...arc(cx, cy, rx, ry, 0, TAU), Z];
}

/** Which closed or open shape an ARC/CHORD/PIE record draws. */
export type ArcKind = 'arc' | 'chord' | 'pie';

/**
 * ARC, CHORD and PIE: the arc runs counter-clockwise on screen from the start point to the end
 * point, or clockwise after SETARCDIRECTION(AD_CLOCKWISE).
 */
export function arcShape(l: number, t: number, r: number, b: number, s: P, e: P, kind: ArcKind, clockwise = false): Op[] {
    const [cx, cy, rx, ry] = center(l, t, r, b);
    const ang = (p: P) => Math.atan2((p[1] - cy) / Math.max(ry, Number.MIN_VALUE), (p[0] - cx) / Math.max(rx, Number.MIN_VALUE));
    const a0 = ang(s), a1 = ang(e);
    let d = remEuclid(clockwise ? a1 - a0 : a0 - a1, TAU);
    if (d < 1e-12) d = TAU;
    const sweep = clockwise ? d : -d;
    const start: P = [cx + rx * Math.cos(a0), cy + ry * Math.sin(a0)];
    const ops: Op[] = kind === 'pie' ? [M([cx, cy]), L(start)] : [M(start)];
    ops.push(...arc(cx, cy, rx, ry, a0, sweep));
    if (kind === 'chord') ops.push(Z);
    else if (kind === 'pie') ops.push(L([cx, cy]), Z);
    return ops;
}

function center(l: number, t: number, r: number, b: number): [number, number, number, number] {
    return [(l + r) / 2, (t + b) / 2, Math.abs(r - l) / 2, Math.abs(b - t) / 2];
}

/**
 * Cubic pieces along an ellipse from parameter `a0` over signed `sweep` radians. The current point
 * must already be at `(cx + rx cos a0, cy + ry sin a0)`.
 */
export function arc(cx: number, cy: number, rx: number, ry: number, a0: number, sweep: number): Op[] {
    const n = Math.min(8, Math.max(1, Math.ceil(Math.abs(sweep) / HALF_PI)));
    const step = sweep / n;
    const k = (4 / 3) * Math.tan(step / 4);
    const pt = (t: number): P => [cx + rx * Math.cos(t), cy + ry * Math.sin(t)];
    const ops: Op[] = [];
    for (let i = 0; i < n; i++) {
        const t0 = a0 + step * i;
        const t1 = t0 + step;
        const p0 = pt(t0), p3 = pt(t1);
        const c1: P = [p0[0] - k * rx * Math.sin(t0), p0[1] + k * ry * Math.cos(t0)];
        const c2: P = [p3[0] + k * rx * Math.sin(t1), p3[1] - k * ry * Math.cos(t1)];
        ops.push(C(c1, c2, p3));
    }
    return ops;
}

/**
 * Consecutive subpaths: `counts[i]` points each, taken in order from `pts`. Counts that run past the
 * point list are cut short rather than failing the whole record.
 */
export function subpaths(pts: P[], counts: number[], close: boolean): Op[] {
    const ops: Op[] = [];
    let at = 0;
    for (const c of counts) {
        const end = Math.min(at + c, pts.length);
        if (end > at) {
            ops.push(M(pts[at]));
            for (let i = at + 1; i < end; i++) ops.push(L(pts[i]));
            if (close) ops.push(Z);
        }
        at = end;
    }
    return ops;
}
