import type { AnyTrack, Track, Keyframe, EasingType, KeyframedTrack } from '../types';
/**
 * Baking: turning a computed animation into plain keyframes.
 *
 * Two callers need this. Export formats (CSS, Lottie, GIF) can only express
 * keyframes, so a spring track has to be sampled before it can leave the
 * engine. And the GSAP compat layer offers eases we have no closed form for
 * (elastic, bounce, steps), which are handled the same way.
 *
 * Baking is lossy in file size, not in fidelity: sampling a deterministic
 * simulation at a fixed rate always produces the same keyframes.
 */
/** Default sampling interval, in milliseconds (60fps). */
export declare const DEFAULT_BAKE_INTERVAL_MS: number;
export interface BakeOptions {
    /** Milliseconds between sampled keyframes (default: one 60fps frame) */
    intervalMs?: number;
    /**
     * Drop a sample when it sits within this distance of the straight line
     * between its neighbours. Keeps baked output small without visible change.
     * Set to 0 to keep every sample.
     */
    tolerance?: number;
}
/**
 * Sample a spring track into an ordinary keyframe track.
 *
 * The result is `linear`-eased between samples — the curve lives in the sample
 * positions, not in the easing.
 */
export declare function bakeSpringTrack(track: AnyTrack, options?: BakeOptions): Track<number>;
/**
 * Sample an inertia track into an ordinary keyframe track, the same way
 * springs are baked.
 */
export declare function bakeInertiaTrack(track: AnyTrack, options?: BakeOptions): Track<number>;
/**
 * Replace a keyframe segment's easing with sampled intermediate keyframes.
 *
 * Used for eases that cannot be represented as a single cubic-bezier — elastic,
 * bounce and steps overshoot or jump, which a bezier cannot do. The segment
 * keeps its endpoints and gains `linear` samples in between.
 */
export declare function bakeEasing<T extends Keyframe['value']>(from: Keyframe<T>, to: Keyframe<T>, easing: EasingType | ((t: number) => number), options?: BakeOptions): Keyframe<T>[];
/**
 * Any track as a keyframed track — springs and inertia get baked, everything
 * else passes through untouched. Export paths use this so they never see a
 * computed track.
 */
export declare function toKeyframedTrack(track: AnyTrack, options?: BakeOptions): KeyframedTrack;
/** Bake a whole track list for export. */
export declare function toKeyframedTracks(tracks: AnyTrack[], options?: BakeOptions): KeyframedTrack[];
/**
 * Drop keyframes that lie within `tolerance` of the line between their
 * neighbours. A plain sequential pass — not Douglas–Peucker — because sampled
 * springs are smooth and dense, so the simple version removes nearly as much
 * for a fraction of the complexity.
 */
export declare function simplifyKeyframes(keyframes: Keyframe<number>[], tolerance: number): Keyframe<number>[];
