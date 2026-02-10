import { store, setStore } from '../../store/app-store';
import type { ElementAnimation } from '../../types/motion-types';
import { sequenceAnimator } from './sequence-animator';
import { getElementsOnSlide } from '../slide-utils';

export interface BuildStep {
    elementId: string;
    animation: ElementAnimation;
    played: boolean;
}

/**
 * Orchestrates the global animation build sequence for the active slide or canvas.
 */
class SlideBuildManager {
    private buildSequence: BuildStep[] = [];
    private isPlaying: boolean = false;
    private _playedClickSteps: number = 0;
    private hiddenElementOpacities: Map<string, number> = new Map();

    /**
     * Initialize build sequence for the current slide.
     * Collects and sorts all animations into a unified timeline.
     */
    init(slideIndex: number) {
        this.reset();

        // For infinite canvas mode, use all elements; for slides, use slide-specific elements
        const slideElements = store.docType === 'infinite'
            ? store.elements
            : getElementsOnSlide(slideIndex, store.elements, store.slides);

        const allBuilds: BuildStep[] = [];

        // Flatten all animations from all elements
        slideElements.forEach(el => {
            if (el.animations && el.animations.length > 0) {
                el.animations.forEach(anim => {
                    allBuilds.push({
                        elementId: el.id,
                        animation: anim,
                        played: false
                    });
                });
            }
        });

        // SORTING LOGIC:
        // For now, we sort by either:
        // 1. Explicit order if we had a z-index/order property on animations (not yet)
        // 2. Element layer order, then by animation index within the element.
        // This ensures a predictable build order based on visual stacking.
        this.buildSequence = allBuilds.sort((a, b) => {
            const elA = slideElements.find(e => e.id === a.elementId)!;
            const elB = slideElements.find(e => e.id === b.elementId)!;

            // Layer comparison
            if (elA.layerId !== elB.layerId) {
                const layerA = store.layers.find(l => l.id === elA.layerId);
                const layerB = store.layers.find(l => l.id === elB.layerId);
                return (layerA?.order ?? 0) - (layerB?.order ?? 0);
            }

            // Same element? Preserve internal order
            if (a.elementId === b.elementId) {
                return (elA.animations?.indexOf(a.animation) ?? 0) - (elB.animations?.indexOf(b.animation) ?? 0);
            }

            // Same layer? Arbitrary but stable (ID)
            return a.elementId.localeCompare(b.elementId);
        });

        // Hide elements that have startHidden animations
        this.applyStartHidden();
    }

    reset() {
        // Restore hidden element opacities before clearing
        this.restoreHiddenElements();

        this.buildSequence = [];
        this.isPlaying = false;
        this._playedClickSteps = 0;
        // Stop any running animations
        sequenceAnimator.stopAll();
    }

    /** Total number of 'on-click' steps in the build sequence */
    get totalClickSteps(): number {
        return this.buildSequence.filter(step => step.animation.trigger === 'on-click').length;
    }

    /** Number of 'on-click' steps already played */
    get playedClickSteps(): number {
        return this._playedClickSteps;
    }

    /**
     * Play all 'on-load' animations for the slide.
     */
    playInitial() {
        if (store.appMode !== 'presentation') return;

        // Find all initial animations (on-load)
        this.buildSequence.forEach((step, idx) => {
            if (step.animation.trigger === 'on-load' && !step.played) {
                this.executeStep(idx);
            }
        });
    }

    /**
     * Check if there are more 'on-click' steps pending.
     */
    hasMoreSteps(): boolean {
        return this.buildSequence.some(step => !step.played && step.animation.trigger === 'on-click');
    }

    /**
     * Play the next 'on-click' animation and its chained consequences.
     */
    async playNext(): Promise<boolean> {
        if (this.isPlaying) {
            return true;
        }

        // Find next unplayed 'on-click'
        const nextClickIdx = this.buildSequence.findIndex(step => !step.played && step.animation.trigger === 'on-click');

        if (nextClickIdx === -1) {
            return false;
        }

        this.isPlaying = true;
        await this.executeStep(nextClickIdx);
        this._playedClickSteps++;
        this.isPlaying = false;

        return true;
    }

    /** Restore any hidden elements to their original opacity. Called when exiting presentation. */
    restoreAll() {
        this.restoreHiddenElements();
    }

    private executeStep(index: number): Promise<void> {
        const step = this.buildSequence[index];
        if (!step || step.played) return Promise.resolve();

        step.played = true;

        // If this element was hidden by startHidden, restore its opacity before the animation runs.
        // For fadeIn presets: opacity restores to 100, then fadeIn immediately sets it to 0 and animates to 100 (no flicker).
        // For non-opacity presets (bounce, shake): element becomes visible, then animation plays.
        if (this.hiddenElementOpacities.has(step.elementId)) {
            const originalOpacity = this.hiddenElementOpacities.get(step.elementId)!;
            const elIndex = store.elements.findIndex(e => e.id === step.elementId);
            if (elIndex !== -1) {
                setStore('elements', elIndex, 'opacity', originalOpacity);
            }
            this.hiddenElementOpacities.delete(step.elementId);
        }

        return new Promise((resolve) => {
            const onComplete = () => {
                // Determine chained animations:
                // 1. with-prev: Trigger immediately (handled below)

                // 2. after-prev: Trigger after this one finishes
                this.triggerAfterPrev(index).then(resolve);
            };

            sequenceAnimator.playAnimation(step.elementId, step.animation, onComplete);

            // Handle with-prev immediately (parallel execution)
            this.triggerWithPrev(index);
        });
    }

    private triggerWithPrev(currentIndex: number) {
        // Look ahead for animations marked 'with-prev'
        // In a global build, 'with-prev' means "run with the PREVIOUS build step",
        // which might be on a different element.
        let next = currentIndex + 1;
        while (next < this.buildSequence.length && this.buildSequence[next].animation.trigger === 'with-prev') {
            this.executeStep(next);
            next++;
        }
    }

    private async triggerAfterPrev(currentIndex: number) {
        let next = currentIndex + 1;
        if (next < this.buildSequence.length && this.buildSequence[next].animation.trigger === 'after-prev') {
            await this.executeStep(next);
        }
    }

    /**
     * Scan build sequence for animations with startHidden enabled.
     * Save original opacity and set elements to invisible.
     */
    private applyStartHidden() {
        this.hiddenElementOpacities.clear();

        const hideElementIds = new Set<string>();
        this.buildSequence.forEach(step => {
            const shouldHide = step.animation.startHidden ?? (step.animation.trigger === 'on-click');
            if (shouldHide) {
                hideElementIds.add(step.elementId);
            }
        });

        for (const elementId of hideElementIds) {
            const elIndex = store.elements.findIndex(e => e.id === elementId);
            if (elIndex !== -1) {
                this.hiddenElementOpacities.set(elementId, store.elements[elIndex].opacity ?? 100);
                setStore('elements', elIndex, 'opacity', 0);
            }
        }
    }

    /**
     * Restore all hidden elements to their original opacity.
     */
    private restoreHiddenElements() {
        for (const [elementId, originalOpacity] of this.hiddenElementOpacities) {
            const elIndex = store.elements.findIndex(e => e.id === elementId);
            if (elIndex !== -1) {
                setStore('elements', elIndex, 'opacity', originalOpacity);
            }
        }
        this.hiddenElementOpacities.clear();
    }
}

export const slideBuildManager = new SlideBuildManager();
