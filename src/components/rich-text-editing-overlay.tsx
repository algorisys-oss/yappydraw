/**
 * Rich Text Editing Overlay
 * Renders a contenteditable div with a mini formatting toolbar for per-span rich text editing.
 * Used instead of the plain textarea when rich text mode is enabled.
 */

import { type Component, createEffect, createSignal, onCleanup, Show } from "solid-js";
import { Maximize2 } from "lucide-solid";
import { store, setSelectedTool } from "../store/app-store";
import { resolveFontFamily } from "../utils/text-utils";
import { spansToHtml, htmlToSpans, spansToPlainText } from "../utils/rich-text-utils";
import { getElementPreviewBaseState } from "../utils/animation/element-animator";
import type { RichTextSpan } from "../types";
import "./rich-text-editing-overlay.css";

interface RichTextEditingOverlayProps {
    editingId: () => string | null;
    setEditingId: (v: string | null) => void;
    editingProperty: () => 'text' | 'containerText';
    richTextSpans: () => RichTextSpan[];
    setRichTextSpans: (v: RichTextSpan[]) => void;
    setEditText: (v: string) => void;
    onCommitRichText: () => void;
    onExpand?: () => void;
}

const TOOLBAR_COLORS = [
    '#000000', '#e03131', '#e8590c', '#fcc419',
    '#2f9e44', '#1971c2', '#6741d9', '#ffffff'
];

