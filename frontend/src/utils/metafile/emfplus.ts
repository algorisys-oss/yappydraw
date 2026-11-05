/**
 * EMF+ (MS-EMFPLUS): GDI+ drawing records carried in EMF comment records. Ported from DeckCraft's
 * `crates/metafile/src/emfplus.rs` (MIT/Apache).
 *
 * Most EMF+ files are *dual*: the same picture is also drawn with plain EMF records, which emf.ts
 * already plays, so this reader ignores their EMF+ part. An *EMF+ only* file has nothing else to
 * draw; for those this reader plays the records:
 * - brushes (solid, hatch, texture, linear and path gradients), pens, paths, images, fonts, string
 *   formats and regions, including objects split across several records;
 * - rectangles, polygons, lines, ellipses, paths and Béziers, arcs and pies, cardinal splines;
 * - bitmaps (raw pixel formats; PNG/JPEG/GIF embedded as they are, BMP decoded) and strings
 *   (DrawString, DrawDriverString with character codes, and glyph indices in the Windows core fonts);
 * - world and page transforms, save/restore and containers;
 * - clipping to rectangles and convex clip paths and regions (others: their bounding rectangle);
 * - nested metafile images, FillRegion, and Clear (over the picture frame).
 *
 * Not drawn: image attributes, glyph indices of other fonts, region combinations other than
 * intersect and union, and texture brushes over an encoded (PNG/JPEG) image, which fill with grey.
 * Deliberately ignored: rendering hints, SetRenderingOrigin, SerializableObject image effects, the
 * terminal-server records, and StrokeFillPath (0x4037), which GDI+ doesn't write.
 */
import { Bytes, guard, type P } from './bytes';
import { BS_NULL, BS_SOLID, Canvas, IDENTITY, PS_NULL, brush as mkBrush, hatchTile, mul, type LogFont, type Raw, type RawTile, type Xform } from './canvas';
import { clipPolygon, convex, flatten, opsBbox, ptsBbox, rectPoly } from './cliprect';
import type { Rgba } from './dib';
import * as dib from './dib';
import type { Op } from './geom';
import { M, L, C, Z, rect as rectOps, remEuclid } from './geom';
import { ETO_CLIPPED, decodeUtf16, defaultFont, type Rgba8 } from './text';
import { decodeCompressed, isEncoded, type Encoded } from './encoded';
import { MAX_BYTES, MAX_PIXELS } from './limits';
import type { Picture, Seg } from './index';

/** "EMF+" as the comment identifier of an EMR_COMMENT holding EMF+ records. */
export const EMF_PLUS = 0x2b46_4d45;
/** GDI+ allows 64 objects; ids are a byte. */
const MAX_OBJECTS = 64;
const MAX_STACK = 64;
/** Points per path or point list read. */
const MAX_POINTS = 100_000;
/** Gradient stops read from a brush. */
const MAX_STOPS = 256;
/** Characters per string. */
const MAX_CHARS = 32_768;
/** Bytes gathered for one object split across records. */
const MAX_OBJECT_BYTES = 64 * 1024 * 1024;
/** Nesting depth of region nodes. */
const MAX_REGION_DEPTH = 32;
/** Region nodes and path points parsed together, including nodes in sibling branches. */
const MAX_REGION_WORK = MAX_POINTS;
/** Metafile images inside metafile images, at most. */
const MAX_NESTING = 3;

const TA_RIGHT = 2;
const TA_CENTER = 6;
const TA_BOTTOM = 8;
const TA_BASELINE = 24;

type Stops = [number, Rgba8][];

/** What a brush paints. Coordinates are in brush space, which `xf` maps to world space. */
type Fill =
    | { kind: 'solid'; color: Rgba8 }
    | { kind: 'hatch'; style: number; fg: Rgba8; bg: Rgba8 }
    | { kind: 'linear'; rect: [number, number, number, number]; stops: Stops; wrap: number; xf: Xform }
    | { kind: 'radial'; center: P; radius: P; stops: Stops; xf: Xform }
    | { kind: 'texture'; img: Rgba | Encoded; wrap: number; xf: Xform };

/** One colour standing for the brush (pens and text draw solid). */
function fillColor(f: Fill): Rgba8 {
    switch (f.kind) {
        case 'solid': return f.color;
        case 'hatch': return f.fg;
        case 'linear': case 'radial': return ramp(f.stops, 0.5);
        case 'texture': return isEncoded(f.img) ? [128, 128, 128, 255] : f.img.px.length >= 4 ? [f.img.px[0], f.img.px[1], f.img.px[2], f.img.px[3]] : [0, 0, 0, 255];
    }
}

/** The colour at a brush-space point. */
function sample(f: Fill, p: P): Rgba8 {
    switch (f.kind) {
        case 'solid': return f.color;
        case 'hatch': return f.fg;
        case 'linear': {
            const t = f.rect[2] === 0 ? 0 : (p[0] - f.rect[0]) / f.rect[2];
            return ramp(f.stops, wrapT(t, f.wrap));
        }
        case 'radial': {
            const dx = (p[0] - f.center[0]) / Math.max(f.radius[0], 1e-9), dy = (p[1] - f.center[1]) / Math.max(f.radius[1], 1e-9);
            return ramp(f.stops, Math.min(Math.hypot(dx, dy), 1));
        }
        case 'texture': {
            const img = f.img;
            if (isEncoded(img)) return [128, 128, 128, 255];
            const w = img.w, h = img.h;
            if (w === 0 || h === 0) return [0, 0, 0, 0];
            if (f.wrap === 4 && !(p[0] >= 0 && p[0] < w && p[1] >= 0 && p[1] < h)) return [0, 0, 0, 0];
            const x = Math.min(Math.floor(remEuclid(p[0], w)), w - 1), y = Math.min(Math.floor(remEuclid(p[1], h)), h - 1);
            const i = (y * w + x) * 4;
            return i + 4 <= img.px.length ? [img.px[i], img.px[i + 1], img.px[i + 2], img.px[i + 3]] : [0, 0, 0, 0];
        }
    }
}

const fillXf = (f: Fill): Xform => (f.kind === 'linear' || f.kind === 'radial' || f.kind === 'texture' ? f.xf : IDENTITY);

/** Where `t` lands under a wrap mode: tiled, mirrored (flip modes) or clamped. */
function wrapT(t: number, wrap: number): number {
    if (!Number.isFinite(t)) return 0;
    if (wrap === 1 || wrap === 3) {
        const m = remEuclid(t, 2);
        return m > 1 ? 2 - m : m;
    }
    if (wrap === 4) return Math.min(1, Math.max(0, t));
    return remEuclid(t, 1);
}

/** The colour at `t` along sorted stops. */
function ramp(stops: Stops, t: number): Rgba8 {
    if (!stops.length) return [0, 0, 0, 0];
    if (t <= stops[0][0]) return stops[0][1];
    for (let i = 0; i + 1 < stops.length; i++) {
        const [a, ca] = stops[i], [b, cb] = stops[i + 1];
        if (t <= b) return lerp(ca, cb, b > a ? (t - a) / (b - a) : 0);
    }
    return stops[stops.length - 1][1];
}

function lerp(a: Rgba8, b: Rgba8, k: number): Rgba8 {
    return [0, 1, 2, 3].map(i => Math.min(255, Math.max(0, Math.round(a[i] + (b[i] - a[i]) * k)))) as Rgba8;
}

interface FontObj { em: number; unit: number; style: number; family: string }
interface Format { flags: number; align: number; lineAlign: number }

/** A clip area: a convex polygon (empty clips everything), or null for infinite. */
type Area = P[] | null;

