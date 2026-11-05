/**
 * WMF reader (MS-WMF). A file is an optional 22-byte placeable header, a 9-word standard header,
 * then records of (size in 16-bit words, function, parameters). Parameters are read at byte 6 of
 * each record. Ported from DeckCraft's `crates/metafile/src/wmf.rs` (MIT/Apache).
 */
import { Bytes, guard, type P } from './bytes';
import { BS_HATCHED, Canvas, brush, patternBrush, type Brush, type LogFont } from './canvas';
import * as dib from './dib';
import * as geom from './geom';
import type { ArcKind, Op } from './geom';
import { ETO_CLIPPED, ETO_OPAQUE, MAX_CHARS, decodeBytes } from './text';
import type { Rect4 } from './clip';
import { MAX_PATH_OPS } from './limits';
import { MetafileError, type Frame } from './frame';

const PLACEABLE_KEY = 0x9ac6_cdd7;
const DEFAULT_INCH = 1440;
/** A placeable WMF plays into a target sized in points; brushes are laid out in 96-dpi pixels. */
const PT_PER_PX = 72 / 96;

export function isWmf(b: Bytes): boolean {
    if (b.optU32(0) === PLACEABLE_KEY) return true;
    const t = b.optU16(0), h = b.optU16(2), v = b.optU16(4);
    return (t === 1 || t === 2) && h === 9 && (v === 0x100 || v === 0x300);
}

/** Reads all records. Returns the drawing state and the picture frame, or throws when no record could be read at all. */
export function parseWmf(input: Bytes): { cv: Canvas; frame: Frame | null } {
    const placeable = input.optU32(0) === PLACEABLE_KEY;
    // Placeable bounds: logical corners (left, top, right, bottom) and their size in points.
    let hdr = 0;
    let bounds: { c: Rect4; size: P } | null = null;
    if (placeable) {
        const c = [6, 8, 10, 12].map(o => input.optI16(o));
        if (c.some(v => v === undefined)) throw new MetafileError('BadHeader');
        const [l, t, r, b] = c as number[];
        const inch0 = input.optU16(14);
        const inch = inch0 && inch0 > 0 ? inch0 : DEFAULT_INCH;
        const w = r - l, h = b - t;
        bounds = w > 0 && h > 0 ? { c: [l, t, r, b], size: [(w * 72) / inch, (h * 72) / inch] } : null;
        hdr = 22;
    }
    const hsize = input.optU16(hdr + 2);
    if (hsize === undefined || hsize < 9) throw new MetafileError('BadHeader');
    let pos = hdr + hsize * 2;
    // Played into a target like Word does: the placeable bounds are the first window, the target (the
    // picture size) the viewport. A plain WMF's target is its first window.
    const cv = new Canvas();
    if (bounds) {
        const { c, size } = bounds;
        cv.playInto([c[0], c[1], c[2] - c[0], c[3] - c[1]], size);
        cv.setClipSurface([0, 0, size[0], size[1]]);
        cv.patternPx = PT_PER_PX;
    }
    let playerViewport = bounds !== null;
    let parsed = 0;
    while (!cv.full()) {
        const words = input.optU32(pos), func = input.optU16(pos + 4);
        if (words === undefined || func === undefined) break;
        const len = words * 2;
        if (len < 6 || pos + len > input.length) break;
        const rec = input.sub(pos, len);
        if (func === 0) break;
        guard(() => record(cv, func, rec));
        if (func === 0x020c && cv.windowSet && !playerViewport && !cv.viewportSet) {
            const we = cv.map.we;
            cv.playInto(null, [Math.abs(we[0]), Math.abs(we[1])]);
            playerViewport = true;
        }
        parsed++;
        pos += len;
    }
    if (parsed === 0) throw new MetafileError('NoRecords');
    let frame: Frame | null;
    if (bounds && !cv.viewportSet && cv.map.usesExtents()) {
        // Played into its target: the frame is the target.
        frame = { rect: [0, 0, bounds.size[0], bounds.size[1]], size: bounds.size };
    } else if (bounds) {
        // The file set its own viewport, so the drawing is in its device units and the logical bounds go through the final mapping.
        const c = bounds.c;
        const a = cv.map.device([c[0], c[1]]), b = cv.map.device([c[2], c[3]]);
        const rect: Rect4 = [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])];
        frame = rect[2] > 0 && rect[3] > 0 ? { rect, size: bounds.size } : null;
    } else if (playerViewport && !cv.viewportSet && cv.map.usesExtents()) {
        const ve = cv.map.ve;
        frame = { rect: [0, 0, ve[0], ve[1]], size: null };
    } else if (cv.windowSet) {
        frame = { rect: cv.map.windowRect(), size: null };
    } else {
        frame = null;
    }
    return { cv, frame };
}

