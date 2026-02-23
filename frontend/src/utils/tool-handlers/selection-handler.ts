/**
 * Selection Handler
 * Handles selection tool logic: hit testing, group selection, move, resize,
 * rotate, control point dragging, snapping, and selection box.
 * Extracted from canvas.tsx handlePointerDown/Move/Up.
 */

import { batch } from 'solid-js';
import type { DrawingElement } from '../../types';
import type { PointerState } from '../pointer-state';
import type { PointerHelpers, PointerSignals } from '../pointer-helpers';
import { store, updateElement, setStore, pushToHistory, isLayerVisible, toggleCollapse, setShowCanvasProperties } from '../../store/app-store';
import { hitTestElement } from '../hit-testing';
import { getHandleAtPosition, getSelectionBoundingBox } from '../handle-detection';
import { getDescendants } from '../hierarchy';
import { snapPoint } from '../snap-helpers';
import { confirmAndReparent } from '../reparent';
import { isPointInPolygon } from '../geometry';
import { getSnappingGuides } from '../object-snapping';
import { getSpacingGuides } from '../spacing';
import { calculateAllAnimatedStates } from '../animation-utils';
import { getGroupsSortedByPriority, isPointInGroupBounds } from '../group-utils';
import { normalizePoints } from '../render-element';
import { connectorHandleOnDown } from './minor-handlers';
import { computeCellRects, defaultColWidths, defaultRowHeights, defaultTableData, hitTestColEdge, hitTestRowEdge, hitTestTableCell, sortTableData, reorderColumns } from '../table-utils';
import { measureWrappedTextHeight } from '../text-utils';
import { hitTestPoolLane, assignToPoolLane, unassignFromPool } from '../pool-containment';
import { calculateUmlClassLayout, calculateUml2SectionLayout } from '../uml-layout-utils';
import { CanvasRenderer } from '../../rendering/CanvasRenderer';

// 2-section UML shape types that share scroll/divider logic
const TWO_SECTION_UML = new Set(['umlInterface', 'umlEnum', 'umlState']);

// Lazy measurement renderer for UML layout calculation
let _measureCanvas: HTMLCanvasElement | null = null;
function getMeasureRenderer(): CanvasRenderer | null {
    if (!_measureCanvas) {
        _measureCanvas = document.createElement('canvas');
    }
    const ctx = _measureCanvas.getContext('2d');
    return ctx ? new CanvasRenderer(ctx) : null;
}

// ─── Helper: Capture initial positions for move/resize ──────────────

function captureInitialPositions(
    pState: PointerState,
    idsToCapture: Set<string>
): void {
    pState.initialPositions.clear();
    store.elements.forEach(el => {
        if (idsToCapture.has(el.id)) {
            pState.initialPositions.set(el.id, {
                x: el.x,
                y: el.y,
                width: el.width,
                height: el.height,
                fontSize: el.fontSize,
                points: el.points ? [...el.points] : undefined,
                controlPoints: el.controlPoints ? el.controlPoints.map(cp => ({ ...cp })) : undefined
            });
        }
    });
}

function initMoveState(
    pState: PointerState,
    x: number,
    y: number
): void {
    pushToHistory();
    pState.isDragging = true;
    pState.draggingHandle = null;
    pState.startX = x;
    pState.startY = y;

    pState.initialPositions.clear();
    const idsToMove = new Set<string>(store.selection);

    // Include descendants in the move set
    store.selection.forEach(id => {
        getDescendants(id, store.elements).forEach(d => idsToMove.add(d.id));
    });

    // Include pool-contained elements when moving a pool
    store.selection.forEach(id => {
        const el = store.elements.find(e => e.id === id);
        if (el?.type === 'bpmnPool') {
            store.elements.forEach(child => {
                if (child.poolContainerId === id) idsToMove.add(child.id);
            });
        }
    });

    captureInitialPositions(pState, idsToMove);
}

// ─── Pointer Down: Selection ────────────────────────────────────────

