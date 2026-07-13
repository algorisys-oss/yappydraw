import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import type { IRenderer } from "../../rendering/IRenderer";
import type { DrawingElement } from "../../types";
import { resolveFontFamily, wrapText, measureVerticalText } from "../../utils/text-utils";
import { layoutRichText, buildSpanFontString } from "../../utils/rich-text-utils";

export class TextRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    private renderCommon(context: RenderContext): void {
        const { renderer, element: el, isDarkMode } = context;

        const fontSize = el.fontSize || 20;
        const fontFamily = resolveFontFamily(el.fontFamily);
        const fontWeight = (el.fontWeight === true || el.fontWeight === 'bold') ? 'bold ' : '';
        const fontStyle = (el.fontStyle === true || el.fontStyle === 'italic') ? 'italic ' : '';

        renderer.save();

        // Render background color if set
        if (el.backgroundColor && el.backgroundColor !== 'transparent' && el.backgroundColor !== 'none') {
            renderer.fillStyle = RenderPipeline.adjustColor(el.backgroundColor, isDarkMode);
            renderer.fillRect(el.x, el.y, el.width, el.height);
        }

        // If no text yet, show a subtle filled area so the drag region is visible
        if (!el.text && !(el.richText && el.richText.length > 0)) {
            if (el.width > 0 && el.height > 0) {
                renderer.fillStyle = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                renderer.fillRect(el.x, el.y, el.width, el.height);
            }
            renderer.restore();
            return;
        }

        // Rich text path — render per-span formatting
        // For richtext elements or elements with richText property
        if ((el.type === 'richtext' && el.richText) || (el.richText && el.richText.length > 0)) {
            this.renderRichTextElement(renderer, el, isDarkMode);
            renderer.restore();
            return;
        }

        renderer.font = `${fontStyle}${fontWeight}${fontSize}px ${fontFamily}`;
        // Letter spacing (tracking) — set once so it applies to measurement, wrapping
        // and drawing across the normal / vertical / per-glyph paths below. Restored by
        // the renderer.save()/restore() pair wrapping this method.
        renderer.letterSpacing = el.letterSpacing ? `${el.letterSpacing}px` : '0px';

        const lineHeight = fontSize * 1.2;
        const padding = 4; // Small internal padding

        // Vertical Type — stack glyphs top→bottom; each \n-paragraph is a column, columns
        // advance RIGHT→LEFT (CJK / Illustrator convention). Layout + element size come from
        // measureVerticalText so the rendered text, selection box and hit-testing all agree.
        if (el.verticalText) {
            const v = measureVerticalText(el);
            renderer.fillStyle = RenderPipeline.adjustColor(el.textColor || el.strokeColor || '#000000', isDarkMode);
            renderer.textAlign = 'center';
            renderer.textBaseline = 'middle';
            // Vertically align the column block within the element box.
            const blockH = v.height - v.padding * 2;
            const va = el.verticalAlign || 'top';
            let top = v.padding;
            if (va === 'middle') top = Math.max(v.padding, (el.height - blockH) / 2);
            else if (va === 'bottom') top = Math.max(v.padding, el.height - blockH - v.padding);
            v.columns.forEach((col, ci) => {
                const x = el.x + el.width - v.padding - v.colWidth * (ci + 0.5); // right→left
                col.forEach((ch, ri) => {
                    renderer.fillText(ch, x, el.y + top + v.vAdvance * (ri + 0.5));
                });
            });
            renderer.restore();
            return;
        }

        // Touch Type — per-character transforms (single-line text). Render each glyph at its
        // measured advance, then apply its move/scale/rotate around the glyph centre.
        if (el.charTransforms && el.charTransforms.length && !(el.text || '').includes('\n')) {
            // Per-glyph Touch Type transforms, left-anchored (shared with shape labels).
            RenderPipeline.renderTouchTypeLine(renderer, el, el.text || '', el.x + padding, el.y + el.height / 2, 'left', isDarkMode);
            renderer.restore();
            return;
        }

