import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import { normalizePoints } from "../../utils/render-element";

export class FreehandRenderer extends ShapeRenderer {
    /**
     * Override base render to bypass the custom points check for freehand elements.
     * Freehand elements use points for their base geometry, not as a morph target.
     */
    render(context: RenderContext) {
        const { ctx, element, layerOpacity } = context;

        // Apply universal transformations
        const { cx, cy } = RenderPipeline.applyTransformations(ctx, element, layerOpacity);

        // Standard freehand render path
        if (element.renderStyle === 'architectural') {
            this.renderArchitectural(context, cx, cy);
        } else {
            this.renderSketch(context, cx, cy);
        }

        // Restore transformations
        RenderPipeline.restoreTransformations(ctx);
    }

    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    private renderCommon(context: RenderContext): void {
        const { ctx, element: el, isDarkMode, layerOpacity } = context;
        if (!el.points || el.points.length === 0) return;

        let absPoints = normalizePoints(el.points).map(p => ({ x: el.x + p.x, y: el.y + p.y }));

        // Apply smoothing if property exists
        if (el.smoothing && el.smoothing > 0) {
            absPoints = this.smoothPoints(absPoints, el.smoothing);
        }

        const strokeColor = RenderPipeline.adjustColor(el.strokeColor, isDarkMode);

        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = strokeColor;

        if (el.type === 'fineliner') {
            this.renderFineliner(ctx, absPoints, el.strokeWidth);
        } else if (el.type === 'inkbrush') {
            this.renderInkbrush(ctx, absPoints, el.strokeWidth, el.taperAmount, el.velocitySensitivity);
        } else if (el.type === 'marker') {
            this.renderMarker(ctx, absPoints, el.strokeWidth, el.opacity, layerOpacity, isDarkMode);
        } else if (el.type === 'ink') {
            this.renderFineliner(ctx, absPoints, el.strokeWidth);
        }

        ctx.restore();
    }

    private smoothPoints(pts: any[], intensity: number): any[] {
        if (pts.length < 3) return pts;
        const smoothed = [pts[0]];
        const windowSize = Math.floor(intensity / 2) || 1;

        for (let i = 1; i < pts.length - 1; i++) {
            let sumX = 0, sumY = 0, count = 0;
            for (let j = Math.max(0, i - windowSize); j <= Math.min(pts.length - 1, i + windowSize); j++) {
                sumX += pts[j].x;
                sumY += pts[j].y;
                count++;
            }
            smoothed.push({ x: sumX / count, y: sumY / count });
        }
        smoothed.push(pts[pts.length - 1]);
        return smoothed;
    }

