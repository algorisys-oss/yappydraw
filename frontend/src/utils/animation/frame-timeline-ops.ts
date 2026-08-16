/**
 * Pure frame-timeline operations — the F5/F6/F7-class span arithmetic of
 * Animation mode, with NO store access so it unit-tests in isolation.
 * `store/anim-ops.ts` is the thin glue that applies these results (history
 * push + setStore). Every function returns brand-new arrays/objects (the
 * one-level-deep undo snapshot contract) or null when the op doesn't apply.
 */

import type { DrawingElement } from '../../types';
import type { AnimTimeline, AnimLayer, AnimKeyframe, AnimAudioClip, AnimCameraKey, AnimMarker, PegTransform } from '../../types/anim-types';
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
// Timing tools — exposure (cel duration), split-on-N, in-betweens
// ---------------------------------------------------------------------------

/** The span of the cel active at `frame`: [start, endExclusive). */
const celSpan = (row: AnimLayer, ki: number): [number, number] =>
    [row.keyframes[ki].frame, row.keyframes[ki + 1] ? row.keyframes[ki + 1].frame : row.endFrame + 1];

/** Set the exposure of the cel holding `frame` to exactly `duration` frames,
 *  sliding everything after it (Callipeg's "set duration" / Animate's exposure). */
export const opSetCelDuration = (
    tl: AnimTimeline,
    layerIds: readonly string[],
    frame: number,
    duration: number
): AnimTimeline | null => {
    if (duration < 1) return null;
    let next = tl;
    let touched = false;

    for (const layerId of layerIds) {
        const li = rowIndex(next, layerId);
        if (li === -1) continue;
        const row = next.layers[li];
        const ki = activeKeyframeIndex(row, frame);
        if (ki === -1) continue;
        const [start, end] = celSpan(row, ki);
        const delta = duration - (end - start);
        if (delta === 0) continue;
        const keyframes = row.keyframes.map((k, i) => (i > ki ? { ...k, frame: k.frame + delta } : k));
        next = withRow(next, li, {
            ...row,
            keyframes,
            endFrame: row.keyframes[ki + 1] ? Math.max(0, row.endFrame + delta) : start + duration - 1,
        });
        touched = true;
    }
    return touched ? next : null;
};

export interface SplitFramesResult {
    timeline: AnimTimeline;
    copies: DrawingElement[];
    sourcePatch: Map<string, string>;
}

/**
 * Re-expose [from..to] as cels of `every` frames — the "shoot this on twos"
 * tool. A cel with content is deep-copied per split (so each can then be drawn
 * on independently); a blank cel splits into blank cels.
 */
export const opSplitFrames = (
    tl: AnimTimeline,
    layerIds: readonly string[],
    from: number,
    to: number,
    every: number,
    elements: readonly DrawingElement[],
    genId: (type: string) => string
): SplitFramesResult | null => {
    if (every < 1 || to <= from) return null;
    let next = tl;
    const copies: DrawingElement[] = [];
    const sourcePatch = new Map<string, string>();
    let touched = false;

    for (const layerId of layerIds) {
        if (rowIndex(next, layerId) === -1) continue;
        for (let f = from + every; f <= to; f += every) {
            const row = next.layers[rowIndex(next, layerId)];
            if (row.keyframes.some(k => k.frame === f)) continue;
            const ai = activeKeyframeIndex(row, f);
            if (ai !== -1 && row.keyframes[ai].elementIds.length > 0) {
                // Copies made earlier in THIS split aren't in the store yet, but the
                // next cel duplicates the previous one — so they must be in the pool
                // or every cel past the second comes out empty.
                const res = opInsertKeyframe(next, layerId, f, [...elements, ...copies], genId);
                if (!res) continue;
                next = res.timeline;
                copies.push(...res.copies);
                for (const [k, v] of res.sourcePatch) sourcePatch.set(k, v);
            } else {
                const blank = opInsertBlankKeyframe(next, layerId, f);
                if (!blank) continue;
                next = blank;
            }
            touched = true;
        }
    }
    return touched ? { timeline: next, copies, sourcePatch } : null;
};

