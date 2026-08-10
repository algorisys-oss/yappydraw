/**
 * Draw Handler
 * Handles shape/line/arrow/bezier/organicBranch creation, live dimension updates,
 * end binding, and normalization on pointer up.
 * Extracted from canvas.tsx handlePointerDown/Move/Up.
 */

import type { DrawingElement } from '../../types';
import type { PointerState } from '../pointer-state';
import type { PointerHelpers, PointerSignals } from '../pointer-helpers';
import { store, addElement, updateElement, deleteElements, setStore, setSelectedTool, finishLiveSymmetry, cancelLiveSymmetry, perspectiveSnapActive, perspectivePlaneActive, setPerspectiveSnapGuide } from '../../store/app-store';
import { snapPoint } from '../snap-helpers';
import { constrainToAngle } from '../angle-constrain';
import { snapPointToPerspective, perspectiveQuad, orderQuadForWarp } from '../perspective-snap';
import { generateId } from '../id-generator';
import { defaultTableData, defaultColWidths, defaultRowHeights } from '../table-utils';
import { getUIShapeDef } from '../../config/ui-shape-defs';
import { hitTestPoolLane, assignToPoolLane } from '../pool-containment';
import { computeAnchorFractions, expandToPortGroups } from '../binding-logic';
import { createStrokeStabilizer, finishStabilizer } from '../stroke-stabilizer';

// Freehand pen tools that support the pulled-string stabilizer. (The ephemeral
// 'ink' presentation tool has its own pointer-down path and is left unchanged.)
const FREEHAND_TOOLS = ['fineliner', 'inkbrush', 'marker'];

// Shapes that default to solid stroke
const SOLID_STROKE_SHAPES = [
    'rectangle', 'circle', 'diamond', 'triangle', 'hexagon', 'octagon',
    'pentagon', 'septagon', 'star', 'cloud', 'heart', 'capsule', 'stickyNote',
    'callout', 'speechBubble', 'database', 'document', 'cylinder',
    'isometricCube', 'solidBlock', 'perspectiveBlock',
    'umlClass', 'umlEnum', 'umlInterface', 'umlActor', 'umlComponent', 'umlState',
    'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlNode', 'umlArtifact',
    'umlObject', 'umlPort', 'umlHistory', 'umlAction',
    'table', 'codeBlock',
    'dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable',
    'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch',
    'card', 'searchBar', 'progressBar', 'avatar', 'navbar',
    'tabBar', 'badge', 'tooltip', 'slider',
    'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent',
    'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway',
    'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity',
    'bpmnDataObject', 'bpmnAnnotation', 'bpmnPool', 'bpmnDataStore', 'bpmnGroup'
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
    'dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable',
    'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch',
    'card', 'searchBar', 'progressBar', 'avatar', 'navbar',
    'tabBar', 'badge', 'tooltip', 'slider',
    'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent',
    'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway',
    'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity',
    'bpmnDataObject', 'bpmnAnnotation', 'bpmnPool', 'bpmnDataStore', 'bpmnGroup'
];

