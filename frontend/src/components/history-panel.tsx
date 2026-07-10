import { type Component, For, createMemo } from 'solid-js';
import { store, getHistoryEntries, jumpToHistory } from '../store/app-store';
import './history-panel.css';

/**
 * Undo-history panel BODY — lists the document timeline (past states, current, then redoable
 * future states, newest first); click a row to jump to that point. Migrated onto the dockable-panel
 * system (Phase D): the chrome (title bar, dock/float/collapse/close) is supplied by PanelChrome, so
 * this renders body-only. Registered as `history` in the panel registry and opened via the existing
 * `toggleHistoryPanel` action (now bridged to the dock store) or ⌘K.
 */
const HistoryPanel: Component = () => {
    // Recompute whenever the stacks change. Newest first for a natural log feel.
    const entries = createMemo(() => {
        store.undoStackLength; store.redoStackLength; // track
        return getHistoryEntries().slice().reverse();
    });

    return (
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
    );
};

export default HistoryPanel;
