/**
 * Binding & Connector Logic
 * Handles line-to-shape binding detection, line point routing,
 * and bound line geometry updates when connected shapes move.
 */

import type { DrawingElement } from '../types';
import { findClosestAnchor, getAnchorPoints } from './anchor-points';
import { intersectElementWithLine } from './geometry';
import { calculateSmartElbowRoute } from './routing';

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

        const startEl = elements.find(e => e.id === line.startBinding?.elementId);
        const endEl = elements.find(e => e.id === line.endBinding?.elementId);

        const rawPoints = calculateSmartElbowRoute(
            { x: sx, y: sy },
            { x: ex, y: ey },
            elements,
            startEl,
            endEl,
            line.startBinding?.position,
            line.endBinding?.position
        );

        // Convert world points to relative points for storage
        return rawPoints.map(p => ({ x: p.x - sx, y: p.y - sy }));
    }

    // If it's a straight line/arrow that already has points, update them to be consistent with sx/sy
    if (line.points && line.points.length >= 2) {
        return [0, 0, ex - sx, ey - sy];
    }

    return undefined;
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

// ── Sibling spread: offset connectors sharing the same anchors ───────

const CONNECTOR_TYPES = new Set(['line', 'arrow', 'bezier', 'organicBranch']);
const SPREAD_SPACING = 16;

/** Find connectors sharing the exact same anchor positions (these overlap visually) */
function getOverlappingSiblingIndex(
    lineId: string,
    startElId: string,
    endElId: string,
    startPos: string | undefined,
    endPos: string | undefined,
    elements: DrawingElement[]
): { index: number; total: number } {
    const siblings = elements.filter(el => {
        if (!el.startBinding || !el.endBinding) return false;
        if (!CONNECTOR_TYPES.has(el.type)) return false;
        const sId = el.startBinding.elementId;
        const eId = el.endBinding.elementId;
        const sPos = el.startBinding.position;
        const ePos = el.endBinding.position;
        return ((sId === startElId && eId === endElId && sPos === startPos && ePos === endPos) ||
                (sId === endElId && eId === startElId && sPos === endPos && ePos === startPos));
    });

    if (siblings.length <= 1) return { index: 0, total: 1 };

    siblings.sort((a, b) => a.id.localeCompare(b.id));
    const index = siblings.findIndex(s => s.id === lineId);
    return { index: Math.max(0, index), total: siblings.length };
}

function computeSpreadOffset(
    index: number,
    total: number,
    startPos: string | undefined,
    sX: number, sY: number,
    eX: number, eY: number
): { dx: number; dy: number } {
    if (total <= 1) return { dx: 0, dy: 0 };

    const offset = (index - (total - 1) / 2) * SPREAD_SPACING;

    if (startPos === 'left' || startPos === 'right') {
        return { dx: 0, dy: offset };
    } else if (startPos === 'top' || startPos === 'bottom') {
        return { dx: offset, dy: 0 };
    }

    // Fallback: perpendicular to start→end vector
    const vx = eX - sX;
    const vy = eY - sY;
    const len = Math.sqrt(vx * vx + vy * vy) || 1;
    return { dx: (-vy / len) * offset, dy: (vx / len) * offset };
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

    // Spread connectors that share the exact same anchor positions
    if (line.startBinding && line.endBinding &&
        line.startBinding.elementId !== line.endBinding.elementId) {
        const { index, total } = getOverlappingSiblingIndex(
            line.id, line.startBinding.elementId, line.endBinding.elementId,
            line.startBinding.position, line.endBinding.position, elements
        );
        if (total > 1) {
            const spread = computeSpreadOffset(
                index, total, line.startBinding.position, sX, sY, eX, eY
            );
            sX += spread.dx;
            sY += spread.dy;
            eX += spread.dx;
            eY += spread.dy;
            changed = true;
        }
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
