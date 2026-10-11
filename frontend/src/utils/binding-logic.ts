/**
 * Binding & Connector Logic
 * Handles line-to-shape binding detection, line point routing,
 * and bound line geometry updates when connected shapes move.
 */

import type { DrawingElement } from '../types';
import { findClosestAnchor, getAnchorPoints } from './anchor-points';
import { intersectElementWithLine } from './geometry';
import { calculateSmartElbowRoute, simplifyElbowPath } from './routing';
import { allocatePort, routingSide } from './connector-routing';

/**
 * Find which shape element (if any) is near a given point, suitable for binding a line endpoint.
 * Returns the target element, snap point, and anchor position.
 */
export function checkBinding(
    x: number,
    y: number,
    excludeId: string,
    elements: DrawingElement[],
    scale: number,
    activeLayerId: string,
    canInteract: (el: DrawingElement) => boolean
): { element: DrawingElement; snapPoint: { x: number; y: number }; position: string } | null {
    const threshold = 40 / scale;
    const anchorSnapThreshold = 25 / scale;

    // A target is "hit" when the point is within `t` of its geometry. Returns the area of
    // the target (for innermost-preference) when hit at threshold `t`, else null.
    const hitArea = (target: DrawingElement, isPolylineShape: boolean, t: number): number | null => {
        if (target.type === 'circle') {
            const cx = target.x + target.width / 2;
            const cy = target.y + target.height / 2;
            const rx = target.width / 2 + t;
            const ry = target.height / 2 + t;
            if (((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2) <= 1) {
                return Math.abs(target.width * target.height);
            }
            return null;
        }
        if (isPolylineShape && target.points && Array.isArray(target.points) && (target.points as any[]).length >= 2) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const p of target.points as { x: number; y: number }[]) {
                minX = Math.min(minX, target.x + p.x); minY = Math.min(minY, target.y + p.y);
                maxX = Math.max(maxX, target.x + p.x); maxY = Math.max(maxY, target.y + p.y);
            }
            if (x >= minX - t && x <= maxX + t && y >= minY - t && y <= maxY + t) {
                return Math.abs((maxX - minX) * (maxY - minY));
            }
            return null;
        }
        // rectangle / text / image / video / generic shapes: bbox test
        if (x >= target.x - t && x <= target.x + target.width + t &&
            y >= target.y - t && y <= target.y + target.height + t) {
            return Math.abs(target.width * target.height);
        }
        return null;
    };

    // Collect every candidate the point is near, then pick the most specific one so a
    // connector targets the inner child rather than the container it sits inside.
    // Preference (best first): the point is actually *inside* the shape over merely near
    // it; then smaller area (the inner/nested child); then higher z-order (drawn on top).
    type Cand = { target: DrawingElement; area: number; inside: boolean; idx: number };
    const candidates: Cand[] = [];
    const tightT = Math.min(threshold, 4 / scale);
    for (let idx = 0; idx < elements.length; idx++) {
        const target = elements[idx];
        if (target.id === excludeId) continue;
        if (!canInteract(target)) continue;
        const isPolylineShape = target.type === 'line' && target.curveType === 'elbow' && !target.startBinding && !target.endBinding;
        if ((target.type === 'line' || target.type === 'arrow' || target.type === 'bezier' || target.type === 'organicBranch') && !isPolylineShape) continue;
        // Skip pool containers — connectors should bind to shapes inside the pool, not the pool itself
        if (target.type === 'bpmnPool') continue;
        if (target.layerId !== activeLayerId) continue;

        const area = hitArea(target, isPolylineShape, threshold);
        if (area === null) continue;
        const inside = hitArea(target, isPolylineShape, tightT) !== null;
        candidates.push({ target, area, inside, idx });
    }

    candidates.sort((a, b) => {
        if (a.inside !== b.inside) return a.inside ? -1 : 1; // inside beats merely-near
        if (a.area !== b.area) return a.area - b.area;        // innermost (smallest) wins
        return b.idx - a.idx;                                 // topmost z as tiebreak
    });
    const bindingHit = candidates.length ? candidates[0].target : null;

    if (bindingHit) {
        // Try anchor snap first
        const closestAnchor = findClosestAnchor(bindingHit, { x, y }, anchorSnapThreshold);
        if (closestAnchor) {
            return { element: bindingHit, snapPoint: { x: closestAnchor.x, y: closestAnchor.y }, position: closestAnchor.position };
        }

        // Fallback to edge intersection logic
        const snapPoint = intersectElementWithLine(bindingHit, { x, y }, 5);
        if (snapPoint) {
            return { element: bindingHit, snapPoint, position: 'edge' };
        }
    }
    return null;
}

