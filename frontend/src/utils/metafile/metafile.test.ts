/**
 * Hand-built WMF, EMF and EMF+ buffers: each test writes the records it needs and checks the parsed
 * model. Ported from DeckCraft's `crates/metafile/src/tests.rs` (MIT/Apache) — the expectations are
 * DeckCraft's, so these double as the parity check for the port — plus tests of the SVG writer.
 */
import { describe, it, expect } from 'bun:test';
import { parseMetafile, isMetafile, pictureToSvg, metafileToSvgImage, MetafileError, type Item, type Picture, type Seg, type Text } from './index';
import { Canvas } from './canvas';
import { roundRect } from './geom';
import { flip } from './dib';
import { MAX_BYTES, MAX_ITEMS, MAX_STACK, MAX_PATH_OPS } from './limits';
import { symbolChar } from './svg';

// ── builders ──────────────────────────────────────────────────────────────────────────────

const h16 = (v: number) => { const b = new Uint8Array(2); new DataView(b.buffer).setInt16(0, v, true); return [...b]; };
const h32 = (v: number) => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, v >>> 0, true); return [...b]; };
const e32 = (v: number) => { const b = new Uint8Array(4); new DataView(b.buffer).setInt32(0, v, true); return [...b]; };
const f32s = (v: number[]) => v.flatMap(x => { const b = new Uint8Array(4); new DataView(b.buffer).setFloat32(0, x, true); return [...b]; });
const cat = (...parts: number[][]) => parts.flat();

/** One WMF record: size in words, function, parameters (padded to a word boundary). */
function wrec(func: number, params: number[]): number[] {
    const p = params.slice();
    if (p.length % 2) p.push(0);
    return cat(h32((6 + p.length) / 2), [func & 0xff, func >> 8], p);
}

/** A WMF file: optional placeable header (left, top, right, bottom; 1440 per inch), the header, the records and EOF. */
function wmf(records: number[][], placeable?: [number, number, number, number]): Uint8Array {
    const body = records.flat();
    const eof = wrec(0, []);
    const f: number[] = [];
    if (placeable) {
        f.push(...h32(0x9ac6cdd7), ...h16(0));
        for (const v of placeable) f.push(...h16(v));
        f.push(...h16(1440), ...h32(0), ...h16(0));
    }
    const total = (f.length + 18 + body.length + eof.length) / 2;
    f.push(...h16(1), ...h16(9), ...h16(0x300), ...h32(total), ...h16(16), ...h32(0), ...h16(0));
    return new Uint8Array([...f, ...body, ...eof]);
}

/** One EMF record: type, size in bytes (payload padded to 4), payload. */
function erec(typ: number, payload: number[]): number[] {
    const p = payload.slice();
    while (p.length % 4) p.push(0);
    return cat(h32(typ), h32(8 + p.length), p);
}

/** An EMF file with an 88-byte header (bounds; frame in 0.01 mm; 1000×500 px for 250×125 mm). */
function emf(records: number[][], bounds: number[], frame: number[]): Uint8Array {
    const body = records.flat();
    const eof = erec(14, new Array(12).fill(0));
    const total = 88 + body.length + eof.length;
    const h = new Array(88).fill(0);
    const put = (o: number, b: number[]) => b.forEach((v, i) => { h[o + i] = v; });
    put(0, h32(1)); put(4, h32(88));
    put(8, bounds.flatMap(e32)); put(24, frame.flatMap(e32));
    put(40, h32(0x464d4520)); put(44, h32(0x00010000)); put(48, h32(total)); put(52, h32(records.length + 1)); put(56, h16(1));
    put(72, e32(1000)); put(76, e32(500)); put(80, e32(250)); put(84, e32(125));
    return new Uint8Array([...h, ...body, ...eof]);
}

/** An EMF record of `len` bytes with u32 fields and byte blobs at absolute record offsets. */
function erecAt(typ: number, len: number, fields: [number, number][], blobs: [number, number[]][] = []): number[] {
    const v = new Array(len).fill(0);
    const put = (o: number, b: number[]) => b.forEach((x, i) => { v[o + i] = x; });
    put(0, h32(typ)); put(4, h32(len));
    for (const [o, val] of fields) put(o, h32(val));
    for (const [o, b] of blobs) put(o, b);
    return v;
}

const infoHeader = (w: number, h: number, bpp: number, sizeImage: number) => cat(h32(40), e32(w), e32(h), h16(1), h16(bpp), h32(0), h32(sizeImage), e32(0), e32(0), h32(0), h32(0));

/** A 2×2 24-bit bottom-up DIB: top row red, white; bottom row blue, green. */
const dib24 = () => cat(infoHeader(2, 2, 24, 16), [255, 0, 0, 0, 255, 0, 0, 0], [0, 0, 255, 255, 255, 255, 0, 0]);
const DIB24_RGBA = [255, 0, 0, 255, 255, 255, 255, 255, 0, 0, 255, 255, 0, 255, 0, 255];

/** A BITBLT-style record with its DIB at 112 (bmi/bits offsets at 84 and 92). */
function dibRec(typ: number, fields: [number, number][], blobs: [number, number[]][], info: number[], bits: number[]): number[] {
    const at = 112, bitsAt = at + info.length;
    return erecAt(typ, bitsAt + bits.length, [...fields, [84, at], [88, info.length], [92, bitsAt], [96, bits.length]], [...blobs, [at, info], [bitsAt, bits]]);
}
const bitbltRec = (rop: number, dst: number[], info: number[], bits: number[]) =>
    dibRec(76, [[24, dst[0]], [28, dst[1]], [32, dst[2]], [36, dst[3]], [40, rop]], [], info, bits);

const parse = (b: Uint8Array) => parseMetafile(b);

function pathOf(item: Item) {
    if (item.kind !== 'path') throw new Error(`expected a path: ${item.kind}`);
    return item;
}
function bitmapOf(item: Item) {
    if (item.kind !== 'bitmap' || 'mime' in item.img) throw new Error(`expected a pixel bitmap: ${item.kind}`);
    return { rect: item.rect, w: item.img.w, h: item.img.h, rgba: [...item.img.px], region: item.region };
}
const texts = (p: Picture): Text[] => p.items.filter((i): i is Extract<Item, { kind: 'text' }> => i.kind === 'text').map(i => i.text);
const regionOf = (item: Item) => (item.kind === 'text' ? item.text.region : item.region);

const Mv = (x: number, y: number): Seg => ({ k: 'M', x, y });
const Ln = (x: number, y: number): Seg => ({ k: 'L', x, y });
const Zs: Seg = { k: 'Z' };
const close = (a: number, b: number) => Math.abs(a - b) < 1e-3;
const close6 = (a: number[], b: number[]) => a.every((x, i) => Math.abs(x - b[i]) < 1e-6);

