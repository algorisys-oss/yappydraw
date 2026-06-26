import { Show, For, createSignal, onMount, onCleanup } from 'solid-js';
import { store, togglePerspectiveGrid, setPerspectiveGrid, projectToPlane } from '../store/app-store';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import './perspective-grid-overlay.css';

/**
 * Perspective Grid (2-point). Draws a horizon with left + right vanishing points and two fans
 * of converging ground/wall lines. Drag either VP along the horizon, or drag the horizon to
 * raise/lower the eye level. With a shape selected, the buttons project it onto a plane
 * (foreshortened toward the VPs via a 4-corner warp). Esc exits.
 */
export const PerspectiveGridOverlay = () => {
    const [drag, setDrag] = createSignal<'left' | 'right' | 'horizon' | null>(null);
    const active = () => store.perspectiveGridActive && !!store.perspectiveGrid;
    const g = () => store.perspectiveGrid!;
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);
    const w2s = (x: number, y: number) => worldToScreen(x, y, store.viewState as any);

    const grab = (which: 'left' | 'right' | 'horizon') => (e: PointerEvent) => { e.preventDefault(); e.stopPropagation(); setDrag(which); };
    const onMove = (e: PointerEvent) => {
        const d = drag(); if (!d) return;
        const w = toWorld(e);
        if (d === 'left') setPerspectiveGrid({ leftVPx: w.x });
        else if (d === 'right') setPerspectiveGrid({ rightVPx: w.x });
        else setPerspectiveGrid({ horizonY: w.y });
    };
    const onUp = () => setDrag(null);

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && store.perspectiveGridActive) { e.preventDefault(); togglePerspectiveGrid(false); } };
        window.addEventListener('keydown', onKey);
        onCleanup(() => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('keydown', onKey); });
    });

    // Build the two converging fans (screen-space line segments) + horizon.
    const lines = () => {
        const gr = g();
        const W = window.innerWidth, H = window.innerHeight;
        const lvp = w2s(gr.leftVPx, gr.horizonY), rvp = w2s(gr.rightVPx, gr.horizonY);
        const segs: { x1: number; y1: number; x2: number; y2: number; cls: string }[] = [];
        const N = 14;
        for (let i = 0; i <= N; i++) {
            const bx = (i / N) * W;            // points across the bottom edge
            segs.push({ x1: lvp.x, y1: lvp.y, x2: bx, y2: H, cls: 'pg-line pg-left' });
            segs.push({ x1: rvp.x, y1: rvp.y, x2: bx, y2: H, cls: 'pg-line pg-right' });
        }
        // a few rays upward too (ceiling) for context
        for (let i = 0; i <= N; i += 2) {
            const bx = (i / N) * W;
            segs.push({ x1: lvp.x, y1: lvp.y, x2: bx, y2: 0, cls: 'pg-line pg-faint' });
            segs.push({ x1: rvp.x, y1: rvp.y, x2: bx, y2: 0, cls: 'pg-line pg-faint' });
        }
        return { segs, lvp, rvp, horizonY: lvp.y, W };
    };

    const hasSel = () => store.selection.length > 0;

    return (
        <Show when={active()}>
            <div class="pg-overlay" classList={{ 'pg-dragging': !!drag() }}>
                <svg class="pg-svg">
                    {(() => { const L = lines(); return <>
                        <For each={L.segs}>{(s) => <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} class={s.cls} />}</For>
                        <line x1={0} y1={L.horizonY} x2={L.W} y2={L.horizonY} class="pg-horizon" onPointerDown={grab('horizon')} />
                        <circle cx={L.lvp.x} cy={L.lvp.y} r={9} class="pg-vp" onPointerDown={grab('left')} />
                        <circle cx={L.rvp.x} cy={L.rvp.y} r={9} class="pg-vp" onPointerDown={grab('right')} />
                    </>; })()}
                </svg>
                <div class="pg-hint">
                    Perspective Grid — drag a vanishing point or the horizon
                    <Show when={hasSel()}>
                        <span class="pg-sep">·</span>
                        <button class="pg-btn" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); projectToPlane([...store.selection], 'left'); }}>◧ Left</button>
                        <button class="pg-btn" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); projectToPlane([...store.selection], 'floor'); }}>▢ Floor</button>
                        <button class="pg-btn" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); projectToPlane([...store.selection], 'right'); }}>◨ Right</button>
                    </Show>
                    <button class="pg-done" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); togglePerspectiveGrid(false); }}>Done ✕</button>
                </div>
            </div>
        </Show>
    );
};
