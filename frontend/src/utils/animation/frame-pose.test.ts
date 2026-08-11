import { describe, it, expect } from "bun:test";
import { poseElementsAtFrame } from "./frame-timeline-evaluator";
import { getHandleAtPosition } from "../handle-detection";
import type { AnimTimeline } from "../../types/anim-types";
import type { DrawingElement } from "../../types";

/**
 * Regression guard for the "shape is selected but the handles don't respond"
 * report: on any frame INSIDE a motion-tween span the canvas draws the shape and
 * its handles from the tweened pose (canvas-renderer merges the override map
 * into `renderedEl`), while `getHandleAtPosition` was hit-testing the raw store
 * pose. Handles looked right and grabbed nothing.
 */

const rect = (id: string, extra: Partial<DrawingElement> = {}): DrawingElement => ({
    id, type: 'rectangle', x: 0, y: 0, width: 100, height: 100, angle: 0, opacity: 100,
    contentId: id, layerId: 'L', ...extra,
} as DrawingElement);

// One row, motion tween from frame 0 → 10. The cel at 0 is a 100×100 box at the
// origin; the cel at 10 is a 300×300 box at (200,200). Frame 5 is the midpoint.
const from = rect('a', { x: 0, y: 0, width: 100, height: 100, contentId: 'box' });
const to = rect('b', { x: 200, y: 200, width: 300, height: 300, contentId: 'box' });
const elements = [from, to];

const timeline: AnimTimeline = {
    fps: 24,
    frameCount: 24,
    layers: [{
        layerId: 'L',
        keyframes: [
            { frame: 0, elementIds: ['a'], tween: 'motion' },
            { frame: 10, elementIds: ['b'] },
        ],
        endFrame: 15,
    }],
};

describe("poseElementsAtFrame", () => {
    it("bakes the tweened pose into the element the renderer draws", () => {
        const posed = poseElementsAtFrame(5, timeline, elements);
        const a = posed.find(e => e.id === 'a')!;
        // Midpoint of the span: x/y 0→200, w/h 100→300.
        expect(a.x).toBe(100);
        expect(a.y).toBe(100);
        expect(a.width).toBe(200);
        expect(a.height).toBe(200);
    });

    it("leaves elements untouched on a keyframe (nothing to interpolate)", () => {
        const posed = poseElementsAtFrame(0, timeline, elements);
        expect(posed.find(e => e.id === 'a')!.width).toBe(100);
    });

    it("returns the input array itself when there is no timeline", () => {
        expect(poseElementsAtFrame(5, null, elements)).toBe(elements);
    });

    it("returns the input array itself when no element is overridden", () => {
        const still: AnimTimeline = {
            ...timeline,
            layers: [{ layerId: 'L', keyframes: [{ frame: 0, elementIds: ['a'] }], endFrame: 15 }],
        };
        expect(poseElementsAtFrame(5, still, elements)).toBe(elements);
    });
});

describe("handle hit-testing inside a tween span", () => {
    const scale = 1;
    const selection = ['a'];

    // At frame 5 the box is DRAWN at (100,100) 200×200, so the 'br' handle the
    // user sees sits at its bottom-right corner.
    const drawnBr = { x: 100 + 200, y: 100 + 200 };

    it("finds the bottom-right handle where the tweened box is DRAWN", () => {
        const posed = poseElementsAtFrame(5, timeline, elements);
        expect(getHandleAtPosition(drawnBr.x, drawnBr.y, posed, selection, scale))
            .toEqual({ id: 'a', handle: 'br' });
    });

    it("the raw store pose grabs nothing there — this was the bug", () => {
        // Un-posed, the frame-0 cel is still 100×100 at the origin, so the drawn
        // handle's position hit-tests to nothing at all.
        expect(getHandleAtPosition(drawnBr.x, drawnBr.y, elements, selection, scale)).toBeNull();
    });

    it("posing is a no-op when the playhead is on a keyframe", () => {
        const posed = poseElementsAtFrame(0, timeline, elements);
        expect(getHandleAtPosition(100, 100, posed, selection, scale))
            .toEqual(getHandleAtPosition(100, 100, elements, selection, scale));
    });
});
