/**
 * A baseline TIFF decoder, for pictures in PowerPoint decks (browsers can't show TIFF).
 *
 * Covers what Office and scanners write in practice: the first image of the file, in strips or
 * tiles, uncompressed, PackBits, LZW or Deflate, with or without the horizontal predictor;
 * bilevel/grey (1, 2, 4, 8 or 16 bits, either polarity), palette (1-8 bits), RGB and RGBA
 * (8 or 16 bits, alpha associated or not), and CMYK (8 bits, chunky). Anything else — JPEG-in-TIFF,
 * YCbCr, planar layouts, floating point, BigTIFF — returns null and the importer keeps its
 * placeholder.
 *
 * The input is untrusted: every offset is bounds-checked, the pixel count is capped, and each
 * strip's decompressed size is bounded by what that strip should hold.
 */
import { unzlibSync, inflateSync } from 'fflate';
import { encodePng, toBase64 } from './metafile/png';

export interface TiffImage { w: number; h: number; rgba: Uint8Array }

/** Same ceiling as the metafile reader: ~160 MB of RGBA. */
const MAX_PIXELS = 40_000_000;

const T = {
    width: 256, height: 257, bits: 258, compression: 259, photometric: 262, stripOffsets: 273,
    samples: 277, rowsPerStrip: 278, stripBytes: 279, planar: 284, predictor: 317, colorMap: 320,
    tileW: 322, tileH: 323, tileOffsets: 324, tileBytes: 325, extra: 338, sampleFormat: 339,
} as const;

/** True when the bytes start like a (classic, not Big) TIFF file. */
export function isTiff(b: Uint8Array): boolean {
    return b.length >= 8 && ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 42 && b[3] === 0) || (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0 && b[3] === 42));
}

/** Decodes the first image of a TIFF file to RGBA8, or null when it uses something unsupported. */
export function decodeTiff(b: Uint8Array): TiffImage | null {
    try {
        return decode(b);
    } catch {
        return null; // a read past the end, a corrupt stream: not a picture we can show
    }
}

/** A TIFF as a PNG data URL with its pixel size, for an image element; null when undecodable. */
export function tiffToPngImage(b: Uint8Array): { url: string; w: number; h: number } | null {
    const img = decodeTiff(b);
    if (!img) return null;
    return { url: `data:image/png;base64,${toBase64(encodePng(img.w, img.h, img.rgba))}`, w: img.w, h: img.h };
}

