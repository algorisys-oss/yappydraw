/**
 * rough-stroke-trace — flatten a shape's RoughJS geometry into polylines so the
 * drawIn/drawOut reveal can trace the *actual* sketch strokes.
 *
 * Why this exists: the reveal used to dash-trace the shape's geometric outline
 * (definePath) with a plain canvas stroke. In sketch style that means a clean
 * line draws on and then pops into RoughJS's multi-pass hand-drawn stroke the
 * instant progress hits 100% — the single most visible seam in a whiteboard-
 * style animation.
 *
 * Instead we re-run the shape's own `renderSketch()` against a capture proxy
 * that generates the RoughJS drawables but never paints them, flatten their
 * stroke ops to polylines, and dash-reveal those. The reveal therefore ends on
 * exactly the strokes the finished shape renders — no pop.
 *
 * Seeds are pinned (`seed: el.seed || 1`, see RenderPipeline.buildRenderOptions),
 * so the captured geometry is identical frame to frame.
 */

import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { Drawable } from 'roughjs/bin/core';
import type { IRenderer } from '../../rendering/IRenderer';
import { generateDrawable, ROUGH_DRAW_METHODS } from '../rough-cache';

// ── Types ────────────────────────────────────────────────────────

export interface TracedPath {
    /** One flat [x0,y0,x1,y1,…] array per subpath, in RoughJS's own drawing order. */
    subpaths: number[][];
    /** Arc length of each subpath, index-aligned with `subpaths`. */
    lengths: number[];
    /**
     * Subpath indices grouped into one visual stroke. RoughJS traces each segment
     * twice (the two passes that give it its hand-drawn wobble), so those two
     * subpaths must reveal together or the shape appears to be drawn twice.
     */
    groups: number[][];
    /** Reveal length of each group — the longest member, since passes cover the same ground. */
    groupLengths: number[];
    /**
     * Sum of `groupLengths`: the reveal timeline, and roughly the shape's real
     * outline length (not the doubled sum of every pass). Zero means "nothing
     * traceable" — the caller should fall back to the geometric outline.
     */
    total: number;
}

/** Shared "nothing traceable" result — callers fall back to the geometric outline. */
export const EMPTY_TRACE: TracedPath = { subpaths: [], lengths: [], groups: [], groupLengths: [], total: 0 };

// ── Capture proxy ────────────────────────────────────────────────

/**
 * Wrap a RoughCanvas so drawing calls produce Drawables into `sink` without
 * painting anything. Works over either a raw `rough.canvas()` or the element
 * cache's proxy — video export passes a raw one, the live canvas a cached one.
 */
export function createCaptureRc(rc: RoughCanvas, sink: Drawable[]): RoughCanvas {
    return new Proxy(rc, {
        get(target, prop, receiver) {
            if (typeof prop === 'string' && ROUGH_DRAW_METHODS.has(prop)) {
                return (...args: any[]) => {
                    const drawable = generateDrawable(target, prop, args);
                    if (drawable) sink.push(drawable);
                    return drawable;
                };
            }
            return Reflect.get(target, prop, receiver);
        },
    });
}

/** IRenderer methods that put pixels on the canvas — no-oped during capture. */
const PAINT_METHODS = new Set([
    'fill', 'stroke', 'fillRect', 'strokeRect',
    'fillPath', 'strokePath',
    'fillText', 'strokeText',
    'drawImage', 'drawImageCropped',
]);

const NOOP = () => { /* swallowed during capture */ };

/**
 * Wrap an IRenderer so painting calls are swallowed but everything else —
 * state, transforms, path building, `measureText` — behaves normally.
 *
 * Needed because not every renderer paints exclusively through `rc`: freehand
 * and several specialty shapes stroke the IRenderer directly, and those calls
 * would otherwise show the finished shape at full opacity during capture.
 */
export function createNullPaintRenderer(renderer: IRenderer): IRenderer {
    return new Proxy(renderer, {
        get(target, prop, receiver) {
            if (typeof prop === 'string' && PAINT_METHODS.has(prop)) return NOOP;
            const value = Reflect.get(target, prop, receiver);
            return typeof value === 'function' ? value.bind(target) : value;
        },
    }) as IRenderer;
}

// ── Flattening ───────────────────────────────────────────────────

const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(bx - ax, by - ay);

