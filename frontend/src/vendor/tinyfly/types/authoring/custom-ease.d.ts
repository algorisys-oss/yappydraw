import type { CubicBezierPoints, EasingFunction } from '../types';
/**
 * Custom ease curves, built at authoring time.
 *
 * An ease maps progress in time (x, 0..1) to progress in value (y). These build
 * one from what designers hand over: a curve drawn as SVG path data, bezier
 * points, or a generated bounce or wiggle. Everything here is a pure function of
 * its input, and the result is either an exact cubic-bezier (serializable as is)
 * or a function a timeline samples into keyframes (see `bakeEasing`).
 */
export interface CustomEaseResult {
    /** The curve as a function of progress */
    fn: EasingFunction;
    /** Set when the curve is exactly one cubic-bezier, which serializes without sampling */
    bezier?: CubicBezierPoints;
}
/**
 * A custom ease from SVG path data or bezier control points.
 *
 * Path data may be in any coordinate space and either y direction: x is scaled
 * so the path runs from 0 to 1, and y so it starts at 0 and ends at 1. So a curve
 * exported from a design tool (y growing downward, a 500-wide artboard) and one
 * written in unit space give the same ease. Along x the path must not double
 * back; along y it may overshoot and undershoot freely.
 */
export declare function customEase(definition: string | CubicBezierPoints): CustomEaseResult;
export interface CustomBounceOptions {
    /** 0..1: how lively; higher bounces higher and more often (default 0.7) */
    strength?: number;
}
/**
 * A ball dropped onto the end value: it lands, bounces back up by less each
 * time, and settles. Each rebound keeps `strength × 0.7 + 0.1` of the height, and
 * the bounces are timed as a real ball's would be, so the curve reads as gravity.
 */
export declare function customBounce(options?: CustomBounceOptions): EasingFunction;
export type WiggleType = 'easeOut' | 'easeInOut' | 'uniform';
export interface CustomWiggleOptions {
    /** Full oscillations over the tween (default 10) */
    wiggles?: number;
    /** How the swing's size changes: dying away (default), rising then falling, or constant */
    type?: WiggleType;
}
/**
 * An oscillation that starts and ends at 0, swinging between -1 and 1. Used as
 * an ease it wiggles a value around its start: `rotate: 20` with a wiggle ease
 * swings ±20 degrees and comes back. Unlike other eases it ends where it began.
 */
export declare function customWiggle(options?: CustomWiggleOptions): EasingFunction;
