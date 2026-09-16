import { describe, it, expect } from "bun:test";
import { normalizedLayers, subtreeCopyOrders, keepContentsSurvivor, topmostSelectedLayers } from "./layer-order";

/**
 * The Layers panel (Groups mode off, the default) lists the ARRAY reversed; the canvas stacks
 * by `order`. addLayer/duplicateLayer set a fractional `order` and appended to the array, so a
 * new layer painted above the active one but was listed at the top of the panel — and the next
 * drag renumbered `order` from array positions and moved it to the top of the canvas as well
 * (Anshika, Sep 2026, reported a second time after the first fix). One invariant closes it:
 * the array is in `order` sequence and `order` is 0..n-1.
 */
const L = (id: string, order: number, extra: any = {}) => ({ id, name: id, order, visible: true, locked: false, opacity: 1, ...extra }) as any;

describe("normalizedLayers", () => {
    it("puts a layer slotted at active.order + 0.5 directly above the active one, in the array too", () => {
        const out = normalizedLayers([L('a', 0), L('b', 1), L('c', 2), L('new', 1.5)]);
        expect(out.map(l => l.id)).toEqual(['a', 'b', 'new', 'c']);
        expect(out.map(l => l.order)).toEqual([0, 1, 2, 3]);
    });

    it("never produces a tie, so a second add above the new layer lands above it", () => {
        const once = normalizedLayers([L('a', 0), L('b', 1), L('c', 2), L('n1', 1.5)]);
        const twice = normalizedLayers([...once, L('n2', once.find(l => l.id === 'n1')!.order + 0.5)]);
        expect(twice.map(l => l.id)).toEqual(['a', 'b', 'n1', 'n2', 'c']);
    });

    it("keeps array order for equal orders (stable) and leaves its input alone", () => {
        const input = [L('x', 1), L('y', 1)];
        const out = normalizedLayers(input);
        expect(out.map(l => l.id)).toEqual(['x', 'y']);
        expect(input[0].order).toBe(1);
        expect(out[0]).not.toBe(input[0]);
    });
});

describe("subtreeCopyOrders", () => {
    it("stacks a group's copy ABOVE every layer of the original group, keeping the copy's internal order", () => {
        // group g (order 3) with children c1 (1), c2 (2); unrelated top layer t (4)
        const layers = [L('c1', 1, { parentId: 'g' }), L('c2', 2, { parentId: 'g' }), L('g', 3, { isGroup: true }), L('t', 4), L('bottom', 0)];
        const orders = subtreeCopyOrders(layers, ['g', 'c1', 'c2']);
        const [g, c1, c2] = [orders.get('g')!, orders.get('c1')!, orders.get('c2')!];
        expect(c1).toBeLessThan(c2);
        expect(c2).toBeLessThan(g);
        for (const o of [g, c1, c2]) { expect(o).toBeGreaterThan(3); expect(o).toBeLessThan(4); }
    });
});

describe("keepContentsSurvivor", () => {
    it("moves loose elements onto a plain child layer, never onto a nested group", () => {
        const layers = [L('g', 3, { isGroup: true }), L('sub', 2, { parentId: 'g', isGroup: true }), L('leaf', 1, { parentId: 'sub' }), L('other', 0)];
        expect(keepContentsSurvivor(layers, 'g')?.id).toBe('leaf');
    });
    it("falls back to a plain layer outside the group", () => {
        const layers = [L('g', 1, { isGroup: true }), L('other', 0)];
        expect(keepContentsSurvivor(layers, 'g')?.id).toBe('other');
    });
});

describe("topmostSelectedLayers", () => {
    it("drops layers whose ancestor is also selected, so a group delete prompts once", () => {
        const layers = [L('g', 2, { isGroup: true }), L('c', 1, { parentId: 'g' }), L('x', 0)];
        expect(topmostSelectedLayers(layers, ['c', 'g', 'x'])).toEqual(['g', 'x']);
    });
});
