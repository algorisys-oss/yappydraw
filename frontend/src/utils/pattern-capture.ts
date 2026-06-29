/**
 * Capture a set of elements into a single raster tile (data URL) for use as a
 * custom pattern fill ("Make Pattern from Selection"). Kept separate from
 * `pattern-fill.ts` to avoid an import cycle: this module imports `render-element`
 * (→ render-pipeline → pattern-fill), and pattern-fill must not import back here.
 */

import rough from "roughjs";
import type { DrawingElement } from "../types";
import { renderElement } from "./render-element";

/**
 * Render `els` into a w×h tile whose top-left is the selection's (minX, minY),
 * returning a PNG data URL (supersampled 2× for crispness) or null. The tile is
 * the geometric bounding box, so the artwork tiles edge-to-edge.
 */
export function captureElementsToDataURL(
    els: DrawingElement[],
    minX: number,
    minY: number,
    w: number,
    h: number,
    isDark = false,
): string | null {
    if (els.length === 0 || w <= 0 || h <= 0) return null;
    const SS = 2;
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(w * SS));
    cv.height = Math.max(1, Math.round(h * SS));
    const ctx = cv.getContext('2d');
    if (!ctx) return null;

    ctx.scale(SS, SS);
    ctx.translate(-minX, -minY); // map world coords into the tile
    const rc = rough.canvas(cv);
    for (const el of els) {
        try { renderElement(rc, ctx, el, isDark); } catch { /* skip an element that can't render */ }
    }
    return cv.toDataURL('image/png');
}
