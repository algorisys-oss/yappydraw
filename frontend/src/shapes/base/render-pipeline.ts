import type { Options } from "roughjs/bin/core";
import type { DrawingElement } from "../../types";
import { getShapeGeometry } from "../../utils/shape-geometry";
import { geometryToDs } from "../../utils/geometry-to-ds";
import { getFontString, measureContainerText } from "../../utils/text-utils";
import { layoutRichText, buildSpanFontString } from "../../utils/rich-text-utils";
import type { RenderContext } from "./types";
import { getUIShapeDef } from "../../config/ui-shape-defs";
import { drawTextAlongPath, getOutlinePath, isClosedShapeForText } from "../../utils/text-on-path";
import { buildFilterString } from "../../utils/image-filter-utils";
import { getImage } from "../../utils/image-cache";
import { rasterizeMesh } from "../../utils/mesh-gradient";
import { rasterizePatternBuffer } from "../../utils/pattern-fill";
import type { IRenderer } from "../../rendering/IRenderer";

// ── colour helpers (for dark-mode adjustColor) ─────────────────────────────
/** Parse #rgb / #rrggbb / #rrggbbaa / rgb()/rgba() → {r,g,b,a}; null if unrecognised. */
function parseColorRgba(c: string): { r: number; g: number; b: number; a: number } | null {
    const s = c.trim().toLowerCase();
    if (s === 'transparent' || s === 'none') return null;
    if (s[0] === '#') {
        let hex = s.slice(1);
        if (hex.length === 3) hex = hex.split('').map(ch => ch + ch).join('');
        if (hex.length === 6 || hex.length === 8) {
            const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
            const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
            if ([r, g, b].every(n => !isNaN(n))) return { r, g, b, a };
        }
        return null;
    }
    const m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
    if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
    return null;
}
/** HSL (h,s,l in 0..1) → {r,g,b} 0..255. */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    if (s <= 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v }; }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue = (t: number) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
    return { r: Math.round(hue(h + 1 / 3) * 255), g: Math.round(hue(h) * 255), b: Math.round(hue(h - 1 / 3) * 255) };
}

// Per-colour dark-mode adjustment cache (keyed by the input colour string).
const _darkAdjustCache = new Map<string, string>();

// Sketchy line-based fill styles. In sketch mode RoughJS hatches them; in
// architectural mode we draw clean hatch lines (applyHatchFill) instead.
const HATCH_FILL_STYLES = ['hachure', 'cross-hatch', 'zigzag', 'dashed', 'zigzag-line'];

