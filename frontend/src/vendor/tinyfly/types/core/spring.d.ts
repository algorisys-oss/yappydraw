import type { SpringConfig } from '../types';
/**
 * Deterministic spring simulation.
 *
 * The whole point of this module is that `valueAt(t)` is a *pure function of t*.
 * A naive spring integrates from the previous frame's state, which makes output
 * depend on frame rate and on the direction you scrubbed from — a timeline that
 * looks different on a 144 Hz monitor, and that can't be exported. Instead we
 * always integrate forward from rest at t=0 using a fixed substep, so seeking
 * backwards to 300 ms gives the identical value as playing forward to 300 ms.
 *
 * The cost is that evaluating late times means simulating the earlier ones, so
 * each spring memoises its samples and extends them as needed (`SpringSampler`).
 */
/** Integration substep in milliseconds. Small enough to be stable for stiff springs. */
export declare const SPRING_STEP_MS = 1;
/** Simulation is cut off here so a never-resting spring can't hang the engine. */
export declare const SPRING_MAX_DURATION_MS = 60000;
export declare const DEFAULT_SPRING: Required<Omit<SpringConfig, 'from' | 'to'>>;
/**
 * Named springs for the two parameters that decide how one feels. Stiffness and
 * damping interact, so named pairs are more useful than two sliders someone has
 * to discover the combinations of. Shared by the editor and `spring: 'wobbly'`.
 */
export declare const SPRING_PRESETS: {
    readonly gentle: {
        readonly stiffness: 120;
        readonly damping: 18;
        readonly mass: 1;
    };
    readonly default: {
        readonly stiffness: 180;
        readonly damping: 12;
        readonly mass: 1;
    };
    readonly snappy: {
        readonly stiffness: 280;
        readonly damping: 20;
        readonly mass: 1;
    };
    readonly bouncy: {
        readonly stiffness: 220;
        readonly damping: 8;
        readonly mass: 1;
    };
    readonly wobbly: {
        readonly stiffness: 180;
        readonly damping: 5;
        readonly mass: 1;
    };
    readonly stiff: {
        readonly stiffness: 400;
        readonly damping: 30;
        readonly mass: 1;
    };
};
export type SpringPresetName = keyof typeof SPRING_PRESETS;
/**
 * Samples a single spring, extending the simulation on demand and caching it.
 *
 * Instances are cheap; one is created per spring track.
 */
export declare class SpringSampler {
    private readonly from;
    private readonly to;
    private readonly stiffness;
    private readonly damping;
    private readonly mass;
    private readonly restDelta;
    private readonly restSpeed;
    /** value[i] is the spring's position at time i * SPRING_STEP_MS */
    /**
     * Travel distance, used to scale the rest thresholds.
     *
     * Without this the thresholds are absolute, and a spring animating `scale`
     * from 0 to 1 hits them ~100x sooner than one animating `x` from 0 to 100 —
     * so the small one is declared "settled" at its first pass through the
     * target and never shows the overshoot at all. Scaling by travel makes
     * settling depend on the spring's parameters, not on the units of whatever
     * property it happens to drive.
     */
    private readonly distance;
    private samples;
    private velocity;
    /** Once at rest we stop simulating; every later time returns `to`. */
    private settledStep;
    constructor(config: SpringConfig);
    /**
     * Whether a position/velocity pair counts as settled.
     *
     * Both thresholds are fractions of the spring's travel distance:
     * `restDelta` as a fraction of the distance, and `restSpeed` as a fraction
     * of the distance per second. That keeps settling scale-invariant.
     */
    private isAtRest;
    /**
     * Position at `timeMs`. Times before 0 clamp to the start value; times past
     * settling return the target exactly.
     */
    valueAt(timeMs: number): number;
    /**
     * How long the spring takes to settle, in milliseconds — the natural duration
     * of a spring track. Runs the simulation to completion once.
     */
    settleTime(): number;
    /** Advance the cached simulation until it holds at least `steps` samples. */
    private simulateTo;
}
/**
 * One-shot sampling helper. Prefer a long-lived `SpringSampler` when sampling
 * repeatedly (playback) — this rebuilds the simulation each call.
 */
export declare function springValueAt(config: SpringConfig, timeMs: number): number;
/** Natural settle duration for a spring, in milliseconds. */
export declare function springDuration(config: SpringConfig): number;
/**
 * Whether a spring passes its target before settling.
 *
 * A spring oscillates when it is damped less than critically, and critical
 * damping is `2 * sqrt(stiffness * mass)`. Worth exposing rather than leaving
 * to trial and error: overshoot is usually the whole point of reaching for a
 * spring, and its absence is the most common reason a "bouncy" one looks flat.
 *
 * This is the closed-form test, so it is exact and costs nothing — no
 * simulation required.
 */
export declare function isUnderdamped(config: SpringConfig): boolean;
/**
 * Damping that would make this spring settle without overshooting — the
 * critical-damping value for its stiffness and mass.
 */
export declare function criticalDamping(config: SpringConfig): number;
