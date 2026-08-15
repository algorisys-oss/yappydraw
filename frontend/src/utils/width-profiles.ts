/**
 * width-profiles — named stroke width profiles (Illustrator's Width Profile dropdown).
 *
 * The Width tool already lets you shape a stroke point by point; this is the same thing as a
 * one-click choice, which is how it is actually used: a taper or a leaf shape, not a bespoke
 * curve. Each preset is a function of `t` (0..1 along the path) returning a **multiplier of the
 * nominal stroke weight**, sampled into the `{ t, width }` points `widthProfile` already stores.
 *
 * Multipliers never exceed 1, so choosing a profile *shapes* a stroke without making it heavier —
 * otherwise flipping between presets would silently change how heavy the artwork reads.
 *
 * One consequence of `widthProfile` holding ABSOLUTE widths (which it does, and which documents
 * are already saved with): a materialized profile does not follow a later change to
 * `strokeWidth`. Re-picking the preset re-materializes it against the new weight. Storing
 * multipliers instead would be tidier but would silently rescale every existing document, so the
 * absolute model stays.
 */

import type { WidthPoint } from './variable-width';

export const UNIFORM_PROFILE_ID = 'uniform';

/** How many points each preset is sampled into. Enough that the ribbon reads as a curve. */
const SAMPLES = 9;

export interface WidthProfileDef {
    id: string;
    label: string;
    hint: string;
    /** Multiplier of the nominal stroke weight at t. Undefined for uniform (no profile). */
    k?: (t: number) => number;
}

const THIN = 0.12;   // how thin a "pointed" end gets, as a fraction of the weight

export const WIDTH_PROFILES: WidthProfileDef[] = [
    { id: UNIFORM_PROFILE_ID, label: 'Uniform', hint: 'A plain, even stroke' },
    {
        id: 'bulge', label: 'Bulge', hint: 'Pointed at both ends, widest in the middle — a leaf',
        k: (t) => THIN + (1 - THIN) * Math.pow(Math.sin(Math.PI * t), 0.8),
    },
    {
        id: 'waist', label: 'Waist', hint: 'Full at both ends, pinched in the middle',
        k: (t) => 1 - 0.7 * Math.sin(Math.PI * t),
    },
    {
        id: 'taper-out', label: 'Taper out', hint: 'Full weight at the start, tapering to a point',
        k: (t) => 1 - (1 - THIN) * t,
    },
    {
        id: 'taper-in', label: 'Taper in', hint: 'Starts at a point, growing to full weight',
        k: (t) => THIN + (1 - THIN) * t,
    },
    {
        id: 'chisel', label: 'Chisel', hint: 'Holds full weight, then tapers away at the end',
        k: (t) => (t < 0.55 ? 1 : 1 - (1 - THIN) * ((t - 0.55) / 0.45)),
    },
    {
        id: 'oval', label: 'Oval', hint: 'Nearly even, rounded off at both ends',
        k: (t) => 0.35 + 0.65 * Math.pow(Math.sin(Math.PI * t), 0.35),
    },
];

const byId = new Map(WIDTH_PROFILES.map(p => [p.id, p]));

/**
 * Materialize a preset into the `{ t, width }` points an element stores.
 *
 * Uniform — and any unknown id — yields an empty list, which is exactly "no profile": the
 * caller clears `widthProfile` and the stroke renders at its normal constant weight.
 */
export function profileToWidthPoints(id: string, baseWidth: number): WidthPoint[] {
    const def = byId.get(id);
    if (!def?.k) return [];
    const base = Math.max(0.1, baseWidth || 1);
    const out: WidthPoint[] = [];
    for (let i = 0; i < SAMPLES; i++) {
        const t = i / (SAMPLES - 1);
        out.push({ t, width: base * Math.min(1, Math.max(0.01, def.k(t))) });
    }
    return out;
}

/**
 * Which preset does this profile match, or null for a hand-edited one?
 *
 * The dropdown has to be able to report "custom": showing the last preset you picked after
 * you've dragged width points with the Width tool would be a lie. Compared as a fraction of the
 * nominal weight so the answer is the same at every stroke size, with a tolerance loose enough
 * to survive rounding through a saved document and tight enough that a real edit shows up.
 */
export function detectWidthProfile(
    profile: WidthPoint[] | undefined | null,
    baseWidth: number,
): string | null {
    if (!profile || !profile.length) return UNIFORM_PROFILE_ID;
    const base = Math.max(0.1, baseWidth || 1);
    for (const def of WIDTH_PROFILES) {
        if (!def.k) continue;
        const want = profileToWidthPoints(def.id, base);
        if (want.length !== profile.length) continue;
        let ok = true;
        for (let i = 0; i < want.length; i++) {
            if (Math.abs(want[i].t - profile[i].t) > 1e-6
                || Math.abs(want[i].width - profile[i].width) / base > 0.02) { ok = false; break; }
        }
        if (ok) return def.id;
    }
    return null;
}
