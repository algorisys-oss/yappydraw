/**
 * Blueprint Graph — the full-screen execution-flow editor (Unreal-style).
 *
 * Unlike the Game Graph (which renders behaviors as nodes with derived wires),
 * this is a true exec-flow graph: you place Event / Action / Branch nodes and
 * draw EXECUTION wires between them — an event fires, execution flows along the
 * wires in the order you draw. It compiles to the same `game.*` runtime via
 * `blueprint-to-script.ts`.
 *
 * A Blueprint belongs to an OWNER — the Scene, or a specific sprite (picked from
 * the header dropdown). A sprite owner unlocks the full trigger + action set
 * (its actions bind to that sprite); the Scene owner offers the scene-safe subset.
 * Pan/zoom/drag scaffolding mirrors game-graph.tsx.
 */

import { type Component, For, Show, createSignal, createMemo, onMount, onCleanup } from 'solid-js';
import { Portal, Dynamic } from 'solid-js/web';
import { X, Play, Zap, Trash2, Workflow, GitBranch, Cog, ListOrdered, Timer, Plus, Minus, Variable, Hash, Scale, Sigma, Dices, Move, Repeat, DoorOpen, ChevronDown, Database } from 'lucide-solid';
import {
    store, blueprintFor, setBlueprintNodes, setBlueprintEdges, setBlueprintNodePos, toggleBlueprint,
} from '../store/app-store';
import type { Trigger, Action } from '../game/behavior-types';
import { TRIGGERS, COMPARE, ACTIONS, SCENE_ACTION_KINDS, defaultTrigger, defaultAction } from '../game/behavior-ui';
import { TriggerParams, ActionParams } from '../game/behavior-editors';
import { wirePath } from '../game/graph-layout';
import { type BPNode, type BPEdge, type BPPin, type BPNodeKind, newBPNodeId, BP_EVENT_KINDS, hasExecIn, pinsOf, seqCount, dataInputs, dataOutputs, execInputs, MATH_OPS, SPRITE_PROPS } from '../game/blueprint-types';
import { effectiveGameScript } from '../game/behaviors-to-script';
import { startGame } from '../game/game-runtime';
import { showToast } from './toast';
import { GameViewSwitcher } from './game-view-switcher';
import './blueprint-graph.css';

const BP_NODE_W = 236;
const IN_Y = 26;      // exec-input pin y (below node top)
const OUT_Y = 26;     // first exec-output pin y
const PIN_STEP = 24;  // vertical gap between stacked output pins
const EXEC_COLOR = '#e2e8f0';
const DATA_COLOR = '#22d3ee'; // data wires / pins (cyan)

/** y of a given exec output pin on a node (pins stack top-down in `pinsOf` order). */
const pinOutY = (n: BPNode, pin: BPPin) => OUT_Y + Math.max(0, pinsOf(n).indexOf(pin)) * PIN_STEP;
const pinColor = (pin: BPPin) => pin === 'val' ? DATA_COLOR : pin === 'true' ? '#22c55e' : pin === 'false' ? '#ef4444' : EXEC_COLOR;
const pinLabel = (pin: BPPin): string =>
    pin === 'true' ? 'T' : pin === 'false' ? 'F' : pin === 'loop' ? '↻' : pin === 'done' ? '✓' : pin.startsWith('seq') ? String(Number(pin.slice(3)) + 1) : '';

