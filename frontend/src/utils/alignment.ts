import type { DrawingElement } from "../types";

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type DistributionType = 'horizontal' | 'vertical';

export const calculateAlignment = (ids: string[], elements: DrawingElement[], type: AlignmentType, keyId?: string): { id: string, updates: Partial<DrawingElement> }[] => {
    const selectedElements = elements.filter(el => ids.includes(el.id));
    if (selectedElements.length < 2) return [];

    // The alignment frame is normally the selection's bounding box; with a key
    // object it's that object's box instead (and the key object never moves).
    const key = keyId ? selectedElements.find(el => el.id === keyId) : undefined;
    let minX: number, minY: number, maxX: number, maxY: number;
    if (key) {
        minX = key.x; minY = key.y; maxX = key.x + key.width; maxY = key.y + key.height;
    } else {
        minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
        selectedElements.forEach(el => {
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + el.width);
            maxY = Math.max(maxY, el.y + el.height);
        });
    }

    const midX = minX + (maxX - minX) / 2;
    const midY = minY + (maxY - minY) / 2;

    const updates: { id: string, updates: Partial<DrawingElement> }[] = [];

    selectedElements.forEach(el => {
        if (key && el.id === key.id) return; // the key object stays put
        const up: Partial<DrawingElement> = {};

        switch (type) {
            case 'left':
                up.x = minX;
                break;
            case 'center': // Horizontal center
                up.x = midX - el.width / 2;
                break;
            case 'right':
                up.x = maxX - el.width;
                break;
            case 'top':
                up.y = minY;
                break;
            case 'middle': // Vertical middle
                up.y = midY - el.height / 2;
                break;
            case 'bottom':
                up.y = maxY - el.height;
                break;
        }

        // Only push if changed
        if (up.x !== undefined || up.y !== undefined) {
            updates.push({ id: el.id, updates: up });
        }
    });

    return updates;
};

export const calculateDistribution = (ids: string[], elements: DrawingElement[], type: DistributionType): { id: string, updates: Partial<DrawingElement> }[] => {
    const selectedElements = elements.filter(el => ids.includes(el.id));
    if (selectedElements.length < 3) return []; // Need at least 3 to distribute? Or 2? 3 makes sense for "distribute between". 
    // Actually distribute usually means equal spacing between first and last.

    // Sort by position
    const sorted = [...selectedElements].sort((a, b) => {
        if (type === 'horizontal') {
            return (a.x + a.width / 2) - (b.x + b.width / 2);
        } else {
            return (a.y + a.height / 2) - (b.y + b.height / 2);
        }
    });

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    // Total span available between First Center and Last Center
    // Or between edges? Usually it's "Distribute Centers" or "Distribute Spacing".
    // Let's do "Distribute Centers" as it's simpler and standard.
    // Or "Distribute objects horizontally" in Figma/Adobe usually means "Distribute horizontal centers".

    // Let's implement Distribute Horizontal Centers

    if (type === 'horizontal') {
        const startX = first.x + first.width / 2;
        const endX = last.x + last.width / 2;
        const totalDist = endX - startX;
        const step = totalDist / (sorted.length - 1);

        const updates: { id: string, updates: Partial<DrawingElement> }[] = [];

        sorted.forEach((el, index) => {
            if (index === 0 || index === sorted.length - 1) return; // Don't move ends
            const targetCenterX = startX + step * index;
            const newX = targetCenterX - el.width / 2;
            updates.push({ id: el.id, updates: { x: newX } });
        });
        return updates;
    } else {
        const startY = first.y + first.height / 2;
        const endY = last.y + last.height / 2;
        const totalDist = endY - startY;
        const step = totalDist / (sorted.length - 1);

        const updates: { id: string, updates: Partial<DrawingElement> }[] = [];

        sorted.forEach((el, index) => {
            if (index === 0 || index === sorted.length - 1) return;
            const targetCenterY = startY + step * index;
            const newY = targetCenterY - el.height / 2;
            updates.push({ id: el.id, updates: { y: newY } });
        });
        return updates;
    }
};

/**
 * Distribute by SPACING — make the edge-to-edge gaps between adjacent objects
 * equal (unlike `calculateDistribution`, which equalizes centres). With an
 * explicit `gap`, pack the objects from the first with exactly that gap;
 * otherwise spread them so the gaps are equal while keeping the first and last
 * objects in place. Needs ≥ 3 objects (or ≥ 2 when an explicit gap is given).
 */
export const calculateSpacingDistribution = (
    ids: string[], elements: DrawingElement[], type: DistributionType, gap?: number,
): { id: string, updates: Partial<DrawingElement> }[] => {
    const selectedElements = elements.filter(el => ids.includes(el.id));
    const horizontal = type === 'horizontal';
    const size = (el: DrawingElement) => (horizontal ? el.width : el.height);
    const pos = (el: DrawingElement) => (horizontal ? el.x : el.y);
    const sorted = [...selectedElements].sort((a, b) => pos(a) - pos(b));
    if (sorted.length < (gap !== undefined ? 2 : 3)) return [];

    const updates: { id: string, updates: Partial<DrawingElement> }[] = [];

    if (gap !== undefined) {
        // Pack with a fixed gap, starting at the first object's position.
        let cursor = pos(sorted[0]) + size(sorted[0]) + gap;
        for (let i = 1; i < sorted.length; i++) {
            const el = sorted[i];
            updates.push({ id: el.id, updates: horizontal ? { x: cursor } : { y: cursor } });
            cursor += size(el) + gap;
        }
        return updates;
    }

    // Equal gaps between first and last (both ends fixed).
    const startEdge = pos(sorted[0]) + size(sorted[0]);
    const lastEl = sorted[sorted.length - 1];
    const endEdge = pos(lastEl);
    const totalSize = sorted.slice(1, -1).reduce((s, el) => s + size(el), 0);
    const equalGap = (endEdge - startEdge - totalSize) / (sorted.length - 1);
    let cursor = startEdge + equalGap;
    for (let i = 1; i < sorted.length - 1; i++) {
        const el = sorted[i];
        updates.push({ id: el.id, updates: horizontal ? { x: cursor } : { y: cursor } });
        cursor += size(el) + equalGap;
    }
    return updates;
};
