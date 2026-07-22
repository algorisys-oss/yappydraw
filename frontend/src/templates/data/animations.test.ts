import { describe, it, expect } from "bun:test";
import {
    buildBouncingBallDoc, buildRocketLaunchDoc, buildYappyIntroDoc,
    allAnimationTemplates,
} from "./animations";
import { evaluateTimelineAt } from "../../utils/animation/frame-timeline-evaluator";
import type { SlideDocument } from "../../types/slide-types";

/** Shared structural invariants every animation template must satisfy. */
const validate = (doc: SlideDocument) => {
    const tl = doc.animTimeline!;
    expect(tl).toBeDefined();
    expect(doc.metadata.docType).toBe('animation');
    const elIds = new Set(doc.elements.map(e => e.id));
    expect(elIds.size).toBe(doc.elements.length); // unique ids
    const layerIds = new Set(doc.layers.map(l => l.id));
    for (const row of tl.layers) {
        expect(layerIds.has(row.layerId)).toBe(true);
        expect(row.endFrame).toBeLessThanOrEqual(tl.frameCount - 1);
        let prev = -1;
        for (const k of row.keyframes) {
            expect(k.frame).toBeGreaterThan(prev); // sorted, unique
            prev = k.frame;
            for (const id of k.elementIds) expect(elIds.has(id)).toBe(true);
        }
    }
    // Every element with a layerId belongs to a real layer
    for (const e of doc.elements) expect(layerIds.has(e.layerId)).toBe(true);
    // Frame 0 renders something
    expect(evaluateTimelineAt(0, tl, doc.elements).visible.size).toBeGreaterThan(0);
};

describe("bouncing ball template", () => {
    const doc = buildBouncingBallDoc();
    it("is structurally valid", () => validate(doc));

    it("tweens the ball down with easing (mid-fall override)", () => {
        const tl = doc.animTimeline!;
        const ballRow = tl.layers.find(l => l.layerId === 'l-ball')!;
        const ballId = ballRow.keyframes[0].elementIds[0];
        const mid = evaluateTimelineAt(5, tl, doc.elements).overrides[ballId];
        expect(mid).toBeDefined();
        expect(mid.y!).toBeGreaterThan(100);
        expect(mid.y!).toBeLessThan(430);
    });

    it("wraps seamlessly (last cel pose ≈ first cel pose)", () => {
        const tl = doc.animTimeline!;
        const row = tl.layers.find(l => l.layerId === 'l-ball')!;
        const first = doc.elements.find(e => e.id === row.keyframes[0].elementIds[0])!;
        const last = doc.elements.find(e => e.id === row.keyframes[row.keyframes.length - 1].elementIds[0])!;
        expect(last.y).toBe(first.y);
        expect(last.width).toBe(first.width);
    });
});

describe("rocket launch template", () => {
    const doc = buildRocketLaunchDoc();
    it("is structurally valid", () => validate(doc));

    it("has a looping flame movie clip wired to its instance", () => {
        const sym = doc.symbols!.find(s => s.kind === 'movieclip')!;
        expect(sym.timeline!.layers[0].keyframes.length).toBe(2);
        const defIds = new Set(sym.elements.map(e => e.id));
        for (const k of sym.timeline!.layers[0].keyframes)
            for (const id of k.elementIds) expect(defIds.has(id)).toBe(true);
        const inst = doc.elements.find(e => e.type === 'symbolInstance')!;
        expect(inst.symbolId).toBe(sym.id);
        expect(inst.loopMode).toBe('loop');
    });

    it("tweens every rocket part upward together", () => {
        const tl = doc.animTimeline!;
        const row = tl.layers.find(l => l.layerId === 'l-rocket')!;
        const ev = evaluateTimelineAt(20, tl, doc.elements);
        for (const id of row.keyframes[0].elementIds) {
            const base = doc.elements.find(e => e.id === id)!;
            expect(ev.overrides[id]).toBeDefined();
            expect(ev.overrides[id].y!).toBeLessThan(base.y);
        }
    });
});

describe("yappy intro template", () => {
    const doc = buildYappyIntroDoc();
    it("is structurally valid", () => validate(doc));

    it("staggers the shape pops and ends fully revealed", () => {
        const tl = doc.animTimeline!;
        const at0 = evaluateTimelineAt(0, tl, doc.elements).visible;
        const atEnd = evaluateTimelineAt(tl.frameCount - 1, tl, doc.elements).visible;
        expect(atEnd.size).toBeGreaterThan(at0.size); // things appeared over time
        // Title text is visible and at full opacity by the end
        const title = doc.elements.find(e => e.type === 'text' && e.text === 'YappyDraw' && e.opacity === 100)!;
        expect(atEnd.has(title.id)).toBe(true);
    });
});

describe("template registry entries", () => {
    it("exposes three doc-carrying templates with first-frame previews", () => {
        expect(allAnimationTemplates.length).toBe(3);
        for (const t of allAnimationTemplates) {
            expect(t.metadata.category).toBe('animations');
            expect((t as any).doc?.version).toBe(4);
            expect(t.data.elements.length).toBeGreaterThan(0); // preview stub
        }
    });
});
