import { describe, it, expect } from "bun:test";
import {
    evaluateTimelineAt,
    activeKeyframeIndex,
    clipLocalFrame,
    evaluateSymbolTimelineAt,
    samplePolyline,
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

describe("evaluateTimelineAt — shape tweens", () => {
    const rect = el("s1", { x: 100, y: 100, width: 100, height: 100, type: 'rectangle', contentId: "m" });
    const circ = el("s2", { x: 100, y: 100, width: 100, height: 100, type: 'circle', contentId: "m" });
    const elements = [rect, circ];
    const timeline = tl([layer("L", [
        { frame: 0, elementIds: ["s1"], tween: 'shape', easing: 'linear' },
        { frame: 10, elementIds: ["s2"] },
    ], 10)]);

    it("emits interpolated outline points mid-span, distinct from both endpoints", () => {
        const at2 = evaluateTimelineAt(2, timeline, elements).overrides["s1"];
        const at8 = evaluateTimelineAt(8, timeline, elements).overrides["s1"];
        expect(at2.points).toBeDefined();
        expect(at2.points!.length).toBe(64);
        expect(at8.points!.length).toBe(64);
        // The outline actually morphs over the span
        const d = at2.points!.reduce((s, p, i) => s + Math.hypot(p.x - at8.points![i].x, p.y - at8.points![i].y), 0);
        expect(d).toBeGreaterThan(1);
    });

    it("still lerps pose alongside the morph", () => {
        const moved = el("s3", { x: 300, y: 100, width: 100, height: 100, type: 'circle', contentId: "m2" });
        const from = el("s0", { x: 100, y: 100, width: 100, height: 100, type: 'rectangle', contentId: "m2" });
        const t = tl([layer("L", [
            { frame: 0, elementIds: ["s0"], tween: 'shape', easing: 'linear' },
            { frame: 10, elementIds: ["s3"] },
        ], 10)]);
        const mid = evaluateTimelineAt(5, t, [from, moved]).overrides["s0"];
        expect(mid.x).toBeCloseTo(200, 0);
        expect(mid.points).toBeDefined();
    });

    it("degrades to a plain motion tween for point-native types (draw, line…)", () => {
        const a = el("d1", { type: 'draw', x: 0, contentId: "d" });
        const b = el("d2", { type: 'draw', x: 100, contentId: "d" });
        const t = tl([layer("L", [
            { frame: 0, elementIds: ["d1"], tween: 'shape', easing: 'linear' },
            { frame: 10, elementIds: ["d2"] },
        ], 10)]);
        const mid = evaluateTimelineAt(5, t, [a, b]).overrides["d1"];
        expect(mid.points).toBeUndefined();
        expect(mid.x).toBeCloseTo(50, 0);
    });
});

describe("motion guides", () => {
    // A straight horizontal guide line from (100,300) to (500,300):
    const guide = el("g1", { type: 'line', x: 100, y: 300, width: 400, height: 0, points: [{ x: 0, y: 0 }, { x: 400, y: 0 }] });
    const from = el("m1", { x: 0, y: 0, width: 40, height: 40, contentId: "gm" });
    const to = el("m2", { x: 900, y: 900, width: 40, height: 40, contentId: "gm" });
    const timeline = (orient = false) => tl([layer("L", [
        { frame: 0, elementIds: ["m1"], tween: 'motion', easing: 'linear', guideId: "g1", guideOrient: orient },
        { frame: 10, elementIds: ["m2"] },
    ], 10)]);

    it("centers the element on the guide path instead of lerping straight", () => {
        const mid = evaluateTimelineAt(5, timeline(), [guide, from, to]).overrides["m1"];
        expect(mid.x!).toBeCloseTo(300 - 20, 0); // path midpoint (300,300), centered
        expect(mid.y!).toBeCloseTo(300 - 20, 0);
        const nearEnd = evaluateTimelineAt(9, timeline(), [guide, from, to]).overrides["m1"];
        expect(nearEnd.x!).toBeCloseTo(100 + 0.9 * 400 - 20, 0);
    });

    it("orient rotates along the path tangent", () => {
        const mid = evaluateTimelineAt(5, timeline(true), [guide, from, to]).overrides["m1"];
        expect(mid.angle!).toBeCloseTo(0, 3); // horizontal line → 0 rad
        const noOrient = evaluateTimelineAt(5, timeline(false), [guide, from, to]).overrides["m1"];
        expect(noOrient.angle).toBeUndefined();
    });

    it("missing guide element falls back to the plain lerp", () => {
        const mid = evaluateTimelineAt(5, timeline(), [from, to]).overrides["m1"];
        expect(mid.x!).toBeCloseTo(450, 0); // straight lerp 0→900
    });
});

describe("pose tweens (stick figures)", () => {
    const figA = el("f1", { type: 'stickRig', contentId: "fig", stickRig: { clip: 'walk', playing: false, previewPhase: 0.2 } });
    const figB = el("f2", { type: 'stickRig', contentId: "fig", stickRig: { clip: 'walk', playing: false, previewPhase: 0.8 } });
    const mkTl = (b: any) => tl([layer("L", [
        { frame: 0, elementIds: ["f1"], tween: 'motion', easing: 'linear' },
        { frame: 10, elementIds: [b.id] },
    ], 10)]);

    it("same clip: the cycle phase glides between the cels, pinned", () => {
        const mid = evaluateTimelineAt(5, mkTl(figB), [figA, figB]).overrides["f1"] as any;
        expect(mid.stickRig).toBeDefined();
        expect(mid.stickRig.previewPhase).toBeCloseTo(0.5, 5);
        expect(mid.stickRig.playing).toBe(false);
        expect(mid.stickRig.blendTo).toBeUndefined();
    });

    it("different clips: emits a cross-clip blend for the renderer", () => {
        const figWave = el("f3", { type: 'stickRig', contentId: "fig", stickRig: { clip: 'wave', playing: false, previewPhase: 0.4 } });
        const mid = evaluateTimelineAt(5, mkTl(figWave), [figA, figWave]).overrides["f1"] as any;
        expect(mid.stickRig.blendTo).toEqual({ clip: 'wave', phase: 0.4, f: 0.5 });
        expect(mid.stickRig.clip).toBe('walk');
        expect(mid.stickRig.playing).toBe(false);
    });

    it("lerpRigPose blends resolved joint positions", async () => {
        const { lerpRigPose } = await import("../../library/stick-figures/anim/rig");
        const { poseAt } = await import("../../library/stick-figures/anim/clips");
        const a = poseAt('idle', 0, 1);
        const b = poseAt('wave', 0.5, 1);
        const mid = lerpRigPose(a, b, 0.5);
        const ja = a.joints.get('foreArmR')!, jb = b.joints.get('foreArmR')!, jm = mid.joints.get('foreArmR')!;
        expect(jm.x).toBeCloseTo((ja.x + jb.x) / 2, 5);
        expect(jm.y).toBeCloseTo((ja.y + jb.y) / 2, 5);
    });
});

describe("evaluateCameraAt", () => {
    const { evaluateCameraAt } = require("./frame-timeline-evaluator");
    const cam = (camera: any) => ({ fps: 24, frameCount: 24, layers: [], camera });

    it("lerps between keys and holds outside the range", () => {
        const t = cam([
            { frame: 0, x: 100, y: 100, zoom: 1, easing: 'linear' },
            { frame: 10, x: 300, y: 200, zoom: 2 },
        ]);
        expect(evaluateCameraAt(5, t)).toEqual({ x: 200, y: 150, zoom: 1.5 });
        expect(evaluateCameraAt(0, t)).toEqual({ x: 100, y: 100, zoom: 1 });
        expect(evaluateCameraAt(20, t)).toEqual({ x: 300, y: 200, zoom: 2 });
    });

    it("null without camera keys; single key holds everywhere", () => {
        expect(evaluateCameraAt(5, cam(undefined))).toBeNull();
        expect(evaluateCameraAt(5, cam([{ frame: 8, x: 50, y: 60, zoom: 1.2 }]))).toEqual({ x: 50, y: 60, zoom: 1.2 });
    });
});

describe("samplePolyline", () => {
    const pts = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }];
    it("walks by arc length with tangents", () => {
        expect(samplePolyline(pts, 0)).toEqual({ x: 0, y: 0, angle: 0 });
        expect(samplePolyline(pts, 0.5).x).toBeCloseTo(100, 5);
        expect(samplePolyline(pts, 0.5).y).toBeCloseTo(0, 5);
        const end = samplePolyline(pts, 1);
        expect(end.x).toBeCloseTo(100, 5);
        expect(end.y).toBeCloseTo(100, 5);
        expect(samplePolyline(pts, 0.75).angle).toBeCloseTo(Math.PI / 2, 5);
    });
    it("handles degenerate inputs", () => {
        expect(samplePolyline([], 0.5)).toEqual({ x: 0, y: 0, angle: 0 });
        expect(samplePolyline([{ x: 5, y: 6 }], 0.5)).toEqual({ x: 5, y: 6, angle: 0 });
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