/**
 * Append a cubic bezier to `out` as line segments. Segment count scales with
 * chord + control-polygon length so tight curves get more samples than long
 * lazy ones, capped so a pathological curve can't blow up the point count.
 */
function sampleCubic(
    out: number[],
    x0: number, y0: number, x1: number, y1: number,
    x2: number, y2: number, x3: number, y3: number,
): void {
    const spread = dist(x0, y0, x3, y3)
        + dist(x0, y0, x1, y1) + dist(x1, y1, x2, y2) + dist(x2, y2, x3, y3);
    const steps = Math.max(4, Math.min(24, Math.ceil(spread / 8)));
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const mt = 1 - t;
        const a = mt * mt * mt, b = 3 * mt * mt * t, c = 3 * mt * t * t, d = t * t * t;
        out.push(
            a * x0 + b * x1 + c * x2 + d * x3,
            a * y0 + b * y1 + c * y2 + d * y3,
        );
    }
}

function polylineLength(pts: number[]): number {
    let len = 0;
    for (let i = 2; i < pts.length; i += 2) {
        len += dist(pts[i - 2], pts[i - 1], pts[i], pts[i + 1]);
    }
    return len;
}

/**
 * Flatten captured drawables to traceable polylines.
 *
 * Only `path` opsets are traced. `fillPath`/`fillSketch` (solid fill outlines and
 * hachure lines) belong to the reveal's fill phase — tracing hachure alongside
 * the outline both dilutes the stroke length and reads as scribble rather than
 * a drawn shape.
 */
export function flattenDrawables(drawables: Drawable[]): TracedPath {
    const subpaths: number[][] = [];
    // Which opset each subpath came from — passes only ever pair within one opset.
    const owners: number[] = [];
    let owner = 0;

    for (const drawable of drawables) {
        if (!drawable?.sets) continue;
        for (const set of drawable.sets) {
            if (set.type !== 'path' || !set.ops) continue;
            owner++;

            let current: number[] | null = null;
            let cx = 0, cy = 0;

            for (const op of set.ops) {
                const d = op.data;
                if (op.op === 'move') {
                    if (current && current.length >= 4) { subpaths.push(current); owners.push(owner); }
                    current = [d[0], d[1]];
                    cx = d[0]; cy = d[1];
                } else if (!current) {
                    continue; // ops before any move — malformed opset, skip
                } else if (op.op === 'lineTo') {
                    current.push(d[0], d[1]);
                    cx = d[0]; cy = d[1];
                } else if (op.op === 'bcurveTo') {
                    sampleCubic(current, cx, cy, d[0], d[1], d[2], d[3], d[4], d[5]);
                    cx = d[4]; cy = d[5];
                }
            }

            if (current && current.length >= 4) { subpaths.push(current); owners.push(owner); }
        }
    }

    if (subpaths.length === 0) return EMPTY_TRACE;

    const lengths = subpaths.map(polylineLength);
    const groups = groupPasses(subpaths, lengths, owners);
    const groupLengths = groups.map(g => Math.max(...g.map(i => lengths[i])));

    return { subpaths, lengths, groups, groupLengths, total: groupLengths.reduce((a, b) => a + b, 0) };
}

type Box = { cx: number; cy: number; w: number; h: number };

function bboxOf(pts: number[]): Box {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < pts.length; i += 2) {
        if (pts[i] < minX) minX = pts[i];
        if (pts[i] > maxX) maxX = pts[i];
        if (pts[i + 1] < minY) minY = pts[i + 1];
        if (pts[i + 1] > maxY) maxY = pts[i + 1];
    }
    return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY };
}

/**
 * Pair up RoughJS's duplicate passes.
 *
 * RoughJS emits each segment twice, back to back, as two jittered traces of the
 * same line — a rectangle comes out as 8 subpaths (4 edges × 2 passes, in
 * perimeter order), an ellipse as 2 full loops.
 *
 * Pairing is decided on bounding box, not endpoints: for closed shapes the two
 * passes deliberately start and finish at different points around the loop (one
 * over-closes to get the sketchy overshoot), so at roughness 3 an ellipse's two
 * passes end ~90px apart while tracing the same oval. Occupying the same box at
 * a similar length is the thing that actually holds for both cases.
 *
 * Everything unmatched stays a group of one, so single-stroke shapes
 * (roughness 0 / disableMultiStroke) and genuinely distinct edges are unaffected.
 */
