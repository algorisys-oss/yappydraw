import { describe, it, expect } from "bun:test";
import { checkPages, contrast } from "./accessibility-check";

const el = (o: object) => ({ id: 'x', type: 'rectangle', x: 0, y: 0, width: 100, height: 50, strokeColor: '#000000', backgroundColor: 'transparent', fillStyle: 'solid', ...o }) as any;
const page = (elements: any[], background = '#ffffff', index: number | null = 0) => ({ index, background, elements });

describe("accessibility check", () => {
    it("computes WCAG contrast", () => {
        expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
        expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 1);
        expect(contrast('rgba(0,0,0,0.5)', '#ffffff')).toBeNull();   // see-through: can't tell
    });
    it("asks for alt text on pictures and charts, unless decorative or described", () => {
        const issues = checkPages([page([
            el({ id: 'a', type: 'image' }), el({ id: 'b', type: 'chart' }),
            el({ id: 'c', type: 'image', altText: 'Team photo' }), el({ id: 'd', type: 'image', decorative: true }),
            el({ id: 'e', type: 'rectangle' }), el({ id: 't', type: 'text', text: 'Title' }),
        ])]);
        expect(issues.filter(i => i.kind === 'alt-text').map(i => i.elementId)).toEqual(['a', 'b']);
    });
    it("flags text that is hard to read against what is behind it", () => {
        const issues = checkPages([page([
            el({ id: 'grey', type: 'text', text: 'Grey on white', textColor: '#aaaaaa', fontSize: 16 }),
            el({ id: 'bigGrey', type: 'text', text: 'Large', textColor: '#888888', fontSize: 32 }),  // 3.5:1, fine when large
            el({ id: 'onFill', containerText: 'White on yellow', textColor: '#ffffff', backgroundColor: '#ffeb3b', fontSize: 16 }),
            el({ id: 'ok', type: 'text', text: 'Black', textColor: '#000000', fontSize: 16 }),
            el({ id: 'darkFill', containerText: 'White on navy', textColor: '#ffffff', backgroundColor: '#1e3a8a' }),
        ])]);
        const c = issues.filter(i => i.kind === 'contrast');
        expect(c.map(i => i.elementId)).toEqual(['grey', 'onFill']);
        expect(c[0]).toMatchObject({ needed: 4.5 });
        expect(c[0].ratio).toBeLessThan(4.5);
    });
    it("judges unfilled text against the page, so light text on a dark slide passes", () => {
        expect(checkPages([page([el({ type: 'text', text: 'Hi', textColor: '#ffffff' })], '#111827')])).toEqual([]);
        expect(checkPages([page([el({ type: 'text', text: 'Hi', textColor: '#ffffff' })], '#ffffff')])[0].kind).toBe('contrast');
    });
    it("flags a page with no text, and reports master artwork once", () => {
        const logo = (n: number) => el({ id: n ? `logo@page${n}` : 'logo', type: 'image' });
        const issues = checkPages([page([logo(0), el({ type: 'text', text: 'Hello' })], '#fff', 0), page([logo(1)], '#fff', 1)]);
        expect(issues).toEqual([{ kind: 'alt-text', page: 0, elementId: 'logo' }, { kind: 'no-text', page: 1 }]);
        // An unpaged canvas has no pages to name.
        expect(checkPages([page([el({})], '#fff', null)])).toEqual([]);
    });
});
