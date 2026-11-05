/**
 * Clipping drawn output to a convex device polygon (EMF+ clip rectangles, and clip paths and
 * regions that are convex; others are reduced to their bounding rectangle). Shapes wholly inside
 * pass unchanged; shapes crossing the edge are flattened and cut: fills with Sutherland–Hodgman
 * per subpath, outlines with Cyrus–Beck per segment. Bitmaps are cropped (and masked outside a
 * non-rectangular polygon) and text gets the polygon's bounding rectangle. Ported from DeckCraft's
 * `crates/metafile/src/cliprect.rs` (MIT/Apache).
 */
import type { P } from './bytes';
import type { Op } from './geom';
import { M, L, Z } from './geom';
import type { Rgba } from './dib';
import { isEncoded } from './encoded';
import type { Raw } from './canvas';

/** Line segments per Bézier when a crossing shape is flattened. */
const CURVE_STEPS = 16;

type Box = [number, number, number, number];

/** The bounding box `[l, t, r, b]` of the points in `ops` (control points included). */
export function opsBbox(ops: Op[]): Box | null {
    let b: Box | null = null;
    const add = (p: P) => {
        if (!b) b = [p[0], p[1], p[0], p[1]];
        else b = [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])];
    };
    for (const op of ops) {
        if (op.k === 'M' || op.k === 'L') add(op.p);
        else if (op.k === 'C') { add(op.a); add(op.b); add(op.p); }
    }
    return b;
}

export function intersectBox(a: Box, b: Box): Box {
    const r: Box = [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])];
    // An empty intersection stays empty (zero size) so it clips everything away.
    return r[2] < r[0] || r[3] < r[1] ? [r[0], r[1], r[0], r[1]] : r;
}

/** A rectangle `[l, t, r, b]` as a polygon. */
export const rectPoly = ([l, t, r, b]: Box): P[] => [[l, t], [r, t], [r, b], [l, b]];

/** The bounding box of a point list. */
export function ptsBbox(pts: P[]): Box | null {
    if (!pts.length) return null;
    let v: Box = [pts[0][0], pts[0][1], pts[0][0], pts[0][1]];
    for (const p of pts) v = [Math.min(v[0], p[0]), Math.min(v[1], p[1]), Math.max(v[2], p[0]), Math.max(v[3], p[1])];
    return v;
}

const cross = (a: P, b: P, p: P) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);

/** A convex clip polygon with positive orientation, or null when `pts` is not convex (or degenerate); duplicate and collinear points are dropped. */
export function convex(pts: P[]): P[] | null {
    const v: P[] = [];
    for (const p of pts) {
        if (!(Number.isFinite(p[0]) && Number.isFinite(p[1]))) return null;
        const q = v[v.length - 1];
        if (!q || Math.abs(q[0] - p[0]) > 1e-9 || Math.abs(q[1] - p[1]) > 1e-9) v.push(p);
    }
    while (v.length > 1 && v[0][0] === v[v.length - 1][0] && v[0][1] === v[v.length - 1][1]) v.pop();
    let area = 0;
    for (let i = 0; i < v.length; i++) area += cross([0, 0], v[i], v[(i + 1) % v.length]);
    if (v.length < 3 || Math.abs(area) < 1e-12) return null;
    if (area < 0) v.reverse();
    const n = v.length;
    const out: P[] = [];
    for (let i = 0; i < n; i++) {
        const c = cross(v[(i + n - 1) % n], v[i], v[(i + 1) % n]);
        if (c < -1e-9 * (1 + Math.abs(area))) return null;
        if (Math.abs(c) > 1e-12) out.push(v[i]);
    }
    return out.length >= 3 ? out : null;
}

function insidePoly(clip: P[], p: P): boolean {
    for (let i = 0; i < clip.length; i++) if (cross(clip[i], clip[(i + 1) % clip.length], p) < -1e-9) return false;
    return true;
}

/** Whether the clip polygon is an axis-aligned rectangle. */
function isRect(clip: P[]): boolean {
    const b = ptsBbox(clip);
    return !!b && clip.length === 4 && clip.every(p => (p[0] === b[0] || p[0] === b[2]) && (p[1] === b[1] || p[1] === b[3]));
}

