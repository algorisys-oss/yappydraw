import { describe, it, expect } from "bun:test";
import {
    evaluateTimelineAt,
    activeKeyframeIndex,
    clipLocalFrame,
    evaluateSymbolTimelineAt,
} from "./frame-timeline-evaluator";
import type { AnimTimeline, AnimLayer } from "../../types/anim-types";

const el = (id: string, extra: any = {}): any => ({
    id, type: 'rectangle', x: 0, y: 0, width: 100, height: 100, angle: 0, opacity: 100, ...extra,
});

const layer = (layerId: string, keyframes: AnimLayer['keyframes'], endFrame: number): AnimLayer =>
    ({ layerId, keyframes, endFrame });

const tl = (layers: AnimLayer[], fps = 24, frameCount = 24): AnimTimeline => ({ fps, frameCount, layers });

describe("activeKeyframeIndex", () => {
    const l = layer("L", [
        { frame: 0, elementIds: ["a"] },
        { frame: 5, elementIds: ["b"] },
        { frame: 10, elementIds: [] },
    ], 15);

    it("resolves spans [kf.frame, next.frame)", () => {
        expect(activeKeyframeIndex(l, 0)).toBe(0);
        expect(activeKeyframeIndex(l, 4)).toBe(0);
        expect(activeKeyframeIndex(l, 5)).toBe(1);
        expect(activeKeyframeIndex(l, 9)).toBe(1);
        expect(activeKeyframeIndex(l, 10)).toBe(2);
    });

    it("holds the last keyframe through endFrame, nothing beyond", () => {
        expect(activeKeyframeIndex(l, 15)).toBe(2);
        expect(activeKeyframeIndex(l, 16)).toBe(-1);
    });

    it("returns -1 before the first keyframe and for empty rows", () => {
        const late = layer("L", [{ frame: 3, elementIds: ["a"] }], 10);
        expect(activeKeyframeIndex(late, 2)).toBe(-1);
        expect(activeKeyframeIndex(late, 3)).toBe(0);
        expect(activeKeyframeIndex(layer("L", [], 10), 0)).toBe(-1);
    });
});

describe("evaluateTimelineAt — visibility (cel model)", () => {
    const elements = [el("a"), el("b"), el("c")];
    const timeline = tl([
        layer("L1", [{ frame: 0, elementIds: ["a"] }, { frame: 5, elementIds: ["b"] }], 9),
        layer("L2", [{ frame: 2, elementIds: ["c"] }], 6),
    ]);

    it("shows only the active keyframe's elements per row", () => {
        expect([...evaluateTimelineAt(0, timeline, elements).visible]).toEqual(["a"]);
        expect([...evaluateTimelineAt(3, timeline, elements).visible].sort()).toEqual(["a", "c"]);
        expect([...evaluateTimelineAt(5, timeline, elements).visible].sort()).toEqual(["b", "c"]);
        expect([...evaluateTimelineAt(8, timeline, elements).visible]).toEqual(["b"]); // L2 row ended
    });

    it("blank keyframes hide the row's content", () => {
        const t = tl([layer("L", [
            { frame: 0, elementIds: ["a"] },
            { frame: 4, elementIds: [] },
        ], 9)]);
        expect(evaluateTimelineAt(4, t, elements).visible.size).toBe(0);
        expect(evaluateTimelineAt(3, t, elements).visible.size).toBe(1);
    });

    it("records each element's owning-keyframe start frame (placement)", () => {
        const ev = evaluateTimelineAt(7, timeline, elements);
        expect(ev.placement.get("b")).toBe(5);
    });
});

