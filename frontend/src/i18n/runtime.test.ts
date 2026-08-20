/**
 * The reactive translator: resolution, interpolation, locale switching, and the
 * per-key fallback that lets a half-finished locale degrade one string at a time
 * instead of going blank.
 */

import { describe, it, expect, afterAll } from "bun:test";
import { readFileSync } from "node:fs";
import { t, plural, setLocale, currentLocale, currentDirection, mergeDictionary } from "./index";
import { en } from "./locales/en";
import { PSEUDO_LOCALE } from "./pseudo";

afterAll(async () => {
    await setLocale("en");
});

describe("translator", () => {
    it("resolves a command label", () => {
        expect(t("commands.action-undo")).toBe("Undo");
        expect(t("commands.tool-selection")).toBe("Selection Tool");
    });

    it("resolves a shape name keyed by tool type", () => {
        expect(t("shapes.rectangle")).toBe("Rectangle");
        expect(t("shapes.umlUseCase")).toBe("UML Use Case");
    });

    it("interpolates template arguments", () => {
        expect(t("commands.layer-activate", { name: "Layer 1" })).toBe("Activate Layer: Layer 1");
    });

    it("starts in English, left-to-right", () => {
        expect(currentLocale()).toBe("en");
        expect(currentDirection()).toBe("ltr");
    });
});

describe("locale switching", () => {
    it("re-resolves every key after a switch, and switches back", async () => {
        const before = t("commands.action-undo");

        await setLocale(PSEUDO_LOCALE);
        expect(currentLocale()).toBe(PSEUDO_LOCALE);
        expect(t("commands.action-undo")).not.toBe(before);
        expect(t("commands.action-undo")).toContain("⟦");

        await setLocale("en");
        expect(t("commands.action-undo")).toBe(before);
    });

    it("keeps interpolation working in the pseudo locale", async () => {
        await setLocale(PSEUDO_LOCALE);
        // The placeholder must survive pseudoization or interpolation silently
        // breaks — the value would be dropped rather than mangled, which is
        // exactly the kind of bug pseudo-localization exists to surface.
        expect(t("commands.layer-activate", { name: "Layer 1" })).toContain("Layer 1");
        await setLocale("en");
    });

    it("reports direction from the locale table", async () => {
        await setLocale("en");
        expect(currentDirection()).toBe("ltr");
    });
});

describe("per-key fallback", () => {
    it("uses the translation where one exists", () => {
        const merged = mergeDictionary({ commands: { "action-undo": "Deshacer" } } as never);
        expect(merged["commands.action-undo"]).toBe("Deshacer");
    });

    it("falls back to English for untranslated SIBLINGS in the same namespace", () => {
        // The regression this guards: overlaying a partial `commands` object
        // wholesale, so every command the locale had not reached yet disappeared.
        const merged = mergeDictionary({ commands: { "action-undo": "Deshacer" } } as never);
        expect(merged["commands.action-redo"]).toBe("Redo");
        expect(merged["commands.tool-pan"]).toBe("Pan Tool");
    });

    it("falls back to English for entirely untranslated namespaces", () => {
        const merged = mergeDictionary({ commands: { "action-undo": "Deshacer" } } as never);
        expect(merged["shapes.rectangle"]).toBe("Rectangle");
        expect(merged["commandPalette.noResults"]).toBe("No commands found");
    });

    it("leaves English intact — merging must not mutate the source dictionary", () => {
        mergeDictionary({ commands: { "action-undo": "Deshacer" } } as never);
        expect(en.commands["action-undo"]).toBe("Undo");
    });
});

describe("Spanish", () => {
    it("switches every namespace, not just the one the switch touched", async () => {
        await setLocale("es");
        expect(t("commands.action-undo")).toBe("Deshacer");
        expect(t("shapes.rectangle")).toBe("Rectángulo");
        expect(t("commandCategory.Tools")).toBe("Herramientas");
        expect(t("hotkeys.editor-duplicate")).toBe("Duplicar");
        expect(t("welcome.headline")).toBe("Haz clic en una herramienta para empezar a crear");
        expect(t("toolLabel.pan")).toBe("Mano");
        await setLocale("en");
    });

    it("keeps interpolation working through translated word order", async () => {
        await setLocale("es");
        expect(t("commands.layer-activate", { name: "Capa 1" })).toBe("Activar capa: Capa 1");
        await setLocale("en");
    });

    it("leaves standard and product names untranslated", async () => {
        await setLocale("es");
        // UML/BPMN/DFD are standards; translating them would make the shape
        // unfindable to anyone who knows the notation.
        expect(t("shapes.umlClass")).toContain("UML");
        expect(t("shapes.bpmnTask")).toContain("BPMN");
        expect(t("shapes.dfdProcess")).toContain("DFD");
        expect(t("welcomeFeatures.export")).toContain("SVG");
        await setLocale("en");
    });

    it("has no English left over anywhere in the dictionary", async () => {
        // A scaffolded locale marks untranslated keys with a trailing comment;
        // none should survive into a locale we mark as complete.
        const source = readFileSync(new URL("./locales/es.ts", import.meta.url).pathname, "utf8");
        expect(source).not.toContain("// TRANSLATE");
    });
});

