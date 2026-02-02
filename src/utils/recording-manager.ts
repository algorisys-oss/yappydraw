/**
 * Recording Manager
 * Handles video recording, thumbnail capture, and recording lifecycle.
 * Extracted from canvas.tsx.
 */

import { createSignal, createEffect, untrack } from "solid-js";
import { store, setStore, isLayerVisible, updateSlideThumbnail } from "../store/app-store";
import { VideoRecorder } from "./video-recorder";
import { showToast } from "../components/toast";
import rough from 'roughjs';
import { renderSlideBackground } from "./canvas-renderer";
import { renderElement } from "./render-element";
import { projectMasterPosition } from "./slide-utils";

// Export controls for Menu/Dialog access
export const [requestRecording, setRequestRecording] = createSignal<{ start: boolean, format?: 'webm' | 'mp4' } | null>(null);

/**
 * Sets up recording effects and thumbnail capture within the calling component's reactive scope.
 * Must be called from within a SolidJS component function.
 */
export function setupRecording(getCanvasRef: () => HTMLCanvasElement | undefined): {
    handleStopRecording: () => void;
} {
    let videoRecorder: VideoRecorder | null = null;

    // Effect: respond to requestRecording signal
    createEffect(() => {
        const req = requestRecording();
        if (req && req.start) {
            handleStartRecording(req.format || 'webm');
            setRequestRecording(null);
        }
    });

    // ─── Thumbnail Capture ──────────────────────────────────────────────

    const captureThumbnail = () => {
        const canvasRef = getCanvasRef();
        if (!canvasRef) return;

        const slide = store.slides[store.activeSlideIndex];
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
        const isDarkMode = store.theme === 'dark';
        const rc = rough.canvas(thumbCanvas);
        renderSlideBackground(tCtx!, rc, slide, spatialX, spatialY, sW, sH, isDarkMode);

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
        updateSlideThumbnail(store.activeSlideIndex, dataUrl);
    };

    // Trigger thumbnail capture on slide change or debounced element changes
    let thumbTimeout: any;
    createEffect(() => {
        // Track slide index and element count/versions (implicitly)
        store.activeSlideIndex;
        store.elements;

        window.clearTimeout(thumbTimeout);
        thumbTimeout = window.setTimeout(() => {
            untrack(() => captureThumbnail());
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
