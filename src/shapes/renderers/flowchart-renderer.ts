import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import { getShapeGeometry } from "../../utils/shape-geometry";
import type { RenderContext } from "../base/types";

export class FlowchartRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { ctx, element: el, isDarkMode } = context;
        const backgroundColor = el.backgroundColor === 'transparent' ? undefined : RenderPipeline.adjustColor(el.backgroundColor, isDarkMode);

        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            case 'database': {
                const ellipseHeight = h * 0.2;
                const path = this.getDatabasePath(x, y, w, h, ellipseHeight);
                const topEllipse = this.getDatabaseTopPath(x, y, w, h, ellipseHeight);
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.fill(new Path2D(path));
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke(new Path2D(path));
                ctx.stroke(new Path2D(topEllipse));
                break;
            }
            case 'document': {
                const waveHeight = h * 0.1;
                const path = this.getDocumentPath(x, y, w, h, waveHeight);
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.fill(new Path2D(path));
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.lineJoin = 'round';
                ctx.stroke(new Path2D(path));
                break;
            }
            case 'predefinedProcess': {
                const sideBarWidth = w * 0.1;
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(x, y, w, h);
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.strokeRect(x, y, w, h);
                ctx.beginPath();
                ctx.moveTo(x + sideBarWidth, y); ctx.lineTo(x + sideBarWidth, y + h);
                ctx.moveTo(x + w - sideBarWidth, y); ctx.lineTo(x + w - sideBarWidth, y + h);
                ctx.stroke();
                break;
            }
            case 'internalStorage': {
                const lineOffset = Math.min(w, h) * 0.15;
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(x, y, w, h);
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.strokeRect(x, y, w, h);
                ctx.beginPath();
                ctx.moveTo(x + lineOffset, y); ctx.lineTo(x + lineOffset, y + h);
                ctx.moveTo(x, y + lineOffset); ctx.lineTo(x + w, y + lineOffset);
                ctx.stroke();
                break;
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    protected renderSketch(context: RenderContext, cx: number, cy: number): void {
        const { rc, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            case 'database': {
                const ellipseHeight = h * 0.2;
                rc.path(this.getDatabasePath(x, y, w, h, ellipseHeight), options);
                rc.path(this.getDatabaseTopPath(x, y, w, h, ellipseHeight), options);
                break;
            }
            case 'document': {
                const waveHeight = h * 0.1;
                rc.path(this.getDocumentPath(x, y, w, h, waveHeight), options);
                break;
            }
            case 'predefinedProcess': {
                const sideBarWidth = w * 0.1;
                rc.rectangle(x, y, w, h, options);
                rc.line(x + sideBarWidth, y, x + sideBarWidth, y + h, options);
                rc.line(x + w - sideBarWidth, y, x + w - sideBarWidth, y + h, options);
                break;
            }
            case 'internalStorage': {
                const lineOffset = Math.min(w, h) * 0.15;
                rc.rectangle(x, y, w, h, options);
                rc.line(x + lineOffset, y, x + lineOffset, y + h, options);
                rc.line(x, y + lineOffset, x + w, y + lineOffset, options);
                break;
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    private getDatabasePath(x: number, y: number, w: number, h: number, ellipseHeight: number) {
        return `
            M ${x} ${y + ellipseHeight / 2}
            L ${x} ${y + h - ellipseHeight / 2}
            A ${w / 2} ${ellipseHeight / 2} 0 0 0 ${x + w} ${y + h - ellipseHeight / 2}
            L ${x + w} ${y + ellipseHeight / 2}
            A ${w / 2} ${ellipseHeight / 2} 0 0 0 ${x} ${y + ellipseHeight / 2}
            A ${w / 2} ${ellipseHeight / 2} 0 0 0 ${x + w} ${y + ellipseHeight / 2}
        `;
    }

    private getDatabaseTopPath(x: number, y: number, w: number, _h: number, ellipseHeight: number) {
        return `
            M ${x} ${y + ellipseHeight / 2}
            A ${w / 2} ${ellipseHeight / 2} 0 1 1 ${x + w} ${y + ellipseHeight / 2}
            A ${w / 2} ${ellipseHeight / 2} 0 1 1 ${x} ${y + ellipseHeight / 2}
        `;
    }

    private getDocumentPath(x: number, y: number, w: number, h: number, waveHeight: number) {
        return `
            M ${x} ${y}
            L ${x + w} ${y}
            L ${x + w} ${y + h - waveHeight}
            Q ${x + w * 0.75} ${y + h - waveHeight * 2} ${x + w * 0.5} ${y + h - waveHeight}
            T ${x} ${y + h - waveHeight}
            Z
        `;
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        const geometry = getShapeGeometry(el);
        if (!geometry) return;
        ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
        RenderPipeline.renderGeometry(ctx, geometry);
    }
}
