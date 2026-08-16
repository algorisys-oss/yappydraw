/**
 * Onion skinning for Animation mode — ghosts of neighboring frames rendered
 * under the current cel (red = past, green = future, alpha falling with
 * distance).
 *
 * Each ghost frame is rendered through the REAL scene renderer into a shared
 * offscreen canvas, then tinted with `source-atop` and blitted. Whole-frame
 * tinting is renderer-agnostic: sketch (rough.js) and architectural output get
 * identical ghosts without per-primitive color plumbing. Only drawn while the
 * playhead is paused, so there's no caching to invalidate.
 */

import rough from 'roughjs';
import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { DrawingElement } from '../types';
import type { AnimTimeline, PegTransform } from '../types/anim-types';
import { evaluateTimelineAt } from './animation/frame-timeline-evaluator';
import { pegAt } from './animation/frame-timeline-ops';
import { renderLayersAndElements } from './canvas-renderer';

let ghostCanvas: HTMLCanvasElement | null = null;
let ghostRc: RoughCanvas | null = null;

const PAST_TINT = 'rgba(239, 68, 68, 0.9)';   // red
const FUTURE_TINT = 'rgba(34, 197, 94, 0.9)'; // green

/** Ghost opacity by distance from the playhead: 0.32, 0.22, 0.15, … ≥ 0.08. */
const ghostAlpha = (dist: number) => Math.max(0.08, 0.32 - 0.1 * (dist - 1));

/** Bounding-box centre of a set of elements — the pivot an out-of-pegs rotate
 *  or scale turns about. Uses the stored box, so a tweened ghost pivots a few
 *  pixels off its drawn position; invisible at ghost opacities. */
const centreOf = (els: readonly DrawingElement[]): { x: number; y: number } => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const e of els) {
        const x0 = Math.min(e.x, e.x + (e.width ?? 0));
        const x1 = Math.max(e.x, e.x + (e.width ?? 0));
        const y0 = Math.min(e.y, e.y + (e.height ?? 0));
        const y1 = Math.max(e.y, e.y + (e.height ?? 0));
        if (x0 < minX) minX = x0;
        if (x1 > maxX) maxX = x1;
        if (y0 < minY) minY = y0;
        if (y1 > maxY) maxY = y1;
    }
    return Number.isFinite(minX) ? { x: (minX + maxX) / 2, y: (minY + maxY) / 2 } : { x: 0, y: 0 };
};

export interface OnionRenderOpts {
    canvas: HTMLCanvasElement;
    timeline: AnimTimeline;
    elements: DrawingElement[];
    currentFrame: number;
    before: number;
    after: number;
    /** The base option object handed to renderLayersAndElements for the main
     *  scene — reused per ghost with elements/animatedStates swapped out. */
    renderOpts: Omit<Parameters<typeof renderLayersAndElements>[2], 'elements' | 'animatedStates'>;
}

/** Draw the onion ghosts. Call with `ctx` already in world-space — the ghost
 *  canvas copies its transform, and blitting resets to identity. */
export function renderOnionSkins(ctx: CanvasRenderingContext2D, opts: OnionRenderOpts): void {
    const { canvas, timeline, elements, currentFrame, before, after } = opts;
    if (before <= 0 && after <= 0) return;

    if (!ghostCanvas || ghostCanvas.width !== canvas.width || ghostCanvas.height !== canvas.height) {
        ghostCanvas = ghostCanvas ?? document.createElement('canvas');
        ghostCanvas.width = canvas.width;
        ghostCanvas.height = canvas.height;
        ghostRc = rough.canvas(ghostCanvas);
    }
    const gctx = ghostCanvas.getContext('2d')!;
    const worldTransform = ctx.getTransform();

    // Far → near so closer ghosts draw over farther ones.
    const offsets: number[] = [];
    for (let o = before; o >= 1; o--) offsets.push(-o);
    for (let o = after; o >= 1; o--) offsets.push(o);
    offsets.sort((a, b) => Math.abs(b) - Math.abs(a));

    for (const off of offsets) {
        const frame = currentFrame + off;
        if (frame < 0 || frame > timeline.frameCount - 1) continue;
        const ev = evaluateTimelineAt(frame, timeline, elements);
        if (ev.visible.size === 0) continue;

        const ghostStates = new Map<string, any>();
        for (const id in ev.overrides) ghostStates.set(id, { ...ev.overrides[id] });

        gctx.setTransform(1, 0, 0, 1, 0, 0);
        gctx.globalCompositeOperation = 'source-over';
        gctx.clearRect(0, 0, ghostCanvas.width, ghostCanvas.height);

        const visible = elements.filter(e => ev.visible.has(e.id));
        const drawSet = (els: DrawingElement[], peg: PegTransform | null) => {
            if (els.length === 0) return;
            gctx.save();
            gctx.setTransform(worldTransform);
            if (peg) {
                // Rotate/scale about the cel's own centre so the ghost pivots where
                // the drawing is, not around the world origin.
                const c = centreOf(els);
                gctx.translate(c.x + peg.x, c.y + peg.y);
                gctx.rotate(peg.angle);
                gctx.scale(peg.scale, peg.scale);
                gctx.translate(-c.x, -c.y);
            }
            renderLayersAndElements(gctx, ghostRc!, {
                ...opts.renderOpts,
                elements: els,
                animatedStates: ghostStates,
            } as Parameters<typeof renderLayersAndElements>[2]);
            gctx.restore();
        };

        // Out of pegs: a cel can be shifted for THIS ghost only. Pegged layers are
        // drawn in their own pass, which costs their exact stacking against the
        // un-pegged ones — a fair trade for a display aid that exists to be moved
        // out of place anyway.
        const pegged = new Map<string, PegTransform>();
        for (const row of timeline.layers) {
            const p = pegAt(timeline, row.layerId, frame);
            if (p && (p.x !== 0 || p.y !== 0 || p.angle !== 0 || p.scale !== 1)) pegged.set(row.layerId, p);
        }
        if (pegged.size === 0) {
            drawSet(visible, null);
        } else {
            drawSet(visible.filter(e => !pegged.has(e.layerId ?? '')), null);
            for (const [layerId, peg] of pegged) drawSet(visible.filter(e => e.layerId === layerId), peg);
        }

        // Tint everything drawn (and only what was drawn).
        gctx.setTransform(1, 0, 0, 1, 0, 0);
        gctx.globalCompositeOperation = 'source-atop';
        gctx.fillStyle = off < 0 ? PAST_TINT : FUTURE_TINT;
        gctx.fillRect(0, 0, ghostCanvas.width, ghostCanvas.height);

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = ghostAlpha(Math.abs(off));
        ctx.drawImage(ghostCanvas, 0, 0);
        ctx.restore();
    }
}
