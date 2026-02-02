import type { Point } from "../types";

export const isPointInPolygon = (p: Point, polygon: Point[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        if (((yi > p.y) !== (yj > p.y)) &&
            (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
};

export const distanceToSegment = (p: Point, a: Point, b: Point): number => {
    const x = p.x;
    const y = p.y;
    const x1 = a.x;
    const y1 = a.y;
    const x2 = b.x;
    const y2 = b.y;

    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
};

const cubicBezier = (p0: number, p1: number, p2: number, p3: number, t: number) => {
    const k = 1 - t;
    return k * k * k * p0 + 3 * k * k * t * p1 + 3 * k * t * t * p2 + t * t * t * p3;
};

const cubicBezierAngle = (p0: Point, p1: Point, p2: Point, p3: Point, t: number) => {
    const dx = 3 * (1 - t) * (1 - t) * (p1.x - p0.x) + 6 * (1 - t) * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
    const dy = 3 * (1 - t) * (1 - t) * (p1.y - p0.y) + 6 * (1 - t) * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
    return Math.atan2(dy, dx);
};

export const getOrganicBranchPolygon = (
    start: Point, end: Point, cp1: Point, cp2: Point, strokeWidth: number
): Point[] => {
    const segments = 20;
    const startWidth = Math.max(strokeWidth * 8, 4);
    const endWidth = Math.max(strokeWidth * 2, 2);
    const pointsTop: Point[] = [];
    const pointsBottom: Point[] = [];

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = cubicBezier(start.x, cp1.x, cp2.x, end.x, t);
        const y = cubicBezier(start.y, cp1.y, cp2.y, end.y, t);
        const angle = cubicBezierAngle(start, cp1, cp2, end, t);

        const currentWidth = startWidth + (endWidth - startWidth) * t;
        const halfWidth = currentWidth / 2;
        const offsetX = Math.cos(angle + Math.PI / 2) * halfWidth;
        const offsetY = Math.sin(angle + Math.PI / 2) * halfWidth;

        pointsTop.push({ x: x + offsetX, y: y + offsetY });
        pointsBottom.push({ x: x - offsetX, y: y - offsetY });
    }

    return [...pointsTop, ...pointsBottom.reverse()];
};

export const getBezierPoints = (start: Point, cp1: Point, cp2: Point, end: Point, segments: number = 20) => {
    const points: Point[] = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        points.push({
            x: cubicBezier(start.x, cp1.x, cp2.x, end.x, t),
            y: cubicBezier(start.y, cp1.y, cp2.y, end.y, t)
        });
    }
    return points;
};

export const isPointOnBezier = (p: Point, start: Point, cp1: Point, cp2: Point, end: Point, threshold: number): boolean => {
    const points = getBezierPoints(start, cp1, cp2, end, 20); // 20 segments for precision
    return isPointOnPolyline(p, points, threshold);
};

export const isPointOnPolyline = (p: Point, points: Point[], threshold: number): boolean => {
    if (points.length < 2) return false;
    for (let i = 0; i < points.length - 1; i++) {
        if (distanceToSegment(p, points[i], points[i + 1]) <= threshold) {
            return true;
        }
    }
    return false;
};

export const isPointInEllipse = (p: Point, x: number, y: number, w: number, h: number, threshold: number = 0): boolean => {
    // Standardize
    const rx = Math.abs(w / 2) + threshold;
    const ry = Math.abs(h / 2) + threshold;
    const cx = x + w / 2;
    const cy = y + h / 2;

    if (rx <= 0 || ry <= 0) return false;

    const val = Math.pow(p.x - cx, 2) / Math.pow(rx, 2) + Math.pow(p.y - cy, 2) / Math.pow(ry, 2);
    return val <= 1;
};

export const isPointNearEllipseStroke = (p: Point, x: number, y: number, w: number, h: number, threshold: number): boolean => {
    // Simplification: check if inside outer ellipse and outside inner ellipse?
    // Using simple distance check is hard for ellipse. 
    // Approximation: Closest point on ellipse?
    // For now: Inside filled ellipse OR near border if empty?
    // Let's rely on standard logic: Hit if inside (fill) or near border.
    // Given the complexity of exact ellipse distance, we'll check "inside outer + margin" AND "outside inner - margin" for stroke-only logic.
    // For now, let's just use "Inside" for simplicity if solid, or "Close to rim" if hollow.
    // Implementation: Check if point is in Outer(r+t) and Not in Inner(r-t).

    // Center point
    const cx = x + w / 2;
    const cy = y + h / 2;
    const rx = Math.abs(w / 2);
    const ry = Math.abs(h / 2);

    // Normalize point relative to center
    const dx = p.x - cx;
    const dy = p.y - cy;

    // Check if close to boundary? 
    // (x/a)^2 + (y/b)^2 = 1.
    // If value is close to 1.
    // Sensitivity depends on radius.
    const val = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);

    // Heuristic: accepted range around 1.
    // Standard distance approach is better but complex.
    // Let's trust isPointInEllipse for "inside". 
    // And for stroke... maybe just allow 'inside' for now as it's easier to select.
    return Math.abs(val - 1) < (threshold / Math.min(rx, ry)); // Very rough
};

