---
id: table
name: Tables
icon: "📊"
category: Structure
description: Create and edit tables with rows, columns, and data
seoTitle: "Add a table to a diagram — editable, sortable tables"
seoDescription: "Editable tables on the canvas: resize columns, merge cells, sort, format numbers and paste straight from a spreadsheet."
---

# 📊 Table

Create interactive tables with customizable rows, columns, headers, and styling. Perfect for organizing data, creating comparison charts, and building structured content.

## Overview

Tables in Yappy provide a powerful way to display structured data on your canvas. They support features like sortable columns, resizable columns and rows, text alignment, custom styling, and clipboard integration with spreadsheet applications.

:::cards
📝 Editable Cells | Double-click any cell to edit its content. Text automatically wraps within cells.
📐 Resizable | Drag column and row edges to resize. Double-click edges to auto-fit content.
🔢 Sortable | Click column headers to sort data ascending or descending (numeric-aware).
📋 Clipboard | Copy/paste data to and from Excel, Google Sheets, or other spreadsheets.
🔗 Merge Cells | Combine multiple cells into one. Select cells with Shift+click, then merge via context menu.
💲 Cell Formatting | Format cells as numbers, currency, percentages, or dates with customizable patterns.
🔲 Custom Borders | Apply custom border styles and colors to individual cells or ranges.
:::

## Creating a Table

### Using the Toolbar

1. Select the **Table** tool from the shapes menu in the toolbar
2. Click and drag on the canvas to define the table size
3. Release to create the table with default 3×3 dimensions

### Using the API

```
// Create a basic 3x3 table
const tableId = Yappy.createTable(100, 100, 400, 200);

// Create a 5x4 table with custom styling
const tableId = Yappy.createTable(100, 100, 500, 300, 5, 4, {
    tableHeaderColor: '#3b82f6',
    tableHeaderTextColor: '#ffffff',
    tableRowColor: '#f0f9ff',
    tableAltRowColor: '#e0f2fe'
});
```

## Editing Cells

### Interactive Editing

- **Double-click** a cell or press <kbd>Enter</kbd>/<kbd>F2</kbd> to start editing
- Type your content - text will wrap automatically
- Press <kbd>Tab</kbd> to save and move to the next cell, <kbd>Shift+Tab</kbd> to go back
- Press <kbd>Enter</kbd> to save and move down, <kbd>Shift+Enter</kbd> for newline
- Use <kbd>Arrow keys</kbd> to navigate between cells when not editing
- Just start typing to replace cell content
- Press <kbd>Delete</kbd> to clear cell(s), <kbd>Escape</kbd> to cancel editing

### Moving Tables

When a table is selected, a **move handle** (blue circle with arrows) appears at the top-left corner. Drag this handle to reposition the table. You can also click and drag from any cell area to move the table — a short click selects the cell, while a longer drag moves the table.

### Using the API

```
// Set cell value (row 0 is header when headers enabled)
Yappy.setTableCell(tableId, 0, 0, 'Name');    // Header row
Yappy.setTableCell(tableId, 1, 0, 'Alice');   // First data row
Yappy.setTableCell(tableId, 1, 1, '30');

// Get cell value
const value = Yappy.getTableCell(tableId, 1, 0);  // Returns 'Alice'

// Set all data at once
Yappy.setTableData(tableId, [
    ['Product', 'Price', 'Stock'],
    ['Apple', '$1.00', '150'],
    ['Banana', '$0.50', '200'],
    ['Orange', '$0.75', '100']
]);
```

## Row & Column Operations

### Context Menu

Right-click on a table cell to access these operations:

- **Insert Row Above/Below** - Add a new row at the clicked position
- **Delete Row** - Remove the current row (minimum 1 row required)
- **Insert Column Left/Right** - Add a new column
- **Delete Column** - Remove the current column (minimum 1 column required)

### Using the API

```
// Insert row at index (0-based, includes header)
Yappy.insertTableRow(tableId, 2);    // Insert at position 2

// Delete row at index
Yappy.deleteTableRow(tableId, 2);

// Insert column at index
Yappy.insertTableColumn(tableId, 1); // Insert at position 1

// Delete column
Yappy.deleteTableColumn(tableId, 1);
```

## Resizing Columns & Rows

### Manual Resize

- Hover over a column edge (between headers) - cursor changes to resize indicator
- Click and drag to resize the column
- Row edges can be resized the same way

### Auto-fit Column Width

**Double-click** on a column edge to automatically fit the column width to its content. This measures all cell content and sets the optimal width.

### Using the API

```
// Set column width as fraction (0-1, all columns must sum to 1)
Yappy.setTableColumnWidth(tableId, 0, 0.5);  // First column = 50%

// Widths are automatically redistributed to maintain total = 1
```