/** Drop a blank cel halfway through the span holding `frame` (the in-between slot). */
export const opInsertInbetween = (
    tl: AnimTimeline,
    layerIds: readonly string[],
    frame: number
): AnimTimeline | null => {
    let next = tl;
    let touched = false;

    for (const layerId of layerIds) {
        const li = rowIndex(next, layerId);
        if (li === -1) continue;
        const row = next.layers[li];
        const ki = activeKeyframeIndex(row, frame);
        if (ki === -1) continue;
        const [start, end] = celSpan(row, ki);
        if (end - start < 2) continue;
        const mid = start + Math.floor((end - start) / 2);
        const blank = opInsertBlankKeyframe(next, layerId, mid);
        if (!blank) continue;
        next = blank;
        touched = true;
    }
    return touched ? next : null;
};

// ---------------------------------------------------------------------------
// Frame clipboard — copy / paste / delete a rectangular block of cels
// ---------------------------------------------------------------------------

/** One copied row, rebased so the block's first frame is 0. */
export interface FrameClipRow {
    keyframes: AnimKeyframe[];
}

/**
 * A copied block of cels. Elements are DEEP SNAPSHOTS taken at copy time, keyed
 * by their original id — so the clipboard survives deleting (or editing) the
 * cels it came from, which a list of live ids would not.
 */
export interface FrameClipboard {
    length: number;             // frames spanned by the block
    rows: FrameClipRow[];       // one per copied layer, in selection order
    elements: DrawingElement[];
}

/** Copy frames [from..to] on `layerIds` into a clipboard block. */
export const opCopyFrames = (
    tl: AnimTimeline,
    layerIds: readonly string[],
    from: number,
    to: number,
    elements: readonly DrawingElement[]
): FrameClipboard | null => {
    const lo = Math.max(0, Math.min(from, to));
    const hi = Math.max(from, to);
    const rows: FrameClipRow[] = [];
    const wanted = new Set<string>();
    let anyRow = false;

    for (const layerId of layerIds) {
        const li = rowIndex(tl, layerId);
        if (li === -1) { rows.push({ keyframes: [] }); continue; }
        anyRow = true;
        const row = tl.layers[li];
        const keyframes: AnimKeyframe[] = [];
        // A selection starting mid-span still copies the drawing that HOLDS there,
        // otherwise selecting frames 2-4 of a 10-frame cel would copy nothing.
        const ai = activeKeyframeIndex(row, lo);
        if (ai !== -1 && row.keyframes[ai].frame < lo) keyframes.push({ ...row.keyframes[ai], frame: 0 });
        for (const k of row.keyframes) {
            if (k.frame >= lo && k.frame <= hi) keyframes.push({ ...k, frame: k.frame - lo });
        }
        for (const k of keyframes) for (const id of k.elementIds) wanted.add(id);
        rows.push({ keyframes });
    }
    if (!anyRow) return null;

    return {
        length: hi - lo + 1,
        rows,
        elements: elements.filter(e => wanted.has(e.id)).map(e => JSON.parse(JSON.stringify(e)) as DrawingElement),
    };
};

export interface PasteFramesResult {
    timeline: AnimTimeline;
    /** Fresh element copies to add to the store. */
    copies: DrawingElement[];
    /** Elements the overwritten cels held and nothing else references. */
    doomedIds: string[];
}

/**
 * Paste a block at `at`, OVERWRITING the destination range on each target row.
 * Overwrite (not ripple) keeps the destination timing predictable — F5 is the
 * tool for making room.
 */
