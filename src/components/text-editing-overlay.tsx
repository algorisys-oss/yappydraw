/**
 * Text Editing Overlay
 * Renders the floating textarea for editing text on canvas elements.
 * Handles UML class section positioning, table cell editing, auto-resize, and blur/escape commits.
 * Extracted from canvas.tsx.
 */

import { type Component, createEffect, Show } from "solid-js";
import { store, setSelectedTool } from "../store/app-store";
import { measureContainerText, resolveFontFamily } from "../utils/text-utils";
import { getElementPreviewBaseState } from "../utils/animation/element-animator";
import type { TableEditingCell } from "../utils/tool-handlers/text-editing-handler";

interface TextEditingOverlayProps {
    editingId: () => string | null;
    setEditingId: (v: string | null) => void;
    editText: () => string;
    setEditText: (v: string) => void;
    editingProperty: () => 'text' | 'containerText' | 'attributesText' | 'methodsText' | 'tableCell';
    tableEditingCell?: () => TableEditingCell | null;
    canvasRef?: HTMLCanvasElement;
    onCommitText: () => void;
    onTextInputRef: (ref: HTMLTextAreaElement) => void;
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
                let textAlign = 'center';
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

                return (
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
                            }
                        }}
                        style={{
                            position: 'absolute',
                            top: `${centerY}px`,
                            left: `${centerX}px`,
                            transform: isTableCell ? 'none' : 'translate(-50%, -50%)',
                            width: `${Math.max(50, textareaWidth)}px`,
                            height: isTableCell ? `${cellHeight}px` : undefined,
                            'box-sizing': 'border-box',
                            font: `${fontStyle} ${fontWeight} ${fontSizeVal * scale}px ${fontFamily}`,
                            color: el.textColor || el.strokeColor,
                            background: isTableCell ? 'rgba(255,255,255,0.95)' : 'transparent',
                            border: '1px dashed #007acc',
                            outline: 'none',
                            margin: 0,
                            padding: '4px',
                            resize: 'none',
                            overflow: 'hidden',
                            'min-height': isTableCell ? undefined : '1em',
                            'text-align': textAlign as any,
                            'line-height': isTableCell ? `${cellHeight - 8}px` : undefined
                        }}
                    />
                );
            }}
        </Show>
    );
};

export default TextEditingOverlay;
