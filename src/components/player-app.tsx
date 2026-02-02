import { createSignal, onMount, Show } from "solid-js";
import type { Component } from "solid-js";
import Canvas from "./canvas";
import { loadDocument, setStore, store } from "../store/app-store";
import { registerShapes } from "../shapes/register-shapes";
import { PresentationControls } from "./presentation-controls";
import type { SlideDocument } from "../types/slide-types";
import { showToast } from "./toast";
import Toast from "./toast";
import "./player-app.css";

// Declare global variable for injected data
declare global {
    interface Window {
        __PRESENTATION_DATA__: SlideDocument;
    }
}

const PlayerApp: Component = () => {
    const [isReady, setIsReady] = createSignal(false);

    onMount(() => {
        // Ensure shapes are registered for rendering
        registerShapes();

        // Load data from injected global variable
        if (window.__PRESENTATION_DATA__) {
            try {
                // Initialize store with document data
                loadDocument(window.__PRESENTATION_DATA__);

                // Force presentation mode settings
                setStore("appMode", "presentation");
                setStore("showMainToolbar", false);
                setStore("showPropertyPanel", false);
                setStore("showLayerPanel", false);
                setStore("showSlideNavigator", false); // Hidden by default in player
                setStore("showSlideToolbar", true); // Show controls
                setStore("readOnly", false); // Allow Ink tool interactions

                // FIX: Ensure we start at Slide 0 and load its elements
                if (store.docType === 'slides' && store.slides.length > 0) {
                    setStore("activeSlideIndex", 0);
                    const firstSlide = store.slides[0];
                    setStore("viewState", {
                        scale: 1,
                        panX: -firstSlide.spatialPosition.x,
                        panY: -firstSlide.spatialPosition.y
                    });

                    // Debug / Validation: Ensure layers exist
                    let activeLayerId = store.activeLayerId;
                    if (store.layers.length === 0) {
                        const defaultLayer = { id: 'default', name: 'Layer 1', visible: true, locked: false, opacity: 1, order: 0, backgroundColor: 'transparent' };
                        setStore("layers", [defaultLayer]);
                        activeLayerId = 'default';
                        setStore("activeLayerId", 'default');
                    } else {
                        if (!store.layers.find(l => l.id === activeLayerId)) {
                            activeLayerId = store.layers[0].id;
                            setStore("activeLayerId", activeLayerId);
                        }
                    }

                    // Fix orphaned elements
                    setStore("elements", (_el) => {
                        return !store.layers.some(l => l.id === _el.layerId);
                    }, (_el) => ({ layerId: activeLayerId }));

                    // Force all layers visible
                    setStore("layers", (_l) => true, { visible: true, opacity: 1 });
                }

                setIsReady(true);
            } catch (e) {
                console.error("Failed to load presentation data:", e);
                showToast("Failed to load presentation data", "error");
            }
        } else {
            showToast("No presentation data found", "error");
        }
    });

    return (
        <div class="player-app">
            <Show when={isReady()}>
                <div class="canvas-container">
                    <Canvas />
                </div>

                {/* Presentation Controls Overlay */}
                <div class="player-controls">
                    <PresentationControls />
                </div>
            </Show>

            <Toast />
        </div>
    );
};

export default PlayerApp;
