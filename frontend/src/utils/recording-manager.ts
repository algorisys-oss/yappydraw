/**
 * Recording Manager
 * Handles video recording, thumbnail capture, and recording lifecycle.
 * Extracted from canvas.tsx.
 */

import { createSignal, createEffect, untrack } from "solid-js";
import { store, setStore, isLayerVisible, updateSlideThumbnail } from "../store/app-store";
import { isExportable, elementsBounds, ensureExportImages } from "./export";
import { VideoRecorder, type VideoFormat } from "./video-recorder";
import { showToast } from "../components/toast";
import rough from 'roughjs';
import { renderSlideBackground } from "./canvas-renderer";
import { renderElement } from "./render-element";
import { projectMasterPosition, ownerSlideIndex } from "./slide-utils";
import { calculateAllAnimatedStates } from "./animation-utils";
import { applyCompositionOverrides } from "./animation/composition-evaluator";
import { evaluateTinyflyClips, ensureTinyflyEngine } from "./animation/tinyfly-clips";
import { evaluateTimelineAt, evaluateCameraAt } from "./animation/frame-timeline-evaluator";
import { playbackRange } from "./animation/frame-timeline-ops";
import type { AnimTimeline } from "../types/anim-types";

/** Seconds of one pass over the exported frame range. */
const animPassSeconds = (tl: AnimTimeline): number => {
    const [lo, hi] = playbackRange(tl);
    return (hi - lo + 1) / tl.fps;
};
import { effectiveTime } from "./animation/animation-engine";
import { withExportTime } from "./animation/scene-clock";
import { worldToScreen } from "./viewport-transforms";
import { isPagedDocType, type Slide } from "../types/slide-types";
import type { DrawingElement } from "../types";

// Export controls for Menu/Dialog access
export const [requestRecording, setRequestRecording] = createSignal<{ start: boolean, format?: 'webm' | 'mp4' } | null>(null);

// True while an offline page-video export runs — the canvas force-ticker
// predicate includes this so the animation clock keeps advancing even when
// nothing on the live canvas would otherwise need it.
export const [pageVideoExporting, setPageVideoExporting] = createSignal(false);

// ── Live-canvas GIF capture ────────────────────────────────────────────────
// Start/stop, not a fixed duration. Animations here fire on clicks, build steps
// and conditions, so there is no length to know up front — a timer either cuts
// off the payoff or burns frames waiting for it. Stopping by hand also lands a
// better loop seam than a timer can: a person can stop the moment the motion
// returns to where it began, which is exactly what makes a GIF loop cleanly.
export const [gifCapturing, setGifCapturing] = createSignal(false);
export const [gifElapsedMs, setGifElapsedMs] = createSignal(0);
/** Bytes written so far — the cost of a long capture, visible while it accrues. */
export const [gifBytes, setGifBytes] = createSignal(0);

