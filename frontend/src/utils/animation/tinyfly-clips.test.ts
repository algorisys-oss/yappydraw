import { describe, it, expect, beforeAll } from "bun:test";
import * as engine from "../../vendor/tinyfly/tinyfly-engine.js";
import {
    clipLocalTime,
    clipTargets,
    clipDurationMs,
    tinyflyValuesToOverrides,
    resolveClipBindings,
    unsupportedClipProperties,
    evaluateTinyflyClips,
    bakeTinyflyClip,
    tinyflyClipEnd,
    setTinyflyEngine,
} from "./tinyfly-clips";
import { evaluateCompositionAt, resolveParentedPoses, applyCompositionOverrides } from "./composition-evaluator";
import type { TinyflyClip } from "../../types/motion-types";

const mkEl = (id: string, x: number, y: number, w: number, h: number, extra: any = {}): any =>
    ({ id, x, y, width: w, height: h, angle: 0, opacity: 100, ...extra });

const kf = (target: string, property: string, a: any, b: any, ms = 1000, id = `${target}-${property}`) =>
    ({ id, target, property, keyframes: [{ time: 0, value: a }, { time: ms, value: b }] });

const clip = (tracks: any[], extra: Partial<TinyflyClip> = {}, config: any = {}): TinyflyClip => ({
    id: "c1", name: "clip", start: 0,
    definition: { id: "d", config, tracks } as any,
    bindings: { box: "el1" },
    ...extra,
});

beforeAll(() => setTinyflyEngine(engine as any));

describe("clipLocalTime", () => {
    const D = 1000;
    it("clamps before the start and holds the end when not looping", () => {
        const c = clip([], { start: 2 });
        expect(clipLocalTime(1, c, D)).toBe(0);
        expect(clipLocalTime(2.5, c, D)).toBe(500);
        expect(clipLocalTime(10, c, D)).toBe(D);
    });
    it("loops forever with loop -1, and N extra times with loop N", () => {
        expect(clipLocalTime(2.25, clip([], {}, { loop: -1 }), D)).toBeCloseTo(250, 6);
        const twice = clip([], {}, { loop: 1 });
        expect(clipLocalTime(1.25, twice, D)).toBeCloseTo(250, 6);
        expect(clipLocalTime(5, twice, D)).toBe(D);
    });
    it("plays odd iterations backwards when alternate, and ends where the last one ends", () => {
        const yoyo = clip([], {}, { loop: 1, alternate: true });
        expect(clipLocalTime(1.25, yoyo, D)).toBeCloseTo(750, 6);
        expect(clipLocalTime(9, yoyo, D)).toBe(0);
    });
    it("holds during repeatDelay and scales by speed", () => {
        const delayed = clip([], {}, { loop: -1, repeatDelay: 500 });
        expect(clipLocalTime(1.2, delayed, D)).toBe(D);
        expect(clipLocalTime(1.75, delayed, D)).toBeCloseTo(250, 6);
        expect(clipLocalTime(0.25, clip([], {}, { speed: 2 }), D)).toBeCloseTo(500, 6);
    });
    it("is 0 for a zero-length clip", () => {
        expect(clipLocalTime(3, clip([]), 0)).toBe(0);
    });
});

describe("clip metadata", () => {
    it("lists targets in order of first appearance, including staggered target lists", () => {
        const c = clip([kf("b", "x", 0, 1), { ...kf("a", "y", 0, 1), targets: ["a", "c"] }, kf("b", "y", 0, 1)]);
        expect(clipTargets(c.definition)).toEqual(["b", "a", "c"]);
    });
    it("uses the definition's duration, else the engine's computed one", () => {
        expect(clipDurationMs(clip([kf("box", "x", 0, 1, 1500)]).definition)).toBe(1500);
        expect(clipDurationMs(clip([kf("box", "x", 0, 1, 1500)], {}, { duration: 900 }).definition)).toBe(900);
    });
    it("reports properties Yappy cannot apply", () => {
        const c = clip([kf("box", "x", 0, 1), kf("box", "rotateX", 0, 1), kf("box", "borderRadius", 0, 1)]);
        expect(unsupportedClipProperties(c.definition)).toEqual(["borderRadius", "rotateX"]);
    });
});

describe("tinyflyClipEnd", () => {
    it("is start + every play (and delay) at speed, and one cycle for an endless loop", () => {
        const tr = [kf("box", "x", 0, 1, 1000)];
        expect(tinyflyClipEnd(clip(tr, { start: 2 }))).toBe(3);
        expect(tinyflyClipEnd(clip(tr, {}, { loop: 2, repeatDelay: 500, speed: 2 }))).toBe(2); // (3 plays × 1000 + 2 delays × 500) ms ÷ 2
        expect(tinyflyClipEnd(clip(tr, { start: 1 }, { loop: -1 }))).toBe(2);
        expect(tinyflyClipEnd(clip(tr, { enabled: false }))).toBe(0);
    });
});

