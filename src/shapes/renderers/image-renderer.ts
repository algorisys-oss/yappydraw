import { ShapeRenderer } from "../base/shape-renderer";
import type { RenderContext } from "../base/types";
import { getImage } from "../../utils/image-cache";

export class ImageRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    private renderCommon(context: RenderContext): void {
        const { ctx, element: el } = context;
        if (!el.dataURL) return;

        const img = getImage(el.dataURL);
        if (img) {
            ctx.drawImage(img, el.x, el.y, el.width, el.height);
        } else {
            // Placeholder while loading
            ctx.save();
            ctx.fillStyle = "#e5e5e5";
            ctx.fillRect(el.x, el.y, el.width, el.height);
            ctx.fillStyle = "#999";
            ctx.font = "12px sans-serif";
            ctx.fillText("Loading image...", el.x + 10, el.y + 20);
            ctx.restore();
        }
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        ctx.rect(el.x, el.y, el.width, el.height);
    }
}
