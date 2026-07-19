/**
 * Minor Tool Handlers
 * Handles presentation mode, pan, laser, eraser, text, and ink tool logic.
 * Extracted from canvas.tsx handlePointerDown/Move/Up.
 */

import { batch } from 'solid-js';
import { isPagedDocType } from '../../types/slide-types';
import type { DrawingElement } from '../../types';
import type { PointerState } from '../pointer-state';
import type { PointerHelpers, PointerSignals } from '../pointer-helpers';
import { store, setViewState, addElement, updateElement, setStore, deleteElements, pushToHistory, advancePresentation, isLayerVisible, toggleCollapse, setActiveDsOpsElement, startInkCleanupIfNeeded } from '../../store/app-store';
import { hitTestElement } from '../hit-testing';
import { getHandleAtPosition } from '../handle-detection';
import { generateId } from '../id-generator';
import { animateElement } from '../animation/element-animator';
import { normalizePoints } from '../render-element';
import { computeAnchorFractions, expandToPortGroups } from '../binding-logic';

// ─── OpenBox Click-to-Open Animation ─────────────────────────────────

/**
 * Trigger the open and reveal animation for an openBox element.
 * Animates the lid opening and reveals the linked element if configured.
 */
function triggerOpenBoxReveal(el: DrawingElement): void {
    const duration = el.openAnimationDuration ?? 600;
    const currentOpen = el.openAmount ?? 0;

    // Toggle: if already open (>50), close it; otherwise open it
    const targetOpen = currentOpen > 50 ? 0 : 100;

    // Animate the lid opening/closing
    animateElement(el.id, { openAmount: targetOpen }, {
        duration,
        easing: 'easeOutCubic'
    });

    // If there's a reveal element, animate it too
    if (el.revealElementId && targetOpen === 100) {
        const revealEl = store.elements.find(e => e.id === el.revealElementId);
        if (revealEl) {
            const revealType = el.revealAnimationType ?? 'fadeIn';
            const revealDelay = duration * 0.3; // Start reveal 30% into the open animation
            const revealDuration = duration * 0.7;

            // Store original values for restore
            const origY = revealEl.y;
            const origWidth = revealEl.width;
            const origHeight = revealEl.height;

            // Calculate total animation time for restore
            const totalAnimTime = revealDelay + revealDuration + 500; // 500ms pause before restore

            switch (revealType) {
                case 'fadeIn':
                    // First set opacity to 0, then animate to 1
                    updateElement(el.revealElementId, { opacity: 0 });
                    setTimeout(() => {
                        animateElement(el.revealElementId!, { opacity: 100 }, {
                            duration: revealDuration,
                            easing: 'easeOutCubic'
                        });
                    }, revealDelay);
                    break;

                case 'slideUp':
                    const startY = revealEl.y + 30;
                    updateElement(el.revealElementId, { opacity: 0, y: startY });
                    setTimeout(() => {
                        animateElement(el.revealElementId!, { opacity: 100, y: origY - 30 }, {
                            duration: revealDuration,
                            easing: 'easeOutCubic'
                        });
                    }, revealDelay);
                    break;

                case 'scaleUp':
                    updateElement(el.revealElementId, {
                        opacity: 0,
                        width: origWidth * 0.5,
                        height: origHeight * 0.5
                    });
                    setTimeout(() => {
                        animateElement(el.revealElementId!, {
                            opacity: 100,
                            width: origWidth,
                            height: origHeight
                        }, {
                            duration: revealDuration,
                            easing: 'easeOutBack'
                        });
                    }, revealDelay);
                    break;

                case 'pop':
                    updateElement(el.revealElementId, {
                        opacity: 0,
                        width: origWidth * 0.3,
                        height: origHeight * 0.3
                    });
                    setTimeout(() => {
                        animateElement(el.revealElementId!, {
                            opacity: 100,
                            width: origWidth,
                            height: origHeight
                        }, {
                            duration: duration * 0.5,
                            easing: 'easeOutElastic'
                        });
                    }, revealDelay);
                    break;
            }

            // If restoreAfterReveal is enabled, auto-close and hide after animation
            if (el.restoreAfterReveal) {
                setTimeout(() => {
                    // Close the box
                    animateElement(el.id, { openAmount: 0 }, {
                        duration: duration * 0.5,
                        easing: 'easeInCubic'
                    });

                    // Hide the reveal element and restore original dimensions
                    animateElement(el.revealElementId!, {
                        opacity: 0,
                        y: origY,
                        width: origWidth,
                        height: origHeight
                    }, {
                        duration: duration * 0.3,
                        easing: 'easeInCubic'
                    });
                }, totalAnimTime);
            }
        }
    }

    // If closing the box, hide the reveal element
    if (el.revealElementId && targetOpen === 0) {
        animateElement(el.revealElementId, { opacity: 0 }, {
            duration: duration * 0.3,
            easing: 'easeInCubic'
        });
    }
}

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
                // Check for openBox with click-to-open enabled
                if (el.type === 'openBox' && el.enableClickToOpen) {
                    triggerOpenBoxReveal(el);
                    return true;
                }
                // DS element click — toggle operations panel
                const DS_TYPES = ['dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable'];
                if (DS_TYPES.includes(el.type)) {
                    setActiveDsOpsElement(store.activeDsOpsElementId === el.id ? null : el.id);
                    return true;
                }
                // Locked elements: skip to slide advance (don't select)
                if (el.locked) break;
                // Element hit — fall through to selectionOnDown for select/move
                return false;
            }
        }
        // Clicked empty space — deselect if anything is selected
        if (store.selection.length > 0) {
            setStore('selection', []);
        }
        // Dismiss DS operations panel
        if (store.activeDsOpsElementId) {
            setActiveDsOpsElement(null);
        }
    }

    if (isPagedDocType(store.docType)) {
        if (isNavTool) {
            if (e.button === 0) {
                advancePresentation();
            }
            return true;
        }
        // Presentation tools (laser, ink, eraser) fall through
        return false;
    } else {
        // Infinite mode: nav tools pan (drag) or advance (click)
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

    if (isPagedDocType(store.docType) && isNavTool) return true;

    if (isPagedDocType(store.docType)) {
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
    e: PointerEvent,
    pState: PointerState
): boolean {
    if (store.appMode !== 'presentation') return false;

    const isNavTool = store.selectedTool === 'selection' || store.selectedTool === 'pan';

    // If elements are selected, let selectionOnUp handle it
    if (isNavTool && store.selection.length > 0) return false;

    if (isPagedDocType(store.docType) && isNavTool) return true;

    if (!isPagedDocType(store.docType) && isNavTool) {
        // Distinguish click from drag: if pointer barely moved, treat as click-to-advance
        const dx = e.clientX - pState.startX;
        const dy = e.clientY - pState.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 5 && e.button === 0) {
            advancePresentation();
        }
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

// Constants for text tool
const TEXT_DEFAULT_WIDTH = 200; // click-placed fixed-width default (rich-text tool)
const TEXT_AUTOSIZE_MIN_WIDTH = 24; // starting width for click-placed autosize text (grows with content)
const TEXT_MIN_DRAG_WIDTH = 10;

export function textOnDown(
    x: number,
    y: number,
    pState: PointerState,
    _signals: PointerSignals
): void {
    const id = generateId('text');
    pState.isDrawing = true;
    pState.startX = x;
    pState.startY = y;
    pState.currentId = id;

    const newElement = {
        ...store.defaultElementStyles,
        id,
        type: 'text',
        x,
        y,
        width: 0,
        height: 24, // fontSize(20) * lineHeight(1.2)
        text: '',
        layerId: store.activeLayerId
    } as DrawingElement;
    addElement(newElement);
    // Don't open editor yet - defer to textOnUp
}

export function textOnMove(
    x: number,
    y: number,
    pState: PointerState
): void {
    if (!pState.isDrawing || !pState.currentId) return;

    const el = store.elements.find(e => e.id === pState.currentId);
    if (!el || el.type !== 'text') return;

    // Calculate width and height from drag distance
    const width = Math.abs(x - pState.startX);
    const height = Math.abs(y - pState.startY);

    // Handle dragging in any direction (normalize position)
    const newX = x < pState.startX ? x : pState.startX;
    const newY = y < pState.startY ? y : pState.startY;

    updateElement(pState.currentId, { x: newX, y: newY, width, height }, false);
}

export function textOnUp(
    pState: PointerState,
    signals: PointerSignals
): void {
    if (!pState.currentId) return;

    const el = store.elements.find(e => e.id === pState.currentId);
    if (!el || el.type !== 'text') {
        pState.isDrawing = false;
        pState.currentId = null;
        return;
    }

    const fontSize = el.fontSize || 20; // match text-renderer default
    const lineHeight = fontSize * 1.2;

    // Click (no meaningful drag) → AUTOSIZE text: the box grows with what you type,
    // Enter adds a line, nothing wraps (Excalidraw/tldraw "click & type"). Drag →
    // FIXED-WIDTH box (autoResize false) that word-wraps within the dragged width.
    const isClick = el.width < TEXT_MIN_DRAG_WIDTH;
    const autoResize = isClick;

    let finalWidth = el.width;
    let finalHeight = el.height;
    let finalX = el.x;
    let finalY = el.y;

    if (isClick) {
        // Start minimal; the editing overlay / commit grows the box to fit the content.
        finalWidth = TEXT_AUTOSIZE_MIN_WIDTH;
        finalX = pState.startX; // reset to the original click position
    }

    // If height is too small, use default height (one line)
    if (finalHeight < TEXT_MIN_DRAG_WIDTH) {
        finalHeight = lineHeight;
        finalY = pState.startY; // Reset to original click position
    }

    updateElement(pState.currentId, {
        x: finalX,
        y: finalY,
        width: finalWidth,
        height: finalHeight,
        autoResize,
    }, false);

    // Open text editor - use batch to set all state atomically
    batch(() => {
        signals.setEditText("");
        signals.setRichTextSpans([]); // Clear any previous rich text spans
        signals.setEditingId(pState.currentId); // must be last — triggers overlay render
    });
    setTimeout(() => signals.textInputRef?.focus(), 0);

    pState.isDrawing = false;
    pState.currentId = null;
}

// ─── Rich Text Tool ──────────────────────────────────────────────────

export function richTextOnDown(
    x: number,
    y: number,
    pState: PointerState,
    _signals: PointerSignals
): void {
    const id = generateId('richtext');
    pState.isDrawing = true;
    pState.startX = x;
    pState.startY = y;
    pState.currentId = id;

    const newElement = {
        ...store.defaultElementStyles,
        id,
        type: 'richtext',
        x,
        y,
        width: 0,
        height: 24, // fontSize(20) * lineHeight(1.2)
        text: '',
        richText: [], // Initialize empty rich text array
        layerId: store.activeLayerId
    } as DrawingElement;
    addElement(newElement);
    // Don't open editor yet - defer to richTextOnUp
}

export function richTextOnMove(
    x: number,
    y: number,
    pState: PointerState
): void {
    if (!pState.isDrawing || !pState.currentId) return;

    const el = store.elements.find(e => e.id === pState.currentId);
    if (!el || el.type !== 'richtext') return;

    // Calculate width and height from drag distance
    const width = Math.abs(x - pState.startX);
    const height = Math.abs(y - pState.startY);

    // Handle dragging in any direction (normalize position)
    const newX = x < pState.startX ? x : pState.startX;
    const newY = y < pState.startY ? y : pState.startY;

    updateElement(pState.currentId, { x: newX, y: newY, width, height }, false);
}

export function richTextOnUp(
    pState: PointerState,
    signals: PointerSignals
): void {
    if (!pState.currentId) return;

    const el = store.elements.find(e => e.id === pState.currentId);
    if (!el || el.type !== 'richtext') {
        pState.isDrawing = false;
        pState.currentId = null;
        return;
    }

    let finalWidth = el.width;
    let finalHeight = el.height;
    let finalX = el.x;
    let finalY = el.y;

    const fontSize = el.fontSize || 20; // match text-renderer default
    const lineHeight = fontSize * 1.2;

    // If width is too small (click rather than drag), use default width
    if (finalWidth < TEXT_MIN_DRAG_WIDTH) {
        finalWidth = TEXT_DEFAULT_WIDTH;
        finalX = pState.startX; // Reset to original click position
    }

    // If height is too small, use default height (one line)
    if (finalHeight < TEXT_MIN_DRAG_WIDTH) {
        finalHeight = lineHeight;
        finalY = pState.startY; // Reset to original click position
    }

    updateElement(pState.currentId, {
        x: finalX,
        y: finalY,
        width: finalWidth,
        height: finalHeight
    }, false);

    // Open rich text editor - use batch to set all state atomically
    const updatedEl = store.elements.find(e => e.id === pState.currentId);
    if (updatedEl && updatedEl.type === 'richtext') {
        const richSpans = updatedEl.richText || [];
        batch(() => {
            signals.setEditText("");
            signals.setRichTextSpans(richSpans);
            signals.setEditingId(pState.currentId); // must be last — triggers overlay render
        });
        setTimeout(() => signals.textInputRef?.focus(), 0);
    }

    pState.isDrawing = false;
    pState.currentId = null;
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
        ttl: Date.now() + 3000,
        presentationDrawn: true, // Mark as drawn during presentation (erasable in presentation mode)
        layerId: store.activeLayerId,
        seed: Math.floor(Math.random() * 2 ** 31)
    } as DrawingElement;
    addElement(newElement);
    startInkCleanupIfNeeded();
}

// ─── Eraser Tool ─────────────────────────────────────────────────────

const FREEHAND_TYPES = ['fineliner', 'inkbrush', 'marker', 'ink'];
const MIN_SEGMENT_POINTS = 4; // Minimum points to keep a segment (avoid tiny debris)

// Connectors are erased whole (partial erase of a connector isn't meaningful);
// everything else (rect, circle, polygon, image, text, …) gets a non-destructive
// erase mask so only the touched region disappears while the shape keeps its type.
const CONNECTOR_TYPES = ['line', 'arrow', 'bezier', 'organicBranch'];
const ERASE_MIN_STEP = 1.5; // min local distance between appended mask points (decimation)

// Active partial-erase session for one eraser drag. Tracks which mask-stroke
// index belongs to each element so a continuous drag appends to one stroke (and
// one undo entry) instead of spawning a fresh stroke per pointer sample.
let eraseSession: { historyPushed: boolean; strokeByElement: Map<string, number> } | null = null;

/** Append the current eraser point to an element's non-destructive erase mask. */
function appendEraseStroke(el: DrawingElement, worldX: number, worldY: number, radius: number): void {
    const localX = worldX - el.x;
    const localY = worldY - el.y;

    if (eraseSession && !eraseSession.historyPushed) {
        pushToHistory();
        eraseSession.historyPushed = true;
    }

    setStore("elements", els => els.map(e => {
        if (e.id !== el.id) return e;
        const strokes = e.eraseStrokes ? e.eraseStrokes.slice() : [];
        let idx = eraseSession?.strokeByElement.get(e.id);
        if (idx === undefined || idx >= strokes.length) {
            strokes.push({ points: [localX, localY], radius });
            eraseSession?.strokeByElement.set(e.id, strokes.length - 1);
        } else {
            const cur = strokes[idx];
            const p = cur.points;
            const lastX = p[p.length - 2];
            const lastY = p[p.length - 1];
            const dx = localX - lastX, dy = localY - lastY;
            if (dx * dx + dy * dy >= ERASE_MIN_STEP * ERASE_MIN_STEP) {
                strokes[idx] = { ...cur, points: [...p, localX, localY] };
            }
        }
        return { ...e, eraseStrokes: strokes };
    }));
}

/**
 * Split a freehand stroke by removing points within the eraser radius.
 * Returns an array of new DrawingElement segments (0 if fully erased, 1+ otherwise).
 */
function splitFreehandStroke(
    el: DrawingElement,
    worldX: number,
    worldY: number,
    eraseRadius: number
): DrawingElement[] {
    const pts = normalizePoints(el.points);
    if (pts.length < 2) return [];

    // Local eraser position relative to element origin
    const localX = worldX - el.x;
    const localY = worldY - el.y;
    // Include half the stroke width so a thick stroke is fully cut at the brush.
    const radius = eraseRadius + (el.strokeWidth || 2) / 2;
    const radiusSq = radius * radius;

    // Mark each point as erased or kept
    const kept: boolean[] = [];
    for (let i = 0; i < pts.length; i++) {
        const dx = pts[i].x - localX;
        const dy = pts[i].y - localY;
        kept.push(dx * dx + dy * dy > radiusSq);
    }

    // Collect contiguous segments of kept points
    const segments: { x: number; y: number }[][] = [];
    let current: { x: number; y: number }[] = [];
    for (let i = 0; i < pts.length; i++) {
        if (kept[i]) {
            current.push(pts[i]);
        } else {
            if (current.length >= MIN_SEGMENT_POINTS) {
                segments.push(current);
            }
            current = [];
        }
    }
    if (current.length >= MIN_SEGMENT_POINTS) {
        segments.push(current);
    }

    // If all points kept in one segment, no change needed — return original as-is
    if (segments.length === 1 && segments[0].length === pts.length) {
        return [el];
    }

    // Build new elements from segments
    const batchIds = new Set<string>();
    return segments.map(seg => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of seg) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        }

        // Offset points relative to new bounding box origin
        const newPoints = seg.map(p => ({ x: p.x - minX, y: p.y - minY }));

        return {
            ...JSON.parse(JSON.stringify(el)), // Deep clone all properties
            id: generateId(el.type, batchIds),
            x: el.x + minX,
            y: el.y + minY,
            width: maxX - minX,
            height: maxY - minY,
            points: newPoints,
            pointsEncoding: undefined, // Segments use object points, not flat encoding
        } as DrawingElement;
    });
}

