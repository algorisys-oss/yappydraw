import type { DrawingElement, Point } from "../types";

/**
 * Connector bodies as soft obstacles for the elbow router (routing-channel Phase 3).
 *
 * Kept in its OWN module with no imports beyond types: both the JS router
 * (`utils/routing.ts`) and the WASM bridge (`wasm/bridge/routing-bridge.ts`) consume
 * it, and importing it from `routing.ts` would create a cycle (routing ↔ bridge).
 * Having one source of truth also guarantees the JS and WASM paths see an identical
 * obstacle set — only the A* penalty itself is duplicated in AssemblyScript.
 */

/** An axis-aligned world-space segment of an already-routed connector. */
export interface Seg { x1: number; y1: number; x2: number; y2: number; }

const ELBOW_CONNECTOR_TYPES = new Set(['line', 'arrow', 'bezier', 'organicBranch']);

/** Soft cost for routing along another connector's body. Must match CONNECTOR_PENALTY
 *  in wasm/assemblyscript/assembly/routing.ts. */
export const CONNECTOR_PENALTY = 400;

/**
 * Hard ceiling on segments fed to the router. Each segment injects up to 4 grid
 * coordinates; the A* grid is capped at 256 per axis (and the WASM bridge bails
 * above that), so an unbounded set would blow up the grid, exhaust the 800-iteration
 * A* budget and silently degrade routing to a naive elbow. Keep this well under that.
 */
export const MAX_CONNECTOR_SEGMENTS = 160;

/** Padding around the start/end box used to decide which connectors are relevant.
 *  Matches the shape-obstacle filter in utils/routing.ts. */
const NEIGHBOURHOOD_PAD = 100;

export interface Bounds { minX: number; maxX: number; minY: number; maxY: number; }

/** The start/end neighbourhood a route can plausibly occupy. */
export const routeBounds = (start: Point, end: Point): Bounds => ({
    minX: Math.min(start.x, end.x) - NEIGHBOURHOOD_PAD,
    maxX: Math.max(start.x, end.x) + NEIGHBOURHOOD_PAD,
    minY: Math.min(start.y, end.y) - NEIGHBOURHOOD_PAD,
    maxY: Math.max(start.y, end.y) + NEIGHBOURHOOD_PAD,
});

/** Element types that are connectors — never obstacles for another connector. */
const CONNECTOR_TYPES = new Set(['line', 'arrow', 'bezier', 'organicBranch']);

/** `inner`'s box lies within `outer`'s (1px tolerance): `outer` is a container of it. */
const enclosesElement = (outer: DrawingElement, inner: DrawingElement): boolean =>
    inner.x >= outer.x - 1 && inner.y >= outer.y - 1 &&
    inner.x + inner.width <= outer.x + outer.width + 1 &&
    inner.y + inner.height <= outer.y + outer.height + 1;

/** `p` lies strictly inside `el`'s box. */
const enclosesPoint = (el: DrawingElement, p: Point): boolean =>
    p.x > el.x + 1 && p.x < el.x + el.width - 1 && p.y > el.y + 1 && p.y < el.y + el.height - 1;

/**
 * The shapes an elbow route must steer around. ONE filter for the JS router and the
 * WASM bridge, so both A* paths see the same obstacle set.
 *
 * Three rules:
 * - Connectors and text are never obstacles.
 * - Only shapes near the start→end box matter (`routeBounds`); the rest cannot
 *   affect the route and would only bloat the grid.
 * - **A container is not an obstacle.** A frame, pool, cluster box or any shape that
 *   encloses the start or the end (its shape, or the bare point when an end is
 *   unbound) is where the route LIVES, not something it goes around. Treated as a
 *   solid, it hard-blocked every move out of the start cell, A* died on its first
 *   iteration and every connector inside a VPC/swimlane silently got the naive
 *   mid-point elbow — straight through whatever sat between its ends.
 */
