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
 *   • Ctrl/Cmd + click anywhere  → finish an open path AND stay on the Pen
 *   • Backspace / Ctrl+Z → remove the last anchor (see `penUndo`)
 *   • click either END of an existing open path → RESUME it (see below)
 *
 * Resuming an open path: finishing with Enter/Esc/tool-switch leaves the path on the
 * canvas as an ordinary element, so "pause" needs nothing special. To pick it up again,
 * choose the Pen and click on either end anchor: building restarts from that anchor, the
 * rubber-band picks up where you left off, and clicking the OTHER end closes the shape.
 * Clicking the first anchor resumes backwards — the anchor list is reversed (with each
 * anchor's in/out handles swapped so the curve is unchanged) so that new anchors still
 * append at the tail.
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
import { store, addElement, updateElement, setStore, setSelectedTool, pushToHistory, applyLiveSymmetry, perspectiveSnapActive, setPerspectiveSnapGuide, isLayerLocked, isLayerVisible, setPenResumeHint } from '../../store/app-store';
import { showToast } from '../../components/toast';
import { snapPoint } from '../snap-helpers';
import { generateId } from '../id-generator';
import { setAnchorHandle } from '../anchor-handle';
import { constrainToAngle } from '../angle-constrain';
import { snapPointToPerspective, snapVectorToPerspective } from '../perspective-snap';

function snap(x: number, y: number): { x: number; y: number } {
    if (store.gridSettings.snapToGrid) return snapPoint(x, y, store.gridSettings.gridSize, store.gridSettings.style);
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
function placeAnchor(x: number, y: number, pState: PointerState, constrain: boolean, suppressPerspective = false): { x: number; y: number } {
    const prev = pState.penAnchors[pState.penAnchors.length - 1];
    if (constrain && prev) {
        const c = constrainToAngle(pState.startX + prev.x, pState.startY + prev.y, x, y, 15);
        return { x: c.x, y: c.y };
    }
    // Perspective soft-snap: same precedence as the 15° constraint (it beats grid snap),
    // but it never fires on the first anchor — there is no segment to aim yet.
    const pg = (prev && !suppressPerspective) ? perspectiveSnapActive() : null;
    if (pg) {
        const s = snapPointToPerspective(pg, pState.startX + prev.x, pState.startY + prev.y, x, y);
        setPerspectiveSnapGuide(s.guide);
        if (s.guide) return { x: s.x, y: s.y };
    } else {
        setPerspectiveSnapGuide(null);
    }
    return snap(x, y);
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

/**
 * Drop building state that points at an element which no longer exists.
 *
 * The Pen's building state (`isPenBuilding`, `currentId`, `penAnchors`) lives in a
 * module-level `pState`, but the element it writes to lives in the store — and the store
 * can be rewound underneath it. A global undo mid-path restores a snapshot from before the
 * path existed, so `currentId` names a deleted element while `isPenBuilding` stays true.
 * Every later click then took the "continue the current path" branch and wrote to nothing:
 * the Pen looked dead until the user pressed Escape (which reset the state as a side
 * effect). That is the reported "Undo makes the Pen stop working for a while".
 *
 * Called from every entry point rather than hooked to undo specifically, so ANY removal —
 * undo, redo, deleting the element, a script, a layer being cleared — heals on the next
 * interaction instead of wedging the tool.
 */
function penDropIfOrphaned(pState: PointerState): void {
    if (!pState.isPenBuilding || !pState.currentId) return;
    if (store.elements.some(e => e.id === pState.currentId)) return;
    resetPen(pState);
}

function resetPen(pState: PointerState): void {
    setPerspectiveSnapGuide(null);
    setPenResumeHint(null);
    pState.isPenBuilding = false;
    pState.isDrawing = false;
    pState.penAnchors = [];
    pState.penActiveIdx = -1;
    pState.penDragging = false;
    pState.penHandleBroken = false;
    pState.currentId = null;
}

// ─── Resume an existing open path ────────────────────────────────────

/** An open path whose end anchor is under the pointer, ready to be continued. */
export interface PenResumeTarget {
    id: string;
    /** true = the LAST anchor was clicked (append forward); false = the FIRST (resume backwards). */
    atEnd: boolean;
    /** World position of that end anchor — used for the hover ring. */
    x: number;
    y: number;
}

/**
 * Can this element be picked back up by the Pen?
 *
 * Deliberately conservative. A rotated path stores its anchors in unrotated local space,
 * so appending a world-space click to one would drop the anchor in the wrong place;
 * a compound path (`pathSubpaths`) has several ends and no single "the" end to continue.
 * Both are refused rather than guessed at — the user can still edit them with the Node tool.
 */
function canResume(el: DrawingElement): boolean {
    if (el.type !== 'path' || el.pathClosed) return false;
    if (!el.pathAnchors || el.pathAnchors.length < 2) return false;
    if ((el.pathSubpaths?.length ?? 0) > 1) return false;
    if (el.angle) return false;
    if (el.locked || el.visible === false) return false;
    return !isLayerLocked(el.layerId) && isLayerVisible(el.layerId);
}

/**
 * The open-path end anchor under `(x, y)`, or null. Searched topmost-first so the
 * hit matches what the user sees, and the LAST anchor wins a tie with the first —
 * continuing forwards is the common case.
 */
export function findPenResumeTarget(x: number, y: number, tol: number): PenResumeTarget | null {
    for (let i = store.elements.length - 1; i >= 0; i--) {
        const el = store.elements[i];
        if (!canResume(el)) continue;
        const anchors = el.pathAnchors!;
        const last = anchors[anchors.length - 1];
        const first = anchors[0];
        const lx = el.x + last.x, ly = el.y + last.y;
        if (Math.hypot(x - lx, y - ly) <= tol) return { id: el.id, atEnd: true, x: lx, y: ly };
        const fx = el.x + first.x, fy = el.y + first.y;
        if (Math.hypot(x - fx, y - fy) <= tol) return { id: el.id, atEnd: false, x: fx, y: fy };
    }
    return null;
}

/** Reverse an anchor list, swapping each anchor's in/out handles so the curve is identical. */
function reverseAnchors(anchors: PathAnchor[]): PathAnchor[] {
    return [...anchors].reverse().map(a => ({
        ...a,
        inX: a.outX, inY: a.outY,
        outX: a.inX, outY: a.inY,
    }));
}

/**
 * Re-enter building mode on an existing open path, with the clicked end as the tail.
 *
 * `penAnchors` are stored relative to `startX/startY` (= the world position of anchor 0),
 * which is also what the close test measures against — so after resuming, clicking the
 * far end of the path closes it, exactly as it would have during the original session.
 */
export function penResume(target: PenResumeTarget, pState: PointerState): boolean {
    const el = store.elements.find(e => e.id === target.id);
    if (!el || !canResume(el)) return false;

    pushToHistory();
    const anchors = target.atEnd ? el.pathAnchors!.map(a => ({ ...a })) : reverseAnchors(el.pathAnchors!);
    const head = anchors[0];

    pState.isPenBuilding = true;
    pState.isDrawing = true;
    pState.currentId = el.id;
    pState.startX = el.x + head.x;
    pState.startY = el.y + head.y;
    pState.penAnchors = anchors.map(a => ({ ...a, x: a.x - head.x, y: a.y - head.y }));
    // -1 / false: the click that resumed must not curve the end anchor. Dragging it would
    // rewrite handles the user already placed, and they only asked to continue the path.
    pState.penActiveIdx = -1;
    pState.penDragging = false;
    pState.penHandleBroken = false;

    setStore('selection', [el.id]);
    setPenResumeHint(null);
    writePenElement(pState); // re-writes the (reversed) anchor order and re-normalizes the bbox
    return true;
}

// ─── Pointer Down ────────────────────────────────────────────────────

export function penOnDown(x: number, y: number, pState: PointerState, _helpers: PointerHelpers, constrain = false, suppressPerspective = false, finishOpen = false): void {
    penDropIfOrphaned(pState);   // an undo may have removed the path we were building
    const { x: px, y: py } = snap(x, y);

    // Ctrl/Cmd + click ends the path where it is, OPEN, without adding an anchor there —
    // Photoshop's "click away to drop the pen". Enter/Esc/double-click already did this,
    // but all three are keyboard-or-timing gestures and none of them is discoverable while
    // your hand is on the stylus, so open paths read as impossible: users fell back to
    // drawing the curve with a liner brush, which then behaves like a stroke and not a path.
    // Unlike the other three this keeps the Pen selected, so a run of separate open curves
    // is one continuous gesture instead of re-picking the tool between each.
    if (finishOpen && pState.isPenBuilding) {
        penFinalize(pState, { keepTool: true });
        return;
    }

    if (!pState.isPenBuilding) {
        // Continuing an existing open path beats starting a new one on top of its end
        // anchor. Same 12px tolerance as the close test, so "click the end to continue"
        // and "click the start to close" feel like one gesture.
        const resumeTol = 12 / store.viewState.scale;
        const resume = findPenResumeTarget(x, y, resumeTol);
        if (resume && penResume(resume, pState)) {
            showToast('Continuing the path — click the other end to close it', 'info');
            return;
        }

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

    const p = placeAnchor(x, y, pState, constrain, suppressPerspective);
    const relX = p.x - pState.startX;
    const relY = p.y - pState.startY;

    pState.penAnchors.push({ x: relX, y: relY, kind: 'corner' });
    pState.penActiveIdx = pState.penAnchors.length - 1;
    pState.penDragging = true;
    pState.penHandleBroken = false; // each anchor starts its own drag un-broken
    writePenElement(pState);
}

// ─── Pointer Move ────────────────────────────────────────────────────

export function penOnMove(x: number, y: number, pState: PointerState, _helpers: PointerHelpers, signals: PointerSignals, constrain = false, breakHandle = false, suppressPerspective = false): void {
    penDropIfOrphaned(pState);
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
        else if (!suppressPerspective) {
            // Aim the handle down a perspective ray. This is the part that makes the grid
            // useful for curves: the tangent leaving an anchor is what reads as "in
            // perspective", and a soft pull keeps the curve drawable rather than locking it.
            const pg = perspectiveSnapActive();
            if (pg) {
                const s = snapVectorToPerspective(pg, pState.startX + a.x, pState.startY + a.y, ox, oy);
                setPerspectiveSnapGuide(s.guide);
                if (s.guide) { ox = s.dx; oy = s.dy; }
            } else {
                setPerspectiveSnapGuide(null);
            }
        }
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
        const p = placeAnchor(x, y, pState, constrain, suppressPerspective);
        writePenElement(pState, { x: p.x - pState.startX, y: p.y - pState.startY, kind: 'corner' });
    }
}

// ─── Pointer Up ──────────────────────────────────────────────────────

export function penOnUp(pState: PointerState): void {
    penDropIfOrphaned(pState);
    if (!pState.isPenBuilding) return;
    pState.penDragging = false;
    pState.penActiveIdx = -1;
    pState.penHandleBroken = false;
    writePenElement(pState); // drop the drag preview; keep committed anchors
}

// ─── Finalize (Enter / Esc / double-click) ───────────────────────────

export function penFinalize(pState: PointerState, opts: { keepTool?: boolean } = {}): void {
    penDropIfOrphaned(pState);
    if (!pState.isPenBuilding || !pState.currentId) return;
    const id = pState.currentId;
    // `keepTool` = finished by the Ctrl/Cmd-click gesture, which exists to draw several
    // open paths in a row; dropping back to Selection after each one is what it avoids.
    const done = () => { if (!opts.keepTool) setSelectedTool('selection'); };
    if (pState.penAnchors.length < 2) {
        setStore('elements', els => els.filter(e => e.id !== id));
        resetPen(pState);
        done();
        return;
    }
    writePenElement(pState);
    applyLiveSymmetry(id); // live mirror / quadrant / mandala copies
    setStore('selection', [id]);
    resetPen(pState);
    done();
}

// ─── Undo last anchor (Backspace / Ctrl+Z) ───────────────────────────

/**
 * Step back ONE anchor.
 *
 * Also bound to Ctrl/Cmd+Z while a path is being built (see `handlePenKeys`). The global
 * undo treats the whole in-progress path as a single history entry — it was pushed once,
 * on the first click — so pressing Ctrl+Z after five anchors threw away all five and left
 * the Pen pointing at a deleted element. Reaching for Undo mid-path is the reflex; making
 * it mean "drop that last point" is what everyone expects it to mean.
 */

export function penUndo(pState: PointerState): void {
    penDropIfOrphaned(pState);
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
