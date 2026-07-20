/**
 * Faces & hair for stick figures — the single source of truth for both figure
 * systems.
 *
 * A face is fully determined by the head circle: give it a centre `(cx, cy)` and
 * radius `r` and every eye, brow, mouth and hair stroke is derived as a fraction
 * of `r`. That is what makes faces restyleable *after* a figure has been dropped
 * (the head part's bounding box is all we need) and what lets the animated rig
 * draw a face every frame without re-parsing SVG.
 *
 * Two emitters share one geometry pass:
 *   • {@link faceGeometry} / {@link hairGeometry} → drawing primitives, consumed
 *     directly by the canvas renderer (architectural + sketch).
 *   • {@link faceHairSvg} → role-tagged SVG markup, consumed by the static
 *     library builder, the panel previews, and `bakeAnimatedFigure`.
 *
 * Everything here is pure: no DOM, no store, no Solid.
 */

// ─── Style vocabulary ───────────────────────────────────────────────────────

export type FaceStyle =
    | 'none' | 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised'
    | 'tired' | 'excited' | 'proud' | 'confused' | 'scared' | 'wink';

export type HairStyle =
    | 'none' | 'short' | 'curly' | 'spiky' | 'fringe' | 'long'
    | 'bun' | 'ponytail' | 'pigtails' | 'sideSwept'
    | 'swoosh' | 'mohawk' | 'afro' | 'bob' | 'braids' | 'topKnot' | 'balding' | 'cap';

export const FACE_STYLES: { id: FaceStyle; name: string }[] = [
    { id: 'none', name: 'None' },
    { id: 'neutral', name: 'Neutral' },
    { id: 'happy', name: 'Happy' },
    { id: 'sad', name: 'Sad' },
    { id: 'angry', name: 'Angry' },
    { id: 'surprised', name: 'Surprised' },
    { id: 'tired', name: 'Tired' },
    { id: 'excited', name: 'Excited' },
    { id: 'proud', name: 'Proud' },
    { id: 'confused', name: 'Confused' },
    { id: 'scared', name: 'Scared' },
    { id: 'wink', name: 'Wink' },
];

export const HAIR_STYLES: { id: HairStyle; name: string }[] = [
    { id: 'none', name: 'None' },
    { id: 'short', name: 'Short' },
    { id: 'curly', name: 'Curly' },
    { id: 'spiky', name: 'Spiky' },
    { id: 'fringe', name: 'Fringe' },
    { id: 'long', name: 'Long' },
    { id: 'bun', name: 'Bun' },
    { id: 'ponytail', name: 'Ponytail' },
    { id: 'pigtails', name: 'Pigtails' },
    { id: 'sideSwept', name: 'Side swept' },
    { id: 'swoosh', name: 'Swoosh' },
    { id: 'mohawk', name: 'Mohawk' },
    { id: 'afro', name: 'Afro' },
    { id: 'bob', name: 'Bob' },
    { id: 'braids', name: 'Braids' },
    { id: 'topKnot', name: 'Top knot' },
    { id: 'balding', name: 'Balding' },
    { id: 'cap', name: 'Cap' },
];

const FACE_IDS = new Set<string>(FACE_STYLES.map(s => s.id));
const HAIR_IDS = new Set<string>(HAIR_STYLES.map(s => s.id));

/** Coerce an arbitrary string to a known face style (fallback `neutral`). */
export const asFaceStyle = (v: unknown, fallback: FaceStyle = 'neutral'): FaceStyle =>
    typeof v === 'string' && FACE_IDS.has(v) ? v as FaceStyle : fallback;
/** Coerce an arbitrary string to a known hair style (fallback `none`). */
export const asHairStyle = (v: unknown, fallback: HairStyle = 'none'): HairStyle =>
    typeof v === 'string' && HAIR_IDS.has(v) ? v as HairStyle : fallback;

/** Default hair colour when a filled hair style doesn't specify one. */
export const DEFAULT_HAIR_COLOR = '#8b5e3c';

