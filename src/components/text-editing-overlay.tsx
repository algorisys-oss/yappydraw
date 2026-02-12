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
import { getElementPreviewBaseState } from "../utils/animation/element-animator";
import { normalizePoints } from "../utils/render-element";
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
            // After creating a new text element, switch back to selection
            if (store.selectedTool === 'text') {
                setSelectedTool('selection');
            }
        }
    };

    // Auto-resize textarea to fit content (skip for table cells which have fixed height)
    createEffect(() => {
        void props.editText(); // track text changes for re-run
        if (props.editingId() && textInputRef) {
            if (props.editingProperty() === 'tableCell') {
                // Table cells have a fixed height — don't auto-resize
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
                let fontSizeVal = el.fontSize || 28;
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
                } else if (el.type === 'umlClass') {
                    const prop = props.editingProperty();
                    if (prop === 'attributesText' || prop === 'methodsText') {
                        textAlign = 'left';
                        fontSizeVal = fontSizeVal * 0.9;

                        // Re-calculate layout to find Y position
                        const ctx = props.canvasRef ? props.canvasRef.getContext("2d") : null;
                        let headerHeight = 30;
                        if (el.containerText && ctx) {
                            const metrics = measureContainerText(ctx, el, el.containerText, el.width - 10);
                            headerHeight = Math.max(30, metrics.textHeight + 20);
                        }

                        let attrOffsetY = headerHeight;
                        let attrHeight = 20;
                        if (el.attributesText && ctx) {
                            const metrics = measureContainerText(ctx, { ...el, fontSize: fontSizeVal }, el.attributesText, el.width - 10);
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
                const textareaHeight = isTableCell ? cellHeight
                    : el.type === 'organicBranch' ? Math.max(40, fontSizeVal * scale * 2)
                    : elH * scale;
                const lineHeightPx = fontSizeVal * scale * 1.2;

                return (
                    <div
                        style={{
                            position: 'absolute',
                            top: `${centerY}px`,
                            left: `${centerX}px`,
                            transform: isTableCell ? 'none' : 'translate(-50%, -50%)',
                            width: `${Math.max(50, textareaWidth)}px`,
                            height: `${textareaHeight}px`,
                            display: 'flex',
                            'align-items': 'center',
                            'justify-content': 'center',
                            'box-sizing': 'border-box',
                            border: '1px dashed #007acc',
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
                            }}
                            value={props.editText()}
                            onInput={(e) => props.setEditText(e.currentTarget.value)}
                            onBlur={handleTextBlur}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    e.preventDefault();
                                    props.onCommitText();
                                    setSelectedTool('selection');
                                    return;
                                }
                                // Table cell navigation
                                if (props.editingProperty() === 'tableCell' && props.onTableCellNavigate) {
                                    if (e.key === 'Tab') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        props.onCommitText();
                                        props.onTableCellNavigate(e.shiftKey ? 'left' : 'right');
                                        return;
                                    }
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        props.onCommitText();
                                        props.onTableCellNavigate('down');
                                        return;
                                    }
                                    // Shift+Enter: allow default (newline in cell)
                                }
                            }}
                            style={{
                                width: '100%',
                                'max-height': '100%',
                                'box-sizing': 'border-box',
                                font: `${fontStyle} ${fontWeight} ${fontSizeVal * scale}px ${fontFamily}`,
                                color: el.textColor || el.strokeColor,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                margin: 0,
                                padding: '4px',
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
