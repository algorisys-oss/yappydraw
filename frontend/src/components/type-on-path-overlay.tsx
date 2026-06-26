import { Show, createSignal, onMount, onCleanup } from 'solid-js';
import { store, toggleTypeOnPath, attachTextToPath } from '../store/app-store';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import { hitTestElement } from '../utils/hit-testing';
import type { DrawingElement } from '../types';
import './type-on-path-overlay.css';

// Element types that flow text along their path (curvedText renders for these).
const PATHY = new Set(['line', 'arrow', 'bezier', 'fineliner', 'inkbrush', 'marker', 'ink', 'organicBranch']);

/**
 * Type on a Path (guided). Hover over a line/curve/freehand stroke — it highlights — then click
 * it to type text that flows along it. A prompt collects the text (pre-filled if the path already
 * carries some). Esc exits.
 */
export const TypeOnPathOverlay = () => {
    const [hoverId, setHoverId] = createSignal<string>('');
    const active = () => store.typeOnPathActive;
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);

    const pick = (w: { x: number; y: number }): DrawingElement | undefined => {
        const emap = new Map<string, DrawingElement>();
        for (const el of store.elements) emap.set(el.id, el);
        // topmost pathy element under the point (a little tolerance for thin lines)
        for (let i = store.elements.length - 1; i >= 0; i--) {
            const el = store.elements[i];
            if (!PATHY.has(el.type) || el.locked) continue;
            if (hitTestElement(el, w.x, w.y, 8, store.elements, emap)) return el;
        }
        return undefined;
    };

    const onMove = (e: PointerEvent) => { if (!active()) return; const el = pick(toWorld(e)); setHoverId(el?.id || ''); };
    const onDown = (e: PointerEvent) => {
        if (!active() || e.button !== 0) return;
        e.preventDefault();
        const el = pick(toWorld(e));
        if (!el) return;
        const text = window.prompt('Type along the path:', el.containerText || '');
        if (text == null) return;
        if (text.trim()) attachTextToPath(el.id, text);
    };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && store.typeOnPathActive) { e.preventDefault(); toggleTypeOnPath(false); } };
        window.addEventListener('keydown', onKey);
        onCleanup(() => { window.removeEventListener('pointermove', onMove); window.removeEventListener('keydown', onKey); });
    });

    // highlight box for the hovered element
    const box = () => {
        const el = store.elements.find(e => e.id === hoverId()); if (!el) return null;
        const a = worldToScreen(el.x, el.y, store.viewState as any);
        const b = worldToScreen(el.x + el.width, el.y + el.height, store.viewState as any);
        return { x: Math.min(a.x, b.x) - 4, y: Math.min(a.y, b.y) - 4, w: Math.abs(b.x - a.x) + 8, h: Math.abs(b.y - a.y) + 8 };
    };

    return (
        <Show when={active()}>
            <div class="top-overlay" onPointerDown={onDown}>
                <svg class="top-svg">
                    <Show when={box()}>{(r) => <rect x={r().x} y={r().y} width={r().w} height={r().h} class="top-hl" />}</Show>
                </svg>
                <div class="top-hint">
                    Type on Path — hover a line/curve and click to flow text along it · Esc to exit
                    <button class="top-done" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); toggleTypeOnPath(false); }}>Done ✕</button>
                </div>
            </div>
        </Show>
    );
};
