import type { AnimatableValue } from '../types';
import { type RandomSource } from './random';
/**
 * Compile-time resolution of relative and random property values.
 *
 * GSAP resolves `"+=100"` and `random(-50, 50)` when a tween runs. We resolve
 * them when the timeline is *built*, and store the concrete number. Two rules
 * fall out of the project's principles:
 *
 *   - Determinism: a timeline must replay identically, so nothing may be
 *     re-rolled per run or per loop (GSAP's `repeatRefresh` has no equivalent).
 *   - JSON-first: what lands in the file is a plain number, not an expression,
 *     so any player can read it without an expression evaluator.
 *
 * The seed is kept alongside so regenerating the same animation reproduces the
 * same "random" values.
 */
/** A value that still needs resolving: a number, or an expression string. */
export type UnresolvedValue = AnimatableValue | string;
export interface ResolveContext {
    /**
     * The value this property currently holds — what a relative expression is
     * measured against. Defaults to 0.
     */
    base?: number;
    /** Source for random expressions. Required only if random values are used. */
    random?: RandomSource;
}
/** Whether a value needs resolving at all. */
export declare function isUnresolved(value: UnresolvedValue): value is string;
/**
 * Resolve one value to a concrete number.
 *
 * Non-expression values pass through untouched, so this is safe to run over
 * every keyframe regardless of what it holds (colours, paths, arrays).
 */
export declare function resolveValue(value: UnresolvedValue, context?: ResolveContext): AnimatableValue;
/**
 * Resolve a whole keyframe sequence for one property, threading each resolved
 * value forward as the base for the next.
 *
 * This is what makes a chain like `['+=100', '+=100']` mean "200 by the end"
 * rather than "100 twice".
 */
export declare function resolveSequence(values: UnresolvedValue[], startValue?: number, random?: RandomSource): AnimatableValue[];
/**
 * A resolver bound to one seed. Create it once per authoring session so every
 * random value in a timeline comes from the same reproducible sequence.
 */
export declare class ValueResolver {
    readonly random: RandomSource;
    constructor(seed: number);
    /** The seed, to be stored alongside the timeline so this can be reproduced. */
    get seed(): number;
    resolve(value: UnresolvedValue, base?: number): AnimatableValue;
    resolveSequence(values: UnresolvedValue[], startValue?: number): AnimatableValue[];
}
