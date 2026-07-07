/**
 * Blueprint sample games — the same one-tap starters as `behavior-examples.ts`,
 * but authored as **Blueprint** (Unreal-style execution-flow) graphs instead of a
 * WHEN→DO rule list. They exist to showcase the Blueprint editor and to exercise
 * the blueprint→script compiler end-to-end.
 *
 * A game's logic lives in `store.blueprints`, an owner-keyed map ('' = scene,
 * tag = sprite). Each rule becomes an `event` node wired through a horizontal
 * chain of `action` nodes; `setBlueprint(owner, graph)` installs it. The sprites
 * themselves carry NO behaviors — the graph is the single source of truth.
 *
 * Note: the compiler already supports per-sprite collision events (hit/touching/
 * leaveScreen) even though the palette's BP_EVENT_KINDS doesn't list them yet, so
 * authoring them here is valid and compiles identically to the block games.
 */

import { store, setStore, setBlueprint, setSceneBehaviors, toggleBlueprint, setGameAuthoringMode, pushToHistory, bumpDirtyRevision } from '../store/app-store';
import { newBPNodeId, type Blueprint, type BPNode, type BPEdge } from './blueprint-types';
import type { Trigger, Action, Behavior } from './behavior-types';
import type { DrawingElement } from '../types';

let _c = 0;
/** A plain sprite (no behaviors — all logic lives in the Blueprint graph). */
const el = (type: string, x: number, y: number, w: number, h: number, tag: string, bg: string): DrawingElement => ({
    id: `bp-ex-${Date.now()}-${++_c}`,
    type, x, y, width: w, height: h, tag,
    backgroundColor: bg, fillStyle: 'solid',
    strokeColor: 'transparent', strokeWidth: 0, strokeStyle: 'solid',
    opacity: 100, angle: 0, roughness: 0, renderStyle: 'architectural',
    locked: false, layerId: store.activeLayerId || 'default-layer',
    seed: 1, roundness: null, behaviors: [] as Behavior[],
} as DrawingElement);

type Rule = { trigger: Trigger; actions: Action[] };

/**
 * Turn a WHEN→DO rule list into a Blueprint graph: one `event` node per rule,
 * wired through a left-to-right chain of `action` nodes (exec `out`→`in`). Laid
 * out in tidy rows so the graph reads top-to-bottom in the editor.
 */
function graphFromRules(rules: Rule[]): Blueprint {
    const nodes: BPNode[] = [];
    const edges: BPEdge[] = [];
    rules.forEach((r, row) => {
        const y = 40 + row * 96;
        const ev: BPNode = { id: newBPNodeId(), kind: 'event', x: 40, y, trigger: r.trigger };
        nodes.push(ev);
        let fromId = ev.id;
        r.actions.forEach((a, i) => {
            const an: BPNode = { id: newBPNodeId(), kind: 'action', x: 280 + i * 210, y, action: a };
            nodes.push(an);
            edges.push({ from: fromId, pin: 'out', to: an.id });
            fromId = an.id;
        });
    });
    return { nodes, edges };
}

/** Install a finished sample: elements + one or more owners' Blueprints, then open
 *  the editor. `graphs` is keyed by owner ('' = scene, tag = sprite). */
function install(elements: DrawingElement[], graphs: Record<string, Blueprint>, selectTag: string) {
    pushToHistory();
    setStore('elements', prev => [...prev, ...elements]);
    setSceneBehaviors([]);
    for (const [owner, g] of Object.entries(graphs)) setBlueprint(owner, g);
    setGameAuthoringMode('visual');
    const hero = elements.find(e => e.tag === selectTag);
    if (hero) setStore('selection', [hero.id]);
    bumpDirtyRevision();
    toggleBlueprint(true);
}

const page = () => store.slides[store.activeSlideIndex] || store.slides[0];

