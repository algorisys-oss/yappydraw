import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import opentype from 'opentype.js';
import { isTrueType, standardPdfFont, woffToSfnt } from './pdf-vector';
import { pdfFontFile } from './text-to-outlines';

const buf = (...bytes: number[]) => new Uint8Array(bytes).buffer;

describe('pdfFontFile — which bundled font file a PDF embeds', () => {
    test('regular and bold pick the matching upright file', () => {
        expect(pdfFontFile('poppins', 400, false)).toEqual({ file: 'poppins-400.ttf', italic: false, bold: false });
        expect(pdfFontFile('poppins', 700, false)).toEqual({ file: 'poppins-700.ttf', italic: false, bold: true });
    });

    test('weights snap to the 400/700 the families ship', () => {
        expect(pdfFontFile('sans-serif', 300, false)?.file).toBe('sans-serif-400.ttf');
        expect(pdfFontFile('sans-serif', 600, false)?.file).toBe('sans-serif-700.ttf');
    });

    test('a TrueType italic is used when one is bundled', () => {
        expect(pdfFontFile('sans-serif', 400, true)).toEqual({ file: 'sans-serif-italic-400.ttf', italic: true, bold: false });
        // Bold Italic: slant beats weight, the same order CSS uses.
        expect(pdfFontFile('sans-serif', 700, true)?.file).toBe('sans-serif-italic-400.ttf');
    });

    test('the WOFF italics are used too — the exporter unwraps them to TrueType', () => {
        expect(pdfFontFile('poppins', 400, true)).toEqual({ file: 'poppins-italic-400.woff', italic: true, bold: false });
        expect(pdfFontFile('poppins', 700, true)).toEqual({ file: 'poppins-italic-700.woff', italic: true, bold: true });
        // Merriweather has no bold italic bundled: slant wins over weight.
        expect(pdfFontFile('serif', 700, true)).toEqual({ file: 'serif-italic-400.woff', italic: true, bold: false });
    });

    test('a single-weight family serves every weight from its one file', () => {
        expect(pdfFontFile('hand-drawn', 700, false)?.file).toBe('hand-drawn-400.ttf');
        expect(pdfFontFile('marker', 400, true)?.file).toBe('marker-400.ttf');
    });

    test('an unknown family has no file', () => {
        expect(pdfFontFile('custom-9', 400, false)).toBeNull();
    });
});

describe('standardPdfFont — the substitute when nothing can be embedded', () => {
    test('never lands on Times for a sans or unknown stack (svg2pdf’s own fallback)', () => {
        expect(standardPdfFont({ family: 'Roboto, sans-serif', weight: 400, italic: false })).toEqual({ family: 'helvetica', style: 'normal' });
        expect(standardPdfFont({ family: 'SomethingElse', weight: 400, italic: false }).family).toBe('helvetica');
    });

    test('follows the stack’s generic family', () => {
        expect(standardPdfFont({ family: 'Fira Code, monospace', weight: 400, italic: false }).family).toBe('courier');
        expect(standardPdfFont({ family: 'Lora, serif', weight: 400, italic: false }).family).toBe('times');
        // "sans-serif" contains "serif" — it must not read as serif.
        expect(standardPdfFont({ family: 'Lato, sans-serif', weight: 400, italic: false }).family).toBe('helvetica');
    });

    test('maps weight and slant onto the four standard styles', () => {
        const f = (weight: number, italic: boolean) => standardPdfFont({ family: 'x', weight, italic }).style;
        expect(f(400, false)).toBe('normal');
        expect(f(700, false)).toBe('bold');
        expect(f(400, true)).toBe('italic');
        expect(f(800, true)).toBe('bolditalic');
    });
});

describe('isTrueType', () => {
    test('accepts both TrueType signatures', () => {
        expect(isTrueType(buf(0x00, 0x01, 0x00, 0x00, 0x00))).toBe(true);
        expect(isTrueType(buf(0x74, 0x72, 0x75, 0x65))).toBe(true); // 'true'
    });

    test('rejects CFF OpenType, WOFF/WOFF2 and truncated data', () => {
        expect(isTrueType(buf(0x4f, 0x54, 0x54, 0x4f))).toBe(false); // 'OTTO'
        expect(isTrueType(buf(0x77, 0x4f, 0x46, 0x46))).toBe(false); // 'wOFF'
        expect(isTrueType(buf(0x77, 0x4f, 0x46, 0x32))).toBe(false); // 'wOF2'
        expect(isTrueType(buf(0x00, 0x01))).toBe(false);
    });
});

describe('woffToSfnt — WOFF 1.0 back to the TrueType inside it', () => {
    const fontDir = join(import.meta.dir, '../../public/fonts/outline');
    const read = (f: string) => { const b = readFileSync(join(fontDir, f)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };
    const nodeInflate = async (d: Uint8Array) => new Uint8Array(inflateSync(d));

    for (const file of ['poppins-italic-400.woff', 'serif-italic-400.woff', 'code-italic-700.woff']) {
        test(`${file} unwraps to a TrueType file opentype.js can parse`, async () => {
            const woff = read(file);
            const ttf = await woffToSfnt(woff, nodeInflate);
            expect(isTrueType(ttf)).toBe(true);
            const viaWoff = opentype.parse(woff);
            const viaTtf = opentype.parse(ttf);
            expect(viaTtf.names.fontFamily).toEqual(viaWoff.names.fontFamily);
            expect(viaTtf.numGlyphs).toBe(viaWoff.numGlyphs);
            // Same outlines, not just the same header.
            expect(viaTtf.getPath('Ag', 0, 0, 72).toPathData(2)).toBe(viaWoff.getPath('Ag', 0, 0, 72).toPathData(2));
        });
    }

    test('anything that is not WOFF passes through untouched', async () => {
        const ttf = read('poppins-400.ttf');
        expect(await woffToSfnt(ttf, nodeInflate)).toBe(ttf);
    });
});
