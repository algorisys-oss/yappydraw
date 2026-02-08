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
        // Check for table animation
        const animProgress = el.tableAnimProgress;
        const animStyle = el.tableAnimStyle;
        if (animProgress !== undefined && animProgress >= 0 && animProgress < 100 && animStyle) {
            this.renderTableAnimated(ctx, el, isDarkMode, style, animProgress / 100, animStyle, rc, options);
            return;
        }

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

    // ── Easing helper for header slam bounce ──
    private easeOutBounce(t: number): number {
        if (t < 1 / 2.75) return 7.5625 * t * t;
        if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75; }
        if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375; }
        t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375;
    }

    // ── Deterministic pseudo-random for heatmap ──
    private pseudoRandom(seed: number, row: number, col: number): number {
        const n = Math.sin(seed * 127.1 + row * 311.7 + col * 74.7) * 43758.5453;
        return n - Math.floor(n);
    }

    /**
     * Compute per-cell alpha for reveal-type animations.
     */
    private getCellAlpha(
        row: number, col: number,
        progress: number, style: string,
        totalRows: number, totalCols: number,
        seed: number
    ): number {
        switch (style) {
            case 'rowReveal': {
                const rowProgress = progress * totalRows;
                if (row < Math.floor(rowProgress)) return 1;
                if (row === Math.floor(rowProgress)) return Math.min(1, (rowProgress - row) * 2);
                return 0;
            }
            case 'colReveal': {
                const colProgress = progress * totalCols;
                if (col < Math.floor(colProgress)) return 1;
                if (col === Math.floor(colProgress)) return Math.min(1, (colProgress - col) * 2);
                return 0;
            }
            case 'cellFill': {
                const totalCells = totalRows * totalCols;
                const cellIndex = row * totalCols + col;
                const cellProgress = progress * totalCells;
                if (cellIndex < Math.floor(cellProgress)) return 1;
                if (cellIndex === Math.floor(cellProgress)) return Math.min(1, (cellProgress - cellIndex) * 2);
                return 0;
            }
            case 'heatmapFadeIn': {
                const delay = this.pseudoRandom(seed, row, col) * 0.5;
                return Math.max(0, Math.min(1, (progress - delay) / 0.5));
            }
            case 'accordion': {
                const rowProgress = progress * totalRows;
                if (row < Math.floor(rowProgress)) return 1;
                if (row === Math.floor(rowProgress)) return Math.min(1, (rowProgress - row));
                return 0;
            }
            default:
                return 1;
        }
    }

    /**
     * Animated table rendering — delegates to per-animation rendering logic.
     */
    private renderTableAnimated(
        ctx: CanvasRenderingContext2D,
        el: DrawingElement,
        isDarkMode: boolean,
        style: 'architectural' | 'sketch',
        progress: number,
        animStyle: string,
        rc?: any,
        options?: any
    ): void {
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const cols = el.tableCols ?? 3;
        const rows = el.tableRows ?? 3;
        const hasHeader = el.tableHeaders !== false;
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
        const order = colOrder ?? Array.from({ length: cols }, (_, i) => i);
        const seed = el.seed ?? 0;

        // Pre-compute row/col positions
        const rowYs: number[] = [0];
        for (let r = 0; r < rowHeights.length; r++) {
            rowYs.push(rowYs[r] + rowHeights[r] * h);
        }
        const colXs: number[] = [0];
        for (let c = 0; c < cols; c++) {
            const dataCol = order[c];
            colXs.push(colXs[c] + colWidths[dataCol] * w);
        }

        // Determine animation rendering mode
        switch (animStyle) {
            case 'gridDraw':
                this.renderGridDraw(ctx, el, isDarkMode, style, progress, x, y, w, h,
                    cols, totalVisualRows, rowHeights, colWidths, rowYs, colXs,
                    cellRects, data, hasHeader, headerColor, rowColor, altRowColor,
                    sortCol, sortDir, colAlignments, mergedCells, cellFormats, cellBorders, order, rc, options);
                return;
            case 'headerSlam':
                this.renderHeaderSlam(ctx, el, isDarkMode, style, progress, x, y, w, h,
                    cols, totalVisualRows, rowHeights, colWidths, rowYs, colXs,
                    cellRects, data, hasHeader, headerColor, rowColor, altRowColor,
                    sortCol, sortDir, colAlignments, mergedCells, cellFormats, cellBorders, order, rc, options);
                return;
            case 'countUp':
                this.renderCountUp(ctx, el, isDarkMode, style, progress, x, y, w, h,
                    cols, totalVisualRows, rowYs, colXs,
                    cellRects, data, hasHeader, headerColor, rowColor, altRowColor,
                    sortCol, sortDir, colAlignments, mergedCells, cellFormats, cellBorders, order, rc, options);
                return;
            case 'cellsAssemble':
                this.renderCellsAssemble(ctx, el, isDarkMode, style, progress, x, y, w, h,
                    cols, totalVisualRows, rowYs, colXs,
                    cellRects, data, hasHeader, headerColor, rowColor, altRowColor,
                    sortCol, sortDir, colAlignments, mergedCells, cellFormats, order, rc, options);
                return;
            case 'lightningSplit':
                this.renderLightningSplit(ctx, el, isDarkMode, style, progress, x, y, w, h,
                    cols, totalVisualRows, rowHeights, colWidths, rowYs, colXs,
                    cellRects, data, hasHeader, headerColor, rowColor, altRowColor,
                    sortCol, sortDir, colAlignments, mergedCells, cellFormats, cellBorders, order, rc, options);
                return;
        }

        // Default alpha-based animations: rowReveal, colReveal, cellFill, heatmapFadeIn, accordion,
        // rowHighlight, colPulse
        const isHighlight = animStyle === 'rowHighlight' || animStyle === 'colPulse';
        const baseAlpha = ctx.globalAlpha;

        // --- Phase 1: Cell backgrounds ---
        for (const cell of cellRects) {
            if (isCellCoveredByMerge(mergedCells, cell.row, cell.col)) continue;

            const alpha = isHighlight ? 1 : this.getCellAlpha(cell.row, cell.col, progress, animStyle, totalVisualRows, cols, seed);
            if (alpha <= 0) continue;

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

            // Get cell bounds (merged or regular)
            const mergeRegion = isTopLeftOfMerge(mergedCells, cell.row, cell.col);
            const mergeBounds = mergeRegion ? getMergedCellBounds(cellRects, mergeRegion) : null;
            const cellBounds = mergeBounds || { x: cell.x, y: cell.y, w: cell.w, h: cell.h };

            if (bgColor) {
                ctx.save();
                ctx.globalAlpha = baseAlpha * alpha;
                ctx.fillStyle = RenderPipeline.adjustColor(bgColor, isDarkMode);
                ctx.fillRect(cellBounds.x, cellBounds.y, cellBounds.w, cellBounds.h);
                ctx.restore();
            }

            // Highlight overlay for rowHighlight / colPulse
            if (isHighlight) {
                let highlightAlpha = 0;
                if (animStyle === 'rowHighlight') {
                    const rowP = progress * totalVisualRows;
                    const dist = Math.abs(cell.row - rowP);
                    if (dist < 1) highlightAlpha = (1 - dist) * 0.35;
                } else {
                    const colP = progress * cols;
                    const dist = Math.abs(cell.col - colP);
                    if (dist < 1) highlightAlpha = (1 - dist) * 0.35;
                }
                if (highlightAlpha > 0) {
                    ctx.save();
                    ctx.globalAlpha = baseAlpha * highlightAlpha;
                    ctx.fillStyle = 'rgba(59, 130, 246, 1)';
                    ctx.fillRect(cellBounds.x, cellBounds.y, cellBounds.w, cellBounds.h);
                    ctx.restore();
                }
            }

            // Accordion: clip cell to visible height
            if (animStyle === 'accordion') {
                const rowFrac = progress * totalVisualRows - cell.row;
                if (rowFrac > 0 && rowFrac < 1) {
                    // Partially visible — will be clipped in text phase
                }
            }
        }

        // --- Phase 2: Grid lines ---
        // Compute overall grid alpha for reveal animations
        let gridAlpha = 1;
        if (!isHighlight) {
            // Grid fades in with the cells
            const maxCellAlpha = Math.max(
                ...cellRects.map(c => this.getCellAlpha(c.row, c.col, progress, animStyle, totalVisualRows, cols, seed))
            );
            gridAlpha = maxCellAlpha;
        }

        if (gridAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = baseAlpha * gridAlpha;

            if (style === 'sketch' && rc && options) {
                rc.rectangle(x, y, w, h, { ...options, fill: undefined });
            } else {
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.strokeRect(x, y, w, h);
            }
            ctx.restore();

            // Row lines
            for (let r = 1; r < rowHeights.length; r++) {
                const ry = y + rowYs[r];
                // Line alpha: max of adjacent row alphas
                const aboveAlpha = this.getCellAlpha(r - 1, 0, progress, animStyle, totalVisualRows, cols, seed);
                const belowAlpha = this.getCellAlpha(r, 0, progress, animStyle, totalVisualRows, cols, seed);
                const lineAlpha = isHighlight ? 1 : Math.max(aboveAlpha, belowAlpha);
                if (lineAlpha <= 0) continue;

                ctx.save();
                ctx.globalAlpha = baseAlpha * lineAlpha;
                if (style === 'sketch' && rc && options) {
                    rc.line(x, ry, x + w, ry, { ...options, fill: undefined });
                } else {
                    RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                    ctx.beginPath();
                    ctx.moveTo(x, ry);
                    ctx.lineTo(x + w, ry);
                    ctx.stroke();
                }
                ctx.restore();
            }

            // Column lines
            for (let c = 1; c < cols; c++) {
                const cx2 = x + colXs[c];
                // Line alpha: max of adjacent column alphas
                const leftAlpha = this.getCellAlpha(0, c - 1, progress, animStyle, totalVisualRows, cols, seed);
                const rightAlpha = this.getCellAlpha(0, c, progress, animStyle, totalVisualRows, cols, seed);
                const lineAlpha = isHighlight ? 1 : Math.max(leftAlpha, rightAlpha);
                if (lineAlpha <= 0) continue;

                ctx.save();
                ctx.globalAlpha = baseAlpha * lineAlpha;
                if (style === 'sketch' && rc && options) {
                    rc.line(cx2, y, cx2, y + h, { ...options, fill: undefined });
                } else {
                    RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                    ctx.beginPath();
                    ctx.moveTo(cx2, y);
                    ctx.lineTo(cx2, y + h);
                    ctx.stroke();
                }
                ctx.restore();
            }
        }

        // --- Phase 2b: Custom cell borders (simplified for animation) ---
        if (cellBorders && gridAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = baseAlpha * gridAlpha;
            for (const cell of cellRects) {
                if (isCellCoveredByMerge(mergedCells, cell.row, cell.col)) continue;
                const borders = getCellBorders(cellBorders, cell.row, cell.col);
                if (!borders) continue;
                const mergeRegion = isTopLeftOfMerge(mergedCells, cell.row, cell.col);
                const mergeBounds = mergeRegion ? getMergedCellBounds(cellRects, mergeRegion) : null;
                const cellBounds2 = mergeBounds || { x: cell.x, y: cell.y, w: cell.w, h: cell.h };
                this.drawCellBorder(ctx, borders.top, cellBounds2.x, cellBounds2.y, cellBounds2.x + cellBounds2.w, cellBounds2.y, isDarkMode, style, rc, options);
                this.drawCellBorder(ctx, borders.bottom, cellBounds2.x, cellBounds2.y + cellBounds2.h, cellBounds2.x + cellBounds2.w, cellBounds2.y + cellBounds2.h, isDarkMode, style, rc, options);
                this.drawCellBorder(ctx, borders.left, cellBounds2.x, cellBounds2.y, cellBounds2.x, cellBounds2.y + cellBounds2.h, isDarkMode, style, rc, options);
                this.drawCellBorder(ctx, borders.right, cellBounds2.x + cellBounds2.w, cellBounds2.y, cellBounds2.x + cellBounds2.w, cellBounds2.y + cellBounds2.h, isDarkMode, style, rc, options);
            }
            ctx.restore();
        }

        // --- Phase 3: Cell text ---
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
            if (isCellCoveredByMerge(mergedCells, cell.row, cell.col)) continue;

            const alpha = isHighlight ? 1 : this.getCellAlpha(cell.row, cell.col, progress, animStyle, totalVisualRows, cols, seed);
            if (alpha <= 0) continue;

            const isHeader = hasHeader && cell.row === 0;
            let cellText = '';
            if (isHeader) {
                cellText = data[0]?.[cell.dataCol] ?? `Col ${cell.dataCol + 1}`;
            } else {
                const dataRowIdx = hasHeader ? cell.dataRow + 1 : cell.dataRow;
                const rawValue = data[dataRowIdx]?.[cell.dataCol] ?? '';
                const cellFormat = getCellFormat(cellFormats, cell.row, cell.col);
                cellText = formatCellValue(rawValue, cellFormat);
            }

            const mergeRegion = isTopLeftOfMerge(mergedCells, cell.row, cell.col);
            const mergeBounds = mergeRegion ? getMergedCellBounds(cellRects, mergeRegion) : null;
            const cellBounds3 = mergeBounds || { x: cell.x, y: cell.y, w: cell.w, h: cell.h };

            if (cellText) {
                ctx.save();
                ctx.globalAlpha = baseAlpha * alpha;
                ctx.beginPath();
                ctx.rect(cellBounds3.x, cellBounds3.y, cellBounds3.w, cellBounds3.h);
                ctx.clip();

                const align = colAlignments?.[cell.dataCol] ?? 'center';
                let textX: number;
                if (align === 'left') { textX = cellBounds3.x + padding; ctx.textAlign = 'left'; }
                else if (align === 'right') { textX = cellBounds3.x + cellBounds3.w - padding; ctx.textAlign = 'right'; }
                else { textX = cellBounds3.x + cellBounds3.w / 2; ctx.textAlign = 'center'; }

                if (isHeader) {
                    ctx.font = 'bold ' + getFontString(el);
                    ctx.fillStyle = headerTextColor;
                } else {
                    ctx.fillStyle = textColor;
                }

                const maxTextWidth = cellBounds3.w - padding * 2;
                const lines = wrapText(ctx, cellText, maxTextWidth);
                const lineHeight = fontSize * 1.2;
                const totalTextHeight = lines.length * lineHeight;
                const startY = cellBounds3.y + (cellBounds3.h - totalTextHeight) / 2 + lineHeight / 2;

                for (let i = 0; i < lines.length; i++) {
                    ctx.fillText(lines[i], textX, startY + i * lineHeight, maxTextWidth);
                }
                ctx.restore();
            }

            // Sort indicators
            if (isHeader && !mergeRegion) {
                const indicatorSize = Math.min(fontSize * 0.6, cell.h * 0.3);
                const ix = cell.x + cell.w - padding - indicatorSize / 2;
                const iy = cell.y + cell.h / 2;
                const isSorted = sortCol === cell.dataCol && sortCol >= 0;
                ctx.save();
                ctx.globalAlpha = baseAlpha * alpha;
                if (isSorted) {
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
                    ctx.globalAlpha = baseAlpha * alpha * 0.3;
                    ctx.fillStyle = headerTextColor;
                    const half = indicatorSize * 0.4;
                    ctx.beginPath();
                    ctx.moveTo(ix, iy - half);
                    ctx.lineTo(ix - half, iy - half + half * 0.7);
                    ctx.lineTo(ix + half, iy - half + half * 0.7);
                    ctx.closePath();
                    ctx.fill();
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

    // ── Grid Draw-In: border → grid lines → backgrounds → text ──
    private renderGridDraw(
        ctx: CanvasRenderingContext2D, el: DrawingElement, isDarkMode: boolean,
        style: 'architectural' | 'sketch', progress: number,
        x: number, y: number, w: number, h: number,
        cols: number, _totalVisualRows: number,
        rowHeights: number[], _colWidths: number[], rowYs: number[], colXs: number[],
        cellRects: ReturnType<typeof computeCellRects>, data: string[][],
        hasHeader: boolean, headerColor: string | null, rowColor: string | null, altRowColor: string | null,
        sortCol: number, sortDir: string, colAlignments: any, mergedCells: any, cellFormats: any, _cellBorders: any,
        _order: number[], rc?: any, options?: any
    ): void {
        const baseAlpha = ctx.globalAlpha;
        const borderPhase = Math.min(1, progress / 0.2);
        const gridPhase = progress > 0.15 ? Math.min(1, (progress - 0.15) / 0.45) : 0;
        const bgPhase = progress > 0.45 ? Math.min(1, (progress - 0.45) / 0.3) : 0;
        const textPhase = progress > 0.65 ? Math.min(1, (progress - 0.65) / 0.35) : 0;

        // Phase 1: Outer border
        if (borderPhase > 0) {
            ctx.save();
            ctx.globalAlpha = baseAlpha * borderPhase;
            if (style === 'sketch' && rc && options) {
                rc.rectangle(x, y, w, h, { ...options, fill: undefined });
            } else {
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.strokeRect(x, y, w, h);
            }
            ctx.restore();
        }

        // Phase 2: Grid lines
        if (gridPhase > 0) {
            ctx.save();
            ctx.globalAlpha = baseAlpha * gridPhase;
            // Row lines
            for (let r = 1; r < rowHeights.length; r++) {
                const ry = y + rowYs[r];
                if (style === 'sketch' && rc && options) {
                    rc.line(x, ry, x + w, ry, { ...options, fill: undefined });
                } else {
                    RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                    ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x + w, ry); ctx.stroke();
                }
            }
            // Column lines
            for (let c = 1; c < cols; c++) {
                const cx2 = x + colXs[c];
                if (style === 'sketch' && rc && options) {
                    rc.line(cx2, y, cx2, y + h, { ...options, fill: undefined });
                } else {
                    RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                    ctx.beginPath(); ctx.moveTo(cx2, y); ctx.lineTo(cx2, y + h); ctx.stroke();
                }
            }
            ctx.restore();
        }

        // Phase 3: Cell backgrounds
        if (bgPhase > 0) {
            for (const cell of cellRects) {
                if (isCellCoveredByMerge(mergedCells, cell.row, cell.col)) continue;
                const isHeaderCell = hasHeader && cell.row === 0;
                const bodyRowIndex = hasHeader ? cell.row - 1 : cell.row;
                const isOddRow = !isHeaderCell && bodyRowIndex % 2 === 1;
                let bgColor: string | null = null;
                if (isHeaderCell && headerColor) bgColor = headerColor;
                else if (!isHeaderCell) bgColor = (isOddRow && altRowColor) ? altRowColor : (rowColor || altRowColor || null);
                if (bgColor) {
                    const mergeRegion = isTopLeftOfMerge(mergedCells, cell.row, cell.col);
                    const bounds = mergeRegion ? getMergedCellBounds(cellRects, mergeRegion) : null;
                    const cb = bounds || { x: cell.x, y: cell.y, w: cell.w, h: cell.h };
                    ctx.save();
                    ctx.globalAlpha = baseAlpha * bgPhase;
                    ctx.fillStyle = RenderPipeline.adjustColor(bgColor, isDarkMode);
                    ctx.fillRect(cb.x, cb.y, cb.w, cb.h);
                    ctx.restore();
                }
            }
        }

        // Phase 4: Cell text
        if (textPhase > 0) {
            this.renderCellText(ctx, el, isDarkMode, baseAlpha * textPhase, cellRects, data,
                hasHeader, sortCol, sortDir, colAlignments, mergedCells, cellFormats);
        }
    }

    // ── Header Slam: header bounces in, then body fades ──
    private renderHeaderSlam(
        ctx: CanvasRenderingContext2D, el: DrawingElement, isDarkMode: boolean,
        style: 'architectural' | 'sketch', progress: number,
        x: number, y: number, w: number, h: number,
        cols: number, _totalVisualRows: number,
        rowHeights: number[], _colWidths: number[], rowYs: number[], colXs: number[],
        cellRects: ReturnType<typeof computeCellRects>, data: string[][],
        hasHeader: boolean, headerColor: string | null, rowColor: string | null, altRowColor: string | null,
        sortCol: number, sortDir: string, colAlignments: any, mergedCells: any, cellFormats: any, _cellBorders: any,
        _order: number[], rc?: any, options?: any
    ): void {
        if (!hasHeader) {
            // No header — fall back to simple fade
            ctx.save();
            ctx.globalAlpha = ctx.globalAlpha * progress;
            this.renderTable(ctx, { ...el, tableAnimProgress: undefined, tableAnimStyle: undefined } as any, isDarkMode, style, rc, options);
            ctx.restore();
            return;
        }

        const baseAlpha = ctx.globalAlpha;
        const headerPhase = Math.min(1, progress / 0.4);
        const headerBounce = this.easeOutBounce(headerPhase);
        const bodyPhase = progress > 0.35 ? Math.min(1, (progress - 0.35) / 0.65) : 0;

        // Header row height
        const headerH = rowYs[1];
        const dropDistance = h * 0.4;
        const headerOffset = (1 - headerBounce) * dropDistance;

        // Draw header row (bouncing in from above)
        ctx.save();
        ctx.globalAlpha = baseAlpha * Math.min(1, headerPhase * 1.5);

        // Outer border for header
        if (style === 'sketch' && rc && options) {
            rc.rectangle(x, y - headerOffset, w, headerH, { ...options, fill: undefined });
        } else {
            RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
            ctx.strokeRect(x, y - headerOffset, w, headerH);
        }

        // Header background
        if (headerColor) {
            ctx.fillStyle = RenderPipeline.adjustColor(headerColor, isDarkMode);
            ctx.fillRect(x, y - headerOffset, w, headerH);
        }

        // Header column lines
        for (let c = 1; c < cols; c++) {
            const cx2 = x + colXs[c];
            if (style === 'sketch' && rc && options) {
                rc.line(cx2, y - headerOffset, cx2, y - headerOffset + headerH, { ...options, fill: undefined });
            } else {
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.beginPath(); ctx.moveTo(cx2, y - headerOffset); ctx.lineTo(cx2, y - headerOffset + headerH); ctx.stroke();
            }
        }

        // Header text
        const headerCells = cellRects.filter(c => c.row === 0);
        const fontSize = el.fontSize ?? 14;
        ctx.font = 'bold ' + getFontString(el);
        const headerTextColor = el.tableHeaderTextColor
            ? RenderPipeline.adjustColor(el.tableHeaderTextColor, isDarkMode)
            : RenderPipeline.adjustColor(el.textColor || el.strokeColor || '#000000', isDarkMode);
        ctx.fillStyle = headerTextColor;
        ctx.textBaseline = 'middle';
        const padding = 6;

        for (const cell of headerCells) {
            const cellText = data[0]?.[cell.dataCol] ?? `Col ${cell.dataCol + 1}`;
            if (!cellText) continue;
            ctx.save();
            ctx.beginPath();
            ctx.rect(cell.x, y - headerOffset, cell.w, headerH);
            ctx.clip();
            const align = colAlignments?.[cell.dataCol] ?? 'center';
            let textX: number;
            if (align === 'left') { textX = cell.x + padding; ctx.textAlign = 'left'; }
            else if (align === 'right') { textX = cell.x + cell.w - padding; ctx.textAlign = 'right'; }
            else { textX = cell.x + cell.w / 2; ctx.textAlign = 'center'; }
            const maxTextWidth = cell.w - padding * 2;
            const lines = wrapText(ctx, cellText, maxTextWidth);
            const lineHeight = fontSize * 1.2;
            const totalTextHeight = lines.length * lineHeight;
            const startTY = (y - headerOffset) + (headerH - totalTextHeight) / 2 + lineHeight / 2;
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], textX, startTY + i * lineHeight, maxTextWidth);
            }
            ctx.restore();
        }
        ctx.restore();

        // Draw body (fading in)
        if (bodyPhase > 0) {
            ctx.save();
            ctx.globalAlpha = baseAlpha * bodyPhase;

            // Body border + grid
            if (style === 'sketch' && rc && options) {
                rc.rectangle(x, y + headerH, w, h - headerH, { ...options, fill: undefined });
            } else {
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.strokeRect(x, y + headerH, w, h - headerH);
            }

            // Body row/col lines
            for (let r = 2; r < rowHeights.length; r++) {
                const ry = y + rowYs[r];
                if (style === 'sketch' && rc && options) {
                    rc.line(x, ry, x + w, ry, { ...options, fill: undefined });
                } else {
                    RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                    ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x + w, ry); ctx.stroke();
                }
            }
            for (let c = 1; c < cols; c++) {
                const cx2 = x + colXs[c];
                if (style === 'sketch' && rc && options) {
                    rc.line(cx2, y + headerH, cx2, y + h, { ...options, fill: undefined });
                } else {
                    RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                    ctx.beginPath(); ctx.moveTo(cx2, y + headerH); ctx.lineTo(cx2, y + h); ctx.stroke();
                }
            }

            // Body backgrounds + text
            const bodyCells = cellRects.filter(c => c.row > 0);
            for (const cell of bodyCells) {
                if (isCellCoveredByMerge(mergedCells, cell.row, cell.col)) continue;
                const bodyRowIndex = hasHeader ? cell.row - 1 : cell.row;
                const isOddRow = bodyRowIndex % 2 === 1;
                let bgColor: string | null = null;
                if (isOddRow && altRowColor) bgColor = altRowColor;
                else bgColor = rowColor || altRowColor || null;
                if (bgColor) {
                    const mergeRegion = isTopLeftOfMerge(mergedCells, cell.row, cell.col);
                    const bounds = mergeRegion ? getMergedCellBounds(cellRects, mergeRegion) : null;
                    const cb = bounds || { x: cell.x, y: cell.y, w: cell.w, h: cell.h };
                    ctx.fillStyle = RenderPipeline.adjustColor(bgColor, isDarkMode);
                    ctx.fillRect(cb.x, cb.y, cb.w, cb.h);
                }
            }

            // Body text
            this.renderCellText(ctx, el, isDarkMode, baseAlpha * bodyPhase, bodyCells, data,
                hasHeader, sortCol, sortDir, colAlignments, mergedCells, cellFormats);

            ctx.restore();
        }
    }

    // ── Count-Up: numeric cells count from 0, non-numeric fade in ──
    private renderCountUp(
        ctx: CanvasRenderingContext2D, el: DrawingElement, isDarkMode: boolean,
        style: 'architectural' | 'sketch', progress: number,
        x: number, y: number, w: number, h: number,
        cols: number, totalVisualRows: number,
        rowYs: number[], colXs: number[],
        cellRects: ReturnType<typeof computeCellRects>, data: string[][],
        hasHeader: boolean, headerColor: string | null, rowColor: string | null, altRowColor: string | null,
        _sortCol: number, _sortDir: string, colAlignments: any, mergedCells: any, _cellFormats: any, _cellBorders: any,
        _order: number[], rc?: any, options?: any
    ): void {
        const baseAlpha = ctx.globalAlpha;

        // Draw full grid + backgrounds at full alpha (table structure visible from start)
        // Outer border
        if (style === 'sketch' && rc && options) {
            rc.rectangle(x, y, w, h, { ...options, fill: undefined });
        } else {
            RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
            ctx.strokeRect(x, y, w, h);
        }

        // Row lines
        for (let r = 1; r < totalVisualRows; r++) {
            const ry = y + rowYs[r];
            if (style === 'sketch' && rc && options) {
                rc.line(x, ry, x + w, ry, { ...options, fill: undefined });
            } else {
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x + w, ry); ctx.stroke();
            }
        }
        // Column lines
        for (let c = 1; c < cols; c++) {
            const cx2 = x + colXs[c];
            if (style === 'sketch' && rc && options) {
                rc.line(cx2, y, cx2, y + h, { ...options, fill: undefined });
            } else {
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.beginPath(); ctx.moveTo(cx2, y); ctx.lineTo(cx2, y + h); ctx.stroke();
            }
        }

        // Backgrounds
        for (const cell of cellRects) {
            if (isCellCoveredByMerge(mergedCells, cell.row, cell.col)) continue;
            const isHeaderCell = hasHeader && cell.row === 0;
            const bodyRowIndex = hasHeader ? cell.row - 1 : cell.row;
            const isOddRow = !isHeaderCell && bodyRowIndex % 2 === 1;
            let bgColor: string | null = null;
            if (isHeaderCell && headerColor) bgColor = headerColor;
            else if (!isHeaderCell) bgColor = (isOddRow && altRowColor) ? altRowColor : (rowColor || altRowColor || null);
            if (bgColor) {
                const mergeRegion = isTopLeftOfMerge(mergedCells, cell.row, cell.col);
                const bounds = mergeRegion ? getMergedCellBounds(cellRects, mergeRegion) : null;
                const cb = bounds || { x: cell.x, y: cell.y, w: cell.w, h: cell.h };
                ctx.fillStyle = RenderPipeline.adjustColor(bgColor, isDarkMode);
                ctx.fillRect(cb.x, cb.y, cb.w, cb.h);
            }
        }

        // Text with count-up for numeric values
        ctx.save();
        const fontSize = el.fontSize ?? 14;
        ctx.font = getFontString(el);
        const textColor = RenderPipeline.adjustColor(el.textColor || el.strokeColor || '#000000', isDarkMode);
        const headerTextColor = el.tableHeaderTextColor
            ? RenderPipeline.adjustColor(el.tableHeaderTextColor, isDarkMode)
            : textColor;
        ctx.textBaseline = 'middle';
        const padding = 6;

        for (const cell of cellRects) {
            if (isCellCoveredByMerge(mergedCells, cell.row, cell.col)) continue;

            const isHeaderCell = hasHeader && cell.row === 0;
            let cellText = '';
            let cellAlpha = 1;

            if (isHeaderCell) {
                // Headers show immediately
                cellText = data[0]?.[cell.dataCol] ?? `Col ${cell.dataCol + 1}`;
            } else {
                const dataRowIdx = hasHeader ? cell.dataRow + 1 : cell.dataRow;
                const rawValue = data[dataRowIdx]?.[cell.dataCol] ?? '';
                const numValue = parseFloat(rawValue);

                if (!isNaN(numValue) && rawValue.trim() !== '') {
                    // Numeric: count up from 0
                    const currentValue = numValue * progress;
                    // Preserve decimal places from original
                    const decimalParts = rawValue.split('.');
                    const decimals = decimalParts.length > 1 ? decimalParts[1].length : 0;
                    cellText = currentValue.toFixed(decimals);
                } else {
                    // Non-numeric: show with fade
                    cellText = rawValue;
                    cellAlpha = progress;
                }
            }

            if (!cellText) continue;

            const mergeRegion = isTopLeftOfMerge(mergedCells, cell.row, cell.col);
            const mergeBounds = mergeRegion ? getMergedCellBounds(cellRects, mergeRegion) : null;
            const cb = mergeBounds || { x: cell.x, y: cell.y, w: cell.w, h: cell.h };

            ctx.save();
            ctx.globalAlpha = baseAlpha * cellAlpha;
            ctx.beginPath();
            ctx.rect(cb.x, cb.y, cb.w, cb.h);
            ctx.clip();

            const align = colAlignments?.[cell.dataCol] ?? 'center';
            let textX: number;
            if (align === 'left') { textX = cb.x + padding; ctx.textAlign = 'left'; }
            else if (align === 'right') { textX = cb.x + cb.w - padding; ctx.textAlign = 'right'; }
            else { textX = cb.x + cb.w / 2; ctx.textAlign = 'center'; }

            if (isHeaderCell) {
                ctx.font = 'bold ' + getFontString(el);
                ctx.fillStyle = headerTextColor;
            } else {
                ctx.fillStyle = textColor;
            }

            const maxTextWidth = cb.w - padding * 2;
            const lines = wrapText(ctx, cellText, maxTextWidth);
            const lineHeight = fontSize * 1.2;
            const totalTextHeight = lines.length * lineHeight;
            const startTY = cb.y + (cb.h - totalTextHeight) / 2 + lineHeight / 2;
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], textX, startTY + i * lineHeight, maxTextWidth);
            }
            ctx.restore();
        }
        ctx.restore();
    }

    // ── Cells Assemble: cells fly from scattered positions into grid ──
    private renderCellsAssemble(
        ctx: CanvasRenderingContext2D, el: DrawingElement, isDarkMode: boolean,
        _style: 'architectural' | 'sketch', progress: number,
        x: number, y: number, w: number, h: number,
        cols: number, totalVisualRows: number,
        rowYs: number[], colXs: number[],
        cellRects: ReturnType<typeof computeCellRects>, data: string[][],
        hasHeader: boolean, headerColor: string | null, rowColor: string | null, altRowColor: string | null,
        _sortCol: number, _sortDir: string, colAlignments: any, mergedCells: any, cellFormats: any,
        _order: number[], _rc?: any, _options?: any
    ): void {
        const baseAlpha = ctx.globalAlpha;
        const seed = el.seed ?? 0;
        const spread = Math.max(w, h) * 1.5;

        // Grid lines fade in at the end after cells have settled
        const gridAlpha = Math.max(0, (progress - 0.75) / 0.25);

        // Draw each cell independently with its own transform
        const fontSize = el.fontSize ?? 14;
        const textColor = RenderPipeline.adjustColor(el.textColor || el.strokeColor || '#000000', isDarkMode);
        const headerTextColor = el.tableHeaderTextColor
            ? RenderPipeline.adjustColor(el.tableHeaderTextColor, isDarkMode)
            : textColor;
        const padding = 6;

        for (const cell of cellRects) {
            if (isCellCoveredByMerge(mergedCells, cell.row, cell.col)) continue;

            // Deterministic random start position and delay for this cell
            const rx = this.pseudoRandom(seed, cell.row, cell.col) * 2 - 1;       // -1 to 1
            const ry = this.pseudoRandom(seed + 7, cell.row, cell.col) * 2 - 1;
            const delay = this.pseudoRandom(seed + 13, cell.row, cell.col) * 0.35; // 0-35% delay
            const cellProgress = Math.max(0, Math.min(1, (progress - delay) / (0.65)));

            // Ease out with slight overshoot for satisfying snap
            const t = cellProgress < 1 ? 1 - Math.pow(1 - cellProgress, 3) : 1;

            const fromX = rx * spread;
            const fromY = ry * spread;
            const offsetX = fromX * (1 - t);
            const offsetY = fromY * (1 - t);
            const rotation = (rx * 0.4) * (1 - t); // slight rotation that settles
            const cellAlpha = Math.min(1, cellProgress * 2); // fade in quickly

            if (cellAlpha <= 0) continue;

            const isHeader = hasHeader && cell.row === 0;
            const bodyRowIndex = hasHeader ? cell.row - 1 : cell.row;
            const isOddRow = !isHeader && bodyRowIndex % 2 === 1;

            // Get cell bounds
            const mergeRegion = isTopLeftOfMerge(mergedCells, cell.row, cell.col);
            const mergeBounds = mergeRegion ? getMergedCellBounds(cellRects, mergeRegion) : null;
            const cb = mergeBounds || { x: cell.x, y: cell.y, w: cell.w, h: cell.h };
            const centerX = cb.x + cb.w / 2;
            const centerY = cb.y + cb.h / 2;

            ctx.save();
            ctx.globalAlpha = baseAlpha * cellAlpha;
            ctx.translate(centerX + offsetX, centerY + offsetY);
            ctx.rotate(rotation);
            ctx.translate(-centerX, -centerY);

            // Cell background
            let bgColor: string | null = null;
            if (isHeader && headerColor) bgColor = headerColor;
            else if (!isHeader) bgColor = (isOddRow && altRowColor) ? altRowColor : (rowColor || altRowColor || null);

            if (bgColor) {
                ctx.fillStyle = RenderPipeline.adjustColor(bgColor, isDarkMode);
                ctx.fillRect(cb.x, cb.y, cb.w, cb.h);
            }

            // Cell border (thin outline so each cell is visible while flying)
            RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
            ctx.strokeRect(cb.x, cb.y, cb.w, cb.h);

            // Cell text
            let cellText = '';
            if (isHeader) {
                cellText = data[0]?.[cell.dataCol] ?? `Col ${cell.dataCol + 1}`;
            } else {
                const dataRowIdx = hasHeader ? cell.dataRow + 1 : cell.dataRow;
                const rawValue = data[dataRowIdx]?.[cell.dataCol] ?? '';
                const cellFormat = getCellFormat(cellFormats, cell.row, cell.col);
                cellText = formatCellValue(rawValue, cellFormat);
            }

            if (cellText) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(cb.x, cb.y, cb.w, cb.h);
                ctx.clip();

                ctx.font = isHeader ? 'bold ' + getFontString(el) : getFontString(el);
                ctx.fillStyle = isHeader ? headerTextColor : textColor;
                ctx.textBaseline = 'middle';

                const align = colAlignments?.[cell.dataCol] ?? 'center';
                let textX: number;
                if (align === 'left') { textX = cb.x + padding; ctx.textAlign = 'left'; }
                else if (align === 'right') { textX = cb.x + cb.w - padding; ctx.textAlign = 'right'; }
                else { textX = cb.x + cb.w / 2; ctx.textAlign = 'center'; }

                const maxTextWidth = cb.w - padding * 2;
                const lines = wrapText(ctx, cellText, maxTextWidth);
                const lineHeight = fontSize * 1.2;
                const totalTextHeight = lines.length * lineHeight;
                const startTY = cb.y + (cb.h - totalTextHeight) / 2 + lineHeight / 2;
                for (let i = 0; i < lines.length; i++) {
                    ctx.fillText(lines[i], textX, startTY + i * lineHeight, maxTextWidth);
                }
                ctx.restore();
            }

            ctx.restore();
        }

        // Draw grid lines on top once cells have settled
        if (gridAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = baseAlpha * gridAlpha;
            RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
            ctx.strokeRect(x, y, w, h);
            for (let r = 1; r < totalVisualRows; r++) {
                const ry2 = y + rowYs[r];
                ctx.beginPath(); ctx.moveTo(x, ry2); ctx.lineTo(x + w, ry2); ctx.stroke();
            }
            for (let c = 1; c < cols; c++) {
                const cx2 = x + colXs[c];
                ctx.beginPath(); ctx.moveTo(cx2, y); ctx.lineTo(cx2, y + h); ctx.stroke();
            }
            ctx.restore();
        }
    }

    // ── Lightning Split: dramatic crack reveals the table ──
    private renderLightningSplit(
        ctx: CanvasRenderingContext2D, el: DrawingElement, isDarkMode: boolean,
        style: 'architectural' | 'sketch', progress: number,
        x: number, y: number, w: number, h: number,
        _cols: number, _totalVisualRows: number,
        _rowHeights: number[], _colWidths: number[], _rowYs: number[], _colXs: number[],
        _cellRects: ReturnType<typeof computeCellRects>, _data: string[][],
        _hasHeader: boolean, _headerColor: string | null, _rowColor: string | null, _altRowColor: string | null,
        _sortCol: number, _sortDir: string, _colAlignments: any, _mergedCells: any, _cellFormats: any, _cellBorders: any,
        _order: number[], rc?: any, options?: any
    ): void {
        const baseAlpha = ctx.globalAlpha;
        const seed = el.seed ?? 0;
        const centerX = x + w / 2;

        // Generate deterministic zigzag lightning path
        const segments = 12;
        const zigzag: { x: number; y: number }[] = [];
        zigzag.push({ x: centerX, y: y - 10 });
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const jitter = (this.pseudoRandom(seed + i, i, 0) - 0.5) * w * 0.18;
            zigzag.push({ x: centerX + jitter, y: y + t * (h + 20) });
        }
        zigzag.push({ x: centerX, y: y + h + 10 });

        // Phase timing
        // 0-0.4: Two halves approach from sides
        // 0.4-0.55: Lightning flash + halves slam together
        // 0.55-1.0: Flash fades, table fully assembled
        const approachPhase = Math.min(1, progress / 0.4);
        const flashPhase = progress > 0.35 ? Math.min(1, (progress - 0.35) / 0.2) : 0;
        const settlePhase = progress > 0.55 ? (progress - 0.55) / 0.45 : 0;

        const splitGap = (1 - approachPhase) * w * 0.35;

        if (progress < 0.55) {
            // Build left clip path (everything left of zigzag)
            const drawHalf = (side: 'left' | 'right') => {
                ctx.save();
                ctx.beginPath();
                if (side === 'left') {
                    ctx.moveTo(x - splitGap - 10, y - 20);
                    // Follow zigzag on right edge
                    for (const pt of zigzag) {
                        ctx.lineTo(pt.x - splitGap, pt.y);
                    }
                    ctx.lineTo(x - splitGap - 10, y + h + 20);
                    ctx.closePath();
                } else {
                    ctx.moveTo(x + w + splitGap + 10, y - 20);
                    // Follow zigzag on left edge (reversed)
                    for (let i = zigzag.length - 1; i >= 0; i--) {
                        ctx.lineTo(zigzag[i].x + splitGap, zigzag[i].y);
                    }
                    ctx.lineTo(x + w + splitGap + 10, y + h + 20);
                    ctx.closePath();
                }
                ctx.clip();

                // Translate the half outward
                const offset = side === 'left' ? -splitGap : splitGap;
                ctx.translate(offset, 0);
                ctx.globalAlpha = baseAlpha * Math.min(1, approachPhase * 1.5);

                // Render the full table (without animation) inside the clip
                this.renderTable(ctx, {
                    ...el,
                    tableAnimProgress: undefined,
                    tableAnimStyle: undefined
                } as any, isDarkMode, style, rc, options);

                ctx.restore();
            };

            drawHalf('left');
            drawHalf('right');
        } else {
            // Table fully assembled — render normally
            ctx.save();
            ctx.globalAlpha = baseAlpha;
            this.renderTable(ctx, {
                ...el,
                tableAnimProgress: undefined,
                tableAnimStyle: undefined
            } as any, isDarkMode, style, rc, options);
            ctx.restore();
        }

        // Lightning bolt effect
        if (flashPhase > 0 && settlePhase < 1) {
            const flashAlpha = flashPhase < 0.5
                ? flashPhase * 2  // ramp up
                : Math.max(0, 1 - settlePhase); // fade out

            if (flashAlpha > 0) {
                // Glow effect
                ctx.save();
                ctx.globalAlpha = baseAlpha * flashAlpha * 0.6;
                ctx.strokeStyle = isDarkMode ? '#88ccff' : '#3b82f6';
                ctx.lineWidth = 8;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.shadowColor = isDarkMode ? '#88ccff' : '#3b82f6';
                ctx.shadowBlur = 25;
                ctx.beginPath();
                ctx.moveTo(zigzag[0].x, zigzag[0].y);
                for (let i = 1; i < zigzag.length; i++) {
                    ctx.lineTo(zigzag[i].x, zigzag[i].y);
                }
                ctx.stroke();
                ctx.restore();

                // Core bright line
                ctx.save();
                ctx.globalAlpha = baseAlpha * flashAlpha;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(zigzag[0].x, zigzag[0].y);
                for (let i = 1; i < zigzag.length; i++) {
                    ctx.lineTo(zigzag[i].x, zigzag[i].y);
                }
                ctx.stroke();
                ctx.restore();

                // Screen flash overlay
                if (flashPhase < 0.5) {
                    const flashScreenAlpha = (0.5 - flashPhase) * 0.3;
                    ctx.save();
                    ctx.globalAlpha = baseAlpha * flashScreenAlpha;
                    ctx.fillStyle = isDarkMode ? '#88ccff' : '#dbeafe';
                    ctx.fillRect(x - 20, y - 20, w + 40, h + 40);
                    ctx.restore();
                }
            }
        }
    }

    // ── Shared text rendering helper for animated phases ──
    private renderCellText(
        ctx: CanvasRenderingContext2D, el: DrawingElement, isDarkMode: boolean,
        alpha: number,
        cells: ReturnType<typeof computeCellRects>,
        data: string[][],
        hasHeader: boolean, sortCol: number, sortDir: string,
        colAlignments: any, mergedCells: any, cellFormats: any
    ): void {
        ctx.save();
        ctx.globalAlpha = alpha;
        const fontSize = el.fontSize ?? 14;
        ctx.font = getFontString(el);
        const textColor = RenderPipeline.adjustColor(el.textColor || el.strokeColor || '#000000', isDarkMode);
        const headerTextColor = el.tableHeaderTextColor
            ? RenderPipeline.adjustColor(el.tableHeaderTextColor, isDarkMode)
            : textColor;
        ctx.fillStyle = textColor;
        ctx.textBaseline = 'middle';
        const padding = 6;

        for (const cell of cells) {
            if (isCellCoveredByMerge(mergedCells, cell.row, cell.col)) continue;

            const isHeader = hasHeader && cell.row === 0;
            let cellText = '';
            if (isHeader) {
                cellText = data[0]?.[cell.dataCol] ?? `Col ${cell.dataCol + 1}`;
            } else {
                const dataRowIdx = hasHeader ? cell.dataRow + 1 : cell.dataRow;
                const rawValue = data[dataRowIdx]?.[cell.dataCol] ?? '';
                const cellFormat = getCellFormat(cellFormats, cell.row, cell.col);
                cellText = formatCellValue(rawValue, cellFormat);
            }

            if (!cellText) continue;

            const mergeRegion = isTopLeftOfMerge(mergedCells, cell.row, cell.col);
            const mergeBounds = mergeRegion ? getMergedCellBounds(cells, mergeRegion) : null;
            const cb = mergeBounds || { x: cell.x, y: cell.y, w: cell.w, h: cell.h };

            ctx.save();
            ctx.beginPath();
            ctx.rect(cb.x, cb.y, cb.w, cb.h);
            ctx.clip();

            const align = colAlignments?.[cell.dataCol] ?? 'center';
            let textX: number;
            if (align === 'left') { textX = cb.x + padding; ctx.textAlign = 'left'; }
            else if (align === 'right') { textX = cb.x + cb.w - padding; ctx.textAlign = 'right'; }
            else { textX = cb.x + cb.w / 2; ctx.textAlign = 'center'; }

            if (isHeader) {
                ctx.font = 'bold ' + getFontString(el);
                ctx.fillStyle = headerTextColor;
            } else {
                ctx.fillStyle = textColor;
            }

            const maxTextWidth = cb.w - padding * 2;
            const lines = wrapText(ctx, cellText, maxTextWidth);
            const lineHeight = fontSize * 1.2;
            const totalTextHeight = lines.length * lineHeight;
            const startTY = cb.y + (cb.h - totalTextHeight) / 2 + lineHeight / 2;
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], textX, startTY + i * lineHeight, maxTextWidth);
            }
            ctx.restore();

            // Sort indicators for header cells
            if (isHeader && !mergeRegion) {
                const indicatorSize = Math.min(fontSize * 0.6, cell.h * 0.3);
                const ix = cell.x + cell.w - padding - indicatorSize / 2;
                const iy = cell.y + cell.h / 2;
                const isSorted = sortCol === cell.dataCol && sortCol >= 0;
                ctx.save();
                if (isSorted) {
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
                    ctx.globalAlpha *= 0.3;
                    ctx.fillStyle = headerTextColor;
                    const half = indicatorSize * 0.4;
                    ctx.beginPath();
                    ctx.moveTo(ix, iy - half);
                    ctx.lineTo(ix - half, iy - half + half * 0.7);
                    ctx.lineTo(ix + half, iy - half + half * 0.7);
                    ctx.closePath();
                    ctx.fill();
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
