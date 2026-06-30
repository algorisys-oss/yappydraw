import { Show, For, createSignal, onMount, onCleanup } from 'solid-js';
import { store, toggleTouchType, setCharTransform } from '../store/app-store';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import { getMeasurementContext, getFontString } from '../utils/text-utils';
import { customFonts, addCustomFontFromFile } from '../utils/custom-fonts';
import type { DrawingElement } from '../types';
import './touch-type-overlay.css';

const BUILTIN_FONTS = [
    { value: 'hand-drawn', label: 'Virgil' },
    { value: 'caveat', label: 'Caveat' },
    { value: 'marker', label: 'Marker' },
    { value: 'sans-serif', label: 'Inter' },
    { value: 'poppins', label: 'Poppins' },
    { value: 'serif', label: 'Merriweather' },
    { value: 'monospace', label: 'Source Code' },
    { value: 'code', label: 'JetBrains' },
];
const ADD_FONT = '__add_font__';

/**
 * Touch Type. Select a single-line text element, then click a glyph and drag to move it; [ ]
 * scale and , . rotate the selected glyph. Each glyph keeps its own transform (Illustrator's
 * Touch Type tool). Esc exits.
 */
export const TouchTypeOverlay = () => {
    const [sel, setSel] = createSignal<number>(-1);
    let drag: { idx: number; startW: { x: number; y: number }; base: { dx: number; dy: number } } | null = null;
    // Active touch points (by pointerId) + the live pinch/rotate gesture, if any.
    const pointers = new Map<number, { x: number; y: number }>();
    let gesture: { idx: number; startDist: number; startAng: number; baseScale: number; baseRot: number } | null = null;

    const curT = (i: number) => target()?.charTransforms?.[i] || { dx: 0, dy: 0, scale: 1, rot: 0 };
    // Shared scale / rotate mutators (used by keyboard, on-screen buttons, and gestures).
    const bumpScale = (d: number) => { const el = target(); const i = sel(); if (!el || i < 0) return; const t = curT(i); setCharTransform(el.id, i, { scale: Math.min(5, Math.max(0.2, (t.scale || 1) + d)) }, true); };
    const bumpRot = (d: number) => { const el = target(); const i = sel(); if (!el || i < 0) return; const t = curT(i); setCharTransform(el.id, i, { rot: (t.rot || 0) + d }, true); };
    const stop = (e: Event) => { e.stopPropagation(); e.preventDefault(); };
    // Per-glyph colour: current value (falls back to the element's text colour) + live apply.
    const glyphColor = () => { const el = target(); const i = sel(); return (i >= 0 && el?.charTransforms?.[i]?.color) || el?.textColor || el?.strokeColor || '#000000'; };
    const setColorLive = (c: string) => { const el = target(); const i = sel(); if (!el || i < 0) return; setCharTransform(el.id, i, { color: c }, false); };
    const snapColor = () => { const el = target(); const i = sel(); if (el && i >= 0) setCharTransform(el.id, i, {}, true); }; // history snapshot before a colour drag
    // Per-glyph font: current value (falls back to the element's font) + setter.
    const glyphFont = () => { const el = target(); const i = sel(); return (i >= 0 && el?.charTransforms?.[i]?.font) || el?.fontFamily || 'hand-drawn'; };
    const setFont = (f: string) => { const el = target(); const i = sel(); if (!el || i < 0) return; setCharTransform(el.id, i, { font: f }, true); };
    let fontFileInput: HTMLInputElement | undefined;
    const onFontFile = async (e: Event) => {
        const input = e.currentTarget as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;
        const font = await addCustomFontFromFile(file);
        setFont(font.key);
    };

    const target = (): DrawingElement | undefined => {
        const el = store.elements.find(e => e.id === store.selection[0]);
        return el && (el.type === 'text' || el.type === 'richtext') && !(el.text || '').includes('\n') ? el : undefined;
    };
    const active = () => store.touchTypeActive && !!target();
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);

    // Glyph centres + widths in world coords (mirrors the renderer's per-char layout).
    const glyphBoxes = () => {
        const el = target(); if (!el) return [];
        const ctx = getMeasurementContext();
        const baseFont = getFontString(el);
        const chars = [...(el.text || '')];
        const out: { i: number; cx: number; cy: number; w: number }[] = [];
        let adv = el.x + 4;
        const baseY = el.y + el.height / 2;
        chars.forEach((ch, i) => {
            const t = el.charTransforms?.[i];
            // Match the renderer: measure each glyph in its own (possibly overridden) font.
            ctx.font = t?.font ? getFontString({ ...el, fontFamily: t.font }) : baseFont;
            const w = ctx.measureText(ch).width;
            out.push({ i, cx: adv + w / 2 + (t?.dx || 0), cy: baseY + (t?.dy || 0), w });
            adv += w;
        });
        return out;
    };

    const twoPts = () => { const v = [...pointers.values()]; return v.length >= 2 ? [v[0], v[1]] as const : null; };
    // Begin a pinch/rotate: anchor on the selected glyph (or the one nearest the pinch centre).
    const startGesture = () => {
        const p = twoPts(); const el = target(); if (!p || !el) return;
        let i = sel();
        if (i < 0) {
            const wc = screenToWorld((p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2, store.viewState as any);
            let pd = Infinity;
            for (const b of glyphBoxes()) { const d = Math.hypot(b.cx - wc.x, b.cy - wc.y); if (d < pd) { pd = d; i = b.i; } }
            if (i >= 0) setSel(i);
        }
        if (i < 0) return;
        const t = curT(i);
        setCharTransform(el.id, i, {}, true); // one history snapshot for the whole gesture
        gesture = {
            idx: i,
            startDist: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1,
            startAng: Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x),
            baseScale: t.scale || 1,
            baseRot: t.rot || 0,
        };
    };

    const onDown = (e: PointerEvent) => {
        if (!active()) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size >= 2) { drag = null; startGesture(); e.preventDefault(); return; } // two-finger pinch/rotate
        const el = target()!; const w = toWorld(e);
        let pick = -1, pd = Infinity;
        for (const b of glyphBoxes()) { const d = Math.hypot(b.cx - w.x, b.cy - w.y); if (d < Math.max(b.w, 14) && d < pd) { pd = d; pick = b.i; } }
        if (pick < 0) return;
        e.preventDefault();
        setSel(pick);
        const t = el.charTransforms?.[pick] || { dx: 0, dy: 0, scale: 1, rot: 0 };
        setCharTransform(el.id, pick, {}, true); // history snapshot
        drag = { idx: pick, startW: w, base: { dx: t.dx || 0, dy: t.dy || 0 } };
    };
    const onMove = (e: PointerEvent) => {
        if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (gesture) {
            const p = twoPts(); const el = target(); if (!p || !el) return;
            const dist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1;
            const ang = Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x);
            const scale = Math.min(5, Math.max(0.2, gesture.baseScale * (dist / gesture.startDist)));
            setCharTransform(el.id, gesture.idx, { scale, rot: gesture.baseRot + (ang - gesture.startAng) }, false);
            return;
        }
        if (!drag) return;
        const el = target(); if (!el) return;
        const w = toWorld(e);
        setCharTransform(el.id, drag.idx, { dx: drag.base.dx + (w.x - drag.startW.x), dy: drag.base.dy + (w.y - drag.startW.y) });
    };
    const onUp = (e: PointerEvent) => {
        pointers.delete(e.pointerId);
        if (pointers.size < 2) gesture = null;
        if (pointers.size === 0) drag = null;
    };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        const onKey = (e: KeyboardEvent) => {
            if (!store.touchTypeActive) return;
            if (e.key === 'Escape') { e.preventDefault(); toggleTouchType(false); return; }
            if (!target() || sel() < 0) return;
            if (e.key === ']') { e.preventDefault(); bumpScale(0.1); }
            else if (e.key === '[') { e.preventDefault(); bumpScale(-0.1); }
            else if (e.key === '.') { e.preventDefault(); bumpRot(0.1); }
            else if (e.key === ',') { e.preventDefault(); bumpRot(-0.1); }
        };
        window.addEventListener('keydown', onKey);
        onCleanup(() => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp); window.removeEventListener('keydown', onKey); });
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
                {/* On-screen scale / rotate controls — keyboard-free, for tablets. Appear by the
                    selected glyph; pinch + two-finger twist also scale/rotate it. */}
                <Show when={sel() >= 0 && selBox()}>
                    {(s) => (
                        <div class="tt-controls" style={{ left: `${s().x}px`, top: `${s().y - 52}px` }}>
                            <button title="Smaller" onPointerDown={(e) => { stop(e); bumpScale(-0.1); }}>A−</button>
                            <button title="Larger" onPointerDown={(e) => { stop(e); bumpScale(0.1); }}>A+</button>
                            <button title="Rotate left" onPointerDown={(e) => { stop(e); bumpRot(-0.1); }}>↺</button>
                            <button title="Rotate right" onPointerDown={(e) => { stop(e); bumpRot(0.1); }}>↻</button>
                            <input class="tt-color" type="color" title="Glyph colour" value={glyphColor()}
                                onPointerDown={(e) => { e.stopPropagation(); snapColor(); }}
                                onInput={(e) => setColorLive(e.currentTarget.value)} />
                            <select class="tt-font" title="Glyph font" value={glyphFont()}
                                onPointerDown={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                    const v = e.currentTarget.value;
                                    if (v === ADD_FONT) { e.currentTarget.value = glyphFont(); fontFileInput?.click(); }
                                    else setFont(v);
                                }}>
                                <For each={BUILTIN_FONTS}>{(f) => <option value={f.value}>{f.label}</option>}</For>
                                <Show when={customFonts().length > 0}>
                                    <For each={customFonts()}>{(f) => <option value={f.key}>{f.label}</option>}</For>
                                </Show>
                                <option value={ADD_FONT}>＋ Add font…</option>
                            </select>
                            <input ref={el => fontFileInput = el} type="file" accept=".ttf,.otf,.woff,.woff2"
                                style={{ display: 'none' }} onChange={onFontFile} />
                        </div>
                    )}
                </Show>
                <div class="tt-hint">
                    Touch Type — tap a letter &amp; drag to move · pinch/twist or buttons to scale &amp; rotate · [ ] , .
                    <button class="tt-done" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); toggleTouchType(false); }}>Done ✕</button>
                </div>
            </div>
        </Show>
    );
};
