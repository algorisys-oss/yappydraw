import { Show, For, onCleanup, createEffect } from "solid-js";
import { X, ExternalLink, Github, Youtube, Bug, LayoutTemplate } from "lucide-solid";
import "./help-dialog.css";

interface ShortcutEntry {
    label: string;
    keys: string; // e.g. "Ctrl+Z", "V or 1", "Shift+Drag"
}

interface ShortcutCategory {
    title: string;
    shortcuts: ShortcutEntry[];
}

const SHORTCUT_DATA: ShortcutCategory[] = [
    {
        title: 'File',
        shortcuts: [
            { label: 'Open Drawing', keys: 'Ctrl+Alt+O' },
            { label: 'Save Drawing', keys: 'Ctrl+Alt+S' },
            { label: 'Export / Share', keys: 'Ctrl+Shift+E' },
            { label: 'Command Palette', keys: 'Ctrl+K' },
            { label: 'New Sketch', keys: 'Alt+N' },
        ]
    },
    {
        title: 'Tools',
        shortcuts: [
            { label: 'Selection', keys: 'V or 1' },
            { label: 'Rectangle', keys: 'R or 2' },
            { label: 'Circle', keys: 'O or 3' },
            { label: 'Diamond', keys: 'D' },
            { label: 'Line', keys: 'L or 4' },
            { label: 'Arrow', keys: 'A or 5' },
            { label: 'Text', keys: 'T or 6' },
            { label: 'Eraser', keys: 'E or 7' },
            { label: 'Pencil', keys: 'P or 8' },
            { label: 'Insert Image', keys: 'I or 9' },
            { label: 'Insert Video', keys: 'Toolbar button' },
            { label: 'Bezier Curve', keys: 'B or 0' },
            { label: 'Pan Mode', keys: 'H' },
            { label: 'Laser Pointer', keys: 'Shift+P' },
            { label: 'Ink Overlay', keys: 'Alt+I' },
            { label: 'Lock Tool (stay active)', keys: 'Double-click' },
        ]
    },
    {
        title: 'Editor',
        shortcuts: [
            { label: 'Undo', keys: 'Ctrl+Z' },
            { label: 'Redo', keys: 'Ctrl+Y' },
            { label: 'Delete', keys: 'Del' },
            { label: 'Duplicate', keys: 'Ctrl+D' },
            { label: 'Select All', keys: 'Ctrl+A' },
            { label: 'Copy / Paste', keys: 'Ctrl+C / Ctrl+V' },
            { label: 'Cut', keys: 'Ctrl+X' },
            { label: 'Bring to Front', keys: 'Ctrl+]' },
            { label: 'Send to Back', keys: 'Ctrl+[' },
            { label: 'Group / Ungroup', keys: 'Ctrl+G / Ctrl+Shift+G' },
            { label: 'Copy / Paste Style', keys: 'Ctrl+Alt+C / V' },
            { label: 'Flip Horizontal', keys: 'Shift+H' },
            { label: 'Flip Vertical', keys: 'Shift+V' },
            { label: 'Lock / Unlock', keys: 'Ctrl+Shift+L' },
            { label: 'Unlock Aspect Ratio', keys: 'Shift+Drag' },
            { label: 'Add Child Node', keys: 'Tab' },
            { label: 'Add Sibling Node', keys: 'Enter' },
            { label: 'Toggle Collapse', keys: 'Space' },
            { label: 'Navigate Mindmap', keys: 'Arrow Keys' },
            { label: 'Nudge Element', keys: 'Shift+Arrow' },
            { label: 'Focus Branch', keys: 'Shift+F' },
        ]
    },
    {
        title: 'View & Zoom',
        shortcuts: [
            { label: 'Zoom In', keys: 'Ctrl+=' },
            { label: 'Zoom Out', keys: 'Ctrl+-' },
            { label: 'Reset Zoom (100%)', keys: 'Ctrl+0' },
            { label: 'Zoom to Fit', keys: 'Ctrl+1' },
            { label: 'Zoom to Selection', keys: 'Ctrl+2' },
            { label: 'Toggle Properties', keys: 'Alt+Enter' },
            { label: 'Toggle Layers', keys: 'Alt+L' },
            { label: 'Toggle Minimap', keys: 'Alt+M' },
            { label: 'Toggle Panels', keys: 'Alt+\\' },
            { label: 'Zen Mode', keys: 'Alt+Z' },
            { label: 'Toggle Grid', keys: "Shift+'" },
            { label: 'Snap to Grid', keys: 'Shift+;' },
            { label: 'Help Dialog', keys: 'Shift+?' },
            { label: 'Present from Start', keys: 'F5' },
            { label: 'Present from Current', keys: 'Shift+F5' },
            { label: 'Exit Presentation', keys: 'Esc' },
        ]
    },
    {
        title: 'Layers & Slides',
        shortcuts: [
            { label: 'Switch Layer', keys: 'Alt+1-9' },
            { label: 'New Layer', keys: 'Ctrl+Shift+N' },
            { label: 'Reorder Layer', keys: 'Alt+[ / Alt+]' },
            { label: 'New Slide', keys: 'Ctrl+M' },
            { label: 'Next State / Slide', keys: 'Alt+Right' },
            { label: 'Prev State / Slide', keys: 'Alt+Left' },
            { label: 'Cycle Stroke Style', keys: 'S' },
            { label: 'Cycle Fill Style', keys: 'F' },
        ]
    },
];

