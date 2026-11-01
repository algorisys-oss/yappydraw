import { describe, it, expect, mock } from "bun:test";

// The id generator reads the store (and through it the whole app); the parser only needs ids.
let n = 0;
mock.module("./id-generator", () => ({ generateId: (type: string) => `${type}-${++n}` }));
const { parseMarkdownToSlides } = await import("./markdown-to-slides");

const notesOf = (md: string) => parseMarkdownToSlides(md).slides.map((s: any) => s.notes);

describe("parseMarkdownToSlides: speaker notes", () => {
    it("takes a Note: line and everything after it, up to the next slide, as notes", () => {
        const md = "# Title\nSubtitle\nNote: Welcome everyone.\n\nMention the agenda.\n\n## Agenda\n- One\n- Two\nNotes:\nKeep it short.";
        expect(notesOf(md)).toEqual(["Welcome everyone.\n\nMention the agenda.", "Keep it short."]);
    });

    it("keeps notes lines off the slide", () => {
        const doc = parseMarkdownToSlides("## Agenda\n- One\nNote: secret\n- not a bullet");
        const text = doc.elements.map((e: any) => e.text ?? '').join(' ');
        expect(text).toContain("One");
        expect(text).not.toContain("secret");
        expect(text).not.toContain("not a bullet");
    });

    it("reads HTML comments as notes, one-line and multi-line", () => {
        const md = "## A\nBody <!-- not a note: inline -->\n<!-- one line -->\n---\n## B\n<!--\nfirst\nsecond\n-->\nText";
        expect(notesOf(md)).toEqual(["one line", "first\nsecond"]);
    });

    it("a slide break ends notes", () => {
        const md = "## A\nNote: about A\n---\n## B\n- point";
        const doc = parseMarkdownToSlides(md);
        expect(doc.slides.map((s: any) => s.notes)).toEqual(["about A", undefined]);
        expect(doc.elements.map((e: any) => e.text ?? '').join(' ')).toContain("point");
    });

    it("slides without notes carry no notes field", () => {
        expect("notes" in parseMarkdownToSlides("## Plain\n- x").slides[0]).toBe(false);
    });
});
