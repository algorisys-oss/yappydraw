import type { RenderContext } from "./types";
import { RenderPipeline } from "./render-pipeline";
import { getShapeGeometry } from "../../utils/shape-geometry";
import { globalTime } from "../../utils/animation/animation-engine";
import type { IRenderer } from "../../rendering/IRenderer";
import { computeElementHash } from "../../utils/rough-cache";
import {
    createCaptureRc, createNullPaintRenderer, strokeTraced, tracedFor, EMPTY_TRACE,
    type TracedPath,
} from "../../utils/animation/rough-stroke-trace";
import type { Drawable } from "roughjs/bin/core";

export abstract class ShapeRenderer {
    /** Re-entrancy guard for the drawIn geometry capture (see tracedSketchStroke). */
    private static capturing = false;

    /**
     * Main entry point for rendering an element.
     * Handles universal transformations and delegates to specialized methods.
     */
    render(context: RenderContext) {
        const { renderer, element, layerOpacity } = context;

        // MORPH ANIMATION SUPPORT: If element has custom points, render them directly
        if (element.points && element.points.length > 0) {
            this.renderCustomPoints(context);
            return;
        }

        // 1. Apply universal transformations (rotation, opacity, shadow)
        const { cx, cy } = RenderPipeline.applyTransformations(renderer, element, layerOpacity);

        try {
            // 2. Check for draw-in/draw-out animation
            const dp = element.drawProgress;
            if (dp != null && dp >= 0 && dp < 100) {
                this.renderDrawProgress(context, cx, cy);
            } else {
                // Normal render path
                // 2b. Apply complex fills (gradients, dots) using ShapeGeometry
                // Skip global complex fills for 3D shapes - they handle gradients per-face
                const is3D = ['solidBlock', 'cylinder', 'isometricCube', 'perspectiveBlock', 'openBox'].includes(element.type);
                if (!is3D) {
                    RenderPipeline.applyComplexFills(context, cx, cy);
                }

                // 3. Delegate to specialized rendering methods based on style. A warped shape
                // short-circuits both: its outline is no longer the shape the renderer knows
                // how to draw.
                if (!this.renderWarpedOutline(context, cx, cy)) {
                    if (element.renderStyle === 'architectural') {
                        this.renderArchitectural(context, cx, cy);
                    } else {
                        this.renderSketch(context, cx, cy);
                    }
                }
            }

            // 4. Flow Animation (Marching Ants) for all shapes
            if (element.flowAnimation) {
                this.renderFlowAnimation(context);
            }
        } finally {
            // 5. Restore transformations — always runs even if rendering throws
            RenderPipeline.restoreTransformations(renderer);
        }
    }

    /**
     * Draw an envelope / mesh-warped shape from its warped outline. Returns false when the
     * element isn't warped (or warps itself), so the caller falls through to the normal path.
     *
     * `getShapeGeometry` has applied `el.warp` since the envelope shipped — SVG/PNG export and
     * hit-testing both go through it — but no canvas renderer consulted it, so a warped
     * rectangle drew square on screen and only came out bent in the export. Envelope Distort
     * hid this by converting shapes to paths first; anything that warps a primitive in place
     * (a shape drawn on a perspective plane) did not. Intercepting once here fixes every shape
     * in both render styles rather than patching thirty renderers.
     *
     * Images are excluded because they texture-map the mesh themselves (image-renderer), and
     * text because glyphs have no outline geometry to bend here.
     */
    protected renderWarpedOutline(context: RenderContext, cx: number, cy: number): boolean {
        const { renderer, rc, element: el, isDarkMode } = context;
        if (!el.warp || el.type === 'image' || el.type === 'text' || el.type === 'richtext') return false;
        const geo = getShapeGeometry(el) as any;
        // warpGeometry always emits a self-contained `path`; anything else means the warp
        // didn't apply and the shape should render normally.
        if (!geo || geo.type !== 'path') return false;

        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const backgroundColor = el.backgroundColor === 'transparent' ? undefined : RenderPipeline.adjustColor(el.backgroundColor, isDarkMode);

        renderer.save();
        renderer.translate(cx, cy);   // the warped outline is in the centred-local frame
        if (el.renderStyle === 'architectural') {
            // A `path` geometry is a self-contained Path2D — it must go through fillPath /
            // strokePath, because beginPath()+renderGeometry()+stroke() leaves the current
            // path empty and would silently drop the stroke.
            const fillVisible = options.fill && options.fill !== 'transparent' && options.fill !== 'none';
            if (fillVisible && backgroundColor) {
                renderer.fillStyle = backgroundColor;
                renderer.fillPath(geo.path, geo.evenOdd ? 'evenodd' : undefined);
            }
            if (el.strokeColor && el.strokeColor !== 'transparent' && el.strokeColor !== 'none' && (el.strokeWidth ?? 0) > 0) {
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.strokePath(geo.path);
            }
        } else {
            rc.path(geo.path, options);
        }
        renderer.restore();

        RenderPipeline.renderText(context, cx, cy);
        return true;
    }

