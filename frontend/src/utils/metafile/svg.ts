/**
 * A parsed metafile Picture as an SVG document: paths stay vectors, bitmaps and brush tiles are
 * embedded PNGs (or the original PNG/JPEG/GIF for EMF+ images), text stays text. This is what a
 * PowerPoint EMF/WMF picture becomes on import, so it draws in both render styles and every export
 * that can draw an SVG image.
 *
 * Text follows DeckCraft's renderer (`crates/render/src/metafile.rs`): LOGFONT height negative is
 * the em, positive the cell (ascent + descent); the file's dx array places each character; the
 * vertical alignment is against the Windows ascent/descent. We have no font tables here, so Arial's
 * metrics stand in (usWinAscent 1854, usWinDescent 434, xAvgCharWidth 904 per 2048).
 */
import type { Item, Picture, PicRegion, Seg, Tile } from './index';
import type { Text, Rgba8 } from './text';
import { isEncoded, type Encoded } from './encoded';
import type { Rgba } from './dib';
import { encodePng, toBase64 } from './png';

const ASC = 1854 / 2048;
const DESC = 434 / 2048;
const AVG_CHAR = 904 / 2048;
/** Size of text whose font gives no height (LOGFONT height 0), in text units. */
const DEFAULT_EM = 12;

const n = (v: number) => {
    const r = Math.round(v * 1000) / 1000;
    return Object.is(r, -0) ? '0' : String(r);
};
/** Escapes text content and double-quoted attribute values, dropping characters XML 1.0 forbids (metafile strings can carry NULs and control codes). */
const esc = (s: string) => s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
    .replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const rgb = (c: Rgba8) => `rgb(${c[0]},${c[1]},${c[2]})`;
const alpha = (c: Rgba8, attr: string) => (c[3] < 255 ? ` ${attr}="${n(c[3] / 255)}"` : '');

function pathD(segs: Seg[]): string {
    let d = '';
    for (const s of segs) {
        if (s.k === 'M') d += `M${n(s.x)} ${n(s.y)}`;
        else if (s.k === 'L') d += `L${n(s.x)} ${n(s.y)}`;
        else if (s.k === 'C') d += `C${n(s.x1)} ${n(s.y1)} ${n(s.x2)} ${n(s.y2)} ${n(s.x)} ${n(s.y)}`;
        else d += 'Z';
    }
    return d;
}

export interface SvgOptions {
    /** Width and height attributes of the root element; default the picture size in CSS px (picture units read as points). */
    width?: number;
    height?: number;
}

/** The picture as a standalone SVG document. */
export function pictureToSvg(pic: Picture, opts: SvgOptions = {}): string {
    const w = opts.width ?? (pic.width * 96) / 72;
    const h = opts.height ?? (pic.height * 96) / 72;
    const defs: string[] = [];
    const body: string[] = [];
    // GDI makes a new tile for every hatched fill, so tiles are shared by content, not identity.
    const ids = { clip: new Map<string, string>(), tile: new Map<Tile, string>(), tileByContent: new Map<string, string>(), next: 0 };
    const id = (p: string) => `${p}${ids.next++}`;

    const regionClip = (region: PicRegion): string | null => {
        if (!region) return null;
        const key = JSON.stringify(region);
        let cid = ids.clip.get(key);
        if (!cid) {
            cid = id('r');
            ids.clip.set(key, cid);
            defs.push(`<clipPath id="${cid}">${region.map(([x0, y0, x1, y1]) => `<rect x="${n(x0)}" y="${n(y0)}" width="${n(x1 - x0)}" height="${n(y1 - y0)}"/>`).join('')}</clipPath>`);
        }
        return cid;
    };
    const wrap = (el: string, region: PicRegion) => {
        if (region && region.length === 0) return '';
        const cid = regionClip(region);
        return cid ? `<g clip-path="url(#${cid})">${el}</g>` : el;
    };
    const tilePattern = (t: Tile): string => {
        let pid = ids.tile.get(t);
        if (!pid) {
            const tw = t.width * t.cell[0], th = t.height * t.cell[1];
            const href = `data:image/png;base64,${toBase64(encodePng(t.width, t.height, t.rgba))}`;
            const key = `${n(t.origin[0])},${n(t.origin[1])},${n(tw)},${n(th)},${href}`;
            pid = ids.tileByContent.get(key);
            if (pid) { ids.tile.set(t, pid); return pid; }
            pid = id('p');
            ids.tile.set(t, pid);
            ids.tileByContent.set(key, pid);
            defs.push(`<pattern id="${pid}" patternUnits="userSpaceOnUse" x="${n(t.origin[0])}" y="${n(t.origin[1])}" width="${n(tw)}" height="${n(th)}"><image href="${href}" width="${n(tw)}" height="${n(th)}" preserveAspectRatio="none" style="image-rendering:pixelated"/></pattern>`);
        }
        return pid;
    };

    for (const item of pic.items) body.push(itemSvg(item, wrap, tilePattern, id, defs));

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${n(w)}" height="${n(h)}" viewBox="0 0 ${n(pic.width)} ${n(pic.height)}" preserveAspectRatio="none">`
        + (defs.length ? `<defs>${defs.join('')}</defs>` : '')
        + body.join('')
        + '</svg>';
}

