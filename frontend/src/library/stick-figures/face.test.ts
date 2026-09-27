import { describe, it, expect } from "bun:test";
import {
    faceGeometry, faceHairSvg, faceStateAttrs, FACE_STYLES,
    EYE_STYLES, BROW_STYLES, MOUTH_STYLES, ACCENT_STYLES, faceRecipe,
    asEyeStyle, asBrowStyle, asMouthStyle, asAccentStyle,
} from "./face";

const HEAD = [100, 100, 22] as const;
const geo = (o: Parameters<typeof faceGeometry>[3]) => JSON.stringify(faceGeometry(...HEAD, o));

describe("expressions", () => {
    it("every expression draws something, except None", () => {
        const blank = FACE_STYLES.filter(f => f.id !== 'none' && faceGeometry(...HEAD, { face: f.id }).length === 0);
        expect(blank.map(f => f.id)).toEqual([]);
        expect(faceGeometry(...HEAD, { face: 'none' })).toEqual([]);
    });

    it("no two expressions draw the same face", () => {
        const seen = new Map<string, string>();
        const dupes: string[] = [];
        for (const f of FACE_STYLES) {
            const g = geo({ face: f.id });
            if (seen.has(g)) dupes.push(`${f.id} = ${seen.get(g)}`);
            seen.set(g, f.id);
        }
        expect(dupes).toEqual([]);
    });

    it("every part shape is used by the vocabulary and renders on its own", () => {
        for (const e of EYE_STYLES) if (e.id !== 'none') expect(faceGeometry(...HEAD, { face: 'none', eyes: e.id }).length).toBeGreaterThan(0);
        for (const b of BROW_STYLES) if (b.id !== 'none') expect(faceGeometry(...HEAD, { face: 'none', brows: b.id }).length).toBeGreaterThan(0);
        for (const m of MOUTH_STYLES) if (m.id !== 'none') expect(faceGeometry(...HEAD, { face: 'none', mouth: m.id }).length).toBeGreaterThan(0);
        for (const a of ACCENT_STYLES) if (a.id !== 'none') expect(faceGeometry(...HEAD, { face: 'none', accent: a.id }).length).toBeGreaterThan(0);
    });
});

describe("part overrides", () => {
    it("override one part and keep the rest of the expression", () => {
        const happy = faceRecipe('happy');
        const mixed = faceGeometry(...HEAD, { face: 'happy', brows: 'angry' });
        const expected = faceGeometry(...HEAD, { face: 'none', eyes: happy.eyes, brows: 'angry', mouth: happy.mouth });
        expect(mixed).toEqual(expected);
    });

    it("'auto' follows the expression", () => {
        expect(geo({ face: 'sad', eyes: 'auto', brows: 'auto', mouth: 'auto', accent: 'auto' })).toBe(geo({ face: 'sad' }));
    });

    it("an explicit 'none' part removes it", () => {
        const noMouth = faceGeometry(...HEAD, { face: 'happy', mouth: 'none' });
        expect(noMouth.length).toBe(faceGeometry(...HEAD, { face: 'happy' }).length - 1);
    });

    it("unknown part names fall back to auto", () => {
        expect(asEyeStyle('nope')).toBe('auto');
        expect(asBrowStyle(undefined)).toBe('auto');
        expect(asMouthStyle(42)).toBe('auto');
        expect(asAccentStyle('tears')).toBe('tears');
        expect(geo({ face: 'happy', eyes: 'nope' as any })).toBe(geo({ face: 'happy' }));
    });
});

describe("coloured accents", () => {
    it("blush is fill-only, so an outline recolour cannot turn it dark", () => {
        const blush = faceGeometry(...HEAD, { face: 'none', accent: 'blush' });
        expect(blush.length).toBe(2);
        for (const p of blush) expect((p as any).fillOnly).toBe(true);
        expect(faceHairSvg(...HEAD, { face: 'none', accent: 'blush' })).toContain('stroke="none"');
    });
});

describe("state attributes", () => {
    it("a plain expression stamps exactly what it did before parts existed", () => {
        // Library SVGs are generated with these; extra attributes would change every asset.
        expect(faceStateAttrs({ face: 'happy' })).not.toContain('data-sf-eyes');
        expect(faceStateAttrs({ face: 'happy', eyes: 'auto' })).not.toContain('data-sf-eyes');
    });

    it("overrides are stamped so a restyle can read them back", () => {
        const a = faceStateAttrs({ face: 'happy', brows: 'angry', accent: 'blush' });
        expect(a).toContain('data-sf-brows="angry"');
        expect(a).toContain('data-sf-accent="blush"');
        expect(a).not.toContain('data-sf-mouth');
    });
});
