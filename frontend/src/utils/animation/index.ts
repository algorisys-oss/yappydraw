/**
 * Animation System - Public Exports
 */

// Types
export type {
    EasingFunction,
    EasingName,
    AnimationState,
    AnimationConfig,
    Keyframe,
    KeyframeAnimation,
    Animation
} from './animation-types';

// Easing functions
export { easings, getEasing, lerp, lerpColor, createSpring } from './animation-types';

// Animation Engine
export { animationEngine, generateAnimationId } from './animation-engine';

// Element Animator
export {
    animateElement,
    animateElements,
    stopElementAnimation,
    pauseElementAnimation,
    resumeElementAnimation,
    isElementAnimating,
    // Presets
    fadeIn,
    fadeOut,
    scaleIn,
    scaleOut,
    bounce,
    pulse,
    shakeX,
    shakeY,
    headShake,
    swing,
    tada,
    wobble,
    jello,
    heartBeat,
    slideInLeft,
    slideInRight,
    slideInUp,
    slideInDown,
    slideOutLeft,
    slideOutRight,
    slideOutUp,
    slideOutDown,
    // Keyframe animation
    interpolateKeyframes,
    animateElementKeyframes,
    // Play configured animation
    playEntranceAnimation,
    playExitAnimation,
    // Text animations
    typewriter,
    typewriterCursor,
    wordByWord,
    textScramble,
    textDelete,
    textReplace,
    textCountUp,
    lineByLine,
    // GSAP-like stagger utilities
    calculateStaggerDelays,
    animateElementsStagger,
    animateFrom,
    animateFromTo,
    animateElementsFrom,
    charByChar,
    // Random utilities
    random,
    randomInt,
    randomPick,
    shuffle,
    // 3D Box Animations
    boxRotateReveal,
    boxLidOpen,
    boxLidClose,
    boxLidOpenClose,
    boxOpenReveal,
    boxExplode,
    boxCollapse,
    isometricRotate,
    depthPulse,
    // Glitch / Motion Graphics
    glitch,
    // Kinetic Typography
    kineticBounceIn,
    kineticDropIn,
    kineticScaleReveal,
    kineticSlideIn,
    kineticFadeUp,
    // Table Animations
    tableRowReveal,
    tableColReveal,
    tableCellFill,
    tableHeatmapFadeIn,
    tableRowHighlight,
    tableColPulse,
    tableGridDraw,
    tableHeaderSlam,
    tableCountUp,
    tableAccordion,
    tableCellsAssemble,
    tableLightningSplit,
    codeLineHighlight,
    dsItemReveal,
    dsHighlightSweep,
    dsPointerWalk,
    // Image Pixel Effects
    pixelRevealLTR,
    pixelRevealRTL,
    pixelRevealTTB,
    pixelRevealBTT,
    pixelDissolve,
    pixelRandomScatter,
    pixelWaveCenter,
    pixelWaveCorner,
    pixelScanLines,
    pixelBlockReveal,
    pixelSpiral,
    pixelGlitch,
    pixelCurtainV,
    pixelCurtainH,
    pixelRain
} from './element-animator';

export type { StaggerConfig } from './element-animator';

export type {
    AnimatableProperty,
    AnimatableColorProperty,
    ElementAnimationTarget,
    ElementAnimationConfig
} from './element-animator';

// Timeline
export { Timeline, createTimeline } from './timeline';

// Sequence Animator
export { sequenceAnimator } from './sequence-animator';

// State Manager
export { stateManager } from './state-manager';

// Slide Transition Manager
export { slideTransitionManager } from './slide-transition-manager';
export type { TransitionContext, TransitionOptions } from './slide-transition-manager';

