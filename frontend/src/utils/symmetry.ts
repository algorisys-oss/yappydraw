/**
 * symmetry — live drawing symmetry (mirror / quadrant / mandala).
 *
 * Interface deliberately mirrors HappyPaint's `engine/brush/symmetry.ts` and
 * `state/guides-store.ts`: same mode set, same `radialCount` / `angle` / `editing`
 * fields, same function names, so the two apps stay learnable as one.
 *
 * One deliberate difference: HappyPaint stores the centre as fractions of a fixed
 * document. Yappy is an infinite canvas, so the centre is stored in **world
 * coordinates** instead. Everything else carries over unchanged.
 *
 *   vertical   → reflect across the vertical axis (x mirrored)
 *   horizontal → reflect across the horizontal axis (y mirrored)
 *   both       → 4-way quadrant (vertical + horizontal + 180°)
 *   radial     → N rotations about the centre (mandala)
 */

export type SymmetryMode = 'off' | 'vertical' | 'horizontal' | 'both' | 'radial';

/**
 * A pristine symmetry configuration. Returns a FRESH object each call: the store is
 * seeded from its initial state by reference, so handing out a shared default object
 * means drawing on the canvas silently rewrites "the defaults".
 */
export const defaultSymmetryState = () => ({
    mode: 'off' as SymmetryMode,
    cx: 0,
    cy: 0,
    radialCount: 6,
    angle: 0,
    editing: false,
});

/** Bounds shared by the store setters and the UI. */
export const MIN_RADIAL_COUNT = 2;
export const MAX_RADIAL_COUNT = 24;

/**
 * A symmetry instance: a 2×2 linear map applied about a centre (cx, cy) in
 * world space. Same shape as HappyPaint's `SymmetryTransform`.
 */
export interface SymmetryTransform {
    m00: number; m01: number;
    m10: number; m11: number;
    cx: number; cy: number;
}

/** Apply a symmetry transform to a world-space point. */
export function applyTransform(tf: SymmetryTransform, x: number, y: number): { x: number; y: number } {
    const dx = x - tf.cx;
    const dy = y - tf.cy;
    return { x: tf.cx + tf.m00 * dx + tf.m01 * dy, y: tf.cy + tf.m10 * dx + tf.m11 * dy };
}

/**
 * Build the list of symmetry transforms (including the identity) a stroke is
 * replicated through, for the given mode.
 */
export function buildSymmetryTransforms(
    mode: SymmetryMode,
    cx: number,
    cy: number,
    radialCount: number,
    angle = 0,
): SymmetryTransform[] {
    const I: SymmetryTransform = { m00: 1, m01: 0, m10: 0, m11: 1, cx, cy };
    // Reflection across a line through the centre at angle φ from the x-axis.
    const refl = (phi: number): SymmetryTransform => {
        const c = Math.cos(2 * phi);
        const s = Math.sin(2 * phi);
        return { m00: c, m01: s, m10: s, m11: -c, cx, cy };
    };
    // Pure rotation about the centre.
    const rot = (a: number): SymmetryTransform => {
        const c = Math.cos(a);
        const s = Math.sin(a);
        return { m00: c, m01: -s, m10: s, m11: c, cx, cy };
    };

    switch (mode) {
        case 'vertical': // mirror across the vertical axis (tilted by `angle`)
            return [I, refl(Math.PI / 2 + angle)];
        case 'horizontal':
            return [I, refl(angle)];
        case 'both':
            return [I, refl(angle), refl(Math.PI / 2 + angle), rot(Math.PI)];
        case 'radial': {
            const n = Math.max(MIN_RADIAL_COUNT, Math.round(radialCount));
            const out: SymmetryTransform[] = [];
            for (let i = 0; i < n; i++) out.push(rot(angle + (i / n) * Math.PI * 2));
            return out;
        }
        default:
            return [I];
    }
}

/**
 * The same transform list, described in the terms a *vector* element can be
 * cloned through.
 *
 * HappyPaint replicates raster dabs, so a 2×2 matrix is all it needs. A Yappy
 * element carries its own rotation, flip flags and local point list, so the
 * clone has to know whether an instance is a rotation or a reflection — a
 * reflection additionally negates `angle` and toggles flipX/flipY.
 *
 * `phi` is the reflection line's angle for `reflect`, and the rotation for
 * `rotate`. The identity instance is omitted: it is the element you drew.
 */
export type SymmetryOp =
    | { kind: 'rotate'; theta: number }
    | { kind: 'reflect'; phi: number };

/** Ops for every instance *except* the identity (the drawn element itself). */
export function buildSymmetryOps(mode: SymmetryMode, radialCount: number, angle = 0): SymmetryOp[] {
    switch (mode) {
        case 'vertical':
            return [{ kind: 'reflect', phi: Math.PI / 2 + angle }];
        case 'horizontal':
            return [{ kind: 'reflect', phi: angle }];
        case 'both':
            return [
                { kind: 'reflect', phi: angle },
                { kind: 'reflect', phi: Math.PI / 2 + angle },
                { kind: 'rotate', theta: Math.PI },
            ];
        case 'radial': {
            const n = Math.max(MIN_RADIAL_COUNT, Math.round(radialCount));
            const out: SymmetryOp[] = [];
            for (let i = 1; i < n; i++) out.push({ kind: 'rotate', theta: (i / n) * Math.PI * 2 });
            return out;
        }
        default:
            return [];
    }
}

/** How many copies a mode produces in total, identity included. */
export function symmetryInstanceCount(mode: SymmetryMode, radialCount: number): number {
    switch (mode) {
        case 'vertical':
        case 'horizontal': return 2;
        case 'both': return 4;
        case 'radial': return Math.max(MIN_RADIAL_COUNT, Math.round(radialCount));
        default: return 1;
    }
}

/** Axis directions to draw for a mode, as angles from the x-axis. */
export function symmetryAxisAngles(mode: SymmetryMode, radialCount: number, angle = 0): number[] {
    switch (mode) {
        case 'vertical': return [Math.PI / 2 + angle];
        case 'horizontal': return [angle];
        case 'both': return [angle, Math.PI / 2 + angle];
        case 'radial': {
            const n = Math.max(MIN_RADIAL_COUNT, Math.round(radialCount));
            return Array.from({ length: n }, (_, i) => angle + (i / n) * Math.PI * 2);
        }
        default: return [];
    }
}
