/**
 * The locale table and preference matching.
 *
 * Deliberately free of Solid signals and browser globals: the browser hands us a
 * *preference list* (`navigator.languages`), and turning that into one of the
 * locales we actually ship is pure logic that deserves to be tested on its own.
 * The reactive layer lives in `./index.ts` and calls into here.
 *
 * See `docs/i18n-seo-plan.md` §2 for why these twelve, and §6/D1 for why Arabic
 * is in the list but sequenced last.
 */

export type TextDirection = 'ltr' | 'rtl';

export interface LocaleMeta {
    /** BCP-47 tag. Also the URL prefix (`/es/`, `/pt-BR/`) once path routing lands. */
    code: string;
    /** Name in English — used in developer tooling and the coverage report. */
    englishName: string;
    /** Name in its own language — what the language picker shows. */
    nativeName: string;
    dir: TextDirection;
    /**
     * Fraction of `en`'s keys this locale currently translates, 0–1. A locale is
     * only offered to users at or above `READY_THRESHOLD` — a half-translated UI
     * is worse than an English one (plan §8).
     *
     * Maintained by hand, but not on trust: a dictionary file typed as
     * `Dictionary` rather than `Partial<Dictionary>` cannot compile while a key
     * is missing, so a shipped locale is complete by construction and its
     * coverage is 1. Anything below that describes a locale that is planned
     * rather than written — there is no partial dictionary on disk today.
     * `locale-registry.test.ts` holds the two ends together.
     *
     * (An earlier version of this comment credited `scripts/i18n-check.mjs`,
     * which does not exist and never did.)
     */
    coverage: number;
}

/**
 * A locale must translate at least this much of `en` before it appears in the
 * language picker.
 */
export const READY_THRESHOLD = 0.95;

/**
 * The twelve. Order matters only for base-language matching (`pt` → the first
 * entry whose base language is `pt`), so keep regional variants unambiguous.
 */
export const SUPPORTED_LOCALES: readonly LocaleMeta[] = [
    { code: 'en', englishName: 'English', nativeName: 'English', dir: 'ltr', coverage: 1 },
    { code: 'es', englishName: 'Spanish', nativeName: 'Español', dir: 'ltr', coverage: 1 },
    { code: 'pt-BR', englishName: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', dir: 'ltr', coverage: 0 },
    { code: 'fr', englishName: 'French', nativeName: 'Français', dir: 'ltr', coverage: 1 },
    { code: 'de', englishName: 'German', nativeName: 'Deutsch', dir: 'ltr', coverage: 1 },
    { code: 'zh-Hans', englishName: 'Chinese (Simplified)', nativeName: '简体中文', dir: 'ltr', coverage: 0 },
    { code: 'ja', englishName: 'Japanese', nativeName: '日本語', dir: 'ltr', coverage: 1 },
    { code: 'ko', englishName: 'Korean', nativeName: '한국어', dir: 'ltr', coverage: 0 },
    { code: 'ru', englishName: 'Russian', nativeName: 'Русский', dir: 'ltr', coverage: 0 },
    { code: 'hi', englishName: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', coverage: 0 },
    { code: 'id', englishName: 'Indonesian', nativeName: 'Bahasa Indonesia', dir: 'ltr', coverage: 0 },
    { code: 'ar', englishName: 'Arabic', nativeName: 'العربية', dir: 'rtl', coverage: 0 },
];

export const DEFAULT_LOCALE = 'en';

const byCode = new Map(SUPPORTED_LOCALES.map((l) => [l.code.toLowerCase(), l]));

/** Base language of a BCP-47 tag: `pt-BR` → `pt`, `zh-Hans-CN` → `zh`. */
const baseLanguage = (tag: string): string => tag.toLowerCase().split('-')[0];

export const isSupportedLocale = (code: string): boolean => byCode.has(code.toLowerCase());

export const localeMeta = (code: string): LocaleMeta | undefined => byCode.get(code.toLowerCase());

export const isLocaleReady = (code: string): boolean => (localeMeta(code)?.coverage ?? 0) >= READY_THRESHOLD;

/** The locales complete enough to offer in the picker. */
export const readyLocales = (): readonly LocaleMeta[] => SUPPORTED_LOCALES.filter((l) => l.coverage >= READY_THRESHOLD);

export const localeDirection = (code: string): TextDirection => localeMeta(code)?.dir ?? 'ltr';

/**
 * Pick the best supported locale for a browser preference list.
 *
 * Each preference is tried in turn — exact tag first, then base language — and
 * only once every preference has been exhausted do we fall back to English.
 * Trying all strategies against preference #1 before looking at #2 would be
 * wrong the other way; the *order of the user's preferences* outranks the
 * precision of the match, which is why the loop is shaped like this.
 *
 * Base-language matching is what maps `pt` and `pt-PT` onto `pt-BR`, and `zh`,
 * `zh-CN` and `zh-Hans-CN` onto `zh-Hans`. That is intentional: we ship one
 * variant per language, and a near-variant beats English.
 */
export const resolveLocale = (preferred: readonly string[]): string => {
    for (const raw of preferred) {
        if (!raw) continue;
        const tag = raw.toLowerCase();

        const exact = byCode.get(tag);
        if (exact) return exact.code;

        const base = baseLanguage(tag);
        const related = SUPPORTED_LOCALES.find((l) => baseLanguage(l.code) === base);
        if (related) return related.code;
    }
    return DEFAULT_LOCALE;
};
