/**
 * SVG path parsing and point calculation utilities.
 *
 * Parsing normalises every command to absolute lines and cubic beziers:
 * H/V become lines, Q/T are raised to cubics exactly, S/T reflect the previous
 * control point as the SVG spec defines, and arcs are split into cubic pieces
 * of at most 90°. Evaluation then only has two cases to handle.
 *
 * Progress along a path is by arc length, including *within* a curve (via a
 * per-segment length table), so something moving along a path does so at an
 * even speed rather than bunching up where control points are close together.
 *
 * Pure and DOM-free: runs in the engine, workers and tests alike.
 */
import type { MotionPathPoint } from '../types';
/** A drawn segment: a line or a cubic bezier, in absolute coordinates. */
export interface PathSegment {
    type: 'L' | 'C';
    /** L: [endX, endY]. C: [cp1x, cp1y, cp2x, cp2y, endX, endY] */
    points: number[];
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    length: number;
    /** Index of the subpath (each moveto starts one) this segment belongs to */
    subpath: number;
    /**
     * Cubic segments only: cumulative length at evenly spaced `t` values
     * (`lengths[i]` is the length from t=0 to t=i/(lengths.length-1)).
     */
    lengths?: number[];
}
/** One continuous run of segments, started by a moveto. */
export interface Subpath {
    /** Index of the first segment in `ParsedPath.segments` */
    start: number;
    /** Index one past the last segment */
    end: number;
    length: number;
    /** Ends with Z, or finishes exactly where it began */
    closed: boolean;
}
/** Parsed path with segments and total length */
export interface ParsedPath {
    segments: PathSegment[];
    totalLength: number;
    /** Drawn subpaths, in order (movetos that draw nothing are omitted) */
    subpaths: Subpath[];
}
/**
 * Parse an SVG path data string into absolute line and cubic segments.
 * Supports M, L, H, V, C, S, Q, T, A and Z, absolute and relative.
 */
export declare function parsePath(pathData: string): ParsedPath;
/**
 * The point `distance` along a run of segments (`segments[start]` up to, not
 * including, `segments[end]`), clamped to the run.
 */
export declare function pointAtDistance(segments: PathSegment[], distance: number, start?: number, end?: number): MotionPathPoint;
/**
 * Get the point and tangent angle at normalized progress (0-1) along a path,
 * measured by arc length.
 */
export declare function getPointAtProgress(pathData: string, progress: number): MotionPathPoint;
/**
 * Clear the path cache (useful for memory management).
 */
export declare function clearPathCache(): void;
/**
 * Get total length of a path.
 */
export declare function getPathLength(pathData: string): number;
