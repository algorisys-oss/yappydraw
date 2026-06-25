/**
 * Pathfinder / boolean operations on shapes.
 *
 * Each element is flattened to world-space polygon rings (curves sampled to a
 * tolerance — a quality trade-off noted in the roadmap), the requested boolean is run
 * via `polygon-clipping`, and the result polygons are converted to corner-anchor
 * subpaths for new `path` elements. A polygon's outer ring + any inner rings (holes)
 * become a multi-subpath path rendered with the even-odd fill rule.
 */

import polygonClipping from 'polygon-clipping';
import type { DrawingElement, PathAnchor, PathSubpath } from '../types';
import { getShapeGeometry } from './shape-geometry';
import { PathUtils } from './math/path-utils';

export type BooleanOp = 'union' | 'subtract' | 'intersect' | 'exclude';

export type Ring = [number, number][];
export type Poly = Ring[];
type MultiPoly = Poly[];

function ringFromPoints(pts: { x: number; y: number }[]): Ring {
    const r: Ring = pts.map(p => [p.x, p.y]);
    if (r.length > 1) {
        const a = r[0], b = r[r.length - 1];
        if (a[0] !== b[0] || a[1] !== b[1]) r.push([a[0], a[1]]);
    }
    return r;
}

/** Flatten one shape's geometry into world-space rings (one polygon per ring). */
function geometryToRings(geo: any, cx: number, cy: number): Ring[] {
    const W = (x: number, y: number): [number, number] => [cx + x, cy + y];
    if (!geo) return [];
    if (geo.type === 'rect') {
        const { x, y, w, h } = geo;
        return [[W(x, y), W(x + w, y), W(x + w, y + h), W(x, y + h), W(x, y)]];
    }
    if (geo.type === 'ellipse') {
        const N = 64; const r: Ring = [];
        for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2; r.push(W(geo.cx + Math.cos(a) * geo.rx, geo.cy + Math.sin(a) * geo.ry)); }
        return [r];
    }
    if (geo.type === 'points') {
        return [ringFromPoints(geo.points.map((p: any) => ({ x: cx + p.x, y: cy + p.y })))];
    }
    if (geo.type === 'path') {
        const cmds = PathUtils.parsePath(geo.path);
        if (!cmds.length) return [];
        const N = 96; const pts: { x: number; y: number }[] = [];
        for (let i = 0; i <= N; i++) { const p = PathUtils.getPointOnPath(cmds, i / N); pts.push({ x: cx + p.x, y: cy + p.y }); }
        return [ringFromPoints(pts)];
    }
    if (geo.type === 'multi') {
        return geo.shapes.flatMap((s: any) => geometryToRings(s, cx, cy));
    }
    return [];
}

/** A single element as a MultiPolygon (each ring a disjoint polygon). */
export function elementToMultiPolygon(el: DrawingElement): MultiPoly {
    const geo = getShapeGeometry(el);
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    return geometryToRings(geo, cx, cy).filter(r => r.length >= 4).map(r => [r]);
}

