/**
 * Windows metafiles (WMF and EMF, including EMF+) read into a neutral vector model of filled and
 * stroked paths, pattern fills, bitmaps and text strings, in a picture frame with y down. svg.ts
 * turns the model into an SVG document, which is how PowerPoint import shows EMF/WMF pictures.
 *
 * A port of DeckCraft's `crates/metafile` (https://github.com/storytold/deckcraft, MIT OR
 * Apache-2.0, © 2026 ArtCraft Team and the DeckCraft contributors), itself ported from WordCraft.
 * The structure, record coverage, limits and comments follow it file by file; differences are noted
 * where they occur (encoded EMF+ images, see encoded.ts).
 *
 * Text stays font-agnostic: a Text item names the font the file asks for and carries the string,
 * its advances and alignment; the renderer resolves the font. Every read is bounds-checked and
 * every count is capped; hostile input yields a shorter picture or a MetafileError, never a hang or
 * an unbounded allocation. Records follow MS-WMF, MS-EMF and MS-EMFPLUS; records outside the
 * supported set are skipped silently.
 */
import { Bytes } from './bytes';
import type { P } from './bytes';
import type { Raw, RawTile } from './canvas';
import type { Op } from './geom';
import type { Rgba } from './dib';
import type { Encoded } from './encoded';
import type { Text } from './text';
import { isEmf, parseEmf } from './emf';
import { isWmf, parseWmf } from './wmf';
import { setNestedParser } from './emfplus';
import { pictureToSvg } from './svg';
import { toBase64 } from './png';
import { MetafileError, type Frame } from './frame';

export { MetafileError } from './frame';
export type { Text, Font, HAlign, VAlign, Rgba8 } from './text';
export type { Rgba } from './dib';
export type { Encoded } from './encoded';
export { pictureToSvg, symbolChar } from './svg';

/** A parsed metafile. Items use coordinates in `0..width` and `0..height`, y down. */
export interface Picture {
    /** Size in its own units: points for placeable WMF and EMF (from the frame), device or logical units otherwise. */
    width: number;
    height: number;
    items: Item[];
}

