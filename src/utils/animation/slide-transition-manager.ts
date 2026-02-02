/**
 * Slide Transition Manager
 * Handles animated transitions between slides in presentation mode
 */

import { store, setViewState, setStore } from '../../store/app-store';
import { animationEngine, generateAnimationId } from './animation-engine';
import { lerp, getEasing } from './animation-types';
import type { Slide, SlideTransition } from '../../types/slide-types';
import { DEFAULT_SLIDE_TRANSITION } from '../../types/slide-types';

export interface TransitionContext {
    fromSlide: Slide;
    toSlide: Slide;
    fromIndex: number;
    toIndex: number;
    direction: 'forward' | 'backward';
}

export interface TransitionOptions {
    skipAnimation?: boolean;
}

/**
 * Calculate the viewState needed to center and fit a slide
 */
function calculateSlideViewState(slide: Slide): { scale: number; panX: number; panY: number } {
    const { width: sW, height: sH } = slide.dimensions;
    const { x: spatialX, y: spatialY } = slide.spatialPosition;
    const margin = 40;

    const availableW = window.innerWidth - margin * 2;
    const availableH = window.innerHeight - margin * 2;

    const scaleW = availableW / sW;
    const scaleH = availableH / sH;
    const scale = Math.min(scaleW, scaleH);

    const panX = (window.innerWidth - sW * scale) / 2 - spatialX * scale;
    const panY = (window.innerHeight - sH * scale) / 2 - spatialY * scale;

    return { scale, panX, panY };
}

class SlideTransitionManager {
    private activeAnimationId: string | null = null;
    private isTransitioning: boolean = false;
    private fadeOverlay: HTMLDivElement | null = null;

    /**
     * Check if a transition is currently in progress
     */
    get transitioning(): boolean {
        return this.isTransitioning;
    }

    /**
     * Transition from current slide to target slide
     */
    async transitionTo(targetIndex: number, options?: TransitionOptions): Promise<void> {
        // Validate target index
        if (targetIndex < 0 || targetIndex >= store.slides.length) {
            return;
        }

        // Already at target and not transitioning
        if (targetIndex === store.activeSlideIndex && !this.isTransitioning) {
            return;
        }

        // Cancel any running transition
        this.cancelActiveTransition();

        const fromIndex = store.activeSlideIndex;
        const fromSlide = store.slides[fromIndex];
        const toSlide = store.slides[targetIndex];

        // Get transition config from target slide (or default)
        const transition: SlideTransition = toSlide.transition || DEFAULT_SLIDE_TRANSITION;

        const direction = targetIndex > fromIndex ? 'forward' : 'backward';
        const context: TransitionContext = {
            fromSlide,
            toSlide,
            fromIndex,
            toIndex: targetIndex,
            direction
        };

        // Skip animation if requested, type is 'none', or animations disabled
        const shouldSkip = options?.skipAnimation ||
            transition.type === 'none' ||
            store.globalSettings?.animationEnabled === false ||
            store.globalSettings?.reducedMotion === true;

        if (shouldSkip) {
            this.applyImmediateSwitch(targetIndex);
            return;
        }

        this.isTransitioning = true;

        try {
            await this.executeTransition(context, transition);
        } finally {
            this.isTransitioning = false;
            this.activeAnimationId = null;
        }
    }

    /**
     * Immediately switch to a slide without animation
     */
    private applyImmediateSwitch(targetIndex: number): void {
        setStore("activeSlideIndex", targetIndex);
        const slide = store.slides[targetIndex];
        if (slide) {
            // Restore last view state if in design mode, otherwise calculate fresh fit
            const viewState = (store.appMode === 'design' && slide.lastViewState)
                ? slide.lastViewState
                : calculateSlideViewState(slide);
            setViewState(viewState);
        }
    }

    /**
     * Cancel any active transition
     */
    private cancelActiveTransition(): void {
        if (this.activeAnimationId) {
            animationEngine.stop(this.activeAnimationId);
            this.activeAnimationId = null;
        }
        this.removeFadeOverlay();
        this.isTransitioning = false;
    }

    /**
     * Execute the appropriate transition type
     */
    private async executeTransition(
        context: TransitionContext,
        transition: SlideTransition
    ): Promise<void> {
        switch (transition.type) {
            case 'fade':
                return this.executeFade(context, transition);
            case 'slide-left':
            case 'slide-right':
            case 'slide-up':
            case 'slide-down':
                return this.executeSlide(context, transition);
            case 'zoom-in':
            case 'zoom-out':
                return this.executeZoom(context, transition);
            default:
                this.applyImmediateSwitch(context.toIndex);
        }
    }

    /**
     * Fade transition - uses overlay that fades to background color
     */
    private executeFade(context: TransitionContext, transition: SlideTransition): Promise<void> {
        return new Promise((resolve) => {
            const halfDuration = transition.duration / 2;
            const bgColor = context.toSlide.backgroundColor || (store.theme === 'dark' ? '#121212' : '#ffffff');

            // Create fade overlay
            this.fadeOverlay = document.createElement('div');
            this.fadeOverlay.style.cssText = `
                position: fixed;
                inset: 0;
                z-index: 99999;
                background: ${bgColor};
                opacity: 0;
                pointer-events: none;
                transition: opacity ${halfDuration}ms ease-in-out;
            `;
            document.body.appendChild(this.fadeOverlay);

            // Fade in overlay
            requestAnimationFrame(() => {
                if (this.fadeOverlay) {
                    this.fadeOverlay.style.opacity = '1';
                }
            });

            // At midpoint: switch slide while hidden
            setTimeout(() => {
                this.applyImmediateSwitch(context.toIndex);

                // Fade out overlay
                if (this.fadeOverlay) {
                    this.fadeOverlay.style.opacity = '0';
                }

                // Cleanup after fade out
                setTimeout(() => {
                    this.removeFadeOverlay();
                    resolve();
                }, halfDuration);
            }, halfDuration);
        });
    }

