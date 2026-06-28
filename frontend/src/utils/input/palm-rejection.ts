/**
 * palm-rejection — ignore touch input while an Apple Pencil / stylus is active.
 *
 * On iPad the palm rests on the glass while drawing with the Pencil; those palm
 * contacts arrive as 'touch' pointers and must not draw or trigger gestures.
 * iPadOS does its own system-level rejection when a Pencil is paired, so this is
 * an in-app safety net (it also covers the gap between fast strokes where the
 * next stroke's down is briefly misclassified as touch).
 *
 * Mirrors HappyPaint's `input/palm-rejection.ts`, adapted to yappy's PointerEvent
 * model (yappy keys off the pointer's touch-ellipse size + a recency window
 * rather than a separate pen-event note API). Pure functions — no store access.
 */

/** Ignore palm-sized touch for this long after the pen was last seen. */
export const PEN_RECENT_MS = 500;

/**
 * Apple Pencil contacts report a tiny touch ellipse (~1–2px); fingers are
 * ~25–40px and palms 50+px. A pencil-sized touch is let through even during the
 * rejection window so a misclassified Pencil tip still draws.
 */
export function isPencilSizedTouch(e: { width?: number; height?: number }): boolean {
    const w = e.width;
    const h = e.height;
    if (w == null || h == null) return false;
    return w > 0 && w <= 5 && h > 0 && h <= 5;
}

/** The pen-activity fields the rejector reads (a subset of PointerState). */
export interface PenActivity {
    activePenPointerId: number | null;
    lastPenInputAt: number;
}

/**
 * True when a 'touch' pointer should be rejected as palm contact: a pen is
 * currently down (or was within PEN_RECENT_MS) and the touch isn't pencil-sized.
 *
 * `selfPointerId` excludes a specific pointer from the "pen is down" test — used
 * on pointerup, where the lifting pen pointer itself must not count as active.
 */
export function isPalmTouch(
    state: PenActivity,
    e: { width?: number; height?: number },
    now: number,
    selfPointerId?: number,
): boolean {
    const penDown = state.activePenPointerId !== null
        && (selfPointerId === undefined || state.activePenPointerId !== selfPointerId);
    const penActive = penDown || (now - state.lastPenInputAt) < PEN_RECENT_MS;
    return penActive && !isPencilSizedTouch(e);
}
