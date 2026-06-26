/**
 * Variable-width stroke (the Width tool). A path can carry a `widthProfile` — a list of
 * { t, width } points along its length (t in 0..1). This module samples the centreline and
 * builds the closed outline "ribbon" of the stroke, so it renders as a filled shape whose
 * thickness varies — the calligraphic look Illustrator's Width tool produces.
 */

import type { DrawingElement } from '../types';
import { PathUtils, anchorsToPathData } from './math/path-utils';

export interface WidthPoint { t: number; width: number; }
type Pt = { x: number; y: number };

/** Interpolate the stroke width at parameter t from the (unsorted) profile. */
export function widthAt(profile: WidthPoint[], t: number, base: number): number {
    if (!profile || !profile.length) return base;
    const pts = [...profile].sort((a, b) => a.t - b.t);
    if (t <= pts[0].t) return pts[0].width;
    if (t >= pts[pts.length - 1].t) return pts[pts.length - 1].width;
    for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        if (t >= a.t && t <= b.t) {
            const f = (t - a.t) / (b.t - a.t || 1);
            return a.width + (b.width - a.width) * f;
        }
    }
    return base;
}

/** Parsed-path command list for an element's centreline, in absolute (world) coords. */
function centerlineCommands(el: DrawingElement) {
    if (!el.pathAnchors || el.pathAnchors.length < 2) return null;
    const d = anchorsToPathData(el.pathAnchors, !!el.pathClosed, el.x, el.y);
    const cmds = PathUtils.parsePath(d);
    return cmds.length ? cmds : null;
}

/** Sample N points + unit normals along the centreline. */
function sampleCenterline(el: DrawingElement, n: number): { p: Pt; nx: number; ny: number }[] | null {
    const cmds = centerlineCommands(el);
    if (!cmds) return null;
    const out: { p: Pt; nx: number; ny: number }[] = [];
    const eps = 1 / (n * 4);
    for (let i = 0; i <= n; i++) {
        const t = i / n;
        const p = PathUtils.getPointOnPath(cmds, t);
        const a = PathUtils.getPointOnPath(cmds, Math.max(0, t - eps));
        const b = PathUtils.getPointOnPath(cmds, Math.min(1, t + eps));
        let dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len; dy /= len;
        out.push({ p: { x: p.x, y: p.y }, nx: -dy, ny: dx }); // normal = tangent rotated +90°
    }
    return out;
}

/**
 * Build the closed ribbon outline (absolute coords) for a variable-width path, or null if
 * the element has no usable centreline. Open paths only — a closed path keeps its normal
 * constant stroke.
 */
export function buildWidthRibbon(el: DrawingElement, samples = 80): Pt[] | null {
    if (el.pathClosed) return null;
    const profile = (el.widthProfile as WidthPoint[]) || [];
    const base = el.strokeWidth || 2;
    const cl = sampleCenterline(el, samples);
    if (!cl) return null;
    const left: Pt[] = [], right: Pt[] = [];
    cl.forEach((s, i) => {
        const hw = Math.max(0.1, widthAt(profile, i / samples, base)) / 2;
        left.push({ x: s.p.x + s.nx * hw, y: s.p.y + s.ny * hw });
        right.push({ x: s.p.x - s.nx * hw, y: s.p.y - s.ny * hw });
    });
    return [...left, ...right.reverse()];
}

/** Nearest parameter t in [0,1] on the centreline to a world point (for the Width tool). */
export function nearestTOnPath(el: DrawingElement, point: Pt, samples = 120): { t: number; dist: number; px: number; py: number } | null {
    const cmds = centerlineCommands(el);
    if (!cmds) return null;
    let bestT = 0, bestD = Infinity, bx = 0, by = 0;
    for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const p = PathUtils.getPointOnPath(cmds, t);
        const d = Math.hypot(p.x - point.x, p.y - point.y);
        if (d < bestD) { bestD = d; bestT = t; bx = p.x; by = p.y; }
    }
    return { t: bestT, dist: bestD, px: bx, py: by };
}
