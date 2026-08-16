/**
 * Animation-mode timeline actions (docType 'animation') — thin store glue over
 * the PURE span arithmetic in `utils/animation/frame-timeline-ops.ts` (which is
 * where the F5/F6/F7 semantics live and unit-test). Kept out of app-store.ts on
 * purpose. Every mutating action pushes ONE history snapshot before applying.
 */

import { batch } from 'solid-js';
import { store, setStore, setAnimTimeline, animTimelineRev, pushToHistory, bumpDirtyRevision, getClipEditStash, addSlide, setActiveSlide, deleteSlide, cloneAnimTimeline, setSelectedTool } from './app-store';
import { reconcile } from 'solid-js/store';
import { createDefaultAnimTimeline } from '../types/anim-types';
import { generateId } from '../utils/id-generator';
import type { AnimTimeline, TweenKind } from '../types/anim-types';
import type { BezierEase } from '../types/motion-types';
import type { EasingName } from '../utils/animation/animation-types';
import {
    opInsertFrame, opInsertKeyframe, opInsertBlankKeyframe, opClearKeyframe,
    opRemoveFrames, opMoveKeyframe, opUpdateKeyframe, opReconcile,
    opAddAudio, opRemoveAudio, opMoveAudio, opSetCameraKey, opClearCameraKey,
    opCopyFrames, opPasteFrames, opRemoveFrameRange,
    opSetCelDuration, opSplitFrames, opInsertInbetween,
    opSetMarker, opRemoveMarker, opSetMarkRange, findCelFrame, findMarkerFrame,
    opSetPeg, opClearAllPegs,
} from '../utils/animation/frame-timeline-ops';
import type { PegTransform } from '../types/anim-types';
import type { FrameClipboard } from '../utils/animation/frame-timeline-ops';
import type { AnimAudioClip } from '../types/anim-types';
import { evaluateTimelineAt, poseElementsAtFrame, activeKeyframeIndex } from '../utils/animation/frame-timeline-evaluator';
import type { FrameOverride } from '../utils/animation/frame-timeline-evaluator';
import type { DrawingElement } from '../types';

const timeline = (): AnimTimeline | null => store.animTimeline;

// ---------------------------------------------------------------------------
// Frame visibility (the cel model's render/interaction filter)
// ---------------------------------------------------------------------------

// Visibility/placement depend only on (timeline structure, frame) — element
// props don't matter — so a (revision, frame) cache makes the per-pointermove
// hit-testing path O(1). The key is `animTimelineRev()`, NOT the timeline's
// object identity: setStore merges into the existing proxy, so the reference
// survives a structural edit (see setAnimTimeline).
let structCache: { rev: number; frame: number; visible: Set<string>; placement: Map<string, number> } | null = null;

const structuralEval = () => {
    const tl = store.animTimeline;
    if (store.docType !== 'animation' || !tl) return null;
    const frame = store.animCurrentFrame;
    const rev = animTimelineRev();
    if (!structCache || structCache.rev !== rev || structCache.frame !== frame) {
        const ev = evaluateTimelineAt(frame, tl, []);
        structCache = { rev, frame, visible: ev.visible, placement: ev.placement };
    }
    return structCache;
};

/** Ids visible at the current playhead, or null outside animation mode. */
export const animVisibleIds = (): Set<string> | null => structuralEval()?.visible ?? null;

/** elementId → owning-keyframe start frame (drives movie-clip local clocks). */
export const animPlacementFrames = (): Map<string, number> | null => structuralEval()?.placement ?? null;

interface PoseCache {
    rev: number;
    frame: number;
    els: readonly DrawingElement[];
    overrides: Record<string, FrameOverride>;
    posed: readonly DrawingElement[];
}
let poseCache: PoseCache | null = null;

/** Shared memo behind `animPosedElements` / `animFrameOverrides`. These run on
 *  every pointermove (cursor feedback) as well as every hit test, so they are
 *  cached on (timeline revision, frame, elements). Element identity IS sound —
 *  `setStore('elements', els => [...])` hands back a fresh array — but the
 *  timeline's is not, hence the revision counter. */
const poseEval = (): PoseCache | null => {
    const tl = store.animTimeline;
    if (store.docType !== 'animation' || !tl) return null;
    const frame = store.animCurrentFrame;
    const els = store.elements;
    const rev = animTimelineRev();
    if (!poseCache || poseCache.rev !== rev || poseCache.frame !== frame || poseCache.els !== els) {
        const { overrides } = evaluateTimelineAt(frame, tl, els);
        poseCache = { rev, frame, els, overrides, posed: poseElementsAtFrame(frame, tl, els) };
    }
    return poseCache;
};

