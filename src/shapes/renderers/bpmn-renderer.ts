import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import { getShapeGeometry } from "../../utils/shape-geometry";
import type { RenderContext } from "../base/types";
import type { DrawingElement } from "../../types";

export class BpmnRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { ctx, element: el, isDarkMode } = context;
        const backgroundColor = el.backgroundColor === 'transparent' ? undefined : RenderPipeline.adjustColor(el.backgroundColor, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            // ── Events ──
            case 'bpmnStartEvent': {
                const r = Math.min(w, h) / 2;
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                this.applyNonInterruptingDash(ctx, el);
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                this.renderEventIcon(ctx, el, cx, cy, r * 0.55, isDarkMode);
                break;
            }

            case 'bpmnEndEvent': {
                const r = Math.min(w, h) / 2;
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                const savedWidth = ctx.lineWidth;
                ctx.lineWidth = Math.max(savedWidth * 3, 3);
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.stroke();
                ctx.lineWidth = savedWidth;
                this.renderEventIcon(ctx, el, cx, cy, r * 0.5, isDarkMode);
                break;
            }

            case 'bpmnIntermediateEvent': {
                const outerR = Math.min(w, h) / 2;
                const innerR = outerR * 0.82;
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.beginPath();
                    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                this.applyNonInterruptingDash(ctx, el);
                ctx.beginPath();
                ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                this.renderEventIcon(ctx, el, cx, cy, innerR * 0.55, isDarkMode);
                break;
            }

            // ── Gateways ──
            case 'bpmnExclusiveGateway':
            case 'bpmnParallelGateway':
            case 'bpmnInclusiveGateway':
            case 'bpmnEventGateway': {
                const hw = w / 2, hh = h / 2;
                ctx.beginPath();
                ctx.moveTo(cx, cy - hh);
                ctx.lineTo(cx + hw, cy);
                ctx.lineTo(cx, cy + hh);
                ctx.lineTo(cx - hw, cy);
                ctx.closePath();
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke();
                this.renderGatewayMarker(ctx, el, cx, cy, Math.min(hw, hh) * 0.55, isDarkMode);
                break;
            }

            // ── Activities ──
            case 'bpmnTask':
            case 'bpmnSubProcess':
            case 'bpmnCallActivity': {
                const radius = Math.min(w, h) * 0.1;
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    this.roundRect(ctx, x, y, w, h, radius);
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                if (el.type === 'bpmnCallActivity') {
                    const savedLw = ctx.lineWidth;
                    ctx.lineWidth = Math.max(savedLw * 2.5, 3);
                    this.roundRect(ctx, x, y, w, h, radius);
                    ctx.stroke();
                    ctx.lineWidth = savedLw;
                } else {
                    this.roundRect(ctx, x, y, w, h, radius);
                    ctx.stroke();
                }
                this.renderTaskMarker(ctx, el, isDarkMode);
                this.renderLoopMarker(ctx, el, isDarkMode);
                if (el.type === 'bpmnSubProcess') {
                    this.renderSubProcessMarker(ctx, el, isDarkMode);
                }
                break;
            }

            // ── Artifacts ──
            case 'bpmnDataObject': {
                const fold = Math.min(w, h) * 0.18;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + w - fold, y);
                ctx.lineTo(x + w, y + fold);
                ctx.lineTo(x + w, y + h);
                ctx.lineTo(x, y + h);
                ctx.closePath();
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + w - fold, y);
                ctx.lineTo(x + w - fold, y + fold);
                ctx.lineTo(x + w, y + fold);
                ctx.stroke();
                break;
            }

            case 'bpmnAnnotation': {
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(x, y, w, h);
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                const bracketW = Math.min(w * 0.12, 15);
                ctx.beginPath();
                ctx.moveTo(x + bracketW, y);
                ctx.lineTo(x, y);
                ctx.lineTo(x, y + h);
                ctx.lineTo(x + bracketW, y + h);
                ctx.stroke();
                break;
            }

            case 'bpmnPool': {
                this.renderPoolArchitectural(ctx, el, cx, cy, isDarkMode, backgroundColor);
                return; // Pool handles its own text
            }

            case 'bpmnDataStore': {
                // Cylinder shape (like database)
                const ellipseH = Math.min(h * 0.18, 20);
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.beginPath();
                    ctx.ellipse(cx, y + ellipseH, w / 2, ellipseH, 0, Math.PI, 0);
                    ctx.lineTo(x + w, y + h - ellipseH);
                    ctx.ellipse(cx, y + h - ellipseH, w / 2, ellipseH, 0, 0, Math.PI);
                    ctx.closePath();
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                // Top ellipse
                ctx.beginPath();
                ctx.ellipse(cx, y + ellipseH, w / 2, ellipseH, 0, 0, Math.PI * 2);
                ctx.stroke();
                // Body sides
                ctx.beginPath();
                ctx.moveTo(x, y + ellipseH);
                ctx.lineTo(x, y + h - ellipseH);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + w, y + ellipseH);
                ctx.lineTo(x + w, y + h - ellipseH);
                ctx.stroke();
                // Bottom ellipse
                ctx.beginPath();
                ctx.ellipse(cx, y + h - ellipseH, w / 2, ellipseH, 0, 0, Math.PI);
                ctx.stroke();
                break;
            }

            case 'bpmnGroup': {
                // Dashed rounded rectangle
                const radius = Math.min(w, h) * 0.08;
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    this.roundRect(ctx, x, y, w, h, radius);
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.setLineDash([8, 4]);
                this.roundRect(ctx, x, y, w, h, radius);
                ctx.stroke();
                ctx.setLineDash([]);
                break;
            }
        }

        // Text for non-pool shapes (pool returns early from its case branch above)
        RenderPipeline.renderText(context, cx, cy);
    }

    protected renderSketch(context: RenderContext, cx: number, cy: number): void {
        const { rc, ctx, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            // ── Events ──
            case 'bpmnStartEvent': {
                const r = Math.min(w, h) / 2;
                const eventOpts = el.bpmnNonInterrupting ? { ...options, strokeLineDash: [6, 4] } : options;
                rc.circle(cx, cy, r * 2, eventOpts);
                this.renderEventIcon(ctx, el, cx, cy, r * 0.55, isDarkMode);
                break;
            }

            case 'bpmnEndEvent': {
                const r = Math.min(w, h) / 2;
                const thickOptions = { ...options, strokeWidth: Math.max((el.strokeWidth || 2) * 3, 3) };
                rc.circle(cx, cy, r * 2, thickOptions);
                this.renderEventIcon(ctx, el, cx, cy, r * 0.5, isDarkMode);
                break;
            }

            case 'bpmnIntermediateEvent': {
                const outerR = Math.min(w, h) / 2;
                const innerR = outerR * 0.82;
                const eventOpts = el.bpmnNonInterrupting ? { ...options, strokeLineDash: [6, 4] } : options;
                rc.circle(cx, cy, outerR * 2, eventOpts);
                rc.circle(cx, cy, innerR * 2, { ...eventOpts, fill: 'none' });
                this.renderEventIcon(ctx, el, cx, cy, innerR * 0.55, isDarkMode);
                break;
            }

            // ── Gateways ──
            case 'bpmnExclusiveGateway':
            case 'bpmnParallelGateway':
            case 'bpmnInclusiveGateway':
            case 'bpmnEventGateway': {
                const hw = w / 2, hh = h / 2;
                const diamondPath = `M ${cx} ${cy - hh} L ${cx + hw} ${cy} L ${cx} ${cy + hh} L ${cx - hw} ${cy} Z`;
                rc.path(diamondPath, options);
                this.renderGatewayMarker(ctx, el, cx, cy, Math.min(hw, hh) * 0.55, isDarkMode);
                break;
            }

            // ── Activities ──
            case 'bpmnTask':
            case 'bpmnSubProcess':
            case 'bpmnCallActivity': {
                const radius = Math.min(w, h) * 0.1;
                if (el.type === 'bpmnCallActivity') {
                    const thickOptions = { ...options, strokeWidth: Math.max((el.strokeWidth || 2) * 2.5, 3) };
                    rc.path(this.getRoundRectPath(x, y, w, h, radius), thickOptions);
                } else {
                    rc.path(this.getRoundRectPath(x, y, w, h, radius), options);
                }
                this.renderTaskMarker(ctx, el, isDarkMode);
                this.renderLoopMarker(ctx, el, isDarkMode);
                if (el.type === 'bpmnSubProcess') {
                    this.renderSubProcessMarker(ctx, el, isDarkMode);
                }
                break;
            }

            // ── Artifacts ──
            case 'bpmnDataObject': {
                const fold = Math.min(w, h) * 0.18;
                const pagePath = `M ${x} ${y} L ${x + w - fold} ${y} L ${x + w} ${y + fold} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
                rc.path(pagePath, options);
                const foldPath = `M ${x + w - fold} ${y} L ${x + w - fold} ${y + fold} L ${x + w} ${y + fold}`;
                rc.path(foldPath, { ...options, fill: 'none' });
                break;
            }

            case 'bpmnAnnotation': {
                if (options.fill && options.fill !== 'none') {
                    rc.rectangle(x, y, w, h, { ...options, stroke: 'none' });
                }
                const bracketW = Math.min(w * 0.12, 15);
                const bracketPath = `M ${x + bracketW} ${y} L ${x} ${y} L ${x} ${y + h} L ${x + bracketW} ${y + h}`;
                rc.path(bracketPath, { ...options, fill: 'none' });
                break;
            }

            case 'bpmnPool': {
                this.renderPoolSketch(rc, ctx, el, cx, cy, isDarkMode, options);
                return; // Pool handles its own text
            }

            case 'bpmnDataStore': {
                // Cylinder using rough arcs + lines
                const ellipseH = Math.min(h * 0.18, 20);
                rc.ellipse(cx, y + ellipseH, w, ellipseH * 2, options);
                rc.line(x, y + ellipseH, x, y + h - ellipseH, { ...options, fill: 'none' });
                rc.line(x + w, y + ellipseH, x + w, y + h - ellipseH, { ...options, fill: 'none' });
                rc.arc(cx, y + h - ellipseH, w, ellipseH * 2, 0, Math.PI, false, { ...options, fill: 'none' });
                break;
            }

            case 'bpmnGroup': {
                const radius = Math.min(w, h) * 0.08;
                const dashOpts = { ...options, strokeLineDash: [8, 4] };
                rc.path(this.getRoundRectPath(x, y, w, h, radius), dashOpts);
                break;
            }
        }

        // Text for non-pool shapes (pool returns early from its case branch above)
        RenderPipeline.renderText(context, cx, cy);
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: DrawingElement): void {
        const geometry = getShapeGeometry(el);
        if (!geometry) return;
        ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
        RenderPipeline.renderGeometry(ctx, geometry);
    }

    // ── Non-interrupting dashed border for events ──
    private applyNonInterruptingDash(ctx: CanvasRenderingContext2D, el: DrawingElement): void {
        if (el.bpmnNonInterrupting) {
            ctx.setLineDash([6, 4]);
        }
    }

    // ── Resolve icon color (respects bpmnIconColor override) ──
    private getIconColor(el: DrawingElement, isDarkMode: boolean): string {
        return RenderPipeline.adjustColor(el.bpmnIconColor || el.strokeColor, isDarkMode);
    }

    // ── Event Icon Rendering ──
    private renderEventIcon(ctx: CanvasRenderingContext2D, el: DrawingElement, cx: number, cy: number, iconSize: number, isDarkMode: boolean): void {
        const eventType = el.bpmnEventType || 'none';
        if (eventType === 'none') return;

        const scale = el.bpmnIconScale ?? 1.0;
        iconSize *= scale;

        ctx.save();
        const iconColor = this.getIconColor(el, isDarkMode);
        ctx.strokeStyle = iconColor;
        ctx.fillStyle = iconColor;
        ctx.lineWidth = Math.max(el.strokeWidth * 0.8, 1.2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        switch (eventType) {
            case 'message': {
                const ew = iconSize, eh = iconSize * 0.65;
                ctx.beginPath();
                ctx.rect(cx - ew / 2, cy - eh / 2, ew, eh);
                if (el.bpmnIconFilled) ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx - ew / 2, cy - eh / 2);
                ctx.lineTo(cx, cy + eh * 0.05);
                ctx.lineTo(cx + ew / 2, cy - eh / 2);
                ctx.stroke();
                break;
            }
            case 'timer': {
                const r = iconSize * 0.45;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.stroke();
                for (let i = 0; i < 12; i++) {
                    const angle = (i * Math.PI) / 6;
                    const inner = r * 0.8;
                    ctx.beginPath();
                    ctx.moveTo(cx + inner * Math.sin(angle), cy - inner * Math.cos(angle));
                    ctx.lineTo(cx + r * Math.sin(angle), cy - r * Math.cos(angle));
                    ctx.stroke();
                }
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx, cy - r * 0.6);
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + r * 0.4, cy);
                ctx.stroke();
                break;
            }
            case 'error': {
                const d = iconSize * 0.4;
                ctx.beginPath();
                ctx.moveTo(cx - d * 0.3, cy - d);
                ctx.lineTo(cx + d * 0.15, cy - d * 0.1);
                ctx.lineTo(cx - d * 0.15, cy + d * 0.1);
                ctx.lineTo(cx + d * 0.3, cy + d);
                if (el.bpmnIconFilled) {
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.stroke();
                break;
            }
            case 'signal': {
                const d = iconSize * 0.4;
                ctx.beginPath();
                ctx.moveTo(cx, cy - d);
                ctx.lineTo(cx + d * 0.9, cy + d * 0.7);
                ctx.lineTo(cx - d * 0.9, cy + d * 0.7);
                ctx.closePath();
                if (el.bpmnIconFilled) ctx.fill();
                ctx.stroke();
                break;
            }
            case 'conditional': {
                const d = iconSize * 0.35;
                ctx.beginPath();
                ctx.rect(cx - d, cy - d, d * 2, d * 2);
                if (el.bpmnIconFilled) ctx.fill();
                ctx.stroke();
                const lines = 3;
                const gap = (d * 2) / (lines + 1);
                for (let i = 1; i <= lines; i++) {
                    ctx.beginPath();
                    ctx.moveTo(cx - d * 0.6, cy - d + gap * i);
                    ctx.lineTo(cx + d * 0.6, cy - d + gap * i);
                    ctx.stroke();
                }
                break;
            }
            case 'escalation': {
                // Upward arrow/chevron
                const d = iconSize * 0.42;
                ctx.beginPath();
                ctx.moveTo(cx, cy - d);
                ctx.lineTo(cx + d * 0.6, cy + d * 0.7);
                ctx.lineTo(cx, cy + d * 0.15);
                ctx.lineTo(cx - d * 0.6, cy + d * 0.7);
                ctx.closePath();
                if (el.bpmnIconFilled) ctx.fill();
                ctx.stroke();
                break;
            }
            case 'compensation': {
                // Double left-pointing triangles (rewind)
                const d = iconSize * 0.35;
                // Left triangle
                ctx.beginPath();
                ctx.moveTo(cx - d * 0.1, cy - d * 0.7);
                ctx.lineTo(cx - d * 1.1, cy);
                ctx.lineTo(cx - d * 0.1, cy + d * 0.7);
                ctx.closePath();
                if (el.bpmnIconFilled) ctx.fill();
                ctx.stroke();
                // Right triangle
                ctx.beginPath();
                ctx.moveTo(cx + d * 0.9, cy - d * 0.7);
                ctx.lineTo(cx - d * 0.1, cy);
                ctx.lineTo(cx + d * 0.9, cy + d * 0.7);
                ctx.closePath();
                if (el.bpmnIconFilled) ctx.fill();
                ctx.stroke();
                break;
            }
            case 'link': {
                // Right-pointing arrow (pentagon)
                const d = iconSize * 0.38;
                ctx.beginPath();
                ctx.moveTo(cx - d * 0.7, cy - d * 0.5);
                ctx.lineTo(cx + d * 0.2, cy - d * 0.5);
                ctx.lineTo(cx + d * 0.9, cy);
                ctx.lineTo(cx + d * 0.2, cy + d * 0.5);
                ctx.lineTo(cx - d * 0.7, cy + d * 0.5);
                ctx.closePath();
                if (el.bpmnIconFilled) ctx.fill();
                ctx.stroke();
                break;
            }
            case 'terminate': {
                // Filled circle
                const r = iconSize * 0.38;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'cancel': {
                // X mark (thick)
                const d = iconSize * 0.35;
                ctx.lineWidth = Math.max(el.strokeWidth * 1.5, 2);
                ctx.beginPath();
                ctx.moveTo(cx - d, cy - d);
                ctx.lineTo(cx + d, cy + d);
                ctx.moveTo(cx + d, cy - d);
                ctx.lineTo(cx - d, cy + d);
                ctx.stroke();
                break;
            }
        }
        ctx.restore();
    }

    // ── Gateway Marker Rendering ──
    private renderGatewayMarker(ctx: CanvasRenderingContext2D, el: DrawingElement, cx: number, cy: number, size: number, isDarkMode: boolean): void {
        const scale = el.bpmnIconScale ?? 1.0;
        size *= scale;

        ctx.save();
        const iconColor = this.getIconColor(el, isDarkMode);
        ctx.strokeStyle = iconColor;
        ctx.fillStyle = iconColor;
        ctx.lineWidth = Math.max(el.strokeWidth * 1.5, 2);
        ctx.lineCap = 'round';

        if (el.type === 'bpmnExclusiveGateway') {
            const d = size * 0.7;
            ctx.beginPath();
            ctx.moveTo(cx - d, cy - d);
            ctx.lineTo(cx + d, cy + d);
            ctx.moveTo(cx + d, cy - d);
            ctx.lineTo(cx - d, cy + d);
            ctx.stroke();
        } else if (el.type === 'bpmnParallelGateway') {
            const d = size * 0.75;
            ctx.beginPath();
            ctx.moveTo(cx, cy - d);
            ctx.lineTo(cx, cy + d);
            ctx.moveTo(cx - d, cy);
            ctx.lineTo(cx + d, cy);
            ctx.stroke();
        } else if (el.type === 'bpmnInclusiveGateway') {
            const r = size * 0.65;
            ctx.lineWidth = Math.max(el.strokeWidth * 1.8, 2.5);
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            if (el.bpmnIconFilled) ctx.fill();
            ctx.stroke();
        } else if (el.type === 'bpmnEventGateway') {
            // Double circle + pentagon inside
            const outerR = size * 0.85;
            const innerR = outerR * 0.78;
            ctx.lineWidth = Math.max(el.strokeWidth * 0.8, 1);
            ctx.beginPath();
            ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
            ctx.stroke();
            // Pentagon
            const pentR = innerR * 0.65;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const px = cx + pentR * Math.cos(angle);
                const py = cy + pentR * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
        }
        ctx.restore();
    }

    // ── Task Marker Rendering (top-left icon) ──
    private renderTaskMarker(ctx: CanvasRenderingContext2D, el: DrawingElement, isDarkMode: boolean): void {
        const taskType = el.bpmnTaskType || 'none';
        if (taskType === 'none') return;

        const scale = el.bpmnIconScale ?? 1.0;
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const iconSize = Math.min(w, h) * 0.15 * scale;
        const iconX = x + iconSize * 1.1;
        const iconY = y + iconSize * 1.1;

        ctx.save();
        const iconColor = this.getIconColor(el, isDarkMode);
        ctx.strokeStyle = iconColor;
        ctx.fillStyle = iconColor;
        ctx.lineWidth = Math.max(el.strokeWidth * 0.6, 1);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const s = iconSize * 0.5;

        switch (taskType) {
            case 'user': {
                const headR = s * 0.3;
                ctx.beginPath();
                ctx.arc(iconX, iconY - s * 0.25, headR, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(iconX - s * 0.45, iconY + s * 0.5);
                ctx.quadraticCurveTo(iconX - s * 0.45, iconY + s * 0.05, iconX, iconY + s * 0.05);
                ctx.quadraticCurveTo(iconX + s * 0.45, iconY + s * 0.05, iconX + s * 0.45, iconY + s * 0.5);
                ctx.stroke();
                break;
            }
            case 'service': {
                this.drawGear(ctx, iconX - s * 0.15, iconY - s * 0.1, s * 0.32, 6);
                this.drawGear(ctx, iconX + s * 0.2, iconY + s * 0.2, s * 0.25, 6);
                break;
            }
            case 'script': {
                ctx.beginPath();
                ctx.moveTo(iconX - s * 0.4, iconY - s * 0.5);
                ctx.lineTo(iconX + s * 0.3, iconY - s * 0.5);
                ctx.quadraticCurveTo(iconX + s * 0.55, iconY - s * 0.5, iconX + s * 0.55, iconY - s * 0.25);
                ctx.lineTo(iconX + s * 0.55, iconY + s * 0.3);
                ctx.quadraticCurveTo(iconX + s * 0.55, iconY + s * 0.5, iconX + s * 0.3, iconY + s * 0.5);
                ctx.lineTo(iconX - s * 0.2, iconY + s * 0.5);
                ctx.quadraticCurveTo(iconX - s * 0.45, iconY + s * 0.5, iconX - s * 0.45, iconY + s * 0.3);
                ctx.lineTo(iconX - s * 0.45, iconY - s * 0.25);
                ctx.quadraticCurveTo(iconX - s * 0.45, iconY - s * 0.5, iconX - s * 0.2, iconY - s * 0.5);
                ctx.stroke();
                for (let i = 0; i < 3; i++) {
                    const ly = iconY - s * 0.2 + i * s * 0.25;
                    ctx.beginPath();
                    ctx.moveTo(iconX - s * 0.25, ly);
                    ctx.lineTo(iconX + s * 0.35, ly);
                    ctx.stroke();
                }
                break;
            }
            case 'manual': {
                ctx.beginPath();
                ctx.moveTo(iconX - s * 0.5, iconY);
                ctx.lineTo(iconX + s * 0.1, iconY - s * 0.45);
                ctx.lineTo(iconX + s * 0.5, iconY - s * 0.25);
                ctx.lineTo(iconX + s * 0.5, iconY + s * 0.1);
                ctx.lineTo(iconX + s * 0.1, iconY + s * 0.5);
                ctx.lineTo(iconX - s * 0.5, iconY + s * 0.5);
                ctx.closePath();
                ctx.stroke();
                break;
            }
            case 'send': {
                const ew = s * 0.8, eh = s * 0.55;
                ctx.beginPath();
                ctx.moveTo(iconX - ew / 2, iconY - eh / 2);
                ctx.lineTo(iconX + ew / 2, iconY);
                ctx.lineTo(iconX - ew / 2, iconY + eh / 2);
                ctx.closePath();
                ctx.fill();
                break;
            }
            case 'receive': {
                const ew = s * 0.8, eh = s * 0.55;
                ctx.beginPath();
                ctx.rect(iconX - ew / 2, iconY - eh / 2, ew, eh);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(iconX - ew / 2, iconY - eh / 2);
                ctx.lineTo(iconX, iconY + eh * 0.05);
                ctx.lineTo(iconX + ew / 2, iconY - eh / 2);
                ctx.stroke();
                break;
            }
            case 'businessRule': {
                // Table/grid icon
                const tw = s * 0.9, th = s * 0.7;
                const tx = iconX - tw / 2, ty = iconY - th / 2;
                ctx.beginPath();
                ctx.rect(tx, ty, tw, th);
                ctx.stroke();
                // Header line
                const headerH = th * 0.35;
                ctx.beginPath();
                ctx.moveTo(tx, ty + headerH);
                ctx.lineTo(tx + tw, ty + headerH);
                ctx.stroke();
                // Fill header
                ctx.fillStyle = iconColor;
                ctx.globalAlpha = 0.3;
                ctx.fillRect(tx, ty, tw, headerH);
                ctx.globalAlpha = 1;
                // Vertical divider
                ctx.beginPath();
                ctx.moveTo(tx + tw * 0.35, ty + headerH);
                ctx.lineTo(tx + tw * 0.35, ty + th);
                ctx.stroke();
                break;
            }
        }
        ctx.restore();
    }

    // ── Loop / Multi-Instance Marker (bottom center) ──
    private renderLoopMarker(ctx: CanvasRenderingContext2D, el: DrawingElement, isDarkMode: boolean): void {
        const loopType = el.bpmnLoopType || 'none';
        if (loopType === 'none') return;

        const scale = el.bpmnIconScale ?? 1.0;
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const markerCx = x + w / 2;
        const markerCy = y + h - Math.min(h * 0.1, 12);
        const markerSize = Math.min(w, h) * 0.08 * scale;

        ctx.save();
        const iconColor = this.getIconColor(el, isDarkMode);
        ctx.strokeStyle = iconColor;
        ctx.fillStyle = iconColor;
        ctx.lineWidth = Math.max(el.strokeWidth * 0.6, 1);
        ctx.lineCap = 'round';

        switch (loopType) {
            case 'standard': {
                const r = markerSize;
                ctx.beginPath();
                ctx.arc(markerCx, markerCy, r, Math.PI * 0.2, Math.PI * 1.8);
                ctx.stroke();
                const angle = Math.PI * 0.2;
                const ax = markerCx + r * Math.cos(angle);
                const ay = markerCy + r * Math.sin(angle);
                const arrowSize = r * 0.5;
                ctx.beginPath();
                ctx.moveTo(ax, ay);
                ctx.lineTo(ax + arrowSize, ay - arrowSize * 0.3);
                ctx.moveTo(ax, ay);
                ctx.lineTo(ax + arrowSize * 0.3, ay + arrowSize);
                ctx.stroke();
                break;
            }
            case 'parallel': {
                const barW = markerSize * 0.3;
                const barH = markerSize * 1.5;
                const gap = markerSize * 0.7;
                for (let i = -1; i <= 1; i++) {
                    ctx.beginPath();
                    ctx.rect(markerCx + i * gap - barW / 2, markerCy - barH / 2, barW, barH);
                    ctx.fill();
                }
                break;
            }
            case 'sequential': {
                const barW = markerSize * 1.5;
                const barH = markerSize * 0.3;
                const gap = markerSize * 0.55;
                for (let i = -1; i <= 1; i++) {
                    ctx.beginPath();
                    ctx.rect(markerCx - barW / 2, markerCy + i * gap - barH / 2, barW, barH);
                    ctx.fill();
                }
                break;
            }
            case 'compensation': {
                // Double left-pointing triangles (rewind marker)
                const d = markerSize * 0.9;
                ctx.beginPath();
                ctx.moveTo(markerCx, markerCy - d * 0.5);
                ctx.lineTo(markerCx - d * 0.7, markerCy);
                ctx.lineTo(markerCx, markerCy + d * 0.5);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(markerCx + d * 0.7, markerCy - d * 0.5);
                ctx.lineTo(markerCx, markerCy);
                ctx.lineTo(markerCx + d * 0.7, markerCy + d * 0.5);
                ctx.closePath();
                ctx.fill();
                break;
            }
        }
        ctx.restore();
    }

    // ── Sub-Process [+] Marker ──
    private renderSubProcessMarker(ctx: CanvasRenderingContext2D, el: DrawingElement, isDarkMode: boolean): void {
        const scale = el.bpmnIconScale ?? 1.0;
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const markerCx = x + w / 2;
        const markerCy = y + h - Math.min(h * 0.1, 12);
        const boxSize = Math.min(w, h) * 0.08 * scale;

        const hasLoop = el.bpmnLoopType && el.bpmnLoopType !== 'none';
        const offsetX = hasLoop ? boxSize * 2 : 0;

        ctx.save();
        const iconColor = this.getIconColor(el, isDarkMode);
        ctx.strokeStyle = iconColor;
        ctx.lineWidth = Math.max(el.strokeWidth * 0.6, 1);

        ctx.beginPath();
        ctx.rect(markerCx + offsetX - boxSize, markerCy - boxSize, boxSize * 2, boxSize * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(markerCx + offsetX, markerCy - boxSize * 0.6);
        ctx.lineTo(markerCx + offsetX, markerCy + boxSize * 0.6);
        ctx.moveTo(markerCx + offsetX - boxSize * 0.6, markerCy);
        ctx.lineTo(markerCx + offsetX + boxSize * 0.6, markerCy);
        ctx.stroke();
        ctx.restore();
    }

    // ── Pool layout helpers ──
    private getPoolLabelWidth(el: DrawingElement): number {
        return el.bpmnPoolLabelSize ?? Math.min(el.width * 0.06, 35);
    }
    private getLaneLabelWidth(el: DrawingElement): number {
        return el.bpmnLaneLabelSize ?? Math.min(el.width * 0.05, 28);
    }
    private getPoolLabelHeight(el: DrawingElement): number {
        return el.bpmnPoolLabelSize ?? Math.min(el.height * 0.08, 30);
    }
    private getLaneLabelHeight(el: DrawingElement): number {
        return el.bpmnLaneLabelSize ?? Math.min(el.height * 0.06, 25);
    }

    private static readonly COLLAPSED_LANE_SIZE = 25;

    /** Compute per-lane sizes. Returns array of lane heights (horizontal) or widths (vertical) */
    private computeLaneSizes(el: DrawingElement, totalSize: number): number[] {
        const laneCount = el.bpmnLaneCount ?? 1;
        if (laneCount <= 1) return [totalSize];

        const collapsed = el.bpmnLaneCollapsed ?? [];
        const collapsedCount = collapsed.filter(Boolean).length;
        const collapsedTotal = collapsedCount * BpmnRenderer.COLLAPSED_LANE_SIZE;
        const remainingSize = Math.max(0, totalSize - collapsedTotal);

        const heights = el.bpmnLaneHeights;
        if (heights && heights.length === laneCount) {
            const expandedSum = heights.reduce((sum, h, i) => collapsed[i] ? sum : sum + h, 0);
            return heights.map((h, i) =>
                collapsed[i] ? BpmnRenderer.COLLAPSED_LANE_SIZE : (expandedSum > 0 ? (h / expandedSum) * remainingSize : 0));
        }
        // Equal division of remaining space
        const expandedCount = laneCount - collapsedCount;
        const expandedSize = expandedCount > 0 ? remainingSize / expandedCount : 0;
        return Array.from({ length: laneCount }, (_, i) =>
            collapsed[i] ? BpmnRenderer.COLLAPSED_LANE_SIZE : expandedSize);
    }

    // ── Architectural Pool Rendering ──
    private renderPoolArchitectural(
        ctx: CanvasRenderingContext2D, el: DrawingElement,
        _cx: number, _cy: number, isDarkMode: boolean,
        backgroundColor: string | undefined
    ): void {
        const { x, y, width: w, height: h } = el;
        const isVertical = el.bpmnOrientation === 'vertical';
        const laneCount = el.bpmnLaneCount ?? 1;
        const labels = el.isEditing ? [] : (el.bpmnLaneLabels ?? []);
        const textColor = RenderPipeline.adjustColor(el.textColor || el.strokeColor, isDarkMode);
        const font = `${el.fontWeight || 'normal'} ${el.fontSize || 14}px ${el.fontFamily || 'sans-serif'}`;
        const smallFont = `${el.fontWeight || 'normal'} ${Math.max((el.fontSize || 14) * 0.85, 10)}px ${el.fontFamily || 'sans-serif'}`;

        // Fill background
        if (backgroundColor) {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(x, y, w, h);
        }

        RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);

        // Outer border
        ctx.strokeRect(x, y, w, h);

        // Suppress containerText when editing (labels already cleared above)
        const renderEl = el.isEditing ? { ...el, containerText: '' } : el;

        if (isVertical) {
            this.renderPoolVerticalArch(ctx, renderEl, x, y, w, h, laneCount, labels, textColor, font, smallFont, isDarkMode);
        } else {
            this.renderPoolHorizontalArch(ctx, renderEl, x, y, w, h, laneCount, labels, textColor, font, smallFont, isDarkMode);
        }
    }

    private renderPoolHorizontalArch(
        ctx: CanvasRenderingContext2D, el: DrawingElement,
        x: number, y: number, w: number, h: number,
        laneCount: number, labels: string[],
        textColor: string, font: string, smallFont: string,
        isDarkMode: boolean
    ): void {
        const poolLabelW = this.getPoolLabelWidth(el);
        const hasLaneLabels = laneCount > 1;
        const laneLabelW = hasLaneLabels ? this.getLaneLabelWidth(el) : 0;

        // Pool label column divider
        ctx.beginPath();
        ctx.moveTo(x + poolLabelW, y);
        ctx.lineTo(x + poolLabelW, y + h);
        ctx.stroke();

        // Lane label column divider (only if multiple lanes)
        if (hasLaneLabels) {
            ctx.beginPath();
            ctx.moveTo(x + poolLabelW + laneLabelW, y);
            ctx.lineTo(x + poolLabelW + laneLabelW, y + h);
            ctx.stroke();
        }

        // Lane dividers, backgrounds, and labels
        const laneSizes = this.computeLaneSizes(el, h);
        const laneColors = el.bpmnLaneColors ?? [];
        const laneTextColors = el.bpmnLaneTextColors ?? [];
        const collapsed = el.bpmnLaneCollapsed ?? [];
        let laneY = y;
        for (let i = 0; i < laneCount; i++) {
            const laneH = laneSizes[i];
            const isCollapsed = collapsed[i] ?? false;

            // Per-lane background color
            const laneBg = laneColors[i];
            if (laneBg && laneBg !== 'transparent') {
                ctx.fillStyle = RenderPipeline.adjustColor(laneBg, isDarkMode);
                const laneBodyX = x + poolLabelW + laneLabelW;
                ctx.fillRect(laneBodyX, laneY, w - poolLabelW - laneLabelW, laneH);
            }

            // Collapsed lane: subtle hatching overlay
            if (isCollapsed) {
                ctx.fillStyle = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                const laneBodyX = x + poolLabelW + laneLabelW;
                ctx.fillRect(laneBodyX, laneY, w - poolLabelW - laneLabelW, laneH);
            }

            // Lane divider (skip first lane)
            if (i > 0) {
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.beginPath();
                ctx.moveTo(x + poolLabelW, laneY);
                ctx.lineTo(x + w, laneY);
                ctx.stroke();
            }

            // Per-lane label (rotated, in lane label column)
            if (hasLaneLabels) {
                const label = labels[i] || '';
                if (label) {
                    const laneTC = laneTextColors[i]
                        ? RenderPipeline.adjustColor(laneTextColors[i], isDarkMode)
                        : textColor;
                    ctx.save();
                    ctx.translate(x + poolLabelW + laneLabelW / 2, laneY + laneH / 2);
                    ctx.rotate(-Math.PI / 2);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = laneTC;
                    ctx.font = smallFont;
                    // Clip text to lane height
                    const maxLen = laneH - 10;
                    const prefix = isCollapsed ? '\u25B8 ' : '';
                    let displayText = prefix + label;
                    if (ctx.measureText(displayText).width > maxLen && maxLen > 0) {
                        displayText = prefix + label;
                        while (displayText.length > prefix.length + 1 && ctx.measureText(displayText + '...').width > maxLen) {
                            displayText = displayText.slice(0, -1);
                        }
                        displayText += '...';
                    }
                    ctx.fillText(displayText, 0, 0);
                    ctx.restore();
                }
            }

            laneY += laneH;
        }

        // Pool name (rotated, in pool label column)
        if (el.containerText) {
            ctx.save();
            ctx.translate(x + poolLabelW / 2, y + h / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = textColor;
            ctx.font = font;
            ctx.fillText(el.containerText, 0, 0);
            ctx.restore();
        }
    }

    private renderPoolVerticalArch(
        ctx: CanvasRenderingContext2D, el: DrawingElement,
        x: number, y: number, w: number, h: number,
        laneCount: number, labels: string[],
        textColor: string, font: string, smallFont: string,
        isDarkMode: boolean
    ): void {
        const poolLabelH = this.getPoolLabelHeight(el);
        const hasLaneLabels = laneCount > 1;
        const laneLabelH = hasLaneLabels ? this.getLaneLabelHeight(el) : 0;

        // Pool label row divider
        ctx.beginPath();
        ctx.moveTo(x, y + poolLabelH);
        ctx.lineTo(x + w, y + poolLabelH);
        ctx.stroke();

        // Lane label row divider (only if multiple lanes)
        if (hasLaneLabels) {
            ctx.beginPath();
            ctx.moveTo(x, y + poolLabelH + laneLabelH);
            ctx.lineTo(x + w, y + poolLabelH + laneLabelH);
            ctx.stroke();
        }

        // Lane dividers, backgrounds, and labels
        const laneSizes = this.computeLaneSizes(el, w);
        const laneColors = el.bpmnLaneColors ?? [];
        const laneTextColors = el.bpmnLaneTextColors ?? [];
        const collapsedV = el.bpmnLaneCollapsed ?? [];
        let laneX = x;
        for (let i = 0; i < laneCount; i++) {
            const laneW = laneSizes[i];
            const isCollapsed = collapsedV[i] ?? false;

            // Per-lane background color
            const laneBg = laneColors[i];
            if (laneBg && laneBg !== 'transparent') {
                ctx.fillStyle = RenderPipeline.adjustColor(laneBg, isDarkMode);
                const laneBodyY = y + poolLabelH + laneLabelH;
                ctx.fillRect(laneX, laneBodyY, laneW, h - poolLabelH - laneLabelH);
            }

            // Collapsed lane: subtle hatching overlay
            if (isCollapsed) {
                ctx.fillStyle = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                const laneBodyY = y + poolLabelH + laneLabelH;
                ctx.fillRect(laneX, laneBodyY, laneW, h - poolLabelH - laneLabelH);
            }

            // Lane divider (skip first lane)
            if (i > 0) {
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.beginPath();
                ctx.moveTo(laneX, y + poolLabelH);
                ctx.lineTo(laneX, y + h);
                ctx.stroke();
            }

            // Per-lane label (horizontal, in lane label row)
            if (hasLaneLabels) {
                const label = labels[i] || '';
                if (label) {
                    const laneTC = laneTextColors[i]
                        ? RenderPipeline.adjustColor(laneTextColors[i], isDarkMode)
                        : textColor;
                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = laneTC;
                    ctx.font = smallFont;
                    const maxLen = laneW - 10;
                    const prefix = isCollapsed ? '\u25B8 ' : '';
                    let displayText = prefix + label;
                    if (ctx.measureText(displayText).width > maxLen && maxLen > 0) {
                        displayText = prefix + label;
                        while (displayText.length > prefix.length + 1 && ctx.measureText(displayText + '...').width > maxLen) {
                            displayText = displayText.slice(0, -1);
                        }
                        displayText += '...';
                    }
                    ctx.fillText(displayText, laneX + laneW / 2, y + poolLabelH + laneLabelH / 2);
                    ctx.restore();
                }
            }

            laneX += laneW;
        }

        // Pool name (horizontal, in pool label row)
        if (el.containerText) {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = textColor;
            ctx.font = font;
            ctx.fillText(el.containerText, x + w / 2, y + poolLabelH / 2);
            ctx.restore();
        }
    }

    // ── Sketch Pool Rendering ──
    private renderPoolSketch(
        rc: any, ctx: CanvasRenderingContext2D, el: DrawingElement,
        _cx: number, _cy: number, isDarkMode: boolean, options: any
    ): void {
        const { x, y, width: w, height: h } = el;
        const isVertical = el.bpmnOrientation === 'vertical';
        const laneCount = el.bpmnLaneCount ?? 1;
        const labels = el.isEditing ? [] : (el.bpmnLaneLabels ?? []);
        const textColor = RenderPipeline.adjustColor(el.textColor || el.strokeColor, isDarkMode);
        const font = `${el.fontWeight || 'normal'} ${el.fontSize || 14}px ${el.fontFamily || 'sans-serif'}`;
        const smallFont = `${el.fontWeight || 'normal'} ${Math.max((el.fontSize || 14) * 0.85, 10)}px ${el.fontFamily || 'sans-serif'}`;

        // Outer rectangle
        rc.rectangle(x, y, w, h, options);

        // Suppress containerText when editing (labels already cleared above)
        const renderEl = el.isEditing ? { ...el, containerText: '' } : el;

        if (isVertical) {
            this.renderPoolVerticalSketch(rc, ctx, renderEl, x, y, w, h, laneCount, labels, textColor, font, smallFont, isDarkMode, options);
        } else {
            this.renderPoolHorizontalSketch(rc, ctx, renderEl, x, y, w, h, laneCount, labels, textColor, font, smallFont, isDarkMode, options);
        }
    }

    private renderPoolHorizontalSketch(
        rc: any, ctx: CanvasRenderingContext2D, el: DrawingElement,
        x: number, y: number, w: number, h: number,
        laneCount: number, labels: string[],
        textColor: string, font: string, smallFont: string,
        isDarkMode: boolean, options: any
    ): void {
        const poolLabelW = this.getPoolLabelWidth(el);
        const hasLaneLabels = laneCount > 1;
        const laneLabelW = hasLaneLabels ? this.getLaneLabelWidth(el) : 0;

        // Pool label column divider
        rc.line(x + poolLabelW, y, x + poolLabelW, y + h, options);

        // Lane label column divider
        if (hasLaneLabels) {
            rc.line(x + poolLabelW + laneLabelW, y, x + poolLabelW + laneLabelW, y + h, options);
        }

        // Lane dividers, backgrounds, and labels
        const laneSizes = this.computeLaneSizes(el, h);
        const laneColors = el.bpmnLaneColors ?? [];
        const laneTextColors = el.bpmnLaneTextColors ?? [];
        const collapsedHS = el.bpmnLaneCollapsed ?? [];
        let laneY = y;
        for (let i = 0; i < laneCount; i++) {
            const laneH = laneSizes[i];
            const isCollapsed = collapsedHS[i] ?? false;

            // Per-lane background color
            const laneBg = laneColors[i];
            if (laneBg && laneBg !== 'transparent') {
                ctx.fillStyle = RenderPipeline.adjustColor(laneBg, isDarkMode);
                const laneBodyX = x + poolLabelW + laneLabelW;
                ctx.fillRect(laneBodyX, laneY, w - poolLabelW - laneLabelW, laneH);
            }

            // Collapsed lane: subtle overlay
            if (isCollapsed) {
                ctx.fillStyle = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                const laneBodyX = x + poolLabelW + laneLabelW;
                ctx.fillRect(laneBodyX, laneY, w - poolLabelW - laneLabelW, laneH);
            }

            if (i > 0) {
                rc.line(x + poolLabelW, laneY, x + w, laneY, options);
            }

            // Per-lane label
            if (hasLaneLabels) {
                const label = labels[i] || '';
                if (label) {
                    const laneTC = laneTextColors[i]
                        ? RenderPipeline.adjustColor(laneTextColors[i], isDarkMode)
                        : textColor;
                    ctx.save();
                    ctx.translate(x + poolLabelW + laneLabelW / 2, laneY + laneH / 2);
                    ctx.rotate(-Math.PI / 2);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = laneTC;
                    ctx.font = smallFont;
                    const maxLen = laneH - 10;
                    const prefix = isCollapsed ? '\u25B8 ' : '';
                    let displayText = prefix + label;
                    if (ctx.measureText(displayText).width > maxLen && maxLen > 0) {
                        displayText = prefix + label;
                        while (displayText.length > prefix.length + 1 && ctx.measureText(displayText + '...').width > maxLen) {
                            displayText = displayText.slice(0, -1);
                        }
                        displayText += '...';
                    }
                    ctx.fillText(displayText, 0, 0);
                    ctx.restore();
                }
            }

            laneY += laneH;
        }

        // Pool name
        if (el.containerText) {
            ctx.save();
            ctx.translate(x + poolLabelW / 2, y + h / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = textColor;
            ctx.font = font;
            ctx.fillText(el.containerText, 0, 0);
            ctx.restore();
        }
    }

    private renderPoolVerticalSketch(
        rc: any, ctx: CanvasRenderingContext2D, el: DrawingElement,
        x: number, y: number, w: number, h: number,
        laneCount: number, labels: string[],
        textColor: string, font: string, smallFont: string,
        isDarkMode: boolean, options: any
    ): void {
        const poolLabelH = this.getPoolLabelHeight(el);
        const hasLaneLabels = laneCount > 1;
        const laneLabelH = hasLaneLabels ? this.getLaneLabelHeight(el) : 0;

        // Pool label row divider
        rc.line(x, y + poolLabelH, x + w, y + poolLabelH, options);

        // Lane label row divider
        if (hasLaneLabels) {
            rc.line(x, y + poolLabelH + laneLabelH, x + w, y + poolLabelH + laneLabelH, options);
        }

        // Lane dividers, backgrounds, and labels
        const laneSizes = this.computeLaneSizes(el, w);
        const laneColors = el.bpmnLaneColors ?? [];
        const laneTextColors = el.bpmnLaneTextColors ?? [];
        const collapsedVS = el.bpmnLaneCollapsed ?? [];
        let laneX = x;
        for (let i = 0; i < laneCount; i++) {
            const laneW = laneSizes[i];
            const isCollapsed = collapsedVS[i] ?? false;

            // Per-lane background color
            const laneBg = laneColors[i];
            if (laneBg && laneBg !== 'transparent') {
                ctx.fillStyle = RenderPipeline.adjustColor(laneBg, isDarkMode);
                const laneBodyY = y + poolLabelH + laneLabelH;
                ctx.fillRect(laneX, laneBodyY, laneW, h - poolLabelH - laneLabelH);
            }

            // Collapsed lane: subtle overlay
            if (isCollapsed) {
                ctx.fillStyle = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                const laneBodyY = y + poolLabelH + laneLabelH;
                ctx.fillRect(laneX, laneBodyY, laneW, h - poolLabelH - laneLabelH);
            }

            if (i > 0) {
                rc.line(laneX, y + poolLabelH, laneX, y + h, options);
            }

            // Per-lane label
            if (hasLaneLabels) {
                const label = labels[i] || '';
                if (label) {
                    const laneTC = laneTextColors[i]
                        ? RenderPipeline.adjustColor(laneTextColors[i], isDarkMode)
                        : textColor;
                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = laneTC;
                    ctx.font = smallFont;
                    const maxLen = laneW - 10;
                    const prefix = isCollapsed ? '\u25B8 ' : '';
                    let displayText = prefix + label;
                    if (ctx.measureText(displayText).width > maxLen && maxLen > 0) {
                        displayText = prefix + label;
                        while (displayText.length > prefix.length + 1 && ctx.measureText(displayText + '...').width > maxLen) {
                            displayText = displayText.slice(0, -1);
                        }
                        displayText += '...';
                    }
                    ctx.fillText(displayText, laneX + laneW / 2, y + poolLabelH + laneLabelH / 2);
                    ctx.restore();
                }
            }

            laneX += laneW;
        }

        // Pool name
        if (el.containerText) {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = textColor;
            ctx.font = font;
            ctx.fillText(el.containerText, x + w / 2, y + poolLabelH / 2);
            ctx.restore();
        }
    }

    // ── Helper: Draw a gear/cog ──
    private drawGear(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, teeth: number): void {
        const innerR = r * 0.55;
        const toothH = r * 0.35;
        ctx.beginPath();
        for (let i = 0; i < teeth; i++) {
            const a1 = (i * 2 * Math.PI) / teeth;
            const a2 = a1 + Math.PI / teeth * 0.4;
            const a3 = a1 + Math.PI / teeth * 0.6;
            const a4 = a1 + Math.PI / teeth;
            ctx.lineTo(cx + (r + toothH) * Math.cos(a1), cy + (r + toothH) * Math.sin(a1));
            ctx.lineTo(cx + (r + toothH) * Math.cos(a2), cy + (r + toothH) * Math.sin(a2));
            ctx.lineTo(cx + r * Math.cos(a3), cy + r * Math.sin(a3));
            ctx.lineTo(cx + r * Math.cos(a4), cy + r * Math.sin(a4));
        }
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.stroke();
    }

    // ── Helper: Canvas roundRect path ──
    private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    // ── Helper: SVG round-rect path for RoughJS ──
    private getRoundRectPath(x: number, y: number, w: number, h: number, r: number): string {
        return `M ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
    }
}
