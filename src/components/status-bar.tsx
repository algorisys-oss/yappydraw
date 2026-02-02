import { type Component, Show } from "solid-js";
import { store, setViewState, undo, redo, togglePresentationMode } from "../store/app-store";
import { Plus, Minus, Undo2, Redo2, Play } from "lucide-solid";
import pkg from '../../package.json';
import "./status-bar.css";

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
            <div class="status-section" style={{ opacity: 0.5, 'border-right': 'none' }}>
                v{pkg.version}
            </div>
        </div>
    );
};

export default StatusBar;
