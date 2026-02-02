/**
 * Timeline
 * Sequence and parallel animation orchestration
 */

import { animationEngine } from './animation-engine';

type AnimationFactory = () => string;

interface TimelineStep {
    type: 'animation' | 'parallel' | 'delay' | 'callback';
    factory?: AnimationFactory;
    factories?: AnimationFactory[];
    delay?: number;
    callback?: () => void;
}

/**
 * Timeline for sequencing animations
 * 
 * @example
 * // Sequential animations
 * const timeline = new Timeline()
 *   .add(() => animateElement('el1', { x: 100 }, { duration: 300 }))
 *   .add(() => animateElement('el2', { x: 200 }, { duration: 300 }))
 *   .play();
 * 
 * @example
 * // Parallel animations with delay
 * new Timeline()
 *   .parallel(
 *     () => animateElement('el1', { x: 100 }, { duration: 300 }),
 *     () => animateElement('el2', { y: 100 }, { duration: 300 })
 *   )
 *   .delay(500)
 *   .add(() => animateElement('el3', { opacity: 0 }, { duration: 300 }))
 *   .play();
 */
export class Timeline {
    private steps: TimelineStep[] = [];
    private currentStepIndex: number = 0;
    private isPlaying: boolean = false;
    private isPaused: boolean = false;
    private activeAnimationIds: string[] = [];
    private resolvePromise: (() => void) | null = null;

    /**
     * Add a single animation to the timeline
     */
    add(factory: AnimationFactory, delay?: number): this {
        if (delay && delay > 0) {
            this.steps.push({ type: 'delay', delay });
        }
        this.steps.push({ type: 'animation', factory });
        return this;
    }

    /**
     * Add multiple animations to run in parallel
     */
    parallel(...factories: AnimationFactory[]): this {
        this.steps.push({ type: 'parallel', factories });
        return this;
    }

    /**
     * Add a delay between animations
     */
    delay(ms: number): this {
        this.steps.push({ type: 'delay', delay: ms });
        return this;
    }

    /**
     * Add a callback to run at a point in the timeline
     */
    call(callback: () => void): this {
        this.steps.push({ type: 'callback', callback });
        return this;
    }

    /**
     * Play the timeline from the current position
     */
    play(): Promise<void> {
        if (this.isPaused) {
            // Resume
            this.isPaused = false;
            this.isPlaying = true;
            animationEngine.resumeAll();
            return Promise.resolve();
        }

        if (this.isPlaying) {
            return Promise.resolve();
        }

        this.isPlaying = true;
        this.currentStepIndex = 0;

        return new Promise((resolve) => {
            this.resolvePromise = resolve;
            this.runNextStep();
        });
    }

    /**
     * Pause the timeline
     */
    pause(): void {
        if (!this.isPlaying) return;
        this.isPaused = true;
        this.isPlaying = false;
        animationEngine.pauseAll();
    }

    /**
     * Stop the timeline and reset
     */
    stop(): void {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentStepIndex = 0;

        // Stop all active animations
        for (const id of this.activeAnimationIds) {
            animationEngine.stop(id);
        }
        this.activeAnimationIds = [];

        if (this.resolvePromise) {
            this.resolvePromise();
            this.resolvePromise = null;
        }
    }

    /**
     * Reset the timeline to the beginning
     */
    reset(): void {
        this.stop();
        this.currentStepIndex = 0;
    }

    /**
     * Get the current progress (0-1)
     */
    get progress(): number {
        if (this.steps.length === 0) return 0;
        return this.currentStepIndex / this.steps.length;
    }

    /**
     * Check if playing
     */
    get playing(): boolean {
        return this.isPlaying;
    }

    /**
     * Check if paused
     */
    get paused(): boolean {
        return this.isPaused;
    }

    /**
     * Run the next step in the timeline
     */
    private runNextStep(): void {
        if (!this.isPlaying || this.currentStepIndex >= this.steps.length) {
            this.isPlaying = false;
            if (this.resolvePromise) {
                this.resolvePromise();
                this.resolvePromise = null;
            }
            return;
        }

        const step = this.steps[this.currentStepIndex];
        this.currentStepIndex++;

        switch (step.type) {
            case 'animation':
                this.runAnimation(step.factory!);
                break;
            case 'parallel':
                this.runParallel(step.factories!);
                break;
            case 'delay':
                this.runDelay(step.delay!);
                break;
            case 'callback':
                step.callback?.();
                this.runNextStep();
                break;
        }
    }

    /**
     * Run a single animation and wait for completion
     */
    private runAnimation(factory: AnimationFactory): void {
        const animId = factory();

        if (!animId) {
            // Animation failed to create, continue
            this.runNextStep();
            return;
        }

        this.activeAnimationIds.push(animId);

        // Poll for completion (the animation's onComplete will be called)
        const checkComplete = () => {
            const state = animationEngine.getState(animId);
            if (state === null || state === 'completed') {
                // Animation done
                this.activeAnimationIds = this.activeAnimationIds.filter(id => id !== animId);
                if (this.isPlaying) {
                    this.runNextStep();
                }
            } else if (this.isPlaying && !this.isPaused) {
                requestAnimationFrame(checkComplete);
            }
        };

        requestAnimationFrame(checkComplete);
    }

    /**
     * Run multiple animations in parallel and wait for all to complete
     */
    private runParallel(factories: AnimationFactory[]): void {
        const animIds = factories.map(f => f()).filter(id => id !== '');

        if (animIds.length === 0) {
            this.runNextStep();
            return;
        }

        this.activeAnimationIds.push(...animIds);

        const checkComplete = () => {
            let allDone = true;
            for (const animId of animIds) {
                const state = animationEngine.getState(animId);
                if (state !== null && state !== 'completed') {
                    allDone = false;
                }
            }

            if (allDone) {
                this.activeAnimationIds = this.activeAnimationIds.filter(id => !animIds.includes(id));
                if (this.isPlaying) {
                    this.runNextStep();
                }
            } else if (this.isPlaying && !this.isPaused) {
                requestAnimationFrame(checkComplete);
            }
        };

        requestAnimationFrame(checkComplete);
    }

    /**
     * Run a delay step
     */
    private runDelay(ms: number): void {
        setTimeout(() => {
            if (this.isPlaying && !this.isPaused) {
                this.runNextStep();
            }
        }, ms);
    }
}

/**
 * Helper to create a timeline
 */
export function createTimeline(): Timeline {
    return new Timeline();
}
