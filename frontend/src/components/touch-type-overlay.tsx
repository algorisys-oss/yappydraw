import { Show, createSignal, onMount, onCleanup } from 'solid-js';
import { store, toggleTouchType, setCharTransform } from '../store/app-store';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import { getMeasurementContext, getFontString } from '../utils/text-utils';
import type { DrawingElement } from '../types';
import './touch-type-overlay.css';

/**
 * Touch Type. Select a single-line text element, then click a glyph and drag to move it; [ ]
 * scale and , . rotate the selected glyph. Each glyph keeps its own transform (Illustrator's
 * Touch Type tool). Esc exits.
 */
export const TouchTypeOverlay = () => {
    const [sel, setSel] = createSignal<number>(-1);
    let drag: { idx: number; startW: { x: number; y: number }; base: { dx: number; dy: number } } | null = null;

    const target = (): DrawingElement | undefined => {
        const el = store.elements.find(e => e.id === store.selection[0]);
        return el && (el.type === 'text' || el.type === 'richtext') && !(el.text || '').includes('\n') ? el : undefined;
    };
    const active = () => store.touchTypeActive && !!target();
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);

    // Glyph centres + widths in world coords (mirrors the renderer's per-char layout).
    const glyphBoxes = () => {
        const el = target(); if (!el) return [];
        const ctx = getMeasurementContext(); ctx.font = getFontString(el);
        const chars = [...(el.text || '')];
        const out: { i: number; cx: number; cy: number; w: number }[] = [];
        let adv = el.x + 4;
        const baseY = el.y + el.height / 2;
        chars.forEach((ch, i) => {
            const w = ctx.measureText(ch).width;
            const t = el.charTransforms?.[i] || { dx: 0, dy: 0 };
            out.push({ i, cx: adv + w / 2 + (t.dx || 0), cy: baseY + (t.dy || 0), w });
            adv += w;
        });
        return out;
    };

    const onDown = (e: PointerEvent) => {
        if (!active()) return;
        const el = target()!; const w = toWorld(e);
        let pick = -1, pd = Infinity;
        for (const b of glyphBoxes()) { const d = Math.hypot(b.cx - w.x, b.cy - w.y); if (d < Math.max(b.w, 14) / (1) && d < pd) { pd = d; pick = b.i; } }
        if (pick < 0) return;
        e.preventDefault();
        setSel(pick);
        const t = el.charTransforms?.[pick] || { dx: 0, dy: 0, scale: 1, rot: 0 };
        setCharTransform(el.id, pick, {}, true); // history snapshot
        drag = { idx: pick, startW: w, base: { dx: t.dx || 0, dy: t.dy || 0 } };
    };
    const onMove = (e: PointerEvent) => {
        if (!drag) return;
        const el = target(); if (!el) return;
        const w = toWorld(e);
        setCharTransform(el.id, drag.idx, { dx: drag.base.dx + (w.x - drag.startW.x), dy: drag.base.dy + (w.y - drag.startW.y) });
    };
    const onUp = () => { drag = null; };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        const onKey = (e: KeyboardEvent) => {
            if (!store.touchTypeActive) return;
            const el = target(); const i = sel();
            if (e.key === 'Escape') { e.preventDefault(); toggleTouchType(false); return; }
            if (!el || i < 0) return;
            const t = el.charTransforms?.[i] || { dx: 0, dy: 0, scale: 1, rot: 0 };
            if (e.key === ']') { e.preventDefault(); setCharTransform(el.id, i, { scale: Math.min(5, (t.scale || 1) + 0.1) }, true); }
            else if (e.key === '[') { e.preventDefault(); setCharTransform(el.id, i, { scale: Math.max(0.2, (t.scale || 1) - 0.1) }, true); }
            else if (e.key === '.') { e.preventDefault(); setCharTransform(el.id, i, { rot: (t.rot || 0) + 0.1 }, true); }
            else if (e.key === ',') { e.preventDefault(); setCharTransform(el.id, i, { rot: (t.rot || 0) - 0.1 }, true); }
        };
        window.addEventListener('keydown', onKey);
        onCleanup(() => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('keydown', onKey); });
    });

    const selBox = () => {
        const b = glyphBoxes().find(x => x.i === sel()); if (!b) return null;
        return worldToScreen(b.cx, b.cy, store.viewState as any);
    };

    return (
        <Show when={active()}>
            <div class="tt-overlay" onPointerDown={onDown}>
                <svg class="tt-svg">
                    <Show when={selBox()}>{(s) => <circle cx={s().x} cy={s().y} r={14} class="tt-sel" />}</Show>
                </svg>
                <div class="tt-hint">
                    Touch Type — click a letter &amp; drag to move · [ ] scale · , . rotate
                    <button class="tt-done" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); toggleTouchType(false); }}>Done ✕</button>
                </div>
            </div>
        </Show>
    );
};
