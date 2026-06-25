import { batch } from "solid-js";
import { createStore } from "solid-js/store";
import type { DrawingElement, ViewState, ToolType, Layer, GridSettings, AppMode, ElementType, Guide } from "../types";
import { createDefaultSlide, createSlideDocument, DEFAULT_SLIDE_TRANSITION } from '../types/slide-types';
import type { Slide, GlobalSettings, SlideTransition } from '../types/slide-types';
import type { ElementAnimation, DisplayState } from "../types/motion-types";
import { showToast } from "../components/toast";
import { MindmapLayoutEngine, type LayoutDirection, type OutlineNode, getBranchInfo } from "../utils/mindmap-layout";
import { runBooleanOp, polyToPathSubpaths, type BooleanOp, type Poly } from "../utils/path-boolean";
import { shapeToPath } from "../utils/shape-to-path";
import { normalizePoints } from "../utils/render-element";
import { textElementToOutline } from "../utils/text-to-outlines";
import { getPathSubpaths, PathUtils } from "../utils/math/path-utils";
import { getShapeGeometry } from "../utils/shape-geometry";
import { rasterizeWarpedImage } from "../utils/image-warp";
import type { PathAnchor, PathSubpath } from "../types";
import { computeOutlineStroke, computeOffsetPath } from "../utils/path-offset";
import { scalePoints, scalePathAnchors, scalePathSubpaths, scaleEraseStrokes } from "../utils/geometry-scale";
import { defaultWarpGrid, getWarpGrid } from "../utils/envelope-warp";
import { animationEngine } from "../utils/animation/animation-engine";
import { slideTransitionManager } from "../utils/animation/slide-transition-manager";
import { slideBuildManager } from '../utils/animation/slide-build-manager';
import { generateId } from "../utils/id-generator"; // New Import
import { refreshBoundLine } from "../utils/binding-logic";
import { abortDsAlgorithm } from "../utils/ds-operations";
import { getImage } from "../utils/image-cache";

export type Theme = 'light' | 'dark' | 'focus' | 'system';
export type ResolvedTheme = 'light' | 'dark' | 'focus';

const systemPrefersDark = (): boolean =>
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

export const resolveTheme = (theme: Theme): ResolvedTheme =>
    theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme;

// One-time migration: previous focus theme stored white as default stroke.
// With the dark-mode CSS filter inverting black→white at render time,
// stored colors should be canonical (light-mode) so reset white defaults to black.
try {
    if (typeof localStorage !== 'undefined' && !localStorage.getItem('theme-canonical-v1')) {
        const raw = localStorage.getItem('defaultElementStyles');
        if (raw) {
            const parsed = JSON.parse(raw);
            let changed = false;
            if (parsed?.strokeColor === '#ffffff') { parsed.strokeColor = '#000000'; changed = true; }
            if (parsed?.textColor === '#ffffff') { parsed.textColor = '#000000'; changed = true; }
            if (changed) localStorage.setItem('defaultElementStyles', JSON.stringify(parsed));
        }
        localStorage.setItem('theme-canonical-v1', '1');
    }
} catch { /* ignore */ }

interface AppState {
    // Current Active Slide properties (for performance and compatibility)
    elements: DrawingElement[];
    viewState: ViewState;
    layers: Layer[];
    activeLayerId: string;
    gridSettings: GridSettings;
    canvasBackgroundColor: string;
    dimensions: { width: number; height: number };

    // Slide Management
    slides: Slide[];
    activeSlideIndex: number;
    docType: 'infinite' | 'slides';

    // Remaining Global State
    selectedTool: ToolType;
    toolLocked: boolean; // When true, tool stays active after drawing
    selection: string[]; // IDs of selected elements
    defaultElementStyles: Partial<DrawingElement>; // Styles for new elements
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    globalSettings: GlobalSettings;
    showCanvasProperties: boolean;
    undoStackLength: number;
    redoStackLength: number;
    isDirty: boolean; // True when document has unsaved changes
    flowTick: number; // For forcing redraws on flow animations
    // Panel Visibility
    showPropertyPanel: boolean;
    showLayerPanel: boolean;
    isPropertyPanelMinimized: boolean;
    isLayerPanelMinimized: boolean;
    minimapVisible: boolean;
    showRulers: boolean;
    guides: Guide[];
    symmetry: { enabled: boolean; axis: 'vertical' | 'horizontal'; pos: number };
    zenMode: boolean;
    appMode: AppMode;
    showCommandPalette: boolean;
    commandPaletteFilter: string | null;
    selectedPenType: 'fineliner' | 'inkbrush' | 'marker';
    selectedTextType: 'text' | 'richtext';
    selectedConnectorType: 'arrow' | 'line' | 'bezier' | 'elbow' | 'polyline';
    selectedShapeType: 'rectangle' | 'circle' | 'diamond' | 'triangle' | 'hexagon' | 'octagon' | 'parallelogram' | 'star' | 'cloud' | 'heart' | 'cross' | 'checkmark' | 'arrowLeft' | 'arrowRight' | 'arrowUp' | 'arrowDown' | 'capsule' | 'stickyNote' | 'callout' | 'burst' | 'speechBubble' | 'ribbon' | 'bracketLeft' | 'bracketRight' | 'database' | 'document' | 'predefinedProcess' | 'internalStorage' | 'trapezoid' | 'rightTriangle' | 'pentagon' | 'septagon' | 'polygon';
    selectedInfraType: 'server' | 'loadBalancer' | 'firewall' | 'user' | 'messageQueue' | 'lambda' | 'router' | 'browser';
    selectedSketchnoteType: 'starPerson' | 'scroll' | 'wavyDivider' | 'doubleBanner' | 'trophy' | 'clock' | 'gear' | 'target' | 'rocket' | 'flag' | 'key' | 'magnifyingGlass' | 'book' | 'megaphone' | 'eye' | 'thoughtBubble' | 'stickFigure' | 'sittingPerson' | 'presentingPerson' | 'handPointRight' | 'thumbsUp' | 'faceHappy' | 'faceSad' | 'faceConfused';
    selectedStatusType: 'numberedBadge' | 'questionMark' | 'exclamationMark' | 'tag';
    selectedCloudInfraType: 'kubernetes' | 'container' | 'apiGateway' | 'cdn' | 'storageBlob' | 'eventBus' | 'microservice' | 'shield';
    selectedDataMetricsType: 'barChart' | 'pieChart' | 'trendUp' | 'trendDown' | 'funnel' | 'gauge' | 'table';
    selectedConnectionRelType: 'puzzlePiece' | 'chainLink' | 'bridge' | 'magnet' | 'scale' | 'seedling' | 'tree' | 'mountain';
    selectedWireframeType: ElementType;
    layerGroupingModeEnabled: boolean;
    maxLayers: number;
    eraserWidth?: number; // Eraser brush diameter (world units). Undefined = follow stroke width.
    canvasTexture: 'none' | 'dots' | 'grid' | 'graph' | 'paper' | 'notebook';
    isPreviewing: boolean;
    isRecording: boolean;
    selectedTechnicalType: 'dfdProcess' | 'dfdDataStore' | 'isometricCube' | 'cylinder' | 'stateStart' | 'stateEnd' | 'stateSync' | 'activationBar' | 'externalEntity' | 'codeBlock';
    // State Morphing
    states: DisplayState[];
    activeStateId?: string;
    showStatePanel: boolean;
    showSlideNavigator: boolean;
    showSlideToolbar: boolean;
    showMainToolbar: boolean;
    slideToolbarPosition: { x: number, y: number };
    showExportDialog: boolean;
    showUtilityToolbar: boolean;
    showCanvasToolbar: boolean;
    selectedDsType: 'dsArray' | 'dsStack' | 'dsQueue' | 'dsLinkedList' | 'dsBinaryTree' | 'dsHashTable';
    activeDsOpsElementId: string | null;
    selectedUmlType: 'umlClass' | 'umlInterface' | 'umlActor' | 'umlUseCase' | 'umlNote' | 'umlPackage' | 'umlComponent' | 'umlState' | 'umlLifeline' | 'umlFragment' | 'umlSignalSend' | 'umlSignalReceive' | 'umlProvidedInterface' | 'umlRequiredInterface';
    selectedBpmnType: 'bpmnStartEvent' | 'bpmnEndEvent' | 'bpmnIntermediateEvent' | 'bpmnExclusiveGateway' | 'bpmnParallelGateway' | 'bpmnInclusiveGateway' | 'bpmnEventGateway' | 'bpmnTask' | 'bpmnSubProcess' | 'bpmnCallActivity' | 'bpmnDataObject' | 'bpmnAnnotation' | 'bpmnPool' | 'bpmnDataStore' | 'bpmnGroup';

    // Tool-specific styles persistence
    toolStyles: Record<string, Partial<DrawingElement>>;

    // Visual Path Editor State
    pathEditState: {
        isActive: boolean;
        elementId: string | null;
        animationId: string | null;
        // Temporary holding state for points during edit
        // We sync to the element's pathData on every change, but this tracks "Edit Mode"
    };

    focusBranchId: string | null;
    readOnly: boolean;
    cursorPosition: { x: number; y: number };
    welcomeDismissed: boolean;

    // Image Crop Mode
    cropModeElementId: string | null;
    cropRect: { x: number; y: number; width: number; height: number } | null;

    // Video Playback
    activeVideoElementIds: string[];

    // Monotonic counter bumped by mutations that don't otherwise trigger autosave signals
    dirtyRevision: number;
}

const initialDoc = createSlideDocument();

const initialState: AppState = {
    elements: initialDoc.elements,
    viewState: { scale: 1, panX: 0, panY: 0 },
    layers: initialDoc.layers,
    activeLayerId: initialDoc.layers[0].id,
    gridSettings: initialDoc.gridSettings!,
    canvasBackgroundColor: '#ffffff',
    dimensions: { width: 1920, height: 1080 },
    slides: initialDoc.slides,
    activeSlideIndex: 0,
    docType: 'infinite',

    canvasTexture: 'none',
    isPreviewing: false,
    selectedTool: 'selection',
    toolLocked: false, // When true, tool stays active after drawing (double-click to lock)
    selectedUmlType: 'umlClass',
    selectedBpmnType: 'bpmnStartEvent',
    selection: [],
    flowTick: 0,
    isRecording: false,
    focusBranchId: null,
    readOnly: false,
    cursorPosition: { x: 0, y: 0 },
    welcomeDismissed: false,
    defaultElementStyles: (() => {
        const builtinDefaults: Partial<DrawingElement> = {
            strokeColor: '#000000',
            textColor: '#000000',
            backgroundColor: 'transparent',
            fillStyle: 'solid',
            strokeWidth: 4,
            strokeStyle: 'solid',
            roughness: 1,
            renderStyle: 'sketch',
            opacity: 100,
            angle: 0,
            roundness: null,
            borderRadius: 9,
            locked: false,
            fontSize: 28,
            fontFamily: 'hand-drawn',
            fontWeight: false,
            fontStyle: false,
            textAlign: 'left',
            verticalAlign: 'middle',
            startArrowhead: null,
            endArrowhead: null,
            startArrowheadSize: 28,
            endArrowheadSize: 28,
            autoResize: false,
            flowColor: undefined,
            seed: 0,
            shadowEnabled: false,
            shadowColor: 'rgba(0,0,0,0.3)',
            shadowBlur: 10,
            shadowOffsetX: 5,
            shadowOffsetY: 5,
            gradientStart: '#ffffff',
            gradientEnd: '#000000',
            gradientDirection: 45,
            smoothing: 3,
            taperAmount: 0.15,
            velocitySensitivity: 0.5
        };
        try {
            const saved = localStorage.getItem('defaultElementStyles');
            if (saved) return { ...builtinDefaults, ...JSON.parse(saved) };
        } catch { /* ignore parse errors */ }
        return builtinDefaults;
    })(),
    // Initialize per-tool default styles
    toolStyles: {
        fineliner: { strokeWidth: 4 },
        inkbrush: { strokeWidth: 6 },
    } as Record<string, Partial<any>>,
    theme: ((localStorage.getItem('theme') as Theme) || 'light'),
    resolvedTheme: resolveTheme((localStorage.getItem('theme') as Theme) || 'light'),
    globalSettings: {
        theme: ((localStorage.getItem('theme') as Theme) || 'light'),
        animationEnabled: true,
        reducedMotion: false,
        renderStyle: 'sketch',
        showQuickToolbar: true, // Default to showing the toolbar
        colorPalette: (localStorage.getItem('colorPalette') || 'default'),
        smartShape: (localStorage.getItem('smartShape') ?? '1') !== '0',
        penPressure: (localStorage.getItem('penPressure') ?? '1') !== '0',
        penStabilization: (() => { const v = parseFloat(localStorage.getItem('penStabilization') ?? '0'); return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0; })(),
        // Default OFF for now — the balanced auto-reflow needs more work (lays out
        // vertically in practice). Re-enable via Settings → Mindmap. Existing explicit
        // choices in localStorage are still respected.
        mindmapAutoLayout: (localStorage.getItem('mindmapAutoLayout') ?? '0') !== '0',
        mindmapLayoutDirection: (localStorage.getItem('mindmapLayoutDirection') as GlobalSettings['mindmapLayoutDirection']) || 'horizontal-right',
        toolbarVertical: (localStorage.getItem('toolbarVertical') ?? '0') !== '0',
        toolbarWrap: parseInt(localStorage.getItem('toolbarWrap') ?? '0', 10) || 0,
    },
    showCanvasProperties: false,
    undoStackLength: 0,
    redoStackLength: 0,
    isDirty: false,
    showPropertyPanel: false,
    showLayerPanel: false,
    isPropertyPanelMinimized: false,
    isLayerPanelMinimized: false,
    minimapVisible: false,
    showRulers: (() => { try { return localStorage.getItem('showRulers') === '1'; } catch { return false; } })(),
    guides: [],
    symmetry: { enabled: false, axis: 'vertical', pos: 0 },
    zenMode: false,
    appMode: 'design',
    showCommandPalette: false,
    commandPaletteFilter: null,
    selectedPenType: 'fineliner',
    selectedTextType: 'text',
    selectedConnectorType: 'arrow',
    selectedShapeType: 'rectangle',
    selectedInfraType: 'server',
    selectedSketchnoteType: 'starPerson',
    selectedStatusType: 'numberedBadge',
    selectedCloudInfraType: 'kubernetes',
    selectedDataMetricsType: 'barChart',
    selectedConnectionRelType: 'puzzlePiece',
    selectedWireframeType: 'browserWindow',
    layerGroupingModeEnabled: false,
    maxLayers: 20,
    eraserWidth: (() => {
        try {
            const saved = localStorage.getItem('eraserWidth');
            if (saved !== null) { const n = Number(saved); if (n > 0) return n; }
        } catch { /* ignore */ }
        return undefined;
    })(),
    selectedTechnicalType: 'dfdProcess',
    selectedDsType: 'dsArray',
    activeDsOpsElementId: null,
    states: [],
    showStatePanel: false,
    showSlideNavigator: true,
    showSlideToolbar: true,
    showMainToolbar: true,
    slideToolbarPosition: { x: window.innerWidth / 2 - 150, y: window.innerHeight - 80 },
    showExportDialog: false,
    showUtilityToolbar: false,
    showCanvasToolbar: true,
    pathEditState: {
        isActive: false,
        elementId: null,
        animationId: null
    },
    cropModeElementId: null,
    cropRect: null,
    activeVideoElementIds: [],
    dirtyRevision: 0,
};

export const [store, setStore] = createStore<AppState>(initialState);

// Compatibility Getter (can't add getter to solid store directly easily, need to use helper or property access)
// For now, we update call sites. But let's add the export helper I forgot.
export const setAppMode = (mode: AppMode) => {
    setStore('appMode', mode);
};

/** Bump to notify autosave of mutations that don't change array lengths or push history */
export const bumpDirtyRevision = () => {
    setStore('dirtyRevision', store.dirtyRevision + 1);
};

// History Stacks - include full document state
interface HistorySnapshot {
    elements: DrawingElement[];
    layers: Layer[];
    slides: Slide[];
    states: DisplayState[];
    gridSettings: GridSettings;
    canvasBackgroundColor: string;
    docType: 'infinite' | 'slides';
}
const undoStack: HistorySnapshot[] = [];
const redoStack: HistorySnapshot[] = [];

// One-level-deep snapshot: copy the container arrays AND shallow-clone every
// item inside them.
//
// Why the per-item clone is mandatory: Solid's `setStore("elements", pred,
// updates)` (used by updateElement, updateLayer, etc.) MERGES `updates` into the
// existing object IN PLACE — the object keeps its identity, only the changed
// keys get new values. A bare `store.elements.slice()` would therefore capture
// references to the very objects a later edit mutates, so undo would restore the
// already-mutated values (i.e. text/move/resize/recolor edits silently failed to
// undo). Add/delete/reorder happened to work only because they replace the whole
// array. Cloning each item decouples the snapshot from in-place merges.
//
// This is NOT a full deep clone: the spread copies top-level props only, so
// nested arrays (e.g. a stroke's `points`) are shared by reference. That's safe
// because every code path that changes a nested array does so by assigning a
// brand-new array (function updaters returning `[...]`), never by mutating the
// existing one in place. It keeps the cost O(elements × props) instead of
// O(total points) — the old `JSON.parse(JSON.stringify(...))` deep clone was
// 50-100ms per push on iPad with many strokes, long enough to block the main
// thread and drop the next stroke's `pointerdown` during fast writing.
const captureSnapshot = (): HistorySnapshot => ({
    elements: store.elements.map(e => ({ ...e })),
    layers: store.layers.map(l => ({ ...l })),
    slides: store.slides.map(s => ({ ...s })),
    states: store.states.map(s => ({ ...s })),
    gridSettings: { ...store.gridSettings },
    canvasBackgroundColor: store.canvasBackgroundColor,
    docType: store.docType,
});

const restoreSnapshot = (snapshot: HistorySnapshot) => {
    setStore("elements", snapshot.elements);
    setStore("layers", snapshot.layers);
    setStore("slides", snapshot.slides);
    setStore("states", snapshot.states);
    setStore("gridSettings", snapshot.gridSettings);
    setStore("canvasBackgroundColor", snapshot.canvasBackgroundColor);
    setStore("docType", snapshot.docType);
    setStore("selection", []); // Clear selection to avoid stale IDs
};

export const pushToHistory = () => {
    undoStack.push(captureSnapshot());
    if (undoStack.length > 50) undoStack.shift();
    redoStack.length = 0;

    setStore("undoStackLength", undoStack.length);
    setStore("redoStackLength", 0);
};

export const undo = () => {
    if (undoStack.length === 0) return;

    redoStack.push(captureSnapshot());

    const previousState = undoStack.pop();
    if (previousState) {
        restoreSnapshot(previousState);
    }

    setStore("undoStackLength", undoStack.length);
    setStore("redoStackLength", redoStack.length);
};

export const redo = () => {
    if (redoStack.length === 0) return;

    undoStack.push(captureSnapshot());

    const nextState = redoStack.pop();
    if (nextState) {
        restoreSnapshot(nextState);
    }

    setStore("undoStackLength", undoStack.length);
    setStore("redoStackLength", redoStack.length);
};

export const addElement = (element: DrawingElement) => {
    pushToHistory(); // Save state BEFORE adding
    setStore("elements", (els) => [...els, element]);
};

