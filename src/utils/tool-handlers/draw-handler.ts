/**
 * Draw Handler
 * Handles shape/line/arrow/bezier/organicBranch creation, live dimension updates,
 * end binding, and normalization on pointer up.
 * Extracted from canvas.tsx handlePointerDown/Move/Up.
 */

import type { DrawingElement } from '../../types';
import type { PointerState } from '../pointer-state';
import type { PointerHelpers, PointerSignals } from '../pointer-helpers';
import { store, addElement, updateElement, setStore, setSelectedTool } from '../../store/app-store';
import { snapPoint } from '../snap-helpers';
import { generateId } from '../id-generator';
import { defaultTableData, defaultColWidths, defaultRowHeights } from '../table-utils';

// Shapes that default to solid stroke
const SOLID_STROKE_SHAPES = [
    'rectangle', 'circle', 'diamond', 'triangle', 'hexagon', 'octagon',
    'pentagon', 'septagon', 'star', 'cloud', 'heart', 'capsule', 'stickyNote',
    'callout', 'speechBubble', 'database', 'document', 'cylinder',
    'isometricCube', 'solidBlock', 'perspectiveBlock',
    'umlClass', 'umlInterface', 'umlActor', 'umlComponent', 'umlState',
    'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive',
    'table', 'codeBlock',
    'dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable'
];

// Shapes that need negative-dimension normalization on finish
const NORMALIZABLE_SHAPES = [
    'rectangle', 'circle', 'diamond', 'triangle', 'hexagon', 'octagon',
    'parallelogram', 'star', 'cloud', 'heart', 'capsule', 'stickyNote',
    'callout', 'burst', 'speechBubble', 'ribbon', 'bracketLeft', 'bracketRight',
    'database', 'document', 'predefinedProcess', 'internalStorage',
    'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda',
    'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon',
    'browserWindow', 'mobilePhone', 'ghostButton', 'inputField',
    'table',
    // 3D shapes need normalization too
    'isometricCube', 'solidBlock', 'perspectiveBlock', 'openBox',
    'codeBlock',
    'dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable'
];

// Tools that stay active after drawing (don't switch to selection)
const CONTINUOUS_TOOLS = [
    'selection', 'pan', 'eraser', 'fineliner', 'inkbrush', 'marker',
    'text', 'ink', 'polyline'
];

// ─── Pointer Down: Create element ───────────────────────────────────

