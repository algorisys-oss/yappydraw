import { beforeAll, describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PRINT_PROFILES } from './color-management';
import { PdfFile, decodeStream, toLatin1 } from './pdf-rewrite';
import { applyPdfX4, pdfAndXmpDates, pdfString, xmpPacket } from './pdf-x';

const root = join(import.meta.dir, '../../..');
const profileBytes = new Uint8Array(readFileSync(join(root, 'frontend/public/icc/fogra39-coated.icc')));
let jsPDF: typeof import('jspdf').jsPDF;

beforeAll(async () => {
    // jsPDF's node build reads atob/btoa off a partial `global.window` other tests leave behind.
    const w = (globalThis as any).window;
    if (w && typeof w === 'object') { w.atob ??= atob; w.btoa ??= btoa; }
    ({ jsPDF } = await import('jspdf'));
});

const sample = (pages = 1) => {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [400, 300], hotfixes: ['px_scaling'], compress: true });
    for (let i = 0; i < pages; i++) {
        if (i) pdf.addPage([400, 300], 'landscape');
        pdf.setFillColor(0, 0.5, 1, 0);
        pdf.rect(10, 10, 100, 50, 'F');
    }
    pdf.setFont('helvetica', 'normal');
    pdf.text('Only Helvetica is used', 10, 200);
    return new Uint8Array(pdf.output('arraybuffer'));
};

const FIXED = { now: new Date(2026, 9, 9, 14, 30, 5), ids: { documentId: 'uuid:doc-1', instanceId: 'uuid:inst-1' } };

describe('strings and dates', () => {
    test('pdfString: literal for ASCII (escaped), UTF-16BE hex otherwise', () => {
        expect(pdfString('Spring poster')).toBe('(Spring poster)');
        expect(pdfString('a(b)\\c')).toBe('(a\\(b\\)\\\\c)');
        expect(pdfString('Café')).toBe('<FEFF0043006100660065>'.replace('0065>', '00E9>'));
    });

    test('the PDF and XMP dates are the same instant', () => {
        const { pdf, xmp } = pdfAndXmpDates(FIXED.now);
        expect(pdf).toMatch(/^D:20261009143005[+-]\d\d'\d\d'$/);
        expect(xmp).toMatch(/^2026-10-09T14:30:05[+-]\d\d:\d\d$/);
        expect(pdf.slice(16).replace("'", ':').replace("'", '')).toBe(xmp.slice(19));
    });

    test('the XMP packet identifies PDF/X-4 and escapes the title', () => {
        const x = xmpPacket({ title: 'Tom & Jerry <2>', xmpDate: '2026-10-09T14:30:05+05:30', producer: 'jsPDF 4', documentId: 'uuid:d', instanceId: 'uuid:i' });
        expect(x).toContain('<pdfxid:GTS_PDFXVersion>PDF/X-4</pdfxid:GTS_PDFXVersion>');
        expect(x).toContain('Tom &amp; Jerry &lt;2&gt;');
        expect(x).toContain('<pdf:Trapped>False</pdf:Trapped>');
        expect(x).toContain('<xmpMM:RenditionClass>default</xmpMM:RenditionClass>');
    });
});

describe('applyPdfX4', () => {
    test('writes the output intent, metadata, info, boxes and version', async () => {
        const out = await applyPdfX4(sample(2), { profile: PRINT_PROFILES.fogra39, profileBytes, title: 'Spring poster', bleedPt: 9, ...FIXED });
        expect(toLatin1(out.subarray(0, 8))).toBe('%PDF-1.6');
        const file = new PdfFile(out);
        const catalog = file.get(file.ref('Root')!)!.dict;
        const intentNum = parseInt(/\/OutputIntents \[(\d+) 0 R\]/.exec(catalog)![1], 10);
        const intent = file.get(intentNum)!.dict;
        expect(intent).toContain('/S /GTS_PDFX');
        expect(intent).toContain('/OutputConditionIdentifier (FOGRA39)');
        expect(intent).toContain('/RegistryName (http://www.color.org)');

        // The embedded profile is the real one, byte for byte.
        const icc = file.get(parseInt(/\/DestOutputProfile (\d+) 0 R/.exec(intent)![1], 10))!;
        expect(icc.dict).toContain('/N 4');
        expect([...await decodeStream(icc.dict, icc.stream!)]).toEqual([...profileBytes]);

        const meta = file.get(parseInt(/\/Metadata (\d+) 0 R/.exec(catalog)![1], 10))!;
        const xmp = new TextDecoder().decode(meta.stream!);
        expect(xmp).toContain('PDF/X-4');
        expect(xmp).toContain('Spring poster');

        const info = file.get(file.ref('Info')!)!.dict;
        const { pdf: pdfDate } = pdfAndXmpDates(FIXED.now);
        expect(info).toContain('/Title (Spring poster)');
        expect(info).toContain(`/CreationDate (${pdfDate})`);
        expect(info).toContain(`/ModDate (${pdfDate})`);
        expect(info).toContain('/Trapped /False');

        // 400×300 px = 300×225 pt; trim inset by the 9 pt bleed, bleed box = the media.
        const pages = file.objectNumbers().map(n => file.get(n)!).filter(o => /\/Type \/Page\b/.test(o.dict));
        expect(pages).toHaveLength(2);
        for (const p of pages) {
            expect(p.dict).toContain('/TrimBox [9 9 291 216]');
            expect(p.dict).toContain('/BleedBox [0 0 300 225]');
        }
    });

    test('without bleed there is a TrimBox and no BleedBox', async () => {
        const out = await applyPdfX4(sample(), { profile: PRINT_PROFILES.fogra39, profileBytes, title: 't', bleedPt: 0, ...FIXED });
        const t = toLatin1(out);
        expect(t).toContain('/TrimBox [0 0 300 225]');
        expect(t).not.toContain('/BleedBox');
    });

    test('drops the unused standard fonts jsPDF always lists, keeping the ones set', async () => {
        const before = toLatin1(sample());
        expect((before.match(/\/BaseFont \//g) ?? []).length).toBe(14);
        const out = toLatin1(await applyPdfX4(sample(), { profile: PRINT_PROFILES.fogra39, profileBytes, title: 't', bleedPt: 0, ...FIXED }));
        expect(out.match(/\/BaseFont \/[\w-]+/g)).toEqual(['/BaseFont /Helvetica']);
        // …and the file still parses with its references intact.
        const file = new PdfFile(new Uint8Array([...out].map(c => c.charCodeAt(0))));
        const res = file.objectNumbers().map(n => file.get(n)!).find(o => /^<<\s*\/ProcSet/.test(o.dict))!;
        const ref = parseInt(/\/F\d+ (\d+) 0 R/.exec(res.dict)![1], 10);
        expect(file.get(ref)!.dict).toContain('/Helvetica');
    });

    test('refuses a file that already has an output intent rather than stacking a second', async () => {
        const once = await applyPdfX4(sample(), { profile: PRINT_PROFILES.fogra39, profileBytes, title: 't', bleedPt: 0, ...FIXED });
        expect(applyPdfX4(once, { profile: PRINT_PROFILES.fogra39, profileBytes, title: 't', bleedPt: 0, ...FIXED })).rejects.toThrow();
    });
});
