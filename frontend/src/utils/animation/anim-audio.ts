/**
 * Animation-mode audio — schedules the timeline's audio row for editor
 * playback and for video-export muxing. Two source kinds:
 *  - `sfx`: the arcade synth's recipes (game/sound-engine `sfxInto`), rendered
 *    live into either its own output (editor) or the export graph;
 *  - `dataURL`: imported audio files, decoded once (cached) and played as
 *    buffer sources.
 * Scrubbing never plays audio; only Play and export do.
 */

import type { AnimAudioClip } from '../../types/anim-types';
import { sfxInto } from '../../game/sound-engine';

let actx: AudioContext | null = null;
const ensureCtx = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!actx) {
        const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
        if (!AC) return null;
        try { actx = new AC(); } catch { return null; }
    }
    if (actx.state === 'suspended') void actx.resume().catch(() => { });
    return actx;
};

/** Decoded imported-audio buffers, keyed by clip id (invalidated on dataURL change). */
const bufferCache = new Map<string, { dataURL: string; buffer: AudioBuffer }>();

export async function decodeClip(clip: AnimAudioClip, ctx: AudioContext): Promise<AudioBuffer | null> {
    if (!clip.dataURL) return null;
    const hit = bufferCache.get(clip.id);
    if (hit && hit.dataURL === clip.dataURL) return hit.buffer;
    try {
        const bytes = await (await fetch(clip.dataURL)).arrayBuffer();
        const buffer = await ctx.decodeAudioData(bytes);
        bufferCache.set(clip.id, { dataURL: clip.dataURL, buffer });
        return buffer;
    } catch { return null; }
}

export interface AudioPlaybackHandle { stop(): void }

/**
 * Editor playback: schedule every clip at/after `startFrame` relative to "now".
 * Returns a handle that cancels pending sounds and silences playing buffers.
 */
export function scheduleTimelineAudio(clips: AnimAudioClip[], startFrame: number, fps: number): AudioPlaybackHandle {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const sources: AudioBufferSourceNode[] = [];
    let stopped = false;
    const ctx = ensureCtx();

    for (const clip of clips) {
        if (clip.frame < startFrame) continue;
        const delayMs = ((clip.frame - startFrame) / fps) * 1000;
        if (clip.sfx) {
            timers.push(setTimeout(() => { if (!stopped) sfxInto(clip.sfx!); }, delayMs));
        } else if (clip.dataURL && ctx) {
            void decodeClip(clip, ctx).then(buffer => {
                if (!buffer || stopped) return;
                const src = ctx.createBufferSource();
                src.buffer = buffer;
                const g = ctx.createGain();
                g.gain.value = clip.gain ?? 1;
                src.connect(g); g.connect(ctx.destination);
                src.start(ctx.currentTime + Math.max(0, delayMs / 1000));
                sources.push(src);
            });
        }
    }
    return {
        stop() {
            stopped = true;
            for (const t of timers) clearTimeout(t);
            for (const s of sources) { try { s.stop(); } catch { /* already ended */ } }
        },
    };
}

/**
 * Export muxing: build an audio stream with every clip scheduled at its
 * timeline offset. Returns the stream to hand to the recorder (null when
 * there's nothing to mux or WebAudio is unavailable).
 */
export async function buildExportAudioStream(clips: AnimAudioClip[], fps: number): Promise<{ stream: MediaStream; close(): void } | null> {
    if (clips.length === 0) return null;
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!AC) return null;
    let ctx: AudioContext;
    try { ctx = new AC(); } catch { return null; }
    const dest = ctx.createMediaStreamDestination();

    const t0 = ctx.currentTime + 0.05; // small lead so frame-0 sounds aren't clipped
    for (const clip of clips) {
        const when = t0 + clip.frame / fps;
        if (clip.sfx) {
            sfxInto(clip.sfx, { c: ctx, out: dest, when });
        } else if (clip.dataURL) {
            const buffer = await decodeClip(clip, ctx);
            if (!buffer) continue;
            const src = ctx.createBufferSource();
            src.buffer = buffer;
            const g = ctx.createGain();
            g.gain.value = clip.gain ?? 1;
            src.connect(g); g.connect(dest);
            src.start(when);
        }
    }
    return { stream: dest.stream, close: () => { void ctx.close().catch(() => { }); } };
}