/**
 * Blueprint Platformer — the same level as the block Platformer, authored as a
 * graph on the Hero: run & jump across 3 platforms, collect 3 coins, reach the
 * flag to win, fall off = game over.
 */
export function buildBlueprintPlatformerExample(): void {
    const p = page();
    const X = p ? p.spatialPosition.x : 0;
    const Y = p ? p.spatialPosition.y : 0;
    const W = p ? p.dimensions.width : 800;
    const H = p ? p.dimensions.height : 600;
    const G = Y + H - 40;

    const elements = [
        el('rectangle', X, G, W, 40, 'Ground', '#334155'),
        el('rectangle', X + 170, Y + 430, 120, 20, 'P1', '#64748b'),
        el('rectangle', X + 350, Y + 320, 120, 20, 'P2', '#64748b'),
        el('rectangle', X + 560, Y + 380, 190, 20, 'P3', '#64748b'),
        el('circle', X + 216, Y + 372, 26, 26, 'Coin1', '#fbbf24'),
        el('circle', X + 396, Y + 262, 26, 26, 'Coin2', '#fbbf24'),
        el('circle', X + 612, Y + 322, 26, 26, 'Coin3', '#fbbf24'),
        el('triangle', X + 700, Y + 336, 34, 44, 'Goal', '#ef4444'),
        el('rectangle', X + 40, Y + 80, 40, 44, 'Hero', '#22c55e'),
    ];

    const grab = (coin: string): Rule => ({
        trigger: { kind: 'hit', target: coin },
        actions: [{ kind: 'score', delta: 100 }, { kind: 'destroy', target: coin }, { kind: 'playSound', sound: 'coin' }],
    });

    const graph = graphFromRules([
        { trigger: { kind: 'start' }, actions: [{ kind: 'gravity', on: true }] },
        { trigger: { kind: 'keyHold', button: 'left' }, actions: [{ kind: 'moveDir', dir: 'left', speed: 'medium' }] },
        { trigger: { kind: 'keyHold', button: 'right' }, actions: [{ kind: 'moveDir', dir: 'right', speed: 'medium' }] },
        { trigger: { kind: 'keyPress', button: 'a' }, actions: [{ kind: 'jump', strength: 'medium' }, { kind: 'playSound', sound: 'jump' }] },
        { trigger: { kind: 'touching', target: 'Ground' }, actions: [{ kind: 'land' }] },
        { trigger: { kind: 'touching', target: 'P1' }, actions: [{ kind: 'land' }] },
        { trigger: { kind: 'touching', target: 'P2' }, actions: [{ kind: 'land' }] },
        { trigger: { kind: 'touching', target: 'P3' }, actions: [{ kind: 'land' }] },
        grab('Coin1'), grab('Coin2'), grab('Coin3'),
        { trigger: { kind: 'hit', target: 'Goal' }, actions: [{ kind: 'playSound', sound: 'win' }, { kind: 'win', message: 'YOU WIN!' }] },
        { trigger: { kind: 'leaveScreen' }, actions: [{ kind: 'playSound', sound: 'lose' }, { kind: 'gameOver', message: 'FELL OFF!' }] },
    ]);

    install(elements, { Hero: graph }, 'Hero');
}

/**
 * Blueprint Breakout — bounce the ball to smash every brick. Shows off Blueprint
 * variables and a scene+sprite split: the Ball graph handles bounces/breaks, and
 * a Scene graph tracks the brick counter and declares the win.
 */