/**
 * Resolve the eraser brush half-width in world units. Driven by the user's
 * eraser-width setting; defaults to the current stroke width when unset.
 */
function getEraserRadius(): number {
    const width = store.eraserWidth ?? store.defaultElementStyles.strokeWidth ?? 4;
    return Math.max(1, (width as number) / 2);
}

/** Core eraser logic shared by onDown and onMove */
function eraseAtPoint(x: number, y: number, helpers: PointerHelpers): void {
    const eraseRadius = getEraserRadius();
    // Detection tolerance: at least a comfortable screen-space grab radius, but
    // expand to the brush radius so a large eraser reaches shapes it overlaps.
    const threshold = Math.max(10 / store.viewState.scale, eraseRadius);
    const elementMap = new Map<string, DrawingElement>();
    for (const el of store.elements) elementMap.set(el.id, el);
    const isPresentation = store.appMode === 'presentation';

    for (let i = store.elements.length - 1; i >= 0; i--) {
        const el = store.elements[i];
        if (!helpers.canInteractWithElement(el)) continue;
        if (!isLayerVisible(el.layerId)) continue;
        if (isPresentation && !el.presentationDrawn) continue;
        if (hitTestElement(helpers.applyMasterProjection(el), x, y, threshold, store.elements, elementMap)) {
            if (FREEHAND_TYPES.includes(el.type) && el.points && el.points.length > 0) {
                // Partial erase: split freehand stroke (brush sized by eraser width)
                const segments = splitFreehandStroke(el, x, y, eraseRadius);
                // If segments contain the original unchanged, skip (eraser didn't hit any points)
                if (segments.length === 1 && segments[0].id === el.id) continue;
                pushToHistory();
                setStore("elements", els => [
                    ...els.filter(e => e.id !== el.id),
                    ...segments
                ]);
            } else if (CONNECTOR_TYPES.includes(el.type)) {
                // Whole-element delete for connectors (partial erase isn't meaningful)
                deleteElements([el.id]);
            } else {
                // Non-destructive partial erase: accumulate an erase-mask stroke
                appendEraseStroke(el, x, y, eraseRadius);
            }
        }
    }
}

