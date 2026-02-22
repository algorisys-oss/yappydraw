import type { DrawingElement, Point } from "../types";

/**
 * Calculates a simple orthogonal path (elbow) between two points.
 * respects entry/exit directions if provided.
 */
export const calculateElbowRoute = (
    start: Point,
    end: Point,
    startPos?: string,
    endPos?: string
): Point[] => {
    // Basic point list
    const points: Point[] = [{ x: start.x, y: start.y }];
    const offset = 20;

    // If no positions, use standard 1-elbow logic
    if (!startPos && !endPos) {
        const midX = (start.x + end.x) / 2;
        points.push({ x: midX, y: start.y });
        points.push({ x: midX, y: end.y });
        points.push({ x: end.x, y: end.y });
        return cleanPath(points);
    }

    // Helper to get next point based on position
    const getExitPoint = (p: Point, pos: string) => {
        if (pos === 'top') return { x: p.x, y: p.y - offset };
        if (pos === 'bottom') return { x: p.x, y: p.y + offset };
        if (pos === 'left') return { x: p.x - offset, y: p.y };
        if (pos === 'right') return { x: p.x + offset, y: p.y };
        return p;
    };

    let currStart = start;
    if (startPos) {
        currStart = getExitPoint(start, startPos);
        points.push(currStart);
    }

    let currEnd = end;
    if (endPos) {
        currEnd = getExitPoint(end, endPos);
    }

    // Connect currStart and currEnd with elbows.
    // Try to satisfy the last segment direction (into endPos)
    const isV = (p?: string) => p === 'top' || p === 'bottom';
    const isH = (p?: string) => p === 'left' || p === 'right';

    if (isV(endPos)) {
        // Must enter V, so previous point same X as end
        points.push({ x: currEnd.x, y: currStart.y });
    } else if (isH(endPos)) {
        // Must enter H, so previous point same Y as end
        points.push({ x: currStart.x, y: currEnd.y });
    } else if (isV(startPos)) {
        // Exited V, next should be H to reach end
        points.push({ x: end.x, y: currStart.y });
    } else if (isH(startPos)) {
        // Exited H, next should be V to reach end
        points.push({ x: currStart.x, y: end.y });
    } else {
        // Default: choose based on major displacement
        if (Math.abs(end.y - start.y) > Math.abs(end.x - start.x)) {
            points.push({ x: currStart.x, y: end.y });
        } else {
            points.push({ x: end.x, y: currStart.y });
        }
    }

    if (endPos) {
        points.push(currEnd);
    }
    points.push({ x: end.x, y: end.y });

    return cleanPath(points);
};

/**
 * Removes duplicate points and simplifies collinear segments.
 */
const cleanPath = (points: Point[]): Point[] => {
    if (points.length < 2) return points;
    const result: Point[] = [points[0]];

    for (let i = 1; i < points.length; i++) {
        const p1 = result[result.length - 1];
        const p2 = points[i];

        // Skip duplicates
        if (Math.abs(p1.x - p2.x) < 0.1 && Math.abs(p1.y - p2.y) < 0.1) continue;

        // Skip collinear points (simple H/V check for orthogonal)
        if (result.length >= 2) {
            const p0 = result[result.length - 2];
            const isCollinear =
                (Math.abs(p0.x - p1.x) < 0.1 && Math.abs(p1.x - p2.x) < 0.1) ||
                (Math.abs(p0.y - p1.y) < 0.1 && Math.abs(p1.y - p2.y) < 0.1);
            if (isCollinear) {
                result[result.length - 1] = p2;
                continue;
            }
        }

        result.push(p2);
    }
    return result;
};

/**
 * A "Smart" router that avoids obstacles using a coarse grid.
 */
