/**
 * Time-lapse Manager — Procreate-style process recording.
 *
 * While recording is on, captures ONE downscaled frame per committed edit and
 * persists it to IndexedDB (see storage/timelapse-store.ts). Capture is driven
 * by a single debounced reactive watcher on the history/commit counters, so no
 * draw/selection handler needs to change (docs/timelapse-spec.md §2).
 *
 * This is phase 1: capture + persistence only. Playback overlay and video
 * export are later phases.
 */

import { createSignal, createEffect, untrack, onCleanup } from "solid-js";
import { store, setStore, isLayerVisible } from "../store/app-store";
import { drawingId } from "../components/menu";
import { showToast } from "../components/toast";
import { features } from "../config/features";
import rough from 'roughjs';
import { renderSlideBackground } from "./canvas-renderer";
import { renderElement } from "./render-element";
import { projectMasterPosition } from "./slide-utils";
import {
    putFrame,
    getFrame,
    getManifest,
    saveManifest,
    deleteFrame,
    type TimelapseManifest,
} from "../storage/timelapse-store";
import { VideoRecorder, type VideoFormat } from "./video-recorder";

// External control signal (parallels recording-manager's requestRecording).
export const [requestTimelapse, setRequestTimelapse] =
    createSignal<{ action: 'start' | 'stop' | 'toggle' } | null>(null);

/** Convenience for menu/hotkey wiring. */
export const toggleTimelapse = () => setRequestTimelapse({ action: 'toggle' });

// Player overlay visibility (the player component reads this; menu/hotkey set it).
export const [timelapsePlayerOpen, setTimelapsePlayerOpen] = createSignal(false);

// Defaults (will be overridable via GlobalSettings in the settings phase).
const DEFAULT_CAPTURE_WIDTH = 1024;   // longest-edge target for captured frames
const CAPTURE_DEBOUNCE_MS = 250;      // trailing edge — coalesces down+up of a stroke
const MAX_FRAMES = 5000;              // per-recording cap; oldest evicted past this
const WEBP_QUALITY = 0.7;