function record(cv: Canvas, func: number, r: Bytes): void {
    if (cv.full()) return;
    switch (func) {
        case 0x0103: cv.setMapMode(r.u16(6)); break;
        case 0x0106: cv.setPolyfill(r.u16(6)); break;
        case 0x0104: cv.setRop2(r.u16(6)); break;
        // Y is stored before X in these records.
        case 0x020b: cv.setWindowOrg(xy16(r, 6)); break;
        case 0x020c: cv.setWindowExt(xy16(r, 6)); break;
        case 0x020d: cv.setViewportOrg(xy16(r, 6)); break;
        case 0x020e: cv.setViewportExt(xy16(r, 6)); break;
        case 0x001e: cv.saveDc(); break;
        case 0x0127: cv.restoreDc(r.i16(6)); break;
        case 0x0214: cv.moveTo(xy16(r, 6)); break;
        case 0x0213: cv.lineTo(xy16(r, 6)); break;
        case 0x0325: cv.poly(countedPoints(r), false, false, true); break;
        case 0x0324: cv.poly(countedPoints(r), true, true, true); break;
        case 0x0538: { const ops = polypolygon(r); if (ops) cv.shape(ops, true, true); break; }
        case 0x041b: { const [l, t, rr, b] = rect16(r, 6); cv.shape(geom.rect(l, t, rr, b), true, true); break; }
        case 0x061c: {
            const ew = r.i16(8), eh = r.i16(6);
            const [l, t, rr, b] = rect16(r, 10);
            cv.shape(geom.roundRect(l, t, rr, b, ew, eh), true, true);
            break;
        }
        case 0x0415: cv.excludeClipRect(rect16(r, 6)); break;
        case 0x0416: cv.intersectClipRect(rect16(r, 6)); break;
        case 0x0418: { const [l, t, rr, b] = rect16(r, 6); cv.shape(geom.ellipse(l, t, rr, b), true, true); break; }
        case 0x0817: case 0x081a: case 0x0830: {
            const [bounds, s, e] = arc16(r);
            const kind: ArcKind = func === 0x0817 ? 'arc' : func === 0x081a ? 'pie' : 'chord';
            const [l, t, rr, b] = bounds;
            cv.shape(geom.arcShape(l, t, rr, b, s, e, kind, cv.arcClockwise), kind !== 'arc', true);
            break;
        }
        case 0x02fa: createPen(cv, r); break;
        case 0x02fc: createBrush(cv, r); break;
        case 0x02fb: cv.addObject(null, { kind: 'font', font: guard(() => font(r)) ?? { font: { family: '', height: 0, width: 0, weight: 0, italic: false, underline: false, strike: false, charset: 0 }, escapement: 0 } }); break;
        case 0x0142: {
            // A pattern the reader cannot decode still takes its handle slot.
            const b = guard(() => dibPatternBrush(r)) ?? null;
            cv.addObject(null, b ? { kind: 'brush', brush: b } : { kind: 'other' });
            break;
        }
        // A palette takes a handle slot; SELECTPALETTE makes PALETTEINDEX colours resolve against it.
        // (Beyond DeckCraft, which reads every palette colour as black.)
        case 0x00f7: {
            const colors = guard(() => {
                const n = Math.min(r.u16(8), 1024);
                const out: [number, number, number, number][] = [];
                for (let i = 0; i < n; i++) out.push([r.u8(10 + i * 4), r.u8(11 + i * 4), r.u8(12 + i * 4), 255]);
                return out;
            });
            cv.addObject(null, colors ? { kind: 'palette', colors } : { kind: 'other' });
            break;
        }
        case 0x0234: cv.selectPalette(wmfHandle(r.u16(6))); break;
        // Old-style pattern brushes and regions take a handle slot too, so later SELECTOBJECT handles
        // count them; selecting one draws nothing.
        case 0x01f9: case 0x06ff: cv.addObject(null, { kind: 'other' }); break;
        case 0x0209: cv.setTextColor(r.u32(6)); break;
        case 0x0201: cv.setBkColor(r.u32(6)); break;
        case 0x0102: cv.setBkMode(r.u16(6)); break;
        case 0x012e: cv.setTextAlign(r.u16(6)); break;
        case 0x0a32: extTextOut(cv, r); break;
        case 0x0521: textOut(cv, r); break;
        // PATBLT: rop(4), height, width, y, x.
        case 0x061d: cv.fillRop([i16s(r, 16), i16s(r, 14), i16s(r, 12), i16s(r, 10)], r.u32(6)); break;
        case 0x012d: cv.select(wmfHandle(r.u16(6))); break;
        case 0x01f0: cv.deleteObject(r.u16(6)); break;
        // STRETCHDIB: rop(4) usage(2) srcH srcW ySrc xSrc destH destW yDest xDest, then the DIB.
        case 0x0f43: {
            const rop = r.optU32(6) ?? 0;
            dibBlit(cv, r, 28, rop, [i16s(r, 26), i16s(r, 24), i16s(r, 22), i16s(r, 20)], [i16s(r, 18), i16s(r, 16), i16s(r, 14), i16s(r, 12)]);
            break;
        }
        case 0x0b41: dibStretchblt(cv, r); break;
        case 0x0940: dibBitblt(cv, r); break;
        default: break;
    }
}