/**
 * `store.elements` with the playhead's tween pose baked in — i.e. what the
 * canvas is actually DRAWING. Hit tests that take a plain element list must go
 * through this: the renderer draws shapes and their handles from the tweened
 * pose, so hit-testing the raw store made the visible handles ungrabbable on
 * every frame inside a span. Outside animation mode this is `store.elements`
 * itself (no allocation).
 */
export const animPosedElements = (): readonly DrawingElement[] => poseEval()?.posed ?? store.elements;

/**
 * The raw per-element pose overrides for this frame, or null outside animation
 * mode. Use this rather than `animPosedElements` wherever the caller composes
 * with ANOTHER source of pose (the seconds-based orbit/spin spine): those must
 * be layered in the renderer's order — orbit/spin first, frame override last
 * (see canvas.tsx, which `Object.assign`s the overrides over the composition
 * state). Merging a posed element and then re-applying the orbit state on top
 * silently reverts to the store pose, because that spine reports STATIC x/y for
 * every element when nothing is actually orbiting or spinning.
 */
export const animFrameOverrides = (): Record<string, FrameOverride> | null => poseEval()?.overrides ?? null;

/**
 * Split the tween span under the playhead so a direct-manipulation edit has a
 * cel to land on, holding exactly the pose that was on screen.
 *
 * Without this, grabbing a handle mid-span edits the span's LEFT keyframe: the
 * tween immediately re-interpolates and the shape slides out from under the
 * cursor instead of following it. Splitting first is Animate's behaviour and
 * makes the drag WYSIWYG.
 *
 * Only motion spans are split — a shape tween's override is a morphed OUTLINE
 * in center-relative coords, which has no faithful representation as a plain
 * element, so those are left alone. No-op unless the playhead sits strictly
 * inside a motion span owning one of `ids`.
 *
 * Returns oldId → newId so the caller can re-point the selection at the new cel.
 */
export const splitTweenAtPlayhead = (ids: readonly string[]): Map<string, string> => {
    const remap = new Map<string, string>();
    const tl0 = timeline();
    if (store.docType !== 'animation' || !tl0 || ids.length === 0) return remap;

    const frame = store.animCurrentFrame;
    const wanted = new Set(ids);
    const rows = tl0.layers
        .filter(row => {
            const ki = activeKeyframeIndex(row, frame);
            if (ki === -1) return false;
            const kf = row.keyframes[ki];
            return kf.frame !== frame                      // not already a keyframe
                && kf.tween === 'motion'                   // shape tweens can't be baked
                && !!row.keyframes[ki + 1]                 // a span needs both ends
                && kf.elementIds.some(id => wanted.has(id));
        })
        .map(row => row.layerId);
    // Cheap exit first: a move drag calls this on EVERY pointermove (the split is
    // idempotent — once done, the playhead is on a keyframe and nothing matches),
    // so the O(elements) evaluate below must not run once there is nothing to do.
    if (rows.length === 0) return remap;

    // Capture the on-screen pose BEFORE any mutation — this is what the new cel
    // has to hold. Shape-tween `points` are render-only, so they are dropped.
    const { overrides } = evaluateTimelineAt(frame, tl0, store.elements);

    for (const layerId of rows) {
        // Re-read: every insert replaces the timeline wholesale.
        const row = timeline()?.layers.find(l => l.layerId === layerId);
        if (!row) continue;
        const ki = activeKeyframeIndex(row, frame);
        if (ki === -1) continue;
        const sourceIds = row.keyframes[ki].elementIds;

        const newIds = insertKeyframe(layerId, frame);
        if (newIds.length === 0) continue;

        // Copies share the source's contentId, which is the only reliable link
        // back (opInsertKeyframe skips sources whose element is missing, so
        // positional pairing is not safe).
        const srcByContent = new Map<string, string>();
        for (const id of sourceIds) {
            const src = store.elements.find(e => e.id === id);
            if (src) srcByContent.set(src.contentId ?? src.id, src.id);
        }
        const poseById = new Map<string, Partial<DrawingElement>>();
        for (const newId of newIds) {
            const copy = store.elements.find(e => e.id === newId);
            const srcId = copy?.contentId ? srcByContent.get(copy.contentId) : undefined;
            if (!srcId) continue;
            remap.set(srcId, newId);
            const ov = overrides[srcId];
            if (ov) {
                const { points: _morph, ...pose } = ov as Record<string, unknown>;
                poseById.set(newId, pose as Partial<DrawingElement>);
            }
        }
        if (poseById.size > 0) {
            setStore('elements', els => els.map(e => {
                const pose = poseById.get(e.id);
                return pose ? { ...e, ...pose } : e;
            }));
        }
    }
    return remap;
};

