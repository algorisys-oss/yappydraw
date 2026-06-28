/**
 * touch-geometry — pure helpers for reading finger contacts out of a TouchEvent.
 *
 * Stylus contacts (Apple Pencil, touchType === 'stylus') are excluded so a
 * Pencil contact + resting palm isn't mistaken for a multi-finger gesture. No
 * state, no store — the gesture recognizer in canvas.tsx layers its FSM on top.
 * Mirrors the touch-bookkeeping half of HappyPaint's `input/pointer-state.ts`.
 */

const STYLUS = 'stylus';

/** All current finger contacts (stylus excluded), uncapped — tap/swipe need 3–4. */
export function allFingerTouches(e: TouchEvent): Touch[] {
    const fingers: Touch[] = [];
    for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        if ((t as { touchType?: string }).touchType !== STYLUS) fingers.push(t);
    }
    return fingers;
}

/** Finger contacts capped at `max` (default 2) — cheaper for the 2-finger path. */
export function pickFingerTouches(e: TouchEvent, max = 2): Touch[] {
    const fingers: Touch[] = [];
    for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        if ((t as { touchType?: string }).touchType !== STYLUS) {
            fingers.push(t);
            if (fingers.length === max) break;
        }
    }
    return fingers;
}

export interface TwoFingerMetrics {
    /** Centroid of the two contacts, client coords. */
    cx: number;
    cy: number;
    /** Distance between the contacts (pinch). */
    dist: number;
    /** Angle of the contact vector, radians (twist). */
    angle: number;
}

/** Pinch/twist metrics for the first two fingers, or null if fewer than two. */
export function twoFingerMetrics(e: TouchEvent): TwoFingerMetrics | null {
    const f = pickFingerTouches(e);
    if (f.length < 2) return null;
    const t0 = f[0];
    const t1 = f[1];
    const cx = (t0.clientX + t1.clientX) / 2;
    const cy = (t0.clientY + t1.clientY) / 2;
    const dx = t0.clientX - t1.clientX;
    const dy = t0.clientY - t1.clientY;
    return { cx, cy, dist: Math.hypot(dx, dy), angle: Math.atan2(dy, dx) };
}
