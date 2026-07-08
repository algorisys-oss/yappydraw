/**
 * Stick-figure library registry — category metadata + lookup/search helpers.
 * Mirrors the inline-offline pattern of `templates/registry.ts` (no fetches).
 */
import { STICK_ASSETS } from './assets';
import type { StickAsset, StickCategory, StickCategoryInfo } from './types';

export const STICK_CATEGORIES: StickCategoryInfo[] = [
    { id: 'daily', name: 'Daily & Emotions', description: 'Everyday actions and feelings — standing, waving, walking, celebrating' },
    { id: 'office', name: 'Office & Work', description: 'Workplace scenes — laptops, presenting, briefcases' },
    { id: 'meetings', name: 'Meetings & Talks', description: 'Conferences and workshops — speakers, charts, raised hands' },
    { id: 'travel', name: 'Street & Travel', description: 'Out and about — running, cycling, commuting' },
    { id: 'social', name: 'Social & Family', description: 'Gatherings — dancing, celebrating, relaxing' },
    { id: 'services', name: 'Services', description: 'Special situations and services — delivery, support, healthcare' },
];

export const getStickAsset = (id: string): StickAsset | undefined =>
    STICK_ASSETS.find(a => a.id === id);

export const getStickAssetsByCategory = (category: StickCategory): StickAsset[] =>
    STICK_ASSETS.filter(a => a.category === category);

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