export interface FaceOpts {
    face?: FaceStyle;
    hair?: HairStyle;
    /** Fill for solid hair styles (short / curly / bun / pigtails / sideSwept). */
    hairColor?: string;
    /** Fill the head circle white so the face reads over busy backgrounds. */
    headFill?: boolean;
    /** 1 = facing right, -1 = facing left. Shifts the face toward the facing side. */
    facing?: 1 | -1;
}

// ─── Drawing primitives ─────────────────────────────────────────────────────

/**
 * A face/hair mark in *absolute* coordinates. `w` is an absolute stroke width;
 * `fill` present means the mark is filled (and, unless `fill` is the only paint,
 * also stroked).
 */
export type FacePrim =
    | { k: 'dot'; x: number; y: number; r: number }
    | { k: 'ring'; x: number; y: number; r: number; w: number; fill?: string }
    | { k: 'oval'; x: number; y: number; rx: number; ry: number; w: number; fill?: string }
    | { k: 'arc'; x: number; y: number; r: number; a0: number; a1: number; w: number }
    | { k: 'poly'; pts: [number, number][]; w: number }
    | { k: 'path'; d: string; w: number; fill?: string };

const r1 = (n: number) => Math.round(n * 10) / 10;
const P = Math.PI;

/** Stroke weight for face marks at head radius `r` (r=22 → ≈3.5). */
const faceWidth = (r: number) => Math.max(0.6, r * 0.16);
/** Stroke weight for hair marks at head radius `r` (r=22 → ≈4.8). */
const hairWidth = (r: number) => Math.max(0.8, r * 0.22);

// ─── Face geometry ──────────────────────────────────────────────────────────

/** Eye/brow/mouth placement, all as fractions of the head radius. */
const EYE_DX = 0.34, EYE_Y = -0.20, EYE_DOT = 0.10;
const BROW_Y = -0.50;
const MOUTH_Y = 0.32;

type EyeKind = 'dot' | 'wide' | 'smile' | 'up' | 'line' | 'wink';
type BrowKind = 'none' | 'angry' | 'raised' | 'worried' | 'oneRaised';
type MouthKind = 'none' | 'line' | 'smile' | 'bigSmile' | 'frown' | 'smallFrown' | 'openO' | 'openWide' | 'squiggle';

const FACE_RECIPE: Record<Exclude<FaceStyle, 'none'>, { eyes: EyeKind; brows: BrowKind; mouth: MouthKind }> = {
    neutral: { eyes: 'dot', brows: 'none', mouth: 'line' },
    happy: { eyes: 'smile', brows: 'none', mouth: 'smile' },
    sad: { eyes: 'dot', brows: 'worried', mouth: 'frown' },
    angry: { eyes: 'dot', brows: 'angry', mouth: 'frown' },
    surprised: { eyes: 'wide', brows: 'raised', mouth: 'openO' },
    tired: { eyes: 'line', brows: 'none', mouth: 'smallFrown' },
    excited: { eyes: 'smile', brows: 'raised', mouth: 'openWide' },
    proud: { eyes: 'up', brows: 'none', mouth: 'smile' },
    confused: { eyes: 'dot', brows: 'oneRaised', mouth: 'squiggle' },
    scared: { eyes: 'wide', brows: 'worried', mouth: 'squiggle' },
    wink: { eyes: 'wink', brows: 'none', mouth: 'smile' },
};

