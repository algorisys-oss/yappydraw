import { describe, it, expect } from "bun:test";
import { zipSync, unzipSync, strToU8 } from "fflate";
import { DOMParser } from "@xmldom/xmldom";
import { readPptx } from "./read";
import { buildPptx } from "./write";
import { parseSvgPath } from "./custgeom";
import type { Deck, ShapeItem, ConnectorItem, PictureItem, GroupItem } from "./deck";

const parseXml = (s: string) => new DOMParser().parseFromString(s, 'application/xml') as unknown as Document;
const read = (bytes: Uint8Array) => readPptx(bytes, { parseXml });

const PNG_1x1 = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), c => c.charCodeAt(0));

describe("readPptx: round trip through our own writer", () => {
    const deck: Deck = {
        width: 1920, height: 1080,
        slides: [{
            background: { kind: 'solid', color: { hex: '#eeeeee' } },
            transition: { kind: 'push', dir: 'u', durationMs: 450 },
            items: [
                { kind: 'shape', id: 2, name: 'Box', x: 100, y: 120, w: 300, h: 150, rot: 30, flipH: true,
                  geom: { kind: 'preset', prst: 'roundRect', adj: { adj: 25000 } }, fill: { kind: 'solid', color: { hex: '#ffcc00', alpha: 0.5 } },
                  line: { width: 3, color: { hex: '#000000' }, dash: 'dash' },
                  text: { paragraphs: [{ runs: [{ text: 'Hello ', bold: true }, { text: 'world', italic: true, color: { hex: '#c00000' } }], align: 'ctr' }],
                          anchor: 'ctr', insets: { l: 10, t: 4, r: 10, b: 4 }, wrap: true, defaults: { size: 24, font: 'Inter' } } },
                { kind: 'shape', id: 3, name: 'Tri', x: 600, y: 100, w: 200, h: 200,
                  geom: { kind: 'custom', paths: [{ cmds: parseSvgPath('M 100 0 L 200 200 L 0 200 Z') }] },
                  fill: { kind: 'linear', angle: 45, scaled: true, stops: [{ pos: 0, color: { hex: '#ff0000' } }, { pos: 1, color: { hex: '#0000ff' } }] }, line: null },
                { kind: 'connector', id: 4, name: 'Arrow', x: 400, y: 195, w: 200, h: 0,
                  geom: { kind: 'preset', prst: 'straightConnector1' }, line: { width: 2, color: { hex: '#333333' }, tail: { type: 'triangle' } },
                  start: { id: 2, idx: 3 }, end: { id: 3, idx: 1 } },
                { kind: 'group', id: 5, name: 'G', x: 0, y: 400, w: 300, h: 200, children: [
                    { kind: 'picture', id: 6, name: 'Pic', x: 0, y: 400, w: 300, h: 200, media: { bytes: PNG_1x1, ext: 'png' }, crop: { l: 0.1, t: 0.2, r: 0, b: 0 }, alpha: 0.5 },
                ] },
            ],
        }],
    };
    const { deck: back, warnings } = read(buildPptx(deck));
    const items = back.slides[0].items;

    it("reads without warnings and keeps the slide size", () => {
        expect(warnings).toEqual([]);
        expect(back.width).toBe(1920);
        expect(back.height).toBe(1080);
    });
    it("keeps shape placement, preset and adjust values, fill alpha and dash", () => {
        const s = items[0] as ShapeItem;
        expect(s.kind).toBe('shape');
        expect([s.x, s.y, s.w, s.h]).toEqual([100, 120, 300, 150]);
        expect(s.rot).toBeCloseTo(30, 6);
        expect(s.flipH).toBe(true);
        expect(s.geom).toEqual({ kind: 'preset', prst: 'roundRect', adj: { adj: 25000 } });
        expect(s.fill).toEqual({ kind: 'solid', color: { hex: '#ffcc00', alpha: 0.5 } });
        expect(s.line).toMatchObject({ width: 3, dash: 'dash' });
    });
    it("keeps runs: text, bold, italic, colour, size and font", () => {
        const runs = (items[0] as ShapeItem).text!.paragraphs[0].runs;
        expect(runs.map(r => r.text)).toEqual(['Hello ', 'world']);
        expect(runs[0]).toMatchObject({ bold: true, size: 24, font: 'Inter' });
        expect(runs[1]).toMatchObject({ italic: true, color: { hex: '#c00000' } });
        expect((items[0] as ShapeItem).text!.anchor).toBe('ctr');
    });
    it("evaluates custom geometry back to the same outline", () => {
        const s = items[1] as ShapeItem;
        expect(s.geom.kind).toBe('custom');
        const cmds = (s.geom as any).paths[0].cmds;
        expect(cmds[0]).toEqual({ op: 'M', x: 100, y: 0 });
        expect(cmds[1].x).toBeCloseTo(200, 6); expect(cmds[1].y).toBeCloseTo(200, 6);
        expect(s.fill).toMatchObject({ kind: 'linear', angle: 45, scaled: true });
    });
    it("keeps connector glue and arrowheads", () => {
        const c = items[2] as ConnectorItem;
        expect(c.kind).toBe('connector');
        expect(c.start).toEqual({ id: 2, idx: 3 });
        expect(c.end).toEqual({ id: 3, idx: 1 });
        expect(c.line.tail?.type).toBe('triangle');
    });
    it("keeps groups, pictures, crop and transparency", () => {
        const g = items[3] as GroupItem;
        expect(g.kind).toBe('group');
        const p = g.children[0] as PictureItem;
        expect([p.x, p.y, p.w, p.h]).toEqual([0, 400, 300, 200]);
        expect(p.crop).toEqual({ l: 0.1, t: 0.2, r: 0, b: 0 });
        expect(p.alpha).toBe(0.5);
        expect(p.media.ext).toBe('png');
    });
    it("keeps the background and the exact transition duration", () => {
        expect(back.slides[0].background).toEqual({ kind: 'solid', color: { hex: '#eeeeee' } });
        expect(back.slides[0].transition).toEqual({ kind: 'push', dir: 'u', durationMs: 450 });
    });
});

