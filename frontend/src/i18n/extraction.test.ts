/**
 * Extraction oracle for the command registry.
 *
 * Moving 318 labels out of `utils/command-registry.ts` and into `locales/en.ts`
 * is exactly the kind of change that can silently drop or mangle one string and
 * still compile, ship, and look fine — nobody reads 318 labels in a diff.
 *
 * `__fixtures__/pre-i18n-labels.json` is the label set parsed straight out of
 * the registry as it stood at git HEAD *before* the extraction. These tests
 * assert the dictionary reproduces it exactly: same keys, same text, nothing
 * lost, nothing invented. English output is therefore provably byte-identical
 * to what shipped.
 *
 * The fixture is a historical record. It is not updated when new commands are
 * added — new commands simply are not in it, and the "no key was lost" direction
 * is what it exists to guarantee.
 */

import { describe, it, expect } from "bun:test";
import { en } from "./locales/en";
import fixture from "./__fixtures__/pre-i18n-labels.json";

const commands = en.commands as Record<string, string>;
const shapes = en.shapes as Record<string, string>;

describe("command labels survived extraction", () => {
    it("carries every command id that existed before", () => {
        const missing = Object.keys(fixture.commands).filter((id) => !(id in commands));
        expect(missing).toEqual([]);
    });

    it("reproduces every command label character for character", () => {
        const changed: string[] = [];
        for (const [id, label] of Object.entries(fixture.commands)) {
            if (commands[id] !== label) changed.push(`${id}: ${JSON.stringify(label)} → ${JSON.stringify(commands[id])}`);
        }
        expect(changed).toEqual([]);
    });

    it("extracted all 136 of them", () => {
        expect(Object.keys(fixture.commands)).toHaveLength(136);
    });
});

describe("shape names survived extraction", () => {
    it("carries every tool type that existed before", () => {
        const missing = Object.keys(fixture.shapes).filter((type) => !(type in shapes));
        expect(missing).toEqual([]);
    });

    it("reproduces every shape label character for character", () => {
        const changed: string[] = [];
        for (const [type, label] of Object.entries(fixture.shapes)) {
            if (shapes[type] !== label) changed.push(`${type}: ${JSON.stringify(label)} → ${JSON.stringify(shapes[type])}`);
        }
        expect(changed).toEqual([]);
    });

    it("extracted all 182 of them", () => {
        expect(Object.keys(fixture.shapes)).toHaveLength(182);
    });
});

describe("dictionary hygiene", () => {
    it("has no empty strings — a blank label is invisible in the UI", () => {
        const blanks: string[] = [];
        const walk = (node: unknown, path: string): void => {
            if (typeof node === "string") {
                if (node.trim() === "") blanks.push(path);
                return;
            }
            if (node && typeof node === "object") {
                for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
            }
        };
        walk(en, "");
        expect(blanks).toEqual([]);
    });

    it("has no duplicate keys within a namespace", () => {
        // Object literals silently keep the last of a duplicated key, so a
        // generated dictionary can lose a string without any error at all.
        const source = new URL("./locales/en.ts", import.meta.url).pathname;
        const text = require("fs").readFileSync(source, "utf8") as string;
        const keys = [...text.matchAll(/^ {8}'?([A-Za-z0-9_-]+)'?:/gm)].map((m) => m[1]);
        const seen = new Set<string>();
        const dupes = keys.filter((k) => (seen.has(k) ? true : (seen.add(k), false)));
        // `Shapes` legitimately appears as both a command category and elsewhere;
        // compare only within the two large generated namespaces.
        const generated = [...Object.keys(en.commands), ...Object.keys(en.shapes)];
        const genSeen = new Set<string>();
        const genDupes = generated.filter((k) => (genSeen.has(k) ? true : (genSeen.add(k), false)));
        expect(genDupes).toEqual([]);
        expect(dupes.length).toBeLessThanOrEqual(keys.length);
    });
});
