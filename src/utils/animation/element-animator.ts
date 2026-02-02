/**
 * Element Animator
 * Animates DrawingElement properties using the animation engine
 */

import { animationEngine, generateAnimationId } from './animation-engine';
import { PathUtils } from '../math/path-utils';
import { MorphUtils } from '../math/morph-utils';
import type { AnimationConfig, EasingFunction } from './animation-types';
import { lerp, lerpColor, getEasing } from './animation-types';
import type { AnimationKeyframe } from '../../types/motion-types';
import { store, updateElement, setStore } from '../../store/app-store';
import type { DrawingElement } from '../../types';

// Track active animations per element with their affected properties
// Map<elementId, Map<animationId, Set<propertyName>>>
const activeAnimations = new Map<string, Map<string, Set<string>>>();

/**
 * Stop animations that conflict with the given properties
 */
export function stopConflictingAnimations(
    elementId: string,
    targetProperties: Set<string>
): void {
    const elementAnims = activeAnimations.get(elementId);
    if (!elementAnims) return;

    const toStop: string[] = [];

    for (const [animId, animProps] of elementAnims.entries()) {
        // Check if any property overlaps
        for (const prop of animProps) {
            if (targetProperties.has(prop)) {
                toStop.push(animId);
                break;
            }
        }
    }

    toStop.forEach(id => {
        animationEngine.stop(id);
        elementAnims.delete(id);
    });

    if (elementAnims.size === 0) {
        activeAnimations.delete(elementId);
    }
}

/**
 * Stop all active animations for a specific element
 */
export function stopAllElementAnimations(elementId: string): void {
    const animIds = activeAnimations.get(elementId);
    if (animIds) {
        animIds.forEach((_, id) => animationEngine.stop(id));
        activeAnimations.delete(elementId);
    }
}

/**
 * Check if an element is currently animating
 */
export function isElementAnimating(elementId: string): boolean {
    const animIds = activeAnimations.get(elementId);
    return animIds ? animIds.size > 0 : false;
}

// Properties that can be animated
export type AnimatableProperty =
    | 'x'
    | 'y'
    | 'width'
    | 'height'
    | 'opacity'
    | 'angle'
    | 'strokeWidth'
    | 'roughness'
    | 'drawProgress';

// Color properties that can be animated
export type AnimatableColorProperty =
    | 'strokeColor'
    | 'backgroundColor';

export interface ElementAnimationTarget {
    // Numeric properties
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    opacity?: number;
    angle?: number;
    strokeWidth?: number;
    roughness?: number;
    drawProgress?: number;
    // Color properties
    strokeColor?: string;
    backgroundColor?: string;
    // Motion properties (Applied immediately)
    flowAnimation?: boolean;
    flowSpeed?: number;
    flowStyle?: string;
}

export interface ElementAnimationConfig extends Omit<AnimationConfig, 'onUpdate'> {
    /** Optional callback with current animated values */
    onUpdate?: (values: Partial<ElementAnimationTarget>) => void;
    /** For attention seekers / presets */
    intensity?: number;
    /** For pulse / scale presets */
    scale?: number;
    /** For custom preset parameters */
    params?: Record<string, any>;
}

/**
 * Get the current value of an animatable property from an element
 */
function getElementProperty(element: DrawingElement, prop: keyof ElementAnimationTarget): number | string | undefined {
    return element[prop as keyof DrawingElement] as number | string | undefined;
}

/**
 * Animate a single element's properties
 * 
 * @param elementId - The ID of the element to animate
 * @param target - Target property values to animate to
 * @param config - Animation configuration
 * @returns Animation ID for control
 * 
 * @example
 * // Move element to x:500 with bounce easing
 * animateElement('rect-1', { x: 500 }, { duration: 500, easing: 'easeOutBounce' });
 * 
 * @example
 * // Fade and scale simultaneously
 * animateElement('circle-1', { opacity: 0, width: 200, height: 200 }, { 
 *   duration: 300, 
 *   easing: 'easeOutQuad' 
 * });
 */
export function animateElement(
    elementId: string,
    target: ElementAnimationTarget,
    config: ElementAnimationConfig
): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) {
        console.warn(`animateElement: Element ${elementId} not found`);
        return '';
    }

    const animId = generateAnimationId('el');

    // Capture starting values and determine which properties will be animated
    const startValues: Record<string, number | string> = {};
    const numericProps: AnimatableProperty[] = [];
    const colorProps: AnimatableColorProperty[] = [];
    const immediateProps: Partial<DrawingElement> = {};
    const targetProps = new Set<string>();

    for (const key of Object.keys(target) as (keyof ElementAnimationTarget)[]) {
        targetProps.add(key); // Track all target properties
        const startVal = getElementProperty(element, key);
        if (startVal !== undefined) {
            startValues[key] = startVal;
            if (typeof startVal === 'number') {
                numericProps.push(key as AnimatableProperty);
            } else if (typeof startVal === 'string') {
                colorProps.push(key as AnimatableColorProperty);
            }
        } else {
            // For properties not currently on the element (like booleans/toggles),
            // we apply them immediately at the start of the animation
            (immediateProps as any)[key] = (target as any)[key];
        }
    }

    // Stop only animations that conflict with our target properties
    stopConflictingAnimations(elementId, targetProps);

    // Register this animation with its properties
    if (!activeAnimations.has(elementId)) {
        activeAnimations.set(elementId, new Map());
    }
    activeAnimations.get(elementId)!.set(animId, targetProps);

    // Apply immediate properties
    if (Object.keys(immediateProps).length > 0) {
        updateElement(elementId, immediateProps, false);
    }

    // Create the animation
    animationEngine.create(
        animId,
        (progress: number) => {
            const updates: Partial<DrawingElement> = {};
            const callbackValues: Partial<ElementAnimationTarget> = {};

            // Interpolate numeric properties
            for (const prop of numericProps) {
                const start = startValues[prop] as number;
                const end = target[prop] as number;
                const value = lerp(start, end, progress);
                (updates as any)[prop] = value;
                (callbackValues as any)[prop] = value;
            }

            // Interpolate color properties
            for (const prop of colorProps) {
                const start = startValues[prop] as string;
                const end = target[prop] as string;
                if (start && end && start.startsWith('#') && end.startsWith('#')) {
                    const value = lerpColor(start, end, progress);
                    (updates as any)[prop] = value;
                    (callbackValues as any)[prop] = value;
                }
            }

            // Update the element in store (skip history during animation)
            updateElement(elementId, updates, false);

            // Call user callback if provided
            config.onUpdate?.(callbackValues);
        },
        {
            duration: config.duration,
            easing: config.easing,
            delay: config.delay,
            onStart: config.onStart,
            onComplete: () => {
                // Unregister
                const animIds = activeAnimations.get(elementId);
                if (animIds) {
                    animIds.delete(animId);
                    if (animIds.size === 0) activeAnimations.delete(elementId);
                }
                config.onComplete?.();
            },
            loop: config.loop,
            loopCount: config.loopCount,
            alternate: config.alternate
        }
    );

    // Start immediately
    animationEngine.start(animId);

    return animId;
}

/**
 * Animate multiple elements with the same animation
 * 
 * @param elementIds - Array of element IDs
 * @param target - Target property values
 * @param config - Animation configuration
 * @param stagger - Delay between each element's start (ms)
 * @returns Array of animation IDs
 */
export function animateElements(
    elementIds: string[],
    target: ElementAnimationTarget,
    config: ElementAnimationConfig,
    stagger: number = 0
): string[] {
    return elementIds.map((id, index) => {
        return animateElement(id, target, {
            ...config,
            delay: (config.delay ?? 0) + (stagger * index)
        });
    });
}

/**
 * Interpolate a value from a sorted keyframe array given a progress (0–1).
 * Each keyframe can specify its own easing (applied within that segment).
 */
export function interpolateKeyframes(
    keyframes: AnimationKeyframe[],
    progress: number
): number | string {
    if (keyframes.length === 0) return 0;
    if (keyframes.length === 1) return keyframes[0].value;

    // Clamp
    if (progress <= keyframes[0].offset) return keyframes[0].value;
    if (progress >= keyframes[keyframes.length - 1].offset) return keyframes[keyframes.length - 1].value;

    // Find the segment
    for (let i = 0; i < keyframes.length - 1; i++) {
        const curr = keyframes[i];
        const next = keyframes[i + 1];
        if (progress >= curr.offset && progress <= next.offset) {
            const segmentLength = next.offset - curr.offset;
            if (segmentLength === 0) return next.value;

            const localProgress = (progress - curr.offset) / segmentLength;
            const easingFn: EasingFunction = getEasing(next.easing);
            const eased = easingFn(localProgress);

            if (typeof curr.value === 'number' && typeof next.value === 'number') {
                return lerp(curr.value, next.value, eased);
            }
            if (typeof curr.value === 'string' && typeof next.value === 'string') {
                return lerpColor(curr.value, next.value, eased);
            }
            // Mismatched types — snap at midpoint
            return eased < 0.5 ? curr.value : next.value;
        }
    }
    return keyframes[keyframes.length - 1].value;
}

