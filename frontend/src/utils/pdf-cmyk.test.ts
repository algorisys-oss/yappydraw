import { beforeAll, describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as L from 'lcms-wasm';
import { createColorEngine, PRINT_PROFILES, type ColorEngine } from './color-management';
import { PdfFile, decodeStream, fromLatin1, toLatin1 } from './pdf-rewrite';
import { convertShadingsToCmyk, exactCmykFromSwatches, installCmykColors, pdfName, rgbFromColorArgs, separationArray, spotsFromSwatches, type SpotInk } from './pdf-cmyk';

const root = join(import.meta.dir, '../../..');
let engine: ColorEngine;
let jsPDF: typeof import('jspdf').jsPDF;
let ShadingPattern: typeof import('jspdf').ShadingPattern;

beforeAll(async () => {
    // jsPDF's node build reads `atob`/`btoa` off `window` when one exists — and many unit tests
    // leave a partial `global.window` stub behind. Complete it, then load jsPDF.
    const w = (globalThis as any).window;
    if (w && typeof w === 'object') { w.atob ??= atob; w.btoa ??= btoa; }
    ({ jsPDF, ShadingPattern } = await import('jspdf'));
    const lcms = await (L as any).instantiate({ locateFile: () => join(root, 'node_modules/lcms-wasm/dist/lcms.wasm') });
    engine = createColorEngine(lcms, L as any, PRINT_PROFILES.fogra39, new Uint8Array(readFileSync(join(root, 'frontend/public/icc/fogra39-coated.icc'))));
});

/** A small real jsPDF document: a filled rect, text, and an axial gradient. */
const makePdf = (compress = true): Uint8Array => {
    const pdf = new jsPDF({ unit: 'px', format: [200, 100], hotfixes: ['px_scaling'], compress });
    pdf.setFillColor(224, 49, 49);
    pdf.rect(10, 10, 50, 30, 'F');
    pdf.text('Hi', 10, 80);
    const pattern = new ShadingPattern('axial', [0, 0, 1, 0], [
        { offset: 0, color: [255, 212, 59] },
        { offset: 1, color: [47, 158, 68] },
    ]);
    // Shadings need jsPDF's "advanced" API mode — svg2pdf.js switches it on the same way.
    pdf.advancedAPI((p: any) => {
        p.addShadingPattern('g1', pattern);
        p.rect(80, 10, 100, 60, null);
        p.fill({ key: 'g1', matrix: p.Matrix(100, 0, 0, 60, 80, 10) });
    });
    return new Uint8Array(pdf.output('arraybuffer'));
};

describe('binary strings', () => {
    test('toLatin1/fromLatin1 round-trip every byte — 0x80–0x9F included', () => {
        const all = new Uint8Array(256).map((_, i) => i);
        const s = toLatin1(all);
        expect(s.length).toBe(256);
        expect(s.charCodeAt(0x9c)).toBe(0x9c); // windows-1252 would give U+0153 here
        expect([...fromLatin1(s)]).toEqual([...all]);
    });
});

describe('PdfFile', () => {
    test('re-serialising an untouched file keeps every object readable at its new offset', () => {
        const bytes = makePdf();
        const file = new PdfFile(bytes);
        const again = new PdfFile(file.toBytes());
        expect(again.objectNumbers()).toEqual(file.objectNumbers());
        for (const n of file.objectNumbers()) expect(again.get(n)!.dict).toBe(file.get(n)!.dict);
    });

    test('replaced and appended objects land in a valid xref', () => {
        const file = new PdfFile(makePdf());
        const added = file.add('<< /Type /Test /Value 42 >>');
        const info = file.ref('Info')!;
        file.set(info, file.get(info)!.dict.replace('>>', '/Custom (yes)\n>>'));
        file.setVersion('1.6');
        const out = file.toBytes();
        expect(toLatin1(out.subarray(0, 8))).toBe('%PDF-1.6');
        const re = new PdfFile(out);
        expect(re.get(added)!.dict).toContain('/Value 42');
        expect(re.get(info)!.dict).toContain('/Custom (yes)');
        expect(re.getTrailer()).toContain(`/Size ${added + 1}`);
    });

    test('streams are found by /Length, not by scanning, and decode', async () => {
        const file = new PdfFile(makePdf(false));
        const fnNum = file.objectNumbers().find(n => /\/FunctionType 0/.test(file.get(n)!.dict))!;
        const fn = file.get(fnNum)!;
        const samples = await decodeStream(fn.dict, fn.stream!);
        expect([...samples.subarray(0, 3)]).toEqual([255, 212, 59]); // first stop
    });

    test('refuses a file it cannot parse rather than guessing', () => {
        expect(() => new PdfFile(fromLatin1('%PDF-1.4\nnot really a pdf'))).toThrow();
    });
});

describe('convertShadingsToCmyk', () => {
    test('switches the shading to DeviceCMYK with 4-channel samples matching the ICC conversion', async () => {
        const out = await convertShadingsToCmyk(makePdf(), engine, new Map());
        const file = new PdfFile(out);
        const shading = file.objectNumbers().map(n => file.get(n)!).find(o => /\/ShadingType/.test(o.dict))!;
        expect(shading.dict).toContain('/ColorSpace /DeviceCMYK');
        expect(shading.dict).not.toContain('DeviceRGB');
        const fn = file.get(parseInt(/\/Function (\d+) 0 R/.exec(shading.dict)![1], 10))!;
        expect(fn.dict).toContain('/Range [0 1 0 1 0 1 0 1]');
        const samples = await decodeStream(fn.dict, fn.stream!);
        expect(samples.length % 4).toBe(0);
        const first = [...samples.subarray(0, 4)];
        const expected = engine.rgbToCmyk([255, 212, 59]).map(v => Math.round(v * 2.55));
        expect(first).toEqual(expected);
    });

    test('a swatch’s exact CMYK wins over the profile inside gradients too', async () => {
        const exact = exactCmykFromSwatches([{ color: '#ffd43b', cmyk: [0, 10, 90, 0] }]);
        const file = new PdfFile(await convertShadingsToCmyk(makePdf(), engine, exact));
        const shading = file.objectNumbers().map(n => file.get(n)!).find(o => /\/ShadingType/.test(o.dict))!;
        const fn = file.get(parseInt(/\/Function (\d+) 0 R/.exec(shading.dict)![1], 10))!;
        const samples = await decodeStream(fn.dict, fn.stream!);
        expect([...samples.subarray(0, 4)]).toEqual([0, 10, 90, 0].map(v => Math.round(v * 2.55)));
    });

    test('a PDF with no shadings comes back untouched', async () => {
        const pdf = new jsPDF({ compress: true });
        pdf.rect(10, 10, 20, 20, 'F');
        const bytes = new Uint8Array(pdf.output('arraybuffer'));
        expect(await convertShadingsToCmyk(bytes, engine, new Map())).toBe(bytes);
    });
});

describe('rgbFromColorArgs — the jsPDF colour call forms', () => {
    test('reads RGB, gray and hex; leaves CMYK alone', () => {
        expect(rgbFromColorArgs([224, 49, 49])).toEqual([224, 49, 49]);
        expect(rgbFromColorArgs([128])).toEqual([128, 128, 128]);
        expect(rgbFromColorArgs(['#1c5aa6'])).toEqual([28, 90, 166]);
        expect(rgbFromColorArgs([0, 0.5, 1, 0])).toBeNull();
    });
});

describe('exactCmykFromSwatches', () => {
    test('maps a swatch’s screen colour to its inks; swatches without cmyk are skipped', () => {
        const m = exactCmykFromSwatches([
            { color: '#1C5AA6', cmyk: [100, 60, 0, 10] },
            { color: '#ff0000' },
        ]);
        expect(m.get('#1c5aa6')).toEqual([100, 60, 0, 10]);
        expect(m.has('#ff0000')).toBe(false);
    });
});

describe('spot inks (Separation)', () => {
    test('pdfName escapes spaces, delimiters, # and non-ASCII as #xx', () => {
        expect(pdfName('PANTONE 186 C')).toBe('PANTONE#20186#20C');
        expect(pdfName('Gold/Silver (50%)')).toBe('Gold#2fSilver#20#2850#25#29');
        expect(pdfName('#1')).toBe('#231');
        expect(pdfName('Rot é')).toBe('Rot#20#c3#a9');
    });

    test('one plate per ink name; swatches without a spot or inks are not spots', () => {
        const spots = spotsFromSwatches([
            { color: '#d50032', cmyk: [0, 100, 81, 4], spot: { name: 'PANTONE 186 C' } },
            { color: '#d50033', cmyk: [0, 100, 81, 4], spot: { name: 'PANTONE 186 C' } },
            { color: '#0033a0', cmyk: [100, 75, 0, 0], spot: { name: 'PANTONE 286 C' } },
            { color: '#ffffff', spot: { name: 'No inks' } },
            { color: '#000000', cmyk: [0, 0, 0, 100] },
        ]);
        expect(spots.size).toBe(3);
        expect(spots.get('#d50032')).toBe(spots.get('#d50033')); // same ink, same object
        expect(spots.get('#d50032')!.res).toBe('YDSpot0');
        expect(spots.get('#0033a0')!.res).toBe('YDSpot1');
        expect(separationArray(spots.get('#0033a0')!)).toBe(
            '[/Separation /PANTONE#20286#20C /DeviceCMYK << /FunctionType 2 /Domain [0 1] /C0 [0 0 0 0] /C1 [1 0.75 0 0] /N 1 >>]');
    });

    test('fills and strokes in a spot colour select the Separation; text keeps the CMYK alternate', async () => {
        const spots = spotsFromSwatches([{ color: '#d50032', cmyk: [0, 100, 81, 4], spot: { name: 'PANTONE 186 C' } }]);
        const exact = exactCmykFromSwatches([{ color: '#d50032', cmyk: [0, 100, 81, 4] }]);
        const used = new Set<SpotInk>();
        const pdf = new jsPDF({ compress: false });
        installCmykColors(pdf, engine, exact, spots, used);
        pdf.setFillColor(213, 0, 50);
        pdf.setDrawColor('#d50032');
        pdf.rect(10, 10, 50, 30, 'FD');
        pdf.setTextColor(213, 0, 50);
        pdf.text('Spot', 10, 80);
        pdf.setFillColor(255, 0, 0); // an ordinary colour is still plain CMYK
        pdf.rect(70, 10, 20, 20, 'F');
        expect(used.size).toBe(1);

        const out = await convertShadingsToCmyk(new Uint8Array(pdf.output('arraybuffer')), engine, exact, used);
        const text = toLatin1(out);
        expect(text).toContain('/YDSpot0 cs 1 scn');
        expect(text).toContain('/YDSpot0 CS 1 SCN');
        expect(text).toMatch(/0\.? 1\.? 0\.81 0\.04 k/);           // text: the CMYK alternate
        // Declared in the page's resources, and the file still parses.
        const file = new PdfFile(out);
        const res = file.objectNumbers().map(n => file.get(n)!).find(o => /^<<\s*\/ProcSet/.test(o.dict))!;
        expect(res.dict).toContain('/ColorSpace <<');
        expect(res.dict).toContain('/YDSpot0 [/Separation /PANTONE#20186#20C /DeviceCMYK');
    });
});