/** One eye at `(ex, ey)` in the requested form. */
function eyePrims(kind: EyeKind, ex: number, ey: number, r: number, w: number, side: -1 | 1): FacePrim[] {
    switch (kind) {
        case 'dot':
            return [{ k: 'dot', x: ex, y: ey, r: r * EYE_DOT }];
        case 'wide':
            return [
                { k: 'ring', x: ex, y: ey, r: r * 0.17, w },
                { k: 'dot', x: ex, y: ey, r: r * 0.07 },
            ];
        // `‿` — a closed, happy eye (lower half of a circle; y grows downward).
        case 'smile':
            return [{ k: 'arc', x: ex, y: ey - r * 0.04, r: r * 0.17, a0: 0.1 * P, a1: 0.9 * P, w }];
        // `⌒` — a content / proud eye.
        case 'up':
            return [{ k: 'arc', x: ex, y: ey + r * 0.06, r: r * 0.17, a0: 1.1 * P, a1: 1.9 * P, w }];
        case 'line':
            return [{ k: 'poly', pts: [[ex - r * 0.16, ey], [ex + r * 0.16, ey]], w }];
        // Left eye open, right eye closed.
        case 'wink':
            return side < 0
                ? [{ k: 'dot', x: ex, y: ey, r: r * EYE_DOT }]
                : [{ k: 'arc', x: ex, y: ey - r * 0.04, r: r * 0.17, a0: 0.1 * P, a1: 0.9 * P, w }];
    }
}

/** Both brows in the requested form. */
function browPrims(kind: BrowKind, cx: number, cy: number, r: number, w: number): FacePrim[] {
    if (kind === 'none') return [];
    const by = cy + r * BROW_Y;
    const outer = r * 0.54, inner = r * 0.18;
    const slant = (dir: -1 | 1, drop: number): FacePrim =>
        // dir = -1 → left brow. `drop` > 0 tilts the INNER end downward (angry).
        ({ k: 'poly', pts: [[cx + dir * outer, by - drop], [cx + dir * inner, by + drop]], w });
    switch (kind) {
        case 'angry':
            return [slant(-1, r * 0.11), slant(1, r * 0.11)];
        case 'worried':
            return [slant(-1, -r * 0.11), slant(1, -r * 0.11)];
        case 'raised':
            return [
                { k: 'arc', x: cx - r * EYE_DX, y: by + r * 0.18, r: r * 0.22, a0: 1.15 * P, a1: 1.85 * P, w },
                { k: 'arc', x: cx + r * EYE_DX, y: by + r * 0.18, r: r * 0.22, a0: 1.15 * P, a1: 1.85 * P, w },
            ];
        case 'oneRaised':
            return [
                { k: 'poly', pts: [[cx - outer, by + r * 0.04], [cx - inner, by + r * 0.04]], w },
                { k: 'arc', x: cx + r * EYE_DX, y: by + r * 0.14, r: r * 0.22, a0: 1.15 * P, a1: 1.85 * P, w },
            ];
    }
}

/** The mouth in the requested form. */
function mouthPrims(kind: MouthKind, cx: number, cy: number, r: number, w: number): FacePrim[] {
    if (kind === 'none') return [];
    const my = cy + r * MOUTH_Y;
    switch (kind) {
        case 'line':
            return [{ k: 'poly', pts: [[cx - r * 0.24, my], [cx + r * 0.24, my]], w }];
        case 'smile':
            return [{ k: 'arc', x: cx, y: my - r * 0.09, r: r * 0.28, a0: 0.18 * P, a1: 0.82 * P, w }];
        case 'bigSmile':
            return [{ k: 'arc', x: cx, y: my - r * 0.14, r: r * 0.35, a0: 0.14 * P, a1: 0.86 * P, w }];
        case 'frown':
            return [{ k: 'arc', x: cx, y: my + r * 0.20, r: r * 0.28, a0: 1.18 * P, a1: 1.82 * P, w }];
        case 'smallFrown':
            return [{ k: 'arc', x: cx, y: my + r * 0.16, r: r * 0.22, a0: 1.18 * P, a1: 1.82 * P, w }];
        case 'openO':
            return [{ k: 'oval', x: cx, y: my, rx: r * 0.15, ry: r * 0.18, w }];
        case 'openWide':
            return [{ k: 'oval', x: cx, y: my + r * 0.04, rx: r * 0.26, ry: r * 0.22, w }];
        case 'squiggle': {
            const half = r * 0.26, dy = r * 0.07;
            const pts: [number, number][] = [];
            for (let i = 0; i <= 4; i++) pts.push([cx - half + (half * 2 * i) / 4, my + (i % 2 ? dy : -dy)]);
            return [{ k: 'poly', pts, w }];
        }
    }
}

