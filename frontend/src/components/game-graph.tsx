/**
 * Game Graph — the full-screen visual node/wire editor (Blueprint-style view
 * over the same behavior blocks). Each behavior is a node; a broadcast wires to
 * every matching receive. Pan/zoom the surface, drag nodes to lay them out
 * (positions persist), add/delete rules, edit a rule in the Behaviors panel,
 * and Play. Compiles through the same pipeline as the panel — one model.
 */

import { type Component, For, Show, createSignal, createMemo, onMount, onCleanup } from 'solid-js';
import { Portal } from 'solid-js/web';
import { X, Play, Plus, Trash2, Gamepad2 } from 'lucide-solid';
import {
    store, updateElement, setSceneBehaviors, setBehaviorGraphPos, toggleGameGraph,
} from '../store/app-store';
import { newBehaviorId, type Behavior, type Trigger, type Action } from '../game/behavior-types';
import { TRIGGERS, COMPARE, ACTIONS, SCENE_ACTION_KINDS, defaultTrigger, defaultAction, broadcastsOf, receivesOf } from '../game/behavior-ui';
import { TriggerParams, ActionParams } from '../game/behavior-editors';
import {
    buildGraphNodes, deriveWires, wirePath, messageColor, NODE_W,
    deriveFlowTargets, deriveFlowWires, flowTargetsOf, TARGET_W, FLOW_STATE_COLOR, FLOW_PAGE_COLOR,
} from '../game/graph-layout';
import { generateGameScript } from '../game/behaviors-to-script';
import { startGame } from '../game/game-runtime';
import { showToast } from './toast';
import { GameViewSwitcher } from './game-view-switcher';
import './game-graph.css';

const PORT_Y = 30;       // message wire attaches this far below a node's top
const FLOW_PORT_Y = 50;  // scene-flow (goToState/goToPage) wire attaches here
const TARGET_PORT_Y = 20; // input port on a flow-target pill (its vertical centre)

