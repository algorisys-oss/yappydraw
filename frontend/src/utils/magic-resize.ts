/**
 * Magic Resize — repurpose a design to another page size in one step.
 *
 * v1 heuristics (per page):
 *  - "Background" elements (covering ≥85% of the page) stretch to fill the
 *    new page exactly (non-uniform).
 *  - Everything else scales uniformly by min(sx, sy) — so nothing distorts —
 *    and is repositioned so its normalized center (relative to the old page)
 *    is preserved on the new page. Font sizes scale with the same factor.
 *  - Point-based geometry (freehand, polylines, control points) scales with
 *    the element.
 *
 * Pages themselves are re-laid out left-to-right, matching setPageSize.
 */

import { batch } from 'solid-js';
import { store, setStore, pushToHistory, bumpDirtyRevision, saveActiveSlide, zoomToFitSlide } from '../store/app-store';
import { isPagedDocType } from '../types/slide-types';
import type { DrawingElement } from '../types';

const PAGE_GAP = 80;
const BACKGROUND_COVERAGE = 0.85;

interface Rect { x: number; y: number; width: number; height: number }

const scalePoints = (points: any, s: number): any => {
    if (!Array.isArray(points) || s === 1) return points;
    if (typeof points[0] === 'number') return (points as number[]).map(n => n * s);
    return (points as { x: number; y: number }[]).map(p => ({ ...p, x: p.x * s, y: p.y * s }));
};

/** Map one element from its old page rect onto the new page rect. */
function mapElement(el: DrawingElement, oldPage: Rect, newPage: Rect): Partial<DrawingElement> {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    const relX = (cx - oldPage.x) / oldPage.width;
    const relY = (cy - oldPage.y) / oldPage.height;

    const coverage = (el.width * el.height) / (oldPage.width * oldPage.height);
    if (coverage >= BACKGROUND_COVERAGE) {
        // Background: stretch to fill the new page
        return { x: newPage.x, y: newPage.y, width: newPage.width, height: newPage.height };
    }

    const s = Math.min(newPage.width / oldPage.width, newPage.height / oldPage.height);
    const w = el.width * s;
    const h = el.height * s;
    const patch: Partial<DrawingElement> = {
        x: newPage.x + relX * newPage.width - w / 2,
        y: newPage.y + relY * newPage.height - h / 2,
        width: w,
        height: h,
    };
    if (el.fontSize) patch.fontSize = Math.max(4, el.fontSize * s);
    if (el.points) (patch as any).points = scalePoints(el.points, s);
    if ((el as any).controlPoints) (patch as any).controlPoints = scalePoints((el as any).controlPoints, s);
    return patch;
}

/**
 * Resize every page of a paged document to width × height, rescaling and
 * repositioning the content of each page. Returns false if not applicable.
 */
export function magicResize(width: number, height: number): boolean {
    if (!isPagedDocType(store.docType) || store.slides.length === 0) return false;
    const newW = Math.max(16, Math.round(width));
    const newH = Math.max(16, Math.round(height));

    saveActiveSlide();
    pushToHistory();

    const oldRects: Rect[] = store.slides.map(s => ({
        x: s.spatialPosition.x, y: s.spatialPosition.y,
        width: s.dimensions.width, height: s.dimensions.height,
    }));

    // New page layout: left-to-right, same y, fixed gap (matches setPageSize)
    const newRects: Rect[] = [];
    let x = 0;
    for (const r of oldRects) {
        newRects.push({ x, y: r.y, width: newW, height: newH });
        x += newW + PAGE_GAP;
    }

    // Assign each element to the page containing its center (same rule the
    // page exporter uses); elements outside every page keep index of nearest.
    const pageIndexFor = (el: DrawingElement): number => {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        let idx = oldRects.findIndex(r => cx >= r.x && cx <= r.x + r.width && cy >= r.y && cy <= r.y + r.height);
        if (idx === -1) {
            let best = Infinity;
            oldRects.forEach((r, i) => {
                const d = Math.hypot(cx - (r.x + r.width / 2), cy - (r.y + r.height / 2));
                if (d < best) { best = d; idx = i; }
            });
        }
        return Math.max(0, idx);
    };

    const mapped = store.elements.map(el => {
        const i = pageIndexFor(el);
        return { ...el, ...mapElement(el, oldRects[i], newRects[i]) } as DrawingElement;
    });

    const newSlides = store.slides.map((s, i) => ({
        ...s,
        dimensions: { width: newW, height: newH },
        spatialPosition: { x: newRects[i].x, y: newRects[i].y },
        lastViewState: undefined,
        thumbnail: undefined, // stale after resize; recaptured by the thumbnail effect
    }));

    batch(() => {
        setStore('slides', newSlides);
        setStore('elements', mapped);
        const active = newSlides[store.activeSlideIndex];
        if (active) setStore('dimensions', { ...active.dimensions });
    });
    zoomToFitSlide();
    bumpDirtyRevision();
    return true;
}
