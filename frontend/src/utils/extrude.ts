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
import { getImage } from "./image-cache";

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

/** True when the extrude effect draws the front face itself (tilt or bevel) — the caller must
 *  then SKIP the element's normal render so the two don't double-draw. */
export function extrudeOwnsFront(el: DrawingElement): boolean {
    return hasExtrude(el) && (isExtrudeTilted(el) || (el.extrude!.bevel || 0) > 0);
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

/** Lighten a hex colour toward white by `amt` (0..1) — used for the lit bevel facet. */
function lighten(color: string | undefined, amt: number): string {
    if (!color || color === 'transparent' || color[0] !== '#') return '#dddddd';
    try {
        const { r, g, b } = parseHex(color);
        return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
    } catch { return '#cccccc'; }
}

/** Inset a ring toward its centroid by `amt` px (a cheap chamfer for the bevel facet). */
function insetRing(ring: Ring, amt: number): Ring {
    let cx = 0, cy = 0;
    for (const p of ring) { cx += p[0]; cy += p[1]; }
    cx /= ring.length; cy /= ring.length;
    return ring.map(([x, y]) => {
        const dx = cx - x, dy = cy - y, d = Math.hypot(dx, dy) || 1;
        const t = Math.min(amt, d * 0.8);
        return [x + (dx / d) * t, y + (dy / d) * t] as [number, number];
    });
}

/** The colour the extrusion body is shaded from (the shape's fill, else stroke, else grey). */
function baseColor(el: DrawingElement): string {
    if (el.backgroundColor && el.backgroundColor !== 'transparent') return el.backgroundColor;
    if (el.strokeColor && el.strokeColor !== 'transparent') return el.strokeColor;
    return '#888888';
}

/** Shared extrude geometry: the (possibly tilted) world front outline + depth vector + shades.
 *  `fx`/`fy` are the world-axis foreshorten factors (cos of the Y/X tilt) — the front face is the
 *  element geometry scaled about its centre by (fx, fy), which the image front render reuses. */
export function extrudeGeometry(el: DrawingElement): { front: MultiPoly; dx: number; dy: number; fx: number; fy: number; base: string; wallCol: string; backCol: string } | null {
    const ex = el.extrude;
    if (!ex || !(ex.depth > 0)) return null;
    const polys0 = elementToMultiPolygon(el);
    if (!polys0.length) return null;
    const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
    const front = tilted(polys0, cx, cy, ex.rotX, ex.rotY);
    const fx = Math.cos((ex.rotY || 0) * Math.PI / 180);
    const fy = Math.cos((ex.rotX || 0) * Math.PI / 180);
    const rad = (ex.angle || 0) * Math.PI / 180;
    const dx = Math.cos(rad) * ex.depth, dy = Math.sin(rad) * ex.depth;
    const base = baseColor(el);
    const shade = ex.shade ?? 0.35;
    return { front, dx, dy, fx, fy, base, wallCol: darken(base, shade), backCol: darken(base, Math.min(0.75, shade * 1.7)) };
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

/** Trace a MultiPoly's rings into the current path (each ring closed). */
function tracePolys(ctx: CanvasRenderingContext2D, polys: MultiPoly): void {
    for (const poly of polys) for (const ring of poly) {
        if (ring.length < 2) continue;
        ctx.moveTo(ring[0][0], ring[0][1]);
        for (let i = 1; i < ring.length; i++) ctx.lineTo(ring[i][0], ring[i][1]);
        ctx.closePath();
    }
}

/**
 * If `el` is an image with a loaded bitmap, paint it into the (foreshortened) front face and
 * return true; otherwise return false so the caller fills a flat base colour instead. The bitmap
 * is clipped to `clip` (the full front outline, or the bevel-inset outline) and drawn through the
 * front-face world transform: element rotation, then a world-axis foreshorten about the centre —
 * exactly the map `tilted()` applies to the outline, so the pixels track the face at any tilt.
 */
function drawImageFront(ctx: CanvasRenderingContext2D, el: DrawingElement, clip: MultiPoly, fx: number, fy: number): boolean {
    if (el.type !== 'image' || !el.dataURL) return false;
    const img = getImage(el.dataURL);
    if (!img) return false;
    const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
    ctx.save();
    ctx.beginPath();
    tracePolys(ctx, clip);
    ctx.clip('evenodd');
    ctx.translate(cx, cy);
    ctx.scale(fx, fy);
    ctx.rotate((el.angle || 0) * Math.PI / 180);
    if (el.crop) {
        ctx.drawImage(img, el.crop.x, el.crop.y, el.crop.width, el.crop.height, el.x - cx, el.y - cy, el.width, el.height);
    } else {
        ctx.drawImage(img, el.x - cx, el.y - cy, el.width, el.height);
    }
    ctx.restore();
    return true;
}

/** Fill the (tilted) front face outline as a flat solid — used only in the tilted path.
 *  Image elements paint their bitmap into the face instead of a flat colour. */
function drawFront(ctx: CanvasRenderingContext2D, g: { front: MultiPoly; base: string; fx: number; fy: number }, el: DrawingElement): void {
    if (!drawImageFront(ctx, el, g.front, g.fx, g.fy)) {
        ctx.fillStyle = g.base;
        ctx.beginPath();
        tracePolys(ctx, g.front);
        ctx.fill('evenodd');
    }
    if (el.strokeColor && el.strokeColor !== 'transparent' && (el.strokeWidth ?? 0) > 0) {
        ctx.strokeStyle = el.strokeColor; ctx.lineWidth = el.strokeWidth!; ctx.lineJoin = 'round';
        ctx.beginPath(); tracePolys(ctx, g.front); ctx.stroke();
    }
}

/** Draw a beveled front: a lit chamfer ring between the outline and an inset front face. */
function drawBevelFront(ctx: CanvasRenderingContext2D, g: { front: MultiPoly; base: string; fx: number; fy: number }, bevel: number, el: DrawingElement): void {
    const inset: MultiPoly = g.front.map(poly => poly.map(ring => insetRing(ring, bevel)));
    const tracePoly = (rings: Ring[]) => {
        for (const ring of rings) {
            if (ring.length < 3) continue;
            ctx.moveTo(ring[0][0], ring[0][1]);
            for (let i = 1; i < ring.length; i++) ctx.lineTo(ring[i][0], ring[i][1]);
            ctx.closePath();
        }
    };
    // 1) Bevel facet ring = full outer outline with the inset outline punched out (even-odd).
    ctx.fillStyle = lighten(g.base, 0.28);
    ctx.beginPath();
    for (const poly of g.front) tracePoly([poly[0]]);
    for (const poly of inset) tracePoly([poly[0]]);
    ctx.fill('evenodd');
    // 2) Inset front face — the image bitmap (clipped to the inset), else a flat base colour.
    if (!drawImageFront(ctx, el, inset, g.fx, g.fy)) {
        ctx.fillStyle = g.base;
        ctx.beginPath();
        for (const poly of inset) tracePoly(poly);
        ctx.fill('evenodd');
    }
    // 3) Outline stroke on the full silhouette for definition.
    if (el.strokeColor && el.strokeColor !== 'transparent' && (el.strokeWidth ?? 0) > 0) {
        ctx.strokeStyle = el.strokeColor; ctx.lineWidth = el.strokeWidth!; ctx.lineJoin = 'round';
        ctx.beginPath(); for (const poly of g.front) tracePoly([poly[0]]); ctx.stroke();
    }
}

/**
 * Draw the 3D body (back face + side walls) for an extruded element. Call in WORLD space
 * (the element render loop's ctx) BEFORE the element's own front face is drawn on top.
 * When the effect owns the front (tilt or bevel), it also draws the front here and the caller
 * must skip the element's normal render — see `extrudeOwnsFront`.
 */
export function renderExtrudeBody(ctx: CanvasRenderingContext2D, el: DrawingElement): void {
    const g = extrudeGeometry(el);
    if (!g) return;
    const bevel = el.extrude!.bevel || 0;
    ctx.save();
    ctx.globalAlpha *= (el.opacity ?? 100) / 100;
    drawBody(ctx, g);
    if (bevel > 0) drawBevelFront(ctx, g, bevel, el);
    else if (isExtrudeTilted(el)) drawFront(ctx, g, el);
    ctx.restore();
}
