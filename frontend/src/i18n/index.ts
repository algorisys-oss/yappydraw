/**
 * The i18n runtime.
 *
 * `t` is a Solid-reactive translator: it reads the active-locale signal, so any
 * component or derivation that calls it re-renders when the language changes.
 * That is why `getCommands()` in the command registry can keep returning plain
 * strings and still be translatable — the palette calls it inside a derivation,
 * and the read is tracked.
 *
 *     import { t } from '../i18n'
 *     t('commands.action-undo')                       // → "Undo"
 *     t('commands.layer-activate', { name: 'Layer 1' }) // → "Activate Layer: Layer 1"
 *
 * Dictionaries are merged over English rather than replacing it, so a locale
 * that is missing a key falls back to the English string for that key alone. A
 * partly-translated UI degrades string by string instead of showing blanks.
 *
 * See docs/i18n-seo-plan.md §3.1.
 */

import { createSignal } from 'solid-js';
import * as i18n from '@solid-primitives/i18n';
import { en, type Dictionary } from './locales/en';
import { PSEUDO_LOCALE, pseudoizeDictionary } from './pseudo';
import {
    DEFAULT_LOCALE,
    isLocaleReady,
    localeDirection,
    resolveLocale,
} from './locale-resolution';
import * as fmt from './format';

export type { Dictionary };
export type FlatDictionary = i18n.Flatten<Dictionary>;
export type TranslationKey = keyof FlatDictionary;
/**
 * The tool types that have a name in the dictionary. Used to type
 * `shapeToolCatalog`, so adding a shape to the toolbar without naming it in
 * `en.ts` is a compile error rather than a blank entry in the command palette.
 */
export type ShapeKey = keyof Dictionary['shapes'];
/** Keys of the keyboard-shortcut descriptions, used to type the help dialog's data table. */
export type HotkeyKey = keyof Dictionary['hotkeys'];
/** Keys of the shortcut category headings. */
export type HotkeyCategoryKey = keyof Dictionary['hotkeyCategory'];
/** Keys of the welcome screen's capability list. */
export type WelcomeFeatureKey = keyof Dictionary['welcomeFeatures'];
/** Keys of the toolbar button tooltips. */
export type ToolbarToolKey = keyof Dictionary['toolbarTool'];
/** Keys of the toolbar dock position names. */
export type DockPositionKey = keyof Dictionary['dockPosition'];
/** Keys of the toolbar dock action phrasings. */
export type DockActionKey = keyof Dictionary['dockAction'];

export * from './locale-resolution';
export { PSEUDO_LOCALE } from './pseudo';
export type { PluralForms, PluralCategory } from './format';

/** Where the user's choice is remembered between sessions. */
const STORAGE_KEY = 'yappy.locale';

/**
 * Dictionaries for locales other than English, loaded on demand so the base
 * bundle carries only `en`. Each entry is a lazy import, so a visitor downloads
 * only their own language.
 *
 * Registering a locale means touching three places — this map, its `coverage` in
 * `locale-resolution.ts`, and the file itself. `locale-registry.test.ts` asserts
 * all three agree, because the failure mode of forgetting one is silent: the
 * translation sits on disk and is never served.
 *
 * (yappykit derives the equivalent map from `import.meta.glob`, which cannot
 * drift at all. That is the better mechanism, but it is a Vite build-time
 * transform and these tests run under `bun test` with no Vite in the pipeline,
 * so the guarantee is enforced by a test here instead of by the bundler.)
 */
export const LOCALE_LOADERS: Record<string, () => Promise<Partial<Dictionary>>> = {
    de: () => import('./locales/de').then((m) => m.de),
    es: () => import('./locales/es').then((m) => m.es),
    fr: () => import('./locales/fr').then((m) => m.fr),
    ja: () => import('./locales/ja').then((m) => m.ja),
};

const flatEn = i18n.flatten(en);

const [locale, setLocaleSignal] = createSignal<string>(DEFAULT_LOCALE);
const [dict, setDict] = createSignal<FlatDictionary>(flatEn as FlatDictionary);

/** The active locale tag. Reactive. */
export const currentLocale = locale;

/** Text direction of the active locale. Reactive. */
export const currentDirection = () => localeDirection(locale());

/**
 * Translate a key. Reactive — reads the active locale.
 * Keys are checked at compile time against the English dictionary.
 */
export const t = i18n.translator(dict, i18n.resolveTemplate);

/**
 * Nested access for call sites where the dotted string is awkward:
 * `chained.commandPalette.noResults()`. Same reactivity as `t`.
 */
