/**
 * Erase mask — non-destructive partial erase.
 *
 * A shape with `el.eraseStrokes` is rendered into an isolated, element-sized
 * offscreen layer, then the eraser strokes punch holes via `destination-out`
 * compositing, and the masked result is blitted back onto the main canvas.
 *
 * Isolation matters: `destination-out` removes whatever alpha already exists in
 * the target region, so it must NOT run directly on the main canvas (it would
 * erase the grid and underlying elements). The offscreen layer contains only
 * this element, so erasing only affects the element's own pixels — overlapping
 * eraser dabs compose correctly (unlike an even-odd clip trick).
 *
 * The shape keeps its type/identity; only its rendered pixels are masked.
 */

import rough from 'roughjs';
import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { DrawingElement } from '../../types';
import type { IRenderer } from '../../rendering/IRenderer';
import { CanvasRenderer } from '../../rendering/CanvasRenderer';

type CoreRender = (
    rc: RoughCanvas,
    ctx: CanvasRenderingContext2D,
    el: DrawingElement,
    isDarkMode: boolean,
    layerOpacity: number,
    sharedRenderer?: IRenderer,
) => void;

// Single pooled offscreen layer, reused across masked elements (rendering is
// synchronous, one element at a time). Grows to the largest region needed.
let pool: {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    rc: RoughCanvas;
    renderer: CanvasRenderer;
} | null = null;

function acquirePool(minW: number, minH: number) {
    if (!pool) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, minW);
        canvas.height = Math.max(1, minH);
        const ctx = canvas.getContext('2d')!;
        pool = { canvas, ctx, rc: rough.canvas(canvas), renderer: new CanvasRenderer(ctx) };
    } else if (pool.canvas.width < minW || pool.canvas.height < minH) {
        // Resizing clears the canvas — fine, we clear the working region per use anyway.
        pool.canvas.width = Math.max(pool.canvas.width, minW);
        pool.canvas.height = Math.max(pool.canvas.height, minH);
    }
    return pool;
}

function readLocalPoints(points: number[] | { x: number; y: number }[]): { x: number; y: number }[] {
    if (!points || points.length === 0) return [];
    if (typeof points[0] === 'number') {
        const nums = points as number[];
        const out: { x: number; y: number }[] = [];
        for (let i = 0; i + 1 < nums.length; i += 2) out.push({ x: nums[i], y: nums[i + 1] });
        return out;
    }
    return points as { x: number; y: number }[];
}

/** Padded world-space AABB of the element (rotation/scale + stroke/shadow margin). */
function paddedWorldAABB(el: DrawingElement) {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    const angle = el.angle || 0;
    const rs = el.renderScale !== undefined && el.renderScale !== 1 ? Math.abs(el.renderScale) : 1;
    const hw = (Math.abs(el.width) / 2) * rs;
    const hh = (Math.abs(el.height) / 2) * rs;
    const cosA = Math.abs(Math.cos(angle));
    const sinA = Math.abs(Math.sin(angle));
    const rx = hw * cosA + hh * sinA;
    const ry = hw * sinA + hh * cosA;
    let pad = (el.strokeWidth || 0) + 4;
    if (el.shadowEnabled) {
        pad += (el.shadowBlur || 10) + Math.max(Math.abs(el.shadowOffsetX || 0), Math.abs(el.shadowOffsetY || 0));
    }
    return { minX: cx - rx - pad, minY: cy - ry - pad, maxX: cx + rx + pad, maxY: cy + ry + pad };
}

/** Punch holes into the already-rendered element using destination-out. */
function applyEraseStrokes(ctx: CanvasRenderingContext2D, el: DrawingElement) {
    const strokes = el.eraseStrokes;
    if (!strokes || strokes.length === 0) return;

    ctx.save();

    // Match the element's own transform so mask points (stored in the element's
    // unrotated local frame) align with the rendered, transformed shape.
    const angle = el.angle || 0;
    const rs = el.renderScale;
    if (angle || el.flipX || el.flipY || (rs !== undefined && rs !== 1)) {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        ctx.translate(cx, cy);
        if (angle) ctx.rotate(angle);
        if (el.flipX || el.flipY) ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1);
        if (rs !== undefined && rs !== 1) ctx.scale(rs, rs);
        ctx.translate(-cx, -cy);
    }

    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([]);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    for (const stroke of strokes) {
        const pts = readLocalPoints(stroke.points);
        if (pts.length === 0) continue;
        const r = Math.max(0.5, stroke.radius);
        if (pts.length === 1) {
            ctx.beginPath();
            ctx.arc(el.x + pts[0].x, el.y + pts[0].y, r, 0, Math.PI * 2);
            ctx.fill();
            continue;
        }
        ctx.lineWidth = r * 2;
        ctx.beginPath();
        ctx.moveTo(el.x + pts[0].x, el.y + pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(el.x + pts[i].x, el.y + pts[i].y);
        ctx.stroke();
    }

    ctx.restore();
}

/**
 * Render an element with its erase mask applied. `coreRender` draws the element
 * normally (passed in to avoid an import cycle with render-element).
 */
export function renderWithEraseMask(
    mainCtx: CanvasRenderingContext2D,
    el: DrawingElement,
    isDarkMode: boolean,
    layerOpacity: number,
    coreRender: CoreRender,
): void {
    const t = mainCtx.getTransform();
    const box = paddedWorldAABB(el);

    // Map the world AABB corners through the current transform → device pixels.
    const corners = [
        { x: box.minX, y: box.minY }, { x: box.maxX, y: box.minY },
        { x: box.maxX, y: box.maxY }, { x: box.minX, y: box.maxY },
    ];
    let sx = Infinity, sy = Infinity, ex = -Infinity, ey = -Infinity;
    for (const c of corners) {
        const dx = t.a * c.x + t.c * c.y + t.e;
        const dy = t.b * c.x + t.d * c.y + t.f;
        if (dx < sx) sx = dx;
        if (dy < sy) sy = dy;
        if (dx > ex) ex = dx;
        if (dy > ey) ey = dy;
    }
    sx = Math.max(0, Math.floor(sx));
    sy = Math.max(0, Math.floor(sy));
    ex = Math.min(mainCtx.canvas.width, Math.ceil(ex));
    ey = Math.min(mainCtx.canvas.height, Math.ceil(ey));
    const sw = ex - sx;
    const sh = ey - sy;

    // Fully off-screen / clipped — nothing to draw. (Don't fall back to an
    // unmasked render, or holes would vanish at the viewport edge.)
    if (sw <= 0 || sh <= 0) return;

    const { canvas, ctx, rc, renderer } = acquirePool(sw, sh);

    // Reset + clear the working region.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.clearRect(0, 0, sw, sh);

    // Map world coords into the offscreen region (same transform as the main
    // canvas, shifted so the region origin lands at offscreen (0, 0)).
    ctx.setTransform(t.a, t.b, t.c, t.d, t.e - sx, t.f - sy);

    // 1. Render the element normally into the isolated layer.
    coreRender(rc, ctx, el, isDarkMode, layerOpacity, renderer);

    // 2. Punch holes.
    applyEraseStrokes(ctx, el);

    // 3. Composite the masked layer back onto the main canvas at device pixels.
    mainCtx.save();
    mainCtx.setTransform(1, 0, 0, 1, 0, 0);
    mainCtx.globalAlpha = 1;
    mainCtx.globalCompositeOperation = 'source-over';
    mainCtx.filter = 'none';
    mainCtx.drawImage(canvas, 0, 0, sw, sh, sx, sy, sw, sh);
    mainCtx.restore();
}
