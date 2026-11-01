import { describe, it, expect } from "bun:test";
import { morphPairs, morphFrame, morphElement, mixColor, lerpAngle, smooth, startsHidden, morphable } from "./morph";

const el = (o: any) => ({ id: o.id ?? Math.random().toString(36), type: 'rectangle', x: 0, y: 0, width: 100, height: 50, angle: 0, opacity: 100,
    backgroundColor: '#ff0000', strokeColor: '#000000', ...o }) as any;
const A = { x: 0, y: 0 }, B = { x: 2000, y: 0 };

describe("morphPairs", () => {
    it("pairs a duplicated slide's objects with their own copies by position", () => {
        const a = [el({ x: 100, y: 100 }), el({ x: 800, y: 600 })];
        // Same two rectangles on slide B, listed in the other order and moved a little.
        const b = [el({ x: 2000 + 820, y: 610 }), el({ x: 2000 + 130, y: 90 })];
        expect(morphPairs(a, b, A, B)).toEqual([[0, 1], [1, 0]]);
    });
    it("prefers !! names, then names, then text, then bare shapes of the same type", () => {
        const a = [el({ name: '!!logo', x: 0 }), el({ type: 'text', text: 'Revenue' }), el({ type: 'circle' })];
        const b = [el({ type: 'circle', x: 2000 }), el({ type: 'text', text: 'Revenue', x: 2900 }), el({ name: '!!logo', x: 2900 })];
        expect(morphPairs(a, b, A, B).sort()).toEqual([[0, 2], [1, 1], [2, 0]]);
    });
    it("leaves different text and different types unmatched", () => {
        expect(morphPairs([el({ type: 'text', text: 'A' })], [el({ type: 'text', text: 'B' })], A, B)).toEqual([]);
        expect(morphPairs([el({ type: 'circle' })], [el({ type: 'rectangle' })], A, B)).toEqual([]);
    });
});

describe("interpolation", () => {
    it("moves, resizes and recolours one object at the midpoint, in slide B's frame", () => {
        const m = morphElement(el({ x: 100, y: 100, width: 100, backgroundColor: '#000000' }),
            el({ x: 2000 + 300, y: 300, width: 300, backgroundColor: '#ffffff' }), A, B, 0.5);
        expect([m.x, m.y, m.width]).toEqual([2200, 200, 200]);
        expect(m.backgroundColor).toBe('#808080');
    });
    it("rotates the short way round and eases", () => {
        expect(lerpAngle(350, 10, 0.5)).toBeCloseTo(360, 6);
        expect(smooth(0)).toBe(0);
        expect(smooth(1)).toBe(1);
        expect(smooth(0.5)).toBe(0.5);
        expect(smooth(0.25)).toBeLessThan(0.25);
    });
    it("switches colours it can't mix at the midpoint", () => {
        expect(mixColor('red', '#000000', 0.4)).toBe('red');
        expect(mixColor('red', '#000000', 0.6)).toBe('#000000');
        expect(mixColor('#ff000000', '#ff0000ff', 0.5)).toBe('#ff000080');
    });
});

describe("morphFrame", () => {
    it("fades out what leaves, fades in what arrives, moves pairs, cross-fades changed text", () => {
        const a = [el({ id: 'gone', type: 'circle' }), el({ id: 'mover' }), el({ id: 'tA', type: 'text', text: 'Q1', name: 'title' })];
        const b = [el({ id: 'mover2', x: 2400 }), el({ id: 'tB', type: 'text', text: 'Q2', name: 'title' }), el({ id: 'new', type: 'diamond' })];
        const f = morphFrame(a, b, A, B, 0.5);
        const by = (id: string) => f.filter(p => p.el.id === id);
        expect(by('gone')[0].alpha).toBeCloseTo(0.5, 6);
        expect(by('new')[0].alpha).toBeCloseTo(0.5, 6);
        expect(by('mover2')[0]).toEqual(expect.objectContaining({ alpha: 1 }));
        expect(by('mover2')[0].el.x).toBeCloseTo(2200, 6);
        expect(by('tA')[0].alpha + by('tB')[0].alpha).toBeCloseTo(1, 6);   // same name, different text
        expect(morphable(a[2], b[1])).toBe(false);
        expect(morphFrame(a, b, A, B, 1).filter(p => p.alpha > 0).map(p => p.el.id).sort()).toEqual(['mover2', 'new', 'tB']);
    });
    it("knows which objects start hidden", () => {
        expect(startsHidden(el({ animations: [{ trigger: 'on-click' }] }))).toBe(true);
        expect(startsHidden(el({ animations: [{ trigger: 'on-load', startHidden: true }] }))).toBe(true);
        expect(startsHidden(el({ animations: [{ trigger: 'on-click', startHidden: false }] }))).toBe(false);
        expect(startsHidden(el({}))).toBe(false);
    });
});
