/**
 * Leaf helpers for element point arrays.
 *
 * Split out of `render-element.ts` so pure geometry can be imported (and unit-tested)
 * without dragging in the shape registry, the render pipeline and roughjs behind it —
 * `render-element` re-exports these, so every existing caller is unaffected.
 */

/** Normalise a points array: supports both the legacy `Point[]` and the packed `number[]`. */
export const normalizePoints = (points: any[] | number[] | undefined): { x: number; y: number }[] => {
    if (!points || points.length === 0) return [];
    if (typeof points[0] === 'number') {
        const result: { x: number; y: number }[] = [];
        for (let i = 0; i < points.length - 1; i += 2) {
            result.push({ x: points[i] as number, y: points[i + 1] as number });
        }
        return result;
    }
    return points as { x: number; y: number }[];
};
