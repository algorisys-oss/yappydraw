import { type Component, Show, For, createSignal } from "solid-js";
import { isMultiPageDocType } from '../types/slide-types';
import { t, plural } from '../i18n';
import { store, setViewState, undo, redo, togglePresentationMode, resetRotation, pageNoun, toggleSymmetryAxis, toggleSymmetryEditing, updateGlobalSettings } from "../store/app-store";
import { drawingId } from "./menu";
import { Plus, Minus, Undo2, Redo2, Play, FlipHorizontal, FlipVertical, Crosshair, PaintBucket } from "lucide-solid";
import { screenToWorld } from "../utils/viewport-transforms";
import { canvasCenterClient } from "../utils/dock-layout";
import pkg from '../../../package.json';
import WhatsNewDialog, { hasUnseenWhatsNew, openWhatsNew } from "./whats-new-dialog";
import { openAbout } from "./about-dialog";
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
                { key: 'Ctrl+D', action: t('hintAction.duplicate') },
                { key: 'Shift+Drag', action: t('hintAction.constrain') },
                { key: 'Del', action: t('hintAction.delete') },
                { key: 'Ctrl+C', action: t('hintAction.copy') },
            ];
            // Add mindmap-specific hints when a mindmap node is selected
            if (store.selection.length === 1) {
                const sel = store.elements.find(e => e.id === store.selection[0]);
                if (isMindmapNode(sel)) {
                    hints.push({ key: 'Alt+Drag', action: t('hintAction.moveTree') });
                    hints.push({ key: 'Tab', action: t('hintAction.addChild') });
                    hints.push({ key: 'Enter', action: t('hintAction.addSibling') });
                }
            }
            return hints;
        }
        return tool === 'lasso'
            ? [{ key: 'Drag', action: t('hintAction.lassoSelect') }, { key: 'Space+Drag', action: t('hintAction.pan') }]
            : [{ key: 'Click', action: t('hintAction.select') }, { key: 'Drag', action: t('hintAction.boxSelect') }, { key: 'Space+Drag', action: t('hintAction.pan') }];
    }
    if (CONNECTOR_TOOLS.includes(tool)) {
        return [{ key: 'Drag', action: t('hintAction.connect') }, { key: 'Shift', action: t('hintAction.constrainAngle') }];
    }
    if (tool === 'mindmap') {
        return [{ key: 'Click', action: t('hintAction.placeMindmap') }, { key: 'Alt+Drag', action: t('hintAction.moveRootNode') }];
    }
    if (SHAPE_TOOLS.includes(tool)) {
        return [{ key: 'Drag', action: t('hintAction.drawShape') }, { key: 'Shift', action: t('hintAction.constrain') }];
    }
    if (DRAWING_TOOLS.includes(tool)) {
        return [{ key: 'Drag', action: t('hintAction.draw') }, { key: 'Shift', action: t('hintAction.straightLine') }];
    }
    if (tool === 'text') return [{ key: 'Click', action: t('hintAction.placeText') }];
    if (tool === 'pan') return [{ key: 'Drag', action: t('hintAction.pan') }, { key: 'Ctrl+Scroll', action: t('hintAction.zoom') }];
    if (tool === 'eraser') return [{ key: 'Click/Drag', action: t('hintAction.erase') }];
    if (tool === 'table') return [{ key: 'Drag', action: t('hintAction.drawTable') }];
    if (tool === 'image') return [{ key: 'Click', action: t('hintAction.placeImage') }];
    if (tool === 'video') return [{ key: 'Click', action: t('hintAction.insertVideo') }];
    return [];
}

/**
 * Which dictionary key names each tool in the status bar. The text lives in
 * `toolLabel.*`; this table is only the tool → key mapping, so it can stay a
 * module-level const without freezing English into it.
 */
const TOOL_LABEL_KEYS = [
        'selection', 'lasso', 'pan', 'rectangle', 'circle', 'diamond', 'line', 'arrow', 'bezier', 'polyline', 'text', 'image', 'eraser', 'fineliner', 'inkbrush', 'marker', 'ink', 'laser', 'shape', 'infra', 'math', 'sketchnote', 'people', 'status', 'cloudInfra', 'dataMetrics', 'connectionRel', 'wireframe', 'technical', 'uml', 'mindmap', 'table',
] as const;
type ToolLabelKey = (typeof TOOL_LABEL_KEYS)[number];
const isToolLabelKey = (v: string): v is ToolLabelKey => (TOOL_LABEL_KEYS as readonly string[]).includes(v);