function itemSvg(item: Item, wrap: (el: string, r: PicRegion) => string, tilePattern: (t: Tile) => string, id: (p: string) => string, defs: string[]): string {
    switch (item.kind) {
        case 'path': {
            const fill = item.fill ? `fill="${rgb(item.fill)}"${alpha(item.fill, 'fill-opacity')}` : 'fill="none"';
            let stroke = '';
            if (item.stroke) {
                const [c, sw] = item.stroke;
                // A cosmetic pen (width 0) is a one-pixel hairline at any scale.
                stroke = sw > 0
                    ? ` stroke="${rgb(c)}"${alpha(c, 'stroke-opacity')} stroke-width="${n(sw)}" stroke-linejoin="round" stroke-linecap="round"`
                    : ` stroke="${rgb(c)}"${alpha(c, 'stroke-opacity')} stroke-width="1" vector-effect="non-scaling-stroke"`;
            }
            const rule = item.evenOdd && item.fill ? ' fill-rule="evenodd"' : '';
            return wrap(`<path d="${pathD(item.segs)}" ${fill}${rule}${stroke}/>`, item.region);
        }
        case 'pattern':
            return wrap(`<path d="${pathD(item.segs)}" fill="url(#${tilePattern(item.tile)})"${item.evenOdd ? ' fill-rule="evenodd"' : ''}/>`, item.region);
        case 'bitmap':
            return wrap(bitmapSvg(item.rect, item.img), item.region);
        case 'text':
            return wrap(textSvg(item.text, id, defs), item.text.region);
    }
}

function bitmapSvg([x, y, w, h]: [number, number, number, number], img: Rgba | Encoded): string {
    if (w <= 0 || h <= 0) return '';
    if (!isEncoded(img)) {
        if (img.w < 1 || img.h < 1 || img.px.length !== img.w * img.h * 4) return '';
        const href = `data:image/png;base64,${toBase64(encodePng(img.w, img.h, img.px))}`;
        // Small bitmaps stretched large (icons, 8×8 masks) look like GDI's when not smoothed.
        const pixelated = w / img.w > 3 || h / img.h > 3 ? ' style="image-rendering:pixelated"' : '';
        return `<image href="${href}" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" preserveAspectRatio="none"${pixelated}/>`;
    }
    const href = `data:${img.mime};base64,${toBase64(img.bytes)}`;
    const [cx, cy, cw, ch] = img.crop ?? [0, 0, img.w, img.h];
    const fx = !!img.flip?.[0], fy = !!img.flip?.[1];
    // Mirrored inside the crop's own coordinates, so the crop window stays where it is.
    const flip = fx || fy ? ` transform="translate(${n(fx ? 2 * cx + cw : 0)} ${n(fy ? 2 * cy + ch : 0)}) scale(${fx ? -1 : 1} ${fy ? -1 : 1})"` : '';
    return `<svg x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" viewBox="${n(cx)} ${n(cy)} ${n(cw)} ${n(ch)}" preserveAspectRatio="none" overflow="hidden">`
        + `<g${flip}><image href="${href}" width="${img.w}" height="${img.h}" preserveAspectRatio="none"/></g></svg>`;
}

/** A generic family to fall back on when the metafile's face isn't installed. */
function generic(family: string): string {
    if (/courier|consolas|mono|lucida console|fixedsys|terminal/i.test(family)) return 'monospace';
    if (/times|roman|georgia|garamond|cambria|book antiqua|palatino|serif/i.test(family) && !/sans/i.test(family)) return 'serif';
    return 'sans-serif';
}

/** A rough advance in ems for a character, when the file gives no dx array (for alignment and the background box). */
function charEm(c: string): number {
    if (" ilj.,:;'!|Iftr".includes(c)) return 0.28;
    if ('mwMW'.includes(c)) return 0.83;
    if (/[A-Z0-9]/.test(c)) return 0.64;
    if ((c.codePointAt(0) ?? 0) >= 0x2e80) return 1;
    return 0.53;
}

