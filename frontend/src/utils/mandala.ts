/**
 * mandala — parametric mandala geometry.
 *
 * Pure maths: a spec in, a list of closed outlines out. No store, no DOM, no rendering,
 * so it unit-tests directly and the same builder serves the dialog's live preview, the
 * `createMandala` API and any future re-editable mandala object.
 *
 * A mandala is a stack of concentric **bands**, each holding `count` copies of one motif
 * repeated around the centre. Two invariants make the output read as a mandala rather
 * than as a pinwheel, and both are enforced by tests:
 *
 *   1. Every motif is **bilaterally symmetric about its own spoke** — the same property
 *      `kaleidoscope` symmetry gives hand-drawn work, so generated and hand-finished
 *      parts of one drawing agree.
 *   2. Every point of a band stays inside `[rInner, rOuter]`, so bands never bleed into
 *      each other and the result is colourable.
 *
 * Motifs are built in a canonical frame — centred on the **+x axis**, spanning the band
 * radially — and then rotated into place. Building them anywhere else is what makes
 * per-motif symmetry accidental instead of structural.
 */

import type { PathAnchor } from '../types';

export type MandalaMotifId =
    | 'petal' | 'lotus' | 'teardrop' | 'diamond' | 'dot'
    | 'arc' | 'scallop' | 'spike' | 'ring';

export interface MandalaRing {
    motif: MandalaMotifId;
    /** Copies around the centre. Ignored by `ring`, which is a single outline. */
    count: number;
    rInner: number;
    rOuter: number;
    /** Rotation of this band, in degrees. Offsets one band against its neighbours. */
    phase: number;
    /** Angular fatness of the motif, 0..1 of its available wedge. */
    width: number;
}

export interface MandalaSpec {
    cx: number;
    cy: number;
    rings: MandalaRing[];
}

export interface MandalaPath {
    anchors: PathAnchor[];
    closed: boolean;
}

export const MANDALA_MOTIFS: { id: MandalaMotifId; label: string; hint: string }[] = [
    { id: 'petal', label: 'Petal', hint: 'Pointed leaf — the classic mandala band' },
    { id: 'lotus', label: 'Lotus', hint: 'Rounded petal with a waisted base' },
    { id: 'teardrop', label: 'Teardrop', hint: 'Round outer end tapering to a point inward' },
    { id: 'diamond', label: 'Diamond', hint: 'Four-point kite' },
    { id: 'dot', label: 'Dot', hint: 'Circle — beads and rosettes' },
    { id: 'arc', label: 'Arc', hint: 'Curved band segment, like roof tiles' },
    { id: 'scallop', label: 'Scallop', hint: 'Shell fan, wide at the outer edge' },
    { id: 'spike', label: 'Spike', hint: 'Narrow triangle — rays and sunbursts' },
    { id: 'ring', label: 'Ring', hint: 'A single concentric circle (divider)' },
];

export const defaultMandalaSpec = (): MandalaSpec => ({
    cx: 0,
    cy: 0,
    rings: MANDALA_PRESETS[0].rings.map(r => ({ ...r })),
});

/** Outer radius of the whole design — what the dialog reports and the fit uses. */
export function ringOuterRadius(spec: MandalaSpec): number {
    let max = 0;
    for (const r of spec.rings) max = Math.max(max, r.rOuter);
    return max;
}

const TAU = Math.PI * 2;
const smooth = (x: number, y: number): PathAnchor => ({ x, y, kind: 'smooth' });
const corner = (x: number, y: number): PathAnchor => ({ x, y, kind: 'corner' });

/**
 * A motif in its canonical frame: polar points (radius, angle-offset-from-spoke).
 *
 * Returned as [r, a] pairs where `a` is signed radians either side of the spoke. Every
 * motif is written so the list is symmetric in `a` — build the +a half and mirror it —
 * which is how invariant (1) above becomes structural rather than something to remember.
 */
type PolarPoint = [r: number, a: number];

/** Mirror the strictly-positive half of a profile to produce a closed, symmetric outline. */
function mirrorProfile(half: PolarPoint[]): PolarPoint[] {
    const out: PolarPoint[] = [...half];
    for (let i = half.length - 1; i >= 0; i--) {
        const [r, a] = half[i];
        if (Math.abs(a) < 1e-12) continue;   // on-axis points belong to both halves
        out.push([r, -a]);
    }
    return out;
}

/**
 * Build one motif's outline in polar form.
 *
 * `half` is the maximum angular half-width available to this motif; the shapes stay
 * inside it so neighbours never collide.
 */