function newRecordingId(): string {
    // App code (unlike Workflow scripts) may use Date.now()/Math.random().
    return `tl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function toBlobAsync(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
    return new Promise(resolve => canvas.toBlob(b => resolve(b), type, quality));
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/**
 * Render a recording's frames to an offscreen canvas at the configured target
 * duration and capture it through the existing VideoRecorder (export path A in
 * docs/timelapse-spec.md §7). The file auto-downloads via VideoRecorder.
 * Returns false if there's nothing to export.
 */
export async function exportTimelapse(
    format: VideoFormat = 'webm',
    onProgress?: (done: number, total: number) => void,
): Promise<boolean> {
    const id = store.activeTimelapseId;
    if (!id) return false;
    const manifest = await getManifest(id);
    if (!manifest || manifest.frames.length === 0) return false;

    // Decode all frames up front (ordered by seq, as stored).
    const bitmaps: ImageBitmap[] = [];
    for (const f of manifest.frames) {
        const blob = await getFrame(f.blobKey);
        if (blob) bitmaps.push(await createImageBitmap(blob));
    }
    if (bitmaps.length === 0) return false;

    const w = bitmaps[0].width;
    const h = bitmaps[0].height;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) { bitmaps.forEach(b => b.close()); return false; }

    // Seed the first frame before the stream starts so frame 0 isn't dropped.
    ctx.drawImage(bitmaps[0], 0, 0);

    const recorder = new VideoRecorder(canvas);
    if (!recorder.start(format)) { bitmaps.forEach(b => b.close()); return false; }

    const targetSec = store.globalSettings.timelapseTargetDuration || 30;
    const holdMs = Math.max(1000 / 30, (targetSec * 1000) / bitmaps.length);

    try {
        for (let i = 0; i < bitmaps.length; i++) {
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(bitmaps[i], 0, 0);
            onProgress?.(i + 1, bitmaps.length);
            await sleep(holdMs);
        }
        await sleep(300); // hold the final frame so it's captured
    } finally {
        await new Promise<void>(resolve => recorder.stop(() => resolve()));
        bitmaps.forEach(b => b.close());
    }
    return true;
}

/**
 * Render the active slide's current document state to an offscreen canvas at a
 * fixed capture resolution. Mirrors recording-manager.captureThumbnail so frames
 * honour layer visibility, master-layer projection and theme identically, in
 * both sketch and architectural styles.
 */
function renderFrame(targetW: number): HTMLCanvasElement | null {
    const slide = store.slides[store.activeSlideIndex];
    if (!slide) return null;

    const { width: sW, height: sH } = slide.dimensions;
    const { x: spatialX, y: spatialY } = slide.spatialPosition;
    if (sW === 0 || sH === 0) return null;

    const canvas = document.createElement('canvas');
    const scale = targetW / sW;
    canvas.width = Math.round(targetW);
    canvas.height = Math.round(targetW * sH / sW);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-spatialX, -spatialY);

    const isDarkMode = store.theme !== 'light';
    const rc = rough.canvas(canvas);
    renderSlideBackground(ctx, rc, slide, spatialX, spatialY, sW, sH, store.theme);

    const sortedLayers = [...store.layers].sort((a, b) => a.order - b.order);
    sortedLayers.forEach(layer => {
        if (!isLayerVisible(layer.id)) return;
        const layerElements = store.elements.filter(el => el.layerId === layer.id);
        layerElements.forEach(el => {
            let renderEl = el;
            if (layer.isMaster && slide) {
                const projected = projectMasterPosition(el, slide, store.slides);
                renderEl = { ...el, x: projected.x, y: projected.y };
            }
            const layerOpacity = (layer?.opacity ?? 1);
            renderElement(rc, ctx, renderEl, isDarkMode, layerOpacity);
        });
    });

    ctx.restore();
    return canvas;
}

/**
 * Set up time-lapse capture within the calling component's reactive scope
 * (call from Canvas, alongside setupRecording).
 */
export function setupTimelapse(): void {
    let manifest: TimelapseManifest | null = null;
    let captureTimer: any = null;
    let capturing = false;          // re-entrancy guard for the async capture
    let pending = false;            // a commit arrived mid-capture → capture again
    let lastSig = '';               // cheap dedup signature of last captured state

    const captureWidth = () => store.globalSettings.timelapseCaptureWidth || DEFAULT_CAPTURE_WIDTH;

    const currentSig = () =>
        `${store.undoStackLength}:${store.elements.length}:${store.dirtyRevision}`;

    const start = async () => {
        if (manifest) return;
        if (!features.enableWorkspacePersistence) {
            showToast("Time-lapse needs local storage (disabled)", "error");
            return;
        }
        const now = Date.now();
        manifest = {
            id: newRecordingId(),
            docId: drawingId(),
            startedAt: now,
            updatedAt: now,
            captureW: captureWidth(),
            frames: [],
        };
        setStore("timelapseRecording", true);
        setStore("activeTimelapseId", manifest.id);
        setStore("timelapseFrameCount", 0);
        lastSig = '';
        showToast("Time-lapse recording started", "info");
        await captureFrame(); // seed frame so playback has a starting state
    };

    const stop = async () => {
        if (!manifest) return;
        // Flush any debounced capture first.
        if (captureTimer) { clearTimeout(captureTimer); captureTimer = null; }
        await captureFrame();
        const frameCount = manifest.frames.length;
        manifest = null;
        setStore("timelapseRecording", false);
        showToast(`Time-lapse saved (${frameCount} frame${frameCount === 1 ? '' : 's'})`, "success");
    };

    const captureFrame = async () => {
        if (!manifest) return;
        if (capturing) { pending = true; return; }

        const sig = untrack(currentSig);
        if (sig === lastSig) return; // nothing changed since last frame

        capturing = true;
        try {
            const canvas = untrack(() => renderFrame(manifest!.captureW));
            if (!canvas) return;
            const blob = await toBlobAsync(canvas, 'image/webp', WEBP_QUALITY);
            if (!blob || !manifest) return;

            const seq = manifest.frames.length;
            const blobKey = `${manifest.id}:${seq}`;
            await putFrame(blobKey, blob);
            manifest.frames.push({
                seq,
                t: Date.now() - manifest.startedAt,
                blobKey,
                w: canvas.width,
                h: canvas.height,
            });
            lastSig = sig;

            // Enforce the per-recording cap by evicting the oldest frame's blob.
            if (manifest.frames.length > MAX_FRAMES) {
                const evicted = manifest.frames.shift();
                if (evicted) deleteFrame(evicted.blobKey).catch(() => {});
            }

            manifest.updatedAt = Date.now();
            setStore("timelapseFrameCount", manifest.frames.length);
            await saveManifest(manifest);
        } catch (err) {
            console.error('[timelapse] capture failed', err);
        } finally {
            capturing = false;
            if (pending) { pending = false; scheduleCapture(); }
        }
    };

    const scheduleCapture = () => {
        if (captureTimer) clearTimeout(captureTimer);
        captureTimer = setTimeout(() => {
            captureTimer = null;
            untrack(() => { void captureFrame(); });
        }, CAPTURE_DEBOUNCE_MS);
    };

    // ─── Reactive triggers ──────────────────────────────────────────────────

    // Respond to external start/stop/toggle requests.
    createEffect(() => {
        const req = requestTimelapse();
        if (!req) return;
        setRequestTimelapse(null);
        const recording = untrack(() => store.timelapseRecording);
        if (req.action === 'start' || (req.action === 'toggle' && !recording)) void start();
        else if (req.action === 'stop' || (req.action === 'toggle' && recording)) void stop();
    });

    // Capture a frame whenever a commit lands (undo stack / element count / dirty
    // revision change). pushToHistory fires on pointer-DOWN, so the trailing-edge
    // debounce coalesces it with the pointer-up final geometry into one frame
    // showing the finished stroke.
    createEffect(() => {
        store.undoStackLength;
        store.elements.length;
        store.dirtyRevision;
        if (!untrack(() => store.timelapseRecording)) return;
        scheduleCapture();
    });

    // Auto-record: if the preference is on, begin a recording once the canvas is
    // ready to render the seed frame.
    if (untrack(() => store.globalSettings.timelapseAutoRecord)) {
        const autoStart = setTimeout(() => { void start(); }, 600);
        onCleanup(() => clearTimeout(autoStart));
    }

    onCleanup(() => {
        if (captureTimer) clearTimeout(captureTimer);
    });
}