    /**
     * Slide transition - new slide enters from a specific screen edge
     */
    private executeSlide(context: TransitionContext, transition: SlideTransition): Promise<void> {
        return new Promise((resolve) => {
            const targetView = calculateSlideViewState(context.toSlide);

            // Use full viewport dimensions so the slide clearly enters from one edge
            const screenW = window.innerWidth;
            const screenH = window.innerHeight;

            // Compute the starting pan offset based on direction.
            // slide-left: new content enters from right  → start shifted right, animate left
            // slide-right: new content enters from left  → start shifted left, animate right
            // slide-up: new content enters from bottom   → start shifted down, animate up
            // slide-down: new content enters from top    → start shifted up, animate down
            let offsetX = 0, offsetY = 0;
            switch (transition.type) {
                case 'slide-left':
                    offsetX = screenW;
                    break;
                case 'slide-right':
                    offsetX = -screenW;
                    break;
                case 'slide-up':
                    offsetY = screenH;
                    break;
                case 'slide-down':
                    offsetY = -screenH;
                    break;
            }

            // Reverse direction when going backward
            if (context.direction === 'backward') {
                offsetX = -offsetX;
                offsetY = -offsetY;
            }

            const startPanX = targetView.panX + offsetX;
            const startPanY = targetView.panY + offsetY;

            // Update active slide index immediately so elements render correctly
            setStore("activeSlideIndex", context.toIndex);

            const animId = generateAnimationId('slide-transition');
            this.activeAnimationId = animId;

            const easing = getEasing(transition.easing);

            animationEngine.create(
                animId,
                (progress) => {
                    const easedProgress = easing(progress);

                    const panX = lerp(startPanX, targetView.panX, easedProgress);
                    const panY = lerp(startPanY, targetView.panY, easedProgress);

                    setViewState({ panX, panY, scale: targetView.scale });
                },
                {
                    duration: transition.duration,
                    onComplete: () => {
                        this.activeAnimationId = null;
                        setViewState(targetView);
                        resolve();
                    }
                }
            );

            animationEngine.start(animId);
        });
    }

    /**
     * Zoom transition - scales in/out while keeping the slide centered
     * zoom-in:  slide grows into view from a small point
     * zoom-out: slide shrinks away then new slide appears at full size
     */
    private executeZoom(context: TransitionContext, transition: SlideTransition): Promise<void> {
        return new Promise((resolve) => {
            const targetView = calculateSlideViewState(context.toSlide);
            const isZoomIn = transition.type === 'zoom-in';

            // Starting scale: zoom-in starts small, zoom-out starts large
            const startScale = isZoomIn
                ? targetView.scale * 0.15
                : targetView.scale * 3.0;

            // Compute the slide center in world coordinates so pan stays centered
            const slideCX = context.toSlide.spatialPosition.x + context.toSlide.dimensions.width / 2;
            const slideCY = context.toSlide.spatialPosition.y + context.toSlide.dimensions.height / 2;
            const screenCX = window.innerWidth / 2;
            const screenCY = window.innerHeight / 2;

            // Update active slide index
            setStore("activeSlideIndex", context.toIndex);

            const animId = generateAnimationId('zoom-transition');
            this.activeAnimationId = animId;

            const easing = getEasing(transition.easing);

            animationEngine.create(
                animId,
                (progress) => {
                    const easedProgress = easing(progress);

                    const scale = lerp(startScale, targetView.scale, easedProgress);
                    const panX = screenCX - slideCX * scale;
                    const panY = screenCY - slideCY * scale;

                    setViewState({ scale, panX, panY });
                },
                {
                    duration: transition.duration,
                    onComplete: () => {
                        this.activeAnimationId = null;
                        setViewState(targetView);
                        resolve();
                    }
                }
            );

            animationEngine.start(animId);
        });
    }

    /**
     * Remove fade overlay element
     */
    private removeFadeOverlay(): void {
        if (this.fadeOverlay && this.fadeOverlay.parentNode) {
            this.fadeOverlay.parentNode.removeChild(this.fadeOverlay);
            this.fadeOverlay = null;
        }
    }

    /**
     * Preview transition by going back one slide and animating forward
     * If slideIndex is 0, just plays the transition for that slide (entry from nowhere)
     */
    async previewTransition(slideIndex: number): Promise<void> {
        if (slideIndex < 0 || slideIndex >= store.slides.length) {
            return;
        }

        if (slideIndex === 0) {
            // Special case for first slide: just play transition
            const slide = store.slides[0];
            const transition = slide.transition || DEFAULT_SLIDE_TRANSITION;

            // Temporary go to index -1 or just re-apply current
            await this.executeTransition({
                fromSlide: slide, // Not ideal but works for preview
                toSlide: slide,
                fromIndex: -1,
                toIndex: 0,
                direction: 'forward'
            }, transition);
        } else {
            // Jump to previous slide without animation
            await this.transitionTo(slideIndex - 1, { skipAnimation: true });

            // Small delay then animate forward
            await new Promise(r => setTimeout(r, 300));
            await this.transitionTo(slideIndex);
        }
    }
}

export const slideTransitionManager = new SlideTransitionManager();
