/**
 * Text Editing Handler
 * Handles double-click text editing and text commit logic.
 * Extracted from canvas.tsx commitText/handleDoubleClick.
 */

import { batch } from 'solid-js';
import type { DrawingElement, RichTextSpan } from '../../types';
import { store, updateElement, deleteElements, isLayerVisible } from '../../store/app-store';
import { hitTestElement } from '../hit-testing';
import { getHandleAtPosition } from '../handle-detection';
import { fitShapeToText, fitUmlClassToContent, measureContainerText, measureWrappedTextHeight, measureVerticalText } from '../text-utils';
import { CanvasRenderer } from '../../rendering/CanvasRenderer';
import { computeCellRects, defaultColWidths, defaultRowHeights, defaultTableData, hitTestTableCell } from '../table-utils';
import { spansToPlainText, plainTextToSpans } from '../rich-text-utils';

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

export type EditingPropertyType = 'text' | 'containerText' | 'attributesText' | 'methodsText' | 'tableCell' | `bpmnLaneLabel:${number}`;

export interface TextEditingContext {
    editingId: () => string | null;
    setEditingId: (v: string | null) => void;
    editingProperty: () => EditingPropertyType;
    setEditingProperty: (v: EditingPropertyType) => void;
    editText: () => string;
    setEditText: (v: string) => void;
    richTextSpans: () => RichTextSpan[];
    setRichTextSpans: (v: RichTextSpan[]) => void;
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

    // BPMN lane label editing
    const editProp = ctx.editingProperty();
    if (typeof editProp === 'string' && editProp.startsWith('bpmnLaneLabel:')) {
        const laneIndex = parseInt(editProp.split(':')[1], 10);
        const labels = el.bpmnLaneLabels ? [...el.bpmnLaneLabels] : [];
        while (labels.length <= laneIndex) labels.push('');
        labels[laneIndex] = newText;
        updateElement(id, { bpmnLaneLabels: labels }, true);
        ctx.setEditingId(null);
        ctx.setEditText("");
        requestAnimationFrame(ctx.redrawFn);
        return;
    }

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

    // For standalone text/richtext elements, preserve width and recalculate height based on wrapped text
    if (el.type === 'text' || el.type === 'richtext') {
        if (newText) {
            if (el.verticalText) {
                // Vertical type: re-flow into columns and resize the box to fit.
                const v = measureVerticalText({ ...el, text: newText });
                updateElement(id, { text: newText, width: Math.round(v.width), height: Math.round(v.height) }, true);
            } else {
                const fontSize = el.fontSize || 28;
                // Preserve existing width, recalculate height based on wrapped content
                const existingWidth = el.width || 200;
                const height = measureWrappedTextHeight(newText, existingWidth, fontSize, el.fontFamily);
                const finalHeight = Math.max(height, fontSize * 1.2);

                updateElement(id, { text: newText, height: finalHeight }, true);
            }
        } else {
            deleteElements([id]);
        }
    } else {
        // For shapes with containerText
        const isLine = el.type === 'line' || el.type === 'arrow' || el.type === 'organicBranch';
        const prop = ctx.editingProperty();

        // UML class: update text + reset scroll for edited section
        if (el.type === 'umlClass') {
            const scrollResets: Record<string, any> = {};
            if (prop === 'attributesText') scrollResets.umlAttrScrollY = 0;
            if (prop === 'methodsText') scrollResets.umlMethodsScrollY = 0;

            // Auto-grow only in non-fixed-size mode
            if (el.umlHeaderHeight === undefined && el.umlAttrHeight === undefined && ctx.canvasRef) {
                const canvasCtx = ctx.canvasRef.getContext("2d");
                if (canvasCtx) {
                    const updated = { ...el, [prop]: newText } as Partial<DrawingElement>;
                    const dims = fitUmlClassToContent(new CanvasRenderer(canvasCtx), updated);
                    const newHeight = dims.height > el.height ? dims.height : el.height;
                    updateElement(id, {
                        [prop]: newText,
                        ...scrollResets,
                        ...(newHeight !== el.height && { height: newHeight }),
                    }, true);
                } else {
                    updateElement(id, { [prop]: newText, ...scrollResets }, true);
                }
            } else {
                updateElement(id, { [prop]: newText, ...scrollResets }, true);
            }
        } else if (el.type === 'umlInterface') {
            // Reset methods scroll on edit
            const scrollResets: Record<string, any> = {};
            if (prop === 'methodsText') scrollResets.umlMethodsScrollY = 0;
            updateElement(id, { [prop]: newText, ...scrollResets }, true);
        } else if (el.type === 'umlEnum' || el.type === 'umlState') {
            // Reset body scroll on edit
            const scrollResets: Record<string, any> = {};
            if (prop === 'attributesText') scrollResets.umlAttrScrollY = 0;
            updateElement(id, { [prop]: newText, ...scrollResets }, true);
        } else if (el.autoResize && ctx.canvasRef && !isLine && prop === 'containerText') {
            const canvasCtx = ctx.canvasRef.getContext("2d");
            if (canvasCtx) {
                const dims = fitShapeToText(new CanvasRenderer(canvasCtx), el, newText);
                updateElement(id, {
                    [prop]: newText,
                    width: dims.width,
                    height: dims.height,
                }, true);
            } else {
                updateElement(id, { [prop]: newText }, true);
            }
        } else if (isLine && newText) {
            // Auto-enable text highlight with white background for line shapes
            updateElement(id, {
                [prop]: newText,
                textHighlightEnabled: true,
                textHighlightColor: 'rgba(255,255,255,0.85)',
            }, true);
        } else {
            updateElement(id, { [prop]: newText }, true);
        }
    }