/** Sutherland–Hodgman: `poly` cut by convex `clip`. */
export function clipPolygon(poly0: P[], clip: P[]): P[] {
    if (poly0.length * clip.length > 1_000_000) return [];
    let poly = poly0.slice();
    for (let i = 0; i < clip.length; i++) {
        if (poly.length * (clip.length - i) > 1_000_000) return [];
        const a = clip[i], b = clip[(i + 1) % clip.length];
        const keep = (p: P) => cross(a, b, p) >= 0;
        const cut = (p: P, q: P): P => {
            const cp = cross(a, b, p), cq = cross(a, b, q);
            const t = cp / (cp - cq);
            return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
        };
        const next: P[] = [];
        for (let j = 0; j < poly.length; j++) {
            const p = poly[(j + poly.length - 1) % poly.length], q = poly[j];
            const kp = keep(p), kq = keep(q);
            if (kp && kq) next.push(q);
            else if (kp && !kq) next.push(cut(p, q));
            else if (!kp && kq) { next.push(cut(p, q)); next.push(q); }
        }
        poly = next;
        if (!poly.length) break;
    }
    return poly;
}

const disjoint = (b: Box, c: Box) => b[2] < c[0] || b[0] > c[2] || b[3] < c[1] || b[1] > c[3] || c[2] <= c[0] || c[3] <= c[1];
const bboxInside = (b: Box, clip: P[]) => rectPoly(b).every(p => insidePoly(clip, p));

/** Clips one drawn item to a convex device polygon; a shape that is both filled and stroked comes back as two items. An empty polygon clips everything away. */
export function clipRaw(raw: Raw, clip: P[]): Raw[] {
    const cb = clip.length >= 3 ? ptsBbox(clip) : null;
    if (!cb) return [];
    switch (raw.kind) {
        case 'path': {
            const b = opsBbox(raw.ops);
            if (!b) return [];
            if (bboxInside(b, clip)) return [raw];
            if (disjoint(b, cb)) return [];
            const subs = flatten(raw.ops);
            const out: Raw[] = [];
            if (raw.fill) {
                const f = clipFill(subs, clip);
                if (f.length) out.push({ ...raw, ops: f, stroke: null });
            }
            if (raw.stroke) {
                const s = clipStroke(subs, clip);
                if (s.length) out.push({ ...raw, ops: s, fill: null });
            }
            return out;
        }
        case 'pattern': {
            const b = opsBbox(raw.ops);
            if (!b) return [];
            if (bboxInside(b, clip)) return [raw];
            if (disjoint(b, cb)) return [];
            const f = clipFill(flatten(raw.ops), clip);
            return f.length ? [{ ...raw, ops: f }] : [];
        }
        case 'bitmap': {
            // An encoded image keeps its pixels whole; only its placement is checked.
            if (isEncoded(raw.img)) {
                const [x, y, w, h] = raw.rect;
                return disjoint([x, y, x + w, y + h], cb) ? [] : [raw];
            }
            const c = crop(raw.rect, raw.img, clip);
            return c ? [{ ...raw, rect: c.rect, img: c.img }] : [];
        }
        case 'text': {
            // Text clips to a rectangle: the one around the polygon.
            const t = { ...raw.text };
            t.clip = t.clip ? intersectBox(cb, t.clip) : cb;
            return [{ ...raw, text: t }];
        }
    }
}

/** Subpaths as point lists with their closed flag. */
export function flatten(ops: Op[]): [P[], boolean][] {
    const subs: [P[], boolean][] = [];
    for (const op of ops) {
        if (op.k === 'M') subs.push([[op.p], false]);
        else if (op.k === 'L') {
            const s = subs[subs.length - 1];
            if (s) s[0].push(op.p); else subs.push([[op.p], false]);
        } else if (op.k === 'C') {
            const s = subs[subs.length - 1];
            if (!s || !s[0].length) continue;
            const p0 = s[0][s[0].length - 1];
            for (let i = 1; i <= CURVE_STEPS; i++) {
                const t = i / CURVE_STEPS, u = 1 - t;
                const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
                s[0].push([k[0] * p0[0] + k[1] * op.a[0] + k[2] * op.b[0] + k[3] * op.p[0], k[0] * p0[1] + k[1] * op.a[1] + k[2] * op.b[1] + k[3] * op.p[1]]);
            }
        } else {
            const s = subs[subs.length - 1];
            if (s) {
                s[1] = true;
                // Drawing after a close starts from the subpath's first point.
                if (s[0].length) subs.push([[s[0][0]], false]);
            }
        }
    }
    return subs.filter(s => s[0].length > 1);
}

