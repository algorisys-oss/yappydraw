import { describe, it, expect } from "bun:test";
import {
    normalizeFontWeight, normalizeFontStyle, styleLabel, fontShorthand,
    parseFontVariant, groupFontFamilies, pickVariant, resolveActiveVariant,
} from "./font-variants";

describe("normalizeFontWeight", () => {
    it("maps the legacy boolean encoding", () => {
        expect(normalizeFontWeight(true)).toBe(700);
        expect(normalizeFontWeight(false)).toBe(400);
        expect(normalizeFontWeight(undefined)).toBe(400);
    });

    it("maps CSS keywords and numeric strings", () => {
        expect(normalizeFontWeight('bold')).toBe(700);
        expect(normalizeFontWeight('normal')).toBe(400);
        expect(normalizeFontWeight('600')).toBe(600);
        expect(normalizeFontWeight('semibold')).toBe(600);
        expect(normalizeFontWeight('Semi Bold')).toBe(600);
        expect(normalizeFontWeight('extra-light')).toBe(200);
    });

    it("passes numbers through, snapped to the axis", () => {
        expect(normalizeFontWeight(500)).toBe(500);
        expect(normalizeFontWeight(650)).toBe(700);
        expect(normalizeFontWeight(1200)).toBe(900);
        expect(normalizeFontWeight(50)).toBe(100);
    });

    it("never returns NaN for junk", () => {
        expect(normalizeFontWeight('' as any)).toBe(400);
        expect(normalizeFontWeight(NaN)).toBe(400);
        expect(normalizeFontWeight('wibble')).toBe(400);
        expect(normalizeFontWeight(null)).toBe(400);
    });
});

describe("normalizeFontStyle", () => {
    it("maps the legacy boolean and the CSS keywords", () => {
        expect(normalizeFontStyle(true)).toBe('italic');
        expect(normalizeFontStyle(false)).toBe('normal');
        expect(normalizeFontStyle('italic')).toBe('italic');
        expect(normalizeFontStyle('oblique')).toBe('italic');
        expect(normalizeFontStyle('normal')).toBe('normal');
        expect(normalizeFontStyle(undefined)).toBe('normal');
    });
});

describe("fontShorthand", () => {
    it("emits a valid CSS font string in spec order", () => {
        expect(fontShorthand(700, false, 16, 'Inter')).toBe('700 16px Inter');
        expect(fontShorthand(400, true, 20, 'Inter')).toBe('italic 20px Inter');
        expect(fontShorthand(600, 'italic', 12, '"My Font", sans-serif')).toBe('italic 600 12px "My Font", sans-serif');
    });

    it("survives the legacy boolean that used to produce 'true 16px …'", () => {
        // `${el.fontWeight || 'normal'} ${size}px ${family}` gave "true 16px Inter" — an
        // invalid font string, which canvas ignores wholesale, so bold never applied.
        expect(fontShorthand(true, false, 16, 'Inter')).toBe('700 16px Inter');
        expect(fontShorthand(false, true, 16, 'Inter')).toBe('italic 16px Inter');
    });

    it("omits the weight at 400 so the shorthand stays minimal", () => {
        expect(fontShorthand(400, false, 16, 'Inter')).toBe('16px Inter');
    });
});

describe("styleLabel", () => {
    it("names the axis the way type menus do", () => {
        expect(styleLabel(400, false)).toBe('Regular');
        expect(styleLabel(400, true)).toBe('Italic');       // not "Regular Italic"
        expect(styleLabel(700, false)).toBe('Bold');
        expect(styleLabel(700, true)).toBe('Bold Italic');
        expect(styleLabel(300, false)).toBe('Light');
        expect(styleLabel(600, true)).toBe('SemiBold Italic');
    });
});

