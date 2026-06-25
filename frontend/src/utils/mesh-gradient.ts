/**
 * Gradient mesh — scoped core.
 *
 * A mesh gradient is an `rows × cols` grid of coloured nodes (rows/cols are
 * node counts, each ≥ 2). The surface is filled by bilinear colour
 * interpolation within each cell (the 4 surrounding node colours). This gives
 * smooth (C0) gradients across the whole shape without a WASM rasterizer; a
 * future pass can swap the per-cell bilinear for Coons/bicubic (C1) patches.
 *
 * Nodes are laid out on an even grid across the element's bounding box, so the
 * model only needs to store colours — positions are derived. `colors` is a
 * row-major array of length `rows * cols` (top row left→right, then next row …).
 */

import type { MeshGradient } from '../types';
export type { MeshGradient };

interface RGB { r: number; g: number; b: number; }

/** Parse a #rgb / #rrggbb hex string to RGB (0–255). Falls back to mid-grey. */
export function parseHex(hex: string): RGB {
    if (typeof hex !== 'string') return { r: 128, g: 128, b: 128 };
    let h = hex.trim().replace(/^#/, '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return { r: 128, g: 128, b: 128 };
    return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
    };
}

/** RGB (0–255) → #rrggbb. */
export function rgbToHex(r: number, g: number, b: number): string {
    const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${c(r)}${c(g)}${c(b)}`;
}

const clampNodes = (n: number) => Math.max(2, Math.min(10, Math.round(n || 2)));

/** True if the object is a structurally valid mesh gradient. */
export function isValidMesh(m: unknown): m is MeshGradient {
    if (!m || typeof m !== 'object') return false;
    const g = m as MeshGradient;
    return Number.isFinite(g.rows) && Number.isFinite(g.cols) && g.rows >= 2 && g.cols >= 2
        && Array.isArray(g.colors) && g.colors.length === g.rows * g.cols;
}

/** Index into the row-major colour array. */
export const meshIndex = (mesh: { cols: number }, row: number, col: number) => row * mesh.cols + col;

/**
 * Build a default mesh from a base colour. Corners are tinted lighter/darker so
 * the gradient is visible immediately; the centre carries the base colour.
 */
export function defaultMesh(rows = 3, cols = 3, base = '#3b82f6'): MeshGradient {
    rows = clampNodes(rows); cols = clampNodes(cols);
    const b = parseHex(base);
    const colors: string[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // Vary brightness across the grid (diagonal light→dark) for a soft sheen.
            const u = cols > 1 ? c / (cols - 1) : 0.5;
            const v = rows > 1 ? r / (rows - 1) : 0.5;
            const f = 0.7 + 0.6 * (1 - (u + v) / 2); // 0.7 (far corner) → 1.3 (near corner)
            colors.push(rgbToHex(b.r * f, b.g * f, b.b * f));
        }
    }
    return { rows, cols, colors };
}

/** Resize a mesh to new node counts, preserving colours where they overlap and
 *  bilinear-sampling the old grid for new nodes. */
export function resizeMesh(mesh: MeshGradient, rows: number, cols: number): MeshGradient {
    rows = clampNodes(rows); cols = clampNodes(cols);
    const colors: string[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const u = cols > 1 ? c / (cols - 1) : 0;
            const v = rows > 1 ? r / (rows - 1) : 0;
            const { r: rr, g, b } = sampleMesh(mesh, u, v);
            colors.push(rgbToHex(rr, g, b));
        }
    }
    return { rows, cols, colors };
}

/** Bilinearly sample the mesh at normalized (u, v) ∈ [0,1]² → RGB. */
export function sampleMesh(mesh: MeshGradient, u: number, v: number): RGB {
    const { rows, cols, colors } = mesh;
    const fu = Math.max(0, Math.min(1, u)) * (cols - 1);
    const fv = Math.max(0, Math.min(1, v)) * (rows - 1);
    const c0 = Math.floor(fu), r0 = Math.floor(fv);
    const c1 = Math.min(cols - 1, c0 + 1), r1 = Math.min(rows - 1, r0 + 1);
    const tu = fu - c0, tv = fv - r0;

    const tl = parseHex(colors[r0 * cols + c0]);
    const tr = parseHex(colors[r0 * cols + c1]);
    const bl = parseHex(colors[r1 * cols + c0]);
    const br = parseHex(colors[r1 * cols + c1]);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const top = { r: lerp(tl.r, tr.r, tu), g: lerp(tl.g, tr.g, tu), b: lerp(tl.b, tr.b, tu) };
    const bot = { r: lerp(bl.r, br.r, tu), g: lerp(bl.g, br.g, tu), b: lerp(bl.b, br.b, tu) };
    return { r: lerp(top.r, bot.r, tv), g: lerp(top.g, bot.g, tv), b: lerp(top.b, bot.b, tv) };
}

/** Normalized (0..1) position of node (row, col): custom `points` if present,
 *  else the even grid. */
export function meshNodePos(mesh: MeshGradient, row: number, col: number): { x: number; y: number } {
    const { rows, cols, points } = mesh;
    if (points && points.length === rows * cols) return points[row * cols + col];
    return { x: cols > 1 ? col / (cols - 1) : 0.5, y: rows > 1 ? row / (rows - 1) : 0.5 };
}

/** Materialize the (possibly implicit) node grid as a points array. */
export function meshPoints(mesh: MeshGradient): { x: number; y: number }[] {
    if (mesh.points && mesh.points.length === mesh.rows * mesh.cols) return mesh.points.map(p => ({ ...p }));
    const pts: { x: number; y: number }[] = [];
    for (let r = 0; r < mesh.rows; r++) for (let c = 0; c < mesh.cols; c++) pts.push(meshNodePos(mesh, r, c));
    return pts;
}

/**
 * Constrain a dragged node position to keep the mesh well-formed:
 *  - corner nodes stay pinned to the rectangle corners,
 *  - edge nodes slide along their edge (the boundary stays the unit square so
 *    the mesh always covers the element — no gaps),
 *  - interior nodes move freely within (0,1).
 */
export function constrainNodePos(mesh: MeshGradient, row: number, col: number, x: number, y: number): { x: number; y: number } {
    const onTop = row === 0, onBottom = row === mesh.rows - 1;
    const onLeft = col === 0, onRight = col === mesh.cols - 1;
    const cx = Math.max(0, Math.min(1, x));
    const cy = Math.max(0, Math.min(1, y));
    const fx = onLeft ? 0 : onRight ? 1 : cx;
    const fy = onTop ? 0 : onBottom ? 1 : cy;
    // Keep interior nodes strictly inside so cells don't collapse.
    const pad = 0.02;
    return {
        x: (onLeft || onRight) ? fx : Math.max(pad, Math.min(1 - pad, fx)),
        y: (onTop || onBottom) ? fy : Math.max(pad, Math.min(1 - pad, fy)),
    };
}

/** Inverse bilinear: given a quad (a=TL, b=TR, c=BL, d=BR) and point p, return
 *  (s,t) ∈ unit square with p = bilerp(quad, s, t), or null if outside. */
function inverseBilinear(
    a: { x: number; y: number }, b: { x: number; y: number },
    c: { x: number; y: number }, d: { x: number; y: number },
    px: number, py: number,
): { s: number; t: number } | null {
    const ex = b.x - a.x, ey = b.y - a.y;          // e = B-A
    const fx = c.x - a.x, fy = c.y - a.y;          // f = C-A
    const gx = a.x - b.x - c.x + d.x, gy = a.y - b.y - c.y + d.y; // g
    const hx = px - a.x, hy = py - a.y;            // h = P-A
    const cross = (ux: number, uy: number, vx: number, vy: number) => ux * vy - uy * vx;
    const k2 = cross(gx, gy, fx, fy);
    const k1 = cross(ex, ey, fx, fy) + cross(hx, hy, gx, gy);
    const k0 = cross(hx, hy, ex, ey);
    const eps = 1e-7;
    let t: number;
    if (Math.abs(k2) < eps) {
        if (Math.abs(k1) < eps) return null;
        t = -k0 / k1;
    } else {
        const disc = k1 * k1 - 4 * k2 * k0;
        if (disc < 0) return null;
        const sq = Math.sqrt(disc);
        const t1 = (-k1 + sq) / (2 * k2);
        const t2 = (-k1 - sq) / (2 * k2);
        // Pick whichever root lands in [0,1]; prefer the closer one.
        const ok = (v: number) => v >= -1e-4 && v <= 1 + 1e-4;
        t = ok(t1) ? t1 : t2;
    }
    const denX = ex + gx * t, denY = ey + gy * t;
    let s: number;
    if (Math.abs(denX) > Math.abs(denY)) s = (hx - fx * t) / denX;
    else s = (hy - fy * t) / denY;
    if (s < -1e-4 || s > 1 + 1e-4 || t < -1e-4 || t > 1 + 1e-4) return null;
    return { s: Math.max(0, Math.min(1, s)), t: Math.max(0, Math.min(1, t)) };
}

/**
 * Rasterize the mesh into an offscreen canvas of `w × h` px (device-independent;
 * caller scales when drawing). Returns the canvas, or null if dimensions are
 * degenerate. The result is opaque RGB; alpha is applied by the caller.
 * Uses the fast even-grid path unless custom node `points` are set, in which
 * case each cell is a quad rasterized via inverse-bilinear (a warped mesh).
 */
export function rasterizeMesh(mesh: MeshGradient, w: number, h: number): HTMLCanvasElement | null {
    if (!isValidMesh(mesh)) return null;
    const W = Math.max(1, Math.min(1024, Math.round(w)));
    const H = Math.max(1, Math.min(1024, Math.round(h)));
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const img = ctx.createImageData(W, H);
    const data = img.data;
    const nodes = mesh.colors.map(parseHex);
    const { rows, cols } = mesh;
    const warped = !!(mesh.points && mesh.points.length === rows * cols);

    if (!warped) {
        for (let y = 0; y < H; y++) {
            const fv = (H > 1 ? y / (H - 1) : 0) * (rows - 1);
            const r0 = Math.floor(fv), r1 = Math.min(rows - 1, r0 + 1), tv = fv - r0;
            for (let x = 0; x < W; x++) {
                const fu = (W > 1 ? x / (W - 1) : 0) * (cols - 1);
                const c0 = Math.floor(fu), c1 = Math.min(cols - 1, c0 + 1), tu = fu - c0;
                const tl = nodes[r0 * cols + c0], tr = nodes[r0 * cols + c1];
                const bl = nodes[r1 * cols + c0], br = nodes[r1 * cols + c1];
                const topR = tl.r + (tr.r - tl.r) * tu, botR = bl.r + (br.r - bl.r) * tu;
                const topG = tl.g + (tr.g - tl.g) * tu, botG = bl.g + (br.g - bl.g) * tu;
                const topB = tl.b + (tr.b - tl.b) * tu, botB = bl.b + (br.b - bl.b) * tu;
                const i = (y * W + x) * 4;
                data[i] = topR + (botR - topR) * tv;
                data[i + 1] = topG + (botG - topG) * tv;
                data[i + 2] = topB + (botB - topB) * tv;
                data[i + 3] = 255;
            }
        }
    } else {
        // Per-cell quad rasterization. Node positions in buffer px.
        const pts = mesh.points!.map(p => ({ x: p.x * (W - 1), y: p.y * (H - 1) }));
        for (let r = 0; r < rows - 1; r++) {
            for (let c = 0; c < cols - 1; c++) {
                const iA = r * cols + c, iB = r * cols + c + 1, iC = (r + 1) * cols + c, iD = (r + 1) * cols + c + 1;
                const A = pts[iA], B = pts[iB], C = pts[iC], D = pts[iD];
                const ca = nodes[iA], cb = nodes[iB], cc = nodes[iC], cd = nodes[iD];
                const minX = Math.max(0, Math.floor(Math.min(A.x, B.x, C.x, D.x)));
                const maxX = Math.min(W - 1, Math.ceil(Math.max(A.x, B.x, C.x, D.x)));
                const minY = Math.max(0, Math.floor(Math.min(A.y, B.y, C.y, D.y)));
                const maxY = Math.min(H - 1, Math.ceil(Math.max(A.y, B.y, C.y, D.y)));
                for (let y = minY; y <= maxY; y++) {
                    for (let x = minX; x <= maxX; x++) {
                        const st = inverseBilinear(A, B, C, D, x, y);
                        if (!st) continue;
                        const s = st.s, t = st.t;
                        const topR = ca.r + (cb.r - ca.r) * s, botR = cc.r + (cd.r - cc.r) * s;
                        const topG = ca.g + (cb.g - ca.g) * s, botG = cc.g + (cd.g - cc.g) * s;
                        const topB = ca.b + (cb.b - ca.b) * s, botB = cc.b + (cd.b - cc.b) * s;
                        const i = (y * W + x) * 4;
                        data[i] = topR + (botR - topR) * t;
                        data[i + 1] = topG + (botG - topG) * t;
                        data[i + 2] = topB + (botB - topB) * t;
                        data[i + 3] = 255;
                    }
                }
            }
        }
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
}
