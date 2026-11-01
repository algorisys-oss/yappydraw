import { describe, it, expect } from "bun:test";
import { compositeOf, compositeFrame, reversed } from "./composite-frame";

describe("wipe, cover, uncover and split frames", () => {
    const W = 200, H = 100;
    it("names each composite type, and nothing else", () => {
        expect(compositeOf('wipe-left')).toEqual({ kind: 'wipe', side: 'left' });
        expect(compositeOf('uncover-down')).toEqual({ kind: 'uncover', side: 'down' });
        expect(compositeOf('split-vertical-in')).toEqual({ kind: 'split', orient: 'vertical', inward: true });
        expect(compositeOf('slide-left')).toBeNull();
        expect(compositeOf('fade')).toBeNull();
    });
    it("wipe-left reveals the new slide from the right edge", () => {
        expect(compositeFrame({ kind: 'wipe', side: 'left' }, 0.25, W, H).clip).toEqual([{ x: 150, y: 0, w: 50, h: 100 }]);
        expect(compositeFrame({ kind: 'wipe', side: 'down' }, 0.5, W, H).clip).toEqual([{ x: 0, y: 0, w: 200, h: 50 }]);
    });
    it("cover-left brings the new slide in from the right, over the old one", () => {
        const f = compositeFrame({ kind: 'cover', side: 'left' }, 0.25, W, H);
        expect(f).toMatchObject({ newOnTop: true, oldAt: { x: 0, y: 0 }, newAt: { x: 150, y: 0 }, clip: null });
        expect(compositeFrame({ kind: 'cover', side: 'left' }, 1, W, H).newAt).toEqual({ x: 0, y: 0 });
    });
    it("uncover-up slides the old slide away upwards, the new one underneath", () => {
        expect(compositeFrame({ kind: 'uncover', side: 'up' }, 0.5, W, H)).toMatchObject({ newOnTop: false, oldAt: { x: 0, y: -50 }, newAt: { x: 0, y: 0 } });
    });
    it("split opens out from the middle line, or closes in from both edges", () => {
        expect(compositeFrame({ kind: 'split', orient: 'horizontal' }, 0.5, W, H).clip).toEqual([{ x: 0, y: 25, w: 200, h: 50 }]);
        expect(compositeFrame({ kind: 'split', orient: 'vertical', inward: true }, 0.5, W, H).clip).toEqual([{ x: 0, y: 0, w: 50, h: 100 }, { x: 150, y: 0, w: 50, h: 100 }]);
    });
    it("every effect ends on the new slide alone, and runs the other way going back", () => {
        for (const t of ['wipe-up', 'cover-right', 'split-horizontal-in', 'split-vertical-out'] as const) {
            const f = compositeFrame(compositeOf(t)!, 1, W, H);
            const area = f.clip ? f.clip.reduce((a, r) => a + r.w * r.h, 0) : W * H;
            expect(area).toBe(W * H);
        }
        expect(compositeFrame(compositeOf('uncover-left')!, 1, W, H).oldAt.x).toBe(-W); // gone off the slide
        expect(reversed({ kind: 'wipe', side: 'left' })).toEqual({ kind: 'wipe', side: 'right' });
        expect(reversed({ kind: 'split', orient: 'horizontal' })).toEqual({ kind: 'split', orient: 'horizontal', inward: true });
    });
});