// ---------------------------------------------------------------------------
// Playhead (transient — no history)
// ---------------------------------------------------------------------------

export const gotoFrame = (frame: number) => {
    const tl = timeline();
    if (!tl) return;
    const f = Math.min(Math.max(0, Math.round(frame)), tl.frameCount - 1);
    if (f === store.animCurrentFrame) return;
    setStore('animCurrentFrame', f);
    // Selection must not point at elements hidden on the new frame.
    if (store.selection.length > 0) {
        const vis = evaluateTimelineAt(f, tl, []).visible;
        const kept = store.selection.filter(id => vis.has(id));
        if (kept.length !== store.selection.length) setStore('selection', kept);
    }
};

export const stepFrame = (delta: number) => gotoFrame(store.animCurrentFrame + delta);

/** Rows a flip walks: the selected rows, else the active layer, else everything. */
const flipRows = (tl: AnimTimeline): string[] => {
    const sel = store.animFrameSelection?.layerIds;
    if (sel?.length) return [...sel];
    if (store.activeLayerId) return [store.activeLayerId];
    return tl.layers.map(l => l.layerId);
};

/** Flip to the next/previous CEL — drawing to drawing, not frame to frame. */
export const stepCel = (dir: 1 | -1) => {
    const tl = timeline();
    if (!tl) return;
    const f = findCelFrame(tl, flipRows(tl), store.animCurrentFrame, dir);
    if (f !== null) gotoFrame(f);
};

/** Flip to the next/previous ruler marker. */
export const stepMarker = (dir: 1 | -1) => {
    const tl = timeline();
    if (!tl) return;
    const f = findMarkerFrame(tl, store.animCurrentFrame, dir);
    if (f !== null) gotoFrame(f);
};

// ---------------------------------------------------------------------------
// Frame / keyframe edits (each pushes one history snapshot)
// ---------------------------------------------------------------------------

/** Apply a pure timeline-only op result. */
const apply = (next: AnimTimeline | null) => {
    if (!next) return;
    pushToHistory();
    setAnimTimeline(next);
};

/** F5 — Insert Frame. */
export const insertFrame = (layerId: string, frame: number) =>
    apply(timeline() && opInsertFrame(timeline()!, layerId, frame));

/** Grow a cel that was just created at `frame` to the document's default
 *  exposure (`newCelFrames`) by inserting the extra held frames after it. */
const withNewCelDuration = (tl: AnimTimeline, layerId: string, frame: number): AnimTimeline => {
    const d = Math.max(1, Math.round(tl.newCelFrames ?? 1));
    let next = tl;
    for (let i = 1; i < d; i++) next = opInsertFrame(next, layerId, frame) ?? next;
    return next;
};

/** F6 — Insert Keyframe (duplicates the previous cel). Returns the new element ids. */
export const insertKeyframe = (layerId: string, frame: number): string[] => {
    const tl = timeline();
    if (!tl) return [];
    const res = opInsertKeyframe(tl, layerId, frame, store.elements, generateId);
    if (!res) return [];
    pushToHistory();
    batch(() => {
        if (res.sourcePatch.size > 0) {
            setStore('elements', els => els.map(e => (res.sourcePatch.has(e.id) ? { ...e, contentId: res.sourcePatch.get(e.id) } : e)));
        }
        if (res.copies.length > 0) setStore('elements', els => [...els, ...res.copies]);
        setAnimTimeline(withNewCelDuration(res.timeline, layerId, frame));
    });
    return res.newElementIds;
};

