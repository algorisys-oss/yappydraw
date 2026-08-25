/**
 * Inflate 3D — the maths that turns a silhouette into a lit surface.
 *
 * These are the parts with no canvas in them, which is deliberate: the height field and the
 * shading are where the effect is either right or wrong, and a screenshot is a poor way to
 * find out which. `rasterizeInflate` itself is a thin glue layer over these.
 */

import { describe, it, expect } from "bun:test";
import {
    distanceTransform, heightField, blurField, lightVector, shadeHeightField, hasInflate, DEFAULT_INFLATE,
} from "./inflate";
import type { DrawingElement } from "../types";

/** A filled rectangle of `iw` x `ih` centred in a `w` x `h` buffer. */
const boxMask = (w: number, h: number, iw: number, ih: number) => {
    const m = new Uint8Array(w * h);
    const x0 = Math.floor((w - iw) / 2), y0 = Math.floor((h - ih) / 2);
    for (let y = y0; y < y0 + ih; y++) for (let x = x0; x < x0 + iw; x++) m[(y * w) + x] = 1;
    return m;
};

const at = (f: Float32Array, w: number, x: number, y: number) => f[(y * w) + x];

describe("distanceTransform", () => {
    it("is zero outside the shape and grows toward the middle", () => {
        const w = 21, h = 21;
        const d = distanceTransform(boxMask(w, h, 11, 11), w, h);
        expect(at(d, w, 0, 0)).toBe(0);          // outside
        expect(at(d, w, 5, 10)).toBe(1);         // first pixel in
        expect(at(d, w, 10, 10)).toBe(6);        // centre: 6 steps from the edge
        expect(at(d, w, 10, 10)).toBeGreaterThan(at(d, w, 7, 10));
    });

    it("treats the buffer edge as outside, so a cropped shape still falls to zero", () => {
        // Every pixel set: without the border rule the whole field would read as "far from
        // any edge" and the shape would inflate as if it continued past the crop.
        const w = 15, h = 15;
        const all = new Uint8Array(w * h).fill(1);
        const d = distanceTransform(all, w, h);
        expect(at(d, w, 0, 7)).toBe(1);
        expect(at(d, w, 7, 7)).toBeCloseTo(8, 5);
    });

    it("measures diagonals as roughly euclidean, not as a staircase", () => {
        const w = 41, h = 41;
        const d = distanceTransform(boxMask(w, h, 31, 31), w, h);
        // The centre of a 31-wide box is 16 from the edge either way. A chamfer is within a
        // few percent; a 4-neighbour (manhattan) transform would be far off on diagonals.
        expect(at(d, w, 20, 20)).toBeGreaterThan(15);
        expect(at(d, w, 20, 20)).toBeLessThan(17);
    });
});

describe("heightField", () => {
    const w = 31, h = 31;
    const dist = distanceTransform(boxMask(w, h, 21, 21), w, h);

    it("is flat at the rim and highest on the spine", () => {
        const f = heightField(dist, 1);
        expect(at(f, w, 0, 0)).toBe(0);
        expect(at(f, w, 15, 15)).toBeGreaterThan(at(f, w, 7, 15));
        expect(at(f, w, 7, 15)).toBeGreaterThan(at(f, w, 5, 15));
    });

    it("rises steeply at the edge — a dome, not a cone", () => {
        // The dome's tangent is vertical at the rim, which is what makes the edge read as
        // curving away. A linear ramp (a cone) would give equal steps all the way in.
        const f = heightField(dist, 1);
        const rimStep = at(f, w, 6, 15) - at(f, w, 5, 15);
        const midStep = at(f, w, 15, 15) - at(f, w, 14, 15);
        expect(rimStep).toBeGreaterThan(midStep * 3);
    });

    it("scales with bulge, and vanishes at zero", () => {
        const a = heightField(dist, 0.5), b = heightField(dist, 1);
        expect(at(b, w, 15, 15)).toBeCloseTo(at(a, w, 15, 15) * 2, 4);
        expect(Math.max(...heightField(dist, 0))).toBe(0);
    });

    it("survives an empty mask without dividing by zero", () => {
        const f = heightField(new Float32Array(9), 1);
        expect([...f].every(v => v === 0)).toBe(true);
    });
});

describe("blurField", () => {
    const w = 25, h = 25;

    it("flattens a spike without moving its mass off-centre", () => {
        const src = new Float32Array(w * h);
        src[(12 * w) + 12] = 100;
        const out = blurField(src, w, h, 2, 3);
        expect(at(out, w, 12, 12)).toBeLessThan(100);
        expect(at(out, w, 12, 12)).toBeGreaterThan(0);
        expect(at(out, w, 10, 12)).toBeGreaterThan(0);           // spread
        expect(at(out, w, 11, 12)).toBeCloseTo(at(out, w, 13, 12), 4); // symmetric
        const sum = (f: Float32Array) => [...f].reduce((a, b) => a + b, 0);
        expect(sum(out)).toBeCloseTo(sum(src), 0);               // conserved
    });

    it("does not alias its own output between passes", () => {
        // The passes ping-pong through two buffers; sharing one silently squares the blur.
        const src = new Float32Array(w * h);
        src[(12 * w) + 12] = 100;
        const one = blurField(src, w, h, 2, 1);
        const three = blurField(src, w, h, 2, 3);
        expect(at(three, w, 12, 12)).toBeLessThan(at(one, w, 12, 12));
        expect(at(three, w, 12, 12)).toBeGreaterThan(0);
    });

    it("returns the input untouched at radius zero", () => {
        const src = new Float32Array([1, 2, 3, 4]);
        expect(blurField(src, 2, 2, 0)).toBe(src);
    });
});