export const calculateSmartElbowRoute = (
    start: Point,
    end: Point,
    allElements: DrawingElement[],
    startElement?: DrawingElement,
    endElement?: DrawingElement,
    startPos?: string,
    endPos?: string
): Point[] => {
    const MARGIN = 15;
    const GRID_OFFSET = 20;

    const obstacles = allElements.filter(el => {
        if (el.type === 'line' || el.type === 'arrow' || el.type === 'text') return false;
        // Optimization: only consider obstacles roughly between or near start/end
        const minX = Math.min(start.x, end.x) - 100;
        const maxX = Math.max(start.x, end.x) + 100;
        const minY = Math.min(start.y, end.y) - 100;
        const maxY = Math.max(start.y, end.y) + 100;

        if (el.x > maxX || el.x + el.width < minX || el.y > maxY || el.y + el.height < minY) return false;
        return true;
    });

    // If no obstacles, use simple elbow
    if (obstacles.length === 0) {
        return calculateElbowRoute(start, end, startPos, endPos);
    }

    // 1. Build a sparse grid
    const xCoords = new Set<number>([start.x, end.x]);
    const yCoords = new Set<number>([start.y, end.y]);

    // Add buffer points for every obstacle
    obstacles.forEach(el => {
        const x1 = el.x - MARGIN;
        const x2 = el.x + el.width + MARGIN;
        const y1 = el.y - MARGIN;
        const y2 = el.y + el.height + MARGIN;

        // Grid lines at boundaries
        xCoords.add(x1); xCoords.add(x2);
        yCoords.add(y1); yCoords.add(y2);

        // Midpoints can help in dense areas
        xCoords.add(el.x + el.width / 2);
        yCoords.add(el.y + el.height / 2);
    });

    // Add entry/exit points
    const addBuffer = (p: Point, pos?: string) => {
        if (!pos) return;
        if (pos === 'top') { xCoords.add(p.x); yCoords.add(p.y - GRID_OFFSET); }
        if (pos === 'bottom') { xCoords.add(p.x); yCoords.add(p.y + GRID_OFFSET); }
        if (pos === 'left') { xCoords.add(p.x - GRID_OFFSET); yCoords.add(p.y); }
        if (pos === 'right') { xCoords.add(p.x + GRID_OFFSET); yCoords.add(p.y); }
    };
    addBuffer(start, startPos);
    addBuffer(end, endPos);

    const sortedX = Array.from(xCoords).sort((a, b) => a - b);
    const sortedY = Array.from(yCoords).sort((a, b) => a - b);

    const startIdxX = sortedX.findIndex(x => Math.abs(x - start.x) < 0.1);
    const startIdxY = sortedY.findIndex(y => Math.abs(y - start.y) < 0.1);
    const endIdxX = sortedX.findIndex(x => Math.abs(x - end.x) < 0.1);
    const endIdxY = sortedY.findIndex(y => Math.abs(y - end.y) < 0.1);

    if (startIdxX === -1 || startIdxY === -1 || endIdxX === -1 || endIdxY === -1) {
        return calculateElbowRoute(start, end, startPos, endPos);
    }

    interface Node {
        gx: number; gy: number;
        g: number; h: number;
        parent: Node | null;
        dir: 'h' | 'v' | null;
    }

    const openSet: Node[] = [{
        gx: startIdxX, gy: startIdxY,
        g: 0, h: Math.abs(start.x - end.x) + Math.abs(start.y - end.y),
        parent: null, dir: null
    }];
    const closedSet = new Set<string>();

    const isInsideAny = (x: number, y: number, excludeId?: string) => {
        return obstacles.some(el => {
            if (el.id === excludeId) return false;
            // Small epsilon to allow touching boundary
            return x > el.x + 1 && x < el.x + el.width - 1 &&
                y > el.y + 1 && y < el.y + el.height - 1;
        });
    };

    const isObstacleSegment = (x1: number, y1: number, x2: number, y2: number) => {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        return obstacles.some(el => {
            // For start/end elements, be more lenient so we can exit/enter them
            const isStartEnd = el.id === startElement?.id || el.id === endElement?.id;
            const margin = isStartEnd ? 3 : 1;

            const isInside = mx > el.x + margin && mx < el.x + el.width - margin &&
                my > el.y + margin && my < el.y + el.height - margin;
            return isInside;
        });
    };

    let iterations = 0;
    while (openSet.length > 0 && iterations < 800) {
        iterations++;
        openSet.sort((a, b) => (a.g + a.h) - (b.g + b.h));
        const current = openSet.shift()!;

        if (current.gx === endIdxX && current.gy === endIdxY) {
            const path: Point[] = [];
            let curr: Node | null = current;
            while (curr) {
                path.push({ x: sortedX[curr.gx], y: sortedY[curr.gy] });
                curr = curr.parent;
            }
            return cleanPath(path.reverse());
        }

        closedSet.add(`${current.gx},${current.gy}`);

        const neighbors = [
            { dx: -1, dy: 0, dir: 'h' as const, name: 'left' },
            { dx: 1, dy: 0, dir: 'h' as const, name: 'right' },
            { dx: 0, dy: -1, dir: 'v' as const, name: 'top' },
            { dx: 0, dy: 1, dir: 'v' as const, name: 'bottom' }
        ];

        for (const nb of neighbors) {
            const nx = current.gx + nb.dx;
            const ny = current.gy + nb.dy;

            if (nx < 0 || nx >= sortedX.length || ny < 0 || ny >= sortedY.length) continue;
            if (closedSet.has(`${nx},${ny}`)) continue;

            // Constrain entry/exit directions - only if we have a clear cardinal direction
            const isCardinal = (p?: string) => ['top', 'bottom', 'left', 'right'].includes(p || '');

            if (current.gx === startIdxX && current.gy === startIdxY && isCardinal(startPos)) {
                if (nb.name !== startPos) continue;
            }

            if (nx === endIdxX && ny === endIdxY && isCardinal(endPos)) {
                const requiredMove = { 'top': 'bottom', 'bottom': 'top', 'left': 'right', 'right': 'left' }[endPos!];
                if (nb.name !== requiredMove) continue;
            }

            const xPrev = sortedX[current.gx];
            const yPrev = sortedY[current.gy];
            const xNext = sortedX[nx];
            const yNext = sortedY[ny];

            // Obstacle check
            if (isObstacleSegment(xPrev, yPrev, xNext, yNext)) continue;

            const dist = Math.abs(xNext - xPrev) + Math.abs(yNext - yPrev);
            const turnPenalty = (current.dir && current.dir !== nb.dir) ? 100 : 0;

            // Prefer points outside obstacles
            const obstacleAvoidancePenalty = isInsideAny(xNext, yNext) ? 500 : 0;

            const newG = current.g + dist + turnPenalty + obstacleAvoidancePenalty;

            const existing = openSet.find(n => n.gx === nx && n.gy === ny);
            if (existing) {
                if (newG < existing.g) {
                    existing.g = newG;
                    existing.parent = current;
                    existing.dir = nb.dir;
                }
            } else {
                openSet.push({
                    gx: nx, gy: ny,
                    g: newG, h: Math.abs(xNext - end.x) + Math.abs(yNext - end.y),
                    parent: current,
                    dir: nb.dir
                });
            }
        }
    }

    return calculateElbowRoute(start, end, startPos, endPos);
};
