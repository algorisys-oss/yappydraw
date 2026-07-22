/**
 * After-Effects–class absolute-time evaluator — Phase 0 "spine".
 *
 * A single PURE, deterministic function, `evaluateCompositionAt(t, tracks)`, that
 * random-access seeks every `PropertyTrack` to time `t` and returns the property
 * overrides to apply for rendering. It has NO side effects on the store — the
 * caller merges the result into the render-time `animatedStates` map (see
 * `applyCompositionOverrides`), so the same evaluator drives the scrubber preview,
 * the RAF playback loop and the video export identically (WYSIWYG).
 *
 * This is deliberately decoupled from the trigger/duration-based `Timeline` (which
 * only plays forward). See `docs/after-effects-plan.md` §3.
 */

import type { DrawingElement } from '../../types';
import type {
    PropertyTrack,
    TimedKeyframe,
    BezierEase,
    DrawingElementState,
    KeyframeAnimation,
} from '../../types/motion-types';
import { lerp, lerpColor, getEasing } from './animation-types';

/** Properties interpolated as hex colors rather than numbers. */
const COLOR_PROPERTIES = new Set([
    'backgroundColor',
    'strokeColor',
    'textColor',
    'fill',
    'stroke',
    'color',
]);

function isColorProperty(property: string, sample: number | string): boolean {
    if (COLOR_PROPERTIES.has(property)) return true;
    return typeof sample === 'string' && sample.trim().startsWith('#');
}

/**
 * Solve a CSS-style cubic bezier `(0,0)-(p1x,p1y)-(p2x,p2y)-(1,1)` for `y` given
 * `x` (the normalized time fraction). Newton–Raphson with a bisection fallback —
 * the same technique browsers use for `cubic-bezier()` timing functions.
 */
function cubicBezierYForX(p1x: number, p1y: number, p2x: number, p2y: number, x: number): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    const ax = 3 * p1x - 3 * p2x + 1;
    const bx = 3 * p2x - 6 * p1x;
    const cx = 3 * p1x;
    const sampleX = (u: number) => ((ax * u + bx) * u + cx) * u;
    const sampleDX = (u: number) => (3 * ax * u + 2 * bx) * u + cx;

    // Find parameter u such that sampleX(u) ≈ x.
    let u = x;
    for (let i = 0; i < 8; i++) {
        const dx = sampleX(u) - x;
        if (Math.abs(dx) < 1e-6) break;
        const d = sampleDX(u);
        if (Math.abs(d) < 1e-6) break;
        u -= dx / d;
    }
    // Bisection fallback if Newton drifted out of range.
    if (u < 0 || u > 1) {
        let lo = 0;
        let hi = 1;
        u = x;
        for (let i = 0; i < 20; i++) {
            const cur = sampleX(u);
            if (Math.abs(cur - x) < 1e-6) break;
            if (cur < x) lo = u;
            else hi = u;
            u = (lo + hi) / 2;
        }
    }

    const ay = 3 * p1y - 3 * p2y + 1;
    const by = 3 * p2y - 6 * p1y;
    const cy = 3 * p1y;
    return ((ay * u + by) * u + cy) * u;
}

/** Map a raw 0..1 progress through a keyframe's easing (bezier handles win over named).
 *  Structural param so both TimedKeyframe (seconds) and AnimKeyframe (frames) share it. */
export function easeProgress(k: Pick<TimedKeyframe, 'ease' | 'easing'>, progress: number): number {
    const ease: BezierEase | undefined = k.ease;
    if (ease) {
        return cubicBezierYForX(ease.ox, ease.oy, ease.ix, ease.iy, progress);
    }
    return getEasing(k.easing)(progress);
}

/**
 * Evaluate a single track at absolute time `t`, returning the property's value.
 * Holds at the first/last keyframe outside the track's range (AE default).
 */
function evaluateTrack(track: PropertyTrack, t: number): number | string | undefined {
    const keys = track.keys;
    if (!keys || keys.length === 0) return undefined;
    if (keys.length === 1 || t <= keys[0].t) return keys[0].value;
    const last = keys[keys.length - 1];
    if (t >= last.t) return last.value;

    // Binary search for the bracketing segment [a, b] with a.t <= t < b.t.
    let lo = 0;
    let hi = keys.length - 1;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (keys[mid].t <= t) lo = mid;
        else hi = mid;
    }
    const a = keys[lo];
    const b = keys[hi];

    // Hold (stepped) keyframe: the segment entering `b` holds `a`'s value until `b.t`.
    if (b.hold) return a.value;

    const span = b.t - a.t;
    const raw = span <= 0 ? 1 : (t - a.t) / span;
    // The segment's easing belongs to the RIGHT keyframe (easing INTO b).
    const p = easeProgress(b, raw);

    if (isColorProperty(track.property, a.value) || isColorProperty(track.property, b.value)) {
        return lerpColor(String(a.value), String(b.value), p);
    }
    return lerp(Number(a.value), Number(b.value), p);
}

