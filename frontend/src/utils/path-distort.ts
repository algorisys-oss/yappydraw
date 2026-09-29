/**
 * Distort & Transform effects (Illustrator's Effect → Distort & Transform family, which also
 * covers the intent of the Liquify brushes). Each takes a world-space polygon (outer ring +
 * holes) and returns a distorted polygon. Deterministic — seeded, no Math.random — so a preview
 * and the committed result are identical, and a script gets the same shape every time.
 *
 * Parameters follow Illustrator's dialogs (see DistortParams). Sizes are ABSOLUTE world px, not
 * a fraction of the shape: the old fraction-of-diagonal amplitude, laid on a point every ~4px,
 * turned Roughen into fuzz and Zig-Zag into a solid band on anything large (Anshika, Sep 2026).
 */

import type { Poly, Ring } from './path-boolean';

type Pt = [number, number];
export type DistortKind = 'pucker' | 'bloat' | 'twirl' | 'zigzag' | 'crystallize' | 'roughen';

export interface DistortParams {
    /** Pucker & Bloat: −100…100 %. Negative puckers (edges pulled in), positive bloats. */
    amount?: number;
    /** Twirl: degrees at the centre, fading to 0 at the rim. */
    angle?: number;
    /** Zig-Zag / Roughen / Crystallize: displacement in world px. */
    size?: number;
    /** Zig-Zag: ridges per original segment. */
    ridges?: number;
    /** Roughen / Crystallize: displaced points per 100 px of outline. */
    detail?: number;
    /** Result anchors: 'smooth' curves through the points, 'corner' keeps them sharp. */
    points?: 'smooth' | 'corner';
    /** Roughen / Crystallize: variation seed. */
    seed?: number;
}

/** Defaults for a shape of diagonal `D` — what the dialog opens with and the API falls back to. */
export function defaultDistortParams(kind: DistortKind, D: number): Required<DistortParams> {
    const base = { amount: 0, angle: 0, size: 0, ridges: 4, detail: 10, points: 'corner' as const, seed: 1 };
    switch (kind) {
        case 'pucker': return { ...base, amount: -40 };
        case 'bloat': return { ...base, amount: 40, points: 'smooth' };
        case 'twirl': return { ...base, angle: 90 };
        case 'zigzag': return { ...base, size: round1(D * 0.03), ridges: 4 };
        case 'roughen': return { ...base, size: round1(D * 0.02), detail: 10, points: 'smooth' };
        case 'crystallize': return { ...base, size: round1(D * 0.04), detail: 6 };
    }
}

const round1 = (n: number) => Math.max(1, Math.round(n * 10) / 10);

/**
 * The pre-dialog API took one `amount` per kind as a fraction of the shape's diagonal. Map it to
 * the nearest new parameters so `Yappy.distort('twirl', 0.25)` still means "a quarter turn".
 */
export function legacyDistortParams(kind: DistortKind, amount: number, D: number): DistortParams {
    switch (kind) {
        case 'pucker': return { amount: -Math.abs(amount) * 200 };
        case 'bloat': return { amount: Math.abs(amount) * 200 };
        case 'twirl': return { angle: amount * 360 };
        case 'zigzag': return { size: amount * D * 0.5, ridges: 4 };
        case 'roughen': return { size: amount * D * 0.3, detail: 10 };
        case 'crystallize': return { size: amount * D * 0.5, detail: 6 };
    }
}

/** Vertices without the repeated closing point (rings are stored closed: last === first). */
const open = (ring: Ring): Pt[] => {
    const n = ring.length;
    if (n > 1 && ring[0][0] === ring[n - 1][0] && ring[0][1] === ring[n - 1][1]) return ring.slice(0, n - 1) as Pt[];
    return ring.slice() as Pt[];
};
const close = (pts: Pt[]): Ring => (pts.length ? [...pts, [pts[0][0], pts[0][1]]] : []) as Ring;

/**
 * Centroid of the VERTICES, each counted once. Averaging the stored ring counted the closing
 * duplicate twice, which pulled the centre toward the first corner — on a square, from (50,50) to
 * (40,40) — and skewed every radial effect.
 */
export const ringCentroid = (ring: Ring): Pt => {
    const pts = open(ring);
    let x = 0, y = 0;
    for (const p of pts) { x += p[0]; y += p[1]; }
    return [x / (pts.length || 1), y / (pts.length || 1)];
};

export const ringDiagonal = (ring: Ring): number => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of ring) { if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y; }
    return Math.hypot(maxX - minX, maxY - minY) || 1;
};

/** Seeded pseudo-random in [-1, 1]. */
const rand = (i: number, seed: number): number => {
    const s = Math.sin(i * 12.9898 + seed * 78.233 + 0.5) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
};

/** Signed area; the sign gives the winding, which fixes which side "outward" is. */
const signedArea = (pts: Pt[]): number => {
    let a = 0;
    for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
    return a / 2;
};

