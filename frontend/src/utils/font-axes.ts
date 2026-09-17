/**
 * Variable fonts: which weights one font file can draw.
 *
 * A static font file is one style: `Montserrat-Bold.ttf` is Bold and nothing else. A variable
 * file carries a `wght` axis, so the single `Roboto-VariableFont_wght.ttf` Google Fonts hands
 * you is Thin through Black. Yappy used to register every file with a plain
 * `new FontFace(family, url)`, which declares the face as weight 400 only, so the browser
 * clamped every requested weight to Regular. The picker also parsed the file name as a
 * family (`Roboto Variable Font wdth,wght`) with one "Regular" style, leaving nowhere to pick
 * Thin or Bold (Anshika's review, Sep 2026).
 *
 * The weight range lives in the font's `fvar` table. It is read straight from the bytes here:
 * the table directory and one axis record is all that's needed, and it keeps opentype.js
 * (which Create Outlines loads lazily) out of the main bundle. TTF/OTF are read directly and
 * WOFF by inflating just the `fvar` table. WOFF2 is Brotli, which the browser won't
 * decompress for us, so for WOFF2 the file name is the fallback: Google's `VariableFont_…`
 * and the common `Family[wght]` convention both say "variable" without saying the range,
 * and the full 100–900 is assumed.
 */

const tag = (v: DataView, o: number) =>
    String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3));

/** 16.16 fixed-point → number. */
const fixed = (v: DataView, o: number) => v.getInt32(o) / 65536;

interface WeightAxis { min: number; max: number; default: number }

/** The `wght` axis of an `fvar` table, or null when it has none. */
function readWeightAxis(fvar: DataView): WeightAxis | null {
    if (fvar.byteLength < 16) return null;
    const axesOffset = fvar.getUint16(4);
    const axisCount = fvar.getUint16(8);
    const axisSize = fvar.getUint16(10);
    if (axisSize < 20) return null;
    for (let i = 0; i < axisCount; i++) {
        const o = axesOffset + i * axisSize;
        if (o + 20 > fvar.byteLength) return null;
        if (tag(fvar, o) !== 'wght') continue;
        const min = fixed(fvar, o + 4), def = fixed(fvar, o + 8), max = fixed(fvar, o + 12);
        if (![min, def, max].every(Number.isFinite) || min <= 0 || max < min) return null;
        return { min: Math.round(min), max: Math.round(max), default: Math.round(def) };
    }
    return null;
}

async function inflate(bytes: Uint8Array): Promise<ArrayBuffer | null> {
    if (typeof DecompressionStream === 'undefined') return null;
    try {
        const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate'));
        return await new Response(stream).arrayBuffer();
    } catch {
        return null;
    }
}

/**
 * The weight range a font file supports, from its `fvar` table. `null` means a static font,
 * or a format that can't be read here (WOFF2, a damaged file).
 */
export async function readFontWeightRange(buf: ArrayBuffer): Promise<[number, number] | null> {
    const axis = await readFontWeightAxis(buf);
    return axis ? [axis.min, axis.max] : null;
}

/**
 * The weight a variable file draws when nothing sets its axis: what a parser that ignores
 * variations (opentype.js, for Create Outlines) gets. Usually 400, not always.
 */
export async function readFontDefaultWeight(buf: ArrayBuffer): Promise<number | null> {
    return (await readFontWeightAxis(buf))?.default ?? null;
}

async function readFontWeightAxis(buf: ArrayBuffer): Promise<WeightAxis | null> {
    try {
        const v = new DataView(buf);
        if (buf.byteLength < 12) return null;
        const sig = tag(v, 0);

        if (sig === 'wOFF') {
            const numTables = v.getUint16(12);
            for (let i = 0; i < numTables; i++) {
                const e = 44 + i * 20;
                if (e + 20 > buf.byteLength) return null;
                if (tag(v, e) !== 'fvar') continue;
                const offset = v.getUint32(e + 4), compLength = v.getUint32(e + 8), origLength = v.getUint32(e + 12);
                if (offset + compLength > buf.byteLength) return null;
                const raw = new Uint8Array(buf, offset, compLength);
                const table = compLength < origLength ? await inflate(raw) : raw.slice().buffer;
                return table ? readWeightAxis(new DataView(table)) : null;
            }
            return null;
        }

        // TrueType (0x00010000 / 'true') or CFF-flavoured OpenType ('OTTO').
        if (sig !== 'OTTO' && sig !== 'true' && v.getUint32(0) !== 0x00010000) return null;
        const numTables = v.getUint16(4);
        for (let i = 0; i < numTables; i++) {
            const r = 12 + i * 16;
            if (r + 16 > buf.byteLength) return null;
            if (tag(v, r) !== 'fvar') continue;
            const offset = v.getUint32(r + 8), length = v.getUint32(r + 12);
            if (offset + length > buf.byteLength) return null;
            return readWeightAxis(new DataView(buf, offset, length));
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Does the file NAME say variable? Google Fonts: `Roboto-VariableFont_wght`,
 * `Roboto-Italic-VariableFont_wdth,wght`. Elsewhere: `Inter[wght]`, `Inter[slnt,wght]`.
 * Only a name that mentions the weight axis counts; `VariableFont_wdth` varies width, not
 * weight.
 */
export function nameSaysVariableWeight(name: string): boolean {
    const m = name.match(/VariableFont_([A-Za-z,]+)/i) ?? name.match(/\[([A-Za-z,]+)\]/);
    return !!m && m[1].toLowerCase().split(',').includes('wght');
}

/**
 * A variable font's file name with the variable markers removed, so the family reads as a
 * family: `Roboto-Italic-VariableFont_wdth,wght` → `Roboto-Italic`, `Inter[slnt,wght]` →
 * `Inter`. Static names come back unchanged.
 */
export function stripVariableMarkers(name: string): string {
    return name
        .replace(/[\s_-]*VariableFont(_[A-Za-z,]+)?/i, '')
        .replace(/\s*\[[A-Za-z,]+\]/, '')
        .trim() || name;
}

/** Decode a `data:` URL to bytes. */
export function dataUrlToBuffer(dataUrl: string): ArrayBuffer | null {
    const comma = dataUrl.indexOf(',');
    if (comma < 0) return null;
    try {
        const bin = atob(dataUrl.slice(comma + 1));
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return bytes.buffer;
    } catch {
        return null;
    }
}

/**
 * The weight range to register a font file with: from its `fvar` table when readable, else
 * 100–900 when its name says it varies weight, else null (a static font).
 */
export async function detectWeightRange(buf: ArrayBuffer | null, fileName: string): Promise<[number, number] | null> {
    const fromTable = buf ? await readFontWeightRange(buf) : null;
    if (fromTable) return fromTable;
    return nameSaysVariableWeight(fileName) ? [100, 900] : null;
}
