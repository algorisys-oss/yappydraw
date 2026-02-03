/**
 * Minor Tool Handlers
 * Handles presentation mode, pan, laser, eraser, text, and ink tool logic.
 * Extracted from canvas.tsx handlePointerDown/Move/Up.
 */

import type { DrawingElement } from '../../types';
import type { PointerState } from '../pointer-state';
import type { PointerHelpers, PointerSignals } from '../pointer-helpers';
import { store, setViewState, addElement, updateElement, setStore, deleteElements, advancePresentation, isLayerVisible, toggleCollapse } from '../../store/app-store';
import { hitTestElement } from '../hit-testing';
import { getHandleAtPosition } from '../handle-detection';
import { generateId } from '../id-generator';

// ─── Presentation Mode ──────────────────────────────────────────────

/**
 * Handle presentation-mode early returns for pointer down.
 * Returns true if the event was fully handled (caller should return).
 */
export function presentationOnDown(
    e: PointerEvent,
    pState: PointerState,
    helpers: PointerHelpers
): boolean {
    if (store.appMode !== 'presentation') return false;

    const { x, y } = helpers.getWorldCoordinates(e.clientX, e.clientY);

    // Allow mindmap toggle clicks in presentation mode
    const hitHandle = getHandleAtPosition(x, y, store.elements, store.selection, store.viewState.scale);
    if (hitHandle && hitHandle.handle === 'mindmap-toggle') {
        toggleCollapse(hitHandle.id);
        return true;
    }

    const isNavTool = store.selectedTool === 'selection' || store.selectedTool === 'pan';

    // Allow element interaction (select & move) in presentation mode
    if (isNavTool && e.button === 0) {
        const threshold = 5 / store.viewState.scale;
        const elementMap = new Map<string, DrawingElement>();
        for (const el of store.elements) elementMap.set(el.id, el);
        for (let i = store.elements.length - 1; i >= 0; i--) {
            const el = store.elements[i];
            if (hitTestElement(helpers.applyMasterProjection(el), x, y, threshold, store.elements, elementMap)) {
                // Element hit — fall through to selectionOnDown for select/move
                return false;
            }
        }
        // Clicked empty space — deselect if anything is selected
        if (store.selection.length > 0) {
            setStore('selection', []);
        }
    }

    if (store.docType === 'slides') {
        if (isNavTool) {
            if (e.button === 0) {
                advancePresentation();
            }
            return true;
        }
        // Presentation tools (laser, ink, eraser) fall through
        return false;
    } else {
        // Infinite mode: laser/ink/eraser fall through, nav tools pan
        if (isNavTool && (e.button === 0 || e.button === 1)) {
            pState.isDragging = true;
            pState.startX = e.clientX;
            pState.startY = e.clientY;
            (e.currentTarget as Element).setPointerCapture(e.pointerId);
            return true;
        }
        if (!isNavTool) return false;
    }

    return false;
}

/**
 * Handle presentation-mode early returns for pointer move.
 * Returns true if the event was fully handled.
 */
export function presentationOnMove(
    e: PointerEvent,
    pState: PointerState
): boolean {
    if (store.appMode !== 'presentation') return false;

    const isNavTool = store.selectedTool === 'selection' || store.selectedTool === 'pan';

    // If elements are selected and being dragged, let selectionOnMove handle it
    if (isNavTool && store.selection.length > 0) return false;

    if (store.docType === 'slides' && isNavTool) return true;

    if (store.docType === 'slides') {
        // Fall through to world-coord calculation and tool logic
        return false;
    } else if (pState.isDragging && isNavTool) {
        setViewState({
            panX: store.viewState.panX + e.movementX,
            panY: store.viewState.panY + e.movementY
        });
        return true;
    }

    // Infinite mode: laser/ink/eraser fall through to tool logic
    return false;
}

/**
 * Handle presentation-mode early returns for pointer up.
 * Returns true if the event was fully handled.
 */
export function presentationOnUp(
    pState: PointerState
): boolean {
    if (store.appMode !== 'presentation') return false;

    const isNavTool = store.selectedTool === 'selection' || store.selectedTool === 'pan';

    // If elements are selected, let selectionOnUp handle it
    if (isNavTool && store.selection.length > 0) return false;

    if (store.docType === 'slides' && isNavTool) return true;

    if (store.docType !== 'slides' && isNavTool) {
        pState.isDragging = false;
        return true;
    }

    // Infinite mode: laser/ink/eraser fall through to tool logic
    return false;
}

// ─── Pan Tool ────────────────────────────────────────────────────────

export function panOnDown(
    pState: PointerState,
    helpers: PointerHelpers
): void {
    pState.isDragging = true;
    helpers.setCursor('grabbing');
}

export function panOnMove(
    e: PointerEvent,
    pState: PointerState,
    helpers: PointerHelpers
): void {
    helpers.setCursor(pState.isDragging ? 'grabbing' : 'grab');
    if (pState.isDragging) {
        setViewState({
            panX: store.viewState.panX + e.movementX,
            panY: store.viewState.panY + e.movementY
        });
    }
}

