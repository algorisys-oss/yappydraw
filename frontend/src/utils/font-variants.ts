/**
 * Font families, weights and styles.
 *
 * Two problems live here, and they are the same problem.
 *
 * **The picker showed variants as families.** Every font a user added from a file became its
 * own top-level entry, so `Montserrat-Light`, `Montserrat-Bold` and `Montserrat-ExtraBold`
 * sat in the list as three unrelated typefaces. Illustrator splits this into Font Family and
 * Font Style, and that's only possible if something can look at a pile of font files and work
 * out which ones are the same family.
 *
 * **Weight was a boolean.** `fontWeight?: boolean` can express Regular and Bold and nothing
 * else, so Light / Medium / SemiBold / Black had nowhere to live even once the files were
 * there. It is now a number on the usual 100–900 CSS axis.
 *
 * Both legacy encodings still turn up — in saved documents, in the API, in templates — so
 * everything reading a weight goes through `normalizeFontWeight`. That matters more than it
 * looks: a lot of code did `el.fontWeight ? 'bold ' : ''`, and `400` is truthy, so a plain
 * Regular would render Bold anywhere the raw value is still trusted.
 */

export type FontStyleName = 'normal' | 'italic';

/** CSS weight axis → the names type designers actually use. */
export const WEIGHT_LABELS: Record<number, string> = {
    100: 'Thin',
    200: 'ExtraLight',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'SemiBold',
    700: 'Bold',
    800: 'ExtraBold',
    900: 'Black',
};

export const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

/** Name (lowercased, spaces removed) → weight. Includes the common aliases. */
const WEIGHT_BY_NAME: Record<string, number> = {
    thin: 100, hairline: 100,
    extralight: 200, ultralight: 200,
    light: 300,
    regular: 400, normal: 400, book: 400, roman: 400,
    medium: 500,
    semibold: 600, demibold: 600, demi: 600,
    bold: 700,
    extrabold: 800, ultrabold: 800,
    black: 900, heavy: 900, ultra: 900, fat: 900,
};

const ITALIC_NAMES = new Set(['italic', 'oblique', 'it']);

/**
 * Any of the encodings a weight has ever had in this codebase → a number on the 100–900 axis.
 *
 *   `true` / `'bold'`          → 700   (the old boolean toggle, and CSS's keyword)
 *   `false` / `''` / undefined → 400
 *   `700` / `'700'`            → 700
 *   `'semibold'`               → 600
 */
export function normalizeFontWeight(v: number | boolean | string | undefined | null): number {
    if (v === undefined || v === null || v === false || v === '') return 400;
    if (v === true) return 700;
    if (typeof v === 'number') return Number.isFinite(v) ? clampWeight(v) : 400;
    const s = String(v).trim().toLowerCase();
    const n = Number(s);
    if (Number.isFinite(n) && s !== '') return clampWeight(n);
    if (s === 'bolder') return 700;
    if (s === 'lighter') return 300;
    return WEIGHT_BY_NAME[s.replace(/[\s_-]/g, '')] ?? 400;
}

/** Snap to the nearest 100 within 100–900 — a stray 650 would break variant lookup. */
function clampWeight(n: number): number {
    return Math.max(100, Math.min(900, Math.round(n / 100) * 100));
}

/** `true` / `'italic'` / `'oblique'` → 'italic'; everything else → 'normal'. */
export function normalizeFontStyle(v: boolean | string | undefined | null): FontStyleName {
    if (v === true) return 'italic';
    if (typeof v === 'string' && ITALIC_NAMES.has(v.trim().toLowerCase())) return 'italic';
    return 'normal';
}

/** The style name shown in the Font Style dropdown: "Bold Italic", "Light", "Regular". */
export function styleLabel(weight: number, italic: boolean): string {
    const w = WEIGHT_LABELS[clampWeight(weight)] ?? String(weight);
    if (!italic) return w;
    return w === 'Regular' ? 'Italic' : `${w} Italic`;
}

/**
 * A CSS/canvas `font` shorthand, in the order the spec requires: style, weight, size, family.
 *
 * Several renderers built this by hand as `${el.fontWeight || 'normal'} ${size}px ${family}`,
 * which with the old boolean produced `"true 16px Inter"` — not a valid font string, so the
 * canvas silently ignored the whole assignment and kept the previous font. Bold connector
 * labels and bold BPMN text have therefore never actually been bold.
 */