type ImageData = { kind: 'bitmap'; img: Rgba | Encoded } | { kind: 'meta'; pic: Picture };

type Obj =
    | { kind: 'brush'; fill: Fill }
    | { kind: 'pen'; color: Rgba8; width: number }
    | { kind: 'path'; ops: Op[] }
    | { kind: 'image'; data: ImageData }
    | { kind: 'font'; font: FontObj }
    | { kind: 'format'; format: Format }
    /** A region's area in world units; null is infinite. */
    | { kind: 'region'; area: Area };

/** An object arriving in several records: its id, type, total size and the bytes so far. */
interface Partial { id: number; kind: number; total: number; chunks: Uint8Array[]; len: number }

interface Saved { id: number; world: Xform; page: number; clip: Area }

export class Plus {
    /** An EMF+ header said the file is EMF+ only, so these records are the picture. */
    private active = false;
    private dpi = 96;
    private world: Xform = IDENTITY;
    private page = 1;
    /** Convex device clip polygon; null is unclipped. */
    private clip: Area = null;
    private objects: (Obj | null)[] = new Array(MAX_OBJECTS).fill(null);
    private objectBytes = 0;
    private stack: Saved[] = [];
    private partial: Partial | null = null;
    /** The picture frame in device units (`[x, y, w, h]`), what Clear paints. */
    frame: [number, number, number, number] | null = null;

    private readonly depth: number;
    /** Play EMF+ records even in a file whose header says dual (see emf.ts). */
    private readonly force: boolean;
    /** A dual header was seen and EMF+ drawing records followed it, unplayed. */
    skippedDual = false;
    constructor(depth = 0, force = false) { this.depth = depth; this.force = force; }

    /** Plays the EMF+ records of one EMR_COMMENT payload (after the identifier). */
    comment(cv: Canvas, data: Bytes): void {
        let pos = 0;
        while (!cv.full()) {
            const typ = data.optU16(pos), flags = data.optU16(pos + 2), size = data.optU32(pos + 4), dsize = data.optU32(pos + 8);
            if (typ === undefined || flags === undefined || size === undefined || dsize === undefined) break;
            if (size < 12 || dsize > size - 12 || pos + 12 + dsize > data.length) break;
            const rec = data.sub(pos + 12, dsize);
            guard(() => this.record(cv, typ, flags, rec));
            pos += size;
        }
    }

    /** World units to device pixels before the canvas's own mapping. */
    private xf(): Xform { return mul(this.world, [this.page, 0, 0, this.page, 0, 0]); }
    private painter(): Painter { return new Painter(this.xf(), this.clip ? this.clip.slice() : null); }

    private record(cv: Canvas, typ: number, flags: number, r: Bytes): void {
        if (typ === 0x4001) {
            // Header: dual files also draw with EMF records, which win.
            this.active = (flags & 1) === 0 || this.force;
            const d = r.optU32(8);
            if (d !== undefined && d > 0 && d < 100_000) this.dpi = d;
            return;
        }
        if (!this.active) { if (typ !== 0x4002) this.skippedDual = true; return; }
        if (typ === 0x4008) this.object(flags, r);
        else if (typ === 0x4009 || typ === 0x4013 || (typ >= 0x401a && typ <= 0x401c) || typ === 0x4036) this.recordImageTextRegion(cv, typ, flags, r);
        else if (typ >= 0x4025 && typ <= 0x4035) this.recordState(cv, typ, flags, r);
        else if ((typ >= 0x4010 && typ <= 0x4012) || (typ >= 0x4016 && typ <= 0x4019)) this.recordCurve(cv, typ, flags, r);
        else this.recordShape(cv, typ, flags, r);
    }

    /** Rectangle, polygon, ellipse and path records. */
    private recordShape(cv: Canvas, typ: number, flags: number, r: Bytes): void {
        const compressed = (flags & 0x4000) !== 0;
        const id = flags & 0xff;
        switch (typ) {
            case 0x400a: {
                const fill = this.brushOf(flags, r.u32(0));
                if (!fill) return;
                const p = this.painter();
                for (const rc of rects(r, 8, r.u32(4), compressed)) {
                    if (cv.full()) break;
                    p.fill(cv, rectOps(...rc), fill);
                }
                return;
            }
            case 0x400b: {
                const pen = this.pen(id);
                if (!pen) return;
                const p = this.painter();
                for (const rc of rects(r, 4, r.u32(0), compressed)) {
                    if (cv.full()) break;
                    p.stroke(cv, rectOps(...rc), pen);
                }
                return;
            }
            case 0x400c: {
                const fill = this.brushOf(flags, r.u32(0));
                if (fill) this.painter().fill(cv, polyOps(points(r, 8, r.u32(4), compressed), true), fill);
                return;
            }
            case 0x400d: {
                const pen = this.pen(id);
                if (pen) this.painter().stroke(cv, polyOps(points(r, 4, r.u32(0), compressed), (flags & 0x2000) !== 0), pen);
                return;
            }
            case 0x400e: {
                const fill = this.brushOf(flags, r.u32(0));
                const rc = rects(r, 4, 1, compressed)[0];
                if (fill && rc) this.painter().fill(cv, ellipseOps(rc), fill);
                return;
            }
            case 0x400f: {
                const pen = this.pen(id);
                const rc = rects(r, 0, 1, compressed)[0];
                if (pen && rc) this.painter().stroke(cv, ellipseOps(rc), pen);
                return;
            }
            case 0x4014: {
                const fill = this.brushOf(flags, r.u32(0));
                const ops = this.path(id);
                if (fill && ops) this.painter().fill(cv, ops, fill);
                return;
            }
            case 0x4015: {
                const ops = this.path(id);
                const pen = this.pen(r.u32(0));
                if (ops && pen) this.painter().stroke(cv, ops, pen);
                return;
            }
        }
    }

    /** Curve, bezier and arc records. */
    private recordCurve(cv: Canvas, typ: number, flags: number, r: Bytes): void {
        const compressed = (flags & 0x4000) !== 0;
        const id = flags & 0xff;
        switch (typ) {
            case 0x4019: {
                const pen = this.pen(id);
                const pts = points(r, 4, r.u32(0), compressed);
                if (!pen || !pts.length) return;
                const ops: Op[] = [M(pts[0])];
                for (let i = 1; i + 2 < pts.length; i += 3) ops.push(C(pts[i], pts[i + 1], pts[i + 2]));
                this.painter().stroke(cv, ops, pen);
                return;
            }
            // Cardinal splines: FillClosedCurve, DrawClosedCurve, DrawCurve.
            case 0x4016: {
                const fill = this.brushOf(flags, r.u32(0));
                const tension = finite(r.f32(4));
                if (!fill || tension === null) return;
                this.painter().fill(cv, curveOps(points(r, 12, r.u32(8), compressed), tension, true, 0, Infinity), fill);
                return;
            }
            case 0x4017: {
                const pen = this.pen(id);
                const tension = finite(r.f32(0));
                if (!pen || tension === null) return;
                this.painter().stroke(cv, curveOps(points(r, 8, r.u32(4), compressed), tension, true, 0, Infinity), pen);
                return;
            }
            case 0x4018: {
                const pen = this.pen(id);
                const tension = finite(r.f32(0));
                if (!pen || tension === null) return;
                const offset = r.u32(4), segments = r.u32(8);
                this.painter().stroke(cv, curveOps(points(r, 16, r.u32(12), compressed), tension, false, offset, segments), pen);
                return;
            }
            case 0x4010: {
                const fill = this.brushOf(flags, r.u32(0));
                const f = floats(r, 4, 2);
                const rc = rects(r, 12, 1, compressed)[0];
                if (fill && f && rc) this.painter().fill(cv, arcOps(rc, f[0], f[1], true), fill);
                return;
            }
            case 0x4011: case 0x4012: {
                const pen = this.pen(id);
                const f = floats(r, 0, 2);
                const rc = rects(r, 8, 1, compressed)[0];
                if (pen && f && rc) this.painter().stroke(cv, arcOps(rc, f[0], f[1], typ === 0x4011), pen);
                return;
            }
        }
    }

