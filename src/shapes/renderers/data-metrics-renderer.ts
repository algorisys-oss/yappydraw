import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import { getShapeGeometry } from "../../utils/shape-geometry";
import type { RenderContext } from "../base/types";

export class DataMetricsRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { ctx, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            case 'barChart': {
                // 4 vertical bars of different heights
                const barCount = 4;
                const gap = w * 0.08;
                const barW = (w - gap * (barCount + 1)) / barCount;
                const heights = [0.5, 0.8, 0.35, 0.65];
                const baseY = y + h;

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    for (let i = 0; i < barCount; i++) {
                        const bx = x + gap + i * (barW + gap);
                        const bh = h * 0.85 * heights[i];
                        ctx.fillRect(bx, baseY - bh, barW, bh);
                    }
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                for (let i = 0; i < barCount; i++) {
                    const bx = x + gap + i * (barW + gap);
                    const bh = h * 0.85 * heights[i];
                    ctx.strokeRect(bx, baseY - bh, barW, bh);
                }
                // Axes
                ctx.beginPath();
                ctx.moveTo(x + gap * 0.5, y + h * 0.05);
                ctx.lineTo(x + gap * 0.5, baseY);
                ctx.lineTo(x + w - gap * 0.5, baseY);
                ctx.stroke();
                break;
            }
            case 'pieChart': {
                // Pie chart with 4 slices
                const ccx = x + w / 2, ccy = y + h / 2;
                const r = Math.min(w, h) / 2;
                const slices = [0, 0.3, 0.55, 0.8]; // start fractions

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.beginPath();
                    ctx.ellipse(ccx, ccy, r, r, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.beginPath();
                ctx.ellipse(ccx, ccy, r, r, 0, 0, Math.PI * 2);
                ctx.stroke();
                // Slice dividers
                for (const s of slices) {
                    const angle = s * Math.PI * 2 - Math.PI / 2;
                    ctx.beginPath();
                    ctx.moveTo(ccx, ccy);
                    ctx.lineTo(ccx + Math.cos(angle) * r, ccy + Math.sin(angle) * r);
                    ctx.stroke();
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
                    ctx.fillStyle = options.fill;
                    ctx.beginPath();
                    ctx.moveTo(pts[0].px, baseY);
                    for (const p of pts) ctx.lineTo(p.px, p.py);
                    ctx.lineTo(lastPt.px, baseY);
                    ctx.closePath();
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                // Trend line
                ctx.beginPath();
                ctx.moveTo(pts[0].px, pts[0].py);
                for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].px, pts[i].py);
                ctx.lineTo(tipX, tipY);
                ctx.stroke();
                // Arrowhead
                const a1 = angle + Math.PI * 0.82;
                const a2 = angle - Math.PI * 0.82;
                ctx.beginPath();
                ctx.moveTo(tipX, tipY);
                ctx.lineTo(tipX + Math.cos(a1) * arrowSize, tipY + Math.sin(a1) * arrowSize);
                ctx.lineTo(tipX + Math.cos(a2) * arrowSize, tipY + Math.sin(a2) * arrowSize);
                ctx.closePath();
                ctx.fillStyle = RenderPipeline.adjustColor(el.strokeColor || '#000000', isDarkMode);
                ctx.fill();
                // Data points
                for (const p of pts) {
                    ctx.beginPath();
                    ctx.arc(p.px, p.py, Math.min(w, h) * 0.025, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Baseline axis
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.beginPath();
                ctx.moveTo(x + margin * 0.5, baseY);
                ctx.lineTo(x + w - margin * 0.5, baseY);
                ctx.stroke();
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
                    ctx.fillStyle = options.fill;
                    ctx.beginPath();
                    ctx.moveTo(pts[0].px, baseY);
                    for (const p of pts) ctx.lineTo(p.px, p.py);
                    ctx.lineTo(lastPt.px, baseY);
                    ctx.closePath();
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                // Trend line
                ctx.beginPath();
                ctx.moveTo(pts[0].px, pts[0].py);
                for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].px, pts[i].py);
                ctx.lineTo(tipX, tipY);
                ctx.stroke();
                // Arrowhead
                const a1 = angle + Math.PI * 0.82;
                const a2 = angle - Math.PI * 0.82;
                ctx.beginPath();
                ctx.moveTo(tipX, tipY);
                ctx.lineTo(tipX + Math.cos(a1) * arrowSize, tipY + Math.sin(a1) * arrowSize);
                ctx.lineTo(tipX + Math.cos(a2) * arrowSize, tipY + Math.sin(a2) * arrowSize);
                ctx.closePath();
                ctx.fillStyle = RenderPipeline.adjustColor(el.strokeColor || '#000000', isDarkMode);
                ctx.fill();
                // Data points
                for (const p of pts) {
                    ctx.beginPath();
                    ctx.arc(p.px, p.py, Math.min(w, h) * 0.025, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Baseline axis
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.beginPath();
                ctx.moveTo(x + margin * 0.5, baseY);
                ctx.lineTo(x + w - margin * 0.5, baseY);
                ctx.stroke();
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
                    ctx.fillStyle = options.fill;
                    ctx.beginPath();
                    ctx.moveTo(topL, y);
                    ctx.lineTo(topR, y);
                    ctx.lineTo(botR, y + h);
                    ctx.lineTo(botL, y + h);
                    ctx.closePath();
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.beginPath();
                ctx.moveTo(topL, y);
                ctx.lineTo(topR, y);
                ctx.lineTo(botR, y + h);
                ctx.lineTo(botL, y + h);
                ctx.closePath();
                ctx.stroke();
                // Horizontal section lines
                ctx.beginPath();
                ctx.moveTo(midL1, midY1);
                ctx.lineTo(midR1, midY1);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(midL2, midY2);
                ctx.lineTo(midR2, midY2);
                ctx.stroke();
                break;
            }
            case 'gauge': {
                // Semi-circle gauge with needle
                const ccx = x + w / 2, ccy = y + h * 0.85;
                const r = Math.min(w / 2, h * 0.8);

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.beginPath();
                    ctx.arc(ccx, ccy, r, Math.PI, 0);
                    ctx.closePath();
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                // Outer arc
                ctx.beginPath();
                ctx.arc(ccx, ccy, r, Math.PI, 0);
                ctx.stroke();
                // Inner arc
                const innerR = r * 0.75;
                ctx.beginPath();
                ctx.arc(ccx, ccy, innerR, Math.PI, 0);
                ctx.stroke();
                // Tick marks
                for (let i = 0; i <= 5; i++) {
                    const angle = Math.PI + (Math.PI * i) / 5;
                    ctx.beginPath();
                    ctx.moveTo(ccx + Math.cos(angle) * innerR, ccy + Math.sin(angle) * innerR);
                    ctx.lineTo(ccx + Math.cos(angle) * r, ccy + Math.sin(angle) * r);
                    ctx.stroke();
                }
                // Needle at ~70%
                const needleAngle = Math.PI + Math.PI * 0.7;
                const needleLen = r * 0.65;
                ctx.beginPath();
                ctx.moveTo(ccx, ccy);
                ctx.lineTo(ccx + Math.cos(needleAngle) * needleLen, ccy + Math.sin(needleAngle) * needleLen);
                ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.03);
                ctx.stroke();
                // Center dot
                const dotR = Math.min(w, h) * 0.04;
                ctx.beginPath();
                ctx.arc(ccx, ccy, dotR, 0, Math.PI * 2);
                ctx.fillStyle = RenderPipeline.adjustColor(el.strokeColor || '#000000', isDarkMode);
                ctx.fill();
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
                const barCount = 4;
                const gap = w * 0.08;
                const barW = (w - gap * (barCount + 1)) / barCount;
                const heights = [0.5, 0.8, 0.35, 0.65];
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
                const ccx = x + w / 2, ccy = y + h / 2;
                const r = Math.min(w, h) / 2;
                rc.circle(ccx, ccy, r * 2, options);
                const slices = [0, 0.3, 0.55, 0.8];
                for (const s of slices) {
                    const angle = s * Math.PI * 2 - Math.PI / 2;
                    rc.line(ccx, ccy, ccx + Math.cos(angle) * r, ccy + Math.sin(angle) * r, { ...options, fill: 'none' });
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
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        const geometry = getShapeGeometry(el);
        if (!geometry) return;
        ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
        RenderPipeline.renderGeometry(ctx, geometry);
    }
}
