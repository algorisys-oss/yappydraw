/**
 * Trousers & shoes for stick figures — the limb-derived counterpart to ./face.ts.
 *
 * A garment is the limb's own polyline inflated into a closed outline and drawn
 * BENEATH the black bone stroke. Because the shape comes from the limb, it follows any
 * pose for free: a seated figure's trousers bend at the knee without anyone authoring a
 * seated variant, exactly as a face follows the head circle.
 *
 * Closed outlines rather than a fat stroke, deliberately. A filled polygon fills *and*
 * strokes correctly in BOTH render pipelines (rough.js hatches it properly), whereas a
 * wide rough stroke reads as scratchy noise.
 *
 * ── Scale ──
 * Widths are fractions of `unit`, the rest-length hip→ankle (84 in the 140×260
 * authoring frame). Callers supply it:
 *   • the SVG builder   → 84 (it authors in that frame)
 *   • the animated rig  → thigh + shin lengths, already scaled
 *   • a post-drop restyle → derived from the head radius (r / 22 × 84)
 * Deliberately NOT a fraction of the limb's own length: a cycling pose has a 55-unit
 * leg, so its trousers would come out 30% thinner than a standing figure's.
 *
 * Everything here is pure: no DOM, no store, no Solid.
 */
import {
    polyD, primToSvg, offsetOutline, resample, truncate, polyLength,
    type Prim, type Pt,
} from './prims';

// ─── Style vocabulary ───────────────────────────────────────────────────────

export type TrouserStyle =
    | 'none' | 'straight' | 'baggy' | 'skinny' | 'shorts' | 'joggers'
    | 'skirt' | 'longSkirt';

export type ShoeStyle = 'none' | 'shoes' | 'boots' | 'sneakers' | 'heels' | 'front';

export const TROUSER_STYLES: { id: TrouserStyle; name: string }[] = [
    { id: 'none', name: 'None' },
    { id: 'straight', name: 'Straight' },
    { id: 'baggy', name: 'Baggy' },
    { id: 'skinny', name: 'Skinny' },
    { id: 'shorts', name: 'Shorts' },
    { id: 'joggers', name: 'Joggers' },
    { id: 'skirt', name: 'Skirt' },
    { id: 'longSkirt', name: 'Long skirt' },
];

export const SHOE_STYLES: { id: ShoeStyle; name: string }[] = [
    { id: 'none', name: 'None' },
    { id: 'shoes', name: 'Shoes' },
    { id: 'boots', name: 'Boots' },
    { id: 'sneakers', name: 'Sneakers' },
    { id: 'heels', name: 'Heels' },
    { id: 'front', name: 'Front-facing' },
];

const TROUSER_IDS = new Set<string>(TROUSER_STYLES.map(s => s.id));
const SHOE_IDS = new Set<string>(SHOE_STYLES.map(s => s.id));

export const asTrouserStyle = (v: unknown, fallback: TrouserStyle = 'none'): TrouserStyle =>
    typeof v === 'string' && TROUSER_IDS.has(v) ? v as TrouserStyle : fallback;
export const asShoeStyle = (v: unknown, fallback: ShoeStyle = 'none'): ShoeStyle =>
    typeof v === 'string' && SHOE_IDS.has(v) ? v as ShoeStyle : fallback;

/** Default fills. Trousers denim-blue, shoes near-black. */
export const DEFAULT_TROUSER_COLOR = '#3b5b8c';
export const DEFAULT_SHOE_COLOR = '#2b2118';

/** The rest-length hip→ankle in the 140×260 authoring frame. */
export const LEG_UNIT = 84;

export interface GarmentOpts {
    trousers?: TrouserStyle;
    trouserColor?: string;
    shoes?: ShoeStyle;
    shoeColor?: string;
    /** Rest-length hip→ankle for this figure. Defaults to the authoring frame's 84. */
    unit?: number;
    /** 1 = facing right, -1 = facing left. Points the toes. */
    facing?: 1 | -1;
}

// ─── Leg extraction ─────────────────────────────────────────────────────────

const near = (a: Pt, b: Pt, tol: number) => Math.hypot(a[0] - b[0], a[1] - b[1]) < tol;

/** Parse an `M…L…` subpath (M/L only) into points. */
function subToPoints(sub: string): Pt[] {
    return sub.replace(/^M/, '').split('L')
        .map(s => s.trim().split(/[ ,]+/).map(Number))
        .filter(p => p.length === 2 && p.every(Number.isFinite)) as Pt[];
}

