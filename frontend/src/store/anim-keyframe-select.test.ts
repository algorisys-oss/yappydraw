/**
 * F6 (Insert Keyframe) must leave you able to actually move the copy it just made.
 *
 * The point of F6 is "duplicate the previous cel so you can nudge it" — the tutorial
 * literally says *press F6 … drag the copy to the floor*. As shipped, the copies landed
 * unselected with whatever tool was armed, and Yappy's default tool is the Ink Brush, so
 * the state after F6 was: a brush in your hand and nothing selected. Adobe Animate does
 * not switch tools on F6 either, but ITS default tool is Selection — same rule, different
 * starting state, different outcome.
 *
 * F7 (blank keyframe) must NOT do this: a blank cel means you are about to draw.
 * And the scripting API's `insertKeyframe` must stay a pure timeline edit — a script
 * should not have the user's tool yanked out from under it.
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
const { insertKeyframeAndSelect, insertKeyframe, insertBlankKeyframe } = await import("./anim-ops");

const LAYER = "L";

/** One layer holding a single drawn element on frame 0 — the state you're in after
 *  drawing on frame 1 and stepping the playhead forward to add the next pose. */
const setupAnimation = (tool: string) => {
    setStore("docType", "animation" as any);
    setStore("layers", [
        { id: LAYER, name: "Layer 1", visible: true, locked: false, opacity: 1, order: 0, backgroundColor: "transparent" },
    ] as any);
    setStore("elements", [
        { id: "ball", type: "rectangle", layerId: LAYER, x: 0, y: 0, width: 50, height: 50, angle: 0, seed: 1 },
    ] as any);
    setStore("animTimeline", {
        fps: 24, frameCount: 24,
        layers: [{ layerId: LAYER, keyframes: [{ frame: 0, elementIds: ["ball"] }], endFrame: 23 }],
    } as any);
    setStore("animCurrentFrame", 0);
    setStore("selection", []);
    setStore("selectedTool", tool as any);
};

// Bun shares one module registry across test files, so `store` here is the SAME object
// app-store.test.ts uses. Leaving docType on 'animation' sends its selectAll() down the
// cel-visibility branch, which filters out elements this file never registered — two
// green tests over there turn red for a reason that has nothing to do with them. Put the
// store back the way it was found.
afterAll(() => {
    setStore("docType", "infinite" as any);
    setStore("animTimeline", null as any);
    setStore("animCurrentFrame", 0);
    setStore("elements", [] as any);
    setStore("selection", []);
    setStore("selectedTool", "selection" as any);
});

describe("F6 hands you the copies, ready to move", () => {
    beforeEach(() => setupAnimation("inkbrush"));

    it("switches to the Select tool — the default Ink Brush cannot drag the copy", () => {
        insertKeyframeAndSelect(LAYER, 10);
        expect(store.selectedTool).toBe("selection");
    });

    it("selects exactly the newly duplicated elements", () => {
        const ids = insertKeyframeAndSelect(LAYER, 10);
        expect(ids.length).toBeGreaterThan(0);
        expect([...store.selection].sort()).toEqual([...ids].sort());
    });

    it("does not select the source cel's element, only the copy", () => {
        const ids = insertKeyframeAndSelect(LAYER, 10);
        expect(ids).not.toContain("ball");
        expect(store.selection).not.toContain("ball");
    });

    it("leaves the Lasso tool alone — it can already act on a selection", () => {
        setupAnimation("lasso");
        insertKeyframeAndSelect(LAYER, 10);
        expect(store.selectedTool).toBe("lasso");
        expect(store.selection.length).toBeGreaterThan(0);
    });

    it("keeps the Select tool when it was already active", () => {
        setupAnimation("selection");
        insertKeyframeAndSelect(LAYER, 10);
        expect(store.selectedTool).toBe("selection");
    });
});

describe("what F6's selection behaviour must NOT touch", () => {
    beforeEach(() => setupAnimation("inkbrush"));

    it("F7 (blank keyframe) keeps your drawing tool — you are about to draw", () => {
        insertBlankKeyframe(LAYER, 10);
        expect(store.selectedTool).toBe("inkbrush");
    });

    it("the scripting API's insertKeyframe stays a pure timeline edit", () => {
        // Yappy.insertKeyframe() must not reach over and change the user's tool.
        const ids = insertKeyframe(LAYER, 10);
        expect(ids.length).toBeGreaterThan(0);
        expect(store.selectedTool).toBe("inkbrush");
        expect(store.selection).toEqual([]);
    });
});
