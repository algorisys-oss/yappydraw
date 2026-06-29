/**
 * SVG paint helpers for vector export — turn an element's gradient or mesh fill
 * into a real `<defs>` entry (`<linearGradient>`/`<radialGradient>`/`<pattern>`)
 * and return a `url(#id)` reference, so gradient/mesh fills export as true
 * vectors instead of being lost or rasterized.
 */

import type { DrawingElement } from "../types";
import { rasterizeMesh } from "./mesh-gradient";
import { makePatternTile } from "./pattern-fill";

const SVGNS = 'http://www.w3.org/2000/svg';

/** Split a colour into { color, opacity }, pulling alpha out of rgba()/#rrggbbaa
 *  (SVG `stop-color` doesn't reliably accept alpha — `stop-opacity` does). */
function splitAlpha(c: string): { color: string; opacity?: number } {
    if (!c) return { color: '#000000' };
    const m = c.match(/^rgba\(([^)]+)\)$/i);
    if (m) {
        const p = m[1].split(',').map(s => s.trim());
        if (p.length === 4) return { color: `rgb(${p[0]}, ${p[1]}, ${p[2]})`, opacity: parseFloat(p[3]) };
        return { color: c };
    }
    if (/^#[0-9a-f]{8}$/i.test(c)) {
        return { color: c.slice(0, 7), opacity: parseInt(c.slice(7, 9), 16) / 255 };
    }
    return { color: c };
}

/**
 * Returns the SVG `fill` value for an element: a solid colour, 'none', or a
 * `url(#id)` referencing a gradient/mesh def appended to `defs`. `uid` makes the
 * def id unique. The shape's geometry is centred at its origin, so mesh patterns
 * use `userSpaceOnUse` over [-w/2 .. w/2].
 */
export function svgFillPaint(el: DrawingElement, defs: SVGElement, uid: string): string {
    const fs = el.fillStyle as string;

    // ── Gradient fills ──────────────────────────────────────────────────────
    const isGrad = (fs === 'linear' || fs === 'radial' || fs === 'conic') && (el.gradientStops?.length ?? 0) >= 1;
    if (isGrad) {
        const radial = fs === 'radial' || fs === 'conic'; // SVG has no conic → approximate with radial
        const id = `yd-grad-${uid}`;
        const grad = document.createElementNS(SVGNS, radial ? 'radialGradient' : 'linearGradient');
        grad.setAttribute('id', id);
        grad.setAttribute('gradientUnits', 'objectBoundingBox');
        if (radial) {
            grad.setAttribute('cx', '0.5'); grad.setAttribute('cy', '0.5'); grad.setAttribute('r', '0.5');
        } else {
            const a = ((el.gradientDirection ?? 45) * Math.PI) / 180;
            const dx = Math.cos(a) * 0.5, dy = Math.sin(a) * 0.5;
            grad.setAttribute('x1', `${(0.5 - dx).toFixed(4)}`);
            grad.setAttribute('y1', `${(0.5 - dy).toFixed(4)}`);
            grad.setAttribute('x2', `${(0.5 + dx).toFixed(4)}`);
            grad.setAttribute('y2', `${(0.5 + dy).toFixed(4)}`);
        }
        const stops = [...el.gradientStops!].sort((s1, s2) => s1.offset - s2.offset);
        for (const s of stops) {
            const stop = document.createElementNS(SVGNS, 'stop');
            const { color, opacity } = splitAlpha(s.color);
            stop.setAttribute('offset', `${Math.max(0, Math.min(1, s.offset)) * 100}%`);
            stop.setAttribute('stop-color', color);
            if (opacity !== undefined) stop.setAttribute('stop-opacity', `${opacity}`);
            grad.appendChild(stop);
        }
        defs.appendChild(grad);
        return `url(#${id})`;
    }

    // ── Mesh fills (rasterized into a clipped pattern image) ────────────────
    if (fs === 'mesh' && el.meshGradient) {
        const w = Math.abs(el.width), h = Math.abs(el.height);
        const res = (n: number) => Math.max(2, Math.min(256, Math.round(n)));
        const buf = w > 0 && h > 0 ? rasterizeMesh(el.meshGradient, res(w), res(h)) : null;
        if (buf) {
            const id = `yd-mesh-${uid}`;
            const pat = document.createElementNS(SVGNS, 'pattern');
            pat.setAttribute('id', id);
            pat.setAttribute('patternUnits', 'userSpaceOnUse');
            pat.setAttribute('patternContentUnits', 'userSpaceOnUse');
            // Tile positioned at the centred geometry's top-left; the image fills
            // the tile in CONTENT coordinates (origin at the tile's x,y), so it
            // sits at (0,0)..(w,h), not (-w/2..w/2).
            pat.setAttribute('x', `${-w / 2}`); pat.setAttribute('y', `${-h / 2}`);
            pat.setAttribute('width', `${w}`); pat.setAttribute('height', `${h}`);
            const img = document.createElementNS(SVGNS, 'image');
            img.setAttribute('href', buf.toDataURL('image/png'));
            img.setAttribute('x', '0'); img.setAttribute('y', '0');
            img.setAttribute('width', `${w}`); img.setAttribute('height', `${h}`);
            img.setAttribute('preserveAspectRatio', 'none');
            pat.appendChild(img);
            defs.appendChild(pat);
            return `url(#${id})`;
        }
    }

    // ── Pattern fills (real tiling <pattern> of a rasterized motif tile) ─────
    if (fs === 'pattern' && el.patternFill) {
        const ss = 2; // supersample the tile so it stays crisp when the viewer scales it
        const tile = makePatternTile(el.patternFill, ss);
        if (tile && tile.width > 0 && tile.height > 0) {
            const cssW = tile.width / ss, cssH = tile.height / ss;
            const id = `yd-pattern-${uid}`;
            const pat = document.createElementNS(SVGNS, 'pattern');
            pat.setAttribute('id', id);
            pat.setAttribute('patternUnits', 'userSpaceOnUse');
            pat.setAttribute('patternContentUnits', 'userSpaceOnUse');
            pat.setAttribute('width', `${cssW}`);
            pat.setAttribute('height', `${cssH}`);
            const angle = el.patternFill.angle || 0;
            if (angle) pat.setAttribute('patternTransform', `rotate(${angle})`);
            const img = document.createElementNS(SVGNS, 'image');
            img.setAttribute('href', tile.toDataURL('image/png'));
            img.setAttribute('x', '0'); img.setAttribute('y', '0');
            img.setAttribute('width', `${cssW}`); img.setAttribute('height', `${cssH}`);
            img.setAttribute('preserveAspectRatio', 'none');
            pat.appendChild(img);
            defs.appendChild(pat);
            return `url(#${id})`;
        }
    }

    return (el.backgroundColor && el.backgroundColor !== 'transparent' && el.backgroundColor !== 'none') ? el.backgroundColor : 'none';
}
