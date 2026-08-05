import { describe, it, expect } from "bun:test";
import { closestPointOnSubpaths, cubicAt, splitSegmentAt, cutSubpathAt, segmentCount, type CutSubpath } from "./path-cut";
import type { PathAnchor } from "../types";

/** A unit-ish square, corners only, closed. */
const square = (): CutSubpath => ({
    closed: true,
    anchors: [
        { x: 0, y: 0, kind: 'corner' },
        { x: 100, y: 0, kind: 'corner' },
        { x: 100, y: 100, kind: 'corner' },
        { x: 0, y: 100, kind: 'corner' },
    ],
});

/** One curved segment bulging upward from (0,0) to (100,0). */
const arc = (): CutSubpath => ({
    closed: false,
    anchors: [
        { x: 0, y: 0, kind: 'smooth', outX: 0, outY: -60 },
        { x: 100, y: 0, kind: 'smooth', inX: 0, inY: -60 },
    ],
});

describe("closestPointOnSubpaths", () => {
    it("finds a point in the MIDDLE of a segment, not the nearest anchor", () => {
        // Click just outside the top edge of the square, 37% along it. The nearest anchor is
        // 37 units away at (0,0); the nearest point on the path is 2 units away.
        const hit = closestPointOnSubpaths([square()], 37, -2)!;
        expect(hit.seg).toBe(0);
        expect(hit.x).toBeCloseTo(37, 4);
        expect(hit.y).toBeCloseTo(0, 4);
        expect(hit.distance).toBeCloseTo(2, 4);
        // Note `t` is the Bézier parameter, NOT the fraction along the edge. A corner-to-corner
        // segment is a degenerate cubic with both control points sitting on the endpoints, so
        // x(t) = 100(3t² − 2t³) and the midpoint of the *edge* is not t = 0.5. Anything that
        // needs a position must go through cubicAt rather than assuming t is a distance.
        expect(cubicAt(square().anchors[0], square().anchors[1], hit.t).x).toBeCloseTo(37, 4);
        expect(hit.t).toBeGreaterThan(0);
        expect(hit.t).toBeLessThan(1);
    });

    it("refines below the resolution of the coarse scan", () => {
        // 1/24th of a 100-unit segment is ~4.2 units. A coarse-only search would quantise
        // this to t = 10/24 = 0.4167 → x ≈ 41.7, several units from the click.
        const hit = closestPointOnSubpaths([square()], 43, 0)!;
        expect(hit.x).toBeCloseTo(43, 3);
    });

    it("picks the closing segment of a closed subpath", () => {
        const hit = closestPointOnSubpaths([square()], -2, 50)!;
        expect(hit.seg).toBe(3);              // the wrap-around edge (0,100) → (0,0)
        expect(hit.y).toBeCloseTo(50, 3);
    });

    it("lands on the curve, not the chord, for a Bézier segment", () => {
        // The arc bulges to y ≈ -45 at its midpoint; the straight chord would be at y = 0.
        const hit = closestPointOnSubpaths([arc()], 50, -100)!;
        expect(hit.x).toBeCloseTo(50, 3);
        expect(hit.y).toBeLessThan(-40);
    });

    it("chooses the nearer of several subpaths", () => {
        const far: CutSubpath = { closed: true, anchors: square().anchors.map(a => ({ ...a, x: a.x + 500 })) };
        const hit = closestPointOnSubpaths([far, square()], 50, -1)!;
        expect(hit.sub).toBe(1);
    });

    it("returns null for a subpath with nothing to hit", () => {
        expect(closestPointOnSubpaths([{ closed: false, anchors: [{ x: 0, y: 0, kind: 'corner' }] }], 0, 0)).toBeNull();
    });
});

describe("splitSegmentAt", () => {
    it("reproduces the original curve exactly (the halves trace the same path)", () => {
        const a: PathAnchor = { x: 0, y: 0, kind: 'smooth', outX: 0, outY: -60 };
        const b: PathAnchor = { x: 100, y: 0, kind: 'smooth', inX: 0, inY: -60 };
        // Sample the original before the split mutates the handles.
        const original = [0.1, 0.25, 0.5, 0.75, 0.9].map(t => ({ t, ...cubicAt(a, b, t) }));

        const split = 0.4;
        const mid = splitSegmentAt(a, b, split);

        for (const o of original) {
            // Re-parameterise: t on the original maps to t/split on the first half, and
            // (t-split)/(1-split) on the second.
            const p = o.t <= split
                ? cubicAt(a, mid, o.t / split)
                : cubicAt(mid, b, (o.t - split) / (1 - split));
            expect(p.x).toBeCloseTo(o.x, 8);
            expect(p.y).toBeCloseTo(o.y, 8);
        }
    });

    it("puts the new anchor on the curve", () => {
        const a: PathAnchor = { x: 0, y: 0, kind: 'smooth', outX: 0, outY: -60 };
        const b: PathAnchor = { x: 100, y: 0, kind: 'smooth', inX: 0, inY: -60 };
        const expected = cubicAt(a, b, 0.5);
        const mid = splitSegmentAt(a, b, 0.5);
        expect(mid.x).toBeCloseTo(expected.x, 9);
        expect(mid.y).toBeCloseTo(expected.y, 9);
    });

    it("keeps a straight segment straight, as a corner with no handles", () => {
        const a: PathAnchor = { x: 0, y: 0, kind: 'corner' };
        const b: PathAnchor = { x: 100, y: 0, kind: 'corner' };
        const mid = splitSegmentAt(a, b, 0.25);
        expect(mid).toEqual({ x: 25, y: 0, kind: 'corner' });
        expect(a.outX).toBeUndefined(); // no phantom handles introduced
        expect(b.inX).toBeUndefined();
    });
});

