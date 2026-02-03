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

/**
 * Wrap text into multiple lines that fit within the given width.
 * Returns an array of lines. Handles both word-based and character-based wrapping.
 */
export function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
): string[] {
    // Handle explicit line breaks first
    const paragraphs = text.split('\n');
    const lines: string[] = [];

    // Helper to break a long word into chunks that fit
    const breakLongWord = (word: string): string[] => {
        const chunks: string[] = [];
        let chunk = '';
        for (const char of word) {
            const testChunk = chunk + char;
            if (ctx.measureText(testChunk).width > maxWidth && chunk) {
                chunks.push(chunk);
                chunk = char;
            } else {
                chunk = testChunk;
            }
        }
        if (chunk) chunks.push(chunk);
        return chunks;
    };

    for (const paragraph of paragraphs) {
        if (!paragraph) {
            lines.push('');
            continue;
        }

        const words = paragraph.split(/\s+/);
        let currentLine = '';

        for (const word of words) {
            // Check if the word itself is too long
            if (ctx.measureText(word).width > maxWidth) {
                // Push current line if any
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = '';
                }
                // Break the long word into chunks
                const chunks = breakLongWord(word);
                for (let i = 0; i < chunks.length - 1; i++) {
                    lines.push(chunks[i]);
                }
                // Last chunk becomes start of next line
                currentLine = chunks[chunks.length - 1] || '';
                continue;
            }

            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }
    }

    return lines.length > 0 ? lines : [''];
}

/**
 * Measure the optimal width for a column based on its content.
 * Returns the width as a fraction of total table width.
 */
export function measureColumnOptimalWidth(
    ctx: CanvasRenderingContext2D,
    data: string[][],
    colIndex: number,
    fontSize: number,
    tableWidth: number,
    padding: number = 12, // padding on both sides
    hasHeader: boolean = true
): number {
    let maxWidth = 0;
    const font = `${fontSize}px sans-serif`;
    const boldFont = `bold ${fontSize}px sans-serif`;

    for (let row = 0; row < data.length; row++) {
        const cellText = data[row]?.[colIndex] ?? '';
        if (!cellText) continue;

        // Use bold font for header row
        ctx.font = (hasHeader && row === 0) ? boldFont : font;
        const textWidth = ctx.measureText(cellText).width;
        maxWidth = Math.max(maxWidth, textWidth);
    }

    // Add padding and a small buffer for sort indicator in header
    const sortIndicatorSpace = hasHeader ? 20 : 0;
    const optimalPixelWidth = maxWidth + padding * 2 + sortIndicatorSpace;

    // Convert to fraction of table width, with min/max constraints
    const minFraction = 0.05; // 5% minimum
    const maxFraction = 0.8;  // 80% maximum
    const fraction = Math.max(minFraction, Math.min(maxFraction, optimalPixelWidth / tableWidth));

    return fraction;
}

/**
 * Parse TSV (tab-separated values) or CSV text into a 2D array.
 * Handles clipboard data from Excel, Google Sheets, etc.
 */
