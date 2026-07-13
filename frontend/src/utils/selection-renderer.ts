/**
 * Selection & Overlay Renderer
 * Draws selection highlights, resize/rotate handles, control points,
 * connector handles, multi-selection boxes, drag rectangles, and binding highlights.
 * Pure rendering functions — no store access, no side effects beyond drawing.
 */

import type { DrawingElement } from '../types';
import { normalizePoints } from './render-element';
import { getOrganicBranchPolygon, rotatePoint } from './geometry';
import { getDescendants } from './hierarchy';
import { getPathSubpaths } from './math/path-utils';
import { getCustomPivot } from './transform-pivot';
import { getWarpGrid } from './envelope-warp';
import { getDeleteHandlePosition } from './handle-detection';

const MINDMAP_CONNECTOR_TYPES = ['line', 'arrow', 'organicBranch', 'bezier', 'polyline'];

const LABEL_DRAG_EXCLUDED = new Set([
    'line', 'arrow', 'bezier', 'organicBranch', 'polyline', 'table', 'text', 'richtext',
    'codeBlock', 'umlClass', 'umlInterface', 'umlEnum', 'umlState',
]);
/** Mirrors handle-detection: a container shape whose text is repositionable. */
function isLabelDraggable(el: DrawingElement): boolean {
    return !!el.containerText && el.containerText.trim().length > 0
        && !LABEL_DRAG_EXCLUDED.has(el.type)
        && !el.type.startsWith('ds')
        && !el.isEditing;
}

/**
 * Draw the floating quick-delete button (white disc, red ring, red ✕) at a
 * world-space point. Touch-friendly affordance so a selection can be deleted
 * with a single tap — no keyboard needed. Position comes from
 * `getDeleteHandlePosition` so it always matches the hit-test.
 */
export function drawDeleteHandle(ctx: CanvasRenderingContext2D, pos: { x: number; y: number }, scale: number): void {
    const r = 9 / scale;
    const x = pos.x, y = pos.y;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5 / scale;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // ✕ glyph
    const k = r * 0.45;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.75 / scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - k, y - k); ctx.lineTo(x + k, y + k);
    ctx.moveTo(x + k, y - k); ctx.lineTo(x - k, y + k);
    ctx.stroke();
    ctx.restore();
}

export interface ElementOverlayOptions {
    scale: number;
    isSelected: boolean;
    selectionLength: number;
    /** Current selection ids — used to look up a custom rotation pivot. */
    selection?: string[];
    isDarkMode: boolean;
    elements: DrawingElement[];
    selectedTool: string;
    hoveredConnector: { elementId: string; handle: string } | null;
    appMode?: string;
    /** Id of the path currently being built by the pen tool — its anchors/handles are
     *  drawn live (like Illustrator) even though it isn't selected yet. */
    penBuildingId?: string | null;
}

/**
 * Editable vector path: draw anchor squares (hollow=corner, filled=smooth) + Bézier handles
 * (whiskers + circles) for every subpath. Shared by the selected-path overlay AND the live
 * pen-building overlay. When `showCloseRing` is set, rings the first anchor to mark where a
 * click closes the path.
 */