// ── A hand-built package exercising PowerPoint's inheritance ─────────────────────────────────
const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
const REL = (rels: [string, string, string][]) => `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.map(([id, t, tg]) => `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${t}" Target="${tg}"/>`).join('')}</Relationships>`;
const tree = (inner: string) => `<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>${inner}</p:spTree>`;
const xfrm = (x: number, y: number, w: number, h: number) => `<a:xfrm><a:off x="${x * 9525}" y="${y * 9525}"/><a:ext cx="${w * 9525}" cy="${h * 9525}"/></a:xfrm>`;

function handBuilt(slideTree: string, extra: Record<string, string> = {}): Uint8Array {
    const files: Record<string, string> = {
        '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>',
        '_rels/.rels': REL([['rId1', 'officeDocument', 'ppt/presentation.xml']]),
        'ppt/presentation.xml': `<p:presentation ${NS}><p:sldIdLst><p:sldId id="256" r:id="rId2"/></p:sldIdLst><p:sldSz cx="9144000" cy="5143500"/>`
            + `<p:defaultTextStyle><a:lvl1pPr><a:defRPr sz="1800"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill></a:defRPr></a:lvl1pPr></p:defaultTextStyle></p:presentation>`,
        'ppt/_rels/presentation.xml.rels': REL([['rId2', 'slide', 'slides/slide1.xml']]),
        'ppt/slides/slide1.xml': `<p:sld ${NS}><p:cSld>${tree(slideTree)}</p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`,
        'ppt/slides/_rels/slide1.xml.rels': REL([['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml']]),
        'ppt/slideLayouts/slideLayout1.xml': `<p:sldLayout ${NS}><p:cSld>${tree(
            `<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr>${xfrm(50, 20, 860, 80)}</p:spPr></p:sp>`
        )}</p:cSld></p:sldLayout>`,
        'ppt/slideLayouts/_rels/slideLayout1.xml.rels': REL([['rId1', 'slideMaster', '../slideMasters/slideMaster1.xml']]),
        'ppt/slideMasters/slideMaster1.xml': `<p:sldMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg2"/></p:bgRef></p:bg>${tree(
            `<p:sp><p:nvSpPr><p:cNvPr id="9" name="Logo bar"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>${xfrm(0, 500, 960, 40)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:schemeClr val="accent1"><a:lumMod val="50000"/></a:schemeClr></a:solidFill></p:spPr></p:sp>`
            + `<p:sp><p:nvSpPr><p:cNvPr id="3" name="Title PH"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr>${xfrm(10, 10, 100, 100)}</p:spPr></p:sp>`
        )}</p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>`
            + `<p:txStyles><p:titleStyle><a:lvl1pPr algn="ctr"><a:defRPr sz="4400" b="1"><a:solidFill><a:schemeClr val="tx2"/></a:solidFill><a:latin typeface="+mj-lt"/></a:defRPr></a:lvl1pPr></p:titleStyle><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>`,
        'ppt/slideMasters/_rels/slideMaster1.xml.rels': REL([['rId1', 'theme', '../theme/theme1.xml']]),
        'ppt/theme/theme1.xml': `<a:theme ${NS} name="T"><a:themeElements><a:clrScheme name="c">`
            + '<a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F3864"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2>'
            + '<a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme>'
            + '<a:fontScheme name="f"><a:majorFont><a:latin typeface="Georgia"/></a:majorFont><a:minorFont><a:latin typeface="Verdana"/></a:minorFont></a:fontScheme>'
            + '<a:fmtScheme name="m"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst/>'
            + '<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>',
        ...extra,
    };
    return zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])));
}

