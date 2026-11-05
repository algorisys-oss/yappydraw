/**
 * EMF reader (MS-EMF). Records are (type, size in bytes) followed by a payload; offsets inside a
 * record (bitmap info and bits) are relative to the record start, so each handler reads the record
 * slice. Ported from DeckCraft's `crates/metafile/src/emf.rs` (MIT/Apache).
 */
import { Bytes, guard, type P } from './bytes';
import { BS_HATCHED, BS_NULL, Canvas, PS_NULL, PS_STYLE_MASK, brush, patternBrush, type Xform } from './canvas';
import type { Op } from './geom';
import * as dib from './dib';
import type { Blend } from './dib';
import * as geom from './geom';
import type { ArcKind } from './geom';
import { ETO_GLYPH_INDEX, ETO_PDY, MAX_CHARS, decodeBytes, decodeUtf16, type Font } from './text';
import { MAX_CLIP_RECTS, type Rect4 } from './clip';
import { MAX_PATH_OPS } from './limits';
import { EMF_PLUS, Plus } from './emfplus';
import { MetafileError, type Frame } from './frame';

/** ExtTextOut options: no rectangle in the record (EMR_SMALLTEXTOUT, EmrText), and 8-bit characters (EMR_SMALLTEXTOUT). */
const ETO_NO_RECT = 0x0100;
const ETO_SMALL_CHARS = 0x0200;

const EMF_SIGNATURE = 0x464d_4520;
/** Hundredths of a millimetre to points. */
const HMM_TO_PT = 72 / 2540;
/** SRCCOPY, the plain copy of a bitmap. */
const SRCCOPY = 0x00cc_0020;
/** LogPenEx pen type bits; PS_COSMETIC pens are one device pixel wide. */
const PS_TYPE_MASK = 0x000f_0000;
const PS_COSMETIC = 0;

export function isEmf(b: Bytes): boolean {
    return b.optU32(0) === 1 && b.optU32(40) === EMF_SIGNATURE;
}

/**
 * The picture frame: `rclFrame` (0.01 mm) mapped to device units through `szlDevice` and
 * `szlMillimeters`, sized in points. Without a usable frame, the device bounds stand in (1 unit = 1 point).
 */
export function parseEmf(input: Bytes, depth = 0, forcePlus = false): { cv: Canvas; frame: Frame | null } {
    if (!isEmf(input)) throw new MetafileError('BadHeader');
    const hsize = input.optU32(4);
    const bounds = guard(() => rect32(input, 8));
    if (hsize === undefined || !bounds) throw new MetafileError('BadHeader');
    const [l, t, r, b] = bounds;
    const frame = frameFromHeader(input) ?? (r > l && b > t ? { rect: [l, t, r - l, b - t] as Rect4, size: null } : null);
    const cv = new Canvas();
    if (r > l && b > t) cv.setClipSurface([l, t, r, b]);
    const pxMm = devicePxPerMm(input);
    if (pxMm) cv.setDeviceMm(pxMm);
    const plus = new Plus(depth, forcePlus);
    plus.frame = frame ? frame.rect : null;
    let parsed = 0;
    let pos = Math.max(hsize, 88);
    while (!cv.full()) {
        const typ = input.optU32(pos), size = input.optU32(pos + 4);
        if (typ === undefined || size === undefined) break;
        if (size < 8 || size % 4 !== 0 || pos + size > input.length) break;
        const rec = input.sub(pos, size);
        if (typ === 14) break;
        if (typ === 70 && rec.optU32(12) === EMF_PLUS) {
            if (rec.length >= 16) plus.comment(cv, rec.tail(16));
        } else {
            guard(() => record(cv, typ, rec));
        }
        parsed++;
        pos += size;
    }
    if (parsed === 0) throw new MetafileError('NoRecords');
    // A file can say it is dual (EMF+ with an EMF fallback) and carry no EMF drawing at all; GDI+
    // then shows the EMF+ records, and so do we. (DeckCraft leaves such a file empty.)
    if (!forcePlus && plus.skippedDual && cv.items.length === 0) return parseEmf(input, depth, true);
    return { cv, frame };
}

