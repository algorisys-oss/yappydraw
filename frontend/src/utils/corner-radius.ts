/**
 * Corner radii for rectangles — the uniform `borderRadius` plus optional per-corner overrides.
 *
 * `borderRadius` is a PERCENT of the shorter side (0–50), not pixels, so a rounded rectangle
 * keeps its proportions when resized. The per-corner fields use the same unit for exactly that
 * reason — mixing a percent uniform with pixel corners would make a resize change the shape's
 * character. Any corner left unset falls back to `borderRadius`, so setting one corner does not
 * silently square the other three.
 *
 * Everything that needs a rectangle's outline resolves it here: the renderer (both draw styles),
 * `shape-geometry` (which fills, clips and hit-tests against it) and `shape-to-path` (Knife,
 * Warp, Pathfinder, Convert to Path). One resolver so those cannot disagree about what the
 * shape's corners are.
 */

/** Order matches CSS `border-radius` and the canvas `roundRect` array: TL, TR, BR, BL. */
export type CornerRadii = [number, number, number, number];

interface RadiusSource {
    width: number;
    height: number;
    borderRadius?: number;
    /** Legacy flag; the real element type is `null | { type: number }`, and any truthy
     *  value means "rounded" — matching what the renderer has always tested. */
    roundness?: unknown;
    radiusTL?: number;
    radiusTR?: number;
    radiusBR?: number;
    radiusBL?: number;
}

/** True when any corner is set independently — i.e. the shape is not uniformly rounded. */
export function hasPerCornerRadius(el: Partial<RadiusSource> | null | undefined): boolean {
    if (!el) return false;
    return el.radiusTL !== undefined || el.radiusTR !== undefined
        || el.radiusBR !== undefined || el.radiusBL !== undefined;
}

/** The uniform radius in px — the legacy behaviour, unchanged. `fallback` is the old
 *  `roundness` ratio for the shape (rect 0.15, diamond 0.2). */
export function uniformRadiusPx(el: RadiusSource, fallback = 0.15): number {
    const min = Math.min(Math.abs(el.width), Math.abs(el.height));
    if (el.borderRadius !== undefined) return min * (el.borderRadius / 100);
    return el.roundness ? min * fallback : 0;
}

/**
 * All four corners in px, clamped so no corner can exceed half the shorter side (beyond that
 * the arcs cross and the outline self-intersects).
 */
export function cornerRadiiPx(el: RadiusSource, fallback = 0.15): CornerRadii {
    const min = Math.min(Math.abs(el.width), Math.abs(el.height));
    const cap = min / 2;
    const base = uniformRadiusPx(el, fallback);
    const pick = (pct: number | undefined) =>
        Math.max(0, Math.min(cap, pct === undefined ? base : min * (pct / 100)));
    return [pick(el.radiusTL), pick(el.radiusTR), pick(el.radiusBR), pick(el.radiusBL)];
}

/** The radii in the form `roundRect` wants: a plain number while all four agree. */
export function roundRectRadii(el: RadiusSource, fallback = 0.15): number | CornerRadii {
    const r = cornerRadiiPx(el, fallback);
    return r.every(v => v === r[0]) ? r[0] : r;
}

/**
 * SVG path for a rectangle with four independent corners. Quadratic corners, matching the
 * shape this codebase already drew for the uniform case (and what rough.js is handed in
 * sketch mode).
 */
export function roundedRectPath(x: number, y: number, w: number, h: number, radii: CornerRadii): string {
    const [tl, tr, br, bl] = radii;
    return `M ${x + tl} ${y}`
        + ` L ${x + w - tr} ${y}` + (tr ? ` Q ${x + w} ${y} ${x + w} ${y + tr}` : '')
        + ` L ${x + w} ${y + h - br}` + (br ? ` Q ${x + w} ${y + h} ${x + w - br} ${y + h}` : '')
        + ` L ${x + bl} ${y + h}` + (bl ? ` Q ${x} ${y + h} ${x} ${y + h - bl}` : '')
        + ` L ${x} ${y + tl}` + (tl ? ` Q ${x} ${y} ${x + tl} ${y}` : '')
        + ' Z';
}
