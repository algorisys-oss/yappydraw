import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import { getFontString, measureContainerText } from "../../utils/text-utils";
import type { DrawingElement } from "../../types";
import type { IRenderer } from "../../rendering/IRenderer";
import { calculateUml2SectionLayout, type Uml2SectionLayout } from "../../utils/uml-layout-utils";

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

        const layout = calculateUml2SectionLayout(context.renderer, el, 'attributesText');
        this.drawDivider(renderer, el, layout, options.stroke || '#000000');
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

        const layout = calculateUml2SectionLayout(context.renderer, el, 'attributesText');

        // Sketch divider
        const y1 = el.y + layout.headerHeight;
        if (y1 < el.y + el.height) {
            rc.line(el.x, y1, el.x + el.width, y1, options);
        }
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

    private drawDivider(renderer: IRenderer, el: DrawingElement, layout: Uml2SectionLayout, stroke: string) {
        const y = el.y + layout.headerHeight;
        if (y < el.y + el.height) {
            renderer.strokeStyle = stroke;
            renderer.lineWidth = 1;
            renderer.beginPath();
            renderer.moveTo(el.x, y);
            renderer.lineTo(el.x + el.width, y);
            renderer.stroke();
        }
    }

    private renderTexts(context: RenderContext, el: DrawingElement, layout: Uml2SectionLayout) {
        if (el.isEditing) return;
        const { renderer, isDarkMode } = context;

        // Name (Header) — centered, bold
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

        // Actions (clipped + scrolled)
        if (el.attributesText) {
            const sectionTop = el.y + layout.headerHeight;
            const sectionHeight = layout.bodyHeight;
            const scrollY = el.umlAttrScrollY || 0;
            const fontSize = (el.fontSize || 20) * 0.9;

            renderer.save();
            renderer.beginPath();
            renderer.rect(el.x + 1, sectionTop + 1, el.width - 2, sectionHeight - 2);
            renderer.clip();

            this.renderSectionText(renderer, { ...el, fontSize }, el.attributesText,
                el.x + 10, sectionTop + 10 - scrollY,
                el.width - 20, 'left', false, isDarkMode
            );

            renderer.restore();

            if (layout.bodyOverflows) {
                this.renderScrollArrows(renderer, el.x + el.width, sectionTop,
                    sectionHeight, scrollY, layout.bodyContentHeight, sectionHeight);
            }
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

    private renderScrollArrows(
        renderer: IRenderer,
        sectionRight: number, sectionTop: number, sectionHeight: number,
        scrollY: number, contentHeight: number, viewHeight: number
    ) {
        if (contentHeight <= viewHeight) return;
        const maxScroll = contentHeight - viewHeight;
        const btnSize = 10;
        const btnX = sectionRight - btnSize - 4;

        if (scrollY > 0.5) {
            const btnY = sectionTop + 3;
            renderer.fillStyle = 'rgba(100, 100, 100, 0.25)';
            renderer.beginPath();
            renderer.roundRect(btnX - 1, btnY - 1, btnSize + 2, btnSize + 2, 2);
            renderer.fill();
            renderer.fillStyle = 'rgba(60, 60, 60, 0.7)';
            renderer.beginPath();
            renderer.moveTo(btnX + btnSize / 2, btnY + 2);
            renderer.lineTo(btnX + btnSize - 2, btnY + btnSize - 2);
            renderer.lineTo(btnX + 2, btnY + btnSize - 2);
            renderer.closePath();
            renderer.fill();
        }

        if (scrollY < maxScroll - 0.5) {
            const btnY = sectionTop + sectionHeight - btnSize - 5;
            renderer.fillStyle = 'rgba(100, 100, 100, 0.25)';
            renderer.beginPath();
            renderer.roundRect(btnX - 1, btnY - 1, btnSize + 2, btnSize + 2, 2);
            renderer.fill();
            renderer.fillStyle = 'rgba(60, 60, 60, 0.7)';
            renderer.beginPath();
            renderer.moveTo(btnX + btnSize / 2, btnY + btnSize - 2);
            renderer.lineTo(btnX + btnSize - 2, btnY + 2);
            renderer.lineTo(btnX + 2, btnY + 2);
            renderer.closePath();
            renderer.fill();
        }
    }
}
