/**
 * Layer reordering — `order` must follow the array, because `order` is what renders.
 *
 * The bug this pins: `reorderLayers` renumbered with `layer.order = idx` over entries of
 * `store.layers`. Those are solid-js/store proxies, and both store builds answer a direct
 * write with `set() { return true }` — accepted and thrown away. The renumbering had never
 * once run. The array moved and `order` stayed where it was.
 *
 * That split the app in two. The Layers panel reverses the array, so a reorder looked like it
 * worked. Everything that decides what is actually ON TOP reads `order` instead —
 * `canvas-renderer` sorts layers by it before painting, and so do hit-testing, the animation
 * timeline, recording and slide builds. Dragging a layer up the panel moved it in the panel
 * and changed nothing on the canvas. Confirmed by drawing two overlapping rectangles on two
 * layers and reordering: the lower one stayed underneath, and the browser console carried one
 * "Cannot mutate a Store directly" per layer per drag, which nobody had read.
 *
 * ---
 *
 * Why these tests are shaped the way they are, and why the obvious version is worthless here:
 *
 * Under `bun test` there is no `browser` condition, so solid-js/store resolves to its SERVER
 * build (`dist/server.js`), where a store is a plain object with no proxy. The direct write
 * succeeds there. A test that reorders the real store and asserts `order === index` therefore
 * passes against the broken code — it was written first and did exactly that, 7 green for a
 * bug that was live in the browser. The one environment that could have caught this is the
 * one place it does not reproduce, which is why it survived so long.
 *
 * So the assertion is not "the store ended up right" but "the function does not need the
 * store to accept a mutation": `reorderedLayers` returns fresh objects and leaves its input
 * untouched. That holds identically under both builds, and fails against the old code under
 * both — in-place renumbering mutates the input, whatever the input happens to be.
 */
import { describe, it, expect, mock } from "bun:test";

mock.module("../components/toast", () => ({ showToast: () => { } }));

const memStore: Record<string, string> = {};
global.window = {
    innerWidth: 1024, innerHeight: 768,
    addEventListener: () => { }, removeEventListener: () => { },
} as any;
global.localStorage = {
    getItem: (k: string) => (k in memStore ? memStore[k] : null),
    setItem: (k: string, v: string) => { memStore[k] = v; },
    removeItem: (k: string) => { delete memStore[k]; },
} as any;
global.crypto = { randomUUID: () => "uuid-" + Math.random() } as any;
global.document = {
    documentElement: { setAttribute: () => { }, classList: { add: () => { }, remove: () => { } } }
} as any;

const { reorderedLayers, reorderLayers, store, addLayer } = await import("./app-store");

/** Four layers in the invariant the app assumes: `order` === array index. */
const stack = () => ([
    { id: 'l0', name: 'Bottom', order: 0 },
    { id: 'l1', name: 'Second', order: 1 },
    { id: 'l2', name: 'Third', order: 2 },
    { id: 'l3', name: 'Top', order: 3 },
] as any[]);

const names = (ls: any[]) => ls.map(l => l.name);
const orders = (ls: any[]) => ls.map(l => l.order);
/** What the canvas paints, bottom-first: `canvas-renderer` sorts by `order`. */
const paintOrder = (ls: any[]) => [...ls].sort((a, b) => a.order - b.order).map(l => l.name);

describe("reorderedLayers leaves the store's own objects alone", () => {
    it("does not touch the input — the defect itself, not its symptom", () => {
        // The old code renumbered in place. Against the store that write was discarded; here
        // it would land on the caller's objects. Either way the function was asking the store
        // for something the store does not do.
        const input = stack();
        const before = orders(input);
        reorderedLayers(input, 0, 3);
        expect(orders(input)).toEqual(before);
        expect(names(input)).toEqual(['Bottom', 'Second', 'Third', 'Top']);
    });

    it("returns fresh objects rather than the ones handed in", () => {
        const input = stack();
        const out = reorderedLayers(input, 0, 3);
        for (const layer of out) expect(input).not.toContain(layer);
    });

    it("carries the rest of each layer across untouched", () => {
        const input = stack().map(l => ({ ...l, visible: false, opacity: 42, tag: '#ff0000' }));
        const out = reorderedLayers(input, 3, 0);
        expect(out[0]).toMatchObject({ id: 'l3', name: 'Top', visible: false, opacity: 42, tag: '#ff0000' });
    });
});

