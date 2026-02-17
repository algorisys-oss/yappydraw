/**
 * Text Editing Overlay
 * Renders the floating textarea for editing text on canvas elements.
 * Handles UML class section positioning, table cell editing, auto-resize, and blur/escape commits.
 * Extracted from canvas.tsx.
 */

import { type Component, createEffect, Show } from "solid-js";
import { Maximize2 } from "lucide-solid";
import { store, setSelectedTool } from "../store/app-store";
import { measureContainerText, resolveFontFamily } from "../utils/text-utils";
import { CanvasRenderer } from "../rendering/CanvasRenderer";
import { getElementPreviewBaseState } from "../utils/animation/element-animator";
import { normalizePoints } from "../utils/render-element";
import { getUIShapeDef } from "../config/ui-shape-defs";
import type { TableEditingCell } from "../utils/tool-handlers/text-editing-handler";

interface TextEditingOverlayProps {
    editingId: () => string | null;
    setEditingId: (v: string | null) => void;
    editText: () => string;
    setEditText: (v: string) => void;
    editingProperty: () => 'text' | 'containerText' | 'attributesText' | 'methodsText' | 'tableCell' | `bpmnLaneLabel:${number}`;
    tableEditingCell?: () => TableEditingCell | null;
    canvasRef?: HTMLCanvasElement;
    onCommitText: () => void;
    onTextInputRef: (ref: HTMLTextAreaElement) => void;
    onTableCellNavigate?: (direction: 'right' | 'left' | 'down' | 'up') => void;
    onExpand?: () => void;
}

