import { describe, it, expect } from "bun:test";
import {
    opInsertFrame, opInsertKeyframe, opInsertBlankKeyframe, opClearKeyframe,
    opRemoveFrames, opMoveKeyframe, opUpdateKeyframe, opReconcile,
} from "./frame-timeline-ops";
import type { AnimTimeline, AnimLayer } from "../../types/anim-types";

const el = (id: string, layerId = "L", extra: any = {}): any => ({
    id, type: 'rectangle', layerId, x: 0, y: 0, width: 100, height: 100, points: [1, 2], ...extra,
});

const layer = (layerId: string, keyframes: AnimLayer['keyframes'], endFrame: number): AnimLayer =>
    ({ layerId, keyframes, endFrame });

const tl = (layers: AnimLayer[], frameCount = 24): AnimTimeline => ({ fps: 24, frameCount, layers });

let n = 0;
const genId = (type: string) => `${type}-${++n}`;

describe("opInsertFrame (F5)", () => {
    const base = tl([layer("L", [
        { frame: 0, elementIds: ["a"] },
        { frame: 5, elementIds: ["b"] },
    ], 9)]);

    it("shifts later keyframes right and grows the row", () => {
        const next = opInsertFrame(base, "L", 2)!;
        expect(next.layers[0].keyframes.map(k => k.frame)).toEqual([0, 6]);
        expect(next.layers[0].endFrame).toBe(10);
    });

    it("inserting inside a later span leaves earlier keyframes alone", () => {
        const next = opInsertFrame(base, "L", 7)!;
        expect(next.layers[0].keyframes.map(k => k.frame)).toEqual([0, 5]);
        expect(next.layers[0].endFrame).toBe(10);
    });

    it("beyond the row's end just extends the row (and the ruler when needed)", () => {
        const next = opInsertFrame(base, "L", 30)!;
        expect(next.layers[0].keyframes.map(k => k.frame)).toEqual([0, 5]);
        expect(next.layers[0].endFrame).toBe(30);
        expect(next.frameCount).toBe(31);
    });

    it("returns null for an unknown layer", () => {
        expect(opInsertFrame(base, "nope", 2)).toBeNull();
    });

    it("does not mutate the input timeline", () => {
        opInsertFrame(base, "L", 2);
        expect(base.layers[0].keyframes.map(k => k.frame)).toEqual([0, 5]);
        expect(base.layers[0].endFrame).toBe(9);
    });
});

describe("opInsertKeyframe (F6)", () => {
    const elements = [el("a", "L", { contentId: undefined }), el("z", "L")];
    const base = tl([layer("L", [
        { frame: 0, elementIds: ["a"], tween: 'motion', easing: 'linear' },
        { frame: 10, elementIds: ["z"] },
    ], 10)]);

    it("duplicates the previous cel with fresh ids and a shared contentId", () => {
        const res = opInsertKeyframe(base, "L", 5, elements, genId)!;
        expect(res.copies.length).toBe(1);
        const copy = res.copies[0];
        expect(copy.id).not.toBe("a");
        expect(copy.contentId).toBe("a");            // source id becomes the shared contentId
        expect(res.sourcePatch.get("a")).toBe("a");  // source gets it backfilled
        expect(copy.points).toEqual([1, 2]);
        expect((copy as any).points).not.toBe((elements[0] as any).points); // deep copy
        const kfs = res.timeline.layers[0].keyframes;
        expect(kfs.map(k => k.frame)).toEqual([0, 5, 10]);
        expect(kfs[1].elementIds).toEqual([copy.id]);
    });

    it("keeps both halves of a split tween span tweening", () => {
        const res = opInsertKeyframe(base, "L", 5, elements, genId)!;
        expect(res.timeline.layers[0].keyframes[1].tween).toBe('motion');
        expect(res.timeline.layers[0].keyframes[1].easing).toBe('linear');
    });

    it("no-ops onto an existing keyframe", () => {
        expect(opInsertKeyframe(base, "L", 10, elements, genId)).toBeNull();
    });

    it("creates a blank cel before the first keyframe", () => {
        const late = tl([layer("L", [{ frame: 5, elementIds: ["a"] }], 10)]);
        const res = opInsertKeyframe(late, "L", 2, elements, genId)!;
        expect(res.copies.length).toBe(0);
        expect(res.timeline.layers[0].keyframes.map(k => k.frame)).toEqual([2, 5]);
    });

    it("beyond the row's end extends endFrame", () => {
        const res = opInsertKeyframe(base, "L", 20, elements, genId)!;
        expect(res.timeline.layers[0].endFrame).toBe(20);
        expect(res.timeline.layers[0].keyframes.map(k => k.frame)).toEqual([0, 10, 20]);
        expect(res.copies[0].contentId).toBe("z");
    });
});

describe("opInsertBlankKeyframe (F7)", () => {
    it("adds an empty cel", () => {
        const base = tl([layer("L", [{ frame: 0, elementIds: ["a"] }], 9)]);
        const next = opInsertBlankKeyframe(base, "L", 4)!;
        expect(next.layers[0].keyframes.map(k => k.frame)).toEqual([0, 4]);
        expect(next.layers[0].keyframes[1].elementIds).toEqual([]);
    });
});

