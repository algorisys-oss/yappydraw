import { batch } from "solid-js";
import { createStore } from "solid-js/store";
// Dockable-panel system (Phase D): migrated panels are toggled through the dock store so the
// existing toolbar/menu/hotkey/API entry points keep working. dock-layout has no app-store import,
// so this one-way edge introduces no cycle.
import { setPanelOpen, isPanelOpen } from "./dock-layout";
import type { DrawingElement, ViewState, ToolType, Layer, GridSettings, AppMode, ElementType, Guide } from "../types";
import { createDefaultSlide, createSlideDocument, DEFAULT_SLIDE_TRANSITION } from '../types/slide-types';
import type { Slide, GlobalSettings, SlideTransition, DocType } from '../types/slide-types';
import { isPagedDocType } from '../types/slide-types';
import { idbDelete } from '../storage/idb-kv';
import type { ElementAnimation, DisplayState, PropertyTrack } from "../types/motion-types";
import type { DimensionAnnotation, DimensionMeasure } from "../utils/dimension-geometry";
import { showToast } from "../components/toast";
import { MindmapLayoutEngine, type LayoutDirection, type OutlineNode, getBranchInfo } from "../utils/mindmap-layout";
import { runBooleanOp, polyToPathSubpaths, polyToSmoothSubpaths, computeShapeFaces, unionFaces, elementToMultiPolygon, splitMultiPolyByLine, pointInMultiPoly, diskRing, unionPolys, subtractPolys, polysIntersect, type BooleanOp, type Poly, type ShapeFace } from "../utils/path-boolean";
import { distortPoly, type DistortKind } from "../utils/path-distort";
import { catmullRomAnchors } from "../utils/curve-fit";
import { measureVerticalText, measureMaxLineWidth, measureWrappedTextHeight } from "../utils/text-utils";
import { shapeToPath } from "../utils/shape-to-path";
import { normalizePoints } from "../utils/render-element";
import { textElementToOutline } from "../utils/text-to-outlines";
import { getPathSubpaths, PathUtils } from "../utils/math/path-utils";
import { getShapeGeometry } from "../utils/shape-geometry";
import { rasterizeWarpedImage } from "../utils/image-warp";
import { traceImageData, traceImageDataColor, traceImageCenterline } from "../utils/image-trace";
import type { PathAnchor, PathSubpath, PaintFill, PaintStroke, SymbolDef, Artboard, MeshGradient, GraphicStyle, Swatch, PatternFill, PatternType, PatternSwatch, TransformEffect, Extrude3D, Turntable } from "../types";
import { applyTurntable } from "../utils/turntable";
import { transformCopy, effectiveCopies } from "../utils/transform-effect";
import { extrudeGeometry } from "../utils/extrude";
import { elementPathSample, sampleAt } from "../library/stick-figures/anim/path-follow";
import { defaultMesh, resizeMesh, meshIndex, meshPoints, constrainNodePos, parseHex, rgbToHex } from "../utils/mesh-gradient";
import { defaultPatternFill } from "../utils/pattern-fill";
import { captureElementsToDataURL } from "../utils/pattern-capture";
import { isSolidColor, shiftHexHue, adjustHexLightness, adjustHexSaturation } from "../utils/color-adjust";
import { getStyleSnapshot } from "../utils/object-context-actions";
import { computeOutlineStroke, computeOffsetPath } from "../utils/path-offset";
import { scalePoints, scalePathAnchors, scalePathSubpaths, scaleEraseStrokes } from "../utils/geometry-scale";
import { defaultWarpGrid, getWarpGrid, warpPresetGrid, silhouetteWarpGrid, type WarpPreset } from "../utils/envelope-warp";
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
    docType: DocType;

    // Remaining Global State
    selectedTool: ToolType;
    toolLocked: boolean; // When true, tool stays active after drawing
    selection: string[]; // IDs of selected elements
    defaultElementStyles: Partial<DrawingElement>; // Styles for new elements
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    globalSettings: GlobalSettings;
    showCanvasProperties: boolean;
    outlineView: boolean;
    trimView: boolean;
    undoStackLength: number;
    redoStackLength: number;
    isDirty: boolean; // True when document has unsaved changes
    flowTick: number; // For forcing redraws on flow animations
    /** Pen/vector-path "Clock Method" constrain: when on, Bézier handles snap to
     *  45°/90° increments during creation and editing. Acts as a keyboard-free
     *  stand-in for holding Shift (tablet parity). Also triggered live by Shift or
     *  the Procreate-style second-finger contact. */
    penConstrain: boolean;
    // Panel Visibility
    showPropertyPanel: boolean;
    showLayerPanel: boolean;
    showSymbolsPanel: boolean;
    /** Graphic Styles panel visibility (transient, not persisted). */
    showGraphicStylesPanel: boolean;
    /** Swatches panel visibility (transient, not persisted). */
    showSwatchesPanel: boolean;
    /** Brand Kit panel visibility (transient, not persisted). */
    showBrandKitPanel: boolean;
    /** Elements library panel visibility (transient, not persisted). */
    showElementsPanel: boolean;
    /** Stick-figure library panel visibility (transient, not persisted). */
    showStickFigurePanel: boolean;
    /** Scene Timeline (stick-figure animation director) visibility + playhead state. */
    showSceneTimeline: boolean;
    /** Keyframes dope-sheet (After-Effects–class property timeline) visibility. */
    showKeyframePanel: boolean;
    /** Scene playhead time in seconds (drives animated figures when the timeline is open). */
    storyTime: number;
    storyPlaying: boolean;
    storyLoop: boolean;
    storyDuration: number;
    /** Restart the scene playhead whenever the active slide/page changes. */
    storySyncSlides: boolean;
    /**
     * After-Effects–class absolute-time property tracks (Phase 0 spine). Evaluated
     * by `evaluateCompositionAt(storyTime)` and merged into the render-time
     * override map. Transient/authoring state for now — see `docs/after-effects-plan.md`.
     */
    compositionTracks: PropertyTrack[];
    /**
     * Persistent dimension annotations (precision-measurement plan, Phase 5). Each
     * attaches to an element and draws an auto-updating CAD-style dimension line.
     * Rendered as a world-space overlay; persisted with the document.
     */
    dimensionAnnotations: DimensionAnnotation[];
    /** Recolor Artwork panel visibility (transient, not persisted). */
    showRecolorPanel: boolean;
    /** Vector Tools palette visibility (persisted in localStorage). */
    showVectorToolsPanel: boolean;
    /** Measure-tool mode: drag on canvas to read distance + angle (transient). */
    measureActive: boolean;
    /** Shape Builder mode: drag across selected shapes to merge / Alt-drag to delete (transient). */
    shapeBuilderActive: boolean;
    /** Knife/Scissors cut mode: drag a line to slice shapes, click a path to split it (transient). */
    cutToolActive: boolean;
    /** Symbol Sprayer mode + the symbol it sprays (transient). */
    sprayerActive: boolean;
    sprayerSymbolId: string | null;
    /** Live Paint Bucket mode: click an enclosed region to fill it (transient). */
    livePaintActive: boolean;
    /** Width tool mode: drag on a path to vary its stroke width (transient). */
    widthToolActive: boolean;
    /** Touch Type mode: select & transform individual glyphs of a text element (transient). */
    touchTypeActive: boolean;
    /** Type on Path mode: click a line/curve to flow text along it (transient). */
    typeOnPathActive: boolean;
    /** Curvature tool mode: click points to draw a smooth curve through them (transient). */
    curveToolActive: boolean;
    /** Reshape tool mode: drag a path/segment to bend it while pinning endpoints (transient). */
    reshapeToolActive: boolean;
    /** Blob brush mode: paint filled strokes that union into one shape (transient). */
    blobBrushActive: boolean;
    /** Path eraser mode: drag along a path to erase a span of it (transient). */
    pathEraserActive: boolean;
    /** Puppet Warp mode: drop pins, drag one to deform with the others anchored (transient). */
    puppetWarpActive: boolean;
    /** Perspective Grid overlay visibility + settings (transient UI). */
    perspectiveGridActive: boolean;
    /** Slice tool mode: drag a rectangle to export that region as PNG (transient). */
    sliceToolActive: boolean;
    /** Symbolism brush mode + which transform it applies to symbol instances (transient). */
    symbolismActive: boolean;
    symbolismMode: 'sizer' | 'spinner' | 'shifter' | 'screener' | 'stainer' | 'styler';
    /** 2-point perspective grid geometry in WORLD coords (horizon + two vanishing points). */
    perspectiveGrid: { horizonY: number; leftVPx: number; rightVPx: number } | null;
    /** Undo-history panel visibility (transient, not persisted). */
    showHistoryPanel: boolean;
    /** Gradient-mesh on-canvas node editing mode (transient UI flag, not persisted). */
    meshEditActive: boolean;
    /** Artboard currently selected on-canvas for move/resize/delete (transient, not persisted). */
    activeArtboardId: string | null;
    /** Active symbol edit-in-place session (transient, not persisted). */
    symbolEdit: { symbolId: string; groupId: string; name: string; x: number; y: number } | null;
    /** Active compound-shape edit-in-place session — operands exploded for editing (transient). */
    compoundEdit: { groupId: string; op: BooleanOp; style: Partial<DrawingElement>; original: DrawingElement } | null;
    /** Align to the key (last-selected) object instead of the selection bbox. */
    alignToKeyObject: boolean;
    /** Eyedropper mode: next canvas click copies that object's style to these targets. */
    eyedropper: { active: boolean; targets: string[] };
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
    // Time-lapse (process) recording — see docs/timelapse-spec.md
    timelapseRecording: boolean;
    activeTimelapseId: string | null;
    timelapseFrameCount: number;
    selectedTechnicalType: 'dfdProcess' | 'dfdDataStore' | 'isometricCube' | 'cylinder' | 'stateStart' | 'stateEnd' | 'stateSync' | 'activationBar' | 'externalEntity' | 'codeBlock';
    // State Morphing
    states: DisplayState[];
    activeStateId?: string;
    showStatePanel: boolean;
    // Reusable symbols (definitions referenced by 'symbolInstance' elements)
    symbols: SymbolDef[];
    artboards: Artboard[];
    // Reusable named appearances applied to objects in one click
    graphicStyles: GraphicStyle[];
    // Document-level named colours; objects link via fill/strokeSwatchId
    swatches: Swatch[];
    // Document-level reusable pattern swatches (named PatternFills)
    patterns: PatternSwatch[];
    showPatternsPanel: boolean;
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
    /** Locked crop aspect ratio (w/h) while dragging; null = freeform. */
    cropAspect: number | null;

    // Arcade (game mode)
    /** True while a game script is running (Play mode). */
    gameActive: boolean;
    /** The document's game script (persisted in SlideDocument.gameScript). */
    gameScript: string;
    /** How the game is authored: 'visual' (blocks → generated script) or 'code' (script is the source). */
    gameAuthoringMode: 'visual' | 'code';
    /** Visual builder: scene-level behaviors (persisted in SlideDocument.sceneBehaviors). */
    sceneBehaviors: import('../types').DrawingElement['behaviors'];
    /** Visual builder: declared game variables with starting values. */
    gameVars: { name: string; initial: number }[];
    /** Blueprint: owner-keyed exec-flow graphs ('' = scene, tag = sprite). Persisted in SlideDocument.blueprints. */
    blueprints: Record<string, import('../game/blueprint-types').Blueprint>;
    /** Visual builder: the floating Behaviors panel is open. */
    showBehaviorsPanel: boolean;
    /** Visual builder: the full-screen node-graph editor is open. */
    showGameGraph: boolean;
    /** Blueprint: the full-screen execution-flow editor is open. */
    showBlueprint: boolean;
    /** The Code (game script) view is open. */
    showGameScript: boolean;

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
    timelapseRecording: false,
    activeTimelapseId: null,
    timelapseFrameCount: 0,
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
            renderStyle: 'architectural',
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
        renderStyle: 'architectural',
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
        timelapseAutoRecord: (localStorage.getItem('timelapseAutoRecord') ?? '0') !== '0',
        timelapseCaptureWidth: parseInt(localStorage.getItem('timelapseCaptureWidth') ?? '1024', 10) || 1024,
        timelapseTargetDuration: parseInt(localStorage.getItem('timelapseTargetDuration') ?? '30', 10) || 30,
        historyDepth: parseInt(localStorage.getItem('historyDepth') ?? '50', 10) || 50,
        bleed: parseFloat(localStorage.getItem('bleed') ?? '0') || 0,
    },
    showCanvasProperties: false,
    outlineView: false,
    trimView: false,
    undoStackLength: 0,
    redoStackLength: 0,
    isDirty: false,
    penConstrain: false,
    showPropertyPanel: false,
    showLayerPanel: false,
    showSymbolsPanel: false,
    showGraphicStylesPanel: false,
    showSwatchesPanel: false,
    showBrandKitPanel: false,
    showElementsPanel: false,
    showStickFigurePanel: false,
    showSceneTimeline: false,
    showKeyframePanel: false,
    storyTime: 0,
    storyPlaying: false,
    storyLoop: true,
    storyDuration: 6,
    storySyncSlides: false,
    compositionTracks: [],
    dimensionAnnotations: [],
    showRecolorPanel: false,
    showVectorToolsPanel: false, // dead flag — Vector Tools panel state now lives in the persisted dock layout
    measureActive: false,
    shapeBuilderActive: false,
    cutToolActive: false,
    sprayerActive: false,
    sprayerSymbolId: null,
    livePaintActive: false,
    widthToolActive: false,
    touchTypeActive: false,
    typeOnPathActive: false,
    curveToolActive: false,
    reshapeToolActive: false,
    blobBrushActive: false,
    pathEraserActive: false,
    puppetWarpActive: false,
    perspectiveGridActive: false,
    perspectiveGrid: null,
    sliceToolActive: false,
    symbolismActive: false,
    symbolismMode: 'sizer',
    showHistoryPanel: false,
    meshEditActive: false,
    activeArtboardId: null,
    symbolEdit: null,
    compoundEdit: null,
    alignToKeyObject: false,
    eyedropper: { active: false, targets: [] },
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
    symbols: [],
    artboards: [],
    graphicStyles: [],
    swatches: [],
    patterns: [],
    showPatternsPanel: false,
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
    cropAspect: null,
    gameActive: false,
    gameScript: '',
    gameAuthoringMode: 'visual',
    sceneBehaviors: [],
    gameVars: [],
    blueprints: {},
    showBehaviorsPanel: false,
    showGameGraph: false,
    showBlueprint: false,
    showGameScript: false,
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
    symbols: SymbolDef[];
    artboards: Artboard[];
    graphicStyles: GraphicStyle[];
    swatches: Swatch[];
    patterns: PatternSwatch[];
    gridSettings: GridSettings;
    canvasBackgroundColor: string;
    docType: DocType;
    compositionTracks: PropertyTrack[];
    dimensionAnnotations: DimensionAnnotation[];
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
    symbols: store.symbols.map(s => ({ ...s, elements: s.elements.map(e => ({ ...e })) })),
    artboards: store.artboards.map(a => ({ ...a })),
    graphicStyles: store.graphicStyles.map(g => ({ ...g, style: { ...g.style } })),
    swatches: store.swatches.map(s => ({ ...s })),
    patterns: store.patterns.map(p => ({ ...p, fill: { ...p.fill } })),
    gridSettings: { ...store.gridSettings },
    canvasBackgroundColor: store.canvasBackgroundColor,
    docType: store.docType,
    compositionTracks: store.compositionTracks.map(t => ({ ...t, keys: t.keys.map(k => ({ ...k })) })),
    dimensionAnnotations: store.dimensionAnnotations.map(d => ({ ...d })),
});

const restoreSnapshot = (snapshot: HistorySnapshot) => {
    setStore("elements", snapshot.elements);
    setStore("layers", snapshot.layers);
    setStore("slides", snapshot.slides);
    setStore("states", snapshot.states);
    setStore("symbols", snapshot.symbols || []);
    setStore("artboards", snapshot.artboards || []);
    setStore("graphicStyles", snapshot.graphicStyles || []);
    setStore("patterns", snapshot.patterns || []);
    setStore("swatches", snapshot.swatches || []);
    setStore("gridSettings", snapshot.gridSettings);
    setStore("canvasBackgroundColor", snapshot.canvasBackgroundColor);
    setStore("docType", snapshot.docType);
    setStore("compositionTracks", snapshot.compositionTracks || []);
    setStore("dimensionAnnotations", snapshot.dimensionAnnotations || []);
    setStore("selection", []); // Clear selection to avoid stale IDs
};