export const addChildNode = (parentId: string, opts: { recordHistory?: boolean; text?: string; select?: boolean; reflow?: boolean; animate?: boolean } = {}) => {
    const parent = store.elements.find(e => e.id === parentId);
    if (!parent) return;

    if (opts.recordHistory !== false) pushToHistory();
    const newId = generateId(parent.type);
    const hOffset = 100;
    const vGap = 40;

    // Resolve branch color and depth-based stroke width
    const branch = getBranchInfo(parent.id, store.elements);

    // Check for existing children to avoid overlap
    const existingChildren = store.elements.filter(
        e => e.parentId === parent.id &&
        e.type !== 'organicBranch' && e.type !== 'arrow' && e.type !== 'line' && e.type !== 'bezier'
    );

    let childX = parent.x + parent.width + hOffset;
    let childY = parent.y;

    if (existingChildren.length > 0) {
        // Place below the last existing child
        const lastChild = existingChildren.reduce((a, b) => (a.y + a.height > b.y + b.height) ? a : b);
        childX = lastChild.x;
        childY = lastChild.y + lastChild.height + vGap;
    }

    // Inherit type-specific properties from parent (video, image)
    const typeSpecificProps: Partial<DrawingElement> = {};
    if (parent.type === 'video') {
        typeSpecificProps.videoURL = parent.videoURL;
        typeSpecificProps.videoEmbedURL = parent.videoEmbedURL;
        typeSpecificProps.videoPosterURL = parent.videoPosterURL;
        typeSpecificProps.videoPosterDataURL = parent.videoPosterDataURL;
        typeSpecificProps.videoProvider = parent.videoProvider;
        typeSpecificProps.videoAutoplay = parent.videoAutoplay;
        typeSpecificProps.videoLoop = parent.videoLoop;
        typeSpecificProps.videoMuted = parent.videoMuted ?? true;
        typeSpecificProps.videoLocked = false;
        typeSpecificProps.backgroundColor = parent.backgroundColor || '#1a1a2e';
    } else if (parent.type === 'image') {
        typeSpecificProps.dataURL = parent.dataURL;
        typeSpecificProps.mimeType = parent.mimeType;
        typeSpecificProps.backgroundColor = parent.backgroundColor || 'transparent';
    }

    const newElement: DrawingElement = {
        ...store.defaultElementStyles,
        // Inherit styles from parent, with depth-based tapering
        strokeColor: branch.color,
        backgroundColor: parent.backgroundColor,
        fillStyle: parent.fillStyle,
        strokeWidth: branch.strokeWidth,
        roughness: parent.roughness,
        renderStyle: parent.renderStyle,
        opacity: branch.opacity,
        strokeStyle: parent.strokeStyle || 'solid',

        id: newId,
        type: (parent.type === 'line' || parent.type === 'arrow') ? 'rectangle' : parent.type,
        x: childX,
        y: childY,
        width: parent.width > 0 ? parent.width : 100,
        height: parent.height > 0 ? parent.height : 60,
        layerId: store.activeLayerId,
        parentId: parent.id,
        text: "",
        ...(opts.text ? { containerText: opts.text } : {}),
        isCollapsed: false,
        angle: 0,
        seed: Math.floor(Math.random() * 2 ** 31),
        roundness: null,
        locked: false,
        link: null,
        ...typeSpecificProps,
    };

    // Compute organicBranch connector with proper S-curve control points
    const cStartX = parent.x + parent.width;
    const cStartY = parent.y + parent.height / 2;
    const childHeight = parent.height > 0 ? parent.height : 60;
    const cEndX = childX;
    const cEndY = childY + childHeight / 2;
    const cNX = Math.min(cStartX, cEndX), cNY = Math.min(cStartY, cEndY);
    const cNW = Math.abs(cEndX - cStartX), cNH = Math.abs(cEndY - cStartY);
    const cRSX = cStartX - cNX, cRSY = cStartY - cNY, cREX = cEndX - cNX, cREY = cEndY - cNY;
    const cDX = cREX - cRSX;

    const connector: DrawingElement = {
        ...store.defaultElementStyles,
        id: generateId('organicBranch'),
        type: 'organicBranch',
        x: cNX,
        y: cNY,
        width: cNW,
        height: cNH,
        layerId: store.activeLayerId,
        startBinding: { elementId: parent.id, gap: 0, position: 'right', focus: 0 },
        endBinding: { elementId: newId, gap: 0, position: 'left', focus: 0 },
        curveType: 'bezier',
        angle: 0,
        seed: Math.floor(Math.random() * 2 ** 31),
        roundness: null,
        locked: false,
        link: null,
        opacity: branch.opacity,
        renderStyle: parent.renderStyle,
        strokeColor: branch.color,
        backgroundColor: 'transparent',
        fillStyle: parent.fillStyle,
        strokeStyle: parent.strokeStyle,
        strokeWidth: branch.strokeWidth,
        roughness: parent.roughness,
        points: [cRSX, cRSY, cREX, cREY],
        controlPoints: [
            { x: cNX + cRSX + cDX * 0.5, y: cNY + cRSY },
            { x: cNX + cREX - cDX * 0.5, y: cNY + cREY }
        ]
    };

    const connectorId = connector.id;
    setStore("elements", els => [...els, newElement, connector]);

    // Movement sync: Add connector to boundElements of both nodes
    setStore("elements", e => e.id === parentId, "boundElements", b => [...(b || []), { id: connectorId, type: 'organicBranch' as const }]);
    setStore("elements", e => e.id === newId, "boundElements", b => [...(b || []), { id: connectorId, type: 'organicBranch' as const }]);

    // Snap connector endpoints to actual shape boundaries (important for non-rectangular shapes like cloud)
    refreshBoundLine(connectorId, () => store.elements, (id, upd) => updateElement(id, upd, false));

    if (opts.select !== false) setStore("selection", [newId]);
    // Auto-reflow the tree so the new node lands in a tidy slot (unless the caller
    // opts out — e.g. paste builds many nodes then lays out once at the end).
    if (opts.reflow !== false) relayoutMindmap(parent.id, { animate: opts.animate });
    return newId;
};

/**
 * Smart paste: turn an indented / bulleted text outline into a mindmap subtree
 * under `parentId`. Builds every node + connector in a single history step, then
 * runs the layout engine over the whole tree so the result is tidy (no auto-reflow
 * elsewhere, so this is the one place paste cleans up after itself). Returns the
 * ids of the created nodes (empty if the outline was trivial/single-line).
 */
export const pasteMindmapOutline = (parentId: string, outline: OutlineNode[]): string[] => {
    const parent = store.elements.find(e => e.id === parentId);
    if (!parent || outline.length === 0) return [];

    pushToHistory();
    const created: string[] = [];
    const build = (pId: string, nodes: OutlineNode[]) => {
        for (const n of nodes) {
            const id = addChildNode(pId, { recordHistory: false, text: n.text, select: false, reflow: false });
            if (!id) continue;
            created.push(id);
            if (n.children.length) build(id, n.children);
        }
    };
    build(parentId, outline);

    if (created.length === 0) return [];

    // Tidy the whole tree with its resolved direction (balanced by default) so the
    // pasted nodes match the layout auto-reflow uses — no jump on the next edit.
    // Done unconditionally (paste is an explicit bulk action), even if auto-layout
    // is toggled off.
    const rootId = findMindmapRoot(parentId);
    layoutMindmapTree(rootId, resolveMindmapDirection(rootId));

    setStore("selection", created);
    return created;
};

export const addSiblingNode = (siblingId: string, opts: { animate?: boolean } = {}) => {
    const sibling = store.elements.find(e => e.id === siblingId);
    if (!sibling) return;

    const parentId = sibling.parentId;
    if (!parentId) return;

    pushToHistory();
    const newId = generateId(sibling.type);
    // Dynamic spacing based on sibling height
    const vOffset = sibling.height + 40;

    // Resolve branch color — new sibling gets its own branch color from PALETTE
    const branch = getBranchInfo(parentId, store.elements);

    // Inherit type-specific properties from sibling (video, image)
    const siblingTypeProps: Partial<DrawingElement> = {};
    if (sibling.type === 'video') {
        siblingTypeProps.videoURL = sibling.videoURL;
        siblingTypeProps.videoEmbedURL = sibling.videoEmbedURL;
        siblingTypeProps.videoPosterURL = sibling.videoPosterURL;
        siblingTypeProps.videoPosterDataURL = sibling.videoPosterDataURL;
        siblingTypeProps.videoProvider = sibling.videoProvider;
        siblingTypeProps.videoAutoplay = sibling.videoAutoplay;
        siblingTypeProps.videoLoop = sibling.videoLoop;
        siblingTypeProps.videoMuted = sibling.videoMuted ?? true;
        siblingTypeProps.videoLocked = false;
    } else if (sibling.type === 'image') {
        siblingTypeProps.dataURL = sibling.dataURL;
        siblingTypeProps.mimeType = sibling.mimeType;
    }

    const newElement: DrawingElement = {
        ...store.defaultElementStyles,
        // Inherit styles from sibling, with depth-based tapering
        strokeColor: branch.color,
        backgroundColor: sibling.backgroundColor,
        fillStyle: sibling.fillStyle,
        strokeWidth: branch.strokeWidth,
        roughness: sibling.roughness,
        renderStyle: sibling.renderStyle,
        opacity: branch.opacity,
        strokeStyle: sibling.strokeStyle || 'solid',

        id: newId,
        type: sibling.type,
        x: sibling.x,
        y: sibling.y + vOffset,
        width: sibling.width,
        height: sibling.height,
        layerId: store.activeLayerId,
        parentId: parentId,
        text: "",
        isCollapsed: false,
        angle: 0,
        seed: Math.floor(Math.random() * 2 ** 31),
        roundness: null,
        locked: false,
        link: null,
        ...siblingTypeProps,
    };

    // Compute organicBranch connector from parent to new sibling
    const parentEl = store.elements.find(e => e.id === parentId);
    const cStartX = parentEl ? parentEl.x + parentEl.width : sibling.x - 150;
    const cStartY = parentEl ? parentEl.y + parentEl.height / 2 : sibling.y + vOffset + sibling.height / 2;
    const cEndX = sibling.x;
    const cEndY = sibling.y + vOffset + sibling.height / 2;
    const cNX = Math.min(cStartX, cEndX), cNY = Math.min(cStartY, cEndY);
    const cNW = Math.abs(cEndX - cStartX), cNH = Math.abs(cEndY - cStartY);
    const cRSX = cStartX - cNX, cRSY = cStartY - cNY, cREX = cEndX - cNX, cREY = cEndY - cNY;
    const cDX = cREX - cRSX;

    const connector: DrawingElement = {
        ...store.defaultElementStyles,
        id: generateId('organicBranch'),
        type: 'organicBranch',
        x: cNX,
        y: cNY,
        width: cNW,
        height: cNH,
        layerId: store.activeLayerId,
        startBinding: { elementId: parentId, gap: 0, position: 'right', focus: 0 },
        endBinding: { elementId: newId, gap: 0, position: 'left', focus: 0 },
        curveType: 'bezier',
        angle: 0,
        seed: Math.floor(Math.random() * 2 ** 31),
        roundness: null,
        locked: false,
        link: null,
        opacity: branch.opacity,
        renderStyle: sibling.renderStyle,
        strokeColor: branch.color,
        backgroundColor: 'transparent',
        fillStyle: sibling.fillStyle,
        strokeStyle: sibling.strokeStyle,
        strokeWidth: branch.strokeWidth,
        roughness: sibling.roughness,
        points: [cRSX, cRSY, cREX, cREY],
        controlPoints: [
            { x: cNX + cRSX + cDX * 0.5, y: cNY + cRSY },
            { x: cNX + cREX - cDX * 0.5, y: cNY + cREY }
        ]
    };

    const connectorId = connector.id;
    setStore("elements", els => [...els, newElement, connector]);

    // Movement sync: Add connector to boundElements of both nodes
    setStore("elements", e => e.id === parentId, "boundElements", b => [...(b || []), { id: connectorId, type: 'organicBranch' as const }]);
    setStore("elements", e => e.id === newId, "boundElements", b => [...(b || []), { id: connectorId, type: 'organicBranch' as const }]);

    // Snap connector endpoints to actual shape boundaries (important for non-rectangular shapes like cloud)
    refreshBoundLine(connectorId, () => store.elements, (id, upd) => updateElement(id, upd, false));

    setStore("selection", [newId]);
    relayoutMindmap(parentId, { animate: opts.animate });
    return newId;
};

export const toggleCollapseSelection = () => {
    if (store.selection.length === 0) return;
    pushToHistory();
    const affected = [...store.selection];
    setStore('elements',
        el => store.selection.includes(el.id),
        el => ({ isCollapsed: !el.isCollapsed })
    );
    // Reflow each affected tree so siblings close the gap (collapse) or open up (expand).
    // One shared animation channel, so only animate when a single tree is affected.
    const roots = new Set(affected.map(id => findMindmapRoot(id)));
    const animate = roots.size === 1;
    for (const r of roots) relayoutMindmap(r, { animate });
};

export const setShowCanvasProperties = (visible: boolean) => {
    setStore("showCanvasProperties", visible);
    if (visible) {
        setStore("showPropertyPanel", true);
        setStore("isPropertyPanelMinimized", false);
    }
};

export const deleteElements = (ids: string[]) => {
    if (ids.length === 0) return;
    pushToHistory(); // Save state before deletion
    // Uncontain children of deleted pools
    const deletedPoolIds = new Set(
        ids.filter(id => {
            const el = store.elements.find(e => e.id === id);
            return el && el.type === 'bpmnPool';
        })
    );
    if (deletedPoolIds.size > 0) {
        store.elements.forEach(el => {
            if (el.poolContainerId && deletedPoolIds.has(el.poolContainerId)) {
                updateElement(el.id, { poolContainerId: null, poolLaneIndex: undefined }, false);
            }
        });
    }
    // Mindmap: remember surviving parents of deleted nodes so we can reflow their
    // trees (siblings close the gap) after the deletion.
    const deletedSet = new Set(ids);
    const survivingParents = new Set<string>();
    for (const id of ids) {
        const el = store.elements.find(e => e.id === id);
        if (el?.parentId && !deletedSet.has(el.parentId)) survivingParents.add(el.parentId);
    }

    setStore("elements", (els) => els.filter(el => !ids.includes(el.id)));
    setStore("selection", []); // Clear selection

    if (survivingParents.size > 0) {
        const roots = new Set([...survivingParents].map(id => findMindmapRoot(id)));
        const animate = roots.size === 1;
        for (const r of roots) relayoutMindmap(r, { animate });
    }
};

export const bringToFront = (ids: string[]) => {
    if (ids.length === 0) return;
    pushToHistory();
    setStore("elements", (els) => {
        const selected = els.filter(el => ids.includes(el.id));
        const others = els.filter(el => !ids.includes(el.id));
        return [...others, ...selected];
    });
};

export const sendToBack = (ids: string[]) => {
    if (ids.length === 0) return;
    pushToHistory();
    setStore("elements", (els) => {
        const selected = els.filter(el => ids.includes(el.id));
        const others = els.filter(el => !ids.includes(el.id));
        return [...selected, ...others];
    });
};

export const updateGlobalTickerState = () => {
    const hasFlow = store.elements.some(el => el.flowAnimation);
    animationEngine.setForceTicker(hasFlow);
};

export const updateElement = (id: string, updates: Partial<DrawingElement>, recordHistory = false) => {
    if (recordHistory) pushToHistory();

    // If updating text on a richtext element via property panel (without richText), clear richText formatting
    if ('text' in updates && !('richText' in updates)) {
        const el = store.elements.find(e => e.id === id);
        if (el?.type === 'richtext') {
            updates = { ...updates, richText: undefined };
        }
    }

    setStore("elements", (el) => el.id === id, updates);
    // Bump the coarse "something changed" counter so the canvas's big redraw
    // effect can subscribe to a single signal instead of iterating every
    // element × 80+ properties on each mutation. On iPad with Apple Pencil
    // writing at ~120 Hz, that iteration was the dominant per-frame cost.
    bumpDirtyRevision();
    if ('flowAnimation' in updates) {
        updateGlobalTickerState();
    }
    // When arrowAnchorAlign changes, refresh all bound connectors
    if ('arrowAnchorAlign' in updates) {
        const el = store.elements.find(e => e.id === id);
        if (el?.boundElements) {
            for (const b of el.boundElements) {
                refreshBoundLine(b.id, () => store.elements, (bid, upd) => updateElement(bid, upd, false));
            }
        }
    }
};

export const updateAnimation = (elementId: string, animationId: string, updates: Partial<ElementAnimation>, recordHistory = false) => {
    if (recordHistory) pushToHistory();
    setStore("elements",
        (el) => el.id === elementId,
        "animations",
        (anim: ElementAnimation) => anim.id === animationId,
        updates
    );
};

export const reorderAnimation = (elementId: string, animationId: string, direction: 'up' | 'down', recordHistory = true) => {
    const el = store.elements.find(e => e.id === elementId);
    if (!el || !el.animations) return;

    const animations = [...el.animations];
    const index = animations.findIndex(a => a.id === animationId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= animations.length) return;

    if (recordHistory) pushToHistory();

    const [removed] = animations.splice(index, 1);
    animations.splice(newIndex, 0, removed);

    setStore("elements", (e) => e.id === elementId, "animations", animations);
};

export const moveSelectedElements = (dx: number, dy: number, recordHistory = false) => {
    if (store.selection.length === 0) return;
    if (recordHistory) pushToHistory();

    setStore("elements", (el) => store.selection.includes(el.id), (el) => ({
        x: el.x + dx,
        y: el.y + dy
    }));
    // Remember as the replayable transform for Transform Again (Ctrl+Shift+D).
    recordTransform({ dx, dy });
    bumpDirtyRevision();
};

export const setViewState = (updates: Partial<ViewState>) => {
    setStore("viewState", (vs) => ({ ...vs, ...updates }));
};

// ─── Canvas (view) rotation ──────────────────────────────────────────────
// Rotation is a screen-space spin of the whole canvas about the viewport
// centre (Procreate-style), for comfortable freehand sketching on large
// illustrations. It is orthogonal to pan/zoom: panX/panY/scale are untouched,
// only `rotation` changes, and the render + input chokepoints pivot about the
// viewport centre — so the world point under the screen centre stays put.
const TAU = Math.PI * 2;
const ROTATION_SNAP_RAD = (2 * Math.PI) / 180; // snap to 0 within ±2°

// Wrap to (-π, π] so the readout and snap behave near the 0/360 seam.
export const normalizeRotation = (r: number): number => {
    r = r % TAU;
    if (r > Math.PI) r -= TAU;
    else if (r <= -Math.PI) r += TAU;
    return r;
};

/** Rotate the canvas view by `deltaRadians` about the viewport centre. */
export const rotateView = (deltaRadians: number) => {
    let next = normalizeRotation((store.viewState.rotation || 0) + deltaRadians);
    if (Math.abs(next) < ROTATION_SNAP_RAD) next = 0; // gentle detent at upright
    setViewState({ rotation: next });
};

/** Snap the canvas view back to upright (rotation 0). No-op if already upright. */
export const resetRotation = () => {
    if (!store.viewState.rotation) return;
    setViewState({ rotation: 0 });
};

/**
 * The full viewport transform incl. the rotation pivot, for DOM overlays that
 * position themselves with worldToScreen(). The canvas is full-window, so the
 * pivot is the window centre (matches canvas.tsx's canvasRef.width/2 pivot).
 * Reads store.viewState fields so callers stay reactive.
 */
export const currentViewport = () => ({
    scale: store.viewState.scale,
    panX: store.viewState.panX,
    panY: store.viewState.panY,
    rotation: store.viewState.rotation,
    centerX: window.innerWidth / 2,
    centerY: window.innerHeight / 2,
});

let pendingCursorPos: { x: number; y: number } | null = null;
let cursorRafId: number | null = null;