export const collectShapeObstacles = (
    start: Point,
    end: Point,
    allElements: DrawingElement[],
    startElement?: DrawingElement,
    endElement?: DrawingElement,
    extra?: Bounds,
): DrawingElement[] => {
    const b0 = routeBounds(start, end);
    // The region the route may use: its own neighbourhood, plus whatever the caller
    // already knows the grid reaches (connector lanes), grown below.
    const b: Bounds = extra
        ? { minX: Math.min(b0.minX, extra.minX), maxX: Math.max(b0.maxX, extra.maxX), minY: Math.min(b0.minY, extra.minY), maxY: Math.max(b0.maxY, extra.maxY) }
        : { ...b0 };
    const candidates: DrawingElement[] = [];
    for (const el of allElements) {
        if (CONNECTOR_TYPES.has(el.type) || el.type === 'text') continue;
        const isEndpointShape = (startElement && el.id === startElement.id) || (endElement && el.id === endElement.id);
        if (!isEndpointShape) {
            const holdsStart = startElement ? enclosesElement(el, startElement) : enclosesPoint(el, start);
            const holdsEnd = endElement ? enclosesElement(el, endElement) : enclosesPoint(el, end);
            if (holdsStart || holdsEnd) continue;
        }
        candidates.push(el);
    }
    // Every obstacle adds grid lines MARGIN outside its box, so the route can travel
    // there — where a shape just beyond the original neighbourhood would be unknown
    // and get cut through. Grow the region by each included shape until it settles
    // (a few passes at most), so every shape the grid can reach is an obstacle.
    const out: DrawingElement[] = [];
    const taken = new Set<string>();
    for (let pass = 0; pass < 4; pass++) {
        let grew = false;
        for (const el of candidates) {
            if (taken.has(el.id)) continue;
            if (el.x > b.maxX || el.x + el.width < b.minX || el.y > b.maxY || el.y + el.height < b.minY) continue;
            taken.add(el.id);
            out.push(el);
            const x1 = el.x - OBSTACLE_REACH, x2 = el.x + el.width + OBSTACLE_REACH;
            const y1 = el.y - OBSTACLE_REACH, y2 = el.y + el.height + OBSTACLE_REACH;
            if (x1 < b.minX) { b.minX = x1; grew = true; }
            if (x2 > b.maxX) { b.maxX = x2; grew = true; }
            if (y1 < b.minY) { b.minY = y1; grew = true; }
            if (y2 > b.maxY) { b.maxY = y2; grew = true; }
        }
        if (!grew) break;
    }
    return out;
};

/** How far outside a shape the router lays grid lines (its MARGIN); the region grows by it. */
const OBSTACLE_REACH = 15;

/** The box around a set of connector body segments (the lanes the grid will contain). */
export const segmentBounds = (segs: Seg[]): Bounds | undefined => {
    if (segs.length === 0) return undefined;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const s of segs) {
        minX = Math.min(minX, s.x1, s.x2); maxX = Math.max(maxX, s.x1, s.x2);
        minY = Math.min(minY, s.y1, s.y2); maxY = Math.max(maxY, s.y1, s.y2);
    }
    return { minX: minX - OBSTACLE_REACH, maxX: maxX + OBSTACLE_REACH, minY: minY - OBSTACLE_REACH, maxY: maxY + OBSTACLE_REACH };
};

/** Read a connector's stored points (flat number[] or {x,y}[]) as world-space {x,y}. */
const connectorWorldPoints = (el: DrawingElement): Point[] => {
    const pts = el.points;
    if (!pts || pts.length < 2) return [];
    const out: Point[] = [];
    if (typeof pts[0] === 'number') {
        const flat = pts as number[];
        for (let i = 0; i + 1 < flat.length; i += 2) out.push({ x: el.x + flat[i], y: el.y + flat[i + 1] });
    } else {
        for (const p of pts as Point[]) out.push({ x: el.x + p.x, y: el.y + p.y });
    }
    return out;
};

/**
 * Collect axis-aligned body segments of OTHER elbow connectors that `selfLine` should
 * avoid running along. Deterministic priority prevents A↔B oscillation: a connector
 * only avoids connectors with a smaller `id`.
 *
 * Connectors that share a bound shape are NOT exempt (they used to be, on the theory
 * that ports keep them apart). Ports separate their ENDPOINTS; their mid-runs were
 * still free to collapse onto one trunk — three arrows fanning out of one box along a
 * single line, which is the most common overlap in a system diagram.
 */