/**
 * Face marks (eyes + brows + mouth) for a head circle at `(cx, cy)` radius `r`.
 * Returns [] for `face: 'none'` (or an unknown style).
 */
export function faceGeometry(cx: number, cy: number, r: number, o: FaceOpts = {}): FacePrim[] {
    const style = asFaceStyle(o.face, 'none');
    if (style === 'none' || r <= 0) return [];
    const recipe = FACE_RECIPE[style];
    const w = faceWidth(r);
    // Side-profile poses read better with the face nudged toward the facing side.
    const fx = cx + (o.facing ? o.facing * r * 0.14 : 0);
    const ey = cy + r * EYE_Y;
    return [
        ...eyePrims(recipe.eyes, fx - r * EYE_DX, ey, r, w, -1),
        ...eyePrims(recipe.eyes, fx + r * EYE_DX, ey, r, w, 1),
        ...browPrims(recipe.brows, fx, cy, r, w),
        ...mouthPrims(recipe.mouth, fx, cy, r, w),
    ];
}

// ─── Hair geometry ──────────────────────────────────────────────────────────

/** Point on the head circle at angle `a` (radians, 0 = +x, y down), scaled by `k`. */
const onHead = (cx: number, cy: number, r: number, a: number, k = 1): [number, number] =>
    [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k];

/**
 * A solid cap hugging the top of the head, from angle `a0` to `a1` (both left
 * and right of centre). The inner edge is the skull; the outer edge is a
 * circular arc through the same two side points, peaking `rise * r` above the
 * crown — so the cap is `rise * r` thick at the top and tapers to nothing at the
 * sides, which is what reads as hair rather than a helmet.
 *
 * A quadratic won't do here: its control point would have to sit far above the
 * head to clear the skull at all (the endpoints are down at ear level), and the
 * result peaks instead of doming.
 */
function capPath(cx: number, cy: number, r: number, a0: number, a1: number, rise: number): string {
    const [x0, y0] = onHead(cx, cy, r, a0);
    const [x1, y1] = onHead(cx, cy, r, a1);
    const h = r * (1 + rise);                      // apex height above the head centre
    const xc = Math.abs(x1 - x0) / 2;              // half-chord
    const yc = (y0 + y1) / 2 - cy;                 // chord offset (negative = above centre)
    // Circle through (±xc, yc) and (0, −h), centred at (cx, cy + m).
    const m = (h * h - xc * xc - yc * yc) / (2 * (-yc - h));
    const R = Math.max(xc, h + m);
    // The closing skull arc must be the one that passes over the CROWN. For a cap
    // spanning more than 180° (an afro wrapping past the ears) that is the *major* arc,
    // and leaving large-arc at 0 sends it under the chin instead — which fills the face.
    const largeInner = a1 - a0 > P ? 1 : 0;
    // Outer edge left→right the long way over the crown, then back along the skull.
    return `M${r1(x0)} ${r1(y0)}A${r1(R)} ${r1(R)} 0 1 1 ${r1(x1)} ${r1(y1)}`
        + `A${r1(r)} ${r1(r)} 0 ${largeInner} 0 ${r1(x0)} ${r1(y0)}Z`;
}

/**
 * Hair marks for a head circle at `(cx, cy)` radius `r`. Solid styles carry a
 * `fill` (the hair colour); outline styles are stroke-only.
 */