export const opPasteFrames = (
    tl: AnimTimeline,
    layerIds: readonly string[],
    at: number,
    clip: FrameClipboard,
    genId: (type: string) => string
): PasteFramesResult | null => {
    if (clip.rows.length === 0 || clip.length <= 0 || at < 0) return null;
    const lo = at;
    const hi = at + clip.length - 1;
    const snapshots = new Map(clip.elements.map(e => [e.id, e]));

    let next = tl;
    const copies: DrawingElement[] = [];
    let touched = false;

    for (let i = 0; i < clip.rows.length; i++) {
        const layerId = layerIds[i];
        if (!layerId) break;
        const li = rowIndex(next, layerId);
        if (li === -1) continue;
        const row = next.layers[li];

        const pasted = clip.rows[i].keyframes.map(k => {
            const elementIds: string[] = [];
            for (const srcId of k.elementIds) {
                const snap = snapshots.get(srcId);
                if (!snap) continue;
                const copy: DrawingElement = JSON.parse(JSON.stringify(snap));
                copy.id = genId(snap.type);
                copy.contentId = snap.contentId ?? snap.id;
                copy.layerId = layerId;
                copies.push(copy);
                elementIds.push(copy.id);
            }
            return { ...k, frame: at + k.frame, elementIds };
        });

        const kept = row.keyframes.filter(k => k.frame < lo || k.frame > hi);
        next = withRow(next, li, {
            ...row,
            keyframes: sortKfs([...kept, ...pasted]),
            endFrame: Math.max(row.endFrame, hi),
        });
        touched = true;
    }
    if (!touched) return null;

    const surviving = new Set<string>();
    for (const l of next.layers) for (const k of l.keyframes) for (const id of k.elementIds) surviving.add(id);
    const doomedIds = [...refCounts(tl).keys()].filter(id => !surviving.has(id));
    return { timeline: next, copies, doomedIds };
};

