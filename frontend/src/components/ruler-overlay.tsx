import { createEffect, createSignal, For, onCleanup, onMount } from 'solid-js';
import { store, addGuide, updateGuide, removeGuide } from '../store/app-store';

// Thickness of each ruler strip in CSS pixels.
export const RULER_SIZE = 22;

// Pick a "nice" world-unit step (1/2/5 × 10ⁿ) for a major tick so that adjacent
// major ticks land roughly `targetPx` screen pixels apart at the current zoom.
const niceStep = (scale: number, targetPx = 80): number => {
    const raw = targetPx / scale; // world units per target spacing
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const nice = norm >= 5 ? 5 : norm >= 2 ? 2 : 1;
    return nice * mag;
};

interface DragState {
    id: string;
    axis: 'h' | 'v';
    /** True while creating a brand-new guide dragged off a ruler. */
    creating: boolean;
}

/**
 * Photoshop/Figma-style rulers along the top and left edges plus draggable
 * guide lines. Top ruler pulls down horizontal guides; left ruler pulls out
 * vertical guides. Drag a guide back onto its ruler (or double-click it) to
 * delete. Purely an overlay — it never mutates element geometry.
 */
export const RulerOverlay = () => {
    let hRef: HTMLCanvasElement | undefined;
    let vRef: HTMLCanvasElement | undefined;

    const [size, setSize] = createSignal({ w: window.innerWidth, h: window.innerHeight });
    let drag: DragState | null = null;

    const theme = () => (store.resolvedTheme === 'dark' || store.resolvedTheme === 'focus' ? 'dark' : 'light');
    const palette = () => theme() === 'dark'
        ? { bg: '#23262b', border: '#3a3f47', tick: '#5b6672', text: '#9aa0a8' }
        : { bg: '#f6f7f9', border: '#d7dbe0', tick: '#b3b9c0', text: '#6b7280' };

    // World coordinate ⇄ screen (canvas-local) px. The drawing canvas fills the
    // viewport (origin 0,0), so screen px ≈ clientX/Y; rotation is ignored —
    // rulers read the un-rotated axis-aligned grid.
    const worldToScreenX = (wx: number) => wx * store.viewState.scale + store.viewState.panX;
    const worldToScreenY = (wy: number) => wy * store.viewState.scale + store.viewState.panY;
    const screenToWorldX = (sx: number) => (sx - store.viewState.panX) / store.viewState.scale;
    const screenToWorldY = (sy: number) => (sy - store.viewState.panY) / store.viewState.scale;

    const drawRuler = (canvas: HTMLCanvasElement, horizontal: boolean) => {
        const dpr = window.devicePixelRatio || 1;
        const lengthCss = horizontal ? size().w : size().h;
        canvas.width = Math.max(1, Math.round(lengthCss * dpr));
        canvas.height = Math.max(1, Math.round(RULER_SIZE * dpr));
        canvas.style.width = `${lengthCss}px`;
        canvas.style.height = `${RULER_SIZE}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const p = palette();
        const { scale } = store.viewState;

        ctx.clearRect(0, 0, lengthCss, RULER_SIZE);
        ctx.fillStyle = p.bg;
        ctx.fillRect(0, 0, horizontal ? lengthCss : RULER_SIZE, horizontal ? RULER_SIZE : lengthCss);

        // Edge border facing the canvas.
        ctx.strokeStyle = p.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (horizontal) { ctx.moveTo(0, RULER_SIZE - 0.5); ctx.lineTo(lengthCss, RULER_SIZE - 0.5); }
        else { ctx.moveTo(RULER_SIZE - 0.5, 0); ctx.lineTo(RULER_SIZE - 0.5, lengthCss); }
        ctx.stroke();

        const major = niceStep(scale);
        const minor = major / 5;

        const worldStart = horizontal ? screenToWorldX(0) : screenToWorldY(0);
        const worldEnd = horizontal ? screenToWorldX(lengthCss) : screenToWorldY(lengthCss);
        const first = Math.floor(worldStart / minor) * minor;

        ctx.font = '9px system-ui, sans-serif';
        ctx.textBaseline = horizontal ? 'top' : 'middle';
        ctx.textAlign = horizontal ? 'left' : 'center';

        for (let w = first; w <= worldEnd; w += minor) {
            // Guard FP drift so the major test stays exact.
            const isMajor = Math.abs(Math.round(w / major) * major - w) < minor / 2;
            const s = horizontal ? worldToScreenX(w) : worldToScreenY(w);
            if (s < 0 || s > lengthCss) continue;

            const tickLen = isMajor ? RULER_SIZE * 0.55 : RULER_SIZE * 0.3;
            ctx.strokeStyle = p.tick;
            ctx.beginPath();
            if (horizontal) { ctx.moveTo(s + 0.5, RULER_SIZE); ctx.lineTo(s + 0.5, RULER_SIZE - tickLen); }
            else { ctx.moveTo(RULER_SIZE, s + 0.5); ctx.lineTo(RULER_SIZE - tickLen, s + 0.5); }
            ctx.stroke();

            if (isMajor) {
                ctx.fillStyle = p.text;
                const label = String(Math.round(w));
                if (horizontal) {
                    ctx.fillText(label, s + 2, 2);
                } else {
                    // Vertical labels drawn rotated to read along the strip.
                    ctx.save();
                    ctx.translate(RULER_SIZE - tickLen - 2, s);
                    ctx.rotate(-Math.PI / 2);
                    ctx.fillText(label, 0, 0);
                    ctx.restore();
                }
            }
        }
    };

    // Redraw whenever the view, theme, or window size changes.
    createEffect(() => {
        // touch reactive deps
        store.viewState.scale; store.viewState.panX; store.viewState.panY;
        store.resolvedTheme; size();
        if (hRef) drawRuler(hRef, true);
        if (vRef) drawRuler(vRef, false);
    });

    // ── Guide drag handling (creation + move + delete) ───────────────────────
    const onWindowPointerMove = (e: PointerEvent) => {
        if (!drag) return;
        if (drag.axis === 'h') updateGuide(drag.id, screenToWorldY(e.clientY));
        else updateGuide(drag.id, screenToWorldX(e.clientX));
    };

    const onWindowPointerUp = (e: PointerEvent) => {
        if (!drag) return;
        const d = drag;
        drag = null;
        // Released back onto the originating ruler strip → cancel/delete.
        const onRuler = d.axis === 'h' ? e.clientY < RULER_SIZE : e.clientX < RULER_SIZE;
        if (onRuler) removeGuide(d.id);
    };

    const startCreate = (axis: 'h' | 'v', e: PointerEvent) => {
        e.preventDefault();
        const pos = axis === 'h' ? screenToWorldY(e.clientY) : screenToWorldX(e.clientX);
        const id = addGuide(axis, pos);
        drag = { id, axis, creating: true };
    };

    const startMove = (id: string, axis: 'h' | 'v', e: PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        drag = { id, axis, creating: false };
    };

    onMount(() => {
        const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', onResize);
        window.addEventListener('pointermove', onWindowPointerMove);
        window.addEventListener('pointerup', onWindowPointerUp);
        window.addEventListener('pointercancel', onWindowPointerUp);
        onCleanup(() => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('pointermove', onWindowPointerMove);
            window.removeEventListener('pointerup', onWindowPointerUp);
            window.removeEventListener('pointercancel', onWindowPointerUp);
        });
    });

    const guideColor = '#16b9c9';

    return (
        <>
            {/* Guide lines — full-viewport overlay, individual lines catch pointer. */}
            <div style={{ position: 'fixed', inset: '0', 'pointer-events': 'none', 'z-index': 38 }}>
                <For each={store.guides}>
                    {(g) => {
                        const screen = () => g.axis === 'h' ? worldToScreenY(g.pos) : worldToScreenX(g.pos);
                        return (
                            <div
                                title={`${g.axis === 'h' ? 'Y' : 'X'} = ${g.pos}  (drag to ruler to remove)`}
                                onPointerDown={(e) => startMove(g.id, g.axis, e)}
                                onDblClick={(e) => { e.stopPropagation(); removeGuide(g.id); }}
                                style={g.axis === 'h' ? {
                                    position: 'fixed', left: `${RULER_SIZE}px`, right: '0',
                                    top: `${screen() - 3}px`, height: '7px',
                                    cursor: 'row-resize', 'pointer-events': 'auto',
                                    display: 'flex', 'align-items': 'center',
                                } : {
                                    position: 'fixed', top: `${RULER_SIZE}px`, bottom: '0',
                                    left: `${screen() - 3}px`, width: '7px',
                                    cursor: 'col-resize', 'pointer-events': 'auto',
                                    display: 'flex', 'justify-content': 'center',
                                }}
                            >
                                {/* Centered visible line inside the fat hit area. */}
                                <div style={g.axis === 'h'
                                    ? { width: '100%', height: '1px', background: guideColor }
                                    : { height: '100%', width: '1px', background: guideColor }} />
                            </div>
                        );
                    }}
                </For>
            </div>

            {/* Top (horizontal) ruler */}
            <canvas
                ref={hRef}
                onPointerDown={(e) => startCreate('h', e)}
                style={{
                    position: 'fixed', top: '0', left: '0',
                    'z-index': 39, cursor: 'row-resize', 'touch-action': 'none',
                }}
            />
            {/* Left (vertical) ruler */}
            <canvas
                ref={vRef}
                onPointerDown={(e) => startCreate('v', e)}
                style={{
                    position: 'fixed', top: '0', left: '0',
                    'z-index': 39, cursor: 'col-resize', 'touch-action': 'none',
                }}
            />
            {/* Corner box */}
            <div style={{
                position: 'fixed', top: '0', left: '0',
                width: `${RULER_SIZE}px`, height: `${RULER_SIZE}px`,
                background: palette().bg,
                'border-right': `1px solid ${palette().border}`,
                'border-bottom': `1px solid ${palette().border}`,
                'z-index': 40, 'pointer-events': 'none',
            }} />
        </>
    );
};
