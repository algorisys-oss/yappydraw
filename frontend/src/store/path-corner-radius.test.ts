import { describe, it, expect, mock, beforeEach } from "bun:test";

// Mock dependencies BEFORE importing the store (same harness as app-store.test.ts).
mock.module("../components/toast", () => ({ showToast: () => { } }));

global.window = {
    innerWidth: 1024, innerHeight: 768,
    addEventListener: () => { }, removeEventListener: () => { },
} as any;
global.localStorage = { getItem: () => null, setItem: () => { } } as any;
global.crypto = { randomUUID: () => "uuid-" + Math.random() } as any;
global.document = {
    documentElement: { setAttribute: () => { }, classList: { add: () => { }, remove: () => { } } },
} as any;

const {
    store, setStore, setPathCornerRadius, getPathCornerRadius,
} = await import("./app-store");

/** A closed 100×100 square path element. */
const squarePath = (id: string) => ({
    id, type: 'path', x: 0, y: 0, width: 100, height: 100,
    angle: 0, strokeColor: '#000', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 0, opacity: 100,
    seed: 1, versionNonce: 1, isDeleted: false, groupIds: [], boundElements: null,
    updated: 1, link: null, locked: false,
    pathClosed: true,
    pathAnchors: [
        { x: 0, y: 0, kind: 'corner' }, { x: 100, y: 0, kind: 'corner' },
        { x: 100, y: 100, kind: 'corner' }, { x: 0, y: 100, kind: 'corner' },
    ],
} as any);

const radii = (id: string) =>
    (store.elements.find(e => e.id === id) as any).pathAnchors.map((a: any) => a.cornerRadius);

describe("setPathCornerRadius", () => {
    beforeEach(() => {
        setStore('elements', [squarePath('sq')] as any);
        setStore('selection', ['sq']);
        setStore('nodeSelection', []);
    });

    it("rounds every corner when no anchors are selected", () => {
        setPathCornerRadius(['sq'], 12);
        expect(radii('sq')).toEqual([12, 12, 12, 12]);
    });

    it("rounds only the selected anchors", () => {
        setStore('nodeSelection', [{ id: 'sq', sub: 0, i: 1 }] as any);
        setPathCornerRadius(['sq'], 12);
        expect(radii('sq')).toEqual([undefined, 12, undefined, undefined]);
    });

    it("takes an explicit node scope over the current selection", () => {
        setStore('nodeSelection', [{ id: 'sq', sub: 0, i: 1 }] as any);
        setPathCornerRadius(['sq'], 12, { nodes: [{ id: 'sq', sub: 0, i: 3 }] });
        expect(radii('sq')).toEqual([undefined, undefined, undefined, 12]);
    });

    it("clamps to what the corner can actually carry", () => {
        setPathCornerRadius(['sq'], 9999);
        // Half of the shorter neighbour on a 90° corner of a 100-unit square.
        for (const r of radii('sq')) expect(r).toBeCloseTo(50, 6);
    });

    it("deletes the key at zero rather than storing a 0", () => {
        setPathCornerRadius(['sq'], 12);
        setPathCornerRadius(['sq'], 0);
        // A stored `cornerRadius: 0` would keep every path in the fillet path forever.
        expect(radii('sq')).toEqual([undefined, undefined, undefined, undefined]);
        const a = (store.elements.find(e => e.id === 'sq') as any).pathAnchors[0];
        expect('cornerRadius' in a).toBe(false);
    });

    it("ignores ids that are not in the document", () => {
        expect(setPathCornerRadius(['nope'], 10)).toEqual([]);
    });
});

describe("getPathCornerRadius", () => {
    beforeEach(() => {
        setStore('elements', [squarePath('sq')] as any);
        setStore('selection', ['sq']);
        setStore('nodeSelection', []);
    });

    it("reports zero and a real maximum before anything is rounded", () => {
        const info = getPathCornerRadius(['sq']);
        expect(info.value).toBe(0);
        expect(info.count).toBe(4);
        expect(info.max).toBeCloseTo(50, 6);
    });

    it("reports the shared value once set", () => {
        setPathCornerRadius(['sq'], 8);
        expect(getPathCornerRadius(['sq']).value).toBe(8);
    });

    it("reports null when the corners disagree", () => {
        setPathCornerRadius(['sq'], 8, { nodes: [{ id: 'sq', sub: 0, i: 1 }] });
        expect(getPathCornerRadius(['sq']).value).toBeNull();
    });

    it("narrows to the selected anchors", () => {
        setPathCornerRadius(['sq'], 8, { nodes: [{ id: 'sq', sub: 0, i: 1 }] });
        setStore('nodeSelection', [{ id: 'sq', sub: 0, i: 1 }] as any);
        expect(getPathCornerRadius(['sq']).value).toBe(8);
        expect(getPathCornerRadius(['sq']).count).toBe(1);
    });

    it("is empty for a selection with nothing roundable", () => {
        setStore('elements', [] as any);
        expect(getPathCornerRadius(['sq'])).toEqual({ value: null, max: 0, count: 0 });
    });
});
