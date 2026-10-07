/**
 * Built-in font weights (Anshika's review, Phase 4). One stylesheet URL, used everywhere; the
 * editor's own copy lives in index.html, which can't import it, so this pins them together.
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { BUILTIN_FONTS_CSS_URL, BUILTIN_FONT_WEIGHTS } from './builtin-fonts';
import { groupFontFamilies, fontShorthand } from '../utils/font-variants';
import { parseGoogleFontFaces, googleFontCssUrl } from '../utils/custom-fonts';
import { detectWidthRange } from '../utils/font-axes';
import { resolveFontFamily } from '../utils/text-utils';

describe('built-in font stylesheet', () => {
    it('index.html links exactly BUILTIN_FONTS_CSS_URL', () => {
        const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
        expect(html).toContain(`href="${BUILTIN_FONTS_CSS_URL}"`);
    });
    it('each key lists exactly the weights its family is requested at (keys are not family names)', () => {
        // The stored key → CSS family → that family's wght spec in the URL → expanded weights.
        // monospace/code once had each other's ranges: `monospace` is Source Code Pro.
        const url = decodeURIComponent(BUILTIN_FONTS_CSS_URL).replace(/\+/g, ' ');
        for (const [key, weights] of Object.entries(BUILTIN_FONT_WEIGHTS)) {
            const family = resolveFontFamily(key).split(',')[0].trim();
            const spec = url.match(new RegExp(`family=${family}(?::([^&]*))?(?:&|$)`));
            expect(spec, `${key} → ${family} is in the URL`).not.toBeNull();
            const axis = spec![1] ?? '';                                   // '' = one weight (400)
            const upright = axis ? axis.split('@')[1].split(';').filter(p => !p.startsWith('1,')).map(p => p.replace(/^0,/, '')) : ['400'];
            const expected = new Set<number>();
            for (const p of upright) {
                const [lo, hi] = p.split('..').map(Number);
                for (let w = 100; w <= 900; w += 100) if (w >= lo && w <= (hi ?? lo)) expected.add(w);
            }
            expect(weights, `${key} (${family})`).toEqual([...expected].sort((a, b) => a - b));
        }
    });
    it('requests the full ranges, not just 400;700', () => {
        expect(BUILTIN_FONTS_CSS_URL).toContain('Inter:ital,wght@0,100..900;1,100..900');
        expect(BUILTIN_FONTS_CSS_URL).not.toMatch(/wght@400;700/);
    });
});

describe('Style menu for built-ins', () => {
    const caps = new Map(Object.entries({
        'sans-serif': { bold: true, italic: true, weights: BUILTIN_FONT_WEIGHTS['sans-serif'] },
        'hand-drawn': { bold: false, italic: false, weights: BUILTIN_FONT_WEIGHTS['hand-drawn'] },
    }));
    const groups = groupFontFamilies([{ value: 'sans-serif', label: 'Inter' }, { value: 'hand-drawn', label: 'Hand-drawn' }], caps);
    it('Inter offers Thin … Black and their italics', () => {
        const inter = groups.find(g => g.family === 'Inter')!;
        expect(inter.variants).toHaveLength(18);
        expect(inter.variants[0]).toMatchObject({ weight: 100, italic: false });
        expect(inter.variants.map(v => v.styleLabel)).toContain('Black Italic');
        expect(inter.defaultValue).toBe('sans-serif');
    });
    it('a one-weight font stays a single Regular', () => {
        expect(groups.find(g => g.family === 'Hand-drawn')!.variants.map(v => v.styleLabel)).toEqual(['Regular']);
    });
});

describe('Google fonts by name', () => {
    const css = (faces: [string, number | string][]) => faces.map(([st, w]) =>
        `@font-face {\n  font-family: 'X';\n  font-style: ${st};\n  font-weight: ${w};\n  src: url(x.woff2);\n}`).join('\n');
    it('reads the weights and italics Google returned', () => {
        expect(parseGoogleFontFaces(css([['normal', 300], ['normal', 400], ['normal', 800], ['italic', 400]])))
            .toEqual({ weights: [300, 400, 800], italic: true });
        expect(parseGoogleFontFaces(css([['normal', 400]]))).toEqual({ weights: [400], italic: false }); // Lobster
    });
    it('expands a variable face range', () => {
        expect(parseGoogleFontFaces(css([['normal', '300 800']])).weights).toEqual([300, 400, 500, 600, 700, 800]);
    });
    it('asks for every weight as a LIST (a too-wide range is a hard 400)', () => {
        const url = googleFontCssUrl('Open Sans');
        expect(url).toContain('family=Open+Sans:ital,wght@0,100;0,200;');
        expect(url).not.toContain('..');
    });
    it('a Google font with discovered weights lists exactly those', () => {
        const [g] = groupFontFamilies([{ value: 'google-Open Sans', label: 'Open Sans', weights: [300, 400, 700], italic: true }], new Map());
        expect(g.variants.map(v => v.styleLabel)).toEqual(['Light', 'Regular', 'Bold', 'Light Italic', 'Italic', 'Bold Italic']);
    });
});

describe('width', () => {
    it('fontShorthand carries a stretch keyword, and only a valid one', () => {
        expect(fontShorthand(300, 'normal', 16, 'Inter', 'condensed')).toBe('300 condensed 16px Inter');
        expect(fontShorthand(400, 'normal', 16, 'Inter', 'normal')).toBe('16px Inter');
        expect(fontShorthand(400, 'normal', 16, 'Inter', '80%')).toBe('16px Inter');
    });
    it('a file name that says wdth gives a width range', async () => {
        expect(await detectWidthRange(null, 'RobotoFlex-VariableFont_GRAD,XOPQ,wdth,wght')).toEqual([75, 125]);
        expect(await detectWidthRange(null, 'Roboto-VariableFont_wght')).toBeNull();
    });
});
