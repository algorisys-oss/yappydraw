import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import { resolveFontFamily, wrapText } from "../../utils/text-utils";

export class TextRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    private renderCommon(context: RenderContext): void {
        const { ctx, element: el, isDarkMode } = context;

        const fontSize = el.fontSize || 20;
        const fontFamily = resolveFontFamily(el.fontFamily);
        const fontWeight = (el.fontWeight === true || el.fontWeight === 'bold') ? 'bold ' : '';
        const fontStyle = (el.fontStyle === true || el.fontStyle === 'italic') ? 'italic ' : '';

        ctx.save();

        // Render background color if set
        if (el.backgroundColor && el.backgroundColor !== 'transparent' && el.backgroundColor !== 'none') {
            ctx.fillStyle = RenderPipeline.adjustColor(el.backgroundColor, isDarkMode);
            ctx.fillRect(el.x, el.y, el.width, el.height);
        }

        // If no text yet (during creation), show a placeholder border
        if (!el.text) {
            if (el.width > 0) {
                ctx.strokeStyle = RenderPipeline.adjustColor(el.strokeColor || '#1e90ff', isDarkMode);
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(el.x, el.y, el.width, el.height);
                ctx.setLineDash([]);
            }
            ctx.restore();
            return;
        }

        ctx.font = `${fontStyle}${fontWeight}${fontSize}px ${fontFamily}`;

        const lineHeight = fontSize * 1.2;
        const padding = 4; // Small internal padding

        // Word wrap text within element width
        const availableWidth = Math.max(el.width - padding * 2, 20);
        const paragraphs = el.text.split('\n');
        const lines: string[] = [];
        paragraphs.forEach(para => {
            if (para === '') {
                lines.push('');
            } else {
                lines.push(...wrapText(ctx, para, availableWidth));
            }
        });

        // Calculate vertical offset for centering text within element height
        const totalTextHeight = lines.length * lineHeight;
        const verticalPadding = Math.max(0, (el.height - totalTextHeight) / 2);

        const textColorRaw = el.textColor || el.strokeColor;
        const textColor = RenderPipeline.adjustColor(textColorRaw, isDarkMode);

        // Apply text alignment
        const textAlign = el.textAlign || 'left';
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'hanging';

        if (el.textHighlightEnabled) {
            const highlightColor = el.textHighlightColor || 'rgba(255, 255, 0, 0.4)';
            const highlightPadding = el.textHighlightPadding ?? 4;
            const radius = el.textHighlightRadius ?? 2;

            ctx.fillStyle = RenderPipeline.adjustColor(highlightColor, isDarkMode);

            // Baseline adjustment for better visual centering
            const baselineShift = el.fontFamily === 'hand-drawn' ? -2 : 0;

            // Calculate x position based on alignment
            const getXPosition = () => {
                if (textAlign === 'center') {
                    return el.x + el.width / 2;
                } else if (textAlign === 'right') {
                    return el.x + el.width - padding;
                }
                return el.x + padding;
            };

            lines.forEach((line, index) => {
                const measuredWidth = ctx.measureText(line).width;
                const xPos = getXPosition();
                const yOffset = el.y + verticalPadding + index * lineHeight + baselineShift;
                const vPad = highlightPadding / 2;

                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(
                        xPos - (textAlign === 'center' ? measuredWidth / 2 : 0) - highlightPadding,
                        yOffset - vPad,
                        measuredWidth + highlightPadding * 2,
                        lineHeight + vPad * 2,
                        radius
                    );
                } else {
                    ctx.rect(
                        xPos - (textAlign === 'center' ? measuredWidth / 2 : 0) - highlightPadding,
                        yOffset - vPad,
                        measuredWidth + highlightPadding * 2,
                        lineHeight + vPad * 2
                    );
                }
                ctx.fill();
            });

            ctx.fillStyle = textColor;
            lines.forEach((line, index) => {
                const xPos = getXPosition();
                const yOffset = el.y + verticalPadding + index * lineHeight;
                ctx.fillText(line, xPos, yOffset);
            });
        } else {
            ctx.fillStyle = textColor;

            // Calculate x position based on alignment
            let xPos = el.x + padding;
            if (textAlign === 'center') {
                xPos = el.x + el.width / 2;
            } else if (textAlign === 'right') {
                xPos = el.x + el.width - padding;
            }

            // Render each line at the correct Y offset with vertical centering
            lines.forEach((line, index) => {
                ctx.fillText(line, xPos, el.y + verticalPadding + index * lineHeight);
            });
        }
        ctx.restore();
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        ctx.rect(el.x, el.y, el.width, el.height);
    }
}
