/**
 * PDF/X-4 (ISO 15930-7) for the CMYK vector PDF — docs/cmyk-print-plan.md, P5.
 *
 * Applied to the finished CMYK file through `PdfFile`, because jsPDF has an API for none of it:
 *
 *   • `%PDF-1.6` — X-4 is defined on PDF 1.6;
 *   • an **OutputIntent** (`/S /GTS_PDFX`) naming the registered characterisation (FOGRA39 /
 *     CGATS TR 006, ICC registry) with the press profile embedded as `DestOutputProfile`;
 *   • **XMP metadata** on the catalog — `pdfxid:GTS_PDFXVersion` is how X-4 identifies itself —
 *     with title, dates, `pdf:Trapped` and the xmpMM document/version ids, mirrored in the Info
 *     dictionary (preflight checks the two agree, so both are written from the same values);
 *   • a **TrimBox** on every page (and a **BleedBox** when there is bleed);
 *   • **only embedded fonts**: jsPDF lists all 14 standard fonts in every resource dictionary
 *     whether used or not; the unused ones are removed. (Used ones can't be non-embedded: in X
 *     mode the exporter embeds a bundled face instead of substituting a standard font.)
 *
 * What this cannot do is prove conformance — that needs a PDF/X preflight (Acrobat, callas
 * pdfToolbox, Affinity). The structure is checked in tests; the preflight is a manual step.
 */
import type { PrintProfileInfo } from './color-management';
import { PdfFile, decodeStream, deflate, toLatin1 } from './pdf-rewrite';

export interface PdfXOptions {
    profile: PrintProfileInfo;
    profileBytes: Uint8Array;
    title: string;
    /** Bleed around every page, in PDF points (0 = none). Trim is inset by this from the media. */
    bleedPt: number;
    /** For tests: a fixed timestamp and ids instead of now / random. */
    now?: Date;
    ids?: { documentId: string; instanceId: string };
}

/** A PDF text string: plain `(…)` for printable ASCII, UTF-16BE hex `<FEFF…>` for anything else. */
export function pdfString(s: string): string {
    if (/^[\x20-\x7e]*$/.test(s)) return `(${s.replace(/[\\()]/g, m => '\\' + m)})`;
    let hex = 'FEFF';
    for (let i = 0; i < s.length; i++) hex += s.charCodeAt(i).toString(16).padStart(4, '0').toUpperCase();
    return `<${hex}>`;
}

const xmlEscape = (s: string) => s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!));

const pad = (n: number, w = 2) => String(Math.abs(n)).padStart(w, '0');

/** `D:YYYYMMDDHHmmSS+HH'mm'` and the matching ISO 8601 string, from one instant, in local time. */
export function pdfAndXmpDates(d: Date): { pdf: string; xmp: string } {
    const off = -d.getTimezoneOffset();
    const sign = off >= 0 ? '+' : '-';
    const oh = pad(Math.floor(Math.abs(off) / 60)), om = pad(Math.abs(off) % 60);
    const y = d.getFullYear(), mo = pad(d.getMonth() + 1), da = pad(d.getDate());
    const h = pad(d.getHours()), mi = pad(d.getMinutes()), se = pad(d.getSeconds());
    return {
        pdf: `D:${y}${mo}${da}${h}${mi}${se}${sign}${oh}'${om}'`,
        xmp: `${y}-${mo}-${da}T${h}:${mi}:${se}${sign}${oh}:${om}`,
    };
}

export function xmpPacket(o: { title: string; xmpDate: string; producer: string; documentId: string; instanceId: string }): string {
    const t = xmlEscape(o.title);
    return `<?xpacket begin="\u{FEFF}" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:xmp="http://ns.adobe.com/xap/1.0/"
    xmlns:pdf="http://ns.adobe.com/pdf/1.3/"
    xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/"
    xmlns:pdfxid="http://www.npes.org/pdfx/ns/id/">
   <dc:format>application/pdf</dc:format>
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${t}</rdf:li></rdf:Alt></dc:title>
   <xmp:CreateDate>${o.xmpDate}</xmp:CreateDate>
   <xmp:ModifyDate>${o.xmpDate}</xmp:ModifyDate>
   <xmp:MetadataDate>${o.xmpDate}</xmp:MetadataDate>
   <xmp:CreatorTool>YappyDraw</xmp:CreatorTool>
   <pdf:Producer>${xmlEscape(o.producer)}</pdf:Producer>
   <pdf:Trapped>False</pdf:Trapped>
   <xmpMM:DocumentID>${o.documentId}</xmpMM:DocumentID>
   <xmpMM:InstanceID>${o.instanceId}</xmpMM:InstanceID>
   <xmpMM:VersionID>1</xmpMM:VersionID>
   <xmpMM:RenditionClass>default</xmpMM:RenditionClass>
   <pdfxid:GTS_PDFXVersion>PDF/X-4</pdfxid:GTS_PDFXVersion>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

const uuid = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`);

/** Font resource names (`F1`, `F12`…) a content stream sets with `Tf`. */
const fontsUsedIn = (content: string): Set<string> => new Set([...content.matchAll(/\/(F\d+)\s+[\d.]+\s+Tf/g)].map(m => m[1]));