/**
 * F6 *from the UI* — insert the keyframe, then hand the user the copies ready to move.
 *
 * The whole point of F6 is "duplicate the previous cel so you can nudge it", and the
 * tutorial says exactly that: *press F6 … drag the copy to the floor*. That was
 * impossible as shipped — the copies landed unselected with whatever tool was armed, and
 * Yappy's default tool is the Ink Brush, so the usual state after F6 was a brush and
 * nothing selected. Animate gets away with not switching because ITS default tool is
 * Selection; ours isn't, so the same rule produces a different outcome.
 *
 * F7 deliberately does NOT do this: a blank keyframe means you are about to draw, so the
 * drawing tool you picked stays armed.
 *
 * Kept separate from `insertKeyframe` so the scripting API (`Yappy.insertKeyframe`)
 * stays a pure timeline edit that doesn't reach over and change the user's tool.
 */
export const insertKeyframeAndSelect = (layerId: string, frame: number): string[] => {
    const ids = insertKeyframe(layerId, frame);
    if (ids.length === 0) return ids;
    // Order matters: setSelectedTool clears the selection when it switches to a drawing
    // tool, so the tool has to settle BEFORE the selection is written. `lasso` is already
    // selection-capable and is left alone — same convention as selectAll().
    if (store.selectedTool !== 'selection' && store.selectedTool !== 'lasso') {
        setSelectedTool('selection');
    }
    setStore('selection', ids);
    return ids;
};

/** F7 — Insert Blank Keyframe. */
export const insertBlankKeyframe = (layerId: string, frame: number) => {
    const tl = timeline();
    const next = tl && opInsertBlankKeyframe(tl, layerId, frame);
    apply(next && withNewCelDuration(next, layerId, frame));
};

/** Apply an op that also deletes the removed cel's exclusive content. */
const applyRemove = (res: { timeline: AnimTimeline; doomedIds: string[] } | null) => {
    if (!res) return;
    pushToHistory();
    batch(() => {
        if (res.doomedIds.length > 0) {
            const doomed = new Set(res.doomedIds);
            setStore('elements', els => els.filter(e => !doomed.has(e.id)));
            setStore('selection', sel => sel.filter(id => !doomed.has(id)));
        }
        setAnimTimeline(res.timeline);
    });
};

/** Shift+F6 — Clear Keyframe. */
export const clearKeyframe = (layerId: string, frame: number) =>
    applyRemove(timeline() && opClearKeyframe(timeline()!, layerId, frame));

/** Shift+F5 — Remove Frames. */
export const removeFrames = (layerId: string, frame: number) =>
    applyRemove(timeline() && opRemoveFrames(timeline()!, layerId, frame));

/** Drag a keyframe to another frame. */
export const moveKeyframe = (layerId: string, fromFrame: number, toFrame: number) =>
    apply(timeline() && opMoveKeyframe(timeline()!, layerId, fromFrame, toFrame));

/** Create/remove the tween on the span leaving `frame`'s keyframe. */
export const setTween = (layerId: string, frame: number, kind: TweenKind) =>
    apply(timeline() && opUpdateKeyframe(timeline()!, layerId, frame, { tween: kind === 'none' ? undefined : kind }));

/** `recordHistory: false` supports drag gestures — the caller pushes ONE
 *  history entry at gesture start and streams updates through here. */
export const setFrameEase = (layerId: string, frame: number, ease?: BezierEase, easing?: EasingName, recordHistory = true) => {
    const next = timeline() && opUpdateKeyframe(timeline()!, layerId, frame, { ease, easing });
    if (!next) return;
    if (recordHistory) pushToHistory();
    setAnimTimeline(next);
};

/** Attach/clear a motion-guide path on the span leaving `frame`'s keyframe. */
export const setFrameGuide = (layerId: string, frame: number, guideId: string | null, orient?: boolean) =>
    apply(timeline() && opUpdateKeyframe(timeline()!, layerId, frame, {
        guideId: guideId ?? undefined,
        guideOrient: guideId ? (orient ?? false) : undefined,
    }));

export const setFrameLabel = (layerId: string, frame: number, label: string) =>
    apply(timeline() && opUpdateKeyframe(timeline()!, layerId, frame, { label: label || undefined }));

/** Playback control fired when the playhead reaches this keyframe (null clears). */
export const setFrameAction = (layerId: string, frame: number, action: import('../types/anim-types').FrameAction | null) =>
    apply(timeline() && opUpdateKeyframe(timeline()!, layerId, frame, { action: action ?? undefined }));

// ---------------------------------------------------------------------------
// Timing tools — exposure, split-on-N, in-betweens
// ---------------------------------------------------------------------------

