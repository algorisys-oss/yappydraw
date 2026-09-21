import { describe, it, expect } from "bun:test";
import { snapBoxToGuides } from "./guide-snapping";

const box = { minX: 0, minY: 0, maxX: 100, maxY: 50 };
const v = (pos: number) => ({ id: `v${pos}`, axis: 'v' as const, pos });
const h = (pos: number) => ({ id: `h${pos}`, axis: 'h' as const, pos });

describe("snapBoxToGuides", () => {
    it("snaps the left edge onto a nearby vertical guide", () => {
        expect(snapBoxToGuides(box, 203, 0, [v(200)], 6)).toEqual({ dx: 200, dy: 0, x: 200, y: null });
    });

    it("snaps the centre and the far edge too", () => {
        expect(snapBoxToGuides(box, 148, 0, [v(200)], 6).dx).toBe(150);   // centre 50 + 148 → 200
        expect(snapBoxToGuides(box, 97, 0, [v(200)], 6).dx).toBe(100);    // right 100 + 97 → 200
    });

    it("horizontal guides pull on y only", () => {
        expect(snapBoxToGuides(box, 13, 78, [h(80)], 6)).toEqual({ dx: 13, dy: 80, x: null, y: 80 });
    });

    it("takes the closest guide", () => {
        expect(snapBoxToGuides(box, 203, 0, [v(207), v(201)], 6).x).toBe(201);
    });

    it("leaves the move alone out of reach", () => {
        expect(snapBoxToGuides(box, 210, 0, [v(200)], 6)).toEqual({ dx: 210, dy: 0, x: null, y: null });
    });

    it("respects disabled axes", () => {
        expect(snapBoxToGuides(box, 203, 78, [v(200), h(80)], 6, { x: false, y: true })).toEqual({ dx: 203, dy: 80, x: null, y: 80 });
    });

    it("ignores non-finite guides and a zero threshold", () => {
        expect(snapBoxToGuides(box, 203, 0, [v(NaN)], 6).x).toBeNull();
        expect(snapBoxToGuides(box, 203, 0, [v(200)], 0).x).toBeNull();
    });
});
