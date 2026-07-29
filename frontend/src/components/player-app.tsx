import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { isPagedDocType } from '../types/slide-types';
import type { Component } from "solid-js";
import Canvas from "./canvas";
import { loadDocument, setStore, store, zoomToFit, advancePresentation, retreatPresentation, setActiveSlide } from "../store/app-store";
import { setPanelOpen } from "../store/dock-layout";
import { registerShapes } from "../shapes/register-shapes";
import { PresentationControls } from "./presentation-controls";
import type { SlideDocument } from "../types/slide-types";
import { showToast } from "./toast";
import { slideBuildManager } from "../utils/animation/slide-build-manager";
import { playAnimation, pauseAnimation, stopAnimation } from "../utils/animation/anim-playback";
import { startGame } from "../game/game-runtime";
import GameOverlay from "./game-overlay";
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
                setPanelOpen('properties', false);
                setStore("showLayerPanel", false);
                setStore("showSlideNavigator", false); // Hidden by default in player
                setStore("showSlideToolbar", true); // Show controls
                setStore("readOnly", false); // Allow Ink tool interactions

                // FIX: Ensure we start at Slide 0 and load its elements
                if (isPagedDocType(store.docType) && store.slides.length > 0) {
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

                // Trigger first-slide animations after Canvas fully mounts
                // Need sufficient delay for SolidJS to render <Show> → Canvas → onMount chain
                setTimeout(() => {
                    if (store.docType === 'animation' && store.animTimeline) {
                        // Animation documents auto-play their frame timeline, looping.
                        setStore('animLoop', true);
                        playAnimation();
                    } else if (isPagedDocType(store.docType) && store.slides.length > 0) {
                        slideBuildManager.init(store.activeSlideIndex);
                        slideBuildManager.playInitial();
                    } else {
                        // Infinite canvas: the doc carries no viewport, so pan 0,0
                        // may show nothing — frame the actual content on open.
                        zoomToFit();
                    }
                }, 300);
            } catch (e) {
                console.error("Failed to load presentation data:", e);
                showToast("Failed to load presentation data", "error");
            }
        } else {
            showToast("No presentation data found", "error");
        }

        // Keyboard navigation — the main app's hotkey handler (app.tsx) isn't
        // mounted in the player, so bind the presentation keys here. Skipped
        // while a game runs (the game runtime owns the arrows/space) and while
        // typing in a field.
        const onKey = (e: KeyboardEvent) => {
            if (store.gameActive) return;
            const t = e.target as HTMLElement;
            if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
                e.preventDefault();
                advancePresentation();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
                e.preventDefault();
                retreatPresentation();
            } else if (e.key === 'Home' && isPagedDocType(store.docType)) {
                e.preventDefault();
                setActiveSlide(0);
            } else if (e.key === 'End' && isPagedDocType(store.docType)) {
                e.preventDefault();
                setActiveSlide(Math.max(0, store.slides.length - 1));
            }
        };
        window.addEventListener('keydown', onKey);
        onCleanup(() => window.removeEventListener('keydown', onKey));
    });

    return (
        <div class="player-app">
            <Show when={isReady()}>
                <div class="canvas-container">
                    <Canvas />
                </div>

                {/* Animation documents: a minimal transport instead of slide navigation */}
                <Show when={store.docType === 'animation'} fallback={
                    <Show when={!store.gameActive}>
                        <div class="player-controls">
                            <PresentationControls />
                        </div>
                    </Show>
                }>
                    <div class="player-anim-controls">
                        <button title="Restart" onClick={() => { stopAnimation(); playAnimation(); }}>⏮</button>
                        <button title={store.animPlaying ? 'Pause' : 'Play'}
                            onClick={() => (store.animPlaying ? pauseAnimation() : playAnimation())}>
                            {store.animPlaying ? '❚❚' : '▶'}
                        </button>
                    </div>
                </Show>

                {/* Arcade: documents with a game script get a big Play button */}
                <Show when={store.gameScript?.trim() && !store.gameActive}>
                    <button class="player-play-game" onClick={() => startGame()}>
                        ▶ Play Game
                    </button>
                </Show>
                <GameOverlay />
            </Show>

            <Toast />
        </div>
    );
};

export default PlayerApp;
