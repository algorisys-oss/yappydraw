import { describe, it, expect } from "bun:test";
import { zlibSync } from "fflate";
import { decodeTiff, isTiff, tiffToPngImage, unpackBits, lzw } from "./tiff";

const b64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

// 6×3 RGB written by Pillow 10.2 (fixtures generated once; temp/tiff-compare.ts checks a wider matrix).
const PIXELS = [
    [255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0], [0, 255, 255], [255, 0, 255],
    [10, 20, 30], [10, 20, 30], [10, 20, 30], [10, 20, 30], [200, 100, 50], [0, 0, 0],
    [1, 2, 3], [4, 5, 6], [7, 8, 9], [1, 2, 3], [4, 5, 6], [7, 8, 9],
];
const FIXTURES: Record<string, string> = {
    'LZW + predictor': 'SUkqADIAAACAP8AAAAwKCP+EAEAgCEgAFBQPQOJRNfFAKDhOM4AgIBx2PAN9SGPx2AgLAAABAwABAAAABgAAAAEBAwABAAAAAwAAAAIBAwADAAAAvAAAAAMBAwABAAAABQAAAAYBAwABAAAAAgAAABEBBAABAAAACAAAABUBAwABAAAAAwAAABYBAwABAAAAAwAAABcBBAABAAAAKgAAABwBAwABAAAAAQAAAD0BAwABAAAAAgAAAAAAAAAIAAgACAA=',
    'PackBits': 'SUkqAD4AAAAA//4AAP/+AP7//wD+/wEA/w4KFB4KFB4KFB4KFB7IZDL+ABEBAgMEBQYHCAkBAgMEBQYHCAkKAAABAwABAAAABgAAAAEBAwABAAAAAwAAAAIBAwADAAAAvAAAAAMBAwABAAAABYAAAAYBAwABAAAAAgAAABEBBAABAAAACAAAABUBAwABAAAAAwAAABYBAwABAAAAAwAAABcBBAABAAAANgAAABwBAwABAAAAAQAAAAAAAAAIAAgACAA=',
    'Deflate': 'SUkqADAAAAB4nPvPwMDwH4T//4cQ/7lE5ODoRIoRUI6RiZmFlY2dgxPOAADJ6AugCgAAAQMAAQAAAAYAAAABAQMAAQAAAAMAAAACAQMAAwAAAK4AAAADAQMAAQAAAAgAAAAGAQMAAQAAAAIAAAARAQQAAQAAAAgAAAAVAQMAAQAAAAMAAAAWAQMAAQAAAAMAAAAXAQQAAQAAACgAAAAcAQMAAQAAAAEAAAAAAAAACAAIAAgA',
};

/** A hand-built TIFF: one IFD of SHORT/LONG tags, in either byte order, with the data blocks after it. */
function tiff(tags: Record<number, number | number[]>, blocks: Uint8Array[], le = true): Uint8Array {
    const entries = Object.entries(tags).map(([t, v]) => [Number(t), Array.isArray(v) ? v : [v]] as const).sort((a, b) => a[0] - b[0]);
    const ifdAt = 8, ifdLen = 2 + entries.length * 12 + 4;
    let at = ifdAt + ifdLen;
    const extra: { at: number; vals: readonly number[] }[] = [];
    for (const [, vals] of entries) if (vals.length > 1) { extra.push({ at, vals }); at += vals.length * 4; }
    const blockAt: number[] = [];
    for (const b of blocks) { blockAt.push(at); at += b.length; }
    const out = new Uint8Array(at);
    const v = new DataView(out.buffer);
    out.set(le ? [0x49, 0x49, 42, 0] : [0x4d, 0x4d, 0, 42]);
    v.setUint32(4, ifdAt, le);
    v.setUint16(ifdAt, entries.length, le);
    let e = 0;
    entries.forEach(([tag, vals], i) => {
        const o = ifdAt + 2 + i * 12;
        // Offsets the caller wrote as -1, -2 … are filled with the data blocks' positions.
        const real = vals.map(x => x < 0 ? blockAt[-x - 1] : x);
        v.setUint16(o, tag, le); v.setUint16(o + 2, 4, le); v.setUint32(o + 4, real.length, le);
        if (real.length === 1) v.setUint32(o + 8, real[0], le);
        else { const x = extra[e++]; v.setUint32(o + 8, x.at, le); real.forEach((n, k) => v.setUint32(x.at + k * 4, n, le)); }
    });
    blocks.forEach((b, i) => out.set(b, blockAt[i]));
    return out;
}

