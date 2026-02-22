import { animateElement, type ElementAnimationTarget, type ElementAnimationConfig } from './element-animator';
import * as animator from './element-animator';
import type { ElementAnimation, PropertyAnimation, KeyframeAnimation } from '../../types/motion-types';
import { store, updateElement, setIsPreviewing } from '../../store/app-store';
import { animationEngine } from './animation-engine';

/**
 * Manages the execution of animation sequences for elements
 */
export class SequenceAnimator {
    private activeSequences = new Set<string>();

    /**
     * Play the animation sequence for a specific element
     */
    playSequence(elementId: string, trigger: 'on-load' | 'programmatic' = 'programmatic'): void {
        const element = store.elements.find(el => el.id === elementId);

        // Allow preview if element has animations OR physics props (spin/orbit)
        const hasAnimations = element?.animations && element.animations.length > 0;
        const hasPhysics = element?.spinEnabled || element?.orbitEnabled;

        if (!element || (!hasAnimations && !(trigger === 'programmatic' && hasPhysics))) return;

        // For programmatic previews, capture state to restore it after
        let originalState: any = null;
        if (trigger === 'programmatic') {
            this.activeSequences.add(elementId);
            setIsPreviewing(true);
            animationEngine.setForceTicker(true); // Force loop for physics
            originalState = {
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height,
                opacity: element.opacity,
                angle: element.angle,
                strokeColor: element.strokeColor,
                backgroundColor: element.backgroundColor
            };
        }

        // Filter animations by trigger
        // Note: 'after-prev' and 'with-prev' are handled naturally by the sequence order
        const sequence = element.animations ? element.animations.filter((_anim, index) => {
            if (trigger === 'programmatic') return true; // Preview all animations
            if (index === 0) return _anim.trigger === trigger || _anim.trigger === 'after-prev';
            return true;
        }) : [];

        // If no sequence animations, but we have physics and are previewing, just let it run
        if (sequence.length === 0) {
            if (trigger === 'programmatic' && hasPhysics) {
                // Physics mode: Just return, leaving isPreviewing=true. 
                // User must manually stop or it stops when they deselect eventually (though logic for that is elsewhere)
                // Actually, for consistency, we should probably auto-stop after some time? 
                // No, standard behavior for "Physics" preview is usually "run until stop".
                return;
            }
            return;
        }

        const onAllComplete = () => {
            // Guard: if the sequence was already stopped, don't proceed.
            // This prevents race conditions where a deferred onComplete (from
            // infinite animations calling setTimeout(onComplete, 0)) fires
            // after the user has already clicked Stop.
            if (!this.activeSequences.has(elementId)) return;

            // Stop any still-running animations on this element (e.g. infinite spins)
            // before cleanup/restoration, so they don't overwrite restored state
            animator.stopAllElementAnimations(elementId);

            if (trigger === 'programmatic') {
                this.activeSequences.delete(elementId);
                if (this.activeSequences.size === 0) {
                    setIsPreviewing(false);
                    animationEngine.setForceTicker(false);
                }
            }
            if (originalState) {
                const lastAnim = sequence[sequence.length - 1];
                const shouldRestore = lastAnim?.restoreAfter ?? true;

                if (shouldRestore) {
                    // Restore state after a small delay so the user sees the final frame
                    setTimeout(() => {
                        updateElement(elementId, originalState, false);
                    }, 500);
                }
            }
        };

        this.runStep(elementId, sequence, 0, onAllComplete);
    }

    /**
     * Stop all animations for a specific element
     */
    stopSequence(elementId: string): void {
        animator.stopAllElementAnimations(elementId);

        // Cleanup sequence state
        if (this.activeSequences.has(elementId)) {
            this.activeSequences.delete(elementId);
        }

        // Always clear preview state when stopping
        if (this.activeSequences.size === 0) {
            setIsPreviewing(false);
            animationEngine.setForceTicker(false);
        }
    }

    /**
     * Play all animations for all elements in the store, or a specific subset
     */
    playAll(trigger: 'on-load' | 'programmatic' = 'programmatic', elementIds?: string[]): void {
        const elementsToAnimate = elementIds
            ? store.elements.filter(el => elementIds.includes(el.id))
            : store.elements;

        elementsToAnimate.forEach(element => {
            this.playSequence(element.id, trigger);
        });
    }