/** Device pixels per millimetre on each axis, from `szlDevice` (72) and `szlMillimeters` (80). */
function devicePxPerMm(input: Bytes): P | null {
    const dw = input.optI32(72), dh = input.optI32(76), mw = input.optI32(80), mh = input.optI32(84);
    if (dw === undefined || dh === undefined || mw === undefined || mh === undefined) return null;
    return dw > 0 && dh > 0 && mw > 0 && mh > 0 ? [dw / mw, dh / mh] : null;
}

/** The frame from `rclFrame` (offset 24), `szlDevice` (72) and `szlMillimeters` (80) in the header. */
function frameFromHeader(input: Bytes): Frame | null {
    const f = guard(() => rect32(input, 24));
    if (!f) return null;
    const [fl, ft, fr, fb] = f;
    if (fr <= fl || fb <= ft) return null;
    const pxMm = devicePxPerMm(input);
    if (!pxMm) return null;
    // Device units per hundredth of a millimetre.
    const sx = pxMm[0] / 100, sy = pxMm[1] / 100;
    return { rect: [fl * sx, ft * sy, (fr - fl) * sx, (fb - ft) * sy], size: [(fr - fl) * HMM_TO_PT, (fb - ft) * HMM_TO_PT] };
}

function record(cv: Canvas, typ: number, r: Bytes): void {
    if (cv.full()) return;
    switch (typ) {
        case 9: cv.setWindowExt(xy32(r, 8)); break;
        case 10: cv.setWindowOrg(xy32(r, 8)); break;
        case 11: cv.setViewportExt(xy32(r, 8)); break;
        case 12: cv.setViewportOrg(xy32(r, 8)); break;
        case 17: cv.setMapMode(r.u32(8)); break;
        case 19: cv.setPolyfill(r.u32(8)); break;
        case 20: cv.setRop2(r.u32(8)); break;
        case 33: cv.saveDc(); break;
        case 34: cv.restoreDc(r.i32(8)); break;
        case 35: cv.modifyWorld(xform(r, 8), 4); break;
        case 36: { const x = xform(r, 8); cv.modifyWorld(x, r.u32(32)); break; }
        case 37: cv.select(r.u32(8)); break;
        case 38: createPen(cv, r); break;
        case 95: createExtPen(cv, r); break;
        case 39: createBrush(cv, r); break;
        case 93: case 94: createDibBrush(cv, r, typ === 93); break;
        case 82: createFont(cv, r); break;
        case 18: cv.setBkMode(r.u32(8)); break;
        case 22: cv.setTextAlign(r.u32(8)); break;
        case 24: cv.setTextColor(r.u32(8)); break;
        case 25: cv.setBkColor(r.u32(8)); break;
        case 83: case 84: extTextOut(cv, r, typ === 84); break;
        case 108: smallTextOut(cv, r); break;
        case 40: cv.deleteObject(r.u32(8)); break;
        case 29: cv.excludeClipRect(rect32(r, 8)); break;
        case 30: cv.intersectClipRect(rect32(r, 8)); break;
        case 75: extSelectClip(cv, r); break;
        case 27: cv.moveTo(xy32(r, 8)); break;
        case 54: cv.lineTo(xy32(r, 8)); break;
        case 42: { const [l, t, rr, b] = rect32(r, 8); cv.shape(geom.ellipse(l, t, rr, b), true, true); break; }
        case 43: { const [l, t, rr, b] = rect32(r, 8); cv.shape(geom.rect(l, t, rr, b), true, true); break; }
        case 44: {
            const cw = r.i32(24), ch = r.i32(28);
            const [l, t, rr, b] = rect32(r, 8);
            cv.shape(geom.roundRect(l, t, rr, b, cw, ch), true, true);
            break;
        }
        case 45: case 46: case 47: {
            const [bounds, s, e] = arc32(r);
            const kind: ArcKind = typ === 45 ? 'arc' : typ === 46 ? 'chord' : 'pie';
            const [l, t, rr, b] = bounds;
            cv.shape(geom.arcShape(l, t, rr, b, s, e, kind, cv.arcClockwise), kind !== 'arc', true);
            break;
        }
        // Beyond DeckCraft: arc direction, angle arcs, POLYDRAW, region fills, clip paths, palettes.
        case 57: cv.arcClockwise = r.u32(8) === 2; break;
        case 41: angleArc(cv, r); break;
        case 56: case 92: polyDraw(cv, r, typ === 56); break;
        case 71: { const rects = regionRects(r, 24, 32); cv.fillRegion(rects, r.u32(28)); break; }
        case 74: { const rects = regionRects(r, 24, 28); cv.fillRegion(rects, null); break; }
        case 72: { const rects = regionRects(r, 24, 40); cv.frameRegion(rects, r.u32(28), r.i32(32), r.i32(36)); break; }
        case 67: cv.selectClipPath(r.u32(8)); break;
        case 49: createPalette(cv, r); break;
        case 48: cv.selectPalette(r.u32(8)); break;
        case 4: case 87: cv.poly(counted(r, typ === 4), false, false, true); break;
        case 3: case 86: cv.poly(counted(r, typ === 3), true, true, true); break;
        case 6: case 89: cv.lineChain(counted(r, typ === 6), false, true); break;
        // POLYBEZIER starts its own figure at the first point and leaves the current point alone;
        // POLYBEZIERTO continues from the current point.
        case 2: case 85: {
            const pts = counted(r, typ === 2);
            if (pts.length) cv.bezier(pts[0], pts.slice(1));
            break;
        }
        case 5: case 88: cv.bezierTo(counted(r, typ === 5)); break;
        case 7: case 90: { const [counts, pts] = polyGroups(r, typ === 7); cv.shape(geom.subpaths(pts, counts, false), false, true); break; }
        case 8: case 91: { const [counts, pts] = polyGroups(r, typ === 8); cv.shape(geom.subpaths(pts, counts, true), true, true); break; }
        case 59: cv.beginPath(); break;
        case 60: cv.endPath(); break;
        case 61: cv.closeFigure(); break;
        case 62: cv.paintPath(true, false); break;
        case 63: cv.paintPath(true, true); break;
        case 64: cv.paintPath(false, true); break;
        case 76: case 77: bitblt(cv, r, typ === 77); break;
        case 80: setDibits(cv, r); break;
        case 81: stretchDibits(cv, r); break;
        case 114: alphablend(cv, r); break;
        default: break;
    }
}

