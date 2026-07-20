import { describe, it, expect } from "bun:test";
import { assignCastHair, scriptCast, CAST_HAIR } from "./cast-style";
import { HAIR_STYLES } from "../stick-figures/face";

describe("scriptCast", () => {
    it("lists speakers in order of first appearance, ignoring narration", () => {
        const cast = scriptCast([
            { speaker: "Ann" }, { speaker: null }, { speaker: "Ben" },
            { speaker: "Ann" }, { speaker: "Cara" },
        ]);
        expect(cast).toEqual(["Ann", "Ben", "Cara"]);
    });

    it("is not capped at the per-panel character limit", () => {
        const many = Array.from({ length: 12 }, (_, i) => ({ speaker: `P${i}` }));
        expect(scriptCast(many)).toHaveLength(12);
    });
});

describe("assignCastHair", () => {
    it("gives every speaker a style and a colour", () => {
        const out = assignCastHair(["Ann", "Ben", "Cara"]);
        for (const s of ["Ann", "Ben", "Cara"]) {
            expect(out[s].hair).toBeTruthy();
            expect(out[s].hairColor).toMatch(/^#[0-9a-f]{6}$/i);
        }
    });

    it("gives different characters different hair", () => {
        const cast = CAST_HAIR.map((_, i) => `P${i}`);
        const out = assignCastHair(cast);
        const styles = cast.map(s => out[s].hair);
        expect(new Set(styles).size).toBe(cast.length);
    });

    it("is stable: a speaker's hair depends only on their slot in the cast", () => {
        // The whole point — the cast list is built from the FULL script, so a panel
        // where Ben is absent must not shift Cara onto Ben's hair.
        const full = assignCastHair(["Ann", "Ben", "Cara"]);
        const again = assignCastHair(["Ann", "Ben", "Cara"]);
        expect(again).toEqual(full);
        // Same person, same position, regardless of who else is listed after them.
        const shorter = assignCastHair(["Ann", "Ben"]);
        expect(shorter.Ann).toEqual(full.Ann);
        expect(shorter.Ben).toEqual(full.Ben);
    });

    it("honours explicit overrides", () => {
        const out = assignCastHair(["Ann", "Ben"], {
            hair: { Ann: "mohawk" },
            hairColors: { Ben: "#123456" },
        });
        expect(out.Ann.hair).toBe("mohawk");
        expect(out.Ann.hairColor).toBe(CAST_HAIR[0].hairColor);   // colour still from the slot
        expect(out.Ben.hairColor).toBe("#123456");
        expect(out.Ben.hair).toBe(CAST_HAIR[1].hair);             // style still from the slot
    });

    it("wraps with a new colour instead of colliding outright", () => {
        const cast = Array.from({ length: CAST_HAIR.length + 2 }, (_, i) => `P${i}`);
        const out = assignCastHair(cast);
        const first = out["P0"], wrapped = out[`P${CAST_HAIR.length}`];
        expect(wrapped.hair).toBe(first.hair);              // style repeats…
        expect(wrapped.hairColor).not.toBe(first.hairColor); // …but the colour does not
    });

    it("only uses styles the figure library actually knows", () => {
        const known = new Set(HAIR_STYLES.map(h => h.id));
        for (const slot of CAST_HAIR) expect(known.has(slot.hair)).toBe(true);
    });
});