    /**
     * Stop all animations for all elements in the store
     */
    stopAll(): void {
        this.activeSequences.clear();
        setIsPreviewing(false);
        animationEngine.setForceTicker(false);
        store.elements.forEach(element => {
            this.stopSequence(element.id);
        });
    }

    /**
     * Recursive runner for the sequence
     */
    private runStep(elementId: string, sequence: ElementAnimation[], index: number, onAllComplete?: () => void): void {
        // Guard: if the sequence was already stopped, don't proceed.
        if (!this.activeSequences.has(elementId)) return;

        if (index >= sequence.length) {
            onAllComplete?.();
            return;
        }

        const anim = sequence[index];
        const nextIndex = index + 1;
        const isInfiniteLoop = anim.repeat === -1;

        // Find NEXT valid start point (skip animations marked as 'with-prev'
        // since they are triggered concurrently in the lookahead below)
        let nextValidIndex = nextIndex;
        while (nextValidIndex < sequence.length && sequence[nextValidIndex].trigger === 'with-prev') {
            nextValidIndex++;
        }
        const hasMoreSteps = nextValidIndex < sequence.length;

        const onComplete = () => {
            if (!this.activeSequences.has(elementId)) return;

            // Restore state if requested for this SPECIFIC animation
            if (anim.restoreAfter) {
                const elementNow = store.elements.find(el => el.id === elementId);
                if (elementNow && stepOriginalState) {
                    updateElement(elementId, stepOriginalState, false);
                }
            }

            if (hasMoreSteps) {
                this.runStep(elementId, sequence, nextValidIndex, onAllComplete);
            } else {
                onAllComplete?.();
            }
        };

        // Capture state for per-animation restoration if needed
        // (We already have sequence-level originalState for previews,
        // but per-animation restoreAfter might be used in live mode)
        let stepOriginalState: any = null;
        if (anim.restoreAfter) {
            const el = store.elements.find(e => e.id === elementId);
            if (el) {
                stepOriginalState = { ...el };
            }
        }

        // Handle "with-prev" - Look ahead for concurrent animations
        let lookAheadIndex = nextIndex;
        while (lookAheadIndex < sequence.length) {
            const nextAnim = sequence[lookAheadIndex];
            if (nextAnim.trigger === 'with-prev') {
                this.executeAnimation(elementId, nextAnim, () => {
                    // Even 'with-prev' animations can have restoreAfter
                    if (nextAnim.restoreAfter && stepOriginalState) {
                        // We'd need to capture individual starts for parallel - complex.
                        // For now, simplify or just let main sequence handle it.
                    }
                });
                lookAheadIndex++;
            } else {
                break;
            }
        }

        if (isInfiniteLoop) {
            // For infinite animations (repeat === -1), the animation runs forever
            // and never fires onComplete. Pass a no-op so the animation doesn't
            // trigger sequence cleanup. The sequence stays active until the user
            // manually clicks Stop.
            // Note: "after-prev" successors won't start (the animation never finishes).
            // Use "with-prev" trigger for concurrent playback with infinite animations.
            this.executeAnimation(elementId, anim, () => {});
        } else {
            // Finite animation: chain to next step via onComplete callback
            this.executeAnimation(elementId, anim, onComplete);
        }
    }

    /**
     * Execute a specific animation on an element.
     */
    playAnimation(elementId: string, anim: ElementAnimation, onComplete: () => void): void {
        this.executeAnimation(elementId, anim, onComplete);
    }