/**
 * THE seek function. Pure: evaluates every track at time `t` (seconds) and returns
 * a map of elementId → partial state overrides. No store mutation.
 */
export function evaluateCompositionAt(
    t: number,
    tracks: PropertyTrack[]
): Map<string, Partial<DrawingElementState>> {
    const out = new Map<string, Partial<DrawingElementState>>();
    if (!tracks || tracks.length === 0) return out;

    for (const track of tracks) {
        if (!track || !track.elementId || !track.property) continue;
        const value = evaluateTrack(track, t);
        if (value === undefined) continue;
        let entry = out.get(track.elementId);
        if (!entry) {
            entry = {};
            out.set(track.elementId, entry);
        }
        (entry as Record<string, number | string>)[track.property] = value;
    }
    return out;
}

// ============================================================================
// Transform parenting (Phase 3). A child element with `transformParentId` inherits
// its parent's ANIMATED position/rotation/scale. Modelled as affine "deltas": each
// element's delta maps its rest pose onto its own-animated pose; a child's world
// delta is `parentWorldDelta ∘ ownDelta`, composed up the chain. This is a separate
// concern from `parentId` (mindmap tree) — see docs/after-effects-plan.md §12.
// ============================================================================

// 2×3 affine matrix [a,b,c,d,e,f]: (x,y) → (a·x + c·y + e, b·x + d·y + f).
type Mat = [number, number, number, number, number, number];
const IDENTITY: Mat = [1, 0, 0, 1, 0, 0];
const matMul = (m: Mat, n: Mat): Mat => [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
];
const matApply = (m: Mat, x: number, y: number): [number, number] => [
    m[0] * x + m[2] * y + m[4],
    m[1] * x + m[3] * y + m[5],
];
const T = (x: number, y: number): Mat => [1, 0, 0, 1, x, y];
const R = (a: number): Mat => { const c = Math.cos(a), s = Math.sin(a); return [c, s, -s, c, 0, 0]; };
const Sc = (sx: number, sy: number): Mat => [sx, 0, 0, sy, 0, 0];

/** An element's own-animated numeric transform (stored value overridden by its tracks). */
interface Pose { cx: number; cy: number; w: number; h: number; angle: number }
const restPose = (el: DrawingElement): Pose => ({
    cx: el.x + el.width / 2, cy: el.y + el.height / 2, w: el.width, h: el.height, angle: el.angle || 0,
});
const animatedPose = (el: DrawingElement, ov: Partial<DrawingElementState> | undefined): Pose => {
    const w = (ov?.width as number) ?? el.width;
    const h = (ov?.height as number) ?? el.height;
    const x = (ov?.x as number) ?? el.x;
    const y = (ov?.y as number) ?? el.y;
    return { cx: x + w / 2, cy: y + h / 2, w, h, angle: (ov?.angle as number) ?? (el.angle || 0) };
};

/** Delta matrix mapping an element's rest pose onto its own-animated pose. */
const ownDelta = (rest: Pose, anim: Pose): Mat => {
    const sx = rest.w !== 0 ? anim.w / rest.w : 1;
    const sy = rest.h !== 0 ? anim.h / rest.h : 1;
    return matMul(
        T(anim.cx, anim.cy),
        matMul(R(anim.angle - rest.angle), matMul(Sc(sx, sy), T(-rest.cx, -rest.cy)))
    );
};

/**
 * Resolve every element's final transform after composing its `transformParentId`
 * chain. Pure. Returns a map of elementId → overrides (composed x/y/width/height/
 * angle for movers & followers, plus any non-transform own props like opacity/color).
 */
