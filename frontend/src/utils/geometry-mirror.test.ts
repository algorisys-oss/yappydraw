import { describe, it, expect } from "bun:test";
import {
    mirrorPoints, mirrorPathAnchors, mirrorPathSubpaths, mirrorGeometry,
    type MirrorableElement,
} from "./geometry-mirror";
import type { PathAnchor } from "../types";

/** A path element: 100×50 box at (200, 100), one curved anchor pair. */
const makePath = (over: Partial<MirrorableElement> = {}): MirrorableElement => ({
    x: 200, y: 100, width: 100, height: 50,
    pathAnchors: [
        { x: 0, y: 0, kind: 'corner', outX: 10, outY: 5 },
        { x: 100, y: 50, kind: 'smooth', inX: -20, inY: -8, outX: 20, outY: 8 },
    ] as PathAnchor[],
    ...over,
});

/** World position of an anchor (and of a handle tip) for the round-trip checks. */
const worldAnchor = (el: { x: number; y: number }, a: PathAnchor) => ({ x: el.x + a.x, y: el.y + a.y });
const worldOut = (el: { x: number; y: number }, a: PathAnchor) =>
    ({ x: el.x + a.x + (a.outX ?? 0), y: el.y + a.y + (a.outY ?? 0) });

describe("mirrorPathAnchors", () => {
    it("mirrors x within the box and negates only the x handle deltas", () => {
        const out = mirrorPathAnchors(makePath().pathAnchors, 'horizontal', 100, 50)!;
        expect(out[0]).toEqual({ x: 100, y: 0, kind: 'corner', outX: -10, outY: 5 });
        expect(out[1]).toEqual({ x: 0, y: 50, kind: 'smooth', inX: 20, inY: -8, outX: -20, outY: 8 });
    });

    it("mirrors y within the box and negates only the y handle deltas", () => {
        const out = mirrorPathAnchors(makePath().pathAnchors, 'vertical', 100, 50)!;
        expect(out[0]).toEqual({ x: 0, y: 50, kind: 'corner', outX: 10, outY: -5 });
        expect(out[1]).toEqual({ x: 100, y: 0, kind: 'smooth', inX: -20, inY: 8, outX: 20, outY: -8 });
    });

    it("leaves a missing handle missing — a corner must not become a half-curve", () => {
        const out = mirrorPathAnchors([{ x: 10, y: 10, kind: 'corner' }] as PathAnchor[], 'horizontal', 100, 50)!;
        expect(out[0]).toEqual({ x: 90, y: 10, kind: 'corner' });
        expect('inX' in out[0]).toBe(false);
        expect('outX' in out[0]).toBe(false);
    });

    it("keeps the anchor order (in/out are not swapped), so winding reverses but roles don't", () => {
        const anchors = makePath().pathAnchors as PathAnchor[];
        const out = mirrorPathAnchors(anchors, 'horizontal', 100, 50)!;
        expect(out.map((a: PathAnchor) => a.kind)).toEqual(['corner', 'smooth']);
        expect(out[1].inX).toBe(20);   // still the incoming handle of the second anchor
        expect(out[1].outX).toBe(-20);
    });

    it("is its own inverse", () => {
        const anchors = makePath().pathAnchors as PathAnchor[];
        const twice = mirrorPathAnchors(mirrorPathAnchors(anchors, 'horizontal', 100, 50), 'horizontal', 100, 50);
        expect(twice).toEqual(anchors as any[]);
    });
});

describe("mirrorPathSubpaths", () => {
    it("mirrors every subpath and preserves the closed flag", () => {
        const subs = [
            { closed: true, anchors: [{ x: 0, y: 0, kind: 'corner' }, { x: 40, y: 10, kind: 'corner' }] },
            { closed: false, anchors: [{ x: 60, y: 20, kind: 'corner' }] },
        ];
        const out = mirrorPathSubpaths(subs, 'horizontal', 100, 50)!;
        expect(out[0].closed).toBe(true);
        expect(out[0].anchors.map((a: PathAnchor) => a.x)).toEqual([100, 60]);
        expect(out[1].closed).toBe(false);
        expect(out[1].anchors[0].x).toBe(40);
    });
});

