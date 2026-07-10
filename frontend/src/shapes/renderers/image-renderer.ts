import { ShapeRenderer } from "../base/shape-renderer";
import type { RenderContext } from "../base/types";
import type { IRenderer } from "../../rendering/IRenderer";
import { getImage } from "../../utils/image-cache";
import { generatePixelMask, applyPixelMaskToImage } from "../../utils/image-pixel-effects";
import { getEffectiveGrid } from "../../utils/envelope-warp";
import { drawWarpedImage } from "../../utils/image-warp";

export class ImageRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    /** Empty image element (no dataURL) → a dashed frame + image glyph + hint. Double-click it
     *  (or use Replace Image) to fill it. */
    private renderPlaceholder(renderer: IRenderer, el: RenderContext['element']): void {
        const { x, y, width: w, height: h } = el;
        const aw = Math.abs(w), ah = Math.abs(h);
        if (aw < 2 || ah < 2) return;
        renderer.save();
        renderer.fillStyle = 'rgba(148,163,184,0.12)';
        renderer.fillRect(x, y, w, h);
        renderer.strokeStyle = 'rgba(100,116,139,0.85)';
        renderer.lineWidth = 1.5;
        renderer.setLineDash([6, 4]);
        renderer.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
        renderer.setLineDash([]);
        // Image glyph (frame + sun + mountains), centred and scaled to the box.
        const cx = x + w / 2, cy = y + h / 2, s = Math.min(aw, ah) * 0.26;
        renderer.strokeStyle = 'rgba(100,116,139,0.9)';
        renderer.fillStyle = 'rgba(100,116,139,0.9)';
        renderer.lineWidth = Math.max(1.5, s * 0.09);
        renderer.strokeRect(cx - s, cy - s * 0.75, s * 2, s * 1.5);
        renderer.beginPath();
        renderer.arc(cx + s * 0.45, cy - s * 0.28, s * 0.22, 0, Math.PI * 2);
        renderer.fill();
        renderer.beginPath();
        renderer.moveTo(cx - s * 0.95, cy + s * 0.7);
        renderer.lineTo(cx - s * 0.3, cy - s * 0.05);
        renderer.lineTo(cx + s * 0.12, cy + s * 0.35);
        renderer.lineTo(cx + s * 0.55, cy - s * 0.2);
        renderer.lineTo(cx + s * 0.95, cy + s * 0.7);
        renderer.closePath();
        renderer.fill();
        if (ah > 64 && aw > 96) {
            renderer.fillStyle = 'rgba(100,116,139,0.95)';
            renderer.font = '12px system-ui, sans-serif';
            renderer.textAlign = 'center';
            renderer.textBaseline = 'middle';
            renderer.fillText('Click to add image', cx, y + h - 14);
        }
        renderer.restore();
    }

    private renderCommon(context: RenderContext): void {
        const { renderer, element: el } = context;
        if (!el.dataURL) { this.renderPlaceholder(renderer, el); return; }

        const img = getImage(el.dataURL);
        if (img) {
            // Envelope / mesh warp: texture-map the bitmap through the control grid.
            if (el.warp && this.renderWarped(context, img)) {
                return;
            }
            // Check if pixel effect is active
            if (el.pixelEffect && el.pixelEffectProgress !== undefined) {
                this.renderWithPixelEffect(context, img);
            } else {
                // Normal rendering without pixel effects
                if (el.crop) {
                    // Draw cropped region: source rect → destination rect
                    renderer.drawImageCropped(
                        img,
                        el.crop.x, el.crop.y, el.crop.width, el.crop.height,
                        el.x, el.y, el.width, el.height
                    );
                } else {
                    renderer.drawImage(img, el.x, el.y, el.width, el.height);
                }
            }
        } else {
            // Placeholder while loading
            renderer.save();
            renderer.fillStyle = "#e5e5e5";
            renderer.fillRect(el.x, el.y, el.width, el.height);
            renderer.fillStyle = "#999";
            renderer.font = "12px sans-serif";
            renderer.fillText("Loading image...", el.x + 10, el.y + 20);
            renderer.restore();
        }
    }

    /**
     * Warp the image through its `el.warp` mesh by tessellating a fine triangle grid and
     * affine-mapping each source-image triangle onto its warped destination triangle.
     * Returns false (caller falls back to a normal draw) if the canvas ctx isn't available.
     */
    private renderWarped(context: RenderContext, img: HTMLImageElement): boolean {
        const { renderer, element: el } = context;
        const ctx: CanvasRenderingContext2D | undefined = (renderer as any).ctx;
        if (!ctx || !(ctx instanceof CanvasRenderingContext2D)) return false;
        const grid = getEffectiveGrid(el.warp);
        if (!grid) return false;
        // Dest in world coords; the element CTM (rotate/flip/shear) is already on ctx.
        drawWarpedImage(ctx, img, el, grid, 0, 0);
        return true;
    }

    private renderWithPixelEffect(context: RenderContext, img: HTMLImageElement): void {
        const { renderer, element: el } = context;

        // Get the underlying canvas context (only works with canvas renderer)
        const ctx = (renderer as any).ctx;
        if (!ctx || !(ctx instanceof CanvasRenderingContext2D)) {
            // Fallback to normal rendering if not canvas
            renderer.drawImage(img, el.x, el.y, el.width, el.height);
            return;
        }

        try {
            // Create temporary canvas for processing
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = Math.floor(el.width);
            tempCanvas.height = Math.floor(el.height);
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;

            // Draw image to temp canvas (with crop if specified)
            if (el.crop) {
                tempCtx.drawImage(
                    img,
                    el.crop.x, el.crop.y, el.crop.width, el.crop.height,
                    0, 0, tempCanvas.width, tempCanvas.height
                );
            } else {
                tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
            }

            // Get image data
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

            // Generate pixel mask based on effect type and progress
            const maskData = generatePixelMask(
                tempCanvas.width,
                tempCanvas.height,
                el.pixelEffectProgress ?? 0,
                el.pixelEffect!,
                el.pixelEffectParams
            );

            // Apply mask to image
            const maskedImage = applyPixelMaskToImage(imageData, maskData);

            // Put masked image back
            tempCtx.putImageData(maskedImage, 0, 0);

            // Draw to main canvas
            ctx.drawImage(tempCanvas, el.x, el.y);

        } catch (error) {
            console.error('Error applying pixel effect:', error);
            // Fallback to normal rendering
            renderer.drawImage(img, el.x, el.y, el.width, el.height);
        }
    }

    protected definePath(renderer: IRenderer, el: any): void {
        renderer.rect(el.x, el.y, el.width, el.height);
    }
}
