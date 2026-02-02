/**
 * Table Utilities
 * Pure functions for table data manipulation, layout computation,
 * and hit testing for interactive table features.
 */

export interface CellRect {
    row: number;     // visual row index (0 = header if headers enabled)
    col: number;     // visual column index (after colOrder mapping)
    dataRow: number; // actual data row index (-1 for header)
    dataCol: number; // actual data column index
    x: number;
    y: number;
    w: number;
    h: number;
}

/**
 * Create an empty string[][] of the given dimensions.
 */
export function defaultTableData(rows: number, cols: number): string[][] {
    return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
}

/**
 * Grow or shrink a table data array, preserving existing cell contents.
 */
export function resizeTableData(
    data: string[][],
    newRows: number,
    newCols: number
): string[][] {
    const result: string[][] = [];
    for (let r = 0; r < newRows; r++) {
        const row: string[] = [];
        for (let c = 0; c < newCols; c++) {
            row.push(data[r]?.[c] ?? '');
        }
        result.push(row);
    }
    return result;
}

/**
 * Create default equal fractional widths for N columns.
 */
export function defaultColWidths(cols: number): number[] {
    return Array.from({ length: cols }, () => 1 / cols);
}

/**
 * Create default equal fractional heights for N rows (including header if present).
 */
export function defaultRowHeights(totalRows: number): number[] {
    return Array.from({ length: totalRows }, () => 1 / totalRows);
}

/**
 * Compute pixel rectangles for every cell in the table.
 */
export function computeCellRects(
    x: number,
    y: number,
    w: number,
    h: number,
    colWidths: number[],
    rowHeights: number[],
    colOrder: number[] | undefined,
    hasHeader: boolean
): CellRect[] {
    const rects: CellRect[] = [];
    const cols = colWidths.length;
    const order = colOrder ?? Array.from({ length: cols }, (_, i) => i);

    // Compute cumulative Y positions from rowHeights
    const rowYs: number[] = [0];
    for (let r = 0; r < rowHeights.length; r++) {
        rowYs.push(rowYs[r] + rowHeights[r] * h);
    }

    // Compute cumulative X positions from colWidths (in display order)
    const colXs: number[] = [0];
    for (let c = 0; c < cols; c++) {
        const dataCol = order[c];
        colXs.push(colXs[c] + colWidths[dataCol] * w);
    }

    for (let r = 0; r < rowHeights.length; r++) {
        for (let c = 0; c < cols; c++) {
            const dataCol = order[c];
            const isHeaderRow = hasHeader && r === 0;
            rects.push({
                row: r,
                col: c,
                dataRow: isHeaderRow ? -1 : (hasHeader ? r - 1 : r),
                dataCol,
                x: x + colXs[c],
                y: y + rowYs[r],
                w: colXs[c + 1] - colXs[c],
                h: rowYs[r + 1] - rowYs[r],
            });
        }
    }

    return rects;
}

/**
 * Find which cell a point falls in. Returns the CellRect or null.
 */
export function hitTestTableCell(
    px: number,
    py: number,
    cellRects: CellRect[]
): CellRect | null {
    for (const rect of cellRects) {
        if (px >= rect.x && px <= rect.x + rect.w &&
            py >= rect.y && py <= rect.y + rect.h) {
            return rect;
        }
    }
    return null;
}

/**
 * Detect if cursor is near a column edge for resize.
 * Returns the column index of the edge (left side of which column) or -1.
 */
export function hitTestColEdge(
    px: number,
    py: number,
    cellRects: CellRect[],
    threshold: number = 5
): { colIndex: number; x: number } | null {
    if (cellRects.length === 0) return null;

    // Get unique column X boundaries (right edges of each column)
    const cols = Math.max(...cellRects.map(r => r.col)) + 1;
    const tableY = Math.min(...cellRects.map(r => r.y));
    const tableBottom = Math.max(...cellRects.map(r => r.y + r.h));

    if (py < tableY || py > tableBottom) return null;

    // For each column except the last, check if near right edge
    for (let c = 0; c < cols - 1; c++) {
        const cell = cellRects.find(r => r.col === c && r.row === 0);
        if (!cell) continue;
        const edgeX = cell.x + cell.w;
        if (Math.abs(px - edgeX) <= threshold) {
            return { colIndex: c, x: edgeX };
        }
    }
    return null;
}

/**
 * Detect if cursor is near a row edge for resize.
 * Returns the row index of the edge (bottom side of which row) or -1.
 */
