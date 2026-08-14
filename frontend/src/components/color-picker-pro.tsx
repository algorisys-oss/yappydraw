import { type Component, createSignal, createEffect, onMount, Show, For } from 'solid-js';
import { Pipette, Monitor, Square as SquareIcon, Triangle as TriangleIcon } from 'lucide-solid';
import { readJsonArray } from '../utils/safe-storage';
import { startColorEyedropper } from '../store/app-store';
import './color-picker-pro.css';

/**
 * Advanced colour picker with two interactive modes (happypaint / Krita style):
 *  - "Square": a saturation/value box + a hue slider.
 *  - "Triangle": a hue ring around an SV triangle.
 * Plus a hex field, an eyedropper (where the EyeDropper API exists), and recents.
 * Emits sRGB hex via `onChange`; `onStart` is called once when a drag begins so the
 * caller can snapshot history for a single undo step.
 */

// ─── colour maths (sRGB hex ↔ HSV) ───────────────────────
function clamp01(x: number) { return Math.min(1, Math.max(0, x)); }
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    h = ((h % 360) + 360) % 360;
    const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d !== 0) {
        if (max === r) h = 60 * (((g - b) / d) % 6);
        else if (max === g) h = 60 * ((b - r) / d + 2);
        else h = 60 * ((r - g) / d + 4);
    }
    if (h < 0) h += 360;
    return { h, s: max === 0 ? 0 : d / max, v: max };
}
function hsvToHex(h: number, s: number, v: number): string {
    const [r, g, b] = hsvToRgb(h, s, v);
    return '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
}
function hexToRgb(hex: string): [number, number, number] | null {
    let m = hex.replace('#', '').trim();
    if (m.length === 3) m = m.split('').map(c => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(m)) return null;
    return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
}

interface Props {
    value?: string;
    onChange: (hex: string) => void;
    onStart?: () => void;
}

const RECENTS_KEY = 'colorPickerRecents';
const MODE_KEY = 'colorPickerMode';

