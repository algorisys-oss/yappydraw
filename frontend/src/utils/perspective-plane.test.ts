/**
 * Drawing ON a perspective plane.
 *
 * Snapping fixed the *direction* of a stroke; it can't make a rectangle. A box drag has two
 * free corners, and the other two are fully determined by the plane's two edge families —
 * which is what `perspectiveQuad` solves. These tests pin that: every edge of the quad runs
 * to the vanishing point it belongs to, on every plane, in every mode.
 */

import { describe, it, expect } from "bun:test";
import { perspectiveQuad, planeFamilies, orderQuadForWarp, type PerspectiveGrid } from "./perspective-snap";

const grid = (over: Partial<PerspectiveGrid> = {}): PerspectiveGrid => ({
    horizonY: 0, leftVPx: -1000, rightVPx: 1000,
    mode: 2, verticalVPx: 0, verticalVPy: 3000,
    density: 12, snap: true, snapAngle: 10, snapStrength: 1,
    drawPlane: 'off',
    ...over,
});

/** |(b−a) × (vp−a)| — 0 when a, b and the vanishing point are collinear. */
const offVP = (a: any, b: any, vx: number, vy: number) =>
    Math.abs((b.x - a.x) * (vy - a.y) - (b.y - a.y) * (vx - a.x));

describe("plane families", () => {
    it("2-point: the floor runs to both VPs, a wall to one VP plus true vertical", () => {
        const g = grid();
        expect(planeFamilies(g, 'floor')!.map(f => f.kind)).toEqual(["left", "right"]);
        expect(planeFamilies(g, 'left')!.map(f => f.kind)).toEqual(["left", "vertical"]);
        expect(planeFamilies(g, 'right')!.map(f => f.kind)).toEqual(["right", "vertical"]);
    });

    it("1-point: the floor pairs the VP with a true horizontal", () => {
        const g = grid({ mode: 1 });
        expect(planeFamilies(g, 'floor')!.map(f => f.kind)).toEqual(["vp", "horizontal"]);
        expect(planeFamilies(g, 'left')!.map(f => f.kind)).toEqual(["vp", "vertical"]);
    });

    it("3-point: walls converge vertically too — no free vertical anywhere", () => {
        const g = grid({ mode: 3 });
        expect(planeFamilies(g, 'left')!.map(f => f.kind)).toEqual(["left", "vertical"]);
        expect(planeFamilies(g, 'left')![1].vp).toEqual({ x: 0, y: 3000 });
        expect(planeFamilies(g, 'floor')!.map(f => f.kind)).toEqual(["left", "right"]);
    });

    it("returns null when no plane is active", () => {
        expect(planeFamilies(grid(), 'off')).toBeNull();
    });
});

describe("the floor quad", () => {
    const g = grid();
    const q = perspectiveQuad(g, 'floor', { x: -200, y: 600 }, { x: 300, y: 900 })!;

    it("anchors the tile at the drag start and lands the far corner near the cursor", () => {
        expect(q).toHaveLength(4);
        expect(q[0]).toEqual({ x: -200, y: 600 });
        // Foreshortened, so not exactly under the cursor — but in its neighbourhood, not
        // halfway to the horizon.
        expect(Math.hypot(q[2].x - 300, q[2].y - 900)).toBeLessThan(250);
    });

    it("is convex — the tile never folds through a vanishing point", () => {
        for (const [ex, ey] of [[300, 900], [-600, 900], [300, 300], [-700, 200], [0, 1400]]) {
            const t = perspectiveQuad(g, 'floor', { x: -200, y: 600 }, { x: ex, y: ey });
            if (!t) continue;
            let sign = 0;
            for (let i = 0; i < 4; i++) {
                const a = t[i], b = t[(i + 1) % 4], c = t[(i + 2) % 4];
                const z = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
                if (Math.abs(z) < 1e-9) continue;
                if (sign === 0) sign = Math.sign(z);
                else expect(Math.sign(z)).toBe(sign);
            }
        }
    });

    it("every edge runs to the vanishing point of its family", () => {
        // p0→p1 and p3→p2 share one family; p0→p3 and p1→p2 share the other.
        const famA = offVP(q[0], q[1], -1000, 0) < 1e-6 ? 'left' : 'right';
        const [ax, bx] = famA === 'left' ? [-1000, 1000] : [1000, -1000];
        expect(offVP(q[0], q[1], ax, 0)).toBeLessThan(1e-6);
        expect(offVP(q[3], q[2], ax, 0)).toBeLessThan(1e-6);
        expect(offVP(q[0], q[3], bx, 0)).toBeLessThan(1e-6);
        expect(offVP(q[1], q[2], bx, 0)).toBeLessThan(1e-6);
    });

    it("is convex and non-degenerate", () => {
        const area = q.reduce((s, p, i) => {
            const n = q[(i + 1) % 4];
            return s + (p.x * n.y - n.x * p.y);
        }, 0) / 2;
        expect(Math.abs(area)).toBeGreaterThan(1000);
    });
});

