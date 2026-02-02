import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";

export class RectangleRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { ctx, element: el, isDarkMode } = context;
        const radius = this.getRadius(el);
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);

        this.drawRectArch(ctx, el, isDarkMode, radius, options.fill);

        if (el.drawInnerBorder) {
            const dist = el.innerBorderDistance || 5;
            if (el.width > dist * 2 && el.height > dist * 2) {
                const innerR = Math.max(0, radius - dist);
                this.drawRectArch(ctx, { ...el, x: el.x + dist, y: el.y + dist, width: el.width - dist * 2, height: el.height - dist * 2, strokeColor: el.innerBorderColor || el.strokeColor }, isDarkMode, innerR, 'none');
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    protected renderSketch(context: RenderContext, cx: number, cy: number): void {
        const { rc, element: el, isDarkMode } = context;
        const radius = this.getRadius(el);
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);

        this.drawRectSketch(rc, el.x, el.y, el.width, el.height, radius, options);

        if (el.drawInnerBorder) {
            const dist = el.innerBorderDistance || 5;
            if (el.width > dist * 2 && el.height > dist * 2) {
                const innerR = Math.max(0, radius - dist);
                const innerOpts = { ...options, stroke: el.innerBorderColor || options.stroke, fill: 'none' };
                this.drawRectSketch(rc, el.x + dist, el.y + dist, el.width - dist * 2, el.height - dist * 2, innerR, innerOpts);
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    private getRadius(el: any): number {
        return el.borderRadius !== undefined
            ? Math.min(Math.abs(el.width), Math.abs(el.height)) * (el.borderRadius / 100)
            : (el.roundness ? Math.min(Math.abs(el.width), Math.abs(el.height)) * 0.15 : 0);
    }

    private drawRectArch(ctx: CanvasRenderingContext2D, el: any, isDarkMode: boolean, r: number, fill?: string) {
        if (fill && fill !== 'transparent' && fill !== 'none') {
            ctx.beginPath();
            if (r > 0) ctx.roundRect(el.x, el.y, el.width, el.height, r);
            else ctx.rect(el.x, el.y, el.width, el.height);
            ctx.fillStyle = fill;
            ctx.fill();
        }

        ctx.beginPath();
        if (r > 0) ctx.roundRect(el.x, el.y, el.width, el.height, r);
        else ctx.rect(el.x, el.y, el.width, el.height);
        RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
        ctx.stroke();
    }

    private drawRectSketch(rc: any, x: number, y: number, w: number, h: number, r: number, options: any) {
        if (r > 0) {
            const path = this.getRoundedRectPath(x, y, w, h, r);
            rc.path(path, options);
        } else {
            rc.rectangle(x, y, w, h, options);
        }
    }

    private getRoundedRectPath(x: number, y: number, w: number, h: number, r: number) {
        const rX = Math.min(Math.abs(w) / 2, r);
        const rY = Math.min(Math.abs(h) / 2, r);
        return `M ${x + rX} ${y} L ${x + w - rX} ${y} Q ${x + w} ${y} ${x + w} ${y + rY} L ${x + w} ${y + h - rY} Q ${x + w} ${y + h} ${x + w - rX} ${y + h} L ${x + rX} ${y + h} Q ${x} ${y + h} ${x} ${y + h - rY} L ${x} ${y + rY} Q ${x} ${y} ${x + rX} ${y}`;
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        const radius = this.getRadius(el);
        if (radius > 0) {
            ctx.roundRect(el.x, el.y, el.width, el.height, radius);
        } else {
            ctx.rect(el.x, el.y, el.width, el.height);
        }
    }
}
