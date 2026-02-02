import type { DrawingElement } from '../types';
import { rotatePoint } from './geometry';

export interface Point {
    x: number;
    y: number;
}

export interface AnchorPoint extends Point {
    position: 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Get anchor points for a given element
 * Returns anchor positions in absolute canvas coordinates
 */
export function getAnchorPoints(element: DrawingElement): AnchorPoint[] {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;
    const w = element.width;
    const h = element.height;

    let anchors: AnchorPoint[] = [];

    if (element.type === 'rectangle' || element.type === 'image' || element.type === 'text') {
        // 8 anchors: 4 edges + 4 corners
        const rawAnchors: AnchorPoint[] = [
            // Corners
            { x: cx - w / 2, y: cy - h / 2, position: 'top-left' },
            { x: cx + w / 2, y: cy - h / 2, position: 'top-right' },
            { x: cx - w / 2, y: cy + h / 2, position: 'bottom-left' },
            { x: cx + w / 2, y: cy + h / 2, position: 'bottom-right' },
            // Edges
            { x: cx, y: cy - h / 2, position: 'top' },
            { x: cx + w / 2, y: cy, position: 'right' },
            { x: cx, y: cy + h / 2, position: 'bottom' },
            { x: cx - w / 2, y: cy, position: 'left' },
        ];

        // Apply rotation if needed
        if (element.angle) {
            anchors = rawAnchors.map(anchor => {
                const rotated = rotatePoint(anchor.x, anchor.y, cx, cy, element.angle);
                return { ...rotated, position: anchor.position };
            });
        } else {
            anchors = rawAnchors;
        }

    } else if (element.type === 'circle') {
        // 4 anchors: cardinal points on ellipse
        const rx = w / 2;
        const ry = h / 2;

        const rawAnchors: AnchorPoint[] = [
            { x: cx, y: cy - ry, position: 'top' },
            { x: cx + rx, y: cy, position: 'right' },
            { x: cx, y: cy + ry, position: 'bottom' },
            { x: cx - rx, y: cy, position: 'left' },
        ];

        // Apply rotation if needed
        if (element.angle) {
            anchors = rawAnchors.map(anchor => {
                const rotated = rotatePoint(anchor.x, anchor.y, cx, cy, element.angle);
                return { ...rotated, position: anchor.position };
            });
        } else {
            anchors = rawAnchors;
        }

    } else if (element.type === 'diamond') {
        // 4 anchors: vertices
        const rawAnchors: AnchorPoint[] = [
            { x: cx, y: cy - h / 2, position: 'top' },
            { x: cx + w / 2, y: cy, position: 'right' },
            { x: cx, y: cy + h / 2, position: 'bottom' },
            { x: cx - w / 2, y: cy, position: 'left' },
        ];

        // Apply rotation if needed
        if (element.angle) {
            anchors = rawAnchors.map(anchor => {
                const rotated = rotatePoint(anchor.x, anchor.y, cx, cy, element.angle);
                return { ...rotated, position: anchor.position };
            });
        } else {
            anchors = rawAnchors;
        }
    } else if (element.type === 'triangle' || element.type === 'hexagon' || element.type === 'octagon' ||
        element.type === 'parallelogram' || element.type === 'star') {
        // For new polygon shapes, use 4 cardinal points as simplified anchors
        const rawAnchors: AnchorPoint[] = [
            { x: cx, y: cy - h / 2, position: 'top' },
            { x: cx + w / 2, y: cy, position: 'right' },
            { x: cx, y: cy + h / 2, position: 'bottom' },
            { x: cx - w / 2, y: cy, position: 'left' },
        ];

        if (element.angle) {
            anchors = rawAnchors.map(anchor => {
                const rotated = rotatePoint(anchor.x, anchor.y, cx, cy, element.angle);
                return { ...rotated, position: anchor.position };
            });
        } else {
            anchors = rawAnchors;
        }
    } else if (element.type === 'cloud' || element.type === 'heart' || element.type === 'checkmark' || element.type === 'cross' ||
        element.type === 'arrowLeft' || element.type === 'arrowRight' || element.type === 'arrowUp' || element.type === 'arrowDown' ||
        element.type === 'capsule' || element.type === 'stickyNote' || element.type === 'callout' ||
        element.type === 'burst' || element.type === 'speechBubble' || element.type === 'ribbon' ||
        element.type === 'server' || element.type === 'loadBalancer' || element.type === 'firewall' || element.type === 'user' || element.type === 'messageQueue' || element.type === 'lambda' || element.type === 'router' || element.type === 'browser' || element.type === 'trapezoid' || element.type === 'rightTriangle' || element.type === 'pentagon' || element.type === 'septagon' || element.type === 'starPerson' || element.type === 'scroll' || element.type === 'wavyDivider' || element.type === 'doubleBanner' ||
        element.type === 'lightbulb' || element.type === 'signpost' || element.type === 'burstBlob' ||
        element.type === 'browserWindow' || element.type === 'mobilePhone' || element.type === 'ghostButton' || element.type === 'inputField' ||
        element.type === 'bracketLeft' || element.type === 'bracketRight' ||
        element.type === 'database' || element.type === 'document' || element.type === 'predefinedProcess' || element.type === 'internalStorage') {
        // For complex shapes, use 4 cardinal points
        const rawAnchors: AnchorPoint[] = [
            { x: cx, y: cy - h / 2, position: 'top' },
            { x: cx + w / 2, y: cy, position: 'right' },
            { x: cx, y: cy + h / 2, position: 'bottom' },
            { x: cx - w / 2, y: cy, position: 'left' },
        ];

        if (element.angle) {
            anchors = rawAnchors.map(anchor => {
                const rotated = rotatePoint(anchor.x, anchor.y, cx, cy, element.angle);
                return { ...rotated, position: anchor.position };
            });
        } else {
            anchors = rawAnchors;
        }
    } else if (element.type === 'line' && element.curveType === 'elbow' && !element.startBinding && !element.endBinding
        && element.points && Array.isArray(element.points) && (element.points as any[]).length >= 2) {
        // Polyline shape: compute actual bounding box from points for proper anchor positions
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of element.points as { x: number; y: number }[]) {
            minX = Math.min(minX, element.x + p.x);
            minY = Math.min(minY, element.y + p.y);
            maxX = Math.max(maxX, element.x + p.x);
            maxY = Math.max(maxY, element.y + p.y);
        }
        const polyCx = (minX + maxX) / 2;
        const polyCy = (minY + maxY) / 2;

        anchors = [
            { x: polyCx, y: minY, position: 'top' },
            { x: maxX, y: polyCy, position: 'right' },
            { x: polyCx, y: maxY, position: 'bottom' },
            { x: minX, y: polyCy, position: 'left' },
        ];
    } else {
        // Fallback for any other shape (including fineliner, marker, inkbrush)
        // Use 4 cardinal points of bounding box
        const rawAnchors: AnchorPoint[] = [
            { x: cx, y: cy - h / 2, position: 'top' },
            { x: cx + w / 2, y: cy, position: 'right' },
            { x: cx, y: cy + h / 2, position: 'bottom' },
            { x: cx - w / 2, y: cy, position: 'left' },
        ];

        if (element.angle) {
            anchors = rawAnchors.map(anchor => {
                const rotated = rotatePoint(anchor.x, anchor.y, cx, cy, element.angle);
                return { ...rotated, position: anchor.position };
            });
        } else {
            anchors = rawAnchors;
        }
    }

    return anchors;
}

/**
 * Find the closest anchor point to a given point
 * Returns the anchor point if within threshold, null otherwise
 */
export function findClosestAnchor(
    element: DrawingElement,
    point: Point,
    threshold: number = 15
): AnchorPoint | null {
    const anchors = getAnchorPoints(element);

    let closestAnchor: AnchorPoint | null = null;
    let minDistance = threshold;

    for (const anchor of anchors) {
        const dx = anchor.x - point.x;
        const dy = anchor.y - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
            minDistance = distance;
            closestAnchor = anchor;
        }
    }

    return closestAnchor;
}

/**
 * Check if a point is near any anchor of an element
 */
export function isNearAnchor(
    element: DrawingElement,
    point: Point,
    threshold: number = 15
): boolean {
    return findClosestAnchor(element, point, threshold) !== null;
}
