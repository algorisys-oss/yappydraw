/**
 * Live "Inflate" 3D effect (Illustrator's Effect ▸ 3D and Materials ▸ Inflate).
 *
 * Puffs a flat closed shape into a lit, rounded body without a 3D engine: the shape is a
 * HEIGHT FIELD, derived from the distance transform of its own silhouette. Every interior
 * pixel learns how far it is from the edge, distance maps to height through a dome profile,
 * and the surface normal falls out of differentiating that. One light shades it.
 *
 * The result is a raster the size of the element's box, which is the same shape as
 * `rasterizeMesh` / `rasterizePatternBuffer` — so it drops into the slot those occupy
 * (`applyComplexFills`) and inherits render-style parity, page clipping, PNG export and the
 * SVG `<pattern>` path without special-casing.
 *
 * See `docs/inflate-3d-spec.md`. The geometry maths below is deliberately free of canvas and
 * DOM so it can be tested directly; only `rasterizeInflate` touches a canvas.
 */
import type { DrawingElement, Inflate3D } from "../types";
import { getShapeGeometry } from "./shape-geometry";
import { getImage } from "./image-cache";


export const DEFAULT_INFLATE: Inflate3D = {
    bulge: 0.6,
    softness: 0.25,
    lightAngle: 135,
    lightHeight: 50,
    intensity: 0.75,
    ambient: 0.4,
    roughness: 0.35,
    metallic: 0,
    highlight: '#ffffff',
};

/** Longest side of the shading buffer. Shading is smooth and low-frequency, so upscaling from
 *  here is invisible — the same bargain `rasterizeMesh` makes at 256. */
const MAX_RES = 384;

export function hasInflate(el: DrawingElement): boolean {
    return !!el.inflate && (el.inflate.bulge ?? 0) > 0;
}

// ── The maths (no canvas, no DOM) ────────────────────────────────────────────

/**
 * Chamfer distance transform: for every set pixel of `mask`, its distance to the nearest
 * clear pixel, in pixels. Two sequential passes (forward then backward) over 4 neighbours
 * each, which is the standard 1 / √2 chamfer — a few percent off true Euclidean, and the
 * error is along diagonals where a blurred height field swallows it whole.
 *
 * Pixels outside the buffer count as clear, so a shape running off the edge of its own buffer
 * still falls to zero height there rather than inflating past the crop.
 */
export function distanceTransform(mask: Uint8Array, w: number, h: number): Float32Array {
    const d = new Float32Array(w * h);
    const FAR = w + h;
    for (let i = 0; i < w * h; i++) d[i] = mask[i] ? FAR : 0;

    const D1 = 1, D2 = Math.SQRT2;
    // Forward: left, up, and the two upper diagonals.
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w) + x;
            if (d[i] === 0) continue;
            let best = d[i];
            if (x > 0) best = Math.min(best, d[i - 1] + D1); else best = Math.min(best, D1);
            if (y > 0) best = Math.min(best, d[i - w] + D1); else best = Math.min(best, D1);
            if (x > 0 && y > 0) best = Math.min(best, d[i - w - 1] + D2);
            if (x < w - 1 && y > 0) best = Math.min(best, d[i - w + 1] + D2);
            d[i] = best;
        }
    }
    // Backward: right, down, and the two lower diagonals.
    for (let y = h - 1; y >= 0; y--) {
        for (let x = w - 1; x >= 0; x--) {
            const i = (y * w) + x;
            if (d[i] === 0) continue;
            let best = d[i];
            if (x < w - 1) best = Math.min(best, d[i + 1] + D1); else best = Math.min(best, D1);
            if (y < h - 1) best = Math.min(best, d[i + w] + D1); else best = Math.min(best, D1);
            if (x < w - 1 && y < h - 1) best = Math.min(best, d[i + w + 1] + D2);
            if (x > 0 && y < h - 1) best = Math.min(best, d[i + w - 1] + D2);
            d[i] = best;
        }
    }
    return d;
}

