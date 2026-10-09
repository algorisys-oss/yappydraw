/**
 * ICC colour management for print: sRGB ⇄ CMYK through a press profile (FOGRA39 / GRACoL),
 * using LittleCMS compiled to WASM (`lcms-wasm`).
 *
 * Everything here is lazy — the engine (~360 kB) and a profile (~120 kB) are fetched the first
 * time something asks for CMYK, never on the boot path. `createColorEngine` is the synchronous
 * core over an already-instantiated lcms and profile bytes, which is what the unit test drives
 * under bun; `loadColorEngine` is the browser loader.
 *
 * Conventions (the print defaults Affinity/InDesign ship with):
 *   • relative colorimetric intent + black-point compensation;
 *   • CMYK values are ink percentages 0–100, LittleCMS's native float range for CMYK;
 *   • pure #000000 maps to K-only 0/0/0/100, not the profile's rich black (79/70/53/98 under
 *     FOGRA39). Small black text in four inks blurs on any misregistration, and "black" in a
 *     design app means black ink. Every other colour, near-blacks included, goes through the
 *     profile.
 */

export type PrintProfileId = 'fogra39' | 'gracol';

export interface PrintProfileInfo {
    id: PrintProfileId;
    /** File under `public/icc/` (see the README there for provenance and licence). */
    file: string;
    label: string;
    /** PDF/X OutputIntent: the registered characterisation (ICC registry, http://www.color.org). */
    outputConditionIdentifier: string;
    outputCondition: string;
}

export const PRINT_PROFILES: Record<PrintProfileId, PrintProfileInfo> = {
    fogra39: {
        id: 'fogra39',
        file: 'fogra39-coated.icc',
        label: 'FOGRA39 — coated paper (Europe, ISO Coated v2)',
        outputConditionIdentifier: 'FOGRA39',
        outputCondition: 'Offset commercial and specialty printing according to ISO 12647-2:2004 / Amd 1, paper type 1 or 2 (gloss or matte coated offset), 115 g/m2, screen ruling 60/cm',
    },
    gracol: {
        id: 'gracol',
        file: 'gracol-tr006-coated.icc',
        label: 'GRACoL — coated paper (US, CGATS TR 006)',
        outputConditionIdentifier: 'CGATS TR 006',
        outputCondition: 'Commercial offset lithography on grade 1 paper (GRACoL), CGATS TR 006',
    },
};

export const DEFAULT_PRINT_PROFILE: PrintProfileId = 'fogra39';

/** Ink percentages, 0–100 each. */
export type Cmyk = [number, number, number, number];
/** sRGB, 0–255 each. */
export type Rgb = [number, number, number];

export interface ColorEngine {
    profile: PrintProfileInfo;
    /** The raw ICC profile — embedded as the PDF/X DestOutputProfile. */
    profileBytes: Uint8Array;
    rgbToCmyk(rgb: Rgb): Cmyk;
    cmykToRgb(cmyk: Cmyk): Rgb;
    /** How an sRGB colour will look once printed: sRGB → CMYK → sRGB (soft proof). */
    proof(rgb: Rgb): Rgb;
    /**
     * Convert RGBA pixels (canvas `ImageData.data`) to 8-bit DeviceCMYK, 4 bytes per pixel with
     * 255 = 100 % ink, plus the alpha channel separately (null when fully opaque).
     */
    imageToCmyk(rgba: Uint8ClampedArray | Uint8Array): { cmyk: Uint8Array; alpha: Uint8Array | null };
    /**
     * A soft-proof lookup table: `n`³ sRGB lattice points (R fastest, then G, then B), each
     * mapped sRGB → CMYK → sRGB, 3 bytes per point — what the print preview samples on the GPU.
     * Pure black follows the export's K-only rule, so the preview shows black ink, not rich black.
     */
    proofLut(n: number): Uint8Array;
}

/** The subset of the lcms-wasm module this file uses. */
type Lcms = any;