/** Set the exposure of the selected cel(s) to `duration` frames. */
export const setCelDuration = (duration: number): boolean => {
    const tl = timeline();
    const r = selRange();
    if (!tl || !r) return false;
    const next = opSetCelDuration(tl, r.layerIds, r.from, duration);
    if (!next) return false;
    apply(next);
    return true;
};

/** Re-expose the selection as cels of `every` frames ("shoot this on twos"). */
export const splitFrames = (every: number): boolean => {
    const tl = timeline();
    const r = selRange();
    if (!tl || !r) return false;
    const res = opSplitFrames(tl, r.layerIds, r.from, r.to, every, store.elements, generateId);
    if (!res) return false;
    pushToHistory();
    batch(() => {
        if (res.sourcePatch.size > 0) {
            setStore('elements', els => els.map(e => (res.sourcePatch.has(e.id) ? { ...e, contentId: res.sourcePatch.get(e.id) } : e)));
        }
        if (res.copies.length > 0) setStore('elements', els => [...els, ...res.copies]);
        setAnimTimeline(res.timeline);
    });
    return true;
};

/** Drop a blank cel halfway through the selected span. */
export const insertInbetween = (): boolean => {
    const tl = timeline();
    const r = selRange();
    if (!tl || !r) return false;
    const next = opInsertInbetween(tl, r.layerIds, r.from);
    if (!next) return false;
    apply(next);
    return true;
};

/** Default exposure for cels created by F6/F7 (1 = one frame each). */
export const setNewCelFrames = (frames: number) => {
    const tl = timeline();
    if (!tl) return;
    const v = Math.min(Math.max(1, Math.round(frames)), 60);
    if (v === (tl.newCelFrames ?? 1)) return;
    pushToHistory();
    setAnimTimeline({ ...tl, newCelFrames: v });
};

// ---------------------------------------------------------------------------
// Frame clipboard — copy / cut / paste / duplicate a block of cels
// ---------------------------------------------------------------------------

/** In-process, deliberately NOT the system clipboard: a cel carries element
 *  snapshots with no sane text serialisation, and taking over Ctrl+C in a
 *  drawing app would break element copy/paste. */
let frameClipboard: FrameClipboard | null = null;

export const hasFrameClipboard = () => frameClipboard !== null;

/** The selection as a rectangle, or null when nothing is selected. */
const selRange = () => {
    const sel = store.animFrameSelection;
    if (!sel || sel.frames.length === 0 || sel.layerIds.length === 0) return null;
    return { layerIds: sel.layerIds, from: Math.min(...sel.frames), to: Math.max(...sel.frames) };
};

const frameList = (from: number, to: number): number[] => {
    const out: number[] = [];
    for (let f = from; f <= to; f++) out.push(f);
    return out;
};

/** Row ids in timeline display order (top row = topmost layer, like the grid). */
const displayOrder = (): string[] => [...store.layers].sort((a, b) => b.order - a.order).map(l => l.id);

/** `count` consecutive rows starting at `anchor` — where a multi-row paste lands. */
const targetRows = (anchor: string, count: number): string[] => {
    const order = displayOrder();
    const i = order.indexOf(anchor);
    return i === -1 ? [anchor] : order.slice(i, i + count);
};

/** Copy the selected block of cels. Returns false when there's nothing to copy. */
export const copyFrames = (): boolean => {
    const tl = timeline();
    const r = selRange();
    if (!tl || !r) return false;
    const clip = opCopyFrames(tl, r.layerIds, r.from, r.to, store.elements);
    if (!clip) return false;
    frameClipboard = clip;
    return true;
};

/** Delete the selected frames, pulling later cels left. */
export const deleteFrames = (): boolean => {
    const tl = timeline();
    const r = selRange();
    if (!tl || !r) return false;
    const res = opRemoveFrameRange(tl, r.layerIds, r.from, r.to);
    if (!res) return false;
    applyRemove(res);
    setStore('animFrameSelection', { layerIds: [...r.layerIds], frames: [r.from] });
    return true;
};

export const cutFrames = (): boolean => copyFrames() && deleteFrames();

/**
 * Paste the clipboard block at `at` (default: the playhead), overwriting the
 * destination range. Without explicit `layerIds` a multi-row block spreads down
 * from the anchor row.
 */
