/**
 * Pen (vector path) Handler
 * Multi-click tool that builds an editable vector `path` element:
 *   • click              → add a corner anchor
 *   • click-drag         → add a smooth anchor (drag sets symmetric Bézier handles)
 *   • Shift between clicks → constrain the SEGMENT to 15° increments (straight lines)
 *   • Shift while dragging → constrain the HANDLES to 45° (the Clock Method, below)
 *   • Alt while dragging → break the pair: the out handle moves alone, leaving a cusp
 *   • click first anchor → close the path
 *   • Enter / Esc / double-click → finish an open path
 *   • Backspace          → remove the last anchor
 *
 * Shift means two different things, but never at the same time: mid-drag it shapes the
 * handles of the anchor you are pulling, and between clicks it aims the next segment.
 *
 * Internally `pState.penAnchors` are kept relative to the first anchor's world
 * position (`startX/startY`) and may be negative. On every write we re-normalize
 * into the element's `x/y/width/height` + origin-relative `pathAnchors` (matching
 * the createPath convention) — world positions stay stable across normalization.
 */

import type { DrawingElement, PathAnchor } from '../../types';
import type { PointerState } from '../pointer-state';
import type { PointerHelpers, PointerSignals } from '../pointer-helpers';
import { store, addElement, updateElement, setStore, setSelectedTool, pushToHistory, applyLiveSymmetry } from '../../store/app-store';
import { snapPoint } from '../snap-helpers';
import { generateId } from '../id-generator';
import { setAnchorHandle } from '../anchor-handle';
import { constrainToAngle } from '../angle-constrain';

function snap(x: number, y: number): { x: number; y: number } {
    if (store.gridSettings.snapToGrid) return snapPoint(x, y, store.gridSettings.gridSize);
    return { x, y };
}

/**
 * "Clock Method" / Shift-constrain: snap a Bézier handle vector to the nearest
 * 45° increment (so 12/3/6/9 o'clock plus the diagonals), preserving its length.
 * Illustrator's Shift-while-dragging-handles behaviour; here it's also reachable
 * keyboard-free via the second-finger contact or the on-screen constrain toggle.
 */
export function constrainHandleVec(dx: number, dy: number): { x: number; y: number } {
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) return { x: dx, y: dy };
    const step = Math.PI / 4; // 45°
    const ang = Math.round(Math.atan2(dy, dx) / step) * step;
    return { x: Math.cos(ang) * len, y: Math.sin(ang) * len };
}

/**
 * Where the next anchor goes, in world coords.
 *
 * With the constraint on, the point snaps to the nearest 15° increment from the
 * PREVIOUS anchor — the same increment, and the same precedence over grid snap, that
 * the line/arrow tools use (`drawOnMove`), so a Shift-drawn pen segment lines up with a
 * Shift-drawn line. 15° includes 0/45/90, so horizontal and vertical come out exact.
 *
 * Grid snap and a fixed angle can't both be honoured — snapping the constrained point
 * to the grid is what would bend it back off the angle — so the angle wins, matching
 * the line tool. Without a previous anchor there is no angle to hold, so the very first
 * anchor still grid-snaps.
 */
function placeAnchor(x: number, y: number, pState: PointerState, constrain: boolean): { x: number; y: number } {
    const prev = pState.penAnchors[pState.penAnchors.length - 1];
    if (!constrain || !prev) return snap(x, y);
    const c = constrainToAngle(pState.startX + prev.x, pState.startY + prev.y, x, y, 15);
    return { x: c.x, y: c.y };
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
    pState.penHandleBroken = false;
    pState.currentId = null;
}

// ─── Pointer Down ────────────────────────────────────────────────────

export function penOnDown(x: number, y: number, pState: PointerState, _helpers: PointerHelpers, constrain = false): void {
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
        pState.penHandleBroken = false;

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

    // Close test uses the UNCONSTRAINED point on purpose: holding Shift can aim the
    // candidate anchor away from the first one, and "click the start to close" must not
    // become unreachable just because the segment is being constrained.
    const closeThreshold = 12 / store.viewState.scale;
    if (pState.penAnchors.length >= 2 &&
        Math.hypot(px - pState.startX, py - pState.startY) < closeThreshold) {
        writePenElement(pState, null, true);
        setStore('selection', [pState.currentId]);
        resetPen(pState);
        setSelectedTool('selection');
        return;
    }

    const p = placeAnchor(x, y, pState, constrain);
    const relX = p.x - pState.startX;
    const relY = p.y - pState.startY;

    pState.penAnchors.push({ x: relX, y: relY, kind: 'corner' });
    pState.penActiveIdx = pState.penAnchors.length - 1;
    pState.penDragging = true;
    pState.penHandleBroken = false; // each anchor starts its own drag un-broken
    writePenElement(pState);
}

// ─── Pointer Move ────────────────────────────────────────────────────

export function penOnMove(x: number, y: number, pState: PointerState, _helpers: PointerHelpers, signals: PointerSignals, constrain = false, breakHandle = false): void {
    if (!pState.isPenBuilding || !pState.currentId) return;
    signals.setSuggestedBinding(null);
    const { x: px, y: py } = snap(x, y);
    const relX = px - pState.startX;
    const relY = py - pState.startY;

    if (pState.penDragging && pState.penActiveIdx >= 0) {
        // Curving the active anchor: out-handle follows the cursor, in-handle mirrors.
        const a = pState.penAnchors[pState.penActiveIdx];
        let ox = relX - a.x;
        let oy = relY - a.y;
        if (constrain) { const c = constrainHandleVec(ox, oy); ox = c.x; oy = c.y; }
        // Alt breaks the pair mid-drag: the out handle keeps following the cursor while
        // the in handle stays wherever it had got to, giving the cusp Illustrator's
        // Alt-drag produces. Sticky (see `penHandleBroken`) so letting Alt go doesn't
        // snap the incoming side back into line.
        if (breakHandle) pState.penHandleBroken = true;
        // A fresh anchor arrives as `corner` with no handles; dragging it is what makes it
        // smooth, so promote first and let setAnchorHandle apply the pairing rule. When the
        // pair is broken it stays a corner, which is exactly the cusp we want.
        const next = { ...a, kind: pState.penHandleBroken ? a.kind : ('smooth' as const) };
        setAnchorHandle(next, 'out', ox, oy, { breakPair: pState.penHandleBroken, symmetric: true });
        pState.penAnchors[pState.penActiveIdx] = next;
        writePenElement(pState);
    } else {
        // Rubber-band: preview a segment from the last anchor to the cursor. Constrained
        // here as well as on the click that commits it, so the preview is honest about
        // where the anchor will land.
        const p = placeAnchor(x, y, pState, constrain);
        writePenElement(pState, { x: p.x - pState.startX, y: p.y - pState.startY, kind: 'corner' });
    }
}

// ─── Pointer Up ──────────────────────────────────────────────────────

export function penOnUp(pState: PointerState): void {
    if (!pState.isPenBuilding) return;
    pState.penDragging = false;
    pState.penActiveIdx = -1;
    pState.penHandleBroken = false;
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
    applyLiveSymmetry(id); // live mirror / quadrant / mandala copies
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