        // Word-wrap within the element width — UNLESS the element is autosize
        // (click-placed text): then the box tracks the content, so lines break only
        // on explicit newlines (Excalidraw/tldraw "click & type" behaviour). Drag-placed
        // text is a fixed-width box (autoResize false) and wraps as before.
        const availableWidth = Math.max(el.width - padding * 2, 20);
        const paragraphs = (el.text || '').split('\n');
        const lines: string[] = [];
        if (el.autoResize) {
            paragraphs.forEach(para => lines.push(para));
        } else {
            paragraphs.forEach(para => {
                if (para === '') {
                    lines.push('');
                } else {
                    lines.push(...wrapText(context.renderer, para, availableWidth));
                }
            });
        }

        // Calculate vertical offset based on verticalAlign property
        // Total height = (N-1) * lineHeight + fontSize for the last line
        // This matches the actual rendering which uses index * lineHeight
        const totalTextHeight = lines.length > 0
            ? (lines.length - 1) * lineHeight + fontSize
            : 0;
        const verticalAlign = el.verticalAlign || 'middle';
        let verticalPadding = 0;

        if (verticalAlign === 'top') {
            // Add padding to keep text inside top boundary
            verticalPadding = padding;
        } else if (verticalAlign === 'middle') {
            verticalPadding = Math.max(0, (el.height - totalTextHeight) / 2);
        } else if (verticalAlign === 'bottom') {
            // Subtract padding to keep text inside bottom boundary
            verticalPadding = Math.max(0, el.height - totalTextHeight - padding);
        }

        const textColorRaw = el.textColor || el.strokeColor || '#000000';
        const textColor = RenderPipeline.adjustColor(textColorRaw, isDarkMode);

        // Text outline (Hollow/Splice effects): stroke each glyph; skip the fill
        // entirely when the fill color is 'transparent' (outline-only text).
        const strokeOn = !!el.textStrokeEnabled && (el.textStrokeWidth ?? 2) > 0;
        const fillOn = textColorRaw !== 'transparent';
        // Glitch effect: cyan/magenta copies offset either side of the fill
        // (chromatic aberration). Colors stay fixed in dark mode — they're the look.
        const glitchOn = el.textEffect === 'glitch' && fillOn;
        const glitchOffset = Math.max(1.5, fontSize / 14);
        const drawTextLine = (line: string, x: number, y: number) => {
            if (glitchOn) {
                const prevFill = renderer.fillStyle;
                renderer.fillStyle = '#00e5ff';
                renderer.fillText(line, x - glitchOffset, y);
                renderer.fillStyle = '#ff2d78';
                renderer.fillText(line, x + glitchOffset, y);
                renderer.fillStyle = prevFill;
            }
            if (strokeOn) {
                renderer.lineWidth = el.textStrokeWidth ?? 2;
                renderer.strokeStyle = RenderPipeline.adjustColor(el.textStrokeColor || textColorRaw, isDarkMode);
                renderer.lineJoin = 'round';
                renderer.strokeText(line, x, y);
            }
            if (fillOn) renderer.fillText(line, x, y);
        };

        // Apply text alignment
        const textAlign = el.textAlign || 'center';
        renderer.textAlign = textAlign;
        renderer.textBaseline = 'hanging';

