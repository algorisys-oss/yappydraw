/**
 * Visual builder → `game.*` script compiler.
 *
 * Blocks are the source of truth; this pure function turns a document's
 * per-sprite behaviors + scene behaviors into a readable `game.*` script that
 * the existing runtime (and exported player) run unchanged. The output doubles
 * as the "See the code" learning view, so it's formatted to be readable.
 */

import type { DrawingElement } from '../types';
import type { Behavior, Action, Trigger, Dir4, Dir8, Speed } from './behavior-types';
import { SPEED_PX, DIR4_VEC, DIR8_VEC } from './behavior-types';

/** JS string literal (safe quoting). */
const q = (s: string): string => JSON.stringify(s ?? '');
const num = (n: number): string => (Number.isFinite(n) ? String(n) : '0');

interface SpriteWithBehaviors { tag: string; el: DrawingElement }

/** Sprites that carry behaviors and have a stable name (tag). */
function taggedSprites(elements: DrawingElement[]): SpriteWithBehaviors[] {
    return elements
        .filter(e => (e.behaviors?.length ?? 0) > 0 && !!e.tag)
        .map(e => ({ tag: e.tag as string, el: e }));
}

const velFor = (dir: Dir4 | Dir8, speed: Speed, table: Record<string, { x: number; y: number }>) => {
    const v = table[dir] || { x: 0, y: 0 };
    const s = SPEED_PX[speed];
    return { vx: v.x * s, vy: v.y * s };
};

/** One action → a JS statement. `me` and `other` are sprite-handle expressions;
 *  `dt` is the delta-time expression (real dt inside tick, a small step elsewhere). */
function emitAction(a: Action, me: string, other: string, dt: string, elements: DrawingElement[]): string {
    switch (a.kind) {
        case 'moveDir': {
            const v = velFor(a.dir, a.speed, DIR4_VEC);
            return `${me}.moveBy(${num(v.vx)} * ${dt}, ${num(v.vy)} * ${dt});`;
        }
        case 'glide': {
            const v = velFor(a.dir, a.speed, DIR8_VEC);
            return `_setV(${me}, ${num(v.vx)}, ${num(v.vy)});`;
        }
        case 'bounce':
            return `_bounce(${me}, ${other});`;
        case 'gravity':
            return a.on
                ? `{ _grav.add(${me}.id); const _v = _V(${me}); _setV(${me}, _v.vx, _v.vy); }`
                : `_grav.delete(${me}.id);`;
        case 'jump':
            return `{ const _v = _V(${me}); _setV(${me}, _v.vx, -JUMP[${q(a.strength)}]); }`;
        case 'land':
            return `_land(${me}, ${other});`;
        case 'rotate':
            return `${me}.rotateBy(${num(a.deg)});`;
        case 'color':
            return `${me}.color(${q(a.color)});`;
        case 'scale':
            return `${me}.set({ width: ${me}.width * ${num(a.factor)}, height: ${me}.height * ${num(a.factor)} });`;
        case 'show':
            return `${me}.show();`;
        case 'hide':
            return `${me}.hide();`;
        case 'setText':
            return `${me}.setText(${q(a.text)});`;
        case 'moveTo': {
            const pos = a.at === 'randomTop' ? `{ x: X + Math.random() * (W - ${me}.width), y: Y }`
                : a.at === 'randomEdge' ? `{ x: X + Math.random() * (W - ${me}.width), y: Y + Math.random() * (H - ${me}.height) }`
                : a.at === 'center' ? `{ x: X + (W - ${me}.width) / 2, y: Y + (H - ${me}.height) / 2 }`
                : `{ x: ${me}.x, y: ${me}.y }`;
            return `{ const _p = ${pos}; ${me}.moveTo(_p.x, _p.y); }`;
        }
        case 'spawn': {
            const tmpl = elements.find(e => e.tag === a.sprite);
            const type = q(tmpl?.type || 'circle');
            const w = num(tmpl?.width || 40), h = num(tmpl?.height || 40);
            const color = q((tmpl?.backgroundColor && tmpl.backgroundColor !== 'transparent') ? tmpl.backgroundColor : '#f59e0b');
            const at = a.at === 'randomTop' ? `{ x: X + Math.random() * (W - ${w}), y: Y - ${h} }`
                : a.at === 'randomEdge' ? `{ x: X + Math.random() * (W - ${w}), y: Y + Math.random() * (H - ${h}) }`
                : a.at === 'center' ? `{ x: X + (W - ${w}) / 2, y: Y + (H - ${h}) / 2 }`
                : `{ x: ${me} ? ${me}.x : X, y: ${me} ? ${me}.y : Y }`;
            return `{ const _p = ${at}; game.spawn(${type}, _p.x, _p.y, ${w}, ${h}, { backgroundColor: ${color} }); }`;
        }
        case 'destroy':
            return a.target === 'this' ? `${me}.destroy();` : `{ const _t = S(${q(a.target)}); if (_t) _t.destroy(); }`;
        case 'score':
            return `game.score(${num(a.delta)});`;
        case 'setVar':
            return `_setVar(${q(a.name)}, ${num(a.value)});`;
        case 'changeVar':
            return `_setVar(${q(a.name)}, (_vars[${q(a.name)}] || 0) + ${num(a.delta)});`;
        case 'showVar':
            return `_showVar(${q(a.name)});`;
        case 'goToState':
            return `game.goToState(${q(a.state)});`;
        case 'playAnim':
            return `game.playAnim(${me}, ${q(a.preset)});`;
        case 'playSound':
            return `game.sound(${q(a.sound)});`;
        case 'music':
            return `game.music(${a.on ? 'true' : 'false'});`;
        case 'goToPage':
            return `game.goToPage(${num(a.index)});`;
        case 'broadcast':
            return `_emit(${q(a.message)});`;
        case 'win':
            return `game.end(${q(a.message || 'YOU WIN!')});`;
        case 'gameOver':
            return `game.end(${q(a.message || 'GAME OVER')});`;
        default:
            return '';
    }
}