export function panOnUp(
    pState: PointerState,
    helpers: PointerHelpers
): void {
    pState.isDragging = false;
    helpers.setCursor('grab');
}

// ─── Laser Tool ──────────────────────────────────────────────────────

export function laserOnDown(
    x: number,
    y: number,
    pState: PointerState
): void {
    pState.isDrawing = true;
    pState.laserTrailData = [{ x, y, timestamp: Date.now() }];
    pState.lastLaserUpdateTime = Date.now();
}

export function laserOnMove(
    e: PointerEvent,
    pState: PointerState,
    helpers: PointerHelpers,
    LASER_THROTTLE_MS: number,
    LASER_MAX_POINTS: number
): void {
    if (!pState.isDrawing) return;
    const now = Date.now();
    if (now - pState.lastLaserUpdateTime >= LASER_THROTTLE_MS) {
        pState.lastLaserUpdateTime = now;
        const { x, y } = helpers.getWorldCoordinates(e.clientX, e.clientY);
        if (pState.laserTrailData.length >= LASER_MAX_POINTS) {
            pState.laserTrailData.shift();
        }
        pState.laserTrailData.push({ x, y, timestamp: now });
        if (!pState.laserRafPending) {
            pState.laserRafPending = true;
            requestAnimationFrame(() => {
                pState.laserRafPending = false;
                helpers.draw();
            });
        }
    }
}

export function laserOnUp(
    pState: PointerState,
    helpers: PointerHelpers
): void {
    pState.isDrawing = false;
    const decayLoop = () => {
        if (pState.laserTrailData.length > 0) {
            helpers.draw();
            requestAnimationFrame(decayLoop);
        }
    };
    requestAnimationFrame(decayLoop);
}

// ─── Text Tool ───────────────────────────────────────────────────────

export function textOnDown(
    x: number,
    y: number,
    signals: PointerSignals
): void {
    const id = generateId('text');
    const newElement = {
        ...store.defaultElementStyles,
        id,
        type: 'text',
        x,
        y,
        width: 100,
        height: 30,
        text: '',
        layerId: store.activeLayerId
    } as DrawingElement;
    addElement(newElement);
    signals.setEditingId(id);
    signals.setEditText("");
    setTimeout(() => signals.textInputRef?.focus(), 0);
}

// ─── Ink Tool ────────────────────────────────────────────────────────

export function inkOnDown(
    x: number,
    y: number,
    pState: PointerState
): void {
    pState.isDrawing = true;
    pState.startX = x;
    pState.startY = y;
    pState.currentId = generateId('ink');
    const newElement = {
        ...store.defaultElementStyles,
        id: pState.currentId,
        type: 'ink',
        x,
        y,
        width: 0,
        height: 0,
        strokeColor: '#ef4444', // Bright red
        strokeWidth: 4,
        opacity: 100,
        points: [0, 0],
        pointsEncoding: 'flat',
        ttl: Date.now() + 3000, // 3 seconds
        presentationDrawn: true, // Mark as drawn during presentation (erasable in presentation mode)
        layerId: store.activeLayerId,
        seed: Math.floor(Math.random() * 2 ** 31)
    } as DrawingElement;
    addElement(newElement);
}

// ─── Eraser Tool ─────────────────────────────────────────────────────

export function eraserOnDown(
    x: number,
    y: number,
    pState: PointerState,
    helpers: PointerHelpers
): void {
    pState.isDrawing = true;
    const threshold = 10 / store.viewState.scale;
    const elementMap = new Map<string, DrawingElement>();
    for (const el of store.elements) elementMap.set(el.id, el);
    const isPresentation = store.appMode === 'presentation';

    for (let i = store.elements.length - 1; i >= 0; i--) {
        const el = store.elements[i];
        if (!helpers.canInteractWithElement(el)) continue;
        if (!isLayerVisible(el.layerId)) continue;
        // In presentation mode, only erase elements drawn during presentation
        if (isPresentation && !el.presentationDrawn) continue;
        if (hitTestElement(helpers.applyMasterProjection(el), x, y, threshold, store.elements, elementMap)) {
            deleteElements([el.id]);
        }
    }
}

export function eraserOnMove(
    x: number,
    y: number,
    helpers: PointerHelpers
): void {
    const threshold = 10 / store.viewState.scale;
    const elementMap = new Map<string, DrawingElement>();
    for (const el of store.elements) elementMap.set(el.id, el);
    const isPresentation = store.appMode === 'presentation';

    for (let i = store.elements.length - 1; i >= 0; i--) {
        const el = store.elements[i];
        if (!helpers.canInteractWithElement(el)) continue;
        if (!isLayerVisible(el.layerId)) continue;
        // In presentation mode, only erase elements drawn during presentation
        if (isPresentation && !el.presentationDrawn) continue;
        if (hitTestElement(helpers.applyMasterProjection(el), x, y, threshold, store.elements, elementMap)) {
            deleteElements([el.id]);
        }
    }
}

