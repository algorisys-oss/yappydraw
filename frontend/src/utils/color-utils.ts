/**
 * OKLCH to Display P3 Color Conversion Utilities
 */

export interface OKLCH {
    l: number; // 0 to 1
    c: number; // 0 to 0.4+
    h: number; // 0 to 360
}

export interface RGB {
    r: number; // 0 to 1
    g: number; // 0 to 1
    b: number; // 0 to 1
}

/**
 * Converts OKLCH to Display P3 RGB.
 * Math based on https://bottosson.github.io/posts/oklab/
 */
export function oklchToP3(oklch: OKLCH): RGB {
    const { l, c, h } = oklch;
    const hRad = (h * Math.PI) / 180;

    const a = c * Math.cos(hRad);
    const b = c * Math.sin(hRad);

    // Oklab to LMS
    const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

    const l_3 = l_ * l_ * l_;
    const m_3 = m_ * m_ * m_;
    const s_3 = s_ * s_ * s_;

    // LMS to XYZ (D65)
    const x = 1.2270138511 * l_3 - 0.5577999807 * m_3 + 0.2812561489 * s_3;
    const y = -0.0405801784 * l_3 + 1.1122568696 * m_3 - 0.0716766787 * s_3;
    const z = -0.0763812845 * l_3 - 0.4214819787 * m_3 + 1.5861632204 * s_3;

    // XYZ to Linear Display-P3
    // Matrix from https://colorjs.io/docs/spaces/display-p3
    const rLin = 2.4039459 * x - 0.9898517 * y - 0.4141151 * z;
    const gLin = -0.7797967 * x + 1.5445214 * y + 0.0352745 * z;
    const bLin = 0.0384795 * x - 0.1141381 * y + 1.0756786 * z;

    // Linear to Gamma (Standard sRGB/P3 transfer function)
    const gamma = (v: number) => {
        const absV = Math.abs(v);
        const res = absV > 0.0031308
            ? 1.055 * Math.pow(absV, 1 / 2.4) - 0.055
            : 12.92 * absV;
        return v < 0 ? -res : res;
    };

    return {
        r: gamma(rLin),
        g: gamma(gLin),
        b: gamma(bLin)
    };
}

/**
 * Formats OKLCH as a CSS color string.
 */
export function formatOKLCH(oklch: OKLCH): string {
    return `oklch(${(oklch.l * 100).toFixed(2)}% ${oklch.c.toFixed(4)} ${oklch.h.toFixed(2)})`;
}

/**
 * Formats RGB as a Display P3 CSS color string.
 */
export function formatP3(rgb: RGB): string {
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    return `color(display-p3 ${clamp(rgb.r).toFixed(4)} ${clamp(rgb.g).toFixed(4)} ${clamp(rgb.b).toFixed(4)})`;
}

/**
 * Checks if a color is within the Display P3 gamut.
 */
export function isInP3Gamut(rgb: RGB): boolean {
    const eps = 0.001;
    return rgb.r >= -eps && rgb.r <= 1 + eps &&
        rgb.g >= -eps && rgb.g <= 1 + eps &&
        rgb.b >= -eps && rgb.b <= 1 + eps;
}