/**
 * Distance → height, through a dome: `h = R·√(1 − (1 − t)²)`, `t = d / dmax`.
 *
 * Zero at the rim and maximum along the shape's spine, with the tangent vertical at the
 * edge — which is what makes the rim read as curving away rather than as a chamfer. `R` is
 * the deepest distance in the shape (its inscribed radius) scaled by `bulge`, so the puff is
 * proportional to the shape rather than to an absolute number of pixels.
 */
export function heightField(dist: Float32Array, bulge: number): Float32Array {
    let dmax = 0;
    for (let i = 0; i < dist.length; i++) if (dist[i] > dmax) dmax = dist[i];
    const out = new Float32Array(dist.length);
    if (dmax <= 0) return out;
    const R = dmax * bulge;
    for (let i = 0; i < dist.length; i++) {
        const t = Math.min(1, dist[i] / dmax);
        const u = 1 - t;
        out[i] = R * Math.sqrt(Math.max(0, 1 - (u * u)));
    }
    return out;
}

/**
 * Separable box blur, run `passes` times — three passes approximate a Gaussian closely enough
 * for a field nothing looks at directly.
 *
 * This is not cosmetic. The distance transform creases along the shape's medial axis, and
 * differentiating a crease gives a hard ridge: the first working version of this effect drew
 * a starburst out of every blob. The silhouette is unaffected (the mask still clips), so the
 * field can be smoothed as much as the form wants.
 */
export function blurField(src: Float32Array, w: number, h: number, radius: number, passes = 3): Float32Array {
    const r = Math.max(0, Math.round(radius));
    if (r === 0 || passes <= 0) return src;
    const n = (2 * r) + 1;
    let cur = src;
    const tmp = new Float32Array(w * h);
    const out = new Float32Array(w * h);
    const clampX = (x: number) => (x < 0 ? 0 : (x > w - 1 ? w - 1 : x));
    const clampY = (y: number) => (y < 0 ? 0 : (y > h - 1 ? h - 1 : y));

    for (let p = 0; p < passes; p++) {
        for (let y = 0; y < h; y++) {
            const row = y * w;
            let acc = 0;
            for (let k = -r; k <= r; k++) acc += cur[row + clampX(k)];
            for (let x = 0; x < w; x++) {
                tmp[row + x] = acc / n;
                acc += cur[row + clampX(x + r + 1)] - cur[row + clampX(x - r)];
            }
        }
        for (let x = 0; x < w; x++) {
            let acc = 0;
            for (let k = -r; k <= r; k++) acc += tmp[(clampY(k) * w) + x];
            for (let y = 0; y < h; y++) {
                out[(y * w) + x] = acc / n;
                acc += tmp[(clampY(y + r + 1) * w) + x] - tmp[(clampY(y - r) * w) + x];
            }
        }
        // Copy rather than point at `out`: the next pass overwrites `out` in place while
        // still reading `cur`, and sharing the two silently squares the blur.
        cur = out.slice();
    }
    return cur;
}

/** Unit light vector for a page-space angle/height, in the buffer's coordinate frame (y down).
 *  `angleDeg` is the direction the light comes FROM: 0 = the right, increasing anticlockwise. */
export function lightVector(angleDeg: number, heightDeg: number): [number, number, number] {
    const a = (angleDeg * Math.PI) / 180;
    const e = (Math.max(0, Math.min(90, heightDeg)) * Math.PI) / 180;
    const c = Math.cos(e);
    return [Math.cos(a) * c, -Math.sin(a) * c, Math.sin(e)];
}

export interface ShadeParams {
    light: [number, number, number];
    intensity: number;
    ambient: number;
    roughness: number;
    /** Specular colour, 0..255 per channel. */
    highlight: [number, number, number];
}

