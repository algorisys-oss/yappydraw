import { Show, For, createSignal, createMemo, onMount, onCleanup } from 'solid-js';
import { store, toggleNodeTool, pushToHistory } from '../store/app-store';
import {
    selectedPathNodes, setNodeSelection, toggleNodeInSelection, clearNodeSelection,
    isNodeSelected, moveSelectedNodes, deleteSelectedNodes,
    allNodesOfSelection, selectedNodeHandles, moveNodeHandle,
    type NodeRef, type HandleRef,
} from '../utils/node-editing';
import { insertPathAnchorAt } from '../utils/tool-handlers/selection-handler';
import { worldToWindow, windowToWorld } from '../utils/overlay-transform';
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
    // Dragging a Bézier handle is its own gesture: it reshapes ONE anchor's curvature
    // rather than moving the selection.
    let handleDrag: { h: HandleRef; mirror: boolean } | null = null;
    let marqueeAdditive = false;

    const active = () => store.nodeToolActive;
    // World ⇄ WINDOW, not world ⇄ canvas-local. `.node-tool-layer` is `position: fixed;
    // inset: 0`, so it is in window space, but these used viewport-transforms directly —
    // which speaks canvas-local px. Every anchor was therefore drawn (--dock-left,
    // --dock-top) away from the path it belonged to: 46px left and 52px up in the default
    // layout, a whole square's width at low zoom. Worse, `nodeAt()` compares clientX/Y
    // against these, so the hit targets were displaced by the same amount — you had to
    // click 46px right of an anchor to grab it, which is what made the tool feel broken.
    //
    // Same bug the rulers, symmetry axes and artboard frames had in 0.8.163, and the same
    // cure: overlay-transform owns the origin. It also supplies the rotation centre, which
    // the old `store.viewState as any` cast silently left at 0 — so a rotated view was
    // wrong too, about the top-left corner instead of the canvas centre.
    const toWorld = (e: PointerEvent) => windowToWorld(e.clientX, e.clientY);
    const toScreen = (x: number, y: number) => worldToWindow(x, y);

    /** Anchors of every selected path, in world space. Recomputed as geometry changes. */
    const nodes = createMemo(() => {
        store.dirtyRevision; // re-read after any edit
        return active() ? selectedPathNodes() : [];
    });

    const HIT = 9; // screen px

    /** Handles of the selected anchors, world space. Drawn and hit-tested above nodes. */
    const handles = createMemo(() => {
        store.dirtyRevision;
        return active() ? selectedNodeHandles() : [];
    });

    const handleAt = (sx: number, sy: number): HandleRef | null => {
        let best: { h: HandleRef; d: number } | null = null;
        for (const hd of handles()) {
            const p = toScreen(hd.x, hd.y);
            const d = Math.hypot(p.x - sx, p.y - sy);
            if (d <= HIT && (!best || d < best.d)) best = { h: hd.h, d };
        }
        return best?.h ?? null;
    };

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
        if (target.closest('.tool-options-bar')) return; // let the buttons handle themselves

        // Handles sit on top of anchors — they're what you reach for to bend a curve,
        // and they're often right next to their own anchor.
        const hHit = handleAt(e.clientX, e.clientY);
        if (hHit) {
            e.preventDefault();
            e.stopPropagation();
            pushToHistory();
            // Alt breaks the mirror, so a smooth node can be given a cusp.
            handleDrag = { h: hHit, mirror: !e.altKey };
            return;
        }

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

        if (handleDrag) {
            const w = toWorld(e);
            moveNodeHandle(handleDrag.h, w.x, w.y, handleDrag.mirror, false);
            return;
        }

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

    const onUp = () => { drag = null; handleDrag = null; setMarquee(null); };

    onMount(() => {
        window.addEventListener('pointerdown', onDown, true); // capture: beat the canvas
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        const onKey = (e: KeyboardEvent) => {
            if (!store.nodeToolActive) return;
            // Same exemption the global hotkey handler uses: focus inside a field, a
            // font picker or any dialog means the keys belong to that widget. This is a
            // CAPTURE-phase listener, so without the check it would steal Ctrl+A and
            // Backspace from every text input on the page while the mode is on.
            const t = e.target as HTMLElement | null;
            if (t && (
                t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' ||
                t.isContentEditable ||
                !!t.closest?.('.fp-trigger, .fp-popup, .gf-modal, [role="dialog"]')
            )) return;

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
                // Ctrl+A means "all NODES of the selected path" here, as it does in
                // Inkscape's node tool. With no path selected there are no nodes to
                // take, so fall through and let it select all elements as usual.
                const all = allNodesOfSelection();
                if (all.length === 0) return;
                e.preventDefault();
                e.stopPropagation();
                setNodeSelection(all);
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

                {/* Bézier handles of the selected anchors — leader line + grip. */}
                <For each={handles()}>{(hd) => {
                    const a = () => toScreen(hd.ax, hd.ay);
                    const p = () => toScreen(hd.x, hd.y);
                    return (
                        <>
                            <line x1={a().x} y1={a().y} x2={p().x} y2={p().y} class="node-handle-line" />
                            <rect x={p().x - 3.5} y={p().y - 3.5} width="7" height="7" class="node-handle" />
                        </>
                    );
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

            {/* The operations live in the shell's contextual tool-options bar
                (components/tool-options-bar.tsx) rather than in another floating
                panel — that bar is what the docking work was for. */}
        </Show>
    );
};
