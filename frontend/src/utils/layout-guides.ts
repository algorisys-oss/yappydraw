/**
 * layout-guides — the positions of a rows × columns layout grid inside a rectangle.
 *
 * This is Illustrator's "Split into Grid → Add Guides" / Affinity's Margins & Guides column
 * guides: a content area inset by margins, split into N columns (and M rows) separated by
 * gutters. The result is plain guide positions, which the store turns into ordinary ruler
 * guides, so they select, move, lock and hide like any other guide. Pure, no store.
 */

export interface LayoutRect { x: number; y: number; width: number; height: number }

export interface LayoutGridSpec {
    columns: number;
    rows: number;
    /** Gap between columns / between rows, in world px. */
    gutterX: number;
    gutterY: number;
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    marginLeft: number;
}

export const DEFAULT_LAYOUT_GRID: LayoutGridSpec = {
    columns: 6, rows: 1, gutterX: 20, gutterY: 20,
    marginTop: 40, marginRight: 40, marginBottom: 40, marginLeft: 40,
};

const nonNeg = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);
const count = (v: number) => (Number.isFinite(v) ? Math.max(1, Math.min(200, Math.floor(v))) : 1);
// Guides are stored in world px; two decimals is sub-pixel at any zoom that matters and keeps
// 1000 / 3 from saving as 333.33333333333337.
const r2 = (v: number) => Math.round(v * 100) / 100;

/**
 * The cells along one axis, as [start, end] spans: the content area (rect minus margins) split
 * into n cells with `gutter` between them. [] when margins and gutters leave no room — a guide
 * set with negative-width columns is worse than none.
 */
function axisCells(start: number, length: number, m0: number, m1: number, n: number, gutter: number): [number, number][] {
    const a = start + m0, b = start + length - m1;
    const cell = (b - a - gutter * (n - 1)) / n;
    if (!(cell > 0)) return [];
    const out: [number, number][] = [];
    for (let i = 0; i < n; i++) {
        const s0 = a + i * (cell + gutter);
        // The last cell ends exactly on the content edge, whatever the float drift.
        out.push([r2(s0), r2(i === n - 1 ? b : s0 + cell)]);
    }
    return out;
}

/** Column spans (x) and row spans (y) of a layout grid — what the dialog's preview shades. */
export function layoutCells(rect: LayoutRect, spec: LayoutGridSpec): { columns: [number, number][]; rows: [number, number][] } {
    if (![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) || rect.width <= 0 || rect.height <= 0) {
        return { columns: [], rows: [] };
    }
    return {
        columns: axisCells(rect.x, rect.width, nonNeg(spec.marginLeft), nonNeg(spec.marginRight), count(spec.columns), nonNeg(spec.gutterX)),
        rows: axisCells(rect.y, rect.height, nonNeg(spec.marginTop), nonNeg(spec.marginBottom), count(spec.rows), nonNeg(spec.gutterY)),
    };
}

const edges = (cells: [number, number][]) => [...new Set(cells.flat())];

/**
 * Vertical guide x-positions (`v`) and horizontal guide y-positions (`h`) for a layout grid:
 * both edges of every cell. With a zero gutter neighbouring cells share an edge, emitted once.
 * One row with no margins still yields the rect's top and bottom (they mark the page edge).
 */
export function layoutGuidePositions(rect: LayoutRect, spec: LayoutGridSpec): { v: number[]; h: number[] } {
    const { columns, rows } = layoutCells(rect, spec);
    return { v: edges(columns), h: edges(rows) };
}
