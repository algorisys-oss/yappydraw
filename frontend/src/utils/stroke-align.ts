/**
 * Stroke alignment — Inside / Center / Outside.
 *
 * Canvas 2D (and rough.js) only strokes on the CENTRE of an outline: half the width falls
 * inside the shape, half outside. Illustrator/Figma also offer inside and outside, which is
 * what precise vector work needs — a 12px border on a map region should not eat 6px of the
 * region it frames.
 *
 * The trick, rather than offsetting geometry (which would have to be re-derived per shape and
 * breaks on self-intersections): draw the stroke at DOUBLE width and clip away the half that
 * lands on the wrong side of the outline.
 *
 *   inside   → clip to the outline, stroke ×2 → only the inner half survives.
 *   outside  → clip to everything EXCEPT the outline, stroke ×2 → only the outer half survives.
 *
 * Because the clip is applied around the shape renderer's own draw call, this works for every
 * shape and BOTH draw styles (sketch/rough.js and architectural) without touching the ~120
 * renderer call sites. Fill, text and shadow are drawn in a separate UNCLIPPED pass for both
 * alignments — `outside` because the inverse clip would erase them, `inside` because the clip
 * would crop the shadow off.
 *
 * Only shapes with a resolvable closed outline can be aligned; everything else falls back to
 * centre, which is what it already did.
 */

import type { DrawingElement } from '../types';
import { buildClipPath2D, maskFillRule } from './clip-mask';

/** Elements whose outline is open (or has no meaningful inside) — alignment is a no-op. */
const OPEN_TYPES = new Set([
    'line', 'arrow', 'connector', 'bezier',
    'fineliner', 'inkbrush', 'marker', 'ink', 'laser', 'eraser',
    'text', 'richtext', 'image',
]);

export type StrokeAlign = 'center' | 'inside' | 'outside';

/** The effective alignment for an element, after the "is this even possible" checks. */
export function effectiveStrokeAlign(el: DrawingElement): StrokeAlign {
    const align = el.strokeAlign;
    if (!align || align === 'center') return 'center';
    // No visible stroke → nothing to align.
    if (!el.strokeColor || el.strokeColor === 'transparent' || el.strokeColor === 'none') return 'center';
    if (!(el.strokeWidth > 0)) return 'center';
    if (OPEN_TYPES.has(el.type)) return 'center';
    // An open pen path has no inside to align against. An ABSENT `pathClosed` counts as open,
    // matching samplePathPolyline (`el.pathClosed ?? false`) and the Properties panel's
    // `visibleWhen` — the three must agree or the control offers what the renderer won't do.
    if (el.type === 'path' && !el.pathClosed) return 'center';
    return align;
}

/**
 * A huge rectangle used to invert a clip region. Sized in world units around the element so it
 * always covers the visible canvas at any pan/zoom without relying on the current transform.
 */
function inversionBounds(el: DrawingElement): { x: number; y: number; w: number; h: number } {
    const pad = Math.max(Math.abs(el.width), Math.abs(el.height)) * 4 + el.strokeWidth * 8 + 10000;
    return { x: el.x - pad, y: el.y - pad, w: Math.abs(el.width) + pad * 2, h: Math.abs(el.height) + pad * 2 };
}

/**
 * The element's world-space outline, or null if it can't be resolved — in which case the
 * caller must render centred, exactly as it did before. Resolved up front (not inside the
 * clip call) so the caller can decide on the whole multi-pass render before drawing anything;
 * discovering the failure halfway through `outside` would leave a fill with no stroke.
 */
export function strokeAlignOutline(el: DrawingElement): Path2D | null {
    return buildClipPath2D(el);
}

/**
 * Set up the canvas clip for one alignment pass. Caller must have already called ctx.save()
 * and resolved the outline via `strokeAlignOutline`.
 */
export function applyStrokeAlignClip(ctx: CanvasRenderingContext2D, el: DrawingElement, align: StrokeAlign, outline: Path2D): void {
    if (align === 'inside') {
        ctx.clip(outline, maskFillRule(el));
        return;
    }

    // Outside: clip to (huge rect MINUS outline) using the even-odd rule, so the shape's
    // interior is punched out of the clip region.
    const inverted = new Path2D();
    const b = inversionBounds(el);
    inverted.rect(b.x, b.y, b.w, b.h);
    inverted.addPath(outline);
    ctx.clip(inverted, 'evenodd');
}

/**
 * The element to hand the shape renderer for the STROKE pass: double width, no fill, no text and
 * no shadow/glow. All of those belong to the unclipped fill pass — drawing them here would
 * double their opacity where the passes overlap, and for `inside` the clip would crop the shadow
 * (which falls outside the outline) away entirely.
 *
 * Both alignments use the same two-pass shape for exactly that reason: a single clipped pass is
 * enough to place the stroke, but it silently loses the shadow with it.
 */
export function strokePassElement(el: DrawingElement, _align: StrokeAlign): DrawingElement {
    return {
        ...el,
        strokeWidth: el.strokeWidth * 2,
        // Force centre on the pass elements, or the render would recurse into alignment again.
        strokeAlign: 'center',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        shadowEnabled: false,
        glowEnabled: false,
        containerText: '',
        text: '',
    };
}

/**
 * The element for the unclipped FILL/TEXT/shadow pass: normal geometry, stroke suppressed.
 *
 * `textColor` is pinned first: container text falls back to `strokeColor` when it has no
 * colour of its own (RenderPipeline.renderText), so blanking the stroke would otherwise draw
 * the label in transparent — the shape would silently lose its text.
 */
export function fillPassElement(el: DrawingElement): DrawingElement {
    return {
        ...el,
        textColor: el.textColor || el.strokeColor,
        strokeColor: 'transparent',
        strokeWidth: 0,
        strokeAlign: 'center',
    };
}