export type Seg =
    | { k: 'M'; x: number; y: number }
    | { k: 'L'; x: number; y: number }
    | { k: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
    | { k: 'Z' };

/** Clip region in picture units, each rectangle `[x0, y0, x1, y1]`. null is the default clip. */
export type PicRegion = [number, number, number, number][] | null;

export type Item =
    /** A filled and/or stroked path. Stroke colour and width in picture units; width 0 is a hairline. */
    | { kind: 'path'; segs: Seg[]; fill: [number, number, number, number] | null; stroke: [[number, number, number, number], number] | null; evenOdd: boolean; region: PicRegion }
    /** A bitmap stretched into `rect` = `[x, y, w, h]`: RGBA8 rows top-down, or an encoded file. */
    | { kind: 'bitmap'; rect: [number, number, number, number]; img: Rgba | Encoded; region: PicRegion }
    /** A path filled with a repeating tile (pattern and hatch brushes). Items filled with the same brush share its tile. */
    | { kind: 'pattern'; segs: Seg[]; evenOdd: boolean; tile: Tile; region: PicRegion }
    | { kind: 'text'; text: Text };

/** A brush tile: RGBA8 rows top-down, each pixel `cell` picture units, with a tile's top-left corner at `origin`. */
export interface Tile {
    width: number;
    height: number;
    rgba: Uint8Array;
    cell: [number, number];
    origin: [number, number];
}

/** Nesting depth of metafile images inside EMF+ (a file of nested metafiles cannot run the stack out). */
export const MAX_NESTING = 3;

/** Parses a WMF (placeable or plain) or EMF file. Throws MetafileError when it isn't one or has nothing readable. */
export function parseMetafile(bytes: Uint8Array, depth = 0): Picture {
    const b = new Bytes(bytes);
    let res: { cv: { items: Raw[] }; frame: Frame | null };
    if (isEmf(b)) res = parseEmf(b, depth);
    // A WMF converted from an EMF can carry the original in MFCOMMENT escapes; PowerPoint draws the
    // WMF's own records (its dx rounding shows), so the copy is not used.
    else if (isWmf(b)) res = parseWmf(b);
    else throw new MetafileError('NotMetafile');
    return build(res.cv.items, res.frame);
}

setNestedParser(parseMetafile);

/**
 * An EMF/WMF as an SVG image: a data URL and its size in CSS px (picture points at 96 dpi), or null
 * when the file can't be read or draws nothing. What PowerPoint import shows for a metafile picture.
 */
export function metafileToSvgImage(bytes: Uint8Array): { url: string; w: number; h: number; svg: string } | null {
    let pic: Picture;
    try {
        pic = parseMetafile(bytes);
    } catch {
        return null;
    }
    if (!pic.items.length || !(pic.width > 0) || !(pic.height > 0)) return null;
    const w = Math.max(1, Math.round((pic.width * 96) / 72)), h = Math.max(1, Math.round((pic.height * 96) / 72));
    const svg = pictureToSvg(pic, { width: w, height: h });
    return { url: `data:image/svg+xml;base64,${toBase64(new TextEncoder().encode(svg))}`, w, h, svg };
}

/** True when the bytes start like a WMF (placeable or plain header) or an EMF. */
export function isMetafile(bytes: Uint8Array): boolean {
    const b = new Bytes(bytes);
    return isEmf(b) || isWmf(b);
}

const fin = (v: number) => Number.isFinite(v);

/**
 * Maps device-space output into the picture frame. Without a usable frame the frame is the bounding
 * box of the drawing, so the origin is still the top-left of what was drawn.
 */
function build(raw: Raw[], frame0: Frame | null): Picture {
    const frame = frame0 && frame0.rect.every(fin) && frame0.rect[2] > 0 && frame0.rect[3] > 0 ? frame0 : null;
    let rect: [number, number, number, number];
    let size: [number, number];
    if (frame) {
        rect = frame.rect;
        size = frame.size ?? [frame.rect[2], frame.rect[3]];
    } else {
        const bb = bbox(raw);
        if (!bb) return { width: 0, height: 0, items: [] };
        const [x0, y0, x1, y1] = bb;
        rect = [x0, y0, x1 - x0, y1 - y0];
        size = [x1 - x0, y1 - y0];
    }
    const sx = rect[2] > 0 ? size[0] / rect[2] : 1;
    const sy = rect[3] > 0 ? size[1] / rect[3] : 1;
    const tf = (p: P): P => [(p[0] - rect[0]) * sx, (p[1] - rect[1]) * sy];
    const strokeScale = (sx + sy) / 2;
    // No stroke is wider than the picture's diagonal: anything wider is a mapping artefact.
    const diag = Math.hypot(size[0], size[1]);
    // Tiles shared by several fills stay shared.
    const tiles = new Map<RawTile, Tile>();
    const items: Item[] = [];
    for (const r of raw) {
        if (r.kind === 'path') {
            const segs = toSegs(r.ops, tf);
            if (!segs || segs.length < 2) continue;
            let stroke: [[number, number, number, number], number] | null = null;
            if (r.stroke) {
                const w = Math.min(r.stroke[1] * strokeScale, diag);
                if (!fin(w)) continue;
                stroke = [r.stroke[0], w];
            }
            const region = mapRegion(r.region, tf);
            if (region === undefined) continue;
            items.push({ kind: 'path', segs, fill: r.fill, stroke, evenOdd: r.evenOdd, region });
        } else if (r.kind === 'bitmap') {
            const [x, y] = tf([r.rect[0], r.rect[1]]);
            const rc: [number, number, number, number] = [x, y, r.rect[2] * sx, r.rect[3] * sy];
            const region = mapRegion(r.region, tf);
            if (!rc.every(fin) || region === undefined) continue;
            items.push({ kind: 'bitmap', rect: rc, img: r.img, region });
        } else if (r.kind === 'pattern') {
            const segs = toSegs(r.ops, tf);
            if (!segs || segs.length < 2) continue;
            let tile = tiles.get(r.tile);
            if (!tile) {
                const [ox, oy] = tf([0, 0]);
                tile = { width: r.tile.w, height: r.tile.h, rgba: r.tile.px, cell: [r.tile.cell * sx, r.tile.cell * sy], origin: [ox, oy] };
                if (![...tile.cell, ...tile.origin].every(fin)) continue;
                tiles.set(r.tile, tile);
            }
            const region = mapRegion(r.region, tf);
            if (region === undefined) continue;
            items.push({ kind: 'pattern', segs, evenOdd: r.evenOdd, tile, region });
        } else {
            // Device to picture: scale by (sx, sy) after moving the frame's corner to the origin.
            const t = { ...r.text };
            const [a, b, c, d, e0, g0] = t.transform;
            const [e, g] = tf([e0, g0]);
            t.transform = [a * sx, b * sy, c * sx, d * sy, e, g];
            if (!t.transform.every(fin)) continue;
            if (t.clip) {
                const [x0, y0, x1, y1] = t.clip;
                const p = tf([x0, y0]), q = tf([x1, y1]);
                t.clip = [Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[0], q[0]), Math.max(p[1], q[1])];
                if (!t.clip.every(fin)) continue;
            }
            const region = mapRegion(r.region, tf);
            if (region === undefined) continue;
            t.region = region;
            items.push({ kind: 'text', text: t });
        }
    }
    return { width: fin(size[0]) ? size[0] : 0, height: fin(size[1]) ? size[1] : 0, items };
}

