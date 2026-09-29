import { Show, createSignal, onMount, onCleanup } from 'solid-js';
import { store, toggleTypeOnPath, attachTextToPath } from '../store/app-store';
import { windowToWorld, worldToWindow } from '../utils/overlay-transform';
import { hitTestElement } from '../utils/hit-testing';
import { getElementTextPath } from '../utils/text-on-path';
import type { DrawingElement } from '../types';
import { t } from '../i18n';
import './type-on-path-overlay.css';

/**
 * Type on a Path (guided). Hover any path-like element — a Pen path, line/curve, freehand
 * stroke, or a closed shape's outline — it highlights; click it and type into the field that
 * opens at the click. Enter attaches the text (centred on the path the first time), Esc
 * cancels the field, a second Esc exits the tool.
 *
 * "Can carry text" is whatever `getElementTextPath` can walk, so this overlay can never offer
 * an element the renderer would then silently ignore.
 */
export const TypeOnPathOverlay = () => {
    const [hoverId, setHoverId] = createSignal<string>('');
    const [editing, setEditing] = createSignal<{ id: string; sx: number; sy: number; value: string } | null>(null);
    let inputRef: HTMLInputElement | undefined;
    const active = () => store.typeOnPathActive;
    // WINDOW coordinates both ways: this is a fixed, full-window layer while the canvas starts at
    // the dock insets. The canvas-local screenToWorld/worldToScreen this used to call put every
    // hit-test and highlight ~46px/52px off once the toolbar docked (see overlay-transform).
    const toWorld = (e: PointerEvent) => windowToWorld(e.clientX, e.clientY);

    const pick = (w: { x: number; y: number }): DrawingElement | undefined => {
        const emap = new Map<string, DrawingElement>();
        for (const el of store.elements) emap.set(el.id, el);
        // topmost path-bearing element under the point (a little tolerance for thin lines)
        for (let i = store.elements.length - 1; i >= 0; i--) {
            const el = store.elements[i];
            if (el.locked || el.visible === false || !getElementTextPath(el)) continue;
            if (hitTestElement(el, w.x, w.y, 8, store.elements, emap)) return el;
        }
        return undefined;
    };

    const commit = () => {
        const ed = editing();
        if (!ed) return;
        setEditing(null);
        if (ed.value.trim()) attachTextToPath(ed.id, ed.value);
    };

    const onMove = (e: PointerEvent) => {
        if (!active() || editing()) return;
        const el = pick(toWorld(e));
        setHoverId(el?.id || '');
    };
    const onDown = (e: PointerEvent) => {
        if (!active() || e.button !== 0) return;
        e.preventDefault();
        // Clicking elsewhere while the field is open commits it, like leaving a text box.
        if (editing()) { commit(); return; }
        const el = pick(toWorld(e));
        if (!el) return;
        setEditing({ id: el.id, sx: e.clientX, sy: e.clientY, value: el.containerText || '' });
        queueMicrotask(() => { inputRef?.focus(); inputRef?.select(); });
    };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape' || !store.typeOnPathActive) return;
            e.preventDefault();
            if (editing()) setEditing(null);
            else toggleTypeOnPath(false);
        };
        window.addEventListener('keydown', onKey);
        onCleanup(() => { window.removeEventListener('pointermove', onMove); window.removeEventListener('keydown', onKey); });
    });

    // highlight box for the hovered (or edited) element
    const box = () => {
        const id = editing()?.id || hoverId();
        const el = store.elements.find(e => e.id === id); if (!el) return null;
        const a = worldToWindow(el.x, el.y);
        const b = worldToWindow(el.x + el.width, el.y + el.height);
        return { x: Math.min(a.x, b.x) - 4, y: Math.min(a.y, b.y) - 4, w: Math.abs(b.x - a.x) + 8, h: Math.abs(b.y - a.y) + 8 };
    };

    return (
        <Show when={active()}>
            <div class="top-overlay" onPointerDown={onDown}>
                <svg class="top-svg">
                    <Show when={box()}>{(r) => <rect x={r().x} y={r().y} width={r().w} height={r().h} class="top-hl" />}</Show>
                </svg>
                <Show when={editing()}>{(ed) => (
                    <input
                        ref={inputRef}
                        class="top-input"
                        data-testid="type-on-path-input"
                        style={{ left: `${ed().sx}px`, top: `${ed().sy + 12}px` }}
                        placeholder={t('typeOnPath.placeholder')}
                        value={ed().value}
                        onPointerDown={(e) => e.stopPropagation()}
                        onInput={(e) => setEditing({ ...ed(), value: e.currentTarget.value })}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); commit(); }
                        }}
                    />
                )}</Show>
                <div class="top-hint">
                    {t('typeOnPath.hint')}
                    <button class="top-done" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); commit(); toggleTypeOnPath(false); }}>{t('typeOnPath.done')}</button>
                </div>
            </div>
        </Show>
    );
};
