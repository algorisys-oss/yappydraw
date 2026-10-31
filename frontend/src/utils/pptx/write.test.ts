import { describe, it, expect } from "bun:test";
import { unzipSync, strFromU8 } from "fflate";
import { DOMParser } from "@xmldom/xmldom";
import { buildPptx } from "./write";
import { parseSvgPath, custGeomXml, cmdsBounds } from "./custgeom";
import { emu, ang, fontSz } from "./ooxml";
import type { Deck, Item } from "./deck";

const PNG_1x1 = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), c => c.charCodeAt(0));

const black = { hex: '#000000' };

const sampleDeck = (): Deck => {
    const items: Item[] = [
        { kind: 'shape', id: 2, name: 'Box', x: 100, y: 100, w: 300, h: 150, rot: 30,
          geom: { kind: 'preset', prst: 'rect' }, fill: { kind: 'solid', color: { hex: '#ffcc00' } },
          line: { width: 2, color: black, dash: 'dash' },
          text: { paragraphs: [{ runs: [{ text: 'A & <b>' }], align: 'ctr' }], anchor: 'ctr', insets: { l: 10, t: 0, r: 10, b: 0 }, wrap: true, defaults: { size: 16 } } },
        { kind: 'shape', id: 3, name: 'Star', x: 500, y: 100, w: 100, h: 100,
          geom: { kind: 'custom', paths: [{ cmds: parseSvgPath('M 50 0 L 100 100 L 0 100 Z') }] },
          fill: { kind: 'linear', angle: 90, scaled: true, stops: [{ pos: 0, color: { hex: '#ff0000' } }, { pos: 1, color: { hex: '#0000ff', alpha: 0.5 } }] }, line: null },
        { kind: 'connector', id: 4, name: 'Arrow', x: 400, y: 175, w: 100, h: 0,
          geom: { kind: 'preset', prst: 'line' }, line: { width: 2, color: black, tail: { type: 'triangle' } },
          start: { id: 2, idx: 3 }, end: { id: 3, idx: 1 } },
        { kind: 'group', id: 5, name: 'G', x: 0, y: 300, w: 200, h: 200, children: [
            { kind: 'picture', id: 6, name: 'Pic', x: 0, y: 300, w: 200, h: 200, media: { bytes: PNG_1x1, ext: 'png' }, crop: { l: 0.1, t: 0, r: 0, b: 0.2 } },
        ] },
    ];
    return {
        width: 1920, height: 1080, title: 'Test',
        slides: [
            { items, background: { kind: 'solid', color: { hex: '#eeeeee' } }, transition: { kind: 'push', dir: 'l', durationMs: 450 } },
            { items: [], transition: { kind: 'fade', durationMs: 1200 } },
        ],
    };
};

const unzip = (bytes: Uint8Array) => {
    const files = unzipSync(bytes);
    return (name: string) => files[name] ? strFromU8(files[name]) : undefined;
};

/** Parse with xmldom and fail on any parser error, so every part is checked for well-formedness. */
const parseStrict = (xml: string) => {
    const errors: string[] = [];
    const doc = new DOMParser({ onError: (level: string, msg: string) => { if (level !== 'warning') errors.push(msg); } } as any)
        .parseFromString(xml, 'application/xml');
    expect(errors).toEqual([]);
    return doc;
};

describe("ooxml units", () => {
    it("converts px, degrees and font sizes", () => {
        expect(emu(1)).toBe(9525);
        expect(emu(1920)).toBe(18288000);
        expect(ang(90)).toBe(5400000);
        expect(ang(-90)).toBe(16200000);
        expect(ang(360)).toBe(0);
        expect(fontSz(16)).toBe(1200); // 16px = 12pt
    });
});

describe("parseSvgPath", () => {
    it("normalises relative, H/V and closes", () => {
        const c = parseSvgPath('m 10 10 h 20 v 20 H 10 z');
        expect(c).toEqual([
            { op: 'M', x: 10, y: 10 }, { op: 'L', x: 30, y: 10 }, { op: 'L', x: 30, y: 30 }, { op: 'L', x: 10, y: 30 }, { op: 'Z' },
        ]);
    });
    it("treats extra pairs after M as lineTo", () => {
        expect(parseSvgPath('M0 0 10 0 10 10').map(c => c.op)).toEqual(['M', 'L', 'L']);
    });
    it("raises quadratics to cubics exactly", () => {
        const [, q] = parseSvgPath('M 0 0 Q 30 30 60 0');
        expect(q).toEqual({ op: 'C', x1: 20, y1: 20, x2: 40, y2: 20, x: 60, y: 0 });
    });
    it("flattens arcs to cubics that end on the arc endpoint", () => {
        const c = parseSvgPath('M 0 50 A 50 50 0 0 1 100 50');
        expect(c.every(x => x.op === 'M' || x.op === 'C')).toBe(true);
        const last = c[c.length - 1] as any;
        expect(last.x).toBeCloseTo(100, 6);
        expect(last.y).toBeCloseTo(50, 6);
        const b = cmdsBounds(c)!;
        expect(b.minY).toBeLessThan(5); // bulges up to the top of the circle
    });
    it("reads scientific notation without desynchronising", () => {
        const c = parseSvgPath('M 1e-15 0 L 10 2.5e1');
        expect(c[1]).toEqual({ op: 'L', x: 10, y: 25 });
    });
    it("drops a malformed tail instead of producing NaN", () => {
        const c = parseSvgPath('M 0 0 L 10 10 L 5');
        expect(c).toEqual([{ op: 'M', x: 0, y: 0 }, { op: 'L', x: 10, y: 10 }]);
    });
});

