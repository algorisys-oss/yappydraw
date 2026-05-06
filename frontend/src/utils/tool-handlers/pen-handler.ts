/**
 * Pen Handler
 * Handles pen/freehand tool point buffering and throttled store updates.
 * Extracted from canvas.tsx handlePointerMove/Up.
 */

import type { PointerState } from '../pointer-state';
import type { PointerHelpers } from '../pointer-helpers';

// ─── Pointer Move: Buffer pen points ─────────────────────────────────

export function penOnMove(
    e: PointerEvent,
    pState: PointerState,
    helpers: PointerHelpers,
    _PEN_UPDATE_THROTTLE_MS: number
): void {
    // Use coalesced events for higher point density during fast strokes.
    // Apple Pencil delivers up to ~120Hz; coalesced events surface every sample
    // captured between frames so no resolution is lost.
    const coalescedEvents = e.getCoalescedEvents?.() ?? [];
    const events = coalescedEvents.length > 0 ? coalescedEvents : [e];

    for (const ce of events) {
        const { x: ex, y: ey } = helpers.getWorldCoordinates(ce.clientX, ce.clientY);
        const px = ex - pState.startX;
        const py = ey - pState.startY;
        pState.penPointsBuffer.push(px, py);
    }

    // Flush every move: store update naturally batches with the RAF draw the
    // outer pointermove handler schedules. The previous 16ms wall-clock throttle
    // dropped a frame for Apple Pencil and made strokes feel laggy/jittery.
    helpers.flushPenPoints();
}