describe("tinyflyValuesToOverrides", () => {
    const el = mkEl("el1", 100, 50, 80, 40, { angle: 0.5, backgroundColor: "#fff" });
    it("treats x/y/rotate as offsets from the stored element, like tinyfly on the DOM", () => {
        const o = tinyflyValuesToOverrides(el, new Map<string, any>([["x", 20], ["y", -10], ["rotate", 90]]));
        expect(o.x).toBe(120);
        expect(o.y).toBe(40);
        expect(o.angle).toBeCloseTo(0.5 + Math.PI / 2, 9);
    });
    it("adds motion path position and rotation", () => {
        const o = tinyflyValuesToOverrides(el, new Map<string, any>([["x", 5], ["motionPathX", 30], ["motionPathY", 7], ["motionPathRotate", 45]]));
        expect(o.x).toBe(135);
        expect(o.y).toBe(57);
        expect(o.angle).toBeCloseTo(0.5 + Math.PI / 4, 9);
    });
    it("scales about the (moved) centre", () => {
        const o = tinyflyValuesToOverrides(el, new Map<string, any>([["x", 10], ["scale", 2], ["scaleY", 0.5]]));
        expect(o.width).toBe(160);
        expect(o.height).toBe(40);
        expect(o.x! + o.width! / 2).toBe(100 + 10 + 40); // centre moved by x only
        expect(o.y! + o.height! / 2).toBe(50 + 20);
    });
    it("maps opacity 0–1 to 0–100 and colours, stroke, size, blur and text", () => {
        const o = tinyflyValuesToOverrides(el, new Map<string, any>([
            ["opacity", 0.25], ["fill", "#ff0000"], ["stroke", "#00ff00"], ["strokeWidth", 3],
            ["width", 200], ["blur", 4], ["text", "hi"],
        ]));
        expect(o).toMatchObject({ opacity: 25, backgroundColor: "#ff0000", strokeColor: "#00ff00", strokeWidth: 3, width: 200, filterBlur: 4, containerText: "hi" });
        expect(tinyflyValuesToOverrides(mkEl("t", 0, 0, 10, 10, { type: "text", text: "a" }), new Map([["text", "b"]])).text).toBe("b");
    });
});

describe("resolveClipBindings", () => {
    const els = [mkEl("rect-1", 0, 0, 1, 1), mkEl("rect-2", 0, 0, 1, 1, { name: "sun" }), mkEl("rect-3", 0, 0, 1, 1)];
    const def = clip([kf("rect-1", "x", 0, 1), kf("sun", "x", 0, 1), kf("moon", "x", 0, 1), kf("star", "x", 0, 1)]).definition;
    it("binds by explicit map, then element id, then element name, then selection order", () => {
        const r = resolveClipBindings(def, els, ["rect-3"], { star: "rect-1" });
        expect(r.bindings).toEqual({ star: "rect-1", "rect-1": "rect-1", sun: "rect-2", moon: "rect-3" });
        expect(r.unbound).toEqual([]);
    });
    it("reports targets it could not bind, and ignores explicit ids that do not exist", () => {
        const r = resolveClipBindings(def, els, [], { star: "nope" });
        expect(r.unbound).toEqual(["moon", "star"]);
    });
});

describe("evaluateTinyflyClips", () => {
    const els = [mkEl("el1", 100, 100, 50, 50), mkEl("kid", 200, 100, 20, 20, { transformParentId: "el1" })];
    const c = clip([kf("box", "x", 0, 200), kf("box", "rotate", 0, 90), kf("box", "opacity", 1, 0)]);

    it("evaluates bound targets at the playhead", () => {
        const o = evaluateTinyflyClips(0.5, [c], els).get("el1")!;
        expect(o.x).toBeCloseTo(200, 6);
        expect(o.angle).toBeCloseTo(Math.PI / 4, 6);
        expect(o.opacity).toBeCloseTo(50, 6);
    });
    it("skips disabled clips and unbound targets", () => {
        expect(evaluateTinyflyClips(0.5, [{ ...c, enabled: false }], els).size).toBe(0);
        expect(evaluateTinyflyClips(0.5, [{ ...c, bindings: {} }], els).size).toBe(0);
    });
    it("settles a spring on its target", () => {
        const s = clip([{ id: "s", kind: "spring", target: "box", property: "y", spring: { from: 0, to: 100 } }]);
        expect(evaluateTinyflyClips(5, [s], els).get("el1")!.y).toBeCloseTo(200, 3);
    });
    it("feeds transform parenting: a child follows a clip-animated parent", () => {
        const extra = evaluateTinyflyClips(1, [clip([kf("box", "x", 0, 100)])], els);
        const posed = resolveParentedPoses(els, 1, [], extra);
        expect(posed.get("kid")!.x).toBeCloseTo(300, 6);
        const states = new Map<string, any>();
        applyCompositionOverrides(states, els, 1, [], extra);
        expect(states.get("kid").x).toBeCloseTo(300, 6);
        expect(states.get("el1").x).toBeCloseTo(200, 6);
    });
});

describe("bakeTinyflyClip", () => {
    it("produces keyframe tracks that match the live clip", () => {
        const els = [mkEl("el1", 100, 100, 50, 50)];
        const c = clip([
            { id: "x", target: "box", property: "x", keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 200, easing: "ease-in-out" }] },
            kf("box", "rotate", 0, 90),
            kf("box", "fill", "#ff0000", "#0000ff"),
        ]);
        const tracks = bakeTinyflyClip(c, els, 30);
        for (const t of [0, 0.2, 0.37, 0.5, 0.81, 1]) {
            const live = evaluateTinyflyClips(t, [c], els).get("el1")!;
            const baked = evaluateCompositionAt(t, tracks).get("el1")!;
            expect(Math.abs((baked.x as number) - (live.x as number))).toBeLessThan(1);
            expect(Math.abs((baked.angle as number) - (live.angle as number))).toBeLessThan(Math.PI / 180);
        }
        const x = tracks.find(tr => tr.property === "x")!;
        expect(x.keys.length).toBeLessThan(31); // collinear samples simplified away
        expect(tracks.find(tr => tr.property === "backgroundColor")).toBeTruthy();
    });
});