const round1 = (v: number) => Math.round(v * 10) / 10;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Build an engine over an instantiated lcms module (`lcms-wasm` `instantiate()`) and its constants. */
export function createColorEngine(lcms: Lcms, L: Record<string, any>, profile: PrintProfileInfo, profileBytes: Uint8Array): ColorEngine {
    const cmykProfile = lcms.cmsOpenProfileFromMem(profileBytes, profileBytes.byteLength);
    if (!cmykProfile) throw new Error(`Could not open ICC profile ${profile.file}`);
    if (lcms.cmsGetColorSpaceASCII(cmykProfile) !== 'CMYK') throw new Error(`${profile.file} is not a CMYK profile`);
    const srgb = lcms.cmsCreate_sRGBProfile();

    // lcms-wasm exports no float formats, so compose them: 4-byte float samples.
    const RGB_FLT = L.FLOAT_SH(1) | L.COLORSPACE_SH(L.PT_RGB) | L.CHANNELS_SH(3) | L.BYTES_SH(4);
    const CMYK_FLT = L.FLOAT_SH(1) | L.COLORSPACE_SH(L.PT_CMYK) | L.CHANNELS_SH(4) | L.BYTES_SH(4);
    const intent = L.INTENT_RELATIVE_COLORIMETRIC;
    const flags = L.cmsFLAGS_BLACKPOINTCOMPENSATION;
    const toCmyk = lcms.cmsCreateTransform(srgb, RGB_FLT, cmykProfile, CMYK_FLT, intent, flags);
    const toRgb = lcms.cmsCreateTransform(cmykProfile, CMYK_FLT, srgb, RGB_FLT, intent, flags);
    // 8-bit for images. Plain RGB in, not RGBA: the wrapper sizes its output buffer from the
    // INPUT format's extra channels, so an RGBA input would hand back a misaligned array.
    const toCmyk8 = lcms.cmsCreateTransform(srgb, L.TYPE_RGB_8, cmykProfile, L.TYPE_CMYK_8, intent, flags);
    const toRgb8 = lcms.cmsCreateTransform(cmykProfile, L.TYPE_CMYK_8, srgb, L.TYPE_RGB_8, intent, flags);
    if (!toCmyk || !toRgb || !toCmyk8 || !toRgb8) throw new Error('Could not create the colour transforms');

    const cmykCache = new Map<number, Cmyk>();

    const rgbToCmyk = (rgb: Rgb): Cmyk => {
        const [r, g, b] = rgb.map(v => clamp(Math.round(v), 0, 255));
        if (r === 0 && g === 0 && b === 0) return [0, 0, 0, 100];
        const key = (r << 16) | (g << 8) | b;
        const hit = cmykCache.get(key);
        if (hit) return [...hit] as Cmyk;
        const out = lcms.cmsDoTransform(toCmyk, new Float32Array([r / 255, g / 255, b / 255]), 1) as Float32Array;
        const cmyk = [0, 1, 2, 3].map(i => clamp(round1(out[i]), 0, 100)) as Cmyk;
        cmykCache.set(key, cmyk);
        return [...cmyk] as Cmyk;
    };

    const cmykToRgb = (cmyk: Cmyk): Rgb => {
        const out = lcms.cmsDoTransform(toRgb, new Float32Array(cmyk.map(v => clamp(v, 0, 100))), 1) as Float32Array;
        return [0, 1, 2].map(i => clamp(Math.round(out[i] * 255), 0, 255)) as Rgb;
    };

    const imageToCmyk = (rgba: Uint8ClampedArray | Uint8Array) => {
        const n = rgba.length >> 2;
        const rgb = new Uint8Array(n * 3);
        let opaque = true;
        const alpha = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
            rgb[i * 3] = rgba[i * 4];
            rgb[i * 3 + 1] = rgba[i * 4 + 1];
            rgb[i * 3 + 2] = rgba[i * 4 + 2];
            const a = rgba[i * 4 + 3];
            alpha[i] = a;
            if (a !== 255) opaque = false;
        }
        const out = lcms.cmsDoTransform(toCmyk8, rgb, n) as Uint8Array;
        return { cmyk: out.subarray(0, n * 4), alpha: opaque ? null : alpha };
    };

    return {
        profile,
        profileBytes,
        rgbToCmyk,
        cmykToRgb,
        proof: (rgb) => cmykToRgb(rgbToCmyk(rgb)),
        imageToCmyk,
        proofLut: (n) => {
            if (!(n >= 2 && n <= 65)) throw new Error('proofLut: n must be 2–65');
            const rgb = new Uint8Array(n * n * n * 3);
            let i = 0;
            for (let b = 0; b < n; b++) for (let g = 0; g < n; g++) for (let r = 0; r < n; r++) {
                rgb[i++] = Math.round(r * 255 / (n - 1));
                rgb[i++] = Math.round(g * 255 / (n - 1));
                rgb[i++] = Math.round(b * 255 / (n - 1));
            }
            const cmyk = (lcms.cmsDoTransform(toCmyk8, rgb, n * n * n) as Uint8Array).slice(0, n * n * n * 4);
            cmyk.set([0, 0, 0, 255], 0); // lattice point (0,0,0): K-only, as the export writes it
            return (lcms.cmsDoTransform(toRgb8, cmyk, n * n * n) as Uint8Array).slice(0, n * n * n * 3);
        },
    };
}