/** EMR_EXTSELECTCLIPRGN: `cbRgnData` bytes of `RGNDATA` (rectangles in logical units) and a region mode. No region data selects the default clip. */
function extSelectClip(cv: Canvas, r: Bytes): void {
    const cb = r.u32(8);
    const mode = r.u32(12);
    if (cb === 0) { cv.resetClip(); return; }
    const header = 16;
    if (cb < 32) return;
    // RDH_RECTANGLES is the only region type GDI writes.
    if (r.u32(header + 4) !== 1) return;
    const n = Math.min(r.u32(header + 8), MAX_CLIP_RECTS);
    const end = header + cb;
    const rects: Rect4[] = [];
    for (let i = 0; i < n; i++) {
        const o = header + 32 + i * 16;
        if (o + 16 > end) break;
        rects.push(rect32(r, o));
    }
    cv.selectClipRects(rects, mode);
}

/**
 * The rectangles of an RGNDATA whose byte count is at `cbAt` and data at `at` (header: size, type,
 * count, region size, bounds; then the rectangles). Logical units, as FILLRGN and its kin use them.
 */
function regionRects(r: Bytes, cbAt: number, at: number): Rect4[] {
    const cb = r.u32(cbAt);
    if (cb < 32 || r.u32(at + 4) !== 1) return [];
    const n = Math.min(r.u32(at + 8), MAX_CLIP_RECTS * 64);
    const rects: Rect4[] = [];
    for (let i = 0; i < n && 32 + i * 16 + 16 <= cb; i++) rects.push(rect32(r, at + 32 + i * 16));
    return rects;
}

