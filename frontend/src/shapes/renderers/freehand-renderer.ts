import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import type { IRenderer } from "../../rendering/IRenderer";
import { normalizePoints } from "../../utils/render-element";

// Drop touchdown/lift jitter at stroke endpoints. When a stylus first
// contacts (or just before lift), the reported position twitches by 1–2px
// before the real motion starts. Those near-coincident endpoint samples
// drive the Q-spline control points sideways and produce a small hook at
// the start and end of every fineliner/ink/inkbrush stroke. Trimming any
// endpoint samples closer than this threshold to their neighbor removes
// the hook without affecting legitimate strokes (normal stylus motion
// covers >3px per sample at any usable speed).
const STROKE_JITTER_TRIM_PX = 1.5;

export class FreehandRenderer extends ShapeRenderer {
    /**
     * Override base render to bypass the custom points check for freehand elements.
     * Freehand elements use points for their base geometry, not as a morph target.
     */
    render(context: RenderContext) {
        const { renderer, element, layerOpacity } = context;

        // Apply universal transformations
        const { cx, cy } = RenderPipeline.applyTransformations(renderer, element, layerOpacity);

        // Standard freehand render path
        if (element.renderStyle === 'architectural') {
            this.renderArchitectural(context, cx, cy);
        } else {
            this.renderSketch(context, cx, cy);
        }

        // Restore transformations
        RenderPipeline.restoreTransformations(renderer);
    }

    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    private renderCommon(context: RenderContext): void {
        const { renderer, element: el, isDarkMode, layerOpacity } = context;
        if (!el.points || el.points.length === 0) return;

        let absPoints = normalizePoints(el.points).map(p => ({ x: el.x + p.x, y: el.y + p.y }));

        // Apply smoothing if property exists
        if (el.smoothing && el.smoothing > 0) {
            absPoints = this.smoothPoints(absPoints, el.smoothing);
        }

        const strokeColor = RenderPipeline.adjustColor(el.strokeColor, isDarkMode);

        renderer.save();
        renderer.strokeStyle = strokeColor;
        renderer.fillStyle = strokeColor;

        if (el.type === 'fineliner') {
            this.renderFineliner(renderer, absPoints, el.strokeWidth);
        } else if (el.type === 'inkbrush') {
            this.renderInkbrush(renderer, absPoints, el.strokeWidth, el.taperAmount, el.velocitySensitivity);
        } else if (el.type === 'marker') {
            this.renderMarker(renderer, absPoints, el.strokeWidth, el.opacity, layerOpacity, isDarkMode);
        } else if (el.type === 'ink') {
            this.renderFineliner(renderer, absPoints, el.strokeWidth);
        }

        renderer.restore();
    }

    // Drop leading/trailing samples that sit within STROKE_JITTER_TRIM_PX
    // of their neighbor. Preserves at least 3 points so downstream
    // rendering paths (Q-spline / trapezoid) still have enough geometry.
    private trimEndpointJitter(pts: any[]): any[] {
        if (pts.length < 5) return pts;
        const sq = STROKE_JITTER_TRIM_PX * STROKE_JITTER_TRIM_PX;
        let start = 0;
        let end = pts.length - 1;
        while (end - start > 3) {
            const dx = pts[start + 1].x - pts[start].x;
            const dy = pts[start + 1].y - pts[start].y;
            if (dx * dx + dy * dy > sq) break;
            start++;
        }
        while (end - start > 3) {
            const dx = pts[end].x - pts[end - 1].x;
            const dy = pts[end].y - pts[end - 1].y;
            if (dx * dx + dy * dy > sq) break;
            end--;
        }
        return (start === 0 && end === pts.length - 1) ? pts : pts.slice(start, end + 1);
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

    private renderFineliner(renderer: IRenderer, rawPts: any[], width: number) {
        const pts = this.trimEndpointJitter(rawPts);
        if (pts.length < 6) {
            renderer.beginPath(); renderer.arc(pts[0].x, pts[0].y, width / 2, 0, Math.PI * 2); renderer.fill();
            return;
        }
        renderer.lineWidth = width; renderer.lineJoin = 'round'; renderer.lineCap = 'round';
        renderer.beginPath(); renderer.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 2; i++) {
            const midX = (pts[i].x + pts[i + 1].x) / 2, midY = (pts[i].y + pts[i + 1].y) / 2;
            renderer.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
        }
        const last = pts.length - 1;
        renderer.quadraticCurveTo(pts[last - 1].x, pts[last - 1].y, pts[last].x, pts[last].y);
        renderer.stroke();
    }

