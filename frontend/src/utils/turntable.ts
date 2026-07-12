/**
 * Turntable — rotate a flat 2D vector path in pseudo-3D, keeping it an editable path.
 *
 * Adobe Project Turntable, deterministic tier (no AI). A per-anchor depth `z` is derived
 * from the chosen `depthModel`, every point (anchor + its bézier handles) is rotated about
 * the vertical (yaw) and/or horizontal (pitch) axis, then projected back to 2D. Because the
 * result is just another `PathAnchor[]`, it flows through the normal path-geometry builder
 * → fill + stroke + sketch/architectural parity for free, and `bakeTurntable` can commit it.
 *
 * Phase 2 adds: auto mirror-axis detection (`detectMirrorAxisX`), a symmetry back-face
 * `reveal` so a turn shows the occluded far side (reads as a closed 3D volume), and a
 * `cx`/`cy` rotation centre so several elements can share one rig (group turntable) — each
 * member orbits the common axis (position + shape), not just spins in place.
 *
 * Coordinate space: all in/out anchors are ELEMENT-ORIGIN-RELATIVE (0..width, 0..height),
 * matching `pathAnchors`/`PathSubpath`. See `docs/turntable-plan.md`.
 */
import type { DrawingElement, PathAnchor, PathSubpath, Turntable } from '../types';
import { getPathSubpaths } from './math/path-utils';

const DEG = Math.PI / 180;

/** True when the element carries a live (un-baked) turntable that changes its geometry. */
export function hasTurntable(el: DrawingElement): boolean {
    const t = el.turntable;
    return !!t && !t.baked && ((t.yaw ?? 0) !== 0 || (t.pitch ?? 0) !== 0);
}

/** Collect every x used by an anchor and its handles (absolute, origin-relative). */
function anchorXs(a: PathAnchor): number[] {
    const xs = [a.x];
    if (a.outX !== undefined || a.outY !== undefined) xs.push(a.x + (a.outX ?? 0));
    if (a.inX !== undefined || a.inY !== undefined) xs.push(a.x + (a.inX ?? 0));
    return xs;
}

/**
 * Best-fit vertical mirror axis (element-local x) for a set of subpaths. Reflecting the
 * anchor cloud across the returned x maps the shape most closely onto itself. Cheap search:
 * start at the centroid, score a handful of candidate offsets by nearest-neighbour reflection
 * error, pick the best. Returns `fallback` (bbox centre) when there are too few points.
 */
export function detectMirrorAxisX(subs: PathSubpath[], fallback: number): number {
    const pts: { x: number; y: number }[] = [];
    for (const sp of subs) for (const a of sp.anchors) pts.push({ x: a.x, y: a.y });
    if (pts.length < 4) return fallback;

    let sumX = 0, minX = Infinity, maxX = -Infinity;
    for (const p of pts) { sumX += p.x; if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; }
    const centroid = sumX / pts.length;
    const span = Math.max(1, maxX - minX);

    // Score = mean squared distance from each reflected point to the nearest original point.
    const score = (axis: number): number => {
        let total = 0;
        for (const p of pts) {
            const rx = 2 * axis - p.x;
            let best = Infinity;
            for (const q of pts) {
                const dx = rx - q.x, dy = p.y - q.y;
                const d = dx * dx + dy * dy;
                if (d < best) best = d;
            }
            total += best;
        }
        return total / pts.length;
    };

    let bestAxis = centroid, bestScore = score(centroid);
    const STEPS = 8;
    for (let i = -STEPS; i <= STEPS; i++) {
        if (i === 0) continue;
        const axis = centroid + (i / STEPS) * (span * 0.15);
        const s = score(axis);
        if (s < bestScore) { bestScore = s; bestAxis = axis; }
    }
    return bestAxis;
}

/**
 * Build the depth function z(x) for the element under the given depth model.
 * - `flat`: z = 0 everywhere (honest foreshorten-only spin).
 * - `symmetry`: parabolic cylinder bulge about `mirrorX` — points on the axis bulge toward
 *   the viewer by `depthScale·maxHalfWidth`, points at the silhouette's horizontal extremes
 *   sit at z = 0. Rotating this reads as a rounded (cylinder-like) solid.
 */
function makeDepthFn(subs: PathSubpath[], t: Turntable, mirrorX: number): (x: number) => number {
    if (t.depthModel !== 'symmetry') return () => 0;
    let maxHW = 0;
    for (const sp of subs) for (const a of sp.anchors) for (const x of anchorXs(a)) {
        const d = Math.abs(x - mirrorX);
        if (d > maxHW) maxHW = d;
    }
    if (maxHW < 1e-6) return () => 0;
    const scale = (t.depthScale ?? 0.6) * maxHW;
    return (x: number) => {
        const dx = (x - mirrorX) / maxHW;       // -1..1 across the silhouette
        return scale * (1 - dx * dx);           // parabola: peak on axis, 0 at edges
    };
}

