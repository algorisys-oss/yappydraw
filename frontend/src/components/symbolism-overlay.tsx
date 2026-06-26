import { Show, For, createSignal, onMount, onCleanup } from 'solid-js';
import { store, toggleSymbolism, setSymbolismMode, applySymbolism, pushToHistory } from '../store/app-store';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import './symbolism-overlay.css';

const MODES: { id: any; label: string }[] = [
    { id: 'sizer', label: 'Sizer' }, { id: 'spinner', label: 'Spinner' }, { id: 'shifter', label: 'Shifter' },
    { id: 'screener', label: 'Screener' }, { id: 'stainer', label: 'Stainer' }, { id: 'styler', label: 'Styler' },
];

/**
 * Symbolism brush (Illustrator's symbol sub-tools). Pick a mode, then drag over symbol
 * instances: Sizer scales, Spinner rotates, Shifter nudges, Screener fades, Stainer tints,
 * Styler applies the current fill/stroke — each with a distance falloff. Alt reverses. [ ]
 * resize the brush. Esc exits.
 */
export const SymbolismOverlay = () => {
    const [cursor, setCursor] = createSignal<{ x: number; y: number } | null>(null);
    const [radius, setRadius] = createSignal(60);
    let dragging = false;
    let prev: { x: number; y: number } | null = null;

    const active = () => store.symbolismActive;
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);

    const onDown = (e: PointerEvent) => {
        if (!active() || e.button !== 0) return;
        e.preventDefault(); dragging = true;
        pushToHistory();                  // one undo for the whole brush stroke
        const w = toWorld(e); prev = w; setCursor(w);
        applySymbolism(store.symbolismMode, w.x, w.y, radius(), { alt: e.altKey });
    };
    const onMove = (e: PointerEvent) => {
        if (active()) setCursor(toWorld(e));
        if (!dragging) return;
        const w = toWorld(e);
        const dx = prev ? w.x - prev.x : 0, dy = prev ? w.y - prev.y : 0;
        applySymbolism(store.symbolismMode, w.x, w.y, radius(), { dx, dy, alt: e.altKey });
        prev = w;
    };
    const onUp = () => { dragging = false; prev = null; };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        const onKey = (e: KeyboardEvent) => {
            if (!store.symbolismActive) return;
            if (e.key === 'Escape') { e.preventDefault(); toggleSymbolism(false); }
            else if (e.key === ']') { e.preventDefault(); setRadius(r => Math.min(300, r + 10)); }
            else if (e.key === '[') { e.preventDefault(); setRadius(r => Math.max(15, r - 10)); }
        };
        window.addEventListener('keydown', onKey);
        onCleanup(() => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('keydown', onKey); });
    });

    const cur = () => { const c = cursor(); return c ? worldToScreen(c.x, c.y, store.viewState as any) : null; };
    const scale = () => store.viewState?.scale ?? 1;

    return (
        <Show when={active()}>
            <div class="sy-overlay" onPointerDown={onDown}>
                <svg class="sy-svg">
                    <Show when={cur()}>{(c) => <circle cx={c().x} cy={c().y} r={radius() * scale()} class="sy-cursor" />}</Show>
                </svg>
                <div class="sy-hint">
                    <For each={MODES}>{(m) => (
                        <button class={`sy-mode ${store.symbolismMode === m.id ? 'sy-mode-on' : ''}`}
                            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); setSymbolismMode(m.id); }}>{m.label}</button>
                    )}</For>
                    <button class="sy-done" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); toggleSymbolism(false); }}>Done ✕</button>
                </div>
            </div>
        </Show>
    );
};
