/**
 * Envelope warp — 4-corner bilinear free-distort.
 *
 * `el.warp.corners` are 4 points [TL, TR, BR, BL] in the element's CENTRED-local frame
 * (same frame `getShapeGeometry` emits: x∈[-w/2,w/2], y∈[-h/2,h/2]). The warp deforms the
 * shape's sampled outline *before* the affine CTM (rotate/flip/shear/translate) is applied,
 * so it composes cleanly on top of the rest of Free Transform. Default corners = the bbox,
 * which makes the bilinear map the identity (no visible change until a corner is dragged).
 *
 * Forward (geometry → warped): P(u,v) = (1-u)(1-v)·TL + u(1-v)·TR + uv·BR + (1-u)v·BL
 * with u = (x + w/2)/w, v = (y + h/2)/h.
 * Inverse (hit-testing): solve the bilinear for (u,v) — a quadratic — then map back.
 */

import { PathUtils } from './math/path-utils';

export interface WarpCorners { corners: { x: number; y: number }[]; } // [TL, TR, BR, BL]

type Pt = { x: number; y: number };

/** Default warp quad = the centred bounding box (→ identity map). */
export function defaultWarpCorners(width: number, height: number): Pt[] {
    const mw = width / 2, mh = height / 2;
    return [{ x: -mw, y: -mh }, { x: mw, y: -mh }, { x: mw, y: mh }, { x: -mw, y: mh }];
}

function bilinear(c: Pt[], u: number, v: number): Pt {
    const a = (1 - u) * (1 - v), b = u * (1 - v), d = u * v, e = (1 - u) * v;
    return {
        x: a * c[0].x + b * c[1].x + d * c[2].x + e * c[3].x,
        y: a * c[0].y + b * c[1].y + d * c[2].y + e * c[3].y,
    };
}

/** Map a centred geometry point through the warp. */
export function warpCenteredPoint(gx: number, gy: number, width: number, height: number, corners: Pt[]): Pt {
    const u = width === 0 ? 0.5 : (gx + width / 2) / width;
    const v = height === 0 ? 0.5 : (gy + height / 2) / height;
    return bilinear(corners, u, v);
}

const cross = (p: Pt, q: Pt) => p.x * q.y - p.y * q.x;

/**
 * Inverse bilinear: given a warped centred point, recover the un-warped centred point.
 * Used by hit-testing so a click is mapped back into the original (un-warped) shape.
 */
export function unwarpCenteredPoint(qx: number, qy: number, width: number, height: number, corners: Pt[]): Pt {
    const [TL, TR, BR, BL] = corners;
    // Q = TL + u·E + v·F + uv·G
    const E = { x: TR.x - TL.x, y: TR.y - TL.y };
    const F = { x: BL.x - TL.x, y: BL.y - TL.y };
    const G = { x: TL.x - TR.x - BL.x + BR.x, y: TL.y - TR.y - BL.y + BR.y };
    const H = { x: qx - TL.x, y: qy - TL.y };

    const k2 = cross(G, F);
    const k1 = cross(E, F) + cross(H, G);
    const k0 = cross(H, E);

    let v: number;
    if (Math.abs(k2) < 1e-9) {
        v = Math.abs(k1) < 1e-12 ? 0 : -k0 / k1;
    } else {
        const disc = k1 * k1 - 4 * k2 * k0;
        const sq = Math.sqrt(Math.max(0, disc));
        const v1 = (-k1 + sq) / (2 * k2);
        const v2 = (-k1 - sq) / (2 * k2);
        // Prefer the root in [0,1]; else the one closest to the unit interval.
        const score = (t: number) => (t >= -0.0001 && t <= 1.0001) ? 0 : Math.min(Math.abs(t), Math.abs(t - 1));
        v = score(v1) <= score(v2) ? v1 : v2;
    }
    // u from whichever component has the larger denominator (numerical stability).
    const denX = E.x + G.x * v, denY = E.y + G.y * v;
    let u: number;
    if (Math.abs(denX) >= Math.abs(denY)) {
        u = Math.abs(denX) < 1e-9 ? 0 : (H.x - F.x * v) / denX;
    } else {
        u = Math.abs(denY) < 1e-9 ? 0 : (H.y - F.y * v) / denY;
    }
    return { x: u * width - width / 2, y: v * height - height / 2 };
}

/** Flatten a centred geometry object to closed/open polylines (centred coords). */
function geoToSubpolylines(geo: any): { pts: Pt[]; closed: boolean }[] {
    if (!geo) return [];
    if (geo.type === 'rect') {
        const { x, y, w, h } = geo;
        return [{ pts: [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }], closed: true }];
    }
    if (geo.type === 'ellipse') {
        const N = 64, pts: Pt[] = [];
        for (let i = 0; i < N; i++) {
            const t = (2 * Math.PI * i) / N;
            pts.push({ x: geo.cx + geo.rx * Math.cos(t), y: geo.cy + geo.ry * Math.sin(t) });
        }
        return [{ pts, closed: true }];
    }
    if (geo.type === 'points') {
        // Subdivide each segment so straight edges can bend under the bilinear map.
        const src: Pt[] = geo.points;
        const closed = geo.isClosed !== false;
        if (src.length < 2) return [];
        const K = 8, pts: Pt[] = [];
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
        // Split into subpaths at each 'M' so holes/islands sample independently.
        const groups: any[][] = [];
        let cur: any[] = [];
        for (const c of cmds) {
            if (c.type === 'M' && cur.length) { groups.push(cur); cur = []; }
            cur.push(c);
        }
        if (cur.length) groups.push(cur);
        const out: { pts: Pt[]; closed: boolean }[] = [];
        for (const g of groups) {
            const closed = g.some(c => c.type === 'Z');
            const N = 64, pts: Pt[] = [];
            for (let i = 0; i <= N; i++) { const p = PathUtils.getPointOnPath(g, i / N); pts.push({ x: p.x, y: p.y }); }
            if (pts.length >= 2) out.push({ pts, closed });
        }
        return out;
    }
    if (geo.type === 'multi') {
        return geo.shapes.flatMap((s: any) => geoToSubpolylines(s));
    }
    return [];
}

/**
 * Warp a centred geometry into a single warped path geometry. Returns a `path` geometry
 * (sampled `d` string) so both render styles (rc.path / fillPath) and SVG export pick it
 * up unchanged; even-odd fill preserves holes when there are multiple subpaths.
 */
export function warpGeometry(geo: any, width: number, height: number, corners: Pt[]): any {
    const subs = geoToSubpolylines(geo);
    if (subs.length === 0) return geo;
    const round = (n: number) => Math.round(n * 1000) / 1000;
    const ds: string[] = [];
    for (const sp of subs) {
        const wp = sp.pts.map(p => warpCenteredPoint(p.x, p.y, width, height, corners));
        if (wp.length < 2) continue;
        let d = `M ${round(wp[0].x)} ${round(wp[0].y)}`;
        for (let i = 1; i < wp.length; i++) d += ` L ${round(wp[i].x)} ${round(wp[i].y)}`;
        if (sp.closed) d += ' Z';
        ds.push(d);
    }
    if (ds.length === 0) return geo;
    return { type: 'path', path: ds.join(' '), evenOdd: ds.length > 1 };
}
