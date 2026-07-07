/**
 * Blueprint — the free-form execution-flow graph (Unreal-style) for the visual
 * game builder.
 *
 * Where the behaviors model is a flat list of WHEN→DO rules, a Blueprint is a
 * graph of nodes connected by EXECUTION wires: an event fires, execution flows
 * along the wires through action and branch nodes in the order you draw them.
 * It compiles to the same `game.*` runtime script as behaviors (see
 * `blueprint-to-script.ts`) and coexists with them — one document can use either
 * or both.
 *
 * Phase 1 is scene-level (no per-sprite `this`), so action nodes are restricted
 * to the scene-safe actions (score/vars/spawn/goToState/goToPage/sound/music/
 * broadcast/win/gameOver) that don't need an owner sprite. Node kinds:
 *   - event    : an entry point (a Trigger — the scene-level subset).
 *   - action   : does one thing (an Action). One exec in/out.
 *   - branch   : `if (variable ? value)` → routes execution to a true / false pin.
 *   - sequence : run its ordered outputs (seq0, seq1, …) one after another.
 *   - delay    : wait `seconds`, then continue out (one-shot; drained in the tick).
 *
 * Data (pure) nodes carry a VALUE along data wires instead of execution:
 *   - getVar   : reads a variable's current value.
 *   - literal  : a constant number.
 *   - compare  : a ⟨op⟩ b → a boolean, used to drive a branch's condition input.
 *   - math       : a ⟨+ − × ÷ %⟩ b → a number, feeds compares or action params.
 *   - random     : a random number in [min, max).
 *   - spriteProp : a sprite's x / y / width / height.
 *
 * Data can also drive numeric ACTION params (score delta, setVar value, …) — see
 * `actionDataPorts` — so e.g. `set score = level × 10` is fully wireable.
 */

import type { Trigger, Action, Condition, Compare } from './behavior-types';

export type BPNodeKind = 'event' | 'action' | 'branch' | 'sequence' | 'delay'
    | 'getVar' | 'literal' | 'compare' | 'math' | 'random' | 'spriteProp';

/** Math operators (compile straight to JS). */
export type MathOp = '+' | '-' | '*' | '/' | '%';
export const MATH_OPS: MathOp[] = ['+', '-', '*', '/', '%'];

/** Sprite properties a spriteProp node can read. */
export type SpriteProp = 'x' | 'y' | 'width' | 'height';
export const SPRITE_PROPS: SpriteProp[] = ['x', 'y', 'width', 'height'];

/** An execution output pin ('out' | 'true' | 'false' | 'seqN') or the data output 'val'. */
export type BPPin = string;

export interface BPNode {
    id: string;
    kind: BPNodeKind;
    /** Canvas position (persisted). */
    x: number;
    y: number;
    /** event nodes: the entry trigger. */
    trigger?: Trigger;
    /** action nodes: the thing to do. */
    action?: Action;
    /** branch nodes: inline fallback comparison (used when no data wire feeds `cond`). */
    condition?: Condition;
    /** sequence nodes: how many ordered outputs (default 2). */
    count?: number;
    /** delay nodes: seconds to wait before continuing. */
    seconds?: number;
    /** getVar nodes: the variable name to read. */
    varName?: string;
    /** literal nodes: the constant value. */
    dataValue?: number;
    /** compare nodes: the comparison operator. */
    op?: Compare;
    /** math nodes: the arithmetic operator. */
    mathOp?: MathOp;
    /** random nodes: inclusive-low / exclusive-high bounds. */
    min?: number;
    max?: number;
    /** spriteProp nodes: which sprite (tag) and which property to read. */
    spriteTag?: string;
    prop?: SpriteProp;
}

/** Pure/data node kinds (no exec pins; they produce a value on the 'val' data pin). */
export const DATA_KINDS: BPNodeKind[] = ['getVar', 'literal', 'compare', 'math', 'random', 'spriteProp'];
export const isDataNode = (k: BPNodeKind): boolean => DATA_KINDS.includes(k);

/** Data OUTPUT pins a node exposes (data nodes → one 'val'). */
export const dataOutputs = (n: BPNode): BPPin[] => isDataNode(n.kind) ? ['val'] : [];

/** The numeric action params a data wire can drive (port name = the value it replaces). */
export const actionDataPorts = (a?: Action): BPPin[] => {
    if (!a) return [];
    if (a.kind === 'score' || a.kind === 'changeVar') return ['delta'];
    if (a.kind === 'setVar') return ['value'];
    return [];
};

/** Data INPUT ports a node accepts (compare/math: a,b · branch: cond · action: its numeric params). */
export const dataInputs = (n: BPNode): BPPin[] =>
    n.kind === 'compare' || n.kind === 'math' ? ['a', 'b']
        : n.kind === 'branch' ? ['cond']
            : n.kind === 'action' ? actionDataPorts(n.action)
                : [];

/**
 * A directed wire. Exec wires connect an output pin to a node's exec input
 * (`toPin` omitted). Data wires connect a data output ('val') to a specific data
 * input port (`toPin` = 'a' | 'b' | 'cond').
 */
export interface BPEdge {
    from: string;   // source node id
    pin: BPPin;     // which output pin of the source ('out'/'true'/…/'val')
    to: string;     // destination node id
    toPin?: BPPin;  // data wires: which input port on the destination
}

export interface Blueprint {
    nodes: BPNode[];
    edges: BPEdge[];
}

export const emptyBlueprint = (): Blueprint => ({ nodes: [], edges: [] });

/** True when the graph has at least one node (i.e. it contributes to the game). */
export const blueprintHasContent = (bp?: Blueprint | null): boolean =>
    !!bp && Array.isArray(bp.nodes) && bp.nodes.length > 0;

/** How many ordered outputs a sequence node has (min 2). */
export const seqCount = (n: BPNode): number => Math.max(2, n.count ?? 2);

/** The exec output pins a node exposes, in draw order (data nodes have none). */
export const pinsOf = (n: BPNode): BPPin[] => {
    if (isDataNode(n.kind)) return [];
    if (n.kind === 'branch') return ['true', 'false'];
    if (n.kind === 'sequence') return Array.from({ length: seqCount(n) }, (_, i) => `seq${i}`);
    return ['out']; // event, action, delay
};

/** Whether a node kind has an exec INPUT pin (events start chains; data nodes are pure). */
export const hasExecIn = (kind: BPNodeKind): boolean => kind !== 'event' && !isDataNode(kind);

let _bpid = 0;
export const newBPNodeId = (): string => `bp-${Date.now()}-${++_bpid}`;

/** Event triggers a scene-level Blueprint supports (no per-sprite context). */
export const BP_EVENT_KINDS: Trigger['kind'][] = ['start', 'tick', 'keyPress', 'keyHold', 'tap', 'timer', 'varReaches', 'receive'];
