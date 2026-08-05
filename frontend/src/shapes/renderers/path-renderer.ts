import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import { normalizePoints } from "../../utils/render-element";
import { drawTextAlongPath } from "../../utils/text-on-path";
import { fontShorthand } from "../../utils/font-variants";
import type { IRenderer } from "../../rendering/IRenderer";

export class PathRenderer extends ShapeRenderer {
    /**
     * Override render to bypass the renderCustomPoints check.
     * Organic branches need their specialized rendering logic to create
     * tapered, curved branches instead of simple straight lines.
     */
    render(context: RenderContext) {
        const { renderer, element, layerOpacity } = context;

        // 1. Apply universal transformations (rotation, opacity, shadow)
        const { cx, cy } = RenderPipeline.applyTransformations(renderer, element, layerOpacity);

        // 2. Check for draw-in/draw-out animation
        const dp = element.drawProgress;
        if (dp != null && dp >= 0 && dp < 100) {
            this.renderDrawProgress(context, cx, cy);
        } else {
            // Normal render path - no complex fills for paths
            // 3. Delegate to specialized rendering methods based on style
            if (element.renderStyle === 'architectural') {
                this.renderArchitectural(context, cx, cy);
            } else {
                this.renderSketch(context, cx, cy);
            }
        }

        // 4. Flow Animation - handled in renderCommon via renderFlow

        // 5. Restore transformations
        RenderPipeline.restoreTransformations(renderer);
    }

    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    private renderCommon(context: RenderContext): void {
        const { renderer, element: el, isDarkMode } = context;
        const color = RenderPipeline.adjustColor(el.strokeColor, isDarkMode);

        if (el.type === 'organicBranch') {
            const pts = normalizePoints(el.points);
            const controls = el.controlPoints || [];
            if (pts.length < 2 || controls.length < 2) return;

            const start = { x: el.x + pts[0].x, y: el.y + pts[0].y };
            const end = { x: el.x + pts[pts.length - 1].x, y: el.y + pts[pts.length - 1].y };
            const cp1 = controls[0];
            const cp2 = controls[1];

            this.drawOrganicBranch(renderer, start, end, cp1, cp2, color, el.strokeWidth, el.isEditing ? "" : (el.containerText || ""), el);
            this.renderFlow(context, start, end, cp1, cp2);
        }
    }

    private renderFlow(context: RenderContext, start: { x: number, y: number }, end: { x: number, y: number }, cp1: { x: number, y: number }, cp2: { x: number, y: number }) {
        const { renderer, element: el, isDarkMode } = context;
        if (!el.flowAnimation) return;

        const time = (window as any).yappyGlobalTime || performance.now();
        const speed = (el.flowSpeed ?? 2) * 50;
        const direction = el.flowReverse ? -1 : 1;
        const offset = (time / 1000 * speed) * direction;
        const color = RenderPipeline.adjustColor(el.flowColor || el.strokeColor, isDarkMode);
        const pulseSize = Math.max(2, el.strokeWidth * 1.5);
        const gap = 100 / (el.flowDensity || 3);

        renderer.save();
        renderer.fillStyle = color;
        renderer.shadowBlur = el.flowStyle === 'pulse' ? pulseSize : 0;
        renderer.shadowColor = color;

        // Approximation of curve length
        const chord = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
        const contNet = Math.sqrt((cp1.x - start.x) ** 2 + (cp1.y - start.y) ** 2) +
            Math.sqrt((cp2.x - cp1.x) ** 2 + (cp2.y - cp1.y) ** 2) +
            Math.sqrt((end.x - cp2.x) ** 2 + (end.y - cp2.y) ** 2);
        const approxLen = (chord + contNet) / 2;

        const steps = Math.ceil(approxLen / 5);
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const d = t * approxLen;
            if (((d + offset) % gap + gap) % gap < speed / 10) {
                const px = this.cubicBezier(start.x, cp1.x, cp2.x, end.x, t);
                const py = this.cubicBezier(start.y, cp1.y, cp2.y, end.y, t);

                // Calculate tangent angle
                const tNext = Math.min(1, t + 0.01);
                const pNextX = this.cubicBezier(start.x, cp1.x, cp2.x, end.x, tNext);
                const pNextY = this.cubicBezier(start.y, cp1.y, cp2.y, end.y, tNext);
                const angle = Math.atan2(pNextY - py, pNextX - px);

                this.drawPulse(renderer, px, py, pulseSize, el.flowStyle, angle);
            }
        }