describe("lightVector", () => {
    it("points from the requested direction, in a y-down frame", () => {
        const right = lightVector(0, 0);
        expect(right[0]).toBeCloseTo(1, 5);
        expect(right[2]).toBeCloseTo(0, 5);
        // 90° is "from above" on the page, which is NEGATIVE y on a canvas.
        const above = lightVector(90, 0);
        expect(above[1]).toBeCloseTo(-1, 5);
    });

    it("is a unit vector, and points straight out at 90° height", () => {
        for (const [a, e] of [[0, 0], [135, 50], [270, 89]]) {
            const v = lightVector(a, e);
            expect(Math.hypot(v[0], v[1], v[2])).toBeCloseTo(1, 5);
        }
        const top = lightVector(135, 90);
        expect(top[2]).toBeCloseTo(1, 5);
    });

    it("clamps height into the hemisphere above the page", () => {
        expect(lightVector(0, -30)[2]).toBeCloseTo(0, 5);
        expect(lightVector(0, 200)[2]).toBeCloseTo(1, 5);
    });
});

describe("shadeHeightField", () => {
    const w = 41, h = 41;
    const mask = boxMask(w, h, 31, 31);
    const alpha = new Uint8Array(w * h);
    for (let i = 0; i < mask.length; i++) alpha[i] = mask[i] ? 255 : 0;
    const height = blurField(heightField(distanceTransform(mask, w, h), 1), w, h, 2);
    const albedo = (_i: number, out: [number, number, number]) => { out[0] = 200; out[1] = 200; out[2] = 200; };
    const shade = (angle: number) => shadeHeightField(height, alpha, w, h, {
        light: lightVector(angle, 45), intensity: 0.75, ambient: 0.3, roughness: 0.4,
        highlight: [255, 255, 255],
    }, albedo);
    const lum = (px: Uint8ClampedArray, x: number, y: number) => px[(((y * w) + x) * 4)];

    it("leaves everything outside the shape fully transparent", () => {
        const px = shade(135);
        expect(px[3]).toBe(0);
        expect(px[((20 * w) + 20) * 4 + 3]).toBe(255);
    });

    it("lights the side the light is on and shades the far side", () => {
        // 180° = from the left, so the left flank is lit and the right falls away.
        const px = shade(180);
        expect(lum(px, 8, 20)).toBeGreaterThan(lum(px, 32, 20));
    });

    it("moves the bright side when the light moves", () => {
        const fromLeft = shade(180), fromRight = shade(0);
        expect(lum(fromLeft, 8, 20)).toBeGreaterThan(lum(fromRight, 8, 20));
        expect(lum(fromRight, 32, 20)).toBeGreaterThan(lum(fromLeft, 32, 20));
    });

    it("never lets the unlit side fall below the ambient floor", () => {
        // Ambient is the whole reason a shadowed face still reads as its own colour rather
        // than as a hole. 200 albedo x 0.3 ambient = 60, minus rounding.
        const px = shade(180);
        for (let y = 6; y < 35; y++) for (let x = 6; x < 35; x++) {
            if (!mask[(y * w) + x]) continue;
            expect(lum(px, x, y)).toBeGreaterThanOrEqual(59);
        }
    });

    it("gives a glossy surface a brighter peak than a matte one", () => {
        const params = { light: lightVector(135, 45), intensity: 0.75, ambient: 0.3, highlight: [255, 255, 255] as [number, number, number] };
        const glossy = shadeHeightField(height, alpha, w, h, { ...params, roughness: 0.05 }, albedo);
        const matte = shadeHeightField(height, alpha, w, h, { ...params, roughness: 1 }, albedo);
        const peak = (px: Uint8ClampedArray) => { let m = 0; for (let i = 0; i < w * h; i++) if (px[i * 4 + 3] && px[i * 4] > m) m = px[i * 4]; return m; };
        expect(peak(glossy)).toBeGreaterThan(peak(matte));
    });

    it("cannot brighten past the albedo by diffuse light alone", () => {
        // The diffuse term multiplies, and a multiply cannot exceed its own colour — which is
        // exactly why the specular exists as a separate additive term. A blown-out intensity
        // must not silently clip the whole surface to white.
        const px = shadeHeightField(height, alpha, w, h, {
            light: lightVector(135, 90), intensity: 1, ambient: 1, roughness: 1, highlight: [255, 255, 255],
        }, albedo);
        for (let i = 0; i < w * h; i++) if (px[i * 4 + 3]) expect(px[i * 4]).toBeLessThanOrEqual(200);
    });
});

describe("hasInflate", () => {
    const el = (inflate?: any) => ({ id: 'e1', type: 'rectangle', inflate }) as unknown as DrawingElement;

    it("is off without the effect, and off at zero bulge", () => {
        expect(hasInflate(el(undefined))).toBe(false);
        expect(hasInflate(el({ ...DEFAULT_INFLATE, bulge: 0 }))).toBe(false);
    });

    it("is on for any positive bulge, so the slider is the on/off switch", () => {
        expect(hasInflate(el(DEFAULT_INFLATE))).toBe(true);
        expect(hasInflate(el({ ...DEFAULT_INFLATE, bulge: 0.01 }))).toBe(true);
    });
});
