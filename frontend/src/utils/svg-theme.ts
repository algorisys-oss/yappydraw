/**
 * Themeable SVG export.
 *
 * A normal SVG export bakes whatever colours the canvas had, so the file is
 * pinned to one theme: export on a light canvas and it stays light forever, even
 * embedded in a dark page.
 *
 * When a colour comes from a swatch we know its *name*, so it can be exported as
 * a CSS variable instead of a literal:
 *
 *     fill="var(--yd-danger, #ef4444)"
 *
 * The hex stays as the fallback, so a viewer that ignores the stylesheet still
 * renders the intended colour. A swatch with a `darkColor` also emits a
 * `prefers-color-scheme: dark` override, which is what makes one file work on
 * both a light and a dark page.
 */

import type { DrawingElement, Swatch } from '../types';

export const DEFAULT_VAR_PREFIX = 'yd';

export interface SvgThemeOptions {
    /** 'static' bakes literal colours (the default). 'variables' emits CSS custom properties. */
    theme?: 'static' | 'variables';
    /** Custom prefix for the emitted variables. Defaults to `yd`. */
    varPrefix?: string;
}

/** Swatch name → CSS custom property name. Keeps only characters valid unescaped. */
export function swatchVarName(name: string, prefix = DEFAULT_VAR_PREFIX): string {
    const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return `--${prefix}-${slug || 'swatch'}`;
}

/** `var(--yd-danger, #ef4444)` */
export function swatchVarRef(name: string, fallback: string, prefix = DEFAULT_VAR_PREFIX): string {
    return `var(${swatchVarName(name, prefix)}, ${fallback})`;
}

/**
 * Map each linked colour on an element to its variable reference.
 *
 * Keyed by the literal hex because that is what actually lands in the generated
 * SVG attributes: rough.js and the clean-path branch both write the colour we
 * handed them. Two different swatches resolving to the same hex collapse to one
 * entry, which is harmless since the rendered colour is identical either way.
 */
export function elementColorVars(
    el: DrawingElement,
    swatchById: Map<string, Swatch>,
    prefix = DEFAULT_VAR_PREFIX
): Map<string, string> {
    const map = new Map<string, string>();

    const link = (swatchId: string | undefined, literal: string | undefined) => {
        if (!swatchId || !literal || literal === 'transparent') return;
        const sw = swatchById.get(swatchId);
        if (!sw) return;
        map.set(literal.toLowerCase(), swatchVarRef(sw.name, literal, prefix));
    };

    link(el.fillSwatchId, el.backgroundColor);
    link(el.strokeSwatchId, el.strokeColor);

    return map;
}

/** Paint attributes that can carry a colour we might want to swap. */
const PAINT_ATTRS = ['fill', 'stroke', 'stop-color', 'flood-color'] as const;

/**
 * Rewrite an element's generated SVG subtree so linked colours reference their
 * variable. Walks the node itself plus every descendant, because rough.js emits
 * a group of paths and the clean-path branch emits nested shapes.
 */
export function applyColorVars(node: SVGElement, colorVars: Map<string, string>): void {
    if (colorVars.size === 0) return;

    const visit = (n: Element) => {
        for (const attr of PAINT_ATTRS) {
            const val = n.getAttribute(attr);
            if (!val) continue;
            const swapped = colorVars.get(val.toLowerCase());
            if (swapped) n.setAttribute(attr, swapped);
        }
        // Inline styles win over attributes, so they have to be handled too.
        const style = (n as SVGElement).style;
        if (style) {
            for (const attr of PAINT_ATTRS) {
                const val = style.getPropertyValue(attr);
                if (!val) continue;
                const swapped = colorVars.get(val.trim().toLowerCase());
                if (swapped) style.setProperty(attr, swapped);
            }
        }
        for (let i = 0; i < n.children.length; i++) visit(n.children[i]);
    };

    visit(node);
}

/**
 * CSS declaring every used variable, with a dark-scheme override for the
 * swatches that define one. Returns '' when nothing is themed, so the caller can
 * skip the style block entirely.
 */
export function buildThemeStyleSheet(
    usedSwatches: Swatch[],
    prefix = DEFAULT_VAR_PREFIX
): string {
    if (usedSwatches.length === 0) return '';

    const light = usedSwatches
        .map(s => `    ${swatchVarName(s.name, prefix)}: ${s.color};`)
        .join('\n');

    const darkOnes = usedSwatches.filter(s => s.darkColor);
    const dark = darkOnes.length === 0 ? '' : `
  @media (prefers-color-scheme: dark) {
    :root {
${darkOnes.map(s => `      ${swatchVarName(s.name, prefix)}: ${s.darkColor};`).join('\n')}
    }
  }`;

    return `
  :root {
${light}
  }${dark}
`;
}