export function parseClipboardTableData(text: string): string[][] | null {
    if (!text || !text.trim()) return null;

    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return null;

    // Detect delimiter: tabs (TSV from spreadsheets) or commas (CSV)
    const firstLine = lines[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const delimiter = tabCount >= commaCount ? '\t' : ',';

    const result: string[][] = [];
    for (const line of lines) {
        // Simple split - handles most cases from spreadsheets
        // Note: doesn't handle quoted fields with embedded delimiters
        const cells = line.split(delimiter);
        result.push(cells);
    }

    // Ensure all rows have the same number of columns
    const maxCols = Math.max(...result.map(row => row.length));
    for (const row of result) {
        while (row.length < maxCols) {
            row.push('');
        }
    }

    return result.length > 0 ? result : null;
}

/**
 * Convert table data to TSV format for clipboard export.
 */
export function tableDataToTSV(data: string[][]): string {
    return data.map(row => row.join('\t')).join('\n');
}

/**
 * Convert table data to CSV format for export.
 */
export function tableDataToCSV(data: string[][]): string {
    return data.map(row =>
        row.map(cell => {
            // Escape cells containing commas, quotes, or newlines
            if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
        }).join(',')
    ).join('\n');
}

// ============================================================
// Merge Cell Utilities
// ============================================================

export interface MergedCellRegion {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
}

/**
 * Find the merged cell region that contains a given cell position.
 * Returns the region or null if the cell is not part of a merge.
 */
export function getMergedCellAt(
    mergedCells: MergedCellRegion[] | undefined,
    row: number,
    col: number
): MergedCellRegion | null {
    if (!mergedCells) return null;
    for (const region of mergedCells) {
        if (row >= region.startRow && row <= region.endRow &&
            col >= region.startCol && col <= region.endCol) {
            return region;
        }
    }
    return null;
}

/**
 * Check if a cell is the top-left cell of a merged region.
 */
export function isTopLeftOfMerge(
    mergedCells: MergedCellRegion[] | undefined,
    row: number,
    col: number
): MergedCellRegion | null {
    if (!mergedCells) return null;
    for (const region of mergedCells) {
        if (row === region.startRow && col === region.startCol) {
            return region;
        }
    }
    return null;
}

/**
 * Check if a cell is covered by a merge (not the top-left cell).
 * Returns true if the cell should be skipped during rendering.
 */
export function isCellCoveredByMerge(
    mergedCells: MergedCellRegion[] | undefined,
    row: number,
    col: number
): boolean {
    const region = getMergedCellAt(mergedCells, row, col);
    if (!region) return false;
    // If this is the top-left cell, it's not "covered" - it should be rendered
    return !(row === region.startRow && col === region.startCol);
}

/**
 * Get the visual bounds (in cell rects) for a merged cell region.
 * Used to compute the rendering rectangle for merged cells.
 */
export function getMergedCellBounds(
    cellRects: CellRect[],
    region: MergedCellRegion
): { x: number; y: number; w: number; h: number } | null {
    // Find the top-left cell rect
    const topLeft = cellRects.find(r => r.row === region.startRow && r.col === region.startCol);
    // Find the bottom-right cell rect
    const bottomRight = cellRects.find(r => r.row === region.endRow && r.col === region.endCol);

    if (!topLeft || !bottomRight) return null;

    return {
        x: topLeft.x,
        y: topLeft.y,
        w: (bottomRight.x + bottomRight.w) - topLeft.x,
        h: (bottomRight.y + bottomRight.h) - topLeft.y,
    };
}

/**
 * Merge a range of cells. Returns updated merged cells array.
 * Validates the merge and consolidates overlapping merges.
 */
export function mergeCells(
    mergedCells: MergedCellRegion[] | undefined,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
): MergedCellRegion[] {
    // Normalize bounds
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    // Don't merge single cells
    if (minRow === maxRow && minCol === maxCol) {
        return mergedCells ?? [];
    }

    const newRegion: MergedCellRegion = {
        startRow: minRow,
        startCol: minCol,
        endRow: maxRow,
        endCol: maxCol,
    };

    // Remove any existing merges that overlap with the new region
    const filtered = (mergedCells ?? []).filter(region => {
        const overlaps = !(
            region.endRow < minRow ||
            region.startRow > maxRow ||
            region.endCol < minCol ||
            region.startCol > maxCol
        );
        return !overlaps;
    });

    return [...filtered, newRegion];
}

/**
 * Unmerge a cell. Removes the merge region containing the given cell.
 * Returns updated merged cells array.
 */
export function unmergeCells(
    mergedCells: MergedCellRegion[] | undefined,
    row: number,
    col: number
): MergedCellRegion[] {
    if (!mergedCells) return [];
    return mergedCells.filter(region => {
        const contains = row >= region.startRow && row <= region.endRow &&
                        col >= region.startCol && col <= region.endCol;
        return !contains;
    });
}

/**
 * Normalize cell selection bounds (ensure startRow <= endRow, startCol <= endCol).
 */
export function normalizeCellSelection(
    selection: { startRow: number; startCol: number; endRow: number; endCol: number }
): { startRow: number; startCol: number; endRow: number; endCol: number } {
    return {
        startRow: Math.min(selection.startRow, selection.endRow),
        startCol: Math.min(selection.startCol, selection.endCol),
        endRow: Math.max(selection.startRow, selection.endRow),
        endCol: Math.max(selection.startCol, selection.endCol),
    };
}

/**
 * Check if a cell selection spans multiple cells.
 */
export function isMultiCellSelection(
    selection: { startRow: number; startCol: number; endRow: number; endCol: number } | null
): boolean {
    if (!selection) return false;
    const norm = normalizeCellSelection(selection);
    return norm.endRow > norm.startRow || norm.endCol > norm.startCol;
}

/**
 * Adjust merged cells when rows/columns are inserted or deleted.
 */
export function adjustMergedCellsOnRowInsert(
    mergedCells: MergedCellRegion[] | undefined,
    atIndex: number
): MergedCellRegion[] {
    if (!mergedCells) return [];
    return mergedCells.map(region => {
        const adjusted = { ...region };
        if (atIndex <= region.startRow) {
            adjusted.startRow++;
            adjusted.endRow++;
        } else if (atIndex <= region.endRow) {
            adjusted.endRow++;
        }
        return adjusted;
    });
}

export function adjustMergedCellsOnRowDelete(
    mergedCells: MergedCellRegion[] | undefined,
    atIndex: number
): MergedCellRegion[] {
    if (!mergedCells) return [];
    return mergedCells
        .map(region => {
            const adjusted = { ...region };
            if (atIndex < region.startRow) {
                adjusted.startRow--;
                adjusted.endRow--;
            } else if (atIndex <= region.endRow) {
                // Row is within merge - shrink the merge
                if (adjusted.startRow === adjusted.endRow) {
                    return null; // Merge is destroyed
                }
                adjusted.endRow--;
            }
            return adjusted;
        })
        .filter((r): r is MergedCellRegion => r !== null);
}

export function adjustMergedCellsOnColInsert(
    mergedCells: MergedCellRegion[] | undefined,
    atIndex: number
): MergedCellRegion[] {
    if (!mergedCells) return [];
    return mergedCells.map(region => {
        const adjusted = { ...region };
        if (atIndex <= region.startCol) {
            adjusted.startCol++;
            adjusted.endCol++;
        } else if (atIndex <= region.endCol) {
            adjusted.endCol++;
        }
        return adjusted;
    });
}

export function adjustMergedCellsOnColDelete(
    mergedCells: MergedCellRegion[] | undefined,
    atIndex: number
): MergedCellRegion[] {
    if (!mergedCells) return [];
    return mergedCells
        .map(region => {
            const adjusted = { ...region };
            if (atIndex < region.startCol) {
                adjusted.startCol--;
                adjusted.endCol--;
            } else if (atIndex <= region.endCol) {
                // Column is within merge - shrink the merge
                if (adjusted.startCol === adjusted.endCol) {
                    return null; // Merge is destroyed
                }
                adjusted.endCol--;
            }
            return adjusted;
        })
        .filter((r): r is MergedCellRegion => r !== null);
}

// ============================================================
// Cell Formatting Utilities
// ============================================================

import type { TableCellFormat, TableCellBorders, TableCellBorder, TableBorderStyle } from '../types';

/**
 * Get format for a specific cell, with fallback to default text format.
 */
export function getCellFormat(
    formats: TableCellFormat[][] | undefined,
    row: number,
    col: number
): TableCellFormat | null {
    if (!formats || !formats[row]) return null;
    return formats[row][col] || null;
}

/**
 * Set format for a specific cell. Returns updated formats array.
 */
export function setCellFormat(
    formats: TableCellFormat[][] | undefined,
    row: number,
    col: number,
    format: TableCellFormat,
    totalRows: number,
    totalCols: number
): TableCellFormat[][] {
    // Initialize array if needed
    const newFormats: TableCellFormat[][] = formats
        ? formats.map(r => [...r])
        : Array.from({ length: totalRows }, () => Array(totalCols).fill(null));

    // Ensure row exists
    while (newFormats.length <= row) {
        newFormats.push(Array(totalCols).fill(null));
    }
    // Ensure column exists
    while (newFormats[row].length <= col) {
        newFormats[row].push(null as any);
    }

    newFormats[row][col] = format;
    return newFormats;
}

/**
 * Set format for a range of cells. Returns updated formats array.
 */
export function setCellFormatRange(
    formats: TableCellFormat[][] | undefined,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    format: TableCellFormat,
    totalRows: number,
    totalCols: number
): TableCellFormat[][] {
    let newFormats = formats ? formats.map(r => [...r]) : [];

    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
            newFormats = setCellFormat(newFormats, r, c, format, totalRows, totalCols);
        }
    }

    return newFormats;
}