describe("parseFontVariant", () => {
    it("splits the hyphenated form font vendors ship", () => {
        expect(parseFontVariant('Montserrat-Bold')).toEqual({ family: 'Montserrat', weight: 700, italic: false });
        expect(parseFontVariant('Roboto-Light')).toEqual({ family: 'Roboto', weight: 300, italic: false });
        expect(parseFontVariant('Inter-Regular')).toEqual({ family: 'Inter', weight: 400, italic: false });
    });

    it("splits glued camelCase style words", () => {
        expect(parseFontVariant('Montserrat-SemiBoldItalic')).toEqual({ family: 'Montserrat', weight: 600, italic: true });
        expect(parseFontVariant('OpenSansExtraBold')).toEqual({ family: 'Open Sans', weight: 800, italic: false });
    });

    it("handles underscores and spaces", () => {
        expect(parseFontVariant('Playfair_Display_Black')).toEqual({ family: 'Playfair Display', weight: 900, italic: false });
        expect(parseFontVariant('Source Serif Medium Italic')).toEqual({ family: 'Source Serif', weight: 500, italic: true });
    });

    it("reads a bare numeric weight", () => {
        expect(parseFontVariant('Inter-700')).toEqual({ family: 'Inter', weight: 700, italic: false });
    });

    it("treats a name with no style words as that family's Regular", () => {
        expect(parseFontVariant('MyLogoFont')).toEqual({ family: 'My Logo Font', weight: 400, italic: false });
    });

    it("does not strip a style word from the MIDDLE of a family name", () => {
        // "Bold Script" is a real family name; only trailing style words are consumed.
        const r = parseFontVariant('Bold Script Regular');
        expect(r.family).toBe('Bold Script');
        expect(r.weight).toBe(400);
    });

    it("keeps a family whose whole name is a style word", () => {
        expect(parseFontVariant('Black').family).toBe('Black');
    });
});

describe("groupFontFamilies", () => {
    const BUILTINS = new Set(['sans-serif']);

    it("collapses variants of one family into a single entry", () => {
        const groups = groupFontFamilies([
            { value: 'custom-1', label: 'Montserrat-Light' },
            { value: 'custom-2', label: 'Montserrat-Regular' },
            { value: 'custom-3', label: 'Montserrat-Bold' },
            { value: 'custom-4', label: 'Montserrat-BoldItalic' },
        ], BUILTINS);

        expect(groups).toHaveLength(1);
        expect(groups[0].family).toBe('Montserrat');
        expect(groups[0].variants.map(v => v.styleLabel)).toEqual(['Light', 'Regular', 'Bold', 'Bold Italic']);
    });

    it("defaults a family to its Regular", () => {
        const [g] = groupFontFamilies([
            { value: 'custom-3', label: 'Montserrat-Bold' },
            { value: 'custom-2', label: 'Montserrat-Regular' },
        ], BUILTINS);
        expect(g.defaultValue).toBe('custom-2');
    });

    it("falls back to the lightest upright variant when there is no Regular", () => {
        const [g] = groupFontFamilies([
            { value: 'custom-9', label: 'Anton-Black' },
            { value: 'custom-8', label: 'Anton-Bold' },
        ], BUILTINS);
        expect(g.defaultValue).toBe('custom-8'); // 700 is lighter than 900
    });

    it("keeps separate families separate", () => {
        const groups = groupFontFamilies([
            { value: 'custom-1', label: 'Montserrat-Bold' },
            { value: 'custom-2', label: 'Lora-Bold' },
        ], BUILTINS);
        expect(groups.map(g => g.family)).toEqual(['Lora', 'Montserrat']); // alphabetical
    });

    it("gives built-ins their curated label as the family and synthetic styles", () => {
        const [g] = groupFontFamilies([{ value: 'sans-serif', label: 'Sans Serif' }], BUILTINS);
        expect(g.family).toBe('Sans Serif');
        expect(g.variants.map(v => v.styleLabel)).toEqual(['Regular', 'Bold', 'Italic', 'Bold Italic']);
        // All four styles map to the same stored fontFamily value — the style rides on the
        // element's fontWeight/fontStyle, since the renderer synthesises it.
        expect(new Set(g.variants.map(v => v.value)).size).toBe(1);
    });

    it("does not list the same style twice", () => {
        const [g] = groupFontFamilies([
            { value: 'custom-1', label: 'Inter-Bold' },
            { value: 'custom-2', label: 'Inter Bold' },   // same style, different file name
        ], BUILTINS);
        expect(g.variants).toHaveLength(1);
    });

    it("sorts upright before italic, light before heavy", () => {
        const [g] = groupFontFamilies([
            { value: 'a', label: 'X-BoldItalic' },
            { value: 'b', label: 'X-Bold' },
            { value: 'c', label: 'X-Italic' },
            { value: 'd', label: 'X-Light' },
        ], BUILTINS);
        expect(g.variants.map(v => v.styleLabel)).toEqual(['Light', 'Bold', 'Italic', 'Bold Italic']);
    });
});