describe("TIFF: Pillow fixtures", () => {
    for (const [name, data] of Object.entries(FIXTURES)) {
        it(`decodes ${name}`, () => {
            const img = decodeTiff(b64(data))!;
            expect([img.w, img.h]).toEqual([6, 3]);
            const got = PIXELS.map((_, i) => [img.rgba[i * 4], img.rgba[i * 4 + 1], img.rgba[i * 4 + 2]]);
            expect(got).toEqual(PIXELS);
            expect(img.rgba.filter((_, i) => i % 4 === 3).every(a => a === 255)).toBe(true);
        });
    }
    it("makes a PNG data URL with the pixel size", () => {
        const r = tiffToPngImage(b64(FIXTURES.Deflate))!;
        expect(r.url.startsWith('data:image/png;base64,iVBORw0KGgo')).toBe(true);
        expect([r.w, r.h]).toEqual([6, 3]);
    });
});

describe("TIFF: layouts Pillow doesn't write", () => {
    // 2×2 RGB: red, green / blue, white.
    const px = [255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255];
    const rgb = (p: number[]) => Array.from({ length: p.length / 3 }, (_, i) => p.slice(i * 3, i * 3 + 3));
    const pixelsOf = (img: { rgba: Uint8Array }) => Array.from({ length: img.rgba.length / 4 }, (_, i) => Array.from(img.rgba.slice(i * 4, i * 4 + 3)));

    it("reads big-endian (MM) files", () => {
        const img = decodeTiff(tiff({ 256: 2, 257: 2, 258: [8, 8, 8], 262: 2, 277: 3, 273: -1, 279: 12 }, [Uint8Array.from(px)], false))!;
        expect(pixelsOf(img)).toEqual(rgb(px));
    });
    it("reads tiles, cropping the padding past the image edge", () => {
        // A 3×3 grey image in 2×2 tiles: four tiles, each 2×2 with padding beyond column/row 3.
        const t = (a: number[]) => Uint8Array.from(a);
        const tiles = [t([10, 20, 40, 50]), t([30, 99, 60, 99]), t([70, 80, 99, 99]), t([90, 99, 99, 99])];
        const img = decodeTiff(tiff({ 256: 3, 257: 3, 258: 8, 262: 1, 277: 1, 322: 2, 323: 2, 324: [-1, -2, -3, -4], 325: [4, 4, 4, 4] }, tiles))!;
        expect([img.w, img.h]).toEqual([3, 3]);
        expect(pixelsOf(img).map(p => p[0])).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90]);
    });
    it("inverts WhiteIsZero grey and unpacks 1-bit rows MSB-first", () => {
        // 10 px wide: each row is 2 bytes; bit set = black under WhiteIsZero.
        const img = decodeTiff(tiff({ 256: 10, 257: 1, 258: 1, 262: 0, 277: 1, 273: -1, 279: 2 }, [Uint8Array.from([0b10100000, 0b01000000])]))!;
        expect(pixelsOf(img).map(p => p[0])).toEqual([0, 255, 0, 255, 255, 255, 255, 255, 255, 0]);
    });
    it("unpremultiplies associated alpha and keeps unassociated alpha as is", () => {
        const assoc = decodeTiff(tiff({ 256: 1, 257: 1, 258: [8, 8, 8, 8], 262: 2, 277: 4, 338: 1, 273: -1, 279: 4 }, [Uint8Array.from([50, 0, 100, 128])]))!;
        expect(Array.from(assoc.rgba)).toEqual([100, 0, 199, 128]);
        const unassoc = decodeTiff(tiff({ 256: 1, 257: 1, 258: [8, 8, 8, 8], 262: 2, 277: 4, 338: 2, 273: -1, 279: 4 }, [Uint8Array.from([50, 0, 100, 128])]))!;
        expect(Array.from(unassoc.rgba)).toEqual([50, 0, 100, 128]);
    });
    it("reads palette colours from the 16-bit colour map", () => {
        const map = [...[0xffff, 0x0000], ...[0x0000, 0x8000], ...[0x0000, 0xffff]]; // 1-bit: red, blue-ish
        const img = decodeTiff(tiff({ 256: 2, 257: 1, 258: 1, 262: 3, 277: 1, 273: -1, 279: 1, 320: map }, [Uint8Array.from([0b01000000])]))!;
        expect(pixelsOf(img)).toEqual([[255, 0, 0], [0, 128, 255]]);
    });
    it("reads Deflate with a zlib header and a missing byte count", () => {
        const img = decodeTiff(tiff({ 256: 2, 257: 2, 258: [8, 8, 8], 259: 8, 262: 2, 277: 3, 273: -1 }, [zlibSync(Uint8Array.from(px))]))!;
        expect(pixelsOf(img)).toEqual(rgb(px));
    });
});

