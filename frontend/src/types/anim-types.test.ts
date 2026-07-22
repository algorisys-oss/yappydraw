import { describe, it, expect } from "bun:test";
import { createDefaultAnimTimeline, DEFAULT_ANIM_FPS, DEFAULT_ANIM_FRAME_COUNT } from "./anim-types";
import { createSlideDocument } from "./slide-types";

describe("createDefaultAnimTimeline", () => {
    it("creates one row per layer with a blank keyframe at frame 0", () => {
        const tl = createDefaultAnimTimeline(["a", "b"]);
        expect(tl.fps).toBe(DEFAULT_ANIM_FPS);
        expect(tl.frameCount).toBe(DEFAULT_ANIM_FRAME_COUNT);
        expect(tl.layers.length).toBe(2);
        for (const [i, layerId] of ["a", "b"].entries()) {
            expect(tl.layers[i].layerId).toBe(layerId);
            expect(tl.layers[i].keyframes).toEqual([{ frame: 0, elementIds: [] }]);
            expect(tl.layers[i].endFrame).toBe(DEFAULT_ANIM_FRAME_COUNT - 1);
        }
    });

    it("honours explicit fps and frameCount", () => {
        const tl = createDefaultAnimTimeline(["a"], 12, 60);
        expect(tl.fps).toBe(12);
        expect(tl.frameCount).toBe(60);
        expect(tl.layers[0].endFrame).toBe(59);
    });
});

describe("createSlideDocument (animation)", () => {
    it("builds an animation doc with a Stage page and a default timeline", () => {
        const doc = createSlideDocument("Test", "animation", { width: 1280, height: 720 }, { fps: 30, frameCount: 90 });
        expect(doc.metadata.docType).toBe("animation");
        expect(doc.slides[0].name).toBe("Stage");
        expect(doc.slides[0].dimensions).toEqual({ width: 1280, height: 720 });
        expect(doc.animTimeline).toBeDefined();
        expect(doc.animTimeline!.fps).toBe(30);
        expect(doc.animTimeline!.frameCount).toBe(90);
        // The timeline row is paired with the created layer by id
        expect(doc.animTimeline!.layers.map(l => l.layerId)).toEqual(doc.layers.map(l => l.id));
    });

    it("gives non-animation docs no timeline", () => {
        for (const t of ["infinite", "slides", "design", "game"] as const) {
            expect(createSlideDocument("x", t).animTimeline).toBeUndefined();
        }
    });

    it("survives a JSON round-trip unchanged", () => {
        const doc = createSlideDocument("RT", "animation", undefined, { fps: 24, frameCount: 48 });
        const back = JSON.parse(JSON.stringify(doc));
        expect(back.animTimeline).toEqual(doc.animTimeline as any);
        expect(back.metadata.docType).toBe("animation");
    });
});
