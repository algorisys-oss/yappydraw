/**
 * A minimal synchronous PNG encoder for RGBA8 pixels (filter 0, zlib via fflate), so the SVG writer
 * can embed metafile bitmaps and brush tiles without a canvas or an async decode.
 */
import { zlibSync } from 'fflate';

const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c >>> 0;
    }
    return t;
})();

function crc32(data: Uint8Array, start: number, end: number): number {
    let c = 0xffffffff;
    for (let i = start; i < end; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
    const out = new Uint8Array(12 + data.length);
    const v = new DataView(out.buffer);
    v.setUint32(0, data.length);
    for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
    out.set(data, 8);
    v.setUint32(8 + data.length, crc32(out, 4, 8 + data.length));
    return out;
}

/** RGBA8 rows (top-down) as a PNG file. */
export function encodePng(w: number, h: number, rgba: Uint8Array): Uint8Array {
    const ihdr = new Uint8Array(13);
    const v = new DataView(ihdr.buffer);
    v.setUint32(0, w);
    v.setUint32(4, h);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // RGBA
    const raw = new Uint8Array(h * (w * 4 + 1));
    for (let y = 0; y < h; y++) {
        const o = y * (w * 4 + 1);
        raw[o] = 0; // filter: none
        raw.set(rgba.subarray(y * w * 4, (y + 1) * w * 4), o + 1);
    }
    const parts = [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlibSync(raw, { level: 6 })), chunk('IEND', new Uint8Array(0))];
    const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
    let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return out;
}

/** Bytes as base64 (chunked, so large images don't overflow the argument list). */
export function toBase64(bytes: Uint8Array): string {
    let s = '';
    const CH = 0x8000;
    for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode(...bytes.subarray(i, i + CH));
    return btoa(s);
}