export function hitTestRowEdge(
    px: number,
    py: number,
    cellRects: CellRect[],
    threshold: number = 5
): { rowIndex: number; y: number } | null {
    if (cellRects.length === 0) return null;

    const rows = Math.max(...cellRects.map(r => r.row)) + 1;
    const tableX = Math.min(...cellRects.map(r => r.x));
    const tableRight = Math.max(...cellRects.map(r => r.x + r.w));

    if (px < tableX || px > tableRight) return null;

    // For each row except the last, check if near bottom edge
    for (let r = 0; r < rows - 1; r++) {
        const cell = cellRects.find(c => c.row === r && c.col === 0);
        if (!cell) continue;
        const edgeY = cell.y + cell.h;
        if (Math.abs(py - edgeY) <= threshold) {
            return { rowIndex: r, y: edgeY };
        }
    }
    return null;
}

/**
 * Reorder columns: rearrange tableData and colWidths based on new column order.
 */
export function reorderColumns(
    data: string[][],
    colWidths: number[],
    newOrder: number[]
): { data: string[][]; colWidths: number[] } {
    const newData = data.map(row => newOrder.map(ci => row[ci] ?? ''));
    const newWidths = newOrder.map(ci => colWidths[ci]);
    return { data: newData, colWidths: newWidths };
}

/**
 * Sort table data rows by a specific column.
 * Header data (row 0 in tableData if tableHeaders) is NOT included here — caller
 * should pass only the body rows.
 */
/**
 * Insert a row into tableData at the given index.
 * Also inserts a corresponding entry in rowHeights (redistributed equally).
 */
export function insertTableRow(
    data: string[][],
    _rowHeights: number[],
    atIndex: number
): { data: string[][]; rowHeights: number[] } {
    const cols = data[0]?.length ?? 0;
    const newRow = Array.from({ length: cols }, () => '');
    const newData = [...data];
    newData.splice(atIndex, 0, newRow);
    // Redistribute row heights equally
    const newHeights = defaultRowHeights(newData.length);
    return { data: newData, rowHeights: newHeights };
}

/**
 * Delete a row from tableData at the given index.
 * Also removes the corresponding entry in rowHeights (redistributed equally).
 */
export function deleteTableRow(
    data: string[][],
    rowHeights: number[],
    atIndex: number
): { data: string[][]; rowHeights: number[] } {
    if (data.length <= 1) return { data, rowHeights }; // Don't delete last row
    const newData = [...data];
    newData.splice(atIndex, 1);
    const newHeights = defaultRowHeights(newData.length);
    return { data: newData, rowHeights: newHeights };
}

/**
 * Insert a column into tableData at the given index.
 * Also inserts a corresponding entry in colWidths (redistributed equally).
 */
export function insertTableColumn(
    data: string[][],
    colWidths: number[],
    atIndex: number,
    hasHeader: boolean
): { data: string[][]; colWidths: number[] } {
    const newData = data.map((row, r) => {
        const newRow = [...row];
        const defaultVal = (hasHeader && r === 0) ? `Col ${colWidths.length + 1}` : '';
        newRow.splice(atIndex, 0, defaultVal);
        return newRow;
    });
    const newWidths = defaultColWidths(colWidths.length + 1);
    return { data: newData, colWidths: newWidths };
}

/**
 * Delete a column from tableData at the given index.
 * Also removes the corresponding entry in colWidths (redistributed equally).
 */
export function deleteTableColumn(
    data: string[][],
    colWidths: number[],
    atIndex: number
): { data: string[][]; colWidths: number[] } {
    if (colWidths.length <= 1) return { data, colWidths }; // Don't delete last col
    const newData = data.map(row => {
        const newRow = [...row];
        newRow.splice(atIndex, 1);
        return newRow;
    });
    const newWidths = defaultColWidths(colWidths.length - 1);
    return { data: newData, colWidths: newWidths };
}

export function sortTableData(
    data: string[][],
    colIndex: number,
    direction: 'asc' | 'desc'
): string[][] {
    const sorted = [...data].sort((a, b) => {
        const va = a[colIndex] ?? '';
        const vb = b[colIndex] ?? '';
        // Try numeric comparison first
        const na = Number(va);
        const nb = Number(vb);
        if (!isNaN(na) && !isNaN(nb)) {
            return direction === 'asc' ? na - nb : nb - na;
        }
        // Fall back to string comparison
        return direction === 'asc'
            ? va.localeCompare(vb)
            : vb.localeCompare(va);
    });
    return sorted;
}