export function selectionOnDown(
    e: PointerEvent,
    x: number,
    y: number,
    pState: PointerState,
    helpers: PointerHelpers,
    signals: PointerSignals
): void {
    const hitHandle = getHandleAtPosition(x, y, store.elements, store.selection, store.viewState.scale);
    if (hitHandle) {
        // Mindmap toggle logic
        if (hitHandle.handle === 'mindmap-toggle') {
            toggleCollapse(hitHandle.id);
            return;
        }

        // Check if it's a connector handle
        if (hitHandle.handle.startsWith('connector-')) {
            pushToHistory();
            connectorHandleOnDown(hitHandle, pState);
            return;
        }

        // Table move handle — enter move mode (not resize)
        if (hitHandle.handle === 'table-move') {
            initMoveState(pState, x, y);
            return;
        }

        pushToHistory();
        pState.isDragging = true;
        pState.draggingHandle = hitHandle.handle;
        pState.startX = x;
        pState.startY = y;

        if (hitHandle.id === 'multi') {
            const box = getSelectionBoundingBox(store.elements, store.selection);
            if (box) {
                pState.initialElementX = box.x;
                pState.initialElementY = box.y;
                pState.initialElementWidth = box.width;
                pState.initialElementHeight = box.height;

                pState.initialPositions.clear();
                const toCapture = new Set(store.selection);

                // Add descendants to capture list
                store.selection.forEach(selId => {
                    getDescendants(selId, store.elements).forEach(d => toCapture.add(d.id));
                });

                // Add pool-contained elements
                store.selection.forEach(selId => {
                    const sel = store.elements.find(e => e.id === selId);
                    if (sel?.type === 'bpmnPool') {
                        store.elements.forEach(child => {
                            if (child.poolContainerId === selId) toCapture.add(child.id);
                        });
                    }
                });

                store.elements.forEach(el => {
                    if (toCapture.has(el.id)) {
                        pState.initialPositions.set(el.id, {
                            x: el.x,
                            y: el.y,
                            width: el.width,
                            height: el.height,
                            fontSize: el.fontSize,
                            points: el.points ? [...el.points] : undefined
                        });
                    }
                });
            }
        } else {
            const el = store.elements.find(e => e.id === hitHandle.id);
            if (el) {
                pState.initialElementX = el.x;
                pState.initialElementY = el.y;
                pState.initialElementWidth = el.width;
                pState.initialElementHeight = el.height;
                pState.initialElementFontSize = el.fontSize || 28;

                // Capture initial position for the single element to support point scaling
                pState.initialPositions.clear();
                pState.initialPositions.set(el.id, {
                    x: el.x,
                    y: el.y,
                    width: el.width,
                    height: el.height,
                    fontSize: el.fontSize,
                    points: el.points ? [...el.points] : undefined
                });

                // Also capture contained children so pool resize can reposition them
                if (el.type === 'bpmnPool') {
                    store.elements.forEach(child => {
                        if (child.poolContainerId === el.id) {
                            pState.initialPositions.set(child.id, {
                                x: child.x,
                                y: child.y,
                                width: child.width,
                                height: child.height,
                                fontSize: child.fontSize,
                            });
                        }
                    });
                }
            }
        }
        return;
    }

    // Table column/row resize and header sort detection (on already-selected table)
    if (store.selection.length === 1) {
        const selEl = store.elements.find(e => e.id === store.selection[0]);
        if (selEl && selEl.type === 'table') {
            const cols = selEl.tableCols ?? 3;
            const rows = selEl.tableRows ?? 3;
            const hasHeader = selEl.tableHeaders !== false;
            const totalVisualRows = hasHeader ? rows + 1 : rows;
            const colWidths = selEl.tableColWidths ?? defaultColWidths(cols);
            const rowHeights = selEl.tableRowHeights ?? defaultRowHeights(totalVisualRows);
            const cellRects = computeCellRects(selEl.x, selEl.y, selEl.width, selEl.height, colWidths, rowHeights, selEl.tableColOrder, hasHeader);
            const edgeThreshold = 6 / store.viewState.scale;

            // Check column edge
            const colEdge = hitTestColEdge(x, y, cellRects, edgeThreshold);
            if (colEdge) {
                pushToHistory();
                pState.tableResizeCol = colEdge.colIndex;
                pState.tableResizeRow = -1;
                pState.tableResizeElementId = selEl.id;
                pState.tableResizeStartX = x;
                pState.tableResizeInitialWidths = [...colWidths];
                pState.tableResizeInitialHeights = null;
                pState.isDragging = true;
                return;
            }

            // Check row edge
            const rowEdge = hitTestRowEdge(x, y, cellRects, edgeThreshold);
            if (rowEdge) {
                pushToHistory();
                pState.tableResizeRow = rowEdge.rowIndex;
                pState.tableResizeCol = -1;
                pState.tableResizeElementId = selEl.id;
                pState.tableResizeStartY = y;
                pState.tableResizeInitialHeights = [...rowHeights];
                pState.tableResizeInitialWidths = null;
                pState.isDragging = true;
                return;
            }

            // Check header cell for sort or column reorder drag
            if (hasHeader) {
                const hitCell = hitTestTableCell(x, y, cellRects);
                if (hitCell && hitCell.row === 0 && !e.shiftKey && e.button !== 2) {
                    // Start potential column drag — will decide sort vs drag on up/move
                    pState.tableDragCol = hitCell.dataCol;
                    pState.tableDragElementId = selEl.id;
                    pState.tableResizeElementId = selEl.id;
                    pState.startX = x;
                    pState.startY = y;
                    pState.isDragging = true;
                    return;
                }
            }

            // Cell selection for merge operations (Shift+click or drag start)
            const hitCell = hitTestTableCell(x, y, cellRects);
            if (hitCell) {
                if (e.shiftKey && pState.tableCellSelection) {
                    // Shift+click on header cell: extend as full-column selection
                    if (hasHeader && hitCell.row === 0) {
                        pState.tableCellSelection = {
                            startRow: 0,
                            startCol: pState.tableCellSelection.startCol,
                            endRow: totalVisualRows - 1,
                            endCol: hitCell.col
                        };
                        pState.tableCellSelectionDragging = false;
                        helpers.setTableCellSelection({ ...pState.tableCellSelection });
                        return;
                    }
                    // Extend existing selection with Shift+click on body cell
                    pState.tableCellSelection = {
                        ...pState.tableCellSelection,
                        endRow: hitCell.row,
                        endCol: hitCell.col
                    };
                    pState.tableCellSelectionDragging = false;
                    helpers.setTableCellSelection({ ...pState.tableCellSelection });
                    return;
                } else if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    // Start new selection with modifier key
                    pState.tableCellSelection = {
                        startRow: hitCell.row,
                        startCol: hitCell.col,
                        endRow: hitCell.row,
                        endCol: hitCell.col
                    };
                    pState.tableCellSelectionElementId = selEl.id;
                    pState.tableCellSelectionDragging = true;
                    pState.isDragging = true;
                    helpers.setTableCellSelection({ ...pState.tableCellSelection });
                    return;
                } else if (e.button !== 2) {
                    // Record intent — defer cell selection to mouseUp so that
                    // click-without-drag selects cell, but click+drag moves the table.
                    pState.pendingCellClick = { row: hitCell.row, col: hitCell.col, elementId: selEl.id };
                    // Don't return — fall through to normal drag/selection flow
                }
            }
        }
    }

    // BPMN Pool divider resize detection (on already-selected pool)
    if (store.selection.length === 1) {
        const selEl = store.elements.find(e => e.id === store.selection[0]);
        if (selEl && selEl.type === 'bpmnPool') {
            const laneCount = selEl.bpmnLaneCount ?? 1;
            const isVertical = selEl.bpmnOrientation === 'vertical';
            const dividerThreshold = 6 / store.viewState.scale;
            const poolLabelW = selEl.bpmnPoolLabelSize ?? Math.min(selEl.width * 0.06, 35);
            const laneLabelW = selEl.bpmnLaneLabelSize ?? Math.min(selEl.width * 0.05, 28);
            const poolLabelH = selEl.bpmnPoolLabelSize ?? Math.min(selEl.height * 0.08, 30);
            const laneLabelH = selEl.bpmnLaneLabelSize ?? Math.min(selEl.height * 0.06, 25);

            // Header divider detection (pool label column / lane label column)
            if (isVertical) {
                // Vertical: pool label divider is horizontal at y + poolLabelH
                const poolDivY = selEl.y + poolLabelH;
                if (Math.abs(y - poolDivY) < dividerThreshold &&
                    x >= selEl.x && x <= selEl.x + selEl.width) {
                    pushToHistory();
                    pState.poolHeaderResizeType = 'pool';
                    pState.poolHeaderResizeElementId = selEl.id;
                    pState.poolHeaderResizeStartPos = y;
                    pState.poolHeaderResizeInitialSize = poolLabelH;
                    pState.isDragging = true;
                    return;
                }
                // Lane label divider is horizontal at y + poolLabelH + laneLabelH
                if (laneCount > 1) {
                    const laneDivY = selEl.y + poolLabelH + laneLabelH;
                    if (Math.abs(y - laneDivY) < dividerThreshold &&
                        x >= selEl.x && x <= selEl.x + selEl.width) {
                        pushToHistory();
                        pState.poolHeaderResizeType = 'lane';
                        pState.poolHeaderResizeElementId = selEl.id;
                        pState.poolHeaderResizeStartPos = y;
                        pState.poolHeaderResizeInitialSize = laneLabelH;
                        pState.isDragging = true;
                        return;
                    }
                }
            } else {
                // Horizontal: pool label divider is vertical at x + poolLabelW
                const poolDivX = selEl.x + poolLabelW;
                if (Math.abs(x - poolDivX) < dividerThreshold &&
                    y >= selEl.y && y <= selEl.y + selEl.height) {
                    pushToHistory();
                    pState.poolHeaderResizeType = 'pool';
                    pState.poolHeaderResizeElementId = selEl.id;
                    pState.poolHeaderResizeStartPos = x;
                    pState.poolHeaderResizeInitialSize = poolLabelW;
                    pState.isDragging = true;
                    return;
                }
                // Lane label divider is vertical at x + poolLabelW + laneLabelW
                if (laneCount > 1) {
                    const laneDivX = selEl.x + poolLabelW + laneLabelW;
                    if (Math.abs(x - laneDivX) < dividerThreshold &&
                        y >= selEl.y && y <= selEl.y + selEl.height) {
                        pushToHistory();
                        pState.poolHeaderResizeType = 'lane';
                        pState.poolHeaderResizeElementId = selEl.id;
                        pState.poolHeaderResizeStartPos = x;
                        pState.poolHeaderResizeInitialSize = laneLabelW;
                        pState.isDragging = true;
                        return;
                    }
                }
            }

            // Lane content divider resize detection
            if (laneCount > 1) {
                const heights = selEl.bpmnLaneHeights ?? Array.from({ length: laneCount }, () => 1 / laneCount);
                const totalSize = isVertical ? selEl.width : selEl.height;
                const sum = heights.reduce((a, b) => a + b, 0);
                const normalizedHeights = heights.map(h => (h / sum) * totalSize);

                if (isVertical) {
                    let laneX = selEl.x;
                    for (let i = 0; i < laneCount - 1; i++) {
                        laneX += normalizedHeights[i];
                        if (Math.abs(x - laneX) < dividerThreshold &&
                            y >= selEl.y + poolLabelH && y <= selEl.y + selEl.height) {
                            pushToHistory();
                            pState.poolLaneResizeIndex = i;
                            pState.poolLaneResizeElementId = selEl.id;
                            pState.poolLaneResizeStartPos = x;
                            pState.poolLaneResizeInitialHeights = [...heights];
                            pState.isDragging = true;
                            return;
                        }
                    }
                } else {
                    let laneY = selEl.y;
                    for (let i = 0; i < laneCount - 1; i++) {
                        laneY += normalizedHeights[i];
                        if (Math.abs(y - laneY) < dividerThreshold &&
                            x >= selEl.x + poolLabelW && x <= selEl.x + selEl.width) {
                            pushToHistory();
                            pState.poolLaneResizeIndex = i;
                            pState.poolLaneResizeElementId = selEl.id;
                            pState.poolLaneResizeStartPos = y;
                            pState.poolLaneResizeInitialHeights = [...heights];
                            pState.isDragging = true;
                            return;
                        }
                    }
                }
            }
        }
    }

    // UML Class scroll arrow click + section divider resize detection
    if (store.selection.length === 1) {
        const selEl = store.elements.find(e => e.id === store.selection[0]);
        if (selEl && selEl.type === 'umlClass') {
            const measureRenderer = getMeasureRenderer();
            if (measureRenderer) {
                const layout = calculateUmlClassLayout(measureRenderer, selEl);
                const SCROLL_STEP = 30;
                const btnSize = 10;
                const btnX = selEl.x + selEl.width - btnSize - 4;

                // Scroll arrow click detection for attributes section
                if (layout.attrOverflows) {
                    const sectionTop = selEl.y + layout.headerHeight;
                    const sectionHeight = layout.attrHeight;
                    const scrollY = selEl.umlAttrScrollY || 0;
                    const maxScroll = Math.max(0, layout.attrContentHeight - sectionHeight);

                    // Up arrow area
                    if (scrollY > 0.5 &&
                        x >= btnX - 1 && x <= btnX + btnSize + 1 &&
                        y >= sectionTop + 2 && y <= sectionTop + 2 + btnSize + 2) {
                        updateElement(selEl.id, { umlAttrScrollY: Math.max(0, scrollY - SCROLL_STEP) });
                        return;
                    }
                    // Down arrow area
                    const downBtnY = sectionTop + sectionHeight - btnSize - 5;
                    if (scrollY < maxScroll - 0.5 &&
                        x >= btnX - 1 && x <= btnX + btnSize + 1 &&
                        y >= downBtnY - 1 && y <= downBtnY + btnSize + 1) {
                        updateElement(selEl.id, { umlAttrScrollY: Math.min(maxScroll, scrollY + SCROLL_STEP) });
                        return;
                    }
                }

                // Scroll arrow click detection for methods section
                if (layout.methodsOverflows) {
                    const sectionTop = selEl.y + layout.headerHeight + layout.attrHeight;
                    const sectionHeight = layout.methodsHeight;
                    const scrollY = selEl.umlMethodsScrollY || 0;
                    const maxScroll = Math.max(0, layout.methodsContentHeight - sectionHeight);

                    // Up arrow area
                    if (scrollY > 0.5 &&
                        x >= btnX - 1 && x <= btnX + btnSize + 1 &&
                        y >= sectionTop + 2 && y <= sectionTop + 2 + btnSize + 2) {
                        updateElement(selEl.id, { umlMethodsScrollY: Math.max(0, scrollY - SCROLL_STEP) });
                        return;
                    }
                    // Down arrow area
                    const downBtnY = sectionTop + sectionHeight - btnSize - 5;
                    if (scrollY < maxScroll - 0.5 &&
                        x >= btnX - 1 && x <= btnX + btnSize + 1 &&
                        y >= downBtnY - 1 && y <= downBtnY + btnSize + 1) {
                        updateElement(selEl.id, { umlMethodsScrollY: Math.min(maxScroll, scrollY + SCROLL_STEP) });
                        return;
                    }
                }

                // Header-Attributes divider
                const dividerThreshold = 6 / store.viewState.scale;
                const divider1Y = selEl.y + layout.headerHeight;
                if (Math.abs(y - divider1Y) < dividerThreshold &&
                    x >= selEl.x && x <= selEl.x + selEl.width) {
                    pushToHistory();
                    pState.umlDividerType = 'header';
                    pState.umlDividerElementId = selEl.id;
                    pState.umlDividerStartPos = y;
                    pState.umlDividerInitialHeaderHeight = layout.headerHeight;
                    pState.umlDividerInitialAttrHeight = layout.attrHeight;
                    pState.isDragging = true;
                    return;
                }

                // Attributes-Methods divider
                if (layout.hasAttributes && layout.hasMethods) {
                    const divider2Y = selEl.y + layout.headerHeight + layout.attrHeight;
                    if (Math.abs(y - divider2Y) < dividerThreshold &&
                        x >= selEl.x && x <= selEl.x + selEl.width) {
                        pushToHistory();
                        pState.umlDividerType = 'attr';
                        pState.umlDividerElementId = selEl.id;
                        pState.umlDividerStartPos = y;
                        pState.umlDividerInitialHeaderHeight = layout.headerHeight;
                        pState.umlDividerInitialAttrHeight = layout.attrHeight;
                        pState.isDragging = true;
                        return;
                    }
                }
            }
        }

        // 2-section UML shapes: umlInterface, umlEnum, umlState — scroll arrows + header divider
        if (selEl && TWO_SECTION_UML.has(selEl.type)) {
            const measureRenderer = getMeasureRenderer();
            if (measureRenderer) {
                const bodyProp = selEl.type === 'umlInterface' ? 'methodsText' : 'attributesText';
                const scrollProp = selEl.type === 'umlInterface' ? 'umlMethodsScrollY' : 'umlAttrScrollY';
                const layout = calculateUml2SectionLayout(measureRenderer, selEl, bodyProp as any);
                const SCROLL_STEP = 30;
                const btnSize = 10;
                const btnX = selEl.x + selEl.width - btnSize - 4;

                // Scroll arrow click detection for body section
                if (layout.bodyOverflows) {
                    const sectionTop = selEl.y + layout.headerHeight;
                    const sectionHeight = layout.bodyHeight;
                    const scrollY = (selEl as any)[scrollProp] || 0;
                    const maxScroll = Math.max(0, layout.bodyContentHeight - sectionHeight);

                    // Up arrow area
                    if (scrollY > 0.5 &&
                        x >= btnX - 1 && x <= btnX + btnSize + 1 &&
                        y >= sectionTop + 2 && y <= sectionTop + 2 + btnSize + 2) {
                        updateElement(selEl.id, { [scrollProp]: Math.max(0, scrollY - SCROLL_STEP) });
                        return;
                    }
                    // Down arrow area
                    const downBtnY = sectionTop + sectionHeight - btnSize - 5;
                    if (scrollY < maxScroll - 0.5 &&
                        x >= btnX - 1 && x <= btnX + btnSize + 1 &&
                        y >= downBtnY - 1 && y <= downBtnY + btnSize + 1) {
                        updateElement(selEl.id, { [scrollProp]: Math.min(maxScroll, scrollY + SCROLL_STEP) });
                        return;
                    }
                }

                // Header divider
                const dividerThreshold = 6 / store.viewState.scale;
                const dividerY = selEl.y + layout.headerHeight;
                if (Math.abs(y - dividerY) < dividerThreshold &&
                    x >= selEl.x && x <= selEl.x + selEl.width) {
                    pushToHistory();
                    pState.umlDividerType = 'header';
                    pState.umlDividerElementId = selEl.id;
                    pState.umlDividerStartPos = y;
                    pState.umlDividerInitialHeaderHeight = layout.headerHeight;
                    pState.umlDividerInitialAttrHeight = 0; // not used for 2-section
                    pState.isDragging = true;
                    return;
                }
            }
        }
    }

    // Hit Test Body
    let hitId: string | null = null;
    const threshold = 10 / store.viewState.scale;

    // STEP 1: Check if click is within any group's bounding box
    const sortedGroups = getGroupsSortedByPriority(store.elements, store.layers);

    for (const { groupId } of sortedGroups) {
        const groupElements = store.elements.filter(el =>
            el.groupIds && el.groupIds.includes(groupId)
        );

        const hasInteractableElement = groupElements.some(el =>
            helpers.canInteractWithElement(el) && isLayerVisible(el.layerId)
        );

        if (!hasInteractableElement) continue;

        if (isPointInGroupBounds(x, y, groupId, store.elements)) {
            const idsToSelect = groupElements.map(el => el.id);
            const isAllSelected = idsToSelect.every(id => store.selection.includes(id));

            if (e.shiftKey || e.ctrlKey || e.metaKey) {
                if (isAllSelected) {
                    setStore('selection', s => s.filter(id => !idsToSelect.includes(id)));
                } else {
                    setStore('selection', s => [...new Set([...s, ...idsToSelect])]);
                }
            } else {
                if (!isAllSelected) {
                    setStore('selection', idsToSelect);
                }
            }

            if (store.selection.length > 0) {
                initMoveState(pState, x, y);
            }

            return;
        }
    }

    const elementMap = new Map<string, DrawingElement>();
    for (const el of store.elements) elementMap.set(el.id, el);

    const sortedElements = store.elements.map((el, index) => {
        const layer = store.layers.find(l => l.id === el.layerId);
        return { el, index, layerOrder: layer?.order ?? 999, layerVisible: isLayerVisible(el.layerId) };
    }).sort((a, b) => {
        if (a.layerOrder !== b.layerOrder) return b.layerOrder - a.layerOrder;
        return b.index - a.index;
    });

    // Hit Testing must respect Animation
    const currentTime = (window as any).yappyGlobalTime || 0;
    const shouldAnimate = store.appMode === 'presentation' || store.isPreviewing;
    const animatedStates = calculateAllAnimatedStates(store.elements, currentTime, shouldAnimate);

    for (const { el, layerVisible } of sortedElements) {
        if (!layerVisible) continue;
        if (!helpers.canInteractWithElement(el)) continue;

        const animState = animatedStates.get(el.id);
        const testEl = helpers.applyMasterProjection(animState ? {
            ...el,
            x: animState.x,
            y: animState.y,
            angle: animState.angle
        } : el);

        if (hitTestElement(testEl, x, y, threshold, store.elements, elementMap)) {
            hitId = el.id;
            break;
        }
    }

    if (hitId) {
        const hitEl = store.elements.find(e => e.id === hitId);
        let idsToSelect = [hitId];

        // If element is grouped, select the outermost group
        if (hitEl && hitEl.groupIds && hitEl.groupIds.length > 0) {
            const outermostId = hitEl.groupIds[hitEl.groupIds.length - 1];
            idsToSelect = store.elements
                .filter(el => el.groupIds && el.groupIds.includes(outermostId))
                .map(el => el.id);
        }

        const isAllSelected = idsToSelect.every(id => store.selection.includes(id));

        if (e.shiftKey || e.ctrlKey || e.metaKey) {
            if (isAllSelected) {
                setStore('selection', s => s.filter(id => !idsToSelect.includes(id)));
            } else {
                setStore('selection', s => [...new Set([...s, ...idsToSelect])]);
            }
        } else {
            if (!isAllSelected) {
                setStore('selection', idsToSelect);
            }
        }

        if (store.selection.length > 0) {
            initMoveState(pState, x, y);
        }
    } else {
        // Clicked empty space - Check if hit selection bounding box
        if (store.selection.length > 0) {
            const box = getSelectionBoundingBox(store.elements, store.selection);
            if (box) {
                const threshold = 10 / store.viewState.scale;
                if (x >= box.x - threshold && x <= box.x + box.width + threshold &&
                    y >= box.y - threshold && y <= box.y + box.height + threshold) {

                    pushToHistory();
                    pState.isDragging = true;
                    pState.draggingHandle = null;
                    pState.startX = x;
                    pState.startY = y;

                    pState.initialPositions.clear();
                    store.elements.forEach(el => {
                        if (store.selection.includes(el.id)) {
                            pState.initialPositions.set(el.id, {
                                x: el.x,
                                y: el.y,
                                width: el.width,
                                height: el.height,
                                fontSize: el.fontSize,
                                points: el.points ? [...el.points] : undefined,
                                controlPoints: el.controlPoints ? el.controlPoints.map(cp => ({ ...cp })) : undefined
                            });
                        }
                    });
                    return;
                }
            }
        }

        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
            setStore('selection', []);
            setShowCanvasProperties(false);
        }
        // Start Selection Box or Lasso
        pState.isSelecting = true;
        pState.startX = x;
        pState.startY = y;
        if (store.selectedTool === 'lasso') {
            pState.lassoPoints = [{ x, y }];
            signals.setLassoPoints([{ x, y }]);
        } else {
            signals.setSelectionBox({ x, y, w: 0, h: 0 });
        }
    }
}