const GameGraph: Component = () => {
    const [scale, setScale] = createSignal(1);
    const [pan, setPan] = createSignal({ x: 40, y: 40 });
    const [addOwner, setAddOwner] = createSignal('');
    // While dragging a node, override its position locally (commit on release).
    const [drag, setDrag] = createSignal<{ id: string; owner: string; x: number; y: number } | null>(null);
    // While dragging a wire from an output port: source + live cursor (surface coords).
    const [wiring, setWiring] = createSignal<{ fromId: string; message: string; cx: number; cy: number } | null>(null);
    // While dragging a rule's flow-out port to retarget its goToState / goToPage jump.
    const [flowWiring, setFlowWiring] = createSignal<{ fromId: string; owner: string; kind: 'state' | 'page'; cx: number; cy: number } | null>(null);

    const owners = createMemo(() => { store.dirtyRevision; return ['', ...store.elements.filter(e => !!e.tag).map(e => e.tag as string)]; });
    const sprites = createMemo(() => { store.dirtyRevision; return store.elements.filter(e => !!e.tag).map(e => e.tag as string); });
    const states = createMemo(() => store.states.map(s => s.name));
    const triggersFor = (owner: string) => owner === '' ? TRIGGERS.filter(t => t.v === 'start' || t.v === 'tick') : TRIGGERS;
    const actionsFor = (owner: string) => owner === '' ? ACTIONS.filter(a => SCENE_ACTION_KINDS.has(a.v)) : ACTIONS;

    const nodes = createMemo(() => {
        store.dirtyRevision;
        const ns = buildGraphNodes(store.elements, store.sceneBehaviors ?? []);
        const d = drag();
        return d ? ns.map(n => n.behavior.id === d.id ? { ...n, x: d.x, y: d.y } : n) : ns;
    });
    const posOf = (id: string) => { const n = nodes().find(x => x.behavior.id === id); return n ? { x: n.x, y: n.y } : { x: 0, y: 0 }; };
    const wires = createMemo(() => deriveWires(nodes()));
    // Scene-flow: goToState / goToPage jumps drawn as wires to target pills.
    const flowTargets = createMemo(() => deriveFlowTargets(nodes(), i => store.slides[i]?.name));
    const flowWires = createMemo(() => deriveFlowWires(nodes()));
    const targetPosOf = (id: string) => { const t = flowTargets().find(x => x.id === id); return t ? { x: t.x, y: t.y } : { x: 0, y: 0 }; };
    const flowColor = (kind: 'state' | 'page') => kind === 'state' ? FLOW_STATE_COLOR : FLOW_PAGE_COLOR;
    /** Raw behavior refs (stable across edits) — the node <For> keys by these so
     *  editing one node's fields recreates only that card, not every card. */
    const allBehaviors = createMemo<Behavior[]>(() => {
        store.dirtyRevision;
        const out: Behavior[] = [...(store.sceneBehaviors ?? [])];
        for (const el of store.elements) if (el.tag) for (const b of (el.behaviors ?? [])) out.push(b);
        return out;
    });

    // ── pan / zoom ──
    let vpRef: HTMLDivElement | undefined;
    const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const rect = vpRef!.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        const s0 = scale(), s1 = Math.max(0.25, Math.min(2.5, s0 * factor));
        const p = pan();
        // keep the point under the cursor fixed
        setPan({ x: mx - (mx - p.x) * (s1 / s0), y: my - (my - p.y) * (s1 / s0) });
        setScale(s1);
    };
    let panning: { sx: number; sy: number; px: number; py: number } | null = null;
    const onSurfaceDown = (e: PointerEvent) => {
        if ((e.target as HTMLElement).closest('.gg-node')) return; // node drag handles its own
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        panning = { sx: e.clientX, sy: e.clientY, px: pan().x, py: pan().y };
    };
    /** Client point → surface (world) coordinates. */
    const toSurface = (clientX: number, clientY: number) => {
        const r = vpRef!.getBoundingClientRect();
        const p = pan(), s = scale();
        return { x: (clientX - r.left - p.x) / s, y: (clientY - r.top - p.y) / s };
    };
    const onSurfaceMove = (e: PointerEvent) => {
        if (wiring()) { const w = wiring()!; const p = toSurface(e.clientX, e.clientY); setWiring({ ...w, cx: p.x, cy: p.y }); return; }
        if (flowWiring()) { const w = flowWiring()!; const p = toSurface(e.clientX, e.clientY); setFlowWiring({ ...w, cx: p.x, cy: p.y }); return; }
        if (!panning) return;
        setPan({ x: panning.px + (e.clientX - panning.sx), y: panning.py + (e.clientY - panning.sy) });
    };
    const onSurfaceUp = (e: PointerEvent) => {
        if (wiring()) { resolveWire(e); setWiring(null); return; }
        if (flowWiring()) { resolveFlowWire(e); setFlowWiring(null); return; }
        panning = null;
    };

    // ── flow-wire drag: retarget a rule's goToState / goToPage to another target pill ──
    const startFlowWire = (e: PointerEvent, fromId: string, owner: string, kind: 'state' | 'page') => {
        e.stopPropagation();
        const p = toSurface(e.clientX, e.clientY);
        setFlowWiring({ fromId, owner, kind, cx: p.x, cy: p.y });
    };
    const resolveFlowWire = (e: PointerEvent) => {
        const w = flowWiring()!;
        const pill = (e.target as HTMLElement)?.closest?.('.gg-target') as HTMLElement | null;
        if (!pill) return; // dropped on empty space
        const kind = pill.dataset.targetKind, key = pill.dataset.targetKey;
        if (!kind || key == null) return;
        const bs = behaviorsOf(w.owner);
        const b = bs.find(x => x.id === w.fromId);
        if (!b) return;
        let done = false;
        const actions = b.actions.map(a => {
            if (done) return a;
            if (kind === 'state' && a.kind === 'goToState') { done = true; return { ...a, state: key }; }
            if (kind === 'page' && a.kind === 'goToPage') { done = true; return { ...a, index: Number(key) }; }
            return a;
        });
        if (done) { writeOwner(w.owner, bs.map(x => x.id === w.fromId ? { ...x, actions } : x)); showToast(`Rewired → ${pill.dataset.targetLabel || key}`, 'success'); }
        else showToast(`Drop on a ${w.kind} target to rewire`, 'info');
    };

    // ── wire drag: connect a broadcast output to a receiver ──
    const startWire = (e: PointerEvent, fromId: string, message: string) => {
        e.stopPropagation();
        const p = toSurface(e.clientX, e.clientY);
        setWiring({ fromId, message, cx: p.x, cy: p.y });
    };
    const resolveWire = (e: PointerEvent) => {
        const w = wiring()!;
        const card = (e.target as HTMLElement)?.closest?.('.gg-node') as HTMLElement | null;
        if (!card) return; // dropped on empty space
        const targetId = card.dataset.id!, targetOwner = card.dataset.owner ?? '';
        if (targetId === w.fromId) return;
        const bs = behaviorsOf(targetOwner);
        const target = bs.find(b => b.id === targetId);
        if (target && target.trigger.kind === 'receive') {
            // connect: the receiver now listens to the source's message
            writeOwner(targetOwner, bs.map(b => b.id === targetId ? { ...b, trigger: { kind: 'receive', message: w.message } } : b));
            showToast(`Wired → "${w.message}"`, 'success');
        } else {
            // add a new listener rule on the dropped node's sprite
            const nb: Behavior = { id: newBehaviorId(), trigger: { kind: 'receive', message: w.message }, actions: [], graphPos: { x: card.offsetLeft, y: card.offsetTop + 170 } };
            writeOwner(targetOwner, [...bs, nb]);
            showToast(`New listener for "${w.message}"`, 'success');
        }
    };

    // ── node drag ──
    let nodeDrag: { id: string; owner: string; sx: number; sy: number; ox: number; oy: number } | null = null;
    const startNodeDrag = (e: PointerEvent, id: string, owner: string) => {
        e.stopPropagation();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        const p = posOf(id);
        nodeDrag = { id, owner, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y };
        setDrag({ id, owner, x: p.x, y: p.y });
    };
    const moveNodeDrag = (e: PointerEvent) => {
        if (!nodeDrag) return;
        const s = scale();
        setDrag({ id: nodeDrag.id, owner: nodeDrag.owner, x: nodeDrag.ox + (e.clientX - nodeDrag.sx) / s, y: nodeDrag.oy + (e.clientY - nodeDrag.sy) / s });
    };
    const endNodeDrag = () => {
        const d = drag();
        if (d) setBehaviorGraphPos(d.owner, d.id, { x: Math.round(d.x), y: Math.round(d.y) });
        nodeDrag = null; setDrag(null);
    };

    // ── mutations ──
    const writeOwner = (owner: string, bs: Behavior[]) => {
        if (owner === '') setSceneBehaviors(bs);
        else { const el = store.elements.find(e => e.tag === owner); if (el) updateElement(el.id, { behaviors: bs } as any, true); }
    };
    const behaviorsOf = (owner: string): Behavior[] =>
        owner === '' ? (store.sceneBehaviors ?? []) : (store.elements.find(e => e.tag === owner)?.behaviors ?? []);
    const addNode = () => {
        const owner = addOwner();
        const p = pan(), s = scale();
        // place the new node near the center of the current view
        const cx = ((vpRef!.clientWidth / 2) - p.x) / s;
        const cy = ((vpRef!.clientHeight / 2) - p.y) / s;
        const b: Behavior = { id: newBehaviorId(), trigger: owner === '' ? { kind: 'start' } : { kind: 'tick' }, actions: [], graphPos: { x: Math.round(cx), y: Math.round(cy) } };
        writeOwner(owner, [...behaviorsOf(owner), b]);
    };
    const deleteNode = (owner: string, id: string) => writeOwner(owner, behaviorsOf(owner).filter(b => b.id !== id));

    // ── inline node edits (write the same behavior data the panel does) ──
    const bhv = (owner: string, id: string) => behaviorsOf(owner).find(b => b.id === id);
    const patchBehavior = (owner: string, id: string, patch: Partial<Behavior>) =>
        writeOwner(owner, behaviorsOf(owner).map(b => b.id === id ? { ...b, ...patch } : b));
    const setTriggerKind = (owner: string, id: string, kind: Trigger['kind']) => patchBehavior(owner, id, { trigger: defaultTrigger(kind) });
    const patchTrigger = (owner: string, id: string, patch: any) => { const b = bhv(owner, id); if (b) patchBehavior(owner, id, { trigger: { ...b.trigger, ...patch } as Trigger }); };
    const toggleCondition = (owner: string, id: string) => { const b = bhv(owner, id); if (b) patchBehavior(owner, id, { condition: b.condition ? undefined : { name: 'lives', compare: 'atLeast', value: 1 } }); };
    const patchCondition = (owner: string, id: string, patch: any) => { const b = bhv(owner, id); if (b) patchBehavior(owner, id, { condition: { ...(b.condition as any), ...patch } }); };
    const addActionTo = (owner: string, id: string) => { const b = bhv(owner, id); if (b) patchBehavior(owner, id, { actions: [...b.actions, defaultAction(owner === '' ? 'score' : 'moveDir')] }); };
    const setActionKind = (owner: string, id: string, k: number, kind: Action['kind']) => { const b = bhv(owner, id); if (b) patchBehavior(owner, id, { actions: b.actions.map((a, j) => j === k ? defaultAction(kind) : a) }); };
    const patchActionAt = (owner: string, id: string, k: number, patch: any) => { const b = bhv(owner, id); if (b) patchBehavior(owner, id, { actions: b.actions.map((a, j) => j === k ? { ...a, ...patch } : a) }); };
    const removeActionAt = (owner: string, id: string, k: number) => { const b = bhv(owner, id); if (b) patchBehavior(owner, id, { actions: b.actions.filter((_, j) => j !== k) }); };

    const play = () => {
        const script = generateGameScript(store.elements, store.sceneBehaviors ?? [], store.gameVars ?? [], store.blueprints);
        if (!script) { showToast('Add some rules first', 'info'); return; }
        toggleGameGraph(false);
        if (startGame(script)) showToast('Playing — Esc or Stop to end', 'info');
    };

    onMount(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && store.showGameGraph && !store.gameActive) toggleGameGraph(false); };
        window.addEventListener('keydown', onKey);
        onCleanup(() => window.removeEventListener('keydown', onKey));
    });

    return (
        <Show when={store.showGameGraph}>
            <Portal>
                <div class="gg-overlay">
                    <div class="gg-header">
                        <div class="gg-title"><Gamepad2 size={16} /><h2>Game Graph</h2><GameViewSwitcher current="graph" /></div>
                        <div class="gg-head-actions">
                            <select class="gg-sel" value={addOwner()} onChange={e => setAddOwner(e.currentTarget.value)}>
                                <For each={owners()}>{o => <option value={o}>{o === '' ? 'Scene' : o}</option>}</For>
                            </select>
                            <button class="gg-add" onClick={addNode}><Plus size={14} /> Add rule</button>
                            <button class="gg-play" onClick={play}><Play size={14} /> Play</button>
                            <button class="gg-close" onClick={() => toggleGameGraph(false)}><X size={18} /></button>
                        </div>
                    </div>

                    <div class="gg-viewport" ref={el => vpRef = el}
                        onWheel={onWheel} onPointerDown={onSurfaceDown} onPointerMove={onSurfaceMove} onPointerUp={onSurfaceUp} onPointerCancel={onSurfaceUp}>
                        <div class="gg-surface" style={{ transform: `translate(${pan().x}px, ${pan().y}px) scale(${scale()})` }}>
                            <svg class="gg-wires" width="8000" height="8000">
                                <For each={wires()}>
                                    {(wire) => {
                                        const a = () => posOf(wire.from), b = () => posOf(wire.to);
                                        return <path d={wirePath(a().x + NODE_W, a().y + PORT_Y, b().x, b().y + PORT_Y)}
                                            fill="none" stroke={messageColor(wire.message)} stroke-width="2.5" opacity="0.85" />;
                                    }}
                                </For>
                                <Show when={wiring()}>
                                    {w => {
                                        const a = () => posOf(w().fromId);
                                        return <path d={wirePath(a().x + NODE_W, a().y + PORT_Y, w().cx, w().cy)}
                                            fill="none" stroke={messageColor(w().message)} stroke-width="2.5" stroke-dasharray="6 4" opacity="0.9" />;
                                    }}
                                </Show>
                                <For each={flowWires()}>
                                    {(wire) => {
                                        const a = () => posOf(wire.from), b = () => targetPosOf(wire.to);
                                        return <path d={wirePath(a().x + NODE_W, a().y + FLOW_PORT_Y, b().x, b().y + TARGET_PORT_Y)}
                                            fill="none" stroke={flowColor(wire.kind)} stroke-width="2.5" stroke-dasharray="2 6" stroke-linecap="round" opacity="0.9" />;
                                    }}
                                </For>
                                <Show when={flowWiring()}>
                                    {w => {
                                        const a = () => posOf(w().fromId);
                                        return <path d={wirePath(a().x + NODE_W, a().y + FLOW_PORT_Y, w().cx, w().cy)}
                                            fill="none" stroke={flowColor(w().kind)} stroke-width="2.5" stroke-dasharray="2 6" stroke-linecap="round" opacity="0.9" />;
                                    }}
                                </Show>
                            </svg>
                            <For each={allBehaviors()}>
                                {(b) => {
                                    const meta = () => nodes().find(n => n.behavior.id === b.id);
                                    const owner = () => meta()?.owner ?? '';
                                    return (
                                        <div class="gg-node" data-id={b.id} data-owner={owner()} style={{ left: `${meta()?.x ?? 0}px`, top: `${meta()?.y ?? 0}px`, width: `${NODE_W}px` }}>
                                            <div class="gg-node-head" onPointerDown={e => startNodeDrag(e, b.id, owner())} onPointerMove={moveNodeDrag} onPointerUp={endNodeDrag} onPointerCancel={endNodeDrag}>
                                                <span class="gg-owner">{meta()?.ownerLabel ?? 'Scene'}</span>
                                                <span class="gg-node-tools">
                                                    <button title="Delete rule" onPointerDown={e => e.stopPropagation()} onClick={() => deleteNode(owner(), b.id)}><Trash2 size={12} /></button>
                                                </span>
                                            </div>
                                            <Show when={receivesOf(b)}><span class="gg-port gg-in" style={{ background: messageColor(receivesOf(b)!) }} /></Show>
                                            <Show when={broadcastsOf(b).length}>
                                                <span class="gg-port gg-out" title="Drag to a node to wire this message"
                                                    style={{ background: messageColor(broadcastsOf(b)[0]) }}
                                                    onPointerDown={e => startWire(e, b.id, broadcastsOf(b)[0])} />
                                            </Show>
                                            <Show when={flowTargetsOf(b).length}>
                                                <span class="gg-port gg-out-flow" title="Drag to a state / page pill to rewire this jump"
                                                    style={{ background: flowColor(flowTargetsOf(b)[0].kind) }}
                                                    onPointerDown={e => startFlowWire(e, b.id, owner(), flowTargetsOf(b)[0].kind)} />
                                            </Show>
                                            <div class="gg-body">
                                                <div class="gg-row">
                                                    <span class="gg-kw">WHEN</span>
                                                    <select class="be-sel" value={b.trigger.kind} onChange={e => setTriggerKind(owner(), b.id, e.currentTarget.value as Trigger['kind'])}>
                                                        <For each={triggersFor(owner())}>{t => <option value={t.v}>{t.label}</option>}</For>
                                                    </select>
                                                    <TriggerParams trigger={b.trigger} sprites={sprites()} onPatch={patch => patchTrigger(owner(), b.id, patch)} />
                                                </div>
                                                <Show when={b.condition}>
                                                    <div class="gg-row gg-if-row">
                                                        <span class="gg-kw gg-if-kw">ONLY IF</span>
                                                        <input class="be-text" type="text" value={b.condition!.name} onInput={e => patchCondition(owner(), b.id, { name: e.currentTarget.value })} />
                                                        <select class="be-sel" value={b.condition!.compare} onChange={e => patchCondition(owner(), b.id, { compare: e.currentTarget.value })}>
                                                            <For each={COMPARE}>{c => <option value={c.v}>{c.label}</option>}</For>
                                                        </select>
                                                        <input class="be-num" type="number" value={b.condition!.value} onInput={e => patchCondition(owner(), b.id, { value: Number(e.currentTarget.value) })} />
                                                        <button class="gg-row-x" title="Remove condition" onClick={() => toggleCondition(owner(), b.id)}><X size={12} /></button>
                                                    </div>
                                                </Show>
                                                <For each={b.actions}>
                                                    {(a, k) => (
                                                        <div class="gg-row gg-do-row">
                                                            <span class="gg-kw gg-do-kw">DO</span>
                                                            <select class="be-sel" value={a.kind} onChange={e => setActionKind(owner(), b.id, k(), e.currentTarget.value as Action['kind'])}>
                                                                <For each={actionsFor(owner())}>{ac => <option value={ac.v}>{ac.label}</option>}</For>
                                                            </select>
                                                            <ActionParams action={a} sprites={sprites()} states={states()} onPatch={patch => patchActionAt(owner(), b.id, k(), patch)} />
                                                            <button class="gg-row-x" title="Remove action" onClick={() => removeActionAt(owner(), b.id, k())}><X size={12} /></button>
                                                        </div>
                                                    )}
                                                </For>
                                                <div class="gg-node-add">
                                                    <button class="gg-add-do" onClick={() => addActionTo(owner(), b.id)}><Plus size={11} /> action</button>
                                                    <Show when={!b.condition}><button class="gg-add-do" onClick={() => toggleCondition(owner(), b.id)}><Plus size={11} /> only if</button></Show>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }}
                            </For>
                            <For each={flowTargets()}>
                                {(t) => (
                                    <div class={`gg-target gg-target-${t.kind}`} data-target-kind={t.kind} data-target-key={t.id.slice(t.id.indexOf(':') + 1)} data-target-label={t.label}
                                        style={{ left: `${t.x}px`, top: `${t.y}px`, width: `${TARGET_W}px`, '--flow-color': flowColor(t.kind) }}>
                                        <span class="gg-port gg-in gg-target-in" style={{ background: flowColor(t.kind) }} />
                                        <span class="gg-target-kw">{t.kind === 'state' ? 'STATE' : 'PAGE'}</span>
                                        <span class="gg-target-label" title={t.label}>{t.label}</span>
                                    </div>
                                )}
                            </For>
                        </div>
                    </div>
                    <div class="gg-foot">Edit rules right in the nodes · dashed wires show state / page jumps · scroll to zoom · drag empty space to pan · Esc closes</div>
                </div>
            </Portal>
        </Show>
    );
};

export default GameGraph;