export class RenderPipeline {
    /**
     * Dark-mode colour mapping. See docs/design/dark-mode.md.
     *
     * Goal: a near-black drawing should read as light on the dark canvas (and vice-versa),
     * while SATURATED colours (yellow, red, blue, …) stay true. We do this per-colour at
     * render time (NOT a global CSS canvas filter, which mangles saturated colours):
     * invert the LIGHTNESS, weighted by how grey the colour is —
     *   newL = L + (1 - 2L) · (1 - S)
     * so S≈0 (grey/black/white) → full lightness swap; S≈1 (vivid) → unchanged.
     * Hue & saturation are preserved. `transparent`/unparseable colours pass through.
     */
    static adjustColor(color: string, isDarkMode: boolean): string {
        if (!isDarkMode || !color) return color;
        const cached = _darkAdjustCache.get(color);
        if (cached !== undefined) return cached;
        const rgb = parseColorRgba(color);
        if (!rgb) { _darkAdjustCache.set(color, color); return color; }
        const { r, g, b, a } = rgb;
        const rn = r / 255, gn = g / 255, bn = b / 255;
        const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), d = max - min;
        const l = (max + min) / 2;
        let h = 0, s = 0;
        if (d > 1e-6) {
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
            else if (max === gn) h = (bn - rn) / d + 2;
            else h = (rn - gn) / d + 4;
            h /= 6;
        }
        const newL = Math.min(1, Math.max(0, l + (1 - 2 * l) * (1 - s)));   // swap lightness, weighted by greyness
        const o = hslToRgb(h, s, newL);
        const out = a < 1 ? `rgba(${o.r},${o.g},${o.b},${a})` : `rgb(${o.r},${o.g},${o.b})`;
        _darkAdjustCache.set(color, out);
        return out;
    }

    static shadeColor(color: string, percent: number) {
        // Return transparent as is
        if (color === 'transparent' || color === 'none' || !color) return color;

        let R: number, G: number, B: number;

        if (color.startsWith('#')) {
            const hex = color.slice(1);
            if (hex.length === 3 || hex.length === 4) {
                // Shorthand #RGB or #RGBA
                R = parseInt(hex[0] + hex[0], 16);
                G = parseInt(hex[1] + hex[1], 16);
                B = parseInt(hex[2] + hex[2], 16);
            } else {
                R = parseInt(hex.substring(0, 2), 16);
                G = parseInt(hex.substring(2, 4), 16);
                B = parseInt(hex.substring(4, 6), 16);
            }
        } else if (color.startsWith('rgb')) {
            // rgb(R, G, B) or rgba(R, G, B, A)
            const match = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
            if (match) {
                R = parseInt(match[1]);
                G = parseInt(match[2]);
                B = parseInt(match[3]);
            } else {
                return color; // Can't parse, return as-is
            }
        } else {
            return color; // Named color or unknown format, return as-is
        }

        if (isNaN(R!) || isNaN(G!) || isNaN(B!)) return color;

        R = Math.min(255, Math.floor(R! * percent));
        G = Math.min(255, Math.floor(G! * percent));
        B = Math.min(255, Math.floor(B! * percent));

        const RR = R.toString(16).padStart(2, '0');
        const GG = G.toString(16).padStart(2, '0');
        const BB = B.toString(16).padStart(2, '0');

        return "#" + RR + GG + BB;
    }

    /**
     * Applies standard transformations (opacity, blend mode, rotation) to the context.
     * Returns the center coordinates (cx, cy) for further use.
     */
    static applyTransformations(renderer: IRenderer, el: DrawingElement, layerOpacity: number): { cx: number; cy: number } {
        renderer.save();
        renderer.globalAlpha = ((el.opacity ?? 100) / 100) * layerOpacity;

        // Apply Blend Mode
        if (el.blendMode) {
            renderer.globalCompositeOperation = el.blendMode === 'normal'
                ? 'source-over'
                : el.blendMode;
        }

        // Apply Drop Shadow, or — if no shadow — Outer Glow (a coloured halo, i.e.
        // a shadow with 0 offset). Canvas only has one shadow slot, so shadow wins.
        if (el.shadowEnabled) {
            renderer.shadowColor = el.shadowColor || 'rgba(0,0,0,0.3)';
            renderer.shadowBlur = el.shadowBlur || 10;
            renderer.shadowOffsetX = el.shadowOffsetX || 5;
            renderer.shadowOffsetY = el.shadowOffsetY || 5;
        } else if (el.glowEnabled) {
            renderer.shadowColor = el.glowColor || '#ffd400';
            renderer.shadowBlur = el.glowBlur ?? 12;
            renderer.shadowOffsetX = 0;
            renderer.shadowOffsetY = 0;
        } else {
            renderer.shadowColor = 'transparent';
        }

        // Apply CSS Filter — image/video adjustments and/or Feather (edge blur).
        const filterParts: string[] = [];
        if (el.type === 'image' || el.type === 'video') {
            const filterStr = buildFilterString(el);
            if (filterStr !== 'none') filterParts.push(filterStr);
        }
        if (el.featherRadius && el.featherRadius > 0) filterParts.push(`blur(${el.featherRadius}px)`);
        if (filterParts.length) renderer.filter = filterParts.join(' ');

        const angle = el.angle || 0;
        let finalAngle = angle;
        let finalX = el.x;
        let finalY = el.y;

        const cx = finalX + el.width / 2;
        const cy = finalY + el.height / 2;

        const rs = el.renderScale;
        const shearX = el.shearX || 0;
        const shearY = el.shearY || 0;
        if (finalAngle || el.flipX || el.flipY || shearX || shearY || (rs !== undefined && rs !== 1)) {
            renderer.translate(cx, cy);
            if (finalAngle) renderer.rotate(finalAngle);
            if (el.flipX || el.flipY) renderer.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1);
            // Shear about the centre: [[1, shearX],[shearY, 1]] → ctx.transform(1, shearY, shearX, 1, 0, 0).
            if (shearX || shearY) renderer.transform(1, shearY, shearX, 1, 0, 0);
            if (rs !== undefined && rs !== 1) renderer.scale(rs, rs);
            renderer.translate(-cx, -cy);
        }

        return { cx, cy };
    }

    static restoreTransformations(renderer: IRenderer) {
        renderer.restore();
    }

    /**
     * Applies stroke properties (color, width, dash) to the context.
     */
    static applyStrokeStyle(renderer: IRenderer, el: DrawingElement, isDarkMode: boolean) {
        const sg = el.strokeGradient;
        if (sg && sg.stops && sg.stops.length >= 2) {
            renderer.strokeStyle = this.buildStrokeGradient(renderer, el, sg) ?? this.adjustColor(el.strokeColor, isDarkMode);
        } else {
            renderer.strokeStyle = this.adjustColor(el.strokeColor, isDarkMode);
        }
        renderer.lineWidth = el.strokeWidth;
        renderer.lineCap = 'round';
        renderer.lineJoin = (el.strokeLineJoin as CanvasLineJoin) || 'round';

        if (el.strokeStyle === 'dashed') {
            renderer.setLineDash([8, 8]);
        } else if (el.strokeStyle === 'dotted') {
            renderer.setLineDash([2, 4]);
        } else {
            renderer.setLineDash([]);
        }
    }

    /**
     * Builds a CanvasGradient/SvgGradient for a stroke gradient, in the element's
     * centred local space (same convention as applyGradient for fills).
     */
    private static buildStrokeGradient(renderer: IRenderer, el: DrawingElement, sg: NonNullable<DrawingElement['strokeGradient']>) {
        // Built in WORLD coordinates because the architectural shape renderers
        // stroke at absolute element positions (e.g. el.x + el.width/2), not in a
        // centred/translated space.
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        const mw = Math.abs(el.width) / 2;
        const mh = Math.abs(el.height) / 2;
        let grad;
        if (sg.type === 'radial') {
            const radius = Math.max(Math.abs(el.width), Math.abs(el.height)) / 2;
            grad = renderer.createRadialGradient(cx, cy, 0, cx, cy, radius);
        } else {
            const angleRad = (sg.angle ?? 0) * (Math.PI / 180);
            const r = Math.sqrt(mw ** 2 + mh ** 2);
            grad = renderer.createLinearGradient(
                cx - Math.cos(angleRad) * r, cy - Math.sin(angleRad) * r,
                cx + Math.cos(angleRad) * r, cy + Math.sin(angleRad) * r,
            );
        }
        [...sg.stops]
            .sort((a, b) => a.offset - b.offset)
            .forEach(s => grad.addColorStop(Math.max(0, Math.min(1, s.offset)), s.color));
        return grad;
    }

    /**
     * Builds RoughJS options based on element properties.
     */
    static buildRenderOptions(el: DrawingElement, isDarkMode: boolean): Options {
        const stroke = this.adjustColor(el.strokeColor, isDarkMode);
        let fill = el.backgroundColor === 'transparent' ? undefined : this.adjustColor(el.backgroundColor, isDarkMode);

        // Suppress RoughJS fill if complex fill (gradient/dots/image) is active
        // Also use 'solid' fillStyle for RoughJS since it doesn't understand gradient types
        const isComplexFill = ['linear', 'radial', 'conic', 'dots', 'image', 'mesh', 'pattern'].includes(el.fillStyle as string);
        if (isComplexFill) {
            fill = undefined;
        }
        // Architectural (clean) mode can't use RoughJS hatching, so we draw clean
        // hatch lines in applyComplexFills instead — suppress the solid fill here so
        // the hatch shows through. Sketch mode keeps the fill so RoughJS can hatch it.
        if (el.renderStyle === 'architectural' && HATCH_FILL_STYLES.includes(el.fillStyle as string)) {
            fill = undefined;
        }

        const density = el.fillDensity || 1;
        const baseGap = 5;
        const hachureGap = Math.max(0.5, baseGap / density);

        // RoughJS fillStyle - use 'solid' for gradient types since we handle those separately
        const roughFillStyle = isComplexFill ? 'solid' : el.fillStyle;

        return {
            stroke,
            fill,
            fillStyle: roughFillStyle as any,
            strokeWidth: el.strokeWidth,
            hachureAngle: 60,
            hachureGap: hachureGap,
            roughness: el.roughness ?? 1,
            seed: el.seed || 1,
            disableMultiStroke: el.roughness === 0,
            strokeLineDash: el.strokeStyle === 'dashed' ? [8, 8] : el.strokeStyle === 'dotted' ? [2, 4] : undefined,
        };
    }

    /**
     * Applies gradient or complex fills using ShapeGeometry.
     */
    static applyComplexFills(context: RenderContext, cx: number, cy: number) {
        const { renderer, element: el } = context;
        const fillStyle = el.fillStyle;

        const useGradient = (['linear', 'radial', 'conic'].includes(fillStyle as string)) ||
            ((el.gradientType as any) !== 'none' && el.gradientType !== undefined);
        const useDots = fillStyle === 'dots';
        const useImage = fillStyle === 'image' && !!el.backgroundImage;
        const useMesh = fillStyle === 'mesh' && !!el.meshGradient;
        const usePattern = fillStyle === 'pattern' && !!el.patternFill;
        // Clean hatch lines for the sketchy fill styles, architectural mode only
        // (sketch mode leaves these to RoughJS).
        const useHatch = el.renderStyle === 'architectural' && HATCH_FILL_STYLES.includes(fillStyle as string)
            && !!el.backgroundColor && el.backgroundColor !== 'transparent';

        if (!useGradient && !useDots && !useImage && !useMesh && !usePattern && !useHatch) return;

        renderer.save();
        renderer.translate(cx, cy);

        if (useHatch) {
            this.applyHatchFill(renderer, el, fillStyle as string, context.isDarkMode);
            renderer.restore();
            return;
        }

        if (useImage) {
            this.applyImageFill(renderer, el);
            renderer.restore();
            return;
        }

        if (useMesh) {
            this.applyMeshFill(renderer, el);
            renderer.restore();
            return;
        }

        if (usePattern) {
            this.applyPatternFill(renderer, el);
            renderer.restore();
            return;
        }

        if (useGradient) {
            renderer.beginPath();
            this.applyGradient(renderer, el);
        } else if (useDots) {
            renderer.beginPath();
            this.applyDotsFill(renderer, el, context.isDarkMode);
        }

        const geometry = getShapeGeometry(el);
        if (geometry) {
            this.renderGeometry(renderer, geometry);
            renderer.fill();
        }

        renderer.restore();
    }

    /**
     * Paints an image clipped to the shape outline (fillStyle === 'image').
     * Runs in a coordinate space already translated to the shape's center.
     * If the image isn't cached yet, getImage() kicks off a load and triggers
     * a redraw on completion, so this no-ops gracefully until then.
     */
    private static applyImageFill(renderer: IRenderer, el: DrawingElement) {
        const img = getImage(el.backgroundImage!) as HTMLImageElement | null;
        if (!img || !img.width || !img.height) return;

        const geometry = getShapeGeometry(el);
        if (!geometry) return;

        renderer.save();

        // Clip to the shape outline so the image only shows inside the shape.
        if (geometry.type === 'path') {
            renderer.clipPath(geometry.path);
        } else {
            renderer.beginPath();
            this.renderGeometry(renderer, geometry);
            renderer.clip();
        }

        const opacity = el.backgroundOpacity ?? 1;
        if (opacity !== 1) renderer.globalAlpha = renderer.globalAlpha * opacity;

        const w = el.width;
        const h = el.height;
        const fit = el.backgroundImageFit || 'cover';

        if (fit === 'tile') {
            const pattern = renderer.createPattern(img, 'repeat');
            if (pattern) {
                renderer.fillStyle = pattern as any;
                renderer.beginPath();
                renderer.rect(-w / 2, -h / 2, w, h);
                renderer.fill();
            }
            renderer.restore();
            return;
        }

        const imgAspect = img.width / img.height;
        const boxAspect = w / h;
        let dw = w, dh = h; // 'fill' (stretch) uses the full box

        if (fit === 'cover') {
            if (imgAspect > boxAspect) { dh = h; dw = h * imgAspect; }
            else { dw = w; dh = w / imgAspect; }
        } else if (fit === 'contain') {
            if (imgAspect > boxAspect) { dw = w; dh = w / imgAspect; }
            else { dh = h; dw = h * imgAspect; }
        }

        renderer.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        renderer.restore();
    }

    /**
     * Clean (non-RoughJS) hatch fill for architectural mode: clips to the shape
     * outline and strokes parallel hatch lines in the fill colour, matching the
     * sketch-mode hachure / cross-hatch / zigzag / dashed styles. Runs in the
     * center-translated frame (geometry is center-relative), mirroring image fill.
     */
    private static applyHatchFill(renderer: IRenderer, el: DrawingElement, fillStyle: string, isDarkMode: boolean) {
        const geometry = getShapeGeometry(el);
        if (!geometry) return;

        renderer.save();
        if (geometry.type === 'path') {
            renderer.clipPath(geometry.path);
        } else {
            renderer.beginPath();
            this.renderGeometry(renderer, geometry);
            renderer.clip();
        }

        const w = el.width, h = el.height;
        const density = el.fillDensity || 1;
        const gap = Math.max(4, 9 / density);
        const color = this.adjustColor(el.backgroundColor, isDarkMode);
        renderer.strokeStyle = color;
        renderer.lineWidth = Math.max(0.75, (el.strokeWidth || 1) * 0.5);

        const zig = fillStyle === 'zigzag' || fillStyle === 'zigzag-line';
        if (fillStyle === 'dashed') renderer.setLineDash([6, 4]);

        this.drawHatchLines(renderer, w, h, gap, 60, zig);
        if (fillStyle === 'cross-hatch') this.drawHatchLines(renderer, w, h, gap, -30, false);

        if (fillStyle === 'dashed') renderer.setLineDash([]);
        renderer.restore();
    }

    /** Stroke parallel (optionally zig-zag) lines at `angleDeg`, spaced `gap` apart, in the center frame. */
    private static drawHatchLines(renderer: IRenderer, w: number, h: number, gap: number, angleDeg: number, zigzag: boolean) {
        const a = (angleDeg * Math.PI) / 180;
        const dx = Math.cos(a), dy = Math.sin(a);     // line direction
        const px = -Math.sin(a), py = Math.cos(a);    // perpendicular (offset axis)
        const R = Math.abs(w) + Math.abs(h);          // covers the whole box
        const amp = Math.min(gap * 0.55, 5);          // zig-zag amplitude
        const wave = gap * 1.4;                        // zig-zag wavelength
        for (let d = -R; d <= R; d += gap) {
            const ox = d * px, oy = d * py;
            renderer.beginPath();
            if (!zigzag) {
                renderer.moveTo(ox - R * dx, oy - R * dy);
                renderer.lineTo(ox + R * dx, oy + R * dy);
            } else {
                let sign = 1, first = true;
                for (let t = -R; t <= R; t += wave) {
                    const x = ox + t * dx + sign * amp * px;
                    const y = oy + t * dy + sign * amp * py;
                    if (first) { renderer.moveTo(x, y); first = false; } else renderer.lineTo(x, y);
                    sign = -sign;
                }
            }
            renderer.stroke();
        }
    }

    /**
     * Paints a gradient-mesh fill clipped to the shape outline (fillStyle ===
     * 'mesh'). The mesh is bilinearly rasterized to a small offscreen canvas
     * (capped resolution; canvas smoothing upscales it cleanly) and drawn into
     * the shape. Identical in both sketch and architectural styles — like image
     * fills — so render-style parity is automatic; strokes still draw per-mode.
     * Runs in a space already translated to the shape's center.
     */
    private static applyMeshFill(renderer: IRenderer, el: DrawingElement) {
        const mesh = el.meshGradient;
        if (!mesh) return;
        const w = el.width, h = el.height;
        if (w <= 0 || h <= 0) return;

        // Rasterize at a capped resolution proportional to the element; the
        // gradient is smooth, so a modest buffer upscales without visible loss.
        const res = (n: number) => Math.max(2, Math.min(256, Math.round(n)));
        const buf = rasterizeMesh(mesh, res(w), res(h));
        if (!buf) return;

        const geometry = getShapeGeometry(el);
        if (!geometry) return;

        renderer.save();
        if (geometry.type === 'path') {
            renderer.clipPath(geometry.path);
        } else {
            renderer.beginPath();
            this.renderGeometry(renderer, geometry);
            renderer.clip();
        }
        const opacity = el.backgroundOpacity ?? 1;
        if (opacity !== 1) renderer.globalAlpha = renderer.globalAlpha * opacity;
        renderer.drawImage(buf, -w / 2, -h / 2, w, h);
        renderer.restore();
    }

    /**
     * Paints a vector pattern fill clipped to the shape outline (fillStyle ===
     * 'pattern'). The motif is tiled into an element-sized buffer and drawn into
     * the shape — same strategy as image/mesh fills, so both render styles and the
     * SVG exporter get it for free. Runs in a space already translated to centre.
     */
    private static applyPatternFill(renderer: IRenderer, el: DrawingElement) {
        const pf = el.patternFill;
        if (!pf) return;
        const w = el.width, h = el.height;
        if (w <= 0 || h <= 0) return;

        const buf = rasterizePatternBuffer(pf, w, h);
        if (!buf) return;

        const geometry = getShapeGeometry(el);
        if (!geometry) return;

        renderer.save();
        if (geometry.type === 'path') {
            renderer.clipPath(geometry.path);
        } else {
            renderer.beginPath();
            this.renderGeometry(renderer, geometry);
            renderer.clip();
        }
        const opacity = el.backgroundOpacity ?? 1;
        if (opacity !== 1) renderer.globalAlpha = renderer.globalAlpha * opacity;
        renderer.drawImage(buf, -w / 2, -h / 2, w, h);
        renderer.restore();
    }

    private static applyGradient(renderer: IRenderer, el: DrawingElement) {
        const w = el.width;
        const h = el.height;
        const mw = w / 2;
        const mh = h / 2;
        const gType = el.gradientType || el.fillStyle || 'linear';

        let grad;

        if (gType === 'linear') {
            const angleRad = (el.gradientDirection || 45) * (Math.PI / 180);
            const r = Math.sqrt(mw ** 2 + mh ** 2);
            const x1 = -Math.cos(angleRad) * r;
            const y1 = -Math.sin(angleRad) * r;
            const x2 = Math.cos(angleRad) * r;
            const y2 = Math.sin(angleRad) * r;
            grad = renderer.createLinearGradient(x1, y1, x2, y2);
        } else if (gType === 'radial') {
            const angleRad = (el.gradientDirection || 0) * (Math.PI / 180);
            const radius = Math.max(w, h) / 2;
            const focalOffset = radius * 0.4; // 40% offset for focal point
            const fx = Math.cos(angleRad) * focalOffset;
            const fy = Math.sin(angleRad) * focalOffset;
            grad = renderer.createRadialGradient(fx, fy, 0, 0, 0, radius);
        } else if (gType === 'conic') {
            const angleRad = (el.gradientDirection || 0) * (Math.PI / 180);
            grad = renderer.createConicGradient(angleRad, 0, 0);
        } else {
            grad = renderer.createLinearGradient(-mw, -mh, mw, mh);
        }

        if (el.gradientStops && el.gradientStops.length > 0) {
            [...el.gradientStops]
                .sort((a, b) => a.offset - b.offset)
                .forEach(stop => grad.addColorStop(stop.offset, stop.color));
        } else if (el.gradientStart && el.gradientEnd) {
            grad.addColorStop(0, el.gradientStart);
            grad.addColorStop(1, el.gradientEnd);
        }

        renderer.fillStyle = grad;
    }

    private static _dotPatternCache = new Map<string, any>();

    private static applyDotsFill(renderer: IRenderer, el: DrawingElement, _isDarkMode: boolean) {
        const density = el.fillDensity || 1;
        const color = el.strokeColor || '#000000';
        const strokeW = el.strokeWidth / 2 || 1;
        const gap = Math.max(5, 20 / density);

        // Cache pattern by its visual parameters
        const cacheKey = `${color}|${density}|${strokeW}`;
        let pattern = this._dotPatternCache.get(cacheKey);
        if (pattern === undefined) {
            const dotCanvas = document.createElement('canvas');
            dotCanvas.width = gap;
            dotCanvas.height = gap;
            const dotCtx = dotCanvas.getContext('2d');
            if (dotCtx) {
                dotCtx.fillStyle = color;
                dotCtx.beginPath();
                dotCtx.arc(gap / 2, gap / 2, strokeW, 0, Math.PI * 2);
                dotCtx.fill();
                pattern = renderer.createPattern(dotCanvas, 'repeat');
            } else {
                pattern = null;
            }
            // Evict if cache grows too large
            if (this._dotPatternCache.size > 100) this._dotPatternCache.clear();
            this._dotPatternCache.set(cacheKey, pattern!);
        }
        if (pattern) renderer.fillStyle = pattern;
    }

    static renderGeometry(renderer: IRenderer, geo: any) {
        if (geo.type === 'rect') {
            renderer.roundRect(geo.x, geo.y, geo.w, geo.h, geo.r || 0);
        } else if (geo.type === 'ellipse') {
            renderer.ellipse(geo.cx, geo.cy, geo.rx, geo.ry, 0, 0, Math.PI * 2);
        } else if (geo.type === 'points') {
            if (geo.points.length > 0) {
                renderer.moveTo(geo.points[0].x, geo.points[0].y);
                for (let i = 1; i < geo.points.length; i++) renderer.lineTo(geo.points[i].x, geo.points[i].y);
                if (geo.isClosed !== false) renderer.closePath();
            }
        } else if (geo.type === 'path') {
            renderer.fillPath(geo.path);
        } else if (geo.type === 'multi') {
            geo.shapes.forEach((s: any) => this.renderGeometry(renderer, s));
        }
    }

    /**
     * Appearance stack — draw extra fills/strokes OVER the base shape, bottom-to-top.
     * Both render styles: sketch uses rough.js (rc.path), architectural the clean path.
     * Called after the base shape renders; no-ops when `el.appearance` is empty.
     */
    static renderAppearance(rc: any, renderer: IRenderer, el: DrawingElement, layerOpacity: number) {
        const ap = el.appearance;
        if (!ap) return;
        const fills = (ap.fills || []).filter(f => f.visible !== false && f.color && f.color !== 'transparent');
        const strokes = (ap.strokes || []).filter(s => s.visible !== false && s.color && s.color !== 'transparent' && s.width > 0);
        if (!fills.length && !strokes.length) return;
        const geo = getShapeGeometry(el);
        if (!geo) return;
        const { ds, evenOdd } = geometryToDs(geo);
        if (!ds.length) return;

        const sketch = (el.renderStyle ?? 'sketch') === 'sketch';
        const { cx, cy } = this.applyTransformations(renderer, el, layerOpacity);
        renderer.translate(cx, cy);
        const dash = (d?: string) => d === 'dashed' ? [8, 8] : d === 'dotted' ? [2, 4] : undefined;

        for (const f of fills) {
            renderer.save();
            renderer.globalAlpha = renderer.globalAlpha * (f.opacity ?? 1);
            if (f.pattern) {
                // Pattern appearance fill: rasterize + clip to the shape outline (both
                // render styles identical, like the base pattern fill).
                const buf = rasterizePatternBuffer(f.pattern, el.width, el.height);
                if (buf) {
                    if (geo.type === 'path') {
                        renderer.clipPath(geo.path);
                    } else {
                        renderer.beginPath();
                        this.renderGeometry(renderer, geo);
                        renderer.clip();
                    }
                    renderer.drawImage(buf, -el.width / 2, -el.height / 2, el.width, el.height);
                }
            } else if (sketch) {
                for (const d of ds) rc.path(d, { fill: f.color, fillStyle: 'solid', stroke: 'none', roughness: el.roughness ?? 1, seed: el.seed || 1 });
            } else {
                renderer.fillStyle = f.color;
                for (const d of ds) renderer.fillPath(d, evenOdd ? 'evenodd' : undefined);
            }
            renderer.restore();
        }
        for (const s of strokes) {
            renderer.save();
            renderer.globalAlpha = renderer.globalAlpha * (s.opacity ?? 1);
            if (sketch) {
                for (const d of ds) rc.path(d, { stroke: s.color, strokeWidth: s.width, fill: 'none', roughness: el.roughness ?? 1, seed: el.seed || 1, strokeLineDash: dash(s.dash) });
            } else {
                renderer.strokeStyle = s.color;
                renderer.lineWidth = s.width;
                renderer.lineCap = 'round';
                renderer.lineJoin = 'round';
                const dd = dash(s.dash);
                renderer.setLineDash(dd || []);
                for (const d of ds) renderer.strokePath(d);
                renderer.setLineDash([]);
            }
            renderer.restore();
        }
        this.restoreTransformations(renderer);
    }

    /**
     * Render a single line of text with Touch-Type per-glyph transforms
     * (`el.charTransforms`): each glyph keeps its own move/scale/rotate/colour/font.
     * Shared by the text-element renderer (left-anchored) and shape labels
     * (centre-anchored). `anchorX` is the left edge for `'left'`, the centre for
     * `'center'`; `anchorY` is the glyph baseline (vertically centred).
     */
    static renderTouchTypeLine(
        renderer: IRenderer, el: DrawingElement, text: string,
        anchorX: number, anchorY: number, align: 'left' | 'center', isDarkMode: boolean,
    ) {
        const chars = [...text];
        const baseFont = getFontString(el);
        const baseColor = el.textColor || el.strokeColor || '#000000';
        renderer.textAlign = 'center';
        renderer.textBaseline = 'middle';

        // Measure each glyph in its own (possibly overridden) font to total the width.
        const widths: number[] = [];
        let total = 0;
        for (let i = 0; i < chars.length; i++) {
            const t = el.charTransforms?.[i];
            renderer.font = t?.font ? getFontString({ ...el, fontFamily: t.font }) : baseFont;
            const w = renderer.measureText(chars[i]).width;
            widths.push(w); total += w;
        }

        let adv = align === 'center' ? anchorX - total / 2 : anchorX;
        for (let i = 0; i < chars.length; i++) {
            const t = el.charTransforms?.[i] || { dx: 0, dy: 0, scale: 1, rot: 0 };
            renderer.font = t.font ? getFontString({ ...el, fontFamily: t.font }) : baseFont;
            const w = widths[i];
            const gx = adv + w / 2;
            renderer.save();
            renderer.fillStyle = this.adjustColor(t.color || baseColor, isDarkMode);
            renderer.translate(gx + (t.dx || 0), anchorY + (t.dy || 0));
            if (t.rot) renderer.rotate(t.rot);
            if (t.scale && t.scale !== 1) renderer.scale(t.scale, t.scale);
            renderer.fillText(chars[i], 0, 0);
            renderer.restore();
            adv += w;
        }
    }

    static renderText(context: RenderContext, cx: number, cy: number) {
        const { renderer, element: el, isDarkMode } = context;
        if (el.isEditing) return; // Don't render text if we're currently editing it

        // Rich text path — render per-span formatting
        if (el.richContainerText && el.richContainerText.length > 0) {
            this.renderRichText(context, cx, cy);
            return;
        }

        const textStr = el.containerText || el.text;
        if (!textStr) return;

        // Touch Type on a shape label — per-glyph transforms (single line), centred.
        if (el.charTransforms && el.charTransforms.length && !textStr.includes('\n') && !el.curvedText) {
            renderer.save();
            renderer.font = getFontString(el);
            this.renderTouchTypeLine(renderer, el, textStr, cx, cy, 'center', isDarkMode);
            renderer.restore();
            return;
        }

        // Curved Text: wrap the label around the shape's outline instead of
        // centering it inside. Single branch covers every closed shape since
        // all shape renderers route text through here.
        if (el.curvedText && isClosedShapeForText(el.type)) {
            const outline = getOutlinePath(el);
            if (outline.length >= 2) {
                const fontSize = el.fontSize || 16;
                renderer.save();
                renderer.font = getFontString(el);
                renderer.fillStyle = this.adjustColor(el.textColor || el.strokeColor || '#000000', isDarkMode);
                drawTextAlongPath(renderer, textStr, outline, fontSize, {
                    closed: true,
                    startOffset: el.textPathOffset,
                    letterSpacing: el.textPathSpacing,
                    sideOffset: el.textPathSide === 'outside' ? fontSize * 0.4 : undefined,
                });
                renderer.restore();
                return;
            }
        }

        renderer.save();

        let maxWidth = el.width - 20;
        let startYOffset = 0;

        // Specialized offsets for different shapes
        if (el.type === 'doubleBanner') {
            maxWidth = el.width * 0.65;
            startYOffset = - (el.height * 0.1);
        } else if (el.type === 'starPerson') {
            startYOffset = el.height * 0.15;
        } else if (el.type === 'lightbulb') {
            maxWidth = el.width * 0.7;
            startYOffset = - (el.height * 0.1);
        } else if (el.type === 'signpost') {
            maxWidth = el.width * 0.8;
            startYOffset = - (el.height * 0.15);
        } else {
            const uiDef = getUIShapeDef(el.type);
            if (uiDef?.textYOffset) {
                startYOffset = uiDef.textYOffset(el);
            }
        }

        const metrics = measureContainerText(renderer, el, textStr, maxWidth);

        renderer.font = getFontString(el);

        // Resolve Text Color
        const textColorRaw = el.textColor || el.strokeColor || '#000000';
        const textColor = this.adjustColor(textColorRaw, isDarkMode);

        // Apply text alignment (default to center for containerText)
        const textAlign = el.textAlign || 'center';
        renderer.textAlign = textAlign;
        renderer.textBaseline = 'middle';

        // Apply vertical alignment for containerText
        const verticalAlign = el.verticalAlign || 'middle';
        const padding = 10;
        let startY: number;
        if (verticalAlign === 'top') {
            startY = cy - el.height / 2 + padding + metrics.lineHeight / 2 + startYOffset;
        } else if (verticalAlign === 'bottom') {
            startY = cy + el.height / 2 - metrics.textHeight - padding + metrics.lineHeight / 2 + startYOffset;
        } else {
            startY = cy - metrics.textHeight / 2 + metrics.lineHeight / 2 + startYOffset;
        }

        // Fine-tune baseline shift for better visual centering (font dependent)
        const baselineShift = el.fontFamily === 'hand-drawn' ? 2 : 0;
        const textYAdjusted = startY + baselineShift;

        // Calculate x position based on alignment
        const getXPosition = () => {
            if (textAlign === 'left') {
                return cx - (el.width || maxWidth) / 2 + 10;
            } else if (textAlign === 'right') {
                return cx + (el.width || maxWidth) / 2 - 10;
            }
            return cx; // center
        };

        // Render Highlight
        if (el.textHighlightEnabled) {
            const highlightColor = el.textHighlightColor || 'rgba(255, 255, 0, 0.4)';
            const padding = el.textHighlightPadding ?? 4;
            const radius = el.textHighlightRadius ?? 2;

            renderer.fillStyle = this.adjustColor(highlightColor, isDarkMode);

            metrics.lines.forEach((line, index) => {
                const y = textYAdjusted + index * metrics.lineHeight;
                const lineWidth = renderer.measureText(line).width;
                const xPos = getXPosition();

                // Vertical padding adjustment to make it look centered
                const vPadding = padding / 2;

                // Calculate highlight x position based on alignment
                let highlightX = xPos - lineWidth / 2 - padding;
                if (textAlign === 'left') {
                    highlightX = xPos - padding;
                } else if (textAlign === 'right') {
                    highlightX = xPos - lineWidth - padding;
                }

                renderer.beginPath();
                renderer.roundRect(
                    highlightX,
                    y - metrics.lineHeight / 2 - vPadding,
                    lineWidth + padding * 2,
                    metrics.lineHeight + vPadding * 2,
                    radius
                );
                renderer.fill();
            });
        }

        // Render Lines
        renderer.fillStyle = textColor;
        metrics.lines.forEach((line, index) => {
            const y = textYAdjusted + index * metrics.lineHeight;
            const xPos = getXPosition();
            renderer.fillText(line, xPos, y, el.width - 10);
        });

        renderer.restore();
    }

    /**
     * Render rich text (per-span formatting) inside a shape container.
     */
    static renderRichText(context: RenderContext, cx: number, cy: number) {
        const { renderer, element: el, isDarkMode } = context;
        const spans = el.richContainerText!;

        renderer.save();

        let maxWidth = el.width - 20;
        let startYOffset = 0;

        if (el.type === 'doubleBanner') {
            maxWidth = el.width * 0.65;
            startYOffset = -(el.height * 0.1);
        } else if (el.type === 'starPerson') {
            startYOffset = el.height * 0.15;
        } else if (el.type === 'lightbulb') {
            maxWidth = el.width * 0.7;
            startYOffset = -(el.height * 0.1);
        } else if (el.type === 'signpost') {
            maxWidth = el.width * 0.8;
            startYOffset = -(el.height * 0.15);
        } else {
            const uiDef = getUIShapeDef(el.type);
            if (uiDef?.textYOffset) {
                startYOffset = uiDef.textYOffset(el);
            }
        }

        const defaults = { fontSize: el.fontSize || 28, fontFamily: el.fontFamily || 'hand-drawn' };
        const layout = layoutRichText(renderer, spans, maxWidth, defaults);

        const textAlign = el.textAlign || 'center';
        // Apply vertical alignment for rich containerText
        const verticalAlign = el.verticalAlign || 'middle';
        const padding = 10;
        let startY: number;
        if (verticalAlign === 'top') {
            startY = cy - el.height / 2 + padding + startYOffset;
        } else if (verticalAlign === 'bottom') {
            startY = cy + el.height / 2 - layout.totalHeight - padding + startYOffset;
        } else {
            startY = cy - layout.totalHeight / 2 + startYOffset;
        }

        // Accumulate y offset per line
        let lineY = startY;
        for (let lineIdx = 0; lineIdx < layout.lineCount; lineIdx++) {
            const lineHeight = layout.lineHeights[lineIdx];
            const lineSegments = layout.segments.filter(s => s.lineIndex === lineIdx);

            // Calculate total line width for alignment
            let lineWidth = 0;
            if (lineSegments.length > 0) {
                const last = lineSegments[lineSegments.length - 1];
                lineWidth = last.x + last.width;
            }

            // Calculate x offset based on text alignment
            let xOffset: number;
            if (textAlign === 'left') {
                xOffset = cx - maxWidth / 2;
            } else if (textAlign === 'right') {
                xOffset = cx + maxWidth / 2 - lineWidth;
            } else {
                xOffset = cx - lineWidth / 2;
            }

            const baselineY = lineY + lineHeight / 2;

            // Track if we've drawn a list marker for this line
            let listMarkerDrawn = false;
            const INDENT_SIZE = 20;

            for (const seg of lineSegments) {
                const span = seg.span;
                renderer.font = buildSpanFontString(span, defaults);
                const color = span.color || el.textColor || el.strokeColor;
                renderer.fillStyle = this.adjustColor(color, isDarkMode);
                renderer.textBaseline = 'middle';
                renderer.textAlign = 'left';

                // Draw list marker (bullet or number) before first segment of list item
                if (!listMarkerDrawn && span.listType && span.listType !== 'none') {
                    const listLevel = span.listLevel || 0;
                    const indent = listLevel * INDENT_SIZE;
                    const markerX = xOffset + indent;

                    if (span.listType === 'bullet') {
                        // Draw bullet point
                        const bulletChar = '•';
                        renderer.fillText(bulletChar, markerX, baselineY);
                    } else if (span.listType === 'ordered') {
                        // Draw number
                        const number = `${span.listIndex || 1}.`;
                        renderer.fillText(number, markerX, baselineY);
                    }
                    listMarkerDrawn = true;
                }

                renderer.fillText(seg.text, xOffset + seg.x, baselineY);

                // Draw underline
                if (span.underline) {
                    const fontSize = span.fontSize || defaults.fontSize;
                    renderer.beginPath();
                    renderer.strokeStyle = renderer.fillStyle as string;
                    renderer.lineWidth = Math.max(1, fontSize / 14);
                    renderer.moveTo(xOffset + seg.x, baselineY + fontSize * 0.35);
                    renderer.lineTo(xOffset + seg.x + seg.width, baselineY + fontSize * 0.35);
                    renderer.stroke();
                }

                // Draw strikethrough
                if (span.strikethrough) {
                    const fontSize = span.fontSize || defaults.fontSize;
                    renderer.beginPath();
                    renderer.strokeStyle = renderer.fillStyle as string;
                    renderer.lineWidth = Math.max(1, fontSize / 14);
                    renderer.moveTo(xOffset + seg.x, baselineY);
                    renderer.lineTo(xOffset + seg.x + seg.width, baselineY);
                    renderer.stroke();
                }
            }

            lineY += lineHeight;
        }

        renderer.restore();
    }
}
