import { Show, createEffect, onMount, onCleanup } from 'solid-js';
import { store, toggleLivePaint, livePaintFillAt, regenerateAllLivePaint } from '../store/app-store';
import { screenToWorld } from '../utils/viewport-transforms';
import './live-paint-overlay.css';

/**
 * Live Paint. Two responsibilities:
 *  1. The engine — a guarded effect that recomputes every Live Paint group's region fills
 *     whenever geometry changes (so dragging a source outline updates the fills live).
 *  2. The Bucket — when active, click an enclosed region to fill it with the active colour.
 *     If the clicked shapes aren't a group yet, the selection is converted to one first.
 * Esc exits the bucket.
 */
export const LivePaintOverlay = () => {
    // 1. Live engine — runs on every store change; cheap no-op when nothing moved.
    createEffect(() => {
        store.dirtyRevision;          // subscribe to the coarse change counter
        store.elements.length;        // and to add/remove of elements
        regenerateAllLivePaint();
    });

    const active = () => store.livePaintActive;
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);

    const onDown = (e: PointerEvent) => {
        if (!active()) return;
        e.preventDefault();
        const w = toWorld(e);
        livePaintFillAt(w, store.defaultElementStyles.backgroundColor || '#cccccc');
    };

    onMount(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && store.livePaintActive) { e.preventDefault(); toggleLivePaint(false); } };
        window.addEventListener('keydown', onKey);
        onCleanup(() => window.removeEventListener('keydown', onKey));
    });

    return (
        <Show when={active()}>
            <div class="lp-overlay" onPointerDown={onDown}>
                <div class="lp-hint">Live Paint Bucket — click an enclosed region to fill with the active colour · Esc to exit</div>
            </div>
        </Show>
    );
};
