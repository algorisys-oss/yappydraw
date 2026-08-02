/**
 * Diagram palettes — named colour roles for the DSL.
 *
 * A diagram declares its colours once and refers to them by name thereafter:
 *
 *     palette: { danger: '#ef4444' }
 *     style:   { backgroundColor: '@danger' }
 *
 * Each role becomes a document swatch and every element that uses it is linked
 * to that swatch, so recolouring the role updates the whole diagram. The link is
 * also what the themeable SVG export reads to emit one CSS variable per role.
 */

import type { DSLPalette } from '../types';
import { ensureSwatch } from '../../store/app-store';

/** Colour style keys that may hold an `@role` reference, and the link they imply. */
const ROLE_TARGETS: ReadonlyArray<{ key: string; link?: 'fillSwatchId' | 'strokeSwatchId' }> = [
    { key: 'backgroundColor', link: 'fillSwatchId' },
    { key: 'strokeColor', link: 'strokeSwatchId' },
    // Text and chrome colours resolve, but there is no element field to link them
    // through, so they get the role's colour without live recolouring.
    { key: 'textColor' },
    { key: 'textHighlightColor' },
    { key: 'shadowColor' },
    { key: 'innerBorderColor' },
];

export interface PaletteBinding {
    /** role name → resolved light colour */
    colors: Map<string, string>;
    /** role name → document swatch id */
    swatchIds: Map<string, string>;
}

/** `@danger` → `danger`. Returns null for anything that is not a role reference. */
export function roleRef(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    if (value.length < 2 || value[0] !== '@') return null;
    return value.slice(1);
}

/**
 * Create (or update) one swatch per declared role and return the bindings.
 * Returns an empty binding when the diagram declares no palette, so callers can
 * treat the palette path as always-on without a branch.
 */
export function bindPalette(palette: DSLPalette | undefined): PaletteBinding {
    const colors = new Map<string, string>();
    const swatchIds = new Map<string, string>();
    if (!palette) return { colors, swatchIds };

    for (const [role, def] of Object.entries(palette)) {
        const light = typeof def === 'string' ? def : def?.light;
        const dark = typeof def === 'string' ? undefined : def?.dark;
        if (!light) {
            console.warn(`[YappyDSL] Palette role "${role}" has no colour; ignored.`);
            continue;
        }
        colors.set(role, light);
        swatchIds.set(role, ensureSwatch(role, light, dark, 'palette'));
    }

    return { colors, swatchIds };
}

/**
 * Replace `@role` references in a style options object with real colours, and
 * report the swatch links the caller should set on the element.
 *
 * Mutates `opts` in place, which is what every other style step in the engine
 * does. An unknown role is left untouched and warned about rather than throwing:
 * one typo should not cost the whole diagram.
 */
export function applyPalette(opts: Record<string, any>, binding: PaletteBinding): Record<string, string> {
    const links: Record<string, string> = {};
    if (binding.colors.size === 0) return links;

    for (const { key, link } of ROLE_TARGETS) {
        const role = roleRef(opts[key]);
        if (!role) continue;

        const color = binding.colors.get(role);
        if (color === undefined) {
            console.warn(`[YappyDSL] Unknown palette role "@${role}" on ${key}; left as-is.`);
            continue;
        }

        opts[key] = color;
        const swatchId = link ? binding.swatchIds.get(role) : undefined;
        if (link && swatchId) links[link] = swatchId;
    }

    return links;
}
