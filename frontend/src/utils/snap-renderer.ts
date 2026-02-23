/**
 * Snap & Spacing Guide Renderer
 * Draws alignment snapping guides and equal-spacing indicators on the canvas.
 * Pure rendering functions — no store access, no side effects beyond drawing.
 */

import type { SnappingGuide } from './object-snapping';
import type { SpacingGuide } from './spacing';

/**
 * Draw magenta dashed alignment guides (vertical/horizontal lines).
 */
export function renderSnappingGuides(
    ctx: CanvasRenderingContext2D,
    guides: SnappingGuide[],
    scale: number
): void {
    if (guides.length === 0) return;

    ctx.save();
    ctx.strokeStyle = '#ff00ff';
    ctx.setLineDash([5 / scale, 5 / scale]);
    ctx.lineWidth = 1 / scale;

    guides.forEach(g => {
        ctx.beginPath();
        if (g.type === 'vertical') {
            ctx.moveTo(g.coordinate, -100000);
            ctx.lineTo(g.coordinate, 100000);
        } else {
            ctx.moveTo(-100000, g.coordinate);
            ctx.lineTo(100000, g.coordinate);
        }
        ctx.stroke();
    });
    ctx.restore();
}

/**
 * Draw equal-spacing indicators with measurement lines, ticks, and gap labels.
 */
export function renderSpacingGuides(
    ctx: CanvasRenderingContext2D,
    guides: SpacingGuide[],
    scale: number
): void {
    if (guides.length === 0) return;

    ctx.save();
    ctx.strokeStyle = '#ff00ff';
    ctx.fillStyle = '#ff00ff';
    ctx.lineWidth = 1 / scale;
    ctx.font = `${Math.floor(10 / scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    guides.forEach(g => {
        g.segments.forEach(seg => {
            ctx.beginPath();
            if (g.orientation === 'horizontal') {
                // Drawing line with arrows
                ctx.moveTo(seg.from, g.variableCoordinate);
                ctx.lineTo(seg.to, g.variableCoordinate);
                ctx.stroke();

                // Short vertical ticks
                const tickSize = 4 / scale;
                ctx.beginPath();
                ctx.moveTo(seg.from, g.variableCoordinate - tickSize);
                ctx.lineTo(seg.from, g.variableCoordinate + tickSize);
                ctx.moveTo(seg.to, g.variableCoordinate - tickSize);
                ctx.lineTo(seg.to, g.variableCoordinate + tickSize);
                ctx.stroke();

                // Label
                const midX = (seg.from + seg.to) / 2;
                const label = Math.round(g.gap).toString();
                const padding = 2 / scale;
                const textW = ctx.measureText(label).width + padding * 4;
                const textH = (12 / scale);

                ctx.fillStyle = '#ff00ff';
                ctx.fillRect(midX - textW / 2, g.variableCoordinate - textH / 2, textW, textH);
                ctx.fillStyle = 'white';
                ctx.fillText(label, midX, g.variableCoordinate);
                ctx.fillStyle = '#ff00ff'; // Restore
            } else {
                // Vertical
                ctx.beginPath();
                ctx.moveTo(g.variableCoordinate, seg.from);
                ctx.lineTo(g.variableCoordinate, seg.to);
                ctx.stroke();

                // Ticks
                const tickSize = 4 / scale;
                ctx.beginPath();
                ctx.moveTo(g.variableCoordinate - tickSize, seg.from);
                ctx.lineTo(g.variableCoordinate + tickSize, seg.from);
                ctx.moveTo(g.variableCoordinate - tickSize, seg.to);
                ctx.lineTo(g.variableCoordinate + tickSize, seg.to);
                ctx.stroke();

                // Label
                const midY = (seg.from + seg.to) / 2;
                const label = Math.round(g.gap).toString();
                const padding = 2 / scale;
                const textW = ctx.measureText(label).width + padding * 4;
                const textH = (12 / scale);

                ctx.fillStyle = '#ff00ff';
                ctx.fillRect(g.variableCoordinate - textW / 2, midY - textH / 2, textW, textH);
                ctx.fillStyle = 'white';
                ctx.fillText(label, g.variableCoordinate, midY);
                ctx.fillStyle = '#ff00ff'; // Restore
            }
        });
    });
    ctx.restore();
}