    private renderInkbrush(renderer: IRenderer, rawPtsIn: any[], baseWidth: number, taperAmount = 0.15, velocitySensitivity = 0.5) {
        // Trim touchdown/lift jitter before any other filtering so the
        // endpoint samples used for taper-width + trapezoid-perpendicular
        // come from real motion, not stylus-landing twitch.
        const rawPts = this.trimEndpointJitter(rawPtsIn);
        if (rawPts.length < 2) {
            renderer.beginPath(); renderer.arc(rawPts[0].x, rawPts[0].y, baseWidth / 2, 0, Math.PI * 2); renderer.fill();
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
            renderer.beginPath(); renderer.arc(pts[0].x, pts[0].y, baseWidth / 2, 0, Math.PI * 2); renderer.fill();
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
                // Floor raised from 0.1 → 0.4 (40% width at the very
                // endpoint). The previous 10% width at the last point
                // produced a needle-point with a perpendicular twist —
                // perceived as a "hook." 40% keeps a visible taper but
                // ends with enough thickness that the joint circle reads
                // as a clean round cap instead of a curl.
                if (i < taperLength) {
                    width *= (i / taperLength) * 0.6 + 0.4;
                }
                if (i > pts.length - taperLength - 1) {
                    const endPos = pts.length - 1 - i;
                    width *= (endPos / taperLength) * 0.6 + 0.4;
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

        // 6. Render as per-segment trapezoids + per-point joint circles. Each
        // piece is convex and self-contained, so multiple opaque fills compose
        // cleanly via source-over — overlap regions stay opaque regardless of
        // how often the stroke crosses itself or earlier strokes.
        //
        // Each trapezoid + circle is its own beginPath()+fill() to avoid
        // winding-direction interaction in a combined path. (The trapezoid
        // ordering A-left → B-left → B-right → A-right is visually CCW on
        // screen; the canvas-default arc direction is visually CW. In a single
        // combined path under nonzero, those opposite windings cancel where
        // they overlap and leave the trapezoid+circle pairs as a beaded chain
        // with gaps — independent fills sidestep that entirely.)
        //
        // The previous approach built a single big polygon (left edge → end cap
        // → right edge reversed → start cap) with smoothed edges and
        // quadraticCurveTo on both sides, then filled it once. That polygon
        // could self-intersect on curvy strokes — and under nonzero fill,
        // self-intersection regions with even winding count don't fill. Where
        // a hole sat over an earlier stroke, the canvas behind bled through
        // and the earlier stroke read as "lightened/erased."

        // Trapezoid per segment: each uses its own per-segment perpendicular
        // (no cross-segment blending). Adjacent trapezoids may overlap at
        // corners — that's intentional; the joint circles below close any gap.
        for (let i = 0; i < pts.length - 1; i++) {
            const dx = pts[i + 1].x - pts[i].x;
            const dy = pts[i + 1].y - pts[i].y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const perpX = -dy / len;
            const perpY = dx / len;
            const hwA = widths[i] / 2;
            const hwB = widths[i + 1] / 2;
            renderer.beginPath();
            renderer.moveTo(pts[i].x + perpX * hwA, pts[i].y + perpY * hwA);
            renderer.lineTo(pts[i + 1].x + perpX * hwB, pts[i + 1].y + perpY * hwB);
            renderer.lineTo(pts[i + 1].x - perpX * hwB, pts[i + 1].y - perpY * hwB);
            renderer.lineTo(pts[i].x - perpX * hwA, pts[i].y - perpY * hwA);
            renderer.closePath();
            renderer.fill();
        }

        // Joint circle at each point: rounds the caps at start/end and fills
        // the wedge gap between adjacent trapezoids whenever the stroke turns.
        for (let i = 0; i < pts.length; i++) {
            renderer.beginPath();
            renderer.arc(pts[i].x, pts[i].y, widths[i] / 2, 0, Math.PI * 2);
            renderer.fill();
        }
    }

    private renderMarker(renderer: IRenderer, pts: any[], width: number, opacity: number | undefined, layerOpacity: number, isDarkMode: boolean) {
        renderer.globalAlpha = ((opacity ?? 100) / 100) * layerOpacity * 0.5;
        renderer.globalCompositeOperation = isDarkMode ? 'screen' : 'multiply';
        this.renderFineliner(renderer, pts, width * 4);
    }

    protected definePath(renderer: IRenderer, el: any): void {
        const pts = normalizePoints(el.points).map(p => ({ x: el.x + p.x, y: el.y + p.y }));
        if (pts.length < 2) return;

        // Use similar logic to fineliner for smooth path
        if (pts.length < 6) {
            renderer.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) renderer.lineTo(pts[i].x, pts[i].y);
            return;
        }

        renderer.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 2; i++) {
            const midX = (pts[i].x + pts[i + 1].x) / 2, midY = (pts[i].y + pts[i + 1].y) / 2;
            renderer.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
        }
        const last = pts.length - 1;
        renderer.quadraticCurveTo(pts[last - 1].x, pts[last - 1].y, pts[last].x, pts[last].y);
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
