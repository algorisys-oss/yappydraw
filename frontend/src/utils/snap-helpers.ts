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
 * Snap width or height to grid multiples
 */
export const snapDimension = (dimension: number, gridSize: number, minSize: number = gridSize): number => {
    const snapped = Math.round(dimension / gridSize) * gridSize;
    return Math.max(snapped, minSize);
};
