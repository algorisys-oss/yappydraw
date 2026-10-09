/**
 * CMYK output for the vector PDF (docs/cmyk-print-plan.md, P3).
 *
 * svg2pdf.js draws everything through one jsPDF instance, so CMYK is applied at three seams:
 *
 *   1. **Vector colours.** `setFillColor` / `setDrawColor` / `setTextColor` are wrapped on the
 *      instance: an RGB call becomes the 4-argument DeviceCMYK form — a swatch's exact `cmyk`
 *      when the colour is a swatch's, the ICC conversion otherwise.
 *   2. **Images.** Every bitmap in the SVG is converted before rendering (decoding is async;
 *      svg2pdf's `addImage` call is not), then `addImage` is wrapped to place the CMYK version.
 *   3. **Gradients.** jsPDF's shading writer is hard-wired to DeviceRGB, so the finished file is
 *      patched (utils/pdf-rewrite): each shading's RGB sample function is decoded, its samples
 *      converted, and the shading switched to DeviceCMYK.
 */
import type { jsPDF as JsPdf } from 'jspdf';
import type { Cmyk, ColorEngine, Rgb } from './color-management';
import { parseRgb } from './color-management';
import { PdfFile, decodeStream, deflate, fromLatin1, toLatin1 } from './pdf-rewrite';

/** Exact CMYK for a colour that came from a swatch, if any. Keys are lower-case `#rrggbb`. */
export type ExactCmyk = Map<string, Cmyk>;

const hexKey = (rgb: Rgb) => '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');

/** The swatches that carry an exact `cmyk`, keyed by their on-screen colour. */
export function exactCmykFromSwatches(swatches: { color: string; cmyk?: Cmyk }[]): ExactCmyk {
    const m: ExactCmyk = new Map();
    for (const sw of swatches) {
        const rgb = sw.cmyk && parseRgb(sw.color);
        if (rgb && !m.has(hexKey(rgb))) m.set(hexKey(rgb), sw.cmyk!);
    }
    return m;
}

/** RGB → CMYK for the export: exact swatch value first, ICC conversion second. */
export const cmykFor = (engine: ColorEngine, exact: ExactCmyk, rgb: Rgb): Cmyk =>
    exact.get(hexKey(rgb)) ?? engine.rgbToCmyk(rgb);

/**
 * The RGB a jsPDF colour call names, or null when it is already CMYK (4 numbers) or something
 * we don't recognise. jsPDF's forms: (r, g, b) 0–255, (gray), ('#rrggbb'), (c, m, y, k).
 */
export function rgbFromColorArgs(args: unknown[]): Rgb | null {
    const nums = args.filter(a => typeof a === 'number') as number[];
    if (args.length >= 4 && typeof args[3] === 'number') return null; // already CMYK
    if (typeof args[0] === 'string') return parseRgb(args[0]);
    if (nums.length >= 3 && typeof args[3] !== 'number') return [nums[0], nums[1], nums[2]].map(v => Math.round(v)) as Rgb;
    if (nums.length === 1) return [nums[0], nums[0], nums[0]].map(v => Math.round(v)) as Rgb;
    return null;
}

// ── Spot inks (P4) ────────────────────────────────────────────────────────────────

/** A spot ink as the PDF needs it: plate name, CMYK alternate, and its resource name. */
export interface SpotInk { name: string; cmyk: Cmyk; res: string }
/** Spot inks keyed by the swatch's on-screen colour (lower-case `#rrggbb`). */
export type SpotMap = Map<string, SpotInk>;

/**
 * The spot-ink swatches. Two swatches with the same ink name share one plate (one resource), so
 * a document can't accidentally separate "PANTONE 186 C" onto two plates.
 */
