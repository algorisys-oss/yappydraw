import type { DrawingElement } from '../types';

/**
 * Builds a CSS filter string from individual filter properties.
 * Returns 'none' if all values are at default (no filtering needed).
 */
export function buildFilterString(el: DrawingElement): string {
    const parts: string[] = [];

    const b = el.filterBrightness;
    const c = el.filterContrast;
    const s = el.filterSaturate;
    const blur = el.filterBlur;
    const h = el.filterHueRotate;
    const inv = el.filterInvert;
    const sep = el.filterSepia;

    if (b !== undefined && b !== 100) parts.push(`brightness(${b}%)`);
    if (c !== undefined && c !== 100) parts.push(`contrast(${c}%)`);
    if (s !== undefined && s !== 100) parts.push(`saturate(${s}%)`);
    if (blur !== undefined && blur > 0) parts.push(`blur(${blur}px)`);
    if (h !== undefined && h !== 0) parts.push(`hue-rotate(${h}deg)`);
    if (inv !== undefined && inv > 0) parts.push(`invert(${inv}%)`);
    if (sep !== undefined && sep > 0) parts.push(`sepia(${sep}%)`);

    return parts.length > 0 ? parts.join(' ') : 'none';
}

/**
 * Check if element has any non-default filter values.
 */
export function hasActiveFilters(el: DrawingElement): boolean {
    return buildFilterString(el) !== 'none';
}
