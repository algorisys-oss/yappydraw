/**
 * Locale-aware formatting, built on the platform's own `Intl` rather than a
 * dependency. Everything here takes the locale explicitly so it stays pure and
 * testable; components get the ambient version from `./index.ts`.
 *
 * The rule this file enforces: a number, date or count that reaches the user is
 * formatted here, never with `.toFixed()` or string concatenation. `1,234.5` and
 * `1.234,5` are the same number, and a German user seeing the first one is
 * reading a bug.
 */

/** The plural categories `Intl.PluralRules` can return. */
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

/**
 * The forms a countable string needs. `other` is mandatory: it is the fallback
 * for every category a given locale asks for that we did not author, so a
 * missing Russian `many` degrades to readable text instead of `undefined`.
 */
export type PluralForms = Partial<Record<PluralCategory, string>> & { other: string };

// Intl constructors are expensive relative to a format() call, and these run in
// render paths. Cache per (locale, options) pair.
const numberFormats = new Map<string, Intl.NumberFormat>();
const dateFormats = new Map<string, Intl.DateTimeFormat>();
const pluralRules = new Map<string, Intl.PluralRules>();
const listFormats = new Map<string, Intl.ListFormat>();

const numberFormat = (locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat => {
    const key = `${locale}|${JSON.stringify(options ?? {})}`;
    let f = numberFormats.get(key);
    if (!f) numberFormats.set(key, (f = new Intl.NumberFormat(locale, options)));
    return f;
};

/**
 * Format a number for display. Pass `decimals` to pin the precision — that is
 * the `toFixed` replacement, and unlike `toFixed` it produces the right decimal
 * separator and digit grouping for the locale.
 */
export const formatNumber = (locale: string, value: number, decimals?: number): string =>
    numberFormat(
        locale,
        decimals === undefined ? undefined : { minimumFractionDigits: decimals, maximumFractionDigits: decimals },
    ).format(value);

/** Format a number with no fractional part (canvas coordinates, counts, sizes). */
export const formatInteger = (locale: string, value: number): string =>
    numberFormat(locale, { maximumFractionDigits: 0 }).format(value);

/** `0.42` → `42%`. Takes a fraction, not an already-multiplied percentage. */
export const formatPercent = (locale: string, fraction: number, decimals = 0): string =>
    numberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(fraction);

export const formatDate = (
    locale: string,
    value: Date | number,
    options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string => {
    const key = `${locale}|${JSON.stringify(options)}`;
    let f = dateFormats.get(key);
    if (!f) dateFormats.set(key, (f = new Intl.DateTimeFormat(locale, options)));
    return f.format(value);
};

/** `["a","b","c"]` → `a, b, and c`, with the locale's own conjunction. */
export const formatList = (locale: string, items: readonly string[]): string => {
    let f = listFormats.get(locale);
    if (!f) listFormats.set(locale, (f = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' })));
    return f.format(items);
};

/**
 * Select and interpolate the right plural form for `count`.
 *
 * Uses the locale's own categories rather than English's binary singular/plural.
 * Russian needs one/few/many — `count === 1 ? one : other` gets 2 and 5 wrong,
 * and that mistake is invisible to anyone reviewing in English.
 *
 * `{{count}}` in the chosen form is replaced with the *formatted* count, so the
 * grouping separator is right too.
 */
export const plural = (locale: string, count: number, forms: PluralForms): string => {
    let rules = pluralRules.get(locale);
    if (!rules) pluralRules.set(locale, (rules = new Intl.PluralRules(locale)));

    const category = rules.select(count) as PluralCategory;
    const template = forms[category] ?? forms.other;
    return template.replace(/\{\{\s*count\s*\}\}/g, formatNumber(locale, count));
};
