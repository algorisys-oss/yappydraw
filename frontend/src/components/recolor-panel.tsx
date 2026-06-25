import { type Component, For, Show, createMemo } from 'solid-js';
import {
    store, toggleRecolorPanel, getSelectionColors, recolorSelectionColor, adjustSelectionColors,
} from '../store/app-store';
import { Palette, X, RotateCcw } from 'lucide-solid';
import { draggablePanel } from '../utils/draggable-panel';
import './recolor-panel.css';

/**
 * Recolor Artwork — shows the selection's colour palette. Edit any swatch to
 * remap that colour across every selected object; the global controls shift the
 * whole palette's hue / lightness / saturation at once.
 */
const RecolorPanel: Component = () => {
    const colors = createMemo(() => {
        store.dirtyRevision; // re-run when colours change
        return store.selection.length ? getSelectionColors() : [];
    });

    return (
        <Show when={store.showRecolorPanel}>
            <div class="recolor-panel" ref={draggablePanel('.recolor-panel-header')}>
                <div class="recolor-panel-header">
                    <div class="rc-title"><Palette size={15} /><h3>Recolor Artwork</h3></div>
                    <button class="rc-icon-btn" title="Close" onClick={() => toggleRecolorPanel(false)}><X size={15} /></button>
                </div>
                <div class="recolor-panel-body">
                    <Show when={store.selection.length > 0} fallback={<div class="rc-empty">Select objects to see and remap their colours.</div>}>
                        <div class="rc-section-label">Palette ({colors().length})</div>
                        <div class="rc-grid">
                            <For each={colors()}>
                                {(c) => (
                                    <label class="rc-chip" title={`${c.color} — used ${c.count}×. Click to remap across the selection.`}>
                                        <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(c.color) ? c.color : '#000000'}
                                            onChange={(e) => recolorSelectionColor(c.color, e.currentTarget.value)} />
                                        <span class="rc-chip-fill" style={{ background: c.color }} />
                                        <span class="rc-count">{c.count}</span>
                                    </label>
                                )}
                            </For>
                        </div>

                        <div class="rc-section-label">Adjust all</div>
                        <div class="rc-adjust">
                            <div class="rc-adjust-row">
                                <span>Hue</span>
                                <button onClick={() => adjustSelectionColors({ hue: -15 })} title="Rotate hue −15°">−</button>
                                <button onClick={() => adjustSelectionColors({ hue: 15 })} title="Rotate hue +15°">+</button>
                            </div>
                            <div class="rc-adjust-row">
                                <span>Light</span>
                                <button onClick={() => adjustSelectionColors({ lightness: -0.08 })} title="Darker">−</button>
                                <button onClick={() => adjustSelectionColors({ lightness: 0.08 })} title="Lighter">+</button>
                            </div>
                            <div class="rc-adjust-row">
                                <span>Sat.</span>
                                <button onClick={() => adjustSelectionColors({ saturation: 0.82 })} title="Desaturate">−</button>
                                <button onClick={() => adjustSelectionColors({ saturation: 1.22 })} title="Saturate">+</button>
                            </div>
                            <button class="rc-rand" title="Random hue shift" onClick={() => adjustSelectionColors({ hue: 30 + Math.round((store.dirtyRevision * 47) % 180) })}>
                                <RotateCcw size={13} /> Shift hue
                            </button>
                        </div>
                    </Show>
                </div>
            </div>
        </Show>
    );
};

export default RecolorPanel;
