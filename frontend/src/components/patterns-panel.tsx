import { type Component, For, Show, createSignal, onMount, createEffect } from 'solid-js';
import {
    store, addPatternSwatchFromSelection, applyPatternSwatch,
    updatePatternSwatch, renamePatternSwatch, deletePatternSwatch,
} from '../store/app-store';
import { renderElement } from '../utils/render-element';
import rough from 'roughjs';
import type { PatternSwatch, DrawingElement } from '../types';
import { Plus, Trash2, RefreshCw, Grid2x2 } from 'lucide-solid';
import './patterns-panel.css';

const THUMB = 52;

/** A swatch preview. Custom patterns show their captured tile directly (the tile
 *  decodes async, so an <img> sidesteps canvas redraw timing); built-in motifs
 *  render a sample rect through the normal pipeline (synchronous). */
const PatternThumb: Component<{ sw: PatternSwatch }> = (props) => {
    const isCustom = () => props.sw.fill.type === 'custom';
    let canvasRef: HTMLCanvasElement | undefined;
    const draw = () => {
        if (!canvasRef) return;
        const dpr = window.devicePixelRatio || 1;
        canvasRef.width = THUMB * dpr; canvasRef.height = THUMB * dpr;
        const ctx = canvasRef.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, THUMB, THUMB);
        const sample: DrawingElement = {
            ...store.defaultElementStyles,
            id: 'pat-thumb', type: 'rectangle',
            x: 2, y: 2, width: THUMB - 4, height: THUMB - 4,
            angle: 0, seed: 2, roundness: null,
            strokeColor: '#999999', backgroundColor: '#ffffff',
            fillStyle: 'pattern', patternFill: { ...props.sw.fill },
        } as DrawingElement;
        try {
            const rc = rough.canvas(canvasRef);
            renderElement(rc, ctx, sample, store.theme !== 'light', 1);
        } catch { /* a malformed swatch shouldn't blank the panel */ }
    };
    onMount(() => { if (!isCustom()) draw(); });
    createEffect(() => { props.sw.fill; store.theme; if (!isCustom()) draw(); });
    return (
        <Show when={isCustom()} fallback={<canvas ref={canvasRef} style={{ width: `${THUMB}px`, height: `${THUMB}px` }} />}>
            <img src={props.sw.fill.tile} alt={props.sw.name} />
        </Show>
    );
};

const PatternsPanel: Component = () => {
    const [editingId, setEditingId] = createSignal<string | null>(null);
    const [editingName, setEditingName] = createSignal('');

    const startRename = (sw: PatternSwatch) => { setEditingId(sw.id); setEditingName(sw.name); };
    const commitRename = (id: string) => { renamePatternSwatch(id, editingName()); setEditingId(null); setEditingName(''); };

    return (
        <div class="patterns-panel-body">
            <div class="pat-toolbar">
                <button class="pat-icon-btn" title="Capture selection as a pattern" disabled={store.selection.length === 0} onClick={() => addPatternSwatchFromSelection()}><Plus size={15} /> Capture</button>
            </div>
            <Show when={store.patterns.length > 0} fallback={
                <div class="pat-empty">No patterns yet.<br />Select artwork and click <Plus size={12} /> to capture it as a tile, or save a shape's pattern from the Properties panel.</div>
            }>
                <div class="pat-grid">
                    <For each={store.patterns}>
                        {(sw) => (
                            <div class="pat-card">
                                <div class="pat-thumb" title="Apply to selection" onClick={() => applyPatternSwatch(sw.id)}>
                                    <PatternThumb sw={sw} />
                                </div>
                                <Show when={editingId() === sw.id} fallback={
                                    <div class="pat-name" title={sw.name} onDblClick={() => startRename(sw)}>{sw.name}</div>
                                }>
                                    <input class="pat-name-input" value={editingName()} autofocus
                                        onInput={(e) => setEditingName(e.currentTarget.value)}
                                        onBlur={() => commitRename(sw.id)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') commitRename(sw.id); else if (e.key === 'Escape') { setEditingId(null); setEditingName(''); } }}
                                    />
                                </Show>
                                <div class="pat-actions">
                                    <button class="pat-act" title="Apply to selection" onClick={() => applyPatternSwatch(sw.id)}><Grid2x2 size={13} /></button>
                                    <button class="pat-act" title="Redefine from selected shape's pattern" disabled={store.selection.length === 0} onClick={() => updatePatternSwatch(sw.id)}><RefreshCw size={13} /></button>
                                    <button class="pat-act pat-danger" title="Delete pattern" onClick={() => deletePatternSwatch(sw.id)}><Trash2 size={13} /></button>
                                </div>
                            </div>
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
};

export default PatternsPanel;