describe("wall quads", () => {
    it("a 2-point wall keeps its verticals exactly vertical", () => {
        const q = perspectiveQuad(grid(), 'right', { x: -100, y: 200 }, { x: 400, y: 700 })!;
        // One family is vertical: the two edges of that family have zero horizontal run.
        const verticalEdges = [[q[0], q[1]], [q[0], q[3]]].filter(([a, b]) => Math.abs(b.x - a.x) < 1e-6);
        expect(verticalEdges).toHaveLength(1);
        // …and the other two run to the right VP.
        expect(offVP(q[0], q[1], 1000, 0) < 1e-6 || offVP(q[0], q[3], 1000, 0) < 1e-6).toBe(true);
    });

    it("a 3-point wall converges toward the third VP instead", () => {
        const g = grid({ mode: 3, verticalVPx: 100, verticalVPy: 4000 });
        const q = perspectiveQuad(g, 'left', { x: -100, y: 200 }, { x: 400, y: 700 })!;
        const toThird = [[q[0], q[1]], [q[0], q[3]]].some(([a, b]) => offVP(a, b, 100, 4000) < 1e-6);
        expect(toThird).toBe(true);
    });
});

describe("degenerate input", () => {
    it("gives up rather than returning a broken quad when the families are parallel", () => {
        // A drag started exactly on the horizon between two horizon VPs: both families are
        // the same line, so the drag cannot be split between them.
        expect(perspectiveQuad(grid(), 'floor', { x: 0, y: 0 }, { x: 100, y: 0 })).toBeNull();
    });

    it("gives up when the drag runs along one family alone — that tile has no width", () => {
        const g = grid();
        // Straight at the right VP from (0,500): all of the drag is family B, none family A.
        expect(perspectiveQuad(g, 'floor', { x: 0, y: 500 }, { x: 200, y: 500 - 200 * 0.5 })).toBeNull();
    });

    it("gives up on a zero-area drag", () => {
        expect(perspectiveQuad(grid(), 'floor', { x: 10, y: 500 }, { x: 10, y: 500 })).toBeNull();
    });
});

describe("ordering for the warp cage", () => {
    it("starts at the top-left corner and winds clockwise", () => {
        const q = perspectiveQuad(grid(), 'floor', { x: -200, y: 600 }, { x: 300, y: 900 })!;
        const o = orderQuadForWarp(q);
        const area = o.reduce((s, p, i) => { const n = o[(i + 1) % 4]; return s + (p.x * n.y - n.x * p.y); }, 0) / 2;
        expect(area).toBeGreaterThan(0);                       // clockwise with y pointing down
        const sums = o.map(p => p.x + p.y);
        expect(Math.min(...sums)).toBe(sums[0]);               // TL first
    });

    it("keeps the same four points, just re-indexed", () => {
        const q = perspectiveQuad(grid(), 'right', { x: -100, y: 200 }, { x: 400, y: 700 })!;
        const o = orderQuadForWarp(q);
        const key = (p: any) => `${p.x.toFixed(6)},${p.y.toFixed(6)}`;
        expect(o.map(key).sort()).toEqual(q.map(key).sort());
    });
});
