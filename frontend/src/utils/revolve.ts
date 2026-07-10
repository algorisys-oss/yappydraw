/**
 * Live 3D Revolve effect (Illustrator's Effect ▸ 3D ▸ Revolve — the "lathe" look).
 *
 * Spins a shape's silhouette around its vertical centre axis into a solid of revolution:
 * a rectangle → cylinder, a circle → sphere, a triangle → cone, a goblet outline → a goblet.
 * Rendered live as a dense stack of shaded cross-section ellipses (cylindrical left→right
 * shading + a downward viewing tilt). Non-destructive (`el.revolve3d`); the effect owns the
 * whole render, so the caller skips the element's normal (flat) render.
 */
import type { DrawingElement } from "../types";
import { elementToMultiPolygon, type Ring } from "./path-boolean";
import { parseHex, rgbToHex } from "./mesh-gradient";

export function hasRevolve(el: DrawingElement): boolean {
    return !!el.revolve3d && (el.width || 0) > 1 && (el.height || 0) > 1;
}

function baseColor(el: DrawingElement): string {
    if (el.backgroundColor && el.backgroundColor !== 'transparent') return el.backgroundColor;
    if (el.strokeColor && el.strokeColor !== 'transparent') return el.strokeColor;
    return '#888888';
}
function shade(color: string, amt: number): string {
    // amt <0 darkens toward black, >0 lightens toward white.
    let r = 128, g = 128, b = 128;
    if (color && color[0] === '#') { try { ({ r, g, b } = parseHex(color)); } catch { /* grey */ } }
    if (amt < 0) { const f = 1 + amt; return rgbToHex(r * f, g * f, b * f); }
    return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}

/** Horizontal span [minX, maxX] where a horizontal line at `y` crosses the outer ring. */
function horizontalSpan(ring: Ring, y: number): [number, number] | null {
    const xs: number[] = [];
    const n = ring.length;
    for (let i = 0; i < n; i++) {
        const a = ring[i], b = ring[(i + 1) % n];
        const lo = Math.min(a[1], b[1]), hi = Math.max(a[1], b[1]);
        if (y >= lo && y <= hi && a[1] !== b[1]) {
            const t = (y - a[1]) / (b[1] - a[1]);
            xs.push(a[0] + (b[0] - a[0]) * t);
        }
    }
    if (xs.length < 2) return null;
    return [Math.min(...xs), Math.max(...xs)];
}

/**
 * Render the lathe solid in WORLD space. The element's normal render must be skipped
 * (`hasRevolve`), since this replaces the flat shape entirely.
 */
export function renderRevolve(ctx: CanvasRenderingContext2D, el: DrawingElement): void {
    if (!hasRevolve(el)) return;
    const polys = elementToMultiPolygon(el);
    const ring = polys[0]?.[0];
    if (!ring || ring.length < 3) return;

    let minY = Infinity, maxY = -Infinity;
    for (const [, y] of ring) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    const base = baseColor(el);
    const dark = shade(base, -0.55), mid = base, lite = shade(base, 0.35);
    const flatten = 0.18;              // ry/rx — a gentle look-down tilt
    const step = 2;                    // px between cross-section rings

    ctx.save();
    ctx.globalAlpha *= (el.opacity ?? 100) / 100;
    // Top-to-bottom so lower rings overlap upper ones (painter's order for a downward view).
    for (let y = minY; y <= maxY; y += step) {
        const span = horizontalSpan(ring, y);
        if (!span) continue;
        const cx = (span[0] + span[1]) / 2;
        const rx = (span[1] - span[0]) / 2;
        if (rx < 0.5) continue;
        const ry = Math.max(0.5, rx * flatten);
        const grad = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
        grad.addColorStop(0, dark);
        grad.addColorStop(0.42, lite);
        grad.addColorStop(0.6, mid);
        grad.addColorStop(1, dark);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, y, rx, ry + step, 0, 0, Math.PI * 2); // +step overlap → seamless surface
        ctx.fill();
    }
    ctx.restore();
}