export function hairGeometry(cx: number, cy: number, r: number, o: FaceOpts = {}): FacePrim[] {
    const style = asHairStyle(o.hair, 'none');
    if (style === 'none' || r <= 0) return [];
    const w = hairWidth(r);
    const fill = o.hairColor || DEFAULT_HAIR_COLOR;
    const top = cy - r;

    switch (style) {
        // A solid crop over the skull.
        case 'short':
            return [{ k: 'path', d: capPath(cx, cy, r, P * 1.04, P * 1.96, 0.30), w: w * 0.6, fill }];

        // A scalloped cap — a row of bumps along the crown, closed by the skull.
        case 'curly': {
            const bumps = 5, a0 = P * 1.02, a1 = P * 1.98;
            const step = (a1 - a0) / bumps;
            const [sx, sy] = onHead(cx, cy, r, a0);
            let d = `M${r1(sx)} ${r1(sy)}`;
            for (let i = 0; i < bumps; i++) {
                const aa = a0 + step * (i + 1);
                const [ex, ey] = onHead(cx, cy, r, aa, i === bumps - 1 ? 1 : 1.12);
                const [mx, my] = onHead(cx, cy, r, aa - step / 2, 1.55);
                d += `Q${r1(mx)} ${r1(my)} ${r1(ex)} ${r1(ey)}`;
            }
            d += `A${r1(r)} ${r1(r)} 0 0 0 ${r1(sx)} ${r1(sy)}Z`;
            return [{ k: 'path', d, w: w * 0.6, fill }];
        }

        // A zigzag crest — reads as a child's spiky hair. Stroke-only.
        case 'spiky': {
            const n = 6, a0 = P * 1.18, a1 = P * 1.82;
            const pts: [number, number][] = [];
            for (let i = 0; i <= n; i++) {
                const a = a0 + ((a1 - a0) * i) / n;
                pts.push(onHead(cx, cy, r, a, i % 2 ? 1.26 : 1.0));
            }
            return [{ k: 'poly', pts, w }];
        }

        // The original library hair: a fringe plus two side locks.
        case 'fringe':
            return fringePrims(cx, cy, r, w);

        // Fringe plus locks running well past the shoulders.
        case 'long':
            return [
                ...fringePrims(cx, cy, r, w),
                { k: 'path', d: `M${r1(cx - r + 2)} ${r1(cy - 1)}Q${r1(cx - r - 8)} ${r1(cy + r * 1.4)} ${r1(cx - r + 2)} ${r1(cy + r * 2.6)}`, w: w * 0.8 },
                { k: 'path', d: `M${r1(cx + r - 2)} ${r1(cy - 1)}Q${r1(cx + r + 8)} ${r1(cy + r * 1.4)} ${r1(cx + r - 2)} ${r1(cy + r * 2.6)}`, w: w * 0.8 },
            ];

        // Fringe plus a bun sitting on the crown.
        case 'bun':
            return [
                ...fringePrims(cx, cy, r, w),
                { k: 'ring', x: cx, y: top - r * 0.30, r: r * 0.34, w: w * 0.7, fill },
            ];

        // A crop plus a tail sweeping down behind the head.
        case 'ponytail': {
            const dir = o.facing === -1 ? -1 : 1;   // tail trails behind the facing side
            const bx = cx - dir * r * 0.80, by = cy - r * 0.42;
            return [
                { k: 'path', d: capPath(cx, cy, r, P * 1.04, P * 1.96, 0.26), w: w * 0.6, fill },
                { k: 'path', d: `M${r1(bx)} ${r1(by)}Q${r1(bx - dir * r * 0.85)} ${r1(cy + r * 0.35)} ${r1(bx - dir * r * 0.5)} ${r1(cy + r * 1.25)}`, w },
            ];
        }

        // Fringe plus a bobble either side.
        case 'pigtails':
            return [
                ...fringePrims(cx, cy, r, w),
                { k: 'poly', pts: [[cx - r * 0.92, cy - r * 0.30], [cx - r * 1.06, cy - r * 0.16]], w },
                { k: 'poly', pts: [[cx + r * 0.92, cy - r * 0.30], [cx + r * 1.06, cy - r * 0.16]], w },
                { k: 'ring', x: cx - r * 1.22, y: cy - r * 0.02, r: r * 0.24, w: w * 0.7, fill },
                { k: 'ring', x: cx + r * 1.22, y: cy - r * 0.02, r: r * 0.24, w: w * 0.7, fill },
            ];

        // A big anime-style crest sweeping back from the brow into a point.
        case 'swoosh': {
            const dir = o.facing === -1 ? -1 : 1;
            const front = dir === 1 ? P * 1.96 : P * 1.04;   // temple on the facing side
            const back = dir === 1 ? P * 1.04 : P * 1.96;
            const [fx, fy] = onHead(cx, cy, r, front);
            const [bx, by] = onHead(cx, cy, r, back);
            const tipX = cx - dir * r * 1.15, tipY = cy - r * 1.62;
            // Close along the skull the SHORT way over the crown, or the fill swallows
            // the whole head instead of sitting on top of it.
            const sweep = dir === 1 ? 1 : 0;
            return [{
                k: 'path',
                d: `M${r1(fx)} ${r1(fy)}`
                    + `Q${r1(cx + dir * r * 0.5)} ${r1(cy - r * 1.55)} ${r1(tipX)} ${r1(tipY)}`
                    + `Q${r1(cx - dir * r * 0.15)} ${r1(cy - r * 1.05)} ${r1(bx)} ${r1(by)}`
                    + `A${r1(r)} ${r1(r)} 0 0 ${sweep} ${r1(fx)} ${r1(fy)}Z`,
                w: w * 0.6, fill,
            }];
        }

        // A single central crest — narrow, so it reads as a mohawk and not a party hat.
        case 'mohawk': {
            const [ax, ay] = onHead(cx, cy, r, P * 1.36);
            const [bx, by] = onHead(cx, cy, r, P * 1.64);
            return [{
                k: 'path',
                d: `M${r1(ax)} ${r1(ay)}`
                    + `Q${r1(cx - r * 0.34)} ${r1(cy - r * 1.5)} ${r1(cx - r * 0.05)} ${r1(cy - r * 1.52)}`
                    + `Q${r1(cx + r * 0.3)} ${r1(cy - r * 1.5)} ${r1(bx)} ${r1(by)}`
                    + `A${r1(r)} ${r1(r)} 0 0 0 ${r1(ax)} ${r1(ay)}Z`,
                w: w * 0.7, fill,
            }];
        }

        // A round halo. It must be a CRESCENT hugging the skull, not a disc — a filled
        // circle centred on the head paints straight over the face.
        case 'afro':
            return [{ k: 'path', d: capPath(cx, cy, r, P * 0.9, P * 2.1, 0.62), w: w * 0.6, fill }];

        // A chin-length bob: solid cap plus two blunt sides curving to the jaw.
        case 'bob': {
            const side = (d: -1 | 1): FacePrim => ({
                k: 'path',
                d: `M${r1(cx + d * r * 0.99)} ${r1(cy - r * 0.16)}`
                    + `Q${r1(cx + d * r * 1.16)} ${r1(cy + r * 0.55)} ${r1(cx + d * r * 0.86)} ${r1(cy + r * 0.98)}`
                    + `Q${r1(cx + d * r * 0.5)} ${r1(cy + r * 0.72)} ${r1(cx + d * r * 0.55)} ${r1(cy - r * 0.1)}Z`,
                w: w * 0.6, fill,
            });
            return [
                { k: 'path', d: capPath(cx, cy, r, P * 1.0, P * 2.0, 0.24), w: w * 0.6, fill },
                side(-1), side(1),
            ];
        }

        // Two long plaits, each drawn as a chain of beads down past the shoulder.
        case 'braids': {
            const plait = (side: -1 | 1): FacePrim[] => {
                const out: FacePrim[] = [];
                for (let i = 0; i < 4; i++) {
                    out.push({
                        k: 'ring',
                        x: cx + side * (r * 0.95 + i * r * 0.05),
                        y: cy + r * (0.35 + i * 0.42),
                        r: r * 0.19, w: w * 0.55, fill,
                    });
                }
                return out;
            };
            return [...fringePrims(cx, cy, r, w), ...plait(-1), ...plait(1)];
        }

        // A tight cap with a small knot on the crown.
        case 'topKnot':
            return [
                { k: 'path', d: capPath(cx, cy, r, P * 1.1, P * 1.9, 0.16), w: w * 0.6, fill },
                { k: 'ring', x: cx, y: cy - r * 1.32, r: r * 0.22, w: w * 0.7, fill },
                { k: 'poly', pts: [[cx, cy - r * 1.1], [cx, cy - r * 0.98]], w: w * 0.7 },
            ];

        // A receding hairline: two side pieces, nothing on top.
        case 'balding':
            return [
                { k: 'path', d: `M${r1(cx - r * 1.0)} ${r1(cy - r * 0.05)}Q${r1(cx - r * 0.92)} ${r1(cy - r * 0.72)} ${r1(cx - r * 0.5)} ${r1(cy - r * 0.86)}`, w: w * 0.9 },
                { k: 'path', d: `M${r1(cx + r * 1.0)} ${r1(cy - r * 0.05)}Q${r1(cx + r * 0.92)} ${r1(cy - r * 0.72)} ${r1(cx + r * 0.5)} ${r1(cy - r * 0.86)}`, w: w * 0.9 },
            ];

        // A baseball cap: solid crown plus a proper brim on the facing side.
        case 'cap': {
            const dir = o.facing === -1 ? -1 : 1;
            const [px, py] = onHead(cx, cy, r, dir === 1 ? P * 1.94 : P * 1.06);
            return [
                { k: 'path', d: capPath(cx, cy, r, P * 1.06, P * 1.94, 0.3), w: w * 0.6, fill },
                {
                    k: 'path',
                    d: `M${r1(cx + dir * r * 0.42)} ${r1(cy - r * 0.66)}`
                        + `Q${r1(cx + dir * r * 1.5)} ${r1(cy - r * 0.78)} ${r1(cx + dir * r * 1.72)} ${r1(cy - r * 0.3)}`
                        + `Q${r1(cx + dir * r * 1.3)} ${r1(cy - r * 0.12)} ${r1(px)} ${r1(py)}`
                        + `Q${r1(cx + dir * r * 0.7)} ${r1(cy - r * 0.4)} ${r1(cx + dir * r * 0.42)} ${r1(cy - r * 0.66)}Z`,
                    w: w * 0.6, fill,
                },
            ];
        }

        // A solid fringe swept across the forehead to one side — it must clear the
        // eyes, so the inner edge stays well above `EYE_Y`.
        case 'sideSwept': {
            const dir = o.facing === -1 ? -1 : 1;
            const [ax, ay] = onHead(cx, cy, r, P * 1.06);
            const [bx, by] = onHead(cx, cy, r, P * 1.94);
            const near = dir === 1 ? [ax, ay] : [bx, by];
            const far = dir === 1 ? [bx, by] : [ax, ay];
            const d = `M${r1(near[0])} ${r1(near[1])}`
                + `Q${r1(cx - dir * r * 0.25)} ${r1(cy - r * 1.75)} ${r1(far[0])} ${r1(far[1])}`
                + `Q${r1(cx + dir * r * 0.55)} ${r1(cy - r * 0.52)} ${r1(near[0])} ${r1(near[1])}Z`;
            return [{ k: 'path', d, w: w * 0.6, fill }];
        }
    }
}

