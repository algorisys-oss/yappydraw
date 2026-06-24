/**
 * Pathfinder / boolean operations on shapes.
 *
 * Each element is flattened to world-space polygon rings (curves sampled to a
 * tolerance — a quality trade-off noted in the roadmap), the requested boolean is run
 * via `polygon-clipping`, and the result rings are converted to corner-anchor
 * `pathAnchors` for new `path` elements. Holes (inner rings) are dropped in this first
 * version — a single-subpath `path` can't render them yet.
 */

import polygonClipping from 'polygon-clipping';
import type { DrawingElement, PathAnchor } from '../types';
import { getShapeGeometry } from './shape-geometry';
import { PathUtils } from './math/path-utils';

export type BooleanOp = 'union' | 'subtract' | 'intersect' | 'exclude';

type Ring = [number, number][];
type Poly = Ring[];
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
function elementToMultiPolygon(el: DrawingElement): MultiPoly {
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

/**
 * Run a boolean op over elements (in the given order — `subtract` is first minus the
 * rest). Returns the result polygons' outer rings (world-space), or [] if empty.
 */
export function runBooleanOp(elements: DrawingElement[], op: BooleanOp): Ring[] {
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
    // Each result polygon: ring[0] is the outer boundary (holes dropped for now).
    return (result || []).map(poly => poly[0]).filter(r => r && r.length >= 4);
}