/**
 * The leg polylines of a skeleton `d` string, given the hip.
 *
 * Seeded at the hip, then extended by any subpath that CONTINUES from the chain's end
 * — seated poses author a leg as two separate subpaths (thigh, then shin), so a naive
 * "subpaths starting at the hip" rule finds a stump and loses the shin. Poses that draw
 * only one visible leg (cycling) legitimately return a single chain.
 *
 * Verified against every pose in the library by `garments.test.ts`.
 */
export function legChains(bones: string, hip: readonly [number, number], tol = 6): Pt[][] {
    const parts = bones.split(/(?=M)/).map(s => s.trim()).filter(Boolean)
        .map(subToPoints).filter(p => p.length >= 2);
    const used = new Set<number>();
    const chains: Pt[][] = [];
    parts.forEach((p, i) => {
        if (used.has(i) || !near(p[0], hip as Pt, tol)) return;
        used.add(i);
        const chain: Pt[] = [...p];
        // Bounded: a leg is hip→knee→ankle, so two extensions is already generous, and
        // an unbounded walk could swallow an arm that happens to start at a foot.
        for (let guard = 0; guard < 2; guard++) {
            const j = parts.findIndex((q, k) => !used.has(k) && near(q[0], chain[chain.length - 1], tol));
            if (j < 0) break;
            used.add(j);
            chain.push(...parts[j].slice(1));
        }
        chains.push(chain);
    });
    return chains;
}

// ─── Width profiles ─────────────────────────────────────────────────────────

/** Half-width at arc fraction `t`, in units of `unit`, per trouser style. */
const PROFILE: Record<Exclude<TrouserStyle, 'none' | 'skirt' | 'longSkirt'>,
    { from: number; to: number; length: number }> = {
    straight: { from: 0.115, to: 0.088, length: 1 },
    baggy: { from: 0.150, to: 0.180, length: 1 },
    skinny: { from: 0.098, to: 0.066, length: 1 },
    shorts: { from: 0.135, to: 0.150, length: 0.46 },
    joggers: { from: 0.140, to: 0.062, length: 0.93 },
};

/** A trapezoid hanging from the hip — skirts don't follow the legs. */
function skirtPrims(hip: Pt, unit: number, long: boolean, fill: string, w: number): Prim[] {
    const wTop = unit * 0.155, wBot = unit * (long ? 0.42 : 0.30);
    const len = unit * (long ? 0.78 : 0.43);
    const [hx, hy] = hip;
    return [{
        k: 'path',
        d: polyD([
            [hx - wTop, hy - unit * 0.024], [hx + wTop, hy - unit * 0.024],
            [hx + wBot, hy + len], [hx - wBot, hy + len],
        ]),
        w, fill,
    }];
}

// ─── Shoes ──────────────────────────────────────────────────────────────────

/**
 * A shoe at the end of a leg chain: a side-view wedge with the instep at the ankle, the
 * sole on the ground and the toe pointing along `facing`.
 *
 * Sized generously on purpose — an anatomically "correct" small foot disappears at the
 * sizes figures are actually used at, so the silhouette is the thing to optimise.
 */
