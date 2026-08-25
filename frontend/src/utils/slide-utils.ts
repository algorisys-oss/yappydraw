import type { DrawingElement } from '../types';
import type { Slide } from '../types/slide-types';

/**
 * Which page owns this element — the single answer every other part of the app should
 * be asking, so that rendering, export, animation builds and the page thumbnails all
 * agree about where a thing lives.
 *
 * Pages are frames on one shared canvas, not separate documents, so ownership is
 * positional:
 *
 * 1. The element's CENTRE is inside a page — that page owns it. The common case.
 * 2. Otherwise the page its box overlaps MOST owns it. Pages sit ~80px apart, and an
 *    element straddling that gutter has its centre in the gap, inside no page at all;
 *    the centre test alone returned it for *neither* page, so animation builds skipped
 *    it while the canvas happily drew it.
 * 3. Otherwise nobody — artwork parked off to the side of the pages belongs to no page
 *    and is not drawn on one. Deliberately not "nearest page": scratch artwork kept
 *    beside the document must not get adopted by whichever page happens to be closest.
 *
 * Returns the slide INDEX, or -1.
 */
export const ownerSlideIndex = (
    el: { x: number; y: number; width?: number; height?: number },
    slides: Slide[]
): number => {
    const w = el.width || 0, h = el.height || 0;
    const ex1 = Math.min(el.x, el.x + w), ex2 = Math.max(el.x, el.x + w);
    const ey1 = Math.min(el.y, el.y + h), ey2 = Math.max(el.y, el.y + h);
    const cx = (ex1 + ex2) / 2, cy = (ey1 + ey2) / 2;

    let bestOverlap = 0;
    let bestIndex = -1;

    for (let i = 0; i < slides.length; i++) {
        const { x: sX, y: sY } = slides[i].spatialPosition;
        const { width: sW, height: sH } = slides[i].dimensions;
        if (cx >= sX && cx <= sX + sW && cy >= sY && cy <= sY + sH) return i;

        const ox = Math.min(ex2, sX + sW) - Math.max(ex1, sX);
        const oy = Math.min(ey2, sY + sH) - Math.max(ey1, sY);
        if (ox <= 0 || oy <= 0) continue;
        const area = ox * oy;
        if (area > bestOverlap) { bestOverlap = area; bestIndex = i; }
    }

    return bestIndex;
};

/**
 * Utility to find elements belonging to a specific slide.
 */
export const getElementsOnSlide = (
    slideIndex: number,
    elements: DrawingElement[],
    slides: Slide[]
): DrawingElement[] => {
    if (!slides[slideIndex]) return [];
    return elements.filter(el => ownerSlideIndex(el, slides) === slideIndex);
};

/**
 * Project a master layer element's position to the active slide.
 *
 * Master elements are stored in world coordinates (wherever they were drawn).
 * To render them on every slide, we determine which slide they were originally
 * placed on (by their center point), compute their local offset within that
 * slide, then re-project to the target slide's coordinate space.
 */
export const projectMasterPosition = (
    el: { x: number; y: number; width: number; height: number },
    targetSlide: Slide,
    slides: Slide[]
): { x: number; y: number } => {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;

    // Find which slide the element was originally placed on
    let originX = 0, originY = 0;
    for (const slide of slides) {
        const { x: sx, y: sy } = slide.spatialPosition;
        const { width: sw, height: sh } = slide.dimensions;
        if (cx >= sx && cx <= sx + sw && cy >= sy && cy <= sy + sh) {
            originX = sx;
            originY = sy;
            break;
        }
    }

    // Element's local position within its origin slide → project to target slide
    return {
        x: el.x - originX + targetSlide.spatialPosition.x,
        y: el.y - originY + targetSlide.spatialPosition.y
    };
};
