import { ShapeRenderer } from "../base/shape-renderer";
import type { RenderContext } from "../base/types";
import type { IRenderer } from "../../rendering/IRenderer";
import { getImage } from "../../utils/image-cache";

export class VideoRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    private renderCommon(context: RenderContext): void {
        const { renderer, element: el } = context;

        // Draw poster/thumbnail if available
        const posterSrc = el.videoPosterDataURL || el.videoPosterURL;
        if (posterSrc) {
            const img = getImage(posterSrc);
            if (img) {
                renderer.drawImage(img, el.x, el.y, el.width, el.height);
            } else {
                this.drawPlaceholder(renderer, el);
            }
        } else {
            this.drawPlaceholder(renderer, el);
        }

        // Draw play button overlay
        this.drawPlayButton(renderer, el);
    }

    private drawPlaceholder(renderer: IRenderer, el: any): void {
        renderer.save();
        // Dark background
        renderer.fillStyle = "#1a1a2e";
        renderer.fillRect(el.x, el.y, el.width, el.height);
        // Border
        renderer.strokeStyle = "#333";
        renderer.lineWidth = 1;
        renderer.strokeRect(el.x, el.y, el.width, el.height);
        // URL label at the bottom
        renderer.fillStyle = "#666";
        renderer.font = "11px sans-serif";
        renderer.textAlign = "center";
        renderer.textBaseline = "middle";
        const label = el.videoURL
            ? (el.videoURL.length > 50 ? el.videoURL.slice(0, 47) + '...' : el.videoURL)
            : "No video URL";
        renderer.fillText(label, el.x + el.width / 2, el.y + el.height - 16);
        renderer.restore();
    }

    private drawPlayButton(renderer: IRenderer, el: any): void {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        const r = Math.min(el.width, el.height) * 0.15;
        const minR = 18;
        const actualR = Math.max(r, minR);

        renderer.save();

        // Semi-transparent circle background
        renderer.fillStyle = "rgba(0, 0, 0, 0.55)";
        renderer.beginPath();
        renderer.arc(cx, cy, actualR, 0, Math.PI * 2);
        renderer.fill();

        // White play triangle (pointing right)
        renderer.fillStyle = "#ffffff";
        renderer.beginPath();
        const triH = actualR * 0.6;
        const triW = triH * 0.9;
        // Shift slightly right for optical centering
        const offsetX = triW * 0.1;
        renderer.moveTo(cx - triW / 2 + offsetX, cy - triH);
        renderer.lineTo(cx + triW + offsetX, cy);
        renderer.lineTo(cx - triW / 2 + offsetX, cy + triH);
        renderer.closePath();
        renderer.fill();

        renderer.restore();
    }

    protected definePath(renderer: IRenderer, el: any): void {
        renderer.rect(el.x, el.y, el.width, el.height);
    }
}