export function spotsFromSwatches(swatches: { color: string; cmyk?: Cmyk; spot?: { name: string } }[]): SpotMap {
    const m: SpotMap = new Map();
    const byName = new Map<string, SpotInk>();
    for (const sw of swatches) {
        const rgb = sw.spot?.name && sw.cmyk ? parseRgb(sw.color) : null;
        if (!rgb) continue;
        const name = sw.spot!.name.trim();
        let ink = byName.get(name);
        if (!ink) { ink = { name, cmyk: sw.cmyk!, res: `YDSpot${byName.size}` }; byName.set(name, ink); }
        if (!m.has(hexKey(rgb))) m.set(hexKey(rgb), ink);
    }
    return m;
}

/**
 * A string as a PDF name object (without the leading `/`): UTF-8, with every byte outside the
 * printable range — and the delimiters `( ) < > [ ] { } / %` and `#` itself — written as `#xx`.
 * "PANTONE 186 C" → `PANTONE#20186#20C`.
 */
export function pdfName(s: string): string {
    let out = '';
    for (const b of new TextEncoder().encode(s)) {
        const ch = String.fromCharCode(b);
        out += b < 0x21 || b > 0x7e || '()<>[]{}/%#'.includes(ch) ? '#' + b.toString(16).padStart(2, '0') : ch;
    }
    return out;
}

/** The `/Separation` colour-space array for a spot ink: full tint = its CMYK alternate. */
export const separationArray = (ink: SpotInk): string =>
    `[/Separation /${pdfName(ink.name)} /DeviceCMYK << /FunctionType 2 /Domain [0 1] /C0 [0 0 0 0] /C1 [${ink.cmyk.map(v => +(v / 100).toFixed(4)).join(' ')}] /N 1 >>]`;

/**
 * Wrap the instance's colour setters so every RGB colour is written as DeviceCMYK — or, for a
 * spot-ink swatch's colour, as 100 % of that ink's Separation (fills and strokes). Text keeps
 * the spot's CMYK alternate: jsPDF writes text colour itself inside the text object, with no
 * seam for a Separation (documented limit).
 */
export function installCmykColors(pdf: JsPdf, engine: ColorEngine, exact: ExactCmyk, spots: SpotMap = new Map(), used?: Set<SpotInk>): void {
    // Fill selects the colour space with `cs` and the tint with `scn`; stroke with `CS` / `SCN`.
    const spotOps: Record<string, string> = { setFillColor: 'cs 1 scn', setDrawColor: 'CS 1 SCN' };
    // In jsPDF's runtime API, missing from its type declarations.
    const write = (pdf.internal as unknown as { write(s: string): void }).write;
    for (const name of ['setFillColor', 'setDrawColor', 'setTextColor'] as const) {
        const original = (pdf as any)[name].bind(pdf);
        (pdf as any)[name] = (...args: unknown[]) => {
            const rgb = rgbFromColorArgs(args);
            if (!rgb) return original(...(args as []));
            const ink = name !== 'setTextColor' ? spots.get(hexKey(rgb)) : undefined;
            if (ink) {
                used?.add(ink);
                const [cs, , scn] = spotOps[name].split(' ');
                write(`/${ink.res} ${cs} 1 ${scn}`);
                return pdf;
            }
            const [c, m, y, k] = cmykFor(engine, exact, rgb);
            return original(c / 100, m / 100, y / 100, k / 100);
        };
    }
}

// ── Images ─────────────────────────────────────────────────────────────────────────

interface PreparedImage {
    width: number;
    height: number;
    /** Flate-compressed, INVERTED CMYK — jsPDF writes `/Decode [1 0 1 0 1 0 1 0]` for DeviceCMYK. */
    data: string;
    /** Flate-compressed alpha, or null when opaque. */
    sMask: string | null;
}

/** Converted images, keyed by a hash of the image bytes (see `bytesKey`). */
export type PreparedImages = Map<string, PreparedImage>;

const MARK = [0x59, 0x44, 0x43, 0x4b]; // 'YDCK' — matches no image signature jsPDF knows
const FORMAT = 'YDCMYK';
const pending = new Map<string, PreparedImage>();

