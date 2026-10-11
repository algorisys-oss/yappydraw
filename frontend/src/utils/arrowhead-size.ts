/**
 * Arrowhead size — one rule for the canvas (both render styles), SVG export and the
 * organic-branch renderer.
 *
 * Before this the fallback was a flat 28px wherever a connector carried no explicit
 * `startArrowheadSize`/`endArrowheadSize`, and the tool defaults wrote an explicit 28 onto
 * every arrow drawn by hand. On a 1.5px architecture-diagram line that is a head nineteen
 * line-widths long, and three such heads on one 120px side overlap into a saw-tooth.
 *
 * The default now follows the stroke: 6px + 5× the stroke width, clamped to 10–28px, so a
 * 1.5px line gets ~14px, the 2px default gets 16px and a 4.4px+ line keeps today's 28px.
 * An explicit size set in the Properties panel or by a script still wins.
 */

export const ARROWHEAD_MIN = 10;
export const ARROWHEAD_MAX = 28;

/** The size an arrowhead takes when none is set, for a line of `strokeWidth` px. */
export function defaultArrowheadSize(strokeWidth?: number | null): number {
    const w = typeof strokeWidth === 'number' && strokeWidth > 0 ? strokeWidth : 2;
    return Math.round(Math.min(ARROWHEAD_MAX, Math.max(ARROWHEAD_MIN, 6 + 5 * w)));
}

/** The size to draw: the element's explicit size for that end, else the stroke-based default. */
export function arrowheadSize(
    el: { strokeWidth?: number; startArrowheadSize?: number; endArrowheadSize?: number },
    which: 'start' | 'end'
): number {
    const explicit = which === 'start' ? el.startArrowheadSize : el.endArrowheadSize;
    return typeof explicit === 'number' && explicit > 0 ? explicit : defaultArrowheadSize(el.strokeWidth);
}
