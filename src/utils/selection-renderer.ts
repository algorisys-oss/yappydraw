/**
 * Selection & Overlay Renderer
 * Draws selection highlights, resize/rotate handles, control points,
 * connector handles, multi-selection boxes, drag rectangles, and binding highlights.
 * Pure rendering functions — no store access, no side effects beyond drawing.
 */

import type { DrawingElement } from '../types';
import { normalizePoints } from './render-element';
import { getOrganicBranchPolygon, rotatePoint } from './geometry';

export interface ElementOverlayOptions {
    scale: number;
    isSelected: boolean;
    selectionLength: number;
    isDarkMode: boolean;
    elements: DrawingElement[];
    selectedTool: string;
    hoveredConnector: { elementId: string; handle: string } | null;
    appMode?: string;
}

/**
 * Render all per-element selection overlays: bounding box, handles, mindmap toggle,
 * collapsed node glow, custom control handles, bezier control points, connector handles.
 */
export function renderElementOverlays(
    ctx: CanvasRenderingContext2D,
    el: DrawingElement,
    renderedEl: DrawingElement,
    opts: ElementOverlayOptions
): void {
    const { scale, isSelected, selectionLength, isDarkMode, elements, selectedTool, hoveredConnector, appMode } = opts;
    const padding = 2 / scale;

    // --- Selection highlight & Handles ---
    if (isSelected) {
        const hX = renderedEl.x;
        const hY = renderedEl.y;
        const hW = renderedEl.width;
        const hH = renderedEl.height;
        const hAngle = renderedEl.angle || 0;
        const hcx = hX + hW / 2;
        const hcy = hY + hH / 2;

        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1 / scale;

        // Only draw bounding box for non-linear elements
        if (el.type !== 'line' && el.type !== 'arrow' && el.type !== 'bezier' && el.type !== 'organicBranch') {
            // Draw rotated bounding box as a path
            const boxCorners = [
                { x: hX - padding, y: hY - padding },             // TL
                { x: hX + hW + padding, y: hY - padding },        // TR
                { x: hX + hW + padding, y: hY + hH + padding },   // BR
                { x: hX - padding, y: hY + hH + padding }         // BL
            ];
            const rotatedBoxCorners = hAngle
                ? boxCorners.map(c => rotatePoint(c.x, c.y, hcx, hcy, hAngle))
                : boxCorners;

            ctx.beginPath();
            ctx.moveTo(rotatedBoxCorners[0].x, rotatedBoxCorners[0].y);
            for (let i = 1; i < rotatedBoxCorners.length; i++) {
                ctx.lineTo(rotatedBoxCorners[i].x, rotatedBoxCorners[i].y);
            }
            ctx.closePath();
            ctx.stroke();
        } else if (el.type === 'organicBranch' && el.points && el.points.length >= 2 && el.controlPoints && el.controlPoints.length >= 2) {
            // Draw curved selection outline for organicBranch
            const pts = normalizePoints(el.points);
            if (pts.length >= 2) {
                const start = { x: el.x + pts[0].x, y: el.y + pts[0].y };
                const end = { x: el.x + pts[pts.length - 1].x, y: el.y + pts[pts.length - 1].y };
                const polygon = getOrganicBranchPolygon(start, end, el.controlPoints[0], el.controlPoints[1], el.strokeWidth);

                ctx.save();
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2 / scale;
                ctx.beginPath();
                ctx.moveTo(polygon[0].x, polygon[0].y);
                for (let i = 1; i < polygon.length; i++) {
                    ctx.lineTo(polygon[i].x, polygon[i].y);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            }
        }

        // Handles (Only if single selection)
        if (selectionLength === 1) {
            const handleSize = 8 / scale;
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2 / scale;

            if (el.type === 'line' || el.type === 'arrow' || el.type === 'bezier' || el.type === 'organicBranch') {
                // Line/Arrow/Bezier/OrganicBranch Specific Handles (Start and End only)
                let startX = hX;
                let startY = hY;
                let endX = hX + hW;
                let endY = hY + hH;

                // For organicBranch, use actual start/end points from points array
                if (el.type === 'organicBranch' && el.points && el.points.length >= 2) {
                    const pts = normalizePoints(el.points);
                    if (pts.length >= 2) {
                        startX = el.x + pts[0].x;
                        startY = el.y + pts[0].y;
                        endX = el.x + pts[pts.length - 1].x;
                        endY = el.y + pts[pts.length - 1].y;
                    }
                }

                const handles = [
                    { x: startX, y: startY }, // Start (TL)
                    { x: endX, y: endY }      // End (BR)
                ];

                handles.forEach(h => {
                    ctx.beginPath();
                    ctx.arc(h.x, h.y, handleSize / 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                });

                // Draw intermediate point handles for polylines
                const isPolyline = el.type === 'line' && el.curveType === 'elbow' && !el.startBinding && !el.endBinding;
                if (isPolyline && el.points && Array.isArray(el.points)) {
                    const pts = normalizePoints(el.points);
                    ctx.fillStyle = '#e0f2fe';
                    ctx.strokeStyle = '#0ea5e9';
                    for (let pi = 1; pi < pts.length - 1; pi++) {
                        const px = el.x + pts[pi].x;
                        const py = el.y + pts[pi].y;
                        ctx.beginPath();
                        ctx.arc(px, py, handleSize / 1.5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    }
                    ctx.fillStyle = '#ffffff';
                    ctx.strokeStyle = '#3b82f6';
                }

            } else {
                // Standard Box Handles - compute positions in local space then rotate
                const localHandles = [
                    { x: hX - padding, y: hY - padding }, // TL
                    { x: hX + hW + padding, y: hY - padding }, // TR
                    { x: hX + hW + padding, y: hY + hH + padding }, // BR
                    { x: hX - padding, y: hY + hH + padding }, // BL
                    // Side Handles
                    { x: hX + hW / 2, y: hY - padding }, // TM
                    { x: hX + hW + padding, y: hY + hH / 2 }, // RM
                    { x: hX + hW / 2, y: hY + hH + padding }, // BM
                    { x: hX - padding, y: hY + hH / 2 } // LM
                ];

                // Rotate handles around element center
                const handles = hAngle
                    ? localHandles.map(h => rotatePoint(h.x, h.y, hcx, hcy, hAngle))
                    : localHandles;

                handles.forEach((h) => {
                    ctx.save();
                    ctx.translate(h.x, h.y);
                    if (hAngle) ctx.rotate(hAngle);
                    ctx.fillRect(-handleSize / 2, -handleSize / 2, handleSize, handleSize);
                    ctx.strokeRect(-handleSize / 2, -handleSize / 2, handleSize, handleSize);
                    ctx.restore();
                });

                // Rotate Handle - compute position then rotate
                const localRotH = { x: el.x + el.width / 2, y: el.y - padding - 20 / scale };
                const localRotLineStart = { x: el.x + el.width / 2, y: el.y - padding };
                const rotH = hAngle ? rotatePoint(localRotH.x, localRotH.y, hcx, hcy, hAngle) : localRotH;
                const rotLineStart = hAngle ? rotatePoint(localRotLineStart.x, localRotLineStart.y, hcx, hcy, hAngle) : localRotLineStart;

                ctx.beginPath();
                ctx.moveTo(rotLineStart.x, rotLineStart.y);
                ctx.lineTo(rotH.x, rotH.y);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(rotH.x, rotH.y, handleSize / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    // --- Mindmap Toggle Handle — moved to renderMindmapToggles() for top-layer rendering ---

    // --- Visual Indicator for Collapsed Nodes (Subtle glow) ---
    if (el.isCollapsed && !isSelected) {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        ctx.save();
        if (el.angle) {
            ctx.translate(cx, cy);
            ctx.rotate(el.angle);
            ctx.translate(-cx, -cy);
        }
        ctx.shadowBlur = 10 / scale;
        ctx.shadowColor = '#10b981';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1 / scale;
        const p = 1 / scale;
        ctx.strokeRect(el.x - p, el.y - p, el.width + p * 2, el.height + p * 2);
        ctx.restore();
    }

    // --- Custom Control Handles (Isometric Cube, Star, Burst, Solid Block, Perspective Block) ---
    if (isSelected && (el.type === 'isometricCube' || el.type === 'star' || el.type === 'burst' || el.type === 'solidBlock' || el.type === 'perspectiveBlock' || el.type === 'cylinder')) {
        const cpSize = 10 / scale;
        let cx = 0, cy = 0;

        if (el.type === 'isometricCube') {
            const shapeRatio = (el.shapeRatio !== undefined ? el.shapeRatio : 25) / 100;
            const sideRatio = (el.sideRatio !== undefined ? el.sideRatio : 50) / 100;
            const faceHeight = el.height * shapeRatio;
            cy = el.y + faceHeight;
            cx = el.x + el.width * sideRatio;
        } else if (el.type === 'solidBlock' || el.type === 'cylinder') {
            const depthBase = el.depth !== undefined ? el.depth : 50;
            const angle = (el.viewAngle !== undefined ? el.viewAngle : 45) * Math.PI / 180;

            const centerX = el.x + el.width / 2;
            const centerY = el.y + el.height / 2;

            // Scale depth with shape size (must match shape-geometry.ts calculation)
            const minDim = Math.min(Math.abs(el.width), Math.abs(el.height));
            const depth = minDim > 0 ? Math.min(depthBase, minDim * 0.5) : 0;

            cx = centerX + depth * Math.cos(angle);
            cy = centerY + depth * Math.sin(angle);
        } else if (el.type === 'perspectiveBlock') {
            const depthBase = el.depth !== undefined ? el.depth : 50;
            const angle = (el.viewAngle !== undefined ? el.viewAngle : 45) * Math.PI / 180;
            const bTaper = el.taper !== undefined ? el.taper : 0;
            const skewX = (el.skewX !== undefined ? el.skewX : 0) * el.width;
            const skewY = (el.skewY !== undefined ? el.skewY : 0) * el.height;

            const centerX = el.x + el.width / 2;
            const centerY = el.y + el.height / 2;

            // Scale depth with shape size (must match shape-geometry.ts calculation)
            const minDim = Math.min(Math.abs(el.width), Math.abs(el.height));
            const depth = minDim > 0 ? Math.min(depthBase, minDim * 0.5) : 0;

            const dx = depth * Math.cos(angle) + skewX;
            const dy = depth * Math.sin(angle) + skewY;

            const bScale = 1 - bTaper;
            const bw = (el.width / 2) * bScale;
            const bh = (el.height / 2) * bScale;

            const fScale = 1 - (el.frontTaper || 0);
            const fw = (el.width / 2) * fScale;
            const fh = (el.height / 2) * fScale;
            const fsX = (el.frontSkewX || 0) * el.width;
            const fsY = (el.frontSkewY || 0) * el.height;

            // Draw 9 handles
            const handles = [
                { x: centerX + dx, y: centerY + dy, type: 'depth' },   // Back Center
                // Back Vertices
                { x: centerX + dx - bw, y: centerY + dy - bh, type: 'bTL' },
                { x: centerX + dx + bw, y: centerY + dy - bh, type: 'bTR' },
                { x: centerX + dx + bw, y: centerY + dy + bh, type: 'bBR' },
                { x: centerX + dx - bw, y: centerY + dy + bh, type: 'bBL' },
                // Front Vertices
                { x: centerX + fsX - fw, y: centerY + fsY - fh, type: 'fTL' },
                { x: centerX + fsX + fw, y: centerY + fsY - fh, type: 'fTR' },
                { x: centerX + fsX + fw, y: centerY + fsY + fh, type: 'fBR' },
                { x: centerX + fsX - fw, y: centerY + fsY + fh, type: 'fBL' }
            ];

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5 / scale;
            for (const h of handles) {
                if (h.type === 'depth') ctx.fillStyle = '#f59e0b'; // Amber
                else if (h.type.startsWith('b')) ctx.fillStyle = '#3b82f6'; // Blue
                else ctx.fillStyle = '#10b981'; // Green

                ctx.beginPath();
                ctx.arc(h.x, h.y, cpSize / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }

            // Draw rotation handle for perspectiveBlock based on visual bounds
            // Calculate visual top from all 8 vertices
            const visualTop = Math.min(
                centerY + dy - bh,  // bTL, bTR
                centerY + fsY - fh  // fTL, fTR
            );
            const handleSize = 8 / scale;
            const rotHandleY = visualTop - padding - 20 / scale;
            const rotLineStartY = visualTop - padding;

            // Draw rotation line
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2 / scale;
            ctx.beginPath();
            ctx.moveTo(centerX, rotLineStartY);
            ctx.lineTo(centerX, rotHandleY);
            ctx.stroke();

            // Draw rotation handle circle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(centerX, rotHandleY, handleSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            return; // Already drawn handles
        } else if (el.type === 'star' || el.type === 'burst') {
            const ratio = (el.shapeRatio !== undefined ? el.shapeRatio : 25) / 100;
            cx = el.x + el.width / 2;
            cy = el.y + el.height * ratio;
        }

        ctx.fillStyle = '#f59e0b'; // Amber-500
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5 / scale;
        ctx.beginPath();
        ctx.arc(cx, cy, cpSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    // --- Bezier/Elbow Control Points ---
    if (isSelected) {
        if ((el.type === 'line' || el.type === 'arrow' || el.type === 'bezier' || el.type === 'organicBranch') && el.controlPoints && selectedTool === 'selection') {
            const cpSize = 10 / scale;
            if (el.controlPoints.length === 1) {
                const cp = el.controlPoints[0];
                let start = { x: el.x, y: el.y };
                let end = { x: el.x + el.width, y: el.y + el.height };
                if (el.points && el.points.length >= 2) {
                    const pts = normalizePoints(el.points);
                    if (pts.length > 0) {
                        start = { x: el.x + pts[0].x, y: el.y + pts[0].y };
                        end = { x: el.x + pts[pts.length - 1].x, y: el.y + pts[pts.length - 1].y };
                    }
                }

                const curveX = 0.25 * start.x + 0.5 * cp.x + 0.25 * end.x;
                const curveY = 0.25 * start.y + 0.5 * cp.y + 0.25 * end.y;

                ctx.fillStyle = '#3b82f6';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5 / scale;
                ctx.beginPath();
                ctx.arc(curveX, curveY, cpSize / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else {
                el.controlPoints.forEach((cp) => {
                    // Draw normal CP handles (Off-Curve)
                    ctx.fillStyle = '#3b82f6';
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5 / scale;
                    ctx.beginPath();
                    ctx.arc(cp.x, cp.y, cpSize / 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                });
            }
        }

        // --- Connector Handles ---
        const isPolylineShape = el.type === 'line' && el.curveType === 'elbow' && !el.startBinding && !el.endBinding;
        if (((el.type !== 'line' && el.type !== 'arrow') || isPolylineShape) && selectedTool === 'selection') {
            const connectorSize = 14 / scale;
            const connectorOffset = 32 / scale;

            // For polylines, compute actual AABB from points
            let bbMinX = el.x, bbMinY = el.y, bbMaxX = el.x + el.width, bbMaxY = el.y + el.height;
            if (isPolylineShape && el.points && Array.isArray(el.points) && (el.points as any[]).length >= 2) {
                bbMinX = Infinity; bbMinY = Infinity; bbMaxX = -Infinity; bbMaxY = -Infinity;
                for (const p of el.points as { x: number; y: number }[]) {
                    bbMinX = Math.min(bbMinX, el.x + p.x);
                    bbMinY = Math.min(bbMinY, el.y + p.y);
                    bbMaxX = Math.max(bbMaxX, el.x + p.x);
                    bbMaxY = Math.max(bbMaxY, el.y + p.y);
                }
            }

            const cx = (bbMinX + bbMaxX) / 2;
            const cy = (bbMinY + bbMaxY) / 2;
            const connectorHandles = [
                { pos: 'top', x: cx, y: bbMinY - connectorOffset },
                { pos: 'right', x: bbMaxX + connectorOffset, y: cy },
                { pos: 'bottom', x: cx, y: bbMaxY + connectorOffset },
                { pos: 'left', x: bbMinX - connectorOffset, y: cy }
            ];

            connectorHandles.forEach(ch => {
                const isHovered = hoveredConnector && hoveredConnector.elementId === el.id && hoveredConnector.handle === `connector-${ch.pos}`;
                const currentSize = isHovered ? connectorSize * 1.3 : connectorSize;

                // Draw connecting line from shape to handle
                ctx.strokeStyle = isHovered ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.4)';
                ctx.lineWidth = (isHovered ? 2 : 1) / scale;
                ctx.setLineDash([3 / scale, 3 / scale]);
                ctx.beginPath();
                if (ch.pos === 'top') {
                    ctx.moveTo(ch.x, bbMinY);
                    ctx.lineTo(ch.x, ch.y);
                } else if (ch.pos === 'right') {
                    ctx.moveTo(bbMaxX, ch.y);
                    ctx.lineTo(ch.x, ch.y);
                } else if (ch.pos === 'bottom') {
                    ctx.moveTo(ch.x, bbMaxY);
                    ctx.lineTo(ch.x, ch.y);
                } else if (ch.pos === 'left') {
                    ctx.moveTo(bbMinX, ch.y);
                    ctx.lineTo(ch.x, ch.y);
                }
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw connector circle with subtle glow
                ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
                ctx.shadowBlur = (isHovered ? 8 : 4) / scale;
                ctx.fillStyle = isHovered ? '#059669' : '#10b981';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2 / scale;
                ctx.beginPath();
                ctx.arc(ch.x, ch.y, currentSize / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Draw outward-pointing arrow icon
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.8 / scale;
                const arrowSize = currentSize * 0.25;
                ctx.beginPath();
                if (ch.pos === 'top') {
                    ctx.moveTo(ch.x - arrowSize, ch.y + arrowSize / 2);
                    ctx.lineTo(ch.x, ch.y - arrowSize / 2);
                    ctx.lineTo(ch.x + arrowSize, ch.y + arrowSize / 2);
                } else if (ch.pos === 'right') {
                    ctx.moveTo(ch.x - arrowSize / 2, ch.y - arrowSize);
                    ctx.lineTo(ch.x + arrowSize / 2, ch.y);
                    ctx.lineTo(ch.x - arrowSize / 2, ch.y + arrowSize);
                } else if (ch.pos === 'bottom') {
                    ctx.moveTo(ch.x - arrowSize, ch.y - arrowSize / 2);
                    ctx.lineTo(ch.x, ch.y + arrowSize / 2);
                    ctx.lineTo(ch.x + arrowSize, ch.y - arrowSize / 2);
                } else if (ch.pos === 'left') {
                    ctx.moveTo(ch.x + arrowSize / 2, ch.y - arrowSize);
                    ctx.lineTo(ch.x - arrowSize / 2, ch.y);
                    ctx.lineTo(ch.x + arrowSize / 2, ch.y + arrowSize);
                }
                ctx.stroke();
            });
        }
    }
}

/**
 * Draw multi-selection bounding box with resize handles.
 */
export function renderMultiSelectionBox(
    ctx: CanvasRenderingContext2D,
    box: { x: number; y: number; width: number; height: number },
    scale: number
): void {
    const padding = 2 / scale;
    const handleSize = 8 / scale;

    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1 / scale;
    ctx.setLineDash([5 / scale, 5 / scale]);
    ctx.strokeRect(box.x - padding, box.y - padding, box.width + padding * 2, box.height + padding * 2);
    ctx.setLineDash([]);

    // Draw handles
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 2 / scale;

    const handles = [
        { x: box.x - padding, y: box.y - padding }, // TL
        { x: box.x + box.width + padding, y: box.y - padding }, // TR
        { x: box.x + box.width + padding, y: box.y + box.height + padding }, // BR
        { x: box.x - padding, y: box.y + box.height + padding }, // BL
        // Side Handles
        { x: box.x + box.width / 2, y: box.y - padding }, // TM
        { x: box.x + box.width + padding, y: box.y + box.height / 2 }, // RM
        { x: box.x + box.width / 2, y: box.y + box.height + padding }, // BM
        { x: box.x - padding, y: box.y + box.height / 2 } // LM
    ];

    handles.forEach(h => {
        ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
    });
    ctx.restore();
}

/**
 * Draw the drag-selection rectangle.
 */
export function renderSelectionBox(
    ctx: CanvasRenderingContext2D,
    box: { x: number; y: number; w: number; h: number },
    scale: number
): void {
    ctx.save();
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1 / scale;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.restore();
}

/**
 * Draw the freeform lasso selection path.
 */
export function renderLassoPath(
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number }[],
    scale: number
): void {
    if (points.length < 2) return;
    ctx.save();
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5 / scale;
    ctx.setLineDash([4 / scale, 4 / scale]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

/**
 * Draw the suggested binding highlight and snap point indicator.
 */
export function renderBindingHighlight(
    ctx: CanvasRenderingContext2D,
    target: DrawingElement,
    binding: { px: number; py: number },
    scale: number
): void {
    ctx.save();
    ctx.strokeStyle = '#f59e0b'; // Amber
    ctx.lineWidth = 2 / scale;
    ctx.strokeRect(target.x - 4 / scale, target.y - 4 / scale, target.width + 8 / scale, target.height + 8 / scale);

    // Draw Snap Point
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(binding.px, binding.py, 5 / scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * Render mindmap collapse/expand toggles as a top-layer pass.
 * Called AFTER all elements and overlays are drawn so toggles are never covered.
 */
export function renderMindmapToggles(
    ctx: CanvasRenderingContext2D,
    elements: DrawingElement[],
    selection: string[],
    scale: number,
    isDarkMode: boolean,
    appMode?: string
): void {
    for (const el of elements) {
        const isSelected = selection.includes(el.id);
        if (!(isSelected || appMode === 'presentation')) continue;

        const hasChildren = elements.some(e => e.parentId === el.id);
        if (!hasChildren) continue;
        if (el.type === 'line' || el.type === 'arrow' || el.type === 'organicBranch' || el.type === 'bezier') continue;

        const toggleSize = 18 / scale;
        const centerX = el.x + el.width / 2;
        const centerY = el.y + el.height + 15 / scale;

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, toggleSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = el.isCollapsed ? '#10b981' : (isDarkMode ? '#333' : '#fff');
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2 / scale;
        ctx.stroke();

        // Draw + or -
        ctx.beginPath();
        ctx.strokeStyle = el.isCollapsed ? '#fff' : '#10b981';
        ctx.lineWidth = 2 / scale;
        ctx.moveTo(centerX - toggleSize / 4, centerY);
        ctx.lineTo(centerX + toggleSize / 4, centerY);
        if (el.isCollapsed) {
            ctx.moveTo(centerX, centerY - toggleSize / 4);
            ctx.lineTo(centerX, centerY + toggleSize / 4);
        }
        ctx.stroke();
        ctx.restore();
    }
}

/**
 * Render a green dashed highlight around a potential reparent drop target.
 */
export function renderDropTargetHighlight(
    ctx: CanvasRenderingContext2D,
    el: DrawingElement,
    scale: number
): void {
    ctx.save();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3 / scale;
    ctx.setLineDash([8 / scale, 4 / scale]);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    const pad = 4 / scale;
    ctx.beginPath();
    ctx.roundRect(el.x - pad, el.y - pad, el.width + pad * 2, el.height + pad * 2, 8 / scale);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}