export const setCursorPosition = (pos: { x: number; y: number }) => {
    pendingCursorPos = pos;
    if (cursorRafId === null) {
        cursorRafId = requestAnimationFrame(() => {
            if (pendingCursorPos) {
                setStore("cursorPosition", pendingCursorPos);
                pendingCursorPos = null;
            }
            cursorRafId = null;
        });
    }
};

export const setSelectedTool = (tool: ToolType) => {
    // 1. Save current tool's styles
    const currentTool = store.selectedTool;
    if (currentTool !== 'selection' && currentTool !== 'lasso') {
        const currentStyles = JSON.parse(JSON.stringify(store.defaultElementStyles));
        setStore('toolStyles', currentTool, currentStyles);
    }

    // 2. Switch tool and reset lock
    setStore('selectedTool', tool);
    setStore('toolLocked', false);
    if (tool !== 'selection' && tool !== 'lasso' && tool !== 'pan' && tool !== 'eraser') {
        setStore('selection', []);
    }

    // 3. Restore new tool's styles (if they exist)
    if (tool !== 'selection' && tool !== 'lasso') {
        const savedStyles = store.toolStyles[tool];
        if (savedStyles) {
            updateDefaultStyles(savedStyles);
        }
        // If no saved styles, we keep the current defaults (inheritance behavior)
    }

    // Adjust default styles based on tool (Tool-specific hard overrides)
    if (tool === 'arrow') {
        updateDefaultStyles({ endArrowhead: 'arrow' });
    } else if (tool === 'line' || tool === 'polyline') {
        updateDefaultStyles({ endArrowhead: null });
    }

    if (tool === 'starPerson' || tool === 'scroll' || tool === 'wavyDivider' || tool === 'doubleBanner' ||
        tool === 'lightbulb' || tool === 'signpost' || tool === 'burstBlob' ||
        tool === 'browserWindow' || tool === 'mobilePhone' || tool === 'ghostButton' || tool === 'inputField') {
        updateDefaultStyles({ autoResize: false });
    } else {
        updateDefaultStyles({ autoResize: false });
    }

    // Auto-show property panel when a drawing tool is selected
    const NON_DRAWING_TOOLS = ['selection', 'lasso', 'pan', 'eraser'];
    if (!NON_DRAWING_TOOLS.includes(tool) && !store.showPropertyPanel) {
        setStore('showPropertyPanel', true);
    }
};

export const setToolLocked = (locked: boolean) => {
    setStore('toolLocked', locked);
};

// Keys that are persisted in the settings dialog
const SETTINGS_KEYS = ['fontFamily', 'fontSize', 'strokeColor', 'backgroundColor', 'strokeWidth', 'renderStyle', 'opacity'] as const;

export const updateDefaultStyles = (updates: Partial<DrawingElement>) => {
    setStore("defaultElementStyles", (s) => ({ ...s, ...updates }));
    // Persist user-configurable settings to localStorage
    const hasSettingsKey = SETTINGS_KEYS.some(k => k in updates);
    if (hasSettingsKey) {
        try {
            const current = store.defaultElementStyles;
            const toSave: Record<string, any> = {};
            for (const key of SETTINGS_KEYS) {
                if (current[key] !== undefined) toSave[key] = current[key];
            }
            localStorage.setItem('defaultElementStyles', JSON.stringify(toSave));
        } catch { /* ignore storage errors */ }
    }
};

export const resetDefaultStyles = () => {
    const builtinDefaults: Partial<DrawingElement> = {
        strokeColor: '#000000',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 4,
        strokeStyle: 'solid',
        roughness: 1,
        renderStyle: 'sketch',
        opacity: 100,
        fontSize: 28,
        fontFamily: 'hand-drawn',
    };
    setStore("defaultElementStyles", (s) => ({ ...s, ...builtinDefaults }));
    try { localStorage.removeItem('defaultElementStyles'); } catch { /* ignore */ }
};

export const updateGlobalSettings = (updates: Partial<GlobalSettings>) => {
    setStore("globalSettings", (s) => ({ ...s, ...updates }));

    // Sync renderStyle to default styles and all cached tool styles
    if (updates.renderStyle) {
        updateDefaultStyles({ renderStyle: updates.renderStyle });
        // Propagate to all cached per-tool styles so switching tools doesn't revert
        for (const tool of Object.keys(store.toolStyles)) {
            if ((store.toolStyles as any)[tool]?.renderStyle !== undefined) {
                setStore('toolStyles', tool as any, 'renderStyle' as any, updates.renderStyle);
            }
        }
    }

    // Persist palette across reloads even when no document is saved.
    if (updates.colorPalette !== undefined) {
        try { localStorage.setItem('colorPalette', updates.colorPalette); } catch { /* ignore */ }
    }
    // Persist input-behaviour toggles independently of any saved document.
    if (updates.smartShape !== undefined) {
        try { localStorage.setItem('smartShape', updates.smartShape ? '1' : '0'); } catch { /* ignore */ }
    }
    if (updates.penPressure !== undefined) {
        try { localStorage.setItem('penPressure', updates.penPressure ? '1' : '0'); } catch { /* ignore */ }
    }
    if (updates.penStabilization !== undefined) {
        try { localStorage.setItem('penStabilization', String(updates.penStabilization)); } catch { /* ignore */ }
    }
    if (updates.mindmapAutoLayout !== undefined) {
        try { localStorage.setItem('mindmapAutoLayout', updates.mindmapAutoLayout ? '1' : '0'); } catch { /* ignore */ }
    }
    if (updates.mindmapLayoutDirection !== undefined) {
        try { localStorage.setItem('mindmapLayoutDirection', updates.mindmapLayoutDirection); } catch { /* ignore */ }
    }
    if (updates.toolbarVertical !== undefined) {
        try { localStorage.setItem('toolbarVertical', updates.toolbarVertical ? '1' : '0'); } catch { /* ignore */ }
    }
    if (updates.toolbarWrap !== undefined) {
        try { localStorage.setItem('toolbarWrap', String(updates.toolbarWrap)); } catch { /* ignore */ }
    }
};

// Remembered strength so the quick toggle can restore the user's last setting
// when flipping stabilization back on. Seeded from the persisted value.
let lastStabilizationStrength = (() => {
    const v = store.globalSettings.penStabilization ?? 0;
    return v > 0 ? v : 0.5;
})();

/** Flip stroke stabilization on/off, remembering the last non-zero strength. */
export const togglePenStabilization = () => {
    const cur = store.globalSettings.penStabilization ?? 0;
    if (cur > 0) {
        lastStabilizationStrength = cur;
        updateGlobalSettings({ penStabilization: 0 });
    } else {
        updateGlobalSettings({ penStabilization: lastStabilizationStrength || 0.5 });
    }
};

// --- Path Editor Actions ---
export const setPathEditing = (isActive: boolean, elementId: string | null = null, animationId: string | null = null) => {
    // The path-editor SVG overlay isn't rotation-aware yet; block entry while the
    // canvas is rotated (Shift+0 to reset). Turning OFF is always allowed.
    if (isActive && store.viewState.rotation) {
        showToast('Reset canvas rotation (Shift+0) to edit paths', 'info', 1800);
        return;
    }
    setStore("pathEditState", {
        isActive,
        elementId,
        animationId
    });

    // If turning on, ensure property panel is visible but maybe switch to adequate mode?
    // If turning off, maybe clean up?
    if (isActive) {
        showToast("Path Edit Mode Active", "info");
    }
};

// --- Image Crop Actions ---
export const enterCropMode = (elementId: string) => {
    const el = store.elements.find(e => e.id === elementId);
    if (!el || el.type !== 'image' || !el.dataURL) return;

    // Initialize crop rect in element-local coordinates (0,0 = top-left of element)
    const cropRect = { x: 0, y: 0, width: el.width, height: el.height };

    if (el.crop) {
        // Convert stored source-pixel crop to element-local coordinates
        const img = getImage(el.dataURL);
        if (img) {
            const sx = el.width / img.naturalWidth;
            const sy = el.height / img.naturalHeight;
            cropRect.x = el.crop.x * sx;
            cropRect.y = el.crop.y * sy;
            cropRect.width = el.crop.width * sx;
            cropRect.height = el.crop.height * sy;
        }
    }

    setStore('cropModeElementId', elementId);
    setStore('cropRect', cropRect);
};

export const exitCropMode = (apply: boolean) => {
    if (apply && store.cropModeElementId && store.cropRect) {
        pushToHistory();
        updateElement(store.cropModeElementId, { crop: { ...store.cropRect } });
    }
    setStore('cropModeElementId', null);
    setStore('cropRect', null);
};

export const updateCropRect = (rect: { x: number; y: number; width: number; height: number }) => {
    setStore('cropRect', { ...rect });
};

export const resetCrop = (elementId: string) => {
    pushToHistory();
    updateElement(elementId, { crop: null });
    setStore('cropModeElementId', null);
    setStore('cropRect', null);
};

// --- Video Playback Actions ---
export const startVideoPlayback = (elementId: string) => {
    const el = store.elements.find(e => e.id === elementId);
    if (!el || el.type !== 'video' || !el.videoURL) return;
    if (!store.activeVideoElementIds.includes(elementId)) {
        setStore('activeVideoElementIds', ids => [...ids, elementId]);
    }
};

export const stopVideoPlayback = (elementId?: string) => {
    if (elementId) {
        setStore('activeVideoElementIds', ids => ids.filter(id => id !== elementId));
    } else {
        setStore('activeVideoElementIds', []);
    }
};

export const toggleVideoPlayback = (elementId: string) => {
    if (store.activeVideoElementIds.includes(elementId)) {
        stopVideoPlayback(elementId);
    } else {
        startVideoPlayback(elementId);
    }
};

export const isVideoPlaying = (elementId: string): boolean => {
    return store.activeVideoElementIds.includes(elementId);
};

// --- Slide Management Actions ---

export const updateSlideThumbnail = (index: number, dataUrl: string) => {
    setStore("slides", index, "thumbnail", dataUrl);
};

export const saveActiveSlide = () => {
    const currentIndex = store.activeSlideIndex;
    if (currentIndex < 0 || currentIndex >= store.slides.length) return;

    const currentSlideValues: Partial<Slide> = {
        backgroundColor: store.canvasBackgroundColor,
        canvasTexture: store.canvasTexture,
        dimensions: JSON.parse(JSON.stringify(store.dimensions)),
        thumbnail: store.slides[store.activeSlideIndex].thumbnail,
    };

    setStore("slides", currentIndex, currentSlideValues);
};

/**
 * Hide reveal elements for closed openBox shapes.
 * Called when entering presentation mode or switching slides to ensure reveal elements start hidden.
 */
const hideOpenBoxRevealElements = () => {
    for (const el of store.elements) {
        if (el.type === 'openBox' && el.enableClickToOpen && el.revealElementId) {
            const isClosed = (el.openAmount ?? 0) <= 50;
            if (isClosed) {
                // Find and hide the reveal element
                const revealIndex = store.elements.findIndex(e => e.id === el.revealElementId);
                if (revealIndex !== -1) {
                    setStore('elements', revealIndex, 'opacity', 0);
                }
            }
        }
    }
};

/**
 * Reset openBox elements to closed state when exiting presentation mode.
 * Closes any open boxes and hides their reveal elements.
 */
const resetOpenBoxElements = () => {
    for (let i = 0; i < store.elements.length; i++) {
        const el = store.elements[i];
        if (el.type === 'openBox' && el.enableClickToOpen) {
            // Close the box if it's open
            if ((el.openAmount ?? 0) > 0) {
                setStore('elements', i, 'openAmount', 0);
            }
            // Hide the reveal element
            if (el.revealElementId) {
                const revealIndex = store.elements.findIndex(e => e.id === el.revealElementId);
                if (revealIndex !== -1) {
                    setStore('elements', revealIndex, 'opacity', 0);
                }
            }
        }
    }
};

export const setActiveSlide = async (index: number, skipAnimation?: boolean) => {
    if (index < 0 || index >= store.slides.length) return;
    if (index === store.activeSlideIndex && !slideTransitionManager.transitioning) {
        // Still re-center the viewport in case it drifted (e.g. after exiting presentation mode)
        zoomToFitSlide();
        return;
    }

    // Save current viewport state to the slide we are leaving (only in design mode)
    if (store.appMode === 'design' && store.activeSlideIndex !== -1) {
        setStore("slides", store.activeSlideIndex, {
            lastViewState: { ...store.viewState }
        });
    }

    // Clear selection immediately
    setStore("selection", []);

    // Determine if we should animate
    // In presentation mode with transitions enabled, use the transition manager
    const shouldAnimate = store.appMode === 'presentation' && !skipAnimation;

    if (shouldAnimate) {
        // Use transition manager for animated slide switch
        await slideTransitionManager.transitionTo(index);
    } else {
        // Immediate switch (edit mode or skipAnimation)
        await slideTransitionManager.transitionTo(index, { skipAnimation: true });
    }

    // Update background and dimensions from the new slide
    const nextSlide = store.slides[index];
    if (nextSlide) {
        if (nextSlide.backgroundColor) {
            setStore("canvasBackgroundColor", nextSlide.backgroundColor);
        }
        setStore("canvasTexture", nextSlide.canvasTexture ?? 'none');
        setStore("dimensions", JSON.parse(JSON.stringify(nextSlide.dimensions)));

        // Trigger Build Animations in Presentation Mode
        if (store.appMode === 'presentation') {
            hideOpenBoxRevealElements();
            stopVideoPlayback(); // Stop any playing video from previous slide
            slideBuildManager.init(index);
            slideBuildManager.playInitial();

            // Auto-play videos with videoAutoplay enabled
            const autoPlayVideo = store.elements.find(
                el => el.type === 'video' && el.videoAutoplay && el.videoURL
            );
            if (autoPlayVideo) {
                startVideoPlayback(autoPlayVideo.id);
            }
        }
    }

};

/**
 * Handle the "Next" action in the presentation (states -> builds -> slides)
 */
export const advancePresentation = async () => {
    // 1. Check for State Transitions
    const currentIndex = store.states.findIndex(s => s.id === store.activeStateId);
    if (currentIndex < store.states.length - 1) {
        applyNextState();
        return;
    }

    // 2. Check for Build Animations (On-Click)
    if (slideBuildManager.hasMoreSteps()) {
        await slideBuildManager.playNext();
        return;
    }

    // 3. Next Slide
    if (store.activeSlideIndex < store.slides.length - 1) {
        await setActiveSlide(store.activeSlideIndex + 1);
    }
};

/**
 * Handle the "Previous" action in the presentation
 */
export const retreatPresentation = async () => {
    // 1. Check for State Transitions (backwards)
    const currentIndex = store.states.findIndex(s => s.id === store.activeStateId);
    if (currentIndex > 0) {
        applyPreviousState();
        return;
    }

    // 2. Previous Slide
    if (store.activeSlideIndex > 0) {
        await setActiveSlide(store.activeSlideIndex - 1);
    }
};

export const addSlide = () => {
    pushToHistory();
    saveActiveSlide();

    const nextIndex = store.slides.length;
    // Position new slide to the right of the last one
    const lastSlide = store.slides[store.slides.length - 1];
    const newX = lastSlide ? lastSlide.spatialPosition.x + 2000 : 0;

    const newSlide = createDefaultSlide(undefined, `Slide ${nextIndex + 1}`, newX, 0);
    newSlide.order = nextIndex;

    setStore("slides", (prev) => [...prev, newSlide]);
    setActiveSlide(nextIndex);

    showToast('Slide added', 'success');
};

export const insertNewSlide = (targetIndex: number, position: 'before' | 'after') => {
    pushToHistory();
    saveActiveSlide();

    // 1. Determine new slide position (Spatially always at the end to avoid collision)
    const sortedByX = [...store.slides].sort((a, b) => a.spatialPosition.x - b.spatialPosition.x);
    const lastSlide = sortedByX[sortedByX.length - 1];
    const newX = lastSlide ? lastSlide.spatialPosition.x + 2000 : 0;

    const insertionIndex = position === 'before' ? targetIndex : targetIndex + 1;

    // 2. Create and Insert
    const newSlide = createDefaultSlide(undefined, `Slide ${store.slides.length + 1}`, newX, 0);

    const newSlides = store.slides.map(s => ({ ...s }));
    newSlides.splice(insertionIndex, 0, newSlide);

    // 3. Reorder
    newSlides.forEach((s, i) => s.order = i);

    let currentActiveIndex = store.activeSlideIndex;
    // If we inserted before or at the current active slide, the current slide moved down
    if (insertionIndex <= currentActiveIndex) {
        currentActiveIndex++;
    }

    batch(() => {
        setStore("slides", newSlides);
        // Update active index to point to where the *previous* active slide moved to
        // This ensures the transition starts from the correct physical location
        setStore("activeSlideIndex", currentActiveIndex);
    });

    // Now transition to the new slide
    setActiveSlide(insertionIndex);
    showToast('Slide inserted', 'success');
};

export const duplicateSlide = (index: number) => {
    if (index < 0 || index >= store.slides.length) return;

    pushToHistory();
    saveActiveSlide();

    const sourceSlide = store.slides[index];
    const { x: sX, y: sY } = sourceSlide.spatialPosition;
    const { width: sW, height: sH } = sourceSlide.dimensions;

    // 1. Identify source elements (center logic)
    const sourceElements = store.elements.filter(el => {
        const cx = el.x + (el.width || 0) / 2;
        const cy = el.y + (el.height || 0) / 2;
        return cx >= sX && cx <= sX + sW && cy >= sY && cy <= sY + sH;
    });

    // 2. Setup new slide position (to the right of all)
    const lastSlide = store.slides.reduce((prev, current) => {
        return (prev.spatialPosition.x > current.spatialPosition.x) ? prev : current;
    });
    const newX = lastSlide.spatialPosition.x + 2000;
    const offset = { x: newX - sX, y: 0 };

    // 3. Clone elements with ID mapping
    const idMap = new Map<string, string>();
    const batchIds = new Set<string>();
    sourceElements.forEach(el => idMap.set(el.id, generateId(el.type, batchIds)));

    const newElements = sourceElements.map(el => {
        const newId = idMap.get(el.id)!;
        // Deep copy
        const newEl: DrawingElement = JSON.parse(JSON.stringify(el));
        newEl.id = newId;
        newEl.x += offset.x;
        newEl.y += offset.y;
        newEl.seed = Math.floor(Math.random() * 2147483647);

        // Map internal bindings
        if (newEl.startBinding && idMap.has(newEl.startBinding.elementId)) {
            newEl.startBinding.elementId = idMap.get(newEl.startBinding.elementId)!;
        } else if (newEl.startBinding) {
            newEl.startBinding = undefined; // Drop external bindings
        }

        if (newEl.endBinding && idMap.has(newEl.endBinding.elementId)) {
            newEl.endBinding.elementId = idMap.get(newEl.endBinding.elementId)!;
        } else if (newEl.endBinding) {
            newEl.endBinding = undefined;
        }

        if (newEl.boundElements) {
            newEl.boundElements = newEl.boundElements
                .filter(b => idMap.has(b.id))
                .map(b => ({ ...b, id: idMap.get(b.id)! }));
        }

        if (newEl.parentId && idMap.has(newEl.parentId)) {
            newEl.parentId = idMap.get(newEl.parentId)!;
        } else if (newEl.parentId) {
            newEl.parentId = undefined;
        }

        return newEl;
    });

    // 4. Create new slide frame
    const newSlide: Slide = {
        ...JSON.parse(JSON.stringify(sourceSlide)),
        id: generateId('slide'),
        name: `${sourceSlide.name} (Copy)`,
        spatialPosition: { x: newX, y: 0 },
        order: index + 1,
        thumbnail: undefined,
        lastViewState: undefined  // Clear so viewport is recalculated for the new spatial position
    };

    // 5. Update store
    // 5. Update store
    // Clone slides to avoid mutating store proxies
    const newSlides = store.slides.map(s => ({ ...s }));
    newSlides.splice(index + 1, 0, newSlide);
    newSlides.forEach((s, i) => s.order = i);

    batch(() => {
        setStore("slides", newSlides);
        setStore("elements", els => [...els, ...newElements]);
        setActiveSlide(index + 1);
    });

    showToast('Slide duplicated', 'success');
};