/**
 * Recalculate routing points for a line element (elbow routing or simple start/end).
 * Returns updated points array or undefined if no update needed.
 */
export function refreshLinePoints(
    line: DrawingElement,
    elements: DrawingElement[],
    overrideStartX?: number,
    overrideStartY?: number,
    overrideEndX?: number,
    overrideEndY?: number
): { x: number; y: number }[] | number[] | undefined {
    const sx = overrideStartX ?? line.x;
    const sy = overrideStartY ?? line.y;
    const ex = overrideEndX ?? (line.x + line.width);
    const ey = overrideEndY ?? (line.y + line.height);

    if (line.curveType === 'elbow') {
        // Unbound polylines (user-defined multi-point elbows) — preserve existing points
        if (!line.startBinding && !line.endBinding) {
            return undefined;
        }

        // Hand-edited waypoints are the user's: keep them and only re-attach the ends.
        if (line.manualRoute) {
            const kept = reattachManualRoute(line, { x: sx, y: sy }, { x: ex, y: ey });
            if (kept) return kept;
        }

        const startEl = elements.find(e => e.id === line.startBinding?.elementId);
        const endEl = elements.find(e => e.id === line.endBinding?.elementId);

        // Exit/entry sides come from where the endpoint actually IS on its shape — the
        // stored `position` is absent (API/DSL), non-cardinal ('edge', corners) or
        // stale (ports, re-facing) often enough that routing on it hugged borders and
        // cut through shapes. See routingSide.
        const startSide = startEl ? routingSide(startEl, { x: sx, y: sy }, line.startBinding?.position) : undefined;
        const endSide = endEl ? routingSide(endEl, { x: ex, y: ey }, line.endBinding?.position) : undefined;

        const rawPoints = calculateSmartElbowRoute(
            { x: sx, y: sy },
            { x: ex, y: ey },
            elements,
            startEl,
            endEl,
            startSide,
            endSide,
            line   // selfLine: enables soft-avoidance of other connectors' bodies
        );

        // Convert world points to relative points for storage. Connector points are
        // stored as a FLAT number[] (matching `connect()` and the straight-line branch
        // below); returning {x,y} objects here corrupts the elbow on every bound-shape
        // move (e.g. when a group of connected shapes is dragged), so flatten.
        return rawPoints.flatMap(p => [p.x - sx, p.y - sy]);
    }

    // If it's a straight line/arrow that already has points, update them to be consistent with sx/sy
    if (line.points && line.points.length >= 2) {
        return [0, 0, ex - sx, ey - sy];
    }

    return undefined;
}

/**
 * Move a hand-routed elbow's ends to their new anchor points without re-routing it.
 *
 * The first and last segments keep their axis: when the start moves, the second point
 * slides so the first segment stays vertical or horizontal, likewise at the end. The
 * interior bends stay exactly where the user put them. Returns the new flat, relative
 * point list, or undefined when the stored points are unusable (caller re-routes).
 */
