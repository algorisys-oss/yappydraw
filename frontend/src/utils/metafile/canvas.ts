/**
 * Drawing state shared by the WMF and EMF readers: window/viewport mapping and the EMF world
 * transform, pen and brush selection through an object table, the DC save stack and path
 * brackets. Output is device-space items; index.ts maps them into the picture frame. Ported from
 * DeckCraft's `crates/metafile/src/canvas.rs` (MIT/Apache).
 */
import type { P } from './bytes';
import type { Op } from './geom';
import { M, L, C, Z, rect as rectOps, remEuclid } from './geom';
import * as clip from './clip';
import type { Rect4, Region } from './clip';
import type { Rgba } from './dib';
import { flip } from './dib';
import { isEncoded, type Encoded } from './encoded';
import { clipRaw, convex, flatten, clipPolygon, opsBbox, rectPoly } from './cliprect';
import type { Font, Text, Rgba8 } from './text';
import { ETO_CLIPPED, ETO_OPAQUE, TA_UPDATECP, align, defaultFont } from './text';
import { MAX_BYTES, MAX_ITEMS, MAX_OBJECTS, MAX_PATH_OPS, MAX_STACK, OP_BYTES } from './limits';

export const MM_TEXT = 1;
const MM_ISOTROPIC = 7;
const MM_ANISOTROPIC = 8;
const STOCK = 0x8000_0000;
export const PS_NULL = 5;
/** Pen style bits; the rest of the style word holds end-cap, join and type flags. */
export const PS_STYLE_MASK = 0x0f;
export const BS_SOLID = 0;
/** Cells on the longer side of a computed (gradient or texture) fill tile. */
const SHADE_RES = 128;
export const BS_NULL = 1;
export const BS_HATCHED = 2;
/** BS_PATTERN, BS_DIBPATTERN and BS_DIBPATTERNPT: the brush paints a bitmap tile. */
const BS_PATTERN = 3;
const BS_DIBPATTERN = 5;
const BS_DIBPATTERNPT = 6;
const WINDING = 2;
/**
 * SETROP2 mix modes. R2_NOP leaves the destination alone: outlines and fills draw nothing.
 * R2_XORPEN and R2_MASKPEN draw the classic see-through shadow (XOR a colour, AND a pattern, XOR
 * the colour again); the others draw as R2_COPYPEN.
 */
const R2_XORPEN = 7;
const R2_MASKPEN = 9;
const R2_NOP = 11;
const R2_COPYPEN = 13;
/** SETBKMODE OPAQUE: text cells and hatch gaps are filled with the background colour. */
const OPAQUE = 2;
const PATCOPY = 0x00f0_0021;
const BLACKNESS = 0x0000_0042;
const WHITENESS = 0x00ff_0062;
/** Device pixels per millimetre assumed for WMF (96 dpi), and for EMF files without a device size. */
const DEFAULT_PX_PER_MM = 96 / 25.4;
/** Largest pattern tile side kept (GDI brushes are typically 8×8). */
export const MAX_TILE_SIDE = 256;

/** Affine transform `[m11, m12, m21, m22, dx, dy]` in EMF XFORM order: `x' = x·m11 + y·m21 + dx`. */
export type Xform = [number, number, number, number, number, number];
export const IDENTITY: Xform = [1, 0, 0, 1, 0, 0];

/** `a` then `b` in EMF row-vector convention: the matrix product `a × b`. */
export function mul(a: Xform, b: Xform): Xform {
    return [
        a[0] * b[0] + a[1] * b[2],
        a[0] * b[1] + a[1] * b[3],
        a[2] * b[0] + a[3] * b[2],
        a[2] * b[1] + a[3] * b[3],
        a[4] * b[0] + a[5] * b[2] + b[4],
        a[4] * b[1] + a[5] * b[3] + b[5],
    ];
}

export interface Pen {
    style: number;
    /** Logical width; 0 means a cosmetic one-pixel hairline. */
    width: number;
    color: Rgba8;
}

/** A pattern brush's tile, top-down RGBA. */
export interface Pattern {
    w: number;
    h: number;
    px: Uint8Array;
    mono: boolean;
    /** The tile as drawn when nothing recolours it, shared by every fill with this brush. */
    plain?: RawTile;
}

export interface Brush {
    style: number;
    color: Rgba8;
    /** HS_* hatch style of a BS_HATCHED brush. */
    hatch: number;
    /** The tile of a pattern brush. */
    pattern: Pattern | null;
}

export const brush = (style: number, color: Rgba8): Brush => ({ style, color, hatch: 0, pattern: null });

/** A pattern brush painting `img`. A monochrome brush paints its dark pixels in the text colour and its light ones in the background colour. null for an empty or oversized tile. */
export function patternBrush(img: Rgba, mono: boolean): Brush | null {
    if (img.w === 0 || img.h === 0 || img.w > MAX_TILE_SIDE || img.h > MAX_TILE_SIDE || img.px.length !== img.w * img.h * 4) return null;
    return { style: BS_DIBPATTERNPT, color: [0, 0, 0, 255], hatch: 0, pattern: { w: img.w, h: img.h, px: img.px, mono } };
}

/** A font object: the neutral Font and its escapement (tenths of a degree, counter-clockwise), which the text transform takes. */
export interface LogFont {
    font: Font;
    escapement: number;
}