export const deleteSlide = (index: number) => {
    if (store.slides.length <= 1) {
        showToast('Cannot delete the last slide', 'error');
        return;
    }

    pushToHistory();

    // Identify elements whose center lies inside the deleted slide's bounds
    const deletedSlide = store.slides[index];
    const { x: sX, y: sY } = deletedSlide.spatialPosition;
    const { width: sW, height: sH } = deletedSlide.dimensions;
    const orphanIds = new Set(
        store.elements
            .filter(el => {
                const cx = el.x + (el.width || 0) / 2;
                const cy = el.y + (el.height || 0) / 2;
                return cx >= sX && cx <= sX + sW && cy >= sY && cy <= sY + sH;
            })
            .map(el => el.id)
    );

    // Clone distinct from store
    const newSlides = store.slides
        .filter((_, i) => i !== index)
        .map(s => ({ ...s }));

    // Update orders
    newSlides.forEach((s, i) => s.order = i);

    let nextIndex = store.activeSlideIndex;
    if (nextIndex >= newSlides.length) {
        nextIndex = newSlides.length - 1;
    }

    // When deleting the active slide, the slide at nextIndex changes.
    // Force setActiveSlide to run by temporarily setting activeSlideIndex to -1.
    const deletingActive = index === store.activeSlideIndex;

    batch(() => {
        if (orphanIds.size > 0) {
            setStore("elements", els => els.filter(el => !orphanIds.has(el.id)));
        }
        setStore("slides", newSlides);
        if (deletingActive) {
            setStore("activeSlideIndex", -1);
        }
        setActiveSlide(nextIndex);
    });

    showToast('Slide deleted', 'info');
};

export const reorderSlides = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= store.slides.length) return;
    if (toIndex < 0 || toIndex >= store.slides.length) return;

    pushToHistory();
    saveActiveSlide();

    // Clone slides
    const newSlides = store.slides.map(s => ({ ...s }));
    const [moved] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, moved);

    // Update orders
    newSlides.forEach((s, i) => s.order = i);

    // Update active index if it moved
    let newActiveIndex = store.activeSlideIndex;
    if (store.activeSlideIndex === fromIndex) {
        newActiveIndex = toIndex;
    } else if (fromIndex < store.activeSlideIndex && toIndex >= store.activeSlideIndex) {
        newActiveIndex--;
    } else if (fromIndex > store.activeSlideIndex && toIndex <= store.activeSlideIndex) {
        newActiveIndex++;
    }

    batch(() => {
        setStore("slides", newSlides);
        setStore("activeSlideIndex", newActiveIndex);
    });
};

/**
 * Update the transition settings for a specific slide
 */
export const updateSlideTransition = (slideIndex: number, transition: Partial<SlideTransition>) => {
    if (slideIndex < 0 || slideIndex >= store.slides.length) return;

    const currentTransition = store.slides[slideIndex]?.transition || { ...DEFAULT_SLIDE_TRANSITION };

    setStore("slides", slideIndex, "transition", {
        ...currentTransition,
        ...transition
    });
    bumpDirtyRevision();
};

/**
 * Update the background properties for a specific slide
 */
export const updateSlideBackground = (slideIndex: number, updates: Partial<Slide> | string) => {
    if (slideIndex < 0 || slideIndex >= store.slides.length) return;

    if (typeof updates === 'string') {
        const isColorString = updates.startsWith('#') || updates.startsWith('rgb') || updates.startsWith('hsl') || updates.startsWith('color(') || updates.includes('display-p3');
        if (isColorString) {
            setStore("slides", slideIndex, {
                backgroundColor: updates,
                fillStyle: "solid"
            });
            if (slideIndex === store.activeSlideIndex) {
                setStore("canvasBackgroundColor", updates);
            }
        }
    } else {
        setStore("slides", slideIndex, updates);
        if (slideIndex === store.activeSlideIndex && updates.backgroundColor) {
            setStore("canvasBackgroundColor", updates.backgroundColor);
        }
    }
    bumpDirtyRevision();
};

export const loadDocument = (doc: any) => {
    batch(() => {
        // Version Migration Logic
        let elements: DrawingElement[] = [];
        let slides: Slide[] = [];
        let layers: Layer[] = [];
        let gridSettings = doc.gridSettings || initialState.gridSettings;
        let states = doc.states || [];

        if (doc.version === 4) {
            elements = doc.elements;
            slides = doc.slides;
            layers = doc.layers;
            states = doc.states || [];
            gridSettings = doc.gridSettings || gridSettings;
        } else if (doc.version === 3) {
            // Migrate v3 (multi-slides with separate element buckets) to v4 (spatial)
            layers = doc.slides[0]?.layers || initialState.layers;
            const horizontalGap = 2000;

            doc.slides.forEach((oldSlide: any, index: number) => {
                const spatialX = index * horizontalGap;
                const spatialY = 0;

                // Offset elements
                const offsetElements = oldSlide.elements.map((el: DrawingElement) => ({
                    ...el,
                    x: el.x + spatialX,
                    y: el.y + spatialY
                }));
                elements.push(...offsetElements);

                // Create new slide frame
                slides.push({
                    id: oldSlide.id,
                    name: oldSlide.name,
                    spatialPosition: { x: spatialX, y: spatialY },
                    dimensions: oldSlide.dimensions || { width: 1920, height: 1080 },
                    order: index,
                    backgroundColor: oldSlide.backgroundColor,
                    thumbnail: oldSlide.thumbnail
                });

                // Collect states
                if (oldSlide.states) {
                    states.push(...oldSlide.states);
                }
            });
        } else {
            // Legacy v1/v2 or unknown
            elements = doc.elements || [];
            layers = doc.layers || initialState.layers;
            slides = [createDefaultSlide()];
        }

        // Ensure all slides have transition data (migration for older documents)
        // and normalize order property to match array index
        slides.forEach((slide, i) => {
            if (!slide.transition) {
                slide.transition = { ...DEFAULT_SLIDE_TRANSITION };
            }
            slide.order = i;
        });

        setStore("elements", JSON.parse(JSON.stringify(elements)));
        setStore("slides", JSON.parse(JSON.stringify(slides)));
        setStore("layers", JSON.parse(JSON.stringify(layers)));
        setStore("states", JSON.parse(JSON.stringify(states)));
        setStore("gridSettings", JSON.parse(JSON.stringify(gridSettings)));

        // Migrate old showMindmapToolbar -> showQuickToolbar
        const gs = doc.globalSettings || initialState.globalSettings;
        if (gs.showMindmapToolbar !== undefined && gs.showQuickToolbar === undefined) {
            gs.showQuickToolbar = gs.showMindmapToolbar;
            delete gs.showMindmapToolbar;
        }
        setStore("globalSettings", gs);

        // Reset canvas background to default before theme applies
        setStore("canvasBackgroundColor", '#ffffff');

        // Apply theme from document if present, otherwise keep current theme
        // (setTheme adjusts canvasBackgroundColor for focus theme automatically)
        if (gs.theme) {
            setTheme(gs.theme);
        }

        // Determine docType with version-aware defaults:
        // - v4: use stored docType
        // - v3: default to 'slides' (v3 is inherently slide-based)
        // - v1/v2 legacy: default to 'infinite' (pre-slide format)
        const loadedDocType = doc.metadata?.docType || (doc.version >= 3 ? 'slides' : 'infinite');
        setStore("docType", loadedDocType);
        setStore("showSlideNavigator", loadedDocType === 'slides');
        setStore("showSlideToolbar", true);
        setStore("showUtilityToolbar", false);

        setStore("activeSlideIndex", 0);
        setStore("selection", []);

        // Apply first slide's explicit background if set (overrides theme default)
        const firstSlideBg = slides.length > 0 ? slides[0].backgroundColor : '';
        if (firstSlideBg) {
            setStore("canvasBackgroundColor", firstSlideBg);
        }
        // Apply first slide's canvas texture (or reset to 'none' if unset)
        setStore("canvasTexture", slides[0]?.canvasTexture ?? 'none');

        if (!layers.some((l: Layer) => l.id === store.activeLayerId)) {
            setStore("activeLayerId", layers[0]?.id || 'default-layer');
        }

        // Initial view focus
        setTimeout(() => {
            const firstSlide = store.slides[0];
            if (store.appMode === 'design' && firstSlide?.lastViewState) {
                setViewState(firstSlide.lastViewState);
            } else {
                zoomToFitSlide();
            }
        }, 100);
    });

    // Clear history on new document load
    clearHistory();
};

// --- Document Type Actions ---

export const setDocType = (type: 'infinite' | 'slides') => {
    batch(() => {
        setStore("docType", type);
        setStore("showSlideNavigator", type === 'slides');
    });
};

// --- State Morphing Actions ---

export const toggleStatePanel = (visible?: boolean) => {
    setStore("showStatePanel", visible ?? !store.showStatePanel);
};

export const addDisplayState = (name: string) => {
    const id = generateId('state');
    const overrides: Record<string, Partial<any>> = {};

    // Capture current values for all elements
    store.elements.forEach(el => {
        overrides[el.id] = {
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            opacity: el.opacity,
            angle: el.angle,
            backgroundColor: el.backgroundColor,
            strokeColor: el.strokeColor,
            text: el.text
        };
    });

    const newState: DisplayState = { id, name, overrides: overrides as any };
    setStore("states", (prev) => [...prev, newState]);
    setStore("activeStateId", id);
    bumpDirtyRevision();
    showToast(`State "${name}" captured`, 'success');
};

export const updateDisplayState = (id: string) => {
    const stateIndex = store.states.findIndex(s => s.id === id);
    if (stateIndex === -1) return;

    const overrides: Record<string, Partial<any>> = {};
    store.elements.forEach(el => {
        overrides[el.id] = {
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            opacity: el.opacity,
            angle: el.angle,
            backgroundColor: el.backgroundColor,
            strokeColor: el.strokeColor,
            text: el.text
        };
    });

    setStore("states", stateIndex, "overrides", overrides as any);
    bumpDirtyRevision();
    showToast(`State updated`, 'success');
};

export const deleteDisplayState = (id: string) => {
    setStore("states", (prev) => prev.filter(s => s.id !== id));
    if (store.activeStateId === id) {
        setStore("activeStateId", undefined);
    }
    bumpDirtyRevision();
    showToast(`State deleted`, 'info');
};

export const applyDisplayState = async (id: string, animate: boolean = true) => {
    const targetState = store.states.find(s => s.id === id);
    if (!targetState) return;

    setStore("activeStateId", id);

    if (animate) {
        const { MorphAnimator } = await import("../utils/animation/morph-animator");
        MorphAnimator.morphTo(targetState);
    } else {
        // Immediate apply
        batch(() => {
            Object.entries(targetState.overrides).forEach(([elId, targetProps]) => {
                updateElement(elId, targetProps, false);
            });
        });
    }
};

export const applyNextState = async () => {
    if (store.states.length === 0) return;
    const currentIndex = store.states.findIndex(s => s.id === store.activeStateId);
    const nextIndex = (currentIndex + 1) % store.states.length;
    await applyDisplayState(store.states[nextIndex].id);
};

export const applyPreviousState = async () => {
    if (store.states.length === 0) return;
    const currentIndex = store.states.findIndex(s => s.id === store.activeStateId);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = store.states.length - 1;
    await applyDisplayState(store.states[prevIndex].id);
};

// Helper to clear history (e.g. on new file)
export const clearHistory = () => {
    undoStack.length = 0;
    redoStack.length = 0;
    setStore("undoStackLength", 0);
    setStore("redoStackLength", 0);
};

export const resetToNewDocument = (docType: 'infinite' | 'slides' = 'slides') => {
    const doc = createSlideDocument('Untitled', docType);
    loadDocument(doc);
    // Clear auto-save data (inline to avoid circular import)
    try { localStorage.removeItem('yappy:autosave'); localStorage.removeItem('yappy:autosave:meta'); } catch {}
    setStore("isDirty", false);
    setStore("welcomeDismissed", true);
    setStore("showSlideToolbar", true);
    setStore("showUtilityToolbar", false);
    // Default to 100% zoom for new documents, centered on the first slide
    setTimeout(() => {
        const firstSlide = store.slides[0];
        if (firstSlide) {
            const { x: sx, y: sy } = firstSlide.spatialPosition;
            const { width: sW, height: sH } = firstSlide.dimensions;
            setStore('viewState', {
                scale: 1,
                panX: (window.innerWidth - sW) / 2 - sx,
                panY: (window.innerHeight - sH) / 2 - sy
            });
        } else {
            setStore('viewState', { scale: 1, panX: 0, panY: 0 });
        }
    }, 120);
    showToast(`New ${docType === 'slides' ? 'presentation' : 'sketch'} created`, 'info');
};

export const duplicateElement = (id: string) => {
    const el = store.elements.find(e => e.id === id);
    if (!el) return;

    pushToHistory();
    const newId = generateId(el.type);
    const offset = 20 / store.viewState.scale;

    // Deep copy objects
    const newElement: DrawingElement = {
        ...el,
        id: newId,
        x: el.x + offset,
        y: el.y + offset,
        points: el.points ? ((el.points.length > 0 && typeof el.points[0] === 'number') ? [...(el.points as number[])] : (el.points as any[]).map(p => ({ ...p }))) : undefined,
        roundness: el.roundness ? { ...el.roundness } : null,
        crop: el.crop ? { ...el.crop } : null,
        // bounds/meta might need attention too but boundElements usually reset or logic specific
        boundElements: null, // Don't copy bindings directly for now
        groupIds: el.groupIds ? [...el.groupIds] : undefined,
        seed: Math.floor(Math.random() * 2147483647)
    };

    setStore("elements", els => [...els, newElement]);
    setStore("selection", [newId]); // Select new
};

export const groupSelected = () => {
    if (store.selection.length < 2) return;

    pushToHistory();
    const groupId = generateId('group');

    setStore("elements",
        (el) => store.selection.includes(el.id),
        "groupIds",
        (ids) => {
            const currentIds = ids || [];
            return [...currentIds, groupId];
        }
    );
};

export const ungroupSelected = () => {
    if (store.selection.length === 0) return;

    // 1. Identify outermost group IDs from selection
    const outerGroupIds = new Set<string>();
    store.elements.forEach(el => {
        if (store.selection.includes(el.id) && el.groupIds && el.groupIds.length > 0) {
            outerGroupIds.add(el.groupIds[el.groupIds.length - 1]);
        }
    });

    if (outerGroupIds.size === 0) return;

    pushToHistory();

    // 2. Remove these IDs from ALL elements that have them as outermost
    setStore("elements",
        (el) => {
            if (!el.groupIds || el.groupIds.length === 0) return false;
            const lastId = el.groupIds[el.groupIds.length - 1];
            return outerGroupIds.has(lastId);
        },
        "groupIds",
        (ids) => {
            if (!ids) return ids;
            return ids.slice(0, -1);
        }
    );
};

/**
 * Make Clipping Mask (Illustrator Ctrl+7) — the TOP selected object becomes a clip shape
 * that masks the other selected objects to its outline. The mask is hidden (isClipMask) and
 * the clipped objects reference it via clipMaskId; all are grouped so they move together.
 */
export const makeClippingMask = () => {
    const sel = [...store.selection];
    if (sel.length < 2) { showToast('Clipping mask: select 2+ objects', 'info'); return; }
    const idxOf = (id: string) => store.elements.findIndex(e => e.id === id);
    let maskId = sel[0];
    for (const id of sel) if (idxOf(id) > idxOf(maskId)) maskId = id; // topmost in z-order
    const clippedIds = sel.filter(id => id !== maskId);
    if (clippedIds.length === 0) return;
    pushToHistory();
    const groupId = generateId('clip');
    setStore('elements', (e: DrawingElement) => sel.includes(e.id), 'groupIds', (ids: string[] | undefined) => [...(ids || []), groupId]);
    setStore('elements', (e: DrawingElement) => e.id === maskId, 'isClipMask', () => true);
    setStore('elements', (e: DrawingElement) => clippedIds.includes(e.id), 'clipMaskId', () => maskId);
    setStore('selection', clippedIds);
    bumpDirtyRevision();
    showToast('Clipping mask created', 'success');
};

/** Release Clipping Mask — un-hide the mask shape and drop the clip from its targets. */
export const releaseClippingMask = () => {
    const sel = [...store.selection];
    const masks = new Set<string>();
    store.elements.forEach(e => {
        if (!sel.includes(e.id)) return;
        if (e.clipMaskId) masks.add(e.clipMaskId);
        if (e.isClipMask) masks.add(e.id);
    });
    if (masks.size === 0) { showToast('Release: select a clipped object', 'info'); return; }
    pushToHistory();
    const members = new Set<string>(masks);
    store.elements.forEach(e => { if (e.clipMaskId && masks.has(e.clipMaskId)) members.add(e.id); });
    // Drop the shared clip group (outermost groupId) so they ungroup again.
    setStore('elements', (e: DrawingElement) => members.has(e.id), 'groupIds', (ids: string[] | undefined) => (ids && ids.length ? ids.slice(0, -1) : ids));
    setStore('elements', (e: DrawingElement) => masks.has(e.id), 'isClipMask', () => undefined);
    setStore('elements', (e: DrawingElement) => !!e.clipMaskId && masks.has(e.clipMaskId), 'clipMaskId', () => undefined);
    setStore('selection', [...members]);
    bumpDirtyRevision();
    showToast('Clipping mask released', 'success');
};

export const moveElementZIndex = (id: string, direction: 'front' | 'back' | 'forward' | 'backward') => {
    const idx = store.elements.findIndex(e => e.id === id);
    if (idx === -1) return;

    pushToHistory();

    setStore("elements", els => {
        const newEls = [...els];
        const el = newEls.splice(idx, 1)[0];

        if (direction === 'front') {
            newEls.push(el);
        } else if (direction === 'back') {
            newEls.unshift(el);
        } else if (direction === 'forward') {
            const newIdx = Math.min(newEls.length, idx + 1);
            newEls.splice(newIdx, 0, el);
        } else if (direction === 'backward') {
            const newIdx = Math.max(0, idx - 1);
            newEls.splice(newIdx, 0, el);
        }

        return newEls;
    });
};

export const setTheme = (theme: Theme) => {
    setStore('theme', theme);
    setStore('globalSettings', 'theme', theme);
    localStorage.setItem('theme', theme);

    // Resolve `system` to either light or dark via prefers-color-scheme.
    const resolved = resolveTheme(theme);
    setStore('resolvedTheme', resolved);

    // CSS variables are driven by the *resolved* theme so panels theme correctly
    // when the user picks `system` and the OS is dark.
    document.documentElement.setAttribute('data-theme', resolved);
};

export const toggleTheme = () => {
    const order: Theme[] = ['light', 'dark', 'focus', 'system'];
    const idx = order.indexOf(store.theme);
    const next = order[(idx + 1) % order.length];
    setTheme(next);
};

