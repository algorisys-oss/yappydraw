import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import { resolveFontFamily } from "../../utils/text-utils";
import type { IRenderer } from "../../rendering/IRenderer";

export class CodeBlockRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    private renderCommon(context: RenderContext): void {
        const { renderer, element: el, isDarkMode } = context;

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

        renderer.save();

        // --- Background ---
        const bgColor = el.backgroundColor && el.backgroundColor !== 'transparent' && el.backgroundColor !== 'none'
            ? RenderPipeline.adjustColor(el.backgroundColor, isDarkMode)
            : RenderPipeline.adjustColor('#1e293b', isDarkMode);

        renderer.fillStyle = bgColor;
        renderer.beginPath();
        renderer.roundRect(el.x, el.y, el.width, el.height, cornerRadius);
        renderer.fill();

        // --- Stroke border ---
        const strokeColor = RenderPipeline.adjustColor(el.strokeColor || '#334155', isDarkMode);
        renderer.strokeStyle = strokeColor;
        renderer.lineWidth = el.strokeWidth || 1;
        renderer.stroke();

        // --- Clip to bounds ---
        renderer.save();
        renderer.beginPath();
        renderer.roundRect(el.x, el.y, el.width, el.height, cornerRadius);
        renderer.clip();

        // --- Title bar ---
        if (hasTitle) {
            // Title bar background (slightly lighter)
            renderer.fillStyle = RenderPipeline.adjustColor('#334155', isDarkMode);
            renderer.fillRect(el.x, el.y, el.width, titleBarHeight);

            // Separator line
            renderer.strokeStyle = RenderPipeline.adjustColor('#475569', isDarkMode);
            renderer.lineWidth = 1;
            renderer.beginPath();
            renderer.moveTo(el.x, el.y + titleBarHeight);
            renderer.lineTo(el.x + el.width, el.y + titleBarHeight);
            renderer.stroke();

            // Title text (centered)
            const titleFont = resolveFontFamily('sans-serif');
            renderer.font = `${fontSize}px ${titleFont}`;
            renderer.fillStyle = RenderPipeline.adjustColor('#94a3b8', isDarkMode);
            renderer.textAlign = 'center';
            renderer.textBaseline = 'middle';
            renderer.fillText(
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
            renderer.font = `${fontSize}px ${codeFont}`;
            renderer.fillStyle = RenderPipeline.adjustColor('#64748b', isDarkMode);
            renderer.textAlign = 'left';
            renderer.textBaseline = 'top';
            renderer.fillText('// Double-click to edit code', codeLeft, codeTop);
            renderer.restore(); // clip
            renderer.restore(); // outer save
            return;
        }

        const lines = el.text.split('\n');
        const codeFont = resolveFontFamily(el.fontFamily || 'code');
        renderer.font = `${fontSize}px ${codeFont}`;
        renderer.textBaseline = 'top';

        // Calculate gutter width based on max line number
        let gutterWidth = 0;
        if (showLineNumbers) {
            const maxLineNum = startLine + lines.length - 1;
            const maxDigits = String(maxLineNum).length;
            gutterWidth = renderer.measureText('0'.repeat(maxDigits)).width + padding * 1.5;
        }

        const textStartX = codeLeft + gutterWidth;
        const textColor = RenderPipeline.adjustColor(el.textColor || el.strokeColor || '#e2e8f0', isDarkMode);
        const lineNumColor = RenderPipeline.adjustColor('#64748b', isDarkMode);
        const highlightLine = el.codeHighlightLine ?? -1; // -1 means no highlight
        const scrollOffset = el.codeScrollOffset ?? 0;    // vertical scroll in px

        // Gutter background
        if (showLineNumbers && gutterWidth > 0) {
            renderer.fillStyle = RenderPipeline.adjustColor('#1a2332', isDarkMode);
            renderer.fillRect(el.x, el.y + titleBarHeight, gutterWidth + padding, el.height - titleBarHeight);

            // Gutter separator
            renderer.strokeStyle = RenderPipeline.adjustColor('#2d3f54', isDarkMode);
            renderer.lineWidth = 1;
            renderer.beginPath();
            renderer.moveTo(el.x + gutterWidth + padding, el.y + titleBarHeight);
            renderer.lineTo(el.x + gutterWidth + padding, el.y + el.height);
            renderer.stroke();
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
                renderer.fillStyle = 'rgba(59, 130, 246, 0.2)'; // blue highlight
                renderer.fillRect(el.x, y - 2, el.width, lineHeight + 2);
            }

            // Line number
            if (showLineNumbers) {
                renderer.fillStyle = highlightLine === i
                    ? RenderPipeline.adjustColor('#93c5fd', isDarkMode) // brighter for highlighted line
                    : lineNumColor;
                renderer.textAlign = 'right';
                renderer.fillText(
                    String(startLine + i),
                    el.x + gutterWidth + padding / 2,
                    y
                );
            }

            // Code text
            renderer.fillStyle = highlightLine === i
                ? RenderPipeline.adjustColor('#ffffff', isDarkMode)  // white for highlighted line
                : textColor;
            renderer.textAlign = 'left';
            renderer.fillText(lines[i], textStartX + padding / 2, y, codeRight - textStartX - padding / 2);
        }

        renderer.restore(); // clip
        renderer.restore(); // outer save
    }

    protected definePath(renderer: IRenderer, el: any): void {
        renderer.rect(el.x, el.y, el.width, el.height);
    }
}