export type Obj =
    | { kind: 'pen'; pen: Pen }
    | { kind: 'brush'; brush: Brush }
    | { kind: 'font'; font: LogFont }
    /** A logical palette: what PALETTEINDEX colours resolve against once it is selected. */
    | { kind: 'palette'; colors: Rgba8[] }
    /** Regions and anything else unread: they take a table slot but draw nothing. */
    | { kind: 'other' };

/** A brush tile in device units: `cell` device units per tile pixel, laid from the device origin. */
export interface RawTile {
    w: number;
    h: number;
    px: Uint8Array;
    cell: number;
}

/** What a fill paints. */
type Paint = { kind: 'solid'; color: Rgba8 } | { kind: 'tile'; tile: RawTile };

/** Converts a COLORREF (0x00BBGGRR) to opaque RGBA. */
export const colorref = (c: number): Rgba8 => [c & 0xff, (c >>> 8) & 0xff, (c >>> 16) & 0xff, 255];

/** Millimetres per logical unit of the metric map modes (LOMETRIC, HIMETRIC, LOENGLISH, HIENGLISH, TWIPS). */
function metricMm(mode: number): number | null {
    switch (mode) {
        case 2: return 0.1;
        case 3: return 0.01;
        case 4: return 25.4 / 100;
        case 5: return 25.4 / 1000;
        case 6: return 25.4 / 1440;
        default: return null;
    }
}

const ratio = (num: number, den: number) => (den === 0 ? 1 : num / den);

export class Mapping {
    wo: P = [0, 0];
    we: P = [1, 1];
    vo: P = [0, 0];
    ve: P = [1, 1];
    mode = MM_TEXT;
    world: Xform = IDENTITY;
    /** Device pixels per millimetre on each axis (EMF: from szlDevice and szlMillimeters). */
    pxMm: P = [DEFAULT_PX_PER_MM, DEFAULT_PX_PER_MM];
    /**
     * Whether a viewport extent was set (by the file, or by the WMF player). An EMF that picks an
     * extent-based mode and sets only the window would, by GDI's 1×1 default viewport, shrink to a
     * pixel, yet its own bounds say it drew full size: without a viewport the window is the scale
     * (1 logical unit per device unit), as WMF's rule already treats it. Beyond DeckCraft.
     */
    veSet = false;

    clone(): Mapping {
        const m = new Mapping();
        Object.assign(m, this);
        return m;
    }

    /** Logical point to device point: world transform, then window to viewport. */
    device(p: P): P {
        const w = this.world;
        const x = p[0] * w[0] + p[1] * w[2] + w[4], y = p[0] * w[1] + p[1] * w[3] + w[5];
        const [sx, sy] = this.ratios();
        return [(x - this.wo[0]) * sx + this.vo[0], (y - this.wo[1]) * sy + this.vo[1]];
    }

    /**
     * Window-to-viewport scale per axis. MM_TEXT fixes the scale at 1; the metric modes use a fixed
     * scale with y up; MM_ISOTROPIC uses one scale on both axes (the smaller magnitude, each axis's
     * sign kept); anisotropic and unknown modes use the extents as given.
     */
    ratios(): P {
        if (this.mode === MM_TEXT) return [1, 1];
        const mm = metricMm(this.mode);
        if (mm !== null) return [mm * this.pxMm[0], -mm * this.pxMm[1]];
        if (!this.veSet) return [1, 1];
        const rx = ratio(this.ve[0], this.we[0]), ry = ratio(this.ve[1], this.we[1]);
        if (this.mode === MM_ISOTROPIC) {
            const s = Math.min(Math.abs(rx), Math.abs(ry));
            return [rx < 0 ? -s : s, ry < 0 ? -s : s];
        }
        return [rx, ry];
    }

    /** Approximate device length per logical length, for pen widths. */
    scale(): number {
        const w = this.world;
        const det = Math.sqrt(Math.abs(w[0] * w[3] - w[1] * w[2]));
        const [sx, sy] = this.ratios();
        return (det * (Math.abs(sx) + Math.abs(sy))) / 2;
    }

    /** True when the window-to-viewport extents set the scale (the isotropic and anisotropic modes). */
    usesExtents(): boolean { return this.mode === MM_ISOTROPIC || this.mode === MM_ANISOTROPIC; }

    /** The window in device units as `[x, y, w, h]` with positive extents, used as the picture frame of a plain WMF. */
    windowRect(): Rect4 {
        const a = this.device(this.wo);
        const b = this.device([this.wo[0] + this.we[0], this.wo[1] + this.we[1]]);
        return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])];
    }
}

/** Output of drawing, in device units. Path points are already mapped; index.ts normalises them. */
export type Raw =
    | { kind: 'path'; ops: Op[]; fill: Rgba8 | null; stroke: [Rgba8, number] | null; evenOdd: boolean; region: Region }
    /** A path filled with a repeating tile. */
    | { kind: 'pattern'; ops: Op[]; evenOdd: boolean; tile: RawTile; region: Region }
    | { kind: 'bitmap'; rect: Rect4; img: Rgba | Encoded; region: Region }
    /** Text whose transform and clip are in device units. `region` is the device clip. */
    | { kind: 'text'; text: Text; region: Region };

/** Text drawing state: colours, background mode, alignment and the selected font. */
interface TextState {
    color: Rgba8;
    bkColor: Rgba8;
    bkOpaque: boolean;
    align: number;
    font: LogFont | null;
}

