/**
 * Element Animator
 * Animates DrawingElement properties using the animation engine
 */

import { animationEngine, generateAnimationId } from './animation-engine';
import { PathUtils } from '../math/path-utils';
import { MorphUtils } from '../math/morph-utils';
import type { AnimationConfig, EasingFunction, EasingName } from './animation-types';
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
    | 'drawProgress'
    // 3D shape properties
    | 'depth'
    | 'viewAngle'
    | 'openAmount'
    | 'taper'
    | 'skewX'
    | 'skewY'
    | 'frontTaper'
    | 'frontSkewX'
    | 'frontSkewY'
    | 'shapeRatio'
    | 'sideRatio';

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
    // 3D shape properties
    depth?: number;
    viewAngle?: number;
    openAmount?: number;
    taper?: number;
    skewX?: number;
    skewY?: number;
    frontTaper?: number;
    frontSkewX?: number;
    frontSkewY?: number;
    shapeRatio?: number;
    sideRatio?: number;
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

// ============================================
// GSAP-like Advanced Stagger Utilities
// ============================================

/**
 * Stagger configuration for advanced animations
 * Inspired by GSAP's stagger options
 */
export interface StaggerConfig {
    /** Total stagger duration or per-element delay */
    each?: number;
    /** Total amount of stagger time (alternative to each) */
    amount?: number;
    /** Distribution mode: where to start the stagger from */
    from?: 'start' | 'end' | 'center' | 'edges' | 'random' | number;
    /** Grid dimensions for 2D stagger [columns, rows] */
    grid?: [number, number];
    /** Axis for grid stagger: 'x', 'y', or undefined for radial */
    axis?: 'x' | 'y';
    /** Easing for the stagger timing itself */
    ease?: EasingName | EasingFunction;
}

/**
 * Calculate stagger delays based on configuration
 * Returns an array of delay multipliers (0-1) for each element
 */
export function calculateStaggerDelays(count: number, config: StaggerConfig): number[] {
    if (count === 0) return [];
    if (count === 1) return [0];

    const { from = 'start', grid, axis, ease } = config;
    let delays: number[] = [];

    if (grid) {
        // 2D grid-based stagger
        const [cols, rows] = grid;
        const centerX = (cols - 1) / 2;
        const centerY = (rows - 1) / 2;

        for (let i = 0; i < count; i++) {
            const x = i % cols;
            const y = Math.floor(i / cols);

            let distance: number;
            if (axis === 'x') {
                distance = typeof from === 'number' ? Math.abs(x - from) : Math.abs(x - centerX);
            } else if (axis === 'y') {
                distance = typeof from === 'number' ? Math.abs(y - from) : Math.abs(y - centerY);
            } else {
                // Radial distance from center
                const dx = x - centerX;
                const dy = y - centerY;
                distance = Math.sqrt(dx * dx + dy * dy);
            }
            delays.push(distance);
        }
    } else {
        // Linear stagger
        switch (from) {
            case 'end':
                delays = Array.from({ length: count }, (_, i) => count - 1 - i);
                break;
            case 'center': {
                const center = (count - 1) / 2;
                delays = Array.from({ length: count }, (_, i) => Math.abs(i - center));
                break;
            }
            case 'edges': {
                const center = (count - 1) / 2;
                delays = Array.from({ length: count }, (_, i) => center - Math.abs(i - center));
                break;
            }
            case 'random':
                delays = Array.from({ length: count }, () => Math.random());
                break;
            default:
                if (typeof from === 'number') {
                    delays = Array.from({ length: count }, (_, i) => Math.abs(i - from));
                } else {
                    // 'start' - default linear
                    delays = Array.from({ length: count }, (_, i) => i);
                }
        }
    }

    // Normalize to 0-1 range
    const maxDelay = Math.max(...delays);
    if (maxDelay > 0) {
        delays = delays.map(d => d / maxDelay);
    }

    // Apply easing to stagger timing
    if (ease) {
        const easingFn = getEasing(ease);
        delays = delays.map(d => easingFn(d));
    }

    return delays;
}

/**
 * Animate multiple elements with advanced GSAP-like stagger options
 *
 * @param elementIds - Array of element IDs to animate
 * @param target - Target property values
 * @param config - Animation configuration
 * @param stagger - Stagger configuration or simple delay number
 * @returns Array of animation IDs
 *
 * @example
 * // Stagger from center
 * animateElementsStagger(ids, { opacity: 100 }, { duration: 500 }, {
 *     each: 100,
 *     from: 'center',
 *     ease: 'easeOutQuad'
 * });
 *
 * @example
 * // Grid stagger
 * animateElementsStagger(ids, { y: 0 }, { duration: 300 }, {
 *     amount: 800,
 *     grid: [4, 3],
 *     from: 'center'
 * });
 */
