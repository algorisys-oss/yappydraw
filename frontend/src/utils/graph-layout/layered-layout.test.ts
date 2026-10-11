import { describe, it, expect } from "bun:test";
import { layeredLayout, type LayoutEdge, type LayoutNode } from "./layered-layout";

const box = (id: string, w = 120, h = 60): LayoutNode => ({ id, width: w, height: h });
const e = (from: string, to: string): LayoutEdge => ({ from, to });

const overlaps = (r: ReturnType<typeof layeredLayout>, nodes: LayoutNode[]) => {
    const rects = nodes.map(n => ({ ...r.positions.get(n.id)!, w: n.width, h: n.height }));
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j];
        if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) return true;
    }
    return false;
};

describe("layeredLayout", () => {
    it("puts a chain in successive layers, top to bottom, with the layer gap between", () => {
        const nodes = [box("a"), box("b"), box("c")];
        const r = layeredLayout(nodes, [e("a", "b"), e("b", "c")], { layerGap: 80 });
        const [a, b, c] = ["a", "b", "c"].map(id => r.positions.get(id)!);
        expect(a.x).toBe(b.x); expect(b.x).toBe(c.x);
        expect(b.y - a.y).toBe(60 + 80);
        expect(c.y - b.y).toBe(60 + 80);
        expect(r.width).toBe(120); expect(r.height).toBe(3 * 60 + 2 * 80);
    });

    it("left-to-right stacks layers along x", () => {
        const r = layeredLayout([box("a"), box("b")], [e("a", "b")], { direction: "LR", layerGap: 50 });
        expect(r.positions.get("b")!.x - r.positions.get("a")!.x).toBe(120 + 50);
        expect(r.positions.get("a")!.y).toBe(r.positions.get("b")!.y);
    });

    it("bottom-to-top and right-to-left mirror the flow", () => {
        const bt = layeredLayout([box("a"), box("b")], [e("a", "b")], { direction: "BT" });
        expect(bt.positions.get("a")!.y).toBeGreaterThan(bt.positions.get("b")!.y);
        const rl = layeredLayout([box("a"), box("b")], [e("a", "b")], { direction: "RL" });
        expect(rl.positions.get("a")!.x).toBeGreaterThan(rl.positions.get("b")!.x);
    });

    it("fans a parent's children out side by side under it, centred", () => {
        const nodes = [box("p"), box("c1"), box("c2"), box("c3")];
        const r = layeredLayout(nodes, [e("p", "c1"), e("p", "c2"), e("p", "c3")], { nodeGap: 40 });
        const ys = ["c1", "c2", "c3"].map(id => r.positions.get(id)!.y);
        expect(new Set(ys).size).toBe(1);
        const xs = ["c1", "c2", "c3"].map(id => r.positions.get(id)!.x).sort((a, b) => a - b);
        expect(xs[1] - xs[0]).toBe(160); expect(xs[2] - xs[1]).toBe(160);
        const p = r.positions.get("p")!;
        expect(p.x + 60).toBeCloseTo(xs[1] + 60, 5);    // parent over the middle child
        expect(overlaps(r, nodes)).toBe(false);
    });

    it("survives a cycle and still separates every node", () => {
        const nodes = [box("a"), box("b"), box("c")];
        const r = layeredLayout(nodes, [e("a", "b"), e("b", "c"), e("c", "a")]);
        expect(r.positions.size).toBe(3);
        expect(overlaps(r, nodes)).toBe(false);
    });

    it("gives a long edge a lane: a skip edge does not pull its target under another's child", () => {
        // a→b→c and a→c: c sits in layer 2; the dummy for a→c keeps room.
        const nodes = [box("a"), box("b"), box("c"), box("d")];
        const r = layeredLayout(nodes, [e("a", "b"), e("b", "c"), e("a", "c"), e("b", "d")]);
        expect(r.positions.get("c")!.y).toBe(r.positions.get("d")!.y);
        expect(overlaps(r, nodes)).toBe(false);
    });

    it("lays out disconnected components side by side", () => {
        const nodes = [box("a"), box("b"), box("x"), box("y")];
        const r = layeredLayout(nodes, [e("a", "b"), e("x", "y")], { componentGap: 100 });
        const ax = r.positions.get("a")!.x, xx = r.positions.get("x")!.x;
        expect(Math.abs(xx - ax)).toBe(120 + 100);
        expect(overlaps(r, nodes)).toBe(false);
    });

    it("handles isolated nodes and ignores edges to unknown ids", () => {
        const nodes = [box("a"), box("lonely")];
        const r = layeredLayout(nodes, [e("a", "ghost")]);
        expect(r.positions.size).toBe(2);
        expect(overlaps(r, nodes)).toBe(false);
    });

    it("is deterministic", () => {
        const nodes = Array.from({ length: 12 }, (_, i) => box(`n${i}`, 100 + (i % 3) * 20, 50));
        const edges = nodes.slice(1).map((n, i) => e(`n${Math.floor(i / 2)}`, n.id));
        const a = layeredLayout(nodes, edges), b = layeredLayout(nodes, edges);
        expect([...a.positions.entries()]).toEqual([...b.positions.entries()]);
        expect(overlaps(a, nodes)).toBe(false);
    });
});
