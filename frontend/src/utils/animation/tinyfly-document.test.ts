import { describe, it, expect } from "bun:test";
import { readTinyflyFile, tinyflyElementToShape, tinyflyFontToYappy, tinyflyPlacementOffset } from "./tinyfly-document";

const tracks = [{ id: "t", target: "Box", property: "opacity", keyframes: [{ time: 0, value: 0 }, { time: 500, value: 1 }] }];
const box = { type: "rect", name: "Box", x: 10, y: 20, width: 60, height: 40, rotation: 90, opacity: 0.5, visible: true, fill: "#4a9eff", stroke: "transparent", strokeWidth: 0, borderRadius: 6 };

describe("readTinyflyFile", () => {
    it("reads a timeline definition as a timeline", () => {
        const f = readTinyflyFile(JSON.stringify({ id: "a", config: { duration: 500 }, tracks }));
        expect(f.kind).toBe("timeline");
    });

    it("reads an Animation Document as a scene, folding duration into config", () => {
        const f = readTinyflyFile({ name: "Promo", duration: 2000, canvas: { width: 360, height: 640 }, config: { loop: -1 }, elements: [box], tracks });
        expect(f.kind).toBe("scene");
        if (f.kind !== "scene") return;
        expect(f.name).toBe("Promo");
        expect(f.canvas).toEqual({ width: 360, height: 640 });
        expect(f.elements).toHaveLength(1);
        expect(f.definition.config).toEqual({ loop: -1, duration: 2000 });
        expect(f.definition.tracks).toEqual(tracks as any);
        expect(f.sceneCount).toBe(1);
    });

    it("gives id-less and duplicate tracks their own ids, which the engine needs to keep them apart", () => {
        const f = readTinyflyFile({ name: "Doc", duration: 1000, elements: [box], tracks: [
            { target: "Box", property: "x", keyframes: [] },
            { target: "Box", property: "y", keyframes: [] },
            { id: "a", target: "Box", property: "opacity", keyframes: [] },
            { id: "a", target: "Box", property: "rotate", keyframes: [] },
        ] });
        const ids = (f.definition.tracks as any[]).map(t => t.id);
        expect(new Set(ids).size).toBe(4);
        expect(ids[2]).toBe("a");
    });

    it("reads a Project's active scene", () => {
        const project = {
            id: "p", name: "Proj", canvas: { width: 300, height: 200, background: "#252525" }, activeSceneId: "s2",
            scenes: [
                { id: "s1", name: "One", order: 0, elements: [], timeline: null },
                { id: "s2", name: "Two", order: 1, elements: [box], timeline: { id: "s2", config: { duration: 900 }, tracks } },
            ],
            symbols: [],
        };
        const f = readTinyflyFile(project);
        expect(f.kind).toBe("scene");
        if (f.kind !== "scene") return;
        expect(f.name).toBe("Proj · Two");
        expect(f.elements[0].name).toBe("Box");
        expect(f.definition.config.duration).toBe(900);
        expect(f.sceneCount).toBe(2);
    });

    it("refuses an embed Sequence, whose elements carry HTML instead of styles", () => {
        const seq = { id: "p", name: "Seq", canvas: { width: 1, height: 1 }, scenes: [{ id: "s", name: "S", elements: [{ ...box, html: "<div></div>" }], timeline: null }] };
        expect(() => readTinyflyFile(seq)).toThrow(/Export Animation Document/);
    });

    it("explains bad input", () => {
        expect(() => readTinyflyFile("{nope")).toThrow(/not valid JSON/);
        expect(() => readTinyflyFile({ hello: 1 })).toThrow(/tracks/);
    });
});