interface Saved {
    pathClip: P[] | null;
    arcClockwise: boolean;
    map: Mapping;
    pen: Pen;
    brush: Brush;
    evenOdd: boolean;
    rop2: number;
    text: TextState;
    clip: Region;
}

export class Canvas {
    items: Raw[] = [];
    map = new Mapping();
    /** True once SETWINDOWEXT was seen, so a plain WMF has a frame to use. */
    windowSet = false;
    /** True once the file set the viewport extent itself (not the player, see playInto). */
    viewportSet = false;
    private saved: Saved[] = [];
    /** Bytes held by the items so far (path ops and pixels), capped at MAX_BYTES. */
    private used = 0;
    private objects: (Obj | null)[] = [];
    private pen: Pen = { style: 0, width: 0, color: [0, 0, 0, 255] };
    private brush: Brush = brush(BS_SOLID, [255, 255, 255, 255]);
    private evenOdd = true;
    /** SETROP2 mix mode. */
    private rop2 = R2_COPYPEN;
    /** The colour of the last fill drawn with R2_XORPEN, for the see-through shadow idiom. */
    private xorColor: Rgba8 | null = null;
    private text: TextState = { color: [0, 0, 0, 255], bkColor: [255, 255, 255, 255], bkOpaque: true, align: 0, font: null };
    /** Device units per pattern-brush pixel: brushes are laid out in 96-dpi pixels. */
    patternPx = 1;
    private pos: P = [0, 0];
    private inPath = false;
    private path: Op[] = [];
    private isFull = false;
    /** Current clip in device units. null is the default (the whole surface); [] draws nothing. */
    private clip: Region = null;
    /** Device bounds of the picture, so excluding from the default clip has a surface to cut. */
    private surface: Rect4 | null = null;
    /** EMF+ convex device clip polygon: drawing is cut to it geometrically. */
    private plusClip: P[] | null = null;
    /** GDI clip path (SELECTCLIPPATH) as a convex device polygon, cut the same way. Beyond DeckCraft. */
    private pathClip: P[] | null = null;
    /** SETARCDIRECTION: AD_CLOCKWISE arcs. Beyond DeckCraft. */
    arcClockwise = false;
    /** The selected logical palette (PALETTEINDEX colours). Beyond DeckCraft. */
    private palette: Rgba8[] = [];

    /** Device bounds `[x0, y0, x1, y1]` of the picture. Used when a clip record cuts the default clip. */
    setClipSurface(rect: Rect4): void { this.surface = clip.normalize(rect); }

    /** True once the item cap is hit; the readers stop there and keep what they have. */
    full(): boolean { return this.isFull; }

    private push(raw: Raw): void {
        let out = [raw];
        for (const c of [this.pathClip, this.plusClip]) if (c) out = out.flatMap(r => clipRaw(r, c));
        for (const r of out) this.pushRaw(r);
    }

    /**
     * A COLORREF in the current state: PALETTEINDEX (0x01 in the high byte) names an entry of the
     * selected palette (black past its end); PALETTERGB (0x02) and plain values are RGB.
     */
    colorOf(c: number): Rgba8 {
        if ((c >>> 24) === 1) return this.palette[c & 0xffff] ?? [0, 0, 0, 255];
        return colorref(c);
    }

    /** SELECTPALETTE. A stock palette (or anything that isn't one) selects none: indices read as black. */
    selectPalette(i: number): void {
        const o = (i & STOCK) === 0 ? this.objects[i] : null;
        this.palette = o?.kind === 'palette' ? o.colors : [];
    }

    /**
     * SELECTCLIPPATH: the open path bracket becomes the clip (RGN_COPY) or cuts it (RGN_AND). A
     * single convex figure clips exactly; anything else clips to its bounding box. Other modes keep
     * the clip as it was.
     */
    selectClipPath(mode: number): void {
        const ops = this.path;
        this.path = [];
        this.inPath = false;
        const subs = flatten(ops);
        let poly: P[] | null = subs.length === 1 ? convex(subs[0][0]) : null;
        if (!poly) { const b = opsBbox(ops); poly = b ? rectPoly(b) : null; }
        if (!poly) return;
        if (mode === clip.RGN_COPY) this.pathClip = poly;
        else if (mode === clip.RGN_AND) this.pathClip = this.pathClip ? convex(clipPolygon(this.pathClip, poly)) ?? [] : poly;
    }

    /** Fills logical rectangles (a region's RGNDATA) with brush object `brushIndex`, or the current brush when null. FILLRGN, PAINTRGN. */
    fillRegion(rects: Rect4[], brushIndex: number | null): void {
        const saved = this.brush;
        if (brushIndex !== null) this.select(brushIndex);
        for (const [l, t, r, b] of rects) this.shape(rectOps(l, t, r, b), true, false);
        this.brush = saved;
    }

    /** FRAMERGN: outlines each rectangle of a region with brush object `brushIndex`'s colour, `w` × `h` logical units thick. */
    frameRegion(rects: Rect4[], brushIndex: number, w: number, h: number): void {
        const o = this.objects[brushIndex];
        const color = o?.kind === 'brush' ? o.brush.color : (brushIndex & STOCK) !== 0 && (brushIndex & 0xff) === 4 ? [0, 0, 0, 255] as Rgba8 : null;
        if (!color) return;
        const saved = this.brush;
        this.brush = brush(BS_SOLID, color);
        for (const [l, t, r, b] of rects) {
            this.shape(rectOps(l, t, r, t + h), true, false);
            this.shape(rectOps(l, b - h, r, b), true, false);
            this.shape(rectOps(l, t, l + w, b), true, false);
            this.shape(rectOps(r - w, t, r, b), true, false);
        }
        this.brush = saved;
    }