    private renderFineliner(ctx: CanvasRenderingContext2D, pts: any[], width: number) {
        if (pts.length < 6) {
            ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, width / 2, 0, Math.PI * 2); ctx.fill();
            return;
        }
        ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 2; i++) {
            const midX = (pts[i].x + pts[i + 1].x) / 2, midY = (pts[i].y + pts[i + 1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
        }
        const last = pts.length - 1;
        ctx.quadraticCurveTo(pts[last - 1].x, pts[last - 1].y, pts[last].x, pts[last].y);
        ctx.stroke();
    }

    private renderInkbrush(ctx: CanvasRenderingContext2D, rawPts: any[], baseWidth: number, taperAmount = 0.15, velocitySensitivity = 0.5) {
        if (rawPts.length < 2) {
            ctx.beginPath(); ctx.arc(rawPts[0].x, rawPts[0].y, baseWidth / 2, 0, Math.PI * 2); ctx.fill();
            return;
        }

        // 1. Filter out points that are too close (reduces jitter from slow drawing)
        const MIN_DIST_SQ = 4;
        const pts = [rawPts[0]];
        for (let i = 1; i < rawPts.length; i++) {
            const dx = rawPts[i].x - pts[pts.length - 1].x;
            const dy = rawPts[i].y - pts[pts.length - 1].y;
            if (dx * dx + dy * dy >= MIN_DIST_SQ || i === rawPts.length - 1) {
                pts.push(rawPts[i]);
            }
        }
        if (pts.length < 2) {
            ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, baseWidth / 2, 0, Math.PI * 2); ctx.fill();
            return;
        }

        // 2. Calculate velocities (distances between consecutive points)
        const velocities: number[] = [0];
        for (let i = 1; i < pts.length; i++) {
            const dx = pts[i].x - pts[i - 1].x;
            const dy = pts[i].y - pts[i - 1].y;
            velocities.push(Math.sqrt(dx * dx + dy * dy));
        }

        // 3. Bidirectional EMA for smooth velocities (eliminates width wobble)
        const velAlpha = 0.3;
        const smoothedVelocities: number[] = [velocities[0]];
        for (let i = 1; i < velocities.length; i++) {
            smoothedVelocities.push(velAlpha * velocities[i] + (1 - velAlpha) * smoothedVelocities[i - 1]);
        }
        for (let i = smoothedVelocities.length - 2; i >= 0; i--) {
            smoothedVelocities[i] = velAlpha * smoothedVelocities[i] + (1 - velAlpha) * smoothedVelocities[i + 1];
        }

        const maxVelocity = Math.max(...smoothedVelocities, 1);

        // 4. Calculate raw widths from velocity
        const minWidth = baseWidth * (1 - velocitySensitivity * 0.7);
        const maxWidth = baseWidth * (1 + velocitySensitivity * 0.5);
        const rawWidths: number[] = [];

        for (let i = 0; i < pts.length; i++) {
            const velocityFactor = smoothedVelocities[i] / maxVelocity;
            let width = maxWidth - (maxWidth - minWidth) * velocityFactor;

            const taperLength = Math.min(pts.length * taperAmount, 20);
            if (taperLength > 0) {
                if (i < taperLength) {
                    width *= (i / taperLength) * 0.9 + 0.1;
                }
                if (i > pts.length - taperLength - 1) {
                    const endPos = pts.length - 1 - i;
                    width *= (endPos / taperLength) * 0.9 + 0.1;
                }
            }

            rawWidths.push(Math.max(width, 0.5));
        }

        // 5. Smooth widths with bidirectional EMA for gradual transitions
        const widthAlpha = 0.4;
        const widths: number[] = [rawWidths[0]];
        for (let i = 1; i < rawWidths.length; i++) {
            widths.push(widthAlpha * rawWidths[i] + (1 - widthAlpha) * widths[i - 1]);
        }
        for (let i = widths.length - 2; i >= 0; i--) {
            widths[i] = widthAlpha * widths[i] + (1 - widthAlpha) * widths[i + 1];
        }

        // 6. Build left and right edges with perpendicular smoothing
        const leftEdge: { x: number; y: number }[] = [];
        const rightEdge: { x: number; y: number }[] = [];
        let prevPerpX = 0, prevPerpY = 0;

        for (let i = 0; i < pts.length; i++) {
            let perpX: number, perpY: number;

            if (i === 0) {
                const dx = pts[1].x - pts[0].x;
                const dy = pts[1].y - pts[0].y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                perpX = -dy / len;
                perpY = dx / len;
            } else if (i === pts.length - 1) {
                const dx = pts[i].x - pts[i - 1].x;
                const dy = pts[i].y - pts[i - 1].y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                perpX = -dy / len;
                perpY = dx / len;
            } else {
                const dx1 = pts[i].x - pts[i - 1].x;
                const dy1 = pts[i].y - pts[i - 1].y;
                const dx2 = pts[i + 1].x - pts[i].x;
                const dy2 = pts[i + 1].y - pts[i].y;
                const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
                const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
                perpX = -(dy1 / len1 + dy2 / len2) / 2;
                perpY = (dx1 / len1 + dx2 / len2) / 2;
                const perpLen = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
                perpX /= perpLen;
                perpY /= perpLen;
            }

            // Prevent perpendicular flipping at sharp corners and blend with previous
            if (i > 0) {
                const dot = perpX * prevPerpX + perpY * prevPerpY;
                if (dot < 0) {
                    perpX = -perpX;
                    perpY = -perpY;
                }
                const blend = 0.6;
                perpX = perpX * blend + prevPerpX * (1 - blend);
                perpY = perpY * blend + prevPerpY * (1 - blend);
                const reLen = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
                perpX /= reLen;
                perpY /= reLen;
            }

            prevPerpX = perpX;
            prevPerpY = perpY;

            const halfWidth = widths[i] / 2;
            leftEdge.push({ x: pts[i].x + perpX * halfWidth, y: pts[i].y + perpY * halfWidth });
            rightEdge.push({ x: pts[i].x - perpX * halfWidth, y: pts[i].y - perpY * halfWidth });
        }

        // 7. Smooth polygon edges (two passes for cleaner outlines)
        const smoothEdge = (edge: { x: number; y: number }[]): { x: number; y: number }[] => {
            if (edge.length < 3) return edge;
            const result = [edge[0]];
            for (let i = 1; i < edge.length - 1; i++) {
                result.push({
                    x: edge[i - 1].x * 0.25 + edge[i].x * 0.5 + edge[i + 1].x * 0.25,
                    y: edge[i - 1].y * 0.25 + edge[i].y * 0.5 + edge[i + 1].y * 0.25,
                });
            }
            result.push(edge[edge.length - 1]);
            return result;
        };

        const smoothLeft = smoothEdge(smoothEdge(leftEdge));
        const smoothRight = smoothEdge(smoothEdge(rightEdge));

        // 8. Draw the filled shape with smooth curves
        ctx.beginPath();

        if (smoothLeft.length >= 2) {
            ctx.moveTo(smoothLeft[0].x, smoothLeft[0].y);

            // Left edge (forward)
            for (let i = 1; i < smoothLeft.length - 1; i++) {
                const midX = (smoothLeft[i].x + smoothLeft[i + 1].x) / 2;
                const midY = (smoothLeft[i].y + smoothLeft[i + 1].y) / 2;
                ctx.quadraticCurveTo(smoothLeft[i].x, smoothLeft[i].y, midX, midY);
            }
            ctx.lineTo(smoothLeft[smoothLeft.length - 1].x, smoothLeft[smoothLeft.length - 1].y);

            // End cap (rounded)
            const endIdx = pts.length - 1;
            ctx.arc(pts[endIdx].x, pts[endIdx].y, widths[endIdx] / 2,
                Math.atan2(smoothLeft[endIdx].y - pts[endIdx].y, smoothLeft[endIdx].x - pts[endIdx].x),
                Math.atan2(smoothRight[endIdx].y - pts[endIdx].y, smoothRight[endIdx].x - pts[endIdx].x),
                false);

            // Right edge (backward)
            for (let i = smoothRight.length - 2; i > 0; i--) {
                const midX = (smoothRight[i].x + smoothRight[i - 1].x) / 2;
                const midY = (smoothRight[i].y + smoothRight[i - 1].y) / 2;
                ctx.quadraticCurveTo(smoothRight[i].x, smoothRight[i].y, midX, midY);
            }
            ctx.lineTo(smoothRight[0].x, smoothRight[0].y);

            // Start cap (rounded)
            ctx.arc(pts[0].x, pts[0].y, widths[0] / 2,
                Math.atan2(smoothRight[0].y - pts[0].y, smoothRight[0].x - pts[0].x),
                Math.atan2(smoothLeft[0].y - pts[0].y, smoothLeft[0].x - pts[0].x),
                false);
        }

        ctx.closePath();
        ctx.fill();
    }

    private renderMarker(ctx: CanvasRenderingContext2D, pts: any[], width: number, opacity: number | undefined, layerOpacity: number, isDarkMode: boolean) {
        ctx.globalAlpha = ((opacity ?? 100) / 100) * layerOpacity * 0.5;
        ctx.globalCompositeOperation = isDarkMode ? 'screen' : 'multiply';
        this.renderFineliner(ctx, pts, width * 4);
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        const pts = normalizePoints(el.points).map(p => ({ x: el.x + p.x, y: el.y + p.y }));
        if (pts.length < 2) return;

        // Use similar logic to fineliner for smooth path
        if (pts.length < 6) {
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
            return;
        }

        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 2; i++) {
            const midX = (pts[i].x + pts[i + 1].x) / 2, midY = (pts[i].y + pts[i + 1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
        }
        const last = pts.length - 1;
        ctx.quadraticCurveTo(pts[last - 1].x, pts[last - 1].y, pts[last].x, pts[last].y);
    }

    estimatePathLength(element: any): number {
        const pts = normalizePoints(element.points);
        if (pts.length < 2) return 0;
        let total = 0;
        for (let i = 1; i < pts.length; i++) {
            const dx = pts[i].x - pts[i - 1].x;
            const dy = pts[i].y - pts[i - 1].y;
            total += Math.sqrt(dx * dx + dy * dy);
        }
        return total;
    }
}
