import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import type { DrawingElement } from "../../types";
import { resolveFontFamily, wrapText } from "../../utils/text-utils";
import { layoutRichText, buildSpanFontString } from "../../utils/rich-text-utils";

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
        if (!el.text && !(el.richText && el.richText.length > 0)) {
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

        // Rich text path — render per-span formatting
        if (el.richText && el.richText.length > 0) {
            this.renderRichTextElement(ctx, el, isDarkMode);
            ctx.restore();
            return;
        }

        ctx.font = `${fontStyle}${fontWeight}${fontSize}px ${fontFamily}`;

        const lineHeight = fontSize * 1.2;
        const padding = 4; // Small internal padding

        // Word wrap text within element width
        const availableWidth = Math.max(el.width - padding * 2, 20);
        const paragraphs = (el.text || '').split('\n');
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

    private renderRichTextElement(
        ctx: CanvasRenderingContext2D,
        el: DrawingElement,
        isDarkMode: boolean
    ): void {
        const spans = el.richText!;
        const padding = 4;
        const availableWidth = Math.max(el.width - padding * 2, 20);
        const defaults = { fontSize: el.fontSize || 20, fontFamily: el.fontFamily || 'sans-serif' };
        const layout = layoutRichText(ctx, spans, availableWidth, defaults);

        const textAlign = el.textAlign || 'left';
        const verticalPadding = Math.max(0, (el.height - layout.totalHeight) / 2);

        let lineY = el.y + verticalPadding;
        for (let lineIdx = 0; lineIdx < layout.lineCount; lineIdx++) {
            const lineHeight = layout.lineHeights[lineIdx];
            const lineSegments = layout.segments.filter(s => s.lineIndex === lineIdx);

            let lineWidth = 0;
            if (lineSegments.length > 0) {
                const last = lineSegments[lineSegments.length - 1];
                lineWidth = last.x + last.width;
            }

            let xOffset: number;
            if (textAlign === 'center') {
                xOffset = el.x + (el.width - lineWidth) / 2;
            } else if (textAlign === 'right') {
                xOffset = el.x + el.width - padding - lineWidth;
            } else {
                xOffset = el.x + padding;
            }

            const baselineY = lineY + lineHeight / 2;

            for (const seg of lineSegments) {
                const span = seg.span;
                ctx.font = buildSpanFontString(span, defaults);
                const color = span.color || el.textColor || el.strokeColor;
                ctx.fillStyle = RenderPipeline.adjustColor(color, isDarkMode);
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'left';
                ctx.fillText(seg.text, xOffset + seg.x, baselineY);

                if (span.underline) {
                    const fontSize = span.fontSize || defaults.fontSize;
                    ctx.beginPath();
                    ctx.strokeStyle = ctx.fillStyle;
                    ctx.lineWidth = Math.max(1, fontSize / 14);
                    ctx.moveTo(xOffset + seg.x, baselineY + fontSize * 0.35);
                    ctx.lineTo(xOffset + seg.x + seg.width, baselineY + fontSize * 0.35);
                    ctx.stroke();
                }

                if (span.strikethrough) {
                    const fontSize = span.fontSize || defaults.fontSize;
                    ctx.beginPath();
                    ctx.strokeStyle = ctx.fillStyle;
                    ctx.lineWidth = Math.max(1, fontSize / 14);
                    ctx.moveTo(xOffset + seg.x, baselineY);
                    ctx.lineTo(xOffset + seg.x + seg.width, baselineY);
                    ctx.stroke();
                }
            }

            lineY += lineHeight;
        }
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        ctx.rect(el.x, el.y, el.width, el.height);
    }
}
