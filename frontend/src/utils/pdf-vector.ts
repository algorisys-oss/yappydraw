/**
 * Vector PDF export.
 *
 * The SVG exporter (`buildExportSvg`) already turns every shape into real vector markup, so a
 * vector PDF is that SVG handed to svg2pdf.js — not a second renderer that would drift from the
 * first. What this module adds is the part svg2pdf can't do on its own:
 *
 *   • **Pages.** One SVG is built for the whole document; each PDF page is the same SVG cropped
 *     with a viewBox to its slide, minus the elements another page owns (the same ownership rule
 *     the raster exporter uses, so a shape straddling a gutter lands on exactly one page).
 *   • **Fonts.** The SVG loads its fonts from a Google Fonts `@import`, which a PDF can't use, and
 *     svg2pdf falls back to *Times* for any family jsPDF doesn't know. So every text node is
 *     rewritten to name a font embedded here from the bundled fonts (`public/fonts/outline/`,
 *     WOFF unwrapped to TrueType), or — when nothing embeddable exists — to a deliberately
 *     chosen standard PDF font rather than Times.
 *   • **Image filters.** `<image style="filter:…">` is CSS, which svg2pdf ignores; those images
 *     are baked through a canvas first so brightness/blur/etc. survive.
 *
 * Shadows, glows, feather and opacity masks are SVG filters / `<mask>` in the SVG export, which
 * svg2pdf can't render either; `buildExportSvg({ rasterEffects: true })` emits those as
 * per-object bitmaps for this path instead (see `haloImage` in utils/export).
 */
import type { jsPDF as JsPdf } from 'jspdf';
import { pdfFontFile } from './text-to-outlines';
import { reverseFontFamily } from './text-utils';
import { customFonts } from './custom-fonts';
import type { ColorEngine } from './color-management';
import { convertShadingsToCmyk, installCmykColors, installCmykImages, prepareCmykImages, type ExactCmyk, type SpotInk, type SpotMap } from './pdf-cmyk';

/** One PDF page: a world-space rectangle, and which elements it shows. */
export interface PdfPageRegion {
    x: number;
    y: number;
    width: number;
    height: number;
    /** Ids of the elements this page owns. Omit to keep every element in the region. */
    keep?: Set<string>;
    /** Fill drawn under the page, or null for none (transparent → white paper). */
    background: string | null;
}

/** What a text node actually asks for, after inheriting from its ancestors. */
export interface TextFace {
    family: string;   // the whole CSS stack, e.g. "Poppins, sans-serif"
    weight: number;
    italic: boolean;
}

const inherited = (el: Element, attr: string): string | null => {
    for (let n: Element | null = el; n; n = n.parentElement) {
        const v = n.getAttribute(attr);
        if (v !== null && v !== '' && v !== 'inherit') return v;
    }
    return null;
};

const parseWeight = (w: string | null): number => {
    if (!w || w === 'normal') return 400;
    if (w === 'bold' || w === 'bolder') return 700;
    if (w === 'lighter') return 300;
    const n = parseInt(w, 10);
    return Number.isFinite(n) ? n : 400;
};

/** The effective face of a `<text>`/`<tspan>`, read the way CSS inheritance would. */
export const textFaceOf = (el: Element): TextFace => ({
    family: inherited(el, 'font-family') ?? 'sans-serif',
    weight: parseWeight(inherited(el, 'font-weight')),
    italic: /italic|oblique/.test(inherited(el, 'font-style') ?? ''),
});

/** A face jsPDF ships, chosen to resemble the CSS stack's generic fallback. Never Times by accident. */
export const standardPdfFont = (face: TextFace): { family: string; style: string } => {
    const stack = face.family.toLowerCase();
    const family = /monospace|mono\b|courier|code/.test(stack) ? 'courier'
        : /(^|,)\s*serif|merriweather|georgia|times/.test(stack) ? 'times'
        : 'helvetica';
    const bold = face.weight >= 600;
    const style = bold && face.italic ? 'bolditalic' : bold ? 'bold' : face.italic ? 'italic' : 'normal';
    return { family, style };
};

