import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";

export class PolygonRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { element: el } = context;

        this.drawPolygon(context, el.x, el.y, el.width, el.height);

        if (el.drawInnerBorder) {
            const dist = el.innerBorderDistance || 5;
            if (el.width > dist * 2 && el.height > dist * 2) {
                this.drawPolygon(context, el.x + dist, el.y + dist, el.width - dist * 2, el.height - dist * 2, true);
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    protected renderSketch(context: RenderContext, cx: number, cy: number): void {
        const { element: el } = context;
        this.drawPolygon(context, el.x, el.y, el.width, el.height);

        if (el.drawInnerBorder) {
            const dist = el.innerBorderDistance || 5;
            if (el.width > dist * 2 && el.height > dist * 2) {
                this.drawPolygon(context, el.x + dist, el.y + dist, el.width - dist * 2, el.height - dist * 2, true);
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    private drawPolygon(context: RenderContext, x: number, y: number, w: number, h: number, isInner = false) {
        const { ctx, rc, element: el, isDarkMode } = context;
        const points = this.getPoints(el, x, y, w, h);
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const strokeColor = RenderPipeline.adjustColor(el.strokeColor, isDarkMode);
        const opts = isInner ? { ...options, stroke: el.innerBorderColor || strokeColor, fill: 'none' } : options;

        if (el.renderStyle === 'architectural') {
            const fillVisible = options.fill && options.fill !== 'transparent' && options.fill !== 'none';
            if (!isInner && fillVisible && el.fillStyle !== 'dots') {
                rc.polygon(points, { ...opts, stroke: 'none', fill: options.fill });
            }
            ctx.beginPath();
            ctx.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
            ctx.closePath();
            ctx.strokeStyle = isInner ? (el.innerBorderColor || strokeColor) : strokeColor;
            ctx.lineWidth = el.strokeWidth;
            ctx.lineJoin = (el.strokeLineJoin as CanvasLineJoin) || 'round';
            ctx.stroke();
        } else {
            rc.polygon(points, opts);
        }
    }

    private getPoints(el: any, x: number, y: number, w: number, h: number): [number, number][] {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const rx = w / 2;
        const ry = h / 2;

        switch (el.type) {
            case 'triangle':
                return [[cx, y], [x + w, y + h], [x, y + h]];
            case 'hexagon':
                return this.getRegularPolyPoints(cx, cy, rx, ry, 6);
            case 'octagon':
                return this.getRegularPolyPoints(cx, cy, rx, ry, 8);
            case 'parallelogram': {
                const offset = w * 0.2;
                return [[x + offset, y], [x + w, y], [x + w - offset, y + h], [x, y + h]];
            }
            case 'trapezoid': {
                const offset = w * 0.2;
                return [[x + offset, y], [x + w - offset, y], [x + w, y + h], [x, y + h]];
            }
            case 'rightTriangle':
                return [[x, y], [x, y + h], [x + w, y + h]];
            case 'pentagon':
                return this.getRegularPolyPoints(cx, cy, rx, ry, 5);
            case 'septagon':
                return this.getRegularPolyPoints(cx, cy, rx, ry, 7);
            case 'polygon':
                return this.getRegularPolyPoints(cx, cy, rx, ry, el.polygonSides || 6);
            default:
                return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
        }
    }

    private getRegularPolyPoints(cx: number, cy: number, rx: number, ry: number, sides: number): [number, number][] {
        const points: [number, number][] = [];
        for (let i = 0; i < sides; i++) {
            const angle = (2 * Math.PI / sides) * i - Math.PI / 2;
            points.push([cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)]);
        }
        return points;
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        const points = this.getPoints(el, el.x, el.y, el.width, el.height);
        if (points.length < 2) return;

        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.closePath();
    }

    estimatePathLength(element: any): number {
        const points = this.getPoints(element, element.x, element.y, element.width, element.height);
        if (points.length < 2) return 0;
        let total = 0;
        for (let i = 0; i < points.length; i++) {
            const next = points[(i + 1) % points.length];
            const dx = next[0] - points[i][0];
            const dy = next[1] - points[i][1];
            total += Math.sqrt(dx * dx + dy * dy);
        }
        return total;
    }
}