describe("readPptx: PowerPoint inheritance", () => {
    const titleSp = `<p:sp><p:nvSpPr><p:cNvPr id="5" name="Title 1"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr/>`
        + `<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US"/><a:t>Inherited title</a:t></a:r></a:p></p:txBody></p:sp>`;
    const styled = `<p:sp><p:nvSpPr><p:cNvPr id="6" name="Styled"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>${xfrm(100, 200, 200, 100)}<a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom></p:spPr>`
        + `<p:style><a:lnRef idx="1"><a:schemeClr val="accent2"/></a:lnRef><a:fillRef idx="1"><a:schemeClr val="accent6"/></a:fillRef><a:effectRef idx="0"><a:schemeClr val="accent1"/></a:effectRef><a:fontRef idx="minor"><a:schemeClr val="lt1"/></a:fontRef></p:style>`
        + `<p:txBody><a:bodyPr anchor="ctr"/><a:lstStyle/><a:p><a:r><a:t>Label</a:t></a:r></a:p></p:txBody></p:sp>`;
    const group = `<p:grpSp><p:nvGrpSpPr><p:cNvPr id="7" name="Group"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="${400 * 9525}" y="${100 * 9525}"/><a:ext cx="${200 * 9525}" cy="${100 * 9525}"/><a:chOff x="0" y="0"/><a:chExt cx="${100 * 9525}" cy="${50 * 9525}"/></a:xfrm></p:grpSpPr>`
        + `<p:sp><p:nvSpPr><p:cNvPr id="8" name="Child"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>${xfrm(50, 0, 50, 50)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill></p:spPr></p:sp></p:grpSp>`;
    const { deck, warnings } = read(handBuilt(titleSp + styled + group));
    const items = deck.slides[0].items;

    it("draws the master's own artwork under the slide, with lumMod applied to the theme colour", () => {
        expect(warnings).toEqual([]);
        const bar = items[0] as ShapeItem;
        expect(bar.name).toBe('Logo bar');
        expect(bar.fill.kind).toBe('solid');
        // accent1 #4472C4 at 50% luminance
        expect((bar.fill as any).color.hex).toBe('#203864');
    });
    it("places a placeholder with no xfrm where its layout placeholder is, styled by the master's titleStyle", () => {
        const t = items.find(i => i.name === 'Title 1') as ShapeItem;
        expect([t.x, t.y, t.w, t.h]).toEqual([50, 20, 860, 80]);
        const run = t.text!.paragraphs[0].runs[0];
        expect(run.text).toBe('Inherited title');
        expect(run.size).toBeCloseTo(44 * 12700 / 9525, 6); // 44 pt in px
        expect(run.bold).toBe(true);
        expect(run.font).toBe('Georgia');                    // +mj-lt → theme major
        expect(run.color).toEqual({ hex: '#1f3864' });       // tx2 → dk2 through the colour map
        expect(t.text!.paragraphs[0].align).toBe('ctr');
    });
    it("resolves p:style refs: theme fill/line with the ref colour, label colour from fontRef", () => {
        const s = items.find(i => i.name === 'Styled') as ShapeItem;
        expect(s.fill).toEqual({ kind: 'solid', color: { hex: '#70ad47' } });
        expect(s.line).toMatchObject({ width: 12700 / 9525, color: { hex: '#ed7d31' } });
        expect(s.text!.paragraphs[0].runs[0].color).toEqual({ hex: '#ffffff' });
        expect(s.text!.paragraphs[0].runs[0].font).toBe('Verdana');
    });
    it("maps group children from child space to slide space", () => {
        const g = items.find(i => i.name === 'Group') as GroupItem;
        const c = g.children[0];
        // chExt 100×50 → ext 200×100 doubles everything; child at (50,0) lands at 400 + 100.
        expect([c.x, c.y, c.w, c.h]).toEqual([500, 100, 100, 100]);
    });
    it("takes the master background through bgRef and the colour map", () => {
        expect(deck.slides[0].background).toEqual({ kind: 'solid', color: { hex: '#e7e6e6' } });
    });
    it("reads the slide size", () => {
        expect(deck.width).toBe(960);
        expect(deck.height).toBe(540);
    });
});

