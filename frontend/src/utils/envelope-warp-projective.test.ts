/**
 * Projective (perspective-correct) 4-corner warp.
 *
 * The envelope cage has always been bilinear, which is right for a free distort and wrong for
 * a perspective plane: bilinear puts the middle of the cage at the average of the corners,
 * while a real perspective plane puts it where the diagonals cross. On a trapezoid whose far
 * edge is half the near edge that is a 17% error — enough that a circle drawn on the floor
 * comes out as a symmetric ellipse instead of one pushed toward the horizon.
 *
 * `warp.projective` opts a cage into a homography. Cages without the flag must keep the exact
 * bilinear behaviour they shipped with.
 */

import { describe, it, expect } from "bun:test";
import { getWarpGrid, meshWarpPoint, unmeshWarpPoint } from "./envelope-warp";

/** A 200×200 centred box mapped onto a trapezoid: far (top) edge half the near (bottom) one. */
const TRAP = { corners: [{ x: -50, y: -100 }, { x: 50, y: -100 }, { x: 100, y: 100 }, { x: -100, y: 100 }] };
const W = 200, H = 200;

const gridOf = (warp: any) => getWarpGrid(warp)!;

describe("projective forward map", () => {
    it("pins the four corners exactly, like bilinear does", () => {
        const g = gridOf({ ...TRAP, projective: true });
        const corners: [number, number, number, number][] = [
            [-100, -100, -50, -100], [100, -100, 50, -100],
            [100, 100, 100, 100], [-100, 100, -100, 100],
        ];
        for (const [gx, gy, ex, ey] of corners) {
            const p = meshWarpPoint(gx, gy, W, H, g);
            expect(p.x).toBeCloseTo(ex, 6);
            expect(p.y).toBeCloseTo(ey, 6);
        }
    });

    it("puts the centre where the diagonals cross, not at the average of the corners", () => {
        const g = gridOf({ ...TRAP, projective: true });
        const c = meshWarpPoint(0, 0, W, H, g);
        // Diagonals of the trapezoid: (-50,-100)→(100,100) and (50,-100)→(-100,100) meet on x=0.
        // Solve for y: by symmetry the crossing is at y = 100 - 200·(1/(1+0.5))·... — compute directly.
        const t = (0 - -50) / (100 - -50);              // param along the first diagonal to x=0
        const yCross = -100 + t * (100 - -100);
        expect(c.x).toBeCloseTo(0, 6);
        expect(c.y).toBeCloseTo(yCross, 6);
        // The bilinear answer would be the plain average of the corners — measurably different.
        const avgY = (-100 + -100 + 100 + 100) / 4;
        expect(Math.abs(c.y - avgY)).toBeGreaterThan(10);
    });

    it("keeps straight lines straight — the defining property of a homography", () => {
        const g = gridOf({ ...TRAP, projective: true });
        // Three collinear source points on the horizontal mid-line.
        const a = meshWarpPoint(-100, 0, W, H, g);
        const b = meshWarpPoint(0, 0, W, H, g);
        const c = meshWarpPoint(100, 0, W, H, g);
        const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
        expect(Math.abs(cross)).toBeLessThan(1e-6);
    });

    it("round-trips through the inverse, so hit-testing agrees with rendering", () => {
        const g = gridOf({ ...TRAP, projective: true });
        for (const [gx, gy] of [[-60, -40], [0, 0], [30, 70], [-90, 90], [80, -80]]) {
            const w = meshWarpPoint(gx, gy, W, H, g);
            const back = unmeshWarpPoint(w.x, w.y, W, H, g);
            expect(back.x).toBeCloseTo(gx, 4);
            expect(back.y).toBeCloseTo(gy, 4);
        }
    });
});

describe("cages without the flag are untouched", () => {
    it("stays bilinear — the centre is the average of the corners", () => {
        const g = gridOf(TRAP);
        const c = meshWarpPoint(0, 0, W, H, g);
        expect(c.x).toBeCloseTo(0, 9);
        expect(c.y).toBeCloseTo(0, 9);   // average of −100,−100,100,100
    });

    it("still round-trips", () => {
        const g = gridOf(TRAP);
        const w = meshWarpPoint(30, 70, W, H, g);
        const back = unmeshWarpPoint(w.x, w.y, W, H, g);
        expect(back.x).toBeCloseTo(30, 4);
        expect(back.y).toBeCloseTo(70, 4);
    });
});

describe("projective on a non-2×2 cage", () => {
    it("falls back to the mesh path rather than mis-mapping a dense grid", () => {
        const warp = { rows: 3, cols: 3, projective: true, points: [
            { x: -100, y: -100 }, { x: 0, y: -100 }, { x: 100, y: -100 },
            { x: -100, y: 0 }, { x: 0, y: -40 }, { x: 100, y: 0 },
            { x: -100, y: 100 }, { x: 0, y: 100 }, { x: 100, y: 100 },
        ] };
        const g = gridOf(warp);
        // The bulged centre control point must still be honoured (mesh behaviour).
        expect(meshWarpPoint(0, 0, W, H, g).y).toBeCloseTo(-40, 6);
    });
});

describe("an affine cage", () => {
    it("is handled without a divide-by-zero when the quad is a parallelogram", () => {
        const par = { corners: [{ x: -100, y: -100 }, { x: 120, y: -60 }, { x: 100, y: 100 }, { x: -120, y: 60 }], projective: true };
        const g = gridOf(par);
        const c = meshWarpPoint(0, 0, W, H, g);
        expect(c.x).toBeCloseTo(0, 6);
        expect(c.y).toBeCloseTo(0, 6);
        const back = unmeshWarpPoint(c.x, c.y, W, H, g);
        expect(back.x).toBeCloseTo(0, 4);
        expect(back.y).toBeCloseTo(0, 4);
    });
});