    /** Clear, region fill, image and text records. */
    private recordImageTextRegion(cv: Canvas, typ: number, flags: number, r: Bytes): void {
        const compressed = (flags & 0x4000) !== 0;
        const id = flags & 0xff;
        switch (typ) {
            // Clear: the whole picture in one colour, whatever the clip (a transparent clear leaves nothing to draw).
            case 0x4009: {
                const c = argb(r.u32(0));
                if (!this.frame) return;
                const [x, y, w, h] = this.frame;
                if (c[3] === 0 || !(w > 0 && h > 0)) return;
                const toDevice = invert(mul(cv.world(), cv.deviceAffine()));
                if (!toDevice) return;
                new Painter(toDevice, null).fill(cv, rectOps(x, y, x + w, y + h), { kind: 'solid', color: c });
                return;
            }
            // FillRegion: the region's area (as the clip reads it).
            case 0x4013: {
                const fill = this.brushOf(flags, r.u32(0));
                const o = this.objects[id];
                if (!fill || o?.kind !== 'region' || !o.area || o.area.length < 3) return;
                this.painter().fill(cv, polyOps(o.area, true), fill);
                return;
            }
            case 0x401a: {
                const img = this.image(id);
                const dst = rects(r, 24, 1, compressed)[0];
                if (img && dst) this.drawImage(cv, img, r, [dst[0], dst[1], dst[2] - dst[0], dst[3] - dst[1]]);
                return;
            }
            case 0x401b: {
                const img = this.image(id);
                const pts = points(r, 28, 3, compressed);
                if (!img || pts.length < 3) return;
                const [p0, p1, p2] = pts;
                // The destination parallelogram's top-left, top-right and bottom-left corners; a sheared or
                // rotated one is drawn into its bounding rectangle's axes.
                this.drawImage(cv, img, r, [p0[0], p0[1], p1[0] - p0[0] + (p2[0] - p0[0]), p2[1] - p0[1] + (p1[1] - p0[1])]);
                return;
            }
            case 0x401c: this.drawString(cv, flags, r); return;
            case 0x4036: this.drawDriverString(cv, flags, r); return;
        }
    }

    /** Save / restore, transform and clip records. */
    private recordState(cv: Canvas, typ: number, flags: number, r: Bytes): void {
        const id = flags & 0xff;
        switch (typ) {
            case 0x4025: case 0x4028: this.push(r.u32(0)); return;
            case 0x4027: this.push(r.u32(24)); return;
            case 0x4026: case 0x4029: this.pop(r.u32(0)); return;
            case 0x402a: { const m = matrix(r, 0); if (m) this.world = m; return; }
            case 0x402b: this.world = IDENTITY; return;
            case 0x402c: { const m = matrix(r, 0); if (m) this.apply(m, flags); return; }
            case 0x402d: this.apply([1, 0, 0, 1, r.f32(0), r.f32(4)], flags); return;
            case 0x402e: this.apply([r.f32(0), 0, 0, r.f32(4), 0, 0], flags); return;
            case 0x402f: {
                const a = (r.f32(0) * Math.PI) / 180;
                this.apply([Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0], flags);
                return;
            }
            case 0x4030: {
                const page = r.f32(0) * unitPx(flags & 0xff, this.dpi);
                if (Number.isFinite(page) && page > 0 && page < 1e6) this.page = page;
                return;
            }
            case 0x4031: this.clip = null; return;
            case 0x4032: {
                const f = floats(r, 0, 4);
                if (!f) return;
                const [x, y, w, h] = f;
                this.combine(flags, mapArea(rectPoly([x, y, x + w, y + h]), mul(this.xf(), cv.deviceAffine())));
                return;
            }
            case 0x4033: {
                const ops = this.path(id);
                if (ops) this.combine(flags, mapArea(areaOfOps(ops), mul(this.xf(), cv.deviceAffine())));
                return;
            }
            case 0x4034: {
                const o = this.objects[id];
                if (o?.kind === 'region') this.combine(flags, mapArea(o.area, mul(this.xf(), cv.deviceAffine())));
                return;
            }
            case 0x4035: {
                const f = floats(r, 0, 2);
                if (!f) return;
                const a = mul(this.xf(), cv.deviceAffine());
                const ox = f[0] * a[0] + f[1] * a[2], oy = f[0] * a[1] + f[1] * a[3];
                if (this.clip) this.clip = this.clip.map(p => [p[0] + ox, p[1] + oy]);
                return;
            }
        }
    }

    /** Without the `A` flag a transform is applied before the world transform (prepended). */
    private apply(m: Xform, flags: number): void {
        if (!m.every(Number.isFinite)) return;
        this.world = (flags & 0x2000) !== 0 ? mul(this.world, m) : mul(m, this.world);
    }

    private push(id: number): void {
        if (this.stack.length < MAX_STACK) this.stack.push({ id, world: this.world, page: this.page, clip: this.clip });
    }

    private pop(id: number): void {
        let i = -1;
        for (let k = this.stack.length - 1; k >= 0; k--) if (this.stack[k].id === id) { i = k; break; }
        if (i < 0) return;
        const s = this.stack[i];
        this.world = s.world; this.page = s.page; this.clip = s.clip;
        this.stack.length = i;
    }

    /** Combines a new clip area with the current one: replace, intersect and union (as the rectangle around both). XOR, exclude and complement leave the clip. */
    private combine(flags: number, next: Area): void {
        const mode = (flags >> 8) & 0xf;
        if (mode === 0) this.clip = next;
        else if (mode === 1) this.clip = areaIntersect(this.clip, next);
        else if (mode === 2) this.clip = areaUnion(this.clip, next);
    }

    private object(flags: number, r: Bytes): void {
        const id = flags & 0xff;
        const kind = (flags >> 8) & 0x7f;
        if ((flags & 0x8000) !== 0) {
            // A continued object: the total size, then this record's share of the bytes.
            const total = Math.min(r.u32(0), MAX_OBJECT_BYTES);
            const chunk = r.tail(4).b;
            let p = this.partial;
            this.partial = null;
            if (!p || p.id !== id || p.kind !== kind || p.total !== total) p = { id, kind, total, chunks: [], len: 0 };
            const take = chunk.subarray(0, Math.min(chunk.length, Math.max(0, p.total - p.len)));
            p.chunks.push(take); p.len += take.length;
            if (p.len >= p.total) this.store(p.id, guard(() => parseObject(p!.kind, new Bytes(concat(p!.chunks, p!.len)), this.depth)) ?? null);
            else this.partial = p;
            return;
        }
        // The last piece of a continued object comes without the continue flag.
        const p = this.partial;
        this.partial = null;
        if (p && p.id === id && p.kind === kind) {
            const take = r.b.subarray(0, Math.min(r.length, Math.max(0, p.total - p.len)));
            p.chunks.push(take); p.len += take.length;
            this.store(id, guard(() => parseObject(kind, new Bytes(concat(p.chunks, p.len)), this.depth)) ?? null);
            return;
        }
        this.store(id, guard(() => parseObject(kind, r, this.depth)) ?? null);
    }