function reattachManualRoute(
    line: DrawingElement,
    start: { x: number; y: number },
    end: { x: number; y: number }
): number[] | undefined {
    const rel = normalizePointList(line.points);
    if (rel.length < 2) return undefined;
    const pts = rel.map(p => ({ x: line.x + p.x, y: line.y + p.y }));
    const n = pts.length;
    if (n >= 3) {
        const firstVertical = Math.abs(pts[0].x - pts[1].x) < 1;
        if (firstVertical) pts[1].x = start.x; else pts[1].y = start.y;
        const lastVertical = Math.abs(pts[n - 1].x - pts[n - 2].x) < 1;
        if (lastVertical) pts[n - 2].x = end.x; else pts[n - 2].y = end.y;
    }
    pts[0] = { x: start.x, y: start.y };
    pts[n - 1] = { x: end.x, y: end.y };
    const clean = simplifyElbowPath(pts);
    if (clean.length < 2) return undefined;
    return clean.flatMap(p => [p.x - start.x, p.y - start.y]);
}

/** Read `points` (flat number[] or {x,y}[]) as {x,y}[] — relative to the element. */
function normalizePointList(points: DrawingElement['points']): { x: number; y: number }[] {
    if (!points || points.length < 2) return [];
    if (typeof points[0] === 'number') {
        const flat = points as number[];
        const out: { x: number; y: number }[] = [];
        for (let i = 0; i + 1 < flat.length; i += 2) out.push({ x: flat[i], y: flat[i + 1] });
        return out;
    }
    return (points as { x: number; y: number }[]).map(p => ({ x: p.x, y: p.y }));
}

/** World-space box of an elbow's drawn route (its waypoints, not just its start→end box). */
export function elbowRouteBounds(el: DrawingElement): { x1: number; y1: number; x2: number; y2: number } {
    const rel = normalizePointList(el.points);
    let x1 = Math.min(el.x, el.x + el.width), x2 = Math.max(el.x, el.x + el.width);
    let y1 = Math.min(el.y, el.y + el.height), y2 = Math.max(el.y, el.y + el.height);
    for (const p of rel) {
        const wx = el.x + p.x, wy = el.y + p.y;
        if (wx < x1) x1 = wx; if (wx > x2) x2 = wx;
        if (wy < y1) y1 = wy; if (wy > y2) y2 = wy;
    }
    return { x1, y1, x2, y2 };
}

const boxesMeet = (a: { x1: number; y1: number; x2: number; y2: number }, b: { x1: number; y1: number; x2: number; y2: number }) =>
    a.x1 <= b.x2 && a.x2 >= b.x1 && a.y1 <= b.y2 && a.y2 >= b.y1;

/** The router keeps this much clear of a shape; crossing tests use the same margin. */
export const ROUTE_CLEARANCE = 15;

const isBoundElbow = (el: DrawingElement) =>
    el.curveType === 'elbow' && !!(el.startBinding || el.endBinding) && PORT_GROUP_CONNECTOR_TYPES.has(el.type);

/**
 * Bound elbow connectors whose drawn route meets any of `boxes` (each already padded
 * by the caller as needed). Used to re-route elbows a moved or resized shape now sits
 * on, even though nothing they are bound to changed.
 */
export function elbowsCrossing(
    boxes: { x1: number; y1: number; x2: number; y2: number }[],
    elements: DrawingElement[],
    exclude: ReadonlySet<string> = new Set()
): string[] {
    if (boxes.length === 0) return [];
    const out: string[] = [];
    for (const el of elements) {
        if (!isBoundElbow(el) || exclude.has(el.id)) continue;
        const b = elbowRouteBounds(el);
        const padded = { x1: b.x1 - ROUTE_CLEARANCE, y1: b.y1 - ROUTE_CLEARANCE, x2: b.x2 + ROUTE_CLEARANCE, y2: b.y2 + ROUTE_CLEARANCE };
        if (boxes.some(box => boxesMeet(padded, box))) out.push(el.id);
    }
    return out;
}

