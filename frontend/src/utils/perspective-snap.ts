/**
 * Perspective grid — geometry and soft snapping.
 *
 * The grid is a set of vanishing points in WORLD coordinates. Everything a drawing tool
 * needs from it is "which directions are legal here", and that is point-dependent: the
 * ray toward a VP is different at every anchor. `perspectiveGuidesAt` answers that, and
 * `snapVectorToPerspective` biases a drag toward the nearest legal direction.
 *
 * The snap is deliberately *soft*. A hard lock is fine for a straight wall edge and
 * wrong for everything else — pen handles, curved connectors, anything organic — so the
 * pull is a fraction of the way onto the ray, easing to nothing at the tolerance edge.
 * `snapStrength` 1 is the exception: it means "lock", which is what people expect from a
 * slider pushed to the top.
 *
 * Pure maths — no store, no DOM — so it is unit-testable and identical at every call site.
 */

export type PerspectiveMode = 1 | 2 | 3;

/** Which plane a box-drag is drawn on. 'off' = the tools behave normally. */
export type PerspectivePlane = 'off' | 'left' | 'right' | 'floor';

export interface PerspectiveGrid {
    /** Eye level, world y. Both horizon VPs sit on it. */
    horizonY: number;
    leftVPx: number;
    rightVPx: number;
    /** 1-, 2- or 3-point. In 1-point only `leftVPx` is used. */
    mode: PerspectiveMode;
    /** Third (vertical) vanishing point — 3-point mode only. */
    verticalVPx: number;
    verticalVPy: number;
    /** Rays drawn per fan. Display only; snapping is continuous. */
    density: number;
    snap: boolean;
    /** Half-width of the capture cone, in degrees. */
    snapAngle: number;
    /** 0 = off, 1 = hard lock inside the cone, in between = proportional pull. */
    snapStrength: number;
    /** Plane that box-drags (rectangles, ellipses, …) are drawn on. */
    drawPlane: PerspectivePlane;
}

export interface PerspectiveVP {
    kind: 'vp' | 'left' | 'right' | 'vertical';
    x: number;
    y: number;
}

export interface PerspectiveGuide {
    kind: 'vp' | 'left' | 'right' | 'vertical' | 'horizontal';
    /** Unit direction at the anchor, pointing toward the VP where there is one. */
    dx: number;
    dy: number;
    /** The anchor the guide was measured from (world). */
    ax: number;
    ay: number;
    /** Vanishing point this guide converges to, when it has one. */
    vpx?: number;
    vpy?: number;
}

export interface SnappedVector {
    dx: number;
    dy: number;
    guide: PerspectiveGuide | null;
}

const EPS = 1e-6;

/** Vanishing points that are actually in play for the grid's mode. */
export function perspectiveVPs(g: PerspectiveGrid): PerspectiveVP[] {
    if (g.mode === 1) return [{ kind: 'vp', x: g.leftVPx, y: g.horizonY }];
    const vps: PerspectiveVP[] = [
        { kind: 'left', x: g.leftVPx, y: g.horizonY },
        { kind: 'right', x: g.rightVPx, y: g.horizonY },
    ];
    if (g.mode === 3) vps.push({ kind: 'vertical', x: g.verticalVPx, y: g.verticalVPy });
    return vps;
}

/**
 * The legal directions through (ax, ay).
 *
 * Which families exist depends on the mode, and the omissions matter: in 2-point every
 * horizontal recedes to a VP, so there is no free horizontal family; in 3-point verticals
 * converge on the third VP, so there is no free vertical either.
 */
export function perspectiveGuidesAt(g: PerspectiveGrid, ax: number, ay: number): PerspectiveGuide[] {
    const out: PerspectiveGuide[] = [];
    for (const vp of perspectiveVPs(g)) {
        const dx = vp.x - ax, dy = vp.y - ay;
        const len = Math.hypot(dx, dy);
        if (len < EPS) continue; // anchor sits on the VP — no direction to speak of
        out.push({ kind: vp.kind, dx: dx / len, dy: dy / len, ax, ay, vpx: vp.x, vpy: vp.y });
    }
    if (g.mode !== 3) out.push({ kind: 'vertical', dx: 0, dy: 1, ax, ay });
    if (g.mode === 1) out.push({ kind: 'horizontal', dx: 1, dy: 0, ax, ay });
    return out;
}

/** Normalise radians to (−π, π]. */
function normRad(a: number): number {
    let r = a % (2 * Math.PI);
    if (r > Math.PI) r -= 2 * Math.PI;
    if (r <= -Math.PI) r += 2 * Math.PI;
    return r;
}

/**
 * Bias the vector (vx, vy) drawn from (ax, ay) toward the nearest perspective guide,
 * preserving its length. Returns the vector unchanged with `guide: null` when nothing
 * is in range, snapping is off, or the drag has no direction yet.
 */
