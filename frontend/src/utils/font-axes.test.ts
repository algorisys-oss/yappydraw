import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { deflateSync } from "zlib";
import { readFontWeightRange, readFontDefaultWeight, nameSaysVariableWeight, stripVariableMarkers, detectWeightRange } from "./font-axes";
import { groupFontFamilies } from "./font-variants";

const fontsDir = join(import.meta.dir, "../../public/fonts/outline");
const load = (f: string) => { const b = readFileSync(join(fontsDir, f)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer; };

/** Wrap a TTF as WOFF 1.0 with zlib-compressed tables — enough of the format for the reader. */
function ttfToWoff(ttf: ArrayBuffer): ArrayBuffer {
    const v = new DataView(ttf);
    const n = v.getUint16(4);
    const tables = Array.from({ length: n }, (_, i) => {
        const r = 12 + i * 16;
        const data = new Uint8Array(ttf, v.getUint32(r + 8), v.getUint32(r + 12));
        const comp = deflateSync(data);
        return { tag: new Uint8Array(ttf, r, 4), data: comp.length < data.length ? comp : data, origLength: data.length, checksum: v.getUint32(r + 4) };
    });
    let offset = 44 + n * 20;
    const size = tables.reduce((s, t) => s + t.data.length + 3 & ~3, offset);
    const out = new Uint8Array(size + 4 * n);
    const o = new DataView(out.buffer);
    out.set([0x77, 0x4f, 0x46, 0x46], 0);
    o.setUint32(4, v.getUint32(0)); o.setUint32(8, out.length); o.setUint16(12, n);
    tables.forEach((t, i) => {
        const e = 44 + i * 20;
        out.set(t.tag, e);
        o.setUint32(e + 4, offset); o.setUint32(e + 8, t.data.length); o.setUint32(e + 12, t.origLength); o.setUint32(e + 16, t.checksum);
        out.set(t.data, offset);
        offset = (offset + t.data.length + 3) & ~3;
    });
    return out.buffer;
}

describe("readFontWeightRange", () => {
    it("reads the wght axis of a variable TTF (Inter italic ships variable)", async () => {
        expect(await readFontWeightRange(load("sans-serif-italic-400.ttf"))).toEqual([100, 900]);
    });
    it("returns null for static fonts (TTF and WOFF)", async () => {
        expect(await readFontWeightRange(load("sans-serif-400.ttf"))).toBeNull();
        expect(await readFontWeightRange(load("poppins-italic-400.woff"))).toBeNull();
    });
    it("reads the axis out of a compressed WOFF", async () => {
        expect(await readFontWeightRange(ttfToWoff(load("sans-serif-italic-400.ttf")))).toEqual([100, 900]);
    });
    it("survives junk and truncated files", async () => {
        expect(await readFontWeightRange(new ArrayBuffer(3))).toBeNull();
        expect(await readFontWeightRange(new Uint8Array([0x77, 0x4f, 0x46, 0x32, 1, 2, 3, 4, 5, 6, 7, 8]).buffer)).toBeNull();
        expect(await readFontWeightRange(load("sans-serif-italic-400.ttf").slice(0, 400))).toBeNull();
    });
});

describe("variable font names", () => {
    it("recognises Google's and the bracket naming, weight axis only", () => {
        expect(nameSaysVariableWeight("Roboto-VariableFont_wght")).toBe(true);
        expect(nameSaysVariableWeight("Roboto-Italic-VariableFont_wdth,wght")).toBe(true);
        expect(nameSaysVariableWeight("Inter[slnt,wght]")).toBe(true);
        expect(nameSaysVariableWeight("Anybody-VariableFont_wdth")).toBe(false);
        expect(nameSaysVariableWeight("Montserrat-Bold")).toBe(false);
    });
    it("strips the markers so the family groups", () => {
        expect(stripVariableMarkers("Roboto-VariableFont_wght")).toBe("Roboto");
        expect(stripVariableMarkers("Roboto-Italic-VariableFont_wdth,wght")).toBe("Roboto-Italic");
        expect(stripVariableMarkers("Inter[slnt,wght]")).toBe("Inter");
        expect(stripVariableMarkers("Montserrat-Bold")).toBe("Montserrat-Bold");
    });
    it("falls back to the name when the bytes can't be read (WOFF2)", async () => {
        expect(await detectWeightRange(null, "Roboto-VariableFont_wght")).toEqual([100, 900]);
        expect(await detectWeightRange(null, "Roboto-Bold")).toBeNull();
    });
});

describe("groupFontFamilies with variable files", () => {
    it("one variable file offers every named weight in its range", () => {
        const [g] = groupFontFamilies([{ value: "custom-1", label: "Roboto", weightRange: [100, 900] }], new Map());
        expect(g.family).toBe("Roboto");
        expect(g.variants.map(v => v.styleLabel)).toEqual(["Thin", "ExtraLight", "Light", "Regular", "Medium", "SemiBold", "Bold", "ExtraBold", "Black"]);
        expect(new Set(g.variants.map(v => v.value))).toEqual(new Set(["custom-1"]));
        expect(g.defaultValue).toBe("custom-1");
    });
    it("upright and italic variable files join one family; a partial range stays inside it", () => {
        const [g] = groupFontFamilies([
            { value: "custom-1", label: "Roboto", weightRange: [300, 700] },
            { value: "custom-2", label: "Roboto-Italic", weightRange: [300, 700] },
        ], new Map());
        expect(g.variants.map(v => v.styleLabel)).toEqual([
            "Light", "Regular", "Medium", "SemiBold", "Bold",
            "Light Italic", "Italic", "Medium Italic", "SemiBold Italic", "Bold Italic",
        ]);
        expect(g.variants.find(v => v.styleLabel === "Bold Italic")!.value).toBe("custom-2");
    });
});

describe("readFontDefaultWeight", () => {
    it("reads the axis default (what a variation-blind parser draws)", async () => {
        expect(await readFontDefaultWeight(load("sans-serif-italic-400.ttf"))).toBe(400);
        expect(await readFontDefaultWeight(load("sans-serif-400.ttf"))).toBeNull();
    });
});