export const collectConnectorSegments = (
    selfLine: DrawingElement,
    allElements: DrawingElement[],
    bounds?: Bounds
): Seg[] => {
    const segs: Seg[] = [];

    for (const el of allElements) {
        if (el.id === selfLine.id) continue;
        if (!ELBOW_CONNECTOR_TYPES.has(el.type)) continue;
        if (el.curveType !== 'elbow') continue;
        // Priority: only avoid lower-id connectors → strict DAG, no oscillation.
        if (!(el.id < selfLine.id)) continue;

        // Bbox reject before collecting: a connector far from this route can never
        // affect it, and including it would only bloat the A* grid. The box is the
        // DRAWN route's (every waypoint), not the start→end chord's: a detour runs
        // outside the chord box by definition, and testing the chord box dropped
        // exactly the connectors whose detours this route was about to run along.
        const pts = connectorWorldPoints(el);
        if (bounds && pts.length) {
            let bx1 = Infinity, bx2 = -Infinity, by1 = Infinity, by2 = -Infinity;
            for (const p of pts) { bx1 = Math.min(bx1, p.x); bx2 = Math.max(bx2, p.x); by1 = Math.min(by1, p.y); by2 = Math.max(by2, p.y); }
            if (bx1 > bounds.maxX || bx2 < bounds.minX || by1 > bounds.maxY || by2 < bounds.minY) continue;
        }

        for (let i = 0; i + 1 < pts.length; i++) {
            segs.push({ x1: pts[i].x, y1: pts[i].y, x2: pts[i + 1].x, y2: pts[i + 1].y });
            if (segs.length >= MAX_CONNECTOR_SEGMENTS) return segs; // bounded: protects the grid
        }
    }
    return segs;
};

/**
 * True when the candidate grid segment (cx,cy)→(nx,ny) runs COLLINEARLY on top of
 * `seg` (same axis, same line within `tol`, overlapping extents). Plain crossings are
 * intentionally NOT flagged — only bodies drawn along each other are the ugly case.
 */
export const segmentsCollinearOverlap = (
    cx: number, cy: number, nx: number, ny: number, seg: Seg, tol = 2
): boolean => {
    const candH = Math.abs(cy - ny) < 0.1; // candidate horizontal
    const candV = Math.abs(cx - nx) < 0.1; // candidate vertical
    const segH = Math.abs(seg.y1 - seg.y2) < 0.1;
    const segV = Math.abs(seg.x1 - seg.x2) < 0.1;

    if (candH && segH) {
        if (Math.abs(cy - seg.y1) > tol) return false;
        const [a1, a2] = cx < nx ? [cx, nx] : [nx, cx];
        const [b1, b2] = seg.x1 < seg.x2 ? [seg.x1, seg.x2] : [seg.x2, seg.x1];
        return Math.min(a2, b2) - Math.max(a1, b1) > tol; // overlap length beyond tol
    }
    if (candV && segV) {
        if (Math.abs(cx - seg.x1) > tol) return false;
        const [a1, a2] = cy < ny ? [cy, ny] : [ny, cy];
        const [b1, b2] = seg.y1 < seg.y2 ? [seg.y1, seg.y2] : [seg.y2, seg.y1];
        return Math.min(a2, b2) - Math.max(a1, b1) > tol;
    }
    return false;
};

/**
 * Collapse grid coordinates closer than GRID_MERGE (2px) to one line. Two rows a pixel apart
 * (a port at 336, a lane at 337) made the router step 1px at the very end — a visible
 * stub. The start and end values survive untouched (they are looked up exactly); any
 * other value within GRID_MERGE of a kept one is dropped. Lives here, not in
 * routing.ts, because the WASM bridge needs it too and routing imports the bridge.
 */
export const GRID_MERGE = 2;
export const mergeGridCoords = (sorted: number[], ...keep: number[]): number[] => {
    const out: number[] = [];
    const isKept = (v: number) => keep.some(k => Math.abs(k - v) < 0.1);
    for (const v of sorted) {
        const last = out[out.length - 1];
        if (last !== undefined && v - last < GRID_MERGE) {
            if (isKept(v) && !isKept(last)) out[out.length - 1] = v;   // prefer the exact port value
            continue;
        }
        out.push(v);
    }
    return out;
};