    private store(id: number, obj: Obj | null): void {
        if (id >= this.objects.length) return;
        const old = this.objects[id];
        if (old) this.objectBytes = Math.max(0, this.objectBytes - objCost(old));
        this.objects[id] = null;
        if (obj) {
            const cost = objCost(obj);
            if (this.objectBytes + cost <= MAX_BYTES) { this.objectBytes += cost; this.objects[id] = obj; }
        }
    }

    private path(id: number): Op[] | null { const o = this.objects[id]; return o?.kind === 'path' ? o.ops : null; }
    private pen(id: number): [Rgba8, number] | null { const o = this.objects[id]; return o?.kind === 'pen' ? [o.color, o.width] : null; }
    private image(id: number): ImageData | null { const o = this.objects[id]; return o?.kind === 'image' ? o.data : null; }
    private font(id: number): FontObj | null { const o = this.objects[id]; return o?.kind === 'font' ? o.font : null; }

    /** The brush of a fill record: an ARGB value with the `S` flag, else a brush object. */
    private brushOf(flags: number, v: number): Fill | null {
        if ((flags & 0x8000) !== 0) return { kind: 'solid', color: argb(v) };
        const o = this.objects[v];
        return o?.kind === 'brush' ? o.fill : null;
    }

    /** DrawImage and DrawImagePoints: the source rectangle (pixels) cut from the image, drawn into world rectangle `dst` = `[x, y, w, h]`. */
    private drawImage(cv: Canvas, img: ImageData, r: Bytes, dst: [number, number, number, number]): void {
        if (img.kind === 'meta') { this.painter().picture(cv, dst, img.pic); return; }
        const f = floats(r, 8, 4);
        if (!f) return;
        const src = r.u32(4) === 2 ? f.map(v => Math.min(1e9, Math.max(-1e9, Math.round(v)))) : [0, 0, 0, 0];
        const out = isEncoded(img.img) ? clipEncoded(img.img, src, dst) : dib.clipBlit(img.img, src, dst);
        if (out) this.painter().image(cv, out.dst, out.img);
    }

    /** The font as a LOGFONT whose height is in world units. */
    private logFont(f: FontObj): LogFont {
        const em = f.unit === 0 ? f.em : (f.em * unitPx(f.unit, this.dpi)) / this.page;
        return {
            font: { ...defaultFont(), family: f.family, height: -Math.min(1e6, Math.max(0, em)), weight: (f.style & 1) !== 0 ? 700 : 400, italic: (f.style & 2) !== 0, underline: (f.style & 4) !== 0, strike: (f.style & 8) !== 0 },
            escapement: 0,
        };
    }

    /** DrawString: lines of text laid out in a rectangle by the string format's alignments. */
    private drawString(cv: Canvas, flags: number, r: Bytes): void {
        const font = this.font(flags & 0xff);
        const fill = this.brushOf(flags, r.u32(0));
        if (!font || !fill) return;
        const color = fillColor(fill);
        const fo = this.objects[r.u32(4)];
        const fmt: Format = fo?.kind === 'format' ? fo.format : { flags: 0, align: 0, lineAlign: 0 };
        const len = Math.min(r.u32(8), MAX_CHARS);
        const rc = floats(r, 12, 4);
        if (!rc) return;
        const [x, y, w, h] = rc;
        const units: number[] = [];
        for (let i = 0; i < len; i++) units.push(r.u16(28 + i * 2));
        const lf = this.logFont(font);
        const em = -lf.font.height;
        const wrap = w > 0 && (fmt.flags & 0x1000) === 0;
        const lines: number[][] = [];
        let cur: number[] = [];
        const flush = () => {
            const l = cur.filter(u => u !== 0x0d);
            if (wrap) lines.push(...wrapLine(l, w, em)); else lines.push(l);
            cur = [];
        };
        for (const u of units) { if (u === 0x0a) flush(); else cur.push(u); }
        flush();
        const lineH = em * 1.2;
        const [ax, taH] = fmt.align === 1 ? [x + w / 2, TA_CENTER] : fmt.align === 2 ? [x + w, TA_RIGHT] : [x, 0];
        const block = lineH * lines.length;
        const top = fmt.lineAlign === 1 ? y + (h - block) / 2 : fmt.lineAlign === 2 ? y + h - block : y;
        const clip = w > 0 && h > 0 && (fmt.flags & 0x4000) === 0 ? ([x, y, x + w, y + h] as [number, number, number, number]) : null;
        const p = this.painter();
        lines.forEach((line, i) => {
            if (!line.length) return;
            const [text, dx] = decodeUtf16(line, []);
            let at: P = [ax, top + lineH * i];
            let ta = taH;
            if (fmt.lineAlign === 2 && lines.length === 1) { at = [ax, y + h]; ta = taH | TA_BOTTOM; }
            p.text(cv, at, text, dx, { color, font: lf, align: ta, clip }, IDENTITY);
        });
    }

    /** DrawDriverString with character codes (CmapLookup): positioned glyphs on a baseline. */
    private drawDriverString(cv: Canvas, flags: number, r: Bytes): void {
        const font = this.font(flags & 0xff);
        const fill = this.brushOf(flags, r.u32(0));
        if (!font || !fill) return;
        const color = fillColor(fill);
        const opts = r.u32(4);
        const n = Math.min(r.u32(12), MAX_CHARS);
        let units: number[] | null = [];
        for (let i = 0; i < n; i++) units.push(r.u16(16 + i * 2));
        if ((opts & 1) === 0) {
            // Glyph indices into the font. The reader knows no fonts, but the classic Windows core fonts
            // keep the standard Macintosh glyph order for ASCII, so those map back.
            units = glyphsToChars(font.family, units);
            if (!units) return;
        }
        const pos = points(r, 16 + n * 2, n, false);
        const m = r.u32(8) !== 0 ? matrix(r, 16 + n * 10) : IDENTITY;
        if (!m || !pos.length) return;
        const lf = this.logFont(font);
        let dx: number[] = [];
        if ((opts & 4) === 0) {
            for (let i = 0; i + 1 < pos.length; i++) dx.push(pos[i + 1][0] - pos[i][0]);
            dx.push(dx.length ? dx[dx.length - 1] : -lf.font.height * 0.5);
        }
        let text: string;
        [text, dx] = decodeUtf16(units, dx);
        this.painter().text(cv, pos[0], text, dx, { color, font: lf, align: TA_BASELINE, clip: null }, m);
    }
}

function concat(chunks: Uint8Array[], len: number): Uint8Array {
    const out = new Uint8Array(len);
    let o = 0;
    for (const c of chunks) { out.set(c, o); o += c.length; }
    return out;
}

function objCost(o: Obj): number {
    if (o.kind === 'image') return o.data.kind === 'bitmap' ? (isEncoded(o.data.img) ? o.data.img.bytes.length : o.data.img.px.length) : o.data.pic.items.length * 128;
    if (o.kind === 'brush' && o.fill.kind === 'texture') return isEncoded(o.fill.img) ? o.fill.img.bytes.length : o.fill.img.px.length;
    if (o.kind === 'path') return o.ops.length * 56;
    return 0;
}

/** Page unit to device pixels: world, display and pixel are 1; point, inch, document, mm. */
function unitPx(unit: number, dpi: number): number {
    switch (unit) {
        case 3: return dpi / 72;
        case 4: return dpi;
        case 5: return dpi / 300;
        case 6: return dpi / 25.4;
        default: return 1;
    }
}

interface TextStyle { color: Rgba8; font: LogFont; align: number; clip: [number, number, number, number] | null }

