import { describe, it, expect } from "bun:test";
import { setAnchorHandle } from "./anchor-handle";
import type { PathAnchor } from "../types";

/** A smooth anchor with an existing pair: out points right (len 30), in mirrors it. */
const smooth = (): PathAnchor => ({ x: 0, y: 0, kind: 'smooth', outX: 30, outY: 0, inX: -30, inY: 0 });

describe("setAnchorHandle — mirroring", () => {
    it("mirrors the opposite handle in direction", () => {
        const a = smooth();
        setAnchorHandle(a, 'out', 0, 40); // swing the out handle to straight down
        expect(a.outX).toBeCloseTo(0, 9);
        expect(a.outY).toBeCloseTo(40, 9);
        expect(a.inX).toBeCloseTo(0, 9);
        expect(a.inY).toBeCloseTo(-30, 9); // opposite direction...
    });

    it("keeps the opposite handle's OWN length by default (editing an existing anchor)", () => {
        const a: PathAnchor = { x: 0, y: 0, kind: 'smooth', outX: 30, outY: 0, inX: -80, inY: 0 };
        setAnchorHandle(a, 'out', 0, 40);
        // The in handle turned to stay opposite but kept its length of 80 — the segment on
        // that side is not retensioned by touching this one.
        expect(Math.hypot(a.inX!, a.inY!)).toBeCloseTo(80, 9);
        expect(a.inY).toBeCloseTo(-80, 9);
    });

    it("matches lengths when symmetric (drawing a fresh anchor with the Pen)", () => {
        const a: PathAnchor = { x: 0, y: 0, kind: 'smooth', outX: 30, outY: 0, inX: -80, inY: 0 };
        setAnchorHandle(a, 'out', 0, 40, { symmetric: true });
        expect(Math.hypot(a.inX!, a.inY!)).toBeCloseTo(40, 9);
    });

    it("mirrors symmetrically from a fresh anchor that has no opposite handle yet", () => {
        const a: PathAnchor = { x: 0, y: 0, kind: 'smooth' };
        setAnchorHandle(a, 'out', 12, -9); // length 15
        expect(a.inX).toBeCloseTo(-12, 9);
        expect(a.inY).toBeCloseTo(9, 9);
    });

    it("works the same dragging the in handle", () => {
        const a = smooth();
        setAnchorHandle(a, 'in', 0, 50);
        expect(a.inY).toBeCloseTo(50, 9);
        expect(a.outY).toBeCloseTo(-30, 9);
    });

    it("leaves the opposite handle alone on a zero-length drag (no direction to mirror)", () => {
        const a = smooth();
        setAnchorHandle(a, 'out', 0, 0);
        expect(a.inX).toBe(-30);
        expect(a.inY).toBe(0);
        expect(Number.isNaN(a.inX!)).toBe(false);
    });
});

describe("setAnchorHandle — breaking the pair (Alt)", () => {
    it("moves only the dragged handle", () => {
        const a = smooth();
        setAnchorHandle(a, 'out', 0, 40, { breakPair: true });
        expect(a.outY).toBeCloseTo(40, 9);
        expect(a.inX).toBe(-30); // untouched — this is the cusp
        expect(a.inY).toBe(0);
    });

    it("demotes to a corner so the break survives the next un-Alted drag", () => {
        const a = smooth();
        setAnchorHandle(a, 'out', 0, 40, { breakPair: true });
        expect(a.kind).toBe('corner');

        // Without the demotion this second drag would re-mirror and silently undo the cusp.
        setAnchorHandle(a, 'out', 10, 10);
        expect(a.inX).toBe(-30);
        expect(a.inY).toBe(0);
    });

    it("is a no-op on the pairing for an anchor that is already a corner", () => {
        const a: PathAnchor = { x: 0, y: 0, kind: 'corner', outX: 5, outY: 5 };
        setAnchorHandle(a, 'out', 1, 2);
        expect(a.outX).toBe(1);
        expect(a.outY).toBe(2);
        expect(a.inX).toBeUndefined(); // no phantom opposite handle invented
        expect(a.kind).toBe('corner');
    });
});