/**
 * Refresh a set of connectors the way every caller should: expanded to their port
 * groups, in ascending id order (each route then sees its lower-id dependencies'
 * fresh geometry), and followed by ONE cascade pass.
 *
 * The cascade is what connector-vs-connector avoidance needs to actually hold after a
 * move. Avoidance is one-directional — a connector steers clear only of LOWER-id
 * bodies — so when a lower-id connector is re-routed onto a lane a higher-id one is
 * using, the higher-id one has to be re-routed too, and nothing bound it to the move.
 * After the main pass, every bound elbow with a higher id than some refreshed elbow
 * whose route box it meets is refreshed as well. One level only: a second level would
 * be the same work again for diminishing returns, and bounded work per frame matters
 * more during a drag.
 */
export function refreshConnectors(
    lineIds: string[],
    getElements: () => DrawingElement[],
    updateElementFn: (id: string, updates: any, pushHistory: boolean) => void
): void {
    if (lineIds.length === 0) return;
    const first = expandToPortGroups(lineIds, getElements());
    const done = new Set<string>();
    for (const id of first) {
        done.add(id);
        refreshBoundLine(id, getElements, updateElementFn);
    }

    const elements = getElements();
    const refreshedElbows = first
        .map(id => elements.find(e => e.id === id))
        .filter((e): e is DrawingElement => !!e && isBoundElbow(e));
    if (refreshedElbows.length === 0) return;
    const boxes = refreshedElbows.map(elbowRouteBounds);
    const lowest = refreshedElbows.map(e => e.id).sort()[0];
    const cascade = elbowsCrossing(boxes, elements, done).filter(id => id > lowest).sort();
    for (const id of cascade) refreshBoundLine(id, getElements, updateElementFn);
}

const PORT_GROUP_CONNECTOR_TYPES = new Set(['line', 'arrow', 'bezier', 'organicBranch']);

/**
 * Expand a set of connector ids to every connector that shares a bound node with them
 * — the "port group".
 *
 * Port allocation is a GROUP function: a connector's port depends on how many other
 * endpoints share that node side and how they sort. So whenever one member is
 * re-laid-out, every peer on those nodes must be too, or peers keep ports computed
 * for a stale group size/order and two connectors can land on the SAME point. (The
 * spread this replaced was pair-local, so refreshing only the moved element's own
 * connectors used to be sufficient — it no longer is.)
 *
 * Returns ids sorted ascending. That order matters for connector-vs-connector
 * avoidance: a connector only avoids lower-id ones, so refreshing in id order means
 * each route reads its dependencies' fresh geometry rather than last frame's.
 */
export function expandToPortGroups(lineIds: string[], elements: DrawingElement[]): string[] {
    const nodeIds = new Set<string>();
    for (const id of lineIds) {
        const line = elements.find(e => e.id === id);
        if (!line) continue;
        if (line.startBinding?.elementId) nodeIds.add(line.startBinding.elementId);
        if (line.endBinding?.elementId) nodeIds.add(line.endBinding.elementId);
    }
    if (nodeIds.size === 0) return [...lineIds].sort();

    const out = new Set(lineIds);
    for (const el of elements) {
        if (!PORT_GROUP_CONNECTOR_TYPES.has(el.type)) continue;
        const s = el.startBinding?.elementId;
        const e = el.endBinding?.elementId;
        if ((s && nodeIds.has(s)) || (e && nodeIds.has(e))) out.add(el.id);
    }
    return [...out].sort();
}

/**
 * Compute anchor fractions (0-1) for a binding endpoint relative to a shape's bbox.
 * These fractions allow precise, stable repositioning when shapes move.
 */
export function computeAnchorFractions(
    binding: { elementId: string; focus: number; gap: number; position?: string; anchorFractionX?: number; anchorFractionY?: number },
    endpointX: number,
    endpointY: number,
    elements: DrawingElement[]
): typeof binding {
    const el = elements.find(e => e.id === binding.elementId);
    if (!el || el.width === 0 || el.height === 0) return binding;

    const fx = (endpointX - el.x) / el.width;
    const fy = (endpointY - el.y) / el.height;

    return { ...binding, anchorFractionX: fx, anchorFractionY: fy };
}

