# Table Shape — Technical Design Document

> Full-featured interactive table element with configurable rows/columns, header row, cell editing, column/row resizing, column reorder, sorting, and per-region color styling.

## Overview

The table is implemented as a dedicated shape type (`'table'`) with its own renderer, utility library, and interaction handlers. It integrates with the existing shape registry, property panel, selection handler, and text editing overlay.

## Architecture

```
src/types.ts                          — DrawingElement table properties
src/shapes/renderers/table-renderer.ts — Dedicated TableRenderer (sketch + architectural)
src/shapes/register-shapes.ts          — Registry entry: 'table' → TableRenderer
src/utils/table-utils.ts               — Pure utility functions (layout, hit-testing, data ops)
src/utils/tool-handlers/draw-handler.ts — Creation defaults (3×3, headers on)
src/utils/tool-handlers/selection-handler.ts — Resize, reorder, sort interactions
src/utils/tool-handlers/text-editing-handler.ts — Cell double-click editing
src/components/text-editing-overlay.tsx — Textarea positioned over cell
src/components/canvas.tsx              — Reactive tracking & editing signals
src/config/properties.ts               — Property panel configuration
src/utils/pointer-state.ts             — Mutable pointer state for table interactions
src/utils/rough-cache.ts               — Element hash includes table properties
```

## Data Model

All table properties are optional on `DrawingElement` (in `src/types.ts:263-277`):

| Property | Type | Default | Description |
|---|---|---|---|
| `tableRows` | `number` | `3` | Number of data (body) rows |
| `tableCols` | `number` | `3` | Number of columns |
| `tableHeaders` | `boolean` | `true` | Whether header row is displayed |
| `tableData` | `string[][]` | `[]` | Row-major cell data. Row 0 = header labels when `tableHeaders` is true |
| `tableColWidths` | `number[]` | `[1/n, ...]` | Fractional column widths (sum ≈ 1.0) |
| `tableRowHeights` | `number[]` | `[1/n, ...]` | Fractional row heights including header (sum ≈ 1.0) |
| `tableColOrder` | `number[]` | `undefined` | Column display order mapping (e.g., `[2,0,1]`) |
| `tableSortCol` | `number` | `-1` | Index of currently sorted column (-1 = none) |
| `tableSortDir` | `'asc' \| 'desc'` | `'asc'` | Sort direction |
| `tableHeaderColor` | `string` | `'#e2e8f0'` | Header row background color |
| `tableHeaderTextColor` | `string` | `''` | Header text color (falls back to `textColor`) |
| `tableRowColor` | `string` | `''` | Body row base color (even rows, or all if no alt) |
| `tableAltRowColor` | `string` | `''` | Alternating (odd) body row color |

### Visual Row Layout

When `tableHeaders` is true:
- Visual row 0 = header (data row index -1, reads from `tableData[0]`)
- Visual rows 1..N = body (data row indices 0..N-1, read from `tableData[1..N]`)
- `totalVisualRows = tableRows + 1`

When `tableHeaders` is false:
- All rows are body rows
- `totalVisualRows = tableRows`

### Color Priority

Cell background colors are resolved per-cell in this order:
1. **Header cells**: `tableHeaderColor` (if set and cell is in header row)
2. **Odd body rows** (bodyRowIndex % 2 === 1): `tableAltRowColor` (if set)
3. **Even body rows** (or fallback): `tableRowColor || tableAltRowColor || null`

This means setting only one of `tableRowColor` or `tableAltRowColor` colors all body rows uniformly. Setting both produces zebra striping.

## Rendering (`table-renderer.ts`)

`TableRenderer` extends `ShapeRenderer` and overrides `renderArchitectural()` and `renderSketch()`.

### Render Pipeline (3 phases)

**Phase 1 — Cell Backgrounds** (`ctx.fillRect` per cell)
- Computes all cell rectangles via `computeCellRects()`
- Iterates cells, determines background color per the priority above
- Uses native canvas calls (not RoughJS) — always executes fresh, never cached

**Phase 2 — Grid Lines**
- *Sketch mode*: Uses `rc.rectangle()` for outer border and `rc.line()` for internal grid lines. All RoughJS calls pass `fill: undefined` to prevent accidental fill painting.
- *Architectural mode*: Uses `ctx.strokeRect()` and `ctx.moveTo()`/`ctx.lineTo()` for clean lines.

