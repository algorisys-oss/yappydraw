import { type Component, Show, For } from "solid-js";
import { store, setViewState, undo, redo, togglePresentationMode } from "../store/app-store";
import { drawingId } from "./menu";
import { Plus, Minus, Undo2, Redo2, Play } from "lucide-solid";
import pkg from '../../package.json';
import "./status-bar.css";

/** Contextual modifier hint: key combo + action description */
type Hint = { key: string; action: string };

const SHAPE_TOOLS = [
    'rectangle', 'circle', 'diamond', 'shape', 'infra', 'sketchnote', 'people',
    'status', 'cloudInfra', 'dataMetrics', 'connectionRel', 'wireframe',
    'technical', 'uml', 'math', 'mindmap',
    'star', 'hexagon', 'parallelogram', 'capsule', 'speechBubble',
];
const CONNECTOR_TOOLS = ['line', 'arrow', 'bezier', 'polyline'];
const DRAWING_TOOLS = ['fineliner', 'inkbrush', 'marker'];

function isMindmapNode(el: any): boolean {
    if (!el) return false;
    if (el.parentId) return true;
    // Check if this element has children (is a mindmap root)
    return store.elements.some(e => e.parentId === el.id);
}

function getContextHints(tool: string, hasSelection: boolean): Hint[] {
    if (tool === 'selection' || tool === 'lasso') {
        if (hasSelection) {
            const hints: Hint[] = [
                { key: 'Ctrl+D', action: 'Duplicate' },
                { key: 'Shift+Drag', action: 'Constrain' },
                { key: 'Del', action: 'Delete' },
                { key: 'Ctrl+C', action: 'Copy' },
            ];
            // Add mindmap-specific hints when a mindmap node is selected
            if (store.selection.length === 1) {
                const sel = store.elements.find(e => e.id === store.selection[0]);
                if (isMindmapNode(sel)) {
                    hints.push({ key: 'Alt+Drag', action: 'Move tree' });
                    hints.push({ key: 'Tab', action: 'Add child' });
                    hints.push({ key: 'Enter', action: 'Add sibling' });
                }
            }
            return hints;
        }
        return tool === 'lasso'
            ? [{ key: 'Drag', action: 'Lasso select' }, { key: 'Space+Drag', action: 'Pan' }]
            : [{ key: 'Click', action: 'Select' }, { key: 'Drag', action: 'Box select' }, { key: 'Space+Drag', action: 'Pan' }];
    }
    if (CONNECTOR_TOOLS.includes(tool)) {
        return [{ key: 'Drag', action: 'Connect' }, { key: 'Shift', action: 'Constrain angle' }];
    }
    if (tool === 'mindmap') {
        return [{ key: 'Click', action: 'Place mindmap' }, { key: 'Alt+Drag', action: 'Move root node' }];
    }
    if (SHAPE_TOOLS.includes(tool)) {
        return [{ key: 'Drag', action: 'Draw shape' }, { key: 'Shift', action: 'Constrain' }];
    }
    if (DRAWING_TOOLS.includes(tool)) {
        return [{ key: 'Drag', action: 'Draw' }, { key: 'Shift', action: 'Straight line' }];
    }
    if (tool === 'text') return [{ key: 'Click', action: 'Place text' }];
    if (tool === 'pan') return [{ key: 'Drag', action: 'Pan' }, { key: 'Ctrl+Scroll', action: 'Zoom' }];
    if (tool === 'eraser') return [{ key: 'Click/Drag', action: 'Erase' }];
    if (tool === 'table') return [{ key: 'Drag', action: 'Draw table' }];
    if (tool === 'image') return [{ key: 'Click', action: 'Place image' }];
    return [];
}

const TOOL_LABELS: Record<string, string> = {
    selection: 'Select',
    lasso: 'Lasso',
    pan: 'Pan',
    rectangle: 'Rectangle',
    circle: 'Circle',
    diamond: 'Diamond',
    line: 'Line',
    arrow: 'Arrow',
    bezier: 'Bezier',
    polyline: 'Polyline',
    text: 'Text',
    image: 'Image',
    eraser: 'Eraser',
    fineliner: 'Pencil',
    inkbrush: 'Ink Brush',
    marker: 'Marker',
    ink: 'Ink Overlay',
    laser: 'Laser',
    shape: 'Shape',
    infra: 'Infrastructure',
    math: 'Math',
    sketchnote: 'Sketchnote',
    people: 'People',
    status: 'Status',
    cloudInfra: 'Cloud Infra',
    dataMetrics: 'Data/Metrics',
    connectionRel: 'Connection',
    wireframe: 'Wireframe',
    technical: 'Technical',
    uml: 'UML',
    mindmap: 'Mindmap',
    table: 'Table',
};

