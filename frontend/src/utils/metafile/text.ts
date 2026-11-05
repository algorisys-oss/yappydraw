/**
 * Text records: the font (LOGFONT), the text string decoded from its character set, and the
 * neutral {@link Text} item. The reader knows no fonts, so measuring, alignment against the font's
 * metrics and glyph drawing are left to the renderer (svg.ts). Ported from DeckCraft's
 * `crates/metafile/src/text.rs` (MIT/Apache).
 */

/** A font chosen by a CREATEFONTINDIRECT record (MS-WMF 2.2.1.2 Font, MS-EMF 2.2.13 LogFont). */
export interface Font {
    /** The face name the file asks for ("Arial", "Wingdings"); may be empty. */
    family: string;
    /** LOGFONT height in text units: negative is the em height, positive the cell height (ascent plus descent), 0 the default. */
    height: number;
    /** Average character width in text units; 0 keeps the font's own proportions. */
    width: number;
    /** 100..900 (400 regular, 700 bold); 0 is the default weight. */
    weight: number;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    /** LOGFONT character set (0 ANSI, 2 SYMBOL, 238 EASTEUROPE…). */
    charset: number;
}

export const defaultFont = (): Font => ({ family: '', height: 0, width: 0, weight: 0, italic: false, underline: false, strike: false, charset: 0 });

/** SYMBOL_CHARSET: byte codes are the font's own symbol codes. */
export const SYMBOL_CHARSET = 2;

/** Where the reference point sits on the string horizontally. */
export type HAlign = 'left' | 'center' | 'right';
/** Where the reference point sits vertically: the top of the character cell, the baseline or the bottom of the cell. */
export type VAlign = 'top' | 'baseline' | 'bottom';

/** One string drawn by EXTTEXTOUT, TEXTOUT or SMALLTEXTOUT. */
export interface Text {
    /**
     * Text space to picture space as `[a, b, c, d, e, f]` (`x' = a·x + c·y + e`, `y' = b·x + d·y + f`,
     * SVG's matrix order). Text space has x along the baseline and y down, in the metafile's logical
     * units, with the reference point at the origin. Escapement and the mapping are folded in; glyphs
     * are never mirrored.
     */
    transform: number[];
    text: string;
    /** Advance after each character (code point) of `text`, in text units. Empty: the font's own advances. */
    dx: number[];
    font: Font;
    color: Rgba8;
    /** Colour filled behind the character cells (OPAQUE background mode); null when transparent. */
    background: Rgba8 | null;
    hAlign: HAlign;
    vAlign: VAlign;
    /** Clip rectangle `[x0, y0, x1, y1]` in picture units (ETO_CLIPPED). */
    clip: [number, number, number, number] | null;
    /** Clip region from the device context, in picture units. null is the default clip. */
    region: [number, number, number, number][] | null;
}

export type Rgba8 = [number, number, number, number];

/** TA_UPDATECP: the string starts at the current position, which moves past it. */
export const TA_UPDATECP = 0x0001;
/** ETO_OPAQUE fills the rectangle with the background colour; ETO_CLIPPED clips the text to it. */
export const ETO_OPAQUE = 0x0002;
export const ETO_CLIPPED = 0x0004;
/** The string holds glyph indices, not characters (drawn only when the font matches). */
export const ETO_GLYPH_INDEX = 0x0010;
/** The dx array holds (dx, dy) pairs. */
export const ETO_PDY = 0x2000;
/** Longest string kept from one record. */
export const MAX_CHARS = 16_384;

/** Horizontal and vertical alignment from a TA_* word (vertical 0 top, 8 bottom, 24 baseline; horizontal 0 left, 2 right, 6 center). */
export function align(ta: number): [HAlign, VAlign] {
    const h: HAlign = (ta & 0x06) === 6 ? 'center' : (ta & 0x06) === 2 ? 'right' : 'left';
    const v: VAlign = (ta & 0x18) === 0x18 ? 'baseline' : (ta & 0x18) === 0x08 ? 'bottom' : 'top';
    return [h, v];
}

/**
 * Decodes 8-bit text in `charset` to one character per byte, and merges `dx` to match: a
 * double-byte character set's lead and trail bytes become one blank (its glyphs are not decoded)
 * whose advance is the sum of both. `dx` may be empty.
 */
export function decodeBytes(bytes: Uint8Array, charset: number, dx: number[]): [string, number[]] {
    let s = '';
    const outDx: number[] = [];
    const dbcs = [128, 129, 130, 134, 136].includes(charset);
    let i = 0;
    while (i < bytes.length) {
        const b = bytes[i];
        const n = dbcs && b >= 0x81 && i + 1 < bytes.length ? 2 : 1;
        s += n === 2 ? ' ' : byteChar(b, charset);
        if (dx.length) {
            let sum = 0;
            for (let k = i; k < i + n; k++) if (k < dx.length) sum += dx[k];
            outDx.push(sum);
        }
        i += n;
    }
    return [s, outDx];
}