/** Draws through the canvas with EMF+'s transform, clip and its own pen or brush, then puts the canvas's GDI state back. */
class Painter {
    private readonly xf: Xform;
    private readonly clip: Area;
    constructor(xf: Xform, clip: Area) { this.xf = xf; this.clip = clip; }

    private begin(cv: Canvas, pre: Xform): void {
        const world = cv.world();
        cv.saveDc();
        cv.modifyWorld(mul(mul(pre, this.xf), world), 4);
        cv.setClip(this.clip);
    }

    private end(cv: Canvas): void {
        cv.restoreDc(-1);
        cv.setClip(null);
    }

    fill(cv: Canvas, ops: Op[], fill: Fill): void {
        this.begin(cv, IDENTITY);
        cv.setPen({ style: PS_NULL, width: 0, color: [0, 0, 0, 0] });
        if (fill.kind === 'solid') {
            cv.setBrush(mkBrush(BS_SOLID, fill.color));
            cv.shape(ops, true, false);
        } else if (fill.kind === 'hatch') {
            const px = hatchTile(fill.style, fill.fg, fill.bg);
            if (px) cv.tileShape(ops, { w: 8, h: 8, px, cell: cv.patternPx });
            else {
                // GDI+ has many more hatch styles than GDI: those fill with the blend of both colours.
                cv.setBrush(mkBrush(BS_SOLID, lerp(fill.fg, fill.bg, 0.5)));
                cv.shape(ops, true, false);
            }
        } else {
            // Device point to brush space: invert brush space → world → device.
            const inv = invert(mul(fillXf(fill), cv.deviceAffine()));
            if (inv) cv.shadeShape(ops, p => sample(fill, apply(inv, p)));
        }
        this.end(cv);
    }

    stroke(cv: Canvas, ops: Op[], [color, width]: [Rgba8, number]): void {
        this.begin(cv, IDENTITY);
        cv.setPen({ style: 0, width, color });
        cv.setBrush(mkBrush(BS_NULL, [0, 0, 0, 0]));
        cv.shape(ops, false, true);
        this.end(cv);
    }

    image(cv: Canvas, dst: [number, number, number, number], img: Rgba | Encoded): void {
        this.begin(cv, IDENTITY);
        cv.bitmap(dst, img);
        this.end(cv);
    }

    /** A nested metafile's picture stretched into world rectangle `dst` = `[x, y, w, h]`. */
    picture(cv: Canvas, [x, y, w, h]: [number, number, number, number], pic: Picture): void {
        this.begin(cv, IDENTITY);
        const sx = w / pic.width, sy = h / pic.height;
        const m = mul([sx, 0, 0, sy, x, y], cv.deviceAffine());
        const scale = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
        const pt = (a: number, b: number): P => apply(m, [a, b]);
        const ops = (segs: Seg[]): Op[] => segs.map(s => s.k === 'M' ? M(pt(s.x, s.y)) : s.k === 'L' ? L(pt(s.x, s.y)) : s.k === 'C' ? C(pt(s.x1, s.y1), pt(s.x2, s.y2), pt(s.x, s.y)) : Z);
        // The nested picture's own clip regions are not carried over: each item takes the canvas's current clip.
        for (const item of pic.items) {
            if (cv.full()) break;
            let raw: Raw;
            if (item.kind === 'path') {
                raw = { kind: 'path', ops: ops(item.segs), fill: item.fill, stroke: item.stroke ? [item.stroke[0], item.stroke[1] * scale] : null, evenOdd: item.evenOdd, region: null };
            } else if (item.kind === 'pattern') {
                const t = item.tile;
                const tile: RawTile = { w: t.width, h: t.height, px: t.rgba, cell: t.cell[0] * scale };
                raw = { kind: 'pattern', ops: ops(item.segs), evenOdd: item.evenOdd, tile, region: null };
            } else if (item.kind === 'bitmap') {
                const a = pt(item.rect[0], item.rect[1]), b = pt(item.rect[0] + item.rect[2], item.rect[1] + item.rect[3]);
                let img = item.img;
                if (isEncoded(img)) {
                    const fx = a[0] > b[0], fy = a[1] > b[1];
                    if (fx || fy) img = { ...img, flip: [!!img.flip?.[0] !== fx, !!img.flip?.[1] !== fy] };
                } else {
                    img = { ...img, px: img.px.slice() };
                    dib.flip(img, a[0] > b[0], a[1] > b[1]);
                }
                raw = { kind: 'bitmap', rect: [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])], img, region: null };
            } else {
                const t = { ...item.text };
                t.transform = mul(t.transform as Xform, m);
                if (t.clip) {
                    const [x0, y0, x1, y1] = t.clip;
                    const p = pt(x0, y0), q = pt(x1, y1);
                    t.clip = [Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[0], q[0]), Math.max(p[1], q[1])];
                }
                raw = { kind: 'text', text: t, region: null };
            }
            cv.pushDevice(raw);
        }
        this.end(cv);
    }

    text(cv: Canvas, at: P, text: string, dx: number[], style: TextStyle, pre: Xform): void {
        this.begin(cv, pre);
        cv.setTextStyle(style.color, style.font, style.align);
        cv.drawText(at, text, dx, style.clip ? ETO_CLIPPED : 0, style.clip);
        this.end(cv);
    }
}

const apply = (m: Xform, p: P): P => [p[0] * m[0] + p[1] * m[2] + m[4], p[0] * m[1] + p[1] * m[3] + m[5]];

function invert(m: Xform): Xform | null {
    const det = m[0] * m[3] - m[1] * m[2];
    if (!Number.isFinite(det) || Math.abs(det) < 1e-12) return null;
    const a = m[3] / det, b = -m[1] / det, c = -m[2] / det, d = m[0] / det;
    return [a, b, c, d, -(m[4] * a + m[5] * c), -(m[4] * b + m[5] * d)];
}

