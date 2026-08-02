/**
 * Width-aware layout — render the same IR at a target width.
 *
 * A diagram is authored once and drawn more than once: wide for a desktop
 * reader, narrow for a phone. Scaling the wide render down is the wrong answer.
 * A 32-column bit grid squeezed into 375px puts every cell at 9px, which is a
 * picture of a grid rather than a readable one, and the text inside it stops
 * being text. So a narrow render REFLOWS: same cell size, fewer columns, more
 * rows.
 *
 * `targetWidth` is a budget, not a promise. Where the content cannot fit even at
 * its narrowest reflow — one node wider than the whole target — layout leaves it
 * wide and the page scrolls it inside its own container. Nothing is scaled down,
 * ever, because an unreadable diagram that fits is worse than a readable one
 * that scrolls.
 *
 * Which strategies reflow: `byte-grid` and `grid`, the two whose geometry is
 * "how many of these fit across". The others ignore `targetWidth` rather than
 * pretending, so a tree still renders at its natural width at any target.
 */

import type { DSLDiagram, RenderOptions } from '../types';

/**
 * Room the SVG export adds around the content box: 2px of crop padding each
 * side, plus slack for a sketch stroke wobbling outside the shape it belongs to.
 * Subtracted from the target so the exported file, not the layout box, is what
 * lands inside the budget.
 */
export const EXPORT_MARGIN = 8;

/**
 * The width this render is laying out for, or undefined for natural width.
 *
 * The render option wins over the source, which is the whole point: one `.ysl`
 * renders at both breakpoints without being edited between them.
 */
export function resolveTargetWidth(diagram: DSLDiagram, options?: RenderOptions): number | undefined {
    const width = options?.targetWidth ?? diagram.layout?.targetWidth;
    return typeof width === 'number' && width > 0 ? width : undefined;
}

/**
 * How many columns of `itemWidth` (separated by `gap`) fit in `available`.
 *
 * `snap: 'halve'` keeps halving the authored count until it fits: 32 → 16 → 8.
 * A byte grid must reflow this way. Taking the raw maximum instead would wrap a
 * 32-bit word at 11 columns, which splits it mid-byte and puts the same field in
 * a different column on every row — the reader loses the alignment that made a
 * byte grid worth drawing.
 *
 * `snap: 'free'` takes the raw maximum, for grids of unrelated items where no
 * column carries meaning.
 *
 * Returns at least 1. One column that overflows is the honest answer when the
 * target is narrower than a single item.
 */
export function fitColumns(
    available: number,
    itemWidth: number,
    gap: number,
    preferred: number,
    snap: 'halve' | 'free',
): number {
    // n items occupy n*itemWidth + (n-1)*gap.
    const max = Math.floor((available + gap) / (itemWidth + gap));
    if (max >= preferred) return preferred;
    if (max < 1) return 1;
    if (snap === 'free') return max;

    let columns = preferred;
    while (columns > max && columns > 1) columns = Math.ceil(columns / 2);
    return columns;
}