export function buildBlueprintBreakoutExample(): void {
    const p = page();
    const X = p ? p.spatialPosition.x : 0;
    const Y = p ? p.spatialPosition.y : 0;
    const W = p ? p.dimensions.width : 800;
    const H = p ? p.dimensions.height : 600;

    const COLS = 5, ROWS = 2, BW = 116, BH = 30, GAP = 12;
    const gridW = COLS * BW + (COLS - 1) * GAP;
    const bx0 = X + (W - gridW) / 2, by0 = Y + 70;
    const brickColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];
    const bricks: DrawingElement[] = [];
    const brickTags: string[] = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const tag = `Brick${r * COLS + c + 1}`;
        brickTags.push(tag);
        bricks.push(el('rectangle', bx0 + c * (BW + GAP), by0 + r * (BH + GAP), BW, BH, tag, brickColors[c]));
    }

    const paddle = el('rectangle', X + W / 2 - 70, Y + H - 40, 140, 18, 'Paddle', '#111827');
    const ball = el('circle', X + W / 2 - 9, Y + H - 130, 18, 18, 'Ball', '#e11d48');
    const elements = [...bricks, paddle, ball];

    // Ball: launch, bounce off the three solid walls + paddle, break bricks, and
    // fall out the bottom = lose. Each brick break also ticks the shared counter.
    const smash = (brick: string) => ({
        trigger: { kind: 'hit', target: brick } as Trigger,
        actions: [{ kind: 'bounce' }, { kind: 'destroy', target: brick }, { kind: 'score', delta: 10 }, { kind: 'changeVar', name: 'bricks', delta: -1 }, { kind: 'playSound', sound: 'hit' }] as Action[],
    });
    const ballGraph = graphFromRules([
        { trigger: { kind: 'start' }, actions: [{ kind: 'glide', dir: 'upRight', speed: 'medium' }] },
        { trigger: { kind: 'hit', target: 'edge', edge: 'top' }, actions: [{ kind: 'bounce' }] },
        { trigger: { kind: 'hit', target: 'edge', edge: 'left' }, actions: [{ kind: 'bounce' }] },
        { trigger: { kind: 'hit', target: 'edge', edge: 'right' }, actions: [{ kind: 'bounce' }] },
        { trigger: { kind: 'hit', target: 'Paddle' }, actions: [{ kind: 'bounce' }, { kind: 'playSound', sound: 'blip' }] },
        ...brickTags.map(smash),
        { trigger: { kind: 'leaveScreen' }, actions: [{ kind: 'playSound', sound: 'lose' }, { kind: 'gameOver', message: 'GAME OVER' }] },
    ]);

    // Paddle: slide with the arrow keys.
    const paddleGraph = graphFromRules([
        { trigger: { kind: 'keyHold', button: 'left' }, actions: [{ kind: 'moveDir', dir: 'left', speed: 'fast' }] },
        { trigger: { kind: 'keyHold', button: 'right' }, actions: [{ kind: 'moveDir', dir: 'right', speed: 'fast' }] },
    ]);

    // Scene: declare the brick counter and win when it reaches zero.
    const sceneGraph = graphFromRules([
        { trigger: { kind: 'start' }, actions: [{ kind: 'setVar', name: 'bricks', value: brickTags.length }, { kind: 'showVar', name: 'bricks' }] },
        { trigger: { kind: 'varReaches', name: 'bricks', value: 0, compare: 'atMost' }, actions: [{ kind: 'playSound', sound: 'win' }, { kind: 'win', message: 'YOU WIN!' }] },
    ]);

    install(elements, { '': sceneGraph, Ball: ballGraph, Paddle: paddleGraph }, 'Ball');
}

/** Tiny node/edge builder with rough auto-layout (positions aren't load-bearing). */
function graphBuilder() {
    const nodes: BPNode[] = [];
    const edges: BPEdge[] = [];
    let i = 0;
    const N = (kind: BPNode['kind'], props: Partial<BPNode>): string => {
        const id = newBPNodeId();
        nodes.push({ id, kind, x: 40 + (i % 6) * 200, y: 40 + Math.floor(i / 6) * 130, ...props } as BPNode);
        i++;
        return id;
    };
    const E = (from: string, pin: string, to: string, toPin?: string) =>
        edges.push(toPin ? { from, pin, to, toPin } : { from, pin, to } as BPEdge);
    return { nodes, edges, N, E };
}

