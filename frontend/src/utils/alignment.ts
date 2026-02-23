import type { DrawingElement } from "../types";

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type DistributionType = 'horizontal' | 'vertical';

export const calculateAlignment = (ids: string[], elements: DrawingElement[], type: AlignmentType): { id: string, updates: Partial<DrawingElement> }[] => {
    const selectedElements = elements.filter(el => ids.includes(el.id));
    if (selectedElements.length < 2) return [];

    // Find bounding box of the selection
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selectedElements.forEach(el => {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
    });

    const midX = minX + (maxX - minX) / 2;
    const midY = minY + (maxY - minY) / 2;

    const updates: { id: string, updates: Partial<DrawingElement> }[] = [];

    selectedElements.forEach(el => {
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