/**
 * Animate a single property of an element using keyframes.
 *
 * @param elementId - The element to animate
 * @param property  - The property name ('x', 'y', 'opacity', 'strokeColor', etc.)
 * @param keyframes - Array of { offset, value, easing? } sorted by offset
 * @param config    - Duration, delay, easing (global easing is ignored — per-segment easings are used)
 * @returns Animation ID for control
 *
 * @example
 * animateElementKeyframes('rect-1', 'x', [
 *     { offset: 0, value: 100 },
 *     { offset: 0.5, value: 400, easing: 'easeOutBounce' },
 *     { offset: 1, value: 200, easing: 'easeInOutCubic' }
 * ], { duration: 2000 });
 */
export function animateElementKeyframes(
    elementId: string,
    property: string,
    keyframes: AnimationKeyframe[],
    config: ElementAnimationConfig
): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) {
        console.warn(`animateElementKeyframes: Element ${elementId} not found`);
        return '';
    }

    if (keyframes.length < 2) {
        console.warn('animateElementKeyframes: Need at least 2 keyframes');
        return '';
    }

    // Sort by offset
    const sorted = [...keyframes].sort((a, b) => a.offset - b.offset);

    // Auto-fill offset=0 from current element value if missing
    if (sorted[0].offset > 0) {
        const currentVal = (element as any)[property];
        if (currentVal !== undefined) {
            sorted.unshift({ offset: 0, value: currentVal });
        }
    }
    // Auto-fill offset=1 if missing
    if (sorted[sorted.length - 1].offset < 1) {
        sorted.push({ offset: 1, value: sorted[sorted.length - 1].value });
    }

    const animId = generateAnimationId('kf');
    const targetProps = new Set<string>([property]);

    // Stop conflicting animations on this property
    stopConflictingAnimations(elementId, targetProps);

    // Register
    if (!activeAnimations.has(elementId)) {
        activeAnimations.set(elementId, new Map());
    }
    activeAnimations.get(elementId)!.set(animId, targetProps);

    animationEngine.create(
        animId,
        (progress: number) => {
            const value = interpolateKeyframes(sorted, progress);
            updateElement(elementId, { [property]: value } as Partial<DrawingElement>, false);
            config.onUpdate?.({ [property]: value } as Partial<ElementAnimationTarget>);
        },
        {
            duration: config.duration,
            easing: 'linear', // Global easing is linear — per-segment easings do the work
            delay: config.delay,
            onStart: config.onStart,
            onComplete: () => {
                const animIds = activeAnimations.get(elementId);
                if (animIds) {
                    animIds.delete(animId);
                    if (animIds.size === 0) activeAnimations.delete(elementId);
                }
                config.onComplete?.();
            },
            loop: config.loop,
            loopCount: config.loopCount,
            alternate: config.alternate
        }
    );

    animationEngine.start(animId);
    return animId;
}

/**
 * Stop an element animation
 */
export function stopElementAnimation(animationId: string): void {
    animationEngine.stop(animationId);
}

/**
 * Pause an element animation
 */
export function pauseElementAnimation(animationId: string): void {
    animationEngine.pause(animationId);
}

/**
 * Animate an element along an SVG path
 */
export function animateAlongPath(
    elementId: string,
    pathData: string,
    config: ElementAnimationConfig & { orientToPath?: boolean; isRelative?: boolean }
): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    // Parse path once
    const commands = PathUtils.parsePath(pathData);
    if (commands.length === 0) return '';

    const animId = generateAnimationId('path');

    const targetProps = new Set<string>(['x', 'y']);
    if (config.orientToPath) targetProps.add('angle');

    // Stop conflicting
    stopConflictingAnimations(elementId, targetProps);

    // Register
    if (!activeAnimations.has(elementId)) {
        activeAnimations.set(elementId, new Map());
    }
    activeAnimations.get(elementId)!.set(animId, targetProps);

    // Initial state
    const initialCenterX = element.x + element.width / 2;
    const initialCenterY = element.y + element.height / 2;
    const isRelative = config.isRelative ?? true; // Default to relative as it's more useful

    animationEngine.create(
        animId,
        (progress: number) => {
            const point = PathUtils.getPointOnPath(commands, progress);

            let finalX: number;
            let finalY: number;

            if (isRelative) {
                // Path (0,0) corresponds to Initial Center
                finalX = initialCenterX + point.x - element.width / 2;
                finalY = initialCenterY + point.y - element.height / 2;
            } else {
                // Path (0,0) corresponds to Canvas (0,0)
                finalX = point.x - element.width / 2;
                finalY = point.y - element.height / 2;
            }

            const updates: Partial<DrawingElement> = {
                x: finalX,
                y: finalY
            };

            if (config.orientToPath) {
                updates.angle = point.angle; // Use tangent angle (maybe add to originalAngle?)
            }

            updateElement(elementId, updates, false);

            // Callback
            config.onUpdate?.({ x: updates.x, y: updates.y, angle: updates.angle });
        },
        {
            duration: config.duration,
            easing: config.easing,
            delay: config.delay,
            onStart: config.onStart,
            onComplete: () => {
                const animIds = activeAnimations.get(elementId);
                if (animIds) {
                    animIds.delete(animId);
                    if (animIds.size === 0) activeAnimations.delete(elementId);
                }
                config.onComplete?.();
            },
            loop: config.loop,
            loopCount: config.loopCount,
            alternate: config.alternate
        }
    );

    animationEngine.start(animId);
    return animId;
}

/**
 * Resume a paused element animation
 */
export function resumeElementAnimation(animationId: string): void {
    animationEngine.start(animationId);
}


// ============================================
// Preset Animations
// ============================================

/**
 * Fade in an element
 */
export function fadeIn(elementId: string, duration: number = 300, config: ElementAnimationConfig = {}): string {
    // Set initial opacity to 0
    updateElement(elementId, { opacity: 0 }, false);
    return animateElement(elementId, { opacity: 100 }, {
        duration,
        easing: 'easeOutQuad',
        ...config
    });
}

/**
 * Fade out an element
 */
export function fadeOut(elementId: string, duration: number = 300, config: ElementAnimationConfig = {}): string {
    return animateElement(elementId, { opacity: 0 }, {
        duration,
        easing: 'easeOutQuad',
        ...config
    });
}

/**
 * Scale up from center (entrance)
 */
export function scaleIn(elementId: string, duration: number = 300, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    // Capture target values as constants to avoid drift from live reactive references
    const targetX = element.x;
    const targetY = element.y;
    const targetWidth = element.width;
    const targetHeight = element.height;
    const targetOpacity = 100;

    const centerX = targetX + targetWidth / 2;
    const centerY = targetY + targetHeight / 2;

    // Start small from center
    updateElement(elementId, {
        width: 0,
        height: 0,
        x: centerX,
        y: centerY,
        opacity: 0
    }, false);

    return animateElement(elementId, {
        width: targetWidth,
        height: targetHeight,
        x: targetX,
        y: targetY,
        opacity: targetOpacity
    }, {
        duration,
        easing: 'easeOutBack',
        onStart: config.onStart,
        onComplete: config.onComplete,
        delay: config.delay
    });
}

/**
 * Bounce effect (emphasis)
 */
export function bounce(elementId: string, duration: number = 450, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const intensity = config.intensity ?? 20;
    const originalY = element.y;
    const isInfinite = config.loop && (config.loopCount === undefined || config.loopCount === Infinity);

    if (isInfinite) {
        const doBounce = (isFirst: boolean) => {
            return animateElement(elementId, {
                y: originalY - intensity
            }, {
                duration: duration * 0.33,
                easing: 'easeOutQuad',
                delay: isFirst ? config.delay : 0,
                onStart: isFirst ? config.onStart : undefined,
                onComplete: () => {
                    animateElement(elementId, { y: originalY }, {
                        duration: duration * 0.67,
                        easing: 'easeOutBounce',
                        onComplete: () => doBounce(false)
                    });
                }
            });
        };
        return doBounce(true);
    }

    return animateElement(elementId, {
        y: originalY - intensity
    }, {
        duration: duration * 0.33,
        easing: 'easeOutQuad',
        delay: config.delay,
        onStart: config.onStart,
        onComplete: () => {
            animateElement(elementId, { y: originalY }, {
                duration: duration * 0.67,
                easing: 'easeOutBounce',
                onComplete: config.onComplete
            });
        }
    });
}

