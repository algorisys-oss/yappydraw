/**
 * Minimal GIF89a reader used by the export tests.
 *
 * This exists so the encoder is verified by actually decoding its output back to
 * pixels rather than by asserting the blob is non-empty. It supports only what
 * our encoder emits: full-canvas frames with local colour tables.
 */
export interface DecodedFrame {
    /** RGBA pixels, `width * height * 4` bytes. */
    rgba: Uint8Array;
    /** Delay in centiseconds. */
    delay: number;
    /** Transparent colour index, or -1 when the frame is opaque. */
    transparentIndex: number;
    /** Disposal method from the graphic control extension. */
    disposal: number;
}
export interface DecodedGIF {
    width: number;
    height: number;
    loops: number;
    frames: DecodedFrame[];
}
export declare function decodeGIF(bytes: Uint8Array): DecodedGIF;