describe("TIFF: unsupported and hostile input", () => {
    const ok = { 256: 2, 257: 2, 258: [8, 8, 8], 262: 2, 277: 3, 273: -1, 279: 12 };
    const data = [new Uint8Array(12)];
    it("returns null for JPEG-in-TIFF, YCbCr, planar and float", () => {
        expect(decodeTiff(tiff({ ...ok, 259: 7 }, data))).toBeNull();
        expect(decodeTiff(tiff({ ...ok, 262: 6 }, data))).toBeNull();
        expect(decodeTiff(tiff({ ...ok, 284: 2 }, data))).toBeNull();
        expect(decodeTiff(tiff({ ...ok, 339: [3, 3, 3] }, data))).toBeNull();
        expect(decodeTiff(tiff(ok, data))).not.toBeNull();
    });
    it("returns null for non-TIFF, BigTIFF, truncation and absurd sizes, without throwing", () => {
        expect(isTiff(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]))).toBe(false);
        expect(decodeTiff(new Uint8Array([0x49, 0x49, 43, 0, 8, 0, 0, 0]))).toBeNull();
        const good = b64(FIXTURES['LZW + predictor']);
        for (let n = 0; n < good.length; n += 7) expect(() => decodeTiff(good.subarray(0, n))).not.toThrow();
        expect(decodeTiff(tiff({ ...ok, 256: 100_000, 257: 100_000 }, data))).toBeNull();
        expect(decodeTiff(tiff({ ...ok, 273: 1 << 30 }, data))?.rgba.length).toBe(16); // strip past the end: blank, not a crash
    });
    it("survives random corruption of every fixture", () => {
        let seed = 7;
        const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
        for (const f of Object.values(FIXTURES)) {
            for (let k = 0; k < 300; k++) {
                const b = b64(f);
                for (let j = 0; j < 4; j++) b[Math.floor(rnd() * b.length)] = Math.floor(rnd() * 256);
                expect(() => decodeTiff(b)).not.toThrow();
            }
        }
    });
});

describe("TIFF codecs", () => {
    it("PackBits: literal runs, repeats, the -128 no-op, and the output cap", () => {
        expect(Array.from(unpackBits(Uint8Array.from([2, 1, 2, 3, 0xfe, 9, 0x80, 0, 7]), 100))).toEqual([1, 2, 3, 9, 9, 9, 7]);
        expect(Array.from(unpackBits(Uint8Array.from([0xfd, 5]), 2))).toEqual([5, 5]);
    });
    it("LZW: a stream that hits the KwKwK case decodes, and output stops at the cap", () => {
        // "aaaa" with 9-bit codes: 256 (clear), 'a', 258 (= "aa", the KwKwK case), 'a', 257 (end).
        const codes = [256, 97, 258, 97, 257];
        let bits = '';
        for (const c of codes) bits += c.toString(2).padStart(9, '0');
        while (bits.length % 8) bits += '0';
        const src = Uint8Array.from(bits.match(/.{8}/g)!.map(s => parseInt(s, 2)));
        expect(String.fromCharCode(...lzw(src, 100))).toBe('aaaa');
        expect(String.fromCharCode(...lzw(src, 2))).toBe('aa');
    });
});
