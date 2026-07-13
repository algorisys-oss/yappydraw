/**
 * Anchor-point snapping (Precision & Measurement — Phase 4b).
 *
 * "Snap to point": while dragging, the moving selection's anchor points (its
 * bounding-box corners, edge midpoints, and centre — plus the true path anchors of
 * path elements) snap onto another element's matching anchor points when they come
 * within threshold on BOTH axes. That both-axis condition is what makes this a
 * *point* snap, distinct from the existing 1-D edge/centre alignment in
 * `object-snapping.ts` (which this leaves untouched — so no WASM-parity burden;
 * this is a separate, JS-only concern).
 *
 * Pure geometry, no store/DOM — unit-testable and side-effect free.
 */

export interface SnapPoint { x: number; y: number; }

interface SnapElement {
    id: string;
    x: number; y: number; width: number; height: number;
    layerId?: string | null;
    pathAnchors?: SnapPoint[];
    pathSubpaths?: { anchors: SnapPoint[] }[];
}

export interface PointSnapResult {
    /** dx/dy adjusted so the nearest anchor pair coincides (unchanged when no snap). */
    dx: number;
    dy: number;
    snapped: boolean;
    /** World point the moving anchor locked onto, for the on-canvas marker. */
    marker: SnapPoint | null;
}

/** The 9 bounding-box anchor points: 4 corners, 4 edge midpoints, centre. */
function bboxAnchors(r: { x: number; y: number; width: number; height: number }): SnapPoint[] {
    const { x, y, width: w, height: h } = r;
    const cx = x + w / 2, cy = y + h / 2, r2 = x + w, b2 = y + h;
    return [
        { x, y }, { x: r2, y }, { x, y: b2 }, { x: r2, y: b2 },
        { x: cx, y }, { x: cx, y: b2 }, { x, y: cy }, { x: r2, y: cy },
        { x: cx, y: cy },
    ];
}

/** True path anchors in world coords (origin-relative → absolute). */
function pathAnchorsOf(el: SnapElement): SnapPoint[] {
    const out: SnapPoint[] = [];
    if (el.pathSubpaths?.length) {
        for (const s of el.pathSubpaths) for (const a of s.anchors) out.push({ x: el.x + a.x, y: el.y + a.y });
    } else if (el.pathAnchors?.length) {
        for (const a of el.pathAnchors) out.push({ x: el.x + a.x, y: el.y + a.y });
    }
    return out;
}

/**
 * Best anchor-to-anchor snap for the active selection moved by (dx, dy).
 * Considers the active group's bbox anchors + each active path element's anchors
 * against every same-layer non-active element's anchors. Returns the adjusted
 * delta + marker of the nearest pair within `threshold` on both axes, else the
 * delta unchanged.
 */
export function getPointSnap(
    activeIds: string[],
    allElements: SnapElement[],
    dx: number,
    dy: number,
    threshold: number,
    extraTargets: SnapPoint[] = [],
): PointSnapResult {
    const activeEls = allElements.filter(el => activeIds.includes(el.id));
    if (activeEls.length === 0) return { dx, dy, snapped: false, marker: null };

    const minX = Math.min(...activeEls.map(e => e.x));
    const minY = Math.min(...activeEls.map(e => e.y));
    const maxX = Math.max(...activeEls.map(e => e.x + e.width));
    const maxY = Math.max(...activeEls.map(e => e.y + e.height));
    const groupRect = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

    // Active anchors (bbox + path anchors), shifted by the current drag delta.
    const rawActive = bboxAnchors(groupRect);
    for (const el of activeEls) rawActive.push(...pathAnchorsOf(el));
    const activeAnchors = rawActive.map(p => ({ x: p.x + dx, y: p.y + dy }));

    // Target anchors: same-layer, non-active elements.
    const layerId = activeEls[0].layerId;
    const targets: SnapPoint[] = [];
    for (const el of allElements) {
        if (activeIds.includes(el.id) || (el.layerId ?? null) !== (layerId ?? null)) continue;
        targets.push(...bboxAnchors(el), ...pathAnchorsOf(el));
    }
    // Path-intersection points (Phase 4c): crossing points of other outlines, precomputed.
    if (extraTargets.length) targets.push(...extraTargets);
    if (targets.length === 0) return { dx, dy, snapped: false, marker: null };

    let best: { d: number; ex: number; ey: number; marker: SnapPoint } | null = null;
    for (const a of activeAnchors) {
        for (const t of targets) {
            const ex = t.x - a.x, ey = t.y - a.y;
            if (Math.abs(ex) > threshold || Math.abs(ey) > threshold) continue;
            const d = Math.hypot(ex, ey);
            if (!best || d < best.d) best = { d, ex, ey, marker: { x: t.x, y: t.y } };
        }
    }

    if (!best) return { dx, dy, snapped: false, marker: null };
    return { dx: dx + best.ex, dy: dy + best.ey, snapped: true, marker: best.marker };
}
