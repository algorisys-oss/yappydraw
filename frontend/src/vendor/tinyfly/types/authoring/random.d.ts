/**
 * Seeded pseudo-random numbers.
 *
 * GSAP's `random()` is evaluated at runtime, which we cannot do: a value that
 * differs between runs is neither deterministic nor serializable. Instead we
 * resolve random values once at authoring time from a recorded seed, store the
 * concrete numbers in the JSON, and keep the seed so the same animation can be
 * regenerated identically.
 *
 * This is a small xorshift generator rather than a dependency — it is a dozen
 * lines and we only need repeatability, not statistical quality.
 */
/** Deterministic 0..1 generator. */
export interface RandomSource {
    /** Next value in [0, 1) */
    next(): number;
    /** The seed this source was created with */
    readonly seed: number;
}
/**
 * Turn any string into a 32-bit seed, so a project name or track id can be used
 * where a number is expected.
 */
export declare function hashSeed(input: string): number;
/**
 * Create a seeded generator. The same seed always yields the same sequence,
 * on any platform.
 */
export declare function createRandom(seed: number): RandomSource;
/** A value in [min, max), drawn from `source`. */
export declare function randomBetween(source: RandomSource, min: number, max: number): number;
/**
 * A value in [min, max] snapped to a multiple of `step`, measured from `min`.
 * Mirrors GSAP's third `random()` argument.
 */
export declare function randomSnapped(source: RandomSource, min: number, max: number, step: number): number;
/** One item from `items`, drawn from `source`. */
export declare function randomChoice<T>(source: RandomSource, items: readonly T[]): T | undefined;
