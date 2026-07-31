import { describe, it, expect } from "bun:test";
import { getElementFamily, getToolDefaultProperties } from "./quick-toolbar-config";

/**
 * The tool-options bar shows these against `defaultElementStyles`, so every control it
 * offers has to actually reach the next drawn element. The rules that matter are the
 * exclusions — a control that silently does nothing is worse than an absent one.
 */
describe("getToolDefaultProperties", () => {
    const keys = (tool: any) => getToolDefaultProperties(tool).map(p => p.key);

    it("gives shape tools their stroke/fill/text defaults", () => {
        const k = keys("rectangle");
        expect(k).toContain("strokeColor");
        expect(k).toContain("backgroundColor");
        expect(k).toContain("strokeStyle");
        expect(k).toContain("fontFamily");
    });

    it("covers a shape type with no bespoke entry, via the family fallback", () => {
        // umlComponent is in no list in the config — it must still classify as a shape,
        // so newly added shapes get options without touching this file.
        expect(getElementFamily("umlComponent")).toBe("shape");
        expect(keys("umlComponent")).toContain("strokeColor");
    });

    it("offers line type and arrowheads for the connectors that honour them", () => {
        const k = keys("arrow");
        expect(k).toContain("curveType");
        expect(k).toContain("startArrowhead");
        expect(k).toContain("endArrowhead");
    });

    it("hides line type for tools whose curveType the draw handler overrides", () => {
        // draw-handler forces bezier/organicBranch → 'bezier', elbow → 'elbow'.
        for (const tool of ["bezier", "elbow", "organicBranch", "polyline"]) {
            expect(keys(tool)).not.toContain("curveType");
        }
        // ...but they keep the rest of the connector options.
        expect(keys("bezier")).toContain("strokeWidth");
    });

    it("drops properties that only mean anything on an existing element", () => {
        expect(keys("rectangle")).not.toContain("curvedText");
        expect(keys("line")).not.toContain("curvedText");
        expect(keys("fineliner")).not.toContain("curvedText");
    });

    it("returns nothing for tools that draw no element", () => {
        for (const tool of ["selection", "pan", "eraser", "lasso", "crop", "laser", "ink"]) {
            expect(getToolDefaultProperties(tool as any)).toEqual([]);
        }
    });

    it("gives text tools their font controls", () => {
        const k = keys("text");
        expect(k).toContain("fontFamily");
        expect(k).toContain("fontSize");
        expect(k).toContain("fontWeight");
    });
});