/** All actions of a behavior as an indented block, guarded on the owner being alive. */
function actionsBlock(actions: Action[], me: string, other: string, dt: string, elements: DrawingElement[], indent: string): string {
    const stmts = actions.map(a => emitAction(a, me, other, dt, elements)).filter(Boolean);
    return stmts.map(s => indent + s).join('\n');
}

/** A behavior's actions, wrapped in its optional "only if [variable]" condition. */
function guarded(b: Behavior, me: string, other: string, dt: string, elements: DrawingElement[], indent: string): string {
    if (!b.condition) return actionsBlock(b.actions, me, other, dt, elements, indent);
    const c = b.condition;
    const cmp = c.compare === 'atMost' ? '<=' : c.compare === 'equals' ? '===' : '>=';
    const body = actionsBlock(b.actions, me, other, dt, elements, indent + '  ');
    return `${indent}if ((_vars[${q(c.name)}] || 0) ${cmp} ${num(c.value)}) {\n${body}\n${indent}}`;
}

/** Tick-body for a "when variable reaches" trigger (enter-detected via _hit). */
function emitVarReaches(t: Extract<Trigger, { kind: 'varReaches' }>, b: Behavior, me: string, keyBase: string, elements: DrawingElement[]): string {
    const cmp = t.compare === 'atMost' ? '<=' : t.compare === 'equals' ? '===' : '>=';
    const key = q(keyBase);
    return `  { const _me = ${me}; const _k = ${key}; const _cv = (_vars[${q(t.name)}] || 0);\n` +
        `    if (_cv ${cmp} ${num(t.value)}) { if (!_hit.has(_k)) { _hit.add(_k);\n${guarded(b, '_me', 'null', 'dt', elements, '      ')}\n    } } else { _hit.delete(_k); } }`;
}

/** Tick-body for a repeating "every N seconds" timer trigger. */
function emitTimer(t: Extract<Trigger, { kind: 'timer' }>, b: Behavior, me: string, elements: DrawingElement[]): string {
    const id = q(b.id);
    const secs = num(Math.max(0.05, t.seconds));
    return `  { _tmr[${id}] = (_tmr[${id}] || 0) + dt; if (_tmr[${id}] >= ${secs}) { _tmr[${id}] = 0; const _me = ${me};\n${guarded(b, '_me', 'null', 'dt', elements, '    ')}\n  } }`;
}

