/**
 * Behaviors panel — the visual, no-code game builder (Flash-MX style).
 *
 * Select a sprite → give it WHEN→DO rules with big pickers; the Scene tab holds
 * on-start / score / win rules; the Code tab shows the generated `game.*`
 * script (read-only, the learning bridge). ▶ Play compiles + runs. Blocks are
 * the source of truth (stored on `element.behaviors` / `store.sceneBehaviors`);
 * `generateGameScript` compiles them for Play, Save, and export.
 */

import { type Component, For, Show, createMemo, createSignal, createEffect } from 'solid-js';
import { Gamepad2, X, Play, Plus, Trash2 } from 'lucide-solid';
import { store, updateElement, setSceneBehaviors, toggleBehaviorsPanel } from '../store/app-store';
import { draggablePanel } from '../utils/draggable-panel';
import { generateGameScript } from '../game/behaviors-to-script';
import { buildPongExample, buildCatchExample } from '../game/behavior-examples';
import { startGame } from '../game/game-runtime';
import { newBehaviorId, ANIM_PRESETS, type Behavior, type Trigger, type Action } from '../game/behavior-types';
import type { DrawingElement } from '../types';
import { showToast } from './toast';
import './behaviors-panel.css';

// ── Friendly option lists ──
const TRIGGERS: { v: Trigger['kind']; label: string }[] = [
    { v: 'start', label: 'When it starts' },
    { v: 'tick', label: 'Every moment' },
    { v: 'keyPress', label: 'When key pressed' },
    { v: 'keyHold', label: 'While key held' },
    { v: 'tap', label: 'When tapped' },
    { v: 'hit', label: 'When it hits…' },
    { v: 'leaveScreen', label: 'When it leaves the screen' },
];
const BUTTONS = [
    { v: 'left', label: '◀ Left' }, { v: 'right', label: '▶ Right' },
    { v: 'up', label: '▲ Up' }, { v: 'down', label: '▼ Down' },
    { v: 'a', label: 'A / Space' }, { v: 'b', label: 'B / Shift' },
] as const;
const SPEEDS = ['slow', 'medium', 'fast'] as const;
const DIR4 = ['left', 'right', 'up', 'down'] as const;
const DIR8 = ['up', 'down', 'left', 'right', 'upLeft', 'upRight', 'downLeft', 'downRight'] as const;
const EDGES = ['any', 'left', 'right', 'top', 'bottom'] as const;
const SPAWN_AT = [
    { v: 'randomTop', label: 'random top' }, { v: 'randomEdge', label: 'random spot' },
    { v: 'center', label: 'center' }, { v: 'here', label: 'here' },
] as const;

// Sprite actions (need a `this`); Scene actions are a safe subset.
const ACTIONS: { v: Action['kind']; label: string }[] = [
    { v: 'moveDir', label: 'move' }, { v: 'glide', label: 'glide (keep moving)' },
    { v: 'bounce', label: 'bounce' }, { v: 'rotate', label: 'rotate' },
    { v: 'color', label: 'change color' }, { v: 'scale', label: 'grow / shrink' },
    { v: 'show', label: 'show' }, { v: 'hide', label: 'hide' },
    { v: 'setText', label: 'set text' }, { v: 'moveTo', label: 'jump to' }, { v: 'spawn', label: 'spawn a copy' },
    { v: 'destroy', label: 'destroy' }, { v: 'score', label: 'change score' },
    { v: 'goToState', label: 'go to state' }, { v: 'playAnim', label: 'play effect' },
    { v: 'goToPage', label: 'go to page' }, { v: 'win', label: 'win!' }, { v: 'gameOver', label: 'game over' },
];
const SCENE_ACTION_KINDS = new Set<Action['kind']>(['score', 'spawn', 'goToState', 'goToPage', 'win', 'gameOver']);

const defaultTrigger = (kind: Trigger['kind']): Trigger => {
    switch (kind) {
        case 'keyPress': case 'keyHold': return { kind, button: 'left' } as Trigger;
        case 'hit': return { kind: 'hit', target: 'edge', edge: 'any' };
        default: return { kind } as Trigger;
    }
};
const defaultAction = (kind: Action['kind']): Action => {
    switch (kind) {
        case 'moveDir': return { kind, dir: 'right', speed: 'medium' };
        case 'glide': return { kind, dir: 'right', speed: 'medium' };
        case 'rotate': return { kind, deg: 10 };
        case 'color': return { kind, color: '#f59e0b' };
        case 'scale': return { kind, factor: 1.1 };
        case 'setText': return { kind, text: 'Hi' };
        case 'moveTo': return { kind, at: 'randomTop' };
        case 'spawn': return { kind, sprite: '', at: 'randomTop' };
        case 'destroy': return { kind, target: 'this' };
        case 'score': return { kind, delta: 1 };
        case 'goToState': return { kind, state: '' };
        case 'playAnim': return { kind, preset: 'bounce' };
        case 'goToPage': return { kind, index: 0 };
        case 'win': return { kind, message: 'YOU WIN!' };
        case 'gameOver': return { kind, message: 'GAME OVER' };
        default: return { kind } as Action;
    }
};