/** A 16-bit WMF handle as a canvas object index: stock objects are `0x8000 | index`, which the canvas reads with the 32-bit stock flag. */
const wmfHandle = (h: number) => ((h & 0x8000) !== 0 ? ((h & 0x7fff) | 0x8000_0000) >>> 0 : h);
/** An i16 field; 0 past the end. */
const i16s = (r: Bytes, off: number) => r.optI16(off) ?? 0;

/** CREATEPENINDIRECT: style, width (x, y), colour. Only the width's x component is used. */
function createPen(cv: Canvas, r: Bytes): void {
    const style = r.u16(6), width = r.i16(8), color = r.u32(12);
    cv.addObject(null, { kind: 'pen', pen: { style, width, color: cv.colorOf(color) } });
}

/** CREATEBRUSHINDIRECT: style, colour, hatch. */
function createBrush(cv: Canvas, r: Bytes): void {
    const style = r.u16(6), color = r.u32(8);
    const b = brush(style, cv.colorOf(color));
    if (style === BS_HATCHED) b.hatch = r.optU16(12) ?? 0;
    cv.addObject(null, { kind: 'brush', brush: b });
}

/**
 * DIBCREATEPATTERNBRUSH: style, colour usage, then a DIB (MS-WMF 2.3.4.8). The DIB's own palette
 * gives the colours; with DIB_PAL_COLORS (indices into a palette the reader does not keep) a
 * monochrome DIB takes the text and background colours.
 */
function dibPatternBrush(r: Bytes): Brush | null {
    const usage = r.u16(8);
    const d = r.tail(10);
    const n = dib.infoLen(d);
    if (n === null) return null;
    const img = dib.decode(d.sub(0, n), d.tail(n), false);
    return img ? patternBrush(img, usage === 1) : null;
}

/**
 * Font object (MS-WMF 2.2.1.2): height, width, escapement, orientation, weight (i16 each), italic,
 * underline, strike-out and charset bytes, three precision/quality bytes, pitch and family, then the
 * face name (up to 32 bytes, NUL-terminated, in the font's character set).
 */
function font(r: Bytes): LogFont {
    const height = r.i16(6);
    const width = r.optI16(8) ?? 0;
    const escapement = r.optI16(10) ?? 0;
    const weight = r.optI16(14) ?? 0;
    const byte = (o: number) => r.optU8(o) ?? 0;
    const name0 = r.b.subarray(Math.min(24, r.length), Math.min(24 + 32, r.length));
    const nul = name0.indexOf(0);
    const name = nul >= 0 ? name0.subarray(0, nul) : name0;
    // Face names are plain ASCII in practice; other bytes go through the Western code page.
    const [family] = decodeBytes(name, 0, []);
    return {
        font: {
            family: family.trim(), height, width, weight: Math.min(1000, Math.max(0, weight)),
            italic: byte(16) !== 0, underline: byte(17) !== 0, strike: byte(18) !== 0, charset: byte(19),
        },
        escapement,
    };
}

/**
 * EXTTEXTOUT (MS-WMF 2.3.3.5): y, x, string length, options, the rectangle (left, top, right,
 * bottom) when ETO_OPAQUE or ETO_CLIPPED is set, the string padded to a word, then an optional dx
 * array of i16 advances.
 */
function extTextOut(cv: Canvas, r: Bytes): void {
    const y = r.i16(6), x = r.i16(8);
    let n = Math.min(r.u16(10), MAX_CHARS);
    const opts = r.u16(12);
    const hasRect = (opts & (ETO_OPAQUE | ETO_CLIPPED)) !== 0;
    const rect: Rect4 | null = hasRect ? [i16s(r, 14), i16s(r, 16), i16s(r, 18), i16s(r, 20)] : null;
    const at = hasRect ? 22 : 14;
    // A string running past the record is cut to what the record holds.
    n = Math.min(n, Math.max(0, r.length - at));
    const bytes = r.slice(at, n);
    const dxAt = at + n + (n % 2);
    const dx: number[] = [];
    if (r.length >= dxAt + 2 * n) for (let i = 0; i < n; i++) dx.push(r.i16(dxAt + 2 * i));
    const [text, dx2] = decodeBytes(bytes, cv.fontCharset(), dx);
    cv.drawText([x, y], text, dx2, opts, rect);
}