/** EMR_ANGLEARC: centre, radius, start and sweep (degrees, counter-clockwise): a line from the current point to the arc's start, then the arc. The current point moves to its end. */
function angleArc(cv: Canvas, r: Bytes): void {
    const [cx, cy] = xy32(r, 8);
    const rad = r.u32(16);
    const a0 = r.f32(20), sweep = r.f32(24);
    if (!Number.isFinite(a0) || !Number.isFinite(sweep) || rad > 1e7) return;
    const t0 = -(a0 * Math.PI) / 180, dt = -(Math.max(-3600, Math.min(3600, sweep)) * Math.PI) / 180;
    const start: P = [cx + rad * Math.cos(t0), cy + rad * Math.sin(t0)];
    const end: P = [cx + rad * Math.cos(t0 + dt), cy + rad * Math.sin(t0 + dt)];
    const ops: Op[] = [geom.M(cv.currentPos()), geom.L(start), ...(dt !== 0 ? geom.arc(cx, cy, rad, rad, t0, dt) : [])];
    cv.setCurrentPos(end);
    cv.shape(ops, false, true);
}

/** EMR_POLYDRAW(16): points and one type byte each (move, line, Bézier; bit 0 closes the figure), from the current point. */
function polyDraw(cv: Canvas, r: Bytes, wide: boolean): void {
    const n = r.u32(24);
    if (n > MAX_PATH_OPS) return;
    const pts = r.tail(28).points(0, n, wide);
    const types = r.slice(28 + n * (wide ? 8 : 4), n);
    const ops: Op[] = [geom.M(cv.currentPos())];
    let start = cv.currentPos();
    for (let i = 0; i < n; i++) {
        const t = types[i] & 0x06;
        if (t === 6) { ops.push(geom.M(pts[i])); start = pts[i]; }
        else if (t === 4 && i + 2 < n) { ops.push(geom.C(pts[i], pts[i + 1], pts[i + 2])); i += 2; }
        else ops.push(geom.L(pts[i]));
        if (types[i] & 1) { ops.push(geom.Z); cv.setCurrentPos(start); } else cv.setCurrentPos(pts[i]);
    }
    cv.shape(ops, false, true);
}

/** EMR_CREATEPALETTE: handle, then a LogPalette (version, entry count, entries of R, G, B, flags). */
function createPalette(cv: Canvas, r: Bytes): void {
    const slot = r.u32(8);
    const n = Math.min(r.u16(14), 1024);
    const colors: [number, number, number, number][] = [];
    for (let i = 0; i < n; i++) colors.push([r.u8(16 + i * 4), r.u8(17 + i * 4), r.u8(18 + i * 4), 255]);
    cv.addObject(slot, { kind: 'palette', colors });
}

/** Two little-endian i32 values at `off`, as a point. */
const xy32 = (r: Bytes, off: number): P => [r.i32(off), r.i32(off + 4)];
/** RECTL (left, top, right, bottom). */
const rect32 = (r: Bytes, off: number): Rect4 => [r.i32(off), r.i32(off + 4), r.i32(off + 8), r.i32(off + 12)];
/** An i32 field; 0 past the end. */
const i32s = (r: Bytes, off: number): number => r.optI32(off) ?? 0;

/** XFORM: six f32 values in M11, M12, M21, M22, Dx, Dy order. */
function xform(r: Bytes, off: number): Xform {
    return [0, 1, 2, 3, 4, 5].map(i => r.f32(off + i * 4)) as Xform;
}

