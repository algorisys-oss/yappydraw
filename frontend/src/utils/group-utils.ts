import type { DrawingElement } from "../types";

/**
 * Calculate the axis-aligned bounding box for all elements in a group
 */
export function getGroupBoundingBox(groupId: string, elements: DrawingElement[]): { x: number; y: number; width: number; height: number } | null {
    const groupElements = elements.filter(el => el.groupIds && el.groupIds.includes(groupId));

    if (groupElements.length === 0) {
        return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    groupElements.forEach(el => {
        // For most elements, use x, y, width, height
        const elMinX = el.x;
        const elMinY = el.y;
        const elMaxX = el.x + el.width;
        const elMaxY = el.y + el.height;

        minX = Math.min(minX, elMinX);
        minY = Math.min(minY, elMinY);
        maxX = Math.max(maxX, elMaxX);
        maxY = Math.max(maxY, elMaxY);
    });

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

/**
 * Check if a point is within a group's bounding box
 */
export function isPointInGroupBounds(x: number, y: number, groupId: string, elements: DrawingElement[]): boolean {
    const bounds = getGroupBoundingBox(groupId, elements);
    if (!bounds) return false;

    return x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height;
}

/**
 * Get all unique group IDs from elements, sorted by visual priority (topmost first)
 * Returns groups with their layer order for proper hit testing
 */
export function getGroupsSortedByPriority(elements: DrawingElement[], layers: any[]): { groupId: string; layerOrder: number; elementIndex: number }[] {
    const groupMap = new Map<string, { layerOrder: number; elementIndex: number }>();

    elements.forEach((el, index) => {
        if (el.groupIds && el.groupIds.length > 0) {
            // Use the outermost group ID (last in array)
            const outermostGroupId = el.groupIds[el.groupIds.length - 1];

            if (!groupMap.has(outermostGroupId)) {
                const layer = layers.find(l => l.id === el.layerId);
                groupMap.set(outermostGroupId, {
                    layerOrder: layer?.order ?? 999,
                    elementIndex: index
                });
            }
        }
    });

    // Convert to array and sort by priority (highest layer order first, then highest index)
    return Array.from(groupMap.entries())
        .map(([groupId, { layerOrder, elementIndex }]) => ({ groupId, layerOrder, elementIndex }))
        .sort((a, b) => {
            if (a.layerOrder !== b.layerOrder) return b.layerOrder - a.layerOrder;
            return b.elementIndex - a.elementIndex;
        });
}
