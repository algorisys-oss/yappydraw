/**
 * Per-span font size — different sizes for different words in ONE text box.
 *
 * `RichTextSpan.fontSize` was already modelled, serialized and rendered; what was missing was
 * any way to set it, so mixing sizes on a line meant splitting it into separate text objects.
 * The rich-text toolbar now has a size control, which works by writing an inline `font-size`
 * onto the selected run — so these cover the serialization contract that control depends on.
 *
 * The DOM half (the execCommand marker trick in `rich-text-editing-overlay`) needs a real
 * contenteditable and is verified in the browser instead.
 */

import { describe, it, expect } from "bun:test";
import { spansToHtml } from "./rich-text-utils";
import type { RichTextSpan } from "../types";

describe("spansToHtml — per-span size", () => {
    it("writes font-size only for spans that carry one", () => {
        const spans: RichTextSpan[] = [
            { text: "THE " },
            { text: "LAST", fontSize: 64 },
            { text: " FRAME" },
        ];
        const html = spansToHtml(spans);
        expect(html).toContain("font-size:64px");
        // The unsized runs must not acquire a size, or they stop following the element's own.
        expect(html.match(/font-size/g)?.length).toBe(1);
    });

    it("keeps size alongside the other run styles", () => {
        const html = spansToHtml([{ text: "BIG", fontSize: 48, bold: true, color: "#ff0000" }]);
        expect(html).toContain("font-size:48px");
        expect(html.toLowerCase()).toContain("bold");
        expect(html).toContain("#ff0000");
    });

    it("emits nothing for a size of 0 or undefined — both mean 'use the element's size'", () => {
        expect(spansToHtml([{ text: "x" }])).not.toContain("font-size");
        expect(spansToHtml([{ text: "x", fontSize: 0 }])).not.toContain("font-size");
    });

    it("handles several differently-sized runs on one line", () => {
        const html = spansToHtml([
            { text: "a", fontSize: 12 },
            { text: "b", fontSize: 96 },
            { text: "c" },
        ]);
        expect(html).toContain("font-size:12px");
        expect(html).toContain("font-size:96px");
        expect(html.match(/font-size/g)?.length).toBe(2);
    });
});
