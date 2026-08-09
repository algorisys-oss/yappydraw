/**
 * Editing an anchor on a ROTATED path used to drag the rest of the shape with it.
 *
 * Re-normalizing a path's bbox moves the element's centre, and a rotated element is drawn
 * about that centre — so every untouched anchor swung by (I − R)·Δ. Reported as "after
 * rotating a shape, moving its anchor point moves the opposite side instead".
 *
 * The model here mirrors the real one: anchors are stored RELATIVE to the element origin, so
 * normalization re-bases them (`an − min`) while the origin absorbs the same shift, and the
 * correction is an extra translation of the origin. A test that instead pins a fixed world
 * point would be testing a different (and wrong) thing — translating the origin moves the
 * anchors with it.
 */

import { describe, it, expect } from "bun:test";
import { keepRotatedGeometryFixed, type BBox } from "./rotated-bbox";

interface Elem { box: BBox; anchors: { x: number; y: number }[]; }

/** Where anchor `i` lands on screen: C + R·(origin + an − C). */
const renderAnchor = (el: Elem, i: number, angle: number) => {
    const { box } = el;
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    const px = box.x + el.anchors[i].x, py = box.y + el.anchors[i].y;
    const dx = px - cx, dy = py - cy;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
};

/** What the app does after an edit: recompute the bbox, re-base the anchors. */
const normalize = (el: Elem, angle: number, correct: boolean): Elem => {
    const xs = el.anchors.map(a => a.x), ys = el.anchors.map(a => a.y);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const next: BBox = {
        x: el.box.x + minX, y: el.box.y + minY,
        width: Math.max(1, Math.max(...xs) - minX), height: Math.max(1, Math.max(...ys) - minY),
    };
    const origin = correct ? keepRotatedGeometryFixed(angle, el.box, next) : { x: next.x, y: next.y };
    return {
        box: { ...next, ...origin },
        anchors: el.anchors.map(a => ({ x: a.x - minX, y: a.y - minY })),
    };
};

const DEG = Math.PI / 180;
/** A rectangle-ish path: 4 anchors, origin at (100,100). */
const start = (): Elem => ({
    box: { x: 100, y: 100, width: 200, height: 120 },
    anchors: [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 120 }, { x: 0, y: 120 }],
});
/** Move one anchor, the way a node drag does (local coords). */
const moveAnchor = (el: Elem, i: number, dx: number, dy: number): Elem => ({
    box: { ...el.box },
    anchors: el.anchors.map((a, j) => (j === i ? { x: a.x + dx, y: a.y + dy } : { ...a })),
});

describe("keepRotatedGeometryFixed — the helper itself", () => {
    it("leaves an unrotated box alone; there is nothing to correct at 0°", () => {
        const prev: BBox = { x: 100, y: 100, width: 200, height: 120 };
        const next: BBox = { x: 140, y: 90, width: 260, height: 150 };
        expect(keepRotatedGeometryFixed(0, prev, next)).toEqual({ x: 140, y: 90 });
    });

    it("leaves it alone when the centre didn't move", () => {
        const prev: BBox = { x: 100, y: 100, width: 200, height: 120 };
        const next: BBox = { x: 90, y: 90, width: 220, height: 140 };   // grew symmetrically
        expect(keepRotatedGeometryFixed(45 * DEG, prev, next)).toEqual({ x: 90, y: 90 });
    });

    it("at 180° cancels twice the centre shift", () => {
        const prev: BBox = { x: 0, y: 0, width: 100, height: 100 };
        const next: BBox = { x: 0, y: 0, width: 140, height: 100 };     // centre moves +20 x
        const out = keepRotatedGeometryFixed(Math.PI, prev, next);
        expect(out.x).toBeCloseTo(-40, 9);
        expect(out.y).toBeCloseTo(0, 9);
    });

    it("only ever returns an origin — it never resizes", () => {
        const out = keepRotatedGeometryFixed(60 * DEG, { x: 0, y: 0, width: 100, height: 50 }, { x: 25, y: -10, width: 180, height: 90 });
        expect(Object.keys(out).sort()).toEqual(["x", "y"]);
    });
});

describe("dragging one anchor of a rotated path", () => {
    const UNTOUCHED = [0, 2, 3];

    it("leaves the other anchors exactly where they were, at every angle", () => {
        for (const deg of [0, 15, 30, 45, 90, 137, 180, 270, -30]) {
            const angle = deg * DEG;
            const before = start();
            const edited = normalize(moveAnchor(before, 1, 60, -40), angle, true);
            for (const i of UNTOUCHED) {
                const a = renderAnchor(before, i, angle);
                const b = renderAnchor(edited, i, angle);
                expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(0, 9);
            }
        }
    });

    it("moves the dragged anchor by exactly the drag, in the shape's own frame", () => {
        const angle = 30 * DEG;
        const before = start();
        const edited = normalize(moveAnchor(before, 1, 60, -40), angle, true);
        const a = renderAnchor(before, 1, angle);
        const b = renderAnchor(edited, 1, angle);
        // A local (60, −40) drag appears rotated on screen, but with the same length.
        expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(Math.hypot(60, 40), 9);
    });

    it("without the correction the untouched anchors visibly drift — the reported bug", () => {
        const angle = 30 * DEG;
        const before = start();
        const broken = normalize(moveAnchor(before, 1, 60, -40), angle, false);
        const drifts = UNTOUCHED.map(i => {
            const a = renderAnchor(before, i, angle);
            const b = renderAnchor(broken, i, angle);
            return Math.hypot(b.x - a.x, b.y - a.y);
        });
        for (const d of drifts) expect(d).toBeGreaterThan(4);
    });

    it("stays correct when the edit SHRINKS the box", () => {
        const angle = 40 * DEG;
        const before = start();
        const edited = normalize(moveAnchor(before, 1, -80, 0), angle, true);
        for (const i of UNTOUCHED) {
            const a = renderAnchor(before, i, angle);
            const b = renderAnchor(edited, i, angle);
            expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(0, 9);
        }
    });

    it("stays correct when the edit moves the ORIGIN (dragging the top-left out)", () => {
        const angle = 55 * DEG;
        const before = start();
        const edited = normalize(moveAnchor(before, 0, -50, -30), angle, true);
        for (const i of [1, 2, 3]) {
            const a = renderAnchor(before, i, angle);
            const b = renderAnchor(edited, i, angle);
            expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(0, 9);
        }
    });

    it("does not drift over many successive edits", () => {
        const angle = 33 * DEG;
        const before = start();
        let cur = before;
        for (let n = 0; n < 25; n++) {
            cur = normalize(moveAnchor(cur, 1, 4, -3), angle, true);
            cur = normalize(moveAnchor(cur, 1, -4, 3), angle, true);   // and back again
        }
        for (const i of UNTOUCHED) {
            const a = renderAnchor(before, i, angle);
            const b = renderAnchor(cur, i, angle);
            expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(0, 6);
        }
    });
});