const BehaviorsPanel: Component = () => {
    const [tab, setTab] = createSignal<'sprite' | 'scene' | 'code'>('sprite');
    const [code, setCode] = createSignal('');

    const selectedEl = createMemo<DrawingElement | null>(() => {
        store.dirtyRevision;
        return store.selection.length === 1 ? store.elements.find(e => e.id === store.selection[0]) ?? null : null;
    });
    /** Every named sprite (for hit/destroy/spawn dropdowns). */
    const namedSprites = createMemo(() => { store.dirtyRevision; return store.elements.filter(e => !!e.tag).map(e => e.tag as string); });
    const stateNames = createMemo(() => store.states.map(s => s.name));

    // Keep the Code tab live.
    createEffect(() => {
        if (tab() === 'code') { store.dirtyRevision; setCode(generateGameScript(store.elements, store.sceneBehaviors ?? [])); }
    });

    // ── read/write helpers ──
    const spriteBehaviors = () => selectedEl()?.behaviors ?? [];
    const sceneBehaviors = () => store.sceneBehaviors ?? [];

    const writeSprite = (next: Behavior[]) => { const el = selectedEl(); if (el) updateElement(el.id, { behaviors: next } as any, true); };
    const writeScene = (next: Behavior[]) => setSceneBehaviors(next);
    const isScene = () => tab() === 'scene';
    const list = () => (isScene() ? sceneBehaviors() : spriteBehaviors());
    const write = (next: Behavior[]) => (isScene() ? writeScene(next) : writeSprite(next));

    const ensureName = () => {
        if (isScene()) return;
        const el = selectedEl();
        if (el && !el.tag) {
            const n = `Sprite${store.elements.filter(e => e.tag?.startsWith('Sprite')).length + 1}`;
            updateElement(el.id, { tag: n } as any, true);
        }
    };

    const addBehavior = () => {
        ensureName();
        const b: Behavior = { id: newBehaviorId(), trigger: isScene() ? { kind: 'start' } : { kind: 'tick' }, actions: [] };
        write([...list(), b]);
    };
    const updateBehavior = (i: number, patch: Partial<Behavior>) => write(list().map((b, j) => (j === i ? { ...b, ...patch } : b)));
    const removeBehavior = (i: number) => write(list().filter((_, j) => j !== i));
    const setTrigger = (i: number, kind: Trigger['kind']) => updateBehavior(i, { trigger: defaultTrigger(kind) });
    const patchTrigger = (i: number, patch: any) => updateBehavior(i, { trigger: { ...list()[i].trigger, ...patch } as Trigger });
    const addAction = (i: number) => updateBehavior(i, { actions: [...list()[i].actions, defaultAction(isScene() ? 'score' : 'moveDir')] });
    const setAction = (i: number, k: number, kind: Action['kind']) => updateBehavior(i, { actions: list()[i].actions.map((a, j) => (j === k ? defaultAction(kind) : a)) });
    const patchAction = (i: number, k: number, patch: any) => updateBehavior(i, { actions: list()[i].actions.map((a, j) => (j === k ? { ...a, ...patch } : a)) });
    const removeAction = (i: number, k: number) => updateBehavior(i, { actions: list()[i].actions.filter((_, j) => j !== k) });

    const play = () => {
        const script = generateGameScript(store.elements, store.sceneBehaviors ?? []);
        if (!script) { showToast('Add some behaviors first', 'info'); return; }
        if (startGame(script)) showToast('Playing — Esc or Stop to end', 'info');
    };

    const availableActions = () => (isScene() ? ACTIONS.filter(a => SCENE_ACTION_KINDS.has(a.v)) : ACTIONS);

    // ── param editors ──
    const TriggerParams: Component<{ b: Behavior; i: number }> = (p) => {
        const t = () => p.b.trigger;
        return (
            <>
                <Show when={t().kind === 'keyPress' || t().kind === 'keyHold'}>
                    <select class="bp-sel" value={(t() as any).button} onChange={e => patchTrigger(p.i, { button: e.currentTarget.value })}>
                        <For each={BUTTONS}>{b => <option value={b.v}>{b.label}</option>}</For>
                    </select>
                </Show>
                <Show when={t().kind === 'hit'}>
                    <select class="bp-sel" value={(t() as any).target}
                        onChange={e => patchTrigger(p.i, e.currentTarget.value === 'edge' ? { target: 'edge', edge: 'any' } : { target: e.currentTarget.value, edge: undefined })}>
                        <option value="edge">a wall</option>
                        <For each={namedSprites()}>{n => <option value={n}>{n}</option>}</For>
                    </select>
                    <Show when={(t() as any).target === 'edge'}>
                        <select class="bp-sel" value={(t() as any).edge} onChange={e => patchTrigger(p.i, { edge: e.currentTarget.value })}>
                            <For each={EDGES}>{ed => <option value={ed}>{ed}</option>}</For>
                        </select>
                    </Show>
                </Show>
            </>
        );
    };

    const ActionParams: Component<{ a: Action; i: number; k: number }> = (p) => {
        const a = () => p.a as any;
        const set = (patch: any) => patchAction(p.i, p.k, patch);
        return (
            <Show when={a().kind !== 'bounce' && a().kind !== 'show' && a().kind !== 'hide'}>
                <Show when={a().kind === 'moveDir'}>
                    <select class="bp-sel" value={a().dir} onChange={e => set({ dir: e.currentTarget.value })}><For each={DIR4}>{d => <option>{d}</option>}</For></select>
                    <select class="bp-sel" value={a().speed} onChange={e => set({ speed: e.currentTarget.value })}><For each={SPEEDS}>{s => <option>{s}</option>}</For></select>
                </Show>
                <Show when={a().kind === 'glide'}>
                    <select class="bp-sel" value={a().dir} onChange={e => set({ dir: e.currentTarget.value })}><For each={DIR8}>{d => <option>{d}</option>}</For></select>
                    <select class="bp-sel" value={a().speed} onChange={e => set({ speed: e.currentTarget.value })}><For each={SPEEDS}>{s => <option>{s}</option>}</For></select>
                </Show>
                <Show when={a().kind === 'rotate'}><input class="bp-num" type="number" value={a().deg} onInput={e => set({ deg: Number(e.currentTarget.value) })} /><span class="bp-unit">°</span></Show>
                <Show when={a().kind === 'color'}><input class="bp-color" type="color" value={a().color} onInput={e => set({ color: e.currentTarget.value })} /></Show>
                <Show when={a().kind === 'scale'}><input class="bp-num" type="number" step="0.1" value={a().factor} onInput={e => set({ factor: Number(e.currentTarget.value) })} />×</Show>
                <Show when={a().kind === 'setText'}><input class="bp-text" type="text" value={a().text} onInput={e => set({ text: e.currentTarget.value })} /></Show>
                <Show when={a().kind === 'moveTo'}>
                    <select class="bp-sel" value={a().at} onChange={e => set({ at: e.currentTarget.value })}><For each={SPAWN_AT}>{s => <option value={s.v}>{s.label}</option>}</For></select>
                </Show>
                <Show when={a().kind === 'spawn'}>
                    <select class="bp-sel" value={a().sprite} onChange={e => set({ sprite: e.currentTarget.value })}><option value="">(pick sprite)</option><For each={namedSprites()}>{n => <option value={n}>{n}</option>}</For></select>
                    <select class="bp-sel" value={a().at} onChange={e => set({ at: e.currentTarget.value })}><For each={SPAWN_AT}>{s => <option value={s.v}>{s.label}</option>}</For></select>
                </Show>
                <Show when={a().kind === 'destroy'}>
                    <select class="bp-sel" value={a().target} onChange={e => set({ target: e.currentTarget.value })}><option value="this">this</option><For each={namedSprites()}>{n => <option value={n}>{n}</option>}</For></select>
                </Show>
                <Show when={a().kind === 'score'}><input class="bp-num" type="number" value={a().delta} onInput={e => set({ delta: Number(e.currentTarget.value) })} /></Show>
                <Show when={a().kind === 'goToState'}>
                    <select class="bp-sel" value={a().state} onChange={e => set({ state: e.currentTarget.value })}><option value="">(pick state)</option><For each={stateNames()}>{n => <option value={n}>{n}</option>}</For></select>
                </Show>
                <Show when={a().kind === 'playAnim'}>
                    <select class="bp-sel" value={a().preset} onChange={e => set({ preset: e.currentTarget.value })}><For each={ANIM_PRESETS}>{pr => <option>{pr}</option>}</For></select>
                </Show>
                <Show when={a().kind === 'goToPage'}><input class="bp-num" type="number" value={a().index} onInput={e => set({ index: Number(e.currentTarget.value) })} /></Show>
                <Show when={a().kind === 'win' || a().kind === 'gameOver'}><input class="bp-text" type="text" value={a().message} onInput={e => set({ message: e.currentTarget.value })} /></Show>
            </Show>
        );
    };

    const RuleList: Component = () => (
        <div class="bp-rules">
            <For each={list()} fallback={<div class="bp-empty">No rules yet. Tap “＋ Add behavior”.</div>}>
                {(b, i) => (
                    <div class="bp-rule">
                        <div class="bp-when">
                            <span class="bp-kw">WHEN</span>
                            <select class="bp-sel" value={b.trigger.kind} onChange={e => setTrigger(i(), e.currentTarget.value as Trigger['kind'])}>
                                <For each={isScene() ? TRIGGERS.filter(t => t.v === 'start' || t.v === 'tick') : TRIGGERS}>{t => <option value={t.v}>{t.label}</option>}</For>
                            </select>
                            <TriggerParams b={b} i={i()} />
                            <button class="bp-del" title="Delete rule" onClick={() => removeBehavior(i())}><Trash2 size={13} /></button>
                        </div>
                        <For each={b.actions}>
                            {(a, k) => (
                                <div class="bp-do">
                                    <span class="bp-kw bp-do-kw">DO</span>
                                    <select class="bp-sel" value={a.kind} onChange={e => setAction(i(), k(), e.currentTarget.value as Action['kind'])}>
                                        <For each={availableActions()}>{ac => <option value={ac.v}>{ac.label}</option>}</For>
                                    </select>
                                    <ActionParams a={a} i={i()} k={k()} />
                                    <button class="bp-del" title="Remove action" onClick={() => removeAction(i(), k())}><X size={13} /></button>
                                </div>
                            )}
                        </For>
                        <button class="bp-add-do" onClick={() => addAction(i())}><Plus size={12} /> add action</button>
                    </div>
                )}
            </For>
            <button class="bp-add" onClick={addBehavior}><Plus size={15} /> Add behavior</button>
        </div>
    );

    return (
        <Show when={store.showBehaviorsPanel}>
            <div class="behaviors-panel" ref={draggablePanel('.behaviors-panel-header')}>
                <div class="behaviors-panel-header">
                    <div class="bp-title"><Gamepad2 size={15} /><h3>Game Builder</h3></div>
                    <div class="bp-head-actions">
                        <button class="bp-play" title="Play the game" onClick={play}><Play size={14} /> Play</button>
                        <button class="bp-icon-btn" title="Close" onClick={() => toggleBehaviorsPanel(false)}><X size={15} /></button>
                    </div>
                </div>

                <div class="bp-tabs">
                    <button class={`bp-tab ${tab() === 'sprite' ? 'active' : ''}`} onClick={() => setTab('sprite')}>Sprite</button>
                    <button class={`bp-tab ${tab() === 'scene' ? 'active' : ''}`} onClick={() => setTab('scene')}>Scene</button>
                    <button class={`bp-tab ${tab() === 'code' ? 'active' : ''}`} onClick={() => setTab('code')}>Code</button>
                </div>

                <div class="behaviors-panel-body">
                    <Show when={tab() === 'sprite'}>
                        <Show when={selectedEl()} fallback={
                            <Show when={store.elements.some(e => e.behaviors?.length) || (store.sceneBehaviors?.length ?? 0)}
                                fallback={
                                    <div class="bp-starter">
                                        <div class="bp-empty">New to this? Start from an example, then tweak the blocks.</div>
                                        <button class="bp-add" onClick={() => { buildPongExample(); showToast('Pong loaded — press Play!', 'success'); }}>
                                            <Play size={14} /> Load example: Pong
                                        </button>
                                        <button class="bp-add" onClick={() => { buildCatchExample(); showToast('Catch loaded — press Play!', 'success'); }}>
                                            <Play size={14} /> Load example: Catch the Star
                                        </button>
                                    </div>
                                }>
                                <div class="bp-empty">Select one sprite on the canvas to give it behaviors.</div>
                            </Show>
                        }>
                            <div class="bp-name-row">
                                <label>Name</label>
                                <input class="bp-name" type="text" placeholder="e.g. Ball"
                                    value={selectedEl()!.tag ?? ''}
                                    onInput={e => { const el = selectedEl(); if (el) updateElement(el.id, { tag: e.currentTarget.value || null } as any, false); }} />
                            </div>
                            <RuleList />
                        </Show>
                    </Show>
                    <Show when={tab() === 'scene'}>
                        <div class="bp-hint">Scene rules run for the whole game (set the score, spawn things, decide win/lose).</div>
                        <RuleList />
                    </Show>
                    <Show when={tab() === 'code'}>
                        <div class="bp-hint">This is the game.* code your blocks make (read-only — a peek under the hood).</div>
                        <pre class="bp-code">{code() || '// Add behaviors to see the generated code.'}</pre>
                    </Show>
                </div>
            </div>
        </Show>
    );
};

export default BehaviorsPanel;
