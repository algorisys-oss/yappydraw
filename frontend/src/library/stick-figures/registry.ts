/**
 * Stick-figure library registry — category metadata + lookup/search/filter.
 * Mirrors the inline-offline pattern of `templates/registry.ts` (no fetches).
 */
import { STICK_ASSETS } from './assets';
import type { StickAsset, StickCategory, StickCategoryInfo } from './types';

export const STICK_CATEGORIES: StickCategoryInfo[] = [
    { id: 'daily', name: 'Daily & Emotions', description: 'Everyday actions and feelings — standing, waving, walking, thinking, celebrating' },
    { id: 'office', name: 'Office & Work', description: 'Workplace scenes — laptops, presenting, calls, coffee, ideas' },
    { id: 'meetings', name: 'Meetings & Talks', description: 'Conferences and workshops — speakers, charts, raised hands, notes, applause' },
    { id: 'travel', name: 'Street & Travel', description: 'Out and about — running, cycling, commuting, luggage, umbrellas' },
    { id: 'social', name: 'Social & Family', description: 'Gatherings — dancing, celebrating, gifts, selfies, toasts' },
    { id: 'services', name: 'Services', description: 'Special situations and services — delivery, support, healthcare, hospitality' },
    { id: 'props', name: 'Props', description: 'Standalone objects — laptops, phones, charts, boxes, bulbs, bubbles' },
    { id: 'scenes', name: 'Scenes', description: 'Multi-figure bundles — handshakes, teams, families, celebrations' },
];

/** Character variants (props/scenes have no variant). */
export const STICK_VARIANTS = ['male', 'female', 'boy', 'girl'] as const;
export type StickVariant = typeof STICK_VARIANTS[number];

export const getStickAsset = (id: string): StickAsset | undefined =>
    STICK_ASSETS.find(a => a.id === id);

export const getStickAssetsByCategory = (category: StickCategory): StickAsset[] =>
    STICK_ASSETS.filter(a => a.category === category);

/**
 * Filter by category and/or character variant. Props and scenes carry no variant,
 * so they always pass the variant filter. `variant: 'all'` disables it.
 */
export function filterStickAssets(opts: { category?: StickCategory | 'all'; variant?: StickVariant | 'all' } = {}): StickAsset[] {
    const cat = opts.category ?? 'all';
    const v = opts.variant ?? 'male';
    return STICK_ASSETS.filter(a => {
        if (cat !== 'all' && a.category !== cat) return false;
        if (v !== 'all' && a.variant && a.variant !== v) return false;
        return true;
    });
}

/** Case-insensitive match on name / tags / category. Empty query returns all. */
export function searchStickAssets(query: string): StickAsset[] {
    const q = query.trim().toLowerCase();
    if (!q) return STICK_ASSETS;
    return STICK_ASSETS.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.category.includes(q) ||
        a.tags.some(t => t.includes(q)));
}

export const getAllStickAssets = (): StickAsset[] => STICK_ASSETS;
