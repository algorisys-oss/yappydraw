import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import { resolveFontFamily } from "../../utils/text-utils";

export class TextRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    private renderCommon(context: RenderContext): void {
        const { ctx, element: el, isDarkMode } = context;
        if (!el.text) return;

        const fontSize = el.fontSize || 20;
        const fontFamily = resolveFontFamily(el.fontFamily);
        const fontWeight = (el.fontWeight === true || el.fontWeight === 'bold') ? 'bold ' : '';
        const fontStyle = (el.fontStyle === true || el.fontStyle === 'italic') ? 'italic ' : '';

        ctx.save();
        ctx.font = `${fontStyle}${fontWeight}${fontSize}px ${fontFamily}`;

        const lines = el.text.split('\n');
        const lineHeight = fontSize * 1.2;

        // Text Stretching logic (only for single-line text elements without highlight)
        const isSingleLine = lines.length === 1;
        const metrics = ctx.measureText(el.text);
        const actualWidth = metrics.width;
        const scaleX = (isSingleLine && el.width && actualWidth && !el.textHighlightEnabled) ? (el.width / actualWidth) : 1;

        const textColorRaw = el.textColor || el.strokeColor;
        const textColor = RenderPipeline.adjustColor(textColorRaw, isDarkMode);

        // Apply text alignment
        const textAlign = el.textAlign || 'left';
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'hanging';

        if (el.textHighlightEnabled) {
            const highlightColor = el.textHighlightColor || 'rgba(255, 255, 0, 0.4)';
            const padding = el.textHighlightPadding ?? 4;
            const radius = el.textHighlightRadius ?? 2;

            ctx.fillStyle = RenderPipeline.adjustColor(highlightColor, isDarkMode);

            // Baseline adjustment for better visual centering
            const baselineShift = el.fontFamily === 'hand-drawn' ? -2 : 0;

            // Calculate x position based on alignment
            const getXPosition = (lineWidth: number) => {
                if (textAlign === 'center') {
                    return el.x + (el.width || lineWidth) / 2;
                } else if (textAlign === 'right') {
                    return el.x + (el.width || lineWidth);
                }
                return el.x;
            };

            lines.forEach((line, index) => {
                const lineWidth = ctx.measureText(line).width;
                const xPos = getXPosition(lineWidth);
                const yOffset = el.y + index * lineHeight + baselineShift;
                const vPadding = padding / 2;

                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(
                        xPos - (textAlign === 'center' ? lineWidth / 2 : 0) - padding,
                        yOffset - vPadding,
                        lineWidth + padding * 2,
                        lineHeight + vPadding * 2,
                        radius
                    );
                } else {
                    ctx.rect(
                        xPos - (textAlign === 'center' ? lineWidth / 2 : 0) - padding,
                        yOffset - vPadding,
                        lineWidth + padding * 2,
                        lineHeight + vPadding * 2
                    );
                }
                ctx.fill();
            });

            ctx.fillStyle = textColor;
            lines.forEach((line, index) => {
                const lineWidth = ctx.measureText(line).width;
                const xPos = getXPosition(lineWidth);
                const yOffset = el.y + index * lineHeight;
                ctx.fillText(line, xPos, yOffset);
            });
        } else {
            ctx.fillStyle = textColor;

            // Calculate x position based on alignment
            let xPos = el.x;
            if (textAlign === 'center') {
                xPos = el.x + (el.width || actualWidth) / 2;
            } else if (textAlign === 'right') {
                xPos = el.x + (el.width || actualWidth);
            }

            if (scaleX !== 1) {
                // Single-line text with width stretching
                ctx.translate(xPos, el.y);
                ctx.scale(scaleX, 1);
                ctx.fillText(el.text, 0, 0);
            } else {
                // Render each line at the correct Y offset
                lines.forEach((line, index) => {
                    ctx.fillText(line, xPos, el.y + index * lineHeight);
                });
            }
        }
        ctx.restore();
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        ctx.rect(el.x, el.y, el.width, el.height);
    }
}
