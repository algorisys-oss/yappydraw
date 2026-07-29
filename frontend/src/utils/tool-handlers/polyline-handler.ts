/**
 * Polyline Handler
 * Multi-click tool: click to place points, double-click to finish.
 * Creates a line element with curveType: 'elbow' and a points array.
 * Polylines are free-form (no shape binding) — use arrows for connectors.
 */

import type { DrawingElement } from '../../types';
import type { PointerState } from '../pointer-state';
import type { PointerHelpers, PointerSignals } from '../pointer-helpers';
import { store, addElement, updateElement, setStore, setSelectedTool, pushToHistory, applyLiveSymmetry } from '../../store/app-store';
import { snapPoint } from '../snap-helpers';
import { generateId } from '../id-generator';

// ─── Pointer Down: Create or append point ────────────────────────────

export function polylineOnDown(
    x: number,
    y: number,
    pState: PointerState,
    _helpers: PointerHelpers
): void {
    let px = x;
    let py = y;
    if (store.gridSettings.snapToGrid) {
        const snapped = snapPoint(x, y, store.gridSettings.gridSize);
        px = snapped.x;
        py = snapped.y;
    }

    if (!pState.isPolylineBuilding) {
        // First click — create the element
        pushToHistory();
        pState.isPolylineBuilding = true;
        pState.isDrawing = true;
        pState.startX = px;
        pState.startY = py;
        pState.currentId = generateId('line');
        pState.polylinePoints = [{ x: 0, y: 0 }];

        const newElement = {
            ...store.defaultElementStyles,
            id: pState.currentId,
            type: 'line',
            x: px,
            y: py,
            width: 0,
            height: 0,
            seed: Math.floor(Math.random() * 2 ** 31) + 1,
            layerId: store.activeLayerId,
            curveType: 'elbow' as const,
            points: [{ x: 0, y: 0 }],
            startArrowhead: null,
            endArrowhead: null,
        } as DrawingElement;

        addElement(newElement);
    } else if (pState.currentId) {
        // Check if clicking near the start point to close the shape
        const closeThreshold = 15 / store.viewState.scale;
        const distToStart = Math.sqrt((px - pState.startX) ** 2 + (py - pState.startY) ** 2);

        if (pState.polylinePoints.length >= 3 && distToStart < closeThreshold) {
            // Snap to start point (close the polygon) and finalize
            pState.polylinePoints.push({ x: 0, y: 0 });
            updateElement(pState.currentId, {
                points: [...pState.polylinePoints],
            });
            // Auto-finalize
            setStore('selection', [pState.currentId]);
            pState.isPolylineBuilding = false;
            pState.isDrawing = false;
            pState.polylinePoints = [];
            pState.currentId = null;
            setSelectedTool('selection');
            return;
        }

        // Subsequent click — commit the preview point as a real point
        const relX = px - pState.startX;
        const relY = py - pState.startY;
        pState.polylinePoints.push({ x: relX, y: relY });

        // Update the element with committed points (no preview tail)
        updateElement(pState.currentId, {
            points: [...pState.polylinePoints],
        });
    }
}

// ─── Pointer Move: Rubber-band preview ───────────────────────────────

export function polylineOnMove(
    x: number,
    y: number,
    pState: PointerState,
    _helpers: PointerHelpers,
    signals: PointerSignals
): void {
    if (!pState.isPolylineBuilding || !pState.currentId) return;

    let px = x;
    let py = y;

    // Check for snap-to-start (close polygon) when >= 3 points
    const closeThreshold = 15 / store.viewState.scale;
    const distToStart = Math.sqrt((px - pState.startX) ** 2 + (py - pState.startY) ** 2);
    const canClose = pState.polylinePoints.length >= 3 && distToStart < closeThreshold;

    if (canClose) {
        // Snap to start point
        px = pState.startX;
        py = pState.startY;
    } else {
        // Grid snap only (no shape binding for polylines)
        if (store.gridSettings.snapToGrid) {
            const snapped = snapPoint(x, y, store.gridSettings.gridSize);
            px = snapped.x;
            py = snapped.y;
        }
    }
    signals.setSuggestedBinding(null);

    const relX = px - pState.startX;
    const relY = py - pState.startY;

    // Show committed points + preview point at cursor
    const previewPoints = [...pState.polylinePoints, { x: relX, y: relY }];

    // Compute bounding box for width/height
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of previewPoints) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }

    updateElement(pState.currentId, {
        points: previewPoints,
        width: maxX - minX || relX,
        height: maxY - minY || relY,
    });
}

// ─── Pointer Up: No-op (keep building) ──────────────────────────────

export function polylineOnUp(_pState: PointerState): void {
    // Intentionally empty — polyline keeps building until double-click or Escape
}

// ─── Finalize: Commit the polyline ───────────────────────────────────

export function polylineFinalize(
    pState: PointerState,
    _helpers?: PointerHelpers,
    _signals?: PointerSignals
): void {
    if (!pState.isPolylineBuilding || !pState.currentId) return;

    // Need at least 2 points for a valid polyline
    if (pState.polylinePoints.length < 2) {
        // Remove the element if only 1 point
        const idx = store.elements.findIndex(e => e.id === pState.currentId);
        if (idx >= 0) {
            setStore('elements', els => els.filter(e => e.id !== pState.currentId));
        }
    } else {
        // Commit final points (no binding for polylines)
        updateElement(pState.currentId, {
            points: [...pState.polylinePoints],
        });
    }

    // Select the created element
    if (pState.polylinePoints.length >= 2 && pState.currentId) {
        applyLiveSymmetry(pState.currentId); // live mirror / quadrant / mandala copies
        setStore('selection', [pState.currentId]);
    }

    // Reset state
    pState.isPolylineBuilding = false;
    pState.isDrawing = false;
    pState.polylinePoints = [];
    pState.currentId = null;
    setSelectedTool('selection');
}

// ─── Undo last point (Backspace) ─────────────────────────────────────

export function polylineUndo(pState: PointerState): void {
    if (!pState.isPolylineBuilding || !pState.currentId) return;

    if (pState.polylinePoints.length <= 1) {
        // Only origin point — cancel entirely
        setStore('elements', els => els.filter(e => e.id !== pState.currentId));
        pState.isPolylineBuilding = false;
        pState.isDrawing = false;
        pState.polylinePoints = [];
        pState.currentId = null;
        return;
    }

    // Remove last committed point
    pState.polylinePoints.pop();
    updateElement(pState.currentId, {
        points: [...pState.polylinePoints],
    });
}
