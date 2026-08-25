/**
 * The box a shape's geometry actually occupies — which is not always the box the element
 * declares.
 *
 * Most shapes fit their own bounds (`shape-box-fit.test.ts` is the gate that keeps them
 * there), but a few are outside on purpose: a puzzle piece whose tabs stopped at the box
 * would not interlock with the piece beside it, and a 3D solid's extruded depth is drawn
 * beside the front face the box describes.
 *
 * That mattered because the buffer-backed fills — pattern, mesh, image, inflate — rasterise
 * a buffer the size of the ELEMENT and clip it to the OUTLINE. Where the outline reaches
 * past the element, the buffer has already run out, and the fill stops in a dead straight
 * line at the box edge. That is bug #322 (a cloud), and after #326 fixed nine shapes it was
 * still live for the shapes that overflow deliberately. Sizing the buffer from here instead
 * of from `width` x `height` makes intentional overflow safe rather than merely documented.
 *
 * Solved analytically — curve extrema from the derivative's roots, arc extrema from the
 * parametric angles where the tangent goes axis-aligned. Sampling would be simpler and would
 * *under*-estimate, which in this use is the one error that clips artwork. The tests measure
 * the same shapes by flattening instead, so the two disagree loudly rather than quietly.
 */
import type { ShapeGeometry } from './shape-geometry';

export interface Extent { minX: number; minY: number; maxX: number; maxY: number; }

const TAU = Math.PI * 2;

class Acc {
    minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
    add(x: number, y: number) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        if (x < this.minX) this.minX = x;
        if (x > this.maxX) this.maxX = x;
        if (y < this.minY) this.minY = y;
        if (y > this.maxY) this.maxY = y;
    }
    get result(): Extent | null {
        return Number.isFinite(this.minX)
            ? { minX: this.minX, minY: this.minY, maxX: this.maxX, maxY: this.maxY }
            : null;
    }
}

/** Roots of a quadratic in [0,1] — the derivative of a cubic Bezier component. */
function quadRoots(a: number, b: number, c: number): number[] {
    const out: number[] = [];
    if (Math.abs(a) < 1e-12) {
        if (Math.abs(b) > 1e-12) out.push(-c / b);
    } else {
        const disc = (b * b) - (4 * a * c);
        if (disc >= 0) {
            const r = Math.sqrt(disc);
            out.push((-b + r) / (2 * a), (-b - r) / (2 * a));
        }
    }
    return out.filter(t => t > 0 && t < 1);
}

const cubicAt = (p0: number, p1: number, p2: number, p3: number, t: number) => {
    const u = 1 - t;
    return (u * u * u * p0) + (3 * u * u * t * p1) + (3 * u * t * t * p2) + (t * t * t * p3);
};
const quadAt = (p0: number, p1: number, p2: number, t: number) => {
    const u = 1 - t;
    return (u * u * p0) + (2 * u * t * p1) + (t * t * p2);
};

/** Extrema of a cubic Bezier: the endpoints, plus wherever the derivative crosses zero. */
function addCubic(acc: Acc, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
    acc.add(x0, y0); acc.add(x3, y3);
    // B'(t) = 3[(-p0 + 3p1 - 3p2 + p3)t^2 + 2(p0 - 2p1 + p2)t + (p1 - p0)]
    for (const [a0, a1, a2, a3, isX] of [[x0, x1, x2, x3, true], [y0, y1, y2, y3, false]] as const) {
        const A = (-a0) + (3 * a1) - (3 * a2) + a3;
        const B = 2 * (a0 - (2 * a1) + a2);
        const C = a1 - a0;
        for (const t of quadRoots(A, B, C)) {
            if (isX) acc.add(cubicAt(x0, x1, x2, x3, t), cubicAt(y0, y1, y2, y3, t));
            else acc.add(cubicAt(x0, x1, x2, x3, t), cubicAt(y0, y1, y2, y3, t));
        }
    }
}

/** Extrema of a quadratic Bezier: the endpoints, plus the single derivative root per axis. */
function addQuad(acc: Acc, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
    acc.add(x0, y0); acc.add(x2, y2);
    for (const [a0, a1, a2] of [[x0, x1, x2], [y0, y1, y2]] as const) {
        const den = a0 - (2 * a1) + a2;
        if (Math.abs(den) < 1e-12) continue;
        const t = (a0 - a1) / den;
        if (t > 0 && t < 1) acc.add(quadAt(x0, x1, x2, t), quadAt(y0, y1, y2, t));
    }
}

