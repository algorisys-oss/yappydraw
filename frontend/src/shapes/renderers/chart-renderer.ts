/**
 * Data charts (`chart` elements). The chart is laid out once (utils/chart/chart-layout.ts) into
 * drawing operations; this draws them clean (architectural, through the renderer, so SVG/PDF
 * export get the same) or hand-drawn (sketch, through RoughJS, with hachured bars and wedges).
 */
import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import type { IRenderer } from "../../rendering/IRenderer";
import { layoutChart, LIGHT, type ChartColors, type ChartOp } from "../../utils/chart/chart-layout";
import { resolveFontFamily } from "../../utils/text-utils";

const DARK: ChartColors = { text: '#e5e7eb', muted: '#d1d5db', grid: '#374151', axis: '#6b7280' };

/** SVG path of a pie or doughnut wedge, for RoughJS. */
function wedgePath(o: Extract<ChartOp, { op: 'wedge' }>): string {
    const full = o.a1 - o.a0 >= Math.PI * 2 - 1e-6;
    const pt = (r: number, a: number) => `${o.cx + Math.cos(a) * r} ${o.cy + Math.sin(a) * r}`;
    if (full) {
        // A whole disc (or ring): two half arcs, since one arc can't close on itself.
        const ring = (r: number) => `M ${pt(r, o.a0)} A ${r} ${r} 0 1 1 ${pt(r, o.a0 + Math.PI)} A ${r} ${r} 0 1 1 ${pt(r, o.a0)} Z`;
        return ring(o.r) + (o.inner ? ' ' + ring(o.inner) : '');
    }
    const large = o.a1 - o.a0 > Math.PI ? 1 : 0;
    if (!o.inner) return `M ${o.cx} ${o.cy} L ${pt(o.r, o.a0)} A ${o.r} ${o.r} 0 ${large} 1 ${pt(o.r, o.a1)} Z`;
    return `M ${pt(o.r, o.a0)} A ${o.r} ${o.r} 0 ${large} 1 ${pt(o.r, o.a1)} L ${pt(o.inner, o.a1)} A ${o.inner} ${o.inner} 0 ${large} 0 ${pt(o.inner, o.a0)} Z`;
}

export class ChartRenderer extends ShapeRenderer {
    private ops(context: RenderContext): ChartOp[] {
        const el = context.element;
        return layoutChart((el as any).chart, el.x, el.y, el.width, el.height, context.isDarkMode ? DARK : LIGHT);
    }

    private background(context: RenderContext) {
        const { renderer, element: el, isDarkMode } = context;
        const bg = el.backgroundColor;
        if (bg && bg !== 'transparent') {
            renderer.fillStyle = RenderPipeline.adjustColor(bg, isDarkMode);
            renderer.fillRect(el.x, el.y, el.width, el.height);
        }
    }

    private text(renderer: IRenderer, o: Extract<ChartOp, { op: 'text' }>, family: string) {
        renderer.save();
        renderer.font = `${o.bold ? 'bold ' : ''}${o.size}px ${family}`;
        renderer.fillStyle = o.color;
        renderer.textAlign = o.align;
        renderer.textBaseline = o.baseline === 'bottom' ? 'alphabetic' : o.baseline;
        renderer.fillText(o.text, o.x, o.y);
        renderer.restore();
    }

    protected renderArchitectural(context: RenderContext): void {
        const { renderer, element: el } = context;
        this.background(context);
        const family = el.fontFamily ? resolveFontFamily(el.fontFamily) : 'Inter, sans-serif';
        for (const o of this.ops(context)) {
            switch (o.op) {
                case 'rect':
                    if (o.fill) { renderer.fillStyle = o.fill; renderer.fillRect(o.x, o.y, o.w, o.h); }
                    break;
                case 'line':
                    renderer.beginPath();
                    o.points.forEach(([px, py], i) => (i ? renderer.lineTo(px, py) : renderer.moveTo(px, py)));
                    if (o.closed) {
                        renderer.closePath();
                        if (o.fill) { renderer.save(); renderer.globalAlpha *= 0.55; renderer.fillStyle = o.fill; renderer.fill(); renderer.restore(); }
                    }
                    renderer.strokeStyle = o.stroke; renderer.lineWidth = o.width; renderer.stroke();
                    break;
                case 'wedge':
                    renderer.beginPath();
                    renderer.arc(o.cx, o.cy, o.r, o.a0, o.a1);
                    if (o.inner) renderer.arc(o.cx, o.cy, o.inner, o.a1, o.a0, true); else renderer.lineTo(o.cx, o.cy);
                    renderer.closePath();
                    renderer.fillStyle = o.fill; renderer.fill();
                    // Office separates slices with a thin line in the background colour.
                    renderer.strokeStyle = context.isDarkMode ? '#1f2937' : '#ffffff'; renderer.lineWidth = 1.5; renderer.stroke();
                    break;
                case 'dot':
                    renderer.beginPath(); renderer.arc(o.x, o.y, o.r, 0, Math.PI * 2);
                    renderer.fillStyle = o.fill; renderer.fill();
                    break;
                case 'text':
                    this.text(renderer, o, family);
                    break;
            }
        }
    }

    protected renderSketch(context: RenderContext): void {
        const { rc, renderer, element: el, isDarkMode } = context;
        this.background(context);
        const base = RenderPipeline.buildRenderOptions(el, isDarkMode);
        // Only defined values: RoughJS merges options over its defaults, and an explicit
        // `undefined` (bowing, seed) replaces the default and turns every stroke into NaN.
        const rough: Record<string, number> = { roughness: base.roughness ?? 1 };
        if (typeof base.seed === 'number') rough.seed = base.seed;
        if (typeof base.bowing === 'number') rough.bowing = base.bowing;
        const family = resolveFontFamily(el.fontFamily || 'hand-drawn');
        for (const o of this.ops(context)) {
            switch (o.op) {
                case 'rect':
                    if (!o.fill) break;
                    rc.rectangle(o.x, o.y, o.w, o.h, { ...rough, fill: o.fill, fillStyle: 'hachure', hachureGap: 6, stroke: o.fill, strokeWidth: 1.2 });
                    break;
                case 'line':
                    if (o.closed) rc.polygon(o.points, { ...rough, fill: o.fill, fillStyle: 'hachure', hachureGap: 8, stroke: o.stroke, strokeWidth: o.width });
                    else rc.linearPath(o.points, { ...rough, stroke: o.stroke, strokeWidth: o.width });
                    break;
                case 'wedge':
                    rc.path(wedgePath(o), { ...rough, fill: o.fill, fillStyle: 'hachure', hachureGap: 6, stroke: o.fill, strokeWidth: 1.2 });
                    break;
                case 'dot':
                    rc.circle(o.x, o.y, o.r * 2, { ...rough, fill: o.fill, fillStyle: 'solid', stroke: o.fill, strokeWidth: 1 });
                    break;
                case 'text':
                    // Labels laid out white sit on a solid fill; on hachure they need the text colour.
                    this.text(renderer, o.color === '#ffffff' ? { ...o, color: (isDarkMode ? DARK : LIGHT).text } : o, family);
                    break;
            }
        }
    }

    protected definePath(renderer: IRenderer, el: any): void {
        renderer.rect(el.x, el.y, el.width, el.height);
    }
}
