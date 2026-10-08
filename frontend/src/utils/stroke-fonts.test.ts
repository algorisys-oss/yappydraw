/**
 * Stroke-font layout and path conversion.
 *
 * Everything here is pure, which is the point of splitting it out: the metrics are the part that
 * can be quietly wrong — text that sits a cap height too low, or an advance that drifts — and
 * none of that needs a canvas to catch.
 *
 * The real Hershey data is loaded from the generated JSON so the tests check the actual shipped
 * faces, not a hand-made fixture that could agree with a broken converter.
 */

import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import {
    layoutStrokeText, strokesToSubpaths, strokesBounds,
    STROKE_FONTS, DEFAULT_STROKE_FONT, isStrokeFontId,
    type StrokeFont,
} from "./stroke-fonts";

const face = (id: string): StrokeFont =>
    JSON.parse(readFileSync(`frontend/public/fonts/stroke/${id}.json`, 'utf8'));

const SIMPLEX = face('hershey-simplex');

/** Bounding box of everything a layout placed. */
const layoutBounds = (text: string, opts = {}) => {
    const l = layoutStrokeText(SIMPLEX, text, opts);
    return { ...strokesBounds(l.glyphs.flatMap(g => g.strokes))!, layout: l };
};

describe("the shipped faces", () => {
    it("all load, cover ASCII 32-126, and carry the required acknowledgement", () => {
        for (const { id, name } of STROKE_FONTS) {
            const f = face(id);
            expect(f.id).toBe(id);
            expect(f.name).toBe(name);
            // The Hershey licence requires the acknowledgement to travel WITH the font data,
            // so it lives in the data file rather than only in a notices file beside it.
            expect(f.notice).toContain('A. V. Hershey');
            expect(f.notice).toContain('James Hurt');
            expect(Object.keys(f.glyphs).length).toBe(95);   // 32..126
            expect(f.glyphs[' ']).toBeDefined();
            expect(f.glyphs['~']).toBeDefined();
            expect(f.metrics.capHeight).toBe(21);
        }
    });

    it("gives space an advance but no strokes, and letters both", () => {
        expect(SIMPLEX.glyphs[' '].strokes).toEqual([]);
        expect(SIMPLEX.glyphs[' '].advance).toBeGreaterThan(0);
        expect(SIMPLEX.glyphs['H'].strokes.length).toBe(3);   // two stems + crossbar
        expect(SIMPLEX.glyphs['H'].advance).toBeGreaterThan(0);
    });

    it("has every glyph starting at x=0 and nothing below the descender", () => {
        // The converter subtracts the left bearing and the baseline, so a consumer never has to.
        // The descender bound is what the block height relies on — anything past it would hang
        // out of the box.
        const belowBaseline: string[] = [];
        for (const [ch, g] of Object.entries(SIMPLEX.glyphs)) {
            if (!g.strokes.length) continue;
            const b = strokesBounds(g.strokes)!;
            expect(b.x).toBeGreaterThanOrEqual(0);
            expect(b.y + b.height).toBeLessThanOrEqual(SIMPLEX.metrics.descender + 0.001);
            if (b.y > 0) belowBaseline.push(ch);
        }
        // Underscore is the only glyph drawn entirely under the baseline, which is correct —
        // naming it is better than loosening the rule until everything passes.
        expect(belowBaseline).toEqual(['_']);
    });

    it("lets braces and parens overshoot the cap height, as they should", () => {
        // Cap height is a metric, not a ceiling: ( ) { } [ ] are drawn taller than capitals in
        // every typeface. Worth pinning so a later 'normalise to cap height' idea has to argue.
        const tallest = Math.min(...Object.values(SIMPLEX.glyphs)
            .filter(g => g.strokes.length)
            .map(g => strokesBounds(g.strokes)!.y));
        expect(tallest).toBeLessThan(-SIMPLEX.metrics.capHeight);
        expect(strokesBounds(SIMPLEX.glyphs['{'].strokes)!.y)
            .toBeLessThan(strokesBounds(SIMPLEX.glyphs['H'].strokes)!.y);
    });

    it("places capitals one cap height above the baseline, and descenders below it", () => {
        const H = strokesBounds(SIMPLEX.glyphs['H'].strokes)!;
        expect(H.y).toBeCloseTo(-SIMPLEX.metrics.capHeight, 5);
        expect(H.y + H.height).toBeCloseTo(0, 5);

        const x = strokesBounds(SIMPLEX.glyphs['x'].strokes)!;
        expect(x.y).toBeCloseTo(-SIMPLEX.metrics.xHeight, 5);

        const p = strokesBounds(SIMPLEX.glyphs['p'].strokes)!;
        expect(p.y + p.height).toBeCloseTo(SIMPLEX.metrics.descender, 5);
    });
});

