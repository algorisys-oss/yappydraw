/**
 * Compressed images inside EMF+ (PNG, JPEG, GIF, BMP). DeckCraft decodes them to pixels; a browser
 * can't decode synchronously, and the SVG we write doesn't need pixels: it embeds the file as is.
 * So an encoded image keeps its bytes and its pixel size, read from the file's own header. BMP is
 * the exception: it is a DIB behind a 14-byte header, which the DIB decoder reads directly.
 */
import { Bytes, guard } from './bytes';
import * as dib from './dib';
import type { Rgba } from './dib';

/** An image the SVG embeds as a file. `crop` is the source rectangle `[x, y, w, h]` in its pixels; null is all of it. */
export interface Encoded {
    mime: 'image/png' | 'image/jpeg' | 'image/gif';
    bytes: Uint8Array;
    w: number;
    h: number;
    crop: [number, number, number, number] | null;
    /** Mirrored left-right, top-bottom (a negative destination extent). */
    flip?: [boolean, boolean];
}

export const isEncoded = (img: Rgba | Encoded): img is Encoded => 'mime' in img;

/** The image as pixels (BMP) or as an embeddable file with its size; null when unrecognised or malformed. */
export function decodeCompressed(b: Uint8Array): Rgba | Encoded | null {
    return guard(() => {
        const r = new Bytes(b);
        if (b.length > 24 && r.u32(0) === 0x474e5089 && r.u32(4) === 0x0a1a0a0d) {
            // PNG: IHDR is the first chunk; width and height are big-endian.
            const w = r.view.getUint32(16, false), h = r.view.getUint32(20, false);
            return w > 0 && h > 0 ? { mime: 'image/png' as const, bytes: b, w, h, crop: null } : null;
        }
        if (b.length > 10 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) {
            const w = r.u16(6), h = r.u16(8);
            return w > 0 && h > 0 ? { mime: 'image/gif' as const, bytes: b, w, h, crop: null } : null;
        }
        if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
            const size = jpegSize(r);
            return size ? { mime: 'image/jpeg' as const, bytes: b, w: size[0], h: size[1], crop: null } : null;
        }
        if (b.length > 54 && b[0] === 0x42 && b[1] === 0x4d) {
            const d = r.tail(14);
            const n = dib.infoLen(d);
            if (n === null) return null;
            const bitsAt = r.u32(10);
            const img = dib.decode(d.sub(0, n), bitsAt >= 14 + n ? r.tail(bitsAt) : d.tail(n), false);
            if (!img) return null;
            if (img.bottomUp) { img.bottomUp = false; }
            return img;
        }
        return null;
    }) ?? null;
}

/** The size from a JPEG's first start-of-frame marker. */
function jpegSize(r: Bytes): [number, number] | null {
    let p = 2;
    for (let guardN = 0; guardN < 10_000 && p + 9 < r.length; guardN++) {
        if (r.b[p] !== 0xff) return null;
        const marker = r.b[p + 1];
        if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { p += 2; continue; }
        const len = r.view.getUint16(p + 2, false);
        // SOF0..SOF15, except DHT (C4), JPG (C8) and DAC (CC).
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
            const h = r.view.getUint16(p + 5, false), w = r.view.getUint16(p + 7, false);
            return w > 0 && h > 0 ? [w, h] : null;
        }
        p += 2 + len;
    }
    return null;
}
