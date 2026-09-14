/**
 * Video export.
 *
 * Two engines sit behind this module:
 *
 * - **WebCodecs** (preferred) — frames are encoded one at a time and muxed into
 *   an MP4 by {@link exportToMP4}. It runs as fast as the machine allows and
 *   timestamps every frame exactly, so the same timeline always produces the
 *   same file.
 * - **MediaRecorder** (fallback) — records a canvas stream in real time. It is
 *   used only where WebCodecs is unavailable; because it is wall-clock paced it
 *   can drop frames and is not deterministic.
 *
 * Both need a DOM environment (canvas) and a `renderFrame` callback that draws
 * the animation state at a given time.
 */
export interface VideoCodec {
    /** MediaRecorder mime type, e.g. `video/webm;codecs=vp9`. */
    mimeType: string;
    /** File extension without the dot. */
    extension: string;
    /** Human-readable label for a picker. */
    label: string;
}
/** Codecs this browser's MediaRecorder can actually produce, in preference order. */
export declare function getSupportedVideoCodecs(): VideoCodec[];
/** Whether the current environment can export video at all. */
export declare function isVideoExportSupported(): boolean;
/** A video output the current browser can actually produce. */
export interface VideoExportFormat {
    /** Stable identifier to pass back to {@link exportVideo}. */
    id: string;
    /** Human-readable label for a picker. */
    label: string;
    /** File extension without the dot. */
    extension: string;
    /**
     * True when frames are encoded individually rather than recorded in real
     * time — faster and reproducible.
     */
    deterministic: boolean;
}
/** Identifier for the WebCodecs MP4 path. */
export declare const MP4_WEBCODECS = "mp4-webcodecs";
/**
 * Video formats available here, best first.
 *
 * The WebCodecs MP4 encoder leads when present; MediaRecorder codecs follow as
 * real-time fallbacks.
 */
export declare function getVideoExportFormats(): VideoExportFormat[];
export interface VideoExportOptions {
    /** Output width in px. */
    width: number;
    /** Output height in px. */
    height: number;
    /** Frames per second (default 30). */
    fps?: number;
    /** Total duration to record, in ms. */
    durationMs: number;
    /** Mime type to record with; defaults to the best supported codec. */
    mimeType?: string;
    /**
     * Recording bitrate in bits/sec. Defaults to roughly 0.25 bits per pixel per
     * frame — MediaRecorder's own default is far too low for flat vector art and
     * visibly smears edges and text.
     */
    bitrate?: number;
    /** Solid colour painted behind every frame (default white). Pass `null` to keep transparent. */
    background?: string | null;
    /** Draw the animation at `timeMs` onto the given context (already cleared + background-filled). May be async (e.g. to seek video frames). */
    renderFrame: (ctx: CanvasRenderingContext2D, timeMs: number) => void | Promise<void>;
    /** Progress callback, 0..1. */
    onProgress?: (fraction: number) => void;
    /** Abort the export early. */
    signal?: AbortSignal;
}
/**
 * Record the animation to a video Blob. Resolves with the encoded blob.
 *
 * Frames are paced in real time so MediaRecorder timestamps them correctly, so a
 * `durationMs` of 6000 takes ~6s to export.
 */
export declare function exportToVideo(opts: VideoExportOptions): Promise<Blob>;
/**
 * Export a video using the best available engine.
 *
 * Pass a `format` id from {@link getVideoExportFormats}; omit it to take the
 * first (best) format. WebCodecs MP4 is used when selected, otherwise the
 * MediaRecorder path records the chosen mime type in real time.
 */
export declare function exportVideo(opts: VideoExportOptions & {
    format?: string;
}): Promise<{
    blob: Blob;
    extension: string;
}>;
/** Trigger a browser download of an exported video blob. */
export declare function downloadVideo(blob: Blob, filename?: string): void;