/** Points along the closed outline, no gap longer than `step`, original vertices kept. */
const resample = (pts: Pt[], step: number): { p: Pt; seg: number; t: number }[] => {
    const out: { p: Pt; seg: number; t: number }[] = [];
    for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
        for (let s = 0; s < n; s++) {
            const t = s / n;
            out.push({ p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], seg: i, t });
        }
    }
    return out;
};

/** Unit outward normal of segment i (outward from the ring's own winding). */
const segNormal = (pts: Pt[], i: number, outward: number): Pt => {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    return [(dy / L) * outward, (-dx / L) * outward];
};

function distortRing(ring: Ring, c: Pt, D: number, kind: DistortKind, prm: Required<DistortParams>): Ring {
    const pts = open(ring);
    if (pts.length < 3) return ring;
    // (dy, -dx) is the outward normal when the shoelace area is positive in these y-down
    // coordinates (the top edge of a square traced (0,0)→(100,0) gets (0,-1): up, i.e. out).
    const outward = signedArea(pts) > 0 ? 1 : -1;

    if (kind === 'twirl') {
        // Densify first: a rectangle's four corners all sit at the maximum radius, where the
        // twist fades to zero, so twirling the bare vertices did nothing visible.
        const dense = resample(pts, Math.max(2, D / 96)).map(s => s.p);
        const Rmax = Math.max(...dense.map(p => Math.hypot(p[0] - c[0], p[1] - c[1]))) || 1;
        const maxAng = (prm.angle * Math.PI) / 180;
        return close(dense.map(p => {
            const dx = p[0] - c[0], dy = p[1] - c[1], r = Math.hypot(dx, dy);
            const f = 1 - r / Rmax;
            const ang = maxAng * f * f * (3 - 2 * f); // smoothstep: strongest at the centre
            const cs = Math.cos(ang), sn = Math.sin(ang);
            return [c[0] + dx * cs - dy * sn, c[1] + dx * sn + dy * cs] as Pt;
        }));
    }

    if (kind === 'pucker' || kind === 'bloat') {
        // Keep the vertices; push the middle of each edge along its outward normal (bloat) or
        // inward (pucker), proportional to the edge length so big and small edges bend alike.
        const k = Math.max(-100, Math.min(100, prm.amount)) / 100;
        const out: Pt[] = [];
        for (let i = 0; i < pts.length; i++) {
            const a = pts[i], b = pts[(i + 1) % pts.length];
            const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
            const nrm = segNormal(pts, i, outward);
            out.push(a);
            for (const t of [0.25, 0.5, 0.75]) {
                const bulge = Math.sin(Math.PI * t) * k * L * 0.5;
                out.push([a[0] + (b[0] - a[0]) * t + nrm[0] * bulge, a[1] + (b[1] - a[1]) * t + nrm[1] * bulge]);
            }
        }
        return close(out);
    }

    if (kind === 'zigzag') {
        // `ridges` peaks per original segment, alternating sides of that segment (not radially,
        // which leaned every ridge toward the centre).
        const ridges = Math.max(1, Math.round(prm.ridges));
        const out: Pt[] = [];
        let side = 1;
        for (let i = 0; i < pts.length; i++) {
            const a = pts[i], b = pts[(i + 1) % pts.length];
            const nrm = segNormal(pts, i, outward);
            out.push(a);
            for (let r = 1; r <= ridges * 2 - 1; r += 2) {
                const t = r / (ridges * 2);
                out.push([a[0] + (b[0] - a[0]) * t + nrm[0] * prm.size * side, a[1] + (b[1] - a[1]) * t + nrm[1] * prm.size * side]);
                side = -side;
            }
        }
        return close(out);
    }

    // Roughen / Crystallize: `detail` points per 100 px, displaced by up to `size`.
    const step = 100 / Math.max(0.5, prm.detail);
    const samples = resample(pts, step);
    return close(samples.map(({ p, seg }, i) => {
        const nrm = segNormal(pts, seg, outward);
        if (kind === 'crystallize') {
            // Spikes out on every other point, as in Illustrator's Crystallize.
            const f = i % 2 === 0 ? prm.size * (0.6 + 0.4 * Math.abs(rand(i, prm.seed))) : 0;
            return [p[0] + nrm[0] * f, p[1] + nrm[1] * f] as Pt;
        }
        const rn = rand(i, prm.seed) * prm.size, rt = rand(i + 9973, prm.seed) * prm.size * 0.5;
        return [p[0] + nrm[0] * rn - nrm[1] * rt, p[1] + nrm[1] * rn + nrm[0] * rt] as Pt;
    }));
}

/**
 * Distort a whole polygon (outer ring + holes) around the outer ring's centroid.
 * `params` may be partial; missing values take the defaults for this kind and size.
 */
export function distortPoly(poly: Poly, kind: DistortKind, params: DistortParams = {}): Poly {
    if (!poly.length || !poly[0] || poly[0].length < 4) return poly;
    const c = ringCentroid(poly[0]);
    const D = ringDiagonal(poly[0]);
    const prm = { ...defaultDistortParams(kind, D), ...stripUndefined(params) };
    return poly.map(ring => distortRing(ring, c, D, kind, prm));
}

const stripUndefined = <T extends object>(o: T): Partial<T> =>
    Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