/** ARC, CHORD, PIE: bounds at 8, start point at 24, end point at 32. */
const arc32 = (r: Bytes): [Rect4, P, P] => [rect32(r, 8), xy32(r, 24), xy32(r, 32)];

/** Point count at 24, then the points (32-bit or 16-bit) at 28. A count past the path budget is dropped before anything is allocated. */
function counted(r: Bytes, wide: boolean): P[] {
    const n = r.u32(24);
    if (n > MAX_PATH_OPS) return [];
    return r.tail(28).points(0, n, wide);
}

/** Subpath count at 24, total point count at 28, per-subpath counts at 32, then the points. */
function polyGroups(r: Bytes, wide: boolean): [number[], P[]] {
    const n = r.u32(24);
    if (n > MAX_PATH_OPS) return [[], []];
    // The record must hold the n counts before anything is allocated for them.
    r.slice(32, n * 4);
    const counts: number[] = [];
    for (let i = 0; i < n; i++) counts.push(r.u32(32 + i * 4));
    const total = counts.reduce((a, c) => a + c, 0);
    if (total > MAX_PATH_OPS) return [[], []];
    return [counts, r.tail(32 + n * 4).points(0, total, wide)];
}

/** EMR_CREATEPEN: handle, LogPen (style, width x/y, colour). */
function createPen(cv: Canvas, r: Bytes): void {
    const slot = r.u32(8);
    const style = r.u32(12);
    const width = r.i32(16);
    const color = r.u32(24);
    cv.addObject(slot, { kind: 'pen', pen: { style, width, color: cv.colorOf(color) } });
}

/**
 * EMR_EXTCREATEPEN: handle, bitmap offsets (unused), LogPenEx (style, width, brush style, colour).
 * A cosmetic pen's width is in device pixels (always 1), so it is a hairline; a BS_NULL brush draws
 * no line at all.
 */
function createExtPen(cv: Canvas, r: Bytes): void {
    const slot = r.u32(8);
    const style0 = r.u32(28), width0 = r.u32(32), brushStyle = r.u32(36), color = r.u32(40);
    const width = (style0 & PS_TYPE_MASK) === PS_COSMETIC ? 0 : width0;
    const style = brushStyle === BS_NULL ? PS_NULL : style0 & PS_STYLE_MASK;
    cv.addObject(slot, { kind: 'pen', pen: { style, width, color: cv.colorOf(color) } });
}

/** EMR_CREATEBRUSHINDIRECT: handle, LogBrush32 (style, colour, hatch). */
function createBrush(cv: Canvas, r: Bytes): void {
    const slot = r.u32(8);
    const style = r.u32(12);
    const color = r.u32(16);
    const b = brush(style, cv.colorOf(color));
    if (style === BS_HATCHED) b.hatch = r.optU32(20) ?? 0;
    cv.addObject(slot, { kind: 'brush', brush: b });
}

/**
 * EMR_CREATEDIBPATTERNBRUSHPT (94) and EMR_CREATEMONOBRUSH (93): handle, colour usage, then the
 * bitmap info and bits as offset/size pairs. A mono brush (or one whose palette holds indices,
 * DIB_PAL_COLORS) takes the text and background colours. An undecodable bitmap leaves the slot empty.
 */
function createDibBrush(cv: Canvas, r: Bytes, mono: boolean): void {
    const slot = r.u32(8);
    const usage = r.u32(12);
    const bo = r.u32(16), bl = r.u32(20), po = r.u32(24), pl = r.u32(28);
    const img = dib.decode(r.sub(bo, bl), r.sub(po, pl), false);
    const b = img && patternBrush(img, mono || usage === 1);
    if (b) cv.addObject(slot, { kind: 'brush', brush: b });
}

/**
 * EMR_EXTCREATEFONTINDIRECTW: handle, then a LogFont (MS-EMF 2.2.13): height, width, escapement,
 * orientation, weight (i32 each), italic, underline, strike-out, charset and four more bytes, then
 * the face name in 32 UTF-16 units (NUL-terminated).
 */
