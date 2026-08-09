/**
 * Line spacing (leading) — one definition of how far apart a text element's lines sit.
 *
 * The 1.2× factor used to be written out at every site that laid out text: the canvas
 * renderer, three measurement helpers, text-to-outlines, the rich-text layout, the typewriter
 * animation and both editing overlays. That is fine while it is a constant and a liability the
 * moment it becomes a setting — miss one site and the editor disagrees with the canvas, or the
 * export disagrees with both.
 *
 * `lineHeight` on the element is a MULTIPLE of the font size (like CSS `line-height: 1.4`), not
 * a pixel value, so it survives resizing the text and stays meaningful when spans within a rich
 * text element have different sizes.
 */

/** What every text element used before the setting existed; still the default. */
export const DEFAULT_LINE_HEIGHT = 1.2;

/** Sane bounds for the UI and for anything arriving from a file or the API. */
export const MIN_LINE_HEIGHT = 0.5;
export const MAX_LINE_HEIGHT = 4;

/**
 * The element's line-height multiple, defaulted and clamped. Accepts anything with an optional
 * `lineHeight` (or nothing at all) so call sites don't need a DrawingElement in hand.
 */
export function lineHeightFactorOf(el?: { lineHeight?: number } | null): number {
    const f = el?.lineHeight;
    if (typeof f !== 'number' || !isFinite(f) || f <= 0) return DEFAULT_LINE_HEIGHT;
    return Math.min(MAX_LINE_HEIGHT, Math.max(MIN_LINE_HEIGHT, f));
}

/** Distance between successive baselines, in px. */
export function lineHeightPx(fontSize: number, el?: { lineHeight?: number } | null): number {
    return fontSize * lineHeightFactorOf(el);
}
