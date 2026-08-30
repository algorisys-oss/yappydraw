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

/**
 * Place a tool-group flyout (the submenu under a toolbar button) fully inside the viewport.
 *
 * The flyouts used to be positioned as a flat `{ top: anchor.bottom + 4, left: anchor.left }`,
 * which silently assumed the toolbar was on the LEFT or TOP edge. It can be docked to any of
 * the four, and on the other two that formula puts the panel off-screen: docked right, the
 * panel starts a few pixels from the right edge and runs off it; docked bottom, `anchor.bottom`
 * is already at the foot of the window so the panel opens below the fold. Either way the
 * expanded tools were unreachable (user feedback, Aug 2026).
 *
 * No knowledge of the dock edge is needed — asking "where does it fit?" answers it, in the
 * order a menu should try:
 *
 *   below → above → left of the anchor → right of the anchor → below, clamped.
 *
 * Below stays first, so the two edges that already worked are untouched. The two SIDE
 * placements are what a right-docked bar needs: merely clamping the panel back inside the
 * window would slide it under the toolbar column and hide the buttons it belongs to, so it
 * opens beside the bar instead, the way a submenu does.
 */
export function placeFlyout(
    anchor: Box,
    size: { width: number; height: number },
    viewport: { width: number; height: number },
    gap = 4,
    margin = 8,
): Placement {
    const { width, height } = size;
    const maxLeft = viewport.width - width - margin;
    const maxTop = viewport.height - height - margin;

    // Stacked above/below: aligned with the anchor's left edge. Only the RIGHT edge is
    // tested — a bar docked hard against the left runs its buttons to x≈4, inside the
    // margin, and a panel that lines up with them is on screen and correct.
    const alignedLeft = Math.max(0, anchor.left);
    const stackFits = alignedLeft <= maxLeft;
    if (stackFits) {
        const below = anchor.bottom + gap;
        if (below <= maxTop) return { left: alignedLeft, top: below };
        const above = anchor.top - gap - height;
        if (above >= margin) return { left: alignedLeft, top: above };
    }

    // Beside: vertically aligned with the anchor's top, slid up only as far as it must.
    const sideTop = Math.max(margin, Math.min(anchor.top, Math.max(margin, maxTop)));
    const toLeft = anchor.left - gap - width;
    if (toLeft >= margin) return { left: toLeft, top: sideTop };
    const toRight = anchor.right + gap;
    if (toRight <= maxLeft) return { left: toRight, top: sideTop };

    // Nothing fits cleanly (a panel wider or taller than the window): clamp and show as
    // much as possible rather than placing it somewhere unreachable.
    return {
        left: Math.max(margin, Math.min(alignedLeft, maxLeft)),
        top: Math.max(margin, Math.min(anchor.bottom + gap, Math.max(margin, maxTop))),
    };
}
