/**
 * Geometry mirroring — the data side of Flip Horizontal / Flip Vertical
 * (`flipSelected`) and Mirror Copy (`reflectClone`).
 *
 * There are two ways to mirror an element and the difference is load-bearing:
 *
 *   • The `flipX`/`flipY` flags — a render-time canvas transform (`render-pipeline`
 *     wraps the draw in `scale(-1, 1)`). Cheap, and the only option for shapes whose
 *     geometry is implied by the bounding box (rect, ellipse, image, …).
 *   • Mirroring the STORED geometry — for elements carrying an explicit point or
 *     anchor list (pencil `points`, pen `pathAnchors` / `pathSubpaths`).
 *
 * Editable paths must take the second route. The anchor overlay
 * (`selection-renderer.renderPathAnchors`) and the anchor hit-test
 * (`handle-detection`) both read the raw anchors and compensate for ROTATION only —
 * neither knows the flip flags exist. Mirror a pen path with `flipX` and the shape
 * mirrors while its anchors stay behind on the un-mirrored ghost, so the handles you
 * see and the handles you can grab are no longer on the curve. Everything else that
 * consumes anchors (node editing, pathfinder, offset path, SVG export) reads them raw
 * too, so baking the mirror into the data is the fix that holds everywhere.
 *
 * `controlPoints` (bezier / organic connectors) are the exception: they are stored in
 * WORLD coordinates — a move translates them by dx/dy — so they reflect about the
 * world axis instead of within the element box.
 */

type Pt = { x: number; y: number };

/** Minimal shape of a mirrorable element (avoids a DrawingElement import here). */
export interface MirrorableElement {
    x: number;
    y: number;
    width: number;
    height: number;
    points?: any;
    pathAnchors?: any[];
    pathSubpaths?: any[];
    controlPoints?: Pt[];
    flipX?: boolean;
    flipY?: boolean;
}

export type MirrorDirection = 'horizontal' | 'vertical';

/**
 * Mirror a points array inside its own box. Flat `[x,y,…]` vs object `[{x,y,p?}]`
 * encoding is detected by runtime type and PRESERVED — as `scalePoints` does — so a
 * flat pencil stroke isn't inflated into objects and per-point pressure survives.
 */
export function mirrorPoints(points: any, direction: MirrorDirection, width: number, height: number): any {
    if (!points || points.length === 0) return points;
    const horizontal = direction === 'horizontal';
    if (typeof points[0] === 'number') {
        const out = new Array(points.length);
        for (let i = 0; i + 1 < points.length; i += 2) {
            out[i] = horizontal ? width - points[i] : points[i];
            out[i + 1] = horizontal ? points[i + 1] : height - points[i + 1];
        }
        return out;
    }
    return points.map((p: any) => ({
        ...p,
        x: horizontal ? width - p.x : p.x,
        y: horizontal ? p.y : height - p.y,
    }));
}

/**
 * Mirror path anchors and their Bézier handles inside the box. Handle deltas are
 * relative to their anchor, so they only negate on the mirrored axis.
 *
 * The in/out handles are deliberately NOT swapped: a reflection leaves the anchor
 * ORDER alone, so `out` still serves the segment toward the next anchor. (It does
 * reverse the winding direction, which is what a mirror should do; fills are even-odd
 * so holes are unaffected.) A missing handle stays missing — writing `inX: -0` where
 * there was no handle would turn a corner into a half-curve.
 */
export function mirrorPathAnchors(
    anchors: any[] | undefined, direction: MirrorDirection, width: number, height: number
): any[] | undefined {
    if (!anchors) return undefined;
    const horizontal = direction === 'horizontal';
    return anchors.map((a: any) => ({
        ...a,
        x: horizontal ? width - a.x : a.x,
        y: horizontal ? a.y : height - a.y,
        ...(a.inX !== undefined && horizontal ? { inX: -a.inX } : {}),
        ...(a.inY !== undefined && !horizontal ? { inY: -a.inY } : {}),
        ...(a.outX !== undefined && horizontal ? { outX: -a.outX } : {}),
        ...(a.outY !== undefined && !horizontal ? { outY: -a.outY } : {}),
    }));
}

/** Mirror every subpath of a compound path. */
export function mirrorPathSubpaths(
    subpaths: any[] | undefined, direction: MirrorDirection, width: number, height: number
): any[] | undefined {
    if (!subpaths) return undefined;
    return subpaths.map((sp: any) => ({ ...sp, anchors: mirrorPathAnchors(sp.anchors, direction, width, height) }));
}

/**
 * The element updates that reflect `el` across the line at world coordinate
 * `axisWorld` (an x for 'horizontal', a y for 'vertical').
 *
 * Passing the element's OWN centre as `axisWorld` makes the repositioning a no-op,
 * which is exactly "flip in place" — so callers don't need a separate code path for
 * the single-element case.
 *
 * Elements that carry explicit geometry get the mirror baked into that geometry (see
 * the file header for why). While we're there we also fold any pre-existing render
 * flag into the data: a path already rendered mirrored by `flipX` and now flipped
 * again is just its stored geometry with the flag cleared. That keeps the result
 * correct AND heals paths mirrored by the older flag-only code, whose anchors have
 * been sitting in the wrong place ever since.
 */
export function mirrorGeometry(
    el: MirrorableElement, direction: MirrorDirection, axisWorld: number
): Record<string, any> {
    const horizontal = direction === 'horizontal';
    const updates: Record<string, any> = {};

    if (horizontal) updates.x = 2 * axisWorld - (el.x + el.width);
    else updates.y = 2 * axisWorld - (el.y + el.height);

    const flagKey = horizontal ? 'flipX' : 'flipY';
    const alreadyMirrored = !!el[flagKey];

    const anchors = el.pathAnchors?.length ? el.pathAnchors : undefined;
    const subpaths = el.pathSubpaths?.length ? el.pathSubpaths : undefined;
    const points = el.points?.length ? el.points : undefined;

    if (anchors || subpaths || points) {
        if (alreadyMirrored) {
            updates[flagKey] = false;
        } else {
            if (anchors) updates.pathAnchors = mirrorPathAnchors(anchors, direction, el.width, el.height);
            if (subpaths) updates.pathSubpaths = mirrorPathSubpaths(subpaths, direction, el.width, el.height);
            if (points) updates.points = mirrorPoints(points, direction, el.width, el.height);
        }
    } else {
        // No stored geometry to mirror (rect, ellipse, image, …) — the render flag is
        // the only mechanism available, and is exactly right for these.
        updates[flagKey] = !alreadyMirrored;
    }

    // World-space control points reflect about the axis itself.
    if (el.controlPoints?.length) {
        updates.controlPoints = el.controlPoints.map(cp => horizontal
            ? { ...cp, x: 2 * axisWorld - cp.x }
            : { ...cp, y: 2 * axisWorld - cp.y });
    }

    return updates;
}
