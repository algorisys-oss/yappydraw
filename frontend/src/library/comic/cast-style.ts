/**
 * Per-character look for a comic cast.
 *
 * Readers tell characters apart by silhouette long before they read the balloons, and
 * stick figures have almost no silhouette to work with — the head is the only place a
 * character can carry an identity. So each speaker gets their own hair style + colour.
 *
 * Two properties matter more than the palette itself:
 *
 *   • **Distinct** — consecutive slots differ in SHAPE, not just colour, because a
 *     monochrome comic (or a greyscale print) throws the colour away. Slot 0 and slot 1
 *     are the pair most scripts use, so they are the most different of all.
 *   • **Stable** — a character must look the same in every panel. That rules out
 *     assigning from a panel's own cast: panels have different subsets of speakers, so
 *     Ann would change hair the moment Ben stops appearing. The key is the character's
 *     position in the FULL script's cast (order of first appearance), which is why
 *     `assignCastHair` takes the whole cast and callers must pass the global list.
 *
 * Pure — no store, no DOM.
 */
import type { HairStyle } from '../stick-figures/face';

export interface CastStyle {
    hair: HairStyle;
    hairColor: string;
}

/**
 * The palette, ordered so that adjacent entries read as different people. Beyond its
 * length the assignment wraps with a shifted colour, so a very large cast degrades
 * gracefully instead of colliding outright.
 */
export const CAST_HAIR: CastStyle[] = [
    { hair: 'short', hairColor: '#4a3728' },      // cropped, dark brown
    { hair: 'long', hairColor: '#2b2118' },       // long, black — opposite silhouette
    { hair: 'spiky', hairColor: '#e0b040' },      // blonde crest
    { hair: 'bun', hairColor: '#a0522d' },        // auburn, up
    { hair: 'afro', hairColor: '#3b2f2f' },       // wide halo
    { hair: 'bob', hairColor: '#c2410c' },        // ginger, blunt
    { hair: 'ponytail', hairColor: '#7b4a2d' },   // chestnut, trailing
    { hair: 'cap', hairColor: '#2563eb' },        // a hat is a strong identity too
    { hair: 'braids', hairColor: '#2b2118' },     // plaits past the shoulder
    { hair: 'mohawk', hairColor: '#7c3aed' },     // narrow crest
    { hair: 'curly', hairColor: '#5b4636' },
    { hair: 'sideSwept', hairColor: '#9ca3af' },  // grey, swept
    { hair: 'topKnot', hairColor: '#2b2118' },
    { hair: 'pigtails', hairColor: '#e0b040' },
    { hair: 'fringe', hairColor: '#4a3728' },
    { hair: 'swoosh', hairColor: '#0891b2' },
    { hair: 'balding', hairColor: '#6b7280' },
    { hair: 'none', hairColor: '#4a3728' },       // bald reads as a character too
];

/** Colours cycled in when the cast outgrows the palette. */
const WRAP_COLORS = ['#7c3aed', '#0891b2', '#15803d', '#be123c'];

export interface CastHairOptions {
    /** Explicit style per speaker — wins over the palette. */
    hair?: Record<string, string>;
    /** Explicit colour per speaker — wins over the palette. */
    hairColors?: Record<string, string>;
}

/**
 * Give every speaker a hair style + colour, keyed by their position in `cast`.
 *
 * `cast` must be the speakers of the WHOLE script in order of first appearance — pass a
 * single panel's cast and the assignment stops being stable across panels.
 */
export function assignCastHair(cast: string[], opts: CastHairOptions = {}): Record<string, CastStyle> {
    const out: Record<string, CastStyle> = {};
    cast.forEach((speaker, i) => {
        const slot = CAST_HAIR[i % CAST_HAIR.length];
        const lap = Math.floor(i / CAST_HAIR.length);
        out[speaker] = {
            hair: (opts.hair?.[speaker] as HairStyle) ?? slot.hair,
            hairColor: opts.hairColors?.[speaker]
                ?? (lap === 0 ? slot.hairColor : WRAP_COLORS[(lap - 1) % WRAP_COLORS.length]),
        };
    });
    return out;
}

/**
 * Speakers of a whole script in order of first appearance.
 *
 * Deliberately NOT `castSpeakers` from panel-layout.ts: that caps at the number of
 * characters one PANEL can hold, which is the wrong bound for "who is in this comic".
 */
export function scriptCast(utterances: Array<{ speaker?: string | null }>): string[] {
    const seen: string[] = [];
    for (const u of utterances) {
        if (u.speaker && !seen.includes(u.speaker)) seen.push(u.speaker);
    }
    return seen;
}
