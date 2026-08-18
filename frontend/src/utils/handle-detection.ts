/**
 * Handle Detection
 * Determines which resize/rotate/control handle (if any) is at a given position.
 * Pure functions — no store access, no side effects.
 */

import type { DrawingElement } from '../types';
import { rotatePoint } from './geometry';
import { normalizePoints } from './render-element';
import { isElementHiddenByHierarchy } from './hierarchy';
import { getPathSubpaths } from './math/path-utils';
import { getCustomPivot } from './transform-pivot';
import { getWarpGrid } from './envelope-warp';

/**
 * Inverse-rotate a point around a center by the given angle.
 */
function unrotatePoint(x: number, y: number, cx: number, cy: number, angle: number) {
    return rotatePoint(x, y, cx, cy, -angle);
}

/**
 * Hit-test a path's anchors / Bézier handles directly, returning the same
 * `path-anchor-{sub}-{i}` / `path-in-…` / `path-out-…` handle ids the drag code parses.
 *
 * Deliberately NOT part of `getHandleAtPosition`: the Selection tool no longer edits nodes
 * (see the note at 1c below), and an invisible anchor target that outranks corner-resize is
 * worse than none. Callers that want anchors ask for them by name — today the right-click /
 * long-press menu on a path, which is invisible until invoked and so adds no clutter.
 */
export function getPathHandleAtPosition(
    el: DrawingElement,
    x: number,
    y: number,
    scale: number
): string | null {
    if (el.type !== 'path') return null;
    const r = 12 / scale / 2 + 2 / scale;
    // Anchors are stored un-rotated; test the pointer in the element's local frame.
    const lp = el.angle ? unrotatePoint(x, y, el.x + el.width / 2, el.y + el.height / 2, el.angle) : { x, y };
    const px = lp.x, py = lp.y;
    const subs = getPathSubpaths(el);
    for (let su = 0; su < subs.length; su++) {
        const anchors = subs[su].anchors;
        for (let i = 0; i < anchors.length; i++) {
            const a = anchors[i];
            const ax = el.x + a.x, ay = el.y + a.y;
            // Handles win over anchors — they sit off the curve, so a hit there is unambiguous.
            if (a.outX !== undefined && a.outY !== undefined &&
                Math.abs(px - (ax + a.outX)) <= r && Math.abs(py - (ay + a.outY)) <= r) {
                return `path-out-${su}-${i}`;
            }
            if (a.inX !== undefined && a.inY !== undefined &&
                Math.abs(px - (ax + a.inX)) <= r && Math.abs(py - (ay + a.inY)) <= r) {
                return `path-in-${su}-${i}`;
            }
            if (Math.abs(px - ax) <= r && Math.abs(py - ay) <= r) {
                return `path-anchor-${su}-${i}`;
            }
        }
    }
    return null;
}


/**
 * Compute the axis-aligned bounding box of the current selection.
 */