describe("evaluateTimelineAt — motion tweens", () => {
    const from = el("k1", { x: 0, y: 0, width: 100, contentId: "ball" });
    const to = el("k2", { x: 100, y: 50, width: 200, contentId: "ball" });
    const elements = [from, to];
    const timeline = tl([
        layer("L", [
            { frame: 0, elementIds: ["k1"], tween: 'motion', easing: 'linear' },
            { frame: 10, elementIds: ["k2"] },
        ], 10),
    ]);

    it("lerps matched pose props across the span (linear)", () => {
        const ev = evaluateTimelineAt(5, timeline, elements);
        expect(ev.overrides["k1"].x).toBe(50);
        expect(ev.overrides["k1"].y).toBe(25);
        expect(ev.overrides["k1"].width).toBe(150);
    });

    it("has no override at the span start, and shows the next keyframe's element at its frame", () => {
        expect(evaluateTimelineAt(0, timeline, elements).overrides["k1"]).toBeUndefined();
        const at10 = evaluateTimelineAt(10, timeline, elements);
        expect([...at10.visible]).toEqual(["k2"]);
        expect(at10.overrides["k2"]).toBeUndefined();
    });

    it("rounds tweened dims to 0.5px (rough-cache stability)", () => {
        const t = tl([layer("L", [
            { frame: 0, elementIds: ["k1"], tween: 'motion', easing: 'linear' },
            { frame: 3, elementIds: ["k2"] },
        ], 3)]);
        const w = evaluateTimelineAt(1, t, elements).overrides["k1"].width!;
        expect(w * 2).toBe(Math.round(w * 2));
    });

    it("holds unmatched elements (no contentId partner)", () => {
        const lone = el("solo", { x: 0 });
        const t = tl([layer("L", [
            { frame: 0, elementIds: ["solo"], tween: 'motion' },
            { frame: 10, elementIds: ["k2"] },
        ], 10)]);
        const ev = evaluateTimelineAt(5, t, [lone, to]);
        expect(ev.overrides["solo"]).toBeUndefined();
        expect(ev.visible.has("solo")).toBe(true);
    });

    it("interpolates hex colors", () => {
        const c1 = el("c1", { backgroundColor: "#000000", contentId: "q" });
        const c2 = el("c2", { backgroundColor: "#ffffff", contentId: "q" });
        const t = tl([layer("L", [
            { frame: 0, elementIds: ["c1"], tween: 'motion', easing: 'linear' },
            { frame: 2, elementIds: ["c2"] },
        ], 2)]);
        const bg = evaluateTimelineAt(1, t, [c1, c2]).overrides["c1"].backgroundColor!;
        expect(bg.toLowerCase()).not.toBe("#000000");
        expect(bg.startsWith("#")).toBe(true);
    });

    it("applies bezier easing from the span-leaving keyframe", () => {
        const t = tl([layer("L", [
            // ease-in-ish curve: slow start
            { frame: 0, elementIds: ["k1"], tween: 'motion', ease: { ox: 0.9, oy: 0, ix: 1, iy: 1 } },
            { frame: 10, elementIds: ["k2"] },
        ], 10)]);
        const eased = evaluateTimelineAt(5, t, elements).overrides["k1"].x as number;
        expect(eased).toBeLessThan(50); // slower than linear at midpoint
    });

    it("spans without tween don't produce overrides", () => {
        const t = tl([layer("L", [
            { frame: 0, elementIds: ["k1"] },
            { frame: 10, elementIds: ["k2"] },
        ], 10)]);
        expect(Object.keys(evaluateTimelineAt(5, t, elements).overrides).length).toBe(0);
    });
});

describe("clipLocalFrame", () => {
    it("loop wraps around the clip length", () => {
        expect(clipLocalFrame(0, 0, 4, 'loop')).toBe(0);
        expect(clipLocalFrame(3, 0, 4, 'loop')).toBe(3);
        expect(clipLocalFrame(4, 0, 4, 'loop')).toBe(0);
        expect(clipLocalFrame(9, 2, 4, 'loop')).toBe(3); // placed at 2 → local 7 % 4
    });

    it("once clamps at the last frame", () => {
        expect(clipLocalFrame(10, 0, 4, 'once')).toBe(3);
        expect(clipLocalFrame(2, 0, 4, 'once')).toBe(2);
    });

    it("single pins to firstFrame", () => {
        expect(clipLocalFrame(99, 0, 4, 'single', 2)).toBe(2);
    });

    it("firstFrame offsets the local clock", () => {
        expect(clipLocalFrame(0, 0, 4, 'loop', 2)).toBe(2);
        expect(clipLocalFrame(2, 0, 4, 'loop', 2)).toBe(0); // 2+2 wraps
        expect(clipLocalFrame(5, 0, 4, 'once', 2)).toBe(3);
    });

    it("clamps out-of-range firstFrame and guards zero-length clips", () => {
        expect(clipLocalFrame(0, 0, 4, 'single', 99)).toBe(3);
        expect(clipLocalFrame(5, 0, 0, 'loop')).toBe(0);
    });
});

describe("evaluateSymbolTimelineAt", () => {
    it("falls back to all-elements-visible for symbols without a timeline (graphic)", () => {
        const sym: any = { id: "s", name: "s", width: 10, height: 10, elements: [el("a"), el("b")] };
        const ev = evaluateSymbolTimelineAt(3, sym);
        expect([...ev.visible].sort()).toEqual(["a", "b"]);
    });

    it("evaluates a movieclip's own timeline against its def elements", () => {
        const sym: any = {
            id: "s", name: "s", width: 10, height: 10,
            elements: [el("a"), el("b")],
            kind: 'movieclip',
            timeline: tl([layer("L", [
                { frame: 0, elementIds: ["a"] },
                { frame: 2, elementIds: ["b"] },
            ], 3)], 24, 4),
        };
        expect([...evaluateSymbolTimelineAt(0, sym).visible]).toEqual(["a"]);
        expect([...evaluateSymbolTimelineAt(2, sym).visible]).toEqual(["b"]);
    });
});