export function animateElementsStagger(
    elementIds: string[],
    target: ElementAnimationTarget,
    config: ElementAnimationConfig,
    stagger: StaggerConfig | number = 0
): string[] {
    if (elementIds.length === 0) return [];

    // Simple number stagger - use basic implementation
    if (typeof stagger === 'number') {
        return animateElements(elementIds, target, config, stagger);
    }

    const { each, amount } = stagger;
    const delays = calculateStaggerDelays(elementIds.length, stagger);

    // Calculate per-element delay
    let totalStagger: number;
    if (amount !== undefined) {
        totalStagger = amount;
    } else if (each !== undefined) {
        totalStagger = each * (elementIds.length - 1);
    } else {
        totalStagger = 0;
    }

    return elementIds.map((id, index) => {
        const staggerDelay = delays[index] * totalStagger;
        return animateElement(id, target, {
            ...config,
            delay: (config.delay ?? 0) + staggerDelay
        });
    });
}

/**
 * Animate from a starting state TO current state (reverse of normal animation)
 * Useful for entrance animations where you want to specify the "from" position
 *
 * @example
 * // Fade in from opacity 0
 * animateFrom(elementId, { opacity: 0 }, { duration: 500 });
 *
 * @example
 * // Slide in from left
 * animateFrom(elementId, { x: -100 }, { duration: 300, easing: 'easeOutQuad' });
 */
export function animateFrom(
    elementId: string,
    fromValues: ElementAnimationTarget,
    config: ElementAnimationConfig = {}
): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    // Store the current "to" values
    const toValues: ElementAnimationTarget = {};
    for (const key of Object.keys(fromValues) as (keyof ElementAnimationTarget)[]) {
        toValues[key] = (element as any)[key];
    }

    // Set element to "from" state immediately
    updateElement(elementId, fromValues as any, false);

    // Animate to original state
    return animateElement(elementId, toValues, config);
}

/**
 * Animate from a specific state TO another specific state
 * Full control over both start and end values
 *
 * @example
 * // Animate from off-screen to centered
 * animateFromTo(elementId,
 *     { x: -200, opacity: 0 },
 *     { x: 100, opacity: 100 },
 *     { duration: 500 }
 * );
 */
export function animateFromTo(
    elementId: string,
    fromValues: ElementAnimationTarget,
    toValues: ElementAnimationTarget,
    config: ElementAnimationConfig = {}
): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    // Set element to "from" state immediately
    updateElement(elementId, fromValues as any, false);

    // Animate to "to" state
    return animateElement(elementId, toValues, config);
}

/**
 * Generate a random value within a range
 * Useful for creating variation in animations
 *
 * @example
 * random(100, 500) // Random number between 100 and 500
 * random(0.5, 1.5) // Random decimal
 */