export function getSelectionBoundingBox(
    elements: readonly DrawingElement[],
    selection: string[]
): { x: number; y: number; width: number; height: number } | null {
    if (selection.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasElements = false;

    elements.forEach(el => {
        if (selection.includes(el.id)) {
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + el.width);
            maxY = Math.max(maxY, el.y + el.height);
            hasElements = true;
        }
    });

    if (!hasElements) return null;
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * World-space position of the floating "delete" affordance for the current
 * selection — a touch-friendly quick-delete button sitting just off the
 * top-right corner of the selection bounding box. Shared by the hit-tester
 * (below) and the overlay renderers so the drawn button and its tap target
 * stay in lock-step. Returns `null` when there's no selection.
 *
 * For a single rotated element the button rides the element's rotated frame
 * (consistent with the resize handles); for a multi-selection it sits on the
 * axis-aligned union box.
 */
export function getDeleteHandlePosition(
    elements: readonly DrawingElement[],
    selection: string[],
    scale: number
): { x: number; y: number } | null {
    if (selection.length === 0) return null;
    const padding = 2 / scale;
    const off = 18 / scale; // diagonal offset out from the TR corner (screen-constant)

    if (selection.length > 1) {
        const box = getSelectionBoundingBox(elements, selection);
        if (!box) return null;
        return { x: box.x + box.width + padding + off, y: box.y - padding - off };
    }

    const el = elements.find(e => e.id === selection[0]);
    if (!el) return null;
    const localX = el.x + el.width + padding + off;
    const localY = el.y - padding - off;
    const ang = el.angle || 0;
    if (ang) {
        const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
        return rotatePoint(localX, localY, cx, cy, ang);
    }
    return { x: localX, y: localY };
}

/** Tap radius (world units) for the floating delete button. Generous for fingers. */
export const DELETE_HANDLE_HIT_RADIUS = 15;

/**
 * Find which handle (if any) is at the given world coordinates.
 *
 * Returns `{ id, handle }` describing the element and handle type,
 * or `null` if no handle is hit.
 *
 * `includeDeleteHandle` opts in to the floating quick-delete button hit-test;
 * only the primary selection interaction path passes `true` so the synthetic
 * `delete-action` handle never leaks into other `getHandleAtPosition` callers.
 */
export function getHandleAtPosition(
    x: number,
    y: number,
    elements: readonly DrawingElement[],
    selection: string[],
    scale: number,
    includeDeleteHandle = false
): { id: string; handle: string } | null {
    const handleSize = 12 / scale; // slightly larger hit area
    const padding = 2 / scale;

    // 0. Highest priority: floating quick-delete button (touch-friendly). Opt-in so
    //    it can't be returned to cursor/hover or non-selection consumers.
    if (includeDeleteHandle && selection.length > 0) {
        const dp = getDeleteHandlePosition(elements, selection, scale);
        if (dp && Math.hypot(x - dp.x, y - dp.y) <= DELETE_HANDLE_HIT_RADIUS / scale) {
            return { id: 'delete', handle: 'delete-action' };
        }
    }

    // 1. Priority: Multi-selection handles
    if (selection.length > 1) {
        const box = getSelectionBoundingBox(elements, selection);
        if (box) {
            const handles = [
                { type: 'tl', x: box.x - padding, y: box.y - padding },
                { type: 'tr', x: box.x + box.width + padding, y: box.y - padding },
                { type: 'br', x: box.x + box.width + padding, y: box.y + box.height + padding },
                { type: 'bl', x: box.x - padding, y: box.y + box.height + padding },
                { type: 'tm', x: box.x + box.width / 2, y: box.y - padding },
                { type: 'rm', x: box.x + box.width + padding, y: box.y + box.height / 2 },
                { type: 'bm', x: box.x + box.width / 2, y: box.y + box.height + padding },
                { type: 'lm', x: box.x - padding, y: box.y + box.height / 2 }
            ];

            for (const h of handles) {
                if (Math.abs(x - h.x) <= handleSize / 2 && Math.abs(y - h.y) <= handleSize / 2) {
                    return { id: 'multi', handle: h.type };
                }
            }
            // Rotate handle (above the box top-centre) — lets a multi-selection / group rotate.
            const rotX = box.x + box.width / 2, rotY = box.y - padding - 20 / scale;
            if (Math.abs(x - rotX) <= handleSize && Math.abs(y - rotY) <= handleSize) {
                return { id: 'multi', handle: 'rotate' };
            }
        }
    }

    // 1a. Connection handles on grouped / multi-selected members. The renderer draws
    //     the green "+" circles on every selected shape, so they must be hit-testable
    //     here too — otherwise a shape in a group shows the handles but you can't drag
    //     them out to start a connector. (Single-selection handles are covered below.)
    if (selection.length > 1) {
        const connectorSize = 14 / scale;
        const connectorOffset = 32 / scale;
        for (const id of selection) {
            const el = elements.find(e => e.id === id);
            if (!el || el.type === 'line' || el.type === 'arrow') continue;
            const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
            const handles = [
                { pos: 'top', hx: cx, hy: el.y - connectorOffset },
                { pos: 'right', hx: el.x + el.width + connectorOffset, hy: cy },
                { pos: 'bottom', hx: cx, hy: el.y + el.height + connectorOffset },
                { pos: 'left', hx: el.x - connectorOffset, hy: cy },
            ];
            for (const h of handles) {
                if (Math.hypot(x - h.hx, y - h.hy) <= connectorSize / 2 + 2 / scale) {
                    return { id: el.id, handle: `connector-${h.pos}` };
                }
            }
        }
    }

    // 1b. Mindmap add-child handle on the single selected node (mouse parity with Tab).
    //     Checked before element selection so the click isn't swallowed.
    if (selection.length === 1) {
        const el = elements.find(e => e.id === selection[0]);
        const CONNECTORS = ['line', 'arrow', 'organicBranch', 'bezier', 'polyline'];
        const isMindmapNode = el && (!!el.parentId || elements.some(e => e.parentId === el.id));
        if (el && isMindmapNode && !CONNECTORS.includes(el.type) && !isElementHiddenByHierarchy(el, elements)) {
            const ecx = el.x + el.width / 2;
            const ecy = el.y + el.height / 2;
            const local = unrotatePoint(x, y, ecx, ecy, el.angle || 0);
            const cx = el.x + el.width + 28 / scale; // matches renderer; clear of 'rm' resize handle
            const cy = el.y + el.height / 2;
            const dist = Math.sqrt(Math.pow(local.x - cx, 2) + Math.pow(local.y - cy, 2));
            if (dist <= 14 / scale) {
                return { id: el.id, handle: 'mindmap-add-child' };
            }

        }
    }

    // 1b-warp. Envelope warp corner handles — highest priority for a warped element, so a
    // warp corner wins over both path-anchor editing and the bbox resize corners (the
    // default quad sits exactly on those). Tested in the element's unrotated frame.
    if (selection.length === 1) {
        const el = elements.find(e => e.id === selection[0]);
        const grid = el ? getWarpGrid(el.warp) : null;
        if (el && grid) {
            const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
            const local = unrotatePoint(x, y, cx, cy, el.angle || 0);
            for (let wi = 0; wi < grid.points.length; wi++) {
                const wc = grid.points[wi];
                if (Math.abs(local.x - (cx + wc.x)) <= handleSize / 2 && Math.abs(local.y - (cy + wc.y)) <= handleSize / 2) {
                    return { id: el.id, handle: `warp-${wi}` };
                }
            }
        }
    }

    // 1c. Path anchors are NOT hit-tested here any more — the Node tool owns them.
    //     This block used to return `path-anchor-*` / `path-in-*` / `path-out-*` for the
    //     single selected path, BEFORE the bbox resize handles, so that an extreme anchor
    //     beat the corner grip it sits under. Once the Selection tool stopped drawing
    //     anchors (see selection-renderer.ts) those targets were invisible, and an
    //     invisible target that outranks corner-resize is strictly worse than none: on an
    //     outlined word or an imported icon, grabbing the bounding box to scale it would
    //     silently drag one glyph node instead. Anchor editing lives in the Node tool
    //     (`N`, or double-click a path), which does its own hit-testing in its overlay.

    // 2. Mindmap Toggle Handles (Priority over element selection)
    for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (isElementHiddenByHierarchy(el, elements)) continue;

        const hasChildren = elements.some(e => e.parentId === el.id);
        if (hasChildren && el.type !== 'line' && el.type !== 'arrow' && el.type !== 'organicBranch' && el.type !== 'bezier') {
            const ecx = el.x + el.width / 2;
            const ecy = el.y + el.height / 2;
            const local = unrotatePoint(x, y, ecx, ecy, el.angle || 0);

            const toggleSize = 18 / scale;
            const tx = el.x + el.width / 2;
            const ty = el.y + el.height + 15 / scale;

            const dist = Math.sqrt(Math.pow(local.x - tx, 2) + Math.pow(local.y - ty, 2));
            if (dist <= (toggleSize / 2) + (5 / scale)) {
                return { id: el.id, handle: 'mindmap-toggle' };
            }
        }
    }

    // 3. Single element handles
    for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (!selection.includes(el.id)) continue;
        if (selection.length > 1) continue;

        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        const heading = el.angle || 0;

        // Transform mouse point to element's local system (unrotate)
        const local = unrotatePoint(x, y, cx, cy, heading);

        // Check corners and sides
        let handles = [
            { type: 'tl', x: el.x - padding, y: el.y - padding },
            { type: 'tr', x: el.x + el.width + padding, y: el.y - padding },
            { type: 'br', x: el.x + el.width + padding, y: el.y + el.height + padding },
            { type: 'bl', x: el.x - padding, y: el.y + el.height + padding },
            { type: 'tm', x: el.x + el.width / 2, y: el.y - padding },
            { type: 'rm', x: el.x + el.width + padding, y: el.y + el.height / 2 },
            { type: 'bm', x: el.x + el.width / 2, y: el.y + el.height + padding },
            { type: 'lm', x: el.x - padding, y: el.y + el.height / 2 }
        ];

        if (el.type === 'line' || el.type === 'arrow' || el.type === 'organicBranch') {
            let startX = el.x;
            let startY = el.y;
            let endX = el.x + el.width;
            let endY = el.y + el.height;

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

            handles = [
                { type: 'tl', x: startX, y: startY },
                { type: 'br', x: endX, y: endY }
            ];
        }

        for (const h of handles) {
            if (Math.abs(local.x - h.x) <= handleSize / 2 && Math.abs(local.y - h.y) <= handleSize / 2) {
                return { id: el.id, handle: h.type };
            }
        }

        // Custom rotation pivot — only when the user has placed one (no default-centre
        // grab, so clicking the body to MOVE is never hijacked). Tested in world space
        // (the pivot is a world point, independent of element rotation). Generous radius
        // so it's easy to grab with a finger/pen as well as a mouse.
        const customPivot = getCustomPivot(selection);
        if (customPivot) {
            const pr = handleSize; // ~24px box at scale 1 — touch-friendly
            if (Math.abs(x - customPivot.x) <= pr && Math.abs(y - customPivot.y) <= pr) {
                return { id: el.id, handle: 'pivot' };
            }
        }

        // Check Rotate Handle (skip perspectiveBlock - it has visual-bounds-based rotation handle)
        if (el.type !== 'perspectiveBlock') {
            const rotH = { x: el.x + el.width / 2, y: el.y - padding - 20 / scale };
            if (Math.abs(local.x - rotH.x) <= handleSize && Math.abs(local.y - rotH.y) <= handleSize / 2) {
                return { id: el.id, handle: 'rotate' };
            }
        }

        // Table Move Handle — top-left corner outside bounding box
        if (el.type === 'table') {
            const moveSize = 20 / scale;
            const moveX = el.x - padding - moveSize - 4 / scale + moveSize / 2;
            const moveY = el.y - padding - moveSize - 4 / scale + moveSize / 2;
            const dist = Math.sqrt(Math.pow(local.x - moveX, 2) + Math.pow(local.y - moveY, 2));
            if (dist <= moveSize / 2 + 2 / scale) {
                return { id: el.id, handle: 'table-move' };
            }
        }

        // Custom Control Handles (Star, Burst, Isometric Cube, Solid Block)
        if (el.type === 'isometricCube') {
            const shapeRatio = (el.shapeRatio !== undefined ? el.shapeRatio : 25) / 100;
            const sideRatio = (el.sideRatio !== undefined ? el.sideRatio : 50) / 100;

            // Calculate handle position (Center Vertex)
            const faceHeight = el.height * shapeRatio;
            const cy = el.y + faceHeight;
            const cx = el.x + el.width * sideRatio;

            if (Math.abs(local.x - cx) <= handleSize && Math.abs(local.y - cy) <= handleSize) {
                return { id: el.id, handle: 'control-1' };
            }
        } else if (el.type === 'solidBlock' || el.type === 'cylinder') {
            const depthBase = el.depth !== undefined ? el.depth : 50;
            const angle = (el.viewAngle !== undefined ? el.viewAngle : 45) * Math.PI / 180;

            const centerX = el.x + el.width / 2;
            const centerY = el.y + el.height / 2;

            // Scale depth with shape size (must match shape-geometry.ts calculation)
            const minDim = Math.min(Math.abs(el.width), Math.abs(el.height));
            const depth = minDim > 0 ? Math.min(depthBase, minDim * 0.5) : 0;

            const cx = centerX + depth * Math.cos(angle);
            const cy = centerY + depth * Math.sin(angle);

            if (Math.abs(local.x - cx) <= handleSize && Math.abs(local.y - cy) <= handleSize) {
                return { id: el.id, handle: 'control-1' };
            }
        } else if (el.type === 'perspectiveBlock') {
            const depthBase = el.depth !== undefined ? el.depth : 50;
            const angle = (el.viewAngle !== undefined ? el.viewAngle : 45) * Math.PI / 180;
            const taper = el.taper !== undefined ? el.taper : 0;
            const skewX = (el.skewX !== undefined ? el.skewX : 0) * el.width;
            const skewY = (el.skewY !== undefined ? el.skewY : 0) * el.height;

            const centerX = el.x + el.width / 2;
            const centerY = el.y + el.height / 2;

            // Scale depth with shape size (must match shape-geometry.ts calculation)
            const minDim = Math.min(Math.abs(el.width), Math.abs(el.height));
            const depth = minDim > 0 ? Math.min(depthBase, minDim * 0.5) : 0;

            const dx = depth * Math.cos(angle) + skewX;
            const dy = depth * Math.sin(angle) + skewY;

            const scale = 1 - taper;
            const bw = (el.width / 2) * scale;
            const bh = (el.height / 2) * scale;

            const fScale = 1 - (el.frontTaper || 0);
            const fw = (el.width / 2) * fScale;
            const fh = (el.height / 2) * fScale;
            const fsX = (el.frontSkewX || 0) * el.width;
            const fsY = (el.frontSkewY || 0) * el.height;

            const handles = [
                { x: centerX + dx, y: centerY + dy, handle: 'control-1' },   // Back Center
                // Back Vertices
                { x: centerX + dx - bw, y: centerY + dy - bh, handle: 'control-2' },
                { x: centerX + dx + bw, y: centerY + dy - bh, handle: 'control-3' },
                { x: centerX + dx + bw, y: centerY + dy + bh, handle: 'control-4' },
                { x: centerX + dx - bw, y: centerY + dy + bh, handle: 'control-5' },
                // Front Vertices
                { x: centerX + fsX - fw, y: centerY + fsY - fh, handle: 'control-6' },
                { x: centerX + fsX + fw, y: centerY + fsY - fh, handle: 'control-7' },
                { x: centerX + fsX + fw, y: centerY + fsY + fh, handle: 'control-8' },
                { x: centerX + fsX - fw, y: centerY + fsY + fh, handle: 'control-9' }
            ];

            for (const h of handles) {
                if (Math.abs(local.x - h.x) <= handleSize && Math.abs(local.y - h.y) <= handleSize) {
                    return { id: el.id, handle: h.handle };
                }
            }

            // Check visual-bounds-based rotation handle for perspectiveBlock
            const visualTop = Math.min(
                centerY + dy - bh,  // bTL, bTR
                centerY + fsY - fh  // fTL, fTR
            );
            const rotHandleY = visualTop - padding - 20 / scale;
            if (Math.abs(local.x - centerX) <= handleSize && Math.abs(local.y - rotHandleY) <= handleSize / 2) {
                return { id: el.id, handle: 'rotate' };
            }
        } else if (el.type === 'star' || el.type === 'burst') {
            const ratio = (el.shapeRatio !== undefined ? el.shapeRatio : 25) / 100;
            const cx = el.x + el.width / 2;
            const cy = el.y + el.height * ratio;

            if (Math.abs(local.x - cx) <= handleSize && Math.abs(local.y - cy) <= handleSize) {
                return { id: el.id, handle: 'control-1' };
            }
        }

        // Check Control Points for Bezier/SmartElbow
        if ((el.type === 'line' || el.type === 'arrow' || el.type === 'bezier' || el.type === 'organicBranch') && el.controlPoints) {
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

                if (Math.abs(x - curveX) <= handleSize / 2 && Math.abs(y - curveY) <= handleSize / 2) {
                    return { id: el.id, handle: `control-0` };
                }
            } else {
                for (let i = 0; i < el.controlPoints.length; i++) {
                    const cp = el.controlPoints[i];
                    if (Math.abs(x - cp.x) <= handleSize / 2 && Math.abs(y - cp.y) <= handleSize / 2) {
                        return { id: el.id, handle: `control-${i}` };
                    }
                }
            }
        }

        // Check Polyline/Elbow intermediate point handles (works for both bound and unbound elbows)
        const hasElbowPoints = el.curveType === 'elbow' && el.points && Array.isArray(el.points);
        if (hasElbowPoints) {
            const pts = normalizePoints(el.points);
            // Skip first and last (those are start/end handles tl/br)
            for (let pi = 1; pi < pts.length - 1; pi++) {
                const px = el.x + pts[pi].x;
                const py = el.y + pts[pi].y;
                if (Math.abs(x - px) <= handleSize / 2 && Math.abs(y - py) <= handleSize / 2) {
                    return { id: el.id, handle: `polypoint-${pi}` };
                }
            }
        }

        // Check Elbow segment handles (drag entire horizontal/vertical segments)
        if (hasElbowPoints) {
            const pts = normalizePoints(el.points);
            const segmentHitDist = 8 / scale;
            for (let si = 0; si < pts.length - 1; si++) {
                const p1x = el.x + pts[si].x, p1y = el.y + pts[si].y;
                const p2x = el.x + pts[si + 1].x, p2y = el.y + pts[si + 1].y;
                const isHoriz = Math.abs(p1y - p2y) < 1;
                const isVert = Math.abs(p1x - p2x) < 1;
                if (isHoriz) {
                    const minSX = Math.min(p1x, p2x), maxSX = Math.max(p1x, p2x);
                    if (maxSX - minSX > 5 / scale && x >= minSX && x <= maxSX && Math.abs(y - p1y) <= segmentHitDist) {
                        return { id: el.id, handle: `segment-${si}` };
                    }
                } else if (isVert) {
                    const minSY = Math.min(p1y, p2y), maxSY = Math.max(p1y, p2y);
                    if (maxSY - minSY > 5 / scale && y >= minSY && y <= maxSY && Math.abs(x - p1x) <= segmentHitDist) {
                        return { id: el.id, handle: `segment-${si}` };
                    }
                }
            }
        }

        // Check Connector Handles (only for non-line/arrow shapes, plus unbound polyline shapes)
        const isPolylineShape = el.type === 'line' && el.curveType === 'elbow' && !el.startBinding && !el.endBinding;
        if ((el.type !== 'line' && el.type !== 'arrow') || isPolylineShape) {
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

            const ecx = (bbMinX + bbMaxX) / 2;
            const ecy = (bbMinY + bbMaxY) / 2;
            const connectorHandles = [
                { type: 'connector-top', x: ecx, y: bbMinY - connectorOffset },
                { type: 'connector-right', x: bbMaxX + connectorOffset, y: ecy },
                { type: 'connector-bottom', x: ecx, y: bbMaxY + connectorOffset },
                { type: 'connector-left', x: bbMinX - connectorOffset, y: ecy }
            ];

            for (const ch of connectorHandles) {
                const dist = Math.sqrt(Math.pow(local.x - ch.x, 2) + Math.pow(local.y - ch.y, 2));
                if (dist <= connectorSize / 2 + 2 / scale) { // Small tolerance
                    return { id: el.id, handle: ch.type };
                }
            }
        }
    }

    // Draggable in-shape label handle — lowest priority (any real handle wins). A small
    // grab dot sits at the label's current position; grabbing it repositions the text
    // (textOffsetX/Y) instead of moving the shape. Only for single-selected container
    // shapes whose text goes through the shared renderer (not connectors / text / tables
    // / UML compartments, which draw their own text).
    if (selection.length === 1) {
        const el = elements.find(e => e.id === selection[0]);
        if (el && TEXT_MOVE_ELIGIBLE(el)) {
            const ecx = el.x + el.width / 2, ecy = el.y + el.height / 2;
            const local = unrotatePoint(x, y, ecx, ecy, el.angle || 0);
            const tx = ecx + (el.textOffsetX || 0), ty = ecy + (el.textOffsetY || 0);
            if (Math.hypot(local.x - tx, local.y - ty) <= 11 / scale) {
                return { id: el.id, handle: 'text-move' };
            }
        }
    }
    return null;
}

const TEXT_MOVE_EXCLUDED = new Set([
    'line', 'arrow', 'bezier', 'organicBranch', 'polyline', 'table', 'text', 'richtext',
    'codeBlock', 'umlClass', 'umlInterface', 'umlEnum', 'umlState',
]);
/** A single-selected shape is label-draggable if it has visible container text and
 *  isn't a type that renders its own text (connectors, tables, UML compartments, …). */
function TEXT_MOVE_ELIGIBLE(el: DrawingElement): boolean {
    return !!el.containerText && el.containerText.trim().length > 0
        && !TEXT_MOVE_EXCLUDED.has(el.type)
        && !el.type.startsWith('ds')
        && !el.isEditing;
}