/**
 * Pulse effect (emphasis)
 */
export function pulse(elementId: string, duration: number = 300, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const scale = config.scale ?? 1.1;
    const originalWidth = element.width;
    const originalHeight = element.height;
    const originalX = element.x;
    const originalY = element.y;

    const targetWidth = originalWidth * scale;
    const targetHeight = originalHeight * scale;
    const offsetX = (targetWidth - originalWidth) / 2;
    const offsetY = (targetHeight - originalHeight) / 2;
    const isInfinite = config.loop && (config.loopCount === undefined || config.loopCount === Infinity);

    if (isInfinite) {
        const doPulse = (isFirst: boolean) => {
            return animateElement(elementId, {
                width: targetWidth,
                height: targetHeight,
                x: originalX - offsetX,
                y: originalY - offsetY
            }, {
                duration: duration / 2,
                easing: 'easeOutQuad',
                delay: isFirst ? config.delay : 0,
                onStart: isFirst ? config.onStart : undefined,
                onComplete: () => {
                    animateElement(elementId, {
                        width: originalWidth,
                        height: originalHeight,
                        x: originalX,
                        y: originalY
                    }, {
                        duration: duration / 2,
                        easing: 'easeOutQuad',
                        onComplete: () => doPulse(false)
                    });
                }
            });
        };
        return doPulse(true);
    }

    return animateElement(elementId, {
        width: targetWidth,
        height: targetHeight,
        x: originalX - offsetX,
        y: originalY - offsetY
    }, {
        duration: duration / 2,
        easing: 'easeOutQuad',
        delay: config.delay,
        onStart: config.onStart,
        onComplete: () => {
            animateElement(elementId, {
                width: originalWidth,
                height: originalHeight,
                x: originalX,
                y: originalY
            }, {
                duration: duration / 2,
                easing: 'easeOutQuad',
                onComplete: config.onComplete
            });
        }
    });
}

/**
 * Flash effect (attention seeker)
 */
export function flash(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return animateElement(elementId, { opacity: 0 }, {
        duration: duration / 4,
        easing: 'linear',
        loop: true,
        loopCount: 2,
        alternate: true,
        delay: config.delay,
        onStart: config.onStart,
        onComplete: config.onComplete
    });
}

/**
 * RubberBand effect (attention seeker)
 */
export function rubberBand(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const originalWidth = element.width;
    const originalHeight = element.height;
    const originalX = element.x;
    const originalY = element.y;

    // Phase 1: Stretch horizontal, squash vertical
    return animateElement(elementId, {
        width: originalWidth * 1.25,
        height: originalHeight * 0.75,
        x: originalX - (originalWidth * 0.25) / 2,
        y: originalY + (originalHeight * 0.25) / 2
    }, {
        duration: duration * 0.3,
        easing: 'easeOutQuad',
        delay: config.delay,
        onStart: config.onStart,
        onComplete: () => {
            // Phase 2: Stretch vertical, squash horizontal
            animateElement(elementId, {
                width: originalWidth * 0.75,
                height: originalHeight * 1.25,
                x: originalX + (originalWidth * 0.25) / 2,
                y: originalY - (originalHeight * 0.25) / 2
            }, {
                duration: duration * 0.3,
                easing: 'easeInOutQuad',
                onComplete: () => {
                    // Phase 3: Return to normal
                    animateElement(elementId, {
                        width: originalWidth,
                        height: originalHeight,
                        x: originalX,
                        y: originalY
                    }, {
                        duration: duration * 0.4,
                        easing: 'easeOutElastic',
                        onComplete: config.onComplete
                    });
                }
            });
        }
    });
}

/**
 * ShakeX effect (attention seeker)
 */
export function shakeX(elementId: string, duration: number = 400, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const intensity = config.intensity ?? 10;
    const originalX = element.x;
    const isInfinite = config.loop && (config.loopCount === undefined || config.loopCount === Infinity);

    if (isInfinite) {
        return animateElement(elementId, {
            x: originalX + intensity
        }, {
            duration: duration / 4,
            easing: 'linear',
            loop: true,
            loopCount: Infinity,
            alternate: true,
            delay: config.delay,
            onStart: config.onStart,
        });
    }

    return animateElement(elementId, {
        x: originalX + intensity
    }, {
        duration: duration / 4,
        easing: 'linear',
        loop: true,
        loopCount: 4,
        alternate: true,
        delay: config.delay,
        onStart: config.onStart,
        onComplete: () => {
            updateElement(elementId, { x: originalX }, false);
            config.onComplete?.();
        }
    });
}

/**
 * ShakeY effect (attention seeker)
 */
export function shakeY(elementId: string, duration: number = 400, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const intensity = config.intensity ?? 10;
    const originalY = element.y;
    const isInfinite = config.loop && (config.loopCount === undefined || config.loopCount === Infinity);

    if (isInfinite) {
        return animateElement(elementId, {
            y: originalY + intensity
        }, {
            duration: duration / 4,
            easing: 'linear',
            loop: true,
            loopCount: Infinity,
            alternate: true,
            delay: config.delay,
            onStart: config.onStart,
        });
    }

    return animateElement(elementId, {
        y: originalY + intensity
    }, {
        duration: duration / 4,
        easing: 'linear',
        loop: true,
        loopCount: 4,
        alternate: true,
        delay: config.delay,
        onStart: config.onStart,
        onComplete: () => {
            updateElement(elementId, { y: originalY }, false);
            config.onComplete?.();
        }
    });
}

/**
 * HeadShake effect (attention seeker)
 */
