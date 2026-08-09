import { type Component, Show } from "solid-js";
import { store, setPenConstrain } from "../store/app-store";
import "./pen-options-bar.css";

/**
 * Compact floating options for the vector Pen / path editing. Surfaces the
 * keyboard-free constrain toggle (the on-screen stand-in for holding Shift) so
 * tablets get both of Shift's jobs: snapping Bézier handles to 90°/45° while
 * dragging (the "Clock Method"), and constraining the segment between clicks to
 * 15° for straight lines. Visible while the Pen tool is active or a single path
 * is selected.
 */
const PenOptionsBar: Component = () => {
    const selectedPath = () =>
        store.selection.length === 1 &&
        store.elements.find(e => e.id === store.selection[0])?.type === 'path';

    const visible = () => store.selectedTool === 'path' || selectedPath();

    return (
        <Show when={visible()}>
            <div class="pen-options-bar" role="toolbar" aria-label="Pen options">
                <button
                    class={`pen-opt-btn ${store.penConstrain ? 'active' : ''}`}
                    on:click={() => setPenConstrain()}
                    title="Constrain: straight segments (15°) while drawing, and handles to 90°/45° while dragging (Clock Method) — keyboard-free stand-in for Shift. Also: hold a second finger while dragging."
                >
                    <span class="pen-opt-icon">⊾</span>
                    <span class="pen-opt-label">90°/45°</span>
                </button>
            </div>
        </Show>
    );
};

export default PenOptionsBar;
