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

/** Presets surfaced in the fill UI (order = display order). */
export const PATTERN_PRESETS: { type: PatternType; label: string }[] = [
    { type: 'stripes', label: 'Stripes' },
    { type: 'grid', label: 'Grid' },
    { type: 'dots', label: 'Dots' },
    { type: 'checker', label: 'Checker' },
    { type: 'crosshatch', label: 'Crosshatch' },
];

/** A fresh pattern fill seeded from a colour. */
export function defaultPatternFill(color = '#000000', type: PatternType = 'stripes'): PatternFill {
    return { type, color, background: 'transparent', scale: 1, spacing: 12, strokeWidth: 2, angle: 0 };
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

/**
 * Render ONE seamless tile of the motif to an offscreen canvas. `ss` supersamples
 * the tile (all dimensions scaled) so the caller can downscale for crisp lines.
 * The tile's CSS (element-space) size is `canvas.width / ss`.
 */
export function makePatternTile(p: PatternFill, ss = 1): HTMLCanvasElement | null {
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
