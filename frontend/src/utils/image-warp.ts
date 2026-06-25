/**
 * Image (raster) warp — texture-map a bitmap through an envelope/mesh `warp` grid by
 * tessellating into triangles and affine-mapping each source-image triangle onto its
 * warped destination triangle. Shared by the live image renderer, SVG export (rasterize
 * the warp into an embedded bitmap), and Bake (commit the warp to a new bitmap).
 */

import type { DrawingElement } from '../types';
import { getEffectiveGrid, meshWarpPoint, type WarpGrid } from './envelope-warp';

type Pt = { x: number; y: number };
const TESS = 24; // triangle-grid resolution per axis

/** Affine matrix (canvas `transform` form) mapping source triangle s0..s2 → dest d0..d2. */
function affineFromTriangles(s0: Pt, s1: Pt, s2: Pt, d0: Pt, d1: Pt, d2: Pt) {
    const a00 = s0.x, a01 = s0.y, a10 = s1.x, a11 = s1.y, a20 = s2.x, a21 = s2.y;
    const det = a00 * (a11 - a21) - a01 * (a10 - a20) + (a10 * a21 - a20 * a11);
    if (Math.abs(det) < 1e-9) return null;
    const id = 1 / det;
    const i00 = (a11 - a21) * id, i01 = (a21 - a01) * id, i02 = (a01 - a11) * id;
    const i10 = (a20 - a10) * id, i11 = (a00 - a20) * id, i12 = (a10 - a00) * id;
    const i20 = (a10 * a21 - a20 * a11) * id, i21 = (a20 * a01 - a00 * a21) * id, i22 = (a00 * a11 - a10 * a01) * id;
    return {
        a: i00 * d0.x + i01 * d1.x + i02 * d2.x,
        c: i10 * d0.x + i11 * d1.x + i12 * d2.x,
        e: i20 * d0.x + i21 * d1.x + i22 * d2.x,
        b: i00 * d0.y + i01 * d1.y + i02 * d2.y,
        d: i10 * d0.y + i11 * d1.y + i12 * d2.y,
        f: i20 * d0.y + i21 * d1.y + i22 * d2.y,
    };
}

/** Inflate a triangle slightly around its centroid to hide hairline seams between cells. */
function inflate(d0: Pt, d1: Pt, d2: Pt, px = 0.5): [Pt, Pt, Pt] {
    const gx = (d0.x + d1.x + d2.x) / 3, gy = (d0.y + d1.y + d2.y) / 3;
    const out = (p: Pt): Pt => {
        const dx = p.x - gx, dy = p.y - gy, len = Math.hypot(dx, dy) || 1;
        return { x: p.x + (dx / len) * px, y: p.y + (dy / len) * px };
    };
    return [out(d0), out(d1), out(d2)];
}

function srcRect(el: DrawingElement, img: HTMLImageElement) {
    return {
        x: el.crop?.x ?? 0,
        y: el.crop?.y ?? 0,
        w: el.crop?.width ?? (img.naturalWidth || img.width),
        h: el.crop?.height ?? (img.naturalHeight || img.height),
    };
}

/** Source + destination vertices of the tessellation (dest in WORLD coords, pre-CTM). */
function tessellate(el: DrawingElement, img: HTMLImageElement, grid: WarpGrid) {
    const w = el.width, h = el.height, mw = w / 2, mh = h / 2;
    const cx = el.x + mw, cy = el.y + mh;
    const s = srcRect(el, img);
    const src: Pt[] = [], dest: Pt[] = [];
    for (let j = 0; j <= TESS; j++) {
        for (let i = 0; i <= TESS; i++) {
            const u = i / TESS, v = j / TESS;
            src.push({ x: s.x + u * s.w, y: s.y + v * s.h });
            const wc = meshWarpPoint(u * w - mw, v * h - mh, w, h, grid);
            dest.push({ x: cx + wc.x, y: cy + wc.y });
        }
    }
    return { src, dest };
}

/**
 * Draw the warped image into `ctx`. Destination points are world coords plus (offX, offY)
 * — pass (0,0) to draw on the main canvas (the element CTM is already applied), or an
 * offset to rasterize into an off-screen canvas whose origin is the warped bbox corner.
 */
export function drawWarpedImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, el: DrawingElement, grid: WarpGrid, offX = 0, offY = 0): void {
    const { src, dest } = tessellate(el, img, grid);
    const idx = (i: number, j: number) => j * (TESS + 1) + i;
    const tri = (a: number, b: number, c: number) => {
        const s0 = src[a], s1 = src[b], s2 = src[c];
        const d0 = { x: dest[a].x + offX, y: dest[a].y + offY }, d1 = { x: dest[b].x + offX, y: dest[b].y + offY }, d2 = { x: dest[c].x + offX, y: dest[c].y + offY };
        const m = affineFromTriangles(s0, s1, s2, d0, d1, d2);
        if (!m) return;
        const [e0, e1, e2] = inflate(d0, d1, d2);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(e0.x, e0.y); ctx.lineTo(e1.x, e1.y); ctx.lineTo(e2.x, e2.y); ctx.closePath();
        ctx.clip();
        ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
        ctx.drawImage(img, 0, 0);
        ctx.restore();
    };
    for (let j = 0; j < TESS; j++) {
        for (let i = 0; i < TESS; i++) {
            const a = idx(i, j), b = idx(i + 1, j), c = idx(i + 1, j + 1), d = idx(i, j + 1);
            tri(a, b, c);
            tri(a, c, d);
        }
    }
}

/** World-space bounding box of the warped image's destination vertices. */
export function warpedImageBounds(el: DrawingElement, img: HTMLImageElement, grid: WarpGrid) {
    const { dest } = tessellate(el, img, grid);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of dest) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }
    return { minX, minY, maxX, maxY };
}

/**
 * Rasterize a warped image into a fresh bitmap. Returns the data URL plus the world-space
 * placement rect of that bitmap (the warped bbox). Used by SVG export and Bake.
 */
export function rasterizeWarpedImage(el: DrawingElement, img: HTMLImageElement): { dataURL: string; x: number; y: number; width: number; height: number } | null {
    const grid = getEffectiveGrid(el.warp);
    if (!grid) return null;
    const b = warpedImageBounds(el, img, grid);
    const pad = 1;
    const W = Math.max(1, Math.ceil(b.maxX - b.minX) + 2 * pad);
    const H = Math.max(1, Math.ceil(b.maxY - b.minY) + 2 * pad);
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    drawWarpedImage(ctx, img, el, grid, -b.minX + pad, -b.minY + pad);
    return { dataURL: canvas.toDataURL(), x: b.minX - pad, y: b.minY - pad, width: W, height: H };
}
