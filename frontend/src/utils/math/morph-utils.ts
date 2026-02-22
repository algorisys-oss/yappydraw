
import type { ShapeGeometry } from '../shape-geometry';
import { getShapeGeometry } from '../shape-geometry';
import { PathUtils } from './path-utils';
import type { DrawingElement } from '../../types';

interface Point { x: number; y: number; }

export class MorphUtils {
    /**
     * Resample a polygon (array of points) to a specific number of equidistant points.
     * This is crucial for morphing between shapes with different point counts.
     */
    static resamplePolygon(points: Point[], sampleCount: number): Point[] {
        if (points.length < 2) return Array(sampleCount).fill(points[0] || { x: 0, y: 0 });

        // 1. Calculate total perimeter length
        let totalLength = 0;
        const segments: { length: number, start: Point, end: Point }[] = [];

        for (let i = 0; i < points.length; i++) {
            const start = points[i];
            const end = points[(i + 1) % points.length]; // Closed loop
            const length = Math.hypot(end.x - start.x, end.y - start.y);
            totalLength += length;
            segments.push({ length, start, end });
        }

        if (totalLength === 0) return Array(sampleCount).fill(points[0]);

        // 2. Generate equidistant points
        const result: Point[] = [];
        const step = totalLength / sampleCount;
        let currentDist = 0;
        let segmentIndex = 0;
        // let distAlongSegment = 0; // Unused

        for (let i = 0; i < sampleCount; i++) {
            const targetDist = i * step;

            // Find segment containing targetDist
            // We advance segmentIndex until we cover the targetDist
            while (segmentIndex < segments.length) {
                const seg = segments[segmentIndex];
                if (currentDist + seg.length >= targetDist) {
                    // It's in this segment
                    const segmentLocalDist = targetDist - currentDist;
                    const t = segmentLocalDist / seg.length;

                    result.push({
                        x: seg.start.x + (seg.end.x - seg.start.x) * t,
                        y: seg.start.y + (seg.end.y - seg.start.y) * t
                    });
                    break;
                } else {
                    currentDist += seg.length;
                    segmentIndex++;
                }
            }
            // Fallback for floating point errors at the very end
            if (result.length <= i) {
                result.push(points[points.length - 1]);
            }
        }

        return result;
    }

    /**
     * Interpolate between two arrays of points.
     * Assumes arrays are same length (use resamplePolygon first).
     */
    static interpolatePoints(pointsA: Point[], pointsB: Point[], t: number): Point[] {
        if (pointsA.length !== pointsB.length) {
            console.warn('Interpolation mismatch', pointsA.length, pointsB.length);
            return pointsA;
        }

        return pointsA.map((pA, i) => {
            const pB = pointsB[i];
            return {
                x: pA.x + (pB.x - pA.x) * t,
                y: pA.y + (pB.y - pA.y) * t
            };
        });
    }

    /**
     * Shifts array B to alignment that minimizes total distance to A.
     * Prevents "twisting" effects.
     * O(N^2) but fine for N=100.
     */
    static alignPolygons(pointsA: Point[], pointsB: Point[]): Point[] {
        if (pointsA.length !== pointsB.length) return pointsB;

        let bestOffset = 0;
        let minSumDist = Infinity;

        for (let offset = 0; offset < pointsB.length; offset++) {
            let sumDist = 0;
            for (let i = 0; i < pointsA.length; i++) {
                const pA = pointsA[i];
                const pB = pointsB[(i + offset) % pointsB.length];
                sumDist += (pA.x - pB.x) ** 2 + (pA.y - pB.y) ** 2;
            }
            if (sumDist < minSumDist) {
                minSumDist = sumDist;
                bestOffset = offset;
            }
        }

        // Return rotated B
        const result = Array(pointsB.length);
        for (let i = 0; i < pointsB.length; i++) {
            result[i] = pointsB[(i + bestOffset) % pointsB.length];
        }
        return result;
    }

    /**
     * Converts an element's shape into a standardized polygon (array of points).
     * Used as the source or target for morphing.
     */
    static getPointsFromElement(element: DrawingElement, overrideShapeType?: string): Point[] {
        // Create a temporary element if we are overriding the shape (e.g. for target generation)
        const el = overrideShapeType ? { ...element, type: overrideShapeType } as DrawingElement : element;

        // Handle special cases first?
        if (el.type === 'line' || el.type === 'arrow') {
            // For now, treat lines as degenerate polygons or just endpoints
            return (el.points as Point[]) || [{ x: 0, y: 0 }, { x: el.width, y: el.height }];
        }

        const geom = getShapeGeometry(el);
        // console.log('[MorphUtils] Geometry for', el.type, geom?.type);
        if (!geom) return this.generateCirclePoints(el.width / 2, el.height / 2); // Fallback

        return this.geometryToPoints(geom, el.width, el.height);
    }

    private static geometryToPoints(geom: ShapeGeometry, w: number, h: number): Point[] {
        switch (geom.type) {
            case 'points':
                if (geom.points.length === 0) return [];
                return geom.points;

            case 'rect':
                // Generate rect points (clockwise)
                // x,y is topleft relative to center usually in getShapeGeometry (x=-w/2)
                return [
                    { x: geom.x, y: geom.y },
                    { x: geom.x + geom.w, y: geom.y },
                    { x: geom.x + geom.w, y: geom.y + geom.h },
                    { x: geom.x, y: geom.y + geom.h }
                ];

            case 'ellipse':
                // Sample ellipse
                const points: Point[] = [];
                const steps = 60;
                for (let i = 0; i < steps; i++) {
                    const angle = (i / steps) * Math.PI * 2;
                    points.push({
                        x: geom.cx + geom.rx * Math.cos(angle),
                        y: geom.cy + geom.ry * Math.sin(angle)
                    });
                }
                return points;

            case 'path':
                // Parse SVG path to points
                // Use proper sampling along the curve instead of control points
                const commands = PathUtils.parsePath(geom.path);
                const pathPoints: Point[] = [];
                const pSteps = 60;
                for (let i = 0; i < pSteps; i++) {
                    const pt = PathUtils.getPointOnPath(commands, i / pSteps);
                    pathPoints.push({ x: pt.x, y: pt.y });
                }
                return pathPoints;

            case 'multi':
                // Morphing complex multi-shapes is hard. Pick primary shape.
                if (geom.shapes.length > 0) {
                    return this.geometryToPoints(geom.shapes[0], w, h);
                }
                return [];
        }
        return [];
    }

    // Fallback generator
    private static generateCirclePoints(rx: number, ry: number): Point[] {
        const points: Point[] = [];
        const steps = 60;
        for (let i = 0; i < steps; i++) {
            const angle = (i / steps) * Math.PI * 2;
            points.push({ x: rx * Math.cos(angle), y: ry * Math.sin(angle) });
        }
        return points;
    }
}