describe("readPptx: hostile and broken input", () => {
    it("refuses something that isn't a zip", () => {
        expect(() => read(new Uint8Array([1, 2, 3, 4]))).toThrow(/not a PowerPoint presentation/);
    });
    it("refuses a zip without a presentation", () => {
        expect(() => read(zipSync({ 'a.txt': strToU8('hi') }))).toThrow(/not a PowerPoint presentation/);
    });
    it("skips a slide whose XML is broken, with a warning, and reads the rest", () => {
        const bytes = handBuilt('', { 'ppt/slides/slide1.xml': '<p:sld><unclosed' });
        const { deck, warnings } = read(bytes);
        expect(deck.slides.length).toBe(0);
        expect(warnings.join(' ')).toMatch(/slide1|Slide 1/);
    });
    it("never expands a DTD", () => {
        const bomb = `<?xml version="1.0"?><!DOCTYPE lolz [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;&lol;&lol;">]><p:sld ${NS}><p:cSld>${tree('')}</p:cSld></p:sld>`;
        const { deck, warnings } = read(handBuilt('', { 'ppt/slides/slide1.xml': bomb }));
        expect(deck.slides.length).toBe(0);
        expect(warnings.length).toBeGreaterThan(0);
    });
    it("survives groups nested past the limit", () => {
        let inner = `<p:sp><p:nvSpPr><p:cNvPr id="99" name="deep"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>${xfrm(0, 0, 10, 10)}<a:solidFill><a:srgbClr val="000000"/></a:solidFill></p:spPr></p:sp>`;
        for (let i = 0; i < 40; i++) inner = `<p:grpSp><p:nvGrpSpPr><p:cNvPr id="${100 + i}" name="g"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>${inner}</p:grpSp>`;
        const { warnings } = read(handBuilt(inner));
        expect(warnings.join(' ')).toMatch(/nested too deeply/);
    });
});

describe("readPptx: bullets", () => {
    const body = (paras: string, lst = '') => `<p:sp><p:nvSpPr><p:cNvPr id="4" name="List"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr>${xfrm(10, 10, 400, 300)}</p:spPr>`
        + `<p:txBody><a:bodyPr/><a:lstStyle>${lst}</a:lstStyle>${paras}</p:txBody></p:sp>`;
    const p = (pPr: string, text: string) => `<a:p>${pPr}<a:r><a:t>${text}</a:t></a:r></a:p>`;
    const lst = '<a:lvl1pPr marL="342900" indent="-342900"><a:buClr><a:srgbClr val="C00000"/></a:buClr><a:buSzPct val="80000"/><a:buFont typeface="Wingdings"/><a:buChar char="§"/></a:lvl1pPr>'
        + '<a:lvl2pPr marL="742950" indent="-285750"><a:buFont typeface="Arial"/><a:buChar char="–"/></a:lvl2pPr>';
    const { deck } = read(handBuilt(body(
        p('<a:pPr/>', 'square')
        + p('<a:pPr lvl="1"/>', 'dash')
        + p('<a:pPr><a:buFont typeface="Wingdings"/><a:buChar char="&#xF0FC;"/></a:pPr>', 'check')
        + p('<a:pPr><a:buFontTx/><a:buClrTx/><a:buSzTx/><a:buAutoNum type="alphaLcParenR" startAt="3"/></a:pPr>', 'third')
        + p('<a:pPr><a:buNone/></a:pPr>', 'plain'),
        lst)));
    const paras = (deck.slides[0].items.find(i => i.name === 'List') as ShapeItem).text!.paragraphs;

    it("maps Wingdings bullets to the glyph they show, with colour, size and hanging indent", () => {
        expect(paras[0]).toMatchObject({ bullet: 'char', bulletChar: '▪', bulletColor: { hex: '#c00000' }, bulletScale: 0.8 });
        expect(paras[0].marL).toBeCloseTo(36, 6);   // 342900 EMU
        expect(paras[0].indent).toBeCloseTo(-36, 6);
    });
    it("takes each level's own glyph and indent", () => {
        expect(paras[1]).toMatchObject({ level: 1, bulletChar: '–' });
        expect(paras[1].marL).toBeCloseTo(78, 6);
        expect(paras[1].bulletColor).toBeUndefined();
    });
    it("reads a symbol-font character written in its private-use alias", () => {
        expect(paras[2].bulletChar).toBe('✔');
    });
    it("reads the numbering scheme and start, and *Tx resets the inherited colour and size", () => {
        expect(paras[3]).toMatchObject({ bullet: 'num', numType: 'alphaLcParenR', startAt: 3 });
        expect(paras[3].bulletColor).toBeUndefined();
        expect(paras[3].bulletScale).toBeUndefined();
    });
    it("buNone turns the inherited bullet off", () => {
        expect(paras[4].bullet).toBeUndefined();
    });
    it("round-trips glyph, colour, size, numbering and indents through our writer", () => {
        const deck2: Deck = { width: 960, height: 540, title: 't', slides: [{ items: [{
            kind: 'shape', id: 2, name: 'L', x: 0, y: 0, w: 400, h: 200, geom: { kind: 'preset', prst: 'rect' }, fill: { kind: 'none' }, line: null, textBox: true,
            text: { anchor: 't', insets: { l: 0, t: 0, r: 0, b: 0 }, wrap: true, paragraphs: [
                { runs: [{ text: 'a' }], bullet: 'char', bulletChar: '✔', bulletColor: { hex: '#2f9e44' }, bulletScale: 0.75, marL: 30, indent: -24 },
                { runs: [{ text: 'b' }], bullet: 'num', numType: 'romanUcPeriod', startAt: 4, level: 1, marL: 60, indent: -20 },
            ] },
        } as ShapeItem] }] };
        const back = (read(buildPptx(deck2)).deck.slides[0].items[0] as ShapeItem).text!.paragraphs;
        expect(back[0]).toMatchObject({ bullet: 'char', bulletChar: '✔', bulletColor: { hex: '#2f9e44' }, bulletScale: 0.75 });
        expect(back[0].marL).toBeCloseTo(30, 3);
        expect(back[0].indent).toBeCloseTo(-24, 3);
        expect(back[1]).toMatchObject({ bullet: 'num', numType: 'romanUcPeriod', startAt: 4, level: 1 });
    });
});