describe("tinyflyElementToShape", () => {
    it("turns a rect into a rectangle with tinyfly's opacity, rotation, fill and no stroke", () => {
        const s = tinyflyElementToShape(box, 100, 200)!;
        expect(s.kind).toBe("element");
        expect(s.type).toBe("rectangle");
        expect([s.x, s.y, s.width, s.height]).toEqual([110, 220, 60, 40]);
        expect(s.options.name).toBe("Box");
        expect(s.options.opacity).toBe(50);
        expect(s.options.angle).toBeCloseTo(Math.PI / 2, 9);
        expect(s.options.backgroundColor).toBe("#4a9eff");
        expect(s.options.strokeColor).toBe("transparent");
        expect(s.options.borderRadius).toBe(6);
    });

    it("maps a linear gradient onto Yappy's gradient fill", () => {
        const s = tinyflyElementToShape({ ...box, fill: { type: "linear", angle: 90, stops: [{ offset: 0, color: "#f00" }, { offset: 1, color: "#00f" }] } }, 0, 0)!;
        expect(s.options.fillStyle).toBe("linear");
        expect(s.options.gradientDirection).toBe(90);
        expect(s.options.gradientStops).toEqual([{ offset: 0, color: "#f00" }, { offset: 1, color: "#00f" }]);
    });

    it("makes text coloured by fill, in the matching font, on no background", () => {
        const s = tinyflyElementToShape({ type: "text", name: "w0c0", x: 98, y: 271, width: 41, height: 74, rotation: 0, opacity: 1, visible: true, text: "D", fontSize: 62, fontFamily: "system-ui, sans-serif", fontWeight: 800, fill: "#1b1b1b", textAlign: "center" }, 0, 0)!;
        expect(s.kind).toBe("text");
        expect(s.text).toBe("D");
        expect(s.options.textColor).toBe("#1b1b1b");
        expect(s.options.backgroundColor).toBe("transparent");
        expect(s.options.fontFamily).toBe("sans-serif");
        expect(s.options.fontWeight).toBe(800);
        expect([s.width, s.height]).toEqual([41, 74]);
    });

    it("places lines and arrows by their two end points", () => {
        const s = tinyflyElementToShape({ type: "arrow", name: "A", x: 10, y: 10, x2: 110, y2: 60, width: 0, height: 0, rotation: 0, opacity: 1, visible: true, stroke: "#fff", strokeWidth: 3, headSize: 10, startHead: false, endHead: true }, 5, 5)!;
        expect(s.type).toBe("arrow");
        expect([s.x, s.y, s.width, s.height]).toEqual([15, 15, 100, 50]);
        expect(s.options.endArrowhead).toBe("triangle");
        expect(s.options.startArrowhead).toBe(null);
        expect(s.options.strokeColor).toBe("#fff");
    });

    it("keeps a path's d and where it sits, for the caller to parse", () => {
        const s = tinyflyElementToShape({ type: "path", name: "P", x: 30, y: 40, width: 10, height: 10, rotation: 0, opacity: 1, visible: true, d: "M0 0 L10 10", fill: "none", stroke: "#000", strokeWidth: 2, closed: false }, 0, 0)!;
        expect(s.kind).toBe("path");
        expect(s.d).toBe("M0 0 L10 10");
        expect([s.x, s.y]).toEqual([30, 40]);
        expect(s.options.backgroundColor).toBe("transparent");
    });

    it("skips what Yappy cannot draw from the file alone", () => {
        for (const type of ["group", "symbol", "audio", "video", "sparkle"]) {
            expect(tinyflyElementToShape({ ...box, type }, 0, 0)).toBeNull();
        }
        expect(tinyflyElementToShape({ ...box, visible: false }, 0, 0)).toBeNull();
    });
});

describe("tinyflyFontToYappy", () => {
    it("picks the closest built-in family", () => {
        expect(tinyflyFontToYappy("system-ui, sans-serif")).toBe("sans-serif");
        expect(tinyflyFontToYappy("Georgia, serif")).toBe("serif");
        expect(tinyflyFontToYappy("Menlo, monospace")).toBe("monospace");
        expect(tinyflyFontToYappy("Poppins")).toBe("poppins");
        expect(tinyflyFontToYappy(undefined)).toBe("sans-serif");
    });
});

describe("tinyflyPlacementOffset", () => {
    it("centres the artboard on the point", () => {
        expect(tinyflyPlacementOffset({ width: 360, height: 640 }, [], { x: 1000, y: 500 })).toEqual({ dx: 820, dy: 180 });
    });
    it("centres the elements' bounds when there is no artboard", () => {
        expect(tinyflyPlacementOffset(undefined, [box, { ...box, x: 110, y: 120 }], { x: 0, y: 0 })).toEqual({ dx: -90, dy: -90 });
    });
});
