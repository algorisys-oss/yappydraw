/**
 * Stick-figure vector library — data model.
 *
 * A drawify.com-style catalog of reusable, EDITABLE stick figures. Each asset is
 * an inline SVG string authored from simple primitives (a hollow head circle, a
 * multi-subpath skeleton, and optional coloured props). On drop the SVG is parsed
 * by `svgToElements` into normal Yappy `path` elements — so every figure is
 * recolourable / editable for free — and the parts are grouped into one object.
 */

/** The six top-level catalog categories (mirrors the reference cheat-sheets). */
export type StickCategory =
    | 'daily'
    | 'office'
    | 'meetings'
    | 'travel'
    | 'social'
    | 'services';

export interface StickCategoryInfo {
    id: StickCategory;
    /** Panel tab / section label. */
    name: string;
    /** Longer description (tooltip / help). */
    description: string;
}

export interface StickAsset {
    /** Stable unique id, e.g. `daily-waving`. */
    id: string;
    /** Human-readable name shown on hover. */
    name: string;
    category: StickCategory;
    /** Free-text search tags (lowercase). */
    tags: string[];
    /** Optional character variant, e.g. `male` | `female` | `boy` | `girl`. */
    variant?: string;
    /** Inline SVG markup (self-contained, no external refs). */
    svg: string;
    /** Natural width of the SVG viewBox. */
    w: number;
    /** Natural height of the SVG viewBox. */
    h: number;
}

/** MIME type carried on a drag from the panel to the canvas. */
export const STICK_FIGURE_MIME = 'application/x-yappy-stick-figure';
