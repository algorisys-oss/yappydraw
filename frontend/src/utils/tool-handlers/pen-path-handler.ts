/**
 * Pen (vector path) Handler
 * Multi-click tool that builds an editable vector `path` element:
 *   • click              → add a corner anchor
 *   • click-drag         → add a smooth anchor (drag sets symmetric Bézier handles)
 *   • click first anchor → close the path
 *   • Enter / Esc / double-click → finish an open path
 *   • Backspace          → remove the last anchor
 *
 * Internally `pState.penAnchors` are kept relative to the first anchor's world
 * position (`startX/startY`) and may be negative. On every write we re-normalize
 * into the element's `x/y/width/height` + origin-relative `pathAnchors` (matching
 * the createPath convention) — world positions stay stable across normalization.
 */

import type { DrawingElement, PathAnchor } from '../../types';
import type { PointerState } from '../pointer-state';
import type { PointerHelpers, PointerSignals } from '../pointer-helpers';
import { store, addElement, updateElement, setStore, setSelectedTool, pushToHistory } from '../../store/app-store';
import { snapPoint } from '../snap-helpers';
import { generateId } from '../id-generator';

function snap(x: number, y: number): { x: number; y: number } {
    if (store.gridSettings.snapToGrid) return snapPoint(x, y, store.gridSettings.gridSize);
    return { x, y };
}

/**
 * Re-normalize `penAnchors` (+ optional preview anchor) into the element's bbox and
 * origin-relative `pathAnchors`. World positions are invariant: world.x of anchor i
 * = startX + penAnchors[i].x, regardless of the bbox shift.
 */
function writePenElement(pState: PointerState, preview?: PathAnchor | null, closed?: boolean): void {
    if (!pState.currentId) return;
    const anchors = preview ? [...pState.penAnchors, preview] : [...pState.penAnchors];
    if (anchors.length < 1) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const a of anchors) {
        const pts = [
            [a.x, a.y],
            [a.x + (a.outX ?? 0), a.y + (a.outY ?? 0)],
            [a.x + (a.inX ?? 0), a.y + (a.inY ?? 0)],
        ];
        for (const [hx, hy] of pts) {
            minX = Math.min(minX, hx); minY = Math.min(minY, hy);
            maxX = Math.max(maxX, hx); maxY = Math.max(maxY, hy);
        }
    }
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    const norm = anchors.map(a => ({ ...a, x: a.x - minX, y: a.y - minY }));

    const updates: Partial<DrawingElement> = {
        x: pState.startX + minX,
        y: pState.startY + minY,
        width,
        height,
        pathAnchors: norm,
    };
    if (closed !== undefined) updates.pathClosed = closed;
    updateElement(pState.currentId, updates, false);
}

function resetPen(pState: PointerState): void {
    pState.isPenBuilding = false;
    pState.isDrawing = false;
    pState.penAnchors = [];
    pState.penActiveIdx = -1;
    pState.penDragging = false;
    pState.currentId = null;
}

// ─── Pointer Down ────────────────────────────────────────────────────

export function penOnDown(x: number, y: number, pState: PointerState, _helpers: PointerHelpers): void {
    const { x: px, y: py } = snap(x, y);

    if (!pState.isPenBuilding) {
        pushToHistory();
        pState.isPenBuilding = true;
        pState.isDrawing = true;
        pState.startX = px;
        pState.startY = py;
        pState.currentId = generateId('path');
        pState.penAnchors = [{ x: 0, y: 0, kind: 'corner' }];
        pState.penActiveIdx = 0;
        pState.penDragging = true;

        const newElement = {
            ...store.defaultElementStyles,
            id: pState.currentId,
            type: 'path',
            x: px,
            y: py,
            width: 1,
            height: 1,
            seed: Math.floor(Math.random() * 2 ** 31) + 1,
            layerId: store.activeLayerId,
            pathAnchors: [{ x: 0, y: 0, kind: 'corner' as const }],
            pathClosed: false,
            backgroundColor: 'transparent',
        } as DrawingElement;
        addElement(newElement);
        return;
    }

    if (!pState.currentId) return;
    const relX = px - pState.startX;
    const relY = py - pState.startY;

    // Click near the first anchor (origin) → close the path and finish.
    const closeThreshold = 12 / store.viewState.scale;
    if (pState.penAnchors.length >= 2 && Math.hypot(relX, relY) < closeThreshold) {
        writePenElement(pState, null, true);
        setStore('selection', [pState.currentId]);
        resetPen(pState);
        setSelectedTool('selection');
        return;
    }

    pState.penAnchors.push({ x: relX, y: relY, kind: 'corner' });
    pState.penActiveIdx = pState.penAnchors.length - 1;
    pState.penDragging = true;
    writePenElement(pState);
}

// ─── Pointer Move ────────────────────────────────────────────────────

export function penOnMove(x: number, y: number, pState: PointerState, _helpers: PointerHelpers, signals: PointerSignals): void {
    if (!pState.isPenBuilding || !pState.currentId) return;
    signals.setSuggestedBinding(null);
    const { x: px, y: py } = snap(x, y);
    const relX = px - pState.startX;
    const relY = py - pState.startY;

    if (pState.penDragging && pState.penActiveIdx >= 0) {
        // Curving the active anchor: out-handle follows the cursor, in-handle mirrors.
        const a = pState.penAnchors[pState.penActiveIdx];
        const ox = relX - a.x;
        const oy = relY - a.y;
        pState.penAnchors[pState.penActiveIdx] = { ...a, outX: ox, outY: oy, inX: -ox, inY: -oy, kind: 'smooth' };
        writePenElement(pState);
    } else {
        // Rubber-band: preview a segment from the last anchor to the cursor.
        writePenElement(pState, { x: relX, y: relY, kind: 'corner' });
    }
}

// ─── Pointer Up ──────────────────────────────────────────────────────

export function penOnUp(pState: PointerState): void {
    if (!pState.isPenBuilding) return;
    pState.penDragging = false;
    pState.penActiveIdx = -1;
    writePenElement(pState); // drop the drag preview; keep committed anchors
}

// ─── Finalize (Enter / Esc / double-click) ───────────────────────────

export function penFinalize(pState: PointerState): void {
    if (!pState.isPenBuilding || !pState.currentId) return;
    const id = pState.currentId;
    if (pState.penAnchors.length < 2) {
        setStore('elements', els => els.filter(e => e.id !== id));
        resetPen(pState);
        setSelectedTool('selection');
        return;
    }
    writePenElement(pState);
    setStore('selection', [id]);
    resetPen(pState);
    setSelectedTool('selection');
}

// ─── Undo last anchor (Backspace) ────────────────────────────────────

export function penUndo(pState: PointerState): void {
    if (!pState.isPenBuilding || !pState.currentId) return;
    if (pState.penAnchors.length <= 1) {
        const id = pState.currentId;
        setStore('elements', els => els.filter(e => e.id !== id));
        resetPen(pState);
        return;
    }
    pState.penAnchors.pop();
    pState.penActiveIdx = -1;
    pState.penDragging = false;
    writePenElement(pState);
}
