import { describe, it, expect } from "bun:test";
import { getShapeGeometry } from "./shape-geometry";
import type { DrawingElement, PathAnchor } from "../types";

/**
 * A path's `d` string is rebuilt from its anchors, and for a big path that used to cost more
 * than the drawing itself, every frame. It's now remembered per anchor ARRAY, which is safe
 * because the store replaces geometry arrays on every edit rather than mutating them. These
 * pin both halves: unchanged data reuses the string, replaced data rebuilds it.
 */
const anchors = (y = 20): PathAnchor[] => [
    { x: 0, y: 0, kind: 'corner' }, { x: 50, y, kind: 'corner' }, { x: 100, y: 100, kind: 'corner' },
];
const el = (over: Partial<DrawingElement> = {}): DrawingElement => ({
    id: 'p', type: 'path', x: 0, y: 0, width: 100, height: 100, pathAnchors: anchors(), pathClosed: false, ...over,
} as DrawingElement);

describe("path geometry memo", () => {
    it("reuses the result for the same anchor array (cost, since strings compare by value)", () => {
        const big: PathAnchor[] = Array.from({ length: 20000 }, (_, i) => ({ x: i % 500, y: i % 700, kind: 'smooth', inX: 1, inY: 2, outX: -1, outY: -2 }));
        const e = el({ pathAnchors: big, width: 500, height: 700 });
        let t = performance.now();
        const first = (getShapeGeometry(e) as any).path;
        const build = performance.now() - t;
        let reuse = Infinity;
        for (let i = 0; i < 10; i++) {
            t = performance.now();
            expect((getShapeGeometry({ ...e } as DrawingElement) as any).path).toBe(first);
            reuse = Math.min(reuse, performance.now() - t);
        }
        // Building serialises 20k anchors; reusing is a WeakMap lookup.
        expect(reuse).toBeLessThan(build / 20);
    });

    it("rebuilds for a replaced array, a different box, or a closed flag", () => {
        const a = anchors();
        const base = (getShapeGeometry(el({ pathAnchors: a })) as any).path;
        expect((getShapeGeometry(el({ pathAnchors: anchors(60) })) as any).path).not.toBe(base);
        expect((getShapeGeometry(el({ pathAnchors: a, width: 120 })) as any).path).not.toBe(base);
        expect((getShapeGeometry(el({ pathAnchors: a, pathClosed: true })) as any).path).not.toBe(base);
    });

    it("subpaths are remembered the same way", () => {
        const subs = [{ anchors: anchors(), closed: true }, { anchors: anchors(70), closed: false }];
        const e = el({ pathAnchors: undefined, pathSubpaths: subs });
        expect((getShapeGeometry(e) as any).path).toBe((getShapeGeometry({ ...e } as DrawingElement) as any).path);
        const moved = [{ anchors: anchors(), closed: true }, { anchors: anchors(80), closed: false }];
        expect((getShapeGeometry(el({ pathAnchors: undefined, pathSubpaths: moved })) as any).path)
            .not.toBe((getShapeGeometry(e) as any).path);
    });
});