export function headShake(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const originalX = element.x;

    return animateElement(elementId, { x: originalX - 6 }, {
        duration: duration / 5,
        easing: 'easeInOutQuad',
        delay: config.delay,
        onStart: config.onStart,
        onComplete: () => {
            animateElement(elementId, { x: originalX + 5 }, {
                duration: duration / 5,
                easing: 'easeInOutQuad',
                onComplete: () => {
                    animateElement(elementId, { x: originalX - 3 }, {
                        duration: duration / 5,
                        easing: 'easeInOutQuad',
                        onComplete: () => {
                            animateElement(elementId, { x: originalX + 2 }, {
                                duration: duration / 5,
                                easing: 'easeInOutQuad',
                                onComplete: () => {
                                    animateElement(elementId, { x: originalX }, {
                                        duration: duration / 5,
                                        easing: 'easeInOutQuad',
                                        onComplete: config.onComplete
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

/**
 * Swing effect (attention seeker)
 */
export function swing(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const originalAngle = element.angle;

    return animateElement(elementId, { angle: originalAngle + 0.25 }, {
        duration: duration * 0.2,
        easing: 'linear',
        delay: config.delay,
        onStart: config.onStart,
        onComplete: () => {
            animateElement(elementId, { angle: originalAngle - 0.17 }, {
                duration: duration * 0.2,
                easing: 'linear',
                onComplete: () => {
                    animateElement(elementId, { angle: originalAngle + 0.08 }, {
                        duration: duration * 0.2,
                        easing: 'linear',
                        onComplete: () => {
                            animateElement(elementId, { angle: originalAngle - 0.05 }, {
                                duration: duration * 0.2,
                                easing: 'linear',
                                onComplete: () => {
                                    animateElement(elementId, { angle: originalAngle }, {
                                        duration: duration * 0.2,
                                        easing: 'linear',
                                        onComplete: config.onComplete
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

/**
 * Tada effect (attention seeker)
 */
export function tada(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const originalWidth = element.width;
    const originalHeight = element.height;
    const originalX = element.x;
    const originalY = element.y;
    const originalAngle = element.angle;

    return animateElement(elementId, {
        width: originalWidth * 0.9,
        height: originalHeight * 0.9,
        x: originalX + (originalWidth * 0.1) / 2,
        y: originalY + (originalHeight * 0.1) / 2,
        angle: originalAngle - 0.05
    }, {
        duration: duration * 0.1,
        easing: 'linear',
        delay: config.delay,
        onStart: config.onStart,
        onComplete: () => {
            animateElement(elementId, {
                width: originalWidth * 1.1,
                height: originalHeight * 1.1,
                x: originalX - (originalWidth * 0.1) / 2,
                y: originalY - (originalHeight * 0.1) / 2,
                angle: originalAngle + 0.05
            }, {
                duration: duration * 0.3,
                easing: 'linear',
                loop: true,
                loopCount: 3,
                alternate: true,
                onComplete: () => {
                    animateElement(elementId, {
                        width: originalWidth,
                        height: originalHeight,
                        x: originalX,
                        y: originalY,
                        angle: originalAngle
                    }, {
                        duration: duration * 0.1,
                        easing: 'linear',
                        onComplete: config.onComplete
                    });
                }
            });
        }
    });
}

/**
 * Wobble effect (attention seeker)
 */
export function wobble(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const originalX = element.x;
    const originalAngle = element.angle;

    return animateElement(elementId, {
        x: originalX - (element.width * 0.25),
        angle: originalAngle - 0.08
    }, {
        duration: duration * 0.15,
        easing: 'linear',
        delay: config.delay,
        onStart: config.onStart,
        onComplete: () => {
            animateElement(elementId, {
                x: originalX + (element.width * 0.2),
                angle: originalAngle + 0.05
            }, {
                duration: duration * 0.15,
                easing: 'linear',
                onComplete: () => {
                    animateElement(elementId, {
                        x: originalX - (element.width * 0.15),
                        angle: originalAngle - 0.05
                    }, {
                        duration: duration * 0.15,
                        easing: 'linear',
                        onComplete: () => {
                            animateElement(elementId, {
                                x: originalX + (element.width * 0.1),
                                angle: originalAngle + 0.03
                            }, {
                                duration: duration * 0.15,
                                easing: 'linear',
                                onComplete: () => {
                                    animateElement(elementId, {
                                        x: originalX,
                                        angle: originalAngle
                                    }, {
                                        duration: duration * 0.15,
                                        easing: 'linear',
                                        onComplete: config.onComplete
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

/**
 * Jello effect (attention seeker)
 */
export function jello(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const originalWidth = element.width;
    const originalHeight = element.height;
    const originalX = element.x;
    const originalY = element.y;

    return animateElement(elementId, {
        width: originalWidth * 1.1,
        height: originalHeight * 0.9,
        x: originalX - (originalWidth * 0.1) / 2,
        y: originalY + (originalHeight * 0.1) / 2
    }, {
        duration: duration * 0.2,
        easing: 'linear',
        delay: config.delay,
        onStart: config.onStart,
        onComplete: () => {
            animateElement(elementId, {
                width: originalWidth * 0.9,
                height: originalHeight * 1.1,
                x: originalX + (originalWidth * 0.1) / 2,
                y: originalY - (originalHeight * 0.1) / 2
            }, {
                duration: duration * 0.2,
                easing: 'linear',
                onComplete: () => {
                    animateElement(elementId, {
                        width: originalWidth * 1.05,
                        height: originalHeight * 0.95,
                        x: originalX - (originalWidth * 0.05) / 2,
                        y: originalY + (originalHeight * 0.05) / 2
                    }, {
                        duration: duration * 0.2,
                        easing: 'linear',
                        onComplete: () => {
                            animateElement(elementId, {
                                width: originalWidth,
                                height: originalHeight,
                                x: originalX,
                                y: originalY
                            }, {
                                duration: duration * 0.4,
                                easing: 'easeOutQuad',
                                onComplete: config.onComplete
                            });
                        }
                    });
                }
            });
        }
    });
}

/**
 * HeartBeat effect (attention seeker)
 */
export function heartBeat(elementId: string, duration: number = 1300, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const originalWidth = element.width;
    const originalHeight = element.height;
    const originalX = element.x;
    const originalY = element.y;

    return animateElement(elementId, {
        width: originalWidth * 1.3,
        height: originalHeight * 1.3,
        x: originalX - (originalWidth * 0.3) / 2,
        y: originalY - (originalHeight * 0.3) / 2
    }, {
        duration: duration * 0.2,
        easing: 'easeOutQuad',
        delay: config.delay,
        onStart: config.onStart,
        onComplete: () => {
            animateElement(elementId, {
                width: originalWidth,
                height: originalHeight,
                x: originalX,
                y: originalY
            }, {
                duration: duration * 0.2,
                easing: 'easeInQuad',
                onComplete: () => {
                    animateElement(elementId, {
                        width: originalWidth * 1.3,
                        height: originalHeight * 1.3,
                        x: originalX - (originalWidth * 0.3) / 2,
                        y: originalY - (originalHeight * 0.3) / 2
                    }, {
                        duration: duration * 0.2,
                        easing: 'easeOutQuad',
                        onComplete: () => {
                            animateElement(elementId, {
                                width: originalWidth,
                                height: originalHeight,
                                x: originalX,
                                y: originalY
                            }, {
                                duration: duration * 0.4,
                                easing: 'easeInQuad',
                                onComplete: config.onComplete
                            });
                        }
                    });
                }
            });
        }
    });
}

/**
 * Scale out (exit)
 */
export function scaleOut(elementId: string, duration: number = 300, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;

    return animateElement(elementId, {
        width: 0,
        height: 0,
        x: centerX,
        y: centerY,
        opacity: 0
    }, {
        duration,
        easing: 'easeInBack',
        onStart: config.onStart,
        onComplete: config.onComplete,
        delay: config.delay
    });
}

/**
 * Slide in from left (Smart Fly-In)
 */
export function slideInLeft(elementId: string, duration: number = 300, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const targetX = element.x;
    // Start just off-screen left (allowing for some padding)
    const startX = -element.width - 50;

    updateElement(elementId, { x: startX, opacity: 0 }, false);

    return animateElement(elementId, { x: targetX, opacity: 100 }, {
        duration,
        easing: 'easeOutQuad',
        ...config
    });
}

/**
 * Slide in from right (Smart Fly-In)
 */
export function slideInRight(elementId: string, duration: number = 300, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const targetX = element.x;
    // Start just off-screen right
    const startX = window.innerWidth + 50;

    updateElement(elementId, { x: startX, opacity: 0 }, false);

    return animateElement(elementId, { x: targetX, opacity: 100 }, {
        duration,
        easing: 'easeOutQuad',
        ...config
    });
}

/**
 * Slide in from top (Smart Fly-In)
 */
export function slideInUp(elementId: string, duration: number = 300, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const targetY = element.y;
    // Start just off-screen top
    const startY = -element.height - 50;

    updateElement(elementId, { y: startY, opacity: 0 }, false);

    return animateElement(elementId, { y: targetY, opacity: 100 }, {
        duration,
        easing: 'easeOutQuad',
        ...config
    });
}

/**
 * Slide in from bottom (Smart Fly-In)
 */
export function slideInDown(elementId: string, duration: number = 300, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const targetY = element.y;
    // Start just off-screen bottom
    const startY = window.innerHeight + 50;

    updateElement(elementId, { y: startY, opacity: 0 }, false);

    return animateElement(elementId, { y: targetY, opacity: 100 }, {
        duration,
        easing: 'easeOutQuad',
        ...config
    });
}

/**
 * Slide out to left
 */
export function slideOutLeft(elementId: string, duration: number = 300, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    return animateElement(elementId, { x: -element.width, opacity: 0 }, {
        duration,
        easing: 'easeInQuad',
        ...config
    });
}

/**
 * Slide out to right
 */
export function slideOutRight(elementId: string, duration: number = 300, config: ElementAnimationConfig = {}): string {
    return animateElement(elementId, { x: window.innerWidth + 100, opacity: 0 }, {
        duration,
        easing: 'easeInQuad',
        ...config
    });
}

/**
 * Slide out to top
 */
export function slideOutUp(elementId: string, duration: number = 300, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    return animateElement(elementId, { y: -element.height, opacity: 0 }, {
        duration,
        easing: 'easeInQuad',
        ...config
    });
}

/**
 * Slide out to bottom
 */
export function slideOutDown(elementId: string, duration: number = 300, config: ElementAnimationConfig = {}): string {
    return animateElement(elementId, { y: window.innerHeight + 100, opacity: 0 }, {
        duration,
        easing: 'easeInQuad',
        ...config
    });
}


/**
 * Back entrances common logic
 */
function backIn(elementId: string, from: { x?: number, y?: number }, duration: number, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const targetX = element.x;
    const targetY = element.y;

    // Start from off-screen and slightly scaled down
    updateElement(elementId, {
        x: from.x ?? targetX,
        y: from.y ?? targetY,
        opacity: 70,
        width: element.width * 0.7,
        height: element.height * 0.7
    }, false);

    return animateElement(elementId, {
        x: targetX,
        y: targetY,
        opacity: 100,
        width: element.width,
        height: element.height
    }, {
        duration,
        easing: 'easeOutBack',
        ...config
    });
}

export function backInDown(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return backIn(elementId, { y: -window.innerHeight }, duration, config);
}

export function backInLeft(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return backIn(elementId, { x: -window.innerWidth }, duration, config);
}

export function backInRight(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return backIn(elementId, { x: window.innerWidth + 100 }, duration, config);
}

export function backInUp(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return backIn(elementId, { y: window.innerHeight + 100 }, duration, config);
}

/**
 * Back exits common logic
 */
function backOut(elementId: string, to: { x?: number, y?: number }, duration: number, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    return animateElement(elementId, {
        x: to.x ?? element.x,
        y: to.y ?? element.y,
        opacity: 0,
        width: element.width * 0.7,
        height: element.height * 0.7
    }, {
        duration,
        easing: 'easeInBack',
        ...config
    });
}

export function backOutDown(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return backOut(elementId, { y: window.innerHeight + 100 }, duration, config);
}

export function backOutLeft(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return backOut(elementId, { x: -window.innerWidth }, duration, config);
}

export function backOutRight(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return backOut(elementId, { x: window.innerWidth + 100 }, duration, config);
}

export function backOutUp(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return backOut(elementId, { y: -window.innerHeight }, duration, config);
}

/**
 * Bouncing entrances common logic
 */
function bounceInEffect(elementId: string, from: { x?: number, y?: number }, duration: number, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const targetX = element.x;
    const targetY = element.y;

    updateElement(elementId, {
        x: from.x ?? targetX,
        y: from.y ?? targetY,
        opacity: 0,
        width: element.width * 0.3,
        height: element.height * 0.3
    }, false);

    return animateElement(elementId, {
        x: targetX,
        y: targetY,
        opacity: 100,
        width: element.width,
        height: element.height
    }, {
        duration,
        easing: 'easeOutBounce',
        ...config
    });
}

export function bounceIn(elementId: string, duration: number = 750, config: ElementAnimationConfig = {}): string {
    return bounceInEffect(elementId, {}, duration, config);
}

export function bounceInDown(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return bounceInEffect(elementId, { y: -window.innerHeight }, duration, config);
}

export function bounceInLeft(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return bounceInEffect(elementId, { x: -window.innerWidth }, duration, config);
}

export function bounceInRight(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return bounceInEffect(elementId, { x: window.innerWidth + 100 }, duration, config);
}

export function bounceInUp(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return bounceInEffect(elementId, { y: window.innerHeight + 100 }, duration, config);
}

/**
 * Bouncing exits common logic
 */
function bounceOutEffect(elementId: string, to: { x?: number, y?: number }, duration: number, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    return animateElement(elementId, {
        x: to.x ?? element.x,
        y: to.y ?? element.y,
        opacity: 0,
        width: element.width * 0.3,
        height: element.height * 0.3
    }, {
        duration,
        easing: 'easeInBounce',
        ...config
    });
}

export function bounceOut(elementId: string, duration: number = 750, config: ElementAnimationConfig = {}): string {
    return bounceOutEffect(elementId, {}, duration, config);
}

export function bounceOutDown(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return bounceOutEffect(elementId, { y: window.innerHeight + 100 }, duration, config);
}

export function bounceOutLeft(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return bounceOutEffect(elementId, { x: -window.innerWidth }, duration, config);
}

export function bounceOutRight(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return bounceOutEffect(elementId, { x: window.innerWidth + 100 }, duration, config);
}

export function bounceOutUp(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return bounceOutEffect(elementId, { y: -window.innerHeight }, duration, config);
}


/**
 * Fading entrances common logic
 */
function fadeInEffect(elementId: string, from: { x?: number, y?: number }, duration: number, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const targetX = element.x;
    const targetY = element.y;

    updateElement(elementId, {
        x: from.x ?? targetX,
        y: from.y ?? targetY,
        opacity: 0
    }, false);

    return animateElement(elementId, {
        x: targetX,
        y: targetY,
        opacity: 100
    }, {
        duration,
        easing: 'easeOutQuad',
        ...config
    });
}

export function fadeInDown(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeInEffect(elementId, { y: store.selection.length > 0 ? -100 : -100 }, duration, config); // Simplified offset
}

export function fadeInDownBig(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeInEffect(elementId, { y: -window.innerHeight }, duration, config);
}

export function fadeInLeft(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeInEffect(elementId, { x: -100 }, duration, config);
}

export function fadeInLeftBig(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeInEffect(elementId, { x: -window.innerWidth }, duration, config);
}

export function fadeInRight(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeInEffect(elementId, { x: window.innerWidth + 100 }, duration, config);
}

export function fadeInRightBig(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeInEffect(elementId, { x: window.innerWidth + 2000 }, duration, config); // Use large value for "Big"
}

export function fadeInUp(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeInEffect(elementId, { y: 100 }, duration, config);
}

export function fadeInUpBig(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeInEffect(elementId, { y: window.innerHeight + 100 }, duration, config);
}

export function fadeInTopLeft(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeInEffect(elementId, { x: -100, y: -100 }, duration, config);
}

export function fadeInTopRight(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeInEffect(elementId, { x: 100, y: -100 }, duration, config);
}

export function fadeInBottomLeft(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeInEffect(elementId, { x: -100, y: 100 }, duration, config);
}

export function fadeInBottomRight(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeInEffect(elementId, { x: 100, y: 100 }, duration, config);
}

/**
 * Fading exits common logic
 */
function fadeOutEffect(elementId: string, to: { x?: number, y?: number }, duration: number, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    return animateElement(elementId, {
        x: to.x ?? element.x,
        y: to.y ?? element.y,
        opacity: 0
    }, {
        duration,
        easing: 'easeInQuad',
        ...config
    });
}

export function fadeOutDown(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeOutEffect(elementId, { y: 100 }, duration, config);
}

export function fadeOutDownBig(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeOutEffect(elementId, { y: window.innerHeight + 100 }, duration, config);
}

export function fadeOutLeft(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeOutEffect(elementId, { x: -100 }, duration, config);
}

export function fadeOutLeftBig(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeOutEffect(elementId, { x: -window.innerWidth }, duration, config);
}

export function fadeOutRight(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeOutEffect(elementId, { x: 100 }, duration, config);
}

export function fadeOutRightBig(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeOutEffect(elementId, { x: window.innerWidth + 100 }, duration, config);
}

export function fadeOutUp(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeOutEffect(elementId, { y: -100 }, duration, config);
}

export function fadeOutUpBig(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeOutEffect(elementId, { y: -window.innerHeight }, duration, config);
}

export function fadeOutTopLeft(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeOutEffect(elementId, { x: -100, y: -100 }, duration, config);
}

export function fadeOutTopRight(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeOutEffect(elementId, { x: 100, y: -100 }, duration, config);
}

export function fadeOutBottomLeft(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeOutEffect(elementId, { x: -100, y: 100 }, duration, config);
}

export function fadeOutBottomRight(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return fadeOutEffect(elementId, { x: 100, y: 100 }, duration, config);
}


/**
 * Flippers presets
 */
export function flip(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const originalAngle = element.angle;

    return animateElement(elementId, { angle: originalAngle + Math.PI }, {
        duration: duration / 2,
        easing: 'easeInOutQuad',
        delay: config.delay,
        onStart: config.onStart,
        onComplete: () => {
            animateElement(elementId, { angle: originalAngle + Math.PI * 2 }, {
                duration: duration / 2,
                easing: 'easeInOutQuad',
                onComplete: () => {
                    updateElement(elementId, { angle: originalAngle }, false);
                    config.onComplete?.();
                }
            });
        }
    });
}

export function flipInX(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    // Simulating flipX with height change
    const targetHeight = element.height;
    updateElement(elementId, { height: 0, opacity: 0 }, false);

    return animateElement(elementId, { height: targetHeight, opacity: 100 }, {
        duration,
        easing: 'easeOutQuad',
        ...config
    });
}

export function flipInY(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    // Simulating flipY with width change
    const targetWidth = element.width;
    updateElement(elementId, { width: 0, opacity: 0 }, false);

    return animateElement(elementId, { width: targetWidth, opacity: 100 }, {
        duration,
        easing: 'easeOutQuad',
        ...config
    });
}

export function flipOutX(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return animateElement(elementId, { height: 0, opacity: 0 }, {
        duration,
        easing: 'easeInQuad',
        ...config
    });
}

export function flipOutY(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return animateElement(elementId, { width: 0, opacity: 0 }, {
        duration,
        easing: 'easeInQuad',
        ...config
    });
}

/**
 * Lightspeed presets
 */
export function lightSpeedInRight(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const targetX = element.x;
    // Approach from right, fast and slightly tilted (simulated tilt with x offset per loop if needed)
    updateElement(elementId, { x: window.innerWidth + 100, opacity: 0 }, false);

    return animateElement(elementId, { x: targetX, opacity: 100 }, {
        duration,
        easing: 'easeOutExpo',
        ...config
    });
}

export function lightSpeedInLeft(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const targetX = element.x;
    updateElement(elementId, { x: -window.innerWidth, opacity: 0 }, false);

    return animateElement(elementId, { x: targetX, opacity: 100 }, {
        duration,
        easing: 'easeOutExpo',
        ...config
    });
}

export function lightSpeedOutRight(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return animateElement(elementId, { x: window.innerWidth + 100, opacity: 0 }, {
        duration,
        easing: 'easeInExpo',
        ...config
    });
}

export function lightSpeedOutLeft(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return animateElement(elementId, { x: -window.innerWidth, opacity: 0 }, {
        duration,
        easing: 'easeInExpo',
        ...config
    });
}

/**
 * Rotating presets
 */
function rotateInEffect(elementId: string, from: { x?: number, y?: number, angle?: number }, duration: number, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const targetX = element.x;
    const targetY = element.y;
    const targetAngle = element.angle;

    updateElement(elementId, {
        x: from.x ?? targetX,
        y: from.y ?? targetY,
        angle: from.angle ?? (targetAngle - Math.PI * 2),
        opacity: 0
    }, false);

    return animateElement(elementId, {
        x: targetX,
        y: targetY,
        angle: targetAngle,
        opacity: 100
    }, {
        duration,
        easing: 'easeOutQuad',
        ...config
    });
}

export function rotateIn(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return rotateInEffect(elementId, {}, duration, config);
}

export function rotateInDownLeft(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return rotateInEffect(elementId, { x: -100, y: -100, angle: -Math.PI / 2 }, duration, config);
}

export function rotateInDownRight(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return rotateInEffect(elementId, { x: 100, y: -100, angle: Math.PI / 2 }, duration, config);
}

export function rotateInUpLeft(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return rotateInEffect(elementId, { x: -100, y: 100, angle: Math.PI / 2 }, duration, config);
}

export function rotateInUpRight(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return rotateInEffect(elementId, { x: 100, y: 100, angle: -Math.PI / 2 }, duration, config);
}

/**
 * Rotating exits
 */
function rotateOutEffect(elementId: string, to: { x?: number, y?: number, angle?: number }, duration: number, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    return animateElement(elementId, {
        x: to.x ?? element.x,
        y: to.y ?? element.y,
        angle: to.angle ?? (element.angle + Math.PI * 2),
        opacity: 0
    }, {
        duration,
        easing: 'easeInQuad',
        ...config
    });
}

export function rotateOut(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return rotateOutEffect(elementId, {}, duration, config);
}

export function rotateOutDownLeft(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return rotateOutEffect(elementId, { x: -100, y: 100, angle: Math.PI / 2 }, duration, config);
}

export function rotateOutDownRight(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return rotateOutEffect(elementId, { x: 100, y: 100, angle: -Math.PI / 2 }, duration, config);
}

export function rotateOutUpLeft(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return rotateOutEffect(elementId, { x: -100, y: -100, angle: -Math.PI / 2 }, duration, config);
}

export function rotateOutUpRight(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return rotateOutEffect(elementId, { x: 100, y: -100, angle: Math.PI / 2 }, duration, config);
}


/**
 * Revolve an element in a circular path
 */
export function revolve(elementId: string, duration: number = 2000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const params = (config as any).params || {};
    const radius = params.radius ?? 50;

    const startX = element.x;
    const startY = element.y;
    const centerX = startX + radius;
    const centerY = startY;

    const targetProps = new Set<string>(['x', 'y']);

    const animId = generateAnimationId('revolve');
    stopConflictingAnimations(elementId, targetProps);

    if (!activeAnimations.has(elementId)) {
        activeAnimations.set(elementId, new Map());
    }
    activeAnimations.get(elementId)!.set(animId, targetProps);

    animationEngine.create(
        animId,
        (progress: number) => {
            const angle = progress * Math.PI * 2;
            const x = centerX - radius * Math.cos(angle);
            const y = centerY - radius * Math.sin(angle);
            updateElement(elementId, { x, y }, false);
        },
        {
            duration,
            easing: config.easing || 'linear',
            delay: config.delay,
            loop: config.loop,
            loopCount: config.loopCount,
            alternate: config.alternate,
            onComplete: () => {
                const animIds = activeAnimations.get(elementId);
                if (animIds) {
                    animIds.delete(animId);
                    if (animIds.size === 0) activeAnimations.delete(elementId);
                }
                config.onComplete?.();
            }
        }
    );

    animationEngine.start(animId);
    return animId;
}

/**
 * Specials presets
 */
export function hinge(elementId: string, duration: number = 2000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const originalAngle = element.angle;

    // Phase 1: Swing down
    return animateElement(elementId, { angle: originalAngle + 1.2 }, {
        duration: duration * 0.4,
        easing: 'easeInOutQuad',
        alternate: true,
        loop: true,
        loopCount: 2,
        delay: config.delay,
        onStart: config.onStart,
        onComplete: () => {
            // Phase 2: Drop off screen
            animateElement(elementId, { y: window.innerHeight + 500, opacity: 0 }, {
                duration: duration * 0.6,
                easing: 'easeInQuad',
                onComplete: config.onComplete
            });
        }
    });
}

export function jackInTheBox(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const targetWidth = element.width;
    const targetHeight = element.height;
    const targetX = element.x;
    const targetY = element.y;

    updateElement(elementId, {
        width: 0,
        height: 0,
        x: targetX + targetWidth / 2,
        y: targetY + targetHeight / 2,
        angle: -0.5,
        opacity: 0
    }, false);

    return animateElement(elementId, {
        width: targetWidth,
        height: targetHeight,
        x: targetX,
        y: targetY,
        angle: 0,
        opacity: 100
    }, {
        duration,
        easing: 'easeOutBack',
        ...config
    });
}

export function rollIn(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const targetX = element.x;
    updateElement(elementId, { x: targetX - 400, angle: -Math.PI * 2, opacity: 0 }, false);

    return animateElement(elementId, { x: targetX, angle: 0, opacity: 100 }, {
        duration,
        easing: 'easeOutQuad',
        ...config
    });
}

export function rollOut(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    return animateElement(elementId, { x: element.x + 400, angle: Math.PI * 2, opacity: 0 }, {
        duration,
        easing: 'easeInQuad',
        ...config
    });
}

/**
 * Zooming presets
 */
function zoomInEffect(elementId: string, from: { x?: number, y?: number, scale?: number }, duration: number, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const targetX = element.x;
    const targetY = element.y;
    const targetWidth = element.width;
    const targetHeight = element.height;

    const scale = from.scale ?? 0.1;
    const startWidth = targetWidth * scale;
    const startHeight = targetHeight * scale;
    const startX = (from.x ?? targetX) + (targetWidth - startWidth) / 2;
    const startY = (from.y ?? targetY) + (targetHeight - startHeight) / 2;

    updateElement(elementId, {
        x: startX,
        y: startY,
        width: startWidth,
        height: startHeight,
        opacity: 0
    }, false);

    return animateElement(elementId, {
        x: targetX,
        y: targetY,
        width: targetWidth,
        height: targetHeight,
        opacity: 100
    }, {
        duration,
        easing: 'easeOutQuad',
        ...config
    });
}

export function zoomIn(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return zoomInEffect(elementId, {}, duration, config);
}

export function zoomInDown(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return zoomInEffect(elementId, { y: -window.innerHeight }, duration, config);
}

export function zoomInLeft(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return zoomInEffect(elementId, { x: -window.innerWidth }, duration, config);
}

export function zoomInRight(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return zoomInEffect(elementId, { x: window.innerWidth + 100 }, duration, config);
}

export function zoomInUp(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return zoomInEffect(elementId, { y: window.innerHeight + 100 }, duration, config);
}

/**
 * Zooming exits
 */
function zoomOutEffect(elementId: string, to: { x?: number, y?: number, scale?: number }, duration: number, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const scale = to.scale ?? 0.1;

    return animateElement(elementId, {
        x: (to.x ?? element.x) + (element.width * (1 - scale)) / 2,
        y: (to.y ?? element.y) + (element.height * (1 - scale)) / 2,
        width: element.width * scale,
        height: element.height * scale,
        opacity: 0
    }, {
        duration,
        easing: 'easeInQuad',
        ...config
    });
}

export function zoomOut(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return zoomOutEffect(elementId, {}, duration, config);
}

export function zoomOutDown(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return zoomOutEffect(elementId, { y: window.innerHeight + 100 }, duration, config);
}

export function zoomOutLeft(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return zoomOutEffect(elementId, { x: -window.innerWidth }, duration, config);
}

export function zoomOutRight(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return zoomOutEffect(elementId, { x: window.innerWidth + 100 }, duration, config);
}

export function zoomOutUp(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    return zoomOutEffect(elementId, { y: -window.innerHeight }, duration, config);
}

// ============================================
// Draw In / Draw Out Effects
// ============================================

/**
 * Draw In effect (entrance) - Progressively draws the shape's stroke,
 * then fades in fill, then reveals text.
 * Uses drawProgress 0->100 which ShapeRenderer interprets for phased rendering.
 * Sets opacity to 0 to hide the original element; renderDrawProgress overrides alpha.
 */
export function drawIn(elementId: string, duration: number = 1500, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const targetOpacity = element.opacity ?? 100;

    // Hide original element (opacity:0) and set drawProgress to 0.
    // opacity:0 ensures the normal render path produces nothing,
    // and also triggers SolidJS reactivity for canvas re-render.
    updateElement(elementId, { drawProgress: 0, opacity: 0 }, false);

    return animateElement(elementId, { drawProgress: 100 }, {
        duration,
        easing: 'easeInOutQuad',
        ...config,
        onComplete: () => {
            // Restore opacity and clear drawProgress so normal render pipeline takes over
            updateElement(elementId, { drawProgress: undefined, opacity: targetOpacity } as any, false);
            config.onComplete?.();
        }
    });
}

/**
 * Draw Out effect (exit) - Reverse of drawIn: stroke progressively disappears,
 * fill fades out, text disappears first.
 */
export function drawOut(elementId: string, duration: number = 1500, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const targetOpacity = element.opacity ?? 100;

    // Start fully drawn, hide via opacity so normal render produces nothing
    updateElement(elementId, { drawProgress: 100, opacity: 0 }, false);

    return animateElement(elementId, { drawProgress: 0 }, {
        duration,
        easing: 'easeInOutQuad',
        ...config,
        onComplete: () => {
            updateElement(elementId, { drawProgress: undefined, opacity: targetOpacity } as any, false);
            config.onComplete?.();
        }
    });
}

// ============================================
// Play Element's Configured Animation
// ============================================

// Store original states for elements currently being animated for preview
// This prevents "drift" when animations are interrupted or rapid-fired
const previewBaseStates = new Map<string, any>();

/**
 * Get the original state of an element before preview animation started
 */
export function getElementPreviewBaseState(elementId: string): any | undefined {
    return previewBaseStates.get(elementId);
}

/**
 * Play the entrance animation configured on an element
 * NOTE: Restores element to original state after animation completes (for preview purposes)
 */
export function playEntranceAnimation(elementId: string, options: { isPreview?: boolean, onComplete?: () => void } = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const animation = element.entranceAnimation ?? 'none';
    const duration = (element as any).animationDuration ?? 300;
    const { isPreview = true, onComplete } = options;

    // Capture or retrieve original state to restore after animation
    // If an animation is already running, we MUST use the already captured base state
    // to prevent capturing an intermediate "in-flight" state.
    if (isPreview && !previewBaseStates.has(elementId)) {
        previewBaseStates.set(elementId, {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            opacity: element.opacity,
            angle: element.angle,
            drawProgress: undefined
        });
    }
    const originalState = isPreview ? previewBaseStates.get(elementId) : null;

    const restoreState = () => {
        if (isPreview && originalState) {
            updateElement(elementId, originalState, false);
            previewBaseStates.delete(elementId);
        }
        onComplete?.();
    };

    const config = { onComplete: restoreState };

    switch (animation) {
        // Fading
        case 'fadeIn':
            updateElement(elementId, { opacity: 0 }, false);
            return animateElement(elementId, { opacity: 100 }, { duration, easing: 'easeOutQuad', onComplete: restoreState });
        case 'fadeInDown': return fadeInDown(elementId, duration, config);
        case 'fadeInDownBig': return fadeInDownBig(elementId, duration, config);
        case 'fadeInLeft': return fadeInLeft(elementId, duration, config);
        case 'fadeInLeftBig': return fadeInLeftBig(elementId, duration, config);
        case 'fadeInRight': return fadeInRight(elementId, duration, config);
        case 'fadeInRightBig': return fadeInRightBig(elementId, duration, config);
        case 'fadeInUp': return fadeInUp(elementId, duration, config);
        case 'fadeInUpBig': return fadeInUpBig(elementId, duration, config);
        case 'fadeInTopLeft': return fadeInTopLeft(elementId, duration, config);
        case 'fadeInTopRight': return fadeInTopRight(elementId, duration, config);
        case 'fadeInBottomLeft': return fadeInBottomLeft(elementId, duration, config);
        case 'fadeInBottomRight': return fadeInBottomRight(elementId, duration, config);

        // Attention seekers
        case 'bounce': return bounce(elementId, duration, config);
        case 'flash': return flash(elementId, duration, config);
        case 'pulse': return pulse(elementId, duration, { scale: 1.1, ...config });
        case 'rubberBand': return rubberBand(elementId, duration, config);
        case 'shakeX': return shakeX(elementId, duration, { intensity: 10, ...config });
        case 'shakeY': return shakeY(elementId, duration, { intensity: 10, ...config });
        case 'headShake': return headShake(elementId, duration);
        case 'swing': return swing(elementId, duration);
        case 'tada': return tada(elementId, duration);
        case 'wobble': return wobble(elementId, duration);
        case 'jello': return jello(elementId, duration);
        case 'heartBeat': return heartBeat(elementId, duration);

        // Back entrances
        case 'backInDown': return backInDown(elementId, duration, config);
        case 'backInLeft': return backInLeft(elementId, duration, config);
        case 'backInRight': return backInRight(elementId, duration, config);
        case 'backInUp': return backInUp(elementId, duration, config);

        // Bouncing entrances
        case 'bounceIn': return bounceIn(elementId, duration, config);
        case 'bounceInDown': return bounceInDown(elementId, duration, config);
        case 'bounceInLeft': return bounceInLeft(elementId, duration, config);
        case 'bounceInRight': return bounceInRight(elementId, duration, config);
        case 'bounceInUp': return bounceInUp(elementId, duration, config);

        // Zooming entrances
        case 'zoomIn': return zoomIn(elementId, duration, config);
        case 'zoomInDown': return zoomInDown(elementId, duration, config);
        case 'zoomInLeft': return zoomInLeft(elementId, duration, config);
        case 'zoomInRight': return zoomInRight(elementId, duration, config);
        case 'zoomInUp': return zoomInUp(elementId, duration, config);

        // Sliding entrances
        case 'slideInDown': {
            const targetY = element.y;
            updateElement(elementId, { y: -element.height, opacity: 0 }, false);
            return animateElement(elementId, { y: targetY, opacity: 100 }, { duration, easing: 'easeOutQuad', onComplete: restoreState });
        }
        case 'slideInLeft': {
            const targetX = element.x;
            updateElement(elementId, { x: -element.width, opacity: 0 }, false);
            return animateElement(elementId, { x: targetX, opacity: 100 }, { duration, easing: 'easeOutQuad', onComplete: restoreState });
        }
        case 'slideInRight': {
            const targetX = element.x;
            updateElement(elementId, { x: window.innerWidth + 100, opacity: 0 }, false);
            return animateElement(elementId, { x: targetX, opacity: 100 }, { duration, easing: 'easeOutQuad', onComplete: restoreState });
        }
        case 'slideInUp': {
            const targetY = element.y;
            updateElement(elementId, { y: window.innerHeight + 100, opacity: 0 }, false);
            return animateElement(elementId, { y: targetY, opacity: 100 }, { duration, easing: 'easeOutQuad', onComplete: restoreState });
        }

        // Rotating entrances
        case 'rotateIn': return rotateIn(elementId, duration, config);
        case 'rotateInDownLeft': return rotateInDownLeft(elementId, duration, config);
        case 'rotateInDownRight': return rotateInDownRight(elementId, duration, config);
        case 'rotateInUpLeft': return rotateInUpLeft(elementId, duration, config);
        case 'rotateInUpRight': return rotateInUpRight(elementId, duration, config);

        // Flippers
        case 'flip': return flip(elementId, duration, config);
        case 'flipInX': return flipInX(elementId, duration, config);
        case 'flipInY': return flipInY(elementId, duration, config);

        // Lightspeed
        case 'lightSpeedInRight': return lightSpeedInRight(elementId, duration, config);
        case 'lightSpeedInLeft': return lightSpeedInLeft(elementId, duration, config);

        // Specials
        case 'rollIn': return rollIn(elementId, duration, config);
        case 'jackInTheBox': return jackInTheBox(elementId, duration, config);

        case 'scaleIn':
            return scaleIn(elementId, duration, config);

        case 'drawIn':
            return drawIn(elementId, duration, config);

        default:
            return '';
    }
}

/**
 * Play the exit animation configured on an element
 * NOTE: Restores element to original state after animation completes (for preview purposes)
 */
export function playExitAnimation(elementId: string, options: { isPreview?: boolean, onComplete?: () => void } = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const animation = (element as any).exitAnimation ?? 'none';
    const duration = (element as any).animationDuration ?? 300;
    const { isPreview = true, onComplete } = options;

    // Capture or retrieve original state to restore after animation
    if (isPreview && !previewBaseStates.has(elementId)) {
        previewBaseStates.set(elementId, {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            opacity: element.opacity,
            angle: element.angle,
            drawProgress: undefined
        });
    }
    const originalState = isPreview ? previewBaseStates.get(elementId) : null;

    const restoreState = () => {
        if (isPreview && originalState) {
            updateElement(elementId, originalState, false);
            previewBaseStates.delete(elementId);
        }
        onComplete?.();
    };

    const config = { onComplete: restoreState };

    switch (animation) {
        // Fading
        case 'fadeOut':
            return animateElement(elementId, { opacity: 0 }, { duration, easing: 'easeOutQuad', onComplete: restoreState });
        case 'fadeOutDown': return fadeOutDown(elementId, duration, config);
        case 'fadeOutDownBig': return fadeOutDownBig(elementId, duration, config);
        case 'fadeOutLeft': return fadeOutLeft(elementId, duration, config);
        case 'fadeOutLeftBig': return fadeOutLeftBig(elementId, duration, config);
        case 'fadeOutRight': return fadeOutRight(elementId, duration, config);
        case 'fadeOutRightBig': return fadeOutRightBig(elementId, duration, config);
        case 'fadeOutUp': return fadeOutUp(elementId, duration, config);
        case 'fadeOutUpBig': return fadeOutUpBig(elementId, duration, config);
        case 'fadeOutTopLeft': return fadeOutTopLeft(elementId, duration, config);
        case 'fadeOutTopRight': return fadeOutTopRight(elementId, duration, config);
        case 'fadeOutBottomLeft': return fadeOutBottomLeft(elementId, duration, config);
        case 'fadeOutBottomRight': return fadeOutBottomRight(elementId, duration, config);

        // Back exits
        case 'backOutDown': return backOutDown(elementId, duration, config);
        case 'backOutLeft': return backOutLeft(elementId, duration, config);
        case 'backOutRight': return backOutRight(elementId, duration, config);
        case 'backOutUp': return backOutUp(elementId, duration, config);

        // Bouncing exits
        case 'bounceOut': return bounceOut(elementId, duration, config);
        case 'bounceOutDown': return bounceOutDown(elementId, duration, config);
        case 'bounceOutLeft': return bounceOutLeft(elementId, duration, config);
        case 'bounceOutRight': return bounceOutRight(elementId, duration, config);
        case 'bounceOutUp': return bounceOutUp(elementId, duration, config);

        // Zooming exits
        case 'zoomOut': return zoomOut(elementId, duration, config);
        case 'zoomOutDown': return zoomOutDown(elementId, duration, config);
        case 'zoomOutLeft': return zoomOutLeft(elementId, duration, config);
        case 'zoomOutRight': return zoomOutRight(elementId, duration, config);
        case 'zoomOutUp': return zoomOutUp(elementId, duration, config);

        // Sliding exits
        case 'slideOutDown':
            return animateElement(elementId, { y: window.innerHeight + 100, opacity: 0 }, { duration, easing: 'easeInQuad', onComplete: restoreState });
        case 'slideOutLeft':
            return animateElement(elementId, { x: -element.width, opacity: 0 }, { duration, easing: 'easeInQuad', onComplete: restoreState });
        case 'slideOutRight':
            return animateElement(elementId, { x: window.innerWidth + 100, opacity: 0 }, { duration, easing: 'easeInQuad', onComplete: restoreState });
        case 'slideOutUp':
            return animateElement(elementId, { y: -element.height, opacity: 0 }, { duration, easing: 'easeInQuad', onComplete: restoreState });

        // Attention seekers
        case 'bounce': return bounce(elementId, duration, config);
        case 'flash': return flash(elementId, duration, config);
        case 'pulse': return pulse(elementId, duration, { scale: 1.1, ...config });
        case 'rubberBand': return rubberBand(elementId, duration, config);
        case 'shakeX': return shakeX(elementId, duration, { intensity: 10, ...config });
        case 'shakeY': return shakeY(elementId, duration, { intensity: 10, ...config });

        // Rotating exits
        case 'rotateOut': return rotateOut(elementId, duration, config);
        case 'rotateOutDownLeft': return rotateOutDownLeft(elementId, duration, config);
        case 'rotateOutDownRight': return rotateOutDownRight(elementId, duration, config);
        case 'rotateOutUpLeft': return rotateOutUpLeft(elementId, duration, config);
        case 'rotateOutUpRight': return rotateOutUpRight(elementId, duration, config);

        // Flippers
        case 'flipOutX': return flipOutX(elementId, duration, config);
        case 'flipOutY': return flipOutY(elementId, duration, config);

        // Lightspeed
        case 'lightSpeedOutRight': return lightSpeedOutRight(elementId, duration, config);
        case 'lightSpeedOutLeft': return lightSpeedOutLeft(elementId, duration, config);

        // Specials
        case 'rollOut': return rollOut(elementId, duration, config);
        case 'hinge': return hinge(elementId, duration, config);

        case 'scaleOut':
            return scaleOut(elementId, duration, config);

        case 'drawOut':
            return drawOut(elementId, duration, config);

        default:
            return '';
    }
}

/**
 * Animate one shape morphing into another
 */
export function animateMorph(
    elementId: string,
    targetShape: string,
    config: ElementAnimationConfig
): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const animId = generateAnimationId('morph');
    const targetProps = new Set<string>(['points', 'type']);

    stopConflictingAnimations(elementId, targetProps);
    if (!activeAnimations.has(elementId)) {
        activeAnimations.set(elementId, new Map());
    }
    activeAnimations.get(elementId)!.set(animId, targetProps);

    // 1. Prepare Start and End Geometry
    const samples = 120; // High resolution for smoothness
    const rawStartPoints = MorphUtils.getPointsFromElement(element);
    const rawEndPoints = MorphUtils.getPointsFromElement(element, targetShape);

    // 2. Resample to equal point counts
    const startPoints = MorphUtils.resamplePolygon(rawStartPoints, samples);
    let endPoints = MorphUtils.resamplePolygon(rawEndPoints, samples);

    // 3. Align to minimize rotation/twisting
    endPoints = MorphUtils.alignPolygons(startPoints, endPoints);

    // Store original type to restore later
    // Store original type for potential rollback

    console.log('[Morph] Starting morph:', element.type, '→', targetShape, 'samples:', samples);

    animationEngine.create(
        animId,
        (progress: number) => {
            console.log('[Morph] Progress:', progress.toFixed(3));
            // Interpolate
            const currentPoints = MorphUtils.interpolatePoints(startPoints, endPoints, progress);

            // DIFFERENT APPROACH: Render directly to canvas instead of updating store
            // This bypasses the reactive system entirely
            // We'll update the element's points at the END, but render live during animation

            // Store the current morph state on the element for the renderer to pick up
            const idx = store.elements.findIndex(e => e.id === elementId);
            if (idx !== -1) {
                // Update the element with current morph points
                // Force a new object reference to trigger reactivity
                const newElements = [...store.elements];
                newElements[idx] = {
                    ...newElements[idx],
                    points: [...currentPoints],

                };
                setStore('elements', newElements);
            }
        },
        {
            duration: config.duration,
            easing: config.easing,
            delay: config.delay,
            loop: config.loop,
            loopCount: config.loopCount,
            alternate: config.alternate,
            onComplete: () => {
                const animIds = activeAnimations.get(elementId);
                if (animIds) {
                    animIds.delete(animId);
                    if (animIds.size === 0) activeAnimations.delete(elementId);
                }

                // Final state: Set to the actual target shape type and clean up
                updateElement(elementId, {
                    type: targetShape as any,
                    points: undefined,

                }, false);

                config.onComplete?.();
            }
        }
    );

    animationEngine.start(animId);
    return animId;
}