describe("cutSubpathAt", () => {
    it("opens a closed subpath into one open path starting and ending at the cut", () => {
        const sq = square();
        const pieces = cutSubpathAt(sq.anchors, sq.closed, 0, 0.5)!;
        expect(pieces).toHaveLength(1);
        const p = pieces[0];
        // 4 original corners + the inserted cut point, and the cut point repeated at the end.
        expect(p).toHaveLength(6);
        expect(p[0].x).toBeCloseTo(50, 6);
        expect(p[0].y).toBeCloseTo(0, 6);
        expect(p[p.length - 1].x).toBeCloseTo(50, 6);
        expect(p[p.length - 1].y).toBeCloseTo(0, 6);
    });

    it("splits an open subpath into two pieces that share the cut point", () => {
        const sp: CutSubpath = {
            closed: false,
            anchors: [
                { x: 0, y: 0, kind: 'corner' },
                { x: 100, y: 0, kind: 'corner' },
                { x: 200, y: 0, kind: 'corner' },
            ],
        };
        const [a, b] = cutSubpathAt(sp.anchors, sp.closed, 0, 0.5)!;
        expect(a.map(p => p.x)).toEqual([0, 50]);
        expect(b.map(p => p.x)).toEqual([50, 100, 200]);
    });

    it("cuts exactly at an existing anchor without inserting a duplicate", () => {
        const sp: CutSubpath = {
            closed: false,
            anchors: [
                { x: 0, y: 0, kind: 'corner' },
                { x: 100, y: 0, kind: 'corner' },
                { x: 200, y: 0, kind: 'corner' },
            ],
        };
        // t = 1 on segment 0 is the same point as t = 0 on segment 1: the middle anchor.
        const [a, b] = cutSubpathAt(sp.anchors, sp.closed, 0, 1)!;
        expect(a.map(p => p.x)).toEqual([0, 100]);
        expect(b.map(p => p.x)).toEqual([100, 200]);
    });

    it("refuses to 'cut' an open path at its endpoints", () => {
        const sp: CutSubpath = {
            closed: false,
            anchors: [{ x: 0, y: 0, kind: 'corner' }, { x: 100, y: 0, kind: 'corner' }],
        };
        expect(cutSubpathAt(sp.anchors, sp.closed, 0, 0)).toBeNull();
        expect(cutSubpathAt(sp.anchors, sp.closed, 0, 1)).toBeNull();
    });

    it("does not mutate the input anchors", () => {
        const sq = square();
        const before = JSON.stringify(sq.anchors);
        cutSubpathAt(sq.anchors, sq.closed, 1, 0.3);
        expect(JSON.stringify(sq.anchors)).toBe(before);
    });

    it("preserves the curve when cutting a curved closed subpath", () => {
        // A closed two-anchor 'lens' of two arcs. Cutting must not move the outline.
        const anchors: PathAnchor[] = [
            { x: 0, y: 0, kind: 'smooth', outX: 0, outY: -50, inX: 0, inY: 50 },
            { x: 100, y: 0, kind: 'smooth', inX: 0, inY: -50, outX: 0, outY: 50 },
        ];
        const sampleBefore = cubicAt(anchors[0], anchors[1], 0.8);
        const [piece] = cutSubpathAt(anchors, true, 0, 0.4)!;
        // Reopening at the cut makes the cut point the new start, so the piece runs
        // [cut, B, A, cut]. The second half of the original A→B arc is therefore its FIRST
        // segment (cut → B), and the original t=0.8 sits at (0.8−0.4)/0.6 along it.
        expect(piece).toHaveLength(4);
        const after = cubicAt(piece[0], piece[1], (0.8 - 0.4) / 0.6);
        expect(after.x).toBeCloseTo(sampleBefore.x, 6);
        expect(after.y).toBeCloseTo(sampleBefore.y, 6);
    });
});

describe("segmentCount", () => {
    it("counts the wrap-around segment only when closed", () => {
        expect(segmentCount(square())).toBe(4);
        expect(segmentCount({ ...square(), closed: false })).toBe(3);
        expect(segmentCount({ closed: true, anchors: [{ x: 0, y: 0, kind: 'corner' }] })).toBe(0);
    });
});