function rectExtent(item: Item): [number, number, number, number] {
    const pts = pathOf(item).segs.filter((s): s is Extract<Seg, { k: 'M' | 'L' }> => s.k === 'M' || s.k === 'L');
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

// ── WMF ───────────────────────────────────────────────────────────────────────────────────

describe('WMF records', () => {
    it('rectangle with a solid brush', () => {
        const p = parse(wmf([wrec(0x02fc, cat(h16(0), h32(0xff), h16(0))), wrec(0x012d, h16(0)), wrec(0x041b, cat(h16(70), h16(110), h16(20), h16(10)))]));
        expect([p.width, p.height]).toEqual([100, 50]);
        expect(p.items.length).toBe(1);
        const it0 = pathOf(p.items[0]);
        expect(it0.segs).toEqual([Mv(0, 0), Ln(100, 0), Ln(100, 50), Ln(0, 50), Zs]);
        expect(it0.fill).toEqual([255, 0, 0, 255]);
        expect(it0.stroke).toEqual([[0, 0, 0, 255], 0]);
        expect(it0.evenOdd).toBe(true);
    });

    it('polyline with a pen', () => {
        const p = parse(wmf([wrec(0x02fa, cat(h16(0), h16(4), h16(0), h32(0x0000ff00))), wrec(0x012d, h16(0)), wrec(0x0325, cat(h16(3), h16(0), h16(0), h16(50), h16(0), h16(50), h16(40)))]));
        expect([p.width, p.height]).toEqual([50, 40]);
        const it0 = pathOf(p.items[0]);
        expect(it0.segs).toEqual([Mv(0, 0), Ln(50, 0), Ln(50, 40)]);
        expect(it0.fill).toBeNull();
        expect(it0.stroke).toEqual([[0, 255, 0, 255], 4]);
    });

    it('polygon fill rule follows SETPOLYFILLMODE', () => {
        const square = cat(h16(4), h16(0), h16(0), h16(10), h16(0), h16(10), h16(10), h16(0), h16(10));
        expect(pathOf(parse(wmf([wrec(0x0106, h16(2)), wrec(0x0324, square)])).items[0]).evenOdd).toBe(false);
        const alt = pathOf(parse(wmf([wrec(0x0324, square)])).items[0]);
        expect(alt.evenOdd).toBe(true);
        expect(alt.fill).toEqual([255, 255, 255, 255]);
        expect(alt.segs[alt.segs.length - 1]).toEqual(Zs);
    });

    it('STRETCHDIB flips bottom-up rows', () => {
        const params = cat(h32(0x00cc0020), h16(0), h16(2), h16(2), h16(0), h16(0), h16(10), h16(20), h16(0), h16(0), dib24());
        const p = parse(wmf([wrec(0x0f43, params)]));
        expect([p.width, p.height]).toEqual([20, 10]);
        const b = bitmapOf(p.items[0]);
        expect(b.rect).toEqual([0, 0, 20, 10]);
        expect([b.w, b.h]).toEqual([2, 2]);
        expect(b.rgba).toEqual(DIB24_RGBA);
    });

    it('window and viewport mapping', () => {
        const p = parse(wmf([wrec(0x0103, h16(8)), wrec(0x020b, cat(h16(100), h16(100))), wrec(0x020c, cat(h16(50), h16(50))), wrec(0x020e, cat(h16(100), h16(100))), wrec(0x0214, cat(h16(100), h16(100))), wrec(0x0213, cat(h16(150), h16(150)))]));
        expect([p.width, p.height]).toEqual([100, 100]);
        const it0 = pathOf(p.items[0]);
        expect(it0.segs).toEqual([Mv(0, 0), Ln(100, 100)]);
        expect(it0.stroke).toEqual([[0, 0, 0, 255], 0]);
    });

    it('a placeable header sets the frame in points', () => {
        const p = parse(wmf([wrec(0x041b, cat(h16(1440), h16(2880), h16(0), h16(0)))], [0, 0, 2880, 1440]));
        expect([p.width, p.height]).toEqual([144, 72]);
    });

    it('placeable bounds go through the window mapping', () => {
        const p = parse(wmf([wrec(0x0103, h16(8)), wrec(0x020c, cat(h16(100), h16(200))), wrec(0x020e, cat(h16(50), h16(100))), wrec(0x041b, cat(h16(100), h16(200), h16(0), h16(0)))], [0, 0, 200, 100]));
        expect([p.width, p.height]).toEqual([10, 5]);
        expect(pathOf(p.items[0]).segs.some(s => s.k === 'L' && close(s.x, 10) && close(s.y, 5))).toBe(true);
    });

    it('a clipped STRETCHDIB source keeps its place', () => {
        const params = cat(h32(0x00cc0020), h16(0), h16(2), h16(2), h16(0), h16(-1), h16(10), h16(20), h16(0), h16(0), dib24());
        const b = bitmapOf(parse(wmf([wrec(0x0f43, params)], [0, 0, 20, 10])).items[0]);
        expect(b.rect).toEqual([0.5, 0, 0.5, 0.5]);
        expect([b.w, b.h]).toEqual([1, 2]);
        expect(b.rgba).toEqual([255, 0, 0, 255, 0, 0, 255, 255]);
    });

    it('a negative destination width mirrors the bitmap', () => {
        const params = cat(h32(0x00cc0020), h16(0), h16(2), h16(2), h16(0), h16(0), h16(10), h16(-20), h16(0), h16(0), dib24());
        const b = bitmapOf(parse(wmf([wrec(0x0f43, params)], [-20, 0, 0, 10])).items[0]);
        expect(b.rect).toEqual([0, 0, 1, 0.5]);
        expect(b.rgba.slice(0, 8)).toEqual([255, 255, 255, 255, 255, 0, 0, 255]);
    });

    it('a negative destination height mirrors the rows', () => {
        const params = cat(h32(0x00cc0020), h16(0), h16(2), h16(2), h16(0), h16(0), h16(-10), h16(20), h16(0), h16(0), dib24());
        const b = bitmapOf(parse(wmf([wrec(0x0f43, params)])).items[0]);
        expect(b.rect).toEqual([0, 0, 20, 10]);
        expect(b.rgba).toEqual([0, 0, 255, 255, 0, 255, 0, 255, 255, 0, 0, 255, 255, 255, 255, 255]);
    });

    it('a stock NULL_BRUSH by 16-bit handle has no fill', () => {
        const it0 = pathOf(parse(wmf([wrec(0x012d, h16(0x8005)), wrec(0x041b, cat(h16(70), h16(110), h16(20), h16(10)))])).items[0]);
        expect(it0.fill).toBeNull();
        expect(it0.stroke).toEqual([[0, 0, 0, 255], 0]);
    });

    it('a font takes an object slot, so handles line up', () => {
        const p = parse(wmf([wrec(0x02fb, new Array(18).fill(0)), wrec(0x02fa, cat(h16(0), h16(4), h16(0), h32(0x0000ff00))), wrec(0x012d, h16(1)), wrec(0x0325, cat(h16(2), h16(0), h16(0), h16(50), h16(0), h16(50)))]));
        expect(pathOf(p.items[0]).stroke).toEqual([[0, 255, 0, 255], 4]);
    });

    it('a hairline pen stays zero under an anisotropic window', () => {
        const p = parse(wmf([wrec(0x0103, h16(8)), wrec(0x020c, cat(h16(2000), h16(2000))), wrec(0x020e, cat(h16(1), h16(1))), wrec(0x0214, cat(h16(0), h16(0))), wrec(0x0213, cat(h16(2000), h16(2000)))]));
        expect([p.width, p.height]).toEqual([1, 1]);
        const it0 = pathOf(p.items[0]);
        expect(it0.segs[it0.segs.length - 1]).toEqual(Ln(1, 1));
        expect(it0.stroke).toEqual([[0, 0, 0, 255], 0]);
    });

    it('a metric map mode uses 96 dpi', () => {
        const p = parse(wmf([wrec(0x0103, h16(2)), wrec(0x0214, cat(h16(0), h16(0))), wrec(0x0213, cat(h16(50), h16(100)))]));
        const pxMm = 96 / 25.4;
        const s = pathOf(p.items[0]).segs as { x: number; y: number }[];
        expect(close(s[0].x, 0) && close(s[0].y, 50 * 0.1 * pxMm)).toBe(true);
        expect(close(s[1].x, 100 * 0.1 * pxMm) && close(s[1].y, 0)).toBe(true);
    });

    it('isotropic mode uses one scale and keeps axis signs', () => {
        const p = parse(wmf([wrec(0x0103, h16(7)), wrec(0x020c, cat(h16(50), h16(100))), wrec(0x020e, cat(h16(-100), h16(400))), wrec(0x0214, cat(h16(0), h16(0))), wrec(0x0213, cat(h16(25), h16(50)))]));
        const s = pathOf(p.items[0]).segs as { x: number; y: number }[];
        expect(close(s[0].x, 0) && close(s[0].y, 100) && close(s[1].x, 100) && close(s[1].y, 50)).toBe(true);
    });

    it('stroke width is clamped to the picture diagonal', () => {
        const p = parse(wmf([wrec(0x02fa, cat(h16(0), h16(5000), h16(0), h32(0))), wrec(0x012d, h16(0)), wrec(0x041b, cat(h16(1440), h16(1440), h16(0), h16(0)))], [0, 0, 1440, 1440]));
        expect([p.width, p.height]).toEqual([72, 72]);
        expect(close(pathOf(p.items[0]).stroke![1], 72 * Math.SQRT2)).toBe(true);
    });

    const originRect = () => wrec(0x041b, cat(h16(1), h16(1), h16(0), h16(0)));

    it('DIBBITBLT without a DIB is a pattern fill', () => {
        const p = parse(wmf([originRect(), wrec(0x0940, cat(h32(0x00f00021), h16(0), h16(0), h16(0), h16(10), h16(20), h16(5), h16(7)))]));
        const it1 = pathOf(p.items[1]);
        expect(it1.fill).toEqual([255, 255, 255, 255]);
        expect(it1.segs).toEqual([Mv(7, 5), Ln(27, 5), Ln(27, 15), Ln(7, 15), Zs]);
    });

    it('DIBSTRETCHBLT without a DIB is a ROP fill', () => {
        const p = parse(wmf([originRect(), wrec(0x0b41, cat(h32(0x00000042), h16(2), h16(2), h16(0), h16(0), h16(0), h16(10), h16(20), h16(5), h16(7)))]));
        const it1 = pathOf(p.items[1]);
        expect([it1.fill, it1.stroke]).toEqual([[0, 0, 0, 255], null]);
        expect(it1.segs).toEqual([Mv(7, 5), Ln(27, 5), Ln(27, 15), Ln(7, 15), Zs]);
    });

    it('DIBSTRETCHBLT stretches the DIB into its destination', () => {
        const params = cat(h32(0x00cc0020), h16(2), h16(2), h16(0), h16(0), h16(10), h16(20), h16(6), h16(5), dib24());
        const b = bitmapOf(parse(wmf([originRect(), wrec(0x0b41, params)])).items[1]);
        expect(b.rect).toEqual([5, 6, 20, 10]);
        expect(b.rgba).toEqual(DIB24_RGBA);
    });

    it('DIBBITBLT copies the DIB at its destination', () => {
        const params = cat(h32(0x00cc0020), h16(0), h16(0), h16(2), h16(2), h16(6), h16(5), dib24());
        const b = bitmapOf(parse(wmf([wrec(0x041b, cat(h16(10), h16(10), h16(0), h16(0))), wrec(0x0940, params)])).items[1]);
        expect(b.rect).toEqual([5, 6, 2, 2]);
        expect(b.rgba).toEqual(DIB24_RGBA);
    });

    it('DIB palette entries are skipped before the bits', () => {
        const info = infoHeader(2, 2, 24, 16);
        info.splice(32, 4, ...h32(2));
        const d = cat(info, new Array(8).fill(9), dib24().slice(40));
        const params = cat(h32(0x00cc0020), h16(0), h16(2), h16(2), h16(0), h16(0), h16(10), h16(20), h16(0), h16(0), d);
        expect(bitmapOf(parse(wmf([wrec(0x0f43, params)])).items[0]).rgba).toEqual(DIB24_RGBA);
    });

    it('an oversized DIB header size is rejected without overflow', () => {
        const info = infoHeader(2, 2, 24, 16);
        info.splice(0, 4, ...h32(0xfffffff0));
        const params = cat(h32(0x00cc0020), h16(0), h16(2), h16(2), h16(0), h16(0), h16(10), h16(20), h16(0), h16(0), info);
        expect(parse(wmf([wrec(0x0f43, params)])).items).toEqual([]);
    });

    it('a plain anisotropic WMF without a viewport fills its window', () => {
        const p = parse(wmf([wrec(0x0103, h16(8)), wrec(0x020b, cat(h16(0), h16(0))), wrec(0x020c, cat(h16(100), h16(200))), wrec(0x041b, cat(h16(100), h16(200), h16(0), h16(0)))]));
        expect([p.width, p.height]).toEqual([200, 100]);
        expect(rectExtent(p.items[0]).map(Math.round)).toEqual([0, 0, 200, 100]);
    });

    it("a placeable WMF's window records replace the bounds", () => {
        const p = parse(wmf([wrec(0x020c, cat(h16(2000), h16(2000))), wrec(0x020b, cat(h16(-1000), h16(-1000))), wrec(0x041b, cat(h16(1000), h16(1000), h16(-1000), h16(-1000)))], [238, 539, 1678, 1979]));
        expect([p.width, p.height]).toEqual([72, 72]);
        expect(rectExtent(p.items[0]).map(Math.round)).toEqual([0, 0, 72, 72]);
    });

    it('a placeable WMF keeps its target when the window changes shape', () => {
        const p = parse(wmf([wrec(0x0103, h16(8)), wrec(0x020c, cat(h16(200), h16(100))), wrec(0x041b, cat(h16(200), h16(100), h16(0), h16(0)))], [0, 0, 600, 300]));
        expect([p.width, p.height]).toEqual([30, 15]);
        expect(rectExtent(p.items[0]).map(Math.round)).toEqual([0, 0, 30, 15]);
    });

    it('R2_NOP draws nothing until the mode changes', () => {
        const rect = (n: number) => wrec(0x041b, cat(h16(n), h16(n), h16(0), h16(0)));
        const p = parse(wmf([wrec(0x0104, h16(11)), rect(100), wrec(0x001e, []), wrec(0x0104, h16(13)), rect(50), wrec(0x0127, h16(-1)), rect(20)], [0, 0, 100, 100]));
        expect(p.items.length).toBe(1);
        const [, , x1, y1] = rectExtent(p.items[0]);
        expect(close(x1, 2.5) && close(y1, 2.5)).toBe(true);
    });

    it("a plain WMF's target comes from a window that was read", () => {
        const p = parse(wmf([wrec(0x0103, h16(8)), wrec(0x020d, cat(h16(0), h16(0))), wrec(0x020c, []), wrec(0x020c, cat(h16(100), h16(200))), wrec(0x041b, cat(h16(100), h16(200), h16(0), h16(0)))]));
        expect([p.width, p.height]).toEqual([200, 100]);
    });

    it('INTERSECTCLIPRECT limits later records', () => {
        const p = parse(wmf([wrec(0x0416, cat(h16(30), h16(40), h16(5), h16(10))), wrec(0x041b, cat(h16(40), h16(80), h16(0), h16(0)))]));
        expect(regionOf(p.items[0])).toEqual([[10, 5, 40, 30]]);
    });
});

// ── EMF ───────────────────────────────────────────────────────────────────────────────────

describe('EMF records', () => {
    const scale2 = f32s([2, 0, 0, 2, 0, 0]);

    it('STRETCHDIBITS flips and fits the frame', () => {
        const payload = cat(new Array(16).fill(0), e32(0), e32(0), e32(0), e32(0), e32(2), e32(2), e32(80), e32(40), e32(120), e32(16), e32(0), e32(0x00cc0020), e32(100), e32(50), infoHeader(2, 2, 24, 16), dib24().slice(40));
        const p = parse(emf([erec(81, payload)], [0, 0, 100, 50], [0, 0, 2500, 1250]));
        const w = (2500 * 72) / 2540, h = (1250 * 72) / 2540;
        expect(close(p.width, w) && close(p.height, h)).toBe(true);
        const b = bitmapOf(p.items[0]);
        expect(b.rect.every((v, i) => close(v, [0, 0, w, h][i]))).toBe(true);
        expect(b.rgba).toEqual(DIB24_RGBA);
    });

    it('the world transform scales geometry', () => {
        const p = parse(emf([erec(35, scale2), erec(27, cat(e32(0), e32(0))), erec(54, cat(e32(10), e32(5)))], [0, 0, 0, 0], [0, 0, 0, 0]));
        expect([p.width, p.height]).toEqual([20, 10]);
        expect(pathOf(p.items[0]).segs).toEqual([Mv(0, 0), Ln(20, 10)]);
    });

    it('an ellipse is four cubics back to the start', () => {
        const s = pathOf(parse(emf([erec(42, cat(e32(0), e32(0), e32(40), e32(20)))], [0, 0, 0, 0], [0, 0, 0, 0])).items[0]);
        expect(s.segs.length).toBe(6);
        const m0 = s.segs[0];
        expect(m0.k === 'M' && close(m0.x, 40) && close(m0.y, 10)).toBe(true);
        const c = s.segs[4];
        expect(c.k === 'C' && close(c.x, 40) && close(c.y, 10)).toBe(true);
        expect(s.segs[5]).toEqual(Zs);
        expect(s.fill).toEqual([255, 255, 255, 255]);
    });

    it('a path bracket with STROKEANDFILLPATH uses the stock black brush', () => {
        const p = parse(emf([erec(59, []), erec(27, cat(e32(0), e32(0))), erec(54, cat(e32(10), e32(0))), erec(54, cat(e32(10), e32(10))), erec(61, []), erec(60, []), erec(37, h32(0x80000004)), erec(63, new Array(16).fill(0))], [0, 0, 0, 0], [0, 0, 0, 0]));
        expect(p.items.length).toBe(1);
        const s = pathOf(p.items[0]);
        expect(s.segs).toEqual([Mv(0, 0), Ln(10, 0), Ln(10, 10), Zs]);
        expect(s.fill).toEqual([0, 0, 0, 255]);
        expect(s.stroke).toEqual([[0, 0, 0, 255], 0]);
    });

    it('the frame comes from rclFrame, not the device bounds', () => {
        const p = parse(emf([erec(43, cat(e32(0), e32(0), e32(50), e32(25)))], [0, 0, 50, 25], [0, 0, 2500, 1250]));
        const w = (2500 * 72) / 2540;
        expect(close(p.width, w)).toBe(true);
        const s = pathOf(p.items[0]).segs[1];
        expect(s.k === 'L' && close(s.x, w / 2)).toBe(true);
    });

    it('the bounds stand in when the frame is empty', () => {
        const p = parse(emf([erec(43, cat(e32(0), e32(0), e32(50), e32(25)))], [0, 0, 50, 25], [0, 0, 0, 0]));
        expect([p.width, p.height]).toEqual([50, 25]);
    });

    it('a BLACKNESS BITBLT fills black without a source', () => {
        const s = pathOf(parse(emf([erec(76, cat(new Array(16).fill(0), e32(10), e32(20), e32(30), e32(40), e32(0x42)))], [0, 0, 0, 0], [0, 0, 0, 0])).items[0]);
        expect(s.fill).toEqual([0, 0, 0, 255]);
        expect(s.stroke).toBeNull();
        expect(s.segs.length).toBe(5);
    });

    it('SAVEDC past the stack cap stops the parse', () => {
        const recs = Array.from({ length: MAX_STACK + 1 }, () => erec(33, []));
        recs.push(erec(43, cat(e32(0), e32(0), e32(10), e32(10))));
        expect(parse(emf(recs, [0, 0, 0, 0], [0, 0, 0, 0])).items).toEqual([]);
    });

    it('POLYBEZIERTO16 continues the open path', () => {
        const bez = cat(new Array(16).fill(0), e32(3), h16(10), h16(10), h16(20), h16(10), h16(20), h16(0));
        const p = parse(emf([erec(59, []), erec(27, cat(e32(0), e32(0))), erec(54, cat(e32(10), e32(0))), erec(88, bez), erec(61, []), erec(62, new Array(16).fill(0))], [0, 0, 0, 0], [0, 0, 0, 0]));
        expect(p.items.length).toBe(1);
        expect(pathOf(p.items[0]).segs).toEqual([Mv(0, 0), Ln(10, 0), { k: 'C', x1: 10, y1: 10, x2: 20, y2: 10, x: 20, y: 0 }, Zs]);
    });

    it('POLYBEZIER starts its own figure and keeps the current point', () => {
        const bez = cat(new Array(16).fill(0), e32(4), e32(0), e32(0), e32(5), e32(5), e32(10), e32(5), e32(10), e32(0));
        const p = parse(emf([erec(27, cat(e32(3), e32(3))), erec(2, bez), erec(54, cat(e32(50), e32(50)))], [0, 0, 0, 0], [0, 0, 0, 0]));
        expect(p.items.length).toBe(2);
        expect(pathOf(p.items[0]).segs[0]).toEqual(Mv(0, 0));
        expect(pathOf(p.items[1]).segs).toEqual([Mv(3, 3), Ln(50, 50)]);
    });

    it('a null pen is recognised under extra style bits', () => {
        const pen = erecAt(38, 28, [[8, 0], [12, 0x105], [16, 1], [24, 0]]);
        const s = pathOf(parse(emf([pen, erec(37, h32(0)), erec(43, cat(e32(0), e32(0), e32(10), e32(10)))], [0, 0, 0, 0], [0, 0, 0, 0])).items[0]);
        expect(s.fill).toEqual([255, 255, 255, 255]);
        expect(s.stroke).toBeNull();
    });

    it('a metric map mode flips y and scales to device pixels', () => {
        const s = pathOf(parse(emf([erec(17, h32(2)), erec(27, cat(e32(0), e32(0))), erec(54, cat(e32(100), e32(50)))], [0, 0, 0, 0], [0, 0, 0, 0])).items[0]).segs as { x: number; y: number }[];
        expect(close(s[0].x, 0) && close(s[0].y, 20) && close(s[1].x, 40) && close(s[1].y, 0)).toBe(true);
    });

    it('MODIFYWORLDTRANSFORM with an unknown mode keeps the transform', () => {
        const p = parse(emf([erec(35, scale2), erec(36, cat(f32s([1, 0, 0, 1, 0, 0]), h32(99))), erec(27, cat(e32(0), e32(0))), erec(54, cat(e32(10), e32(5)))], [0, 0, 0, 0], [0, 0, 0, 0]));
        expect(pathOf(p.items[0]).segs).toEqual([Mv(0, 0), Ln(20, 10)]);
    });

    it('SETDIBITSTODEVICE draws the image at its own size', () => {
        const d = dib24();
        const rec = erecAt(80, 168, [[24, 10], [28, 20], [40, 2], [44, 2], [48, 112], [52, 40], [56, 152], [60, 16], [72, 2]], [[112, d.slice(0, 40)], [152, d.slice(40)]]);
        const b = bitmapOf(parse(emf([rec], [0, 0, 0, 0], [0, 0, 0, 0])).items[0]);
        expect(b.rect).toEqual([0, 0, 2, 2]);
        expect(b.rgba).toEqual(DIB24_RGBA);
    });

    it('SETDIBITSTODEVICE source counts from the start scan', () => {
        const d = dib24();
        const rec = erecAt(80, 168, [[24, 10], [28, 20], [36, 1], [40, 2], [44, 1], [48, 112], [52, 40], [56, 152], [60, 16], [68, 1], [72, 2]], [[112, d.slice(0, 40)], [152, d.slice(40)]]);
        const p = parse(emf([erec(43, cat(e32(0), e32(0), e32(1), e32(1))), rec], [0, 0, 0, 0], [0, 0, 0, 0]));
        const b = bitmapOf(p.items[1]);
        expect(b.rect).toEqual([10, 20, 2, 1]);
        expect(b.rgba).toEqual([0, 0, 255, 255, 0, 255, 0, 255]);
    });

    it('ALPHABLEND uses constant and per-pixel alpha', () => {
        const d = dib24();
        const rec = dibRec(114, [[24, 0], [28, 0], [32, 2], [36, 2], [44, 0], [48, 0], [100, 2], [104, 2]], [[40, [0, 0, 128, 0]]], d.slice(0, 40), d.slice(40));
        const b = bitmapOf(parse(emf([rec], [0, 0, 0, 0], [0, 0, 0, 0])).items[0]);
        expect([b.rgba[3], b.rgba[7], b.rgba[11], b.rgba[15]]).toEqual([128, 128, 128, 128]);
        const onePx = (constant: number, bgra: number[]) => {
            const r = dibRec(114, [[24, 0], [28, 0], [32, 1], [36, 1], [44, 0], [48, 0], [100, 1], [104, 1]], [[40, [0, 0, constant, 1]]], infoHeader(1, 1, 32, 4), bgra);
            return bitmapOf(parse(emf([r], [0, 0, 0, 0], [0, 0, 0, 0])).items[0]).rgba;
        };
        expect(onePx(255, [0, 0, 128, 128])).toEqual([255, 0, 0, 128]);
        expect(onePx(128, [0, 0, 128, 128])).toEqual([255, 0, 0, 64]);
        expect(onePx(255, [10, 20, 64, 128])).toEqual([128, 40, 20, 128]);
    });

    it('a SRCAND mask draws all but its white pixels', () => {
        const d = dib24();
        const b = bitmapOf(parse(emf([bitbltRec(0x008800c6, [0, 0, 2, 2], d.slice(0, 40), d.slice(40))], [0, 0, 0, 0], [0, 0, 0, 0])).items[0]);
        expect(b.rgba).toEqual([255, 0, 0, 255, 255, 255, 255, 0, 0, 0, 255, 255, 0, 255, 0, 255]);
    });

    it('SRCPAINT makes black pixels transparent', () => {
        const info = infoHeader(2, 1, 24, 8), bits = [0, 0, 0, 0, 0, 255, 0, 0];
        expect(bitmapOf(parse(emf([bitbltRec(0x00ee0086, [0, 0, 2, 1], info, bits)], [0, 0, 0, 0], [0, 0, 0, 0])).items[0]).rgba).toEqual([0, 0, 0, 0, 255, 0, 0, 255]);
        expect(bitmapOf(parse(emf([bitbltRec(0x00cc0020, [0, 0, 2, 1], info, bits)], [0, 0, 0, 0], [0, 0, 0, 0])).items[0]).rgba).toEqual([0, 0, 0, 255, 255, 0, 0, 255]);
    });

    it('point counts past the budget are rejected', () => {
        const poly = cat(new Array(16).fill(0), h32(0xffffffff), h32(0), h32(0));
        const groups = cat(new Array(16).fill(0), h32(0xffffffff), h32(0xffffffff), h32(1));
        expect(parse(emf([erec(4, poly), erec(7, groups)], [0, 0, 0, 0], [0, 0, 0, 0])).items).toEqual([]);
    });

    it('POLYPOLYGON counts must fit the record', () => {
        const short = cat(new Array(16).fill(0), h32(MAX_PATH_OPS), h32(3), h32(3));
        const two = cat(new Array(16).fill(0), h32(2), h32(6), h32(3), h32(3), ...[0, 0, 10, 0, 0, 10, 20, 0, 30, 0, 20, 10].map(h16));
        const p = parse(emf([erec(91, short), erec(91, two)], [0, 0, 0, 0], [0, 0, 0, 0]));
        expect(p.items.length).toBe(1);
        expect(pathOf(p.items[0]).segs.filter(s => s.k === 'M').length).toBe(2);
    });

    it('an EXTCREATEPEN cosmetic pen is a hairline and a null brush draws nothing', () => {
        const extPen = (style: number, width: number, brush: number) => {
            const pen = erecAt(95, 52, [[8, 1], [28, style], [32, width], [36, brush], [40, 0x0000ff00]]);
            return pathOf(parse(emf([pen, erec(37, h32(1)), erec(43, cat(e32(0), e32(0), e32(10), e32(10)))], [0, 0, 0, 0], [0, 0, 0, 0])).items[0]).stroke;
        };
        expect(extPen(0, 1, 0)).toEqual([[0, 255, 0, 255], 0]);
        expect(extPen(0x00010000, 4, 0)).toEqual([[0, 255, 0, 255], 4]);
        expect(extPen(0x00010000, 4, 1)).toBeNull();
    });

    it('INTERSECTCLIPRECT limits later records only', () => {
        const full = cat(e32(0), e32(0), e32(80), e32(40));
        const p = parse(emf([erec(43, full), erec(30, cat(e32(10), e32(5), e32(40), e32(30))), erec(43, full)], [0, 0, 80, 40], [0, 0, 0, 0]));
        expect(p.items.length).toBe(2);
        expect(regionOf(p.items[0])).toBeNull();
        expect(regionOf(p.items[1])).toEqual([[10, 5, 40, 30]]);
    });

    it('the clip follows the world transform, and SAVEDC/RESTOREDC restore it', () => {
        const clip = cat(e32(0), e32(0), e32(5), e32(5));
        let p = parse(emf([erec(35, scale2), erec(30, clip), erec(43, cat(e32(0), e32(0), e32(10), e32(10)))], [0, 0, 20, 20], [0, 0, 0, 0]));
        expect(regionOf(p.items[0])).toEqual([[0, 0, 10, 10]]);
        const full = cat(e32(0), e32(0), e32(40), e32(20));
        p = parse(emf([erec(43, full), erec(33, []), erec(30, clip), erec(43, full), erec(34, e32(-1)), erec(43, full)], [0, 0, 40, 20], [0, 0, 0, 0]));
        expect(p.items.map(regionOf)).toEqual([null, [[0, 0, 5, 5]], null]);
    });

    it('EXTSELECTCLIPRGN copies and intersects rectangles', () => {
        const data = cat(h32(32), h32(1), h32(2), h32(32), e32(0), e32(0), e32(50), e32(20), e32(0), e32(0), e32(10), e32(20), e32(30), e32(0), e32(50), e32(20));
        const payload = cat(h32(data.length), h32(5), data);
        const rect = cat(e32(0), e32(0), e32(50), e32(20));
        expect(regionOf(parse(emf([erec(75, payload), erec(43, rect)], [0, 0, 50, 20], [0, 0, 0, 0])).items[0])).toEqual([[0, 0, 10, 20], [30, 0, 50, 20]]);
        expect(regionOf(parse(emf([erec(75, payload), erec(75, cat(h32(0), h32(1))), erec(43, rect)], [0, 0, 50, 20], [0, 0, 0, 0])).items[0])).toBeNull();
        expect(regionOf(parse(emf([erec(75, payload), erec(30, cat(e32(40), e32(0), e32(80), e32(20))), erec(43, rect)], [0, 0, 80, 20], [0, 0, 0, 0])).items[0])).toEqual([[40, 0, 50, 20]]);
    });

    it('EXTSELECTCLIPRGN rectangles are device units, untouched by the window origin', () => {
        // Beyond DeckCraft, which maps them as logical units (LibreOffice TestNegativeWinOrg).
        const data = cat(h32(32), h32(1), h32(1), h32(16), e32(0), e32(0), e32(50), e32(20), e32(0), e32(0), e32(50), e32(20));
        const p = parse(emf([erec(10, cat(e32(9), e32(-10))), erec(75, cat(h32(data.length), h32(5), data)), erec(43, cat(e32(9), e32(-10), e32(59), e32(10)))], [0, 0, 50, 20], [0, 0, 0, 0]));
        expect(regionOf(p.items[0])).toEqual([[0, 0, 50, 20]]);
    });

    it('EXCLUDECLIPRECT cuts the surface', () => {
        const p = parse(emf([erec(29, cat(e32(20), e32(0), e32(40), e32(40))), erec(43, cat(e32(0), e32(0), e32(80), e32(40)))], [0, 0, 80, 40], [0, 0, 0, 0]));
        expect(regionOf(p.items[0])).toEqual([[0, 0, 20, 40], [40, 0, 80, 40]]);
    });

    it('an empty clip drops later drawing', () => {
        const rect = cat(e32(0), e32(0), e32(20), e32(10));
        expect(parse(emf([erec(43, rect), erec(30, cat(e32(5), e32(5), e32(5), e32(8))), erec(43, rect)], [0, 0, 20, 10], [0, 0, 0, 0])).items.length).toBe(1);
    });
});

// ── beyond DeckCraft ──────────────────────────────────────────────────────────────────────

describe('records DeckCraft skips', () => {
    const z4 = [0, 0, 0, 0];
    it('PALETTEINDEX colours resolve against the selected palette (WMF)', () => {
        // CREATEPALETTE (red, yellow), SELECTPALETTE, a pen of index 0 and a brush of index 1.
        const p = parse(wmf([
            wrec(0x00f7, cat(h16(0x300), h16(2), [255, 0, 0, 0], [255, 255, 0, 0])),
            wrec(0x0234, h16(0)),
            wrec(0x02fa, cat(h16(0), h16(5), h16(0), h32(0x01000000))), wrec(0x012d, h16(1)),
            wrec(0x02fc, cat(h16(0), h32(0x01000001), h16(0))), wrec(0x012d, h16(2)),
            wrec(0x041b, cat(h16(10), h16(10), h16(0), h16(0))),
        ]));
        const s = pathOf(p.items[0]);
        expect(s.fill).toEqual([255, 255, 0, 255]);
        expect(s.stroke![0]).toEqual([255, 0, 0, 255]);
    });

    it('SELECTCLIPPATH clips to a convex path', () => {
        const p = parse(emf([erec(59, []), erec(42, cat(e32(0), e32(0), e32(40), e32(20))), erec(60, []), erec(67, h32(5)), erec(43, cat(e32(0), e32(0), e32(40), e32(20)))], [0, 0, 40, 20], z4));
        // Filled and stroked: the cut comes back as a fill item and an outline item.
        expect(p.items.length).toBe(2);
        const s = pathOf(p.items[0]);
        expect(s.fill).not.toBeNull();
        // The rectangle's corners are cut away: no point of the fill reaches (0, 0).
        expect(s.segs.length).toBeGreaterThan(10);
        expect(s.segs.some(g => g.k !== 'Z' && g.k !== 'C' && Math.hypot(g.x, g.y) < 3)).toBe(false);
    });

    it('FILLRGN fills each rectangle with the named brush', () => {
        const rgn = cat(h32(32), h32(1), h32(2), h32(32), e32(0), e32(0), e32(30), e32(30), e32(0), e32(0), e32(10), e32(10), e32(20), e32(20), e32(30), e32(30));
        const p = parse(emf([erec(39, cat(h32(1), h32(0), h32(0xff), h32(0))), erec(71, cat(e32(0), e32(0), e32(30), e32(30), h32(rgn.length), h32(1), rgn))], [0, 0, 30, 30], z4));
        expect(p.items.length).toBe(2);
        expect(p.items.map(i => pathOf(i).fill)).toEqual([[255, 0, 0, 255], [255, 0, 0, 255]]);
        expect(rectExtent(p.items[1])).toEqual([20, 20, 30, 30]);
    });

    it('ANGLEARC draws a line to the arc, then the arc, and moves the current point', () => {
        const p = parse(emf([erec(27, cat(e32(0), e32(50))), erec(41, cat(e32(50), e32(50), h32(20), f32s([0, 90]))), erec(54, cat(e32(0), e32(0)))], z4, z4));
        const s = pathOf(p.items[0]).segs;
        expect(s[0]).toEqual(Mv(0, 50));
        expect(s[1]).toEqual(Ln(70, 50));
        const end = s[s.length - 1];
        // Counter-clockwise, y up on screen: from (70, 50) a quarter turn to (50, 30).
        expect(end.k === 'C' && close(end.x, 50) && close(end.y, 30)).toBe(true);
        const next = pathOf(p.items[1]).segs[0];
        expect(next.k === 'M' && close(next.x, 50) && close(next.y, 30)).toBe(true);
    });

    it('POLYDRAW draws moves, lines and Béziers with closes', () => {
        const pts = [[0, 0], [10, 0], [10, 10], [20, 0], [20, 10], [30, 10], [30, 0]];
        const types = [6, 2, 3, 6, 4, 4, 4];
        const p = parse(emf([erec(56, cat(z4.flatMap(e32), h32(pts.length), ...pts.map(q => cat(e32(q[0]), e32(q[1]))), types))], z4, z4));
        const s = pathOf(p.items[0]).segs;
        expect(s.map(g => g.k).join('')).toBe('MMLLZMC');
    });

    it('an anisotropic EMF with a window but no viewport draws at one unit per device unit', () => {
        // LibreOffice TestExtSelectClipRgnCopy: the bounds say the 200-unit rectangle drew 200 device units.
        const data = cat(h32(32), h32(1), h32(1), h32(16), e32(50), e32(50), e32(150), e32(150), e32(50), e32(50), e32(150), e32(150));
        const p = parse(emf([erec(17, h32(8)), erec(9, cat(e32(200), e32(200))), erec(75, cat(h32(data.length), h32(5), data)), erec(43, cat(e32(0), e32(0), e32(200), e32(200)))], [0, 0, 200, 200], z4));
        expect(p.items.length).toBe(1);
        expect(rectExtent(p.items[0])).toEqual([0, 0, 200, 200]);
        expect(regionOf(p.items[0])).toEqual([[50, 50, 150, 150]]);
    });

    it('SETARCDIRECTION(AD_CLOCKWISE) turns an arc the other way', () => {
        const arcRec = erec(45, cat(e32(0), e32(0), e32(20), e32(20), e32(20), e32(10), e32(10), e32(0)));
        const ccw = pathOf(parse(emf([arcRec], z4, z4)).items[0]).segs;
        const cw = pathOf(parse(emf([erec(57, h32(2)), arcRec], z4, z4)).items[0]).segs;
        expect(ccw.filter(g => g.k === 'C').length).toBe(1);
        expect(cw.filter(g => g.k === 'C').length).toBe(3);
    });
});

// ── text ──────────────────────────────────────────────────────────────────────────────────

describe('metafile text', () => {
    /** META_CREATEFONTINDIRECT: height, width, escapement (and orientation), weight, italic/underline/strike, charset, four precision bytes, the face. */
    const wfont = (height: number, weight: number, flags: number[], charset: number, esc: number, face: string) =>
        wrec(0x02fb, cat(h16(height), h16(0), h16(esc), h16(esc), h16(weight), flags, [charset, 0, 0, 0, 0], [...face].map(c => c.charCodeAt(0)), [0]));
    const wtext = (x: number, y: number, s: number[], opts: number, rect: number[] | null, dx: number[]) =>
        wrec(0x0a32, cat(h16(y), h16(x), h16(s.length), h16(opts), (rect ?? []).flatMap(h16), s, s.length % 2 ? [0] : [], dx.flatMap(h16)));
    const bytes = (s: string) => [...s].map(c => c.charCodeAt(0));
    /** A plain WMF whose 200×100 window maps one logical unit to one picture unit. */
    const wmf200 = (records: number[][]) => parse(wmf([wrec(0x020c, cat(h16(100), h16(200))), ...records]));

    it('reads the font, string, dx, colour and alignment', () => {
        const p = wmf200([wfont(-20, 700, [1, 1, 1], 0, 0, 'Arial'), wrec(0x012d, h16(0)), wrec(0x0209, h32(0xff)), wrec(0x0102, h16(1)), wrec(0x012e, h16(24 | 6)), wtext(50, 60, bytes('Hi!'), 0, null, [10, 8, 6])]);
        const t = texts(p);
        expect(t.length).toBe(1);
        expect(t[0].text).toBe('Hi!');
        expect(t[0].dx).toEqual([10, 8, 6]);
        expect(t[0].font).toMatchObject({ family: 'Arial', height: -20, weight: 700, italic: true, underline: true, strike: true });
        expect(t[0].color).toEqual([255, 0, 0, 255]);
        expect(t[0].background).toBeNull();
        expect([t[0].hAlign, t[0].vAlign]).toEqual(['center', 'baseline']);
        expect(close6(t[0].transform, [1, 0, 0, 1, 50, 60])).toBe(true);
        expect(t[0].clip).toBeNull();
    });

    it('keeps the font height sign and the default state', () => {
        let t = texts(wmf200([wfont(30, 400, [0, 0, 0], 0, 0, 'Times New Roman'), wrec(0x012d, h16(0)), wtext(5, 5, bytes('x'), 0, null, [])]))[0];
        expect([t.font.height, t.font.family]).toEqual([30, 'Times New Roman']);
        expect([t.hAlign, t.vAlign]).toEqual(['left', 'top']);
        expect(t.background).toEqual([255, 255, 255, 255]);
        expect(t.dx).toEqual([]);
        t = texts(wmf200([wrec(0x012e, h16(2 | 8)), wtext(5, 5, bytes('x'), 0, null, [])]))[0];
        expect([t.hAlign, t.vAlign]).toEqual(['right', 'bottom']);
        expect(t.font.family).toBe('');
    });

    it('escapement turns the baseline counter-clockwise', () => {
        const t = texts(wmf200([wfont(-20, 400, [0, 0, 0], 0, 900, 'Arial'), wrec(0x012d, h16(0)), wtext(100, 90, bytes('Up'), 0, null, [])]))[0];
        expect(close6(t.transform, [0, -1, 1, 0, 100, 90])).toBe(true);
    });

    it('a y-up mapping moves text but does not mirror it', () => {
        const p = parse(wmf([wrec(0x0103, h16(8)), wrec(0x020c, cat(h16(-100), h16(200))), wrec(0x020e, cat(h16(100), h16(200))), wtext(40, -30, bytes('A'), 0, null, [])]));
        expect(close6(texts(p)[0].transform, [1, 0, 0, 1, 40, 30])).toBe(true);
    });

    it('TA_UPDATECP starts at the current position and moves past the string', () => {
        const t = texts(wmf200([wrec(0x012e, h16(1)), wrec(0x0214, cat(h16(20), h16(10))), wtext(0, 0, bytes('ab'), 0, null, [5, 7]), wtext(0, 0, bytes('c'), 0, null, [3])]));
        expect(close6(t[0].transform, [1, 0, 0, 1, 10, 20])).toBe(true);
        expect(close6(t[1].transform, [1, 0, 0, 1, 22, 20])).toBe(true);
    });

    it('ETO_OPAQUE fills the rectangle and ETO_CLIPPED clips', () => {
        const p = wmf200([wrec(0x0201, h32(0x0000ff00)), wtext(12, 30, bytes('ok'), 2 | 4, [10, 10, 60, 40], [])]);
        expect(p.items.length).toBe(2);
        expect(rectExtent(p.items[0])).toEqual([10, 10, 60, 40]);
        expect(pathOf(p.items[0]).fill).toEqual([0, 255, 0, 255]);
        expect(texts(p)[0].clip).toEqual([10, 10, 60, 40]);
        expect(texts(p)[0].background).toEqual([0, 255, 0, 255]);
    });

    it('decodes bytes through the character set', () => {
        const one = (charset: number, s: number[]) => texts(wmf200([wfont(-10, 400, [0, 0, 0], charset, 0, 'F'), wrec(0x012d, h16(0)), wtext(0, 0, s, 0, null, [])]))[0].text;
        expect(one(0, [0x41, 0x80, 0x93, 0x94, 0xe9])).toBe('A€“”é');
        expect(one(238, [0xb9, 0xe8, 0x9e, 0xa3])).toBe('ąčžŁ');
        expect(one(204, [0xc0, 0xff, 0xa8])).toBe('АяЁ');
        expect(one(2, [0x6e, 0xa7])).toBe('');
        expect(one(0, [0x81])).toBe('�');
        const t = texts(wmf200([wfont(-10, 400, [0, 0, 0], 128, 0, 'F'), wrec(0x012d, h16(0)), wtext(0, 0, [0x41, 0x82, 0xa0, 0x42], 0, null, [1, 2, 3, 4])]))[0];
        expect([t.text, t.dx]).toEqual(['A B', [1, 5, 4]]);
    });

    it('TEXTOUT reads its string and position', () => {
        const t = texts(wmf200([wrec(0x0521, cat(h16(3), bytes('abc'), [0], h16(40), h16(30)))]))[0];
        expect(t.text).toBe('abc');
        expect(close6(t.transform, [1, 0, 0, 1, 30, 40])).toBe(true);
    });

    it('SAVEDC restores the text colour and font', () => {
        const t = texts(wmf200([wfont(-10, 400, [0, 0, 0], 0, 0, 'One'), wrec(0x012d, h16(0)), wrec(0x0209, h32(0xff)), wrec(0x001e, []), wfont(-10, 400, [0, 0, 0], 0, 0, 'Two'), wrec(0x012d, h16(1)), wrec(0x0209, h32(0xff0000)), wrec(0x0127, h16(-1)), wtext(0, 0, bytes('x'), 0, null, [])]))[0];
        expect([t.font.family, t.color]).toEqual(['One', [255, 0, 0, 255]]);
    });

    /** EMR_EXTCREATEFONTINDIRECTW in slot 1. */
    const efont = (height: number, esc: number, weight: number, italic: number, charset: number, face: string) => {
        const name = new Array(64).fill(0);
        [...face].forEach((c, i) => { name[i * 2] = c.charCodeAt(0) & 0xff; name[i * 2 + 1] = c.charCodeAt(0) >> 8; });
        return erec(82, cat(h32(1), e32(height), e32(0), e32(esc), e32(esc), e32(weight), [italic, 0, 0, charset, 0, 0, 0, 0], name));
    };
    /** EMR_EXTTEXTOUTW (or A) with the string at 76 (60 under ETO_NO_RECT) and the dx array after it. */
    const etext = (wide: boolean, x: number, y: number, units: number[], opts: number, dx: number[]) => {
        const noRect = (opts & 0x100) !== 0;
        const sOff = noRect ? 60 : 76;
        const s = wide ? units.flatMap(u => [u & 0xff, u >> 8]) : units.map(u => u & 0xff);
        const dxOff = Math.ceil((sOff + s.length) / 4) * 4;
        const len = Math.ceil((dxOff + dx.length * 4) / 4) * 4;
        return erecAt(wide ? 84 : 83, len, [[24, 1], [36, x], [40, y], [44, units.length], [48, sOff], [52, opts], [noRect ? 56 : 72, dx.length ? dxOff : 0]], [[sOff, s], [dxOff, dx.flatMap(e32)]]);
    };
    const efile = (recs: number[][]) => parse(emf(recs, [0, 0, 200, 100], [0, 0, 5000, 2500]));

    it('EXTTEXTOUTW reads UTF-16, dx and the font', () => {
        const t = texts(efile([efont(24, 0, 400, 1, 0, 'Segoe UI'), erec(37, h32(1)), erec(22, h32(0x18 | 2)), erec(24, h32(0x0000ff00)), erec(18, h32(1)), etext(true, 100, 50, [0x41, 0xd83d, 0xde00], 0, [10, 6, 0])]));
        expect(t.length).toBe(1);
        expect(t[0].text).toBe('A\u{1F600}');
        expect(t[0].dx).toEqual([10, 6]);
        expect([t[0].font.family, t[0].font.height, t[0].font.italic]).toEqual(['Segoe UI', 24, true]);
        expect([t[0].hAlign, t[0].vAlign, t[0].color, t[0].background]).toEqual(['right', 'baseline', [0, 255, 0, 255], null]);
        const [a, b, c, d] = t[0].transform;
        expect(a > 0 && d > 0 && Math.abs(b) < 1e-9 && Math.abs(c) < 1e-9 && Math.abs(a - d) < 1e-9).toBe(true);
    });

    it('ETO_PDY, ETO_NO_RECT, ANSI strings and glyph indices', () => {
        expect(texts(efile([etext(true, 0, 0, [0x61, 0x62], 0x2000 | 0x100, [7, 1, 9, 2])]))[0].dx).toEqual([7, 9]);
        expect(texts(efile([efont(-10, 0, 400, 0, 238, 'F'), erec(37, h32(1)), etext(false, 0, 0, [0xb9], 0, [])]))[0].text).toBe('ą');
        expect(texts(efile([etext(true, 0, 0, [5, 6], 0x10, [])]))).toEqual([]);
    });

    it('SMALLTEXTOUT reads 8-bit and 16-bit strings', () => {
        const small = (opts: number, chars: number[]) => erec(108, cat(e32(3), e32(4), h32(2), h32(opts), h32(1), h32(0), h32(0), chars));
        expect(texts(efile([small(0x100 | 0x200, bytes('hi'))]))[0].text).toBe('hi');
        expect(texts(efile([small(0x100, [0x6f, 0, 0x6b, 0])]))[0].text).toBe('ok');
    });
});

// ── EMF+ ──────────────────────────────────────────────────────────────────────────────────

describe('EMF+ records', () => {
    /** One EMF+ record: type, flags, size, data size, data (padded to 4). */
    const prec = (typ: number, flags: number, data: number[]) => {
        const d = data.slice();
        while (d.length % 4) d.push(0);
        return cat([typ & 0xff, typ >> 8, flags & 0xff, flags >> 8], h32(12 + d.length), h32(d.length), d);
    };
    const plusComment = (recs: number[][]) => { const body = recs.flat(); return erec(70, cat(h32(body.length + 4), h32(0x2b464d45), body)); };
    const plusHeader = (dual: boolean) => prec(0x4001, dual ? 1 : 0, cat(h32(0xdbc01002), h32(0), h32(96), h32(96)));
    const solidPen = (argb: number, width: number) => cat(h32(0xdbc01002), h32(0), h32(0), h32(0), f32s([width]), h32(0xdbc01002), h32(0), h32(argb));
    const plusPic = (recs: number[][]) => parse(emf([plusComment([plusHeader(false), ...recs])], [0, 0, 0, 0], [0, 0, 0, 0]));

    it('an EMF+-only file fills rectangles with an ARGB colour', () => {
        const p = plusPic([prec(0x400a, 0x8000, cat(h32(0xff0080ff), h32(1), f32s([10, 20, 30, 40])))]);
        expect(p.items.length).toBe(1);
        const s = pathOf(p.items[0]);
        expect(s.fill).toEqual([0x00, 0x80, 0xff, 0xff]);
        expect(s.stroke).toBeNull();
        expect([p.width, p.height]).toEqual([30, 40]);
        expect(s.segs[0]).toEqual(Mv(0, 0));
        expect(s.segs).toContainEqual(Ln(30, 40));
    });

    it('a dual file draws only its EMF records', () => {
        const fill = prec(0x400a, 0x8000, cat(h32(0xffff0000), h32(1), f32s([0, 0, 5, 5])));
        const p = parse(emf([plusComment([plusHeader(true), fill]), erec(43, cat(e32(0), e32(0), e32(9), e32(9)))], [0, 0, 0, 0], [0, 0, 0, 0]));
        expect(p.items.length).toBe(1);
        expect(pathOf(p.items[0]).fill).toEqual([255, 255, 255, 255]);
    });

    it('a pen object draws lines under a scale transform', () => {
        const p = plusPic([prec(0x4008, 0x0200 | 3, solidPen(0xff00ff00, 2)), prec(0x402e, 0, f32s([2, 3])), prec(0x400d, 3, cat(h32(2), f32s([1, 1, 4, 2])))]);
        const s = pathOf(p.items[0]);
        expect(s.segs).toEqual([Mv(0, 0), Ln(6, 3)]);
        expect(s.fill).toBeNull();
        expect(s.stroke![0]).toEqual([0, 255, 0, 255]);
        expect(s.stroke![1]).toBeGreaterThan(0);
    });

    it('a path object fills with a brush object, and RESTORE undoes the transform', () => {
        const brush = prec(0x4008, 0x0100 | 1, cat(h32(0xdbc01002), h32(0), h32(0x80123456)));
        const path = prec(0x4008, 0x0300 | 2, cat(h32(0xdbc01002), h32(3), h32(0), f32s([0, 0, 10, 0, 0, 10]), [0, 1, 0x81]));
        const p = plusPic([brush, path, prec(0x4025, 0, h32(7)), prec(0x402d, 0, f32s([100, 0])), prec(0x4026, 0, h32(7)), prec(0x4014, 2, h32(1))]);
        const s = pathOf(p.items[0]);
        expect(s.fill).toEqual([0x12, 0x34, 0x56, 0x80]);
        expect(s.segs).toEqual([Mv(0, 0), Ln(10, 0), Ln(0, 10), Zs]);
    });

    /** A 2×2 32bpp ARGB bitmap image object: red, green / blue, white. */
    const bitmap2x2 = () => cat(h32(0xdbc01002), h32(1), h32(2), h32(2), h32(8), h32(0x0026200a), h32(0), ...[0xffff0000, 0xff00ff00, 0xff0000ff, 0xffffffff].map(h32));
    const drawImage = (id: number, dst: number[]) => prec(0x401a, id, cat(h32(0), h32(2), f32s([0, 0, 2, 2]), f32s(dst)));

    it('DrawImage places the bitmap', () => {
        const b = bitmapOf(plusPic([prec(0x4008, 0x0500 | 4, bitmap2x2()), drawImage(4, [10, 10, 20, 40])]).items[0]);
        expect([b.w, b.h]).toEqual([2, 2]);
        expect(b.rect).toEqual([0, 0, 20, 40]);
        expect(b.rgba.slice(0, 12)).toEqual([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]);
    });

    it('an object split across records is joined', () => {
        const obj = bitmap2x2();
        const first = prec(0x4008, 0x8000 | 0x0500 | 1, cat(h32(obj.length), obj.slice(0, 20)));
        const second = prec(0x4008, 0x0500 | 1, obj.slice(20));
        const b = bitmapOf(plusPic([first, second, drawImage(1, [0, 0, 4, 4])]).items[0]);
        expect([b.w, b.h]).toEqual([2, 2]);
    });

    it('garbage records never throw', () => {
        let s = 0x12345678;
        for (let k = 0; k < 300; k++) {
            const recs = [plusHeader(false)];
            for (let j = 0; j < 6; j++) {
                s = (Math.imul(s, 1103515245) + 12345) >>> 0;
                const typ = 0x4000 + ((s >>> 16) % 0x40);
                recs.push(prec(typ, (s >>> 8) & 0xffff, Array.from({ length: s % 64 }, (_, i) => ((s << i) | (s >>> (32 - i))) & 0xff)));
            }
            expect(() => { try { parse(emf([plusComment(recs)], [0, 0, 0, 0], [0, 0, 0, 0])); } catch (e) { if (!(e instanceof MetafileError)) throw e; } }).not.toThrow();
        }
    });
});

// ── limits and robustness ─────────────────────────────────────────────────────────────────

describe('limits and hostile input', () => {
    it('the item cap stops the parse and keeps the rest', () => {
        const rect = wrec(0x041b, cat(h16(10), h16(10), h16(0), h16(0)));
        const p = parse(wmf(Array.from({ length: MAX_ITEMS + 10 }, () => rect)));
        expect(p.items.length).toBe(MAX_ITEMS);
    });

    it('the canvas stops at the byte budget', () => {
        const cv = new Canvas();
        const big = () => ({ w: 1, h: 1, bottomUp: false, px: new Uint8Array(MAX_BYTES / 2) });
        cv.bitmap([0, 0, 1, 1], big());
        cv.bitmap([0, 0, 1, 1], big());
        expect(cv.full()).toBe(false);
        cv.bitmap([0, 0, 1, 1], big());
        expect(cv.full()).toBe(true);
        expect(cv.items.length).toBe(2);
    });

    it('detects metafiles and rejects garbage', () => {
        expect(isMetafile(wmf([wrec(0x041b, cat(h16(1), h16(1), h16(0), h16(0)))]))).toBe(true);
        expect(isMetafile(emf([erec(42, cat(e32(0), e32(0), e32(4), e32(4)))], [0, 0, 0, 0], [0, 0, 0, 0]))).toBe(true);
        const junk = new TextEncoder().encode('hello world, not a metafile');
        expect(isMetafile(junk)).toBe(false);
        expect(() => parse(junk)).toThrow(MetafileError);
        expect(() => parse(new Uint8Array(0))).toThrow(MetafileError);
    });

    it('round rectangles accept reversed corners', () => {
        const normal = roundRect(0, 0, 10, 20, 4, 4);
        expect(roundRect(10, 20, 0, 0, 4, 4)).toEqual(normal);
        expect(roundRect(10, 0, 0, 20, 4, 4)).toEqual(normal);
    });

    it('flip tolerates a short pixel buffer', () => {
        const a = { w: 2, h: 2, bottomUp: false, px: new Uint8Array(7).fill(1) };
        flip(a, true, true);
        expect(a.px.length).toBe(7);
        const b = { w: 1, h: 4, bottomUp: false, px: Uint8Array.from({ length: 12 }, (_, i) => i) };
        flip(b, false, true);
        expect([...b.px]).toEqual([8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3]);
    });

    it('truncated, random and mutated inputs never throw anything but MetafileError', () => {
        const wfile = wmf([wrec(0x02fc, cat(h16(0), h32(0xff), h16(0))), wrec(0x012d, h16(0)), wrec(0x041b, cat(h16(10), h16(10), h16(0), h16(0))), wrec(0x0325, cat(h16(2), h16(0), h16(0), h16(5), h16(5)))], [0, 0, 20, 10]);
        const payload = cat(new Array(16).fill(0), e32(0), e32(0), e32(0), e32(0), e32(2), e32(2), e32(80), e32(40), e32(120), e32(16), e32(0), e32(0), e32(20), e32(10), infoHeader(2, 2, 24, 16), dib24().slice(40));
        const efile2 = emf([erec(59, []), erec(27, cat(e32(0), e32(0))), erec(54, cat(e32(9), e32(9))), erec(61, []), erec(60, []), erec(63, new Array(16).fill(0)), erec(81, payload), erec(86, cat(h32(4), h16(0), h16(0), h16(9), h16(9), h16(0), h16(9)))], [0, 0, 20, 10], [0, 0, 2540, 1270]);
        const tryParse = (b: Uint8Array) => { try { parse(b); isMetafile(b); } catch (e) { if (!(e instanceof MetafileError)) throw e; } };
        for (const file of [wfile, efile2]) for (let n = 0; n <= file.length; n++) tryParse(file.subarray(0, n));
        let seed = 0x2545f491n;
        const rnd = () => { seed = (seed * 6364136223846793005n + 1442695040888963407n) & 0xffffffffffffffffn; return Number(seed >> 33n); };
        for (let i = 0; i < 1500; i++) tryParse(Uint8Array.from({ length: rnd() % 400 }, () => rnd() & 0xff));
        for (let i = 0; i < 1500; i++) {
            const buf = (i % 2 ? wfile : efile2).slice();
            for (let k = 0; k < 8; k++) buf[rnd() % buf.length] = rnd() & 0xff;
            tryParse(buf);
        }
        for (let i = 0; i < 500; i++) {
            const buf = (i % 2 ? wfile : efile2).slice();
            buf.fill(0xff, rnd() % buf.length);
            tryParse(buf);
        }
    });
});

// ── SVG ───────────────────────────────────────────────────────────────────────────────────

describe('metafile pictures as SVG', () => {
    it('writes paths with fill, rule, stroke and hairlines', () => {
        const p = parse(wmf([wrec(0x02fc, cat(h16(0), h32(0xff), h16(0))), wrec(0x012d, h16(0)), wrec(0x041b, cat(h16(70), h16(110), h16(20), h16(10)))]));
        const svg = pictureToSvg(p);
        expect(svg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg"');
        expect(svg).toContain('viewBox="0 0 100 50"');
        expect(svg).toContain('<path d="M0 0L100 0L100 50L0 50Z" fill="rgb(255,0,0)" fill-rule="evenodd" stroke="rgb(0,0,0)" stroke-width="1" vector-effect="non-scaling-stroke"/>');
        expect(svg).toContain('width="133.333" height="66.667"');
    });

    it('embeds bitmaps as PNG and clips by region', () => {
        const params = cat(h32(0x00cc0020), h16(0), h16(2), h16(2), h16(0), h16(0), h16(10), h16(20), h16(0), h16(0), dib24());
        const p = parse(wmf([wrec(0x0416, cat(h16(10), h16(10), h16(0), h16(0))), wrec(0x0f43, params)]));
        const svg = pictureToSvg(p);
        expect(svg).toMatch(/<clipPath id="r\d+"><rect x="0" y="0" width="10" height="10"\/><\/clipPath>/);
        expect(svg).toContain('<image href="data:image/png;base64,iVBORw0KGgo');
    });

    it('writes text with the font, alignment and per-character positions', () => {
        const wfont = wrec(0x02fb, cat(h16(-20), h16(0), h16(0), h16(0), h16(700), [1, 0, 0], [0, 0, 0, 0, 0], [...'Arial'].map(c => c.charCodeAt(0)), [0]));
        const p = parse(wmf([wrec(0x020c, cat(h16(100), h16(200))), wfont, wrec(0x012d, h16(0)), wrec(0x0102, h16(1)), wrec(0x012e, h16(24)), wrec(0x0a32, cat(h16(60), h16(50), h16(3), h16(0), [0x48, 0x69, 0x21, 0], h16(10), h16(8), h16(6)))]));
        const svg = pictureToSvg(p);
        expect(svg).toContain('<g transform="matrix(1 0 0 1 50 60)"><text x="0 10 18" y="0"');
        expect(svg).toContain(`font-family="'Arial', sans-serif"`);
        expect(svg).toContain('font-size="20"');
        expect(svg).toContain('font-weight="bold" font-style="italic"');
        expect(svg).toContain('>Hi!</text>');
    });

    it('escapes text and maps symbol fonts', () => {
        expect(symbolChar('Symbol', '')).toBe('α');
        expect(symbolChar('Symbol', 'p')).toBe('π');
        expect(symbolChar('Wingdings', '')).toBe('✔');
        expect(symbolChar('Wingdings', '')).toBe('•');
        expect(symbolChar('Arial', 'x')).toBe('x');
        const p = parse(wmf([wrec(0x020c, cat(h16(100), h16(200))), wrec(0x0521, cat(h16(3), [0x3c, 0x26, 0x3e, 0], h16(10), h16(10)))]));
        expect(pictureToSvg(p)).toContain('&lt;&amp;&gt;</text>');
    });

    it('drops characters XML forbids from text', () => {
        const p = parse(wmf([wrec(0x020c, cat(h16(100), h16(200))), wrec(0x0521, cat(h16(3), [0x61, 0x00, 0x01, 0], h16(10), h16(10)))]));
        const svg = pictureToSvg(p);
        expect(svg).toContain('>a</text>');
        expect(svg).not.toMatch(/[\u0000-\u0008]/);
    });

    it('writes hatch brushes as a shared PNG pattern', () => {
        const hatch = wrec(0x02fc, cat(h16(2), h32(0xff), h16(4)));
        const p = parse(wmf([hatch, wrec(0x012d, h16(0)), wrec(0x041b, cat(h16(10), h16(10), h16(0), h16(0))), wrec(0x041b, cat(h16(20), h16(20), h16(10), h16(10)))]));
        const svg = pictureToSvg(p);
        expect(svg.match(/<pattern /g)?.length).toBe(1);
        expect(svg.match(/fill="url\(#p\d+\)"/g)?.length).toBe(2);
    });
});

describe('metafileToSvgImage (PowerPoint import)', () => {
    it('gives an SVG data URL sized in CSS px from the picture frame', () => {
        const img = metafileToSvgImage(wmf([wrec(0x041b, cat(h16(1440), h16(2880), h16(0), h16(0)))], [0, 0, 2880, 1440]));
        expect(img).not.toBeNull();
        expect([img!.w, img!.h]).toEqual([192, 96]);
        expect(img!.url).toStartWith('data:image/svg+xml;base64,');
        expect(atob(img!.url.slice('data:image/svg+xml;base64,'.length))).toBe(img!.svg);
    });

    it('is null for garbage and for a picture that draws nothing', () => {
        expect(metafileToSvgImage(new TextEncoder().encode('not a metafile'))).toBeNull();
        expect(metafileToSvgImage(wmf([wrec(0x0104, h16(11)), wrec(0x041b, cat(h16(10), h16(10), h16(0), h16(0)))], [0, 0, 10, 10]))).toBeNull();
    });
});