describe("German", () => {
    it("switches every namespace, not just the one the switch touched", async () => {
        await setLocale("de");
        expect(t("commands.action-undo")).toBe("Rückgängig");
        expect(t("shapes.rectangle")).toBe("Rechteck");
        expect(t("commandCategory.Tools")).toBe("Werkzeuge");
        expect(t("hotkeys.editor-duplicate")).toBe("Duplizieren");
        expect(t("welcome.headline")).toBe("Klicke auf ein Werkzeug, um loszulegen");
        expect(t("toolLabel.pan")).toBe("Hand");
        await setLocale("en");
    });

    it("keeps interpolation working through translated word order", async () => {
        await setLocale("de");
        expect(t("commands.layer-activate", { name: "Ebene 1" })).toBe("Ebene aktivieren: Ebene 1");
        // German moves the verb to the end, so the tooltip's two tokens end up
        // in a different order than the English sentence they came from.
        expect(
            t("toolbar.dockTooltip", { where: t("dockPosition.left"), action: t("dockAction.left") }),
        ).toBe("Werkzeugleiste: linker Rand — klicken, um sie am linken Rand anzudocken");
        await setLocale("en");
    });

    it("declines the noun in the plural form", async () => {
        await setLocale("de");
        const forms = { one: t("statusBarCount.one"), other: t("statusBarCount.other") };
        expect(plural(1, forms)).toBe("1 Element");
        expect(plural(3, forms)).toBe("3 Elemente");
        await setLocale("en");
    });

    it("uses German typography — low quotes and a space before the percent sign", async () => {
        await setLocale("de");
        expect(t("welcome.openDrawing", { name: "Skizze" })).toBe("„Skizze“ öffnen");
        expect(t("toolbar.stabilizationOn", { percent: 40 })).toContain("40 %");
        await setLocale("en");
    });

    it("leaves standard and product names untranslated", async () => {
        await setLocale("de");
        expect(t("shapes.umlClass")).toContain("UML");
        expect(t("shapes.bpmnTask")).toContain("BPMN");
        expect(t("shapes.dfdProcess")).toContain("DFD");
        expect(t("welcomeFeatures.export")).toContain("SVG");
        await setLocale("en");
    });

    it("has no English left over anywhere in the dictionary", async () => {
        const source = readFileSync(new URL("./locales/de.ts", import.meta.url).pathname, "utf8");
        expect(source).not.toContain("// TRANSLATE");
    });
});

describe("Japanese", () => {
    it("switches every namespace, not just the one the switch touched", async () => {
        await setLocale("ja");
        expect(t("commands.action-undo")).toBe("取り消し");
        expect(t("shapes.rectangle")).toBe("長方形");
        expect(t("commandCategory.Tools")).toBe("ツール");
        expect(t("hotkeys.editor-duplicate")).toBe("複製");
        expect(t("welcome.headline")).toBe("ツールをクリックして描き始めましょう");
        expect(t("toolLabel.pan")).toBe("手のひら");
        await setLocale("en");
    });

    it("keeps interpolation working through translated word order", async () => {
        await setLocale("ja");
        expect(t("commands.layer-activate", { name: "レイヤー 1" })).toBe("レイヤーを有効化: レイヤー 1");
        await setLocale("en");
    });

    it("uses one count form, because Japanese has no singular/plural split", async () => {
        await setLocale("ja");
        const forms = { one: t("statusBarCount.one"), other: t("statusBarCount.other") };
        // Intl.PluralRules('ja') answers "other" for every number, so both forms
        // have to read correctly for 1 — a borrowed English singular would not.
        expect(plural(1, forms)).toBe("1 個の要素");
        expect(plural(3, forms)).toBe("3 個の要素");
        await setLocale("en");
    });

    it("uses Japanese corner brackets for quoted names", async () => {
        await setLocale("ja");
        expect(t("welcome.openDrawing", { name: "スケッチ" })).toBe("「スケッチ」を開く");
        await setLocale("en");
    });

    it("leaves standard and product names untranslated", async () => {
        await setLocale("ja");
        expect(t("shapes.umlClass")).toContain("UML");
        expect(t("shapes.bpmnTask")).toContain("BPMN");
        expect(t("shapes.dfdProcess")).toContain("DFD");
        expect(t("welcomeFeatures.export")).toContain("SVG");
        await setLocale("en");
    });

    it("has no English left over anywhere in the dictionary", async () => {
        const source = readFileSync(new URL("./locales/ja.ts", import.meta.url).pathname, "utf8");
        expect(source).not.toContain("// TRANSLATE");
    });
});
