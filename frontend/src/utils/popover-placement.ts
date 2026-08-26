/**
 * Placement for a fixed-position panel anchored to a control — the Fill & Stroke panel,
 * and anything else that hangs off a bar which can be docked to any edge.
 *
 * Pure geometry, kept out of the component for two reasons: it is the part with the edge
 * cases (a bar on the RIGHT edge has no room to its right; a control near the bottom has
 * no room below), and a function that only ever runs against a live viewport is a function
 * nobody tests.
 */

export interface Box {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export interface Placement {
    left: number;
    top: number;
}

/**
 * Put a `width`×`height` panel beside `anchor`, inside `viewport`, and never off screen.
 *
 * Preference order on the horizontal axis: the anchor's right side (the tool column is on
 * the left by default), then its left side, then clamped to the viewport. Vertically it
 * lines up with the anchor's top and slides up only as far as it must.
 *
 * `width`/`height` must be the panel's BORDER-BOX size — padding and borders included.
 * Clamping a content-box width leaves the panel hanging over the edge by exactly the
 * padding, which is how this went wrong the first time.
 */
export function placeBesideAnchor(
    anchor: Box,
    width: number,
    height: number,
    viewport: { width: number; height: number },
    gap = 8,
    margin = 8,
): Placement {
    const maxLeft = viewport.width - width - margin;
    const maxTop = viewport.height - height - margin;

    let left = anchor.right + gap;
    // No room on the right — try the left of the anchor.
    if (left > maxLeft) left = anchor.left - gap - width;
    // No room on either side (a narrow screen): overlap the anchor instead, clamped.
    if (left < margin) left = Math.max(margin, Math.min(maxLeft, anchor.left));

    // A panel taller than the viewport pins to the top; `margin` wins over `maxTop`,
    // which goes negative in that case.
    const top = Math.max(margin, Math.min(anchor.top, maxTop));

    return { left, top };
}
