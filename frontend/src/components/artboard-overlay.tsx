import { Show, For, createMemo, onMount, onCleanup } from 'solid-js';
import { isPagedDocType } from '../types/slide-types';
import { store, pushToHistory, updateArtboardLive, setActiveArtboard, deleteArtboard } from '../store/app-store';
import './artboard-overlay.css';

/**
 * On-canvas artboard editor. Each artboard shows a draggable name chip (drag to
 * move the frame; click to select it). The selected artboard gets 8 resize
 * handles. Pure overlay — only the chip and handles take pointer events, so the
 * canvas underneath stays drawable. Hidden in slides mode.
 *
 * Uses the simple pan/scale transform (matching SymmetryOverlay); canvas
 * rotation is not accounted for (artboards stay axis-aligned in world space).
 */
const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
type HandleKey = typeof HANDLES[number];
const MIN = 20;

export const ArtboardOverlay = () => {
    const activeId = () => store.activeArtboardId;
    const setActiveId = setActiveArtboard;

    const scale = () => store.viewState.scale;
    const w2sx = (wx: number) => wx * store.viewState.scale + store.viewState.panX;
    const w2sy = (wy: number) => wy * store.viewState.scale + store.viewState.panY;

    let drag: null | { id: string; mode: 'move' | HandleKey; cx: number; cy: number; pending: boolean; r: { x: number; y: number; width: number; height: number } } = null;

    const startDrag = (id: string, mode: 'move' | HandleKey, e: PointerEvent) => {
        e.preventDefault(); e.stopPropagation();
        const ab = store.artboards.find(a => a.id === id);
        if (!ab) return;
        setActiveId(id);
        // History is pushed lazily on the first real move, so a plain click-to-
        // select doesn't create an undo entry.
        drag = { id, mode, cx: e.clientX, cy: e.clientY, pending: true, r: { x: ab.x, y: ab.y, width: ab.width, height: ab.height } };
    };

    const onMove = (e: PointerEvent) => {
        if (!drag) return;
        if (drag.pending) { pushToHistory(); drag.pending = false; }
        const dxw = (e.clientX - drag.cx) / scale();
        const dyw = (e.clientY - drag.cy) / scale();
        const s = drag.r;
        let { x, y, width, height } = s;
        if (drag.mode === 'move') {
            x = Math.round(s.x + dxw); y = Math.round(s.y + dyw);
        } else {
            const k = drag.mode;
            if (k.includes('w')) { const nw = Math.max(MIN, s.width - dxw); x = Math.round(s.x + (s.width - nw)); width = Math.round(nw); }
            if (k.includes('e')) { width = Math.round(Math.max(MIN, s.width + dxw)); }
            if (k.includes('n')) { const nh = Math.max(MIN, s.height - dyw); y = Math.round(s.y + (s.height - nh)); height = Math.round(nh); }
            if (k.includes('s')) { height = Math.round(Math.max(MIN, s.height + dyw)); }
        }
        updateArtboardLive(drag.id, { x, y, width, height });
    };
    const onUp = () => { drag = null; };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveId(null); };
        window.addEventListener('keydown', onKey);
        // Clicking anything outside the overlay (canvas, panels, toolbar) deselects
        // the artboard. Capture-phase so it runs before the canvas's own handler.
        const onWinDown = (e: PointerEvent) => {
            if (!store.activeArtboardId) return;
            const t = e.target as HTMLElement | null;
            if (!t || !t.closest?.('.artboard-overlay')) setActiveId(null);
        };
        window.addEventListener('pointerdown', onWinDown, true);
        onCleanup(() => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('pointerdown', onWinDown, true);
        });
    });

    // Screen rect for an artboard.
    const rect = (ab: { x: number; y: number; width: number; height: number }) => ({
        left: w2sx(ab.x), top: w2sy(ab.y), w: ab.width * scale(), h: ab.height * scale(),
    });

    const visible = createMemo(() => !isPagedDocType(store.docType) && (store.artboards?.length ?? 0) > 0);

    return (
        <Show when={visible()}>
            <div class="artboard-overlay">
                <For each={store.artboards}>
                    {(ab) => {
                        const r = () => rect(ab);
                        const isActive = () => activeId() === ab.id;
                        return (
                            <>
                                {/* Name chip — drag the name to move; click to select; × deletes.
                                    The × lives in the chip (a handle-free zone) so it can never
                                    overlap a resize handle. */}
                                <div
                                    class={`ab-chip ${isActive() ? 'active' : ''}`}
                                    style={{ left: `${r().left}px`, top: `${r().top - 24}px` }}
                                >
                                    <span
                                        class="ab-chip-name"
                                        title="Drag to move artboard · click to select"
                                        onPointerDown={(e) => startDrag(ab.id, 'move', e)}
                                        onClick={(e) => { e.stopPropagation(); setActiveId(ab.id); }}
                                    >{ab.name}  {Math.round(ab.width)}×{Math.round(ab.height)}</span>
                                    <Show when={isActive()}>
                                        <button
                                            class="ab-chip-del"
                                            title="Delete artboard (Del)"
                                            // Act on pointerdown: a canvas redraw between down/up can
                                            // recreate this node and swallow the synthesized click.
                                            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); deleteArtboard(ab.id); }}
                                        >✕</button>
                                    </Show>
                                </div>

                                <Show when={isActive()}>
                                    {/* Selection frame (visual only; interior stays drawable) */}
                                    <div
                                        class="ab-frame"
                                        style={{ left: `${r().left}px`, top: `${r().top}px`, width: `${r().w}px`, height: `${r().h}px` }}
                                    />
                                    {/* 8 resize handles */}
                                    <For each={HANDLES}>
                                        {(k) => {
                                            const hx = () => r().left + (k.includes('w') ? 0 : k.includes('e') ? r().w : r().w / 2);
                                            const hy = () => r().top + (k.includes('n') ? 0 : k.includes('s') ? r().h : r().h / 2);
                                            return (
                                                <div
                                                    class={`ab-handle ab-${k}`}
                                                    style={{ left: `${hx()}px`, top: `${hy()}px` }}
                                                    onPointerDown={(e) => startDrag(ab.id, k, e)}
                                                />
                                            );
                                        }}
                                    </For>
                                </Show>
                            </>
                        );
                    }}
                </For>
            </div>
        </Show>
    );
};