// ─── Pointer Move: Cursor, selection box, resize, rotate, move ──────

export function selectionOnMove(
    e: PointerEvent,
    x: number,
    y: number,
    pState: PointerState,
    helpers: PointerHelpers,
    signals: PointerSignals,
    SNAPPING_THROTTLE_MS: number
): void {
    // Cursor updates (when not dragging)
    if (!pState.isDragging) {
        const hit = getHandleAtPosition(x, y, store.elements, store.selection, store.viewState.scale);
        const prevHover = pState.hoveredConnector;

        if (hit) {
            if (hit.handle === 'rotate') helpers.setCursor('grab');
            else if (hit.handle === 'tl' || hit.handle === 'br') helpers.setCursor('nwse-resize');
            else if (hit.handle === 'tr' || hit.handle === 'bl') helpers.setCursor('nesw-resize');
            else if (hit.handle === 'tm' || hit.handle === 'bm') helpers.setCursor('ns-resize');
            else if (hit.handle === 'lm' || hit.handle === 'rm') helpers.setCursor('ew-resize');
            else if (hit.handle.startsWith('segment-')) {
                // Determine segment direction for cursor
                const segEl = store.elements.find(e => e.id === hit.id);
                if (segEl && segEl.points) {
                    const segIdx = parseInt(hit.handle.replace('segment-', ''), 10);
                    const segPts = normalizePoints(segEl.points);
                    if (segIdx >= 0 && segIdx < segPts.length - 1) {
                        const isHoriz = Math.abs(segPts[segIdx].y - segPts[segIdx + 1].y) < 1;
                        helpers.setCursor(isHoriz ? 'ns-resize' : 'ew-resize');
                    } else {
                        helpers.setCursor('move');
                    }
                } else {
                    helpers.setCursor('move');
                }
                pState.hoveredConnector = null;
            } else if (hit.handle.startsWith('polypoint-')) {
                helpers.setCursor('move');
                pState.hoveredConnector = null;
            } else if (hit.handle.startsWith('control-')) {
                helpers.setCursor('move');
                pState.hoveredConnector = null;
            } else if (hit.handle === 'table-move') {
                helpers.setCursor('move');
                pState.hoveredConnector = null;
            } else if (hit.handle.startsWith('connector-')) {
                helpers.setCursor('crosshair');
                pState.hoveredConnector = { elementId: hit.id, handle: hit.handle };
            } else {
                pState.hoveredConnector = null;
            }
        } else {
            helpers.setCursor('default');
            pState.hoveredConnector = null;
        }

        // Redraw if hover connector changed
        const isChanged = (prevHover && !pState.hoveredConnector) ||
            (!prevHover && pState.hoveredConnector) ||
            (prevHover && pState.hoveredConnector && (prevHover.elementId !== pState.hoveredConnector.elementId || prevHover.handle !== pState.hoveredConnector.handle));

        if (isChanged) {
            requestAnimationFrame(helpers.draw);
        }
    }

    // Selection box / lasso drag
    if (pState.isSelecting) {
        if (store.selectedTool === 'lasso') {
            const pts = pState.lassoPoints;
            const last = pts[pts.length - 1];
            if (Math.hypot(x - last.x, y - last.y) > 3 / store.viewState.scale) {
                pts.push({ x, y });
                signals.setLassoPoints([...pts]);
            }
        } else {
            const w = x - pState.startX;
            const h = y - pState.startY;
            signals.setSelectionBox({
                x: w > 0 ? pState.startX : pState.startX + w,
                y: h > 0 ? pState.startY : pState.startY + h,
                w: Math.abs(w),
                h: Math.abs(h)
            });
        }
        return;
    }

    // Table column/row resize drag
    if (pState.isDragging && pState.tableResizeElementId) {
        const el = store.elements.find(e => e.id === pState.tableResizeElementId);
        if (!el) return;

        if (pState.tableResizeCol >= 0 && pState.tableResizeInitialWidths) {
            // Column resize: adjust fractional widths of col and col+1
            const dx = x - pState.tableResizeStartX;
            const fracDx = dx / el.width;
            const ci = pState.tableResizeCol;
            const order = el.tableColOrder ?? Array.from({ length: (el.tableCols ?? 3) }, (_, i) => i);
            const dataCi = order[ci];
            const dataNext = order[ci + 1];
            if (dataCi === undefined || dataNext === undefined) return;

            const newWidths = [...pState.tableResizeInitialWidths];
            const minFrac = 30 / el.width; // minimum ~30px
            const total = newWidths[dataCi] + newWidths[dataNext];
            let w1 = pState.tableResizeInitialWidths[dataCi] + fracDx;
            let w2 = total - w1;
            if (w1 < minFrac) { w1 = minFrac; w2 = total - w1; }
            if (w2 < minFrac) { w2 = minFrac; w1 = total - w2; }
            newWidths[dataCi] = w1;
            newWidths[dataNext] = w2;
            updateElement(el.id, { tableColWidths: newWidths });
            requestAnimationFrame(helpers.draw);
            return;
        }

        if (pState.tableResizeRow >= 0 && pState.tableResizeInitialHeights) {
            // Row resize: adjust fractional heights of row and row+1
            const dy = y - pState.tableResizeStartY;
            const fracDy = dy / el.height;
            const ri = pState.tableResizeRow;
            const heights = pState.tableResizeInitialHeights;
            if (ri + 1 >= heights.length) return;

            const newHeights = [...heights];
            const minFrac = 20 / el.height; // minimum ~20px
            const total = newHeights[ri] + newHeights[ri + 1];
            let h1 = heights[ri] + fracDy;
            let h2 = total - h1;
            if (h1 < minFrac) { h1 = minFrac; h2 = total - h1; }
            if (h2 < minFrac) { h2 = minFrac; h1 = total - h2; }
            newHeights[ri] = h1;
            newHeights[ri + 1] = h2;
            updateElement(el.id, { tableRowHeights: newHeights });
            requestAnimationFrame(helpers.draw);
            return;
        }

        // Cell selection drag
        if (pState.tableCellSelectionDragging && pState.tableCellSelection) {
            const cols = el.tableCols ?? 3;
            const rows = el.tableRows ?? 3;
            const hasHeader = el.tableHeaders !== false;
            const totalVisualRows = hasHeader ? rows + 1 : rows;
            const colWidths = el.tableColWidths ?? defaultColWidths(cols);
            const rowHeights = el.tableRowHeights ?? defaultRowHeights(totalVisualRows);
            const cellRects = computeCellRects(el.x, el.y, el.width, el.height, colWidths, rowHeights, el.tableColOrder, hasHeader);

            const hitCell = hitTestTableCell(x, y, cellRects);
            if (hitCell) {
                pState.tableCellSelection = {
                    ...pState.tableCellSelection,
                    endRow: hitCell.row,
                    endCol: hitCell.col
                };
                helpers.setTableCellSelection({ ...pState.tableCellSelection });
                requestAnimationFrame(helpers.draw);
            }
            return;
        }
    }

    // Table column drag-and-drop reorder
    if (pState.isDragging && pState.tableDragCol >= 0 && pState.tableDragElementId) {
        // If dragging significantly horizontally, it's a column reorder — cursor feedback
        const dragDist = Math.abs(x - pState.startX);
        if (dragDist > 5 / store.viewState.scale) {
            helpers.setCursor('grabbing');
        }
        return;
    }

    // BPMN Pool header/lane-label column divider resize drag
    if (pState.isDragging && pState.poolHeaderResizeElementId && pState.poolHeaderResizeType) {
        const el = store.elements.find(e => e.id === pState.poolHeaderResizeElementId);
        if (!el) return;
        const isVertical = el.bpmnOrientation === 'vertical';
        const dPos = (isVertical ? y : x) - pState.poolHeaderResizeStartPos;
        let newSize = pState.poolHeaderResizeInitialSize + dPos;
        newSize = Math.max(15, Math.min(newSize, (isVertical ? el.height : el.width) * 0.3));
        const prop = pState.poolHeaderResizeType === 'pool' ? 'bpmnPoolLabelSize' : 'bpmnLaneLabelSize';
        updateElement(el.id, { [prop]: newSize });
        helpers.setCursor(isVertical ? 'row-resize' : 'col-resize');
        requestAnimationFrame(helpers.draw);
        return;
    }

    // BPMN Pool lane divider resize drag
    if (pState.isDragging && pState.poolLaneResizeElementId && pState.poolLaneResizeInitialHeights) {
        const el = store.elements.find(e => e.id === pState.poolLaneResizeElementId);
        if (!el) return;

        const isVertical = el.bpmnOrientation === 'vertical';
        const totalSize = isVertical ? el.width : el.height;
        const dPos = (isVertical ? x : y) - pState.poolLaneResizeStartPos;
        const fracD = dPos / totalSize;
        const idx = pState.poolLaneResizeIndex;
        const initial = pState.poolLaneResizeInitialHeights;

        const newHeights = [...initial];
        const minFrac = 20 / totalSize; // minimum ~20px
        const total = newHeights[idx] + newHeights[idx + 1];
        let h1 = initial[idx] + fracD;
        let h2 = total - h1;
        if (h1 < minFrac) { h1 = minFrac; h2 = total - h1; }
        if (h2 < minFrac) { h2 = minFrac; h1 = total - h2; }
        newHeights[idx] = h1;
        newHeights[idx + 1] = h2;
        updateElement(el.id, { bpmnLaneHeights: newHeights });
        helpers.setCursor(isVertical ? 'col-resize' : 'row-resize');
        requestAnimationFrame(helpers.draw);
        return;
    }

    // UML Class section divider drag
    if (pState.isDragging && pState.umlDividerElementId && pState.umlDividerType) {
        const el = store.elements.find(e => e.id === pState.umlDividerElementId);
        if (!el) return;

        const dy = y - pState.umlDividerStartPos;
        const MIN_SECTION = 25;

        if (pState.umlDividerType === 'header') {
            // Dragging header-attr divider: changes headerHeight
            let newHeaderH = pState.umlDividerInitialHeaderHeight + dy;
            newHeaderH = Math.max(MIN_SECTION, Math.min(newHeaderH, el.height - MIN_SECTION * 2));
            let newAttrH = pState.umlDividerInitialAttrHeight;
            const methodsH = el.height - newHeaderH - newAttrH;
            if (methodsH < MIN_SECTION) {
                newAttrH = el.height - newHeaderH - MIN_SECTION;
            }
            newAttrH = Math.max(MIN_SECTION, newAttrH);
            updateElement(el.id, { umlHeaderHeight: newHeaderH, umlAttrHeight: newAttrH });
        } else {
            // Dragging attr-methods divider: changes attrHeight
            const headerH = pState.umlDividerInitialHeaderHeight;
            let newAttrH = pState.umlDividerInitialAttrHeight + dy;
            newAttrH = Math.max(MIN_SECTION, Math.min(newAttrH, el.height - headerH - MIN_SECTION));
            updateElement(el.id, { umlAttrHeight: newAttrH });
        }

        helpers.setCursor('row-resize');
        requestAnimationFrame(helpers.draw);
        return;
    }

    // Table column/row edge cursor on hover (non-dragging)
    if (!pState.isDragging && store.selection.length === 1) {
        const selEl = store.elements.find(e => e.id === store.selection[0]);
        if (selEl && selEl.type === 'table') {
            const cols = selEl.tableCols ?? 3;
            const rows = selEl.tableRows ?? 3;
            const hasHeader = selEl.tableHeaders !== false;
            const totalVisualRows = hasHeader ? rows + 1 : rows;
            const colWidths = selEl.tableColWidths ?? defaultColWidths(cols);
            const rowHeights = selEl.tableRowHeights ?? defaultRowHeights(totalVisualRows);
            const cellRects = computeCellRects(selEl.x, selEl.y, selEl.width, selEl.height, colWidths, rowHeights, selEl.tableColOrder, hasHeader);
            const edgeThreshold = 6 / store.viewState.scale;

            if (hitTestColEdge(x, y, cellRects, edgeThreshold)) {
                helpers.setCursor('col-resize');
            } else if (hitTestRowEdge(x, y, cellRects, edgeThreshold)) {
                helpers.setCursor('row-resize');
            }
        }

        // BPMN Pool divider hover cursors
        if (selEl && selEl.type === 'bpmnPool') {
            const laneCount = selEl.bpmnLaneCount ?? 1;
            const isVertical = selEl.bpmnOrientation === 'vertical';
            const dividerThreshold = 6 / store.viewState.scale;
            const poolLabelW = selEl.bpmnPoolLabelSize ?? Math.min(selEl.width * 0.06, 35);
            const laneLabelW = selEl.bpmnLaneLabelSize ?? Math.min(selEl.width * 0.05, 28);
            const poolLabelH = selEl.bpmnPoolLabelSize ?? Math.min(selEl.height * 0.08, 30);
            const laneLabelH = selEl.bpmnLaneLabelSize ?? Math.min(selEl.height * 0.06, 25);

            // Header divider hover
            if (isVertical) {
                if (Math.abs(y - (selEl.y + poolLabelH)) < dividerThreshold &&
                    x >= selEl.x && x <= selEl.x + selEl.width) {
                    helpers.setCursor('row-resize');
                } else if (laneCount > 1 && Math.abs(y - (selEl.y + poolLabelH + laneLabelH)) < dividerThreshold &&
                    x >= selEl.x && x <= selEl.x + selEl.width) {
                    helpers.setCursor('row-resize');
                }
            } else {
                if (Math.abs(x - (selEl.x + poolLabelW)) < dividerThreshold &&
                    y >= selEl.y && y <= selEl.y + selEl.height) {
                    helpers.setCursor('col-resize');
                } else if (laneCount > 1 && Math.abs(x - (selEl.x + poolLabelW + laneLabelW)) < dividerThreshold &&
                    y >= selEl.y && y <= selEl.y + selEl.height) {
                    helpers.setCursor('col-resize');
                }
            }

            // Lane divider hover
            if (laneCount > 1) {
                const heights = selEl.bpmnLaneHeights ?? Array.from({ length: laneCount }, () => 1 / laneCount);
                const totalSize = isVertical ? selEl.width : selEl.height;
                const sum = heights.reduce((a, b) => a + b, 0);
                const normalizedHeights = heights.map(h => (h / sum) * totalSize);

                if (isVertical) {
                    let laneX = selEl.x;
                    for (let i = 0; i < laneCount - 1; i++) {
                        laneX += normalizedHeights[i];
                        if (Math.abs(x - laneX) < dividerThreshold &&
                            y >= selEl.y + poolLabelH && y <= selEl.y + selEl.height) {
                            helpers.setCursor('col-resize');
                            break;
                        }
                    }
                } else {
                    let laneY = selEl.y;
                    for (let i = 0; i < laneCount - 1; i++) {
                        laneY += normalizedHeights[i];
                        if (Math.abs(y - laneY) < dividerThreshold &&
                            x >= selEl.x + poolLabelW && x <= selEl.x + selEl.width) {
                            helpers.setCursor('row-resize');
                            break;
                        }
                    }
                }
            }
        }

        // UML Class divider hover cursors
        if (selEl && selEl.type === 'umlClass') {
            const dividerThreshold = 6 / store.viewState.scale;
            const measureRenderer = getMeasureRenderer();
            if (measureRenderer) {
                const layout = calculateUmlClassLayout(measureRenderer, selEl);
                const divider1Y = selEl.y + layout.headerHeight;
                if (Math.abs(y - divider1Y) < dividerThreshold &&
                    x >= selEl.x && x <= selEl.x + selEl.width) {
                    helpers.setCursor('row-resize');
                } else if (layout.hasAttributes && layout.hasMethods) {
                    const divider2Y = selEl.y + layout.headerHeight + layout.attrHeight;
                    if (Math.abs(y - divider2Y) < dividerThreshold &&
                        x >= selEl.x && x <= selEl.x + selEl.width) {
                        helpers.setCursor('row-resize');
                    }
                }
            }
        }

        // 2-section UML divider hover cursors
        if (selEl && TWO_SECTION_UML.has(selEl.type)) {
            const dividerThreshold = 6 / store.viewState.scale;
            const measureRenderer = getMeasureRenderer();
            if (measureRenderer) {
                const bodyProp = selEl.type === 'umlInterface' ? 'methodsText' : 'attributesText';
                const layout = calculateUml2SectionLayout(measureRenderer, selEl, bodyProp as any);
                const dividerY = selEl.y + layout.headerHeight;
                if (Math.abs(y - dividerY) < dividerThreshold &&
                    x >= selEl.x && x <= selEl.x + selEl.width) {
                    helpers.setCursor('row-resize');
                }
            }
        }
    }

    if (pState.isDragging && store.selection.length > 0) {
        const id = store.selection[0];
        const el = store.elements.find(e => e.id === id);
        if (!el) return;

        if (pState.draggingHandle && !helpers.canInteractWithElement(el)) {
            return;
        }

        if (pState.draggingHandle) {
            handleResize(e, x, y, id, el, pState, helpers, signals);
        } else {
            // Minimum drag threshold to prevent accidental moves on click
            const dragDist = Math.hypot(x - pState.startX, y - pState.startY);
            if (dragDist < 3 / store.viewState.scale) return;

            // Alt+drag on 3D shapes: change viewAngle instead of moving
            // Once 3D mode is entered, stay in it for the entire drag (prevents
            // accidental panning if Alt key state flickers between move events)
            const is3DShape = ['solidBlock', 'perspectiveBlock', 'openBox', 'cylinder', 'isometricCube'].includes(el.type);
            const already3DMode = pState.initial3DViewAngle !== undefined;
            if ((e.altKey || already3DMode) && is3DShape && store.selection.length === 1) {
                handle3DViewAngle(e, x, y, id, el, pState, helpers);
                return;
            }

            handleMove(e, x, y, pState, helpers, signals, SNAPPING_THROTTLE_MS);
        }
    }
}

