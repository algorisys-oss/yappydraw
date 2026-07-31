/**
 * font-loading — make sure the app's webfonts are really available before anything
 * measures text with them.
 *
 * Text-bearing elements are auto-sized from `ctx.measureText()` at creation, and the
 * result is written to `el.width`/`el.height` and **saved with the document**. So a
 * measurement taken before the webfont is available doesn't just look wrong for a
 * moment — it bakes the fallback font's metrics permanently into the drawing.
 *
 * The trap is that the obvious guard doesn't work. `document.fonts.status` reads
 * `"loaded"` and `document.fonts.ready` resolves on a freshly-booted page while
 * `document.fonts.check('28px Handlee')` is still **false**: `ready` only settles the
 * fonts that have actually been *requested*, and a family that only appears in a CSS
 * `@import` isn't requested until something first renders with it. Measured cold vs
 * warm, `"AbstractFactory"` at 28px Handlee is 180.39px vs 187.00px — a 3.7% error that
 * silently changed the size of every auto-sized box.
 *
 * `document.fonts.load(...)` is the call that forces the request. This module fires it
 * for every built-in family at boot and hands back a promise, so headless renderers can
 * await a known-good state instead of rendering once to warm the cache.
 *
 * See docs/connector-anchor-direction-spec.md — this was found as "Yappy.clear() leaks
 * state", because clear() happened to be what sat between the cold render and the warm one.
 */

import { getBuiltInFontStacks } from './text-utils';

/** Weight/style combinations the app can ask for; each is a separate font FACE. */
const VARIANTS = ['400', '700', 'italic 400', 'italic 700'];

let pending: Promise<void> | null = null;

/** First family in a CSS stack, quoted if it needs to be (`Source Code Pro` → `"Source Code Pro"`). */
function primaryFamily(stack: string): string {
    const first = stack.split(',')[0].trim().replace(/^["']|["']$/g, '');
    return /\s/.test(first) ? `"${first}"` : first;
}

/**
 * Request every built-in font face. Idempotent — repeated calls share one promise.
 * Never rejects: a blocked or offline font must degrade to the fallback metrics rather
 * than stall boot or break an export.
 */
export function preloadAppFonts(): Promise<void> {
    if (pending) return pending;
    if (typeof document === 'undefined' || !document.fonts) {
        pending = Promise.resolve();
        return pending;
    }
    const loads: Promise<unknown>[] = [];
    for (const stack of getBuiltInFontStacks()) {
        const family = primaryFamily(stack);
        for (const v of VARIANTS) {
            // 16px is arbitrary: the size does not affect WHICH face is fetched.
            try { loads.push(document.fonts.load(`${v} 16px ${family}`).catch(() => undefined)); }
            catch { /* malformed family — skip rather than fail the batch */ }
        }
    }
    pending = Promise.all(loads)
        .then(() => document.fonts.ready)
        .then(() => undefined)
        .catch(() => undefined);
    return pending;
}

/**
 * Resolves once the built-in fonts are usable for measurement. Exposed on the API as
 * `Yappy.fontsReady()` so a headless renderer can await it before importing a document.
 */
export function fontsReady(): Promise<void> {
    return preloadAppFonts();
}

/** True when every built-in family is available to `measureText` right now. */
export function fontsAreLoaded(): boolean {
    if (typeof document === 'undefined' || !document.fonts) return true;
    return getBuiltInFontStacks().every(stack => {
        try { return document.fonts.check(`16px ${primaryFamily(stack)}`); }
        catch { return true; }
    });
}
