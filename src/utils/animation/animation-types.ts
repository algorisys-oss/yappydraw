/**
 * Animation Types and Easing Functions
 * Foundation for the Yappy animation system
 */

// ============================================
// Easing Functions
// ============================================

export type EasingFunction = (t: number) => number;

/**
 * Spring physics easing generator
 * Creates natural, physics-based motion with overshoot and settle
 * Based on damped harmonic oscillator simulation
 *
 * @param stiffness - Spring tension (higher = snappier, typical: 100-300)
 * @param damping - Friction/resistance (higher = less bounce, typical: 10-40)
 * @param mass - Object weight (higher = slower, typical: 0.5-2)
 * @param velocity - Initial velocity (typical: 0)
 * @returns Easing function with natural spring motion
 */
export function createSpring(
    stiffness = 170,
    damping = 26,
    mass = 1,
    velocity = 0
): EasingFunction {
    return (t: number): number => {
        if (t === 0 || t === 1) return t;

        // Normalize time to seconds for physics calculation
        const duration = 1; // normalized to 1 second
        const time = t * duration;

        // Guard against zero/negative values for mass and stiffness to prevent NaN results
        // during calculation of omega0 and zeta.
        const safeMass = Math.max(mass, 0.01);
        const safeStiffness = Math.max(stiffness, 0.01);

        // Calculate damping ratio and natural frequency
        const omega0 = Math.sqrt(safeStiffness / safeMass);
        const zeta = damping / (2 * Math.sqrt(safeStiffness * safeMass));

        // Initial conditions: start at 0, end at 1
        const initialDisplacement = -1; // Start at 0 (1 - 1 = 0)
        const initialVelocity = velocity;

        let position: number;

        // Use a small epsilon for the damping ratio comparison to handle floating point
        // imprecision near 1.0 (critical damping).
        const epsilon = 0.001;
        if (zeta < 1 - epsilon) {
            // Under-damped (oscillates before settling)
            const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
            const envelope = Math.exp(-zeta * omega0 * time);
            const A = initialDisplacement;
            const B = (initialVelocity + zeta * omega0 * initialDisplacement) / omegaD;

            position = 1 + envelope * (A * Math.cos(omegaD * time) + B * Math.sin(omegaD * time));
        } else if (zeta > 1 + epsilon) {
            // Over-damped (slow settle, no oscillation)
            const r1 = -omega0 * (zeta + Math.sqrt(zeta * zeta - 1));
            const r2 = -omega0 * (zeta - Math.sqrt(zeta * zeta - 1));
            const A = (initialVelocity - r2 * initialDisplacement) / (r1 - r2);
            const B = initialDisplacement - A;

            position = 1 + A * Math.exp(r1 * time) + B * Math.exp(r2 * time);
        } else {
            // Case: Math.abs(zeta - 1) <= epsilon
            // Critically damped (no overshoot, fastest settle) - fallback for near 1.0
            const envelope = Math.exp(-omega0 * time);
            position = 1 + envelope * (initialDisplacement + (initialVelocity + omega0 * initialDisplacement) * time);
        }

        return position;
    };
}

/**
 * Collection of easing functions
 * t = normalized time (0 to 1)
 * Returns normalized progress (0 to 1)
 */
export const easings = {
    // Linear - no easing
    linear: (t: number): number => t,

    // Quadratic
    easeInQuad: (t: number): number => t * t,
    easeOutQuad: (t: number): number => t * (2 - t),
    easeInOutQuad: (t: number): number =>
        t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

    // Cubic
    easeInCubic: (t: number): number => t * t * t,
    easeOutCubic: (t: number): number => (--t) * t * t + 1,
    easeInOutCubic: (t: number): number =>
        t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

    // Exponential
    easeInExpo: (t: number): number => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
    easeOutExpo: (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutExpo: (t: number): number => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        if (t < 0.5) return Math.pow(2, 10 * (2 * t - 1)) / 2;
        return (2 - Math.pow(2, -10 * (2 * t - 1))) / 2;
    },

    // Bounce
    easeOutBounce: (t: number): number => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    },
    easeInBounce: (t: number): number => 1 - easings.easeOutBounce(1 - t),
    easeInOutBounce: (t: number): number =>
        t < 0.5
            ? (1 - easings.easeOutBounce(1 - 2 * t)) / 2
            : (1 + easings.easeOutBounce(2 * t - 1)) / 2,

    // Elastic
    easeOutElastic: (t: number): number => {
        const c4 = (2 * Math.PI) / 3;
        if (t === 0) return 0;
        if (t === 1) return 1;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    easeInElastic: (t: number): number => {
        const c4 = (2 * Math.PI) / 3;
        if (t === 0) return 0;
        if (t === 1) return 1;
        return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    },

    // Back (overshoot)
    easeOutBack: (t: number): number => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    easeInBack: (t: number): number => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
    },

    // Spring - default spring physics preset (gentle bounce)
    easeSpring: createSpring(170, 26, 1, 0),
} as const;