/** The classic fringe + two side locks (stroke-only) shared by several styles. */
function fringePrims(cx: number, cy: number, r: number, w: number): FacePrim[] {
    const top = cy - r;
    return [
        { k: 'path', d: `M${r1(cx - r + r * 0.14)} ${r1(cy - r * 0.14)}Q${r1(cx)} ${r1(top - r * 0.32)} ${r1(cx + r - r * 0.14)} ${r1(cy - r * 0.14)}`, w },
        { k: 'path', d: `M${r1(cx - r + r * 0.09)} ${r1(cy - r * 0.05)}Q${r1(cx - r - r * 0.23)} ${r1(cy + r * 0.9)} ${r1(cx - r + r * 0.05)} ${r1(cy + r * 1.36)}`, w: w * 0.7 },
        { k: 'path', d: `M${r1(cx + r - r * 0.09)} ${r1(cy - r * 0.05)}Q${r1(cx + r + r * 0.23)} ${r1(cy + r * 0.9)} ${r1(cx + r - r * 0.05)} ${r1(cy + r * 1.36)}`, w: w * 0.7 },
    ];
}

// ─── SVG emitter ────────────────────────────────────────────────────────────

/** Absolute-arc `d` string for an arc primitive. */
function arcD(x: number, y: number, r: number, a0: number, a1: number): string {
    const x0 = x + Math.cos(a0) * r, y0 = y + Math.sin(a0) * r;
    const x1 = x + Math.cos(a1) * r, y1 = y + Math.sin(a1) * r;
    const large = Math.abs(a1 - a0) > P ? 1 : 0;
    return `M${r1(x0)} ${r1(y0)}A${r1(r)} ${r1(r)} 0 ${large} 1 ${r1(x1)} ${r1(y1)}`;
}

