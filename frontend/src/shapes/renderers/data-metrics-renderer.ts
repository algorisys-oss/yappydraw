import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import { getShapeGeometry } from "../../utils/shape-geometry";
import type { RenderContext } from "../base/types";
import type { DrawingElement } from "../../types";
import type { IRenderer } from "../../rendering/IRenderer";

/** Pie slice data from Mermaid pie DSL. */
interface PieSlice {
    label: string;
    value: number;
    color?: string;
}

/** Gantt task data from Mermaid gantt DSL. */
interface GanttTask {
    id: string; label: string; section: string;
    startDate: string; endDate: string; duration: number;
    isCritical?: boolean; status?: 'done' | 'active' | 'default'; color?: string;
}

/** Journey task data from Mermaid journey DSL. */
interface JourneyTask {
    label: string; score: number; actors: string[]; section: string; color?: string;
}

/** Quadrant chart data from Mermaid quadrantChart DSL. */
interface QuadrantData {
    title?: string;
    xAxisLabel?: [string, string]; yAxisLabel?: [string, string];
    quadrantLabels: [string, string, string, string];
    points: Array<{ label: string; x: number; y: number; color?: string }>;
}

/** XY chart data from Mermaid xychart-beta DSL. */
interface XYChartData {
    title?: string;
    xAxis: { labels?: string[]; label?: string };
    yAxis: { label?: string; min?: number; max?: number };
    bars?: number[]; lines?: number[][];
}

