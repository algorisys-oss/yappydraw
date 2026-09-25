import { describe, it, expect } from "bun:test";
import { computeElementHash } from "./rough-cache";
import type { DrawingElement, PathAnchor } from "../types";

/**
 * The rough cache replays an element's stored drawables whenever this hash is unchanged,
 * so a hash that misses a geometry field draws a STALE shape. These tests change one
 * thing the drawing depends on while keeping the box identical — the case the old
 * hand-listed hash got wrong for every path.
 */
const anchors = (): PathAnchor[] => [
    { x: 0, y: 0, kind: 'corner' },
    { x: 50, y: 20, kind: 'smooth', inX: -5, inY: 0, outX: 5, outY: 0 },
    { x: 100, y: 100, kind: 'corner' },
];

const path = (over: Partial<DrawingElement> = {}): DrawingElement => ({
    id: 'p1', type: 'path', x: 10, y: 10, width: 100, height: 100,
    strokeColor: '#000', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 2,
    strokeStyle: 'solid', roughness: 1, opacity: 100, angle: 0, renderStyle: 'sketch', seed: 5,
    roundness: null, locked: false, link: null, layerId: 'l1',
    pathAnchors: anchors(), pathClosed: false,
    ...over,
} as DrawingElement);

describe("computeElementHash — geometry the old hash ignored", () => {
    it("changes when a path anchor moves inside an unchanged box", () => {
        const a = path();
        const moved = anchors(); moved[1] = { ...moved[1], y: 60 };
        expect(computeElementHash(path({ pathAnchors: moved }))).not.toBe(computeElementHash(a));
    });

    it("changes when only a Bézier handle changes", () => {
        const h = anchors(); h[1] = { ...h[1], outX: 30 };
        expect(computeElementHash(path({ pathAnchors: h }))).not.toBe(computeElementHash(path()));
    });

    it("changes with pathClosed and with subpaths", () => {
        expect(computeElementHash(path({ pathClosed: true }))).not.toBe(computeElementHash(path()));
        const sub = path({ pathAnchors: undefined, pathSubpaths: [{ anchors: anchors(), closed: false }] });
        const sub2 = path({ pathAnchors: undefined, pathSubpaths: [{ anchors: anchors(), closed: false }, { anchors: anchors(), closed: true }] });
        expect(computeElementHash(sub)).not.toBe(computeElementHash(sub2));
    });

    it("changes with fields nobody listed (unknown fields count by default)", () => {
        expect(computeElementHash(path({ strokeDashArray: [4, 2] }))).not.toBe(computeElementHash(path()));
        expect(computeElementHash(path({ someFutureField: 3 } as any))).not.toBe(computeElementHash(path()));
    });

    it("changes when a long string (an image data URL) changes", () => {
        const big = 'data:image/png;base64,' + 'A'.repeat(5000);
        const big2 = big.slice(0, -1) + 'B';
        expect(computeElementHash(path({ backgroundImage: big } as any))).not.toBe(computeElementHash(path({ backgroundImage: big2 } as any)));
    });
});

describe("computeElementHash — things that must NOT miss the cache", () => {
    it("is stable for an equal element built separately", () => {
        expect(computeElementHash(path())).toBe(computeElementHash(path()));
    });

    it("ignores selection, name, grouping, layer, opacity and rotation", () => {
        const base = computeElementHash(path());
        for (const over of [
            { isSelected: true }, { name: 'x' }, { groupIds: ['g1'] }, { layerId: 'l2' },
            { opacity: 40 }, { angle: 1.2 }, { locked: true },
        ] as Partial<DrawingElement>[]) {
            expect(computeElementHash(path(over))).toBe(base);
        }
    });

    it("hashes a 10k-anchor path in well under a frame", () => {
        const many: PathAnchor[] = Array.from({ length: 10000 }, (_, i) => ({ x: i, y: i % 7, kind: 'smooth', inX: 1, inY: 1, outX: -1, outY: -1 }));
        const el = path({ pathAnchors: many });
        computeElementHash(el);
        // Best of several runs, not the mean: the question is what the code costs, and a
        // busy machine inflates every run but rarely all of them. (A two-lane walk measured
        // ~25 ms best-case; this one ~4 ms.)
        let best = Infinity;
        for (let i = 0; i < 15; i++) {
            const t = performance.now();
            computeElementHash(el);
            best = Math.min(best, performance.now() - t);
        }
        expect(best).toBeLessThan(10);
    });

    it("a replaced anchor array is re-digested (the memo is per array, not per element)", () => {
        const a = anchors();
        const h1 = computeElementHash(path({ pathAnchors: a }));
        expect(computeElementHash(path({ pathAnchors: a }))).toBe(h1);            // remembered
        const b = anchors(); b[2] = { ...b[2], x: 99 };                            // new array
        expect(computeElementHash(path({ pathAnchors: b }))).not.toBe(h1);
        expect(computeElementHash(path({ pathAnchors: a }))).toBe(h1);            // old still right
    });
});
