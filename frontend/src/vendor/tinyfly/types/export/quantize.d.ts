/**
 * Colour quantization for palette-based formats (GIF).
 *
 * Reduces a truecolour image to an N-entry palette using median cut, then maps
 * every pixel to a palette index — optionally with Floyd-Steinberg dithering.
 *
 * Pure functions over plain typed arrays: no DOM, no canvas, no globals. The
 * same input always produces the same palette, so exports stay deterministic.
 */
export interface Palette {
    /** Flat RGB triples, `size * 3` bytes long. */
    rgb: Uint8Array;
    /** Number of colours actually produced (may be fewer than requested). */
    size: number;
}
/**
 * Build a palette of at most `maxColors` entries from RGBA pixel data.
 * Fully transparent pixels are ignored — they get their own reserved index.
 */
export declare function buildPalette(data: Uint8ClampedArray | Uint8Array, maxColors: number): Palette;
/**
 * Nearest-palette-colour lookup with a bounded cache.
 *
 * A linear scan over 256 colours per pixel is too slow for full-frame images, so
 * results are memoised per 5-bit RGB bucket — at most 32768 scans per frame.
 */
export declare class PaletteMatcher {
    private cache;
    private palette;
    /** Palette index `n` is written as `n + offset` (GIF reserves index 0). */
    private offset;
    constructor(palette: Palette, offset?: number);
    /** Index of the closest palette entry to the given colour. */
    nearest(r: number, g: number, b: number): number;
    /** The colour actually stored at a palette index produced by `nearest`. */
    colorAt(index: number): [number, number, number];
}
export interface QuantizeOptions {
    /** Spread quantization error into neighbouring pixels (default true). */
    dither?: boolean;
    /** Index reserved for fully transparent pixels; palette starts at `+1`. */
    transparentIndex?: number;
}
export interface QuantizedImage {
    /** One palette index per pixel. */
    indices: Uint8Array;
    /** Whether any pixel used the transparent index. */
    hasTransparency: boolean;
}
/**
 * Map every pixel of an RGBA image onto `palette`, writing one index per pixel.
 *
 * With dithering on, this runs Floyd-Steinberg error diffusion over a scratch
 * copy of the image so the input is left untouched.
 */
export declare function quantizeImage(data: Uint8ClampedArray | Uint8Array, width: number, height: number, palette: Palette, options?: QuantizeOptions): QuantizedImage;
