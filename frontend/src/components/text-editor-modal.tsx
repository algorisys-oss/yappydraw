/**
 * Expanded Text Editor Modal
 * Provides a large, centered modal for comfortable editing of text and rich text content.
 * Adapts to current editing mode: contenteditable for rich text, textarea for plain text.
 */

import { type Component, createEffect, createSignal, onCleanup, Show } from "solid-js";
import { X, List, ListOrdered } from "lucide-solid";
import { resolveFontFamily } from "../utils/text-utils";
import { spansToHtml, htmlToSpans, spansToPlainText } from "../utils/rich-text-utils";
import type { RichTextSpan, DrawingElement } from "../types";
import "./text-editor-modal.css";
import "./rich-text-editing-overlay.css"; // reuse rt-toolbar-btn styles

interface TextEditorModalProps {
    isOpen: () => boolean;
    onClose: () => void;
    isRichText: () => boolean;
    richTextSpans: () => RichTextSpan[];
    setRichTextSpans: (v: RichTextSpan[]) => void;
    editText: () => string;
    setEditText: (v: string) => void;
    onCommit: () => void;
    element: () => DrawingElement | null;
}

const TOOLBAR_COLORS = [
    '#000000', '#e03131', '#e8590c', '#fcc419',
    '#2f9e44', '#1971c2', '#6741d9', '#ffffff'
];

const TextEditorModal: Component<TextEditorModalProps> = (props) => {
    let editorRef: HTMLDivElement | undefined;
    let textareaRef: HTMLTextAreaElement | undefined;
    const [showColorPicker, setShowColorPicker] = createSignal(false);
    const [activeFormats, setActiveFormats] = createSignal<{
        bold: boolean; italic: boolean; underline: boolean; strikethrough: boolean;
        bulletList: boolean; orderedList: boolean;
    }>({ bold: false, italic: false, underline: false, strikethrough: false, bulletList: false, orderedList: false });

    const updateActiveFormats = () => {
        setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikethrough: document.queryCommandState('strikeThrough'),
            bulletList: document.queryCommandState('insertUnorderedList'),
            orderedList: document.queryCommandState('insertOrderedList'),
        });
    };

    const syncSpans = () => {
        if (editorRef && props.isOpen()) {
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

    const handleDone = () => {
        if (props.isRichText() && editorRef) {
            const spans = htmlToSpans(editorRef);
            props.setRichTextSpans(spans);
            props.setEditText(spansToPlainText(spans));
        }
        props.onCommit();
        props.onClose();
    };

    // Escape key handler
    createEffect(() => {
        if (props.isOpen()) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    handleDone();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
        }
    });

    // Close color picker on outside click
    const handleDocClick = (e: MouseEvent) => {
        if (showColorPicker() && !(e.target as HTMLElement)?.closest('.rt-color-wrapper')) {
            setShowColorPicker(false);
        }
    };

    createEffect(() => {
        if (props.isOpen()) {
            document.addEventListener('mousedown', handleDocClick);
            onCleanup(() => document.removeEventListener('mousedown', handleDocClick));
        }
    });

    // Populate editor when modal opens
    let lastPopulated = false;
    createEffect(() => {
        if (props.isOpen() && !lastPopulated) {
            lastPopulated = true;
            requestAnimationFrame(() => {
                if (props.isRichText() && editorRef) {
                    const spans = props.richTextSpans();
                    if (spans.length > 0) {
                        editorRef.innerHTML = spansToHtml(spans);
                    }
                    editorRef.focus();
                    updateActiveFormats();
                } else if (textareaRef) {
                    textareaRef.focus();
                }
            });
        } else if (!props.isOpen()) {
            lastPopulated = false;
        }
    });

    const getFontStyle = () => {
        const el = props.element();
        if (!el) return {};
        const fontSize = el.fontSize || (el.type === 'text' ? 20 : 28);
        const fontFamily = resolveFontFamily(el.fontFamily);
        return {
            'font-family': fontFamily,
            'font-size': `${fontSize}px`,
            color: el.textColor || el.strokeColor || 'inherit',
        };
    };

    return (
        <Show when={props.isOpen()}>
            <div class="text-editor-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !window.getSelection()?.toString()) handleDone(); }}>
                <div class="text-editor-modal" onClick={(e) => e.stopPropagation()}>
                    <div class="text-editor-modal-header">
                        <h3>Edit Text</h3>
                        <button class="close-btn" onClick={handleDone}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Rich text toolbar */}
                    <Show when={props.isRichText()}>
                        <div class="text-editor-modal-toolbar" onMouseDown={(e) => e.preventDefault()}>
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
                            <button
                                class={`rt-toolbar-btn ${activeFormats().bulletList ? 'active' : ''}`}
                                title="Bullet List"
                                onClick={() => execFormat('insertUnorderedList')}
                            >
                                <List size={14} />
                            </button>
                            <button
                                class={`rt-toolbar-btn ${activeFormats().orderedList ? 'active' : ''}`}
                                title="Numbered List"
                                onClick={() => execFormat('insertOrderedList')}
                            >
                                <ListOrdered size={14} />
                            </button>
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
                        </div>
                    </Show>

                    <div class="text-editor-modal-body">
                        <Show when={props.isRichText()} fallback={
                            <textarea
                                ref={textareaRef}
                                class="text-editor-modal-textarea"
                                style={getFontStyle()}
                                value={props.editText()}
                                onInput={(e) => props.setEditText(e.currentTarget.value)}
                            />
                        }>
                            <div
                                ref={editorRef}
                                contentEditable
                                class="text-editor-modal-editor"
                                style={getFontStyle()}
                                onInput={() => { updateActiveFormats(); syncSpans(); }}
                                onMouseUp={() => updateActiveFormats()}
                                onKeyUp={() => updateActiveFormats()}
                            />
                        </Show>
                    </div>

                    <div class="text-editor-modal-footer">
                        <button class="text-editor-modal-done-btn" onClick={handleDone}>
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default TextEditorModal;
