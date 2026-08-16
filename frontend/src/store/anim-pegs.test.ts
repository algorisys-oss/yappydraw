/**
 * Out of pegs — sliding a cel's ONION GHOST without moving the drawing.
 *
 * The whole feature is defined by what it must NOT do: pegging a cel cannot
 * change a single element, or it stops being a display aid and becomes an edit.
 * These tests exist mostly to hold that line.
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
const { setPeg, startPegEdit, endPegEdit, resetAllPegs } = await import("./anim-ops");
const { pegAt } = await import("../utils/animation/frame-timeline-ops");

const L = "L";
const PEG = { x: 30, y: -12, angle: 0.3, scale: 1.25 };
const kfs = () => store.animTimeline!.layers[0].keyframes;

const setup = () => {
    setStore("docType", "animation" as any);
    setStore("animTimeline", null as any);
    setStore("layers", [
        { id: L, name: "Layer 1", visible: true, locked: false, opacity: 1, order: 0, backgroundColor: "transparent" },
    ] as any);
    setStore("elements", [
        { id: "head", type: "ellipse", layerId: L, x: 100, y: 100, width: 40, height: 40, angle: 0, seed: 1 },
        { id: "head2", type: "ellipse", layerId: L, x: 160, y: 100, width: 40, height: 40, angle: 0, seed: 2 },
    ] as any);
    setStore("animTimeline", {
        fps: 24, frameCount: 24,
        layers: [{
            layerId: L, endFrame: 11,
            keyframes: [{ frame: 0, elementIds: ["head"] }, { frame: 6, elementIds: ["head2"] }],
        }],
    } as any);
    setStore("animCurrentFrame", 0);
    setStore("activeLayerId", L as any);
    setStore("animOnion", { enabled: false, before: 2, after: 2 } as any);
    setStore("animPegEdit", null);
};

afterAll(() => {
    setStore("docType", "infinite" as any);
    setStore("animTimeline", null as any);
    setStore("animPegEdit", null);
    setStore("elements", [] as any);
    setStore("animOnion", { enabled: false, before: 2, after: 2 } as any);
});

describe("pegging a cel", () => {
    beforeEach(setup);

    it("does not move the drawing — that is the entire point", () => {
        setPeg(L, 0, PEG);
        const head = store.elements.find(e => e.id === "head")!;
        expect([head.x, head.y, head.angle]).toEqual([100, 100, 0]);
        expect(head.width).toBe(40);
    });

    it("lands on the cel that HOLDS the frame you picked", () => {
        setPeg(L, 3, PEG); // frame 3 is held by the cel at 0
        expect(kfs()[0].peg).toEqual(PEG);
        expect(kfs()[1].peg).toBeUndefined();
        expect(pegAt(store.animTimeline!, L, 5)).toEqual(PEG);
    });

    it("clears one cel's peg without touching the others", () => {
        setPeg(L, 0, PEG);
        setPeg(L, 6, PEG);
        setPeg(L, 0, null);
        expect(kfs()[0].peg).toBeUndefined();
        expect(kfs()[1].peg).toEqual(PEG);
    });

    it("resets every peg at once", () => {
        setPeg(L, 0, PEG);
        setPeg(L, 6, PEG);
        resetAllPegs();
        expect(kfs().every(k => k.peg === undefined)).toBe(true);
    });
});

describe("the peg-edit mode", () => {
    beforeEach(setup);

    it("turns the onion on — with no ghosts there is nothing to peg", () => {
        expect(store.animOnion.enabled).toBe(false);
        startPegEdit(L, 0);
        expect(store.animOnion.enabled).toBe(true);
        expect(store.animPegEdit).toEqual({ layerId: L, frame: 0 });
    });

    it("leaves an onion the user already had on alone", () => {
        setStore("animOnion", "enabled", true);
        setStore("animOnion", "before", 5);
        startPegEdit(L, 0);
        expect(store.animOnion.before).toBe(5);
    });

    it("ends cleanly so the canvas goes back to drawing", () => {
        startPegEdit(L, 0);
        endPegEdit();
        expect(store.animPegEdit).toBeNull();
    });
});
