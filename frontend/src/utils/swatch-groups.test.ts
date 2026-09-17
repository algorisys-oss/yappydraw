import { describe, it, expect } from "bun:test";
import { sectionSwatches, nextFreeGroupName } from "./swatch-groups";

const sw = (id: string, group?: string) => ({ id, name: id, color: "#000000", group });

describe("sectionSwatches", () => {
    it("keeps groups in order of first appearance and swatches in document order", () => {
        const r = sectionSwatches([sw("a", "Brand"), sw("b"), sw("c", "Warm"), sw("d", "Brand")]);
        expect(r.groups.map(g => [g.name, g.swatches.map(s => s.id)])).toEqual([["Brand", ["a", "d"]], ["Warm", ["c"]]]);
        expect(r.loose.map(s => s.id)).toEqual(["b"]);
    });
    it("handles no swatches", () => {
        expect(sectionSwatches([])).toEqual({ groups: [], loose: [] });
    });
});

describe("nextFreeGroupName", () => {
    it("skips names already in use", () => {
        const fmt = (n: number) => `Palette ${n}`;
        expect(nextFreeGroupName([], fmt)).toBe("Palette 1");
        expect(nextFreeGroupName([sw("a", "Palette 2")], fmt)).toBe("Palette 3");
        expect(nextFreeGroupName([sw("a", "Brand")], fmt)).toBe("Palette 2");
    });
});
