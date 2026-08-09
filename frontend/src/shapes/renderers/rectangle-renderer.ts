import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import type { IRenderer } from "../../rendering/IRenderer";
import { cornerRadiiPx, roundRectRadii, roundedRectPath, type CornerRadii } from "../../utils/corner-radius";

export class RectangleRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { renderer, element: el, isDarkMode } = context;
        const radii = cornerRadiiPx(el);
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);

        this.drawRectArch(renderer, el, isDarkMode, radii, options.fill);

        if (el.drawInnerBorder) {
            const dist = el.innerBorderDistance || 5;
            if (el.width > dist * 2 && el.height > dist * 2) {
                // The inset border keeps each corner's own curvature, just tighter.
                const innerR = radii.map(r => Math.max(0, r - dist)) as CornerRadii;
                this.drawRectArch(renderer, { ...el, x: el.x + dist, y: el.y + dist, width: el.width - dist * 2, height: el.height - dist * 2, strokeColor: el.innerBorderColor || el.strokeColor }, isDarkMode, innerR, 'none');
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    protected renderSketch(context: RenderContext, cx: number, cy: number): void {
        const { rc, element: el, isDarkMode } = context;
        const radii = cornerRadiiPx(el);
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);

        this.drawRectSketch(rc, el.x, el.y, el.width, el.height, radii, options);

        if (el.drawInnerBorder) {
            const dist = el.innerBorderDistance || 5;
            if (el.width > dist * 2 && el.height > dist * 2) {
                const innerR = radii.map(r => Math.max(0, r - dist)) as CornerRadii;
                const innerOpts = { ...options, stroke: el.innerBorderColor || options.stroke, fill: 'none' };
                this.drawRectSketch(rc, el.x + dist, el.y + dist, el.width - dist * 2, el.height - dist * 2, innerR, innerOpts);
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    private drawRectArch(renderer: IRenderer, el: any, isDarkMode: boolean, radii: CornerRadii, fill?: string) {
        const rounded = radii.some(r => r > 0);
        const trace = () => {
            renderer.beginPath();
            if (rounded) renderer.roundRect(el.x, el.y, el.width, el.height, radii);
            else renderer.rect(el.x, el.y, el.width, el.height);
        };

        if (fill && fill !== 'transparent' && fill !== 'none') {
            trace();
            renderer.fillStyle = fill;
            renderer.fill();
        }

        trace();
        RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
        renderer.stroke();
    }

    private drawRectSketch(rc: any, x: number, y: number, w: number, h: number, radii: CornerRadii, options: any) {
        if (radii.some(r => r > 0)) {
            rc.path(roundedRectPath(x, y, w, h, radii), options);
        } else {
            rc.rectangle(x, y, w, h, options);
        }
    }

    protected definePath(renderer: IRenderer, el: any): void {
        const radii = roundRectRadii(el);
        const rounded = Array.isArray(radii) ? radii.some(r => r > 0) : radii > 0;
        if (rounded) {
            renderer.roundRect(el.x, el.y, el.width, el.height, radii as any);
        } else {
            renderer.rect(el.x, el.y, el.width, el.height);
        }
    }
}