// Palette dropdown groups (keep Event/Action as primary buttons).
const FLOW_ITEMS: { k: BPNodeKind; label: string; icon: any }[] = [
    { k: 'branch', label: 'Branch', icon: GitBranch },
    { k: 'sequence', label: 'Sequence', icon: ListOrdered },
    { k: 'delay', label: 'Delay', icon: Timer },
    { k: 'forLoop', label: 'For Loop', icon: Repeat },
    { k: 'gate', label: 'Gate', icon: DoorOpen },
];
const DATA_ITEMS: { k: BPNodeKind; label: string; icon: any }[] = [
    { k: 'getVar', label: 'Get Variable', icon: Variable },
    { k: 'literal', label: 'Value', icon: Hash },
    { k: 'compare', label: 'Compare', icon: Scale },
    { k: 'math', label: 'Math', icon: Sigma },
    { k: 'random', label: 'Random', icon: Dices },
    { k: 'spriteProp', label: 'Sprite Property', icon: Move },
];
/** y of the single data OUTPUT pin ('val'). */
const dataOutY = (_n: BPNode) => OUT_Y;
/** y of an exec INPUT port (they stack for a gate). */
const execInY = (n: BPNode, port: BPPin) => IN_Y + Math.max(0, execInputs(n.kind).indexOf(port)) * PIN_STEP;
/** y of a data INPUT port — below the exec inputs, then stacked. */
const dataInY = (n: BPNode, inPin: BPPin) => IN_Y + (execInputs(n.kind).length || 0) * PIN_STEP + Math.max(0, dataInputs(n).indexOf(inPin)) * PIN_STEP;
/** Short label for an exec-input pin (gate ports). */
const execInLabel = (port: BPPin) => port === 'in' ? '' : port.charAt(0).toUpperCase();