**Phase 3 — Cell Text & Sort Indicators**
- Text centered in each cell, clipped to cell bounds
- Header cells use bold font and `tableHeaderTextColor`
- Sort indicators on ALL header cells:
  - **Sorted column**: Solid triangle (▲ asc / ▼ desc) in `headerTextColor`
  - **Unsorted columns**: Dimmed (0.3 alpha) up/down chevron pair

### Important: `fill: undefined` vs `fill: 'none'`

RoughJS treats `'none'` as a truthy fill color. When the canvas receives `ctx.fillStyle = 'none'` (invalid CSS), it silently ignores the assignment and retains the previous `fillStyle`. This caused a critical bug where the outer border rectangle was filled with whatever color was last used for cell backgrounds. The fix uses `fill: undefined` which RoughJS correctly interprets as "skip fill entirely."

## Utility Functions (`table-utils.ts`)

### Layout & Hit Testing
- `computeCellRects(x, y, w, h, colWidths, rowHeights, colOrder, hasHeader)` → `CellRect[]` — Pixel rectangles for every cell
- `hitTestTableCell(px, py, cellRects)` → `CellRect | null` — Point-in-cell lookup
- `hitTestColEdge(px, py, cellRects, threshold)` — Detects cursor near column border (for resize)
- `hitTestRowEdge(px, py, cellRects, threshold)` — Detects cursor near row border (for resize)

### Data Manipulation
- `defaultTableData(rows, cols)` — Creates empty `string[][]`
- `resizeTableData(data, newRows, newCols)` — Grow/shrink preserving existing cell contents
- `defaultColWidths(cols)` / `defaultRowHeights(totalRows)` — Equal fractional distributions
- `reorderColumns(data, colWidths, newOrder)` — Rearranges data and widths by new column order
- `sortTableData(data, colIndex, direction)` — Sorts body rows (numeric-first, then string fallback)
- `insertTableRow` / `deleteTableRow` — Row insertion/deletion with height redistribution
- `insertTableColumn` / `deleteTableColumn` — Column insertion/deletion with width redistribution

### CellRect Structure
```typescript
interface CellRect {
    row: number;     // visual row index (0 = header if headers enabled)
    col: number;     // visual column index (after colOrder mapping)
    dataRow: number; // actual data row index (-1 for header)
    dataCol: number; // actual data column index
    x: number; y: number; w: number; h: number;
}
```

## Interactions (`selection-handler.ts`)

### Column/Row Resize
- **Detection**: `hitTestColEdge()` / `hitTestRowEdge()` with threshold `6/scale` px
- **Cursor**: `col-resize` or `row-resize` on hover
- **Drag**: Adjusts fractional widths/heights of adjacent columns/rows
- **Minimum size**: 30px (columns) / 20px (rows) equivalent in fractional units
- **State**: `pState.tableResizeCol`, `pState.tableResizeRow`, `pState.tableResizeInitialWidths/Heights`

### Column Reorder (Drag & Drop)
- **Initiation**: Pointer down on header cell sets `pState.tableDragCol`
- **Threshold**: Horizontal drag > `5/scale` px triggers reorder mode (cursor: `grabbing`)
- **Drop**: On pointer up, determines target column via `hitTestTableCell()`, then calls `reorderColumns()` to rearrange `tableData` and `tableColWidths`
- **Cleanup**: Resets `tableColOrder` to undefined (data is physically reordered) and `tableSortCol` to -1

### Sort (Header Icon Click)
- **Trigger**: Short click (< 5px drag) on the sort icon area in a header cell
- **Icon area**: Right edge of header cell, width = `indicatorSize + padding * 2`
- **Cycle**: none → asc → desc → none (per column)
- **Effect**: Sorts `tableData` body rows via `sortTableData()`, preserving header row

### Cell Editing (`text-editing-handler.ts`)
- **Trigger**: Double-click on any cell
- **Flow**:
  1. `hitTestTableCell()` finds clicked cell
  2. Sets `editingProperty = 'tableCell'` and `tableEditingCell` signal with cell geometry
  3. `TextEditingOverlay` positions textarea over the cell (absolute, no translate transform)
  4. Tab key commits current cell (fires `onCommitText`)
  5. Escape commits and switches to selection tool
  6. On commit: updates `tableData[row][col]` in store

## Creation Defaults (`draw-handler.ts`)