export const chained = i18n.chainedTranslator(en, t);

/**
 * Overlay a (possibly partial) translation onto English and flatten the result.
 *
 * The merge is deep and happens BEFORE flattening, which matters: flattening
 * first and spreading would let a partial \`commands\` object overwrite English's
 * complete one wholesale, so every untranslated command in that namespace would
 * vanish rather than fall back. Merging first means a locale falls back one
 * *string* at a time, which is the whole point.
 *
 * Exported for tests — this is the fallback guarantee, and it deserves one.
 */
export const mergeDictionary = (translated: Partial<Dictionary>): FlatDictionary =>
    i18n.flatten(deepMerge(en, translated) as Dictionary) as FlatDictionary;

const deepMerge = (base: unknown, overlay: unknown): unknown => {
    if (!overlay || typeof overlay !== 'object' || Array.isArray(overlay)) return overlay ?? base;
    if (!base || typeof base !== 'object') return overlay;

    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [key, value] of Object.entries(overlay)) {
        out[key] = key in out ? deepMerge(out[key], value) : value;
    }
    return out;
};

const loadDictionary = async (code: string): Promise<FlatDictionary> => {
    if (code === DEFAULT_LOCALE) return flatEn as FlatDictionary;
    if (code === PSEUDO_LOCALE) return i18n.flatten(pseudoizeDictionary(en)) as FlatDictionary;

    const load = LOCALE_LOADERS[code];
    if (!load) return flatEn as FlatDictionary;
    return mergeDictionary(await load());
};

/** Mirror the locale onto the document so CSS and assistive tech can see it. */
const applyToDocument = (code: string): void => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = code === PSEUDO_LOCALE ? DEFAULT_LOCALE : code;
    document.documentElement.dir = localeDirection(code);
};

/**
 * Switch language. Resolves once the dictionary is in place, so callers can
 * await it before, say, taking a screenshot.
 */
export const setLocale = async (code: string): Promise<void> => {
    const next = await loadDictionary(code);
    setDict(() => next);
    setLocaleSignal(code);
    applyToDocument(code);

    if (typeof localStorage !== 'undefined') {
        try {
            localStorage.setItem(STORAGE_KEY, code);
        } catch {
            // Private-browsing quota errors must not take the app down over a
            // language preference.
        }
    }
};

const storedLocale = (): string | null => {
    if (typeof localStorage === 'undefined') return null;
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
};

/**
 * Whether the pseudo-locale is offered. Dev builds always; production only with
 * an explicit `?pseudo` in the URL, so it is reachable for a smoke test on the
 * real deploy but never selectable by accident.
 */
export const pseudoLocaleAvailable = (): boolean => {
    const dev = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);
    if (dev) return true;
    return typeof location !== 'undefined' && location.search.includes('pseudo');
};

/**
 * Choose the starting locale and load it. Call once at boot, before render.
 *
 * An explicitly stored choice wins. Otherwise the browser's preference list is
 * matched against the locales we ship — but the result is then clamped to a
 * locale that is actually *translated*: resolving a Spanish browser to `es`
 * while the Spanish dictionary is still empty would set `<html lang="es">` over
 * an English UI, which is worse for both users and search engines than plain
 * English.
 */
export const initI18n = async (): Promise<void> => {
    const stored = storedLocale();
    if (stored && (isLocaleReady(stored) || (stored === PSEUDO_LOCALE && pseudoLocaleAvailable()))) {
        await setLocale(stored);
        return;
    }

    const languages = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : [];
    const preferred = resolveLocale(languages);
    await setLocale(isLocaleReady(preferred) ? preferred : DEFAULT_LOCALE);
};

// Locale-aware formatting, bound to the active locale so call sites do not have
// to thread it through. The explicit-locale versions stay available from
// './format' for tests and for formatting in a locale other than the user's.
export const formatNumber = (value: number, decimals?: number) => fmt.formatNumber(locale(), value, decimals);
export const formatInteger = (value: number) => fmt.formatInteger(locale(), value);
export const formatPercent = (fraction: number, decimals?: number) => fmt.formatPercent(locale(), fraction, decimals);
export const formatDate = (value: Date | number, options?: Intl.DateTimeFormatOptions) =>
    fmt.formatDate(locale(), value, options);
export const formatList = (items: readonly string[]) => fmt.formatList(locale(), items);
export const plural = (count: number, forms: fmt.PluralForms) => fmt.plural(locale(), count, forms);
