import { describe, it, expect } from "bun:test";
import { measureGap, measureEdges, getMeasureSegments, type Rect } from "./measure-gap";

// sel is a 40×40 box at (100,100). Neighbours placed around it.
const sel: Rect = { x: 100, y: 100, width: 40, height: 40 };

describe("measureGap", () => {
    it("side-by-side (vertical overlap) → one horizontal gap between facing edges", () => {
        const right: Rect = { x: 200, y: 110, width: 40, height: 40 }; // 60px to the right
        const segs = measureGap(sel, right);
        expect(segs).toHaveLength(1);
        const g = segs[0];
        expect(g.orientation).toBe("horizontal");
        expect(g.from).toBe(140); // sel.maxX
        expect(g.to).toBe(200);   // right.minX
        expect(g.distance).toBe(60);
        expect(g.kind).toBe("gap");
        // drawn through the vertical overlap band [110,140] → midpoint 125
        expect(g.coordinate).toBe(125);
    });

    it("neighbour on the left produces the same gap (orientation-agnostic ordering)", () => {
        const left: Rect = { x: 20, y: 100, width: 40, height: 40 }; // maxX=60, gap 40
        const segs = measureGap(sel, left);
        expect(segs).toHaveLength(1);
        expect(segs[0].from).toBe(60);  // left.maxX
        expect(segs[0].to).toBe(100);   // sel.minX
        expect(segs[0].distance).toBe(40);
    });

    it("stacked (horizontal overlap) → one vertical gap", () => {
        const below: Rect = { x: 100, y: 300, width: 40, height: 40 }; // 160px below
        const segs = measureGap(sel, below);
        expect(segs).toHaveLength(1);
        expect(segs[0].orientation).toBe("vertical");
        expect(segs[0].from).toBe(140); // sel.maxY
        expect(segs[0].to).toBe(300);   // below.minY
        expect(segs[0].distance).toBe(160);
    });

    it("diagonal (separated on both axes) → two segments (an L)", () => {
        const diag: Rect = { x: 300, y: 300, width: 40, height: 40 };
        const segs = measureGap(sel, diag);
        expect(segs).toHaveLength(2);
        expect(segs.map(s => s.orientation).sort()).toEqual(["horizontal", "vertical"]);
        // no vertical overlap → horizontal line drawn between the two centres' Y
        const h = segs.find(s => s.orientation === "horizontal")!;
        expect(h.coordinate).toBe((120 + 320) / 2); // sel.cy=120, diag.cy=320 → 220
    });

    it("overlapping on both axes → no gap segments", () => {
        const over: Rect = { x: 120, y: 120, width: 40, height: 40 };
        expect(measureGap(sel, over)).toHaveLength(0);
    });

    it("edge-flush neighbour (gap 0) still emits a zero-length segment", () => {
        const touching: Rect = { x: 140, y: 100, width: 40, height: 40 }; // sel.maxX === touching.minX
        const segs = measureGap(sel, touching);
        expect(segs).toHaveLength(1);
        expect(segs[0].distance).toBe(0);
    });
});

describe("measureEdges", () => {
    const artboard: Rect = { x: 0, y: 0, width: 500, height: 400 };

    it("emits four edge distances for a fully-interior selection", () => {
        const segs = measureEdges(sel, artboard);
        expect(segs).toHaveLength(4);
        const byDist = Object.fromEntries(segs.map(s => [`${s.orientation}:${s.from}`, s.distance]));
        expect(byDist["horizontal:0"]).toBe(100);   // left: sel.minX - 0
        expect(byDist["horizontal:140"]).toBe(360); // right: 500 - sel.maxX
        expect(byDist["vertical:0"]).toBe(100);      // top: sel.minY - 0
        expect(byDist["vertical:140"]).toBe(260);    // bottom: 400 - sel.maxY
    });

    it("drops sides the selection is flush with or outside of", () => {
        const flushLeft: Rect = { x: 0, y: 100, width: 40, height: 40 };
        const segs = measureEdges(flushLeft, artboard);
        // left distance is 0 → dropped; right/top/bottom remain
        expect(segs.some(s => s.orientation === "horizontal" && s.from === 0)).toBe(false);
        expect(segs).toHaveLength(3);
    });
});

describe("getMeasureSegments", () => {
    it("combines neighbour gaps and artboard edges", () => {
        const right: Rect = { x: 200, y: 110, width: 40, height: 40 };
        const artboard: Rect = { x: 0, y: 0, width: 500, height: 400 };
        const segs = getMeasureSegments(sel, right, artboard);
        expect(segs.filter(s => s.kind === "gap")).toHaveLength(1);
        expect(segs.filter(s => s.kind === "edge")).toHaveLength(4);
    });

    it("gaps only when no artboard is given", () => {
        const right: Rect = { x: 200, y: 110, width: 40, height: 40 };
        expect(getMeasureSegments(sel, right, null).every(s => s.kind === "gap")).toBe(true);
    });

    it("nothing when neither target nor artboard is given", () => {
        expect(getMeasureSegments(sel, null, null)).toHaveLength(0);
    });
});