export const zoomToFit = () => {
    if (store.elements.length === 0) {
        setStore("viewState", { scale: 1, panX: 0, panY: 0 });
        return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    store.elements.forEach(el => {
        minX = Math.min(minX, el.x);
        maxX = Math.max(maxX, el.x + el.width);
        minY = Math.min(minY, el.y);
        maxY = Math.max(maxY, el.y + el.height);
    });

    const contentW = maxX - minX;
    const contentH = maxY - minY;

    // Safety check for single point
    if (contentW === 0 && contentH === 0) {
        // Just center on the point
        const cx = minX;
        const cy = minY;
        const screenCX = window.innerWidth / 2;
        const screenCY = window.innerHeight / 2;
        setStore("viewState", {
            scale: 1,
            panX: -cx + screenCX,
            panY: -cy + screenCY
        });
        return;
    }

    const margin = 50;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    // Calculate scale to fit
    const scaleX = (screenW - margin * 2) / contentW;
    const scaleY = (screenH - margin * 2) / contentH;
    let newScale = Math.min(scaleX, scaleY);

    // Clamp scale
    newScale = Math.min(Math.max(newScale, 0.1), 2);

    const contentCX = minX + contentW / 2;
    const contentCY = minY + contentH / 2;

    const screenCX = screenW / 2;
    const screenCY = screenH / 2;

    setStore("viewState", {
        scale: newScale,
        panX: -contentCX * newScale + screenCX,
        panY: -contentCY * newScale + screenCY
    });
};

export const zoomToSelection = () => {
    if (store.selection.length === 0) return;

    const selected = store.elements.filter(el => store.selection.includes(el.id));
    if (selected.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selected.forEach(el => {
        minX = Math.min(minX, el.x);
        maxX = Math.max(maxX, el.x + el.width);
        minY = Math.min(minY, el.y);
        maxY = Math.max(maxY, el.y + el.height);
    });

    const contentW = maxX - minX;
    const contentH = maxY - minY;

    if (contentW === 0 && contentH === 0) {
        const screenCX = window.innerWidth / 2;
        const screenCY = window.innerHeight / 2;
        setStore("viewState", { scale: 1, panX: -minX + screenCX, panY: -minY + screenCY });
        return;
    }

    const margin = 80;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const scaleX = (screenW - margin * 2) / contentW;
    const scaleY = (screenH - margin * 2) / contentH;
    let newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.1), 5);

    const contentCX = minX + contentW / 2;
    const contentCY = minY + contentH / 2;

    setStore("viewState", {
        scale: newScale,
        panX: -contentCX * newScale + screenW / 2,
        panY: -contentCY * newScale + screenH / 2
    });
};

// Layer Management Functions
export const addLayer = (name?: string, parentId?: string) => {
    if (store.layers.length >= store.maxLayers) {
        console.warn(`Layer limit reached (${store.maxLayers} layers max)`);
        return;
    }
    pushToHistory();
    const newId = generateId('layer');
    const maxOrder = Math.max(...store.layers.map(l => l.order), -1);
    const newLayer: Layer = {
        id: newId,
        name: name || `Layer ${store.layers.length + 1}`,
        visible: true,
        locked: false,
        opacity: 1,
        order: maxOrder + 1,
        backgroundColor: 'transparent',
        colorTag: undefined,
        parentId,
        isGroup: false,
        expanded: true
    };
    setStore('layers', [...store.layers, newLayer]);
    setStore('activeLayerId', newId);
    return newId;
};

export const deleteLayer = (id: string) => {
    // Cannot delete the last layer
    if (store.layers.length <= 1) {
        showToast('Cannot delete the last layer.', 'error');
        return;
    }

    const layer = store.layers.find(l => l.id === id);
    if (!layer) return;

    // Check if layer has elements
    const elementsOnLayer = store.elements.filter(el => el.layerId === id);

    if (elementsOnLayer.length > 0) {
        // Ask user what to do with elements
        const shouldDelete = confirm(
            `Layer "${layer.name}" contains ${elementsOnLayer.length} element(s).\n\n` +
            `Click "OK" to delete the layer AND all its elements.\n` +
            `Click "Cancel" to delete the layer but move elements to another layer.`
        );

        pushToHistory();

        if (shouldDelete) {
            // Delete all elements on this layer
            setStore('elements', store.elements.filter(el => el.layerId !== id));
        } else {
            // Move all elements from this layer to the first remaining layer
            const remainingLayer = store.layers.find(l => l.id !== id);
            if (remainingLayer) {
                store.elements.forEach((el, idx) => {
                    if (el.layerId === id) {
                        setStore('elements', idx, 'layerId', remainingLayer.id);
                    }
                });
            }
        }
    } else {
        // No elements, just delete
        pushToHistory();
    }

    // Remove the layer
    setStore('layers', store.layers.filter(l => l.id !== id));

    // Update active layer if needed
    if (store.activeLayerId === id) {
        setStore('activeLayerId', store.layers[0]?.id || 'default-layer');
    }
};

export const updateLayer = (id: string, updates: Partial<Layer>) => {
    const idx = store.layers.findIndex(l => l.id === id);
    if (idx === -1) return;

    // Don't record history for simple UI toggles
    setStore('layers', idx, updates);
};

export const duplicateLayer = (id: string) => {
    if (store.layers.length >= store.maxLayers) {
        console.warn(`Layer limit reached (${store.maxLayers} layers max)`);
        return;
    }
    const original = store.layers.find(l => l.id === id);
    if (!original) return;

    pushToHistory();

    // Create new layer with incremented name
    const newLayerId = generateId('layer');
    const newLayer: Layer = {
        ...original,
        id: newLayerId,
        name: `${original.name} Copy`,
        opacity: original.opacity ?? 1,
        order: original.order + 0.5, // Place right above original
        backgroundColor: original.backgroundColor || 'transparent',
        parentId: original.parentId,
        isGroup: original.isGroup,
        expanded: original.expanded
    };

    // Duplicate all elements on this layer with binding remapping
    const elementsOnLayer = store.elements.filter(el => el.layerId === id);
    const layerBatchIds = new Set<string>();
    const idMap = new Map<string, string>();
    elementsOnLayer.forEach(el => idMap.set(el.id, generateId(el.type, layerBatchIds)));

    const duplicatedElements = elementsOnLayer.map(el => {
        const newEl: DrawingElement = JSON.parse(JSON.stringify(el));
        newEl.id = idMap.get(el.id)!;
        newEl.layerId = newLayerId;
        newEl.x += 10;
        newEl.y += 10;

        // Remap internal bindings (same pattern as duplicateSlide)
        if (newEl.startBinding && idMap.has(newEl.startBinding.elementId)) {
            newEl.startBinding.elementId = idMap.get(newEl.startBinding.elementId)!;
        } else if (newEl.startBinding) {
            newEl.startBinding = undefined;
        }

        if (newEl.endBinding && idMap.has(newEl.endBinding.elementId)) {
            newEl.endBinding.elementId = idMap.get(newEl.endBinding.elementId)!;
        } else if (newEl.endBinding) {
            newEl.endBinding = undefined;
        }

        if (newEl.boundElements) {
            newEl.boundElements = newEl.boundElements
                .filter(b => idMap.has(b.id))
                .map(b => ({ ...b, id: idMap.get(b.id)! }));
        }

        if (newEl.parentId && idMap.has(newEl.parentId)) {
            newEl.parentId = idMap.get(newEl.parentId)!;
        } else if (newEl.parentId) {
            newEl.parentId = undefined;
        }

        return newEl;
    });

    // Add new layer and elements
    setStore('layers', [...store.layers, newLayer]);
    setStore('elements', [...store.elements, ...duplicatedElements]);

    // Recalculate layer orders
    const sortedLayers = [...store.layers].sort((a, b) => a.order - b.order);
    sortedLayers.forEach((l, idx) => {
        const layerIdx = store.layers.findIndex(layer => layer.id === l.id);
        setStore('layers', layerIdx, 'order', idx);
    });

    // Set the duplicated layer as active
    setStore('activeLayerId', newLayerId);
};

export const reorderLayers = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    pushToHistory();

    const newLayers = [...store.layers];
    const [movedLayer] = newLayers.splice(fromIndex, 1);
    newLayers.splice(toIndex, 0, movedLayer);

    // Update order values
    newLayers.forEach((layer, idx) => {
        layer.order = idx;
    });

    setStore('layers', newLayers);
};

export const setActiveLayer = (id: string) => {
    const layer = store.layers.find(l => l.id === id);
    if (layer) {
        setStore('activeLayerId', id);
    }
};

export const switchLayerByIndex = (index: number) => {
    const sortedLayers = [...store.layers].sort((a, b) => a.order - b.order).reverse(); // Match UI order (top to bottom)
    const target = sortedLayers[index];
    if (target) {
        setActiveLayer(target.id);
    }
};

export const mergeLayerDown = (id: string) => {
    const idx = store.layers.findIndex(l => l.id === id);
    if (idx <= 0) return; // Top layer in array is bottom visually if reversed, but store order 0 is bottom.

    // In our UI, reversedLayers() shows layers.
    // store.layers index 0 is bottom.
    // mergeLayerDown(id) moves elements from store.layers[idx] to store.layers[idx-1]

    const sourceLayer = store.layers[idx];
    const targetLayer = store.layers[idx - 1];

    pushToHistory();

    // Move elements
    setStore('elements',
        (el) => el.layerId === sourceLayer.id,
        'layerId',
        targetLayer.id
    );

    // Remove source layer
    setStore('layers', (ls) => ls.filter(l => l.id !== sourceLayer.id));

    // Update active layer if needed
    if (store.activeLayerId === sourceLayer.id) {
        setStore('activeLayerId', targetLayer.id);
    }
};

export const flattenLayers = () => {
    if (store.layers.length <= 1) return;

    pushToHistory();

    const bottomLayer = store.layers[0];

    // Move all elements from all other layers to bottom layer
    setStore('elements',
        (el) => el.layerId !== bottomLayer.id,
        'layerId',
        bottomLayer.id
    );

    // Remove all layers except bottom
    setStore('layers', [bottomLayer]);
    setStore('activeLayerId', bottomLayer.id);
};


export const isLayerVisible = (layerId: string): boolean => {
    const layer = store.layers.find(l => l.id === layerId);
    if (!layer) return false;
    if (layer.visible === false) return false;
    if (store.layerGroupingModeEnabled && layer.parentId) {
        return isLayerVisible(layer.parentId);
    }
    return true;
};

export const isLayerLocked = (layerId: string): boolean => {
    const layer = store.layers.find(l => l.id === layerId);
    if (!layer) return false;
    if (layer.locked) return true;
    if (store.layerGroupingModeEnabled && layer.parentId) {
        return isLayerLocked(layer.parentId);
    }
    return layer.locked || false;
};

export const isolateLayer = (id: string) => {
    // Hide all other layers
    store.layers.forEach((l, idx) => {
        if (l.id !== id) {
            setStore('layers', idx, 'visible', false);
        } else {
            setStore('layers', idx, 'visible', true);
        }
    });
};

export const showAllLayers = () => {
    store.layers.forEach((_, idx) => {
        setStore('layers', idx, 'visible', true);
    });
};

export const moveElementsToLayer = (elementIds: string[], targetLayerId: string) => {
    const targetLayer = store.layers.find(l => l.id === targetLayerId);
    if (!targetLayer) return;

    pushToHistory();
    elementIds.forEach(elId => {
        const idx = store.elements.findIndex(e => e.id === elId);
        if (idx !== -1) {
            setStore('elements', idx, 'layerId', targetLayerId);
        }
    });
};

//Grid Control Functions
export const toggleGrid = () => {
    setStore('gridSettings', 'enabled', !store.gridSettings.enabled);
};

export const toggleSnapToGrid = () => {
    setStore('gridSettings', 'snapToGrid', !store.gridSettings.snapToGrid);
};

export const updateGridSettings = (updates: Partial<GridSettings>) => {
    setStore('gridSettings', updates as any);
};

export const setCanvasBackgroundColor = (color: string) => {
    setStore('canvasBackgroundColor', color);
    // In infinite mode, sync to the active slide so the renderer picks it up.
    // In slides mode, each slide manages its own backgroundColor independently.
    if (store.docType === 'infinite') {
        const idx = store.activeSlideIndex;
        if (idx >= 0 && idx < store.slides.length) {
            setStore('slides', idx, 'backgroundColor', color);
        }
    }
};

export const setCanvasTexture = (texture: 'none' | 'dots' | 'grid' | 'graph' | 'paper' | 'notebook') => {
    setStore('canvasTexture', texture);
    // Persist per-slide so each canvas keeps its own texture on reload / slide switch.
    const idx = store.activeSlideIndex;
    if (idx >= 0 && idx < store.slides.length) {
        setStore('slides', idx, 'canvasTexture', texture);
        bumpDirtyRevision();
    }
};

export const setSelectedPenType = (penType: 'fineliner' | 'inkbrush' | 'marker') => {
    setStore('selectedPenType', penType);
};

export const setSelectedConnectorType = (connectorType: 'arrow' | 'line' | 'bezier' | 'elbow' | 'polyline') => {
    setStore('selectedConnectorType', connectorType);
};

export const setSelectedShapeType = (shapeType: AppState['selectedShapeType']) => {
    setStore('selectedShapeType', shapeType);
};

export const setSelectedInfraType = (infraType: 'server' | 'loadBalancer' | 'firewall' | 'user' | 'messageQueue' | 'lambda' | 'router' | 'browser') => {
    setStore('selectedInfraType', infraType);
};

export const setSelectedSketchnoteType = (sketchnoteType: AppState['selectedSketchnoteType']) => {
    setStore('selectedSketchnoteType', sketchnoteType);
};

export const setSelectedStatusType = (statusType: 'numberedBadge' | 'questionMark' | 'exclamationMark' | 'tag') => {
    setStore('selectedStatusType', statusType);
};

export const setSelectedCloudInfraType = (cloudInfraType: 'kubernetes' | 'container' | 'apiGateway' | 'cdn' | 'storageBlob' | 'eventBus' | 'microservice' | 'shield') => {
    setStore('selectedCloudInfraType', cloudInfraType);
};

export const setSelectedDataMetricsType = (dataMetricsType: 'barChart' | 'pieChart' | 'trendUp' | 'trendDown' | 'funnel' | 'gauge' | 'table') => {
    setStore('selectedDataMetricsType', dataMetricsType);
};

export const setSelectedConnectionRelType = (connectionRelType: 'puzzlePiece' | 'chainLink' | 'bridge' | 'magnet' | 'scale' | 'seedling' | 'tree' | 'mountain') => {
    setStore('selectedConnectionRelType', connectionRelType);
};

export const setSelectedWireframeType = (wireframeType: ElementType) => {
    setStore('selectedWireframeType', wireframeType);
};

export const setGridStyle = (style: 'lines' | 'dots') => {
    setStore('gridSettings', 'style', style);
};

export const setMaxLayers = (layers: number) => setStore('maxLayers', layers);

export const setEraserWidth = (width: number) => {
    setStore('eraserWidth', width);
    try { localStorage.setItem('eraserWidth', String(width)); } catch { /* ignore storage errors */ }
};
export const setIsPreviewing = (value: boolean) => setStore('isPreviewing', value);

// Panel Management
export const togglePropertyPanel = (visible?: boolean) => {
    // If currently minimized and we are toggling on (or toggling), expand it
    if (store.isPropertyPanelMinimized && (visible === undefined || visible === true)) {
        setStore("isPropertyPanelMinimized", false);
        setStore("showPropertyPanel", true);
    } else {
        setStore("showPropertyPanel", visible ?? !store.showPropertyPanel);
    }
};

export const toggleLayerPanel = (visible?: boolean) => {
    setStore('showLayerPanel', (v) => visible ?? !v);
};

export const toggleSlideToolbar = (visible?: boolean) => {
    setStore('showSlideToolbar', (v) => visible ?? !v);
};

export const setSlideToolbarPosition = (x: number, y: number) => {
    setStore('slideToolbarPosition', { x, y });
};

export const setIsExportOpen = (open: boolean) => {
    setStore('showExportDialog', open);
};

export const toggleUtilityToolbar = (visible?: boolean) => {
    setStore('showUtilityToolbar', (v) => visible ?? !v);
};

export const toggleCanvasToolbar = (visible?: boolean) => {
    setStore('showCanvasToolbar', (v) => visible ?? !v);
};

export const minimizePropertyPanel = (minimized?: boolean) => {
    setStore('isPropertyPanelMinimized', (v) => minimized ?? !v);
};

export const minimizeLayerPanel = (minimized?: boolean) => {
    setStore('isLayerPanelMinimized', (v) => minimized ?? !v);
};

export const toggleLayerGroupingMode = () => {
    setStore('layerGroupingModeEnabled', prev => !prev);
};

export const createLayerGroup = (name?: string) => {
    pushToHistory();
    const newId = generateId('layer');
    const maxOrder = Math.max(...store.layers.map(l => l.order), -1);
    const newGroup: Layer = {
        id: newId,
        name: name || `Group ${store.layers.filter(l => l.isGroup).length + 1}`,
        visible: true,
        locked: false,
        opacity: 1,
        order: maxOrder + 1,
        backgroundColor: 'transparent',
        isGroup: true,
        expanded: true
    };
    setStore('layers', [...store.layers, newGroup]);
    setStore('activeLayerId', newId);
    return newId;
};

export const toggleLayerGroupExpansion = (groupId: string) => {
    setStore('layers', l => l.id === groupId, 'expanded', prev => !prev);
};

export const toggleMinimap = (visible?: boolean) => {
    setStore('minimapVisible', (v) => visible ?? !v);
};

// ── Rulers & guides ──────────────────────────────────────────────────────────
export const toggleRulers = (visible?: boolean) => {
    const next = visible ?? !store.showRulers;
    setStore('showRulers', next);
    try { localStorage.setItem('showRulers', next ? '1' : '0'); } catch { /* ignore */ }
};

export const addGuide = (axis: 'h' | 'v', pos: number): string => {
    const id = generateId('guide');
    setStore('guides', g => [...g, { id, axis, pos: Math.round(pos) }]);
    return id;
};

export const updateGuide = (id: string, pos: number) => {
    setStore('guides', g => g.map(gd => gd.id === id ? { ...gd, pos: Math.round(pos) } : gd));
};

export const removeGuide = (id: string) => {
    setStore('guides', g => g.filter(gd => gd.id !== id));
};

export const clearGuides = () => setStore('guides', []);

export const toggleZenMode = (visible?: boolean) => {
    setStore('zenMode', (v) => visible ?? !v);
};

export const toggleSlideNavigator = (force?: boolean) => {
    setStore("showSlideNavigator", (prev) => force ?? !prev);
};

export const toggleMainToolbar = (force?: boolean) => {
    setStore("showMainToolbar", (prev) => force ?? !prev);
};

export const zoomToFitSlide = () => {
    const slide = store.slides[store.activeSlideIndex];
    if (!slide) return;

    const { width: sW, height: sH } = slide.dimensions;
    const { x: spatialX, y: spatialY } = slide.spatialPosition;
    const margin = 40; // Pixels

    const availableW = window.innerWidth - margin * 2;
    const availableH = window.innerHeight - margin * 2;

    const scaleW = availableW / sW;
    const scaleH = availableH / sH;
    const newScale = Math.min(scaleW, scaleH);

    // Calculate pan to center the spatial slide region
    const panX = (window.innerWidth - sW * newScale) / 2 - spatialX * newScale;
    const panY = (window.innerHeight - sH * newScale) / 2 - spatialY * newScale;

    setStore('viewState', {
        scale: newScale,
        panX,
        panY
    });
};

// Snapshot of DS element text for auto-reset on presentation exit
const dsTextSnapshots = new Map<string, string>();
const DS_TYPES_SNAP = ['dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable'];

