/**
 * The French UI has to be searchable with a French keyboard.
 *
 * Two characters stand between the two, and neither is visible:
 *
 *  - The apostrophe. French labels use the typographic U+2019 (*Zone
 *    d’exportation*), which is correct typography. An AZERTY keyboard types the
 *    straight U+0027. Before `foldForSearch`, the palette lower-cased and nothing
 *    else, so the two never met and every command containing *l’* or *d’* — a
 *    large fraction of them — was unreachable by typing its own name.
 *  - The accents. *Éléments*, *Étoile*, *Répéter*: typing the unaccented
 *    spelling is what people actually do, and it matched nothing.
 *
 * `fr.ts` also carried 102 instances of U+02BC MODIFIER LETTER APOSTROPHE — a
 * LETTER that renders identically to U+2019 — on its first pass. Those are
 * normalised in the dictionary, and folded here as well, because the failure is
 * invisible on screen and would come back the next time someone types one.
 */

import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { fr } from "./locales/fr";
import { en } from "./locales/en";

/** The same fold `searchCommands` applies — and "the same" is asserted below
 *  against the shipped source, not taken on trust. */
const fold = (s: string): string =>
    s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[‘’ʼ´`]/g, "'");

const allStrings = (obj: unknown, out: string[] = []): string[] => {
    if (typeof obj === 'string') out.push(obj);
    else if (obj && typeof obj === 'object') for (const v of Object.values(obj)) allStrings(v, out);
    return out;
};

const frStrings = allStrings(fr);

describe("the copy of the fold in this file matches the shipped one", () => {
    it("behaves identically to `foldForSearch` in command-registry.ts", () => {
        // `command-registry.ts` cannot be imported here — it pulls in the store —
        // so `extraction.test.ts`'s trick is used instead: read the source, lift
        // the function out of it, and run both over a corpus. A test that quietly
        // diverges from the code it describes is worse than no test.
        const src = readFileSync(
            new URL("../utils/command-registry.ts", import.meta.url).pathname, "utf8");
        const body = src.match(/const foldForSearch = \(s: string\): string =>\n([\s\S]*?);\n/);
        expect(body).not.toBeNull();
        const shipped = new Function("s", `return ${body![1].trim().replace(/;$/, "")}`) as
            (s: string) => string;

        const corpus = [...frStrings, "Zone d'exportation", "elements", "Éléments", "ETOILE",
            "l'ordre", "l’ordre", "lʼordre", "repeter", "", "UML", "Ctrl+Z"];
        for (const sample of corpus) expect(shipped(sample)).toBe(fold(sample));
    });
});

describe("the French dictionary's own characters", () => {
    it("uses the typographic apostrophe, never the modifier letter that mimics it", () => {
        // U+02BC is category Lm — a letter. It looks exactly like U+2019 in every
        // font, so this cannot be caught by reading the UI.
        const offenders = frStrings.filter((s) => s.includes('ʼ'));
        expect(offenders).toEqual([]);
    });

    it("uses guillemets rather than English double quotes for quoted text", () => {
        const quoted = frStrings.filter((s) => s.includes('"') || s.includes('“'));
        expect(quoted).toEqual([]);
    });

    it("keeps every interpolation placeholder its English string had", () => {
        // A dropped `{{ name }}` produces a label with a hole in it, and nothing
        // fails — the template just resolves to less than it should.
        const placeholders = (s: string) =>
            (s.match(/\{\{\s*\w+\s*\}\}/g) ?? []).map((p) => p.replace(/\s+/g, '')).sort();
        const walk = (a: any, b: any, path: string[] = []): void => {
            if (typeof a === 'string') {
                expect({ at: path.join('.'), ph: placeholders(b) })
                    .toEqual({ at: path.join('.'), ph: placeholders(a) });
                return;
            }
            for (const k of Object.keys(a)) walk(a[k], b[k], [...path, k]);
        };
        walk(en, fr);
    });

    it("leaves keyboard shortcuts and standard names untranslated", () => {
        // Bound to physical keys, or not words (plan §3.3).
        expect(fr.statusBar.undo).toContain('Ctrl+Z');
        expect(fr.statusBar.zoomIn).toContain('Ctrl+=');
        expect(fr.shapes.umlClass).toContain('UML');
        expect(fr.shapes.bpmnTask).toContain('BPMN');
        expect(fr.welcomeFeatures.export).toContain('SVG');
        // The stored document name is compared literally by storage/auto-save.ts;
        // only the DISPLAY string is translated.
        expect(fr.statusBar.untitled).toBe('Sans titre');
    });
});

describe("searching the French labels the way a French keyboard types", () => {
    const findable = (label: string, typed: string) =>
        fold(label).includes(fold(typed));

    it("matches an apostrophe typed straight against the label's typographic one", () => {
        expect(fr.commands['tool-slice']).toContain('’');
        expect(findable(fr.commands['tool-slice'], "zone d'exportation")).toBe(true);
        expect(findable(fr.commands['action-shuffle-colors'], "l'ordre")).toBe(true);
        expect(findable(fr.shapes.umlUseCase, "cas d'utilisation")).toBe(true);
    });

    it("matches unaccented typing against accented labels", () => {
        expect(findable(fr.menu.elements, 'elements')).toBe(true);
        expect(findable(fr.shapes.star, 'etoile')).toBe(true);
        expect(findable(fr.commands['action-transform-again'], 'repeter')).toBe(true);
        expect(findable(fr.commands['action-backward'], 'eloigner')).toBe(true);
    });

    it("still matches when the accents ARE typed", () => {
        // The fold must widen the net, not move it.
        expect(findable(fr.menu.elements, 'Éléments')).toBe(true);
        expect(findable(fr.shapes.star, 'Étoile')).toBe(true);
    });

    it("does not collapse genuinely different words", () => {
        // Folding accents away must not make everything match everything.
        expect(findable(fr.shapes.star, 'losange')).toBe(false);
        expect(findable(fr.commands['action-undo'], 'rétablir')).toBe(false);
    });

    it("leaves English search terms working, for anyone following English docs", () => {
        // Command ids stay English and are searched too, so `undo` finds Annuler.
        expect(fold('action-undo').includes(fold('undo'))).toBe(true);
    });
});