function decode(b: Uint8Array): TiffImage | null {
    if (!isTiff(b)) return null;
    const le = b[0] === 0x49;
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    const need = (off: number, n: number) => { if (off < 0 || off + n > b.length) throw new RangeError('short'); };
    const u16 = (o: number) => { need(o, 2); return v.getUint16(o, le); };
    const u32 = (o: number) => { need(o, 4); return v.getUint32(o, le); };

    // ── The first IFD ──────────────────────────────────────────────────────────────────────
    const ifd = u32(4);
    const n = u16(ifd);
    const tags = new Map<number, number[]>();
    const SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 6: 1, 7: 1, 8: 2, 9: 4, 16: 8 };
    for (let i = 0; i < n; i++) {
        const e = ifd + 2 + i * 12;
        const tag = u16(e), type = u16(e + 2), count = u32(e + 4);
        const sz = SIZE[type];
        if (!sz || count > 1 << 24) continue;
        const total = sz * count;
        const at = total <= 4 ? e + 8 : u32(e + 8);
        need(at, total);
        const vals: number[] = new Array(count);
        for (let k = 0; k < count; k++) {
            const o = at + k * sz;
            vals[k] = sz === 1 ? b[o] : sz === 2 ? v.getUint16(o, le) : sz === 4 ? v.getUint32(o, le) : Number(v.getBigUint64(o, le));
        }
        tags.set(tag, vals);
    }
    const one = (t: number, d?: number) => tags.get(t)?.[0] ?? d;

    const w = one(T.width) ?? 0, h = one(T.height) ?? 0;
    if (!w || !h || w * h > MAX_PIXELS) return null;
    const spp = one(T.samples, 1)!;
    const bitsList = tags.get(T.bits) ?? [1];
    const bps = bitsList[0];
    if (bitsList.some(x => x !== bps)) return null;
    const compression = one(T.compression, 1)!;
    const photometric = one(T.photometric);
    const predictor = one(T.predictor, 1)!;
    if ((one(T.planar, 1) ?? 1) !== 1 && spp > 1) return null;
    if ((tags.get(T.sampleFormat) ?? [1]).some(f => f !== 1)) return null;
    if (![1, 5, 8, 32946, 32773].includes(compression)) return null;
    if (predictor !== 1 && predictor !== 2) return null;
    if (photometric === undefined) return null;

    // What each pixel's samples mean.
    const extra = tags.get(T.extra) ?? [];
    let mode: 'grey' | 'palette' | 'rgb' | 'cmyk';
    let colorSamples: number;
    if (photometric === 0 || photometric === 1) { mode = 'grey'; colorSamples = 1; }
    else if (photometric === 2) { mode = 'rgb'; colorSamples = 3; }
    else if (photometric === 3) { mode = 'palette'; colorSamples = 1; }
    else if (photometric === 5 && spp >= 4) { mode = 'cmyk'; colorSamples = 4; }
    else return null;
    if (spp < colorSamples) return null;
    if (mode === 'palette' ? !(bps >= 1 && bps <= 8) : mode === 'grey' ? ![1, 2, 4, 8, 16].includes(bps) : bps !== 8 && bps !== 16) return null;
    if (mode === 'cmyk' && bps !== 8) return null;
    // The first extra sample is alpha when ExtraSamples says so (1 associated, 2 unassociated).
    const alphaKind = spp > colorSamples ? (extra[0] ?? 0) : 0;
    const hasAlpha = alphaKind === 1 || alphaKind === 2;

    let palette: number[] | null = null;
    if (mode === 'palette') {
        palette = tags.get(T.colorMap) ?? null;
        if (!palette || palette.length < 3 * (1 << bps)) return null;
    }

    // ── Strips or tiles ────────────────────────────────────────────────────────────────────
    const tiled = tags.has(T.tileOffsets);
    const cw = tiled ? one(T.tileW, 0)! : w;
    const ch = tiled ? one(T.tileH, 0)! : Math.min(h, one(T.rowsPerStrip, h)! || h);
    if (!cw || !ch || cw * ch > MAX_PIXELS) return null;
    const offsets = tags.get(tiled ? T.tileOffsets : T.stripOffsets);
    const counts = tags.get(tiled ? T.tileBytes : T.stripBytes);
    if (!offsets) return null;
    const across = Math.ceil(w / cw), down = Math.ceil(h / ch);
    if (offsets.length < across * down) return null;

    const rowBytes = Math.ceil((cw * spp * bps) / 8);
    const out = new Uint8Array(w * h * 4);
    const bytesPerSample = bps === 16 ? 2 : 1;

    for (let ty = 0; ty < down; ty++) {
        for (let tx = 0; tx < across; tx++) {
            const idx = ty * across + tx;
            const off = offsets[idx];
            // A missing byte count (some writers leave it out for one-strip files): to the end.
            const len = counts?.[idx] ?? b.length - off;
            if (off >= b.length) continue;
            const raw = b.subarray(off, Math.min(b.length, off + len));
            const rows = tiled ? ch : Math.min(ch, h - ty * ch);
            const want = rowBytes * rows;
            const data = decompress(raw, compression, want);
            if (!data) return null;
            if (predictor === 2) unpredict(data, rows, rowBytes, spp, bps, le);
            const x0 = tx * cw, y0 = ty * ch;
            for (let r = 0; r < rows; r++) {
                const y = y0 + r;
                if (y >= h) break;
                const rowAt = r * rowBytes;
                if (rowAt >= data.length) break;
                for (let c = 0; c < cw; c++) {
                    const x = x0 + c;
                    if (x >= w) break;
                    const s0 = c * spp;
                    const sample = (k: number): number => readSample(data, rowAt, s0 + k, bps, le);
                    const o = (y * w + x) * 4;
                    if (mode === 'grey') {
                        const max = bps === 16 ? 65535 : (1 << bps) - 1;
                        let g = Math.round((sample(0) / max) * 255);
                        if (photometric === 0) g = 255 - g;
                        out[o] = out[o + 1] = out[o + 2] = g;
                    } else if (mode === 'palette') {
                        const i = sample(0), size = 1 << bps;
                        out[o] = palette![i] >> 8; out[o + 1] = palette![size + i] >> 8; out[o + 2] = palette![2 * size + i] >> 8;
                    } else if (mode === 'rgb') {
                        const s = bytesPerSample === 2 ? (k: number) => sample(k) >> 8 : sample;
                        out[o] = s(0); out[o + 1] = s(1); out[o + 2] = s(2);
                    } else {
                        const k = sample(3);
                        out[o] = ((255 - sample(0)) * (255 - k) / 255) | 0;
                        out[o + 1] = ((255 - sample(1)) * (255 - k) / 255) | 0;
                        out[o + 2] = ((255 - sample(2)) * (255 - k) / 255) | 0;
                    }
                    if (hasAlpha) {
                        const a = bps === 16 ? sample(colorSamples) >> 8 : bps === 8 ? sample(colorSamples) : Math.round(sample(colorSamples) / ((1 << bps) - 1) * 255);
                        out[o + 3] = a;
                        if (alphaKind === 1 && a > 0 && a < 255) {
                            for (let q = 0; q < 3; q++) out[o + q] = Math.min(255, Math.round(out[o + q] * 255 / a));
                        }
                    } else out[o + 3] = 255;
                }
            }
        }
    }
    return { w, h, rgba: out };
}

