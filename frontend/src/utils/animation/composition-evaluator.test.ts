import { describe, it, expect } from "bun:test";
import {
    evaluateCompositionAt,
    keyframeAnimationToTrack,
    resolveParentedPoses,
} from "./composition-evaluator";
import type { PropertyTrack, KeyframeAnimation } from "../../types/motion-types";

const mkEl = (id: string, x: number, y: number, w: number, h: number, extra: any = {}): any =>
    ({ id, x, y, width: w, height: h, angle: 0, ...extra });

describe("evaluateCompositionAt", () => {
    const posTrack: PropertyTrack = {
        elementId: "el1",
        property: "x",
        keys: [
            { t: 0, value: 0 },
            { t: 2, value: 100 },
        ],
    };

    it("returns nothing before any track exists", () => {
        expect(evaluateCompositionAt(1, []).size).toBe(0);
    });

    it("holds at the first keyframe before its time", () => {
        const r = evaluateCompositionAt(-5, [posTrack]);
        expect(r.get("el1")!.x).toBe(0);
    });

    it("holds at the last keyframe after its time", () => {
        const r = evaluateCompositionAt(10, [posTrack]);
        expect(r.get("el1")!.x).toBe(100);
    });

    it("linearly interpolates at the midpoint", () => {
        const r = evaluateCompositionAt(1, [posTrack]);
        expect(r.get("el1")!.x).toBeCloseTo(50, 6);
    });

    it("interpolates at an arbitrary time", () => {
        const r = evaluateCompositionAt(0.5, [posTrack]);
        expect(r.get("el1")!.x).toBeCloseTo(25, 6);
    });

    it("merges multiple properties of the same element into one entry", () => {
        const opacity: PropertyTrack = {
            elementId: "el1",
            property: "opacity",
            keys: [
                { t: 0, value: 100 },
                { t: 2, value: 0 },
            ],
        };
        const r = evaluateCompositionAt(1, [posTrack, opacity]);
        const s = r.get("el1")!;
        expect(s.x).toBeCloseTo(50, 6);
        expect(s.opacity).toBeCloseTo(50, 6);
    });

    it("interpolates color properties as hex", () => {
        const color: PropertyTrack = {
            elementId: "el2",
            property: "strokeColor",
            keys: [
                { t: 0, value: "#000000" },
                { t: 1, value: "#ffffff" },
            ],
        };
        const r = evaluateCompositionAt(0.5, [color]);
        expect(r.get("el2")!.strokeColor).toBe("#808080");
    });

    it("applies a named easing to the segment entering the right keyframe", () => {
        const eased: PropertyTrack = {
            elementId: "el3",
            property: "y",
            keys: [
                { t: 0, value: 0 },
                { t: 1, value: 100, easing: "easeInQuad" },
            ],
        };
        // easeInQuad(0.5) = 0.25 → value 25 (vs 50 linear)
        const r = evaluateCompositionAt(0.5, [eased]);
        expect(r.get("el3")!.y).toBeCloseTo(25, 4);
    });

    it("applies a per-segment bezier ease (bezier wins over named)", () => {
        const bez: PropertyTrack = {
            elementId: "el4",
            property: "y",
            keys: [
                { t: 0, value: 0 },
                // ease-in cubic-bezier(0.42,0,1,1): y(0.5) ≈ 0.316
                { t: 1, value: 100, ease: { ox: 0.42, oy: 0, ix: 1, iy: 1 } },
            ],
        };
        const r = evaluateCompositionAt(0.5, [bez]);
        expect(r.get("el4")!.y).toBeGreaterThan(20);
        expect(r.get("el4")!.y).toBeLessThan(45);
    });

    it("holds the previous value across a stepped (hold) segment, then jumps", () => {
        const held: PropertyTrack = {
            elementId: "el6",
            property: "x",
            keys: [
                { t: 0, value: 0 },
                { t: 2, value: 100, hold: true },
            ],
        };
        // Anywhere in [0,2) the value stays 0 (stepped), only reaching 100 at t=2.
        expect(evaluateCompositionAt(0.5, [held]).get("el6")!.x).toBe(0);
        expect(evaluateCompositionAt(1.99, [held]).get("el6")!.x).toBe(0);
        expect(evaluateCompositionAt(2, [held]).get("el6")!.x).toBe(100);
    });

    it("ease-out bezier decelerates: value(0.5) > 0.5 of the range", () => {
        const eased: PropertyTrack = {
            elementId: "el7",
            property: "y",
            keys: [
                { t: 0, value: 0 },
                // ease-out cubic-bezier(0,0,0.58,1): fast then slow → past halfway at t/2
                { t: 1, value: 100, ease: { ox: 0, oy: 0, ix: 0.58, iy: 1 } },
            ],
        };
        expect(evaluateCompositionAt(0.5, [eased]).get("el7")!.y).toBeGreaterThan(55);
    });

    it("handles a single-keyframe track as a constant", () => {
        const one: PropertyTrack = { elementId: "el5", property: "x", keys: [{ t: 3, value: 42 }] };
        expect(evaluateCompositionAt(0, [one]).get("el5")!.x).toBe(42);
        expect(evaluateCompositionAt(100, [one]).get("el5")!.x).toBe(42);
    });
});