export const pasteFrames = (at?: number, layerIds?: readonly string[]): boolean => {
    const tl = timeline();
    const clip = frameClipboard;
    if (!tl || !clip) return false;
    const anchor = store.animFrameSelection?.layerIds[0] ?? store.activeLayerId;
    const targets = layerIds ?? (anchor ? targetRows(anchor, clip.rows.length) : []);
    if (targets.length === 0) return false;
    const frame = at ?? store.animCurrentFrame;
    const res = opPasteFrames(tl, targets, frame, clip, generateId);
    if (!res) return false;
    pushToHistory();
    batch(() => {
        if (res.doomedIds.length > 0) {
            const doomed = new Set(res.doomedIds);
            setStore('elements', els => els.filter(e => !doomed.has(e.id)));
            setStore('selection', sel => sel.filter(id => !doomed.has(id)));
        }
        if (res.copies.length > 0) setStore('elements', els => [...els, ...res.copies]);
        setAnimTimeline(res.timeline);
        setStore('animFrameSelection', { layerIds: [...targets], frames: frameList(frame, frame + clip.length - 1) });
    });
    return true;
};

/** Copy the selection and drop the copy immediately after it. */
export const duplicateFrames = (): boolean => {
    const r = selRange();
    if (!r || !copyFrames()) return false;
    return pasteFrames(r.to + 1, r.layerIds);
};

// ---------------------------------------------------------------------------
// Audio row
// ---------------------------------------------------------------------------

/** Add a sound at `frame` (default: the playhead). Returns the clip id. */
export const addAudioClip = (clip: Omit<AnimAudioClip, 'id' | 'frame'> & { frame?: number }): string | null => {
    const tl = timeline();
    if (!tl) return null;
    // NOT generateId(): that derives uniqueness from scanning store.elements,
    // and audio clips aren't elements — two adds would collide on the same id.
    const full: AnimAudioClip = { id: `audio-${crypto.randomUUID()}`, frame: clip.frame ?? store.animCurrentFrame, ...clip };
    apply(opAddAudio(tl, full));
    return full.id;
};

export const removeAudioClip = (id: string) =>
    apply(timeline() && opRemoveAudio(timeline()!, id));

export const moveAudioClip = (id: string, frame: number) =>
    apply(timeline() && opMoveAudio(timeline()!, id, frame));

// ---------------------------------------------------------------------------
// Out of pegs — moving a cel's onion ghost without moving the drawing
// ---------------------------------------------------------------------------

/**
 * Set the peg on the cel holding `frame`. `recordHistory: false` supports drag
 * gestures — the caller pushes ONE entry at gesture start and streams updates.
 */
export const setPeg = (layerId: string, frame: number, peg: PegTransform | null, recordHistory = true) => {
    const next = timeline() && opSetPeg(timeline()!, layerId, frame, peg);
    if (!next) return;
    if (recordHistory) pushToHistory();
    setAnimTimeline(next);
};

/** Start dragging this cel's ghost. Turns the onion on — with no ghosts on
 *  screen there is nothing to peg, so the mode would look broken. */
export const startPegEdit = (layerId: string, frame: number) => {
    if (!timeline()) return;
    if (!store.animOnion.enabled) setStore('animOnion', 'enabled', true);
    setStore('animPegEdit', { layerId, frame });
};

export const endPegEdit = () => setStore('animPegEdit', null);

/** Drop every out-of-pegs offset in the document. */
export const resetAllPegs = () => apply(timeline() && opClearAllPegs(timeline()!));

// ---------------------------------------------------------------------------
// Ruler markers + the playback/export range
// ---------------------------------------------------------------------------

/** Add or replace the marker at `frame` (default: the playhead). */
export const setMarker = (name: string, frame?: number, color?: string) => {
    const tl = timeline();
    if (!tl) return;
    apply(opSetMarker(tl, {
        frame: Math.min(Math.max(0, Math.round(frame ?? store.animCurrentFrame)), tl.frameCount - 1),
        name,
        ...(color && { color }),
    }));
};

export const removeMarker = (frame?: number) =>
    apply(timeline() && opRemoveMarker(timeline()!, frame ?? store.animCurrentFrame));

/** Set the inclusive playback/export range; both null clears it. */
export const setMarkRange = (markIn: number | null, markOut: number | null) =>
    apply(timeline() && opSetMarkRange(timeline()!, markIn, markOut));

// ---------------------------------------------------------------------------
// Camera keys
// ---------------------------------------------------------------------------