describe("layoutStrokeText — metrics", () => {
    it("scales so fontSize IS the cap height, matching Yappy.tex", () => {
        for (const size of [16, 32, 100]) {
            const b = layoutBounds('H', { fontSize: size });
            expect(b.height).toBeCloseTo(size, 4);
        }
    });

    it("puts the first baseline one cap height below the block top", () => {
        const b = layoutBounds('H', { fontSize: 40 });
        expect(b.y).toBeCloseTo(0, 4);              // cap top at the block top
        expect(b.y + b.height).toBeCloseTo(40, 4);  // baseline at y = fontSize
    });

    it("reserves room for a descender in the block height", () => {
        const noDescender = layoutStrokeText(SIMPLEX, 'Hxo', { fontSize: 30 });
        const withDescender = layoutStrokeText(SIMPLEX, 'Hpg', { fontSize: 30 });
        // Height is the box, so both are the same — it always allows for the descender.
        expect(noDescender.height).toBeCloseTo(withDescender.height, 5);
        expect(withDescender.height).toBeGreaterThan(30);
        // …and the glyphs that HAVE a descender really do go past the baseline.
        const ink = strokesBounds(withDescender.glyphs.flatMap(g => g.strokes))!;
        expect(ink.y + ink.height).toBeGreaterThan(30);
    });

    it("advances the pen so glyphs do not overlap, and width matches the ink", () => {
        const l = layoutStrokeText(SIMPLEX, 'HH', { fontSize: 32 });
        const [first, second] = l.glyphs.map(g => strokesBounds(g.strokes)!);
        expect(second.x).toBeGreaterThan(first.x + first.width);
        expect(l.width).toBeGreaterThan(first.width * 1.8);
    });

    it("applies letterSpacing between glyphs but not after the last", () => {
        const tight = layoutStrokeText(SIMPLEX, 'HHH', { fontSize: 32, letterSpacing: 0 });
        const loose = layoutStrokeText(SIMPLEX, 'HHH', { fontSize: 32, letterSpacing: 10 });
        expect(loose.width).toBeCloseTo(tight.width + 20, 4);   // 3 glyphs → 2 gaps
        const one = layoutStrokeText(SIMPLEX, 'H', { fontSize: 32, letterSpacing: 10 });
        const onePlain = layoutStrokeText(SIMPLEX, 'H', { fontSize: 32 });
        expect(one.width).toBeCloseTo(onePlain.width, 4);
    });

    it("counts a space as advance without emitting a glyph", () => {
        const l = layoutStrokeText(SIMPLEX, 'H H', { fontSize: 32 });
        expect(l.glyphs.length).toBe(2);                        // two H, no space glyph
        const noGap = layoutStrokeText(SIMPLEX, 'HH', { fontSize: 32 });
        expect(l.width).toBeGreaterThan(noGap.width);
    });
});

