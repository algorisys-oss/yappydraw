/**
 * The frame clipboard: copy / cut / paste / duplicate a block of cels.
 *
 * The thing that actually matters here is INDEPENDENCE — a pasted cel must own
 * fresh elements, so drawing on it cannot reach back and change the cel it came
 * from. Yappy's cels hold real store elements (not pixels), and a paste that
 * copied ids instead of elements would look right on screen and silently link
 * the two cels forever.
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
const { copyFrames, cutFrames, pasteFrames, duplicateFrames, deleteFrames, hasFrameClipboard } =
    await import("./anim-ops");

const TOP = "top";
const BOT = "bot";

/** Two layers, each with one drawn cel at frame 0 held to frame 3. */
const setup = () => {
    setStore("docType", "animation" as any);
    // setStore MERGES objects, so null the timeline first or the previous test's
    // optional keys (markers, markIn, newCelFrames) survive into this one.
    setStore("animTimeline", null as any);
    setStore("layers", [
        { id: BOT, name: "Bottom", visible: true, locked: false, opacity: 1, order: 0, backgroundColor: "transparent" },
        { id: TOP, name: "Top", visible: true, locked: false, opacity: 1, order: 1, backgroundColor: "transparent" },
    ] as any);
    setStore("elements", [
        { id: "ballTop", type: "rectangle", layerId: TOP, x: 10, y: 10, width: 50, height: 50, angle: 0, seed: 1 },
        { id: "ballBot", type: "ellipse", layerId: BOT, x: 20, y: 20, width: 40, height: 40, angle: 0, seed: 2 },
    ] as any);
    setStore("animTimeline", {
        fps: 24, frameCount: 24,
        layers: [
            { layerId: TOP, keyframes: [{ frame: 0, elementIds: ["ballTop"] }], endFrame: 3 },
            { layerId: BOT, keyframes: [{ frame: 0, elementIds: ["ballBot"] }], endFrame: 3 },
        ],
    } as any);
    setStore("animCurrentFrame", 0);
    setStore("activeLayerId", TOP as any);
    setStore("selection", []);
    setStore("animFrameSelection", null);
};

const row = (layerId: string) => store.animTimeline!.layers.find(l => l.layerId === layerId)!;
const select = (layerIds: string[], from: number, to: number) => {
    const frames: number[] = [];
    for (let f = from; f <= to; f++) frames.push(f);
    setStore("animFrameSelection", { layerIds, frames });
};

afterAll(() => {
    setStore("docType", "infinite" as any);
    setStore("animTimeline", null as any);
    setStore("animFrameSelection", null);
    setStore("animCurrentFrame", 0);
    setStore("elements", [] as any);
    setStore("selection", []);
});