// Readout for a running capture. Shared rather than inlined per surface because
// there is now more than one — the presentation toolbar button and the
// editing-mode overlay — and they must not drift apart on formatting.
export const gifElapsedText = (): string => {
    const s = Math.floor(gifElapsedMs() / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
export const gifSizeText = (): string => {
    const kb = gifBytes() / 1024;
    return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
};

// Backstop so a forgotten capture can't quietly produce a huge file. Memory is
// NOT the constraint: frames are encoded and appended as they arrive and raw
// frames are never retained, so a capture costs about its own output size
// (~40KB/s at 960px). This cap is about what is reasonable to post.
const GIF_MAX_SECONDS = 60;

let stopGifRequested = false;

/** Ask the running capture to finish and download. No-op when idle. */
export function stopCanvasGif(): void { stopGifRequested = true; }

// The on-screen canvas, registered by setupRecording. GIF capture samples THIS
// rather than re-rendering offline: in presentation mode the whole point is to
// capture the run as the presenter drives it, including slide changes, ink and
// the laser pointer — none of which an offline page render knows about.
let getLiveCanvas: (() => HTMLCanvasElement | undefined) | null = null;

/**
 * Region of the live canvas worth keeping. Presentation zooms a page to fit,
 * which leaves workspace letterboxing around it; capturing the raw canvas would
 * bake those bars into the GIF. On an infinite canvas there is no page, so the
 * viewport itself is the frame.
 */
function liveCaptureRect(canvas: HTMLCanvasElement): { sx: number; sy: number; sw: number; sh: number } {
    const full = { sx: 0, sy: 0, sw: canvas.width, sh: canvas.height };
    if (!isPagedDocType(store.docType)) return full;
    const slide = store.slides[store.activeSlideIndex];
    if (!slide?.dimensions?.width || !slide?.dimensions?.height) return full;

    const { x, y } = worldToScreen(slide.spatialPosition.x, slide.spatialPosition.y, store.viewState);
    const w = slide.dimensions.width * store.viewState.scale;
    const h = slide.dimensions.height * store.viewState.scale;
    // Clamp into the canvas: a page can hang off-screen if the user zoomed or
    // panned away from the fitted view, and getImageData on an out-of-bounds
    // rect yields transparent pixels rather than an error — a silently blank GIF.
    const sx = Math.max(0, Math.round(x));
    const sy = Math.max(0, Math.round(y));
    const sw = Math.min(canvas.width - sx, Math.round(w));
    const sh = Math.min(canvas.height - sy, Math.round(h));
    if (sw < 16 || sh < 16) return full;
    return { sx, sy, sw, sh };
}

/**
 * Capture the LIVE canvas to an infinitely-looping GIF, running until
 * `stopCanvasGif()` is called (or the safety cap is reached), then download it.
 *
 * Resolves with true once the file is written, so a caller wanting a fixed
 * length can start it and schedule its own stop.
 */
export async function startCanvasGif(opts: { fps?: number; name?: string; maxSeconds?: number } = {}): Promise<boolean> {
    const fps = Math.max(5, Math.min(30, opts.fps ?? 12));
    const maxMs = Math.max(1, Math.min(GIF_MAX_SECONDS, opts.maxSeconds ?? GIF_MAX_SECONDS)) * 1000;
    if (gifCapturing()) { showToast('A GIF capture is already running', 'info'); return false; }
    // Fall back to the DOM if the getter is missing. It normally isn't — but a
    // hot module reload can leave the registration on a stale copy of this
    // module while the toolbar imports the new one, and "the button silently
    // does nothing" is a miserable way to find that out.
    const src = getLiveCanvas?.() ?? document.querySelector('canvas') ?? null;
    if (!src) { showToast('Canvas not ready for capture — reload the page and try again', 'error'); return false; }

    const { sx, sy, sw, sh } = liveCaptureRect(src);
    // Long side capped: GIFs store every frame whole, so pixels cost far more
    // here than in a video container.
    const k = Math.min(1, 960 / Math.max(sw, sh));
    const off = document.createElement('canvas');
    off.width = Math.max(2, Math.round(sw * k));
    off.height = Math.max(2, Math.round(sh * k));
    const ctx = off.getContext('2d', { willReadFrequently: true });
    if (!ctx) { showToast('Could not start GIF capture', 'error'); return false; }

    const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
    const gif = GIFEncoder();
    const delay = gifFrameDelayMs(fps);
    const t0 = performance.now();
    let nextT = 0;
    let first = true;

    stopGifRequested = false;
    setGifCapturing(true);
    setGifElapsedMs(0);
    setGifBytes(0);
    showToast('Capturing GIF — press Stop when you\'re done', 'info');

    return await new Promise<boolean>((resolve) => {
        let frames = 0;

        const clear = () => {
            setGifCapturing(false);
            setGifElapsedMs(0);
            setGifBytes(0);
            stopGifRequested = false;
        };

        // Any throw in here used to kill the capture silently AND strand the
        // capturing flag — which left the buttons disabled, so every later click
        // did nothing too. One failure became a permanently dead feature with no
        // message. Failing loudly and always clearing state is the point.
        const fail = (err: unknown) => {
            console.error('[recording-manager] GIF capture failed:', err);
            clear();
            const msg = (err as Error)?.name === 'SecurityError'
                // Reading pixels off a canvas that has drawn a cross-origin
                // image is blocked by the browser. Nothing we can do from here
                // — but say which problem it is, because "GIF failed" sends
                // people looking in the wrong place.
                ? 'GIF capture blocked: an image in this drawing comes from another site. Re-insert it as an uploaded file and try again.'
                : `GIF capture failed: ${(err as Error)?.message ?? 'unknown error'}`;
            showToast(msg, 'error');
            resolve(false);
        };

        const finish = (hitCap: boolean) => {
            try {
                if (frames === 0) { fail(new Error('no frames were captured')); return; }
                gif.finish();
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                const blob = new Blob([gif.bytesView() as BlobPart], { type: 'image/gif' });
                const secs = Math.round((performance.now() - t0) / 100) / 10;
                downloadBlob(blob, `${opts.name ?? 'yappy-capture'}-${timestamp}.gif`);
                clear();
                showToast(
                    hitCap
                        ? `Reached the ${GIF_MAX_SECONDS}s limit — GIF saved (${frames} frames, ${Math.round(blob.size / 1024)} KB)`
                        : `GIF saved — ${secs}s, ${frames} frames, ${Math.round(blob.size / 1024)} KB`,
                    hitCap ? 'info' : 'success');
                resolve(true);
            } catch (err) { fail(err); }
        };

        const frame = () => {
            try {
                const elapsed = performance.now() - t0;
                setGifElapsedMs(elapsed);
                if (elapsed >= nextT) {
                    ctx.clearRect(0, 0, off.width, off.height);
                    ctx.drawImage(src, sx, sy, sw, sh, 0, 0, off.width, off.height);
                    const { data } = ctx.getImageData(0, 0, off.width, off.height);
                    const palette = quantize(data, 256);
                    const index = applyPalette(data, palette);
                    // repeat: 0 on the first frame writes the loop block → loops forever.
                    gif.writeFrame(index, off.width, off.height, { palette, delay, repeat: first ? 0 : undefined });
                    first = false;
                    frames++;
                    nextT += delay;
                    // A view over the buffer written so far — cheap, and the only
                    // honest way to show the file growing as it is captured.
                    setGifBytes(gif.bytesView().byteLength);
                }
                if (stopGifRequested) finish(false);
                else if (elapsed >= maxMs) finish(true);
                else requestAnimationFrame(frame);
            } catch (err) { fail(err); }
        };
        requestAnimationFrame(frame);
    });
}

/**
 * Convenience for scripts: capture for a fixed number of seconds. The UI is
 * start/stop — animations fire on clicks and conditions, so a length is rarely
 * knowable up front — but an unattended script has no one to press Stop.
 */
export async function recordCanvasGif(opts: { seconds?: number; fps?: number; name?: string } = {}): Promise<boolean> {
    const seconds = Math.max(1, Math.min(GIF_MAX_SECONDS, opts.seconds ?? 5));
    const done = startCanvasGif({ fps: opts.fps, name: opts.name, maxSeconds: seconds });
    window.setTimeout(stopCanvasGif, seconds * 1000);
    return done;
}

/** A world-space rectangle to render frames of. `background` null/'transparent' = none. */
export interface FrameRegion {
    x: number; y: number; width: number; height: number;
    background?: string | null;
    /** Set when the region IS a page: its index in `store.slides` (page background + master layers). */
    page?: number;
}

/**
 * The scene posed at export time `exportMs` (ms since the export's t = 0): every
 * exportable element, in layer order, with animation, composition, tinyfly and
 * frame-timeline overrides applied. Also returns the layer opacity each is drawn
 * with. Shared by frame drawing and by `animatedContentBounds`, so the box an
 * export is framed to is computed from exactly what gets drawn.
 */
function poseAt(exportMs: number, slide: Slide | null): { el: DrawingElement; layerOpacity: number }[] {
    const sceneT = exportMs / 1000;
    const anim = calculateAllAnimatedStates(store.elements, exportMs, true);
    if (store.compositionTracks.length > 0 || store.tinyflyClips.length > 0 || store.elements.some(e => e.transformParentId)) {
        const clipOverrides = store.tinyflyClips.length > 0 ? evaluateTinyflyClips(sceneT, store.tinyflyClips, store.elements) : undefined;
        applyCompositionOverrides(anim, store.elements, sceneT, store.compositionTracks, clipOverrides);
    }

    // Animation mode: quantize elapsed export time to the timeline's fps and
    // resolve that frame's cel + tween poses. Driving the store playhead too
    // keeps nested movie-clip rendering (which reads it) frame-exact.
    let animVisible: Set<string> | null = null;
    if (store.docType === 'animation' && store.animTimeline) {
        const tl = store.animTimeline;
        // Export covers the marked in/out range (the whole ruler when none).
        const [lo, hi] = playbackRange(tl);
        const f = lo + (Math.floor(sceneT * tl.fps) % (hi - lo + 1));
        if (store.animCurrentFrame !== f) setStore('animCurrentFrame', f);
        const ev = evaluateTimelineAt(f, tl, store.elements);
        animVisible = ev.visible;
        for (const id in ev.overrides) {
            const existing = anim.get(id);
            if (existing) Object.assign(existing, ev.overrides[id]);
            else anim.set(id, { ...ev.overrides[id] } as any);
        }
    }

    const out: { el: DrawingElement; layerOpacity: number }[] = [];
    const sortedLayers = [...store.layers].sort((a, b) => a.order - b.order);
    for (const layer of sortedLayers) {
        if (!isLayerVisible(layer.id)) continue;
        const layerOpacity = layer?.opacity ?? 1;
        // isExportable: hidden elements and null objects (authoring gizmos) never reach a frame.
        for (const el of store.elements) {
            if (el.layerId !== layer.id || !isExportable(el)) continue;
            if (animVisible && !animVisible.has(el.id)) continue;
            let renderEl = el;
            if (layer.isMaster && slide) {
                const projected = projectMasterPosition(el, slide, store.slides);
                renderEl = { ...el, x: projected.x, y: projected.y };
            }
            const ov = anim.get(el.id);
            if (ov) renderEl = { ...renderEl, ...ov };
            out.push({ el: renderEl, layerOpacity });
        }
    }
    return out;
}

/**
 * Union of the posed scene's bounds over `seconds` (sampled `samples` times), so a
 * video of something that moves is framed to where it GOES, not only where it starts.
 * Null when there is nothing to draw.
 */
export function animatedContentBounds(seconds: number, samples = 24): { x: number; y: number; width: number; height: number } | null {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const n = seconds > 0 ? Math.max(1, Math.floor(samples)) : 0;
    for (let i = 0; i <= n; i++) {
        const posed = poseAt(n ? (seconds * 1000 * i) / n : 0, null).map(p => p.el);
        if (!posed.length) continue;
        const b = elementsBounds(posed);
        if (b.maxX - b.minX <= 0 && b.maxY - b.minY <= 0) continue;
        minX = Math.min(minX, b.minX); minY = Math.min(minY, b.minY);
        maxX = Math.max(maxX, b.maxX); maxY = Math.max(maxY, b.maxY);
    }
    if (!isFinite(minX)) return null;
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Offscreen renderer for one world-space region: a hidden canvas at `k` pixels per
 * unit plus `drawAt(exportMs)`, which renders the region exactly as the live canvas
 * would at that export time. `slide` is the page being exported, when there is one:
 * it supplies the page background and master-layer projection.
 */
export function makeRegionFrameRenderer(region: FrameRegion, k: number, forGif = false, slide: Slide | null = null) {
    const { x: spatialX, y: spatialY, width: sW, height: sH } = region;
    if (!(sW > 0) || !(sH > 0) || !(k > 0)) return null;
    const off = document.createElement('canvas');
    off.width = Math.max(1, Math.round(sW * k));
    off.height = Math.max(1, Math.round(sH * k));
    const ctx = off.getContext('2d', forGif ? { willReadFrequently: true } : undefined);
    if (!ctx) return null;
    const rc = rough.canvas(off);
    const isDark = store.resolvedTheme === 'dark' || store.resolvedTheme === 'focus';
    const bg = region.background && region.background !== 'transparent' ? region.background : null;

    const drawAt = (exportMs: number) => {
        const sceneT = exportMs / 1000;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, off.width, off.height);
        if (!slide && bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, off.width, off.height); }
        ctx.save();
        ctx.scale(k, k);
        ctx.translate(-spatialX, -spatialY);
        if (slide) renderSlideBackground(ctx, rc, slide, spatialX, spatialY, sW, sH, store.theme);

        const posed = poseAt(exportMs, slide);

        // Camera layer: zoom/pan the stage content in the exported frames too.
        if (store.docType === 'animation' && store.animTimeline?.camera?.length) {
            const cam = evaluateCameraAt(store.animCurrentFrame, store.animTimeline);
            if (cam) {
                ctx.translate(spatialX + sW / 2, spatialY + sH / 2);
                ctx.scale(cam.zoom, cam.zoom);
                ctx.translate(-(spatialX + cam.x), -(spatialY + cam.y));
            }
        }

        const margin = 200; // cheap region-overlap cull (post-override AABB)
        for (const { el, layerOpacity } of posed) {
            if (el.x + el.width < spatialX - margin || el.x > spatialX + sW + margin ||
                el.y + el.height < spatialY - margin || el.y > spatialY + sH + margin) continue;
            withExportTime(sceneT, () => renderElement(rc, ctx, el, isDark, layerOpacity));
        }
        ctx.restore();
    };

    return { off, ctx, drawAt };
}

let frameCache: { key: string; r: NonNullable<ReturnType<typeof makeRegionFrameRenderer>> } | null = null;

/**
 * One frame of `region` at export time `exportMs`, as a data URL. Deterministic: the
 * time is absolute, so frames can be rendered in any order, at any pace, which is what
 * an offline renderer (the `render` CLI) needs and a real-time recorder can't give.
 * The offscreen canvas is reused while region and scale stay the same.
 */
export async function renderRegionFrame(
    region: FrameRegion, k: number, exportMs: number,
    opts: { slide?: Slide | null; mime?: 'image/png' | 'image/jpeg'; quality?: number } = {},
): Promise<string | null> {
    if (store.tinyflyClips.length > 0) await ensureTinyflyEngine(); // clips render nothing until it has loaded
    await ensureExportImages();
    const mime = opts.mime ?? 'image/png';
    // JPEG has no alpha: a transparent frame would come out black.
    const background = mime === 'image/jpeg' && (!region.background || region.background === 'transparent') ? '#ffffff' : region.background;
    const slide = opts.slide ?? null;
    const key = JSON.stringify([region.x, region.y, region.width, region.height, background, k, slide?.id ?? null]);
    if (!frameCache || frameCache.key !== key) {
        const r = makeRegionFrameRenderer({ ...region, background }, k, false, slide);
        if (!r) return null;
        frameCache = { key, r };
    }
    frameCache.r.drawAt(Math.max(0, exportMs));
    try { return frameCache.r.off.toDataURL(mime, opts.quality); } catch { return null; }
}

/**
 * A looping GIF of `region` over `seconds`, rendered frame by frame at exact times
 * (not recorded in real time), so a slow machine or a headless browser produces the
 * same file as a fast one. Frames sit on the GIF's 10 ms delay grid, which is what a
 * viewer plays them at. Returns the file's bytes; downloads nothing.
 */
export async function renderRegionGif(
    region: FrameRegion, k: number, seconds: number, fps: number, slide: Slide | null = null,
): Promise<Uint8Array | null> {
    if (store.tinyflyClips.length > 0) await ensureTinyflyEngine();
    await ensureExportImages();
    const background = region.background && region.background !== 'transparent' ? region.background : '#ffffff';
    const r = makeRegionFrameRenderer({ ...region, background }, k, true, slide);
    if (!r) return null;
    const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
    const gif = GIFEncoder();
    const delay = gifFrameDelayMs(Math.max(1, Math.min(50, fps)));
    const count = Math.max(1, Math.ceil((Math.max(0, seconds) * 1000) / delay));
    for (let i = 0; i < count; i++) {
        r.drawAt(i * delay);
        const { data } = r.ctx.getImageData(0, 0, r.off.width, r.off.height);
        const palette = quantize(data, 256);
        // repeat: 0 on the first frame writes the loop block → loops forever.
        gif.writeFrame(applyPalette(data, palette), r.off.width, r.off.height, { palette, delay, repeat: i === 0 ? 0 : undefined });
    }
    gif.finish();
    return gif.bytes();
}

/** Offscreen page renderer shared by the video and GIF exports: a hidden
 *  canvas sized to the active page (long side capped at `maxSide`) plus a
 *  `draw(tMs)` that renders the page exactly as the live canvas would at
 *  animation-time `tMs` (background, layers, master projection, animated +
 *  composition overrides). */
export function makePageFrameRenderer(maxSide: number, forGif = false) {
    const slide = store.slides[store.activeSlideIndex];
    if (!slide) return null;
    const { width: sW, height: sH } = slide.dimensions;
    const { x: spatialX, y: spatialY } = slide.spatialPosition;
    if (!sW || !sH) return null;

    const k = Math.min(1, maxSide / Math.max(sW, sH));
    const r = makeRegionFrameRenderer({ x: spatialX, y: spatialY, width: sW, height: sH }, k, forGif, slide);
    if (!r) return null;

    let baseT: number | null = null; // first draw() call = export time zero
    // Everything clock-driven is export time: the export starts at t = 0. `tMs` is the
    // app's animation clock, which keeps whatever the session has accumulated, so using it
    // directly started the export part-way through the scene (or on its last frame).
    // Orbit/spin read `exportMs`; keyframes and tinyfly clips read `sceneT`; stick figures
    // and flow dashes read it through `withExportTime`.
    const draw = (tMs: number) => {
        if (baseT === null) baseT = tMs;
        r.drawAt(tMs - baseT);
    };

    return { off: r.off, ctx: r.ctx, draw };
}

const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
};