## Sorting Data

### Interactive Sorting

- Click on any header cell to sort by that column
- Click again to toggle between ascending and descending
- Sort indicator (▲/▼) appears in the active column header
- Sorting is **numeric-aware** - numbers sort correctly (3, 20, 100 not 100, 20, 3)

### Using the API

```
// Sort by column index
Yappy.sortTableColumn(tableId, 0, 'asc');   // Sort by first column, ascending
Yappy.sortTableColumn(tableId, 1, 'desc');  // Sort by second column, descending
```

## Column Alignment

### Context Menu

Right-click on a table cell → **Align Column** submenu:

- **Left** - Align text to the left
- **Center** - Center text (default)
- **Right** - Align text to the right (useful for numbers)

A checkmark (✓) indicates the current alignment.

### Using the API

```
// Set column alignment
Yappy.setTableColumnAlignment(tableId, 0, 'left');
Yappy.setTableColumnAlignment(tableId, 1, 'center');
Yappy.setTableColumnAlignment(tableId, 2, 'right');
```

## Table Styling

### Available Style Options

| Property | Description | Default |
| --- | --- | --- |
| `headerColor` | Background color of header row | #e2e8f0 |
| `headerTextColor` | Text color in header row | Inherited from stroke |
| `rowColor` | Background color of even rows | Transparent |
| `altRowColor` | Background color of odd rows (alternating) | Transparent |

### Using the API

```
// Apply custom styling
Yappy.setTableStyle(tableId, {
    headerColor: '#3b82f6',
    headerTextColor: '#ffffff',
    rowColor: '#f0f9ff',
    altRowColor: '#e0f2fe'
});
```

## Clipboard Operations

### Paste from Spreadsheet

1. Copy data from Excel, Google Sheets, or any spreadsheet
2. Select a table in Yappy
3. Press <kbd>Ctrl</kbd>+<kbd>V</kbd> to paste
4. Or right-click → Table → **Paste Table Data**

:::tip 💡 Tip
Pasting replaces all table data. The table dimensions adjust automatically to match the pasted data.
:::

### Copy to Clipboard

Right-click on a table cell → Table → **Copy Table Data**

Data is copied as TSV (tab-separated values), compatible with all spreadsheet applications.

### Using the API

```
// Copy table data to clipboard
await Yappy.copyTableToClipboard(tableId);

// Paste clipboard data into table
await Yappy.pasteIntoTable(tableId);

// Export as CSV string
const csv = Yappy.exportTableAsCSV(tableId);

// Import from CSV/TSV string
Yappy.importTableFromCSV(tableId, csvString);
```

## Column Reordering

Drag and drop columns to reorder them:

1. Click and hold on a column header
2. Drag sideways — the target column highlights and a blue insertion line shows exactly where the column will land
3. Release to drop the column in its new position

:::warning ⚠️ Note
Reordering columns resets any active sort. The data is permanently rearranged in the new column order.
:::

## Merging Cells

Combine multiple cells into a single larger cell:

### Interactive Merge

1. Hold <kbd>Shift</kbd> or <kbd>Ctrl</kbd> and click on the first cell
2. While still holding the modifier key, click on the last cell of the range (or drag to select)
3. Right-click to open the context menu
4. Select **Table → Merge Cells**

### Unmerge Cells

To split a merged cell back into individual cells:

1. Right-click on any merged cell
2. Select **Table → Unmerge Cells**

:::tip 💡 Tip
When cells are merged, all cell contents are combined with line breaks and placed in the merged cell. When unmerging, the combined content stays in the top-left cell position.
:::

### Using the API

```
// Merge cells from (row 1, col 0) to (row 2, col 1)
Yappy.mergeCells(tableId, 1, 0, 2, 1);

// Unmerge a merged cell at position (row 1, col 0)
Yappy.unmergeCells(tableId, 1, 0);

// Get all merged regions in a table
const merges = Yappy.getMergedCells(tableId);
// Returns: [{ startRow: 1, startCol: 0, endRow: 2, endCol: 1 }, ...]
```

## Cell Formatting

Format cell values as numbers, currencies, percentages, or dates:

### Format Types

| Type | Description | Example |
| --- | --- | --- |
| **Text** | Plain text (default) | Hello World |
| **Number** | Numeric with optional decimals and thousands separator | 1,234.56 |
| **Currency** | Number with currency symbol ($, €, £, ¥, etc.) | $1,234.56 |
| **Percentage** | Number displayed as percentage | 75% |
| **Date** | Date with customizable pattern | Jan 31, 2025 |

### Applying Formats

You can format an entire column or specific cells:

#### Format Entire Column