        if (el.textHighlightEnabled) {
            const highlightColor = el.textHighlightColor || 'rgba(255, 255, 0, 0.4)';
            const highlightPadding = el.textHighlightPadding ?? 4;
            const radius = el.textHighlightRadius ?? 2;

            renderer.fillStyle = RenderPipeline.adjustColor(highlightColor, isDarkMode);

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
                const measuredWidth = renderer.measureText(line).width;
                const xPos = getXPosition();
                const yOffset = el.y + verticalPadding + index * lineHeight + baselineShift;
                const vPad = highlightPadding / 2;

                renderer.beginPath();
                renderer.roundRect(
                    xPos - (textAlign === 'center' ? measuredWidth / 2 : 0) - highlightPadding,
                    yOffset - vPad,
                    measuredWidth + highlightPadding * 2,
                    lineHeight + vPad * 2,
                    radius
                );
                renderer.fill();
            });

            renderer.fillStyle = textColor;
            lines.forEach((line, index) => {
                const xPos = getXPosition();
                const yOffset = el.y + verticalPadding + index * lineHeight;
                drawTextLine(line, xPos, yOffset);
            });
        } else {
            renderer.fillStyle = textColor;

            // Calculate x position based on alignment
            let xPos = el.x + padding;
            if (textAlign === 'center') {
                xPos = el.x + el.width / 2;
            } else if (textAlign === 'right') {
                xPos = el.x + el.width - padding;
            }

            // Render each line at the correct Y offset with vertical centering
            lines.forEach((line, index) => {
                drawTextLine(line, xPos, el.y + verticalPadding + index * lineHeight);
            });
        }
        renderer.restore();
    }

    private renderRichTextElement(
        renderer: IRenderer,
        el: DrawingElement,
        isDarkMode: boolean
    ): void {
        const spans = el.richText!;
        const padding = 4;
        const availableWidth = Math.max(el.width - padding * 2, 20);
        const defaults = { fontSize: el.fontSize || 20, fontFamily: el.fontFamily || 'sans-serif' };
        const layout = layoutRichText(renderer, spans, availableWidth, defaults);

        const textAlign = el.textAlign || 'center';
        const verticalAlign = el.verticalAlign || 'middle';
        let verticalPadding = 0;

        if (verticalAlign === 'top') {
            // Add padding to keep text inside top boundary
            verticalPadding = padding;
        } else if (verticalAlign === 'middle') {
            verticalPadding = Math.max(0, (el.height - layout.totalHeight) / 2);
        } else if (verticalAlign === 'bottom') {
            // Subtract padding to keep text inside bottom boundary
            verticalPadding = Math.max(0, el.height - layout.totalHeight - padding);
        }

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

            // Track if we've drawn a list marker for this line
            let listMarkerDrawn = false;
            const INDENT_SIZE = 20;

            for (const seg of lineSegments) {
                const span = seg.span;
                renderer.font = buildSpanFontString(span, defaults);
                const color = span.color || el.textColor || el.strokeColor;
                renderer.fillStyle = RenderPipeline.adjustColor(color, isDarkMode);
                renderer.textBaseline = 'middle';
                renderer.textAlign = 'left';

                // Draw list marker (bullet or number) before first segment of list item
                if (!listMarkerDrawn && span.listType && span.listType !== 'none') {
                    const listLevel = span.listLevel || 0;
                    const indent = listLevel * INDENT_SIZE;
                    const markerX = xOffset + indent;

                    if (span.listType === 'bullet') {
                        renderer.fillText('\u2022', markerX, baselineY);
                    } else if (span.listType === 'ordered') {
                        renderer.fillText(`${span.listIndex || 1}.`, markerX, baselineY);
                    }
                    listMarkerDrawn = true;
                }

                renderer.fillText(seg.text, xOffset + seg.x, baselineY);

                if (span.underline) {
                    const fontSize = span.fontSize || defaults.fontSize;
                    renderer.beginPath();
                    renderer.setLineDash([]);
                    renderer.strokeStyle = renderer.fillStyle as string;
                    renderer.lineWidth = Math.max(1, fontSize / 14);
                    renderer.moveTo(xOffset + seg.x, baselineY + fontSize * 0.35);
                    renderer.lineTo(xOffset + seg.x + seg.width, baselineY + fontSize * 0.35);
                    renderer.stroke();
                }

                if (span.strikethrough) {
                    const fontSize = span.fontSize || defaults.fontSize;
                    renderer.beginPath();
                    renderer.setLineDash([]);
                    renderer.strokeStyle = renderer.fillStyle as string;
                    renderer.lineWidth = Math.max(1, fontSize / 14);
                    renderer.moveTo(xOffset + seg.x, baselineY);
                    renderer.lineTo(xOffset + seg.x + seg.width, baselineY);
                    renderer.stroke();
                }
            }

            lineY += lineHeight;
        }
    }

    protected definePath(renderer: IRenderer, el: any): void {
        renderer.rect(el.x, el.y, el.width, el.height);
    }
}
