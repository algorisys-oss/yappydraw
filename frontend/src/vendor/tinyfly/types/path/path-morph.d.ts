/**
 * Shape morphing: interpolate between any two SVG path `d` strings.
 *
 * Both paths are resampled into matching point lists, which are blended. What
 * makes a morph look intentional rather than tangled is how those lists are
 * matched, so a plan is worked out once per pair of paths and cached:
 *
 * - **Subpaths are paired** in order when both paths have the same number, so
 *   a letter with a hole morphs outline-to-outline and hole-to-hole. Otherwise
 *   each path is treated as one continuous run.
 * - **Start point and direction are chosen** (GSAP's `shapeIndex: "auto"`): for
 *   closed shapes, every rotation of the target's points and both windings are
 *   tried, and the one that moves points least — measured about each shape's
 *   centre, so position does not dominate — is used. Open paths only try both
 *   directions.
 * - **Corners are kept.** Samples are dense (spaced by length) and always
 *   include every segment end of both shapes, so a star's points and a square's
 *   corners are exact at every frame, not cut off between samples.
 *
 * At progress 0 and 1 the original strings are returned untouched. Deterministic
 * and DOM-free, like the rest of the engine.
 */
/** Kept for compatibility: the old fixed sample count. */
export declare const MORPH_SAMPLES = 64;
export interface MorphOptions {
    /**
     * Force the point on the target shape that the source's start maps to, as an
     * index into `ALIGN_SAMPLES` evenly spaced points, instead of choosing it
     * automatically. Negative values reverse the direction.
     */
    shapeIndex?: number;
}
/**
 * The path `progress` of the way from `from` to `to` (0 = from, 1 = to).
 * Progress outside 0–1 is clamped; at the ends the original strings are
 * returned exactly.
 */
export declare function morphPath(from: string, to: string, progress: number, options?: MorphOptions): string;
/** Forget cached morph plans (useful for memory management). */
export declare function clearMorphCache(): void;
/** True when a string looks like SVG path data (starts with a moveto). */
export declare function isPathData(value: string): boolean;