export const ColorPickerPro: Component<Props> = (props) => {
    const [mode, setMode] = createSignal<'square' | 'triangle'>(
        (localStorage.getItem(MODE_KEY) as 'square' | 'triangle') || 'square');
    const [h, setH] = createSignal(0);
    const [s, setS] = createSignal(1);
    const [v, setV] = createSignal(1);
    const [recents, setRecents] = createSignal<string[]>(
        readJsonArray<string>(RECENTS_KEY));
    let dragging = false;
    let triCanvas: HTMLCanvasElement | undefined;

    // Sync HSV from an externally-set value (not while the user is dragging, so we
    // don't fight their input or lose hue when s/v hit an achromatic edge).
    createEffect(() => {
        const rgb = hexToRgb(props.value || '');
        if (!rgb || dragging) return;
        const c = rgbToHsv(...rgb);
        setH(c.s > 0.001 && c.v > 0.001 ? c.h : h()); // keep hue on greys/blacks
        setS(c.s); setV(c.v);
    });

    const emit = () => props.onChange(hsvToHex(h(), s(), v()));
    const setMode2 = (m: 'square' | 'triangle') => { setMode(m); localStorage.setItem(MODE_KEY, m); };

    // `explicit` matters for the eyedroppers: they call this immediately after onChange, and
    // the h/s/v signals only catch up when the createEffect above re-runs — so reading them
    // here recorded the colour that was selected BEFORE the pick.
    const commitRecent = (explicit?: string) => {
        const hex = explicit ?? hsvToHex(h(), s(), v());
        const next = [hex, ...recents().filter(c => c.toLowerCase() !== hex.toLowerCase())].slice(0, 12);
        setRecents(next);
        try { localStorage.setItem(RECENTS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    };

    // ── generic pointer-drag helper (down → move on window → up) ──
    const drag = (el: HTMLElement, onMove: (px: number, py: number, rect: DOMRect) => void) => (e: PointerEvent) => {
        e.preventDefault(); e.stopPropagation();
        props.onStart?.();
        dragging = true;
        const run = (ev: PointerEvent) => {
            const rect = el.getBoundingClientRect();
            onMove(ev.clientX - rect.left, ev.clientY - rect.top, rect);
            emit();
        };
        run(e);
        const up = () => {
            dragging = false;
            window.removeEventListener('pointermove', run);
            window.removeEventListener('pointerup', up);
            commitRecent();
        };
        window.addEventListener('pointermove', run);
        window.addEventListener('pointerup', up);
    };

    // ── Triangle mode: draw hue ring + SV triangle to a canvas ──
    const RING = 150, R_OUT = 74, R_IN = 58;
    const triVerts = () => {
        // Equilateral triangle inscribed in the inner ring, rotated so the pure-hue
        // vertex sits at the current hue angle on the ring.
        const cx = RING / 2, cy = RING / 2, a0 = (h() - 90) * Math.PI / 180;
        return {
            hue: [cx + R_IN * Math.cos(a0), cy + R_IN * Math.sin(a0)] as [number, number],
            white: [cx + R_IN * Math.cos(a0 + 2 * Math.PI / 3), cy + R_IN * Math.sin(a0 + 2 * Math.PI / 3)] as [number, number],
            black: [cx + R_IN * Math.cos(a0 + 4 * Math.PI / 3), cy + R_IN * Math.sin(a0 + 4 * Math.PI / 3)] as [number, number],
            cx, cy,
        };
    };
    const bary = (px: number, py: number, A: number[], B: number[], C: number[]) => {
        const d = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1]);
        const wa = ((B[1] - C[1]) * (px - C[0]) + (C[0] - B[0]) * (py - C[1])) / d;
        const wb = ((C[1] - A[1]) * (px - C[0]) + (A[0] - C[0]) * (py - C[1])) / d;
        return [wa, wb, 1 - wa - wb];
    };

    createEffect(() => {
        if (mode() !== 'triangle' || !triCanvas) return;
        const ctx = triCanvas.getContext('2d'); if (!ctx) return;
        const N = RING;
        ctx.clearRect(0, 0, N, N);
        // Hue ring
        const img = ctx.createImageData(N, N), d = img.data, cx = N / 2, cy = N / 2;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy), i = (y * N + x) * 4;
            if (r <= R_OUT && r >= R_IN) {
                let ang = Math.atan2(dy, dx) * 180 / Math.PI + 90;
                const [rr, gg, bb] = hsvToRgb(ang, 1, 1);
                d[i] = rr; d[i + 1] = gg; d[i + 2] = bb; d[i + 3] = 255;
            }
        }
        // SV triangle
        const t = triVerts();
        const minX = Math.min(t.hue[0], t.white[0], t.black[0]) | 0, maxX = Math.ceil(Math.max(t.hue[0], t.white[0], t.black[0]));
        const minY = Math.min(t.hue[1], t.white[1], t.black[1]) | 0, maxY = Math.ceil(Math.max(t.hue[1], t.white[1], t.black[1]));
        const [hr, hg, hb] = hsvToRgb(h(), 1, 1);
        for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
            const [wHue, wWhite, wBlack] = bary(x + 0.5, y + 0.5, t.hue, t.white, t.black);
            if (wHue < -0.001 || wWhite < -0.001 || wBlack < -0.001) continue;
            const i = (y * N + x) * 4;
            d[i] = wHue * hr + wWhite * 255;
            d[i + 1] = wHue * hg + wWhite * 255;
            d[i + 2] = wHue * hb + wWhite * 255;
            d[i + 3] = 255;
        }
        ctx.putImageData(img, 0, 0);
        // Handles: hue on ring, sv in triangle
        const a0 = (h() - 90) * Math.PI / 180, rMid = (R_IN + R_OUT) / 2;
        ring: { ctx.beginPath(); ctx.arc(cx + rMid * Math.cos(a0), cy + rMid * Math.sin(a0), 6, 0, Math.PI * 2); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke(); }
        const wWhite = (1 - s()) * v(), wHue = s() * v(), wBlack = 1 - v();
        const hx = wHue * t.hue[0] + wWhite * t.white[0] + wBlack * t.black[0];
        const hy = wHue * t.hue[1] + wWhite * t.white[1] + wBlack * t.black[1];
        ctx.beginPath(); ctx.arc(hx, hy, 6, 0, Math.PI * 2); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
    });

    const onTriDown = (e: PointerEvent) => {
        e.preventDefault(); e.stopPropagation(); props.onStart?.(); dragging = true;
        const run = (ev: PointerEvent) => {
            if (!triCanvas) return;
            const rect = triCanvas.getBoundingClientRect();
            const px = (ev.clientX - rect.left) * (RING / rect.width), py = (ev.clientY - rect.top) * (RING / rect.height);
            const cx = RING / 2, cy = RING / 2, r = Math.hypot(px - cx, py - cy);
            if (r >= R_IN - 4 && r <= R_OUT + 6) {
                setH((Math.atan2(py - cy, px - cx) * 180 / Math.PI + 90 + 360) % 360);
            } else {
                const t = triVerts();
                let [wHue, wWhite, wBlack] = bary(px, py, t.hue, t.white, t.black);
                wHue = Math.max(0, wHue); wWhite = Math.max(0, wWhite); wBlack = Math.max(0, wBlack);
                const sum = wHue + wWhite + wBlack || 1; wHue /= sum; wWhite /= sum; wBlack /= sum;
                setV(clamp01(1 - wBlack));
                setS(clamp01(v() > 0 ? wHue / (wHue + wWhite || 1) : 0));
            }
            emit();
        };
        run(e);
        const up = () => { dragging = false; window.removeEventListener('pointermove', run); window.removeEventListener('pointerup', up); commitRecent(); };
        window.addEventListener('pointermove', run); window.addEventListener('pointerup', up);
    };

    // ── Eyedropper ──
    // Default to picking from the CANVAS, which reads the shape's exact authored colour instead
    // of sampling the screen. The browser's EyeDropper API samples the composited framebuffer,
    // and on a wide-gamut display that hands back the colour re-encoded in P3 primaries while
    // still calling it sRGB — #FF0000 came back as #EA3323 (bug #296). The screen picker stays
    // available as a second button for sampling OUTSIDE the app, where it's the only option.
    const canvasPick = () => {
        props.onStart?.();
        startColorEyedropper((hex) => { props.onChange(hex); commitRecent(hex); });
    };

    const canEyedrop = typeof (window as any).EyeDropper === 'function';
    const eyedrop = async () => {
        try {
            const res = await new (window as any).EyeDropper().open();
            if (res?.sRGBHex) { props.onStart?.(); props.onChange(res.sRGBHex); commitRecent(res.sRGBHex); }
        } catch { /* cancelled */ }
    };

    const applyHex = (raw: string) => {
        const hex = raw.startsWith('#') ? raw : '#' + raw;
        if (hexToRgb(hex)) { props.onStart?.(); props.onChange(hex); }
    };

    onMount(() => { const rgb = hexToRgb(props.value || ''); if (rgb) { const c = rgbToHsv(...rgb); setH(c.h); setS(c.s); setV(c.v); } });

    return (
        <div class="cpp" onPointerDown={(e) => e.stopPropagation()}>
            <div class="cpp-modes">
                <button class={`cpp-mode ${mode() === 'square' ? 'active' : ''}`} title="Square (SV + hue)" onClick={() => setMode2('square')}><SquareIcon size={14} /></button>
                <button class={`cpp-mode ${mode() === 'triangle' ? 'active' : ''}`} title="Triangle (hue ring)" onClick={() => setMode2('triangle')}><TriangleIcon size={14} /></button>
                <div class="cpp-swatch" style={{ background: hsvToHex(h(), s(), v()) }} />
                <button
                    class="cpp-mode"
                    title="Pick a colour from the canvas — exact match"
                    onClick={canvasPick}
                ><Pipette size={14} /></button>
                <Show when={canEyedrop}>
                    <button
                        class="cpp-mode"
                        title="Pick from anywhere on screen (approximate on wide-gamut displays)"
                        onClick={eyedrop}
                    ><Monitor size={14} /></button>
                </Show>
            </div>

            <Show when={mode() === 'square'}>
                <div class="cpp-sv"
                    ref={(el) => { /* set on pointerdown via ref */ (el as any)._pd = drag(el, (px, py, r) => { setS(clamp01(px / r.width)); setV(clamp01(1 - py / r.height)); }); }}
                    onPointerDown={(e) => (e.currentTarget as any)._pd(e)}
                    style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${h()}, 100%, 50%)` }}>
                    <div class="cpp-sv-handle" style={{ left: `${s() * 100}%`, top: `${(1 - v()) * 100}%` }} />
                </div>
                <div class="cpp-hue"
                    ref={(el) => { (el as any)._pd = drag(el, (px, _py, r) => setH(clamp01(px / r.width) * 360)); }}
                    onPointerDown={(e) => (e.currentTarget as any)._pd(e)}>
                    <div class="cpp-hue-handle" style={{ left: `${(h() / 360) * 100}%` }} />
                </div>
            </Show>

            <Show when={mode() === 'triangle'}>
                <canvas class="cpp-tri" ref={triCanvas} width={RING} height={RING} onPointerDown={onTriDown} />
            </Show>

            <div class="cpp-hex">
                <span>#</span>
                <input type="text" value={hsvToHex(h(), s(), v()).replace('#', '')}
                    onChange={(e) => applyHex(e.currentTarget.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') applyHex((e.currentTarget as HTMLInputElement).value); }} />
            </div>

            <Show when={recents().length > 0}>
                <div class="cpp-recents">
                    <For each={recents()}>{(c) => (
                        <button class="cpp-recent" style={{ background: c }} title={c}
                            onClick={() => { props.onStart?.(); props.onChange(c); }} />
                    )}</For>
                </div>
            </Show>
        </div>
    );
};