function createFont(cv: Canvas, r: Bytes): void {
    const slot = r.u32(8);
    const height = r.i32(12);
    const width = r.optI32(16) ?? 0;
    const escapement = r.optI32(20) ?? 0;
    const weight = r.optI32(28) ?? 0;
    const byte = (o: number) => r.optU8(o) ?? 0;
    const units: number[] = [];
    for (let i = 0; i < 32; i++) {
        const u = r.optU16(40 + 2 * i);
        if (u === undefined || u === 0) break;
        units.push(u);
    }
    const [family] = decodeUtf16(units, []);
    const font: Font = {
        family: family.trim(), height, width, weight: Math.min(1000, Math.max(0, weight)),
        italic: byte(32) !== 0, underline: byte(33) !== 0, strike: byte(34) !== 0, charset: byte(35),
    };
    cv.addObject(slot, { kind: 'font', font: { font, escapement } });
}

/** The dx array at `off` for `n` characters: i32 advances, or (dx, dy) pairs under ETO_PDY (only dx is used). Empty when absent or short. */
function dxArray(r: Bytes, off: number, n: number, opts: number): number[] {
    const step = (opts & ETO_PDY) !== 0 ? 8 : 4;
    if (off === 0) return [];
    const dx: number[] = [];
    for (let i = 0; i < n; i++) {
        const v = r.optI32(off + i * step);
        if (v === undefined) return [];
        dx.push(v);
    }
    return dx;
}

const utf16 = (b: Uint8Array): number[] => {
    const out: number[] = [];
    for (let i = 0; i + 1 < b.length; i += 2) out.push(b[i] | (b[i + 1] << 8));
    return out;
};

/**
 * EMR_EXTTEXTOUTA (83) and EMR_EXTTEXTOUTW (84): bounds, graphics mode and scales, then an EmrText at
 * 36: reference point, character count, string offset, options, the rectangle (absent under
 * ETO_NO_RECT) and the dx offset. Offsets count from the record start. Glyph-index strings name glyphs
 * of a font the reader cannot match, so they are left out.
 */
function extTextOut(cv: Canvas, r: Bytes, wide: boolean): void {
    const at = xy32(r, 36);
    const n = Math.min(r.u32(44), MAX_CHARS);
    const off = r.u32(48);
    const opts = r.u32(52);
    const [rect, dxOff] = (opts & ETO_NO_RECT) !== 0 ? [null, r.u32(56)] : [guard(() => rect32(r, 56)) ?? null, r.u32(72)];
    if ((opts & ETO_GLYPH_INDEX) !== 0) return;
    const dx0 = dxArray(r, dxOff, n, opts);
    const [text, dx] = wide ? decodeUtf16(utf16(r.slice(off, n * 2)), dx0) : decodeBytes(r.slice(off, n), cv.fontCharset(), dx0);
    cv.drawText(at, text, dx, opts, rect);
}

/** EMR_SMALLTEXTOUT (MS-EMF 2.3.5.37): x, y, count, options, graphics mode, scales, the bounds (absent under ETO_NO_RECT), then 8-bit (ETO_SMALL_CHARS) or UTF-16 characters. */
function smallTextOut(cv: Canvas, r: Bytes): void {
    const at = xy32(r, 8);
    const n = Math.min(r.u32(16), MAX_CHARS);
    const opts = r.u32(20);
    if ((opts & ETO_GLYPH_INDEX) !== 0) return;
    const [rect, off] = (opts & ETO_NO_RECT) !== 0 ? [null, 36] : [guard(() => rect32(r, 36)) ?? null, 52];
    const [text] = (opts & ETO_SMALL_CHARS) !== 0 ? decodeBytes(r.slice(off, n), cv.fontCharset(), []) : decodeUtf16(utf16(r.slice(off, n * 2)), []);
    cv.drawText(at, text, [], opts, rect);
}