export function drawOnDown(
    x: number,
    y: number,
    pState: PointerState,
    helpers: PointerHelpers
): void {
    pState.isDrawing = true;
    pState.penPointsBuffer = [];
    pState.lastPenUpdateTime = 0;

    // Snap start position if enabled
    let creationX = x;
    let creationY = y;
    if (store.gridSettings.snapToGrid) {
        const snapped = snapPoint(x, y, store.gridSettings.gridSize);
        creationX = snapped.x;
        creationY = snapped.y;
    }

    pState.startX = creationX;
    pState.startY = creationY;
    pState.currentId = generateId(store.selectedTool);

    const tool = store.selectedTool;
    const actualType = tool === 'bezier' ? 'line' : tool;
    const actualCurveType = (tool === 'bezier' || tool === 'organicBranch')
        ? 'bezier'
        : (store.defaultElementStyles.curveType || 'straight');

    // Check for start binding at creation time (connectors only — not plain lines)
    let startBindingData: { elementId: string; focus: number; gap: number; position?: string } | undefined;
    let snappedStartX = creationX;
    let snappedStartY = creationY;

    if (tool === 'arrow' || tool === 'bezier' || tool === 'organicBranch') {
        const match = helpers.checkBinding(creationX, creationY, pState.currentId);
        if (match) {
            startBindingData = {
                elementId: match.element.id,
                focus: 0,
                gap: 5,
                position: match.position
            };
            snappedStartX = match.snapPoint.x;
            snappedStartY = match.snapPoint.y;
            pState.startX = snappedStartX;
            pState.startY = snappedStartY;
        }
    }

    const newElement = {
        ...store.defaultElementStyles,
        id: pState.currentId,
        type: actualType,
        x: snappedStartX,
        y: snappedStartY,
        width: 0,
        height: 0,
        seed: Math.floor(Math.random() * 2 ** 31) + 1,
        layerId: store.activeLayerId,
        curveType: actualCurveType as 'straight' | 'bezier' | 'elbow',
        points: (tool === 'fineliner' || tool === 'inkbrush' || tool === 'marker') ? [0, 0] : undefined,
        pointsEncoding: (tool === 'fineliner' || tool === 'inkbrush' || tool === 'marker') ? 'flat' : undefined,
        startBinding: startBindingData,
        strokeStyle: SOLID_STROKE_SHAPES.includes(actualType)
            ? 'solid'
            : store.defaultElementStyles.strokeStyle,
    } as DrawingElement;

    // Mark freehand strokes as presentation-drawn when in presentation mode
    if (store.appMode === 'presentation' && (tool === 'fineliner' || tool === 'inkbrush' || tool === 'marker')) {
        newElement.presentationDrawn = true;
    }

    // Apply specific defaults for Sticky Note
    if (actualType === 'stickyNote') {
        newElement.backgroundColor = '#fef08a';
        newElement.fillStyle = 'solid';
        newElement.strokeColor = '#000000';
    }

    // Apply specific defaults for Table
    if (actualType === 'table') {
        const tableRows = 3;
        const tableCols = 3;
        const hasHeader = true;
        const totalVisualRows = hasHeader ? tableRows + 1 : tableRows;
        // tableData row 0 = header labels, rows 1..N = body data
        const headerRow = Array.from({ length: tableCols }, (_, i) => `Col ${i + 1}`);
        const bodyData = defaultTableData(tableRows, tableCols);
        newElement.tableRows = tableRows;
        newElement.tableCols = tableCols;
        newElement.tableHeaders = hasHeader;
        newElement.tableData = [headerRow, ...bodyData];
        newElement.tableColWidths = defaultColWidths(tableCols);
        newElement.tableRowHeights = defaultRowHeights(totalVisualRows);
        newElement.tableHeaderColor = '#e2e8f0';
        newElement.tableHeaderTextColor = '';
        newElement.tableRowColor = '';
        newElement.tableAltRowColor = '';
        newElement.tableSortCol = -1;
        newElement.tableSortDir = 'asc';
    }

    // Apply specific defaults for Code Block
    if (actualType === 'codeBlock') {
        newElement.backgroundColor = '#1e293b';
        newElement.fillStyle = 'solid';
        newElement.strokeColor = '#334155';
        newElement.textColor = '#e2e8f0';
        newElement.fontFamily = 'code';
        newElement.fontSize = 14;
        newElement.textAlign = 'left';
        newElement.codeShowLineNumbers = true;
        newElement.codeStartLineNumber = 1;
        newElement.borderRadius = 4;
    }

    // Apply specific defaults for Data Structure shapes
    const DS_TYPES = ['dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable'];
    if (DS_TYPES.includes(actualType)) {
        newElement.backgroundColor = '#f8fafc';
        newElement.fillStyle = 'solid';
        newElement.strokeColor = '#334155';
        newElement.textColor = '#1e293b';
        newElement.fontFamily = 'code';
        newElement.fontSize = 14;
        newElement.borderRadius = 4;
        if (actualType === 'dsArray') {
            newElement.text = '1, 2, 3, 4, 5';
            newElement.dsShowIndices = true;
            newElement.dsDirection = 'horizontal';
        } else if (actualType === 'dsStack') {
            newElement.text = 'A, B, C';
            newElement.dsDirection = 'vertical';
        } else if (actualType === 'dsQueue') {
            newElement.text = 'first, second, third';
            newElement.dsDirection = 'horizontal';
        } else if (actualType === 'dsLinkedList') {
            newElement.text = 'A, B, C, D';
            newElement.dsDirection = 'horizontal';
        } else if (actualType === 'dsBinaryTree') {
            newElement.text = '50, 30, 70, 20, 40, _, 80';
        } else if (actualType === 'dsHashTable') {
            newElement.text = 'name:Alice, age:30, id:42';
            newElement.dsShowIndices = true;
            newElement.dsCapacity = 5;
        }
    }

    addElement(newElement);

    // Update target's boundElements if we have a start binding
    if (startBindingData) {
        const target = store.elements.find(e => e.id === startBindingData!.elementId);
        if (target) {
            const existing = target.boundElements || [];
            updateElement(target.id, { boundElements: [...existing, { id: pState.currentId, type: actualType as 'arrow' }] });
        }
    }
}

// ─── Pointer Move: Live dimension/binding updates ───────────────────

export function drawOnMove(
    x: number,
    y: number,
    pState: PointerState,
    helpers: PointerHelpers,
    signals: PointerSignals
): void {
    let finalX = x;
    let finalY = y;

    // Check binding for connector tools only (not plain lines)
    if (store.selectedTool === 'arrow' || store.selectedTool === 'bezier' || store.selectedTool === 'organicBranch' || pState.draggingFromConnector) {
        if (pState.currentId) {
            const match = helpers.checkBinding(x, y, pState.currentId);
            if (match) {
                signals.setSuggestedBinding({ elementId: match.element.id, px: match.snapPoint.x, py: match.snapPoint.y, position: match.position });
                finalX = match.snapPoint.x;
                finalY = match.snapPoint.y;
            } else {
                signals.setSuggestedBinding(null);
            }
        }
    } else {
        signals.setSuggestedBinding(null);
    }

    if (!signals.suggestedBinding() && store.gridSettings.snapToGrid) {
        const snapped = snapPoint(x, y, store.gridSettings.gridSize);
        finalX = snapped.x;
        finalY = snapped.y;
    }

    const updates: Partial<DrawingElement> = {
        width: finalX - pState.startX,
        height: finalY - pState.startY
    };

    // For organicBranch, provide temporary points and controlPoints for live preview
    if (store.selectedTool === 'organicBranch') {
        const w = finalX - pState.startX;
        const h = finalY - pState.startY;
        updates.points = [0, 0, w, h];
        const cp1 = { x: pState.startX + w * 0.5, y: pState.startY };
        const cp2 = { x: finalX - w * 0.5, y: finalY };
        updates.controlPoints = [cp1, cp2];
    }

    if (pState.currentId) updateElement(pState.currentId, updates);
}