/** `#rgb` / `#rrggbb` / `rgb()` / `rgba()` → sRGB 0–255, or null for anything else. */
export function parseRgb(color: string): Rgb | null {
    const c = color.trim().toLowerCase();
    let m = c.match(/^#([0-9a-f]{3})$/);
    if (m) return [...m[1]].map(h => parseInt(h + h, 16)) as Rgb;
    m = c.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/);
    if (m) return [0, 2, 4].map(i => parseInt(m![1].slice(i, i + 2), 16)) as Rgb;
    m = c.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
    if (m) return [m[1], m[2], m[3]].map(v => clamp(Math.round(parseFloat(v)), 0, 255)) as Rgb;
    return null;
}

export const rgbToHex = (rgb: Rgb): string => '#' + rgb.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');

// ── Browser loader ────────────────────────────────────────────────────────────────

const engines = new Map<PrintProfileId, Promise<ColorEngine>>();
let lcmsPromise: Promise<{ lcms: Lcms; L: Record<string, any> }> | null = null;

const loadLcms = () => {
    if (!lcmsPromise) {
        lcmsPromise = (async () => {
            const [L, wasm] = await Promise.all([
                import('lcms-wasm'),
                import('lcms-wasm/dist/lcms.wasm?url'),
            ]);
            const lcms = await (L as any).instantiate({ locateFile: () => (wasm as any).default });
            return { lcms, L: L as Record<string, any> };
        })();
        lcmsPromise.catch(() => { lcmsPromise = null; }); // let a later call retry
    }
    return lcmsPromise;
};

/** The engine for a press profile, loading LittleCMS and the profile on first use. */
export function loadColorEngine(id: PrintProfileId = DEFAULT_PRINT_PROFILE): Promise<ColorEngine> {
    let p = engines.get(id);
    if (!p) {
        const profile = PRINT_PROFILES[id];
        p = (async () => {
            const base = (import.meta as any).env?.BASE_URL ?? '/';
            const [{ lcms, L }, bytes] = await Promise.all([
                loadLcms(),
                fetch(`${base}icc/${profile.file}`).then(r => {
                    if (!r.ok) throw new Error(`Profile fetch failed: ${profile.file} (${r.status})`);
                    return r.arrayBuffer();
                }),
            ]);
            return createColorEngine(lcms, L, profile, new Uint8Array(bytes));
        })();
        engines.set(id, p);
        p.catch(() => engines.delete(id));
    }
    return p;
}
