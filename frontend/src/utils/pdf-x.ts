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
    // jsPDF opens the file at page 1 with an /OpenAction. It is harmless, but PDF/X readers
    // and preflights treat document actions with suspicion, and nothing is lost without it.
    const catalogDict = catalog.dict.replace(/\/OpenAction\s*\[[^\]]*\]\s*/, '');
    file.set(catalogNum, catalogDict.replace(/>>\s*$/, `/OutputIntents [${intentNum} 0 R]\n/Metadata ${metaNum} 0 R\n>>`));

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

    // 6. Transparency blends in CMYK (see `setCmykBlending`).
    setCmykBlending(file);

    file.setVersion('1.6');
    const out = file.toBytes();
    // 7. Refuse to hand back a file our own checks reject.
    const problems = await verifyPdfX4(out);
    if (problems.length) throw new PdfXError(problems);
    return out;
}

/** A PDF/X file that failed `verifyPdfX4` — `problems` says what, one line each. */
export class PdfXError extends Error {
    problems: string[];
    constructor(problems: string[]) {
        super(`PDF/X-4 check failed: ${problems.join('; ')}`);
        this.problems = problems;
    }
}

/**
 * Whether anything in the file makes transparency: a graphics state with alpha < 1, a soft mask
 * or a blend mode, or an image with an SMask. Graphics states are found through the resource
 * dictionaries' `/ExtGState << /GS1 19 0 R >>` references — jsPDF writes the state objects
 * without the optional `/Type /ExtGState`, so looking for the type finds nothing.
 */
function usesTransparency(file: PdfFile): boolean {
    const states = new Set<number>();
    for (const num of file.objectNumbers()) {
        const o = file.get(num)!;
        if (/\/Type\s*\/ExtGState/.test(o.dict)) states.add(num);
        const res = /\/ExtGState\s*<<([^>]*)>>/.exec(o.dict)?.[1] ?? '';
        for (const m of res.matchAll(/(\d+)\s+0\s+R/g)) states.add(parseInt(m[1], 10));
    }
    for (const num of file.objectNumbers()) {
        const o = file.get(num)!;
        if (states.has(num)) {
            const alpha = [...o.dict.matchAll(/\/(?:ca|CA)\s+([\d.]+)/g)].some(m => parseFloat(m[1]) < 1);
            const smask = /\/SMask\s*(?!\/None)[<\d]/.test(o.dict);
            const blend = /\/BM\s*\/(?!Normal\b|Compatible\b)\w+/.test(o.dict);
            if (alpha || smask || blend) return true;
        }
        if (/\/Subtype\s*\/Image/.test(o.dict) && /\/SMask\s+\d+\s+0\s+R/.test(o.dict)) return true;
    }
    return false;
}

/** Form XObjects that are the `/G` of a luminosity soft mask — they keep their RGB group. */
function luminosityMaskGroups(file: PdfFile): Set<number> {
    const groups = new Set<number>();
    for (const num of file.objectNumbers()) {
        const m = /\/S\s*\/Luminosity[\s\S]*?\/G\s+(\d+)\s+0\s+R/.exec(file.get(num)!.dict);
        if (m) groups.add(parseInt(m[1], 10));
    }
    return groups;
}

/**
 * Transparency in a PDF/X-4 file blends in the output intent's colour space (VectorCraft does
 * the same: pdf/src/export.rs `cmyk_blending`). jsPDF writes one resource dictionary shared by
 * every page, so a file that uses transparency anywhere gets a CMYK page group on every page —
 * a page group on a page that doesn't use transparency changes nothing it draws.
 *
 * Existing groups that blend in RGB are moved to CMYK too, except soft-mask groups
 * (`/S /Luminosity` masks): their luminance is a screen luminance, so they stay as they are.
 */
function setCmykBlending(file: PdfFile): void {
    const maskGroups = luminosityMaskGroups(file);
    for (const num of file.objectNumbers()) {
        const o = file.get(num)!;
        if (maskGroups.has(num) || !/\/Group\s*<<[^>]*\/CS\s*\/DeviceRGB/.test(o.dict)) continue;
        file.set(num, o.dict.replace(/(\/Group\s*<<[^>]*\/CS\s*)\/DeviceRGB/, '$1/DeviceCMYK'), o.stream);
    }
    if (!usesTransparency(file)) return;
    for (const num of file.objectNumbers()) {
        const o = file.get(num)!;
        if (o.stream || !/\/Type\s*\/Page\b/.test(o.dict) || /\/Group\s*</.test(o.dict)) continue;
        file.set(num, o.dict.replace(/>>\s*$/, '/Group << /Type /Group /S /Transparency /CS /DeviceCMYK >>\n>>'));
    }
}

/**
 * Check a finished file against the PDF/X-4 rules this exporter is responsible for. Returns the
 * problems found (empty = passed). It is not a preflight — Acrobat / pdfToolbox check far more —
 * but it catches every rule we know we can break, before the file leaves the app.
 */
