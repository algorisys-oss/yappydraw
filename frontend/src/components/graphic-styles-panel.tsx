import { type Component, For, Show, createSignal, onMount, createEffect } from 'solid-js';
import {
    store, toggleGraphicStylesPanel, createGraphicStyle, applyGraphicStyle,
    updateGraphicStyle, renameGraphicStyle, deleteGraphicStyle,
} from '../store/app-store';
import { renderElement } from '../utils/render-element';
import rough from 'roughjs';
import type { GraphicStyle, DrawingElement } from '../types';
import { Plus, Trash2, RefreshCw, Palette, X } from 'lucide-solid';
import './graphic-styles-panel.css';

const THUMB = 52;

/** A canvas swatch showing a sample rounded rect painted with the style. */
const StyleThumb: Component<{ gs: GraphicStyle }> = (props) => {
    let canvasRef: HTMLCanvasElement | undefined;
    const draw = () => {
        if (!canvasRef) return;
        const dpr = window.devicePixelRatio || 1;
        canvasRef.width = THUMB * dpr; canvasRef.height = THUMB * dpr;
        const ctx = canvasRef.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, THUMB, THUMB);
        // Build a sample element with the saved style applied.
        const sample: DrawingElement = {
            ...store.defaultElementStyles,
            id: 'gstyle-thumb', type: 'rectangle',
            x: 6, y: 10, width: THUMB - 12, height: THUMB - 20,
            angle: 0, seed: 2, roundness: { type: 3 } as any,
            ...(props.gs.style as any),
        } as DrawingElement;
        try {
            const rc = rough.canvas(canvasRef);
            renderElement(rc, ctx, sample, store.theme !== 'light', 1);
        } catch { /* a malformed style shouldn't blank the panel */ }
    };
    onMount(draw);
    createEffect(() => { props.gs.style; store.theme; draw(); });
    return <canvas ref={canvasRef} style={{ width: `${THUMB}px`, height: `${THUMB}px` }} />;
};

const GraphicStylesPanel: Component = () => {
    const [editingId, setEditingId] = createSignal<string | null>(null);
    const [editingName, setEditingName] = createSignal('');

    const startRename = (gs: GraphicStyle) => { setEditingId(gs.id); setEditingName(gs.name); };
    const commitRename = (id: string) => { renameGraphicStyle(id, editingName()); setEditingId(null); setEditingName(''); };

    return (
        <Show when={store.showGraphicStylesPanel}>
            <div class="gstyles-panel">
                <div class="gstyles-panel-header">
                    <div class="gs-title"><Palette size={15} /><h3>Graphic Styles</h3></div>
                    <div class="gs-header-actions">
                        <button class="gs-icon-btn" title="Save selection's style" disabled={store.selection.length === 0} onClick={() => createGraphicStyle()}><Plus size={15} /></button>
                        <button class="gs-icon-btn" title="Close" onClick={() => toggleGraphicStylesPanel(false)}><X size={15} /></button>
                    </div>
                </div>
                <div class="gstyles-panel-body">
                    <Show when={store.graphicStyles.length > 0} fallback={
                        <div class="gs-empty">No styles yet.<br />Select an object and click <Plus size={12} /> to save its look.</div>
                    }>
                        <div class="gs-grid">
                            <For each={store.graphicStyles}>
                                {(gs) => (
                                    <div class="gs-card">
                                        <div class="gs-thumb" title="Apply to selection" onClick={() => applyGraphicStyle(gs.id)}>
                                            <StyleThumb gs={gs} />
                                        </div>
                                        <Show when={editingId() === gs.id} fallback={
                                            <div class="gs-name" title={gs.name} onDblClick={() => startRename(gs)}>{gs.name}</div>
                                        }>
                                            <input class="gs-name-input" value={editingName()} autofocus
                                                onInput={(e) => setEditingName(e.currentTarget.value)}
                                                onBlur={() => commitRename(gs.id)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') commitRename(gs.id); else if (e.key === 'Escape') { setEditingId(null); setEditingName(''); } }}
                                            />
                                        </Show>
                                        <div class="gs-actions">
                                            <button class="gs-act" title="Apply to selection" onClick={() => applyGraphicStyle(gs.id)}><Palette size={13} /></button>
                                            <button class="gs-act" title="Redefine from selection" disabled={store.selection.length === 0} onClick={() => updateGraphicStyle(gs.id)}><RefreshCw size={13} /></button>
                                            <button class="gs-act gs-danger" title="Delete style" onClick={() => deleteGraphicStyle(gs.id)}><Trash2 size={13} /></button>
                                        </div>
                                    </div>
                                )}
                            </For>
                        </div>
                    </Show>
                </div>
            </div>
        </Show>
    );
};

export default GraphicStylesPanel;
