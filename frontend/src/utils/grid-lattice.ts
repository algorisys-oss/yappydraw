/**
 * grid-lattice — angled grid geometry: which lines to draw, and where a point snaps.
 *
 * The square grid needs none of this (snap each axis independently), but an angled grid does:
 * the drawable points are the **intersections of two families of parallel lines**, and those
 * don't decompose into per-axis rounding. Pure maths, no store and no canvas, so it unit-tests
 * directly and the renderer and the snapper cannot disagree about where the lattice is.
 *
 * A family at angle θ with spacing g is the set of lines whose signed distance along the
 * family's NORMAL is a multiple of g. Snapping is then: round that distance to the nearest
 * multiple for each of the two families, and solve the resulting 2×2 system for the point.
 * Exact, anchored at world (0,0), and idempotent.
 *
 * `isometric` draws a third (vertical) family because that is what makes it read as boxes
 * rather than as argyle — but snapping uses only the first two. Three families of parallel
 * lines have no common intersection lattice in general, so snapping to "all three" is not a
 * well-defined thing to ask for.
 */

export type GridStyle = 'lines' | 'dots' | 'diagonal' | 'isometric';

export const GRID_STYLES: { id: GridStyle; label: string; hint: string }[] = [
    { id: 'lines', label: 'Lines', hint: 'Square grid' },
    { id: 'dots', label: 'Dots', hint: 'Square grid, marked at the intersections only' },
    { id: 'diagonal', label: 'Diagonal', hint: '45° cross-hatch, for angled construction' },
    { id: 'isometric', label: 'Isometric', hint: '30° plus verticals, for boxes and 3/4 views' },
];

const DEG = Math.PI / 180;

/** Angles (radians) of the line families a style draws. Empty for the square styles. */
export function gridFamilyAngles(style: GridStyle): number[] {
    switch (style) {
        case 'diagonal': return [45 * DEG, -45 * DEG];
        // 30° is the isometric convention (a 2:1 "pixel isometric" would be ~26.57°).
        case 'isometric': return [30 * DEG, -30 * DEG, 90 * DEG];
        default: return [];
    }
}

/** Does this style need lattice snapping rather than per-axis rounding? */
export function isAngledGrid(style: GridStyle | undefined): boolean {
    return style === 'diagonal' || style === 'isometric';
}

/**
 * Snap a world point onto the grid's lattice.
 *
 * Square styles round each axis. Angled styles solve for the nearest intersection of the two
 * primary families. A non-positive or non-finite spacing is returned unsnapped — the sliders
 * and scripted callers can pass one, and emitting NaN coordinates puts an element somewhere
 * unrecoverable.
 */
export function latticeSnap(
    x: number,
    y: number,
    gridSize: number,
    style: GridStyle = 'lines',
): { x: number; y: number } {
    if (!(gridSize > 0) || !Number.isFinite(gridSize)) return { x, y };

    if (!isAngledGrid(style)) {
        return { x: Math.round(x / gridSize) * gridSize, y: Math.round(y / gridSize) * gridSize };
    }

    const [a1, a2] = gridFamilyAngles(style);
    // Normal of a line at angle a is (-sin a, cos a).
    const n1x = -Math.sin(a1), n1y = Math.cos(a1);
    const n2x = -Math.sin(a2), n2y = Math.cos(a2);

    // Nearest line in each family, as a signed distance along that family's normal.
    const d1 = Math.round((x * n1x + y * n1y) / gridSize) * gridSize;
    const d2 = Math.round((x * n2x + y * n2y) / gridSize) * gridSize;

    // Solve [n1; n2] · p = [d1; d2].
    const det = n1x * n2y - n1y * n2x;
    // Parallel families (never true for the styles above, but a new style could get it wrong)
    // have no unique intersection — leave the point alone rather than dividing by ~0.
    if (Math.abs(det) < 1e-9) return { x, y };

    return {
        x: (d1 * n2y - d2 * n1y) / det,
        y: (d2 * n1x - d1 * n2x) / det,
    };
}