/** BITBLT (76) and STRETCHBLT (77): dest at 24..40, rop at 40, source x/y at 44, bmi at 84, bits at 92; STRETCHBLT adds the source w/h at 100. A source-less rop fills the destination. */
function bitblt(cv: Canvas, r: Bytes, stretch: boolean): void {
    const dst: Rect4 = [i32s(r, 24), i32s(r, 28), i32s(r, 32), i32s(r, 36)];
    const rop = r.u32(40);
    if (Canvas.sourceless(rop)) { cv.fillRop(dst, rop); return; }
    const [sw, sh] = stretch ? [i32s(r, 100), i32s(r, 104)] : [dst[2], dst[3]];
    blit(cv, r, dst, [i32s(r, 44), i32s(r, 48), sw, sh], [84, 92], { kind: 'rop', rop });
}

/** ALPHABLEND: laid out like STRETCHBLT, with a BLENDFUNCTION at 40. Constant alpha at 42; AlphaFormat at 43 with AC_SRC_ALPHA (1) also uses the per-pixel alpha. */
function alphablend(cv: Canvas, r: Bytes): void {
    const dst: Rect4 = [i32s(r, 24), i32s(r, 28), i32s(r, 32), i32s(r, 36)];
    const constant = r.u8(42);
    const perPixel = (r.u8(43) & 0x01) !== 0;
    blit(cv, r, dst, [i32s(r, 44), i32s(r, 48), i32s(r, 100), i32s(r, 104)], [84, 92], { kind: 'alpha', constant, perPixel });
}

/** STRETCHDIBITS: dest x/y at 24, src x/y/w/h at 32..48, bmi offset/size at 48, bits at 56, rop at 68, dest w/h at 72. */
function stretchDibits(cv: Canvas, r: Bytes): void {
    const dst: Rect4 = [i32s(r, 24), i32s(r, 28), i32s(r, 72), i32s(r, 76)];
    const src: Rect4 = [i32s(r, 32), i32s(r, 36), i32s(r, 40), i32s(r, 44)];
    blit(cv, r, dst, src, [48, 56], { kind: 'rop', rop: r.u32(68) });
}

/**
 * SETDIBITSTODEVICE (MS-EMF 2.3.1.5): dest x/y at 24, src x/y at 32, size at 40, bmi at 48, bits at
 * 56, start scan at 68. The image keeps its own size; the bits begin at scan line `iStartScan`, so
 * the source y counts from there.
 */
function setDibits(cv: Canvas, r: Bytes): void {
    const cx = i32s(r, 40), cy = i32s(r, 44);
    if (cx <= 0 || cy <= 0) return;
    blit(cv, r, [i32s(r, 24), i32s(r, 28), cx, cy], [i32s(r, 32), i32s(r, 36) - r.u32(68), cx, cy], [48, 56], { kind: 'rop', rop: SRCCOPY });
}

/**
 * Decodes the bitmap at `at` = (offset of the bmi offset/length pair, offset of the bits pair), both
 * inside the record, and stretches the source rectangle `src` into `dst`. Both are `[x, y, w, h]`; a
 * non-positive source size means the whole bitmap. `blend` decides how it combines.
 */
function blit(cv: Canvas, r: Bytes, dst: Rect4, src: Rect4, at: [number, number], blend: Blend): void {
    const bo = r.u32(at[0]), bl = r.u32(at[0] + 4);
    const po = r.u32(at[1]), pl = r.u32(at[1] + 4);
    if (pl === 0) return;
    const img = dib.decode(r.sub(bo, bl), r.sub(po, pl), blend.kind === 'alpha' && blend.perPixel);
    if (!img) return;
    dib.prepare(img, blend);
    const c = dib.clipBlit(img, src.map(Math.trunc), dst);
    if (c) cv.bitmap(c.dst, c.img);
}
