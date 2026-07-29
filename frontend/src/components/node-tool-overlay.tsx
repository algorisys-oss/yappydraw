import { Show, For, createSignal, createMemo, onMount, onCleanup } from 'solid-js';
import {
    store, toggleNodeTool, pushToHistory, convertToPath,
} from '../store/app-store';
import {
    selectedPathNodes, setNodeSelection, toggleNodeInSelection, clearNodeSelection,
    isNodeSelected, moveSelectedNodes, setSelectedNodesKind, deleteSelectedNodes,
    allNodesOfSelection, type NodeRef,
} from '../utils/node-editing';
import { insertPathAnchorAt } from '../utils/tool-handlers/selection-handler';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import './node-tool-overlay.css';

/**
 * Node tool — the mode that makes path editing visible.
 *
 * Everything here already existed as behaviour: anchors could be dragged, converted
 * (Alt-click), inserted (Alt-click a segment) and deleted (Ctrl-click) under the
 * Selection tool. None of it was discoverable, and all of it worked on exactly one
 * anchor. This shows every anchor, lets you select several — click, Shift-click, or
 * rubber-band — and applies the operations to the whole set from a visible toolbar.
 *
 * Selecting a non-path shape converts it to a path on entry, so "make this rectangle
 * curvy" is one click rather than a menu hunt.
 */
