/**
 * Editing a shape mid-tween must land on a cel of its own.
 *
 * Reported as "the shape shows a selection outline but the resize handles don't
 * respond". Two halves to that: the handles were HIT-TESTED against the raw
 * store while being DRAWN from the tweened pose (covered in
 * utils/animation/frame-pose.test.ts), and even once they line up, the elements
 * under the pointer belong to the span's LEFT keyframe — so a drag would edit
 * that cel and the tween would re-interpolate the shape out from under the
 * cursor. `splitTweenAtPlayhead` gives the edit its own keyframe, holding the
 * exact pose that was on screen, which is what makes the drag WYSIWYG.
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
const { splitTweenAtPlayhead, animPosedElements, animVisibleIds } = await import("./anim-ops");

const LAYER = "L";

/** A motion tween from frame 0 → 10: a 100×100 box at the origin grows to
 *  300×300 at (200,200). Frame 5 is the midpoint of the span. */
const setupTween = (tween: "none" | "motion" | "shape" = "motion") => {
    setStore("docType", "animation" as any);
    setStore("layers", [
        { id: LAYER, name: "Layer 1", visible: true, locked: false, opacity: 1, order: 0, backgroundColor: "transparent" },
    ] as any);
    // setStore MERGES by array index, so the function form (which replaces) is
    // required — otherwise the extra element a previous split added survives.
    setStore("elements", () => [
        { id: "a", contentId: "box", type: "rectangle", layerId: LAYER, x: 0, y: 0, width: 100, height: 100, angle: 0, opacity: 100, seed: 1 },
        { id: "b", contentId: "box", type: "rectangle", layerId: LAYER, x: 200, y: 200, width: 300, height: 300, angle: 0, opacity: 100, seed: 1 },
    ] as any);
    setStore("animTimeline", () => ({
        fps: 24, frameCount: 24,
        layers: [{
            layerId: LAYER,
            keyframes: [
                // Always a concrete TweenKind — never an omitted key. setStore MERGES,
                // and it skips undefined rather than deleting, so an omitted `tween`
                // would inherit the previous test's 'motion'.
                { frame: 0, elementIds: ["a"], tween },
                { frame: 10, elementIds: ["b"] },
            ],
            endFrame: 23,
        }],
    } as any));
    setStore("animCurrentFrame", 5);
    setStore("selection", ["a"]);
    setStore("selectedTool", "selection" as any);
};

// Bun shares one module registry across test files — put the store back as found
// so animation state doesn't leak into other suites.
afterAll(() => {
    setStore("docType", "infinite" as any);
    setStore("animTimeline", null as any);
    setStore("animCurrentFrame", 0);
    setStore("elements", [] as any);
    setStore("selection", []);
    setStore("selectedTool", "selection" as any);
});

describe("splitTweenAtPlayhead", () => {
    beforeEach(() => setupTween());

    it("inserts a keyframe at the playhead", () => {
        splitTweenAtPlayhead(["a"]);
        const frames = store.animTimeline!.layers[0].keyframes.map(k => k.frame);
        expect(frames).toEqual([0, 5, 10]);
    });

    it("the new cel holds the exact pose that was on screen — nothing jumps", () => {
        // Midpoint of the span: x/y 0→200, w/h 100→300.
        const remap = splitTweenAtPlayhead(["a"]);
        const newId = remap.get("a")!;
        const el = store.elements.find(e => e.id === newId)!;
        expect(el.x).toBe(100);
        expect(el.y).toBe(100);
        expect(el.width).toBe(200);
        expect(el.height).toBe(200);
    });

    it("after the split the playhead sits ON a keyframe, so posing is a no-op", () => {
        // This is what lets every downstream capture/drag path stay unaware of
        // animation: once split, the store pose IS the drawn pose.
        splitTweenAtPlayhead(["a"]);
        expect(animPosedElements()).toBe(store.elements);
    });

    it("leaves the span's original keyframes untouched", () => {
        splitTweenAtPlayhead(["a"]);
        const a = store.elements.find(e => e.id === "a")!;
        const b = store.elements.find(e => e.id === "b")!;
        expect([a.x, a.y, a.width, a.height]).toEqual([0, 0, 100, 100]);
        expect([b.x, b.y, b.width, b.height]).toEqual([200, 200, 300, 300]);
    });

    it("remaps the old id to the new cel's id so the selection can follow", () => {
        const remap = splitTweenAtPlayhead(["a"]);
        const newId = remap.get("a");
        expect(newId).toBeDefined();
        expect(newId).not.toBe("a");
        expect(store.elements.some(e => e.id === newId)).toBe(true);
    });
});

describe("splitTweenAtPlayhead does nothing when there is nothing to split", () => {
    it("no-ops when the playhead is already on a keyframe", () => {
        setupTween();
        setStore("animCurrentFrame", 0);
        expect(splitTweenAtPlayhead(["a"]).size).toBe(0);
        expect(store.animTimeline!.layers[0].keyframes).toHaveLength(2);
    });

    it("no-ops on a held span — with no tween the store pose is already what's drawn", () => {
        setupTween("none");
        expect(splitTweenAtPlayhead(["a"]).size).toBe(0);
        expect(store.animTimeline!.layers[0].keyframes).toHaveLength(2);
    });

    it("no-ops on a shape tween — a morphed outline has no faithful cel form", () => {
        setupTween("shape");
        expect(splitTweenAtPlayhead(["a"]).size).toBe(0);
        expect(store.animTimeline!.layers[0].keyframes).toHaveLength(2);
    });

    it("no-ops when the span owns none of the given ids", () => {
        setupTween();
        expect(splitTweenAtPlayhead(["somethingElse"]).size).toBe(0);
        expect(store.animTimeline!.layers[0].keyframes).toHaveLength(2);
    });

    it("no-ops outside animation mode", () => {
        setupTween();
        setStore("docType", "infinite" as any);
        expect(splitTweenAtPlayhead(["a"]).size).toBe(0);
    });
});

describe("the per-frame caches invalidate when the timeline changes under a still playhead", () => {
    /**
     * These memos key on (timeline revision, frame). They used to key on the
     * timeline's OBJECT IDENTITY, which Solid preserves across a structural edit
     * because setStore merges into the existing proxy — so they only looked
     * correct as long as the frame changed at the same time. Splitting a span
     * mid-drag is the first edit that leaves the playhead where it is, and the
     * stale visibility set made `canInteractWithElement` reject the brand-new
     * cel's element: the drag silently refused to move anything.
     */
    it("visibility follows the new cel without the playhead moving", () => {
        setupTween();
        expect([...animVisibleIds()!]).toEqual(["a"]);

        const frameBefore = store.animCurrentFrame;
        const remap = splitTweenAtPlayhead(["a"]);
        expect(store.animCurrentFrame).toBe(frameBefore); // playhead did NOT move

        expect([...animVisibleIds()!]).toEqual([remap.get("a")!]);
    });

    it("posed elements follow the new cel without the playhead moving", () => {
        setupTween();
        // Warm the cache at this frame first — that is what used to go stale.
        expect(animPosedElements().find(e => e.id === "a")!.width).toBe(200);

        splitTweenAtPlayhead(["a"]);
        // Frame 5 is now a keyframe, so nothing is overridden any more.
        expect(animPosedElements()).toBe(store.elements);
    });
});