function motifProfile(motif: MandalaMotifId, rInner: number, rOuter: number, half: number): PolarPoint[] {
    const span = rOuter - rInner;
    const mid = rInner + span / 2;

    switch (motif) {
        case 'petal': {
            // Tip on-axis at rOuter, base on-axis at rInner, belly at the middle.
            const up: PolarPoint[] = [[rInner, 0]];
            for (let i = 1; i <= 6; i++) {
                const t = i / 7;
                up.push([rInner + span * t, half * Math.sin(Math.PI * t)]);
            }
            up.push([rOuter, 0]);
            return mirrorProfile(up);
        }
        case 'lotus': {
            // Like a petal but waisted near the base and blunter at the tip.
            const up: PolarPoint[] = [[rInner, 0]];
            for (let i = 1; i <= 8; i++) {
                const t = i / 9;
                const fat = Math.pow(Math.sin(Math.PI * t), 0.65) * (0.55 + 0.45 * t);
                up.push([rInner + span * t, half * fat]);
            }
            up.push([rOuter, 0]);
            return mirrorProfile(up);
        }
        case 'teardrop': {
            // Point inward, round outward: a circle at the outer end tapering to rInner.
            const up: PolarPoint[] = [[rInner, 0]];
            for (let i = 1; i <= 8; i++) {
                const t = i / 9;
                up.push([rInner + span * t, half * Math.pow(t, 0.75)]);
            }
            up.push([rOuter, 0]);
            return mirrorProfile(up);
        }
        case 'diamond':
            return mirrorProfile([[rInner, 0], [mid, half], [rOuter, 0]]);
        case 'spike':
            return mirrorProfile([[rInner, half], [rOuter, 0]]);
        case 'dot': {
            // A circle inscribed in the band, centred at `mid` on the spoke. Its angular
            // extent is capped by `half` so beads never touch.
            const rad = Math.min(span / 2, mid * Math.sin(half));
            const up: PolarPoint[] = [];
            for (let i = 0; i <= 10; i++) {
                const th = (i / 10) * Math.PI;                 // 0..π traces one side
                const px = mid + rad * Math.cos(th);
                const py = rad * Math.sin(th);
                up.push([Math.hypot(px, py), Math.atan2(py, px)]);
            }
            return mirrorProfile(up);
        }
        case 'arc': {
            // A band segment: outer sweep out, inner sweep back. Reads as roof tiles.
            const out: PolarPoint[] = [];
            const steps = 8;
            for (let i = 0; i <= steps; i++) out.push([rOuter, -half + (2 * half * i) / steps]);
            for (let i = steps; i >= 0; i--) out.push([rInner + span * 0.45, -half + (2 * half * i) / steps]);
            return out;   // already symmetric by construction
        }
        case 'scallop': {
            // Fan: narrow at the base, a rounded shell at the outer edge.
            const up: PolarPoint[] = [[rInner, 0]];
            for (let i = 1; i <= 6; i++) {
                const t = i / 6;
                up.push([rInner + span * (0.35 + 0.65 * t), half * Math.pow(t, 0.5)]);
            }
            return mirrorProfile(up);
        }
        case 'ring': {
            // Handled by the caller (one outline, not `count`); the profile is a full circle.
            const out: PolarPoint[] = [];
            for (let i = 0; i < 48; i++) out.push([rOuter, (i / 48) * TAU]);
            return out;
        }
    }
}

/** Motifs whose outline is one shape for the whole band rather than `count` copies. */
const SINGLETON_MOTIFS: ReadonlySet<MandalaMotifId> = new Set<MandalaMotifId>(['ring']);

/** Corner-cornered motifs — straight-edged shapes look wrong smoothed. */
const ANGULAR_MOTIFS: ReadonlySet<MandalaMotifId> = new Set<MandalaMotifId>(['diamond', 'spike']);

/**
 * Turn a spec into closed outlines in world coordinates.
 *
 * Rings with nothing to draw (count < 1, or an inverted/empty radial band) are skipped
 * rather than throwing — the dialog's sliders pass through those states while you drag.
 */
