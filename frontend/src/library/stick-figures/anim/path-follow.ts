/**
 * Walk-along-a-path support: sample an arbitrary path element into a world-space
 * polyline with arc-length parameterisation, so an animated figure can traverse it
 * at constant speed (feet planted, auto-facing the direction of travel).
 */
import type { DrawingElement } from '../../../types';

export interface PathSample {
    /** World-space points along the path. */
    pts: Array<[number, number]>;
    /** Cumulative arc length at each point. */
    cum: number[];
    /** Total length. */
    len: number;
}

/** Element types we can treat as a walkable path. */
export function isPathLike(el: DrawingElement): boolean {
    return !!(
        (el.pathSubpaths && el.pathSubpaths.length) ||
        (el.pathAnchors && el.pathAnchors.length) ||
        ((el as any).points && (el as any).points.length)
    ) || ['path', 'line', 'arrow', 'bezier', 'polyline', 'elbow', 'fineliner', 'inkbrush', 'marker', 'ink'].includes(el.type);
}

/** Flatten a cubic between two anchors (with in/out handles) into points. */
function sampleAnchors(anchors: any[], out: Array<[number, number]>): void {
    if (!anchors || !anchors.length) return;
    out.push([anchors[0].x, anchors[0].y]);
    for (let i = 0; i < anchors.length - 1; i++) {
        const a = anchors[i], b = anchors[i + 1];
        const hasCurve = a.outX !== undefined || b.inX !== undefined;
        if (!hasCurve) { out.push([b.x, b.y]); continue; }
        const c1x = a.x + (a.outX || 0), c1y = a.y + (a.outY || 0);
        const c2x = b.x + (b.inX || 0), c2y = b.y + (b.inY || 0);
        const N = 12;
        for (let s = 1; s <= N; s++) {
            const u = s / N, iu = 1 - u;
            const x = iu * iu * iu * a.x + 3 * iu * iu * u * c1x + 3 * iu * u * u * c2x + u * u * u * b.x;
            const y = iu * iu * iu * a.y + 3 * iu * iu * u * c1y + 3 * iu * u * u * c2y + u * u * u * b.y;
            out.push([x, y]);
        }
    }
}

/** Local polyline (relative to element origin) for a path-like element. */
function localPolyline(el: DrawingElement): Array<[number, number]> {
    const out: Array<[number, number]> = [];
    if (el.pathSubpaths && el.pathSubpaths.length) {
        // Longest subpath is the intended route.
        let best = el.pathSubpaths[0];
        for (const sp of el.pathSubpaths) if (sp.anchors.length > best.anchors.length) best = sp;
        sampleAnchors(best.anchors as any, out);
    } else if (el.pathAnchors && el.pathAnchors.length) {
        sampleAnchors(el.pathAnchors as any, out);
    } else if ((el as any).points && (el as any).points.length) {
        const p = (el as any).points;
        if (typeof p[0] === 'object') for (const pt of p) out.push([pt.x, pt.y]);
        else for (let i = 0; i < p.length - 1; i += 2) out.push([p[i], p[i + 1]]);
    }
    // A plain line/arrow carries NO `points` — it is defined entirely by its box, so
    // the route is corner-to-corner. Without this a figure attached to a freshly drawn
    // line silently refuses to move (the panel offers "Walk this path" regardless,
    // because `isPathLike` accepts the type).
    if (out.length < 2 && ['line', 'arrow', 'bezier', 'elbow'].includes(el.type)) {
        const cps = (el as any).controlPoints as { x: number; y: number }[] | undefined;
        out.length = 0;
        out.push([0, 0]);
        // Bezier/elbow control points are absolute; bring them into element space.
        if (cps?.length) for (const c of cps) out.push([c.x - el.x, c.y - el.y]);
        out.push([el.width, el.height]);
    }
    return out;
}

/** Sample a path element into a world-space arc-length polyline (null if too short). */
export function elementPathSample(el: DrawingElement): PathSample | null {
    const raw = localPolyline(el);
    if (raw.length < 2) return null;
    const pts = raw.map(([x, y]) => [el.x + x, el.y + y] as [number, number]);
    const cum = [0];
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
        len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        cum.push(len);
    }
    if (len < 1) return null;
    return { pts, cum, len };
}

export interface PathPoint { x: number; y: number; tx: number; ty: number; }

/** Point + unit tangent at arc-length fraction `frac` ∈ [0,1]. */
export function sampleAt(s: PathSample, frac: number): PathPoint {
    const target = Math.max(0, Math.min(1, frac)) * s.len;
    let i = 1;
    while (i < s.cum.length - 1 && s.cum[i] < target) i++;
    const p0 = s.pts[i - 1], p1 = s.pts[i];
    const segLen = (s.cum[i] - s.cum[i - 1]) || 1;
    const u = (target - s.cum[i - 1]) / segLen;
    let tx = p1[0] - p0[0], ty = p1[1] - p0[1];
    const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    return { x: p0[0] + (p1[0] - p0[0]) * u, y: p0[1] + (p1[1] - p0[1]) * u, tx, ty };
}
