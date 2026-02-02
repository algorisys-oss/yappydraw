import { store } from '../../store/app-store';
import type { ElementAnimation } from '../../types/motion-types';
import { sequenceAnimator } from './sequence-animator';
import { getElementsOnSlide } from '../slide-utils';

export interface BuildStep {
    elementId: string;
    animation: ElementAnimation;
    played: boolean;
}

/**
 * Orchestrates the global animation build sequence for the active slide.
 */
class SlideBuildManager {
    private buildSequence: BuildStep[] = [];
    private isPlaying: boolean = false;

    /**
     * Initialize build sequence for the current slide.
     * Collects and sorts all animations into a unified timeline.
     */
    init(slideIndex: number) {
        this.reset();

        const slideElements = getElementsOnSlide(slideIndex, store.elements, store.slides);
        const allBuilds: BuildStep[] = [];

        // Flatten all animations from all elements on this slide
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

    }

    reset() {
        this.buildSequence = [];
        this.isPlaying = false;
        // Stop any running animations
        sequenceAnimator.stopAll();
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
        this.isPlaying = false;

        return true;
    }

    private executeStep(index: number): Promise<void> {
        const step = this.buildSequence[index];
        if (!step || step.played) return Promise.resolve();

        step.played = true;

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
}

export const slideBuildManager = new SlideBuildManager();
