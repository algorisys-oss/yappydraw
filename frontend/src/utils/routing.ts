import type { DrawingElement, Point } from "../types";
import { isWasmEnabled } from "../wasm/feature-flags";
import { wasmCalculateSmartElbowRoute } from "../wasm/bridge/routing-bridge";
import { CONNECTOR_PENALTY, collectConnectorSegments, collectShapeObstacles, mergeGridCoords, routeBounds, segmentBounds, segmentsCollinearOverlap } from "./connector-obstacles";

// Connector-body obstacles live in their own module to avoid a routing <-> bridge
// import cycle; re-exported here so existing importers keep working.
export {
    CONNECTOR_PENALTY,
    GRID_MERGE,
    collectConnectorSegments,
    collectShapeObstacles,
    mergeGridCoords,
    segmentsCollinearOverlap,
    type Seg,
} from "./connector-obstacles";

/**
 * A* expansion budget. Must match MAX_ITERATIONS in
 * wasm/assemblyscript/assembly/routing.ts.
 *
 * Was 800, then 4000. A 48-node grid with the connector-lane coordinates added is
 * ~56×37 cells, and a hop across it needs more than 800 pops once turn and lane
 * penalties flatten the heuristic — so the long edges in exactly the diagrams that
 * need routing most were the ones that fell back to the naive elbow and ran straight
 * through six boxes. A 52-box platform diagram with 160 avoided bodies builds grids of
 * ~140×150 cells, where a few routes needed more than 4000. With a heap the pops are
 * cheap; the budget is a ceiling on pathological cases, not a target.
 */
export const MAX_ROUTE_ITERATIONS = 8000;

/**
 * How close (px) a route segment may pass to a shape it is not attached to. Smaller
 * than the 15px lane offset the grid builds, so the lanes stay legal, and larger than
 * zero so a run along a border is not. Must match OBSTACLE_CLEARANCE in
 * wasm/assemblyscript/assembly/routing.ts.
 */
export const OBSTACLE_CLEARANCE = 10;

/** A straight run shorter than this (px) between two turns is a jog. Mirrored in WASM. */
export const MIN_RUN = 12;
/** Extra cost of turning onto a jog, on top of the turn itself. Mirrored in WASM. */
export const JOG_PENALTY = 400;

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
 * Removes duplicate points and simplifies collinear segments. Exported as
 * `simplifyElbowPath` for the manual bend/segment editing in the selection handler,
 * so a hand-dragged elbow is tidied by the same rule as a routed one.
 */