    /** The current position (ANGLEARC and POLYDRAW start from it). */
    currentPos(): P { return this.pos; }
    setCurrentPos(p: P): void { this.pos = p; }

    private pushRaw(raw: Raw): void {
        if (this.clip && this.clip.length === 0) return;
        raw.region = this.clip ? this.clip.slice() : null;
        const regionCost = this.clip ? this.clip.length * 32 : 0;
        let cost: number;
        switch (raw.kind) {
            case 'path': cost = raw.ops.length * OP_BYTES; break;
            // A tile shared with its brush is counted once (by the brush); one made for this fill counts here.
            case 'pattern': cost = raw.ops.length * OP_BYTES + 64 + (sharedTiles.has(raw.tile) ? 0 : raw.tile.px.length); break;
            case 'bitmap': cost = isEncoded(raw.img) ? raw.img.bytes.length : raw.img.px.length; break;
            case 'text': cost = raw.text.text.length * 2 + raw.text.dx.length * 4 + raw.text.font.family.length + 128; break;
        }
        cost += regionCost;
        if (this.items.length >= MAX_ITEMS || this.used + cost > MAX_BYTES) this.isFull = true;
        else { this.used += cost; this.items.push(raw); }
    }

    setWindowOrg(p: P): void { this.map.wo = p; }
    setWindowExt(e: P): void { this.map.we = e; this.windowSet = true; }
    setViewportOrg(p: P): void { this.map.vo = p; }
    setViewportExt(e: P): void { this.map.ve = e; this.map.veSet = true; this.viewportSet = true; }

    /**
     * Sets up the mapping the way a player does before it plays a WMF into a target: anisotropic,
     * `window` (`[x, y, w, h]` in logical units) onto a viewport of `size` at the origin. The file's
     * own window records then replace the window; the viewport stays unless the file sets one.
     * Without a window (a plain WMF) only the viewport extent is set.
     */
    playInto(window: Rect4 | null, size: P): void {
        if (window) {
            const [x, y, w, h] = window;
            this.map.mode = MM_ANISOTROPIC;
            this.map.wo = [x, y];
            this.map.we = [w, h];
            this.map.vo = [0, 0];
        }
        this.map.ve = size;
        this.map.veSet = true;
    }

    setMapMode(mode: number): void { this.map.mode = mode; }

    /** Device pixels per millimetre (x, y) for the metric map modes. Ignored unless both are positive. */
    setDeviceMm(pxMm: P): void {
        if (Number.isFinite(pxMm[0]) && Number.isFinite(pxMm[1]) && pxMm[0] > 0 && pxMm[1] > 0) this.map.pxMm = pxMm;
    }

    setPolyfill(mode: number): void { this.evenOdd = mode !== WINDING; }
    /** SETROP2. R2_NOP draws nothing; R2_XORPEN and R2_MASKPEN are the see-through shadow idiom; the others draw as copy. */
    setRop2(mode: number): void { this.rop2 = mode; }
    setTextColor(c: number): void { this.text.color = this.colorOf(c); }
    setBkColor(c: number): void { this.text.bkColor = this.colorOf(c); }
    setBkMode(mode: number): void { this.text.bkOpaque = mode === OPAQUE; }
    setTextAlign(ta: number): void { this.text.align = ta; }

    /** The character set of the selected font (ANSI without one). */
    fontCharset(): number { return this.text.font?.font.charset ?? 0; }

    /** EMF SETWORLDTRANSFORM (`mode` 4) and MODIFYWORLDTRANSFORM (1 identity, 2 left, 3 right, 4 set). An unknown mode leaves the world transform as it was. */
    modifyWorld(x: Xform, mode: number): void {
        if (mode === 1) this.map.world = IDENTITY;
        else if (mode === 2) this.map.world = mul(x, this.map.world);
        else if (mode === 3) this.map.world = mul(this.map.world, x);
        else if (mode === 4) this.map.world = x;
    }

    /** The current world transform (EMF+ draws through it). */
    world(): Xform { return this.map.world; }
    /** Sets the pen and brush directly (EMF+ records name their own pen and brush). */
    setPen(pen: Pen): void { this.pen = pen; }
    setBrush(b: Brush): void { this.brush = b; }
    /** Sets the EMF+ convex device clip polygon (null: unclipped). */
    setClip(c: P[] | null): void { this.plusClip = c; }

    /** Logical to device as one affine transform (the mapping is affine). */
    deviceAffine(): Xform {
        const o = this.map.device([0, 0]);
        const x = this.map.device([1, 0]);
        const y = this.map.device([0, 1]);
        return [x[0] - o[0], x[1] - o[1], y[0] - o[0], y[1] - o[1], o[0], o[1]];
    }

    /** Text colour, font and alignment set directly (EMF+ strings name their own font and brush); the background is transparent. */
    setTextStyle(color: Rgba8, font: LogFont, al: number): void {
        this.text.color = color;
        this.text.bkOpaque = false;
        this.text.align = al;
        this.text.font = font;
    }