// Snapshot of animated element properties for restore on presentation exit
// Captures full element state before animations run, so we can restore cleanly
const animatedElementSnapshots = new Map<string, Record<string, any>>();
const ANIMATED_PROPS = [
    'x', 'y', 'width', 'height', 'opacity', 'angle',
    'strokeColor', 'backgroundColor', 'strokeWidth', 'roughness',
    'depth', 'viewAngle', 'openAmount', 'taper', 'skewX', 'skewY',
    'frontTaper', 'frontSkewX', 'frontSkewY', 'shapeRatio', 'sideRatio',
    'drawProgress', 'renderScale',
    // Text properties — text animations temporarily clear/modify these during playback.
    // Without snapshotting, exiting presentation mid-animation leaves partial/empty text.
    'text', 'containerText', 'richText', 'richContainerText'
];

export const togglePresentationMode = async (visible?: boolean, fromSlide?: number) => {
    const isPresentation = store.appMode === 'presentation';
    const newState = visible ?? !isPresentation;

    if (newState) {
        // Navigate to requested slide before entering presentation
        if (fromSlide !== undefined && fromSlide >= 0 && fromSlide < store.slides.length && fromSlide !== store.activeSlideIndex) {
            await setActiveSlide(fromSlide, true);
        }
    }

    batch(() => {
        setStore('appMode', newState ? 'presentation' : 'design');

        if (newState) {
            setStore('selection', []); // Clear selection

            // Snapshot DS element text for auto-reset on exit
            dsTextSnapshots.clear();
            for (const el of store.elements) {
                if (DS_TYPES_SNAP.includes(el.type)) {
                    dsTextSnapshots.set(el.id, el.text || '');
                }
            }

            // Snapshot animated element properties for restore on exit
            animatedElementSnapshots.clear();
            for (const el of store.elements) {
                if ((el.animations && el.animations.length > 0) || el.spinEnabled || el.orbitEnabled) {
                    const snap: Record<string, any> = {};
                    for (const prop of ANIMATED_PROPS) {
                        if ((el as any)[prop] !== undefined) {
                            snap[prop] = (el as any)[prop];
                        }
                    }
                    animatedElementSnapshots.set(el.id, snap);
                }
            }

            // Hide reveal elements for closed openBox shapes
            hideOpenBoxRevealElements();

            // Auto fit on enter - we delay this slightly to allow the appMode transition
            // and fullscreen state to begin initiating. The resize/fullscreen listeners
            // will catch the final dimensions.
            setTimeout(() => {
                if (store.docType === 'slides') {
                    zoomToFitSlide();
                } else {
                    // Infinite canvas: reset to 100% zoom, centered on content
                    if (store.elements.length === 0) {
                        setStore('viewState', { scale: 1, panX: 0, panY: 0 });
                    } else {
                        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                        store.elements.forEach(el => {
                            minX = Math.min(minX, el.x);
                            maxX = Math.max(maxX, el.x + el.width);
                            minY = Math.min(minY, el.y);
                            maxY = Math.max(maxY, el.y + el.height);
                        });
                        const cx = (minX + maxX) / 2;
                        const cy = (minY + maxY) / 2;
                        setStore('viewState', {
                            scale: 1,
                            panX: window.innerWidth / 2 - cx,
                            panY: window.innerHeight / 2 - cy,
                        });
                    }
                }
            }, 100);

            // Initialize animations
            slideBuildManager.init(store.activeSlideIndex);
            slideBuildManager.playInitial();
        } else {
            // Exiting presentation mode - stop all animations and restore state
            // Use reset() instead of restoreAll() to stop running animations first
            slideBuildManager.reset();
            resetOpenBoxElements();
            abortDsAlgorithm();
            setStore('activeDsOpsElementId', null);

            // Restore animated element properties to pre-presentation state
            for (const [id, snap] of animatedElementSnapshots) {
                updateElement(id, snap as any, false);
            }
            animatedElementSnapshots.clear();

            // Restore DS element text unless dsPersistChanges is enabled
            for (const [id, originalText] of dsTextSnapshots) {
                const el = store.elements.find(e => e.id === id);
                if (el && !el.dsPersistChanges) {
                    updateElement(id, { text: originalText } as any, false);
                }
            }
            dsTextSnapshots.clear();
        }
    });

    // Handle Fullscreen API
    if (newState) {
        document.documentElement.requestFullscreen?.().catch(e => {
            console.warn("Fullscreen failed:", e);
        });
    } else if (document.fullscreenElement) {
        document.exitFullscreen?.();
    }
};

export const setSelectedTechnicalType = (type: AppState['selectedTechnicalType']) => {
    setStore('selectedTechnicalType', type);
};

export const setSelectedDsType = (type: AppState['selectedDsType']) => {
    setStore('selectedDsType', type);
};

export const setActiveDsOpsElement = (id: string | null) => {
    setStore('activeDsOpsElementId', id);
};

export const setSelectedUmlType = (type: AppState['selectedUmlType']) => {
    setStore('selectedUmlType', type);
};

export const setSelectedBpmnType = (type: AppState['selectedBpmnType']) => {
    setStore('selectedBpmnType', type);
};

export const toggleCommandPalette = (visible?: boolean, filter?: string | null) => {
    setStore('commandPaletteFilter', filter ?? null);
    setStore('showCommandPalette', (v) => visible ?? !v);
};

// Initialize theme on load — apply the *resolved* theme so the `system` option
// follows the OS at first paint.
document.documentElement.setAttribute('data-theme', initialState.resolvedTheme);

// When the user's choice is `system`, re-resolve and re-apply whenever the OS
// theme flips.  Other choices (light/dark/focus) are unaffected.
if (typeof window !== 'undefined' && window.matchMedia) {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (store.theme === 'system') setTheme('system'); };
    if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', handler);
    } else if (typeof (mql as any).addListener === 'function') {
        (mql as any).addListener(handler);
    }
}

import { calculateAlignment, calculateDistribution, type AlignmentType, type DistributionType } from "../utils/alignment";

export const alignSelectedElements = (type: AlignmentType) => {
    if (store.selection.length < 2) return;
    const updates = calculateAlignment(store.selection, store.elements, type);
    if (updates.length > 0) {
        pushToHistory();
        setStore('elements',
            (el) => updates.some(u => u.id === el.id),
            (el) => {
                const update = updates.find(u => u.id === el.id)?.updates;
                return update ? { ...el, ...update } : el;
            }
        );
        bumpDirtyRevision();
    }
};

export const cycleStrokeStyle = () => {
    if (store.selection.length === 0) {
        // Cycle default style
        const styles: DrawingElement['strokeStyle'][] = ['solid', 'dashed', 'dotted'];
        const current = store.defaultElementStyles.strokeStyle || 'solid';
        const next = styles[(styles.indexOf(current) + 1) % styles.length];
        updateDefaultStyles({ strokeStyle: next });
        return;
    }

    pushToHistory();
    setStore('elements', (el) => store.selection.includes(el.id), (el) => {
        const styles: DrawingElement['strokeStyle'][] = ['solid', 'dashed', 'dotted'];
        const current = el.strokeStyle || 'solid';
        const next = styles[(styles.indexOf(current) + 1) % styles.length];
        return { strokeStyle: next };
    });
    bumpDirtyRevision();
};

export const cycleFillStyle = () => {
    if (store.selection.length === 0) {
        // Cycle default style
        const styles: DrawingElement['fillStyle'][] = ['hachure', 'solid', 'zigzag', 'cross-hatch', 'dots', 'dashed', 'zigzag-line'];
        const current = store.defaultElementStyles.fillStyle || 'hachure';
        const next = styles[(styles.indexOf(current) + 1) % styles.length];
        updateDefaultStyles({ fillStyle: next });
        return;
    }

    pushToHistory();
    setStore('elements', (el) => store.selection.includes(el.id), (el) => {
        const styles: DrawingElement['fillStyle'][] = ['hachure', 'solid', 'zigzag', 'cross-hatch', 'dots', 'dashed', 'zigzag-line'];
        const current = el.fillStyle || 'hachure';
        const next = styles[(styles.indexOf(current) + 1) % styles.length];
        return { fillStyle: next };
    });
    bumpDirtyRevision();
};

export const distributeSelectedElements = (type: DistributionType) => {
    if (store.selection.length < 3) return;
    const updates = calculateDistribution(store.selection, store.elements, type);
    if (updates.length > 0) {
        pushToHistory();
        setStore('elements',
            (el) => updates.some(u => u.id === el.id),
            (el) => {
                const update = updates.find(u => u.id === el.id)?.updates;
                return update ? { ...el, ...update } : el;
            }
        );
        bumpDirtyRevision();
    }
};

// ── Repeat & symmetry (radial / grid / mirror / transform-again) ──────────────
//
// All of these build on one primitive: deep-clone the current selection (with
// group-aware id remapping, mirroring the Ctrl+D handler) and apply a rigid
// transform to each clone. Element rotation is stored as `angle` (radians) about
// the element centre, so a rigid rotation about an arbitrary pivot is: rotate the
// element centre about the pivot, then add the same delta to `angle`. This works
// uniformly for every element type without touching its local geometry.

interface SelBBox { minX: number; minY: number; maxX: number; maxY: number; cx: number; cy: number; w: number; h: number; }

const selectionBBox = (ids: string[]): SelBBox => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of store.elements) {
        if (!ids.includes(el.id)) continue;
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
    }
    if (!isFinite(minX)) { minX = minY = maxX = maxY = 0; }
    return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY };
};

const rotatePoint = (px: number, py: number, cx: number, cy: number, theta: number) => {
    const c = Math.cos(theta), s = Math.sin(theta);
    const dx = px - cx, dy = py - cy;
    return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
};

/**
 * Deep-clone the elements in `ids` (group-aware: shared groupIds are remapped to
 * fresh ids so the copies stay grouped together but separate from the originals),
 * apply `mutate(clone, source)` to each, append them to the store, and return the
 * new ids. Does NOT push history or change selection — callers do that.
 */
const cloneSelection = (ids: string[], mutate: (clone: DrawingElement, src: DrawingElement) => DrawingElement): string[] => {
    const src = store.elements.filter(e => ids.includes(e.id));
    if (src.length === 0) return [];
    const batchIds = new Set<string>();
    const idMap = new Map<string, string>();
    const groupMap = new Map<string, string>();
    src.forEach(el => {
        idMap.set(el.id, generateId(el.type, batchIds));
        el.groupIds?.forEach(g => { if (!groupMap.has(g)) groupMap.set(g, generateId('group', batchIds)); });
    });
    const clones = src.map(el => {
        const base: DrawingElement = {
            ...el,
            id: idMap.get(el.id)!,
            points: el.points
                ? ((el.points.length > 0 && typeof el.points[0] === 'number')
                    ? [...(el.points as number[])]
                    : (el.points as any[]).map(p => ({ ...p })))
                : undefined,
            roundness: el.roundness ? { ...el.roundness } : null,
            crop: el.crop ? { ...el.crop } : null,
            boundElements: null,
            groupIds: el.groupIds?.map(g => groupMap.get(g)!) ?? undefined,
            seed: Math.floor(Math.random() * 2147483647),
        } as DrawingElement;
        return mutate(base, el);
    });
    setStore('elements', els => [...els, ...clones]);
    return clones.map(c => c.id);
};

/** Apply a rigid rotation of `theta` about (cx,cy) to a clone, given the source's geometry. */
const placeRotated = (clone: DrawingElement, src: DrawingElement, cx: number, cy: number, theta: number, rotateSelf: boolean): DrawingElement => {
    const ecx = src.x + src.width / 2, ecy = src.y + src.height / 2;
    const r = rotatePoint(ecx, ecy, cx, cy, theta);
    return {
        ...clone,
        x: r.x - src.width / 2,
        y: r.y - src.height / 2,
        angle: rotateSelf ? (src.angle || 0) + theta : (src.angle || 0),
    };
};

/**
 * Radial repeat — arrange `count` copies of the selection evenly around a ring.
 * `radius` pushes each instance out from the selection centre (0 = rotate in
 * place, e.g. count=2 → a 180° rotational mark). `faceCenter` rotates each copy
 * to keep its orientation radial; otherwise copies keep their upright orientation.
 */
export const radialRepeat = (count: number, opts?: { radius?: number; faceCenter?: boolean }) => {
    if (store.selection.length === 0 || count < 2) return;
    const radius = opts?.radius ?? 0;
    const face = opts?.faceCenter ?? false;
    const bb = selectionBBox(store.selection);
    const Cx = bb.cx, Cy = bb.cy;            // ring centre = selection centre
    const tdx = 0, tdy = -radius;            // base offset: push instance to top of ring
    const step = (2 * Math.PI) / count;
    pushToHistory();

    const selIds = [...store.selection];
    // Instance 0: move the originals onto the ring (no rotation).
    if (radius !== 0) {
        setStore('elements', (el) => selIds.includes(el.id), (el) => ({ ...el, x: el.x + tdx, y: el.y + tdy }));
    }
    // Instances 1..count-1: rotated clones about the ring centre.
    const newIds: string[] = [];
    for (let i = 1; i < count; i++) {
        const theta = step * i;
        const ids = cloneSelection(selIds, (clone, srcOrig) => {
            // src position = the instance-0 (moved) position
            const src = { ...srcOrig, x: srcOrig.x + tdx, y: srcOrig.y + tdy } as DrawingElement;
            return placeRotated(clone, src, Cx, Cy, theta, face);
        });
        newIds.push(...ids);
    }
    setStore('selection', [...selIds, ...newIds]);
    bumpDirtyRevision();
    showToast(`Radial repeat ×${count}`, 'success');
};

/**
 * Grid repeat — tile `rows × cols` copies of the selection. Spacing defaults to
 * the selection's bounding box plus `gap` so copies sit edge-to-edge with a gutter.
 */
export const gridRepeat = (rows: number, cols: number, opts?: { gapX?: number; gapY?: number }) => {
    if (store.selection.length === 0 || rows < 1 || cols < 1 || (rows === 1 && cols === 1)) return;
    const bb = selectionBBox(store.selection);
    const dx = bb.w + (opts?.gapX ?? 20);
    const dy = bb.h + (opts?.gapY ?? 20);
    const selIds = [...store.selection];
    pushToHistory();
    const newIds: string[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (r === 0 && c === 0) continue; // cell 0,0 = original
            const ids = cloneSelection(selIds, (clone, src) => ({ ...clone, x: src.x + c * dx, y: src.y + r * dy }));
            newIds.push(...ids);
        }
    }
    setStore('selection', [...selIds, ...newIds]);
    bumpDirtyRevision();
    showToast(`Grid repeat ${rows}×${cols}`, 'success');
};

/**
 * Mirror copy — duplicate the selection reflected across the far edge of its
 * bounding box, so the mirror sits adjacent and forms a symmetric pair. Shapes
 * toggle flipX/flipY (canvas-level mirror); point-based elements reflect their
 * points. Rotation is negated so rotated shapes mirror correctly.
 */
// Reflect a clone of `src` across an axis line. `vertical` axis = a vertical line
// at world x=`value` (left↔right mirror); `horizontal` axis = horizontal line at
// world y=`value` (up↕down mirror). Shapes toggle flipX/flipY; point elements
// reflect their local points; rotation is negated.
const reflectClone = (clone: DrawingElement, src: DrawingElement, axis: 'horizontal' | 'vertical', value: number): DrawingElement => {
    const ecx = src.x + src.width / 2, ecy = src.y + src.height / 2;
    if (axis === 'horizontal') {
        const ncx = 2 * value - ecx;
        const out: DrawingElement = { ...clone, x: ncx - src.width / 2, angle: -(src.angle || 0) };
        if (src.points) {
            out.points = normalizePoints(src.points).map(p => ({ x: src.width - p.x, y: p.y })) as any;
            out.pointsEncoding = undefined;
        } else out.flipX = !src.flipX;
        return out;
    } else {
        const ncy = 2 * value - ecy;
        const out: DrawingElement = { ...clone, y: ncy - src.height / 2, angle: -(src.angle || 0) };
        if (src.points) {
            out.points = normalizePoints(src.points).map(p => ({ x: p.x, y: src.height - p.y })) as any;
            out.pointsEncoding = undefined;
        } else out.flipY = !src.flipY;
        return out;
    }
};

export const mirrorCopy = (axis: 'horizontal' | 'vertical') => {
    if (store.selection.length === 0) return;
    const bb = selectionBBox(store.selection);
    // Reflect across the bbox's far edge so the copy sits adjacent.
    const value = axis === 'horizontal' ? bb.maxX : bb.maxY;
    const selIds = [...store.selection];
    pushToHistory();
    const newIds = cloneSelection(selIds, (clone, src) => reflectClone(clone, src, axis, value));
    setStore('selection', [...selIds, ...newIds]);
    bumpDirtyRevision();
    showToast(`Mirrored ${axis === 'horizontal' ? '↔' : '↕'}`, 'success');
};

// ── Symmetry guide (a persistent reflection axis) ────────────────────────────
// `axis: 'vertical'` is a vertical guide line at world x=`pos` (left↔right);
// `horizontal` is at world y=`pos`. Pure construction aid — it never auto-mirrors
// while drawing; use mirrorAcrossSymmetry() to reflect the selection across it.
export const toggleSymmetryGuide = (enabled?: boolean, pos?: number) => {
    setStore('symmetry', s => ({
        ...s,
        enabled: enabled ?? !s.enabled,
        pos: pos ?? s.pos,
    }));
};
export const setSymmetryAxis = (axis: 'vertical' | 'horizontal') => setStore('symmetry', 'axis', axis);
export const setSymmetryPos = (pos: number) => setStore('symmetry', 'pos', Math.round(pos));

/**
 * Mirror the selection across the symmetry guide — the "draw one half, mirror it"
 * move. A vertical guide reflects left↔right (axis 'horizontal' in reflectClone),
 * a horizontal guide reflects up↕down. Adds the reflected clones to the canvas.
 */
export const mirrorAcrossSymmetry = () => {
    if (store.selection.length === 0) return;
    const { axis, pos } = store.symmetry;
    // A vertical guide line mirrors along the X axis (horizontal reflection).
    const reflectAxis: 'horizontal' | 'vertical' = axis === 'vertical' ? 'horizontal' : 'vertical';
    const selIds = [...store.selection];
    pushToHistory();
    const newIds = cloneSelection(selIds, (clone, src) => reflectClone(clone, src, reflectAxis, pos));
    setStore('selection', [...selIds, ...newIds]);
    bumpDirtyRevision();
    showToast('Mirrored across guide', 'success');
};

/**
 * Numeric Transform — set an element's position and/or size from the property panel.
 * `x`/`y` just move it (geometry is origin-relative). `width`/`height` scale the
 * element AND its relative geometry (pen points, vector path anchors/handles, erase
 * strokes, text font-size) via the shared {@link scalePoints} helpers, so the W/H
 * fields stay in sync with the shape exactly like dragging a resize handle does.
 */