/** UTF-16 text to a string with one dx entry per code point: a surrogate pair takes the sum of its two advances. Unpaired surrogates become U+FFFD. */
export function decodeUtf16(units: number[], dx: number[]): [string, number[]] {
    let s = '';
    const outDx: number[] = [];
    let i = 0;
    while (i < units.length) {
        const u = units[i];
        let n = 1;
        let cp = u;
        if (u >= 0xd800 && u <= 0xdbff && i + 1 < units.length && units[i + 1] >= 0xdc00 && units[i + 1] <= 0xdfff) {
            cp = 0x10000 + ((u - 0xd800) << 10) + (units[i + 1] - 0xdc00);
            n = 2;
        } else if (u >= 0xd800 && u <= 0xdfff) {
            cp = 0xfffd;
        }
        s += String.fromCodePoint(cp);
        if (dx.length) {
            let sum = 0;
            for (let k = i; k < i + n; k++) if (k < dx.length) sum += dx[k];
            outDx.push(sum);
        }
        i += n;
    }
    return [s, outDx];
}

/** One byte in a single-byte Windows code page. Symbol fonts keep their codes in the private-use range (U+F000 + code). */
function byteChar(b: number, charset: number): string {
    if (b < 0x80 && charset !== SYMBOL_CHARSET) return String.fromCharCode(b);
    let cp: number;
    if (charset === SYMBOL_CHARSET) cp = 0xf000 | b;
    else if (charset === 238) cp = high(b, CP1250);
    else if (charset === 204) cp = high(b, CP1251);
    else cp = high(b, CP1252);
    return String.fromCodePoint(cp);
}

/** The code point of byte `b` (0x80..0xFF) from a table of the upper half; 0 entries are undefined bytes, drawn as U+FFFD. */
function high(b: number, table: number[]): number {
    const v = table[(b - 0x80) & 0xff];
    return v ? v : 0xfffd;
}

/** Windows-1252 (Western) 0x80..0xFF. */
const CP1252: number[] = (() => {
    const low = [
        0x20ac, 0, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0, 0x017d, 0, 0, 0x2018, 0x2019, 0x201c,
        0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0, 0x017e, 0x0178,
    ];
    return Array.from({ length: 128 }, (_, i) => (i < 32 ? low[i] : 0x80 + i));
})();

/** Windows-1250 (Central European) 0x80..0xFF. */
const CP1250: number[] = [
    0x20ac, 0, 0x201a, 0, 0x201e, 0x2026, 0x2020, 0x2021, 0, 0x2030, 0x0160, 0x2039, 0x015a, 0x0164, 0x017d, 0x0179,
    0, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0, 0x2122, 0x0161, 0x203a, 0x015b, 0x0165, 0x017e, 0x017a,
    0x00a0, 0x02c7, 0x02d8, 0x0141, 0x00a4, 0x0104, 0x00a6, 0x00a7, 0x00a8, 0x00a9, 0x015e, 0x00ab, 0x00ac, 0x00ad, 0x00ae, 0x017b,
    0x00b0, 0x00b1, 0x02db, 0x0142, 0x00b4, 0x00b5, 0x00b6, 0x00b7, 0x00b8, 0x0105, 0x015f, 0x00bb, 0x013d, 0x02dd, 0x013e, 0x017c,
    0x0154, 0x00c1, 0x00c2, 0x0102, 0x00c4, 0x0139, 0x0106, 0x00c7, 0x010c, 0x00c9, 0x0118, 0x00cb, 0x011a, 0x00cd, 0x00ce, 0x010e,
    0x0110, 0x0143, 0x0147, 0x00d3, 0x00d4, 0x0150, 0x00d6, 0x00d7, 0x0158, 0x016e, 0x00da, 0x0170, 0x00dc, 0x00dd, 0x0162, 0x00df,
    0x0155, 0x00e1, 0x00e2, 0x0103, 0x00e4, 0x013a, 0x0107, 0x00e7, 0x010d, 0x00e9, 0x0119, 0x00eb, 0x011b, 0x00ed, 0x00ee, 0x010f,
    0x0111, 0x0144, 0x0148, 0x00f3, 0x00f4, 0x0151, 0x00f6, 0x00f7, 0x0159, 0x016f, 0x00fa, 0x0171, 0x00fc, 0x00fd, 0x0163, 0x02d9,
];

/** Windows-1251 (Cyrillic) 0x80..0xFF; 0xC0..0xFF are А..я in order. */
const CP1251: number[] = (() => {
    const low = [
        0x0402, 0x0403, 0x201a, 0x0453, 0x201e, 0x2026, 0x2020, 0x2021, 0x20ac, 0x2030, 0x0409, 0x2039, 0x040a, 0x040c, 0x040b, 0x040f,
        0x0452, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0, 0x2122, 0x0459, 0x203a, 0x045a, 0x045c, 0x045b, 0x045f,
        0x00a0, 0x040e, 0x045e, 0x0408, 0x00a4, 0x0490, 0x00a6, 0x00a7, 0x0401, 0x00a9, 0x0404, 0x00ab, 0x00ac, 0x00ad, 0x00ae, 0x0407,
        0x00b0, 0x00b1, 0x0406, 0x0456, 0x0491, 0x00b5, 0x00b6, 0x00b7, 0x0451, 0x2116, 0x0454, 0x00bb, 0x0458, 0x0405, 0x0455, 0x0457,
    ];
    return Array.from({ length: 128 }, (_, i) => (i < 64 ? low[i] : 0x0410 + (i - 64)));
})();