        renderer.restore();
    }

    private drawPulse(renderer: IRenderer, x: number, y: number, size: number, style?: string, angle: number = 0) {
        renderer.save();
        renderer.translate(x, y);
        renderer.rotate(angle);

        if (style === 'dashes') {
            renderer.fillRect(-size, -size / 2, size * 2, size);
        } else if (style === 'pulse') {
            renderer.beginPath();
            renderer.arc(0, 0, size * 1.5, 0, Math.PI * 2);
            const alpha = 0.5 + 0.5 * Math.sin(performance.now() / 100);
            renderer.globalAlpha *= alpha;
            renderer.fill();
        } else {
            // Default: dots
            renderer.beginPath();
            renderer.arc(0, 0, size, 0, Math.PI * 2);
            renderer.fill();
        }
        renderer.restore();
    }

    private cubicBezier(p0: number, p1: number, p2: number, p3: number, t: number) {
        const k = 1 - t;
        return k * k * k * p0 + 3 * k * k * t * p1 + 3 * k * t * t * p2 + t * t * t * p3;
    };

    private cubicBezierAngle(p0: { x: number, y: number }, p1: { x: number, y: number }, p2: { x: number, y: number }, p3: { x: number, y: number }, t: number) {
        const dx = 3 * (1 - t) * (1 - t) * (p1.x - p0.x) + 6 * (1 - t) * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
        const dy = 3 * (1 - t) * (1 - t) * (p1.y - p0.y) + 6 * (1 - t) * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
        return Math.atan2(dy, dx);
    };

    private drawOrganicBranch(
        renderer: IRenderer,
        start: { x: number, y: number },
        end: { x: number, y: number },
        cp1: { x: number, y: number },
        cp2: { x: number, y: number },
        color: string,
        width: number,
        text: string,
        el: any
    ) {
        const segments = 20;
        const pointsTop: { x: number, y: number }[] = [];
        const pointsBottom: { x: number, y: number }[] = [];

        const startWidth = Math.max(width * 8, 4);
        const endWidth = Math.max(width * 2, 2);

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = this.cubicBezier(start.x, cp1.x, cp2.x, end.x, t);
            const y = this.cubicBezier(start.y, cp1.y, cp2.y, end.y, t);
            const angle = this.cubicBezierAngle(start, cp1, cp2, end, t);

            const currentWidth = startWidth + (endWidth - startWidth) * t;
            const halfWidth = currentWidth / 2;

            const offsetX = Math.cos(angle + Math.PI / 2) * halfWidth;
            const offsetY = Math.sin(angle + Math.PI / 2) * halfWidth;

            pointsTop.push({ x: x + offsetX, y: y + offsetY });
            pointsBottom.push({ x: x - offsetX, y: y - offsetY });
        }

        renderer.beginPath();
        renderer.moveTo(pointsTop[0].x, pointsTop[0].y);
        for (let i = 1; i < pointsTop.length; i++) renderer.lineTo(pointsTop[i].x, pointsTop[i].y);
        renderer.lineTo(pointsBottom[pointsBottom.length - 1].x, pointsBottom[pointsBottom.length - 1].y);
        for (let i = pointsBottom.length - 2; i >= 0; i--) renderer.lineTo(pointsBottom[i].x, pointsBottom[i].y);
        renderer.closePath();
        renderer.fillStyle = color;
        renderer.fill();

        // Draw arrowheads at start/end (scale to branch width)
        if (el.startArrowhead) {
            const startAngle = this.cubicBezierAngle(start, cp1, cp2, end, 0) + Math.PI;
            const headLen = el.startArrowheadSize || Math.max(startWidth * 0.75, 28);
            // Offset away from the branch so it doesn't overlap the wide body
            const ox = Math.cos(startAngle) * headLen * 0.6;
            const oy = Math.sin(startAngle) * headLen * 0.6;
            this.drawArrowhead(renderer, start.x + ox, start.y + oy, startAngle, el.startArrowhead, color, headLen);
        }
        if (el.endArrowhead) {
            const endAngle = this.cubicBezierAngle(start, cp1, cp2, end, 1);
            const headLen = el.endArrowheadSize || Math.max(endWidth * 1.5, 28);
            this.drawArrowhead(renderer, end.x, end.y, endAngle, el.endArrowhead, color, headLen);
        }

        if (text) {
            renderer.save();
            const fontSize = el.fontSize || 16;
            const fontFamily = el.fontFamily || 'sans-serif';
            renderer.font = fontShorthand(el.fontWeight, el.fontStyle, fontSize, fontFamily);
            renderer.fillStyle = el.textColor || color;

            if (el.curvedText) {
                this.drawCurvedText(renderer, text, start, cp1, cp2, end, fontSize);
            } else {
                renderer.textAlign = 'center';
                renderer.textBaseline = 'middle';
                const centerX = this.cubicBezier(start.x, cp1.x, cp2.x, end.x, 0.5);
                const centerY = this.cubicBezier(start.y, cp1.y, cp2.y, end.y, 0.5);
                const angle = this.cubicBezierAngle(start, cp1, cp2, end, 0.5);
                const textOffset = -15;
                renderer.translate(centerX, centerY);
                let rawAngle = angle;
                if (rawAngle > Math.PI / 2 || rawAngle < -Math.PI / 2) rawAngle += Math.PI;
                renderer.rotate(rawAngle);
                renderer.fillText(text, 0, textOffset);
            }
            renderer.restore();
        }
    }

    private drawCurvedText(
        renderer: IRenderer,
        text: string,
        start: { x: number, y: number },
        cp1: { x: number, y: number },
        cp2: { x: number, y: number },
        end: { x: number, y: number },
        fontSize: number
    ) {
        // Sample this branch's cubic bezier into a polyline, then defer to the
        // shared arc-length engine (one implementation for every path type).
        const steps = 200;
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            pts.push({
                x: this.cubicBezier(start.x, cp1.x, cp2.x, end.x, t),
                y: this.cubicBezier(start.y, cp1.y, cp2.y, end.y, t),
            });
        }
        drawTextAlongPath(renderer, text, pts, fontSize);
    }

    private drawArrowhead(renderer: IRenderer, x: number, y: number, angle: number, type: string, color: string, headLen: number = 12) {
        renderer.save();
        renderer.translate(x, y);
        renderer.rotate(angle);
        renderer.strokeStyle = color;
        renderer.lineWidth = 2;
        renderer.setLineDash([]);

        if (type === 'triangle' || type === 'arrow') {
            renderer.beginPath();
            renderer.moveTo(0, 0);
            renderer.lineTo(-headLen * Math.cos(Math.PI / 6), -headLen * Math.sin(Math.PI / 6));
            if (type === 'triangle') {
                renderer.lineTo(-headLen * Math.cos(-Math.PI / 6), -headLen * Math.sin(-Math.PI / 6));
                renderer.closePath();
                renderer.fillStyle = '#ffffff';
                renderer.fill();
            } else {
                renderer.moveTo(0, 0);
                renderer.lineTo(-headLen * Math.cos(-Math.PI / 6), -headLen * Math.sin(-Math.PI / 6));
            }
            renderer.stroke();
        } else if (type === 'circle' || type === 'dot') {
            renderer.beginPath();
            renderer.arc(-headLen / 2, 0, headLen / 2, 0, Math.PI * 2);
            renderer.fillStyle = type === 'dot' ? color : '#ffffff';
            renderer.fill();
            renderer.stroke();
        } else if (type === 'diamond' || type === 'diamondFilled') {
            renderer.beginPath();
            renderer.moveTo(0, 0);
            renderer.lineTo(-headLen, -headLen / 2);
            renderer.lineTo(-headLen * 2, 0);
            renderer.lineTo(-headLen, headLen / 2);
            renderer.closePath();
            renderer.fillStyle = type === 'diamondFilled' ? color : '#ffffff';
            renderer.fill();
            renderer.stroke();
        } else if (type === 'crowsfoot') {
            renderer.beginPath();
            renderer.moveTo(0, 0);
            renderer.lineTo(-headLen * Math.cos(Math.PI / 4), -headLen * Math.sin(Math.PI / 4));
            renderer.moveTo(0, 0);
            renderer.lineTo(-headLen * Math.cos(-Math.PI / 4), -headLen * Math.sin(-Math.PI / 4));
            renderer.moveTo(0, 0);
            renderer.lineTo(-headLen, 0);
            renderer.stroke();
        } else if (type === 'bar') {
            renderer.beginPath();
            renderer.moveTo(0, -headLen);
            renderer.lineTo(0, headLen);
            renderer.stroke();
        }
        renderer.restore();
    }

    protected definePath(renderer: IRenderer, el: any): void {
        if (el.type === 'organicBranch') {
            const pts = normalizePoints(el.points);
            const controls = el.controlPoints || [];
            if (pts.length < 2 || controls.length < 2) return;

            const start = { x: el.x + pts[0].x, y: el.y + pts[0].y };
            const end = { x: el.x + pts[pts.length - 1].x, y: el.y + pts[pts.length - 1].y };
            const cp1 = controls[0];
            const cp2 = controls[1];

            renderer.moveTo(start.x, start.y);
            renderer.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
        }
    }
}
