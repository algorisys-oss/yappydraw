/**
 * Fixed-angle constraint (Precision & Measurement — Phase 4).
 *
 * Shift-held gestures snap to clean angle increments (default 15°): line/arrow
 * drawing, element rotation, and the Measure tool drag all route through here so
 * they agree. Pure maths — no store/DOM — so it's unit-testable and identical on
 * every call site.
 */

export interface ConstrainedPoint {
    /** Endpoint snapped to the nearest increment, keeping the original drag distance. */
    x: number;
    y: number;
    /** Locked angle in degrees, CCW-positive from +x (screen-y negated, matching Measure/HUD). */
    angleDeg: number;
}

/** Normalise degrees to the half-open range (−180, 180]. */
function normDeg(deg: number): number {
    let d = ((deg % 360) + 360) % 360; // [0, 360)
    if (d > 180) d -= 360;             // (−180, 180]
    return Object.is(d, -0) ? 0 : d;
}

/**
 * Snap the point (x, y) to the nearest `stepDeg` increment around the anchor
 * (sx, sy), preserving the drag distance. Returns the constrained endpoint and the
 * locked display angle. A zero-length drag is returned unchanged.
 */
export function constrainToAngle(sx: number, sy: number, x: number, y: number, stepDeg = 15): ConstrainedPoint {
    const dx = x - sx, dy = y - sy;
    const dist = Math.hypot(dx, dy);
    if (dist === 0 || stepDeg <= 0) return { x, y, angleDeg: 0 };
    const step = stepDeg * Math.PI / 180;
    const snapped = Math.round(Math.atan2(dy, dx) / step) * step;
    return {
        x: sx + Math.cos(snapped) * dist,
        y: sy + Math.sin(snapped) * dist,
        angleDeg: normDeg(-snapped * 180 / Math.PI),
    };
}

/** Snap an angle (radians) to the nearest `stepDeg` increment — for rotation handles. */
export function snapAngleRad(angle: number, stepDeg = 15): number {
    if (stepDeg <= 0) return angle;
    const step = stepDeg * Math.PI / 180;
    return Math.round(angle / step) * step;
}
