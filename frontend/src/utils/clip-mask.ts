/**
 * Clipping / opacity masks — build a WORLD-space Path2D from a mask element's geometry so
 * the per-element render loop can clip a clipped element by the mask shape, and rasterize
 * a mask's luminance into an alpha matte for opacity masks.
 *
 * `getShapeGeometry` returns CENTRED geometry; this lifts it to world coords (centre +
 * the mask's own rotate/flip), matching how shapes are placed on screen.
 */

import type { DrawingElement } from '../types';
import { getShapeGeometry, type ShapeGeometry } from './shape-geometry';

/** Centred geometry → a Path2D in the element's centred frame. */
function geometryToPath2D(geo: ShapeGeometry): Path2D {
    const p = new Path2D();
    const add = (g: any) => {
        if (g.type === 'rect') {
            if (g.r && (p as any).roundRect) (p as any).roundRect(g.x, g.y, g.w, g.h, g.r);
            else p.rect(g.x, g.y, g.w, g.h);
        } else if (g.type === 'ellipse') {
            p.ellipse(g.cx, g.cy, Math.abs(g.rx), Math.abs(g.ry), 0, 0, Math.PI * 2);
        } else if (g.type === 'points') {
            const pts = g.points;
            if (pts.length) {
                p.moveTo(pts[0].x, pts[0].y);
                for (let i = 1; i < pts.length; i++) p.lineTo(pts[i].x, pts[i].y);
                if (g.isClosed !== false) p.closePath();
            }
        } else if (g.type === 'path') {
            p.addPath(new Path2D(g.path));
        } else if (g.type === 'multi') {
            g.shapes.forEach(add);
        }
    };
    add(geo);
    return p;
}

/** A world-space clip Path2D for a mask element (centre + rotate/flip applied), or null. */
export function buildClipPath2D(mask: DrawingElement): Path2D | null {
    const geo = getShapeGeometry(mask);
    if (!geo) return null;
    const centered = geometryToPath2D(geo);
    const cx = mask.x + mask.width / 2, cy = mask.y + mask.height / 2;
    const m = new DOMMatrix();
    m.translateSelf(cx, cy);
    if (mask.angle) m.rotateSelf((mask.angle * 180) / Math.PI);
    if (mask.flipX || mask.flipY) m.scaleSelf(mask.flipX ? -1 : 1, mask.flipY ? -1 : 1);
    const world = new Path2D();
    world.addPath(centered, m);
    return world;
}

/** True for a path whose fill rule should be even-odd (compound mask with holes). */
export function maskFillRule(mask: DrawingElement): CanvasFillRule {
    const geo = getShapeGeometry(mask);
    return geo && (geo as any).type === 'path' && (geo as any).evenOdd ? 'evenodd' : 'nonzero';
}