/** Sample number `i` of a row: 1/2/4-bit packed MSB-first, 8-bit, or 16-bit in the file's byte order. */
function readSample(d: Uint8Array, rowAt: number, i: number, bps: number, le: boolean): number {
    if (bps === 8) return d[rowAt + i] ?? 0;
    if (bps === 16) {
        const o = rowAt + i * 2;
        const a = d[o] ?? 0, c = d[o + 1] ?? 0;
        return le ? a | (c << 8) : (a << 8) | c;
    }
    const bit = i * bps;
    const byte = d[rowAt + (bit >> 3)] ?? 0;
    return (byte >> (8 - bps - (bit & 7))) & ((1 << bps) - 1);
}

/** Undoes horizontal differencing (Predictor 2), row by row, for 8- and 16-bit samples. */
function unpredict(d: Uint8Array, rows: number, rowBytes: number, spp: number, bps: number, le: boolean): void {
    if (bps === 8) {
        for (let r = 0; r < rows; r++) {
            const s = r * rowBytes, e = Math.min(d.length, s + rowBytes);
            for (let i = s + spp; i < e; i++) d[i] = (d[i] + d[i - spp]) & 0xff;
        }
    } else if (bps === 16) {
        const v = new DataView(d.buffer, d.byteOffset, d.byteLength);
        for (let r = 0; r < rows; r++) {
            const s = r * rowBytes, e = Math.min(d.length - 1, s + rowBytes - 1);
            for (let i = s + spp * 2; i < e; i += 2) v.setUint16(i, (v.getUint16(i, le) + v.getUint16(i - spp * 2, le)) & 0xffff, le);
        }
    }
}

