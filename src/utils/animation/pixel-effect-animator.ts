/**
 * Pixel Effect Animator
 * Animates pixel-by-pixel reveal effects on images
 */

import { animationEngine, generateAnimationId } from './animation-engine';
import { getEasing } from './animation-types';
import type { EasingName } from './animation-types';
import type { DrawingElement } from '../../types';
import { updateElement } from '../../store/app-store';

export interface PixelEffectAnimationConfig {
    /** Effect type */
    effectType: DrawingElement['pixelEffect'];
    /** Duration in milliseconds */
    duration?: number;
    /** Easing function */
    easing?: EasingName;
    /** Reverse (animate from 1 to 0 instead of 0 to 1) */
    reverse?: boolean;
    /** Effect-specific parameters */
    params?: DrawingElement['pixelEffectParams'];
    /** Callback when animation completes */
    onComplete?: () => void;
}

/**
 * Animate pixel effect on an image element
 */
export function animatePixelEffect(
    elementId: string,
    config: PixelEffectAnimationConfig
): string {
    const {
        effectType,
        duration = 2000,
        easing = 'easeOutCubic',
        reverse = false,
        params = {},
        onComplete
    } = config;

    if (!effectType) {
        console.warn('No pixel effect type specified');
        return '';
    }

    console.log(`[PixelEffect] Starting ${effectType} on ${elementId}`);

    const easingFn = getEasing(easing);
    const startProgress = reverse ? 1 : 0;
    const endProgress = reverse ? 0 : 1;

    // Set initial state
    updateElement(elementId, {
        pixelEffect: effectType,
        pixelEffectProgress: startProgress,
        pixelEffectDuration: duration,
        pixelEffectParams: params
    }, false);

    // Create animation
    const animId = generateAnimationId();
    animationEngine.create(
        animId,
        (progress: number) => {
            const currentProgress = reverse
                ? 1 - progress
                : progress;

            updateElement(elementId, {
                pixelEffectProgress: currentProgress
            }, false);
        },
        {
            duration,
            easing: easingFn,
            onComplete: () => {
                console.log(`[PixelEffect] Complete!`);
                // Set final state
                updateElement(elementId, {
                    pixelEffectProgress: endProgress
                }, false);

                onComplete?.();
            }
        }
    );

    // Start the animation
    animationEngine.start(animId);

    return animId;
}

/**
 * Stop pixel effect animation and optionally reset
 */
export function stopPixelEffect(
    elementId: string,
    animationId?: string,
    reset: boolean = false
): void {
    if (animationId) {
        animationEngine.stop(animationId);
    }

    if (reset) {
        updateElement(elementId, {
            pixelEffect: undefined,
            pixelEffectProgress: undefined,
            pixelEffectDuration: undefined,
            pixelEffectParams: undefined
        }, false);
    }
}

/**
 * Quick preset animations for common effects
 */
export const pixelEffectPresets = {
    /** Quick left-to-right reveal */
    revealLTR: (elementId: string, onComplete?: () => void) =>
        animatePixelEffect(elementId, {
            effectType: 'sequential-ltr',
            duration: 1500,
            easing: 'easeOutCubic',
            onComplete
        }),

    /** Quick dissolve in */
    dissolveIn: (elementId: string, onComplete?: () => void) =>
        animatePixelEffect(elementId, {
            effectType: 'dissolve',
            duration: 2000,
            easing: 'easeInOutCubic',
            onComplete
        }),

    /** Quick wave reveal from center */
    waveReveal: (elementId: string, onComplete?: () => void) =>
        animatePixelEffect(elementId, {
            effectType: 'wave-center',
            duration: 1800,
            easing: 'easeOutCubic',
            params: { waveCount: 2 },
            onComplete
        }),

    /** Retro scan line reveal */
    scanLines: (elementId: string, onComplete?: () => void) =>
        animatePixelEffect(elementId, {
            effectType: 'scan-lines',
            duration: 2500,
            easing: 'linear',
            params: { lineHeight: 3 },
            onComplete
        }),

    /** Digital glitch assembly */
    glitch: (elementId: string, onComplete?: () => void) =>
        animatePixelEffect(elementId, {
            effectType: 'glitch',
            duration: 1200,
            easing: 'easeInOutCubic',
            params: { glitchIntensity: 0.7 },
            onComplete
        }),

    /** Block tile reveal */
    blockReveal: (elementId: string, onComplete?: () => void) =>
        animatePixelEffect(elementId, {
            effectType: 'block-reveal',
            duration: 2000,
            easing: 'easeInOutQuad',
            params: { blockSize: 20 },
            onComplete
        }),

    /** Spiral reveal */
    spiral: (elementId: string, onComplete?: () => void) =>
        animatePixelEffect(elementId, {
            effectType: 'spiral',
            duration: 2200,
            easing: 'easeInOutCubic',
            onComplete
        }),

    /** Curtain open vertical */
    curtainOpen: (elementId: string, onComplete?: () => void) =>
        animatePixelEffect(elementId, {
            effectType: 'curtain-vertical',
            duration: 1500,
            easing: 'easeOutBack',
            onComplete
        }),

    /** Random pixel scatter */
    randomScatter: (elementId: string, onComplete?: () => void) =>
        animatePixelEffect(elementId, {
            effectType: 'random-pixels',
            duration: 1800,
            easing: 'easeInOutQuad',
            onComplete
        })
};
