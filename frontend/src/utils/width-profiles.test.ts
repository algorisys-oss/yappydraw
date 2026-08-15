import { describe, it, expect } from "bun:test";
import { WIDTH_PROFILES, profileToWidthPoints, detectWidthProfile, UNIFORM_PROFILE_ID } from "./width-profiles";
import { widthAt } from "./variable-width";

const BASE = 4;
const nonUniform = WIDTH_PROFILES.filter(p => p.id !== UNIFORM_PROFILE_ID);

describe("the preset list", () => {
    it("has uniform plus a useful set, with unique ids and labels", () => {
        expect(WIDTH_PROFILES[0].id).toBe(UNIFORM_PROFILE_ID);   // uniform reads first in the UI
        expect(nonUniform.length).toBeGreaterThanOrEqual(5);
        const ids = WIDTH_PROFILES.map(p => p.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const p of WIDTH_PROFILES) expect(p.label.length).toBeGreaterThan(0);
    });

    it("uniform materializes to NO width points, i.e. a plain stroke", () => {
        expect(profileToWidthPoints(UNIFORM_PROFILE_ID, BASE)).toEqual([]);
    });
});

describe("materializing a preset", () => {
    it("spans the whole path, in order, with positive widths", () => {
        for (const p of nonUniform) {
            const pts = profileToWidthPoints(p.id, BASE);
            expect(pts.length, p.id).toBeGreaterThanOrEqual(2);
            expect(pts[0].t).toBeCloseTo(0, 9);
            expect(pts[pts.length - 1].t).toBeCloseTo(1, 9);
            for (let i = 1; i < pts.length; i++) expect(pts[i].t).toBeGreaterThan(pts[i - 1].t);
            for (const q of pts) expect(q.width, `${p.id} @ t=${q.t}`).toBeGreaterThan(0);
        }
    });

    it("never exceeds the nominal stroke weight", () => {
        // Switching profile should shape a stroke, not fatten it — otherwise changing preset
        // silently changes how heavy the artwork looks.
        for (const p of nonUniform) {
            for (const q of profileToWidthPoints(p.id, BASE)) {
                expect(q.width, `${p.id} @ t=${q.t}`).toBeLessThanOrEqual(BASE + 1e-9);
            }
        }
    });

    it("scales linearly with the stroke weight", () => {
        for (const p of nonUniform) {
            const a = profileToWidthPoints(p.id, 4);
            const b = profileToWidthPoints(p.id, 8);
            expect(b.length).toBe(a.length);
            for (let i = 0; i < a.length; i++) expect(b[i].width).toBeCloseTo(a[i].width * 2, 9);
        }
    });

    it("returns nothing for an unknown id rather than throwing", () => {
        expect(profileToWidthPoints('no-such-profile', BASE)).toEqual([]);
    });
});

/** Width at t, as a fraction of the base weight. */
const k = (id: string, t: number) => widthAt(profileToWidthPoints(id, BASE), t, BASE) / BASE;

describe("the shapes are what their names claim", () => {
    it("bulge is fat in the middle and thin at both ends, symmetrically", () => {
        expect(k('bulge', 0.5)).toBeGreaterThan(k('bulge', 0.05));
        expect(k('bulge', 0.5)).toBeGreaterThan(k('bulge', 0.95));
        expect(k('bulge', 0.25)).toBeCloseTo(k('bulge', 0.75), 6);
    });

    it("waist is thin in the middle and fat at both ends, symmetrically", () => {
        expect(k('waist', 0.5)).toBeLessThan(k('waist', 0.02));
        expect(k('waist', 0.5)).toBeLessThan(k('waist', 0.98));
        expect(k('waist', 0.3)).toBeCloseTo(k('waist', 0.7), 6);
    });

    it("the two tapers run opposite ways and mirror each other", () => {
        expect(k('taper-out', 0)).toBeGreaterThan(k('taper-out', 1));
        expect(k('taper-in', 0)).toBeLessThan(k('taper-in', 1));
        for (const t of [0, 0.25, 0.5, 0.75, 1]) {
            expect(k('taper-in', t)).toBeCloseTo(k('taper-out', 1 - t), 6);
        }
    });

    it("chisel holds full width before tapering away", () => {
        expect(k('chisel', 0.2)).toBeCloseTo(1, 6);
        expect(k('chisel', 0.2)).toBeGreaterThan(k('chisel', 0.9));
    });
});

describe("detecting which preset a profile is", () => {
    it("recognises every preset it produced", () => {
        for (const p of WIDTH_PROFILES) {
            const pts = profileToWidthPoints(p.id, BASE);
            expect(detectWidthProfile(pts, BASE), p.id).toBe(p.id);
        }
    });

    it("recognises a preset at any stroke weight", () => {
        for (const base of [1, 2.5, 12, 40]) {
            const pts = profileToWidthPoints('bulge', base);
            expect(detectWidthProfile(pts, base), `base ${base}`).toBe('bulge');
        }
    });

    it("an empty or missing profile is uniform", () => {
        expect(detectWidthProfile([], BASE)).toBe(UNIFORM_PROFILE_ID);
        expect(detectWidthProfile(undefined, BASE)).toBe(UNIFORM_PROFILE_ID);
    });

    it("a hand-built profile is NOT mistaken for a preset", () => {
        // The dropdown must be able to say "custom" — otherwise it lies about Width-tool edits.
        expect(detectWidthProfile([{ t: 0, width: 1 }, { t: 0.5, width: 9 }, { t: 1, width: 2 }], BASE)).toBeNull();
    });

    it("tolerates a preset nudged by rounding, but not one genuinely edited", () => {
        const pts = profileToWidthPoints('bulge', BASE);
        const rounded = pts.map(p => ({ t: p.t, width: Math.round(p.width * 1000) / 1000 }));
        expect(detectWidthProfile(rounded, BASE)).toBe('bulge');

        const edited = pts.map((p, i) => (i === 2 ? { t: p.t, width: p.width * 0.5 } : p));
        expect(detectWidthProfile(edited, BASE)).toBeNull();
    });
});
