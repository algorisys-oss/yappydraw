/** Minimal types for `gifenc` (ships no .d.ts) — only the bits we use. */
declare module 'gifenc' {
    export function quantize(
        rgba: Uint8Array | Uint8ClampedArray,
        maxColors: number,
        opts?: { format?: string; oneBitAlpha?: boolean | number; clearAlpha?: boolean },
    ): number[][];
    export function applyPalette(
        rgba: Uint8Array | Uint8ClampedArray,
        palette: number[][],
        format?: string,
    ): Uint8Array;
    export interface GifEncoderInstance {
        writeFrame(
            index: Uint8Array,
            width: number,
            height: number,
            opts?: { palette?: number[][]; delay?: number; repeat?: number; transparent?: boolean },
        ): void;
        finish(): void;
        bytes(): Uint8Array;
        bytesView(): Uint8Array;
    }
    export function GIFEncoder(opts?: { auto?: boolean }): GifEncoderInstance;
}
