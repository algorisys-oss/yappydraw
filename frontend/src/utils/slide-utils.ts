import type { DrawingElement } from '../types';
import type { Slide } from '../types/slide-types';

/**
 * Utility to find elements belonging to a specific slide based on spatial center-point logic.
 */
export const getElementsOnSlide = (
    slideIndex: number,
    elements: DrawingElement[],
    slides: Slide[]
): DrawingElement[] => {
    const slide = slides[slideIndex];
    if (!slide) return [];

    const { x: sX, y: sY } = slide.spatialPosition;
    const { width: sW, height: sH } = slide.dimensions;

    return elements.filter(el => {
        const cx = el.x + (el.width || 0) / 2;
        const cy = el.y + (el.height || 0) / 2;
        return cx >= sX && cx <= sX + sW && cy >= sY && cy <= sY + sH;
    });
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