/** Does this behavior list reference a sprite target for `hit`? Collect targets. */
function hitTargets(t: Trigger): { isEdge: boolean; edge?: string; tag?: string } | null {
    if (t.kind !== 'hit') return null;
    if (t.target === 'edge') return { isEdge: true, edge: t.edge || 'any' };
    return { isEdge: false, tag: t.target };
}

/**
 * The script to persist/run: generated from blocks when any exist, else the
 * hand-written fallback (advanced code path). Keeps the saved `gameScript` in
 * sync with the blocks so the exported HTML player runs the block-built game.
 */
export function effectiveGameScript(elements: DrawingElement[], sceneBehaviors: Behavior[] = [], fallback?: string, gameVars: GameVar[] = []): string | undefined {
    const gen = generateGameScript(elements, sceneBehaviors, gameVars);
    return gen || fallback || undefined;
}

export interface GameVar { name: string; initial: number }

/**
 * Compile blocks to a game script. Returns '' if there are no behaviors.
 */
export function generateGameScript(elements: DrawingElement[], sceneBehaviors: Behavior[] = [], gameVars: GameVar[] = []): string {
    const sprites = taggedSprites(elements);
    if (sprites.length === 0 && sceneBehaviors.length === 0) return '';

    const L: string[] = [];
    L.push('// Generated by the Yappy Game Builder — edit the blocks, not this code.');
    L.push('const W = game.width, H = game.height, X = game.x, Y = game.y;');
    L.push('');
    // Preamble helpers (readable — they teach the concepts).
    L.push('const _vel = new Map();                 // per-sprite velocity (px/sec)');
    L.push('const _hit = new Set();                 // pairs currently touching (enter detection)');
    L.push('const S = (name) => game.find(name);    // look up a sprite by its name');
    L.push('const _V = (sp) => (sp && _vel.get(sp.id)) || { vx: 0, vy: 0 };');
    L.push('const _setV = (sp, vx, vy) => { if (sp) _vel.set(sp.id, { vx, vy }); };');
    L.push('const _off = (sp) => sp && sp.alive && (sp.x + sp.width < X || sp.x > X + W || sp.y + sp.height < Y || sp.y > Y + H);');
    L.push('function _bounce(sp, other) {');
    L.push('  if (!sp || !sp.alive) return;');
    L.push('  const v = _V(sp); let vx = v.vx, vy = v.vy;');
    L.push('  if (other && other.alive) {           // reflect off another sprite: flip the shallow axis');
    L.push('    const ox = Math.min(sp.x + sp.width, other.x + other.width) - Math.max(sp.x, other.x);');
    L.push('    const oy = Math.min(sp.y + sp.height, other.y + other.height) - Math.max(sp.y, other.y);');
    L.push('    if (ox < oy) vx = -vx; else vy = -vy;');
    L.push('  } else {                              // reflect off the walls');
    L.push('    if (sp.x <= X && vx < 0) vx = -vx;');
    L.push('    if (sp.x + sp.width >= X + W && vx > 0) vx = -vx;');
    L.push('    if (sp.y <= Y && vy < 0) vy = -vy;');
    L.push('    if (sp.y + sp.height >= Y + H && vy > 0) vy = -vy;');
    L.push('  }');
    L.push('  _setV(sp, vx, vy);');
    L.push('}');
    L.push('const _vars = {};                       // named numbers (lives, health, …)');
    L.push('const _vh = {};                         // on-screen labels for shown variables');
    L.push('function _showVar(name) {');
    L.push('  const label = name + ": " + (_vars[name] || 0);');
    L.push('  if (_vh[name] && _vh[name].alive) { _vh[name].setText(label); }');
    L.push('  else { const i = Object.keys(_vh).length; _vh[name] = game.spawnText(label, X + 20, Y + 20 + i * 42, 28, { textColor: "#111827", textAlign: "left" }); }');
    L.push('}');
    L.push('function _setVar(name, v) { _vars[name] = v; if (_vh[name]) _showVar(name); }');
    L.push('const _tmr = {};                        // per-timer accumulators');
    L.push('const _msg = {};                         // message bus: name -> handlers');
    L.push('const _on = (m, fn) => { (_msg[m] || (_msg[m] = [])).push(fn); };');
    L.push('const _emit = (m) => { (_msg[m] || []).forEach(fn => { try { fn(); } catch (e) {} }); };');
    L.push('const _grav = new Set();                // sprites affected by gravity');
    L.push('const GRAV = 1500;                      // gravity strength (px/sec/sec)');
    L.push('const JUMP = { slow: 560, medium: 780, fast: 1000 };');
    L.push('function _land(sp, other) {             // rest on top of a platform');
    L.push('  if (!sp || !other || !sp.alive || !other.alive) return;');
    L.push('  const v = _V(sp);');
    L.push('  if (v.vy >= 0 && sp.y + sp.height > other.y && sp.y + sp.height < other.y + other.height + 24) {');
    L.push('    sp.moveTo(sp.x, other.y - sp.height); _setV(sp, v.vx, 0);');
    L.push('  }');
    L.push('}');
    L.push('');

    // ── Setup: scene start, then per-sprite start ──
    const startLines: string[] = [];
    for (const b of sceneBehaviors) {
        if (b.trigger.kind === 'start') startLines.push(guarded(b, 'null', 'null', '0.016', elements, ''));
    }
    for (const s of sprites) {
        const me = `S(${q(s.tag)})`;
        for (const b of (s.el.behaviors || [])) {
            if (b.trigger.kind === 'start') {
                startLines.push(`{ const _me = ${me}; if (_me) {\n${guarded(b, '_me', 'null', '0.016', elements, '  ')}\n} }`);
            }
        }
    }
    // ── declared variables: initialise before anything runs ──
    if (gameVars.length) {
        L.push('// —— variables ——');
        for (const v of gameVars) if (v.name) L.push(`_setVar(${q(v.name)}, ${num(v.initial || 0)});`);
        L.push('');
    }

    // ── receive → message handlers (registered BEFORE start, so a broadcast on
    //    start reaches its listeners) ──
    const recvLines: string[] = [];
    for (const s of sprites) {
        const me = `S(${q(s.tag)})`;
        for (const b of (s.el.behaviors || [])) {
            if (b.trigger.kind === 'receive') {
                recvLines.push(`_on(${q(b.trigger.message)}, () => { const _me = ${me}; if (_me) {\n${guarded(b, '_me', 'null', '0.12', elements, '  ')}\n} });`);
            }
        }
    }
    for (const b of sceneBehaviors) {
        if (b.trigger.kind === 'receive') {
            recvLines.push(`_on(${q(b.trigger.message)}, () => {\n${guarded(b, 'null', 'null', '0.12', elements, '  ')}\n});`);
        }
    }
    if (recvLines.length) { L.push('// —— messages ——'); L.push(...recvLines); L.push(''); }

    if (startLines.length) { L.push('// —— on start ——'); L.push(...startLines); L.push(''); }

    // ── keyPress → onKey handlers grouped by button ──
    const pressByBtn: Record<string, string[]> = {};
    for (const s of sprites) {
        const me = `S(${q(s.tag)})`;
        for (const b of (s.el.behaviors || [])) {
            if (b.trigger.kind === 'keyPress') {
                (pressByBtn[b.trigger.button] ||= []).push(`{ const _me = ${me}; if (_me) {\n${guarded(b, '_me', 'null', '0.12', elements, '  ')}\n} }`);
            }
        }
    }
    for (const b of sceneBehaviors) {
        if (b.trigger.kind === 'keyPress') {
            (pressByBtn[b.trigger.button] ||= []).push(guarded(b, 'null', 'null', '0.12', elements, ''));
        }
    }
    for (const [btn, blocks] of Object.entries(pressByBtn)) {
        L.push(`game.onKey(${q(btn)}, () => {`);
        L.push(blocks.map(x => '  ' + x.split('\n').join('\n  ')).join('\n'));
        L.push('});');
    }
    if (Object.keys(pressByBtn).length) L.push('');

    // ── tap → onPointerDown ──
    const tapBlocks: string[] = [];
    for (const s of sprites) {
        const me = `S(${q(s.tag)})`;
        for (const b of (s.el.behaviors || [])) {
            if (b.trigger.kind === 'tap') {
                tapBlocks.push(`{ const _me = ${me}; if (_me && px >= _me.x && px <= _me.x + _me.width && py >= _me.y && py <= _me.y + _me.height) {\n${guarded(b, '_me', 'null', '0.12', elements, '  ')}\n} }`);
            }
        }
    }
    if (tapBlocks.length) {
        L.push('game.onPointerDown((px, py) => {');
        L.push(tapBlocks.map(x => '  ' + x.split('\n').join('\n  ')).join('\n'));
        L.push('});');
        L.push('');
    }

    // ── onTick: integrate velocity, keyHold, hit, leaveScreen, tick ──
    L.push('game.onTick((dt, t) => {');
    L.push('  for (const [id, v] of _vel) { if (_grav.has(id)) v.vy += GRAV * dt; const sp = game.find(id); if (sp && sp.alive) sp.moveBy(v.vx * dt, v.vy * dt); }');

    for (const s of sprites) {
        const me = `S(${q(s.tag)})`;
        for (const b of (s.el.behaviors || [])) {
            const t = b.trigger;
            if (t.kind === 'keyHold') {
                L.push(`  if (game.key(${q(t.button)})) { const _me = ${me}; if (_me) {\n${guarded(b, '_me', 'null', 'dt', elements, '    ')}\n  } }`);
            } else if (t.kind === 'tick') {
                L.push(`  { const _me = ${me}; if (_me) {\n${guarded(b, '_me', 'null', 'dt', elements, '    ')}\n  } }`);
            } else if (t.kind === 'leaveScreen') {
                L.push(`  { const _me = ${me}; if (_me && _off(_me)) {\n${guarded(b, '_me', 'null', 'dt', elements, '    ')}\n  } }`);
            } else if (t.kind === 'hit') {
                const info = hitTargets(t)!;
                const key = q(`${s.tag}|${t.target}|${b.id}`);
                if (info.isEdge) {
                    const side = info.edge;
                    const test = side === 'left' ? '_me.x <= X'
                        : side === 'right' ? '_me.x + _me.width >= X + W'
                        : side === 'top' ? '_me.y <= Y'
                        : side === 'bottom' ? '_me.y + _me.height >= Y + H'
                        : '(_me.x <= X || _me.x + _me.width >= X + W || _me.y <= Y || _me.y + _me.height >= Y + H)';
                    L.push(`  { const _me = ${me}; const _k = ${key};`);
                    L.push(`    if (_me && ${test}) { if (!_hit.has(_k)) { _hit.add(_k);\n${guarded(b, '_me', 'null', 'dt', elements, '      ')}\n    } } else { _hit.delete(_k); } }`);
                } else {
                    L.push(`  { const _me = ${me}; const _other = S(${q(info.tag as string)}); const _k = ${key};`);
                    L.push(`    if (_me && _other && game.hit(_me, _other)) { if (!_hit.has(_k)) { _hit.add(_k);\n${guarded(b, '_me', '_other', 'dt', elements, '      ')}\n    } } else { _hit.delete(_k); } }`);
                }
            } else if (t.kind === 'touching') {
                L.push(`  { const _me = ${me}; const _other = S(${q(t.target)}); if (_me && _other && game.hit(_me, _other)) {\n${guarded(b, '_me', '_other', 'dt', elements, '    ')}\n  } }`);
            } else if (t.kind === 'varReaches') {
                L.push(emitVarReaches(t, b, me, `${s.tag}|${b.id}`, elements));
            } else if (t.kind === 'timer') {
                L.push(emitTimer(t, b, me, elements));
            }
        }
    }
    for (const b of sceneBehaviors) {
        if (b.trigger.kind === 'tick') {
            L.push(`  {\n${guarded(b, 'null', 'null', 'dt', elements, '    ')}\n  }`);
        } else if (b.trigger.kind === 'varReaches') {
            L.push(emitVarReaches(b.trigger, b, 'null', `scene|${b.id}`, elements));
        } else if (b.trigger.kind === 'timer') {
            L.push(emitTimer(b.trigger, b, 'null', elements));
        }
    }
    L.push('});');

    return L.join('\n');
}