1. Right-click on any cell in the column
2. Navigate to **Table → Format Cells**
3. Choose a format type with **(Column)** suffix (e.g., "Currency (Column)")
4. This applies the format to all body cells in that column (excluding headers)

#### Format Specific Cells

1. Select a cell or range of cells (using Shift+Click)
2. Right-click to open the context menu
3. Navigate to **Table → Format Cells**
4. Choose a format type with **(Cell)** suffix (e.g., "Currency (Cell)")

:::tip 💡 Tip
For percentage formatting, enter the decimal value (e.g., 0.75 for 75%). The value will be automatically multiplied by 100 for display.
:::

## Custom Cell Borders

Apply custom border styles and colors to cells:

### Border Positions

- **All Borders** - Border on all four sides
- **Outside Borders** - Border only on the outer edges of selected range
- **Inside Borders** - Border only on internal grid lines
- **Top/Bottom/Left/Right** - Single edge borders
- **No Borders** - Remove all borders

### Border Styles

- **Thin** - 1px line width
- **Medium** - 2px line width
- **Thick** - 3px line width

### Applying Borders

1. Select a cell or range of cells
2. Right-click to open the context menu
3. Navigate to **Table → Cell Borders**
4. Choose border position, then optionally select style or color

:::tip 💡 Tip
Custom borders are drawn on top of the default table grid, allowing you to create visual emphasis on specific cells or sections.
:::

## Scripting (API)

Every table can be built and driven from code. The API is exposed on the global `window.Yappy` object, so you can call these methods from the browser console, a script element, or the in-app scripting panel. The **Using the API** snippets throughout this page all use these methods; the table below is the full reference.

| Method | Description |
| --- | --- |
| `createTable(x, y, w, h, rows?, cols?, options?)` | Create a new table element |
| `setTableCell(id, row, col, value)` | Set a cell's value |
| `getTableCell(id, row, col)` | Get a cell's value |
| `getTableData(id)` | Get all table data as 2D array |
| `setTableData(id, data)` | Set all table data at once |
| `insertTableRow(id, index)` | Insert a row at index |
| `deleteTableRow(id, index)` | Delete a row at index |
| `insertTableColumn(id, index)` | Insert a column at index |
| `deleteTableColumn(id, index)` | Delete a column at index |
| `sortTableColumn(id, colIndex, direction)` | Sort by column ('asc' or 'desc') |
| `setTableColumnAlignment(id, col, align)` | Set column alignment ('left', 'center', 'right') |
| `setTableColumnWidth(id, col, width)` | Set column width (0-1 fraction) |
| `setTableStyle(id, options)` | Set table colors and styling |
| `copyTableToClipboard(id)` | Copy table data to clipboard as TSV |
| `pasteIntoTable(id)` | Paste clipboard data into table |
| `exportTableAsCSV(id)` | Export table data as CSV string |
| `importTableFromCSV(id, csv)` | Import CSV/TSV string into table |
| `mergeCells(id, startRow, startCol, endRow, endCol)` | Merge a range of cells |
| `unmergeCells(id, row, col)` | Unmerge cells at position |
| `getMergedCells(id)` | Get all merged cell regions |

## Keyboard Shortcuts

:::shortcuts
Double-click | Edit cell content
Enter | Confirm edit and move down / Start editing cell
Shift+Enter | Insert newline within cell
Tab / Shift+Tab | Move to next/previous cell (wraps at row boundary)
Arrow Keys | Navigate between cells (when not editing)
F2 | Start editing selected cell
Delete / Backspace | Clear selected cell(s) content
Escape | Cancel cell edit
Type any character | Start editing cell with that character
Ctrl+V | Paste data from clipboard
Double-click column edge | Auto-fit column width
Shift+Click | Select cell range for merging
Ctrl+Click | Start cell selection for merging
:::

## Table Animations

Tables have 12 dedicated animation presets that leverage their internal structure. These are available in the Animation Panel when a table is selected.

| Animation | Effect |
| --- | --- |
| `tableRowReveal` | Rows appear top-to-bottom |
| `tableColReveal` | Columns appear left-to-right |
| `tableCellFill` | Cells fill one at a time |
| `tableHeatmapFadeIn` | Cells fade in with random stagger |
| `tableRowHighlight` | Highlight sweeps through rows |
| `tableColPulse` | Highlight pulses through columns |
| `tableGridDraw` | Border, grid, then content draws in |
| `tableHeaderSlam` | Header bounces in, body fades |
| `tableCountUp` | Numeric cells count from 0 |
| `tableAccordion` | Rows expand one at a time |
| `tableCellsAssemble` | Cells fly in and assemble into the table |
| `tableLightningSplit` | Lightning splits table, halves slam together |