/**
 * Offline, page-scoped video export: renders the ACTIVE page (and only the
 * page, at its own resolution) to a hidden canvas for `seconds`, driven by the
 * same animation clocks as the live canvas, and downloads the recording.
 * Unlike the live-capture path (`requestRecording`), the result is framed to
 * the page — no workspace grey, no neighbouring pages, no dependency on the
 * current zoom/pan — which is what "export my animated post as MP4" means.
 */
export async function exportPageVideo(opts: { seconds?: number; format?: VideoFormat; name?: string } = {}): Promise<boolean> {
    // Animation docs default to one full pass of the marked range (or the ruler).
    const animDefault = store.docType === 'animation' && store.animTimeline
        ? animPassSeconds(store.animTimeline) : 5;
    const seconds = Math.max(1, Math.min(120, opts.seconds ?? animDefault));
    const format = opts.format ?? 'mp4';
    if (pageVideoExporting()) { showToast('A video export is already running', 'info'); return false; }
    const fr = makePageFrameRenderer(1920);
    if (!fr) { showToast('Video export needs a page/slide document', 'error'); return false; }
    if (store.tinyflyClips.length > 0) await ensureTinyflyEngine(); // clips render nothing until it has loaded

    // Animation-mode audio row → muxed into the recording (scheduled at export start).
    let exportAudio: { stream: MediaStream; close(): void } | null = null;
    if (store.docType === 'animation' && store.animTimeline?.audio?.length) {
        const { buildExportAudioStream } = await import('./animation/anim-audio');
        exportAudio = await buildExportAudioStream(store.animTimeline.audio, store.animTimeline.fps).catch(() => null);
    }

    const recorder = new VideoRecorder(fr.off, opts.name ?? 'yappy-animation');
    if (!recorder.start(format, exportAudio?.stream)) { exportAudio?.close(); showToast('Failed to start video export', 'error'); return false; }
    setPageVideoExporting(true);
    showToast(`Exporting ${seconds}s ${format.toUpperCase()} of this ${store.docType === 'design' ? 'page' : 'slide'}…`, 'info');

    const t0 = performance.now();
    const tAnim0 = effectiveTime();

    return await new Promise<boolean>((resolve) => {
        const frame = () => {
            const elapsed = performance.now() - t0;
            // Local monotonic clock: keeps orbit/spin/keyframes advancing even
            // if the reactive engine clock stalls mid-export.
            fr.draw(tAnim0 + elapsed);
            if (elapsed < seconds * 1000) {
                requestAnimationFrame(frame);
            } else {
                recorder.stop(() => {
                    exportAudio?.close();
                    setPageVideoExporting(false);
                    showToast('Video exported!', 'success');
                    resolve(true);
                });
            }
        };
        requestAnimationFrame(frame);
    });
}

