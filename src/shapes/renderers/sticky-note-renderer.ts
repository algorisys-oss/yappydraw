import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";

export class StickyNoteRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { rc, ctx, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const { mainPoints, foldPoints } = this.getPoints(el);

        const fillVisible = options.fill && options.fill !== 'transparent' && options.fill !== 'none';
        if (fillVisible) {
            rc.polygon(mainPoints, { ...options, stroke: 'none', fill: options.fill });
            rc.polygon(foldPoints, { ...options, stroke: 'none', fill: options.fill, fillStyle: 'solid' });
        }

        ctx.beginPath();
        ctx.moveTo(mainPoints[0][0], mainPoints[0][1]);
        for (let i = 1; i < mainPoints.length; i++) ctx.lineTo(mainPoints[i][0], mainPoints[i][1]);
        ctx.closePath();
        RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(foldPoints[0][0], foldPoints[0][1]);
        ctx.lineTo(foldPoints[1][0], foldPoints[1][1]);
        ctx.lineTo(foldPoints[2][0], foldPoints[2][1]);
        RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
        ctx.stroke();

        RenderPipeline.renderText(context, cx, cy);
    }

    protected renderSketch(context: RenderContext, cx: number, cy: number): void {
        const { rc, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const { mainPoints, foldPoints } = this.getPoints(el);

        rc.polygon(mainPoints, options);
        rc.polygon(foldPoints, { ...options, fillStyle: 'solid' });

        RenderPipeline.renderText(context, cx, cy);
    }

    private getPoints(el: any) {
        const fold = Math.min(Math.abs(el.width), Math.abs(el.height)) * 0.15;
        const x = el.x, y = el.y, w = el.width, h = el.height;

        const mainPoints: [number, number][] = [
            [x, y],
            [x + w, y],
            [x + w, y + h - fold],
            [x + w - fold, y + h],
            [x, y + h]
        ];

        const foldPoints: [number, number][] = [
            [x + w, y + h - fold],
            [x + w - fold, y + h - fold],
            [x + w - fold, y + h]
        ];

        return { mainPoints, foldPoints };
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        const { mainPoints, foldPoints } = this.getPoints(el);

        // Define path for main body
        ctx.moveTo(mainPoints[0][0], mainPoints[0][1]);
        for (let i = 1; i < mainPoints.length; i++) ctx.lineTo(mainPoints[i][0], mainPoints[i][1]);
        ctx.closePath();

        // Should we stroke the fold as part of the flow? Yes.
        // But definePath creates a single path. If we closePath, the next moveTo starts a subpath.
        ctx.moveTo(foldPoints[0][0], foldPoints[0][1]);
        ctx.lineTo(foldPoints[1][0], foldPoints[1][1]);
        ctx.lineTo(foldPoints[2][0], foldPoints[2][1]);
        // Don't close fold triangle, usually it's open on diagonal? No, it's a triangle.
        // But renderArchitectural strokes 3 lines.
    }
}
