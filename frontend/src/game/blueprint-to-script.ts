/**
 * Blueprint → `game.*` script fragments.
 *
 * Walks the execution wires of a Blueprint (see `blueprint-types.ts`) and emits
 * JS statements that slot into the SAME generated script as the behaviors
 * compiler — reusing its preamble helpers (`_vars`, `_setVar`, `_emit`, `_tmr`,
 * `_hit`, `_off`, `game.*`) and its event sections. That's why this returns
 * *fragments* grouped by event placement rather than a standalone script: one
 * shared runtime, two authoring models.
 *
 * Owner-aware: a Blueprint belongs to an owner — the Scene (`ownerTag === ''`,
 * so `me` is `null` and only scene-safe actions apply) or a sprite (its tag, so
 * `me = S("<tag>")` and the full action + event set applies, exactly like a
 * per-sprite behavior). Execution flows action→action along `out` pins; a branch
 * routes to its `true` / `false` pin.
 */

import type { DrawingElement } from '../types';
import type { Blueprint, BPPin } from './blueprint-types';
import type { Compare } from './behavior-types';
import { seqCount, dataInputs } from './blueprint-types';
import { emitAction } from './behaviors-to-script';

const q = (s: string): string => JSON.stringify(s ?? '');
const num = (n: number): string => (Number.isFinite(n) ? String(n) : '0');
const cmpOp = (c: Compare): string => c === 'atMost' ? '<=' : c === 'equals' ? '===' : '>=';

/**
 * Slop (px) added around a sprite's box when hit-testing a `tap`. A bare AABB makes small
 * sprites nearly ungrabbable — the Slingshot bird is only 40×40, so a few-px miss produced no
 * launch and no feedback, reading as "the game is broken." This gives every sprite tap a
 * forgiving grab margin (helps touch input too) without meaningfully affecting large sprites.
 */
const TAP_GRAB_PAD = 18;

/** Statements grouped by where they attach in the generated script. */
export interface BPFragments {
    start: string[];
    recv: { message: string; body: string }[];
    press: Record<string, string[]>;
    tap: string[];
    tick: string[];
}

const emptyFragments = (): BPFragments => ({ start: [], recv: [], press: {}, tap: [], tick: [] });

/** The node + exec-input port an EXEC output pin wires to (exec pins are never 'val'). */
function follow(bp: Blueprint, nodeId: string, pin: BPPin): { to: string; port: BPPin } | null {
    const e = bp.edges.find(e => e.from === nodeId && e.pin === pin && e.pin !== 'val');
    return e ? { to: e.to, port: e.toPin ?? 'in' } : null;
}

/** node-scoped loop variable name for a forLoop (also its `index` data value). */
const loopVar = (id: string) => '_l' + id.replace(/[^A-Za-z0-9]/g, '_');

/** The data expression feeding an input port (`to`,`toPin`), or null if unwired. */
function evalInput(bp: Blueprint, to: string, toPin: BPPin): string | null {
    const e = bp.edges.find(e => e.to === to && e.toPin === toPin && e.pin === 'val');
    return e ? evalDataNode(bp, e.from) : null;
}

/** A pure/data node → a JS value expression. */
function evalDataNode(bp: Blueprint, nodeId: string): string {
    const n = bp.nodes.find(x => x.id === nodeId);
    if (!n) return '0';
    if (n.kind === 'getVar') return `(_vars[${q(n.varName ?? '')}] || 0)`;
    if (n.kind === 'literal') return num(n.dataValue ?? 0);
    if (n.kind === 'compare') {
        const a = evalInput(bp, n.id, 'a') ?? '0';
        const b = evalInput(bp, n.id, 'b') ?? '0';
        return `(${a} ${cmpOp(n.op ?? 'atLeast')} ${b})`;
    }
    if (n.kind === 'math') {
        const a = evalInput(bp, n.id, 'a') ?? '0';
        const b = evalInput(bp, n.id, 'b') ?? '0';
        return `(${a} ${n.mathOp ?? '+'} ${b})`;
    }
    if (n.kind === 'random') {
        const lo = num(n.min ?? 0), hi = num(n.max ?? 1);
        return `(${lo} + Math.random() * (${hi} - ${lo}))`;
    }
    if (n.kind === 'spriteProp') {
        return `(S(${q(n.spriteTag ?? '')}) ? S(${q(n.spriteTag ?? '')}).${n.prop ?? 'x'} : 0)`;
    }
    if (n.kind === 'pointer') {
        const ax = n.axis ?? 'x';
        return ax === 'down' ? '(game.pointer().down ? 1 : 0)' : `game.pointer().${ax}`;
    }
    if (n.kind === 'forLoop') return loopVar(n.id); // the current loop index
    return '0';
}

