import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { isPagedDocType } from '../types/slide-types';
import type { Component } from "solid-js";
import Canvas from "./canvas";
import { loadDocument, setStore, store, zoomToFit, zoomToFitSlide, setCanvasBackgroundColor } from "../store/app-store";
import { setPanelOpen } from "../store/dock-layout";
import { registerShapes } from "../shapes/register-shapes";
import { storage } from "../storage/file-system-storage";
import { isSlideDocument, migrateToSlideFormat } from "../utils/migration";
import Toast from "./toast";
import "./embed-viewer.css";

interface EmbedOptions {
    docId: string;
    theme?: 'light' | 'dark';
    background?: string;
    slide?: number;
    hideWatermark?: boolean;
}

function parseEmbedOptions(hash: string): EmbedOptions {
    const embedMatch = hash.match(/#\/embed\/([^?]+)/);
    const docId = embedMatch ? decodeURIComponent(embedMatch[1]) : '';

    const qIndex = hash.indexOf('?');
    const params = new URLSearchParams(qIndex >= 0 ? hash.substring(qIndex + 1) : '');

    return {
        docId,
        theme: (params.get('theme') as 'light' | 'dark') || undefined,
        background: params.get('bg') || params.get('background') || undefined,
        slide: params.has('slide') ? parseInt(params.get('slide')!, 10) : undefined,
        hideWatermark: params.get('watermark') === 'false',
    };
}

const EmbedViewer: Component = () => {
    const [isReady, setIsReady] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    const options = parseEmbedOptions(window.location.hash);

    const fitToView = () => {
        if (isPagedDocType(store.docType)) {
            zoomToFitSlide();
        } else {
            zoomToFit();
        }
    };

    onMount(async () => {
        registerShapes();

        if (!options.docId) {
            setError("No document ID specified");
            return;
        }

        try {
            // Try static file first (works without backend)
            let data = null;
            const jsonName = options.docId.replace(/\.yappy$/, '.json');
            const basePath = import.meta.env.BASE_URL || '/';
            const exampleUrl = `${basePath}examples/${jsonName}`.replace('//', '/');
            try {
                const response = await fetch(exampleUrl);
                if (response.ok) data = await response.json();
            } catch { /* not a static example */ }

            // Fall back to API
            if (!data) {
                const drawingId = options.docId.replace(/\.(json|yappy)$/i, '');
                data = await storage.loadDrawing(drawingId);
            }

            if (!data) {
                setError("Drawing not found");
                return;
            }

            const doc = isSlideDocument(data) ? data : migrateToSlideFormat(data);
            loadDocument(doc);

            // Force embed mode settings
            setStore("appMode", "embed");
            setStore("readOnly", true);
            setStore("showMainToolbar", false);
            setPanelOpen('properties', false);
            setStore("showLayerPanel", false);
            setStore("showSlideNavigator", false);
            setStore("showSlideToolbar", false);
            setStore("showUtilityToolbar", false);
            setStore("showCanvasToolbar", false);
            setStore("minimapVisible", false);
            setStore("welcomeDismissed", true);
            setStore("selection", []);

            // Apply theme override
            if (options.theme) {
                document.documentElement.setAttribute('data-theme', options.theme);
            }

            // Apply background override
            if (options.background) {
                setCanvasBackgroundColor(options.background);
            }

            // Navigate to specific slide
            if (options.slide && isPagedDocType(store.docType) && store.slides.length > 0) {
                const slideIndex = Math.max(0, Math.min(options.slide - 1, store.slides.length - 1));
                setStore("activeSlideIndex", slideIndex);
            }

            // Zoom to fit after canvas has measured
            setTimeout(fitToView, 150);

            setIsReady(true);
        } catch (err) {
            console.error("Failed to load embedded drawing:", err);
            setError("Failed to load drawing");
        }
    });

    // Re-fit on window resize (iframe container may change)
    const handleResize = () => {
        if (isReady()) fitToView();
    };
    window.addEventListener('resize', handleResize);
    onCleanup(() => window.removeEventListener('resize', handleResize));

    const openUrl = () => {
        return `${window.location.origin}${window.location.pathname}#load=${encodeURIComponent(options.docId)}`;
    };

    return (
        <div class="embed-viewer">
            <Show when={error()}>
                <div class="embed-error">
                    <p>{error()}</p>
                </div>
            </Show>

            <Show when={!error() && !isReady()}>
                <div class="embed-loading">
                    <div class="embed-spinner" />
                    <p>Loading drawing...</p>
                </div>
            </Show>

            <Show when={isReady()}>
                <div class="embed-canvas-container">
                    <Canvas />
                </div>

                <Show when={!options.hideWatermark}>
                    <a
                        class="embed-watermark"
                        href={openUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open in Yappy
                    </a>
                </Show>
            </Show>

            <Toast />
        </div>
    );
};

export default EmbedViewer;