    /** Pushes an item already in device units (a nested metafile's drawing). */
    pushDevice(raw: Raw): void { this.push(raw); }

    /** Fills logical `ops` with a ready-made tile, laid from the device origin. */
    tileShape(ops: Op[], tile: RawTile): void {
        const dev = ops.map(o => this.mapOp(o));
        if (dev.length >= 2) this.push({ kind: 'pattern', ops: dev, evenOdd: this.evenOdd, tile, region: null });
    }

    /**
     * Fills logical `ops` with a colour computed per device point (gradients, textures): a tile of at
     * most SHADE_RES cells on the longer side, laid out so that its one repeat covers the shape.
     */
    shadeShape(ops: Op[], shade: (p: P) => Rgba8): void {
        const dev = ops.map(o => this.mapOp(o));
        const bb = opsBbox(dev);
        if (!bb) return;
        const [l, t, r, b] = bb;
        const side = Math.max(r - l, b - t);
        if (dev.length < 2 || !(Number.isFinite(side) && side > 0)) return;
        const cell = side / SHADE_RES;
        const w = Math.min(SHADE_RES + 1, Math.max(1, Math.ceil((r - l) / cell) + 1));
        const h = Math.min(SHADE_RES + 1, Math.max(1, Math.ceil((b - t) / cell) + 1));
        const pw = w * cell, ph = h * cell;
        const px = new Uint8Array(w * h * 4);
        for (let j = 0; j < h; j++) {
            // The device position this tile row stands for inside the shape's box.
            const y = t + remEuclid(j * cell - t, ph) + cell / 2;
            for (let i = 0; i < w; i++) {
                const x = l + remEuclid(i * cell - l, pw) + cell / 2;
                px.set(shade([x, y]), (j * w + i) * 4);
            }
        }
        this.push({ kind: 'pattern', ops: dev, evenOdd: this.evenOdd, tile: { w, h, px, cell }, region: null });
    }

    /** Pushes the drawing state. Past MAX_STACK levels the parse stops, since later restores could no longer match the file. */
    saveDc(): void {
        if (this.saved.length < MAX_STACK) {
            this.saved.push({ pathClip: this.pathClip, arcClockwise: this.arcClockwise, map: this.map.clone(), pen: { ...this.pen }, brush: { ...this.brush }, evenOdd: this.evenOdd, rop2: this.rop2, text: { ...this.text }, clip: this.clip ? this.clip.slice() : null });
        } else {
            this.isFull = true;
        }
    }

    /** Negative `n` pops `-n` levels; positive `n` restores absolute level `n`. */
    restoreDc(n: number): void {
        const idx = n < 0 ? this.saved.length - Math.abs(n) : n - 1;
        if (idx < 0 || idx >= this.saved.length) return;
        const s = this.saved[idx];
        this.saved.length = idx;
        this.map = s.map;
        this.pen = s.pen;
        this.brush = s.brush;
        this.evenOdd = s.evenOdd;
        this.rop2 = s.rop2;
        this.text = s.text;
        this.clip = s.clip;
        this.pathClip = s.pathClip;
        this.arcClockwise = s.arcClockwise;
    }