export function snapVectorToPerspective(
    g: PerspectiveGrid, ax: number, ay: number, vx: number, vy: number,
): SnappedVector {
    const len = Math.hypot(vx, vy);
    if (!g.snap || g.snapStrength <= 0 || g.snapAngle <= 0 || len < EPS) return { dx: vx, dy: vy, guide: null };

    const a0 = Math.atan2(vy, vx);
    let best: PerspectiveGuide | null = null;
    let bestDelta = Infinity;
    for (const guide of perspectiveGuidesAt(g, ax, ay)) {
        const ga = Math.atan2(guide.dy, guide.dx);
        // A guide is a LINE, not a ray: drawing away from the VP is just as valid as
        // drawing toward it, so both headings compete.
        for (const cand of [ga, ga + Math.PI]) {
            const d = normRad(cand - a0);
            if (Math.abs(d) < Math.abs(bestDelta)) { bestDelta = d; best = guide; }
        }
    }

    const tol = g.snapAngle * Math.PI / 180;
    if (!best || Math.abs(bestDelta) > tol) return { dx: vx, dy: vy, guide: null };

    // w: 1 dead on the guide, 0 at the edge of the cone. Smoothstep so the pull arrives
    // and leaves without a step, then an exponent keyed to strength: 1 → hard lock,
    // 0.75 → plain smoothstep, lower → a whisper.
    const w = 1 - Math.abs(bestDelta) / tol;
    const s = w * w * (3 - 2 * w);
    const t = Math.pow(s, 4 * (1 - Math.min(1, g.snapStrength)));
    const a1 = a0 + bestDelta * t;
    return { dx: Math.cos(a1) * len, dy: Math.sin(a1) * len, guide: best };
}

/** As `snapVectorToPerspective`, but in absolute world points: anchor → moving end. */
export function snapPointToPerspective(
    g: PerspectiveGrid, ax: number, ay: number, x: number, y: number,
): { x: number; y: number; guide: PerspectiveGuide | null } {
    const r = snapVectorToPerspective(g, ax, ay, x - ax, y - ay);
    return { x: ax + r.dx, y: ay + r.dy, guide: r.guide };
}

// ── Drawing on a plane ────────────────────────────────────────────────────

export interface Pt { x: number; y: number }

/**
 * One of the two families of parallel-in-the-world edges that define a plane. Either the
 * edges converge on a vanishing point, or (where the mode leaves that family un-converged)
 * they are genuinely parallel in a fixed direction.
 */
export interface PlaneFamily {
    kind: 'vp' | 'left' | 'right' | 'vertical' | 'horizontal';
    vp?: Pt;
    dir?: Pt;
}

/**
 * The two edge families of a plane, given the grid's mode. A floor tile's edges recede to
 * both horizon VPs; a wall pairs one horizon VP with the vertical family, which is a true
 * vertical in 1-/2-point and the third vanishing point in 3-point.
 */
export function planeFamilies(g: PerspectiveGrid, plane: PerspectivePlane): [PlaneFamily, PlaneFamily] | null {
    if (plane === 'off') return null;
    const vertical: PlaneFamily = g.mode === 3
        ? { kind: 'vertical', vp: { x: g.verticalVPx, y: g.verticalVPy } }
        : { kind: 'vertical', dir: { x: 0, y: 1 } };

    if (g.mode === 1) {
        const vp: PlaneFamily = { kind: 'vp', vp: { x: g.leftVPx, y: g.horizonY } };
        return plane === 'floor' ? [vp, { kind: 'horizontal', dir: { x: 1, y: 0 } }] : [vp, vertical];
    }
    const left: PlaneFamily = { kind: 'left', vp: { x: g.leftVPx, y: g.horizonY } };
    const right: PlaneFamily = { kind: 'right', vp: { x: g.rightVPx, y: g.horizonY } };
    if (plane === 'floor') return [left, right];
    return plane === 'left' ? [left, vertical] : [right, vertical];
}

/** Direction of a family at a point (unit-length; null where the point sits on the VP). */
function familyDirAt(f: PlaneFamily, p: Pt): Pt | null {
    if (f.dir) return f.dir;
    const dx = f.vp!.x - p.x, dy = f.vp!.y - p.y;
    const len = Math.hypot(dx, dy);
    return len < EPS ? null : { x: dx / len, y: dy / len };
}

/** Intersection of the lines (p, u) and (q, v). Null when they are (near) parallel. */
function lineIntersect(p: Pt, u: Pt, q: Pt, v: Pt): Pt | null {
    const den = u.x * v.y - u.y * v.x;
    if (Math.abs(den) < 1e-9) return null;
    const t = ((q.x - p.x) * v.y - (q.y - p.y) * v.x) / den;
    return { x: p.x + u.x * t, y: p.y + u.y * t };
}

