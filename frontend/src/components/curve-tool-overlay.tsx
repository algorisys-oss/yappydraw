import { Show, createSignal, onMount, onCleanup } from 'solid-js';
import { store, toggleCurveTool, commitCurvature } from '../store/app-store';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import { catmullRomAnchors } from '../utils/curve-fit';
import { anchorsToPathData } from '../utils/math/path-utils';
import './curve-tool-overlay.css';

/**
 * Curvature tool. Click to drop points; a smooth curve is fitted THROUGH every point and
 * updates live (Illustrator's Curvature tool). The segment to the cursor previews the next
 * point. Click near the first point to close the shape; double-click or Enter to finish an
 * open path; Esc cancels. Built on the Catmull-Rom → Bézier fit.
 */
export const CurveToolOverlay = () => {
    const [pts, setPts] = createSignal<{ x: number; y: number }[]>([]); // world points
    const [cursor, setCursor] = createSignal<{ x: number; y: number } | null>(null);

    const active = () => store.curveToolActive;
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);
    const CLOSE_TOL = 10; // screen px to snap-close onto the first point

    const finish = (closed: boolean) => {
        const p = pts();
        if (p.length >= 2) commitCurvature(p, closed);
        setPts([]); setCursor(null);
    };

    const onDown = (e: PointerEvent) => {
        if (!active() || e.button !== 0) return;
        e.preventDefault();
        const w = toWorld(e);
        const p = pts();
        if (p.length >= 2) {
            const s0 = worldToScreen(p[0].x, p[0].y, store.viewState as any);
            if (Math.hypot(e.clientX - s0.x, e.clientY - s0.y) < CLOSE_TOL) { finish(true); return; }
        }
        setPts([...p, w]);
    };
    const onMove = (e: PointerEvent) => { if (active()) setCursor(toWorld(e)); };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        const onKey = (e: KeyboardEvent) => {
            if (!store.curveToolActive) return;
            if (e.key === 'Escape') { e.preventDefault(); setPts([]); setCursor(null); toggleCurveTool(false); }
            else if (e.key === 'Enter') { e.preventDefault(); finish(false); }
            else if (e.key === 'Backspace') { e.preventDefault(); setPts(p => p.slice(0, -1)); }
        };
        window.addEventListener('keydown', onKey);
        onCleanup(() => { window.removeEventListener('pointermove', onMove); window.removeEventListener('keydown', onKey); });
    });

    // Live preview path: the committed points plus the cursor as a provisional last point.
    const previewD = () => {
        const p = [...pts()];
        const c = cursor();
        if (c && p.length >= 1) p.push(c);
        if (p.length < 2) return '';
        const screen = p.map(w => worldToScreen(w.x, w.y, store.viewState as any));
        return anchorsToPathData(catmullRomAnchors(screen, false), false);
    };
    const dots = () => pts().map(w => worldToScreen(w.x, w.y, store.viewState as any));

    return (
        <Show when={active()}>
            <div class="cv-overlay" onPointerDown={onDown} onDblClick={(e) => { e.preventDefault(); finish(false); }}>
                <svg class="cv-svg">
                    <Show when={previewD()}><path d={previewD()} class="cv-path" /></Show>
                    {dots().map((d, i) => <circle cx={d.x} cy={d.y} r={4} class={i === 0 ? 'cv-dot cv-dot-first' : 'cv-dot'} />)}
                </svg>
                <div class="cv-hint">
                    Curvature — click to add points (curve fits through them) · click the first dot or press Enter to finish · Esc cancels
                    <button class="cv-done" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); finish(false); toggleCurveTool(false); }}>Done ✕</button>
                </div>
            </div>
        </Show>
    );
};