/** TEXTOUT (MS-WMF 2.3.3.20): string length, the string padded to a word, then y and x. */
function textOut(cv: Canvas, r: Bytes): void {
    const n = Math.min(r.u16(6), MAX_CHARS);
    const bytes = r.slice(8, n);
    const at = 8 + n + (n % 2);
    const y = r.i16(at), x = r.i16(at + 2);
    const [text] = decodeBytes(bytes, cv.fontCharset(), []);
    cv.drawText([x, y], text, [], 0, null);
}

/** (x, y) from a Y-then-X pair stored at `off`. */
const xy16 = (r: Bytes, off: number): P => [r.i16(off + 2), r.i16(off)];

/** Rectangle stored as bottom, right, top, left (the order MS-WMF uses for RECTANGLE and ELLIPSE). */
function rect16(r: Bytes, off: number): Rect4 {
    const b = r.i16(off), rr = r.i16(off + 2), t = r.i16(off + 4), l = r.i16(off + 6);
    return [l, t, rr, b];
}

/** ARC, PIE and CHORD: end Y, end X, start Y, start X, then the bounding rectangle (bottom, right, top, left). */
const arc16 = (r: Bytes): [Rect4, P, P] => {
    const end = xy16(r, 6), start = xy16(r, 10), bounds = rect16(r, 14);
    return [bounds, start, end];
};

/** A count of 16-bit points, then the points (POLYLINE, POLYGON). */
const countedPoints = (r: Bytes): P[] => r.tail(8).points(0, r.u16(6), false);

/** POLYPOLYGON: polygon count, one 16-bit point count per polygon, then all points. */
function polypolygon(r: Bytes): Op[] | null {
    const n = r.u16(6);
    const counts: number[] = [];
    for (let i = 0; i < n; i++) counts.push(r.u16(8 + i * 2));
    const total = counts.reduce((a, c) => a + c, 0);
    if (total > MAX_PATH_OPS) return null;
    const pts = r.tail(8 + n * 2).points(0, total, false);
    return geom.subpaths(pts, counts, true);
}

/** Whether a DIBBITBLT or DIBSTRETCHBLT record carries a bitmap: without one it is exactly `(function >> 8) + 3` words long (MS-WMF 2.3.1.2, 2.3.1.3). */
const hasBitmap = (func: number, r: Bytes) => Math.floor(r.length / 2) > (func >> 8) + 3;

/**
 * META_DIBBITBLT: rop(4), ySrc, xSrc, then height, width, yDest, xDest and the DIB at 22. The
 * bitmap-less form has a reserved word before the height, so its fields sit 2 bytes later; it, or a
 * source-less raster operation, fills the destination.
 */
function dibBitblt(cv: Canvas, r: Bytes): void {
    const rop = r.u32(6);
    if (!hasBitmap(0x0940, r)) { cv.fillRop([i16s(r, 22), i16s(r, 20), i16s(r, 18), i16s(r, 16)], rop); return; }
    const dst: Rect4 = [i16s(r, 20), i16s(r, 18), i16s(r, 16), i16s(r, 14)];
    if (Canvas.sourceless(rop)) { cv.fillRop(dst, rop); return; }
    dibBlit(cv, r, 22, rop, dst, [i16s(r, 12), i16s(r, 10), dst[2], dst[3]]);
}

/**
 * META_DIBSTRETCHBLT: rop(4), srcH, srcW, ySrc, xSrc, then destH, destW, yDest, xDest and the DIB at
 * 26. The bitmap-less form has a reserved word after xSrc, so the destination sits 2 bytes later; it,
 * or a source-less raster operation, fills the destination.
 */
function dibStretchblt(cv: Canvas, r: Bytes): void {
    const rop = r.u32(6);
    if (!hasBitmap(0x0b41, r)) { cv.fillRop([i16s(r, 26), i16s(r, 24), i16s(r, 22), i16s(r, 20)], rop); return; }
    const dst: Rect4 = [i16s(r, 24), i16s(r, 22), i16s(r, 20), i16s(r, 18)];
    if (Canvas.sourceless(rop)) { cv.fillRop(dst, rop); return; }
    dibBlit(cv, r, 26, rop, dst, [i16s(r, 16), i16s(r, 14), i16s(r, 12), i16s(r, 10)]);
}

/** A DIB at `at`, stretched from source rectangle `src` into `dst` (both in logical units, pixels for `src`). The raster operation decides how the pixels combine. */
function dibBlit(cv: Canvas, r: Bytes, at: number, rop: number, dst: Rect4, src: Rect4): void {
    const d = r.tail(at);
    const n = dib.infoLen(d);
    if (n === null) return;
    const img = dib.decode(d.sub(0, n), d.tail(n), false);
    if (!img) return;
    dib.prepare(img, { kind: 'rop', rop });
    const c = dib.clipBlit(img, src, dst);
    if (c) cv.bitmap(c.dst, c.img);
}