const StatusBar: Component = () => {
    const [hasNews, setHasNews] = createSignal(hasUnseenWhatsNew(pkg.version));

    const handleZoomIn = () => {
        const newScale = Math.min(store.viewState.scale * 1.1, 10);
        zoomToCenter(newScale);
    };

    const handleZoomOut = () => {
        const newScale = Math.max(store.viewState.scale * 0.9, 0.1);
        zoomToCenter(newScale);
    };

    const zoomToCenter = (newScale: number) => {
        // Zoom about the middle of the DRAWING AREA. With a docked toolbar the window
        // centre sits off-centre in the canvas, so zooming would drift sideways.
        const c = canvasCenterClient();
        const centerX = c.x;
        const centerY = c.y;
        const { x: worldX, y: worldY } = screenToWorld(centerX, centerY, store.viewState);
        const newPanX = centerX - worldX * newScale;
        const newPanY = centerY - worldY * newScale;
        setViewState({ scale: newScale, panX: newPanX, panY: newPanY });
    };

    const resetZoom = () => {
        setViewState({ scale: 1 });
    };

    // Canvas rotation, in whole degrees, for the compass dial/readout.
    const rotationDeg = () => Math.round((store.viewState.rotation || 0) * 180 / Math.PI);

    const toolLabel = () =>
        isToolLabelKey(store.selectedTool) ? t(`toolLabel.${store.selectedTool}`) : store.selectedTool;

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
                        title={t('statusBar.unsavedChanges')}
                    />
                </Show>
                {/* Translate the DEFAULT name for display only — never the stored
                    value, which saved files and auto-save both depend on. */}
                <span>{drawingId() === 'Untitled' ? t('statusBar.untitled') : drawingId()}</span>
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

            {/* Symmetry: vertical / horizontal mirror axes + move-axis (Krita-style) */}
            <div class="status-section status-toggle-group">
                <button
                    class="status-toggle"
                    classList={{ 'is-active': store.symmetry.mode === 'vertical' || store.symmetry.mode === 'both' }}
                    onClick={() => toggleSymmetryAxis('vertical')}
                    title={t('statusBar.symmetryVertical')}
                    aria-label="Toggle vertical symmetry"
                    aria-pressed={store.symmetry.mode === 'vertical' || store.symmetry.mode === 'both'}
                >
                    <FlipHorizontal size={14} />
                </button>
                <button
                    class="status-toggle"
                    classList={{ 'is-active': store.symmetry.mode === 'horizontal' || store.symmetry.mode === 'both' }}
                    onClick={() => toggleSymmetryAxis('horizontal')}
                    title={t('statusBar.symmetryHorizontal')}
                    aria-label="Toggle horizontal symmetry"
                    aria-pressed={store.symmetry.mode === 'horizontal' || store.symmetry.mode === 'both'}
                >
                    <FlipVertical size={14} />
                </button>
                <Show when={store.symmetry.mode !== 'off'}>
                    <button
                        class="status-toggle"
                        classList={{ 'is-active': store.symmetry.editing }}
                        onClick={() => toggleSymmetryEditing()}
                        title={t('statusBar.symmetryAxis')}
                        aria-label="Toggle move symmetry axis"
                        aria-pressed={store.symmetry.editing}
                    >
                        <Crosshair size={14} />
                    </button>
                </Show>
                <button
                    class="status-toggle"
                    classList={{ 'is-active': !!store.globalSettings.fillShapeMode }}
                    onClick={() => updateGlobalSettings({ fillShapeMode: !store.globalSettings.fillShapeMode })}
                    title={t('statusBar.fillMode')}
                    aria-label="Toggle fill mode"
                    aria-pressed={!!store.globalSettings.fillShapeMode}
                >
                    <PaintBucket size={14} />
                </button>
            </div>

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
                <span>{plural(store.elements.length, {
                    one: t('statusBarCount.one'),
                    other: t('statusBarCount.other'),
                })}</span>
            </div>

            {/* Slide Info (slides mode only) */}
            <Show when={isMultiPageDocType(store.docType)}>
                <div class="status-section">
                    <span>{pageNoun()} {store.activeSlideIndex + 1}/{store.slides.length}</span>
                </div>
            </Show>

            {/* Zoom Controls */}
            <div class="status-section" style={{ gap: '2px' }}>
                <button class="status-btn" onClick={handleZoomOut} title={t('statusBar.zoomOut')}>
                    <Minus size={14} />
                </button>
                <button class="status-btn text-btn" onClick={resetZoom} title={t('statusBar.resetZoom')}>
                    {Math.round(store.viewState.scale * 100)}%
                </button>
                <button class="status-btn" onClick={handleZoomIn} title={t('statusBar.zoomIn')}>
                    <Plus size={14} />
                </button>
            </div>

            {/* Canvas rotation compass — needle tilts with the view; click resets
                to upright. Only shown once the canvas is actually rotated. */}
            <Show when={Math.abs(store.viewState.rotation || 0) > 1e-4}>
                <div class="status-section" style={{ gap: '2px' }}>
                    <button
                        class="status-btn rotation-compass"
                        onClick={resetRotation}
                        title={`Canvas rotated ${rotationDeg()}° — click to reset (Shift+0)`}
                        aria-label={`Reset canvas rotation (currently ${rotationDeg()} degrees)`}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                            <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5" />
                            <g transform={`rotate(${rotationDeg()} 8 8)`}>
                                {/* North needle (filled) + south tail */}
                                <path d="M8 2.5 L6 8 L10 8 Z" fill="currentColor" />
                                <path d="M8 13.5 L6 8 L10 8 Z" fill="currentColor" opacity="0.35" />
                            </g>
                        </svg>
                        <span class="rotation-deg">{rotationDeg()}°</span>
                    </button>
                </div>
            </Show>

            {/* Undo / Redo */}
            <div class="status-section" style={{ gap: '2px' }}>
                <button
                    class="status-btn"
                    onClick={undo}
                    disabled={store.undoStackLength === 0}
                    title={t('statusBar.undo')}
                >
                    <Undo2 size={14} />
                </button>
                <button
                    class="status-btn"
                    onClick={redo}
                    disabled={store.redoStackLength === 0}
                    title={t('statusBar.redo')}
                >
                    <Redo2 size={14} />
                </button>
            </div>

            {/* Present */}
            <div class="status-section" style={{ gap: '2px' }}>
                <button
                    class="status-btn present-btn"
                    onClick={() => togglePresentationMode(true, 0)}
                    title={t('statusBar.present')}
                >
                    <Play size={14} />
                </button>
            </div>

            {/* Version — tap to see what's new (the popup also carries the
                hard-refresh action). A dot appears when there are updates since
                the user last looked. */}
            <div class="status-section">
                <button
                    class="status-btn version-btn"
                    style={{ "font-size": "inherit", "font-family": "inherit", width: "auto", padding: "0 4px" }}
                    title={t('statusBar.whatsNew')}
                    aria-label="What's new"
                    onClick={() => { openWhatsNew(); setHasNews(false); }}
                >
                    v{pkg.version}
                    <Show when={hasNews()}>
                        <span class="version-news-dot" aria-hidden="true" />
                    </Show>
                </button>
            </div>
            <WhatsNewDialog />

            {/* Legal */}
            <div class="status-section status-attribution">
                {/* A button, not an <a>: the dialog is in-app, so a link here would either
                    navigate away from the user's drawing or need a href it cannot honour. */}
                <button type="button" class="status-link-btn" onClick={() => openAbout()}>
                    {t('statusBar.about')}
                </button>
                <span style={{ opacity: 0.4 }}>|</span>
                <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer">
                    {t('statusBar.privacy')}
                </a>
                <span style={{ opacity: 0.4 }}>|</span>
                <a href="/terms-of-service.html" target="_blank" rel="noopener noreferrer">
                    {t('statusBar.terms')}
                </a>
                <span style={{ opacity: 0.4 }}>|</span>
                <a href="/refund-policy.html" target="_blank" rel="noopener noreferrer">
                    {t('statusBar.refunds')}
                </a>
                <span style={{ opacity: 0.4 }}>|</span>
                <a href="/contact.html" target="_blank" rel="noopener noreferrer">
                    {t('statusBar.contact')}
                </a>
            </div>

            {/* Attribution */}
            <div class="status-section status-attribution" style={{ 'border-right': 'none' }}>
                <span class="status-heart">❤️</span> {t('statusBar.madeBy')}{' '}
                <a href="https://www.algorisys.com" target="_blank" rel="noopener noreferrer">
                    Algorisys Technologies
                </a>
            </div>
        </div>
    );
};

export default StatusBar;
