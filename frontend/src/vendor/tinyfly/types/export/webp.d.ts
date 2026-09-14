import type { Timeline } from '../core/timeline';
import type { AnimatableValue } from '../types';
/** The image bitstream lifted out of a single-image WebP file. */
export interface WebPBitstream {
    /** `VP8 ` (lossy) or `VP8L` (lossless) chunk, including its 8-byte header. */
    image: Uint8Array;
    /** `ALPH` chunk including its header, when the still carried separate alpha. */
    alpha: Uint8Array | null;
    width: number;
    height: number;
    hasAlpha: boolean;
}
/**
 * Pull the coded image (and optional alpha) out of a single-image WebP file.
 *
 * Browsers emit either a bare `VP8 `/`VP8L` chunk or, when the canvas has
 * transparency, an extended `VP8X` + `ALPH` + `VP8 ` layout. Both are handled.
 */
export declare function parseWebPBitstream(bytes: Uint8Array): WebPBitstream;
export interface WebPEncoderOptions {
    /** Number of loops (0 = infinite, default: 0) */
    loops?: number;
    /** Canvas colour behind frames, as `[r, g, b, a]` (default: transparent) */
    background?: [number, number, number, number];
}
/**
 * Muxes still-WebP frames into one animated WebP file.
 *
 * Frames are stored full-canvas, so each one fully replaces its predecessor and
 * no inter-frame ghosting is possible.
 */
export declare class WebPEncoder {
    private readonly loops;
    private readonly background;
    private frames;
    private hasAlpha;
    private width;
    private height;
    constructor(width: number, height: number, options?: WebPEncoderOptions);
    get frameCount(): number;
    /**
     * Add one frame from the bytes of a still WebP image.
     *
     * @param durationMs How long the frame is shown, in milliseconds.
     */
    addFrame(webpBytes: Uint8Array, durationMs: number): void;
    /** Assemble the animated WebP byte stream. */
    encodeToBytes(): Uint8Array;
    /** Encode and return the animated WebP as a Blob. */
    encode(): Blob;
}
/** Whether this browser's canvas can actually encode WebP stills. */
export declare function isWebPExportSupported(): boolean;
export interface WebPExportOptions {
    /** Output width in px. */
    width: number;
    /** Output height in px. */
    height: number;
    /** Frames per second (default: 30). */
    frameRate?: number;
    /** Number of loops (0 = infinite, default: 0). */
    loops?: number;
    /** Encoder quality, 0..1 (default: 0.8). */
    quality?: number;
    /** Solid colour painted behind every frame. Omit to keep transparency. */
    backgroundColor?: string;
    /** Draw the animation state at `time` onto the cleared canvas. */
    renderFrame: (ctx: CanvasRenderingContext2D, values: Map<string, Map<string, AnimatableValue>>, time: number) => void | Promise<void>;
    /** Progress callback, 0..1. */
    onProgress?: (fraction: number) => void;
    /** Abort the export early. */
    signal?: AbortSignal;
}
/**
 * Render a timeline to an animated WebP blob.
 *
 * Frames are rendered one at a time with no real-time pacing, so the export runs
 * as fast as the machine allows and always produces the same frame times.
 */
export declare function exportToWebP(timeline: Timeline, options: WebPExportOptions): Promise<Blob>;
/** Trigger a browser download of an exported WebP blob. */
export declare function downloadWebP(blob: Blob, filename?: string): void;
