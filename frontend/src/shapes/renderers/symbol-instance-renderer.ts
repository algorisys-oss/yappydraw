import { ShapeRenderer } from "../base/shape-renderer";
import type { RenderContext } from "../base/types";
import type { IRenderer } from "../../rendering/IRenderer";
import type { DrawingElement } from "../../types";
import { store } from "../../store/app-store";
import { animPlacementFrames } from "../../store/anim-ops";
import { renderElement } from "../../utils/render-element";
import { scalePoints, scalePathAnchors, scalePathSubpaths } from "../../utils/geometry-scale";
import { evaluateSymbolTimelineAt, clipLocalFrame } from "../../utils/animation/frame-timeline-evaluator";

/**
 * Recursion budget for symbols that contain themselves.
 *
 * `symbolDepth` is the render stack: symbolId -> how many levels of it are currently being
 * drawn. A symbol reached while already on the stack is self-referential, and what happens
 * next depends on `sym.recursive`:
 *
 *   off (default) - draw the grey placeholder and stop. This is the original cycle guard, and
 *                   the behaviour every existing document was authored against.
 *   on            - keep descending, bounded by THREE independent limits, because each catches
 *                   a case the others miss:
 *                     · sub-pixel  - the honest terminator. Each level is drawn into a smaller
 *                                    box, so a contracting transform ends by itself, exactly
 *                                    when the result stops being visible. Nothing to tune.
 *                     · depth cap  - covers a NON-contracting transform (scale >= 1), which
 *                                    never reaches sub-pixel and would otherwise spin forever.
 *                     · draw budget- covers BRANCHING. One self-reference costs O(depth); two
 *                                    make it a fractal tree at O(2^depth), so a depth cap alone
 *                                    is not a bound on work. This is the only limit that is.
 *
 * The accumulated scale needs no bookkeeping: children are drawn into `inst.width/height`, so
 * by the time a nested instance is reached its box IS the accumulated size in world units.
 */
const symbolDepth = new Map<string, number>();

/** Levels of nesting before we give up on a transform that never shrinks. */
const MAX_RECURSION_DEPTH = 64;
/** Stop once a level is this small on screen — below this it contributes nothing. */
const MIN_SCREEN_PX = 1.5;
/** Ceiling on nested draws per top-level element, so a branching symbol cannot hang the frame. */
const MAX_RECURSION_DRAWS = 4000;
let recursionDraws = 0;

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
        const depth = sym ? (symbolDepth.get(sym.id) ?? 0) : 0;
        // A symbol reached while already on the stack references itself. Recursive symbols
        // descend (subject to the budget below); everything else keeps the old placeholder.
        const cyclic = depth > 0 && !sym?.recursive;
        if (!ctx || !sym || sym.elements.length === 0 || cyclic) {
            // Placeholder for a broken/missing/cyclic symbol.
            renderer.save();
            renderer.fillStyle = isDarkMode ? '#333' : '#eee';
            renderer.fillRect(inst.x, inst.y, inst.width, inst.height);
            renderer.restore();
            return;
        }

        // Reset on an EMPTY stack, not merely on depth 0 for this symbol. Keying it to the symbol
        // lets a second recursive symbol reached mid-descent (A contains B contains A) zero the
        // counter on every level, so the budget never binds and only the depth cap is left —
        // which is not a bound on work once anything branches.
        if (symbolDepth.size === 0) {
            recursionDraws = 0; // new top-level render — fresh budget
        } else if (depth > 0) {
            // Deliberately draws NOTHING when a limit is hit rather than a placeholder: the tail
            // of a spiral is where these fire, and a grey box there is more conspicuous than the
            // vanishingly small artwork it replaces.
            const screenPx = Math.max(inst.width, inst.height) * (store.viewState?.scale ?? 1);
            if (depth >= (sym.recursionDepth ?? MAX_RECURSION_DEPTH)) return;
            if (screenPx < MIN_SCREEN_PX) return;
            if (recursionDraws >= MAX_RECURSION_DRAWS) return;
            recursionDraws++;
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
        symbolDepth.set(sym.id, depth + 1);
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
            if (depth === 0) symbolDepth.delete(sym.id);
            else symbolDepth.set(sym.id, depth);
        }
        ctx.restore();
    }

    protected definePath(renderer: IRenderer, el: any): void { renderer.rect(el.x, el.y, el.width, el.height); }
}