const RichTextEditingOverlay: Component<RichTextEditingOverlayProps> = (props) => {
    let editorRef: HTMLDivElement | undefined;
    const [showColorPicker, setShowColorPicker] = createSignal(false);
    const [activeFormats, setActiveFormats] = createSignal<{
        bold: boolean; italic: boolean; underline: boolean; strikethrough: boolean;
    }>({ bold: false, italic: false, underline: false, strikethrough: false });

    const activeTextElement = () => {
        const id = props.editingId();
        if (!id) return null;
        return store.elements.find(e => e.id === id);
    };

    const updateActiveFormats = () => {
        setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikethrough: document.queryCommandState('strikeThrough'),
        });
    };

    /** Sync the richTextSpans signal with the current contenteditable DOM */
    const syncSpans = () => {
        if (editorRef && props.editingId()) {
            const spans = htmlToSpans(editorRef);
            props.setRichTextSpans(spans);
        }
    };

    const execFormat = (command: string, value?: string) => {
        editorRef?.focus();
        document.execCommand(command, false, value);
        updateActiveFormats();
        syncSpans();
    };

    const handleCommit = () => {
        if (!editorRef || !props.editingId()) return;
        const spans = htmlToSpans(editorRef);
        props.setRichTextSpans(spans);
        props.setEditText(spansToPlainText(spans));
        props.onCommitRichText();
    };

    const handleBlur = (e: FocusEvent) => {
        // Don't commit if clicking within the toolbar
        const related = e.relatedTarget as HTMLElement | null;
        if (related?.closest('.rt-toolbar')) return;
        if (related?.closest('.rt-color-popover')) return;
        handleCommit();
        if (store.selectedTool === 'text') {
            setSelectedTool('selection');
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            handleCommit();
            setSelectedTool('selection');
            return;
        }
        // Update format state after key combo
        setTimeout(updateActiveFormats, 0);
    };

    // Close color picker on outside click
    const handleDocClick = (e: MouseEvent) => {
        if (showColorPicker() && !(e.target as HTMLElement)?.closest('.rt-color-wrapper')) {
            setShowColorPicker(false);
        }
    };

    createEffect(() => {
        if (props.editingId()) {
            document.addEventListener('mousedown', handleDocClick);
            onCleanup(() => document.removeEventListener('mousedown', handleDocClick));
        }
    });

    // Populate editor with initial HTML and focus (only when editing starts)
    let lastPopulatedId: string | null = null;
    createEffect(() => {
        const id = props.editingId();
        if (id && id !== lastPopulatedId && editorRef) {
            const spans = props.richTextSpans();
            if (spans.length > 0) {
                lastPopulatedId = id;
                requestAnimationFrame(() => {
                    if (!editorRef) return;
                    editorRef.innerHTML = spansToHtml(spans);
                    editorRef.focus();
                    // Select all text
                    const sel = window.getSelection();
                    if (sel) {
                        const range = document.createRange();
                        range.selectNodeContents(editorRef);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                    updateActiveFormats();
                });
            }
        } else if (!id) {
            lastPopulatedId = null;
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

                const centerX = (elX + elW / 2) * scale + panX;
                const centerY = (elY + elH / 2) * scale + panY;
                const fontSizeVal = el.fontSize || (el.type === 'text' ? 20 : 28);
                const fontFamily = resolveFontFamily(el.fontFamily);
                const textareaWidth = elW * scale;
                const textareaHeight = elH * scale;
                const textAlign = el.textAlign || (el.type === 'text' ? 'left' : 'center');

                return (
                    <div class="rt-overlay-wrapper" style={{
                        position: 'absolute',
                        top: `${centerY}px`,
                        left: `${centerX}px`,
                        transform: 'translate(-50%, -50%)',
                    }}>
                        {/* Mini formatting toolbar */}
                        <div class="rt-toolbar" onMouseDown={(e) => e.preventDefault()}>
                            <button
                                class={`rt-toolbar-btn ${activeFormats().bold ? 'active' : ''}`}
                                title="Bold (Ctrl+B)"
                                onClick={() => execFormat('bold')}
                            ><b>B</b></button>
                            <button
                                class={`rt-toolbar-btn ${activeFormats().italic ? 'active' : ''}`}
                                title="Italic (Ctrl+I)"
                                onClick={() => execFormat('italic')}
                            ><i>I</i></button>
                            <button
                                class={`rt-toolbar-btn ${activeFormats().underline ? 'active' : ''}`}
                                title="Underline (Ctrl+U)"
                                onClick={() => execFormat('underline')}
                            ><u>U</u></button>
                            <button
                                class={`rt-toolbar-btn ${activeFormats().strikethrough ? 'active' : ''}`}
                                title="Strikethrough"
                                onClick={() => execFormat('strikeThrough')}
                            ><s>S</s></button>
                            <span class="rt-toolbar-divider" />
                            <div class="rt-color-wrapper">
                                <button
                                    class="rt-toolbar-btn rt-color-btn"
                                    title="Text Color"
                                    onClick={() => setShowColorPicker(!showColorPicker())}
                                >
                                    <span class="rt-color-icon">A</span>
                                </button>
                                <Show when={showColorPicker()}>
                                    <div class="rt-color-popover">
                                        {TOOLBAR_COLORS.map(color => (
                                            <button
                                                class="rt-color-swatch"
                                                style={{ background: color, border: color === '#ffffff' ? '1px solid #d1d5db' : 'none' }}
                                                onClick={() => {
                                                    execFormat('foreColor', color);
                                                    setShowColorPicker(false);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </Show>
                            </div>
                            <Show when={props.onExpand}>
                                <span class="rt-toolbar-divider" />
                                <button class="rt-toolbar-btn" title="Expand Editor" onClick={() => props.onExpand?.()}>
                                    <Maximize2 size={14} />
                                </button>
                            </Show>
                        </div>
                        {/* Contenteditable editor */}
                        <div
                            ref={editorRef}
                            contentEditable
                            class="rt-editor"
                            style={{
                                width: `${Math.max(50, textareaWidth)}px`,
                                'min-height': `${textareaHeight}px`,
                                font: `${fontSizeVal * scale}px ${fontFamily}`,
                                color: el.textColor || el.strokeColor,
                                'text-align': textAlign,
                                'line-height': `${fontSizeVal * scale * 1.2}px`,
                            }}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            onInput={() => { updateActiveFormats(); syncSpans(); }}
                            onMouseUp={() => updateActiveFormats()}
                        />
                    </div>
                );
            }}
        </Show>
    );
};

export default RichTextEditingOverlay;