/** Outer-ring of a result polygon → corner anchors (relative to its own bbox). */
export function ringToPathAnchors(ring: Ring): { anchors: PathAnchor[]; minX: number; minY: number; width: number; height: number } | null {
    // Drop the duplicated closing point.
    let pts = ring.slice();
    if (pts.length > 1) {
        const a = pts[0], b = pts[pts.length - 1];
        if (a[0] === b[0] && a[1] === b[1]) pts = pts.slice(0, -1);
    }
    if (pts.length < 3) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of pts) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
    const anchors: PathAnchor[] = pts.map(([x, y]) => ({ x: x - minX, y: y - minY, kind: 'corner' as const }));
    return { anchors, minX, minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

/** Drop the duplicated closing point and return a clean ring (≥3 distinct points) or null. */
function cleanRing(ring: Ring): Ring | null {
    let pts = ring.slice();
    if (pts.length > 1) {
        const a = pts[0], b = pts[pts.length - 1];
        if (a[0] === b[0] && a[1] === b[1]) pts = pts.slice(0, -1);
    }
    return pts.length >= 3 ? pts : null;
}

/**
 * A result polygon (outer ring + holes) → multiple corner-anchor subpaths, all relative
 * to the polygon's combined bbox. The outer ring + every inner hole become subpaths;
 * even-odd fill turns the inner rings into holes. Returns null if the outer ring is degenerate.
 */
export function polyToPathSubpaths(poly: Poly): { subpaths: PathSubpath[]; minX: number; minY: number; width: number; height: number } | null {
    const rings = poly.map(cleanRing).filter((r): r is Ring => !!r);
    if (rings.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const r of rings) for (const [x, y] of r) {
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    const subpaths: PathSubpath[] = rings.map(r => ({
        anchors: r.map(([x, y]) => ({ x: x - minX, y: y - minY, kind: 'corner' as const })),
        closed: true,
    }));
    return { subpaths, minX, minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

/**
 * Run a boolean op over elements (in the given order — `subtract` is first minus the
 * rest). Returns the result polygons (world-space; each = outer ring + holes), or [] if empty.
 */
export function runBooleanOp(elements: DrawingElement[], op: BooleanOp): Poly[] {
    if (elements.length < 2) return [];
    const polys = elements.map(elementToMultiPolygon).filter(mp => mp.length > 0);
    if (polys.length < 2) return [];
    const [first, ...rest] = polys;
    let result: MultiPoly;
    try {
        if (op === 'union') result = polygonClipping.union(first, ...rest) as MultiPoly;
        else if (op === 'intersect') result = polygonClipping.intersection(first, ...rest) as MultiPoly;
        else if (op === 'exclude') result = polygonClipping.xor(first, ...rest) as MultiPoly;
        else result = polygonClipping.difference(first, ...rest) as MultiPoly; // subtract
    } catch {
        return [];
    }
    // Each result polygon keeps its outer ring + any holes (even-odd subpaths downstream).
    return (result || []).filter(poly => poly && poly.length > 0 && poly[0] && poly[0].length >= 4);
}

// ── Face-level Shape Builder ─────────────────────────────────────────────────
// Decompose a set of (overlapping) shapes into atomic "faces" — the maximal
// regions each bounded by a unique subset of the input shapes. This is what
// Illustrator's Shape Builder operates on: you paint over individual faces (e.g.
// just the lens where two circles overlap) to merge or delete them, rather than
// whole shapes.

/** A maximal region covered by exactly the shapes in `subset` (indices into the input). */
export interface ShapeFace {
    key: string;          // stable id = sorted subset, e.g. "0|2"
    subset: number[];     // indices of input elements covering this face
    region: MultiPoly;    // world-space geometry (outer ring + holes per poly)
}

function multiPolyArea(mp: MultiPoly): number {
    let area = 0;
    for (const poly of mp) {
        for (const ring of poly) {
            let a = 0;
            for (let i = 0, n = ring.length - 1; i < n; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
            area += Math.abs(a) / 2;
        }
    }
    return area;
}

/** Point-in-region test honouring holes: inside an odd number of rings of any poly. */
export function pointInMultiPoly(mp: MultiPoly, x: number, y: number): boolean {
    for (const poly of mp) {
        let inside = false;
        for (const ring of poly) {
            for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
                if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-12) + xi)) inside = !inside;
            }
        }
        if (inside) return true;
    }
    return false;
}

/**
 * Compute the atomic faces of `elements`. For every non-empty subset S of the
 * inputs, the face is `(∩ shapes in S) − (∪ shapes not in S)`; empty results are
 * dropped. Bounded to `maxN` shapes (2^N subsets) — callers should fall back to
 * whole-shape union beyond that. Faces are returned largest-first so a stroke
 * point that lands on overlapping faces (it shouldn't, they're disjoint) is stable.
 */
export function computeShapeFaces(elements: DrawingElement[], maxN = 8): ShapeFace[] {
    const mps = elements.map(elementToMultiPolygon);
    const n = mps.length;
    if (n < 2 || n > maxN) return [];
    const faces: ShapeFace[] = [];
    for (let mask = 1; mask < (1 << n); mask++) {
        const subset: number[] = [];
        for (let i = 0; i < n; i++) if (mask & (1 << i)) subset.push(i);
        const inside = subset.map(i => mps[i]).filter(mp => mp.length);
        if (inside.length !== subset.length) continue; // some shape had no geometry
        let region: MultiPoly;
        try {
            region = inside.length === 1 ? inside[0]
                : polygonClipping.intersection(inside[0] as any, ...inside.slice(1) as any) as MultiPoly;
            if (!region || !region.length) continue;
            const outside = mps.filter((_, i) => !subset.includes(i)).filter(mp => mp.length);
            if (outside.length) {
                region = polygonClipping.difference(region as any, ...outside as any) as MultiPoly;
            }
        } catch { continue; }
        region = (region || []).filter(p => p && p[0] && p[0].length >= 4);
        if (!region.length || multiPolyArea(region) < 0.5) continue;
        faces.push({ key: subset.join('|'), subset, region });
    }
    faces.sort((a, b) => multiPolyArea(b.region) - multiPolyArea(a.region));
    return faces;
}

/**
 * Knife — split a region into the two pieces lying on either side of the infinite line
 * through p0→p1. Builds a large half-plane quad per side and intersects. Returns
 * [posSide, negSide]; a side is [] when the line misses the region on that side.
 */
export function splitMultiPolyByLine(mp: MultiPoly, p0: [number, number], p1: [number, number]): [MultiPoly, MultiPoly] {
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;   // along line
    const nx = -uy, ny = ux;              // normal
    const L = 1e6;
    const A: [number, number] = [p0[0] - ux * L, p0[1] - uy * L];
    const B: [number, number] = [p1[0] + ux * L, p1[1] + uy * L];
    const posQuad: Poly = [[A, B, [B[0] + nx * L, B[1] + ny * L], [A[0] + nx * L, A[1] + ny * L], A]];
    const negQuad: Poly = [[A, B, [B[0] - nx * L, B[1] - ny * L], [A[0] - nx * L, A[1] - ny * L], A]];
    let pos: MultiPoly = [], neg: MultiPoly = [];
    try { pos = polygonClipping.intersection(mp as any, [posQuad] as any) as MultiPoly; } catch { /* noop */ }
    try { neg = polygonClipping.intersection(mp as any, [negQuad] as any) as MultiPoly; } catch { /* noop */ }
    const clean = (m: MultiPoly) => (m || []).filter(p => p && p[0] && p[0].length >= 4);
    return [clean(pos), clean(neg)];
}

/** Union several faces' regions into one MultiPoly (empty → []). */
export function unionFaces(faces: ShapeFace[]): MultiPoly {
    const regions = faces.map(f => f.region).filter(r => r.length);
    if (!regions.length) return [];
    if (regions.length === 1) return regions[0];
    try {
        return polygonClipping.union(regions[0] as any, ...regions.slice(1) as any) as MultiPoly;
    } catch { return regions[0]; }
}
