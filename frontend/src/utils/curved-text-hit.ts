/**
 * Hit-testing curved text by its letters.
 *
 * A Type-on-Path object (`typeOnPath`) is an unpainted path that carries text, Illustrator's
 * model: you click the words, not an invisible ring. And even on a shape that still carries its
 * own curved text, the letters often sit well outside the shape's box (text round the outside
 * of a circle), where a click used to fall through to whatever was behind.
 *
 * Uses the same layout as the renderer (`layoutTextAlongPath`), so the hit area is exactly the
 * drawn glyphs. Lives here rather than in hit-testing.ts's geometry phase because it is checked
 * in `hitTestElement` BEFORE the JS/WASM geometry split — both engines see the same answer.
 */
import type { DrawingElement } from '../types';
import { getElementTextPath, layoutTextAlongPath, textPathOptionsFor } from './text-on-path';
import { getFontString, getMeasurementContext } from './text-utils';

const glyphMeasurer = (el: DrawingElement, fontSize: number): ((ch: string) => number) => {
    try {
        const ctx = getMeasurementContext();
        ctx.font = getFontString(el);
        return ch => ctx.measureText(ch).width;
    } catch {
        // No DOM (unit tests, workers): an average glyph is a little over half an em.
        return () => fontSize * 0.6;
    }
};

/** True when the element's curved text has any glyphs to hit. */
export const carriesCurvedText = (el: DrawingElement): boolean =>
    !!el.curvedText && !!el.containerText && !(el.richContainerText && el.richContainerText.length > 0);

/** Does world point (x, y) land on one of the element's curved-text glyphs? */
export function hitTestCurvedText(el: DrawingElement, x: number, y: number, threshold = 0): boolean {
    if (!carriesCurvedText(el)) return false;
    const tp = getElementTextPath(el);
    if (!tp || tp.points.length < 2) return false;

    // Outline points are unrotated; the renderer turns the whole element about its centre.
    const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
    const a = -(el.angle || 0), ca = Math.cos(a), sa = Math.sin(a);
    const px = cx + (x - cx) * ca - (y - cy) * sa;
    const py = cy + (x - cx) * sa + (y - cy) * ca;

    const fontSize = el.fontSize || 16;
    const { glyphs } = layoutTextAlongPath(glyphMeasurer(el, fontSize), el.containerText!, tp.points, fontSize,
        textPathOptionsFor(el, fontSize, tp.closed));
    const halfH = fontSize * 0.5 + threshold;
    for (const g of glyphs) {
        const c = Math.cos(g.angle), s = Math.sin(g.angle);
        // Glyph centre: the path point, then `side` along the glyph's own y axis.
        const gx = g.x - g.side * s, gy = g.y + g.side * c;
        const dx = px - gx, dy = py - gy;
        const u = dx * c + dy * s, v = -dx * s + dy * c;
        if (Math.abs(u) <= g.width / 2 + threshold && Math.abs(v) <= halfH) return true;
    }
    return false;
}

const painted = (c?: string | null) => !!c && c !== 'transparent' && c !== 'none';

/** A Type-on-Path object whose guide path has no paint: only its letters are clickable. */
export const isBareTypeOnPath = (el: DrawingElement): boolean =>
    !!el.typeOnPath && !painted(el.strokeColor) && !painted(el.backgroundColor);