/**
 * Offline, page-scoped animated-GIF export (gifenc): samples the page at `fps`
 * for `seconds` in real time (stick figures pose from the live clock, so
 * frames must be captured as time actually passes), quantizes each frame to
 * 256 colours, and downloads an infinitely-looping GIF. Long side capped at
 * 960 — GIFs get enormous beyond that.
 */
/**
 * The per-frame delay a GIF at `fps` actually plays at. GIF stores delays in whole
 * centiseconds, so 24 fps (41.7 ms) is written as 40 ms: frames sampled at 1000 / fps would
 * play back faster than they were captured, and the animation drifts ahead of real time.
 */
export const gifFrameDelayMs = (fps: number): number => Math.max(2, Math.round(100 / fps)) * 10;

export async function exportPageGif(opts: { seconds?: number; fps?: number; name?: string } = {}): Promise<boolean> {
    // Animation docs default to one full timeline pass at the timeline's rate.
    const tl = store.docType === 'animation' ? store.animTimeline : null;
    const seconds = Math.max(1, Math.min(30, opts.seconds ?? (tl ? animPassSeconds(tl) : 5)));
    const fps = Math.max(5, Math.min(30, opts.fps ?? (tl ? tl.fps : 12)));
    if (pageVideoExporting()) { showToast('A video export is already running', 'info'); return false; }
    const fr = makePageFrameRenderer(960, true);
    if (!fr) { showToast('GIF export needs a page/slide document', 'error'); return false; }
    if (store.tinyflyClips.length > 0) await ensureTinyflyEngine(); // clips render nothing until it has loaded

    const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
    setPageVideoExporting(true);
    showToast(`Exporting ${seconds}s GIF of this ${store.docType === 'design' ? 'page' : 'slide'}…`, 'info');

    const gif = GIFEncoder();
    const delay = gifFrameDelayMs(fps);
    const t0 = performance.now();
    const tAnim0 = effectiveTime();
    let nextT = 0;
    let first = true;

    return await new Promise<boolean>((resolve) => {
        const frame = () => {
            const elapsed = performance.now() - t0;
            if (elapsed >= nextT) {
                // Drawn at the frame's own slot, not at whenever requestAnimationFrame fired:
                // each frame shows exactly `delay` ms more of the scene, which is what the
                // viewer plays it for.
                fr.draw(tAnim0 + nextT);
                const { data } = fr.ctx.getImageData(0, 0, fr.off.width, fr.off.height);
                const palette = quantize(data, 256);
                const index = applyPalette(data, palette);
                // repeat: 0 on the first frame writes the loop block → loops forever.
                gif.writeFrame(index, fr.off.width, fr.off.height, { palette, delay, repeat: first ? 0 : undefined });
                first = false;
                nextT += delay;
            }
            if (elapsed < seconds * 1000) {
                requestAnimationFrame(frame);
            } else {
                gif.finish();
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                downloadBlob(new Blob([gif.bytesView() as BlobPart], { type: 'image/gif' }), `${opts.name ?? 'yappy-animation'}-${timestamp}.gif`);
                setPageVideoExporting(false);
                showToast('GIF exported!', 'success');
                resolve(true);
            }
        };
        requestAnimationFrame(frame);
    });
}

