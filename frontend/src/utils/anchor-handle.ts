/**
 * The one rule for what happens to a path anchor's *other* Bézier handle when you drag
 * one of them.
 *
 * Three places let you drag a handle — the Pen tool mid-draw (`pen-path-handler`), the
 * Selection tool's direct-select handles (`selection-handler`), and the Node tool overlay
 * (`node-editing`). They had drifted apart: one mirrored with the opposite handle's own
 * length, one forced both to equal length, and one had no way to break the pair at all.
 * Same gesture, three different curves. This is that rule, in one place.
 */

import type { PathAnchor } from '../types';

export interface AnchorHandleOptions {
    /**
     * Alt: break the pair so the two sides move independently, giving a cusp. The anchor
     * is demoted to `corner` so the break *persists* — left `smooth`, the next drag
     * without Alt would mirror it straight back and the break would never survive being
     * let go of. Illustrator's Convert Anchor Point does the same demotion. Rendering
     * reads the handles, not `kind`, so the demotion changes no geometry by itself.
     */
    breakPair?: boolean;
    /**
     * Force the opposite handle to the *same length* as the dragged one, rather than
     * keeping its own.
     *
     * These are two different gestures and they want different answers. Pulling a handle
     * out of a brand-new anchor while drawing with the Pen is one symmetric motion — both
     * sides grow together, and holding the far side at some earlier length would look
     * broken. Adjusting one side of an anchor that already exists is not: there the far
     * handle is part of the neighbouring segment you already shaped, and resizing it to
     * match retensions that curve behind your back. So: symmetric while drawing, own-length
     * while editing.
     */
    symmetric?: boolean;
}

/**
 * Point one of an anchor's handles at (`hx`, `hy`) — a vector *relative to the anchor* —
 * and settle the opposite handle.
 *
 * On a `smooth` anchor the opposite handle mirrors: held opposite in direction, and (by
 * default) keeping its own length. See the options above for the two ways that varies.
 * A `corner` anchor has no pairing to maintain, so it is already independent and only the
 * dragged handle moves.
 *
 * Mutates `a` in place (callers own anchors inside a subpath array they write back).
 */
export function setAnchorHandle(
    a: PathAnchor, which: 'in' | 'out', hx: number, hy: number, opts: AnchorHandleOptions = {},
): void {
    if (which === 'out') { a.outX = hx; a.outY = hy; } else { a.inX = hx; a.inY = hy; }
    if (a.kind !== 'smooth') return;

    if (opts.breakPair) { a.kind = 'corner'; return; }

    const len = Math.hypot(hx, hy);
    // A zero-length drag has no direction to mirror — leave the far side where it is
    // rather than flinging it to NaN or collapsing it onto the anchor.
    if (len < 1e-9) return;
    const ux = hx / len, uy = hy / len;

    // `|| len` also covers the un-set opposite handle (hypot of 0,0), which is how a fresh
    // anchor starts — its first mirror is symmetric whichever mode we are in.
    const oppLen = opts.symmetric
        ? len
        : (which === 'out' ? Math.hypot(a.inX ?? 0, a.inY ?? 0) : Math.hypot(a.outX ?? 0, a.outY ?? 0)) || len;

    if (which === 'out') { a.inX = -ux * oppLen; a.inY = -uy * oppLen; }
    else { a.outX = -ux * oppLen; a.outY = -uy * oppLen; }
}
