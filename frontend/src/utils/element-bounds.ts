/**
 * Visual bounds of elements — what a viewer sees, not the raw x/y/w/h box: rotation, stroke
 * (by alignment), shadow/glow/feather, 3D extrude and live Transform-effect copies all count.
 *
 * Lives outside export.ts so the store can use it (Fit Artboard to Selection / Artwork) without
 * an import cycle — export.ts imports the store.
 */
import type { DrawingElement } from "../types";
import { effectiveStrokeAlign } from "./stroke-align";
import { transformEffectRenderCopies } from "./transform-effect";

export interface Bounds { minX: number; minY: number; maxX: number; maxY: number; }

/**
 * Visual world-space AABB of a single element — accounts for rotation, stroke width,
 * shadow/glow/feather, and the 3D-extrude depth. WITHOUT these the export crop box is the
 * raw x/y/w/h box, so rotated shapes, thick strokes and effects get clipped on export.
 */
export function elementAABB(el: DrawingElement): Bounds {
    const cx = el.x + (el.width || 0) / 2, cy = el.y + (el.height || 0) / 2;
    const a = el.angle || 0, cos = Math.cos(a), sin = Math.sin(a); // radians, like the renderer
    const hw = Math.abs(el.width || 0) / 2, hh = Math.abs(el.height || 0) / 2;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [dx, dy] of [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]]) {
        const x = cx + dx * cos - dy * sin, y = cy + dx * sin + dy * cos;
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    // Stroke spread + shadow/glow/feather spread padding. How far the stroke reaches past the
    // outline depends on its alignment: centre spills half its width, `outside` a full width,
    // `inside` none at all. Assuming half-width for every case cropped outside-aligned strokes
    // at the edge of the exported canvas.
    const shadow = el.shadowEnabled ? (el.shadowBlur || 0) + Math.max(Math.abs(el.shadowOffsetX || 0), Math.abs(el.shadowOffsetY || 0)) : 0;
    const strokeSpread = (() => {
        const w = el.strokeWidth || 0;
        switch (effectiveStrokeAlign(el)) {
            case 'inside': return 0;
            case 'outside': return w;
            default: return w / 2;
        }
    })();
    const pad = strokeSpread + shadow + (el.glowEnabled ? (el.glowBlur || 0) : 0) + (el.featherRadius || 0);
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    // 3D extrude body extends in the depth direction.
    if (el.extrude && el.extrude.depth > 0) {
        const r = (el.extrude.angle || 0) * Math.PI / 180;
        const ex = Math.cos(r) * el.extrude.depth, ey = Math.sin(r) * el.extrude.depth;
        minX = Math.min(minX, minX + ex); maxX = Math.max(maxX, maxX + ex);
        minY = Math.min(minY, minY + ey); maxY = Math.max(maxY, maxY + ey);
    }
    return { minX, minY, maxX, maxY };
}

/**
 * Union AABB of a set of elements, expanding for live Transform-effect copies.
 *
 * A non-finite box is dropped rather than unioned: `Math.min(NaN, x)` is NaN, so ONE
 * element carrying a NaN coordinate (they come from degenerate boolean results and from
 * hand-edited/imported documents) poisons the whole crop and the export comes out blank or
 * absurdly large. Falls back to an empty box if nothing survives, which callers already
 * treat as "nothing to export".
 */
export function elementsBounds(elements: DrawingElement[]): Bounds {
    let b: Bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    const acc = (o: Bounds) => {
        if (!isFinite(o.minX) || !isFinite(o.minY) || !isFinite(o.maxX) || !isFinite(o.maxY)) return;
        b.minX = Math.min(b.minX, o.minX); b.minY = Math.min(b.minY, o.minY);
        b.maxX = Math.max(b.maxX, o.maxX); b.maxY = Math.max(b.maxY, o.maxY);
    };
    for (const el of elements) {
        const copies = transformEffectRenderCopies(el);
        if (copies.length) for (const c of copies) acc(elementAABB(c));
        else acc(elementAABB(el));
    }
    if (!isFinite(b.minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return b;
}
