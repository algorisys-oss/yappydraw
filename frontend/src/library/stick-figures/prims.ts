/**
 * Drawing primitives shared by every "extra" a stick figure can wear.
 *
 * Faces and hair derive from the head circle (./face.ts); trousers and shoes derive
 * from the limb polylines (./garments.ts). Both express their result as the SAME
 * primitive union, which is what lets one renderer draw all of them: the canvas
 * `StickRigRenderer` consumes `Prim[]` directly (architectural AND sketch), and
 * `primToSvg` serialises the identical geometry for the SVG library, panel previews
 * and bake. Adding a new kind of clothing therefore costs no renderer changes.
 *
 * Everything here is pure: no DOM, no store, no Solid.
 */

/**
 * A mark in *absolute* coordinates. `w` is an absolute stroke width; `fill` present
 * means the mark is filled as well as stroked.
 */
export type Prim =
    | { k: 'dot'; x: number; y: number; r: number }
    | { k: 'ring'; x: number; y: number; r: number; w: number; fill?: string }
    | { k: 'oval'; x: number; y: number; rx: number; ry: number; w: number; fill?: string }
    | { k: 'arc'; x: number; y: number; r: number; a0: number; a1: number; w: number }
    | { k: 'poly'; pts: [number, number][]; w: number }
    | { k: 'path'; d: string; w: number; fill?: string };

/** Back-compat alias — faces were the first consumer and named the type. */
export type FacePrim = Prim;

export const r1 = (n: number) => Math.round(n * 10) / 10;
export const P = Math.PI;

export type Pt = [number, number];

/** Absolute-arc `d` string for an arc primitive. */
export function arcD(x: number, y: number, r: number, a0: number, a1: number): string {
    const x0 = x + Math.cos(a0) * r, y0 = y + Math.sin(a0) * r;
    const x1 = x + Math.cos(a1) * r, y1 = y + Math.sin(a1) * r;
    const large = Math.abs(a1 - a0) > P ? 1 : 0;
    return `M${r1(x0)} ${r1(y0)}A${r1(r)} ${r1(r)} 0 ${large} 1 ${r1(x1)} ${r1(y1)}`;
}

/** A closed polygon as an SVG `d` string. */
export const polyD = (pts: Pt[]): string =>
    `M${pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L')}Z`;

/** One primitive as SVG markup (role/paint applied by the caller's `<g>`). */
export function primToSvg(p: Prim): string {
    switch (p.k) {
        // A solid disc drawn with the STROKE (half-radius circle, full-radius pen)
        // so a pupil recolours with the outline instead of needing its own fill.
        case 'dot':
            return `<circle cx="${r1(p.x)}" cy="${r1(p.y)}" r="${r1(p.r / 2)}" stroke-width="${r1(p.r)}"/>`;
        case 'ring':
            return `<circle cx="${r1(p.x)}" cy="${r1(p.y)}" r="${r1(p.r)}" stroke-width="${r1(p.w)}"${p.fill ? ` fill="${p.fill}"` : ''}/>`;
        case 'oval':
            return `<ellipse cx="${r1(p.x)}" cy="${r1(p.y)}" rx="${r1(p.rx)}" ry="${r1(p.ry)}" stroke-width="${r1(p.w)}"${p.fill ? ` fill="${p.fill}"` : ''}/>`;
        case 'arc':
            return `<path d="${arcD(p.x, p.y, p.r, p.a0, p.a1)}" stroke-width="${r1(p.w)}"/>`;
        case 'poly':
            return `<path d="M${p.pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L')}" stroke-width="${r1(p.w)}"/>`;
        case 'path':
            return `<path d="${p.d}" stroke-width="${r1(p.w)}"${p.fill ? ` fill="${p.fill}"` : ''}/>`;
    }
}

// ─── Polyline helpers (used by limb-derived geometry) ───────────────────────

/** Euclidean length of a polyline. */
export function polyLength(pts: Pt[]): number {
    let n = 0;
    for (let i = 1; i < pts.length; i++) n += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return n;
}

/**
 * Resample a polyline to `n + 1` evenly spaced points by arc length. Offsetting reads
 * much better on an even sampling: a raw hip→knee→ankle chain has only two segments,
 * so a tapering width would kink at the knee instead of flowing.
 */
export function resample(pts: Pt[], n = 12): Pt[] {
    if (pts.length < 2) return pts.slice();
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
        cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    const total = cum[cum.length - 1];
    if (total <= 0) return pts.slice();
    const out: Pt[] = [];
    for (let s = 0; s <= n; s++) {
        const target = (total * s) / n;
        let i = 1;
        while (i < cum.length - 1 && cum[i] < target) i++;
        const seg = cum[i] - cum[i - 1] || 1;
        const u = (target - cum[i - 1]) / seg;
        out.push([
            pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u,
            pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u,
        ]);
    }
    return out;
}

/** Truncate a polyline to the first `frac` of its arc length. */
export function truncate(pts: Pt[], frac: number): Pt[] {
    const n = Math.max(2, Math.round(12 * Math.max(0.05, Math.min(1, frac))));
    return resample(pts, 12).slice(0, n + 1);
}

/**
 * Inflate a polyline into a closed outline whose half-width at arc-length fraction
 * `t ∈ [0,1]` is `halfWidth(t)`. Walks down one side and back up the other.
 *
 * This is the whole trick behind garments: a limb is already a polyline, so a garment
 * is that polyline with a width profile — which means it follows ANY pose for free,
 * the same way a face follows the head circle.
 */
export function offsetOutline(pts: Pt[], halfWidth: (t: number) => number): Pt[] {
    const p = resample(pts, 12);
    const left: Pt[] = [], right: Pt[] = [];
    for (let i = 0; i < p.length; i++) {
        // Central difference for a smooth normal; endpoints use their one neighbour.
        const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
        let dx = b[0] - a[0], dy = b[1] - a[1];
        const m = Math.hypot(dx, dy) || 1;
        dx /= m; dy /= m;
        const nx = -dy, ny = dx;                    // left-hand normal
        const h = halfWidth(i / (p.length - 1));
        left.push([p[i][0] + nx * h, p[i][1] + ny * h]);
        right.push([p[i][0] - nx * h, p[i][1] - ny * h]);
    }
    return [...left, ...right.reverse()];
}