describe("opClearKeyframe (Shift+F6)", () => {
    const base = tl([layer("L", [
        { frame: 0, elementIds: ["a"] },
        { frame: 5, elementIds: ["b"] },
    ], 9)]);

    it("removes a non-first keyframe and dooms its exclusive content", () => {
        const res = opClearKeyframe(base, "L", 5)!;
        expect(res.timeline.layers[0].keyframes.map(k => k.frame)).toEqual([0]);
        expect(res.doomedIds).toEqual(["b"]);
    });

    it("blanks the first keyframe instead of removing it", () => {
        const res = opClearKeyframe(base, "L", 0)!;
        expect(res.timeline.layers[0].keyframes.map(k => k.frame)).toEqual([0, 5]);
        expect(res.timeline.layers[0].keyframes[0].elementIds).toEqual([]);
        expect(res.doomedIds).toEqual(["a"]);
    });

    it("keeps elements still referenced by another keyframe", () => {
        const shared = tl([layer("L", [
            { frame: 0, elementIds: ["a"] },
            { frame: 5, elementIds: ["a"] },
        ], 9)]);
        const res = opClearKeyframe(shared, "L", 5)!;
        expect(res.doomedIds).toEqual([]);
    });
});

describe("opRemoveFrames (Shift+F5)", () => {
    const base = tl([layer("L", [
        { frame: 0, elementIds: ["a"] },
        { frame: 5, elementIds: ["b"] },
    ], 9)]);

    it("shortens a multi-frame span and shifts later keyframes left", () => {
        const res = opRemoveFrames(base, "L", 2)!;
        expect(res.timeline.layers[0].keyframes.map(k => k.frame)).toEqual([0, 4]);
        expect(res.timeline.layers[0].endFrame).toBe(8);
        expect(res.doomedIds).toEqual([]);
    });

    it("removes a single-frame keyframe cell entirely", () => {
        const single = tl([layer("L", [
            { frame: 0, elementIds: ["a"] },
            { frame: 5, elementIds: ["b"] },
            { frame: 6, elementIds: ["c"] },
        ], 9)]);
        const res = opRemoveFrames(single, "L", 5)!;
        expect(res.timeline.layers[0].keyframes.map(k => k.frame)).toEqual([0, 5]);
        expect(res.timeline.layers[0].keyframes[1].elementIds).toEqual(["c"]);
        expect(res.doomedIds).toEqual(["b"]);
    });

    it("shortening a 2-frame span keeps the keyframe and its content", () => {
        const one = tl([layer("L", [{ frame: 0, elementIds: ["a"] }], 1)]);
        const res = opRemoveFrames(one, "L", 0)!;
        expect(res.timeline.layers[0].keyframes).toEqual([{ frame: 0, elementIds: ["a"] }]);
        expect(res.timeline.layers[0].endFrame).toBe(0);
        expect(res.doomedIds).toEqual([]);
    });

    it("never leaves a row without a keyframe", () => {
        const lateOnly = tl([layer("L", [{ frame: 5, elementIds: ["a"] }], 5)]);
        const res = opRemoveFrames(lateOnly, "L", 5)!;
        expect(res.timeline.layers[0].keyframes).toEqual([{ frame: 0, elementIds: [] }]);
        expect(res.doomedIds).toEqual(["a"]);
    });

    it("refuses to shrink a 1-frame row", () => {
        const one = tl([layer("L", [{ frame: 0, elementIds: ["a"] }], 0)]);
        expect(opRemoveFrames(one, "L", 0)).toBeNull();
    });
});

describe("opMoveKeyframe", () => {
    const base = tl([layer("L", [
        { frame: 0, elementIds: ["a"] },
        { frame: 5, elementIds: ["b"] },
    ], 9)]);

    it("moves and re-sorts", () => {
        const next = opMoveKeyframe(base, "L", 5, 2)!;
        expect(next.layers[0].keyframes.map(k => k.frame)).toEqual([0, 2]);
        expect(next.layers[0].keyframes[1].elementIds).toEqual(["b"]);
    });

    it("refuses occupied targets", () => {
        expect(opMoveKeyframe(base, "L", 5, 0)).toBeNull();
    });

    it("extends the row when dragged beyond its end", () => {
        const next = opMoveKeyframe(base, "L", 5, 15)!;
        expect(next.layers[0].endFrame).toBe(15);
    });
});

describe("opUpdateKeyframe", () => {
    it("patches tween metadata", () => {
        const base = tl([layer("L", [{ frame: 0, elementIds: ["a"] }], 9)]);
        const next = opUpdateKeyframe(base, "L", 0, { tween: 'motion', easing: 'easeInOutQuad' as any })!;
        expect(next.layers[0].keyframes[0].tween).toBe('motion');
        expect(next.layers[0].keyframes[0].easing).toBe('easeInOutQuad');
    });
});

describe("opReconcile", () => {
    it("assigns orphan elements to the active cel of their layer's row", () => {
        const base = tl([layer("L", [
            { frame: 0, elementIds: [] },
            { frame: 5, elementIds: [] },
        ], 9)]);
        const next = opReconcile(base, [el("new1", "L")], 6)!;
        expect(next.layers[0].keyframes[1].elementIds).toEqual(["new1"]);
        expect(next.layers[0].keyframes[0].elementIds).toEqual([]);
    });

    it("creates a row for elements on layers without one", () => {
        const base = tl([layer("L", [{ frame: 0, elementIds: [] }], 9)]);
        const next = opReconcile(base, [el("x", "L2")], 0)!;
        expect(next.layers.length).toBe(2);
        expect(next.layers[1].layerId).toBe("L2");
        expect(next.layers[1].keyframes[0].elementIds).toEqual(["x"]);
    });

    it("prunes references to deleted elements", () => {
        const base = tl([layer("L", [{ frame: 0, elementIds: ["gone", "kept"] }], 9)]);
        const next = opReconcile(base, [el("kept", "L")], 0)!;
        expect(next.layers[0].keyframes[0].elementIds).toEqual(["kept"]);
    });

    it("returns null when already consistent", () => {
        const base = tl([layer("L", [{ frame: 0, elementIds: ["a"] }], 9)]);
        expect(opReconcile(base, [el("a", "L")], 0)).toBeNull();
    });
});