    private executeAnimation(elementId: string, anim: ElementAnimation, onComplete: () => void): void {
        const config: ElementAnimationConfig = {
            duration: anim.duration,
            delay: anim.delay,
            easing: anim.easing,
            onComplete,
            params: (anim as any).params,
            loop: anim.repeat === -1,
            loopCount: anim.repeat !== -1 && (anim.repeat || 0) > 0 ? anim.repeat : undefined,
            alternate: anim.yoyo
        };

        if (anim.type === 'preset') {
            // Map presets to existing animator functions
            const presetFn = (animator as any)[anim.name];
            if (typeof presetFn === 'function') {
                presetFn(elementId, anim.duration, config);
            } else {
                console.warn(`Unknown preset: ${anim.name}`);
                onComplete();
            }
        } else if (anim.type === 'property') {
            this.animateProperty(elementId, anim, config);
        } else if (anim.type === 'rotate') {
            this.animateRotate(elementId, anim as any, config);
        } else if (anim.type === 'autoSpin') {
            this.animateAutoSpin(elementId, anim as any, config);
        } else if (anim.type === 'path') {
            animator.animateAlongPath(elementId, (anim as any).pathData, {
                ...config,
                orientToPath: (anim as any).orientToPath,
                isRelative: (anim as any).isRelative
            });
        } else if (anim.type === 'morph') {
            animator.animateMorph(elementId, (anim as any).targetShape, config);
        } else if (anim.type === 'keyframe') {
            const kfAnim = anim as KeyframeAnimation;
            animator.animateElementKeyframes(elementId, kfAnim.property, kfAnim.keyframes, config);
        }
    }

    private animateRotate(elementId: string, anim: any, config: ElementAnimationConfig): void {
        const el = store.elements.find(e => e.id === elementId);
        if (!el) {
            config.onComplete?.();
            return;
        }

        const toAngle = anim.relative ? (el.angle || 0) + (anim.toAngle * Math.PI / 180) : (anim.toAngle * Math.PI / 180);
        animateElement(elementId, { angle: toAngle }, config);
    }

    private animateAutoSpin(elementId: string, anim: any, config: ElementAnimationConfig): void {
        const el = store.elements.find(e => e.id === elementId);
        if (!el) {
            config.onComplete?.();
            return;
        }

        const startAngle = el.angle || 0;
        const direction = anim.direction === 'counterclockwise' ? -1 : 1;
        const iterations = anim.iterations === 'infinite' ? Infinity : (anim.iterations || 1);

        // Calculate rotation for ONE iteration (2π)
        const rotationPerIteration = direction * Math.PI * 2;

        const spinConfig = { ...config };

        if (iterations === Infinity) {
            // Infinite loop: animate one full rotation and loop it
            spinConfig.loop = true;
            spinConfig.loopCount = Infinity;
            spinConfig.duration = config.duration || 1000;
            // Use linear easing for smooth continuous rotation
            spinConfig.easing = 'linear';

            // For infinite loops, call onComplete immediately to unblock the sequence
            const originalOnComplete = config.onComplete;
            setTimeout(() => {
                originalOnComplete?.();
            }, 0);

            const endAngle = startAngle + rotationPerIteration;
            animateElement(elementId, { angle: endAngle }, { ...spinConfig, onComplete: undefined });
        } else {
            // Finite iterations: use a single continuous animation from
            // startAngle to startAngle + totalRotation to avoid snap-back at loop boundaries
            const totalRotation = rotationPerIteration * iterations;
            const endAngle = startAngle + totalRotation;
            animateElement(elementId, { angle: endAngle }, spinConfig);
        }
    }

    private animateProperty(elementId: string, anim: PropertyAnimation, config: ElementAnimationConfig): void {
        // Construct target object
        const target: ElementAnimationTarget = {};

        // Handle numeric or string conversion if needed
        const val = anim.to;
        // Numeric properties (including 3D)
        const numericProps = [
            'opacity', 'x', 'y', 'width', 'height', 'angle', 'strokeWidth', 'roughness',
            // 3D properties
            'depth', 'viewAngle', 'openAmount', 'taper', 'skewX', 'skewY', 'frontTaper', 'frontSkewX', 'frontSkewY',
            'shapeRatio', 'sideRatio'
        ];
        if (numericProps.includes(anim.property)) {
            (target as any)[anim.property] = Number(val);
        } else if (anim.property === 'strokeColor' || anim.property === 'backgroundColor') {
            (target as any)[anim.property] = String(val);
        }

        animateElement(elementId, target, config);
    }
}

export const sequenceAnimator = new SequenceAnimator();