export const simplifyElbowPath = (points: Point[]): Point[] => cleanPath(points);

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
    endPos?: string,
    selfLine?: DrawingElement
): Point[] => {
    // WASM fast path: grid construction in JS, A* in WASM
    if (isWasmEnabled('routing')) {
        const wasmResult = wasmCalculateSmartElbowRoute(
            start, end, allElements, startElement, endElement, startPos, endPos, selfLine
        );
        if (wasmResult) return wasmResult;
        // Fall through to JS if WASM returned null (no path or no obstacles)
    }

    const MARGIN = 15;
    const GRID_OFFSET = 20;

    // Bodies of already-routed lower-priority connectors to avoid running along.
    // Clipped to the route's neighbourhood and capped, so a busy document can't
    // explode the A* grid (which would silently degrade routing to a naive elbow).
    const connectorSegs = selfLine
        ? collectConnectorSegments(selfLine, allElements, routeBounds(start, end))
        : [];

    // Their lanes are grid lines too, so the obstacle region must reach them.
    const obstacles = collectShapeObstacles(start, end, allElements, startElement, endElement, segmentBounds(connectorSegs));

    // If no obstacles, use simple elbow
    if (obstacles.length === 0) {
        return calculateElbowRoute(start, end, startPos, endPos);
    }

    // 1. Build a sparse grid
    const xCoords = new Set<number>([start.x, end.x]);
    const yCoords = new Set<number>([start.y, end.y]);

    // One lane either side of each connector body, so the router has an adjacent lane
    // to escape onto instead of overlapping. The body's own line is deliberately NOT a
    // grid line: it only invited running along it, and with 160 bodies it doubled the
    // grid, which is what exhausted the search budget on dense diagrams.
    connectorSegs.forEach(s => {
        if (Math.abs(s.y1 - s.y2) < 0.1) {          // horizontal → offer lanes above/below
            yCoords.add(s.y1 - MARGIN); yCoords.add(s.y1 + MARGIN);
        }
        if (Math.abs(s.x1 - s.x2) < 0.1) {          // vertical → offer lanes left/right
            xCoords.add(s.x1 - MARGIN); xCoords.add(s.x1 + MARGIN);
        }
    });

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

    const sortedX = mergeGridCoords(Array.from(xCoords).sort((a, b) => a - b), start.x, end.x);
    const sortedY = mergeGridCoords(Array.from(yCoords).sort((a, b) => a - b), start.y, end.y);

    const startIdxX = sortedX.findIndex(x => Math.abs(x - start.x) < 0.1);
    const startIdxY = sortedY.findIndex(y => Math.abs(y - start.y) < 0.1);
    const endIdxX = sortedX.findIndex(x => Math.abs(x - end.x) < 0.1);
    const endIdxY = sortedY.findIndex(y => Math.abs(y - end.y) < 0.1);

    if (startIdxX === -1 || startIdxY === -1 || endIdxX === -1 || endIdxY === -1) {
        return calculateElbowRoute(start, end, startPos, endPos);
    }

    // ── A* over the sparse grid ─────────────────────────────────────────────────────
    // Node = (gx, gy) flattened to gy*W+gx. Open set is a binary heap on f with lazy
    // deletion (a stale entry is skipped when popped), the same shape as the WASM twin.
    // The previous version re-sorted a plain array on every pop and linear-searched it
    // on every relax, which is what made the 800-pop budget feel expensive.
    const W = sortedX.length;
    const H = sortedY.length;
    const N = W * H;
    const gScore = new Float64Array(N).fill(Infinity);
    const fScore = new Float64Array(N);
    const parent = new Int32Array(N).fill(-1);
    const dirOf = new Int8Array(N);          // 0 none, 1 horizontal, 2 vertical
    const runLen = new Float64Array(N);      // length of the straight run that reached the node
    const closed = new Uint8Array(N);
    const heap: number[] = [];
    const push = (idx: number) => {
        heap.push(idx);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (fScore[heap[p]] <= fScore[heap[i]]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]];
            i = p;
        }
    };
    const pop = (): number => {
        const top = heap[0];
        const last = heap.pop()!;
        if (heap.length > 0) {
            heap[0] = last;
            let i = 0;
            for (;;) {
                const l = 2 * i + 1, r = l + 1;
                let m = i;
                if (l < heap.length && fScore[heap[l]] < fScore[heap[m]]) m = l;
                if (r < heap.length && fScore[heap[r]] < fScore[heap[m]]) m = r;
                if (m === i) break;
                [heap[m], heap[i]] = [heap[i], heap[m]];
                i = m;
            }
        }
        return top;
    };

    const startIdx = startIdxY * W + startIdxX;
    const endIdx = endIdxY * W + endIdxX;
    gScore[startIdx] = 0;
    fScore[startIdx] = Math.abs(start.x - end.x) + Math.abs(start.y - end.y);
    push(startIdx);

    const isInsideAny = (x: number, y: number) =>
        obstacles.some(el => x > el.x + 1 && x < el.x + el.width - 1 && y > el.y + 1 && y < el.y + el.height - 1);

    // A grid segment is blocked when its midpoint comes within OBSTACLE_CLEARANCE of a
    // shape — not only when it is inside one. "Inside" alone let a route run exactly
    // along a box's border (the midpoint of a segment on the edge is not inside), which
    // is what hugging a shape looks like. Exempt: the connector's own two shapes, and
    // the segment that leaves the start point or arrives at the end point (a free end
    // may sit right beside a shape); those are blocked only when heading into a shape.
    // `lenient` = the segment touches the start or end CELL. Decided by grid index, not
    // by comparing coordinates: the start/end rows are matched with a tolerance (a port
    // at y=90.00000000000001 shares the row of a shape's midline at 90), and an exact
    // comparison then missed the final approach and blocked it.
    const isObstacleSegment = (x1: number, y1: number, x2: number, y2: number, lenient: boolean) => {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        return obstacles.some(el => {
            // The connector's own shapes, and any shape next to the segment that leaves
            // the start / arrives at the end, only block a segment heading INTO them: a
            // route is legitimately within clearance of its own shape right at the port.
            // (A stricter "no run along an own edge" rule was tried and measured: it cut
            // one 1px skim — which the 2px grid merge removes anyway — and more than
            // doubled lane overlaps in tight corridors. Not worth it.)
            const own = el.id === startElement?.id || el.id === endElement?.id;
            if (own || lenient) {
                return mx > el.x + 3 && mx < el.x + el.width - 3 && my > el.y + 3 && my < el.y + el.height - 3;
            }
            return mx > el.x - OBSTACLE_CLEARANCE && mx < el.x + el.width + OBSTACLE_CLEARANCE &&
                my > el.y - OBSTACLE_CLEARANCE && my < el.y + el.height + OBSTACLE_CLEARANCE;
        });
    };

    const isCardinal = (p?: string) => ['top', 'bottom', 'left', 'right'].includes(p || '');
    const startConstrained = isCardinal(startPos);
    const endRequired = isCardinal(endPos)
        ? ({ top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const)[endPos as 'top' | 'bottom' | 'left' | 'right']
        : null;

    const neighbors = [
        { dx: -1, dy: 0, dir: 1, name: 'left' },
        { dx: 1, dy: 0, dir: 1, name: 'right' },
        { dx: 0, dy: -1, dir: 2, name: 'top' },
        { dx: 0, dy: 1, dir: 2, name: 'bottom' },
    ] as const;

    let iterations = 0;
    while (heap.length > 0 && iterations < MAX_ROUTE_ITERATIONS) {
        iterations++;
        const current = pop();
        if (closed[current]) continue;          // stale heap entry

        if (current === endIdx) {
            const path: Point[] = [];
            for (let c = current; c >= 0; c = parent[c]) {
                path.push({ x: sortedX[c % W], y: sortedY[(c / W) | 0] });
            }
            return cleanPath(path.reverse());
        }
        closed[current] = 1;

        const cgx = current % W;
        const cgy = (current / W) | 0;
        const xPrev = sortedX[cgx];
        const yPrev = sortedY[cgy];
        const curDir = dirOf[current];
        const curG = gScore[current];

        for (const nb of neighbors) {
            const nx = cgx + nb.dx;
            const ny = cgy + nb.dy;
            if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
            const nIdx = ny * W + nx;
            if (closed[nIdx]) continue;

            // Leave the start shape square to its side, and arrive at the end shape
            // square to its side — only when the caller knows the side.
            if (current === startIdx && startConstrained && nb.name !== startPos) continue;
            if (nIdx === endIdx && endRequired && nb.name !== endRequired) continue;

            const xNext = sortedX[nx];
            const yNext = sortedY[ny];
            const touchesEnds = current === startIdx || nIdx === startIdx || current === endIdx || nIdx === endIdx;
            if (isObstacleSegment(xPrev, yPrev, xNext, yNext, touchesEnds)) continue;

            const dist = Math.abs(xNext - xPrev) + Math.abs(yNext - yPrev);
            const turning = curDir !== 0 && curDir !== nb.dir;
            // A turn right after a short straight run is a jog — the 5px zigzag a route
            // makes to dodge a lane for a few pixels. Judged on the run BEHIND the node:
            // a short step that continues straight (two lanes 5px apart feeding the same
            // port) merges into one segment and is not a jog. Priced above an overlap.
            const jog = turning && runLen[current] > 0 && runLen[current] < MIN_RUN;
            const turnPenalty = turning ? (jog ? 100 + JOG_PENALTY : 100) : 0;
            // Prefer points outside obstacles
            const obstacleAvoidancePenalty = isInsideAny(xNext, yNext) ? 500 : 0;
            // Soft-avoid running along another connector's body (collinear overlap).
            // Soft, so routing still succeeds when congestion leaves no clear lane.
            const connectorPenalty = connectorSegs.length > 0 &&
                connectorSegs.some(s => segmentsCollinearOverlap(xPrev, yPrev, xNext, yNext, s))
                ? CONNECTOR_PENALTY : 0;
            const newG = curG + dist + turnPenalty + obstacleAvoidancePenalty + connectorPenalty;

            if (newG < gScore[nIdx]) {
                gScore[nIdx] = newG;
                fScore[nIdx] = newG + Math.abs(xNext - end.x) + Math.abs(yNext - end.y);
                parent[nIdx] = current;
                dirOf[nIdx] = nb.dir;
                runLen[nIdx] = turning || curDir === 0 ? dist : runLen[current] + dist;
                push(nIdx);
            }
        }
    }

    return calculateElbowRoute(start, end, startPos, endPos);
};
