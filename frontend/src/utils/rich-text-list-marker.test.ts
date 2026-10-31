import { describe, it, expect } from "bun:test";
import { listMarkerText, listMarkerX, listTextXWith, listTextXResolver, markerPropsOf, spansToHtml } from "./rich-text-utils";

describe("list markers", () => {
    it("draws Yappy's defaults when a span carries no overrides", () => {
        expect(listMarkerText({ text: 'a', listType: 'bullet' })).toBe('•');
        expect(listMarkerText({ text: 'a', listType: 'ordered', listIndex: 3 })).toBe('3.');
        expect(listMarkerX({ text: 'a', listType: 'bullet', listLevel: 2 })).toBe(40);
    });
    it("formats numbering styles and suffixes", () => {
        const n = (listIndex: number, listNumberStyle: any, listNumberSuffix?: any) => listMarkerText({ text: '', listType: 'ordered', listIndex, listNumberStyle, listNumberSuffix });
        expect(n(1, 'lower-alpha', 'paren')).toBe('a)');
        expect(n(28, 'upper-alpha')).toBe('AB.');
        expect(n(4, 'lower-roman', 'parens')).toBe('(iv)');
        expect(n(1994, 'upper-roman', 'none')).toBe('MCMXCIV');
    });
    it("uses a custom glyph and explicit marker position", () => {
        expect(listMarkerText({ text: '', listType: 'bullet', listMarker: '▪' })).toBe('▪');
        expect(listMarkerX({ text: '', listType: 'bullet', listLevel: 3, listMarkerIndent: 12 })).toBe(12);
    });
    it("validates overrides, dropping malformed values", () => {
        expect(markerPropsOf({ listMarker: 'xxxxxx', listNumberStyle: 'bogus', listMarkerScale: 99, listIndent: -5, listMarkerIndent: 'a' }))
            .toEqual({ listMarker: 'xxxx', listMarkerScale: 4, listIndent: 0 });
    });
    it("keeps overrides on the <li> so editing preserves them, escaped", () => {
        const html = spansToHtml([{ text: 'item', listType: 'bullet', listLevel: 0, listMarker: '"<', listIndent: 30 }]);
        expect(html).toContain('data-list="{&quot;listMarker&quot;:&quot;\\&quot;&lt;&quot;,&quot;listIndent&quot;:30}"');
        expect(spansToHtml([{ text: 'item', listType: 'bullet' }])).toBe('<ul><li>item</li></ul>');
    });
    it("starts item text past a wide marker instead of over it", () => {
        const em = (t: string, font: string) => t.length * Number(/(\d+)px/.exec(font)![1]) * 0.35;
        const d = { fontSize: 28 };
        // A bullet at 28 px fits Yappy's 20 px default; "IV." does not, and pushes the text right.
        expect(listTextXWith(em, { text: '', listType: 'bullet' }, d)).toBe(20);
        expect(listTextXWith(em, { text: '', listType: 'ordered', listIndex: 4, listNumberStyle: 'upper-roman' }, d)).toBeCloseTo(3 * 28 * 0.35 + 28 * 0.3, 5);
        // An explicit hanging indent (imported from PowerPoint) is kept as it is.
        expect(listTextXWith(em, { text: '', listType: 'ordered', listIndex: 4, listIndent: 30, listMarkerIndent: 0 }, d)).toBe(30);
    });
    it("lines up the items of one level on the widest marker", () => {
        const em = (t: string, font: string) => t.length * Number(/(\d+)px/.exec(font)![1]) * 0.35;
        const items = [9, 10, 11].map(i => ({ text: 'x', listType: 'ordered' as const, listIndex: i }));
        const sub = { text: 'y', listType: 'bullet' as const, listLevel: 1 };
        const at = listTextXResolver(em, [...items, sub], { fontSize: 28 });
        // "9." alone would start sooner; it takes the "10."/"11." position so the text lines up.
        expect(items.map(at)).toEqual([at(items[1]), at(items[1]), at(items[1])]);
        expect(at(items[0])).toBeGreaterThan(listTextXWith(em, items[0], { fontSize: 28 }));
        expect(at(sub)).toBe(listTextXWith(em, sub, { fontSize: 28 })); // another level is measured on its own
    });
});