/**
 * Resolve a binding to an absolute point on the target shape.
 * Priority: anchorFractions > named anchor > edge intersection fallback.
 */
function resolveBindingPoint(
    binding: { position?: string; gap: number; anchorFractionX?: number; anchorFractionY?: number },
    el: DrawingElement,
    otherEnd: { x: number; y: number }
): { x: number; y: number } | null {
    let point: { x: number; y: number } | null = null;

    // 1. Precise fractions — always preferred when available
    if (binding.anchorFractionX != null && binding.anchorFractionY != null) {
        point = {
            x: el.x + binding.anchorFractionX * el.width,
            y: el.y + binding.anchorFractionY * el.height
        };
    }

    // 2. Named anchor position
    if (!point) {
        const pos = binding.position;
        if (pos && pos !== 'edge') {
            const anchors = getAnchorPoints(el);
            const anchor = anchors.find(a => a.position === pos);
            if (anchor) point = { x: anchor.x, y: anchor.y };
        }
    }

    // 3. Edge intersection fallback (legacy 'edge' bindings without fractions)
    if (!point) {
        point = intersectElementWithLine(el, otherEnd, binding.gap);
    }

    // 4. Dynamic re-facing: if the stored anchor now points AWAY from the other
    // endpoint (e.g. the other shape was moved to the opposite side), re-anchor to
    // the boundary point facing it so the connector stays aligned. A stored anchor
    // that still faces the other shape (dot >= 0) is kept, preserving intentional
    // placement. When geometry returns to facing, the stored anchor re-applies.
    if (point) {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        const nx = point.x - cx, ny = point.y - cy;      // anchor's outward direction
        const ox = otherEnd.x - cx, oy = otherEnd.y - cy; // toward the other endpoint
        if (nx * ox + ny * oy < 0) {
            const dyn = intersectElementWithLine(el, otherEnd, binding.gap);
            if (dyn) point = dyn;
        }
    }

    // Apply arrowAnchorAlign: override Y for left/right edge connections
    if (point && el.arrowAnchorAlign && el.arrowAnchorAlign !== 'middle') {
        const isOnLeftEdge = Math.abs(point.x - el.x) < 2;
        const isOnRightEdge = Math.abs(point.x - (el.x + el.width)) < 2;
        if (isOnLeftEdge || isOnRightEdge) {
            const padding = Math.min(el.height * 0.25, 20);
            if (el.arrowAnchorAlign === 'top') {
                point.y = el.y + padding;
            } else if (el.arrowAnchorAlign === 'bottom') {
                point.y = el.y + el.height - padding;
            }
        }
    }

    return point;
}

/**
 * Update a bound line's geometry when its connected shape(s) have moved.
 * Resolves stored anchor positions to actual coordinates. A stored anchor is kept
 * while it still faces the other endpoint; if a shape is moved so the anchor would
 * point away (e.g. to the opposite side), the endpoint re-faces to the boundary
 * point toward the other shape so the connector stays aligned.
 * Applies perpendicular spread to sibling connectors sharing identical anchors.
 *
 * @param lineId         The line element ID to refresh
 * @param getElements    Getter returning the current elements array
 * @param updateElementFn Store mutation function for updating element properties
 */
