/**
 * Live 3D Extrude effect (Illustrator's Effect ▸ 3D ▸ Extrude & Bevel — the "3D text" look).
 *
 * Renders an extruded **back face** + shaded **side walls** BEHIND the shape at draw time, so
 * the flat shape reads as a solid with depth. Non-destructive (`el.extrude`), re-editable, and
 * bakeable (`expandExtrude`). Works for any shape/text via its world outline polygons
 * (`elementToMultiPolygon`), and composes with both render styles — the extrusion body is a
 * shaded solid drawn straight to the canvas, while the shape's own front face still renders in
 * its sketch/architectural style on top.
 */
import type { DrawingElement } from "../types";
import { elementToMultiPolygon, type Poly, type Ring } from "./path-boolean";
import { parseHex, rgbToHex } from "./mesh-gradient";

/** An element's world outline: an array of polygons (each = outer ring + hole rings). */
type MultiPoly = Poly[];

export function hasExtrude(el: DrawingElement): boolean {
    return !!el.extrude && (el.extrude.depth || 0) > 0;
}

/** True when the extrude is tilted (rotX/rotY) — then we render the whole solid (incl. a flat
 *  front face) ourselves, so the caller should SKIP the element's normal front render. */
export function isExtrudeTilted(el: DrawingElement): boolean {
    return hasExtrude(el) && !!(el.extrude!.rotX || el.extrude!.rotY);
}

/** Foreshorten world outline rings about the shape centre to fake an X/Y tilt. */
function tilted(polys: MultiPoly, cx: number, cy: number, rotX = 0, rotY = 0): MultiPoly {
    const fx = Math.cos((rotY || 0) * Math.PI / 180);
    const fy = Math.cos((rotX || 0) * Math.PI / 180);
    if (fx === 1 && fy === 1) return polys;
    return polys.map((poly: Poly) => poly.map((ring: Ring) => ring.map(([x, y]) => [cx + (x - cx) * fx, cy + (y - cy) * fy] as [number, number])));
}

/** Darken a hex colour toward black by `amt` (0..1). Non-hex input falls back to a grey. */
function darken(color: string | undefined, amt: number): string {
    if (!color || color === 'transparent' || color[0] !== '#') {
        const g = Math.round(150 * (1 - amt));
        return rgbToHex(g, g, g);
    }
    try {
        const { r, g, b } = parseHex(color);
        const f = Math.max(0, 1 - amt);
        return rgbToHex(r * f, g * f, b * f);
    } catch {
        return '#777777';
    }
}

/** The colour the extrusion body is shaded from (the shape's fill, else stroke, else grey). */
function baseColor(el: DrawingElement): string {
    if (el.backgroundColor && el.backgroundColor !== 'transparent') return el.backgroundColor;
    if (el.strokeColor && el.strokeColor !== 'transparent') return el.strokeColor;
    return '#888888';
}

/** Shared extrude geometry: the (possibly tilted) world front outline + depth vector + shades. */
export function extrudeGeometry(el: DrawingElement): { front: MultiPoly; dx: number; dy: number; base: string; wallCol: string; backCol: string } | null {
    const ex = el.extrude;
    if (!ex || !(ex.depth > 0)) return null;
    const polys0 = elementToMultiPolygon(el);
    if (!polys0.length) return null;
    const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
    const front = tilted(polys0, cx, cy, ex.rotX, ex.rotY);
    const rad = (ex.angle || 0) * Math.PI / 180;
    const dx = Math.cos(rad) * ex.depth, dy = Math.sin(rad) * ex.depth;
    const base = baseColor(el);
    const shade = ex.shade ?? 0.35;
    return { front, dx, dy, base, wallCol: darken(base, shade), backCol: darken(base, Math.min(0.75, shade * 1.7)) };
}

/** Draw the back face + side walls (nonzero-winding quads, concave-safe). */
function drawBody(ctx: CanvasRenderingContext2D, g: { front: MultiPoly; dx: number; dy: number; wallCol: string; backCol: string }): void {
    const { front, dx, dy } = g;
    ctx.fillStyle = g.backCol;
    ctx.beginPath();
    for (const poly of front) for (const ring of poly) {
        if (ring.length < 2) continue;
        ctx.moveTo(ring[0][0] + dx, ring[0][1] + dy);
        for (let i = 1; i < ring.length; i++) ctx.lineTo(ring[i][0] + dx, ring[i][1] + dy);
        ctx.closePath();
    }
    ctx.fill('evenodd');
    ctx.fillStyle = g.wallCol;
    ctx.beginPath();
    for (const poly of front) for (const ring of poly) {
        const n = ring.length;
        for (let i = 0; i < n; i++) {
            const a = ring[i], b = ring[(i + 1) % n];
            ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
            ctx.lineTo(b[0] + dx, b[1] + dy); ctx.lineTo(a[0] + dx, a[1] + dy);
            ctx.closePath();
        }
    }
    ctx.fill();
}

/** Fill the (tilted) front face outline as a flat solid — used only in the tilted path. */
function drawFront(ctx: CanvasRenderingContext2D, g: { front: MultiPoly; base: string }, el: DrawingElement): void {
    ctx.fillStyle = g.base;
    ctx.beginPath();
    for (const poly of g.front) for (const ring of poly) {
        if (ring.length < 2) continue;
        ctx.moveTo(ring[0][0], ring[0][1]);
        for (let i = 1; i < ring.length; i++) ctx.lineTo(ring[i][0], ring[i][1]);
        ctx.closePath();
    }
    ctx.fill('evenodd');
    if (el.strokeColor && el.strokeColor !== 'transparent' && (el.strokeWidth ?? 0) > 0) {
        ctx.strokeStyle = el.strokeColor; ctx.lineWidth = el.strokeWidth!; ctx.lineJoin = 'round'; ctx.stroke();
    }
}

/**
 * Draw the 3D body (back face + side walls) for an extruded element. Call in WORLD space
 * (the element render loop's ctx) BEFORE the element's own front face is drawn on top.
 * For a TILTED extrude, also draws the flat front face (the caller must then skip the
 * element's normal render — see `isExtrudeTilted`).
 */
export function renderExtrudeBody(ctx: CanvasRenderingContext2D, el: DrawingElement): void {
    const g = extrudeGeometry(el);
    if (!g) return;
    ctx.save();
    ctx.globalAlpha *= (el.opacity ?? 100) / 100;
    drawBody(ctx, g);
    if (isExtrudeTilted(el)) drawFront(ctx, g, el);
    ctx.restore();
}
