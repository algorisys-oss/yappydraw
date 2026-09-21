import { describe, it, expect } from "bun:test";
import { layoutGuidePositions, layoutCells, type LayoutGridSpec } from "./layout-guides";

const spec = (p: Partial<LayoutGridSpec>): LayoutGridSpec => ({
    columns: 1, rows: 1, gutterX: 0, gutterY: 0,
    marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0, ...p,
});
const page = { x: 100, y: 50, width: 1000, height: 600 };

describe("layoutGuidePositions", () => {
    it("one cell, no margins: just the rect's edges", () => {
        expect(layoutGuidePositions(page, spec({}))).toEqual({ v: [100, 1100], h: [50, 650] });
    });

    it("margins inset the content area", () => {
        const g = layoutGuidePositions(page, spec({ marginLeft: 40, marginRight: 60, marginTop: 10, marginBottom: 20 }));
        expect(g).toEqual({ v: [140, 1040], h: [60, 630] });
    });

    it("columns with gutters give both sides of every gutter", () => {
        // 1000 wide, 3 columns, 20 gutter → (1000 − 40) / 3 = 320 per column.
        const g = layoutGuidePositions(page, spec({ columns: 3, gutterX: 20 }));
        expect(g.v).toEqual([100, 420, 440, 760, 780, 1100]);
    });

    it("a zero gutter emits each shared edge once", () => {
        expect(layoutGuidePositions(page, spec({ columns: 4 })).v).toEqual([100, 350, 600, 850, 1100]);
    });

    it("rows work like columns", () => {
        const g = layoutGuidePositions(page, spec({ rows: 2, gutterY: 20, marginTop: 40, marginBottom: 40 }));
        // content 90..610 (520), two rows of 250 with a 20 gap.
        expect(g.h).toEqual([90, 340, 360, 610]);
    });

    it("rounds fractional positions to 2 decimals", () => {
        const g = layoutGuidePositions({ x: 0, y: 0, width: 1000, height: 10 }, spec({ columns: 3 }));
        expect(g.v).toEqual([0, 333.33, 666.67, 1000]);
    });

    it("returns nothing on an axis the margins and gutters overfill", () => {
        const g = layoutGuidePositions(page, spec({ columns: 10, gutterX: 120 }));
        expect(g.v).toEqual([]);
        expect(g.h).toEqual([50, 650]);
    });

    it("clamps bad counts and ignores negative or NaN spacing", () => {
        const g = layoutGuidePositions(page, spec({ columns: 0, rows: NaN, gutterX: -5, marginLeft: NaN }));
        expect(g).toEqual({ v: [100, 1100], h: [50, 650] });
    });

    it("rejects an empty or non-finite rect", () => {
        expect(layoutGuidePositions({ x: 0, y: 0, width: 0, height: 10 }, spec({}))).toEqual({ v: [], h: [] });
        expect(layoutGuidePositions({ x: NaN, y: 0, width: 10, height: 10 }, spec({}))).toEqual({ v: [], h: [] });
    });
});

describe("layoutCells", () => {
    it("returns each column's span, gutters excluded", () => {
        const { columns, rows } = layoutCells(page, spec({ columns: 3, gutterX: 20 }));
        expect(columns).toEqual([[100, 420], [440, 760], [780, 1100]]);
        expect(rows).toEqual([[50, 650]]);
    });
});