/**
 * Sets up recording effects and thumbnail capture within the calling component's reactive scope.
 * Must be called from within a SolidJS component function.
 */
export function setupRecording(getCanvasRef: () => HTMLCanvasElement | undefined): {
    handleStopRecording: () => void;
} {
    let videoRecorder: VideoRecorder | null = null;

    // Publish the on-screen canvas so the live GIF capture can sample it without
    // reaching into the DOM for whichever <canvas> happens to be first. The
    // getter is stored rather than the element: the ref isn't assigned yet when
    // setup runs, and it is not reactive, so reading it lazily is the only way
    // to be sure of getting the mounted canvas.
    getLiveCanvas = getCanvasRef;

    // Effect: respond to requestRecording signal (start OR stop)
    createEffect(() => {
        const req = requestRecording();
        if (!req) return;
        if (req.start) handleStartRecording(req.format || 'webm');
        else handleStopRecording();
        setRequestRecording(null);
    });

    // ─── Thumbnail Capture ──────────────────────────────────────────────

    const captureThumbnail = (index: number = store.activeSlideIndex) => {
        const canvasRef = getCanvasRef();
        if (!canvasRef) return;

        const slide = store.slides[index];
        if (!slide) return;

        const { width: sW, height: sH } = slide.dimensions;
        const { x: spatialX, y: spatialY } = slide.spatialPosition;
        if (sW === 0 || sH === 0) return;

        // Create a temp canvas for the thumbnail
        const thumbCanvas = document.createElement('canvas');
        const thumbW = 320; // 16:9 ratio (ish)
        const thumbH = (thumbW * sH) / sW;
        thumbCanvas.width = thumbW;
        thumbCanvas.height = thumbH;
        const tCtx = thumbCanvas.getContext('2d');
        if (!tCtx) return;

        // We want to render the current slide at the thumbnail scale
        const thumbScale = thumbW / sW;

        tCtx.save();
        tCtx.scale(thumbScale, thumbScale);
        tCtx.translate(-spatialX, -spatialY); // Focus on the slide's spatial area

        // Background
        const isDarkMode = store.theme !== 'light';
        const rc = rough.canvas(thumbCanvas);
        renderSlideBackground(tCtx!, rc, slide, spatialX, spatialY, sW, sH, store.theme);

        // Everything below is the page's own artwork, so it stops at the paper — same
        // as the canvas and the exporters. Without this the thumbnail drew the WHOLE
        // element list at every page, so one shape overhanging page 1 appeared on
        // page 2's thumbnail as well and the page strip showed content nobody put there.
        tCtx.beginPath();
        tCtx.rect(spatialX, spatialY, sW, sH);
        tCtx.clip();

        // Render elements
        const sortedLayers = [...store.layers].sort((a, b) => a.order - b.order);

        sortedLayers.forEach(layer => {
            if (!isLayerVisible(layer.id)) return;
            // Same gate as the exporters: the thumbnail previews the page as it will export.
            const layerElements = store.elements.filter(el => el.layerId === layer.id && isExportable(el));
            layerElements.forEach(el => {
                let renderEl = el;
                // Project master layer elements to the active slide's spatial position
                if (layer.isMaster && slide) {
                    const projected = projectMasterPosition(el, slide, store.slides);
                    renderEl = { ...el, x: projected.x, y: projected.y };
                } else if (ownerSlideIndex(el, store.slides) !== index) {
                    return; // belongs to another page (or to none)
                }
                const layerOpacity = (layer?.opacity ?? 1);
                renderElement(rc, tCtx, renderEl, isDarkMode, layerOpacity);
            });
        });

        tCtx.restore();

        const dataUrl = thumbCanvas.toDataURL('image/jpeg', 0.6);
        updateSlideThumbnail(index, dataUrl);
    };

    // Trigger thumbnail capture on slide change or debounced document changes.
    // Refreshes the active page, then backfills any pages that have no
    // thumbnail yet (loaded/added pages show a live preview without being
    // visited first).
    let thumbTimeout: any;
    createEffect(() => {
        // Track slide navigation, structure changes, and edits (dirtyRevision
        // bumps on move/recolor/etc., which elements.length alone misses)
        store.activeSlideIndex;
        store.elements.length;
        store.slides.length;
        store.dirtyRevision;

        window.clearTimeout(thumbTimeout);
        thumbTimeout = window.setTimeout(() => {
            untrack(() => {
                captureThumbnail();
                store.slides.forEach((s, i) => {
                    if (!s.thumbnail && i !== store.activeSlideIndex) captureThumbnail(i);
                });
            });
        }, 1000); // 1s throttle for thumbnails
    });

    // ─── Recording Start/Stop ───────────────────────────────────────────

    const handleStartRecording = (format: 'webm' | 'mp4') => {
        const canvasRef = getCanvasRef();
        if (!canvasRef) {
            console.error('[DEBUG] Canvas: No canvasRef available');
            return;
        }

        if (!videoRecorder) {
            console.log('[DEBUG] Canvas: Initializing VideoRecorder');
            videoRecorder = new VideoRecorder(canvasRef);
        }

        console.log('[DEBUG] Canvas: Starting recorder...');
        const started = videoRecorder.start(format);
        console.log('[DEBUG] Canvas: Recorder start returned:', started);

        if (started) {
            setStore("isRecording", true);
            showToast("Recording started...", "info");
        } else {
            showToast("Failed to start recording", "error");
        }
    };

    const handleStopRecording = () => {
        if (videoRecorder) {
            videoRecorder.stop(() => {
                setStore("isRecording", false);
                showToast("Recording saved!", "success");
            });
        }
    };

    return { handleStopRecording };
}
