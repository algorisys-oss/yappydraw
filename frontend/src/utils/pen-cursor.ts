/**
 * Pen cursors with Illustrator's badges: + add anchor, − delete anchor, ○ close the path,
 * / continue an open path. A crosshair (so aiming is unchanged) with the badge at the lower
 * right, drawn white-under-black so it reads on any canvas.
 *
 * Lives in a .ts file on purpose: SVG markup inside a .tsx reads as JSX text to the i18n
 * ratchet (scripts/i18n-lint.mjs), and none of this is user-facing copy.
 */

export type PenCursorBadge = 'add' | 'delete' | 'close' | 'continue';

const GLYPH: Record<PenCursorBadge, string> = {
    add: '<path d="M17 21h8M21 17v8"/>',
    delete: '<path d="M17 21h8"/>',
    close: '<circle cx="21" cy="21" r="3.5"/>',
    continue: '<path d="M18 24l6-6"/>',
};

const cache = new Map<PenCursorBadge, string>();

/** CSS `cursor` value for a badged Pen cursor; hotspot at the crosshair centre. */
export function penCursor(badge: PenCursorBadge): string {
    const hit = cache.get(badge);
    if (hit) return hit;
    const glyph = GLYPH[badge];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke-linecap="round">`
        + `<g stroke="rgba(255,255,255,.95)" stroke-width="3.5"><path d="M10 1v18M1 10h18"/>${glyph}</g>`
        + `<g stroke="rgba(0,0,0,.9)" stroke-width="1.5"><path d="M10 1v18M1 10h18"/>${glyph}</g></svg>`;
    const css = `url("data:image/svg+xml,${encodeURIComponent(svg)}") 10 10, crosshair`;
    cache.set(badge, css);
    return css;
}
