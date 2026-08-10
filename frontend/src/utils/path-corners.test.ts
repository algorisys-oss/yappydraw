import { describe, it, expect } from 'bun:test';
import { filletAnchors, hasLiveCorners, maxCornerRadius } from './path-corners';
import { anchorsToPathData } from './math/path-utils';
import type { PathAnchor } from '../types';

const A = (x: number, y: number, cornerRadius?: number): PathAnchor =>
    cornerRadius === undefined ? { x, y, kind: 'corner' } : { x, y, kind: 'corner', cornerRadius };

/** 100×100 square, clockwise from the origin. */
const square = (r?: number) => [A(0, 0, r), A(100, 0, r), A(100, 100, r), A(0, 100, r)];

/** Evaluate the cubic between two output anchors at `t`. */
const at = (a: PathAnchor, b: PathAnchor, t: number) => {
    const p0 = { x: a.x, y: a.y };
    const c1 = { x: a.x + (a.outX ?? 0), y: a.y + (a.outY ?? 0) };
    const c2 = { x: b.x + (b.inX ?? 0), y: b.y + (b.inY ?? 0) };
    const p3 = { x: b.x, y: b.y };
    const u = 1 - t;
    return {
        x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p3.x,
        y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p3.y,
    };
};

describe('live corners: detection and pass-through', () => {
    it('leaves an anchor list without radii completely alone', () => {
        const a = square();
        expect(hasLiveCorners(a)).toBe(false);
        expect(filletAnchors(a, true)).toBe(a);   // same reference: no work done
    });

    it('ignores a zero or negative radius', () => {
        expect(hasLiveCorners([A(0, 0, 0), A(10, 0, 0)])).toBe(false);
        expect(hasLiveCorners([A(0, 0, -5)])).toBe(false);
    });

    it('needs three anchors before there is a corner to round', () => {
        const two = [A(0, 0, 10), A(50, 0, 10)];
        expect(filletAnchors(two, false)).toBe(two);
    });

    it('does not mutate the input', () => {
        const a = square(20);
        const before = JSON.stringify(a);
        filletAnchors(a, true);
        expect(JSON.stringify(a)).toBe(before);
    });
});

describe('live corners: the straight–straight case is an exact circular arc', () => {
    const out = filletAnchors(square(20), true);

    it('replaces each corner with a pair of trim points', () => {
        expect(out.length).toBe(8);
    });

    it('trims exactly the radius back along each edge of a 90° corner', () => {
        // At 90°, t = r / tan(45°) = r, so the corner at (0,0) is cut at (0,20) and (20,0).
        // A rounded closed path starts at the first corner's *incoming* trim point.
        expect(out.map(p => [Math.round(p.x), Math.round(p.y)])).toEqual([
            [0, 20], [20, 0],
            [80, 0], [100, 20],
            [100, 80], [80, 100],
            [20, 100], [0, 80],
        ]);
    });

    it('uses the 4/3·tan(Δ/4) arm, so the join is a true quarter circle', () => {
        const k = (4 / 3) * Math.tan(Math.PI / 8) * 20;    // ≈ 11.046
        expect(Math.hypot(out[0].outX ?? 0, out[0].outY ?? 0)).toBeCloseTo(k, 6);
        expect(Math.hypot(out[1].inX ?? 0, out[1].inY ?? 0)).toBeCloseTo(k, 6);
    });

    it('keeps every point of the arc at the radius from the corner centre', () => {
        // A cubic cannot BE a circle; the 4/3·tan(Δ/4) arm is the standard approximation,
        // whose worst radial error over a quarter turn is ~0.027% — so this asserts the
        // approximation is the good one, not that the curve is exact.
        const tol = 20 * 3e-4;
        for (const t of [0, 0.25, 0.5, 0.75, 1]) {          // corner (0,0) rounds about (20,20)
            const p = at(out[0], out[1], t);
            expect(Math.abs(Math.hypot(p.x - 20, p.y - 20) - 20)).toBeLessThan(tol);
        }
        for (const t of [0, 0.5, 1]) {                       // corner (100,0) rounds about (80,20)
            const p = at(out[2], out[3], t);
            expect(Math.abs(Math.hypot(p.x - 80, p.y - 20) - 20)).toBeLessThan(tol);
        }
    });

    it('leaves the straight run between two fillets straight', () => {
        // (20,0) → (80,0) is the untouched middle of the top edge.
        expect(out[1].outX).toBeUndefined();
        expect(out[2].inX).toBeUndefined();
    });

    it('rounds one corner without touching the other three', () => {
        const one = filletAnchors([A(0, 0), A(100, 0, 20), A(100, 100), A(0, 100)], true);
        expect(one.length).toBe(5);
        expect(one.map(p => [Math.round(p.x), Math.round(p.y)]))
            .toEqual([[0, 0], [80, 0], [100, 20], [100, 100], [0, 100]]);
    });

    it('rounds a 60° corner with the wider trim the angle demands', () => {
        // Isoceles triangle: apex at (50, 86.6) is 60°, so t = r / tan(30°) = r·√3.
        const tri = [A(0, 0), A(100, 0), A(50, 86.602540)];
        tri[0].cornerRadius = 10;
        const r = filletAnchors(tri, true);
        // Along the bottom edge from (0,0) the trim point sits at t = 10·√3 ≈ 17.32.
        const onBottom = r.find(p => Math.abs(p.y) < 1e-6 && p.x > 1)!;
        expect(onBottom.x).toBeCloseTo(10 * Math.sqrt(3), 3);
    });
});

