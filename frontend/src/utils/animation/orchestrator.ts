/**
 * Animation Orchestrator
 * Sequences multiple element animations for complex motion graphics/presentations
 */

import { animateElement, type ElementAnimationTarget, type ElementAnimationConfig } from './element-animator';

export interface SequenceStep {
    elementId: string;
    target: ElementAnimationTarget;
    config: ElementAnimationConfig;
    /** Relative delay from the end of the previous step (positive for gap, negative for overlap) or from start of sequence if it is the first step */
    delay?: number;
}

export interface SequenceConfig {
    loop?: boolean;
    onComplete?: () => void;
}

/**
 * Play a sequence of animations
 */
export async function playSequence(steps: SequenceStep[], config?: SequenceConfig): Promise<void> {
    if (steps.length === 0) {
        config?.onComplete?.();
        return;
    }

    for (const step of steps) {
        // Wait for previous delay
        if (step.delay && step.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, step.delay));
        }

        // Prepare a promise that resolves when THIS animation completes
        const animationPromise = new Promise<void>((resolve) => {
            const originalOnComplete = step.config.onComplete;
            step.config.onComplete = () => {
                originalOnComplete?.();
                resolve();
            };
        });

        // Trigger animation
        animateElement(step.elementId, step.target, step.config);

        // If explicitly requested to wait before next step (default behavior for sequencer)
        // Note: For now, we wait for the animation to finish before proceeding to the next step
        // to ensure strict sequencing. Overlap can be handled by negative delays if implemented differently.
        await animationPromise;
    }

    if (config?.loop) {
        playSequence(steps, config);
    } else {
        config?.onComplete?.();
    }
}