    /**
     * Renders the element with draw-in progress animation.
     *
     * Phases (with slight overlap for organic feel):
     *   0-70%   progress: Stroke traces progressively
     *   65-90%  progress: Fill fades in
     *   85-100% progress: Text fades in
     */
    protected renderDrawProgress(context: RenderContext, cx: number, cy: number) {
        const { renderer, element: el, isDarkMode, layerOpacity } = context;
        const progress = (el.drawProgress ?? 0) / 100;

        // Override globalAlpha: during drawIn the element's opacity is set to 0
        // to hide the normal render. We control visibility via phased rendering instead.
        renderer.globalAlpha = layerOpacity;

        // Phase calculations with overlapping ranges
        const strokeProgress = Math.min(1, progress / 0.70);
        const fillProgress = Math.max(0, Math.min(1, (progress - 0.65) / 0.25));
        const textProgress = Math.max(0, Math.min(1, (progress - 0.85) / 0.15));

        const pathLength = this.estimatePathLength(el);
        const strokeColor = RenderPipeline.adjustColor(el.strokeColor, isDarkMode);

        // --- Phase 1: Progressive stroke ---
        if (strokeProgress > 0) {
            renderer.save();
            renderer.strokeStyle = strokeColor;
            renderer.lineWidth = el.strokeWidth;
            renderer.lineCap = 'round';
            renderer.lineJoin = 'round';

            // Sketch style: reveal the shape's OWN RoughJS strokes, so the reveal ends
            // on exactly what the finished shape renders. Tracing the geometric outline
            // instead (the architectural path below) draws a clean line that pops into a
            // hand-drawn one the moment progress hits 100%.
            const traced = el.renderStyle !== 'architectural'
                ? this.tracedSketchStroke(context, cx, cy)
                : null;

            if (traced && traced.total > 0) {
                strokeTraced(renderer, traced, strokeProgress);
            } else {
                // Architectural, or a shape whose sketch pass never reaches `rc`.
                // Set lineDash to [drawLen, pathLength] to reveal stroke progressively
                const drawLen = pathLength * strokeProgress;
                renderer.setLineDash([drawLen, pathLength]);
                renderer.lineDashOffset = 0;

                this.traceDrawStroke(renderer, el);
            }
            renderer.restore();
        }

        // --- Phase 2: Fill fade-in ---
        const hasImageFill = el.fillStyle === 'image' && !!el.backgroundImage;
        if (fillProgress > 0) {
            const fill = el.backgroundColor;
            if (hasImageFill || (fill && fill !== 'transparent' && fill !== 'none')) {
                renderer.save();
                renderer.globalAlpha *= fillProgress;

                const fillStyle = el.fillStyle;
                const useComplexFill = ['linear', 'radial', 'conic', 'dots', 'image'].includes(fillStyle as string);

                if (useComplexFill) {
                    RenderPipeline.applyComplexFills(context, cx, cy);
                } else {
                    renderer.fillStyle = RenderPipeline.adjustColor(fill, isDarkMode);
                    renderer.beginPath();
                    this.definePath(renderer, el);
                    renderer.fill();
                }

                renderer.restore();
            }
        }

        // --- Phase 3: Text fade-in ---
        if (textProgress > 0) {
            renderer.save();
            renderer.globalAlpha *= textProgress;
            RenderPipeline.renderText(context, cx, cy);
            renderer.restore();
        }
    }

    /**
     * Capture the RoughJS strokes this shape's sketch pass would emit, flattened to
     * polylines and memoised on the element's geometry hash.
     *
     * Runs the renderer's real `renderSketch()` against a capture `rc` (generates
     * Drawables, paints nothing) and a null-paint IRenderer (swallows direct strokes
     * from shapes like freehand that don't route through `rc`). Returns an empty trace
     * for shapes that produce no RoughJS geometry at all — the caller then falls back
     * to the geometric-outline reveal.
     */
    private tracedSketchStroke(context: RenderContext, cx: number, cy: number): TracedPath {
        // No renderSketch() reaches renderDrawProgress today, but a future one that did
        // would recurse forever. Bail to the outline fallback instead.
        if (ShapeRenderer.capturing) return EMPTY_TRACE;

        return tracedFor(computeElementHash(context.element), () => {
            const sink: Drawable[] = [];
            const captureContext: RenderContext = {
                ...context,
                rc: createCaptureRc(context.rc, sink),
                renderer: createNullPaintRenderer(context.renderer),
                suppressText: true,
            };

            // Contain any state the sketch pass leaves behind (transforms, styles).
            captureContext.renderer.save();
            ShapeRenderer.capturing = true;
            try {
                this.renderSketch(captureContext, cx, cy);
            } finally {
                ShapeRenderer.capturing = false;
                captureContext.renderer.restore();
            }
            return sink;
        });
    }

    /**
     * Estimates the total path length for the shape's outline.
     * Used by drawIn animation to calculate lineDash parameters.
     *
     * Default: bounding box perimeter. Subclasses override for accuracy.
     */
    estimatePathLength(element: any): number {
        return 2 * (Math.abs(element.width) + Math.abs(element.height));
    }