export function random(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

/**
 * Generate a random integer within a range (inclusive)
 */
export function randomInt(min: number, max: number): number {
    return Math.floor(random(min, max + 1));
}

/**
 * Pick a random item from an array
 */
export function randomPick<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle an array (Fisher-Yates)
 */
export function shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Per-character text animation - animates each character individually
 * Like GSAP's SplitText but for canvas text elements
 *
 * @param elementId - The text element to animate
 * @param duration - Total duration for all characters
 * @param stagger - Stagger configuration for characters
 * @param config - Animation configuration
 *
 * @example
 * // Wave effect from center
 * charByChar(textId, 1500, { each: 50, from: 'center' });
 *
 * @example
 * // Random character reveal
 * charByChar(textId, 2000, { each: 30, from: 'random' });
 */
export function charByChar(
    elementId: string,
    duration: number = 1000,
    stagger: StaggerConfig = { each: 50 },
    config: ElementAnimationConfig = {}
): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) {
        console.warn('charByChar: Element not found');
        return '';
    }

    const textInfo = getElementText(element);
    if (!textInfo) {
        console.warn('charByChar: Element has no text content');
        return '';
    }

    const { text: fullText, property: textProperty } = textInfo;
    if (!fullText) return '';

    // Get character count (excluding spaces for delay calculation, but include in reveal)
    const chars = fullText.split('');
    const nonSpaceIndices = chars.map((c, i) => c !== ' ' ? i : -1).filter(i => i >= 0);
    const charCount = nonSpaceIndices.length;

    if (charCount === 0) return '';

    const animId = generateAnimationId('charByChar');
    const targetProps = new Set<string>([textProperty]);

    stopConflictingAnimations(elementId, targetProps);
    if (!activeAnimations.has(elementId)) {
        activeAnimations.set(elementId, new Map());
    }
    activeAnimations.get(elementId)!.set(animId, targetProps);

    // Calculate delays for each non-space character
    const delays = calculateStaggerDelays(charCount, stagger);

    // Calculate total stagger time
    const { each, amount } = stagger;
    let totalStagger: number;
    if (amount !== undefined) {
        totalStagger = amount;
    } else if (each !== undefined) {
        totalStagger = each * (charCount - 1);
    } else {
        totalStagger = duration * 0.5; // Default: stagger takes half the duration
    }

    // Map delays back to all characters (spaces get delay of previous char)
    const charDelays: number[] = [];
    let delayIndex = 0;
    let lastDelay = 0;
    for (let i = 0; i < chars.length; i++) {
        if (chars[i] !== ' ') {
            lastDelay = delays[delayIndex++] * totalStagger;
        }
        charDelays.push(lastDelay);
    }

    // Start with empty text
    updateElement(elementId, { [textProperty]: '', opacity: 100 }, false);

    // Track which characters are revealed
    const revealed = new Array(chars.length).fill(false);

    animationEngine.create(
        animId,
        (progress: number) => {
            const elapsed = progress * duration;

            // Check each character
            for (let i = 0; i < chars.length; i++) {
                if (!revealed[i] && elapsed >= charDelays[i]) {
                    revealed[i] = true;
                }
            }

            // Build visible text
            const visibleText = chars
                .map((char, i) => revealed[i] ? char : (char === ' ' ? ' ' : ''))
                .join('');

            updateElement(elementId, { [textProperty]: visibleText }, false);
        },
        {
            duration,
            easing: 'linear',
            delay: config.delay,
            onStart: config.onStart,
            onComplete: () => {
                updateElement(elementId, { [textProperty]: fullText }, false);
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
 * Animate multiple elements with a "from" animation and stagger
 * Each element animates FROM the specified values TO their current state
 *
 * @example
 * // Staggered fade in from below
 * animateElementsFrom(ids, { y: 50, opacity: 0 }, { duration: 400 }, { each: 100, from: 'start' });
 */
export function animateElementsFrom(
    elementIds: string[],
    fromValues: ElementAnimationTarget,
    config: ElementAnimationConfig,
    stagger: StaggerConfig | number = 0
): string[] {
    if (elementIds.length === 0) return [];

    // Calculate stagger delays
    let delays: number[];
    let totalStagger: number;

    if (typeof stagger === 'number') {
        delays = elementIds.map((_, i) => i);
        totalStagger = stagger * (elementIds.length - 1);
    } else {
        delays = calculateStaggerDelays(elementIds.length, stagger);
        const { each, amount } = stagger;
        if (amount !== undefined) {
            totalStagger = amount;
        } else if (each !== undefined) {
            totalStagger = each * (elementIds.length - 1);
        } else {
            totalStagger = 0;
        }
    }

    // Normalize delays
    const maxDelay = Math.max(...delays);
    if (maxDelay > 0) {
        delays = delays.map(d => d / maxDelay);
    }

    return elementIds.map((id, index) => {
        const staggerDelay = delays[index] * totalStagger;
        return animateFrom(id, fromValues, {
            ...config,
            delay: (config.delay ?? 0) + staggerDelay
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

        // Text animations (for text elements only)
        case 'typewriter':
            return typewriter(elementId, duration, config);
        case 'typewriterCursor':
            return typewriterCursor(elementId, duration, config);
        case 'wordByWord':
            return wordByWord(elementId, duration, config);
        case 'textScramble':
            return textScramble(elementId, duration, config);
        case 'lineByLine':
            return lineByLine(elementId, duration, config);
        case 'charByChar':
            return charByChar(elementId, duration, { each: 50, from: 'start' }, config);

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

        // Text exit animations (for text elements only)
        case 'textDelete':
            return textDelete(elementId, duration, config);

        default:
            return '';
    }
}

// ============================================
// Text Animations
// ============================================

/**
 * Helper to get text content and property name from an element
 * Works with both text elements (text property) and shapes with containerText
 */
function getElementText(element: DrawingElement): { text: string; property: 'text' | 'containerText' } | null {
    if (element.type === 'text' && element.text) {
        return { text: element.text, property: 'text' };
    }
    if (element.containerText) {
        return { text: element.containerText, property: 'containerText' };
    }
    return null;
}

/**
 * Typewriter effect - reveals text letter by letter
 * Creates a classic typing animation effect
 * Works on text elements and any shape with containerText
 *
 * @param elementId - The ID of the element to animate
 * @param duration - Total duration of the animation in milliseconds
 * @param config - Animation configuration
 * @returns Animation ID for control
 *
 * @example
 * typewriter('text-1', 2000); // Types out text over 2 seconds
 */
export function typewriter(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) {
        console.warn('typewriter: Element not found');
        return '';
    }

    const textInfo = getElementText(element);
    if (!textInfo) {
        console.warn('typewriter: Element has no text content');
        return '';
    }

    const { text: fullText, property: textProperty } = textInfo;

    const animId = generateAnimationId('typewriter');
    const targetProps = new Set<string>([textProperty]);

    stopConflictingAnimations(elementId, targetProps);
    if (!activeAnimations.has(elementId)) {
        activeAnimations.set(elementId, new Map());
    }
    activeAnimations.get(elementId)!.set(animId, targetProps);

    // Start with empty text
    updateElement(elementId, { [textProperty]: '', opacity: 100 }, false);

    let lastCharIndex = 0;

    animationEngine.create(
        animId,
        (progress: number) => {
            const charIndex = Math.floor(progress * fullText.length);
            // Only update if character count changed to reduce updates
            if (charIndex !== lastCharIndex) {
                lastCharIndex = charIndex;
                const visibleText = fullText.substring(0, charIndex);
                updateElement(elementId, { [textProperty]: visibleText }, false);
            }
        },
        {
            duration,
            easing: 'linear',
            delay: config.delay,
            onStart: config.onStart,
            onComplete: () => {
                // Ensure full text is shown at the end
                updateElement(elementId, { [textProperty]: fullText }, false);
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
 * Typewriter with cursor effect - reveals text letter by letter with blinking cursor
 * Works on text elements and any shape with containerText
 *
 * @param elementId - The ID of the element to animate
 * @param duration - Total duration of the animation in milliseconds
 * @param config - Animation configuration
 * @returns Animation ID for control
 */
export function typewriterCursor(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) {
        console.warn('typewriterCursor: Element not found');
        return '';
    }

    const textInfo = getElementText(element);
    if (!textInfo) {
        console.warn('typewriterCursor: Element has no text content');
        return '';
    }

    const { text: fullText, property: textProperty } = textInfo;

    const animId = generateAnimationId('typewriterCursor');
    const targetProps = new Set<string>([textProperty]);
    const cursor = '|';
    const blinkInterval = 530; // Cursor blink interval in ms

    stopConflictingAnimations(elementId, targetProps);
    if (!activeAnimations.has(elementId)) {
        activeAnimations.set(elementId, new Map());
    }
    activeAnimations.get(elementId)!.set(animId, targetProps);

    // Start with cursor only
    updateElement(elementId, { [textProperty]: cursor, opacity: 100 }, false);

    let lastCharIndex = 0;
    let showCursor = true;

    animationEngine.create(
        animId,
        (progress: number, _elapsed?: number, currentTime?: number) => {
            const charIndex = Math.floor(progress * fullText.length);
            const time = currentTime || Date.now();

            // Toggle cursor visibility based on time
            const blinkPhase = Math.floor(time / blinkInterval) % 2;
            const newShowCursor = blinkPhase === 0;

            // Update if character count changed or cursor state changed
            if (charIndex !== lastCharIndex || newShowCursor !== showCursor) {
                lastCharIndex = charIndex;
                showCursor = newShowCursor;
                const visibleText = fullText.substring(0, charIndex);
                const displayText = visibleText + (showCursor ? cursor : '');
                updateElement(elementId, { [textProperty]: displayText }, false);
            }
        },
        {
            duration,
            easing: 'linear',
            delay: config.delay,
            onStart: config.onStart,
            onComplete: () => {
                // Show full text without cursor at the end
                updateElement(elementId, { [textProperty]: fullText }, false);
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
 * Word by word reveal - reveals text one word at a time
 * Works on text elements and any shape with containerText
 *
 * @param elementId - The ID of the element to animate
 * @param duration - Total duration of the animation in milliseconds
 * @param config - Animation configuration
 * @returns Animation ID for control
 *
 * @example
 * wordByWord('text-1', 3000); // Reveals words over 3 seconds
 */
export function wordByWord(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) {
        console.warn('wordByWord: Element not found');
        return '';
    }

    const textInfo = getElementText(element);
    if (!textInfo) {
        console.warn('wordByWord: Element has no text content');
        return '';
    }

    const { text: fullText, property: textProperty } = textInfo;

    // Split into words while preserving whitespace
    const words = fullText.split(/(\s+)/);
    const wordCount = words.filter(w => w.trim().length > 0).length;
    if (wordCount === 0) return '';

    const animId = generateAnimationId('wordByWord');
    const targetProps = new Set<string>([textProperty]);

    stopConflictingAnimations(elementId, targetProps);
    if (!activeAnimations.has(elementId)) {
        activeAnimations.set(elementId, new Map());
    }
    activeAnimations.get(elementId)!.set(animId, targetProps);

    // Start with empty text
    updateElement(elementId, { [textProperty]: '', opacity: 100 }, false);

    let lastWordIndex = 0;

    animationEngine.create(
        animId,
        (progress: number) => {
            // Calculate how many words should be visible
            const targetWordCount = Math.floor(progress * wordCount);

            if (targetWordCount !== lastWordIndex) {
                lastWordIndex = targetWordCount;

                // Build visible text by counting actual words (not whitespace)
                let visibleText = '';
                let wordsSeen = 0;
                for (const word of words) {
                    if (word.trim().length > 0) {
                        wordsSeen++;
                        if (wordsSeen > targetWordCount) break;
                    }
                    visibleText += word;
                }

                updateElement(elementId, { [textProperty]: visibleText }, false);
            }
        },
        {
            duration,
            easing: 'linear',
            delay: config.delay,
            onStart: config.onStart,
            onComplete: () => {
                // Ensure full text is shown at the end
                updateElement(elementId, { [textProperty]: fullText }, false);
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
 * Text scramble effect - randomly scrambles text then decodes to reveal
 * Creates a hacker/decode style animation
 * Works on text elements and any shape with containerText
 *
 * @param elementId - The ID of the element to animate
 * @param duration - Total duration of the animation in milliseconds
 * @param config - Animation configuration (params.charset for custom characters)
 * @returns Animation ID for control
 *
 * @example
 * textScramble('text-1', 2000); // Scramble then reveal over 2 seconds
 */
export function textScramble(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) {
        console.warn('textScramble: Element not found');
        return '';
    }

    const textInfo = getElementText(element);
    if (!textInfo) {
        console.warn('textScramble: Element has no text content');
        return '';
    }

    const { text: fullText, property: textProperty } = textInfo;

    const animId = generateAnimationId('textScramble');
    const targetProps = new Set<string>([textProperty]);

    // Characters to use for scrambling (customizable via params)
    const defaultCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const charset = config.params?.charset || defaultCharset;

    stopConflictingAnimations(elementId, targetProps);
    if (!activeAnimations.has(elementId)) {
        activeAnimations.set(elementId, new Map());
    }
    activeAnimations.get(elementId)!.set(animId, targetProps);

    // Start with scrambled text
    const getRandomChar = () => charset[Math.floor(Math.random() * charset.length)];

    animationEngine.create(
        animId,
        (progress: number) => {
            const result: string[] = [];

            for (let i = 0; i < fullText.length; i++) {
                const char = fullText[i];

                // Whitespace always stays as-is
                if (char === ' ' || char === '\n' || char === '\t') {
                    result.push(char);
                    continue;
                }

                // Calculate when this character should be revealed
                // Earlier characters reveal earlier
                const charRevealPoint = i / fullText.length;

                if (progress > charRevealPoint + 0.3) {
                    // Fully revealed
                    result.push(char);
                } else if (progress > charRevealPoint) {
                    // In transition - sometimes show real, sometimes scrambled
                    const localProgress = (progress - charRevealPoint) / 0.3;
                    if (Math.random() < localProgress) {
                        result.push(char);
                    } else {
                        result.push(getRandomChar());
                    }
                } else {
                    // Not yet revealed - show scrambled
                    result.push(getRandomChar());
                }
            }

            updateElement(elementId, { [textProperty]: result.join('') }, false);
        },
        {
            duration,
            easing: 'linear',
            delay: config.delay,
            onStart: config.onStart,
            onComplete: () => {
                // Ensure full text is shown at the end
                updateElement(elementId, { [textProperty]: fullText }, false);
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
 * Text delete effect - erases text character by character from end
 * Reverse of typewriter
 * Works on text elements and any shape with containerText
 *
 * @param elementId - The ID of the element to animate
 * @param duration - Total duration of the animation in milliseconds
 * @param config - Animation configuration
 * @returns Animation ID for control
 */
export function textDelete(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) {
        console.warn('textDelete: Element not found');
        return '';
    }

    const textInfo = getElementText(element);
    if (!textInfo) {
        console.warn('textDelete: Element has no text content');
        return '';
    }

    const { text: fullText, property: textProperty } = textInfo;

    const animId = generateAnimationId('textDelete');
    const targetProps = new Set<string>([textProperty]);

    stopConflictingAnimations(elementId, targetProps);
    if (!activeAnimations.has(elementId)) {
        activeAnimations.set(elementId, new Map());
    }
    activeAnimations.get(elementId)!.set(animId, targetProps);

    let lastCharIndex = fullText.length;

    animationEngine.create(
        animId,
        (progress: number) => {
            const charIndex = Math.floor((1 - progress) * fullText.length);
            if (charIndex !== lastCharIndex) {
                lastCharIndex = charIndex;
                const visibleText = fullText.substring(0, charIndex);
                updateElement(elementId, { [textProperty]: visibleText }, false);
            }
        },
        {
            duration,
            easing: 'linear',
            delay: config.delay,
            onStart: config.onStart,
            onComplete: () => {
                updateElement(elementId, { [textProperty]: '' }, false);
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
 * Text replace effect - types out new text, replacing old text
 * Useful for animated text transitions
 * Works on text elements and any shape with containerText
 *
 * @param elementId - The ID of the element to animate
 * @param newText - The new text to display
 * @param duration - Total duration of the animation in milliseconds
 * @param config - Animation configuration
 * @returns Animation ID for control
 */
export function textReplace(elementId: string, newText: string, duration: number = 1500, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) {
        console.warn('textReplace: Element not found');
        return '';
    }

    const textInfo = getElementText(element);
    if (!textInfo) {
        console.warn('textReplace: Element has no text content');
        return '';
    }

    const { text: oldText, property: textProperty } = textInfo;
    if (!newText) return '';

    const animId = generateAnimationId('textReplace');
    const targetProps = new Set<string>([textProperty]);

    stopConflictingAnimations(elementId, targetProps);
    if (!activeAnimations.has(elementId)) {
        activeAnimations.set(elementId, new Map());
    }
    activeAnimations.get(elementId)!.set(animId, targetProps);

    // Phase 1: Delete old text (0 to 0.4)
    // Phase 2: Brief pause (0.4 to 0.5)
    // Phase 3: Type new text (0.5 to 1)

    let lastText = oldText;

    animationEngine.create(
        animId,
        (progress: number) => {
            let currentText: string;

            if (progress < 0.4) {
                // Deleting phase
                const deleteProgress = progress / 0.4;
                const charIndex = Math.floor((1 - deleteProgress) * oldText.length);
                currentText = oldText.substring(0, charIndex);
            } else if (progress < 0.5) {
                // Pause phase - empty
                currentText = '';
            } else {
                // Typing phase
                const typeProgress = (progress - 0.5) / 0.5;
                const charIndex = Math.floor(typeProgress * newText.length);
                currentText = newText.substring(0, charIndex);
            }

            if (currentText !== lastText) {
                lastText = currentText;
                updateElement(elementId, { [textProperty]: currentText }, false);
            }
        },
        {
            duration,
            easing: 'linear',
            delay: config.delay,
            onStart: config.onStart,
            onComplete: () => {
                updateElement(elementId, { [textProperty]: newText }, false);
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
 * Text count up effect - animates a number counting up
 * Great for statistics and metrics displays
 * Works on text elements and any shape with containerText
 *
 * @param elementId - The ID of the element to animate
 * @param startValue - Starting number
 * @param endValue - Ending number
 * @param duration - Total duration of the animation in milliseconds
 * @param config - Animation configuration (params.prefix, params.suffix, params.decimals)
 * @returns Animation ID for control
 *
 * @example
 * textCountUp('text-1', 0, 1000, 2000); // Count from 0 to 1000 over 2 seconds
 * textCountUp('text-1', 0, 100, 1500, { params: { suffix: '%' } }); // "0%" to "100%"
 */
export function textCountUp(
    elementId: string,
    startValue: number,
    endValue: number,
    duration: number = 1000,
    config: ElementAnimationConfig = {}
): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) {
        console.warn('textCountUp: Element not found');
        return '';
    }

    // Determine which text property to use
    const textProperty: 'text' | 'containerText' = element.type === 'text' ? 'text' : 'containerText';

    const animId = generateAnimationId('textCountUp');
    const targetProps = new Set<string>([textProperty]);

    const prefix = config.params?.prefix || '';
    const suffix = config.params?.suffix || '';
    const decimals = config.params?.decimals ?? 0;
    const useCommas = config.params?.useCommas ?? true;

    stopConflictingAnimations(elementId, targetProps);
    if (!activeAnimations.has(elementId)) {
        activeAnimations.set(elementId, new Map());
    }
    activeAnimations.get(elementId)!.set(animId, targetProps);

    // Format number with commas
    const formatNumber = (num: number): string => {
        const fixed = num.toFixed(decimals);
        if (!useCommas) return fixed;

        const parts = fixed.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    // Set initial value
    updateElement(elementId, { [textProperty]: `${prefix}${formatNumber(startValue)}${suffix}`, opacity: 100 }, false);

    let lastValue = startValue;

    animationEngine.create(
        animId,
        (progress: number) => {
            const currentValue = lerp(startValue, endValue, progress);
            const roundedValue = decimals === 0 ? Math.round(currentValue) : currentValue;

            if (Math.abs(roundedValue - lastValue) >= (decimals === 0 ? 1 : Math.pow(10, -decimals))) {
                lastValue = roundedValue;
                updateElement(elementId, { [textProperty]: `${prefix}${formatNumber(roundedValue)}${suffix}` }, false);
            }
        },
        {
            duration,
            easing: config.easing || 'easeOutQuad',
            delay: config.delay,
            onStart: config.onStart,
            onComplete: () => {
                updateElement(elementId, { [textProperty]: `${prefix}${formatNumber(endValue)}${suffix}` }, false);
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
 * Line by line reveal - reveals text one line at a time
 * Perfect for lists and multi-line content
 * Works on text elements and any shape with containerText
 *
 * @param elementId - The ID of the element to animate
 * @param duration - Total duration of the animation in milliseconds
 * @param config - Animation configuration
 * @returns Animation ID for control
 */
export function lineByLine(elementId: string, duration: number = 1000, config: ElementAnimationConfig = {}): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) {
        console.warn('lineByLine: Element not found');
        return '';
    }

    const textInfo = getElementText(element);
    if (!textInfo) {
        console.warn('lineByLine: Element has no text content');
        return '';
    }

    const { text: fullText, property: textProperty } = textInfo;

    const lines = fullText.split('\n');
    const lineCount = lines.length;
    if (lineCount === 0) return '';

    const animId = generateAnimationId('lineByLine');
    const targetProps = new Set<string>([textProperty]);

    stopConflictingAnimations(elementId, targetProps);
    if (!activeAnimations.has(elementId)) {
        activeAnimations.set(elementId, new Map());
    }
    activeAnimations.get(elementId)!.set(animId, targetProps);

    // Start with empty text
    updateElement(elementId, { [textProperty]: '', opacity: 100 }, false);

    let lastLineIndex = 0;

    animationEngine.create(
        animId,
        (progress: number) => {
            const targetLineCount = Math.floor(progress * lineCount) + (progress > 0 ? 1 : 0);

            if (targetLineCount !== lastLineIndex) {
                lastLineIndex = targetLineCount;
                const visibleLines = lines.slice(0, targetLineCount);
                updateElement(elementId, { [textProperty]: visibleLines.join('\n') }, false);
            }
        },
        {
            duration,
            easing: 'linear',
            delay: config.delay,
            onStart: config.onStart,
            onComplete: () => {
                updateElement(elementId, { [textProperty]: fullText }, false);
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

// ============================================
// 3D Box Animations
// ============================================

/**
 * Rotate a 3D shape (solidBlock, perspectiveBlock, cylinder) to reveal different faces
 * Animates the viewAngle property for a 3D rotation effect
 *
 * @param elementId - The 3D shape element to animate
 * @param targetAngle - Target view angle in degrees (0-360)
 * @param duration - Animation duration in ms
 * @param config - Animation configuration
 *
 * @example
 * // Rotate box to show back face
 * boxRotateReveal('box-1', 180, 800);
 *
 * @example
 * // Full 360 rotation
 * boxRotateReveal('box-1', 360, 1500, { easing: 'easeInOutCubic' });
 */
export function boxRotateReveal(
    elementId: string,
    targetAngle: number = 90,
    duration: number = 800,
    config: ElementAnimationConfig = {}
): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    // Only works on 3D shapes
    const is3DShape = ['solidBlock', 'perspectiveBlock', 'cylinder', 'isometricCube'].includes(element.type);
    if (!is3DShape) {
        console.warn('boxRotateReveal: Element is not a 3D shape');
        return '';
    }

    return animateElement(elementId, {
        viewAngle: targetAngle
    }, {
        duration,
        easing: config.easing ?? 'easeInOutCubic',
        delay: config.delay,
        onStart: config.onStart,
        onComplete: config.onComplete
    });
}

/**
 * Animate a 3D box opening effect - the lid lifts up and tilts back
 * Works with solidBlock and perspectiveBlock elements
 *
 * @param elementId - The 3D box element (solidBlock or perspectiveBlock)
 * @param duration - Total animation duration in ms
 * @param config - Animation configuration
 *
 * @example
 * boxLidOpen('box-1', 1000);
 */
export function boxLidOpen(
    elementId: string,
    duration: number = 1000,
    config: ElementAnimationConfig = {}
): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    // Works only with openBox (has hinged lid)
    if (element.type !== 'openBox') {
        console.warn('boxLidOpen: Works only with openBox elements');
        return '';
    }

    // Animate openAmount from 0 to 100 with overshoot and settle
    return animateElement(elementId, {
        openAmount: 85
    }, {
        duration: duration * 0.6,
        easing: 'easeOutCubic',
        delay: config.delay,
        onStart: config.onStart,
        onComplete: () => {
            // Overshoot slightly
            animateElement(elementId, {
                openAmount: 95
            }, {
                duration: duration * 0.2,
                easing: 'easeOutQuad',
                onComplete: () => {
                    // Settle back
                    animateElement(elementId, {
                        openAmount: 90
                    }, {
                        duration: duration * 0.2,
                        easing: 'easeOutElastic',
                        onComplete: config.onComplete
                    });
                }
            });
        }
    });
}

/**
 * Close a 3D box lid - the hinged lid closes
 *
 * @param elementId - The openBox element
 * @param duration - Animation duration in ms
 * @param config - Animation configuration
 */
export function boxLidClose(
    elementId: string,
    duration: number = 800,
    config: ElementAnimationConfig = {}
): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    if (element.type !== 'openBox') {
        console.warn('boxLidClose: Works only with openBox elements');
        return '';
    }

    return animateElement(elementId, {
        openAmount: 0
    }, {
        duration,
        easing: config.easing ?? 'easeInOutCubic',
        delay: config.delay,
        onStart: config.onStart,
        onComplete: config.onComplete
    });
}

/**
 * Composite box open animation for grouped elements
 * Animates a box group where:
 * - First element is the box body
 * - Second element is the lid
 * - Remaining elements are contents that reveal
 *
 * @param groupId - The group element ID containing box parts
 * @param duration - Total animation duration in ms
 * @param config - Animation configuration
 *
 * @example
 * // Create a group with: box body, lid, and content elements
 * boxOpenReveal('box-group-1', 1500);
 */
export function boxOpenReveal(
    groupId: string,
    duration: number = 1500,
    config: ElementAnimationConfig = {}
): string {
    const group = store.elements.find(el => el.id === groupId);
    if (!group) {
        console.warn('boxOpenReveal: Element not found');
        return '';
    }

    // Get child elements (elements that have this groupId in their groupIds array)
    const children = store.elements.filter(el => el.groupIds?.includes(groupId));
    if (children.length < 2) {
        console.warn('boxOpenReveal: Group needs at least 2 elements (body + lid)');
        return '';
    }

    // First child is body (stays), second is lid (animates up + fades)
    const [, lid, ...contents] = children;

    const animId = generateAnimationId('boxOpen');

    // Store original lid position
    const lidOriginalY = lid.y;

    // Hide contents initially
    contents.forEach(content => {
        updateElement(content.id, { opacity: 0 }, false);
    });

    // Phase 1: Lid lifts up and fades
    animateElement(lid.id, {
        y: lidOriginalY - 80,
        opacity: 0
    }, {
        duration: duration * 0.5,
        easing: 'easeOutCubic',
        delay: config.delay,
        onStart: config.onStart,
        onComplete: () => {
            // Phase 2: Contents scale in with stagger
            if (contents.length > 0) {
                contents.forEach((content, index) => {
                    const originalWidth = content.width;
                    const originalHeight = content.height;
                    const originalX = content.x;
                    const originalY = content.y;

                    // Start small
                    updateElement(content.id, {
                        width: originalWidth * 0.3,
                        height: originalHeight * 0.3,
                        x: originalX + (originalWidth * 0.35),
                        y: originalY + (originalHeight * 0.35)
                    }, false);

                    // Animate to full size
                    animateElement(content.id, {
                        width: originalWidth,
                        height: originalHeight,
                        x: originalX,
                        y: originalY,
                        opacity: 100
                    }, {
                        duration: duration * 0.4,
                        delay: index * 100,
                        easing: 'easeOutBack',
                        onComplete: index === contents.length - 1 ? config.onComplete : undefined
                    });
                });
            } else {
                config.onComplete?.();
            }
        }
    });

    return animId;
}

/**
 * Exploded/unfolded box view animation
 * Animates box faces spreading out from center
 *
 * @param elementId - The 3D box element
 * @param duration - Animation duration in ms
 * @param config - Animation configuration
 *
 * @example
 * boxExplode('solid-block-1', 1200);
 */
export function boxExplode(
    elementId: string,
    duration: number = 1200,
    config: ElementAnimationConfig = {}
): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    // Works with solidBlock or perspectiveBlock
    if (!['solidBlock', 'perspectiveBlock'].includes(element.type)) {
        console.warn('boxExplode: Works with solidBlock or perspectiveBlock');
        return '';
    }

    // Animate depth to increase and size for "exploded" effect
    const originalDepth = element.depth ?? 50;
    const originalWidth = element.width;
    const originalHeight = element.height;
    const originalX = element.x;
    const originalY = element.y;

    return animateElement(elementId, {
        depth: originalDepth * 2.5,
        width: originalWidth * 1.3,
        height: originalHeight * 1.3,
        x: originalX - (originalWidth * 0.15),
        y: originalY - (originalHeight * 0.15)
    }, {
        duration,
        easing: config.easing ?? 'easeOutBack',
        delay: config.delay,
        onStart: config.onStart,
        onComplete: config.onComplete
    });
}

/**
 * Collapse exploded box back to normal
 *
 * @param elementId - The 3D box element
 * @param targetDepth - Target depth value (default 50)
 * @param duration - Animation duration in ms
 * @param config - Animation configuration
 */
export function boxCollapse(
    elementId: string,
    targetDepth: number = 50,
    duration: number = 800,
    config: ElementAnimationConfig = {}
): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;

    // Calculate target size (assume we want to shrink to ~77% to reverse the 1.3x expand)
    const targetWidth = element.width / 1.3;
    const targetHeight = element.height / 1.3;

    return animateElement(elementId, {
        depth: targetDepth,
        width: targetWidth,
        height: targetHeight,
        x: centerX - targetWidth / 2,
        y: centerY - targetHeight / 2
    }, {
        duration,
        easing: config.easing ?? 'easeInOutCubic',
        delay: config.delay,
        onStart: config.onStart,
        onComplete: config.onComplete
    });
}

/**
 * Isometric cube rotation effect
 * Animates the shapeRatio and sideRatio for isometric cube rotation illusion
 *
 * @param elementId - The isometricCube element
 * @param duration - Animation duration for one full "rotation"
 * @param config - Animation configuration
 */
export function isometricRotate(
    elementId: string,
    duration: number = 2000,
    config: ElementAnimationConfig = {}
): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    if (element.type !== 'isometricCube') {
        console.warn('isometricRotate: Only works with isometricCube elements');
        return '';
    }

    const originalSideRatio = element.sideRatio ?? 50;

    // Animate sideRatio from current to 100 to 0 back to original for rotation effect
    return animateElementKeyframes(elementId, 'sideRatio', [
        { offset: 0, value: originalSideRatio },
        { offset: 0.25, value: 100, easing: 'easeInOutQuad' },
        { offset: 0.5, value: 50, easing: 'easeInOutQuad' },
        { offset: 0.75, value: 0, easing: 'easeInOutQuad' },
        { offset: 1, value: originalSideRatio, easing: 'easeInOutQuad' }
    ], {
        duration,
        delay: config.delay,
        onStart: config.onStart,
        onComplete: config.onComplete,
        loop: config.loop,
        loopCount: config.loopCount
    });
}

/**
 * 3D depth pulse - makes the box appear to "pop" in 3D
 *
 * @param elementId - The 3D shape element
 * @param duration - Animation duration in ms
 * @param config - Animation configuration
 */
export function depthPulse(
    elementId: string,
    duration: number = 600,
    config: ElementAnimationConfig = {}
): string {
    const element = store.elements.find(el => el.id === elementId);
    if (!element) return '';

    const is3DShape = ['solidBlock', 'perspectiveBlock', 'cylinder'].includes(element.type);
    if (!is3DShape) {
        console.warn('depthPulse: Only works with 3D shapes');
        return '';
    }

    const originalDepth = element.depth ?? 50;
    const pulseDepth = originalDepth * 1.5;

    return animateElement(elementId, {
        depth: pulseDepth
    }, {
        duration: duration / 2,
        easing: 'easeOutQuad',
        delay: config.delay,
        onStart: config.onStart,
        onComplete: () => {
            animateElement(elementId, {
                depth: originalDepth
            }, {
                duration: duration / 2,
                easing: 'easeOutElastic',
                onComplete: config.onComplete
            });
        }
    });
}