/** ARGB (0xAARRGGBB) to RGBA. */
const argb = (v: number): Rgba8 => [(v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff, (v >>> 24) & 0xff];

/** `n` finite f32 values at `off`, or null. */
function floats(r: Bytes, off: number, n: number): number[] | null {
    const v: number[] = [];
    for (let i = 0; i < n; i++) v.push(r.f32(off + i * 4));
    return v.every(Number.isFinite) ? v : null;
}

const matrix = (r: Bytes, off: number): Xform | null => floats(r, off, 6) as Xform | null;

const finite = (v: number): number | null => (Number.isFinite(v) ? v : null);

function parseObject(kind: number, r: Bytes, depth: number): Obj | null {
    switch (kind) {
        case 1: { const f = brushObj(r, 0, depth); return f ? { kind: 'brush', fill: f } : null; }
        case 2: return penObj(r, depth);
        case 3: { const ops = pathObj(r); return ops ? { kind: 'path', ops } : null; }
        case 4: return regionObj(r);
        case 5: { const d = imageObj(r, depth); return d ? { kind: 'image', data: d } : null; }
        case 6: return fontObj(r);
        case 7: return { kind: 'format', format: { flags: r.u32(4), align: r.u32(12), lineAlign: r.u32(16) } };
        default: return null;
    }
}

/** A brush object at `off`: version, type, then the type's data. */
function brushObj(r: Bytes, off: number, depth: number): Fill | null {
    const d = r.tail(off + 8);
    switch (r.u32(off + 4)) {
        case 0: return { kind: 'solid', color: argb(d.u32(0)) };
        case 1: return { kind: 'hatch', style: d.u32(0), fg: argb(d.u32(4)), bg: argb(d.u32(8)) };
        case 2: {
            const bflags = d.u32(0);
            const wrap = d.u32(4);
            let xf: Xform = IDENTITY, o = 8;
            if ((bflags & 0x2) !== 0) { const m = matrix(d, 8); if (!m) return null; xf = m; o = 32; }
            const img = imageObj(d.tail(o), depth);
            if (!img || img.kind !== 'bitmap') return null;
            return { kind: 'texture', img: img.img, wrap, xf };
        }
        case 3: return pathGradient(d);
        case 4: return linearGradient(d);
        default: return null;
    }
}

function linearGradient(d: Bytes): Fill | null {
    const bflags = d.u32(0);
    const wrap = d.u32(4);
    const rect = floats(d, 8, 4);
    if (!rect) return null;
    const c0 = argb(d.u32(24)), c1 = argb(d.u32(28));
    let off = 40;
    let xf: Xform = IDENTITY;
    if ((bflags & 0x2) !== 0) {
        const m = matrix(d, off);
        if (!m) return null;
        xf = m;
        off += 24;
    }
    let stops: Stops = [[0, c0], [1, c1]];
    if ((bflags & 0x4) !== 0) {
        // Preset colours: positions, then one colour each.
        const n = Math.min(d.u32(off), MAX_STOPS);
        stops = [];
        for (let i = 0; i < n; i++) stops.push([d.f32(off + 4 + i * 4), argb(d.u32(off + 4 + n * 4 + i * 4))]);
    } else if ((bflags & 0x8) !== 0) {
        // Blend factors: positions, then how far from the start colour to the end colour.
        const n = Math.min(d.u32(off), MAX_STOPS);
        stops = [];
        for (let i = 0; i < n; i++) {
            const k = d.f32(off + 4 + n * 4 + i * 4);
            stops.push([d.f32(off + 4 + i * 4), lerp(c0, c1, Math.min(1, Math.max(0, k)))]);
        }
    }
    stops = stops.filter(s => Number.isFinite(s[0])).sort((a, b) => a[0] - b[0]);
    return stops.length ? { kind: 'linear', rect: rect as [number, number, number, number], stops, wrap, xf } : null;
}

/** A path gradient: from the centre colour to the (first) surrounding colour at the boundary, taken as the ellipse in the boundary's bounding rectangle. */
function pathGradient(d: Bytes): Fill | null {
    const bflags = d.u32(0);
    const centerC = argb(d.u32(8));
    const c = floats(d, 12, 2);
    if (!c) return null;
    const nc = Math.min(d.u32(20), MAX_STOPS);
    const surround = nc > 0 ? argb(d.u32(24)) : centerC;
    let off = 24 + nc * 4;
    let bb: [number, number, number, number] | null;
    if ((bflags & 0x1) !== 0) {
        const size = d.u32(off);
        const ops = pathObj(d.tail(off + 4));
        bb = ops ? opsBbox(ops) : null;
        off += 4 + size;
    } else {
        const n = d.u32(off);
        const pts = points(d, off + 4, n, false);
        bb = opsBbox(polyOps(pts, true));
        off += 4 + 8 * Math.min(n, MAX_POINTS);
    }
    if (!bb) return null;
    const xf = (bflags & 0x2) !== 0 ? matrix(d, off) : IDENTITY;
    if (!xf) return null;
    return { kind: 'radial', center: [c[0], c[1]], radius: [(bb[2] - bb[0]) / 2, (bb[3] - bb[1]) / 2], stops: [[0, centerC], [1, surround]], xf };
}

/** A pen object: version, type, then pen data (flags, unit, width, optional fields), then a brush. */
function penObj(r: Bytes, depth: number): Obj | null {
    const pflags = r.u32(8);
    const width = r.f32(16);
    let off = 20;
    for (const [bit, len] of [[0x1, 24], [0x2, 4], [0x4, 4], [0x8, 4], [0x10, 4], [0x20, 4], [0x40, 4], [0x80, 4]]) if ((pflags & bit) !== 0) off += len;
    for (const bit of [0x100, 0x200, 0x400]) {
        if ((pflags & bit) !== 0) off += bit === 0x200 ? 4 : 4 + 4 * Math.min(r.u32(off), MAX_POINTS);
    }
    for (const bit of [0x800, 0x1000]) if ((pflags & bit) !== 0) off += 4 + Math.min(r.u32(off), 1 << 20);
    const f = brushObj(r, off, depth);
    if (!f) return null;
    return { kind: 'pen', color: fillColor(f), width: Number.isFinite(width) ? Math.min(1e5, Math.max(0, width)) : 0 };
}

/** A path object: points, then one type byte per point (start, line, Bézier; 0x80 closes). */
function pathObj(r: Bytes): Op[] | null {
    const n = Math.min(r.u32(4), MAX_POINTS);
    const pflags = r.u32(8);
    // Relative (0x0800) and run-length encoded (0x1000) points: not read yet.
    if ((pflags & 0x1800) !== 0) return null;
    const compressed = (pflags & 0x4000) !== 0;
    const pts = points(r, 12, n, compressed);
    const types = r.slice(12 + n * (compressed ? 4 : 8), n);
    const ops: Op[] = [];
    let i = 0;
    while (i < n) {
        const t = types[i], p = pts[i];
        if ((t & 0x07) === 0) ops.push(M(p));
        else if ((t & 0x07) === 3 && i + 2 < n) {
            ops.push(C(p, pts[i + 1], pts[i + 2]));
            if ((types[i + 2] & 0x80) !== 0) ops.push(Z);
            i += 3;
            continue;
        } else ops.push(L(p));
        if ((t & 0x80) !== 0) ops.push(Z);
        i++;
    }
    return ops;
}

/** A region object as a convex area in world units (non-convex parts become their bounding rectangle). */
function regionObj(r: Bytes): Obj | null {
    const work = { n: 0 };
    const res = regionNode(r, 8, 0, work);
    return res ? { kind: 'region', area: res[0] } : null;
}

/** One region node at `off`: its area and its length in bytes. */
function regionNode(r: Bytes, off: number, depth: number, work: { n: number }): [Area, number] | null {
    work.n++;
    if (depth > MAX_REGION_DEPTH || work.n > MAX_REGION_WORK) return null;
    const t = r.u32(off);
    if (t === 0x1000_0000) {
        const f = floats(r, off + 4, 4);
        if (!f) return null;
        const [x, y, w, h] = f;
        return [rectPoly([Math.min(x, x + w), Math.min(y, y + h), Math.max(x, x + w), Math.max(y, y + h)]), 20];
    }
    if (t === 0x1000_0001) {
        const size = r.u32(off + 4);
        if (size < 12) return null;
        const data = r.sub(off + 8, size);
        work.n += Math.min(data.u32(4), MAX_POINTS);
        if (work.n > MAX_REGION_WORK) return null;
        const ops = pathObj(data);
        return ops ? [areaOfOps(ops), 8 + size] : null;
    }
    if (t === 0x1000_0002) return [[], 4];
    if (t === 0x1000_0003) return [null, 4];
    if (t <= 5) {
        const a = regionNode(r, off + 4, depth + 1, work);
        if (!a) return null;
        const b = regionNode(r, off + 4 + a[1], depth + 1, work);
        if (!b) return null;
        // XOR, exclude, complement: the left area bounds the result closely enough.
        const out = t === 0 ? b[0] : t === 1 ? areaIntersect(a[0], b[0]) : t === 2 ? areaUnion(a[0], b[0]) : a[0];
        return [out, 4 + a[1] + b[1]];
    }
    return null;
}

/** The area a path encloses: its outline when that is one convex figure, else the rectangle around it. */
function areaOfOps(ops: Op[]): P[] {
    const subs = flatten(ops);
    if (subs.length === 1) {
        const c = convex(subs[0][0]);
        if (c) return c;
    }
    const b = opsBbox(ops);
    return b ? rectPoly(b) : [];
}

function areaIntersect(a: Area, b: Area): Area {
    if (a === null) return b;
    if (b === null) return a;
    if (a.length >= 3 && b.length >= 3) return convex(clipPolygon(a, b)) ?? [];
    return [];
}

function areaUnion(a: Area, b: Area): Area {
    if (a === null || b === null) return null;
    if (a.length < 3) return b;
    if (b.length < 3) return a;
    const bb = ptsBbox([...a, ...b]);
    return bb ? rectPoly(bb) : [];
}

/** An area through an affine map (which keeps it convex; the orientation is put right again). */
function mapArea(a: Area, m: Xform): Area {
    if (a === null) return null;
    const mapped = a.map(p => apply(m, p));
    return mapped.length < 3 ? [] : convex(mapped) ?? [];
}

/** An elliptical arc in `rect` from `start` sweeping `sweep` degrees (clockwise on screen), as cubics; a pie adds the lines to and from the centre. */
function arcOps([l, t, r, b]: [number, number, number, number], start: number, sweep0: number, pie: boolean): Op[] {
    const cx = (l + r) / 2, cy = (t + b) / 2, rx = (r - l) / 2, ry = (b - t) / 2;
    const sweep = Math.min(360, Math.max(-360, sweep0));
    // GDI+ angles are along rays from the centre; turn them into the ellipse's parameter.
    const param = (deg: number) => { const a = (deg * Math.PI) / 180; return Math.atan2(rx * Math.sin(a), ry * Math.cos(a)); };
    const t0 = param(start);
    let dt = Math.abs(sweep) >= 360 ? Math.sign(sweep) * Math.PI * 2 : param(start + sweep) - t0;
    if (Math.abs(sweep) < 360) {
        while (sweep > 0 && dt < 0) dt += Math.PI * 2;
        while (sweep < 0 && dt > 0) dt -= Math.PI * 2;
    }
    const at = (u: number): P => [cx + rx * Math.cos(u), cy + ry * Math.sin(u)];
    const ops: Op[] = pie ? [M([cx, cy]), L(at(t0))] : [M(at(t0))];
    const n = Math.min(4, Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2))));
    const step = dt / n;
    const k = (4 / 3) * Math.tan(step / 4);
    for (let i = 0; i < n; i++) {
        const a = t0 + step * i, e = t0 + step * (i + 1);
        const p0 = at(a), p3 = at(e);
        ops.push(C([p0[0] - k * rx * Math.sin(a), p0[1] + k * ry * Math.cos(a)], [p3[0] + k * rx * Math.sin(e), p3[1] - k * ry * Math.cos(e)], p3));
    }
    if (pie) ops.push(Z);
    return ops;
}