export class DataMetricsRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { renderer, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            case 'barChart': {
                // Data-driven bars (Graph tool) — normalised to the tallest; else a decorative default.
                const vals = (el as any).barValues as number[] | undefined;
                const heights = (vals && vals.length) ? (() => { const m = Math.max(...vals, 1e-6); return vals.map(v => Math.max(0, v) / m); })() : [0.5, 0.8, 0.35, 0.65];
                const barCount = heights.length;
                const gap = w * 0.08;
                const barW = (w - gap * (barCount + 1)) / barCount;
                const baseY = y + h;

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    for (let i = 0; i < barCount; i++) {
                        const bx = x + gap + i * (barW + gap);
                        const bh = h * 0.85 * heights[i];
                        renderer.fillRect(bx, baseY - bh, barW, bh);
                    }
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                for (let i = 0; i < barCount; i++) {
                    const bx = x + gap + i * (barW + gap);
                    const bh = h * 0.85 * heights[i];
                    renderer.strokeRect(bx, baseY - bh, barW, bh);
                }
                // Axes
                renderer.beginPath();
                renderer.moveTo(x + gap * 0.5, y + h * 0.05);
                renderer.lineTo(x + gap * 0.5, baseY);
                renderer.lineTo(x + w - gap * 0.5, baseY);
                renderer.stroke();
                break;
            }
            case 'pieChart': {
                const pieSlices = (el as any).pieSlices as PieSlice[] | undefined;
                if (pieSlices && pieSlices.length > 0) {
                    this.renderDataPieArchitectural(renderer, el, pieSlices, isDarkMode);
                    // Data-driven pie renders its own title + legend — skip base renderText
                    return;
                } else {
                    // Fallback: decorative pie for generic tool shape
                    const ccx = x + w / 2, ccy = y + h / 2;
                    const r = Math.min(w, h) / 2;
                    const placeholderSlices = [0, 0.3, 0.55, 0.8];
                    if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                        renderer.fillStyle = options.fill;
                        renderer.beginPath();
                        renderer.ellipse(ccx, ccy, r, r, 0, 0, Math.PI * 2);
                        renderer.fill();
                    }
                    RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                    renderer.beginPath();
                    renderer.ellipse(ccx, ccy, r, r, 0, 0, Math.PI * 2);
                    renderer.stroke();
                    for (const s of placeholderSlices) {
                        const angle = s * Math.PI * 2 - Math.PI / 2;
                        renderer.beginPath();
                        renderer.moveTo(ccx, ccy);
                        renderer.lineTo(ccx + Math.cos(angle) * r, ccy + Math.sin(angle) * r);
                        renderer.stroke();
                    }
                }
                break;
            }
            case 'trendUp': {
                // Upward trending line with area fill and arrowhead
                const margin = w * 0.08;
                const baseY = y + h * 0.92;
                const pts = [
                    { px: x + margin, py: y + h * 0.75 },
                    { px: x + w * 0.3, py: y + h * 0.55 },
                    { px: x + w * 0.55, py: y + h * 0.45 },
                    { px: x + w * 0.8, py: y + h * 0.2 }
                ];
                const arrowSize = Math.min(w, h) * 0.1;
                const lastPt = pts[pts.length - 1];
                const prevPt = pts[pts.length - 2];
                const angle = Math.atan2(lastPt.py - prevPt.py, lastPt.px - prevPt.px);
                const tipX = lastPt.px + Math.cos(angle) * arrowSize;
                const tipY = lastPt.py + Math.sin(angle) * arrowSize;

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.beginPath();
                    renderer.moveTo(pts[0].px, baseY);
                    for (const p of pts) renderer.lineTo(p.px, p.py);
                    renderer.lineTo(lastPt.px, baseY);
                    renderer.closePath();
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                // Trend line
                renderer.beginPath();
                renderer.moveTo(pts[0].px, pts[0].py);
                for (let i = 1; i < pts.length; i++) renderer.lineTo(pts[i].px, pts[i].py);
                renderer.lineTo(tipX, tipY);
                renderer.stroke();
                // Arrowhead
                const a1 = angle + Math.PI * 0.82;
                const a2 = angle - Math.PI * 0.82;
                renderer.beginPath();
                renderer.moveTo(tipX, tipY);
                renderer.lineTo(tipX + Math.cos(a1) * arrowSize, tipY + Math.sin(a1) * arrowSize);
                renderer.lineTo(tipX + Math.cos(a2) * arrowSize, tipY + Math.sin(a2) * arrowSize);
                renderer.closePath();
                renderer.fillStyle = RenderPipeline.adjustColor(el.strokeColor || '#000000', isDarkMode);
                renderer.fill();
                // Data points
                for (const p of pts) {
                    renderer.beginPath();
                    renderer.arc(p.px, p.py, Math.min(w, h) * 0.025, 0, Math.PI * 2);
                    renderer.fill();
                }
                // Baseline axis
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.beginPath();
                renderer.moveTo(x + margin * 0.5, baseY);
                renderer.lineTo(x + w - margin * 0.5, baseY);
                renderer.stroke();
                break;
            }
            case 'trendDown': {
                // Downward trending line with area fill and arrowhead
                const margin = w * 0.08;
                const baseY = y + h * 0.92;
                const pts = [
                    { px: x + margin, py: y + h * 0.15 },
                    { px: x + w * 0.3, py: y + h * 0.35 },
                    { px: x + w * 0.55, py: y + h * 0.5 },
                    { px: x + w * 0.8, py: y + h * 0.7 }
                ];
                const arrowSize = Math.min(w, h) * 0.1;
                const lastPt = pts[pts.length - 1];
                const prevPt = pts[pts.length - 2];
                const angle = Math.atan2(lastPt.py - prevPt.py, lastPt.px - prevPt.px);
                const tipX = lastPt.px + Math.cos(angle) * arrowSize;
                const tipY = lastPt.py + Math.sin(angle) * arrowSize;

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.beginPath();
                    renderer.moveTo(pts[0].px, baseY);
                    for (const p of pts) renderer.lineTo(p.px, p.py);
                    renderer.lineTo(lastPt.px, baseY);
                    renderer.closePath();
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                // Trend line
                renderer.beginPath();
                renderer.moveTo(pts[0].px, pts[0].py);
                for (let i = 1; i < pts.length; i++) renderer.lineTo(pts[i].px, pts[i].py);
                renderer.lineTo(tipX, tipY);
                renderer.stroke();
                // Arrowhead
                const a1 = angle + Math.PI * 0.82;
                const a2 = angle - Math.PI * 0.82;
                renderer.beginPath();
                renderer.moveTo(tipX, tipY);
                renderer.lineTo(tipX + Math.cos(a1) * arrowSize, tipY + Math.sin(a1) * arrowSize);
                renderer.lineTo(tipX + Math.cos(a2) * arrowSize, tipY + Math.sin(a2) * arrowSize);
                renderer.closePath();
                renderer.fillStyle = RenderPipeline.adjustColor(el.strokeColor || '#000000', isDarkMode);
                renderer.fill();
                // Data points
                for (const p of pts) {
                    renderer.beginPath();
                    renderer.arc(p.px, p.py, Math.min(w, h) * 0.025, 0, Math.PI * 2);
                    renderer.fill();
                }
                // Baseline axis
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.beginPath();
                renderer.moveTo(x + margin * 0.5, baseY);
                renderer.lineTo(x + w - margin * 0.5, baseY);
                renderer.stroke();
                break;
            }
            case 'funnel': {
                // Trapezoid funnel shape narrowing downward
                const topL = x, topR = x + w;
                const botL = x + w * 0.3, botR = x + w * 0.7;
                const midY1 = y + h * 0.35;
                const midY2 = y + h * 0.65;
                const midL1 = x + w * 0.1, midR1 = x + w * 0.9;
                const midL2 = x + w * 0.22, midR2 = x + w * 0.78;

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.beginPath();
                    renderer.moveTo(topL, y);
                    renderer.lineTo(topR, y);
                    renderer.lineTo(botR, y + h);
                    renderer.lineTo(botL, y + h);
                    renderer.closePath();
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.beginPath();
                renderer.moveTo(topL, y);
                renderer.lineTo(topR, y);
                renderer.lineTo(botR, y + h);
                renderer.lineTo(botL, y + h);
                renderer.closePath();
                renderer.stroke();
                // Horizontal section lines
                renderer.beginPath();
                renderer.moveTo(midL1, midY1);
                renderer.lineTo(midR1, midY1);
                renderer.stroke();
                renderer.beginPath();
                renderer.moveTo(midL2, midY2);
                renderer.lineTo(midR2, midY2);
                renderer.stroke();
                break;
            }
            case 'gauge': {
                // Semi-circle gauge with needle
                const ccx = x + w / 2, ccy = y + h * 0.85;
                const r = Math.min(w / 2, h * 0.8);

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.beginPath();
                    renderer.arc(ccx, ccy, r, Math.PI, 0);
                    renderer.closePath();
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                // Outer arc
                renderer.beginPath();
                renderer.arc(ccx, ccy, r, Math.PI, 0);
                renderer.stroke();
                // Inner arc
                const innerR = r * 0.75;
                renderer.beginPath();
                renderer.arc(ccx, ccy, innerR, Math.PI, 0);
                renderer.stroke();
                // Tick marks
                for (let i = 0; i <= 5; i++) {
                    const angle = Math.PI + (Math.PI * i) / 5;
                    renderer.beginPath();
                    renderer.moveTo(ccx + Math.cos(angle) * innerR, ccy + Math.sin(angle) * innerR);
                    renderer.lineTo(ccx + Math.cos(angle) * r, ccy + Math.sin(angle) * r);
                    renderer.stroke();
                }
                // Needle at ~70%
                const needleAngle = Math.PI + Math.PI * 0.7;
                const needleLen = r * 0.65;
                renderer.beginPath();
                renderer.moveTo(ccx, ccy);
                renderer.lineTo(ccx + Math.cos(needleAngle) * needleLen, ccy + Math.sin(needleAngle) * needleLen);
                renderer.lineWidth = Math.max(2, Math.min(w, h) * 0.03);
                renderer.stroke();
                // Center dot
                const dotR = Math.min(w, h) * 0.04;
                renderer.beginPath();
                renderer.arc(ccx, ccy, dotR, 0, Math.PI * 2);
                renderer.fillStyle = RenderPipeline.adjustColor(el.strokeColor || '#000000', isDarkMode);
                renderer.fill();
                break;
            }
            case 'quadrantChart': {
                const data = (el as any).quadrantData as QuadrantData | undefined;
                if (data) { this.renderQuadrantArchitectural(renderer, el, data, isDarkMode); return; }
                break;
            }
            case 'xyChart': {
                const data = (el as any).xyChartData as XYChartData | undefined;
                if (data) { this.renderXYChartArchitectural(renderer, el, data, isDarkMode); return; }
                break;
            }
            case 'ganttChart': {
                const tasks = (el as any).ganttTasks as GanttTask[] | undefined;
                if (tasks && tasks.length > 0) { this.renderGanttArchitectural(renderer, el, tasks, isDarkMode); return; }
                break;
            }
            case 'journeyDiagram': {
                const tasks = (el as any).journeyTasks as JourneyTask[] | undefined;
                if (tasks && tasks.length > 0) { this.renderJourneyArchitectural(renderer, el, tasks, isDarkMode); return; }
                break;
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    protected renderSketch(context: RenderContext, cx: number, cy: number): void {
        const { rc, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            case 'barChart': {
                const vals = (el as any).barValues as number[] | undefined;
                const heights = (vals && vals.length) ? (() => { const m = Math.max(...vals, 1e-6); return vals.map(v => Math.max(0, v) / m); })() : [0.5, 0.8, 0.35, 0.65];
                const barCount = heights.length;
                const gap = w * 0.08;
                const barW = (w - gap * (barCount + 1)) / barCount;
                const baseY = y + h;
                for (let i = 0; i < barCount; i++) {
                    const bx = x + gap + i * (barW + gap);
                    const bh = h * 0.85 * heights[i];
                    rc.rectangle(bx, baseY - bh, barW, bh, options);
                }
                // Axes
                rc.line(x + gap * 0.5, y + h * 0.05, x + gap * 0.5, baseY, { ...options, fill: 'none' });
                rc.line(x + gap * 0.5, baseY, x + w - gap * 0.5, baseY, { ...options, fill: 'none' });
                break;
            }
            case 'pieChart': {
                const pieSlices = (el as any).pieSlices as PieSlice[] | undefined;
                if (pieSlices && pieSlices.length > 0) {
                    this.renderDataPieSketch(context, pieSlices);
                    // Data-driven pie renders its own title + legend — skip base renderText
                    return;
                } else {
                    // Fallback: decorative pie
                    const ccx = x + w / 2, ccy = y + h / 2;
                    const r = Math.min(w, h) / 2;
                    rc.circle(ccx, ccy, r * 2, options);
                    const placeholderSlices = [0, 0.3, 0.55, 0.8];
                    for (const s of placeholderSlices) {
                        const angle = s * Math.PI * 2 - Math.PI / 2;
                        rc.line(ccx, ccy, ccx + Math.cos(angle) * r, ccy + Math.sin(angle) * r, { ...options, fill: 'none' });
                    }
                }
                break;
            }
            case 'trendUp': {
                const margin = w * 0.08;
                const baseY = y + h * 0.92;
                const pts: [number, number][] = [
                    [x + margin, y + h * 0.75],
                    [x + w * 0.3, y + h * 0.55],
                    [x + w * 0.55, y + h * 0.45],
                    [x + w * 0.8, y + h * 0.2]
                ];
                const arrowSize = Math.min(w, h) * 0.1;
                const lastPt = pts[pts.length - 1];
                const prevPt = pts[pts.length - 2];
                const angle = Math.atan2(lastPt[1] - prevPt[1], lastPt[0] - prevPt[0]);
                const tipX = lastPt[0] + Math.cos(angle) * arrowSize;
                const tipY = lastPt[1] + Math.sin(angle) * arrowSize;
                rc.linearPath([...pts, [tipX, tipY]], { ...options, fill: 'none' });
                // Arrowhead
                const a1 = angle + Math.PI * 0.82;
                const a2 = angle - Math.PI * 0.82;
                rc.polygon([
                    [tipX, tipY],
                    [tipX + Math.cos(a1) * arrowSize, tipY + Math.sin(a1) * arrowSize],
                    [tipX + Math.cos(a2) * arrowSize, tipY + Math.sin(a2) * arrowSize]
                ], options);
                // Data points
                const dotR = Math.min(w, h) * 0.025;
                for (const p of pts) rc.circle(p[0], p[1], dotR * 2, options);
                // Baseline
                rc.line(x + margin * 0.5, baseY, x + w - margin * 0.5, baseY, { ...options, fill: 'none' });
                break;
            }
            case 'trendDown': {
                const margin = w * 0.08;
                const baseY = y + h * 0.92;
                const pts: [number, number][] = [
                    [x + margin, y + h * 0.15],
                    [x + w * 0.3, y + h * 0.35],
                    [x + w * 0.55, y + h * 0.5],
                    [x + w * 0.8, y + h * 0.7]
                ];
                const arrowSize = Math.min(w, h) * 0.1;
                const lastPt = pts[pts.length - 1];
                const prevPt = pts[pts.length - 2];
                const angle = Math.atan2(lastPt[1] - prevPt[1], lastPt[0] - prevPt[0]);
                const tipX = lastPt[0] + Math.cos(angle) * arrowSize;
                const tipY = lastPt[1] + Math.sin(angle) * arrowSize;
                rc.linearPath([...pts, [tipX, tipY]], { ...options, fill: 'none' });
                // Arrowhead
                const a1 = angle + Math.PI * 0.82;
                const a2 = angle - Math.PI * 0.82;
                rc.polygon([
                    [tipX, tipY],
                    [tipX + Math.cos(a1) * arrowSize, tipY + Math.sin(a1) * arrowSize],
                    [tipX + Math.cos(a2) * arrowSize, tipY + Math.sin(a2) * arrowSize]
                ], options);
                // Data points
                const dotR = Math.min(w, h) * 0.025;
                for (const p of pts) rc.circle(p[0], p[1], dotR * 2, options);
                // Baseline
                rc.line(x + margin * 0.5, baseY, x + w - margin * 0.5, baseY, { ...options, fill: 'none' });
                break;
            }
            case 'funnel': {
                const topL = x, topR = x + w;
                const botL = x + w * 0.3, botR = x + w * 0.7;
                rc.polygon([
                    [topL, y], [topR, y], [botR, y + h], [botL, y + h]
                ], options);
                // Section lines
                const midY1 = y + h * 0.35;
                const midL1 = x + w * 0.1, midR1 = x + w * 0.9;
                const midY2 = y + h * 0.65;
                const midL2 = x + w * 0.22, midR2 = x + w * 0.78;
                rc.line(midL1, midY1, midR1, midY1, { ...options, fill: 'none' });
                rc.line(midL2, midY2, midR2, midY2, { ...options, fill: 'none' });
                break;
            }
            case 'gauge': {
                const ccx = x + w / 2, ccy = y + h * 0.85;
                const r = Math.min(w / 2, h * 0.8);
                const innerR = r * 0.75;
                rc.arc(ccx, ccy, r * 2, r * 2, Math.PI, 0, false, options);
                rc.arc(ccx, ccy, innerR * 2, innerR * 2, Math.PI, 0, false, { ...options, fill: 'none' });
                // Tick marks
                for (let i = 0; i <= 5; i++) {
                    const angle = Math.PI + (Math.PI * i) / 5;
                    rc.line(
                        ccx + Math.cos(angle) * innerR, ccy + Math.sin(angle) * innerR,
                        ccx + Math.cos(angle) * r, ccy + Math.sin(angle) * r,
                        { ...options, fill: 'none' }
                    );
                }
                // Needle
                const needleAngle = Math.PI + Math.PI * 0.7;
                const needleLen = r * 0.65;
                rc.line(ccx, ccy, ccx + Math.cos(needleAngle) * needleLen, ccy + Math.sin(needleAngle) * needleLen, { ...options, fill: 'none', strokeWidth: Math.max(2, Math.min(w, h) * 0.03) });
                // Center dot
                const dotR = Math.min(w, h) * 0.04;
                rc.circle(ccx, ccy, dotR * 2, { ...options });
                break;
            }
            case 'quadrantChart': {
                const data = (el as any).quadrantData as QuadrantData | undefined;
                if (data) { this.renderQuadrantSketch(context, data); return; }
                break;
            }
            case 'xyChart': {
                const data = (el as any).xyChartData as XYChartData | undefined;
                if (data) { this.renderXYChartSketch(context, data); return; }
                break;
            }
            case 'ganttChart': {
                const tasks = (el as any).ganttTasks as GanttTask[] | undefined;
                if (tasks && tasks.length > 0) { this.renderGanttSketch(context, tasks); return; }
                break;
            }
            case 'journeyDiagram': {
                const tasks = (el as any).journeyTasks as JourneyTask[] | undefined;
                if (tasks && tasks.length > 0) { this.renderJourneySketch(context, tasks); return; }
                break;
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    // ─── Data-Driven Pie Chart Rendering ──────────────────────────

    private renderDataPieArchitectural(
        renderer: IRenderer,
        el: DrawingElement,
        slices: PieSlice[],
        isDarkMode: boolean
    ): void {
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const total = slices.reduce((s, sl) => s + sl.value, 0);
        if (total === 0) return;

        // Layout: pie on the left, legend on the right
        const legendW = Math.min(w * 0.45, 160);
        const pieAreaW = w - legendW;
        // Round to integer pixels to prevent sub-pixel jitter during pan/zoom
        const pieR = Math.round(Math.min(pieAreaW, h) / 2 * 0.85);
        const pieCx = Math.round(x + pieAreaW / 2);
        const pieCy = Math.round(y + h / 2);

        // Draw title
        const titleText = el.containerText || el.text || '';
        if (titleText) {
            renderer.save();
            renderer.font = `bold ${Math.max(12, Math.min(16, h * 0.06))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? '#e5e7eb' : '#1f2937';
            renderer.textAlign = 'center';
            renderer.textBaseline = 'top';
            renderer.fillText(titleText, Math.round(x + w / 2), Math.round(y + 4));
            renderer.restore();
        }

        // Draw filled arc slices
        let startAngle = -Math.PI / 2; // start at 12 o'clock
        const strokeColor = RenderPipeline.adjustColor(el.strokeColor || '#374151', isDarkMode);

        for (const slice of slices) {
            const sweepAngle = (slice.value / total) * Math.PI * 2;
            const color = slice.color || '#94a3b8';

            // Fill arc
            renderer.beginPath();
            renderer.moveTo(pieCx, pieCy);
            renderer.arc(pieCx, pieCy, pieR, startAngle, startAngle + sweepAngle);
            renderer.closePath();
            renderer.fillStyle = isDarkMode ? this.adjustForDark(color) : color;
            renderer.fill();

            // Stroke arc
            renderer.strokeStyle = strokeColor;
            renderer.lineWidth = 1;
            renderer.stroke();

            startAngle += sweepAngle;
        }

        // Draw legend
        const legendX = Math.round(x + pieAreaW + 8);
        const legendFontSize = Math.max(10, Math.min(13, h * 0.045));
        const lineH = legendFontSize + 6;
        const legendStartY = Math.round(y + Math.max(24, h * 0.08));
        const swatchSize = Math.round(legendFontSize * 0.8);

        renderer.save();
        renderer.font = `${legendFontSize}px sans-serif`;
        renderer.textAlign = 'left';
        renderer.textBaseline = 'middle';

        for (let i = 0; i < slices.length; i++) {
            const ly = Math.round(legendStartY + i * lineH);
            const pct = ((slices[i].value / total) * 100).toFixed(1);
            const color = slices[i].color || '#94a3b8';

            // Color swatch
            renderer.fillStyle = isDarkMode ? this.adjustForDark(color) : color;
            renderer.fillRect(legendX, ly - swatchSize / 2, swatchSize, swatchSize);
            renderer.strokeStyle = strokeColor;
            renderer.lineWidth = 0.5;
            renderer.strokeRect(legendX, ly - swatchSize / 2, swatchSize, swatchSize);

            // Label text
            renderer.fillStyle = isDarkMode ? '#d1d5db' : '#374151';
            const label = `${slices[i].label} (${pct}%)`;
            renderer.fillText(label, legendX + swatchSize + 6, ly);
        }
        renderer.restore();
    }

    private renderDataPieSketch(
        context: RenderContext,
        slices: PieSlice[]
    ): void {
        const { rc, renderer, element: el, isDarkMode } = context;
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const total = slices.reduce((s, sl) => s + sl.value, 0);
        if (total === 0) return;

        const legendW = Math.min(w * 0.45, 160);
        const pieAreaW = w - legendW;
        // Round to integer pixels to prevent sub-pixel jitter during pan/zoom
        const pieR = Math.round(Math.min(pieAreaW, h) / 2 * 0.85);
        const pieCx = Math.round(x + pieAreaW / 2);
        const pieCy = Math.round(y + h / 2);
        const strokeColor = RenderPipeline.adjustColor(el.strokeColor || '#374151', isDarkMode);

        // Title
        const titleText = el.containerText || el.text || '';
        if (titleText) {
            renderer.save();
            renderer.font = `bold ${Math.max(12, Math.min(16, h * 0.06))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? '#e5e7eb' : '#1f2937';
            renderer.textAlign = 'center';
            renderer.textBaseline = 'top';
            renderer.fillText(titleText, Math.round(x + w / 2), Math.round(y + 4));
            renderer.restore();
        }

        // Draw filled arcs using rough-js
        let startAngle = -Math.PI / 2;
        for (const slice of slices) {
            const sweepAngle = (slice.value / total) * Math.PI * 2;
            const color = isDarkMode ? this.adjustForDark(slice.color || '#94a3b8') : (slice.color || '#94a3b8');
            rc.arc(pieCx, pieCy, pieR * 2, pieR * 2, startAngle, startAngle + sweepAngle, true, {
                fill: color,
                fillStyle: 'solid',
                stroke: strokeColor,
                strokeWidth: 1,
            });
            startAngle += sweepAngle;
        }

        // Legend (use native canvas for crisp text)
        const legendX = Math.round(x + pieAreaW + 8);
        const legendFontSize = Math.max(10, Math.min(13, h * 0.045));
        const lineH = legendFontSize + 6;
        const legendStartY = Math.round(y + Math.max(24, h * 0.08));
        const swatchSize = Math.round(legendFontSize * 0.8);

        renderer.save();
        renderer.font = `${legendFontSize}px sans-serif`;
        renderer.textAlign = 'left';
        renderer.textBaseline = 'middle';

        for (let i = 0; i < slices.length; i++) {
            const ly = Math.round(legendStartY + i * lineH);
            const pct = ((slices[i].value / total) * 100).toFixed(1);
            const color = isDarkMode ? this.adjustForDark(slices[i].color || '#94a3b8') : (slices[i].color || '#94a3b8');

            renderer.fillStyle = color;
            renderer.fillRect(legendX, ly - swatchSize / 2, swatchSize, swatchSize);
            renderer.strokeStyle = strokeColor;
            renderer.lineWidth = 0.5;
            renderer.strokeRect(legendX, ly - swatchSize / 2, swatchSize, swatchSize);

            renderer.fillStyle = isDarkMode ? '#d1d5db' : '#374151';
            renderer.fillText(`${slices[i].label} (${pct}%)`, legendX + swatchSize + 6, ly);
        }
        renderer.restore();
    }

    // ─── Data-Driven Quadrant Chart Rendering ──────────────────────

    private renderQuadrantArchitectural(
        renderer: IRenderer, el: DrawingElement, data: QuadrantData, isDarkMode: boolean
    ): void {
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const pad = { top: 28, right: 8, bottom: 22, left: 16 };
        const px = x + pad.left, py = y + pad.top;
        const pw = w - pad.left - pad.right, ph = h - pad.top - pad.bottom;
        const hw = pw / 2, hh = ph / 2;

        // Quadrant backgrounds (Q1=top-right, Q2=top-left, Q3=bottom-left, Q4=bottom-right)
        const qBg = isDarkMode
            ? ['#1a2e1a', '#1a1a2e', '#2e2a1a', '#2e1a1a']
            : ['#ecfdf5', '#eff6ff', '#fffbeb', '#fef2f2'];
        renderer.fillStyle = qBg[1]; renderer.fillRect(px, py, hw, hh);          // Q2 top-left
        renderer.fillStyle = qBg[0]; renderer.fillRect(px + hw, py, hw, hh);     // Q1 top-right
        renderer.fillStyle = qBg[2]; renderer.fillRect(px, py + hh, hw, hh);     // Q3 bottom-left
        renderer.fillStyle = qBg[3]; renderer.fillRect(px + hw, py + hh, hw, hh); // Q4 bottom-right

        // Cross divider
        renderer.strokeStyle = isDarkMode ? '#4b5563' : '#d1d5db';
        renderer.lineWidth = 1;
        renderer.beginPath();
        renderer.moveTo(px + hw, py); renderer.lineTo(px + hw, py + ph);
        renderer.moveTo(px, py + hh); renderer.lineTo(px + pw, py + hh);
        renderer.stroke();

        // Border
        renderer.strokeStyle = isDarkMode ? '#6b7280' : '#9ca3af';
        renderer.strokeRect(px, py, pw, ph);

        // Title
        const title = data.title || el.containerText || el.text || '';
        if (title) {
            renderer.save();
            renderer.font = `bold ${Math.max(11, Math.min(14, h * 0.035))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? '#e5e7eb' : '#1f2937';
            renderer.textAlign = 'center'; renderer.textBaseline = 'top';
            renderer.fillText(title, x + w / 2, y + 4);
            renderer.restore();
        }

        // Quadrant labels (centered in each quadrant, subtle)
        const qlFs = Math.max(8, Math.min(11, pw * 0.028));
        renderer.save();
        renderer.font = `${qlFs}px sans-serif`;
        renderer.fillStyle = isDarkMode ? '#6b7280' : '#9ca3af';
        renderer.textAlign = 'center'; renderer.textBaseline = 'middle';
        if (data.quadrantLabels[1]) renderer.fillText(data.quadrantLabels[1], px + hw * 0.5, py + hh * 0.5);
        if (data.quadrantLabels[0]) renderer.fillText(data.quadrantLabels[0], px + hw * 1.5, py + hh * 0.5);
        if (data.quadrantLabels[2]) renderer.fillText(data.quadrantLabels[2], px + hw * 0.5, py + hh * 1.5);
        if (data.quadrantLabels[3]) renderer.fillText(data.quadrantLabels[3], px + hw * 1.5, py + hh * 1.5);
        renderer.restore();

        // Axis labels
        const aFs = Math.max(8, Math.min(10, pw * 0.022));
        renderer.save();
        renderer.font = `${aFs}px sans-serif`;
        renderer.fillStyle = isDarkMode ? '#d1d5db' : '#374151';
        renderer.textBaseline = 'top';
        renderer.textAlign = 'left';
        renderer.fillText(data.xAxisLabel?.[0] || '', px, py + ph + 3);
        renderer.textAlign = 'right';
        renderer.fillText(data.xAxisLabel?.[1] || '', px + pw, py + ph + 3);
        renderer.restore();
        // Y-axis labels (vertical)
        renderer.save();
        renderer.font = `${aFs}px sans-serif`;
        renderer.fillStyle = isDarkMode ? '#d1d5db' : '#374151';
        renderer.save();
        renderer.translate(px - 3, py + ph); renderer.rotate(-Math.PI / 2);
        renderer.textAlign = 'left'; renderer.textBaseline = 'top';
        renderer.fillText(data.yAxisLabel?.[0] || '', 0, 0);
        renderer.restore();
        renderer.save();
        renderer.translate(px - 3, py); renderer.rotate(-Math.PI / 2);
        renderer.textAlign = 'right'; renderer.textBaseline = 'top';
        renderer.fillText(data.yAxisLabel?.[1] || '', 0, 0);
        renderer.restore();
        renderer.restore();

        // Data points
        const dotR = Math.max(4, Math.min(7, pw * 0.014));
        for (const pt of data.points) {
            const ptx = px + pt.x * pw, pty = py + (1 - pt.y) * ph;
            const color = pt.color || '#3b82f6';
            renderer.beginPath();
            renderer.arc(ptx, pty, dotR, 0, Math.PI * 2);
            renderer.fillStyle = isDarkMode ? this.adjustForDark(color) : color;
            renderer.fill();
            renderer.strokeStyle = isDarkMode ? '#1f2937' : '#ffffff';
            renderer.lineWidth = 1.5;
            renderer.stroke();
            // Point label
            renderer.save();
            renderer.font = `${Math.max(7, Math.min(9, pw * 0.02))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? '#d1d5db' : '#1f2937';
            renderer.textAlign = 'center'; renderer.textBaseline = 'bottom';
            renderer.fillText(pt.label, ptx, pty - dotR - 2);
            renderer.restore();
        }
    }

    private renderQuadrantSketch(context: RenderContext, data: QuadrantData): void {
        const { rc, renderer, element: el, isDarkMode } = context;
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const pad = { top: 28, right: 8, bottom: 22, left: 16 };
        const px = x + pad.left, py = y + pad.top;
        const pw = w - pad.left - pad.right, ph = h - pad.top - pad.bottom;
        const hw = pw / 2, hh = ph / 2;

        // Quadrant backgrounds
        const qBg = isDarkMode
            ? ['#1a2e1a', '#1a1a2e', '#2e2a1a', '#2e1a1a']
            : ['#ecfdf5', '#eff6ff', '#fffbeb', '#fef2f2'];
        const qStroke = isDarkMode ? '#374151' : '#e5e7eb';
        rc.rectangle(px, py, hw, hh, { fill: qBg[1], fillStyle: 'solid', stroke: qStroke, strokeWidth: 0.5 });
        rc.rectangle(px + hw, py, hw, hh, { fill: qBg[0], fillStyle: 'solid', stroke: qStroke, strokeWidth: 0.5 });
        rc.rectangle(px, py + hh, hw, hh, { fill: qBg[2], fillStyle: 'solid', stroke: qStroke, strokeWidth: 0.5 });
        rc.rectangle(px + hw, py + hh, hw, hh, { fill: qBg[3], fillStyle: 'solid', stroke: qStroke, strokeWidth: 0.5 });

        // Cross divider
        const divStroke = isDarkMode ? '#4b5563' : '#d1d5db';
        rc.line(px + hw, py, px + hw, py + ph, { stroke: divStroke, strokeWidth: 1 });
        rc.line(px, py + hh, px + pw, py + hh, { stroke: divStroke, strokeWidth: 1 });

        // Title
        const title = data.title || el.containerText || el.text || '';
        if (title) {
            renderer.save();
            renderer.font = `bold ${Math.max(11, Math.min(14, h * 0.035))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? '#e5e7eb' : '#1f2937';
            renderer.textAlign = 'center'; renderer.textBaseline = 'top';
            renderer.fillText(title, x + w / 2, y + 4);
            renderer.restore();
        }

        // Quadrant labels
        const qlFs = Math.max(8, Math.min(11, pw * 0.028));
        renderer.save();
        renderer.font = `${qlFs}px sans-serif`;
        renderer.fillStyle = isDarkMode ? '#6b7280' : '#9ca3af';
        renderer.textAlign = 'center'; renderer.textBaseline = 'middle';
        if (data.quadrantLabels[1]) renderer.fillText(data.quadrantLabels[1], px + hw * 0.5, py + hh * 0.5);
        if (data.quadrantLabels[0]) renderer.fillText(data.quadrantLabels[0], px + hw * 1.5, py + hh * 0.5);
        if (data.quadrantLabels[2]) renderer.fillText(data.quadrantLabels[2], px + hw * 0.5, py + hh * 1.5);
        if (data.quadrantLabels[3]) renderer.fillText(data.quadrantLabels[3], px + hw * 1.5, py + hh * 1.5);
        renderer.restore();

        // Axis labels
        const aFs = Math.max(8, Math.min(10, pw * 0.022));
        renderer.save();
        renderer.font = `${aFs}px sans-serif`;
        renderer.fillStyle = isDarkMode ? '#d1d5db' : '#374151';
        renderer.textBaseline = 'top';
        renderer.textAlign = 'left';
        renderer.fillText(data.xAxisLabel?.[0] || '', px, py + ph + 3);
        renderer.textAlign = 'right';
        renderer.fillText(data.xAxisLabel?.[1] || '', px + pw, py + ph + 3);
        renderer.restore();

        // Data points (rough circles)
        const dotR = Math.max(4, Math.min(7, pw * 0.014));
        for (const pt of data.points) {
            const ptx = px + pt.x * pw, pty = py + (1 - pt.y) * ph;
            const color = pt.color || '#3b82f6';
            rc.circle(ptx, pty, dotR * 2, {
                fill: isDarkMode ? this.adjustForDark(color) : color,
                fillStyle: 'solid',
                stroke: isDarkMode ? '#1f2937' : '#ffffff',
                strokeWidth: 1.5,
            });
            renderer.save();
            renderer.font = `${Math.max(7, Math.min(9, pw * 0.02))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? '#d1d5db' : '#1f2937';
            renderer.textAlign = 'center'; renderer.textBaseline = 'bottom';
            renderer.fillText(pt.label, ptx, pty - dotR - 2);
            renderer.restore();
        }
    }

    // ─── Data-Driven XY Chart Rendering ────────────────────────────

    private renderXYChartArchitectural(
        renderer: IRenderer, el: DrawingElement, data: XYChartData, isDarkMode: boolean
    ): void {
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const pad = { top: 30, right: 10, bottom: 28, left: 50 };
        const px = x + pad.left, py = y + pad.top;
        const pw = w - pad.left - pad.right, ph = h - pad.top - pad.bottom;

        // Data range
        const allVals: number[] = [];
        if (data.bars) allVals.push(...data.bars);
        if (data.lines) for (const l of data.lines) allVals.push(...l);
        const minVal = data.yAxis.min ?? Math.min(0, ...allVals);
        const maxVal = data.yAxis.max ?? Math.max(...allVals) * 1.1;
        const range = maxVal - minVal || 1;
        const categories = data.xAxis.labels || [];
        const catCount = Math.max(categories.length, data.bars?.length || 0, data.lines?.[0]?.length || 0, 1);

        // Background
        renderer.fillStyle = isDarkMode ? '#1a1a2e' : '#fafafa';
        renderer.fillRect(px, py, pw, ph);

        // Horizontal gridlines
        renderer.strokeStyle = isDarkMode ? '#374151' : '#e5e7eb';
        renderer.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const gy = py + (ph * i) / 4;
            renderer.beginPath(); renderer.moveTo(px, gy); renderer.lineTo(px + pw, gy); renderer.stroke();
        }

        // Title
        const title = data.title || el.containerText || el.text || '';
        if (title) {
            renderer.save();
            renderer.font = `bold ${Math.max(11, Math.min(14, h * 0.04))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? '#e5e7eb' : '#1f2937';
            renderer.textAlign = 'center'; renderer.textBaseline = 'top';
            renderer.fillText(title, x + w / 2, y + 4);
            renderer.restore();
        }

        // Y-axis tick labels
        renderer.save();
        renderer.font = `${Math.max(8, Math.min(10, h * 0.03))}px sans-serif`;
        renderer.fillStyle = isDarkMode ? '#d1d5db' : '#374151';
        renderer.textAlign = 'right'; renderer.textBaseline = 'middle';
        for (let i = 0; i <= 4; i++) {
            const val = maxVal - (range * i) / 4;
            renderer.fillText(val.toFixed(0), px - 4, py + (ph * i) / 4);
        }
        renderer.restore();

        // Bars
        if (data.bars && data.bars.length > 0) {
            const groupW = pw / catCount;
            const barW = groupW * 0.7;
            const barColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
            for (let i = 0; i < data.bars.length; i++) {
                const barH = ((data.bars[i] - minVal) / range) * ph;
                const bx = px + i * groupW + (groupW - barW) / 2;
                const by = py + ph - barH;
                const color = barColors[i % barColors.length];
                renderer.fillStyle = isDarkMode ? this.adjustForDark(color) : color;
                renderer.fillRect(bx, by, barW, barH);
                renderer.strokeStyle = isDarkMode ? '#4b5563' : '#9ca3af';
                renderer.lineWidth = 0.5;
                renderer.strokeRect(bx, by, barW, barH);
            }
        }

        // Line series
        if (data.lines && data.lines.length > 0) {
            const lineColors = ['#ef4444', '#22c55e', '#8b5cf6', '#f59e0b'];
            const groupW = pw / catCount;
            for (let li = 0; li < data.lines.length; li++) {
                const series = data.lines[li];
                const color = isDarkMode ? this.adjustForDark(lineColors[li % lineColors.length]) : lineColors[li % lineColors.length];
                renderer.strokeStyle = color;
                renderer.lineWidth = 2;
                renderer.beginPath();
                for (let i = 0; i < series.length; i++) {
                    const lx = px + i * groupW + groupW / 2;
                    const ly = py + ph - ((series[i] - minVal) / range) * ph;
                    if (i === 0) renderer.moveTo(lx, ly); else renderer.lineTo(lx, ly);
                }
                renderer.stroke();
                // Dots
                renderer.fillStyle = color;
                for (let i = 0; i < series.length; i++) {
                    const lx = px + i * groupW + groupW / 2;
                    const ly = py + ph - ((series[i] - minVal) / range) * ph;
                    renderer.beginPath(); renderer.arc(lx, ly, 3, 0, Math.PI * 2); renderer.fill();
                }
            }
        }

        // X-axis category labels
        if (categories.length > 0) {
            const groupW = pw / catCount;
            renderer.save();
            renderer.font = `${Math.max(8, Math.min(10, pw * 0.025))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? '#d1d5db' : '#374151';
            renderer.textAlign = 'center'; renderer.textBaseline = 'top';
            for (let i = 0; i < categories.length; i++) {
                renderer.fillText(categories[i], px + i * groupW + groupW / 2, py + ph + 4);
            }
            renderer.restore();
        }

        // Axes border
        renderer.strokeStyle = isDarkMode ? '#6b7280' : '#9ca3af';
        renderer.lineWidth = 1;
        renderer.beginPath();
        renderer.moveTo(px, py); renderer.lineTo(px, py + ph); renderer.lineTo(px + pw, py + ph);
        renderer.stroke();

        // Y-axis label
        if (data.yAxis.label) {
            renderer.save();
            renderer.translate(x + 10, y + h / 2);
            renderer.rotate(-Math.PI / 2);
            renderer.font = `${Math.max(8, Math.min(10, h * 0.03))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? '#9ca3af' : '#6b7280';
            renderer.textAlign = 'center'; renderer.textBaseline = 'middle';
            renderer.fillText(data.yAxis.label, 0, 0);
            renderer.restore();
        }
    }

    private renderXYChartSketch(context: RenderContext, data: XYChartData): void {
        const { rc, renderer, element: el, isDarkMode } = context;
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const pad = { top: 30, right: 10, bottom: 28, left: 50 };
        const px = x + pad.left, py = y + pad.top;
        const pw = w - pad.left - pad.right, ph = h - pad.top - pad.bottom;

        const allVals: number[] = [];
        if (data.bars) allVals.push(...data.bars);
        if (data.lines) for (const l of data.lines) allVals.push(...l);
        const minVal = data.yAxis.min ?? Math.min(0, ...allVals);
        const maxVal = data.yAxis.max ?? Math.max(...allVals) * 1.1;
        const range = maxVal - minVal || 1;
        const categories = data.xAxis.labels || [];
        const catCount = Math.max(categories.length, data.bars?.length || 0, data.lines?.[0]?.length || 0, 1);

        // Background
        rc.rectangle(px, py, pw, ph, {
            fill: isDarkMode ? '#1a1a2e' : '#fafafa', fillStyle: 'solid',
            stroke: isDarkMode ? '#6b7280' : '#9ca3af', strokeWidth: 1,
        });

        // Gridlines
        const gridStroke = isDarkMode ? '#374151' : '#e5e7eb';
        for (let i = 0; i <= 4; i++) {
            const gy = py + (ph * i) / 4;
            rc.line(px, gy, px + pw, gy, { stroke: gridStroke, strokeWidth: 0.5 });
        }

        // Title
        const title = data.title || el.containerText || el.text || '';
        if (title) {
            renderer.save();
            renderer.font = `bold ${Math.max(11, Math.min(14, h * 0.04))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? '#e5e7eb' : '#1f2937';
            renderer.textAlign = 'center'; renderer.textBaseline = 'top';
            renderer.fillText(title, x + w / 2, y + 4);
            renderer.restore();
        }

        // Y-axis ticks
        renderer.save();
        renderer.font = `${Math.max(8, Math.min(10, h * 0.03))}px sans-serif`;
        renderer.fillStyle = isDarkMode ? '#d1d5db' : '#374151';
        renderer.textAlign = 'right'; renderer.textBaseline = 'middle';
        for (let i = 0; i <= 4; i++) {
            const val = maxVal - (range * i) / 4;
            renderer.fillText(val.toFixed(0), px - 4, py + (ph * i) / 4);
        }
        renderer.restore();

        // Bars
        if (data.bars && data.bars.length > 0) {
            const groupW = pw / catCount;
            const barW = groupW * 0.7;
            const barColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
            for (let i = 0; i < data.bars.length; i++) {
                const barH = ((data.bars[i] - minVal) / range) * ph;
                const bx = px + i * groupW + (groupW - barW) / 2;
                const by = py + ph - barH;
                const color = barColors[i % barColors.length];
                rc.rectangle(bx, by, barW, barH, {
                    fill: isDarkMode ? this.adjustForDark(color) : color,
                    fillStyle: 'solid',
                    stroke: isDarkMode ? '#4b5563' : '#9ca3af',
                    strokeWidth: 0.5,
                });
            }
        }

        // Lines
        if (data.lines && data.lines.length > 0) {
            const lineColors = ['#ef4444', '#22c55e', '#8b5cf6', '#f59e0b'];
            const groupW = pw / catCount;
            for (let li = 0; li < data.lines.length; li++) {
                const series = data.lines[li];
                const color = isDarkMode ? this.adjustForDark(lineColors[li % lineColors.length]) : lineColors[li % lineColors.length];
                const pts: [number, number][] = series.map((v, i) => [
                    px + i * groupW + groupW / 2,
                    py + ph - ((v - minVal) / range) * ph,
                ]);
                rc.linearPath(pts, { stroke: color, strokeWidth: 2 });
                for (const p of pts) {
                    rc.circle(p[0], p[1], 6, { fill: color, fillStyle: 'solid', stroke: color, strokeWidth: 1 });
                }
            }
        }

        // X-axis labels
        if (categories.length > 0) {
            const groupW = pw / catCount;
            renderer.save();
            renderer.font = `${Math.max(8, Math.min(10, pw * 0.025))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? '#d1d5db' : '#374151';
            renderer.textAlign = 'center'; renderer.textBaseline = 'top';
            for (let i = 0; i < categories.length; i++) {
                renderer.fillText(categories[i], px + i * groupW + groupW / 2, py + ph + 4);
            }
            renderer.restore();
        }

        // Axes
        rc.line(px, py, px, py + ph, { stroke: isDarkMode ? '#6b7280' : '#9ca3af', strokeWidth: 1 });
        rc.line(px, py + ph, px + pw, py + ph, { stroke: isDarkMode ? '#6b7280' : '#9ca3af', strokeWidth: 1 });
    }

    // ─── Data-Driven Gantt Chart Rendering ─────────────────────────

    private renderGanttArchitectural(
        renderer: IRenderer, el: DrawingElement, tasks: GanttTask[], isDarkMode: boolean
    ): void {
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const titleH = 24;
        const headerH = 20;
        const labelW = Math.min(120, w * 0.22);
        const rowH = Math.max(18, Math.min(28, (h - titleH - headerH) / tasks.length));

        // Title
        const title = el.containerText || el.text || '';
        if (title) {
            renderer.save();
            renderer.font = `bold ${Math.max(11, Math.min(14, h * 0.04))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? '#e5e7eb' : '#1f2937';
            renderer.textAlign = 'center'; renderer.textBaseline = 'top';
            renderer.fillText(title, x + w / 2, y + 2);
            renderer.restore();
        }

        // Date range
        let earliest = tasks[0].startDate, latest = tasks[0].endDate;
        for (const t of tasks) {
            if (t.startDate < earliest) earliest = t.startDate;
            if (t.endDate > latest) latest = t.endDate;
        }
        const startMs = new Date(earliest).getTime();
        const endMs = new Date(latest).getTime();
        const spanMs = endMs - startMs || 1;
        const chartX = x + labelW;
        const chartW = w - labelW - 8;
        const chartY = y + titleH + headerH;

        // Timeline header
        renderer.save();
        renderer.font = `${Math.max(7, Math.min(9, w * 0.015))}px sans-serif`;
        renderer.fillStyle = isDarkMode ? '#9ca3af' : '#6b7280';
        renderer.textAlign = 'center'; renderer.textBaseline = 'bottom';
        const tickCount = Math.min(6, Math.max(2, Math.floor(chartW / 60)));
        for (let i = 0; i <= tickCount; i++) {
            const t = startMs + (spanMs * i) / tickCount;
            const tx = chartX + (chartW * i) / tickCount;
            const date = new Date(t);
            renderer.fillText(`${date.getMonth() + 1}/${date.getDate()}`, tx, chartY - 2);
            renderer.strokeStyle = isDarkMode ? '#374151' : '#e5e7eb';
            renderer.lineWidth = 0.5;
            renderer.beginPath(); renderer.moveTo(tx, chartY); renderer.lineTo(tx, chartY + tasks.length * rowH); renderer.stroke();
        }
        renderer.restore();

        // Section tracking
        let currentSection = '';

        // Task rows
        for (let i = 0; i < tasks.length; i++) {
            const t = tasks[i];
            const ry = chartY + i * rowH;

            // Section header row
            if (t.section !== currentSection) {
                currentSection = t.section;
                renderer.fillStyle = isDarkMode ? '#1f2937' : '#f3f4f6';
                renderer.fillRect(x, ry, w - 8, rowH);
            }

            // Alternating stripe
            if (i % 2 === 0) {
                renderer.fillStyle = isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)';
                renderer.fillRect(chartX, ry, chartW, rowH);
            }

            // Task label (clipped to label area)
            renderer.save();
            renderer.beginPath(); renderer.rect(x, ry, labelW, rowH); renderer.clip();
            renderer.font = `${Math.max(7, Math.min(10, rowH * 0.45))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? '#d1d5db' : '#374151';
            renderer.textAlign = 'right'; renderer.textBaseline = 'middle';
            renderer.fillText(t.label, x + labelW - 4, ry + rowH / 2);
            renderer.restore();

            // Task bar
            const barStart = ((new Date(t.startDate).getTime() - startMs) / spanMs) * chartW;
            const barEnd = ((new Date(t.endDate).getTime() - startMs) / spanMs) * chartW;
            const barW = Math.max(2, barEnd - barStart);
            const barH = rowH * 0.6;
            const barY = ry + (rowH - barH) / 2;
            const color = t.color || '#3b82f6';

            renderer.fillStyle = isDarkMode ? this.adjustForDark(color) : color;
            if (t.status === 'done') renderer.globalAlpha = 0.5;
            renderer.fillRect(chartX + barStart, barY, barW, barH);
            renderer.globalAlpha = 1;

            if (t.isCritical) {
                renderer.strokeStyle = isDarkMode ? '#fca5a5' : '#ef4444';
                renderer.lineWidth = 2;
            } else {
                renderer.strokeStyle = isDarkMode ? '#4b5563' : '#d1d5db';
                renderer.lineWidth = 0.5;
            }
            renderer.strokeRect(chartX + barStart, barY, barW, barH);
        }

        // Outer border
        renderer.strokeStyle = isDarkMode ? '#4b5563' : '#d1d5db';
        renderer.lineWidth = 1;
        renderer.strokeRect(x, y + titleH, w - 8, headerH + tasks.length * rowH);
    }

    private renderGanttSketch(context: RenderContext, tasks: GanttTask[]): void {
        const { rc, renderer, element: el, isDarkMode } = context;
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const titleH = 24;
        const headerH = 20;
        const labelW = Math.min(120, w * 0.22);
        const rowH = Math.max(18, Math.min(28, (h - titleH - headerH) / tasks.length));

        // Title
        const title = el.containerText || el.text || '';
        if (title) {
            renderer.save();
            renderer.font = `bold ${Math.max(11, Math.min(14, h * 0.04))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? '#e5e7eb' : '#1f2937';
            renderer.textAlign = 'center'; renderer.textBaseline = 'top';
            renderer.fillText(title, x + w / 2, y + 2);
            renderer.restore();
        }

        // Date range
        let earliest = tasks[0].startDate, latest = tasks[0].endDate;
        for (const t of tasks) {
            if (t.startDate < earliest) earliest = t.startDate;
            if (t.endDate > latest) latest = t.endDate;
        }
        const startMs = new Date(earliest).getTime();
        const endMs = new Date(latest).getTime();
        const spanMs = endMs - startMs || 1;
        const chartX = x + labelW;
        const chartW = w - labelW - 8;
        const chartY = y + titleH + headerH;

        // Timeline header
        renderer.save();
        renderer.font = `${Math.max(7, Math.min(9, w * 0.015))}px sans-serif`;
        renderer.fillStyle = isDarkMode ? '#9ca3af' : '#6b7280';
        renderer.textAlign = 'center'; renderer.textBaseline = 'bottom';
        const tickCount = Math.min(6, Math.max(2, Math.floor(chartW / 60)));
        for (let i = 0; i <= tickCount; i++) {
            const t = startMs + (spanMs * i) / tickCount;
            const tx = chartX + (chartW * i) / tickCount;
            const date = new Date(t);
            renderer.fillText(`${date.getMonth() + 1}/${date.getDate()}`, tx, chartY - 2);
            rc.line(tx, chartY, tx, chartY + tasks.length * rowH, { stroke: isDarkMode ? '#374151' : '#e5e7eb', strokeWidth: 0.5 });
        }
        renderer.restore();

        let currentSection = '';

        for (let i = 0; i < tasks.length; i++) {
            const t = tasks[i];
            const ry = chartY + i * rowH;

            if (t.section !== currentSection) {
                currentSection = t.section;
                rc.rectangle(x, ry, w - 8, rowH, {
                    fill: isDarkMode ? '#1f2937' : '#f3f4f6', fillStyle: 'solid',
                    stroke: 'transparent', strokeWidth: 0,
                });
            }

            // Task label
            renderer.save();
            renderer.beginPath(); renderer.rect(x, ry, labelW, rowH); renderer.clip();
            renderer.font = `${Math.max(7, Math.min(10, rowH * 0.45))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? '#d1d5db' : '#374151';
            renderer.textAlign = 'right'; renderer.textBaseline = 'middle';
            renderer.fillText(t.label, x + labelW - 4, ry + rowH / 2);
            renderer.restore();

            // Task bar
            const barStart = ((new Date(t.startDate).getTime() - startMs) / spanMs) * chartW;
            const barEnd = ((new Date(t.endDate).getTime() - startMs) / spanMs) * chartW;
            const barW = Math.max(2, barEnd - barStart);
            const barH = rowH * 0.6;
            const barY = ry + (rowH - barH) / 2;
            const color = t.color || '#3b82f6';
            const fillColor = isDarkMode ? this.adjustForDark(color) : color;

            rc.rectangle(chartX + barStart, barY, barW, barH, {
                fill: fillColor, fillStyle: 'solid',
                stroke: t.isCritical ? (isDarkMode ? '#fca5a5' : '#ef4444') : (isDarkMode ? '#4b5563' : '#d1d5db'),
                strokeWidth: t.isCritical ? 2 : 0.5,
            });
        }

        // Outer border
        rc.rectangle(x, y + titleH, w - 8, headerH + tasks.length * rowH, {
            stroke: isDarkMode ? '#4b5563' : '#d1d5db', strokeWidth: 1, fill: 'transparent',
        });
    }

    // ─── Data-Driven Journey Diagram Rendering ─────────────────────

    private renderJourneyArchitectural(
        renderer: IRenderer, el: DrawingElement, tasks: JourneyTask[], isDarkMode: boolean
    ): void {
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const titleH = 28;
        const legendH = 24;
        const chartX = x + 8;
        const chartW = w - 16;
        const chartY = y + titleH;
        const chartH = h - titleH - legendH;
        const colW = chartW / tasks.length;

        // Title
        const title = el.containerText || el.text || '';
        if (title) {
            renderer.save();
            renderer.font = `bold ${Math.max(11, Math.min(14, h * 0.04))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? '#e5e7eb' : '#1f2937';
            renderer.textAlign = 'center'; renderer.textBaseline = 'top';
            renderer.fillText(title, x + w / 2, y + 4);
            renderer.restore();
        }

        // Build section spans
        let currentSection = '';
        let sectionStart = 0;
        const sections: Array<{ name: string; start: number; end: number; color: string }> = [];
        for (let i = 0; i <= tasks.length; i++) {
            const sec = i < tasks.length ? tasks[i].section : '';
            if (sec !== currentSection || i === tasks.length) {
                if (currentSection && i > sectionStart) {
                    sections.push({ name: currentSection, start: sectionStart, end: i, color: tasks[sectionStart].color || '#3b82f6' });
                }
                currentSection = sec;
                sectionStart = i;
            }
        }

        // Section backgrounds
        for (const sec of sections) {
            const sx = chartX + sec.start * colW;
            const sw = (sec.end - sec.start) * colW;
            renderer.fillStyle = isDarkMode ? `${sec.color}15` : `${sec.color}18`;
            renderer.fillRect(sx, chartY, sw, chartH);
            renderer.save();
            renderer.font = `bold ${Math.max(7, Math.min(9, colW * 0.14))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? this.adjustForDark(sec.color) : sec.color;
            renderer.textAlign = 'left'; renderer.textBaseline = 'top';
            renderer.fillText(sec.name, sx + 2, chartY + 2);
            renderer.restore();
        }

        // Score area
        const scoreAreaTop = chartY + 20;
        const scoreAreaH = chartH - 50;

        // Score gridlines
        renderer.strokeStyle = isDarkMode ? '#374151' : '#e5e7eb';
        renderer.lineWidth = 0.5;
        for (let s = 1; s <= 5; s++) {
            const sy = scoreAreaTop + scoreAreaH - ((s - 1) / 4) * scoreAreaH;
            renderer.beginPath(); renderer.moveTo(chartX, sy); renderer.lineTo(chartX + chartW, sy); renderer.stroke();
        }

        // Score labels
        renderer.save();
        renderer.font = `${Math.max(7, Math.min(9, chartH * 0.035))}px sans-serif`;
        renderer.fillStyle = isDarkMode ? '#9ca3af' : '#6b7280';
        renderer.textAlign = 'right'; renderer.textBaseline = 'middle';
        for (let s = 1; s <= 5; s++) {
            renderer.fillText(`${s}`, chartX - 3, scoreAreaTop + scoreAreaH - ((s - 1) / 4) * scoreAreaH);
        }
        renderer.restore();

        // Score color helper
        const scoreColor = (score: number): string => {
            if (score <= 1) return '#ef4444';
            if (score <= 2) return '#f97316';
            if (score <= 3) return '#f59e0b';
            if (score <= 4) return '#22c55e';
            return '#10b981';
        };

        // Connecting line
        renderer.beginPath();
        renderer.strokeStyle = isDarkMode ? '#6b7280' : '#9ca3af';
        renderer.lineWidth = 1.5;
        for (let i = 0; i < tasks.length; i++) {
            const tx = chartX + i * colW + colW / 2;
            const ty = scoreAreaTop + scoreAreaH - ((tasks[i].score - 1) / 4) * scoreAreaH;
            if (i === 0) renderer.moveTo(tx, ty); else renderer.lineTo(tx, ty);
        }
        renderer.stroke();

        // Score dots
        const dotR = Math.max(4, Math.min(6, colW * 0.08));
        for (let i = 0; i < tasks.length; i++) {
            const tx = chartX + i * colW + colW / 2;
            const ty = scoreAreaTop + scoreAreaH - ((tasks[i].score - 1) / 4) * scoreAreaH;
            const color = scoreColor(tasks[i].score);
            renderer.beginPath();
            renderer.arc(tx, ty, dotR, 0, Math.PI * 2);
            renderer.fillStyle = isDarkMode ? this.adjustForDark(color) : color;
            renderer.fill();
            renderer.strokeStyle = isDarkMode ? '#1f2937' : '#ffffff';
            renderer.lineWidth = 1.5;
            renderer.stroke();
        }

        // Task labels
        renderer.save();
        renderer.font = `${Math.max(7, Math.min(9, colW * 0.14))}px sans-serif`;
        renderer.fillStyle = isDarkMode ? '#d1d5db' : '#374151';
        renderer.textAlign = 'center'; renderer.textBaseline = 'top';
        for (let i = 0; i < tasks.length; i++) {
            renderer.fillText(tasks[i].label, chartX + i * colW + colW / 2, chartY + chartH - 16, colW - 4);
        }
        renderer.restore();

        // Actor legend
        const allActors = new Set<string>();
        for (const t of tasks) for (const a of t.actors) allActors.add(a);
        if (allActors.size > 0) {
            renderer.save();
            renderer.font = `${Math.max(7, Math.min(9, h * 0.025))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? '#9ca3af' : '#6b7280';
            renderer.textAlign = 'center'; renderer.textBaseline = 'bottom';
            renderer.fillText(`Actors: ${[...allActors].join(', ')}`, x + w / 2, y + h - 2);
            renderer.restore();
        }
    }

    private renderJourneySketch(context: RenderContext, tasks: JourneyTask[]): void {
        const { rc, renderer, element: el, isDarkMode } = context;
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const titleH = 28;
        const legendH = 24;
        const chartX = x + 8;
        const chartW = w - 16;
        const chartY = y + titleH;
        const chartH = h - titleH - legendH;
        const colW = chartW / tasks.length;

        // Title
        const title = el.containerText || el.text || '';
        if (title) {
            renderer.save();
            renderer.font = `bold ${Math.max(11, Math.min(14, h * 0.04))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? '#e5e7eb' : '#1f2937';
            renderer.textAlign = 'center'; renderer.textBaseline = 'top';
            renderer.fillText(title, x + w / 2, y + 4);
            renderer.restore();
        }

        // Section backgrounds
        let currentSection = '';
        let sectionStart = 0;
        const sections: Array<{ name: string; start: number; end: number; color: string }> = [];
        for (let i = 0; i <= tasks.length; i++) {
            const sec = i < tasks.length ? tasks[i].section : '';
            if (sec !== currentSection || i === tasks.length) {
                if (currentSection && i > sectionStart) {
                    sections.push({ name: currentSection, start: sectionStart, end: i, color: tasks[sectionStart].color || '#3b82f6' });
                }
                currentSection = sec;
                sectionStart = i;
            }
        }

        for (const sec of sections) {
            const sx = chartX + sec.start * colW;
            const sw = (sec.end - sec.start) * colW;
            rc.rectangle(sx, chartY, sw, chartH, {
                fill: isDarkMode ? `${sec.color}15` : `${sec.color}18`,
                fillStyle: 'solid', stroke: 'transparent', strokeWidth: 0,
            });
            renderer.save();
            renderer.font = `bold ${Math.max(7, Math.min(9, colW * 0.14))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? this.adjustForDark(sec.color) : sec.color;
            renderer.textAlign = 'left'; renderer.textBaseline = 'top';
            renderer.fillText(sec.name, sx + 2, chartY + 2);
            renderer.restore();
        }

        // Score area
        const scoreAreaTop = chartY + 20;
        const scoreAreaH = chartH - 50;

        // Gridlines
        const gridStroke = isDarkMode ? '#374151' : '#e5e7eb';
        for (let s = 1; s <= 5; s++) {
            const sy = scoreAreaTop + scoreAreaH - ((s - 1) / 4) * scoreAreaH;
            rc.line(chartX, sy, chartX + chartW, sy, { stroke: gridStroke, strokeWidth: 0.5 });
        }

        // Score labels
        renderer.save();
        renderer.font = `${Math.max(7, Math.min(9, chartH * 0.035))}px sans-serif`;
        renderer.fillStyle = isDarkMode ? '#9ca3af' : '#6b7280';
        renderer.textAlign = 'right'; renderer.textBaseline = 'middle';
        for (let s = 1; s <= 5; s++) {
            renderer.fillText(`${s}`, chartX - 3, scoreAreaTop + scoreAreaH - ((s - 1) / 4) * scoreAreaH);
        }
        renderer.restore();

        const scoreColor = (score: number): string => {
            if (score <= 1) return '#ef4444';
            if (score <= 2) return '#f97316';
            if (score <= 3) return '#f59e0b';
            if (score <= 4) return '#22c55e';
            return '#10b981';
        };

        // Connecting line
        const linePts: [number, number][] = tasks.map((t, i) => [
            chartX + i * colW + colW / 2,
            scoreAreaTop + scoreAreaH - ((t.score - 1) / 4) * scoreAreaH,
        ]);
        rc.linearPath(linePts, { stroke: isDarkMode ? '#6b7280' : '#9ca3af', strokeWidth: 1.5 });

        // Score dots
        const dotR = Math.max(4, Math.min(6, colW * 0.08));
        for (let i = 0; i < tasks.length; i++) {
            const color = scoreColor(tasks[i].score);
            rc.circle(linePts[i][0], linePts[i][1], dotR * 2, {
                fill: isDarkMode ? this.adjustForDark(color) : color,
                fillStyle: 'solid',
                stroke: isDarkMode ? '#1f2937' : '#ffffff',
                strokeWidth: 1.5,
            });
        }

        // Task labels
        renderer.save();
        renderer.font = `${Math.max(7, Math.min(9, colW * 0.14))}px sans-serif`;
        renderer.fillStyle = isDarkMode ? '#d1d5db' : '#374151';
        renderer.textAlign = 'center'; renderer.textBaseline = 'top';
        for (let i = 0; i < tasks.length; i++) {
            renderer.fillText(tasks[i].label, chartX + i * colW + colW / 2, chartY + chartH - 16, colW - 4);
        }
        renderer.restore();

        // Actor legend
        const allActors = new Set<string>();
        for (const t of tasks) for (const a of t.actors) allActors.add(a);
        if (allActors.size > 0) {
            renderer.save();
            renderer.font = `${Math.max(7, Math.min(9, h * 0.025))}px sans-serif`;
            renderer.fillStyle = isDarkMode ? '#9ca3af' : '#6b7280';
            renderer.textAlign = 'center'; renderer.textBaseline = 'bottom';
            renderer.fillText(`Actors: ${[...allActors].join(', ')}`, x + w / 2, y + h - 2);
            renderer.restore();
        }
    }

    /** Lighten a hex color for dark mode readability. */
    private adjustForDark(hex: string): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        // Boost brightness by ~20%
        const boost = (v: number) => Math.min(255, Math.round(v + (255 - v) * 0.2));
        return `#${boost(r).toString(16).padStart(2, '0')}${boost(g).toString(16).padStart(2, '0')}${boost(b).toString(16).padStart(2, '0')}`;
    }

    protected definePath(renderer: IRenderer, el: any): void {
        const geometry = getShapeGeometry(el);
        if (!geometry) return;
        renderer.translate(el.x + el.width / 2, el.y + el.height / 2);
        RenderPipeline.renderGeometry(renderer, geometry);
    }
}
