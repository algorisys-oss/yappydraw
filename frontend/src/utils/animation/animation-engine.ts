/**
 * Animation Engine
 * Core requestAnimationFrame loop manager for the Yappy animation system
 */

import type { Animation, AnimationConfig, AnimationState } from './animation-types';
import { getEasing } from './animation-types';
import { createSignal, batch } from 'solid-js';
import { store } from '../../store/app-store';

const [globalTime, setGlobalTime] = createSignal(0);
const [effectiveTime, setEffectiveTime] = createSignal(0);
const [isGlobalAnimating, setIsGlobalAnimating] = createSignal(false);
const [isGlobalPlaying, setIsGlobalPlaying] = createSignal(false);
const [isGlobalPaused, setIsGlobalPaused] = createSignal(false);
export { globalTime, effectiveTime, isGlobalAnimating, isGlobalPlaying, isGlobalPaused };

/**
 * AnimationEngine manages the animation loop and all registered animations
 */
class AnimationEngine {
    private animations: Map<string, Animation> = new Map();
    private rafId: number | null = null;
    private isRunning: boolean = false;
    private forceTicker: boolean = false;
    private lastTickTime: number = 0;

    /**
     * Start/Stop the global ticker even when no animations are running
     */
    public setForceTicker(enabled: boolean): void {
        this.forceTicker = enabled;
        if (enabled) {
            this.ensureLoopRunning();
        }
    }

    /**
     * Create a new animation with the given update function and config
     */
    create(
        id: string,
        onUpdate: (progress: number) => void,
        config: AnimationConfig
    ): string {
        const animation: Animation = {
            id,
            state: 'idle',
            startTime: 0,
            pauseTime: null,
            duration: config.duration ?? 0,
            delay: config.delay ?? 0,
            easing: getEasing(config.easing),
            onUpdate,
            onComplete: config.onComplete,
            onStart: config.onStart,
            loop: config.loop ?? false,
            loopCount: config.loopCount ?? Infinity,
            currentLoop: 0,
            alternate: config.alternate ?? false,
            direction: 1
        };

        this.animations.set(id, animation);
        return id;
    }

    /**
     * Start an animation by ID
     */
    start(id: string): void {
        const animation = this.animations.get(id);
        if (!animation) return;

        if (animation.state === 'paused' && animation.pauseTime !== null) {
            // Resume from pause
            const pausedDuration = animation.pauseTime - animation.startTime;
            animation.startTime = performance.now() - pausedDuration;
            animation.pauseTime = null;
        } else {
            // Fresh start
            animation.startTime = performance.now();
            animation.currentLoop = 0;
            animation.direction = 1;
        }

        animation.state = 'running';
        animation.onStart?.();

        this.ensureLoopRunning();
    }

    /**
     * Pause an animation by ID
     */
    pause(id: string): void {
        const animation = this.animations.get(id);
        if (!animation || animation.state !== 'running') return;

        animation.state = 'paused';
        animation.pauseTime = performance.now();
    }

    /**
     * Stop an animation and remove it
     */
    stop(id: string): void {
        const animation = this.animations.get(id);
        if (!animation) return;

        animation.state = 'completed';
        this.animations.delete(id);

        // Stop loop if no more animations and ticker not forced
        if (this.animations.size === 0 && !this.forceTicker) {
            this.stopLoop();
        }
    }

    /**
     * Reset an animation to the beginning
     */
    reset(id: string): void {
        const animation = this.animations.get(id);
        if (!animation) return;

        animation.state = 'idle';
        animation.startTime = 0;
        animation.pauseTime = null;
        animation.currentLoop = 0;
        animation.direction = 1;
        animation.onUpdate(0);
    }

    /**
     * Get the current state of an animation
     */
    getState(id: string): AnimationState | null {
        return this.animations.get(id)?.state ?? null;
    }

    /**
     * Check if an animation exists
     */
    has(id: string): boolean {
        return this.animations.has(id);
    }

    /**
     * Stop all animations
     */
    stopAll(): void {
        this.animations.clear();
        setIsGlobalPlaying(false);
        setIsGlobalPaused(false);
        this.stopLoop();
    }