describe("keyframeAnimationToTrack adapter", () => {
    it("lifts normalized offsets onto absolute seconds using delay + offset*duration", () => {
        const anim: KeyframeAnimation = {
            id: "a1",
            type: "keyframe",
            trigger: "on-load",
            duration: 2000,
            delay: 500,
            easing: "linear",
            property: "x",
            keyframes: [
                { offset: 0, value: 0 },
                { offset: 0.5, value: 50 },
                { offset: 1, value: 100 },
            ],
        };
        const track = keyframeAnimationToTrack("elX", anim);
        expect(track.property).toBe("x");
        expect(track.keys.map(k => k.t)).toEqual([0.5, 1.5, 2.5]);
        // Evaluated midway through the window (t=1.5) → value 50
        expect(evaluateCompositionAt(1.5, [track]).get("elX")!.x).toBeCloseTo(50, 6);
    });
});

describe("resolveParentedPoses — transform parenting", () => {
    it("a child with no own tracks follows its parent's translation", () => {
        const els = [
            mkEl("p", 0, 0, 100, 100),
            mkEl("c", 0, 0, 50, 50, { transformParentId: "p" }),
        ];
        const tracks: PropertyTrack[] = [
            { elementId: "p", property: "x", keys: [{ t: 0, value: 0 }, { t: 1, value: 200 }] },
        ];
        const poses = resolveParentedPoses(els, 1, tracks);
        expect(poses.get("c")!.x).toBeCloseTo(200, 4); // child dragged the full +200
        expect(poses.get("c")!.y).toBeCloseTo(0, 4);
    });

    it("a child orbits when its parent rotates about the parent's centre", () => {
        const els = [
            mkEl("p", 0, 0, 100, 100),                                  // centre (50,50)
            mkEl("c", 150, 25, 50, 50, { transformParentId: "p" }),     // centre (175,50), +125 in x of parent
        ];
        const tracks: PropertyTrack[] = [
            { elementId: "p", property: "angle", keys: [{ t: 0, value: 0 }, { t: 1, value: Math.PI / 2 }] },
        ];
        const c = resolveParentedPoses(els, 1, tracks).get("c")!;
        expect(c.angle).toBeCloseTo(Math.PI / 2, 3);   // child inherits the rotation
        expect(c.y as number).toBeGreaterThan(120);    // swung from y≈25 down to y≈150
    });

    it("composes a grandparent → parent → child chain additively", () => {
        const els = [
            mkEl("gp", 0, 0, 100, 100),
            mkEl("p", 0, 0, 100, 100, { transformParentId: "gp" }),
            mkEl("c", 0, 0, 50, 50, { transformParentId: "p" }),
        ];
        const tracks: PropertyTrack[] = [
            { elementId: "gp", property: "x", keys: [{ t: 0, value: 0 }, { t: 1, value: 100 }] },
            { elementId: "p", property: "x", keys: [{ t: 0, value: 0 }, { t: 1, value: 50 }] },
        ];
        const poses = resolveParentedPoses(els, 1, tracks);
        expect(poses.get("p")!.x).toBeCloseTo(150, 4); // 50 own + 100 from grandparent
        expect(poses.get("c")!.x).toBeCloseTo(150, 4); // inherits parent's total, no own motion
    });

    it("inherits parent scale (child grows with the parent)", () => {
        const els = [
            mkEl("p", 0, 0, 100, 100),
            mkEl("c", 0, 0, 50, 50, { transformParentId: "p" }),
        ];
        const tracks: PropertyTrack[] = [
            { elementId: "p", property: "width", keys: [{ t: 0, value: 100 }, { t: 1, value: 200 }] },
        ];
        const c = resolveParentedPoses(els, 1, tracks).get("c")!;
        expect(c.width).toBeCloseTo(100, 3); // 50 × 2
    });

    it("does not infinite-loop on a parent cycle", () => {
        const els = [
            mkEl("a", 0, 0, 100, 100, { transformParentId: "b" }),
            mkEl("b", 0, 0, 100, 100, { transformParentId: "a" }),
        ];
        const tracks: PropertyTrack[] = [
            { elementId: "a", property: "x", keys: [{ t: 0, value: 0 }, { t: 1, value: 50 }] },
        ];
        const poses = resolveParentedPoses(els, 1, tracks);
        expect(poses.has("a")).toBe(true);
        expect(poses.has("b")).toBe(true);
    });
});