/**
 * Emit the execution chain entering a node via `next` = { to, port }. `port` is
 * the exec-input port entered ('in' for most nodes; a gate uses enter/open/close/
 * toggle). `me`/`other` are sprite-handle expressions; `dt` the delta-time. Cycles
 * are cut by node id.
 */
function emitChain(bp: Blueprint, next: { to: string; port: BPPin } | null, elements: DrawingElement[], me: string, other: string, dt: string, indent: string, visited: Set<string>): string {
    // Keyed by node + entry port so a gate reached via a different input (e.g. the
    // Enter→…→Close "do once" idiom) still emits, while true cycles are cut.
    if (!next || visited.has(next.to + ':' + next.port)) return '';
    const nodeId = next.to, entry = next.port;
    const n = bp.nodes.find(x => x.id === nodeId);
    if (!n) return '';
    const seen = new Set(visited); seen.add(nodeId + ':' + entry);

    // Gate — a stateful pass. Which exec input fired decides what happens.
    if (n.kind === 'gate') {
        const key = q(`bp|gate|${n.id}`);
        const def = n.startOpen ? 'true' : 'false';
        if (entry === 'open') return `${indent}_gate[${key}] = true;`;
        if (entry === 'close') return `${indent}_gate[${key}] = false;`;
        if (entry === 'toggle') return `${indent}_gate[${key}] = !(_gate[${key}] ?? ${def});`;
        // enter: pass out `out` only while open.
        const out = emitChain(bp, follow(bp, n.id, 'out'), elements, me, other, dt, indent + '  ', seen);
        return `${indent}if (_gate[${key}] ?? ${def}) {\n${out}\n${indent}}`;
    }

    if (n.kind === 'action' && n.action) {
        // Any wired numeric params (score delta, setVar value, …) override the literal.
        let ov: Record<string, string> | undefined;
        for (const port of dataInputs(n)) {
            const expr = evalInput(bp, n.id, port);
            if (expr) (ov ||= {})[port] = expr;
        }
        const stmt = emitAction(n.action, me, other, dt, elements, ov);
        const rest = emitChain(bp, follow(bp, n.id, 'out'), elements, me, other, dt, indent, seen);
        const here = stmt ? indent + stmt : '';
        return here && rest ? `${here}\n${rest}` : here || rest;
    }
    if (n.kind === 'branch') {
        // A wired `cond` data input wins; otherwise fall back to the inline comparison.
        const wired = evalInput(bp, n.id, 'cond');
        const test = wired ?? (n.condition ? `(_vars[${q(n.condition.name)}] || 0) ${cmpOp(n.condition.compare)} ${num(n.condition.value)}` : 'false');
        const tBody = emitChain(bp, follow(bp, n.id, 'true'), elements, me, other, dt, indent + '  ', seen);
        const fBody = emitChain(bp, follow(bp, n.id, 'false'), elements, me, other, dt, indent + '  ', seen);
        let s = `${indent}if (${test}) {\n${tBody}\n${indent}}`;
        if (fBody) s += ` else {\n${fBody}\n${indent}}`;
        return s;
    }
    if (n.kind === 'forLoop') {
        // Repeat the `loop` chain N times (wired `times` wins over the inline count),
        // then continue out `done`. Loop var is node-scoped to avoid nesting collisions.
        const timesExpr = evalInput(bp, n.id, 'times') ?? num(Math.max(0, n.times ?? 3));
        // Loop var declared in the enclosing scope (so its `index` data output is
        // still readable in the `done` chain) and node-scoped to avoid collisions.
        const lv = loopVar(n.id);
        const body = emitChain(bp, follow(bp, n.id, 'loop'), elements, me, other, dt, indent + '  ', seen);
        const done = emitChain(bp, follow(bp, n.id, 'done'), elements, me, other, dt, indent, seen);
        let s = `${indent}let ${lv} = 0;\n${indent}for (; ${lv} < (${timesExpr}); ${lv}++) {\n${body}\n${indent}}`;
        if (done) s += `\n${done}`;
        return s;
    }
    if (n.kind === 'sequence') {
        // Run each ordered output chain in turn.
        const parts: string[] = [];
        for (let i = 0; i < seqCount(n); i++) {
            const body = emitChain(bp, follow(bp, n.id, `seq${i}`), elements, me, other, dt, indent, seen);
            if (body) parts.push(body);
        }
        return parts.join('\n');
    }
    if (n.kind === 'delay') {
        // Wait `seconds`, then run the continuation (drained in the tick via _after).
        const secs = num(Math.max(0, n.seconds ?? 1));
        const rest = emitChain(bp, follow(bp, n.id, 'out'), elements, me, other, '0.12', indent + '  ', seen);
        if (!rest) return '';
        return `${indent}_after(${secs}, () => {\n${rest}\n${indent}});`;
    }
    return '';
}