/** One strip or tile, decompressed to at most `want` bytes (short data is padded with zeros). */
function decompress(raw: Uint8Array, compression: number, want: number): Uint8Array | null {
    let d: Uint8Array;
    switch (compression) {
        case 1: d = raw; break;
        case 32773: d = unpackBits(raw, want); break;
        case 5: d = lzw(raw, want); break;
        case 8: case 32946: {
            try { d = unzlibSync(raw); } catch { try { d = inflateSync(raw); } catch { return null; } }
            break;
        }
        default: return null;
    }
    if (d.length >= want) return d.length === want ? (d === raw ? d.slice() : d) : d.slice(0, want);
    const padded = new Uint8Array(want);
    padded.set(d);
    return padded;
}

/** PackBits (Apple's run-length scheme), stopping at `want` bytes. */
export function unpackBits(src: Uint8Array, want: number): Uint8Array {
    const out = new Uint8Array(want);
    let i = 0, o = 0;
    while (i < src.length && o < want) {
        const n = (src[i++] << 24) >> 24;
        if (n >= 0) {
            const end = Math.min(o + n + 1, want);
            while (o < end && i < src.length) out[o++] = src[i++];
            if (o === want) break;
        } else if (n !== -128) {
            if (i >= src.length) break;
            const val = src[i++];
            const end = Math.min(o + 1 - n, want);
            while (o < end) out[o++] = val;
        }
    }
    return out.subarray(0, o);
}

/**
 * TIFF's LZW: codes read MSB-first, 256 = clear, 257 = end, and the code width grows one code
 * early (at 511, 1023, 2047), as every TIFF writer since Aldus does. Stops at `want` bytes.
 */
export function lzw(src: Uint8Array, want: number): Uint8Array {
    const out = new Uint8Array(want);
    // The table as prefix links: entry i is (prefix[i], last byte suffix[i]) of length len[i].
    const prefix = new Int32Array(4096), suffix = new Uint8Array(4096), len = new Int32Array(4096);
    for (let i = 0; i < 256; i++) { prefix[i] = -1; suffix[i] = i; len[i] = 1; }
    let next = 258, width = 9, o = 0, old = -1;
    let bitPos = 0;
    const totalBits = src.length * 8;
    const read = (): number => {
        if (bitPos + width > totalBits) return 257;
        let c = 0;
        for (let k = 0; k < width; k++) {
            const p = bitPos + k;
            c = (c << 1) | ((src[p >> 3] >> (7 - (p & 7))) & 1);
        }
        bitPos += width;
        return c;
    };
    const emit = (code: number): number => {
        // Writes the string for `code` at o, returns its first byte.
        const l = len[code];
        let end = o + l, c = code;
        const first = (() => { let f = code; while (prefix[f] >= 0) f = prefix[f]; return suffix[f]; })();
        if (end > want) { // write only what fits
            let skip = end - want; end = want;
            while (skip-- > 0) c = prefix[c];
        }
        for (let p = end - 1; p >= o && c >= 0; p--) { out[p] = suffix[c]; c = prefix[c]; }
        o = end;
        return first;
    };
    while (o < want) {
        const code = read();
        if (code === 257) break;
        if (code === 256) { next = 258; width = 9; old = -1; continue; }
        if (old < 0) {
            if (code > 255) break; // corrupt: the first code after a clear must be a literal
            emit(code);
            old = code;
            continue;
        }
        let first: number;
        if (code < next) {
            first = emit(code);
        } else if (code === next) {
            // KwKwK: the old string plus its own first byte.
            let f = old; while (prefix[f] >= 0) f = prefix[f];
            first = suffix[f];
            if (next < 4096) { prefix[next] = old; suffix[next] = first; len[next] = len[old] + 1; }
            emit(next);
            next++;
            old = code;
            if (next + 1 >= 1 << width && width < 12) width++;
            continue;
        } else break; // corrupt
        if (next < 4096) { prefix[next] = old; suffix[next] = first; len[next] = len[old] + 1; next++; }
        old = code;
        if (next + 1 >= 1 << width && width < 12) width++;
    }
    return out.subarray(0, o);
}
