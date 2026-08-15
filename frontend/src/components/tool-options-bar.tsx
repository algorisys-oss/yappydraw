import { Show, For, createSignal, createMemo, createEffect, type Component } from 'solid-js';
import {
    store, setSymmetryMode, toggleSymmetryEditing, updateGlobalSettings,
    toggleNodeTool, convertToPath, updateDefaultStyles,
} from '../store/app-store';
import {
    setNodeSelection, clearNodeSelection, setSelectedNodesKind,
    deleteSelectedNodes, allNodesOfSelection,
} from '../utils/node-editing';
import { getElementFamily, getToolDefaultProperties } from '../config/quick-toolbar-config';
import { QuickControl } from './quick-controls';
import './tool-options-bar.css';

/**
 * Contextual tool options — the middle of the shell's top bar.
 *
 * The reason the docking work was worth doing. Yappy has far more capability than it has
 * visible surface: node editing lived on Alt-click for months, symmetry and fill mode
 * ended up in the footer for want of anywhere better. A bar that changes with the active
 * tool is where those belong, and it is what Illustrator, Inkscape and Krita all do.
 *
 * Each section owns its `when`; nothing renders for a tool with no options, so the bar
 * stays empty rather than filling with placeholders.
 */

const FREEHAND = ['fineliner', 'inkbrush', 'marker'];

const SYMMETRY_MODES = [
    { id: 'off', label: 'Off', title: 'No symmetry' },
    { id: 'vertical', label: '⇼', title: 'Mirror left ↔ right' },
    { id: 'horizontal', label: '⇵', title: 'Mirror up ↕ down' },
    { id: 'both', label: '✛', title: '4-way quadrant' },
    { id: 'radial', label: '✳', title: 'Radial mandala' },
    { id: 'kaleidoscope', label: '❋', title: 'Kaleidoscope — mandala with each wedge mirrored' },
] as const;

/** What to call the active tool's option group. */
const FAMILY_TITLE: Record<string, string> = {
    shape: 'Shape', connector: 'Line', text: 'Text', drawing: 'Brush',
};

export const ToolOptionsBar: Component = () => {
    const nodeCount = () => store.nodeSelection.length;
    const convertible = () => store.selection.filter(
        id => store.elements.find(e => e.id === id)?.type !== 'path');
    const isFreehand = () => FREEHAND.includes(store.selectedTool);

    // Which popover (if any) is open. Keyed by property, like the quick toolbar.
    const [openKey, setOpenKey] = createSignal<string | null>(null);

    /**
     * The active tool's defaults — what the NEXT element drawn will inherit, since
     * `draw-handler` spreads `defaultElementStyles` into every new element. Nothing here
     * touches the current selection: picking a drawing tool clears it (`setSelectedTool`),
     * so there is never one to act on, and editing a selection is the property panel's and
     * the floating quick toolbar's job.
     */
    const family = () => getElementFamily(store.selectedTool as any);
    const toolProps = createMemo(() => getToolDefaultProperties(store.selectedTool as any));
    const showToolProps = () => !store.nodeToolActive && toolProps().length > 0;

    // A popover left open across a tool change would be editing a property the new tool
    // may not even show.
    createEffect(() => { store.selectedTool; setOpenKey(null); });

    return (
        <div class="tool-options-bar">
            {/* ── Node tool ─────────────────────────────────────────────── */}
            <Show when={store.nodeToolActive}>
                <span class="tob-title">Nodes</span>

                <Show when={convertible().length > 0}>
                    <button onClick={() => convertToPath([...convertible()])}
                        title="Convert the selected shape(s) to an editable path">Convert to Path</button>
                    <span class="tob-sep" />
                </Show>

                <span class="tob-count">{nodeCount()} selected</span>
                <button disabled={store.selection.length === 0}
                    onClick={() => setNodeSelection(allNodesOfSelection())}
                    title="Select every node (Ctrl+A)">All</button>
                <button disabled={nodeCount() === 0} onClick={() => clearNodeSelection()}
                    title="Deselect nodes (Esc)">None</button>

                <span class="tob-sep" />
                <button disabled={nodeCount() === 0} onClick={() => setSelectedNodesKind('corner')}
                    title="Make the selected nodes corners">Corner</button>
                <button disabled={nodeCount() === 0} onClick={() => setSelectedNodesKind('smooth')}
                    title="Make the selected nodes smooth">Smooth</button>
                <button disabled={nodeCount() === 0} onClick={() => deleteSelectedNodes()}
                    title="Delete the selected nodes (Del)">Delete</button>

                <span class="tob-sep" />
                {/* The hint has to describe the state you are actually in. It used to always
                    read "Alt-click a segment to add a node", which is nonsense when the
                    selection is a rectangle: rectangles carry no anchors, so the overlay draws
                    nothing and the tool looks broken. Only a `path` has nodes — say so, and
                    point at the Convert to Path button sitting right there. */}
                <span class="tob-hint">
                    {store.selection.length === 0
                        ? 'Select a shape to edit — only paths carry anchors'
                        : convertible().length === store.selection.length
                            ? 'No anchors: this is not an editable path yet — press Convert to Path'
                            : 'Alt-click a segment to add a node · drag a handle to bend (Alt = cusp)'}
                </span>
                <button class="tob-close" onClick={() => toggleNodeTool(false)} title="Exit (Esc)">✕</button>
            </Show>

            {/* ── The active tool's defaults ────────────────────────────── */}
            <Show when={showToolProps()}>
                <span class="tob-title">{FAMILY_TITLE[family()!] ?? 'Tool'}</span>
                {/* Wrapper, not bare children: `.tool-options-bar > button` styles the bar's
                    own indigo pill buttons, and these are the shared quick controls with
                    their own look. Nesting them keeps the two vocabularies apart. */}
                <div class="tob-controls">
                    <For each={toolProps()}>{(def) => (
                        <QuickControl
                            def={def}
                            float
                            value={() => (store.defaultElementStyles as any)[def.key]}
                            fontFamily={() => store.defaultElementStyles.fontFamily}
                            openKey={openKey}
                            setOpenKey={setOpenKey}
                            onCommit={(key, val) => updateDefaultStyles({ [key]: val } as any)}
                        />
                    )}</For>
                </div>
            </Show>

            {/* ── Freehand extras ───────────────────────────────────────── */}
            <Show when={!store.nodeToolActive && isFreehand()}>
                <span class="tob-sep" />
                <button
                    classList={{ 'is-on': !!store.globalSettings.fillShapeMode }}
                    onClick={() => updateGlobalSettings({ fillShapeMode: !store.globalSettings.fillShapeMode })}
                    title="Fill mode — strokes commit as a filled silhouette"
                >Fill</button>

                <span class="tob-sep" />
                <span class="tob-label">Symmetry</span>
                <For each={SYMMETRY_MODES}>{(m) => (
                    <button
                        classList={{ 'is-on': store.symmetry.mode === m.id }}
                        title={m.title}
                        onClick={() => setSymmetryMode(m.id as any)}
                    >{m.label}</button>
                )}</For>
                <Show when={store.symmetry.mode !== 'off'}>
                    <button
                        classList={{ 'is-on': store.symmetry.editing }}
                        onClick={() => toggleSymmetryEditing()}
                        title="Move the symmetry axis (Alt+Shift+Y)"
                    >Move axis</button>
                </Show>
            </Show>
        </div>
    );
};