/**
 * Shade a height field into RGBA. `albedo(i, out)` fills `out` with the surface colour at
 * pixel `i` (0..255 per channel) — a constant for a solid fill, an image sample for a
 * material. `alpha` carries the mask's coverage so the rim antialiases.
 *
 * Diffuse light multiplies the albedo and is clamped to 1: a canvas cannot brighten past its
 * own colour by multiplying, so the key light darkens and the SPECULAR is what adds light
 * back. That split is also why `ambient` reads as "how dark does the shadow side go".
 */
export function shadeHeightField(
    height: Float32Array,
    alpha: Uint8Array,
    w: number,
    h: number,
    p: ShadeParams,
    albedo: (i: number, out: [number, number, number]) => void,
): Uint8ClampedArray {
    const px = new Uint8ClampedArray(w * h * 4);
    const [lx, ly, lz] = p.light;
    // Blinn-Phong half-vector: the view is straight on, so V = (0, 0, 1).
    const hx = lx, hy = ly, hz = lz + 1;
    const hlen = Math.sqrt((hx * hx) + (hy * hy) + (hz * hz)) || 1;
    const rough = Math.max(0.02, Math.min(1, p.roughness));
    const shininess = 2 / (rough * rough);
    // A full-strength Blinn-Phong lobe on top of a 2.5D fake reads as blown-out plastic —
    // the highlight clips to white and eats the surface colour under it. Held back to just
    // over half, which is where the sheen still says "glossy" without erasing the albedo.
    const specStrength = (1 - rough) * 0.55;
    const base: [number, number, number] = [0, 0, 0];

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w) + x;
            const a = alpha[i];
            if (a === 0) continue;

            // Central differences, clamped at the border so the outermost ring of pixels
            // still gets a normal instead of a seam.
            const xm = x > 0 ? i - 1 : i, xp = x < w - 1 ? i + 1 : i;
            const ym = y > 0 ? i - w : i, yp = y < h - 1 ? i + w : i;
            const nx = -(height[xp] - height[xm]) / 2;
            const ny = -(height[yp] - height[ym]) / 2;
            // `Math.hypot` is a full order of magnitude slower than this in V8, and this loop
            // runs once per pixel of a 384px buffer — it was most of the cost of a slider drag.
            const len = Math.sqrt((nx * nx) + (ny * ny) + 1);

            const ndl = ((nx * lx) + (ny * ly) + lz) / len;
            const diffuse = ndl > 0 ? ndl : 0;
            const lit = Math.min(1, p.ambient + (p.intensity * diffuse));

            let spec = 0;
            if (specStrength > 0) {
                const ndh = ((nx * hx) + (ny * hy) + hz) / (len * hlen);
                if (ndh > 0) spec = Math.pow(ndh, shininess) * specStrength;
            }

            albedo(i, base);
            const j = i * 4;
            px[j] = (base[0] * lit) + (p.highlight[0] * spec);
            px[j + 1] = (base[1] * lit) + (p.highlight[1] * spec);
            px[j + 2] = (base[2] * lit) + (p.highlight[2] * spec);
            px[j + 3] = a;
        }
    }
    return px;
}

// ── Rasterisation (canvas) ───────────────────────────────────────────────────

type CacheEntry = { hash: string; buf: HTMLCanvasElement };
const cache = new Map<string, CacheEntry>();
// Each entry is up to 384x384x4 bytes of canvas, so this is a memory budget as much as a hit
// rate: 24 is roughly 14 MB worst case, and more inflated objects than that on one screen is
// already past what the effect is for.
const MAX_CACHE = 24;

/** Everything that can change the shaded buffer. A miss costs a full re-rasterisation, so
 *  this has to cover the inputs exactly — a slider drag must miss, a pan must hit. */