/** Add/replace a camera key (stage-local center + zoom) at `frame` (default playhead). */
export const setCameraKey = (key: { x: number; y: number; zoom: number; frame?: number; easing?: EasingName }) => {
    const tl = timeline();
    if (!tl) return;
    apply(opSetCameraKey(tl, {
        frame: key.frame ?? store.animCurrentFrame,
        x: key.x, y: key.y, zoom: Math.max(0.1, key.zoom),
        ...(key.easing && { easing: key.easing }),
    }));
};

export const clearCameraKey = (frame?: number) =>
    apply(timeline() && opClearCameraKey(timeline()!, frame ?? store.animCurrentFrame));

/** Capture the CURRENT editor view as the camera key at the playhead: the
 *  camera center = the stage point at the screen center, zoom relative to the
 *  stage width filling the window. */
export const setCameraKeyFromView = () => {
    const slide = store.slides[store.activeSlideIndex];
    const tl = timeline();
    if (!slide || !tl) return;
    const { scale, panX, panY } = store.viewState;
    const cxWorld = (window.innerWidth / 2 - panX) / scale;
    const cyWorld = (window.innerHeight / 2 - panY) / scale;
    const visibleW = window.innerWidth / scale;
    setCameraKey({
        x: cxWorld - slide.spatialPosition.x,
        y: cyWorld - slide.spatialPosition.y,
        zoom: slide.dimensions.width / visibleW,
    });
};

// ---------------------------------------------------------------------------
// Timeline settings
// ---------------------------------------------------------------------------

export const setAnimFps = (fps: number) => {
    const tl = timeline();
    if (!tl) return;
    const v = Math.min(Math.max(1, Math.round(fps)), 120);
    if (v === tl.fps) return;
    pushToHistory();
    setAnimTimeline({ ...tl, fps: v });
};

/** Set the ruler length. Can't shrink below existing row content. */
export const setAnimFrameCount = (frameCount: number) => {
    const tl = timeline();
    if (!tl) return;
    const maxEnd = Math.max(0, ...tl.layers.map(l => l.endFrame));
    const v = Math.max(Math.round(frameCount), maxEnd + 1, 1);
    if (v === tl.frameCount) return;
    pushToHistory();
    setAnimTimeline({ ...tl, frameCount: v });
    if (store.animCurrentFrame > v - 1) setStore('animCurrentFrame', v - 1);
};

// ---------------------------------------------------------------------------
// Scenes — each slide is a scene with its own timeline; the active scene's
// timeline lives in store.animTimeline, the rest in the store.animScenes stash.
// ---------------------------------------------------------------------------

/** Add a new blank scene after the last one and switch to it. */
export const addAnimScene = () => {
    if (!timeline()) return;
    // Adopt any just-drawn elements into the CURRENT scene before it's stashed —
    // otherwise the reconciler would later assign them to the new scene's cel.
    reconcileTimelineElements();
    const tl = timeline()!;
    const prevSlideId = store.slides[store.activeSlideIndex]?.id;
    addSlide(); // pushes ONE history entry (snapshot taken before any of this op's changes)
    const idx = store.slides.length - 1;
    batch(() => {
        setStore('slides', idx, 'name', `Scene ${idx + 1}`);
        // Stash a CLONE — a live proxy would alias later merges into the active node.
        if (prevSlideId) setStore('animScenes', reconcile({ ...store.animScenes, [prevSlideId]: cloneAnimTimeline(tl) }));
        setAnimTimeline(createDefaultAnimTimeline(store.layers.map(l => l.id), tl.fps, tl.frameCount));
        setStore('animCurrentFrame', 0);
        setStore('animPlaying', false);
        setStore('animFrameSelection', null);
    });
};

/** Switch to the scene at slide `index` (stash current, load target). */
export const setActiveAnimScene = (index: number) => {
    if (!timeline()) return;
    reconcileTimelineElements(); // flush pending adoption into the outgoing scene
    const tl = timeline()!;
    const cur = store.slides[store.activeSlideIndex];
    const target = store.slides[index];
    if (!target || target.id === cur?.id) return;
    batch(() => {
        const scenes = { ...store.animScenes };
        if (cur) scenes[cur.id] = cloneAnimTimeline(tl);
        // Clone the incoming scene too — its stash entry must not alias the active node.
        const next = scenes[target.id] ? cloneAnimTimeline(scenes[target.id]) : createDefaultAnimTimeline(store.layers.map(l => l.id), tl.fps, tl.frameCount);
        delete scenes[target.id];
        setStore('animScenes', reconcile(scenes));
        setAnimTimeline(next);
        setStore('animCurrentFrame', 0);
        setStore('animPlaying', false);
        setStore('animFrameSelection', null);
    });
    void setActiveSlide(index);
};

