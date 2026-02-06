/**
 * Text Editing Handler
 * Handles double-click text editing and text commit logic.
 * Extracted from canvas.tsx commitText/handleDoubleClick.
 */

import { batch } from 'solid-js';
import type { DrawingElement } from '../../types';
import { store, updateElement, deleteElements, isLayerVisible } from '../../store/app-store';
import { hitTestElement } from '../hit-testing';
import { getHandleAtPosition } from '../handle-detection';
import { fitShapeToText, measureContainerText, measureWrappedTextHeight } from '../text-utils';
import { computeCellRects, defaultColWidths, defaultRowHeights, defaultTableData, hitTestTableCell } from '../table-utils';

/**
 * Context needed by text editing functions from canvas component closures.
 */
export interface TableEditingCell {
    dataRow: number;  // row index in tableData
    dataCol: number;  // col index in tableData
    cellX: number;    // cell pixel x (absolute)
    cellY: number;    // cell pixel y (absolute)
    cellW: number;    // cell pixel width
    cellH: number;    // cell pixel height
}

export interface TextEditingContext {
    editingId: () => string | null;
    setEditingId: (v: string | null) => void;
    editingProperty: () => 'text' | 'containerText' | 'attributesText' | 'methodsText' | 'tableCell';
    setEditingProperty: (v: 'text' | 'containerText' | 'attributesText' | 'methodsText' | 'tableCell') => void;
    editText: () => string;
    setEditText: (v: string) => void;
    tableEditingCell: () => TableEditingCell | null;
    setTableEditingCell: (v: TableEditingCell | null) => void;
    textInputRef?: HTMLTextAreaElement;
    canvasRef?: HTMLCanvasElement;
    getWorldCoordinates: (cx: number, cy: number) => { x: number; y: number };
    canInteractWithElement: (el: DrawingElement) => boolean;
    applyMasterProjection: (el: DrawingElement) => DrawingElement;
    redrawFn: () => void;
}

// ─── Commit Text ─────────────────────────────────────────────────────

export function commitText(ctx: TextEditingContext): void {
    const id = ctx.editingId();
    if (!id) return;
    const el = store.elements.find(e => e.id === id);
    if (!el) return;

    const newText = ctx.editText().trim();

    // Table cell editing
    if (ctx.editingProperty() === 'tableCell') {
        const cell = ctx.tableEditingCell();
        if (cell && el.tableData) {
            const newData = el.tableData.map(row => [...row]);
            if (newData[cell.dataRow]) {
                newData[cell.dataRow][cell.dataCol] = newText;
                updateElement(id, { tableData: newData }, true);
            }
        }
        ctx.setEditingId(null);
        ctx.setEditText("");
        ctx.setTableEditingCell(null);
        requestAnimationFrame(ctx.redrawFn);
        return;
    }

    // For standalone text elements, preserve width and recalculate height based on wrapped text
    if (el.type === 'text') {
        if (newText) {
            const fontSize = el.fontSize || 28;
            // Preserve existing width, recalculate height based on wrapped content
            const existingWidth = el.width || 200;
            const height = measureWrappedTextHeight(newText, existingWidth, fontSize, el.fontFamily);
            const finalHeight = Math.max(height, fontSize * 1.2);

            updateElement(id, { text: newText, height: finalHeight }, true);
        } else {
            deleteElements([id]);
        }
    } else {
        // For shapes with containerText
        const isLine = el.type === 'line' || el.type === 'arrow' || el.type === 'organicBranch';
        const prop = ctx.editingProperty();

        if (el.autoResize && ctx.canvasRef && !isLine && prop === 'containerText') {
            const canvasCtx = ctx.canvasRef.getContext("2d");
            if (canvasCtx) {
                const dims = fitShapeToText(canvasCtx, el, newText);
                updateElement(id, {
                    [prop]: newText,
                    width: dims.width,
                    height: dims.height,
                }, true);
            } else {
                updateElement(id, { [prop]: newText }, true);
            }
        } else {
            updateElement(id, { [prop]: newText }, true);
        }
    }

    ctx.setEditingId(null);
    ctx.setEditText("");
    requestAnimationFrame(ctx.redrawFn);
}

// ─── Double-Click Handler ────────────────────────────────────────────

