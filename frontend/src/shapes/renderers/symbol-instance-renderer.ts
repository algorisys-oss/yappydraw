import { ShapeRenderer } from "../base/shape-renderer";
import type { RenderContext } from "../base/types";
import type { IRenderer } from "../../rendering/IRenderer";
import type { DrawingElement } from "../../types";
import { store } from "../../store/app-store";
import { renderElement } from "../../utils/render-element";
import { scalePoints, scalePathAnchors, scalePathSubpaths } from "../../utils/geometry-scale";

/**
 * Renders a `symbolInstance` by drawing the referenced symbol's elements, scaled into the
 * instance's box and rotated by the instance angle. Rendering live from the symbol def means
 * editing the symbol (redefineSymbol) updates every instance.
 */
export class SymbolInstanceRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void { this.draw(context); }
    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void { this.draw(context); }

    private draw(context: RenderContext): void {
        const { renderer, element: inst, isDarkMode, layerOpacity, rc } = context as any;
        const ctx: CanvasRenderingContext2D | undefined = (renderer as IRenderer as any).ctx;
        const sym = store.symbols.find(s => s.id === inst.symbolId);
        if (!ctx || !sym || sym.elements.length === 0) {
            // Placeholder for a broken/missing symbol.
            renderer.save();
            renderer.fillStyle = isDarkMode ? '#333' : '#eee';
            renderer.fillRect(inst.x, inst.y, inst.width, inst.height);
            renderer.restore();
            return;
        }
        const sx = sym.width ? inst.width / sym.width : 1;
        const sy = sym.height ? inst.height / sym.height : 1;
        ctx.save();
        if (inst.angle) {
            const cx = inst.x + inst.width / 2, cy = inst.y + inst.height / 2;
            ctx.translate(cx, cy); ctx.rotate(inst.angle); ctx.translate(-cx, -cy);
        }
        for (const child of sym.elements) {
            const copy: DrawingElement = {
                ...child,
                x: inst.x + child.x * sx, y: inst.y + child.y * sy,
                width: child.width * sx, height: child.height * sy,
            } as DrawingElement;
            if (child.points) (copy as any).points = scalePoints(child.points, sx, sy);
            if (child.pathAnchors) (copy as any).pathAnchors = scalePathAnchors(child.pathAnchors as any, sx, sy);
            if (child.pathSubpaths) (copy as any).pathSubpaths = scalePathSubpaths(child.pathSubpaths as any, sx, sy);
            try { renderElement(rc, ctx, copy, isDarkMode, layerOpacity); } catch { /* skip a bad child */ }
        }
        ctx.restore();
    }

    protected definePath(renderer: IRenderer, el: any): void { renderer.rect(el.x, el.y, el.width, el.height); }
}
