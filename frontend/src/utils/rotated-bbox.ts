/**
 * Keeping a ROTATED element still while its bounding box is re-normalized.
 *
 * Editing a vector path changes which anchors are extreme, so the element's bbox has to be
 * recomputed and the anchors re-based against the new origin. That is a no-op on screen for
 * an unrotated shape: the anchors' world positions are preserved by construction.
 *
 * It is NOT a no-op once the element is rotated. Rotation is applied about the element's
 * CENTRE, and re-normalizing moves the centre. A point stored at `p` renders at
 *
 *     C + R·(p − C)
 *
 * so moving the centre by Δ moves every rendered point by (I − R)·Δ — including the anchors
 * the user never touched. The visible symptom is that dragging one anchor of a rotated path
 * drags the rest of the shape along with it (and the dragged anchor lands short of the
 * pointer). It vanishes at 0° because there R = I, which is why the bug hid for so long.
 *
 * The correction is a pure translation: shifting origin and centre together moves every
 * rendered point by exactly that amount, so subtracting the drift cancels it in one step —
 * no iteration, no approximation.
 */

export interface BBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * The origin the re-normalized box should actually use, so the geometry that did not change
 * stays exactly where it was drawn. `angle` is in radians; 0 returns `next` untouched.
 */
export function keepRotatedGeometryFixed(angle: number, prev: BBox, next: BBox): { x: number; y: number } {
    if (!angle) return { x: next.x, y: next.y };

    const c0x = prev.x + prev.width / 2, c0y = prev.y + prev.height / 2;
    const c1x = next.x + next.width / 2, c1y = next.y + next.height / 2;
    const dx = c1x - c0x, dy = c1y - c0y;
    if (dx === 0 && dy === 0) return { x: next.x, y: next.y };

    const cos = Math.cos(angle), sin = Math.sin(angle);
    // (I − R)·Δ — how far the untouched geometry would drift if we left the box as-is.
    const driftX = dx - (dx * cos - dy * sin);
    const driftY = dy - (dx * sin + dy * cos);

    return { x: next.x - driftX, y: next.y - driftY };
}