export function resolveParentedPoses(
    elements: DrawingElement[],
    t: number,
    tracks: PropertyTrack[]
): Map<string, Partial<DrawingElementState>> {
    const own = evaluateCompositionAt(t, tracks);
    const elMap = new Map(elements.map(e => [e.id, e]));

    // Memoised world delta per element (rest → final), with cycle protection.
    const worldCache = new Map<string, Mat>();
    const worldDelta = (id: string, seen: Set<string>): Mat => {
        const cached = worldCache.get(id);
        if (cached) return cached;
        const el = elMap.get(id);
        if (!el) return IDENTITY;
        const d = ownDelta(restPose(el), animatedPose(el, own.get(id)));
        let result = d;
        const pid = el.transformParentId;
        if (pid && pid !== id && elMap.has(pid) && !seen.has(pid)) {
            seen.add(id);
            result = matMul(worldDelta(pid, seen), d);
            seen.delete(id);
        }
        worldCache.set(id, result);
        return result;
    };

    const out = new Map<string, Partial<DrawingElementState>>();
    // Working set: everything with its own tracks, plus every transform-parented element.
    const workIds = new Set<string>(own.keys());
    for (const el of elements) if (el.transformParentId) workIds.add(el.id);

    for (const id of workIds) {
        const el = elMap.get(id);
        if (!el) continue;
        const W = worldDelta(id, new Set());
        const rest = restPose(el);
        const [fcx, fcy] = matApply(W, rest.cx, rest.cy);
        const scaleX = Math.hypot(W[0], W[1]);
        const scaleY = Math.hypot(W[2], W[3]);
        const angle = rest.angle + Math.atan2(W[1], W[0]);
        const w = rest.w * scaleX;
        const h = rest.h * scaleY;
        // Start from own non-transform props (opacity/colors/text), then bake the pose.
        const entry: Partial<DrawingElementState> = { ...(own.get(id) ?? {}) };
        entry.x = fcx - w / 2;
        entry.y = fcy - h / 2;
        entry.width = w;
        entry.height = h;
        entry.angle = angle;
        out.set(id, entry);
    }
    return out;
}

/**
 * Resolve dotted-path override keys (e.g. `"extrude.depth"`, `"warp.bend"`) into nested
 * object overrides. The render spread is shallow (`{ ...el, ...animState }`), so a nested
 * field must arrive as a COMPLETE object: clone the element's current nested value and set
 * the sub-field(s) on it (multiple dotted keys sharing a root merge into one object).
 * Mutates `overrides` in place.
 */
export function resolveNestedOverrides(
    overrides: Map<string, Partial<DrawingElementState>>,
    elMap: Map<string, DrawingElement>
): void {
    for (const [id, entry] of overrides) {
        const dotted = Object.keys(entry).filter(k => k.includes('.'));
        if (dotted.length === 0) continue;
        const el = elMap.get(id);
        const roots = new Map<string, Record<string, any>>();
        for (const key of dotted) {
            const dot = key.indexOf('.');
            const root = key.slice(0, dot);
            const sub = key.slice(dot + 1);
            if (!roots.has(root)) {
                const base = el && (el as any)[root] && typeof (el as any)[root] === 'object' ? { ...(el as any)[root] } : {};
                roots.set(root, base);
            }
            roots.get(root)![sub] = (entry as any)[key];
            delete (entry as any)[key];
        }
        for (const [root, obj] of roots) (entry as any)[root] = obj;
    }
}

/**
 * Merge composition overrides into the existing render-time `animatedStates` map
 * (which already carries orbit/spin transforms). Mutates and returns `states`.
 * Composition tracks win over orbit/spin for any property they define, matching
 * AE's "keyframes are authoritative" model. The canvas render spread applies every
 * key present on the merged entry (see `canvas-renderer.ts`).
 */
export function applyCompositionOverrides(
    states: Map<string, any>,
    elements: DrawingElement[],
    t: number,
    tracks: PropertyTrack[] | undefined
): Map<string, any> {
    if (!tracks || tracks.length === 0) return states;

    // Parenting present → resolve composed poses; else the flat per-element path.
    const overrides = elements.some(e => e.transformParentId)
        ? resolveParentedPoses(elements, t, tracks)
        : evaluateCompositionAt(t, tracks);
    if (overrides.size === 0) return states;

    // Dotted-path (nested effect) overrides → complete nested objects.
    const elMap = new Map(elements.map(e => [e.id, e]));
    resolveNestedOverrides(overrides, elMap);

    // Only apply to elements that are actually present (culling-safe).
    const liveIds = new Set(elements.map(e => e.id));
    for (const [id, props] of overrides) {
        if (!liveIds.has(id)) continue;
        const existing = states.get(id);
        if (existing) Object.assign(existing, props);
        else states.set(id, { ...props });
    }
    return states;
}

/**
 * Adapter: lift a normalized (offset 0..1) presentation-mode `KeyframeAnimation`
 * onto an absolute-time `PropertyTrack`, so nothing authored in the old model is
 * thrown away. `offset` maps to `delay + offset * duration` (ms → seconds).
 */
export function keyframeAnimationToTrack(
    elementId: string,
    anim: KeyframeAnimation
): PropertyTrack {
    const durationSec = (anim.duration || 0) / 1000;
    const delaySec = (anim.delay || 0) / 1000;
    const keys: TimedKeyframe[] = (anim.keyframes || [])
        .slice()
        .sort((a, b) => a.offset - b.offset)
        .map(kf => ({
            t: delaySec + kf.offset * durationSec,
            value: kf.value,
            easing: kf.easing,
        }));
    return { elementId, property: anim.property, keys };
}
