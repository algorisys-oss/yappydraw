/**
 * Curve helpers shared by the doodle generators.
 *
 * Two jobs: turn point lists into real curves (a `smooth` anchor with no handles is
 * serialised as a straight `L` segment — see `anchorsToPathData` — so a dense polyline
 * would render faceted), and stitch short pieces into long continuous lines, which is
 * what keeps a doodle to a handful of subpaths instead of thousands of fragments.
 */
import type { PathAnchor, PathSubpath } from '../../types';

export interface Pt { x: number; y: number }

/** Bézier handle length for a quarter circle of radius 1. */
export const KAPPA = 0.5522847498;

/**
 * Catmull-Rom through `pts`, expressed as cubic Bézier handles on each anchor. The curve
 * passes through every input point with G1-continuous joins (mirrored handles).
 */
export function smoothThrough(pts: Pt[], closed: boolean): PathAnchor[] {
    const n = pts.length;
    if (n < 3) return pts.map(p => ({ x: p.x, y: p.y, kind: 'corner' as const }));
    const out: PathAnchor[] = [];
    for (let i = 0; i < n; i++) {
        const prev = closed ? pts[(i - 1 + n) % n] : pts[Math.max(0, i - 1)];
        const next = closed ? pts[(i + 1) % n] : pts[Math.min(n - 1, i + 1)];
        // Uniform Catmull-Rom tangent / 6 is the equivalent Bézier handle. At an open end
        // prev or next is the point itself, which halves the handle — a gentle end.
        const tx = (next.x - prev.x) / 6, ty = (next.y - prev.y) / 6;
        const a: PathAnchor = { x: pts[i].x, y: pts[i].y, kind: 'smooth' };
        if (closed || i > 0) { a.inX = -tx; a.inY = -ty; }
        if (closed || i < n - 1) { a.outX = tx; a.outY = ty; }
        out.push(a);
    }
    return out;
}

/** Drop points closer than `minGap` to the last kept one (keeps both ends). */
export function thin(pts: Pt[], minGap: number, closed = false): Pt[] {
    if (pts.length < 3) return pts;
    const out: Pt[] = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
        const l = out[out.length - 1];
        if (Math.hypot(pts[i].x - l.x, pts[i].y - l.y) >= minGap) out.push(pts[i]);
    }
    const last = pts[pts.length - 1];
    if (closed) {
        // The loop's closing segment is implicit; don't keep a point sitting on the start.
        if (Math.hypot(last.x - out[0].x, last.y - out[0].y) >= minGap * 0.5) out.push(last);
    } else {
        out.push(last);
    }
    return out;
}

/** A quarter-circle arc about (cx,cy), from angle a0 to a0 ± 90°, as two Bézier anchors. */
export function quarterArc(cx: number, cy: number, r: number, a0: number, a1: number): PathAnchor[] {
    const sx = cx + r * Math.cos(a0), sy = cy + r * Math.sin(a0);
    const ex = cx + r * Math.cos(a1), ey = cy + r * Math.sin(a1);
    const dir = Math.sign(a1 - a0) || 1;
    const h = KAPPA * r;
    // Tangent at angle a, travelling in direction `dir`: (-sin a, cos a) * dir.
    return [
        { x: sx, y: sy, kind: 'smooth', outX: -Math.sin(a0) * h * dir, outY: Math.cos(a0) * h * dir },
        { x: ex, y: ey, kind: 'smooth', inX: Math.sin(a1) * h * dir, inY: -Math.cos(a1) * h * dir },
    ];
}

/** Reverse an anchor run, swapping each anchor's in/out handles so the curve is unchanged. */
function reverseRun(run: PathAnchor[]): PathAnchor[] {
    return run.slice().reverse().map(a => {
        const r: PathAnchor = { x: a.x, y: a.y, kind: a.kind };
        if (a.outX !== undefined || a.outY !== undefined) { r.inX = a.outX; r.inY = a.outY; }
        if (a.inX !== undefined || a.inY !== undefined) { r.outX = a.inX; r.outY = a.inY; }
        return r;
    });
}

/** Merge the end anchor of one run with the start anchor of the next: same point, both handles. */
function joinAnchor(end: PathAnchor, start: PathAnchor): PathAnchor {
    const j: PathAnchor = { x: end.x, y: end.y, kind: end.kind === 'smooth' || start.kind === 'smooth' ? 'smooth' : 'corner' };
    if (end.inX !== undefined || end.inY !== undefined) { j.inX = end.inX; j.inY = end.inY; }
    if (start.outX !== undefined || start.outY !== undefined) { j.outX = start.outX; j.outY = start.outY; }
    return j;
}

/**
 * Stitch segments that share endpoints into continuous subpaths.
 *
 * Endpoints are matched by coordinate rounded to `tol`, so the generators must produce
 * the SAME point for a shared end (they do: tile-edge crossings and marching-squares
 * edge interpolations are computed from the edge alone, not from the cell). A chain that
 * returns to its start becomes a closed subpath without a duplicated last anchor.
 *
 * Where more than two segments meet at one point, pieces are joined greedily; nothing is
 * lost, a junction just ends one chain and starts another.
 */
export function chainSegments(segments: PathAnchor[][], tol = 0.01): PathSubpath[] {
    const key = (a: PathAnchor) => `${Math.round(a.x / tol)},${Math.round(a.y / tol)}`;
    const segs = segments.filter(s => s.length >= 2);
    const used = new Uint8Array(segs.length);
    const byEnd = new Map<string, number[]>();
    const add = (k: string, i: number) => { const l = byEnd.get(k); if (l) l.push(i); else byEnd.set(k, [i]); };
    segs.forEach((s, i) => { add(key(s[0]), i); add(key(s[s.length - 1]), i); });

    /** Take an unused segment touching point `k`, oriented to start there. */
    const take = (k: string): PathAnchor[] | null => {
        const list = byEnd.get(k);
        if (!list) return null;
        for (const i of list) {
            if (used[i]) continue;
            used[i] = 1;
            const s = segs[i];
            return key(s[0]) === k ? s : reverseRun(s);
        }
        return null;
    };

    /** Extend `run` forward from its last anchor for as long as segments connect. */
    const grow = (run: PathAnchor[]) => {
        for (;;) {
            const next = take(key(run[run.length - 1]));
            if (!next) return;
            run[run.length - 1] = joinAnchor(run[run.length - 1], next[0]);
            for (let i = 1; i < next.length; i++) run.push(next[i]);
        }
    };

    const out: PathSubpath[] = [];
    for (let i = 0; i < segs.length; i++) {
        if (used[i]) continue;
        used[i] = 1;
        let run = segs[i].slice();
        grow(run);
        // Grow the other way too: the seed segment may have started mid-chain.
        run = reverseRun(run);
        grow(run);
        run = reverseRun(run);

        const first = run[0], last = run[run.length - 1];
        if (run.length > 2 && key(first) === key(last)) {
            run[0] = joinAnchor(last, first);
            run.pop();
            out.push({ anchors: run, closed: true });
        } else {
            out.push({ anchors: run, closed: false });
        }
    }
    return out;
}