/**
 * Extrema of an elliptical arc, including the x-axis-rotation and the spec's radius
 * correction (F.6.6) for a chord the ellipse cannot span.
 *
 * A ROTATED ellipse does not reach its extremes at the axis angles — this is the detail that
 * a first pass at this always misses. They are where the parametric derivative vanishes:
 * `tan(theta_x) = -(ry/rx)·tan(phi)` and `tan(theta_y) = (ry/rx)·cot(phi)`, each giving two
 * angles half a turn apart. Only those inside the arc's own sweep count.
 */
function addArc(acc: Acc, x1: number, y1: number, rxIn: number, ryIn: number, phiDeg: number, fA: number, fS: number, x2: number, y2: number) {
    acc.add(x1, y1); acc.add(x2, y2);
    let rx = Math.abs(rxIn), ry = Math.abs(ryIn);
    if (rx === 0 || ry === 0) return; // degenerate: a straight line, endpoints already in

    const phi = (phiDeg * Math.PI) / 180;
    const cosP = Math.cos(phi), sinP = Math.sin(phi);

    const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
    const x1p = (cosP * dx) + (sinP * dy);
    const y1p = (-sinP * dx) + (cosP * dy);

    const lam = ((x1p * x1p) / (rx * rx)) + ((y1p * y1p) / (ry * ry));
    if (lam > 1) { const k = Math.sqrt(lam); rx *= k; ry *= k; }

    const num = (rx * rx * ry * ry) - (rx * rx * y1p * y1p) - (ry * ry * x1p * x1p);
    const den = (rx * rx * y1p * y1p) + (ry * ry * x1p * x1p);
    const co = den === 0 ? 0 : Math.sqrt(Math.max(0, num / den)) * (fA !== fS ? 1 : -1);
    const cxp = co * ((rx * y1p) / ry);
    const cyp = co * (-(ry * x1p) / rx);
    const cx = (cosP * cxp) - (sinP * cyp) + ((x1 + x2) / 2);
    const cy = (sinP * cxp) + (cosP * cyp) + ((y1 + y2) / 2);

    const ux = (x1p - cxp) / rx, uy = (y1p - cyp) / ry;
    const vx = (-x1p - cxp) / rx, vy = (-y1p - cyp) / ry;
    const theta1 = Math.atan2(uy, ux);
    let delta = Math.atan2((ux * vy) - (uy * vx), (ux * vx) + (uy * vy));
    if (fS === 0 && delta > 0) delta -= TAU;
    if (fS === 1 && delta < 0) delta += TAU;

    const at = (t: number): [number, number] => {
        const c = Math.cos(t), s = Math.sin(t);
        return [(cosP * rx * c) - (sinP * ry * s) + cx, (sinP * rx * c) + (cosP * ry * s) + cy];
    };
    /** Is `t` on the swept part of the ellipse? */
    const onArc = (t: number) => {
        let d = (t - theta1) % TAU;
        if (delta >= 0) { if (d < 0) d += TAU; return d <= delta + 1e-9; }
        if (d > 0) d -= TAU;
        return d >= delta - 1e-9;
    };

    const thetaX = Math.atan2(-ry * sinP, rx * cosP);
    const thetaY = Math.atan2(ry * cosP, rx * sinP);
    for (const t of [thetaX, thetaX + Math.PI, thetaY, thetaY + Math.PI]) {
        if (onArc(t)) { const [px, py] = at(t); acc.add(px, py); }
    }
}

