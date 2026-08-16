/**
 * Animation-mode playback controller — the single rAF loop that advances the
 * frame playhead (`store.animCurrentFrame`) at the timeline's fps. Shared by
 * the mode bar, the timeline panel, hotkeys and the Yappy API so play state
 * can't fork. Frames are derived from wall-clock elapsed time (not ++ per rAF),
 * so playback speed is display-refresh independent.
 */

import { store, setStore } from '../../store/app-store';
import { gotoFrame, setActiveAnimScene } from '../../store/anim-ops';
import { scheduleTimelineAudio, type AudioPlaybackHandle } from './anim-audio';
import { playbackRange } from './frame-timeline-ops';
import type { AnimTimeline, FrameAction } from '../../types/anim-types';

let rafId: number | null = null;
let startWallMs = 0;
let startFrame = 0;
let audioHandle: AudioPlaybackHandle | null = null;

/** First frame action in (fromExclusive, toInclusive], honoring a loop wrap. */
const findAction = (tl: AnimTimeline, fromEx: number, toIn: number): { frame: number; action: FrameAction } | null => {
    const at = (f: number): FrameAction | undefined => {
        for (const l of tl.layers) {
            const kf = l.keyframes.find(k => k.frame === f);
            if (kf?.action) return kf.action;
        }
        return undefined;
    };
    const scan = (a: number, b: number) => {
        for (let f = a; f <= b; f++) {
            const action = at(f);
            if (action) return { frame: f, action };
        }
        return null;
    };
    if (toIn >= fromEx) return scan(fromEx + 1, toIn);
    // wrapped: (fromEx, end] then [0, toIn]
    return scan(fromEx + 1, tl.frameCount - 1) ?? scan(0, toIn);
};

/** Restart the playback clock from `frame` (used by goto actions + scene jumps). */
const rebase = (frame: number, tl: AnimTimeline) => {
    startFrame = frame;
    startWallMs = performance.now();
    setStore('animCurrentFrame', frame);
    if (tl.audio?.length) {
        audioHandle?.stop();
        audioHandle = scheduleTimelineAudio(tl.audio, frame, tl.fps);
    }
};

const stopHere = (frame: number) => {
    setStore('animCurrentFrame', frame);
    setStore('animPlaying', false);
    audioHandle?.stop();
    audioHandle = null;
};

const tick = () => {
    rafId = null;
    const tl = store.animTimeline;
    if (!tl || !store.animPlaying) return;
    const elapsed = (performance.now() - startWallMs) / 1000;
    const raw = startFrame + Math.floor(elapsed * tl.fps);
    const prev = store.animCurrentFrame;

    // Playback covers the marked in/out range, or the whole ruler when none is set.
    const [lo, hi] = playbackRange(tl);
    const len = hi - lo + 1;

    let f: number;
    let ended = false;
    if (store.animLoop) {
        f = lo + (((raw - lo) % len) + len) % len;
        // Loop wrap: reschedule the audio row for the new pass.
        if (f < prev && tl.audio?.length) {
            audioHandle?.stop();
            audioHandle = scheduleTimelineAudio(tl.audio, lo, tl.fps);
        }
    } else if (raw >= hi) {
        f = hi;
        ended = true;
    } else {
        f = Math.max(lo, raw);
    }

    // Frame actions fire when PLAYBACK crosses their keyframe (never on scrub).
    if (f !== prev) {
        const hit = findAction(tl, prev, f);
        if (hit) {
            const a = hit.action;
            if (a.kind === 'stop') { stopHere(hit.frame); return; }
            if (a.kind === 'goto') {
                const target = Math.min(Math.max(0, Math.round(a.frame)), tl.frameCount - 1);
                if (a.play === false) { stopHere(target); return; }
                rebase(target, tl);
                rafId = requestAnimationFrame(tick);
                return;
            }
            // nextScene: advance (wrapping) and keep playing from its frame 0.
            const nextIndex = (store.activeSlideIndex + 1) % store.slides.length;
            pauseAnimation();
            setActiveAnimScene(nextIndex);
            playAnimation();
            return;
        }
    }

    setStore('animCurrentFrame', f);
    if (ended) {
        setStore('animPlaying', false);
        audioHandle?.stop();
        audioHandle = null;
        return;
    }
    rafId = requestAnimationFrame(tick);
};

export const playAnimation = () => {
    const tl = store.animTimeline;
    if (!tl || store.animPlaying) return;
    // Play from the playhead; restart from the range start when parked on (or
    // outside) its end — a playhead left before mark-in would otherwise run the
    // frames the user just excluded.
    const [lo, hi] = playbackRange(tl);
    const cur = store.animCurrentFrame;
    startFrame = cur >= hi || cur < lo ? lo : cur;
    startWallMs = performance.now();
    setStore('animPlaying', true);
    if (tl.audio?.length) audioHandle = scheduleTimelineAudio(tl.audio, startFrame, tl.fps);
    if (rafId === null) rafId = requestAnimationFrame(tick);
};

export const pauseAnimation = () => {
    setStore('animPlaying', false);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    audioHandle?.stop();
    audioHandle = null;
};

/** Stop = pause + rewind to the range start (Animate's Stop button). */
export const stopAnimation = () => {
    pauseAnimation();
    gotoFrame(store.animTimeline ? playbackRange(store.animTimeline)[0] : 0);
};

export const toggleAnimPlayback = () => (store.animPlaying ? pauseAnimation() : playAnimation());
