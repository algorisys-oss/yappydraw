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
    const [delMode, setDelMode] = createSignal(false); // touch-accessible Merge/Delete toggle (no Alt key on tablets)
    const del = () => alt() || delMode();              // effective "delete" mode
    // Screen position of the pointer, for the ± badge. Tracked whether or not a drag is in
    // progress: the moment you need to know which mode you are in is BEFORE you press.
    const [cursor, setCursor] = createSignal<{ x: number; y: number } | null>(null);
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
        // Cursor and modifier are tracked on every move, not just while dragging — the badge
        // has to be right while you are still deciding where to start the stroke.
        if (!active()) return;
        setCursor({ x: e.clientX, y: e.clientY });
        setAlt(e.altKey);
        if (!dragging) return;
        const w = toWorld(e);
        setStroke(s => { const ns = [...s, w]; setTouched(computeTouched(ns)); return ns; });
    };
    const onUp = () => {
        if (!dragging) return;
        dragging = false;
        const keys = touched();
        if (keys.length) {
            if (faceLevel) {
                commitShapeBuilderFaces(store.selection, keys, del() ? 'delete' : 'merge');
            } else if (del()) {
                deleteElements(keys);
            } else if (keys.length >= 2) {
                applyPathfinder(keys, 'union');
            }
        }
        faces = []; faceLevel = false;
        setStroke([]); setTouched([]);
    };
    // Touch interruption (palm rejection, system gesture) — abort the drag cleanly.
    const onCancel = () => { dragging = false; faces = []; faceLevel = false; setStroke([]); setTouched([]); };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onCancel);
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && store.shapeBuilderActive) { e.preventDefault(); toggleShapeBuilder(false); } };
        // Alt has to be watched on the keyboard as well as on pointer events: pressing or
        // releasing it without moving the mouse changes what the next stroke will do, and
        // reading `altKey` off pointermove alone leaves the badge lying until you twitch.
        const onAltDown = (e: KeyboardEvent) => { if (e.key === 'Alt' || e.altKey) setAlt(true); };
        const onAltUp = (e: KeyboardEvent) => { if (e.key === 'Alt' || !e.altKey) setAlt(false); };
        // Alt+drag is a window-manager gesture on some desktops, which swallows the keyup;
        // resync when focus comes back rather than staying stuck in delete mode.
        const onBlur = () => setAlt(false);
        window.addEventListener('keydown', onKey);
        window.addEventListener('keydown', onAltDown);
        window.addEventListener('keyup', onAltUp);
        window.addEventListener('blur', onBlur);
        onCleanup(() => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onCancel);
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('keydown', onAltDown);
            window.removeEventListener('keyup', onAltUp);
            window.removeEventListener('blur', onBlur);
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
                        <path d={touchedPath()} class={del() ? 'sb-hit sb-del' : 'sb-hit'} fill-rule="evenodd" />
                    </Show>
                    <For each={touchedBoxes()}>
                        {(b) => <rect x={b.x} y={b.y} width={b.w} height={b.h} class={del() ? 'sb-hit sb-del' : 'sb-hit'} />}
                    </For>
                    <Show when={stroke().length > 1}>
                        <polyline points={strokeScreen()} class={del() ? 'sb-stroke sb-stroke-del' : 'sb-stroke'} />
                    </Show>
                </svg>
                {/* Mode badge pinned to the cursor: − while Alt (or the touch toggle) is
                    carving, + while merging. Illustrator puts the same glyph in the cursor
                    itself, which the web cannot do without a bitmap cursor per state. */}
                <Show when={cursor()}>
                    {(c) => (
                        <div
                            class={`sb-badge ${del() ? 'sb-badge-del' : ''}`}
                            style={{ left: `${c().x + 14}px`, top: `${c().y + 16}px` }}
                            aria-hidden="true"
                        >{del() ? '−' : '+'}</div>
                    )}
                </Show>
                <div class="sb-hint">
                    <button
                        class={`sb-mode ${delMode() ? 'sb-mode-del' : ''}`}
                        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); setDelMode(v => !v); }}
                    >{delMode() ? '🗑 Delete' : '⬓ Merge'}</button>
                    <span>{del() ? 'drag across regions to remove' : 'drag across regions to merge · Alt = delete'}</span>
                    <button
                        class="sb-mode sb-done"
                        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); toggleShapeBuilder(false); }}
                    >Done ✕</button>
                </div>
            </div>
        </Show>
    );
};