export const pushToHistory = () => {
    undoStack.push(captureSnapshot());
    const maxDepth = Math.max(1, store.globalSettings.historyDepth ?? 50);
    while (undoStack.length > maxDepth) undoStack.shift();
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

export const toggleHistoryPanel = (visible?: boolean) => setPanelOpen('history', visible);

/** Toggle (or set) the pen/vector-path Clock-Method handle constrain. */
export const setPenConstrain = (on?: boolean) => setStore('penConstrain', v => on ?? !v);

/** History timeline for the panel: past states (oldest→newest), the current
 *  state, then redoable future states. Each entry carries its element count. */
export const getHistoryEntries = (): { index: number; count: number; isCurrent: boolean }[] => {
    const past = undoStack.map((s, i) => ({ index: i, count: s.elements.length, isCurrent: false }));
    const current = { index: undoStack.length, count: store.elements.length, isCurrent: true };
    const future = redoStack.slice().reverse().map((s, j) => ({ index: undoStack.length + 1 + j, count: s.elements.length, isCurrent: false }));
    return [...past, current, ...future];
};

/** Jump to a timeline index (see getHistoryEntries) by undo/redo-ing the delta. */
export const jumpToHistory = (targetIndex: number) => {
    const cur = undoStack.length;
    if (targetIndex < cur) { for (let k = 0; k < cur - targetIndex; k++) undo(); }
    else if (targetIndex > cur) { for (let k = 0; k < targetIndex - cur; k++) redo(); }
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

/**
 * Select every element on the canvas. Shared by the Ctrl/Cmd+A shortcut and the
 * context menu (the latter gives keyboard-less tablets a "Select all" path).
 */
export const selectAll = () => {
    setStore('selection', store.elements.map(el => el.id));
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
    // Drop dimension annotations and transform-parent links that referenced deleted elements.
    if (store.dimensionAnnotations.some(d => deletedSet.has(d.targetId))) {
        setStore("dimensionAnnotations", (list) => list.filter(d => !deletedSet.has(d.targetId)));
    }

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

    // Editing fill/stroke colour directly breaks the global-swatch link (unless
    // the swatch id is being set in the same patch, i.e. applySwatch).
    if ('backgroundColor' in updates && !('fillSwatchId' in updates)) updates = { ...updates, fillSwatchId: undefined };
    if ('strokeColor' in updates && !('strokeSwatchId' in updates)) updates = { ...updates, strokeSwatchId: undefined };

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
    // 0. Picking any tool exits the transient (blocking) overlay modes — otherwise their
    //    full-screen overlay keeps intercepting the canvas and the user feels stuck.
    exitAllToolModes();

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
        renderStyle: 'architectural',
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
    if (updates.timelapseAutoRecord !== undefined) {
        try { localStorage.setItem('timelapseAutoRecord', updates.timelapseAutoRecord ? '1' : '0'); } catch { /* ignore */ }
    }
    if (updates.timelapseCaptureWidth !== undefined) {
        try { localStorage.setItem('timelapseCaptureWidth', String(updates.timelapseCaptureWidth)); } catch { /* ignore */ }
    }
    if (updates.timelapseTargetDuration !== undefined) {
        try { localStorage.setItem('timelapseTargetDuration', String(updates.timelapseTargetDuration)); } catch { /* ignore */ }
    }
    if (updates.historyDepth !== undefined) {
        try { localStorage.setItem('historyDepth', String(updates.historyDepth)); } catch { /* ignore */ }
    }
    if (updates.bleed !== undefined) {
        try { localStorage.setItem('bleed', String(updates.bleed)); } catch { /* ignore */ }
    }
};

/** Set the print bleed margin (px) drawn around artboards; >0 also shows crop marks. */
export const setBleed = (px: number) => { updateGlobalSettings({ bleed: Math.max(0, px) }); bumpDirtyRevision(); };

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
    setStore('cropAspect', null);
};

export const exitCropMode = (apply: boolean) => {
    if (apply && store.cropModeElementId && store.cropRect) {
        pushToHistory();
        updateElement(store.cropModeElementId, { crop: { ...store.cropRect } });
    }
    setStore('cropModeElementId', null);
    setStore('cropRect', null);
    setStore('cropAspect', null);
};

/**
 * Lock the crop to an aspect ratio (w/h) and snap the crop rect to the largest
 * centered rect of that ratio. Pass null to unlock (freeform).
 */
export const setCropAspect = (ratio: number | null) => {
    setStore('cropAspect', ratio);
    if (ratio === null) return;
    const el = store.elements.find(e => e.id === store.cropModeElementId);
    if (!el) return;
    let w = el.width, h = w / ratio;
    if (h > el.height) { h = el.height; w = h * ratio; }
    setStore('cropRect', { x: (el.width - w) / 2, y: (el.height - h) / 2, width: w, height: h });
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

// --- Arcade (game mode) ---
export const setGameScript = (script: string) => {
    setStore('gameScript', script);
    bumpDirtyRevision(); // persists via autosave / save
};

/** Replace the scene-level behaviors (visual builder). */
export const setSceneBehaviors = (behaviors: import('../types').DrawingElement['behaviors']) => {
    setStore('sceneBehaviors', behaviors ?? []);
    bumpDirtyRevision();
};

export const toggleBehaviorsPanel = (visible?: boolean) =>
    setPanelOpen('behaviors', visible);

export const toggleGameGraph = (visible?: boolean) =>
    setStore('showGameGraph', v => visible ?? !v);

/** Set a behavior's graph-node position (persists on the behavior). */
export const setBehaviorGraphPos = (owner: string, behaviorId: string, pos: { x: number; y: number }) => {
    if (owner === '') {
        setStore('sceneBehaviors', bs => (bs ?? []).map(b => b.id === behaviorId ? { ...b, graphPos: pos } : b));
    } else {
        const idx = store.elements.findIndex(e => e.tag === owner);
        if (idx >= 0) setStore('elements', idx, 'behaviors', bs => (bs ?? []).map(b => b.id === behaviorId ? { ...b, graphPos: pos } : b));
    }
    bumpDirtyRevision();
};

/** Replace the declared game variables. */
export const setGameVars = (vars: { name: string; initial: number }[]) => {
    setStore('gameVars', vars);
    bumpDirtyRevision();
};

// --- Blueprint (execution-flow graph) ---
// Graphs are keyed by owner: '' = Scene, or a sprite's tag. An empty graph is
// pruned from the map so autosave/`blueprintsProduceCode` stay clean.
type BP = import('../game/blueprint-types').Blueprint;
const emptyGraph = (): BP => ({ nodes: [], edges: [] });
/** The graph for an owner ('' = scene), always a concrete object (never undefined). */
export const blueprintFor = (owner: string): BP => store.blueprints[owner] ?? emptyGraph();
const writeGraph = (owner: string, g: BP) => {
    if (!g.nodes.length && !g.edges.length) {
        if (store.blueprints[owner]) setStore('blueprints', reconcileOmit(owner));
    } else {
        setStore('blueprints', owner, { nodes: g.nodes, edges: g.edges });
    }
    bumpDirtyRevision();
};
/** Build a new blueprints map without `owner` (Solid can't delete a key in place). */
const reconcileOmit = (owner: string) => {
    const next: Record<string, BP> = {};
    for (const [k, v] of Object.entries(store.blueprints)) if (k !== owner) next[k] = v;
    return next;
};
/** Replace an owner's whole graph. */
export const setBlueprint = (owner: string, bp: BP) => writeGraph(owner, { nodes: bp.nodes ?? [], edges: bp.edges ?? [] });
/** Replace an owner's nodes. */
export const setBlueprintNodes = (owner: string, nodes: import('../game/blueprint-types').BPNode[]) =>
    writeGraph(owner, { nodes, edges: blueprintFor(owner).edges });
/** Replace an owner's edges. */
export const setBlueprintEdges = (owner: string, edges: import('../game/blueprint-types').BPEdge[]) =>
    writeGraph(owner, { nodes: blueprintFor(owner).nodes, edges });
/** Move one node (persists its position). */
export const setBlueprintNodePos = (owner: string, id: string, pos: { x: number; y: number }) => {
    const g = blueprintFor(owner);
    writeGraph(owner, { nodes: g.nodes.map(n => n.id === id ? { ...n, x: Math.round(pos.x), y: Math.round(pos.y) } : n), edges: g.edges });
};

export const toggleBlueprint = (visible?: boolean) =>
    setStore('showBlueprint', v => visible ?? !v);

export const toggleGameScript = (visible?: boolean) =>
    setStore('showGameScript', v => visible ?? !v);

/** Switch how the game is authored ('visual' blocks vs hand-written 'code'). */
export const setGameAuthoringMode = (mode: 'visual' | 'code') => {
    setStore('gameAuthoringMode', mode);
    bumpDirtyRevision();
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

    // Save current viewport state to the slide we are leaving (only in design mode).
    // Bounds-check the index: after a deleteSlide the old activeSlideIndex can be
    // out of range, and writing setStore("slides", staleIndex, …) would re-extend
    // the array (re-adding the slot we just removed).
    if (store.appMode === 'design' && store.activeSlideIndex >= 0 && store.activeSlideIndex < store.slides.length) {
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

/** "Page" in design documents, "Slide" in presentations. */
export const pageNoun = (): 'Page' | 'Slide' => store.docType === 'design' ? 'Page' : 'Slide';

/** Horizontal gap between paged frames on the spatial canvas. */
const PAGE_GAP = 80;

/** Spatial X to the right of a frame (size-aware so wide pages never overlap). */
const nextSpatialX = (slide?: Slide): number =>
    slide ? slide.spatialPosition.x + slide.dimensions.width + PAGE_GAP : 0;

/** New pages inherit the active page's dimensions in design docs (uniform page size). */
const newPageDimensions = (): { width: number, height: number } | undefined => {
    if (store.docType !== 'design') return undefined;
    const active = store.slides[store.activeSlideIndex] || store.slides[0];
    return active ? { ...active.dimensions } : undefined;
};

export const addSlide = () => {
    pushToHistory();
    saveActiveSlide();

    const nextIndex = store.slides.length;
    // Position new slide to the right of the last one
    const lastSlide = store.slides[store.slides.length - 1];
    const newX = nextSpatialX(lastSlide);

    const newSlide = createDefaultSlide(undefined, `${pageNoun()} ${nextIndex + 1}`, newX, 0, newPageDimensions());
    newSlide.order = nextIndex;

    setStore("slides", (prev) => [...prev, newSlide]);
    setActiveSlide(nextIndex);

    showToast(`${pageNoun()} added`, 'success');
};

export const insertNewSlide = (targetIndex: number, position: 'before' | 'after') => {
    pushToHistory();
    saveActiveSlide();

    // 1. Determine new slide position (Spatially always at the end to avoid collision)
    const sortedByX = [...store.slides].sort((a, b) => a.spatialPosition.x - b.spatialPosition.x);
    const lastSlide = sortedByX[sortedByX.length - 1];
    const newX = nextSpatialX(lastSlide);

    const insertionIndex = position === 'before' ? targetIndex : targetIndex + 1;

    // 2. Create and Insert
    const newSlide = createDefaultSlide(undefined, `${pageNoun()} ${store.slides.length + 1}`, newX, 0, newPageDimensions());

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
    showToast(`${pageNoun()} inserted`, 'success');
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
    const newX = nextSpatialX(lastSlide);
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

    showToast(`${pageNoun()} duplicated`, 'success');
};

export const deleteSlide = (index: number) => {
    if (store.slides.length <= 1) {
        showToast(`Cannot delete the last ${pageNoun().toLowerCase()}`, 'error');
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

    showToast(`${pageNoun()} deleted`, 'info');
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

/**
 * Detach a slide's background image into a regular image element covering the
 * page, so it can be moved/cropped/filtered like any other image. Clears the
 * slide's image fill (reverts to solid background).
 */
export const detachSlideBackgroundImage = (slideIndex: number = store.activeSlideIndex): string | null => {
    const slide = store.slides[slideIndex];
    if (!slide?.backgroundImage || slide.fillStyle !== 'image') return null;

    pushToHistory();
    const el: DrawingElement = {
        id: `image-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
        type: 'image',
        x: slide.spatialPosition.x, y: slide.spatialPosition.y,
        width: slide.dimensions.width, height: slide.dimensions.height,
        dataURL: slide.backgroundImage, status: 'loaded',
        backgroundColor: 'transparent', fillStyle: 'solid',
        strokeColor: 'transparent', strokeWidth: 0, strokeStyle: 'solid',
        opacity: slide.backgroundOpacity ?? 100, angle: 0, roughness: 0, renderStyle: 'architectural',
        locked: false, layerId: store.activeLayerId || 'default-layer',
        seed: Math.floor(Math.random() * 2 ** 31), roundness: null,
    } as DrawingElement;

    batch(() => {
        setStore('elements', prev => [...prev, el]);
        setStore('slides', slideIndex, { backgroundImage: undefined, fillStyle: 'solid' });
        setStore('selection', [el.id]);
    });
    bumpDirtyRevision();
    return el.id;
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
        setStore("symbols", JSON.parse(JSON.stringify(doc.symbols || [])));
        setStore("artboards", JSON.parse(JSON.stringify(doc.artboards || [])));
        setStore("dimensionAnnotations", JSON.parse(JSON.stringify(doc.dimensionAnnotations || [])));
        setStore("compositionTracks", JSON.parse(JSON.stringify(doc.compositionTracks || [])));
        setStore("graphicStyles", JSON.parse(JSON.stringify(doc.graphicStyles || [])));
        setStore("swatches", JSON.parse(JSON.stringify(doc.swatches || [])));
        setStore("patterns", JSON.parse(JSON.stringify(doc.patterns || [])));
        repairLibraryIds(); // heal duplicate ids from docs made before the id fix
        setStore("gridSettings", JSON.parse(JSON.stringify(gridSettings)));

        // Migrate old showMindmapToolbar -> showQuickToolbar
        const gs = doc.globalSettings || initialState.globalSettings;
        if (gs.showMindmapToolbar !== undefined && gs.showQuickToolbar === undefined) {
            gs.showQuickToolbar = gs.showMindmapToolbar;
            delete gs.showMindmapToolbar;
        }
        // App-level UI preferences are persisted in localStorage and must win over whatever
        // globalSettings the loaded document happens to carry — otherwise opening/auto-restoring
        // a doc reverts the toolbar orientation/wrap and pen prefs the user just set.
        try {
            const lsBool = (k: string, cur: any) => { const v = localStorage.getItem(k); return v === null ? cur : v !== '0'; };
            gs.toolbarVertical = lsBool('toolbarVertical', gs.toolbarVertical);
            const tw = localStorage.getItem('toolbarWrap'); if (tw !== null) (gs as any).toolbarWrap = tw === 'true' ? true : tw === 'false' ? false : Number(tw);
            gs.smartShape = lsBool('smartShape', gs.smartShape);
            gs.penPressure = lsBool('penPressure', gs.penPressure);
            const ps = localStorage.getItem('penStabilization'); if (ps !== null) gs.penStabilization = Number(ps);
        } catch { /* ignore */ }
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
        setStore("showSlideNavigator", isPagedDocType(loadedDocType));
        setStore("showSlideToolbar", true);
        setStore("showUtilityToolbar", false);

        setStore("activeSlideIndex", 0);
        setStore("selection", []);
        setStore("gameScript", typeof doc.gameScript === 'string' ? doc.gameScript : '');
        setStore("gameAuthoringMode", doc.gameAuthoringMode === 'code' ? 'code' : 'visual');
        setStore("sceneBehaviors", Array.isArray(doc.sceneBehaviors) ? doc.sceneBehaviors : []);
        setStore("gameVars", Array.isArray(doc.gameVars) ? doc.gameVars : []);
        // Blueprints: owner-keyed map; migrate a legacy single scene graph into blueprints[''].
        const loadedBlueprints: Record<string, import('../game/blueprint-types').Blueprint> = {};
        if (doc.blueprints && typeof doc.blueprints === 'object') {
            for (const [owner, g] of Object.entries(doc.blueprints)) {
                if (g && Array.isArray((g as any).nodes)) loadedBlueprints[owner] = { nodes: (g as any).nodes, edges: (g as any).edges ?? [] };
            }
        } else if (doc.blueprint && Array.isArray(doc.blueprint.nodes)) {
            loadedBlueprints[''] = { nodes: doc.blueprint.nodes, edges: doc.blueprint.edges ?? [] };
        }
        setStore("blueprints", loadedBlueprints);
        setStore("gameActive", false);

        // Apply first slide's explicit background if set (overrides theme default)
        const firstSlideBg = slides.length > 0 ? slides[0].backgroundColor : '';
        if (firstSlideBg) {
            setStore("canvasBackgroundColor", firstSlideBg);
        }
        // Apply first slide's canvas texture (or reset to 'none' if unset)
        setStore("canvasTexture", slides[0]?.canvasTexture ?? 'none');
        // Sync canvas dimensions with the first slide — saveActiveSlide writes
        // store.dimensions back into the slide, so a stale value here would
        // silently overwrite the loaded page size on the first slide action.
        if (slides[0]?.dimensions) {
            setStore("dimensions", { ...slides[0].dimensions });
        }

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

export const setDocType = (type: DocType) => {
    batch(() => {
        setStore("docType", type);
        setStore("showSlideNavigator", isPagedDocType(type));
    });
};

/**
 * Resize pages in a design document. Applies to the active page, or all pages
 * when `applyAll` is true. Pages are re-laid-out spatially afterwards so
 * resized frames never overlap their neighbours.
 */
export const setPageSize = (width: number, height: number, applyAll: boolean = true) => {
    if (!isPagedDocType(store.docType)) return;
    const w = Math.max(16, Math.round(width));
    const h = Math.max(16, Math.round(height));

    pushToHistory();

    const ordered = store.slides.map(s => ({ ...s, dimensions: { ...s.dimensions }, spatialPosition: { ...s.spatialPosition } }));
    ordered.forEach((s, i) => {
        if (applyAll || i === store.activeSlideIndex) {
            s.dimensions = { width: w, height: h };
        }
    });
    // Re-layout left-to-right in order with a fixed gap
    let x = 0;
    ordered.forEach(s => {
        s.spatialPosition = { x, y: s.spatialPosition.y };
        // Invalidate any saved viewport for the old position
        s.lastViewState = undefined;
        x += s.dimensions.width + 80;
    });

    batch(() => {
        setStore("slides", ordered);
        const active = ordered[store.activeSlideIndex];
        if (active) {
            setStore("dimensions", { ...active.dimensions });
        }
    });
    zoomToFitSlide();
    bumpDirtyRevision();
};

// --- State Morphing Actions ---

export const toggleStatePanel = (visible?: boolean) => {
    setPanelOpen('state', visible);
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

export const resetToNewDocument = (docType: DocType = 'slides', pageSize?: { width: number, height: number }) => {
    const doc = createSlideDocument('Untitled', docType, pageSize);
    loadDocument(doc);
    // Clear auto-save data (inline to avoid circular import with storage/auto-save)
    try { localStorage.removeItem('yappy:autosave'); localStorage.removeItem('yappy:autosave:meta'); } catch {}
    void idbDelete('yappy:autosave');
    setStore("isDirty", false);
    setStore("welcomeDismissed", true);
    setStore("showSlideToolbar", true);
    setStore("showUtilityToolbar", false);
    // Default to 100% zoom for new documents, centered on the first slide.
    // Design pages are often taller/wider than the window (stories, posters,
    // A4) — fit the page in view instead so the user sees the whole frame.
    setTimeout(() => {
        if (docType === 'design') {
            zoomToFitSlide();
            return;
        }
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
    showToast(`New ${docType === 'slides' ? 'presentation' : docType === 'design' ? 'design' : 'sketch'} created`, 'info');
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
export const makeClippingMask = (maskType: 'clip' | 'opacity' = 'clip') => {
    const sel = [...store.selection];
    if (sel.length < 2) { showToast('Mask: select 2+ objects', 'info'); return; }
    const idxOf = (id: string) => store.elements.findIndex(e => e.id === id);
    let maskId = sel[0];
    for (const id of sel) if (idxOf(id) > idxOf(maskId)) maskId = id; // topmost in z-order
    const clippedIds = sel.filter(id => id !== maskId);
    if (clippedIds.length === 0) return;
    pushToHistory();
    const groupId = generateId('clip');
    setStore('elements', (e: DrawingElement) => sel.includes(e.id), 'groupIds', (ids: string[] | undefined) => [...(ids || []), groupId]);
    setStore('elements', (e: DrawingElement) => e.id === maskId, 'isClipMask', () => true);
    setStore('elements', (e: DrawingElement) => clippedIds.includes(e.id), () => ({ clipMaskId: maskId, maskType }));
    setStore('selection', clippedIds);
    bumpDirtyRevision();
    showToast(maskType === 'opacity' ? 'Opacity mask created' : 'Clipping mask created', 'success');
};

/** Make an opacity (luminance) mask — the top object's brightness becomes the others' alpha. */
export const makeOpacityMask = () => makeClippingMask('opacity');

// ── Artboards (named export regions) ─────────────────────────────────────────

export const ARTBOARD_PRESETS: Record<string, [number, number]> = {
    'Square 1080': [1080, 1080], 'A4 Portrait': [794, 1123], 'A4 Landscape': [1123, 794],
    'Instagram Story': [1080, 1920], 'Web 1280': [1280, 800], 'Slide 16:9': [1920, 1080],
};

/** Add an artboard (preset size, or 'selection' to fit the current selection's bounds). */
export const addArtboard = (preset?: string, x?: number, y?: number): string => {
    let w = 1080, h = 1080;
    if (preset === 'selection' && store.selection.length) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const e of store.elements) if (store.selection.includes(e.id)) { minX = Math.min(minX, e.x); minY = Math.min(minY, e.y); maxX = Math.max(maxX, e.x + e.width); maxY = Math.max(maxY, e.y + e.height); }
        x = minX - 20; y = minY - 20; w = (maxX - minX) + 40; h = (maxY - minY) + 40;
    } else if (preset && ARTBOARD_PRESETS[preset]) { [w, h] = ARTBOARD_PRESETS[preset]; }
    const ax = x ?? (store.artboards.length ? Math.max(...store.artboards.map(a => a.x + a.width)) + 40 : 0);
    const ay = y ?? 0;
    const ab: Artboard = { id: generateId('ab' as any), name: (preset && preset !== 'selection' ? preset : `Artboard ${store.artboards.length + 1}`), x: ax, y: ay, width: Math.max(1, w), height: Math.max(1, h), background: '#ffffff' };
    pushToHistory();
    setStore('artboards', list => [...list, ab]);
    bumpDirtyRevision();
    showToast(`Artboard added (${Math.round(ab.width)}×${Math.round(ab.height)})`, 'success');
    return ab.id;
};

export const setActiveArtboard = (id: string | null) => setStore('activeArtboardId', id);
export const deleteArtboard = (id: string) => { pushToHistory(); setStore('artboards', list => list.filter(a => a.id !== id)); if (store.activeArtboardId === id) setStore('activeArtboardId', null); bumpDirtyRevision(); };
export const renameArtboard = (id: string, name: string) => { setStore('artboards', (a: Artboard) => a.id === id, 'name', () => name); bumpDirtyRevision(); };
export const updateArtboard = (id: string, patch: Partial<Artboard>) => { pushToHistory(); setStore('artboards', (a: Artboard) => a.id === id, () => patch); bumpDirtyRevision(); };
/** Live (no-history) artboard rect update — for drag/resize gestures. Call
 *  pushToHistory() once at the start of the gesture, then this on each move. */
export const updateArtboardLive = (id: string, patch: Partial<Artboard>) => { setStore('artboards', (a: Artboard) => a.id === id, () => patch); bumpDirtyRevision(); };

/**
 * Rearrange All Artboards (Illustrator's grid layout). Lays every artboard out
 * left-to-right, top-to-bottom in `columns` columns (auto ≈ √n when omitted),
 * separated by `gap`. Each row's height is the tallest artboard in it. Artboards
 * are export-region markers, so this only moves the frames, not the artwork.
 */
export const rearrangeArtboards = (columns = 0, gap = 40) => {
    const list = store.artboards;
    if (list.length === 0) return;
    const cols = Math.max(1, columns > 0 ? Math.floor(columns) : Math.ceil(Math.sqrt(list.length)));
    pushToHistory();
    let rowY = 0;
    for (let start = 0; start < list.length; start += cols) {
        const row = list.slice(start, start + cols);
        let colX = 0, rowH = 0;
        for (const ab of row) {
            const id = ab.id, x = colX, y = rowY;
            setStore('artboards', (a: Artboard) => a.id === id, () => ({ x, y }));
            colX += ab.width + gap;
            rowH = Math.max(rowH, ab.height);
        }
        rowY += rowH + gap;
    }
    bumpDirtyRevision();
    showToast(`Arranged ${list.length} artboard${list.length === 1 ? '' : 's'} in ${cols} column${cols === 1 ? '' : 's'}`, 'success');
};

/**
 * Duplicate an artboard and the artwork sitting on it, placed to the right
 * (Illustrator's Alt-drag with the artboard tool). Returns the new artboard id.
 */
export const duplicateArtboard = (id?: string, gap = 40): string | null => {
    const src = store.artboards.find(a => a.id === (id ?? store.activeArtboardId ?? store.artboards[0]?.id));
    if (!src) { showToast('No artboard to duplicate', 'error'); return null; }
    const dx = src.width + gap, dy = 0;
    const newAb: Artboard = { ...src, id: generateId('ab' as any), name: `${src.name} copy`, x: src.x + dx, y: src.y + dy };
    // Clone the elements whose centre lies within the source artboard.
    const inside = store.elements.filter(e => {
        const cx = e.x + e.width / 2, cy = e.y + e.height / 2;
        return cx >= src.x && cx <= src.x + src.width && cy >= src.y && cy <= src.y + src.height;
    });
    const batchIds = new Set<string>(store.elements.map(e => e.id));
    const clones = inside.map(e => {
        const nid = generateId(e.type, batchIds); batchIds.add(nid);
        return { ...JSON.parse(JSON.stringify(e)), id: nid, x: e.x + dx, y: e.y + dy } as DrawingElement;
    });
    pushToHistory();
    setStore('artboards', list => [...list, newAb]);
    if (clones.length) setStore('elements', list => [...list, ...clones]);
    setStore('activeArtboardId', newAb.id);
    bumpDirtyRevision();
    showToast(`Duplicated artboard (+${clones.length} object${clones.length === 1 ? '' : 's'})`, 'success');
    return newAb.id;
};

/**
 * Fit an artboard to its artwork bounds (Illustrator's "Fit to Artwork Bounds"
 * preset). Resizes the artboard to the bbox of the elements on it, plus padding.
 */
export const fitArtboardToArtwork = (id?: string, pad = 20): boolean => {
    const ab = store.artboards.find(a => a.id === (id ?? store.activeArtboardId ?? store.artboards[0]?.id));
    if (!ab) { showToast('No artboard selected', 'error'); return false; }
    const inside = store.elements.filter(e => {
        const cx = e.x + e.width / 2, cy = e.y + e.height / 2;
        return cx >= ab.x && cx <= ab.x + ab.width && cy >= ab.y && cy <= ab.y + ab.height;
    });
    if (inside.length === 0) { showToast('Artboard has no artwork to fit', 'info'); return false; }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const e of inside) {
        minX = Math.min(minX, e.x, e.x + e.width); minY = Math.min(minY, e.y, e.y + e.height);
        maxX = Math.max(maxX, e.x, e.x + e.width); maxY = Math.max(maxY, e.y, e.y + e.height);
    }
    pushToHistory();
    setStore('artboards', (a: Artboard) => a.id === ab.id, () => ({
        x: minX - pad, y: minY - pad, width: (maxX - minX) + pad * 2, height: (maxY - minY) + pad * 2,
    }));
    bumpDirtyRevision();
    showToast('Artboard fit to artwork', 'success');
    return true;
};

/**
 * Convert to Shape (Illustrator effect): replace each selected element with a
 * rectangle, rounded rectangle, or ellipse sized to its bounding box, keeping the
 * element's style. Destructive (geometry is baked).
 */
export const convertToShape = (ids: string[], shape: 'rectangle' | 'rounded' | 'ellipse', radius = 20): string[] => {
    const targets = store.elements.filter(e => ids.includes(e.id));
    if (targets.length === 0) { showToast('Convert to Shape: select an object', 'info'); return []; }
    pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id), () => ({
        type: shape === 'ellipse' ? 'circle' : 'rectangle',
        roundness: shape === 'rounded' ? radius : null,
        borderRadius: shape === 'rounded' ? radius : undefined,
        // Drop any path/point geometry so the element renders as the new primitive.
        pathAnchors: undefined, pathSubpaths: undefined, pathClosed: undefined, points: undefined,
        starPoints: undefined, polygonSides: undefined, burstPoints: undefined,
    } as Partial<DrawingElement>));
    bumpDirtyRevision();
    showToast(`Converted to ${shape}`, 'success');
    return targets.map(t => t.id);
};

/**
 * Split Into Grid (Object › Path › Split Into Grid): replace a rectangle with an
 * rows×cols grid of smaller rectangles. Returns the new cell ids.
 */
export const splitIntoGrid = (id: string, rows = 4, cols = 4, gap = 0): string[] => {
    const src = store.elements.find(e => e.id === id) ?? store.elements.find(e => store.selection.includes(e.id));
    if (!src) { showToast('Split Into Grid: select a shape', 'info'); return []; }
    const r = Math.max(1, Math.floor(rows)), c = Math.max(1, Math.floor(cols));
    const cellW = (src.width - gap * (c - 1)) / c;
    const cellH = (src.height - gap * (r - 1)) / r;
    if (cellW <= 0 || cellH <= 0) { showToast('Grid too fine for this shape', 'error'); return []; }
    const batchIds = new Set<string>(store.elements.map(e => e.id));
    const cells: DrawingElement[] = [];
    for (let ri = 0; ri < r; ri++) for (let ci = 0; ci < c; ci++) {
        const nid = generateId(src.type, batchIds); batchIds.add(nid);
        cells.push({
            ...JSON.parse(JSON.stringify(src)),
            id: nid, type: 'rectangle',
            x: src.x + ci * (cellW + gap), y: src.y + ri * (cellH + gap),
            width: cellW, height: cellH,
            pathAnchors: undefined, pathSubpaths: undefined, pathClosed: undefined, points: undefined,
        } as DrawingElement);
    }
    pushToHistory();
    setStore('elements', list => [...list.filter(e => e.id !== src.id), ...cells]);
    setStore('selection', cells.map(c => c.id));
    bumpDirtyRevision();
    showToast(`Split into ${r}×${c} grid`, 'success');
    return cells.map(c => c.id);
};

/**
 * Convert the selected shapes to ruler guides (Illustrator's Cmd+5): drops a
 * horizontal + vertical guide at each element's bounding edges, then removes the
 * shapes. Returns the new guide ids.
 */
export const convertToGuides = (ids?: string[]): string[] => {
    const sel = ids ?? [...store.selection];
    const targets = store.elements.filter(e => sel.includes(e.id));
    if (targets.length === 0) { showToast('Convert to Guides: select shapes', 'info'); return []; }
    pushToHistory();
    const guideIds: string[] = [];
    const seenV = new Set<number>(), seenH = new Set<number>();
    for (const e of targets) {
        for (const x of [Math.round(e.x), Math.round(e.x + e.width)]) {
            if (seenV.has(x)) continue; seenV.add(x);
            const id = generateId('guide'); guideIds.push(id);
            setStore('guides', g => [...g, { id, axis: 'v' as const, pos: x }]);
        }
        for (const y of [Math.round(e.y), Math.round(e.y + e.height)]) {
            if (seenH.has(y)) continue; seenH.add(y);
            const id = generateId('guide'); guideIds.push(id);
            setStore('guides', g => [...g, { id, axis: 'h' as const, pos: y }]);
        }
    }
    deleteElements(targets.map(t => t.id));
    showToast(`Converted to ${guideIds.length} guides`, 'success');
    return guideIds;
};

/** Toggle printer crop marks at each selected element's corners (Crop Marks effect). */
export const toggleObjectCropMarks = (ids?: string[], on?: boolean) => {
    const sel = ids ?? [...store.selection];
    if (sel.length === 0) return;
    const cur = store.elements.find(e => sel.includes(e.id))?.objectCropMarks;
    const next = on ?? !cur;
    pushToHistory();
    setStore('elements', (e: DrawingElement) => sel.includes(e.id), () => ({ objectCropMarks: next }));
    bumpDirtyRevision();
    showToast(next ? 'Crop marks on' : 'Crop marks off', 'info');
};

/** Outline (wireframe) view — render path outlines only, no fills (View > Outline). */
export const toggleOutlineView = (on?: boolean) => {
    const next = on ?? !store.outlineView;
    setStore('outlineView', next);
    bumpDirtyRevision();
    showToast(next ? 'Outline view on' : 'Outline view off', 'info');
};

/** Trim View — temporarily hide everything outside the artboards (View > Trim View). */
export const toggleTrimView = (on?: boolean) => {
    const next = on ?? !store.trimView;
    if (next && (!store.artboards || store.artboards.length === 0)) {
        showToast('Trim View needs at least one artboard', 'error');
        return;
    }
    setStore('trimView', next);
    bumpDirtyRevision();
    showToast(next ? 'Trim view on' : 'Trim view off', 'info');
};

/** Swap each selected element's fill and stroke colours (Illustrator Shift+X). */
export const swapFillStroke = (ids?: string[]) => {
    const targets = ids ?? [...store.selection];
    if (targets.length === 0) return;
    pushToHistory();
    setStore('elements', (e: DrawingElement) => targets.includes(e.id), (e) => ({
        backgroundColor: e.strokeColor,
        strokeColor: e.backgroundColor,
    }));
    bumpDirtyRevision();
};

/**
 * Object > Path > Clean Up — delete stray points, empty text frames and
 * unpainted objects (no fill AND no stroke). Returns the number removed.
 */
export const cleanUpElements = (): number => {
    const isUnpainted = (e: DrawingElement) => {
        const noFill = !e.backgroundColor || e.backgroundColor === 'transparent' || e.backgroundColor === 'none';
        const noStroke = !e.strokeColor || e.strokeColor === 'transparent' || e.strokeColor === 'none' || (e.strokeWidth ?? 0) <= 0;
        const noImage = !e.backgroundImage;
        const noText = !(e.containerText && e.containerText.trim()) && !(e.text && String(e.text).trim());
        return noFill && noStroke && noImage && noText;
    };
    const isEmptyText = (e: DrawingElement) =>
        e.type === 'text' && !(e.containerText && e.containerText.trim()) && !(e.text && String(e.text).trim());
    const isStray = (e: DrawingElement) =>
        (Math.abs(e.width) < 0.5 && Math.abs(e.height) < 0.5) ||
        ((e.type === 'path' || e.type === 'polyline') && (!e.points || e.points.length < 4));

    const doomed = store.elements.filter(e =>
        !e.locked && (isEmptyText(e) || isStray(e) || isUnpainted(e)),
    ).map(e => e.id);
    if (doomed.length === 0) { showToast('Nothing to clean up', 'info'); return 0; }
    deleteElements(doomed);
    showToast(`Cleaned up ${doomed.length} stray object${doomed.length === 1 ? '' : 's'}`, 'success');
    return doomed.length;
};

/** Delete swatches not referenced by any element. Returns the number removed. */
export const deleteUnusedSwatches = (): number => {
    const used = new Set<string>();
    for (const e of store.elements) {
        if (e.fillSwatchId) used.add(e.fillSwatchId);
        if (e.strokeSwatchId) used.add(e.strokeSwatchId);
    }
    const unused = store.swatches.filter(s => !used.has(s.id));
    if (unused.length === 0) { showToast('No unused swatches', 'info'); return 0; }
    pushToHistory();
    setStore('swatches', list => list.filter(s => used.has(s.id)));
    showToast(`Removed ${unused.length} unused swatch${unused.length === 1 ? '' : 'es'}`, 'success');
    return unused.length;
};

/**
 * Paste the current selection onto every other artboard at the same position
 * relative to the artboard the selection currently sits on (Edit > Paste on All
 * Artboards). Returns the number of copies created.
 */
export const pasteOnAllArtboards = (): number => {
    const sel = store.elements.filter(e => store.selection.includes(e.id));
    if (sel.length === 0 || store.artboards.length < 2) {
        showToast('Need a selection and ≥2 artboards', 'error');
        return 0;
    }
    // Selection centre → the artboard it belongs to (else the first artboard).
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const e of sel) { minX = Math.min(minX, e.x); minY = Math.min(minY, e.y); maxX = Math.max(maxX, e.x + e.width); maxY = Math.max(maxY, e.y + e.height); }
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const home = store.artboards.find(a => cx >= a.x && cx <= a.x + a.width && cy >= a.y && cy <= a.y + a.height) ?? store.artboards[0];

    const batchIds = new Set<string>(store.elements.map(e => e.id));
    const newEls: DrawingElement[] = [];
    for (const ab of store.artboards) {
        if (ab.id === home.id) continue;
        const dx = ab.x - home.x, dy = ab.y - home.y;
        for (const e of sel) {
            const id = generateId(e.type, batchIds);
            batchIds.add(id);
            newEls.push({ ...JSON.parse(JSON.stringify(e)), id, x: e.x + dx, y: e.y + dy });
        }
    }
    if (newEls.length === 0) { showToast('Nothing to paste', 'info'); return 0; }
    pushToHistory();
    setStore('elements', list => [...list, ...newEls]);
    bumpDirtyRevision();
    showToast(`Pasted onto ${store.artboards.length - 1} artboard${store.artboards.length - 1 === 1 ? '' : 's'}`, 'success');
    return newEls.length;
};

// ── Symbols / instances ──────────────────────────────────────────────────────

/**
 * Create a Symbol from the selection: snapshot the selected elements (normalized to a 0,0
 * origin), store it as a reusable definition, and replace the selection with one instance.
 * Editing the symbol (redefineSymbol) updates every instance live.
 */
export const createSymbol = (ids: string[], name?: string): string | null => {
    const els = store.elements.filter(e => ids.includes(e.id));
    if (els.length === 0) { showToast('Symbol: select objects', 'info'); return null; }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const e of els) { minX = Math.min(minX, e.x); minY = Math.min(minY, e.y); maxX = Math.max(maxX, e.x + e.width); maxY = Math.max(maxY, e.y + e.height); }
    const w = Math.max(1, maxX - minX), h = Math.max(1, maxY - minY);
    // Normalize element copies to a 0,0 origin (strip group/mask refs).
    const norm = els.map(e => { const { groupIds, clipMaskId, isClipMask, ...rest } = e as any; return { ...rest, x: e.x - minX, y: e.y - minY } as DrawingElement; });
    const symId = generateId('sym' as any);
    const sym: SymbolDef = { id: symId, name: name || `Symbol ${store.symbols.length + 1}`, width: w, height: h, elements: norm };
    const inst: DrawingElement = {
        ...store.defaultElementStyles,
        id: generateId('symi' as any), type: 'symbolInstance', symbolId: symId,
        x: minX, y: minY, width: w, height: h, angle: 0, seed: 1, roundness: null,
        locked: false, link: null, layerId: store.activeLayerId,
    } as DrawingElement;
    pushToHistory();
    setStore('symbols', list => [...list, sym]);
    setStore('elements', list => [...list.filter(e => !ids.includes(e.id)), inst]);
    setStore('selection', [inst.id]);
    bumpDirtyRevision();
    showToast(`Created ${sym.name}`, 'success');
    return symId;
};

/** Place a new instance of a symbol at (x, y). */
export const placeInstance = (symbolId: string, x?: number, y?: number): string | null => {
    const sym = store.symbols.find(s => s.id === symbolId);
    if (!sym) return null;
    const inst: DrawingElement = {
        ...store.defaultElementStyles,
        id: generateId('symi' as any), type: 'symbolInstance', symbolId,
        x: x ?? 60, y: y ?? 60, width: sym.width, height: sym.height, angle: 0, seed: 1,
        roundness: null, locked: false, link: null, layerId: store.activeLayerId,
    } as DrawingElement;
    pushToHistory();
    setStore('elements', list => [...list, inst]);
    setStore('selection', [inst.id]);
    bumpDirtyRevision();
    return inst.id;
};

/** Redefine a symbol's contents from a set of elements (normalized) — updates all instances. */
export const redefineSymbol = (symbolId: string, fromIds: string[]) => {
    const sym = store.symbols.find(s => s.id === symbolId);
    const els = store.elements.filter(e => fromIds.includes(e.id));
    if (!sym || els.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const e of els) { minX = Math.min(minX, e.x); minY = Math.min(minY, e.y); maxX = Math.max(maxX, e.x + e.width); maxY = Math.max(maxY, e.y + e.height); }
    const w = Math.max(1, maxX - minX), h = Math.max(1, maxY - minY);
    const norm = els.map(e => ({ ...e, x: e.x - minX, y: e.y - minY }));
    pushToHistory();
    setStore('symbols', s => s.id === symbolId, () => ({ width: w, height: h, elements: norm }));
    bumpDirtyRevision();
    showToast('Symbol redefined — instances updated', 'success');
};

/** Detach (break link) — replace selected instances with editable copies of the symbol. */
export const detachInstance = (ids: string[]) => {
    const insts = store.elements.filter(e => ids.includes(e.id) && e.type === 'symbolInstance' && e.symbolId);
    if (insts.length === 0) { showToast('Detach: select an instance', 'info'); return; }
    pushToHistory();
    const additions: DrawingElement[] = [];
    const remove = new Set<string>();
    const batch = new Set<string>();
    for (const inst of insts) {
        const sym = store.symbols.find(s => s.id === inst.symbolId);
        if (!sym) continue;
        remove.add(inst.id);
        const sx = sym.width ? inst.width / sym.width : 1, sy = sym.height ? inst.height / sym.height : 1;
        const gid = generateId('grp' as any);
        for (const child of sym.elements) {
            const id = generateId(child.type as any, batch); batch.add(id);
            const copy: any = { ...child, id, x: inst.x + child.x * sx, y: inst.y + child.y * sy, width: child.width * sx, height: child.height * sy, groupIds: [gid] };
            if (child.points) copy.points = scalePoints(child.points, sx, sy);
            if (child.pathAnchors) copy.pathAnchors = scalePathAnchors(child.pathAnchors as any, sx, sy);
            if (child.pathSubpaths) copy.pathSubpaths = scalePathSubpaths(child.pathSubpaths as any, sx, sy);
            additions.push(copy);
        }
    }
    setStore('elements', list => [...list.filter(e => !remove.has(e.id)), ...additions]);
    setStore('selection', additions.map(a => a.id));
    bumpDirtyRevision();
    showToast('Instance detached', 'success');
};

/**
 * Edit-in-place: open a symbol's contents for editing from one of its instances.
 * The instance is temporarily expanded into editable copies (grouped) at its
 * place; on exit the edits are written back to the symbol (updating every
 * instance) and the instance is restored.
 */
export const enterSymbolEdit = (instanceId: string) => {
    if (store.symbolEdit) return; // one session at a time
    const inst = store.elements.find(e => e.id === instanceId && e.type === 'symbolInstance' && e.symbolId);
    if (!inst) return;
    const sym = store.symbols.find(s => s.id === inst.symbolId);
    if (!sym) return;
    pushToHistory();
    const sx = sym.width ? inst.width / sym.width : 1, sy = sym.height ? inst.height / sym.height : 1;
    const gid = generateId('grp' as any);
    const batch = new Set<string>();
    const additions: DrawingElement[] = [];
    for (const child of sym.elements) {
        const id = generateId(child.type as any, batch); batch.add(id);
        const copy: any = { ...child, id, x: inst.x + child.x * sx, y: inst.y + child.y * sy, width: child.width * sx, height: child.height * sy, groupIds: [gid], layerId: inst.layerId };
        if (child.points) copy.points = scalePoints(child.points, sx, sy);
        if (child.pathAnchors) copy.pathAnchors = scalePathAnchors(child.pathAnchors as any, sx, sy);
        if (child.pathSubpaths) copy.pathSubpaths = scalePathSubpaths(child.pathSubpaths as any, sx, sy);
        additions.push(copy);
    }
    setStore('elements', list => [...list.filter(e => e.id !== inst.id), ...additions]);
    setStore('selection', additions.map(a => a.id));
    setStore('symbolEdit', { symbolId: sym.id, groupId: gid, name: sym.name, x: inst.x, y: inst.y });
    bumpDirtyRevision();
    showToast(`Editing symbol “${sym.name}”`, 'info');
};

/** Close an edit-in-place session: save (redefine the symbol from the edited
 *  copies, updating all instances) or cancel, then restore a single instance. */
export const exitSymbolEdit = (save = true) => {
    const session = store.symbolEdit;
    if (!session) return;
    const ids = store.elements.filter(e => (e.groupIds || []).includes(session.groupId)).map(e => e.id);
    if (save && ids.length) {
        redefineSymbol(session.symbolId, ids); // pushes its own history + updates instances
    }
    const newInst: DrawingElement = {
        ...store.defaultElementStyles,
        id: generateId('symi' as any), type: 'symbolInstance', symbolId: session.symbolId,
        x: session.x, y: session.y,
        width: store.symbols.find(s => s.id === session.symbolId)?.width ?? 100,
        height: store.symbols.find(s => s.id === session.symbolId)?.height ?? 100,
        angle: 0, seed: 1, roundness: null, locked: false, link: null, layerId: store.activeLayerId,
    } as DrawingElement;
    setStore('elements', list => [...list.filter(e => !ids.includes(e.id)), newInst]);
    setStore('selection', [newInst.id]);
    setStore('symbolEdit', null);
    bumpDirtyRevision();
    showToast(save ? 'Symbol updated' : 'Edit cancelled', save ? 'success' : 'info');
};

/** Select every live instance of a symbol on the canvas (no-op if there are none). */
export const selectInstancesOf = (symbolId: string) => {
    const ids = store.elements.filter(e => e.type === 'symbolInstance' && e.symbolId === symbolId).map(e => e.id);
    setStore('selection', ids);
};

/** Rename a symbol definition. */
export const renameSymbol = (symbolId: string, name: string) => {
    const n = name.trim();
    if (!n) return;
    pushToHistory();
    setStore('symbols', s => s.id === symbolId, () => ({ name: n }));
    bumpDirtyRevision();
};

/** Delete a symbol definition. By default detaches its instances into editable copies first. */
export const deleteSymbol = (symbolId: string, detachInstances = true) => {
    const sym = store.symbols.find(s => s.id === symbolId);
    if (!sym) return;
    const instIds = store.elements.filter(e => e.type === 'symbolInstance' && e.symbolId === symbolId).map(e => e.id);
    if (instIds.length && detachInstances) {
        detachInstance(instIds);
        // detachInstance pushes its own history; remove the now-orphaned def afterward.
        setStore('symbols', list => list.filter(s => s.id !== symbolId));
    } else {
        pushToHistory();
        // Remove the def and any remaining instances of it.
        setStore('elements', list => list.filter(e => !(e.type === 'symbolInstance' && e.symbolId === symbolId)));
        setStore('symbols', list => list.filter(s => s.id !== symbolId));
    }
    bumpDirtyRevision();
    showToast(`Deleted ${sym.name}`, 'info');
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
    setStore('elements', (e: DrawingElement) => !!e.clipMaskId && masks.has(e.clipMaskId), () => ({ clipMaskId: undefined, maskType: undefined }));
    setStore('selection', [...members]);
    bumpDirtyRevision();
    showToast('Clipping mask released', 'success');
};

// ── Appearance stack (extra fills/strokes) ───────────────────────────────────

/** Append an extra fill to the appearance stack of each given element. */
export const addAppearanceFill = (ids: string[], fill: PaintFill = { color: '#3b82f6', opacity: 0.5 }) => {
    if (ids.length === 0) return;
    pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id), (e: DrawingElement) => ({
        appearance: { ...e.appearance, fills: [...(e.appearance?.fills || []), { ...fill }] },
    }));
    bumpDirtyRevision();
    showToast('Fill added', 'success');
};

/** Append an extra stroke to the appearance stack of each given element. */
export const addAppearanceStroke = (ids: string[], stroke: PaintStroke = { color: '#ef4444', width: 6 }) => {
    if (ids.length === 0) return;
    pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id), (e: DrawingElement) => ({
        appearance: { ...e.appearance, strokes: [...(e.appearance?.strokes || []), { ...stroke }] },
    }));
    bumpDirtyRevision();
    showToast('Stroke added', 'success');
};

/** Replace the entire appearance stack of each given element. */
export const setAppearance = (ids: string[], appearance: { fills?: PaintFill[]; strokes?: PaintStroke[] } | undefined) => {
    if (ids.length === 0) return;
    pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id), () => ({ appearance }));
    bumpDirtyRevision();
};

/** Remove the appearance stack, leaving only the base fill/stroke. */
export const clearAppearance = (ids: string[]) => setAppearance(ids, undefined);

// ── Gradient mesh fill ────────────────────────────────────────────────────────

/** Apply a gradient-mesh fill to the given elements (seeded from each element's
 *  current fill colour). Sets fillStyle = 'mesh' and a default node grid. */
export const applyMeshGradient = (ids: string[], rows = 3, cols = 3) => {
    if (ids.length === 0) { showToast('Mesh: select an object', 'info'); return; }
    pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id), (e: DrawingElement) => ({
        fillStyle: 'mesh' as const,
        meshGradient: defaultMesh(rows, cols, (e.backgroundColor && e.backgroundColor !== 'transparent') ? e.backgroundColor : '#3b82f6'),
    }));
    bumpDirtyRevision();
    showToast('Gradient mesh applied', 'success');
};

/** Apply a vector pattern fill to the given elements (seeded from each element's
 *  current fill/stroke colour). Sets fillStyle = 'pattern' and a default motif. */
export const applyPatternFill = (ids: string[], type: PatternType = 'stripes') => {
    if (ids.length === 0) { showToast('Pattern: select an object', 'info'); return; }
    pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id), (e: DrawingElement) => ({
        fillStyle: 'pattern' as const,
        patternFill: defaultPatternFill(
            e.patternFill?.color
            || (e.backgroundColor && e.backgroundColor !== 'transparent' ? e.backgroundColor : (e.strokeColor || '#000000')),
            (e.patternFill?.type ?? type),
        ),
        patternSwatchId: undefined,
    }));
    bumpDirtyRevision();
    showToast('Pattern fill applied', 'success');
};

/** "Make Pattern from Selection" — capture the selected artwork into a raster tile
 *  and spawn a preview rectangle (placed to the right) filled with that custom
 *  pattern, so it tiles visibly. Returns the new rectangle's id. */
export const createPatternFromSelection = (ids: string[]): string | null => {
    const els = store.elements.filter(e => ids.includes(e.id));
    if (els.length === 0) { showToast('Pattern: select objects', 'info'); return null; }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const e of els) {
        const x0 = Math.min(e.x, e.x + e.width), x1 = Math.max(e.x, e.x + e.width);
        const y0 = Math.min(e.y, e.y + e.height), y1 = Math.max(e.y, e.y + e.height);
        minX = Math.min(minX, x0); minY = Math.min(minY, y0);
        maxX = Math.max(maxX, x1); maxY = Math.max(maxY, y1);
    }
    const w = Math.max(1, maxX - minX), h = Math.max(1, maxY - minY);

    const tile = captureElementsToDataURL(els, minX, minY, w, h, store.theme !== 'light');
    if (!tile) { showToast('Pattern: could not capture selection', 'error'); return null; }

    // Preview rectangle large enough to show a few repeats.
    const previewW = Math.max(240, Math.round(w * 2));
    const previewH = Math.max(240, Math.round(h * 2));
    const rect: DrawingElement = {
        ...store.defaultElementStyles,
        id: generateId('rect' as any), type: 'rectangle',
        x: maxX + 40, y: minY, width: previewW, height: previewH,
        angle: 0, seed: 1, roundness: null, locked: false, link: null, layerId: store.activeLayerId,
        strokeColor: '#333333', backgroundColor: '#ffffff',
        fillStyle: 'pattern',
        patternFill: { type: 'custom', color: '#000000', background: 'transparent', scale: 1, angle: 0, tile, tileWidth: w, tileHeight: h },
    } as DrawingElement;

    pushToHistory();
    setStore('elements', list => [...list, rect]);
    setStore('selection', [rect.id]);
    bumpDirtyRevision();
    showToast('Pattern created from selection', 'success');
    return rect.id;
};

/** Merge a partial update into the pattern fill of the given elements. A direct
 *  edit breaks any library-swatch link (the fill no longer follows the swatch). */
export const setPatternFill = (ids: string[], patch: Partial<PatternFill>, history = true) => {
    if (ids.length === 0) return;
    if (history) pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id) && !!e.patternFill, (e: DrawingElement) => ({
        patternFill: { ...(e.patternFill as PatternFill), ...patch },
        patternSwatchId: undefined,
    }));
    bumpDirtyRevision();
};

/** Remove the pattern fill, reverting the element(s) to a solid fill. */
export const clearPatternFill = (ids: string[]) => {
    if (ids.length === 0) return;
    pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id), () => ({ fillStyle: 'solid' as const, patternFill: undefined, patternSwatchId: undefined }));
    bumpDirtyRevision();
};

// ── Pattern swatch library (document-level reusable PatternFills) ─────────────

/** Save a PatternFill to the document's pattern-swatch library. Returns its id. */
export const savePatternSwatch = (fill: PatternFill, name?: string): string => {
    const id = generateId('pat' as any);
    const sw: PatternSwatch = { id, name: name || `Pattern ${store.patterns.length + 1}`, fill: { ...fill } };
    pushToHistory();
    setStore('patterns', list => [...list, sw]);
    bumpDirtyRevision();
    showToast(`Saved ${sw.name}`, 'success');
    return id;
};

/** Save the (first) selected element's pattern fill to the library. */
export const savePatternSwatchFromElement = (ids?: string[], name?: string): string | null => {
    const sel = ids ?? store.selection;
    const el = store.elements.find(e => sel.includes(e.id) && !!e.patternFill);
    if (!el || !el.patternFill) { showToast('Pattern: select a shape with a pattern fill', 'info'); return null; }
    return savePatternSwatch(el.patternFill, name);
};

/** Capture the selected artwork into a custom tile and save it as a library swatch
 *  (without spawning a preview rectangle). Returns the swatch id. */
export const addPatternSwatchFromSelection = (ids?: string[], name?: string): string | null => {
    const sel = ids ?? store.selection;
    const els = store.elements.filter(e => sel.includes(e.id));
    if (els.length === 0) { showToast('Pattern: select objects', 'info'); return null; }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const e of els) {
        const x0 = Math.min(e.x, e.x + e.width), x1 = Math.max(e.x, e.x + e.width);
        const y0 = Math.min(e.y, e.y + e.height), y1 = Math.max(e.y, e.y + e.height);
        minX = Math.min(minX, x0); minY = Math.min(minY, y0); maxX = Math.max(maxX, x1); maxY = Math.max(maxY, y1);
    }
    const w = Math.max(1, maxX - minX), h = Math.max(1, maxY - minY);
    const tile = captureElementsToDataURL(els, minX, minY, w, h, store.theme !== 'light');
    if (!tile) { showToast('Pattern: could not capture selection', 'error'); return null; }
    return savePatternSwatch({ type: 'custom', color: '#000000', background: 'transparent', scale: 1, angle: 0, tile, tileWidth: w, tileHeight: h }, name);
};

/** Apply a library pattern swatch to the given elements (default: selection). */
export const applyPatternSwatch = (swatchId: string, ids?: string[]) => {
    const sw = store.patterns.find(p => p.id === swatchId);
    const targets = ids ?? store.selection;
    if (!sw || targets.length === 0) { if (!sw) showToast('Pattern not found', 'info'); else showToast('Select a shape first', 'info'); return; }
    pushToHistory();
    // Link the element to the swatch (patternSwatchId) so redefining the swatch
    // updates it live — mirrors fillSwatchId for colour swatches.
    setStore('elements', (e: DrawingElement) => targets.includes(e.id), () => ({ fillStyle: 'pattern' as const, patternFill: { ...sw.fill }, patternSwatchId: sw.id }));
    bumpDirtyRevision();
    showToast(`Applied ${sw.name}`, 'success');
};

/** Redefine a library swatch from the (first) selected element's pattern fill, and
 *  push the new pattern to every element linked to that swatch (live update). */
export const updatePatternSwatch = (swatchId: string, fromId?: string) => {
    const el = store.elements.find(e => e.id === (fromId ?? store.selection.find(id => store.elements.find(x => x.id === id)?.patternFill)));
    if (!el || !el.patternFill) { showToast('Select a shape with a pattern fill', 'info'); return; }
    const fill = { ...el.patternFill };
    pushToHistory();
    setStore('patterns', p => p.id === swatchId, () => ({ fill: { ...fill } }));
    // Propagate to all linked elements (except the source, which already has it).
    setStore('elements', (e: DrawingElement) => e.patternSwatchId === swatchId && e.id !== el.id, () => ({ fillStyle: 'pattern' as const, patternFill: { ...fill } }));
    bumpDirtyRevision();
    showToast('Pattern updated', 'success');
};

export const renamePatternSwatch = (swatchId: string, name: string) => {
    const n = name.trim();
    if (!n) return;
    setStore('patterns', p => p.id === swatchId, () => ({ name: n }));
    bumpDirtyRevision();
};

export const deletePatternSwatch = (swatchId: string) => {
    pushToHistory();
    setStore('patterns', list => list.filter(p => p.id !== swatchId));
    // Drop dangling links; linked elements keep their current pattern fill.
    setStore('elements', (e: DrawingElement) => e.patternSwatchId === swatchId, () => ({ patternSwatchId: undefined }));
    bumpDirtyRevision();
};

export const togglePatternsPanel = (visible?: boolean) => {
    setPanelOpen('patterns', visible);
};

/** Change the node-grid size of a mesh fill, preserving colours where possible. */
export const setMeshSize = (ids: string[], rows: number, cols: number) => {
    if (ids.length === 0) return;
    pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id) && !!e.meshGradient, (e: DrawingElement) => ({
        meshGradient: resizeMesh(e.meshGradient as MeshGradient, rows, cols),
    }));
    bumpDirtyRevision();
};

/** Set the colour of a single mesh node (row, col) on the given elements. */
export const setMeshNodeColor = (ids: string[], row: number, col: number, color: string) => {
    if (ids.length === 0) return;
    pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id) && !!e.meshGradient, (e: DrawingElement) => {
        const m = e.meshGradient as MeshGradient;
        const idx = meshIndex(m, row, col);
        if (idx < 0 || idx >= m.colors.length) return {};
        const colors = m.colors.slice();
        colors[idx] = color;
        return { meshGradient: { ...m, colors } };
    });
    bumpDirtyRevision();
};

/** Move a mesh node to a normalized (0..1) position (warps the mesh). Boundary
 *  nodes are constrained to their edge; interior nodes move freely. */
export const setMeshNodePosition = (ids: string[], row: number, col: number, x: number, y: number, history = true) => {
    if (ids.length === 0) return;
    if (history) pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id) && !!e.meshGradient, (e: DrawingElement) => {
        const m = e.meshGradient as MeshGradient;
        const pts = meshPoints(m);
        const idx = meshIndex(m, row, col);
        if (idx < 0 || idx >= pts.length) return {};
        pts[idx] = constrainNodePos(m, row, col, x, y);
        return { meshGradient: { ...m, points: pts } };
    });
    bumpDirtyRevision();
};

/** Reset all mesh node positions back to the even grid (un-warp). */
export const resetMeshNodes = (ids: string[]) => {
    if (ids.length === 0) return;
    pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id) && !!e.meshGradient, (e: DrawingElement) => {
        const { points, ...rest } = e.meshGradient as MeshGradient;
        return { meshGradient: { ...rest } };
    });
    bumpDirtyRevision();
};

/** Toggle bicubic (smooth) vs bilinear mesh colour interpolation. */
export const setMeshSmooth = (ids: string[], smooth: boolean) => {
    if (ids.length === 0) return;
    pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id) && !!e.meshGradient, (e: DrawingElement) => ({
        meshGradient: { ...(e.meshGradient as MeshGradient), smooth },
    }));
    bumpDirtyRevision();
};

/** Remove a mesh fill, reverting to a solid fill. */
export const clearMeshGradient = (ids: string[]) => {
    if (ids.length === 0) return;
    pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id), () => ({ fillStyle: 'solid' as const, meshGradient: undefined }));
    bumpDirtyRevision();
};

/**
 * Image Trace — vectorize a selected image into an editable `path` element (threshold trace
 * via marching squares; holes via even-odd). The new path is placed over the image filled
 * black; delete the image to keep just the vector. Returns the new path ids.
 */
export const traceImage = (ids: string[], options: { threshold?: number; simplify?: number; colors?: number; centerline?: boolean } = {}): string[] => {
    const targets = store.elements.filter(e => ids.includes(e.id) && e.type === 'image' && e.dataURL);
    if (targets.length === 0) { showToast('Trace: select an image', 'info'); return []; }
    const newPaths: DrawingElement[] = [];
    const batch = new Set<string>(); // unique ids across all paths created here (not yet in store)
    for (const el of targets) {
        const img = getImage(el.dataURL!);
        if (!img || !img.width) { showToast('Trace: image still loading', 'info'); continue; }
        const maxDim = 256;
        const k = Math.min(1, maxDim / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
        const tw = Math.max(1, Math.round((img.naturalWidth || img.width) * k));
        const th = Math.max(1, Math.round((img.naturalHeight || img.height) * k));
        const canvas = document.createElement('canvas');
        canvas.width = tw; canvas.height = th;
        const cctx = canvas.getContext('2d');
        if (!cctx) continue;
        cctx.drawImage(img, 0, 0, tw, th);
        const data = cctx.getImageData(0, 0, tw, th).data;
        const toWorldSubs = (subs: { points: { x: number; y: number }[]; closed: boolean }[]): WorldSub[] =>
            subs.map(sp => ({ closed: true, anchors: sp.points.map(p => ({ x: el.x + p.x * el.width, y: el.y + p.y * el.height, kind: 'corner' as const })) }));

        if (options.centerline) {
            // Centre-line trace → open stroked polylines of the skeleton.
            const lines = traceImageCenterline(data, tw, th, { threshold: options.threshold ?? 128, simplify: options.simplify ?? 1.2 });
            if (lines.length === 0) { showToast('Trace: no centre-lines found', 'info'); continue; }
            const path = makePathFromWorldSubs(
                lines.map(ln => ({ closed: false, anchors: ln.points.map(p => ({ x: el.x + p.x * el.width, y: el.y + p.y * el.height, kind: 'corner' as const })) })),
                { backgroundColor: 'transparent', strokeColor: '#000000', strokeWidth: 2, fillStyle: 'solid', renderStyle: 'architectural' },
                batch
            );
            if (path) newPaths.push(path);
        } else if (options.colors && options.colors >= 2) {
            // Colour trace → one filled path per quantized colour, grouped & stacked.
            const layers = traceImageDataColor(data, tw, th, { colors: options.colors, simplify: options.simplify ?? 1.0 });
            if (layers.length === 0) { showToast('Trace: nothing found', 'info'); continue; }
            const groupId = generateId('trace');
            for (const layer of layers) {
                const path = makePathFromWorldSubs(toWorldSubs(layer.subpaths), {
                    backgroundColor: layer.color, strokeColor: 'transparent', strokeWidth: 0,
                    fillStyle: 'solid', renderStyle: 'architectural',
                }, batch);
                if (path) { path.groupIds = [groupId]; newPaths.push(path); }
            }
        } else {
            // Monochrome threshold trace → a single even-odd path.
            const subs = traceImageData(data, tw, th, { threshold: options.threshold ?? 128, simplify: options.simplify ?? 1.0 });
            if (subs.length === 0) { showToast('Trace: nothing found (adjust threshold)', 'info'); continue; }
            const path = makePathFromWorldSubs(toWorldSubs(subs), {
                backgroundColor: '#000000', strokeColor: 'transparent', strokeWidth: 0,
                fillStyle: 'solid', renderStyle: 'architectural',
            }, batch);
            if (path) newPaths.push(path);
        }
    }
    if (newPaths.length === 0) return [];
    pushToHistory();
    setStore('elements', list => [...list, ...newPaths]);
    const ids2 = newPaths.map(p => p.id);
    setStore('selection', ids2);
    bumpDirtyRevision();
    showToast(`Traced ${ids2.length} layer${ids2.length > 1 ? 's' : ''}`, 'success');
    return ids2;
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

    // Remap group / clip-mask ids too, so the copy's groups are INDEPENDENT of the originals'.
    // Without this the duplicated elements kept the original groupIds, so clicking either copy
    // selected both groups' members at once → "move one, the other moves". Map each distinct
    // original group id to a fresh one, consistently across all members of that group.
    const groupIdMap = new Map<string, string>();
    const remapGroupId = (gid: string): string => {
        let next = groupIdMap.get(gid);
        if (!next) { next = generateId('group'); groupIdMap.set(gid, next); }
        return next;
    };

    const duplicatedElements = elementsOnLayer.map(el => {
        const newEl: DrawingElement = JSON.parse(JSON.stringify(el));
        newEl.id = idMap.get(el.id)!;
        newEl.layerId = newLayerId;
        newEl.x += 10;
        newEl.y += 10;

        if (newEl.groupIds && newEl.groupIds.length) {
            newEl.groupIds = newEl.groupIds.map(remapGroupId);
        }
        if ((newEl as any).clipMaskId) {
            (newEl as any).clipMaskId = remapGroupId((newEl as any).clipMaskId);
        }

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
    setPanelOpen('layers', visible);
};

export const toggleSymbolsPanel = (visible?: boolean) => {
    setPanelOpen('symbols', visible);
};

export const toggleMeshEdit = (active?: boolean) => {
    setStore('meshEditActive', (v) => active ?? !v);
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
                if (isPagedDocType(store.docType)) {
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

import { calculateAlignment, calculateDistribution, calculateSpacingDistribution, type AlignmentType, type DistributionType } from "../utils/alignment";

export const toggleAlignToKey = (on?: boolean) => setStore('alignToKeyObject', v => on ?? !v);

// ── Eyedropper (pick a style from any object onto the selection) ──────────────

/** Arm the eyedropper: the next canvas click on an object copies its style to
 *  the given targets (defaults to the current selection). */
export const startEyedropper = (targetIds?: string[]) => {
    const targets = targetIds ?? [...store.selection];
    if (targets.length === 0) { showToast('Eyedropper: select an object first', 'info'); return; }
    setStore('eyedropper', { active: true, targets });
    showToast('Eyedropper: click an object to copy its style', 'info');
};

export const cancelEyedropper = () => setStore('eyedropper', { active: false, targets: [] });

// ── Graphic styles (named reusable appearances) ──────────────────────────────

export const toggleGraphicStylesPanel = (visible?: boolean) => {
    const next = visible ?? !isPanelOpen('graphicStyles');
    if (next) repairLibraryIds();
    setPanelOpen('graphicStyles', next);
};

/** Save the (first) selected element's appearance as a named graphic style. */
export const createGraphicStyle = (ids?: string[], name?: string): string | null => {
    const sel = ids ?? store.selection;
    const el = store.elements.find(e => e.id === sel[0]);
    if (!el) { showToast('Graphic style: select an object', 'info'); return null; }
    const id = generateId('gstyle' as any);
    const gs: GraphicStyle = { id, name: name || `Style ${store.graphicStyles.length + 1}`, style: getStyleSnapshot(el) };
    pushToHistory();
    setStore('graphicStyles', list => [...list, gs]);
    bumpDirtyRevision();
    showToast(`Saved ${gs.name}`, 'success');
    return id;
};

/** Apply a saved graphic style's appearance to the given elements (default: selection). */
export const applyGraphicStyle = (styleId: string, ids?: string[]) => {
    const gs = store.graphicStyles.find(g => g.id === styleId);
    const targets = ids ?? store.selection;
    if (!gs || targets.length === 0) return;
    pushToHistory();
    setStore('elements', (e: DrawingElement) => targets.includes(e.id), () => ({ ...gs.style }));
    bumpDirtyRevision();
    showToast(`Applied ${gs.name}`, 'success');
};

/** Redefine a graphic style from the (first) selected element. */
export const updateGraphicStyle = (styleId: string, fromId?: string) => {
    const el = store.elements.find(e => e.id === (fromId ?? store.selection[0]));
    if (!el) return;
    pushToHistory();
    setStore('graphicStyles', g => g.id === styleId, () => ({ style: getStyleSnapshot(el) }));
    bumpDirtyRevision();
    showToast('Graphic style updated', 'success');
};

export const renameGraphicStyle = (styleId: string, name: string) => {
    const n = name.trim();
    if (!n) return;
    setStore('graphicStyles', g => g.id === styleId, () => ({ name: n }));
    bumpDirtyRevision();
};

export const deleteGraphicStyle = (styleId: string) => {
    pushToHistory();
    setStore('graphicStyles', list => list.filter(g => g.id !== styleId));
    bumpDirtyRevision();
};

// ── Global swatches (document-level named colours with live links) ───────────

/** Repair duplicate ids in the swatch / graphic-style libraries (documents made
 *  before generateId scanned these collections shared ids, which broke per-item
 *  edits). Reassigns fresh unique ids to any later duplicates. */
export const repairLibraryIds = () => {
    const fix = (key: 'swatches' | 'graphicStyles', prefix: string) => {
        const list = store[key] as { id: string }[];
        const seen = new Set<string>(); const batch = new Set<string>(); let changed = false;
        const next = list.map(item => {
            if (!seen.has(item.id)) { seen.add(item.id); batch.add(item.id); return item; }
            const nid = generateId(prefix as any, batch); batch.add(nid); changed = true;
            return { ...item, id: nid };
        });
        if (changed) setStore(key as any, next as any);
    };
    fix('swatches', 'swatch');
    fix('graphicStyles', 'gstyle');
};

export const toggleSwatchesPanel = (visible?: boolean) => {
    const next = visible ?? !isPanelOpen('swatches');
    if (next) repairLibraryIds();
    setPanelOpen('swatches', next);
};

export const toggleBrandKitPanel = (visible?: boolean) => {
    setPanelOpen('brandKit', visible);
};

export const toggleElementsPanel = (visible?: boolean) => {
    setPanelOpen('elements', visible);
};

export const toggleStickFigurePanel = (visible?: boolean) => {
    setPanelOpen('stickFigure', visible);
};

export const toggleSceneTimeline = (visible?: boolean) => {
    const next = visible ?? !store.showSceneTimeline;
    setStore('showSceneTimeline', next);
    if (!next) setStore('storyPlaying', false);
};

/**
 * Add a persistent dimension annotation to an element (measures its width or height).
 * Auto-updates as the element moves/resizes. Returns the new dimension id.
 */
export const addDimension = (targetId: string, measure: DimensionMeasure = 'width', offset = 24): string | null => {
    const el = store.elements.find(e => e.id === targetId);
    if (!el) return null;
    const id = generateId('dimension' as any);
    pushToHistory();
    setStore('dimensionAnnotations', list => [...list, { id, targetId, measure, offset }]);
    bumpDirtyRevision();
    return id;
};

/** Remove a dimension annotation by id. */
export const removeDimension = (id: string) => {
    if (!store.dimensionAnnotations.some(d => d.id === id)) return;
    pushToHistory();
    setStore('dimensionAnnotations', list => list.filter(d => d.id !== id));
    bumpDirtyRevision();
};

/** Remove all dimensions attached to a given target element. */
export const removeDimensionsForTarget = (targetId: string) => {
    if (!store.dimensionAnnotations.some(d => d.targetId === targetId)) return;
    pushToHistory();
    setStore('dimensionAnnotations', list => list.filter(d => d.targetId !== targetId));
    bumpDirtyRevision();
};

/**
 * Show/hide the Keyframes dope-sheet (After-Effects–class property timeline).
 * Shares the storyTime/storyDuration/storyPlaying/storyLoop clock with the Scene
 * Timeline; the two are mutually exclusive so only one play-controller drives the
 * playhead at a time (both are bottom transport bars).
 */
export const toggleKeyframePanel = (visible?: boolean) => {
    const next = visible ?? !store.showKeyframePanel;
    setStore('showKeyframePanel', next);
    if (next) setStore('showSceneTimeline', false);
    if (!next) setStore('storyPlaying', false);
};

/** Create a swatch (from a colour, or the first selected element's fill). */
export const createSwatch = (color?: string, name?: string, group?: string): string | null => {
    let c = color;
    if (!c) {
        const el = store.elements.find(e => e.id === store.selection[0]);
        c = el && el.backgroundColor && el.backgroundColor !== 'transparent' ? el.backgroundColor : '#3b82f6';
    }
    const id = generateId('swatch' as any);
    const sw: Swatch = { id, name: name || c!, color: c!, group };
    pushToHistory();
    setStore('swatches', list => [...list, sw]);
    bumpDirtyRevision();
    showToast('Swatch added', 'success');
    return id;
};

/** Apply a swatch to the given elements' fill or stroke (linking them to it),
 *  and set it as the active brush/default colour for new shapes. */
export const applySwatch = (swatchId: string, target: 'fill' | 'stroke' = 'fill', ids?: string[]) => {
    const sw = store.swatches.find(s => s.id === swatchId);
    if (!sw) return;
    const targets = ids ?? store.selection;
    if (targets.length > 0) {
        pushToHistory();
        setStore('elements', (e: DrawingElement) => targets.includes(e.id), () => (
            target === 'fill'
                ? { backgroundColor: sw.color, fillSwatchId: sw.id }
                : { strokeColor: sw.color, strokeSwatchId: sw.id }
        ));
    }
    // Make the swatch the active drawing colour. A fill swatch also updates the
    // stroke/"brush" default (the toolbar's colour indicator) so picking a colour
    // changes what the pen/brush draws too; a stroke swatch sets the stroke only.
    updateDefaultStyles(target === 'fill'
        ? { backgroundColor: sw.color, fillStyle: 'solid', strokeColor: sw.color }
        : { strokeColor: sw.color });
    bumpDirtyRevision();
};

/** Change a swatch's colour — every linked object's fill/stroke updates with it. */
export const updateSwatchColor = (swatchId: string, color: string) => {
    if (!store.swatches.some(s => s.id === swatchId)) return;
    pushToHistory();
    setStore('swatches', s => s.id === swatchId, () => ({ color }));
    setStore('elements', (e: DrawingElement) => e.fillSwatchId === swatchId, () => ({ backgroundColor: color }));
    setStore('elements', (e: DrawingElement) => e.strokeSwatchId === swatchId, () => ({ strokeColor: color }));
    bumpDirtyRevision();
};

export const renameSwatch = (swatchId: string, name: string) => {
    const n = name.trim(); if (!n) return;
    setStore('swatches', s => s.id === swatchId, () => ({ name: n }));
    bumpDirtyRevision();
};

/** Delete a swatch and drop the link from any objects that referenced it. */
export const deleteSwatch = (swatchId: string) => {
    pushToHistory();
    setStore('swatches', list => list.filter(s => s.id !== swatchId));
    setStore('elements', (e: DrawingElement) => e.fillSwatchId === swatchId, () => ({ fillSwatchId: undefined }));
    setStore('elements', (e: DrawingElement) => e.strokeSwatchId === swatchId, () => ({ strokeSwatchId: undefined }));
    bumpDirtyRevision();
};

/** Assign swatches to a named group (Illustrator swatch groups). Pass null to ungroup. */
export const setSwatchGroup = (swatchIds: string[], group: string | null) => {
    if (swatchIds.length === 0) return;
    pushToHistory();
    setStore('swatches', (s: Swatch) => swatchIds.includes(s.id), () => ({ group: group ?? undefined }));
    bumpDirtyRevision();
    showToast(group ? `Grouped into “${group}”` : 'Ungrouped swatches', 'success');
};

/** Swatches keyed by group name (ungrouped under ''). */
export const listSwatchGroups = (): Record<string, Swatch[]> => {
    const out: Record<string, Swatch[]> = {};
    for (const s of store.swatches) (out[s.group ?? ''] ??= []).push({ ...s });
    return out;
};

/**
 * Create one swatch per distinct colour in the current selection, all assigned to
 * `group` (the "add selected colours to a swatch group" workflow). Returns new ids.
 */
export const createSwatchGroupFromSelection = (group: string, ids?: string[]): string[] => {
    const colors = getSelectionColors(ids ?? store.selection).map(c => c.color);
    if (colors.length === 0) { showToast('No colours in selection', 'info'); return []; }
    const existing = new Set(store.swatches.map(s => s.color));
    const fresh = colors.filter(c => !existing.has(c));
    if (fresh.length === 0) { showToast('All colours already in swatches', 'info'); return []; }
    pushToHistory();
    const made: Swatch[] = fresh.map(c => ({ id: generateId('swatch' as any), name: c, color: c, group }));
    setStore('swatches', list => [...list, ...made]);
    bumpDirtyRevision();
    showToast(`Added ${made.length} colour${made.length === 1 ? '' : 's'} to “${group}”`, 'success');
    return made.map(s => s.id);
};

// ── Blend (interpolated steps between two objects) ───────────────────────────

/** Create `steps` intermediate copies between two objects, interpolating
 *  position, size, rotation, opacity, stroke width and colours. Uses the first
 *  object's shape (a graduated blend, not shape-morphing). */
export const blendShapes = (ids?: string[], steps = 4) => {
    const sel = ids ?? store.selection;
    const a = store.elements.find(e => e.id === sel[0]);
    const b = store.elements.find(e => e.id === sel[1]);
    if (!a || !b || a.id === b.id) { showToast('Blend: select two objects', 'info'); return; }
    const n = Math.max(1, Math.min(50, Math.round(steps)));
    const lerp = (x: number, y: number, t: number) => x + (y - x) * t;
    const lerpColor = (c1?: string, c2?: string, t = 0): string | undefined => {
        if (!c1 || c1 === 'transparent') return c2;
        if (!c2 || c2 === 'transparent') return c1;
        const A = parseHex(c1), B = parseHex(c2);
        return rgbToHex(lerp(A.r, B.r, t), lerp(A.g, B.g, t), lerp(A.b, B.b, t));
    };
    pushToHistory();
    const batch = new Set<string>();
    const additions: DrawingElement[] = [];
    for (let k = 1; k <= n; k++) {
        const t = k / (n + 1);
        const id = generateId(a.type as any, batch); batch.add(id);
        const clone = {
            ...a, id,
            x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t),
            width: lerp(a.width, b.width, t), height: lerp(a.height, b.height, t),
            angle: lerp(a.angle || 0, b.angle || 0, t),
            opacity: lerp(a.opacity ?? 100, b.opacity ?? 100, t),
            strokeWidth: lerp(a.strokeWidth ?? 1, b.strokeWidth ?? 1, t),
            backgroundColor: lerpColor(a.backgroundColor, b.backgroundColor, t) ?? a.backgroundColor,
            strokeColor: lerpColor(a.strokeColor, b.strokeColor, t) ?? a.strokeColor,
            groupIds: undefined, fillSwatchId: undefined, strokeSwatchId: undefined,
        } as DrawingElement;
        additions.push(clone);
    }
    // Insert the intermediates just after the first object in z-order.
    setStore('elements', (list: DrawingElement[]) => {
        const idx = list.findIndex(e => e.id === a.id);
        const copy = [...list];
        copy.splice(idx + 1, 0, ...additions);
        return copy;
    });
    setStore('selection', [a.id, ...additions.map(x => x.id), b.id]);
    bumpDirtyRevision();
    showToast(`Blended — ${n} steps`, 'success');
};

/** Element types usable as a blend spine (an open path/line to distribute the blend along). */
const SPINE_TYPES = ['line', 'arrow', 'bezier', 'polyline', 'elbow', 'path', 'fineliner', 'ink'];

/**
 * Blend along a spine (Illustrator's Object ▸ Blend, then Replace Spine): distribute `steps`
 * interpolated copies of two shapes ALONG a selected path, each interpolating size/colour
 * between the two endpoints and (by default) oriented to the path tangent. Reuses the
 * arc-length path sampler (`elementPathSample`/`sampleAt`). Selection = two shapes + one
 * path/line spine (auto-detected). Destructive (creates real copies).
 */
export const blendAlongPath = (ids?: string[], steps = 8, orient = true): string[] => {
    const sel = ids ?? store.selection;
    const els = store.elements.filter(e => sel.includes(e.id));
    const spine = els.find(e => SPINE_TYPES.includes(e.type));
    if (!spine) { showToast('Blend along spine: include a path/line as the spine', 'info'); return []; }
    const shapes = els.filter(e => e.id !== spine.id);
    if (shapes.length < 2) { showToast('Blend along spine: select two shapes + a path', 'info'); return []; }
    const a = shapes[0], b = shapes[shapes.length - 1];
    const sample = elementPathSample(spine);
    if (!sample) { showToast('Blend along spine: path too short', 'info'); return []; }

    const n = Math.max(1, Math.min(60, Math.round(steps)));
    const lerp = (x: number, y: number, t: number) => x + (y - x) * t;
    const lerpColor = (c1?: string, c2?: string, t = 0): string | undefined => {
        if (!c1 || c1 === 'transparent') return c2;
        if (!c2 || c2 === 'transparent') return c1;
        const A = parseHex(c1), B = parseHex(c2);
        return rgbToHex(lerp(A.r, B.r, t), lerp(A.g, B.g, t), lerp(A.b, B.b, t));
    };
    const tangentDeg = (pp: { tx: number; ty: number }) => Math.atan2(pp.ty, pp.tx) * 180 / Math.PI;

    pushToHistory();
    const batch = new Set<string>();
    const additions: DrawingElement[] = [];
    // Endpoints: move A → path start, B → path end (keep their own size).
    const pa = sampleAt(sample, 0), pb = sampleAt(sample, 1);
    const aEnd = { x: pa.x - a.width / 2, y: pa.y - a.height / 2, angle: orient ? tangentDeg(pa) : (a.angle || 0) };
    const bEnd = { x: pb.x - b.width / 2, y: pb.y - b.height / 2, angle: orient ? tangentDeg(pb) : (b.angle || 0) };
    // Intermediates k=1..n interpolate A→B, positioned along the spine.
    for (let k = 1; k <= n; k++) {
        const t = k / (n + 1);
        const pp = sampleAt(sample, t);
        const w = lerp(a.width, b.width, t), h = lerp(a.height, b.height, t);
        const id = generateId(a.type as any, batch); batch.add(id);
        additions.push({
            ...a, id,
            x: pp.x - w / 2, y: pp.y - h / 2, width: w, height: h,
            angle: orient ? tangentDeg(pp) : lerp(a.angle || 0, b.angle || 0, t),
            opacity: lerp(a.opacity ?? 100, b.opacity ?? 100, t),
            strokeWidth: lerp(a.strokeWidth ?? 1, b.strokeWidth ?? 1, t),
            backgroundColor: lerpColor(a.backgroundColor, b.backgroundColor, t) ?? a.backgroundColor,
            strokeColor: lerpColor(a.strokeColor, b.strokeColor, t) ?? a.strokeColor,
            groupIds: undefined, fillSwatchId: undefined, strokeSwatchId: undefined,
        } as DrawingElement);
    }
    setStore('elements', (list: DrawingElement[]) => {
        const copy = list.map(e =>
            e.id === a.id ? { ...e, ...aEnd } as DrawingElement :
            e.id === b.id ? { ...e, ...bEnd } as DrawingElement : e);
        const idx = copy.findIndex(e => e.id === a.id);
        copy.splice(idx + 1, 0, ...additions);
        return copy;
    });
    setStore('selection', [a.id, ...additions.map(x => x.id), b.id]);
    bumpDirtyRevision();
    showToast(`Blended along spine — ${n} steps`, 'success');
    return additions.map(x => x.id);
};

/** Arc-length-even resample of a closed ring to exactly `n` points. */
const resampleRing = (ring: [number, number][], n: number): [number, number][] => {
    if (ring.length < 2) return ring.slice();
    const cum = [0]; let len = 0;
    for (let i = 1; i <= ring.length; i++) {
        const a = ring[i - 1], b = ring[i % ring.length];
        len += Math.hypot(b[0] - a[0], b[1] - a[1]); cum.push(len);
    }
    if (len < 1e-6) return ring.slice();
    const out: [number, number][] = [];
    for (let k = 0; k < n; k++) {
        const target = (k / n) * len;
        let i = 1; while (i < cum.length - 1 && cum[i] < target) i++;
        const segLen = (cum[i] - cum[i - 1]) || 1, u = (target - cum[i - 1]) / segLen;
        const a = ring[(i - 1) % ring.length], b = ring[i % ring.length];
        out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
    }
    return out;
};

/** Rotate/flip ring `rb` to best-match `ra` point-for-point (minimises twist in a morph). */
const alignRing = (ra: [number, number][], rb: [number, number][]): [number, number][] => {
    const n = ra.length;
    const cost = (arr: [number, number][], off: number) => {
        let s = 0;
        for (let i = 0; i < n; i++) { const p = arr[(i + off) % n]; s += Math.hypot(p[0] - ra[i][0], p[1] - ra[i][1]); }
        return s;
    };
    const rbRev = [...rb].reverse();
    let best = { arr: rb, off: 0, c: Infinity };
    for (const arr of [rb, rbRev]) {
        for (let off = 0; off < n; off++) { const c = cost(arr, off); if (c < best.c) best = { arr, off, c }; }
    }
    return Array.from({ length: n }, (_, i) => best.arr[(i + best.off) % n]);
};

/**
 * Smooth (shape-morph) blend — Illustrator's real blend: interpolate the two shapes' OUTLINES
 * point-for-point, so a circle actually morphs into a star (not just recolours/resizes). Both
 * outlines are sampled to the same point count and aligned to minimise twist; each step is a new
 * `path` element. Selection = two shapes.
 */
export const blendShapesMorph = (ids?: string[], steps = 8): string[] => {
    const sel = ids ?? store.selection;
    const a = store.elements.find(e => e.id === sel[0]);
    const b = store.elements.find(e => e.id === sel[1]);
    if (!a || !b || a.id === b.id) { showToast('Blend: select two objects', 'info'); return []; }
    const ringA0 = elementToMultiPolygon(a)[0]?.[0];
    const ringB0 = elementToMultiPolygon(b)[0]?.[0];
    if (!ringA0 || !ringB0 || ringA0.length < 3 || ringB0.length < 3) { showToast('Blend: cannot outline these shapes', 'info'); return []; }
    const N = 120;
    const rA = resampleRing(ringA0, N);
    const rB = alignRing(rA, resampleRing(ringB0, N));

    const n = Math.max(1, Math.min(50, Math.round(steps)));
    const lerp = (x: number, y: number, t: number) => x + (y - x) * t;
    const lerpColor = (c1?: string, c2?: string, t = 0): string | undefined => {
        if (!c1 || c1 === 'transparent') return c2;
        if (!c2 || c2 === 'transparent') return c1;
        const A = parseHex(c1), B = parseHex(c2);
        return rgbToHex(lerp(A.r, B.r, t), lerp(A.g, B.g, t), lerp(A.b, B.b, t));
    };

    pushToHistory();
    const batch = new Set<string>();
    const additions: DrawingElement[] = [];
    for (let k = 1; k <= n; k++) {
        const t = k / (n + 1);
        const pts: [number, number][] = rA.map((p, i) => [lerp(p[0], rB[i][0], t), lerp(p[1], rB[i][1], t)]);
        const el = buildPathFromPoly([pts], {
            backgroundColor: lerpColor(a.backgroundColor, b.backgroundColor, t) ?? a.backgroundColor,
            fillStyle: (a.fillStyle === 'solid' || b.fillStyle === 'solid') ? 'solid' : a.fillStyle,
            strokeColor: lerpColor(a.strokeColor, b.strokeColor, t) ?? a.strokeColor,
            strokeWidth: lerp(a.strokeWidth ?? 1, b.strokeWidth ?? 1, t),
            opacity: lerp(a.opacity ?? 100, b.opacity ?? 100, t),
            renderStyle: a.renderStyle,
        }, undefined, batch);
        if (el) additions.push(el);
    }
    if (!additions.length) { showToast('Blend: could not build morph', 'info'); return []; }
    setStore('elements', (list: DrawingElement[]) => {
        const idx = list.findIndex(e => e.id === a.id);
        const copy = [...list];
        copy.splice(idx + 1, 0, ...additions);
        return copy;
    });
    setStore('selection', [a.id, ...additions.map(x => x.id), b.id]);
    bumpDirtyRevision();
    showToast(`Morph blend — ${n} steps`, 'success');
    return additions.map(x => x.id);
};

// ── Recolor artwork ──────────────────────────────────────────────────────────

export const toggleRecolorPanel = (visible?: boolean) => setPanelOpen('recolor', visible);
export const toggleVectorToolsPanel = (visible?: boolean) => {
    // Panel state (open/where) now lives in the persisted dock layout, not the old localStorage flag.
    setPanelOpen('vectorTools', visible);
};

export const toggleMeasure = (active?: boolean) => setStore('measureActive', v => active ?? !v);

export const toggleShapeBuilder = (active?: boolean) => setStore('shapeBuilderActive', v => active ?? !v);

export const toggleCutTool = (active?: boolean) => setStore('cutToolActive', v => active ?? !v);

// ── Live Paint ───────────────────────────────────────────────────────────────
// A Live Paint group is a set of source outline shapes (tagged livePaintGroupId).
// Clicking the bucket in an enclosed region creates a locked region-fill path
// (livePaintFillFor + livePaintFaceKey) beneath the outlines. The fills are kept
// in sync with the outlines by `regenerateAllLivePaint()` (run from the Live Paint
// engine effect whenever geometry changes) — so dragging a source updates the fills.

export const toggleLivePaint = (active?: boolean) => setStore('livePaintActive', v => active ?? !v);

export const toggleWidthTool = (active?: boolean) => setStore('widthToolActive', v => active ?? !v);
export const toggleCurveTool = (active?: boolean) => setStore('curveToolActive', v => active ?? !v);
export const toggleTouchType = (active?: boolean) => setStore('touchTypeActive', v => active ?? !v);
export const toggleTypeOnPath = (active?: boolean) => setStore('typeOnPathActive', v => active ?? !v);

/** Turn off every blocking tool-mode overlay (used for exclusive tool activation). Leaves the
 *  non-blocking Perspective Grid aid alone. */
export const exitAllToolModes = () => {
    const flags = ['cutToolActive', 'shapeBuilderActive', 'livePaintActive', 'widthToolActive', 'curveToolActive',
        'touchTypeActive', 'typeOnPathActive', 'sliceToolActive', 'symbolismActive', 'reshapeToolActive',
        'blobBrushActive', 'pathEraserActive', 'puppetWarpActive', 'measureActive'] as const;
    for (const f of flags) if ((store as any)[f]) setStore(f as any, false);
    if (store.sprayerActive) { setStore('sprayerActive', false); setStore('sprayerSymbolId', null); }
};

/** Type on Path — flow `text` along a line/curve/freehand element (sets curvedText + containerText). */
export const attachTextToPath = (id: string, text: string) => {
    const el = store.elements.find(e => e.id === id);
    if (!el) return;
    pushToHistory();
    setStore('elements', e => e.id === id, { containerText: text, curvedText: true, isEditing: false } as any);
    bumpDirtyRevision();
    showToast('Text attached to path', 'success');
};
export const toggleSliceTool = (active?: boolean) => setStore('sliceToolActive', v => active ?? !v);
export const toggleSymbolism = (active?: boolean) => setStore('symbolismActive', v => active ?? !v);
export const setSymbolismMode = (m: AppState['symbolismMode']) => setStore('symbolismMode', m);

/**
 * Symbolism brush — apply the active sub-tool to symbol instances within `radius` of the brush,
 * scaled by a distance falloff. Sizer scales, Spinner rotates, Shifter nudges along the drag,
 * Screener fades opacity, Stainer tints, Styler applies the current fill+stroke. Alt reverses.
 * No per-tick history (the overlay snapshots once on press).
 */
export const applySymbolism = (mode: AppState['symbolismMode'], wx: number, wy: number, radius: number, opts?: { dx?: number; dy?: number; alt?: boolean }): number => {
    const sign = opts?.alt ? -1 : 1;
    let n = 0;
    for (const el of store.elements) {
        if (el.type !== 'symbolInstance' || el.locked) continue;
        const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
        const d = Math.hypot(cx - wx, cy - wy);
        if (d > radius) continue;
        const w = 1 - d / radius; // 1 at the brush centre → 0 at the edge
        let patch: Partial<DrawingElement> = {};
        if (mode === 'sizer') { const f = 1 + 0.05 * w * sign; const nw = Math.max(2, el.width * f), nh = Math.max(2, el.height * f); patch = { width: nw, height: nh, x: cx - nw / 2, y: cy - nh / 2 }; }
        else if (mode === 'spinner') patch = { angle: (el.angle || 0) + 0.1 * w * sign };
        else if (mode === 'shifter') patch = { x: el.x + (opts?.dx || 0) * w, y: el.y + (opts?.dy || 0) * w };
        else if (mode === 'screener') patch = { opacity: Math.max(0.05, Math.min(1, (el.opacity ?? 1) - 0.05 * w * sign)) };
        else if (mode === 'stainer') patch = { backgroundColor: store.defaultElementStyles.backgroundColor };
        else if (mode === 'styler') patch = { backgroundColor: store.defaultElementStyles.backgroundColor, strokeColor: store.defaultElementStyles.strokeColor };
        setStore('elements', e => e.id === el.id, patch as any);
        n++;
    }
    if (n) bumpDirtyRevision();
    return n;
};

/**
 * Graph tool data entry — set a chart's values. Bar charts store `barValues`; pie charts map
 * the values to evenly-labelled `pieSlices`. Re-renders the chart from the new data.
 */
export const setChartData = (id: string, values: number[], labels?: string[]) => {
    const el = store.elements.find(e => e.id === id);
    if (!el) return;
    pushToHistory();
    if (el.type === 'pieChart') {
        const palette = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#84cc16'];
        const slices = values.map((v, i) => ({ label: labels?.[i] || `Item ${i + 1}`, value: v, color: palette[i % palette.length] }));
        setStore('elements', e => e.id === id, { pieSlices: slices } as any);
    } else {
        setStore('elements', e => e.id === id, { barValues: values, barLabels: labels } as any);
    }
    bumpDirtyRevision();
    showToast('Chart data updated', 'success');
};

/** Touch Type — set/merge a per-character transform on a text element (initialising the array). */
/** The Touch-Type-editable text of an element: `text` for text/richtext, else the
 *  shape's `containerText` label. */
export const touchTypeText = (el: DrawingElement): string =>
    (el.type === 'text' || el.type === 'richtext') ? (el.text || '') : (el.containerText || '');

type CharPatch = Partial<{ dx: number; dy: number; scale: number; rot: number; color: string; font: string }>;
/** Per-glyph patch: either a fixed patch or `(index, current) => patch` for
 *  relative edits (move/scale/rotate keep each glyph's own base). */
type CharPatchArg = CharPatch | ((i: number, cur: any) => CharPatch);

const _applyCharTransforms = (id: string, indices: number[], patch: CharPatchArg, record: boolean) => {
    const el = store.elements.find(e => e.id === id);
    if (!el) return;
    const len = [...touchTypeText(el)].length;
    const valid = indices.filter(i => i >= 0 && i < len);
    if (valid.length === 0) return;
    const base = (el.charTransforms && el.charTransforms.length === len)
        ? el.charTransforms.map(t => ({ ...t }))
        : Array.from({ length: len }, () => ({ dx: 0, dy: 0, scale: 1, rot: 0 }));
    for (const i of valid) {
        const p = typeof patch === 'function' ? patch(i, base[i]) : patch;
        base[i] = { ...base[i], ...p };
    }
    if (record) pushToHistory();
    setStore('elements', e => e.id === id, { charTransforms: base } as any);
    bumpDirtyRevision();
};

export const setCharTransform = (id: string, idx: number, patch: CharPatch, record = false) =>
    _applyCharTransforms(id, [idx], patch, record);

/** Apply a char transform to MANY glyph indices in one history step (multi-select).
 *  `patch` may be a `(index, current) => patch` function for per-glyph relative edits. */
export const setCharTransforms = (id: string, indices: number[], patch: CharPatchArg, record = false) =>
    _applyCharTransforms(id, indices, patch, record);

/** Reset Touch Type transforms (back to plain text). */
export const clearCharTransforms = (id: string) => {
    pushToHistory();
    setStore('elements', e => e.id === id, { charTransforms: undefined } as any);
    bumpDirtyRevision();
};
export const toggleReshapeTool = (active?: boolean) => setStore('reshapeToolActive', v => active ?? !v);
export const toggleBlobBrush = (active?: boolean) => setStore('blobBrushActive', v => active ?? !v);
export const togglePathEraser = (active?: boolean) => setStore('pathEraserActive', v => active ?? !v);
export const togglePuppetWarp = (active?: boolean) => setStore('puppetWarpActive', v => active ?? !v);
export const togglePerspectiveGrid = (active?: boolean) => {
    const next = active ?? !store.perspectiveGridActive;
    setStore('perspectiveGridActive', next);
    // Seed a sensible 2-point grid centred on the current viewport the first time it's shown.
    if (next && !store.perspectiveGrid) {
        const vs = store.viewState;
        const cx = (window.innerWidth / 2 - (vs.panX || 0)) / (vs.scale || 1);
        const cy = (window.innerHeight / 2 - (vs.panY || 0)) / (vs.scale || 1);
        const span = 600 / (vs.scale || 1);
        setStore('perspectiveGrid', { horizonY: cy - span * 0.15, leftVPx: cx - span, rightVPx: cx + span });
    }
};
export const setPerspectiveGrid = (g: Partial<{ horizonY: number; leftVPx: number; rightVPx: number }>) =>
    setStore('perspectiveGrid', (cur) => ({ ...(cur || { horizonY: 0, leftVPx: -600, rightVPx: 600 }), ...g }));

/**
 * Project the selected shapes onto a perspective plane of the 2-point grid by warping each
 * shape's bounding box into a foreshortened quad converging toward the grid's vanishing
 * point(s) — a 4-corner envelope so the existing warp render path draws the perspective.
 * plane: 'left' | 'right' wall, or 'floor' (both VPs).
 */
export const projectToPlane = (ids: string[], plane: 'left' | 'right' | 'floor'): string[] => {
    const g = store.perspectiveGrid;
    if (!g) { showToast('Turn on the Perspective Grid first', 'info'); return []; }
    const els = store.elements.filter(e => ids.includes(e.id));
    if (!els.length) return [];
    const out: string[] = [];
    pushToHistory();
    for (const el of els) {
        const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
        // bbox corners in centred-local coords
        const hw = el.width / 2, hh = el.height / 2;
        const corners = [{ x: -hw, y: -hh }, { x: hw, y: -hh }, { x: hw, y: hh }, { x: -hw, y: hh }]; // TL,TR,BR,BL
        // Foreshorten a world point toward a vanishing point by factor f (0=no move, 1=at VP).
        const toward = (px: number, py: number, vpx: number, f: number) => ({ x: px + (vpx - px) * f, y: py + (g.horizonY - py) * f });
        const warped = corners.map((c) => {
            const wx = cx + c.x, wy = cy + c.y;
            let p = { x: wx, y: wy };
            // depth across the shape: the right/upper side recedes more (simple linear factor)
            const depthX = (c.x + hw) / (2 * hw); // 0..1 left→right
            const depthY = (c.y + hh) / (2 * hh); // 0..1 top→bottom
            if (plane === 'right') p = toward(wx, wy, g.rightVPx, 0.18 * depthX);
            else if (plane === 'left') p = toward(wx, wy, g.leftVPx, 0.18 * (1 - depthX));
            else { // floor: converge both ways with depth toward the horizon (top recedes)
                const f = 0.16 * (1 - depthY);
                const m = toward(wx, wy, g.rightVPx, f);
                p = toward(m.x, m.y, g.leftVPx, f);
            }
            return { x: p.x - cx, y: p.y - cy }; // back to centred-local for warp corners
        });
        setStore('elements', e => e.id === el.id, { warp: { corners: warped } } as any);
        out.push(el.id);
    }
    bumpDirtyRevision();
    showToast(`Projected to ${plane} plane`, 'success');
    return out;
};

// ── Puppet Warp ──────────────────────────────────────────────────────────────
// Pins (centred-local) drive the existing warp grid: each grid control point is displaced by
// a Shepard (inverse-distance²) weighted blend of the pins' displacements, so dragging one pin
// bends the mesh near it while the other (unmoved) pins anchor their regions. The deformed grid
// is written to el.warp.points and the normal warp render path draws it.
const PUPPET_RC = 7; // grid resolution

const puppetRestGrid = (el: DrawingElement) => defaultWarpGrid(el.width, el.height, PUPPET_RC, PUPPET_RC).points;

const recomputePuppetGrid = (el: DrawingElement): { x: number; y: number }[] => {
    const rest = puppetRestGrid(el);
    const pins = el.puppetPins || [];
    if (!pins.length) return rest;
    return rest.map(g => {
        let nx = 0, ny = 0, den = 0;
        for (const p of pins) {
            const dx = g.x - p.baseX, dy = g.y - p.baseY;
            const w = 1 / (dx * dx + dy * dy + 1); // +1 epsilon avoids singularity at the pin
            nx += w * (p.x - p.baseX); ny += w * (p.y - p.baseY); den += w;
        }
        return den > 0 ? { x: g.x + nx / den, y: g.y + ny / den } : { x: g.x, y: g.y };
    });
};

/** Add a Puppet Warp pin at a world point (initialising the warp grid on first pin). */
export const addPuppetPin = (id: string, worldX: number, worldY: number): number => {
    const el = store.elements.find(e => e.id === id);
    if (!el) return -1;
    const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
    // un-rotate the click into the element's centred-local frame
    const ang = -(el.angle || 0), cos = Math.cos(ang), sin = Math.sin(ang);
    const rx = worldX - cx, ry = worldY - cy;
    const lx = rx * cos - ry * sin, ly = rx * sin + ry * cos;
    const pins = [...(el.puppetPins || []), { baseX: lx, baseY: ly, x: lx, y: ly }];
    pushToHistory();
    setStore('elements', e => e.id === id, (e) => ({
        puppetPins: pins,
        warp: { ...(e.warp || {}), rows: PUPPET_RC, cols: PUPPET_RC, smooth: true, points: recomputePuppetGrid({ ...e, puppetPins: pins } as DrawingElement) },
    } as any));
    bumpDirtyRevision();
    return pins.length - 1;
};

/** Move the puppet pin `idx` to a world point and re-deform the mesh (RBF over the pins). */
export const movePuppetPin = (id: string, idx: number, worldX: number, worldY: number, record = false) => {
    const el = store.elements.find(e => e.id === id);
    if (!el || !el.puppetPins || idx < 0 || idx >= el.puppetPins.length) return;
    const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
    const ang = -(el.angle || 0), cos = Math.cos(ang), sin = Math.sin(ang);
    const rx = worldX - cx, ry = worldY - cy;
    const lx = rx * cos - ry * sin, ly = rx * sin + ry * cos;
    const pins = el.puppetPins.map((p, i) => i === idx ? { ...p, x: lx, y: ly } : p);
    if (record) pushToHistory();
    setStore('elements', e => e.id === id, (e) => ({
        puppetPins: pins,
        warp: { ...(e.warp || {}), rows: PUPPET_RC, cols: PUPPET_RC, smooth: true, points: recomputePuppetGrid({ ...e, puppetPins: pins } as DrawingElement) },
    } as any));
    bumpDirtyRevision();
};

/** Remove a puppet pin (and re-deform), or clear all pins + the warp when idx is omitted. */
export const removePuppetPin = (id: string, idx?: number) => {
    const el = store.elements.find(e => e.id === id);
    if (!el) return;
    pushToHistory();
    if (idx === undefined) {
        setStore('elements', e => e.id === id, { puppetPins: undefined, warp: undefined } as any);
    } else {
        const pins = (el.puppetPins || []).filter((_, i) => i !== idx);
        setStore('elements', e => e.id === id, (e) => ({
            puppetPins: pins.length ? pins : undefined,
            warp: pins.length ? { ...(e.warp || {}), rows: PUPPET_RC, cols: PUPPET_RC, smooth: true, points: recomputePuppetGrid({ ...e, puppetPins: pins } as DrawingElement) } : undefined,
        } as any));
    }
    bumpDirtyRevision();
};

/** Build a `path` element from world-space anchors (with handles), normalized to its bbox. */
const buildPathFromAnchors = (worldAnchors: PathAnchor[], closed: boolean, style?: Partial<DrawingElement>): DrawingElement | null => {
    if (worldAnchors.length < 2) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const a of worldAnchors) {
        const xs = [a.x, a.x + (a.outX ?? 0), a.x + (a.inX ?? 0)];
        const ys = [a.y, a.y + (a.outY ?? 0), a.y + (a.inY ?? 0)];
        minX = Math.min(minX, ...xs); maxX = Math.max(maxX, ...xs);
        minY = Math.min(minY, ...ys); maxY = Math.max(maxY, ...ys);
    }
    return {
        ...store.defaultElementStyles,
        id: generateId('path'), type: 'path',
        x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY),
        pathAnchors: worldAnchors.map(a => ({ ...a, x: a.x - minX, y: a.y - minY })),
        pathClosed: closed, angle: 0, seed: Math.floor(Math.random() * 2 ** 31),
        roundness: null, locked: false, link: null, layerId: store.activeLayerId,
        backgroundColor: closed ? store.defaultElementStyles.backgroundColor : 'transparent',
        ...style,
    } as DrawingElement;
};

/**
 * Curvature tool — commit a smooth path through the clicked world points. The curve passes
 * through every point (Catmull-Rom → Bézier), matching Illustrator's Curvature tool.
 */
/** Recompute a path element's bbox (x/y/width/height) from its anchors + handles and
 *  re-offset the anchors so they stay relative to the new origin. Used after reshape/edit. */
export const normalizePathElement = (id: string) => {
    const el = store.elements.find(e => e.id === id);
    if (!el || el.type !== 'path' || !el.pathAnchors?.length) return;
    const a = el.pathAnchors;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const an of a) {
        const xs = [an.x, an.x + (an.outX ?? 0), an.x + (an.inX ?? 0)];
        const ys = [an.y, an.y + (an.outY ?? 0), an.y + (an.inY ?? 0)];
        minX = Math.min(minX, ...xs); maxX = Math.max(maxX, ...xs);
        minY = Math.min(minY, ...ys); maxY = Math.max(maxY, ...ys);
    }
    setStore('elements', e => e.id === id, {
        x: el.x + minX, y: el.y + minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY),
        pathAnchors: a.map(an => ({ ...an, x: an.x - minX, y: an.y - minY })),
    } as any);
    bumpDirtyRevision();
};

export const commitCurvature = (worldPts: { x: number; y: number }[], closed = false): string | null => {
    if (worldPts.length < 2) return null;
    const el = buildPathFromAnchors(catmullRomAnchors(worldPts, closed), closed);
    if (!el) return null;
    pushToHistory();
    setStore('elements', list => [...list, el]);
    setStore('selection', [el.id]);
    bumpDirtyRevision();
    return el.id;
};

/**
 * Blob Brush — turn a brushed stroke into a filled shape (union of disks along the path), and
 * merge it with any overlapping existing shape of the same fill colour (Illustrator's Blob
 * Brush behaviour). `radius` is the half-thickness in world units.
 */
export const commitBlobStroke = (worldPts: { x: number; y: number }[], radius: number): string | null => {
    if (!worldPts.length) return null;
    const color = (store.defaultElementStyles.backgroundColor && store.defaultElementStyles.backgroundColor !== 'transparent')
        ? store.defaultElementStyles.backgroundColor : (store.defaultElementStyles.strokeColor || '#111111');
    // Resample so consecutive disks overlap (spacing < radius) — densify sparse drags AND
    // thin out dense ones. Cap the point count so the union stays fast on long strokes.
    // Tight spacing + many-sided disks so the union outline barely scallops, then Chaikin-smooth
    // the result → smooth blob edges (vs the bumpy union of a few coarse disks).
    let step = radius * 0.3;
    let total = 0; for (let i = 1; i < worldPts.length; i++) total += Math.hypot(worldPts[i].x - worldPts[i - 1].x, worldPts[i].y - worldPts[i - 1].y);
    if (total / step > 600) step = total / 600;
    const pts: { x: number; y: number }[] = [worldPts[0]];
    for (let i = 1; i < worldPts.length; i++) {
        const a = worldPts[i - 1], b = worldPts[i];
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        const n = Math.max(1, Math.ceil(d / step));
        for (let k = 1; k <= n; k++) pts.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
    }
    if (pts.length === 1) pts.push({ x: pts[0].x + 0.1, y: pts[0].y });
    const disks: Poly[] = pts.map(p => [diskRing(p.x, p.y, radius, 32)]);
    const blob = unionPolys(disks);
    if (!blob.length) return null;
    // Smooth the union outline as actual Bézier curves (not a faceted polygon): RDP-simplify
    // away the scallop/union noise, then fit a closed Catmull-Rom spline through the survivors.
    const smoothEps = radius * 0.1;

    const style: Partial<DrawingElement> = { backgroundColor: color, fillStyle: 'solid', strokeColor: color, strokeWidth: 0, renderStyle: store.defaultElementStyles.renderStyle };
    const created: DrawingElement[] = [];
    const batchIds = new Set<string>();
    for (const poly of blob) { const p = buildPathFromPoly(poly, style, smoothEps, batchIds); if (p) created.push(p); }
    if (!created.length) return null;

    // Merge only with same-colour paths the new blob GENUINELY touches — a bbox prefilter then a
    // real geometric-intersection test, so a fresh stroke never sweeps in (and re-selects) blobs
    // it merely bbox-overlaps but doesn't actually touch.
    const bbox = { x0: Math.min(...created.map(e => e.x)), y0: Math.min(...created.map(e => e.y)), x1: Math.max(...created.map(e => e.x + e.width)), y1: Math.max(...created.map(e => e.y + e.height)) };
    const overlap = store.elements.filter(e => e.type === 'path' && (e.backgroundColor || '') === color && !e.livePaintFillFor &&
        e.x < bbox.x1 && e.x + e.width > bbox.x0 && e.y < bbox.y1 && e.y + e.height > bbox.y0 &&
        polysIntersect(blob, elementToMultiPolygon(e)));

    pushToHistory();
    setStore('elements', list => [...list, ...created]);
    if (overlap.length) {
        const ids = [...overlap.map(e => e.id), ...created.map(e => e.id)];
        const merged = runBooleanOp(store.elements.filter(e => ids.includes(e.id)), 'union');
        if (merged.length) {
            const mergeBatch = new Set<string>();
            const mergedEls = merged.map(poly => buildPathFromPoly(poly, style, smoothEps, mergeBatch)).filter(Boolean) as DrawingElement[];
            setStore('elements', list => [...list.filter(e => !ids.includes(e.id)), ...mergedEls]);
            setStore('selection', mergedEls.map(e => e.id));
            bumpDirtyRevision();
            return mergedEls[0]?.id ?? null;
        }
    }
    setStore('selection', created.map(e => e.id));
    bumpDirtyRevision();
    return created[0].id;
};

/**
 * Path Eraser — destructively carve a swath (union of disks along the drag) out of every shape
 * it overlaps, via boolean difference (Illustrator's Eraser on filled art). Shapes fully erased
 * are removed; the rest are replaced by the carved geometry, preserving z-order. `radius` is the
 * eraser half-width in world units.
 */
export const commitPathErase = (worldPts: { x: number; y: number }[], radius: number): string[] => {
    if (!worldPts.length) return [];
    let step = radius * 0.5;
    let total = 0; for (let i = 1; i < worldPts.length; i++) total += Math.hypot(worldPts[i].x - worldPts[i - 1].x, worldPts[i].y - worldPts[i - 1].y);
    if (total / step > 400) step = total / 400;
    const pts: { x: number; y: number }[] = [worldPts[0]];
    for (let i = 1; i < worldPts.length; i++) {
        const a = worldPts[i - 1], b = worldPts[i];
        const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
        for (let k = 1; k <= n; k++) pts.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
    }
    if (pts.length === 1) pts.push({ x: pts[0].x + 0.1, y: pts[0].y });
    const swath = unionPolys(pts.map(p => [diskRing(p.x, p.y, radius, 14)]));
    if (!swath.length) return [];
    let sx0 = Infinity, sy0 = Infinity, sx1 = -Infinity, sy1 = -Infinity;
    for (const poly of swath) for (const [x, y] of poly[0]) { sx0 = Math.min(sx0, x); sy0 = Math.min(sy0, y); sx1 = Math.max(sx1, x); sy1 = Math.max(sy1, y); }

    const targets = store.elements.filter(e => !e.locked && !e.livePaintFillFor &&
        e.x < sx1 && e.x + e.width > sx0 && e.y < sy1 && e.y + e.height > sy0);
    const consumed: string[] = [];
    const created: DrawingElement[] = [];
    const batchIds = new Set<string>();
    for (const el of targets) {
        const mp = elementToMultiPolygon(el);
        if (!mp.length) continue;
        const result = subtractPolys(mp, swath);
        // unchanged (swath missed the actual geometry) → leave it alone
        if (result.length === mp.length && result.length === 1 && result[0][0].length === mp[0][0].length) continue;
        consumed.push(el.id);
        const style: Partial<DrawingElement> = {
            strokeColor: el.strokeColor, backgroundColor: el.backgroundColor, fillStyle: el.fillStyle,
            strokeWidth: el.strokeWidth, strokeStyle: el.strokeStyle, renderStyle: el.renderStyle,
            opacity: el.opacity, roughness: el.roughness, layerId: el.layerId,
        };
        for (const poly of result) { const p = buildPathFromPoly(poly, style, undefined, batchIds); if (p) created.push(p); }
    }
    if (!consumed.length) return [];
    pushToHistory();
    replaceElementsPreservingOrder(consumed, created);
    setStore('selection', created.map(e => e.id));
    bumpDirtyRevision();
    return created.map(e => e.id);
};

/**
 * Width tool — set a stroke-width point at parameter `t` (0..1) along an open path. Width
 * points within 0.04 of an existing one are merged (so a drag refines in place). A non-path
 * shape is converted to a path first. Width 0 removes nearby points (eraser-ish).
 */
export const setWidthPoint = (id: string, t: number, width: number): boolean => {
    const target = store.elements.find(e => e.id === id);
    if (!target) return false;
    // Validate convertibility + open-ness FIRST so we never push a phantom/partial undo step.
    let conv: ReturnType<typeof shapeToPath> = null;
    if (target.type !== 'path') {
        conv = shapeToPath(target);
        if (!conv) { showToast('Width tool: needs a path', 'info'); return false; }
        if (conv.closed) { showToast('Width tool: open paths only', 'info'); return false; }
    } else if (target.pathClosed) { showToast('Width tool: open paths only', 'info'); return false; }

    const existing = (target.widthProfile as { t: number; width: number }[]) || [];
    const profile = [...existing].filter(p => Math.abs(p.t - t) > 0.04);
    if (width > 0.5) profile.push({ t: Math.max(0, Math.min(1, t)), width });
    profile.sort((a, b) => a.t - b.t);

    pushToHistory(); // single, guaranteed-real mutation from here
    if (conv) setStore('elements', e => e.id === id, { type: 'path', pathAnchors: conv!.anchors, pathClosed: conv!.closed, points: undefined, controlPoints: undefined } as any);
    setStore('elements', e => e.id === id, { widthProfile: profile.length ? profile : undefined } as any);
    bumpDirtyRevision();
    return true;
};

/** Reset variable width — drop the width profile, back to a uniform stroke. */
export const clearWidthProfile = (ids: string[]) => {
    pushToHistory();
    setStore('elements', e => ids.includes(e.id), { widthProfile: undefined } as any);
    bumpDirtyRevision();
    showToast('Width reset', 'success');
};

/**
 * Vertical Type — toggle stacked text orientation on a text element AND resize the element's
 * box to fit, so the selection bounds, hit-testing and rendering all agree. Turning it on
 * sizes to the measured columns; turning it off re-flows to a normal horizontal box.
 */
export const setTextVertical = (id: string, on?: boolean): boolean => {
    const el = store.elements.find(e => e.id === id);
    if (!el || (el.type !== 'text' && el.type !== 'richtext')) { showToast('Vertical Type: select a text object', 'info'); return false; }
    const next = on ?? !el.verticalText;
    pushToHistory();
    if (next) {
        const v = measureVerticalText(el);
        setStore('elements', e => e.id === id, { verticalText: true, width: Math.round(v.width), height: Math.round(v.height) } as any);
    } else {
        const w = Math.max(40, Math.round(measureMaxLineWidth(el) + 12));
        const h = Math.max((el.fontSize || 28) * 1.2, measureWrappedTextHeight(el.text || '', w, el.fontSize || 28, el.fontFamily, el.letterSpacing));
        setStore('elements', e => e.id === id, { verticalText: false, width: w, height: Math.round(h) } as any);
    }
    bumpDirtyRevision();
    return true;
};
const _livePaintSig = new Map<string, string>();

const _livePaintMembers = (groupId: string) => store.elements.filter(e => e.livePaintGroupId === groupId);
// Cheap per-member geometry token: bbox + angle catches move/scale/rotate; the anchor/point
// count + coordinate checksum catches in-place node edits and warp changes that keep the bbox.
const _geomToken = (m: DrawingElement): string => {
    const pts = (m.pathAnchors as any[]) || (m.points as any[]) || [];
    let sum = 0; for (const p of pts) sum += (p.x || 0) + (p.y || 0) + (p.inX || 0) + (p.outX || 0);
    return `${pts.length}:${Math.round(sum)}:${m.warp ? (m.warp.points?.length ?? 0) : 0}:${m.polygonSides || ''}:${m.starPoints || ''}`;
};
const _memberSig = (members: DrawingElement[]) => members
    .map(m => `${m.id}:${Math.round(m.x)},${Math.round(m.y)},${Math.round(m.width)},${Math.round(m.height)},${Math.round((m.angle || 0) * 100)}:${_geomToken(m)}`)
    .sort().join('|');

const _buildLivePaintFill = (poly: Poly, groupId: string, faceKey: string, color: string, batchIds?: Set<string>): DrawingElement | null => {
    const fill = buildPathFromPoly(poly, {
        backgroundColor: color, fillStyle: 'solid', strokeColor: 'transparent', strokeWidth: 0,
        renderStyle: 'architectural', layerId: _livePaintMembers(groupId)[0]?.layerId ?? store.activeLayerId,
    }, undefined, batchIds);
    if (!fill) return null;
    return { ...fill, locked: true, livePaintFillFor: groupId, livePaintFaceKey: faceKey } as DrawingElement;
};

/** Turn the selected (≥2) shapes into a Live Paint group. Returns the group id. */
export const makeLivePaint = (ids: string[]): string | null => {
    const members = store.elements.filter(e => ids.includes(e.id) && !e.livePaintFillFor);
    if (members.length < 2) { showToast('Live Paint: select 2+ shapes', 'info'); return null; }
    const existing = members.find(m => m.livePaintGroupId)?.livePaintGroupId;
    const groupId = existing || generateId('lpg' as any);
    pushToHistory();
    setStore('elements', e => ids.includes(e.id) && !e.livePaintFillFor, { livePaintGroupId: groupId } as any);
    showToast('Live Paint group created — click regions to fill', 'success');
    return groupId;
};

/**
 * Live Paint Bucket — fill the enclosed region at `point` with `color` (defaults to the
 * active fill). If the clicked shapes aren't a Live Paint group yet, the current selection
 * (or the shapes under the point) is converted to one first.
 */
export const livePaintFillAt = (point: { x: number; y: number }, color?: string): string | null => {
    const fillColor = color || store.defaultElementStyles.backgroundColor || '#cccccc';
    const faceAt = (members: DrawingElement[]) => computeShapeFaces(members).find(f => pointInMultiPoly(f.region as any, point.x, point.y));

    // Resolve by FACE containment (not hit-test — Live Paint shapes are often unfilled
    // outlines whose interior wouldn't register a hit). Prefer an existing group whose
    // face contains the point; else build one from the selection / shapes under the point.
    let groupId: string | null = null;
    let face = undefined as ReturnType<typeof faceAt>;
    for (const g of new Set(store.elements.filter(e => e.livePaintGroupId && !e.livePaintFillFor).map(e => e.livePaintGroupId!))) {
        const f = faceAt(_livePaintMembers(g));
        if (f) { groupId = g; face = f; break; }
    }
    if (!groupId) {
        let candidates = store.selection.map(id => store.elements.find(e => e.id === id)).filter((e): e is DrawingElement => !!e && !e.livePaintFillFor);
        if (candidates.length < 2) candidates = store.elements.filter(e => !e.livePaintFillFor && !e.livePaintGroupId);
        if (candidates.length > 8) { showToast('Live Paint: limited to 8 source shapes per group', 'info'); return null; }
        if (candidates.length >= 2 && faceAt(candidates)) {
            groupId = makeLivePaint(candidates.map(e => e.id));
            if (groupId) face = faceAt(_livePaintMembers(groupId));
        }
    }
    if (!groupId) { showToast('Live Paint: select 2+ overlapping shapes first', 'info'); return null; }
    if (!face) { showToast('Live Paint: no enclosed region here', 'info'); return null; }

    pushToHistory();
    // Update an existing fill for this face, or insert new fills (one per disjoint piece) below members.
    const hasExisting = store.elements.some(e => e.livePaintFillFor === groupId && e.livePaintFaceKey === face.key);
    if (hasExisting) {
        setStore('elements', e => e.livePaintFillFor === groupId && e.livePaintFaceKey === face.key, { backgroundColor: fillColor, fillSwatchId: undefined } as any);
    } else {
        const fillBatch = new Set<string>();
        const newFills = (face.region as Poly[]).map(poly => _buildLivePaintFill(poly, groupId!, face.key, fillColor, fillBatch)).filter(Boolean) as DrawingElement[];
        setStore('elements', list => {
            const firstMemberIdx = list.findIndex(e => e.livePaintGroupId === groupId);
            const at = firstMemberIdx < 0 ? list.length : firstMemberIdx;
            return [...list.slice(0, at), ...newFills, ...list.slice(at)];
        });
    }
    _livePaintSig.set(groupId, _memberSig(_livePaintMembers(groupId))); // fills now match current geometry
    bumpDirtyRevision();
    return groupId;
};

/**
 * Recompute every Live Paint group's fills from the current outline geometry. Cheap when
 * nothing moved (per-group signature guard). Called by the Live Paint engine effect.
 */
export const regenerateAllLivePaint = () => {
    // Collect group ids from BOTH source members and fills, so a group whose members were
    // all deleted (leaving orphan fills) is still detected and cleaned up.
    const groupIds = new Set<string>();
    for (const e of store.elements) {
        if (e.livePaintGroupId && !e.livePaintFillFor) groupIds.add(e.livePaintGroupId);
        if (e.livePaintFillFor) groupIds.add(e.livePaintFillFor);
    }
    if (!groupIds.size) { _livePaintSig.clear(); return; }

    let changed = false;
    for (const groupId of groupIds) {
        const members = _livePaintMembers(groupId);
        if (members.length < 2) {
            // Group dissolved (deleted down to <2 shapes) → drop any orphan region fills.
            if (store.elements.some(e => e.livePaintFillFor === groupId)) {
                setStore('elements', list => list.filter(e => e.livePaintFillFor !== groupId));
                changed = true;
            }
            _livePaintSig.delete(groupId);
            continue;
        }
        const sig = _memberSig(members);
        if (_livePaintSig.get(groupId) === sig) continue; // unchanged → skip
        changed = true;

        // colour map from existing fills (base face key → colour), then rebuild geometry.
        const colorByFace = new Map<string, string>();
        for (const e of store.elements) {
            if (e.livePaintFillFor === groupId && e.livePaintFaceKey) colorByFace.set(e.livePaintFaceKey, e.backgroundColor || '#cccccc');
        }
        const faces = computeShapeFaces(members);
        const faceByKey = new Map(faces.map(f => [f.key, f]));
        const rebuilt: DrawingElement[] = [];
        const rebuildBatch = new Set<string>();
        for (const [key, color] of colorByFace) {
            const face = faceByKey.get(key);
            if (!face) continue; // region no longer exists (topology changed) → drop its fill
            for (const poly of face.region as Poly[]) {
                const fill = _buildLivePaintFill(poly, groupId, key, color, rebuildBatch);
                if (fill) rebuilt.push(fill);
            }
        }
        setStore('elements', list => {
            const others = list.filter(e => e.livePaintFillFor !== groupId);
            const firstMemberIdx = others.findIndex(e => e.livePaintGroupId === groupId);
            const at = firstMemberIdx < 0 ? others.length : firstMemberIdx;
            return [...others.slice(0, at), ...rebuilt, ...others.slice(at)];
        });
        _livePaintSig.set(groupId, sig);
    }
    if (changed) bumpDirtyRevision();
};

/** Release a Live Paint group: keep the region fills as plain shapes, drop the live link. */
export const releaseLivePaint = (groupId: string) => {
    pushToHistory();
    setStore('elements', e => e.livePaintGroupId === groupId || e.livePaintFillFor === groupId,
        { livePaintGroupId: undefined, livePaintFillFor: undefined, livePaintFaceKey: undefined, locked: false } as any);
    _livePaintSig.delete(groupId);
    showToast('Live Paint released', 'success');
};

/** Live Paint Selection — resolve the face under a world point: its group, key, region, and
 *  the fill element painting it (null if unpainted). For selecting/recolouring/deleting faces. */
export const livePaintFaceAt = (point: { x: number; y: number }): { groupId: string; faceKey: string; region: Poly[]; fillId: string | null } | null => {
    for (const g of new Set(store.elements.filter(e => e.livePaintGroupId && !e.livePaintFillFor).map(e => e.livePaintGroupId!))) {
        const members = _livePaintMembers(g);
        const face = computeShapeFaces(members).find(f => pointInMultiPoly(f.region as any, point.x, point.y));
        if (face) {
            const fill = store.elements.find(e => e.livePaintFillFor === g && e.livePaintFaceKey === face.key);
            return { groupId: g, faceKey: face.key, region: face.region as Poly[], fillId: fill?.id ?? null };
        }
    }
    return null;
};

/** Delete the fill of the Live Paint face under a point (back to the bare outline there). */
export const deleteLivePaintFaceAt = (point: { x: number; y: number }): boolean => {
    const r = livePaintFaceAt(point);
    if (!r || !r.fillId) return false;
    pushToHistory();
    setStore('elements', list => list.filter(e => e.id !== r.fillId));
    bumpDirtyRevision();
    showToast('Live Paint: face cleared', 'success');
    return true;
};

/** Turn on the Symbol Sprayer for `symbolId` (defaults to the first symbol). Pass nothing to toggle off. */
export const toggleSymbolSprayer = (symbolId?: string) => {
    if (symbolId === undefined) { setStore('sprayerActive', false); setStore('sprayerSymbolId', null); return; }
    const id = symbolId || store.symbols[0]?.id || null;
    setStore('sprayerSymbolId', id);
    setStore('sprayerActive', !!id);
    if (!id) showToast('Sprayer: no symbol to spray', 'info');
};

/**
 * Symbol Sprayer — batch-place instances of `symbolId` at the given world points (with
 * per-instance size + rotation jitter), as one history step. Used by the sprayer overlay
 * which samples points along the drag spaced by the brush radius.
 */
export const spraySymbolInstances = (symbolId: string, pts: { x: number; y: number }[], opts?: { scaleJitter?: number; rotateJitter?: number }): string[] => {
    const sym = store.symbols.find(s => s.id === symbolId);
    if (!sym || !pts.length) return [];
    const sj = opts?.scaleJitter ?? 0.35, rj = opts?.rotateJitter ?? 0;
    const created: DrawingElement[] = pts.map(p => {
        const scale = 1 + (Math.random() * 2 - 1) * sj;
        const w = Math.max(2, sym.width * scale), h = Math.max(2, sym.height * scale);
        return {
            ...store.defaultElementStyles,
            id: generateId('symi' as any), type: 'symbolInstance', symbolId,
            x: p.x - w / 2, y: p.y - h / 2, width: w, height: h,
            angle: rj ? (Math.random() * 2 - 1) * rj : 0,
            seed: 1, roundness: null, locked: false, link: null, layerId: store.activeLayerId,
        } as DrawingElement;
    });
    pushToHistory();
    setStore('elements', list => [...list, ...created]);
    setStore('selection', created.map(c => c.id));
    bumpDirtyRevision();
    showToast(`Sprayed ${created.length}`, 'success');
    return created.map(c => c.id);
};

/**
 * Knife — slice the target shapes along the line p0→p1 into separate pieces. Targets
 * default to the selection, or all shapes the line crosses when nothing is selected.
 * Each shape that the line genuinely divides is replaced by its two (or more) pieces.
 */
/**
 * Replace `consumedIds` with `created`, inserting the results at the z-position of the FIRST
 * consumed element — Illustrator preserves stacking order through Pathfinder / Knife / Distort
 * / Shape Builder, rather than promoting results to the top of the stack.
 */
const replaceElementsPreservingOrder = (consumedIds: string[], created: DrawingElement[]) => {
    const consumed = new Set(consumedIds);
    setStore('elements', list => {
        let insertAt = 0, seenFirst = false;
        const others: DrawingElement[] = [];
        for (const e of list) {
            if (consumed.has(e.id)) { if (!seenFirst) { seenFirst = true; insertAt = others.length; } continue; }
            others.push(e);
        }
        if (!seenFirst) insertAt = others.length;
        return [...others.slice(0, insertAt), ...created, ...others.slice(insertAt)];
    });
};

export const knifeCut = (p0: { x: number; y: number }, p1: { x: number; y: number }, ids?: string[]): string[] => {
    const pa: [number, number] = [p0.x, p0.y], pb: [number, number] = [p1.x, p1.y];
    const targets = (ids && ids.length ? store.elements.filter(e => ids.includes(e.id))
        : store.elements).filter(e => !e.locked);
    const created: DrawingElement[] = [];
    const consumed: string[] = [];
    const batchIds = new Set<string>();
    for (const el of targets) {
        const mp = elementToMultiPolygon(el);
        if (!mp.length) continue;
        const [pos, neg] = splitMultiPolyByLine(mp, pa, pb);
        if (!pos.length || !neg.length) continue; // line didn't divide this shape
        consumed.push(el.id);
        const style: Partial<DrawingElement> = {
            strokeColor: el.strokeColor, backgroundColor: el.backgroundColor, fillStyle: el.fillStyle,
            strokeWidth: el.strokeWidth, strokeStyle: el.strokeStyle, renderStyle: el.renderStyle,
            opacity: el.opacity, roughness: el.roughness, layerId: el.layerId,
        };
        for (const poly of [...pos, ...neg]) {
            const path = buildPathFromPoly(poly, style, undefined, batchIds);
            if (path) created.push(path);
        }
    }
    if (!created.length) { showToast('Knife: line did not cross a shape', 'info'); return []; }
    pushToHistory();
    replaceElementsPreservingOrder(consumed, created);
    setStore('selection', created.map(c => c.id));
    showToast(`Knife: ${created.length} pieces`, 'success');
    return created.map(c => c.id);
};

/**
 * Scissors — split a path at the anchor nearest `point`. A closed path opens there (one
 * open path); an open path splits into two. Non-path shapes are converted first.
 */
export const splitPathAt = (id: string, point: { x: number; y: number }): string[] => {
    const el = store.elements.find(e => e.id === id);
    if (!el) return [];
    let anchors: { x: number; y: number; [k: string]: any }[] | undefined;
    let closed = false;
    if (el.type === 'path' && el.pathAnchors?.length) { anchors = el.pathAnchors as any; closed = !!el.pathClosed; }
    else { const r = shapeToPath(el); if (!r) { showToast('Scissors: cannot split this shape', 'info'); return []; } anchors = r.anchors as any; closed = r.closed; }
    if (!anchors || anchors.length < 3) { showToast('Scissors: path too short', 'info'); return []; }
    // anchors are element-local (origin at el.x,el.y); compare in local space
    const lx = point.x - el.x, ly = point.y - el.y;
    let best = 0, bestD = Infinity;
    anchors.forEach((a, i) => { const d = (a.x - lx) ** 2 + (a.y - ly) ** 2; if (d < bestD) { bestD = d; best = i; } });

    const mk = (subAnchors: any[]): DrawingElement | null => {
        if (subAnchors.length < 2) return null;
        const xs = subAnchors.map(a => a.x), ys = subAnchors.map(a => a.y);
        const minX = Math.min(...xs), minY = Math.min(...ys);
        return {
            ...el, id: generateId('path'), type: 'path',
            x: el.x + minX, y: el.y + minY,
            width: Math.max(1, Math.max(...xs) - minX), height: Math.max(1, Math.max(...ys) - minY),
            pathAnchors: subAnchors.map(a => ({ ...a, x: a.x - minX, y: a.y - minY })),
            pathClosed: false, pathSubpaths: undefined, points: undefined, controlPoints: undefined,
            // The pieces are a different length/identity, so width-profile t's and live-paint
            // links no longer apply — drop them rather than mis-applying.
            widthProfile: undefined, livePaintGroupId: undefined, livePaintFillFor: undefined, livePaintFaceKey: undefined,
        } as DrawingElement;
    };

    const created: DrawingElement[] = [];
    if (closed) {
        const rotated = [...anchors.slice(best), ...anchors.slice(0, best), anchors[best]];
        const p = mk(rotated); if (p) created.push(p);
    } else {
        const a = mk(anchors.slice(0, best + 1)); const b = mk(anchors.slice(best));
        if (a) created.push(a); if (b) created.push(b);
    }
    if (!created.length) { showToast('Scissors: nothing to split', 'info'); return []; }
    pushToHistory();
    replaceElementsPreservingOrder([id], created);
    setStore('selection', created.map(c => c.id));
    showToast('Scissors: split', 'success');
    return created.map(c => c.id);
};

/** Distinct solid fill/stroke colours used across the given elements, each with
 *  a usage count (most-used first) — the palette for Recolor Artwork. */
export const getSelectionColors = (ids?: string[]): { color: string; count: number }[] => {
    const sel = ids ?? store.selection;
    const counts = new Map<string, number>();
    for (const e of store.elements) {
        if (!sel.includes(e.id)) continue;
        for (const c of [e.backgroundColor, e.strokeColor]) {
            if (isSolidColor(c)) counts.set(c, (counts.get(c) || 0) + 1);
        }
        for (const s of e.gradientStops || []) {
            if (isSolidColor(s.color)) counts.set(s.color, (counts.get(s.color) || 0) + 1);
        }
    }
    return [...counts.entries()].map(([color, count]) => ({ color, count })).sort((a, b) => b.count - a.count);
};

/** Replace every occurrence of `from` (fill, stroke, gradient stop) with `to`
 *  across the selection. */
export const recolorSelectionColor = (from: string, to: string, ids?: string[], record = true) => {
    const sel = ids ?? store.selection;
    if (sel.length === 0 || from === to) return;
    if (record) pushToHistory(); // live drags pass record=false and snapshot once up front
    setStore('elements', (e: DrawingElement) => sel.includes(e.id), (e: DrawingElement) => {
        const patch: Partial<DrawingElement> = {};
        if (e.backgroundColor === from) { patch.backgroundColor = to; patch.fillSwatchId = undefined; }
        if (e.strokeColor === from) { patch.strokeColor = to; patch.strokeSwatchId = undefined; }
        if (e.gradientStops?.some(s => s.color === from)) {
            patch.gradientStops = e.gradientStops.map(s => s.color === from ? { ...s, color: to } : s);
        }
        return patch;
    });
    bumpDirtyRevision();
};

/** Apply a global HSL transform to every fill/stroke/gradient colour in the
 *  selection (hue shift in degrees, lightness delta −1..1, saturation factor). */
export const adjustSelectionColors = (opts: { hue?: number; lightness?: number; saturation?: number }, ids?: string[]) => {
    const sel = ids ?? store.selection;
    if (sel.length === 0) return;
    const tx = (c?: string): string | undefined => {
        if (!isSolidColor(c)) return c;
        let out = c;
        if (opts.hue) out = shiftHexHue(out, opts.hue);
        if (opts.saturation !== undefined && opts.saturation !== 1) out = adjustHexSaturation(out, opts.saturation);
        if (opts.lightness) out = adjustHexLightness(out, opts.lightness);
        return out;
    };
    pushToHistory();
    setStore('elements', (e: DrawingElement) => sel.includes(e.id), (e: DrawingElement) => {
        const patch: Partial<DrawingElement> = { backgroundColor: tx(e.backgroundColor), strokeColor: tx(e.strokeColor) };
        if (e.gradientStops) patch.gradientStops = e.gradientStops.map(s => ({ ...s, color: tx(s.color) || s.color }));
        return patch;
    });
    bumpDirtyRevision();
};

/**
 * Recolor: "change colour order randomly" — re-assign the selection's distinct
 * colours to each other (a guaranteed derangement: every colour moves), preserving
 * the palette but reshuffling which shape gets which. Returns the colour count.
 */
export const shuffleSelectionColors = (ids?: string[]): number => {
    const sel = ids ?? store.selection;
    const colors = getSelectionColors(sel).map(c => c.color);
    const n = colors.length;
    if (n < 2) { showToast('Need ≥2 colours to shuffle', 'info'); return n; }
    // Random rotation by k∈[1,n-1] — never identity, so the order always changes.
    const k = 1 + Math.floor(Math.random() * (n - 1));
    const map = new Map<string, string>();
    colors.forEach((c, i) => map.set(c, colors[(i + k) % n]));
    pushToHistory();
    const tx = (c?: string) => (c && map.has(c) ? map.get(c)! : c);
    setStore('elements', (e: DrawingElement) => sel.includes(e.id), (e: DrawingElement) => {
        const patch: Partial<DrawingElement> = {};
        if (e.backgroundColor && map.has(e.backgroundColor)) { patch.backgroundColor = tx(e.backgroundColor); patch.fillSwatchId = undefined; }
        if (e.strokeColor && map.has(e.strokeColor)) { patch.strokeColor = tx(e.strokeColor); patch.strokeSwatchId = undefined; }
        if (e.gradientStops?.some(s => map.has(s.color))) {
            patch.gradientStops = e.gradientStops.map(s => map.has(s.color) ? { ...s, color: tx(s.color)! } : s);
        }
        return patch;
    });
    bumpDirtyRevision();
    showToast('Shuffled colours', 'success');
    return n;
};

/**
 * Map the selection's distinct colours onto a target palette (cycling through it),
 * e.g. a harmony, a swatch group, or a palette extracted from an image. Atomic
 * remap keyed on original values. Returns the number of colours remapped.
 */
export const applyPaletteToSelection = (palette: string[], ids?: string[]): number => {
    const sel = ids ?? store.selection;
    const colors = getSelectionColors(sel).map(c => c.color);
    const pal = (palette || []).filter(isSolidColor);
    if (colors.length === 0 || pal.length === 0) { showToast('Need a selection and a palette', 'info'); return 0; }
    const map = new Map<string, string>();
    colors.forEach((c, i) => map.set(c, pal[i % pal.length]));
    const tx = (c?: string) => (c && map.has(c) ? map.get(c)! : c);
    pushToHistory();
    setStore('elements', (e: DrawingElement) => sel.includes(e.id), (e: DrawingElement) => {
        const patch: Partial<DrawingElement> = {};
        if (e.backgroundColor && map.has(e.backgroundColor)) { patch.backgroundColor = tx(e.backgroundColor); patch.fillSwatchId = undefined; }
        if (e.strokeColor && map.has(e.strokeColor)) { patch.strokeColor = tx(e.strokeColor); patch.strokeSwatchId = undefined; }
        if (e.gradientStops?.some(s => map.has(s.color))) {
            patch.gradientStops = e.gradientStops.map(s => map.has(s.color) ? { ...s, color: tx(s.color)! } : s);
        }
        return patch;
    });
    bumpDirtyRevision();
    showToast(`Recoloured with ${pal.length}-colour palette`, 'success');
    return map.size;
};

/** Apply the source object's style to the armed targets, then disarm. */
export const applyEyedropperFrom = (sourceId: string, colorOnly = false) => {
    const ed = store.eyedropper;
    if (!ed.active) return;
    const src = store.elements.find(e => e.id === sourceId);
    const targets = ed.targets.filter(id => id !== sourceId && store.elements.some(e => e.id === id));
    if (src && targets.length) {
        // Shift-click (colorOnly) samples just the fill colour as a solid fill,
        // Illustrator-style; a plain click copies the entire appearance.
        const style = colorOnly
            ? { backgroundColor: src.backgroundColor, fillStyle: 'solid' as const }
            : getStyleSnapshot(src);
        pushToHistory();
        setStore('elements', (e: DrawingElement) => targets.includes(e.id), () => ({ ...style }));
        bumpDirtyRevision();
        showToast(colorOnly ? 'Colour applied' : 'Style applied', 'success');
    }
    cancelEyedropper();
};

export const alignSelectedElements = (type: AlignmentType, keyId?: string) => {
    if (store.selection.length < 2) return;
    // Align-to-key: with the toggle on, the key object is the last-selected
    // element (it stays put; the rest align to it).
    const key = keyId ?? (store.alignToKeyObject ? store.selection[store.selection.length - 1] : undefined);
    const updates = calculateAlignment(store.selection, store.elements, type, key);
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

/** Distribute by equal edge-to-edge spacing (or a fixed `gap` px between each). */
export const distributeSpacing = (type: DistributionType, gap?: number) => {
    if (store.selection.length < (gap !== undefined ? 2 : 3)) return;
    const updates = calculateSpacingDistribution(store.selection, store.elements, type, gap);
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

/**
 * Load a Canva-style design template: fixed page size, one frame per page,
 * loaded as a `design` document.
 */
export const loadDesignTemplate = (template: {
    metadata?: { name?: string };
    pageSize: { width: number; height: number };
    pages: Array<{
        name: string;
        backgroundColor?: string;
        fillStyle?: string;
        gradientStops?: any[];
        gradientDirection?: number;
        elements: Partial<DrawingElement>[];
    }>;
}) => {
    const { width: pw, height: ph } = template.pageSize;
    const gap = 80;
    const allElements: DrawingElement[] = [];
    const slides: Slide[] = [];

    template.pages.forEach((pageTemplate, index) => {
        const spatialX = index * (pw + gap);

        const pageElements = pageTemplate.elements.map(el => ({
            ...el,
            x: (el.x || 0) + spatialX,
            y: el.y || 0,
        })) as DrawingElement[];
        allElements.push(...pageElements);

        slides.push({
            id: generateId('slide'),
            name: pageTemplate.name || `Page ${index + 1}`,
            spatialPosition: { x: spatialX, y: 0 },
            dimensions: { width: pw, height: ph },
            order: index,
            backgroundColor: pageTemplate.backgroundColor || '',
            fillStyle: (pageTemplate.fillStyle as any) || undefined,
            gradientStops: pageTemplate.gradientStops || undefined,
            gradientDirection: pageTemplate.gradientDirection || undefined,
            transition: { ...DEFAULT_SLIDE_TRANSITION },
        });
    });

    loadDocument({
        version: 4,
        metadata: { name: template.metadata?.name || 'Design', docType: 'design' as const },
        elements: allElements,
        layers: [{ id: 'default-layer', name: 'Layer 1', visible: true, locked: false, opacity: 1, order: 0, backgroundColor: 'transparent' }],
        slides,
        globalSettings: {},
    });
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

    // Illustrator convention: the result inherits the FRONTMOST object's appearance
    // for union/intersect/exclude. For "minus front" (subtract) the backmost shape is the
    // one that survives, so it keeps its own appearance.
    const base = op === 'subtract' ? els[0] : els[els.length - 1];
    const created: DrawingElement[] = [];
    const batchIds = new Set<string>();
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
        }, undefined, batchIds);
        if (path) created.push(path);
    }
    if (created.length === 0) return [];

    pushToHistory();
    replaceElementsPreservingOrder(ids, created);
    setStore('selection', created.map(c => c.id));
    showToast(`Pathfinder: ${op}`, 'success');
    return created.map(c => c.id);
};

export type RegionPathfinderOp = 'divide' | 'trim' | 'merge' | 'crop' | 'outline';

/**
 * Illustrator "Pathfinders" (region ops) over ≥2 selected shapes, built on the atomic-face
 * engine (`computeShapeFaces`). Back→front z-order; each face is coloured by the frontmost
 * shape covering it.
 *   • divide  — every overlap region becomes its own path
 *   • trim    — hidden (covered) parts removed; one path per shape, same colours NOT merged
 *   • merge   — like trim, but adjacent same-fill shapes fuse into one path
 *   • crop    — keep only what lies inside the FRONTMOST shape; that shape is discarded
 *   • outline — region boundaries become strokes (no fill)
 */
export const applyPathfinderRegion = (ids: string[], op: RegionPathfinderOp): string[] => {
    const els = store.elements.filter(e => ids.includes(e.id));
    if (els.length < 2) { showToast('Pathfinder: select 2+ shapes', 'info'); return []; }
    if (els.length > 8) { showToast('Pathfinder: region ops support up to 8 shapes', 'info'); return []; }
    els.sort((a, b) => store.elements.indexOf(a) - store.elements.indexOf(b));   // back → front
    const faces = computeShapeFaces(els);
    if (!faces.length) { showToast('Pathfinder: empty result', 'info'); return []; }

    const top = (subset: number[]) => Math.max(...subset);
    const styleOf = (i: number): Partial<DrawingElement> => {
        const b = els[i];
        return { strokeColor: b.strokeColor, backgroundColor: b.backgroundColor, fillStyle: b.fillStyle, strokeWidth: b.strokeWidth, strokeStyle: b.strokeStyle, renderStyle: b.renderStyle, opacity: b.opacity, roughness: b.roughness, layerId: b.layerId };
    };
    const created: DrawingElement[] = [];
    const batchIds = new Set<string>();
    const emit = (region: any, styleIdx: number, overrides?: Partial<DrawingElement>) => {
        for (const poly of region) { const p = buildPathFromPoly(poly, { ...styleOf(styleIdx), ...overrides }, undefined, batchIds); if (p) created.push(p); }
    };

    if (op === 'divide') {
        for (const f of faces) emit(f.region, top(f.subset));
    } else if (op === 'outline') {
        for (const f of faces) { const ti = top(f.subset); const col = (els[ti].backgroundColor && els[ti].backgroundColor !== 'transparent') ? els[ti].backgroundColor : els[ti].strokeColor; emit(f.region, ti, { backgroundColor: 'transparent', fillStyle: 'solid', strokeColor: col || '#000000', strokeWidth: Math.max(2, els[ti].strokeWidth || 2) }); }
    } else if (op === 'crop') {
        const cropIdx = els.length - 1;                              // frontmost = crop mask
        for (const f of faces) {
            if (!f.subset.includes(cropIdx)) continue;               // outside the crop → drop
            const under = f.subset.filter(i => i !== cropIdx);
            if (!under.length) continue;                             // only the crop shape → drop
            emit(f.region, Math.max(...under));                      // colour by topmost underlying shape
        }
    } else { // trim | merge
        const groups = new Map<string, { idx: number; faces: ShapeFace[] }>();
        for (const f of faces) {
            const ti = top(f.subset);
            const key = op === 'merge' ? `${els[ti].backgroundColor || ''}|${els[ti].fillStyle || ''}` : String(ti);
            const g = groups.get(key) || { idx: ti, faces: [] };
            g.idx = ti; g.faces.push(f); groups.set(key, g);
        }
        for (const g of groups.values()) { const region = unionFaces(g.faces); for (const poly of region) { const p = buildPathFromPoly(poly, styleOf(g.idx), undefined, batchIds); if (p) created.push(p); } }
    }

    if (!created.length) { showToast('Pathfinder: empty result', 'info'); return []; }
    pushToHistory();
    replaceElementsPreservingOrder(ids, created);
    setStore('selection', created.map(c => c.id));
    showToast(`Pathfinder: ${op}`, 'success');
    return created.map(c => c.id);
};

/**
 * Decompose the selected shapes into atomic faces (the maximal regions bounded by a
 * unique subset of the shapes) for the face-level Shape Builder. Exposed so the overlay
 * can hit-test and highlight individual faces as the user drags. Returns [] when the
 * selection is too small/large to decompose (caller falls back to whole-shape union).
 */
export const getShapeFaces = (ids: string[]): ShapeFace[] => {
    const els = store.elements.filter(e => ids.includes(e.id));
    if (els.length < 2) return [];
    if (els.length > 8) showToast('Shape Builder: face mode is limited to 8 shapes — merging whole shapes', 'info');
    els.sort((a, b) => store.elements.indexOf(a) - store.elements.indexOf(b));
    return computeShapeFaces(els);
};

/**
 * Commit a face-level Shape Builder gesture. `touchedKeys` are the face keys the user
 * painted over. mode 'merge' fuses the touched faces into one path and keeps every other
 * face as its own path (Illustrator decomposes the artwork into faces on build); mode
 * 'delete' drops the touched faces and keeps the rest — this is how you carve a notch or
 * punch the overlap lens out. The original shapes are replaced by the resulting faces.
 */
export const commitShapeBuilderFaces = (ids: string[], touchedKeys: string[], mode: 'merge' | 'delete'): string[] => {
    const els = store.elements.filter(e => ids.includes(e.id));
    if (els.length < 2) return [];
    els.sort((a, b) => store.elements.indexOf(a) - store.elements.indexOf(b));
    const faces = computeShapeFaces(els);
    if (!faces.length || !touchedKeys.length) return [];
    const touchedSet = new Set(touchedKeys);
    const touched = faces.filter(f => touchedSet.has(f.key));
    const untouched = faces.filter(f => !touchedSet.has(f.key));
    if (!touched.length) return [];

    const base = els[0];
    const style: Partial<DrawingElement> = {
        strokeColor: base.strokeColor, backgroundColor: base.backgroundColor,
        fillStyle: base.fillStyle, strokeWidth: base.strokeWidth, strokeStyle: base.strokeStyle,
        renderStyle: base.renderStyle, opacity: base.opacity, roughness: base.roughness, layerId: base.layerId,
    };
    const created: DrawingElement[] = [];
    const batchIds = new Set<string>();
    const polysToPaths = (mp: { length: number }[], st: Partial<DrawingElement>) => {
        for (const poly of mp as Poly[]) {
            const p = buildPathFromPoly(poly, st, undefined, batchIds);
            if (p) created.push(p);
        }
    };
    if (mode === 'merge') {
        polysToPaths(unionFaces(touched), style);            // fused region as one path (per disjoint piece)
        for (const f of untouched) polysToPaths(f.region, style); // remaining faces stay separate
    } else {
        for (const f of untouched) polysToPaths(f.region, style); // drop the touched faces (carve)
    }
    if (!created.length) {
        // Everything was deleted (e.g. merge-delete consumed all faces) — just remove originals.
        pushToHistory();
        setStore('elements', list => list.filter(e => !ids.includes(e.id)));
        setStore('selection', []);
        showToast('Shape Builder: removed', 'success');
        return [];
    }
    pushToHistory();
    replaceElementsPreservingOrder(ids, created);
    setStore('selection', created.map(c => c.id));
    showToast(mode === 'merge' ? 'Shape Builder: merged' : 'Shape Builder: deleted', 'success');
    return created.map(c => c.id);
};

/**
 * Magic Wand — select every (unlocked, visible) element sharing the reference element's
 * fill colour, or stroke, or both. Reference defaults to the first selected element.
 */
export type SelectSimilarMatch =
    'fill' | 'stroke' | 'both' | 'fontFamily' | 'fontSize' | 'opacity' | 'strokeWidth' | 'type';

export const selectSimilar = (refId?: string, match: SelectSimilarMatch = 'fill'): string[] => {
    const ref = store.elements.find(e => e.id === (refId ?? store.selection[0]));
    if (!ref) { showToast('Magic Wand: select an element first', 'info'); return []; }
    const fillEq = (e: DrawingElement) => (e.backgroundColor || '') === (ref.backgroundColor || '');
    const strokeEq = (e: DrawingElement) => (e.strokeColor || '') === (ref.strokeColor || '');
    const preds: Record<SelectSimilarMatch, (e: DrawingElement) => boolean> = {
        fill: fillEq,
        stroke: strokeEq,
        both: (e) => fillEq(e) && strokeEq(e),
        // "Select > Same": match a single attribute (Illustrator's submenu).
        fontFamily: (e) => (e.fontFamily || '') === (ref.fontFamily || ''),
        fontSize: (e) => (e.fontSize ?? -1) === (ref.fontSize ?? -1),
        opacity: (e) => (e.opacity ?? 100) === (ref.opacity ?? 100),
        strokeWidth: (e) => (e.strokeWidth ?? 0) === (ref.strokeWidth ?? 0),
        type: (e) => e.type === ref.type,
    };
    const pred = preds[match] ?? fillEq;
    const hidden = new Set(store.layers.filter(l => !l.visible).map(l => l.id));
    const ids = store.elements.filter(e => !e.locked && !hidden.has(e.layerId!) && pred(e)).map(e => e.id);
    setStore('selection', ids);
    showToast(`Magic Wand: ${ids.length} similar`, 'success');
    return ids;
};

/**
 * Distort & Transform — apply Pucker/Bloat, Twirl, Zig-Zag (Scallop), Crystallize, or
 * Roughen (Wrinkle) to the selected shapes' outlines, replacing each with a distorted
 * `path` (Illustrator's Effect → Distort & Transform; also covers the Liquify intent as
 * deterministic filters). `amount` is a 0..1 strength relative to each shape's size.
 */
export const applyDistort = (ids: string[], kind: DistortKind, amount = 0.25): string[] => {
    const els = store.elements.filter(e => ids.includes(e.id));
    if (!els.length) { showToast('Distort: select a shape', 'info'); return []; }
    const created: DrawingElement[] = [];
    const consumed: string[] = [];
    const batchIds = new Set<string>();
    for (const el of els) {
        const mp = elementToMultiPolygon(el);
        if (!mp.length) continue;
        consumed.push(el.id);
        const style: Partial<DrawingElement> = {
            strokeColor: el.strokeColor, backgroundColor: el.backgroundColor, fillStyle: el.fillStyle,
            strokeWidth: el.strokeWidth, strokeStyle: el.strokeStyle, renderStyle: el.renderStyle,
            opacity: el.opacity, roughness: el.roughness, layerId: el.layerId,
        };
        for (const poly of mp) {
            const path = buildPathFromPoly(distortPoly(poly, kind, amount), style, undefined, batchIds);
            if (path) created.push(path);
        }
    }
    if (!created.length) { showToast('Distort: nothing to distort', 'info'); return []; }
    pushToHistory();
    replaceElementsPreservingOrder(consumed, created);
    setStore('selection', created.map(c => c.id));
    showToast(`Distort: ${kind}`, 'success');
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

/**
 * Apply a named warp preset (Illustrator "Make with Warp"): Arc/Arch/Flag/Wave/Rise/Bulge,
 * bent by `bend` (-1..1). Non-path/image shapes convert to a path first (so the warp deforms
 * an outline). Stores `preset`+`bend` on `el.warp` so a bend slider stays live/re-editable.
 * Bake with `bakeWarp` to make it permanent geometry.
 */
export const applyWarpPreset = (ids: string[], preset: WarpPreset, bend = 0.5, history = true): string[] => {
    const targets = store.elements.filter(e => ids.includes(e.id));
    if (targets.length === 0) { if (history) showToast('Warp: select a shape', 'info'); return []; }
    if (history) pushToHistory();
    const out: string[] = [];
    setStore('elements', list => list.map(el => {
        if (!ids.includes(el.id)) return el;
        let base = el;
        if (el.type !== 'path' && el.type !== 'image') {
            const r = shapeToPath(el);
            if (!r) return el;
            base = { ...el, type: 'path', pathAnchors: r.anchors, pathClosed: r.closed, points: undefined, controlPoints: undefined } as DrawingElement;
        }
        out.push(el.id);
        const grid = warpPresetGrid(base.width, base.height, preset, bend);
        return { ...base, warp: { ...grid, smooth: true, preset, bend } } as DrawingElement;
    }));
    bumpDirtyRevision();
    if (history) showToast(out.length ? `Warp: ${preset}` : 'Warp: unsupported shape', out.length ? 'success' : 'info');
    return out;
};

/**
 * Envelope Distort ▸ Make with Top Object — warp artwork into the SILHOUETTE of the frontmost
 * selected shape. The top shape becomes the envelope (consumed); the lower artwork is scaled to
 * the top's bounding box and squeezed into its outline via a silhouette warp grid. Selection =
 * artwork + a top shape (≥2). Returns the warped artwork id.
 */
export const envelopeWithTopObject = (ids?: string[]): string[] => {
    const sel = ids ?? store.selection;
    if (sel.length < 2) { showToast('Envelope: select artwork + a top shape', 'info'); return []; }
    const ordered = store.elements.filter(e => sel.includes(e.id)); // z-order (bottom→top)
    const top = ordered[ordered.length - 1];
    const artwork = ordered[0];
    if (top.id === artwork.id) { showToast('Envelope: need two objects', 'info'); return []; }
    const ring = elementToMultiPolygon(top)[0]?.[0];
    if (!ring || ring.length < 3) { showToast('Envelope: top shape has no outline', 'info'); return []; }
    let bx = Infinity, by = Infinity, mx = -Infinity, my = -Infinity;
    for (const [x, y] of ring) { bx = Math.min(bx, x); by = Math.min(by, y); mx = Math.max(mx, x); my = Math.max(my, y); }
    const bw = Math.max(1, mx - bx), bh = Math.max(1, my - by);
    const grid = silhouetteWarpGrid(ring, bx, by, bw, bh);

    pushToHistory();
    setStore('elements', list => list.map(el => {
        if (el.id !== artwork.id) return el;
        let base = el;
        if (el.type !== 'path' && el.type !== 'image') {
            const r = shapeToPath(el);
            if (!r) return el;
            base = { ...el, type: 'path', pathAnchors: r.anchors, pathClosed: r.closed, points: undefined, controlPoints: undefined } as DrawingElement;
        }
        const sx = bw / Math.max(1, base.width), sy = bh / Math.max(1, base.height);
        return {
            ...base,
            x: bx, y: by, width: bw, height: bh,
            pathAnchors: scalePathAnchors(base.pathAnchors as any, sx, sy) as any,
            pathSubpaths: scalePathSubpaths(base.pathSubpaths as any, sx, sy) as any,
            warp: { ...grid, smooth: true },
        } as DrawingElement;
    }));
    // The top object is consumed as the envelope.
    setStore('elements', list => list.filter(e => e.id !== top.id));
    setStore('selection', [artwork.id]);
    bumpDirtyRevision();
    showToast('Envelope: made with top object', 'success');
    return [artwork.id];
};

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

// ── Live Transform effect (Illustrator's Effect ▸ Distort & Transform ▸ Transform) ──

const DEFAULT_TRANSFORM_EFFECT: TransformEffect = { copies: 6, rotate: 15, scaleX: 1, scaleY: 1, moveX: 0, moveY: 0 };

/** Apply / update the live Transform effect on the given elements (merges over existing).
 *  `history=false` skips the undo snapshot + toast (for live slider dragging). */
export const setTransformEffect = (ids: string[], fx?: Partial<TransformEffect>, history = true) => {
    if (ids.length === 0) { if (history) showToast('Transform: select an object', 'info'); return; }
    if (history) pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id), (e: DrawingElement) => ({
        transformEffect: { ...DEFAULT_TRANSFORM_EFFECT, ...e.transformEffect, ...fx } as TransformEffect,
    }));
    bumpDirtyRevision();
    if (history) showToast('Transform effect applied', 'success');
};

/** Remove the live Transform effect, leaving just the base element. */
export const clearTransformEffect = (ids: string[]) => {
    if (ids.length === 0) return;
    pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id), () => ({ transformEffect: undefined }));
    bumpDirtyRevision();
};

// ── Live 3D Extrude effect (Illustrator's Effect ▸ 3D ▸ Extrude & Bevel) ──

const DEFAULT_EXTRUDE: Extrude3D = { depth: 28, angle: 135, shade: 0.35 };

/** Apply / update the live 3D Extrude effect (shaded depth behind the shape). `history=false`
 *  skips the undo snapshot + toast (for live slider dragging). */
export const setExtrude = (ids: string[], ex?: Partial<Extrude3D>, history = true) => {
    if (ids.length === 0) { if (history) showToast('3D: select an object', 'info'); return; }
    if (history) pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id), (e: DrawingElement) => ({
        extrude: { ...DEFAULT_EXTRUDE, ...e.extrude, ...ex } as Extrude3D,
    }));
    bumpDirtyRevision();
    if (history) showToast('3D extrude applied', 'success');
};

/** Remove the 3D Extrude effect, leaving the flat shape. */
export const clearExtrude = (ids: string[]) => {
    if (ids.length === 0) return;
    pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id), () => ({ extrude: undefined }));
    bumpDirtyRevision();
};

// ── Live Turntable effect (Adobe Project Turntable — rotate a vector path in pseudo-3D) ──

const DEFAULT_TURNTABLE: Turntable = { axis: 'y', yaw: 0, pitch: 0, depthModel: 'symmetry', depthScale: 0.6 };

/** Apply / update the live Turntable effect. Non-path shapes are converted to a `path` first
 *  (the effect only rotates path anchors). `history=false` skips undo + toast for live drags. */
export const setTurntable = (ids: string[], tt?: Partial<Turntable>, history = true) => {
    if (ids.length === 0) { if (history) showToast('Turntable: select an object', 'info'); return; }
    // Convert any non-path selection to an editable path so it can be rotated.
    const toConvert = store.elements.filter(e => ids.includes(e.id) && e.type !== 'path' && shapeToPath(e)).map(e => e.id);
    if (history && toConvert.length) convertToPath(toConvert);
    if (history) pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id) && e.type === 'path', (e: DrawingElement) => ({
        turntable: { ...DEFAULT_TURNTABLE, ...e.turntable, ...tt, baked: false } as Turntable,
    }));
    bumpDirtyRevision();
    if (history) showToast('Turntable applied', 'success');
};

/** Remove the Turntable effect, restoring the flat (un-rotated) path. */
export const clearTurntable = (ids: string[]) => {
    if (ids.length === 0) return;
    pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id), () => ({ turntable: undefined }));
    bumpDirtyRevision();
};

/** Bake the current turntable angle into the path: replace anchors with the rotated geometry
 *  and drop the effect, so the new viewpoint becomes a clean, editable vector (single undo). */
export const bakeTurntable = (ids: string[]): string[] => {
    const bakedById = new Map<string, PathSubpath[]>();
    for (const el of store.elements) {
        if (ids.includes(el.id)) {
            const subs = applyTurntable(el);
            if (subs && subs.length) bakedById.set(el.id, subs);
        }
    }
    if (bakedById.size === 0) return [];
    pushToHistory();
    setStore('elements', list => list.map(el => {
        const subs = bakedById.get(el.id);
        if (!subs) return el;
        const single = subs.length === 1;
        return {
            ...el, type: 'path', turntable: undefined,
            pathSubpaths: single ? undefined : subs,
            pathAnchors: single ? subs[0].anchors : undefined,
            pathClosed: single ? subs[0].closed : undefined,
        } as DrawingElement;
    }));
    bumpDirtyRevision();
    const out = [...bakedById.keys()];
    showToast(`Baked turntable on ${out.length}`, 'success');
    return out;
};

/** Feather — soft-blur an object's edges to transparent (radius px; 0 removes). */
export const applyFeather = (ids: string[], radius: number) => {
    if (!ids.length) { showToast('Feather: select an object', 'info'); return; }
    pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id), () => ({ featherRadius: Math.max(0, radius) }));
    bumpDirtyRevision();
    showToast(radius > 0 ? `Feather ${radius}px` : 'Feather removed', 'success');
};

/** Outer Glow — a coloured halo around the object. `enabled:false` removes it. */
export const applyGlow = (ids: string[], opts: { color?: string; blur?: number; enabled?: boolean } = {}) => {
    if (!ids.length) { showToast('Glow: select an object', 'info'); return; }
    pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id), () => ({
        glowEnabled: opts.enabled !== false,
        glowColor: opts.color ?? '#ffd400',
        glowBlur: opts.blur ?? 12,
    }));
    bumpDirtyRevision();
    showToast(opts.enabled === false ? 'Glow removed' : 'Outer glow applied', 'success');
};

/** Scribble (Illustrator effect) — replace each shape's fill with a back-and-forth scribble
 *  path in the fill colour. Returns the new path ids. */
export const applyScribble = (ids: string[], opts: { spacing?: number; angle?: number; strokeWidth?: number } = {}): string[] => {
    if (!ids.length) { showToast('Scribble: select an object', 'info'); return []; }
    const spacing = Math.max(2, opts.spacing ?? 8);
    const strokeWidth = opts.strokeWidth ?? 2;
    const a = (opts.angle ?? 0) * Math.PI / 180;
    const batch = new Set<string>();
    const created: DrawingElement[] = [];
    for (const id of ids) {
        const el = store.elements.find(e => e.id === id);
        if (!el) continue;
        const color = (el.backgroundColor && el.backgroundColor !== 'transparent') ? el.backgroundColor : (el.strokeColor || '#000000');
        const rows = Math.max(2, Math.floor(Math.abs(el.height) / spacing));
        const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
        const world: { x: number; y: number }[] = [];
        for (let r = 0; r <= rows; r++) {
            const y = el.y + (r / rows) * el.height;
            const ltr = r % 2 === 0;
            const p0 = { x: ltr ? el.x : el.x + el.width, y }, p1 = { x: ltr ? el.x + el.width : el.x, y };
            for (const p of [p0, p1]) {
                const dx = p.x - cx, dy = p.y - cy;
                world.push({ x: cx + dx * Math.cos(a) - dy * Math.sin(a), y: cy + dx * Math.sin(a) + dy * Math.cos(a) });
            }
        }
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of world) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }
        const anchors: PathAnchor[] = world.map(p => ({ x: p.x - minX, y: p.y - minY, kind: 'corner' as const }));
        created.push({
            ...store.defaultElementStyles, id: generateId('path', batch), type: 'path',
            x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY),
            pathAnchors: anchors, pathClosed: false, strokeColor: color, strokeWidth, backgroundColor: 'transparent',
            angle: 0, seed: Math.floor(Math.random() * 2 ** 31), layerId: store.activeLayerId,
        } as DrawingElement);
    }
    if (!created.length) return [];
    pushToHistory();
    setStore('elements', list => [...list, ...created]);
    setStore('elements', (e: DrawingElement) => ids.includes(e.id), () => ({ backgroundColor: 'transparent' }));
    setStore('selection', created.map(c => c.id));
    bumpDirtyRevision();
    showToast('Scribble applied', 'success');
    return created.map(c => c.id);
};

/** Toggle the live 3D Revolve (lathe) effect — spins the shape's silhouette into a solid. */
export const toggleRevolve = (ids: string[], on?: boolean) => {
    if (ids.length === 0) { showToast('Revolve: select an object', 'info'); return; }
    pushToHistory();
    setStore('elements', (e: DrawingElement) => ids.includes(e.id), (e: DrawingElement) => ({
        revolve3d: (on ?? !e.revolve3d?.on) ? { on: true } : undefined,
        extrude: undefined, // extrude + revolve are mutually exclusive
    }));
    bumpDirtyRevision();
    showToast('3D revolve applied', 'success');
};

/**
 * Expand (bake) the 3D extrude into editable face elements (Illustrator "Expand Appearance"):
 * a back-face path, a unioned side-wall path, and a front-face path — grouped, replacing the
 * original. Makes the 3D result editable per-face and SVG-exportable. Returns the new ids.
 */
export const expandExtrude = (ids: string[]): string[] => {
    const targets = store.elements.filter(e => ids.includes(e.id) && e.extrude && (e.extrude.depth || 0) > 0);
    if (targets.length === 0) { showToast('Expand: no 3D extrude', 'info'); return []; }
    pushToHistory();
    const batch = new Set<string>();
    const additions: DrawingElement[] = [];
    const removeIds = new Set<string>();
    for (const el of targets) {
        const g = extrudeGeometry(el);
        if (!g) continue;
        removeIds.add(el.id);
        const grp = generateId('group', batch);
        const shift = (ring: [number, number][]) => ring.map(([x, y]) => [x + g.dx, y + g.dy] as [number, number]);
        // Side walls → union of per-edge quads into a clean region.
        const quads: Poly[] = [];
        for (const poly of g.front) for (const ring of poly) {
            for (let i = 0; i < ring.length; i++) {
                const a = ring[i], b = ring[(i + 1) % ring.length];
                quads.push([[a, b, [b[0] + g.dx, b[1] + g.dy], [a[0] + g.dx, a[1] + g.dy], a]]);
            }
        }
        const side = unionPolys(quads);
        const backPoly: Poly = (g.front.flat() as [number, number][][]).map(shift);
        const frontPoly: Poly = (g.front.flat() as [number, number][][]).map((r) => r.slice());
        const mk = (poly: Poly, fill: string, withStroke: boolean) => {
            const p = buildPathFromPoly(poly, {
                backgroundColor: fill, fillStyle: 'solid',
                strokeColor: withStroke && el.strokeColor && el.strokeColor !== 'transparent' ? el.strokeColor : 'transparent',
                strokeWidth: withStroke ? (el.strokeWidth ?? 0) : 0,
                renderStyle: el.renderStyle, opacity: el.opacity, groupIds: [grp],
            }, undefined, batch);
            if (p) additions.push(p);
        };
        // back (furthest) → side → front (nearest, on top)
        mk(backPoly, g.backCol, false);
        for (const sp of side) mk(sp, g.wallCol, false);
        mk(frontPoly, g.base, true);
    }
    if (!additions.length) { showToast('Expand: could not bake', 'info'); return []; }
    setStore('elements', list => [...list.filter(e => !removeIds.has(e.id)), ...additions]);
    setStore('selection', additions.map(a => a.id));
    bumpDirtyRevision();
    showToast(`Expanded 3D — ${additions.length} faces`, 'success');
    return additions.map(a => a.id);
};

/**
 * Expand (bake) the live Transform effect into real elements — Illustrator's "Expand
 * Appearance". The source keeps its geometry (effect stripped); copies 1..N become new
 * elements via the SAME per-copy math the live renderer uses. Returns the new copy ids.
 */
export const expandTransformEffect = (ids: string[]): string[] => {
    const targets = store.elements.filter(e => ids.includes(e.id) && effectiveCopies(e.transformEffect) > 0);
    if (targets.length === 0) { showToast('Expand: no transform effect', 'info'); return []; }
    pushToHistory();
    const newIds: string[] = [];
    for (const el of targets) {
        const fx = el.transformEffect!;
        const n = effectiveCopies(fx);
        // Append copies 1..N as fresh elements (cloneSelection gives group-aware new ids/seeds).
        for (let k = 1; k <= n; k++) {
            const made = cloneSelection([el.id], (clone, src) => {
                const t = transformCopy(src, fx, k, ''); // reuse the render math; ignore its id
                return { ...clone, x: t.x, y: t.y, angle: t.angle, renderScale: t.renderScale, flipX: t.flipX, flipY: t.flipY };
            });
            newIds.push(...made);
        }
    }
    // Strip the live effect from the sources (they now render as their plain base).
    setStore('elements', (e: DrawingElement) => ids.includes(e.id), () => ({ transformEffect: undefined }));
    bumpDirtyRevision();
    showToast(`Expanded — ${newIds.length} copies`, 'success');
    return newIds;
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
function buildPathFromPoly(poly: Poly, style: Partial<DrawingElement>, smoothEps?: number, batchIds?: Set<string>): DrawingElement | null {
    // smoothEps > 0 → curved (Bézier) edge via Catmull-Rom (Blob Brush); else straight corners.
    const norm = (smoothEps && smoothEps > 0) ? polyToSmoothSubpaths(poly, smoothEps) : polyToPathSubpaths(poly);
    if (!norm) return null;
    const single = norm.subpaths.length === 1;
    return {
        ...store.defaultElementStyles,
        // `batchIds` keeps ids unique across a synchronous create-loop: generateId scans the store
        // (max+1), but loop-built paths aren't in the store yet, so without this every piece collides
        // on the same id (e.g. path-1) and only the first one ends up rendering/selectable.
        id: generateId('path', batchIds),
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

// ── Non-destructive compound shapes ─────────────────────────────────────────
// A compound shape is a `path` element that RETAINS its source elements
// (`compoundOperands`, world coords) + the boolean `compoundOp`, and whose
// `pathSubpaths` are the evaluated result. Non-destructive: the operation can be
// changed after the fact, the sources released back for editing, or expanded
// (flattened) to a plain path. Renders/hit-tests/serializes as any path.

/** World-space bbox min of a boolean result (for absorbing moves). */
function polysOriginMin(polys: Poly[]): { x: number; y: number } | null {
    let mnx = Infinity, mny = Infinity;
    for (const poly of polys) for (const ring of poly) for (const [x, y] of ring) { mnx = Math.min(mnx, x); mny = Math.min(mny, y); }
    return isFinite(mnx) ? { x: mnx, y: mny } : null;
}

/** If the compound was moved since its last eval, shift its (world) operands by the same delta. */
function syncCompoundOperands(el: DrawingElement): DrawingElement[] {
    const operands = el.compoundOperands || [];
    const cur = runBooleanOp(operands, el.compoundOp || 'union');
    const origin = polysOriginMin(cur);
    if (!origin) return operands;
    const dx = el.x - origin.x, dy = el.y - origin.y;
    if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return operands;
    return operands.map(o => ({ ...o, x: o.x + dx, y: o.y + dy }));
}

/** Combine all result polys into ONE even-odd `path` element (with retained operands). */
function buildCompoundPath(polys: Poly[], style: Partial<DrawingElement>, op: BooleanOp, operands: DrawingElement[], batchIds?: Set<string>): DrawingElement | null {
    const parts: { subs: any[]; minX: number; minY: number }[] = [];
    let gMinX = Infinity, gMinY = Infinity, gMaxX = -Infinity, gMaxY = -Infinity;
    for (const poly of polys) {
        const n = polyToPathSubpaths(poly);
        if (!n) continue;
        parts.push({ subs: n.subpaths, minX: n.minX, minY: n.minY });
        gMinX = Math.min(gMinX, n.minX); gMinY = Math.min(gMinY, n.minY);
        gMaxX = Math.max(gMaxX, n.minX + n.width); gMaxY = Math.max(gMaxY, n.minY + n.height);
    }
    if (!parts.length) return null;
    const subpaths = parts.flatMap(p => p.subs.map(sp => ({
        anchors: sp.anchors.map((a: any) => ({ ...a, x: a.x + (p.minX - gMinX), y: a.y + (p.minY - gMinY) })),
        closed: true,
    })));
    // Mirror buildPathFromPoly: a single ring fills via pathAnchors; holes/disjoint via
    // pathSubpaths (even-odd). A lone pathSubpaths entry does NOT fill on its own.
    const single = subpaths.length === 1;
    return {
        ...store.defaultElementStyles,
        id: generateId('path', batchIds),
        type: 'path',
        x: gMinX, y: gMinY, width: Math.max(1, gMaxX - gMinX), height: Math.max(1, gMaxY - gMinY),
        pathAnchors: single ? subpaths[0].anchors : undefined,
        pathClosed: single ? true : undefined,
        pathSubpaths: single ? undefined : subpaths,
        angle: 0, seed: Math.floor(Math.random() * 2 ** 31), roundness: null, locked: false, link: null,
        layerId: store.activeLayerId,
        ...style,
        compoundOperands: operands,
        compoundOp: op,
    } as DrawingElement;
}

const compoundStyleOf = (el: DrawingElement): Partial<DrawingElement> => ({
    strokeColor: el.strokeColor, backgroundColor: el.backgroundColor, fillStyle: el.fillStyle,
    strokeWidth: el.strokeWidth, strokeStyle: el.strokeStyle, renderStyle: el.renderStyle,
    opacity: el.opacity, roughness: el.roughness, layerId: el.layerId,
});

/**
 * Make a non-destructive compound shape from ≥2 selected elements. Unlike Pathfinder
 * (which flattens and discards the sources), this keeps the sources so the operation
 * can be changed, released, or expanded later. Returns the new element id.
 */
export const makeCompoundShape = (ids: string[], op: BooleanOp = 'union'): string | null => {
    const els = store.elements.filter(e => ids.includes(e.id));
    if (els.length < 2) { showToast('Compound shape: select 2+ shapes', 'info'); return null; }
    els.sort((a, b) => store.elements.indexOf(a) - store.elements.indexOf(b)); // back → front
    const polys = runBooleanOp(els, op);
    if (!polys.length) { showToast('Compound shape: empty result', 'info'); return null; }
    const base = op === 'subtract' ? els[0] : els[els.length - 1];
    const compound = buildCompoundPath(polys, compoundStyleOf(base), op, els.map(e => ({ ...e })));
    if (!compound) return null;
    pushToHistory();
    replaceElementsPreservingOrder(ids, [compound]);
    setStore('selection', [compound.id]);
    bumpDirtyRevision();
    showToast(`Compound shape: ${op}`, 'success');
    return compound.id;
};

/** Change a compound shape's boolean operation in place (re-evaluates the retained sources). */
export const setCompoundShapeOp = (id: string, op: BooleanOp): void => {
    const el = store.elements.find(e => e.id === id);
    if (!el || !el.compoundOperands || el.compoundOperands.length < 2) return;
    const operands = syncCompoundOperands(el);
    const polys = runBooleanOp(operands, op);
    if (!polys.length) { showToast('Compound shape: empty result', 'info'); return; }
    const rebuilt = buildCompoundPath(polys, compoundStyleOf(el), op, operands);
    if (!rebuilt) return;
    pushToHistory();
    updateElement(id, {
        x: rebuilt.x, y: rebuilt.y, width: rebuilt.width, height: rebuilt.height,
        pathAnchors: rebuilt.pathAnchors, pathClosed: rebuilt.pathClosed, pathSubpaths: rebuilt.pathSubpaths,
        compoundOperands: operands, compoundOp: op,
    } as Partial<DrawingElement>, false);
    bumpDirtyRevision();
    showToast(`Compound: ${op}`, 'success');
};

/** Release a compound shape back into its editable source elements (removes the compound). */
export const releaseCompoundShape = (id: string): string[] => {
    const el = store.elements.find(e => e.id === id);
    if (!el || !el.compoundOperands || !el.compoundOperands.length) return [];
    const operands = syncCompoundOperands(el);
    const batchIds = new Set<string>();
    const restored = operands.map(o => ({ ...o, id: generateId(o.type as any, batchIds), compoundOperands: undefined, compoundOp: undefined }));
    pushToHistory();
    replaceElementsPreservingOrder([id], restored as DrawingElement[]);
    setStore('selection', restored.map(r => r.id));
    bumpDirtyRevision();
    showToast('Compound shape released', 'success');
    return restored.map(r => r.id);
};

/** Expand (flatten) a compound shape into a plain path — drops the retained sources. */
export const expandCompoundShape = (id: string): void => {
    const el = store.elements.find(e => e.id === id);
    if (!el || !el.compoundOperands) return;
    pushToHistory();
    updateElement(id, { compoundOperands: undefined, compoundOp: undefined } as Partial<DrawingElement>, false);
    bumpDirtyRevision();
    showToast('Compound shape expanded', 'success');
};

/**
 * Enter in-place editing of a compound shape: explode its retained operands into real,
 * selectable top-level elements (grouped) so you can move/edit them; the boolean is
 * re-evaluated when you finish. Mirrors the symbol edit-in-place flow.
 */
export const enterCompoundEdit = (id: string): void => {
    if (store.compoundEdit) return; // one session at a time
    const el = store.elements.find(e => e.id === id);
    if (!el || !el.compoundOperands || el.compoundOperands.length < 2) return;
    pushToHistory();
    const operands = syncCompoundOperands(el); // world-positioned at the compound's current spot
    const gid = generateId('grp' as any);
    const batch = new Set<string>();
    const additions = operands.map(o => {
        const nid = generateId((o.type as any) || 'path', batch); batch.add(nid);
        return { ...o, id: nid, groupIds: [...(o.groupIds || []), gid], compoundOperands: undefined, compoundOp: undefined, layerId: el.layerId } as DrawingElement;
    });
    setStore('elements', list => [...list.filter(e => e.id !== id), ...additions]);
    setStore('selection', additions.map(a => a.id));
    setStore('compoundEdit', { groupId: gid, op: el.compoundOp || 'union', style: compoundStyleOf(el), original: { ...el } });
    bumpDirtyRevision();
    showToast('Editing compound shape — Esc to finish', 'info');
};

/** Finish an in-place compound edit: rebuild the compound from the edited operands (save) or restore the original (cancel). */
export const exitCompoundEdit = (save = true): void => {
    const session = store.compoundEdit;
    if (!session) return;
    const editedEls = store.elements.filter(e => (e.groupIds || []).includes(session.groupId));
    const ids = editedEls.map(e => e.id);

    if (save && editedEls.length >= 2) {
        const operands = editedEls.map(e => ({ ...e, groupIds: (e.groupIds || []).filter(g => g !== session.groupId) }));
        const polys = runBooleanOp(operands, session.op);
        const compound = polys.length ? buildCompoundPath(polys, session.style, session.op, operands) : null;
        if (compound) {
            setStore('elements', list => [...list.filter(e => !ids.includes(e.id)), compound]);
            setStore('selection', [compound.id]);
            setStore('compoundEdit', null);
            bumpDirtyRevision();
            showToast('Compound updated', 'success');
            return;
        }
        showToast('Compound: empty result — kept as separate shapes', 'info');
    }

    if (!save) {
        // Cancel: drop the edited operands and restore the original compound unchanged.
        setStore('elements', list => [...list.filter(e => !ids.includes(e.id)), { ...session.original }]);
        setStore('selection', [session.original.id]);
    } else {
        // Save-but-unbuildable: leave the edited shapes as plain (ungrouped) elements.
        setStore('elements', list => list.map(e => ids.includes(e.id) ? { ...e, groupIds: (e.groupIds || []).filter(g => g !== session.groupId) } : e));
    }
    setStore('compoundEdit', null);
    bumpDirtyRevision();
};

/**
 * Outline Stroke: replace each element with a filled `path` of its stroke outline
 * (Minkowski sum of the centerline with a disk of strokeWidth/2). The result is filled
 * with the original stroke color and has no stroke. Returns the new ids.
 */
export const outlineStroke = (ids: string[]): string[] => {
    const targets = store.elements.filter(e => ids.includes(e.id));
    const created: DrawingElement[] = [];
    const replaceIds = new Set<string>();
    const batchIds = new Set<string>();
    for (const el of targets) {
        const polys = computeOutlineStroke(el);
        if (polys.length === 0) continue;
        replaceIds.add(el.id);
        for (const poly of polys) {
            const path = buildPathFromPoly(poly, {
                backgroundColor: el.strokeColor, fillStyle: 'solid',
                strokeColor: 'transparent', strokeWidth: 0,
                renderStyle: el.renderStyle, opacity: el.opacity, layerId: el.layerId,
            }, undefined, batchIds);
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
    const batchIds = new Set<string>();
    for (const el of targets) {
        const polys = computeOffsetPath(el, distance);
        for (const poly of polys) {
            const path = buildPathFromPoly(poly, {
                backgroundColor: el.backgroundColor, fillStyle: el.fillStyle,
                strokeColor: el.strokeColor, strokeWidth: el.strokeWidth, strokeStyle: el.strokeStyle,
                renderStyle: el.renderStyle, opacity: el.opacity, layerId: el.layerId,
            }, undefined, batchIds);
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
function makePathFromWorldSubs(subs: WorldSub[], style: Partial<DrawingElement>, batchIds?: Set<string>): DrawingElement | null {
    const norm = normalizeWorldSubs(subs);
    if (!norm) return null;
    const single = norm.subpaths.length === 1;
    const id = generateId('path', batchIds);
    batchIds?.add(id);
    return {
        ...store.defaultElementStyles,
        id,
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
 * Smooth a path's janky curves via Laplacian smoothing — each interior anchor
 * moves toward the midpoint of its neighbours by `strength`, for `iterations`
 * passes (Illustrator's Smooth tool, applied as a one-shot op). Distinct from
 * Simplify, which *reduces* anchors; Smooth keeps the count and rounds corners.
 */
const smoothAnchors = (anchors: PathAnchor[], closed: boolean, strength: number, iterations: number): PathAnchor[] => {
    const n = anchors.length;
    if (n < 3) return anchors.map(a => ({ ...a }));
    let pts = anchors.map(a => ({ ...a }));
    for (let it = 0; it < iterations; it++) {
        const src = pts.map(a => ({ ...a }));
        for (let i = 0; i < n; i++) {
            if (!closed && (i === 0 || i === n - 1)) continue;   // pin open endpoints
            const prev = src[(i - 1 + n) % n], next = src[(i + 1) % n];
            const dx = ((prev.x + next.x) / 2 - src[i].x) * strength;
            const dy = ((prev.y + next.y) / 2 - src[i].y) * strength;
            pts[i].x = src[i].x + dx; pts[i].y = src[i].y + dy;
            // Carry bezier handles with the anchor so tangents are preserved.
            if (pts[i].inX !== undefined) pts[i].inX! += dx;
            if (pts[i].inY !== undefined) pts[i].inY! += dy;
            if (pts[i].outX !== undefined) pts[i].outX! += dx;
            if (pts[i].outY !== undefined) pts[i].outY! += dy;
        }
    }
    return pts;
};

export const smoothPath = (ids: string[], strength = 0.5, iterations = 2): string[] => {
    const targets = store.elements.filter(e => ids.includes(e.id) && e.type === 'path');
    if (targets.length === 0) { showToast('Smooth: select a path', 'info'); return []; }
    const s = Math.max(0, Math.min(1, strength));
    const its = Math.max(1, Math.min(20, Math.round(iterations)));
    pushToHistory();
    setStore('elements', list => list.map(el => {
        if (!targets.find(t => t.id === el.id)) return el;
        const subs = getPathSubpaths(el).map(sp => ({ closed: sp.closed, anchors: smoothAnchors(sp.anchors, sp.closed, s, its) }));
        const single = subs.length === 1;
        return {
            ...el,
            pathAnchors: single ? subs[0].anchors : undefined,
            pathClosed: single ? subs[0].closed : undefined,
            pathSubpaths: single ? undefined : subs,
        } as DrawingElement;
    }));
    showToast('Smoothed path', 'success');
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
