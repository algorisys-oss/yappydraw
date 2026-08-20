/**
 * Registry drift guard.
 *
 * Shipping a locale means three things must agree: a dictionary file exists in
 * `locales/`, `LOCALE_LOADERS` knows how to import it, and `SUPPORTED_LOCALES`
 * records its coverage so the picker can decide whether to offer it.
 *
 * Forgetting any one of them fails SILENTLY — a finished translation sits on
 * disk and is never served to anyone, and nothing errors. That is the worst
 * possible failure mode for work that costs money, so it gets a test.
 *
 * (yappykit solves the same problem with `import.meta.glob`, so the loader map
 * simply cannot disagree with the folder. That is stronger, but it is a Vite
 * build-time transform and these tests run under bun with no Vite, so the
 * equivalent guarantee is asserted here instead.)
 */

import { describe, it, expect } from "bun:test";
import { readdirSync } from "node:fs";
import { LOCALE_LOADERS } from "./index";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, READY_THRESHOLD, readyLocales } from "./locale-resolution";

const localesDir = new URL("./locales/", import.meta.url).pathname;

/** Dictionary files present on disk, excluding English (statically imported). */
const filesOnDisk = readdirSync(localesDir)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
    .map((f) => f.replace(/\.ts$/, ""))
    .filter((code) => code !== DEFAULT_LOCALE);

describe("locale registry", () => {
    it("has a loader for every dictionary file on disk", () => {
        const unregistered = filesOnDisk.filter((code) => !(code in LOCALE_LOADERS));
        expect(unregistered).toEqual([]);
    });

    it("has a dictionary file for every registered loader", () => {
        const dangling = Object.keys(LOCALE_LOADERS).filter((code) => !filesOnDisk.includes(code));
        expect(dangling).toEqual([]);
    });

    it("only registers loaders for locales in the supported table", () => {
        const codes = new Set(SUPPORTED_LOCALES.map((l) => l.code));
        const unknown = Object.keys(LOCALE_LOADERS).filter((code) => !codes.has(code));
        expect(unknown).toEqual([]);
    });

    it("never offers a locale in the picker that has no way to load its dictionary", () => {
        // The user-visible half of the same drift: a coverage number bumped to
        // 1 without a loader would put an untranslatable language in the menu.
        const offered = readyLocales().map((l) => l.code).filter((c) => c !== DEFAULT_LOCALE);
        const unloadable = offered.filter((code) => !(code in LOCALE_LOADERS));
        expect(unloadable).toEqual([]);
    });

    it("keeps English complete and always available", () => {
        const en = SUPPORTED_LOCALES.find((l) => l.code === DEFAULT_LOCALE);
        expect(en).toBeDefined();
        expect(en!.coverage).toBeGreaterThanOrEqual(READY_THRESHOLD);
        expect(readyLocales().map((l) => l.code)).toContain(DEFAULT_LOCALE);
    });

    it("records coverage in range for every locale", () => {
        for (const l of SUPPORTED_LOCALES) {
            expect(l.coverage).toBeGreaterThanOrEqual(0);
            expect(l.coverage).toBeLessThanOrEqual(1);
        }
    });
});