/**
 * Blueprint Slingshot — the drag-aim Angry-Birds sample, authored entirely as a
 * Blueprint. This is what the new **pointer** data node and **setVelocity /
 * moveToXY** actions unlock: tap the bird, drag to aim (it follows the pointer),
 * release to fire (launch velocity = (anchor − pointer) × power, then gravity
 * takes over). Pop every pig. Multi-shot: leaving the screen resets it to the sling.
 *
 * Exported pure helper so tests can compile the exact same graph the New Game
 * starter installs.
 */
export function slingshotSample(X: number, Y: number, W: number, H: number) {
    const GROUND = Y + H - 40;
    const AX = X + 130, AY = GROUND - 120;   // sling pouch anchor
    const POWER = 7;
    const pigTags = ['Pig1', 'Pig2', 'Pig3'];

    const elements: DrawingElement[] = [
        el('rectangle', X, Y, W, H, 'Sky', '#bfe9ff'),
        el('rectangle', X, GROUND, W, Y + H - GROUND, 'Ground', '#7cb342'),
        el('rectangle', AX - 6, AY, 12, GROUND - AY, 'Post', '#6d4c41'),
        el('circle', AX - 20, AY - 20, 40, 40, 'Bird', '#e53935'),
        el('circle', X + W - 250, GROUND - 46, 46, 46, 'Pig1', '#5bbf3a'),
        el('circle', X + W - 160, GROUND - 46, 46, 46, 'Pig2', '#5bbf3a'),
        el('circle', X + W - 90, GROUND - 130, 46, 46, 'Pig3', '#5bbf3a'),
    ];

    // —— Bird graph: aim by dragging the pointer, release to launch ——
    const g = graphBuilder();
    // reusable data nodes
    const Lpow = g.N('literal', { dataValue: POWER });
    const Lax = g.N('literal', { dataValue: AX });
    const Lay = g.N('literal', { dataValue: AY });
    const L1 = g.N('literal', { dataValue: 1 });
    const Px = g.N('pointer', { axis: 'x' });
    const Py = g.N('pointer', { axis: 'y' });
    const Pdown = g.N('pointer', { axis: 'down' });
    const Gaim = g.N('getVar', { varName: 'aiming' });

    // start → sit the bird in the pouch, aiming off
    const Estart = g.N('event', { trigger: { kind: 'start' } });
    const Aplace = g.N('action', { action: { kind: 'moveToXY', x: AX, y: AY } });
    const Aaim0s = g.N('action', { action: { kind: 'setVar', name: 'aiming', value: 0 } });
    g.E(Estart, 'out', Aplace); g.E(Aplace, 'out', Aaim0s);

    // tap the bird → start aiming
    const Etap = g.N('event', { trigger: { kind: 'tap' } });
    const Aaim1 = g.N('action', { action: { kind: 'setVar', name: 'aiming', value: 1 } });
    g.E(Etap, 'out', Aaim1);

    // every tick → if aiming: follow the pointer while it's held, launch on release
    const Etick = g.N('event', { trigger: { kind: 'tick' } });
    const C1 = g.N('compare', { op: 'atLeast' }); g.E(Gaim, 'val', C1, 'a'); g.E(L1, 'val', C1, 'b');
    const B1 = g.N('branch', { condition: { name: 'aiming', compare: 'atLeast', value: 1 } }); g.E(C1, 'val', B1, 'cond');
    const C2 = g.N('compare', { op: 'atLeast' }); g.E(Pdown, 'val', C2, 'a'); g.E(L1, 'val', C2, 'b');
    const B2 = g.N('branch', { condition: { name: 'aiming', compare: 'atLeast', value: 1 } }); g.E(C2, 'val', B2, 'cond');
    g.E(Etick, 'out', B1); g.E(B1, 'true', B2);
    // held → bird follows the pointer
    const Afollow = g.N('action', { action: { kind: 'moveToXY', x: 0, y: 0 } }); g.E(Px, 'val', Afollow, 'x'); g.E(Py, 'val', Afollow, 'y');
    g.E(B2, 'true', Afollow);
    // released → velocity = (anchor − pointer) × POWER, then gravity on
    const Mvxs = g.N('math', { mathOp: '-' }); g.E(Lax, 'val', Mvxs, 'a'); g.E(Px, 'val', Mvxs, 'b');
    const Mvx = g.N('math', { mathOp: '*' }); g.E(Mvxs, 'val', Mvx, 'a'); g.E(Lpow, 'val', Mvx, 'b');
    const Mvys = g.N('math', { mathOp: '-' }); g.E(Lay, 'val', Mvys, 'a'); g.E(Py, 'val', Mvys, 'b');
    const Mvy = g.N('math', { mathOp: '*' }); g.E(Mvys, 'val', Mvy, 'a'); g.E(Lpow, 'val', Mvy, 'b');
    const Avel = g.N('action', { action: { kind: 'setVelocity', vx: 0, vy: 0 } }); g.E(Mvx, 'val', Avel, 'vx'); g.E(Mvy, 'val', Avel, 'vy');
    const Agrav = g.N('action', { action: { kind: 'gravity', on: true } });
    const Aaim0 = g.N('action', { action: { kind: 'setVar', name: 'aiming', value: 0 } });
    const Asnd = g.N('action', { action: { kind: 'playSound', sound: 'powerup' } });
    g.E(B2, 'false', Avel); g.E(Avel, 'out', Agrav); g.E(Agrav, 'out', Aaim0); g.E(Aaim0, 'out', Asnd);

    // hit a pig → pop it, score, tick the counter
    for (const pt of pigTags) {
        const Eh = g.N('event', { trigger: { kind: 'hit', target: pt } });
        const Ad = g.N('action', { action: { kind: 'destroy', target: pt } });
        const As = g.N('action', { action: { kind: 'score', delta: 1000 } });
        const Ac = g.N('action', { action: { kind: 'changeVar', name: 'pigs', delta: -1 } });
        const Ae = g.N('action', { action: { kind: 'playSound', sound: 'explosion' } });
        g.E(Eh, 'out', Ad); g.E(Ad, 'out', As); g.E(As, 'out', Ac); g.E(Ac, 'out', Ae);
    }

    // flew off screen → reset to the sling for the next shot
    const Elv = g.N('event', { trigger: { kind: 'leaveScreen' } });
    const Astop = g.N('action', { action: { kind: 'setVelocity', vx: 0, vy: 0 } });
    const Agoff = g.N('action', { action: { kind: 'gravity', on: false } });
    const Arsp = g.N('action', { action: { kind: 'moveToXY', x: AX, y: AY } });
    g.E(Elv, 'out', Astop); g.E(Astop, 'out', Agoff); g.E(Agoff, 'out', Arsp);

    const birdGraph: Blueprint = { nodes: g.nodes, edges: g.edges };
    const sceneGraph = graphFromRules([
        { trigger: { kind: 'start' }, actions: [{ kind: 'setVar', name: 'pigs', value: pigTags.length }, { kind: 'showVar', name: 'pigs' }] },
        { trigger: { kind: 'varReaches', name: 'pigs', value: 0, compare: 'atMost' }, actions: [{ kind: 'playSound', sound: 'win' }, { kind: 'win', message: "POPPED 'EM ALL!" }] },
    ]);

    return { elements, blueprints: { '': sceneGraph, Bird: birdGraph } as Record<string, Blueprint> };
}

export function buildBlueprintSlingshotExample(): void {
    const p = page();
    const X = p ? p.spatialPosition.x : 0;
    const Y = p ? p.spatialPosition.y : 0;
    const W = p ? p.dimensions.width : 1280;
    const H = p ? p.dimensions.height : 720;
    const { elements, blueprints } = slingshotSample(X, Y, W, H);
    install(elements, blueprints, 'Bird');
}
