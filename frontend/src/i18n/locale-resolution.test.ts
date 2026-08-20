/**
 * Locale resolution, pseudo-localization and Intl formatting — the pure parts of
 * the i18n runtime, kept free of Solid signals and browser globals so they can be
 * tested directly.
 *
 * `resolveLocale` is the piece with real teeth: browsers hand us a *preference
 * list* of BCP-47 tags, not a locale we support. `pt-BR` must not be answered
 * with `pt-PT`-flavoured Portuguese, `es-MX` must land on `es`, and an
 * unsupported preference must fall through to the *next* preference rather than
 * jumping straight to English — getting that last one wrong is how a Brazilian
 * user with [xx-YY, pt-BR] ends up reading English.
 */

import { describe, it, expect } from "bun:test";
import { resolveLocale, SUPPORTED_LOCALES, isSupportedLocale } from "./locale-resolution";
import { pseudoize } from "./pseudo";
import { plural, formatNumber, formatInteger, formatPercent, formatDate, formatList } from "./format";

describe("resolveLocale", () => {
    it("takes an exact match", () => {
        expect(resolveLocale(["es"])).toBe("es");
        expect(resolveLocale(["ja"])).toBe("ja");
    });

    it("matches a region-qualified tag to its base language", () => {
        expect(resolveLocale(["es-MX"])).toBe("es");
        expect(resolveLocale(["de-AT"])).toBe("de");
        expect(resolveLocale(["fr-CA"])).toBe("fr");
    });

    it("prefers pt-BR for any Portuguese, since that is the variant we ship", () => {
        expect(resolveLocale(["pt-BR"])).toBe("pt-BR");
        expect(resolveLocale(["pt"])).toBe("pt-BR");
        expect(resolveLocale(["pt-PT"])).toBe("pt-BR");
    });

    it("maps legacy and script-qualified Chinese tags onto zh-Hans", () => {
        expect(resolveLocale(["zh"])).toBe("zh-Hans");
        expect(resolveLocale(["zh-CN"])).toBe("zh-Hans");
        expect(resolveLocale(["zh-Hans-CN"])).toBe("zh-Hans");
    });

    it("falls through to the NEXT preference before giving up on English", () => {
        // The bug this guards: treating the first unsupported tag as "no match"
        // and returning en, ignoring a perfectly good second preference.
        expect(resolveLocale(["xx-YY", "pt-BR"])).toBe("pt-BR");
        expect(resolveLocale(["cy", "sw", "ja"])).toBe("ja");
    });

    it("is case-insensitive about tags", () => {
        expect(resolveLocale(["ES-mx"])).toBe("es");
        expect(resolveLocale(["PT-br"])).toBe("pt-BR");
    });

    it("returns en for an empty or wholly unsupported preference list", () => {
        expect(resolveLocale([])).toBe("en");
        expect(resolveLocale(["cy", "mt"])).toBe("en");
    });

    it("does not offer a locale that is not in the supported table", () => {
        expect(isSupportedLocale("es")).toBe(true);
        expect(isSupportedLocale("kl")).toBe(false);
    });

    it("ships exactly the twelve planned locales, with Arabic marked RTL", () => {
        expect(SUPPORTED_LOCALES).toHaveLength(12);
        expect(SUPPORTED_LOCALES.filter((l) => l.dir === "rtl").map((l) => l.code)).toEqual(["ar"]);
        // en is the source of truth and must always be complete.
        expect(SUPPORTED_LOCALES.find((l) => l.code === "en")!.coverage).toBe(1);
    });
});

describe("pseudoize", () => {
    it("accents Latin letters so untranslated strings stand out", () => {
        const out = pseudoize("Undo");
        expect(out).not.toContain("Undo");
        expect(out).toMatch(/[Ûñdö]/);
    });

    it("wraps output in brackets so truncation is visible", () => {
        expect(pseudoize("Undo").startsWith("⟦")).toBe(true);
        expect(pseudoize("Undo").endsWith("⟧")).toBe(true);
    });

    it("pads short strings by at least 30% to expose layout overflow", () => {
        const source = "Send to Back";
        const out = pseudoize(source);
        // Discount the two bracket characters — they are markers, not length.
        const body = out.slice(1, -1);
        expect(body.length).toBeGreaterThanOrEqual(Math.ceil(source.length * 1.3));
    });

    it("leaves {{ template placeholders }} untouched", () => {
        const out = pseudoize("Activate Layer: {{ name }}");
        expect(out).toContain("{{ name }}");
    });

    it("leaves digits and punctuation alone", () => {
        const out = pseudoize("Rasterize (2×)");
        expect(out).toContain("2");
        expect(out).toContain("×");
    });

    it("is stable — the same input always pseudoizes identically", () => {
        expect(pseudoize("Group Selection")).toBe(pseudoize("Group Selection"));
    });
});

describe("plural", () => {
    it("selects the English singular and plural forms", () => {
        const forms = { one: "{{count}} element", other: "{{count}} elements" };
        expect(plural("en", 1, forms)).toBe("1 element");
        expect(plural("en", 3, forms)).toBe("3 elements");
        expect(plural("en", 0, forms)).toBe("0 elements");
    });

    it("uses the locale's own plural categories, not English's", () => {
        // Russian has one/few/many. 2 is `few`, 5 is `many` — a naive
        // `n === 1 ? one : other` would get both wrong.
        const ru = { one: "элемент", few: "элемента", many: "элементов", other: "элемента" };
        expect(plural("ru", 1, ru)).toBe("элемент");
        expect(plural("ru", 2, ru)).toBe("элемента");
        expect(plural("ru", 5, ru)).toBe("элементов");
    });

    it("falls back to `other` when a locale asks for a category we did not author", () => {
        expect(plural("ru", 2, { one: "a", other: "b" })).toBe("b");
    });

    it("formats the interpolated count using the locale's own digits and grouping", () => {
        const forms = { one: "{{count}} element", other: "{{count}} elements" };
        expect(plural("de", 1500, forms)).toBe("1.500 elements");
    });
});

describe("Intl formatting helpers", () => {
    it("formats numbers per locale", () => {
        expect(formatNumber("en", 1234.5)).toBe("1,234.5");
        expect(formatNumber("de", 1234.5)).toBe("1.234,5");
    });

    it("rounds to a requested number of decimals", () => {
        expect(formatNumber("en", 3.14159, 2)).toBe("3.14");
    });

    it("formats integers without decimals", () => {
        expect(formatInteger("en", 1234.7)).toBe("1,235");
    });

    it("formats percentages", () => {
        expect(formatPercent("en", 0.42)).toBe("42%");
    });

    it("formats dates without throwing on any supported locale", () => {
        const d = new Date(Date.UTC(2026, 7, 20));
        for (const l of SUPPORTED_LOCALES) {
            expect(typeof formatDate(l.code, d)).toBe("string");
        }
    });

    it("joins lists with the locale's own conjunction", () => {
        expect(formatList("en", ["a", "b", "c"])).toBe("a, b, and c");
        expect(formatList("en", ["a"])).toBe("a");
    });
});