describe("pickVariant", () => {
    const [montserrat] = groupFontFamilies([
        { value: 'm-light', label: 'Montserrat-Light' },
        { value: 'm-reg', label: 'Montserrat-Regular' },
        { value: 'm-bold', label: 'Montserrat-Bold' },
        { value: 'm-boldit', label: 'Montserrat-BoldItalic' },
    ], new Set());

    it("keeps the style when switching family where an exact match exists", () => {
        expect(pickVariant(montserrat, 700, false).value).toBe('m-bold');
        expect(pickVariant(montserrat, 300, false).value).toBe('m-light');
    });

    it("falls to the nearest weight rather than resetting to Regular", () => {
        // No SemiBold here; 600 is nearer 700 than 400.
        expect(pickVariant(montserrat, 600, false).value).toBe('m-bold');
    });

    it("prefers the right slant", () => {
        expect(pickVariant(montserrat, 700, true).value).toBe('m-boldit');
    });

    it("uses the upright variants when the family has no italic at all", () => {
        const [g] = groupFontFamilies([{ value: 'x', label: 'Anton-Regular' }], new Set());
        expect(pickVariant(g, 400, true).value).toBe('x');
    });
});

describe("groupFontFamilies — built-in capabilities", () => {
    it("only offers the styles a built-in can actually synthesise", () => {
        // 'hand-drawn' ships one binary and can fake neither bold nor italic — the same rule
        // the greyed-out Bold/Italic buttons already follow.
        const caps = new Map([
            ['hand-drawn', { bold: false, italic: false }],
            ['caveat', { bold: true, italic: false }],
            ['poppins', { bold: true, italic: true }],
        ]);
        const groups = groupFontFamilies([
            { value: 'hand-drawn', label: 'Hand-drawn' },
            { value: 'caveat', label: 'Caveat' },
            { value: 'poppins', label: 'Poppins' },
        ], caps);

        const byName = Object.fromEntries(groups.map(g => [g.family, g.variants.map(v => v.styleLabel)]));
        expect(byName['Hand-drawn']).toEqual(['Regular']);
        expect(byName['Caveat']).toEqual(['Regular', 'Bold']);
        expect(byName['Poppins']).toEqual(['Regular', 'Bold', 'Italic', 'Bold Italic']);
    });

    it("does not parse a built-in's curated label as a variant name", () => {
        // A built-in called "Light" must stay the family "Light", not become a weight.
        const [g] = groupFontFamilies([{ value: 'light', label: 'Light' }],
            new Map([['light', { bold: false, italic: false }]]));
        expect(g.family).toBe('Light');
    });
});

describe("resolveActiveVariant", () => {
    const [montserrat] = groupFontFamilies([
        { value: 'm-light', label: 'Montserrat-Light' },
        { value: 'm-reg', label: 'Montserrat-Regular' },
        { value: 'm-bold', label: 'Montserrat-Bold' },
        { value: 'm-boldit', label: 'Montserrat-BoldItalic' },
    ], new Set());

    const [poppins] = groupFontFamilies([{ value: 'poppins', label: 'Poppins' }],
        new Map([['poppins', { bold: true, italic: true }]]));

    it("believes the FILE for a real-file family, even with no fontWeight set", () => {
        // An element assigned Montserrat-Bold by key — from the API, a template, or a
        // document written before weights existed — has fontWeight undefined (→ 400).
        // Reading the fields there would report a Bold file as Regular.
        expect(resolveActiveVariant(montserrat, 'm-bold', 400, false).styleLabel).toBe('Bold');
        expect(resolveActiveVariant(montserrat, 'm-light', 400, false).styleLabel).toBe('Light');
        expect(resolveActiveVariant(montserrat, 'm-boldit', 400, false).styleLabel).toBe('Bold Italic');
    });

    it("uses the weight/slant fields for a built-in, whose styles are synthesised", () => {
        // Every built-in style shares one key, so the fields are all there is to go on.
        expect(resolveActiveVariant(poppins, 'poppins', 400, false).styleLabel).toBe('Regular');
        expect(resolveActiveVariant(poppins, 'poppins', 700, false).styleLabel).toBe('Bold');
        expect(resolveActiveVariant(poppins, 'poppins', 700, true).styleLabel).toBe('Bold Italic');
        expect(resolveActiveVariant(poppins, 'poppins', 400, true).styleLabel).toBe('Italic');
    });

    it("falls back to the nearest style when the key isn't in the family at all", () => {
        expect(resolveActiveVariant(montserrat, 'not-here', 700, false).styleLabel).toBe('Bold');
    });
});