describe("readPptx: SmartArt", () => {
    const DGM = 'http://schemas.openxmlformats.org/drawingml/2006/diagram';
    const frame = `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="12" name="Diagram 1"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr>`
        + `<p:xfrm><a:off x="${100 * 9525}" y="${50 * 9525}"/><a:ext cx="${600 * 9525}" cy="${300 * 9525}"/></p:xfrm>`
        + `<a:graphic><a:graphicData uri="${DGM}"><dgm:relIds xmlns:dgm="${DGM}" r:dm="rId5" r:lo="rId6" r:qs="rId7" r:cs="rId8"/></a:graphicData></a:graphic></p:graphicFrame>`;
    const dsp = (x: number, w: number, label: string, tx?: [number, number, number, number]) => `<dsp:sp modelId="{X}"><dsp:nvSpPr><dsp:cNvPr id="0" name=""/><dsp:cNvSpPr/></dsp:nvSpPr>`
        + `<dsp:spPr>${xfrm(x, 0, w, 100)}<a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom><a:solidFill><a:schemeClr val="accent1"/></a:solidFill></dsp:spPr>`
        + `<dsp:style><a:lnRef idx="0"><a:scrgbClr r="0" g="0" b="0"/></a:lnRef><a:fillRef idx="1"><a:scrgbClr r="0" g="0" b="0"/></a:fillRef><a:effectRef idx="0"><a:scrgbClr r="0" g="0" b="0"/></a:effectRef><a:fontRef idx="minor"><a:schemeClr val="lt1"/></a:fontRef></dsp:style>`
        + `<dsp:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="2000"/><a:t>${label}</a:t></a:r></a:p></dsp:txBody>`
        + (tx ? `<dsp:txXfrm><a:off x="${tx[0] * 9525}" y="${tx[1] * 9525}"/><a:ext cx="${tx[2] * 9525}" cy="${tx[3] * 9525}"/></dsp:txXfrm>` : '') + `</dsp:sp>`;
    const drawing = `<dsp:drawing xmlns:dsp="http://schemas.microsoft.com/office/drawing/2008/diagram" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><dsp:spTree>`
        + `<dsp:nvGrpSpPr><dsp:cNvPr id="0" name=""/><dsp:cNvGrpSpPr/></dsp:nvGrpSpPr><dsp:grpSpPr/>${dsp(0, 100, 'One')}${dsp(200, 100, 'Two', [180, 110, 140, 40])}</dsp:spTree></dsp:drawing>`;
    const data = `<dgm:dataModel xmlns:dgm="${DGM}" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><dgm:ptLst/><dgm:extLst><a:ext uri="http://schemas.microsoft.com/office/drawing/2008/diagram">`
        + `<dsp:dataModelExt xmlns:dsp="http://schemas.microsoft.com/office/drawing/2008/diagram" relId="rId9" minVer="http://schemas.openxmlformats.org/drawingml/2006/diagram"/></a:ext></dgm:extLst></dgm:dataModel>`;
    const slideRels = `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
        + `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>`
        + `<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramData" Target="../diagrams/data1.xml"/>`
        + `<Relationship Id="rId9" Type="http://schemas.microsoft.com/office/2007/relationships/diagramDrawing" Target="../diagrams/drawing1.xml"/></Relationships>`;
    const files = (dataXml: string) => ({ 'ppt/slides/_rels/slide1.xml.rels': slideRels, 'ppt/diagrams/data1.xml': dataXml, 'ppt/diagrams/drawing1.xml': drawing });

    it("imports the drawn shapes in the frame's coordinates, as one group, with no warning", () => {
        const { deck, warnings } = read(handBuilt(frame, files(data)));
        expect(warnings).toEqual([]);
        const g = deck.slides[0].items.find(i => i.name === 'Diagram 1') as GroupItem;
        expect(g.kind).toBe('group');
        expect(g.children.length).toBe(2);
        const [a, b] = g.children as ShapeItem[];
        expect([a.x, a.y, a.w, a.h]).toEqual([100, 50, 100, 100]);
        expect([b.x, b.y]).toEqual([300, 50]);
        expect(a.fill).toEqual({ kind: 'solid', color: { hex: '#4472c4' } });
        expect(a.text!.paragraphs[0].runs[0]).toMatchObject({ text: 'One', color: { hex: '#ffffff' } });
        expect(new Set(g.children.map(c => c.id)).size).toBe(2); // the file's ids are all 0
    });
    it("keeps a label that sits in its own text box (txXfrm)", () => {
        const b = ((read(handBuilt(frame, files(data))).deck.slides[0].items.find(i => i.name === 'Diagram 1') as GroupItem).children[1]) as ShapeItem;
        expect(b.textRect).toEqual({ l: -20, t: 110, r: 120, b: 150 });
        const a = ((read(handBuilt(frame, files(data))).deck.slides[0].items.find(i => i.name === 'Diagram 1') as GroupItem).children[0]) as ShapeItem;
        expect(a.textRect).toBeUndefined();
    });
    it("finds the drawing without dataModelExt when the slide has only one", () => {
        const g = read(handBuilt(frame, files('<dgm:dataModel xmlns:dgm="' + DGM + '"/>'))).deck.slides[0].items.find(i => i.name === 'Diagram 1') as GroupItem;
        expect(g.children.length).toBe(2);
    });
    it("falls back to a labelled frame when there is no drawing", () => {
        const { deck, warnings } = read(handBuilt(frame));
        expect(warnings.join(' ')).toMatch(/SmartArt diagram "Diagram 1" was imported as a placeholder frame/);
        expect(deck.slides[0].items.find(i => i.name === 'Diagram 1')!.kind).toBe('shape');
    });
});

