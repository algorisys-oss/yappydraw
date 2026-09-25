/**
 * Seeded randomness for doodles.
 *
 * Everything a doodle does that looks random is driven from its `seed`, never from
 * `Math.random()`: "same seed + same knobs = the same doodle" is what lets a doodle be
 * stored as a small spec and rebuilt later — re-opened for editing, or regenerated at a
 * new size — without it turning into a different drawing.
 */

export type Rng = () => number;

/** mulberry32 — tiny, fast, and good enough for picking tile orientations. [0,1). */
export function makeRng(seed: number): Rng {
    let a = (seed >>> 0) || 0x9e3779b9;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** In-place Fisher–Yates with a seeded source. */
export function shuffle<T>(arr: T[], rng: Rng): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * 2D Perlin gradient noise, seeded. Returns roughly [-1, 1], smooth everywhere, which is
 * what flow fields (angles) and contour maps (heights) both need — value noise has
 * visible grid-aligned creases that turn into kinks in the contour lines.
 */
export function makeNoise2D(rng: Rng): (x: number, y: number) => number {
    const perm = new Uint8Array(512);
    const p = shuffle(Array.from({ length: 256 }, (_, i) => i), rng);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

    // 8 unit-ish gradients; the diagonals are scaled so every direction has the same reach.
    const GX = [1, -1, 1, -1, Math.SQRT1_2 * 1.4, -Math.SQRT1_2 * 1.4, 0, 0];
    const GY = [0, 0, 1, -1, Math.SQRT1_2 * 1.4, Math.SQRT1_2 * 1.4, 1, -1];
    const grad = (h: number, x: number, y: number) => GX[h & 7] * x + GY[h & 7] * y;
    const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

    return (x: number, y: number) => {
        const xi = Math.floor(x), yi = Math.floor(y);
        const xf = x - xi, yf = y - yi;
        const X = xi & 255, Y = yi & 255;
        const aa = perm[perm[X] + Y], ab = perm[perm[X] + Y + 1];
        const ba = perm[perm[X + 1] + Y], bb = perm[perm[X + 1] + Y + 1];
        const u = fade(xf), v = fade(yf);
        const x1 = grad(aa, xf, yf) + u * (grad(ba, xf - 1, yf) - grad(aa, xf, yf));
        const x2 = grad(ab, xf, yf - 1) + u * (grad(bb, xf - 1, yf - 1) - grad(ab, xf, yf - 1));
        return x1 + v * (x2 - x1);
    };
}

/** Fractal (fBm) noise: `octaves` layers of noise, each twice the frequency, half the weight. */
export function fbm(noise: (x: number, y: number) => number, x: number, y: number, octaves: number): number {
    let sum = 0, amp = 1, freq = 1, norm = 0;
    for (let o = 0; o < octaves; o++) {
        // Offset each octave so their lattices don't line up and reinforce each other.
        sum += amp * noise(x * freq + o * 17.31, y * freq + o * 9.73);
        norm += amp;
        amp *= 0.5;
        freq *= 2;
    }
    return sum / norm;
}
