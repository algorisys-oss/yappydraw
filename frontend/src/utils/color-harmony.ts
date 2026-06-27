/**
 * Colour-harmony tooling — tints/shades, harmony palettes (Illustrator's Color
 * Guide) and palette extraction from an image ("colour theme picker"). Pure
 * functions over hex strings; the store wires them into the recolor workflow.
 */

import { hexToHsl, hslToHex, shiftHexHue } from './color-adjust';
import { parseHex, rgbToHex } from './mesh-gradient';

export type HarmonyType =
    | 'complementary' | 'analogous' | 'triadic'
    | 'split-complementary' | 'tetradic' | 'monochromatic';

/**
 * A light→dark ramp of tints (lighter) and shades (darker) around the base
 * colour, preserving hue & saturation. Returns 2*steps+1 colours with the base
 * in the middle.
 */
export function generateTints(hex: string, steps = 4): string[] {
    const { h, s, l } = hexToHsl(hex);
    const out: string[] = [];
    for (let i = steps; i >= 1; i--) out.push(hslToHex(h, s, l + (0.96 - l) * (i / (steps + 1))));
    out.push(hex);
    for (let i = 1; i <= steps; i++) out.push(hslToHex(h, s, l - (l - 0.06) * (i / (steps + 1))));
    return out;
}

/** Harmony palette around a base colour (Illustrator Color Guide rules). */
export function generateHarmony(hex: string, type: HarmonyType = 'complementary'): string[] {
    if (type === 'monochromatic') return generateTints(hex, 2);
    const offsets: Record<Exclude<HarmonyType, 'monochromatic'>, number[]> = {
        complementary: [0, 180],
        analogous: [-30, 0, 30],
        triadic: [0, 120, 240],
        'split-complementary': [0, 150, 210],
        tetradic: [0, 90, 180, 270],
    };
    return (offsets[type] ?? [0, 180]).map(d => shiftHexHue(hex, d));
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('image load failed'));
        img.src = src;
    });
}

/**
 * Extract up to `count` dominant colours from an image (URL or data URL) by
 * downscaling, quantising to a coarse RGB grid and ranking buckets by frequency.
 * Returns each bucket's average colour as hex, most-common first.
 */
export async function extractImagePalette(src: string, count = 6): Promise<string[]> {
    const img = await loadImage(src);
    const W = 64, H = Math.max(1, Math.round((img.height / img.width) * 64)) || 64;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, W, H);
    const data = ctx.getImageData(0, 0, W, H).data;

    const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
    for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 128) continue;                       // skip transparent
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);   // 16 levels/channel
        const acc = buckets.get(key);
        if (acc) { acc.r += r; acc.g += g; acc.b += b; acc.n++; }
        else buckets.set(key, { r, g, b, n: 1 });
    }
    return [...buckets.values()]
        .sort((x, y) => y.n - x.n)
        .slice(0, count)
        .map(b => rgbToHex(Math.round(b.r / b.n), Math.round(b.g / b.n), Math.round(b.b / b.n)));
}

/** Re-export the parser so callers can validate hex input. */
export { parseHex };
