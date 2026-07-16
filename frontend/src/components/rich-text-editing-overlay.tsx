/**
 * Rich Text Editing Overlay
 * Renders a contenteditable div with a mini formatting toolbar for per-span rich text editing.
 * Used instead of the plain textarea when rich text mode is enabled.
 */

import { type Component, createEffect, createSignal, onCleanup, Show } from "solid-js";
import { Maximize2, List, ListOrdered } from "lucide-solid";
import { store, setSelectedTool } from "../store/app-store";
import { RenderPipeline } from "../shapes/base/render-pipeline";
import { resolveFontFamily } from "../utils/text-utils";
import { spansToHtml, htmlToSpans, spansToPlainText } from "../utils/rich-text-utils";
import { getElementPreviewBaseState } from "../utils/animation/element-animator";
import { worldToScreen } from "../utils/viewport-transforms";
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

const TOOLBAR_FONTS = [
    { key: 'hand-drawn', label: 'Virgil' },
    { key: 'caveat', label: 'Caveat' },
    { key: 'marker', label: 'Marker' },
    { key: 'sans-serif', label: 'Inter' },
    { key: 'poppins', label: 'Poppins' },
    { key: 'serif', label: 'Merriweather' },
    { key: 'monospace', label: 'Source Code' },
    { key: 'code', label: 'JetBrains' },
];

const RichTextEditingOverlay: Component<RichTextEditingOverlayProps> = (props) => {
    let editorRef: HTMLDivElement | undefined;
    const [showColorPicker, setShowColorPicker] = createSignal(false);
    const [showFontPicker, setShowFontPicker] = createSignal(false);
    const [activeFormats, setActiveFormats] = createSignal<{
        bold: boolean; italic: boolean; underline: boolean; strikethrough: boolean;
        bulletList: boolean; orderedList: boolean;
    }>({ bold: false, italic: false, underline: false, strikethrough: false, bulletList: false, orderedList: false });

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
            bulletList: document.queryCommandState('insertUnorderedList'),
            orderedList: document.queryCommandState('insertOrderedList'),
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
        if (related?.closest('.rt-font-popover')) return;
        handleCommit();
        if ((store.selectedTool === 'text' || store.selectedTool === 'richtext') && !store.toolLocked) {
            setSelectedTool('selection');
        }
    };

    // Close color/font picker on outside click
    const handleDocClick = (e: MouseEvent) => {
        if (showColorPicker() && !(e.target as HTMLElement)?.closest('.rt-color-wrapper')) {
            setShowColorPicker(false);
        }
        if (showFontPicker() && !(e.target as HTMLElement)?.closest('.rt-font-wrapper')) {
            setShowFontPicker(false);
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
            lastPopulatedId = id;
            const spans = props.richTextSpans();
            requestAnimationFrame(() => {
                if (!editorRef) return;
                // Populate with HTML if there are spans, otherwise clear
                editorRef.innerHTML = spans.length > 0 ? spansToHtml(spans) : '';
                editorRef.focus();
                // Select all text if there's content, otherwise just place cursor at start
                const sel = window.getSelection();
                if (sel) {
                    const range = document.createRange();
                    if (editorRef.childNodes.length > 0) {
                        range.selectNodeContents(editorRef);
                    } else {
                        // For empty editor, just place cursor at the start
                        range.setStart(editorRef, 0);
                        range.setEnd(editorRef, 0);
                    }
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
                updateActiveFormats();
            });
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
                const { scale } = store.viewState;

                const _p = worldToScreen(elX + elW / 2, elY + elH / 2, store.viewState);
                const centerX = _p.x;
                const centerY = _p.y;
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
                                    onClick={() => { setShowColorPicker(!showColorPicker()); setShowFontPicker(false); }}
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
                            <span class="rt-toolbar-divider" />
                            <div class="rt-font-wrapper">
                                <button
                                    class="rt-toolbar-btn rt-font-btn"
                                    title="Font Family"
                                    onClick={() => { setShowFontPicker(!showFontPicker()); setShowColorPicker(false); }}
                                >
                                    <span class="rt-font-icon">F</span>
                                </button>
                                <Show when={showFontPicker()}>
                                    <div class="rt-font-popover">
                                        {TOOLBAR_FONTS.map(font => (
                                            <button
                                                class="rt-font-option"
                                                style={{ 'font-family': resolveFontFamily(font.key) }}
                                                onClick={() => {
                                                    execFormat('fontName', resolveFontFamily(font.key));
                                                    setShowFontPicker(false);
                                                }}
                                            >{font.label}</button>
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
                            ref={(el) => {
                                editorRef = el;
                                // Native keydown handler — takes full control of Enter to guarantee newlines
                                el.addEventListener('keydown', (e) => {
                                    if (e.key === 'Escape') {
                                        e.preventDefault();
                                        e.stopImmediatePropagation();
                                        handleCommit();
                                        if (!store.toolLocked) {
                                            setSelectedTool('selection');
                                        }
                                        return;
                                    }
                                    // Ctrl/Cmd+Enter: commit and stay on the current shape (selected).
                                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopImmediatePropagation();
                                        handleCommit();
                                        if (!store.toolLocked) {
                                            setSelectedTool('selection');
                                        }
                                        return;
                                    }
                                    if (e.key === 'Enter') {
                                        // Inside a list, let the browser handle Enter
                                        // so it creates a new <li> naturally
                                        const sel = window.getSelection();
                                        const node = sel?.anchorNode;
                                        const isInList = node && (
                                            node instanceof HTMLElement
                                                ? node.closest('li,ul,ol')
                                                : node.parentElement?.closest('li,ul,ol')
                                        );
                                        if (isInList) {
                                            e.stopImmediatePropagation();
                                            setTimeout(() => { updateActiveFormats(); syncSpans(); }, 0);
                                            return;
                                        }
                                        // Outside lists, manually insert line break
                                        e.preventDefault();
                                        e.stopImmediatePropagation();
                                        document.execCommand('insertLineBreak');
                                        updateActiveFormats();
                                        syncSpans();
                                        return;
                                    }
                                    setTimeout(updateActiveFormats, 0);
                                    // Stop propagation to prevent global hotkeys from interfering
                                    e.stopImmediatePropagation();
                                });
                                // Block middle-click (button 1) so an accidental scroll-wheel press
                                // can't trigger the X11 PRIMARY-selection paste on Linux (it would
                                // inject the last-highlighted text — or arbitrary HTML — into the
                                // rich text). Ctrl/Cmd+V and right-click→Paste are untouched.
                                const blockMiddle = (e: MouseEvent) => { if (e.button === 1) e.preventDefault(); };
                                el.addEventListener('mousedown', blockMiddle);
                                el.addEventListener('auxclick', blockMiddle);
                            }}
                            contentEditable
                            class="rt-editor"
                            style={{
                                width: `${Math.max(50, textareaWidth)}px`,
                                'min-height': `${textareaHeight}px`,
                                font: `${fontSizeVal * scale}px ${fontFamily}`,
                                // Match the committed colour (per-colour dark adjust, see
                                // docs/design/dark-mode.md) so editing text reads the same.
                                color: RenderPipeline.adjustColor(el.textColor || el.strokeColor || '#000000', store.resolvedTheme === 'dark' || store.resolvedTheme === 'focus'),
                                'text-align': textAlign,
                                'line-height': `${fontSizeVal * scale * 1.2}px`,
                                filter: 'none',
                            }}
                            onBlur={handleBlur}
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