// ─── Resize/Rotate logic ────────────────────────────────────────────

function handleResize(
    e: PointerEvent,
    x: number,
    y: number,
    id: string,
    el: DrawingElement,
    pState: PointerState,
    helpers: PointerHelpers,
    signals: PointerSignals
): void {
    // Binding Logic for connectors only (arrows/organicBranch) — not plain lines
    if ((el.type === 'arrow' || el.type === 'organicBranch') && (pState.draggingHandle === 'tl' || pState.draggingHandle === 'br')) {
        const match = helpers.checkBinding(x, y, el.id);
        if (match) {
            signals.setSuggestedBinding({ elementId: match.element.id, px: match.snapPoint.x, py: match.snapPoint.y, position: match.position });
            x = match.snapPoint.x;
            y = match.snapPoint.y;
        } else {
            signals.setSuggestedBinding(null);
        }
    } else {
        signals.setSuggestedBinding(null);
    }

    // Rotate
    if (pState.draggingHandle === 'rotate') {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        const angle = Math.atan2(y - cy, x - cx);
        updateElement(id, { angle: angle + Math.PI / 2 });
        return;
    }

    // RESIZING
    let resizeX = x;
    let resizeY = y;

    // Snap handle position to grid if enabled
    if (store.gridSettings.snapToGrid) {
        const snapped = snapPoint(x, y, store.gridSettings.gridSize);
        resizeX = snapped.x;
        resizeY = snapped.y;
    }

    const dx = resizeX - pState.startX;
    const dy = resizeY - pState.startY;

    let newX = pState.initialElementX;
    let newY = pState.initialElementY;
    let newWidth = pState.initialElementWidth;
    let newHeight = pState.initialElementHeight;

    if (pState.draggingHandle === 'tl') {
        newX += dx; newY += dy; newWidth -= dx; newHeight -= dy;
    } else if (pState.draggingHandle === 'tr') {
        newY += dy; newWidth += dx; newHeight -= dy;
    } else if (pState.draggingHandle === 'bl') {
        newX += dx; newWidth -= dx; newHeight += dy;
    } else if (pState.draggingHandle === 'br') {
        newWidth += dx; newHeight += dy;
    } else if (pState.draggingHandle === 'tm') {
        newY += dy; newHeight -= dy;
    } else if (pState.draggingHandle === 'bm') {
        newHeight += dy;
    } else if (pState.draggingHandle === 'lm') {
        newX += dx; newWidth -= dx;
    } else if (pState.draggingHandle === 'rm') {
        newWidth += dx;
    }

    // Apply Constraints (Proportional Resizing)
    const isMulti = store.selection.length > 1;
    const firstEl = store.elements.find(e => e.id === store.selection[0]);
    let isConstrained = e.shiftKey || (store.selection.length === 1 && firstEl?.constrained);

    // Text/richtext elements don't use aspect ratio lock - they freely resize width and recalculate height
    if (store.selection.length === 1 && (firstEl?.type === 'text' || firstEl?.type === 'richtext')) {
        isConstrained = false;
    }

    if (isConstrained && pState.initialElementWidth !== 0 && pState.initialElementHeight !== 0) {
        const ratio = pState.initialElementWidth / pState.initialElementHeight;

        if (['tm', 'bm'].includes(pState.draggingHandle!)) {
            newWidth = newHeight * ratio;
            if (pState.draggingHandle === 'tm') {
                newX = (pState.initialElementX + pState.initialElementWidth / 2) - newWidth / 2;
            } else {
                newX = (pState.initialElementX + pState.initialElementWidth / 2) - newWidth / 2;
            }
        } else if (['lm', 'rm'].includes(pState.draggingHandle!)) {
            newHeight = newWidth / ratio;
            newY = (pState.initialElementY + pState.initialElementHeight / 2) - newHeight / 2;
        } else {
            // Corner Handles
            if (Math.abs(newWidth) / ratio > Math.abs(newHeight)) {
                newHeight = newWidth / ratio;
            } else {
                newWidth = newHeight * ratio;
            }

            if (pState.draggingHandle === 'tl') {
                newX = (pState.initialElementX + pState.initialElementWidth) - newWidth;
                newY = (pState.initialElementY + pState.initialElementHeight) - newHeight;
            } else if (pState.draggingHandle === 'tr') {
                newY = (pState.initialElementY + pState.initialElementHeight) - newHeight;
            } else if (pState.draggingHandle === 'bl') {
                newX = (pState.initialElementX + pState.initialElementWidth) - newWidth;
            }
        }
    }

    if (pState.draggingHandle && pState.draggingHandle.startsWith('segment-')) {
        handleSegmentDrag(x, y, id, pState);
    } else if (pState.draggingHandle && pState.draggingHandle.startsWith('polypoint-')) {
        handlePolypointDrag(x, y, id, pState);
    } else if (pState.draggingHandle && pState.draggingHandle.startsWith('control-')) {
        handleControlPointDrag(x, y, id, pState, helpers);
    } else {
        // APPLY RESIZE (Single or Group)
        applyResize(id, el, isMulti, newX, newY, newWidth, newHeight, pState, helpers);
    }
}