describe("readPptx: paragraph spacing", () => {
    const sp = `<p:sp><p:nvSpPr><p:cNvPr id="4" name="Spaced"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr>${xfrm(0, 0, 400, 300)}</p:spPr><p:txBody><a:bodyPr><a:normAutofit lnSpcReduction="20000"/></a:bodyPr><a:lstStyle/>`
        + `<a:p><a:pPr><a:spcBef><a:spcPts val="1200"/></a:spcBef></a:pPr><a:r><a:rPr sz="2000"/><a:t>a</a:t></a:r></a:p>`
        + `<a:p><a:pPr><a:spcBef><a:spcPct val="50000"/></a:spcBef><a:spcAft><a:spcPts val="600"/></a:spcAft></a:pPr><a:r><a:rPr sz="1500"/><a:t>b</a:t></a:r></a:p></p:txBody></p:sp>`;
    const paras = (read(handBuilt(sp)).deck.slides[0].items.find(i => i.name === "Spaced") as ShapeItem).text!.paragraphs;
    it("reads points and line percentages, shrunk by the autofit's spacing reduction", () => {
        expect(paras[0].spaceBefore).toBeCloseTo(16 * 0.8, 2);           // 12 pt = 16 px, less 20%
        expect(paras[1].spaceBefore).toBeCloseTo(0.5 * 20 * 1.2 * 0.8, 2); // half a 15 pt (20 px) line
        expect(paras[1].spaceAfter).toBeCloseTo(8 * 0.8, 2);
    });
    it("writes spacing back as points", () => {
        const deck: Deck = { width: 960, height: 540, title: 't', slides: [{ items: [{ kind: 'shape', id: 2, name: 'S', x: 0, y: 0, w: 400, h: 200, geom: { kind: 'preset', prst: 'rect' }, fill: { kind: 'none' }, line: null, textBox: true,
            text: { anchor: 't', insets: { l: 0, t: 0, r: 0, b: 0 }, wrap: true, paragraphs: [{ runs: [{ text: 'x' }], spaceBefore: 16, spaceAfter: 4 }] } } as ShapeItem] }] };
        const back = (read(buildPptx(deck)).deck.slides[0].items[0] as ShapeItem).text!.paragraphs[0];
        expect(back.spaceBefore).toBeCloseTo(16, 2);
        expect(back.spaceAfter).toBeCloseTo(4, 2);
    });
});

// ── Fidelity fixes found by importing LibreOffice's PPTX test corpus (2026-10-31) ────────────

