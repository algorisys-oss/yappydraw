import { type Component, Index, Show, createMemo, createSignal } from 'solid-js';
import {
    store, toggleRecolorPanel, getSelectionColors, recolorSelectionColor, adjustSelectionColors, pushToHistory,
} from '../store/app-store';
import { Palette, X, RotateCcw } from 'lucide-solid';
import { draggablePanel } from '../utils/draggable-panel';
import './recolor-panel.css';

/**
 * Recolor Artwork — shows the selection's colour palette. Edit any swatch to remap that colour
 * across every selected object; the global controls shift the whole palette at once. Swatch
 * edits apply LIVE while you drag the colour picker (not just on commit): the swatch list is
 * frozen during a drag and each tick remaps the swatch's current colour → the new one, with a
 * single history entry snapshotted up front.
 */
const RecolorPanel: Component = () => {
    const liveColors = createMemo(() => {
        store.dirtyRevision; // re-run when colours change
        return store.selection.length ? getSelectionColors() : [];
    });
    // While dragging a picker, freeze the displayed list + track each swatch's current colour.
    const [edit, setEdit] = createSignal<{ list: { color: string; count: number }[]; live: string[] } | null>(null);
    const swatches = () => edit()?.list ?? liveColors();

    const beginEdit = () => {
        if (edit()) return;
        pushToHistory();                       // one undo step for the whole drag
        const list = getSelectionColors();
        setEdit({ list, live: list.map(c => c.color) });
    };
    const pickLive = (i: number, next: string) => {
        const e = edit();
        const from = e ? e.live[i] : swatches()[i]?.color;
        if (!from) return;
        recolorSelectionColor(from, next, undefined, false); // live, no per-tick history
        if (e) setEdit({ ...e, live: e.live.map((c, j) => (j === i ? next : c)) });
    };
    const endEdit = () => setEdit(null);
    const valHex = (c: string) => (/^#[0-9a-fA-F]{6}$/.test(c) ? c : '#000000');

    return (
        <Show when={store.showRecolorPanel}>
            <div class="recolor-panel" ref={draggablePanel('.recolor-panel-header')}>
                <div class="recolor-panel-header">
                    <div class="rc-title"><Palette size={15} /><h3>Recolor Artwork</h3></div>
                    <button class="rc-icon-btn" title="Close" onClick={() => toggleRecolorPanel(false)}><X size={15} /></button>
                </div>
                <div class="recolor-panel-body">
                    <Show when={store.selection.length > 0} fallback={<div class="rc-empty">Select objects to see and remap their colours.</div>}>
                        <div class="rc-section-label">Palette ({swatches().length})</div>
                        <div class="rc-grid">
                            <Index each={swatches()}>
                                {(c, i) => (
                                    <label class="rc-chip" title={`${c().color} — used ${c().count}×. Drag to remap live across the selection.`}>
                                        <input
                                            type="color"
                                            value={valHex(edit()?.live[i] ?? c().color)}
                                            onPointerDown={beginEdit}
                                            onInput={(e) => pickLive(i, e.currentTarget.value)}
                                            onChange={(e) => { pickLive(i, e.currentTarget.value); endEdit(); }}
                                            onBlur={endEdit}
                                        />
                                        <span class="rc-chip-fill" style={{ background: edit()?.live[i] ?? c().color }} />
                                        <span class="rc-count">{c().count}</span>
                                    </label>
                                )}
                            </Index>
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