// ─── Control Point Dragging ─────────────────────────────────────────

function handleControlPointDrag(
    x: number,
    y: number,
    id: string,
    pState: PointerState,
    helpers: PointerHelpers
): void {
    const index = parseInt(pState.draggingHandle!.replace('control-', ''), 10);
    const element = store.elements.find(e => e.id === id);

    if (element) {
        let newControlPoints = element.controlPoints ? [...element.controlPoints] : [];

        while (newControlPoints.length <= index) {
            newControlPoints.push({ x: x, y: y });
        }

        if (element.controlPoints && element.controlPoints.length === 1 && index === 0) {
            // Curve Handle Logic
            let start = { x: element.x, y: element.y };
            let end = { x: element.x + element.width, y: element.y + element.height };
            if (element.points && element.points.length >= 2) {
                const pts = normalizePoints(element.points);
                if (pts.length > 0) {
                    start = { x: element.x + pts[0].x, y: element.y + pts[0].y };
                    end = { x: element.x + pts[pts.length - 1].x, y: element.y + pts[pts.length - 1].y };
                }
            }
            const cpX = 2 * x - 0.5 * start.x - 0.5 * end.x;
            const cpY = 2 * y - 0.5 * start.y - 0.5 * end.y;
            newControlPoints[0] = { x: cpX, y: cpY };
        } else {
            newControlPoints[index] = { x: x, y: y };
        }
        // Auto-convert straight to bezier when user drags a control point
        const updates: any = { controlPoints: newControlPoints };
        if ((element.curveType === 'straight' || !element.curveType) &&
            (element.type === 'line' || element.type === 'arrow')) {
            updates.curveType = 'bezier';
        }
        updateElement(element.id, updates);
        requestAnimationFrame(helpers.draw);
    }

    // Handle Custom Control Handles (Virtual handles like Top Control for Cube)
    const el = store.elements.find(e => e.id === id);
    if (el) {
        if (el.type === 'isometricCube' && pState.draggingHandle === 'control-1') {
            let newVRatio = (y - el.y) / el.height;
            newVRatio = Math.max(0.1, Math.min(0.9, newVRatio));
            const shapeRatio = Math.round(newVRatio * 100);

            let newHRatio = (x - el.x) / el.width;
            newHRatio = Math.max(0, Math.min(1, newHRatio));
            const sideRatio = Math.round(newHRatio * 100);

            updateElement(el.id, { shapeRatio, sideRatio }, false);
        } else if ((el.type === 'solidBlock' || el.type === 'cylinder') && pState.draggingHandle === 'control-1') {
            const centerX = el.x + el.width / 2;
            const centerY = el.y + el.height / 2;
            const dx = x - centerX;
            const dy = y - centerY;

            let newDepth = Math.sqrt(dx * dx + dy * dy);
            newDepth = Math.round(newDepth);

            let angleRad = Math.atan2(dy, dx);
            let angleDeg = Math.round((angleRad * 180) / Math.PI);
            if (angleDeg < 0) angleDeg += 360;

            updateElement(el.id, { depth: newDepth, viewAngle: angleDeg }, false);
        } else if (el.type === 'perspectiveBlock') {
            handlePerspectiveBlockControl(x, y, el, pState);
        } else if ((el.type === 'star' || el.type === 'burst') && pState.draggingHandle === 'control-1') {
            let newRatio = (y - el.y) / el.height;
            newRatio = Math.max(0.1, Math.min(0.9, newRatio));
            const shapeRatio = Math.round(newRatio * 100);
            updateElement(el.id, { shapeRatio }, false);
        } else if (el.type === 'speechBubble' && pState.draggingHandle === 'control-1') {
            let newTailX = (x - el.x) / el.width;
            let newTailY = (y - el.y) / el.height;
            newTailX = Math.max(-0.5, Math.min(1.5, newTailX));
            newTailY = Math.max(-0.5, Math.min(1.5, newTailY));
            updateElement(el.id, { tailX: newTailX, tailY: newTailY }, false);
        }
    }
}

