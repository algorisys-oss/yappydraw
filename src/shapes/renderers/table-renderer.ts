/**
 * Table Renderer
 * Dedicated renderer for the 'table' element type.
 * Supports configurable rows/cols, headers, cell text, header colors,
 * alternating row colors, and sort indicators.
 */

import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import {
    computeCellRects, defaultColWidths, defaultRowHeights, defaultTableData, wrapText,
    isCellCoveredByMerge, isTopLeftOfMerge, getMergedCellBounds, type MergedCellRegion,
    getCellFormat, formatCellValue, getCellBorders, getBorderWidth
} from "../../utils/table-utils";
import type { RenderContext } from "../base/types";
import type { DrawingElement } from "../../types";
import { getFontString } from "../../utils/text-utils";

export class TableRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        const { ctx, element: el, isDarkMode } = context;
        this.renderTable(ctx, el, isDarkMode, 'architectural');
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        const { rc, ctx, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        this.renderTable(ctx, el, isDarkMode, 'sketch', rc, options);
    }

    private renderTable(
        ctx: CanvasRenderingContext2D,
        el: DrawingElement,
        isDarkMode: boolean,
        style: 'architectural' | 'sketch',
        rc?: any,
        options?: any
    ): void {
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const cols = el.tableCols ?? 3;
        const rows = el.tableRows ?? 3;
        const hasHeader = el.tableHeaders !== false; // default true
        const totalVisualRows = hasHeader ? rows + 1 : rows;

        const colWidths = el.tableColWidths ?? defaultColWidths(cols);
        const rowHeights = el.tableRowHeights ?? defaultRowHeights(totalVisualRows);
        const colOrder = el.tableColOrder;
        const data = el.tableData ?? defaultTableData(rows, cols);

        const headerColor = el.tableHeaderColor || null;
        const rowColor = el.tableRowColor || null;
        const altRowColor = el.tableAltRowColor || null;
        const sortCol = el.tableSortCol ?? -1;
        const sortDir = el.tableSortDir ?? 'asc';
        const colAlignments = el.tableColAlignments;

        const cellRects = computeCellRects(x, y, w, h, colWidths, rowHeights, colOrder, hasHeader);
        const mergedCells = el.tableMergedCells as MergedCellRegion[] | undefined;
        const cellFormats = el.tableCellFormats;
        const cellBorders = el.tableCellBorders;

        // Determine order for data column lookup
        const order = colOrder ?? Array.from({ length: cols }, (_, i) => i);

        // --- 1. Draw cell backgrounds ---
        for (const cell of cellRects) {
            // Skip cells covered by a merge (not the top-left)
            if (isCellCoveredByMerge(mergedCells, cell.row, cell.col)) {
                continue;
            }

            const isHeader = hasHeader && cell.row === 0;
            const bodyRowIndex = hasHeader ? cell.row - 1 : cell.row;
            const isOddRow = !isHeader && bodyRowIndex % 2 === 1;
            const isBodyRow = !isHeader;

            let bgColor: string | null = null;

            if (isHeader && headerColor) {
                bgColor = headerColor;
            } else if (isBodyRow) {
                if (isOddRow && altRowColor) {
                    bgColor = altRowColor;
                } else {
                    bgColor = rowColor || altRowColor || null;
                }
            }

            if (bgColor) {
                ctx.fillStyle = RenderPipeline.adjustColor(bgColor, isDarkMode);

                // Check if this is top-left of a merge - draw extended background
                const mergeRegion = isTopLeftOfMerge(mergedCells, cell.row, cell.col);
                if (mergeRegion) {
                    const bounds = getMergedCellBounds(cellRects, mergeRegion);
                    if (bounds) {
                        ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
                    } else {
                        ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
                    }
                } else {
                    ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
                }
            }
        }

        // Helper: Check if a horizontal line at row boundary should be skipped at column c
        // Returns true if the line segment is inside a merged cell
        const isRowLineSkipped = (rowIdx: number, colIdx: number): boolean => {
            if (!mergedCells) return false;
            for (const region of mergedCells) {
                // Row line at rowIdx is between row (rowIdx-1) and row (rowIdx)
                // It should be skipped if rowIdx is strictly between startRow and endRow (exclusive of boundaries)
                // AND colIdx is within the merge's column range
                if (rowIdx > region.startRow && rowIdx <= region.endRow &&
                    colIdx >= region.startCol && colIdx <= region.endCol) {
                    return true;
                }
            }
            return false;
        };

        // Helper: Check if a vertical line at column boundary should be skipped at row r
        const isColLineSkipped = (colIdx: number, rowIdx: number): boolean => {
            if (!mergedCells) return false;
            for (const region of mergedCells) {
                // Col line at colIdx is between col (colIdx-1) and col (colIdx)
                // It should be skipped if colIdx is strictly between startCol and endCol
                // AND rowIdx is within the merge's row range
                if (colIdx > region.startCol && colIdx <= region.endCol &&
                    rowIdx >= region.startRow && rowIdx <= region.endRow) {
                    return true;
                }
            }
            return false;
        };

        // --- 2. Draw grid lines (with merged cell awareness) ---
        // Pre-compute row Y positions and column X positions
        const rowYs: number[] = [0];
        for (let r = 0; r < rowHeights.length; r++) {
            rowYs.push(rowYs[r] + rowHeights[r] * h);
        }
        const colXs: number[] = [0];
        for (let c = 0; c < cols; c++) {
            const dataCol = order[c];
            colXs.push(colXs[c] + colWidths[dataCol] * w);
        }

        if (style === 'sketch' && rc && options) {
            // Outer border
            rc.rectangle(x, y, w, h, { ...options, fill: undefined });

            // Row lines (draw segments, skipping merged regions)
            for (let r = 1; r < rowHeights.length; r++) {
                const ry = y + rowYs[r];
                let segmentStart = 0;
                for (let c = 0; c < cols; c++) {
                    if (isRowLineSkipped(r, c)) {
                        // Draw segment up to this point if we have one
                        if (segmentStart < c) {
                            rc.line(x + colXs[segmentStart], ry, x + colXs[c], ry, { ...options, fill: undefined });
                        }
                        segmentStart = c + 1;
                    }
                }
                // Draw remaining segment
                if (segmentStart < cols) {
                    rc.line(x + colXs[segmentStart], ry, x + w, ry, { ...options, fill: undefined });
                }
            }

            // Column lines (draw segments, skipping merged regions)
            for (let c = 1; c < cols; c++) {
                const cx2 = x + colXs[c];
                let segmentStart = 0;
                for (let r = 0; r < totalVisualRows; r++) {
                    if (isColLineSkipped(c, r)) {
                        // Draw segment up to this point if we have one
                        if (segmentStart < r) {
                            rc.line(cx2, y + rowYs[segmentStart], cx2, y + rowYs[r], { ...options, fill: undefined });
                        }
                        segmentStart = r + 1;
                    }
                }
                // Draw remaining segment
                if (segmentStart < totalVisualRows) {
                    rc.line(cx2, y + rowYs[segmentStart], cx2, y + h, { ...options, fill: undefined });
                }
            }
        } else {
            // Architectural style
            RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);

            // Outer border
            ctx.strokeRect(x, y, w, h);

            // Row lines (draw segments, skipping merged regions)
            for (let r = 1; r < rowHeights.length; r++) {
                const ry = y + rowYs[r];
                let segmentStart = 0;
                for (let c = 0; c < cols; c++) {
                    if (isRowLineSkipped(r, c)) {
                        // Draw segment up to this point if we have one
                        if (segmentStart < c) {
                            ctx.beginPath();
                            ctx.moveTo(x + colXs[segmentStart], ry);
                            ctx.lineTo(x + colXs[c], ry);
                            ctx.stroke();
                        }
                        segmentStart = c + 1;
                    }
                }
                // Draw remaining segment
                if (segmentStart < cols) {
                    ctx.beginPath();
                    ctx.moveTo(x + colXs[segmentStart], ry);
                    ctx.lineTo(x + w, ry);
                    ctx.stroke();
                }
            }

            // Column lines (draw segments, skipping merged regions)
            for (let c = 1; c < cols; c++) {
                const cx2 = x + colXs[c];
                let segmentStart = 0;
                for (let r = 0; r < totalVisualRows; r++) {
                    if (isColLineSkipped(c, r)) {
                        // Draw segment up to this point if we have one
                        if (segmentStart < r) {
                            ctx.beginPath();
                            ctx.moveTo(cx2, y + rowYs[segmentStart]);
                            ctx.lineTo(cx2, y + rowYs[r]);
                            ctx.stroke();
                        }
                        segmentStart = r + 1;
                    }
                }
                // Draw remaining segment
                if (segmentStart < totalVisualRows) {
                    ctx.beginPath();
                    ctx.moveTo(cx2, y + rowYs[segmentStart]);
                    ctx.lineTo(cx2, y + h);
                    ctx.stroke();
                }
            }
        }

        // --- 2b. Draw custom cell borders (on top of default grid) ---
        if (cellBorders) {
            for (const cell of cellRects) {
                // Skip cells covered by a merge
                if (isCellCoveredByMerge(mergedCells, cell.row, cell.col)) {
                    continue;
                }

                const borders = getCellBorders(cellBorders, cell.row, cell.col);
                if (!borders) continue;

                // Get cell bounds (use merged bounds if this is top-left of a merge)
                const mergeRegion = isTopLeftOfMerge(mergedCells, cell.row, cell.col);
                const mergeBounds = mergeRegion ? getMergedCellBounds(cellRects, mergeRegion) : null;
                const cellBounds = mergeBounds || { x: cell.x, y: cell.y, w: cell.w, h: cell.h };

                // Draw each border edge
                this.drawCellBorder(ctx, borders.top, cellBounds.x, cellBounds.y, cellBounds.x + cellBounds.w, cellBounds.y, isDarkMode, style, rc, options);
                this.drawCellBorder(ctx, borders.bottom, cellBounds.x, cellBounds.y + cellBounds.h, cellBounds.x + cellBounds.w, cellBounds.y + cellBounds.h, isDarkMode, style, rc, options);
                this.drawCellBorder(ctx, borders.left, cellBounds.x, cellBounds.y, cellBounds.x, cellBounds.y + cellBounds.h, isDarkMode, style, rc, options);
                this.drawCellBorder(ctx, borders.right, cellBounds.x + cellBounds.w, cellBounds.y, cellBounds.x + cellBounds.w, cellBounds.y + cellBounds.h, isDarkMode, style, rc, options);
            }
        }

        // --- 3. Draw cell text ---
        ctx.save();
        const fontSize = el.fontSize ?? 14;
        ctx.font = getFontString(el);
        const textColor = RenderPipeline.adjustColor(el.textColor || el.strokeColor || '#000000', isDarkMode);
        const headerTextColor = el.tableHeaderTextColor
            ? RenderPipeline.adjustColor(el.tableHeaderTextColor, isDarkMode)
            : textColor;
        ctx.fillStyle = textColor;
        ctx.textBaseline = 'middle';

        const padding = 6;

        for (const cell of cellRects) {
            // Skip cells covered by a merge (not the top-left)
            if (isCellCoveredByMerge(mergedCells, cell.row, cell.col)) {
                continue;
            }

            const isHeader = hasHeader && cell.row === 0;
            let cellText = '';

            if (isHeader) {
                // Header labels stored in data[0] when headers enabled
                cellText = data[0]?.[cell.dataCol] ?? `Col ${cell.dataCol + 1}`;
            } else {
                // Body data starts at data[1] when headers enabled, data[0] otherwise
                const dataRowIdx = hasHeader ? cell.dataRow + 1 : cell.dataRow;
                const rawValue = data[dataRowIdx]?.[cell.dataCol] ?? '';
                // Apply cell formatting if available
                const cellFormat = getCellFormat(cellFormats, cell.row, cell.col);
                cellText = formatCellValue(rawValue, cellFormat);
            }

            // Determine cell bounds (use merged bounds if this is top-left of a merge)
            const mergeRegion = isTopLeftOfMerge(mergedCells, cell.row, cell.col);
            const mergeBounds = mergeRegion ? getMergedCellBounds(cellRects, mergeRegion) : null;
            const cellBounds = mergeBounds || { x: cell.x, y: cell.y, w: cell.w, h: cell.h };

            if (cellText) {
                // Clip text to cell bounds
                ctx.save();
                ctx.beginPath();
                ctx.rect(cellBounds.x, cellBounds.y, cellBounds.w, cellBounds.h);
                ctx.clip();

                // Get column alignment (default to center)
                const align = colAlignments?.[cell.dataCol] ?? 'center';
                let textX: number;
                if (align === 'left') {
                    textX = cellBounds.x + padding;
                    ctx.textAlign = 'left';
                } else if (align === 'right') {
                    textX = cellBounds.x + cellBounds.w - padding;
                    ctx.textAlign = 'right';
                } else {
                    textX = cellBounds.x + cellBounds.w / 2;
                    ctx.textAlign = 'center';
                }

                if (isHeader) {
                    ctx.font = 'bold ' + getFontString(el);
                    ctx.fillStyle = headerTextColor;
                } else {
                    ctx.fillStyle = textColor;
                }

                // Wrap text and render multiple lines
                const maxTextWidth = cellBounds.w - padding * 2;
                const lines = wrapText(ctx, cellText, maxTextWidth);
                const lineHeight = fontSize * 1.2;
                const totalTextHeight = lines.length * lineHeight;

                // Vertically center the text block
                const startY = cellBounds.y + (cellBounds.h - totalTextHeight) / 2 + lineHeight / 2;

                for (let i = 0; i < lines.length; i++) {
                    const lineY = startY + i * lineHeight;
                    ctx.fillText(lines[i], textX, lineY, maxTextWidth);
                }

                ctx.restore();
            }

            // --- Sort indicator for ALL header cells ---
            if (isHeader && !mergeRegion) {
                const indicatorSize = Math.min(fontSize * 0.6, cell.h * 0.3);
                const ix = cell.x + cell.w - padding - indicatorSize / 2;
                const iy = cell.y + cell.h / 2;
                const isSorted = sortCol === cell.dataCol && sortCol >= 0;

                ctx.save();
                if (isSorted) {
                    // Active sort: bold single triangle
                    ctx.fillStyle = headerTextColor;
                    ctx.beginPath();
                    if (sortDir === 'asc') {
                        ctx.moveTo(ix, iy - indicatorSize / 2);
                        ctx.lineTo(ix - indicatorSize / 2, iy + indicatorSize / 2);
                        ctx.lineTo(ix + indicatorSize / 2, iy + indicatorSize / 2);
                    } else {
                        ctx.moveTo(ix, iy + indicatorSize / 2);
                        ctx.lineTo(ix - indicatorSize / 2, iy - indicatorSize / 2);
                        ctx.lineTo(ix + indicatorSize / 2, iy - indicatorSize / 2);
                    }
                    ctx.closePath();
                    ctx.fill();
                } else {
                    // Unsorted: dimmed up/down chevron pair
                    ctx.globalAlpha = 0.3;
                    ctx.fillStyle = headerTextColor;
                    const half = indicatorSize * 0.4;
                    // Up chevron
                    ctx.beginPath();
                    ctx.moveTo(ix, iy - half);
                    ctx.lineTo(ix - half, iy - half + half * 0.7);
                    ctx.lineTo(ix + half, iy - half + half * 0.7);
                    ctx.closePath();
                    ctx.fill();
                    // Down chevron
                    ctx.beginPath();
                    ctx.moveTo(ix, iy + half);
                    ctx.lineTo(ix - half, iy + half - half * 0.7);
                    ctx.lineTo(ix + half, iy + half - half * 0.7);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
            }
        }

        ctx.restore();
    }

    /**
     * Draw a single cell border edge.
     */
    private drawCellBorder(
        ctx: CanvasRenderingContext2D,
        border: { style: string; color: string } | undefined,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        isDarkMode: boolean,
        style: 'architectural' | 'sketch',
        rc?: any,
        options?: any
    ): void {
        if (!border || border.style === 'none' || !border.color) return;

        const lineWidth = getBorderWidth(border.style as any);
        if (lineWidth === 0) return;

        const color = RenderPipeline.adjustColor(border.color, isDarkMode);

        if (style === 'sketch' && rc) {
            rc.line(x1, y1, x2, y2, {
                ...options,
                stroke: color,
                strokeWidth: lineWidth,
                fill: undefined
            });
        } else {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.restore();
        }
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        ctx.rect(el.x, el.y, el.width, el.height);
    }
}
