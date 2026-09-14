import type { Timeline } from '../core/timeline';
/**
 * CSS export options
 */
export interface CSSExportOptions {
    /** Class name prefix for generated selectors */
    classPrefix?: string;
    /** Whether to include @keyframes declarations */
    includeKeyframes?: boolean;
    /** Whether to include animation shorthand properties */
    includeAnimation?: boolean;
    /** Whether to minify the output */
    minify?: boolean;
    /** Custom property mappings (e.g., 'x' -> 'left') */
    propertyMap?: Record<string, string>;
}
/**
 * Exported CSS result
 */
export interface CSSExportResult {
    /** Full CSS output string */
    css: string;
    /** Individual keyframes by animation name */
    keyframes: Map<string, string>;
    /** Individual selectors with animation properties */
    selectors: Map<string, string>;
}
/**
 * Export a timeline to CSS keyframes and animation properties.
 */
export declare function exportToCSS(timeline: Timeline, options?: CSSExportOptions): CSSExportResult;
