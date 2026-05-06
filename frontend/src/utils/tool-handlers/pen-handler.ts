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

    // RAF-driven flush. Coalesced events keep full input resolution in the
    // buffer; the store is updated at most once per animation frame so Solid's
    // reactive cascade can't saturate the main thread on iPad with Apple Pencil
    // (which fires pointermove at ~120Hz). One flush per frame matches the
    // display refresh and is what `requestAnimationFrame(draw)` will pick up.
    if (!pState.penUpdatePending) {
        pState.penUpdatePending = true;
        requestAnimationFrame(() => {
            pState.penUpdatePending = false;
            helpers.flushPenPoints();
        });
    }
}