/**
 * Format a cell value based on its format settings.
 */
export function formatCellValue(value: string, format: TableCellFormat | null): string {
    if (!format || format.type === 'text' || !value.trim()) {
        return value;
    }

    const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (isNaN(numValue)) {
        return value; // Can't parse as number, return as-is
    }

    switch (format.type) {
        case 'number':
            return formatNumber(numValue, format);
        case 'currency':
            return formatCurrency(numValue, format);
        case 'percentage':
            return formatPercentage(numValue, format);
        case 'date':
            return formatDate(value, format);
        default:
            return value;
    }
}

/**
 * Format a number with optional decimals and thousands separator.
 */
function formatNumber(value: number, format: TableCellFormat): string {
    const decimals = format.decimalPlaces ?? 2;
    const useThousands = format.thousandsSeparator !== false;

    let result = value.toFixed(decimals);

    if (useThousands) {
        const parts = result.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        result = parts.join('.');
    }

    return result;
}

/**
 * Format a number as currency.
 */
function formatCurrency(value: number, format: TableCellFormat): string {
    const symbol = format.currencySymbol ?? '$';
    const position = format.currencyPosition ?? 'before';
    const numberPart = formatNumber(value, { ...format, decimalPlaces: format.decimalPlaces ?? 2 });

    return position === 'before' ? `${symbol}${numberPart}` : `${numberPart}${symbol}`;
}