/**
 * Compile one owner's Blueprint into script fragments. `ownerTag` is '' for the
 * scene, or a sprite tag (then `me = S("tag")` and sprite-context events apply).
 */
export function compileBlueprintFragments(bp: Blueprint | null | undefined, elements: DrawingElement[], ownerTag = ''): BPFragments {
    const frag = emptyFragments();
    if (!bp || !bp.nodes.length) return frag;

    const isSprite = ownerTag !== '';
    const me = isSprite ? '_me' : 'null';
    const meDecl = isSprite ? `const _me = S(${q(ownerTag)}); ` : '';
    const chain = (first: { to: string; port: BPPin } | null, dt: string, other: string, indent: string) =>
        emitChain(bp, first, elements, me, other, dt, indent, new Set());

    for (const n of bp.nodes) {
        if (n.kind !== 'event' || !n.trigger) continue;
        const first = follow(bp, n.id, 'out');
        if (!first) continue; // event wired to nothing → nothing to run
        const t = n.trigger;
        const key = q(`bp|${ownerTag}|${n.id}`);

        switch (t.kind) {
            case 'start':
                frag.start.push(isSprite ? `{ ${meDecl}if (_me) {\n${chain(first, '0.016', 'null', '  ')}\n} }` : chain(first, '0.016', 'null', ''));
                break;
            case 'receive':
                frag.recv.push({ message: t.message, body: isSprite ? `  { ${meDecl}if (_me) {\n${chain(first, '0.12', 'null', '    ')}\n  } }` : chain(first, '0.12', 'null', '  ') });
                break;
            case 'keyPress':
                (frag.press[t.button] ||= []).push(isSprite ? `{ ${meDecl}if (_me) {\n${chain(first, '0.12', 'null', '  ')}\n} }` : chain(first, '0.12', 'null', ''));
                break;
            case 'keyHold':
                frag.tick.push(`  if (game.key(${q(t.button)})) { ${meDecl}${isSprite ? 'if (_me) ' : ''}{\n${chain(first, 'dt', 'null', '    ')}\n  } }`);
                break;
            case 'tap':
                // Scene tap = any pointer-down; sprite tap = pointer inside the sprite (plus a
                // TAP_GRAB_PAD grab margin so small sprites aren't near-impossible to hit).
                frag.tap.push(isSprite
                    ? `${meDecl}if (_me && px >= _me.x - ${TAP_GRAB_PAD} && px <= _me.x + _me.width + ${TAP_GRAB_PAD} && py >= _me.y - ${TAP_GRAB_PAD} && py <= _me.y + _me.height + ${TAP_GRAB_PAD}) {\n${chain(first, '0.12', 'null', '  ')}\n}`
                    : chain(first, '0.12', 'null', '  '));
                break;
            case 'tick':
                frag.tick.push(`  { ${meDecl}${isSprite ? 'if (_me) ' : ''}{\n${chain(first, 'dt', 'null', '    ')}\n  } }`);
                break;
            case 'leaveScreen':
                if (!isSprite) break; // needs a sprite to test
                frag.tick.push(`  { ${meDecl}if (_me && _off(_me)) {\n${chain(first, 'dt', 'null', '    ')}\n  } }`);
                break;
            case 'hit': {
                if (!isSprite) break;
                if (t.target === 'edge') {
                    const side = t.edge || 'any';
                    const test = side === 'left' ? '_me.x <= X'
                        : side === 'right' ? '_me.x + _me.width >= X + W'
                        : side === 'top' ? '_me.y <= Y'
                        : side === 'bottom' ? '_me.y + _me.height >= Y + H'
                        : '(_me.x <= X || _me.x + _me.width >= X + W || _me.y <= Y || _me.y + _me.height >= Y + H)';
                    frag.tick.push(`  { ${meDecl}const _k = ${key}; if (_me && ${test}) { if (!_hit.has(_k)) { _hit.add(_k);\n${chain(first, 'dt', 'null', '    ')}\n  } } else { _hit.delete(_k); } }`);
                } else {
                    frag.tick.push(`  { ${meDecl}const _other = S(${q(t.target)}); const _k = ${key}; if (_me && _other && game.hit(_me, _other)) { if (!_hit.has(_k)) { _hit.add(_k);\n${chain(first, 'dt', '_other', '    ')}\n  } } else { _hit.delete(_k); } }`);
                }
                break;
            }
            case 'touching': {
                if (!isSprite) break;
                frag.tick.push(`  { ${meDecl}const _other = S(${q(t.target)}); if (_me && _other && game.hit(_me, _other)) {\n${chain(first, 'dt', '_other', '    ')}\n  } }`);
                break;
            }
            case 'timer': {
                const secs = num(Math.max(0.05, t.seconds));
                frag.tick.push(`  { _tmr[${key}] = (_tmr[${key}] || 0) + dt; if (_tmr[${key}] >= ${secs}) { _tmr[${key}] = 0; ${meDecl}${isSprite ? 'if (_me) ' : ''}{\n${chain(first, 'dt', 'null', '    ')}\n  } } }`);
                break;
            }
            case 'varReaches': {
                frag.tick.push(`  { const _k = ${key}; const _cv = (_vars[${q(t.name)}] || 0); if (_cv ${cmpOp(t.compare)} ${num(t.value)}) { if (!_hit.has(_k)) { _hit.add(_k); ${meDecl}${isSprite ? 'if (_me) ' : ''}{\n${chain(first, 'dt', 'null', '    ')}\n  } } } else { _hit.delete(_k); } }`);
                break;
            }
        }
    }
    return frag;
}

/** Merge every owner's Blueprint (`'' → scene`, `tag → sprite`) into one set of fragments. */
export function compileAllBlueprints(blueprints: Record<string, Blueprint> | null | undefined, elements: DrawingElement[]): BPFragments {
    const all = emptyFragments();
    if (!blueprints) return all;
    for (const [owner, g] of Object.entries(blueprints)) {
        const f = compileBlueprintFragments(g, elements, owner);
        all.start.push(...f.start);
        all.recv.push(...f.recv);
        for (const [btn, arr] of Object.entries(f.press)) (all.press[btn] ||= []).push(...arr);
        all.tap.push(...f.tap);
        all.tick.push(...f.tick);
    }
    return all;
}

/** True if any owner's blueprint has a wired event (i.e. it would emit runnable code). */
export function blueprintsProduceCode(blueprints: Record<string, Blueprint> | null | undefined): boolean {
    if (!blueprints) return false;
    return Object.values(blueprints).some(bp => bp && bp.nodes.some(n => n.kind === 'event' && bp.edges.some(e => e.from === n.id && e.pin === 'out')));
}