When a new table element is created:
```typescript
tableRows = 3;
tableCols = 3;
tableHeaders = true;
tableData = [['Col 1', 'Col 2', 'Col 3'], ['', '', ''], ['', '', ''], ['', '', '']];
tableColWidths = [1/3, 1/3, 1/3];
tableRowHeights = [1/4, 1/4, 1/4, 1/4];
tableHeaderColor = '#e2e8f0';
tableHeaderTextColor = '';   // falls back to textColor
tableRowColor = '';          // no body row color by default
tableAltRowColor = '';       // no alternating color by default
tableSortCol = -1;
tableSortDir = 'asc';
```

All color properties are initialized (even as empty strings) at creation time. This ensures SolidJS creates reactive signals for them — properties that are `undefined` at store insertion time may not trigger `createEffect` when later set via the property panel.

The table does NOT set `backgroundColor` or `fillStyle` — these generic properties are not used by the table renderer and are excluded from the table's property panel (`applicableTo` lists).

## Reactive Tracking (`canvas.tsx`)

The canvas `createEffect` explicitly reads all table properties to ensure redraws:
```typescript
e.tableRows; e.tableCols; e.tableHeaders; e.tableData;
e.tableColWidths; e.tableRowHeights; e.tableColOrder;
e.tableSortCol; e.tableSortDir;
e.tableHeaderColor; e.tableHeaderTextColor; e.tableRowColor; e.tableAltRowColor;
```

## RoughJS Cache (`rough-cache.ts`)

`computeElementHash()` includes all table properties for cache invalidation:
- Structure: `tableRows`, `tableCols`, `tableHeaders`, `tableColWidths`, `tableRowHeights`, `tableColOrder`
- Colors: `tableHeaderColor`, `tableRowColor`, `tableAltRowColor`, `tableHeaderTextColor`
- Sort: `tableSortCol`, `tableSortDir`
- Data: `tableData` (serialized as tab/newline delimited)

Without these, changing table colors or structure would not invalidate the cached RoughJS drawables, causing stale grid line rendering.

## Property Panel (`properties.ts`)

Table-specific properties visible in the property panel:

| Key | Label | Type | Group | Notes |
|---|---|---|---|---|
| `tableRows` | Rows | number | style | Triggers `resizeTableData()` on change |
| `tableCols` | Columns | number | style | Triggers `resizeTableData()` on change |
| `tableHeaders` | Headers | toggle | style | Adds/removes header row from data |
| `tableHeaderColor` | Header Color | color | style | `dependsOn: 'tableHeaders'` |
| `tableHeaderTextColor` | Header Text | color | style | `dependsOn: 'tableHeaders'` |
| `tableRowColor` | Row Color | color | style | |
| `tableAltRowColor` | Alt Row Color | color | style | |

When `tableRows` or `tableCols` change, `handleChange` in `property-panel.tsx` calls `resizeTableData()` to grow/shrink the data array while preserving existing cell contents, and redistributes column widths and row heights equally.

## Pointer State (`pointer-state.ts`)

Mutable state used during table interactions:

```typescript
tableResizeCol: number;       // column index being resized (-1 = none)
tableResizeRow: number;       // row index being resized (-1 = none)
tableResizeElementId: string | null;
tableResizeStartX: number;
tableResizeStartY: number;
tableResizeInitialWidths: number[] | null;
tableResizeInitialHeights: number[] | null;
tableDragCol: number;         // column being dragged for reorder (-1 = none)
tableDragElementId: string | null;
```

## Key Design Decisions

1. **Fractional widths/heights**: Column widths and row heights are stored as fractions of the element's total width/height. This means resizing the element scales all cells proportionally without recalculation.

2. **Data includes header**: `tableData[0]` is the header row when `tableHeaders` is true. This simplifies serialization and keeps header labels editable via the same cell editing mechanism.

3. **No `tableColOrder` persistence**: After a column drag-and-drop, the data and widths are physically reordered, and `tableColOrder` is reset to `undefined`. This avoids a persistent indirection layer.

4. **Sort icon hit area**: Sorting only triggers when clicking the sort icon (right edge of header cell), not anywhere on the header. This prevents accidental sorts when trying to click a header cell for editing.

5. **Empty string initialization**: Color properties default to `''` (not `undefined`) so SolidJS creates reactive signals at store insertion time. The renderer uses `|| null` to treat empty strings as "no color."

## Known Limitations

- Tables created before the SolidJS reactivity fix (empty string initialization) may not react to color property changes from the property panel. Recreating the table resolves this.
- Column/row resize doesn't support resizing the last column/row edge (only internal edges between adjacent columns/rows).
- No merged cells support.
- No per-cell alignment or formatting (all cells use the element's font settings).
