import { describe, it, expect } from "bun:test";
import { constrainToAngle, snapAngleRad } from "./angle-constrain";

describe("constrainToAngle", () => {
    it("near-horizontal drag snaps to 0° and flattens y (15° step)", () => {
        const c = constrainToAngle(100, 100, 300, 120); // ~5.7° → 0°
        expect(c.angleDeg).toBe(0);
        expect(c.y).toBeCloseTo(100, 6);        // flattened onto the anchor's row
        expect(c.x).toBeCloseTo(100 + Math.hypot(200, 20), 6); // distance preserved
    });

    it("45° drag with a 45° step lands exactly (down-right → −45°)", () => {
        const c = constrainToAngle(0, 0, 10, 10, 45); // screen y down → below
        expect(c.x).toBeCloseTo(10, 6);
        expect(c.y).toBeCloseTo(10, 6);
        expect(c.angleDeg).toBe(-45);
    });

    it("near-vertical upward drag snaps to +90° (15° step)", () => {
        const c = constrainToAngle(0, 0, 2, -100); // ~−88.9° screen → −90° → up
        expect(c.angleDeg).toBe(90);
        expect(c.x).toBeCloseTo(0, 6);
        expect(c.y).toBeCloseTo(-Math.hypot(2, 100), 6);
    });

    it("leftward drag → 180°", () => {
        const c = constrainToAngle(0, 0, -100, 3, 15);
        expect(c.angleDeg).toBe(180);
        expect(c.y).toBeCloseTo(0, 6);
    });

    it("zero-length drag is returned unchanged", () => {
        const c = constrainToAngle(50, 50, 50, 50);
        expect(c).toEqual({ x: 50, y: 50, angleDeg: 0 });
    });
});

describe("snapAngleRad", () => {
    it("snaps radians to the nearest 15° increment", () => {
        const deg20 = 20 * Math.PI / 180;
        expect(snapAngleRad(deg20, 15)).toBeCloseTo(15 * Math.PI / 180, 9); // 20° → 15°
        const deg40 = 40 * Math.PI / 180;
        expect(snapAngleRad(deg40, 15)).toBeCloseTo(45 * Math.PI / 180, 9); // 40° → 45°
    });

    it("step ≤ 0 is a no-op", () => {
        expect(snapAngleRad(1.234, 0)).toBe(1.234);
    });
});
