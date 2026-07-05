/**
 * Visual game builder — the "behaviors" data model.
 *
 * A behavior is a Flash-MX-style rule attached to a sprite (a DrawingElement)
 * or to the scene: WHEN [trigger] DO [actions]. Blocks are the source of truth;
 * `behaviors-to-script.ts` compiles them to a `game.*` script that the existing
 * runtime and exported player run. Sprites are referenced by their `tag`.
 */

import type { GameButton } from './game-runtime';

export type Speed = 'slow' | 'medium' | 'fast';
export type Dir8 =
    | 'up' | 'down' | 'left' | 'right'
    | 'upLeft' | 'upRight' | 'downLeft' | 'downRight';
export type Dir4 = 'up' | 'down' | 'left' | 'right';
export type Edge = 'any' | 'left' | 'right' | 'top' | 'bottom';
export type SpawnAt = 'here' | 'randomTop' | 'randomEdge' | 'center';

/** WHEN — what starts the rule. */
export type Trigger =
    | { kind: 'start' }
    | { kind: 'tick' }
    | { kind: 'keyPress'; button: GameButton }
    | { kind: 'keyHold'; button: GameButton }
    | { kind: 'tap' }
    /** target = a sprite tag, or 'edge' with a side. */
    | { kind: 'hit'; target: string; edge?: Edge }
    | { kind: 'leaveScreen' };

/** DO — what happens. */
export type Action =
    | { kind: 'moveDir'; dir: Dir4; speed: Speed }
    | { kind: 'glide'; dir: Dir8; speed: Speed }
    | { kind: 'bounce' }
    | { kind: 'rotate'; deg: number }
    | { kind: 'color'; color: string }
    | { kind: 'scale'; factor: number }
    | { kind: 'show' }
    | { kind: 'hide' }
    | { kind: 'setText'; text: string }
    | { kind: 'moveTo'; at: SpawnAt }
    | { kind: 'spawn'; sprite: string; at: SpawnAt }
    | { kind: 'destroy'; target: 'this' | string }
    | { kind: 'score'; delta: number }
    | { kind: 'goToState'; state: string }
    | { kind: 'playAnim'; preset: string }
    | { kind: 'goToPage'; index: number }
    | { kind: 'win'; message: string }
    | { kind: 'gameOver'; message: string };

export interface Behavior {
    id: string;
    trigger: Trigger;
    actions: Action[];
}

/** Numeric speed (world px/s) for the friendly Speed levels. */
export const SPEED_PX: Record<Speed, number> = { slow: 140, medium: 300, fast: 520 };

/** Unit velocity vector for each of the 8 glide directions. */
export const DIR8_VEC: Record<Dir8, { x: number; y: number }> = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
    upLeft: { x: -0.7071, y: -0.7071 }, upRight: { x: 0.7071, y: -0.7071 },
    downLeft: { x: -0.7071, y: 0.7071 }, downRight: { x: 0.7071, y: 0.7071 },
};

export const DIR4_VEC: Record<Dir4, { x: number; y: number }> = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};

/** Animation presets offered by the builder (subset of element-animator presets). */
export const ANIM_PRESETS = ['bounce', 'pulse', 'shakeX', 'flash', 'tada', 'wobble', 'rubberBand'] as const;

let _bid = 0;
export const newBehaviorId = (): string => `bhv-${Date.now()}-${++_bid}`;

/** True if any element carries behaviors or the scene has rules — i.e. this is a game. */
export const hasBehaviors = (elements: { behaviors?: Behavior[] }[], scene?: Behavior[]): boolean =>
    (scene?.length ?? 0) > 0 || elements.some(e => (e.behaviors?.length ?? 0) > 0);