export function eraserOnDown(
    x: number,
    y: number,
    pState: PointerState,
    helpers: PointerHelpers
): void {
    pState.isDrawing = true;
    // Start a fresh partial-erase session for this drag (one undo entry, one
    // continuous mask stroke per element touched).
    eraseSession = { historyPushed: false, strokeByElement: new Map() };
    eraseAtPoint(x, y, helpers);
}

export function eraserOnMove(
    x: number,
    y: number,
    helpers: PointerHelpers
): void {
    eraseAtPoint(x, y, helpers);
}

export function eraserOnUp(pState: PointerState): void {
    pState.isDrawing = false;
    eraseSession = null;
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
        endArrowhead: 'arrow',
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
            // Use raw mouse position (not snap point) for fractions so each connector
            // preserves the user's intended position, even when snapped to the same anchor
            const endBindingData = computeAnchorFractions(
                { elementId: binding.elementId, focus: 0, gap: 5, position: binding.position },
                pState.lastRawEndX, pState.lastRawEndY, store.elements
            );
            updateElement(pState.currentId, { endBinding: endBindingData });

            const target = store.elements.find(e => e.id === binding.elementId);
            if (target) {
                const existing = target.boundElements || [];
                if (!existing.find(b => b.id === pState.currentId)) {
                    updateElement(target.id, { boundElements: [...existing, { id: pState.currentId, type: 'arrow' }] });
                }
            }
        }

        // Always compute start binding fractions (stable anchoring regardless of end binding)
        if (el.startBinding) {
            const startFractions = computeAnchorFractions(
                el.startBinding, pState.startX, pState.startY, store.elements
            );
            updateElement(pState.currentId, { startBinding: startFractions });
        }

        // Finalize: refresh bound line to snap endpoints to actual anchor positions
        const updatedEl = store.elements.find(e => e.id === pState.currentId);
        if (updatedEl && updatedEl.startBinding && updatedEl.endBinding) {
            // Refresh the new connector AND every peer sharing either of its nodes —
            // adding a connector changes the port-group size on both sides.
            expandToPortGroups([pState.currentId], store.elements)
                .forEach(id => helpers.refreshBoundLine(id));
        }

        // Auto-initialize center control point (visible by default when selected)
        const finalArrow = store.elements.find(e => e.id === pState.currentId);
        if (finalArrow && !finalArrow.controlPoints && finalArrow.curveType !== 'elbow') {
            const sx = finalArrow.x, sy = finalArrow.y;
            const ex = finalArrow.x + finalArrow.width, ey = finalArrow.y + finalArrow.height;
            updateElement(pState.currentId!, { controlPoints: [{ x: (sx + ex) / 2, y: (sy + ey) / 2 }] });
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
