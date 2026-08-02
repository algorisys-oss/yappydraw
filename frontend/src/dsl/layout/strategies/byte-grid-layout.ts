/**
 * byte-grid layout — a linear run of bit or byte cells.
 *
 * This is the shape almost every low-level diagram wants and no general graph
 * layout produces: a float split into sign / exponent / mantissa, a struct with
 * its padding runs marked, a file header's magic bytes, a varint's continuation
 * bits. All of them are "a row of cells, grouped into named spans, wrapping at
 * some width, with offsets down the side".
 *
 * The author declares one node per SPAN, not per cell:
 *
 *     layout: { strategy: 'byte-grid', columns: 32 }
 *     nodes: [
 *       { id: 'sign', label: 'S',        properties: { bits: 1 } },
 *       { id: 'exp',  label: 'exponent', properties: { bits: 8 } },
 *       { id: 'mant', label: 'mantissa', properties: { bits: 23 } },
 *     ]
 *
 * Each span expands into real elements, so sketch rendering, palette links,
 * seeding and SVG export all work with no special case anywhere downstream.
 */

import type { DSLDiagram, DSLNode } from '../../types';
import { fitColumns, EXPORT_MARGIN } from '../width';

export const BYTE_GRID_DEFAULTS = {
    cellSize: 44,
    columns: 8,
    /**
     * Vertical room under each cell row for the span-label band. Must exceed
     * `labelGap + labelHeight` or the next row of cells lands on top of the
     * labels, which is exactly what happened the first time this ran.
     */
    rowGap: 40,
    gutterWidth: 88,
    labelHeight: 26,
    labelGap: 6,
    labelFontSize: 15,
    gutter: 'none' as GutterMode,
};

/**
 * Structural ink: cell borders, span labels, gutter offsets.
 *
 * Declared as a palette ROLE rather than a literal so a themed SVG export emits
 * it as a CSS variable with a dark counterpart. Baking a literal here produced a
 * grid that was invisible on a dark page: the coloured cells themed correctly
 * (they are swatch-linked) while every border and label stayed near-black.
 *
 * A diagram that declares its own `ink` role keeps it; this is only a default.
 */
export const INK_ROLE = 'ink';
export const INK_REF = `@${INK_ROLE}`;
export const DEFAULT_INK = { light: '#1e293b', dark: '#e2e8f0' };

/**
 * Labels are borderless rectangles carrying `containerText`, not `text` nodes.
 *
 * A text node anchors at its x and grows rightwards, so a label longer than its
 * span overlapped its neighbour and the gutter ran into the first cell. Container
 * text centres and wraps inside a fixed box instead, which is what these labels
 * actually need.
 *
 * The box is invisible via a transparent FILL and zero stroke WIDTH. It must keep
 * a real `strokeColor`, because container text is drawn in it: setting that to
 * transparent hides the border and the words with it.
 */
function labelBox(
    id: string, text: string, tag: string,
    x: number, y: number, width: number, height: number,
    fontSize: number, color: string,
): DSLNode {
    return {
        id, tag, shape: 'rectangle', label: text,
        x, y, width, height,
        style: {
            backgroundColor: 'transparent',
            strokeColor: color,
            strokeWidth: 0,
            fontSize,
        },
    };
}

export type GutterMode = 'none' | 'hex' | 'dec';

/** Tags let a caller (and the specs) find generated elements by role. */
export const CELL_TAG = 'bytegrid-cell';
export const GUTTER_TAG = 'bytegrid-gutter';
export const SPAN_LABEL_TAG = 'bytegrid-span-label';

interface SpanSpec {
    node: DSLNode;
    /** Cell face values, one per cell. Empty strings when only a count was given. */
    values: string[];
}

/**
 * How many cells a span covers, and what goes in them.
 *
 * `cells` gives both count and face values. `bits` / `bytes` / `size` give a
 * count of blank cells. A span with none of these is not a byte-grid span.
 */
function readSpan(node: DSLNode): SpanSpec | null {
    const p = node.properties ?? {};
    if (Array.isArray(p.cells)) return { node, values: p.cells.map((v: unknown) => String(v ?? '')) };

    const count = p.bits ?? p.bytes ?? p.size;
    if (typeof count === 'number' && count > 0) {
        return { node, values: new Array(Math.floor(count)).fill('') };
    }
    return null;
}

/**
 * `exponent#0` — cell 0 of the span named `exponent`.
 *
 * Cells are generated during expansion, so their ids do not exist when the
 * author writes the diagram and an edge cannot name one. Without this there is
 * no way to point an arrow at a particular byte, which is most of what a byte
 * diagram is for: the callout that says "this is the bit that matters" has
 * nothing to attach to.
 */
export const CELL_REF = /^(.+)#(\d+)$/;

/** Resolve `span#n` to the generated cell id, or leave a plain id alone. */
export function resolveCellRef(ref: string): string {
    const match = CELL_REF.exec(ref);
    return match ? `${match[1]}__cell${Number(match[2])}` : ref;
}

/** How many cells a span covers, for validation. Null when it is not a span. */
export function spanLength(node: DSLNode): number | null {
    return readSpan(node)?.values.length ?? null;
}

function gutterLabel(mode: GutterMode, offset: number): string {
    if (mode === 'dec') return String(offset);
    return `0x${offset.toString(16).toUpperCase().padStart(4, '0')}`;
}

/**
 * Expand a byte-grid diagram into positioned nodes.
 *
 * Returns a new diagram laid out manually: every generated node carries explicit
 * coordinates, so the existing manual-layout path places it and nothing else in
 * the engine needs to know this strategy exists.
 *
 * `targetWidth` (px) reflows the grid to fit: same cell size, fewer columns.
 */