describe('live corners: clamping', () => {
    it('caps a radius that would eat more than its share of an edge', () => {
        const out = filletAnchors(square(500), true);
        // Every trim point stays on its edge; opposite fillets meet in the middle at worst.
        for (const p of out) {
            expect(p.x).toBeGreaterThanOrEqual(-1e-6);
            expect(p.x).toBeLessThanOrEqual(100 + 1e-6);
            expect(p.y).toBeGreaterThanOrEqual(-1e-6);
            expect(p.y).toBeLessThanOrEqual(100 + 1e-6);
        }
        // Two fillets share the 100-unit edge, so each gets exactly half and they meet at
        // the midpoint — the degenerate "fully rounded" case, not a crossover.
        expect(out[1].x).toBeCloseTo(50, 6);
        expect(out[2].x).toBeCloseTo(50, 6);
    });

    it('clamps four equal radii to four equal fillets', () => {
        // Rescaling per segment in path order used to shrink whichever corner it met first,
        // so a symmetric input came out asymmetric.
        const out = filletAnchors(square(500), true);
        const trims = [out[1].x, 100 - out[4].y, 100 - out[5].x, out[0].y];
        for (const t of trims) expect(t).toBeCloseTo(trims[0], 6);
    });

    it('shrinks a fillet to fit a short edge next to a long one', () => {
        // A 10-wide, 100-tall rectangle: the radius has to give way on the short edges.
        const out = filletAnchors([A(0, 0, 40), A(10, 0, 40), A(10, 100, 40), A(0, 100, 40)], true);
        for (const p of out) expect(p.x).toBeGreaterThanOrEqual(-1e-6);
        for (const p of out) expect(p.x).toBeLessThanOrEqual(10 + 1e-6);
    });

    it('never rounds the endpoints of an open path', () => {
        const out = filletAnchors([A(0, 0, 20), A(100, 0, 20), A(100, 100, 20)], false);
        // Only the middle anchor is a corner, so 1 + 2 + 1 = 4 points.
        expect(out.length).toBe(4);
        expect([out[0].x, out[0].y]).toEqual([0, 0]);
        expect([out[3].x, out[3].y]).toEqual([100, 100]);
    });

    it('skips a collinear "corner" that has nothing to round', () => {
        const out = filletAnchors([A(0, 0), A(50, 0, 20), A(100, 0), A(100, 50)], false);
        expect(out.length).toBe(4);       // the flat middle anchor was left alone
        expect([out[1].x, out[1].y]).toEqual([50, 0]);
    });
});

describe('live corners: curved neighbours', () => {
    it('rounds a corner between a curve and a straight without breaking the path', () => {
        const anchors: PathAnchor[] = [
            { x: 0, y: 0, kind: 'corner', outX: 40, outY: -40 },
            { x: 100, y: 0, kind: 'corner', inX: -40, inY: -40, cornerRadius: 15 },
            { x: 100, y: 100, kind: 'corner' },
        ];
        const out = filletAnchors(anchors, false);
        expect(out.length).toBe(4);
        for (const p of out) { expect(Number.isFinite(p.x)).toBe(true); expect(Number.isFinite(p.y)).toBe(true); }
        // The corner is cut back on both sides, so neither trim point is the corner itself.
        expect(Math.hypot(out[1].x - 100, out[1].y - 0)).toBeGreaterThan(1);
        expect(Math.hypot(out[2].x - 100, out[2].y - 0)).toBeGreaterThan(1);
        // The outgoing trim lands on the straight edge below the corner, at t = r/tan(θ/2).
        // The curve arrives heading (1,1), so the interior angle is 135°, not 90° — an
        // obtuse corner needs LESS trim than its radius, which is the whole point of
        // deriving t from the angle rather than just stepping back by r.
        const t = 15 / Math.tan((3 * Math.PI / 4) / 2);
        expect(out[2].x).toBeCloseTo(100, 6);
        expect(out[2].y).toBeCloseTo(t, 6);
        expect(t).toBeLessThan(15);
    });

    it('keeps the incoming curve a curve after trimming', () => {
        const anchors: PathAnchor[] = [
            { x: 0, y: 0, kind: 'corner', outX: 40, outY: -40 },
            { x: 100, y: 0, kind: 'corner', inX: -40, inY: -40, cornerRadius: 15 },
            { x: 100, y: 100, kind: 'corner' },
        ];
        const out = filletAnchors(anchors, false);
        expect(out[0].outX).toBeDefined();
        expect(out[1].inX).toBeDefined();
    });
});

describe('maxCornerRadius', () => {
    it('offers half the shorter neighbour on a right angle', () => {
        expect(maxCornerRadius(square(), true, 1)).toBeCloseTo(50, 6);
    });

    it('is zero where no corner can exist', () => {
        expect(maxCornerRadius(square(), false, 0)).toBe(0);          // open-path start
        expect(maxCornerRadius(square(), false, 3)).toBe(0);          // open-path end
        expect(maxCornerRadius([A(0, 0), A(50, 0), A(100, 0)], false, 1)).toBe(0);  // collinear
        expect(maxCornerRadius([A(0, 0), A(10, 0)], true, 0)).toBe(0);              // too few
    });
});

describe('live corners: serialization', () => {
    it('anchorsToPathData emits the filleted outline', () => {
        const plain = anchorsToPathData(square(), true);
        const round = anchorsToPathData(square(20), true);
        expect(plain).not.toContain('C');
        expect(round).toContain('C');
        expect(round.startsWith('M 0 20')).toBe(true);
    });

    it('respects the ox/oy frame shift', () => {
        const d = anchorsToPathData(square(20), true, -50, -50);
        expect(d.startsWith('M -50 -30')).toBe(true);
    });

    it('is unchanged for paths with no radii', () => {
        expect(anchorsToPathData(square(), true)).toBe('M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z');
    });
});
