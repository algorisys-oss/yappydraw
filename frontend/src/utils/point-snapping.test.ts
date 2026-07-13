import { describe, it, expect } from "bun:test";
import { getPointSnap } from "./point-snapping";

const el = (id: string, x: number, y: number, w = 40, h = 40, extra: any = {}) =>
    ({ id, x, y, width: w, height: h, layerId: 'L1', ...extra });

describe("getPointSnap", () => {
    it("snaps a moving corner onto a target corner when within threshold on both axes", () => {
        // target at (200,200)-(240,240); active at (100,100) dragged by (+96,+96)
        // → active top-left reaches (196,196), 4px from target's (200,200) corner.
        const active = el('a', 100, 100);
        const target = el('t', 200, 200);
        const r = getPointSnap(['a'], [active, target], 96, 96, 5);
        expect(r.snapped).toBe(true);
        expect(r.dx).toBe(100); // 96 + (200-196)
        expect(r.dy).toBe(100);
        expect(r.marker).toEqual({ x: 200, y: 200 });
    });

    it("snaps to the target's centre alignment (correction lands the group exactly)", () => {
        // both 40×40; several anchor pairs tie at the same 2/2 offset, so the
        // correction (not which specific anchor) is what matters: dx/dy → 100/100.
        const active = el('a', 100, 100);
        const target = el('t', 200, 200);
        const r = getPointSnap(['a'], [active, target], 102, 98, 5);
        expect(r.snapped).toBe(true);
        expect(r.dx).toBe(100);
        expect(r.dy).toBe(100);
    });

    it("does not snap when no anchor pair is within threshold on both axes", () => {
        const active = el('a', 100, 100);
        const target = el('t', 400, 400);
        const r = getPointSnap(['a'], [active, target], 5, 5, 5);
        expect(r.snapped).toBe(false);
        expect(r).toEqual({ dx: 5, dy: 5, snapped: false, marker: null });
    });

    it("requires BOTH axes within threshold (near on X, far on Y → no snap)", () => {
        const active = el('a', 100, 100);
        const target = el('t', 200, 500);
        // dx lands X corner at 200 (exact), but Y is far → not a point snap.
        const r = getPointSnap(['a'], [active, target], 100, 5, 5);
        expect(r.snapped).toBe(false);
    });

    it("snaps to a path element's true anchor point", () => {
        const active = el('a', 100, 100);
        // target path with an anchor at origin-relative (10,10) → world (310,310).
        const target = el('t', 300, 300, 40, 40, { pathAnchors: [{ x: 10, y: 10 }] });
        // active top-left (100,100) + d(207,207) = (307,307), 3px from (310,310).
        const r = getPointSnap(['a'], [active, target], 207, 207, 5);
        expect(r.snapped).toBe(true);
        expect(r.marker).toEqual({ x: 310, y: 310 });
        expect(r.dx).toBe(210);
        expect(r.dy).toBe(210);
    });

    it("ignores targets on a different layer", () => {
        const active = el('a', 100, 100);
        const target = el('t', 200, 200, 40, 40, { layerId: 'L2' });
        const r = getPointSnap(['a'], [active, target], 96, 96, 5);
        expect(r.snapped).toBe(false);
    });

    it("snaps to an extra target (path-intersection point) within threshold", () => {
        const active = el('a', 100, 100);
        // No other element anchors nearby; only an intersection point at (310,310).
        const far = el('t', 900, 900);
        const r = getPointSnap(['a'], [active, far], 207, 207, 5, [{ x: 310, y: 310 }]);
        expect(r.snapped).toBe(true);
        expect(r.marker).toEqual({ x: 310, y: 310 });
        expect(r.dx).toBe(210);
        expect(r.dy).toBe(210);
    });

    it("picks the nearest pair when several are in range", () => {
        const active = el('a', 100, 100);
        const near = el('near', 198, 198);   // corner 2px away after drag
        const far = el('far', 205, 205);      // corner 9px away (out of 5px anyway)
        const r = getPointSnap(['a'], [active, near, far], 96, 96, 5);
        expect(r.marker).toEqual({ x: 198, y: 198 });
    });
});