describe("mirrorPoints", () => {
    it("keeps flat encoding flat", () => {
        const out = mirrorPoints([0, 0, 30, 10], 'horizontal', 100, 50);
        expect(out).toEqual([100, 0, 70, 10]);
    });

    it("keeps object encoding and per-point pressure", () => {
        const out = mirrorPoints([{ x: 30, y: 10, p: 0.4 }], 'horizontal', 100, 50);
        expect(out).toEqual([{ x: 70, y: 10, p: 0.4 }]);
    });

    it("mirrors y for a vertical flip", () => {
        expect(mirrorPoints([0, 0, 30, 10], 'vertical', 100, 50)).toEqual([0, 50, 30, 40]);
    });
});

describe("mirrorGeometry — paths", () => {
    it("bakes the mirror into the anchors instead of setting flipX", () => {
        const el = makePath();
        const u = mirrorGeometry(el, 'horizontal', el.x + el.width / 2);
        expect(u.pathAnchors[0].x).toBe(100);
        expect(u.flipX).toBeUndefined();   // the flag must stay out of it — overlays don't read it
    });

    it("flips in place: reflecting about the element's own centre doesn't move the box", () => {
        const el = makePath();
        expect(mirrorGeometry(el, 'horizontal', el.x + el.width / 2).x).toBe(200);
        expect(mirrorGeometry(el, 'vertical', el.y + el.height / 2).y).toBe(100);
    });

    it("puts every anchor at the reflection of its old world position", () => {
        const el = makePath();
        const axis = 400;                       // a shared axis, e.g. a multi-selection centre
        const u = mirrorGeometry(el, 'horizontal', axis);
        const moved = { x: u.x, y: el.y };
        (el.pathAnchors as PathAnchor[]).forEach((a, i) => {
            const before = worldAnchor(el, a);
            const after = worldAnchor(moved, u.pathAnchors[i]);
            expect(after.x).toBeCloseTo(2 * axis - before.x, 9);
            expect(after.y).toBeCloseTo(before.y, 9);
        });
    });

    it("reflects the Bézier handle tips too, so the curve mirrors with the anchors", () => {
        const el = makePath();
        const axis = el.x + el.width / 2;
        const u = mirrorGeometry(el, 'horizontal', axis);
        const moved = { x: u.x, y: el.y };
        (el.pathAnchors as PathAnchor[]).forEach((a, i) => {
            if (a.outX === undefined) return;
            const before = worldOut(el, a);
            const after = worldOut(moved, u.pathAnchors[i]);
            expect(after.x).toBeCloseTo(2 * axis - before.x, 9);
            expect(after.y).toBeCloseTo(before.y, 9);
        });
    });

    it("mirrors pathSubpaths as well as legacy pathAnchors", () => {
        const el: MirrorableElement = {
            x: 0, y: 0, width: 100, height: 50,
            pathSubpaths: [{ closed: true, anchors: [{ x: 10, y: 0, kind: 'corner' }] }],
        };
        const u = mirrorGeometry(el, 'horizontal', 50);
        expect(u.pathSubpaths[0].anchors[0].x).toBe(90);
    });

    it("applied twice, returns the original geometry", () => {
        const el = makePath();
        const once = { ...el, ...mirrorGeometry(el, 'horizontal', 400) } as MirrorableElement;
        const twice = { ...once, ...mirrorGeometry(once, 'horizontal', 400) };
        expect(twice.x).toBe(el.x);
        expect(twice.pathAnchors).toEqual(el.pathAnchors as any[]);
    });
});