/** One primitive as SVG markup (role/paint applied by the caller's `<g>`). */
function primToSvg(p: FacePrim): string {
    switch (p.k) {
        // A solid disc drawn with the STROKE (half-radius circle, full-radius pen)
        // so a pupil recolours with the outline instead of needing its own fill.
        case 'dot':
            return `<circle cx="${r1(p.x)}" cy="${r1(p.y)}" r="${r1(p.r / 2)}" stroke-width="${r1(p.r)}"/>`;
        case 'ring':
            return `<circle cx="${r1(p.x)}" cy="${r1(p.y)}" r="${r1(p.r)}" stroke-width="${r1(p.w)}"${p.fill ? ` fill="${p.fill}"` : ''}/>`;
        case 'oval':
            return `<ellipse cx="${r1(p.x)}" cy="${r1(p.y)}" rx="${r1(p.rx)}" ry="${r1(p.ry)}" stroke-width="${r1(p.w)}"${p.fill ? ` fill="${p.fill}"` : ''}/>`;
        case 'arc':
            return `<path d="${arcD(p.x, p.y, p.r, p.a0, p.a1)}" stroke-width="${r1(p.w)}"/>`;
        case 'poly':
            return `<path d="M${p.pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L')}" stroke-width="${r1(p.w)}"/>`;
        case 'path':
            return `<path d="${p.d}" stroke-width="${r1(p.w)}"${p.fill ? ` fill="${p.fill}"` : ''}/>`;
    }
}