// ─── Perspective Block Control Points ───────────────────────────────

function handlePerspectiveBlockControl(
    x: number,
    y: number,
    el: DrawingElement,
    pState: PointerState
): void {
    if (pState.draggingHandle === 'control-1') {
        const centerX = el.x + el.width / 2;
        const centerY = el.y + el.height / 2;
        const dx = x - centerX - (el.skewX || 0) * el.width;
        const dy = y - centerY - (el.skewY || 0) * el.height;

        let newDepth = Math.sqrt(dx * dx + dy * dy);
        let angleRad = Math.atan2(dy, dx);
        let angleDeg = Math.round((angleRad * 180) / Math.PI);
        if (angleDeg < 0) angleDeg += 360;

        updateElement(el.id, { depth: Math.round(newDepth), viewAngle: angleDeg }, false);
    } else if (pState.draggingHandle === 'control-2' || pState.draggingHandle === 'control-3' || pState.draggingHandle === 'control-4' || pState.draggingHandle === 'control-5') {
        // Back Vertices (TL, TR, BR, BL)
        const mw = el.width / 2;
        const mh = el.height / 2;
        const centerX = el.x + mw;
        const centerY = el.y + mh;
        const angle = (el.viewAngle || 45) * Math.PI / 180;
        const depth = el.depth || 50;
        const baseBackCenterX = centerX + depth * Math.cos(angle);
        const baseBackCenterY = centerY + depth * Math.sin(angle);

        const imx = x - baseBackCenterX;
        const imy = y - baseBackCenterY;

        const sx = (pState.draggingHandle === 'control-3' || pState.draggingHandle === 'control-4') ? 1 : -1;
        const sy = (pState.draggingHandle === 'control-4' || pState.draggingHandle === 'control-5') ? 1 : -1;

        const distToCenter = Math.sqrt(imx * imx + imy * imy);
        const predictedDist = Math.sqrt((mw * mw) + (mh * mh));
        const newTaper = Math.max(0, Math.min(1, 1 - (distToCenter / predictedDist)));

        const newSkewX = (imx - sx * mw * (1 - newTaper)) / el.width;
        const newSkewY = (imy - sy * mh * (1 - newTaper)) / el.height;

        updateElement(el.id, { taper: newTaper, skewX: newSkewX, skewY: newSkewY }, false);
    } else if (pState.draggingHandle === 'control-6' || pState.draggingHandle === 'control-7' || pState.draggingHandle === 'control-8' || pState.draggingHandle === 'control-9') {
        // Front Vertices (TL, TR, BR, BL)
        const mw = el.width / 2;
        const mh = el.height / 2;
        const centerX = el.x + mw;
        const centerY = el.y + mh;

        const imx = x - centerX;
        const imy = y - centerY;

        const sx = (pState.draggingHandle === 'control-7' || pState.draggingHandle === 'control-8') ? 1 : -1;
        const sy = (pState.draggingHandle === 'control-8' || pState.draggingHandle === 'control-9') ? 1 : -1;

        const distToCenter = Math.sqrt(imx * imx + imy * imy);
        const predictedDist = Math.sqrt((mw * mw) + (mh * mh));
        const newTaper = Math.max(0, Math.min(1, 1 - (distToCenter / predictedDist)));

        const newSkewX = (imx - sx * mw * (1 - newTaper)) / el.width;
        const newSkewY = (imy - sy * mh * (1 - newTaper)) / el.height;

        updateElement(el.id, { frontTaper: newTaper, frontSkewX: newSkewX, frontSkewY: newSkewY }, false);
    }
}

// ─── Polyline Point Dragging ─────────────────────────────────────────

function handlePolypointDrag(
    x: number,
    y: number,
    id: string,
    pState: PointerState,
): void {
    const index = parseInt(pState.draggingHandle!.replace('polypoint-', ''), 10);
    const element = store.elements.find(e => e.id === id);
    if (!element || !element.points) return;

    const pts = normalizePoints(element.points);
    if (index < 0 || index >= pts.length) return;

    const newPoints = [...pts];
    newPoints[index] = { x: x - element.x, y: y - element.y };
    updateElement(id, { points: newPoints }, false);
}

// ─── Elbow Segment Dragging ─────────────────────────────────────────

function handleSegmentDrag(
    x: number,
    y: number,
    id: string,
    pState: PointerState,
): void {
    const segIdx = parseInt(pState.draggingHandle!.replace('segment-', ''), 10);
    const element = store.elements.find(e => e.id === id);
    if (!element || !element.points) return;

    const pts = normalizePoints(element.points);
    if (segIdx < 0 || segIdx >= pts.length - 1) return;

    const p1 = pts[segIdx];
    const p2 = pts[segIdx + 1];
    const isHoriz = Math.abs(p1.y - p2.y) < 1;

    const newPoints = pts.map(p => ({ x: p.x, y: p.y }));
    if (isHoriz) {
        // Drag horizontal segment vertically
        const newY = y - element.y;
        newPoints[segIdx].y = newY;
        newPoints[segIdx + 1].y = newY;
    } else {
        // Drag vertical segment horizontally
        const newX = x - element.x;
        newPoints[segIdx].x = newX;
        newPoints[segIdx + 1].x = newX;
    }
    updateElement(id, { points: newPoints }, false);
}

// ─── Apply Resize (Single or Group) ─────────────────────────────────

function applyResize(
    id: string,
    _el: DrawingElement,
    isMulti: boolean,
    newX: number,
    newY: number,
    newWidth: number,
    newHeight: number,
    pState: PointerState,
    helpers: PointerHelpers
): void {
    if (isMulti) {
        // GROUP RESIZING
        const scaleX = pState.initialElementWidth === 0 ? 1 : newWidth / pState.initialElementWidth;
        const scaleY = pState.initialElementHeight === 0 ? 1 : newHeight / pState.initialElementHeight;

        store.selection.forEach(selId => {
            const init = pState.initialPositions.get(selId);
            if (!init) return;

            const relX = init.x - pState.initialElementX;
            const relY = init.y - pState.initialElementY;

            const updates: any = {
                x: newX + relX * scaleX,
                y: newY + relY * scaleY,
                width: init.width * scaleX,
                height: init.height * scaleY
            };

            if (init.points) {
                if (typeof init.points[0] === 'number') {
                    const pts = init.points as number[];
                    const newPts = [];
                    for (let i = 0; i < pts.length; i += 2) {
                        newPts.push(pts[i] * scaleX, pts[i + 1] * scaleY);
                    }
                    updates.points = newPts;
                } else {
                    updates.points = (init.points as any[]).map((p: any) => ({
                        x: p.x * scaleX,
                        y: p.y * scaleY
                    }));
                }
            }

            const element = store.elements.find(e => e.id === selId);
            if (element && (element.type === 'text' || element.type === 'richtext')) {
                updates.fontSize = Math.max(8, (init.fontSize || 28) * scaleY);
            }

            updateElement(selId, updates, false);
        });
    } else {
        // SINGLE ELEMENT RESIZING
        const singleEl = store.elements.find(e => e.id === id);
        if (singleEl) {
            const updates: any = { x: newX, y: newY, width: newWidth, height: newHeight };

            const scaleX = pState.initialElementWidth === 0 ? 1 : newWidth / pState.initialElementWidth;
            const scaleY = pState.initialElementHeight === 0 ? 1 : newHeight / pState.initialElementHeight;

            // Text/richtext elements: keep font size constant
            // - Horizontal resize (lm, rm): recalculate height based on wrapped text
            // - Vertical resize (tm, bm): allow free height adjustment
            // - Corner resize (tl, tr, bl, br): allow completely free resize (like Excalidraw)
            if ((singleEl.type === 'text' || singleEl.type === 'richtext') && singleEl.text) {
                const fontSize = singleEl.fontSize || 28;
                const isHorizontalOnly = pState.draggingHandle === 'lm' || pState.draggingHandle === 'rm';

                if (isHorizontalOnly) {
                    // Horizontal resize: recalculate height based on wrapped text
                    const calculatedHeight = measureWrappedTextHeight(singleEl.text, newWidth, fontSize, singleEl.fontFamily);
                    updates.height = Math.max(calculatedHeight, fontSize * 1.2);
                }
                // For all other handles (corners and vertical), allow free resize
                // Don't scale font size - keep it constant
            }

            // Scale points for pen tools
            if ((singleEl.type === 'fineliner' || singleEl.type === 'inkbrush' || singleEl.type === 'marker') && singleEl.points) {
                const init = pState.initialPositions.get(id);
                if (init && init.points) {
                    if (singleEl.pointsEncoding === 'flat' || (init.points.length > 0 && typeof init.points[0] === 'number')) {
                        const pts = init.points as number[];
                        const newPts = [];
                        for (let i = 0; i < pts.length; i += 2) {
                            newPts.push(pts[i] * scaleX, pts[i + 1] * scaleY);
                        }
                        updates.points = newPts;
                    } else {
                        updates.points = (init.points as any[]).map((p: any) => ({
                            x: p.x * scaleX,
                            y: p.y * scaleY,
                            ...(p.p !== undefined ? { p: p.p } : {})
                        }));
                    }
                }
            }

            if (singleEl.type === 'line' || singleEl.type === 'arrow' || singleEl.type === 'bezier') {
                // For unbound polylines (elbow with user-defined points), scale proportionally
                if (singleEl.curveType === 'elbow' && !singleEl.startBinding && !singleEl.endBinding) {
                    const init = pState.initialPositions.get(id);
                    if (init && init.points && Array.isArray(init.points) && init.points.length > 0) {
                        updates.points = (init.points as any[]).map((p: any) => ({
                            x: p.x * scaleX,
                            y: p.y * scaleY
                        }));
                    }
                } else {
                    updates.points = helpers.refreshLinePoints(singleEl, newX, newY, newX + newWidth, newY + newHeight);
                }
            }

            if (singleEl.type === 'organicBranch') {
                updates.points = [0, 0, newWidth, newHeight];
                const newStartX = newX;
                const newStartY = newY;
                const newEndX = newX + newWidth;
                const newEndY = newY + newHeight;
                const newCp1 = { x: newStartX + newWidth * 0.5, y: newStartY };
                const newCp2 = { x: newEndX - newWidth * 0.5, y: newEndY };
                updates.controlPoints = [newCp1, newCp2];
            }

            updateElement(id, updates, false);

            // Reposition pool-contained elements proportionally on resize
            if (singleEl.type === 'bpmnPool') {
                const initPool = pState.initialPositions.get(id);
                if (initPool) {
                    const finalX = updates.x ?? newX;
                    const finalY = updates.y ?? newY;
                    const finalW = updates.width ?? newWidth;
                    const finalH = updates.height ?? newHeight;
                    const sx = initPool.width === 0 ? 1 : finalW / initPool.width;
                    const sy = initPool.height === 0 ? 1 : finalH / initPool.height;

                    store.elements.forEach(child => {
                        if (child.poolContainerId !== id) return;
                        const childInit = pState.initialPositions.get(child.id);
                        if (!childInit) return;
                        const relX = childInit.x - initPool.x;
                        const relY = childInit.y - initPool.y;
                        updateElement(child.id, {
                            x: finalX + relX * sx,
                            y: finalY + relY * sy,
                        }, false);
                    });
                }
            }
        }
    }
}

