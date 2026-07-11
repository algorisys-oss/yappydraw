import type { RenderContext } from "./types";
import { RenderPipeline } from "./render-pipeline";
import { globalTime } from "../../utils/animation/animation-engine";
import type { IRenderer } from "../../rendering/IRenderer";

export abstract class ShapeRenderer {
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
            if (dp !== undefined && dp >= 0 && dp < 100) {
                this.renderDrawProgress(context, cx, cy);
            } else {
                // Normal render path
                // 2b. Apply complex fills (gradients, dots) using ShapeGeometry
                // Skip global complex fills for 3D shapes - they handle gradients per-face
                const is3D = ['solidBlock', 'cylinder', 'isometricCube', 'perspectiveBlock', 'openBox'].includes(element.type);
                if (!is3D) {
                    RenderPipeline.applyComplexFills(context, cx, cy);
                }

                // 3. Delegate to specialized rendering methods based on style
                if (element.renderStyle === 'architectural') {
                    this.renderArchitectural(context, cx, cy);
                } else {
                    this.renderSketch(context, cx, cy);
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

            // Set lineDash to [drawLen, pathLength] to reveal stroke progressively
            const drawLen = pathLength * strokeProgress;
            renderer.setLineDash([drawLen, pathLength]);
            renderer.lineDashOffset = 0;

            this.traceDrawStroke(renderer, el);
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

        console.log('[renderCustomPoints] Rendering custom points:', el.id, el.points?.length);

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

        if (absolutePoints.length >= 3) {
            console.log('[renderCustomPoints] First 3 absolute points:', [
                { x: absolutePoints[0].x, y: absolutePoints[0].y },
                { x: absolutePoints[1].x, y: absolutePoints[1].y },
                { x: absolutePoints[2].x, y: absolutePoints[2].y }
            ]);
        }
        console.log('[renderCustomPoints] Element center:', { cx, cy });


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
