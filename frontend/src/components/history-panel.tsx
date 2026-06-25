import { type Component, For, Show, createMemo } from 'solid-js';
import { store, toggleHistoryPanel, getHistoryEntries, jumpToHistory } from '../store/app-store';
import { History, X } from 'lucide-solid';
import './history-panel.css';

/**
 * Undo-history panel. Lists the document timeline — past states, the current
 * state, then redoable future states — newest at the top. Click any row to jump
 * straight to that point (undo/redo the difference). Reacts to the reactive
 * undo/redo stack lengths.
 */
const HistoryPanel: Component = () => {
    // Recompute whenever the stacks change. Newest first for a natural log feel.
    const entries = createMemo(() => {
        store.undoStackLength; store.redoStackLength; // track
        return getHistoryEntries().slice().reverse();
    });

    return (
        <Show when={store.showHistoryPanel}>
            <div class="history-panel">
                <div class="history-panel-header">
                    <div class="hp-title"><History size={15} /><h3>History</h3></div>
                    <button class="hp-close" title="Close" onClick={() => toggleHistoryPanel(false)}><X size={15} /></button>
                </div>
                <div class="history-panel-body">
                    <For each={entries()}>
                        {(e) => (
                            <button
                                class={`hp-row ${e.isCurrent ? 'current' : ''} ${e.index > (store.undoStackLength) ? 'future' : ''}`}
                                onClick={() => jumpToHistory(e.index)}
                                title={e.isCurrent ? 'Current state' : `Jump to state ${e.index + 1}`}
                            >
                                <span class="hp-dot" />
                                <span class="hp-label">{e.isCurrent ? 'Current' : `State ${e.index + 1}`}</span>
                                <span class="hp-count">{e.count} obj</span>
                            </button>
                        )}
                    </For>
                </div>
            </div>
        </Show>
    );
};

export default HistoryPanel;
