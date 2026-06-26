import { Show, createSignal, createEffect, onMount, onCleanup } from 'solid-js';
import { store, toggleLivePaint, livePaintFillAt, regenerateAllLivePaint, livePaintFaceAt, deleteLivePaintFaceAt } from '../store/app-store';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import './live-paint-overlay.css';

/**
 * Live Paint. Three responsibilities:
 *  1. The engine — a guarded effect that recomputes every group's region fills when geometry
 *     changes (so dragging a source outline updates the fills live).
 *  2. The Bucket — click an enclosed region to fill it with the active colour.
 *  3. Selection — the face under the cursor highlights; Alt-click clears that face's fill.
 * Esc exits.
 */
export const LivePaintOverlay = () => {
    const [hover, setHover] = createSignal<string>(''); // SVG path d of the hovered face (screen)
    const [alt, setAlt] = createSignal(false);

    // 1. Live engine — runs on every store change; cheap no-op when nothing moved.
    createEffect(() => {
        store.dirtyRevision;
        store.elements.length;
        regenerateAllLivePaint();
    });

    const active = () => store.livePaintActive;
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);

    const onDown = (e: PointerEvent) => {
        if (!active()) return;
        e.preventDefault();
        const w = toWorld(e);
        if (e.altKey) deleteLivePaintFaceAt(w);            // Selection: clear this face
        else livePaintFillAt(w, store.defaultElementStyles.backgroundColor || '#cccccc');
    };
    const onMove = (e: PointerEvent) => {
        if (!active()) return;
        setAlt(e.altKey);
        const w = toWorld(e);
        const face = livePaintFaceAt(w);
        if (!face) { setHover(''); return; }
        let d = '';
        for (const poly of face.region) for (const ring of poly) {
            ring.forEach((pt, i) => { const s = worldToScreen(pt[0], pt[1], store.viewState as any); d += `${i === 0 ? 'M' : 'L'}${s.x},${s.y} `; });
            d += 'Z ';
        }
        setHover(d);
    };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && store.livePaintActive) { e.preventDefault(); toggleLivePaint(false); } };
        window.addEventListener('keydown', onKey);
        onCleanup(() => { window.removeEventListener('pointermove', onMove); window.removeEventListener('keydown', onKey); });
    });

    return (
        <Show when={active()}>
            <div class="lp-overlay" onPointerDown={onDown}>
                <svg class="lp-svg">
                    <Show when={hover()}><path d={hover()} class={alt() ? 'lp-face lp-face-del' : 'lp-face'} fill-rule="evenodd" /></Show>
                </svg>
                <div class="lp-hint">Live Paint — click a region to fill · Alt-click to clear a face · Esc to exit</div>
            </div>
        </Show>
    );
};
