import { type Component, For, Show, createSignal } from 'solid-js';
import {
    store, toggleSwatchesPanel, createSwatch, applySwatch, updateSwatchColor,
    renameSwatch, deleteSwatch,
} from '../store/app-store';
import type { Swatch } from '../types';
import { Plus, X, Trash2, Square } from 'lucide-solid';
import { draggablePanel } from '../utils/draggable-panel';
import './swatches-panel.css';

/** Document-level colour swatches with live links. Click a chip to fill the
 *  selection; the colour input recolours the swatch (and every linked object). */
const SwatchesPanel: Component = () => {
    const [editingId, setEditingId] = createSignal<string | null>(null);
    const [editingName, setEditingName] = createSignal('');
    const startRename = (s: Swatch) => { setEditingId(s.id); setEditingName(s.name); };
    const commitRename = (id: string) => { renameSwatch(id, editingName()); setEditingId(null); setEditingName(''); };

    return (
        <Show when={store.showSwatchesPanel}>
            <div class="swatches-panel" ref={draggablePanel('.swatches-panel-header')}>
                <div class="swatches-panel-header">
                    <div class="sw-title"><Square size={14} /><h3>Swatches</h3></div>
                    <div class="sw-header-actions">
                        <button class="sw-icon-btn" title="Add swatch (from selection's fill)" onClick={() => createSwatch()}><Plus size={15} /></button>
                        <button class="sw-icon-btn" title="Close" onClick={() => toggleSwatchesPanel(false)}><X size={15} /></button>
                    </div>
                </div>
                <div class="swatches-panel-body">
                    <Show when={store.swatches.length > 0} fallback={
                        <div class="sw-empty">No swatches yet.<br />Click <Plus size={12} /> to add one. Editing a swatch recolours every object linked to it.</div>
                    }>
                        <div class="sw-grid">
                            <For each={store.swatches}>
                                {(sw) => (
                                    <div class="sw-card">
                                        <div class="sw-chip" style={{ background: sw.color }} title="Click: fill selection" onClick={() => applySwatch(sw.id, 'fill')}>
                                            <input class="sw-color" type="color" value={/^#[0-9a-fA-F]{6}$/.test(sw.color) ? sw.color : '#000000'} title="Edit swatch colour (updates linked objects)"
                                                onClick={(e) => e.stopPropagation()}
                                                onInput={(e) => updateSwatchColor(sw.id, e.currentTarget.value)} />
                                        </div>
                                        <Show when={editingId() === sw.id} fallback={
                                            <div class="sw-name" title={sw.name} onDblClick={() => startRename(sw)}>{sw.name}</div>
                                        }>
                                            <input class="sw-name-input" value={editingName()} autofocus
                                                onInput={(e) => setEditingName(e.currentTarget.value)}
                                                onBlur={() => commitRename(sw.id)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') commitRename(sw.id); else if (e.key === 'Escape') { setEditingId(null); setEditingName(''); } }} />
                                        </Show>
                                        <div class="sw-actions">
                                            <button class="sw-act" title="Apply as stroke" onClick={() => applySwatch(sw.id, 'stroke')}>S</button>
                                            <button class="sw-act sw-danger" title="Delete swatch" onClick={() => deleteSwatch(sw.id)}><Trash2 size={12} /></button>
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

export default SwatchesPanel;
