/**
 * Pure frame-timeline operations — the F5/F6/F7-class span arithmetic of
 * Animation mode, with NO store access so it unit-tests in isolation.
 * `store/anim-ops.ts` is the thin glue that applies these results (history
 * push + setStore). Every function returns brand-new arrays/objects (the
 * one-level-deep undo snapshot contract) or null when the op doesn't apply.
 */

import type { DrawingElement } from '../../types';
import type { AnimTimeline, AnimLayer, AnimKeyframe, AnimAudioClip } from '../../types/anim-types';
import { activeKeyframeIndex } from './frame-timeline-evaluator';

const rowIndex = (tl: AnimTimeline, layerId: string): number =>
    tl.layers.findIndex(l => l.layerId === layerId);

/** Replace one row, keeping frameCount ≥ every row's extent. */
const withRow = (tl: AnimTimeline, li: number, row: AnimLayer): AnimTimeline => {
    const layers = tl.layers.map((l, i) => (i === li ? row : l));
    const maxEnd = Math.max(0, ...layers.map(l => l.endFrame));
    return { ...tl, layers, frameCount: Math.max(tl.frameCount, maxEnd + 1) };
};

const sortKfs = (kfs: AnimKeyframe[]): AnimKeyframe[] =>
    [...kfs].sort((a, b) => a.frame - b.frame);

