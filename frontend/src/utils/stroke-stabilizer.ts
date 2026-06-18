/**
 * stroke-stabilizer — opt-in "pulled-string" (a.k.a. lazy-brush) input
 * stabilizer for clean freehand inking, ported from HappyPaint's
 * engine/stroke/stabilizer.ts and adapted to YappyDraw's flat point buffers.
 *
 * The brush trails the cursor on a string of fixed length: while the cursor
 * stays within that radius the brush doesn't move, and once the cursor pulls
 * beyond it the brush is dragged along, always staying exactly `len` behind.
 * The result is the deliberate, weighted feel Procreate/Krita/CSP inkers rely
 * on for confident curves — the longer the string, the heavier/smoother/laggier
 * the line.
 *
 * Off by default (strength 0 → callers skip it entirely). Points are in document
 * units (zoom-independent), matching the `x - startX` space the pen buffers use.
 *
 * Pressure always adopts the latest raw sample (even while the brush is parked
 * inside the leash) so width dynamics keep responding to a press-in-place.
 */
import type { PointerState } from './pointer-state';

export interface StabSample {
    x: number;
    y: number;
    pressure: number;
}

export interface StrokeStabilizer {
    /** Feed a raw input sample; returns stabilized samples to draw (0 or 1). */
    next(p: StabSample): StabSample[];
    /**
     * Pointer lifted: "draw the string out" to the final cursor position so the
     * line ends where the pen actually lifted instead of stopping `len` short.
     */
    finish(): StabSample[];
}

/** Max string length in document px, at full strength. */
const MAX_STRING_PX = 120;

export function createStrokeStabilizer(strength: number, init: StabSample): StrokeStabilizer {
    const s = Math.min(1, Math.max(0, strength));
    const len = s * MAX_STRING_PX;
    // `anchor` is the brush's current (trailing) position; `last` the latest raw
    // cursor sample. Primed from the stroke's start point so the leash is
    // measured from where the pen first touched down.
    let anchor: StabSample = { ...init };
    let last: StabSample = { ...init };

    return {
        next(p: StabSample): StabSample[] {
            last = p;
            const dx = p.x - anchor.x;
            const dy = p.y - anchor.y;
            const d = Math.hypot(dx, dy);
            if (d <= len || d === 0) {
                // Inside the leash: the brush stays put, but track live pressure
                // so width dynamics still respond to a press-in-place.
                anchor = { ...anchor, pressure: p.pressure };
                return [];
            }
            // Drag the anchor toward the cursor, keeping it `len` px behind.
            const move = (d - len) / d;
            anchor = {
                x: anchor.x + dx * move,
                y: anchor.y + dy * move,
                pressure: p.pressure,
            };
            return [anchor];
        },

        finish(): StabSample[] {
            // Nothing left to draw if the brush already sits on the cursor.
            if (last.x === anchor.x && last.y === anchor.y) return [];
            const end: StabSample = { ...last };
            anchor = end;
            return [end];
        },
    };
}

/**
 * Push a raw pen sample into the pointer-state buffers, routing through the
 * active stabilizer if one is set. `pressure` is null when pressure capture is
 * off (so penPressureBuffer stays empty and aligned, exactly as before).
 */
export function pushStabilizedSample(
    pState: PointerState,
    px: number,
    py: number,
    pressure: number | null,
): void {
    const stab = pState.stabilizer;
    if (stab) {
        for (const sp of stab.next({ x: px, y: py, pressure: pressure ?? 0.5 })) {
            pState.penPointsBuffer.push(sp.x, sp.y);
            if (pressure !== null) pState.penPressureBuffer.push(sp.pressure);
        }
    } else {
        pState.penPointsBuffer.push(px, py);
        if (pressure !== null) pState.penPressureBuffer.push(pressure);
    }
}

/**
 * Flush the stabilizer's trailing point at stroke end (draws the string out to
 * the final cursor position), then clear it. Safe to call when no stabilizer is
 * active. Must run BEFORE the final flushPenPoints so the catch-up point lands.
 */
export function finishStabilizer(pState: PointerState, capturePressure: boolean): void {
    const stab = pState.stabilizer;
    if (!stab) return;
    for (const sp of stab.finish()) {
        pState.penPointsBuffer.push(sp.x, sp.y);
        if (capturePressure) pState.penPressureBuffer.push(sp.pressure);
    }
    pState.stabilizer = null;
}