/** Accumulate the extent of an SVG path `d` (absolute and relative, with smooth curves). */
function addPath(acc: Acc, d: string) {
    const toks = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) ?? [];
    let i = 0, cx = 0, cy = 0, sx = 0, sy = 0, cmd = '';
    let lastC: [number, number] | null = null, lastQ: [number, number] | null = null;
    const n = () => parseFloat(toks[i++]);

    while (i < toks.length) {
        if (/[A-Za-z]/.test(toks[i])) cmd = toks[i++];
        if (i >= toks.length && cmd.toUpperCase() !== 'Z') break;
        const rel = cmd === cmd.toLowerCase();
        const C = cmd.toUpperCase();
        const R = (x: number, y: number): [number, number] => (rel ? [cx + x, cy + y] : [x, y]);

        if (C === 'M') {
            const [x, y] = R(n(), n()); acc.add(x, y);
            cx = x; cy = y; sx = x; sy = y; cmd = rel ? 'l' : 'L'; lastC = lastQ = null;
        } else if (C === 'L') {
            const [x, y] = R(n(), n()); acc.add(x, y); cx = x; cy = y; lastC = lastQ = null;
        } else if (C === 'H') {
            const x = rel ? cx + n() : n(); acc.add(x, cy); cx = x; lastC = lastQ = null;
        } else if (C === 'V') {
            const y = rel ? cy + n() : n(); acc.add(cx, y); cy = y; lastC = lastQ = null;
        } else if (C === 'C') {
            const a = R(n(), n()), b = R(n(), n()), e = R(n(), n());
            addCubic(acc, cx, cy, a[0], a[1], b[0], b[1], e[0], e[1]);
            lastC = b; lastQ = null; cx = e[0]; cy = e[1];
        } else if (C === 'S') {
            const b = R(n(), n()), e = R(n(), n());
            const a: [number, number] = lastC ? [(2 * cx) - lastC[0], (2 * cy) - lastC[1]] : [cx, cy];
            addCubic(acc, cx, cy, a[0], a[1], b[0], b[1], e[0], e[1]);
            lastC = b; lastQ = null; cx = e[0]; cy = e[1];
        } else if (C === 'Q') {
            const a = R(n(), n()), e = R(n(), n());
            addQuad(acc, cx, cy, a[0], a[1], e[0], e[1]);
            lastQ = a; lastC = null; cx = e[0]; cy = e[1];
        } else if (C === 'T') {
            const e = R(n(), n());
            const a: [number, number] = lastQ ? [(2 * cx) - lastQ[0], (2 * cy) - lastQ[1]] : [cx, cy];
            addQuad(acc, cx, cy, a[0], a[1], e[0], e[1]);
            lastQ = a; lastC = null; cx = e[0]; cy = e[1];
        } else if (C === 'A') {
            const rx = n(), ry = n(), rot = n(), fA = n(), fS = n();
            const e = R(n(), n());
            addArc(acc, cx, cy, rx, ry, rot, fA, fS, e[0], e[1]);
            cx = e[0]; cy = e[1]; lastC = lastQ = null;
        } else if (C === 'Z') {
            acc.add(sx, sy); cx = sx; cy = sy; lastC = lastQ = null;
        } else {
            i++; // an unrecognised token would otherwise spin here forever
        }
    }
}

function walk(acc: Acc, geo: ShapeGeometry | null | undefined) {
    if (!geo) return;
    switch (geo.type) {
        case 'path': addPath(acc, geo.path); break;
        case 'rect':
            acc.add(geo.x, geo.y);
            acc.add(geo.x + geo.w, geo.y + geo.h);
            break;
        case 'ellipse':
            acc.add(geo.cx - Math.abs(geo.rx), geo.cy - Math.abs(geo.ry));
            acc.add(geo.cx + Math.abs(geo.rx), geo.cy + Math.abs(geo.ry));
            break;
        case 'points':
            for (const p of geo.points ?? []) acc.add(p.x, p.y);
            break;
        case 'multi':
            for (const s of geo.shapes ?? []) walk(acc, s);
            break;
    }
}

/** The box a geometry occupies, in the element's centre-local frame. Null when empty. */
export function geometryExtent(geo: ShapeGeometry | null | undefined): Extent | null {
    const acc = new Acc();
    walk(acc, geo);
    return acc.result;
}

/**
 * The rect a buffer-backed fill should cover: the element's own box, grown to include
 * anything the geometry draws outside it.
 *
 * Never *smaller* than the element — a shape that sits well inside its box keeps a
 * full-size buffer, so pattern scale and phase do not jump around as a shape is edited.
 * Only overflow grows it, and only by as much as the overflow.
 */
export function fillBufferRect(geo: ShapeGeometry | null | undefined, w: number, h: number): { x: number; y: number; w: number; h: number } {
    const box = { x: -w / 2, y: -h / 2, w, h };
    const e = geometryExtent(geo);
    if (!e) return box;
    // Sub-pixel overflow does not need a bigger buffer — it is below what the fill can
    // express, and the clip's own antialiasing covers it. Without this slack the rounding in
    // an emitted path (three decimal places) grows the buffer by a ten-thousandth of a pixel
    // and every shape gets a very slightly odd-sized one.
    const SLACK = 0.5;
    // Grow only when the overflow is worth growing for — and then grow ALL the way to it.
    // Trimming the slack off a genuine overflow would leave the buffer just short of the
    // artwork, which is the bug this exists to fix, in miniature.
    const lo = (edge: number, ext: number) => (edge - ext > SLACK ? ext : edge);
    const hi = (edge: number, ext: number) => (ext - edge > SLACK ? ext : edge);
    const minX = lo(-w / 2, e.minX), maxX = hi(w / 2, e.maxX);
    const minY = lo(-h / 2, e.minY), maxY = hi(h / 2, e.maxY);
    const bw = maxX - minX, bh = maxY - minY;
    if (!(bw > 0) || !(bh > 0)) return box;
    // A shape that reports an absurd extent (a malformed path, a NaN slipping through) must
    // not turn into a gigantic buffer allocation; fall back to the element's own box.
    if (bw > w * 8 || bh > h * 8) return box;
    return { x: minX, y: minY, w: bw, h: bh };
}
