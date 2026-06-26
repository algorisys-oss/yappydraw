import { Show, createSignal, onMount, onCleanup } from 'solid-js';
import { store, togglePathEraser, commitPathErase } from '../store/app-store';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import './path-eraser-overlay.css';

/**
 * Path Eraser (destructive). Drag across shapes to carve a swath out of them by boolean
 * difference — the real geometry is removed (unlike the non-destructive Eraser mask). [ ]
 * resize the eraser. Esc exits.
 */
export const PathEraserOverlay = () => {
    const [pts, setPts] = createSignal<{ x: number; y: number }[]>([]);
    const [cursor, setCursor] = createSignal<{ x: number; y: number } | null>(null);
    const [radius, setRadius] = createSignal(16);
    let dragging = false;

    const active = () => store.pathEraserActive;
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);

    const onDown = (e: PointerEvent) => {
        if (!active() || e.button !== 0) return;
        e.preventDefault(); dragging = true;
        const w = toWorld(e); setPts([w]); setCursor(w);
    };
    const onMove = (e: PointerEvent) => { if (active()) setCursor(toWorld(e)); if (dragging) setPts(p => [...p, toWorld(e)]); };
    const onUp = () => { if (!dragging) return; dragging = false; const p = pts(); if (p.length) commitPathErase(p, radius()); setPts([]); };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', () => { dragging = false; setPts([]); });
        const onKey = (e: KeyboardEvent) => {
            if (!store.pathEraserActive) return;
            if (e.key === 'Escape') { e.preventDefault(); togglePathEraser(false); }
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
            <div class="pe-overlay" onPointerDown={onDown}>
                <svg class="pe-svg">
                    <Show when={pts().length > 1}>
                        <polyline points={strokeScreen()} class="pe-stroke" style={{ 'stroke-width': `${radius() * 2 * scale()}px` }} />
                    </Show>
                    <Show when={cur()}>{(c) => <circle cx={c().x} cy={c().y} r={radius() * scale()} class="pe-cursor" />}</Show>
                </svg>
                <div class="pe-hint">
                    Path Eraser — drag to carve shapes (destructive) · [ ] resize
                    <button class="pe-done" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); togglePathEraser(false); }}>Done ✕</button>
                </div>
            </div>
        </Show>
    );
};