describe("custGeomXml", () => {
    it("scales small path spaces up so integer coordinates keep precision", () => {
        const xml = custGeomXml([{ cmds: parseSvgPath('M 0 0 L 0.5 1') }], 1, 1);
        expect(xml).toContain('<a:path w="100000" h="100000">');
        expect(xml).toContain('<a:lnTo><a:pt x="50000" y="100000"/></a:lnTo>');
        parseStrict(`<r xmlns:a="a">${xml}</r>`);
    });
    it("marks open/unstroked subpaths and skips empty ones", () => {
        const xml = custGeomXml([
            { cmds: parseSvgPath('M 0 0 L 1 1'), fill: false },
            { cmds: parseSvgPath('M 0 0'), stroke: false },
        ], 10, 10);
        expect(xml.match(/<a:path /g)!.length).toBe(1);
        expect(xml).toContain('fill="none"');
    });
});

describe("buildPptx", () => {
    const bytes = buildPptx(sampleDeck(), { now: '2026-10-31T00:00:00Z' });
    const read = unzip(bytes);

    it("writes every required part, all well-formed", () => {
        const required = [
            '[Content_Types].xml', '_rels/.rels', 'ppt/presentation.xml', 'ppt/_rels/presentation.xml.rels',
            'ppt/slideMasters/slideMaster1.xml', 'ppt/slideLayouts/slideLayout1.xml', 'ppt/theme/theme1.xml',
            'ppt/slides/slide1.xml', 'ppt/slides/slide2.xml', 'ppt/slides/_rels/slide1.xml.rels',
            'ppt/presProps.xml', 'ppt/viewProps.xml', 'ppt/tableStyles.xml', 'docProps/core.xml', 'docProps/app.xml',
        ];
        for (const r of required) {
            const x = read(r);
            expect(x, r).toBeDefined();
            parseStrict(x!);
        }
    });

    it("declares every slide and the media extension in [Content_Types]", () => {
        const ct = read('[Content_Types].xml')!;
        expect(ct).toContain('PartName="/ppt/slides/slide1.xml"');
        expect(ct).toContain('PartName="/ppt/slides/slide2.xml"');
        expect(ct).toContain('Extension="png"');
    });

    it("sizes the slide from the deck in EMU", () => {
        expect(read('ppt/presentation.xml')).toContain('<p:sldSz cx="18288000" cy="10287000"/>');
    });

    it("clamps a deck larger than 56 inches into PowerPoint's range", () => {
        const big = unzip(buildPptx({ width: 8000, height: 4000, slides: [{ items: [] }] }));
        const m = big('ppt/presentation.xml')!.match(/<p:sldSz cx="(\d+)" cy="(\d+)"/)!;
        expect(Number(m[1])).toBe(51206400);
        expect(Number(m[2])).toBe(25603200);
    });

    it("writes shapes, escaped text, connectors with glue, group and picture", () => {
        const s = read('ppt/slides/slide1.xml')!;
        expect(s).toContain('<a:prstGeom prst="rect">');
        expect(s).toContain('rot="1800000"');
        expect(s).toContain('<a:t>A &amp; &lt;b&gt;</a:t>');
        expect(s).toContain('<a:custGeom>');
        expect(s).toContain('<a:lin ang="5400000" scaled="1"/>');
        expect(s).toContain('<a:alpha val="50000"/>');
        expect(s).toContain('<p:cxnSp>');
        expect(s).toContain('<a:stCxn id="2" idx="3"/>');
        expect(s).toContain('<a:tailEnd type="triangle"');
        expect(s).toContain('<p:grpSp>');
        expect(s).toContain('<a:srcRect l="10000" t="0" r="0" b="20000"/>');
        expect(s).toContain('<a:prstDash val="dash"/>');
        expect(read('ppt/slides/_rels/slide1.xml.rels')).toContain('Target="../media/image1.png"');
    });

    it("writes background and transitions with exact p14 duration", () => {
        const s1 = read('ppt/slides/slide1.xml')!;
        expect(s1).toContain('<p:bg><p:bgPr><a:solidFill><a:srgbClr val="EEEEEE"/>');
        expect(s1).toContain('<p:transition spd="fast" p14:dur="450"><p:push dir="l"/>');
        expect(read('ppt/slides/slide2.xml')).toContain('p14:dur="1200"><p:fade/>');
    });

    it("applies the per-slide fit to positions, sizes and font sizes", () => {
        const deck: Deck = { width: 1000, height: 1000, slides: [{ fit: { scale: 0.5, dx: 100, dy: 0 }, items: [
            { kind: 'shape', id: 2, name: 's', x: 0, y: 0, w: 200, h: 100, geom: { kind: 'preset', prst: 'rect' }, fill: { kind: 'none' }, line: null,
              text: { paragraphs: [{ runs: [{ text: 'x', size: 32 }] }], anchor: 't', insets: { l: 0, t: 0, r: 0, b: 0 }, wrap: true } },
        ] }] };
        const s = unzip(buildPptx(deck))('ppt/slides/slide1.xml')!;
        expect(s).toContain(`<a:off x="${emu(100)}" y="0"/><a:ext cx="${emu(100)}" cy="${emu(50)}"/>`);
        expect(s).toContain(`sz="${fontSz(16)}"`);
    });
});
