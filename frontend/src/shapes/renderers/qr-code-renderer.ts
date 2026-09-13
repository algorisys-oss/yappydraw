import { ShapeRenderer } from "../base/shape-renderer";
import type { RenderContext } from "../base/types";
import type { IRenderer } from "../../rendering/IRenderer";
import { resolveFontFamily } from "../../utils/text-utils";
import { buildQrMatrix, qrRuns, qrLayout, QR_DEFAULTS } from "../../utils/qr-code";

/**
 * QR code — generated from `qrData` each frame (the matrix is cached). Both drawing styles
 * render identically: a rough.js wobble would stop the code scanning. Colours deliberately
 * skip RenderPipeline.adjustColor, which lightens darks in dark mode and would invert or
 * wash out the code.
 */
export class QrCodeRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    private renderCommon(context: RenderContext): void {
        const { renderer, element: el } = context;
        const left = Math.min(el.x, el.x + el.width);
        const top = Math.min(el.y, el.y + el.height);
        const w = Math.abs(el.width);
        const h = Math.abs(el.height);
        const light = el.backgroundColor ?? QR_DEFAULTS.light;
        const dark = el.strokeColor || QR_DEFAULTS.dark;

        renderer.save();
        if (light && light !== 'transparent' && light !== 'none') {
            renderer.fillStyle = light;
            renderer.fillRect(left, top, w, h);
        }

        const matrix = buildQrMatrix(el.qrData ?? '', el.qrErrorCorrection ?? QR_DEFAULTS.errorCorrection);
        if ('error' in matrix) {
            if (!context.suppressText && w > 40 && h > 20) {
                renderer.fillStyle = '#94a3b8';
                renderer.font = `${Math.max(10, Math.min(16, w / 12))}px ${resolveFontFamily('sans-serif')}`;
                renderer.textAlign = 'center';
                renderer.textBaseline = 'middle';
                renderer.fillText(matrix.error === 'empty' ? 'QR code — add data' : 'QR data too long',
                    left + w / 2, top + h / 2, w - 8);
            }
            renderer.restore();
            return;
        }

        const { cell, originX, originY } = qrLayout(el, matrix.size, el.qrQuietZone ?? QR_DEFAULTS.quietZone);
        // One path, one fill: adjacent modules filled as separate shapes leave anti-aliased
        // hairline seams between them at fractional zoom.
        renderer.fillStyle = dark;
        renderer.beginPath();
        for (const run of qrRuns(matrix.modules)) {
            renderer.rect(originX + run.x * cell, originY + run.y * cell, run.w * cell, cell);
        }
        renderer.fill();
        renderer.restore();
    }

    protected definePath(renderer: IRenderer, el: any): void {
        renderer.rect(el.x, el.y, el.width, el.height);
    }
}
