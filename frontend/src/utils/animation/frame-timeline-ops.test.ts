import { describe, it, expect } from "bun:test";
import {
    opInsertFrame, opInsertKeyframe, opInsertBlankKeyframe, opClearKeyframe,
    opRemoveFrames, opMoveKeyframe, opUpdateKeyframe, opReconcile,
    opCopyFrames, opPasteFrames, opRemoveFrameRange,
    opSetCelDuration, opSplitFrames, opInsertInbetween,
    opSetMarker, opRemoveMarker, opSetMarkRange, findCelFrame, findMarkerFrame, playbackRange,
    opSetPeg, opClearAllPegs, pegAt,
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

describe("audio row ops", () => {
    const { opAddAudio, opRemoveAudio, opMoveAudio } = require("./frame-timeline-ops");
    const base = tl([layer("L", [{ frame: 0, elementIds: [] }], 23)], 24);

    it("adds sorted by frame", () => {
        let t = opAddAudio(base, { id: "a1", frame: 10, name: "coin", sfx: "coin" });
        t = opAddAudio(t, { id: "a2", frame: 2, name: "jump", sfx: "jump" });
        expect(t.audio.map((a: any) => a.id)).toEqual(["a2", "a1"]);
    });

    it("removes by id, null when absent", () => {
        const t = opAddAudio(base, { id: "a1", frame: 5, name: "hit", sfx: "hit" });
        expect(opRemoveAudio(t, "a1")!.audio).toEqual([]);
        expect(opRemoveAudio(t, "nope")).toBeNull();
    });

    it("moves with clamping and keeps sort order", () => {
        let t = opAddAudio(base, { id: "a1", frame: 5, name: "hit", sfx: "hit" });
        t = opAddAudio(t, { id: "a2", frame: 8, name: "win", sfx: "win" });
        const moved = opMoveAudio(t, "a2", 999)!;
        expect(moved.audio.find((a: any) => a.id === "a2").frame).toBe(23); // clamped to ruler end
        expect(opMoveAudio(t, "a1", 5)).toBeNull(); // no-op
        const re = opMoveAudio(t, "a2", 1)!;
        expect(re.audio.map((a: any) => a.id)).toEqual(["a2", "a1"]);
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

// ---------------------------------------------------------------------------
// Frame clipboard (copy / paste / delete a rectangular block of cels)
// ---------------------------------------------------------------------------

describe("opCopyFrames", () => {
    const base = tl([
        layer("L1", [
            { frame: 0, elementIds: ["a"] },
            { frame: 4, elementIds: ["b"], tween: "motion" },
        ], 9),
        layer("L2", [{ frame: 0, elementIds: ["c"] }], 9),
    ]);
    const els = [el("a"), el("b"), el("c", "L2")];

    it("rebases the copied keyframes so the block starts at 0", () => {
        const clip = opCopyFrames(base, ["L1"], 4, 6, els)!;
        expect(clip.rows[0].keyframes.map(k => k.frame)).toEqual([0]);
        expect(clip.length).toBe(3);
    });

    it("carries the span metadata (tween) with the cel", () => {
        const clip = opCopyFrames(base, ["L1"], 4, 6, els)!;
        expect(clip.rows[0].keyframes[0].tween).toBe("motion");
    });

    it("includes the cel that is merely ACTIVE at the range start", () => {
        // Frames 1..3 are held by the keyframe at 0 — copying them must copy that
        // drawing, not come back empty.
        const clip = opCopyFrames(base, ["L1"], 1, 3, els)!;
        expect(clip.rows[0].keyframes.length).toBe(1);
        expect(clip.rows[0].keyframes[0].frame).toBe(0);
        expect(clip.rows[0].keyframes[0].elementIds).toEqual(["a"]);
    });

    it("snapshots the referenced elements so a later delete cannot empty the clipboard", () => {
        const clip = opCopyFrames(base, ["L1"], 0, 9, els)!;
        expect(clip.elements.map(e => e.id).sort()).toEqual(["a", "b"]);
        expect(clip.elements[0]).not.toBe(els[0]); // deep copy, not the live object
    });

    it("copies one clipboard row per selected layer, in order", () => {
        const clip = opCopyFrames(base, ["L1", "L2"], 0, 5, els)!;
        expect(clip.rows.length).toBe(2);
        expect(clip.rows[1].keyframes[0].elementIds).toEqual(["c"]);
    });

    it("returns null when no selected layer has a row", () => {
        expect(opCopyFrames(base, ["nope"], 0, 5, els)).toBeNull();
    });
});

describe("opPasteFrames", () => {
    const src = tl([
        layer("L1", [{ frame: 0, elementIds: ["a"] }, { frame: 2, elementIds: ["b"] }], 3),
        layer("L2", [{ frame: 0, elementIds: ["c"] }], 3),
    ]);
    const els = [el("a", "L1", { contentId: "shared" }), el("b", "L1"), el("c", "L2")];
    const clip = () => opCopyFrames(src, ["L1"], 0, 3, els)!;

    it("lands the cels at the paste frame", () => {
        const res = opPasteFrames(src, ["L1"], 10, clip(), genId)!;
        const row = res.timeline.layers[0];
        expect(row.keyframes.map(k => k.frame)).toEqual([0, 2, 10, 12]);
    });

    it("creates FRESH element ids — the pasted cel is independent of the source", () => {
        const res = opPasteFrames(src, ["L1"], 10, clip(), genId)!;
        expect(res.copies.length).toBe(2);
        for (const c of res.copies) expect(["a", "b"]).not.toContain(c.id);
        const pasted = res.timeline.layers[0].keyframes.find(k => k.frame === 10)!;
        expect(pasted.elementIds).toEqual([res.copies[0].id]);
    });

    it("keeps contentId so a tween can still pair the copy with its source", () => {
        const res = opPasteFrames(src, ["L1"], 10, clip(), genId)!;
        expect(res.copies[0].contentId).toBe("shared");
    });

    it("gives a copy pasted onto another row that row's layerId", () => {
        const res = opPasteFrames(src, ["L2"], 10, clip(), genId)!;
        expect(res.copies.every(c => c.layerId === "L2")).toBe(true);
    });

    it("overwrites the destination range and dooms the content it replaced", () => {
        const res = opPasteFrames(src, ["L1"], 0, clip(), genId)!;
        // The block is 4 frames, so the old keyframes at 0 and 2 are replaced.
        expect(res.doomedIds.sort()).toEqual(["a", "b"]);
        expect(res.timeline.layers[0].keyframes.map(k => k.frame)).toEqual([0, 2]);
    });

    it("does not doom an element another keyframe still references", () => {
        const shared = tl([layer("L1", [
            { frame: 0, elementIds: ["a"] },
            { frame: 8, elementIds: ["a"] },
        ], 9)]);
        const res = opPasteFrames(shared, ["L1"], 0, clip(), genId)!;
        expect(res.doomedIds).toEqual([]);
    });

    it("grows the row and the ruler to fit a paste past the end", () => {
        const res = opPasteFrames(src, ["L1"], 30, clip(), genId)!;
        expect(res.timeline.layers[0].endFrame).toBe(33);
        expect(res.timeline.frameCount).toBeGreaterThanOrEqual(34);
    });

    it("spreads a multi-row clipboard across consecutive target rows", () => {
        const two = opCopyFrames(src, ["L1", "L2"], 0, 3, els)!;
        const res = opPasteFrames(src, ["L1", "L2"], 10, two, genId)!;
        expect(res.timeline.layers[1].keyframes.some(k => k.frame === 10)).toBe(true);
    });

    it("returns null for an empty clipboard", () => {
        expect(opPasteFrames(src, ["L1"], 0, { length: 0, rows: [], elements: [] }, genId)).toBeNull();
    });
});

describe("opRemoveFrameRange", () => {
    const base = tl([layer("L", [
        { frame: 0, elementIds: ["a"] },
        { frame: 4, elementIds: ["b"] },
        { frame: 6, elementIds: ["c"] },
    ], 9)]);

    it("deletes the cells and pulls later keyframes left by the range length", () => {
        const res = opRemoveFrameRange(base, ["L"], 1, 3)!;
        expect(res.timeline.layers[0].keyframes.map(k => k.frame)).toEqual([0, 1, 3]);
        expect(res.timeline.layers[0].endFrame).toBe(6);
    });

    it("dooms the content of cels that disappear entirely", () => {
        const res = opRemoveFrameRange(base, ["L"], 4, 5)!;
        expect(res.doomedIds).toEqual(["b"]);
        expect(res.timeline.layers[0].keyframes.map(k => k.frame)).toEqual([0, 4]);
    });

    it("returns null when no row matches", () => {
        expect(opRemoveFrameRange(base, ["zzz"], 0, 2)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Timing tools — exposure (cel duration), split-on-N, in-betweens
// ---------------------------------------------------------------------------

describe("opSetCelDuration", () => {
    const base = tl([layer("L", [
        { frame: 0, elementIds: ["a"] },
        { frame: 4, elementIds: ["b"] },
    ], 9)]);

    it("stretches a cel and pushes the later ones right", () => {
        const next = opSetCelDuration(base, ["L"], 0, 6)!;
        expect(next.layers[0].keyframes.map(k => k.frame)).toEqual([0, 6]);
        expect(next.layers[0].endFrame).toBe(11);
    });

    it("compresses a cel and pulls the later ones left", () => {
        const next = opSetCelDuration(base, ["L"], 0, 2)!;
        expect(next.layers[0].keyframes.map(k => k.frame)).toEqual([0, 2]);
        expect(next.layers[0].endFrame).toBe(7);
    });

    it("resizes the LAST cel against the row end, not a following keyframe", () => {
        const next = opSetCelDuration(base, ["L"], 4, 2)!;
        expect(next.layers[0].endFrame).toBe(5);
        expect(next.layers[0].keyframes.map(k => k.frame)).toEqual([0, 4]);
    });

    it("works from any frame inside the cel's span, not just its keyframe", () => {
        const next = opSetCelDuration(base, ["L"], 2, 6)!;
        expect(next.layers[0].keyframes.map(k => k.frame)).toEqual([0, 6]);
    });

    it("applies to every selected row", () => {
        const two = tl([
            layer("L1", [{ frame: 0, elementIds: [] }, { frame: 2, elementIds: [] }], 5),
            layer("L2", [{ frame: 0, elementIds: [] }, { frame: 2, elementIds: [] }], 5),
        ]);
        const next = opSetCelDuration(two, ["L1", "L2"], 0, 4)!;
        expect(next.layers[0].keyframes[1].frame).toBe(4);
        expect(next.layers[1].keyframes[1].frame).toBe(4);
    });

    it("rejects a duration below one frame, and no-ops when already that long", () => {
        expect(opSetCelDuration(base, ["L"], 0, 0)).toBeNull();
        expect(opSetCelDuration(base, ["L"], 0, 4)).toBeNull();
    });
});

describe("opSplitFrames", () => {
    const drawn = tl([layer("L", [{ frame: 0, elementIds: ["a"] }], 7)]);
    const blank = tl([layer("L", [{ frame: 0, elementIds: [] }], 7)]);
    const els = [el("a")];

    it("cuts the range into cels of the requested length", () => {
        const res = opSplitFrames(drawn, ["L"], 0, 7, 2, els, genId)!;
        expect(res.timeline.layers[0].keyframes.map(k => k.frame)).toEqual([0, 2, 4, 6]);
    });

    it("gives every new cel its own copy of the drawing", () => {
        const res = opSplitFrames(drawn, ["L"], 0, 7, 2, els, genId)!;
        expect(res.copies.length).toBe(3);
        const ids = res.timeline.layers[0].keyframes.flatMap(k => k.elementIds);
        expect(new Set(ids).size).toBe(4); // 4 cels, 4 distinct elements
    });

    it("chains the copies — each new cel duplicates the one before it, not the first", () => {
        // Copy N must exist in the element pool by the time cel N+1 duplicates it,
        // otherwise every cel past the second comes out empty.
        const res = opSplitFrames(drawn, ["L"], 0, 7, 2, els, genId)!;
        for (const kf of res.timeline.layers[0].keyframes) expect(kf.elementIds.length).toBe(1);
    });

    it("splitting a blank cel makes blank cels, not copies of nothing", () => {
        const res = opSplitFrames(blank, ["L"], 0, 7, 2, [], genId)!;
        expect(res.copies.length).toBe(0);
        expect(res.timeline.layers[0].keyframes.map(k => k.frame)).toEqual([0, 2, 4, 6]);
    });

    it("splitting on 1s exposes every frame", () => {
        const res = opSplitFrames(blank, ["L"], 0, 3, 1, [], genId)!;
        expect(res.timeline.layers[0].keyframes.map(k => k.frame)).toEqual([0, 1, 2, 3]);
    });

    it("leaves existing keyframes alone instead of doubling them", () => {
        const pre = tl([layer("L", [{ frame: 0, elementIds: [] }, { frame: 2, elementIds: [] }], 7)]);
        const res = opSplitFrames(pre, ["L"], 0, 7, 2, [], genId)!;
        expect(res.timeline.layers[0].keyframes.map(k => k.frame)).toEqual([0, 2, 4, 6]);
    });

    it("returns null when the split changes nothing", () => {
        expect(opSplitFrames(drawn, ["L"], 0, 0, 2, els, genId)).toBeNull();
        expect(opSplitFrames(drawn, ["L"], 0, 7, 0, els, genId)).toBeNull();
    });
});

describe("opInsertInbetween", () => {
    it("drops a blank cel in the middle of the span", () => {
        const base = tl([layer("L", [
            { frame: 0, elementIds: ["a"] },
            { frame: 8, elementIds: ["b"] },
        ], 11)]);
        const next = opInsertInbetween(base, ["L"], 0)!;
        expect(next.layers[0].keyframes.map(k => k.frame)).toEqual([0, 4, 8]);
        expect(next.layers[0].keyframes[1].elementIds).toEqual([]);
    });

    it("uses the row end for the last cel", () => {
        const base = tl([layer("L", [{ frame: 0, elementIds: ["a"] }], 5)]);
        const next = opInsertInbetween(base, ["L"], 0)!;
        expect(next.layers[0].keyframes.map(k => k.frame)).toEqual([0, 3]);
    });

    it("returns null when the span has no room for one", () => {
        const tight = tl([layer("L", [
            { frame: 0, elementIds: ["a"] },
            { frame: 1, elementIds: ["b"] },
        ], 1)]);
        expect(opInsertInbetween(tight, ["L"], 0)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Markers, playback range, and step-by-cel / step-by-marker navigation
// ---------------------------------------------------------------------------

describe("markers", () => {
    const base = tl([layer("L", [{ frame: 0, elementIds: [] }], 9)]);

    it("adds markers in frame order", () => {
        let next = opSetMarker(base, { frame: 8, name: "out" });
        next = opSetMarker(next, { frame: 2, name: "in" });
        expect(next.markers!.map(m => m.frame)).toEqual([2, 8]);
    });

    it("replaces the marker already on that frame instead of stacking one", () => {
        let next = opSetMarker(base, { frame: 4, name: "first" });
        next = opSetMarker(next, { frame: 4, name: "second", color: "#f00" });
        expect(next.markers!.length).toBe(1);
        expect(next.markers![0].name).toBe("second");
    });

    it("removes a marker, and drops the list when the last one goes", () => {
        const one = opSetMarker(base, { frame: 3, name: "x" });
        const gone = opRemoveMarker(one, 3)!;
        expect(gone.markers).toBeUndefined();
        expect(opRemoveMarker(base, 3)).toBeNull();
    });
});

describe("opSetMarkRange", () => {
    const base = tl([layer("L", [{ frame: 0, elementIds: [] }], 23)], 24);

    it("stores an inclusive in/out range", () => {
        const next = opSetMarkRange(base, 4, 12)!;
        expect(next.markIn).toBe(4);
        expect(next.markOut).toBe(12);
    });

    it("orders the two ends however they were given", () => {
        const next = opSetMarkRange(base, 12, 4)!;
        expect([next.markIn, next.markOut]).toEqual([4, 12]);
    });

    it("clamps to the ruler", () => {
        const next = opSetMarkRange(base, -5, 999)!;
        expect([next.markIn, next.markOut]).toEqual([0, 23]);
    });

    it("clearing both ends removes the range entirely", () => {
        const set = opSetMarkRange(base, 4, 12)!;
        const cleared = opSetMarkRange(set, null, null)!;
        expect(cleared.markIn).toBeUndefined();
        expect(cleared.markOut).toBeUndefined();
    });

    it("keeps the range at least one frame long", () => {
        const next = opSetMarkRange(base, 7, 7)!;
        expect([next.markIn, next.markOut]).toEqual([7, 7]);
    });
});

describe("findCelFrame — flipping cel to cel", () => {
    const base = tl([
        layer("L1", [{ frame: 0, elementIds: [] }, { frame: 4, elementIds: [] }, { frame: 9, elementIds: [] }], 11),
        layer("L2", [{ frame: 0, elementIds: [] }, { frame: 6, elementIds: [] }], 11),
    ]);

    it("jumps to the next cel on the row, not the next frame", () => {
        expect(findCelFrame(base, ["L1"], 0, 1)).toBe(4);
        expect(findCelFrame(base, ["L1"], 1, 1)).toBe(4);
    });

    it("jumps back to the previous cel", () => {
        expect(findCelFrame(base, ["L1"], 9, -1)).toBe(4);
        expect(findCelFrame(base, ["L1"], 5, -1)).toBe(4);
    });

    it("merges the cels of several rows so a flip crosses layers", () => {
        expect(findCelFrame(base, ["L1", "L2"], 4, 1)).toBe(6);
    });

    it("returns null at the ends rather than wrapping", () => {
        expect(findCelFrame(base, ["L1"], 9, 1)).toBeNull();
        expect(findCelFrame(base, ["L1"], 0, -1)).toBeNull();
    });
});

describe("findMarkerFrame", () => {
    const base = (() => {
        let t = tl([layer("L", [{ frame: 0, elementIds: [] }], 23)], 24);
        t = opSetMarker(t, { frame: 3, name: "a" });
        t = opSetMarker(t, { frame: 11, name: "b" });
        return t;
    })();

    it("steps forward and back between markers", () => {
        expect(findMarkerFrame(base, 0, 1)).toBe(3);
        expect(findMarkerFrame(base, 3, 1)).toBe(11);
        expect(findMarkerFrame(base, 11, -1)).toBe(3);
    });

    it("returns null past the last marker and with no markers at all", () => {
        expect(findMarkerFrame(base, 11, 1)).toBeNull();
        expect(findMarkerFrame(tl([layer("L", [{ frame: 0, elementIds: [] }], 9)]), 0, 1)).toBeNull();
    });
});

describe("playbackRange", () => {
    const base = tl([layer("L", [{ frame: 0, elementIds: [] }], 23)], 24);

    it("is the whole ruler when no range is marked", () => {
        expect(playbackRange(base)).toEqual([0, 23]);
    });

    it("is the marked range when one is set", () => {
        expect(playbackRange(opSetMarkRange(base, 4, 12)!)).toEqual([4, 12]);
    });

    it("survives a range left over from a longer timeline", () => {
        // Shortening the ruler must not leave playback pointing past the end.
        const stale = { ...base, frameCount: 8, markIn: 2, markOut: 99 };
        expect(playbackRange(stale)).toEqual([2, 7]);
    });
});

// ---------------------------------------------------------------------------
// Out of pegs — a ghost-only transform on a cel
// ---------------------------------------------------------------------------

describe("out of pegs", () => {
    const base = tl([
        layer("L1", [{ frame: 0, elementIds: ["a"] }, { frame: 6, elementIds: ["b"] }], 11),
        layer("L2", [{ frame: 0, elementIds: ["c"] }], 11),
    ]);
    const peg = { x: 20, y: -8, angle: 0.2, scale: 1.1 };

    it("attaches the peg to the cel that OWNS the frame, not the frame itself", () => {
        // Frame 3 is held by the keyframe at 0 — pegging it must peg that cel.
        const next = opSetPeg(base, "L1", 3, peg)!;
        expect(next.layers[0].keyframes[0].peg).toEqual(peg);
        expect(next.layers[0].keyframes[1].peg).toBeUndefined();
    });

    it("reads back the peg from any frame the cel holds", () => {
        const next = opSetPeg(base, "L1", 0, peg)!;
        expect(pegAt(next, "L1", 4)).toEqual(peg);
        expect(pegAt(next, "L1", 6)).toBeNull();
        expect(pegAt(next, "nope", 0)).toBeNull();
    });

    it("clears a single cel's peg", () => {
        const set = opSetPeg(base, "L1", 0, peg)!;
        const cleared = opSetPeg(set, "L1", 0, null)!;
        expect(cleared.layers[0].keyframes[0].peg).toBeUndefined();
    });

    it("never touches the elements — the drawing itself has not moved", () => {
        const next = opSetPeg(base, "L1", 0, peg)!;
        expect(next.layers[0].keyframes[0].elementIds).toEqual(["a"]);
        expect(next.layers[0].keyframes[1].elementIds).toEqual(["b"]);
    });

    it("resets every peg in the document at once", () => {
        let next = opSetPeg(base, "L1", 0, peg)!;
        next = opSetPeg(next, "L2", 0, peg)!;
        const cleared = opClearAllPegs(next)!;
        expect(cleared.layers.every(l => l.keyframes.every(k => k.peg === undefined))).toBe(true);
    });

    it("returns null when there is nothing to reset", () => {
        expect(opClearAllPegs(base)).toBeNull();
        expect(opSetPeg(base, "L1", 0, null)).toBeNull();
    });
});
