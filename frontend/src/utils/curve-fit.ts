/**
 * Curve fitting for the Curvature tool. Given a sequence of points the user clicked, build a
 * smooth path that passes THROUGH every point (Illustrator's Curvature tool), by converting a
 * Catmull-Rom spline to cubic-Bézier anchor handles. Each point becomes a smooth anchor whose
 * in/out handles are ±1/6 of the chord between its neighbours (the standard CR→Bézier tangent).
 */

import type { PathAnchor } from '../types';

type Pt = { x: number; y: number };

/** Smooth anchors (with Bézier handles) through `points`. `closed` wraps the tangents. */
export function catmullRomAnchors(points: Pt[], closed = false): PathAnchor[] {
    const n = points.length;
    if (n < 2) return points.map(p => ({ x: p.x, y: p.y, kind: 'corner' as const }));

    const at = (i: number): Pt => {
        if (closed) return points[(i % n + n) % n];
        return points[Math.max(0, Math.min(n - 1, i))];
    };

    const anchors: PathAnchor[] = [];
    for (let i = 0; i < n; i++) {
        const p = points[i];
        const prev = at(i - 1), next = at(i + 1);
        // Catmull-Rom tangent → Bézier handle length = chord/6.
        const tx = (next.x - prev.x) / 6;
        const ty = (next.y - prev.y) / 6;
        const isEnd = !closed && (i === 0 || i === n - 1);
        anchors.push({
            x: p.x, y: p.y,
            inX: -tx, inY: -ty,
            outX: tx, outY: ty,
            kind: isEnd && (tx === 0 && ty === 0) ? 'corner' : 'smooth',
        });
    }
    return anchors;
}