/** A font object: em size, unit, style flags, then the family name in UTF-16. */
function fontObj(r: Bytes): Obj | null {
    const em = r.f32(4);
    const n = Math.min(r.u32(20), 64);
    const units: number[] = [];
    for (let i = 0; i < n; i++) units.push(r.u16(24 + i * 2));
    const family = decodeUtf16(units, [])[0].replace(/\0+$/, '');
    return Number.isFinite(em) ? { kind: 'font', font: { em, unit: r.u32(8), style: r.u32(12), family } } : null;
}

/** An image object: a bitmap of raw pixels or a compressed (PNG, JPEG, GIF…) file, or a nested metafile. */
function imageObj(r: Bytes, depth: number): ImageData | null {
    const t = r.u32(4);
    if (t === 1) { const img = bitmapObj(r); return img ? { kind: 'bitmap', img } : null; }
    if (t === 2) { const pic = metafileObj(r, depth); return pic ? { kind: 'meta', pic } : null; }
    return null;
}

/** A metafile image: type, size, then a WMF (placeable or not) or EMF file, parsed as a picture. */
function metafileObj(r: Bytes, depth: number): Picture | null {
    if (depth + 1 > MAX_NESTING) return null;
    const size = r.u32(12);
    const data = guard(() => r.slice(16, size)) ?? r.tail(16).b;
    let pic: Picture | null = null;
    try {
        pic = parseNested(data, depth + 1);
    } catch {
        pic = null;
    }
    return pic && pic.width > 0 && pic.height > 0 ? pic : null;
}

/** Set by index.ts so nested pictures parse with the same entry point (avoids an import cycle at load time). */
let parseNested: (b: Uint8Array, depth: number) => Picture = () => { throw new Error('nested parse not set'); };
export function setNestedParser(f: (b: Uint8Array, depth: number) => Picture): void { parseNested = f; }

function bitmapObj(r: Bytes): Rgba | Encoded | null {
    const w = r.i32(8), h = r.i32(12), stride = r.i32(16);
    const format = r.u32(20);
    const data = r.tail(28);
    if (r.u32(24) === 1) return decodeCompressed(data.b);
    if (w <= 0 || h <= 0 || w * h > MAX_PIXELS) return null;
    const bpp = (format >>> 8) & 0xff;
    let pal: Rgba8[] = [];
    let pixels = data;
    if ((format & 0x0001_0000) !== 0) {
        // Indexed formats carry a palette first: flags, count, ARGB entries.
        const n = Math.min(data.u32(4), 256);
        for (let i = 0; i < n; i++) pal.push(argb(data.u32(8 + i * 4)));
        pixels = data.tail(8 + n * 4);
    }
    const row = Math.ceil((w * bpp) / 8);
    const strideAbs = Math.max(Math.abs(stride), row);
    const px = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) {
        const line = pixels.slice(y * strideAbs, row);
        for (let x = 0; x < w; x++) {
            let c: Rgba8;
            if ((bpp === 1 || bpp === 4 || bpp === 8) && pal.length) {
                const bit = x * bpp;
                const i = (line[bit >> 3] >> (8 - bpp - (bit % 8))) & ((1 << bpp) - 1);
                c = pal[i] ?? [0, 0, 0, 255];
            } else if (bpp === 24) {
                const p = x * 3;
                c = [line[p + 2], line[p + 1], line[p], 255];
            } else if (format === 0x0002_2009 && bpp === 32) {
                const p = x * 4;
                c = [line[p + 2], line[p + 1], line[p], 255];
            } else if (format === 0x000e_200b && bpp === 32) {
                const p = x * 4;
                const a = line[p + 3];
                const un = (v: number) => (a === 0 ? v : Math.min(255, Math.floor((v * 255 + (a >> 1)) / a)));
                c = [un(line[p + 2]), un(line[p + 1]), un(line[p]), a];
            } else if (bpp === 32) {
                const p = x * 4;
                c = [line[p + 2], line[p + 1], line[p], line[p + 3]];
            } else if (format === 0x0002_1006 && bpp === 16) {
                const v = line[x * 2] | (line[x * 2 + 1] << 8);
                const s = (v: number, bits: number) => Math.floor((v * 255) / ((1 << bits) - 1));
                c = [s(v >> 11, 5), s((v >> 5) & 0x3f, 6), s(v & 0x1f, 5), 255];
            } else if (bpp === 16) {
                const v = line[x * 2] | (line[x * 2 + 1] << 8);
                const s = (v: number) => Math.floor(((v & 0x1f) * 255) / 31);
                c = [s(v >> 10), s(v >> 5), s(v), 255];
            } else {
                return null;
            }
            if (c.some(v => v === undefined)) return null;
            px.set(c, (y * w + x) * 4);
        }
    }
    // A negative stride stores the rows bottom-up.
    const img: Rgba = { w, h, bottomUp: stride < 0, px };
    if (img.bottomUp) { dib.flip(img, false, true); img.bottomUp = false; }
    return img;
}

