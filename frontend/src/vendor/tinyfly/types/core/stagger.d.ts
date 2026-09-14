import type { StaggerConfig, StaggerFrom } from '../types';
/**
 * Stagger offset maths.
 *
 * One implementation shared by three callers: the editor's "fan a preset across
 * letters" action, the runtime `targets` track (expanded during evaluation), and
 * the GSAP compat facade's `stagger` var. Pure and deterministic — given an
 * index and a count it always returns the same offset, so staggered output
 * serializes and replays identically.
 */
/**
 * Distance from the fan's origin, in "index steps", for one item.
 *
 * - `start`  → 0, 1, 2, …            (default; matches the editor's behaviour)
 * - `end`    → reversed
 * - `center` → grows outward from the middle
 * - `edges`  → grows inward from both ends
 * - number   → distance from that index
 */
export declare function staggerDistance(index: number, count: number, from?: StaggerFrom): number;
/**
 * The largest distance any item in the set can have. Used to convert a total
 * `amount` into a per-step value.
 */
export declare function maxStaggerDistance(count: number, from?: StaggerFrom): number;
/**
 * Time offset in milliseconds for one target in a staggered set.
 *
 * `amount` (total spread) wins over `each` (per-step gap) when both are given,
 * matching GSAP. With neither, the offset is 0 — a stagger config that says
 * nothing should do nothing rather than guess a default.
 */
export declare function staggerOffset(index: number, count: number, config: StaggerConfig): number;
/**
 * Every offset for a set, in target order. Convenience for authoring tools that
 * bake the stagger into separate tracks.
 */
export declare function staggerOffsets(count: number, config: StaggerConfig): number[];
/** The longest offset in a set — how much a stagger extends a timeline. */
export declare function staggerSpan(count: number, config: StaggerConfig): number;
