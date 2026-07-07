/**
 * Shared UI vocabulary for the visual game builder — option lists, default
 * factories, and human-readable labels. Used by BOTH the Behaviors panel and
 * the node-graph editor so they speak one language over the same behavior data.
 */

import type { Behavior, Trigger, Action } from './behavior-types';

export const TRIGGERS: { v: Trigger['kind']; label: string }[] = [
    { v: 'start', label: 'When it starts' },
    { v: 'tick', label: 'Every moment' },
    { v: 'keyPress', label: 'When key pressed' },
    { v: 'keyHold', label: 'While key held' },
    { v: 'tap', label: 'When tapped' },
    { v: 'hit', label: 'When it hits…' },
    { v: 'touching', label: 'While touching…' },
    { v: 'leaveScreen', label: 'When it leaves the screen' },
    { v: 'varReaches', label: 'When a variable reaches…' },
    { v: 'timer', label: 'Every few seconds' },
    { v: 'receive', label: 'When I receive message…' },
];
export const COMPARE = [
    { v: 'atLeast', label: 'is at least' }, { v: 'atMost', label: 'is at most' }, { v: 'equals', label: 'equals' },
] as const;
export const BUTTONS = [
    { v: 'left', label: '◀ Left' }, { v: 'right', label: '▶ Right' },
    { v: 'up', label: '▲ Up' }, { v: 'down', label: '▼ Down' },
    { v: 'a', label: 'A / Space' }, { v: 'b', label: 'B / Shift' },
] as const;
export const SPEEDS = ['slow', 'medium', 'fast'] as const;
export const DIR4 = ['left', 'right', 'up', 'down'] as const;
export const DIR8 = ['up', 'down', 'left', 'right', 'upLeft', 'upRight', 'downLeft', 'downRight'] as const;
export const EDGES = ['any', 'left', 'right', 'top', 'bottom'] as const;
export const SPAWN_AT = [
    { v: 'randomTop', label: 'random top' }, { v: 'randomEdge', label: 'random spot' },
    { v: 'center', label: 'center' }, { v: 'here', label: 'here' },
] as const;

/** Sprite actions (need a `this`); Scene actions are the safe subset below. */
export const ACTIONS: { v: Action['kind']; label: string }[] = [
    { v: 'moveDir', label: 'move' }, { v: 'glide', label: 'glide (keep moving)' },
    { v: 'bounce', label: 'bounce' }, { v: 'gravity', label: 'gravity (fall)' },
    { v: 'jump', label: 'jump' }, { v: 'land', label: 'land on platform' },
    { v: 'rotate', label: 'rotate' },
    { v: 'color', label: 'change color' }, { v: 'scale', label: 'grow / shrink' },
    { v: 'show', label: 'show' }, { v: 'hide', label: 'hide' },
    { v: 'setText', label: 'set text' }, { v: 'moveTo', label: 'jump to' },
    { v: 'setVelocity', label: 'set velocity (vx, vy)' }, { v: 'moveToXY', label: 'move to point (x, y)' },
    { v: 'spawn', label: 'spawn a copy' },
    { v: 'destroy', label: 'destroy' }, { v: 'score', label: 'change score' },
    { v: 'setVar', label: 'set variable' }, { v: 'changeVar', label: 'change variable' }, { v: 'showVar', label: 'show variable' },
    { v: 'goToState', label: 'go to state' }, { v: 'playAnim', label: 'play effect' },
    { v: 'playSound', label: 'play sound' }, { v: 'music', label: 'background music' },
    { v: 'broadcast', label: 'broadcast message' },
    { v: 'goToPage', label: 'go to page' }, { v: 'win', label: 'win!' }, { v: 'gameOver', label: 'game over' },
];
export const SCENE_ACTION_KINDS = new Set<Action['kind']>(['score', 'setVar', 'changeVar', 'showVar', 'spawn', 'goToState', 'goToPage', 'playSound', 'music', 'broadcast', 'win', 'gameOver']);