/** Is the quad convex (all turns the same way)? A folded/bow-tie quad fails this. */
function isConvex(q: Pt[]): boolean {
    let sign = 0;
    for (let i = 0; i < 4; i++) {
        const a = q[i], b = q[(i + 1) % 4], c = q[(i + 2) % 4];
        const z = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
        if (Math.abs(z) < 1e-9) continue;
        const s = Math.sign(z);
        if (sign === 0) sign = s;
        else if (s !== sign) return false;
    }
    return sign !== 0;
}

/**
 * The quad of a box drag laid on a perspective plane.
 *
 * The drag is decomposed into the plane's two edge directions at the start corner, so it sets
 * how far the tile runs along each one; the far corner then falls out of the two families and
 * lands *near* the cursor rather than exactly on it — foreshortened, which is the point.
 *
 * Treating the drag as the tile's diagonal instead (intersect a family line from each end) is
 * the textbook construction and a bad interaction: as the diagonal leaves the wedge between
 * the two directions the tile folds through the vanishing point into a bow-tie, and a diagonal
 * that lies nearly along one family gives a sliver stretching most of the way to the horizon.
 * Both are geometrically "correct" and neither is what anyone dragging a rectangle wants.
 *
 * Returns [p0, p1, p2, p3] in cyclic order, or null when there is no sensible tile (no drag
 * yet, the two families are parallel, or the result would still fold).
 */
export function perspectiveQuad(g: PerspectiveGrid, plane: PerspectivePlane, p0: Pt, drag: Pt): Pt[] | null {
    const fams = planeFamilies(g, plane);
    if (!fams) return null;
    const dx = drag.x - p0.x, dy = drag.y - p0.y;
    if (Math.hypot(dx, dy) < 1e-6) return null;
    const [fa, fb] = fams;
    const a = familyDirAt(fa, p0), b = familyDirAt(fb, p0);
    if (!a || !b) return null;

    // Resolve the drag in the plane's own axes: d = α·a + β·b. The far corner then lands on
    // the cursor (up to foreshortening), which is what makes the drag predictable — and it is
    // how a perspective grid is meant to behave. A drag that runs along one of the plane's own
    // directions legitimately gives a thin tile; that is the plane telling you where you are
    // pointing, not a bug.
    const det = a.x * b.y - a.y * b.x;
    if (Math.abs(det) < 1e-9) return null;           // the families are parallel here
    let alpha = (dx * b.y - dy * b.x) / det;
    let beta = (a.x * dy - a.y * dx) / det;
    if (Math.abs(alpha) < 1e-6 || Math.abs(beta) < 1e-6) return null;
    const [fa2, fb2] = [fa, fb];
    const [flat, steep] = [a, b];

    // Never let an edge reach its own vanishing point: past it the tile is behind the viewer
    // and the projection folds. Stopping short keeps every drag on the near side.
    const cap = (f: PlaneFamily, t: number): number => {
        if (!f.vp) return t;
        const limit = 0.9 * Math.hypot(f.vp.x - p0.x, f.vp.y - p0.y);
        return Math.sign(t) * Math.min(Math.abs(t), limit);
    };
    alpha = cap(fa2, alpha);
    beta = cap(fb2, beta);

    const p1 = { x: p0.x + flat.x * alpha, y: p0.y + flat.y * alpha };
    const p3 = { x: p0.x + steep.x * beta, y: p0.y + steep.y * beta };
    const b1 = familyDirAt(fb2, p1), a3 = familyDirAt(fa2, p3);
    if (!b1 || !a3) return null;
    const p2 = lineIntersect(p1, b1, p3, a3);
    if (!p2) return null;

    const quad = [p0, p1, p2, p3];
    if (!quad.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))) return null;
    if (!isConvex(quad)) return null;                // folded through a vanishing point
    return quad;
}

/**
 * Re-index a cyclic quad into the [TL, TR, BR, BL] order an envelope cage expects: clockwise
 * with screen-y pointing down, starting at the most top-left corner. The cage maps the
 * element's bounding box onto these four points, so getting the rotation wrong would draw the
 * shape sideways inside its own quad.
 */
export function orderQuadForWarp(quad: Pt[]): Pt[] {
    const area = quad.reduce((s, p, i) => { const n = quad[(i + 1) % 4]; return s + (p.x * n.y - n.x * p.y); }, 0) / 2;
    const cw = area >= 0 ? quad.slice() : [quad[0], quad[3], quad[2], quad[1]];
    let start = 0;
    for (let i = 1; i < 4; i++) if (cw[i].x + cw[i].y < cw[start].x + cw[start].y) start = i;
    return [cw[start], cw[(start + 1) % 4], cw[(start + 2) % 4], cw[(start + 3) % 4]];
}
