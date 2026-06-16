/**
 * Shape recognition for "smart shape" hold-to-correct.
 *
 * Classifies a freehand pen stroke into a clean primitive (line, rectangle,
 * ellipse, triangle, diamond) so a dwell at the end of a stroke can snap the
 * ink into a real geometric element. Ported and adapted from happypaint's
 * engine/stroke/quick-shape.ts `recognizeShape`.
 *
 * Pure geometry, JS-only — runs once per stroke (on dwell / finish), never on
 * the hot per-point path, so it needs no WASM counterpart.
 *
 * All inputs/outputs are in the stroke's LOCAL coordinate space (points
 * relative to element.x / element.y). The caller offsets by element.x/y.
 */

export type Pt = { x: number; y: number };

export type RecognizedShape =
    | { kind: 'line'; a: Pt; b: Pt }
    | { kind: 'rect'; minX: number; minY: number; maxX: number; maxY: number }
    | { kind: 'ellipse'; minX: number; minY: number; maxX: number; maxY: number }
    | { kind: 'triangle'; minX: number; minY: number; maxX: number; maxY: number }
    | { kind: 'diamond'; minX: number; minY: number; maxX: number; maxY: number };

const MIN_POINTS = 8;     // too few points → can't tell anything
const MIN_DIAG = 24;      // tiny scribbles aren't shapes (in world units)

function dist(a: Pt, b: Pt): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function perpDist(p: Pt, a: Pt, b: Pt): number {
    const len = dist(a, b);
    if (len < 1e-6) return dist(p, a);
    return Math.abs((p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x)) / len;
}

// Ramer–Douglas–Peucker simplification → corner points.
function rdp(pts: Pt[], eps: number): Pt[] {
    if (pts.length < 3) return pts.slice();
    let dmax = 0;
    let idx = 0;
    const a = pts[0];
    const b = pts[pts.length - 1];
    for (let i = 1; i < pts.length - 1; i++) {
        const d = perpDist(pts[i], a, b);
        if (d > dmax) { dmax = d; idx = i; }
    }
    if (dmax > eps) {
        return rdp(pts.slice(0, idx + 1), eps).slice(0, -1).concat(rdp(pts.slice(idx), eps));
    }
    return [a, b];
}

// Mean distance from every stroke point to the nearest polygon edge.
function meanEdgeDist(pts: Pt[], corners: Pt[]): number {
    let sum = 0;
    for (const p of pts) {
        let best = Infinity;
        for (let i = 0; i < corners.length; i++) {
            const a = corners[i];
            const b = corners[(i + 1) % corners.length];
            best = Math.min(best, perpDist(p, a, b));
        }
        sum += best;
    }
    return sum / pts.length;
}

/**
 * Try to recognize a clean shape from a freehand stroke (local coords).
 * Returns null when the stroke is ambiguous — the caller should then keep the
 * original freehand ink rather than forcing a (wrong) shape.
 */
export function recognizeStrokeShape(pts: Pt[]): RecognizedShape | null {
    if (pts.length < MIN_POINTS) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pts) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }
    const w = maxX - minX;
    const h = maxY - minY;
    const diag = Math.hypot(w, h);
    if (diag < MIN_DIAG) return null;

    const start = pts[0];
    const end = pts[pts.length - 1];
    const closed = dist(start, end) < 0.22 * diag;

    // ── Line: open stroke whose points hug the start→end axis ──
    const lineLen = Math.max(1, dist(start, end));
    let maxPerp = 0;
    for (const p of pts) {
        const perp = perpDist(p, start, end);
        if (perp > maxPerp) maxPerp = perp;
    }
    if (!closed && maxPerp < 0.1 * lineLen) {
        return { kind: 'line', a: { x: start.x, y: start.y }, b: { x: end.x, y: end.y } };
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    // ── Ellipse fit error (normalized distance from boundary) ──
    const rx = Math.max(1, w / 2);
    const ry = Math.max(1, h / 2);
    let ellipseErr = 0;
    for (const p of pts) {
        ellipseErr += Math.abs(Math.hypot((p.x - cx) / rx, (p.y - cy) / ry) - 1) * Math.min(rx, ry);
    }
    ellipseErr /= pts.length;

    // ── Polygon corners via RDP ──
    let corners = rdp(pts, 0.04 * diag);
    // Drop a duplicate closing corner so a closed quad reports 4, not 5.
    if (corners.length > 1 && dist(corners[0], corners[corners.length - 1]) < 0.1 * diag) {
        corners = corners.slice(0, -1);
    }
    const n = corners.length;
    const polyErr = n >= 3 ? meanEdgeDist(pts, corners) : Infinity;

    if (polyErr < ellipseErr && n >= 3 && n <= 8) {
        if (n === 3) {
            return { kind: 'triangle', minX, minY, maxX, maxY };
        }
        if (n === 4) {
            const near = (a: Pt, b: Pt) => dist(a, b) < 0.18 * diag;
            const bboxCorners = [
                { x: minX, y: minY }, { x: maxX, y: minY },
                { x: maxX, y: maxY }, { x: minX, y: maxY },
            ];
            const edgeMids = [
                { x: cx, y: minY }, { x: maxX, y: cy },
                { x: cx, y: maxY }, { x: minX, y: cy },
            ];
            const axisAligned = bboxCorners.every(bc => corners.some(c => near(c, bc)));
            const diamondLike = edgeMids.every(m => corners.some(c => near(c, m)));
            // Prefer diamond only when it matches and rect doesn't.
            if (diamondLike && !axisAligned) {
                return { kind: 'diamond', minX, minY, maxX, maxY };
            }
            return { kind: 'rect', minX, minY, maxX, maxY };
        }
        // 5–8 corners: no clean primitive in scope — keep freehand.
        return null;
    }

    // ── Fallback: closed rounded stroke → ellipse ──
    if (closed) {
        return { kind: 'ellipse', minX, minY, maxX, maxY };
    }
    return null;
}