function textSvg(t: Text, id: (p: string) => string, defs: string[]): string {
    const f = t.font;
    const family = f.family.trim() || 'Arial';
    const em = f.height < 0 ? -f.height : f.height > 0 ? f.height / (ASC + DESC) : DEFAULT_EM;
    if (!(em > 0) || !Number.isFinite(em)) return '';
    const chars = [...t.text].map(c => symbolChar(family, c));
    if (!chars.length) return '';
    const useDx = t.dx.length === chars.length && t.dx.length > 0;
    let width: number;
    let xs: number[] | null = null;
    let xScale = 1;
    if (useDx) {
        xs = [];
        let x = 0;
        for (const d of t.dx) { xs.push(x); x += d; }
        width = x;
    } else {
        width = chars.reduce((a, c) => a + charEm(c) * em, 0);
        if (f.width > 0) {
            // A LOGFONT width narrows or widens the font against its average character width.
            xScale = Math.min(20, Math.max(0.05, f.width / (AVG_CHAR * em)));
            width *= xScale;
        }
    }
    const x0 = t.hAlign === 'left' ? 0 : t.hAlign === 'center' ? -width / 2 : -width;
    const a = ASC * em, d = DESC * em;
    const base = t.vAlign === 'baseline' ? 0 : t.vAlign === 'top' ? a : -d;
    const [ta, tb, tc, td, te, tf] = t.transform;
    let out = '';
    if (t.background && width > 0) {
        out += `<rect x="${n(x0)}" y="${n(base - a)}" width="${n(width)}" height="${n(a + d)}" fill="${rgb(t.background)}"${alpha(t.background, 'fill-opacity')}/>`;
    }
    const deco = [f.underline && 'underline', f.strike && 'line-through'].filter(Boolean).join(' ');
    const attrs = [
        `font-family="${esc(`'${family.replace(/'/g, '')}', ${generic(family)}`)}"`,
        `font-size="${n(em)}"`,
        f.weight >= 600 ? 'font-weight="bold"' : '',
        f.italic ? 'font-style="italic"' : '',
        deco ? `text-decoration="${deco}"` : '',
        `fill="${rgb(t.color)}"${alpha(t.color, 'fill-opacity')}`,
        'xml:space="preserve"',
    ].filter(Boolean).join(' ');
    if (xs) {
        // Each character at the file's own position.
        const pos = xs.map(x => n(x0 + x)).join(' ');
        out += `<text x="${pos}" y="${n(base)}" ${attrs}>${esc(chars.join(''))}</text>`;
    } else {
        const anchor = t.hAlign === 'center' ? 'middle' : t.hAlign === 'right' ? 'end' : 'start';
        const inner = `<text x="0" y="${n(base)}" text-anchor="${anchor}" ${attrs}>${esc(chars.join(''))}</text>`;
        out += xScale !== 1 ? `<g transform="scale(${n(xScale)} 1)">${inner}</g>` : inner;
    }
    let el = `<g transform="matrix(${[ta, tb, tc, td, te, tf].map(n).join(' ')})">${out}</g>`;
    if (t.clip) {
        const cid = id('c');
        const [x0c, y0c, x1c, y1c] = t.clip;
        defs.push(`<clipPath id="${cid}"><rect x="${n(x0c)}" y="${n(y0c)}" width="${n(x1c - x0c)}" height="${n(y1c - y0c)}"/></clipPath>`);
        el = `<g clip-path="url(#${cid})">${el}</g>`;
    }
    return el;
}