/** Like dib.clipBlit for an encoded image: the source rectangle becomes its crop. */
function clipEncoded(img: Encoded, src0: number[], dst: number[]): { img: Encoded; dst: [number, number, number, number] } | null {
    const [sx, sy, sw, sh] = src0[2] > 0 && src0[3] > 0 ? src0 : [0, 0, img.w, img.h];
    const x0 = Math.max(sx, 0), x1 = Math.min(sx + sw, img.w);
    const y0 = Math.max(sy, 0), y1 = Math.min(sy + sh, img.h);
    if (x1 <= x0 || y1 <= y0) return null;
    const kx = dst[2] / sw, ky = dst[3] / sh;
    const whole = x0 === 0 && y0 === 0 && x1 === img.w && y1 === img.h;
    return { img: { ...img, crop: whole ? null : [x0, y0, x1 - x0, y1 - y0] }, dst: [dst[0] + (x0 - sx) * kx, dst[1] + (y0 - sy) * ky, (x1 - x0) * kx, (y1 - y0) * ky] };
}

/** `n` points at `off`: 16-bit integers when compressed, else 32-bit floats (non-finite → short read). */
function points(r: Bytes, off: number, n0: number, compressed: boolean): P[] {
    const n = Math.min(n0, MAX_POINTS);
    const v: P[] = [];
    for (let i = 0; i < n; i++) {
        if (compressed) v.push([r.i16(off + i * 4), r.i16(off + i * 4 + 2)]);
        else {
            const x = r.f32(off + i * 8), y = r.f32(off + i * 8 + 4);
            if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
            v.push([x, y]);
        }
    }
    return v;
}

/** `n` rectangles (x, y, w, h) at `off`, as `[l, t, r, b]`. */
function rects(r: Bytes, off: number, n: number, compressed: boolean): [number, number, number, number][] {
    const pts = points(r, off, Math.min(n, MAX_POINTS / 2) * 2, compressed);
    const out: [number, number, number, number][] = [];
    for (let i = 0; i + 1 < pts.length; i += 2) out.push([pts[i][0], pts[i][1], pts[i][0] + pts[i + 1][0], pts[i][1] + pts[i + 1][1]]);
    return out;
}

/**
 * A GDI+ cardinal spline through `pts` as cubic Béziers: each segment's control points lie a third of
 * `tension` along the neighbouring chords. `closed` joins the last point back to the first; an open
 * curve draws `segments` segments from point `offset`.
 */
function curveOps(pts: P[], tension: number, closed: boolean, offset: number, segments: number): Op[] {
    const n = pts.length;
    if (n < 2) return [];
    const k = Math.min(10, Math.max(0, tension)) / 3;
    const at = (i: number): P => pts[closed ? remEuclid(i, n) : Math.min(n - 1, Math.max(0, i))] ?? [0, 0];
    const first = closed ? 0 : Math.min(offset, n - 1);
    const count = closed ? n : Math.min(segments, n - 1 - first);
    const ops: Op[] = [M(at(first))];
    for (let s = first; s < first + count; s++) {
        const p0 = at(s - 1), p1 = at(s), p2 = at(s + 1), p3 = at(s + 2);
        ops.push(C([p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k], [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k], p2));
    }
    if (closed) ops.push(Z);
    return ops;
}

function polyOps(pts: P[], close: boolean): Op[] {
    const ops: Op[] = pts.map((p, i) => (i === 0 ? M(p) : L(p)));
    if (close) ops.push(Z);
    return ops;
}

/** An ellipse in its bounding box, as four cubic arcs. */
function ellipseOps([l, t, r, b]: [number, number, number, number]): Op[] {
    const cx = (l + r) / 2, cy = (t + b) / 2, rx = (r - l) / 2, ry = (b - t) / 2;
    const k = 0.552_284_75;
    const ox = rx * k, oy = ry * k;
    return [
        M([cx + rx, cy]),
        C([cx + rx, cy + oy], [cx + ox, cy + ry], [cx, cy + ry]),
        C([cx - ox, cy + ry], [cx - rx, cy + oy], [cx - rx, cy]),
        C([cx - rx, cy - oy], [cx - ox, cy - ry], [cx, cy - ry]),
        C([cx + ox, cy - ry], [cx + rx, cy - oy], [cx + rx, cy]),
        Z,
    ];
}

/** Core fonts whose first glyphs follow the standard Macintosh order (glyph 3 is the space, glyphs 3..97 are U+0020..U+007E). */
const MAC_ORDER_FONTS = ['arial', 'arial black', 'times new roman', 'courier new', 'verdana', 'georgia', 'tahoma', 'trebuchet ms', 'comic sans ms', 'impact'];

/** Glyph indices of a known font back to ASCII; null when the font is unknown or a glyph is outside the ASCII range. */
function glyphsToChars(family: string, glyphs: number[]): number[] | null {
    if (!MAC_ORDER_FONTS.includes(family.trim().toLowerCase())) return null;
    const out: number[] = [];
    for (const g of glyphs) {
        if (g < 3 || g > 97) return null;
        out.push(g + 29);
    }
    return out;
}

/** A rough advance for a character in ems: the reader has no fonts, so wrapped strings break at typical proportional widths. */
function charEm(u: number): number {
    const c = String.fromCharCode(u);
    if (" ilj.,:;'!|Iftr".includes(c)) return 0.3;
    if ('mwMW'.includes(c)) return 0.85;
    if (/[A-Z0-9]/.test(c)) return 0.62;
    if (u >= 0x2e80) return 1;
    return 0.52;
}

/** Greedy word wrap of one line to `width` world units at em size `em`; a word longer than the line breaks between characters. */
function wrapLine(line: number[], width: number, em: number): number[][] {
    if (em <= 0 || !Number.isFinite(width)) return [line];
    const trimmed = (v: number[]) => { let i = v.length; while (i > 0 && v[i - 1] === 0x20) i--; return i; };
    const measure = (v: number[]) => v.reduce((a, u) => a + charEm(u) * em, 0);
    const out: number[][] = [];
    let cur: number[] = [];
    let curW = 0;
    // Words keep their trailing spaces (split inclusive).
    const words: number[][] = [];
    let w: number[] = [];
    for (const u of line) { w.push(u); if (u === 0x20) { words.push(w); w = []; } }
    if (w.length) words.push(w);
    for (const word of words) {
        const ns = trimmed(word);
        const wordNsW = measure(word.slice(0, ns));
        const wordW = measure(word);
        if (!cur.length) {
            if (wordNsW <= width) { cur.push(...word); curW = wordW; continue; }
        } else if (curW + wordNsW <= width) {
            cur.push(...word); curW += wordW; continue;
        }
        if (cur.length) { out.push(cur.slice(0, trimmed(cur))); cur = []; }
        if (wordNsW <= width) { cur.push(...word); curW = wordW; continue; }
        // A word wider than the line on its own: break it between characters.
        let cw = 0;
        for (const u of word) {
            const uw = charEm(u) * em;
            if (!cur.length) { cur.push(u); cw = uw; }
            else if (cw + uw <= width) { cur.push(u); cw += uw; }
            else { out.push(cur.slice(0, trimmed(cur))); cur = [u]; cw = uw; }
        }
        curW = cw;
    }
    out.push(cur.slice(0, trimmed(cur)));
    return out;
}
