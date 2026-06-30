import { Show, For, createSignal, onMount, onCleanup } from 'solid-js';
import { store, toggleTouchType, setCharTransforms, touchTypeText } from '../store/app-store';
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
const CONNECTORS = new Set(['line', 'arrow', 'organicBranch', 'bezier']);

/**
 * Touch Type. Works on a standalone single-line text element OR on a shape's
 * single-line label (`containerText`). Select one glyph (click), a range
 * (Shift-click), or many (drag a marquee across them); then drag to move, pinch /
 * twist or the on-screen buttons to scale & rotate, and the colour / font controls
 * to restyle — all applied to every selected glyph. Esc or "Done ✕" exits.
 */
export const TouchTypeOverlay = () => {
    const [selSet, setSelSet] = createSignal<Set<number>>(new Set());
    let anchor = -1; // range anchor for Shift-click
    const [marquee, setMarquee] = createSignal<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
    let marqueeAdd = false;
    // Drag (move all selected) + pinch/rotate gesture state, capturing per-glyph bases.
    let drag: { startW: { x: number; y: number }; bases: Map<number, { dx: number; dy: number }> } | null = null;
    const pointers = new Map<number, { x: number; y: number }>();
    let gesture: { startDist: number; startAng: number; bases: Map<number, { scale: number; rot: number }> } | null = null;

    const target = (): DrawingElement | undefined => {
        const el = store.elements.find(e => e.id === store.selection[0]);
        if (!el) return undefined;
        const isText = el.type === 'text' || el.type === 'richtext';
        const txt = touchTypeText(el);
        if (!txt || txt.includes('\n')) return undefined;
        if (!isText && (CONNECTORS.has(el.type) || !el.containerText)) return undefined; // shape labels only
        return el;
    };
    const active = () => store.touchTypeActive && !!target();
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);
    const selArr = () => [...selSet()].sort((a, b) => a - b);
    const curT = (i: number) => target()?.charTransforms?.[i] || { dx: 0, dy: 0, scale: 1, rot: 0 };
    const stop = (e: Event) => { e.stopPropagation(); e.preventDefault(); };
    const twoPts = () => { const v = [...pointers.values()]; return v.length >= 2 ? [v[0], v[1]] as const : null; };

    // Glyph centres + widths in world coords (mirrors RenderPipeline.renderTouchTypeLine:
    // text elements are left-anchored, shape labels are centred).
    const glyphBoxes = () => {
        const el = target(); if (!el) return [];
        const isText = el.type === 'text' || el.type === 'richtext';
        const ctx = getMeasurementContext();
        const baseFont = getFontString(el);
        const chars = [...touchTypeText(el)];
        const widths: number[] = [];
        let total = 0;
        for (let i = 0; i < chars.length; i++) {
            const t = el.charTransforms?.[i];
            ctx.font = t?.font ? getFontString({ ...el, fontFamily: t.font }) : baseFont;
            const w = ctx.measureText(chars[i]).width; widths.push(w); total += w;
        }
        const baseY = el.y + el.height / 2;
        let adv = isText ? el.x + 4 : (el.x + el.width / 2 - total / 2);
        const out: { i: number; cx: number; cy: number; w: number }[] = [];
        for (let i = 0; i < chars.length; i++) {
            const t = el.charTransforms?.[i];
            const w = widths[i];
            out.push({ i, cx: adv + w / 2 + (t?.dx || 0), cy: baseY + (t?.dy || 0), w });
            adv += w;
        }
        return out;
    };

    // Span-based hit-test: a click anywhere inside a glyph's column (its x-range)
    // and within the text's vertical band selects it — far more forgiving than the
    // old distance-to-centre test, which missed when you clicked high/low on a tall
    // letter (the cause of "sometimes selects, sometimes doesn't"). Falls back to the
    // nearest glyph centre within a loose radius for clicks just past the ends.
    const hitGlyph = (w: { x: number; y: number }) => {
        const el = target(); if (!el) return -1;
        const fs = el.fontSize || 28;
        const halfH = Math.max(fs * 0.75, 14);   // text row band
        let pick = -1, best = Infinity;
        for (const b of glyphBoxes()) {
            const dx = Math.abs(w.x - b.cx), dy = Math.abs(w.y - b.cy);
            const halfW = Math.max(b.w / 2, 7) + 3;
            if (dx <= halfW && dy <= halfH && dx < best) { best = dx; pick = b.i; }
        }
        if (pick < 0) { // loose fallback near the ends / between widely-moved glyphs
            let pd = Infinity;
            for (const b of glyphBoxes()) {
                const d = Math.hypot(b.cx - w.x, b.cy - w.y);
                if (d < Math.max(b.w, 18) && d < pd) { pd = d; pick = b.i; }
            }
        }
        return pick;
    };

    // ── Controls — apply to every selected glyph ──
    const applyAll = (patch: any, record: boolean) => { const el = target(); const ids = selArr(); if (el && ids.length) setCharTransforms(el.id, ids, patch, record); };
    const bumpScale = (d: number) => applyAll((_i: number, cur: any) => ({ scale: Math.min(5, Math.max(0.2, (cur.scale || 1) + d)) }), true);
    const bumpRot = (d: number) => applyAll((_i: number, cur: any) => ({ rot: (cur.rot || 0) + d }), true);
    const setColorLive = (c: string) => applyAll({ color: c }, false);
    const snapColor = () => applyAll({}, true);
    const setFont = (f: string) => applyAll({ font: f }, true);
    const firstSel = () => selArr()[0] ?? -1;
    const glyphColor = () => { const el = target(); const i = firstSel(); return (i >= 0 && el?.charTransforms?.[i]?.color) || el?.textColor || el?.strokeColor || '#000000'; };
    const glyphFont = () => { const el = target(); const i = firstSel(); return (i >= 0 && el?.charTransforms?.[i]?.font) || el?.fontFamily || 'hand-drawn'; };

    let fontFileInput: HTMLInputElement | undefined;
    const onFontFile = async (e: Event) => {
        const input = e.currentTarget as HTMLInputElement;
        const file = input.files?.[0]; input.value = '';
        if (!file) return;
        const font = await addCustomFontFromFile(file);
        setFont(font.key);
    };

    const startGesture = () => {
        const p = twoPts(); const el = target(); if (!p || !el) return;
        if (selSet().size === 0) {
            const wc = screenToWorld((p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2, store.viewState as any);
            const i = hitGlyph(wc); if (i >= 0) { setSelSet(new Set([i])); anchor = i; }
        }
        const ids = selArr(); if (!ids.length) return;
        setCharTransforms(el.id, ids, {}, true); // one history snapshot for the gesture
        const bases = new Map<number, { scale: number; rot: number }>();
        for (const i of ids) { const t = curT(i); bases.set(i, { scale: t.scale || 1, rot: t.rot || 0 }); }
        gesture = { startDist: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1, startAng: Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x), bases };
    };

    const onDown = (e: PointerEvent) => {
        if (!active()) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size >= 2) { drag = null; setMarquee(null); startGesture(); e.preventDefault(); return; }
        const el = target()!; const w = toWorld(e);
        const pick = hitGlyph(w);
        if (pick < 0) {
            // Empty space → begin a rubber-band selection (Shift/Ctrl/Cmd adds to the set).
            marqueeAdd = e.shiftKey || e.ctrlKey || e.metaKey;
            setMarquee({ x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY });
            e.preventDefault();
            return;
        }
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd-click toggles an individual glyph (discontiguous selection).
            const next = new Set(selSet());
            if (next.has(pick)) next.delete(pick); else next.add(pick);
            setSelSet(next);
            anchor = pick;
            return;
        }
        if (e.shiftKey) {
            if (anchor < 0) anchor = pick;
            const lo = Math.min(anchor, pick), hi = Math.max(anchor, pick);
            const next = new Set(selSet());
            for (let i = lo; i <= hi; i++) next.add(i);
            setSelSet(next);
            return; // shift-click selects a contiguous range, doesn't drag
        }
        // Plain click → select ONLY this glyph and drag just it. Dragging always
        // moves exactly the letter you grabbed — no surprise group-move from a
        // selection left over from an earlier marquee/Shift-select. (Multi-select
        // via Shift/Ctrl/marquee is still used by the style controls above.)
        setSelSet(new Set([pick]));
        anchor = pick;
        setCharTransforms(el.id, [pick], {}, true); // history snapshot
        const t = curT(pick);
        drag = { startW: w, bases: new Map([[pick, { dx: t.dx || 0, dy: t.dy || 0 }]]) };
    };

    const onMove = (e: PointerEvent) => {
        if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (marquee()) { setMarquee({ ...marquee()!, x1: e.clientX, y1: e.clientY }); return; }
        if (gesture) {
            const p = twoPts(); const el = target(); if (!p || !el) return;
            const dist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1;
            const ang = Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x);
            const ratio = dist / gesture.startDist, dAng = ang - gesture.startAng;
            setCharTransforms(el.id, [...gesture.bases.keys()], (i: number) => {
                const b = gesture!.bases.get(i)!;
                return { scale: Math.min(5, Math.max(0.2, b.scale * ratio)), rot: b.rot + dAng };
            }, false);
            return;
        }
        if (!drag) return;
        const el = target(); if (!el) return;
        const w = toWorld(e); const ddx = w.x - drag.startW.x, ddy = w.y - drag.startW.y;
        setCharTransforms(el.id, [...drag.bases.keys()], (i: number) => {
            const b = drag!.bases.get(i)!;
            return { dx: b.dx + ddx, dy: b.dy + ddy };
        }, false);
    };

    const onUp = (e: PointerEvent) => {
        if (marquee()) {
            const m = marquee()!;
            const minX = Math.min(m.x0, m.x1), maxX = Math.max(m.x0, m.x1), minY = Math.min(m.y0, m.y1), maxY = Math.max(m.y0, m.y1);
            if (Math.abs(m.x1 - m.x0) < 4 && Math.abs(m.y1 - m.y0) < 4) {
                // A plain click (no drag) on empty space: outside the element → exit
                // Touch Type; inside but between letters → just deselect.
                const el = target();
                const w = screenToWorld(m.x0, m.y0, store.viewState as any);
                const outside = !el || w.x < el.x || w.x > el.x + el.width || w.y < el.y || w.y > el.y + el.height;
                setMarquee(null);
                if (outside && !marqueeAdd) { toggleTouchType(false); return; }
                if (!marqueeAdd) { setSelSet(new Set<number>()); anchor = -1; }
            } else {
                const next = marqueeAdd ? new Set(selSet()) : new Set<number>();
                for (const b of glyphBoxes()) {
                    const s = worldToScreen(b.cx, b.cy, store.viewState as any);
                    if (s.x >= minX && s.x <= maxX && s.y >= minY && s.y <= maxY) next.add(b.i);
                }
                setSelSet(next);
                anchor = selArr()[0] ?? -1;
            }
            setMarquee(null);
        }
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
            if (e.key.toLowerCase() === 'a' && (e.ctrlKey || e.metaKey)) {
                const el = target(); if (el) { e.preventDefault(); const n = [...touchTypeText(el)].length; setSelSet(new Set(Array.from({ length: n }, (_, i) => i))); anchor = 0; }
                return;
            }
            if (!target() || selSet().size === 0) return;
            if (e.key === ']') { e.preventDefault(); bumpScale(0.1); }
            else if (e.key === '[') { e.preventDefault(); bumpScale(-0.1); }
            else if (e.key === '.') { e.preventDefault(); bumpRot(0.1); }
            else if (e.key === ',') { e.preventDefault(); bumpRot(-0.1); }
        };
        window.addEventListener('keydown', onKey);
        onCleanup(() => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp); window.removeEventListener('keydown', onKey); });
    });

    const selScreens = () => glyphBoxes().filter(b => selSet().has(b.i)).map(b => worldToScreen(b.cx, b.cy, store.viewState as any));
    const controlPos = () => { const ss = selScreens(); if (!ss.length) return null; const cx = ss.reduce((a, s) => a + s.x, 0) / ss.length; const minY = Math.min(...ss.map(s => s.y)); return { x: cx, y: minY }; };
    const marqueeRect = () => { const m = marquee(); if (!m) return null; return { left: Math.min(m.x0, m.x1), top: Math.min(m.y0, m.y1), w: Math.abs(m.x1 - m.x0), h: Math.abs(m.y1 - m.y0) }; };

    return (
        <Show when={active()}>
            <div class="tt-overlay" onPointerDown={onDown} onContextMenu={(e) => e.preventDefault()}>
                <svg class="tt-svg">
                    <For each={selScreens()}>{(s) => <circle cx={s.x} cy={s.y} r={13} class="tt-sel" />}</For>
                </svg>
                <Show when={marqueeRect()}>
                    {(r) => <div class="tt-marquee" style={{ left: `${r().left}px`, top: `${r().top}px`, width: `${r().w}px`, height: `${r().h}px` }} />}
                </Show>
                <Show when={selSet().size > 0 && controlPos()}>
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
                    Touch Type — click a letter · Shift-click a range · Ctrl/⌘-click to add any letter · or drag a box · then drag / [ ] / , . to move, scale, rotate ·
                    <button class="tt-done" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); toggleTouchType(false); }}>Done ✕</button>
                </div>
            </div>
        </Show>
    );
};
