import type { DrawingElement } from "../types";
import type { RoughCanvas } from "roughjs/bin/canvas";
import type { IRenderer } from "../rendering/IRenderer";
import { shapeRegistry } from "../shapes/shape-registry";
import { CanvasRenderer } from "../rendering/CanvasRenderer";
import { renderWithEraseMask } from "../shapes/base/erase-mask";

// Helper to normalize points (supports both old Point[] and new packed number[])
export const normalizePoints = (points: any[] | number[] | undefined): { x: number; y: number }[] => {
    if (!points || points.length === 0) return [];
    if (typeof points[0] === 'number') {
        const result: { x: number; y: number }[] = [];
        for (let i = 0; i < points.length - 1; i += 2) {
            result.push({ x: points[i] as number, y: points[i + 1] as number });
        }
        return result;
    }
    return points as { x: number; y: number }[];
};

// Helper: Calculate cubic bezier point at t (Still used in canvas.tsx)
export const cubicBezier = (p0: number, p1: number, p2: number, p3: number, t: number) => {
    const k = 1 - t;
    return k * k * k * p0 + 3 * k * k * t * p1 + 3 * k * t * t * p2 + t * t * t * p3;
};

// Helper: Calculate cubic bezier tangent angle at t (Still used in canvas.tsx)
export const cubicBezierAngle = (p0: { x: number, y: number }, p1: { x: number, y: number }, p2: { x: number, y: number }, p3: { x: number, y: number }, t: number) => {
    const dx = 3 * (1 - t) * (1 - t) * (p1.x - p0.x) + 6 * (1 - t) * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
    const dy = 3 * (1 - t) * (1 - t) * (p1.y - p0.y) + 6 * (1 - t) * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
    return Math.atan2(dy, dx);
};

// Still used in canvas.tsx
export const drawOrganicBranch = (
    ctx: CanvasRenderingContext2D,
    start: { x: number, y: number },
    end: { x: number, y: number },
    cp1: { x: number, y: number },
    cp2: { x: number, y: number },
    color: string,
    width: number,
    text: string = "",
    textColor: string = "#000000",
    font: string = "16px sans-serif"
) => {
    const segments = 20;
    const pointsTop: { x: number, y: number }[] = [];
    const pointsBottom: { x: number, y: number }[] = [];

    const startWidth = Math.max(width * 8, 4);
    const endWidth = Math.max(width * 2, 2);

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = cubicBezier(start.x, cp1.x, cp2.x, end.x, t);
        const y = cubicBezier(start.y, cp1.y, cp2.y, end.y, t);
        const angle = cubicBezierAngle(start, cp1, cp2, end, t);

        const currentWidth = startWidth + (endWidth - startWidth) * t;
        const halfWidth = currentWidth / 2;

        const offsetX = Math.cos(angle + Math.PI / 2) * halfWidth;
        const offsetY = Math.sin(angle + Math.PI / 2) * halfWidth;

        pointsTop.push({ x: x + offsetX, y: y + offsetY });
        pointsBottom.push({ x: x - offsetX, y: y - offsetY });
    }

    ctx.beginPath();
    ctx.moveTo(pointsTop[0].x, pointsTop[0].y);
    for (let i = 1; i < pointsTop.length; i++) ctx.lineTo(pointsTop[i].x, pointsTop[i].y);
    ctx.lineTo(pointsBottom[pointsBottom.length - 1].x, pointsBottom[pointsBottom.length - 1].y);
    for (let i = pointsBottom.length - 2; i >= 0; i--) ctx.lineTo(pointsBottom[i].x, pointsBottom[i].y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    if (text) {
        ctx.save();
        ctx.font = font;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const centerX = cubicBezier(start.x, cp1.x, cp2.x, end.x, 0.5);
        const centerY = cubicBezier(start.y, cp1.y, cp2.y, end.y, 0.5);
        const angle = cubicBezierAngle(start, cp1, cp2, end, 0.5);
        const textOffset = -15;

        ctx.translate(centerX, centerY);
        let rawAngle = angle;
        if (rawAngle > Math.PI / 2 || rawAngle < -Math.PI / 2) rawAngle += Math.PI;
        ctx.rotate(rawAngle);
        ctx.fillText(text, 0, textOffset);
        ctx.restore();
    }
};

/**
 * Main rendering entry point. 
 * Delegates to specialized renderers in the shape registry.
 */
export const renderElement = (
    rc: RoughCanvas,
    ctx: CanvasRenderingContext2D,
    el: DrawingElement,
    isDarkMode: boolean = false,
    layerOpacity: number = 1,
    sharedRenderer?: IRenderer
) => {
    // Partial erase: render the element to an isolated layer, punch holes, blit back.
    // (Raster export paths go through renderElement too, so they get masking for free.)
    if (el.eraseStrokes && el.eraseStrokes.length > 0) {
        renderWithEraseMask(ctx, el, isDarkMode, layerOpacity, renderElementCore);
        return;
    }
    renderElementCore(rc, ctx, el, isDarkMode, layerOpacity, sharedRenderer);
};

const renderElementCore = (
    rc: RoughCanvas,
    ctx: CanvasRenderingContext2D,
    el: DrawingElement,
    isDarkMode: boolean = false,
    layerOpacity: number = 1,
    sharedRenderer?: IRenderer
) => {
    const shapeRenderer = shapeRegistry.getRenderer(el.type);
    if (shapeRenderer) {
        try {
            const renderer = sharedRenderer || new CanvasRenderer(ctx);
            shapeRenderer.render({ rc, renderer, element: el, isDarkMode, layerOpacity });
        } catch (err) {
            console.warn(`Render error for ${el.type} (${el.id}):`, err);
        }
        return;
    }

    // Fallback or warning for unknown types
    console.warn(`No renderer registered for element type: ${el.type}`);
};

/**
 * Exported helper for color adjustment (used in many places)
 * Forwarding to strategy if possible, or keeping here if it's a general utility.
 */
export const adjustColor = (color: string, _isDarkMode: boolean = false) => {
    // Theme only affects UI chrome, not canvas content.
    // Shape colors are always rendered as stored — WYSIWYG.
    return color;
};
