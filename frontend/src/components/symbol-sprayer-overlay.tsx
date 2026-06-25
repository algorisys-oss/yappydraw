import { Show, createSignal, onMount, onCleanup } from 'solid-js';
import { store, toggleSymbolSprayer, spraySymbolInstances } from '../store/app-store';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import './symbol-sprayer-overlay.css';

/**
 * Symbol Sprayer. With a symbol armed (`sprayerSymbolId`) and the tool active, drag on
 * the canvas to scatter instances of that symbol along the stroke — points are sampled
 * spaced by the brush radius so density follows drag speed, with size jitter. Esc exits.
 */
export const SymbolSprayerOverlay = () => {
    const [pts, setPts] = createSignal<{ x: number; y: number }[]>([]); // world spray points
    const [cursor, setCursor] = createSignal<{ x: number; y: number } | null>(null);
    let dragging = false;
    const radius = 26; // world-units spacing between sprayed instances

    const active = () => store.sprayerActive && !!store.sprayerSymbolId;
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);

    const addPoint = (w: { x: number; y: number }) => {
        setPts(cur => {
            const last = cur[cur.length - 1];
            if (last && Math.hypot(w.x - last.x, w.y - last.y) < radius) return cur;
            return [...cur, w];
        });
    };

    const onDown = (e: PointerEvent) => {
        if (!active()) return;
        e.preventDefault();
        dragging = true;
        const w = toWorld(e); setPts([w]); setCursor(w);
    };
    const onMove = (e: PointerEvent) => {
        if (active()) setCursor(toWorld(e));
        if (!dragging) return;
        addPoint(toWorld(e));
    };
    const onUp = () => {
        if (!dragging) return;
        dragging = false;
        const sid = store.sprayerSymbolId;
        const p = pts();
        if (sid && p.length) spraySymbolInstances(sid, p, { scaleJitter: 0.3 });
        setPts([]);
    };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && store.sprayerActive) { e.preventDefault(); toggleSymbolSprayer(undefined); } };
        window.addEventListener('keydown', onKey);
        onCleanup(() => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('keydown', onKey);
        });
    });

    const dots = () => pts().map(p => worldToScreen(p.x, p.y, store.viewState as any));
    const cur = () => { const c = cursor(); return c ? worldToScreen(c.x, c.y, store.viewState as any) : null; };
    const rScreen = () => radius * (store.viewState?.scale ?? 1);

    return (
        <Show when={active()}>
            <div class="spray-overlay" onPointerDown={onDown}>
                <svg class="spray-svg">
                    {dots().map(d => <circle cx={d.x} cy={d.y} r={4} class="spray-dot" />)}
                    <Show when={cur()}>
                        {(c) => <circle cx={c().x} cy={c().y} r={rScreen()} class="spray-brush" />}
                    </Show>
                </svg>
                <div class="spray-hint">Symbol Sprayer — drag to scatter instances · Esc to exit</div>
            </div>
        </Show>
    );
};