// ─── Pointer Up: Finalize drawing ───────────────────────────────────

export function drawOnUp(
    pState: PointerState,
    helpers: PointerHelpers,
    signals: PointerSignals
): void {
    if (!pState.isDrawing || !pState.currentId) {
        pState.isDrawing = false;
        pState.currentId = null;
        pState.draggingFromConnector = null;
        return;
    }

    const el = store.elements.find(e => e.id === pState.currentId);
    if (el) {
        // Binding for connectors (arrows/bezier/organicBranch) — not plain lines
        if ((el.type === 'arrow' || el.type === 'organicBranch' || (el.type === 'line' && el.curveType === 'bezier')) && signals.suggestedBinding()) {
            const binding = signals.suggestedBinding()!;
            const bindingData = {
                elementId: binding.elementId,
                focus: 0,
                gap: 5,
                position: binding.position
            };
            updateElement(pState.currentId, { endBinding: bindingData });

            const target = store.elements.find(e => e.id === binding.elementId);
            if (target) {
                const existing = target.boundElements || [];
                updateElement(target.id, { boundElements: [...existing, { id: pState.currentId, type: el.type as any }] });
            }
            signals.setSuggestedBinding(null);
        }

        // Normalize negative dimensions for geometric shapes
        if (NORMALIZABLE_SHAPES.includes(el.type)) {
            if (el.width < 0) {
                updateElement(pState.currentId, { x: el.x + el.width, width: Math.abs(el.width) });
            }
            if (el.height < 0) {
                updateElement(pState.currentId, { y: el.y + el.height, height: Math.abs(el.height) });
            }
        } else if (el.type === 'fineliner' || el.type === 'inkbrush' || el.type === 'marker' || el.type === 'ink') {
            // Flush buffered pen points and normalize
            helpers.flushPenPoints();
            const updatedEl = store.elements.find(e => e.id === pState.currentId);
            if (updatedEl && updatedEl.points && updatedEl.points.length > 2) {
                const updates = helpers.normalizePencil({ ...updatedEl, points: updatedEl.points });
                if (updates) {
                    updateElement(pState.currentId, updates);
                }
            }
        } else if (el.type === 'organicBranch') {
            normalizeOrganicBranch(pState.currentId, el);
        }

        // Switch back to selection tool after drawing (except for continuous tools or locked tools)
        if (!CONTINUOUS_TOOLS.includes(store.selectedTool) && !store.toolLocked) {
            setSelectedTool('selection');
            // Auto-select the newly drawn element so property panel shows immediately
            setStore('selection', [pState.currentId]);
        }

        // If drawn from a connector handle, select the new arrow
        if (pState.draggingFromConnector) {
            setStore('selection', [pState.currentId]);
            setSelectedTool('selection');
        }
    }

    pState.isDrawing = false;
    pState.currentId = null;
    pState.draggingFromConnector = null;
}

// ─── OrganicBranch normalization ─────────────────────────────────────

function normalizeOrganicBranch(currentId: string, el: DrawingElement): void {
    const normalizedX = Math.min(el.x, el.x + el.width);
    const normalizedY = Math.min(el.y, el.y + el.height);
    const normalizedW = Math.abs(el.width);
    const normalizedH = Math.abs(el.height);

    // Original Start/End relative to Normalized TL
    const relStartX = el.x - normalizedX;
    const relStartY = el.y - normalizedY;
    const relEndX = (el.x + el.width) - normalizedX;
    const relEndY = (el.y + el.height) - normalizedY;

    // S-Curve control points
    const dx = relEndX - relStartX;
    const cp1 = { x: normalizedX + relStartX + dx * 0.5, y: normalizedY + relStartY };
    const cp2 = { x: normalizedX + relEndX - dx * 0.5, y: normalizedY + relEndY };

    updateElement(currentId, {
        x: normalizedX,
        y: normalizedY,
        width: normalizedW,
        height: normalizedH,
        points: [relStartX, relStartY, relEndX, relEndY],
        controlPoints: [cp1, cp2]
    });
}
