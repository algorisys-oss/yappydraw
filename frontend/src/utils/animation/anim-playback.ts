/**
 * Animation-mode playback controller — the single rAF loop that advances the
 * frame playhead (`store.animCurrentFrame`) at the timeline's fps. Shared by
 * the mode bar, the timeline panel, hotkeys and the Yappy API so play state
 * can't fork. Frames are derived from wall-clock elapsed time (not ++ per rAF),
 * so playback speed is display-refresh independent.
 */

import { store, setStore } from '../../store/app-store';
import { gotoFrame } from '../../store/anim-ops';
import { scheduleTimelineAudio, type AudioPlaybackHandle } from './anim-audio';

let rafId: number | null = null;
let startWallMs = 0;
let startFrame = 0;
let audioHandle: AudioPlaybackHandle | null = null;

const tick = () => {
    rafId = null;
    const tl = store.animTimeline;
    if (!tl || !store.animPlaying) return;
    const elapsed = (performance.now() - startWallMs) / 1000;
    const raw = startFrame + Math.floor(elapsed * tl.fps);
    if (store.animLoop) {
        const f = raw % tl.frameCount;
        // Loop wrap: reschedule the audio row for the new pass.
        if (f < store.animCurrentFrame && tl.audio?.length) {
            audioHandle?.stop();
            audioHandle = scheduleTimelineAudio(tl.audio, 0, tl.fps);
        }
        setStore('animCurrentFrame', f);
    } else if (raw >= tl.frameCount - 1) {
        setStore('animCurrentFrame', tl.frameCount - 1);
        setStore('animPlaying', false);
        audioHandle?.stop();
        audioHandle = null;
        return;
    } else {
        setStore('animCurrentFrame', raw);
    }
    rafId = requestAnimationFrame(tick);
};

export const playAnimation = () => {
    const tl = store.animTimeline;
    if (!tl || store.animPlaying) return;
    // Play from the playhead; restart when parked on the last frame (non-loop end).
    startFrame = store.animCurrentFrame >= tl.frameCount - 1 ? 0 : store.animCurrentFrame;
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

/** Stop = pause + rewind to frame 0 (Animate's Stop button). */
export const stopAnimation = () => {
    pauseAnimation();
    gotoFrame(0);
};

export const toggleAnimPlayback = () => (store.animPlaying ? pauseAnimation() : playAnimation());
