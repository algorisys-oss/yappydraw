/**
 * Geometry scaling helpers — shared by the interactive resize (selection-handler)
 * and the numeric Transform panel (app-store `setElementTransform`).
 *
 * All of an element's freeform geometry (pen points, vector path anchors/handles,
 * erase-mask strokes) is stored RELATIVE to the element origin, so resizing the
 * bounding box means multiplying those relative coords by the per-axis scale. Keeping
 * this in one place is what lets the panel's W/H fields stay in sync with the geometry
 * exactly the way dragging a handle does.
 */

/** Scale a pen/stroke points array, detecting flat `[x,y,…]` vs object `[{x,y,p?}]`. */
export function scalePoints(points: any, scaleX: number, scaleY: number): any {
    if (!points || points.length === 0) return points;
    // Detect encoding by runtime type, NOT a stale `pointsEncoding` flag (normalizePencil
    // rewrites finalized strokes to objects but leaves the flag 'flat').
    if (typeof points[0] === 'number') {
        const out = new Array(points.length);
        for (let i = 0; i + 1 < points.length; i += 2) {
            out[i] = points[i] * scaleX;
            out[i + 1] = points[i + 1] * scaleY;
        }
        return out;
    }
    return points.map((p: any) => ({
        x: p.x * scaleX,
        y: p.y * scaleY,
        ...(p.p !== undefined ? { p: p.p } : {}),
    }));
}

/** Scale editable path anchors and their Bézier handles (origin-relative). */
export function scalePathAnchors(anchors: any[] | undefined, scaleX: number, scaleY: number): any[] | undefined {
    if (!anchors) return undefined;
    return anchors.map((a: any) => ({
        ...a,
        x: a.x * scaleX,
        y: a.y * scaleY,
        ...(a.inX !== undefined ? { inX: a.inX * scaleX } : {}),
        ...(a.inY !== undefined ? { inY: a.inY * scaleY } : {}),
        ...(a.outX !== undefined ? { outX: a.outX * scaleX } : {}),
        ...(a.outY !== undefined ? { outY: a.outY * scaleY } : {}),
    }));
}

/** Scale every subpath's anchors of a compound path. */
export function scalePathSubpaths(subpaths: any[] | undefined, scaleX: number, scaleY: number): any[] | undefined {
    if (!subpaths) return undefined;
    return subpaths.map((sp: any) => ({ ...sp, anchors: scalePathAnchors(sp.anchors, scaleX, scaleY) }));
}

/** Scale erase-mask strokes; the radius scales by the geometric mean of the axes. */
export function scaleEraseStrokes(
    strokes: { points: number[]; radius: number }[] | undefined,
    scaleX: number,
    scaleY: number
): { points: number[]; radius: number }[] | undefined {
    if (!strokes) return undefined;
    const rScale = Math.sqrt(Math.abs(scaleX * scaleY)) || 1;
    return strokes.map(s => {
        const pts = s.points;
        const np = new Array(pts.length);
        for (let i = 0; i + 1 < pts.length; i += 2) {
            np[i] = pts[i] * scaleX;
            np[i + 1] = pts[i + 1] * scaleY;
        }
        return { points: np, radius: s.radius * rScale };
    });
}