/**
 * Format a number as percentage.
 */
function formatPercentage(value: number, format: TableCellFormat): string {
    const decimals = format.decimalPlaces ?? 0;
    const percentValue = value * 100;
    return `${percentValue.toFixed(decimals)}%`;
}

/**
 * Format a date string according to pattern.
 */
function formatDate(value: string, format: TableCellFormat): string {
    const pattern = format.datePattern ?? 'MM/DD/YYYY';

    // Try to parse the date
    let date: Date | null = null;

    // Try ISO format first
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        date = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    }

    // Try US format (MM/DD/YYYY or MM-DD-YYYY)
    if (!date) {
        const usMatch = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
        if (usMatch) {
            let year = parseInt(usMatch[3]);
            if (year < 100) year += 2000;
            date = new Date(year, parseInt(usMatch[1]) - 1, parseInt(usMatch[2]));
        }
    }

    // Try timestamp
    if (!date) {
        const timestamp = parseInt(value);
        if (!isNaN(timestamp) && timestamp > 1000000000) {
            date = new Date(timestamp);
        }
    }

    if (!date || isNaN(date.getTime())) {
        return value; // Can't parse, return as-is
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    let result = pattern;
    result = result.replace('YYYY', year.toString());
    result = result.replace('YY', (year % 100).toString().padStart(2, '0'));
    result = result.replace('MMMM', fullMonths[date.getMonth()]);
    result = result.replace('MMM', months[date.getMonth()]);
    result = result.replace('MM', month.toString().padStart(2, '0'));
    result = result.replace('DD', day.toString().padStart(2, '0'));
    result = result.replace('D', day.toString());

    return result;
}

/**
 * Get the raw (unformatted) value from a formatted string.
 * Useful for editing formatted cells.
 */
export function parseFormattedValue(formattedValue: string, format: TableCellFormat | null): string {
    if (!format || format.type === 'text') {
        return formattedValue;
    }

    // For numbers/currency/percentage, strip formatting characters
    if (format.type === 'number' || format.type === 'currency' || format.type === 'percentage') {
        let cleaned = formattedValue.replace(/[^0-9.-]/g, '');
        // For percentage, divide by 100 to get original
        if (format.type === 'percentage') {
            const num = parseFloat(cleaned);
            if (!isNaN(num)) {
                cleaned = (num / 100).toString();
            }
        }
        return cleaned;
    }

    // For dates, try to convert back to ISO format
    if (format.type === 'date') {
        return formattedValue; // Keep as-is for now
    }

    return formattedValue;
}

// ============================================================
// Cell Border Utilities
// ============================================================

/**
 * Get borders for a specific cell.
 */
export function getCellBorders(
    borders: TableCellBorders[][] | undefined,
    row: number,
    col: number
): TableCellBorders | null {
    if (!borders || !borders[row]) return null;
    return borders[row][col] || null;
}

/**
 * Set borders for a specific cell. Returns updated borders array.
 */