const slideWith = (bg: string, inner: string) => `<p:sld ${NS}><p:cSld>${bg}${tree(inner)}</p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;

describe("readPptx: backgrounds", () => {
    it("fills a useBgFill shape with the slide background", () => {
        const sp = `<p:sp useBgFill="1"><p:nvSpPr><p:cNvPr id="4" name="Cutout"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>${xfrm(0, 0, 100, 100)}<a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom></p:spPr></p:sp>`;
        const s = read(handBuilt(sp)).deck.slides[0].items.find(i => i.name === 'Cutout') as ShapeItem;
        expect(s.fill).toEqual({ kind: 'solid', color: { hex: '#e7e6e6' } }); // the master's bgRef → bg2
    });
    it("is white when no level defines one, even under an inverted colour map", () => {
        const master = `<p:sldMaster ${NS}><p:cSld>${tree('')}</p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:sldMaster>`;
        const layout = `<p:sldLayout ${NS}><p:cSld>${tree('')}</p:cSld><p:clrMapOvr><a:overrideClrMapping bg1="dk1" tx1="lt1" bg2="dk2" tx2="lt2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:clrMapOvr></p:sldLayout>`;
        const bg = read(handBuilt('', { 'ppt/slideMasters/slideMaster1.xml': master, 'ppt/slideLayouts/slideLayout1.xml': layout })).deck.slides[0].background;
        expect(bg).toEqual({ kind: 'solid', color: { hex: '#ffffff' } });
    });
    it("keeps a tiled picture's tile scale and opacity", () => {
        const bg = `<p:bg><p:bgPr><a:blipFill><a:blip r:embed="rId9"><a:alphaModFix amt="51000"/></a:blip><a:tile sx="50000" sy="25000"/></a:blipFill></p:bgPr></p:bg>`;
        const bytes = handBuilt('', {
            'ppt/slides/slide1.xml': slideWith(bg, ''),
            'ppt/slides/_rels/slide1.xml.rels': REL([['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml'], ['rId9', 'image', '../media/image1.png']]),
        });
        const withPng = zipSync({ ...unzipSync(bytes), 'ppt/media/image1.png': PNG_1x1 }); // the picture the background names
        const back = read(withPng).deck.slides[0].background as any;
        expect(back.kind).toBe('image');
        expect(back.tile).toEqual({ sx: 0.5, sy: 0.25 });
        expect(back.alpha).toBeCloseTo(0.51, 5);
    });
});

describe("readPptx: pictures cropped to a shape", () => {
    it("keeps the outline when it isn't a rectangle", () => {
        const pic = (id: number, prst: string) => `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="P${prst}"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId9"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr>${xfrm(0, 0, 200, 100)}<a:prstGeom prst="${prst}"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
        const bytes = zipSync({ ...unzipSync(handBuilt(pic(4, 'ellipse') + pic(5, 'rect'), {
            'ppt/slides/_rels/slide1.xml.rels': REL([['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml'], ['rId9', 'image', '../media/image1.png']]),
        })), 'ppt/media/image1.png': PNG_1x1 });
        const items = read(bytes).deck.slides[0].items as PictureItem[];
        expect(items.find(i => i.name === 'Pellipse')!.geom).toEqual({ kind: 'preset', prst: 'ellipse' });
        expect(items.find(i => i.name === 'Prect')!.geom).toBeUndefined();
    });
    it("reads grayscale pictures", () => {
        const pic = `<p:pic><p:nvPicPr><p:cNvPr id="4" name="Grey"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId9"><a:grayscl/></a:blip><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr>${xfrm(0, 0, 200, 100)}</p:spPr></p:pic>`;
        const bytes = zipSync({ ...unzipSync(handBuilt(pic, {
            'ppt/slides/_rels/slide1.xml.rels': REL([['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml'], ['rId9', 'image', '../media/image1.png']]),
        })), 'ppt/media/image1.png': PNG_1x1 });
        expect((read(bytes).deck.slides[0].items.find(i => i.name === 'Grey') as PictureItem).grayscale).toBe(true);
    });
});