describe("layoutStrokeText — lines and alignment", () => {
    it("stacks lines by lineHeight × fontSize", () => {
        const one = layoutStrokeText(SIMPLEX, 'H', { fontSize: 20, lineHeight: 2 });
        const two = layoutStrokeText(SIMPLEX, 'H\nH', { fontSize: 20, lineHeight: 2 });
        expect(two.height - one.height).toBeCloseTo(40, 4);
        const [a, b] = two.glyphs.map(g => strokesBounds(g.strokes)!);
        expect(b.y - a.y).toBeCloseTo(40, 4);
        expect(two.glyphs.map(g => g.line)).toEqual([0, 1]);
    });

    it("treats CRLF and CR as line breaks", () => {
        const lf = layoutStrokeText(SIMPLEX, 'A\nB');
        for (const raw of ['A\r\nB', 'A\rB']) {
            expect(layoutStrokeText(SIMPLEX, raw).height).toBeCloseTo(lf.height, 5);
            expect(layoutStrokeText(SIMPLEX, raw).glyphs.length).toBe(2);
        }
    });

    it("aligns short lines left, centre and right within the block", () => {
        const text = 'HHHH\nH';
        const left = layoutStrokeText(SIMPLEX, text, { align: 'left' });
        const centre = layoutStrokeText(SIMPLEX, text, { align: 'center' });
        const right = layoutStrokeText(SIMPLEX, text, { align: 'right' });
        const lastX = (l: ReturnType<typeof layoutStrokeText>) =>
            strokesBounds(l.glyphs.filter(g => g.line === 1).flatMap(g => g.strokes))!.x;
        expect(lastX(left)).toBeLessThan(lastX(centre));
        expect(lastX(centre)).toBeLessThan(lastX(right));
        // The long line is the same in all three, so the block width never moves.
        expect(centre.width).toBeCloseTo(left.width, 5);
        expect(right.width).toBeCloseTo(left.width, 5);
    });

    it("handles empty input and whitespace-only input without throwing", () => {
        expect(layoutStrokeText(SIMPLEX, '').glyphs).toEqual([]);
        expect(layoutStrokeText(SIMPLEX, '').width).toBe(0);
        expect(layoutStrokeText(SIMPLEX, '   ').glyphs).toEqual([]);
        expect(layoutStrokeText(SIMPLEX, '   ').width).toBeGreaterThan(0);  // spaces still advance
    });

    it("reports characters the face cannot draw instead of substituting them", () => {
        // Hershey covers ASCII 32-126. Drawing a different letter would be worse than a gap.
        const l = layoutStrokeText(SIMPLEX, 'Hé☺H');
        expect(l.missingChars.sort()).toEqual(['é', '☺'].sort());
        expect(l.glyphs.map(g => g.char)).toEqual(['H', 'H']);
    });
});

describe("strokesToSubpaths", () => {
    it("makes every subpath open, with corner anchors, relative to the origin", () => {
        const subs = strokesToSubpaths([[10, 20, 30, 40, 50, 60]], { x: 10, y: 20 });
        expect(subs.length).toBe(1);
        expect(subs[0].closed).toBe(false);
        expect(subs[0].anchors).toEqual([
            { x: 0, y: 0, kind: 'corner' },
            { x: 20, y: 20, kind: 'corner' },
            { x: 40, y: 40, kind: 'corner' },
        ]);
    });

    it("keeps a glyph's separate strokes as separate subpaths", () => {
        // 'H' is three pen-down runs; they must not be joined into one polyline, or the
        // crossbar would be connected to the stems by stray diagonals.
        const subs = strokesToSubpaths(SIMPLEX.glyphs['H'].strokes, { x: 0, y: 0 });
        expect(subs.length).toBe(3);
        expect(subs.every(s => !s.closed)).toBe(true);
    });

    it("drops a run with fewer than two points", () => {
        expect(strokesToSubpaths([[1, 2]], { x: 0, y: 0 })).toEqual([]);
        expect(strokesToSubpaths([], { x: 0, y: 0 })).toEqual([]);
    });
});

describe("the registry", () => {
    it("names five faces, defaults to simplex, and validates ids", () => {
        expect(STROKE_FONTS.length).toBe(5);
        expect(isStrokeFontId(DEFAULT_STROKE_FONT)).toBe(true);
        expect(isStrokeFontId('hershey-script')).toBe(true);
        expect(isStrokeFontId('comic-sans')).toBe(false);
    });
});
