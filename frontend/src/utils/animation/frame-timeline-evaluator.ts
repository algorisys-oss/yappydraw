/**
 * Frame-timeline evaluator — Animation mode's pure seek function.
 *
 * `evaluateTimelineAt(frame, timeline, elements)` resolves, with NO side
 * effects, what a frame LOOKS like: which elements are visible (the "cel"
 * model — each keyframe owns element ids) and the tweened pose overrides for
 * motion spans. The caller merges the overrides into the render-time
 * `animatedStates` map exactly like `evaluateCompositionAt`, so scrubbing,
 * playback and video export are WYSIWYG-identical.
 *
 * Convention difference from the seconds-based composition evaluator: a span's
 * tween and easing live on the keyframe the span LEAVES (Animate semantics —
 * you set the tween on the span's start frame), not on the right keyframe.
 */

import type { DrawingElement, SymbolDef } from '../../types';
import type { AnimTimeline, AnimLayer, AnimKeyframe } from '../../types/anim-types';
import type { DrawingElementState } from '../../types/motion-types';
import { lerp, lerpColor } from './animation-types';
import { easeProgress } from './composition-evaluator';

export interface TimelineEval {
    /** Element ids visible at this frame (union of every row's active keyframe). */
    visible: Set<string>;
    /** elementId → tweened pose overrides (only for elements inside a motion span). */
    overrides: Record<string, Partial<DrawingElementState>>;
    /** elementId → the frame its owning keyframe starts at (movieclip local clocks). */
    placement: Map<string, number>;
}

/** Numeric pose properties a motion tween interpolates. */
const TWEEN_NUMERIC: (keyof DrawingElementState & keyof DrawingElement)[] =
    ['x', 'y', 'width', 'height', 'angle', 'opacity'];
/** Color pose properties a motion tween interpolates. */
const TWEEN_COLOR: ('backgroundColor' | 'strokeColor')[] = ['backgroundColor', 'strokeColor'];

/** Index of the active keyframe for `frame` (last kf with kf.frame <= frame), or -1. */
export function activeKeyframeIndex(layer: AnimLayer, frame: number): number {
    const kfs = layer.keyframes;
    if (kfs.length === 0 || frame < kfs[0].frame || frame > layer.endFrame) return -1;
    let lo = 0;
    let hi = kfs.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (kfs[mid].frame <= frame) lo = mid;
        else hi = mid - 1;
    }
    return lo;
}

/** Interpolate matched elements of a motion span at eased progress `p`. */
function tweenOverrides(
    a: AnimKeyframe,
    b: AnimKeyframe,
    p: number,
    byId: Map<string, DrawingElement>,
    out: Record<string, Partial<DrawingElementState>>
): void {
    // Match by contentId: the element in `b` continuing an element in `a`.
    const nextByContent = new Map<string, DrawingElement>();
    for (const id of b.elementIds) {
        const el = byId.get(id);
        if (el?.contentId) nextByContent.set(el.contentId, el);
    }
    for (const id of a.elementIds) {
        const from = byId.get(id);
        if (!from) continue;
        const to = from.contentId ? nextByContent.get(from.contentId) : undefined;
        if (!to) continue; // unmatched → hold
        const ov: Partial<DrawingElementState> = {};
        for (const prop of TWEEN_NUMERIC) {
            const av = from[prop] as number | undefined;
            const bv = to[prop] as number | undefined;
            if (typeof av === 'number' && typeof bv === 'number' && av !== bv) {
                let v = lerp(av, bv, p);
                // Round dims to 0.5px so rough.js drawable cache keys stay stable
                // (full-precision size changes regenerate sketch geometry every frame).
                if (prop === 'width' || prop === 'height') v = Math.round(v * 2) / 2;
                (ov as any)[prop] = v;
            }
        }
        for (const prop of TWEEN_COLOR) {
            const av = from[prop];
            const bv = to[prop];
            if (typeof av === 'string' && typeof bv === 'string' && av !== bv
                && av.startsWith('#') && bv.startsWith('#')) {
                ov[prop] = lerpColor(av, bv, p);
            }
        }
        if (Object.keys(ov).length > 0) out[id] = ov;
    }
}

/**
 * THE seek function. Pure: resolves visibility + tween overrides + keyframe
 * placement for every timeline row at integer `frame`. No store mutation.
 */
export function evaluateTimelineAt(
    frame: number,
    timeline: AnimTimeline,
    elements: readonly DrawingElement[]
): TimelineEval {
    const visible = new Set<string>();
    const overrides: Record<string, Partial<DrawingElementState>> = {};
    const placement = new Map<string, number>();

    let byId: Map<string, DrawingElement> | null = null; // built lazily, only when a span tweens

    for (const layer of timeline.layers) {
        const ki = activeKeyframeIndex(layer, frame);
        if (ki === -1) continue;
        const a = layer.keyframes[ki];
        for (const id of a.elementIds) {
            visible.add(id);
            placement.set(id, a.frame);
        }
        const b = layer.keyframes[ki + 1];
        if (a.tween === 'motion' && b && frame > a.frame) {
            if (!byId) byId = new Map(elements.map(e => [e.id, e]));
            const raw = (frame - a.frame) / (b.frame - a.frame);
            tweenOverrides(a, b, easeProgress(a, raw), byId, overrides);
        }
    }
    return { visible, overrides, placement };
}

/**
 * Clip-local frame for a movieclip instance, as a pure function of the root
 * playhead — deterministic so scrub/export/undo stay WYSIWYG (no runtime state).
 */
export function clipLocalFrame(
    rootFrame: number,
    placementFrame: number,
    frameCount: number,
    loopMode: 'loop' | 'once' | 'single' = 'loop',
    firstFrame: number = 0
): number {
    const n = Math.max(1, frameCount);
    const start = Math.min(Math.max(0, firstFrame), n - 1);
    if (loopMode === 'single') return start;
    const local = start + Math.max(0, rootFrame - placementFrame);
    if (loopMode === 'once') return Math.min(local, n - 1);
    return local % n;
}

/** Evaluate a movieclip symbol's own timeline at a clip-local frame. */
export function evaluateSymbolTimelineAt(localFrame: number, sym: SymbolDef): TimelineEval {
    if (!sym.timeline) return { visible: new Set(sym.elements.map(e => e.id)), overrides: {}, placement: new Map() };
    return evaluateTimelineAt(localFrame, sym.timeline, sym.elements);
}
