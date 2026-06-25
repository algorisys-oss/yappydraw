/**
 * Distort & Transform effects (Illustrator's Effect → Distort & Transform family,
 * which also covers the intent of the Liquify brushes). Each takes a world-space
 * polygon (outer ring + holes) and returns a distorted polygon, operating around the
 * outer ring's centroid. Deterministic — no Math.random — so results are reproducible.
 */

import type { Poly, Ring } from './path-boolean';

type Pt = [number, number];
export type DistortKind = 'pucker' | 'bloat' | 'twirl' | 'zigzag' | 'crystallize' | 'roughen';

const centroid = (ring: Ring): Pt => {
    let x = 0, y = 0; const n = ring.length;
    for (const p of ring) { x += p[0]; y += p[1]; }
    return [x / n, y / n];
};

const bboxDiag = (ring: Ring): number => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of ring) { if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y; }
    return Math.hypot(maxX - minX, maxY - minY) || 1;
};

// Deterministic pseudo-random in [-1,1] from an integer index (hash).
const rand = (i: number): number => {
    const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
};

// Resample a closed ring so no segment is longer than `step`, returning corner points.
const densify = (ring: Ring, step: number): Ring => {
    const out: Ring = [];
    for (let i = 0; i < ring.length - 1; i++) {
        const a = ring[i], b = ring[i + 1];
        const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const segs = Math.max(1, Math.round(d / step));
        for (let s = 0; s < segs; s++) {
            const t = s / segs;
            out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        }
    }
    out.push([out[0][0], out[0][1]]); // close
    return out;
};

function distortRing(ring: Ring, c: Pt, D: number, kind: DistortKind, amount: number): Ring {
    if (ring.length < 4) return ring;
    const A = amount * D; // linear amplitude in world units

    if (kind === 'twirl') {
        const Rmax = Math.max(...ring.map(p => Math.hypot(p[0] - c[0], p[1] - c[1]))) || 1;
        const maxAng = amount * Math.PI * 2; // full turn at amount=1
        return ring.map(p => {
            const dx = p[0] - c[0], dy = p[1] - c[1], r = Math.hypot(dx, dy);
            const ang = maxAng * (1 - r / Rmax);
            const cs = Math.cos(ang), sn = Math.sin(ang);
            return [c[0] + dx * cs - dy * sn, c[1] + dx * sn + dy * cs] as Pt;
        });
    }

    if (kind === 'pucker' || kind === 'bloat') {
        // Keep original vertices; push each edge midpoint radially (in = pucker, out = bloat).
        const sign = kind === 'bloat' ? 1 : -1;
        const out: Ring = [];
        for (let i = 0; i < ring.length - 1; i++) {
            const a = ring[i], b = ring[i + 1];
            out.push([a[0], a[1]]);
            const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
            const dx = mx - c[0], dy = my - c[1], r = Math.hypot(dx, dy) || 1;
            out.push([mx + (dx / r) * A * sign, my + (dy / r) * A * sign]);
        }
        out.push([out[0][0], out[0][1]]);
        return out;
    }

    // ridge/perturbation effects operate on a densified ring
    const dense = densify(ring, Math.max(4, D / 48));
    if (kind === 'zigzag' || kind === 'crystallize') {
        return dense.map((p, i) => {
            const dx = p[0] - c[0], dy = p[1] - c[1], r = Math.hypot(dx, dy) || 1;
            // zigzag: alternate ±A; crystallize: spikes outward only on every other point
            const f = kind === 'zigzag' ? (i % 2 === 0 ? A : -A) : (i % 2 === 0 ? A * 1.4 : 0);
            return [p[0] + (dx / r) * f, p[1] + (dy / r) * f] as Pt;
        });
    }
    // roughen — random radial + tangential jitter
    return dense.map((p, i) => {
        if (i === dense.length - 1) return [dense[0][0], dense[0][1]] as Pt;
        const dx = p[0] - c[0], dy = p[1] - c[1], r = Math.hypot(dx, dy) || 1;
        const nx = dx / r, ny = dy / r;        // radial
        const tx = -ny, ty = nx;               // tangential
        const rr = rand(i) * A, rt = rand(i + 9973) * A * 0.6;
        return [p[0] + nx * rr + tx * rt, p[1] + ny * rr + ty * rt] as Pt;
    });
}

/** Distort a whole polygon (outer ring + holes) around the outer ring's centroid. */
export function distortPoly(poly: Poly, kind: DistortKind, amount: number): Poly {
    if (!poly.length || !poly[0] || poly[0].length < 4) return poly;
    const c = centroid(poly[0]);
    const D = bboxDiag(poly[0]);
    return poly.map(ring => distortRing(ring, c, D, kind, amount));
}