// ─── Connector Handle (Start arrow from connector) ──────────────────

export function connectorHandleOnDown(
    hitHandle: { id: string; handle: string },
    pState: PointerState
): void {
    const sourceEl = store.elements.find(e => e.id === hitHandle.id);
    if (!sourceEl) return;

    const anchorPosition = hitHandle.handle.replace('connector-', '');

    // For polylines, compute actual AABB from points
    const isPolylineShape = sourceEl.type === 'line' && sourceEl.curveType === 'elbow' && !sourceEl.startBinding && !sourceEl.endBinding;
    let bbMinX = sourceEl.x, bbMinY = sourceEl.y, bbMaxX = sourceEl.x + sourceEl.width, bbMaxY = sourceEl.y + sourceEl.height;
    if (isPolylineShape && sourceEl.points && Array.isArray(sourceEl.points) && (sourceEl.points as any[]).length >= 2) {
        bbMinX = Infinity; bbMinY = Infinity; bbMaxX = -Infinity; bbMaxY = -Infinity;
        for (const p of sourceEl.points as { x: number; y: number }[]) {
            bbMinX = Math.min(bbMinX, sourceEl.x + p.x);
            bbMinY = Math.min(bbMinY, sourceEl.y + p.y);
            bbMaxX = Math.max(bbMaxX, sourceEl.x + p.x);
            bbMaxY = Math.max(bbMaxY, sourceEl.y + p.y);
        }
    }

    const ecx = (bbMinX + bbMaxX) / 2;
    const ecy = (bbMinY + bbMaxY) / 2;

    let anchorX: number, anchorY: number;
    switch (anchorPosition) {
        case 'top':
            anchorX = ecx;
            anchorY = bbMinY;
            break;
        case 'right':
            anchorX = bbMaxX;
            anchorY = ecy;
            break;
        case 'bottom':
            anchorX = ecx;
            anchorY = bbMaxY;
            break;
        case 'left':
            anchorX = bbMinX;
            anchorY = ecy;
            break;
        default:
            anchorX = ecx;
            anchorY = ecy;
    }

    pState.isDrawing = true;
    pState.startX = anchorX;
    pState.startY = anchorY;
    pState.currentId = generateId('arrow');

    pState.draggingFromConnector = {
        elementId: sourceEl.id,
        anchorPosition,
        startX: anchorX,
        startY: anchorY
    };

    const newElement = {
        ...store.defaultElementStyles,
        id: pState.currentId,
        type: 'arrow',
        x: anchorX,
        y: anchorY,
        width: 0,
        height: 0,
        seed: Math.floor(Math.random() * 2 ** 31),
        layerId: store.activeLayerId,
        curveType: store.defaultElementStyles.curveType || 'straight',
        startBinding: { elementId: sourceEl.id, focus: 0, gap: 5, position: anchorPosition }
    } as DrawingElement;

    addElement(newElement);

    const existing = sourceEl.boundElements || [];
    updateElement(sourceEl.id, { boundElements: [...existing, { id: pState.currentId, type: 'arrow' }] });
}

export function connectorHandleOnUp(
    pState: PointerState,
    signals: PointerSignals,
    helpers: PointerHelpers
): void {
    if (!pState.currentId) return;

    const el = store.elements.find(e => e.id === pState.currentId);
    if (el) {
        if (signals.suggestedBinding()) {
            const binding = signals.suggestedBinding()!;
            const bindingData = { elementId: binding.elementId, focus: 0, gap: 5 };
            updateElement(pState.currentId, { endBinding: bindingData });

            const target = store.elements.find(e => e.id === binding.elementId);
            if (target) {
                const existing = target.boundElements || [];
                if (!existing.find(b => b.id === pState.currentId)) {
                    updateElement(target.id, { boundElements: [...existing, { id: pState.currentId, type: 'arrow' }] });
                }
            }
        }

        setStore('selection', [pState.currentId]);
    }

    pState.isDrawing = false;
    pState.currentId = null;
    pState.draggingFromConnector = null;
    signals.setSuggestedBinding(null);
    requestAnimationFrame(helpers.draw);
}

// ─── Auto-scroll ─────────────────────────────────────────────────────

export function handleAutoScroll(
    e: PointerEvent,
    pState: PointerState
): void {
    if (!pState.isDragging && !pState.isDrawing) return;

    const edgeThreshold = 50;
    const scrollSpeed = 10;
    const clientX = e.clientX;
    const clientY = e.clientY;

    let dPanX = 0;
    let dPanY = 0;

    if (clientX < edgeThreshold) dPanX = scrollSpeed;
    if (clientX > window.innerWidth - edgeThreshold) dPanX = -scrollSpeed;
    if (clientY < edgeThreshold) dPanY = scrollSpeed;
    if (clientY > window.innerHeight - edgeThreshold) dPanY = -scrollSpeed;

    if (dPanX !== 0 || dPanY !== 0) {
        setViewState({
            panX: store.viewState.panX + dPanX,
            panY: store.viewState.panY + dPanY
        });
    }
}
