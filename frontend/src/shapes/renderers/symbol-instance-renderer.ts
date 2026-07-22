import { ShapeRenderer } from "../base/shape-renderer";
import type { RenderContext } from "../base/types";
import type { IRenderer } from "../../rendering/IRenderer";
import type { DrawingElement } from "../../types";
import { store } from "../../store/app-store";
import { animPlacementFrames } from "../../store/anim-ops";
import { renderElement } from "../../utils/render-element";
import { scalePoints, scalePathAnchors, scalePathSubpaths } from "../../utils/geometry-scale";
import { evaluateSymbolTimelineAt, clipLocalFrame } from "../../utils/animation/frame-timeline-evaluator";

/** Cycle guard for nested movie clips: a clip already on the render stack draws
 *  a placeholder instead of recursing forever. */
const clipRenderStack = new Set<string>();

/**
 * Renders a `symbolInstance` by drawing the referenced symbol's elements, scaled into the
 * instance's box and rotated by the instance angle. Rendering live from the symbol def means
 * editing the symbol (redefineSymbol) updates every instance.
 *
 * Movie clips (sym.kind === 'movieclip') evaluate their OWN frame timeline first: the clip's
 * local frame is a pure function of the document playhead (`clipLocalFrame`), so scrubbing,
 * playback, export and undo all see the same nested state.
 */
export class SymbolInstanceRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void { this.draw(context); }
    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void { this.draw(context); }

    private draw(context: RenderContext): void {
        const { renderer, element: inst, isDarkMode, layerOpacity, rc } = context as any;
        const ctx: CanvasRenderingContext2D | undefined = (renderer as IRenderer as any).ctx;
        const sym = store.symbols.find(s => s.id === inst.symbolId);
        if (!ctx || !sym || sym.elements.length === 0 || clipRenderStack.has(sym.id)) {
            // Placeholder for a broken/missing/cyclic symbol.
            renderer.save();
            renderer.fillStyle = isDarkMode ? '#333' : '#eee';
            renderer.fillRect(inst.x, inst.y, inst.width, inst.height);
            renderer.restore();
            return;
        }

        // Movie clip: resolve the local frame and this frame's cel + tween poses.
        let children: DrawingElement[] = sym.elements;
        let overrides: Record<string, any> | null = null;
        if (sym.kind === 'movieclip' && sym.timeline) {
            const rootFrame = store.docType === 'animation' ? store.animCurrentFrame : 0;
            const placed = animPlacementFrames()?.get(inst.id) ?? 0;
            const local = clipLocalFrame(rootFrame, placed, sym.timeline.frameCount, inst.loopMode, inst.firstFrame);
            const ev = evaluateSymbolTimelineAt(local, sym);
            children = sym.elements.filter(e => ev.visible.has(e.id));
            overrides = ev.overrides;
        }

        const sx = sym.width ? inst.width / sym.width : 1;
        const sy = sym.height ? inst.height / sym.height : 1;
        ctx.save();
        if (inst.angle) {
            const cx = inst.x + inst.width / 2, cy = inst.y + inst.height / 2;
            ctx.translate(cx, cy); ctx.rotate(inst.angle); ctx.translate(-cx, -cy);
        }
        clipRenderStack.add(sym.id);
        try {
            for (const base of children) {
                // Tween poses apply in def-space BEFORE scaling into the instance box.
                const child: DrawingElement = overrides?.[base.id] ? { ...base, ...overrides[base.id] } : base;
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
        } finally {
            clipRenderStack.delete(sym.id);
        }
        ctx.restore();
    }

    protected definePath(renderer: IRenderer, el: any): void { renderer.rect(el.x, el.y, el.width, el.height); }
}