function shoePrims(leg: Pt[], style: ShoeStyle, unit: number, facing: 1 | -1, fill: string, w: number): Prim[] {
    if (style === 'none' || leg.length < 2) return [];
    const ankle = leg[leg.length - 1];
    const prev = leg[leg.length - 2];
    // Unit vector along the shin, used to run a boot shaft back up the leg.
    let dx = ankle[0] - prev[0], dy = ankle[1] - prev[1];
    const m = Math.hypot(dx, dy) || 1;
    dx /= m; dy /= m;

    // Seen head-on rather than in profile — the right choice for the library's
    // front-facing poses, where a side-view shoe reads as a foot turned sideways.
    if (style === 'front') {
        const rx = unit * 0.105, ry = unit * 0.072;
        return [{ k: 'oval', x: ankle[0], y: ankle[1] + ry * 0.55, rx, ry, w, fill }];
    }

    const spec = {
        shoes: { len: 0.24, h: 0.105, back: 0.070, shaft: 0 },
        boots: { len: 0.23, h: 0.115, back: 0.080, shaft: 0.26 },
        sneakers: { len: 0.26, h: 0.130, back: 0.090, shaft: 0 },
        heels: { len: 0.24, h: 0.075, back: 0.040, shaft: 0 },
    }[style];

    const L = unit * spec.len, H = unit * spec.h, B = unit * spec.back;
    const ax = ankle[0], ay = ankle[1];
    const bx = ax - facing * B;                       // back of the heel
    const out: Prim[] = [];

    // Boot shaft first, so the foot draws over its bottom edge.
    if (spec.shaft) {
        const S = unit * spec.shaft, hw = unit * 0.085;
        const ux = -dx * S, uy = -dy * S;             // back up the shin
        out.push({
            k: 'path',
            d: polyD([
                [ax - dy * hw, ay + dx * hw],
                [ax + ux - dy * hw, ay + uy + dx * hw],
                [ax + ux + dy * hw, ay + uy - dx * hw],
                [ax + dy * hw, ay - dx * hw],
            ]),
            w, fill,
        });
    }

    out.push({
        k: 'path',
        d: polyD([
            [bx, ay - H * 0.25],                                  // heel, just above the ankle
            [ax + facing * L * 0.35, ay - H * 0.15],              // instep
            [ax + facing * L, ay + H * 0.45],                     // toe tip
            [ax + facing * L, ay + H],                            // toe, on the ground
            [bx, ay + H],                                         // heel, on the ground
        ]),
        w, fill,
    });

    if (style === 'heels') {
        // A thin block under the heel — the one shoe defined by what's below it.
        const hb = unit * 0.045;
        out.push({
            k: 'path',
            d: polyD([
                [bx, ay + H], [bx + facing * hb, ay + H],
                [bx + facing * hb, ay + H + unit * 0.085], [bx, ay + H + unit * 0.085],
            ]),
            w: w * 0.8, fill,
        });
    }
    return out;
}

// ─── Public geometry ────────────────────────────────────────────────────────

/** Stroke weight for garment outlines at scale `unit`. */
const garmentWidth = (unit: number) => Math.max(0.6, unit * 0.045);

/**
 * Trousers + shoes for a figure, given its leg polylines and hip.
 *
 * Trousers are emitted first so shoes sit on top of a cuff. Returns [] when nothing is
 * worn, so callers can skip the whole group.
 */
export function garmentGeometry(legs: Pt[][], hip: Pt, o: GarmentOpts = {}): Prim[] {
    const unit = o.unit && o.unit > 0 ? o.unit : LEG_UNIT;
    const trousers = asTrouserStyle(o.trousers, 'none');
    const shoes = asShoeStyle(o.shoes, 'none');
    if (trousers === 'none' && shoes === 'none') return [];

    const w = garmentWidth(unit);
    const tFill = o.trouserColor || DEFAULT_TROUSER_COLOR;
    const sFill = o.shoeColor || DEFAULT_SHOE_COLOR;
    const facing: 1 | -1 = o.facing === -1 ? -1 : 1;
    const out: Prim[] = [];

    if (trousers === 'skirt' || trousers === 'longSkirt') {
        out.push(...skirtPrims(hip, unit, trousers === 'longSkirt', tFill, w));
    } else if (trousers !== 'none') {
        const spec = PROFILE[trousers];
        for (const leg of legs) {
            if (polyLength(leg) < unit * 0.15) continue;      // a stump isn't worth clothing
            const path = spec.length < 1 ? truncate(leg, spec.length) : resample(leg, 12);
            const half = (t: number) => unit * (spec.from + (spec.to - spec.from) * t);
            out.push({ k: 'path', d: polyD(offsetOutline(path, half)), w, fill: tFill });
        }
    }

    if (shoes !== 'none') {
        for (const leg of legs) out.push(...shoePrims(leg, shoes, unit, facing, sFill, w));
    }
    return out;
}

/**
 * Attributes recording which garments a figure wears, stamped on the element that
 * carries the hip (the first leg part). Mirrors `faceStateAttrs` in ./face.ts.
 */
export function garmentStateAttrs(o: GarmentOpts = {}): string {
    return ` data-sf-trousers="${asTrouserStyle(o.trousers, 'none')}"`
        + ` data-sf-trouser-color="${o.trouserColor || DEFAULT_TROUSER_COLOR}"`
        + ` data-sf-shoes="${asShoeStyle(o.shoes, 'none')}"`
        + ` data-sf-shoe-color="${o.shoeColor || DEFAULT_SHOE_COLOR}"`;
}

/** Garments as role-tagged SVG markup. Emitted BEFORE the bones so lines sit on top. */
export function garmentSvg(legs: Pt[][], hip: Pt, o: GarmentOpts = {}): string {
    const prims = garmentGeometry(legs, hip, o);
    if (!prims.length) return '';
    return `<g data-sf-role="garment">${prims.map(primToSvg).join('')}</g>`;
}