const StatusBar: Component = () => {
    const handleZoomIn = () => {
        const newScale = Math.min(store.viewState.scale * 1.1, 10);
        zoomToCenter(newScale);
    };

    const handleZoomOut = () => {
        const newScale = Math.max(store.viewState.scale * 0.9, 0.1);
        zoomToCenter(newScale);
    };

    const zoomToCenter = (newScale: number) => {
        const { scale, panX, panY } = store.viewState;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const worldX = (centerX - panX) / scale;
        const worldY = (centerY - panY) / scale;
        const newPanX = centerX - worldX * newScale;
        const newPanY = centerY - worldY * newScale;
        setViewState({ scale: newScale, panX: newPanX, panY: newPanY });
    };

    const resetZoom = () => {
        setViewState({ scale: 1 });
    };

    const toolLabel = () => TOOL_LABELS[store.selectedTool] || store.selectedTool;

    return (
        <div class="status-bar">
            {/* Document Name */}
            <div class="status-section status-doc-name">
                <Show when={store.isDirty}>
                    <span
                        style={{
                            display: 'inline-block',
                            width: '6px',
                            height: '6px',
                            'border-radius': '50%',
                            background: '#e74c3c',
                            'margin-right': '4px',
                            'flex-shrink': '0',
                        }}
                        title="Unsaved changes"
                    />
                </Show>
                <span>{drawingId()}</span>
            </div>

            {/* Current Tool */}
            <div class="status-section">
                <span class="status-tool-name">{toolLabel()}</span>
            </div>

            {/* Cursor Position */}
            <div class="status-section">
                <span class="status-coords">
                    X: {store.cursorPosition.x}
                </span>
                <span class="status-coords">
                    Y: {store.cursorPosition.y}
                </span>
            </div>

            {/* Selection */}
            <Show when={store.selection.length > 0}>
                <div class="status-section">
                    <span>{store.selection.length} selected</span>
                </div>
            </Show>

            {/* Contextual Modifier Hints */}
            <div class="status-section status-hints">
                <For each={getContextHints(store.selectedTool, store.selection.length > 0)}>
                    {(hint) => (
                        <span class="status-hint">
                            <kbd>{hint.key}</kbd> {hint.action}
                        </span>
                    )}
                </For>
            </div>

            {/* Spacer */}
            <div class="status-spacer" />

            {/* Element Count */}
            <div class="status-section">
                <span>{store.elements.length} elements</span>
            </div>

            {/* Slide Info (slides mode only) */}
            <Show when={store.docType === 'slides'}>
                <div class="status-section">
                    <span>Slide {store.activeSlideIndex + 1}/{store.slides.length}</span>
                </div>
            </Show>

            {/* Zoom Controls */}
            <div class="status-section" style={{ gap: '2px' }}>
                <button class="status-btn" onClick={handleZoomOut} title="Zoom Out (Ctrl+-)">
                    <Minus size={14} />
                </button>
                <button class="status-btn text-btn" onClick={resetZoom} title="Reset Zoom (Ctrl+0)">
                    {Math.round(store.viewState.scale * 100)}%
                </button>
                <button class="status-btn" onClick={handleZoomIn} title="Zoom In (Ctrl+=)">
                    <Plus size={14} />
                </button>
            </div>

            {/* Undo / Redo */}
            <div class="status-section" style={{ gap: '2px' }}>
                <button
                    class="status-btn"
                    onClick={undo}
                    disabled={store.undoStackLength === 0}
                    title="Undo (Ctrl+Z)"
                >
                    <Undo2 size={14} />
                </button>
                <button
                    class="status-btn"
                    onClick={redo}
                    disabled={store.redoStackLength === 0}
                    title="Redo (Ctrl+Y)"
                >
                    <Redo2 size={14} />
                </button>
            </div>

            {/* Present */}
            <div class="status-section" style={{ gap: '2px' }}>
                <button
                    class="status-btn present-btn"
                    onClick={() => togglePresentationMode(true, 0)}
                    title="Present from beginning (F5)"
                >
                    <Play size={14} />
                </button>
            </div>

            {/* Version */}
            <div class="status-section" style={{ opacity: 0.5 }}>
                v{pkg.version}
            </div>

            {/* Privacy Policy */}
            <div class="status-section status-attribution">
                <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                </a>
            </div>

            {/* Attribution */}
            <div class="status-section status-attribution" style={{ 'border-right': 'none' }}>
                Developed with <span class="status-heart">&hearts;</span> by{' '}
                <a href="https://github.com/algorisys-oss/" target="_blank" rel="noopener noreferrer">
                    Algorisys Open Source Team
                </a>
            </div>
        </div>
    );
};

export default StatusBar;
