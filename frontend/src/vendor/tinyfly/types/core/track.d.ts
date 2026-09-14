import type { Track, AnimatableValue, SpringTrack, InertiaTrack } from '../types';
/**
 * Create a track with sorted keyframes.
 */
export declare function createTrack<T extends AnimatableValue>(options: Track<T>): Track<T>;
/** One target's value at a point in time. */
export interface TargetValue<T extends AnimatableValue = AnimatableValue> {
    target: string;
    value: T;
    /** When this target's animation on the track starts, in timeline milliseconds */
    start: number;
}
/**
 * The targets a track drives, in order. A track either names one `target` or
 * fans across `targets`; the multi-target form is what runtime stagger uses.
 */
export declare function trackTargets(track: {
    target: string;
    targets?: string[];
}): string[];
/**
 * TrackPlayer computes interpolated values for a track at any given time.
 */
export declare class TrackPlayer<T extends AnimatableValue = AnimatableValue> {
    private track;
    private targets;
    constructor(track: Track<T>);
    /**
     * Get the interpolated value at a specific time.
     *
     * For a multi-target track this returns the *first* target's value; callers
     * that need every target should use `getTargetValues`.
     */
    getValueAtTime(time: number): T | undefined;
    /**
     * Every target's value at a specific time, in target order.
     *
     * Single-target tracks yield one entry; staggered tracks yield one per target,
     * each sampled at its own offset time.
     */
    getTargetValues(time: number): TargetValue<T>[];
    /**
     * Get the duration of this track — the last keyframe, plus any delay, the
     * widest stagger offset, and any trailing hold.
     */
    getDuration(): number;
    /**
     * Get the track metadata.
     */
    getTrack(): Track<T>;
    /** Interpolated value at a time already shifted into the track's own frame. */
    private valueForOffset;
    /**
     * Find the keyframes surrounding a given time.
     */
    private findSurroundingKeyframes;
}
/**
 * SpringTrackPlayer evaluates a spring track.
 *
 * Mirrors `TrackPlayer`'s surface so `Timeline` can treat both the same way.
 * The underlying `SpringSampler` caches its simulation, so scrubbing is cheap
 * after the first pass.
 */
export declare class SpringTrackPlayer {
    private track;
    private targets;
    private sampler;
    constructor(track: SpringTrack);
    getValueAtTime(time: number): number;
    getTargetValues(time: number): TargetValue<number>[];
    /** Settle time plus delay and the widest stagger offset. */
    getDuration(): number;
    getTrack(): SpringTrack;
}
/**
 * InertiaTrackPlayer evaluates a throw. The motion is closed-form, so there is
 * nothing to simulate or cache: each value is computed directly from time.
 */
export declare class InertiaTrackPlayer {
    private track;
    private targets;
    private duration;
    constructor(track: InertiaTrack);
    getValueAtTime(time: number): number;
    getTargetValues(time: number): TargetValue<number>[];
    /** Settle time plus delay and the widest stagger offset. */
    getDuration(): number;
    getTrack(): InertiaTrack;
}
