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
export const MAX_CONNECTOR_SEGMENTS = 48;

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
 * only avoids connectors with a smaller `id`, and never ones that share a bound
 * endpoint element (those converge at ports by design — Phases 1–2).
 */
export const collectConnectorSegments = (
    selfLine: DrawingElement,
    allElements: DrawingElement[],
    bounds?: Bounds
): Seg[] => {
    const selfStart = selfLine.startBinding?.elementId;
    const selfEnd = selfLine.endBinding?.elementId;
    const segs: Seg[] = [];

    for (const el of allElements) {
        if (el.id === selfLine.id) continue;
        if (!ELBOW_CONNECTOR_TYPES.has(el.type)) continue;
        if (el.curveType !== 'elbow') continue;
        // Priority: only avoid lower-id connectors → strict DAG, no oscillation.
        if (!(el.id < selfLine.id)) continue;
        // Skip connectors sharing a bound endpoint with self (handled by port allocation).
        const oStart = el.startBinding?.elementId;
        const oEnd = el.endBinding?.elementId;
        if (oStart && (oStart === selfStart || oStart === selfEnd)) continue;
        if (oEnd && (oEnd === selfStart || oEnd === selfEnd)) continue;

        // Cheap bbox reject before touching points: a connector far from this route
        // can never affect it, and including it would only bloat the A* grid.
        if (bounds) {
            const bx1 = Math.min(el.x, el.x + el.width), bx2 = Math.max(el.x, el.x + el.width);
            const by1 = Math.min(el.y, el.y + el.height), by2 = Math.max(el.y, el.y + el.height);
            if (bx1 > bounds.maxX || bx2 < bounds.minX || by1 > bounds.maxY || by2 < bounds.minY) continue;
        }

        // NOTE: filter at connector level only — never per segment. A connector's
        // detour segments deliberately leave its own start→end box (that is what a
        // detour is), so clipping segment-by-segment would drop precisely the
        // segments this route needs to avoid.
        const pts = connectorWorldPoints(el);
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
