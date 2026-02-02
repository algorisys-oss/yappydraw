/**
 * Table Renderer
 * Dedicated renderer for the 'table' element type.
 * Supports configurable rows/cols, headers, cell text, header colors,
 * alternating row colors, and sort indicators.
 */

import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import { computeCellRects, defaultColWidths, defaultRowHeights, defaultTableData } from "../../utils/table-utils";
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

        const cellRects = computeCellRects(x, y, w, h, colWidths, rowHeights, colOrder, hasHeader);

        // Determine order for data column lookup
        const order = colOrder ?? Array.from({ length: cols }, (_, i) => i);

        // --- 1. Draw cell backgrounds ---
        for (const cell of cellRects) {
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
                ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
            }
        }

        // --- 2. Draw grid lines ---
        if (style === 'sketch' && rc && options) {
            // Outer border
            rc.rectangle(x, y, w, h, { ...options, fill: undefined });

            // Row lines
            const rowYs: number[] = [0];
            for (let r = 0; r < rowHeights.length; r++) {
                rowYs.push(rowYs[r] + rowHeights[r] * h);
            }
            for (let r = 1; r < rowHeights.length; r++) {
                const ry = y + rowYs[r];
                rc.line(x, ry, x + w, ry, { ...options, fill: undefined });
            }

            // Column lines
            const colXs: number[] = [0];
            for (let c = 0; c < cols; c++) {
                const dataCol = order[c];
                colXs.push(colXs[c] + colWidths[dataCol] * w);
            }
            for (let c = 1; c < cols; c++) {
                const cx2 = x + colXs[c];
                rc.line(cx2, y, cx2, y + h, { ...options, fill: undefined });
            }
        } else {
            // Architectural style
            RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);

            // Outer border
            ctx.strokeRect(x, y, w, h);

            // Row lines
            const rowYs: number[] = [0];
            for (let r = 0; r < rowHeights.length; r++) {
                rowYs.push(rowYs[r] + rowHeights[r] * h);
            }
            for (let r = 1; r < rowHeights.length; r++) {
                const ry = y + rowYs[r];
                ctx.beginPath();
                ctx.moveTo(x, ry);
                ctx.lineTo(x + w, ry);
                ctx.stroke();
            }

            // Column lines
            const colXs: number[] = [0];
            for (let c = 0; c < cols; c++) {
                const dataCol = order[c];
                colXs.push(colXs[c] + colWidths[dataCol] * w);
            }
            for (let c = 1; c < cols; c++) {
                const cx2 = x + colXs[c];
                ctx.beginPath();
                ctx.moveTo(cx2, y);
                ctx.lineTo(cx2, y + h);
                ctx.stroke();
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
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const padding = 6;

        for (const cell of cellRects) {
            const isHeader = hasHeader && cell.row === 0;
            let cellText = '';

            if (isHeader) {
                // Header labels stored in data[0] when headers enabled
                cellText = data[0]?.[cell.dataCol] ?? `Col ${cell.dataCol + 1}`;
            } else {
                // Body data starts at data[1] when headers enabled, data[0] otherwise
                const dataRowIdx = hasHeader ? cell.dataRow + 1 : cell.dataRow;
                cellText = data[dataRowIdx]?.[cell.dataCol] ?? '';
            }

            if (cellText) {
                // Clip text to cell bounds
                ctx.save();
                ctx.beginPath();
                ctx.rect(cell.x, cell.y, cell.w, cell.h);
                ctx.clip();

                const textX = cell.x + cell.w / 2;
                const textY = cell.y + cell.h / 2;

                if (isHeader) {
                    ctx.font = `bold ${fontSize}px ${ctx.font.split(' ').slice(1).join(' ') || 'sans-serif'}`;
                    // Re-apply font with bold for header
                    const parts = getFontString(el).split(' ');
                    if (!parts.includes('bold')) {
                        ctx.font = 'bold ' + getFontString(el);
                    }
                    ctx.fillStyle = headerTextColor;
                } else {
                    ctx.fillStyle = textColor;
                }

                ctx.fillText(cellText, textX, textY, cell.w - padding * 2);
                ctx.restore();
            }

            // --- Sort indicator for ALL header cells ---
            if (isHeader) {
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

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        ctx.rect(el.x, el.y, el.width, el.height);
    }
}
