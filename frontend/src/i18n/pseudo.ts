/**
 * Pseudo-localization — a generated, dev-only "locale" that transforms English
 * rather than translating it.
 *
 * It exists to answer two questions that no amount of reading the diff can:
 *
 *  1. **What did we miss?** Anything still rendering in plain Latin letters is a
 *     hardcoded string that never made it into the dictionary. The eye finds
 *     these instantly against a screen of accented text; grep does not, because
 *     grep cannot tell a label from a CSS class name.
 *  2. **What will overflow?** Translations run longer than English — German by
 *     roughly a third — so every string is padded to at least 130% and wrapped
 *     in brackets. A clipped `⟧` marks a container that will break in Phase 3
 *     before we have paid a translator to find out.
 *
 * The transform is a look-alike map, so the result stays readable: `Send to
 * Back` → `⟦Šéñð ţö Ɓáçķ····⟧`. Placeholders are passed through untouched — a
 * mangled `{{ name }}` would break interpolation and hide the real bug.
 *
 * Never shipped to users: `./index.ts` only offers this locale in dev builds or
 * behind an explicit `?pseudo` opt-in.
 */

export const PSEUDO_LOCALE = 'pseudo';

/** Padding needed to reach 130% of the source length — the German headroom. */
const EXPANSION = 1.3;

const LOOKALIKE: Record<string, string> = {
    a: 'á', b: 'ƀ', c: 'ç', d: 'ð', e: 'é', f: 'ƒ', g: 'ğ', h: 'ĥ', i: 'í',
    j: 'ĵ', k: 'ķ', l: 'ł', m: 'ɱ', n: 'ñ', o: 'ö', p: 'þ', q: 'ǫ', r: 'ř',
    s: 'š', t: 'ţ', u: 'ü', v: 'ṽ', w: 'ŵ', x: 'ẋ', y: 'ý', z: 'ž',
    A: 'Á', B: 'Ɓ', C: 'Ç', D: 'Ð', E: 'É', F: 'Ƒ', G: 'Ğ', H: 'Ĥ', I: 'Í',
    J: 'Ĵ', K: 'Ķ', L: 'Ł', M: 'Ɱ', N: 'Ñ', O: 'Ö', P: 'Þ', Q: 'Ǫ', R: 'Ř',
    S: 'Š', T: 'Ţ', U: 'Û', V: 'Ṽ', W: 'Ŵ', X: 'Ẋ', Y: 'Ý', Z: 'Ž',
};

/** `{{ anything }}` — kept verbatim so interpolation still works. */
const PLACEHOLDER = /(\{\{[^}]*\}\})/g;

const accent = (text: string): string => {
    let out = '';
    for (const ch of text) out += LOOKALIKE[ch] ?? ch;
    return out;
};

/**
 * Transform one English string into its pseudo-localized form.
 * Deterministic: the same input always produces the same output, so screenshots
 * and snapshot tests stay stable.
 */
export const pseudoize = (source: string): string => {
    const accented = source
        .split(PLACEHOLDER)
        .map((part) => (part.startsWith('{{') ? part : accent(part)))
        .join('');

    const padding = Math.max(0, Math.ceil(source.length * EXPANSION) - source.length);
    return `⟦${accented}${'·'.repeat(padding)}⟧`;
};

/**
 * Pseudoize every string in a dictionary, preserving its shape. Non-string
 * leaves (numbers, functions) are passed through — only text is transformed.
 */
export const pseudoizeDictionary = <T>(dict: T): T => {
    if (typeof dict === 'string') return pseudoize(dict) as unknown as T;
    if (Array.isArray(dict)) return dict.map(pseudoizeDictionary) as unknown as T;
    if (dict && typeof dict === 'object') {
        const out: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(dict)) out[key] = pseudoizeDictionary(value);
        return out as T;
    }
    return dict;
};
