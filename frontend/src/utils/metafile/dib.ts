/**
 * Device-independent bitmaps. BITMAPINFOHEADER DIBs at 1/4/8/16/24/32 bpp with BI_RGB or
 * BI_BITFIELDS decode to RGBA8 rows, top-down. Compressed (RLE, JPEG, PNG) and V4/V5-only features
 * are not decoded. Ported from DeckCraft's `crates/metafile/src/dib.rs` (MIT/Apache).
 */
import { Bytes } from './bytes';
import { MAX_PIXELS } from './limits';

const BI_RGB = 0;
const BI_BITFIELDS = 3;
/** Most palette entries a DIB can carry (the colour table never exceeds 2^8). */
const MAX_PALETTE = 256;
const ROP_SRCAND = 0x0088_00c6;
const ROP_SRCPAINT = 0x00ee_0086;
const ROP_SRCINVERT = 0x0066_0046;

/** A decoded picture. `bottomUp` records the DIB's native row order, which source rectangles use. */
export interface Rgba {
    w: number;
    h: number;
    bottomUp: boolean;
    px: Uint8Array;
}

/** How a decoded bitmap combines with the destination. */
export type Blend =
    /** A raster operation (BITBLT, STRETCHDIB and friends). */
    | { kind: 'rop'; rop: number }
    /** EMR_ALPHABLEND: constant alpha (0..255), times the per-pixel alpha when `perPixel`. */
    | { kind: 'alpha'; constant: number; perPixel: boolean };

interface Header {
    w: number;
    h: number;
    topDown: boolean;
    bpp: number;
    masks: [number, number, number];
    palOff: number;
    palN: number;
}

function readHeader(info: Bytes): Header | null {
    const size = info.u32(0);
    const w = info.i32(4);
    const h = info.i32(8);
    const bpp = info.u16(14);
    const comp = info.u32(16);
    const clrUsed = info.u32(32);
    if (size < 40 || w <= 0 || h === 0 || ![1, 4, 8, 16, 24, 32].includes(bpp) || (comp !== BI_RGB && comp !== BI_BITFIELDS)) return null;
    const masks: [number, number, number] = comp === BI_BITFIELDS
        ? [info.u32(40), info.u32(44), info.u32(48)]
        : bpp === 16 ? [0x7c00, 0x03e0, 0x001f] : [0xff_0000, 0xff00, 0xff];
    const masksLen = comp === BI_BITFIELDS && size === 40 ? 12 : 0;
    const palOff = size + masksLen;
    // Indexed formats take 2^bpp entries when clrUsed is 0. Deeper formats carry only the entries
    // clrUsed names (WMF DIBs can have them), still capped.
    const palN = bpp <= 8 ? (clrUsed === 0 ? 1 << bpp : Math.min(clrUsed, 1 << bpp)) : Math.min(clrUsed, MAX_PALETTE);
    return { w, h: Math.abs(h), topDown: h < 0, bpp, masks, palOff, palN };
}

/** Byte length of the info part (header, masks, palette) of a DIB, so the pixel bits follow it. */
export function infoLen(dib: Bytes): number | null {
    const h = readHeader(dib);
    return h ? h.palOff + h.palN * 4 : null;
}

/**
 * Decodes a DIB given as its info part (header plus masks and palette) and its pixel bits. The
 * 32-bit alpha byte is kept only when `keepAlpha` is set (per-pixel alpha blends); otherwise pixels
 * are opaque.
 */
export function decode(info: Bytes, bits: Bytes, keepAlpha: boolean): Rgba | null {
    const hd = readHeader(info);
    if (!hd) return null;
    const pixels = hd.w * hd.h;
    if (pixels === 0 || pixels > MAX_PIXELS) return null;
    const stride = Math.floor((hd.w * hd.bpp + 31) / 32) * 4;
    const data = bits.slice(0, stride * hd.h);
    const pal = info.slice(hd.palOff, hd.palN * 4);
    const px = new Uint8Array(pixels * 4);
    const [mr, mg, mb] = hd.masks;
    for (let y = 0; y < hd.h; y++) {
        const row = (hd.topDown ? y : hd.h - 1 - y) * stride;
        for (let x = 0; x < hd.w; x++) {
            const o = (y * hd.w + x) * 4;
            let r = 0, g = 0, b = 0, a = 255;
            switch (hd.bpp) {
                case 1: [r, g, b] = palette(pal, (data[row + (x >> 3)] >> (7 - (x % 8))) & 1); break;
                case 4: { const v = data[row + (x >> 1)]; [r, g, b] = palette(pal, x % 2 === 0 ? v >> 4 : v & 0x0f); break; }
                case 8: [r, g, b] = palette(pal, data[row + x]); break;
                case 24: { const p = row + x * 3; b = data[p]; g = data[p + 1]; r = data[p + 2]; break; }
                case 16: { const p = row + x * 2; const v = data[p] | (data[p + 1] << 8); r = field(v, mr); g = field(v, mg); b = field(v, mb); break; }
                default: {
                    const p = row + x * 4;
                    const v = (data[p] | (data[p + 1] << 8) | (data[p + 2] << 16) | (data[p + 3] << 24)) >>> 0;
                    r = field(v, mr); g = field(v, mg); b = field(v, mb);
                    a = keepAlpha ? data[p + 3] : 255;
                }
            }
            px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = a;
        }
    }
    return { w: hd.w, h: hd.h, bottomUp: !hd.topDown, px };
}

