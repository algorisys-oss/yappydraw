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
import type { AnimTimeline } from '../types/anim-types';
import { evaluateTimelineAt } from './animation/frame-timeline-evaluator';
import { renderLayersAndElements } from './canvas-renderer';

let ghostCanvas: HTMLCanvasElement | null = null;
let ghostRc: RoughCanvas | null = null;

const PAST_TINT = 'rgba(239, 68, 68, 0.9)';   // red
const FUTURE_TINT = 'rgba(34, 197, 94, 0.9)'; // green

/** Ghost opacity by distance from the playhead: 0.32, 0.22, 0.15, … ≥ 0.08. */
const ghostAlpha = (dist: number) => Math.max(0.08, 0.32 - 0.1 * (dist - 1));

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
        gctx.setTransform(worldTransform);
        renderLayersAndElements(gctx, ghostRc!, {
            ...opts.renderOpts,
            elements: elements.filter(e => ev.visible.has(e.id)),
            animatedStates: ghostStates,
        } as Parameters<typeof renderLayersAndElements>[2]);

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
