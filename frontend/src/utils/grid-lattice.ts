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

// ─── Rotation, origin, units, major lines ───────────────────────────────────
//
// Everything above is anchored at world (0,0) with no rotation. A grid can also be turned
// and have its origin moved (Anshika's review, Sep 2026: "the grid we already have can be
// customised … and can be rotated regardless of the axial line"). Both are handled the same
// way: move the point into the grid's own frame (subtract the origin, rotate by −angle),
// snap there with the unrotated rules above, and move it back. So a rotated grid snaps
// exactly like an unrotated one does, and the renderer uses the same frame to draw it.

/** The geometric part of GridSettings: enough to draw or snap, nothing about colour. */
export interface GridGeometry {
    gridSize: number;
    style?: GridStyle;
    /** Rotation of the whole grid, in degrees (counter-clockwise on screen is negative). */
    angle?: number;
    /** World point the lattice (and the axes) pass through. Default (0,0). */
    originX?: number;
    originY?: number;
}

export type GridUnit = 'px' | 'mm' | 'cm' | 'in';

export const GRID_UNITS: { id: GridUnit; label: string }[] = [
    { id: 'px', label: 'px' },
    { id: 'mm', label: 'mm' },
    { id: 'cm', label: 'cm' },
    { id: 'in', label: 'in' },
];

// CSS reference density, the same one utils/units.ts uses for the measurement readouts.
const PX_PER_UNIT: Record<GridUnit, number> = { px: 1, mm: 96 / 25.4, cm: 96 / 2.54, in: 96 };

/** A length in `unit` → world px. Unknown units are treated as px. */
export function gridUnitToPx(value: number, unit: GridUnit | undefined): number {
    return value * (PX_PER_UNIT[unit ?? 'px'] ?? 1);
}

/** World px → a length in `unit`, rounded to 3 decimals so inputs don't show float noise. */
export function pxToGridUnit(px: number, unit: GridUnit | undefined): number {
    return Math.round((px / (PX_PER_UNIT[unit ?? 'px'] ?? 1)) * 1000) / 1000;
}

/**
 * Angles (radians, world frame) of every line family the grid draws, with the grid's
 * rotation applied. Square styles are two families (the rows and the columns), so rotation
 * needs no special case in the renderer. `primary` marks the two families snapping uses.
 */
export function rotatedGridFamilies(g: GridGeometry): { angle: number; primary: boolean }[] {
    const rot = Number.isFinite(g.angle) ? g.angle! * DEG : 0;
    const style = g.style ?? 'lines';
    const base = isAngledGrid(style) ? gridFamilyAngles(style) : [0, 90 * DEG];
    return base.map((a, i) => ({ angle: a + rot, primary: i < 2 }));
}

/** Snap a world point to the grid, honouring rotation and origin. */
export function gridSnap(x: number, y: number, g: GridGeometry): { x: number; y: number } {
    if (!(g.gridSize > 0) || !Number.isFinite(g.gridSize)) return { x, y };
    const ox = Number.isFinite(g.originX) ? g.originX! : 0;
    const oy = Number.isFinite(g.originY) ? g.originY! : 0;
    const rot = Number.isFinite(g.angle) ? g.angle! * DEG : 0;
    if (!rot && !ox && !oy) return latticeSnap(x, y, g.gridSize, g.style);
    const c = Math.cos(rot), s = Math.sin(rot);
    const dx = x - ox, dy = y - oy;
    // Into the grid's frame: rotate by −angle.
    const lx = dx * c + dy * s, ly = -dx * s + dy * c;
    const p = latticeSnap(lx, ly, g.gridSize, g.style);
    return { x: ox + p.x * c - p.y * s, y: oy + p.x * s + p.y * c };
}

/**
 * Snap a DISPLACEMENT to the grid: a move by a whole number of cells along the grid's own
 * directions. The origin doesn't matter for a displacement, the rotation does — rounding dx
 * and dy on a rotated grid would slide an object off the lines it started on.
 */
export function gridSnapDelta(dx: number, dy: number, g: GridGeometry): { x: number; y: number } {
    return gridSnap(dx, dy, { ...g, originX: 0, originY: 0 });
}

/** Is line number `k` (counted from the origin) a major line? `every` ≤ 1 means no majors. */
export function isMajorLine(k: number, every: number | undefined): boolean {
    if (!every || every <= 1) return false;
    return ((Math.round(k) % every) + every) % every === 0;
}

/**
 * How many cells apart the drawn lines should be at this zoom. Below a legible on-screen gap
 * the grid is thinned: first to the major lines (if there are any), then by doubling. Every
 * line drawn at a coarser step is also drawn at the finer one, so zooming never makes the
 * grid appear to jump. Purely visual — snapping always uses the full grid.
 */
export function gridDrawStep(gridSize: number, scale: number, majorEvery?: number, minGap = 10): number {
    if (!(gridSize > 0) || !(scale > 0)) return 1;
    let m = 1;
    // Guard against a pathological zoom: 2^40 cells is far past anything drawable.
    for (let i = 0; i < 40 && gridSize * m * scale < minGap; i++) {
        m = majorEvery && majorEvery > 1 && m < majorEvery ? majorEvery : m * 2;
    }
    return m;
}
