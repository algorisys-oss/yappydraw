import { batch } from "solid-js";
import { createStore } from "solid-js/store";
import type { DrawingElement, ViewState, ToolType, Layer, GridSettings, AppMode, ElementType } from "../types";
import { createDefaultSlide, createSlideDocument, DEFAULT_SLIDE_TRANSITION } from '../types/slide-types';
import type { Slide, GlobalSettings, SlideTransition } from '../types/slide-types';
import type { ElementAnimation, DisplayState } from "../types/motion-types";
import { showToast } from "../components/toast";
import { MindmapLayoutEngine, type LayoutDirection, getBranchInfo } from "../utils/mindmap-layout";
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

export const addChildNode = (parentId: string) => {
    const parent = store.elements.find(e => e.id === parentId);
    if (!parent) return;

    pushToHistory();
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

    setStore("selection", [newId]);
    return newId;
};

export const addSiblingNode = (siblingId: string) => {
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
    return newId;
};

export const toggleCollapseSelection = () => {
    if (store.selection.length === 0) return;
    pushToHistory();
    setStore('elements',
        el => store.selection.includes(el.id),
        el => ({ isCollapsed: !el.isCollapsed })
    );
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
    setStore("elements", (els) => els.filter(el => !ids.includes(el.id)));
    setStore("selection", []); // Clear selection
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
    }
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
    }
};

export const setParent = (childId: string, parentId: string | null) => {
    updateElement(childId, { parentId }, true);
};

export const clearParent = (id: string) => {
    updateElement(id, { parentId: null }, true);
};
export const reorderMindmap = (rootId: string, direction: LayoutDirection) => {
    const engine = new MindmapLayoutEngine();
    const tree = engine.buildTree(rootId, store.elements);
    if (!tree) return;

    pushToHistory();

    if (direction.startsWith('horizontal')) {
        engine.layoutHorizontal(tree, direction === 'horizontal-right' ? 'right' : 'left');
    } else if (direction.startsWith('vertical')) {
        engine.layoutVertical(tree, direction === 'vertical-down' ? 'down' : 'up');
    } else if (direction === 'radial') {
        engine.layoutRadial(tree);
    }

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

    // Refresh all bound connectors after layout repositioning
    for (const el of store.elements) {
        if ((el.type === 'organicBranch' || el.type === 'arrow' || el.type === 'line')
            && (el.startBinding || el.endBinding)) {
            refreshBoundLine(el.id, () => store.elements, (id, upd) => updateElement(id, upd, false));
        }
    }

    showToast(`Mindmap layout updated (${direction})`, 'success');
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
