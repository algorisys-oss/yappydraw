import { describe, it, expect } from "bun:test";
import {
    buildSymmetryTransforms, buildSymmetryOps, symmetryInstanceCount, symmetryAxisAngles,
    applyTransform, ringRadii, MAX_RADIAL_COUNT, defaultSymmetryState,
    type SymmetryTransform,
} from "./symmetry";

const det = (t: SymmetryTransform) => t.m00 * t.m11 - t.m01 * t.m10;

/** Matrix product of two transforms about a shared centre. */
const compose = (a: SymmetryTransform, b: SymmetryTransform): SymmetryTransform => ({
    m00: a.m00 * b.m00 + a.m01 * b.m10,
    m01: a.m00 * b.m01 + a.m01 * b.m11,
    m10: a.m10 * b.m00 + a.m11 * b.m10,
    m11: a.m10 * b.m01 + a.m11 * b.m11,
    cx: a.cx, cy: a.cy,
});

const sameMatrix = (a: SymmetryTransform, b: SymmetryTransform) =>
    Math.abs(a.m00 - b.m00) < 1e-9 && Math.abs(a.m01 - b.m01) < 1e-9 &&
    Math.abs(a.m10 - b.m10) < 1e-9 && Math.abs(a.m11 - b.m11) < 1e-9;

describe("kaleidoscope symmetry (dihedral D_n)", () => {
    it("produces 2n instances — n rotations and n reflections", () => {
        expect(symmetryInstanceCount("kaleidoscope", 6)).toBe(12);
        expect(symmetryInstanceCount("kaleidoscope", 2)).toBe(4);

        const ts = buildSymmetryTransforms("kaleidoscope", 0, 0, 6);
        expect(ts).toHaveLength(12);
        expect(ts.filter(t => det(t) > 0)).toHaveLength(6);   // rotations
        expect(ts.filter(t => det(t) < 0)).toHaveLength(6);   // reflections
    });

    it("is a closed group — composing any two instances lands back in the set", () => {
        // This is what makes a mandala look right. An unclosed set draws some wedges
        // twice and leaves others empty.
        const ts = buildSymmetryTransforms("kaleidoscope", 0, 0, 5, 0.3);
        for (const a of ts) {
            for (const b of ts) {
                const p = compose(a, b);
                expect(ts.some(t => sameMatrix(t, p))).toBe(true);
            }
        }
    });

    it("mirrors each wedge about the base spoke — the difference from plain radial", () => {
        // With angle 0 the base spoke is the x-axis, so the orbit of any point must
        // also contain that point reflected across y = cy.
        const [cx, cy] = [100, 100];
        const ts = buildSymmetryTransforms("kaleidoscope", cx, cy, 8);
        const orbit = ts.map(t => applyTransform(t, cx + 60, cy + 25));
        const hit = orbit.some(p => Math.abs(p.x - (cx + 60)) < 1e-9 && Math.abs(p.y - (cy - 25)) < 1e-9);
        expect(hit).toBe(true);

        // Plain radial has no such mirror — that orbit is rotations only.
        const rad = buildSymmetryTransforms("radial", cx, cy, 8)
            .map(t => applyTransform(t, cx + 60, cy + 25));
        expect(rad.some(p => Math.abs(p.x - (cx + 60)) < 1e-9 && Math.abs(p.y - (cy - 25)) < 1e-9)).toBe(false);
    });

    it("ops list matches the transform list minus the identity", () => {
        // The two functions are separate expressions of the same group (ops clone vector
        // elements, transforms map raw points). They must agree or the live copies and
        // the guides disagree about where the wedges are.
        const n = 7;
        const ops = buildSymmetryOps("kaleidoscope", n, 0.2);
        expect(ops).toHaveLength(2 * n - 1);
        expect(ops.filter(o => o.kind === "rotate")).toHaveLength(n - 1);
        expect(ops.filter(o => o.kind === "reflect")).toHaveLength(n);

        const [cx, cy] = [0, 0];
        const pt = { x: 40, y: 17 };
        const fromOps = ops.map(o => o.kind === "rotate"
            ? applyTransform({ m00: Math.cos(o.theta), m01: -Math.sin(o.theta), m10: Math.sin(o.theta), m11: Math.cos(o.theta), cx, cy }, pt.x, pt.y)
            : applyTransform({ m00: Math.cos(2 * o.phi), m01: Math.sin(2 * o.phi), m10: Math.sin(2 * o.phi), m11: -Math.cos(2 * o.phi), cx, cy }, pt.x, pt.y));
        fromOps.push(pt); // the drawn element is the identity instance

        const fromTransforms = buildSymmetryTransforms("kaleidoscope", cx, cy, n, 0.2)
            .map(t => applyTransform(t, pt.x, pt.y));

        for (const p of fromTransforms) {
            expect(fromOps.some(q => Math.abs(q.x - p.x) < 1e-9 && Math.abs(q.y - p.y) < 1e-9)).toBe(true);
        }
        expect(fromOps).toHaveLength(fromTransforms.length);
    });

    it("draws 2n guide rays, evenly spaced by π/n", () => {
        const n = 6;
        const rays = symmetryAxisAngles("kaleidoscope", n).map(a => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
        expect(rays).toHaveLength(2 * n);
        rays.sort((a, b) => a - b);
        for (let i = 1; i < rays.length; i++) expect(rays[i] - rays[i - 1]).toBeCloseTo(Math.PI / n, 9);
    });

    it("clamps the spoke count like radial does", () => {
        expect(symmetryInstanceCount("kaleidoscope", 1)).toBe(4);   // floor of 2 sectors
        expect(buildSymmetryTransforms("kaleidoscope", 0, 0, 0.4)).toHaveLength(4);
    });
});

describe("spoke count ceiling", () => {
    it("allows the 32- and 36-petal counts coloring pages use", () => {
        expect(MAX_RADIAL_COUNT).toBe(36);
    });
});

describe("ring guides", () => {
    it("are evenly spaced circles counted outward from the centre", () => {
        expect(ringRadii(3, 80)).toEqual([80, 160, 240]);
        expect(ringRadii(1, 55)).toEqual([55]);
    });

    it("are off by default and produce nothing when disabled", () => {
        expect(defaultSymmetryState().rings).toBe(0);
        expect(ringRadii(0, 80)).toEqual([]);
        expect(ringRadii(-2, 80)).toEqual([]);
    });

    it("ignores a non-positive spacing rather than stacking circles on the centre", () => {
        expect(ringRadii(4, 0)).toEqual([]);
        expect(ringRadii(4, -10)).toEqual([]);
    });

    it("caps the ring count so a stray value can't emit thousands of circles", () => {
        expect(ringRadii(9999, 10)).toHaveLength(24);
    });
});
