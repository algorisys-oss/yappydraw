import { describe, it, expect } from "bun:test";
import {
    gridSnap, gridSnapDelta, rotatedGridFamilies, gridUnitToPx, pxToGridUnit,
    isMajorLine, gridDrawStep, latticeSnap,
} from "./grid-lattice";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

/** Coordinates of p in the grid's own frame, in cells. Integers ⇔ on a square-grid node. */
const cells = (p: { x: number; y: number }, g: number, deg: number, ox = 0, oy = 0) => {
    const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
    const dx = p.x - ox, dy = p.y - oy;
    return [(dx * c + dy * s) / g, (-dx * s + dy * c) / g];
};

describe("gridSnap", () => {
    it("with no rotation or origin is exactly the old lattice snap", () => {
        for (const style of ['lines', 'dots', 'diagonal', 'isometric'] as const) {
            expect(gridSnap(23, 37, { gridSize: 20, style })).toEqual(latticeSnap(23, 37, 20, style));
        }
    });

    it("snaps onto a rotated square grid's nodes", () => {
        for (const deg of [15, 30, 45, -20, 90, 137]) {
            const p = gridSnap(113.7, -41.2, { gridSize: 25, angle: deg });
            for (const k of cells(p, 25, deg)) expect(close(k, Math.round(k), 1e-6)).toBe(true);
        }
    });

    it("moves the lattice with the origin", () => {
        const p = gridSnap(31, 12, { gridSize: 20, originX: 7, originY: 3 });
        expect(p).toEqual({ x: 27, y: 3 });
    });

    it("combines origin and rotation", () => {
        const p = gridSnap(200, 90, { gridSize: 30, angle: 30, originX: 50, originY: -10 });
        for (const k of cells(p, 30, 30, 50, -10)) expect(close(k, Math.round(k), 1e-6)).toBe(true);
    });

    it("is idempotent on a rotated grid", () => {
        const g = { gridSize: 18, angle: 22, originX: 5, originY: 9 };
        const a = gridSnap(77, 144, g);
        const b = gridSnap(a.x, a.y, g);
        expect(close(a.x, b.x, 1e-9) && close(a.y, b.y, 1e-9)).toBe(true);
    });

    it("returns the point untouched for a bad spacing", () => {
        expect(gridSnap(3.3, 4.4, { gridSize: 0, angle: 30 })).toEqual({ x: 3.3, y: 4.4 });
        expect(gridSnap(3.3, 4.4, { gridSize: NaN })).toEqual({ x: 3.3, y: 4.4 });
    });

    it("ignores a non-finite angle or origin instead of emitting NaN", () => {
        const p = gridSnap(23, 37, { gridSize: 20, angle: NaN, originX: Infinity });
        expect(p).toEqual({ x: 20, y: 40 });
    });
});

describe("gridSnapDelta", () => {
    it("rounds per axis on an unrotated grid, whatever the origin", () => {
        expect(gridSnapDelta(27, -13, { gridSize: 20, originX: 7, originY: 3 })).toEqual({ x: 20, y: -20 });
    });

    it("moves by whole cells along a rotated grid", () => {
        const d = gridSnapDelta(50, 20, { gridSize: 20, angle: 30 });
        for (const k of cells(d, 20, 30)) expect(close(k, Math.round(k), 1e-6)).toBe(true);
    });
});

describe("rotatedGridFamilies", () => {
    const deg = (fs: { angle: number }[]) => fs.map(f => Math.round((f.angle * 180) / Math.PI));

    it("square styles are rows and columns, rotated", () => {
        expect(deg(rotatedGridFamilies({ gridSize: 20, style: 'lines' }))).toEqual([0, 90]);
        expect(deg(rotatedGridFamilies({ gridSize: 20, style: 'dots', angle: 15 }))).toEqual([15, 105]);
    });

    it("angled styles keep their families, offset by the rotation", () => {
        expect(deg(rotatedGridFamilies({ gridSize: 20, style: 'isometric', angle: 10 }))).toEqual([40, -20, 100]);
    });

    it("marks only the first two families as primary", () => {
        expect(rotatedGridFamilies({ gridSize: 20, style: 'isometric' }).map(f => f.primary)).toEqual([true, true, false]);
    });
});

describe("units", () => {
    it("converts at 96 px per inch", () => {
        expect(gridUnitToPx(1, 'in')).toBe(96);
        expect(close(gridUnitToPx(10, 'mm'), 37.7952755905, 1e-6)).toBe(true);
        expect(close(gridUnitToPx(1, 'cm'), gridUnitToPx(10, 'mm'))).toBe(true);
        expect(gridUnitToPx(20, 'px')).toBe(20);
        expect(gridUnitToPx(20, undefined)).toBe(20);
    });

    it("round-trips to 3 decimals", () => {
        expect(pxToGridUnit(gridUnitToPx(5, 'mm'), 'mm')).toBe(5);
        expect(pxToGridUnit(gridUnitToPx(2.5, 'cm'), 'cm')).toBe(2.5);
    });
});

describe("major lines", () => {
    it("every Nth line counted from the origin, both directions", () => {
        expect([0, 1, 4, 5, -5, -3].map(k => isMajorLine(k, 5))).toEqual([true, false, false, true, true, false]);
    });

    it("no majors when every ≤ 1", () => {
        expect(isMajorLine(0, 1)).toBe(false);
        expect(isMajorLine(0, 0)).toBe(false);
        expect(isMajorLine(0, undefined)).toBe(false);
    });
});

describe("gridDrawStep", () => {
    it("draws every line when they're far enough apart", () => {
        expect(gridDrawStep(20, 1)).toBe(1);
    });

    it("thins to the majors first, then doubles", () => {
        expect(gridDrawStep(20, 0.3, 5)).toBe(5);    // 6px gaps → majors every 5 (30px)
        expect(gridDrawStep(20, 0.05, 5)).toBe(10);  // 1px → 5 cells is 5px, still too tight
    });

    it("doubles when there are no majors", () => {
        expect(gridDrawStep(20, 0.25)).toBe(2);
    });

    it("is 1 for nonsense input rather than looping", () => {
        expect(gridDrawStep(0, 1)).toBe(1);
        expect(gridDrawStep(20, 0)).toBe(1);
    });
});
