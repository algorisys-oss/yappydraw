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

// NOTE: when adding a touch/pen affordance, also document it in the
// "Touch & Pen Gestures" category below so the help dialog stays in sync.
const SHORTCUT_DATA: ShortcutCategory[] = [
    {
        title: 'File',
        shortcuts: [
            { label: 'Open Drawing', keys: 'Ctrl+Alt+O' },
            { label: 'Save Drawing', keys: 'Ctrl+Alt+S' },
            { label: 'Export / Share', keys: 'Ctrl+Shift+E' },
            { label: 'Record Time-lapse (toggle)', keys: 'Ctrl+Shift+T' },
            { label: 'Command Palette', keys: 'Ctrl+K' },
            { label: 'Quick Tool Finder', keys: '/' },
            { label: 'New Sketch', keys: 'Alt+N' },
        ]
    },
    {
        title: 'Tools',
        shortcuts: [
            { label: 'Selection', keys: 'V or 1' },
            { label: 'Rectangle', keys: 'R or 2' },
            { label: 'Diamond', keys: 'D or 3' },
            { label: 'Ellipse', keys: 'O or 4' },
            { label: 'Arrow', keys: 'A or 5' },
            { label: 'Line', keys: 'L or 6' },
            { label: 'Pen', keys: 'P or 7' },
            { label: 'Text', keys: 'T or 8' },
            { label: 'Insert Image', keys: 'I or 9' },
            { label: 'Insert Video', keys: 'Toolbar button' },
            { label: 'Eraser (drag over part of any shape to partially erase; width is adjustable in the panel)', keys: 'E or 0' },
            { label: 'Bezier Curve', keys: 'B' },
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
            { label: 'Edit Text in Shape', keys: 'Double-click' },
            { label: 'Commit Text, Keep Shape Selected', keys: 'Ctrl+Enter' },
            { label: 'Commit Text, Exit Edit', keys: 'Esc' },
            { label: 'Delete', keys: 'Del' },
            { label: 'Duplicate', keys: 'Ctrl+D' },
            { label: 'Transform Again (step-and-repeat)', keys: 'Ctrl+Shift+D' },
            { label: 'Select All', keys: 'Ctrl+A' },
            { label: 'Copy / Paste', keys: 'Ctrl+C / Ctrl+V' },
            { label: 'Cut', keys: 'Ctrl+X' },
            { label: 'Bring to Front', keys: 'Ctrl+]' },
            { label: 'Send to Back', keys: 'Ctrl+[' },
            { label: 'Group / Ungroup', keys: 'Ctrl+G / Ctrl+Shift+G' },
            { label: 'Copy / Paste Style', keys: 'Ctrl+Alt+C / V' },
            { label: 'Palette: Set Stroke Color', keys: 'Click swatch' },
            { label: 'Palette: Set Fill Color', keys: 'Shift+Click swatch' },
            { label: 'Palette: Close (when pinned)', keys: 'Esc' },
            { label: 'Select by Type', keys: 'Right-click → Select by Type' },
            { label: 'Select by Same Property', keys: 'Right-click → Select by Same Property' },
            { label: 'Flip Horizontal', keys: 'Shift+H' },
            { label: 'Flip Vertical', keys: 'Shift+V' },
            { label: 'Mirror Copy / Repeat (Radial·Grid)', keys: 'Right-click → Repeat & Mirror' },
            { label: 'Create Outlines (text → vector)', keys: 'Ctrl+Shift+O' },
            { label: 'Lock / Unlock', keys: 'Ctrl+Shift+L' },
            { label: 'Unlock Aspect Ratio', keys: 'Shift+Drag' },
            { label: 'Pen / Vector Path: add point / drag to curve', keys: 'P or Toolbar (pen-nib)' },
            { label: 'Pen: constrain handles 90°/45° (Clock Method)', keys: 'Shift+Drag handle' },
            { label: 'Path node: convert corner ↔ smooth', keys: 'Alt+Click anchor' },
            { label: 'Path node: delete / insert', keys: 'Ctrl+Click anchor / Alt+Click segment' },
            { label: 'Mindmap Tool (central topic)', keys: 'M' },
            { label: 'Add Child Node (+ edit)', keys: 'Tab' },
            { label: 'Add Sibling Node (+ edit)', keys: 'Enter' },
            { label: 'Edit Node Text', keys: 'F2' },
            { label: 'Toggle Collapse (tap) · Hold to Pan', keys: 'Space' },
            { label: 'Navigate Mindmap', keys: 'Arrow Keys' },
            { label: 'Nudge Element', keys: 'Arrow' },
            { label: 'Nudge — coarse (10px) / fine (0.1px)', keys: 'Shift+Arrow / Ctrl+Arrow' },
            { label: 'Star/Polygon point count', keys: 'Up/Down (when selected)' },
            { label: 'Swap Fill / Stroke', keys: 'Shift+X' },
            { label: 'Math in number fields (200-50%, *2…)', keys: 'type + Enter' },
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
            { label: 'Rotate Canvas Left / Right (the , and . keys)', keys: 'Shift+, / Shift+.' },
            { label: 'Reset Canvas Rotation', keys: 'Shift+0' },
            { label: 'Toggle Properties', keys: 'Alt+Enter' },
            { label: 'Toggle Layers', keys: 'Alt+L' },
            { label: 'Toggle Symbols Panel', keys: 'Alt+B' },
            { label: 'Toggle History Panel', keys: 'Alt+H' },
            { label: 'Toggle Graphic Styles', keys: 'Alt+G' },
            { label: 'Toggle Swatches', keys: 'Alt+W' },
            { label: 'Toggle Patterns', keys: 'Alt+P' },
            { label: 'Toggle Minimap', keys: 'Alt+M' },
            { label: 'Toggle Rulers & Guides', keys: 'Alt+R' },
            { label: 'Toggle Symmetry Guide', keys: 'Alt+Y' },
            { label: 'Toggle Panels', keys: 'Alt+\\' },
            { label: 'Zen Mode', keys: 'Alt+Z' },
            { label: 'Toggle Grid', keys: "Shift+'" },
            { label: 'Snap to Grid', keys: 'Shift+;' },
            { label: 'Smart Shapes (hold pen to correct)', keys: 'Shift+Q' },
            { label: 'Stroke Stabilization (lazy brush)', keys: 'Shift+S' },
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
    {
        title: 'Touch & Pen Gestures',
        shortcuts: [
            { label: 'Pan / Zoom Canvas', keys: 'Two-finger drag / pinch' },
            { label: 'Rotate Canvas', keys: 'Two-finger twist' },
            { label: 'Undo', keys: 'Two-finger tap' },
            { label: 'Keep Undoing', keys: 'Two-finger hold' },
            { label: 'Redo', keys: 'Three-finger tap' },
            { label: 'Copy Selection', keys: 'Three-finger swipe down' },
            { label: 'Delete Selection', keys: 'Three-finger scrub (back & forth)' },
            { label: 'Toggle Zen Mode', keys: 'Four-finger tap' },
            { label: 'Zoom to Fit', keys: 'Quick pinch-in flick' },
            { label: 'Delete Selection (no keyboard)', keys: 'Tap the ✕ button by the selection' },
            { label: 'Context Menu (Delete / Duplicate…)', keys: 'Touch & hold (long-press)' },
            { label: 'Select All (no keyboard)', keys: 'Long-press empty canvas → Select all' },
            { label: 'Layer actions (lock/dup/delete)', keys: 'Drag a layer row left (mouse or touch)' },
            { label: 'Multi-select layers', keys: 'Drag layer rows right → Group / Delete' },
            { label: 'Reorder layers', keys: 'Drag the ⋮⋮ grip handle' },
            { label: 'Proportional Resize (stylus)', keys: 'Add a finger while dragging a handle' },
            { label: 'Pen node: convert smooth ↔ corner', keys: 'Tap an anchor' },
            { label: 'Pen node: delete / convert (menu)', keys: 'Long-press an anchor' },
            { label: 'Pen: insert point on a path', keys: 'Long-press the outline' },
            { label: 'Pen: constrain handles 90°/45°', keys: '90°/45° toggle / second finger' },
            { label: 'Set Shape Fill (ColorDrop)', keys: 'Drag palette swatch onto shape' },
            { label: 'Smart Shapes (hold pen to correct)', keys: 'Draw + hold' },
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