/** How many keyframes reference each element id across the whole timeline. */
export const refCounts = (tl: AnimTimeline): Map<string, number> => {
    const counts = new Map<string, number>();
    for (const l of tl.layers)
        for (const k of l.keyframes)
            for (const id of k.elementIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    return counts;
};

/** Ids owned EXCLUSIVELY by `kf` (safe to delete when the keyframe goes). */
const exclusiveIds = (tl: AnimTimeline, kf: AnimKeyframe): string[] => {
    const counts = refCounts(tl);
    return kf.elementIds.filter(id => (counts.get(id) ?? 0) <= 1);
};

/** F5 — Insert Frame: lengthen the span under `frame` (or extend the row to `frame`). */
export const opInsertFrame = (tl: AnimTimeline, layerId: string, frame: number): AnimTimeline | null => {
    const li = rowIndex(tl, layerId);
    if (li === -1 || frame < 0) return null;
    const row = tl.layers[li];
    if (frame > row.endFrame) return withRow(tl, li, { ...row, endFrame: frame });
    const keyframes = row.keyframes.map(k => (k.frame > frame ? { ...k, frame: k.frame + 1 } : k));
    return withRow(tl, li, { ...row, keyframes, endFrame: row.endFrame + 1 });
};

export interface InsertKeyframeResult {
    timeline: AnimTimeline;
    /** Deep copies of the previous cel's elements (fresh ids, shared contentId). */
    copies: DrawingElement[];
    /** sourceElementId → contentId to backfill on elements that had none yet. */
    sourcePatch: Map<string, string>;
    newElementIds: string[];
}

/** F6 — Insert Keyframe: split the span at `frame`, duplicating the previous cel. */
export const opInsertKeyframe = (
    tl: AnimTimeline,
    layerId: string,
    frame: number,
    elements: readonly DrawingElement[],
    genId: (type: string) => string
): InsertKeyframeResult | null => {
    const li = rowIndex(tl, layerId);
    if (li === -1 || frame < 0) return null;
    const row = tl.layers[li];
    if (row.keyframes.some(k => k.frame === frame)) return null;

    const prevIdx = activeKeyframeIndex({ ...row, endFrame: Math.max(row.endFrame, frame) }, frame);
    const prev = prevIdx === -1 ? null : row.keyframes[prevIdx];

    const copies: DrawingElement[] = [];
    const sourcePatch = new Map<string, string>();
    if (prev) {
        for (const id of prev.elementIds) {
            const src = elements.find(e => e.id === id);
            if (!src) continue;
            const contentId = src.contentId ?? src.id;
            if (!src.contentId) sourcePatch.set(src.id, contentId);
            const copy: DrawingElement = JSON.parse(JSON.stringify(src));
            copy.id = genId(src.type);
            copy.contentId = contentId;
            copies.push(copy);
        }
    }
    const kf: AnimKeyframe = {
        frame,
        elementIds: copies.map(c => c.id),
        // Splitting a tweened span keeps both halves tweening (Animate behavior).
        ...(prev?.tween && prev.tween !== 'none' && { tween: prev.tween }),
        ...(prev?.ease && { ease: { ...prev.ease } }),
        ...(prev?.easing && { easing: prev.easing }),
    };
    const timeline = withRow(tl, li, {
        ...row,
        keyframes: sortKfs([...row.keyframes, kf]),
        endFrame: Math.max(row.endFrame, frame),
    });
    return { timeline, copies, sourcePatch, newElementIds: kf.elementIds };
};

/** F7 — Insert Blank Keyframe: an empty cel at `frame`. */
export const opInsertBlankKeyframe = (tl: AnimTimeline, layerId: string, frame: number): AnimTimeline | null => {
    const li = rowIndex(tl, layerId);
    if (li === -1 || frame < 0) return null;
    const row = tl.layers[li];
    if (row.keyframes.some(k => k.frame === frame)) return null;
    return withRow(tl, li, {
        ...row,
        keyframes: sortKfs([...row.keyframes, { frame, elementIds: [] }]),
        endFrame: Math.max(row.endFrame, frame),
    });
};

export interface RemoveResult {
    timeline: AnimTimeline;
    /** Element ids that lost their last referencing keyframe (delete from the store). */
    doomedIds: string[];
}

/** Shift+F6 — Clear Keyframe: merge the keyframe at `frame` back into the previous
 *  span (the row's FIRST keyframe becomes blank instead of disappearing). */
export const opClearKeyframe = (tl: AnimTimeline, layerId: string, frame: number): RemoveResult | null => {
    const li = rowIndex(tl, layerId);
    if (li === -1) return null;
    const row = tl.layers[li];
    const ki = row.keyframes.findIndex(k => k.frame === frame);
    if (ki === -1) return null;
    const kf = row.keyframes[ki];
    const doomedIds = exclusiveIds(tl, kf);
    const keyframes = ki === 0
        ? row.keyframes.map((k, i) => (i === 0 ? { ...k, elementIds: [] } : k))
        : row.keyframes.filter((_, i) => i !== ki);
    return { timeline: withRow(tl, li, { ...row, keyframes }), doomedIds };
};

/** Shift+F5 — Remove Frames: delete the frame cell at `frame` (a 1-frame keyframe
 *  disappears with its exclusive content; longer spans just shorten). */
export const opRemoveFrames = (tl: AnimTimeline, layerId: string, frame: number): RemoveResult | null => {
    const li = rowIndex(tl, layerId);
    if (li === -1) return null;
    const row = tl.layers[li];
    if (frame < 0 || frame > row.endFrame || row.endFrame <= 0) return null;

    const ki = row.keyframes.findIndex(k => k.frame === frame);
    const next = row.keyframes.find(k => k.frame > frame);
    const spanIsSingle = ki !== -1 && ((next ? next.frame : row.endFrame + 1) - frame === 1);

    let doomedIds: string[] = [];
    let keyframes = row.keyframes;
    if (spanIsSingle) {
        doomedIds = exclusiveIds(tl, row.keyframes[ki]);
        keyframes = keyframes.filter((_, i) => i !== ki);
    }
    keyframes = keyframes.map(k => (k.frame > frame ? { ...k, frame: k.frame - 1 } : k));
    if (keyframes.length === 0) keyframes = [{ frame: 0, elementIds: [] }];
    return { timeline: withRow(tl, li, { ...row, keyframes, endFrame: row.endFrame - 1 }), doomedIds };
};

/** Drag a keyframe to another frame (null onto an occupied cell). */
export const opMoveKeyframe = (tl: AnimTimeline, layerId: string, fromFrame: number, toFrame: number): AnimTimeline | null => {
    if (toFrame < 0 || fromFrame === toFrame) return null;
    const li = rowIndex(tl, layerId);
    if (li === -1) return null;
    const row = tl.layers[li];
    const ki = row.keyframes.findIndex(k => k.frame === fromFrame);
    if (ki === -1 || row.keyframes.some(k => k.frame === toFrame)) return null;
    const keyframes = sortKfs(row.keyframes.map((k, i) => (i === ki ? { ...k, frame: toFrame } : k)));
    return withRow(tl, li, { ...row, keyframes, endFrame: Math.max(row.endFrame, toFrame) });
};

/** Patch one keyframe's metadata (tween/ease/label). */
export const opUpdateKeyframe = (tl: AnimTimeline, layerId: string, frame: number, patch: Partial<AnimKeyframe>): AnimTimeline | null => {
    const li = rowIndex(tl, layerId);
    if (li === -1) return null;
    const row = tl.layers[li];
    const ki = row.keyframes.findIndex(k => k.frame === frame);
    if (ki === -1) return null;
    const keyframes = row.keyframes.map((k, i) => (i === ki ? { ...k, ...patch } : k));
    return withRow(tl, li, { ...row, keyframes });
};

// ---------------------------------------------------------------------------
// Audio row
// ---------------------------------------------------------------------------

/** Add a sound at `frame` (kept sorted). */
export const opAddAudio = (tl: AnimTimeline, clip: AnimAudioClip): AnimTimeline => ({
    ...tl,
    audio: [...(tl.audio ?? []), clip].sort((a, b) => a.frame - b.frame),
});

/** Remove a sound by id (null when absent). */
export const opRemoveAudio = (tl: AnimTimeline, id: string): AnimTimeline | null => {
    if (!tl.audio?.some(a => a.id === id)) return null;
    return { ...tl, audio: tl.audio.filter(a => a.id !== id) };
};

/** Move a sound's start frame (clamped to the ruler; null when absent/no-op). */
export const opMoveAudio = (tl: AnimTimeline, id: string, frame: number): AnimTimeline | null => {
    const clip = tl.audio?.find(a => a.id === id);
    if (!clip) return null;
    const f = Math.min(Math.max(0, Math.round(frame)), tl.frameCount - 1);
    if (f === clip.frame) return null;
    return { ...tl, audio: tl.audio!.map(a => (a.id === id ? { ...a, frame: f } : a)).sort((a, b) => a.frame - b.frame) };
};

/**
 * Reconcile the timeline with the flat element list:
 *  - an element referenced by NO keyframe joins the ACTIVE keyframe of its
 *    layer's row (creating the row for unknown layers);
 *  - references to deleted elements are pruned.
 * Returns null when nothing changed.
 */
export const opReconcile = (
    tl: AnimTimeline,
    elements: readonly DrawingElement[],
    currentFrame: number,
    excludeIds?: ReadonlySet<string>
): AnimTimeline | null => {
    const counts = refCounts(tl);
    const alive = new Set(elements.map(e => e.id));
    const orphans = elements.filter(e => !counts.has(e.id) && !excludeIds?.has(e.id));
    const hasDead = [...counts.keys()].some(id => !alive.has(id));
    if (orphans.length === 0 && !hasDead) return null;

    let next: AnimTimeline = {
        ...tl,
        layers: tl.layers.map(l => ({
            ...l,
            keyframes: l.keyframes.map(k => ({ ...k, elementIds: k.elementIds.filter(id => alive.has(id)) })),
        })),
    };
    for (const el of orphans) {
        let li = rowIndex(next, el.layerId);
        if (li === -1) {
            next = { ...next, layers: [...next.layers, { layerId: el.layerId, keyframes: [{ frame: 0, elementIds: [] }], endFrame: next.frameCount - 1 }] };
            li = next.layers.length - 1;
        }
        const row = next.layers[li];
        let ki = activeKeyframeIndex(row, currentFrame);
        if (ki === -1) ki = 0; // playhead outside the row's frames → last-resort: first cel
        const keyframes = row.keyframes.map((k, i) => (i === ki ? { ...k, elementIds: [...k.elementIds, el.id] } : k));
        next = withRow(next, li, { ...row, keyframes });
    }
    return next;
};