/** Turn a finished CMYK PDF into PDF/X-4. */
export async function applyPdfX4(bytes: Uint8Array, o: PdfXOptions): Promise<Uint8Array> {
    const file = new PdfFile(bytes);
    const catalogNum = file.ref('Root');
    const infoNum = file.ref('Info');
    if (!catalogNum || !infoNum) throw new Error('PDF/X: no catalog or info dictionary');
    const catalog = file.get(catalogNum)!;
    if (/\/OutputIntents|\/Metadata/.test(catalog.dict)) throw new Error('PDF/X: catalog already has an output intent or metadata');

    const dates = pdfAndXmpDates(o.now ?? new Date());
    const ids = o.ids ?? { documentId: `uuid:${uuid()}`, instanceId: `uuid:${uuid()}` };
    const producer = /\/Producer\s*\(([^)]*)\)/.exec(file.get(infoNum)!.dict)?.[1] ?? 'jsPDF';

    // 1. Output intent + the press profile.
    const iccNum = file.add('<<\n/N 4\n/Filter /FlateDecode\n>>', await deflate(o.profileBytes));
    const intentNum = file.add(`<<\n/Type /OutputIntent\n/S /GTS_PDFX\n/OutputConditionIdentifier ${pdfString(o.profile.outputConditionIdentifier)}\n/OutputCondition ${pdfString(o.profile.outputCondition)}\n/RegistryName (http://www.color.org)\n/Info ${pdfString(o.profile.label)}\n/DestOutputProfile ${iccNum} 0 R\n>>`);

    // 2. XMP metadata — left unfiltered so any tool can read it without decoding.
    const xmp = new TextEncoder().encode(xmpPacket({ title: o.title, xmpDate: dates.xmp, producer, ...ids }));
    const metaNum = file.add('<<\n/Type /Metadata\n/Subtype /XML\n>>', xmp);
    file.set(catalogNum, catalog.dict.replace(/>>\s*$/, `/OutputIntents [${intentNum} 0 R]\n/Metadata ${metaNum} 0 R\n>>`));

    // 3. Info dictionary, from the same values as the XMP.
    file.set(infoNum, `<<\n/Producer ${pdfString(producer)}\n/Creator (YappyDraw)\n/Title ${pdfString(o.title)}\n/CreationDate (${dates.pdf})\n/ModDate (${dates.pdf})\n/Trapped /False\n/GTS_PDFXVersion (PDF/X-4)\n>>`);

    // 4. Page boxes — and the content streams to scan for fonts: every page's /Contents, and
    // every form XObject (svg2pdf draws patterns and some groups through forms).
    const contentNums = new Set<number>();
    for (const num of file.objectNumbers()) {
        const obj = file.get(num)!;
        if (/\/Type\s*\/Page\b/.test(obj.dict) && !obj.stream) {
            const mb = /\/MediaBox\s*\[\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*\]/.exec(obj.dict);
            if (!mb) throw new Error(`PDF/X: page ${num} has no MediaBox`);
            const [x0, y0, x1, y1] = mb.slice(1).map(Number);
            const b = o.bleedPt;
            const box = (d: number) => `[${+(x0 + d).toFixed(3)} ${+(y0 + d).toFixed(3)} ${+(x1 - d).toFixed(3)} ${+(y1 - d).toFixed(3)}]`;
            const boxes = (b > 0 ? `/BleedBox ${box(0)} ` : '') + `/TrimBox ${box(b)}`;
            file.set(num, obj.dict.replace(/>>\s*$/, `${boxes}\n>>`));
            const contents = /\/Contents\s*(\[[^\]]*\]|\d+\s+0\s+R)/.exec(obj.dict)?.[1] ?? '';
            for (const m of contents.matchAll(/(\d+)\s+0\s+R/g)) contentNums.add(parseInt(m[1], 10));
        }
        if (obj.stream && /\/Subtype\s*\/Form/.test(obj.dict)) contentNums.add(num);
    }
    const contentStreams: string[] = [];
    for (const num of contentNums) {
        const obj = file.get(num);
        if (obj?.stream) contentStreams.push(toLatin1(await decodeStream(obj.dict, obj.stream)));
    }

    // 5. Only the fonts actually set survive in the resource dictionaries.
    const used = new Set<string>();
    contentStreams.forEach(c => fontsUsedIn(c).forEach(f => used.add(f)));
    const dropped = new Set<number>();
    const kept = new Set<number>();
    for (const num of file.objectNumbers()) {
        const obj = file.get(num)!;
        if (obj.stream || !/^<<\s*\/ProcSet/.test(obj.dict)) continue;
        const fm = /\/Font\s*<<([^>]*)>>/.exec(obj.dict);
        if (!fm) continue;
        const entries = [...fm[1].matchAll(/\/(F\d+)\s+(\d+)\s+0\s+R/g)];
        const keep = entries.filter(e => used.has(e[1]));
        entries.forEach(e => (used.has(e[1]) ? kept : dropped).add(parseInt(e[2], 10)));
        const fontDict = keep.length ? `/Font << ${keep.map(e => `/${e[1]} ${e[2]} 0 R`).join(' ')} >>` : '';
        file.set(num, obj.dict.replace(fm[0], fontDict));
    }
    for (const num of dropped) if (!kept.has(num)) file.remove(num);

    file.setVersion('1.6');
    return file.toBytes();
}

