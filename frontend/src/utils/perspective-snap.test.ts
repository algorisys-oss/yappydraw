/**
 * Perspective soft-snap.
 *
 * The perspective grid used to be a picture you aimed at by eye — nothing consulted it
 * while drawing. These tests pin the snap: a segment whose direction is close to a ray
 * through a vanishing point gets pulled onto that ray, gently (so freehand and curves
 * stay drawable), and left alone once it is clearly pointing somewhere else.
 */

import { describe, it, expect } from "bun:test";
import {
    perspectiveVPs, perspectiveGuidesAt, snapVectorToPerspective, snapPointToPerspective,
    type PerspectiveGrid,
} from "./perspective-snap";

/** Two-point grid: horizon at y=0, VPs at x=∓1000. */
const grid = (over: Partial<PerspectiveGrid> = {}): PerspectiveGrid => ({
    horizonY: 0, leftVPx: -1000, rightVPx: 1000,
    mode: 2, verticalVPx: 0, verticalVPy: 3000,
    density: 12, snap: true, snapAngle: 10, snapStrength: 1,
    ...over,
});

const deg = (dx: number, dy: number) => Math.atan2(dy, dx) * 180 / Math.PI;

describe("active vanishing points", () => {
    it("1-point uses the single left VP", () => {
        const vps = perspectiveVPs(grid({ mode: 1 }));
        expect(vps.map(v => v.kind)).toEqual(["vp"]);
        expect(vps[0].x).toBe(-1000);
    });

    it("2-point uses both horizon VPs", () => {
        expect(perspectiveVPs(grid()).map(v => v.kind)).toEqual(["left", "right"]);
    });

    it("3-point adds the vertical VP", () => {
        const vps = perspectiveVPs(grid({ mode: 3 }));
        expect(vps.map(v => v.kind)).toEqual(["left", "right", "vertical"]);
        expect(vps[2].y).toBe(3000);
    });
});

describe("guides at a point", () => {
    it("2-point gives both VP rays plus a true vertical", () => {
        const gs = perspectiveGuidesAt(grid(), 0, 500);
        expect(gs.map(g => g.kind).sort()).toEqual(["left", "right", "vertical"]);
    });

    it("1-point adds a horizontal family; 3-point drops the free vertical", () => {
        expect(perspectiveGuidesAt(grid({ mode: 1 }), 0, 500).map(g => g.kind).sort())
            .toEqual(["horizontal", "vertical", "vp"]);
        expect(perspectiveGuidesAt(grid({ mode: 3 }), 0, 500).map(g => g.kind).sort())
            .toEqual(["left", "right", "vertical"]);
    });

    it("aims at the vanishing point, not away from it", () => {
        const g = perspectiveGuidesAt(grid(), 0, 500).find(x => x.kind === "right")!;
        // (0,500) → right VP (1000,0): up and to the right
        expect(g.dx).toBeGreaterThan(0);
        expect(g.dy).toBeLessThan(0);
        expect(Math.hypot(g.dx, g.dy)).toBeCloseTo(1, 9);
    });

    it("drops a degenerate guide when the anchor sits on the vanishing point", () => {
        const gs = perspectiveGuidesAt(grid(), -1000, 0);
        expect(gs.some(g => g.kind === "left")).toBe(false);
        expect(gs.some(g => g.kind === "right")).toBe(true);
    });
});

describe("snapping a segment", () => {
    it("pulls a near-ray segment fully onto the ray at full strength", () => {
        const g = grid();
        // From (0,500) the right VP lies at −26.57°. Aim 3° off it.
        const target = -26.57 + 3;
        const len = 200;
        const vx = Math.cos(target * Math.PI / 180) * len;
        const vy = Math.sin(target * Math.PI / 180) * len;
        const r = snapVectorToPerspective(g, 0, 500, vx, vy);
        expect(r.guide?.kind).toBe("right");
        expect(deg(r.dx, r.dy)).toBeCloseTo(-26.5650512, 4);
    });

    it("keeps the drag length — the pull rotates, it does not stretch", () => {
        const g = grid();
        const r = snapVectorToPerspective(g, 0, 500, 180, -85);
        expect(Math.hypot(r.dx, r.dy)).toBeCloseTo(Math.hypot(180, -85), 9);
    });

    it("leaves a segment alone once it points outside the tolerance", () => {
        const g = grid({ snapAngle: 5 });
        const r = snapVectorToPerspective(g, 0, 500, 200, 200); // 45°, nowhere near a guide
        expect(r.guide).toBeNull();
        expect(r.dx).toBe(200);
        expect(r.dy).toBe(200);
    });

    it("snaps the backwards half of a ray too — a line through the VP runs both ways", () => {
        const g = grid();
        // Straight away from the right VP: 180° from −26.57°
        const away = -26.57 + 180;
        const vx = Math.cos(away * Math.PI / 180) * 100;
        const vy = Math.sin(away * Math.PI / 180) * 100;
        const r = snapVectorToPerspective(g, 0, 500, vx * 0.999 + 2, vy);
        expect(r.guide?.kind).toBe("right");
    });

    it("snaps to vertical in 2-point mode", () => {
        const r = snapVectorToPerspective(grid(), 0, 500, 6, 200); // ~1.7° off straight down
        expect(r.guide?.kind).toBe("vertical");
        expect(Math.abs(r.dx)).toBeLessThan(1e-9);
    });

    it("picks the nearest guide when two are in range", () => {
        const g = grid({ snapAngle: 40 });
        const r = snapVectorToPerspective(g, 0, 500, 200, -100); // −26.6° = right VP
        expect(r.guide?.kind).toBe("right");
    });

    it("softens the pull below full strength — biased, not locked", () => {
        const soft = grid({ snapStrength: 0.75 });
        const off = 5; // degrees off the right ray
        const base = -26.5650512;
        const a = (base + off) * Math.PI / 180;
        const r = snapVectorToPerspective(soft, 0, 500, Math.cos(a) * 200, Math.sin(a) * 200);
        const moved = deg(r.dx, r.dy) - (base + off);
        expect(r.guide?.kind).toBe("right");
        expect(moved).toBeLessThan(0);                 // pulled toward the ray
        expect(Math.abs(moved)).toBeLessThan(off);     // but not all the way onto it
    });

    it("does nothing when snapping is off or the strength is zero", () => {
        for (const g of [grid({ snap: false }), grid({ snapStrength: 0 })]) {
            const r = snapVectorToPerspective(g, 0, 500, 200, -99);
            expect(r.guide).toBeNull();
            expect(r.dx).toBe(200);
        }
    });

    it("does nothing for a zero-length drag", () => {
        const r = snapVectorToPerspective(grid(), 0, 500, 0, 0);
        expect(r.guide).toBeNull();
    });

    it("snapPointToPerspective returns an absolute point on the ray", () => {
        const r = snapPointToPerspective(grid(), 0, 500, 200, 400);
        // (200,400) from (0,500) is −26.57°: dead on the right ray already
        expect(r.guide?.kind).toBe("right");
        expect(r.x).toBeCloseTo(200, 6);
        expect(r.y).toBeCloseTo(400, 6);
    });

    it("a snapped endpoint really is collinear with the vanishing point", () => {
        const r = snapPointToPerspective(grid(), 0, 500, 210, 385);
        const cross = (r.x - 0) * (0 - 500) - (r.y - 500) * (1000 - 0);
        expect(Math.abs(cross)).toBeLessThan(1e-6);
    });
});