/**
 * Rotate one origin-relative point by yaw (about the vertical axis at `cx`) then pitch
 * (about the horizontal axis at `cy`), and project to 2D. Orthographic unless
 * `perspective > 0`, which applies a gentle divide (larger perspective = stronger).
 */
function rotateProject(
    px: number, py: number, z: number,
    cx: number, cy: number,
    cosY: number, sinY: number, cosP: number, sinP: number,
    perspective: number,
): { x: number; y: number } {
    const x0 = px - cx, y0 = py - cy;
    // Ry(yaw)
    const x1 = x0 * cosY + z * sinY;
    const z1 = -x0 * sinY + z * cosY;
    // Rx(pitch)
    const y2 = y0 * cosP - z1 * sinP;
    const z2 = y0 * sinP + z1 * cosP;
    let sx = x1, sy = y2;
    if (perspective > 0) {
        // Focal length scaled by the point spread so `perspective` reads as a 0..1-ish knob.
        const focal = 1000 / Math.max(0.05, perspective);
        const s = focal / (focal - z2);
        sx *= s; sy *= s;
    }
    return { x: cx + sx, y: cy + sy };
}

/**
 * Transform a single subpath's anchors (positions + handles) through the turntable.
 * `zSign` flips the depth (used to build the mirrored back face for `reveal`).
 */
function transformSubpath(
    sp: PathSubpath, depthAt: (x: number) => number, zSign: number,
    cx: number, cy: number,
    cosY: number, sinY: number, cosP: number, sinP: number, persp: number,
): PathSubpath {
    const P = (x: number, y: number) => rotateProject(x, y, zSign * depthAt(x), cx, cy, cosY, sinY, cosP, sinP, persp);
    const anchors = sp.anchors.map<PathAnchor>((a) => {
        const na = P(a.x, a.y);
        const out: PathAnchor = { x: na.x, y: na.y, kind: a.kind };
        if (a.outX !== undefined || a.outY !== undefined) {
            const h = P(a.x + (a.outX ?? 0), a.y + (a.outY ?? 0));
            out.outX = h.x - na.x; out.outY = h.y - na.y;
        }
        if (a.inX !== undefined || a.inY !== undefined) {
            const h = P(a.x + (a.inX ?? 0), a.y + (a.inY ?? 0));
            out.inX = h.x - na.x; out.inY = h.y - na.y;
        }
        return out;
    });
    return { anchors, closed: sp.closed };
}

/**
 * Apply the element's turntable to its path subpaths and return the rotated subpaths
 * (origin-relative). Returns `null` when there's no live turntable or no usable path.
 * Multi-subpath (and reveal back-face) output is z-sorted so back parts draw first.
 */
export function applyTurntable(el: DrawingElement): PathSubpath[] | null {
    const t = el.turntable;
    if (!t || t.baked) return null;
    const subs = getPathSubpaths(el);
    if (subs.length === 0) return null;

    // Symmetry mirror axis: explicit → auto-detected → element centre.
    const mirrorX = t.depthModel === 'symmetry'
        ? (t.axisX ?? detectMirrorAxisX(subs, el.width / 2))
        : (t.axisX ?? el.width / 2);
    // Rotation centre: cx/cy override (group rig) → mirror axis → element centre.
    const cx = t.cx ?? mirrorX;
    const cy = t.cy ?? el.height / 2;

    const yaw = (t.yaw ?? 0) * DEG;
    const pitch = (t.axis === 'x' ? (t.yaw ?? 0) : (t.pitch ?? 0)) * DEG;
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
    const persp = t.perspective ?? 0;
    const depthAt = makeDepthFn(subs, t, mirrorX);

    // Front (+z). With reveal, also a mirrored back face (−z) so the turn shows the far side.
    const wantBack = !!t.reveal && t.depthModel === 'symmetry';
    const layers: { sub: PathSubpath; sign: number }[] = [];
    for (const sp of subs) {
        if (wantBack) layers.push({ sub: sp, sign: -1 });
        layers.push({ sub: sp, sign: 1 });
    }

    const out = layers.map(l => ({
        sp: transformSubpath(l.sub, depthAt, l.sign, cx, cy, cosY, sinY, cosP, sinP, persp),
        srcSign: l.sign, srcAnchors: l.sub.anchors,
    }));

    // z-order: sort back-to-front by each layer's rotated mean depth (ascending z = far first).
    if (out.length > 1) {
        const meanZ = (o: typeof out[number]) => {
            let s = 0;
            for (const a of o.srcAnchors) {
                const dx = a.x - cx;
                s += -dx * sinY + o.srcSign * depthAt(a.x) * cosY;
            }
            return s / Math.max(1, o.srcAnchors.length);
        };
        out.sort((a, b) => meanZ(a) - meanZ(b));
    }
    return out.map(o => o.sp);
}
