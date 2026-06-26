import { Show, createSignal, onMount, onCleanup } from 'solid-js';
import { store, toggleReshapeTool, updateElement, normalizePathElement, pushToHistory, convertToPath } from '../store/app-store';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import type { PathAnchor, DrawingElement } from '../types';
import './reshape-tool-overlay.css';

/**
 * Reshape tool. Grab any point on a path and drag — the nearest anchor follows the cursor and
 * its neighbours follow with a cosine falloff, while the path's endpoints stay pinned (open
 * paths). Bends a path smoothly without touching its ends, like Illustrator's Reshape tool.
 * Non-path shapes are converted to a path on grab. Esc exits.
 */
export const ReshapeToolOverlay = () => {
    const [hl, setHl] = createSignal<{ x: number; y: number } | null>(null); // highlighted grabbed anchor (screen)
    let drag: { id: string; idx: number; base: PathAnchor[]; closed: boolean; startW: { x: number; y: number } } | null = null;
    const SPREAD = 2;       // how many neighbours on each side follow
    const GRAB_TOL = 24;    // screen px

    const active = () => store.reshapeToolActive;
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);

    const candidatePaths = (): DrawingElement[] => {
        const sel = store.selection.map(id => store.elements.find(e => e.id === id)).filter(Boolean) as DrawingElement[];
        const pool = sel.length ? sel : store.elements.filter(e => !e.locked);
        return pool;
    };

    const onDown = (e: PointerEvent) => {
        if (!active() || e.button !== 0) return;
        e.preventDefault();
        const w = toWorld(e);
        // find the nearest path anchor across candidate paths
        let bestId = '', bestIdx = -1, bestD = Infinity;
        for (const el of candidatePaths()) {
            const anchors = el.pathAnchors as PathAnchor[] | undefined;
            if (!anchors) continue;
            for (let i = 0; i < anchors.length; i++) {
                const wx = el.x + anchors[i].x, wy = el.y + anchors[i].y;
                const d = Math.hypot(wx - w.x, wy - w.y);
                if (d < bestD) { bestD = d; bestId = el.id; bestIdx = i; }
            }
        }
        const tol = GRAB_TOL / (store.viewState?.scale ?? 1);
        if (bestIdx < 0 || bestD > tol) {
            // grabbed empty space near a non-path shape → convert it so it can be reshaped next
            const shape = candidatePaths().find(el => el.type !== 'path' && w.x >= el.x && w.x <= el.x + el.width && w.y >= el.y && w.y <= el.y + el.height);
            if (shape) convertToPath([shape.id]);
            return;
        }
        const el = store.elements.find(e => e.id === bestId)!;
        pushToHistory();
        drag = { id: el.id, idx: bestIdx, base: JSON.parse(JSON.stringify(el.pathAnchors)), closed: !!el.pathClosed, startW: w };
        const a = (el.pathAnchors as PathAnchor[])[bestIdx];
        setHl(worldToScreen(el.x + a.x, el.y + a.y, store.viewState as any));
    };

    const onMove = (e: PointerEvent) => {
        if (!drag) return;
        const w = toWorld(e);
        const dx = w.x - drag.startW.x, dy = w.y - drag.startW.y;
        const n = drag.base.length;
        const newAnchors = drag.base.map((a, j) => {
            let d = Math.abs(j - drag!.idx);
            if (drag!.closed) d = Math.min(d, n - d);
            let wgt = d <= SPREAD ? 0.5 * (1 + Math.cos((Math.PI * d) / SPREAD)) : 0; // 1 at grabbed, →0 at spread
            if (!drag!.closed && (j === 0 || j === n - 1) && j !== drag!.idx) wgt = 0;  // pin endpoints
            return wgt > 0 ? { ...a, x: a.x + dx * wgt, y: a.y + dy * wgt } : a;
        });
        updateElement(drag.id, { pathAnchors: newAnchors } as any);
        const moved = newAnchors[drag.idx];
        const el = store.elements.find(el => el.id === drag!.id)!;
        setHl(worldToScreen(el.x + moved.x, el.y + moved.y, store.viewState as any));
    };

    const onUp = () => {
        if (!drag) return;
        normalizePathElement(drag.id);
        drag = null; setHl(null);
    };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && store.reshapeToolActive) { e.preventDefault(); toggleReshapeTool(false); } };
        window.addEventListener('keydown', onKey);
        onCleanup(() => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
            window.removeEventListener('keydown', onKey);
        });
    });

    return (
        <Show when={active()}>
            <div class="rs-overlay" onPointerDown={onDown}>
                <svg class="rs-svg">
                    <Show when={hl()}>{(h) => <circle cx={h().x} cy={h().y} r={6} class="rs-anchor" />}</Show>
                </svg>
                <div class="rs-hint">
                    Reshape — drag a point on a path to bend it (ends stay pinned)
                    <button class="rs-done" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); toggleReshapeTool(false); }}>Done ✕</button>
                </div>
            </div>
        </Show>
    );
};