export function fontShorthand(
    weight: number | boolean | string | undefined,
    style: boolean | string | undefined,
    sizePx: number,
    cssFamily: string,
): string {
    const w = normalizeFontWeight(weight);
    const s = normalizeFontStyle(style);
    return `${s === 'italic' ? 'italic ' : ''}${w !== 400 ? `${w} ` : ''}${sizePx}px ${cssFamily}`;
}

// ─── Working out a family + style from a font file's name ────────────────────

/**
 * Split a font file's name into family, weight and slant.
 *
 * Font files are named for humans, not parsers — `Montserrat-SemiBoldItalic`,
 * `Roboto_Light`, `OpenSans Bold`, `Inter-Regular` — but the vocabulary of style words is
 * small and always at the *end*, which makes this tractable. Everything left over after the
 * trailing style words are consumed is the family name.
 *
 * A name with no style words at all (`MyLogoFont`) is a Regular of its own family, which is
 * the right answer: a one-file family shows a single "Regular" style rather than pretending
 * to variants it doesn't have.
 */
export function parseFontVariant(label: string): { family: string; weight: number; italic: boolean } {
    // Normalise the separators font vendors use, and split camelCase/PascalCase runs so
    // `SemiBoldItalic` becomes three tokens. The digit rules keep `Roboto2` and weight
    // numbers (`Inter-700`) intact.
    const spaced = label
        .replace(/[_\-]+/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Za-z])(\d)/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();

    const tokens = spaced.split(' ').filter(Boolean);
    let italic = false;
    let weight: number | null = null;

    // Consume style words from the end. Stop at the first token that isn't one — a style
    // word in the middle of a name (`Bold Script`, a family genuinely called that) then
    // stays part of the family, which is the safer reading.
    let end = tokens.length;
    while (end > 0) {
        const raw = tokens[end - 1].toLowerCase();

        if (ITALIC_NAMES.has(raw)) { italic = true; end--; continue; }

        // A bare number that looks like a weight (`Inter 700`).
        if (/^\d{3}$/.test(raw) && WEIGHTS.includes(clampWeight(Number(raw)))) {
            if (weight === null) weight = clampWeight(Number(raw));
            end--; continue;
        }

        // Two-word forms — `Semi Bold`, `Extra Light`, `Ultra Bold` — which camelCase
        // splitting produces from `SemiBold`. Check the pair before the single word, or
        // `Bold` would be consumed on its own and `Semi` left stranded in the family.
        if (end >= 2) {
            const pair = (tokens[end - 2] + raw).toLowerCase();
            if (WEIGHT_BY_NAME[pair] !== undefined) {
                if (weight === null) weight = WEIGHT_BY_NAME[pair];
                end -= 2; continue;
            }
        }

        if (WEIGHT_BY_NAME[raw] !== undefined) {
            if (weight === null) weight = WEIGHT_BY_NAME[raw];
            end--; continue;
        }

        break;
    }

    const family = tokens.slice(0, end).join(' ').trim();
    return {
        // Everything was a style word (`Bold.ttf`): keep the original as the family rather
        // than producing a nameless entry the picker can't show.
        family: family || label.trim(),
        weight: weight ?? 400,
        italic,
    };
}

// ─── Grouping the picker's flat option list into families ────────────────────

export interface FontVariantOption {
    /** The `fontFamily` value stored on elements — a built-in key or a `custom-N` key. */
    value: string;
    weight: number;
    italic: boolean;
    /** "Bold Italic", "Light", … */
    styleLabel: string;
}

export interface FontFamilyGroup {
    /** Display name, e.g. "Montserrat". */
    family: string;
    /** The variant chosen when the family is picked — its Regular, or the closest thing. */
    defaultValue: string;
    variants: FontVariantOption[];
}

export interface RawFontOption { value: string; label: string }

/** What a built-in family can be asked to synthesise. */
export interface FontCaps { bold: boolean; italic: boolean }

/**
 * Group a flat `{ value, label }` option list into families with styles.
 *
 * `builtins` names the options that are app built-ins rather than user files, and says which
 * styles each can synthesise. Built-ins keep their label verbatim as the family — they are
 * curated names like "Hand-drawn" and "Marker", not file names, so parsing them would mangle
 * a family legitimately called e.g. "Light" — and their styles are synthetic, because they
 * ship one binary and the renderer fakes the rest. A built-in that *can't* fake bold (only
 * one weight is bundled) doesn't offer Bold, which is the same rule the existing
 * greyed-out Bold button already follows.
 *
 * User files are parsed, since their names really are `Family-Weight`, and every style they
 * offer is a real file.
 */
