import type { AnimatableValue, Interpolator } from '../types';
/**
 * Interpolate between two numbers.
 */
export declare const interpolateNumber: Interpolator<number>;
/**
 * Interpolate between two color strings (hex or rgb/rgba).
 */
export declare const interpolateColor: Interpolator<string>;
/**
 * Interpolate between two number arrays (element-wise).
 */
export declare const interpolateArray: Interpolator<number[]>;
/**
 * Interpolate strings with no interpolation (discrete jump).
 */
export declare const interpolateString: Interpolator<string>;
/**
 * Morph between two SVG path `d` strings (shape tween).
 */
export declare const interpolatePathString: Interpolator<string>;
/**
 * Detect value type and return appropriate interpolator.
 */
export declare function getInterpolator<T extends AnimatableValue>(sampleValue: T): Interpolator<T>;
