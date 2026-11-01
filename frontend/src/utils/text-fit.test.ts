import { describe, it, expect } from "bun:test";
import { fitScale, fittedElement, withTextScale, MIN_SCALE } from "./text-fit";

/** Measures every character as half its font size wide: enough to make wrapping predictable. */
const stub = () => {
    const r: any = {
        font: '10px sans-serif', letterSpacing: '0px',
        save() { }, restore() { },
        measureText(t: string) { const px = parseFloat(/([\d.]+)px/.exec(this.font)![1]); return { width: t.length * px * 0.5 }; },
    };
    return r;
};
const box = (over: object = {}) => ({
    id: 't', type: 'text', x: 0, y: 0, width: 208, height: 108, fontSize: 20, fontFamily: 'sans-serif',
    text: 'word '.repeat(60).trim(), textFit: 'shrink', ...over,
}) as any;

describe("shrink text on overflow", () => {
    it("leaves text that fits alone", () => {
        expect(fitScale(stub(), box({ text: 'short' }), 'text')).toBe(1);
        expect(fittedElement(stub(), box({ text: 'short' }), 'text').fontSize).toBe(20);
    });
    it("finds a scale at which the wrapped text fits the box, and no larger", () => {
        const r = stub(), el = box();
        const s = fitScale(r, el, 'text');
        expect(s).toBeGreaterThan(MIN_SCALE);
        expect(s).toBeLessThan(1);
        const height = (k: number) => {
            const size = 20 * k, perLine = Math.floor(200 / (size * 0.5));
            const words = 60, wordsPerLine = Math.max(1, Math.floor((perLine + 1) / 5));
            const lines = Math.ceil(words / wordsPerLine);
            return (lines - 1) * size * 1.2 + size;
        };
        expect(height(s)).toBeLessThanOrEqual(100.5);
        expect(height(s + 0.02)).toBeGreaterThan(100);
    });
    it("is off unless asked for, and stops at the minimum", () => {
        expect(fitScale(stub(), box({ textFit: undefined }), 'text')).toBe(1);
        expect(fitScale(stub(), box({ text: 'word '.repeat(5000), height: 20 }), 'text')).toBe(MIN_SCALE);
    });
    it("scales every size it draws: its own, its spans' and its tracking", () => {
        const el = withTextScale(box({ letterSpacing: 2, richText: [{ text: 'a', fontSize: 30 }, { text: 'b' }] }), 0.5, 'text');
        expect(el.fontSize).toBe(10);
        expect(el.letterSpacing).toBe(1);
        expect(el.richText!.map((s: any) => s.fontSize)).toEqual([15, undefined]);
    });
});
