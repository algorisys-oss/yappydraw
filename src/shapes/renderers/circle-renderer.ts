import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";

export class CircleRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { ctx, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);

        this.drawCircleArch(ctx, el, isDarkMode, options.fill);

        if (el.drawInnerBorder) {
            const dist = el.innerBorderDistance || 5;
            if (el.width > dist * 2 && el.height > dist * 2) {
                this.drawCircleArch(ctx, { ...el, x: el.x + dist, y: el.y + dist, width: el.width - dist * 2, height: el.height - dist * 2, strokeColor: el.innerBorderColor || el.strokeColor }, isDarkMode, 'none');
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    protected renderSketch(context: RenderContext, cx: number, cy: number): void {
        const { rc, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);

        rc.ellipse(el.x + el.width / 2, el.y + el.height / 2, Math.abs(el.width), Math.abs(el.height), options);

        if (el.drawInnerBorder) {
            const dist = el.innerBorderDistance || 5;
            if (el.width > dist * 2 && el.height > dist * 2) {
                const innerOpts = { ...options, stroke: el.innerBorderColor || options.stroke, fill: 'none' };
                rc.ellipse(el.x + el.width / 2, el.y + el.height / 2, Math.abs(el.width) - dist * 2, Math.abs(el.height) - dist * 2, innerOpts);
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    private drawCircleArch(ctx: CanvasRenderingContext2D, el: any, isDarkMode: boolean, fill?: string) {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        const rx = Math.abs(el.width) / 2;
        const ry = Math.abs(el.height) / 2;

        if (fill && fill !== 'transparent' && fill !== 'none') {
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.fillStyle = fill;
            ctx.fill();
        }

        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
        ctx.stroke();
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        const rx = Math.abs(el.width) / 2;
        const ry = Math.abs(el.height) / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    }

    estimatePathLength(element: any): number {
        const rx = Math.abs(element.width) / 2;
        const ry = Math.abs(element.height) / 2;
        // Ramanujan's approximation for ellipse perimeter
        const h = ((rx - ry) ** 2) / ((rx + ry) ** 2 || 1);
        return Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
    }
}