export function refreshBoundLine(
    lineId: string,
    getElements: () => DrawingElement[],
    updateElementFn: (id: string, updates: any, pushHistory: boolean) => void
): void {
    const elements = getElements();
    const line = elements.find(l => l.id === lineId);
    if (!line || (line.type !== 'line' && line.type !== 'arrow' && line.type !== 'organicBranch' && line.type !== 'bezier')) return;

    let sX = line.x;
    let sY = line.y;
    let eX = line.x + line.width;
    let eY = line.y + line.height;
    let changed = false;

    // Resolve each bound endpoint toward the OTHER element's centre (not the line's
    // current endpoint) so the dynamic re-facing test is stable and order-independent.
    const startEl = line.startBinding ? elements.find(e => e.id === line.startBinding!.elementId) : undefined;
    const endEl = line.endBinding ? elements.find(e => e.id === line.endBinding!.elementId) : undefined;
    const centerOf = (el: DrawingElement) => ({ x: el.x + el.width / 2, y: el.y + el.height / 2 });

    if (startEl) {
        const toward = endEl ? centerOf(endEl) : { x: eX, y: eY };
        const p = resolveBindingPoint(line.startBinding!, startEl, toward);
        if (p) { sX = p.x; sY = p.y; changed = true; }
    }

    if (endEl) {
        const toward = startEl ? centerOf(startEl) : { x: sX, y: sY };
        const p = resolveBindingPoint(line.endBinding!, endEl, toward);
        if (p) { eX = p.x; eY = p.y; changed = true; }
    }

    // Port allocation ("routing channels"): when >= 2 connector endpoints share a
    // node side — hub fan-in from different neighbours, OR a bundle between the same
    // pair (duplicates / bidirectional A<->B) — distribute them into evenly spaced,
    // crossing-minimised ports instead of stacking on a single anchor. Applied
    // transiently (no persisted fractions); returns null for a lone endpoint, which
    // keeps its plain anchor. This supersedes the old sibling-spread. See
    // connector-routing.ts.
    if (startEl && line.startBinding) {
        const pp = allocatePort(line, startEl, 'start', elements);
        if (pp) { sX = pp.x; sY = pp.y; changed = true; }
    }
    if (endEl && line.endBinding) {
        const pp = allocatePort(line, endEl, 'end', elements);
        if (pp) { eX = pp.x; eY = pp.y; changed = true; }
    }

    if (changed) {
        const points = refreshLinePoints(line, elements, sX, sY, eX, eY);
        if (sX !== line.x || sY !== line.y || (eX - sX) !== line.width || (eY - sY) !== line.height || JSON.stringify(points) !== JSON.stringify(line.points)) {

            const updates: any = {
                x: sX,
                y: sY,
                width: eX - sX,
                height: eY - sY,
                points
            };

            // For organicBranch or bezier, update control points
            const hasControlPoints = line.controlPoints && line.controlPoints.length === 2;
            if (hasControlPoints) {
                const newWidth = eX - sX;
                const newHeight = eY - sY;

                // Detect if primary direction reversed (sign flip)
                const directionReversed =
                    (Math.sign(line.width) !== Math.sign(newWidth) && Math.abs(newWidth) > 1) ||
                    (Math.sign(line.height) !== Math.sign(newHeight) && Math.abs(newHeight) > 1);

                if (directionReversed) {
                    // Regenerate S-curve control points for the new direction
                    if (Math.abs(newWidth) > Math.abs(newHeight)) {
                        updates.controlPoints = [
                            { x: sX + newWidth * 0.4, y: sY },
                            { x: eX - newWidth * 0.4, y: eY }
                        ];
                    } else {
                        updates.controlPoints = [
                            { x: sX, y: sY + newHeight * 0.4 },
                            { x: eX, y: eY - newHeight * 0.4 }
                        ];
                    }
                } else {
                    // Translate control points with start/end deltas
                    const dSX = sX - line.x;
                    const dSY = sY - line.y;
                    const dEX = eX - (line.x + line.width);
                    const dEY = eY - (line.y + line.height);
                    updates.controlPoints = [
                        { x: line.controlPoints![0].x + dSX, y: line.controlPoints![0].y + dSY },
                        { x: line.controlPoints![1].x + dEX, y: line.controlPoints![1].y + dEY }
                    ];
                }
            }

            updateElementFn(line.id, updates, false);
        }
    }
}
