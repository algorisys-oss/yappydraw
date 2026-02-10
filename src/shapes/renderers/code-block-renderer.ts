import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import { resolveFontFamily } from "../../utils/text-utils";

export class CodeBlockRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    private renderCommon(context: RenderContext): void {
        const { ctx, element: el, isDarkMode } = context;

        const fontSize = el.fontSize || 14;
        const lineHeight = fontSize * 1.4;
        const padding = 12;
        const cornerRadius = Math.min(
            (el.borderRadius ?? 4) * Math.min(el.width, el.height) / 100,
            el.width / 2,
            el.height / 2
        );

        const showLineNumbers = el.codeShowLineNumbers ?? true;
        const startLine = el.codeStartLineNumber ?? 1;
        const hasTitle = !!el.containerText;
        const titleBarHeight = hasTitle ? fontSize * 1.8 : 0;

        ctx.save();

        // --- Background ---
        const bgColor = el.backgroundColor && el.backgroundColor !== 'transparent' && el.backgroundColor !== 'none'
            ? RenderPipeline.adjustColor(el.backgroundColor, isDarkMode)
            : RenderPipeline.adjustColor('#1e293b', isDarkMode);

        ctx.fillStyle = bgColor;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(el.x, el.y, el.width, el.height, cornerRadius);
        } else {
            ctx.rect(el.x, el.y, el.width, el.height);
        }
        ctx.fill();

        // --- Stroke border ---
        const strokeColor = RenderPipeline.adjustColor(el.strokeColor || '#334155', isDarkMode);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = el.strokeWidth || 1;
        ctx.stroke();

        // --- Clip to bounds ---
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(el.x, el.y, el.width, el.height, cornerRadius);
        } else {
            ctx.rect(el.x, el.y, el.width, el.height);
        }
        ctx.clip();

        // --- Title bar ---
        if (hasTitle) {
            // Title bar background (slightly lighter)
            ctx.fillStyle = RenderPipeline.adjustColor('#334155', isDarkMode);
            ctx.fillRect(el.x, el.y, el.width, titleBarHeight);

            // Separator line
            ctx.strokeStyle = RenderPipeline.adjustColor('#475569', isDarkMode);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(el.x, el.y + titleBarHeight);
            ctx.lineTo(el.x + el.width, el.y + titleBarHeight);
            ctx.stroke();

            // Title text (centered)
            const titleFont = resolveFontFamily('sans-serif');
            ctx.font = `${fontSize}px ${titleFont}`;
            ctx.fillStyle = RenderPipeline.adjustColor('#94a3b8', isDarkMode);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                el.containerText!,
                el.x + el.width / 2,
                el.y + titleBarHeight / 2,
                el.width - padding * 2
            );
        }

        // --- Code content area ---
        const codeTop = el.y + titleBarHeight + padding;
        const codeLeft = el.x + padding;
        const codeRight = el.x + el.width - padding;

        if (!el.text) {
            // Placeholder when empty
            const codeFont = resolveFontFamily('code');
            ctx.font = `${fontSize}px ${codeFont}`;
            ctx.fillStyle = RenderPipeline.adjustColor('#64748b', isDarkMode);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('// Double-click to edit code', codeLeft, codeTop);
            ctx.restore(); // clip
            ctx.restore(); // outer save
            return;
        }

        const lines = el.text.split('\n');
        const codeFont = resolveFontFamily(el.fontFamily || 'code');
        ctx.font = `${fontSize}px ${codeFont}`;
        ctx.textBaseline = 'top';

        // Calculate gutter width based on max line number
        let gutterWidth = 0;
        if (showLineNumbers) {
            const maxLineNum = startLine + lines.length - 1;
            const maxDigits = String(maxLineNum).length;
            gutterWidth = ctx.measureText('0'.repeat(maxDigits)).width + padding * 1.5;
        }

        const textStartX = codeLeft + gutterWidth;
        const textColor = RenderPipeline.adjustColor(el.textColor || el.strokeColor || '#e2e8f0', isDarkMode);
        const lineNumColor = RenderPipeline.adjustColor('#64748b', isDarkMode);
        const highlightLine = el.codeHighlightLine ?? -1; // -1 means no highlight
        const scrollOffset = el.codeScrollOffset ?? 0;    // vertical scroll in px

        // Gutter background
        if (showLineNumbers && gutterWidth > 0) {
            ctx.fillStyle = RenderPipeline.adjustColor('#1a2332', isDarkMode);
            ctx.fillRect(el.x, el.y + titleBarHeight, gutterWidth + padding, el.height - titleBarHeight);

            // Gutter separator
            ctx.strokeStyle = RenderPipeline.adjustColor('#2d3f54', isDarkMode);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(el.x + gutterWidth + padding, el.y + titleBarHeight);
            ctx.lineTo(el.x + gutterWidth + padding, el.y + el.height);
            ctx.stroke();
        }

        // Render each line (scrollOffset shifts lines up, clip hides overflow)
        for (let i = 0; i < lines.length; i++) {
            const y = codeTop + i * lineHeight - scrollOffset;

            // Skip lines that have scrolled above the visible area
            if (y + lineHeight < el.y + titleBarHeight) continue;
            // Stop if we've gone past the element bounds
            if (y > el.y + el.height - padding) break;

            // Highlight bar for codeLineHighlight animation
            if (highlightLine === i) {
                ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'; // blue highlight
                ctx.fillRect(el.x, y - 2, el.width, lineHeight + 2);
            }

            // Line number
            if (showLineNumbers) {
                ctx.fillStyle = highlightLine === i
                    ? RenderPipeline.adjustColor('#93c5fd', isDarkMode) // brighter for highlighted line
                    : lineNumColor;
                ctx.textAlign = 'right';
                ctx.fillText(
                    String(startLine + i),
                    el.x + gutterWidth + padding / 2,
                    y
                );
            }

            // Code text
            ctx.fillStyle = highlightLine === i
                ? RenderPipeline.adjustColor('#ffffff', isDarkMode)  // white for highlighted line
                : textColor;
            ctx.textAlign = 'left';
            ctx.fillText(lines[i], textStartX + padding / 2, y, codeRight - textStartX - padding / 2);
        }

        ctx.restore(); // clip
        ctx.restore(); // outer save
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        ctx.rect(el.x, el.y, el.width, el.height);
    }
}
