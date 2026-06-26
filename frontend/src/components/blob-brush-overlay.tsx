import { Show, createSignal, onMount, onCleanup } from 'solid-js';
import { store, toggleBlobBrush, commitBlobStroke } from '../store/app-store';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import './blob-brush-overlay.css';

/**
 * Blob Brush. Drag to paint; on release the stroke becomes a filled shape (union of disks
 * along the path) and merges with any overlapping shape of the same fill colour — so repeated
 * strokes build one organic blob (Illustrator's Blob Brush). [ and ] resize the brush. Esc exits.
 */
export const BlobBrushOverlay = () => {
    const [pts, setPts] = createSignal<{ x: number; y: number }[]>([]);
    const [cursor, setCursor] = createSignal<{ x: number; y: number } | null>(null);
    const [radius, setRadius] = createSignal(14); // world units
    let dragging = false;

    const active = () => store.blobBrushActive;
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);

    const onDown = (e: PointerEvent) => {
        if (!active() || e.button !== 0) return;
        e.preventDefault();
        dragging = true;
        const w = toWorld(e); setPts([w]); setCursor(w);
    };
    const onMove = (e: PointerEvent) => {
        if (active()) setCursor(toWorld(e));
        if (!dragging) return;
        setPts(p => [...p, toWorld(e)]);
    };
    const onUp = () => {
        if (!dragging) return;
        dragging = false;
        const p = pts();
        if (p.length) commitBlobStroke(p, radius());
        setPts([]);
    };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', () => { dragging = false; setPts([]); });
        const onKey = (e: KeyboardEvent) => {
            if (!store.blobBrushActive) return;
            if (e.key === 'Escape') { e.preventDefault(); toggleBlobBrush(false); }
            else if (e.key === ']') { e.preventDefault(); setRadius(r => Math.min(120, r + 3)); }
            else if (e.key === '[') { e.preventDefault(); setRadius(r => Math.max(3, r - 3)); }
        };
        window.addEventListener('keydown', onKey);
        onCleanup(() => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('keydown', onKey); });
    });

    const scale = () => store.viewState?.scale ?? 1;
    const strokeScreen = () => pts().map(p => { const s = worldToScreen(p.x, p.y, store.viewState as any); return `${s.x},${s.y}`; }).join(' ');
    const cur = () => { const c = cursor(); return c ? worldToScreen(c.x, c.y, store.viewState as any) : null; };

    return (
        <Show when={active()}>
            <div class="bb-overlay" onPointerDown={onDown}>
                <svg class="bb-svg">
                    <Show when={pts().length > 1}>
                        <polyline points={strokeScreen()} class="bb-stroke" style={{ 'stroke-width': `${radius() * 2 * scale()}px` }} />
                    </Show>
                    <Show when={cur()}>{(c) => <circle cx={c().x} cy={c().y} r={radius() * scale()} class="bb-cursor" />}</Show>
                </svg>
                <div class="bb-hint">
                    Blob Brush — drag to paint (same-colour strokes merge) · [ ] resize
                    <button class="bb-done" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); toggleBlobBrush(false); }}>Done ✕</button>
                </div>
            </div>
        </Show>
    );
};
