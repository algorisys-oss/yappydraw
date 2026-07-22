/**
 * Animation-mode playback controller — the single rAF loop that advances the
 * frame playhead (`store.animCurrentFrame`) at the timeline's fps. Shared by
 * the mode bar, the timeline panel, hotkeys and the Yappy API so play state
 * can't fork. Frames are derived from wall-clock elapsed time (not ++ per rAF),
 * so playback speed is display-refresh independent.
 */

import { store, setStore } from '../../store/app-store';
import { gotoFrame } from '../../store/anim-ops';

let rafId: number | null = null;
let startWallMs = 0;
let startFrame = 0;

const tick = () => {
    rafId = null;
    const tl = store.animTimeline;
    if (!tl || !store.animPlaying) return;
    const elapsed = (performance.now() - startWallMs) / 1000;
    const raw = startFrame + Math.floor(elapsed * tl.fps);
    if (store.animLoop) {
        setStore('animCurrentFrame', raw % tl.frameCount);
    } else if (raw >= tl.frameCount - 1) {
        setStore('animCurrentFrame', tl.frameCount - 1);
        setStore('animPlaying', false);
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
    if (rafId === null) rafId = requestAnimationFrame(tick);
};

export const pauseAnimation = () => {
    setStore('animPlaying', false);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
};

/** Stop = pause + rewind to frame 0 (Animate's Stop button). */
export const stopAnimation = () => {
    pauseAnimation();
    gotoFrame(0);
};

export const toggleAnimPlayback = () => (store.animPlaying ? pauseAnimation() : playAnimation());
