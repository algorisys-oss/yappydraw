/**
 * Recording Manager
 * Handles video recording, thumbnail capture, and recording lifecycle.
 * Extracted from canvas.tsx.
 */

import { createSignal, createEffect, untrack } from "solid-js";
import { store, setStore, isLayerVisible, updateSlideThumbnail } from "../store/app-store";
import { VideoRecorder, type VideoFormat } from "./video-recorder";
import { showToast } from "../components/toast";
import rough from 'roughjs';
import { renderSlideBackground } from "./canvas-renderer";
import { renderElement } from "./render-element";
import { projectMasterPosition } from "./slide-utils";
import { calculateAllAnimatedStates } from "./animation-utils";
import { applyCompositionOverrides } from "./animation/composition-evaluator";
import { evaluateTimelineAt, evaluateCameraAt } from "./animation/frame-timeline-evaluator";
import { playbackRange } from "./animation/frame-timeline-ops";
import type { AnimTimeline } from "../types/anim-types";

/** Seconds of one pass over the exported frame range. */
const animPassSeconds = (tl: AnimTimeline): number => {
    const [lo, hi] = playbackRange(tl);
    return (hi - lo + 1) / tl.fps;
};
import { effectiveTime } from "./animation/animation-engine";
import { worldToScreen } from "./viewport-transforms";
import { isPagedDocType } from "../types/slide-types";

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
    const delay = Math.round(1000 / fps);
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

/** Offscreen page renderer shared by the video and GIF exports: a hidden
 *  canvas sized to the active page (long side capped at `maxSide`) plus a
 *  `draw(tMs)` that renders the page exactly as the live canvas would at
 *  animation-time `tMs` (background, layers, master projection, animated +
 *  composition overrides). */
function makePageFrameRenderer(maxSide: number, forGif = false) {
    const slide = store.slides[store.activeSlideIndex];
    if (!slide) return null;
    const { width: sW, height: sH } = slide.dimensions;
    const { x: spatialX, y: spatialY } = slide.spatialPosition;
    if (!sW || !sH) return null;

    const k = Math.min(1, maxSide / Math.max(sW, sH));
    const off = document.createElement('canvas');
    off.width = Math.round(sW * k);
    off.height = Math.round(sH * k);
    const ctx = off.getContext('2d', forGif ? { willReadFrequently: true } : undefined);
    if (!ctx) return null;
    const rc = rough.canvas(off);
    const isDark = store.resolvedTheme === 'dark' || store.resolvedTheme === 'focus';

    let baseT: number | null = null; // first draw() call = export time zero
    const draw = (tMs: number) => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, off.width, off.height);
        ctx.save();
        ctx.scale(k, k);
        ctx.translate(-spatialX, -spatialY);
        renderSlideBackground(ctx, rc, slide, spatialX, spatialY, sW, sH, store.theme);

        const anim = calculateAllAnimatedStates(store.elements, tMs, true);
        if (store.compositionTracks.length > 0 || store.elements.some(e => e.transformParentId)) {
            applyCompositionOverrides(anim, store.elements, tMs / 1000, store.compositionTracks);
        }

        // Animation mode: quantize elapsed export time to the timeline's fps and
        // resolve that frame's cel + tween poses. Driving the store playhead too
        // keeps nested movie-clip rendering (which reads it) frame-exact.
        let animVisible: Set<string> | null = null;
        if (baseT === null) baseT = tMs;
        if (store.docType === 'animation' && store.animTimeline) {
            const tl = store.animTimeline;
            // Export covers the marked in/out range (the whole ruler when none).
            const [lo, hi] = playbackRange(tl);
            const f = lo + (Math.floor(((tMs - baseT) / 1000) * tl.fps) % (hi - lo + 1));
            if (store.animCurrentFrame !== f) setStore('animCurrentFrame', f);
            const ev = evaluateTimelineAt(f, tl, store.elements);
            animVisible = ev.visible;
            for (const id in ev.overrides) {
                const existing = anim.get(id);
                if (existing) Object.assign(existing, ev.overrides[id]);
                else anim.set(id, { ...ev.overrides[id] } as any);
            }
            // Camera layer: zoom/pan the stage content in the exported frames too.
            const cam = tl.camera?.length ? evaluateCameraAt(f, tl) : null;
            if (cam) {
                ctx.translate(spatialX + sW / 2, spatialY + sH / 2);
                ctx.scale(cam.zoom, cam.zoom);
                ctx.translate(-(spatialX + cam.x), -(spatialY + cam.y));
            }
        }

        const sortedLayers = [...store.layers].sort((a, b) => a.order - b.order);
        const margin = 200; // cheap page-overlap cull (post-override AABB)
        sortedLayers.forEach(layer => {
            if (!isLayerVisible(layer.id)) return;
            const layerOpacity = layer?.opacity ?? 1;
            store.elements.filter(el => el.layerId === layer.id).forEach(el => {
                if (animVisible && !animVisible.has(el.id)) return;
                let renderEl = el;
                if (layer.isMaster) {
                    const projected = projectMasterPosition(el, slide, store.slides);
                    renderEl = { ...el, x: projected.x, y: projected.y };
                }
                const ov = anim.get(el.id);
                if (ov) renderEl = { ...renderEl, ...ov };
                if (renderEl.x + renderEl.width < spatialX - margin || renderEl.x > spatialX + sW + margin ||
                    renderEl.y + renderEl.height < spatialY - margin || renderEl.y > spatialY + sH + margin) return;
                renderElement(rc, ctx, renderEl, isDark, layerOpacity);
            });
        });
        ctx.restore();
    };

    return { off, ctx, draw };
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
export async function exportPageGif(opts: { seconds?: number; fps?: number; name?: string } = {}): Promise<boolean> {
    // Animation docs default to one full timeline pass at the timeline's rate.
    const tl = store.docType === 'animation' ? store.animTimeline : null;
    const seconds = Math.max(1, Math.min(30, opts.seconds ?? (tl ? animPassSeconds(tl) : 5)));
    const fps = Math.max(5, Math.min(30, opts.fps ?? (tl ? tl.fps : 12)));
    if (pageVideoExporting()) { showToast('A video export is already running', 'info'); return false; }
    const fr = makePageFrameRenderer(960, true);
    if (!fr) { showToast('GIF export needs a page/slide document', 'error'); return false; }

    const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
    setPageVideoExporting(true);
    showToast(`Exporting ${seconds}s GIF of this ${store.docType === 'design' ? 'page' : 'slide'}…`, 'info');

    const gif = GIFEncoder();
    const delay = Math.round(1000 / fps);
    const t0 = performance.now();
    const tAnim0 = effectiveTime();
    let nextT = 0;
    let first = true;

    return await new Promise<boolean>((resolve) => {
        const frame = () => {
            const elapsed = performance.now() - t0;
            if (elapsed >= nextT) {
                fr.draw(tAnim0 + elapsed);
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

        // Render elements
        const sortedLayers = [...store.layers].sort((a, b) => a.order - b.order);

        sortedLayers.forEach(layer => {
            if (!isLayerVisible(layer.id)) return;
            const layerElements = store.elements.filter(el => el.layerId === layer.id);
            layerElements.forEach(el => {
                let renderEl = el;
                // Project master layer elements to the active slide's spatial position
                if (layer.isMaster && slide) {
                    const projected = projectMasterPosition(el, slide, store.slides);
                    renderEl = { ...el, x: projected.x, y: projected.y };
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
