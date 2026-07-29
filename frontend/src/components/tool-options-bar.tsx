import { Show, For, type Component } from 'solid-js';
import {
    store, setSymmetryMode, toggleSymmetryEditing, updateGlobalSettings,
    toggleNodeTool, convertToPath,
} from '../store/app-store';
import {
    setNodeSelection, clearNodeSelection, setSelectedNodesKind,
    deleteSelectedNodes, allNodesOfSelection,
} from '../utils/node-editing';
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
] as const;

export const ToolOptionsBar: Component = () => {
    const nodeCount = () => store.nodeSelection.length;
    const convertible = () => store.selection.filter(
        id => store.elements.find(e => e.id === id)?.type !== 'path');
    const isFreehand = () => FREEHAND.includes(store.selectedTool);

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
                <span class="tob-hint">Alt-click a segment to add a node · drag a handle to bend (Alt = cusp)</span>
                <button class="tob-close" onClick={() => toggleNodeTool(false)} title="Exit (Esc)">✕</button>
            </Show>

            {/* ── Drawing tools ─────────────────────────────────────────── */}
            <Show when={!store.nodeToolActive && isFreehand()}>
                <span class="tob-title">Brush</span>
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
