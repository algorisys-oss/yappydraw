import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import { getFontString, measureContainerText } from "../../utils/text-utils";
import type { DrawingElement } from "../../types";

export class UmlClassRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        const { ctx, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);

        // Draw main box
        ctx.beginPath();
        ctx.rect(el.x, el.y, el.width, el.height);
        ctx.fillStyle = options.fill || 'transparent'; // Ensure background for text readability
        if (options.fill && options.fill !== 'none') {
            ctx.fill();
        }
        RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
        ctx.stroke();

        // Calculate layout
        const layout = this.calculateLayout(ctx, el);

        this.drawDividers(ctx, el, layout, options.stroke || '#000000', isDarkMode);
        this.renderTexts(context, el, layout);
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        const { rc, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);

        // Draw main box
        rc.rectangle(el.x, el.y, el.width, el.height, options);

        // Layout
        // We need a temporary ctx to measure text for layout even in sketch mode
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const layout = this.calculateLayout(ctx, el);

        this.drawSketchDividers(rc, el, layout, options);
        this.renderTexts(context, el, layout);
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        ctx.rect(el.x, el.y, el.width, el.height);
    }

    private calculateLayout(ctx: CanvasRenderingContext2D, el: DrawingElement) {
        // Measure Header
        const headerText = el.containerText || '';
        let headerHeight = 30; // Min height
        if (headerText) {
            const metrics = measureContainerText(ctx, el, headerText, el.width - 10);
            headerHeight = Math.max(30, metrics.textHeight + 20); // 10px padding top/bottom
        }

        // Measure Attributes
        const attrText = el.attributesText || '';
        let attrHeight = 0;
        if (attrText) {
            // For attributes, we often want left alignment and raw lines, but let's use measureContainerText for consistency with wrapping
            const metrics = measureContainerText(ctx, { ...el, fontSize: (el.fontSize || 20) * 0.9 }, attrText, el.width - 10);
            // Attributes often a bit smaller
            attrHeight = Math.max(20, metrics.textHeight + 10);
        } else if (el.type === 'umlClass') {
            attrHeight = 20; // Empty placeholder space if it's a class
        }

        // Methods take the rest, but we need to know where the line starts
        // We don't strictly need methods height for drawing the second line, just the start y.

        return {
            headerHeight,
            attrHeight,
            hasAttributes: !!attrText || el.type === 'umlClass',
            hasMethods: !!el.methodsText || el.type === 'umlClass'
        };
    }

    private drawDividers(ctx: CanvasRenderingContext2D, el: DrawingElement, layout: any, stroke: string, isDarkMode: boolean) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1; // Thinner lines for dividers? Or same as border? Let's match border for consistency

        // Header Divider
        const y1 = el.y + layout.headerHeight;
        if (y1 < el.y + el.height) {
            RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
            ctx.stroke();
        }

        // Attributes Divider (only if we have methods section or just generally for class)
        if (layout.hasAttributes && layout.hasMethods) {
            const y2 = y1 + layout.attrHeight;
            if (y2 < el.y + el.height) {
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke();
            }
        }
    }

    private drawSketchDividers(rc: any, el: DrawingElement, layout: any, options: any) {
        // Header Divider
        const y1 = el.y + layout.headerHeight;
        if (y1 < el.y + el.height) {
            rc.line(el.x, y1, el.x + el.width, y1, options);
        }

        // Attributes Divider
        if (layout.hasAttributes && layout.hasMethods) {
            const y2 = y1 + layout.attrHeight;
            if (y2 < el.y + el.height) {
                rc.line(el.x, y2, el.x + el.width, y2, options);
            }
        }
    }

    private renderTexts(context: RenderContext, el: DrawingElement, layout: any) {
        if (el.isEditing) return;
        const { ctx, isDarkMode } = context;

        // 1. Header (Centered, bold usually)
        if (el.containerText) {
            // We can reuse RenderPipeline.renderText but we need to trick it into rendering at the top part
            // Actually it's easier to just call manual text rendering here to control position accurately
            this.renderSectionText(ctx, el, el.containerText,
                el.x + el.width / 2,
                el.y + layout.headerHeight / 2,
                el.width - 10,
                'center',
                true, // bold header
                isDarkMode
            );
        }

        // 2. Attributes (Left aligned usually)
        if (el.attributesText) {
            const yPos = el.y + layout.headerHeight + 10; // Top padding of section
            // Use slightly smaller font?
            const fontSize = (el.fontSize || 20) * 0.9;
            this.renderSectionText(ctx, { ...el, fontSize }, el.attributesText,
                el.x + 10, // Left padding
                yPos,
                el.width - 20,
                'left',
                false,
                isDarkMode
            );
        }

        // 3. Methods (Left aligned usually)
        if (el.methodsText) {
            const yPos = el.y + layout.headerHeight + layout.attrHeight + 10;
            const fontSize = (el.fontSize || 20) * 0.9;
            this.renderSectionText(ctx, { ...el, fontSize }, el.methodsText,
                el.x + 10,
                yPos,
                el.width - 20,
                'left',
                false,
                isDarkMode
            );
        }
    }

    private renderSectionText(
        ctx: CanvasRenderingContext2D,
        el: Partial<DrawingElement>,
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        align: 'center' | 'left' | 'right',
        isBold: boolean,
        isDarkMode: boolean
    ) {
        if (!text) return;

        ctx.save();
        ctx.font = getFontString({ ...el, fontWeight: isBold ? 'bold' : el.fontWeight });
        const textColor = RenderPipeline.adjustColor(el.strokeColor || '#000', isDarkMode);
        ctx.fillStyle = textColor;
        ctx.textAlign = align;
        ctx.textBaseline = align === 'center' ? 'middle' : 'top'; // Center for header, top for lists

        const metrics = measureContainerText(ctx, el, text, maxWidth);

        metrics.lines.forEach((line, i) => {
            const lineY = y + (i * metrics.lineHeight) - (align === 'center' ? (metrics.lines.length - 1) * metrics.lineHeight / 2 : 0);
            ctx.fillText(line, x, lineY);
        });

        ctx.restore();
    }
}