describe("readPptx: table styles defined in the file", () => {
    const style = `<a:tblStyleLst ${NS} def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"><a:tblStyle styleId="{AAAA0000-0000-0000-0000-000000000001}" styleName="Custom">`
        + `<a:wholeTbl><a:tcTxStyle><a:schemeClr val="dk1"/></a:tcTxStyle><a:tcStyle><a:tcBdr><a:insideH><a:ln w="12700"><a:solidFill><a:srgbClr val="00FF00"/></a:solidFill></a:ln></a:insideH></a:tcBdr><a:fill><a:solidFill><a:srgbClr val="EEEEEE"/></a:solidFill></a:fill></a:tcStyle></a:wholeTbl>`
        + `<a:band1H><a:tcStyle><a:fill><a:solidFill><a:srgbClr val="CCCCCC"/></a:solidFill></a:fill></a:tcStyle></a:band1H>`
        + `<a:firstRow><a:tcTxStyle b="on"><a:srgbClr val="FFFFFF"/></a:tcTxStyle><a:tcStyle><a:fill><a:solidFill><a:srgbClr val="C00000"/></a:solidFill></a:fill></a:tcStyle></a:firstRow>`
        + `</a:tblStyle></a:tblStyleLst>`;
    const cell = (t: string) => `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>${t}</a:t></a:r></a:p></a:txBody><a:tcPr/></a:tc>`;
    const row = (a: string) => `<a:tr h="${40 * 9525}">${cell(a)}${cell(a + '2')}</a:tr>`;
    const frame = `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="4" name="T"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="0" y="0"/><a:ext cx="${200 * 9525}" cy="${120 * 9525}"/></p:xfrm>`
        + `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr firstRow="1" bandRow="1"><a:tableStyleId>{AAAA0000-0000-0000-0000-000000000001}</a:tableStyleId></a:tblPr>`
        + `<a:tblGrid><a:gridCol w="${100 * 9525}"/><a:gridCol w="${100 * 9525}"/></a:tblGrid>${row('h')}${row('a')}${row('b')}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;
    const bytes = handBuilt(frame, {
        'ppt/_rels/presentation.xml.rels': REL([['rId2', 'slide', 'slides/slide1.xml'], ['rId3', 'tableStyles', 'tableStyles.xml']]),
        'ppt/tableStyles.xml': style,
    });
    const cells = (read(bytes).deck.slides[0].items.find(i => i.name === 'T') as GroupItem).children as ShapeItem[];
    const fillOfRow = (ri: number) => (cells[ri * 2].fill as any).color.hex;
    it("layers whole table, bands and header as PowerPoint does", () => {
        expect(fillOfRow(0)).toBe('#c00000');   // header
        expect(fillOfRow(1)).toBe('#cccccc');   // first band
        expect(fillOfRow(2)).toBe('#eeeeee');   // second band falls back to the whole table
    });
    it("takes text colour, bold and rules from the style", () => {
        expect(cells[0].text!.paragraphs[0].runs[0]).toMatchObject({ bold: true, color: { hex: '#ffffff' } });
        expect(cells[2].text!.paragraphs[0].runs[0].bold).toBeUndefined();
        expect(cells[2].line).toMatchObject({ color: { hex: '#00ff00' } });
    });
    it("draws the table background under unfilled cells, and theme-line borders", () => {
        const themed = style.replace('styleName="Custom">', 'styleName="Custom"><a:tblBg><a:fillRef idx="1"><a:schemeClr val="accent2"/></a:fillRef></a:tblBg>')
            .replace(/<a:insideH>.*?<\/a:insideH>/, '<a:insideH><a:lnRef idx="1"><a:schemeClr val="accent1"/></a:lnRef></a:insideH>');
        const g = read(handBuilt(frame, {
            'ppt/_rels/presentation.xml.rels': REL([['rId2', 'slide', 'slides/slide1.xml'], ['rId3', 'tableStyles', 'tableStyles.xml']]),
            'ppt/tableStyles.xml': themed,
        })).deck.slides[0].items.find(i => i.name === 'T') as GroupItem;
        const [bg, ...rest] = g.children as ShapeItem[];
        expect(bg.name).toBe('T background');
        expect(bg.fill).toEqual({ kind: 'solid', color: { hex: '#ed7d31' } }); // theme fill 1 in accent2
        expect([bg.w, bg.h]).toEqual([200, 120]);
        expect(rest[2].line).toMatchObject({ color: { hex: '#4472c4' } });   // theme line 1 in accent1
    });
});

describe("readPptx: SmartArt without a saved drawing", () => {
    it("keeps the diagram's text as an outline", () => {
        const frame = `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="4" name="D"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="0" y="0"/><a:ext cx="${300 * 9525}" cy="${200 * 9525}"/></p:xfrm>`
            + `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/diagram"><dgm:relIds xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram" r:dm="rId5"/></a:graphicData></a:graphic></p:graphicFrame>`;
        const pt = (id: string, text: string) => `<dgm:pt modelId="${id}"><dgm:prSet/><dgm:spPr/><dgm:t><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>${text}</a:t></a:r></a:p></dgm:t></dgm:pt>`;
        const cxn = (src: string, dest: string, ord: number) => `<dgm:cxn modelId="c${dest}" srcId="${src}" destId="${dest}" srcOrd="${ord}" destOrd="0"/>`;
        const data = `<dgm:dataModel xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram" ${NS}><dgm:ptLst><dgm:pt modelId="0" type="doc"/>${pt('1', 'Plan')}${pt('2', 'Build')}${pt('3', 'Design')}`
            + `<dgm:pt modelId="9" type="sibTrans"/></dgm:ptLst><dgm:cxnLst>${cxn('0', '2', 1)}${cxn('0', '1', 0)}${cxn('1', '3', 0)}<dgm:cxn modelId="x" type="presOf" srcId="1" destId="9"/></dgm:cxnLst></dgm:dataModel>`;
        const { deck, warnings } = read(handBuilt(frame, {
            'ppt/slides/_rels/slide1.xml.rels': REL([['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml'], ['rId5', 'diagramData', '../diagrams/data1.xml']]),
            'ppt/diagrams/data1.xml': data,
        }));
        const box = deck.slides[0].items.find(i => i.name === 'D') as ShapeItem;
        expect(box.text!.paragraphs.map(p => [p.runs[0].text, p.level, p.bullet ?? null])).toEqual([['Plan', 0, null], ['Design', 1, 'char'], ['Build', 0, null]]);
        expect(warnings.join(' ')).toContain('its text was imported as a list');
    });
});
