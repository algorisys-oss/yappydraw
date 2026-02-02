import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";

export class ContainerRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { ctx, element: el, isDarkMode } = context;
        const strokeColor = RenderPipeline.adjustColor(el.strokeColor, isDarkMode);
        const backgroundColor = el.backgroundColor === 'transparent' ? undefined : RenderPipeline.adjustColor(el.backgroundColor, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            case 'browserWindow': {
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(x, y, w, h);
                }
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = el.strokeWidth;
                ctx.strokeRect(x, y, w, h);
                // Header
                const headerH = Math.min(h * 0.15, 30);
                ctx.strokeRect(x, y, w, headerH);
                // Buttons
                const btnR = 4;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.arc(x + 10 + i * 15, y + headerH / 2, btnR, 0, Math.PI * 2);
                    ctx.stroke();
                }
                break;
            }
            case 'mobilePhone': {
                const radius = 20;
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.roundRect(x, y, w, h, radius);
                    ctx.fill();
                }
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = el.strokeWidth;
                ctx.beginPath();
                ctx.roundRect(x, y, w, h, radius);
                ctx.stroke();
                // Screen
                const screenPadding = 10;
                ctx.strokeRect(x + screenPadding, y + screenPadding + 20, w - 2 * screenPadding, h - 2 * screenPadding - 40);
                // Button
                ctx.beginPath();
                ctx.arc(x + w / 2, y + h - 20, 10, 0, Math.PI * 2);
                ctx.stroke();
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
            case 'browserWindow': {
                rc.rectangle(x, y, w, h, options);
                const headerH = Math.min(h * 0.15, 30);
                rc.rectangle(x, y, w, headerH, options);
                for (let i = 0; i < 3; i++) {
                    rc.circle(x + 10 + i * 15, y + headerH / 2, 8, options);
                }
                break;
            }
            case 'mobilePhone': {
                const radius = 20;
                const path = this.getRoundedRectPath(x, y, w, h, radius);
                rc.path(path, options);
                const screenPadding = 10;
                rc.rectangle(x + screenPadding, y + screenPadding + 20, w - 2 * screenPadding, h - 2 * screenPadding - 40, options);
                rc.circle(x + w / 2, y + h - 20, 20, options);
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
        const x = el.x, y = el.y, w = el.width, h = el.height;
        if (el.type === 'mobilePhone') {
            const radius = 20;
            ctx.roundRect(x, y, w, h, radius);
        } else {
            // browserWindow
            ctx.rect(x, y, w, h);
        }
    }
}
