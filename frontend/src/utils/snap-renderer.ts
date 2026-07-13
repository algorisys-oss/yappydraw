/**
 * Snap & Spacing Guide Renderer
 * Draws alignment snapping guides and equal-spacing indicators on the canvas.
 * Pure rendering functions — no store access, no side effects beyond drawing.
 */

import type { SnappingGuide } from './object-snapping';
import type { SpacingGuide } from './spacing';
import type { MeasureSegment } from './measure-gap';

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

/**
 * Draw the anchor-point snap marker (Precision & Measurement — Phase 4b):
 * a small magenta rotated square (diamond) + cross at the world point the dragged
 * anchor locked onto, so a "snap to point" reads differently from an axis guide.
 */
export function renderPointSnapMarker(
    ctx: CanvasRenderingContext2D,
    marker: { x: number; y: number } | null,
    scale: number
): void {
    if (!marker) return;
    const s = 5 / scale; // half-size
    ctx.save();
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 1.5 / scale;
    // Diamond
    ctx.beginPath();
    ctx.moveTo(marker.x, marker.y - s);
    ctx.lineTo(marker.x + s, marker.y);
    ctx.lineTo(marker.x, marker.y + s);
    ctx.lineTo(marker.x - s, marker.y);
    ctx.closePath();
    ctx.stroke();
    // Cross through the centre
    ctx.beginPath();
    ctx.moveTo(marker.x - s, marker.y);
    ctx.lineTo(marker.x + s, marker.y);
    ctx.moveTo(marker.x, marker.y - s);
    ctx.lineTo(marker.x, marker.y + s);
    ctx.stroke();
    ctx.restore();
}

/**
 * Draw measure-to-neighbor dimension lines (Precision & Measurement — Phase 2).
 * Red arrowed lines with end ticks and a px label at the midpoint, matching the
 * spacing-guide grammar but in the "measure" colour so it reads as inspection,
 * not snapping. Purely presentational; segments come from `getMeasureSegments`.
 */
export function renderMeasureGaps(
    ctx: CanvasRenderingContext2D,
    segments: MeasureSegment[],
    scale: number
): void {
    if (segments.length === 0) return;

    const COLOR = '#ff3b30'; // measure red
    ctx.save();
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 1 / scale;
    ctx.font = `${Math.floor(10 / scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const tickSize = 4 / scale;
    const textH = 12 / scale;
    const pad = 2 / scale;

    segments.forEach(seg => {
        const label = Math.round(seg.distance).toString();
        const textW = ctx.measureText(label).width + pad * 4;

        if (seg.orientation === 'horizontal') {
            // Line + end ticks
            ctx.beginPath();
            ctx.moveTo(seg.from, seg.coordinate);
            ctx.lineTo(seg.to, seg.coordinate);
            ctx.moveTo(seg.from, seg.coordinate - tickSize);
            ctx.lineTo(seg.from, seg.coordinate + tickSize);
            ctx.moveTo(seg.to, seg.coordinate - tickSize);
            ctx.lineTo(seg.to, seg.coordinate + tickSize);
            ctx.stroke();
            // Label chip
            const midX = (seg.from + seg.to) / 2;
            ctx.fillStyle = COLOR;
            ctx.fillRect(midX - textW / 2, seg.coordinate - textH / 2, textW, textH);
            ctx.fillStyle = 'white';
            ctx.fillText(label, midX, seg.coordinate);
        } else {
            ctx.beginPath();
            ctx.moveTo(seg.coordinate, seg.from);
            ctx.lineTo(seg.coordinate, seg.to);
            ctx.moveTo(seg.coordinate - tickSize, seg.from);
            ctx.lineTo(seg.coordinate + tickSize, seg.from);
            ctx.moveTo(seg.coordinate - tickSize, seg.to);
            ctx.lineTo(seg.coordinate + tickSize, seg.to);
            ctx.stroke();
            const midY = (seg.from + seg.to) / 2;
            ctx.fillStyle = COLOR;
            ctx.fillRect(seg.coordinate - textW / 2, midY - textH / 2, textW, textH);
            ctx.fillStyle = 'white';
            ctx.fillText(label, seg.coordinate, midY);
        }
    });
    ctx.restore();
}
