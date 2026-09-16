import { describe, it, expect } from "bun:test";
import { samplePathPolyline } from "./path-offset";

// Offset Path samples the outline in world space. Freehand strokes store top-left-relative
// points, which this read as centred — the offset outline landed half the stroke's size away.
describe("samplePathPolyline places freehand strokes at their own origin", () => {
    it("a fineliner's samples stay inside its own box", () => {
        const el = { id: 'f', type: 'fineliner', x: 350, y: 150, width: 120, height: 100, angle: 0,
            points: [{ x: 0, y: 0 }, { x: 120, y: 0 }, { x: 120, y: 100 }, { x: 0, y: 100 }] } as any;
        const { pts } = samplePathPolyline(el)!;
        expect(Math.min(...pts.map(p => p.x))).toBe(350);
        expect(Math.min(...pts.map(p => p.y))).toBe(150);
        expect(Math.max(...pts.map(p => p.x))).toBe(470);
        expect(Math.max(...pts.map(p => p.y))).toBe(250);
    });
});
