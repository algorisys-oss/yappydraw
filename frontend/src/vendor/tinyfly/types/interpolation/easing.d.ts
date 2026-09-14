import type { EasingFunction, EasingType, CubicBezierPoints } from '../types';
/**
 * Linear easing - no acceleration or deceleration.
 */
export declare const linear: EasingFunction;
/**
 * Quadratic ease-in - accelerates from zero velocity.
 */
export declare const easeInQuad: EasingFunction;
/**
 * Quadratic ease-out - decelerates to zero velocity.
 */
export declare const easeOutQuad: EasingFunction;
/**
 * Quadratic ease-in-out - accelerates until halfway, then decelerates.
 */
export declare const easeInOutQuad: EasingFunction;
/**
 * Cubic ease-in - accelerates from zero velocity (steeper than quad).
 */
export declare const easeInCubic: EasingFunction;
/**
 * Cubic ease-out - decelerates to zero velocity (steeper than quad).
 */
export declare const easeOutCubic: EasingFunction;
/**
 * Cubic ease-in-out - accelerates until halfway, then decelerates.
 */
export declare const easeInOutCubic: EasingFunction;
/**
 * Default ease-in (alias for cubic).
 */
export declare const easeIn: EasingFunction;
/**
 * Default ease-out (alias for cubic).
 */
export declare const easeOut: EasingFunction;
/**
 * Default ease-in-out (alias for cubic).
 */
export declare const easeInOut: EasingFunction;
/**
 * Creates a cubic bezier easing function from control points.
 * Uses Newton-Raphson iteration for accurate x->t mapping.
 *
 * The curve goes from (0,0) to (1,1) with two control points:
 * P1 at (cp1x, cp1y) and P2 at (cp2x, cp2y)
 */
export declare function createCubicBezier(points: CubicBezierPoints): EasingFunction;
/**
 * Get an easing function by its type identifier.
 * Returns linear if type is undefined.
 * Supports both built-in easing types and custom cubic-bezier.
 */
export declare function getEasingFunction(type: EasingType | undefined): EasingFunction;
