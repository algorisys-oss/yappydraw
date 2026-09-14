/**
 * The scene clock: the one place that decides what time keyframes, tinyfly clips and
 * stick figures are drawn at, and the one driver that moves the playhead.
 *
 * Both used to live inside the Scene Timeline and Keyframes panels. Each panel ran its own
 * play controller in a component effect, and only the Scene Timeline computed the scene's
 * duration. So playback, and looping, only existed while a panel was open: `Yappy.playScene()`
 * with no panel did nothing, and a presentation or an exported HTML file ran keyframes on the
 * raw app clock, which never wraps — the scene played once and froze on its last frame.
 *
 * `startScenePlayback()` is called by the canvas, which the editor, the HTML player and the
 * embed viewer all mount, so every surface gets the same driver.
 */
import { createRoot, createEffect, untrack } from 'solid-js';
import { store, setStore } from '../../store/app-store';
import { effectiveTime } from './animation-engine';
import { tinyflyClipEnd } from './tinyfly-clips';
import { getClip } from '../../library/stick-figures/anim/clips';
import type { DrawingElement } from '../../types';

/** Shortest scene, so a scene made of one short clip still has room on the ruler. */
export const MIN_SCENE_SECONDS = 4;

/** Seconds one animated figure's track lasts (its sequence, path walk, or single clip). */
export function figureTrackSeconds(el: DrawingElement): number {
    const r = el.stickRig;
    if (!r) return 0;
    let steps: { clip: string; dur: number }[];
    if (r.sequence?.length) steps = r.sequence as any;
    else if (r.path) steps = [{ clip: 'walk', dur: r.path.dur || 4 }];
    else steps = [{ clip: r.clip, dur: getClip(r.clip).duration }];
    return steps.reduce((s, a) => s + Math.max(0.1, a.dur), 0);
}

/**
 * Scene length = the longest thing on the scene, at least MIN_SCENE_SECONDS: figure tracks,
 * composition keyframes and tinyfly clips. Counting only figures pinned an API-authored scene
 * (no figures) to the floor, so anything longer was unplayable past it.
 */
export function computeSceneDuration(): number {
    const figEnd = Math.max(0, ...store.elements.filter(e => e.type === 'stickRig').map(figureTrackSeconds));
    const keyEnd = Math.max(0, ...store.compositionTracks.flatMap(t => t.keys.map(k => k.t)));
    const tinyflyEnd = Math.max(0, ...store.tinyflyClips.map(tinyflyClipEnd));
    return Math.max(MIN_SCENE_SECONDS, figEnd, keyEnd, tinyflyEnd);
}

/**
 * Export time override. While an offline export draws a frame, every clock-driven renderer
 * must see that frame's time — not the live playhead (frozen while a timeline panel is open)
 * and not the app clock (whatever the session has accumulated). Set only for the duration of
 * one synchronous draw, via `withExportTime`.
 */
let exportSeconds: number | null = null;

/** The export frame's time in seconds while one is being drawn, else null. */
export const exportClockSeconds = (): number | null => exportSeconds;

/** Run `fn` (a synchronous frame draw) with every scene clock reading `seconds`. */
export function withExportTime<T>(seconds: number, fn: () => T): T {
    const prev = exportSeconds;
    exportSeconds = seconds;
    try { return fn(); } finally { exportSeconds = prev; }
}

/** True when the playhead (`storyTime`) is in charge rather than the free-running clock. */
export const playheadDriven = (): boolean =>
    store.showSceneTimeline || store.showKeyframePanel || store.storyPlaying;

/**
 * Seconds to draw the scene at, given the app clock in ms.
 *
 * With a timeline panel open, or the scene playing, it is the playhead. Otherwise the scene
 * free-runs on the app clock, wrapped at the scene length when looping is on (the default),
 * so presentations and exported HTML repeat instead of freezing on the last frame.
 */
export function sceneTime(clockMs: number): number {
    if (exportSeconds !== null) return exportSeconds;
    if (playheadDriven()) return store.storyTime;
    const t = Math.max(0, clockMs / 1000);
    const dur = store.storyDuration > 0 ? store.storyDuration : MIN_SCENE_SECONDS;
    return store.storyLoop ? t % dur : Math.min(t, dur);
}

let started = false;

/** Start the playhead driver and the duration tracker. Idempotent; lives for the page. */
export function startScenePlayback(): void {
    if (started) return;
    started = true;
    createRoot(() => {
        createEffect(() => {
            const dur = computeSceneDuration();
            untrack(() => { if (Math.abs(dur - store.storyDuration) > 0.05) setStore('storyDuration', dur); });
        });

        let last = effectiveTime() / 1000;
        createEffect(() => {
            const now = effectiveTime() / 1000; // re-runs every animation frame
            untrack(() => {
                const dt = Math.min(0.1, Math.max(0, now - last));
                last = now;
                if (!store.storyPlaying) return;
                let nt = store.storyTime + dt;
                if (nt >= store.storyDuration) {
                    if (store.storyLoop) nt = nt % store.storyDuration;
                    else { nt = store.storyDuration; setStore('storyPlaying', false); }
                }
                setStore('storyTime', nt);
            });
        });
    });
}
