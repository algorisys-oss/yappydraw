/**
 * Timing tools: cel exposure, split-on-N, and the document's default cel length.
 *
 * `newCelFrames` is the one that changes daily use — with it at 2, drawing a
 * sequence gives you twos without pressing F5 between every drawing. It has to
 * ripple the cels after it (Callipeg's "push neighbours" default), otherwise the
 * new cel would silently eat the timing of the one that followed it.
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

const { store, setStore } = await import("./app-store");
const { insertKeyframe, insertBlankKeyframe, setNewCelFrames, setCelDuration, splitFrames, insertInbetween } =
    await import("./anim-ops");

const L = "L";
const row = () => store.animTimeline!.layers[0];

const setup = (newCelFrames?: number) => {
    setStore("docType", "animation" as any);
    // setStore MERGES objects, so null the timeline first or the previous test's
    // optional keys (markers, markIn, newCelFrames) survive into this one.
    setStore("animTimeline", null as any);
    setStore("layers", [
        { id: L, name: "Layer 1", visible: true, locked: false, opacity: 1, order: 0, backgroundColor: "transparent" },
    ] as any);
    setStore("elements", [
        { id: "ball", type: "rectangle", layerId: L, x: 0, y: 0, width: 50, height: 50, angle: 0, seed: 1 },
    ] as any);
    setStore("animTimeline", {
        fps: 24, frameCount: 48,
        layers: [{ layerId: L, keyframes: [{ frame: 0, elementIds: ["ball"] }], endFrame: 11 }],
        ...(newCelFrames !== undefined && { newCelFrames }),
    } as any);
    setStore("animCurrentFrame", 0);
    setStore("activeLayerId", L as any);
    setStore("selection", []);
    setStore("animFrameSelection", null);
};

const select = (from: number, to: number) => {
    const frames: number[] = [];
    for (let f = from; f <= to; f++) frames.push(f);
    setStore("animFrameSelection", { layerIds: [L], frames });
};

afterAll(() => {
    setStore("docType", "infinite" as any);
    setStore("animTimeline", null as any);
    setStore("animFrameSelection", null);
    setStore("animCurrentFrame", 0);
    setStore("elements", [] as any);
    setStore("selection", []);
});

describe("default cel exposure (shoot on twos)", () => {
    it("leaves cels one frame long by default", () => {
        setup();
        insertKeyframe(L, 4);
        insertBlankKeyframe(L, 5);
        expect(row().keyframes.map(k => k.frame)).toEqual([0, 4, 5]);
    });

    it("makes an F6 cel `newCelFrames` long", () => {
        setup(2);
        insertKeyframe(L, 4);
        insertKeyframe(L, 6);
        expect(row().keyframes.map(k => k.frame)).toEqual([0, 4, 6]);
        expect(row().endFrame).toBe(13); // two extra held frames added
    });

    it("makes an F7 blank cel `newCelFrames` long too", () => {
        setup(3);
        insertBlankKeyframe(L, 4);
        insertBlankKeyframe(L, 7);
        expect(row().keyframes.map(k => k.frame)).toEqual([0, 4, 7]);
    });

    it("pushes the following cel right instead of overwriting its timing", () => {
        setup(4);
        setStore("animTimeline", "layers", 0, "keyframes", [
            { frame: 0, elementIds: ["ball"] }, { frame: 6, elementIds: [] },
        ] as any);
        insertBlankKeyframe(L, 2);
        // The cel that was at 6 moves to 9 — the new 4-frame cel took 2..5.
        expect(row().keyframes.map(k => k.frame)).toEqual([0, 2, 9]);
    });

    it("clamps the setting to a sane range", () => {
        setup();
        setNewCelFrames(0);
        // Clamps to 1 — which IS the default, so it stays unset rather than
        // writing a redundant key into the document.
        expect(store.animTimeline!.newCelFrames ?? 1).toBe(1);
        setNewCelFrames(999);
        expect(store.animTimeline!.newCelFrames).toBe(60);
    });
});

describe("cel duration + split", () => {
    beforeEach(() => setup());

    it("sets the exposure of the selected cel", () => {
        setStore("animTimeline", "layers", 0, "keyframes", [
            { frame: 0, elementIds: ["ball"] }, { frame: 2, elementIds: [] },
        ] as any);
        select(0, 0);
        expect(setCelDuration(6)).toBe(true);
        expect(row().keyframes.map(k => k.frame)).toEqual([0, 6]);
    });

    it("refuses when nothing is selected", () => {
        expect(setCelDuration(4)).toBe(false);
        expect(splitFrames(2)).toBe(false);
        expect(insertInbetween()).toBe(false);
    });

    it("split on 2s re-exposes the range and registers every new drawing", () => {
        select(0, 7);
        expect(splitFrames(2)).toBe(true);
        expect(row().keyframes.map(k => k.frame)).toEqual([0, 2, 4, 6]);
        // Each new cel owns a real element that exists in the store.
        const ids = row().keyframes.flatMap(k => k.elementIds);
        expect(ids.length).toBe(4);
        for (const id of ids) expect(store.elements.some(e => e.id === id)).toBe(true);
    });

    it("split on 1s gives one cel per frame", () => {
        setStore("animTimeline", "layers", 0, "keyframes", [{ frame: 0, elementIds: [] }] as any);
        select(0, 5);
        expect(splitFrames(1)).toBe(true);
        expect(row().keyframes.map(k => k.frame)).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it("drops an in-between in the middle of the selected span", () => {
        setStore("animTimeline", "layers", 0, "keyframes", [
            { frame: 0, elementIds: ["ball"] }, { frame: 8, elementIds: [] },
        ] as any);
        select(0, 0);
        expect(insertInbetween()).toBe(true);
        expect(row().keyframes.map(k => k.frame)).toEqual([0, 4, 8]);
    });
});