    ctx.setEditingId(null);
    ctx.setEditText("");
    requestAnimationFrame(ctx.redrawFn);
}

// ─── Commit Rich Text ────────────────────────────────────────────────

export function commitRichText(ctx: TextEditingContext): void {
    const id = ctx.editingId();
    if (!id) return;
    const el = store.elements.find(e => e.id === id);
    if (!el) return;

    const spans = ctx.richTextSpans();
    const plainText = spansToPlainText(spans).trim();

    if (el.type === 'text' || el.type === 'richtext') {
        if (plainText) {
            const fontSize = el.fontSize || 20;
            const existingWidth = el.width || 200;
            const height = measureWrappedTextHeight(plainText, existingWidth, fontSize, el.fontFamily);
            const finalHeight = Math.max(height, fontSize * 1.2);
            updateElement(id, { richText: spans, text: plainText, height: finalHeight }, true);
        } else {
            deleteElements([id]);
        }
    } else {
        // Shape with container text
        const richKey = 'richContainerText';
        const textKey = 'containerText';

        if (el.autoResize && ctx.canvasRef) {
            const canvasCtx = ctx.canvasRef.getContext("2d");
            if (canvasCtx) {
                const dims = fitShapeToText(new CanvasRenderer(canvasCtx), el, plainText);
                updateElement(id, {
                    [richKey]: spans,
                    [textKey]: plainText,
                    width: dims.width,
                    height: dims.height,
                }, true);
            } else {
                updateElement(id, { [richKey]: spans, [textKey]: plainText }, true);
            }
        } else {
            updateElement(id, { [richKey]: spans, [textKey]: plainText }, true);
        }
    }

    ctx.setEditingId(null);
    ctx.setEditText("");
    ctx.setRichTextSpans([]);
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

            // Only allow editing containerText for shapes and lines
            // (line/arrow/bezier double-click now opens text editing instead of adding control points)
            const shapeTypes = ['rectangle', 'circle', 'diamond', 'line', 'arrow', 'bezier', 'text', 'richtext', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'polygon', 'star', 'cloud', 'heart', 'cross', 'checkmark', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'bracketLeft', 'bracketRight', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'starPerson', 'scroll', 'wavyDivider', 'doubleBanner', 'lightbulb', 'signpost', 'burstBlob', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch', 'card', 'searchBar', 'progressBar', 'avatar', 'navbar', 'tabBar', 'badge', 'tooltip', 'slider', 'trophy', 'clock', 'gear', 'target', 'rocket', 'flag', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'openBox', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlState', 'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface', 'umlNode', 'umlArtifact', 'umlObject', 'umlAction', 'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble', 'stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp', 'faceHappy', 'faceSad', 'faceConfused', 'checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp', 'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield', 'barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'table', 'puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain', 'organicBranch', 'codeBlock', 'dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable', 'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity', 'bpmnDataObject', 'bpmnAnnotation', 'bpmnPool', 'bpmnEventGateway', 'bpmnDataStore', 'bpmnGroup', 'fineliner', 'inkbrush', 'marker', 'path'];
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

                    // Use persisted heights if available, otherwise calculate dynamically
                    let headerHeight: number;
                    let attrHeight: number;

                    if (el.umlHeaderHeight !== undefined) {
                        headerHeight = el.umlHeaderHeight;
                    } else {
                        headerHeight = 30;
                        const canvasCtx = ctx.canvasRef?.getContext("2d");
                        const renderer = canvasCtx ? new CanvasRenderer(canvasCtx) : null;
                        if (el.containerText && renderer) {
                            const metrics = measureContainerText(renderer, el, el.containerText, el.width - 10);
                            headerHeight = Math.max(30, metrics.textHeight + 20);
                        }
                    }

                    if (el.umlAttrHeight !== undefined) {
                        attrHeight = el.umlAttrHeight;
                    } else {
                        attrHeight = 20;
                        const canvasCtx = ctx.canvasRef?.getContext("2d");
                        const renderer = canvasCtx ? new CanvasRenderer(canvasCtx) : null;
                        if (el.attributesText && renderer) {
                            const metrics = measureContainerText(renderer, { ...el, fontSize: (el.fontSize || 28) * 0.9 }, el.attributesText, el.width - 10);
                            attrHeight = Math.max(20, metrics.textHeight + 10);
                        }
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
                } else if (el.type === 'umlState' || el.type === 'umlEnum') {
                    // 2-section: header + body (attributesText)
                    const clickYRelativeToShape = y - el.y;
                    let headerHeight: number;
                    if (el.umlHeaderHeight !== undefined) {
                        headerHeight = el.umlHeaderHeight;
                    } else {
                        headerHeight = 40;
                        const canvasCtx = ctx.canvasRef?.getContext("2d");
                        const renderer = canvasCtx ? new CanvasRenderer(canvasCtx) : null;
                        if (el.containerText && renderer) {
                            const metrics = measureContainerText(renderer, el, el.containerText, el.width - 20);
                            headerHeight = Math.max(40, metrics.textHeight + 30);
                        }
                    }
                    if (clickYRelativeToShape < headerHeight) {
                        prop = 'containerText';
                        text = el.containerText || '';
                    } else {
                        prop = 'attributesText';
                        text = el.attributesText || '';
                    }
                } else if (el.type === 'umlInterface') {
                    // 2-section: header + body (methodsText)
                    const clickYRelativeToShape = y - el.y;
                    let headerHeight: number;
                    if (el.umlHeaderHeight !== undefined) {
                        headerHeight = el.umlHeaderHeight;
                    } else {
                        headerHeight = 40;
                        const canvasCtx = ctx.canvasRef?.getContext("2d");
                        const renderer = canvasCtx ? new CanvasRenderer(canvasCtx) : null;
                        if (el.containerText && renderer) {
                            const metrics = measureContainerText(renderer, el, el.containerText, el.width - 20);
                            headerHeight = Math.max(40, metrics.textHeight + 30);
                        }
                    }
                    if (clickYRelativeToShape < headerHeight) {
                        prop = 'containerText';
                        text = el.containerText || '';
                    } else {
                        prop = 'methodsText';
                        text = el.methodsText || '';
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
                } else if (el.type === 'bpmnPool') {
                    // Determine click zone: pool label, lane label, or body
                    const isVertical = el.bpmnOrientation === 'vertical';
                    const laneCount = el.bpmnLaneCount ?? 1;
                    const labels = el.bpmnLaneLabels ?? [];

                    if (isVertical) {
                        const poolLabelH = el.bpmnPoolLabelSize ?? Math.min(el.height * 0.08, 30);
                        const laneLabelH = laneCount > 1 ? (el.bpmnLaneLabelSize ?? Math.min(el.height * 0.06, 25)) : 0;
                        const clickY = y - el.y;
                        const clickX = x - el.x;

                        if (clickY < poolLabelH) {
                            // Pool name (top row)
                            prop = 'containerText';
                            text = el.containerText || '';
                        } else if (laneCount > 1 && clickY < poolLabelH + laneLabelH) {
                            // Lane label row - determine which lane by X
                            const laneW = el.width / laneCount;
                            const laneIndex = Math.min(Math.floor(clickX / laneW), laneCount - 1);
                            batch(() => {
                                ctx.setEditingProperty(`bpmnLaneLabel:${laneIndex}`);
                                ctx.setEditText(labels[laneIndex] || '');
                                ctx.setEditingId(el.id);
                            });
                            setTimeout(() => { ctx.textInputRef?.focus(); ctx.textInputRef?.select(); }, 0);
                            return;
                        } else {
                            prop = 'containerText';
                            text = el.containerText || '';
                        }
                    } else {
                        const poolLabelW = el.bpmnPoolLabelSize ?? Math.min(el.width * 0.06, 35);
                        const laneLabelW = laneCount > 1 ? (el.bpmnLaneLabelSize ?? Math.min(el.width * 0.05, 28)) : 0;
                        const clickX = x - el.x;

                        if (clickX < poolLabelW) {
                            // Pool name (left column)
                            prop = 'containerText';
                            text = el.containerText || '';
                        } else if (laneCount > 1 && clickX < poolLabelW + laneLabelW) {
                            // Lane label column - determine which lane by Y
                            const laneH = el.height / laneCount;
                            const clickY = y - el.y;
                            const laneIndex = Math.min(Math.floor(clickY / laneH), laneCount - 1);
                            batch(() => {
                                ctx.setEditingProperty(`bpmnLaneLabel:${laneIndex}`);
                                ctx.setEditText(labels[laneIndex] || '');
                                ctx.setEditingId(el.id);
                            });
                            setTimeout(() => { ctx.textInputRef?.focus(); ctx.textInputRef?.select(); }, 0);
                            return;
                        } else {
                            prop = 'containerText';
                            text = el.containerText || '';
                        }
                    }
                } else if (el.type === 'text' || el.type === 'richtext' || el.type === 'codeBlock' || el.type === 'dsArray' || el.type === 'dsStack' || el.type === 'dsQueue' || el.type === 'dsLinkedList' || el.type === 'dsBinaryTree' || el.type === 'dsHashTable') {
                    prop = 'text';
                    text = el.text || '';
                }

                // Load rich text spans if available
                const richSpans = (prop === 'text' && el.type === 'richtext') ? el.richText
                    : prop === 'text' ? el.richText
                    : prop === 'containerText' ? el.richContainerText
                    : undefined;

                // For richtext elements, convert plain text to spans if richText is missing
                let spansToSet: any[] = richSpans && richSpans.length > 0 ? richSpans : [];
                if (el.type === 'richtext' && spansToSet.length === 0 && text) {
                    spansToSet = plainTextToSpans(text);
                }

                batch(() => {
                    ctx.setEditingProperty(prop);
                    ctx.setEditText(text);
                    ctx.setRichTextSpans(spansToSet);
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
