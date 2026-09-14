import type { Timeline } from '../core/timeline';
/**
 * Lottie export options
 */
export interface LottieExportOptions {
    /** Animation name */
    name?: string;
    /** Frame rate (default: 60) */
    frameRate?: number;
    /** Canvas width (default: 512) */
    width?: number;
    /** Canvas height (default: 512) */
    height?: number;
    /** Background color (default: transparent) */
    backgroundColor?: string;
}
/**
 * Lottie JSON structure (simplified)
 * Full spec: https://lottiefiles.github.io/lottie-docs/
 */
export interface LottieAnimation {
    v: string;
    nm: string;
    fr: number;
    ip: number;
    op: number;
    w: number;
    h: number;
    ddd: number;
    assets: LottieAsset[];
    layers: LottieLayer[];
}
interface LottieAsset {
    id: string;
    [key: string]: unknown;
}
interface LottieLayer {
    ddd: number;
    ind: number;
    ty: number;
    nm: string;
    sr: number;
    ks: LottieTransform;
    ao: number;
    shapes?: LottieShape[];
    ip: number;
    op: number;
    st: number;
    bm: number;
}
interface LottieTransform {
    o?: LottieAnimatedValue;
    r?: LottieAnimatedValue;
    p?: LottieAnimatedMultiValue;
    a?: LottieAnimatedMultiValue;
    s?: LottieAnimatedMultiValue;
}
interface LottieAnimatedValue {
    a: number;
    k: number | LottieKeyframe[];
}
interface LottieAnimatedMultiValue {
    a: number;
    k: number[] | LottieMultiKeyframe[];
}
interface LottieKeyframe {
    t: number;
    s: number[];
    e?: number[];
    i?: {
        x: number[];
        y: number[];
    };
    o?: {
        x: number[];
        y: number[];
    };
}
interface LottieMultiKeyframe {
    t: number;
    s: number[];
    e?: number[];
    i?: {
        x: number[];
        y: number[];
    };
    o?: {
        x: number[];
        y: number[];
    };
}
interface LottieShape {
    ty: string;
    [key: string]: unknown;
}
/**
 * Export a timeline to Lottie JSON format.
 */
export declare function exportToLottie(timeline: Timeline, options?: LottieExportOptions): LottieAnimation;
/**
 * Export timeline to Lottie JSON string
 */
export declare function exportToLottieJSON(timeline: Timeline, options?: LottieExportOptions): string;
export {};
