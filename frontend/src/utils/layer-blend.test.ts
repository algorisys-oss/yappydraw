import { describe, it, expect } from "bun:test";
import { effectiveBlendMode, registerLayerBlendResolver } from "./layer-blend";

describe("effectiveBlendMode", () => {
    it("falls back to the element's own value when no resolver is registered (SDK)", () => {
        expect(effectiveBlendMode({ blendMode: "screen", layerId: "l1" })).toBe("screen");
        expect(effectiveBlendMode({ layerId: "l1" })).toBeUndefined();
    });
    it("an element with no blend (or Normal) takes its layer's mode", () => {
        registerLayerBlendResolver(id => (id === "tex" ? "multiply" : undefined));
        expect(effectiveBlendMode({ layerId: "tex" })).toBe("multiply");
        expect(effectiveBlendMode({ blendMode: "normal", layerId: "tex" })).toBe("multiply");
        expect(effectiveBlendMode({ blendMode: "normal", layerId: "plain" })).toBe("normal");
    });
    it("an element's own non-Normal mode wins over the layer's", () => {
        registerLayerBlendResolver(() => "multiply");
        expect(effectiveBlendMode({ blendMode: "screen", layerId: "tex" })).toBe("screen");
    });
});