/** Adobe Symbol encoding (the Symbol font) above ASCII letters, to Unicode. */
const SYMBOL: Record<number, number> = (() => {
    const m: Record<number, number> = {
        0x22: 0x2200, 0x24: 0x2203, 0x27: 0x220b, 0x2a: 0x2217, 0x2d: 0x2212, 0x40: 0x2245, 0x5c: 0x2234, 0x5e: 0x22a5, 0x7e: 0x223c,
        0xa1: 0x03d2, 0xa2: 0x2032, 0xa3: 0x2264, 0xa4: 0x2044, 0xa5: 0x221e, 0xa6: 0x0192, 0xa7: 0x2663, 0xa8: 0x2666, 0xa9: 0x2665, 0xaa: 0x2660,
        0xab: 0x2194, 0xac: 0x2190, 0xad: 0x2191, 0xae: 0x2192, 0xaf: 0x2193, 0xb0: 0x00b0, 0xb1: 0x00b1, 0xb2: 0x2033, 0xb3: 0x2265, 0xb4: 0x00d7,
        0xb5: 0x221d, 0xb6: 0x2202, 0xb7: 0x2022, 0xb8: 0x00f7, 0xb9: 0x2260, 0xba: 0x2261, 0xbb: 0x2248, 0xbc: 0x2026, 0xc0: 0x2135, 0xc1: 0x2111,
        0xc2: 0x211c, 0xc3: 0x2118, 0xc4: 0x2297, 0xc5: 0x2295, 0xc6: 0x2205, 0xc7: 0x2229, 0xc8: 0x222a, 0xc9: 0x2283, 0xca: 0x2287, 0xcb: 0x2284,
        0xcc: 0x2282, 0xcd: 0x2286, 0xce: 0x2208, 0xcf: 0x2209, 0xd0: 0x2220, 0xd1: 0x2207, 0xd2: 0x00ae, 0xd3: 0x00a9, 0xd4: 0x2122, 0xd5: 0x220f,
        0xd6: 0x221a, 0xd7: 0x22c5, 0xd8: 0x00ac, 0xd9: 0x2227, 0xda: 0x2228, 0xdb: 0x21d4, 0xdc: 0x21d0, 0xdd: 0x21d1, 0xde: 0x21d2, 0xdf: 0x21d3,
        0xe0: 0x25ca, 0xe1: 0x2329, 0xe5: 0x2211, 0xf1: 0x232a, 0xf2: 0x222b,
    };
    const upper = [0x391, 0x392, 0x3a7, 0x394, 0x395, 0x3a6, 0x393, 0x397, 0x399, 0x3d1, 0x39a, 0x39b, 0x39c, 0x39d, 0x39f, 0x3a0, 0x398, 0x3a1, 0x3a3, 0x3a4, 0x3a5, 0x3c2, 0x3a9, 0x39e, 0x3a8, 0x396];
    const lower = [0x3b1, 0x3b2, 0x3c7, 0x3b4, 0x3b5, 0x3c6, 0x3b3, 0x3b7, 0x3b9, 0x3d5, 0x3ba, 0x3bb, 0x3bc, 0x3bd, 0x3bf, 0x3c0, 0x3b8, 0x3c1, 0x3c3, 0x3c4, 0x3c5, 0x3d6, 0x3c9, 0x3be, 0x3c8, 0x3b6];
    upper.forEach((u, i) => { m[0x41 + i] = u; });
    lower.forEach((u, i) => { m[0x61 + i] = u; });
    return m;
})();

/** Wingdings codes seen in Office drawings (bullets, check marks, arrows, shapes). */
const WINGDINGS: Record<number, number> = {
    0x6c: 0x25cf, 0x6e: 0x25a0, 0x6f: 0x25a1, 0x71: 0x2751, 0x75: 0x25c6, 0x76: 0x2756, 0x77: 0x2b25, 0x9f: 0x2022, 0xa7: 0x25aa, 0xa8: 0x25fb,
    0xd8: 0x27a2, 0xe0: 0x2190, 0xe8: 0x2192, 0xe9: 0x2191, 0xea: 0x2193, 0xf0: 0x21e8, 0xfb: 0x2717, 0xfc: 0x2714, 0xfd: 0x2612, 0xfe: 0x2611,
    0x4a: 0x263a, 0x4c: 0x2639, 0x4e: 0x2620, 0x52: 0x263c, 0x54: 0x2744, 0x58: 0x2720, 0x5b: 0x262f, 0xab: 0x2605, 0xa1: 0x25cb, 0xa4: 0x25c9,
};

/**
 * A character as drawn: symbol fonts (Symbol, Wingdings) keep their codes, often in the private-use
 * alias U+F0xx, which mean something else in any other font. Map the ones with a Unicode twin; an
 * unknown Wingdings/Webdings code becomes a bullet rather than a stray letter.
 */
export function symbolChar(family: string, c: string): string {
    const f = family.toLowerCase();
    let code = c.codePointAt(0) ?? 0;
    const pua = code >= 0xf000 && code <= 0xf0ff;
    if (pua) code -= 0xf000;
    if (f === 'symbol') {
        const u = SYMBOL[code];
        if (u) return String.fromCodePoint(u);
        return pua ? String.fromCodePoint(code) : c;
    }
    if (f.startsWith('wingdings') || f.startsWith('webdings')) {
        if (code <= 0x20) return ' ';
        return String.fromCodePoint((f === 'wingdings' && WINGDINGS[code]) || 0x2022);
    }
    return pua ? String.fromCodePoint(code) : c;
}