export const defaultTrigger = (kind: Trigger['kind']): Trigger => {
    switch (kind) {
        case 'keyPress': case 'keyHold': return { kind, button: 'left' } as Trigger;
        case 'hit': return { kind: 'hit', target: 'edge', edge: 'any' };
        case 'touching': return { kind: 'touching', target: '' };
        case 'varReaches': return { kind: 'varReaches', name: 'score', value: 10, compare: 'atLeast' };
        case 'timer': return { kind: 'timer', seconds: 1 };
        case 'receive': return { kind: 'receive', message: 'go' };
        default: return { kind } as Trigger;
    }
};
export const defaultAction = (kind: Action['kind']): Action => {
    switch (kind) {
        case 'moveDir': return { kind, dir: 'right', speed: 'medium' };
        case 'glide': return { kind, dir: 'right', speed: 'medium' };
        case 'gravity': return { kind, on: true };
        case 'jump': return { kind, strength: 'medium' };
        case 'rotate': return { kind, deg: 10 };
        case 'color': return { kind, color: '#f59e0b' };
        case 'scale': return { kind, factor: 1.1 };
        case 'setText': return { kind, text: 'Hi' };
        case 'moveTo': return { kind, at: 'randomTop' };
        case 'setVelocity': return { kind, vx: 0, vy: 0 };
        case 'moveToXY': return { kind, x: 0, y: 0 };
        case 'spawn': return { kind, sprite: '', at: 'randomTop' };
        case 'destroy': return { kind, target: 'this' };
        case 'score': return { kind, delta: 1 };
        case 'setVar': return { kind, name: 'lives', value: 3 };
        case 'changeVar': return { kind, name: 'lives', delta: -1 };
        case 'showVar': return { kind, name: 'lives' };
        case 'goToState': return { kind, state: '' };
        case 'playAnim': return { kind, preset: 'bounce' };
        case 'playSound': return { kind, sound: 'coin' };
        case 'music': return { kind, on: true };
        case 'broadcast': return { kind, message: 'go' };
        case 'goToPage': return { kind, index: 0 };
        case 'win': return { kind, message: 'YOU WIN!' };
        case 'gameOver': return { kind, message: 'GAME OVER' };
        default: return { kind } as Action;
    }
};

// ── Human-readable labels (for graph nodes and compact views) ──

export function triggerLabel(t: Trigger): string {
    switch (t.kind) {
        case 'start': return 'when it starts';
        case 'tick': return 'every moment';
        case 'keyPress': return `when ${t.button} pressed`;
        case 'keyHold': return `while ${t.button} held`;
        case 'tap': return 'when tapped';
        case 'hit': return `when it hits ${t.target === 'edge' ? `a wall (${t.edge})` : t.target}`;
        case 'touching': return `while touching ${t.target || '…'}`;
        case 'leaveScreen': return 'when it leaves the screen';
        case 'varReaches': return `when ${t.name} ${t.compare === 'atMost' ? '≤' : t.compare === 'equals' ? '=' : '≥'} ${t.value}`;
        case 'timer': return `every ${t.seconds}s`;
        case 'receive': return `when I receive "${t.message}"`;
        default: return (t as any).kind;
    }
}

export function actionLabel(a: Action): string {
    switch (a.kind) {
        case 'moveDir': return `move ${a.dir} (${a.speed})`;
        case 'glide': return `glide ${a.dir} (${a.speed})`;
        case 'bounce': return 'bounce';
        case 'gravity': return a.on ? 'gravity on' : 'gravity off';
        case 'jump': return `jump (${a.strength})`;
        case 'land': return 'land on platform';
        case 'rotate': return `rotate ${a.deg}°`;
        case 'color': return `color ${a.color}`;
        case 'scale': return `scale ×${a.factor}`;
        case 'show': return 'show';
        case 'hide': return 'hide';
        case 'setText': return `set text "${a.text}"`;
        case 'moveTo': return `jump to ${a.at}`;
        case 'setVelocity': return `velocity (${a.vx}, ${a.vy})`;
        case 'moveToXY': return `move to (${a.x}, ${a.y})`;
        case 'spawn': return `spawn ${a.sprite || '?'} (${a.at})`;
        case 'destroy': return `destroy ${a.target}`;
        case 'score': return `score ${a.delta >= 0 ? '+' : ''}${a.delta}`;
        case 'setVar': return `${a.name} = ${a.value}`;
        case 'changeVar': return `${a.name} ${a.delta >= 0 ? '+' : ''}${a.delta}`;
        case 'showVar': return `show ${a.name}`;
        case 'goToState': return `go to state ${a.state || '?'}`;
        case 'playAnim': return `effect ${a.preset}`;
        case 'playSound': return `sound ${a.sound}`;
        case 'music': return a.on ? 'music on' : 'music off';
        case 'broadcast': return `broadcast "${a.message}"`;
        case 'goToPage': return `go to page ${a.index}`;
        case 'win': return `win: ${a.message}`;
        case 'gameOver': return `game over: ${a.message}`;
        default: return (a as any).kind;
    }
}

export function conditionLabel(b: Behavior): string | null {
    if (!b.condition) return null;
    const c = b.condition;
    return `only if ${c.name} ${c.compare === 'atMost' ? '≤' : c.compare === 'equals' ? '=' : '≥'} ${c.value}`;
}

/** Messages this behavior broadcasts (its output ports). */
export const broadcastsOf = (b: Behavior): string[] =>
    b.actions.filter(a => a.kind === 'broadcast').map(a => (a as any).message as string);

/** The message this behavior listens for (its input port), if any. */
export const receivesOf = (b: Behavior): string | null =>
    b.trigger.kind === 'receive' ? b.trigger.message : null;