export function groupFontFamilies(
    options: RawFontOption[], builtins: ReadonlyMap<string, FontCaps> | ReadonlySet<string>,
): FontFamilyGroup[] {
    const groups = new Map<string, FontFamilyGroup>();
    const capsOf = (value: string): FontCaps | null => {
        if (builtins instanceof Map) return builtins.get(value) ?? null;
        return (builtins as ReadonlySet<string>).has(value) ? { bold: true, italic: true } : null;
    };
    const isBuiltin = (value: string) =>
        builtins instanceof Map ? builtins.has(value) : (builtins as ReadonlySet<string>).has(value);

    const add = (family: string, v: FontVariantOption) => {
        const key = family.toLowerCase();
        let g = groups.get(key);
        if (!g) { g = { family, defaultValue: v.value, variants: [] }; groups.set(key, g); }
        // Don't list the same style twice — two files that parse to the same style would
        // otherwise give a dropdown with two identical rows and no way to tell them apart.
        if (!g.variants.some(x => x.weight === v.weight && x.italic === v.italic)) g.variants.push(v);
    };

    for (const opt of options) {
        if (isBuiltin(opt.value)) {
            // One entry, up to four synthesisable styles. The stored value is the same for
            // all of them — which style you get rides on `fontWeight`/`fontStyle`.
            const caps = capsOf(opt.value) ?? { bold: true, italic: true };
            add(opt.label, { value: opt.value, weight: 400, italic: false, styleLabel: 'Regular' });
            if (caps.bold) add(opt.label, { value: opt.value, weight: 700, italic: false, styleLabel: 'Bold' });
            if (caps.italic) add(opt.label, { value: opt.value, weight: 400, italic: true, styleLabel: 'Italic' });
            if (caps.bold && caps.italic) add(opt.label, { value: opt.value, weight: 700, italic: true, styleLabel: 'Bold Italic' });
            continue;
        }
        const { family, weight, italic } = parseFontVariant(opt.label);
        add(family, { value: opt.value, weight, italic, styleLabel: styleLabel(weight, italic) });
    }

    for (const g of groups.values()) {
        // Upright before italic, then light to heavy — the order every type menu uses.
        g.variants.sort((a, b) => (a.italic === b.italic ? a.weight - b.weight : (a.italic ? 1 : -1)));
        const regular = g.variants.find(v => v.weight === 400 && !v.italic)
            ?? g.variants.find(v => !v.italic)
            ?? g.variants[0];
        g.defaultValue = regular.value;
    }

    return [...groups.values()].sort((a, b) => a.family.localeCompare(b.family));
}

/**
 * The variant of `group` that best matches a wanted weight/slant.
 *
 * Picking a family shouldn't throw away the style you were already using: switching from
 * Montserrat SemiBold to a family whose heaviest weight is Bold should land on Bold, not
 * silently reset to Regular. Prefers the right slant, then the nearest weight.
 */
export function pickVariant(group: FontFamilyGroup, weight: number, italic: boolean): FontVariantOption {
    const w = clampWeight(weight);
    const sameSlant = group.variants.filter(v => v.italic === italic);
    const pool = sameSlant.length ? sameSlant : group.variants;
    return pool.reduce((best, v) =>
        Math.abs(v.weight - w) < Math.abs(best.weight - w) ? v : best, pool[0]);
}

/**
 * Which style an element is *actually* in — what the Font Style dropdown should read.
 *
 * The font key and the weight/slant fields are two different sources of truth, and which one
 * to believe depends on the family. For a family made of real files, the key names one file
 * and that file **is** the style: `Montserrat-Bold` is Bold whatever `fontWeight` happens to
 * say, and an element assigned that font by key (from the API, a template, or a document
 * made before weights existed) usually has no `fontWeight` at all. Trusting the fields there
 * reports a Bold file as Regular.
 *
 * For a built-in the key is shared by every style, because they're synthesised — so there the
 * weight/slant fields are the only thing that distinguishes them.
 */
export function resolveActiveVariant(
    group: FontFamilyGroup, fontKey: string, weight: number, italic: boolean,
): FontVariantOption {
    const byKey = group.variants.filter(v => v.value === fontKey);
    if (byKey.length === 1) return byKey[0];                       // a real file: it is the style
    const exact = byKey.find(v => v.weight === clampWeight(weight) && v.italic === italic);
    return exact ?? pickVariant(group, weight, italic);
}
