/**
 * Clipping regions for EMF and WMF (MS-EMF 2.3.12, MS-WMF 2.3.5). Ported from DeckCraft's
 * `crates/metafile/src/clip.rs` (MIT/Apache).
 *
 * A region is a set of axis-aligned rectangles `[x0, y0, x1, y1]` in device units: `null` is the
 * default clip (the whole surface), `[]` draws nothing, and a list is their union. That is how GDI
 * stores a region (`RGNDATA` is a list of rectangles). Counts are capped so a hostile file cannot
 * grow the set without bound; past the cap, extra rectangles are dropped, which can only hide
 * drawing.
 */

export type Rect4 = [number, number, number, number];
export type Region = Rect4[] | null;

/** Rectangles kept from one region. Past this, further rectangles are dropped. */
export const MAX_CLIP_RECTS = 64;

export const RGN_AND = 1;
export const RGN_OR = 2;
export const RGN_XOR = 3;
export const RGN_DIFF = 4;
export const RGN_COPY = 5;

/** A rectangle `[x0, y0, x1, y1]` with a positive area, or null. */
export function normalize(rect: Rect4): Rect4 | null {
    const [l, t, r, b] = rect;
    if (![l, t, r, b].every(Number.isFinite)) return null;
    const x0 = Math.min(l, r), x1 = Math.max(l, r);
    const y0 = Math.min(t, b), y1 = Math.max(t, b);
    return x1 - x0 > 1e-6 && y1 - y0 > 1e-6 ? [x0, y0, x1, y1] : null;
}

function intersection(a: Rect4, b: Rect4): Rect4 | null {
    const x0 = Math.max(a[0], b[0]), y0 = Math.max(a[1], b[1]);
    const x1 = Math.min(a[2], b[2]), y1 = Math.min(a[3], b[3]);
    return x1 - x0 > 1e-6 && y1 - y0 > 1e-6 && [x0, y0, x1, y1].every(Number.isFinite) ? [x0, y0, x1, y1] : null;
}

/** `a` with `b` removed, as up to four rectangles. */
function subtractOne(a: Rect4, b: Rect4): Rect4[] {
    const i = intersection(a, b);
    if (!i) return [a];
    const out: Rect4[] = [];
    const push = (r: Rect4 | null) => { if (r) out.push(r); };
    if (i[1] > a[1]) push(normalize([a[0], a[1], a[2], i[1]]));
    if (i[3] < a[3]) push(normalize([a[0], i[3], a[2], a[3]]));
    if (i[0] > a[0]) push(normalize([a[0], i[1], i[0], i[3]]));
    if (i[2] < a[2]) push(normalize([i[2], i[1], a[2], i[3]]));
    return out;
}

const cap = (rects: Rect4[]) => rects.slice(0, MAX_CLIP_RECTS);

function subtractAll(subject: Rect4[], cuts: Rect4[]): Rect4[] {
    let cur = subject;
    for (const cut of cuts) {
        const next: Rect4[] = [];
        for (const s of cur) {
            for (const piece of subtractOne(s, cut)) {
                if (next.length >= MAX_CLIP_RECTS) return next;
                next.push(piece);
            }
        }
        cur = next;
    }
    return cur;
}

/** Intersects the current region with one rectangle. */
export function intersect(current: Region, rect: Rect4): Region {
    const r = normalize(rect);
    if (!r) return [];
    if (current === null) return [r];
    return cap(current.map(c => intersection(c, r)).filter((x): x is Rect4 => x !== null));
}

/**
 * Removes one rectangle. `surface` is the device bounds, used when the clip is still the default
 * (the whole surface) so the remainder can be named.
 */
export function exclude(current: Region, rect: Rect4, surface: Rect4 | null): Region {
    const r = normalize(rect);
    if (!r) return current;
    if (current !== null) return subtractAll(current, [r]);
    const s = surface && normalize(surface);
    return s ? subtractAll([s], [r]) : null;
}

/**
 * Combines `incoming` with the current region in a region mode (`RGN_*`). An unknown mode leaves
 * the region as it was. `RGN_COPY` replaces it. An `RGN_OR` or `RGN_XOR` against the default clip
 * stays the default clip: the whole surface already covers the incoming rectangles.
 */
export function combine(current: Region, incoming0: Rect4[], mode: number, surface: Rect4 | null): Region {
    const incoming = cap(incoming0.map(normalize).filter((x): x is Rect4 => x !== null));
    switch (mode) {
        case RGN_COPY: return incoming;
        case RGN_AND: {
            if (current === null) return incoming;
            const out: Rect4[] = [];
            for (const a of current) {
                for (const b of incoming) {
                    if (out.length >= MAX_CLIP_RECTS) return out;
                    const r = intersection(a, b);
                    if (r) out.push(r);
                }
            }
            return out;
        }
        case RGN_OR: return current === null ? null : cap([...current, ...incoming]);
        case RGN_DIFF: {
            if (current !== null) return subtractAll(current, incoming);
            const s = surface && normalize(surface);
            return s ? subtractAll([s], incoming) : null;
        }
        case RGN_XOR: {
            if (current === null) return null;
            const out = subtractAll(current, incoming);
            for (const r of subtractAll(incoming, current)) {
                if (out.length >= MAX_CLIP_RECTS) break;
                out.push(r);
            }
            return out;
        }
        default: return current;
    }
}
