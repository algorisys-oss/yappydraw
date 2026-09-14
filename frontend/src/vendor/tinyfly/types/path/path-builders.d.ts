/**
 * Build SVG path data from other descriptions of a shape: a list of points to
 * pass through, or a basic SVG shape's attributes. Authoring-time helpers — the
 * result is an ordinary path string, so everything downstream (motion paths,
 * morphs, JSON) only ever sees path data.
 */
export interface PathPoint {
    x: number;
    y: number;
}
export interface PointsToPathOptions {
    /**
     * 0 draws straight lines between the points; 1 (the default) a natural curve
     * through them; larger values bow further. The same meaning as GSAP's
     * `curviness`.
     */
    curviness?: number;
    /** Join the last point back to the first, smoothly */
    closed?: boolean;
}
/**
 * A path through every point, in order, as a Catmull-Rom spline converted to
 * cubic beziers — each curve's tangent at a point is parallel to the line
 * between that point's neighbours, which is what makes the join smooth.
 */
export declare function pointsToPath(points: PathPoint[], options?: PointsToPathOptions): string;
/** The attributes of a basic SVG shape, as strings (as read from the DOM). */
export interface SvgShape {
    /** Element name: path, circle, ellipse, rect, line, polyline or polygon */
    tag: string;
    attributes: Record<string, string | null | undefined>;
}
/**
 * Path data equivalent to a basic SVG shape, starting where the browser's own
 * geometry starts (so a follower begins where `getPointAtLength(0)` would).
 * Returns null for anything else.
 */
export declare function shapeToPathData(shape: SvgShape): string | null;