export const setElementTransform = (
    id: string,
    patch: { x?: number; y?: number; width?: number; height?: number }
) => {
    const el = store.elements.find(e => e.id === id);
    if (!el) return;
    const updates: Partial<DrawingElement> = {};
    if (patch.x !== undefined && Number.isFinite(patch.x)) updates.x = patch.x;
    if (patch.y !== undefined && Number.isFinite(patch.y)) updates.y = patch.y;

    const wantsResize =
        (patch.width !== undefined && Number.isFinite(patch.width)) ||
        (patch.height !== undefined && Number.isFinite(patch.height));
    if (wantsResize) {
        const newW = patch.width !== undefined && Number.isFinite(patch.width) ? Math.max(1, patch.width) : el.width;
        const newH = patch.height !== undefined && Number.isFinite(patch.height) ? Math.max(1, patch.height) : el.height;
        const scaleX = el.width === 0 ? 1 : newW / el.width;
        const scaleY = el.height === 0 ? 1 : newH / el.height;
        updates.width = newW;
        updates.height = newH;
        if (scaleX !== 1 || scaleY !== 1) {
            if (el.points) { updates.points = scalePoints(el.points, scaleX, scaleY); updates.pointsEncoding = undefined; }
            if (el.pathAnchors) updates.pathAnchors = scalePathAnchors(el.pathAnchors as any, scaleX, scaleY) as any;
            if (el.pathSubpaths) updates.pathSubpaths = scalePathSubpaths(el.pathSubpaths as any, scaleX, scaleY) as any;
            if (el.eraseStrokes) updates.eraseStrokes = scaleEraseStrokes(el.eraseStrokes as any, scaleX, scaleY) as any;
            if ((el.type === 'text' || el.type === 'richtext') && el.fontSize) updates.fontSize = Math.max(8, el.fontSize * scaleY);
        }
    }

    if (Object.keys(updates).length === 0) return;
    updateElement(id, updates, false);
    bumpDirtyRevision();
};

// Last rigid transform applied to a selection, replayed by transformAgain (Ctrl+Shift+D).
// Recorded by duplicate (Ctrl+D) and arrow-key nudges.
interface LastTransform { dx: number; dy: number; angle?: number; pivotX?: number; pivotY?: number; }
let lastTransform: LastTransform | null = null;
export const recordTransform = (t: LastTransform) => { lastTransform = t; };

/**
 * Transform Again — clone the selection and replay the last recorded transform.
 * Duplicate (offset), then Ctrl+Shift+D repeatedly → a step-and-repeat array in
 * the same direction. Falls back to a default diagonal offset if nothing recorded.
 */
export const transformAgain = () => {
    if (store.selection.length === 0) return;
    const off = 20 / store.viewState.scale;
    const t = lastTransform ?? { dx: off, dy: off };
    const selIds = [...store.selection];
    pushToHistory();
    const newIds = cloneSelection(selIds, (clone, src) => {
        let nx = src.x + t.dx, ny = src.y + t.dy, ang = src.angle || 0;
        if (t.angle && t.pivotX != null && t.pivotY != null) {
            const moved = { ...src, x: nx, y: ny } as DrawingElement;
            const r = placeRotated(clone, moved, t.pivotX, t.pivotY, t.angle, true);
            return { ...r };
        }
        return { ...clone, x: nx, y: ny, angle: ang };
    });
    setStore('selection', newIds);
    bumpDirtyRevision();
};

/**
 * Load a template into the canvas
 * Clears existing content and loads template data
 */
export const loadTemplate = (templateData: {
    elements: DrawingElement[];
    layers: Layer[];
    viewState?: ViewState;
    gridSettings?: GridSettings;
    globalSettings?: GlobalSettings;
    canvasBackgroundColor?: string;
}) => {
    // Clear history and reset canvas
    clearHistory();

    // Load template data
    setStore({
        elements: templateData.elements,
        layers: templateData.layers,
        activeLayerId: templateData.layers[0]?.id || 'default-layer',
        viewState: templateData.viewState || { scale: 1, panX: 0, panY: 0 },
        gridSettings: templateData.gridSettings || store.gridSettings,
        globalSettings: templateData.globalSettings || store.globalSettings,
        canvasBackgroundColor: templateData.canvasBackgroundColor || store.canvasBackgroundColor,
        selection: []
    });
};

/**
 * Load a multi-slide PresentationTemplate into the canvas.
 * Converts template slides into a v4 SlideDocument and delegates to loadDocument().
 */
export const loadPresentationTemplate = (template: {
    slides: Array<{
        name: string;
        backgroundColor?: string;
        fillStyle?: string;
        gradientStops?: any[];
        gradientDirection?: number;
        elements: Partial<DrawingElement>[];
        transition?: SlideTransition;
    }>;
    palette?: { primary: string; secondary: string; accent: string; background: string; text: string };
}) => {
    const SLIDE_GAP = 2000;
    const allElements: DrawingElement[] = [];
    const slides: Slide[] = [];

    template.slides.forEach((slideTemplate, index) => {
        const spatialX = index * SLIDE_GAP;
        const spatialY = 0;

        // Offset elements to spatial position
        const slideElements = slideTemplate.elements.map(el => ({
            ...el,
            x: (el.x || 0) + spatialX,
            y: (el.y || 0) + spatialY,
        })) as DrawingElement[];

        allElements.push(...slideElements);

        slides.push({
            id: generateId('slide'),
            name: slideTemplate.name || `Slide ${index + 1}`,
            spatialPosition: { x: spatialX, y: spatialY },
            dimensions: { width: 1920, height: 1080 },
            order: index,
            backgroundColor: slideTemplate.backgroundColor || template.palette?.background || '',
            fillStyle: (slideTemplate.fillStyle as any) || undefined,
            gradientStops: slideTemplate.gradientStops || undefined,
            gradientDirection: slideTemplate.gradientDirection || undefined,
            transition: slideTemplate.transition || { ...DEFAULT_SLIDE_TRANSITION },
        });
    });

    const doc = {
        version: 4,
        metadata: { name: 'Presentation', docType: 'slides' as const },
        elements: allElements,
        layers: [{ id: 'default-layer', name: 'Layer 1', visible: true, locked: false, opacity: 1, order: 0, backgroundColor: 'transparent' }],
        slides,
        globalSettings: {},
    };
    loadDocument(doc);
};


export const toggleCollapse = (id: string) => {
    const el = store.elements.find(e => e.id === id);
    if (el) {
        updateElement(id, { isCollapsed: !el.isCollapsed }, true);
        relayoutMindmap(id, { animate: true });
    }
};

export const setParent = (childId: string, parentId: string | null) => {
    const oldParentId = store.elements.find(e => e.id === childId)?.parentId ?? null;
    updateElement(childId, { parentId }, true);
    // Reflow the destination tree; the source tree only animates if it's the same
    // tree (single shared animation channel), else snap it tidy without animation.
    const newRoot = findMindmapRoot(parentId ?? childId);
    relayoutMindmap(newRoot, { animate: true });
    if (oldParentId) {
        const oldRoot = findMindmapRoot(oldParentId);
        if (oldRoot !== newRoot) relayoutMindmap(oldRoot, { animate: false });
    }
};

export const clearParent = (id: string) => {
    updateElement(id, { parentId: null }, true);
};
/**
 * Core layout pass: build the tree from `rootId`, run the chosen strategy, write
 * positions, and refresh bound connectors. Does NOT push history or toast — that's
 * the caller's job — so it can be reused by paste/auto-clean paths.
 */
/** Run the chosen layout strategy and collect target updates (no store mutation). */
export const computeMindmapLayout = (rootId: string, direction: LayoutDirection, skipCollapsed = false): Map<string, Partial<DrawingElement>> | null => {
    const engine = new MindmapLayoutEngine();
    const tree = engine.buildTree(rootId, store.elements, undefined, skipCollapsed);
    if (!tree) return null;

    if (direction === 'balanced') {
        engine.layoutBalanced(tree);
    } else if (direction.startsWith('horizontal')) {
        engine.layoutHorizontal(tree, direction === 'horizontal-right' ? 'right' : 'left');
    } else if (direction.startsWith('vertical')) {
        engine.layoutVertical(tree, direction === 'vertical-down' ? 'down' : 'up');
    } else if (direction === 'radial') {
        engine.layoutRadial(tree);
    }
    return engine.getUpdates(tree, store.elements);
};

const refreshMindmapConnectors = () => {
    for (const el of store.elements) {
        if ((el.type === 'organicBranch' || el.type === 'arrow' || el.type === 'line')
            && (el.startBinding || el.endBinding)) {
            refreshBoundLine(el.id, () => store.elements, (id, upd) => updateElement(id, upd, false));
        }
    }
};

const applyMindmapUpdates = (updates: Map<string, Partial<DrawingElement>>) => {
    setStore("elements", store.elements.map(el => updates.has(el.id) ? { ...el, ...updates.get(el.id) } : el));
    refreshMindmapConnectors();
};

export const layoutMindmapTree = (rootId: string, direction: LayoutDirection) => {
    const updates = computeMindmapLayout(rootId, direction);
    if (!updates) return false;
    applyMindmapUpdates(updates);
    return true;
};

/** Walk parentId up to the topmost ancestor (the mindmap root). */
const findMindmapRoot = (id: string): string => {
    let cur = store.elements.find(e => e.id === id);
    let guard = 0;
    while (cur?.parentId && guard++ < 1000) {
        const p = store.elements.find(e => e.id === cur!.parentId);
        if (!p) break;
        cur = p;
    }
    return cur?.id ?? id;
};

const resolveMindmapDirection = (rootId: string): LayoutDirection => {
    const root = store.elements.find(e => e.id === rootId);
    return (root?.mindmapDir as LayoutDirection) || store.globalSettings.mindmapLayoutDirection || 'balanced';
};

// Single in-flight reflow animation; a new mutation cancels and retargets it.
let reflowRaf: number | null = null;
const cancelReflowAnim = () => {
    if (reflowRaf != null && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(reflowRaf);
    reflowRaf = null;
};

/**
 * Auto-reflow the mindmap tree containing `nodeId` into a tidy layout. Gated by
 * the `mindmapAutoLayout` setting. Collapsed subtrees are treated as leaves so
 * collapsing frees space. Animates positions (~180ms ease-out) unless disabled,
 * reduced-motion is set, or there's no rAF. Does NOT push history — the caller's
 * mutation already did.
 */
export const relayoutMindmap = (nodeId: string, opts: { animate?: boolean } = {}) => {
    if (store.globalSettings.mindmapAutoLayout === false) return;
    const rootId = findMindmapRoot(nodeId);
    const updates = computeMindmapLayout(rootId, resolveMindmapDirection(rootId), true);
    if (!updates) return;

    const animate = opts.animate !== false
        && store.globalSettings.reducedMotion !== true
        && typeof requestAnimationFrame !== 'undefined';

    if (!animate) { applyMindmapUpdates(updates); return; }

    cancelReflowAnim();
    const from = new Map<string, { x: number; y: number }>();
    for (const [id] of updates) {
        const el = store.elements.find(e => e.id === id);
        if (el) from.set(id, { x: el.x, y: el.y });
    }
    const start = performance.now();
    const DUR = 180;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
        const t = Math.min(1, (now - start) / DUR);
        const e = ease(t);
        setStore("elements", store.elements.map(el => {
            const target = updates.get(el.id);
            const f = from.get(el.id);
            if (!target || !f) return el;
            if (t >= 1) return { ...el, ...target }; // snap to exact target (+ any non-position props)
            return { ...el, x: f.x + ((target.x as number) - f.x) * e, y: f.y + ((target.y as number) - f.y) * e };
        }));
        refreshMindmapConnectors();
        reflowRaf = t < 1 ? requestAnimationFrame(step) : null;
    };
    reflowRaf = requestAnimationFrame(step);
};

export const reorderMindmap = (rootId: string, direction: LayoutDirection) => {
    if (!store.elements.some(e => e.id === rootId)) return;
    pushToHistory();
    updateElement(rootId, { mindmapDir: direction }, false); // remember the choice for auto-reflow
    if (layoutMindmapTree(rootId, direction)) {
        showToast(`Mindmap layout updated (${direction})`, 'success');
    }
};

/**
 * Pathfinder boolean op (union/subtract/intersect/exclude) over ≥2 selected elements.
 * Flattens each to polygons, runs the op (subtract = backmost minus the rest, in
 * z-order), replaces the inputs with the result `path`(s), and selects them.
 * Returns the new element ids.
 */
export const applyPathfinder = (ids: string[], op: BooleanOp): string[] => {
    const els = store.elements.filter(e => ids.includes(e.id));
    if (els.length < 2) return [];
    // Back → front (store order) so subtract is deterministic ("minus front").
    els.sort((a, b) => store.elements.indexOf(a) - store.elements.indexOf(b));

    const polys = runBooleanOp(els, op);
    if (polys.length === 0) { showToast('Pathfinder: empty result', 'info'); return []; }

    const base = els[0];
    const created: DrawingElement[] = [];
    for (const poly of polys) {
        const path = buildPathFromPoly(poly, {
            strokeColor: base.strokeColor,
            backgroundColor: base.backgroundColor,
            fillStyle: base.fillStyle,
            strokeWidth: base.strokeWidth,
            strokeStyle: base.strokeStyle,
            renderStyle: base.renderStyle,
            opacity: base.opacity,
            roughness: base.roughness,
            layerId: base.layerId,
        });
        if (path) created.push(path);
    }
    if (created.length === 0) return [];

    pushToHistory();
    setStore('elements', list => [...list.filter(e => !ids.includes(e.id)), ...created]);
    setStore('selection', created.map(c => c.id));
    showToast(`Pathfinder: ${op}`, 'success');
    return created.map(c => c.id);
};

/**
 * Convert shapes to editable vector `path` elements in place (same id, z-order, style,
 * and connector bindings preserved). Skips elements that are already paths or have no
 * convertible geometry. Returns the converted ids.
 */
export const convertToPath = (ids: string[]): string[] => {
    const anchorsById = new Map<string, ReturnType<typeof shapeToPath>>();
    for (const el of store.elements) {
        if (ids.includes(el.id) && el.type !== 'path') {
            const r = shapeToPath(el);
            if (r) anchorsById.set(el.id, r);
        }
    }
    if (anchorsById.size === 0) return [];

    pushToHistory();
    setStore('elements', list => list.map(el => {
        const r = anchorsById.get(el.id);
        if (!r) return el;
        return { ...el, type: 'path', pathAnchors: r.anchors, pathClosed: r.closed, points: undefined, controlPoints: undefined } as DrawingElement;
    }));
    const out = [...anchorsById.keys()];
    setStore('selection', out);
    showToast(`Converted ${out.length} to path`, 'success');
    return out;
};

/**
 * Envelope Distort — toggle a 4-corner bilinear free-distort on the selection. Turning it
 * on initializes the warp quad to the bounding box (identity) so the 4 orange corner
 * handles can then be dragged; non-path shapes are converted to a `path` first (the warp
 * flows through the path branch of getShapeGeometry). Toggling again clears the warp.
 */
export const toggleEnvelopeWarp = (ids: string[]): string[] => applyWarpGrid(ids, 2, 2, 'toggle');

/**
 * Mesh Warp — a finer R×C control-point grid (default 3×3). Re-applying with the same
 * selection re-initializes the grid (so you can switch resolutions); `toggle` removes it.
 */
export const applyMeshWarp = (ids: string[], rows = 3, cols = 3): string[] => applyWarpGrid(ids, rows, cols, 'set');

/** Toggle bicubic (Catmull-Rom) smoothing on a warped element's mesh. */
export const toggleMeshSmooth = (ids: string[]): string[] => {
    const targets = store.elements.filter(e => ids.includes(e.id) && e.warp);
    if (targets.length === 0) { showToast('Smooth: select a warped shape', 'info'); return []; }
    pushToHistory();
    const want = !targets[0].warp?.smooth;
    setStore('elements', list => list.map(el =>
        (ids.includes(el.id) && el.warp) ? ({ ...el, warp: { ...el.warp, smooth: want } } as DrawingElement) : el));
    bumpDirtyRevision();
    showToast(want ? 'Mesh smoothing on' : 'Mesh smoothing off', 'success');
    return targets.map(t => t.id);
};

/**
 * Bake / Apply Warp — commit the envelope/mesh distortion into the geometry and drop the
 * cage (Illustrator "Expand"), the destructive counterpart to Remove (which reverts).
 * Paths: the warped outline is resampled into the path's anchors. Images: the warped bitmap
 * is rasterized into a new image placed at the warped bbox.
 */
export const bakeWarp = (ids: string[]): string[] => {
    const targets = store.elements.filter(e => ids.includes(e.id) && e.warp);
    if (targets.length === 0) { showToast('Bake: select a warped shape', 'info'); return []; }
    pushToHistory();
    const out: string[] = [];
    setStore('elements', list => list.map(el => {
        if (!ids.includes(el.id) || !el.warp) return el;

        if (el.type === 'image' && el.dataURL) {
            const img = getImage(el.dataURL);
            const r = img ? rasterizeWarpedImage(el, img) : null;
            if (!r) return el;
            out.push(el.id);
            const { warp, crop, ...rest } = el as any; // crop is baked into the raster
            return { ...rest, dataURL: r.dataURL, x: r.x, y: r.y, width: r.width, height: r.height } as DrawingElement;
        }

        // Vector: turn the warped outline (a sampled path `d`, centred frame) into anchors.
        const geo = getShapeGeometry(el); // already warped via getShapeGeometry's warp branch
        if (!geo || geo.type !== 'path') return el;
        const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
        const cmds = PathUtils.parsePath(geo.path);
        const worldSubs: WorldSub[] = [];
        let cur: PathAnchor[] = []; let closed = false;
        const flush = () => { if (cur.length >= 2) worldSubs.push({ anchors: cur, closed }); cur = []; closed = false; };
        for (const c of cmds) {
            const p = c.points && c.points[c.points.length - 1];
            if (c.type === 'M' && p) { flush(); cur.push({ x: cx + p.x, y: cy + p.y, kind: 'corner' }); }
            else if (c.type === 'L' && p) { cur.push({ x: cx + p.x, y: cy + p.y, kind: 'corner' }); }
            else if (c.type === 'Z') { closed = true; }
        }
        flush();
        const norm = worldSubs.length ? normalizeWorldSubs(worldSubs) : null;
        if (!norm) return el;
        out.push(el.id);
        const single = norm.subpaths.length === 1;
        const { warp, ...rest } = el as any;
        return {
            ...rest, type: 'path',
            x: norm.x, y: norm.y, width: norm.width, height: norm.height,
            pathAnchors: single ? norm.subpaths[0].anchors : undefined,
            pathClosed: single ? norm.subpaths[0].closed : undefined,
            pathSubpaths: single ? undefined : norm.subpaths,
            points: undefined, controlPoints: undefined,
        } as DrawingElement;
    }));
    bumpDirtyRevision();
    showToast(out.length ? 'Warp baked' : 'Bake: unsupported shape', out.length ? 'success' : 'info');
    return out;
};

const applyWarpGrid = (ids: string[], rows: number, cols: number, mode: 'toggle' | 'set'): string[] => {
    const targets = store.elements.filter(e => ids.includes(e.id));
    if (targets.length === 0) { showToast('Warp: select a shape', 'info'); return []; }
    pushToHistory();
    const out: string[] = [];
    setStore('elements', list => list.map(el => {
        if (!ids.includes(el.id)) return el;
        // Toggle off when the existing grid already matches the requested resolution.
        if (mode === 'toggle' && el.warp) {
            const g = getWarpGrid(el.warp);
            if (g) { out.push(el.id); const { warp, ...rest } = el as any; return rest as DrawingElement; }
        }
        let base = el;
        // Images warp as bitmaps (texture-mapped in the image renderer) — keep them as
        // images; only vector shapes are converted to a path so the warp deforms an outline.
        if (el.type !== 'path' && el.type !== 'image') {
            const r = shapeToPath(el);
            if (!r) return el;
            base = { ...el, type: 'path', pathAnchors: r.anchors, pathClosed: r.closed, points: undefined, controlPoints: undefined } as DrawingElement;
        }
        out.push(el.id);
        return { ...base, warp: defaultWarpGrid(base.width, base.height, rows, cols) } as DrawingElement;
    }));
    bumpDirtyRevision();
    showToast(out.length ? `Warp ${cols}×${rows}` : 'Warp: unsupported shape', out.length ? 'success' : 'info');
    return out;
};