export type EasingName = keyof typeof easings;

// ============================================
// Animation State Types
// ============================================

export type AnimationState = 'idle' | 'running' | 'paused' | 'completed';

// ============================================
// Animation Configuration
// ============================================

export interface AnimationConfig {
    /** Duration in milliseconds */
    duration?: number;
    /** Easing function name or custom function */
    easing?: EasingName | EasingFunction;
    /** Delay before starting in milliseconds */
    delay?: number;
    /** Called each frame with progress 0-1 */
    onUpdate?: (progress: number) => void;
    /** Called when animation completes */
    onComplete?: () => void;
    /** Called when animation starts */
    onStart?: () => void;
    /** Loop the animation */
    loop?: boolean;
    /** Number of times to loop (Infinity for forever) */
    loopCount?: number;
    /** Alternate direction on each loop (ping-pong) */
    alternate?: boolean;
}

// ============================================
// Keyframe Types
// ============================================

export interface Keyframe<T = number> {
    /** Position in timeline 0-1 */
    offset: number;
    /** Value at this keyframe */
    value: T;
    /** Easing to next keyframe */
    easing?: EasingName | EasingFunction;
}

export interface KeyframeAnimation<T = number> {
    keyframes: Keyframe<T>[];
    duration: number;
    delay?: number;
    loop?: boolean;
}

// 3. Path Animation (Motion Path)
export interface PathAnimation /* extends BaseAnimation */ { // BaseAnimation is not defined in the provided document
    type: 'path';
    pathData: string; // SVG d attribute
    orientToPath?: boolean; // Auto-rotate element to match path tangent
    isRelative?: boolean; // If true, path is relative to element's starting center
    startOffset?: number; // 0-1
    endOffset?: number; // 0-1
}

export interface RotateAnimation /* extends BaseAnimation */ { // RotateAnimation and BaseAnimation are not defined in the provided document
    type: 'rotate';
    fromAngle?: number;
    toAngle: number;
    relative?: boolean; // If true, treat toAngle as delta
}

export type ElementAnimation = /* PresetAnimation | PropertyAnimation | */ PathAnimation | RotateAnimation; // PresetAnimation and PropertyAnimation are not defined in the provided document
// ============================================

export interface Animation {
    id: string;
    state: AnimationState;
    startTime: number;
    pauseTime: number | null;
    duration: number;
    delay: number;
    easing: EasingFunction;
    onUpdate: (progress: number) => void;
    onComplete?: () => void;
    onStart?: () => void;
    loop: boolean;
    loopCount: number;
    currentLoop: number;
    alternate: boolean;
    direction: 1 | -1;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get easing function from name or function
 */
export function getEasing(easing?: EasingName | EasingFunction): EasingFunction {
    if (!easing) return easings.linear;
    if (typeof easing === 'function') return easing;
    return easings[easing] ?? easings.linear;
}

/**
 * Interpolate between two numbers
 */
export function lerp(start: number, end: number, progress: number): number {
    if (isNaN(start)) return end;
    if (isNaN(end)) return start;
    return start + (end - start) * progress;
}

/**
 * Interpolate between two colors (hex format)
 */
export function lerpColor(startHex: string | null | undefined, endHex: string | null | undefined, progress: number): string {
    if (!startHex) return endHex || '#000000';
    if (!endHex) return startHex;

    const parseHex = (hex: string): [number, number, number] => {
        const h = hex.replace('#', '');
        if (h.length < 6) return [0, 0, 0];
        return [
            parseInt(h.substring(0, 2), 16) || 0,
            parseInt(h.substring(2, 4), 16) || 0,
            parseInt(h.substring(4, 6), 16) || 0
        ];
    };

    const [r1, g1, b1] = parseHex(startHex);
    const [r2, g2, b2] = parseHex(endHex);

    const r = Math.round(lerp(r1, r2, progress));
    const g = Math.round(lerp(g1, g2, progress));
    const b = Math.round(lerp(b1, b2, progress));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
