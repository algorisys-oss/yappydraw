/**
 * Pool Lane Containment Utilities
 * Shared geometry and containment logic for BPMN Pool swimlanes.
 */

import type { DrawingElement } from '../types';
import { updateElement } from '../store/app-store';

// ── Layout helpers (mirror BpmnRenderer logic) ──

function getPoolLabelWidth(el: DrawingElement): number {
    return el.bpmnPoolLabelSize ?? Math.min(el.width * 0.06, 35);
}
function getLaneLabelWidth(el: DrawingElement): number {
    return el.bpmnLaneLabelSize ?? Math.min(el.width * 0.05, 28);
}
function getPoolLabelHeight(el: DrawingElement): number {
    return el.bpmnPoolLabelSize ?? Math.min(el.height * 0.08, 30);
}
function getLaneLabelHeight(el: DrawingElement): number {
    return el.bpmnLaneLabelSize ?? Math.min(el.height * 0.06, 25);
}

const COLLAPSED_LANE_SIZE = 25;

function computeLaneSizes(el: DrawingElement, totalSize: number): number[] {
    const laneCount = el.bpmnLaneCount ?? 1;
    if (laneCount <= 1) return [totalSize];

    const collapsed = el.bpmnLaneCollapsed ?? [];
    const collapsedCount = collapsed.filter(Boolean).length;
    const collapsedTotal = collapsedCount * COLLAPSED_LANE_SIZE;
    const remainingSize = Math.max(0, totalSize - collapsedTotal);

    const heights = el.bpmnLaneHeights;
    if (heights && heights.length === laneCount) {
        const expandedSum = heights.reduce((sum, h, i) => collapsed[i] ? sum : sum + h, 0);
        return heights.map((h, i) =>
            collapsed[i] ? COLLAPSED_LANE_SIZE : (expandedSum > 0 ? (h / expandedSum) * remainingSize : 0));
    }
    // Equal division of remaining space
    const expandedCount = laneCount - collapsedCount;
    const expandedSize = expandedCount > 0 ? remainingSize / expandedCount : 0;
    return Array.from({ length: laneCount }, (_, i) =>
        collapsed[i] ? COLLAPSED_LANE_SIZE : expandedSize);
}

// ── Lane geometry ──

export interface LaneRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Get the world-space content rectangle of a specific lane */
export function getPoolLaneRect(pool: DrawingElement, laneIndex: number): LaneRect | null {
    const laneCount = pool.bpmnLaneCount ?? 1;
    if (laneIndex < 0 || laneIndex >= laneCount) return null;

    const isVertical = pool.bpmnOrientation === 'vertical';

    if (isVertical) {
        const poolLabelH = getPoolLabelHeight(pool);
        const hasLaneLabels = laneCount > 1;
        const laneLabelH = hasLaneLabels ? getLaneLabelHeight(pool) : 0;
        const laneSizes = computeLaneSizes(pool, pool.width);

        let laneX = pool.x;
        for (let i = 0; i < laneIndex; i++) laneX += laneSizes[i];

        return {
            x: laneX,
            y: pool.y + poolLabelH + laneLabelH,
            width: laneSizes[laneIndex],
            height: pool.height - poolLabelH - laneLabelH,
        };
    } else {
        const poolLabelW = getPoolLabelWidth(pool);
        const hasLaneLabels = laneCount > 1;
        const laneLabelW = hasLaneLabels ? getLaneLabelWidth(pool) : 0;
        const laneSizes = computeLaneSizes(pool, pool.height);

        let laneY = pool.y;
        for (let i = 0; i < laneIndex; i++) laneY += laneSizes[i];

        return {
            x: pool.x + poolLabelW + laneLabelW,
            y: laneY,
            width: pool.width - poolLabelW - laneLabelW,
            height: laneSizes[laneIndex],
        };
    }
}

/**
 * Hit-test a world point against pool lanes. Returns 0-based lane index or -1.
 * @param contentOnly If true, only matches the content area (excludes label columns).
 *                    If false (default), matches anywhere in the pool based on lane position.
 */
export function hitTestPoolLane(pool: DrawingElement, worldX: number, worldY: number, contentOnly = false): number {
    const laneCount = pool.bpmnLaneCount ?? 1;
    if (laneCount < 1) return -1;

    // Basic bounds check — must be inside the pool rectangle
    if (worldX < pool.x || worldX > pool.x + pool.width) return -1;
    if (worldY < pool.y || worldY > pool.y + pool.height) return -1;

    const isVertical = pool.bpmnOrientation === 'vertical';

    if (isVertical) {
        if (contentOnly) {
            const poolLabelH = getPoolLabelHeight(pool);
            const laneLabelH = laneCount > 1 ? getLaneLabelHeight(pool) : 0;
            if (worldY < pool.y + poolLabelH + laneLabelH) return -1;
        }

        const laneSizes = computeLaneSizes(pool, pool.width);
        let laneX = pool.x;
        for (let i = 0; i < laneCount; i++) {
            if (worldX >= laneX && worldX < laneX + laneSizes[i]) return i;
            laneX += laneSizes[i];
        }
    } else {
        if (contentOnly) {
            const poolLabelW = getPoolLabelWidth(pool);
            const laneLabelW = laneCount > 1 ? getLaneLabelWidth(pool) : 0;
            if (worldX < pool.x + poolLabelW + laneLabelW) return -1;
        }

        const laneSizes = computeLaneSizes(pool, pool.height);
        let laneY = pool.y;
        for (let i = 0; i < laneCount; i++) {
            if (worldY >= laneY && worldY < laneY + laneSizes[i]) return i;
            laneY += laneSizes[i];
        }
    }

    return -1;
}

// ── Containment operations ──

export function assignToPoolLane(elementId: string, poolId: string, laneIndex: number): void {
    updateElement(elementId, { poolContainerId: poolId, poolLaneIndex: laneIndex }, false);
}

export function unassignFromPool(elementId: string): void {
    updateElement(elementId, { poolContainerId: null, poolLaneIndex: undefined }, false);
}

/** When a lane is removed, uncontain its elements and shift later indices down */
export function shiftLaneIndicesOnRemove(
    poolId: string, removedIndex: number, elements: DrawingElement[]
): void {
    for (const el of elements) {
        if (el.poolContainerId !== poolId || el.poolLaneIndex === undefined) continue;
        if (el.poolLaneIndex === removedIndex) {
            updateElement(el.id, { poolContainerId: null, poolLaneIndex: undefined }, false);
        } else if (el.poolLaneIndex > removedIndex) {
            updateElement(el.id, { poolLaneIndex: el.poolLaneIndex - 1 }, false);
        }
    }
}

/** When a lane is inserted, shift indices at or after the inserted position up */
export function shiftLaneIndicesOnInsert(
    poolId: string, insertedIndex: number, elements: DrawingElement[]
): void {
    for (const el of elements) {
        if (el.poolContainerId !== poolId || el.poolLaneIndex === undefined) continue;
        if (el.poolLaneIndex >= insertedIndex) {
            updateElement(el.id, { poolLaneIndex: el.poolLaneIndex + 1 }, false);
        }
    }
}

export { COLLAPSED_LANE_SIZE, computeLaneSizes };
