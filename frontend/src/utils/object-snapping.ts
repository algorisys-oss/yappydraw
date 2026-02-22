
import type { DrawingElement } from "../types";

export interface SnappingGuide {
    type: 'vertical' | 'horizontal';
    coordinate: number;
    elementIds: string[];
}

export interface SnappedResult {
    dx: number;
    dy: number;
    guides: SnappingGuide[];
}

export const getSnappingGuides = (
    activeIds: string[],
    allElements: DrawingElement[],
    dx: number,
    dy: number,
    threshold: number
): SnappedResult => {
    const activeElements = allElements.filter(el => activeIds.includes(el.id));
    if (activeElements.length === 0) return { dx, dy, guides: [] };

    // Calculate active bounding box after move
    const minX = Math.min(...activeElements.map(el => el.x)) + dx;
    const maxX = Math.max(...activeElements.map(el => el.x + el.width)) + dx;
    const minY = Math.min(...activeElements.map(el => el.y)) + dy;
    const maxY = Math.max(...activeElements.map(el => el.y + el.height)) + dy;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const activeXLines = [minX, centerX, maxX];
    const activeYLines = [minY, centerY, maxY];

    const guides: SnappingGuide[] = [];
    let bestDeltaX = 0;
    let bestDeltaY = 0;
    let minDistanceX = threshold + 1;
    let minDistanceY = threshold + 1;

    // Others
    const otherElements = allElements.filter(el => !activeIds.includes(el.id) && el.layerId === activeElements[0].layerId);

    for (const other of otherElements) {
        const oMinX = other.x;
        const oMaxX = other.x + other.width;
        const oCenterX = (oMinX + oMaxX) / 2;
        const otherXLines = [oMinX, oCenterX, oMaxX];

        const oMinY = other.y;
        const oMaxY = other.y + other.height;
        const oCenterY = (oMinY + oMaxY) / 2;
        const otherYLines = [oMinY, oCenterY, oMaxY];

        // Horizontal Snapping (Vertical Guides)
        for (const ax of activeXLines) {
            for (const ox of otherXLines) {
                const dist = Math.abs(ax - ox);
                if (dist < minDistanceX) {
                    minDistanceX = dist;
                    bestDeltaX = ox - ax;
                    // Reset guides for this axis if better found? 
                    // Actually we might want to collect all guides that match this best delta
                }
            }
        }

        // Vertical Snapping (Horizontal Guides)
        for (const ay of activeYLines) {
            for (const oy of otherYLines) {
                const dist = Math.abs(ay - oy);
                if (dist < minDistanceY) {
                    minDistanceY = dist;
                    bestDeltaY = oy - ay;
                }
            }
        }
    }

    // Second pass to collect all guides matching the best deltas
    if (minDistanceX <= threshold) {
        for (const other of otherElements) {
            const oMinX = other.x;
            const oMaxX = other.x + other.width;
            const oCenterX = (oMinX + oMaxX) / 2;
            const otherXLines = [oMinX, oCenterX, oMaxX];

            for (const ax of activeXLines) {
                for (const ox of otherXLines) {
                    if (Math.abs(ax + bestDeltaX - ox) < 0.1) {
                        guides.push({ type: 'vertical', coordinate: ox, elementIds: [other.id] });
                    }
                }
            }
        }
    }

    if (minDistanceY <= threshold) {
        for (const other of otherElements) {
            const oMinY = other.y;
            const oMaxY = other.y + other.height;
            const oCenterY = (oMinY + oMaxY) / 2;
            const otherYLines = [oMinY, oCenterY, oMaxY];

            for (const ay of activeYLines) {
                for (const oy of otherYLines) {
                    if (Math.abs(ay + bestDeltaY - oy) < 0.1) {
                        guides.push({ type: 'horizontal', coordinate: oy, elementIds: [other.id] });
                    }
                }
            }
        }
    }

    return {
        dx: dx + (minDistanceX <= threshold ? bestDeltaX : 0),
        dy: dy + (minDistanceY <= threshold ? bestDeltaY : 0),
        guides
    };
};
