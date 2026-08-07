import { Show, For, onCleanup, createEffect, createSignal, createMemo } from "solid-js";
import { X, Search, ExternalLink, Github, Youtube, Bug, LayoutTemplate, Compass } from "lucide-solid";
import "./help-dialog.css";
import { startTour } from "./onboarding-tour";

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
            { label: 'Save to My Drawings', keys: 'Ctrl+S' },
            { label: 'Open Drawing (Export/Load dialog)', keys: 'Ctrl+Alt+O' },
            { label: 'Save Drawing (Export/Save dialog)', keys: 'Ctrl+Alt+S' },
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
            { label: 'Node tool / Direct Selection (toggle)', keys: 'N' },
            { label: 'Node tool: select all nodes', keys: 'Ctrl+A' },
            { label: 'Node tool: delete selected nodes', keys: 'Del' },
            { label: 'Node tool: add a node on a segment', keys: 'Alt+Click' },
            { label: 'Node tool: edit a different shape (stay in the tool)', keys: 'Click the shape' },
            { label: 'Node tool: edit several shapes at once', keys: 'Shift+Click a shape' },
            { label: 'Node tool: drop the nodes, then the shape', keys: 'Click empty space (twice)' },
            { label: 'Node tool: pick shapes when none is loaded', keys: 'Drag on empty space' },
            { label: 'Node tool: leave the tool', keys: 'Esc or N' },
            { label: 'Draw a Square / Perfect Circle (hold while drawing)', keys: 'Shift+Drag' },
            { label: 'Snap a Line / Arrow to 15° (hold while drawing)', keys: 'Shift+Drag' },
            { label: 'Edit Text in Shape', keys: 'Double-click' },
            { label: 'Commit Text, Keep Shape Selected', keys: 'Ctrl+Enter' },
            { label: 'Commit Text, Exit Edit', keys: 'Esc' },
            { label: 'Delete', keys: 'Del' },
            { label: 'Duplicate', keys: 'Ctrl+D' },
            { label: 'Transform Again (step-and-repeat)', keys: 'Ctrl+Shift+D' },
            { label: 'Constrain move to an axis (H / V / 45°)', keys: 'Shift+Drag element' },
            { label: 'Constrain angle to 15° (draw line / rotate / measure)', keys: 'Shift+Drag' },
            { label: 'Measure to neighbour (gaps + artboard edges)', keys: 'Alt+Hover' },
            { label: 'Select All (switches to the Selection tool)', keys: 'Ctrl+A' },
            { label: 'Copy / Paste', keys: 'Ctrl+C / Ctrl+V' },
            { label: 'Cut', keys: 'Ctrl+X' },
            { label: 'Bring Forward (one step)', keys: 'Ctrl+]' },
            { label: 'Send Backward (one step)', keys: 'Ctrl+[' },
            { label: 'Bring to Front', keys: 'Ctrl+Shift+]' },
            { label: 'Send to Back', keys: 'Ctrl+Shift+[' },
            { label: 'Rasterize selection (vector → bitmap)', keys: 'Right-click → Rasterize' },
            { label: 'Group / Ungroup', keys: 'Ctrl+G / Ctrl+Shift+G' },
            { label: 'Enter group (select objects inside it)', keys: 'Double-click a grouped object' },
            { label: 'Leave group (one level)', keys: 'Esc' },
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
            { label: 'Simplify Path (auto-converts shapes/strokes)', keys: 'Ctrl+L' },
            { label: 'Smooth Path', keys: 'Right-click → Path → Smooth' },
            { label: 'Lock / Unlock selected', keys: 'Ctrl+Shift+L' },
            { label: 'Unlock All Objects (locked ones can’t be selected)', keys: 'Ctrl+Alt+2' },
            { label: 'Unlock Aspect Ratio', keys: 'Shift+Drag' },
            { label: 'Pen / Vector Path: add point / drag to curve', keys: 'P or Toolbar (pen-nib)' },
            { label: 'Pen: constrain handles 90°/45° (Clock Method)', keys: 'Shift+Drag handle' },
            { label: 'Pen / node: break the handle pair (cusp)', keys: 'Alt+Drag handle' },
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
            { label: 'Combine: Unite selected shapes', keys: 'Ctrl+Alt+U' },
            { label: 'Combine: Subtract (minus front)', keys: 'Ctrl+Alt+D' },
            { label: 'Combine: Intersect (keep overlap)', keys: 'Ctrl+Alt+I' },
            { label: 'Combine: Exclude (drop overlap)', keys: 'Ctrl+Alt+X' },
            { label: 'Shape Builder (drag to merge, Alt+drag to delete)', keys: 'Shift+M' },
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
            { label: 'Toggle Elements (search icons, illustrations, shapes, photos)', keys: 'Alt+E' },
            { label: 'Toggle Layers', keys: 'Alt+L' },
            { label: 'Toggle Symbols Panel', keys: 'Alt+B' },
            { label: 'Toggle History Panel', keys: 'Alt+H' },
            { label: 'Toggle Graphic Styles', keys: 'Alt+G' },
            { label: 'Toggle Swatches', keys: 'Alt+W' },
            { label: 'Toggle Patterns', keys: 'Alt+P' },
            { label: 'Toggle Minimap', keys: 'Alt+M' },
            { label: 'Toggle Rulers & Guides', keys: 'Alt+R' },
            { label: 'Toggle Keyframes Timeline', keys: 'Alt+K' },
            { label: 'Toggle Symmetry (mirror / mandala drawing)', keys: 'Alt+Y' },
            { label: 'Move Symmetry Axis (drag the centre handle)', keys: 'Alt+Shift+Y' },
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
        title: 'Animation Timeline (animation docs)',
        shortcuts: [
            { label: 'Insert Frame (lengthen span)', keys: 'F5' },
            { label: 'Insert Keyframe (duplicate cel, copy selected & ready to drag)', keys: 'F6' },
            { label: 'Insert Blank Keyframe', keys: 'F7' },
            { label: 'Remove Frame', keys: 'Shift+F5' },
            { label: 'Clear Keyframe', keys: 'Shift+F6' },
            { label: 'Convert to Movie Clip / Graphic', keys: 'F8 / Shift+F8' },
            { label: 'Play / Pause', keys: 'Enter' },
            { label: 'Step Frame Back / Forward', keys: ', / .' },
            { label: 'Jump to First / Last Frame', keys: 'Home / End' },
        ]
    },
    {
        title: 'Layers & Slides',
        shortcuts: [
            { label: 'Switch Layer', keys: 'Alt+1-9' },
            { label: 'New Layer', keys: 'Ctrl+Shift+N' },
            { label: 'Reorder Layer', keys: 'Alt+[ / Alt+]' },
            { label: 'New Slide / Page', keys: 'Ctrl+M' },
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
            { label: 'Frame menu — Insert Keyframe, tweens, frame actions (no keyboard)', keys: 'Touch & hold a frame in the timeline' },
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
    const [query, setQuery] = createSignal('');

    /**
     * People come to this dialog with one question — "what's the shortcut for X" — and used to
     * answer it by reading seven columns. Match on the LABEL and on the KEYS, so it works in
     * both directions: "duplicate" finds Ctrl+D, and "ctrl+d" finds Duplicate. Categories that
     * match nothing drop out entirely rather than leaving empty headings behind.
     */
    const filtered = createMemo(() => {
        const q = query().trim().toLowerCase();
        if (!q) return SHORTCUT_DATA;
        return SHORTCUT_DATA
            .map(cat => ({
                ...cat,
                shortcuts: cat.shortcuts.filter(sc =>
                    sc.label.toLowerCase().includes(q) || sc.keys.toLowerCase().includes(q)),
            }))
            .filter(cat => cat.shortcuts.length > 0);
    });

    // Reopening should not resume someone else's half-typed search.
    createEffect(() => { if (!props.isOpen) setQuery(''); });

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
                        <div class="help-search">
                            <Search size={15} />
                            <input
                                type="text"
                                placeholder="Search shortcuts…"
                                value={query()}
                                onInput={(e) => setQuery(e.currentTarget.value)}
                            />
                            <Show when={query()}>
                                <button class="help-search-clear" onClick={() => setQuery('')} title="Clear">
                                    <X size={14} />
                                </button>
                            </Show>
                        </div>
                        <button class="help-close-btn" onClick={props.onClose}>
                            <X size={24} />
                        </button>
                    </div>

                    <div class="help-modal-body">
                        <Show when={!query().trim()}>
                        <div class="social-links">
                            <button
                                type="button"
                                class="social-btn"
                                onClick={() => { props.onClose(); startTour(); }}
                            >
                                <Compass size={16} />
                                Take the tour
                            </button>
                            {/* A real link, so Ctrl/⌘-click, middle-click and "Open link in new
                                tab" all work. The handler used to preventDefault() on EVERY
                                click, which swallowed those gestures and forced the docs to
                                replace the drawing you had open. Only a plain left-click is
                                handled in-app now; a modified click falls through to the
                                browser and opens a second tab. */}
                            <a
                                href="#/help"
                                class="social-btn"
                                title="Open the documentation (Ctrl/⌘-click or middle-click for a new tab)"
                                onClick={(e) => {
                                    if (e.defaultPrevented) return;
                                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                                    e.preventDefault();
                                    props.onClose();
                                    window.location.hash = '#/help';
                                }}
                            >
                                <ExternalLink size={16} />
                                Documentation
                            </a>
                            <a
                                href="#/help"
                                class="social-btn"
                                target="_blank"
                                rel="noopener"
                                title="Open the documentation in a new tab, keeping your drawing open here"
                            >
                                <ExternalLink size={16} />
                                Docs in new tab
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
                        </Show>

                        <div class="shortcuts-section">
                            <h3>Keyboard shortcuts</h3>
                            <Show when={filtered().length === 0}>
                                <p class="help-empty">No shortcut matches “{query().trim()}”.</p>
                            </Show>
                            <div class="shortcuts-grid">
                                <For each={filtered()}>
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