/** Palette entries are BGRX quads; an index past the table reads as black rather than failing the image. */
function palette(pal: Uint8Array, i: number): [number, number, number] {
    const o = i * 4;
    return o + 4 <= pal.length ? [pal[o + 2], pal[o + 1], pal[o]] : [0, 0, 0];
}

function trailingZeros(v: number): number {
    let n = 0;
    while (n < 32 && ((v >>> n) & 1) === 0) n++;
    return n;
}

/** Extracts one channel from a masked pixel value and scales it to 8 bits. */
function field(v: number, mask: number): number {
    if (mask === 0) return 0;
    const shift = trailingZeros(mask);
    const max = (mask >>> shift);
    const val = ((v & mask) >>> 0) >>> shift;
    return Math.floor((val * 255 + Math.floor(max / 2)) / max);
}

/**
 * Clips a source rectangle `src` = `[x, y, w, h]` to the bitmap and returns the cropped pixels (top-down)
 * with the part of the destination `dst` that they fill. `src` is in DIB pixel coordinates (`y` counted
 * from the DIB's origin, so bottom-up images count from the bottom); a non-positive source size means the
 * whole bitmap. Clipping shrinks the destination by the same ratio and shifts it by the clipped-off part,
 * so the rest of the image keeps its place. A negative destination extent is kept (the caller mirrors).
 */
export function clipBlit(img: Rgba, src0: number[], dst: number[]): { img: Rgba; dst: [number, number, number, number] } | null {
    const iw = img.w, ih = img.h;
    const [sx, sy, sw, sh] = src0[2] > 0 && src0[3] > 0 ? src0 : [0, 0, iw, ih];
    // The request's top row in top-down order.
    const top = img.bottomUp ? ih - sy - sh : sy;
    const x0 = Math.max(sx, 0), x1 = Math.min(sx + sw, iw);
    const r0 = Math.max(top, 0), r1 = Math.min(top + sh, ih);
    if (x1 <= x0 || r1 <= r0) return null;
    const kx = dst[2] / sw, ky = dst[3] / sh;
    const out: [number, number, number, number] = [dst[0] + (x0 - sx) * kx, dst[1] + (r0 - top) * ky, (x1 - x0) * kx, (r1 - r0) * ky];
    const ow = x1 - x0, oh = r1 - r0;
    const px = new Uint8Array(ow * oh * 4);
    for (let row = r0; row < r1; row++) {
        const s = (row * img.w + x0) * 4;
        if (s + ow * 4 > img.px.length) return null;
        px.set(img.px.subarray(s, s + ow * 4), (row - r0) * ow * 4);
    }
    return { img: { w: ow, h: oh, bottomUp: false, px }, dst: out };
}

/**
 * Applies a blend to decoded pixels before they are drawn. The picture has no destination pixels, so
 * raster operations are drawn as they look over white paper: SRCAND (destination AND source) leaves
 * white source pixels out and draws the rest; SRCPAINT and SRCINVERT leave black ones out. Other
 * operations draw the source as copied. Constant alpha scales every pixel's alpha, after a
 * per-pixel (premultiplied) source is made straight.
 */
export function prepare(img: Rgba, blend: Blend): void {
    const px = img.px;
    if (blend.kind === 'rop') {
        if (blend.rop === ROP_SRCAND) clearWhere(px, 255);
        else if (blend.rop === ROP_SRCPAINT || blend.rop === ROP_SRCINVERT) clearWhere(px, 0);
        return;
    }
    for (let i = 0; i + 3 < px.length; i += 4) {
        if (blend.perPixel) unpremultiply(px, i);
        px[i + 3] = Math.floor((px[i + 3] * blend.constant) / 255);
    }
}

/** Makes the pixels of grey `v` (all three channels) transparent: where a raster operation keeps the destination. */
function clearWhere(px: Uint8Array, v: number): void {
    for (let i = 0; i + 3 < px.length; i += 4) if (px[i] === v && px[i + 1] === v && px[i + 2] === v) px[i + 3] = 0;
}

/** AC_SRC_ALPHA sources are premultiplied; the model holds straight RGBA. A transparent pixel keeps its colour bytes. */
export function unpremultiply(px: Uint8Array, i: number): void {
    const a = px[i + 3];
    if (a === 0 || a === 255) return;
    for (let c = 0; c < 3; c++) px[i + c] = Math.min(255, Math.floor((px[i + c] * 255 + Math.floor(a / 2)) / a));
}

/** Mirrors a decoded image left-right and/or top-bottom. A short buffer flips only the rows it has. */
export function flip(img: Rgba, horizontal: boolean, vertical: boolean): void {
    const { w, h, px } = img;
    if (w === 0 || h === 0) return;
    const row = w * 4;
    const rows = Math.min(h, Math.floor(px.length / row));
    if (horizontal) {
        for (let y = 0; y < rows; y++) {
            const base = y * row;
            for (let x = 0; x < w >> 1; x++) {
                const a = base + x * 4, b = base + (w - 1 - x) * 4;
                for (let c = 0; c < 4; c++) { const t = px[a + c]; px[a + c] = px[b + c]; px[b + c] = t; }
            }
        }
    }
    if (vertical) {
        const tmp = new Uint8Array(row);
        for (let y = 0; y < rows >> 1; y++) {
            const a = y * row, b = (rows - 1 - y) * row;
            tmp.set(px.subarray(a, a + row));
            px.copyWithin(a, b, b + row);
            px.set(tmp, b);
        }
    }
}
