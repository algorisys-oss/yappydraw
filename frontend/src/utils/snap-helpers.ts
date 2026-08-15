import { latticeSnap, isAngledGrid, type GridStyle } from './grid-lattice';
/**
 * Snap utility functions for grid alignment
 */

/**
 * Snap a value to the nearest grid point
 */
export const snapToGrid = (value: number, gridSize: number): number => {
    return Math.round(value / gridSize) * gridSize;
};

/**
 * Snap a point (x, y) to the nearest grid intersection.
 *
 * `style` matters for the angled grids: on a diagonal or isometric lattice the drawable
 * points are the intersections of two families of slanted lines, which does NOT decompose
 * into rounding x and y independently. Omitting it keeps the square behaviour, so callers
 * that have no grid context are unaffected.
 */
export const snapPoint = (
    x: number,
    y: number,
    gridSize: number,
    style?: GridStyle,
): { x: number; y: number } => {
    if (isAngledGrid(style)) return latticeSnap(x, y, gridSize, style!);
    return {
        x: snapToGrid(x, gridSize),
        y: snapToGrid(y, gridSize)
    };
};

/**
 * Snap width or height to grid multiples
 */
export const snapDimension = (dimension: number, gridSize: number, minSize: number = gridSize): number => {
    const snapped = Math.round(dimension / gridSize) * gridSize;
    return Math.max(snapped, minSize);
};
