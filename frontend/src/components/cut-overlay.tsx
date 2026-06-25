import { Show, createSignal, onMount, onCleanup } from 'solid-js';
import { store, toggleCutTool, knifeCut, splitPathAt } from '../store/app-store';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import { hitTestElement } from '../utils/hit-testing';
import type { DrawingElement } from '../types';
import './cut-overlay.css';

/**
 * Knife + Scissors. While the cut tool is active:
 *  • drag a line across shapes → Knife slices each crossed shape into separate pieces.
 *  • a short click on a path → Scissors splits that path at the nearest anchor.
 * Targets default to the selection (or all shapes when nothing is selected). Esc exits.
 */
export const CutOverlay = () => {
    const [a, setA] = createSignal<{ x: number; y: number } | null>(null); // world start
    const [b, setB] = createSignal<{ x: number; y: number } | null>(null); // world current
    let dragging = false;
    let downScreen = { x: 0, y: 0 };

    const active = () => store.cutToolActive;
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);

    const onDown = (e: PointerEvent) => {
        if (!active()) return;
        e.preventDefault();
        downScreen = { x: e.clientX, y: e.clientY };
        const w = toWorld(e); setA(w); setB(w); dragging = true;
    };
    const onMove = (e: PointerEvent) => { if (dragging) setB(toWorld(e)); };
    const onUp = (e: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        const dist = Math.hypot(e.clientX - downScreen.x, e.clientY - downScreen.y);
        const p0 = a(), p1 = b();
        if (p0 && p1) {
            if (dist < 6) {
                // Scissors — find the topmost path under the click and split it.
                const emap = new Map<string, DrawingElement>();
                for (const el of store.elements) emap.set(el.id, el);
                const hit = [...store.elements].reverse().find(el => !el.locked && hitTestElement(el, p1.x, p1.y, 4, store.elements, emap));
                if (hit) splitPathAt(hit.id, p1);
            } else {
                knifeCut(p0, p1, store.selection.length ? [...store.selection] : undefined);
            }
        }
        setA(null); setB(null);
    };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && store.cutToolActive) { e.preventDefault(); toggleCutTool(false); } };
        window.addEventListener('keydown', onKey);
        onCleanup(() => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('keydown', onKey);
        });
    });

    const lineScreen = () => {
        const p0 = a(), p1 = b(); if (!p0 || !p1) return null;
        const s0 = worldToScreen(p0.x, p0.y, store.viewState as any);
        const s1 = worldToScreen(p1.x, p1.y, store.viewState as any);
        return { x1: s0.x, y1: s0.y, x2: s1.x, y2: s1.y };
    };

    return (
        <Show when={active()}>
            <div class="cut-overlay" onPointerDown={onDown}>
                <svg class="cut-svg">
                    <Show when={lineScreen()}>
                        {(l) => <line x1={l().x1} y1={l().y1} x2={l().x2} y2={l().y2} class="cut-line" />}
                    </Show>
                </svg>
                <div class="cut-hint">Knife / Scissors — drag a line to slice · click a path to split · Esc to exit</div>
            </div>
        </Show>
    );
};