/**
 * Face + hair as role-tagged SVG markup for a head circle at `(cx, cy, r)`.
 * Hair is emitted first so the face sits on top; both groups carry a
 * `data-sf-role` so the importer tags every generated part (see `svg-import`,
 * where `data-sf-role` inherits down the tree).
 *
 * Filled dots (pupils) are emitted as heavily-stroked half-radius circles rather
 * than fills, so they follow an outline recolour like every other face mark.
 */
export function faceHairSvg(cx: number, cy: number, r: number, o: FaceOpts = {}): string {
    const hair = hairGeometry(cx, cy, r, o).map(primToSvg).join('');
    const face = faceGeometry(cx, cy, r, o).map(primToSvg).join('');
    return (hair ? `<g data-sf-role="hair">${hair}</g>` : '')
        + (face ? `<g data-sf-role="face">${face}</g>` : '');
}

/**
 * Attributes recording which face/hair a head circle currently wears, stamped on
 * the `data-sf-role="head"` element. They let `applyFaceHair` restyle only what
 * the caller asked for and leave the rest ("auto") exactly as authored — and let
 * the Properties panel show a dropped figure's current expression.
 */
export function faceStateAttrs(o: FaceOpts = {}): string {
    return ` data-sf-face="${asFaceStyle(o.face, 'none')}" data-sf-hair="${asHairStyle(o.hair, 'none')}"`
        + ` data-sf-hair-color="${o.hairColor || DEFAULT_HAIR_COLOR}"`;
}