export function buildMandala(spec: MandalaSpec): MandalaPath[] {
    const out: MandalaPath[] = [];

    for (const ring of spec.rings) {
        const rInner = Math.max(0, ring.rInner);
        const rOuter = ring.rOuter;
        if (!(rOuter > rInner)) continue;

        const singleton = SINGLETON_MOTIFS.has(ring.motif);
        const count = singleton ? 1 : Math.floor(ring.count);
        if (count < 1) continue;

        // Available wedge per copy, minus a small gap so neighbours don't fuse. `width`
        // scales inside that, so width=1 is "as fat as fits" rather than "overlapping".
        const wedge = TAU / Math.max(1, singleton ? 1 : count);
        const half = (wedge / 2) * 0.92 * Math.min(1, Math.max(0.05, ring.width));

        const profile = motifProfile(ring.motif, rInner, rOuter, half);
        if (profile.length < 3) continue;

        const kind = ANGULAR_MOTIFS.has(ring.motif) ? corner : smooth;
        const phase = (ring.phase * Math.PI) / 180;

        for (let k = 0; k < count; k++) {
            const spoke = phase + (singleton ? 0 : (k / count) * TAU);
            const anchors = profile.map(([r, a]) => {
                const ang = spoke + a;
                return kind(spec.cx + r * Math.cos(ang), spec.cy + r * Math.sin(ang));
            });
            out.push({ anchors, closed: true });
        }
    }

    return out;
}

export interface MandalaPreset {
    id: string;
    name: string;
    hint: string;
    rings: MandalaRing[];
}

/**
 * Ready-made designs, so "I need a colouring page" is one click rather than twenty
 * slider drags. Bands are laid out edge-to-edge and never overlap radially (asserted in
 * the tests) — overlapping bands are what makes generated mandalas look muddy.
 */
export const MANDALA_PRESETS: MandalaPreset[] = [
    {
        id: 'simple', name: 'Simple 8', hint: 'Four clean bands — a good first colouring page',
        rings: [
            { motif: 'dot', count: 1, rInner: 0, rOuter: 26, phase: 0, width: 1 },
            { motif: 'petal', count: 8, rInner: 30, rOuter: 100, phase: 0, width: 0.75 },
            { motif: 'ring', count: 1, rInner: 100, rOuter: 108, phase: 0, width: 1 },
            { motif: 'lotus', count: 16, rInner: 110, rOuter: 190, phase: 11.25, width: 0.8 },
        ],
    },
    {
        id: 'lotus', name: 'Lotus 12', hint: 'Layered rounded petals, bloom-like',
        rings: [
            { motif: 'dot', count: 6, rInner: 12, rOuter: 44, phase: 0, width: 0.85 },
            { motif: 'lotus', count: 12, rInner: 46, rOuter: 112, phase: 0, width: 0.8 },
            { motif: 'lotus', count: 12, rInner: 112, rOuter: 178, phase: 15, width: 0.85 },
            { motif: 'scallop', count: 24, rInner: 180, rOuter: 226, phase: 0, width: 0.9 },
        ],
    },
    {
        id: 'lace', name: 'Lace 24', hint: 'Dense fine bands — lots of small areas to colour',
        rings: [
            { motif: 'dot', count: 1, rInner: 0, rOuter: 20, phase: 0, width: 1 },
            { motif: 'spike', count: 24, rInner: 22, rOuter: 66, phase: 0, width: 0.7 },
            { motif: 'ring', count: 1, rInner: 66, rOuter: 72, phase: 0, width: 1 },
            { motif: 'teardrop', count: 24, rInner: 74, rOuter: 132, phase: 7.5, width: 0.75 },
            { motif: 'dot', count: 48, rInner: 134, rOuter: 158, phase: 0, width: 0.9 },
            { motif: 'arc', count: 24, rInner: 160, rOuter: 206, phase: 7.5, width: 0.95 },
        ],
    },
    {
        id: 'star', name: 'Star 16', hint: 'Angular rays alternating with diamonds',
        rings: [
            { motif: 'diamond', count: 8, rInner: 0, rOuter: 48, phase: 0, width: 0.8 },
            { motif: 'spike', count: 16, rInner: 50, rOuter: 128, phase: 0, width: 0.55 },
            { motif: 'diamond', count: 16, rInner: 130, rOuter: 182, phase: 11.25, width: 0.7 },
            { motif: 'ring', count: 1, rInner: 182, rOuter: 190, phase: 0, width: 1 },
        ],
    },
    {
        id: 'rosette', name: 'Rosette 6', hint: 'Six-fold, roomy shapes for younger colourists',
        rings: [
            { motif: 'dot', count: 1, rInner: 0, rOuter: 34, phase: 0, width: 1 },
            { motif: 'petal', count: 6, rInner: 36, rOuter: 124, phase: 0, width: 0.85 },
            { motif: 'teardrop', count: 12, rInner: 126, rOuter: 200, phase: 15, width: 0.8 },
        ],
    },
];
