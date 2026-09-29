/**
 * Distort effects with Illustrator-style parameters. The cases are the ones Anshika's review
 * reported: Twirl and Zig-Zag doing nothing visible on a rectangle, Roughen far too strong, and
 * (found reproducing those) a centroid pulled off-centre by the ring's closing point.
 */
import { describe, it, expect } from 'bun:test';
import { distortPoly, ringCentroid, legacyDistortParams, defaultDistortParams } from './path-distort';

const square: any = [[[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]];
// Same square wound the other way — "outward" must not depend on the winding.
const squareCW: any = [[[0, 0], [0, 100], [100, 100], [100, 0], [0, 0]]];
const ring = (p: any) => p[0] as [number, number][];
/** How far a point sits outside the square (negative = inside, by its distance to the edge). */
const outside = ([x, y]: [number, number]) => {
    const dx = Math.max(-x, x - 100, 0), dy = Math.max(-y, y - 100, 0);
    if (dx || dy) return Math.hypot(dx, dy);
    return -Math.min(x, 100 - x, y, 100 - y);
};

describe('centroid', () => {
    it('counts each vertex once (the closing point used to pull it to 40,40)', () => {
        expect(ringCentroid(square[0])).toEqual([50, 50]);
    });
});

describe('twirl', () => {
    it('actually bends a rectangle: points leave the square, edges stop being straight', () => {
        const out = ring(distortPoly(square, 'twirl', { angle: 90 }));
        expect(out.length).toBeGreaterThan(40);                      // densified
        expect(out.some(p => Math.abs(outside(p)) > 5)).toBe(true);  // edge midpoints moved
        const corner = out.find(p => Math.hypot(p[0] - 100, p[1] - 100) < 1e-6);
        expect(corner).toBeDefined();                                 // corners (at the rim) stay
    });
    it('0° is the identity', () => {
        for (const p of ring(distortPoly(square, 'twirl', { angle: 0 }))) expect(Math.abs(outside(p))).toBeLessThan(1e-9);
    });
});

describe('pucker & bloat', () => {
    for (const [name, sq] of [['CCW', square], ['CW', squareCW]] as const) {
        it(`bloat pushes edges OUT and pucker pulls them IN (${name} winding)`, () => {
            const b = ring(distortPoly(sq, 'bloat', { amount: 50 }));
            const p = ring(distortPoly(sq, 'pucker', { amount: -50 }));
            expect(Math.max(...b.map(outside))).toBeCloseTo(25, 6);     // L·k/2 at mid-edge
            expect(Math.min(...p.map(outside))).toBeCloseTo(-25, 6);
            expect(Math.max(...p.map(outside))).toBeLessThan(1e-9);      // pucker never exits
        });
    }
});

describe('zig-zag', () => {
    it('puts `ridges` peaks per edge at ±size, alternating sides', () => {
        const out = ring(distortPoly(square, 'zigzag', { size: 8, ridges: 3 }));
        expect(out.length).toBe(4 * (1 + 3) + 1);                     // vertex + 3 ridges per edge, closed
        const offs = out.slice(1, 4).map(outside);                   // the first edge's ridges
        expect(offs.map(v => Math.round(Math.abs(v)))).toEqual([8, 8, 8]);
        expect(Math.sign(offs[0])).toBe(-Math.sign(offs[1]));
    });
});

describe('roughen & crystallize', () => {
    it('roughen stays within size (the old default wandered ~14% of the diagonal)', () => {
        const out = ring(distortPoly(square, 'roughen', { size: 4, detail: 10 }));
        expect(Math.max(...out.map(p => Math.abs(outside(p))))).toBeLessThanOrEqual(4 * Math.SQRT2 + 1e-9);
        expect(out.length).toBeGreaterThanOrEqual(40);                // 10 per 100 px × 400 px
    });
    it('is deterministic per seed, and a new seed gives a new shape', () => {
        const a = distortPoly(square, 'roughen', { size: 4, seed: 1 });
        expect(distortPoly(square, 'roughen', { size: 4, seed: 1 })).toEqual(a);
        expect(distortPoly(square, 'roughen', { size: 4, seed: 2 })).not.toEqual(a);
    });
    it('crystallize only spikes outward', () => {
        const out = ring(distortPoly(square, 'crystallize', { size: 6, detail: 8 }));
        expect(Math.min(...out.map(outside))).toBeGreaterThan(-1e-9);
        expect(Math.max(...out.map(outside))).toBeGreaterThan(3);
    });
});

describe('parameters', () => {
    it('defaults scale with the shape, so small and large shapes both get a sensible first look', () => {
        expect(defaultDistortParams('zigzag', 100).size).toBeLessThan(defaultDistortParams('zigzag', 1000).size);
    });
    it('the old single-amount API still maps (twirl 0.25 = a quarter turn)', () => {
        expect(legacyDistortParams('twirl', 0.25, 141)).toEqual({ angle: 90 });
        expect(legacyDistortParams('pucker', 0.25, 141).amount).toBe(-50);
    });
});
