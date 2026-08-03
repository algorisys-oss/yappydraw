import { Show, For, createSignal, createMemo, onMount, onCleanup } from 'solid-js';
import { store, setStore, toggleNodeTool, pushToHistory, isLayerVisible, isLayerLocked } from '../store/app-store';
import { hitTestElement } from '../utils/hit-testing';
import type { DrawingElement } from '../types';
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
    /** This band picks SHAPES, not anchors — set when there was nothing to node-edit. */
    let marqueePicksElements = false;
    /** A click (not a drag) on empty space with no anchors selected clears the object. */
    let emptyPressDeselects = false;

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

    /**
     * Topmost interactable element under a window point, or null. Mirrors the canvas's own
     * narrow-phase: reverse z-order, skipping locked elements and hidden/locked layers so
     * the Node tool can't reach what the Selection tool wouldn't.
     */
    const elementAt = (sx: number, sy: number): DrawingElement | null => {
        const w = windowToWorld(sx, sy);
        const threshold = 8 / store.viewState.scale;
        const map = new Map(store.elements.map(el => [el.id, el]));
        for (let i = store.elements.length - 1; i >= 0; i--) {
            const el = store.elements[i];
            if (el.locked || !isLayerVisible(el.layerId) || isLayerLocked(el.layerId)) continue;
            if (hitTestElement(el, w.x, w.y, threshold, store.elements, map)) return el;
        }
        return null;
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

        // Clicked a DIFFERENT shape: make it the one being edited, without leaving the
        // tool. Every branch here stopPropagation()s, so the canvas never saw the click —
        // switching shapes meant exiting the Node tool, selecting, and re-entering. This
        // is Inkscape's `NodeTool::select_point`: an item under the cursor is selected
        // (Shift toggles it in, so several paths can be node-edited at once).
        const el = elementAt(e.clientX, e.clientY);
        if (el && !(store.selection.length === 1 && store.selection[0] === el.id)) {
            e.preventDefault();
            e.stopPropagation();
            if (e.shiftKey) {
                // Add to the edit set; anchors already picked on other paths survive.
                if (!store.selection.includes(el.id)) setStore('selection', [...store.selection, el.id]);
            } else if (!store.selection.includes(el.id)) {
                clearNodeSelection();
                setStore('selection', [el.id]);
            }
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        // Empty space (or the shape already being edited): rubber-band. What the band
        // catches depends on whether there is anything to node-edit — Inkscape's
        // `select_area` makes the same split on `_multipath->empty()`. With no anchors on
        // screen a drag can only sensibly mean "pick a shape".
        marqueeAdditive = e.shiftKey;
        marqueePicksElements = nodes().length === 0;
        // Two-stage deselect, again from Inkscape: the first click on empty space drops
        // the node selection, and only a second one drops the object. Missing an anchor
        // by a few px shouldn't cost you the path you were working on.
        emptyPressDeselects = !el && !marqueeAdditive && store.nodeSelection.length === 0;
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
            // A drag is not a click — whatever happens now, don't also deselect on release.
            if (Math.abs(next.x1 - next.x0) > 2 || Math.abs(next.y1 - next.y0) > 2) {
                emptyPressDeselects = false;
            }
            const lo = { x: Math.min(next.x0, next.x1), y: Math.min(next.y0, next.y1) };
            const hi = { x: Math.max(next.x0, next.x1), y: Math.max(next.y0, next.y1) };

            // Nothing to node-edit → the band picks shapes instead (Inkscape's split).
            if (marqueePicksElements) {
                const a = windowToWorld(lo.x, lo.y), b = windowToWorld(hi.x, hi.y);
                const ids = store.elements.filter(el => {
                    if (el.locked || !isLayerVisible(el.layerId) || isLayerLocked(el.layerId)) return false;
                    const ex1 = Math.min(el.x, el.x + el.width), ex2 = Math.max(el.x, el.x + el.width);
                    const ey1 = Math.min(el.y, el.y + el.height), ey2 = Math.max(el.y, el.y + el.height);
                    return a.x < ex2 && b.x > ex1 && a.y < ey2 && b.y > ey1;
                }).map(el => el.id);
                setStore('selection', ids);
                return;
            }

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

    const onUp = () => {
        // Second stage of the empty-space deselect: this press hit nothing, had no anchors
        // to drop, and never became a drag — so it means "let go of the path too".
        if (emptyPressDeselects && store.selection.length > 0) setStore('selection', []);
        emptyPressDeselects = false;
        marqueePicksElements = false;
        drag = null; handleDrag = null; setMarquee(null);
    };

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
