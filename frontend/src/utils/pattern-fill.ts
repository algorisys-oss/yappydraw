/**
 * Vector pattern fills (Illustrator-style swatch patterns).
 *
 * A `PatternFill` is a small, parameterised, *seamless* repeating motif (stripes,
 * grid, dots, checker, crosshatch) painted in a foreground colour over an optional
 * background. Rendering mirrors the mesh/image fill strategy: we rasterize the
 * motif to an offscreen canvas tile, repeat it into an element-sized buffer, and
 * the render pipeline draws that buffer clipped to the shape outline — so both the
 * `sketch` and `architectural` styles get the fill for free (parity is automatic),
 * and any `IRenderer` that supports `drawImage` (canvas *and* the SVG exporter)
 * works. True-vector SVG export emits a real `<pattern>` (see `svg-paint.ts`).
 */

import type { PatternFill, PatternType } from "../types";
import { getImage } from "./image-cache";

/** Presets surfaced in the fill UI (order = display order). 'custom' is created
 *  via "Make Pattern from Selection", not picked here. */
export const PATTERN_PRESETS: { type: PatternType; label: string }[] = [
    { type: 'stripes', label: 'Stripes' },
    { type: 'grid', label: 'Grid' },
    { type: 'dots', label: 'Dots' },
    { type: 'checker', label: 'Checker' },
    { type: 'crosshatch', label: 'Crosshatch' },
    { type: 'noise', label: 'Noise' },
    { type: 'grunge', label: 'Grunge' },
];

/** The procedural texture motifs — grain rather than a geometric motif. They ignore
 *  `spacing` (they size their own tile) and read `strokeWidth` as the grain size. */
const isTextureType = (t: PatternType) => t === 'noise' || t === 'grunge';

/** A fresh pattern fill seeded from a colour. Procedural textures get a random
 *  seed once, at creation — after that the motif is stable forever. */