// ─── 3D View Angle Control (Alt+Drag) ────────────────────────────────

function handle3DViewAngle(
    e: PointerEvent,
    _x: number,
    _y: number,
    id: string,
    el: DrawingElement,
    pState: PointerState,
    helpers: PointerHelpers
): void {
    // Store initial values on first call during this drag
    if (pState.initial3DViewAngle === undefined) {
        pState.initial3DViewAngle = el.viewAngle ?? 45;
        pState.initial3DDepth = el.depth ?? 50;
        pState.initial3DStartX = e.clientX;
        pState.initial3DStartY = e.clientY;
    }

    // Use screen-space coordinates for consistent feel at any zoom level
    const dx = e.clientX - (pState.initial3DStartX ?? e.clientX);
    const dy = e.clientY - (pState.initial3DStartY ?? e.clientY);

    // Horizontal drag → viewAngle (rotation direction)
    const angleSensitivity = 0.8; // screen pixels per degree (lower = faster rotation)
    const angleDelta = dx / angleSensitivity;
    let newAngle = pState.initial3DViewAngle + angleDelta;
    newAngle = ((newAngle % 360) + 360) % 360;

    // Vertical drag → depth (drag down = more depth, drag up = less)
    const depthSensitivity = 1; // screen pixels per depth unit
    const depthDelta = dy / depthSensitivity;
    let newDepth = (pState.initial3DDepth ?? 0) + depthDelta;
    newDepth = Math.max(0, Math.min(300, newDepth));

    // Snap to 5-unit increments if Shift is held
    if (e.shiftKey) {
        newAngle = Math.round(newAngle / 5) * 5;
        newDepth = Math.round(newDepth / 5) * 5;
    }

    updateElement(id, { viewAngle: newAngle, depth: newDepth }, false);
    helpers.setCursor('move');
    requestAnimationFrame(helpers.draw);
}

// ─── Move logic ─────────────────────────────────────────────────────

function handleMove(
    e: PointerEvent,
    x: number,
    y: number,
    pState: PointerState,
    helpers: PointerHelpers,
    signals: PointerSignals,
    SNAPPING_THROTTLE_MS: number
): void {
    let dx = x - pState.startX;
    let dy = y - pState.startY;

    // Throttled Object Snapping
    if (store.gridSettings.objectSnapping && !e.shiftKey) {
        const now = performance.now();

        if (now - pState.lastSnappingTime >= SNAPPING_THROTTLE_MS) {
            const snap = getSnappingGuides(store.selection, store.elements, dx, dy, 5 / store.viewState.scale);
            dx = snap.dx;
            dy = snap.dy;
            signals.setSnappingGuides(snap.guides);

            const spacing = getSpacingGuides(store.selection, store.elements, dx, dy, 5 / store.viewState.scale);
            dx = spacing.dx;
            dy = spacing.dy;
            signals.setSpacingGuides(spacing.guides);

            pState.lastSnappingTime = now;
        }
    } else {
        signals.setSnappingGuides([]);
        signals.setSpacingGuides([]);
    }

    // Snap delta to grid if enabled and no object snapping guides
    if (store.gridSettings.snapToGrid && !e.shiftKey && signals.snappingGuides().length === 0) {
        const gridSize = store.gridSettings.gridSize;
        dx = Math.round(dx / gridSize) * gridSize;
        dy = Math.round(dy / gridSize) * gridSize;
    }

    const skipHierarchy = !e.altKey;

    // Batch all position updates so reactive effects (e.g. refreshBoundLine in
    // canvas createEffect) only fire after every element has its final position.
    // Without batch, moving shape A triggers refreshBoundLine on a connected arrow
    // before the arrow (or shape B) has been moved, corrupting its width/height.
    // Build set of pool-contained element IDs so they always move with their pool
    const poolContainedIds = new Set<string>();
    store.selection.forEach(id => {
        const el = store.elements.find(e => e.id === id);
        if (el?.type === 'bpmnPool') {
            pState.initialPositions.forEach((_, childId) => {
                const child = store.elements.find(e => e.id === childId);
                if (child?.poolContainerId === id) poolContainedIds.add(childId);
            });
        }
    });

    batch(() => {
        pState.initialPositions.forEach((initPos, selId) => {
            // Skip hierarchy descendants when Alt is not pressed, but always move
            // directly selected elements and pool-contained elements
            if (skipHierarchy && !store.selection.includes(selId) && !poolContainedIds.has(selId)) return;

            const el = store.elements.find(e => e.id === selId);
            if (el && helpers.canInteractWithElement(el)) {
                const updates: any = { x: initPos.x + dx, y: initPos.y + dy };

                // Update Absolute Control Points
                if (initPos.controlPoints) {
                    updates.controlPoints = initPos.controlPoints.map((cp: any) => ({
                        x: cp.x + dx,
                        y: cp.y + dy
                    }));
                }

                updateElement(selId, updates, false);
            }
        });

        // Refresh bound lines AFTER all positions are updated.
        // Skip lines that are also in the selection — they've already been translated
        // by the same delta, so their relative binding geometry is preserved.
        pState.initialPositions.forEach((_, selId) => {
            if (skipHierarchy && !store.selection.includes(selId) && !poolContainedIds.has(selId)) return;
            const el = store.elements.find(e => e.id === selId);
            if (el?.boundElements) {
                el.boundElements.forEach(b => {
                    if (!pState.initialPositions.has(b.id)) {
                        helpers.refreshBoundLine(b.id);
                    }
                });
            }
        });
    });

    // Detect reparent drop target during drag
    if (store.selection.length === 1) {
        const selEl = store.elements.find(e => e.id === store.selection[0]);
        if (selEl && selEl.type !== 'line' && selEl.type !== 'arrow' && selEl.type !== 'organicBranch' && selEl.type !== 'bezier') {
            const selCX = selEl.x + selEl.width / 2;
            const selCY = selEl.y + selEl.height / 2;

            // Pool lane drop detection (takes priority over mindmap reparent)
            let poolDrop: { poolId: string; laneIndex: number } | null = null;
            if (selEl.type !== 'bpmnPool') {
                for (const el of store.elements) {
                    if (el.type !== 'bpmnPool') continue;
                    if (store.selection.includes(el.id)) continue;
                    const laneIdx = hitTestPoolLane(el, selCX, selCY, true);
                    if (laneIdx >= 0) {
                        poolDrop = { poolId: el.id, laneIndex: laneIdx };
                        break;
                    }
                }
            }
            signals.setPoolLaneDropTarget(poolDrop);

            // Mindmap reparent detection (suppress if pool lane detected)
            if (poolDrop) {
                signals.setReparentDropTarget(null);
            } else {
                let dropId: string | null = null;
                for (const el of store.elements) {
                    if (el.id === selEl.id) continue;
                    if (el.type === 'line' || el.type === 'arrow' || el.type === 'organicBranch' || el.type === 'bezier') continue;
                    if (store.selection.includes(el.id)) continue;
                    if (hitTestElement(el, selCX, selCY, 0, store.elements)) {
                        dropId = el.id;
                        break;
                    }
                }
                signals.setReparentDropTarget(dropId);
            }
        } else {
            signals.setReparentDropTarget(null);
            signals.setPoolLaneDropTarget(null);
        }
    } else {
        signals.setReparentDropTarget(null);
        signals.setPoolLaneDropTarget(null);
    }
}

// ─── Pointer Up: Selection finalization ─────────────────────────────

