import type { InertiaConfig } from '../types';
/**
 * Inertia: a thrown value slowing to rest.
 *
 * Friction is exponential decay, which has an exact closed form:
 *
 *     x(t) = from + (rest − from) · (1 − e^(−k·t))
 *
 * so `valueAt(t)` is a pure function of time — no integration, nothing to
 * cache, identical whether you play forwards or scrub backwards. `k` is the
 * friction; `rest` is where a free throw would stop (`from + velocity / k`),
 * moved to the chosen snap point and into bounds if given.
 *
 * Aiming at a snap point keeps the feel of the throw: it decelerates at the
 * same rate and simply lands on the snap, as if thrown with exactly the right
 * speed — which is also how GSAP's InertiaPlugin lands on `end` values.
 */
export declare const DEFAULT_INERTIA_FRICTION = 4;
/** Safety cap on a throw's duration. */
export declare const INERTIA_MAX_DURATION_MS = 60000;
/** Where a free throw with these parameters would stop, before snapping or bounds. */
export declare function naturalRest(config: InertiaConfig): number;
/** Where the throw comes to rest: the natural rest, snapped, then kept in bounds. */
export declare function inertiaRest(config: InertiaConfig): number;
/** Milliseconds until the throw is within its rest threshold — its natural duration. */
export declare function inertiaDuration(config: InertiaConfig): number;
/** The value `timeMs` after release. Exactly the rest value once settled. */
export declare function inertiaValueAt(config: InertiaConfig, timeMs: number): number;
/** The speed `timeMs` after release, in units per second (useful for chaining a follow-up). */
export declare function inertiaVelocityAt(config: InertiaConfig, timeMs: number): number;
