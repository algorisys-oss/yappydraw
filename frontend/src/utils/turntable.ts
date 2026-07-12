/**
 * Turntable — rotate a flat 2D vector path in pseudo-3D, keeping it an editable path.
 *
 * Adobe Project Turntable, deterministic tier (no AI). A per-anchor depth `z` is derived
 * from the chosen `depthModel`, every point (anchor + its bézier handles) is rotated about
 * the vertical (yaw) and/or horizontal (pitch) axis, then projected back to 2D. Because the
 * result is just another `PathAnchor[]`, it flows through the normal path-geometry builder
 * → fill + stroke + sketch/architectural parity for free, and `bakeTurntable` can commit it.
 *
 * Coordinate space: all in/out anchors are ELEMENT-ORIGIN-RELATIVE (0..width, 0..height),
 * matching `pathAnchors`/`PathSubpath`. The spin axis defaults to the element centre, so a
 * rotated path stays roughly within its bounds. See `docs/turntable-plan.md`.
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
 * Build the depth function z(x) for the element under the given depth model.
 * - `flat`: z = 0 everywhere (honest foreshorten-only spin).
 * - `symmetry`: parabolic cylinder bulge about `axisX` — points on the axis bulge toward
 *   the viewer by `depthScale·maxHalfWidth`, points at the silhouette's horizontal extremes
 *   sit at z = 0. Rotating this reads as a rounded (cylinder-like) solid.
 */
function makeDepthFn(subs: PathSubpath[], t: Turntable, axisX: number): (x: number) => number {
    if (t.depthModel !== 'symmetry') return () => 0;
    let maxHW = 0;
    for (const sp of subs) for (const a of sp.anchors) for (const x of anchorXs(a)) {
        const d = Math.abs(x - axisX);
        if (d > maxHW) maxHW = d;
    }
    if (maxHW < 1e-6) return () => 0;
    const scale = (t.depthScale ?? 0.6) * maxHW;
    return (x: number) => {
        const dx = (x - axisX) / maxHW;         // -1..1 across the silhouette
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

/** Transform a single subpath's anchors (positions + handles) through the turntable. */
function transformSubpath(
    sp: PathSubpath, depthAt: (x: number) => number,
    cx: number, cy: number,
    cosY: number, sinY: number, cosP: number, sinP: number, persp: number,
): PathSubpath {
    const P = (x: number, y: number) => rotateProject(x, y, depthAt(x), cx, cy, cosY, sinY, cosP, sinP, persp);
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
 * Multi-subpath elements are z-sorted by rotated mean-depth so back parts draw first.
 */
export function applyTurntable(el: DrawingElement): PathSubpath[] | null {
    const t = el.turntable;
    if (!t || t.baked) return null;
    const subs = getPathSubpaths(el);
    if (subs.length === 0) return null;

    const cx = t.axisX ?? el.width / 2;
    const cy = el.height / 2;
    const yaw = (t.yaw ?? 0) * DEG;
    const pitch = (t.axis === 'x' ? (t.yaw ?? 0) : (t.pitch ?? 0)) * DEG;
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
    const persp = t.perspective ?? 0;
    const depthAt = makeDepthFn(subs, t, cx);

    const out = subs.map((sp) => transformSubpath(sp, depthAt, cx, cy, cosY, sinY, cosP, sinP, persp));

    // z-order: sort subpaths back-to-front by their rotated mean depth (occlusion Phase 1).
    if (out.length > 1) {
        const meanZ = (sp: PathSubpath) => {
            let s = 0;
            for (const a of sp.anchors) {
                const dx = a.x - cx;
                s += -dx * sinY + depthAt(a.x) * cosY; // rotated z of the anchor
            }
            return s / Math.max(1, sp.anchors.length);
        };
        out.sort((a, b) => meanZ(a) - meanZ(b)); // ascending z = far first
    }
    return out;
}
