/**
 * Envelope / mesh warp — non-affine free-distort by an R×C grid of control points.
 *
 * `el.warp` is normalized to a grid {rows, cols, points} where `points` are R·C control
 * points in the element's CENTRED-local frame (the frame `getShapeGeometry` emits),
 * row-major. The 4-corner envelope is just the 2×2 case; the legacy `{corners}` shape
 * (TL,TR,BR,BL) is still read via {@link getWarpGrid} for back-compat.
 *
 * The warp deforms the shape's sampled outline *before* the affine CTM (rotate/flip/shear/
 * translate), so it composes on top of the rest of Free Transform. An identity grid (the
 * bbox lattice) is a no-op until a control point is dragged.
 *
 * Forward: a geometry point's normalized (u,v) selects a grid cell; within it we bilinearly
 * interpolate the cell's 4 control points. Inverse (hit-testing): find the warped cell that
 * contains the click, then solve the per-cell bilinear (a quadratic) for the local coords.
 */

import { PathUtils } from './math/path-utils';

type Pt = { x: number; y: number };
export interface WarpGrid { rows: number; cols: number; points: Pt[]; }

// ── Grid model + back-compat ──────────────────────────────────────────────

/** Normalize an element's `warp` (grid or legacy 4-corner) to a grid, or null. */
export function getWarpGrid(warp: any): WarpGrid | null {
    if (!warp) return null;
    if (warp.points && warp.rows >= 2 && warp.cols >= 2 && warp.points.length === warp.rows * warp.cols) {
        return { rows: warp.rows, cols: warp.cols, points: warp.points };
    }
    // Legacy 4-corner envelope [TL, TR, BR, BL] → 2×2 grid (row-major TL,TR / BL,BR).
    if (warp.corners && warp.corners.length === 4) {
        const c = warp.corners;
        return { rows: 2, cols: 2, points: [c[0], c[1], c[3], c[2]] };
    }
    return null;
}

/** Identity R×C control-point lattice over the centred bounding box. */
export function defaultWarpGrid(width: number, height: number, rows = 2, cols = 2): WarpGrid {
    const mw = width / 2, mh = height / 2;
    const points: Pt[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            points.push({ x: -mw + (cols === 1 ? 0 : (c / (cols - 1)) * width), y: -mh + (rows === 1 ? 0 : (r / (rows - 1)) * height) });
        }
    }
    return { rows, cols, points };
}

/** Default 4-corner envelope quad [TL,TR,BR,BL] (legacy helper, still used by the 2×2 command). */
export function defaultWarpCorners(width: number, height: number): Pt[] {
    const mw = width / 2, mh = height / 2;
    return [{ x: -mw, y: -mh }, { x: mw, y: -mh }, { x: mw, y: mh }, { x: -mw, y: mh }];
}

// ── Bilinear (single cell) ────────────────────────────────────────────────

function bilinear(p00: Pt, p10: Pt, p11: Pt, p01: Pt, u: number, v: number): Pt {
    const a = (1 - u) * (1 - v), b = u * (1 - v), d = u * v, e = (1 - u) * v;
    return { x: a * p00.x + b * p10.x + d * p11.x + e * p01.x, y: a * p00.y + b * p10.y + d * p11.y + e * p01.y };
}

const cross = (p: Pt, q: Pt) => p.x * q.y - p.y * q.x;

/** Inverse bilinear within one cell: recover (u,v) from a warped point. */
function invBilinear(q: Pt, p00: Pt, p10: Pt, p11: Pt, p01: Pt): { u: number; v: number } {
    const E = { x: p10.x - p00.x, y: p10.y - p00.y };
    const F = { x: p01.x - p00.x, y: p01.y - p00.y };
    const G = { x: p00.x - p10.x - p01.x + p11.x, y: p00.y - p10.y - p01.y + p11.y };
    const H = { x: q.x - p00.x, y: q.y - p00.y };
    const k2 = cross(G, F), k1 = cross(E, F) + cross(H, G), k0 = cross(H, E);
    let v: number;
    if (Math.abs(k2) < 1e-9) {
        v = Math.abs(k1) < 1e-12 ? 0 : -k0 / k1;
    } else {
        const sq = Math.sqrt(Math.max(0, k1 * k1 - 4 * k2 * k0));
        const v1 = (-k1 + sq) / (2 * k2), v2 = (-k1 - sq) / (2 * k2);
        const score = (t: number) => (t >= -0.0001 && t <= 1.0001) ? 0 : Math.min(Math.abs(t), Math.abs(t - 1));
        v = score(v1) <= score(v2) ? v1 : v2;
    }
    const denX = E.x + G.x * v, denY = E.y + G.y * v;
    const u = Math.abs(denX) >= Math.abs(denY)
        ? (Math.abs(denX) < 1e-9 ? 0 : (H.x - F.x * v) / denX)
        : (Math.abs(denY) < 1e-9 ? 0 : (H.y - F.y * v) / denY);
    return { u, v };
}

function pointInQuad(q: Pt, a: Pt, b: Pt, c: Pt, d: Pt): boolean {
    // Winding sign test against the (possibly non-convex) quad a→b→c→d.
    const sign = (p: Pt, u: Pt, w: Pt) => (w.x - u.x) * (p.y - u.y) - (w.y - u.y) * (p.x - u.x);
    const s1 = sign(q, a, b), s2 = sign(q, b, c), s3 = sign(q, c, d), s4 = sign(q, d, a);
    const hasNeg = s1 < 0 || s2 < 0 || s3 < 0 || s4 < 0;
    const hasPos = s1 > 0 || s2 > 0 || s3 > 0 || s4 > 0;
    return !(hasNeg && hasPos);
}

// ── Mesh forward / inverse ────────────────────────────────────────────────