export function selectionOnUp(
    e: PointerEvent,
    x: number,
    y: number,
    pState: PointerState,
    helpers: PointerHelpers,
    signals: PointerSignals
): void {
    if (pState.isSelecting) {
        if (store.selectedTool === 'lasso') {
            // Lasso selection: point-in-polygon test on element centers
            const pts = pState.lassoPoints;
            if (pts.length >= 3) {
                const selectedIds: string[] = [];
                store.elements.forEach(el => {
                    const cx = el.x + el.width / 2;
                    const cy = el.y + el.height / 2;
                    if (isPointInPolygon({ x: cx, y: cy }, pts)) {
                        selectedIds.push(el.id);
                    }
                });
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    const existing = new Set(store.selection);
                    selectedIds.forEach(id => existing.add(id));
                    setStore('selection', Array.from(existing));
                } else {
                    setStore('selection', selectedIds);
                }
            }
            pState.lassoPoints = [];
            signals.setLassoPoints(null);
        } else {
            // Rectangle selection: AABB intersection test
            const box = signals.selectionBox();
            if (box) {
                const selectedIds: string[] = [];
                const bx = box.x;
                const by = box.y;
                const bw = box.w;
                const bh = box.h;

                store.elements.forEach(el => {
                    const elX = el.x;
                    const elY = el.y;
                    const elW = el.width;
                    const elH = el.height;

                    const ex1 = Math.min(elX, elX + elW);
                    const ex2 = Math.max(elX, elX + elW);
                    const ey1 = Math.min(elY, elY + elH);
                    const ey2 = Math.max(elY, elY + elH);

                    if (bx < ex2 && bx + bw > ex1 &&
                        by < ey2 && by + bh > ey1) {
                        selectedIds.push(el.id);
                    }
                });

                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    const existing = new Set(store.selection);
                    selectedIds.forEach(id => existing.add(id));
                    setStore('selection', Array.from(existing));
                } else {
                    setStore('selection', selectedIds);
                }
            }
            signals.setSelectionBox(null);
        }
        pState.isSelecting = false;
    }

    if (pState.isDragging) {
        const binding = signals.suggestedBinding();
        if (binding && store.selection.length === 1 && pState.draggingHandle) {
            const elId = store.selection[0];
            const el = store.elements.find(e => e.id === elId);
            // Binding only for connectors (arrows/organicBranch) — not plain lines
            if (el && (el.type === 'arrow' || el.type === 'organicBranch')) {
                const isStart = pState.draggingHandle === 'tl';
                const bindingData = {
                    elementId: binding.elementId,
                    focus: 0,
                    gap: 5,
                    position: binding.position
                };

                updateElement(elId, isStart ? { startBinding: bindingData } : { endBinding: bindingData });

                const target = store.elements.find(e => e.id === binding.elementId);
                if (target) {
                    const existing = target.boundElements || [];
                    if (!existing.find(b => b.id === elId)) {
                        updateElement(target.id, { boundElements: [...existing, { id: elId, type: el.type as any }] });
                    }
                }
            }
        }
        signals.setSuggestedBinding(null);
    }

    // Pool lane auto-assign/unassign on drop
    const poolDrop = signals.poolLaneDropTarget();
    if (poolDrop && store.selection.length === 1 && pState.isDragging) {
        const childId = store.selection[0];
        const childEl = store.elements.find(e => e.id === childId);
        if (childEl && childEl.type !== 'bpmnPool') {
            assignToPoolLane(childId, poolDrop.poolId, poolDrop.laneIndex);
        }
    } else if (!poolDrop && store.selection.length === 1 && pState.isDragging) {
        // Element was dragged out of a pool — unassign
        const childId = store.selection[0];
        const childEl = store.elements.find(e => e.id === childId);
        if (childEl?.poolContainerId) {
            unassignFromPool(childId);
        }
    }
    signals.setPoolLaneDropTarget(null);

    // Drag-to-reparent: show confirmation if drop target detected
    const dropTarget = signals.reparentDropTarget();
    if (dropTarget && store.selection.length === 1 && pState.isDragging) {
        const childId = store.selection[0];
        const childEl = store.elements.find(e => e.id === childId);
        const targetEl = store.elements.find(e => e.id === dropTarget);
        if (childEl && targetEl && childEl.parentId !== dropTarget) {
            confirmAndReparent(childId, dropTarget);
        }
    }
    signals.setReparentDropTarget(null);

    // Table column drag-and-drop reorder or sort on up
    if (pState.tableDragCol >= 0 && pState.tableDragElementId) {
        const el = store.elements.find(e => e.id === pState.tableDragElementId);
        if (el) {
            const dragDist = Math.abs(x - pState.startX);
            if (dragDist > 5 / store.viewState.scale) {
                // Column reorder: determine drop target column
                const cols = el.tableCols ?? 3;
                const rows = el.tableRows ?? 3;
                const hasHeader = el.tableHeaders !== false;
                const totalVisualRows = hasHeader ? rows + 1 : rows;
                const colWidths = el.tableColWidths ?? defaultColWidths(cols);
                const rowHeights = el.tableRowHeights ?? defaultRowHeights(totalVisualRows);
                const cellRects = computeCellRects(el.x, el.y, el.width, el.height, colWidths, rowHeights, el.tableColOrder, hasHeader);
                const dropCell = hitTestTableCell(x, y, cellRects);
                const sourceCol = pState.tableDragCol;

                if (dropCell && dropCell.dataCol !== sourceCol) {
                    pushToHistory();
                    const data = el.tableData ?? defaultTableData(rows + (hasHeader ? 1 : 0), cols);
                    // Build new column order
                    const order = Array.from({ length: cols }, (_, i) => i);
                    const srcIdx = order.indexOf(sourceCol);
                    const dstIdx = order.indexOf(dropCell.dataCol);
                    if (srcIdx >= 0 && dstIdx >= 0) {
                        order.splice(srcIdx, 1);
                        order.splice(dstIdx, 0, sourceCol);
                        // Reorder data and widths
                        const reordered = reorderColumns(data, colWidths, order);
                        updateElement(el.id, {
                            tableData: reordered.data,
                            tableColWidths: reordered.colWidths,
                            tableColOrder: undefined, // reset order since data is now reordered
                            tableSortCol: -1, // reset sort after reorder
                        });
                    }
                }
            } else {
                // Short click on header cell — only sort if click was on the sort icon area
                const cols = el.tableCols ?? 3;
                const rows = el.tableRows ?? 3;
                const hasHeader = el.tableHeaders !== false;
                if (hasHeader) {
                    const totalVisualRows2 = hasHeader ? rows + 1 : rows;
                    const colWidths2 = el.tableColWidths ?? defaultColWidths(cols);
                    const rowHeights2 = el.tableRowHeights ?? defaultRowHeights(totalVisualRows2);
                    const cellRects2 = computeCellRects(el.x, el.y, el.width, el.height, colWidths2, rowHeights2, el.tableColOrder, hasHeader);
                    const clickedCell = cellRects2.find(c => c.row === 0 && c.dataCol === pState.tableDragCol);

                    // Check if click is within the sort icon area (right side of header cell)
                    const iconPadding = 6;
                    const iconFontSize = el.fontSize ?? 14;
                    const indicatorSize = clickedCell ? Math.min(iconFontSize * 0.6, clickedCell.h * 0.3) : 0;
                    const iconHitWidth = indicatorSize + iconPadding * 2;
                    const isOnSortIcon = clickedCell && x >= (clickedCell.x + clickedCell.w - iconHitWidth);

                    if (isOnSortIcon) {
                        const currentSortCol = el.tableSortCol ?? -1;
                        const currentSortDir = el.tableSortDir ?? 'asc';
                        const data = el.tableData ?? [Array.from({ length: cols }, (_, i) => `Col ${i + 1}`), ...defaultTableData(rows, cols)];
                        const sortCol = pState.tableDragCol;

                        let newSortCol: number;
                        let newSortDir: 'asc' | 'desc';

                        if (currentSortCol === sortCol) {
                            if (currentSortDir === 'asc') {
                                newSortCol = sortCol;
                                newSortDir = 'desc';
                            } else {
                                newSortCol = -1;
                                newSortDir = 'asc';
                            }
                        } else {
                            newSortCol = sortCol;
                            newSortDir = 'asc';
                        }

                        pushToHistory();
                        const updates: any = { tableSortCol: newSortCol, tableSortDir: newSortDir };

                        if (newSortCol >= 0 && data.length > 1) {
                            const headerRow = data[0];
                            const bodyRows = data.slice(1);
                            const sorted = sortTableData(bodyRows, newSortCol, newSortDir);
                            updates.tableData = [headerRow, ...sorted];
                        }

                        updateElement(el.id, updates);
                    } else if (clickedCell) {
                        // Non-sort-icon header click: select entire column
                        pState.tableCellSelection = {
                            startRow: 0,
                            startCol: clickedCell.col,
                            endRow: totalVisualRows2 - 1,
                            endCol: clickedCell.col
                        };
                        pState.tableCellSelectionElementId = el.id;
                        helpers.setTableCellSelection({ ...pState.tableCellSelection });
                        requestAnimationFrame(helpers.draw);
                    }
                }
            }
        }
        pState.tableDragCol = -1;
        pState.tableDragElementId = null;
    }

    // Table resize cleanup
    if (pState.tableResizeElementId) {
        pState.tableResizeCol = -1;
        pState.tableResizeRow = -1;
        pState.tableResizeElementId = null;
        pState.tableResizeInitialWidths = null;
        pState.tableResizeInitialHeights = null;
    }

    // BPMN Pool lane resize cleanup
    if (pState.poolLaneResizeElementId) {
        pState.poolLaneResizeIndex = -1;
        pState.poolLaneResizeElementId = null;
        pState.poolLaneResizeInitialHeights = null;
    }

    // BPMN Pool header divider resize cleanup
    if (pState.poolHeaderResizeElementId) {
        pState.poolHeaderResizeType = null;
        pState.poolHeaderResizeElementId = null;
        pState.poolHeaderResizeInitialSize = 0;
    }

    // UML Class divider resize cleanup
    if (pState.umlDividerElementId) {
        pState.umlDividerType = null;
        pState.umlDividerElementId = null;
    }

    // Cell selection drag cleanup (keep selection, just stop dragging)
    if (pState.tableCellSelectionDragging) {
        pState.tableCellSelectionDragging = false;
    }

    // Deferred cell selection: if user clicked a body cell without dragging, select it now
    if (pState.pendingCellClick) {
        const dragDist = Math.hypot(x - pState.startX, y - pState.startY);
        if (dragDist < 3 / store.viewState.scale) {
            const { row, col, elementId } = pState.pendingCellClick;
            pState.tableCellSelection = { startRow: row, startCol: col, endRow: row, endCol: col };
            pState.tableCellSelectionElementId = elementId;
            helpers.setTableCellSelection({ ...pState.tableCellSelection });
            requestAnimationFrame(helpers.draw);
        }
        pState.pendingCellClick = null;
    }

    pState.isDragging = false;
    pState.draggingHandle = null;
    pState.initialPositions.clear();
    pState.initial3DViewAngle = undefined;
    pState.initial3DDepth = undefined;
    pState.initial3DStartX = undefined;
    pState.initial3DStartY = undefined;
    signals.setSnappingGuides([]);
}