/** The region in picture units; undefined when it is not finite (the item is dropped). */
function mapRegion(region: [number, number, number, number][] | null, tf: (p: P) => P): PicRegion | undefined {
    if (!region) return null;
    const out: [number, number, number, number][] = [];
    for (const [x0, y0, x1, y1] of region) {
        const p = tf([x0, y0]), q = tf([x1, y1]);
        const r: [number, number, number, number] = [Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[0], q[0]), Math.max(p[1], q[1])];
        if (!r.every(fin)) return undefined;
        out.push(r);
    }
    return out;
}

function toSegs(ops: Op[], tf: (p: P) => P): Seg[] | null {
    const out: Seg[] = [];
    for (const op of ops) {
        if (op.k === 'Z') { out.push({ k: 'Z' }); continue; }
        if (op.k === 'C') {
            const a = tf(op.a), b = tf(op.b), p = tf(op.p);
            if (![...a, ...b, ...p].every(fin)) return null;
            out.push({ k: 'C', x1: a[0], y1: a[1], x2: b[0], y2: b[1], x: p[0], y: p[1] });
            continue;
        }
        const p = tf(op.p);
        if (!p.every(fin)) return null;
        out.push({ k: op.k, x: p[0], y: p[1] });
    }
    return out;
}

/** Bounding box `[x0, y0, x1, y1]` over the finite points of the output. */
function bbox(raw: Raw[]): [number, number, number, number] | null {
    let b: [number, number, number, number] | null = null;
    const grow = (p: P) => {
        if (!fin(p[0]) || !fin(p[1])) return;
        b = b ? [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])] : [p[0], p[1], p[0], p[1]];
    };
    for (const r of raw) {
        if (r.kind === 'path' || r.kind === 'pattern') {
            for (const op of r.ops) {
                if (op.k === 'M' || op.k === 'L') grow(op.p);
                else if (op.k === 'C') { grow(op.a); grow(op.b); grow(op.p); }
            }
        } else if (r.kind === 'bitmap') {
            grow([r.rect[0], r.rect[1]]);
            grow([r.rect[0] + r.rect[2], r.rect[1] + r.rect[3]]);
        } else {
            grow([r.text.transform[4], r.text.transform[5]]);
        }
    }
    return b;
}