function groupPasses(subpaths: number[][], lengths: number[], owners: number[]): number[][] {
    const groups: number[][] = [];
    const boxes = subpaths.map(bboxOf);
    let i = 0;

    while (i < subpaths.length) {
        const group = [i];

        if (i + 1 < subpaths.length && owners[i] === owners[i + 1]) {
            const a = boxes[i], b = boxes[i + 1];
            const la = lengths[i], lb = lengths[i + 1];
            const longer = Math.max(la, lb);
            const span = Math.max(a.w, a.h, b.w, b.h);

            // Jitter scales with the segment, so the tolerance does too; the constant
            // keeps degenerate (zero-height) boxes for straight lines workable.
            const tol = 0.15 * span + 4;
            const similarLength = longer > 0 && Math.abs(la - lb) < 0.35 * longer;
            const sameSpot = dist(a.cx, a.cy, b.cx, b.cy) <= tol;
            const sameSize = Math.abs(a.w - b.w) <= tol && Math.abs(a.h - b.h) <= tol;

            if (similarLength && sameSpot && sameSize) {
                group.push(i + 1);
                i++;
            }
        }

        groups.push(group);
        i++;
    }

    return groups;
}

// ── Reveal ───────────────────────────────────────────────────────

/**
 * Stroke `traced` revealed to `progress` (0..1). Caller owns strokeStyle,
 * lineWidth and caps; this only lays down paths and the reveal dash.
 *
 * Groups advance one after another, in RoughJS's own drawing order, so the shape
 * is drawn the way a hand would draw it — edge after edge — rather than every
 * edge growing from its corner at once. Within a group the passes advance in
 * lockstep, so a segment isn't visibly traced twice.
 */
export function strokeTraced(renderer: IRenderer, traced: TracedPath, progress: number): void {
    const t = Math.max(0, Math.min(1, progress));
    if (t <= 0 || traced.total <= 0) return;

    const target = traced.total * t;
    let consumed = 0;

    for (let g = 0; g < traced.groups.length; g++) {
        const groupLength = traced.groupLengths[g];
        if (groupLength <= 0) continue;

        const local = (target - consumed) / groupLength;
        consumed += groupLength;
        if (local <= 0) break;          // this group and every later one is untouched
        const localT = Math.min(1, local);

        for (const i of traced.groups[g]) {
            const pts = traced.subpaths[i];
            const len = traced.lengths[i];
            if (len <= 0 || pts.length < 4) continue;

            // Each pass advances by the group's fraction of its OWN length, so passes
            // of slightly different lengths still finish together.
            // `len + 1` for the gap so the tail never wraps and re-draws the start.
            if (localT < 1) renderer.setLineDash([len * localT, len + 1]);
            else renderer.setLineDash([]);
            renderer.lineDashOffset = 0;

            renderer.beginPath();
            renderer.moveTo(pts[0], pts[1]);
            for (let k = 2; k < pts.length; k += 2) renderer.lineTo(pts[k], pts[k + 1]);
            renderer.stroke();
        }
    }
}

// ── Memo ─────────────────────────────────────────────────────────

/**
 * Traces are memoised on the element's geometry hash because the element-level
 * RoughJS cache is bypassed for animating elements (`shouldCache = !animState`
 * in canvas-renderer), which is exactly when drawIn runs. Without this the
 * capture pass would re-generate RoughJS geometry on every frame of every
 * reveal — the dominant cost in a scene where several shapes draw at once.
 */
const memo = new Map<string, TracedPath>();
const MAX_MEMO = 400;

export function tracedFor(key: string, produce: () => Drawable[]): TracedPath {
    const hit = memo.get(key);
    if (hit) return hit;

    let traced: TracedPath;
    try {
        traced = flattenDrawables(produce());
    } catch {
        traced = EMPTY_TRACE; // a throwing renderer falls back, it must not break the frame
    }

    if (memo.size >= MAX_MEMO) memo.clear();
    // Empty results are memoised too, so shapes that never reach `rc` stop
    // re-capturing every frame and settle on the geometric-outline fallback.
    memo.set(key, traced);
    return traced;
}

export function clearStrokeTraceCache(): void {
    memo.clear();
}
