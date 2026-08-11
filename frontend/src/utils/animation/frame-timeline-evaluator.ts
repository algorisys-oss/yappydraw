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
import { MorphUtils } from '../math/morph-utils';

/** Pose overrides, plus interpolated outline points during a SHAPE tween
 *  (center-relative, consumed by ShapeRenderer.renderCustomPoints). */
export type FrameOverride = Partial<DrawingElementState> & { points?: { x: number; y: number }[] };

export interface TimelineEval {
    /** Element ids visible at this frame (union of every row's active keyframe). */
    visible: Set<string>;
    /** elementId → tweened pose/geometry overrides (elements inside a tween span). */
    overrides: Record<string, FrameOverride>;
    /** elementId → the frame its owning keyframe starts at (movieclip local clocks). */
    placement: Map<string, number>;
}

/** Numeric pose properties a motion tween interpolates. */
const TWEEN_NUMERIC: (keyof DrawingElementState & keyof DrawingElement)[] =
    ['x', 'y', 'width', 'height', 'angle', 'opacity'];
/** Color pose properties a motion tween interpolates. */
const TWEEN_COLOR: ('backgroundColor' | 'strokeColor')[] = ['backgroundColor', 'strokeColor'];

/** Types whose base renderer consumes `points` natively (top-left-relative) —
 *  the center-relative morph override would misrender them, so shape tweens
 *  degrade to plain motion tweens for these. */
const NO_MORPH_TYPES = new Set(['draw', 'ink', 'line', 'arrow', 'bezier', 'elbow', 'polyline', 'organicBranch', 'symbolInstance', 'text', 'richtext']);

const MORPH_SAMPLES = 64;

// ---------------------------------------------------------------------------
// Motion guides — follow a line/path element's curve across the span
// ---------------------------------------------------------------------------

type Pt = { x: number; y: number };

/** Points arrive packed ([x0,y0,x1,y1,…]) or as objects; normalize to objects. */
const toPointObjects = (pts: any): Pt[] => {
    if (!Array.isArray(pts) || pts.length === 0) return [];
    if (typeof pts[0] === 'number') {
        const out: Pt[] = [];
        for (let i = 0; i + 1 < pts.length; i += 2) out.push({ x: pts[i], y: pts[i + 1] });
        return out;
    }
    return pts as Pt[];
};

/** Types whose own `points` are relative to the element's top-left corner
 *  (geometry-derived outlines are center-relative instead). */
const TOPLEFT_POINT_TYPES = new Set(['line', 'arrow', 'polyline', 'draw', 'ink', 'bezier', 'organicBranch']);

/** A guide element's curve as ABSOLUTE canvas points (open polyline). */
export const guidePolyline = (guide: DrawingElement): Pt[] => {
    if (TOPLEFT_POINT_TYPES.has(guide.type)) {
        // Their points are top-left-relative; a plain line may have NO points
        // at all (endpoints implied by the frame: (x,y) → (x+w, y+h)).
        const raw = (guide as any).points
            ? toPointObjects((guide as any).points)
            : [{ x: 0, y: 0 }, { x: guide.width, y: guide.height }];
        return raw.map(p => ({ x: p.x + guide.x, y: p.y + guide.y }));
    }
    const rel = MorphUtils.getPointsFromElement(guide);
    const cx = guide.x + guide.width / 2, cy = guide.y + guide.height / 2;
    return rel.map(p => ({ x: p.x + cx, y: p.y + cy }));
};

/** Point + tangent angle at fraction `t` (0..1 by arc length) along an OPEN polyline. */
export const samplePolyline = (pts: Pt[], t: number): { x: number; y: number; angle: number } => {
    if (pts.length === 0) return { x: 0, y: 0, angle: 0 };
    if (pts.length === 1) return { ...pts[0], angle: 0 };
    const lens: number[] = [];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
        const l = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
        lens.push(l);
        total += l;
    }
    if (total === 0) return { ...pts[0], angle: 0 };
    let target = Math.min(Math.max(0, t), 1) * total;
    for (let i = 0; i < lens.length; i++) {
        if (target <= lens[i] || i === lens.length - 1) {
            const f = lens[i] === 0 ? 0 : target / lens[i];
            const a = pts[i], b = pts[i + 1];
            return {
                x: a.x + (b.x - a.x) * f,
                y: a.y + (b.y - a.y) * f,
                angle: Math.atan2(b.y - a.y, b.x - a.x),
            };
        }
        target -= lens[i];
    }
    return { ...pts[pts.length - 1], angle: 0 };
};

/** Guide polylines cache — same identity-keyed strategy as the morph cache. */
const guideCache = new WeakMap<DrawingElement, Pt[]>();
const guidePoints = (guide: DrawingElement): Pt[] => {
    let pts = guideCache.get(guide);
    if (!pts) { pts = guidePolyline(guide); guideCache.set(guide, pts); }
    return pts;
};

/** Morph endpoints are pure functions of the two element objects, which the
 *  store replaces wholesale on any edit — so a WeakMap keyed on the FROM
 *  element caches the resampled/aligned outlines across frames. */
const morphCache = new WeakMap<DrawingElement, { to: DrawingElement; start: { x: number; y: number }[]; end: { x: number; y: number }[] }>();