    /**
     * Pause all animations
     */
    pauseAll(): void {
        for (const animation of this.animations.values()) {
            if (animation.state === 'running') {
                animation.state = 'paused';
                animation.pauseTime = performance.now();
            }
        }
    }

    /**
     * Resume all paused animations
     */
    resumeAll(): void {
        const now = performance.now();
        for (const animation of this.animations.values()) {
            if (animation.state === 'paused' && animation.pauseTime !== null) {
                const pausedDuration = animation.pauseTime - animation.startTime;
                animation.startTime = now - pausedDuration;
                animation.pauseTime = null;
                animation.state = 'running';
            }
        }
        this.ensureLoopRunning();
    }

    /**
     * The main animation tick - called by requestAnimationFrame
     */
    private tick = (timestamp: number): void => {
        if (!this.isRunning) {
            this.lastTickTime = 0;
            return;
        }

        if (this.lastTickTime === 0) {
            this.lastTickTime = timestamp;
        }
        const deltaTime = timestamp - this.lastTickTime;
        this.lastTickTime = timestamp;

        // Check global animation setting
        const animationsEnabled = store.globalSettings?.animationEnabled ?? true;

        let hasRunningAnimations = false;
        batch(() => {
            setGlobalTime(timestamp);

            if (!isGlobalPaused()) {
                setEffectiveTime(t => t + deltaTime);
            }

            for (const animation of this.animations.values()) {
                if (animation.state !== 'running') continue;

                hasRunningAnimations = true;

                // If animations are globally disabled, force complete immediately
                if (!animationsEnabled) {
                    // Determine final value (progress = 1)
                    animation.onUpdate(1);

                    // Complete and cleanup
                    animation.state = 'completed';
                    animation.onComplete?.();
                    this.animations.delete(animation.id);
                    continue;
                }

                const elapsed = timestamp - animation.startTime - animation.delay;

                // Still in delay phase
                if (elapsed < 0) {
                    continue;
                }

                // Calculate raw progress
                let rawProgress = Math.min(elapsed / animation.duration, 1);

                // Handle alternating direction
                if (animation.direction === -1) {
                    rawProgress = 1 - rawProgress;
                }

                // Apply easing
                const easedProgress = animation.easing(rawProgress);

                // Update
                animation.onUpdate(easedProgress);

                // Check completion
                if (elapsed >= animation.duration) {
                    if (animation.loop && animation.currentLoop < animation.loopCount - 1) {
                        // Loop
                        animation.currentLoop++;
                        animation.startTime = timestamp;
                        if (animation.alternate) {
                            animation.direction = animation.direction === 1 ? -1 : 1;
                        }
                    } else {
                        // Complete
                        animation.state = 'completed';
                        animation.onComplete?.();
                        this.animations.delete(animation.id);
                    }
                }
            }
        });

        let hasPausedAnimations = false;
        if (!hasRunningAnimations) {
            for (const animation of this.animations.values()) {
                if (animation.state === 'paused') {
                    hasPausedAnimations = true;
                    break;
                }
            }
        }

        setIsGlobalPlaying(hasRunningAnimations);
        setIsGlobalPaused(hasPausedAnimations);

        if (hasRunningAnimations || this.animations.size > 0 || this.forceTicker) {
            this.rafId = requestAnimationFrame(this.tick);
        } else {
            this.stopLoop();
        }
    };

    /**
     * Ensure the animation loop is running
     */
    private ensureLoopRunning(): void {
        if (!this.isRunning) {
            this.isRunning = true;
            setIsGlobalAnimating(true);
            this.rafId = requestAnimationFrame(this.tick);
        }
    }

    /**
     * Stop the animation loop
     */
    private stopLoop(): void {
        this.isRunning = false;
        setIsGlobalAnimating(false);
        setIsGlobalPlaying(false);
        setIsGlobalPaused(false);
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
}

// Singleton instance
export const animationEngine = new AnimationEngine();

// Helper to generate unique animation IDs
let animationCounter = 0;
export function generateAnimationId(prefix: string = 'anim'): string {
    return `${prefix}-${Date.now()}-${++animationCounter}`;
}
