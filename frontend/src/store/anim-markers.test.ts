/**
 * Ruler markers, the mark in/out play range, and flipping cel-to-cel.
 *
 * The distinction that earns markers their own model: a keyframe LABEL belongs
 * to a cel and moves when the cel is retimed, a MARKER belongs to the ruler and
 * stays put. Retiming a cel must not drag the marker with it.
 */

import { describe, it, expect, mock, beforeEach, afterAll } from "bun:test";

mock.module("../components/toast", () => ({ showToast: () => { } }));
mock.module("sweetalert2", () => ({
    default: { fire: async () => ({ isConfirmed: false }), close: () => { } },
}));

const stubNode = (): any => ({
    style: {}, dataset: {},
    setAttribute: () => { }, getAttribute: () => null, removeAttribute: () => { },
    appendChild: (c: any) => c, removeChild: () => { }, remove: () => { },
    addEventListener: () => { }, removeEventListener: () => { },
    classList: { add: () => { }, remove: () => { }, contains: () => false, toggle: () => { } },
    querySelector: () => null, querySelectorAll: () => [],
});

global.window = {
    innerWidth: 1024, innerHeight: 768,
    addEventListener: () => { }, removeEventListener: () => { },
    setTimeout: (globalThis as any).setTimeout, clearTimeout: (globalThis as any).clearTimeout,
} as any;
global.localStorage = { getItem: () => null, setItem: () => { } } as any;
global.crypto = { randomUUID: () => "uuid-" + Math.random() } as any;
global.document = {
    documentElement: { ...stubNode(), setAttribute: () => { } },
    head: stubNode(), body: stubNode(),
    createElement: () => stubNode(), createElementNS: () => stubNode(), createTextNode: () => stubNode(),
    getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
    addEventListener: () => { }, removeEventListener: () => { },
} as any;
(globalThis as any).cancelAnimationFrame = () => { };
(globalThis as any).requestAnimationFrame = () => 0;

const { store, setStore } = await import("./app-store");
const { setMarker, removeMarker, setMarkRange, stepCel, stepMarker, moveKeyframe, gotoFrame } =
    await import("./anim-ops");
const { stopAnimation } = await import("../utils/animation/anim-playback");

const L = "L";
const tlOf = () => store.animTimeline!;

const setup = () => {
    setStore("docType", "animation" as any);
    // setStore MERGES an object into the live one, so a fresh timeline that simply
    // omits `markers`/`markIn` would inherit the previous test's. Null it first.
    setStore("animTimeline", null as any);
    setStore("layers", [
        { id: L, name: "Layer 1", visible: true, locked: false, opacity: 1, order: 0, backgroundColor: "transparent" },
    ] as any);
    setStore("elements", [] as any);
    setStore("animTimeline", {
        fps: 24, frameCount: 24,
        layers: [{
            layerId: L, endFrame: 23,
            keyframes: [{ frame: 0, elementIds: [] }, { frame: 6, elementIds: [] }, { frame: 14, elementIds: [] }],
        }],
    } as any);
    setStore("animCurrentFrame", 0);
    setStore("activeLayerId", L as any);
    setStore("animFrameSelection", null);
    setStore("selection", []);
};

afterAll(() => {
    setStore("docType", "infinite" as any);
    setStore("animTimeline", null as any);
    setStore("animFrameSelection", null);
    setStore("animCurrentFrame", 0);
    setStore("elements", [] as any);
});

describe("markers", () => {
    beforeEach(setup);

    it("drops a marker at the playhead by default", () => {
        setStore("animCurrentFrame", 9);
        setMarker("key pose");
        expect(tlOf().markers).toEqual([{ frame: 9, name: "key pose" }]);
    });

    it("stays on its frame when the cel under it is retimed", () => {
        setMarker("beat", 6);
        moveKeyframe(L, 6, 10);
        expect(tlOf().markers![0].frame).toBe(6);
        expect(tlOf().layers[0].keyframes.some(k => k.frame === 10)).toBe(true);
    });

    it("removes a marker", () => {
        setMarker("x", 4);
        removeMarker(4);
        expect(tlOf().markers).toBeUndefined();
    });

    it("clamps a marker to the ruler", () => {
        setMarker("late", 999);
        expect(tlOf().markers![0].frame).toBe(23);
    });
});

describe("play range", () => {
    beforeEach(setup);

    it("marks in and out independently", () => {
        setMarkRange(4, null);
        expect(tlOf().markIn).toBe(4);
        setMarkRange(null, 12);
        expect([tlOf().markIn, tlOf().markOut]).toEqual([4, 12]);
    });

    it("clears back to the whole timeline", () => {
        setMarkRange(4, 12);
        setMarkRange(null, null);
        expect(tlOf().markIn).toBeUndefined();
        expect(tlOf().markOut).toBeUndefined();
    });

    it("Stop rewinds to the range start, not to frame 1", () => {
        setMarkRange(8, 16);
        gotoFrame(12);
        stopAnimation();
        expect(store.animCurrentFrame).toBe(8);
    });

    it("Stop still rewinds to frame 1 with no range set", () => {
        gotoFrame(12);
        stopAnimation();
        expect(store.animCurrentFrame).toBe(0);
    });
});

describe("flipping", () => {
    beforeEach(setup);

    it("steps cel to cel, skipping the held frames between them", () => {
        gotoFrame(2);
        stepCel(1);
        expect(store.animCurrentFrame).toBe(6);
        stepCel(1);
        expect(store.animCurrentFrame).toBe(14);
    });

    it("steps back to the previous cel", () => {
        gotoFrame(14);
        stepCel(-1);
        expect(store.animCurrentFrame).toBe(6);
    });

    it("holds still at the ends instead of wrapping", () => {
        gotoFrame(14);
        stepCel(1);
        expect(store.animCurrentFrame).toBe(14);
        gotoFrame(0);
        stepCel(-1);
        expect(store.animCurrentFrame).toBe(0);
    });

    it("steps marker to marker", () => {
        setMarker("a", 3);
        setMarker("b", 17);
        gotoFrame(0);
        stepMarker(1);
        expect(store.animCurrentFrame).toBe(3);
        stepMarker(1);
        expect(store.animCurrentFrame).toBe(17);
        stepMarker(-1);
        expect(store.animCurrentFrame).toBe(3);
    });
});
