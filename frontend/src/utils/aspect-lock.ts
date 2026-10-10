/**
 * Aspect-ratio lock for a W × H pair (New Artboard dialog): the user types one side and the other
 * follows. `ratio` is width / height, captured when the lock was turned on — NOT re-derived from
 * the rounded sizes on every keystroke, or 1000 × 333 → 1001 → … drifts away from 3:1.
 *
 * Returns the other side, rounded to a whole pixel and at least 1, or `null` when there is
 * nothing sensible to follow (an empty / zero / partly-typed input, or a broken ratio) — the
 * caller then leaves the other side alone instead of writing NaN or 0 into it.
 */
export const followLockedSide = (edited: 'w' | 'h', value: number, ratio: number): number | null => {
    if (!Number.isFinite(value) || value <= 0) return null;
    if (!Number.isFinite(ratio) || ratio <= 0) return null;
    const other = edited === 'w' ? value / ratio : value * ratio;
    return Math.max(1, Math.round(other));
};