function inflateHash(el: DrawingElement, geo: string, isDarkMode: boolean, imgReady: boolean): string {
    const f = el.inflate!;
    return [
        geo, Math.round(el.width), Math.round(el.height), Math.round(el.angle ?? 0),
        f.bulge, f.softness, f.lightAngle, f.lightHeight, f.intensity, f.ambient,
        f.roughness, f.metallic, f.highlight,
        el.backgroundColor, el.fillStyle, el.backgroundImage ? `img:${imgReady}` : '', isDarkMode,
    ].join('|');
}

/** Draw the element's centre-local geometry into `ctx`, which is already scaled and
 *  translated so (-w/2, -h/2)..(w/2, h/2) covers the buffer. */
function traceGeometry(ctx: CanvasRenderingContext2D, geo: any): void {
    if (!geo) return;
    switch (geo.type) {
        case 'path': ctx.fill(new Path2D(geo.path), geo.evenOdd ? 'evenodd' : 'nonzero'); break;
        case 'rect': ctx.fillRect(geo.x, geo.y, geo.w, geo.h); break;
        case 'ellipse':
            ctx.beginPath();
            ctx.ellipse(geo.cx, geo.cy, Math.abs(geo.rx), Math.abs(geo.ry), 0, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'points': {
            if (!geo.points?.length) return;
            ctx.beginPath();
            ctx.moveTo(geo.points[0].x, geo.points[0].y);
            for (let i = 1; i < geo.points.length; i++) ctx.lineTo(geo.points[i].x, geo.points[i].y);
            ctx.closePath();
            ctx.fill();
            break;
        }
        case 'multi': for (const s of geo.shapes) traceGeometry(ctx, s); break;
    }
}

/** `#rgb` / `#rrggbb` to 0..255 channels. Anything else — `transparent`, a css name, an
 *  `oklch()` — falls back rather than guessing, because a wrong albedo is a wrong object. */
const rgbOf = (color: string | undefined, fallback: [number, number, number]): [number, number, number] => {
    if (typeof color !== 'string') return fallback;
    let h = color.trim().replace(/^#/, '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return fallback;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

/**
 * Rasterise the shaded body for an inflated element, sized to its box. Returns null when the
 * element has no inflate, no area, or no traceable outline — callers fall back to the flat fill.
 *
 * Cached per element on `inflateHash`; a cache hit is a Map lookup.
 */
export function rasterizeInflate(el: DrawingElement, isDarkMode = false): HTMLCanvasElement | null {
    if (!hasInflate(el)) return null;
    const w = Math.abs(el.width), h = Math.abs(el.height);
    if (!(w > 0) || !(h > 0)) return null;

    const geo = getShapeGeometry(el);
    if (!geo) return null;

    const useImage = el.fillStyle === 'image' && !!el.backgroundImage;
    const img = useImage ? (getImage(el.backgroundImage!) as HTMLImageElement | null) : null;
    const imgReady = !!(img && img.width && img.height);

    const hash = inflateHash(el, JSON.stringify(geo), isDarkMode, imgReady);
    const hit = cache.get(el.id);
    if (hit && hit.hash === hash) return hit.buf;

    const scale = Math.min(1, MAX_RES / Math.max(w, h));
    const bw = Math.max(2, Math.round(w * scale));
    const bh = Math.max(2, Math.round(h * scale));

    // 1. Mask — the shape's own silhouette at buffer resolution.
    const maskC = document.createElement('canvas');
    maskC.width = bw; maskC.height = bh;
    const mctx = maskC.getContext('2d', { willReadFrequently: true });
    if (!mctx) return null;
    mctx.fillStyle = '#fff';
    mctx.translate(bw / 2, bh / 2);
    mctx.scale(bw / w, bh / h);
    traceGeometry(mctx, geo);
    const maskPx = mctx.getImageData(0, 0, bw, bh).data;

    const alpha = new Uint8Array(bw * bh);
    const solid = new Uint8Array(bw * bh);
    let any = false;
    for (let i = 0; i < bw * bh; i++) {
        const a = maskPx[(i * 4) + 3];
        alpha[i] = a;
        // The distance transform wants a hard in/out; the antialiased rim would otherwise
        // read as a ring of half-height and flatten the very edge.
        if (a > 127) { solid[i] = 1; any = true; }
    }
    if (!any) return null;

    // 2. Height field, smoothed enough to differentiate cleanly.
    const f = { ...DEFAULT_INFLATE, ...el.inflate! };
    const dist = distanceTransform(solid, bw, bh);
    let height = heightField(dist, Math.max(0, f.bulge));
    const softRadius = Math.max(1, Math.round(Math.min(bw, bh) * 0.02 * (1 + ((f.softness ?? 0.25) * 6))));
    height = blurField(height, bw, bh, softRadius);

    // 3. Albedo — a solid colour, or the material image fitted to the box.
    const baseRgb = rgbOf(el.backgroundColor, isDarkMode ? [90, 90, 96] : [200, 200, 206]);
    let sampleAlbedo: (i: number, out: [number, number, number]) => void;
    if (imgReady) {
        const ic = document.createElement('canvas');
        ic.width = bw; ic.height = bh;
        const ictx = ic.getContext('2d', { willReadFrequently: true });
        if (!ictx) return null;
        // Cover-fit, matching the image fill's default so switching the material on and off
        // does not also move the picture.
        const ia = img!.width / img!.height, ba = bw / bh;
        let dw = bw, dh = bh;
        if (ia > ba) dw = bh * ia; else dh = bw / ia;
        ictx.drawImage(img!, (bw - dw) / 2, (bh - dh) / 2, dw, dh);
        const ipx = ictx.getImageData(0, 0, bw, bh).data;
        sampleAlbedo = (i, out) => { const j = i * 4; out[0] = ipx[j]; out[1] = ipx[j + 1]; out[2] = ipx[j + 2]; };
    } else {
        sampleAlbedo = (_i, out) => { out[0] = baseRgb[0]; out[1] = baseRgb[1]; out[2] = baseRgb[2]; };
    }

    // 4. Shade. The light belongs to the page, so the element's own rotation is taken back
    //    out — otherwise turning a shape drags its highlight round with it.
    const metallic = Math.max(0, Math.min(1, f.metallic ?? 0));
    const specRgb = rgbOf(f.highlight, [255, 255, 255]);
    const tinted: [number, number, number] = [
        (specRgb[0] * (1 - metallic)) + (baseRgb[0] * metallic),
        (specRgb[1] * (1 - metallic)) + (baseRgb[1] * metallic),
        (specRgb[2] * (1 - metallic)) + (baseRgb[2] * metallic),
    ];
    const px = shadeHeightField(height, alpha, bw, bh, {
        light: lightVector((f.lightAngle ?? 135) - (el.angle ?? 0), f.lightHeight ?? 50),
        intensity: Math.max(0, Math.min(1, f.intensity ?? 0.75)),
        ambient: Math.max(0, Math.min(1, f.ambient ?? 0.4)),
        roughness: f.roughness ?? 0.35,
        highlight: tinted,
    }, sampleAlbedo);

    const out = document.createElement('canvas');
    out.width = bw; out.height = bh;
    const octx = out.getContext('2d');
    if (!octx) return null;
    // Built through createImageData rather than `new ImageData(px, …)`: the constructor's
    // type demands a Uint8ClampedArray backed specifically by an ArrayBuffer, and a plain
    // one is ArrayBufferLike. Copying in sidesteps the distinction and costs one memcpy.
    const image = octx.createImageData(bw, bh);
    image.data.set(px);
    octx.putImageData(image, 0, 0);

    if (cache.size >= MAX_CACHE) cache.clear();
    cache.set(el.id, { hash, buf: out });
    return out;
}

/** Drop cached buffers — call when elements are deleted wholesale (document load, clear). */
export function clearInflateCache(): void {
    cache.clear();
}
