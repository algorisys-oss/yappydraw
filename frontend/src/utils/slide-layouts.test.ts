import { describe, it, expect } from "bun:test";
import { layoutElements, paletteFor, isDarkColor, SLIDE_LAYOUTS, isSlideLayout, type LayoutText } from "./slide-layouts";

const words: LayoutText = {
    title: 'T', subtitle: 'S', point: (n) => `P${n}`, body: 'B', quote: 'Q', author: 'A',
    value: 'V', label: 'L', year: 'Y', optionA: 'OA', optionB: 'OB', closing: 'C',
};
let n = 0;
const newId = (type: string) => `${type}-${++n}`;

describe("layoutElements", () => {
    it("every layout but blank produces artwork with fresh ids", () => {
        for (const id of SLIDE_LAYOUTS) {
            const els = layoutElements(id, { x: 0, y: 0, w: 1920, h: 1080 }, paletteFor('#ffffff'), words, newId);
            if (id === 'blank') expect(els).toEqual([]);
            else {
                expect(els.length).toBeGreaterThan(0);
                expect(new Set(els.map(e => e.id)).size).toBe(els.length);
            }
        }
    });

    it("fills placeholder text", () => {
        const texts = layoutElements('content', { x: 0, y: 0, w: 1920, h: 1080 }, paletteFor(undefined), words, newId)
            .map(e => e.text).filter(Boolean);
        expect(texts).toEqual(expect.arrayContaining(['T', 'P1', 'P2', 'P3']));
    });

    it("places on the slide and scales to its size, fonts included", () => {
        const big = layoutElements('title', { x: 0, y: 0, w: 1920, h: 1080 }, paletteFor('#fff'), words, newId);
        const small = layoutElements('title', { x: 5000, y: 100, w: 960, h: 540 }, paletteFor('#fff'), words, newId);
        const tb = big.find(e => e.text === 'T')!, ts = small.find(e => e.text === 'T')!;
        expect(ts.fontSize).toBeCloseTo(tb.fontSize! / 2, 6);
        expect(ts.width).toBeCloseTo(tb.width / 2, 6);
        expect(ts.x).toBeCloseTo(5000 + tb.x / 2, 6);
        expect(ts.y).toBeCloseTo(100 + tb.y / 2, 6);
        // A 4:3 slide: scaled to fit its width and centred vertically.
        const tall = layoutElements('title', { x: 0, y: 0, w: 1440, h: 1080 }, paletteFor('#fff'), words, newId).find(e => e.text === 'T')!;
        expect(tall.y).toBeCloseTo((1080 - 1080 * 0.75) / 2 + tb.y * 0.75, 6);
    });
});

describe("paletteFor", () => {
    it("picks light text for a dark slide and keeps the slide's own background", () => {
        expect(isDarkColor('#0f172a')).toBe(true);
        expect(isDarkColor('rgb(250, 250, 250)')).toBe(false);
        expect(isDarkColor('not a colour')).toBe(false);
        const dark = paletteFor('#101010');
        expect(dark.background).toBe('#101010');
        expect(isDarkColor(dark.text)).toBe(false);
        expect(isDarkColor(paletteFor('#ffffff').text)).toBe(true);
        expect(isSlideLayout('two-column')).toBe(true);
        expect(isSlideLayout('nope')).toBe(false);
    });
});