export function expandByteGrid(diagram: DSLDiagram, targetWidth?: number): DSLDiagram {
    const cfg = diagram.layout ?? { strategy: 'byte-grid' as const };
    const cellSize = cfg.cellSize ?? BYTE_GRID_DEFAULTS.cellSize;
    const rowGap = cfg.rowGap ?? BYTE_GRID_DEFAULTS.rowGap;
    const labelFontSize = cfg.labelFontSize ?? BYTE_GRID_DEFAULTS.labelFontSize;
    // Cell face values scale with the cell so a 28px bit grid and a 44px byte
    // grid are both legible without per-diagram tuning.
    const cellFontSize = cfg.cellFontSize ?? Math.max(10, Math.round(cellSize * 0.4));
    const labelColor = cfg.labelColor ?? INK_REF;
    const gutter: GutterMode = (cfg.gutter as GutterMode) ?? BYTE_GRID_DEFAULTS.gutter;
    const gutterWidth = gutter === 'none' ? 0 : (cfg.gutterWidth ?? BYTE_GRID_DEFAULTS.gutterWidth);
    const origin = cfg.origin ?? { x: 100, y: 100 };

    // Under a width budget the grid reflows instead of shrinking: the cells keep
    // the size the author chose and the run wraps sooner. Halving the authored
    // count (32 → 16 → 8) rather than taking the raw maximum keeps field and byte
    // boundaries in the same columns on every row, which is the alignment that
    // makes a byte grid readable in the first place.
    const declaredColumns = Math.max(1, cfg.columns ?? BYTE_GRID_DEFAULTS.columns);
    const columns = targetWidth === undefined
        ? declaredColumns
        : fitColumns(targetWidth - gutterWidth - EXPORT_MARGIN, cellSize, 0, declaredColumns, 'halve');

    // Each cell is one unit wide; `unitSize` scales the offsets a byte gutter
    // reports (bit grids count bits, byte grids count bytes).
    const unit = cfg.unit ?? (diagram.nodes.some(n => n.properties?.bits !== undefined) ? 'bit' : 'byte');

    const spans: SpanSpec[] = [];
    const passthrough: DSLNode[] = [];
    for (const node of diagram.nodes) {
        const span = readSpan(node);
        if (span) spans.push(span);
        else passthrough.push(node);
    }

    const rowStride = cellSize + rowGap;
    const out: DSLNode[] = [...passthrough];

    let index = 0;                       // running cell index across all spans
    let maxRow = 0;

    for (const span of spans) {
        const { node, values } = span;
        const startIndex = index;

        values.forEach((value, i) => {
            const globalIndex = startIndex + i;
            const row = Math.floor(globalIndex / columns);
            const col = globalIndex % columns;
            maxRow = Math.max(maxRow, row);

            out.push({
                id: `${node.id}__cell${i}`,
                shape: 'rectangle',
                ...(value ? { label: value } : {}),
                x: origin.x + gutterWidth + col * cellSize,
                y: origin.y + row * rowStride,
                width: cellSize,
                height: cellSize,
                // Cells inherit the span's style, so a palette role on the span
                // colours every cell in it and links them all to its swatch.
                // strokeColor before the spread so an author-supplied one wins.
                style: { fontSize: cellFontSize, strokeColor: INK_REF, ...node.style },
                tag: `${CELL_TAG}:${node.id}`,
            });
        });

        // The span label sits under the first row the span touches, centred on
        // the cells it occupies there. Multi-row spans get one label, not one
        // per row, which is what a reader expects from a bracket.
        if (node.label && values.length > 0) {
            const firstRow = Math.floor(startIndex / columns);
            const firstCol = startIndex % columns;
            const colsOnFirstRow = Math.min(values.length, columns - firstCol);
            const labelX = origin.x + gutterWidth + firstCol * cellSize;
            const labelW = colsOnFirstRow * cellSize;

            out.push(labelBox(
                `${node.id}__label`, node.label, SPAN_LABEL_TAG,
                labelX,
                origin.y + firstRow * rowStride + cellSize + BYTE_GRID_DEFAULTS.labelGap,
                labelW, BYTE_GRID_DEFAULTS.labelHeight, labelFontSize, labelColor,
            ));
        }

        index += values.length;
    }

    if (gutter !== 'none') {
        const unitsPerRow = columns * (unit === 'bit' ? 1 : 1);
        for (let row = 0; row <= maxRow; row++) {
            out.push(labelBox(
                `__gutter${row}`, gutterLabel(gutter, row * unitsPerRow), GUTTER_TAG,
                origin.x,
                origin.y + row * rowStride + (cellSize - BYTE_GRID_DEFAULTS.labelHeight) / 2,
                gutterWidth - 12, BYTE_GRID_DEFAULTS.labelHeight, labelFontSize, labelColor,
            ));
        }
    }

    return {
        ...diagram,
        // Provide `ink` unless the diagram named it, so structural colour is
        // themeable without every author having to declare it.
        palette: diagram.palette?.[INK_ROLE]
            ? diagram.palette
            : { ...(diagram.palette ?? {}), [INK_ROLE]: DEFAULT_INK },
        // Every generated node carries explicit coordinates, so hand off to the
        // manual path rather than teaching the layout manager a new strategy.
        layout: { ...cfg, strategy: 'manual' },
        nodes: out,
        // `span#n` endpoints become the id of the cell that expansion just made,
        // so a callout arrow can point at one byte.
        edges: (diagram.edges ?? []).map(edge => ({
            ...edge,
            from: resolveCellRef(edge.from),
            to: resolveCellRef(edge.to),
        })),
    };
}
