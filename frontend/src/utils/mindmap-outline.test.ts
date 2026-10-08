/**
 * Outline export, and the round trip back through `parseOutline`.
 *
 * The import side has existed all along (paste an indented list, get a subtree); there was no
 * way out. The round-trip tests are the point: a format that can't be read back is a dead end,
 * so `markdown` and `text` are pinned to exactly what `parseOutline` accepts.
 */

import { describe, it, expect } from "bun:test";
import { mindmapToOutline, outlineLabel, outlineFileName } from "./mindmap-outline";
import { parseOutline, type OutlineNode } from "./mindmap-layout";
import type { DrawingElement } from "../types";

const node = (id: string, parentId: string | undefined, text?: string): DrawingElement =>
    ({ id, parentId, x: 0, y: 0, width: 120, height: 40, type: 'rectangle', containerText: text } as DrawingElement);

/** root → A(a1, a2), B(b1) — plus a branch connector that must never be mistaken for a node. */
const SAMPLE: DrawingElement[] = [
    node('root', undefined, 'Product Launch'),
    node('a', 'root', 'Marketing'),
    node('a1', 'a', 'Ads'),
    node('a2', 'a', 'Social'),
    node('b', 'root', 'Engineering'),
    node('b1', 'b', 'API'),
    { ...node('conn', 'root', 'ignore me'), type: 'organicBranch' } as DrawingElement,
];

/** Flatten a parsed outline back to `depth:text` pairs, for comparing shapes. */
const flatten = (roots: OutlineNode[], depth = 0): string[] =>
    roots.flatMap(r => [`${depth}:${r.text}`, ...flatten(r.children, depth + 1)]);

describe("mindmapToOutline — markdown", () => {
    it("writes nested bullets in layout order", () => {
        expect(mindmapToOutline('root', SAMPLE, 'markdown')).toBe(
            '- Product Launch\n' +
            '  - Marketing\n' +
            '    - Ads\n' +
            '    - Social\n' +
            '  - Engineering\n' +
            '    - API\n');
    });

    it("round-trips through parseOutline unchanged", () => {
        const text = mindmapToOutline('root', SAMPLE, 'markdown');
        expect(flatten(parseOutline(text))).toEqual([
            '0:Product Launch', '1:Marketing', '2:Ads', '2:Social', '1:Engineering', '2:API',
        ]);
    });
});

describe("mindmapToOutline — text", () => {
    it("writes bare indented lines", () => {
        expect(mindmapToOutline('root', SAMPLE, 'text')).toBe(
            'Product Launch\n' +
            '  Marketing\n' +
            '    Ads\n' +
            '    Social\n' +
            '  Engineering\n' +
            '    API\n');
    });

    it("round-trips through parseOutline unchanged", () => {
        const text = mindmapToOutline('root', SAMPLE, 'text');
        expect(flatten(parseOutline(text))).toEqual([
            '0:Product Launch', '1:Marketing', '2:Ads', '2:Social', '1:Engineering', '2:API',
        ]);
    });

    it("survives a deep chain", () => {
        const chain: DrawingElement[] = [node('n0', undefined, 'L0')];
        for (let i = 1; i < 8; i++) chain.push(node(`n${i}`, `n${i - 1}`, `L${i}`));
        const out = mindmapToOutline('n0', chain, 'text');
        expect(flatten(parseOutline(out))).toEqual(
            Array.from({ length: 8 }, (_, i) => `${i}:L${i}`));
    });
});

describe("mindmapToOutline — opml", () => {
    it("nests outline elements and self-closes the leaves", () => {
        expect(mindmapToOutline('root', SAMPLE, 'opml')).toBe(
            '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<opml version="2.0">\n' +
            '  <head>\n' +
            '    <title>Product Launch</title>\n' +
            '  </head>\n' +
            '  <body>\n' +
            '    <outline text="Product Launch">\n' +
            '      <outline text="Marketing">\n' +
            '        <outline text="Ads"/>\n' +
            '        <outline text="Social"/>\n' +
            '      </outline>\n' +
            '      <outline text="Engineering">\n' +
            '        <outline text="API"/>\n' +
            '      </outline>\n' +
            '    </outline>\n' +
            '  </body>\n' +
            '</opml>\n');
    });

    it("escapes XML metacharacters in labels", () => {
        const els = [node('r', undefined, 'A & B <c> "d" \'e\'')];
        const out = mindmapToOutline('r', els, 'opml');
        expect(out).toContain('text="A &amp; B &lt;c&gt; &quot;d&quot; &apos;e&apos;"');
        expect(out).not.toContain('text="A & B');
    });

    it("balances its tags on an uneven tree", () => {
        const out = mindmapToOutline('root', SAMPLE, 'opml');
        const opens = (out.match(/<outline [^/>]*>/g) || []).length;
        const closes = (out.match(/<\/outline>/g) || []).length;
        expect(opens).toBe(closes);
    });
});

describe("mindmapToOutline — edges", () => {
    it("ignores connectors that carry a parentId", () => {
        // 'conn' is an organicBranch parented to root; it is a branch, not a topic.
        expect(mindmapToOutline('root', SAMPLE, 'text')).not.toContain('ignore me');
    });

    it("exports a collapsed branch in full — collapse is a view setting", () => {
        const collapsed = SAMPLE.map(e => (e.id === 'a' ? { ...e, isCollapsed: true } : e));
        const out = mindmapToOutline('root', collapsed, 'text');
        expect(out).toContain('Ads');
        expect(out).toContain('Social');
    });

    it("gives an unlabelled node a line so its children keep their depth", () => {
        const els = [node('r', undefined, 'Root'), node('x', 'r', ''), node('y', 'x', 'Kid')];
        const out = mindmapToOutline('r', els, 'text');
        expect(flatten(parseOutline(out))).toEqual(['0:Root', '1:(untitled)', '2:Kid']);
    });

    it("flattens a multi-line label onto one line", () => {
        const els = [node('r', undefined, 'Line one\nLine two'), node('k', 'r', 'Kid')];
        const out = mindmapToOutline('r', els, 'text');
        expect(out.split('\n')[0]).toBe('Line one Line two');
        expect(flatten(parseOutline(out))).toEqual(['0:Line one Line two', '1:Kid']);
    });

    it("terminates on a parentId cycle", () => {
        const els = [
            { ...node('a', 'b', 'A') } as DrawingElement,
            node('b', 'a', 'B'),
        ];
        expect(mindmapToOutline('a', els, 'text')).toBe('A\n  B\n');
    });

    it("returns empty string for an unknown root", () => {
        expect(mindmapToOutline('nope', SAMPLE, 'markdown')).toBe('');
    });

    it("exports a lone node", () => {
        expect(mindmapToOutline('root', [node('root', undefined, 'Only')], 'text')).toBe('Only\n');
    });
});

describe("outlineLabel / outlineFileName", () => {
    it("prefers containerText, falls back to text", () => {
        expect(outlineLabel(node('a', undefined, 'Container'))).toBe('Container');
        expect(outlineLabel({ ...node('a', undefined), text: 'Plain' } as DrawingElement)).toBe('Plain');
        expect(outlineLabel(node('a', undefined))).toBe('');
    });

    it("slugs the root label into a filename stem", () => {
        expect(outlineFileName('root', SAMPLE)).toBe('product-launch');
        expect(outlineFileName('root', [node('root', undefined, '  !!!  ')])).toBe('mindmap');
        expect(outlineFileName('missing', SAMPLE)).toBe('mindmap');
    });
});
