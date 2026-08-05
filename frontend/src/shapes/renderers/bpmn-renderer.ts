import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import { getShapeGeometry } from "../../utils/shape-geometry";
import type { RenderContext } from "../base/types";
import type { DrawingElement } from "../../types";
import type { IRenderer } from "../../rendering/IRenderer";
import { fontShorthand } from "../../utils/font-variants";

export class BpmnRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { renderer, element: el, isDarkMode } = context;
        const backgroundColor = el.backgroundColor === 'transparent' ? undefined : RenderPipeline.adjustColor(el.backgroundColor, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            // ── Events ──
            case 'bpmnStartEvent': {
                const r = Math.min(w, h) / 2;
                if (backgroundColor) {
                    renderer.fillStyle = backgroundColor;
                    renderer.beginPath();
                    renderer.arc(cx, cy, r, 0, Math.PI * 2);
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                this.applyNonInterruptingDash(renderer, el);
                renderer.beginPath();
                renderer.arc(cx, cy, r, 0, Math.PI * 2);
                renderer.stroke();
                renderer.setLineDash([]);
                this.renderEventIcon(renderer, el, cx, cy, r * 0.55, isDarkMode);
                break;
            }

            case 'bpmnEndEvent': {
                const r = Math.min(w, h) / 2;
                if (backgroundColor) {
                    renderer.fillStyle = backgroundColor;
                    renderer.beginPath();
                    renderer.arc(cx, cy, r, 0, Math.PI * 2);
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                const savedWidth = renderer.lineWidth;
                renderer.lineWidth = Math.max(savedWidth * 3, 3);
                renderer.beginPath();
                renderer.arc(cx, cy, r, 0, Math.PI * 2);
                renderer.stroke();
                renderer.lineWidth = savedWidth;
                this.renderEventIcon(renderer, el, cx, cy, r * 0.5, isDarkMode);
                break;
            }

            case 'bpmnIntermediateEvent': {
                const outerR = Math.min(w, h) / 2;
                const innerR = outerR * 0.82;
                if (backgroundColor) {
                    renderer.fillStyle = backgroundColor;
                    renderer.beginPath();
                    renderer.arc(cx, cy, outerR, 0, Math.PI * 2);
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                this.applyNonInterruptingDash(renderer, el);
                renderer.beginPath();
                renderer.arc(cx, cy, outerR, 0, Math.PI * 2);
                renderer.stroke();
                renderer.beginPath();
                renderer.arc(cx, cy, innerR, 0, Math.PI * 2);
                renderer.stroke();
                renderer.setLineDash([]);
                this.renderEventIcon(renderer, el, cx, cy, innerR * 0.55, isDarkMode);
                break;
            }

            // ── Gateways ──
            case 'bpmnExclusiveGateway':
            case 'bpmnParallelGateway':
            case 'bpmnInclusiveGateway':
            case 'bpmnEventGateway': {
                const hw = w / 2, hh = h / 2;
                renderer.beginPath();
                renderer.moveTo(cx, cy - hh);
                renderer.lineTo(cx + hw, cy);
                renderer.lineTo(cx, cy + hh);
                renderer.lineTo(cx - hw, cy);
                renderer.closePath();
                if (backgroundColor) {
                    renderer.fillStyle = backgroundColor;
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.stroke();
                this.renderGatewayMarker(renderer, el, cx, cy, Math.min(hw, hh) * 0.55, isDarkMode);
                break;
            }

            // ── Activities ──
            case 'bpmnTask':
            case 'bpmnSubProcess':
            case 'bpmnCallActivity': {
                const radius = Math.min(w, h) * 0.1;
                if (backgroundColor) {
                    renderer.fillStyle = backgroundColor;
                    this.roundRect(renderer, x, y, w, h, radius);
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                if (el.type === 'bpmnCallActivity') {
                    const savedLw = renderer.lineWidth;
                    renderer.lineWidth = Math.max(savedLw * 2.5, 3);
                    this.roundRect(renderer, x, y, w, h, radius);
                    renderer.stroke();
                    renderer.lineWidth = savedLw;
                } else {
                    this.roundRect(renderer, x, y, w, h, radius);
                    renderer.stroke();
                }
                this.renderTaskMarker(renderer, el, isDarkMode);
                this.renderLoopMarker(renderer, el, isDarkMode);
                if (el.type === 'bpmnSubProcess') {
                    this.renderSubProcessMarker(renderer, el, isDarkMode);
                }
                break;
            }

            // ── Artifacts ──
            case 'bpmnDataObject': {
                const fold = Math.min(w, h) * 0.18;
                renderer.beginPath();
                renderer.moveTo(x, y);
                renderer.lineTo(x + w - fold, y);
                renderer.lineTo(x + w, y + fold);
                renderer.lineTo(x + w, y + h);
                renderer.lineTo(x, y + h);
                renderer.closePath();
                if (backgroundColor) {
                    renderer.fillStyle = backgroundColor;
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.stroke();
                renderer.beginPath();
                renderer.moveTo(x + w - fold, y);
                renderer.lineTo(x + w - fold, y + fold);
                renderer.lineTo(x + w, y + fold);
                renderer.stroke();
                break;
            }

            case 'bpmnAnnotation': {
                if (backgroundColor) {
                    renderer.fillStyle = backgroundColor;
                    renderer.fillRect(x, y, w, h);
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                const bracketW = Math.min(w * 0.12, 15);
                renderer.beginPath();
                renderer.moveTo(x + bracketW, y);
                renderer.lineTo(x, y);
                renderer.lineTo(x, y + h);
                renderer.lineTo(x + bracketW, y + h);
                renderer.stroke();
                break;
            }

            case 'bpmnPool': {
                this.renderPoolArchitectural(renderer, el, cx, cy, isDarkMode, backgroundColor);
                return; // Pool handles its own text
            }

            case 'bpmnDataStore': {
                // Cylinder shape (like database)
                const ellipseH = Math.min(h * 0.18, 20);
                if (backgroundColor) {
                    renderer.fillStyle = backgroundColor;
                    renderer.beginPath();
                    renderer.ellipse(cx, y + ellipseH, w / 2, ellipseH, 0, Math.PI, 0);
                    renderer.lineTo(x + w, y + h - ellipseH);
                    renderer.ellipse(cx, y + h - ellipseH, w / 2, ellipseH, 0, 0, Math.PI);
                    renderer.closePath();
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                // Top ellipse
                renderer.beginPath();
                renderer.ellipse(cx, y + ellipseH, w / 2, ellipseH, 0, 0, Math.PI * 2);
                renderer.stroke();
                // Body sides
                renderer.beginPath();
                renderer.moveTo(x, y + ellipseH);
                renderer.lineTo(x, y + h - ellipseH);
                renderer.stroke();
                renderer.beginPath();
                renderer.moveTo(x + w, y + ellipseH);
                renderer.lineTo(x + w, y + h - ellipseH);
                renderer.stroke();
                // Bottom ellipse
                renderer.beginPath();
                renderer.ellipse(cx, y + h - ellipseH, w / 2, ellipseH, 0, 0, Math.PI);
                renderer.stroke();
                break;
            }

            case 'bpmnGroup': {
                // Dashed rounded rectangle
                const radius = Math.min(w, h) * 0.08;
                if (backgroundColor) {
                    renderer.fillStyle = backgroundColor;
                    this.roundRect(renderer, x, y, w, h, radius);
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.setLineDash([8, 4]);
                this.roundRect(renderer, x, y, w, h, radius);
                renderer.stroke();
                renderer.setLineDash([]);
                break;
            }
        }

        // Text for non-pool shapes (pool returns early from its case branch above)
        RenderPipeline.renderText(context, cx, cy);
    }

    protected renderSketch(context: RenderContext, cx: number, cy: number): void {
        const { rc, renderer, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            // ── Events ──
            case 'bpmnStartEvent': {
                const r = Math.min(w, h) / 2;
                const eventOpts = el.bpmnNonInterrupting ? { ...options, strokeLineDash: [6, 4] } : options;
                rc.circle(cx, cy, r * 2, eventOpts);
                this.renderEventIcon(renderer, el, cx, cy, r * 0.55, isDarkMode);
                break;
            }

            case 'bpmnEndEvent': {
                const r = Math.min(w, h) / 2;
                const thickOptions = { ...options, strokeWidth: Math.max((el.strokeWidth || 2) * 3, 3) };
                rc.circle(cx, cy, r * 2, thickOptions);
                this.renderEventIcon(renderer, el, cx, cy, r * 0.5, isDarkMode);
                break;
            }

            case 'bpmnIntermediateEvent': {
                const outerR = Math.min(w, h) / 2;
                const innerR = outerR * 0.82;
                const eventOpts = el.bpmnNonInterrupting ? { ...options, strokeLineDash: [6, 4] } : options;
                rc.circle(cx, cy, outerR * 2, eventOpts);
                rc.circle(cx, cy, innerR * 2, { ...eventOpts, fill: 'none' });
                this.renderEventIcon(renderer, el, cx, cy, innerR * 0.55, isDarkMode);
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
                this.renderGatewayMarker(renderer, el, cx, cy, Math.min(hw, hh) * 0.55, isDarkMode);
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
                this.renderTaskMarker(renderer, el, isDarkMode);
                this.renderLoopMarker(renderer, el, isDarkMode);
                if (el.type === 'bpmnSubProcess') {
                    this.renderSubProcessMarker(renderer, el, isDarkMode);
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
                this.renderPoolSketch(rc, renderer, el, cx, cy, isDarkMode, options);
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

    protected definePath(renderer: IRenderer, el: DrawingElement): void {
        const geometry = getShapeGeometry(el);
        if (!geometry) return;
        renderer.translate(el.x + el.width / 2, el.y + el.height / 2);
        RenderPipeline.renderGeometry(renderer, geometry);
    }

    // ── Non-interrupting dashed border for events ──
    private applyNonInterruptingDash(renderer: IRenderer, el: DrawingElement): void {
        if (el.bpmnNonInterrupting) {
            renderer.setLineDash([6, 4]);
        }
    }

    // ── Resolve icon color (respects bpmnIconColor override) ──
    private getIconColor(el: DrawingElement, isDarkMode: boolean): string {
        return RenderPipeline.adjustColor(el.bpmnIconColor || el.strokeColor, isDarkMode);
    }

    // ── Event Icon Rendering ──
    private renderEventIcon(renderer: IRenderer, el: DrawingElement, cx: number, cy: number, iconSize: number, isDarkMode: boolean): void {
        const eventType = el.bpmnEventType || 'none';
        if (eventType === 'none') return;

        const scale = el.bpmnIconScale ?? 1.0;
        iconSize *= scale;

        renderer.save();
        const iconColor = this.getIconColor(el, isDarkMode);
        renderer.strokeStyle = iconColor;
        renderer.fillStyle = iconColor;
        renderer.lineWidth = Math.max(el.strokeWidth * 0.8, 1.2);
        renderer.lineCap = 'round';
        renderer.lineJoin = 'round';

        switch (eventType) {
            case 'message': {
                const ew = iconSize, eh = iconSize * 0.65;
                renderer.beginPath();
                renderer.rect(cx - ew / 2, cy - eh / 2, ew, eh);
                if (el.bpmnIconFilled) renderer.fill();
                renderer.stroke();
                renderer.beginPath();
                renderer.moveTo(cx - ew / 2, cy - eh / 2);
                renderer.lineTo(cx, cy + eh * 0.05);
                renderer.lineTo(cx + ew / 2, cy - eh / 2);
                renderer.stroke();
                break;
            }
            case 'timer': {
                const r = iconSize * 0.45;
                renderer.beginPath();
                renderer.arc(cx, cy, r, 0, Math.PI * 2);
                renderer.stroke();
                for (let i = 0; i < 12; i++) {
                    const angle = (i * Math.PI) / 6;
                    const inner = r * 0.8;
                    renderer.beginPath();
                    renderer.moveTo(cx + inner * Math.sin(angle), cy - inner * Math.cos(angle));
                    renderer.lineTo(cx + r * Math.sin(angle), cy - r * Math.cos(angle));
                    renderer.stroke();
                }
                renderer.beginPath();
                renderer.moveTo(cx, cy);
                renderer.lineTo(cx, cy - r * 0.6);
                renderer.moveTo(cx, cy);
                renderer.lineTo(cx + r * 0.4, cy);
                renderer.stroke();
                break;
            }
            case 'error': {
                const d = iconSize * 0.4;
                renderer.beginPath();
                renderer.moveTo(cx - d * 0.3, cy - d);
                renderer.lineTo(cx + d * 0.15, cy - d * 0.1);
                renderer.lineTo(cx - d * 0.15, cy + d * 0.1);
                renderer.lineTo(cx + d * 0.3, cy + d);
                if (el.bpmnIconFilled) {
                    renderer.closePath();
                    renderer.fill();
                }
                renderer.stroke();
                break;
            }
            case 'signal': {
                const d = iconSize * 0.4;
                renderer.beginPath();
                renderer.moveTo(cx, cy - d);
                renderer.lineTo(cx + d * 0.9, cy + d * 0.7);
                renderer.lineTo(cx - d * 0.9, cy + d * 0.7);
                renderer.closePath();
                if (el.bpmnIconFilled) renderer.fill();
                renderer.stroke();
                break;
            }
            case 'conditional': {
                const d = iconSize * 0.35;
                renderer.beginPath();
                renderer.rect(cx - d, cy - d, d * 2, d * 2);
                if (el.bpmnIconFilled) renderer.fill();
                renderer.stroke();
                const lines = 3;
                const gap = (d * 2) / (lines + 1);
                for (let i = 1; i <= lines; i++) {
                    renderer.beginPath();
                    renderer.moveTo(cx - d * 0.6, cy - d + gap * i);
                    renderer.lineTo(cx + d * 0.6, cy - d + gap * i);
                    renderer.stroke();
                }
                break;
            }
            case 'escalation': {
                // Upward arrow/chevron
                const d = iconSize * 0.42;
                renderer.beginPath();
                renderer.moveTo(cx, cy - d);
                renderer.lineTo(cx + d * 0.6, cy + d * 0.7);
                renderer.lineTo(cx, cy + d * 0.15);
                renderer.lineTo(cx - d * 0.6, cy + d * 0.7);
                renderer.closePath();
                if (el.bpmnIconFilled) renderer.fill();
                renderer.stroke();
                break;
            }
            case 'compensation': {
                // Double left-pointing triangles (rewind)
                const d = iconSize * 0.35;
                // Left triangle
                renderer.beginPath();
                renderer.moveTo(cx - d * 0.1, cy - d * 0.7);
                renderer.lineTo(cx - d * 1.1, cy);
                renderer.lineTo(cx - d * 0.1, cy + d * 0.7);
                renderer.closePath();
                if (el.bpmnIconFilled) renderer.fill();
                renderer.stroke();
                // Right triangle
                renderer.beginPath();
                renderer.moveTo(cx + d * 0.9, cy - d * 0.7);
                renderer.lineTo(cx - d * 0.1, cy);
                renderer.lineTo(cx + d * 0.9, cy + d * 0.7);
                renderer.closePath();
                if (el.bpmnIconFilled) renderer.fill();
                renderer.stroke();
                break;
            }
            case 'link': {
                // Right-pointing arrow (pentagon)
                const d = iconSize * 0.38;
                renderer.beginPath();
                renderer.moveTo(cx - d * 0.7, cy - d * 0.5);
                renderer.lineTo(cx + d * 0.2, cy - d * 0.5);
                renderer.lineTo(cx + d * 0.9, cy);
                renderer.lineTo(cx + d * 0.2, cy + d * 0.5);
                renderer.lineTo(cx - d * 0.7, cy + d * 0.5);
                renderer.closePath();
                if (el.bpmnIconFilled) renderer.fill();
                renderer.stroke();
                break;
            }
            case 'terminate': {
                // Filled circle
                const r = iconSize * 0.38;
                renderer.beginPath();
                renderer.arc(cx, cy, r, 0, Math.PI * 2);
                renderer.fill();
                break;
            }
            case 'cancel': {
                // X mark (thick)
                const d = iconSize * 0.35;
                renderer.lineWidth = Math.max(el.strokeWidth * 1.5, 2);
                renderer.beginPath();
                renderer.moveTo(cx - d, cy - d);
                renderer.lineTo(cx + d, cy + d);
                renderer.moveTo(cx + d, cy - d);
                renderer.lineTo(cx - d, cy + d);
                renderer.stroke();
                break;
            }
        }
        renderer.restore();
    }

    // ── Gateway Marker Rendering ──
    private renderGatewayMarker(renderer: IRenderer, el: DrawingElement, cx: number, cy: number, size: number, isDarkMode: boolean): void {
        const scale = el.bpmnIconScale ?? 1.0;
        size *= scale;

        renderer.save();
        const iconColor = this.getIconColor(el, isDarkMode);
        renderer.strokeStyle = iconColor;
        renderer.fillStyle = iconColor;
        renderer.lineWidth = Math.max(el.strokeWidth * 1.5, 2);
        renderer.lineCap = 'round';

        if (el.type === 'bpmnExclusiveGateway') {
            const d = size * 0.7;
            renderer.beginPath();
            renderer.moveTo(cx - d, cy - d);
            renderer.lineTo(cx + d, cy + d);
            renderer.moveTo(cx + d, cy - d);
            renderer.lineTo(cx - d, cy + d);
            renderer.stroke();
        } else if (el.type === 'bpmnParallelGateway') {
            const d = size * 0.75;
            renderer.beginPath();
            renderer.moveTo(cx, cy - d);
            renderer.lineTo(cx, cy + d);
            renderer.moveTo(cx - d, cy);
            renderer.lineTo(cx + d, cy);
            renderer.stroke();
        } else if (el.type === 'bpmnInclusiveGateway') {
            const r = size * 0.65;
            renderer.lineWidth = Math.max(el.strokeWidth * 1.8, 2.5);
            renderer.beginPath();
            renderer.arc(cx, cy, r, 0, Math.PI * 2);
            if (el.bpmnIconFilled) renderer.fill();
            renderer.stroke();
        } else if (el.type === 'bpmnEventGateway') {
            // Double circle + pentagon inside
            const outerR = size * 0.85;
            const innerR = outerR * 0.78;
            renderer.lineWidth = Math.max(el.strokeWidth * 0.8, 1);
            renderer.beginPath();
            renderer.arc(cx, cy, outerR, 0, Math.PI * 2);
            renderer.stroke();
            renderer.beginPath();
            renderer.arc(cx, cy, innerR, 0, Math.PI * 2);
            renderer.stroke();
            // Pentagon
            const pentR = innerR * 0.65;
            renderer.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const px = cx + pentR * Math.cos(angle);
                const py = cy + pentR * Math.sin(angle);
                if (i === 0) renderer.moveTo(px, py);
                else renderer.lineTo(px, py);
            }
            renderer.closePath();
            renderer.stroke();
        }
        renderer.restore();
    }

    // ── Task Marker Rendering (top-left icon) ──
    private renderTaskMarker(renderer: IRenderer, el: DrawingElement, isDarkMode: boolean): void {
        const taskType = el.bpmnTaskType || 'none';
        if (taskType === 'none') return;

        const scale = el.bpmnIconScale ?? 1.0;
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const iconSize = Math.min(w, h) * 0.15 * scale;
        const iconX = x + iconSize * 1.1;
        const iconY = y + iconSize * 1.1;

        renderer.save();
        const iconColor = this.getIconColor(el, isDarkMode);
        renderer.strokeStyle = iconColor;
        renderer.fillStyle = iconColor;
        renderer.lineWidth = Math.max(el.strokeWidth * 0.6, 1);
        renderer.lineCap = 'round';
        renderer.lineJoin = 'round';

        const s = iconSize * 0.5;

        switch (taskType) {
            case 'user': {
                const headR = s * 0.3;
                renderer.beginPath();
                renderer.arc(iconX, iconY - s * 0.25, headR, 0, Math.PI * 2);
                renderer.stroke();
                renderer.beginPath();
                renderer.moveTo(iconX - s * 0.45, iconY + s * 0.5);
                renderer.quadraticCurveTo(iconX - s * 0.45, iconY + s * 0.05, iconX, iconY + s * 0.05);
                renderer.quadraticCurveTo(iconX + s * 0.45, iconY + s * 0.05, iconX + s * 0.45, iconY + s * 0.5);
                renderer.stroke();
                break;
            }
            case 'service': {
                this.drawGear(renderer, iconX - s * 0.15, iconY - s * 0.1, s * 0.32, 6);
                this.drawGear(renderer, iconX + s * 0.2, iconY + s * 0.2, s * 0.25, 6);
                break;
            }
            case 'script': {
                renderer.beginPath();
                renderer.moveTo(iconX - s * 0.4, iconY - s * 0.5);
                renderer.lineTo(iconX + s * 0.3, iconY - s * 0.5);
                renderer.quadraticCurveTo(iconX + s * 0.55, iconY - s * 0.5, iconX + s * 0.55, iconY - s * 0.25);
                renderer.lineTo(iconX + s * 0.55, iconY + s * 0.3);
                renderer.quadraticCurveTo(iconX + s * 0.55, iconY + s * 0.5, iconX + s * 0.3, iconY + s * 0.5);
                renderer.lineTo(iconX - s * 0.2, iconY + s * 0.5);
                renderer.quadraticCurveTo(iconX - s * 0.45, iconY + s * 0.5, iconX - s * 0.45, iconY + s * 0.3);
                renderer.lineTo(iconX - s * 0.45, iconY - s * 0.25);
                renderer.quadraticCurveTo(iconX - s * 0.45, iconY - s * 0.5, iconX - s * 0.2, iconY - s * 0.5);
                renderer.stroke();
                for (let i = 0; i < 3; i++) {
                    const ly = iconY - s * 0.2 + i * s * 0.25;
                    renderer.beginPath();
                    renderer.moveTo(iconX - s * 0.25, ly);
                    renderer.lineTo(iconX + s * 0.35, ly);
                    renderer.stroke();
                }
                break;
            }
            case 'manual': {
                renderer.beginPath();
                renderer.moveTo(iconX - s * 0.5, iconY);
                renderer.lineTo(iconX + s * 0.1, iconY - s * 0.45);
                renderer.lineTo(iconX + s * 0.5, iconY - s * 0.25);
                renderer.lineTo(iconX + s * 0.5, iconY + s * 0.1);
                renderer.lineTo(iconX + s * 0.1, iconY + s * 0.5);
                renderer.lineTo(iconX - s * 0.5, iconY + s * 0.5);
                renderer.closePath();
                renderer.stroke();
                break;
            }
            case 'send': {
                const ew = s * 0.8, eh = s * 0.55;
                renderer.beginPath();
                renderer.moveTo(iconX - ew / 2, iconY - eh / 2);
                renderer.lineTo(iconX + ew / 2, iconY);
                renderer.lineTo(iconX - ew / 2, iconY + eh / 2);
                renderer.closePath();
                renderer.fill();
                break;
            }
            case 'receive': {
                const ew = s * 0.8, eh = s * 0.55;
                renderer.beginPath();
                renderer.rect(iconX - ew / 2, iconY - eh / 2, ew, eh);
                renderer.stroke();
                renderer.beginPath();
                renderer.moveTo(iconX - ew / 2, iconY - eh / 2);
                renderer.lineTo(iconX, iconY + eh * 0.05);
                renderer.lineTo(iconX + ew / 2, iconY - eh / 2);
                renderer.stroke();
                break;
            }
            case 'businessRule': {
                // Table/grid icon
                const tw = s * 0.9, th = s * 0.7;
                const tx = iconX - tw / 2, ty = iconY - th / 2;
                renderer.beginPath();
                renderer.rect(tx, ty, tw, th);
                renderer.stroke();
                // Header line
                const headerH = th * 0.35;
                renderer.beginPath();
                renderer.moveTo(tx, ty + headerH);
                renderer.lineTo(tx + tw, ty + headerH);
                renderer.stroke();
                // Fill header
                renderer.fillStyle = iconColor;
                renderer.globalAlpha = 0.3;
                renderer.fillRect(tx, ty, tw, headerH);
                renderer.globalAlpha = 1;
                // Vertical divider
                renderer.beginPath();
                renderer.moveTo(tx + tw * 0.35, ty + headerH);
                renderer.lineTo(tx + tw * 0.35, ty + th);
                renderer.stroke();
                break;
            }
        }
        renderer.restore();
    }

    // ── Loop / Multi-Instance Marker (bottom center) ──
    private renderLoopMarker(renderer: IRenderer, el: DrawingElement, isDarkMode: boolean): void {
        const loopType = el.bpmnLoopType || 'none';
        if (loopType === 'none') return;

        const scale = el.bpmnIconScale ?? 1.0;
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const markerCx = x + w / 2;
        const markerCy = y + h - Math.min(h * 0.1, 12);
        const markerSize = Math.min(w, h) * 0.08 * scale;

        renderer.save();
        const iconColor = this.getIconColor(el, isDarkMode);
        renderer.strokeStyle = iconColor;
        renderer.fillStyle = iconColor;
        renderer.lineWidth = Math.max(el.strokeWidth * 0.6, 1);
        renderer.lineCap = 'round';

        switch (loopType) {
            case 'standard': {
                const r = markerSize;
                renderer.beginPath();
                renderer.arc(markerCx, markerCy, r, Math.PI * 0.2, Math.PI * 1.8);
                renderer.stroke();
                const angle = Math.PI * 0.2;
                const ax = markerCx + r * Math.cos(angle);
                const ay = markerCy + r * Math.sin(angle);
                const arrowSize = r * 0.5;
                renderer.beginPath();
                renderer.moveTo(ax, ay);
                renderer.lineTo(ax + arrowSize, ay - arrowSize * 0.3);
                renderer.moveTo(ax, ay);
                renderer.lineTo(ax + arrowSize * 0.3, ay + arrowSize);
                renderer.stroke();
                break;
            }
            case 'parallel': {
                const barW = markerSize * 0.3;
                const barH = markerSize * 1.5;
                const gap = markerSize * 0.7;
                for (let i = -1; i <= 1; i++) {
                    renderer.beginPath();
                    renderer.rect(markerCx + i * gap - barW / 2, markerCy - barH / 2, barW, barH);
                    renderer.fill();
                }
                break;
            }
            case 'sequential': {
                const barW = markerSize * 1.5;
                const barH = markerSize * 0.3;
                const gap = markerSize * 0.55;
                for (let i = -1; i <= 1; i++) {
                    renderer.beginPath();
                    renderer.rect(markerCx - barW / 2, markerCy + i * gap - barH / 2, barW, barH);
                    renderer.fill();
                }
                break;
            }
            case 'compensation': {
                // Double left-pointing triangles (rewind marker)
                const d = markerSize * 0.9;
                renderer.beginPath();
                renderer.moveTo(markerCx, markerCy - d * 0.5);
                renderer.lineTo(markerCx - d * 0.7, markerCy);
                renderer.lineTo(markerCx, markerCy + d * 0.5);
                renderer.closePath();
                renderer.fill();
                renderer.beginPath();
                renderer.moveTo(markerCx + d * 0.7, markerCy - d * 0.5);
                renderer.lineTo(markerCx, markerCy);
                renderer.lineTo(markerCx + d * 0.7, markerCy + d * 0.5);
                renderer.closePath();
                renderer.fill();
                break;
            }
        }
        renderer.restore();
    }

    // ── Sub-Process [+] Marker ──
    private renderSubProcessMarker(renderer: IRenderer, el: DrawingElement, isDarkMode: boolean): void {
        const scale = el.bpmnIconScale ?? 1.0;
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const markerCx = x + w / 2;
        const markerCy = y + h - Math.min(h * 0.1, 12);
        const boxSize = Math.min(w, h) * 0.08 * scale;

        const hasLoop = el.bpmnLoopType && el.bpmnLoopType !== 'none';
        const offsetX = hasLoop ? boxSize * 2 : 0;

        renderer.save();
        const iconColor = this.getIconColor(el, isDarkMode);
        renderer.strokeStyle = iconColor;
        renderer.lineWidth = Math.max(el.strokeWidth * 0.6, 1);

        renderer.beginPath();
        renderer.rect(markerCx + offsetX - boxSize, markerCy - boxSize, boxSize * 2, boxSize * 2);
        renderer.stroke();
        renderer.beginPath();
        renderer.moveTo(markerCx + offsetX, markerCy - boxSize * 0.6);
        renderer.lineTo(markerCx + offsetX, markerCy + boxSize * 0.6);
        renderer.moveTo(markerCx + offsetX - boxSize * 0.6, markerCy);
        renderer.lineTo(markerCx + offsetX + boxSize * 0.6, markerCy);
        renderer.stroke();
        renderer.restore();
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
        renderer: IRenderer, el: DrawingElement,
        _cx: number, _cy: number, isDarkMode: boolean,
        backgroundColor: string | undefined
    ): void {
        const { x, y, width: w, height: h } = el;
        const isVertical = el.bpmnOrientation === 'vertical';
        const laneCount = el.bpmnLaneCount ?? 1;
        const labels = el.isEditing ? [] : (el.bpmnLaneLabels ?? []);
        const textColor = RenderPipeline.adjustColor(el.textColor || el.strokeColor, isDarkMode);
        const font = fontShorthand(el.fontWeight, el.fontStyle, el.fontSize || 14, el.fontFamily || 'sans-serif');
        const smallFont = fontShorthand(el.fontWeight, el.fontStyle, Math.max((el.fontSize || 14) * 0.85, 10), el.fontFamily || 'sans-serif');

        // Fill background
        if (backgroundColor) {
            renderer.fillStyle = backgroundColor;
            renderer.fillRect(x, y, w, h);
        }

        RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);

        // Outer border
        renderer.strokeRect(x, y, w, h);

        // Suppress containerText when editing (labels already cleared above)
        const renderEl = el.isEditing ? { ...el, containerText: '' } : el;

        if (isVertical) {
            this.renderPoolVerticalArch(renderer, renderEl, x, y, w, h, laneCount, labels, textColor, font, smallFont, isDarkMode);
        } else {
            this.renderPoolHorizontalArch(renderer, renderEl, x, y, w, h, laneCount, labels, textColor, font, smallFont, isDarkMode);
        }
    }

    private renderPoolHorizontalArch(
        renderer: IRenderer, el: DrawingElement,
        x: number, y: number, w: number, h: number,
        laneCount: number, labels: string[],
        textColor: string, font: string, smallFont: string,
        isDarkMode: boolean
    ): void {
        const poolLabelW = this.getPoolLabelWidth(el);
        const hasLaneLabels = laneCount > 1;
        const laneLabelW = hasLaneLabels ? this.getLaneLabelWidth(el) : 0;

        // Pool label column divider
        renderer.beginPath();
        renderer.moveTo(x + poolLabelW, y);
        renderer.lineTo(x + poolLabelW, y + h);
        renderer.stroke();

        // Lane label column divider (only if multiple lanes)
        if (hasLaneLabels) {
            renderer.beginPath();
            renderer.moveTo(x + poolLabelW + laneLabelW, y);
            renderer.lineTo(x + poolLabelW + laneLabelW, y + h);
            renderer.stroke();
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
                renderer.fillStyle = RenderPipeline.adjustColor(laneBg, isDarkMode);
                const laneBodyX = x + poolLabelW + laneLabelW;
                renderer.fillRect(laneBodyX, laneY, w - poolLabelW - laneLabelW, laneH);
            }

            // Collapsed lane: subtle hatching overlay
            if (isCollapsed) {
                renderer.fillStyle = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                const laneBodyX = x + poolLabelW + laneLabelW;
                renderer.fillRect(laneBodyX, laneY, w - poolLabelW - laneLabelW, laneH);
            }

            // Lane divider (skip first lane)
            if (i > 0) {
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.beginPath();
                renderer.moveTo(x + poolLabelW, laneY);
                renderer.lineTo(x + w, laneY);
                renderer.stroke();
            }

            // Per-lane label (rotated, in lane label column)
            if (hasLaneLabels) {
                const label = labels[i] || '';
                if (label) {
                    const laneTC = laneTextColors[i]
                        ? RenderPipeline.adjustColor(laneTextColors[i], isDarkMode)
                        : textColor;
                    renderer.save();
                    renderer.translate(x + poolLabelW + laneLabelW / 2, laneY + laneH / 2);
                    renderer.rotate(-Math.PI / 2);
                    renderer.textAlign = 'center';
                    renderer.textBaseline = 'middle';
                    renderer.fillStyle = laneTC;
                    renderer.font = smallFont;
                    // Clip text to lane height
                    const maxLen = laneH - 10;
                    const prefix = isCollapsed ? '\u25B8 ' : '';
                    let displayText = prefix + label;
                    if (renderer.measureText(displayText).width > maxLen && maxLen > 0) {
                        displayText = prefix + label;
                        while (displayText.length > prefix.length + 1 && renderer.measureText(displayText + '...').width > maxLen) {
                            displayText = displayText.slice(0, -1);
                        }
                        displayText += '...';
                    }
                    renderer.fillText(displayText, 0, 0);
                    renderer.restore();
                }
            }

            laneY += laneH;
        }

        // Pool name (rotated, in pool label column)
        if (el.containerText) {
            renderer.save();
            renderer.translate(x + poolLabelW / 2, y + h / 2);
            renderer.rotate(-Math.PI / 2);
            renderer.textAlign = 'center';
            renderer.textBaseline = 'middle';
            renderer.fillStyle = textColor;
            renderer.font = font;
            renderer.fillText(el.containerText, 0, 0);
            renderer.restore();
        }
    }

    private renderPoolVerticalArch(
        renderer: IRenderer, el: DrawingElement,
        x: number, y: number, w: number, h: number,
        laneCount: number, labels: string[],
        textColor: string, font: string, smallFont: string,
        isDarkMode: boolean
    ): void {
        const poolLabelH = this.getPoolLabelHeight(el);
        const hasLaneLabels = laneCount > 1;
        const laneLabelH = hasLaneLabels ? this.getLaneLabelHeight(el) : 0;

        // Pool label row divider
        renderer.beginPath();
        renderer.moveTo(x, y + poolLabelH);
        renderer.lineTo(x + w, y + poolLabelH);
        renderer.stroke();

        // Lane label row divider (only if multiple lanes)
        if (hasLaneLabels) {
            renderer.beginPath();
            renderer.moveTo(x, y + poolLabelH + laneLabelH);
            renderer.lineTo(x + w, y + poolLabelH + laneLabelH);
            renderer.stroke();
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
                renderer.fillStyle = RenderPipeline.adjustColor(laneBg, isDarkMode);
                const laneBodyY = y + poolLabelH + laneLabelH;
                renderer.fillRect(laneX, laneBodyY, laneW, h - poolLabelH - laneLabelH);
            }

            // Collapsed lane: subtle hatching overlay
            if (isCollapsed) {
                renderer.fillStyle = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                const laneBodyY = y + poolLabelH + laneLabelH;
                renderer.fillRect(laneX, laneBodyY, laneW, h - poolLabelH - laneLabelH);
            }

            // Lane divider (skip first lane)
            if (i > 0) {
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.beginPath();
                renderer.moveTo(laneX, y + poolLabelH);
                renderer.lineTo(laneX, y + h);
                renderer.stroke();
            }

            // Per-lane label (horizontal, in lane label row)
            if (hasLaneLabels) {
                const label = labels[i] || '';
                if (label) {
                    const laneTC = laneTextColors[i]
                        ? RenderPipeline.adjustColor(laneTextColors[i], isDarkMode)
                        : textColor;
                    renderer.save();
                    renderer.textAlign = 'center';
                    renderer.textBaseline = 'middle';
                    renderer.fillStyle = laneTC;
                    renderer.font = smallFont;
                    const maxLen = laneW - 10;
                    const prefix = isCollapsed ? '\u25B8 ' : '';
                    let displayText = prefix + label;
                    if (renderer.measureText(displayText).width > maxLen && maxLen > 0) {
                        displayText = prefix + label;
                        while (displayText.length > prefix.length + 1 && renderer.measureText(displayText + '...').width > maxLen) {
                            displayText = displayText.slice(0, -1);
                        }
                        displayText += '...';
                    }
                    renderer.fillText(displayText, laneX + laneW / 2, y + poolLabelH + laneLabelH / 2);
                    renderer.restore();
                }
            }

            laneX += laneW;
        }

        // Pool name (horizontal, in pool label row)
        if (el.containerText) {
            renderer.save();
            renderer.textAlign = 'center';
            renderer.textBaseline = 'middle';
            renderer.fillStyle = textColor;
            renderer.font = font;
            renderer.fillText(el.containerText, x + w / 2, y + poolLabelH / 2);
            renderer.restore();
        }
    }

    // ── Sketch Pool Rendering ──
    private renderPoolSketch(
        rc: any, renderer: IRenderer, el: DrawingElement,
        _cx: number, _cy: number, isDarkMode: boolean, options: any
    ): void {
        const { x, y, width: w, height: h } = el;
        const isVertical = el.bpmnOrientation === 'vertical';
        const laneCount = el.bpmnLaneCount ?? 1;
        const labels = el.isEditing ? [] : (el.bpmnLaneLabels ?? []);
        const textColor = RenderPipeline.adjustColor(el.textColor || el.strokeColor, isDarkMode);
        const font = fontShorthand(el.fontWeight, el.fontStyle, el.fontSize || 14, el.fontFamily || 'sans-serif');
        const smallFont = fontShorthand(el.fontWeight, el.fontStyle, Math.max((el.fontSize || 14) * 0.85, 10), el.fontFamily || 'sans-serif');

        // Outer rectangle
        rc.rectangle(x, y, w, h, options);

        // Suppress containerText when editing (labels already cleared above)
        const renderEl = el.isEditing ? { ...el, containerText: '' } : el;

        if (isVertical) {
            this.renderPoolVerticalSketch(rc, renderer, renderEl, x, y, w, h, laneCount, labels, textColor, font, smallFont, isDarkMode, options);
        } else {
            this.renderPoolHorizontalSketch(rc, renderer, renderEl, x, y, w, h, laneCount, labels, textColor, font, smallFont, isDarkMode, options);
        }
    }

    private renderPoolHorizontalSketch(
        rc: any, renderer: IRenderer, el: DrawingElement,
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
                renderer.fillStyle = RenderPipeline.adjustColor(laneBg, isDarkMode);
                const laneBodyX = x + poolLabelW + laneLabelW;
                renderer.fillRect(laneBodyX, laneY, w - poolLabelW - laneLabelW, laneH);
            }

            // Collapsed lane: subtle overlay
            if (isCollapsed) {
                renderer.fillStyle = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                const laneBodyX = x + poolLabelW + laneLabelW;
                renderer.fillRect(laneBodyX, laneY, w - poolLabelW - laneLabelW, laneH);
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
                    renderer.save();
                    renderer.translate(x + poolLabelW + laneLabelW / 2, laneY + laneH / 2);
                    renderer.rotate(-Math.PI / 2);
                    renderer.textAlign = 'center';
                    renderer.textBaseline = 'middle';
                    renderer.fillStyle = laneTC;
                    renderer.font = smallFont;
                    const maxLen = laneH - 10;
                    const prefix = isCollapsed ? '\u25B8 ' : '';
                    let displayText = prefix + label;
                    if (renderer.measureText(displayText).width > maxLen && maxLen > 0) {
                        displayText = prefix + label;
                        while (displayText.length > prefix.length + 1 && renderer.measureText(displayText + '...').width > maxLen) {
                            displayText = displayText.slice(0, -1);
                        }
                        displayText += '...';
                    }
                    renderer.fillText(displayText, 0, 0);
                    renderer.restore();
                }
            }

            laneY += laneH;
        }

        // Pool name
        if (el.containerText) {
            renderer.save();
            renderer.translate(x + poolLabelW / 2, y + h / 2);
            renderer.rotate(-Math.PI / 2);
            renderer.textAlign = 'center';
            renderer.textBaseline = 'middle';
            renderer.fillStyle = textColor;
            renderer.font = font;
            renderer.fillText(el.containerText, 0, 0);
            renderer.restore();
        }
    }

    private renderPoolVerticalSketch(
        rc: any, renderer: IRenderer, el: DrawingElement,
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
                renderer.fillStyle = RenderPipeline.adjustColor(laneBg, isDarkMode);
                const laneBodyY = y + poolLabelH + laneLabelH;
                renderer.fillRect(laneX, laneBodyY, laneW, h - poolLabelH - laneLabelH);
            }

            // Collapsed lane: subtle overlay
            if (isCollapsed) {
                renderer.fillStyle = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                const laneBodyY = y + poolLabelH + laneLabelH;
                renderer.fillRect(laneX, laneBodyY, laneW, h - poolLabelH - laneLabelH);
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
                    renderer.save();
                    renderer.textAlign = 'center';
                    renderer.textBaseline = 'middle';
                    renderer.fillStyle = laneTC;
                    renderer.font = smallFont;
                    const maxLen = laneW - 10;
                    const prefix = isCollapsed ? '\u25B8 ' : '';
                    let displayText = prefix + label;
                    if (renderer.measureText(displayText).width > maxLen && maxLen > 0) {
                        displayText = prefix + label;
                        while (displayText.length > prefix.length + 1 && renderer.measureText(displayText + '...').width > maxLen) {
                            displayText = displayText.slice(0, -1);
                        }
                        displayText += '...';
                    }
                    renderer.fillText(displayText, laneX + laneW / 2, y + poolLabelH + laneLabelH / 2);
                    renderer.restore();
                }
            }

            laneX += laneW;
        }

        // Pool name
        if (el.containerText) {
            renderer.save();
            renderer.textAlign = 'center';
            renderer.textBaseline = 'middle';
            renderer.fillStyle = textColor;
            renderer.font = font;
            renderer.fillText(el.containerText, x + w / 2, y + poolLabelH / 2);
            renderer.restore();
        }
    }

    // ── Helper: Draw a gear/cog ──
    private drawGear(renderer: IRenderer, cx: number, cy: number, r: number, teeth: number): void {
        const innerR = r * 0.55;
        const toothH = r * 0.35;
        renderer.beginPath();
        for (let i = 0; i < teeth; i++) {
            const a1 = (i * 2 * Math.PI) / teeth;
            const a2 = a1 + Math.PI / teeth * 0.4;
            const a3 = a1 + Math.PI / teeth * 0.6;
            const a4 = a1 + Math.PI / teeth;
            renderer.lineTo(cx + (r + toothH) * Math.cos(a1), cy + (r + toothH) * Math.sin(a1));
            renderer.lineTo(cx + (r + toothH) * Math.cos(a2), cy + (r + toothH) * Math.sin(a2));
            renderer.lineTo(cx + r * Math.cos(a3), cy + r * Math.sin(a3));
            renderer.lineTo(cx + r * Math.cos(a4), cy + r * Math.sin(a4));
        }
        renderer.closePath();
        renderer.stroke();
        renderer.beginPath();
        renderer.arc(cx, cy, innerR, 0, Math.PI * 2);
        renderer.stroke();
    }

    // ── Helper: Canvas roundRect path ──
    private roundRect(renderer: IRenderer, x: number, y: number, w: number, h: number, r: number): void {
        renderer.beginPath();
        renderer.moveTo(x + r, y);
        renderer.lineTo(x + w - r, y);
        renderer.arcTo(x + w, y, x + w, y + r, r);
        renderer.lineTo(x + w, y + h - r);
        renderer.arcTo(x + w, y + h, x + w - r, y + h, r);
        renderer.lineTo(x + r, y + h);
        renderer.arcTo(x, y + h, x, y + h - r, r);
        renderer.lineTo(x, y + r);
        renderer.arcTo(x, y, x + r, y, r);
        renderer.closePath();
    }

    // ── Helper: SVG round-rect path for RoughJS ──
    private getRoundRectPath(x: number, y: number, w: number, h: number, r: number): string {
        return `M ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
    }
}