const TextEditingOverlay: Component<TextEditingOverlayProps> = (props) => {
    let textInputRef: HTMLTextAreaElement | undefined;

    const activeTextElement = () => {
        const id = props.editingId();
        if (!id) return null;
        return store.elements.find(e => e.id === id);
    };

    const handleTextBlur = () => {
        if (props.editingId()) {
            props.onCommitText();
            // After creating a new text element, switch back to selection (unless tool is locked)
            if (store.selectedTool === 'text' && !store.toolLocked) {
                setSelectedTool('selection');
            }
        }
    };

    // Auto-resize textarea to fit content (skip for fixed-height elements)
    createEffect(() => {
        void props.editText(); // track text changes for re-run
        if (props.editingId() && textInputRef) {
            const el = activeTextElement();
            if (props.editingProperty() === 'tableCell') {
                // Table cells have a fixed height — don't auto-resize
                return;
            }
            if (el && (el.type === 'text' || el.type === 'richtext')) {
                // Standalone text elements use computed vertical padding — don't auto-resize
                return;
            }
            // Container shapes use fixed height matching element — don't auto-resize
            const isConnector = el && (el.type === 'organicBranch' || ((el.type === 'line' || el.type === 'arrow') && el.controlPoints && el.controlPoints.length > 0));
            if (el && !isConnector && props.editingProperty() === 'containerText') {
                return;
            }
            textInputRef.style.height = 'auto';
            textInputRef.style.height = textInputRef.scrollHeight + 'px';
        }
    });

    // Focus textarea when editing starts
    createEffect(() => {
        if (props.editingId()) {
            // Use rAF to ensure the textarea has been rendered by the <Show> block
            requestAnimationFrame(() => {
                textInputRef?.focus();
                textInputRef?.select();
            });
        }
    });

    return (
        <Show when={props.editingId() && activeTextElement()}>
            {(_) => {
                const el = activeTextElement()!;
                const baseState = getElementPreviewBaseState(el.id);
                const elX = baseState ? baseState.x : el.x;
                const elY = baseState ? baseState.y : el.y;
                const elW = baseState ? baseState.width : el.width;
                const elH = baseState ? baseState.height : el.height;
                const { scale, panX, panY } = store.viewState;

                // Calculate Center based on Editing Property
                let centerX = (elX + elW / 2) * scale + panX;
                let centerY = (elY + elH / 2) * scale + panY;
                let textAlign = el.textAlign || 'center';
                let fontSizeVal = el.fontSize || (el.type === 'text' ? 20 : 28);
                let textareaWidth = elW * scale;

                // Table cell positioning — anchor to top-left of cell
                let isTableCell = false;
                let cellHeight = 0;
                if (props.editingProperty() === 'tableCell' && props.tableEditingCell) {
                    const cell = props.tableEditingCell();
                    if (cell) {
                        isTableCell = true;
                        centerX = cell.cellX * scale + panX;
                        centerY = cell.cellY * scale + panY;
                        textareaWidth = cell.cellW * scale;
                        cellHeight = cell.cellH * scale;
                        fontSizeVal = el.fontSize ?? 14;
                    }
                } else if (el.type === 'organicBranch') {
                    // Position at the bezier curve midpoint (matching path-renderer text position)
                    const pts = normalizePoints(el.points);
                    const controls = el.controlPoints || [];
                    if (pts.length >= 2 && controls.length >= 2) {
                        const start = { x: elX + pts[0].x, y: elY + pts[0].y };
                        const end = { x: elX + pts[pts.length - 1].x, y: elY + pts[pts.length - 1].y };
                        const cp1 = controls[0];
                        const cp2 = controls[1];
                        // Cubic bezier at t=0.5
                        const t = 0.5, k = 0.5;
                        const midX = k*k*k*start.x + 3*k*k*t*cp1.x + 3*k*t*t*cp2.x + t*t*t*end.x;
                        const midY = k*k*k*start.y + 3*k*k*t*cp1.y + 3*k*t*t*cp2.y + t*t*t*end.y;
                        centerX = midX * scale + panX;
                        centerY = (midY - 15) * scale + panY; // offset up like renderer's textOffset
                        textareaWidth = Math.max(200, Math.abs(elW) * scale);
                    }
                    fontSizeVal = el.fontSize || 16;
                } else if ((el.type === 'line' || el.type === 'arrow') && el.controlPoints && el.controlPoints.length > 0) {
                    // Position at bezier curve midpoint for lines/arrows with control points
                    const startPt = { x: elX, y: elY };
                    const endPt = { x: elX + elW, y: elY + elH };
                    const cp = el.controlPoints[0];

                    if (el.controlPoints.length === 1) {
                        // Quadratic bezier midpoint
                        const midX = 0.25 * startPt.x + 0.5 * cp.x + 0.25 * endPt.x;
                        const midY = 0.25 * startPt.y + 0.5 * cp.y + 0.25 * endPt.y;
                        centerX = midX * scale + panX;
                        centerY = (midY - 15) * scale + panY;
                    } else {
                        // Cubic bezier midpoint (2 CPs)
                        const cp2 = el.controlPoints[1];
                        const t = 0.5, k = 0.5;
                        const midX = k*k*k*startPt.x + 3*k*k*t*cp.x + 3*k*t*t*cp2.x + t*t*t*endPt.x;
                        const midY = k*k*k*startPt.y + 3*k*k*t*cp.y + 3*k*t*t*cp2.y + t*t*t*endPt.y;
                        centerX = midX * scale + panX;
                        centerY = (midY - 15) * scale + panY;
                    }
                    textareaWidth = Math.max(200, Math.abs(elW) * scale);
                    fontSizeVal = el.fontSize || 14;
                } else if (el.type === 'umlClass') {
                    const prop = props.editingProperty();
                    if (prop === 'attributesText' || prop === 'methodsText') {
                        textAlign = 'left';
                        fontSizeVal = fontSizeVal * 0.9;

                        // Re-calculate layout to find Y position
                        const rawCtx = props.canvasRef ? props.canvasRef.getContext("2d") : null;
                        const renderer = rawCtx ? new CanvasRenderer(rawCtx) : null;
                        let headerHeight = 30;
                        if (el.containerText && renderer) {
                            const metrics = measureContainerText(renderer, el, el.containerText, el.width - 10);
                            headerHeight = Math.max(30, metrics.textHeight + 20);
                        }

                        let attrOffsetY = headerHeight;
                        let attrHeight = 20;
                        if (el.attributesText && renderer) {
                            const metrics = measureContainerText(renderer, { ...el, fontSize: fontSizeVal }, el.attributesText, el.width - 10);
                            attrHeight = Math.max(20, metrics.textHeight + 10);
                        }

                        if (prop === 'attributesText') {
                            centerY = (elY + attrOffsetY + attrHeight / 2) * scale + panY;
                            centerX = (elX + elW / 2) * scale + panX; // Keep X center but align text left
                        } else if (prop === 'methodsText') {
                            // Methods start after attributes
                            const methodOffsetY = attrOffsetY + attrHeight;
                            centerY = (elY + methodOffsetY + 20) * scale + panY;
                            centerX = (elX + elW / 2) * scale + panX;
                        }
                    }
                }

                const fontFamily = resolveFontFamily(el.fontFamily);
                const fontWeight = el.fontWeight || 'normal';
                const fontStyle = el.fontStyle || 'normal';

                // For text elements and shapes, use element height for vertical centering
                const isConnectorType = el.type === 'organicBranch' || ((el.type === 'line' || el.type === 'arrow') && el.controlPoints && el.controlPoints.length > 0);
                const textareaHeight = isTableCell ? cellHeight
                    : isConnectorType ? Math.max(40, fontSizeVal * scale * 2)
                    : elH * scale;
                const lineHeightPx = fontSizeVal * scale * 1.2;

                const isStandaloneText = el.type === 'text' || el.type === 'richtext';
                // Container shapes: editing containerText on regular shapes (not connectors)
                const isContainerShape = !isStandaloneText && !isTableCell && !isConnectorType
                    && props.editingProperty() === 'containerText';
                // Use top-left anchoring for text elements AND container shapes
                const useTopLeftAnchor = isStandaloneText || isContainerShape;

                let textPaddingTop = 4; // default textarea padding
                let textPaddingH = 4; // horizontal padding

                // For standalone text/richtext: compute vertical padding to match canvas renderer
                if (isStandaloneText) {
                    const scaledFontSize = fontSizeVal * scale;
                    const numLines = Math.max(1, (props.editText() || '').split('\n').length);
                    const totalTextH = (numLines - 1) * lineHeightPx + scaledFontSize;
                    const vAlign = el.verticalAlign || 'middle';
                    if (vAlign === 'top') {
                        textPaddingTop = 4 * scale;
                    } else if (vAlign === 'middle') {
                        textPaddingTop = Math.max(0, (textareaHeight - totalTextH) / 2);
                    } else if (vAlign === 'bottom') {
                        textPaddingTop = Math.max(0, textareaHeight - totalTextH - 4 * scale);
                    }
                }

                // For container shapes: compute vertical padding matching render-pipeline.ts
                // Canvas formula: startY = cy - textHeight/2 + lineHeight/2 + startYOffset
                if (isContainerShape) {
                    const rawCtx = props.canvasRef ? props.canvasRef.getContext("2d") : null;
                    const renderer = rawCtx ? new CanvasRenderer(rawCtx) : null;
                    if (renderer) {
                        const maxWidth = elW - 20;
                        const text = props.editText() || ' ';
                        const metrics = measureContainerText(renderer, el, text, maxWidth);

                        // Shape-specific Y offset (matching render-pipeline.ts)
                        let startYOffset = 0;
                        if (el.type === 'doubleBanner') startYOffset = -(elH * 0.1);
                        else if (el.type === 'starPerson') startYOffset = elH * 0.15;
                        else if (el.type === 'lightbulb') startYOffset = -(elH * 0.1);
                        else if (el.type === 'signpost') startYOffset = -(elH * 0.15);
                        else {
                            const uiDef = getUIShapeDef(el.type);
                            if (uiDef?.textYOffset) startYOffset = uiDef.textYOffset(el);
                        }

                        textPaddingTop = Math.max(0, (elH / 2 - metrics.textHeight / 2 + startYOffset) * scale);
                    }
                    textPaddingH = 10 * scale; // match canvas 10px horizontal margin
                }

                // Anchor at element top-left for text and shapes to avoid
                // translate(-50%,-50%) depending on rendered content size
                const posTop = useTopLeftAnchor
                    ? elY * scale + panY
                    : isTableCell ? centerY : centerY;
                const posLeft = useTopLeftAnchor
                    ? elX * scale + panX
                    : isTableCell ? centerX : centerX;
                const posTransform = useTopLeftAnchor
                    ? 'none'
                    : isTableCell ? 'none' : 'translate(-50%, -50%)';

                return (
                    <div
                        style={{
                            position: 'absolute',
                            top: `${posTop}px`,
                            left: `${posLeft}px`,
                            transform: posTransform,
                            width: `${Math.max(50, textareaWidth)}px`,
                            height: useTopLeftAnchor ? `${textareaHeight}px` : undefined,
                            'min-height': useTopLeftAnchor ? undefined : `${textareaHeight}px`,
                            display: 'flex',
                            'align-items': useTopLeftAnchor ? 'flex-start' : 'center',
                            'justify-content': 'center',
                            'box-sizing': 'border-box',
                            border: useTopLeftAnchor ? 'none' : '1px dashed #007acc',
                            overflow: useTopLeftAnchor ? 'hidden' : undefined,
                            background: isTableCell ? 'rgba(255,255,255,0.95)'
                                : (el.type?.startsWith('ds') ? 'rgba(255,255,255,0.9)' : 'transparent'),
                        }}
                    >
                        <Show when={!isTableCell && props.onExpand}>
                            <button
                                title="Expand Editor"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => props.onExpand?.()}
                                style={{
                                    position: 'absolute',
                                    top: '-28px',
                                    right: '0',
                                    width: '24px',
                                    height: '24px',
                                    background: 'var(--bg-panel, #ffffff)',
                                    border: '1px solid var(--border-color, #e5e7eb)',
                                    'border-radius': '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    'align-items': 'center',
                                    'justify-content': 'center',
                                    color: 'var(--text-secondary, #6b7280)',
                                    'box-shadow': '0 1px 3px rgba(0,0,0,0.1)',
                                    padding: '0',
                                    'z-index': '1',
                                }}
                            >
                                <Maximize2 size={12} />
                            </button>
                        </Show>
                        <textarea
                            ref={(el) => {
                                textInputRef = el;
                                props.onTextInputRef(el);
                                // Native keydown handler — takes full control of Enter to guarantee newlines
                                el.addEventListener('keydown', (e) => {
                                    if (e.key === 'Escape') {
                                        e.preventDefault();
                                        e.stopImmediatePropagation();
                                        props.onCommitText();
                                        if (!store.toolLocked) {
                                            setSelectedTool('selection');
                                        }
                                        return;
                                    }
                                    // Table cell navigation
                                    if (props.editingProperty() === 'tableCell' && props.onTableCellNavigate) {
                                        if (e.key === 'Tab') {
                                            e.preventDefault();
                                            e.stopImmediatePropagation();
                                            props.onCommitText();
                                            props.onTableCellNavigate(e.shiftKey ? 'left' : 'right');
                                            return;
                                        }
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            e.stopImmediatePropagation();
                                            props.onCommitText();
                                            props.onTableCellNavigate('down');
                                            return;
                                        }
                                    }
                                    // Always manually handle Enter — don't rely on browser default
                                    // This guarantees newlines work regardless of capture-phase interference
                                    if (e.key === 'Enter' && props.editingProperty() !== 'tableCell') {
                                        e.preventDefault();
                                        e.stopImmediatePropagation();
                                        const ta = el;
                                        const start = ta.selectionStart;
                                        const end = ta.selectionEnd;
                                        const val = ta.value;
                                        const newVal = val.slice(0, start) + '\n' + val.slice(end);
                                        ta.value = newVal;
                                        ta.selectionStart = ta.selectionEnd = start + 1;
                                        props.setEditText(newVal);
                                        return;
                                    }
                                    // Stop propagation for all keys to prevent global hotkeys from interfering
                                    e.stopImmediatePropagation();
                                });
                            }}
                            value={props.editText()}
                            onInput={(e) => props.setEditText(e.currentTarget.value)}
                            onBlur={handleTextBlur}
                            style={{
                                width: '100%',
                                height: useTopLeftAnchor ? '100%' : undefined,
                                'box-sizing': 'border-box',
                                font: `${fontStyle} ${fontWeight} ${fontSizeVal * scale}px ${fontFamily}`,
                                color: el.textColor || el.strokeColor,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                margin: 0,
                                padding: useTopLeftAnchor
                                    ? `${textPaddingTop}px ${textPaddingH}px 0 ${textPaddingH}px`
                                    : '4px',
                                resize: 'none',
                                overflow: 'hidden',
                                'text-align': textAlign as any,
                                'line-height': `${lineHeightPx}px`
                            }}
                        />
                    </div>
                );
            }}
        </Show>
    );
};

export default TextEditingOverlay;
