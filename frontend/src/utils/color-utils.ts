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

// ── Any CSS colour → sRGB ────────────────────────────────────────────────────

/** Gamma-encode a linear light component (sRGB / Display-P3 share this transfer curve). */
function gammaEncode(v: number): number {
    const a = Math.abs(v);
    const r = a > 0.0031308 ? 1.055 * Math.pow(a, 1 / 2.4) - 0.055 : 12.92 * a;
    return v < 0 ? -r : r;
}

/** Undo the gamma curve — the inverse of `gammaEncode`. */
function gammaDecode(v: number): number {
    const a = Math.abs(v);
    const r = a > 0.04045 ? Math.pow((a + 0.055) / 1.055, 2.4) : a / 12.92;
    return v < 0 ? -r : r;
}

/**
 * Display-P3 → sRGB, both gamma-encoded, components 0..1.
 *
 * P3 is the wider space, so saturated P3 colours land outside sRGB and come back with
 * components below 0 or above 1. Callers clamp: for a *display* of the colour that is the
 * right answer (it is what the monitor shows for an sRGB surface anyway), and it keeps the
 * hue, which is the whole point of syncing a picker to a swatch.
 */
export function p3ToSrgb(r: number, g: number, b: number): RGB {
    const lr = gammaDecode(r), lg = gammaDecode(g), lb = gammaDecode(b);
    // Combined linear-P3 → linear-sRGB matrix (colorjs.io / CSS Color 4).
    return {
        r: gammaEncode(1.2249401762805083 * lr - 0.2249401762805082 * lg),
        g: gammaEncode(-0.04205697751522136 * lr + 1.0420569775152216 * lg),
        b: gammaEncode(-0.019637554590334 * lr - 0.07863604555063188 * lg + 1.0982736001409656 * lb),
    };
}

/** A `color(display-p3 …)` component: a number, or a percentage. */
function p3Component(tok: string): number {
    return tok.endsWith('%') ? parseFloat(tok) / 100 : parseFloat(tok);
}

/**
 * Parse ANY colour string this app can store into sRGB 0..255, or null for
 * transparent/none/unrecognised.
 *
 * Documents hold more than hex: the P3 Wide-Gamut palette stores
 * `color(display-p3 r g b)`, the advanced picker emits `oklch(…)`, and imported SVG brings
 * `rgb()`, `hsl()` and CSS colour names. Anything that only understood `#rrggbb` therefore
 * saw those as "no colour" and silently did nothing — which is why picking a P3 swatch left
 * the colour picker's saturation square and hue slider showing the previous colour (user
 * feedback, Aug 2026).
 *
 * The named/`hsl()`/`lab()` tail is delegated to the browser through a canvas, so this does
 * not have to carry a colour-name table or every CSS Color 4 syntax. The two wide-gamut
 * forms are converted here instead, because a canvas is an sRGB surface and reading
 * `fillStyle` back does not serialise them to something parseable.
 */
export function cssColorToRgb255(input: string | undefined | null): [number, number, number] | null {
    if (!input) return null;
    const s = String(input).trim().toLowerCase();
    if (!s || s === 'transparent' || s === 'none' || s === 'currentcolor') return null;

    if (s[0] === '#') {
        let hex = s.slice(1);
        if (hex.length === 3 || hex.length === 4) hex = hex.slice(0, 3).split('').map(c => c + c).join('');
        if (hex.length === 8) hex = hex.slice(0, 6);
        if (!/^[0-9a-f]{6}$/.test(hex)) return null;
        return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
    }

    const to255 = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255);

    // color(display-p3 r g b [/ a]) — also accepts `srgb`, which needs no conversion.
    const p3 = s.match(/^color\(\s*(display-p3|srgb)\s+([^/)]+?)\s*(?:\/[^)]*)?\)$/);
    if (p3) {
        const parts = p3[2].split(/[\s,]+/).filter(Boolean).map(p3Component);
        if (parts.length < 3 || parts.some(n => !isFinite(n))) return null;
        const [r, g, b] = parts;
        if (p3[1] === 'srgb') return [to255(r), to255(g), to255(b)];
        const c = p3ToSrgb(r, g, b);
        return [to255(c.r), to255(c.g), to255(c.b)];
    }

    // oklch(L C H [/ a]) — via P3, which is what `oklchToP3` already produces.
    const ok = s.match(/^oklch\(\s*([^/)]+?)\s*(?:\/[^)]*)?\)$/);
    if (ok) {
        const parts = ok[1].split(/[\s,]+/).filter(Boolean);
        if (parts.length < 3) return null;
        const l = parts[0].endsWith('%') ? parseFloat(parts[0]) / 100 : parseFloat(parts[0]);
        const chroma = parseFloat(parts[1]);
        const hue = parseFloat(parts[2]);
        if (![l, chroma, hue].every(isFinite)) return null;
        const c = p3ToSrgb(...(({ r, g, b }) => [r, g, b] as [number, number, number])(oklchToP3({ l, c: chroma, h: hue })));
        return [to255(c.r), to255(c.g), to255(c.b)];
    }

    // Everything else — rgb()/rgba()/hsl()/named/lab() — is the browser's job.
    return canvasParse(s);
}

/**
 * Last resort: let a 2D context normalise the colour for us.
 *
 * Guarded and cached because it touches the DOM: this is called from a reactive effect that
 * runs on every colour change, and in a non-browser context (SSR/prerender, a unit test)
 * there is no canvas at all.
 */
const _canvasParseCache = new Map<string, [number, number, number] | null>();
let _parseCtx: CanvasRenderingContext2D | null | undefined;
function canvasParse(s: string): [number, number, number] | null {
    if (_canvasParseCache.has(s)) return _canvasParseCache.get(s)!;
    let out: [number, number, number] | null = null;
    try {
        if (_parseCtx === undefined) {
            const c = typeof document !== 'undefined' ? document.createElement('canvas') : null;
            _parseCtx = c ? c.getContext('2d', { willReadFrequently: true }) : null;
            if (_parseCtx) { _parseCtx.canvas.width = 1; _parseCtx.canvas.height = 1; }
        }
        if (_parseCtx) {
            // An unparseable value leaves fillStyle at its previous setting, so reset first:
            // otherwise "not a colour" silently reads back as whatever was parsed last.
            _parseCtx.fillStyle = '#000000';
            _parseCtx.fillStyle = s;
            if (_parseCtx.fillStyle !== '#000000' || s === '#000000' || s === 'black') {
                _parseCtx.clearRect(0, 0, 1, 1);
                _parseCtx.fillRect(0, 0, 1, 1);
                const d = _parseCtx.getImageData(0, 0, 1, 1).data;
                out = [d[0], d[1], d[2]];
            }
        }
    } catch { out = null; }
    if (_canvasParseCache.size < 512) _canvasParseCache.set(s, out);
    return out;
}

/** Any CSS colour → `#rrggbb`, or null when it names no colour. */
export function cssColorToHex(input: string | undefined | null): string | null {
    const rgb = cssColorToRgb255(input);
    if (!rgb) return null;
    return '#' + rgb.map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('');
}