    /** The logical rectangle as a device rectangle. A rotation stores the bounds of the rotated corners. */
    private deviceRect([l, t, r, b]: Rect4): Rect4 | null {
        const corners = ([[l, t], [r, t], [l, b], [r, b]] as P[]).map(p => this.map.device(p));
        if (!corners.every(p => Number.isFinite(p[0]) && Number.isFinite(p[1]))) return null;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const p of corners) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
        return clip.normalize([x0, y0, x1, y1]);
    }

    /** INTERSECTCLIPRECT: later drawing is limited to this logical rectangle as well. */
    intersectClipRect(logical: Rect4): void {
        const r = this.deviceRect(logical);
        this.clip = r ? clip.intersect(this.clip, r) : [];
    }

    /** EXCLUDECLIPRECT: this logical rectangle is removed from the clip. */
    excludeClipRect(logical: Rect4): void {
        const r = this.deviceRect(logical);
        if (r) this.clip = clip.exclude(this.clip, r, this.surface);
    }

    /**
     * EXTSELECTCLIPRGN: combine these rectangles with the clip in a `RGN_*` mode. A GDI region is in
     * device units, so the window, viewport and world transform don't apply. (DeckCraft maps them as
     * logical units, which shifts the clip by any window origin: LibreOffice's TestNegativeWinOrg
     * cut its line of text in half.)
     */
    selectClipRects(device: Rect4[], mode: number): void {
        this.clip = clip.combine(this.clip, device.slice(0, clip.MAX_CLIP_RECTS), mode, this.surface);
    }

    /** The default clip: later records are not limited by a region (nor a clip path). */
    resetClip(): void { this.clip = null; this.pathClip = null; }

    /** Stores an object in `slot` (EMF index), or in the first free slot (WMF handle table). */
    addObject(slot: number | null, obj: Obj): void {
        // A pattern brush's pixels count against the byte budget like drawn items.
        if (obj.kind === 'brush' && obj.brush.pattern) {
            const cost = obj.brush.pattern.px.length;
            if (this.used + cost > MAX_BYTES) { this.isFull = true; return; }
            this.used += cost;
        }
        if (slot !== null) {
            if (slot < MAX_OBJECTS) {
                while (this.objects.length <= slot) this.objects.push(null);
                this.objects[slot] = obj;
            }
            return;
        }
        const free = this.objects.indexOf(null);
        if (free >= 0) this.objects[free] = obj;
        else if (this.objects.length < MAX_OBJECTS) this.objects.push(obj);
    }

    deleteObject(i: number): void {
        if (i < this.objects.length) this.objects[i] = null;
    }

    /** Selects an object by index; indices with the high bit set are stock objects. */
    select(i: number): void {
        if ((i & STOCK) !== 0) { this.selectStock((i & ~STOCK) >>> 0); return; }
        const o = this.objects[i] ?? null;
        if (!o) return;
        if (o.kind === 'pen') this.pen = o.pen;
        else if (o.kind === 'brush') this.brush = o.brush;
        else if (o.kind === 'font') this.text.font = o.font;
    }

    private selectStock(i: number): void {
        const white: Rgba8 = [255, 255, 255, 255];
        const black: Rgba8 = [0, 0, 0, 255];
        const gray = (v: number) => brush(BS_SOLID, [v, v, v, 255]);
        if (i === 0 || i === 18) this.brush = brush(BS_SOLID, white);
        else if (i === 1) this.brush = gray(192);
        else if (i === 2) this.brush = gray(128);
        else if (i === 3) this.brush = gray(64);
        else if (i === 4) this.brush = brush(BS_SOLID, black);
        else if (i === 5) this.brush = brush(BS_NULL, black);
        else if (i === 6) this.pen = { style: 0, width: 0, color: white };
        else if (i === 7 || i === 19) this.pen = { style: 0, width: 0, color: black };
        else if (i === 8) this.pen = { style: PS_NULL, width: 0, color: black };
        // The stock fonts (OEM_FIXED_FONT … DEFAULT_GUI_FONT): drawn in the default face.
        else if (i >= 10 && i <= 17) this.text.font = null;
    }

    private mapOp(op: Op): Op {
        switch (op.k) {
            case 'M': return M(this.map.device(op.p));
            case 'L': return L(this.map.device(op.p));
            case 'C': return C(this.map.device(op.a), this.map.device(op.b), this.map.device(op.p));
            default: return Z;
        }
    }

    /**
     * The current brush's paint. Hatch and monochrome brushes take the background colour (when the
     * background mode is opaque) and the text colour. Under R2_MASKPEN (destination AND brush) a
     * tile's white pixels keep what is below, and its black ones take the colour of the XOR fill
     * before it: XOR, AND, XOR again leaves that colour where the tile is black.
     */
    private fillPaint(): Paint | null {
        const b = this.brush;
        if (b.style === BS_SOLID) return { kind: 'solid', color: b.color };
        if (b.style === BS_HATCHED) {
            const px = hatchTile(b.hatch, b.color, this.text.bkOpaque ? this.text.bkColor : null);
            return px ? { kind: 'tile', tile: { w: 8, h: 8, px, cell: this.patternPx } } : null;
        }
        if (b.style === BS_PATTERN || b.style === BS_DIBPATTERN || b.style === BS_DIBPATTERNPT) {
            const p = b.pattern;
            if (!p) return null;
            if (!p.mono && this.rop2 !== R2_MASKPEN) {
                if (!p.plain) { p.plain = { w: p.w, h: p.h, px: p.px, cell: this.patternPx }; sharedTiles.add(p.plain); }
                return { kind: 'tile', tile: p.plain };
            }
            const px = p.px.slice();
            for (let i = 0; i + 3 < px.length; i += 4) {
                if (p.mono) {
                    const light = px[i] + px[i + 1] + px[i + 2] >= 384;
                    const v = light ? this.text.bkColor : this.text.color;
                    px[i] = v[0]; px[i + 1] = v[1]; px[i + 2] = v[2]; px[i + 3] = 255;
                }
                if (this.rop2 === R2_MASKPEN) {
                    if (px[i] === 255 && px[i + 1] === 255 && px[i + 2] === 255) px[i + 3] = 0;
                    else if (px[i] === 0 && px[i + 1] === 0 && px[i + 2] === 0 && this.xorColor) px.set(this.xorColor, i);
                }
            }
            return { kind: 'tile', tile: { w: p.w, h: p.h, px, cell: this.patternPx } };
        }
        return null;
    }

    /** Pushes device ops filled with `fill` and stroked with `stroke`: a tile fill and its outline are two items. */
    private pushShape(ops: Op[], fill: Paint | null, stroke: [Rgba8, number] | null): void {
        const evenOdd = this.evenOdd;
        if (fill?.kind === 'tile') {
            this.push({ kind: 'pattern', ops, evenOdd, tile: fill.tile, region: null });
            if (stroke) this.push({ kind: 'path', ops, fill: null, stroke, evenOdd, region: null });
        } else if (fill?.kind === 'solid') {
            this.push({ kind: 'path', ops, fill: fill.color, stroke, evenOdd, region: null });
        } else if (stroke) {
            this.push({ kind: 'path', ops, fill: null, stroke, evenOdd, region: null });
        }
    }

    /**
     * Whether the mix mode suppresses drawing: R2_NOP draws nothing, and R2_XORPEN shapes only
     * remember their fill colour (an XOR pair cancels; the see-through shadow idiom draws its
     * pattern in that colour).
     */
    private mixSkips(fill: boolean): boolean {
        if (this.rop2 === R2_NOP) return true;
        if (this.rop2 === R2_XORPEN) {
            if (fill && this.brush.style === BS_SOLID) this.xorColor = this.brush.color;
            return true;
        }
        return false;
    }

    private strokePen(): [Rgba8, number] | null {
        if ((this.pen.style & PS_STYLE_MASK) === PS_NULL) return null;
        // A cosmetic pen (width 0) stays 0: the renderer draws that as a hairline.
        const w = this.pen.width === 0 ? 0 : Math.abs(this.pen.width) * this.map.scale();
        return [this.pen.color, w];
    }

    private pushPathOps(ops: Op[]): void {
        for (const op of ops) {
            if (this.path.length >= MAX_PATH_OPS) return;
            this.path.push(op);
        }
    }

    /**
     * Draws logical-space ops with the current pen (`stroke`) and brush (`fill`), or appends them to
     * the open path bracket, where fill and stroke wait for FILLPATH/STROKEPATH.
     */
    shape(ops: Op[], fill: boolean, stroke: boolean): void {
        const dev = ops.map(o => this.mapOp(o));
        if (this.inPath) { this.pushPathOps(dev); return; }
        if (this.mixSkips(fill) || dev.length < 2) return;
        this.pushShape(dev, fill ? this.fillPaint() : null, stroke ? this.strokePen() : null);
    }

    moveTo(p: P): void {
        if (this.inPath) this.pushPathOps([M(this.map.device(p))]);
        this.pos = p;
    }

    /** LINETO from the current point, then moves the current point to `p`. */
    lineTo(p: P): void { this.lineChain([p], false, true); }

    /** Lines from the current point through `pts` (POLYLINETO), or a polyline from the current point. */
    lineChain(pts: P[], fill: boolean, stroke: boolean): void {
        // Inside an open bracket the path already ends at the current point, so no MoveTo is needed.
        const ops: Op[] = this.inPath && this.path.length ? [] : [M(this.pos)];
        for (const p of pts) ops.push(L(p));
        if (pts.length) this.pos = pts[pts.length - 1];
        this.shape(ops, fill, stroke);
    }

    /** POLYBEZIER: cubic segments that start a new figure at `from`. The current point is unchanged. */
    bezier(from: P, pts: P[]): void {
        this.shape([M(from), ...cubics(pts)], false, true);
    }

    /** POLYBEZIERTO: cubic segments from the current point; the current point moves to the last point. */
    bezierTo(pts: P[]): void {
        const ops: Op[] = this.inPath && this.path.length ? [] : [M(this.pos)];
        ops.push(...cubics(pts));
        if (pts.length) this.pos = pts[pts.length - 1];
        this.shape(ops, false, true);
    }

    poly(pts: P[], close: boolean, fill: boolean, stroke: boolean): void {
        if (!pts.length) return;
        const ops: Op[] = [M(pts[0])];
        for (let i = 1; i < pts.length; i++) ops.push(L(pts[i]));
        if (close) ops.push(Z);
        this.shape(ops, fill, stroke);
    }

    beginPath(): void { this.inPath = true; this.path = []; }
    endPath(): void { this.inPath = false; }
    closeFigure(): void { if (this.inPath) this.pushPathOps([Z]); }

    /** FILLPATH, STROKEPATH and STROKEANDFILLPATH: paints the bracketed path and empties it. */
    paintPath(fill: boolean, stroke: boolean): void {
        const ops = this.path;
        this.path = [];
        if (this.mixSkips(fill) || ops.length < 2) return;
        this.pushShape(ops, fill ? this.fillPaint() : null, stroke ? this.strokePen() : null);
    }

    /** Fills a logical rectangle `[l, t, r, b]` with the current brush (PATBLT, PATCOPY blits). */
    fillBrushRect([l, t, r, b]: Rect4): void {
        if (this.mixSkips(true)) return;
        const fill = this.fillPaint();
        this.pushShape(rectOps(l, t, r, b).map(o => this.mapOp(o)), fill, null);
    }

    /** Fills a logical rectangle `[l, t, r, b]` with a solid colour (ROP fills such as BLACKNESS). */
    fillRectWith([l, t, r, b]: Rect4, color: Rgba8): void {
        this.push({ kind: 'path', ops: rectOps(l, t, r, b).map(o => this.mapOp(o)), fill: color, stroke: null, evenOdd: true, region: null });
    }

    /** Whether a raster operation draws without a source bitmap (PATCOPY, BLACKNESS, WHITENESS). */
    static sourceless(rop: number): boolean { return rop === PATCOPY || rop === BLACKNESS || rop === WHITENESS; }

    /** Fills a logical rectangle `[x, y, w, h]` for a source-less raster operation. PATCOPY uses the brush; the others fill black or white. */
    fillRop([x, y, w, h]: Rect4, rop: number): void {
        const r: Rect4 = [x, y, x + w, y + h];
        if (rop === PATCOPY) this.fillBrushRect(r);
        else if (rop === BLACKNESS) this.fillRectWith(r, [0, 0, 0, 255]);
        else if (rop === WHITENESS) this.fillRectWith(r, [255, 255, 255, 255]);
    }

    /**
     * Draws `text` (one `dx` advance per character, or none) with the current font, colours and
     * alignment. The reference point is `at`, or the current position under TA_UPDATECP (which then
     * moves past the string). `rect` (logical `[l, t, r, b]`) is filled with the background colour
     * under ETO_OPAQUE and clips the text under ETO_CLIPPED. Text ignores the mix mode, as GDI's does.
     */
    drawText(at: P, text: string, dx: number[], options: number, rect: Rect4 | null): void {
        if ((options & ETO_OPAQUE) !== 0 && rect) this.fillRectWith(rect, this.text.bkColor);
        const lf: LogFont = this.text.font ?? { font: defaultFont(), escapement: 0 };
        const update = (this.text.align & TA_UPDATECP) !== 0;
        const origin = update ? this.pos : at;
        const [hAlign, vAlign] = align(this.text.align);
        const o = this.map.device(origin);
        const ux0 = this.map.device([origin[0] + 1, origin[1]]);
        const uy0 = this.map.device([origin[0], origin[1] + 1]);
        const ux: P = [ux0[0] - o[0], ux0[1] - o[1]], uy: P = [uy0[0] - o[0], uy0[1] - o[1]];
        if (update) {
            // The current position moves along the baseline past the string (back past it when
            // right-aligned). Without a dx array the advance is estimated from the height.
            let adv = dx.length ? dx.reduce((a, d) => a + d, 0) : Math.max(Math.abs(lf.font.height), 1) * 0.5 * [...text].length;
            adv = hAlign === 'left' ? adv : hAlign === 'right' ? -adv : 0;
            const theta = (lf.escapement / 10) * (Math.PI / 180);
            const ySign = uy[1] < 0 ? 1 : -1;
            const p: P = [origin[0] + adv * Math.cos(theta), origin[1] + adv * Math.sin(theta) * ySign];
            if (Number.isFinite(p[0]) && Number.isFinite(p[1])) this.pos = p;
        }
        const sx = Math.hypot(ux[0], ux[1]), sy = Math.hypot(uy[0], uy[1]);
        const drawable = text.length > 0 && [sx, sy, o[0], o[1]].every(Number.isFinite) && sx > 0 && sy > 0;
        if (!drawable) return;
        // The baseline runs along the device direction of the logical x axis (rotated by a world
        // transform; a mirroring mapping does not mirror glyphs), turned counter-clockwise by the
        // escapement.
        const det = ux[0] * uy[1] - ux[1] * uy[0];
        const phi = det > 0 ? Math.atan2(ux[1], ux[0]) : Math.atan2(ux[1], Math.abs(ux[0]));
        const a = phi - (lf.escapement / 10) * (Math.PI / 180);
        const c = Math.cos(a), s = Math.sin(a);
        let clipRect: Rect4 | null = null;
        if ((options & ETO_CLIPPED) !== 0 && rect) {
            const [l, t, r, b] = rect;
            const p = this.map.device([l, t]), q = this.map.device([r, b]);
            clipRect = [Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[0], q[0]), Math.max(p[1], q[1])];
        }
        this.push({
            kind: 'text',
            text: {
                transform: [sx * c, sx * s, -sy * s, sy * c, o[0], o[1]],
                text, dx, font: lf.font, color: this.text.color,
                background: this.text.bkOpaque ? this.text.bkColor : null,
                hAlign, vAlign, clip: clipRect, region: null,
            },
            region: null,
        });
    }

    /** A bitmap stretched into a logical rectangle `[x, y, w, h]`. A negative extent mirrors the bitmap, as the mapping does. */
    bitmap(rect: Rect4, img0: Rgba | Encoded): void {
        const [x, y, w, h] = rect;
        const a = this.map.device([x, y]);
        const b = this.map.device([x + w, y + h]);
        let img = img0;
        if (isEncoded(img)) {
            // An encoded image can't be flipped in place: the SVG writer mirrors it.
            const fx = a[0] > b[0], fy = a[1] > b[1];
            if (fx || fy) img = { ...img, flip: [!!img.flip?.[0] !== fx, !!img.flip?.[1] !== fy] };
        } else {
            flip(img, a[0] > b[0], a[1] > b[1]);
        }
        this.push({ kind: 'bitmap', rect: [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])], img, region: null });
    }
}

