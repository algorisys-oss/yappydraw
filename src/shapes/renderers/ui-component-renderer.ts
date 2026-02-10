/**
 * Generic UI Component Renderer
 * Dispatches rendering to data-driven shape definitions from ui-shape-defs.ts.
 */
import { ShapeRenderer } from '../base/shape-renderer';
import { RenderPipeline } from '../base/render-pipeline';
import type { RenderContext } from '../base/types';

import { getUIShapeDef, type UIShapeBounds, type UIRenderHelpers } from '../../config/ui-shape-defs';

export class UIComponentRenderer extends ShapeRenderer {

    private buildBounds(el: any): UIShapeBounds {
        return {
            x: el.x, y: el.y, w: el.width, h: el.height,
            cx: el.x + el.width / 2, cy: el.y + el.height / 2,
        };
    }

    private buildHelpers(context: RenderContext): UIRenderHelpers {
        const { element: el, isDarkMode } = context;
        const strokeColor = RenderPipeline.adjustColor(el.strokeColor, isDarkMode);
        const bgRaw = el.backgroundColor;
        const backgroundColor = (!bgRaw || bgRaw === 'transparent') ? undefined
            : RenderPipeline.adjustColor(bgRaw, isDarkMode);

        return {
            strokeColor,
            backgroundColor,
            applyStroke: (ctx) => RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode),
            buildRoughOptions: () => RenderPipeline.buildRenderOptions(el, isDarkMode),
            getRoundedRectPath: this.getRoundedRectPath,
            shadeColor: (color, percent) => RenderPipeline.shadeColor(color, percent),
        };
    }

    private getRoundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
        const rX = Math.min(Math.abs(w) / 2, r);
        const rY = Math.min(Math.abs(h) / 2, r);
        return `M ${x + rX} ${y} L ${x + w - rX} ${y} Q ${x + w} ${y} ${x + w} ${y + rY} ` +
            `L ${x + w} ${y + h - rY} Q ${x + w} ${y + h} ${x + w - rX} ${y + h} ` +
            `L ${x + rX} ${y + h} Q ${x} ${y + h} ${x} ${y + h - rY} ` +
            `L ${x} ${y + rY} Q ${x} ${y} ${x + rX} ${y}`;
    }

    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const def = getUIShapeDef(context.element.type);
        if (!def) return;

        const bounds = this.buildBounds(context.element);
        const helpers = this.buildHelpers(context);
        def.renderArchitectural(context.ctx, context.element, bounds, helpers);

        // Shapes with customTextRendering handle their own text
        if (def.customTextRendering) return;

        RenderPipeline.renderText(context, cx, cy);
    }

    protected renderSketch(context: RenderContext, cx: number, cy: number): void {
        const def = getUIShapeDef(context.element.type);
        if (!def) return;

        const bounds = this.buildBounds(context.element);
        const helpers = this.buildHelpers(context);
        def.renderSketch(context.rc, context.element, bounds, helpers, context.ctx);

        if (def.customTextRendering) return;
        RenderPipeline.renderText(context, cx, cy);
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        const def = getUIShapeDef(el.type);
        if (!def) {
            ctx.rect(el.x, el.y, el.width, el.height);
            return;
        }
        def.definePath(ctx, el);
    }
}
