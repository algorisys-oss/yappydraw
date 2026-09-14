/**
 * Path utilities: parsing and sampling SVG path data, motion paths, shape
 * morphing, and building path data from points or basic shapes.
 */
export { parsePath, getPointAtProgress, getPathLength, clearPathCache, pointAtDistance } from './path-utils';
export type { PathSegment, ParsedPath, Subpath } from './path-utils';
export { getMotionPathPoint, interpolateMotionPath } from './motion-path';
export { morphPath, isPathData, clearMorphCache, MORPH_SAMPLES } from './path-morph';
export type { MorphOptions } from './path-morph';
export { pointsToPath, shapeToPathData } from './path-builders';
export type { PathPoint, PointsToPathOptions, SvgShape } from './path-builders';