// Helper: Rotate point (x,y) around center (cx,cy) by angle
export const rotatePoint = (x: number, y: number, cx: number, cy: number, angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: (cos * (x - cx)) - (sin * (y - cy)) + cx,
        y: (sin * (x - cx)) + (cos * (y - cy)) + cy
    };
};

export const intersectElementWithLine = (
    element: any,
    a: Point,
    gap: number = 0
): Point | null => {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;

    if (element.type === 'rectangle' || element.type === 'image' || element.type === 'text') {
        let p = { x: a.x, y: a.y };
        if (element.angle) {
            p = rotatePoint(a.x, a.y, cx, cy, -element.angle);
        }

        const w = element.width;
        const h = element.height;
        const x1 = cx - w / 2 - gap;
        const x2 = cx + w / 2 + gap;
        const y1 = cy - h / 2 - gap;
        const y2 = cy + h / 2 + gap;

        const dx = p.x - cx;
        const dy = p.y - cy;

        if (dx === 0 && dy === 0) return { x: cx, y: cy };

        let t = Infinity;

        if (dx !== 0) {
            const tx1 = (x1 - cx) / dx;
            if (tx1 > 0) t = Math.min(t, tx1);
            const tx2 = (x2 - cx) / dx;
            if (tx2 > 0) t = Math.min(t, tx2);
        }

        if (dy !== 0) {
            const ty1 = (y1 - cy) / dy;
            if (ty1 > 0) t = Math.min(t, ty1);
            const ty2 = (y2 - cy) / dy;
            if (ty2 > 0) t = Math.min(t, ty2);
        }

        if (t === Infinity) return null;

        const ix = cx + dx * t;
        const iy = cy + dy * t;

        if (element.angle) {
            return rotatePoint(ix, iy, cx, cy, element.angle);
        }
        return { x: ix, y: iy };

    } else if (element.type === 'circle') {
        const rx = element.width / 2 + gap;
        const ry = element.height / 2 + gap;

        let p = { x: a.x, y: a.y };
        if (element.angle) {
            p = rotatePoint(a.x, a.y, cx, cy, -element.angle);
        }

        const dx = p.x - cx;
        const dy = p.y - cy;

        if (dx === 0 && dy === 0) return null;

        const A = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
        const t = 1 / Math.sqrt(A);

        const ix = cx + dx * t;
        const iy = cy + dy * t;

        if (element.angle) {
            return rotatePoint(ix, iy, cx, cy, element.angle);
        }
        return { x: ix, y: iy };
    } else if (element.type === 'diamond') {
        let p = { x: a.x, y: a.y };
        // Diamonds can also be rotated
        if (element.angle) {
            p = rotatePoint(a.x, a.y, cx, cy, -element.angle);
        }

        const w = (element.width / 2) + gap;
        const h = (element.height / 2) + gap;
        const dx = p.x - cx;
        const dy = p.y - cy;

        if (dx === 0 && dy === 0) return { x: cx, y: cy };

        const angle = Math.atan2(dy, dx);
        const absTan = Math.abs(Math.tan(angle));

        // Exact diamond intersection: |x|/w + |y|/h = 1
        // x = dX, y = dX * tan(a)
        // |dX|/w + |dX * tan(a)|/h = 1
        // |dX| * (1/w + absTan/h) = 1
        // |dX| = 1 / (1/w + absTan/h)
        const absDx = 1 / ((1 / w) + (absTan / h));

        const ix = cx + (dx > 0 ? 1 : -1) * absDx;
        const iy = cy + (dx > 0 ? 1 : -1) * absDx * Math.tan(angle);

        if (element.angle) {
            return rotatePoint(ix, iy, cx, cy, element.angle);
        }
        return { x: ix, y: iy };
    } else if (element.type === 'triangle' || element.type === 'hexagon' || element.type === 'octagon' ||
        element.type === 'parallelogram' || element.type === 'star' || element.type === 'cloud' ||
        element.type === 'heart' || element.type === 'arrowLeft' || element.type === 'arrowRight' ||
        element.type === 'arrowUp' || element.type === 'arrowDown' ||
        element.type === 'capsule' || element.type === 'stickyNote' || element.type === 'callout' ||
        element.type === 'burst' || element.type === 'speechBubble' || element.type === 'ribbon' ||
        element.type === 'bracketLeft' || element.type === 'bracketRight' ||
        element.type === 'database' || element.type === 'document' || element.type === 'predefinedProcess' || element.type === 'internalStorage' ||
        element.type === 'server' || element.type === 'loadBalancer' || element.type === 'firewall' || element.type === 'user' || element.type === 'messageQueue' || element.type === 'lambda' || element.type === 'router' || element.type === 'browser' || element.type === 'trapezoid' || element.type === 'rightTriangle' || element.type === 'pentagon' || element.type === 'septagon' || element.type === 'starPerson' || element.type === 'scroll' || element.type === 'wavyDivider' || element.type === 'doubleBanner' ||
        element.type === 'lightbulb' || element.type === 'signpost' || element.type === 'burstBlob' ||
        element.type === 'browserWindow' || element.type === 'mobilePhone' || element.type === 'ghostButton' || element.type === 'inputField' ||
        element.type === 'fineliner' || element.type === 'inkbrush' || element.type === 'marker') {
        // For complex/polygon shapes, use simplified bounding box intersection
        // This is similar to rectangle but provides reasonable approximation
        let p = { x: a.x, y: a.y };
        if (element.angle) {
            p = rotatePoint(a.x, a.y, cx, cy, -element.angle);
        }

        const w = element.width;
        const h = element.height;
        const x1 = cx - w / 2 - gap;
        const x2 = cx + w / 2 + gap;
        const y1 = cy - h / 2 - gap;
        const y2 = cy + h / 2 + gap;

        const dx = p.x - cx;
        const dy = p.y - cy;

        if (dx === 0 && dy === 0) return { x: cx, y: cy };

        let t = Infinity;

        if (dx !== 0) {
            const tx1 = (x1 - cx) / dx;
            if (tx1 > 0) t = Math.min(t, tx1);
            const tx2 = (x2 - cx) / dx;
            if (tx2 > 0) t = Math.min(t, tx2);
        }

        if (dy !== 0) {
            const ty1 = (y1 - cy) / dy;
            if (ty1 > 0) t = Math.min(t, ty1);
            const ty2 = (y2 - cy) / dy;
            if (ty2 > 0) t = Math.min(t, ty2);
        }

        if (t === Infinity) return null;

        const ix = cx + dx * t;
        const iy = cy + dy * t;

        if (element.angle) {
            return rotatePoint(ix, iy, cx, cy, element.angle);
        }
        return { x: ix, y: iy };
    }

    // Handle polyline shapes (line type with points array)
    if (element.type === 'line' && element.points && Array.isArray(element.points) && (element.points as any[]).length >= 2) {
        const pts = element.points as { x: number; y: number }[];
        const absPoints = pts.map(p => ({ x: element.x + p.x, y: element.y + p.y }));

        // Find closest point on any polyline segment to the query point
        let minDist = Infinity;
        let closestPoint: Point | null = null;

        for (let i = 0; i < absPoints.length - 1; i++) {
            const segA = absPoints[i];
            const segB = absPoints[i + 1];
            // Closest point on segment
            const sdx = segB.x - segA.x;
            const sdy = segB.y - segA.y;
            const lenSq = sdx * sdx + sdy * sdy;
            let t = 0;
            if (lenSq > 0) {
                t = Math.max(0, Math.min(1, ((a.x - segA.x) * sdx + (a.y - segA.y) * sdy) / lenSq));
            }
            const cp = { x: segA.x + t * sdx, y: segA.y + t * sdy };
            const dist = Math.sqrt((a.x - cp.x) ** 2 + (a.y - cp.y) ** 2);
            if (dist < minDist) {
                minDist = dist;
                closestPoint = cp;
            }
        }

        return closestPoint;
    }

    return null;
};