const BlueprintGraph: Component = () => {
    const [scale, setScale] = createSignal(1);
    const [pan, setPan] = createSignal({ x: 60, y: 60 });
    const [owner, setOwner] = createSignal(''); // '' = Scene, else a sprite tag
    const [menu, setMenu] = createSignal<'flow' | 'data' | null>(null);
    const [drag, setDrag] = createSignal<{ id: string; x: number; y: number } | null>(null);
    const [wiring, setWiring] = createSignal<{ fromId: string; pin: BPPin; cx: number; cy: number } | null>(null);

    const sprites = createMemo(() => { store.dirtyRevision; return store.elements.filter(e => !!e.tag).map(e => e.tag as string); });
    const owners = createMemo(() => ['', ...sprites()]);
    const isSprite = () => owner() !== '';
    const graph = createMemo(() => { store.dirtyRevision; return blueprintFor(owner()); });

    const nodes = createMemo(() => {
        const ns = graph().nodes;
        const d = drag();
        return d ? ns.map(n => n.id === d.id ? { ...n, x: d.x, y: d.y } : n) : ns;
    });
    const edges = createMemo(() => graph().edges);
    const states = createMemo(() => store.states.map(s => s.name));
    const nodeById = (id: string) => nodes().find(x => x.id === id);
    const posOf = (id: string) => { const n = nodeById(id); return n ? { x: n.x, y: n.y } : { x: 0, y: 0 }; };
    /** Absolute y of a source node's output pin (falls back to first pin). */
    const srcPinY = (id: string, pin: BPPin) => { const n = nodeById(id); return (n ? n.y : 0) + (n ? pinOutY(n, pin) : OUT_Y); };

    // Trigger / action palettes depend on the owner: sprites get the full set.
    const eventTriggers = createMemo(() => isSprite() ? TRIGGERS : TRIGGERS.filter(t => BP_EVENT_KINDS.includes(t.v)));
    const actionList = createMemo(() => isSprite() ? ACTIONS : ACTIONS.filter(a => SCENE_ACTION_KINDS.has(a.v)));

    // ── mutations (write the active owner's graph) ──
    const writeNodes = (ns: BPNode[]) => setBlueprintNodes(owner(), ns);
    const writeEdges = (es: BPEdge[]) => setBlueprintEdges(owner(), es);
    const patchNode = (id: string, patch: Partial<BPNode>) => writeNodes(graph().nodes.map(n => n.id === id ? { ...n, ...patch } : n));
    const deleteNode = (id: string) => {
        writeNodes(graph().nodes.filter(n => n.id !== id));
        writeEdges(graph().edges.filter(e => e.from !== id && e.to !== id));
    };
    /** An exec output pin carries at most one wire — replace it. `toPin` = the target's exec-input port. */
    const connect = (from: string, pin: BPPin, to: string, toPin: BPPin) => {
        if (from === to) return;
        const kept = graph().edges.filter(e => !(e.from === from && e.pin === pin && e.pin !== 'val'));
        writeEdges([...kept, { from, pin, to, toPin }]);
    };
    /** A data input holds at most one wire — replace any existing wire into (to,toPin). */
    const connectData = (from: string, to: string, toPin: BPPin) => {
        if (from === to) return;
        const kept = graph().edges.filter(e => !(e.to === to && e.toPin === toPin));
        writeEdges([...kept, { from, pin: 'val', to, toPin }]);
    };

    const addNode = (kind: BPNodeKind) => {
        const p = pan(), s = scale();
        const cx = ((vpRef!.clientWidth / 2) - p.x) / s;
        const cy = ((vpRef!.clientHeight / 2) - p.y) / s;
        const off = (graph().nodes.length % 6) * 28; // cascade so adds don't stack
        const base = { id: newBPNodeId(), kind, x: Math.round(cx - BP_NODE_W / 2 + off), y: Math.round(cy - 40 + off) };
        const node: BPNode =
            kind === 'event' ? { ...base, trigger: { kind: 'start' } }
                : kind === 'action' ? { ...base, action: defaultAction(isSprite() ? 'moveDir' : 'score') }
                    : kind === 'branch' ? { ...base, condition: { name: 'score', compare: 'atLeast', value: 1 } }
                        : kind === 'sequence' ? { ...base, count: 2 }
                            : kind === 'delay' ? { ...base, seconds: 1 }
                                : kind === 'getVar' ? { ...base, varName: 'score' }
                                    : kind === 'literal' ? { ...base, dataValue: 0 }
                                        : kind === 'compare' ? { ...base, op: 'atLeast' }
                                            : kind === 'math' ? { ...base, mathOp: '+' }
                                                : kind === 'random' ? { ...base, min: 1, max: 6 }
                                                    : kind === 'forLoop' ? { ...base, times: 3 }
                                                        : kind === 'gate' ? { ...base, startOpen: false }
                                                            : { ...base, spriteTag: sprites()[0] ?? '', prop: 'x' }; // spriteProp
        writeNodes([...graph().nodes, node]);
    };

    // ── pan / zoom (mirrors game-graph) ──
    let vpRef: HTMLDivElement | undefined;
    const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const rect = vpRef!.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        const s0 = scale(), s1 = Math.max(0.25, Math.min(2.5, s0 * factor));
        const p = pan();
        setPan({ x: mx - (mx - p.x) * (s1 / s0), y: my - (my - p.y) * (s1 / s0) });
        setScale(s1);
    };
    let panning: { sx: number; sy: number; px: number; py: number } | null = null;
    const onSurfaceDown = (e: PointerEvent) => {
        if ((e.target as HTMLElement).closest('.bp-node')) return;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        panning = { sx: e.clientX, sy: e.clientY, px: pan().x, py: pan().y };
    };
    const toSurface = (clientX: number, clientY: number) => {
        const r = vpRef!.getBoundingClientRect();
        const p = pan(), s = scale();
        return { x: (clientX - r.left - p.x) / s, y: (clientY - r.top - p.y) / s };
    };
    const onSurfaceMove = (e: PointerEvent) => {
        if (wiring()) { const w = wiring()!; const p = toSurface(e.clientX, e.clientY); setWiring({ ...w, cx: p.x, cy: p.y }); return; }
        if (!panning) return;
        setPan({ x: panning.px + (e.clientX - panning.sx), y: panning.py + (e.clientY - panning.sy) });
    };
    const onSurfaceUp = (e: PointerEvent) => {
        if (wiring()) { resolveWire(e); setWiring(null); return; }
        panning = null;
    };

    // ── exec-wire drag ──
    const startWire = (e: PointerEvent, fromId: string, pin: BPPin) => {
        e.stopPropagation();
        const p = toSurface(e.clientX, e.clientY);
        setWiring({ fromId, pin, cx: p.x, cy: p.y });
    };
    const resolveWire = (e: PointerEvent) => {
        const w = wiring()!;
        const card = (e.target as HTMLElement)?.closest?.('.bp-node') as HTMLElement | null;
        if (!card) return;
        const targetId = card.dataset.id!;
        const target = graph().nodes.find(n => n.id === targetId);
        if (!target) return;
        if (w.pin === 'val') {
            // Data wire: land on the first free data input (else the first).
            const ins = dataInputs(target);
            if (!ins.length) { showToast('Data wire needs a Compare / Branch / action target', 'info'); return; }
            const used = new Set(graph().edges.filter(x => x.to === targetId && x.pin === 'val').map(x => x.toPin));
            connectData(w.fromId, targetId, ins.find(p => !used.has(p)) ?? ins[0]);
        } else {
            if (!hasExecIn(target.kind)) { showToast('Wire must end on an action / flow node', 'info'); return; }
            // Land on the specific exec-input pin if dropped on one, else the first.
            const pinEl = (e.target as HTMLElement)?.closest?.('[data-execin]') as HTMLElement | null;
            const port = pinEl?.dataset.execin ?? execInputs(target.kind)[0] ?? 'in';
            connect(w.fromId, w.pin, targetId, port);
        }
    };

    // ── node drag ──
    let nodeDrag: { id: string; sx: number; sy: number; ox: number; oy: number } | null = null;
    const startNodeDrag = (e: PointerEvent, id: string) => {
        e.stopPropagation();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        const p = posOf(id);
        nodeDrag = { id, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y };
        setDrag({ id, x: p.x, y: p.y });
    };
    const moveNodeDrag = (e: PointerEvent) => {
        if (!nodeDrag) return;
        const s = scale();
        setDrag({ id: nodeDrag.id, x: nodeDrag.ox + (e.clientX - nodeDrag.sx) / s, y: nodeDrag.oy + (e.clientY - nodeDrag.sy) / s });
    };
    const endNodeDrag = () => {
        const d = drag();
        if (d) setBlueprintNodePos(owner(), d.id, { x: d.x, y: d.y });
        nodeDrag = null; setDrag(null);
    };

    // ── inline edits ──
    const setEventKind = (id: string, kind: Trigger['kind']) => patchNode(id, { trigger: defaultTrigger(kind) });
    const patchTrigger = (id: string, patch: any) => { const n = nodes().find(x => x.id === id); if (n?.trigger) patchNode(id, { trigger: { ...n.trigger, ...patch } as Trigger }); };
    const setActKind = (id: string, kind: Action['kind']) => patchNode(id, { action: defaultAction(kind) });
    const patchAction = (id: string, patch: any) => { const n = nodes().find(x => x.id === id); if (n?.action) patchNode(id, { action: { ...n.action, ...patch } as Action }); };
    const patchCond = (id: string, patch: any) => { const n = nodes().find(x => x.id === id); if (n?.condition) patchNode(id, { condition: { ...n.condition, ...patch } }); };
    /** Change a sequence's output count, pruning wires on any removed pins. */
    const setSeqCount = (id: string, count: number) => {
        const c = Math.max(2, Math.min(6, count));
        writeNodes(graph().nodes.map(n => n.id === id ? { ...n, count: c } : n));
        writeEdges(graph().edges.filter(e => !(e.from === id && e.pin.startsWith('seq') && Number(e.pin.slice(3)) >= c)));
    };

    const play = () => {
        const script = effectiveGameScript(store.elements, store.sceneBehaviors ?? [], store.gameScript, store.gameVars ?? [], store.blueprints, store.gameAuthoringMode);
        if (!script) { showToast('Add an event wired to an action first', 'info'); return; }
        toggleBlueprint(false);
        if (startGame(script)) showToast('Playing — Esc or Stop to end', 'info');
    };

    onMount(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape' || !store.showBlueprint || store.gameActive) return;
            if (menu()) { setMenu(null); return; } // close an open palette menu first
            toggleBlueprint(false);
        };
        window.addEventListener('keydown', onKey);
        onCleanup(() => window.removeEventListener('keydown', onKey));
    });

    return (
        <Show when={store.showBlueprint}>
            <Portal>
                <div class="bp-overlay">
                    <div class="bp-header">
                        <div class="bp-title"><Workflow size={16} /><h2>Blueprint</h2><GameViewSwitcher current="blueprint" /></div>
                        <div class="bp-head-actions">
                            <select class="bp-sel" title="Whose logic to edit" value={owner()} onChange={e => setOwner(e.currentTarget.value)}>
                                <For each={owners()}>{o => <option value={o}>{o === '' ? 'Scene' : o}</option>}</For>
                            </select>
                            <button class="bp-add" title="Add an event (entry point)" onClick={() => addNode('event')}><Zap size={14} /> Event</button>
                            <button class="bp-add" title="Add an action" onClick={() => addNode('action')}><Cog size={14} /> Action</button>
                            <div class="bp-dd">
                                <button class="bp-add" title="Flow control nodes" onClick={() => setMenu(m => m === 'flow' ? null : 'flow')}>
                                    <Workflow size={14} /> Flow <ChevronDown size={12} />
                                </button>
                                <Show when={menu() === 'flow'}>
                                    <div class="bp-dd-backdrop" onPointerDown={() => setMenu(null)} />
                                    <div class="bp-dd-menu">
                                        <For each={FLOW_ITEMS}>{it =>
                                            <button class="bp-dd-item" onClick={() => { addNode(it.k); setMenu(null); }}>
                                                <Dynamic component={it.icon} size={14} /> {it.label}
                                            </button>}
                                        </For>
                                    </div>
                                </Show>
                            </div>
                            <div class="bp-dd">
                                <button class="bp-add bp-add-data" title="Data (value) nodes" onClick={() => setMenu(m => m === 'data' ? null : 'data')}>
                                    <Database size={14} /> Data <ChevronDown size={12} />
                                </button>
                                <Show when={menu() === 'data'}>
                                    <div class="bp-dd-backdrop" onPointerDown={() => setMenu(null)} />
                                    <div class="bp-dd-menu">
                                        <For each={DATA_ITEMS}>{it =>
                                            <button class="bp-dd-item" onClick={() => { addNode(it.k); setMenu(null); }}>
                                                <Dynamic component={it.icon} size={14} /> {it.label}
                                            </button>}
                                        </For>
                                    </div>
                                </Show>
                            </div>
                            <button class="bp-play" onClick={play}><Play size={14} /> Play</button>
                            <button class="bp-close" onClick={() => toggleBlueprint(false)}><X size={18} /></button>
                        </div>
                    </div>

                    <div class="bp-viewport" ref={el => vpRef = el}
                        onWheel={onWheel} onPointerDown={onSurfaceDown} onPointerMove={onSurfaceMove} onPointerUp={onSurfaceUp} onPointerCancel={onSurfaceUp}>
                        <div class="bp-surface" style={{ transform: `translate(${pan().x}px, ${pan().y}px) scale(${scale()})` }}>
                            <svg class="bp-wires" width="8000" height="8000">
                                <For each={edges()}>
                                    {(e) => {
                                        const from = () => nodeById(e.from), to = () => nodeById(e.to);
                                        const isData = () => e.pin === 'val';
                                        const x1 = () => (from()?.x ?? 0) + BP_NODE_W;
                                        const y1 = () => (from()?.y ?? 0) + (isData() ? dataOutY(from()!) : (from() ? pinOutY(from()!, e.pin) : OUT_Y));
                                        const x2 = () => to()?.x ?? 0;
                                        const y2 = () => (to()?.y ?? 0) + (!to() ? IN_Y : isData() ? dataInY(to()!, e.toPin!) : execInY(to()!, e.toPin ?? 'in'));
                                        return <path d={wirePath(x1(), y1(), x2(), y2())}
                                            fill="none" stroke={isData() ? DATA_COLOR : pinColor(e.pin)} stroke-width="2.5"
                                            stroke-dasharray={isData() ? '4 4' : undefined} opacity="0.9" />;
                                    }}
                                </For>
                                <Show when={wiring()}>
                                    {w => {
                                        const a = () => posOf(w().fromId);
                                        return <path d={wirePath(a().x + BP_NODE_W, srcPinY(w().fromId, w().pin), w().cx, w().cy)}
                                            fill="none" stroke={pinColor(w().pin)} stroke-width="2.5" stroke-dasharray="6 4" opacity="0.9" />;
                                    }}
                                </Show>
                            </svg>
                            <For each={nodes()}>
                                {(n) => (
                                    <div class={`bp-node bp-${n.kind}`} data-id={n.id}
                                        style={{ left: `${n.x}px`, top: `${n.y}px`, width: `${BP_NODE_W}px`, 'min-height': n.kind === 'sequence' ? `${40 + seqCount(n) * PIN_STEP}px` : n.kind === 'gate' ? `${34 + execInputs('gate').length * PIN_STEP}px` : undefined }}>
                                        <div class="bp-node-head" onPointerDown={e => startNodeDrag(e, n.id)} onPointerMove={moveNodeDrag} onPointerUp={endNodeDrag} onPointerCancel={endNodeDrag}>
                                            <span class="bp-kind">
                                                {n.kind === 'event' ? <><Zap size={11} /> EVENT</>
                                                    : n.kind === 'branch' ? <><GitBranch size={11} /> BRANCH</>
                                                        : n.kind === 'sequence' ? <><ListOrdered size={11} /> SEQUENCE</>
                                                            : n.kind === 'delay' ? <><Timer size={11} /> DELAY</>
                                                        : n.kind === 'forLoop' ? <><Repeat size={11} /> FOR LOOP</>
                                                            : n.kind === 'gate' ? <><DoorOpen size={11} /> GATE</>
                                                                : n.kind === 'getVar' ? <><Variable size={11} /> GET</>
                                                                    : n.kind === 'literal' ? <><Hash size={11} /> VALUE</>
                                                                        : n.kind === 'compare' ? <><Scale size={11} /> COMPARE</>
                                                                            : n.kind === 'math' ? <><Sigma size={11} /> MATH</>
                                                                                : n.kind === 'random' ? <><Dices size={11} /> RANDOM</>
                                                                                    : n.kind === 'spriteProp' ? <><Move size={11} /> SPRITE</>
                                                                                        : <><Cog size={11} /> DO</>}
                                            </span>
                                            <button class="bp-del" title="Delete node" onPointerDown={e => e.stopPropagation()} onClick={() => deleteNode(n.id)}><Trash2 size={12} /></button>
                                        </div>

                                        <For each={execInputs(n.kind)}>
                                            {(port) => (<>
                                                <span class="bp-pin bp-in" data-execin={port} title={port === 'in' ? 'exec in' : port} style={{ top: `${execInY(n, port) - 6}px` }} />
                                                <Show when={execInLabel(port)}><span class="bp-pin-lbl bp-execin-lbl" style={{ top: `${execInY(n, port) - 6}px` }}>{execInLabel(port)}</span></Show>
                                            </>)}
                                        </For>

                                        <div class="bp-body">
                                            <Show when={n.kind === 'event' && n.trigger}>
                                                <div class="bp-row">
                                                    <select class="be-sel" value={n.trigger!.kind} onChange={e => setEventKind(n.id, e.currentTarget.value as Trigger['kind'])}>
                                                        <For each={eventTriggers()}>{t => <option value={t.v}>{t.label}</option>}</For>
                                                    </select>
                                                    <TriggerParams trigger={n.trigger!} sprites={sprites()} onPatch={patch => patchTrigger(n.id, patch)} />
                                                </div>
                                            </Show>
                                            <Show when={n.kind === 'action' && n.action}>
                                                <div class="bp-row">
                                                    <select class="be-sel" value={n.action!.kind} onChange={e => setActKind(n.id, e.currentTarget.value as Action['kind'])}>
                                                        <For each={actionList()}>{a => <option value={a.v}>{a.label}</option>}</For>
                                                    </select>
                                                    <ActionParams action={n.action!} sprites={sprites()} states={states()} onPatch={patch => patchAction(n.id, patch)} />
                                                </div>
                                            </Show>
                                            <Show when={n.kind === 'branch' && n.condition}>
                                                <div class="bp-row">
                                                    <span class="bp-if">if</span>
                                                    <input class="be-text" type="text" style={{ 'min-width': '64px' }} value={n.condition!.name} onInput={e => patchCond(n.id, { name: e.currentTarget.value })} />
                                                    <select class="be-sel" value={n.condition!.compare} onChange={e => patchCond(n.id, { compare: e.currentTarget.value })}>
                                                        <For each={COMPARE}>{c => <option value={c.v}>{c.label}</option>}</For>
                                                    </select>
                                                    <input class="be-num" type="number" value={n.condition!.value} onInput={e => patchCond(n.id, { value: Number(e.currentTarget.value) })} />
                                                </div>
                                            </Show>
                                            <Show when={n.kind === 'sequence'}>
                                                <div class="bp-row">
                                                    <span class="bp-seq-lbl">{seqCount(n)} steps, in order</span>
                                                    <button class="bp-step" title="Fewer outputs" onClick={() => setSeqCount(n.id, seqCount(n) - 1)}><Minus size={12} /></button>
                                                    <button class="bp-step" title="More outputs" onClick={() => setSeqCount(n.id, seqCount(n) + 1)}><Plus size={12} /></button>
                                                </div>
                                            </Show>
                                            <Show when={n.kind === 'delay'}>
                                                <div class="bp-row">
                                                    <span class="bp-if">wait</span>
                                                    <input class="be-num" type="number" step="0.1" min="0" value={n.seconds ?? 1} onInput={e => patchNode(n.id, { seconds: Number(e.currentTarget.value) })} />
                                                    <span class="be-unit">s</span>
                                                </div>
                                            </Show>
                                            <Show when={n.kind === 'getVar'}>
                                                <div class="bp-row">
                                                    <span class="bp-if">read</span>
                                                    <input class="be-text" type="text" style={{ 'min-width': '90px' }} value={n.varName ?? ''} onInput={e => patchNode(n.id, { varName: e.currentTarget.value })} />
                                                </div>
                                            </Show>
                                            <Show when={n.kind === 'literal'}>
                                                <div class="bp-row">
                                                    <span class="bp-if">value</span>
                                                    <input class="be-num" type="number" value={n.dataValue ?? 0} onInput={e => patchNode(n.id, { dataValue: Number(e.currentTarget.value) })} />
                                                </div>
                                            </Show>
                                            <Show when={n.kind === 'compare'}>
                                                <div class="bp-row">
                                                    <span class="bp-din-lbl">a</span>
                                                    <select class="be-sel" value={n.op ?? 'atLeast'} onChange={e => patchNode(n.id, { op: e.currentTarget.value as any })}>
                                                        <For each={COMPARE}>{c => <option value={c.v}>{c.label}</option>}</For>
                                                    </select>
                                                    <span class="bp-din-lbl">b</span>
                                                </div>
                                            </Show>
                                            <Show when={n.kind === 'math'}>
                                                <div class="bp-row">
                                                    <span class="bp-din-lbl">a</span>
                                                    <select class="be-sel" value={n.mathOp ?? '+'} onChange={e => patchNode(n.id, { mathOp: e.currentTarget.value as any })}>
                                                        <For each={MATH_OPS}>{o => <option value={o}>{o === '*' ? '×' : o === '/' ? '÷' : o === '-' ? '−' : o}</option>}</For>
                                                    </select>
                                                    <span class="bp-din-lbl">b</span>
                                                </div>
                                            </Show>
                                            <Show when={n.kind === 'random'}>
                                                <div class="bp-row">
                                                    <span class="bp-if">min</span>
                                                    <input class="be-num" type="number" value={n.min ?? 0} onInput={e => patchNode(n.id, { min: Number(e.currentTarget.value) })} />
                                                    <span class="bp-if">max</span>
                                                    <input class="be-num" type="number" value={n.max ?? 1} onInput={e => patchNode(n.id, { max: Number(e.currentTarget.value) })} />
                                                </div>
                                            </Show>
                                            <Show when={n.kind === 'spriteProp'}>
                                                <div class="bp-row">
                                                    <select class="be-sel" value={n.spriteTag ?? ''} onChange={e => patchNode(n.id, { spriteTag: e.currentTarget.value })}>
                                                        <option value="">(pick sprite)</option>
                                                        <For each={sprites()}>{s => <option value={s}>{s}</option>}</For>
                                                    </select>
                                                    <select class="be-sel" value={n.prop ?? 'x'} onChange={e => patchNode(n.id, { prop: e.currentTarget.value as any })}>
                                                        <For each={SPRITE_PROPS}>{p => <option value={p}>{p}</option>}</For>
                                                    </select>
                                                </div>
                                            </Show>
                                            <Show when={n.kind === 'forLoop'}>
                                                <div class="bp-row">
                                                    <span class="bp-if">repeat</span>
                                                    <input class="be-num" type="number" min="0" value={n.times ?? 3} onInput={e => patchNode(n.id, { times: Number(e.currentTarget.value) })} />
                                                    <span class="be-unit">times</span>
                                                </div>
                                            </Show>
                                            <Show when={n.kind === 'gate'}>
                                                <div class="bp-row">
                                                    <span class="bp-if">starts</span>
                                                    <select class="be-sel" value={n.startOpen ? 'open' : 'closed'} onChange={e => patchNode(n.id, { startOpen: e.currentTarget.value === 'open' })}>
                                                        <option value="closed">closed</option>
                                                        <option value="open">open</option>
                                                    </select>
                                                    <span class="bp-gate-hint">enter · open · close · toggle</span>
                                                </div>
                                            </Show>
                                        </div>

                                        <For each={pinsOf(n)}>
                                            {(pin) => (<>
                                                <span class="bp-pin bp-out" title="drag to an action / branch to wire execution"
                                                    style={{ top: `${pinOutY(n, pin) - 6}px`, background: pinColor(pin) }}
                                                    onPointerDown={e => startWire(e, n.id, pin)} />
                                                <Show when={pinLabel(pin)}><span class="bp-pin-lbl" style={{ top: `${pinOutY(n, pin) - 6}px` }}>{pinLabel(pin)}</span></Show>
                                            </>)}
                                        </For>
                                        {/* data output ('val'): data nodes + the forLoop index */}
                                        <Show when={dataOutputs(n).length > 0}>
                                            <span class="bp-pin bp-dout" title={n.kind === 'forLoop' ? 'loop index — drag onto a value input' : 'value out — drag onto a Compare / Branch / action'}
                                                style={{ top: `${dataOutY(n) - 6}px` }} onPointerDown={e => startWire(e, n.id, 'val')} />
                                            <Show when={n.kind === 'forLoop'}><span class="bp-pin-lbl" style={{ top: `${dataOutY(n) - 6}px` }}>i</span></Show>
                                        </Show>
                                        {/* data input ports (compare: a,b · branch: cond) — targets for data wires */}
                                        <For each={dataInputs(n)}>
                                            {(inp) => <span class="bp-pin bp-din" title={`data in: ${inp}`} style={{ top: `${dataInY(n, inp) - 6}px` }} />}
                                        </For>
                                    </div>
                                )}
                            </For>
                            <Show when={nodes().length === 0}>
                                <div class="bp-empty">
                                    Editing <strong>{owner() === '' ? 'Scene' : owner()}</strong> logic. Add an <strong>Event</strong>, an
                                    <strong> Action</strong>, then drag from the event's right pin to the action to wire them.
                                </div>
                            </Show>
                        </div>
                    </div>
                    <div class="bp-foot">Pick an owner (Scene or a sprite) · drag a node header to move · drag a right-edge pin onto another node to wire execution · scroll to zoom · Esc closes</div>
                </div>
            </Portal>
        </Show>
    );
};

export default BlueprintGraph;