/** FNV-1a over a binary string — the image identity svg2pdf and we can both compute. */
const bytesKey = (bin: string): string => {
    let h = 0x811c9dc5;
    for (let i = 0; i < bin.length; i++) { h ^= bin.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return `${(h >>> 0).toString(36)}-${bin.length}`;
};

const dataUrlBinary = (url: string): string | null => {
    const m = /^data:[^;,]*(;base64)?,(.*)$/s.exec(url);
    if (!m) return null;
    try { return m[1] ? atob(m[2]) : decodeURIComponent(m[2]); } catch { return null; }
};

/**
 * Decode and convert every raster `<image>` in the SVG. SVG images are left alone — svg2pdf
 * renders those as vectors, through the colour setters.
 */
export async function prepareCmykImages(svg: SVGSVGElement, engine: ColorEngine): Promise<PreparedImages> {
    const out: PreparedImages = new Map();
    const hrefs = new Set<string>();
    svg.querySelectorAll('image').forEach(im => {
        const h = im.getAttribute('href') ?? im.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
        if (h && h.startsWith('data:image/') && !h.startsWith('data:image/svg')) hrefs.add(h);
    });
    await Promise.all([...hrefs].map(async href => {
        const bin = dataUrlBinary(href);
        if (!bin) return;
        const key = bytesKey(bin);
        if (out.has(key)) return;
        const img = new Image();
        img.src = href;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        if (!ctx || !c.width || !c.height) return;
        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(0, 0, c.width, c.height);
        const { cmyk, alpha } = engine.imageToCmyk(data);
        const inverted = new Uint8Array(cmyk.length);
        for (let i = 0; i < cmyk.length; i++) inverted[i] = 255 - cmyk[i];
        out.set(key, {
            width: c.width,
            height: c.height,
            data: toLatin1(await deflate(inverted)),
            sMask: alpha ? toLatin1(await deflate(alpha)) : null,
        });
    }));
    return out;
}


/** Wrap `addImage` so the bitmaps svg2pdf places are the prepared CMYK versions. */
export function installCmykImages(pdf: JsPdf, jsPdfApi: any, images: PreparedImages, onMissing: () => void): void {
    {
        // jsPDF dispatches `addImage(…, format)` to `this['process' + FORMAT]`, after checking
        // `jsPDF.API` has it. The API is copied onto each instance at construction, so an
        // instance made before this ran needs it too — set both. The image "data" handed to it
        // is just MARK + key; the converted pixels come from `pending`.
        const processor = function (bytes: Uint8Array, index: number, alias: string) {
            const key = toLatin1(bytes.subarray(MARK.length));
            const img = pending.get(key);
            if (!img) throw new Error('CMYK image not prepared');
            return {
                alias, index,
                data: img.data,
                width: img.width,
                height: img.height,
                colorSpace: 'DeviceCMYK',
                bitsPerComponent: 8,
                // Already deflated: jsPDF strips the document filter for images, so without this
                // every converted bitmap would be stored raw (4 bytes a pixel).
                filter: 'FlateDecode',
                // jsPDF writes the SMask's DecodeParms from `predictor` whenever `filter` is set;
                // 1 is "no prediction", which is what the data is.
                predictor: 1,
                ...(img.sMask ? { sMask: img.sMask } : {}),
            };
        };
        jsPdfApi[`process${FORMAT}`] = processor;
        (pdf as any)[`process${FORMAT}`] = processor;
    }
    const original = pdf.addImage.bind(pdf);
    (pdf as any).addImage = (...args: any[]) => {
        const src = args[0];
        const bin = typeof src === 'string' ? dataUrlBinary(src) : null;
        const key = bin ? bytesKey(bin) : null;
        const img = key ? images.get(key) : undefined;
        if (!img || !key) {
            onMissing();
            return (original as (...a: any[]) => any)(...args);
        }
        pending.set(key, img);
        const marker = new Uint8Array([...MARK, ...fromLatin1(key)]);
        // svg2pdf's form: addImage(dataUri, '', x, y, w, h).
        const [, , x, y, w, h] = args;
        return original(marker, FORMAT, x, y, w, h, `cmyk-${key}`);
    };
}

// ── Gradients (post-pass) ──────────────────────────────────────────────────────────

/**
 * Switch every DeviceRGB shading in the finished PDF to DeviceCMYK, converting its sample
 * function. Samples are converted one by one, so the gradient is interpolated in RGB (as on
 * screen) and only then separated — what the canvas shows is what is separated.
 */
export async function convertShadingsToCmyk(bytes: Uint8Array, engine: ColorEngine, exact: ExactCmyk, spots: Iterable<SpotInk> = []): Promise<Uint8Array> {
    const file = new PdfFile(bytes);
    let changed = addSeparations(file, [...spots]);
    for (const num of file.objectNumbers()) {
        const obj = file.get(num);
        if (!obj || obj.stream || !/\/ShadingType\s+\d/.test(obj.dict) || !/\/ColorSpace\s*\/DeviceRGB/.test(obj.dict)) continue;
        const fnRef = /\/Function\s+(\d+)\s+0\s+R/.exec(obj.dict);
        const fn = fnRef ? file.get(parseInt(fnRef[1], 10)) : null;
        if (!fn || !fn.stream || !/\/FunctionType\s+0/.test(fn.dict)) throw new Error(`PDF: shading ${num} has no sampled function`);
        const samples = await decodeStream(fn.dict, fn.stream);
        const n = Math.floor(samples.length / 3);
        const out = new Uint8Array(n * 4);
        for (let i = 0; i < n; i++) {
            const cmyk = cmykFor(engine, exact, [samples[i * 3], samples[i * 3 + 1], samples[i * 3 + 2]]);
            for (let j = 0; j < 4; j++) out[i * 4 + j] = Math.round(cmyk[j] * 2.55);
        }
        const size = /\/Size\s*\[[^\]]*\]/.exec(fn.dict)?.[0] ?? `/Size [${n}]`;
        file.set(fn.num,
            `<<\n/FunctionType 0\n/Domain [0.0 1.0]\n${size}\n/BitsPerSample 8\n/Range [0 1 0 1 0 1 0 1]\n/Decode [0 1 0 1 0 1 0 1]\n/Filter /FlateDecode\n>>`,
            await deflate(out));
        file.set(num, obj.dict.replace(/\/ColorSpace\s*\/DeviceRGB/, '/ColorSpace /DeviceCMYK'));
        changed = true;
    }
    return changed ? file.toBytes() : bytes;
}

/**
 * Declare the spot inks in every resource dictionary (pages and the form XObjects svg2pdf uses),
 * so `/YDSpotN cs` resolves wherever it was written. jsPDF writes all of its resource
 * dictionaries through one function, and every one starts with `/ProcSet`.
 */
function addSeparations(file: PdfFile, inks: SpotInk[]): boolean {
    if (inks.length === 0) return false;
    const entries = inks.map(ink => `/${ink.res} ${separationArray(ink)}`).join('\n');
    let patched = 0;
    for (const num of file.objectNumbers()) {
        const obj = file.get(num);
        if (!obj || obj.stream || !/^<<\s*\/ProcSet/.test(obj.dict)) continue;
        if (/\/ColorSpace/.test(obj.dict)) throw new Error(`PDF: resource dictionary ${num} already has a /ColorSpace`);
        file.set(num, obj.dict.replace(/>>\s*$/, `/ColorSpace <<\n${entries}\n>>\n>>`));
        patched++;
    }
    if (patched === 0) throw new Error('PDF: no resource dictionary to declare the spot inks in');
    return true;
}
