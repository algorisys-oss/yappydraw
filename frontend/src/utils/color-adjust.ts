/**
 * Colour adjustment helpers for Recolor Artwork — hex ⇄ HSL plus hue/lightness
 * shifts that preserve a colour's other channels.
 */

import { parseHex, rgbToHex } from './mesh-gradient';

/** True for an editable solid colour (skip 'transparent'/'none'/empty). */
export const isSolidColor = (c?: string): c is string =>
    !!c && c !== 'transparent' && c !== 'none';

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
    const { r, g, b } = parseHex(hex);
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
        else if (max === gn) h = (bn - rn) / d + 2;
        else h = (rn - gn) / d + 4;
        h /= 6;
    }
    return { h: h * 360, s, l };
}

export function hslToHex(h: number, s: number, l: number): string {
    h = ((h % 360) + 360) % 360 / 360;
    s = Math.max(0, Math.min(1, s));
    l = Math.max(0, Math.min(1, l));
    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    let r: number, g: number, b: number;
    if (s === 0) { r = g = b = l; }
    else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
    }
    return rgbToHex(r * 255, g * 255, b * 255);
}

/** Shift a colour's hue by `deg` (keeps saturation + lightness). */
export function shiftHexHue(hex: string, deg: number): string {
    if (!isSolidColor(hex) || !/^#?[0-9a-fA-F]{3,8}$/.test(hex)) return hex;
    const { h, s, l } = hexToHsl(hex);
    return hslToHex(h + deg, s, l);
}

/** Add `delta` (−1..1) to a colour's lightness. */
export function adjustHexLightness(hex: string, delta: number): string {
    if (!isSolidColor(hex) || !/^#?[0-9a-fA-F]{3,8}$/.test(hex)) return hex;
    const { h, s, l } = hexToHsl(hex);
    return hslToHex(h, s, l + delta);
}

/** Multiply a colour's saturation by `factor`. */
export function adjustHexSaturation(hex: string, factor: number): string {
    if (!isSolidColor(hex) || !/^#?[0-9a-fA-F]{3,8}$/.test(hex)) return hex;
    const { h, s, l } = hexToHsl(hex);
    return hslToHex(h, s * factor, l);
}