/** Delete frames [from..to] on `layerIds`, pulling later cels left (Shift+F5 × N). */
export const opRemoveFrameRange = (
    tl: AnimTimeline,
    layerIds: readonly string[],
    from: number,
    to: number
): RemoveResult | null => {
    const lo = Math.max(0, Math.min(from, to));
    const hi = Math.max(from, to);
    let next = tl;
    const doomed: string[] = [];
    let touched = false;

    for (const layerId of layerIds) {
        if (rowIndex(next, layerId) === -1) continue;
        for (let i = 0; i <= hi - lo; i++) {
            const res = opRemoveFrames(next, layerId, lo);
            if (!res) break;
            next = res.timeline;
            doomed.push(...res.doomedIds);
            touched = true;
        }
    }
    return touched ? { timeline: next, doomedIds: [...new Set(doomed)] } : null;
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

// ---------------------------------------------------------------------------
// Out of pegs — a transform on a cel's ONION GHOST, never on the drawing
// ---------------------------------------------------------------------------

/** The peg of the cel holding `frame`, or null. */
export const pegAt = (tl: AnimTimeline, layerId: string, frame: number): PegTransform | null => {
    const li = rowIndex(tl, layerId);
    if (li === -1) return null;
    const ki = activeKeyframeIndex(tl.layers[li], frame);
    return ki === -1 ? null : tl.layers[li].keyframes[ki].peg ?? null;
};

/** Peg (or un-peg) the cel HOLDING `frame` — so any held frame works, not just
 *  the keyframe itself. Returns null when nothing changes. */
export const opSetPeg = (
    tl: AnimTimeline,
    layerId: string,
    frame: number,
    peg: PegTransform | null
): AnimTimeline | null => {
    const li = rowIndex(tl, layerId);
    if (li === -1) return null;
    const row = tl.layers[li];
    const ki = activeKeyframeIndex(row, frame);
    if (ki === -1) return null;
    if (!peg && !row.keyframes[ki].peg) return null;
    const keyframes = row.keyframes.map((k, i) => (i === ki ? { ...k, peg: peg ?? undefined } : k));
    return withRow(tl, li, { ...row, keyframes });
};

/** Drop every peg in the document (Callipeg's "reset all"). */
export const opClearAllPegs = (tl: AnimTimeline): AnimTimeline | null => {
    if (!tl.layers.some(l => l.keyframes.some(k => k.peg))) return null;
    return {
        ...tl,
        layers: tl.layers.map(l => ({
            ...l,
            keyframes: l.keyframes.map(k => (k.peg ? { ...k, peg: undefined } : k)),
        })),
    };
};

// ---------------------------------------------------------------------------
// Ruler markers + the playback/export range
// ---------------------------------------------------------------------------

/** Add or replace the marker on its frame (kept sorted). */
export const opSetMarker = (tl: AnimTimeline, marker: AnimMarker): AnimTimeline => ({
    ...tl,
    markers: [...(tl.markers ?? []).filter(m => m.frame !== marker.frame), marker].sort((a, b) => a.frame - b.frame),
});

/** Remove the marker at `frame` (null when absent; empty list → no markers). */
export const opRemoveMarker = (tl: AnimTimeline, frame: number): AnimTimeline | null => {
    if (!tl.markers?.some(m => m.frame === frame)) return null;
    const markers = tl.markers.filter(m => m.frame !== frame);
    return { ...tl, markers: markers.length ? markers : undefined };
};

/** Set the inclusive playback/export range. Both null clears it. */
export const opSetMarkRange = (tl: AnimTimeline, markIn: number | null, markOut: number | null): AnimTimeline | null => {
    if (markIn === null && markOut === null) {
        if (tl.markIn === undefined && tl.markOut === undefined) return null;
        // Explicit `undefined`, NOT an object with the keys omitted: the store
        // applies this by MERGING into the live timeline (see setAnimTimeline),
        // and a merge only touches the keys the object actually has — so an
        // omitted key would leave the old range in place forever.
        return { ...tl, markIn: undefined, markOut: undefined };
    }
    const last = tl.frameCount - 1;
    const clamp = (v: number) => Math.min(Math.max(0, Math.round(v)), last);
    const a = clamp(markIn ?? tl.markIn ?? 0);
    const b = clamp(markOut ?? tl.markOut ?? last);
    return { ...tl, markIn: Math.min(a, b), markOut: Math.max(a, b) };
};

/** The inclusive frame range that playback and export cover: the mark in/out
 *  range when one is set, otherwise the whole ruler. */
export const playbackRange = (tl: AnimTimeline): [number, number] => {
    const last = Math.max(0, tl.frameCount - 1);
    const lo = Math.min(Math.max(0, Math.round(tl.markIn ?? 0)), last);
    const hi = Math.min(Math.max(lo, Math.round(tl.markOut ?? last)), last);
    return [lo, hi];
};

/** The frame of the next/previous CEL across `layerIds` — traditional flipping,
 *  which moves drawing to drawing rather than frame to frame. Null at the ends. */
export const findCelFrame = (
    tl: AnimTimeline,
    layerIds: readonly string[],
    from: number,
    dir: 1 | -1
): number | null => {
    const frames = new Set<number>();
    for (const layerId of layerIds) {
        const li = rowIndex(tl, layerId);
        if (li === -1) continue;
        for (const k of tl.layers[li].keyframes) frames.add(k.frame);
    }
    const sorted = [...frames].sort((a, b) => a - b);
    const hit = dir > 0 ? sorted.find(f => f > from) : [...sorted].reverse().find(f => f < from);
    return hit ?? null;
};

/** The frame of the next/previous ruler marker. Null at the ends. */
export const findMarkerFrame = (tl: AnimTimeline, from: number, dir: 1 | -1): number | null => {
    const marks = (tl.markers ?? []).map(m => m.frame);
    const hit = dir > 0 ? marks.find(f => f > from) : [...marks].reverse().find(f => f < from);
    return hit ?? null;
};

// ---------------------------------------------------------------------------
// Camera keys
// ---------------------------------------------------------------------------

/** Add or replace the camera key at its frame (kept sorted). */
export const opSetCameraKey = (tl: AnimTimeline, key: AnimCameraKey): AnimTimeline => ({
    ...tl,
    camera: [...(tl.camera ?? []).filter(k => k.frame !== key.frame), key].sort((a, b) => a.frame - b.frame),
});

/** Remove the camera key at `frame` (null when absent; empty list → no camera). */
export const opClearCameraKey = (tl: AnimTimeline, frame: number): AnimTimeline | null => {
    if (!tl.camera?.some(k => k.frame === frame)) return null;
    const camera = tl.camera.filter(k => k.frame !== frame);
    return { ...tl, camera: camera.length ? camera : undefined };
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
