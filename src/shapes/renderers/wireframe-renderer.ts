import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import { measureContainerText } from "../../utils/text-utils";

export class WireframeRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { ctx, element: el, isDarkMode } = context;
        const strokeColor = RenderPipeline.adjustColor(el.strokeColor, isDarkMode);
        const backgroundColor = el.backgroundColor === 'transparent' ? undefined : RenderPipeline.adjustColor(el.backgroundColor, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            case 'browser': {
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(x, y, w, h);
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.strokeRect(x, y, w, h);
                const headerH = h * 0.15;
                ctx.beginPath(); ctx.moveTo(x, y + headerH); ctx.lineTo(x + w, y + headerH);
                ctx.stroke();
                ctx.fillStyle = strokeColor;
                const dotR = headerH * 0.2;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath(); ctx.arc(x + headerH * (0.5 + i * 0.6), y + headerH / 2, dotR, 0, Math.PI * 2); ctx.fill();
                }
                break;
            }
            case 'ghostButton': {
                const r = Math.min(w, h) * 0.2;
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.roundRect(x, y, w, h, r);
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.roundRect(x, y, w, h, r);
                ctx.stroke();
                break;
            }
            case 'inputField': {
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(x, y, w, h);
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.strokeRect(x, y, w, h);
                // Cursor
                ctx.beginPath();
                ctx.moveTo(x + 10, y + 8);
                ctx.lineTo(x + 10, y + h - 8);
                ctx.stroke();

                // Custom text rendering for input field (left aligned)
                if (el.containerText) {
                    ctx.save();
                    ctx.textAlign = 'left';
                    const leftX = x + 25;
                    const metrics = measureContainerText(ctx, el, el.containerText, w - 30);
                    const startY = y + (h - metrics.textHeight) / 2 + metrics.lineHeight / 2;
                    ctx.fillStyle = strokeColor;
                    metrics.lines.forEach((line, index) => {
                        ctx.fillText(line, leftX, startY + index * metrics.lineHeight);
                    });
                    ctx.restore();
                    return; // Done rendering text
                }
                break;
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    protected renderSketch(context: RenderContext, cx: number, cy: number): void {
        const { rc, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const strokeColor = RenderPipeline.adjustColor(el.strokeColor, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            case 'browser': {
                rc.rectangle(x, y, w, h, options);
                const headerH = h * 0.15;
                rc.line(x, y + headerH, x + w, y + headerH, options);
                const dotR = headerH * 0.3;
                for (let i = 0; i < 3; i++) {
                    rc.circle(x + headerH * (0.5 + i * 0.6), y + headerH / 2, dotR, { ...options, fillStyle: 'solid', fill: strokeColor });
                }
                break;
            }
            case 'ghostButton': {
                const r = Math.min(w, h) * 0.2;
                const path = this.getRoundedRectPath(x, y, w, h, r);
                rc.path(path, { ...options, strokeLineDash: [4, 4] });
                break;
            }
            case 'inputField': {
                rc.rectangle(x, y, w, h, options);
                rc.line(x + 10, y + 8, x + 10, y + h - 8, options);
                break;
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    private getRoundedRectPath(x: number, y: number, w: number, h: number, r: number) {
        const rX = Math.min(Math.abs(w) / 2, r);
        const rY = Math.min(Math.abs(h) / 2, r);
        return `M ${x + rX} ${y} L ${x + w - rX} ${y} Q ${x + w} ${y} ${x + w} ${y + rY} L ${x + w} ${y + h - rY} Q ${x + w} ${y + h} ${x + w - rX} ${y + h} L ${x + rX} ${y + h} Q ${x} ${y + h} ${x} ${y + h - rY} L ${x} ${y + rY} Q ${x} ${y} ${x + rX} ${y}`;
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        if (el.type === 'ghostButton') {
            const r = Math.min(el.width, el.height) * 0.2;
            ctx.roundRect(el.x, el.y, el.width, el.height, r);
        } else {
            ctx.rect(el.x, el.y, el.width, el.height);
        }
    }
}