function clipFill(subs: [P[], boolean][], clip: P[]): Op[] {
    const ops: Op[] = [];
    for (const [pts] of subs) {
        const poly = clipPolygon(pts, clip);
        if (poly.length >= 3) {
            ops.push(M(poly[0]));
            for (const p of poly.slice(1)) ops.push(L(p));
            ops.push(Z);
        }
    }
    return ops;
}

function clipStroke(subs: [P[], boolean][], clip: P[]): Op[] {
    const ops: Op[] = [];
    for (const [pts0, closed] of subs) {
        const pts = closed && pts0.length ? [...pts0, pts0[0]] : pts0;
        let last: P | null = null;
        for (let i = 0; i + 1 < pts.length; i++) {
            const seg = segment(pts[i], pts[i + 1], clip);
            if (!seg) { last = null; continue; }
            const [a, b] = seg;
            if (!last || last[0] !== a[0] || last[1] !== a[1]) ops.push(M(a));
            ops.push(L(b));
            last = b;
        }
    }
    return ops;
}

/** Cyrus–Beck: the part of segment `a`–`b` inside convex `clip`. */
function segment(a: P, b: P, clip: P[]): [P, P] | null {
    const d: P = [b[0] - a[0], b[1] - a[1]];
    let t0 = 0, t1 = 1;
    for (let i = 0; i < clip.length; i++) {
        const e0 = clip[i], e1 = clip[(i + 1) % clip.length];
        const f0 = cross(e0, e1, a);
        const df = (e1[0] - e0[0]) * d[1] - (e1[1] - e0[1]) * d[0];
        if (df === 0) { if (f0 < 0) return null; }
        else {
            const t = -f0 / df;
            if (df > 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
        }
    }
    return t0 <= t1 ? [[a[0] + d[0] * t0, a[1] + d[1] * t0], [a[0] + d[0] * t1, a[1] + d[1] * t1]] : null;
}

/** Crops a bitmap drawn into `rect` = `[x, y, w, h]` (device, positive extents) to the clip polygon's box; pixels outside a non-rectangular polygon turn transparent. */
function crop(rect: Box, img: Rgba, clip: P[]): { rect: Box; img: Rgba } | null {
    const [x, y, w, h] = rect;
    const b: Box = [x, y, x + w, y + h];
    if (bboxInside(b, clip)) return { rect, img };
    const c = ptsBbox(clip);
    if (!c || disjoint(b, c) || w <= 0 || h <= 0 || img.w === 0 || img.h === 0) return null;
    const i = intersectBox(b, c);
    const kx = img.w / w, ky = img.h / h;
    const x0 = Math.min(Math.max(0, Math.floor((i[0] - x) * kx)), img.w);
    const x1 = Math.min(Math.max(0, Math.ceil((i[2] - x) * kx)), img.w);
    const y0 = Math.min(Math.max(0, Math.floor((i[1] - y) * ky)), img.h);
    const y1 = Math.min(Math.max(0, Math.ceil((i[3] - y) * ky)), img.h);
    if (x1 <= x0 || y1 <= y0) return null;
    const mask = !isRect(clip);
    if (mask && (x1 - x0) * (y1 - y0) * clip.length > 5_000_000) return null;
    const ow = x1 - x0;
    const px = new Uint8Array(ow * (y1 - y0) * 4);
    for (let row = y0; row < y1; row++) {
        const r = img.bottomUp ? img.h - 1 - row : row;
        const s = (r * img.w + x0) * 4;
        if (s + ow * 4 > img.px.length) return null;
        const d = (row - y0) * ow * 4;
        px.set(img.px.subarray(s, s + ow * 4), d);
        if (mask) {
            const cy = y + (row + 0.5) / ky;
            for (let k = 0; k < ow; k++) if (!insidePoly(clip, [x + (x0 + k + 0.5) / kx, cy])) px[d + k * 4 + 3] = 0;
        }
    }
    return { rect: [x + x0 / kx, y + y0 / ky, ow / kx, (y1 - y0) / ky], img: { w: ow, h: y1 - y0, bottomUp: false, px } };
}