export function handleDoubleClick(e: MouseEvent, ctx: TextEditingContext): void {
    e.preventDefault();
    if (store.selectedTool !== 'selection') return;

    const { x, y } = ctx.getWorldCoordinates(e.clientX, e.clientY);
    const threshold = 10 / store.viewState.scale;

    // Find element under cursor
    const elementMap = new Map<string, DrawingElement>();
    for (const el of store.elements) elementMap.set(el.id, el);

    for (let i = store.elements.length - 1; i >= 0; i--) {
        const el = store.elements[i];
        if (!ctx.canInteractWithElement(el)) continue;
        if (!isLayerVisible(el.layerId)) continue;

        if (hitTestElement(ctx.applyMasterProjection(el), x, y, threshold, store.elements, elementMap)) {

            // Check for control handles (Star, Burst, Speech Bubble, Isometric Cube, Solid Block, Perspective Block)
            if (['star', 'burst', 'speechBubble', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'openBox'].includes(el.type)) {
                const hitHandle = getHandleAtPosition(x, y, store.elements, store.selection, store.viewState.scale);
                if (hitHandle && hitHandle.handle.startsWith('control-')) {
                    // Hit a control handle, don't open text editor
                    return;
                }
            }

            // Add Control Point for Bezier/Arrow (skip polylines / elbow lines)
            if ((el.type === 'line' || el.type === 'arrow' || el.type === 'bezier') && el.curveType !== 'elbow') {
                const newControlPoints = el.controlPoints ? [...el.controlPoints] : [];

                // LIMIT TO 2 Control Points for S-Curve Support
                if (newControlPoints.length >= 2) {
                    return;
                }

                newControlPoints.push({ x, y });

                updateElement(el.id, {
                    controlPoints: newControlPoints,
                    curveType: 'bezier'
                }, true);

                return;
            }

            // Only allow editing containerText for shapes and lines
            const shapeTypes = ['rectangle', 'circle', 'diamond', 'line', 'arrow', 'text', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'polygon', 'star', 'cloud', 'heart', 'cross', 'checkmark', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'bracketLeft', 'bracketRight', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'starPerson', 'scroll', 'wavyDivider', 'doubleBanner', 'lightbulb', 'signpost', 'burstBlob', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'trophy', 'clock', 'gear', 'target', 'rocket', 'flag', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'openBox', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlState', 'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface', 'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble', 'stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp', 'faceHappy', 'faceSad', 'faceConfused', 'checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp', 'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield', 'barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'table', 'puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain', 'organicBranch'];
            if (shapeTypes.includes(el.type)) {
                // Table cell editing
                if (el.type === 'table') {
                    const cols = el.tableCols ?? 3;
                    const rows = el.tableRows ?? 3;
                    const hasHeader = el.tableHeaders !== false;
                    const totalVisualRows = hasHeader ? rows + 1 : rows;
                    const colWidths = el.tableColWidths ?? defaultColWidths(cols);
                    const rowHeights = el.tableRowHeights ?? defaultRowHeights(totalVisualRows);
                    const data = el.tableData ?? defaultTableData(rows, cols);
                    const cellRects = computeCellRects(el.x, el.y, el.width, el.height, colWidths, rowHeights, el.tableColOrder, hasHeader);
                    const hitCell = hitTestTableCell(x, y, cellRects);

                    if (!hitCell) return;

                    // hitCell.dataRow is -1 for header, 0+ for body
                    // In tableData: row 0 = header (when hasHeader), row 1+ = body
                    const tableDataRow = hasHeader ? (hitCell.dataRow === -1 ? 0 : hitCell.dataRow + 1) : hitCell.dataRow;

                    // batch() ensures all signals update atomically before the <Show> renders
                    batch(() => {
                        ctx.setEditingProperty('tableCell');
                        ctx.setEditText(data[tableDataRow]?.[hitCell.dataCol] ?? '');
                        ctx.setTableEditingCell({
                            dataRow: tableDataRow,
                            dataCol: hitCell.dataCol,
                            cellX: hitCell.x,
                            cellY: hitCell.y,
                            cellW: hitCell.w,
                            cellH: hitCell.h,
                        });
                        ctx.setEditingId(el.id); // must be last — triggers <Show> render
                    });

                    setTimeout(() => {
                        ctx.textInputRef?.focus();
                        ctx.textInputRef?.select();
                    }, 0);
                    return;
                }

                // Determine editing property and text before setting editingId
                // (editingId triggers the overlay render, so property must be set first)
                let prop: 'text' | 'containerText' | 'attributesText' | 'methodsText' = 'containerText';
                let text = el.containerText || '';

                if (el.type === 'umlClass') {
                    const clickYRelativeToShape = y - el.y;
                    const canvasCtx = ctx.canvasRef?.getContext("2d");
                    let headerHeight = 30;
                    if (el.containerText && canvasCtx) {
                        const metrics = measureContainerText(canvasCtx, el, el.containerText, el.width - 10);
                        headerHeight = Math.max(30, metrics.textHeight + 20);
                    }

                    let attrHeight = 20;
                    if (el.attributesText && canvasCtx) {
                        const metrics = measureContainerText(canvasCtx, { ...el, fontSize: (el.fontSize || 28) * 0.9 }, el.attributesText, el.width - 10);
                        attrHeight = Math.max(20, metrics.textHeight + 10);
                    }

                    if (clickYRelativeToShape < headerHeight) {
                        prop = 'containerText';
                        text = el.containerText || '';
                    } else if (clickYRelativeToShape < headerHeight + attrHeight) {
                        prop = 'attributesText';
                        text = el.attributesText || '';
                    } else {
                        prop = 'methodsText';
                        text = el.methodsText || '';
                    }
                } else if (el.type === 'umlState') {
                    const clickYRelativeToShape = y - el.y;
                    const canvasCtx = ctx.canvasRef?.getContext("2d");
                    let headerHeight = 35;
                    if (el.containerText && canvasCtx) {
                        const metrics = measureContainerText(canvasCtx, el, el.containerText, el.width - 20);
                        headerHeight = Math.max(35, metrics.textHeight + 15);
                    }
                    if (clickYRelativeToShape < headerHeight) {
                        prop = 'containerText';
                        text = el.containerText || '';
                    } else {
                        prop = 'attributesText';
                        text = el.attributesText || '';
                    }
                } else if (el.type === 'umlFragment') {
                    const clickYRelativeToShape = y - el.y;
                    const clickXRelativeToShape = x - el.x;
                    const tabW = Math.min(el.width * 0.3, 60);
                    const tabH = Math.min(el.height * 0.12, 22) + 5;

                    if (clickXRelativeToShape < tabW && clickYRelativeToShape < tabH) {
                        prop = 'containerText';
                        text = el.containerText || '';
                    } else {
                        prop = 'attributesText';
                        text = el.attributesText || '';
                    }
                } else if (el.type === 'text') {
                    prop = 'text';
                    text = el.text || '';
                }

                batch(() => {
                    ctx.setEditingProperty(prop);
                    ctx.setEditText(text);
                    ctx.setEditingId(el.id); // must be last — triggers <Show> render
                });

                setTimeout(() => {
                    ctx.textInputRef?.focus();
                    ctx.textInputRef?.select();
                }, 0);
                return;
            }
            break;
        }
    }
}