const primaryFamily = (stack: string) => stack.split(',')[0].trim().replace(/^['"]|['"]$/g, '');

/** A font file the PDF can embed: where to get its bytes, and a stable name for it. */
interface EmbeddableFont { id: string; load: () => Promise<ArrayBuffer> }

const fetchBuffer = async (url: string): Promise<ArrayBuffer> => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Font fetch failed: ${url} (${r.status})`);
    return r.arrayBuffer();
};

/** zlib inflate via the platform's DecompressionStream ('deflate' is the zlib-wrapped format). */
const inflate = async (data: Uint8Array): Promise<Uint8Array> => {
    const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
};

/**
 * Unwrap a WOFF 1.0 file into the plain sfnt (TTF/OTF) it carries, or return the input unchanged
 * when it isn't WOFF. WOFF is only a container: each table is stored zlib-compressed (or raw,
 * when compressing didn't help), so this is a lossless rebuild of the original table directory.
 * WOFF2 (`wOF2`) is a different, transformed format and is not handled.
 *
 * `inflateFn` is injectable so the unit test can run it with node's zlib.
 */
export const woffToSfnt = async (buf: ArrayBuffer, inflateFn: (d: Uint8Array) => Promise<Uint8Array> = inflate): Promise<ArrayBuffer> => {
    const v = new DataView(buf);
    if (buf.byteLength < 44 || v.getUint32(0) !== 0x774f4646) return buf; // 'wOFF'
    const flavor = v.getUint32(4);
    const numTables = v.getUint16(12);
    const tables: { tag: number; checksum: number; data: Uint8Array }[] = [];
    for (let i = 0; i < numTables; i++) {
        const e = 44 + i * 20;
        const tag = v.getUint32(e), offset = v.getUint32(e + 4), compLength = v.getUint32(e + 8);
        const origLength = v.getUint32(e + 12), checksum = v.getUint32(e + 16);
        const raw = new Uint8Array(buf, offset, compLength);
        const data = compLength < origLength ? await inflateFn(raw) : raw;
        if (data.length !== origLength) throw new Error('WOFF table decompressed to the wrong length');
        tables.push({ tag, checksum, data });
    }
    // sfnt offset table + 16-byte records, then each table padded to 4 bytes, in tag order.
    tables.sort((a, b) => a.tag - b.tag);
    let size = 12 + numTables * 16;
    for (const t of tables) size += (t.data.length + 3) & ~3;
    const out = new Uint8Array(size);
    const ov = new DataView(out.buffer);
    let pow = 1, log = 0;
    while (pow * 2 <= numTables) { pow *= 2; log++; }
    ov.setUint32(0, flavor);
    ov.setUint16(4, numTables);
    ov.setUint16(6, pow * 16);
    ov.setUint16(8, log);
    ov.setUint16(10, numTables * 16 - pow * 16);
    let off = 12 + numTables * 16;
    tables.forEach((t, i) => {
        const r = 12 + i * 16;
        ov.setUint32(r, t.tag);
        ov.setUint32(r + 4, t.checksum);
        ov.setUint32(r + 8, off);
        ov.setUint32(r + 12, t.data.length);
        out.set(t.data, off);
        off += (t.data.length + 3) & ~3;
    });
    return out.buffer;
};

/** TrueType magic: 0x00010000 or 'true'. jsPDF parses nothing else (not CFF 'OTTO', not WOFF). */
export const isTrueType = (buf: ArrayBuffer): boolean => {
    if (buf.byteLength < 4) return false;
    const v = new DataView(buf).getUint32(0);
    return v === 0x00010000 || v === 0x74727565;
};

const dataUrlBuffer = (dataUrl: string): ArrayBuffer => {
    const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out.buffer;
};

/** Which embeddable file serves this face, if any. */
export const embeddableFontFor = (face: TextFace): EmbeddableFont | null => {
    const name = primaryFamily(face.family);
    const custom = customFonts().find(f => f.family === name);
    if (custom) {
        if (custom.kind === 'google' || !custom.dataUrl) return null; // no file in hand
        return { id: `yd-${custom.key}`, load: async () => dataUrlBuffer(custom.dataUrl!) };
    }
    const key = reverseFontFamily(face.family);
    if (!key) return null;
    const f = pdfFontFile(key, face.weight, face.italic);
    if (!f) return null;
    const base = (import.meta as any).env?.BASE_URL ?? '/';
    return { id: `yd-${f.file.replace(/\.(ttf|woff)$/, '')}`, load: () => fetchBuffer(`${base}fonts/outline/${f.file}`) };
};

const toBase64 = (buf: ArrayBuffer): string => {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
};

/**
 * Embed a font for every face the SVG uses and rewrite each text node to name it.
 *
 * Each embedded file is registered as its own family with style "normal", and the node's
 * weight/style are reset to 400/normal: the file already IS that weight and slant, and it keeps
 * svg2pdf's own matcher (which knows only 400 and 700, and falls back to Times) out of the way.
 *
 * Returns the families that could not be embedded and were substituted, for the caller to report.
 */
/** The bundled family that stands in for a standard PDF font when every font must be embedded. */
const EMBEDDED_STAND_IN: Record<string, string> = {
    helvetica: 'Inter, sans-serif',
    times: 'Merriweather, serif',
    courier: 'Source Code Pro, monospace',
};

export const embedSvgFonts = async (pdf: JsPdf, svg: SVGSVGElement, embedAll = false): Promise<string[]> => {
    const loaded = new Map<string, Promise<boolean>>();
    const substituted = new Set<string>();
    const nodes = [...svg.querySelectorAll('text, tspan')];
    // Resolve every face before rewriting anything: a tspan inherits from its <text>, so
    // rewriting the parent first would change what the child appears to ask for.
    const faces = nodes.map(textFaceOf);

    const ensure = (font: EmbeddableFont): Promise<boolean> => {
        let p = loaded.get(font.id);
        if (!p) {
            p = font.load().then(woffToSfnt).then(buf => {
                if (!isTrueType(buf)) return false;
                const file = `${font.id}.ttf`;
                pdf.addFileToVFS(file, toBase64(buf));
                pdf.addFont(file, font.id, 'normal');
                // jsPDF swallows a parse failure into a console error and leaves the font out of
                // its list; the list is the only reliable signal that it really registered.
                return !!pdf.getFontList()[font.id];
            }).catch(() => false);
            loaded.set(font.id, p);
        }
        return p;
    };

    await Promise.all(nodes.map(async (node, i) => {
        const face = faces[i];
        let font = embeddableFontFor(face);
        if ((!font || !await ensure(font)) && embedAll) {
            // PDF/X: no font may be left unembedded, so the substitute must be a bundled face too.
            font = embeddableFontFor({ ...face, family: EMBEDDED_STAND_IN[standardPdfFont(face).family] });
            if (!font || !await ensure(font)) throw new Error(`PDF/X: could not embed a font for “${face.family}”`);
            substituted.add(primaryFamily(face.family));
        }
        if (font && await ensure(font)) {
            node.setAttribute('font-family', font.id);
            node.setAttribute('font-weight', '400');
            node.setAttribute('font-style', 'normal');
        } else {
            const std = standardPdfFont(face);
            node.setAttribute('font-family', std.family);
            node.setAttribute('font-weight', std.style.includes('bold') ? '700' : '400');
            node.setAttribute('font-style', std.style.includes('italic') ? 'italic' : 'normal');
            substituted.add(primaryFamily(face.family));
        }
        node.removeAttribute('font-stretch');
    }));
    return [...substituted];
};

/** Bake CSS `filter` on `<image>` nodes into the bitmap, since svg2pdf ignores CSS filters. */
export const bakeImageFilters = async (svg: SVGSVGElement): Promise<void> => {
    const images = [...svg.querySelectorAll('image')].filter(im => /filter\s*:/.test(im.getAttribute('style') ?? ''));
    await Promise.all(images.map(async im => {
        const filter = (im.getAttribute('style') ?? '').match(/filter\s*:\s*([^;]+)/)?.[1]?.trim();
        const href = im.getAttribute('href') ?? im.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
        if (!filter || !href) return;
        try {
            const img = new Image();
            img.src = href;
            await img.decode();
            const c = document.createElement('canvas');
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            const ctx = c.getContext('2d');
            if (!ctx) return;
            ctx.filter = filter;
            ctx.drawImage(img, 0, 0);
            im.setAttribute('href', c.toDataURL('image/png'));
            im.removeAttribute('style');
        } catch {
            // Leave the image unfiltered rather than failing the whole export.
        }
    }));
};

/**
 * Crop the built SVG to one page: viewBox onto the region, drop elements another page owns,
 * and drop page backgrounds when the page has none.
 */
export const pageSvg = (source: SVGSVGElement, originX: number, originY: number, region: PdfPageRegion): SVGSVGElement => {
    const svg = source.cloneNode(true) as SVGSVGElement;
    svg.setAttribute('width', `${region.width}`);
    svg.setAttribute('height', `${region.height}`);
    svg.setAttribute('viewBox', `${region.x - originX} ${region.y - originY} ${region.width} ${region.height}`);
    svg.style.backgroundColor = '';
    if (region.keep) {
        svg.querySelectorAll('[data-yappy-id]').forEach(n => {
            if (!region.keep!.has(n.getAttribute('data-yappy-id')!)) n.remove();
        });
    }
    // The page colour is painted by the PDF itself (see renderSvgPagesToPdf), so the rects the
    // SVG carries for it would only double it — or, with background off, put it back.
    svg.querySelectorAll('[data-yappy-page-bg]').forEach(n => n.remove());
    // Fonts are embedded, not imported.
    svg.querySelectorAll('style').forEach(s => { if (s.textContent?.includes('@import')) s.remove(); });
    return svg;
};

/**
 * A CSS colour as `#rrggbb`, which is all `jsPDF.setFillColor` reliably takes. The canvas
 * normalises named/rgb()/hsl() colours for us; anything it rejects, or anything fully
 * transparent, is no background at all.
 */
export const cssColorToHex = (color: string): string | null => {
    if (/^#[0-9a-f]{6}$/i.test(color)) return color;
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#000001';
    ctx.fillStyle = color;
    const v = String(ctx.fillStyle);
    if (v === '#000001') return null;
    if (v.startsWith('#')) return v;
    const m = v.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = '1'] = m[1].split(',').map(x => x.trim());
    if (parseFloat(a) === 0) return null;
    return '#' + [r, g, b].map(x => (+x).toString(16).padStart(2, '0')).join('');
};

/**
 * Render each region of the SVG as one vector PDF page. The SVG is attached to the document
 * while it renders, because svg2pdf measures text and resolves styles through the live DOM.
 */
export interface PdfCmykOptions {
    engine: ColorEngine;
    /** Swatch colours with an exact CMYK, exported as-is (see pdf-cmyk `exactCmykFromSwatches`). */
    exact: ExactCmyk;
    /** Spot-ink swatches, exported as Separation colour spaces (see pdf-cmyk `spotsFromSwatches`). */
    spots: SpotMap;
    /** Make the file PDF/X-4 (see utils/pdf-x). Bleed is in PDF points. */
    pdfx?: { title: string; bleedPt: number };
}

export const renderSvgPagesToPdf = async (
    source: SVGSVGElement, originX: number, originY: number, regions: PdfPageRegion[],
    cmyk?: PdfCmykOptions,
): Promise<{ bytes: Uint8Array; substitutedFonts: string[]; rgbImages: number }> => {
    const [{ jsPDF }, { svg2pdf }] = await Promise.all([import('jspdf'), import('svg2pdf.js')]);
    const first = regions[0];
    const pdf = new jsPDF({
        orientation: first.width >= first.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [first.width, first.height],
        hotfixes: ['px_scaling'],
        // Flate-compress streams. Without it every embedded bitmap is stored raw — a 460×360
        // shadow halo was 650 kB — and content streams and fonts go uncompressed too.
        compress: true,
    });

    const prepared = source.cloneNode(true) as SVGSVGElement;
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none';
    document.body.appendChild(host);
    try {
        host.appendChild(prepared);
        const substitutedFonts = await embedSvgFonts(pdf, prepared, !!cmyk?.pdfx);
        await bakeImageFilters(prepared);
        prepared.remove();
        // An image the CMYK path didn't prepare stays RGB; counted so the caller can say so.
        let rgbImages = 0;
        const usedSpots = new Set<SpotInk>();
        if (cmyk) {
            const images = await prepareCmykImages(prepared, cmyk.engine);
            installCmykColors(pdf, cmyk.engine, cmyk.exact, cmyk.spots, usedSpots);
            installCmykImages(pdf, jsPDF.API, images, () => { rgbImages++; });
        }

        for (let i = 0; i < regions.length; i++) {
            const r = regions[i];
            if (i > 0) pdf.addPage([r.width, r.height], r.width >= r.height ? 'landscape' : 'portrait');
            const bg = r.background ? cssColorToHex(r.background) : null;
            if (bg) {
                pdf.setFillColor(bg);
                pdf.rect(0, 0, r.width, r.height, 'F');
            }
            const page = pageSvg(prepared, originX, originY, r);
            host.appendChild(page);
            try {
                await svg2pdf(page, pdf, { x: 0, y: 0, width: r.width, height: r.height });
            } finally {
                page.remove();
            }
        }
        let bytes: Uint8Array = new Uint8Array(pdf.output('arraybuffer'));
        if (cmyk) bytes = await convertShadingsToCmyk(bytes, cmyk.engine, cmyk.exact, usedSpots);
        if (cmyk?.pdfx) {
            if (rgbImages > 0) throw new Error('PDF/X: an image could not be converted to CMYK');
            const { applyPdfX4 } = await import('./pdf-x');
            bytes = await applyPdfX4(bytes, {
                profile: cmyk.engine.profile, profileBytes: cmyk.engine.profileBytes,
                title: cmyk.pdfx.title, bleedPt: cmyk.pdfx.bleedPt,
            });
        }
        return { bytes, substitutedFonts, rgbImages };
    } finally {
        host.remove();
    }
};