function renderPathAnchors(ctx: CanvasRenderingContext2D, el: DrawingElement, scale: number, showCloseRing: boolean): void {
    const sq = 8 / scale;   // anchor square side
    const hd = 7 / scale;   // handle circle diameter
    // Anchors are stored un-rotated; draw the whole overlay in the element's rotated frame so
    // the handles sit on the rotated path (and match the rotation-aware hit-testing).
    const ang = el.angle || 0;
    ctx.save();
    if (ang) { const cx = el.x + el.width / 2, cy = el.y + el.height / 2; ctx.translate(cx, cy); ctx.rotate(ang); ctx.translate(-cx, -cy); }
    let firstAnchor: { x: number; y: number } | null = null;
    for (const sp of getPathSubpaths(el)) for (const a of sp.anchors) {
        const ax = el.x + a.x, ay = el.y + a.y;
        if (!firstAnchor) firstAnchor = { x: ax, y: ay };
        const drawHandle = (hx?: number, hy?: number) => {
            if (hx === undefined || hy === undefined) return;
            const px = ax + hx, py = ay + hy;
            ctx.strokeStyle = 'rgba(59,130,246,0.6)';
            ctx.lineWidth = 1 / scale;
            ctx.setLineDash([]);
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(px, py); ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1.5 / scale;
            ctx.beginPath(); ctx.arc(px, py, hd / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        };
        drawHandle(a.outX, a.outY);
        drawHandle(a.inX, a.inY);
        // Anchor square: filled blue for smooth, hollow for corner.
        ctx.fillStyle = a.kind === 'smooth' ? '#3b82f6' : '#ffffff';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5 / scale;
        ctx.beginPath();
        ctx.rect(ax - sq / 2, ay - sq / 2, sq, sq);
        ctx.fill();
        ctx.stroke();
    }
    if (showCloseRing && firstAnchor) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5 / scale;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(firstAnchor.x, firstAnchor.y, sq, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
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
    const { scale, isSelected, selectionLength, selectedTool, hoveredConnector } = opts;
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

                // Draw draggable segments and bend handles for elbow connectors
                const hasElbowPoints = el.curveType === 'elbow' && el.points && Array.isArray(el.points);
                if (hasElbowPoints) {
                    const pts = normalizePoints(el.points);

                    // Draw draggable segment indicators (thicker transparent hit zones)
                    ctx.save();
                    ctx.strokeStyle = 'rgba(14, 165, 233, 0.3)';
                    ctx.lineWidth = 6 / scale;
                    ctx.lineCap = 'round';
                    for (let si = 0; si < pts.length - 1; si++) {
                        const p1x = el.x + pts[si].x, p1y = el.y + pts[si].y;
                        const p2x = el.x + pts[si + 1].x, p2y = el.y + pts[si + 1].y;
                        const segLen = Math.sqrt((p2x - p1x) ** 2 + (p2y - p1y) ** 2);
                        if (segLen > 10 / scale) {
                            ctx.beginPath();
                            ctx.moveTo(p1x, p1y);
                            ctx.lineTo(p2x, p2y);
                            ctx.stroke();
                        }
                    }
                    ctx.restore();

                    // Draw bend point handles
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

                // Envelope / mesh warp lattice + control-point handles (orange, distinct
                // from the blue bbox handles). Points are centred-local; lift to world.
                // Puppet Warp drives the grid from pins, so hide the raw lattice handles there.
                const warpGrid = el.puppetPins ? null : getWarpGrid(el.warp);
                if (warpGrid) {
                    const { rows, cols, points } = warpGrid;
                    const W = points.map(c => {
                        const p = { x: hcx + c.x, y: hcy + c.y };
                        return hAngle ? rotatePoint(p.x, p.y, hcx, hcy, hAngle) : p;
                    });
                    ctx.save();
                    ctx.strokeStyle = '#ef6820';
                    ctx.lineWidth = 1.25 / scale;
                    ctx.setLineDash([]);
                    // Row lines.
                    for (let r = 0; r < rows; r++) {
                        ctx.beginPath();
                        ctx.moveTo(W[r * cols].x, W[r * cols].y);
                        for (let c = 1; c < cols; c++) ctx.lineTo(W[r * cols + c].x, W[r * cols + c].y);
                        ctx.stroke();
                    }
                    // Column lines.
                    for (let c = 0; c < cols; c++) {
                        ctx.beginPath();
                        ctx.moveTo(W[c].x, W[c].y);
                        for (let r = 1; r < rows; r++) ctx.lineTo(W[r * cols + c].x, W[r * cols + c].y);
                        ctx.stroke();
                    }
                    // Control-point dots.
                    ctx.fillStyle = '#ef6820';
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5 / scale;
                    for (const p of W) {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, handleSize / 1.5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    }
                    ctx.restore();
                }

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

                // Custom rotation pivot (Free Transform) — a crosshair-in-ring at the
                // world point the user placed; rotation orbits about it. Drawn in world
                // space (not the element's rotated frame) since the pivot is independent
                // of the element's angle. Only for a single selected element.
                const pivot = selectionLength === 1 && opts.selection ? getCustomPivot(opts.selection) : null;
                if (pivot) {
                    const r = handleSize / 2 + 1 / scale;
                    ctx.save();
                    ctx.strokeStyle = '#3b82f6';
                    ctx.fillStyle = '#ffffff';
                    ctx.lineWidth = 1.5 / scale;
                    ctx.beginPath();
                    ctx.arc(pivot.x, pivot.y, r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(pivot.x - r, pivot.y);
                    ctx.lineTo(pivot.x + r, pivot.y);
                    ctx.moveTo(pivot.x, pivot.y - r);
                    ctx.lineTo(pivot.x, pivot.y + r);
                    ctx.stroke();
                    ctx.restore();
                }

                // Move handle for tables — rendered at top-left corner
                if (el.type === 'table') {
                    const moveSize = 20 / scale;
                    const moveX = hX - padding - moveSize - 4 / scale;
                    const moveY = hY - padding - moveSize - 4 / scale;
                    const localMovePos = { x: moveX + moveSize / 2, y: moveY + moveSize / 2 };
                    const movePos = hAngle ? rotatePoint(localMovePos.x, localMovePos.y, hcx, hcy, hAngle) : localMovePos;

                    ctx.save();
                    ctx.translate(movePos.x, movePos.y);
                    if (hAngle) ctx.rotate(hAngle);

                    // Background circle
                    ctx.fillStyle = '#3b82f6';
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5 / scale;
                    ctx.beginPath();
                    ctx.arc(0, 0, moveSize / 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();

                    // 4-way arrow icon
                    const a = moveSize * 0.28;  // arm length
                    const t = moveSize * 0.08;  // arrowhead size
                    ctx.strokeStyle = '#ffffff';
                    ctx.fillStyle = '#ffffff';
                    ctx.lineWidth = 1.5 / scale;
                    // Horizontal line
                    ctx.beginPath();
                    ctx.moveTo(-a, 0);
                    ctx.lineTo(a, 0);
                    ctx.stroke();
                    // Vertical line
                    ctx.beginPath();
                    ctx.moveTo(0, -a);
                    ctx.lineTo(0, a);
                    ctx.stroke();
                    // Arrowheads (right, left, up, down)
                    for (const [dx, dy] of [[a, 0], [-a, 0], [0, -a], [0, a]]) {
                        ctx.beginPath();
                        if (dy === 0) {
                            // horizontal arrowhead
                            const dir = dx > 0 ? 1 : -1;
                            ctx.moveTo(dx, 0);
                            ctx.lineTo(dx - dir * t * 2, -t);
                            ctx.lineTo(dx - dir * t * 2, t);
                        } else {
                            // vertical arrowhead
                            const dir = dy > 0 ? 1 : -1;
                            ctx.moveTo(0, dy);
                            ctx.lineTo(-t, dy - dir * t * 2);
                            ctx.lineTo(t, dy - dir * t * 2);
                        }
                        ctx.closePath();
                        ctx.fill();
                    }
                    ctx.restore();
                }

                // Draggable in-shape label handle — a small grab dot at the text's
                // current position (only for container shapes that render their text
                // through the shared pipeline; matches handle-detection's eligibility).
                if (isLabelDraggable(renderedEl)) {
                    const lx = hcx + (renderedEl.textOffsetX || 0);
                    const ly = hcy + (renderedEl.textOffsetY || 0);
                    const pos = hAngle ? rotatePoint(lx, ly, hcx, hcy, hAngle) : { x: lx, y: ly };
                    const r = 5 / scale;
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(59,130,246,0.9)';
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5 / scale;
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }

        // Floating quick-delete button (single selection). Drawn last, in world
        // space, so it sits on top of the bbox/handles. Multi-selection draws its
        // own in renderSelectionOverlays. Suppressed in read-only modes where the
        // tap can't delete (presentation/embed) so it isn't shown but inert.
        if (selectionLength === 1 && opts.appMode !== 'presentation' && opts.appMode !== 'embed') {
            const dp = getDeleteHandlePosition(opts.elements, [el.id], scale);
            if (dp) drawDeleteHandle(ctx, dp, scale);
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

    // Pen tool: a path being built isn't selected yet, so the selection-gated block above
    // skips it. Draw its anchors/handles live here (Illustrator-style), with a close-ring.
    if (el.type === 'path' && !isSelected && !!opts.penBuildingId && el.id === opts.penBuildingId) {
        renderPathAnchors(ctx, el, scale, true);
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

        // --- Editable vector path: anchors + Bézier handles (selected paths) ---
        // Only when a SINGLE path is selected — node hit-testing/dragging is gated on
        // `selection.length === 1` (see handle-detection.ts), so drawing the squares for
        // a multi-selection (e.g. a grouped/baked stick figure = many path parts) shows
        // handles that can't be grabbed. Match the two so squares appear iff editable.
        if (el.type === 'path' && selectedTool === 'selection' && selectionLength === 1) {
            renderPathAnchors(ctx, el, scale, false);
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

    // Rotate handle — a stem + circle above the top-centre (so a multi-selection can be rotated).
    const rotX = box.x + box.width / 2, rotY = box.y - padding - 20 / scale;
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1 / scale;
    ctx.beginPath(); ctx.moveTo(rotX, box.y - padding); ctx.lineTo(rotX, rotY); ctx.stroke();
    ctx.beginPath(); ctx.arc(rotX, rotY, handleSize / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
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

        // Collapsed → show how many descendant nodes are hidden, as a pill beside the toggle.
        if (el.isCollapsed) {
            const hidden = getDescendants(el.id, elements)
                .filter(d => !MINDMAP_CONNECTOR_TYPES.includes(d.type)).length;
            if (hidden > 0) {
                const label = String(hidden);
                ctx.font = `${11 / scale}px sans-serif`;
                const padX = 5 / scale;
                const pillH = 16 / scale;
                const pillW = ctx.measureText(label).width + padX * 2;
                const px = centerX + toggleSize / 2 + 6 / scale;
                const py = centerY - pillH / 2;
                ctx.beginPath();
                ctx.roundRect(px, py, pillW, pillH, pillH / 2);
                ctx.fillStyle = '#10b981';
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, px + padX, centerY + 0.5 / scale);
            }
        }
        ctx.restore();
    }

    // Add-child "＋" affordance on the single selected node (mouse parity with Tab).
    // Editing-only — hidden in presentation. Sits where a new child would appear.
    if (appMode !== 'presentation' && selection.length === 1) {
        const el = elements.find(e => e.id === selection[0]);
        const isMindmapNode = el && (!!el.parentId || elements.some(e => e.parentId === el.id));
        if (el && isMindmapNode && !MINDMAP_CONNECTOR_TYPES.includes(el.type)) {
            const r = 11 / scale;
            const cx = el.x + el.width + 28 / scale; // clear of the right-middle resize handle
            const cy = el.y + el.height / 2;
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = isDarkMode ? '#1f2937' : '#fff';
            ctx.fill();
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2 / scale;
            ctx.stroke();
            ctx.beginPath();
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2 / scale;
            ctx.moveTo(cx - r / 2, cy);
            ctx.lineTo(cx + r / 2, cy);
            ctx.moveTo(cx, cy - r / 2);
            ctx.lineTo(cx, cy + r / 2);
            ctx.stroke();
            ctx.restore();
        }
    }
}

/**
 * Render a green dashed highlight around a potential reparent drop target.
 */
export function renderDropTargetHighlight(
    ctx: CanvasRenderingContext2D,
    el: DrawingElement,
    scale: number,
    draggedEl?: DrawingElement | null
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

    // Live preview of the prospective branch: a dashed line from the new parent's
    // centre to the dragged node's centre, so the relationship is visible pre-drop.
    if (draggedEl) {
        const px = el.x + el.width / 2;
        const py = el.y + el.height / 2;
        const cxd = draggedEl.x + draggedEl.width / 2;
        const cyd = draggedEl.y + draggedEl.height / 2;
        ctx.beginPath();
        ctx.setLineDash([6 / scale, 4 / scale]);
        ctx.lineWidth = 2 / scale;
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.moveTo(px, py);
        ctx.lineTo(cxd, cyd);
        ctx.stroke();
        // Small dot at the parent end to read as the branch origin.
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.fillStyle = '#10b981';
        ctx.arc(px, py, 3 / scale, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}
