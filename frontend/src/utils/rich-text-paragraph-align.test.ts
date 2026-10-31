import { describe, it, expect } from "bun:test";
import { layoutRichText, alignedLineX, spansToHtml } from "./rich-text-utils";

// A 10px-per-character measurer stands in for the canvas.
const ctx: any = { font: '', measureText: (t: string) => ({ width: t.length * 10 }) };

describe("per-paragraph alignment", () => {
    const spans = [
        { text: 'Heading', paragraphAlign: 'center' as const }, { text: '\n' },
        { text: 'body text that wraps onto two lines', paragraphAlign: 'right' as const }, { text: '\n' },
        { text: 'plain' },
    ];
    const layout = layoutRichText(ctx, spans, 200, { fontSize: 20 });
    it("gives each line its paragraph's alignment, wrapped lines included", () => {
        expect(layout.lineAligns).toEqual(['center', 'right', 'right', undefined]);
    });
    it("places a line by its own alignment, falling back to the element's", () => {
        expect(alignedLineX('center', 'left', 40, 0, 100, 200)).toBe(80);
        expect(alignedLineX('right', 'left', 40, 0, 100, 200)).toBe(160);
        expect(alignedLineX(undefined, 'right', 40, 0, 100, 200)).toBe(160);
        expect(alignedLineX(undefined, undefined, 40, 0, 100, 200)).toBe(0);
        // A connector label's area is unbounded; centring must not become NaN.
        expect(alignedLineX('center', 'left', 40, -Infinity, 100, Infinity)).toBe(80);
    });
    it("survives the editor's HTML round trip", () => {
        expect(spansToHtml([{ text: 'x', paragraphAlign: 'center' }])).toContain('data-pa="center"');
        expect(spansToHtml([{ text: 'x', paragraphAlign: 'bogus' as any }])).not.toContain('data-pa');
    });
});