describe("reorderedLayers renumbers to match the new positions", () => {
    it("renumbers every layer, not only the one that moved", () => {
        expect(orders(reorderedLayers(stack(), 0, 3))).toEqual([0, 1, 2, 3]);
        expect(orders(reorderedLayers(stack(), 3, 0))).toEqual([0, 1, 2, 3]);
        expect(orders(reorderedLayers(stack(), 1, 2))).toEqual([0, 1, 2, 3]);
    });

    it("moves a layer up the stack, and the paint order with it", () => {
        const out = reorderedLayers(stack(), 0, 3);
        expect(names(out)).toEqual(['Second', 'Third', 'Top', 'Bottom']);
        // The point of the exercise: what renders on top moved too. Before the fix the array
        // said this and the canvas said the opposite.
        expect(paintOrder(out)).toEqual(names(out));
        expect(paintOrder(out).at(-1)).toBe('Bottom');
    });

    it("moves a layer down the stack", () => {
        const out = reorderedLayers(stack(), 3, 0);
        expect(names(out)).toEqual(['Top', 'Bottom', 'Second', 'Third']);
        expect(paintOrder(out)).toEqual(names(out));
    });

    it("holds the invariant across a run of moves in both directions", () => {
        let layers = stack();
        for (const [from, to] of [[0, 2], [3, 1], [1, 3], [2, 0], [0, 1]] as const) {
            layers = reorderedLayers(layers, from, to);
            expect(orders(layers)).toEqual([0, 1, 2, 3]);
            expect(paintOrder(layers)).toEqual(names(layers));
        }
    });

    it("leaves no two layers sharing an order value", () => {
        // A tie makes the sort's outcome depend on the engine's stability rather than on the
        // stack — which is how a layer ends up drawn on the wrong side of its neighbour.
        const out = reorderedLayers(reorderedLayers(stack(), 0, 3), 2, 1);
        expect(new Set(orders(out)).size).toBe(out.length);
    });

    it("repairs a document whose order had already drifted", () => {
        // What a file saved by a broken build looks like: array and `order` disagree. One
        // reorder should bring them back into step rather than preserving the drift.
        const drifted = [
            { id: 'a', name: 'A', order: 2 },
            { id: 'b', name: 'B', order: 3 },
            { id: 'c', name: 'C', order: 0 },
        ] as any[];
        const out = reorderedLayers(drifted, 0, 2);
        expect(orders(out)).toEqual([0, 1, 2]);
        expect(paintOrder(out)).toEqual(names(out));
    });
});

describe("the panel's two views agree after a reorder", () => {
    it("array-reversed (Groups off) and order-sorted (Groups on) describe one stack", () => {
        // `displayLayers()` reverses the array with Groups off and sorts by `order` desc with
        // Groups on. Those are the same list only while the invariant holds — which is why
        // switching Groups on made reordering appear to stop working altogether, and how this
        // was noticed at all.
        const out = reorderedLayers(stack(), 1, 3);
        const groupsOff = [...out].reverse().map(l => l.name);
        const groupsOn = [...out].sort((a, b) => b.order - a.order).map(l => l.name);
        expect(groupsOn).toEqual(groupsOff);
    });
});

describe("reorderLayers refuses indices that do not address a layer", () => {
    // `Yappy.reorderLayers()` is public API, so it is reachable with anything at all. An
    // out-of-range `from` splices nothing out, then puts `undefined` into the array, which
    // spreads to `{}` — a layer with no id, no name and no elements, and no way back.
    //
    // These drive the real store rather than the pure helper, because the guard lives on the
    // store side. That is sound here for the same reason it was NOT sound for the renumbering:
    // this asserts nothing about whether a mutation is accepted.
    const ids = () => store.layers.map(l => l.id);

    it("leaves the stack alone for out-of-range, negative and non-integer indices", () => {
        addLayer("Guard A");
        addLayer("Guard B");
        const before = ids();
        expect(before.length).toBeGreaterThan(1);

        for (const [from, to] of [
            [99, 0], [0, 99], [-1, 0], [0, -1], [1.5, 0], [0, 1.5], [NaN, 0], [0, NaN],
        ] as const) {
            reorderLayers(from as number, to as number);
            expect(ids()).toEqual(before);
        }
        expect(store.layers.every(l => typeof l.id === "string" && l.id.length > 0)).toBe(true);
    });
});