describe("mirrorGeometry — folding a legacy flipX flag", () => {
    it("clears the flag and leaves the anchors, which is the same visual mirror", () => {
        const el = makePath({ flipX: true });
        const u = mirrorGeometry(el, 'horizontal', el.x + el.width / 2);
        expect(u.flipX).toBe(false);
        expect(u.pathAnchors).toBeUndefined();  // already-mirrored data is left alone
    });

    it("heals a legacy path: after one flip the anchors match what is rendered", () => {
        // Rendered geometry = flipX ? mirror(stored) : stored. Flipping must produce the
        // mirror of what is on screen — and afterwards no flag may be left over, or the
        // anchor overlay goes on disagreeing with the shape.
        const legacy = makePath({ flipX: true });
        const u = mirrorGeometry(legacy, 'horizontal', legacy.x + legacy.width / 2);
        const after = { ...legacy, ...u } as MirrorableElement;
        const renderedBefore = mirrorPathAnchors(legacy.pathAnchors, 'horizontal', 100, 50)!;
        const renderedAfter = after.flipX
            ? mirrorPathAnchors(after.pathAnchors, 'horizontal', 100, 50)!
            : after.pathAnchors!;
        expect(after.flipX).toBe(false);
        expect(renderedAfter).toEqual(mirrorPathAnchors(renderedBefore, 'horizontal', 100, 50)!);
        expect(renderedAfter).toEqual(after.pathAnchors as any[]);  // stored === rendered
    });

    it("the vertical flip folds flipY, not flipX", () => {
        const el = makePath({ flipY: true });
        const u = mirrorGeometry(el, 'vertical', el.y + el.height / 2);
        expect(u.flipY).toBe(false);
        expect(u.flipX).toBeUndefined();
    });

    it("a flipX'd path flipped VERTICALLY still mirrors its anchors", () => {
        const el = makePath({ flipX: true });
        const u = mirrorGeometry(el, 'vertical', el.y + el.height / 2);
        expect(u.pathAnchors[0].y).toBe(50);
        expect(u.flipX).toBeUndefined();   // the untouched axis keeps its flag
    });
});

describe("mirrorGeometry — shapes without stored geometry", () => {
    it("toggles the render flag, which is all a rect/ellipse/image has", () => {
        const rect: MirrorableElement = { x: 0, y: 0, width: 100, height: 50 };
        expect(mirrorGeometry(rect, 'horizontal', 50).flipX).toBe(true);
        expect(mirrorGeometry({ ...rect, flipX: true }, 'horizontal', 50).flipX).toBe(false);
        expect(mirrorGeometry(rect, 'vertical', 25).flipY).toBe(true);
    });

    it("repositions across a shared axis", () => {
        const rect: MirrorableElement = { x: 0, y: 0, width: 100, height: 50 };
        expect(mirrorGeometry(rect, 'horizontal', 200).x).toBe(300);
        expect(mirrorGeometry(rect, 'vertical', 200).y).toBe(350);
    });

    it("treats an empty points array as no geometry", () => {
        const el: MirrorableElement = { x: 0, y: 0, width: 100, height: 50, points: [] };
        expect(mirrorGeometry(el, 'horizontal', 50).flipX).toBe(true);
    });
});

describe("mirrorGeometry — world-space control points", () => {
    it("reflects bezier control points about the world axis", () => {
        const el: MirrorableElement = {
            x: 0, y: 0, width: 100, height: 50,
            points: [0, 0, 100, 50],
            controlPoints: [{ x: 25, y: 5 }, { x: 75, y: 45 }],
        };
        const u = mirrorGeometry(el, 'horizontal', 50);
        expect(u.controlPoints).toEqual([{ x: 75, y: 5 }, { x: 25, y: 45 }]);
    });

    it("keeps control points on the curve when the element also moves", () => {
        const el: MirrorableElement = {
            x: 0, y: 0, width: 100, height: 50,
            points: [0, 0, 100, 50],
            controlPoints: [{ x: 25, y: 5 }],
        };
        const axis = 500;
        const u = mirrorGeometry(el, 'horizontal', axis);
        // Endpoint and control point must reflect about the SAME line, or the curve tears.
        const endBefore = el.x + 0, endAfter = u.x + u.points[0];
        expect(endAfter).toBeCloseTo(2 * axis - endBefore, 9);
        expect(u.controlPoints[0].x).toBeCloseTo(2 * axis - 25, 9);
    });

    it("reflects control points on a vertical flip", () => {
        const el: MirrorableElement = {
            x: 0, y: 0, width: 100, height: 50,
            points: [0, 0, 100, 50],
            controlPoints: [{ x: 25, y: 5 }],
        };
        expect(mirrorGeometry(el, 'vertical', 25).controlPoints).toEqual([{ x: 25, y: 45 }]);
    });
});
