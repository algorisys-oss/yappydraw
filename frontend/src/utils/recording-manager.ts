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
import { effectiveTime } from "./animation/animation-engine";

// Export controls for Menu/Dialog access
export const [requestRecording, setRequestRecording] = createSignal<{ start: boolean, format?: 'webm' | 'mp4' } | null>(null);

// True while an offline page-video export runs — the canvas force-ticker
// predicate includes this so the animation clock keeps advancing even when
// nothing on the live canvas would otherwise need it.
export const [pageVideoExporting, setPageVideoExporting] = createSignal(false);

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

        const sortedLayers = [...store.layers].sort((a, b) => a.order - b.order);
        const margin = 200; // cheap page-overlap cull (post-override AABB)
        sortedLayers.forEach(layer => {
            if (!isLayerVisible(layer.id)) return;
            const layerOpacity = layer?.opacity ?? 1;
            store.elements.filter(el => el.layerId === layer.id).forEach(el => {
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
    const seconds = Math.max(1, Math.min(120, opts.seconds ?? 5));
    const format = opts.format ?? 'mp4';
    if (pageVideoExporting()) { showToast('A video export is already running', 'info'); return false; }
    const fr = makePageFrameRenderer(1920);
    if (!fr) { showToast('Video export needs a page/slide document', 'error'); return false; }

    const recorder = new VideoRecorder(fr.off, opts.name ?? 'yappy-animation');
    if (!recorder.start(format)) { showToast('Failed to start video export', 'error'); return false; }
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
    const seconds = Math.max(1, Math.min(30, opts.seconds ?? 5));
    const fps = Math.max(5, Math.min(30, opts.fps ?? 12));
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
