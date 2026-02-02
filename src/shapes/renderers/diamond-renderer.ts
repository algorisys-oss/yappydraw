import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";

export class DiamondRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { ctx, element: el, isDarkMode } = context;
        const radius = this.getRadius(el);
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);

        this.drawDiamondArch(ctx, el, isDarkMode, radius, options.fill);

        if (el.drawInnerBorder) {
            const dist = el.innerBorderDistance || 5;
            if (el.width > dist * 2 && el.height > dist * 2) {
                const innerR = Math.max(0, radius - dist);
                this.drawDiamondArch(ctx, { ...el, x: el.x + dist, y: el.y + dist, width: el.width - dist * 2, height: el.height - dist * 2, strokeColor: el.innerBorderColor || el.strokeColor }, isDarkMode, innerR, 'none');
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    protected renderSketch(context: RenderContext, cx: number, cy: number): void {
        const { rc, element: el, isDarkMode } = context;
        const radius = this.getRadius(el);
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);

        if (radius > 0) {
            const path = this.getRoundedDiamondPath(el.x, el.y, el.width, el.height, radius);
            rc.path(path, options);
        } else {
            const w2 = el.width / 2;
            const h2 = el.height / 2;
            const points: [number, number][] = [
                [el.x + w2, el.y],
                [el.x + el.width, el.y + h2],
                [el.x + w2, el.y + el.height],
                [el.x, el.y + h2]
            ];
            rc.polygon(points, options);
        }

        if (el.drawInnerBorder) {
            const dist = el.innerBorderDistance || 5;
            if (el.width > dist * 2 && el.height > dist * 2) {
                const innerR = Math.max(0, radius - dist);
                const innerOpts = { ...options, stroke: el.innerBorderColor || options.stroke, fill: 'none' };
                if (innerR > 0) {
                    const innerPath = this.getRoundedDiamondPath(el.x + dist, el.y + dist, el.width - dist * 2, el.height - dist * 2, innerR);
                    rc.path(innerPath, innerOpts);
                } else {
                    const w2 = (el.width - dist * 2) / 2;
                    const h2 = (el.height - dist * 2) / 2;
                    const ix = el.x + dist;
                    const iy = el.y + dist;
                    const iw = el.width - dist * 2;
                    const ih = el.height - dist * 2;
                    const innerPoints: [number, number][] = [
                        [ix + w2, iy],
                        [ix + iw, iy + h2],
                        [ix + w2, iy + ih],
                        [ix, iy + h2]
                    ];
                    rc.polygon(innerPoints, innerOpts);
                }
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    private getRadius(el: any): number {
        return el.borderRadius !== undefined
            ? Math.min(Math.abs(el.width), Math.abs(el.height)) * (el.borderRadius / 100)
            : (el.roundness ? Math.min(Math.abs(el.width), Math.abs(el.height)) * 0.2 : 0);
    }

    private drawDiamondArch(ctx: CanvasRenderingContext2D, el: any, isDarkMode: boolean, r: number, fill?: string) {
        const w2 = el.width / 2;
        const h2 = el.height / 2;
        const cx = el.x + w2;
        const cy = el.y + h2;

        if (fill && fill !== 'transparent' && fill !== 'none') {
            ctx.beginPath();
            if (r > 0) {
                const path = this.getRoundedDiamondPath(el.x, el.y, el.width, el.height, r);
                ctx.fill(new Path2D(path));
            } else {
                ctx.moveTo(cx, el.y);
                ctx.lineTo(el.x + el.width, cy);
                ctx.lineTo(cx, el.y + el.height);
                ctx.lineTo(el.x, cy);
                ctx.closePath();
                ctx.fillStyle = fill;
                ctx.fill();
            }
        }

        ctx.beginPath();
        if (r > 0) {
            this.executePath(ctx, el.x, el.y, el.width, el.height, r); // use executePath instead of fill(new Path2D) to avoid issues with stroke pattern state if any
            RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
            ctx.stroke();
        } else {
            ctx.moveTo(cx, el.y);
            ctx.lineTo(el.x + el.width, cy);
            ctx.lineTo(cx, el.y + el.height);
            ctx.lineTo(el.x, cy);
            ctx.closePath();
            RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
            ctx.stroke();
        }
    }

    private getRoundedDiamondPath(x: number, y: number, w: number, h: number, r: number) {
        const w2 = w / 2;
        const h2 = h / 2;
        const cx = x + w2;
        const cy = y + h2;
        const len = Math.hypot(w2, h2);
        const validR = Math.min(r, len / 2);
        const ratio = validR / len;
        const dx = w2 * ratio;
        const dy = h2 * ratio;

        const p1 = { x: cx - dx, y: y + dy };
        const p2 = { x: cx + dx, y: y + dy };
        const p3 = { x: x + w - dx, y: cy - dy };
        const p4 = { x: x + w - dx, y: cy + dy };
        const p5 = { x: cx + dx, y: y + h - dy };
        const p6 = { x: cx - dx, y: y + h - dy };
        const p7 = { x: x + dx, y: cy + dy };
        const p8 = { x: x + dx, y: cy - dy };

        return `M ${p1.x} ${p1.y} Q ${cx} ${y} ${p2.x} ${p2.y} L ${p3.x} ${p3.y} Q ${x + w} ${cy} ${p4.x} ${p4.y} L ${p5.x} ${p5.y} Q ${cx} ${y + h} ${p6.x} ${p6.y} L ${p7.x} ${p7.y} Q ${x} ${cy} ${p8.x} ${p8.y} Z`;
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        const radius = this.getRadius(el);
        if (radius > 0) {
            // const path = this.getRoundedDiamondPath(el.x, el.y, el.width, el.height, radius);
            // const p2d = new Path2D(path);
            // ctx.addPath(p2d) is not what we want if we want to build a path step by step,
            // but for Path2D we can just use it in the sequencer if we refactor it.
            // Actually, ctx.beginPath() and then executing the draw commands is better.
            // Since Diamond uses a string path, I'll manually define it here.
            this.executePath(ctx, el.x, el.y, el.width, el.height, radius);
        } else {
            const w2 = el.width / 2;
            const h2 = el.height / 2;
            ctx.moveTo(el.x + w2, el.y);
            ctx.lineTo(el.x + el.width, el.y + h2);
            ctx.lineTo(el.x + w2, el.y + el.height);
            ctx.lineTo(el.x, el.y + h2);
            ctx.closePath();
        }
    }

    private executePath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
        const w2 = w / 2;
        const h2 = h / 2;
        const cx = x + w2;
        const cy = y + h2;
        const len = Math.hypot(w2, h2);
        const validR = Math.min(r, len / 2);
        const ratio = validR / len;
        const dx = w2 * ratio;
        const dy = h2 * ratio;

        const p1 = { x: cx - dx, y: y + dy };
        const p2 = { x: cx + dx, y: y + dy };
        const p3 = { x: x + w - dx, y: cy - dy };
        const p4 = { x: x + w - dx, y: cy + dy };
        const p5 = { x: cx + dx, y: y + h - dy };
        const p6 = { x: cx - dx, y: y + h - dy };
        const p7 = { x: x + dx, y: cy + dy };
        const p8 = { x: x + dx, y: cy - dy };

        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(cx, y, p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.quadraticCurveTo(x + w, cy, p4.x, p4.y);
        ctx.lineTo(p5.x, p5.y);
        ctx.quadraticCurveTo(cx, y + h, p6.x, p6.y);
        ctx.lineTo(p7.x, p7.y);
        ctx.quadraticCurveTo(x, cy, p8.x, p8.y);
        ctx.closePath();
    }
}