/**
 * Text → Outlines — replace each selected text element with an editable vector
 * `path` element of its glyph outlines (Illustrator "Create Outlines"). Async
 * because the glyph font binary is fetched + parsed lazily. Counters become
 * holes via even-odd fill. The path inherits the text colour as a solid fill.
 */
export const convertTextToOutlines = async (ids: string[]): Promise<string[]> => {
    const texts = store.elements.filter(e => ids.includes(e.id) && e.type === 'text');
    if (texts.length === 0) { showToast('Select a text element to outline', 'info'); return []; }

    const results: { srcId: string; res: Awaited<ReturnType<typeof textElementToOutline>> }[] = [];
    for (const el of texts) {
        try {
            const res = await textElementToOutline(el);
            if (res) results.push({ srcId: el.id, res });
        } catch (e) {
            console.error('[outline] failed for', el.id, e);
        }
    }
    if (results.length === 0) { showToast('Could not outline text', 'error'); return []; }

    pushToHistory();
    const newIds: string[] = [];
    setStore('elements', list => list.map(el => {
        const r = results.find(x => x.srcId === el.id);
        if (!r || !r.res) return el;
        const fill = el.textColor || el.strokeColor || '#000000';
        const id = generateId('path');
        newIds.push(id);
        return {
            ...el,
            id, type: 'path',
            x: r.res.x, y: r.res.y, width: r.res.width, height: r.res.height,
            pathSubpaths: r.res.subpaths,
            pathAnchors: undefined, pathClosed: undefined,
            points: undefined, controlPoints: undefined,
            text: undefined, rawText: undefined, richText: undefined, containerText: undefined,
            backgroundColor: fill, fillStyle: 'solid',
            strokeColor: 'transparent', strokeWidth: 0,
        } as DrawingElement;
    }));
    setStore('selection', newIds);
    bumpDirtyRevision();
    showToast(`Outlined ${newIds.length} text → path`, 'success');
    return newIds;
};

/**
 * Build a `path` element from one boolean/offset result polygon (outer ring + holes).
 * A single ring becomes a node-editable `pathAnchors` path; a polygon with holes becomes
 * a multi-subpath `pathSubpaths` path (even-odd fill). World coords are normalized to the
 * polygon's bbox.
 */
function buildPathFromPoly(poly: Poly, style: Partial<DrawingElement>): DrawingElement | null {
    const norm = polyToPathSubpaths(poly);
    if (!norm) return null;
    const single = norm.subpaths.length === 1;
    return {
        ...store.defaultElementStyles,
        id: generateId('path'),
        type: 'path',
        x: norm.minX, y: norm.minY, width: norm.width, height: norm.height,
        // Single ring → editable pathAnchors; holes → pathSubpaths (even-odd).
        pathAnchors: single ? norm.subpaths[0].anchors : undefined,
        pathClosed: single ? true : undefined,
        pathSubpaths: single ? undefined : norm.subpaths,
        angle: 0,
        seed: Math.floor(Math.random() * 2 ** 31),
        roundness: null,
        locked: false,
        link: null,
        layerId: store.activeLayerId,
        ...style,
    } as DrawingElement;
}

/**
 * Outline Stroke: replace each element with a filled `path` of its stroke outline
 * (Minkowski sum of the centerline with a disk of strokeWidth/2). The result is filled
 * with the original stroke color and has no stroke. Returns the new ids.
 */
export const outlineStroke = (ids: string[]): string[] => {
    const targets = store.elements.filter(e => ids.includes(e.id));
    const created: DrawingElement[] = [];
    const replaceIds = new Set<string>();
    for (const el of targets) {
        const polys = computeOutlineStroke(el);
        if (polys.length === 0) continue;
        replaceIds.add(el.id);
        for (const poly of polys) {
            const path = buildPathFromPoly(poly, {
                backgroundColor: el.strokeColor, fillStyle: 'solid',
                strokeColor: 'transparent', strokeWidth: 0,
                renderStyle: el.renderStyle, opacity: el.opacity, layerId: el.layerId,
            });
            if (path) created.push(path);
        }
    }
    if (created.length === 0) { showToast('Outline stroke: nothing to outline', 'info'); return []; }
    pushToHistory();
    setStore('elements', list => [...list.filter(e => !replaceIds.has(e.id)), ...created]);
    setStore('selection', created.map(c => c.id));
    showToast('Outlined stroke', 'success');
    return created.map(c => c.id);
};

/**
 * Offset Path: add a parallel `path` offset by `distance` (outward +, inward −),
 * keeping the original. Returns the new ids.
 */
export const offsetPath = (ids: string[], distance: number): string[] => {
    const targets = store.elements.filter(e => ids.includes(e.id));
    const created: DrawingElement[] = [];
    for (const el of targets) {
        const polys = computeOffsetPath(el, distance);
        for (const poly of polys) {
            const path = buildPathFromPoly(poly, {
                backgroundColor: el.backgroundColor, fillStyle: el.fillStyle,
                strokeColor: el.strokeColor, strokeWidth: el.strokeWidth, strokeStyle: el.strokeStyle,
                renderStyle: el.renderStyle, opacity: el.opacity, layerId: el.layerId,
            });
            if (path) created.push(path);
        }
    }
    if (created.length === 0) { showToast('Offset path: empty result', 'info'); return []; }
    pushToHistory();
    setStore('elements', list => [...list, ...created]);
    setStore('selection', created.map(c => c.id));
    showToast(`Offset path (${distance > 0 ? '+' : ''}${distance})`, 'success');
    return created.map(c => c.id);
};

// ── Path ops: Simplify, Make/Release Compound Path ──────────────────────────
// All operate on the (subpath, anchor) model. A "world subpath" carries anchors in
// absolute canvas coordinates; helpers normalize a set of them to a shared bbox.

type WorldSub = { anchors: PathAnchor[]; closed: boolean };

/** Ramer–Douglas–Peucker on a closed/open anchor ring (positions only). */
function rdpAnchors(anchors: PathAnchor[], eps: number): PathAnchor[] {
    if (anchors.length < 3) return anchors;
    const d2 = (p: PathAnchor, a: PathAnchor, b: PathAnchor) => {
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = dx * dx + dy * dy;
        if (len === 0) return Math.hypot(p.x - a.x, p.y - a.y);
        let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
    };
    const simplify = (pts: PathAnchor[]): PathAnchor[] => {
        if (pts.length < 3) return pts;
        let maxD = 0, idx = 0;
        for (let i = 1; i < pts.length - 1; i++) {
            const dist = d2(pts[i], pts[0], pts[pts.length - 1]);
            if (dist > maxD) { maxD = dist; idx = i; }
        }
        if (maxD > eps) {
            const left = simplify(pts.slice(0, idx + 1));
            const right = simplify(pts.slice(idx));
            return left.slice(0, -1).concat(right);
        }
        return [pts[0], pts[pts.length - 1]];
    };
    return simplify(anchors);
}

/** Normalize a set of world-space subpaths to their shared bbox (origin-relative). */
function normalizeWorldSubs(subs: WorldSub[]): { subpaths: PathSubpath[]; x: number; y: number; width: number; height: number } | null {
    const kept = subs.filter(s => s.anchors.length >= 2);
    if (kept.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of kept) for (const a of s.anchors) {
        for (const [px, py] of [[a.x, a.y], [a.x + (a.outX ?? 0), a.y + (a.outY ?? 0)], [a.x + (a.inX ?? 0), a.y + (a.inY ?? 0)]]) {
            minX = Math.min(minX, px); minY = Math.min(minY, py); maxX = Math.max(maxX, px); maxY = Math.max(maxY, py);
        }
    }
    if (!isFinite(minX)) return null;
    const subpaths: PathSubpath[] = kept.map(s => ({ closed: s.closed, anchors: s.anchors.map(a => ({ ...a, x: a.x - minX, y: a.y - minY })) }));
    return { subpaths, x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

/** Build a `path` element from normalized world subpaths (single → editable pathAnchors). */
function makePathFromWorldSubs(subs: WorldSub[], style: Partial<DrawingElement>): DrawingElement | null {
    const norm = normalizeWorldSubs(subs);
    if (!norm) return null;
    const single = norm.subpaths.length === 1;
    return {
        ...store.defaultElementStyles,
        id: generateId('path'),
        type: 'path',
        x: norm.x, y: norm.y, width: norm.width, height: norm.height,
        pathAnchors: single ? norm.subpaths[0].anchors : undefined,
        pathClosed: single ? norm.subpaths[0].closed : undefined,
        pathSubpaths: single ? undefined : norm.subpaths,
        angle: 0, seed: Math.floor(Math.random() * 2 ** 31), roundness: null,
        locked: false, link: null, layerId: store.activeLayerId,
        ...style,
    } as DrawingElement;
}

/** Element → its subpaths in WORLD coords (paths via getPathSubpaths, others via shapeToPath). */
function elementToWorldSubs(el: DrawingElement): WorldSub[] {
    const toWorld = (anchors: PathAnchor[], closed: boolean): WorldSub => ({
        closed, anchors: anchors.map(a => ({ ...a, x: el.x + a.x, y: el.y + a.y })),
    });
    if (el.type === 'path') return getPathSubpaths(el).map(sp => toWorld(sp.anchors, sp.closed));
    const r = shapeToPath(el);
    return r ? [toWorld(r.anchors, r.closed)] : [];
}

/**
 * Simplify: reduce the anchor count of each subpath via Ramer–Douglas–Peucker, keeping
 * the shape within a small tolerance. Useful after booleans/outline produce dense corners.
 */
export const simplifyPath = (ids: string[]): string[] => {
    const targets = store.elements.filter(e => ids.includes(e.id) && e.type === 'path');
    if (targets.length === 0) { showToast('Simplify: select a path', 'info'); return []; }
    let changed = false;
    pushToHistory();
    setStore('elements', list => list.map(el => {
        if (!targets.find(t => t.id === el.id)) return el;
        const eps = Math.max(1.2, Math.hypot(el.width, el.height) * 0.012);
        const subs = getPathSubpaths(el).map(sp => ({ closed: sp.closed, anchors: rdpAnchors(sp.anchors.map(a => ({ ...a })), eps) }));
        // Re-normalize in the element's own frame (origin unchanged → just replace anchors).
        const single = subs.length === 1;
        const before = getPathSubpaths(el).reduce((n, s) => n + s.anchors.length, 0);
        const after = subs.reduce((n, s) => n + s.anchors.length, 0);
        if (after < before) changed = true;
        return {
            ...el,
            pathAnchors: single ? subs[0].anchors : undefined,
            pathClosed: single ? subs[0].closed : undefined,
            pathSubpaths: single ? undefined : subs,
        } as DrawingElement;
    }));
    showToast(changed ? 'Simplified path' : 'Path already simple', changed ? 'success' : 'info');
    return targets.map(t => t.id);
};

/**
 * Join: connect the selected OPEN paths into a single path by chaining nearest endpoints
 * (each path's anchor list is appended, reversed if that end is closer). If the two free
 * ends meet, the result is closed. Closed paths are ignored.
 */
export const joinPaths = (ids: string[]): string[] => {
    const els = store.elements.filter(e => ids.includes(e.id) && e.type === 'path');
    // Gather open subpaths in world coords.
    const open: PathAnchor[][] = [];
    for (const el of els) for (const sub of elementToWorldSubs(el)) {
        if (!sub.closed && sub.anchors.length >= 2) open.push(sub.anchors);
    }
    if (open.length < 2) { showToast('Join: select 2+ open paths', 'info'); return []; }

    const endpt = (a: PathAnchor[], end: 0 | 1) => end === 0 ? a[0] : a[a.length - 1];
    const dist = (p: PathAnchor, q: PathAnchor) => Math.hypot(p.x - q.x, p.y - q.y);
    const rev = (a: PathAnchor[]): PathAnchor[] => a.slice().reverse().map(an => ({
        ...an,
        inX: an.outX, inY: an.outY, outX: an.inX, outY: an.inY, // swap handles on reverse
    }));

    // Greedy chain starting from the first path.
    let chain = open.shift()!;
    while (open.length) {
        const tail = endpt(chain, 1);
        let best = -1, bestRev = false, bestD = Infinity;
        for (let i = 0; i < open.length; i++) {
            const dStart = dist(tail, endpt(open[i], 0));
            const dEnd = dist(tail, endpt(open[i], 1));
            if (dStart < bestD) { bestD = dStart; best = i; bestRev = false; }
            if (dEnd < bestD) { bestD = dEnd; best = i; bestRev = true; }
        }
        const next = bestRev ? rev(open[best]) : open[best];
        open.splice(best, 1);
        // Merge coincident seam anchors: if the chain's tail meets next's head, keep one
        // anchor and adopt next's outgoing handle for a continuous curve.
        const tailA = chain[chain.length - 1];
        if (dist(tailA, next[0]) < 6) {
            tailA.outX = next[0].outX; tailA.outY = next[0].outY;
            chain = chain.concat(next.slice(1));
        } else {
            chain = chain.concat(next);
        }
    }

    // Close if the two free ends coincide (within a small tolerance).
    const closed = dist(endpt(chain, 0), endpt(chain, 1)) < 6;
    if (closed) chain = chain.slice(0, -1); // drop the duplicate closing anchor

    const base = els[0];
    const path = makePathFromWorldSubs([{ anchors: chain, closed }], {
        backgroundColor: base.backgroundColor, fillStyle: base.fillStyle,
        strokeColor: base.strokeColor, strokeWidth: base.strokeWidth, strokeStyle: base.strokeStyle,
        renderStyle: base.renderStyle, opacity: base.opacity, roughness: base.roughness, layerId: base.layerId,
    });
    if (!path) return [];
    pushToHistory();
    setStore('elements', list => [...list.filter(e => !ids.includes(e.id)), path]);
    setStore('selection', [path.id]);
    showToast(closed ? 'Joined paths (closed)' : 'Joined paths', 'success');
    return [path.id];
};

/**
 * Make Compound Path: combine the selected shapes/paths into ONE path with multiple
 * subpaths (even-odd fill), so overlapping regions become holes (donut, letter "O").
 */
export const makeCompoundPath = (ids: string[]): string[] => {
    const els = store.elements.filter(e => ids.includes(e.id));
    if (els.length < 2) { showToast('Make Compound: select 2+ shapes', 'info'); return []; }
    els.sort((a, b) => store.elements.indexOf(a) - store.elements.indexOf(b));
    const worldSubs = els.flatMap(elementToWorldSubs);
    if (worldSubs.length < 2) { showToast('Make Compound: need 2+ subpaths', 'info'); return []; }
    const base = els[0];
    const path = makePathFromWorldSubs(worldSubs, {
        backgroundColor: base.backgroundColor, fillStyle: base.fillStyle,
        strokeColor: base.strokeColor, strokeWidth: base.strokeWidth, strokeStyle: base.strokeStyle,
        renderStyle: base.renderStyle, opacity: base.opacity, roughness: base.roughness, layerId: base.layerId,
    });
    if (!path) return [];
    pushToHistory();
    setStore('elements', list => [...list.filter(e => !ids.includes(e.id)), path]);
    setStore('selection', [path.id]);
    showToast('Made compound path', 'success');
    return [path.id];
};

/**
 * Release Compound Path: split a compound path's subpaths into separate single-subpath
 * path elements (the inverse of Make Compound). Each released subpath is node-editable.
 */
export const releaseCompoundPath = (ids: string[]): string[] => {
    const targets = store.elements.filter(e => ids.includes(e.id) && e.type === 'path' && (e.pathSubpaths?.length ?? 0) > 1);
    if (targets.length === 0) { showToast('Release: select a compound path', 'info'); return []; }
    const created: DrawingElement[] = [];
    for (const el of targets) {
        for (const sp of getPathSubpaths(el)) {
            const worldSub: WorldSub = { closed: sp.closed, anchors: sp.anchors.map(a => ({ ...a, x: el.x + a.x, y: el.y + a.y })) };
            const path = makePathFromWorldSubs([worldSub], {
                backgroundColor: el.backgroundColor, fillStyle: el.fillStyle,
                strokeColor: el.strokeColor, strokeWidth: el.strokeWidth, strokeStyle: el.strokeStyle,
                renderStyle: el.renderStyle, opacity: el.opacity, roughness: el.roughness, layerId: el.layerId,
            });
            if (path) created.push(path);
        }
    }
    if (created.length === 0) return [];
    const releaseIds = new Set(targets.map(t => t.id));
    pushToHistory();
    setStore('elements', list => [...list.filter(e => !releaseIds.has(e.id)), ...created]);
    setStore('selection', created.map(c => c.id));
    showToast(`Released ${created.length} subpaths`, 'success');
    return created.map(c => c.id);
};

export const applyMindmapStyling = (rootId: string) => {
    const engine = new MindmapLayoutEngine();
    const tree = engine.buildTree(rootId, store.elements);
    if (!tree) return;

    pushToHistory();

    engine.applySemanticStyling(tree);

    const updates = engine.getUpdates(tree, store.elements);

    // Batch update elements
    const newElements = store.elements.map(el => {
        const update = updates.get(el.id);
        if (update) {
            return { ...el, ...update };
        }
        return el;
    });

    setStore("elements", newElements);

    // Refresh connectors after style changes
    for (const el of store.elements) {
        if ((el.type === 'organicBranch' || el.type === 'arrow' || el.type === 'line')
            && (el.startBinding || el.endBinding)) {
            refreshBoundLine(el.id, () => store.elements, (id, upd) => updateElement(id, upd, false));
        }
    }

    showToast(`Semantic styling applied to branch`, 'success');
};

// --- Transient Element Cleanup (Ink Overlay) ---
let inkCleanupIntervalId: ReturnType<typeof setInterval> | null = null;

export function startInkCleanupIfNeeded() {
    if (inkCleanupIntervalId !== null) return;

    inkCleanupIntervalId = setInterval(() => {
        const now = Date.now();
        const expiredIds = store.elements
            .filter(el => el.ttl && now > el.ttl)
            .map(el => el.id);

        if (expiredIds.length > 0) {
            setStore("elements", (elements) =>
                elements.filter(el => !expiredIds.includes(el.id))
            );
        }

        // Stop interval when no more TTL elements exist
        if (!store.elements.some(el => el.ttl)) {
            clearInterval(inkCleanupIntervalId!);
            inkCleanupIntervalId = null;
        }
    }, 500);
}
export const renameElement = (oldId: string, newId: string) => {
    if (!newId || oldId === newId) return;
    if (store.elements.some(e => e.id === newId)) {
        showToast("ID already exists", "error");
        return;
    }

    pushToHistory();

    setStore("elements", (els) => els.map(el => {
        // Update the element itself
        if (el.id === oldId) {
            return { ...el, id: newId };
        }

        // Update references in other elements
        let changes: Partial<DrawingElement> = {};

        if (el.parentId === oldId) changes.parentId = newId;
        if (el.orbitCenterId === oldId) changes.orbitCenterId = newId;

        if (el.startBinding?.elementId === oldId) {
            changes.startBinding = { ...el.startBinding, elementId: newId };
        }
        if (el.endBinding?.elementId === oldId) {
            changes.endBinding = { ...el.endBinding, elementId: newId };
        }

        if (Object.keys(changes).length > 0) {
            return { ...el, ...changes };
        }

        return el;
    }));

    // Update selection if selected
    if (store.selection.includes(oldId)) {
        setStore("selection", (ids) => ids.map(id => id === oldId ? newId : id));
    }
};