/** Map a centred geometry point through the mesh. */
export function meshWarpPoint(gx: number, gy: number, width: number, height: number, g: WarpGrid): Pt {
    const u = width === 0 ? 0.5 : (gx + width / 2) / width;
    const v = height === 0 ? 0.5 : (gy + height / 2) / height;
    const fc = Math.min(Math.max(u * (g.cols - 1), 0), g.cols - 1);
    const fr = Math.min(Math.max(v * (g.rows - 1), 0), g.rows - 1);
    const cc = Math.min(Math.floor(fc), g.cols - 2);
    const rr = Math.min(Math.floor(fr), g.rows - 2);
    const uu = fc - cc, vv = fr - rr;
    const P = g.points;
    return bilinear(P[rr * g.cols + cc], P[rr * g.cols + cc + 1], P[(rr + 1) * g.cols + cc + 1], P[(rr + 1) * g.cols + cc], uu, vv);
}

/** Inverse mesh map: recover the un-warped centred point from a warped one (hit-testing). */
export function unmeshWarpPoint(qx: number, qy: number, width: number, height: number, g: WarpGrid): Pt {
    const q = { x: qx, y: qy };
    const P = g.points;
    for (let rr = 0; rr < g.rows - 1; rr++) {
        for (let cc = 0; cc < g.cols - 1; cc++) {
            const p00 = P[rr * g.cols + cc], p10 = P[rr * g.cols + cc + 1];
            const p11 = P[(rr + 1) * g.cols + cc + 1], p01 = P[(rr + 1) * g.cols + cc];
            if (!pointInQuad(q, p00, p10, p11, p01)) continue;
            const { u, v } = invBilinear(q, p00, p10, p11, p01);
            const gu = (cc + u) / (g.cols - 1), gv = (rr + v) / (g.rows - 1);
            return { x: gu * width - width / 2, y: gv * height - height / 2 };
        }
    }
    // Outside every cell → coarse inverse over the outer corners so misses map outside the bbox.
    const TL = P[0], TR = P[g.cols - 1], BR = P[g.rows * g.cols - 1], BL = P[(g.rows - 1) * g.cols];
    const { u, v } = invBilinear(q, TL, TR, BR, BL);
    return { x: u * width - width / 2, y: v * height - height / 2 };
}

// ── Geometry warp (render + export) ───────────────────────────────────────

function geoToSubpolylines(geo: any): { pts: Pt[]; closed: boolean }[] {
    if (!geo) return [];
    if (geo.type === 'rect') {
        const { x, y, w, h } = geo;
        // Subdivide edges so straight sides can bend across interior mesh lines.
        const K = 12, pts: Pt[] = [];
        const corners = [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];
        for (let i = 0; i < 4; i++) {
            const a = corners[i], b = corners[(i + 1) % 4];
            for (let s = 0; s < K; s++) pts.push({ x: a.x + (b.x - a.x) * s / K, y: a.y + (b.y - a.y) * s / K });
        }
        return [{ pts, closed: true }];
    }
    if (geo.type === 'ellipse') {
        const N = 80, pts: Pt[] = [];
        for (let i = 0; i < N; i++) { const t = (2 * Math.PI * i) / N; pts.push({ x: geo.cx + geo.rx * Math.cos(t), y: geo.cy + geo.ry * Math.sin(t) }); }
        return [{ pts, closed: true }];
    }
    if (geo.type === 'points') {
        const src: Pt[] = geo.points; const closed = geo.isClosed !== false;
        if (src.length < 2) return [];
        const K = 10, pts: Pt[] = [];
        const last = closed ? src.length : src.length - 1;
        for (let i = 0; i < last; i++) {
            const a = src[i], b = src[(i + 1) % src.length];
            for (let s = 0; s < K; s++) pts.push({ x: a.x + (b.x - a.x) * s / K, y: a.y + (b.y - a.y) * s / K });
        }
        if (!closed) pts.push(src[src.length - 1]);
        return [{ pts, closed }];
    }
    if (geo.type === 'path') {
        const cmds = PathUtils.parsePath(geo.path);
        const groups: any[][] = []; let cur: any[] = [];
        for (const c of cmds) { if (c.type === 'M' && cur.length) { groups.push(cur); cur = []; } cur.push(c); }
        if (cur.length) groups.push(cur);
        const out: { pts: Pt[]; closed: boolean }[] = [];
        for (const grp of groups) {
            const closed = grp.some(c => c.type === 'Z');
            const N = 96, pts: Pt[] = [];
            for (let i = 0; i <= N; i++) { const p = PathUtils.getPointOnPath(grp, i / N); pts.push({ x: p.x, y: p.y }); }
            if (pts.length >= 2) out.push({ pts, closed });
        }
        return out;
    }
    if (geo.type === 'multi') return geo.shapes.flatMap((s: any) => geoToSubpolylines(s));
    return [];
}

/** Warp a centred geometry into a single warped `path` geometry (sampled `d`). */
export function warpGeometry(geo: any, width: number, height: number, g: WarpGrid): any {
    const subs = geoToSubpolylines(geo);
    if (subs.length === 0) return geo;
    const round = (n: number) => Math.round(n * 1000) / 1000;
    const ds: string[] = [];
    for (const sp of subs) {
        const wp = sp.pts.map(p => meshWarpPoint(p.x, p.y, width, height, g));
        if (wp.length < 2) continue;
        let d = `M ${round(wp[0].x)} ${round(wp[0].y)}`;
        for (let i = 1; i < wp.length; i++) d += ` L ${round(wp[i].x)} ${round(wp[i].y)}`;
        if (sp.closed) d += ' Z';
        ds.push(d);
    }
    if (ds.length === 0) return geo;
    return { type: 'path', path: ds.join(' '), evenOdd: ds.length > 1 };
}
