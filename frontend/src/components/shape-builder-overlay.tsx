import { Show, For, createSignal, onMount, onCleanup } from 'solid-js';
import { store, toggleShapeBuilder, applyPathfinder, deleteElements } from '../store/app-store';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import { hitTestElement } from '../utils/hit-testing';
import type { DrawingElement } from '../types';
import './shape-builder-overlay.css';

/**
 * Shape Builder. With ≥2 shapes selected and the tool active, drag across them:
 * the shapes the stroke crosses are highlighted and, on release, merged into one
 * (union via the Pathfinder engine). Hold Alt while dragging to delete the
 * crossed shapes instead. Esc / toggling off exits.
 */
export const ShapeBuilderOverlay = () => {
    const [stroke, setStroke] = createSignal<{ x: number; y: number }[]>([]); // world coords
    const [touched, setTouched] = createSignal<string[]>([]);
    const [alt, setAlt] = createSignal(false);
    let dragging = false;

    const active = () => store.shapeBuilderActive && store.selection.length >= 2;
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);

    // Selected shapes the current stroke passes through.
    const computeTouched = (pts: { x: number; y: number }[]) => {
        const sel = store.selection;
        const emap = new Map<string, DrawingElement>();
        for (const el of store.elements) emap.set(el.id, el);
        const hit = new Set<string>();
        for (const id of sel) {
            const el = emap.get(id);
            if (!el) continue;
            if (pts.some(p => hitTestElement(el, p.x, p.y, 0, store.elements, emap))) hit.add(id);
        }
        return [...hit];
    };

    const onDown = (e: PointerEvent) => {
        if (!active()) return;
        e.preventDefault();
        setAlt(e.altKey);
        const w = toWorld(e);
        setStroke([w]);
        setTouched(computeTouched([w]));
        dragging = true;
    };
    const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        setAlt(e.altKey);
        const w = toWorld(e);
        setStroke(s => { const ns = [...s, w]; setTouched(computeTouched(ns)); return ns; });
    };
    const onUp = () => {
        if (!dragging) return;
        dragging = false;
        const ids = touched();
        if (ids.length) {
            if (alt()) deleteElements(ids);
            else if (ids.length >= 2) applyPathfinder(ids, 'union');
        }
        setStroke([]); setTouched([]);
    };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && store.shapeBuilderActive) { e.preventDefault(); toggleShapeBuilder(false); } };
        window.addEventListener('keydown', onKey);
        onCleanup(() => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('keydown', onKey);
        });
    });

    // Screen-space polyline for the drag stroke.
    const strokeScreen = () => stroke().map(p => { const s = worldToScreen(p.x, p.y, store.viewState as any); return `${s.x},${s.y}`; }).join(' ');
    // Screen bbox of a touched element (axis-aligned approximation for the highlight).
    const touchedBoxes = () => touched().map(id => {
        const el = store.elements.find(e => e.id === id); if (!el) return null;
        const a = worldToScreen(el.x, el.y, store.viewState as any);
        const b = worldToScreen(el.x + el.width, el.y + el.height, store.viewState as any);
        return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
    }).filter(Boolean) as { x: number; y: number; w: number; h: number }[];

    return (
        <Show when={active()}>
            <div class="sb-overlay" onPointerDown={onDown}>
                <svg class="sb-svg">
                    <For each={touchedBoxes()}>
                        {(b) => <rect x={b.x} y={b.y} width={b.w} height={b.h} class={alt() ? 'sb-hit sb-del' : 'sb-hit'} />}
                    </For>
                    <Show when={stroke().length > 1}>
                        <polyline points={strokeScreen()} class={alt() ? 'sb-stroke sb-stroke-del' : 'sb-stroke'} />
                    </Show>
                </svg>
                <div class="sb-hint">{alt() ? 'Delete — drag across shapes to remove' : 'Shape Builder — drag across shapes to merge · hold Alt to delete · Esc to exit'}</div>
            </div>
        </Show>
    );
};
