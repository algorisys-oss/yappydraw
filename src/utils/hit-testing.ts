/**
 * Hit Testing
 * Determines whether a world-coordinate point intersects with a DrawingElement.
 * Pure function — no store access, no side effects.
 */

import type { DrawingElement } from '../types';
import {
    rotatePoint,
    isPointInEllipse,
    isPointOnBezier,
    isPointOnPolyline,
    distanceToSegment,
    isPointInPolygon,
    getOrganicBranchPolygon
} from './geometry';
import { normalizePoints } from './render-element';
import { isElementHiddenByHierarchy } from './hierarchy';

/**
 * Inverse-rotate a point around a center by the given angle.
 */
function unrotatePoint(x: number, y: number, cx: number, cy: number, angle: number) {
    return rotatePoint(x, y, cx, cy, -angle);
}

/**
 * Tests whether a point (x, y) in world coordinates hits the given element.
 *
 * Uses a two-phase approach:
 *  1. Broad-phase: axis-aligned bounding box (with rotation unrolled)
 *  2. Narrow-phase: shape-specific geometry test
 *
 * @param el         The element to test
 * @param x          World x-coordinate of the test point
 * @param y          World y-coordinate of the test point
 * @param threshold  Hit tolerance in world units
 * @param elements   Full element list (for hierarchy visibility checks)
 * @param elementMap Optional pre-built id→element map for hierarchy lookups
 */
