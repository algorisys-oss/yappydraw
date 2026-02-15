import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import { getFontString, measureContainerText } from "../../utils/text-utils";
import type { DrawingElement } from "../../types";
import type { IRenderer } from "../../rendering/IRenderer";

export class UmlClassRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        const { renderer, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);

        // Draw main box
        renderer.beginPath();
        renderer.rect(el.x, el.y, el.width, el.height);
        renderer.fillStyle = options.fill || 'transparent'; // Ensure background for text readability
        if (options.fill && options.fill !== 'none') {
            renderer.fill();
        }
        RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
        renderer.stroke();

        const layout = this.calculateLayout(context.renderer, el);

        this.drawDividers(renderer, el, layout, options.stroke || '#000000', isDarkMode);
        this.renderTexts(context, el, layout);
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        const { rc, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);

        // Draw main box
        rc.rectangle(el.x, el.y, el.width, el.height, options);

        const layout = this.calculateLayout(context.renderer, el);

        this.drawSketchDividers(rc, el, layout, options);
        this.renderTexts(context, el, layout);
    }

    protected definePath(renderer: IRenderer, el: any): void {
        renderer.rect(el.x, el.y, el.width, el.height);
    }

    private calculateLayout(renderer: IRenderer, el: DrawingElement) {
        // Measure Header
        const headerText = el.containerText || '';
        let headerHeight = 30; // Min height
        if (headerText) {
            const metrics = measureContainerText(renderer, el, headerText, el.width - 10);
            headerHeight = Math.max(30, metrics.textHeight + 20); // 10px padding top/bottom
        }

        // Measure Attributes
        const attrText = el.attributesText || '';
        let attrHeight = 0;
        if (attrText) {
            // For attributes, we often want left alignment and raw lines, but let's use measureContainerText for consistency with wrapping
            const metrics = measureContainerText(renderer, { ...el, fontSize: (el.fontSize || 20) * 0.9 }, attrText, el.width - 10);
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

    private drawDividers(renderer: IRenderer, el: DrawingElement, layout: any, stroke: string, isDarkMode: boolean) {
        renderer.strokeStyle = stroke;
        renderer.lineWidth = 1; // Thinner lines for dividers? Or same as border? Let's match border for consistency

        // Header Divider
        const y1 = el.y + layout.headerHeight;
        if (y1 < el.y + el.height) {
            RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
            renderer.stroke();
        }

        // Attributes Divider (only if we have methods section or just generally for class)
        if (layout.hasAttributes && layout.hasMethods) {
            const y2 = y1 + layout.attrHeight;
            if (y2 < el.y + el.height) {
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.stroke();
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
        const { renderer, isDarkMode } = context;

        // 1. Header (Centered, bold usually)
        if (el.containerText) {
            // We can reuse RenderPipeline.renderText but we need to trick it into rendering at the top part
            // Actually it's easier to just call manual text rendering here to control position accurately
            this.renderSectionText(renderer, el, el.containerText,
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
            this.renderSectionText(renderer, { ...el, fontSize }, el.attributesText,
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
            this.renderSectionText(renderer, { ...el, fontSize }, el.methodsText,
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
        renderer: IRenderer,
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

        renderer.save();
        renderer.font = getFontString({ ...el, fontWeight: isBold ? 'bold' : el.fontWeight });
        const textColor = RenderPipeline.adjustColor(el.strokeColor || '#000', isDarkMode);
        renderer.fillStyle = textColor;
        renderer.textAlign = align;
        renderer.textBaseline = align === 'center' ? 'middle' : 'top'; // Center for header, top for lists

        const metrics = measureContainerText(renderer, el, text, maxWidth);

        metrics.lines.forEach((line, i) => {
            const lineY = y + (i * metrics.lineHeight) - (align === 'center' ? (metrics.lines.length - 1) * metrics.lineHeight / 2 : 0);
            renderer.fillText(line, x, lineY);
        });

        renderer.restore();
    }
}
