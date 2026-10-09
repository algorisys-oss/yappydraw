// lcms-wasm ships no type declarations. It is a thin Emscripten wrapper whose API mirrors
// LittleCMS's C functions; utils/color-management.ts is the only consumer and types the subset
// it uses there.
declare module 'lcms-wasm' {
    export function instantiate(opts?: { locateFile?: (name: string) => string }): Promise<any>;
    export const FLOAT_SH: (n: number) => number;
    export const COLORSPACE_SH: (n: number) => number;
    export const CHANNELS_SH: (n: number) => number;
    export const BYTES_SH: (n: number) => number;
    export const PT_RGB: number;
    export const PT_CMYK: number;
    export const TYPE_RGB_8: number;
    export const TYPE_CMYK_8: number;
    export const INTENT_RELATIVE_COLORIMETRIC: number;
    export const cmsFLAGS_BLACKPOINTCOMPENSATION: number;
    export const cmsInfoDescription: number;
}
