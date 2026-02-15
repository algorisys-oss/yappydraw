import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import { getFontString, measureContainerText } from "../../utils/text-utils";
import type { DrawingElement } from "../../types";
import type { IRenderer } from "../../rendering/IRenderer";

export class UmlStateRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        const { renderer, element: el, isDarkMode } = context;
        const radius = this.getRadius(el);
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);

        // Draw main rounded box
        renderer.beginPath();
        if (radius > 0) {
            renderer.roundRect(el.x, el.y, el.width, el.height, radius);
        } else {
            renderer.rect(el.x, el.y, el.width, el.height);
        }
        renderer.fillStyle = options.fill || 'transparent';
        if (options.fill && options.fill !== 'none') {
            renderer.fill();
        }
        renderer.lineWidth = el.strokeWidth;
        renderer.strokeStyle = options.stroke || '#000000';
        renderer.stroke();

        const layout = this.calculateLayout(context.renderer, el);
        this.drawDivider(renderer, el, layout, options.stroke || '#000000', false);
        this.renderTexts(context, el, layout);
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        const { rc, element: el, isDarkMode } = context;
        const radius = this.getRadius(el);
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);

        // Draw main rounded box
        if (radius > 0) {
            const path = this.getRoundedRectPath(el.x, el.y, el.width, el.height, radius);
            rc.path(path, options);
        } else {
            rc.rectangle(el.x, el.y, el.width, el.height, options);
        }

        const layout = this.calculateLayout(context.renderer, el);

        this.drawDivider(null, el, layout, options.stroke || '#000000', true, rc, options);
        this.renderTexts(context, el, layout);
    }

    protected definePath(renderer: IRenderer, el: any): void {
        const radius = this.getRadius(el);
        if (radius > 0) {
            renderer.roundRect(el.x, el.y, el.width, el.height, radius);
        } else {
            renderer.rect(el.x, el.y, el.width, el.height);
        }
    }

    private getRadius(el: any): number {
        return Math.min(Math.abs(el.width), Math.abs(el.height)) * 0.15;
    }

    private getRoundedRectPath(x: number, y: number, w: number, h: number, r: number) {
        const rX = Math.min(Math.abs(w) / 2, r);
        const rY = Math.min(Math.abs(h) / 2, r);
        return `M ${x + rX} ${y} L ${x + w - rX} ${y} Q ${x + w} ${y} ${x + w} ${y + rY} L ${x + w} ${y + h - rY} Q ${x + w} ${y + h} ${x + w - rX} ${y + h} L ${x + rX} ${y + h} Q ${x} ${y + h} ${x} ${y + h - rY} L ${x} ${y + rY} Q ${x} ${y} ${x + rX} ${y}`;
    }

    private calculateLayout(renderer: IRenderer, el: DrawingElement) {
        const headerText = el.containerText || '';
        let headerHeight = Math.min(el.height, 35); // Default min header height

        if (headerText) {
            const metrics = measureContainerText(renderer, el, headerText, el.width - 20);
            headerHeight = Math.max(headerHeight, metrics.textHeight + 15);
        }

        return { headerHeight };
    }

    private drawDivider(renderer: IRenderer | null, el: DrawingElement, layout: any, stroke: string, isSketch: boolean, rc?: any, options?: any) {
        const y = el.y + layout.headerHeight;
        if (y < el.y + el.height) {
            if (isSketch && rc) {
                rc.line(el.x, y, el.x + el.width, y, options);
            } else if (renderer) {
                renderer.strokeStyle = stroke;
                renderer.lineWidth = 1;
                renderer.beginPath();
                renderer.moveTo(el.x, y);
                renderer.lineTo(el.x + el.width, y);
                renderer.stroke();
            }
        }
    }

    private renderTexts(context: RenderContext, el: DrawingElement, layout: any) {
        if (el.isEditing) return;
        const { renderer, isDarkMode } = context;

        // Name (Header)
        if (el.containerText) {
            this.renderSectionText(renderer, el, el.containerText,
                el.x + el.width / 2,
                el.y + layout.headerHeight / 2,
                el.width - 20,
                'center',
                true,
                isDarkMode
            );
        }

        // Actions (Attributes text section)
        if (el.attributesText) {
            const yPos = el.y + layout.headerHeight + 5;
            const fontSize = (el.fontSize || 20) * 0.9;
            this.renderSectionText(renderer, { ...el, fontSize }, el.attributesText,
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
        renderer.textBaseline = align === 'center' ? 'middle' : 'top';

        const metrics = measureContainerText(renderer, el as DrawingElement, text, maxWidth);

        metrics.lines.forEach((line, i) => {
            const lineY = y + (i * metrics.lineHeight) - (align === 'center' ? (metrics.lines.length - 1) * metrics.lineHeight / 2 : 0);
            renderer.fillText(line, x, lineY);
        });

        renderer.restore();
    }
}