export function setCellBorders(
    borders: TableCellBorders[][] | undefined,
    row: number,
    col: number,
    cellBorders: TableCellBorders,
    totalRows: number,
    totalCols: number
): TableCellBorders[][] {
    // Initialize array if needed
    const newBorders: TableCellBorders[][] = borders
        ? borders.map(r => r.map(c => c ? { ...c } : null as any))
        : Array.from({ length: totalRows }, () => Array(totalCols).fill(null));

    // Ensure row exists
    while (newBorders.length <= row) {
        newBorders.push(Array(totalCols).fill(null));
    }
    // Ensure column exists
    while (newBorders[row].length <= col) {
        newBorders[row].push(null as any);
    }

    newBorders[row][col] = cellBorders;
    return newBorders;
}

/**
 * Apply border to a range of cells with specified position.
 * Position can be: 'all', 'outside', 'inside', 'top', 'bottom', 'left', 'right', 'none'
 */
export function setBorderForRange(
    borders: TableCellBorders[][] | undefined,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    border: TableCellBorder,
    position: 'all' | 'outside' | 'inside' | 'top' | 'bottom' | 'left' | 'right' | 'none',
    totalRows: number,
    totalCols: number
): TableCellBorders[][] {
    let newBorders = borders
        ? borders.map(r => r.map(c => c ? { ...c } : {}))
        : Array.from({ length: totalRows }, () => Array.from({ length: totalCols }, () => ({} as TableCellBorders)));

    // Ensure proper size
    while (newBorders.length < totalRows) {
        newBorders.push(Array.from({ length: totalCols }, () => ({} as TableCellBorders)));
    }
    newBorders.forEach(row => {
        while (row.length < totalCols) {
            row.push({} as TableCellBorders);
        }
    });

    const clearBorder: TableCellBorder = { style: 'none', color: '' };

    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
            if (!newBorders[r][c]) {
                newBorders[r][c] = {};
            }
            const cellBorders = newBorders[r][c];

            if (position === 'none') {
                // Clear all borders
                cellBorders.top = clearBorder;
                cellBorders.bottom = clearBorder;
                cellBorders.left = clearBorder;
                cellBorders.right = clearBorder;
            } else if (position === 'all') {
                cellBorders.top = border;
                cellBorders.bottom = border;
                cellBorders.left = border;
                cellBorders.right = border;
            } else if (position === 'outside') {
                // Only border edges of selection
                if (r === startRow) cellBorders.top = border;
                if (r === endRow) cellBorders.bottom = border;
                if (c === startCol) cellBorders.left = border;
                if (c === endCol) cellBorders.right = border;
            } else if (position === 'inside') {
                // Only internal borders
                if (r > startRow) cellBorders.top = border;
                if (r < endRow) cellBorders.bottom = border;
                if (c > startCol) cellBorders.left = border;
                if (c < endCol) cellBorders.right = border;
            } else if (position === 'top') {
                if (r === startRow) cellBorders.top = border;
            } else if (position === 'bottom') {
                if (r === endRow) cellBorders.bottom = border;
            } else if (position === 'left') {
                if (c === startCol) cellBorders.left = border;
            } else if (position === 'right') {
                if (c === endCol) cellBorders.right = border;
            }
        }
    }

    return newBorders;
}

/**
 * Get the effective line width for a border style.
 */
export function getBorderWidth(style: TableBorderStyle): number {
    switch (style) {
        case 'thin': return 1;
        case 'medium': return 2;
        case 'thick': return 3;
        case 'none':
        default: return 0;
    }
}

/**
 * Available currency symbols.
 */
export const currencySymbols = [
    { symbol: '$', name: 'US Dollar' },
    { symbol: '€', name: 'Euro' },
    { symbol: '£', name: 'British Pound' },
    { symbol: '¥', name: 'Japanese Yen' },
    { symbol: '₹', name: 'Indian Rupee' },
    { symbol: '₽', name: 'Russian Ruble' },
    { symbol: '₩', name: 'Korean Won' },
    { symbol: 'CHF', name: 'Swiss Franc' },
];

/**
 * Available date patterns.
 */
export const datePatterns = [
    { pattern: 'MM/DD/YYYY', example: '01/31/2025' },
    { pattern: 'DD/MM/YYYY', example: '31/01/2025' },
    { pattern: 'YYYY-MM-DD', example: '2025-01-31' },
    { pattern: 'DD-MMM-YYYY', example: '31-Jan-2025' },
    { pattern: 'MMM DD, YYYY', example: 'Jan 31, 2025' },
    { pattern: 'MMMM DD, YYYY', example: 'January 31, 2025' },
];
