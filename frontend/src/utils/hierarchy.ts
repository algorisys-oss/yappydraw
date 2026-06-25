import type { DrawingElement } from "../types";

/**
 * Returns true if an element's parent (or any ancestor) is collapsed.
 */
export const isElementHiddenByHierarchy = (
    el: DrawingElement,
    elements: readonly DrawingElement[],
    elementMap?: Map<string, DrawingElement>
): boolean => {
    // A clip/opacity mask shape isn't drawn or selectable on its own.
    if (el.isClipMask) return true;

    // If it's a bound connector, hide it if its target node is hidden
    if ((el.type === 'line' || el.type === 'arrow' || el.type === 'bezier' || el.type === 'organicBranch') && el.endBinding) {
        const targetId = el.endBinding.elementId;
        const target = elementMap ? elementMap.get(targetId) : elements.find(e => e.id === targetId);
        if (target && isElementHiddenByHierarchy(target, elements, elementMap)) return true;
    }

    if (!el.parentId) return false;

    let currentParentId: string | null = el.parentId;
    const visited = new Set<string>(); // Prevent infinite loops

    while (currentParentId) {
        if (visited.has(currentParentId)) break;
        visited.add(currentParentId);

        const targetId: string = currentParentId;
        const parent = elementMap ? elementMap.get(targetId) : elements.find(e => e.id === targetId);
        if (!parent) break;

        if (parent.isCollapsed) return true;
        currentParentId = parent.parentId || null;
    }

    return false;
};

/**
 * Gets all descendants (children, grandchildren, etc.) of a given element.
 */
export const getDescendants = (parentId: string, elements: readonly DrawingElement[]): DrawingElement[] => {
    const descendants: DrawingElement[] = [];
    const queue = [parentId];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const children = elements.filter(e => e.parentId === currentId);
        descendants.push(...children);
        queue.push(...children.map(c => c.id));
    }

    return descendants;
};

/**
 * Check if the target is a descendant of the ancestor.
 */
export const isDescendantOf = (targetId: string, ancestorId: string, elements: readonly DrawingElement[]): boolean => {
    const descendants = getDescendants(ancestorId, elements);
    return descendants.some(d => d.id === targetId);
};
