/**
 * Animation-mode timeline actions (docType 'animation') — thin store glue over
 * the PURE span arithmetic in `utils/animation/frame-timeline-ops.ts` (which is
 * where the F5/F6/F7 semantics live and unit-test). Kept out of app-store.ts on
 * purpose. Every mutating action pushes ONE history snapshot before applying.
 */

import { batch } from 'solid-js';
import { store, setStore, pushToHistory, bumpDirtyRevision, getClipEditStash } from './app-store';
import { generateId } from '../utils/id-generator';
import type { AnimTimeline, TweenKind } from '../types/anim-types';
import type { BezierEase } from '../types/motion-types';
import type { EasingName } from '../utils/animation/animation-types';
import {
    opInsertFrame, opInsertKeyframe, opInsertBlankKeyframe, opClearKeyframe,
    opRemoveFrames, opMoveKeyframe, opUpdateKeyframe, opReconcile,
} from '../utils/animation/frame-timeline-ops';
import { evaluateTimelineAt } from '../utils/animation/frame-timeline-evaluator';

const timeline = (): AnimTimeline | null => store.animTimeline;

// ---------------------------------------------------------------------------
// Frame visibility (the cel model's render/interaction filter)
// ---------------------------------------------------------------------------

// Visibility/placement depend only on (timeline structure, frame) — element
// props don't matter — and every timeline op replaces the object wholesale, so
// a ref+frame cache makes the per-pointermove hit-testing path O(1).
let structCache: { tl: AnimTimeline; frame: number; visible: Set<string>; placement: Map<string, number> } | null = null;

const structuralEval = () => {
    const tl = store.animTimeline;
    if (store.docType !== 'animation' || !tl) return null;
    const frame = store.animCurrentFrame;
    if (!structCache || structCache.tl !== tl || structCache.frame !== frame) {
        const ev = evaluateTimelineAt(frame, tl, []);
        structCache = { tl, frame, visible: ev.visible, placement: ev.placement };
    }
    return structCache;
};

/** Ids visible at the current playhead, or null outside animation mode. */
export const animVisibleIds = (): Set<string> | null => structuralEval()?.visible ?? null;

/** elementId → owning-keyframe start frame (drives movie-clip local clocks). */
export const animPlacementFrames = (): Map<string, number> | null => structuralEval()?.placement ?? null;

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

// ---------------------------------------------------------------------------
// Frame / keyframe edits (each pushes one history snapshot)
// ---------------------------------------------------------------------------

/** Apply a pure timeline-only op result. */
const apply = (next: AnimTimeline | null) => {
    if (!next) return;
    pushToHistory();
    setStore('animTimeline', next);
};

/** F5 — Insert Frame. */
export const insertFrame = (layerId: string, frame: number) =>
    apply(timeline() && opInsertFrame(timeline()!, layerId, frame));

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
        setStore('animTimeline', res.timeline);
    });
    return res.newElementIds;
};

/** F7 — Insert Blank Keyframe. */
export const insertBlankKeyframe = (layerId: string, frame: number) =>
    apply(timeline() && opInsertBlankKeyframe(timeline()!, layerId, frame));

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
        setStore('animTimeline', res.timeline);
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

export const setFrameEase = (layerId: string, frame: number, ease?: BezierEase, easing?: EasingName) =>
    apply(timeline() && opUpdateKeyframe(timeline()!, layerId, frame, { ease, easing }));

export const setFrameLabel = (layerId: string, frame: number, label: string) =>
    apply(timeline() && opUpdateKeyframe(timeline()!, layerId, frame, { label: label || undefined }));

// ---------------------------------------------------------------------------
// Timeline settings
// ---------------------------------------------------------------------------

export const setAnimFps = (fps: number) => {
    const tl = timeline();
    if (!tl) return;
    const v = Math.min(Math.max(1, Math.round(fps)), 120);
    if (v === tl.fps) return;
    pushToHistory();
    setStore('animTimeline', { ...tl, fps: v });
};

/** Set the ruler length. Can't shrink below existing row content. */
export const setAnimFrameCount = (frameCount: number) => {
    const tl = timeline();
    if (!tl) return;
    const maxEnd = Math.max(0, ...tl.layers.map(l => l.endFrame));
    const v = Math.max(Math.round(frameCount), maxEnd + 1, 1);
    if (v === tl.frameCount) return;
    pushToHistory();
    setStore('animTimeline', { ...tl, frameCount: v });
    if (store.animCurrentFrame > v - 1) setStore('animCurrentFrame', v - 1);
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
    setStore('animTimeline', {
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
    const next = opReconcile(tl, store.elements, store.animCurrentFrame, stash?.preIds);
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
    setStore('animTimeline', next);
    bumpDirtyRevision();
};