// Tools that stay active after drawing (don't switch to selection)
const CONTINUOUS_TOOLS = [
    'selection', 'pan', 'eraser', 'fineliner', 'inkbrush', 'marker',
    'text', 'richtext', 'ink', 'polyline'
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
    pState.elbowCommittedPoints = [{ x: 0, y: 0 }];
    pState.elbowDirection = null;

    // Arm the pulled-string stabilizer for freehand inking when enabled. Primed
    // at the stroke origin (relative (0,0)) so the leash is measured from where
    // the pen touched down. Off (strength 0) → no stabilizer, behaviour unchanged.
    const stabStrength = store.globalSettings.penStabilization ?? 0;
    pState.stabilizer = (stabStrength > 0 && FREEHAND_TOOLS.includes(store.selectedTool))
        ? createStrokeStabilizer(stabStrength, { x: 0, y: 0, pressure: 0.5 })
        : null;

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
    const actualType = tool === 'bezier' ? 'line' : (tool === 'elbow' ? 'arrow' : tool);
    const actualCurveType = (tool === 'bezier' || tool === 'organicBranch')
        ? 'bezier'
        : (tool === 'elbow' ? 'elbow' : (store.defaultElementStyles.curveType || 'straight'));

    // Check for start binding at creation time (connectors only — not plain lines)
    let startBindingData: { elementId: string; focus: number; gap: number; position?: string } | undefined;
    let snappedStartX = creationX;
    let snappedStartY = creationY;

    if (tool === 'arrow' || tool === 'bezier' || tool === 'elbow' || tool === 'organicBranch') {
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

    // Fill mode (Alchemy-style) is decided HERE, not on release. It used to be stamped on in
    // endDrawing, so the whole stroke was drawn as a line and only snapped to a filled
    // silhouette after you let go — and with symmetry on, every mirrored copy snapped at the
    // same moment, so the mark you were composing was never the mark you got. Setting it up
    // front makes the live stroke render filled from the first move, and the live symmetry
    // copies inherit it for free (they are spread from the source element on every sync).
    if (store.globalSettings.fillShapeMode && FREEHAND_TOOLS.includes(tool)) {
        newElement.fillSilhouette = true;
        newElement.backgroundColor = newElement.strokeColor;
        newElement.fillStyle = 'solid';
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

    // Apply specific defaults for BPMN Pool
    if (actualType === 'bpmnPool') {
        newElement.bpmnLaneCount = 2;
        newElement.bpmnLaneLabels = ['Lane 1', 'Lane 2'];
        newElement.bpmnOrientation = 'horizontal';
        newElement.containerText = 'Pool';
        newElement.fillStyle = 'solid';
        // Canonical (light-mode) colors. Dark/focus presentation is handled by
        // the CSS invert filter on the host canvas — no per-shape variant needed.
        newElement.backgroundColor = '#ffffff';
        newElement.strokeColor = '#000000';
        newElement.textColor = '#000000';
    }

    // Apply specific defaults for UML shapes
    if (actualType === 'umlClass') {
        newElement.containerText = 'ClassName';
        newElement.attributesText = '+ attribute: type';
        newElement.methodsText = '+ method(): void';
    }
    if (actualType === 'umlEnum') {
        newElement.containerText = 'EnumName';
        newElement.attributesText = 'VALUE_1\nVALUE_2\nVALUE_3';
    }
    if (actualType === 'umlInterface') {
        newElement.containerText = 'InterfaceName';
        newElement.methodsText = '+ method(): void';
    }
    if (actualType === 'umlState') {
        newElement.containerText = 'StateName';
        newElement.attributesText = 'entry / action\ndo / activity';
    }
    if (actualType === 'umlLifeline') {
        newElement.containerText = ':Object';
    }
    if (actualType === 'umlComponent') {
        newElement.containerText = 'Component';
    }
    if (actualType === 'umlPackage') {
        newElement.containerText = 'Package';
    }
    if (actualType === 'umlNote') {
        newElement.containerText = 'Note text';
    }
    if (actualType === 'umlActor') {
        newElement.containerText = 'Actor';
    }
    if (actualType === 'umlUseCase') {
        newElement.containerText = 'Use Case';
    }
    if (actualType === 'umlFragment') {
        newElement.containerText = 'alt';
        newElement.attributesText = '[condition]';
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

    // Apply defaults for UI wireframe shapes from config
    const uiDef = getUIShapeDef(actualType);
    if (uiDef) {
        newElement.fillStyle = 'solid';
        newElement.strokeStyle = 'solid';
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
    signals: PointerSignals,
    constrainAngle = false,
    suppressPerspective = false
): void {
    let finalX = x;
    let finalY = y;

    // Fixed-angle constraint (Shift): straight line/arrow tools snap to the nearest
    // 15° increment from the start point, keeping the drag length. Takes precedence
    // over grid snap (which would break the clean angle); connectors that bind below
    // still win. Curved/orthogonal tools (elbow/organicBranch) are left alone.
    const ANGLE_TOOLS = ['line', 'arrow', 'bezier'];
    // Tools whose drag is a single direction, so a perspective ray is meaningful for it.
    // Box shapes and orthogonal elbows are deliberately absent.
    const PERSPECTIVE_TOOLS = ANGLE_TOOLS;
    // Tools whose drag defines a box, so Shift means "keep it square" (see below).
    // NORMALIZABLE_SHAPES is exactly the set that treats width/height as a bounding
    // box, which is the same condition — reused so a new shape gets this for free.
    const ASPECT_TOOLS = NORMALIZABLE_SHAPES;
    const angleConstrained = constrainAngle && ANGLE_TOOLS.includes(store.selectedTool);
    if (angleConstrained) {
        const c = constrainToAngle(pState.startX, pState.startY, x, y, 15);
        finalX = c.x;
        finalY = c.y;
    }

    // Track raw mouse position before snapping (used for precise anchor fractions)
    pState.lastRawEndX = x;
    pState.lastRawEndY = y;

    // Check binding for connector tools only (not plain lines)
    if (store.selectedTool === 'arrow' || store.selectedTool === 'bezier' || store.selectedTool === 'elbow' || store.selectedTool === 'organicBranch' || pState.draggingFromConnector) {
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

    // Perspective soft-snap: bias the segment toward the nearest vanishing-point ray (or a
    // free vertical/horizontal, depending on the grid's mode). Sits between the two harder
    // constraints — a binding or a Shift-held angle both win outright — and beats grid snap,
    // which would otherwise pull the endpoint straight back off the ray. Alt suppresses it.
    let perspectiveSnapped = false;
    const pGrid = (!angleConstrained && !signals.suggestedBinding() && !suppressPerspective
        && PERSPECTIVE_TOOLS.includes(store.selectedTool)) ? perspectiveSnapActive() : null;
    if (pGrid) {
        const s = snapPointToPerspective(pGrid, pState.startX, pState.startY, finalX, finalY);
        setPerspectiveSnapGuide(s.guide);
        if (s.guide) { finalX = s.x; finalY = s.y; perspectiveSnapped = true; }
    } else {
        setPerspectiveSnapGuide(null);
    }

    if (!angleConstrained && !signals.suggestedBinding() && !perspectiveSnapped && store.gridSettings.snapToGrid) {
        const snapped = snapPoint(x, y, store.gridSettings.gridSize);
        finalX = snapped.x;
        finalY = snapped.y;
    }

    let dx = finalX - pState.startX;
    let dy = finalY - pState.startY;

    // Aspect constraint (Shift): a shape tool draws a SQUARE / perfect circle rather
    // than a free rectangle — the sibling of the 15° angle snap above, and what the
    // status bar's "Shift · Constrain" hint has been promising for shape tools all
    // along. Takes the larger drag axis so the shape follows the cursor's intent, and
    // keeps each axis's sign so it still draws in any of the four directions.
    if (constrainAngle && !angleConstrained && ASPECT_TOOLS.includes(store.selectedTool)) {
        const side = Math.max(Math.abs(dx), Math.abs(dy));
        dx = Math.sign(dx || 1) * side;
        dy = Math.sign(dy || 1) * side;
        finalX = pState.startX + dx;
        finalY = pState.startY + dy;
    }

    // Drawing ON a plane: the drag gives two opposite corners and the plane's edge families
    // determine the other two, so the shape genuinely lies on the floor/wall instead of being
    // an upright box the artist has to foreshorten afterwards. The quad is written as a
    // 4-corner envelope (marked projective, so the interior maps in perspective too) — the
    // existing warp render/hit-test/export path draws it with no changes.
    const onPlane = !suppressPerspective && ASPECT_TOOLS.includes(store.selectedTool)
        ? perspectivePlaneActive() : null;
    if (onPlane && pState.currentId) {
        const quad = perspectiveQuad(onPlane, onPlane.drawPlane, { x: pState.startX, y: pState.startY }, { x: finalX, y: finalY });
        if (quad) {
            const ord = orderQuadForWarp(quad);
            const xs = ord.map(p => p.x), ys = ord.map(p => p.y);
            const minX = Math.min(...xs), minY = Math.min(...ys);
            const w = Math.max(1, Math.max(...xs) - minX), h = Math.max(1, Math.max(...ys) - minY);
            const cx = minX + w / 2, cy = minY + h / 2;
            updateElement(pState.currentId, {
                x: minX, y: minY, width: w, height: h,
                warp: { corners: ord.map(p => ({ x: p.x - cx, y: p.y - cy })), projective: true },
            } as Partial<DrawingElement>);
            return;
        }
        // Degenerate drag (along the horizon, or no area yet): fall back to a plain box, and
        // drop any cage an earlier frame of this same drag had already written.
        updateElement(pState.currentId, { x: pState.startX, y: pState.startY, width: dx, height: dy, warp: undefined } as Partial<DrawingElement>);
        return;
    }

    const updates: Partial<DrawingElement> = {
        width: dx,
        height: dy
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

    // For elbow, build a clean L-shaped orthogonal path (single bend)
    if (store.selectedTool === 'elbow') {
        const DIRECTION_THRESHOLD = 20;
        const relX = finalX - pState.startX;
        const relY = finalY - pState.startY;

        // Determine initial direction after sufficient movement
        if (pState.elbowDirection === null) {
            if (Math.abs(relX) > DIRECTION_THRESHOLD || Math.abs(relY) > DIRECTION_THRESHOLD) {
                pState.elbowDirection = Math.abs(relX) >= Math.abs(relY) ? 'h' : 'v';
            }
        }

        // Build clean L-shaped path: origin → corner → endpoint (exactly 1 bend)
        const pts: { x: number; y: number }[] = [{ x: 0, y: 0 }];

        if (pState.elbowDirection === 'h') {
            // Horizontal first, then vertical
            pts.push({ x: relX, y: 0 });
            pts.push({ x: relX, y: relY });
        } else if (pState.elbowDirection === 'v') {
            // Vertical first, then horizontal
            pts.push({ x: 0, y: relY });
            pts.push({ x: relX, y: relY });
        } else {
            // No direction yet — just show endpoint
            pts.push({ x: relX, y: relY });
        }

        updates.points = pts as any;
    }

    if (pState.currentId) updateElement(pState.currentId, updates);
}

// ─── Pointer Up: Finalize drawing ───────────────────────────────────

export function drawOnUp(
    pState: PointerState,
    helpers: PointerHelpers,
    signals: PointerSignals
): void {
    setPerspectiveSnapGuide(null); // live-drag artifact — gone the moment the drag ends
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
                updateElement(target.id, { boundElements: [...existing, { id: pState.currentId, type: el.type as any }] });
            }
            signals.setSuggestedBinding(null);
        }

        // Always compute start binding fractions (stable anchoring regardless of end binding)
        if (el.startBinding && (el.type === 'arrow' || el.type === 'organicBranch' || (el.type === 'line' && el.curveType === 'bezier'))) {
            const startFractions = computeAnchorFractions(
                el.startBinding, pState.startX, pState.startY, store.elements
            );
            updateElement(pState.currentId, { startBinding: startFractions });
        }

        // Finalize routing & re-spread siblings
        if (pState.currentId) {
            const updatedEl = store.elements.find(e => e.id === pState.currentId);
            if (updatedEl && updatedEl.startBinding && updatedEl.endBinding) {
                // Refresh the new connector AND every peer sharing either of its nodes.
                // Adding a connector changes the port-group size on both sides, so all
                // peers must re-lay-out. (The old same-shape-pair filter was correct for
                // the pair-local spread this replaced, but misses hub fan-in peers.)
                expandToPortGroups([pState.currentId], store.elements)
                    .forEach(id => helpers.refreshBoundLine(id));
            } else if (updatedEl && el.curveType === 'elbow') {
                const pts = helpers.refreshLinePoints(updatedEl);
                if (pts) {
                    updateElement(pState.currentId, { points: pts });
                }
            }
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
            // Draw the stabilizer's string out to the final cursor, then flush
            // buffered pen points and normalize.
            finishStabilizer(pState, store.globalSettings.penPressure !== false);
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

        // Auto-initialize a center control point for line/arrow (not elbow)
        // so control points are visible by default when selected
        if ((el.type === 'line' || el.type === 'arrow') && el.curveType !== 'elbow') {
            const finalEl = store.elements.find(e => e.id === pState.currentId);
            if (finalEl && !finalEl.controlPoints) {
                const startX = finalEl.x;
                const startY = finalEl.y;
                const endX = finalEl.x + finalEl.width;
                const endY = finalEl.y + finalEl.height;
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;

                if (finalEl.curveType === 'bezier') {
                    // For bezier tool: offset CP from midpoint for visible curve
                    const dx = endX - startX;
                    const dy = endY - startY;
                    const offsetX = Math.abs(dx) > Math.abs(dy) ? 0 : dy * 0.3;
                    const offsetY = Math.abs(dx) > Math.abs(dy) ? -dx * 0.3 : 0;
                    updateElement(pState.currentId!, { controlPoints: [{ x: midX + offsetX, y: midY + offsetY }] });
                } else {
                    // For straight line/arrow: CP at midpoint (visually straight)
                    updateElement(pState.currentId!, { controlPoints: [{ x: midX, y: midY }] });
                }
            }
        }

        // Discard shapes created by click without drag (too small)
        // Excludes pen tools (fineliner/inkbrush/marker/ink), line/arrow, organicBranch, and text
        const CLICK_EXEMPT = ['fineliner', 'inkbrush', 'marker', 'ink', 'line', 'arrow', 'organicBranch', 'text', 'richtext'];
        if (!CLICK_EXEMPT.includes(el.type)) {
            const MIN_DRAG = 5;
            const currentEl = store.elements.find(e => e.id === pState.currentId);
            if (currentEl && Math.abs(currentEl.width) < MIN_DRAG && Math.abs(currentEl.height) < MIN_DRAG) {
                // UI shapes get default dimensions instead of being deleted
                if (!getUIShapeDef(el.type)) {
                    cancelLiveSymmetry(); // discard the mirror copies too
                    deleteElements([pState.currentId]);
                    pState.currentId = null;
                    helpers.draw();
                    return;
                }
            }
        }

        // Discard zero-extent line/arrow/pen strokes from a stray single click or tap.
        // These tools are CLICK_EXEMPT above (so real short/multi-point strokes survive),
        // but a click-without-drag leaves a 0×0 element that renders nothing yet lingers as
        // an invisible "ghost": it inflates the element count and survives reload — reported
        // as "fine-1 / arrw-1 hidden". Bound connectors (a deliberately short arrow snapped
        // between adjacent shapes) and anything with real extent are kept.
        const GHOST_PRONE = ['line', 'arrow', 'fineliner', 'inkbrush', 'marker', 'ink'];
        if (GHOST_PRONE.includes(el.type)) {
            const GHOST_MIN = 3;
            const ghost = store.elements.find(e => e.id === pState.currentId);
            const isBound = !!(ghost && (ghost.startBinding || ghost.endBinding));
            if (ghost && !isBound && Math.abs(ghost.width) < GHOST_MIN && Math.abs(ghost.height) < GHOST_MIN) {
                cancelLiveSymmetry(); // discard the mirror copies too
                deleteElements([pState.currentId]);
                pState.currentId = null;
                helpers.draw();
                return;
            }
        }

        // Apply minimum dimensions for UI shapes (click-to-create)
        const uiShapeDef = getUIShapeDef(el.type);
        if (uiShapeDef) {
            const currentEl = store.elements.find(e => e.id === pState.currentId);
            if (currentEl && Math.abs(currentEl.width) < 20 && Math.abs(currentEl.height) < 20) {
                updateElement(pState.currentId!, {
                    width: uiShapeDef.defaultWidth,
                    height: uiShapeDef.defaultHeight,
                });
            }
        }

        // Auto-assign to pool lane if drawn inside one (skip pools themselves)
        if (el.type !== 'bpmnPool') {
            const finalEl = store.elements.find(e => e.id === pState.currentId);
            if (finalEl) {
                const cx = finalEl.x + finalEl.width / 2;
                const cy = finalEl.y + finalEl.height / 2;
                for (const pool of store.elements) {
                    if (pool.type !== 'bpmnPool') continue;
                    const lane = hitTestPoolLane(pool, cx, cy, true);
                    if (lane >= 0) {
                        assignToPoolLane(finalEl.id, pool.id, lane);
                        break;
                    }
                }
            }
        }

        // Fill mode is now set up in startDrawing so it previews live; this stays as a
        // fallback for freehand elements that reach here without going through that path,
        // and to re-derive the fill from the FINAL stroke colour if it changed mid-stroke.
        if (store.globalSettings.fillShapeMode
            && ['fineliner', 'inkbrush', 'marker'].includes(el.type)) {
            const filled = store.elements.find(e => e.id === pState.currentId);
            if (filled) updateElement(pState.currentId!, {
                fillSilhouette: true,
                backgroundColor: filled.strokeColor,
                fillStyle: 'solid',
            });
        }

        // Live symmetry — final sync of the mirrored copies against the normalized
        // element, then stop tracking. Placed after every discard branch above so
        // stray clicks and ghosts are never replicated.
        finishLiveSymmetry(pState.currentId!);

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