/** Delete the scene at slide `index` (its stage elements go with it). */
export const deleteAnimScene = (index: number) => {
    const slide = store.slides[index];
    if (!slide || store.slides.length <= 1) return;
    const deletingActive = index === store.activeSlideIndex;
    // deleteSlide pushes history and removes the slide + its stage's elements;
    // then drop the scene's timeline (or promote the next one when active died).
    deleteSlide(index);
    batch(() => {
        const scenes = { ...store.animScenes };
        delete scenes[slide.id];
        if (deletingActive) {
            const nowActive = store.slides[store.activeSlideIndex];
            const stashed = nowActive ? scenes[nowActive.id] : undefined;
            const next = stashed ? cloneAnimTimeline(stashed) : createDefaultAnimTimeline(store.layers.map(l => l.id));
            if (nowActive) delete scenes[nowActive.id];
            setAnimTimeline(next);
            setStore('animCurrentFrame', 0);
        }
        setStore('animScenes', reconcile(scenes));
    });
};

// Ids referenced by INACTIVE scenes must never be treated as orphans by the
// reconciler (they belong to other scenes' cels). Computed fresh per call:
// `reconcile()` keeps the store proxy's identity, so identity-keyed caching
// would silently go stale after scene switches.
const stashedSceneElementIds = (): Set<string> | undefined => {
    const map = store.animScenes;
    const keys = Object.keys(map);
    if (keys.length === 0) return undefined;
    const ids = new Set<string>();
    for (const k of keys)
        for (const l of map[k].layers)
            for (const kf of l.keyframes)
                for (const id of kf.elementIds) ids.add(id);
    return ids;
};

// ---------------------------------------------------------------------------
// Element bookkeeping
// ---------------------------------------------------------------------------

/**
 * Keep the cel model consistent with `store.elements` no matter which code path
 * created/removed elements (draw, paste, duplicate, API…): orphan elements join
 * the active cel of their layer's row; refs to deleted elements are pruned.
 * No history push — this derived bookkeeping runs AFTER the mutating op already
 * pushed its snapshot, so undo rolls both back together.
 */
/** Heal missing rows so every Layer has one (older docs, layers added outside
 *  the cascade). Bookkeeping — no history push. */
export const ensureAnimRows = () => {
    const tl = timeline();
    if (!tl) return;
    const missing = store.layers.filter(l => !tl.layers.some(r => r.layerId === l.id));
    if (missing.length === 0) return;
    setAnimTimeline({
        ...tl,
        layers: [...tl.layers, ...missing.map(l => ({ layerId: l.id, keyframes: [{ frame: 0, elementIds: [] }], endFrame: tl.frameCount - 1 }))],
    });
};

export const reconcileTimelineElements = () => {
    const tl = timeline();
    if (!tl) return;
    // During a movie-clip edit session the timeline IS the clip's: only
    // session-born elements may join it — pre-session document elements are
    // merely hidden, not part of the clip.
    const stash = getClipEditStash();
    // Also never adopt elements that belong to OTHER scenes' cels.
    const sceneIds = stashedSceneElementIds();
    const exclude = stash?.preIds && sceneIds ? new Set([...stash.preIds, ...sceneIds])
        : stash?.preIds ?? sceneIds;
    const next = opReconcile(tl, store.elements, store.animCurrentFrame, exclude);
    if (!next) return;
    // Session-born elements also join the edit group so exit-save collects them.
    const session = store.symbolEdit;
    if (stash && session?.clipEdit) {
        const before = new Set<string>();
        for (const l of tl.layers) for (const k of l.keyframes) for (const id of k.elementIds) before.add(id);
        const joined = new Set<string>();
        for (const l of next.layers) for (const k of l.keyframes) for (const id of k.elementIds) { if (!before.has(id)) joined.add(id); }
        if (joined.size > 0) {
            setStore('elements', e => joined.has(e.id), 'groupIds', (g: string[] | undefined) =>
                g?.includes(session.groupId) ? g : [...(g ?? []), session.groupId]);
        }
    }
    setAnimTimeline(next);
    bumpDirtyRevision();
};
