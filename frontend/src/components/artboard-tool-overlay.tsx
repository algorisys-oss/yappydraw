import { Show, createSignal, onMount, onCleanup } from 'solid-js';
import { store, toggleArtboardTool, createArtboards, openArtboardDialog } from '../store/app-store';
import { windowToWorld, worldToWindow } from '../utils/overlay-transform';
import { t } from '../i18n';
import './artboard-tool-overlay.css';

/** Below this many SCREEN px in either direction a press is a click, not a drag. */
const DRAG_MIN = 6;

type DragState = { sx: number; sy: number; cx: number; cy: number; shift: boolean };

/**
 * Artboard tool (Shift+O, Illustrator's key). Drag on the canvas to draw an artboard of exactly
 * that size (Shift = square). Click without dragging to open the New Artboard dialog: on empty
 * canvas it places the new frame where you clicked; inside an artboard it offers variations
 * (copies with the artwork) of that one. One gesture per activation — the tool hands back to whatever
 * was active, since the next thing after making a frame is drawing in it.
 */
export const ArtboardToolOverlay = () => {
    const active = () => store.artboardToolActive;
    const [drag, setDrag] = createSignal(null as DragState | null);

    const rectWindow = () => {
        const d = drag(); if (!d) return null;
        let w = d.cx - d.sx, h = d.cy - d.sy;
        if (d.shift) { const m = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w || 1) * m; h = Math.sign(h || 1) * m; }
        return { x: Math.min(d.sx, d.sx + w), y: Math.min(d.sy, d.sy + h), w: Math.abs(w), h: Math.abs(h) };
    };
    const rectWorld = () => {
        const r = rectWindow(); if (!r) return null;
        const a = windowToWorld(r.x, r.y), b = windowToWorld(r.x + r.w, r.y + r.h);
        return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) };
    };

    const onDown = (e: PointerEvent) => {
        if (!active() || e.button !== 0) return;
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        setDrag({ sx: e.clientX, sy: e.clientY, cx: e.clientX, cy: e.clientY, shift: e.shiftKey });
    };
    const onMove = (e: PointerEvent) => {
        const d = drag(); if (!d) return;
        setDrag({ ...d, cx: e.clientX, cy: e.clientY, shift: e.shiftKey });
    };
    const onUp = () => {
        const r = rectWindow(), wr = rectWorld();
        const d = drag();
        setDrag(null);
        if (!d || !r || !wr) return;
        toggleArtboardTool(false);
        if (r.w < DRAG_MIN && r.h < DRAG_MIN) {
            // Click inside an artboard = make variations of it; on empty canvas = a new one there.
            const w = windowToWorld(d.sx, d.sy);
            const hit = [...store.artboards].reverse().find(a => w.x >= a.x && w.x <= a.x + a.width && w.y >= a.y && w.y <= a.y + a.height);
            openArtboardDialog(hit ? { sourceId: hit.id } : { x: w.x, y: w.y });
            return;
        }
        createArtboards({ x: Math.round(wr.x), y: Math.round(wr.y), width: Math.max(1, Math.round(wr.width)), height: Math.max(1, Math.round(wr.height)) });
    };

    onMount(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape' || !store.artboardToolActive) return;
            e.preventDefault();
            setDrag(null);
            toggleArtboardTool(false);
        };
        window.addEventListener('keydown', onKey);
        onCleanup(() => window.removeEventListener('keydown', onKey));
    });

    // Existing frames, outlined so you can line a new one up against them.
    const frames = () => store.artboards.map(a => {
        const p = worldToWindow(a.x, a.y), q = worldToWindow(a.x + a.width, a.y + a.height);
        return { id: a.id, x: Math.min(p.x, q.x), y: Math.min(p.y, q.y), w: Math.abs(q.x - p.x), h: Math.abs(q.y - p.y) };
    });

    return (
        <Show when={active()}>
            <div class="abt-overlay" data-testid="artboard-tool-overlay" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => setDrag(null)}>
                <svg class="abt-svg">
                    {frames().map(f => <rect x={f.x} y={f.y} width={f.w} height={f.h} class="abt-existing" />)}
                    <Show when={rectWindow()}>{(r) => <rect x={r().x} y={r().y} width={r().w} height={r().h} class="abt-rect" />}</Show>
                </svg>
                <Show when={rectWindow() && rectWorld()}>
                    <div class="abt-size" style={{ left: `${rectWindow()!.x + rectWindow()!.w + 8}px`, top: `${rectWindow()!.y + rectWindow()!.h + 8}px` }}>
                        {Math.round(rectWorld()!.width)} × {Math.round(rectWorld()!.height)}
                    </div>
                </Show>
                <div class="abt-hint">
                    {t('artboardTool.hint')}
                    <button class="abt-done" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); toggleArtboardTool(false); }}>{t('artboardTool.exit')}</button>
                </div>
            </div>
        </Show>
    );
};
