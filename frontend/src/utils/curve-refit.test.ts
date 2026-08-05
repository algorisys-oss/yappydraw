import { describe, it, expect } from "bun:test";
import { refitClosedRing, type Pt } from "./curve-refit";
import type { PathAnchor } from "../types";

/** Sample a closed circle as a dense polyline, the way flattening produces one. */
const circlePts = (cx: number, cy: number, r: number, n = 48): Pt[] =>
    Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
    });

/** Dense polyline around a rectangle (many collinear points per edge). */
const rectPts = (x: number, y: number, w: number, h: number, per = 12): Pt[] => {
    const out: Pt[] = [];
    const edge = (ax: number, ay: number, bx: number, by: number) => {
        for (let i = 0; i < per; i++) {
            const t = i / per;
            out.push({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t });
        }
    };
    edge(x, y, x + w, y); edge(x + w, y, x + w, y + h);
    edge(x + w, y + h, x, y + h); edge(x, y + h, x, y);
    return out;
};

/** Evaluate the cubic between two anchors. */
function cubicAt(a: PathAnchor, b: PathAnchor, t: number): Pt {
    const p0 = { x: a.x, y: a.y };
    const p1 = { x: a.x + (a.outX ?? 0), y: a.y + (a.outY ?? 0) };
    const p2 = { x: b.x + (b.inX ?? 0), y: b.y + (b.inY ?? 0) };
    const p3 = { x: b.x, y: b.y };
    const mt = 1 - t;
    return {
        x: mt*mt*mt*p0.x + 3*mt*mt*t*p1.x + 3*mt*t*t*p2.x + t*t*t*p3.x,
        y: mt*mt*mt*p0.y + 3*mt*mt*t*p1.y + 3*mt*t*t*p2.y + t*t*t*p3.y,
    };
}

/** Max deviation of the refitted outline from a true circle. */
function circleError(anchors: PathAnchor[], cx: number, cy: number, r: number): number {
    let worst = 0;
    for (let i = 0; i < anchors.length; i++) {
        const a = anchors[i], b = anchors[(i + 1) % anchors.length];
        for (let k = 0; k <= 12; k++) {
            const p = cubicAt(a, b, k / 12);
            worst = Math.max(worst, Math.abs(Math.hypot(p.x - cx, p.y - cy) - r));
        }
    }
    return worst;
}

describe("refitClosedRing — curves", () => {
    it("turns a 48-point flattened circle into a handful of SMOOTH anchors", () => {
        const anchors = refitClosedRing(circlePts(0, 0, 100));
        expect(anchors.length).toBeLessThan(16);           // was 48 corner points
        expect(anchors.length).toBeGreaterThanOrEqual(4);
        expect(anchors.every(a => a.kind === 'smooth')).toBe(true);
    });

    it("stays on the circle it replaced", () => {
        const anchors = refitClosedRing(circlePts(0, 0, 100));
        // The exact circular-arc handle factor makes this essentially perfect, not merely
        // close — a looser bound would let the old systematic inward bias back in.
        expect(circleError(anchors, 0, 0, 100)).toBeLessThan(0.02);
    });

    it("holds accuracy on a large circle too", () => {
        const anchors = refitClosedRing(circlePts(0, 0, 1000, 200));
        expect(circleError(anchors, 0, 0, 1000)).toBeLessThan(0.2);
    });

    it("every smooth anchor actually has handles", () => {
        const anchors = refitClosedRing(circlePts(50, 50, 80));
        for (const a of anchors.filter(x => x.kind === 'smooth')) {
            expect(Math.hypot(a.inX ?? 0, a.inY ?? 0)).toBeGreaterThan(0);
            expect(Math.hypot(a.outX ?? 0, a.outY ?? 0)).toBeGreaterThan(0);
        }
    });
});

