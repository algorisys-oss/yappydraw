import { type Component, For, createSignal, Show } from 'solid-js';
import { store, addDisplayState, updateDisplayState, deleteDisplayState, applyDisplayState } from '../store/app-store';
import { Camera, RefreshCw, Trash2, Play, X, RotateCcw, PlayCircle } from 'lucide-solid';
import "./state-panel.css";

export const StatePanel: Component = () => {
    const [newName, setNewName] = createSignal('');
    const [isPlaying, setIsPlaying] = createSignal(false);

    const handleAdd = () => {
        if (newName().trim()) {
            addDisplayState(newName().trim());
            setNewName('');
        } else {
            addDisplayState(`State ${store.states.length + 1}`);
        }
    };

    const handleReset = () => {
        if (store.states.length > 0) {
            applyDisplayState(store.states[0].id);
        }
    };

    const handlePlayAll = async () => {
        if (store.states.length === 0 || isPlaying()) return;

        setIsPlaying(true);

        // Start from beginning
        await applyDisplayState(store.states[0].id);

        // Sequence through all states with delay
        for (let i = 1; i < store.states.length; i++) {
            if (!isPlaying()) break; // Allow stopping
            await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s between states
            await applyDisplayState(store.states[i].id);
        }

        setIsPlaying(false);
    };

    const handleStopPlayback = () => {
        setIsPlaying(false);
    };

    return (
            <div class="state-panel">
                <div class="state-toolbar">
                    <Show when={!isPlaying()} fallback={
                        <button class="icon-btn play-all-btn" onClick={handleStopPlayback} title="Stop Playback">
                            <X size={18} />
                        </button>
                    }>
                        <button class="icon-btn play-all-btn" onClick={handlePlayAll} title="Play All States" disabled={store.states.length === 0}>
                            <PlayCircle size={18} />
                        </button>
                    </Show>
                    <button class="icon-btn reset-btn" onClick={handleReset} title="Reset to Start">
                        <RotateCcw size={18} />
                    </button>
                </div>

                <div class="panel-actions">
                    <div class="input-group">
                        <input
                            type="text"
                            placeholder="State name..."
                            value={newName()}
                            onInput={(e) => setNewName(e.currentTarget.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <button class="add-btn" onClick={handleAdd} title="Capture Current State">
                            <Camera size={18} />
                            <span>Capture</span>
                        </button>
                    </div>
                </div>

                <div class="state-list">
                    <For each={store.states}>
                        {(state) => (
                            <div class={`state-item ${store.activeStateId === state.id ? 'active' : ''}`}>
                                <div class="state-info" onClick={() => applyDisplayState(state.id)}>
                                    <span class="state-name">{state.name}</span>
                                    <span class="state-count">{Object.keys(state.overrides).length} elements</span>
                                </div>
                                <div class="state-controls">
                                    <button class="icon-btn" onClick={() => applyDisplayState(state.id)} title="Morph to State">
                                        <Play size={16} fill="currentColor" />
                                    </button>
                                    <button class="icon-btn" onClick={() => updateDisplayState(state.id)} title="Update State with Current">
                                        <RefreshCw size={16} />
                                    </button>
                                    <button class="icon-btn delete" onClick={() => deleteDisplayState(state.id)} title="Delete State">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </For>
                    <Show when={store.states.length === 0}>
                        <div class="empty-state">
                            No states saved yet. Capture the current canvas to start!
                        </div>
                    </Show>
                </div>
            </div>
    );
};
