/**
 * Custom stroke dash-pattern helpers.
 *
 * A stroke's dash can be a named preset (`strokeStyle`/`PaintStroke.dash` = 'solid'|'dashed'|
 * 'dotted') OR a custom on/off pixel array (`strokeDashArray` / `PaintStroke.dashArray`). When a
 * non-empty custom array is present it overrides the preset. Each render/export site keeps its own
 * preset pixel values (they differ slightly between the canvas and SVG paths for historical
 * reasons) and calls {@link resolveDash} to fold in the custom override uniformly.
 */

/** A custom dash array if it's usable (present, finite, non-negative, at least one > 0), else null. */
export function customDash(dashArray?: number[]): number[] | null {
    if (!dashArray || dashArray.length === 0) return null;
    const clean = dashArray.filter(n => Number.isFinite(n) && n >= 0);
    return clean.length && clean.some(n => n > 0) ? clean : null;
}

/**
 * Resolve the effective dash array for a stroke: the custom array if set, else the caller's preset
 * pixel values for the named style, else `undefined` (solid). `dashed`/`dotted` are the preset
 * arrays the call-site wants to use for those named styles.
 */
export function resolveDash(
    style: string | undefined,
    dashArray: number[] | undefined,
    dashed: number[],
    dotted: number[],
): number[] | undefined {
    const cd = customDash(dashArray);
    if (cd) return cd;
    if (style === 'dashed') return dashed;
    if (style === 'dotted') return dotted;
    return undefined;
}

/** Parse a user-typed dash pattern ("10, 5" / "12 4 3 4") into a number array, or undefined. */
export function parseDashInput(s: string): number[] | undefined {
    const nums = s
        .split(/[\s,]+/)
        .map(t => parseFloat(t))
        .filter(n => Number.isFinite(n) && n >= 0);
    return nums.length ? nums : undefined;
}

/** Render a dash array back to a compact editable string ("10, 5"). Empty for none. */
export function dashToString(arr?: number[]): string {
    return arr && arr.length ? arr.join(', ') : '';
}