describe("refitClosedRing — corners are not rounded off", () => {
    it("reduces a dense rectangle to exactly its four corners", () => {
        const anchors = refitClosedRing(rectPts(0, 0, 200, 100));
        expect(anchors).toHaveLength(4);
        expect(anchors.every(a => a.kind === 'corner')).toBe(true);
    });

    it("leaves the rectangle's edges perfectly straight (no handles)", () => {
        const anchors = refitClosedRing(rectPts(0, 0, 200, 100));
        for (const a of anchors) {
            expect(a.inX ?? 0).toBe(0);
            expect(a.outX ?? 0).toBe(0);
            expect(a.inY ?? 0).toBe(0);
            expect(a.outY ?? 0).toBe(0);
        }
        // Corners land on the real rectangle, not somewhere smoothed inward.
        const xs = anchors.map(a => Math.round(a.x)).sort((p, q) => p - q);
        const ys = anchors.map(a => Math.round(a.y)).sort((p, q) => p - q);
        expect(xs).toEqual([0, 0, 200, 200]);
        expect(ys).toEqual([0, 0, 100, 100]);
    });

    it("keeps the straight cut straight when a circle is knifed in half", () => {
        // Half a circle plus the flat chord across it — the shape the Knife produces.
        const arc = circlePts(0, 0, 100, 64).filter(p => p.y <= 0);
        const half: Pt[] = [...arc];
        const anchors = refitClosedRing(half);

        // The two ends of the chord are corners...
        const corners = anchors.filter(a => a.kind === 'corner');
        expect(corners.length).toBeGreaterThanOrEqual(2);
        // ...and the arc between them is still smooth and still round.
        expect(anchors.some(a => a.kind === 'smooth')).toBe(true);
        for (const a of anchors.filter(x => x.kind === 'smooth')) {
            expect(Math.abs(Math.hypot(a.x, a.y) - 100)).toBeLessThan(0.5);
        }
    });

    it("does not invent handles on a triangle", () => {
        const tri: Pt[] = [];
        const pts = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 80 }];
        for (let i = 0; i < 3; i++) {
            const a = pts[i], b = pts[(i + 1) % 3];
            for (let k = 0; k < 8; k++) tri.push({ x: a.x + (b.x - a.x) * k / 8, y: a.y + (b.y - a.y) * k / 8 });
        }
        const anchors = refitClosedRing(tri);
        expect(anchors).toHaveLength(3);
        expect(anchors.every(a => a.kind === 'corner')).toBe(true);
    });
});

describe("refitClosedRing — degenerate input", () => {
    it("passes tiny rings through unharmed", () => {
        const r = refitClosedRing([{ x: 0, y: 0 }, { x: 1, y: 1 }]);
        expect(r).toHaveLength(2);
        expect(r.every(a => a.kind === 'corner')).toBe(true);
    });

    it("survives repeated coincident points", () => {
        const pts = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
        const r = refitClosedRing(pts);
        expect(r.length).toBeGreaterThan(0);
        for (const a of r) {
            expect(Number.isFinite(a.x)).toBe(true);
            expect(Number.isFinite(a.y)).toBe(true);
            expect(Number.isFinite(a.inX ?? 0)).toBe(true);
            expect(Number.isFinite(a.outX ?? 0)).toBe(true);
        }
    });
});

describe("refitClosedRing — anchor spacing", () => {
    it("spaces anchors evenly instead of leaving a stub at the seam", () => {
        // The greedy "emit when the running turn passes the budget" version left whatever
        // was left over as a short final arc against the seam, which produced a handle ~6x
        // too short and 5.9 units of error on the two segments either side of it.
        const anchors = refitClosedRing(circlePts(0, 0, 100, 48));
        const lens = anchors.map(a => Math.hypot(a.outX ?? 0, a.outY ?? 0));
        const min = Math.min(...lens), max = Math.max(...lens);
        expect(max / min).toBeLessThan(1.05);
    });

    it("gives the same anchor count regardless of how densely the ring was sampled", () => {
        const a = refitClosedRing(circlePts(0, 0, 100, 48)).length;
        const b = refitClosedRing(circlePts(0, 0, 100, 240)).length;
        expect(a).toBe(b);   // curvature, not sample count, decides
    });
});
