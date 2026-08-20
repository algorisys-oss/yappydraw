/**
 * Extraction oracle for the help dialog's 188 keyboard shortcuts.
 *
 * Same argument as `extraction.test.ts`: nobody reviews 188 label moves by eye.
 * `__fixtures__/pre-i18n-hotkeys.json` is the table parsed out of
 * `components/help-dialog.tsx` before the extraction, and these tests assert the
 * dictionary reproduces every description exactly.
 *
 * The `keys` half of the fixture guards the opposite property: key COMBINATIONS
 * must NOT have moved into the dictionary. `Ctrl+Z` is bound to a physical key,
 * so a translated shortcut is a broken shortcut — the combos stay in the
 * component, and this test fails if any of them leak into `en.ts`.
 */

import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { en } from "./locales/en";
import fixture from "./__fixtures__/pre-i18n-hotkeys.json";

const hotkeys = en.hotkeys as Record<string, string>;
const categories = en.hotkeyCategory as Record<string, string>;

describe("shortcut descriptions survived extraction", () => {
    it("extracted all 188", () => {
        expect(Object.keys(fixture.hotkeys)).toHaveLength(188);
        expect(Object.keys(hotkeys)).toHaveLength(188);
    });

    it("reproduces every description character for character", () => {
        const changed: string[] = [];
        for (const [key, label] of Object.entries(fixture.hotkeys)) {
            if (hotkeys[key] !== label) changed.push(`${key}: ${JSON.stringify(label)} → ${JSON.stringify(hotkeys[key])}`);
        }
        expect(changed).toEqual([]);
    });

    it("carries all seven category headings", () => {
        for (const [slug, title] of Object.entries(fixture.hotkeyCategory)) {
            expect(categories[slug]).toBe(title);
        }
        expect(Object.keys(categories)).toHaveLength(7);
    });

    it("keys every description to a category that exists", () => {
        const orphans = Object.keys(hotkeys).filter((k) => !(k.split("-")[0] in categories));
        expect(orphans).toEqual([]);
    });
});

describe("key combinations stayed OUT of the dictionary", () => {
    const dictText = JSON.stringify(en);

    it("did not move any combo into the translated strings", () => {
        // A translator handed "Ctrl+Shift+E" will eventually localise the letter,
        // and the shortcut silently stops matching the keybinding.
        const leaked = Object.entries(fixture.keys)
            .filter(([, combo]) => /^[A-Za-z]+(\+[A-Za-z0-9]+)+$/.test(combo))
            .filter(([, combo]) => dictText.includes(`"${combo}"`));
        expect(leaked).toEqual([]);
    });

    it("still defines a combo for every description", () => {
        // The rewrite must not have dropped a `keys` value while moving labels out.
        const source = readFileSync(new URL("../components/help-dialog.tsx", import.meta.url).pathname, "utf8");
        const missing = Object.keys(fixture.hotkeys).filter((key) => !source.includes(`{ key: '${key}', keys: `));
        expect(missing).toEqual([]);
    });

    it("preserves the one combo written with double quotes (Shift+')", () => {
        const source = readFileSync(new URL("../components/help-dialog.tsx", import.meta.url).pathname, "utf8");
        expect(source).toContain(`keys: "Shift+'"`);
    });
});