    /**
     * Renders an element using custom points (for morph animations).
     * This bypasses normal shape geometry and renders the points directly.
     */
    protected renderCustomPoints(context: RenderContext) {
        const { renderer, element: el, isDarkMode, layerOpacity } = context;

        // Don't apply transformations - points are already in absolute canvas coordinates
        renderer.save();
        renderer.globalAlpha = layerOpacity * (el.opacity ?? 1);

        // Normalize points (handle both {x,y} and packed number[] formats)
        const points = this.normalizePoints(el.points);
        if (points.length === 0) return;

        // CRITICAL: Points from getShapeGeometry are in LOCAL coordinates (relative to element center)
        // We need to translate them to ABSOLUTE canvas coordinates by adding element position
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;

        const absolutePoints = points.map(p => ({
            x: p.x + cx,
            y: p.y + cy
        }));

        // Apply opacity
        renderer.save();
        renderer.globalAlpha = layerOpacity * (el.opacity ?? 1);

        // Fill
        if (el.backgroundColor && el.backgroundColor !== 'transparent' && el.backgroundColor !== 'none') {
            renderer.fillStyle = RenderPipeline.adjustColor(el.backgroundColor, isDarkMode);
            renderer.beginPath();
            renderer.moveTo(absolutePoints[0].x, absolutePoints[0].y);
            for (let i = 1; i < absolutePoints.length; i++) {
                renderer.lineTo(absolutePoints[i].x, absolutePoints[i].y);
            }
            renderer.closePath();
            renderer.fill();
        }

        // Stroke
        renderer.strokeStyle = RenderPipeline.adjustColor(el.strokeColor, isDarkMode);
        renderer.lineWidth = el.strokeWidth;
        renderer.beginPath();
        renderer.moveTo(absolutePoints[0].x, absolutePoints[0].y);
        for (let i = 1; i < absolutePoints.length; i++) {
            renderer.lineTo(absolutePoints[i].x, absolutePoints[i].y);
        }
        renderer.closePath();
        renderer.stroke();

        renderer.restore();
    }

    /**
     * Normalize points from either {x,y} objects or packed number[] array
     */
    private normalizePoints(points: any): { x: number; y: number }[] {
        if (!points || points.length === 0) return [];

        // Check if it's already in {x,y} format
        if (typeof points[0] === 'object' && 'x' in points[0]) {
            return points;
        }

        // Convert from packed number[] format
        const result: { x: number; y: number }[] = [];
        for (let i = 0; i < points.length - 1; i += 2) {
            result.push({ x: points[i], y: points[i + 1] });
        }
        return result;
    }

    /**
     * Renders an animated dashed border for any shape.
     */
    protected renderFlowAnimation(context: RenderContext) {
        const { renderer, element: el, isDarkMode } = context;
        const speed = el.flowSpeed !== undefined ? el.flowSpeed : 1;
        const time = globalTime();
        const direction = el.flowReverse ? -1 : 1;
        const offset = (time / 20) * speed * direction;

        renderer.save();
        renderer.strokeStyle = RenderPipeline.adjustColor(el.flowColor || el.strokeColor, isDarkMode);
        renderer.lineWidth = Math.max(1, el.strokeWidth * 0.8);
        renderer.lineCap = 'round';
        renderer.lineJoin = 'round';

        const style = el.flowStyle || 'dashes';
        if (style === 'dots') {
            renderer.setLineDash([2, 8]);
        } else if (style === 'pulse') {
            const pulse = Math.sin(time / 200) * 0.5 + 0.5;
            renderer.globalAlpha *= pulse;
            renderer.setLineDash([]);
        } else {
            renderer.setLineDash([8, 8]);
        }

        renderer.lineDashOffset = -offset;

        renderer.beginPath();
        this.definePath(renderer, el);
        renderer.stroke();
        renderer.restore();
    }

    /**
     * Define the geometry path of the shape for the flow animation.
     * This should call renderer.moveTo, renderer.lineTo, etc. but NOT beginPath or stroke/fill.
     */
    protected abstract definePath(renderer: IRenderer, element: any): void;

    /**
     * Trace + stroke the shape outline for the drawIn/drawOut progressive-reveal effect.
     * The caller has already set strokeStyle/lineWidth and the reveal `lineDash`, so this
     * only needs to lay down the path and stroke it (honoring the active dash).
     *
     * Default: append geometry via definePath() and stroke() — correct for shapes whose
     * definePath adds to the current path (rect/ellipse/points/polylines). Renderers whose
     * geometry is a self-contained Path2D (SVG `path`) MUST override this to stroke via
     * renderer.strokePath(d) instead, because beginPath()+definePath()+stroke() cannot
     * trace a Path2D (see CLAUDE.md render-style parity note).
     */
    protected traceDrawStroke(renderer: IRenderer, element: any): void {
        renderer.beginPath();
        this.definePath(renderer, element);
        renderer.stroke();
    }

    /**
     * Renders the shape with clean, precise lines and solid/gradient fills.
     */
    protected abstract renderArchitectural(context: RenderContext, cx: number, cy: number): void;

    /**
     * Renders the shape with a hand-drawn look using RoughJS.
     */
    protected abstract renderSketch(context: RenderContext, cx: number, cy: number): void;
}