describe("copy + paste frames", () => {
    beforeEach(setup);

    it("refuses to copy when no frames are selected", () => {
        expect(copyFrames()).toBe(false);
    });

    it("pastes the copied cel at the target frame", () => {
        select([TOP], 0, 0);
        expect(copyFrames()).toBe(true);
        expect(pasteFrames(10)).toBe(true);
        expect(row(TOP).keyframes.map(k => k.frame)).toEqual([0, 10]);
    });

    it("gives the pasted cel its OWN elements — editing it cannot touch the source", () => {
        select([TOP], 0, 0);
        copyFrames();
        pasteFrames(10);
        const pastedIds = row(TOP).keyframes.find(k => k.frame === 10)!.elementIds;
        expect(pastedIds).not.toContain("ballTop");
        expect(pastedIds.length).toBe(1);

        // Move the pasted element; the original must not budge.
        setStore("elements", els => els.map(e => (e.id === pastedIds[0] ? { ...e, x: 999 } : e)));
        expect(store.elements.find(e => e.id === "ballTop")!.x).toBe(10);
        expect(store.elements.find(e => e.id === pastedIds[0])!.x).toBe(999);
    });

    it("copies a run of held frames as the cel that holds them", () => {
        select([TOP], 1, 3); // inside the span of the keyframe at 0
        copyFrames();
        pasteFrames(10);
        const pasted = row(TOP).keyframes.find(k => k.frame === 10)!;
        expect(pasted.elementIds.length).toBe(1);
    });

    it("spreads a two-row copy down from the anchor row", () => {
        select([TOP, BOT], 0, 1);
        copyFrames();
        setStore("animFrameSelection", { layerIds: [TOP], frames: [10] });
        expect(pasteFrames(10)).toBe(true);
        expect(row(TOP).keyframes.some(k => k.frame === 10)).toBe(true);
        expect(row(BOT).keyframes.some(k => k.frame === 10)).toBe(true);
    });

    it("overwrites what was in the destination range", () => {
        select([TOP], 0, 0);
        copyFrames();
        pasteFrames(10);
        const first = row(TOP).keyframes.find(k => k.frame === 10)!.elementIds[0];
        pasteFrames(10);
        const second = row(TOP).keyframes.find(k => k.frame === 10)!.elementIds[0];
        expect(second).not.toBe(first);
        expect(row(TOP).keyframes.filter(k => k.frame === 10).length).toBe(1);
        // The overwritten cel's element is gone from the store, not orphaned.
        expect(store.elements.some(e => e.id === first)).toBe(false);
    });

    it("does nothing when the clipboard is empty", () => {
        // hasFrameClipboard reflects earlier tests in this file, so assert on the
        // guard rather than the module-level flag.
        select([TOP], 0, 0);
        setStore("animTimeline", null as any);
        expect(pasteFrames(5)).toBe(false);
    });
});

describe("duplicate + delete frames", () => {
    beforeEach(setup);

    it("drops the duplicate immediately after the selection", () => {
        select([TOP], 0, 1);
        expect(duplicateFrames()).toBe(true);
        expect(row(TOP).keyframes.map(k => k.frame)).toEqual([0, 2]);
    });

    it("selects the duplicate so it can be dragged straight away", () => {
        select([TOP], 0, 1);
        duplicateFrames();
        expect(store.animFrameSelection!.frames).toEqual([2, 3]);
    });

    it("delete pulls the later cels left", () => {
        setStore("animTimeline", "layers", 0, "keyframes", [
            { frame: 0, elementIds: ["ballTop"] }, { frame: 4, elementIds: [] },
        ] as any);
        setStore("animTimeline", "layers", 0, "endFrame", 7);
        select([TOP], 1, 2);
        expect(deleteFrames()).toBe(true);
        expect(row(TOP).keyframes.map(k => k.frame)).toEqual([0, 2]);
    });

    it("shortens a cel when the cut only eats part of its span", () => {
        // The cel at 2 runs 2..5. Cutting two of its frames must shorten it, not
        // delete it — the drawing is still exposed on frames 2..3 afterwards.
        setStore("animTimeline", "layers", 0, "keyframes", [
            { frame: 0, elementIds: ["ballTop"] }, { frame: 2, elementIds: [] },
        ] as any);
        setStore("animTimeline", "layers", 0, "endFrame", 5);
        select([TOP], 2, 3);
        expect(cutFrames()).toBe(true);
        expect(row(TOP).keyframes.map(k => k.frame)).toEqual([0, 2]);
        expect(row(TOP).endFrame).toBe(3);
    });

    it("cut leaves the frames on the clipboard and removes them from the row", () => {
        setStore("animTimeline", "layers", 0, "keyframes", [
            { frame: 0, elementIds: ["ballTop"] }, { frame: 2, elementIds: [] },
        ] as any);
        setStore("animTimeline", "layers", 0, "endFrame", 3);
        select([TOP], 2, 3);
        expect(cutFrames()).toBe(true);
        expect(hasFrameClipboard()).toBe(true);
        expect(row(TOP).keyframes.map(k => k.frame)).toEqual([0]);
        expect(pasteFrames(8)).toBe(true);
        expect(row(TOP).keyframes.some(k => k.frame === 8)).toBe(true);
    });
});