export async function verifyPdfX4(bytes: Uint8Array): Promise<string[]> {
    const problems: string[] = [];
    const head = toLatin1(bytes.subarray(0, 8));
    const version = /^%PDF-(\d\.\d)/.exec(head)?.[1];
    if (!version || parseFloat(version) > 1.6) problems.push(`PDF version ${version ?? '?'} (PDF/X-4 is at most 1.6)`);

    let file: PdfFile;
    try { file = new PdfFile(bytes); } catch (err) { return [...problems, `unreadable: ${(err as Error).message}`]; }
    if (/\/Encrypt\b/.test(file.getTrailer())) problems.push('the file is encrypted');
    if (!/\/ID\s*\[/.test(file.getTrailer())) problems.push('no file /ID in the trailer');

    const catalog = file.get(file.ref('Root') ?? -1)?.dict ?? '';
    if (/\/OpenAction|\/AA\b/.test(catalog)) problems.push('the catalog has document actions');
    const intentNum = /\/OutputIntents\s*\[\s*(\d+)\s+0\s+R/.exec(catalog)?.[1];
    const intent = intentNum ? file.get(+intentNum)?.dict ?? '' : '';
    if (!/\/S\s*\/GTS_PDFX/.test(intent)) problems.push('no GTS_PDFX output intent');
    if (!/\/OutputConditionIdentifier\s*[(<]/.test(intent)) problems.push('the output intent has no OutputConditionIdentifier');
    const profNum = /\/DestOutputProfile\s+(\d+)\s+0\s+R/.exec(intent)?.[1];
    const prof = profNum ? file.get(+profNum) : null;
    if (!prof?.stream || !/\/N\s+4\b/.test(prof.dict)) problems.push('the output intent has no embedded CMYK profile');

    const metaNum = /\/Metadata\s+(\d+)\s+0\s+R/.exec(catalog)?.[1];
    const xmp = metaNum ? new TextDecoder().decode(file.get(+metaNum)?.stream ?? new Uint8Array()) : '';
    if (!/<pdfxid:GTS_PDFXVersion>PDF\/X-4<\/pdfxid:GTS_PDFXVersion>/.test(xmp)) problems.push('XMP does not identify PDF/X-4');

    const info = file.get(file.ref('Info') ?? -1)?.dict ?? '';
    if (!/\/Trapped\s*\/(True|False)/.test(info)) problems.push('Info has no /Trapped True or False');
    if (!/\/Title\s*[(<]/.test(info)) problems.push('Info has no /Title');
    const created = /\/CreationDate\s*\(D:(\d{14})/.exec(info)?.[1];
    const xmpCreated = /<xmp:CreateDate>(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)/.exec(xmp)?.slice(1).join('');
    if (!created || created !== xmpCreated) problems.push('Info and XMP creation dates disagree');
    if (!/\/ModDate\s*\(D:/.test(info)) problems.push('Info has no /ModDate');

    // Pages: boxes, and a CMYK group wherever transparency is used.
    const transparent = usesTransparency(file);
    const contentNums = new Set<number>();
    for (const num of file.objectNumbers()) {
        const o = file.get(num)!;
        if (o.stream || !/\/Type\s*\/Page\b/.test(o.dict)) continue;
        const box = (k: string) => {
            const m = new RegExp(`/${k}\\s*\\[\\s*([-\\d.]+)\\s+([-\\d.]+)\\s+([-\\d.]+)\\s+([-\\d.]+)`).exec(o.dict);
            return m ? m.slice(1).map(Number) : null;
        };
        const media = box('MediaBox'), trim = box('TrimBox'), bleed = box('BleedBox');
        const inside = (a: number[], b: number[]) => a[0] >= b[0] - 1e-3 && a[1] >= b[1] - 1e-3 && a[2] <= b[2] + 1e-3 && a[3] <= b[3] + 1e-3;
        if (!media) problems.push(`page ${num}: no MediaBox`);
        if (!trim) problems.push(`page ${num}: no TrimBox`);
        if (media && trim && !inside(trim, media)) problems.push(`page ${num}: TrimBox outside the MediaBox`);
        if (bleed && media && trim && !(inside(trim, bleed) && inside(bleed, media))) problems.push(`page ${num}: BleedBox not between TrimBox and MediaBox`);
        if (transparent && !/\/Group\s*<<[^>]*\/S\s*\/Transparency[^>]*\/CS\s*\/DeviceCMYK/.test(o.dict)) problems.push(`page ${num}: transparency without a CMYK page group`);
        for (const m of (/\/Contents\s*(\[[^\]]*\]|\d+\s+0\s+R)/.exec(o.dict)?.[1] ?? '').matchAll(/(\d+)\s+0\s+R/g)) contentNums.add(+m[1]);
    }

    // Colour: nothing device-RGB, in dictionaries or in content streams.
    const groupsRgb: number[] = [];
    const maskGroups = luminosityMaskGroups(file);
    for (const num of file.objectNumbers()) {
        const o = file.get(num)!;
        if (/\/Subtype\s*\/Form/.test(o.dict)) contentNums.add(num);
        if (/\/DeviceRGB|\/CalRGB/.test(o.dict) && !maskGroups.has(num)) groupsRgb.push(num);
    }
    if (groupsRgb.length) problems.push(`RGB colour space in object${groupsRgb.length > 1 ? 's' : ''} ${groupsRgb.join(', ')}`);
    for (const num of contentNums) {
        const o = file.get(num);
        if (!o?.stream) continue;
        const text = toLatin1(await decodeStream(o.dict, o.stream));
        if (/(^|\s)[\d.]+\s+[\d.]+\s+[\d.]+\s+(rg|RG)(?=\s)/.test(text)) problems.push(`RGB colour operators in content stream ${num}`);
    }

    // Fonts: every one embedded.
    for (const num of file.objectNumbers()) {
        const o = file.get(num)!;
        if (/\/Type\s*\/Font\b/.test(o.dict) && /\/Subtype\s*\/(Type1|TrueType|MMType1|CIDFontType[02])\b/.test(o.dict)) {
            const fd = /\/FontDescriptor\s+(\d+)\s+0\s+R/.exec(o.dict)?.[1];
            const desc = fd ? file.get(+fd)?.dict ?? '' : '';
            if (!/\/FontFile[23]?\s+\d+\s+0\s+R/.test(desc)) {
                problems.push(`font ${/\/BaseFont\s*\/([^\s/]+)/.exec(o.dict)?.[1] ?? num} is not embedded`);
            }
        }
    }
    return problems;
}

