/**
 * Resize geometry — the pure math behind dragging a bbox handle.
 *
 * Extracted from selection-handler's `handleResize` so the three modifier modes
 * (free, Shift = proportional, Alt+Shift = proportional about the centre) can be
 * unit-tested without a PointerEvent and a live store. The handler keeps the
 * side effects: snapping, binding, element-type fixups, `updateElement`.
 *
 * Frame convention: `dx`/`dy` are the drag delta ALREADY projected into the
 * element's own (un-rotated) axes; the returned box is likewise the element's
 * unrotated top-left/size, which is what `DrawingElement.x/y/width/height` mean
 * for a rotated element (rotation is applied about the box centre at render time).
 */

/** Local-centred sign of the FIXED anchor (corner/edge opposite the dragged handle),
 *  in half-extent units. Rotation-aware resize keeps that anchor pinned in world
 *  space while the element scales along its own (rotated) axes. */
export const RESIZE_ANCHOR_SIGNS: Record<string, [number, number]> = {
    tl: [1, 1], tr: [-1, 1], bl: [1, -1], br: [-1, -1],
    tm: [0, 1], bm: [0, -1], lm: [1, 0], rm: [-1, 0],
};

export interface ResizeBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ResizeOptions {
    /** Which bbox handle is being dragged ('tl' | 'tr' | … | 'rm'). */
    handle: string;
    /** Drag delta in the element's own unrotated frame. */
    dx: number;
    dy: number;
    /** The box as it was on pointer-down. */
    initial: ResizeBox;
    /** Lock the aspect ratio (Shift, the pen's second-finger contact, or a
     *  per-element `constrained` flag). */
    constrain: boolean;
    /** Scale about the box centre instead of pinning the opposite anchor
     *  (Alt+Shift) — the box grows equally on all sides. */
    fromCenter: boolean;
    /** Element rotation in radians; 0 for multi-selection group resize, which
     *  stays world-axis-aligned (Illustrator parity). */
    angle: number;
}

/**
 * Resolve a handle drag into the element's new unrotated box.
 *
 * Order matters: the centre-scaling doubling has to happen on the RAW handle
 * deltas, before the aspect lock, or the ratio comes out wrong — doubling a
 * width delta and a height delta independently does not preserve their ratio.
 */
export function computeResizeBox(opts: ResizeOptions): ResizeBox {
    const { handle, dx, dy, initial, constrain, fromCenter, angle } = opts;

    let { x: newX, y: newY, width: newWidth, height: newHeight } = initial;

    if (handle === 'tl') {
        newX += dx; newY += dy; newWidth -= dx; newHeight -= dy;
    } else if (handle === 'tr') {
        newY += dy; newWidth += dx; newHeight -= dy;
    } else if (handle === 'bl') {
        newX += dx; newWidth -= dx; newHeight += dy;
    } else if (handle === 'br') {
        newWidth += dx; newHeight += dy;
    } else if (handle === 'tm') {
        newY += dy; newHeight -= dy;
    } else if (handle === 'bm') {
        newHeight += dy;
    } else if (handle === 'lm') {
        newX += dx; newWidth -= dx;
    } else if (handle === 'rm') {
        newWidth += dx;
    }

    const cx0 = initial.x + initial.width / 2;
    const cy0 = initial.y + initial.height / 2;

    // Centre scaling: the dragged edge moves by `d`, so the opposite edge moves
    // by `-d` too — the size delta doubles. Position is recomputed at the end.
    if (fromCenter) {
        newWidth = initial.width + 2 * (newWidth - initial.width);
        newHeight = initial.height + 2 * (newHeight - initial.height);
    }

    if (constrain && initial.width !== 0 && initial.height !== 0) {
        const ratio = initial.width / initial.height;

        if (handle === 'tm' || handle === 'bm') {
            newWidth = newHeight * ratio;
            newX = cx0 - newWidth / 2;
        } else if (handle === 'lm' || handle === 'rm') {
            newHeight = newWidth / ratio;
            newY = cy0 - newHeight / 2;
        } else {
            // Corner handles — the axis that moved furthest wins.
            if (Math.abs(newWidth) / ratio > Math.abs(newHeight)) {
                newHeight = newWidth / ratio;
            } else {
                newWidth = newHeight * ratio;
            }

            if (handle === 'tl') {
                newX = (initial.x + initial.width) - newWidth;
                newY = (initial.y + initial.height) - newHeight;
            } else if (handle === 'tr') {
                newY = (initial.y + initial.height) - newHeight;
            } else if (handle === 'bl') {
                newX = (initial.x + initial.width) - newWidth;
            }
        }
    }

    if (fromCenter) {
        // The centre is the fixed point — true for a rotated element too, since
        // rotation happens about that same centre, so no world-space anchor
        // correction is needed (and the block below is deliberately skipped).
        return { x: cx0 - newWidth / 2, y: cy0 - newHeight / 2, width: newWidth, height: newHeight };
    }

    // For a rotated element, recompute the top-left so the anchor — the corner or
    // edge opposite the dragged handle — stays fixed in WORLD space. anchorWorld
    // comes from the OLD half-extents; the new centre places the new anchor (new
    // half-extents) back onto that same world point.
    const anchorSigns = angle ? RESIZE_ANCHOR_SIGNS[handle] : undefined;
    if (anchorSigns) {
        const c = Math.cos(angle), s = Math.sin(angle);
        const hw0 = initial.width / 2, hh0 = initial.height / 2;
        const [ax, ay] = anchorSigns;
        const awx = cx0 + (ax * hw0) * c - (ay * hh0) * s;
        const awy = cy0 + (ax * hw0) * s + (ay * hh0) * c;
        const hw1 = newWidth / 2, hh1 = newHeight / 2;
        const c1x = awx - ((ax * hw1) * c - (ay * hh1) * s);
        const c1y = awy - ((ax * hw1) * s + (ay * hh1) * c);
        newX = c1x - hw1;
        newY = c1y - hh1;
    }

    return { x: newX, y: newY, width: newWidth, height: newHeight };
}
