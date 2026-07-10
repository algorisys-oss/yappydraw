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
import { X, Play, Plus, Trash2, ChevronUp, ChevronDown, Copy, ClipboardPaste } from 'lucide-solid';
import { store, updateElement, setSceneBehaviors, setGameVars } from '../store/app-store';
import { GameViewSwitcher } from './game-view-switcher';
import { effectiveGameScript } from '../game/behaviors-to-script';
import { buildPongExample, buildCatchExample, buildPlatformerExample } from '../game/behavior-examples';
import { startGame } from '../game/game-runtime';
import { newBehaviorId, type Behavior, type Trigger, type Action } from '../game/behavior-types';
import { TRIGGERS, COMPARE, ACTIONS, SCENE_ACTION_KINDS, defaultTrigger, defaultAction } from '../game/behavior-ui';
import { TriggerParams, ActionParams } from '../game/behavior-editors';
import type { DrawingElement } from '../types';
import { showToast } from './toast';
import './behaviors-panel.css';

const BehaviorsPanel: Component = () => {
    const [tab, setTab] = createSignal<'sprite' | 'scene' | 'vars' | 'code'>('sprite');
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
        if (tab() === 'code') { store.dirtyRevision; setCode(effectiveGameScript(store.elements, store.sceneBehaviors ?? [], store.gameScript, store.gameVars ?? [], store.blueprints, store.gameAuthoringMode) || ''); }
    });

    // ── read/write helpers ──
    const spriteBehaviors = () => selectedEl()?.behaviors ?? [];
    const sceneBehaviors = () => store.sceneBehaviors ?? [];

    const writeSprite = (next: Behavior[]) => { const el = selectedEl(); if (el) updateElement(el.id, { behaviors: next } as any, true); };
    const writeScene = (next: Behavior[]) => setSceneBehaviors(next);
    const isScene = () => tab() === 'scene';
    const list = () => (isScene() ? sceneBehaviors() : spriteBehaviors());
    const write = (next: Behavior[]) => (isScene() ? writeScene(next) : writeSprite(next));

    // ── variables registry ──
    const gameVars = () => store.gameVars ?? [];
    /** All variable names referenced anywhere in the game's rules. */
    const referencedVars = createMemo<string[]>(() => {
        store.dirtyRevision;
        const names = new Set<string>();
        const scan = (bs: Behavior[] = []) => {
            for (const b of bs) {
                if (b.condition?.name) names.add(b.condition.name);
                if (b.trigger.kind === 'varReaches') names.add((b.trigger as any).name);
                for (const a of b.actions) {
                    if (a.kind === 'setVar' || a.kind === 'changeVar' || a.kind === 'showVar') names.add((a as any).name);
                }
            }
        };
        store.elements.forEach(e => scan(e.behaviors));
        scan(store.sceneBehaviors ?? []);
        return [...names].filter(Boolean);
    });
    const undefinedVars = () => referencedVars().filter(n => !gameVars().some(v => v.name === n));

    const addVar = (name = 'newVar', initial = 0) => {
        if (gameVars().some(v => v.name === name)) return;
        setGameVars([...gameVars(), { name, initial }]);
    };
    const removeVar = (name: string) => setGameVars(gameVars().filter(v => v.name !== name));
    const patchVarInitial = (name: string, initial: number) => setGameVars(gameVars().map(v => v.name === name ? { ...v, initial } : v));
    /** Rename a variable in the registry AND every rule that references it. */
    const renameVar = (oldName: string, newName: string) => {
        if (!newName || oldName === newName) return;
        setGameVars(gameVars().map(v => v.name === oldName ? { ...v, name: newName } : v));
        const fix = (bs: Behavior[]): Behavior[] => bs.map(b => ({
            ...b,
            condition: b.condition?.name === oldName ? { ...b.condition, name: newName } : b.condition,
            trigger: (b.trigger.kind === 'varReaches' && (b.trigger as any).name === oldName) ? { ...b.trigger, name: newName } as Trigger : b.trigger,
            actions: b.actions.map(a => ('name' in a && (a as any).name === oldName) ? { ...a, name: newName } : a),
        }));
        store.elements.forEach(e => { if (e.behaviors?.some(b => JSON.stringify(b).includes(`"${oldName}"`))) updateElement(e.id, { behaviors: fix(e.behaviors) } as any, false); });
        setSceneBehaviors(fix(store.sceneBehaviors ?? []));
    };

    const ensureName = () => {
        if (isScene()) return;
        const el = selectedEl();
        if (el && !el.tag) {
            const n = `Sprite${store.elements.filter(e => e.tag?.startsWith('Sprite')).length + 1}`;
            updateElement(el.id, { tag: n } as any, true);
        }
    };

    const [clipboard, setClipboard] = createSignal<Behavior[] | null>(null);
    const cloneBehaviors = (bs: Behavior[]): Behavior[] =>
        bs.map(b => ({ id: newBehaviorId(), trigger: { ...b.trigger }, actions: b.actions.map(a => ({ ...a })) }));

    const addBehavior = () => {
        ensureName();
        const b: Behavior = { id: newBehaviorId(), trigger: isScene() ? { kind: 'start' } : { kind: 'tick' }, actions: [] };
        write([...list(), b]);
    };
    const updateBehavior = (i: number, patch: Partial<Behavior>) => write(list().map((b, j) => (j === i ? { ...b, ...patch } : b)));
    const removeBehavior = (i: number) => write(list().filter((_, j) => j !== i));
    const moveBehavior = (i: number, dir: -1 | 1) => {
        const j = i + dir; const arr = list();
        if (j < 0 || j >= arr.length) return;
        const next = arr.slice(); [next[i], next[j]] = [next[j], next[i]]; write(next);
    };
    const duplicateBehavior = (i: number) => {
        const arr = list(); const copy = cloneBehaviors([arr[i]])[0];
        write([...arr.slice(0, i + 1), copy, ...arr.slice(i + 1)]);
    };
    const copyAll = () => { ensureName(); setClipboard(cloneBehaviors(spriteBehaviors())); showToast('Behaviors copied', 'info'); };
    const pasteAll = () => { const c = clipboard(); if (!c?.length) return; ensureName(); writeSprite([...spriteBehaviors(), ...cloneBehaviors(c)]); };
    const duplicateAction = (i: number, k: number) => updateBehavior(i, { actions: list()[i].actions.flatMap((a, j) => (j === k ? [a, { ...a }] : [a])) });
    const moveAction = (i: number, k: number, dir: -1 | 1) => {
        const acts = list()[i].actions.slice(); const j = k + dir;
        if (j < 0 || j >= acts.length) return;
        [acts[k], acts[j]] = [acts[j], acts[k]]; updateBehavior(i, { actions: acts });
    };
    const setTrigger = (i: number, kind: Trigger['kind']) => updateBehavior(i, { trigger: defaultTrigger(kind) });
    const patchTrigger = (i: number, patch: any) => updateBehavior(i, { trigger: { ...list()[i].trigger, ...patch } as Trigger });
    const addAction = (i: number) => updateBehavior(i, { actions: [...list()[i].actions, defaultAction(isScene() ? 'score' : 'moveDir')] });
    const toggleCondition = (i: number) => updateBehavior(i, { condition: list()[i].condition ? undefined : { name: 'lives', compare: 'atLeast', value: 1 } });
    const patchCondition = (i: number, patch: any) => updateBehavior(i, { condition: { ...(list()[i].condition as any), ...patch } });
    const setAction = (i: number, k: number, kind: Action['kind']) => updateBehavior(i, { actions: list()[i].actions.map((a, j) => (j === k ? defaultAction(kind) : a)) });
    const patchAction = (i: number, k: number, patch: any) => updateBehavior(i, { actions: list()[i].actions.map((a, j) => (j === k ? { ...a, ...patch } : a)) });
    const removeAction = (i: number, k: number) => updateBehavior(i, { actions: list()[i].actions.filter((_, j) => j !== k) });

    const play = () => {
        const script = effectiveGameScript(store.elements, store.sceneBehaviors ?? [], store.gameScript, store.gameVars ?? [], store.blueprints, store.gameAuthoringMode);
        if (!script) { showToast('Add some behaviors first', 'info'); return; }
        if (startGame(script)) showToast('Playing — Esc or Stop to end', 'info');
    };

    const availableActions = () => (isScene() ? ACTIONS.filter(a => SCENE_ACTION_KINDS.has(a.v)) : ACTIONS);

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
                            <TriggerParams trigger={b.trigger} sprites={namedSprites()} onPatch={patch => patchTrigger(i(), patch)} />
                            <div class="bp-rule-tools">
                                <button class="bp-del" title="Move up" onClick={() => moveBehavior(i(), -1)}><ChevronUp size={13} /></button>
                                <button class="bp-del" title="Move down" onClick={() => moveBehavior(i(), 1)}><ChevronDown size={13} /></button>
                                <button class="bp-del" title="Duplicate rule" onClick={() => duplicateBehavior(i())}><Copy size={13} /></button>
                                <button class="bp-del" title={b.condition ? 'Remove condition' : 'Only if… (add a condition)'} onClick={() => toggleCondition(i())}>?</button>
                                <button class="bp-del" title="Delete rule" onClick={() => removeBehavior(i())}><Trash2 size={13} /></button>
                            </div>
                        </div>
                        <Show when={b.condition}>
                            <div class="bp-do bp-if">
                                <span class="bp-kw bp-if-kw">ONLY IF</span>
                                <input class="bp-text" type="text" style={{ 'min-width': '70px' }} value={b.condition!.name} onInput={e => patchCondition(i(), { name: e.currentTarget.value })} />
                                <select class="bp-sel" value={b.condition!.compare} onChange={e => patchCondition(i(), { compare: e.currentTarget.value })}>
                                    <For each={COMPARE}>{c => <option value={c.v}>{c.label}</option>}</For>
                                </select>
                                <input class="bp-num" type="number" value={b.condition!.value} onInput={e => patchCondition(i(), { value: Number(e.currentTarget.value) })} />
                            </div>
                        </Show>
                        <For each={b.actions}>
                            {(a, k) => (
                                <div class="bp-do">
                                    <span class="bp-kw bp-do-kw">DO</span>
                                    <select class="bp-sel" value={a.kind} onChange={e => setAction(i(), k(), e.currentTarget.value as Action['kind'])}>
                                        <For each={availableActions()}>{ac => <option value={ac.v}>{ac.label}</option>}</For>
                                    </select>
                                    <ActionParams action={a} sprites={namedSprites()} states={stateNames()} onPatch={patch => patchAction(i(), k(), patch)} />
                                    <div class="bp-rule-tools">
                                        <button class="bp-del" title="Move up" onClick={() => moveAction(i(), k(), -1)}><ChevronUp size={12} /></button>
                                        <button class="bp-del" title="Move down" onClick={() => moveAction(i(), k(), 1)}><ChevronDown size={12} /></button>
                                        <button class="bp-del" title="Duplicate action" onClick={() => duplicateAction(i(), k())}><Copy size={12} /></button>
                                        <button class="bp-del" title="Remove action" onClick={() => removeAction(i(), k())}><X size={13} /></button>
                                    </div>
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
        <>
                <div class="bp-toolbar">
                    <GameViewSwitcher current="simple" />
                    <div class="bp-head-actions">
                        <button class="bp-play" title="Play the game" onClick={play}><Play size={14} /> Play</button>
                    </div>
                </div>

                <div class="bp-tabs">
                    <button class={`bp-tab ${tab() === 'sprite' ? 'active' : ''}`} onClick={() => setTab('sprite')}>Sprite</button>
                    <button class={`bp-tab ${tab() === 'scene' ? 'active' : ''}`} onClick={() => setTab('scene')}>Scene</button>
                    <button class={`bp-tab ${tab() === 'vars' ? 'active' : ''}`} onClick={() => setTab('vars')}>Vars</button>
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
                                        <button class="bp-add" onClick={() => { buildPlatformerExample(); showToast('Platformer loaded — press Play!', 'success'); }}>
                                            <Play size={14} /> Load example: Jump & Run
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
                                <button class="bp-copy" title="Copy this sprite's behaviors" onClick={copyAll}><Copy size={14} /></button>
                                <Show when={clipboard()?.length}>
                                    <button class="bp-copy" title="Paste copied behaviors onto this sprite" onClick={pasteAll}><ClipboardPaste size={14} /></button>
                                </Show>
                            </div>
                            <RuleList />
                        </Show>
                    </Show>
                    <Show when={tab() === 'scene'}>
                        <div class="bp-hint">Scene rules run for the whole game (set the score, spawn things, decide win/lose).</div>
                        <RuleList />
                    </Show>
                    <Show when={tab() === 'vars'}>
                        <div class="bp-hint">Variables remember numbers — lives, health, ammo. Set their starting value here; rules change them.</div>
                        <div class="bp-vars">
                            <For each={gameVars()} fallback={<div class="bp-empty">No variables yet.</div>}>
                                {(v) => (
                                    <div class="bp-var-row">
                                        <input class="bp-name" type="text" value={v.name}
                                            onChange={e => renameVar(v.name, e.currentTarget.value.trim())} />
                                        <span class="bp-unit">starts at</span>
                                        <input class="bp-num" type="number" value={v.initial}
                                            onInput={e => patchVarInitial(v.name, Number(e.currentTarget.value))} />
                                        <button class="bp-del" title="Delete variable" onClick={() => removeVar(v.name)}><Trash2 size={13} /></button>
                                    </div>
                                )}
                            </For>
                            <button class="bp-add" onClick={() => addVar(`var${gameVars().length + 1}`, 0)}><Plus size={15} /> Add variable</button>
                            <Show when={undefinedVars().length}>
                                <div class="bp-hint">Used in rules but not defined — tap to add:</div>
                                <div class="bp-var-chips">
                                    <For each={undefinedVars()}>
                                        {(n) => <button class="bp-chip" onClick={() => addVar(n, 0)}><Plus size={11} /> {n}</button>}
                                    </For>
                                </div>
                            </Show>
                        </div>
                    </Show>
                    <Show when={tab() === 'code'}>
                        <div class="bp-hint">This is the game.* code your blocks make (read-only — a peek under the hood).</div>
                        <pre class="bp-code">{code() || '// Add behaviors to see the generated code.'}</pre>
                    </Show>
                </div>
        </>
    );
};

export default BehaviorsPanel;
