/** One encoded video sample. */
export interface MP4Sample {
    data: Uint8Array;
    /** Duration in media timescale units. */
    duration: number;
    /** Whether this sample is a sync (key) frame. */
    isKeyFrame: boolean;
}
export interface MP4MuxOptions {
    width: number;
    height: number;
    /** Media timescale — ticks per second. */
    timescale: number;
    /** `avcC` decoder configuration record from the encoder's metadata. */
    avcC: Uint8Array;
}
/**
 * Mux encoded H.264 samples into an MP4 file.
 *
 * Samples are laid out as a single chunk, which keeps the sample-to-chunk table
 * trivial and is fine for the short animations tinyfly exports.
 */
export declare function muxMP4(samples: MP4Sample[], options: MP4MuxOptions): Uint8Array<ArrayBuffer>;
/** Whether this environment can encode H.264 through WebCodecs. */
export declare function isWebCodecsMP4Supported(): boolean;
/** First H.264 codec string this browser will accept at the given size. */
export declare function pickAVCCodec(width: number, height: number, framerate: number, bitrate: number): Promise<string | null>;
export interface MP4ExportOptions {
    /** Output width in px. Rounded up to an even number for H.264. */
    width: number;
    /** Output height in px. Rounded up to an even number for H.264. */
    height: number;
    /** Frames per second (default: 30). */
    fps?: number;
    /** Total duration to render, in ms. */
    durationMs: number;
    /** Target bitrate in bits/sec. Overrides `quality` when given. */
    bitrate?: number;
    /**
     * Bits per pixel per frame, used when `bitrate` is not set (default: 0.25).
     *
     * Flat vector art has hard edges that H.264 smears at low bitrates, so this
     * default is deliberately generous compared with camera footage.
     */
    bitsPerPixel?: number;
    /** Emit a key frame every N frames (default: 2 seconds' worth). */
    keyFrameInterval?: number;
    /** Solid colour painted behind every frame (default white). `null` keeps it transparent. */
    background?: string | null;
    /** Draw the animation at `timeMs` onto the cleared, background-filled context. */
    renderFrame: (ctx: CanvasRenderingContext2D, timeMs: number) => void | Promise<void>;
    /** Progress callback, 0..1. */
    onProgress?: (fraction: number) => void;
    /** Abort the export early. */
    signal?: AbortSignal;
}
/**
 * Render a timeline to an MP4 blob using WebCodecs.
 *
 * Unlike the MediaRecorder path this is not real-time: frames are rendered and
 * encoded as fast as the machine allows, and every frame is presented at an
 * exact timestamp, so the same input always yields the same frame timing.
 */
export declare function exportToMP4(options: MP4ExportOptions): Promise<Blob>;
