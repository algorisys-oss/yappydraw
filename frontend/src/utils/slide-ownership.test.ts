/**
 * Which page owns an element.
 *
 * Reported as "elements added in the design show up on both pages, and deleting one
 * from a page deletes it completely". Pages are frames on one shared canvas, not
 * separate documents, so there only ever was one element — it was being *drawn* on
 * both, because visibility used a plain box-overlap against the active page while
 * ownership used the centre point. Those two answers disagreed for anything hanging
 * over a page edge, and for anything straddling the gutter between pages they were
 * both wrong: the centre lands in the gap, inside no page at all.
 */

import { describe, it, expect } from "bun:test";
import { ownerSlideIndex, getElementsOnSlide } from "./slide-utils";
import type { Slide } from "../types/slide-types";
import type { DrawingElement } from "../types";

/** Two 1920x1080 pages side by side with the usual 80px gutter. */
const pages = (): Slide[] => [
    { id: "s1", name: "Page 1", order: 0, spatialPosition: { x: 0, y: 0 }, dimensions: { width: 1920, height: 1080 } },
    { id: "s2", name: "Page 2", order: 1, spatialPosition: { x: 2000, y: 0 }, dimensions: { width: 1920, height: 1080 } },
];

const box = (x: number, y: number, width: number, height: number): DrawingElement =>
    ({ id: `e-${x}-${y}`, type: "rectangle", x, y, width, height }) as DrawingElement;

describe("ownerSlideIndex", () => {
    const slides = pages();

    it("gives an element wholly inside a page to that page", () => {
        expect(ownerSlideIndex(box(200, 200, 400, 300), slides)).toBe(0);
        expect(ownerSlideIndex(box(2200, 200, 400, 300), slides)).toBe(1);
    });

    it("gives an overhanging element to one page only — the one it sits on most", () => {
        // The reported case: 1600..2300 reaches into page 2's rect (2000..3920). Under the
        // old overlap rule it drew on BOTH pages, which is what made one shape look like
        // two and made deleting it from either look like a bug.
        const straddler = box(1600, 300, 700, 400);
        expect(ownerSlideIndex(straddler, slides)).toBe(0);
    });

    it("still places an element whose centre falls in the gutter", () => {
        // Centre at x=1960, between page 1 (ends 1920) and page 2 (starts 2000). The bare
        // centre test returned it for NEITHER page, so animation builds and PDF/PPTX export
        // silently dropped it while the canvas drew it.
        const inGutter = box(1860, 300, 200, 400);
        expect(ownerSlideIndex(inGutter, slides)).toBeGreaterThanOrEqual(0);
        expect(getElementsOnSlide(0, [inGutter], slides).length
            + getElementsOnSlide(1, [inGutter], slides).length).toBe(1);
    });

    it("leaves artwork parked beside the pages unowned", () => {
        // Scratch space next to the document must not be adopted by the nearest page —
        // that would pull it into every export.
        expect(ownerSlideIndex(box(-3000, 200, 400, 300), slides)).toBe(-1);
        expect(ownerSlideIndex(box(200, 4000, 400, 300), slides)).toBe(-1);
    });

    it("never gives one element to two pages", () => {
        const candidates = [
            box(200, 200, 400, 300),
            box(1600, 300, 700, 400),
            box(1860, 300, 200, 400),
            box(1000, 100, 2500, 200),   // wide enough to cover both pages
            box(2200, 200, 400, 300),
        ];
        for (const el of candidates) {
            const owners = slides.map((_, i) => getElementsOnSlide(i, [el], slides).length);
            expect(owners.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(1);
        }
    });

    it("splits a set of elements across the pages without losing any of them", () => {
        const els = [box(100, 100, 300, 200), box(2100, 100, 300, 200), box(1860, 300, 200, 400)];
        const p0 = getElementsOnSlide(0, els, slides);
        const p1 = getElementsOnSlide(1, els, slides);
        expect(p0.length + p1.length).toBe(els.length);
        expect(new Set([...p0, ...p1].map(e => e.id)).size).toBe(els.length);
    });

    it("returns nothing for a page index that does not exist", () => {
        expect(getElementsOnSlide(5, [box(200, 200, 400, 300)], slides)).toEqual([]);
    });
});
