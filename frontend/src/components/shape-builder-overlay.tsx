import { Show, For, createSignal, onMount, onCleanup } from 'solid-js';
import { store, toggleShapeBuilder, applyPathfinder, deleteElements, getShapeFaces, commitShapeBuilderFaces } from '../store/app-store';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import { hitTestElement } from '../utils/hit-testing';
import { pointInMultiPoly, type ShapeFace } from '../utils/path-boolean';
import type { DrawingElement } from '../types';
import './shape-builder-overlay.css';

/**
 * Face-level Shape Builder. With ≥2 shapes selected and the tool active, the selection is
 * decomposed into atomic *faces* — the maximal regions each bounded by a unique subset of
 * the shapes (so two overlapping circles give three faces: left crescent, lens, right
 * crescent). Drag a stroke across the faces you want: on release they merge into one path
 * (Alt = delete them, carving a notch/hole). Every untouched face is preserved as its own
 * path, exactly like Illustrator. When the shapes don't overlap (or there are too many to
 * decompose) it falls back to whole-shape union/delete. Esc / toggling off exits.
 */
export const ShapeBuilderOverlay = () => {
    const [stroke, setStroke] = createSignal<{ x: number; y: number }[]>([]); // world coords
    const [touched, setTouched] = createSignal<string[]>([]);                 // face keys, or element ids in fallback
    const [alt, setAlt] = createSignal(false);
    let dragging = false;
    let faces: ShapeFace[] = [];      // decomposed faces for the current drag (empty → fallback)
    let faceLevel = false;

    const active = () => store.shapeBuilderActive && store.selection.length >= 2;
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);

    // Faces (or selected shapes in fallback) the stroke passes through.
    const computeTouched = (pts: { x: number; y: number }[]) => {
        const hit = new Set<string>();
        if (faceLevel) {
            for (const p of pts) {
                for (const f of faces) {
                    if (pointInMultiPoly(f.region as any, p.x, p.y)) { hit.add(f.key); break; }
                }
            }
        } else {
            const emap = new Map<string, DrawingElement>();
            for (const el of store.elements) emap.set(el.id, el);
            for (const id of store.selection) {
                const el = emap.get(id);
                if (el && pts.some(p => hitTestElement(el, p.x, p.y, 0, store.elements, emap))) hit.add(id);
            }
        }
        return [...hit];
    };

    const onDown = (e: PointerEvent) => {
        if (!active()) return;
        e.preventDefault();
        setAlt(e.altKey);
        faces = getShapeFaces(store.selection);   // [] when non-overlapping / too many shapes
        faceLevel = faces.length > 0;
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
        const keys = touched();
        if (keys.length) {
            if (faceLevel) {
                commitShapeBuilderFaces(store.selection, keys, alt() ? 'delete' : 'merge');
            } else if (alt()) {
                deleteElements(keys);
            } else if (keys.length >= 2) {
                applyPathfinder(keys, 'union');
            }
        }
        faces = []; faceLevel = false;
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

    // SVG path `d` (screen space) for the highlighted faces — even-odd so holes show through.
    const touchedPath = () => {
        if (!faceLevel) return '';
        const set = new Set(touched());
        let d = '';
        for (const f of faces) {
            if (!set.has(f.key)) continue;
            for (const poly of f.region) {
                for (const ring of poly) {
                    ring.forEach((pt, i) => {
                        const s = worldToScreen(pt[0], pt[1], store.viewState as any);
                        d += `${i === 0 ? 'M' : 'L'}${s.x},${s.y} `;
                    });
                    d += 'Z ';
                }
            }
        }
        return d;
    };

    // Fallback (non-overlapping shapes): axis-aligned bbox highlight per touched element.
    const touchedBoxes = () => {
        if (faceLevel) return [];
        return touched().map(id => {
            const el = store.elements.find(e => e.id === id); if (!el) return null;
            const a = worldToScreen(el.x, el.y, store.viewState as any);
            const b = worldToScreen(el.x + el.width, el.y + el.height, store.viewState as any);
            return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
        }).filter(Boolean) as { x: number; y: number; w: number; h: number }[];
    };

    return (
        <Show when={active()}>
            <div class="sb-overlay" onPointerDown={onDown}>
                <svg class="sb-svg">
                    <Show when={touchedPath()}>
                        <path d={touchedPath()} class={alt() ? 'sb-hit sb-del' : 'sb-hit'} fill-rule="evenodd" />
                    </Show>
                    <For each={touchedBoxes()}>
                        {(b) => <rect x={b.x} y={b.y} width={b.w} height={b.h} class={alt() ? 'sb-hit sb-del' : 'sb-hit'} />}
                    </For>
                    <Show when={stroke().length > 1}>
                        <polyline points={strokeScreen()} class={alt() ? 'sb-stroke sb-stroke-del' : 'sb-stroke'} />
                    </Show>
                </svg>
                <div class="sb-hint">{alt() ? 'Delete — drag across regions to remove' : 'Shape Builder — drag across regions to merge · hold Alt to delete · Esc to exit'}</div>
            </div>
        </Show>
    );
};