export const NodeToolOverlay = () => {
    const [marquee, setMarquee] = createSignal<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
    const [hover, setHover] = createSignal<NodeRef | null>(null);
    // Drag state lives outside the signal graph: it changes every pointermove.
    let drag: { last: { x: number; y: number } } | null = null;
    let marqueeAdditive = false;

    const active = () => store.nodeToolActive;
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);
    const toScreen = (x: number, y: number) => worldToScreen(x, y, store.viewState as any);

    /** Anchors of every selected path, in world space. Recomputed as geometry changes. */
    const nodes = createMemo(() => {
        store.dirtyRevision; // re-read after any edit
        return active() ? selectedPathNodes() : [];
    });

    const HIT = 9; // screen px

    const nodeAt = (sx: number, sy: number): NodeRef | null => {
        let best: { ref: NodeRef; d: number } | null = null;
        for (const n of nodes()) {
            const p = toScreen(n.x, n.y);
            const d = Math.hypot(p.x - sx, p.y - sy);
            if (d <= HIT && (!best || d < best.d)) best = { ref: n.ref, d };
        }
        return best?.ref ?? null;
    };

    const onDown = (e: PointerEvent) => {
        if (!active() || e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest('.node-tool-bar')) return; // let the buttons handle themselves

        const hit = nodeAt(e.clientX, e.clientY);
        if (hit) {
            e.preventDefault();
            e.stopPropagation();
            if (e.shiftKey) {
                toggleNodeInSelection(hit);
            } else if (!isNodeSelected(hit)) {
                setNodeSelection([hit]);
            }
            // Push once here so a whole drag collapses into one undo step.
            pushToHistory();
            drag = { last: toWorld(e) };
            return;
        }

        // Alt-click on a segment inserts an anchor there (the pre-existing binding,
        // kept because it is the natural gesture and now has visible feedback).
        if (e.altKey && store.selection.length === 1) {
            const w = toWorld(e);
            if (insertPathAnchorAt(store.selection[0], w.x, w.y, store.viewState.scale)) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
        }

        // Empty space: rubber-band over anchors.
        e.preventDefault();
        e.stopPropagation();
        marqueeAdditive = e.shiftKey;
        if (!marqueeAdditive) clearNodeSelection();
        setMarquee({ x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY });
    };

    const onMove = (e: PointerEvent) => {
        if (!active()) return;

        if (drag) {
            const w = toWorld(e);
            moveSelectedNodes(w.x - drag.last.x, w.y - drag.last.y, false);
            drag.last = w;
            return;
        }

        const m = marquee();
        if (m) {
            const next = { ...m, x1: e.clientX, y1: e.clientY };
            setMarquee(next);
            const lo = { x: Math.min(next.x0, next.x1), y: Math.min(next.y0, next.y1) };
            const hi = { x: Math.max(next.x0, next.x1), y: Math.max(next.y0, next.y1) };
            const inside = nodes().filter(n => {
                const p = toScreen(n.x, n.y);
                return p.x >= lo.x && p.x <= hi.x && p.y >= lo.y && p.y <= hi.y;
            }).map(n => n.ref);
            // Additive marquee keeps whatever was already picked.
            setNodeSelection(marqueeAdditive
                ? [...store.nodeSelection.filter(s => !inside.some(i => i.id === s.id && i.sub === s.sub && i.i === s.i)), ...inside]
                : inside);
            return;
        }

        setHover(nodeAt(e.clientX, e.clientY));
    };

    const onUp = () => { drag = null; setMarquee(null); };

    onMount(() => {
        window.addEventListener('pointerdown', onDown, true); // capture: beat the canvas
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        const onKey = (e: KeyboardEvent) => {
            if (!store.nodeToolActive) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                // Esc clears a node selection first, and only then leaves the mode.
                if (store.nodeSelection.length > 0) clearNodeSelection();
                else toggleNodeTool(false);
            } else if ((e.key === 'Delete' || e.key === 'Backspace') && store.nodeSelection.length > 0) {
                e.preventDefault();
                e.stopPropagation(); // don't let the canvas delete the whole element
                deleteSelectedNodes();
            } else if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
                e.preventDefault();
                setNodeSelection(allNodesOfSelection());
            }
        };
        window.addEventListener('keydown', onKey, true);
        onCleanup(() => {
            window.removeEventListener('pointerdown', onDown, true);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
            window.removeEventListener('keydown', onKey, true);
        });
    });

    /** Non-path shapes in the selection, offered a one-click conversion. */
    const convertible = createMemo(() => {
        store.dirtyRevision;
        return store.selection.filter(id => store.elements.find(e => e.id === id)?.type !== 'path');
    });

    const count = () => store.nodeSelection.length;

    return (
        <Show when={active()}>
            {/* Anchors */}
            <svg class="node-tool-layer" width="100%" height="100%">
                <For each={nodes()}>{(n) => {
                    const p = () => toScreen(n.x, n.y);
                    const sel = () => isNodeSelected(n.ref);
                    const hot = () => {
                        const h = hover();
                        return !!h && h.id === n.ref.id && h.sub === n.ref.sub && h.i === n.ref.i;
                    };
                    return n.kind === 'smooth'
                        ? <circle cx={p().x} cy={p().y} r={sel() ? 6 : 5}
                            class="node-dot" classList={{ selected: sel(), hover: hot() }} />
                        : <rect x={p().x - (sel() ? 5.5 : 4.5)} y={p().y - (sel() ? 5.5 : 4.5)}
                            width={sel() ? 11 : 9} height={sel() ? 11 : 9}
                            class="node-dot" classList={{ selected: sel(), hover: hot() }} />;
                }}</For>
            </svg>

            {/* Rubber band */}
            <Show when={marquee()}>{(m) => (
                <div class="node-marquee" style={{
                    left: `${Math.min(m().x0, m().x1)}px`,
                    top: `${Math.min(m().y0, m().y1)}px`,
                    width: `${Math.abs(m().x1 - m().x0)}px`,
                    height: `${Math.abs(m().y1 - m().y0)}px`,
                }} />
            )}</Show>

            {/* Operations — the whole point of the mode: these were invisible before. */}
            <div class="node-tool-bar">
                <span class="node-tool-title">Nodes</span>

                <Show when={convertible().length > 0}>
                    <button onClick={() => convertToPath([...convertible()])}
                        title="Convert the selected shape(s) to an editable path">
                        Convert to Path
                    </button>
                    <span class="node-tool-sep" />
                </Show>

                <span class="node-tool-count">{count()} selected</span>
                <button disabled={store.selection.length === 0}
                    onClick={() => setNodeSelection(allNodesOfSelection())}
                    title="Select every node (Ctrl+A)">All</button>
                <button disabled={count() === 0} onClick={() => clearNodeSelection()}
                    title="Deselect nodes (Esc)">None</button>

                <span class="node-tool-sep" />
                <button disabled={count() === 0} onClick={() => setSelectedNodesKind('corner')}
                    title="Make the selected nodes corners">Corner</button>
                <button disabled={count() === 0} onClick={() => setSelectedNodesKind('smooth')}
                    title="Make the selected nodes smooth">Smooth</button>
                <button disabled={count() === 0} onClick={() => deleteSelectedNodes()}
                    title="Delete the selected nodes (Del)">Delete</button>

                <span class="node-tool-sep" />
                <span class="node-tool-hint">Alt-click a segment to add a node · drag to bend</span>
                <button class="node-tool-close" onClick={() => toggleNodeTool(false)} title="Exit (Esc)">✕</button>
            </div>
        </Show>
    );
};