/** Tiles owned by a brush (counted once against the byte budget, when the brush was created). */
const sharedTiles = new WeakSet<RawTile>();

/**
 * An 8×8 hatch tile (HS_HORIZONTAL, HS_VERTICAL, HS_FDIAGONAL, HS_BDIAGONAL, HS_CROSS,
 * HS_DIAGCROSS): one-pixel lines in `fg` over `bg`, or over nothing when the background is
 * transparent. null for an unknown style.
 */
export function hatchTile(style: number, fg: Rgba8, bg: Rgba8 | null): Uint8Array | null {
    if (style > 5 || style < 0) return null;
    const px = new Uint8Array(8 * 8 * 4);
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const h = y === 7, v = x === 7, f = x === y, b = x + y === 7;
            const on = style === 0 ? h : style === 1 ? v : style === 2 ? f : style === 3 ? b : style === 4 ? h || v : f || b;
            px.set(on ? fg : bg ?? [0, 0, 0, 0], (y * 8 + x) * 4);
        }
    }
    return px;
}

/** Cubic segments from groups of three points (control, control, end). A trailing partial group is dropped. */
function cubics(pts: P[]): Op[] {
    const ops: Op[] = [];
    for (let i = 0; i + 2 < pts.length; i += 3) ops.push(C(pts[i], pts[i + 1], pts[i + 2]));
    return ops;
}
