import type { Timeline } from '../core/timeline';
import type { AnimatableValue } from '../types';
/**
 * Animated GIF export.
 *
 * Frames are quantized to a 255-colour local palette (index 0 is reserved for
 * transparency), LZW-compressed, and written as a GIF89a stream. Encoding is
 * pure byte manipulation — the only DOM dependency is the canvas used to
 * rasterise frames, so `GIFEncoder` itself runs anywhere, including Workers.
 */
/**
 * GIF export options
 */
export interface GIFExportOptions {
    /** Canvas width */
    width: number;
    /** Canvas height */
    height: number;
    /** Frame rate (default: 30) */
    frameRate?: number;
    /** Background color (default: transparent) */
    backgroundColor?: string;
    /** Number of loops (0 = infinite, default: 0) */
    loops?: number;
    /** Diffuse quantization error into neighbouring pixels (default: true) */
    dither?: boolean;
    /** Palette size per frame, 2-255 (default: 255) */
    maxColors?: number;
    /** Custom render function for each frame */
    renderFrame?: (ctx: CanvasRenderingContext2D, values: Map<string, Map<string, AnimatableValue>>, time: number) => void | Promise<void>;
    /** Progress callback, 0..1 */
    onProgress?: (fraction: number) => void;
    /** Abort the export early */
    signal?: AbortSignal;
}
/**
 * GIF frame data
 */
export interface GIFFrame {
    /** Frame time in milliseconds */
    time: number;
    /** Frame image data */
    imageData: ImageData;
    /** Frame delay in centiseconds (1/100th of a second) */
    delay: number;
}
/**
 * GIF export result
 */
export interface GIFExportResult {
    /** Array of frames ready for encoding */
    frames: GIFFrame[];
    /** Total duration in milliseconds */
    duration: number;
    /** Number of frames */
    frameCount: number;
}
/** Minimal image shape the encoder needs — matches `ImageData`. */
interface RGBAImage {
    data: Uint8ClampedArray | Uint8Array;
    width: number;
    height: number;
}
/**
 * LZW-compress palette indices into GIF image data (sub-block framing included,
 * minus the leading minimum-code-size byte).
 *
 * Codes are written LSB-first and the dictionary is reset with a clear code
 * whenever it fills, as the GIF89a spec requires.
 */
export declare function lzwEncode(indices: Uint8Array, minCodeSize: number): Uint8Array;
export interface GIFEncoderOptions {
    /** Number of loops (0 = infinite, default: 0) */
    loops?: number;
    /** Diffuse quantization error into neighbouring pixels (default: true) */
    dither?: boolean;
    /** Palette size per frame, 2-255 (default: 255) */
    maxColors?: number;
}
/**
 * Animated GIF encoder.
 *
 * Each frame is quantized and compressed as it is added, so only compressed
 * bytes are retained — memory stays proportional to output size rather than to
 * frame count times canvas area.
 */
export declare class GIFEncoder {
    private readonly width;
    private readonly height;
    private readonly loops;
    private readonly dither;
    private readonly maxColors;
    /** Fully-encoded blocks (GCE + descriptor + palette + data) per frame. */
    private frames;
    constructor(width: number, height: number, loopsOrOptions?: number | GIFEncoderOptions);
    /** Number of frames added so far. */
    get frameCount(): number;
    /**
     * Quantize and compress one frame.
     *
     * @param delay Frame delay in centiseconds (1/100s), as GIF stores it.
     */
    addFrame(imageData: RGBAImage, delay: number): void;
    /** Assemble the full GIF byte stream. */
    encodeToBytes(): Uint8Array;
    /** Encode and return the GIF as a Blob. */
    encode(): Blob;
}
/**
 * @deprecated Use {@link GIFEncoder}. Kept as an alias for existing callers.
 */
export declare const SimpleGIFEncoder: typeof GIFEncoder;
/**
 * Extract animation frames from a timeline as raw `ImageData`.
 *
 * Useful when you want to post-process frames yourself; {@link exportToGIF}
 * uses the same rasterisation path and encodes in one step.
 *
 * Note: requires a DOM environment (canvas element).
 */
export declare function extractFrames(timeline: Timeline, options: GIFExportOptions): GIFExportResult;
/**
 * Render a timeline to an animated GIF blob.
 *
 * The `renderFrame` callback draws the animation state onto an already-cleared
 * (and optionally background-filled) canvas; it may be async, which lets callers
 * seek video layers before each frame.
 */
export declare function exportToGIF(timeline: Timeline, options: GIFExportOptions): Promise<Blob>;
/**
 * Download a GIF blob as a file
 */
export declare function downloadGIF(blob: Blob, filename?: string): void;
export {};