export function defaultPatternFill(color = '#000000', type: PatternType = 'stripes'): PatternFill {
    const base: PatternFill = { type, color, background: 'transparent', scale: 1, spacing: 12, strokeWidth: 2, angle: 0 };
    if (isTextureType(type)) base.seed = Math.floor(Math.random() * 100000);
    return base;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function resolve(p: PatternFill) {
    const scale = clamp(p.scale ?? 1, 0.1, 8);
    return {
        type: p.type,
        spacing: Math.max(2, (p.spacing ?? 12) * scale),
        sw: Math.max(0.5, (p.strokeWidth ?? 2) * scale),
        fg: p.color || '#000000',
        bg: p.background && p.background !== 'transparent' ? p.background : null,
    };
}

// ── Procedural texture (noise / grunge) ──────────────────────────────────────
// Deterministic by design: a Math.random() tile would shimmer on every redraw and
// differ between the canvas and the SVG export, so everything is driven by `seed`.

/** Integer hash → [0,1). */
function hash2(x: number, y: number, seed: number): number {
    let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1274126177);
    h = (h ^ (h >>> 13)) >>> 0;
    h = Math.imul(h, 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const fade = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Value noise on a lattice that wraps every `period` cells → the tile is seamless. */
function valueNoise(x: number, y: number, period: number, seed: number): number {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const w = (v: number) => ((v % period) + period) % period;
    const x0 = w(xi), x1 = w(xi + 1), y0 = w(yi), y1 = w(yi + 1);
    const u = fade(xf), v = fade(yf);
    return lerp(
        lerp(hash2(x0, y0, seed), hash2(x1, y0, seed), u),
        lerp(hash2(x0, y1, seed), hash2(x1, y1, seed), u),
        v,
    );
}

/** Resolve any CSS colour to [r,g,b]. Fast path for hex; canvas fallback otherwise. */
function rgbOf(color: string): [number, number, number] {
    const c = (color || '#000000').trim();
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
    if (m) {
        const h = m[1].length === 3 ? m[1].split('').map(ch => ch + ch).join('') : m[1];
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    try {
        const cv = document.createElement('canvas');
        cv.width = cv.height = 1;
        const ctx = cv.getContext('2d');
        if (!ctx) return [0, 0, 0];
        ctx.fillStyle = '#000000';
        ctx.fillStyle = c;              // invalid colours leave the previous value → black
        ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2]];
    } catch { return [0, 0, 0]; }
}

/**
 * Render a seamless grain tile. `noise` is per-cell film grain (uniform alpha);
 * `grunge` is 3-octave value noise thresholded into soft blotches. Both paint the
 * foreground colour at a varying alpha, so the intended use is a full-composition
 * rectangle at low opacity with blendMode 'multiply' — enough to break up large
 * flat areas without reading as a separate object.
 */
function makeTextureTile(p: PatternFill, ss: number): HTMLCanvasElement | null {
    const scale = clamp(p.scale ?? 1, 0.1, 8);
    const seed = Math.floor(p.seed ?? 1) | 0;
    // Big tiles: at overlay opacities the repeat is invisible for grain, and grunge
    // blotches need the room. Capped so a huge scale can't allocate a monster canvas.
    const base = p.type === 'grunge' ? 256 : 128;
    // Grain cell in device px — `strokeWidth` doubles as grain size for these motifs.
    const cell = Math.max(1, Math.round(clamp(p.strokeWidth ?? 2, 0.5, 32) * scale * ss));
    // The tile side MUST be a whole number of cells. Otherwise the partial cell at the
    // right/bottom edge doesn't line up with the full cell that starts the next repeat,
    // and the tiling shows a faint grid of seams — visible even at overlay opacity.
    // Snapping the side also makes the grunge lattice period exact, so its octaves wrap.
    const rawSide = clamp(base * scale, 32, 512) * ss;
    const cells = Math.max(1, Math.round(rawSide / cell));
    const side = cells * cell;

    const cv = document.createElement('canvas');
    cv.width = side; cv.height = side;
    const ctx = cv.getContext('2d');
    if (!ctx) return null;

    if (p.background && p.background !== 'transparent') {
        ctx.fillStyle = p.background;
        ctx.fillRect(0, 0, side, side);
    }

    const [r, g, b] = rgbOf(p.color || '#000000');
    const img = ctx.getImageData(0, 0, side, side);
    const px = img.data;

    for (let y = 0; y < side; y++) {
        for (let x = 0; x < side; x++) {
            let a: number;
            if (p.type === 'grunge') {
                // fBm: 3 octaves, each wrapping on its own period so the tile still seams.
                const u = (x / side) * cells, v = (y / side) * cells;
                let n = 0, amp = 0.5, tot = 0, per = Math.max(1, Math.round(cells));
                for (let o = 0; o < 3; o++) {
                    n += valueNoise(u * (1 << o), v * (1 << o), per * (1 << o), seed + o * 101) * amp;
                    tot += amp; amp *= 0.5;
                }
                n /= tot || 1;
                // Threshold into blotches; gamma keeps the mid-tones from muddying.
                a = Math.pow(clamp((n - 0.34) / 0.44, 0, 1), 1.4);
            } else {
                a = hash2(Math.floor(x / cell), Math.floor(y / cell), seed);
            }
            const i = (y * side + x) * 4;
            const alpha = Math.round(clamp(a, 0, 1) * 255);
            // Composite over whatever the background fill left behind.
            const inv = alpha / 255, keep = 1 - inv;
            px[i] = Math.round(r * inv + px[i] * keep);
            px[i + 1] = Math.round(g * inv + px[i + 1] * keep);
            px[i + 2] = Math.round(b * inv + px[i + 2] * keep);
            px[i + 3] = Math.min(255, px[i + 3] + alpha);
        }
    }
    ctx.putImageData(img, 0, 0);
    return cv;
}

/**
 * Render ONE seamless tile of the motif to an offscreen canvas. `ss` supersamples
 * the tile (all dimensions scaled) so the caller can downscale for crisp lines.
 * The tile's CSS (element-space) size is `canvas.width / ss`.
 */
export function makePatternTile(p: PatternFill, ss = 1): HTMLCanvasElement | null {
    // Custom pattern: draw the captured artwork raster into the tile. Uses the
    // shared image cache (async load + redraw on completion), exactly like image
    // fills — returns null until the image is decoded.
    if (p.type === 'custom') {
        const img = p.tile ? getImage(p.tile) : null;
        if (!img || !img.width || !img.height) return null;
        const scale = clamp(p.scale ?? 1, 0.1, 8);
        const tw = Math.max(1, Math.round((p.tileWidth || img.width) * scale * ss));
        const th = Math.max(1, Math.round((p.tileHeight || img.height) * scale * ss));
        const cv = document.createElement('canvas');
        cv.width = tw; cv.height = th;
        const ctx = cv.getContext('2d');
        if (!ctx) return null;
        if (p.background && p.background !== 'transparent') { ctx.fillStyle = p.background; ctx.fillRect(0, 0, tw, th); }
        ctx.drawImage(img, 0, 0, tw, th);
        return cv;
    }

    // Procedural grain sizes its own tile and paints per-pixel — not a motif.
    if (isTextureType(p.type)) return makeTextureTile(p, ss);

    const r = resolve(p);
    const s = r.spacing * ss;
    const sw = r.sw * ss;
    const tw = r.type === 'checker' ? s * 2 : s;
    const th = tw;

    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(tw));
    cv.height = Math.max(1, Math.round(th));
    const ctx = cv.getContext('2d');
    if (!ctx) return null;

    if (r.bg) { ctx.fillStyle = r.bg; ctx.fillRect(0, 0, cv.width, cv.height); }
    ctx.fillStyle = r.fg;
    ctx.strokeStyle = r.fg;
    ctx.lineWidth = sw;
    ctx.lineCap = 'square';

    switch (r.type) {
        case 'stripes':
            // Horizontal band at the tile top → continuous horizontal stripes.
            ctx.fillRect(0, 0, cv.width, sw);
            break;
        case 'grid':
            ctx.fillRect(0, 0, cv.width, sw);
            ctx.fillRect(0, 0, sw, cv.height);
            break;
        case 'dots': {
            const rad = Math.max(0.5, Math.min(s * 0.5 - 0.5, sw));
            ctx.beginPath();
            ctx.arc(cv.width / 2, cv.height / 2, rad, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        case 'checker':
            ctx.fillRect(0, 0, s, s);
            ctx.fillRect(s, s, s, s);
            break;
        case 'crosshatch':
            // Corner-to-corner diagonals tile seamlessly into continuous hatch lines.
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(cv.width, cv.height);
            ctx.moveTo(0, cv.height); ctx.lineTo(cv.width, 0);
            ctx.stroke();
            break;
    }
    return cv;
}

/**
 * Build an element-sized buffer (w×h, capped) with the motif repeated and rotated
 * by `angle`. Drawn by the render pipeline at exactly w×h clipped to the shape, so
 * at the common supersample (ss = 2) lines stay crisp. Returns null if unbuildable.
 */
export function rasterizePatternBuffer(p: PatternFill, w: number, h: number): HTMLCanvasElement | null {
    if (w <= 0 || h <= 0) return null;
    const CAP = 2048;
    const ss = Math.min(2, CAP / Math.max(w, h)); // supersample small shapes, downscale huge ones
    if (!(ss > 0)) return null;

    const tile = makePatternTile(p, ss);
    if (!tile) return null;

    const bw = Math.max(1, Math.round(w * ss));
    const bh = Math.max(1, Math.round(h * ss));
    const cv = document.createElement('canvas');
    cv.width = bw; cv.height = bh;
    const ctx = cv.getContext('2d');
    if (!ctx) return null;

    const pat = ctx.createPattern(tile, 'repeat');
    if (!pat) return null;
    ctx.fillStyle = pat;

    const angle = ((p.angle || 0) * Math.PI) / 180;
    if (angle) {
        // Rotate about the buffer centre and fill an oversized square so the rotated
        // pattern still covers every corner of the buffer.
        ctx.translate(bw / 2, bh / 2);
        ctx.rotate(angle);
        const d = Math.ceil(Math.sqrt(bw * bw + bh * bh));
        ctx.fillRect(-d / 2, -d / 2, d, d);
    } else {
        ctx.fillRect(0, 0, bw, bh);
    }
    return cv;
}
