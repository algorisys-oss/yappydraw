/**
 * Outline-stroke and offset-path operations for vector paths / shapes.
 *
 * - **Outline stroke** turns a stroked centerline into a filled outline: the Minkowski
 *   sum of the polyline with a disk of radius strokeWidth/2 — built as the union of a
 *   rectangle per segment plus a disk per vertex (round joins/caps), via polygon-clipping.
 *   Works for open and closed paths (a closed path's inner hole is dropped — single-
 *   subpath limitation).
 * - **Offset path** moves the outline in/out by a distance (miter join with a bevel
 *   clamp), cleaned of self-intersections with a polygon-clipping union.
 *
 * Both flatten curves to a polyline first (corner-anchor results), like the booleans.
 */

import polygonClipping from 'polygon-clipping';
import type { DrawingElement } from '../types';
import { getShapeGeometry } from './shape-geometry';
import { PathUtils } from './math/path-utils';

type Pt = { x: number; y: number };
type Ring = [number, number][];

/** Sample an element's outline to a world-space polyline (+ closed flag). */
export function samplePathPolyline(el: DrawingElement): { pts: Pt[]; closed: boolean } | null {
    const geo = getShapeGeometry(el);
    if (!geo) return null;
    const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
    const W = (x: number, y: number): Pt => ({ x: cx + x, y: cy + y });
    let pts: Pt[] = [];
    let closed = true;
    if (geo.type === 'points') {
        pts = geo.points.map((p: any) => W(p.x, p.y));
        closed = geo.isClosed !== false;
    } else if (geo.type === 'rect') {
        const { x, y, w, h } = geo;
        pts = [W(x, y), W(x + w, y), W(x + w, y + h), W(x, y + h)];
    } else {
        const path = geo.type === 'path' ? geo.path
            : geo.type === 'ellipse'
                ? `M ${geo.cx - geo.rx} ${geo.cy} C ${geo.cx - geo.rx} ${geo.cy - geo.ry * 0.5523} ${geo.cx - geo.rx * 0.5523} ${geo.cy - geo.ry} ${geo.cx} ${geo.cy - geo.ry} C ${geo.cx + geo.rx * 0.5523} ${geo.cy - geo.ry} ${geo.cx + geo.rx} ${geo.cy - geo.ry * 0.5523} ${geo.cx + geo.rx} ${geo.cy} C ${geo.cx + geo.rx} ${geo.cy + geo.ry * 0.5523} ${geo.cx + geo.rx * 0.5523} ${geo.cy + geo.ry} ${geo.cx} ${geo.cy + geo.ry} C ${geo.cx - geo.rx * 0.5523} ${geo.cy + geo.ry} ${geo.cx - geo.rx} ${geo.cy + geo.ry * 0.5523} ${geo.cx - geo.rx} ${geo.cy} Z`
                : undefined;
        if (!path) return null;
        const cmds = PathUtils.parsePath(path);
        if (!cmds.length) return null;
        const N = 80;
        for (let i = 0; i <= N; i++) { const p = PathUtils.getPointOnPath(cmds, i / N); pts.push(W(p.x, p.y)); }
        // Drop a duplicated closing sample.
        if (pts.length > 1 && Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) < 0.01) pts.pop();
        closed = el.type === 'path' ? (el.pathClosed ?? false) : true;
    }
    return pts.length >= 2 ? { pts, closed } : null;
}

function circleRing(c: Pt, r: number, n = 16): Ring {
    const ring: Ring = [];
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; ring.push([c.x + Math.cos(a) * r, c.y + Math.sin(a) * r]); }
    return ring;
}

/** Minkowski stroke outline: union of segment rects + vertex disks. Returns outer rings. */
export function computeOutlineStroke(el: DrawingElement): Ring[] {
    const poly = samplePathPolyline(el);
    if (!poly) return [];
    const r = Math.max(0.5, (el.strokeWidth || 1) / 2);
    const { pts, closed } = poly;
    const parts: Ring[][] = [];
    const segCount = closed ? pts.length : pts.length - 1;
    for (let i = 0; i < segCount; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        const dx = b.x - a.x, dy = b.y - a.y; const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * r, ny = (dx / len) * r;
        parts.push([[[a.x + nx, a.y + ny], [b.x + nx, b.y + ny], [b.x - nx, b.y - ny], [a.x - nx, a.y - ny], [a.x + nx, a.y + ny]]]);
    }
    for (const p of pts) parts.push([circleRing(p, r, 16)]); // round joins + caps
    if (parts.length === 0) return [];
    let result: any;
    try { result = polygonClipping.union(parts[0] as any, ...(parts.slice(1) as any)); } catch { return []; }
    return (result || []).map((poly2: any) => poly2[0]).filter((ring: Ring) => ring && ring.length >= 4);
}

/** Offset the (closed) outline by `d` (outward +, inward −); cleaned via union. */
export function computeOffsetPath(el: DrawingElement, d: number): Ring[] {
    const poly = samplePathPolyline(el);
    if (!poly || poly.pts.length < 3) return [];
    const pts = poly.pts;
    const n = pts.length;
    const norm = (x: number, y: number) => { const l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l }; };
    // Orient so positive `d` always grows the outline outward, regardless of winding.
    let area = 0;
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a.x * b.y - b.x * a.y; }
    const dd = area > 0 ? -d : d;
    const out: Ring = [];
    for (let i = 0; i < n; i++) {
        const prev = pts[(i - 1 + n) % n], cur = pts[i], next = pts[(i + 1) % n];
        const e1 = norm(cur.x - prev.x, cur.y - prev.y); const n1 = { x: -e1.y, y: e1.x };
        const e2 = norm(next.x - cur.x, next.y - cur.y); const n2 = { x: -e2.y, y: e2.x };
        let mx = n1.x + n2.x, my = n1.y + n2.y; const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml;
        const cosHalf = Math.max(0.25, mx * n1.x + my * n1.y); // clamp miter spikes
        const miter = 1 / cosHalf;
        out.push([cur.x + mx * dd * miter, cur.y + my * dd * miter]);
    }
    out.push([out[0][0], out[0][1]]);
    let result: any;
    try { result = polygonClipping.union([out] as any); } catch { return [[...out]]; }
    return (result || []).map((poly2: any) => poly2[0]).filter((ring: Ring) => ring && ring.length >= 4);
}
