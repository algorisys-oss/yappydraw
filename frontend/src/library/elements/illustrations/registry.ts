/**
 * Illustration registry — lookup/search over the bundled OpenMoji subset.
 * Mirrors the inline-offline pattern of `stick-figures/registry.ts::searchStickAssets`
 * (no fetches; name + tag matching).
 */
import { ILLUSTRATIONS, type Illustration } from './assets';

export type { Illustration } from './assets';

export const getIllustration = (id: string): Illustration | undefined =>
    ILLUSTRATIONS.find(a => a.id === id);

/**
 * Case-insensitive match on name / tags against any of the given query tokens
 * (the caller passes the raw query plus its alias expansions). Empty tokens →
 * no results (search view only; illustrations don't appear in the browse view).
 */
export function searchIllustrations(tokens: string[]): Illustration[] {
    const qs = tokens.map(t => t.trim().toLowerCase()).filter(Boolean);
    if (qs.length === 0) return [];
    return ILLUSTRATIONS.filter(a => {
        const name = a.name.toLowerCase();
        return qs.some(q =>
            name.includes(q) ||
            a.tags.some(t => t.includes(q)));
    });
}