export function hitTestElement(
    el: DrawingElement,
    x: number,
    y: number,
    threshold: number,
    elements: DrawingElement[],
    elementMap?: Map<string, DrawingElement>
): boolean {
    if (isElementHiddenByHierarchy(el, elements, elementMap)) return false;

    // Transform point to local non-rotated space
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    const p = unrotatePoint(x, y, cx, cy, el.angle || 0);

    // Check if inside bounding box (broad phase)
    // Normalize bounds to handle negative width/height
    let x1 = Math.min(el.x, el.x + el.width);
    let x2 = Math.max(el.x, el.x + el.width);
    let y1 = Math.min(el.y, el.y + el.height);
    let y2 = Math.max(el.y, el.y + el.height);

    // Adjust broad-phase for extruding shapes
    if (el.type === 'solidBlock') {
        const depth = el.depth !== undefined ? el.depth : 50;
        const angle = (el.viewAngle !== undefined ? el.viewAngle : 45) * Math.PI / 180;
        const dx = depth * Math.cos(angle);
        const dy = depth * Math.sin(angle);
        x1 = Math.min(x1, x1 + dx, x2 + dx);
        x2 = Math.max(x2, x1 + dx, x2 + dx);
        y1 = Math.min(y1, y1 + dy, y2 + dy);
        y2 = Math.max(y2, y1 + dy, y2 + dy);
    } else if (el.type === 'perspectiveBlock') {
        const depth = el.depth !== undefined ? el.depth : 50;
        const angle = (el.viewAngle !== undefined ? el.viewAngle : 45) * Math.PI / 180;
        const skewX = (el.skewX || 0) * el.width;
        const skewY = (el.skewY || 0) * el.height;
        const dx = depth * Math.cos(angle) + skewX;
        const dy = depth * Math.sin(angle) + skewY;
        const taper = el.taper || 0;
        const bw = (el.width / 2) * (1 - taper);
        const bh = (el.height / 2) * (1 - taper);
        const centerX = el.x + el.width / 2;
        const centerY = el.y + el.height / 2;
        const bX1 = centerX + dx - bw;
        const bX2 = centerX + dx + bw;
        const bY1 = centerY + dy - bh;
        const bY2 = centerY + dy + bh;

        x1 = Math.min(x1, bX1, bX2);
        x2 = Math.max(x2, bX1, bX2);
        y1 = Math.min(y1, bY1, bY2);
        y2 = Math.max(y2, bY1, bY2);
    }

    if (p.x < x1 - threshold || p.x > x2 + threshold ||
        p.y < y1 - threshold || p.y > y2 + threshold) {
        return false;
    }

    if (el.type === 'rectangle' || el.type === 'solidBlock' || el.type === 'isometricCube' || el.type === 'perspectiveBlock') {
        // Check if inside expanded bounding box (passed broad-phase check above)
        return true;
    } else if (el.type === 'diamond') {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        const dx = Math.abs(p.x - cx);
        const dy = Math.abs(p.y - cy);
        // Diamond equation: |dx|/(w/2) + |dy|/(h/2) <= 1
        // 2*dx/w + 2*dy/h <= 1
        return (2 * dx / el.width) + (2 * dy / el.height) <= 1;
    } else if (el.type === 'circle') {
        return isPointInEllipse(p, el.x, el.y, el.width, el.height, threshold);
    } else if (el.type === 'line' || el.type === 'arrow') {
        const endX = el.x + el.width;
        const endY = el.y + el.height;

        if (el.curveType === 'bezier') {
            const w = el.width;
            const h = el.height;
            let cp1 = { x: el.x, y: el.y };
            let cp2 = { x: endX, y: endY };

            if (el.controlPoints && el.controlPoints.length > 0) {
                const p0 = { x: el.x, y: el.y };
                const p2 = { x: endX, y: endY };

                if (el.controlPoints.length === 2) {
                    // Cubic Bezier with 2 explicit control points
                    return isPointOnBezier(p, p0, el.controlPoints[0], el.controlPoints[1], p2, threshold);
                } else {
                    // Quadratic Bezier (1 control point) approximated as Cubic for hit test
                    const cp = el.controlPoints[0];
                    const cp1Cube = {
                        x: p0.x + (2 / 3) * (cp.x - p0.x),
                        y: p0.y + (2 / 3) * (cp.y - p0.y)
                    };
                    const cp2Cube = {
                        x: p2.x + (2 / 3) * (cp.x - p2.x),
                        y: p2.y + (2 / 3) * (cp.y - p2.y)
                    };
                    return isPointOnBezier(p, p0, cp1Cube, cp2Cube, p2, threshold);
                }

            } else if (Math.abs(w) > Math.abs(h)) {
                cp1 = { x: el.x + w / 2, y: el.y };
                cp2 = { x: endX - w / 2, y: endY };
                return isPointOnBezier(p, { x: el.x, y: el.y }, cp1, cp2, { x: endX, y: endY }, threshold);
            } else {
                cp1 = { x: el.x, y: el.y + h / 2 };
                cp2 = { x: endX, y: endY - h / 2 };
                return isPointOnBezier(p, { x: el.x, y: el.y }, cp1, cp2, { x: endX, y: endY }, threshold);
            }
        } else if (el.curveType === 'elbow') {
            const pts = normalizePoints(el.points);
            if (pts && pts.length > 0) {
                const localP = { x: p.x - el.x, y: p.y - el.y };
                // For polylines with 3+ points, also check interior (polygon fill area)
                if (pts.length >= 3 && !el.startBinding && !el.endBinding) {
                    if (isPointInPolygon(localP, pts)) return true;
                }
                return isPointOnPolyline(localP, pts, threshold);
            } else {
                // Fallback to simple line
                return distanceToSegment(p, { x: el.x, y: el.y }, { x: endX, y: endY }) <= threshold;
            }
        } else {
            // Line (Straight)
            // If points exist, check polyline (e.g. for manually adjusted straight lines if that becomes a thing)
            if (el.points && el.points.length > 0) {
                const pts = normalizePoints(el.points);
                if (pts.length > 1) { // Need at least 2 points
                    const localP = { x: p.x - el.x, y: p.y - el.y };
                    return isPointOnPolyline(localP, pts, threshold);
                }
            }
            return distanceToSegment(p, { x: el.x, y: el.y }, { x: el.x + el.width, y: el.y + el.height }) <= threshold;
        }
    } else if (el.type === 'fineliner' || el.type === 'marker' || el.type === 'inkbrush' || el.type === 'ink') {
        const pts = normalizePoints(el.points);
        if (pts.length > 0) {
            const localP = { x: p.x - el.x, y: p.y - el.y };
            return isPointOnPolyline(localP, pts, threshold + (el.strokeWidth || 0) / 2);
        }
        return false;
    } else if (el.type === 'organicBranch') {
        const pts = normalizePoints(el.points);
        const controls = el.controlPoints || [];
        if (pts.length < 2 || controls.length < 2) return false;

        const start = { x: el.x + pts[0].x, y: el.y + pts[0].y };
        const end = { x: el.x + pts[pts.length - 1].x, y: el.y + pts[pts.length - 1].y };
        const polygon = getOrganicBranchPolygon(start, end, controls[0], controls[1], el.strokeWidth);

        return isPointInPolygon(p, polygon);
    } else if (el.type === 'text' || el.type === 'image') {
        return true; // Box check passed
    } else if (
        el.type === 'triangle' || el.type === 'hexagon' || el.type === 'octagon' ||
        el.type === 'parallelogram' || el.type === 'star' || el.type === 'cloud' ||
        el.type === 'heart' || el.type === 'cross' || el.type === 'checkmark' ||
        el.type === 'arrowLeft' || el.type === 'arrowRight' || el.type === 'arrowUp' || el.type === 'arrowDown' ||
        el.type === 'capsule' || el.type === 'stickyNote' || el.type === 'callout' ||
        el.type === 'burst' || el.type === 'speechBubble' || el.type === 'ribbon' ||
        el.type === 'bracketLeft' || el.type === 'bracketRight' ||
        el.type === 'database' || el.type === 'document' || el.type === 'predefinedProcess' || el.type === 'internalStorage' ||
        el.type === 'server' || el.type === 'loadBalancer' || el.type === 'firewall' ||
        el.type === 'user' || el.type === 'messageQueue' || el.type === 'lambda' ||
        el.type === 'router' || el.type === 'browser' ||
        el.type === 'trapezoid' || el.type === 'rightTriangle' || el.type === 'pentagon' || el.type === 'septagon' ||
        el.type === 'starPerson' || el.type === 'scroll' || el.type === 'wavyDivider' ||
        el.type === 'doubleBanner' || el.type === 'lightbulb' || el.type === 'signpost' ||
        el.type === 'burstBlob' || el.type === 'browserWindow' || el.type === 'mobilePhone' ||
        el.type === 'ghostButton' || el.type === 'inputField' || el.type === 'polygon' ||
        el.type === 'dfdProcess' || el.type === 'dfdDataStore' ||
        el.type === 'cylinder' || el.type === 'stateStart' || el.type === 'stateEnd' ||
        el.type === 'stateSync' || el.type === 'activationBar' || el.type === 'externalEntity' ||
        el.type === 'umlClass' || el.type === 'umlInterface' || el.type === 'umlActor' ||
        el.type === 'umlUseCase' || el.type === 'umlNote' || el.type === 'umlPackage' ||
        el.type === 'umlComponent' || el.type === 'umlState' || el.type === 'umlLifeline' ||
        el.type === 'umlFragment' || el.type === 'umlSignalSend' || el.type === 'umlSignalReceive' ||
        el.type === 'umlProvidedInterface' || el.type === 'umlRequiredInterface' ||
        el.type === 'trophy' || el.type === 'clock' || el.type === 'gear' ||
        el.type === 'target' || el.type === 'rocket' || el.type === 'flag' ||
        el.type === 'key' || el.type === 'magnifyingGlass' || el.type === 'book' ||
        el.type === 'megaphone' || el.type === 'eye' || el.type === 'thoughtBubble' ||
        el.type === 'stickFigure' || el.type === 'sittingPerson' || el.type === 'presentingPerson' ||
        el.type === 'handPointRight' || el.type === 'thumbsUp' ||
        el.type === 'faceHappy' || el.type === 'faceSad' || el.type === 'faceConfused' ||
        el.type === 'checkbox' || el.type === 'checkboxChecked' || el.type === 'numberedBadge' ||
        el.type === 'questionMark' || el.type === 'exclamationMark' ||
        el.type === 'tag' || el.type === 'pin' || el.type === 'stamp' ||
        el.type === 'kubernetes' || el.type === 'container' || el.type === 'apiGateway' ||
        el.type === 'cdn' || el.type === 'storageBlob' || el.type === 'eventBus' ||
        el.type === 'microservice' || el.type === 'shield' ||
        el.type === 'barChart' || el.type === 'pieChart' || el.type === 'trendUp' ||
        el.type === 'trendDown' || el.type === 'funnel' || el.type === 'gauge' ||
        el.type === 'table' ||
        el.type === 'puzzlePiece' || el.type === 'chainLink' || el.type === 'bridge' ||
        el.type === 'magnet' || el.type === 'scale' || el.type === 'seedling' ||
        el.type === 'tree' || el.type === 'mountain'
    ) {
        // For these shapes, rely on bounding box hit test (passed above)
        // or implement detailed geometry check if needed
        return true;

    }

    return false;
}
