/**
 * Shared Office Open XML plumbing for PPTX export (and, later, import): unit conversion,
 * XML escaping and the zip container. Pure — no DOM, no store — so it unit-tests under bun.
 *
 * Units follow ECMA-376: lengths are EMU (English Metric Units), angles are 60000ths of a
 * degree, percentages are 1000ths of a percent, font sizes are hundredths of a point. A Yappy
 * canvas unit is a CSS pixel at 96 dpi, i.e. 9525 EMU — the same mapping PowerPoint uses for
 * its own pixel rulers, so a 1920×1080 page becomes a 20″×11.25″ slide with the same
 * proportions for every shape, line width and font size.
 */
import { zipSync, strToU8, type Zippable } from 'fflate';

export const EMU_PER_PX = 9525;
export const EMU_PER_PT = 12700;

/** Canvas px → integer EMU. */
export const emu = (px: number): number => Math.round((Number.isFinite(px) ? px : 0) * EMU_PER_PX);

/** Degrees → DrawingML angle (60000ths of a degree), normalised into [0, 360°). */
export const ang = (deg: number): number => {
    const d = ((Number.isFinite(deg) ? deg : 0) % 360 + 360) % 360;
    return Math.round(d * 60000) % 21600000;
};

/** Canvas px font size → DrawingML `sz` (hundredths of a point, clamped to the schema's 1–4000 pt). */
export const fontSz = (px: number): number =>
    Math.max(100, Math.min(400000, Math.round(px * (EMU_PER_PX / EMU_PER_PT) * 100)));

/** Fraction 0..1 → DrawingML percentage (100000 = 100%). */
export const pct = (f: number): number => Math.round(Math.max(0, Math.min(1, f)) * 100000);

/** Escape text for an XML attribute or text node; drops characters XML 1.0 forbids. */
export const esc = (s: string): string =>
    String(s)
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

export const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

export const NS = {
    a: 'http://schemas.openxmlformats.org/drawingml/2006/main',
    r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    p: 'http://schemas.openxmlformats.org/presentationml/2006/main',
    p14: 'http://schemas.microsoft.com/office/powerpoint/2010/main',
    mc: 'http://schemas.openxmlformats.org/markup-compatibility/2006',
    rel: 'http://schemas.openxmlformats.org/package/2006/relationships',
    ct: 'http://schemas.openxmlformats.org/package/2006/content-types',
} as const;

/** Relationship type URIs, by the short name the writer uses. */
export const REL = {
    officeDocument: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument',
    coreProps: 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties',
    extProps: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties',
    slide: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide',
    slideLayout: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout',
    slideMaster: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster',
    theme: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme',
    image: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
    presProps: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps',
    viewProps: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps',
    tableStyles: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles',
    notesSlide: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide',
    notesMaster: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster',
    hyperlink: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
    chart: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart',
    package: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/package',
} as const;

export interface Rel { id: string; type: string; target: string; external?: boolean }

export const relsXml = (rels: Rel[]): string =>
    XML_DECL + `<Relationships xmlns="${NS.rel}">`
    + rels.map(r => `<Relationship Id="${esc(r.id)}" Type="${r.type}" Target="${esc(r.target)}"${r.external ? ' TargetMode="External"' : ''}/>`).join('')
    + '</Relationships>';

/**
 * Zip the package. `[Content_Types].xml` goes first — not required by OPC, but some readers
 * (older LibreOffice, a few mobile viewers) sniff the first entry. Media is stored rather than
 * deflated: PNG/JPEG are already compressed, and deflating them again only costs time.
 */
export function zipPackage(parts: Map<string, string | Uint8Array>): Uint8Array {
    const z: Zippable = {};
    const order = [...parts.keys()].sort((a, b) =>
        (a === '[Content_Types].xml' ? -1 : b === '[Content_Types].xml' ? 1 : 0));
    for (const name of order) {
        const v = parts.get(name)!;
        const bytes = typeof v === 'string' ? strToU8(v) : v;
        const stored = typeof v !== 'string' && /\.(png|jpe?g|gif|webp)$/i.test(name);
        z[name] = [bytes, { level: stored ? 0 : 6 }];
    }
    return zipSync(z);
}
