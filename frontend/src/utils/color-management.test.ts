import { beforeAll, describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as L from 'lcms-wasm';
import { createColorEngine, parseRgb, rgbToHex, PRINT_PROFILES, type ColorEngine } from './color-management';

const root = join(import.meta.dir, '../../..');
let fogra: ColorEngine;
let gracol: ColorEngine;

beforeAll(async () => {
    const lcms = await (L as any).instantiate({ locateFile: () => join(root, 'node_modules/lcms-wasm/dist/lcms.wasm') });
    const bytes = (f: string) => new Uint8Array(readFileSync(join(root, 'frontend/public/icc', f)));
    fogra = createColorEngine(lcms, L as any, PRINT_PROFILES.fogra39, bytes(PRINT_PROFILES.fogra39.file));
    gracol = createColorEngine(lcms, L as any, PRINT_PROFILES.gracol, bytes(PRINT_PROFILES.gracol.file));
});

const dist = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]));

describe('ICC conversion (FOGRA39)', () => {
    test('paper white is no ink at all', () => {
        expect(fogra.rgbToCmyk([255, 255, 255])).toEqual([0, 0, 0, 0]);
    });

    test('pure black is K-only, not the profile’s rich black', () => {
        expect(fogra.rgbToCmyk([0, 0, 0])).toEqual([0, 0, 0, 100]);
        // One step off black goes through the profile: a four-ink rich black.
        const near = fogra.rgbToCmyk([1, 1, 1]);
        expect(near[0]).toBeGreaterThan(50);
        expect(near[3]).toBeGreaterThan(80);
    });

    test('primaries land on the expected inks', () => {
        const red = fogra.rgbToCmyk([255, 0, 0]);
        expect(red[0]).toBeLessThan(5);                       // no cyan
        expect(red[1]).toBeGreaterThan(90);                   // full magenta
        expect(red[2]).toBeGreaterThan(90);                   // full yellow
        const blue = fogra.rgbToCmyk([0, 0, 255]);
        expect(blue[0]).toBeGreaterThan(90);
        expect(blue[2]).toBeLessThan(5);                      // no yellow in blue
    });

    test('a neutral grey stays neutral on the way back', () => {
        const back = fogra.cmykToRgb(fogra.rgbToCmyk([128, 128, 128]));
        expect(Math.max(...back) - Math.min(...back)).toBeLessThanOrEqual(3);
        expect(dist(back, [128, 128, 128])).toBeLessThan(6);
    });

    test('in-gamut colours round-trip closely; saturated sRGB is pulled into the press gamut', () => {
        const skin: [number, number, number] = [205, 160, 130];
        expect(dist(fogra.proof(skin), skin)).toBeLessThan(6);
        // sRGB's pure green is far outside offset gamut — the proof must move it noticeably.
        expect(dist(fogra.proof([0, 255, 0]), [0, 255, 0])).toBeGreaterThan(40);
    });

    test('ink values are percentages in range, rounded to 0.1', () => {
        for (const rgb of [[12, 200, 77], [250, 10, 240], [90, 90, 200]] as const) {
            const c = fogra.rgbToCmyk([...rgb]);
            for (const v of c) {
                expect(v).toBeGreaterThanOrEqual(0);
                expect(v).toBeLessThanOrEqual(100);
                expect(Math.round(v * 10)).toBeCloseTo(v * 10, 6);
            }
        }
    });
});

describe('profiles differ, as they should', () => {
    test('the same blue separates differently for FOGRA39 and GRACoL', () => {
        expect(fogra.rgbToCmyk([30, 90, 200])).not.toEqual(gracol.rgbToCmyk([30, 90, 200]));
    });
});

describe('imageToCmyk', () => {
    test('8-bit CMYK, 4 bytes per pixel, matching the float path', () => {
        const px = new Uint8ClampedArray([255, 255, 255, 255, 255, 0, 0, 255]);
        const { cmyk, alpha } = fogra.imageToCmyk(px);
        expect(cmyk.length).toBe(8);
        expect([...cmyk.subarray(0, 4)]).toEqual([0, 0, 0, 0]);
        const red = fogra.rgbToCmyk([255, 0, 0]).map(v => v * 2.55);
        expect(dist([...cmyk.subarray(4, 8)], red)).toBeLessThan(4);
        expect(alpha).toBeNull();
    });

    test('keeps alpha separately when any pixel is not opaque', () => {
        const { alpha } = fogra.imageToCmyk(new Uint8ClampedArray([0, 0, 255, 128, 0, 0, 255, 255]));
        expect(alpha && [...alpha]).toEqual([128, 255]);
    });
});

describe('parseRgb / rgbToHex', () => {
    test('reads the colour forms the exporter emits', () => {
        expect(parseRgb('#fff')).toEqual([255, 255, 255]);
        expect(parseRgb('#1971C2')).toEqual([25, 113, 194]);
        expect(parseRgb('#1971c280')).toEqual([25, 113, 194]);
        expect(parseRgb('rgb(10, 20, 30)')).toEqual([10, 20, 30]);
        expect(parseRgb('rgba(10,20,30,0.5)')).toEqual([10, 20, 30]);
        expect(parseRgb('transparent')).toBeNull();
        expect(rgbToHex([25, 113, 194])).toBe('#1971c2');
    });
});

describe('proofLut', () => {
    test('n³ entries, white stays paper white, black shows K-only ink, and it agrees with proof()', () => {
        const n = 17;
        const lut = fogra.proofLut(n);
        expect(lut.length).toBe(n * n * n * 3);
        const at = (r: number, g: number, b: number) => {
            const i = ((b * n + g) * n + r) * 3;
            return [lut[i], lut[i + 1], lut[i + 2]];
        };
        expect(dist(at(n - 1, n - 1, n - 1), [255, 255, 255])).toBeLessThan(3);
        // K-only black on coated stock is a dark grey, not sRGB black.
        const k = at(0, 0, 0);
        expect(k[0]).toBeGreaterThan(20);
        expect(Math.max(...k) - Math.min(...k)).toBeLessThan(12);
        // A lattice point matches the float path to within two 8-bit quantisations (into CMYK
        // and back): measured 4.1 for pure red — invisible in a preview.
        expect(dist(at(n - 1, 0, 0), fogra.proof([255, 0, 0]))).toBeLessThan(6);
        expect(dist(at(0, n - 1, 0), fogra.proof([0, 255, 0]))).toBeLessThan(6);
    });
});