const morphEndpoints = (from: DrawingElement, to: DrawingElement) => {
    const hit = morphCache.get(from);
    if (hit && hit.to === to) return hit;
    const start = MorphUtils.resamplePolygon(MorphUtils.getPointsFromElement(from), MORPH_SAMPLES);
    const end = MorphUtils.alignPolygons(start, MorphUtils.resamplePolygon(MorphUtils.getPointsFromElement(to), MORPH_SAMPLES));
    const entry = { to, start, end };
    morphCache.set(from, entry);
    return entry;
};

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

/** Interpolate matched elements of a motion/shape span at eased progress `p`. */
function tweenOverrides(
    a: AnimKeyframe,
    b: AnimKeyframe,
    p: number,
    byId: Map<string, DrawingElement>,
    out: Record<string, FrameOverride>
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
        const ov: FrameOverride = {};
        // Shape tween: additionally morph the OUTLINE between the two cels'
        // geometry (resampled + twist-aligned, center-relative — rendered by
        // ShapeRenderer.renderCustomPoints inside the lerped pose box).
        if (a.tween === 'shape' && !NO_MORPH_TYPES.has(from.type) && !NO_MORPH_TYPES.has(to.type)) {
            const { start, end } = morphEndpoints(from, to);
            ov.points = MorphUtils.interpolatePoints(start, end, p);
        }
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
        // Pose tween (stick figures): interpolate the rig pose between the two
        // cels. Same clip → the phase glides through the cycle (limbs + foot IK
        // follow); different clips → cross-clip pose blend via `blendTo`, which
        // the renderer resolves with lerpRigPose. Always pinned (`playing:false`)
        // so scrub/playback/export agree frame-exactly.
        if (from.type === 'stickRig' && from.stickRig && to.stickRig) {
            const ra = from.stickRig, rb = to.stickRig;
            const pa = ra.previewPhase ?? 0, pb = rb.previewPhase ?? 0;
            (ov as any).stickRig = ra.clip === rb.clip
                ? { ...ra, playing: false, previewPhase: lerp(pa, pb, p) }
                : { ...ra, playing: false, previewPhase: pa, blendTo: { clip: rb.clip, phase: pb, f: p } };
        }
        // Motion guide: the element's CENTER rides the guide curve from start to
        // end across the span (replacing the straight-line x/y lerp); optional
        // orient turns it to face along the path.
        if (a.guideId) {
            const guide = byId.get(a.guideId);
            if (guide) {
                const pt = samplePolyline(guidePoints(guide), p);
                const w = (ov.width ?? from.width) as number;
                const h = (ov.height ?? from.height) as number;
                ov.x = pt.x - w / 2;
                ov.y = pt.y - h / 2;
                if (a.guideOrient) ov.angle = pt.angle;
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
        if ((a.tween === 'motion' || a.tween === 'shape') && b && frame > a.frame) {
            if (!byId) byId = new Map(elements.map(e => [e.id, e]));
            const raw = (frame - a.frame) / (b.frame - a.frame);
            tweenOverrides(a, b, easeProgress(a, raw), byId, overrides);
        }
    }
    return { visible, overrides, placement };
}

/**
 * `elements` with this frame's tween pose baked in — the SAME geometry the
 * canvas draws (canvas-renderer merges the identical override map into
 * `renderedEl`, and selection-renderer draws the handles off that).
 *
 * Hit-testing MUST consume this rather than the raw store: on any frame inside
 * a tween span the two disagree, so the handles were drawn at the tweened pose
 * while their hit boxes stayed at the owning keyframe's pose — the shape showed
 * a selection outline and no handle could be grabbed.
 *
 * Returns the input array itself when nothing is overridden, so the (far more
 * common) non-animation path allocates nothing per pointer event.
 */
export function poseElementsAtFrame(
    frame: number,
    timeline: AnimTimeline | null | undefined,
    elements: readonly DrawingElement[]
): readonly DrawingElement[] {
    if (!timeline) return elements;
    const { overrides } = evaluateTimelineAt(frame, timeline, elements);
    let posed: DrawingElement[] | null = null; // copied lazily — only if something is overridden
    for (let i = 0; i < elements.length; i++) {
        const ov = overrides[elements[i].id];
        if (!ov) continue;
        if (!posed) posed = elements.slice();
        posed[i] = { ...elements[i], ...ov } as DrawingElement;
    }
    return posed ?? elements;
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

/** Camera pose at `frame`: lerped between camera keys (eased on the leaving
 *  key), held outside the key range. Null when the timeline has no camera. */
export function evaluateCameraAt(frame: number, timeline: AnimTimeline): { x: number; y: number; zoom: number } | null {
    const keys = timeline.camera;
    if (!keys || keys.length === 0) return null;
    if (frame <= keys[0].frame || keys.length === 1) return { x: keys[0].x, y: keys[0].y, zoom: keys[0].zoom };
    const last = keys[keys.length - 1];
    if (frame >= last.frame) return { x: last.x, y: last.y, zoom: last.zoom };
    let i = 0;
    while (i + 1 < keys.length && keys[i + 1].frame <= frame) i++;
    const a = keys[i], b = keys[i + 1];
    const p = easeProgress(a, (frame - a.frame) / (b.frame - a.frame));
    return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), zoom: lerp(a.zoom, b.zoom, p) };
}

/** Evaluate a movieclip symbol's own timeline at a clip-local frame. */
export function evaluateSymbolTimelineAt(localFrame: number, sym: SymbolDef): TimelineEval {
    if (!sym.timeline) return { visible: new Set(sym.elements.map(e => e.id)), overrides: {}, placement: new Map() };
    return evaluateTimelineAt(localFrame, sym.timeline, sym.elements);
}