/** Parse a key string like "Ctrl+Shift+E" into individual key caps */
function parseKeys(keys: string): { segments: { type: 'key' | 'separator'; value: string }[] } {
    const segments: { type: 'key' | 'separator'; value: string }[] = [];
    // Split on " or " and " / " separators
    const parts = keys.split(/( or | \/ )/);
    for (const part of parts) {
        if (part === ' or ' || part === ' / ') {
            segments.push({ type: 'separator', value: part.trim() });
        } else {
            // Split on + for modifier combos
            const combo = part.split('+');
            for (let i = 0; i < combo.length; i++) {
                if (i > 0) segments.push({ type: 'separator', value: '+' });
                segments.push({ type: 'key', value: combo[i] });
            }
        }
    }
    return { segments };
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function HelpDialog(props: Props) {
    createEffect(() => {
        if (props.isOpen) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    props.onClose();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
        }
    });

    return (
        <Show when={props.isOpen}>
            <div class="help-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !window.getSelection()?.toString()) props.onClose(); }}>
                <div class="help-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div class="help-modal-header">
                        <h2>Help</h2>
                        <button class="help-close-btn" onClick={props.onClose}>
                            <X size={24} />
                        </button>
                    </div>

                    <div class="help-modal-body">
                        <div class="social-links">
                            <a
                                href="#/help"
                                class="social-btn"
                                onClick={(e) => {
                                    e.preventDefault();
                                    props.onClose();
                                    window.location.hash = '#/help';
                                }}
                            >
                                <ExternalLink size={16} />
                                Documentation
                            </a>
                            <a
                                href="#/examples"
                                class="social-btn"
                                onClick={(e) => {
                                    e.preventDefault();
                                    props.onClose();
                                    window.location.hash = '#/examples';
                                }}
                            >
                                <LayoutTemplate size={16} />
                                Examples
                            </a>
                            <a href="https://github.com/algorisys-oss/" target="_blank" rel="noopener noreferrer" class="social-btn">
                                <Github size={16} />
                                GitHub
                            </a>
                            <a href="#" class="social-btn">
                                <Bug size={16} />
                                Found an issue?
                            </a>
                            <a href="#" class="social-btn">
                                <Youtube size={16} />
                                YouTube
                            </a>
                        </div>

                        <div class="shortcuts-section">
                            <h3>Keyboard shortcuts</h3>
                            <div class="shortcuts-grid">
                                <For each={SHORTCUT_DATA}>
                                    {(category) => (
                                        <div class="shortcut-column">
                                            <h4>{category.title}</h4>
                                            <div class="shortcut-list">
                                                <For each={category.shortcuts}>
                                                    {(sc) => {
                                                        const parsed = parseKeys(sc.keys);
                                                        return (
                                                            <div class="shortcut-item">
                                                                <span class="shortcut-label">{sc.label}</span>
                                                                <div class="shortcut-keys">
                                                                    <For each={parsed.segments}>
                                                                        {(seg) =>
                                                                            seg.type === 'key'
                                                                                ? <span class="keycap">{seg.value}</span>
                                                                                : <span class="key-or">{seg.value}</span>
                                                                        }
                                                                    </For>
                                                                </div>
                                                            </div>
                                                        );
                                                    }}
                                                </For>
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Show>
    );
}
