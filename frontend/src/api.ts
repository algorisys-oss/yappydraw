import {
    store, addElement, updateElement, deleteElements, setViewState, rotateView, resetRotation, pushToHistory, setStore, zoomToFit,
    undo, redo, groupSelected, ungroupSelected, duplicateElement, toggleTheme, setTheme, type Theme,
    addLayer, deleteLayer, setActiveLayer, mergeLayerDown, flattenLayers, isolateLayer, showAllLayers,
    updateLayer, duplicateLayer, reorderLayers, moveElementsToLayer, createLayerGroup, toggleLayerGroupExpansion,
    isLayerVisible, isLayerLocked,
    toggleGrid, toggleSnapToGrid, toggleCommandPalette, togglePropertyPanel, togglePresentationMode,
    toggleLayerPanel, toggleHistoryPanel, jumpToHistory, toggleGraphicStylesPanel, createGraphicStyle, applyGraphicStyle, updateGraphicStyle, renameGraphicStyle, deleteGraphicStyle,
    toggleSwatchesPanel, toggleBrandKitPanel, toggleElementsPanel, toggleStickFigurePanel, toggleSceneTimeline, toggleKeyframePanel, createSwatch, applySwatch, updateSwatchColor, renameSwatch, deleteSwatch, setSwatchGroup, listSwatchGroups, createSwatchGroupFromSelection, setBleed, toggleMinimap, toggleRulers, addGuide, updateGuide, removeGuide, clearGuides, toggleZenMode, toggleSlideNavigator,
    addDisplayState, updateDisplayState, deleteDisplayState, applyDisplayState, toggleStatePanel,
    applyNextState, applyPreviousState,
    addChildNode, addSiblingNode, toggleCollapseSelection, toggleCollapse,
    setParent, reorderMindmap, applyMindmapStyling, pasteMindmapOutline, applyPathfinder, applyPathfinderRegion, makeCompoundShape, setCompoundShapeOp, releaseCompoundShape, expandCompoundShape, enterCompoundEdit, exitCompoundEdit, convertToPath, convertTextToOutlines, outlineStroke, offsetPath, simplifyPath, smoothPath, makeCompoundPath, releaseCompoundPath, joinPaths,
    radialRepeat, gridRepeat, mirrorCopy, transformAgain, toggleEnvelopeWarp, applyMeshWarp, applyWarpPreset, envelopeWithTopObject, toggleMeshSmooth, bakeWarp, setTransformEffect, clearTransformEffect, expandTransformEffect, setExtrude, clearExtrude, expandExtrude, setTurntable, clearTurntable, bakeTurntable, spinTurntable360, toggleRevolve, applyFeather, applyGlow, applyScribble, makeClippingMask, makeOpacityMask, releaseClippingMask,
    addAppearanceFill, addAppearanceStroke, setAppearance, clearAppearance, traceImage,
    applyMeshGradient, setMeshSize, setMeshNodeColor, setMeshNodePosition, resetMeshNodes, setMeshSmooth, clearMeshGradient, toggleMeshEdit,
    applyPatternFill, setPatternFill, clearPatternFill, createPatternFromSelection,
    addPatternSwatchFromSelection, savePatternSwatchFromElement, applyPatternSwatch, updatePatternSwatch, renamePatternSwatch, deletePatternSwatch,
    createSymbol, placeInstance, redefineSymbol, detachInstance, enterSymbolEdit, exitSymbolEdit, renameSymbol, deleteSymbol, toggleSymbolsPanel, toggleSymbolSprayer, spraySymbolInstances, addArtboard, deleteArtboard, renameArtboard, updateArtboard, rearrangeArtboards, duplicateArtboard, fitArtboardToArtwork, toggleOutlineView, toggleTrimView, swapFillStroke, cleanUpElements, deleteUnusedSwatches, pasteOnAllArtboards, shuffleSelectionColors, applyPaletteToSelection, convertToShape, splitIntoGrid, convertToGuides, toggleObjectCropMarks,
    toggleSymmetryGuide, setSymmetryAxis, setSymmetryPos, mirrorAcrossSymmetry,
    addSlide, deleteSlide, duplicateSlide, setActiveSlide, reorderSlides,
    updateSlideTransition, updateSlideBackground, detachSlideBackgroundImage, setDocType, loadDocument, resetToNewDocument, setPageSize, setGameScript, setSceneBehaviors, setGameVars, toggleBehaviorsPanel, toggleGameGraph,
    setBlueprint, toggleBlueprint, blueprintFor,
    advancePresentation, retreatPresentation,
    bringToFront, sendToBack, moveElementZIndex,
    alignSelectedElements, distributeSelectedElements, distributeSpacing, toggleAlignToKey, startEyedropper, applyEyedropperFrom, cancelEyedropper, blendShapes, blendAlongPath, blendShapesMorph, toggleRecolorPanel, getSelectionColors, recolorSelectionColor, adjustSelectionColors, toggleMeasure, toggleShapeBuilder, selectSimilar, applyDistort, toggleCutTool, knifeCut, splitPathAt, toggleLivePaint, makeLivePaint, livePaintFillAt, releaseLivePaint, livePaintFaceAt, deleteLivePaintFaceAt, toggleWidthTool, setWidthPoint, clearWidthProfile, setTextVertical, toggleTouchType, setCharTransform, clearCharTransforms, toggleTypeOnPath, attachTextToPath, exitAllToolModes, toggleSliceTool, setChartData, toggleSymbolism, setSymbolismMode, applySymbolism, toggleCurveTool, commitCurvature, toggleReshapeTool, toggleBlobBrush, commitBlobStroke, togglePathEraser, commitPathErase, togglePuppetWarp, addPuppetPin, movePuppetPin, removePuppetPin, togglePerspectiveGrid, setPerspectiveGrid, projectToPlane,
    setCanvasBackgroundColor, setCanvasTexture, zoomToFitSlide,
    setSelectedTool, loadTemplate, loadPresentationTemplate, loadDesignTemplate, moveSelectedElements,
    toggleMainToolbar, toggleUtilityToolbar, toggleSlideToolbar, setSlideToolbarPosition,
    saveActiveSlide, updateGlobalSettings, togglePenStabilization, bumpDirtyRevision, setElementTransform, setStrokeDash
} from "./store/app-store";
import { setTransformPivot, clearTransformPivot, getCustomPivot } from "./utils/transform-pivot";
import { exportToSvg, exportArtboard, exportRegion, exportPageToPng } from "./utils/export";
import { PAGE_SIZE_PRESETS, getPagePreset } from "./config/page-size-presets";
import { CANVAS_THEMES } from "./config/canvas-themes";
import { magicResize } from "./utils/magic-resize";
import { templateRegistry, getTemplateById, getTemplatesByCategory, searchTemplates, refreshUserTemplates } from "./templates/registry";
import { saveCurrentAsTemplate, deleteUserTemplate } from "./templates/user-templates";
import { listBrandKits, saveBrandKit, deleteBrandKit, createBrandKit, extractBrandColorsFromDocument, applyBrandKit } from "./brand/brand-kits";
import { importSvgToCanvas } from "./utils/svg-import";
import { setRequestRecording } from "./utils/recording-manager";
import { insertStickFigure, recolorStickFigure, getStickAssetsByCategory, getAllStickAssets, STICK_CATEGORIES,
    insertAnimatedFigure, setAnimatedFigureClip, setAnimatedFigurePlaying, flipAnimatedFigure, bakeAnimatedFigure, CLIP_LIST,
    attachFigureToPath, detachFigurePath, setFigureSequence } from "./library/stick-figures";
import { TEXT_EFFECT_PRESETS, getTextEffectPreset } from "./config/text-effect-presets";
import { FONT_PAIRINGS, applyFontPairing } from "./brand/font-pairing";
import { searchStockPhotos, insertStockPhoto } from "./utils/stock-photos";
import { generateTints, generateHarmony, extractImagePalette, parseHex, type HarmonyType } from "./utils/color-harmony";
import type { ElementType, DrawingElement, FillStyle, StrokeStyle, FontFamily, TextAlign, ArrowHead, VerticalAlign, Point, GradientStop, GradientType, Layer, RichTextSpan, PathAnchor, PathSubpath } from "./types";
import type { Slide, SlideTransition, SlideDocument } from "./types/slide-types";
import type { PropertyTrack, TimedKeyframe } from "./types/motion-types";
import type { EasingName } from "./utils/animation/animation-types";
import { evaluateCompositionAt, resolveParentedPoses, resolveNestedOverrides } from "./utils/animation/composition-evaluator";
import { buildSlideDocument } from "./utils/document-io";
import { dimensionGeometry, type DimensionMeasure } from "./utils/dimension-geometry";
import { addDimension as storeAddDimension, removeDimension as storeRemoveDimension, removeDimensionsForTarget as storeRemoveDimensionsForTarget } from "./store/app-store";
import type { AlignmentType, DistributionType } from "./utils/alignment";
import type { LayoutDirection } from "./utils/mindmap-layout";
import { parseOutline } from "./utils/mindmap-layout";
import {
    animateElement,
    animateElements,
    animateElementKeyframes,
    animateAlongPath,
    animateMorph,
    animateElementsStagger,
    animateFrom,
    animateFromTo,
    animateElementsFrom,
    playEntranceAnimation,
    playExitAnimation,
    createTimeline,
    fadeIn,
    fadeOut,
    scaleIn,
    bounce,
    pulse,
    shakeX,
    typewriter,
    wordByWord,
    textScramble,
    textCountUp,
    lineByLine,
    charByChar,
    random,
    stopElementAnimation,
    stopAllElementAnimations,
    pauseElementAnimation,
    resumeElementAnimation,
    easings,
    animationEngine,
    createSpring
} from "./utils/animation";
import {
    animatePixelEffect,
    stopPixelEffect,
    pixelEffectPresets
} from "./utils/animation/pixel-effect-animator";
import {
    copyToClipboard, cutToClipboard, pasteFromClipboard,
    copyStyle, pasteStyle, flipSelected
} from "./utils/object-context-actions";
import { generateId } from "./utils/id-generator";
import { detectVideoProvider, getEmbedURL, getPosterURL } from "./utils/video-utils";
import { forceAutoSave, clearAutoSave } from "./storage/auto-save";
import { setRequestTimelapse, toggleTimelapse as toggleTimelapseAction, exportTimelapse as exportTimelapseAction, setTimelapsePlayerOpen } from "./utils/timelapse-manager";
import type { VideoFormat } from "./utils/video-recorder";
import { cloudStorageManager } from "./storage/cloud";
import { drawingId } from "./components/menu";
import { assignToPoolLane, unassignFromPool, shiftLaneIndicesOnRemove, shiftLaneIndicesOnInsert } from "./utils/pool-containment";
import { getUIShapeDef } from "./config/ui-shape-defs";
import { parseDSL as dslParse, renderDiagram, adapterRegistry, exportToRocket as rocketExport, rocketSchemaToDSL as rocketToDSL } from "./dsl";
import type { RenderOptions, RenderResult } from "./dsl";
import type { RocketExportResult } from "./dsl/adapters/rocket/types";
import {
    defaultColWidths, defaultRowHeights,
    insertTableRow, deleteTableRow, insertTableColumn, deleteTableColumn,
    sortTableData, tableDataToTSV, tableDataToCSV, parseClipboardTableData,
    mergeCells as doMergeCells, unmergeCells as doUnmergeCells, getMergedCellAt
} from "./utils/table-utils";

interface ElementOptions {
    strokeColor?: string;
    backgroundColor?: string;
    fillStyle?: FillStyle;
    strokeWidth?: number;
    strokeStyle?: StrokeStyle;
    pathAnchors?: PathAnchor[];
    pathClosed?: boolean;
    pathSubpaths?: PathSubpath[];
    opacity?: number;
    roughness?: number;
    angle?: number;
    roundness?: { type: number } | null;
    fontFamily?: FontFamily;
    fontSize?: number;
    letterSpacing?: number;
    textAlign?: TextAlign;
    verticalAlign?: VerticalAlign;
    startArrowhead?: ArrowHead;
    endArrowhead?: ArrowHead;
    seed?: number;
    layerId?: string;
    curveType?: 'straight' | 'bezier' | 'elbow';
    arrowAnchorAlign?: 'top' | 'middle' | 'bottom';
    startBinding?: { elementId: string; focus: number; gap: number; position?: string; anchorFractionX?: number; anchorFractionY?: number } | null;
    endBinding?: { elementId: string; focus: number; gap: number; position?: string; anchorFractionX?: number; anchorFractionY?: number } | null;

    // New Attributes
    text?: string;
    containerText?: string;
    curvedText?: boolean;             // flow containerText along the element's path / outline
    textPathOffset?: number;          // 0..1 start position for curved text along the path
    textPathSpacing?: number;         // extra px between glyphs for curved text
    textPathSide?: 'on' | 'outside';  // baseline placement for curved text
    locked?: boolean;
    link?: string | null;
    tag?: string | null;
    priority?: number; // Layer order implicitly handled by addElement but maybe useful?

    // Shape Specifics
    starPoints?: number;
    polygonSides?: number;
    burstPoints?: number;
    borderRadius?: number;
    tailPosition?: number;
    shapeRatio?: number;

    // Code Block
    codeShowLineNumbers?: boolean;
    codeStartLineNumber?: number;
    codeHighlightLine?: number;
    codeScrollOffset?: number;

    // Data Structure
    dsShowIndices?: boolean;
    dsDirection?: 'horizontal' | 'vertical';
    dsItemColor?: string;
    dsHighlightIndex?: number;
    dsPointerIndex?: number;
    dsCapacity?: number;
    dsAnimProgress?: number;
    dsAnimStyle?: string;
    dsHighlightIndex2?: number;
    dsHighlightColor?: string;
    dsHighlightColor2?: string;
    dsSortedBoundary?: number;
    dsSortedBoundaryEnd?: number;

    // Pie Chart data
    pieSlices?: Array<{ label: string; value: number; color?: string }>;
    // Gantt Chart data
    ganttTasks?: Array<{ id: string; label: string; section: string; startDate: string; endDate: string; duration: number; isCritical?: boolean; status?: 'done' | 'active' | 'default'; color?: string }>;
    // Journey Diagram data
    journeyTasks?: Array<{ label: string; score: number; actors: string[]; section: string; color?: string }>;
    // Quadrant Chart data
    quadrantData?: { title?: string; xAxisLabel?: [string, string]; yAxisLabel?: [string, string]; quadrantLabels: [string, string, string, string]; points: Array<{ label: string; x: number; y: number; color?: string }> };
    // XY Chart data
    xyChartData?: { title?: string; xAxis: { labels?: string[]; label?: string }; yAxis: { label?: string; min?: number; max?: number }; bars?: number[]; lines?: number[][] };

    // Advanced Styling
    fillDensity?: number;
    shadowEnabled?: boolean;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;

    // Gradients
    gradientStart?: string;
    gradientEnd?: string;
    gradientDirection?: number;
    gradientStops?: GradientStop[];
    gradientType?: GradientType;
    gradientHandlePositions?: { start: Point; end: Point };

    // Image fill (use with fillStyle: 'image') — paints an image clipped to the shape
    backgroundImage?: string;          // Image URL or data URL
    backgroundImageFit?: 'cover' | 'contain' | 'fill' | 'tile'; // default 'cover'
    backgroundOpacity?: number;        // 0-1, default 1

    // Non-destructive partial erase (eraser tool). Each stroke punches holes into
    // the rendered shape via destination-out compositing; points are element-local
    // (relative to x/y, flat-encoded [x, y, x, y...]), radius in world units.
    eraseStrokes?: { points: number[]; radius: number }[];

    // Border Extras
    drawInnerBorder?: boolean;
    innerBorderColor?: string;
    innerBorderDistance?: number;
    strokeLineJoin?: 'round' | 'bevel' | 'miter';

    // Interactive Behaviors
    spinEnabled?: boolean;
    spinSpeed?: number;
    orbitEnabled?: boolean;
    orbitCenterId?: string;
    orbitRadius?: number;
    orbitSpeed?: number;
    orbitDirection?: 'cw' | 'ccw';

    // Motion Graphics
    flowAnimation?: boolean;
    flowSpeed?: number;
    flowStyle?: 'dashes' | 'dots' | 'pulse';
    flowColor?: string;
    flowDensity?: number;
    flowReverse?: boolean;

    // Text Styling
    textColor?: string;
    textHighlightEnabled?: boolean;
    textHighlightColor?: string;
    textHighlightPadding?: number;
    textHighlightRadius?: number;

    // Rich Text (per-span formatting)
    richText?: RichTextSpan[];
    richContainerText?: RichTextSpan[];

    // Hierarchy (Mindmap)
    parentId?: string | null;
    isCollapsed?: boolean;
    // Generic/Specific
    points?: Point[] | number[];
    status?: 'pending' | 'loaded' | 'error';
    dataURL?: string;
    autoResize?: boolean;
    constrained?: boolean;

    // Image specifics
    scale?: [number, number];
    crop?: { x: number; y: number; width: number; height: number } | null;
    mimeType?: string;

    // Table specifics
    tableRows?: number;
    tableCols?: number;
    tableHeaders?: boolean;
    tableData?: string[][];
    tableColWidths?: number[];
    tableRowHeights?: number[];
    tableColAlignments?: ('left' | 'center' | 'right')[];
    tableHeaderColor?: string;
    tableHeaderTextColor?: string;
    tableRowColor?: string;
    tableAltRowColor?: string;

    // BPMN specifics
    bpmnEventType?: 'none' | 'message' | 'timer' | 'error' | 'signal' | 'conditional' | 'escalation' | 'compensation' | 'link' | 'terminate' | 'cancel';
    bpmnTaskType?: 'none' | 'user' | 'service' | 'script' | 'manual' | 'send' | 'receive' | 'businessRule';
    bpmnLoopType?: 'none' | 'standard' | 'parallel' | 'sequential' | 'compensation';
    bpmnIconScale?: number;
    bpmnIconColor?: string;
    bpmnIconFilled?: boolean;
    bpmnNonInterrupting?: boolean;
    bpmnLaneCount?: number;
    bpmnLaneLabels?: string[];
    bpmnLaneHeights?: number[];
    bpmnOrientation?: 'horizontal' | 'vertical';
    bpmnLaneColors?: string[];
    bpmnLaneTextColors?: string[];
    bpmnPoolLabelSize?: number;
    bpmnLaneLabelSize?: number;
    bpmnLaneCollapsed?: boolean[];

    // Pool containment
    poolContainerId?: string | null;
    poolLaneIndex?: number;
}

/**
 * Common synonyms scripters intuitively reach for that aren't real `ElementType`s.
 * The toolbar labels the circle tool "Ellipse", so `createElement('ellipse', …)` is a
 * very natural call — but `'ellipse'` isn't a valid type, and an unrecognized type
 * produces an invisible, non-functional element (no geometry, no Pathfinder/boolean
 * participation). Remap the obvious ones to what the caller clearly meant.
 */
const ELEMENT_TYPE_ALIASES: Record<string, ElementType> = {
    ellipse: 'circle',
    oval: 'circle',
    rect: 'rectangle',
    square: 'rectangle',
    tri: 'triangle',
};

/** Normalize a caller-supplied element type: resolve known synonyms, warn on remap. */
function normalizeElementType(type: ElementType): ElementType {
    const alias = ELEMENT_TYPE_ALIASES[type as string];
    if (alias) {
        console.warn(`[Yappy] createElement: '${type}' is not a valid element type; using '${alias}' instead.`);
        return alias;
    }
    return type;
}

export const YappyAPI = {
    /**
     * Get the current state wrapper
     */
    get state() {
        return store;
    },

    /**
     * Create a generic element
     */
    createElement(type: ElementType, x: number, y: number, width: number, height: number, options?: ElementOptions): string {
        type = normalizeElementType(type);
        const id = generateId(type);
        const defaults = store.defaultElementStyles;

        const element: DrawingElement = {
            id,
            type,
            x,
            y,
            width,
            height,
            strokeColor: options?.strokeColor ?? defaults.strokeColor ?? '#000000',
            backgroundColor: options?.backgroundColor ?? defaults.backgroundColor ?? 'transparent',
            fillStyle: options?.fillStyle ?? defaults.fillStyle ?? 'solid',
            strokeWidth: options?.strokeWidth ?? defaults.strokeWidth ?? 4,
            strokeStyle: options?.strokeStyle ?? defaults.strokeStyle ?? 'solid',
            opacity: options?.opacity ?? defaults.opacity ?? 100,
            roughness: options?.roughness ?? defaults.roughness ?? 1,
            angle: options?.angle ?? 0,
            renderStyle: defaults.renderStyle ?? 'sketch',
            seed: options?.seed ?? Math.floor(Math.random() * 2 ** 31),
            roundness: options?.roundness ?? defaults.roundness ?? null,
            fontFamily: options?.fontFamily ?? defaults.fontFamily ?? "hand-drawn",
            fontSize: options?.fontSize ?? defaults.fontSize ?? 28,
            letterSpacing: options?.letterSpacing,
            textAlign: options?.textAlign ?? defaults.textAlign ?? 'left',
            verticalAlign: options?.verticalAlign ?? 'middle',
            startArrowhead: options?.startArrowhead ?? defaults.startArrowhead ?? null,
            endArrowhead: options?.endArrowhead ?? defaults.endArrowhead ?? 'arrow',
            locked: options?.locked ?? false,
            link: options?.link ?? null,
            tag: options?.tag ?? null,
            layerId: options?.layerId ?? store.activeLayerId,
            curveType: options?.curveType ?? 'straight',
            arrowAnchorAlign: options?.arrowAnchorAlign,
            containerText: options?.containerText ?? '',
            curvedText: options?.curvedText ?? undefined,
            textPathOffset: options?.textPathOffset,
            textPathSpacing: options?.textPathSpacing,
            textPathSide: options?.textPathSide,

            // New Properties Defaults
            parentId: options?.parentId ?? null,
            isCollapsed: options?.isCollapsed ?? false,
            autoResize: options?.autoResize ?? false,
            constrained: options?.constrained ?? false,

            starPoints: options?.starPoints,
            polygonSides: options?.polygonSides,
            burstPoints: options?.burstPoints,
            borderRadius: options?.borderRadius,

            shadowEnabled: options?.shadowEnabled ?? false,
            shadowColor: options?.shadowColor,
            shadowBlur: options?.shadowBlur,
            shadowOffsetX: options?.shadowOffsetX,
            shadowOffsetY: options?.shadowOffsetY,

            gradientStart: options?.gradientStart,
            gradientEnd: options?.gradientEnd,
            gradientDirection: options?.gradientDirection,
            gradientStops: options?.gradientStops,
            gradientType: options?.gradientType,
            gradientHandlePositions: options?.gradientHandlePositions,

            backgroundImage: options?.backgroundImage,
            backgroundImageFit: options?.backgroundImageFit,
            backgroundOpacity: options?.backgroundOpacity,

            drawInnerBorder: options?.drawInnerBorder,
            innerBorderColor: options?.innerBorderColor,
            innerBorderDistance: options?.innerBorderDistance,
            strokeLineJoin: options?.strokeLineJoin,

            spinEnabled: options?.spinEnabled,
            spinSpeed: options?.spinSpeed,
            orbitEnabled: options?.orbitEnabled,
            orbitCenterId: options?.orbitCenterId,
            orbitRadius: options?.orbitRadius,
            orbitSpeed: options?.orbitSpeed,
            orbitDirection: options?.orbitDirection,

            flowAnimation: options?.flowAnimation,
            flowSpeed: options?.flowSpeed,
            flowStyle: options?.flowStyle,
            flowColor: options?.flowColor,
            flowDensity: options?.flowDensity,

            // Text Styling
            textColor: options?.textColor,
            textHighlightEnabled: options?.textHighlightEnabled ?? false,
            textHighlightColor: options?.textHighlightColor,
            textHighlightPadding: options?.textHighlightPadding,
            textHighlightRadius: options?.textHighlightRadius,

            ...options
        };

        // Initialize points for connectors (line, arrow, bezier) if not provided
        const isConnectorType = element.type === 'line' || element.type === 'arrow' || element.type === 'bezier';
        if (isConnectorType &&
            (element.curveType === 'elbow' || element.curveType === 'bezier' || element.type === 'bezier') &&
            (!element.points || element.points.length === 0)) {
            element.points = [0, 0, element.width, element.height];
        }

        addElement(element);
        return id;
    },

    // --- Basic Shapes ---

    createRectangle(x: number, y: number, width: number, height: number, options?: ElementOptions) {
        return this.createElement('rectangle', x, y, width, height, options);
    },

    createCircle(x: number, y: number, width: number, height: number, options?: ElementOptions) {
        return this.createElement('circle', x, y, width, height, options);
    },

    createDiamond(x: number, y: number, width: number, height: number, options?: ElementOptions) {
        return this.createElement('diamond', x, y, width, height, options);
    },

    createTriangle(x: number, y: number, width: number, height: number, options?: ElementOptions) {
        return this.createElement('triangle', x, y, width, height, options);
    },

    createPolygonalShape(type: ElementType, x: number, y: number, width: number, height: number, options?: ElementOptions) {
        // Wrapper for all polygon types: hexagon, octagon, star, cloud, etc.
        return this.createElement(type, x, y, width, height, options);
    },

    createStar(x: number, y: number, width: number, height: number, points: number = 5, options?: ElementOptions) {
        return this.createElement('star', x, y, width, height, { ...options, starPoints: points });
    },

    // --- Wireframing & Sketchnotes ---

    createBrowserWindow(x: number, y: number, width: number, height: number, options?: ElementOptions) {
        return this.createElement('browserWindow', x, y, width, height, options);
    },

    createStickyNote(x: number, y: number, width: number, height: number, text?: string, options?: ElementOptions) {
        return this.createElement('stickyNote', x, y, width, height, { ...options, containerText: text });
    },

    createUIComponent(type: ElementType, x: number, y: number, width?: number, height?: number, options?: ElementOptions) {
        const def = getUIShapeDef(type);
        const w = width ?? def?.defaultWidth ?? 200;
        const h = height ?? def?.defaultHeight ?? 100;
        return this.createElement(type, x, y, w, h, options);
    },

    /**
     * Create a BPMN shape
     * @param type - BPMN shape type (e.g., 'bpmnStartEvent', 'bpmnTask', 'bpmnPool')
     * @param x - X position
     * @param y - Y position
     * @param width - Width (defaults vary by shape type)
     * @param height - Height (defaults vary by shape type)
     * @param options - Optional styling and BPMN-specific properties (bpmnEventType, bpmnTaskType, bpmnLoopType)
     */
    createBpmnShape(type: 'bpmnStartEvent' | 'bpmnEndEvent' | 'bpmnIntermediateEvent' | 'bpmnExclusiveGateway' | 'bpmnParallelGateway' | 'bpmnInclusiveGateway' | 'bpmnEventGateway' | 'bpmnTask' | 'bpmnSubProcess' | 'bpmnCallActivity' | 'bpmnDataObject' | 'bpmnAnnotation' | 'bpmnPool' | 'bpmnDataStore' | 'bpmnGroup', x: number, y: number, width?: number, height?: number, options?: ElementOptions): string | null {
        const bpmnDefaults: Record<string, { w: number; h: number }> = {
            bpmnStartEvent: { w: 50, h: 50 },
            bpmnEndEvent: { w: 50, h: 50 },
            bpmnIntermediateEvent: { w: 50, h: 50 },
            bpmnExclusiveGateway: { w: 60, h: 60 },
            bpmnParallelGateway: { w: 60, h: 60 },
            bpmnInclusiveGateway: { w: 60, h: 60 },
            bpmnEventGateway: { w: 60, h: 60 },
            bpmnTask: { w: 120, h: 80 },
            bpmnCallActivity: { w: 120, h: 80 },
            bpmnSubProcess: { w: 140, h: 90 },
            bpmnDataObject: { w: 60, h: 80 },
            bpmnAnnotation: { w: 120, h: 60 },
            bpmnPool: { w: 600, h: 300 },
            bpmnDataStore: { w: 70, h: 70 },
            bpmnGroup: { w: 200, h: 150 },
        };
        const defaults = bpmnDefaults[type] ?? { w: 100, h: 80 };
        const w = width ?? defaults.w;
        const h = height ?? defaults.h;
        return this.createElement(type as ElementType, x, y, w, h, options);
    },

    createSolidButton(x: number, y: number, label?: string, options?: ElementOptions) {
        return this.createUIComponent('solidButton', x, y, undefined, undefined, { ...options, containerText: label });
    },

    createDropdown(x: number, y: number, label?: string, options?: ElementOptions) {
        return this.createUIComponent('dropdown', x, y, undefined, undefined, { ...options, containerText: label });
    },

    createCard(x: number, y: number, width?: number, height?: number, options?: ElementOptions) {
        return this.createUIComponent('card', x, y, width, height, options);
    },

    // --- Linear Elements ---

    createLine(x1: number, y1: number, x2: number, y2: number, options?: ElementOptions) {
        const width = x2 - x1;
        const height = y2 - y1;
        return this.createElement('line', x1, y1, width, height, options);
    },

    createArrow(x1: number, y1: number, x2: number, y2: number, options?: ElementOptions) {
        const width = x2 - x1;
        const height = y2 - y1;
        return this.createElement('arrow', x1, y1, width, height, { ...options });
    },

    createBezier(x1: number, y1: number, x2: number, y2: number, options?: ElementOptions) {
        const width = x2 - x1;
        const height = y2 - y1;
        return this.createElement('bezier', x1, y1, width, height, { ...options, curveType: 'bezier' });
    },

    createOrganicBranch(x1: number, y1: number, x2: number, y2: number, options?: ElementOptions) {
        const width = x2 - x1;
        const height = y2 - y1;
        return this.createElement('organicBranch', x1, y1, width, height, {
            ...options,
            curveType: 'bezier',
            strokeWidth: options?.strokeWidth ?? 3, // Branches usually thicker
        });
    },

    /**
     * Create an editable vector `path` element from a list of anchors. Anchor
     * coordinates may be in any local frame; the element is placed at the anchors'
     * bounding box and the stored anchors are normalized relative to that origin
     * (handles included in the bbox so they aren't clipped). Returns the new id, or
     * null if fewer than 2 anchors were given.
     */
    createPath(anchors: PathAnchor[], options?: ElementOptions & { closed?: boolean }): string | null {
        if (!anchors || anchors.length < 2) return null;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const a of anchors) {
            const xs = [a.x, a.x + (a.outX ?? 0), a.x + (a.inX ?? 0)];
            const ys = [a.y, a.y + (a.outY ?? 0), a.y + (a.inY ?? 0)];
            minX = Math.min(minX, ...xs); maxX = Math.max(maxX, ...xs);
            minY = Math.min(minY, ...ys); maxY = Math.max(maxY, ...ys);
        }
        const width = Math.max(1, maxX - minX);
        const height = Math.max(1, maxY - minY);
        const normalized: PathAnchor[] = anchors.map(a => ({ ...a, x: a.x - minX, y: a.y - minY }));
        const { closed, ...rest } = options ?? {};
        return this.createElement('path', minX, minY, width, height, {
            ...rest,
            pathAnchors: normalized,
            pathClosed: closed ?? options?.pathClosed ?? false,
            backgroundColor: options?.backgroundColor ?? 'transparent',
        });
    },

    /**
     * Create a multi-subpath `path` element (holes / disjoint islands). Each subpath's
     * anchors are in a shared frame; the whole set is normalized to its combined bbox.
     * Overlapping closed subpaths punch holes via the even-odd fill rule.
     */
    createMultiPath(subpaths: PathSubpath[], options?: ElementOptions): string | null {
        const usable = (subpaths ?? []).filter(sp => sp.anchors && sp.anchors.length >= 2);
        if (usable.length === 0) return null;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const sp of usable) for (const a of sp.anchors) {
            const xs = [a.x, a.x + (a.outX ?? 0), a.x + (a.inX ?? 0)];
            const ys = [a.y, a.y + (a.outY ?? 0), a.y + (a.inY ?? 0)];
            minX = Math.min(minX, ...xs); maxX = Math.max(maxX, ...xs);
            minY = Math.min(minY, ...ys); maxY = Math.max(maxY, ...ys);
        }
        const width = Math.max(1, maxX - minX), height = Math.max(1, maxY - minY);
        const norm: PathSubpath[] = usable.map(sp => ({
            closed: sp.closed,
            anchors: sp.anchors.map(a => ({ ...a, x: a.x - minX, y: a.y - minY })),
        }));
        return this.createElement('path', minX, minY, width, height, {
            ...options,
            pathSubpaths: norm,
            pathAnchors: undefined,
            backgroundColor: options?.backgroundColor ?? '#cccccc',
        });
    },

    /** Read back an editable path's anchors + closed flag, or its subpaths (null if not a path). */
    getPath(id: string): { anchors?: PathAnchor[]; closed?: boolean; subpaths?: PathSubpath[] } | null {
        const el = this.getElement(id);
        if (!el || el.type !== 'path') return null;
        if (el.pathSubpaths && el.pathSubpaths.length) return { subpaths: el.pathSubpaths };
        if (el.pathAnchors) return { anchors: el.pathAnchors, closed: !!el.pathClosed };
        return null;
    },

    // --- Generative shapes (Illustrator: Spiral / Arc / Rectangular & Polar Grid) ---

    /** Archimedean spiral as an open path. `decay` (0..1) tightens each turn toward the centre. */
    createSpiral(cx: number, cy: number, radius: number, turns = 3, decay = 0, options?: ElementOptions): string | null {
        const total = Math.max(0.5, turns) * Math.PI * 2;
        const steps = Math.max(24, Math.round(turns * 48));
        const k = Math.min(0.95, Math.max(0, decay));
        const anchors: PathAnchor[] = [];
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;            // 0 at the centre → 1 at the outer edge
            const ang = t * total;
            // r grows 0 → radius. decay>0 raises the exponent so growth is slower early,
            // tightening the inner turns toward the centre (k=0 → plain Archimedean).
            const r = radius * Math.pow(t, 1 + k * 3);
            anchors.push({ x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r, kind: 'smooth' });
        }
        return this.createPath(anchors, { ...options, closed: false, backgroundColor: 'transparent' });
    },

    /** Circular arc as an open path (angles in degrees, clockwise from +x). A full 360°
     *  sweep produces a closed circle (no seam). */
    createArc(cx: number, cy: number, radius: number, startDeg = 0, endDeg = 270, options?: ElementOptions): string | null {
        const full = Math.abs(endDeg - startDeg) >= 360;
        const a0 = (startDeg * Math.PI) / 180, a1 = (endDeg * Math.PI) / 180;
        const steps = Math.max(8, Math.round(Math.abs(endDeg - startDeg) / 4));
        const anchors: PathAnchor[] = [];
        // For a full circle, don't duplicate the closing vertex — let pathClosed seal it.
        const last = full ? steps - 1 : steps;
        for (let i = 0; i <= last; i++) {
            const ang = a0 + (a1 - a0) * (i / steps);
            anchors.push({ x: cx + Math.cos(ang) * radius, y: cy + Math.sin(ang) * radius, kind: 'smooth' });
        }
        return this.createPath(anchors, { ...options, closed: full, backgroundColor: 'transparent' });
    },

    /** Rectangular grid (rows × cols cells) as a grouped set of line segments. */
    createRectGrid(x: number, y: number, width: number, height: number, rows = 4, cols = 4, options?: ElementOptions): string | null {
        const ids: string[] = [];
        for (let c = 0; c <= cols; c++) { const gx = x + (width * c) / cols; const id = this.createLine(gx, y, gx, y + height, options); if (id) ids.push(id); }
        for (let r = 0; r <= rows; r++) { const gy = y + (height * r) / rows; const id = this.createLine(x, gy, x + width, gy, options); if (id) ids.push(id); }
        if (!ids.length) return null;
        this.setSelected(ids); groupSelected();
        return store.selection[0] ?? ids[0];
    },

    /** Polar grid: `rings` concentric circles + `spokes` radial lines, grouped. */
    createPolarGrid(cx: number, cy: number, radius: number, rings = 3, spokes = 8, options?: ElementOptions): string | null {
        const ids: string[] = [];
        for (let r = 1; r <= rings; r++) {
            const rr = (radius * r) / rings;
            const circ = this.createArc(cx, cy, rr, 0, 360, options);
            if (circ) ids.push(circ);
        }
        for (let s = 0; s < spokes; s++) {
            const ang = (s / spokes) * Math.PI * 2;
            const id = this.createLine(cx, cy, cx + Math.cos(ang) * radius, cy + Math.sin(ang) * radius, options);
            if (id) ids.push(id);
        }
        if (!ids.length) return null;
        this.setSelected(ids); groupSelected();
        return store.selection[0] ?? ids[0];
    },

    /**
     * Lens Flare — a bright centre glow, radiating rays, concentric halo rings, and a few
     * "ghost" circles along an axis, grouped. `rays` spokes, `ghosts` lens reflections.
     */
    createFlare(cx: number, cy: number, radius: number, rays = 12, ghosts = 4, options?: ElementOptions): string | null {
        // NOTE: element opacity is on a 0–100 scale (not 0–1).
        const ids: string[] = [];
        const warm = options?.strokeColor || '#f59e0b';   // amber — visible on light & dark
        const glow = options?.backgroundColor || '#fde68a';
        const circ = (x: number, y: number, d: number, o: Partial<ElementOptions>) => { const id = this.createCircle(x - d / 2, y - d / 2, d, d, { ...options, ...o } as ElementOptions); if (id) ids.push(id); };

        // soft outer glow → bright core (concentric, increasing opacity)
        circ(cx, cy, radius * 2.0, { backgroundColor: glow, strokeColor: 'transparent', opacity: 22 });
        circ(cx, cy, radius * 1.15, { backgroundColor: glow, strokeColor: 'transparent', opacity: 40 });
        circ(cx, cy, radius * 0.5, { backgroundColor: '#fffbeb', strokeColor: warm, strokeWidth: 1, opacity: 95 });
        // radiating rays — tapered light streaks (not hard lines). Each ray is a thin
        // triangle that emerges from the glow and narrows to a point at the tip; a wider,
        // fainter spike sits behind a narrow warm-white core so it reads as light on both
        // light and dark canvases.
        const spike = (ang: number, len: number, halfW: number, color: string, o: number) => {
            const dx = Math.cos(ang), dy = Math.sin(ang);   // ray direction
            const px = -dy, py = dx;                        // perpendicular
            const r0 = radius * 0.16;                       // base sits just outside the core
            const bx = cx + dx * r0, by = cy + dy * r0;     // base centre
            const tx = cx + dx * len, ty = cy + dy * len;   // apex (tip)
            const anchors: PathAnchor[] = [
                { x: bx + px * halfW, y: by + py * halfW, kind: 'corner' },
                { x: tx, y: ty, kind: 'corner' },
                { x: bx - px * halfW, y: by - py * halfW, kind: 'corner' },
            ];
            const id = this.createPath(anchors, { ...options, closed: true, fillStyle: 'solid', backgroundColor: color, strokeColor: 'transparent', strokeWidth: 0, opacity: o });
            if (id) ids.push(id);
        };
        for (let i = 0; i < rays; i++) {
            const ang = (i / rays) * Math.PI * 2;
            const len = radius * (i % 2 === 0 ? 1.3 : 0.72);
            spike(ang, len, radius * 0.07, warm, 34);        // soft amber halo (wide, faint)
            spike(ang, len * 0.94, radius * 0.022, '#fffbeb', 82); // hot warm-white core (narrow, bright)
        }
        // halo rings
        for (let k = 1; k <= 2; k++) circ(cx, cy, radius * (0.9 + k * 0.6), { backgroundColor: 'transparent', strokeColor: warm, strokeWidth: 1.5, opacity: 50 });
        // ghost reflections along the 45° axis
        for (let j = 1; j <= ghosts; j++) {
            const t = j / (ghosts + 1);
            const gx = cx + Math.cos(Math.PI / 4) * radius * 2 * (t - 0.3);
            const gy = cy + Math.sin(Math.PI / 4) * radius * 2 * (t - 0.3);
            circ(gx, gy, radius * (0.24 + 0.32 * (j % 2)), { backgroundColor: glow, strokeColor: warm, strokeWidth: 1, opacity: 45 });
        }
        if (!ids.length) return null;
        this.setSelected(ids); groupSelected();
        return store.selection[0] ?? ids[0];
    },

    // --- Specialized Elements ---

    createText(x: number, y: number, text: string, options?: ElementOptions) {
        const id = generateId('text');
        const defaults = store.defaultElementStyles;
        const fontSize = options?.fontSize ?? defaults.fontSize ?? 28;
        // Approximation
        const estimatedWidth = text.length * (fontSize * 0.6);

        const element: DrawingElement = {
            id,
            type: 'text',
            x,
            y,
            width: estimatedWidth,
            height: fontSize * 1.5,
            text: text,
            strokeColor: options?.strokeColor ?? defaults.strokeColor ?? '#000000',
            backgroundColor: 'transparent',
            fillStyle: 'solid',
            strokeWidth: 1,
            strokeStyle: 'solid',
            opacity: options?.opacity ?? 100,
            roughness: 0,
            angle: options?.angle ?? 0,
            renderStyle: defaults.renderStyle ?? 'architectural',
            seed: Math.floor(Math.random() * 2 ** 31),
            roundness: null,
            fontFamily: options?.fontFamily ?? defaults.fontFamily ?? "hand-drawn",
            fontSize: fontSize,
            textAlign: options?.textAlign ?? defaults.textAlign ?? 'left',
            verticalAlign: options?.verticalAlign ?? 'middle',
            locked: false,
            link: null,
            layerId: options?.layerId ?? store.activeLayerId,
            ...options
        };

        addElement(element);
        return id;
    },

    createImage(x: number, y: number, dataURL: string, width: number, height: number, options?: ElementOptions) {
        return this.createElement('image', x, y, width, height, {
            ...options,
            backgroundColor: 'transparent', // Images usually transparent bg
            fillStyle: 'solid',
            // dataURL should be handled by the updateElement or if we want to add it to generic createElement we need to add it to ElementOptions but it is specific.
            // We'll hack it in via the options spread which casts to DrawingElement
            // @ts-ignore
            dataURL: dataURL,
            status: 'loaded'
        });
    },

    // --- Video Elements ---

    /**
     * Create a video element
     * @param x - X position
     * @param y - Y position
     * @param videoURL - Video URL (YouTube, Vimeo, or direct MP4/WebM)
     * @param width - Width (default 480)
     * @param height - Height (default 270)
     * @param options - Additional element options
     */
    createVideo(x: number, y: number, videoURL: string, width: number = 480, height: number = 270, options?: ElementOptions) {
        const provider = detectVideoProvider(videoURL);
        const embedURL = getEmbedURL(videoURL, provider);
        const posterURL = getPosterURL(videoURL, provider);

        return this.createElement('video', x, y, width, height, {
            ...options,
            backgroundColor: '#1a1a2e',
            fillStyle: 'solid',
            strokeWidth: 0,
            // @ts-ignore - video-specific properties
            videoURL,
            videoEmbedURL: embedURL || undefined,
            videoPosterURL: posterURL || undefined,
            videoProvider: provider,
            videoAutoplay: false,
            videoLoop: false,
            videoMuted: true,
            videoLocked: false,
        });
    },

    // --- Table Elements ---

    /**
     * Create a table element
     * @param x - X position
     * @param y - Y position
     * @param width - Table width
     * @param height - Table height
     * @param rows - Number of data rows (default 3)
     * @param cols - Number of columns (default 3)
     * @param options - Additional table options
     */
    createTable(x: number, y: number, width: number, height: number, rows: number = 3, cols: number = 3, options?: ElementOptions) {
        const hasHeader = options?.tableHeaders !== false;
        const totalDataRows = hasHeader ? rows + 1 : rows;

        // Initialize table data with headers
        const tableData: string[][] = [];
        if (hasHeader) {
            tableData.push(Array.from({ length: cols }, (_, i) => `Col ${i + 1}`));
        }
        for (let r = 0; r < rows; r++) {
            tableData.push(Array.from({ length: cols }, () => ''));
        }

        return this.createElement('table', x, y, width, height, {
            ...options,
            tableRows: rows,
            tableCols: cols,
            tableHeaders: hasHeader,
            tableData: options?.tableData ?? tableData,
            tableColWidths: options?.tableColWidths ?? defaultColWidths(cols),
            tableRowHeights: options?.tableRowHeights ?? defaultRowHeights(totalDataRows),
            tableHeaderColor: options?.tableHeaderColor ?? '#e2e8f0',
        });
    },

    /**
     * Set the value of a table cell
     * @param tableId - Table element ID
     * @param row - Row index (0-based, includes header if present)
     * @param col - Column index (0-based)
     * @param value - Cell value
     */
    setTableCell(tableId: string, row: number, col: number, value: string) {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const data = table.tableData ? table.tableData.map(r => [...r]) : [];
        if (data[row]) {
            data[row][col] = value;
            updateElement(tableId, { tableData: data }, true);
        }
    },

    /**
     * Get the value of a table cell
     * @param tableId - Table element ID
     * @param row - Row index (0-based)
     * @param col - Column index (0-based)
     */
    getTableCell(tableId: string, row: number, col: number): string | null {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') return null;
        return table.tableData?.[row]?.[col] ?? null;
    },

    /**
     * Insert a row into a table
     * @param tableId - Table element ID
     * @param atIndex - Index to insert at (in tableData)
     */
    insertTableRow(tableId: string, atIndex: number) {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const data = table.tableData ?? [];
        const result = insertTableRow(data, atIndex);
        const hasHeader = table.tableHeaders !== false;
        const newRows = hasHeader ? result.data.length - 1 : result.data.length;

        updateElement(tableId, {
            tableData: result.data,
            tableRowHeights: result.rowHeights,
            tableRows: newRows,
        }, true);
    },

    /**
     * Delete a row from a table
     * @param tableId - Table element ID
     * @param atIndex - Index to delete (in tableData)
     */
    deleteTableRow(tableId: string, atIndex: number) {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const data = table.tableData ?? [];
        const rowHeights = table.tableRowHeights ?? [];
        const result = deleteTableRow(data, rowHeights, atIndex);
        const hasHeader = table.tableHeaders !== false;
        const newRows = hasHeader ? result.data.length - 1 : result.data.length;

        updateElement(tableId, {
            tableData: result.data,
            tableRowHeights: result.rowHeights,
            tableRows: newRows,
        }, true);
    },

    /**
     * Insert a column into a table
     * @param tableId - Table element ID
     * @param atIndex - Index to insert at
     */
    insertTableColumn(tableId: string, atIndex: number) {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const data = table.tableData ?? [];
        const colWidths = table.tableColWidths ?? [];
        const hasHeader = table.tableHeaders !== false;
        const result = insertTableColumn(data, colWidths, atIndex, hasHeader);

        updateElement(tableId, {
            tableData: result.data,
            tableColWidths: result.colWidths,
            tableCols: result.colWidths.length,
        }, true);
    },

    /**
     * Delete a column from a table
     * @param tableId - Table element ID
     * @param atIndex - Index to delete
     */
    deleteTableColumn(tableId: string, atIndex: number) {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const data = table.tableData ?? [];
        const colWidths = table.tableColWidths ?? [];
        const result = deleteTableColumn(data, colWidths, atIndex);

        updateElement(tableId, {
            tableData: result.data,
            tableColWidths: result.colWidths,
            tableCols: result.colWidths.length,
        }, true);
    },

    /**
     * Sort table data by a column
     * @param tableId - Table element ID
     * @param colIndex - Column index to sort by
     * @param direction - Sort direction ('asc' or 'desc')
     */
    sortTableColumn(tableId: string, colIndex: number, direction: 'asc' | 'desc' = 'asc') {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const data = table.tableData ?? [];
        const hasHeader = table.tableHeaders !== false;

        // Sort only body rows, keep header
        if (hasHeader && data.length > 1) {
            const header = data[0];
            const body = data.slice(1);
            const sortedBody = sortTableData(body, colIndex, direction);
            updateElement(tableId, {
                tableData: [header, ...sortedBody],
                tableSortCol: colIndex,
                tableSortDir: direction,
            }, true);
        } else if (!hasHeader && data.length > 0) {
            const sorted = sortTableData(data, colIndex, direction);
            updateElement(tableId, {
                tableData: sorted,
                tableSortCol: colIndex,
                tableSortDir: direction,
            }, true);
        }
    },

    /**
     * Set column alignment for a table
     * @param tableId - Table element ID
     * @param colIndex - Column index
     * @param alignment - Alignment ('left', 'center', 'right')
     */
    setTableColumnAlignment(tableId: string, colIndex: number, alignment: 'left' | 'center' | 'right') {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const cols = table.tableCols ?? 3;
        const alignments = table.tableColAlignments ? [...table.tableColAlignments] : [];

        // Ensure array is large enough
        while (alignments.length < cols) {
            alignments.push('center');
        }

        alignments[colIndex] = alignment;
        updateElement(tableId, { tableColAlignments: alignments }, true);
    },

    /**
     * Set column width for a table (as fraction of total width)
     * @param tableId - Table element ID
     * @param colIndex - Column index
     * @param width - Width as fraction (0-1)
     */
    setTableColumnWidth(tableId: string, colIndex: number, width: number) {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const cols = table.tableCols ?? 3;
        const colWidths = table.tableColWidths ? [...table.tableColWidths] : defaultColWidths(cols);

        const oldWidth = colWidths[colIndex];
        const otherColsTotal = 1 - oldWidth;

        if (otherColsTotal > 0) {
            colWidths[colIndex] = Math.max(0.05, Math.min(0.8, width));
            // Redistribute remaining space proportionally
            for (let c = 0; c < cols; c++) {
                if (c !== colIndex) {
                    colWidths[c] = colWidths[c] * (1 - colWidths[colIndex]) / otherColsTotal;
                }
            }
        }

        updateElement(tableId, { tableColWidths: colWidths }, true);
    },

    /**
     * Set table styling options
     * @param tableId - Table element ID
     * @param options - Styling options
     */
    setTableStyle(tableId: string, options: {
        headerColor?: string;
        headerTextColor?: string;
        rowColor?: string;
        altRowColor?: string;
    }) {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const updates: Partial<DrawingElement> = {};
        if (options.headerColor !== undefined) updates.tableHeaderColor = options.headerColor;
        if (options.headerTextColor !== undefined) updates.tableHeaderTextColor = options.headerTextColor;
        if (options.rowColor !== undefined) updates.tableRowColor = options.rowColor;
        if (options.altRowColor !== undefined) updates.tableAltRowColor = options.altRowColor;

        updateElement(tableId, updates, true);
    },

    /**
     * Get all table data as a 2D array
     * @param tableId - Table element ID
     */
    getTableData(tableId: string): string[][] | null {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') return null;
        return table.tableData ?? null;
    },

    /**
     * Set all table data at once
     * @param tableId - Table element ID
     * @param data - 2D array of cell values
     */
    setTableData(tableId: string, data: string[][]) {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const hasHeader = table.tableHeaders !== false;
        const rows = hasHeader ? data.length - 1 : data.length;
        const cols = data[0]?.length ?? 3;

        updateElement(tableId, {
            tableData: data,
            tableRows: rows,
            tableCols: cols,
            tableColWidths: defaultColWidths(cols),
            tableRowHeights: defaultRowHeights(data.length),
        }, true);
    },

    /**
     * Copy table data to clipboard as TSV
     * @param tableId - Table element ID
     */
    async copyTableToClipboard(tableId: string): Promise<boolean> {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table' || !table.tableData) {
            console.error('Element is not a table or has no data');
            return false;
        }
        try {
            const tsv = tableDataToTSV(table.tableData);
            await navigator.clipboard.writeText(tsv);
            return true;
        } catch (err) {
            console.error('Failed to copy table data:', err);
            return false;
        }
    },

    /**
     * Export table data as CSV string
     * @param tableId - Table element ID
     */
    exportTableAsCSV(tableId: string): string | null {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table' || !table.tableData) {
            console.error('Element is not a table or has no data');
            return null;
        }
        return tableDataToCSV(table.tableData);
    },

    /**
     * Paste clipboard data into a table
     * @param tableId - Table element ID
     */
    async pasteIntoTable(tableId: string): Promise<boolean> {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return false;
        }
        try {
            const text = await navigator.clipboard.readText();
            const parsedData = parseClipboardTableData(text);
            if (parsedData && parsedData.length > 0) {
                const hasHeader = table.tableHeaders !== false;
                const newRows = hasHeader ? parsedData.length - 1 : parsedData.length;
                const newCols = parsedData[0].length;
                updateElement(tableId, {
                    tableData: parsedData,
                    tableRows: newRows,
                    tableCols: newCols,
                    tableColWidths: defaultColWidths(newCols),
                    tableRowHeights: defaultRowHeights(parsedData.length),
                }, true);
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to paste into table:', err);
            return false;
        }
    },

    /**
     * Import CSV/TSV string into a table
     * @param tableId - Table element ID
     * @param csvData - CSV or TSV string data
     */
    importTableFromCSV(tableId: string, csvData: string): boolean {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return false;
        }
        const parsedData = parseClipboardTableData(csvData);
        if (parsedData && parsedData.length > 0) {
            const hasHeader = table.tableHeaders !== false;
            const newRows = hasHeader ? parsedData.length - 1 : parsedData.length;
            const newCols = parsedData[0].length;
            updateElement(tableId, {
                tableData: parsedData,
                tableRows: newRows,
                tableCols: newCols,
                tableColWidths: defaultColWidths(newCols),
                tableRowHeights: defaultRowHeights(parsedData.length),
            }, true);
            return true;
        }
        return false;
    },

    /**
     * Merge a range of cells in a table
     * @param tableId - Table element ID
     * @param startRow - Starting row index
     * @param startCol - Starting column index
     * @param endRow - Ending row index
     * @param endCol - Ending column index
     */
    mergeCells(tableId: string, startRow: number, startCol: number, endRow: number, endCol: number): boolean {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return false;
        }

        const mergedCells = table.tableMergedCells ?? [];
        const newMergedCells = doMergeCells(mergedCells, startRow, startCol, endRow, endCol);

        updateElement(tableId, { tableMergedCells: newMergedCells }, true);
        return true;
    },

    /**
     * Unmerge cells at a given position
     * @param tableId - Table element ID
     * @param row - Row index of any cell in the merge
     * @param col - Column index of any cell in the merge
     */
    unmergeCells(tableId: string, row: number, col: number): boolean {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return false;
        }

        const mergedCells = table.tableMergedCells ?? [];
        const mergeAt = getMergedCellAt(mergedCells, row, col);

        if (!mergeAt) {
            console.warn('No merged cell at this position');
            return false;
        }

        const newMergedCells = doUnmergeCells(mergedCells, row, col);
        updateElement(tableId, { tableMergedCells: newMergedCells }, true);
        return true;
    },

    /**
     * Get merged cells info for a table
     * @param tableId - Table element ID
     */
    getMergedCells(tableId: string): { startRow: number; startCol: number; endRow: number; endCol: number }[] | null {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') return null;
        return table.tableMergedCells ?? [];
    },

    // --- Code Block API ---

    /**
     * Create a code block element with dark theme defaults
     * @param x - X position
     * @param y - Y position
     * @param width - Width
     * @param height - Height
     * @param code - Initial code content
     * @param options - Additional options (title via containerText, line numbers, etc.)
     */
    createCodeBlock(x: number, y: number, width: number, height: number, code?: string, options?: ElementOptions): string {
        return this.createElement('codeBlock', x, y, width, height, {
            backgroundColor: '#1e293b',
            fillStyle: 'solid',
            strokeColor: '#334155',
            textColor: '#e2e8f0',
            fontFamily: 'code',
            fontSize: 14,
            textAlign: 'left',
            borderRadius: 4,
            codeShowLineNumbers: true,
            codeStartLineNumber: 1,
            ...options,
            text: code ?? options?.text ?? '',
        });
    },

    /**
     * Get the code text content of a code block
     * @param codeBlockId - Code block element ID
     */
    getCodeBlockText(codeBlockId: string): string | null {
        const el = this.getElement(codeBlockId);
        if (!el || el.type !== 'codeBlock') return null;
        return el.text ?? '';
    },

    /**
     * Set the code text content of a code block
     * @param codeBlockId - Code block element ID
     * @param code - New code content
     */
    setCodeBlockText(codeBlockId: string, code: string): void {
        const el = this.getElement(codeBlockId);
        if (!el || el.type !== 'codeBlock') return;
        updateElement(codeBlockId, { text: code }, true);
    },

    /**
     * Get the title (filename/language label) of a code block
     * @param codeBlockId - Code block element ID
     */
    getCodeBlockTitle(codeBlockId: string): string | null {
        const el = this.getElement(codeBlockId);
        if (!el || el.type !== 'codeBlock') return null;
        return el.containerText ?? '';
    },

    /**
     * Set the title (filename/language label) of a code block
     * @param codeBlockId - Code block element ID
     * @param title - Title text (e.g., "main.py", "JavaScript")
     */
    setCodeBlockTitle(codeBlockId: string, title: string): void {
        const el = this.getElement(codeBlockId);
        if (!el || el.type !== 'codeBlock') return;
        updateElement(codeBlockId, { containerText: title }, true);
    },

    /**
     * Get the number of lines in a code block
     * @param codeBlockId - Code block element ID
     */
    getCodeBlockLineCount(codeBlockId: string): number {
        const el = this.getElement(codeBlockId);
        if (!el || el.type !== 'codeBlock' || !el.text) return 0;
        return el.text.split('\n').length;
    },

    // --- Data Structure API ---

    createDsArray(x: number, y: number, width: number, height: number, values?: string[], options?: ElementOptions): string {
        return this.createElement('dsArray', x, y, width, height, {
            text: values ? values.join(', ') : '1, 2, 3, 4, 5',
            dsShowIndices: true,
            dsDirection: 'horizontal',
            ...options,
        });
    },

    createDsStack(x: number, y: number, width: number, height: number, values?: string[], options?: ElementOptions): string {
        return this.createElement('dsStack', x, y, width, height, {
            text: values ? values.join(', ') : 'A, B, C',
            dsDirection: 'vertical',
            ...options,
        });
    },

    createDsQueue(x: number, y: number, width: number, height: number, values?: string[], options?: ElementOptions): string {
        return this.createElement('dsQueue', x, y, width, height, {
            text: values ? values.join(', ') : 'first, second, third',
            dsDirection: 'horizontal',
            ...options,
        });
    },

    createDsLinkedList(x: number, y: number, width: number, height: number, values?: string[], options?: ElementOptions): string {
        return this.createElement('dsLinkedList', x, y, width, height, {
            text: values ? values.join(', ') : 'A, B, C, D',
            dsDirection: 'horizontal',
            ...options,
        });
    },

    createDsBinaryTree(x: number, y: number, width: number, height: number, values?: string[], options?: ElementOptions): string {
        return this.createElement('dsBinaryTree', x, y, width, height, {
            text: values ? values.join(', ') : '50, 30, 70, 20, 40, _, 80',
            ...options,
        });
    },

    createDsHashTable(x: number, y: number, width: number, height: number, entries?: string[], options?: ElementOptions): string {
        return this.createElement('dsHashTable', x, y, width, height, {
            text: entries ? entries.join(', ') : 'name:Alice, age:30, id:42',
            dsShowIndices: true,
            dsCapacity: options?.dsCapacity ?? 5,
            ...options,
        });
    },

    getDsValues(dsId: string): string[] | null {
        const el = this.getElement(dsId);
        if (!el || !el.text) return null;
        return el.text.split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0);
    },

    setDsValues(dsId: string, values: string[]): void {
        const el = this.getElement(dsId);
        if (!el) return;
        updateElement(dsId, { text: values.join(', ') }, true);
    },

    /** Execute a CRUD operation on a DS element with animation */
    async dsOperation(elementId: string, action: string, params?: { value?: string; key?: string; index?: number }): Promise<void> {
        const { executeDsOperation } = await import('./utils/ds-operations');
        return executeDsOperation(elementId, action, params || {});
    },

    // --- Actions & Helpers ---

    getElement(id: string) {
        return store.elements.find(e => e.id === id);
    },

    updateElement(id: string, updates: Partial<DrawingElement>) {
        updateElement(id, updates, true);
    },

    deleteElement(id: string) {
        deleteElements([id]);
    },

    clear() {
        if (store.elements.length > 0) {
            pushToHistory();
            setStore("elements", []);
            setStore("selection", []);
        }
    },

    setSelected(ids: string[]) {
        setStore("selection", ids);
    },

    /** Currently selected element ids. */
    getSelection(): string[] {
        return [...store.selection];
    },

    clearSelection() {
        setStore("selection", []);
    },

    /** Replace the current selection with the given element id(s). */
    select(ids: string | string[]) {
        const list = (Array.isArray(ids) ? ids : [ids]).filter(id => store.elements.some(e => e.id === id));
        setStore("selection", list);
        return list;
    },

    /** The currently active tool id (e.g. 'selection', 'pan', 'rectangle'). */
    getSelectedTool() { return store.selectedTool; },

    /** Current viewport transform: { scale, panX, panY }. */
    getViewState() { return { scale: store.viewState.scale, panX: store.viewState.panX, panY: store.viewState.panY }; },

    /** Free Transform: place the rotation pivot for the current selection at a world point. */
    setRotationPivot(x: number, y: number) {
        setTransformPivot(x, y, store.selection);
        bumpDirtyRevision();
    },

    /** Free Transform: reset the rotation pivot back to the element/selection centre. */
    clearRotationPivot() {
        clearTransformPivot();
        bumpDirtyRevision();
    },

    /** The custom rotation pivot for the current selection, or null if at centre. */
    getRotationPivot(): { x: number; y: number } | null {
        return getCustomPivot(store.selection);
    },

    /**
     * Free Transform: set an element's position, size, and/or rotation numerically.
     * width/height scale the element's relative geometry (pen points, path anchors) like a
     * handle drag; `angle` is the rotation in **radians**. Mirrors the property panel's
     * TRANSFORM section. Does not record undo history — wrap in your own if needed.
     */
    setElementTransform(id: string, patch: { x?: number; y?: number; width?: number; height?: number; angle?: number }) {
        setElementTransform(id, patch);
    },

    /**
     * Set (or clear) a custom stroke dash pattern — on/off pixel lengths, e.g. `[12, 4, 3, 4]`.
     * Overrides the `strokeStyle` preset ('solid'/'dashed'/'dotted'); pass an empty array or
     * omit `pattern` to clear it. Defaults to the current selection. One undo entry.
     */
    setStrokeDash(pattern?: number[], ids?: string[]) {
        setStrokeDash(ids ?? [...store.selection], pattern);
    },

    /**
     * Reflect the current selection in place. Without `axisValue` it flips about the
     * selection's own centre (multi: bbox centre); with one it reflects across that
     * world coordinate — e.g. the rotation pivot for a mirror-about-point.
     */
    flipSelection(direction: 'horizontal' | 'vertical', axisValue?: number) {
        flipSelected(direction, axisValue);
    },

    /** Serialize the drawing (or selection) to an SVG string. Also triggers a download. */
    exportSVG(onlySelected = false): string | undefined {
        return exportToSvg(onlySelected);
    },

    /**
     * Free Transform: toggle a 4-corner envelope distort on the given (or selected)
     * elements. On: initializes the warp quad to the bbox (drag the orange corner handles
     * to distort); non-path shapes are converted to a path first. Off: clears the warp.
     */
    toggleEnvelopeWarp(ids?: string[]): string[] {
        return toggleEnvelopeWarp(ids ?? store.selection);
    },

    /**
     * Free Transform: apply an R×C mesh warp to the given (or selected) elements (drag the
     * orange grid control points to distort). Default 3×3; non-path shapes are converted first.
     */
    applyMeshWarp(rows = 3, cols = 3, ids?: string[]): string[] {
        return applyMeshWarp(ids ?? store.selection, rows, cols);
    },

    /**
     * Warp preset (Illustrator "Make with Warp"): deform the selection along a named envelope —
     * `'arc' | 'arch' | 'flag' | 'wave' | 'rise' | 'bulge'`, bent by `bend` (-1..1). Live &
     * re-editable (change bend to re-warp); non-path shapes convert to a path first. Bake
     * permanently with `bakeWarp`. Renders in both sketch & architectural styles.
     */
    applyWarpPreset(preset: 'arc' | 'arch' | 'flag' | 'wave' | 'rise' | 'bulge', bend = 0.5, ids?: string[]): string[] {
        return applyWarpPreset(ids ?? [...store.selection], preset, bend);
    },

    /**
     * Envelope Distort ▸ Make with Top Object: warp the lower artwork into the SILHOUETTE of the
     * frontmost selected shape (consumed as the envelope). Selection = artwork + top shape.
     */
    envelopeWithTopObject(ids?: string[]): string[] { return envelopeWithTopObject(ids ?? [...store.selection]); },

    /** Free Transform: toggle bicubic (Catmull-Rom) smoothing on a warped element's mesh. */
    toggleMeshSmooth(ids?: string[]): string[] {
        return toggleMeshSmooth(ids ?? store.selection);
    },

    /**
     * Free Transform: bake the warp into geometry and drop the cage (Illustrator "Expand").
     * Paths resample their warped outline into anchors; images rasterize to a new bitmap.
     * The destructive counterpart to toggleEnvelopeWarp's Remove (which reverts).
     */
    bakeWarp(ids?: string[]): string[] {
        return bakeWarp(ids ?? store.selection);
    },

    /**
     * Live Transform effect (Illustrator's Effect ▸ Distort & Transform ▸ Transform): draw
     * `copies` accumulating, non-destructive copies of the element, each with the per-step
     * move/rotate/scale/reflect applied one more time — spirals, echoes, radial fans. Merges
     * over any existing effect. Renders in both sketch & architectural styles.
     * @param fx `{ copies, moveX, moveY, scaleX, scaleY, rotate, reflectX, reflectY, originX, originY }`
     */
    setTransformEffect(fx?: Partial<import("./types").TransformEffect>, ids?: string[]) {
        setTransformEffect(ids ?? [...store.selection], fx);
    },
    /** Remove the live Transform effect, leaving just the base element. */
    clearTransformEffect(ids?: string[]) { clearTransformEffect(ids ?? [...store.selection]); },
    /** Expand the live Transform effect into real elements (copies 1..N become new elements). */
    expandTransformEffect(ids?: string[]): string[] { return expandTransformEffect(ids ?? [...store.selection]); },

    /**
     * Live 3D Extrude effect (Illustrator's Effect ▸ 3D ▸ Extrude & Bevel — the "3D text" look):
     * draws shaded depth (back face + side walls) behind the shape. Non-destructive, re-editable.
     * @param ex `{ depth (px), angle (deg, 0=right/90=down), shade (0..1 wall darkening) }`
     */
    setExtrude(ex?: Partial<import("./types").Extrude3D>, ids?: string[]) { setExtrude(ids ?? [...store.selection], ex); },
    /** Remove the 3D Extrude effect. */
    clearExtrude(ids?: string[]) { clearExtrude(ids ?? [...store.selection]); },
    /** Expand the 3D Extrude into editable face elements (back / side / front), grouped. */
    expandExtrude(ids?: string[]): string[] { return expandExtrude(ids ?? [...store.selection]); },
    /** Toggle the live 3D Revolve (lathe) effect — spins the shape's silhouette into a solid of revolution. */
    toggleRevolve(on?: boolean, ids?: string[]) { toggleRevolve(ids ?? [...store.selection], on); },
    /**
     * Live Turntable effect (Adobe Project Turntable) — rotate a vector path in pseudo-3D and
     * keep it fully editable. Non-path shapes are converted to a path first. Non-destructive.
     * Pass 2+ ids to spin them together as one shared rig (group turntable).
     * @param tt `{ yaw (deg about vertical), pitch (deg tilt), depthModel ('flat'|'symmetry'),
     *   depthScale (0..1.5 bulge), reveal (symmetry back-face), perspective (0=ortho..1) }`
     */
    turntable(tt?: Partial<import("./types").Turntable>, ids?: string[]) { setTurntable(ids ?? [...store.selection], tt); },
    /** Remove the Turntable effect (restore the flat, un-rotated path). */
    clearTurntable(ids?: string[]) { clearTurntable(ids ?? [...store.selection]); },
    /** Bake the current turntable angle into an editable path (drops the effect). Returns baked ids. */
    bakeTurntable(ids?: string[]): string[] { return bakeTurntable(ids ?? [...store.selection]); },
    /** One-click rotating-turntable animation: author a linear `turntable.yaw` 0→360°·turns
     *  keyframe track across `seconds` (default = story duration). Returns the animated ids.
     * @param opts `{ seconds, turns }` */
    spinTurntable360(opts?: { seconds?: number; turns?: number }, ids?: string[]): string[] { return spinTurntable360(ids ?? [...store.selection], opts); },
    /** Turntable AI reconstruction (browser-direct, BYO-key): redraw the element at a target
     *  3D viewpoint and insert the result as a new editable path beside it. Defaults the
     *  viewpoint to the element's live turntable angle. Async.
     *  @param opts `{ yaw, pitch, mode }` — mode `'vector'` (default: vision→SVG, any provider)
     *    or `'image'` (OpenAI image reimagine → auto-trace; more faithful, messier vectors). */
    async reconstructTurntableAI(opts?: { yaw?: number; pitch?: number; mode?: 'vector' | 'image' }, id?: string) {
        const eid = id ?? store.selection[0];
        if (!eid) return { success: false, error: 'No element selected' };
        const m = await import('./ai/turntable-ai');
        const target = { yaw: opts?.yaw, pitch: opts?.pitch };
        return opts?.mode === 'image' ? m.reconstructTurntableAIImage(eid, target) : m.reconstructTurntableAI(eid, target);
    },

    /** Appearance stack: add an extra fill/stroke over the base shape (both render styles). */
    addAppearanceFill(fill?: any, ids?: string[]) { addAppearanceFill(ids ?? store.selection, fill); },
    addAppearanceStroke(stroke?: any, ids?: string[]) { addAppearanceStroke(ids ?? store.selection, stroke); },
    /** Replace the whole appearance stack ({fills,strokes}) of the selection. */
    setAppearance(appearance: any, ids?: string[]) { setAppearance(ids ?? store.selection, appearance); },
    /** Remove the appearance stack (back to base fill/stroke). */
    clearAppearance(ids?: string[]) { clearAppearance(ids ?? store.selection); },

    /** Gradient mesh: apply an rows×cols coloured-node mesh fill (seeded from the
     *  element's fill colour). Renders in both sketch and architectural styles. */
    applyMeshGradient(rows?: number, cols?: number, ids?: string[]) { applyMeshGradient(ids ?? store.selection, rows ?? 3, cols ?? 3); },
    /** Resize the mesh node grid, preserving colours where they overlap. */
    setMeshSize(rows: number, cols: number, ids?: string[]) { setMeshSize(ids ?? store.selection, rows, cols); },
    /** Set the colour of one mesh node (row, col). */
    setMeshNodeColor(row: number, col: number, color: string, ids?: string[]) { setMeshNodeColor(ids ?? store.selection, row, col, color); },
    /** Move a mesh node to a normalized (0..1) position — warps the mesh (boundary nodes stay on their edge). */
    setMeshNodePosition(row: number, col: number, x: number, y: number, ids?: string[]) { setMeshNodePosition(ids ?? store.selection, row, col, x, y); },
    /** Reset all mesh node positions back to the even grid (un-warp). */
    resetMeshNodes(ids?: string[]) { resetMeshNodes(ids ?? store.selection); },
    /** Toggle bicubic (smooth) vs bilinear mesh colour interpolation. */
    setMeshSmooth(smooth: boolean, ids?: string[]) { setMeshSmooth(ids ?? store.selection, smooth); },
    /** Remove the mesh fill (revert to a solid fill). */
    clearMeshGradient(ids?: string[]) { clearMeshGradient(ids ?? store.selection); },
    /** Toggle on-canvas mesh node editing (shows the node grid on the selected mesh shape). */
    toggleMeshEdit(active?: boolean) { toggleMeshEdit(active); },

    /** Pattern fill: apply a seamless vector pattern motif (stripes/grid/dots/
     *  checker/crosshatch), seeded from the element's colour. Both render styles. */
    applyPatternFill(type?: import("./types").PatternType, ids?: string[]) { applyPatternFill(ids ?? store.selection, type ?? 'stripes'); },
    /** Update pattern-fill props (type, color, background, scale, spacing, strokeWidth, angle). */
    setPatternFill(patch: Partial<import("./types").PatternFill>, ids?: string[]) { setPatternFill(ids ?? store.selection, patch); },
    /** Remove the pattern fill (revert to a solid fill). */
    clearPatternFill(ids?: string[]) { clearPatternFill(ids ?? store.selection); },
    /** Make Pattern from Selection: capture the selected artwork into a tile and
     *  spawn a preview rectangle filled with that custom pattern. Returns its id. */
    createPatternFromSelection(ids?: string[]) { return createPatternFromSelection(ids ?? store.selection); },

    // ── Pattern swatch library (document-level reusable patterns) ──
    /** Capture the selected artwork into a reusable pattern swatch (no preview rect). */
    addPatternSwatchFromSelection(name?: string, ids?: string[]) { return addPatternSwatchFromSelection(ids ?? store.selection, name); },
    /** Save the (first) selected shape's pattern fill to the library. */
    savePatternSwatchFromElement(name?: string, ids?: string[]) { return savePatternSwatchFromElement(ids ?? store.selection, name); },
    /** Apply a library pattern swatch to the current (or given) selection. */
    applyPatternSwatch(swatchId: string, ids?: string[]) { applyPatternSwatch(swatchId, ids ?? store.selection); },
    /** Redefine a library swatch from the selected shape's pattern fill. */
    updatePatternSwatch(swatchId: string, fromId?: string) { updatePatternSwatch(swatchId, fromId); },
    /** Rename a library pattern swatch. */
    renamePatternSwatch(swatchId: string, name: string) { renamePatternSwatch(swatchId, name); },
    /** Delete a library pattern swatch. */
    deletePatternSwatch(swatchId: string) { deletePatternSwatch(swatchId); },
    /** List the document's pattern swatches. */
    listPatternSwatches() { return store.patterns.map(p => ({ id: p.id, name: p.name, type: p.fill.type })); },

    /** Image Trace: vectorize selected image(s) into editable path elements (threshold trace). */
    traceImage(options?: { threshold?: number; simplify?: number }, ids?: string[]): string[] {
        return traceImage(ids ?? store.selection, options);
    },

    /** Symbols: turn the selection into a reusable symbol (+ one instance). Returns symbol id. */
    createSymbol(name?: string, ids?: string[]) { return createSymbol(ids ?? store.selection, name); },
    /** Place a new instance of a symbol on the canvas. */
    placeInstance(symbolId: string, x?: number, y?: number) { return placeInstance(symbolId, x, y); },
    /** Toggle the Symbol Sprayer for a symbol (defaults to first). Pass nothing to turn off. */
    toggleSymbolSprayer(symbolId?: string) { toggleSymbolSprayer(symbolId); },
    /** Batch-spray instances of a symbol at world points (size jitter by default). */
    spraySymbols(symbolId: string, points: { x: number; y: number }[], opts?: { scaleJitter?: number; rotateJitter?: number }) { return spraySymbolInstances(symbolId, points, opts); },
    /** Redefine a symbol from a set of elements — updates every instance live. */
    redefineSymbol(symbolId: string, fromIds: string[]) { redefineSymbol(symbolId, fromIds); },
    /** Detach (break link): replace selected instances with editable copies. */
    detachInstance(ids?: string[]) { detachInstance(ids ?? store.selection); },
    /** Edit-in-place: open a symbol's master for editing from an instance (defaults to the single selected instance). */
    enterSymbolEdit(instanceId?: string) { const id = instanceId ?? (store.selection.length === 1 ? store.selection[0] : undefined); if (id) enterSymbolEdit(id); },
    /** Finish an edit-in-place session: save (redefine + update instances) or cancel. */
    exitSymbolEdit(save = true) { exitSymbolEdit(save); },
    /** Rename a symbol definition. */
    renameSymbol(symbolId: string, name: string) { renameSymbol(symbolId, name); },
    /** Delete a symbol definition; by default its instances are detached into editable copies first. */
    deleteSymbol(symbolId: string, detachInstances = true) { deleteSymbol(symbolId, detachInstances); },
    /** List the document's symbol definitions, each with a live instance count. */
    listSymbols() { return store.symbols.map(s => ({ id: s.id, name: s.name, width: s.width, height: s.height, instances: store.elements.filter(e => e.type === 'symbolInstance' && e.symbolId === s.id).length })); },
    /** Show/hide the Symbols panel. */
    toggleSymbolsPanel(visible?: boolean) { toggleSymbolsPanel(visible); },
    /** Show/hide the undo-History panel. */
    toggleHistoryPanel(visible?: boolean) { toggleHistoryPanel(visible); },
    /** Show/hide the Graphic Styles panel. */
    toggleGraphicStylesPanel(visible?: boolean) { toggleGraphicStylesPanel(visible); },
    /** Save the (first) selected object's appearance as a named graphic style; returns its id. */
    createGraphicStyle(name?: string, ids?: string[]) { return createGraphicStyle(ids, name); },
    /** Apply a saved graphic style to the selection (or given ids). */
    applyGraphicStyle(styleId: string, ids?: string[]) { applyGraphicStyle(styleId, ids); },
    /** Redefine a graphic style from the (first) selected object. */
    updateGraphicStyle(styleId: string, fromId?: string) { updateGraphicStyle(styleId, fromId); },
    /** Rename a graphic style. */
    renameGraphicStyle(styleId: string, name: string) { renameGraphicStyle(styleId, name); },
    /** Delete a graphic style. */
    deleteGraphicStyle(styleId: string) { deleteGraphicStyle(styleId); },
    /** List saved graphic styles. */
    listGraphicStyles() { return store.graphicStyles.map(g => ({ id: g.id, name: g.name })); },

    /** Show/hide the Swatches panel. */
    toggleSwatchesPanel(visible?: boolean) { toggleSwatchesPanel(visible); },
    /** Create a global colour swatch (from a colour, or the selection's fill). Returns its id. */
    createSwatch(color?: string, name?: string, group?: string) { return createSwatch(color, name, group); },
    /** Assign swatches to a named group (null to ungroup). */
    setSwatchGroup(swatchIds: string[], group: string | null) { setSwatchGroup(swatchIds, group); },
    /** Swatches keyed by group name (ungrouped under ''). */
    listSwatchGroups() { return listSwatchGroups(); },
    /** Add the selection's distinct colours as swatches in a named group. */
    createSwatchGroupFromSelection(group: string, ids?: string[]) { return createSwatchGroupFromSelection(group, ids); },
    /** Apply a swatch to the selection's fill or stroke, linking them to it. */
    applySwatch(swatchId: string, target: 'fill' | 'stroke' = 'fill', ids?: string[]) { applySwatch(swatchId, target, ids); },
    /** Recolour a swatch — every linked object updates with it. */
    updateSwatchColor(swatchId: string, color: string) { updateSwatchColor(swatchId, color); },
    /** Rename a swatch. */
    renameSwatch(swatchId: string, name: string) { renameSwatch(swatchId, name); },
    /** Delete a swatch (links on objects are dropped). */
    deleteSwatch(swatchId: string) { deleteSwatch(swatchId); },
    /** List global swatches. */
    listSwatches() { return store.swatches.map(s => ({ id: s.id, name: s.name, color: s.color, group: s.group })); },
    /** Set the print bleed margin (px) around artboards; >0 shows crop marks. */
    setBleed(px: number) { setBleed(px); },
    getBleed() { return store.globalSettings.bleed ?? 0; },
    /** Jump to a history timeline index (see the History panel). */
    jumpToHistory(index: number) { jumpToHistory(index); },

    /** Artboards: add a named export region (preset name, 'selection', or default). Returns id. */
    addArtboard(preset?: string, x?: number, y?: number) { return addArtboard(preset, x, y); },
    deleteArtboard(id: string) { deleteArtboard(id); },
    renameArtboard(id: string, name: string) { renameArtboard(id, name); },
    updateArtboard(id: string, patch: any) { updateArtboard(id, patch); },
    /** Rearrange All Artboards into a grid (auto columns ≈ √n when omitted). */
    rearrangeArtboards(columns = 0, gap = 40) { rearrangeArtboards(columns, gap); },
    /** Duplicate an artboard and the artwork on it (to the right). Returns the new id. */
    duplicateArtboard(id?: string, gap = 40) { return duplicateArtboard(id, gap); },
    /** Resize an artboard to fit the artwork on it, plus padding. */
    fitArtboardToArtwork(id?: string, pad = 20) { return fitArtboardToArtwork(id, pad); },
    /** Toggle Outline (wireframe) view — path outlines only, no fills. */
    toggleOutlineView(on?: boolean) { toggleOutlineView(on); },
    isOutlineView() { return store.outlineView; },
    /** Toggle Trim View — temporarily hide everything outside the artboards. */
    toggleTrimView(on?: boolean) { toggleTrimView(on); },
    isTrimView() { return store.trimView; },
    /** Swap fill ⇄ stroke colours on the selection (Illustrator Shift+X). */
    swapFillStroke(ids?: string[]) { swapFillStroke(ids); },
    /** Object > Path > Clean Up: delete stray points, empty text & unpainted objects. */
    cleanUp() { return cleanUpElements(); },
    /** Delete swatches not used by any element. */
    deleteUnusedSwatches() { return deleteUnusedSwatches(); },
    /** Paste the selection onto every other artboard at the same relative position. */
    pasteOnAllArtboards() { return pasteOnAllArtboards(); },
    listArtboards() { return store.artboards.map(a => ({ ...a })); },
    /** Export an artboard region to PNG (downloads + returns the data URL). */
    exportArtboard(id: string, scale = 1) { return exportArtboard(id, scale, true); },

    /** Make a clipping mask: the top selected object clips the others to its outline. */
    makeClippingMask() { makeClippingMask(); },
    /** Make an opacity mask: the top object's luminance becomes the others' alpha (soft fade). */
    makeOpacityMask() { makeOpacityMask(); },
    /** Release the clipping/opacity mask on the current selection. */
    releaseClippingMask() { releaseClippingMask(); },

    setView(scale: number, panX: number, panY: number, rotation?: number) {
        setViewState({ scale, panX, panY, ...(rotation !== undefined ? { rotation } : {}) });
    },

    /** Rotate the canvas view by `deltaRadians` about the viewport centre. */
    rotateView(deltaRadians: number) {
        rotateView(deltaRadians);
    },

    /** Snap the canvas view back to upright (rotation 0). */
    resetRotation() {
        resetRotation();
    },

    updateGridSettings(settings: any) {
        setStore("gridSettings", (s) => ({ ...s, ...settings }));
    },

    updateDefaultStyles(styles: any) {
        setStore("defaultElementStyles", (s) => ({ ...s, ...styles }));
    },

    async zoomToFit() {
        zoomToFit();
    },

    /**
     * Connect two elements with a line/arrow
     */
    connect(sourceId: string, targetId: string, options?: ElementOptions & { type?: 'line' | 'arrow' | 'organicBranch' }) {
        const source = this.getElement(sourceId);
        const target = this.getElement(targetId);

        if (!source || !target) {
            console.error("Source or Target element not found");
            return null;
        }

        const sx = source.x + source.width / 2;
        const sy = source.y + source.height / 2;
        const tx = target.x + target.width / 2;
        const ty = target.y + target.height / 2;

        const type = options?.type ?? 'arrow';
        const curveType = options?.curveType ?? 'bezier';

        // Simple Edge Intersection Logic
        const intersect = (x1: number, y1: number, x2: number, y2: number, rect: DrawingElement) => {
            const cx = rect.x + rect.width / 2;
            const cy = rect.y + rect.height / 2;
            const w = rect.width / 2;
            const h = rect.height / 2;
            const dx = x2 - x1;
            const dy = y2 - y1;
            if (dx === 0 && dy === 0) return { x: x1, y: y1 };

            const angle = Math.atan2(dy, dx);

            // Diamond
            if (rect.type === 'diamond') {
                const absTan = Math.abs(Math.tan(angle));
                const absDx = 1 / ((1 / w) + (absTan / h));
                const dX = (dx > 0 ? 1 : -1) * absDx;
                const dY = dX * Math.tan(angle);
                return { x: cx + dX, y: cy + dY };
            }
            // Circle/Shape with radius roughly
            if (['circle', 'star', 'octagon', 'hexagon'].includes(rect.type)) {
                // Ellipse approximation
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                return { x: cx + w * cos, y: cy + h * sin };
            }

            // Box default
            const rx = dx > 0 ? cx + w : cx - w;
            const ry = cy + Math.tan(angle) * (rx - cx);
            const by = dy > 0 ? cy + h : cy - h;
            const bx = cx + (by - cy) / Math.tan(angle);
            const onV = (ry >= cy - h - 1 && ry <= cy + h + 1);
            if (onV) return { x: rx, y: ry };
            return { x: bx, y: by };
        };

        // Optional explicit anchor fractions (0-1 across the shape bbox). Callers that
        // route several edges into one shape (e.g. many subclasses → one base class) pass
        // these to spread the endpoints along the border instead of all clipping to the
        // center line — which is what makes UML arrowheads pile up on top of each other.
        const { startAnchor, endAnchor, ...restOptions } =
            (options ?? {}) as ElementOptions & {
                type?: 'line' | 'arrow' | 'organicBranch';
                startAnchor?: { fx: number; fy: number };
                endAnchor?: { fx: number; fy: number };
            };

        const endP = endAnchor
            ? { x: target.x + endAnchor.fx * target.width, y: target.y + endAnchor.fy * target.height }
            : intersect(tx, ty, sx, sy, target);
        // Aim the start clip at the resolved head (not the raw center) so a distributed
        // endpoint still yields a straight, well-pointed line.
        const startP = startAnchor
            ? { x: source.x + startAnchor.fx * source.width, y: source.y + startAnchor.fy * source.height }
            : intersect(sx, sy, endP.x, endP.y, source);

        // Compute anchor fractions for stable bindings (endpoint position relative to shape bbox)
        const startFx = source.width ? (startP.x - source.x) / source.width : 0.5;
        const startFy = source.height ? (startP.y - source.y) / source.height : 0.5;
        const endFx = target.width ? (endP.x - target.x) / target.width : 0.5;
        const endFy = target.height ? (endP.y - target.y) / target.height : 0.5;

        const id = this.createElement(type as ElementType, startP.x, startP.y, endP.x - startP.x, endP.y - startP.y, {
            ...restOptions,
            curveType,
            startBinding: { elementId: sourceId, focus: 0, gap: 5, anchorFractionX: startFx, anchorFractionY: startFy },
            endBinding: { elementId: targetId, focus: 0, gap: 5, anchorFractionX: endFx, anchorFractionY: endFy },
            // Ensure points are reset when connecting to follow new path
            points: [0, 0, endP.x - startP.x, endP.y - startP.y]
        });

        // Update boundElements
        const updateBindings = (el: DrawingElement, lineId: string) => {
            const existing = el.boundElements || [];
            if (!existing.find(b => b.id === lineId)) {
                this.updateElement(el.id, { boundElements: [...existing, { id: lineId, type: type as 'arrow' }] });
            }
        };

        updateBindings(source, id);
        updateBindings(target, id);

        return id;
    },

    // History
    undo() { undo(); },
    redo() { redo(); },

    // Grouping
    groupSelection() { groupSelected(); },
    ungroupSelection() { ungroupSelected(); },

    // Transformation
    duplicate(id: string) { duplicateElement(id); },
    toggleTheme() { toggleTheme(); },

    /**
     * Set the theme explicitly. Choices: 'light', 'dark', 'focus', 'system'.
     * 'system' follows the OS prefers-color-scheme and live-updates when it
     * changes. Stored colors are not mutated; dark/focus inversion is purely
     * a render-time CSS filter on the canvas.
     */
    setTheme(theme: Theme) { setTheme(theme); },

    /** The user's current theme choice (may be 'system'). */
    getTheme(): Theme { return store.theme; },

    /** The currently displayed theme ('system' resolved to 'light' or 'dark'). */
    getResolvedTheme(): 'light' | 'dark' | 'focus' { return store.resolvedTheme; },


    // Layers
    addLayer(name?: string) { return addLayer(name); },
    deleteLayer(id: string) { deleteLayer(id); },
    setActiveLayer(id: string) { setActiveLayer(id); },
    mergeLayerDown(id: string) { mergeLayerDown(id); },
    flattenLayers() { flattenLayers(); },
    isolateLayer(id: string) { isolateLayer(id); },
    showAllLayers() { showAllLayers(); },
    updateLayer(id: string, updates: Partial<Layer>) { updateLayer(id, updates); },
    duplicateLayer(id: string) { duplicateLayer(id); },
    reorderLayers(fromIndex: number, toIndex: number) { reorderLayers(fromIndex, toIndex); },
    moveElementsToLayer(elementIds: string[], targetLayerId: string) { moveElementsToLayer(elementIds, targetLayerId); },
    createLayerGroup(name?: string) { createLayerGroup(name); },
    toggleLayerGroupExpansion(groupId: string) { toggleLayerGroupExpansion(groupId); },
    isLayerVisible(layerId: string) { return isLayerVisible(layerId); },
    isLayerLocked(layerId: string) { return isLayerLocked(layerId); },

    // Grid & Snapping
    toggleGrid() { toggleGrid(); },
    toggleSnapToGrid() { toggleSnapToGrid(); },

    // Time-lapse (Procreate-style process recording) — see docs/timelapse-spec.md
    /** Begin capturing a time-lapse: one frame is stored per committed edit. */
    startTimelapse() { setRequestTimelapse({ action: 'start' }); },
    /** Stop the active time-lapse recording. */
    stopTimelapse() { setRequestTimelapse({ action: 'stop' }); },
    /** Toggle time-lapse recording on/off (same as Ctrl+Shift+T). */
    toggleTimelapse() { toggleTimelapseAction(); },
    /** True while a time-lapse is being captured. */
    isTimelapseRecording() { return store.timelapseRecording; },
    /** Number of frames captured in the current/last recording. */
    timelapseFrameCount() { return store.timelapseFrameCount; },
    /** Open/close the in-app time-lapse replay player. */
    openTimelapsePlayer() { setTimelapsePlayerOpen(true); },
    closeTimelapsePlayer() { setTimelapsePlayerOpen(false); },
    /** Render the active recording to a video file (auto-downloads). Resolves false if nothing to export. */
    exportTimelapse(format: VideoFormat = 'webm') { return exportTimelapseAction(format); },

    // Pen & Input
    /** Smart shapes: dwell at the end of a pen stroke to snap it to a clean shape. */
    setSmartShape(enabled: boolean) { updateGlobalSettings({ smartShape: enabled }); },
    isSmartShapeEnabled() { return store.globalSettings.smartShape !== false; },
    /** Pressure-driven width on the brush pen (Apple Pencil force / pointer pressure). */
    setPenPressure(enabled: boolean) { updateGlobalSettings({ penPressure: enabled }); },
    isPenPressureEnabled() { return store.globalSettings.penPressure !== false; },
    /** Pulled-string "lazy brush" stabilization strength for freehand inking (0..1; 0 = off). */
    setPenStabilization(strength: number) { updateGlobalSettings({ penStabilization: Math.min(1, Math.max(0, strength)) }); },
    getPenStabilization() { return store.globalSettings.penStabilization ?? 0; },

    /** Max number of undo states retained (default 50). Persisted across sessions. */
    setHistoryDepth(depth: number) { updateGlobalSettings({ historyDepth: Math.max(1, Math.round(depth)) }); },
    getHistoryDepth() { return store.globalSettings.historyDepth ?? 50; },
    /** Flip stabilization on/off, remembering the last non-zero strength (Shift+S). */
    togglePenStabilization() { togglePenStabilization(); },

    // Display States
    addDisplayState(name: string) { addDisplayState(name); },
    updateDisplayState(id: string) { updateDisplayState(id); },
    deleteDisplayState(id: string) { deleteDisplayState(id); },
    applyDisplayState(id: string, animate: boolean = true) { applyDisplayState(id, animate); },
    toggleStatePanel(visible?: boolean) { toggleStatePanel(visible); },
    applyNextState() { applyNextState(); },
    applyPreviousState() { applyPreviousState(); },

    // Hierarchy / Mindmap actions
    addChildNode(parentId: string) { return addChildNode(parentId); },
    addSiblingNode(siblingId: string) { return addSiblingNode(siblingId); },
    toggleCollapseSelection() { toggleCollapseSelection(); },
    toggleCollapse(id: string) { toggleCollapse(id); },
    setParent(childId: string, parentId: string | null) { setParent(childId, parentId); },
    reorderMindmap(rootId: string, direction: LayoutDirection) { reorderMindmap(rootId, direction); },
    applyMindmapStyling(rootId: string) { applyMindmapStyling(rootId); },
    /**
     * Seed a ready-to-edit mind map: an emphasised central node with a few branches
     * (some with sub-branches), laid out + coloured via the existing mindmap engine.
     * `direction` is any mindmap layout — 'balanced' (dual-side), 'radial',
     * 'horizontal-right', 'vertical-down', etc. Returns the central node's id.
     */
    createMindMap(opts?: { x?: number; y?: number; title?: string; direction?: LayoutDirection; branches?: { label: string; children?: string[] }[] }) {
        const vs = store.viewState;
        const cx = opts?.x ?? (vs ? (window.innerWidth / 2 - vs.panX) / vs.scale : 400);
        const cy = opts?.y ?? (vs ? (window.innerHeight / 2 - vs.panY) / vs.scale : 300);
        const direction = opts?.direction ?? 'balanced';
        const branches = opts?.branches ?? [
            { label: 'Idea 1' },
            { label: 'Idea 2', children: ['Detail A', 'Detail B'] },
            { label: 'Idea 3' },
            { label: 'Idea 4' },
        ];

        pushToHistory();
        const rootId = this.createElement('rectangle', cx - 85, cy - 32, 170, 64, {
            containerText: opts?.title ?? 'Central Idea',
            backgroundColor: '#5f3dc4', strokeColor: '#3b2a99', textColor: '#ffffff',
            fillStyle: 'solid', borderRadius: 24,
        });
        for (const b of branches) {
            const bid = addChildNode(rootId, { text: b.label, recordHistory: false, select: false, reflow: false });
            if (bid && b.children) {
                for (const c of b.children) addChildNode(bid, { text: c, recordHistory: false, select: false, reflow: false });
            }
        }
        reorderMindmap(rootId, direction);   // sets mindmapDir + lays out the tree
        applyMindmapStyling(rootId);          // per-branch colour
        this.select(rootId);
        return rootId;
    },
    /** Build a mindmap subtree under `parentId` from an indented/bulleted text outline. Returns the new node ids. */
    mindmapFromOutline(parentId: string, outline: string) { return pasteMindmapOutline(parentId, parseOutline(outline)); },
    /** Pathfinder boolean over ≥2 element ids: 'union' | 'subtract' | 'intersect' | 'exclude'. Returns new path ids. */
    pathfinder(ids: string[], op: 'union' | 'subtract' | 'intersect' | 'exclude') { return applyPathfinder(ids, op); },
    /** Pathfinder region ops over ≥2 element ids: 'divide' | 'trim' | 'merge' | 'crop' | 'outline'. Returns new path ids. */
    pathfinderRegion(ids: string[], op: 'divide' | 'trim' | 'merge' | 'crop' | 'outline') { return applyPathfinderRegion(ids, op); },
    /**
     * NON-DESTRUCTIVE compound shape over ≥2 element ids — like Pathfinder but the
     * sources are RETAINED and editable: change the op later with `setCompoundOp`,
     * `releaseCompound` to get the sources back, or `expandCompound` to flatten. Returns the id.
     */
    makeCompound(ids: string[], op: 'union' | 'subtract' | 'intersect' | 'exclude' = 'union') { return makeCompoundShape(ids, op); },
    /** Change a compound shape's boolean operation in place (re-evaluates the retained sources). */
    setCompoundOp(id: string, op: 'union' | 'subtract' | 'intersect' | 'exclude') { setCompoundShapeOp(id, op); },
    /** Release a compound shape back into its editable source elements. Returns the restored ids. */
    releaseCompound(id: string) { return releaseCompoundShape(id); },
    /** Expand (flatten) a compound shape to a plain path (drops the retained sources). */
    expandCompound(id: string) { expandCompoundShape(id); },
    /** Enter in-place editing of a compound shape (explodes its sources for editing). */
    editCompound(id: string) { enterCompoundEdit(id); },
    /** Finish in-place compound editing — rebuild from the edited sources (save) or restore the original (cancel). */
    finishCompoundEdit(save = true) { exitCompoundEdit(save); },
    /** Convert shapes to editable vector paths (in place). Returns the converted ids. */
    convertToPath(ids: string[]) { return convertToPath(ids); },
    /** Text → Outlines: replace text elements with editable vector glyph paths (async). Returns a promise of new path ids. */
    convertTextToOutlines(ids: string[]) { return convertTextToOutlines(ids); },
    /** Outline Stroke: replace each element with a filled path of its stroke outline. Returns new ids. */
    outlineStroke(ids: string[]) { return outlineStroke(ids); },
    /** Offset Path: add a parallel path offset by `distance` (outward +, inward −). Returns new ids. */
    offsetPath(ids: string[], distance: number) { return offsetPath(ids, distance); },
    /** Simplify: reduce a path's anchor count (Ramer–Douglas–Peucker). Returns affected ids. */
    simplifyPath(ids: string[]) { return simplifyPath(ids); },
    /** Smooth a path's janky curves (Laplacian; keeps anchor count). strength 0..1. */
    smoothPath(ids?: string[], strength = 0.5, iterations = 2) { return smoothPath(ids ?? [...store.selection], strength, iterations); },

    // ── Illustrator effects (tier 1) ────────────────────────────────────────
    /** Convert objects to a rectangle / rounded rect / ellipse sized to their bbox. */
    convertToShape(shape: 'rectangle' | 'rounded' | 'ellipse', radius = 20, ids?: string[]) { return convertToShape(ids ?? [...store.selection], shape, radius); },
    /** Split a rectangle into an rows×cols grid of cells (Object › Path › Split Into Grid). */
    splitIntoGrid(rows = 4, cols = 4, gap = 0, id?: string) { return splitIntoGrid(id ?? store.selection[0], rows, cols, gap); },
    /** Convert the selected shapes to ruler guides at their bounding edges (Cmd+5). */
    convertToGuides(ids?: string[]) { return convertToGuides(ids); },
    /** Toggle printer crop marks at the selection's corners. */
    toggleObjectCropMarks(on?: boolean, ids?: string[]) { toggleObjectCropMarks(ids, on); },
    /** Feather (soft-blur the edges) of the selection. radius in px; 0 turns it off. */
    setFeather(radius: number, ids?: string[]) { applyFeather(ids ?? [...store.selection], radius); },
    /** Outer glow — a coloured halo around the selection. Pass enabled:false to remove. */
    setGlow(opts: { color?: string; blur?: number; enabled?: boolean } = {}, ids?: string[]) { applyGlow(ids ?? [...store.selection], opts); },
    /**
     * Scribble (Illustrator effect): replace each selected shape's fill with a
     * back-and-forth scribble path in the fill colour. spacing = line gap (px),
     * angle = scribble direction (deg). Bbox-based (not clipped to the outline).
     */
    scribble(opts: { spacing?: number; angle?: number; strokeWidth?: number } = {}, ids?: string[]): string[] {
        return applyScribble(ids ?? [...store.selection], opts);
    },
    /**
     * Create Swatch Info: generate a labelled swatch sheet (colour chip + name +
     * hex + RGB) from the document swatches, or the selection's colours if there
     * are none. Returns the created element ids.
     */
    createSwatchInfoSheet(opts: { x?: number; y?: number; columns?: number } = {}): string[] {
        const source = store.swatches.length
            ? store.swatches.map(s => ({ name: s.name, color: s.color }))
            : getSelectionColors().map(c => ({ name: c.color, color: c.color }));
        if (source.length === 0) return [];
        const x0 = opts.x ?? 100, y0 = opts.y ?? 100, cols = Math.max(1, opts.columns ?? 4);
        const cellW = 170, chipH = 60, cellH = 110, pad = 14;
        const created: string[] = [];
        source.forEach((sw, i) => {
            const cx = x0 + (i % cols) * (cellW + pad);
            const cy = y0 + Math.floor(i / cols) * (cellH + pad);
            const chip = this.createRectangle(cx, cy, cellW, chipH, { backgroundColor: sw.color, strokeColor: '#999999', strokeWidth: 1 });
            const { r, g, b } = parseHex(sw.color);
            const label = `${sw.name}\n${sw.color.toUpperCase()}  ·  R${r} G${g} B${b}`;
            const txt = this.createText(cx, cy + chipH + 6, label, { fontSize: 12, textColor: '#222222', fontFamily: 'sans-serif' });
            if (chip) created.push(chip);
            if (txt) created.push(txt);
        });
        return created;
    },
    /** Make Compound Path: combine selected shapes/paths into one even-odd path (holes). Returns new id. */
    makeCompoundPath(ids: string[]) { return makeCompoundPath(ids); },
    /** Release Compound Path: split a compound path's subpaths into separate paths. Returns new ids. */
    releaseCompoundPath(ids: string[]) { return releaseCompoundPath(ids); },
    /** Join: connect selected open paths into one by chaining nearest endpoints. Returns new id. */
    joinPaths(ids: string[]) { return joinPaths(ids); },

    // Repeat & symmetry (operate on the current selection)
    /** Radial repeat: `count` copies around the selection centre. `radius` pushes them into a ring; `faceCenter` orients each outward. */
    radialRepeat(count: number, opts?: { radius?: number; faceCenter?: boolean }) { radialRepeat(count, opts); },
    /** Grid repeat: tile the selection into `rows × cols` (spacing = bbox + gap). */
    gridRepeat(rows: number, cols: number, opts?: { gapX?: number; gapY?: number }) { gridRepeat(rows, cols, opts); },
    /** Mirror copy: duplicate the selection reflected across its far edge (adjacent symmetric pair). */
    mirrorCopy(axis: 'horizontal' | 'vertical') { mirrorCopy(axis); },
    /** Transform Again: clone the selection and replay the last move/duplicate transform (step-and-repeat). */
    transformAgain() { transformAgain(); },
    /** Show/hide the symmetry guide; optional world `pos` for the axis. */
    toggleSymmetryGuide(enabled?: boolean, pos?: number) { toggleSymmetryGuide(enabled, pos); },
    /** Set the symmetry guide axis ('vertical' = left↔right mirror line). */
    setSymmetryAxis(axis: 'vertical' | 'horizontal') { setSymmetryAxis(axis); },
    /** Move the symmetry guide to world coordinate `pos`. */
    setSymmetryPos(pos: number) { setSymmetryPos(pos); },
    /** Mirror the selection across the symmetry guide (reflected clones). */
    mirrorAcrossSymmetry() { mirrorAcrossSymmetry(); },

    // UI Panels
    toggleCommandPalette(visible?: boolean) { toggleCommandPalette(visible); },
    togglePropertyPanel(visible?: boolean) { togglePropertyPanel(visible); },
    togglePresentationMode(visible?: boolean) { togglePresentationMode(visible); },
    toggleLayerPanel(visible?: boolean) { toggleLayerPanel(visible); },
    toggleMinimap(visible?: boolean) { toggleMinimap(visible); },
    /** Show/hide the edge rulers + guide system (Alt+R). */
    toggleRulers(visible?: boolean) { toggleRulers(visible); },
    /** Add a ruler guide. axis 'h' = horizontal line at world y=pos; 'v' = vertical line at world x=pos. Returns the guide id. */
    addGuide(axis: 'h' | 'v', pos: number) { return addGuide(axis, pos); },
    /** Move an existing guide to a new world coordinate. */
    updateGuide(id: string, pos: number) { updateGuide(id, pos); },
    /** Remove a single guide by id. */
    removeGuide(id: string) { removeGuide(id); },
    /** Remove all guides. */
    clearGuides() { clearGuides(); },
    toggleZenMode(visible?: boolean) { toggleZenMode(visible); },
    toggleSlideNavigator(visible?: boolean) { toggleSlideNavigator(visible); },
    toggleMainToolbar(visible?: boolean) { toggleMainToolbar(visible); },
    toggleUtilityToolbar(visible?: boolean) { toggleUtilityToolbar(visible); },
    toggleSlideToolbar(visible?: boolean) { toggleSlideToolbar(visible); },
    setSlideToolbarPosition(x: number, y: number) { setSlideToolbarPosition(x, y); },

    // Slides
    addSlide() { addSlide(); },
    deleteSlide(index: number) { deleteSlide(index); },
    duplicateSlide(index: number) { duplicateSlide(index); },
    setActiveSlide(index: number) { setActiveSlide(index); },
    reorderSlides(fromIndex: number, toIndex: number) { reorderSlides(fromIndex, toIndex); },
    updateSlideTransition(slideIndex: number, transition: Partial<SlideTransition>) { updateSlideTransition(slideIndex, transition); },
    updateSlideBackground(slideIndex: number, updates: Partial<Slide> | string) { updateSlideBackground(slideIndex, updates); },
    advancePresentation() { return advancePresentation(); },
    retreatPresentation() { return retreatPresentation(); },
    goToFirstSlide() { return setActiveSlide(0); },
    goToLastSlide() { return setActiveSlide(store.slides.length - 1); },
    setDocType(type: 'infinite' | 'slides' | 'design' | 'game') { setDocType(type); },
    loadDocument(doc: any) { loadDocument(doc); },
    /** Snapshot the current drawing as a serializable document (the `.yappy` v4 format). */
    getDocument(name = 'Untitled') { return buildSlideDocument(name); },
    resetToNewDocument(docType: 'infinite' | 'slides' | 'design' | 'game' = 'slides', pageSize?: { width: number, height: number }) { resetToNewDocument(docType, pageSize); },
    /** Create a new Canva-style design document. Pass a page-size preset id (e.g. 'instagram-post') or explicit {width, height}. */
    newDesign(size?: string | { width: number, height: number }) {
        const resolved = typeof size === 'string' ? getPagePreset(size) : size;
        resetToNewDocument('design', resolved ? { width: resolved.width, height: resolved.height } : undefined);
    },
    /** Resize pages in a design document (all pages by default). */
    setPageSize(width: number, height: number, applyAll: boolean = true) { setPageSize(width, height, applyAll); },
    /** Magic Resize: repurpose the design to another size — page backgrounds
     *  stretch to fill, everything else scales uniformly (fonts included) and
     *  keeps its relative position. Pass a preset id (e.g. 'instagram-story')
     *  or {width, height}. */
    magicResize(size: string | { width: number, height: number }): boolean {
        const resolved = typeof size === 'string' ? getPagePreset(size) : size;
        if (!resolved) return false;
        return magicResize(resolved.width, resolved.height);
    },
    /** List available page-size presets for design documents. */
    getPageSizePresets() { return PAGE_SIZE_PRESETS.map(p => ({ ...p })); },
    /** Export one page/slide to PNG (or JPG) at exact page bounds. Returns the data URL. */
    exportPageToPng(pageIndex?: number, scale: number = 1, download: boolean = true, format: 'png' | 'jpeg' = 'png') {
        return exportPageToPng(pageIndex ?? store.activeSlideIndex, scale, download, format);
    },
    /** Detach the page's background image into a regular image element covering the page.
     *  Returns the new element id, or null if the page has no image background. */
    detachBackgroundImage(pageIndex?: number) {
        return detachSlideBackgroundImage(pageIndex ?? store.activeSlideIndex);
    },

    // Arcade (game mode)
    /** Set the document's game script (persisted with the document; runs on Play). */
    setGameScript(script: string) { setGameScript(script); },
    /** The document's current game script. */
    getGameScript(): string { return store.gameScript; },
    /** Start the game (uses the stored script unless one is passed). The document
     *  is snapshotted and fully restored on stop. Returns false on script errors. */
    async startGame(script?: string) { const m = await import('./game/game-runtime'); return m.startGame(script); },
    /** Stop a running game and restore the document. */
    async stopGame() { const m = await import('./game/game-runtime'); m.stopGame(); },
    /** True while a game is running. */
    isGameRunning(): boolean { return store.gameActive; },

    // Visual game builder (behaviors → generated game.* script)
    /** Get a sprite's behaviors (visual builder rules). */
    getBehaviors(id: string) { return store.elements.find(e => e.id === id)?.behaviors ?? []; },
    /** Set a sprite's behaviors. Also ensures it has a stable name (tag) if missing. */
    setBehaviors(id: string, behaviors: any[]) { updateElement(id, { behaviors } as any, true); },
    /** Get / set the scene-level behaviors (on start, score, win/lose). */
    getSceneBehaviors() { return store.sceneBehaviors ?? []; },
    setSceneBehaviors(behaviors: any[]) { setSceneBehaviors(behaviors); },
    /** Get / set declared game variables ({name, initial}) — used by the Variables panel. */
    getGameVars() { return store.gameVars ?? []; },
    setGameVars(vars: { name: string; initial: number }[]) { setGameVars(vars); },
    /** Name a sprite (sets its `tag`, used to reference it in behaviors and game.find). */
    nameSprite(id: string, name: string) { updateElement(id, { tag: name } as any, true); },
    /** Show/hide the visual Game Builder (Behaviors) panel. */
    toggleGameBuilder(visible?: boolean) { toggleBehaviorsPanel(visible); },
    /** Show/hide the full-screen node-graph editor. */
    toggleGameGraph(visible?: boolean) { toggleGameGraph(visible); },
    /** Get an owner's Blueprint ('' = Scene, else a sprite tag): {nodes, edges}. */
    getBlueprint(owner = '') { return blueprintFor(owner); },
    /** Set an owner's Blueprint ('' = Scene by default). */
    setBlueprint(bp: { nodes: any[]; edges: any[] }, owner = '') { setBlueprint(owner, bp as any); },
    /** Get / set a specific owner's Blueprint (Scene or a sprite tag). */
    getBlueprintFor(owner: string) { return blueprintFor(owner); },
    setBlueprintFor(owner: string, bp: { nodes: any[]; edges: any[] }) { setBlueprint(owner, bp as any); },
    /** All Blueprints keyed by owner ('' = Scene). */
    getBlueprints() { return store.blueprints; },
    /** Show/hide the full-screen Blueprint (execution-flow) editor. */
    toggleBlueprint(visible?: boolean) { toggleBlueprint(visible); },
    /** Compile the current document's blocks to a `game.*` script (the "See the code" view). */
    async compileGame(): Promise<string> {
        const m = await import('./game/behaviors-to-script');
        return m.effectiveGameScript(store.elements, store.sceneBehaviors ?? [], store.gameScript, store.gameVars ?? [], store.blueprints, store.gameAuthoringMode) || '';
    },
    /** Compile the blocks and play the resulting game (Play button). */
    async playBehaviorGame(): Promise<boolean> {
        const [g, r] = await Promise.all([import('./game/behaviors-to-script'), import('./game/game-runtime')]);
        const script = g.effectiveGameScript(store.elements, store.sceneBehaviors ?? [], store.gameScript, store.gameVars ?? [], store.blueprints, store.gameAuthoringMode);
        if (!script) return false;
        return r.startGame(script);
    },

    // Version history (local IndexedDB snapshots)
    /** List saved version snapshots (newest first, metadata only). */
    async listVersions() { const m = await import('./storage/version-history'); return m.listVersions(); },
    /** Record a version snapshot of the current document immediately. */
    async snapshotVersion(label?: string) {
        const m = await import('./storage/version-history');
        const a = await import('./storage/auto-save');
        const doc = a.buildCurrentDocument();
        return m.snapshotVersionNow(JSON.stringify(doc), {
            name: doc.metadata?.name || 'Untitled',
            docType: store.docType,
            elementCount: store.elements.length,
            pageCount: store.slides.length,
        }, label);
    },
    /** Restore a version snapshot by id (replaces the current document; undoable via reload of prior autosave). */
    async restoreVersion(id: string) { const m = await import('./storage/version-history'); return m.restoreVersion(id); },
    /** Delete a version snapshot by id. */
    async deleteVersion(id: string) { const m = await import('./storage/version-history'); return m.deleteVersion(id); },

    // Templates
    /** List template metadata, optionally filtered by category (e.g. 'designs', 'my-templates'). */
    getTemplates(category?: string) {
        const all = category
            ? getTemplatesByCategory(category as any)
            : templateRegistry.getAllTemplates();
        return all.map(t => ({ ...t.metadata }));
    },
    /** Apply a template by id (design, presentation, or user-saved document templates). */
    applyTemplate(id: string): boolean {
        const template: any = getTemplateById(id);
        if (!template) return false;
        if (template.doc?.version) {
            loadDocument(JSON.parse(JSON.stringify(template.doc)));
            return true;
        }
        if (template.pages?.length > 0 && template.pageSize) {
            loadDesignTemplate(template);
            return true;
        }
        if (template.slides?.length > 0) {
            loadPresentationTemplate(template);
            return true;
        }
        if (template.dslContent) return false; // DSL templates need the import dialog
        loadTemplate(template.data);
        return true;
    },
    /** Search templates by name, description, or tag. Returns matching template metadata. */
    searchTemplates(query: string) { return searchTemplates(query).map(t => ({ ...t.metadata })); },
    /** Save the current document as a reusable template under My Templates. */
    saveAsTemplate(name: string, description?: string) {
        const saved = saveCurrentAsTemplate(name, description);
        if (saved) refreshUserTemplates();
        return saved ? { ...saved.metadata } : null;
    },
    /** Delete a user-saved template by id. */
    deleteUserTemplate(id: string): boolean {
        const ok = deleteUserTemplate(id);
        if (ok) refreshUserTemplates();
        return ok;
    },

    // Brand Kits
    /** List saved brand kits. */
    listBrandKits() { return listBrandKits(); },
    /** Create and save a brand kit. Pass {fromDocument: true} to extract colors from the current document. */
    createBrandKit(partial?: { name?: string; colors?: any; fonts?: any; fromDocument?: boolean }) {
        const kit = createBrandKit(partial?.fromDocument
            ? { ...partial, colors: { ...extractBrandColorsFromDocument(), ...partial?.colors } }
            : partial);
        saveBrandKit(kit);
        return kit;
    },
    /** Update and persist a brand kit object. */
    saveBrandKit(kit: any): boolean { return saveBrandKit(kit); },
    /** Delete a brand kit by id. */
    deleteBrandKit(id: string): boolean { return deleteBrandKit(id); },
    /** Extract a brand color palette from the current document. */
    extractBrandColors() { return extractBrandColorsFromDocument(); },
    /** Apply a brand kit (by id or object) to the whole document: luminance-matched recolor + heading/body refont. */
    applyBrandKit(kitOrId: string | any, opts?: { colors?: boolean; fonts?: boolean }): boolean {
        const kit = typeof kitOrId === 'string' ? listBrandKits().find(k => k.id === kitOrId) : kitOrId;
        if (!kit) return false;
        applyBrandKit(kit, opts);
        return true;
    },
    /** Show/hide the Brand Kit panel. */
    toggleBrandKitPanel(visible?: boolean) { toggleBrandKitPanel(visible); },

    // Elements / SVG import
    /** Import SVG markup as editable vector path elements. Returns the new element ids. */
    importSvg(svgText: string, opts?: { x?: number; y?: number; targetWidth?: number }) {
        return importSvgToCanvas(svgText, opts);
    },
    /** Show/hide the Elements library panel (shapes, frames, icon library). */
    toggleElementsPanel(visible?: boolean) { toggleElementsPanel(visible); },

    // Stick-figure library (drawify-style editable figures)
    /** Insert a stick figure by id (e.g. "daily-waving") as one editable, recolourable
     *  group. Omit x/y to center on the active page. Returns the new element ids. */
    insertStickFigure(assetId: string, opts?: { x?: number; y?: number; targetWidth?: number }) {
        return insertStickFigure(assetId, opts);
    },
    /** List stick-figure assets (id/name/category/tags), optionally filtered by category. */
    listStickFigures(category?: string) {
        const assets = category
            ? getStickAssetsByCategory(category as any)
            : getAllStickAssets();
        return assets.map(a => ({ id: a.id, name: a.name, category: a.category, tags: a.tags }));
    },
    /** List stick-figure categories (id + name). */
    listStickFigureCategories() {
        return STICK_CATEGORIES.map(c => ({ id: c.id, name: c.name }));
    },
    /** Recolour stick-figure parts by semantic role among `ids` (default: current
     *  selection). `outline` recolours every part's stroke; `accent` recolours the
     *  fill of accent (colourful prop) parts. Returns the number of parts changed. */
    recolorStickFigure(colors: { outline?: string; accent?: string }, ids?: string[]) {
        return recolorStickFigure(ids ?? [...store.selection], colors);
    },
    /** Show/hide the Stick Figures library panel. */
    toggleStickFigurePanel(visible?: boolean) { toggleStickFigurePanel(visible); },

    // Animated stick figures (procedural rig)
    /** List motion clip ids/names (idle/walk/wave/talk/point/jump). */
    listStickFigureClips() { return CLIP_LIST.map(c => ({ id: c.id, name: c.name })); },
    /** Insert an animated stick figure playing `clip`. Omit x/y to center on the page. */
    insertAnimatedFigure(clip = 'walk', opts?: { x?: number; y?: number; width?: number; facing?: 1 | -1; speed?: number }) {
        return insertAnimatedFigure(clip, opts);
    },
    /** Change the motion clip of the given (or selected) animated figures. */
    setAnimatedFigureClip(clip: string, ids?: string[]) { setAnimatedFigureClip(ids ?? [...store.selection], clip); },
    /** Play/pause the given (or selected) animated figures (toggles if `playing` omitted). */
    setAnimatedFigurePlaying(playing?: boolean, ids?: string[]) { setAnimatedFigurePlaying(ids ?? [...store.selection], playing); },
    /** Flip the facing (left/right) of the given (or selected) animated figures. */
    flipAnimatedFigure(ids?: string[]) { flipAnimatedFigure(ids ?? [...store.selection]); },
    /** Bake the current frame of an animated figure to editable path elements. */
    bakeAnimatedFigure(id?: string) { return bakeAnimatedFigure(id ?? store.selection[0]); },
    /** Make an animated figure walk along a path element over `dur` seconds (loops, auto-faces). */
    attachFigureToPath(figureId: string, pathId: string, opts?: { dur?: number; loop?: boolean; autoFace?: boolean }) {
        return attachFigureToPath(figureId, pathId, opts);
    },
    /** Stop a figure following its path (it animates in place again). */
    detachFigurePath(id?: string) { detachFigurePath(id ?? store.selection[0]); },
    /** Set a timed action sequence on a figure, e.g. [{clip:'walk',dur:3},{clip:'wave',dur:2}] (loops). Empty clears it. */
    setFigureSequence(steps: { clip: string; dur: number }[], id?: string) { setFigureSequence(id ?? store.selection[0], steps); },
    /** Record the live canvas (animations included) to a video that auto-downloads.
     *  Pass `seconds` to auto-stop; otherwise call stopRecording(). */
    recordAnimation(seconds?: number, format: 'webm' | 'mp4' = 'webm') {
        setRequestRecording({ start: true, format });
        if (seconds && seconds > 0) setTimeout(() => setRequestRecording({ start: false }), seconds * 1000);
    },
    /** Stop an in-progress canvas recording (saves + downloads the file). */
    stopRecording() { setRequestRecording({ start: false }); },
    /** Show/hide the Scene Timeline (play & scrub all animated figures together). */
    toggleSceneTimeline(visible?: boolean) { toggleSceneTimeline(visible); },
    /** Show/hide the Keyframes dope-sheet (After-Effects–class per-property timeline for the selected element). */
    toggleKeyframePanel(visible?: boolean) { toggleKeyframePanel(visible); },
    /** Play/pause the scene timeline. */
    playScene(playing?: boolean) { setStore('storyPlaying', playing ?? !store.storyPlaying); },
    /** Move the scene playhead to `seconds` (pauses playback). */
    seekScene(seconds: number) { setStore({ storyTime: Math.max(0, seconds), storyPlaying: false } as any); },

    // --- After-Effects–class absolute-time composition (Phase 0 spine) ---
    // Property tracks keyframed in absolute SECONDS, evaluated by
    // `evaluateCompositionAt(storyTime)` and rendered as transient overrides.
    // Open the Scene Timeline (`toggleSceneTimeline(true)`) then `seekScene(t)`
    // to scrub. See `docs/after-effects-plan.md`.
    /** Replace all composition tracks. */
    setCompositionTracks(tracks: PropertyTrack[]) { setStore('compositionTracks', tracks ?? []); },
    /** Get the current composition tracks. */
    getCompositionTracks(): PropertyTrack[] { return store.compositionTracks; },
    /** Remove every composition track. */
    clearComposition() { setStore('compositionTracks', []); },
    /**
     * Add (or update) a single keyframe on an element's property track at time `t`
     * seconds. Creates the track if absent; a key at the same `t` is replaced. Keys
     * stay sorted by time. `property`: 'x'|'y'|'width'|'height'|'opacity'|'angle'
     * (radians)|'backgroundColor'|'strokeColor'|…; colors interpolate as hex.
     */
    addKeyframe(elementId: string, property: string, t: number, value: number | string, easing?: EasingName) {
        setStore('compositionTracks', (tracks: PropertyTrack[]) => {
            const next = tracks.map(tr => ({ ...tr, keys: [...tr.keys] }));
            let track = next.find(tr => tr.elementId === elementId && tr.property === property);
            if (!track) { track = { elementId, property, keys: [] }; next.push(track); }
            const key: TimedKeyframe = { t, value, easing };
            const at = track.keys.findIndex(k => k.t === t);
            if (at >= 0) track.keys[at] = key; else track.keys.push(key);
            track.keys.sort((a, b) => a.t - b.t);
            return next;
        });
    },
    /** Evaluate the composition at time `t` seconds → map of elementId → property overrides
     *  (for inspection/testing). Reflects transform parenting when present — i.e. the same
     *  composed result the canvas renders. */
    evaluateComposition(t: number) {
        const overrides = store.elements.some(e => e.transformParentId)
            ? resolveParentedPoses(store.elements, t, store.compositionTracks)
            : evaluateCompositionAt(t, store.compositionTracks);
        resolveNestedOverrides(overrides, new Map(store.elements.map(e => [e.id, e])));
        return overrides;
    },
    /**
     * Create a **null object** — an invisible transform holder (renders as a crosshair
     * gizmo, excluded from export) used purely as an animation parent. Set another
     * element's `transformParentId` to this id (or use the Keyframes panel's Parent
     * selector) so it inherits the null's animated position/rotation/scale. Returns the id.
     */
    createNull(x?: number, y?: number): string {
        const cx = x ?? 100;
        const cy = y ?? 100;
        const id = this.createElement('rectangle', cx - 20, cy - 20, 40, 40, { backgroundColor: 'transparent', strokeColor: 'transparent' });
        updateElement(id, { isNullObject: true, name: 'Null' } as any, false);
        this.setSelected([id]);
        return id;
    },
    /** Set (or clear, with null) an element's transform parent — it inherits the parent's animated transform. */
    setTransformParent(childId: string, parentId: string | null) { updateElement(childId, { transformParentId: parentId } as any, true); },

    /**
     * Create an **adjustment layer** — a rectangular region that applies a CSS filter
     * (blur/brightness/contrast/saturate/…) to everything rendered BENEATH it. Set the
     * filter fields (e.g. `filterBlur`, `filterBrightness`) via `updateElement`, or keyframe
     * them on the timeline. Returns the id. (Effect shows on-canvas + in presentation; not
     * yet applied in PNG/SVG export.)
     */
    createAdjustmentLayer(x?: number, y?: number, width = 320, height = 220, filters?: Record<string, number>) {
        const cx = x ?? 80, cy = y ?? 80;
        const id = this.createElement('rectangle', cx, cy, width, height, { backgroundColor: 'transparent', strokeColor: 'transparent' });
        updateElement(id, { isAdjustmentLayer: true, name: 'Adjustment', filterBlur: 6, ...(filters || {}) } as any, false);
        this.setSelected([id]);
        return id;
    },

    // --- Dimension annotations (precision-measurement Phase 5) ---
    // Persistent CAD-style dimension lines that attach to an element and auto-update
    // as it moves/resizes. Rendered as a world-space overlay; saved with the document.
    /** Add a width/height dimension to an element (default the selection). Returns its id. */
    addDimension(targetId?: string, measure: DimensionMeasure = 'width', offset = 24) {
        const id = targetId ?? store.selection[0];
        return id ? storeAddDimension(id, measure, offset) : null;
    },
    /** Remove a dimension annotation by id. */
    removeDimension(id: string) { storeRemoveDimension(id); },
    /** Remove every dimension attached to an element (default the selection). */
    removeDimensionsForTarget(targetId?: string) {
        const id = targetId ?? store.selection[0];
        if (id) storeRemoveDimensionsForTarget(id);
    },
    /** List all dimension annotations. */
    listDimensions() { return store.dimensionAnnotations; },
    /** Current measured value (px) of a dimension, from its target's live bounds — for inspection/testing. */
    getDimensionValue(id: string): number | null {
        const dim = store.dimensionAnnotations.find(d => d.id === id);
        if (!dim) return null;
        const el = store.elements.find(e => e.id === dim.targetId);
        if (!el) return null;
        return dimensionGeometry(dim, { x: el.x, y: el.y, width: el.width, height: el.height }).value;
    },
    /** Export the current scene as a self-contained HTML file (animated figures play in it). */
    async exportHtml(name = 'animation') { const m = await import('./utils/export-game'); return m.exportSceneAsHtml(name); },

    // AI assists (Canva-style; keys from AI Settings)
    /** Magic Write: transform text of the given (or selected) text elements. Modes: rewrite|shorten|expand|fix|custom. */
    async magicWrite(mode: 'rewrite' | 'shorten' | 'expand' | 'fix' | 'custom' = 'rewrite', instruction?: string, ids?: string[]) {
        const m = await import('./ai/canva-ai');
        return m.magicWrite(ids ?? [...store.selection], mode, instruction);
    },
    /** Generate an image from a prompt (OpenAI) and insert it on the active page. Returns the element id. */
    async generateImage(promptText: string, opts?: { size?: '1024x1024' | '1536x1024' | '1024x1536' }) {
        const m = await import('./ai/canva-ai');
        return m.generateImage(promptText, opts);
    },
    /** Remove the background of the selected (or given) image element via OpenAI image editing.
     *  Original pixels are preserved by default (AI output used only as an alpha mask);
     *  pass {preserveOriginal: false} to take the AI's regenerated image as-is. */
    async removeBackground(id?: string, opts?: { preserveOriginal?: boolean }) {
        const m = await import('./ai/canva-ai');
        return m.removeBackground(id, opts);
    },
    /** Generate a full design document from a text brief (any LLM provider):
     *  headline, subhead, bullets, CTA and palette laid out proportionally.
     *  Pass a preset id or {width, height} (default 1080×1080). */
    async generateDesign(promptText: string, size?: string | { width: number, height: number }) {
        const m = await import('./ai/design-generator');
        const resolved = typeof size === 'string' ? getPagePreset(size) : size;
        return m.generateDesign(promptText, resolved ? { width: resolved.width, height: resolved.height } : undefined);
    },
    /** Magic Edit: repaint the selected (or given) image per an instruction, e.g.
     *  "remove the person on the left" (OpenAI image edits). */
    async magicEditImage(instruction: string, id?: string) {
        const m = await import('./ai/canva-ai');
        return m.magicEditImage(id, instruction);
    },
    /** Magic Expand: outpaint the selected (or given) image — margins are fractions
     *  of the source size (default 0.25 each side). The element grows to match. */
    async expandImage(opts?: { left?: number; right?: number; top?: number; bottom?: number; prompt?: string }, id?: string) {
        const m = await import('./ai/canva-ai');
        return m.expandImage(id, opts);
    },

    // Font pairings
    /** List curated heading/body font pairings. */
    getFontPairings() { return FONT_PAIRINGS.map(p => ({ id: p.id, name: p.name, heading: p.heading.family, body: p.body.family })); },
    /** Apply a font pairing to all text elements (heading = 40px+/bold) and set the body font as default. */
    async applyFontPairing(id: string) { return applyFontPairing(id); },

    // Stock photos (Wikimedia Commons — openly licensed, no key needed)
    /** Search openly-licensed stock photos. Returns photo descriptors for insertStockPhoto. */
    async searchStockPhotos(query: string, page: number = 1) { return searchStockPhotos(query, page); },
    /** Insert a photo returned by searchStockPhotos, centered on the active page
     *  (or on `at`, a world-space point). Returns the element id. */
    async insertStockPhoto(photo: any, at?: { x: number; y: number }) { return insertStockPhoto(photo, at); },

    // Text effects
    /** List text-effect preset ids/names (none, shadow, lift, hollow, splice, outline, echo, neon, glitch, background). */
    getTextEffectPresets() { return TEXT_EFFECT_PRESETS.map(p => ({ id: p.id, name: p.name })); },
    /** Apply a text-effect preset to the given element ids (or the current selection). */
    applyTextEffect(presetId: string, ids?: string[]): number {
        const preset = getTextEffectPreset(presetId);
        if (!preset) return 0;
        const targets = (ids ?? store.selection)
            .map(id => store.elements.find(e => e.id === id))
            .filter((e): e is NonNullable<typeof e> => !!e && e.type === 'text');
        targets.forEach(el => updateElement(el.id, preset.patch(el)));
        return targets.length;
    },

    // Z-Order
    bringToFront(ids: string[]) { bringToFront(ids); },
    sendToBack(ids: string[]) { sendToBack(ids); },
    moveElementZIndex(id: string, direction: 'front' | 'back' | 'forward' | 'backward') { moveElementZIndex(id, direction); },

    // Alignment & Distribution
    alignSelectedElements(type: AlignmentType, keyId?: string) { alignSelectedElements(type, keyId); },
    distributeSelectedElements(type: DistributionType) { distributeSelectedElements(type); },
    /** Distribute by equal edge-to-edge spacing, or a fixed `gap` px between each. */
    distributeSpacing(type: DistributionType, gap?: number) { distributeSpacing(type, gap); },
    /** Toggle align-to-key-object mode (key = last-selected element stays put). */
    toggleAlignToKey(on?: boolean) { toggleAlignToKey(on); },
    /** Blend: create `steps` interpolated copies between two objects (default 4). */
    blend(steps = 4, ids?: string[]) { blendShapes(ids, steps); },
    /** Blend along a spine: distribute `steps` interpolated copies of two shapes along a
     *  selected path/line (auto-oriented to the tangent). Selection = two shapes + one path. */
    blendAlongPath(steps = 8, orient = true, ids?: string[]) { return blendAlongPath(ids ?? [...store.selection], steps, orient); },
    /** Smooth (shape-morph) blend: interpolate two shapes' OUTLINES so one truly morphs into the
     *  other (circle → star), producing `steps` path elements. Selection = two shapes. */
    blendMorph(steps = 8, ids?: string[]) { return blendShapesMorph(ids ?? [...store.selection], steps); },
    /** Recolor Artwork: open the panel / remap a colour / shift the palette's HSL across the selection. */
    toggleRecolorPanel(visible?: boolean) { toggleRecolorPanel(visible); },
    getSelectionColors(ids?: string[]) { return getSelectionColors(ids); },
    /** Recolor: randomly re-order the selection's distinct colours (a derangement). */
    shuffleSelectionColors(ids?: string[]) { return shuffleSelectionColors(ids); },

    // ── Colour Guide: tints, harmonies, palette-from-image ──────────────────
    /** A light→dark ramp of tints & shades around a base colour. */
    generateTints(hex: string, steps = 4) { return generateTints(hex, steps); },
    /** A harmony palette (complementary/analogous/triadic/split-complementary/tetradic/monochromatic). */
    generateHarmony(hex: string, type: HarmonyType = 'complementary') { return generateHarmony(hex, type); },
    /** Extract dominant colours from an image (URL/dataURL, or an element id with a background image). */
    async extractImagePalette(source: string, count = 6): Promise<string[]> {
        const el = store.elements.find(e => e.id === source);
        const src = el?.backgroundImage || source;
        return extractImagePalette(src, count);
    },
    /** Recolour the selection's distinct colours onto a target palette (cycling). */
    applyPaletteToSelection(palette: string[], ids?: string[]) { return applyPaletteToSelection(palette, ids); },
    /** Apply a harmony built from `baseHex` to the selection in one call. */
    applyHarmonyToSelection(baseHex: string, type: HarmonyType = 'complementary', ids?: string[]) {
        return applyPaletteToSelection(generateHarmony(baseHex, type), ids);
    },
    /** Colour theme picker: pull a palette from an image and recolour the selection with it. */
    async recolorFromImage(source: string, count = 6, ids?: string[]): Promise<number> {
        const palette = await this.extractImagePalette(source, count);
        return applyPaletteToSelection(palette, ids);
    },
    recolorSelectionColor(from: string, to: string, ids?: string[]) { recolorSelectionColor(from, to, ids); },
    adjustSelectionColors(opts: { hue?: number; lightness?: number; saturation?: number }, ids?: string[]) { adjustSelectionColors(opts, ids); },
    /** Toggle the Measure tool (drag on canvas to read distance & angle). */
    toggleMeasure(active?: boolean) { toggleMeasure(active); },
    /** Toggle the Shape Builder (drag across ≥2 selected shapes to merge / Alt-drag to delete). */
    toggleShapeBuilder(active?: boolean) { toggleShapeBuilder(active); },
    /** Magic Wand — select every element sharing the reference's fill ('fill'|'stroke'|'both'). */
    /** Select › Same: match by fill/stroke/both, or fontFamily/fontSize/opacity/strokeWidth/type. */
    selectSimilar(refId?: string, match: 'fill' | 'stroke' | 'both' | 'fontFamily' | 'fontSize' | 'opacity' | 'strokeWidth' | 'type' = 'fill') { return selectSimilar(refId, match); },
    /** Distort & Transform — 'pucker'|'bloat'|'twirl'|'zigzag'|'crystallize'|'roughen' on the selection (amount 0..1). */
    distort(kind: 'pucker' | 'bloat' | 'twirl' | 'zigzag' | 'crystallize' | 'roughen', amount = 0.25, ids?: string[]) { return applyDistort(ids ?? [...store.selection], kind, amount); },
    /** Toggle the Knife/Scissors cut tool (drag a line to slice, click a path to split). */
    toggleCutTool(active?: boolean) { toggleCutTool(active); },
    /** Knife — slice shapes along the line p0→p1 into pieces (targets default to selection / all crossed). */
    knife(p0: { x: number; y: number }, p1: { x: number; y: number }, ids?: string[]) { return knifeCut(p0, p1, ids); },
    /** Scissors — split a path at the anchor nearest `point`. */
    splitPath(id: string, point: { x: number; y: number }) { return splitPathAt(id, point); },
    /** Toggle the Live Paint Bucket (click enclosed regions to fill them). */
    toggleLivePaint(active?: boolean) { toggleLivePaint(active); },
    /** Make a Live Paint group from shapes (default: selection) so regions can be bucket-filled. */
    makeLivePaint(ids?: string[]) { return makeLivePaint(ids ?? [...store.selection]); },
    /** Fill the enclosed Live Paint region at a world point with a colour (default: active fill). */
    livePaintFill(point: { x: number; y: number }, color?: string) { return livePaintFillAt(point, color); },
    /** Release a Live Paint group — region fills become plain shapes. */
    releaseLivePaint(groupId: string) { releaseLivePaint(groupId); },
    /** Live Paint Selection — the face under a world point (group, key, fillId). */
    livePaintFaceAt(point: { x: number; y: number }) { return livePaintFaceAt(point); },
    /** Clear the Live Paint face under a world point. */
    clearLivePaintFace(point: { x: number; y: number }) { return deleteLivePaintFaceAt(point); },
    /** Toggle the Width tool (drag across a path to vary its stroke width). */
    toggleWidthTool(active?: boolean) { toggleWidthTool(active); },
    /** Width tool — set a stroke-width point at parameter t (0..1) along an open path. */
    setWidthPoint(id: string, t: number, width: number) { return setWidthPoint(id, t, width); },
    /** Reset a path's variable width back to a uniform stroke. */
    clearWidthProfile(ids?: string[]) { clearWidthProfile(ids ?? [...store.selection]); },
    /** Vertical Type — toggle stacked text orientation and resize the box to fit (top→bottom,
     *  columns right→left). */
    setTextVertical(id: string, on?: boolean) { return setTextVertical(id, on); },
    /** Touch Type — select & transform individual glyphs of a single-line text element. */
    toggleTouchType(active?: boolean) { toggleTouchType(active); },
    /** Type on Path — click a line/curve to flow text along it. */
    toggleTypeOnPath(active?: boolean) { toggleTypeOnPath(active); },
    /** Flow text along a path element (sets curvedText + containerText). */
    attachTextToPath(id: string, text: string) { attachTextToPath(id, text); },
    /** Exit all blocking tool-mode overlays. */
    exitAllToolModes() { exitAllToolModes(); },
    /** Set a per-glyph transform (dx, dy, scale, rot) and/or colour on a text element. */
    setCharTransform(id: string, idx: number, patch: { dx?: number; dy?: number; scale?: number; rot?: number; color?: string }) { setCharTransform(id, idx, patch, true); },
    /** Reset Touch Type transforms back to plain text. */
    clearCharTransforms(id: string) { clearCharTransforms(id); },
    /** Graph tool — set a chart's data values (bar/pie). */
    setChartData(id: string, values: number[], labels?: string[]) { setChartData(id, values, labels); },
    /** Symbolism brush — Illustrator symbol sub-tools over symbol instances. */
    toggleSymbolism(active?: boolean) { toggleSymbolism(active); },
    setSymbolismMode(mode: 'sizer'|'spinner'|'shifter'|'screener'|'stainer'|'styler') { setSymbolismMode(mode); },
    /** Apply a symbolism brush dab at a world point (radius, {dx,dy,alt}) to nearby instances. */
    symbolismBrush(mode: 'sizer'|'spinner'|'shifter'|'screener'|'stainer'|'styler', x: number, y: number, radius = 60, opts?: { dx?: number; dy?: number; alt?: boolean }) { return applySymbolism(mode, x, y, radius, opts); },
    /** Slice tool — drag a region to export it as PNG (or call exportRegion directly). */
    toggleSliceTool(active?: boolean) { toggleSliceTool(active); },
    /** Export an arbitrary world rectangle to PNG. */
    exportRegion(x: number, y: number, w: number, h: number, name = 'slice', scale = 2) { return exportRegion(x, y, w, h, name, scale, true); },
    /** Curvature tool — click points to fit a smooth curve through them. */
    toggleCurveTool(active?: boolean) { toggleCurveTool(active); },
    /** Create a smooth path through world points (Catmull-Rom → Bézier). */
    createCurvature(points: { x: number; y: number }[], closed = false) { return commitCurvature(points, closed); },
    /** Reshape tool — drag a path to bend it while pinning the endpoints. */
    toggleReshapeTool(active?: boolean) { toggleReshapeTool(active); },
    /** Blob brush — paint filled strokes that union into one shape. */
    toggleBlobBrush(active?: boolean) { toggleBlobBrush(active); },
    /** Commit a blob stroke from world points (radius = half-thickness); merges same-colour overlaps. */
    blobStroke(points: { x: number; y: number }[], radius = 14) { return commitBlobStroke(points, radius); },
    /** Path eraser — drag along a path to erase a span of it. */
    togglePathEraser(active?: boolean) { togglePathEraser(active); },
    /** Carve an eraser swath (world points, radius) out of overlapping shapes (destructive). */
    pathErase(points: { x: number; y: number }[], radius = 16) { return commitPathErase(points, radius); },
    /** Puppet Warp — drop pins, drag one to deform with the others anchored. */
    togglePuppetWarp(active?: boolean) { togglePuppetWarp(active); },
    /** Add a puppet pin at a world point (returns its index). */
    addPuppetPin(id: string, x: number, y: number) { return addPuppetPin(id, x, y); },
    /** Move puppet pin `idx` to a world point and re-deform the mesh. */
    movePuppetPin(id: string, idx: number, x: number, y: number) { movePuppetPin(id, idx, x, y, true); },
    /** Remove a puppet pin (omit idx to clear all pins + the warp). */
    removePuppetPin(id: string, idx?: number) { removePuppetPin(id, idx); },
    /** Perspective Grid overlay (2-point). */
    togglePerspectiveGrid(active?: boolean) { togglePerspectiveGrid(active); },
    /** Set perspective grid geometry (world coords: horizonY, leftVPx, rightVPx). */
    setPerspectiveGrid(g: { horizonY?: number; leftVPx?: number; rightVPx?: number }) { setPerspectiveGrid(g); },
    /** Project selected shapes onto a perspective plane ('left'|'right'|'floor'). */
    projectToPlane(plane: 'left' | 'right' | 'floor', ids?: string[]) { return projectToPlane(ids ?? [...store.selection], plane); },
    /** Eyedropper: arm picking a style onto targets (default: selection); next canvas click on an object copies its style. */
    startEyedropper(targetIds?: string[]) { startEyedropper(targetIds); },
    /** Directly apply a source object's style to the armed targets. */
    /** Apply a sampled source's style to the eyedropper targets. colorOnly (Shift-click) samples just the fill colour. */
    applyEyedropperFrom(sourceId: string, colorOnly = false) { applyEyedropperFrom(sourceId, colorOnly); },

    /**
     * Paint the stroke with a gradient (Illustrator "gradient on stroke").
     * Pass `colors: [a, b]` for a quick 2-stop gradient or full `stops`.
     * Architectural/SVG render the true gradient; sketch strokes stay solid.
     */
    setStrokeGradient(
        opts: { type?: 'linear' | 'radial'; angle?: number; stops?: GradientStop[]; colors?: [string, string] } = {},
        ids?: string[],
    ) {
        const targets = ids ?? [...store.selection];
        if (targets.length === 0) return;
        const stops = opts.stops ?? (opts.colors
            ? [{ offset: 0, color: opts.colors[0] }, { offset: 1, color: opts.colors[1] }]
            : [{ offset: 0, color: '#000000' }, { offset: 1, color: '#ffffff' }]);
        pushToHistory();
        targets.forEach(id => updateElement(id, { strokeGradient: { type: opts.type ?? 'linear', angle: opts.angle ?? 0, stops } }));
    },
    /** Remove the stroke gradient, reverting to the solid strokeColor. */
    clearStrokeGradient(ids?: string[]) {
        const targets = ids ?? [...store.selection];
        if (targets.length === 0) return;
        pushToHistory();
        targets.forEach(id => updateElement(id, { strokeGradient: undefined }));
    },
    /** Cancel an armed eyedropper. */
    cancelEyedropper() { cancelEyedropper(); },

    // Canvas
    setCanvasBackgroundColor(color: string) { setCanvasBackgroundColor(color); },
    setCanvasTexture(texture: 'none' | 'dots' | 'grid' | 'graph' | 'paper' | 'notebook') { setCanvasTexture(texture); },
    /** Apply a named canvas background theme (see CANVAS_THEMES): sets background + texture in one go. */
    setCanvasTheme(themeId: string) {
        const t = CANVAS_THEMES.find(x => x.id === themeId);
        if (!t) return false;
        setCanvasBackgroundColor(t.background);
        setCanvasTexture(t.texture);
        return true;
    },
    zoomToFitSlide() { zoomToFitSlide(); },

    // Tool Selection
    setSelectedTool(tool: ElementType | 'selection') { setSelectedTool(tool); },
    moveSelectedElements(dx: number, dy: number) { moveSelectedElements(dx, dy, true); },

    // Template
    loadTemplate(templateData: any) { loadTemplate(templateData); },

    // Animation
    animateElement,
    animateElements,
    animateElementKeyframes,
    animateAlongPath,
    animateMorph,
    animateElementsStagger,
    animateFrom,
    animateFromTo,
    animateElementsFrom,
    playEntranceAnimation,
    playExitAnimation,
    createTimeline,
    fadeIn,
    fadeOut,
    scaleIn,
    bounce,
    pulse,
    shakeX,
    typewriter,
    wordByWord,
    textScramble,
    textCountUp,
    lineByLine,
    charByChar,
    random,
    stopElementAnimation,
    stopAllElementAnimations,
    pauseElementAnimation,
    resumeElementAnimation,
    easings,
    animationEngine,
    createSpring,

    // Image Pixel Effects
    animatePixelEffect,
    stopPixelEffect,
    pixelEffectPresets,

    // Clipboard & Style
    copyToClipboard,
    cutToClipboard,
    pasteFromClipboard,
    copyStyle,
    pasteStyle,

    // Auto-Save
    forceAutoSave() { forceAutoSave(); },
    clearAutoSave() { clearAutoSave(); },

    // Embed
    getEmbedUrl(docId: string, options?: { theme?: string; slide?: number; background?: string }) {
        const base = `${window.location.origin}${window.location.pathname}#/embed/${encodeURIComponent(docId)}`;
        const params = new URLSearchParams();
        if (options?.theme) params.set('theme', options.theme);
        if (options?.slide) params.set('slide', String(options.slide));
        if (options?.background) params.set('bg', options.background);
        const qs = params.toString();
        return qs ? `${base}?${qs}` : base;
    },
    getEmbedHtml(docId: string, options?: { theme?: string; slide?: number; background?: string; width?: number; height?: number }) {
        const url = this.getEmbedUrl(docId, options);
        const w = options?.width ?? 800;
        const h = options?.height ?? 600;
        return `<iframe src="${url}" width="${w}" height="${h}" frameborder="0" allowfullscreen></iframe>`;
    },

    // --- Pool Lane Management ---

    /**
     * Add a lane to a BPMN pool
     * @param poolId - Pool element ID
     * @param index - Optional index to insert at (defaults to end)
     * @param label - Optional label for the new lane
     */
    addPoolLane(poolId: string, index?: number, label?: string): boolean {
        const el = this.getElement(poolId);
        if (!el || el.type !== 'bpmnPool') return false;
        const laneCount = el.bpmnLaneCount ?? 1;
        if (laneCount >= 6) return false;

        const newCount = laneCount + 1;
        const labels = [...(el.bpmnLaneLabels ?? [])];
        while (labels.length < laneCount) labels.push(`Lane ${labels.length + 1}`);
        const colors = [...(el.bpmnLaneColors ?? [])];
        while (colors.length < laneCount) colors.push('');
        const textColors = [...(el.bpmnLaneTextColors ?? [])];
        while (textColors.length < laneCount) textColors.push('');

        const insertIdx = index ?? labels.length;
        labels.splice(insertIdx, 0, label ?? `Lane ${newCount}`);
        colors.splice(insertIdx, 0, '');
        textColors.splice(insertIdx, 0, '');

        pushToHistory();
        updateElement(poolId, { bpmnLaneCount: newCount, bpmnLaneLabels: labels, bpmnLaneColors: colors, bpmnLaneTextColors: textColors }, false);
        // Shift lane indices for contained elements at or after the insertion point
        if (insertIdx < laneCount) {
            shiftLaneIndicesOnInsert(poolId, insertIdx, store.elements);
        }
        return true;
    },

    /**
     * Remove a lane from a BPMN pool
     * @param poolId - Pool element ID
     * @param index - Lane index to remove
     */
    removePoolLane(poolId: string, index: number): boolean {
        const el = this.getElement(poolId);
        if (!el || el.type !== 'bpmnPool') return false;
        const laneCount = el.bpmnLaneCount ?? 1;
        if (laneCount <= 1 || index < 0 || index >= laneCount) return false;

        const newCount = laneCount - 1;
        const labels = [...(el.bpmnLaneLabels ?? [])];
        if (index < labels.length) labels.splice(index, 1);
        const colors = [...(el.bpmnLaneColors ?? [])];
        if (index < colors.length) colors.splice(index, 1);
        const textColors = [...(el.bpmnLaneTextColors ?? [])];
        if (index < textColors.length) textColors.splice(index, 1);
        const collapsed = [...(el.bpmnLaneCollapsed ?? [])];
        if (index < collapsed.length) collapsed.splice(index, 1);

        pushToHistory();
        updateElement(poolId, {
            bpmnLaneCount: newCount,
            bpmnLaneLabels: labels,
            bpmnLaneColors: colors,
            bpmnLaneTextColors: textColors,
            bpmnLaneCollapsed: collapsed.length > 0 ? collapsed : undefined as any,
        }, false);
        shiftLaneIndicesOnRemove(poolId, index, store.elements);
        return true;
    },

    /**
     * Set a lane label in a BPMN pool
     * @param poolId - Pool element ID
     * @param laneIndex - Lane index
     * @param label - New label text
     */
    setPoolLaneLabel(poolId: string, laneIndex: number, label: string): boolean {
        const el = this.getElement(poolId);
        if (!el || el.type !== 'bpmnPool') return false;
        const laneCount = el.bpmnLaneCount ?? 1;
        if (laneIndex < 0 || laneIndex >= laneCount) return false;

        const labels = [...(el.bpmnLaneLabels ?? [])];
        while (labels.length < laneCount) labels.push(`Lane ${labels.length + 1}`);
        labels[laneIndex] = label;

        pushToHistory();
        updateElement(poolId, { bpmnLaneLabels: labels }, false);
        return true;
    },

    /**
     * Set pool orientation (horizontal or vertical)
     * @param poolId - Pool element ID
     * @param orientation - 'horizontal' or 'vertical'
     */
    setPoolOrientation(poolId: string, orientation: 'horizontal' | 'vertical'): boolean {
        const el = this.getElement(poolId);
        if (!el || el.type !== 'bpmnPool') return false;

        pushToHistory();
        updateElement(poolId, { bpmnOrientation: orientation }, false);
        return true;
    },

    /**
     * Get pool lane information
     * @param poolId - Pool element ID
     */
    getPoolLanes(poolId: string): { labels: string[]; heights: number[]; orientation: string; colors: string[]; textColors: string[] } | null {
        const el = this.getElement(poolId);
        if (!el || el.type !== 'bpmnPool') return null;

        const laneCount = el.bpmnLaneCount ?? 1;
        const labels = el.bpmnLaneLabels ?? Array.from({ length: laneCount }, (_, i) => `Lane ${i + 1}`);
        const heights = el.bpmnLaneHeights ?? Array.from({ length: laneCount }, () => 1 / laneCount);
        const orientation = el.bpmnOrientation ?? 'horizontal';
        const colors = el.bpmnLaneColors ?? [];
        const textColors = el.bpmnLaneTextColors ?? [];

        return { labels: [...labels], heights: [...heights], orientation, colors: [...colors], textColors: [...textColors] };
    },

    /**
     * Set per-lane background color
     */
    setPoolLaneColor(poolId: string, laneIndex: number, color: string): boolean {
        const el = this.getElement(poolId);
        if (!el || el.type !== 'bpmnPool') return false;
        const laneCount = el.bpmnLaneCount ?? 1;
        if (laneIndex < 0 || laneIndex >= laneCount) return false;

        const colors = [...(el.bpmnLaneColors ?? Array(laneCount).fill(''))];
        while (colors.length < laneCount) colors.push('');
        colors[laneIndex] = color;
        pushToHistory();
        updateElement(poolId, { bpmnLaneColors: colors }, false);
        return true;
    },

    /**
     * Set per-lane text color
     */
    setPoolLaneTextColor(poolId: string, laneIndex: number, color: string): boolean {
        const el = this.getElement(poolId);
        if (!el || el.type !== 'bpmnPool') return false;
        const laneCount = el.bpmnLaneCount ?? 1;
        if (laneIndex < 0 || laneIndex >= laneCount) return false;

        const textColors = [...(el.bpmnLaneTextColors ?? Array(laneCount).fill(''))];
        while (textColors.length < laneCount) textColors.push('');
        textColors[laneIndex] = color;
        pushToHistory();
        updateElement(poolId, { bpmnLaneTextColors: textColors }, false);
        return true;
    },

    // --- Pool Lane Containment ---

    /**
     * Assign an element to a pool lane
     * @param elementId - Element ID to assign
     * @param poolId - Pool element ID
     * @param laneIndex - 0-based lane index
     */
    assignToPoolLane(elementId: string, poolId: string, laneIndex: number): boolean {
        const el = this.getElement(elementId);
        const pool = this.getElement(poolId);
        if (!el || !pool || pool.type !== 'bpmnPool') return false;
        const laneCount = pool.bpmnLaneCount ?? 1;
        if (laneIndex < 0 || laneIndex >= laneCount) return false;

        pushToHistory();
        assignToPoolLane(elementId, poolId, laneIndex);
        return true;
    },

    /**
     * Remove an element from its pool lane
     * @param elementId - Element ID to remove from pool
     */
    removeFromPool(elementId: string): boolean {
        const el = this.getElement(elementId);
        if (!el || !el.poolContainerId) return false;

        pushToHistory();
        unassignFromPool(elementId);
        return true;
    },

    /**
     * Get all elements contained in a specific pool or pool lane
     * @param poolId - Pool element ID
     * @param laneIndex - Optional lane index filter (all lanes if omitted)
     */
    getPoolContainedElements(poolId: string, laneIndex?: number): DrawingElement[] {
        return store.elements.filter(el => {
            if (el.poolContainerId !== poolId) return false;
            if (laneIndex !== undefined && el.poolLaneIndex !== laneIndex) return false;
            return true;
        });
    },

    // --- Pool Lane Collapse ---

    /**
     * Set a lane's collapsed state
     * @param poolId - Pool element ID
     * @param laneIndex - Lane index
     * @param collapsed - true to collapse, false to expand
     */
    setPoolLaneCollapsed(poolId: string, laneIndex: number, collapsed: boolean): boolean {
        const el = this.getElement(poolId);
        if (!el || el.type !== 'bpmnPool') return false;
        const laneCount = el.bpmnLaneCount ?? 1;
        if (laneIndex < 0 || laneIndex >= laneCount) return false;

        const collapsedArr = [...(el.bpmnLaneCollapsed ?? Array(laneCount).fill(false))];
        while (collapsedArr.length < laneCount) collapsedArr.push(false);
        collapsedArr[laneIndex] = collapsed;

        pushToHistory();
        updateElement(poolId, { bpmnLaneCollapsed: collapsedArr }, false);
        return true;
    },

    /**
     * Check if a lane is collapsed
     * @param poolId - Pool element ID
     * @param laneIndex - Lane index
     */
    isPoolLaneCollapsed(poolId: string, laneIndex: number): boolean {
        const el = this.getElement(poolId);
        if (!el || el.type !== 'bpmnPool') return false;
        return el.bpmnLaneCollapsed?.[laneIndex] ?? false;
    },

    // ── Cloud Storage ─────────────────────────────────────

    cloudStorage: {
        /** Get the active provider ID (e.g. "google-drive") or null. */
        getActiveProvider(): string | null {
            return cloudStorageManager.getActiveProvider()?.id ?? null;
        },

        /** Check if the active provider is authenticated. */
        isAuthenticated(): boolean {
            return cloudStorageManager.getAuthState().isAuthenticated;
        },

        /** Sign in to the active (or specified) provider. */
        async signIn(providerId?: string): Promise<void> {
            if (providerId && !cloudStorageManager.getActiveProvider()) {
                await cloudStorageManager.setActiveProvider(providerId);
            }
            return cloudStorageManager.signIn();
        },

        /** Sign out of the active provider. */
        async signOut(): Promise<void> {
            return cloudStorageManager.signOut();
        },

        /** Save the current document to the cloud. */
        async save(options?: { fileName?: string; folderId?: string }): Promise<any> {
            saveActiveSlide();
            const doc: SlideDocument = {
                version: 4,
                metadata: {
                    name: options?.fileName || drawingId() || 'untitled',
                    updatedAt: new Date().toISOString(),
                    docType: store.docType,
                },
                elements: JSON.parse(JSON.stringify(store.elements)),
                layers: JSON.parse(JSON.stringify(store.layers)),
                slides: JSON.parse(JSON.stringify(store.slides)),
                globalSettings: JSON.parse(JSON.stringify(store.globalSettings)),
                gridSettings: JSON.parse(JSON.stringify(store.gridSettings)),
                states: JSON.parse(JSON.stringify(store.states)),
                symbols: JSON.parse(JSON.stringify(store.symbols)),
                graphicStyles: JSON.parse(JSON.stringify(store.graphicStyles)),
                swatches: JSON.parse(JSON.stringify(store.swatches)),
                artboards: JSON.parse(JSON.stringify(store.artboards)),
            };
            return cloudStorageManager.save(doc, options);
        },

        /** Load a document from the cloud by file ID. */
        async load(fileId: string): Promise<void> {
            const doc = await cloudStorageManager.load(fileId);
            loadDocument(doc);
        },

        /** List files in the cloud. */
        async list(options?: { query?: string; pageSize?: number }): Promise<any> {
            return cloudStorageManager.list(options);
        },
    },

    // ─── DSL Import ──────────────────────────────────────

    /**
     * Parse and render a DSL diagram from JSON string.
     * @param input - JSON DSL string
     * @param options - Render options (clearCanvas, offsetX/Y, zoomToFit)
     * @returns RenderResult with id maps, or null on parse error
     */
    importDSL(input: string, options?: RenderOptions): RenderResult | null {
        const parsed = dslParse(input);
        if (!parsed.success || !parsed.diagram) {
            console.error('[YappyDSL] Parse errors:', parsed.errors);
            if (parsed.warnings.length > 0) console.warn('[YappyDSL] Warnings:', parsed.warnings);
            return null;
        }
        // Nothing meaningful parsed (e.g. garbage the lenient text parser reduced to
        // an empty diagram) → treat as a failed import, not an empty result.
        if (!parsed.diagram.nodes || parsed.diagram.nodes.length === 0) {
            console.error('[YappyDSL] No nodes parsed from input.');
            return null;
        }
        if (parsed.warnings.length > 0) {
            console.warn('[YappyDSL] Warnings:', parsed.warnings);
        }
        return renderDiagram(parsed.diagram, options);
    },

    /**
     * Parse DSL input without rendering (for validation/preview).
     * @param input - DSL string (JSON or text format)
     * @returns ParseResult with success, diagram IR, errors, warnings
     */
    parseDSL(input: string) {
        return dslParse(input);
    },

    /**
     * Import a Mermaid diagram.
     * Parses Mermaid syntax and renders it on canvas.
     * @param input - Mermaid diagram string (e.g. "graph TD\nA-->B")
     * @param options - Render options
     * @returns RenderResult or null on error
     */
    importMermaid(input: string, options?: RenderOptions): RenderResult | null {
        const adapter = adapterRegistry.get('mermaid');
        if (!adapter) {
            console.error('[YappyDSL] Mermaid adapter not registered.');
            return null;
        }
        const result = adapter.parse(input);
        if (!result.success || !result.diagram) {
            console.error('[YappyDSL] Mermaid parse errors:', result.errors);
            if (result.warnings.length > 0) console.warn('[YappyDSL] Warnings:', result.warnings);
            return null;
        }
        if (result.warnings.length > 0) {
            console.warn('[YappyDSL] Warnings:', result.warnings);
        }
        return renderDiagram(result.diagram, options);
    },

    // ─── Rocket Backend Export ──────────────────────────────

    /**
     * Export the current diagram as a Rocket Backend import schema.
     * Extracts entities from UML Class / Table shapes and relations from connectors.
     * The output JSON can be imported into Rocket Backend via POST /api/:app/_admin/import.
     *
     * @param options.appName - Rocket Backend app name (for context)
     * @param options.softDelete - Enable soft delete (adds deleted_at field)
     * @returns RocketExportResult with schema, errors, and warnings
     */
    exportToRocket(options?: { appName?: string; softDelete?: boolean }): RocketExportResult {
        const elements = store.elements;
        const ENTITY_TYPES = new Set(['umlClass', 'umlEnum', 'umlInterface', 'table']);
        const STATE_TYPES = new Set(['umlState', 'stateStart', 'stateEnd', 'stateSync']);
        const BPMN_TYPES = new Set([
            'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent',
            'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway',
            'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity',
            'bpmnDataObject', 'bpmnAnnotation', 'bpmnPool', 'bpmnDataStore', 'bpmnGroup',
        ]);
        const CONNECTOR_TYPES = new Set(['line', 'arrow', 'bezier', 'elbow', 'polyline', 'organicBranch']);

        // Build DSLDiagram IR from current canvas elements
        const nodes: any[] = [];
        const edges: any[] = [];

        for (const el of elements) {
            if (ENTITY_TYPES.has(el.type)) {
                const shapeMap: Record<string, string> = {
                    umlClass: 'entity', umlEnum: 'enum', umlInterface: 'interface', table: 'table'
                };
                const node: any = {
                    id: el.id,
                    shape: shapeMap[el.type] || el.type,
                    label: el.containerText || el.text || el.id,
                };
                if (el.attributesText) {
                    node.sections = { attributes: el.attributesText };
                    if (el.methodsText) node.sections.methods = el.methodsText;
                }
                if (el.methodsText && !node.sections) {
                    node.sections = { methods: el.methodsText };
                }
                if (el.tableData) {
                    node.properties = { tableData: el.tableData, tableHeaders: el.tableHeaders };
                }
                nodes.push(node);
            } else if (STATE_TYPES.has(el.type)) {
                const stateShapeMap: Record<string, string> = {
                    umlState: 'state', stateStart: 'stateStart', stateEnd: 'stateEnd', stateSync: 'stateSync'
                };
                const node: any = {
                    id: el.id,
                    shape: stateShapeMap[el.type] || el.type,
                    label: el.containerText || el.text || el.id,
                };
                if (el.attributesText) {
                    node.sections = { attributes: el.attributesText };
                }
                nodes.push(node);
            } else if (BPMN_TYPES.has(el.type)) {
                const node: any = {
                    id: el.id,
                    shape: el.type,
                    label: el.containerText || el.text || el.id,
                };
                const bpmnProps: Record<string, any> = {};
                if (el.bpmnEventType) bpmnProps.bpmnEventType = el.bpmnEventType;
                if (el.bpmnTaskType) bpmnProps.bpmnTaskType = el.bpmnTaskType;
                if (el.bpmnLoopType) bpmnProps.bpmnLoopType = el.bpmnLoopType;
                if (el.bpmnNonInterrupting) bpmnProps.bpmnNonInterrupting = el.bpmnNonInterrupting;
                if (el.bpmnLaneCount) bpmnProps.bpmnLaneCount = el.bpmnLaneCount;
                if (el.bpmnLaneLabels) bpmnProps.bpmnLaneLabels = el.bpmnLaneLabels;
                if (Object.keys(bpmnProps).length > 0) node.properties = bpmnProps;
                if (el.poolContainerId) {
                    node.pool = { poolId: el.poolContainerId, lane: el.poolLaneIndex ?? 0 };
                }
                nodes.push(node);
            } else if (CONNECTOR_TYPES.has(el.type)) {
                if (!el.startBinding?.elementId || !el.endBinding?.elementId) continue;
                const edge: any = {
                    id: el.id,
                    from: el.startBinding.elementId,
                    to: el.endBinding.elementId,
                    type: el.type === 'line' ? 'line' : 'arrow',
                };
                if (el.containerText) edge.label = el.containerText;
                if (el.startArrowhead) edge.startArrowhead = el.startArrowhead;
                if (el.endArrowhead) edge.endArrowhead = el.endArrowhead;
                edges.push(edge);
            }
        }

        const diagram = {
            version: 1 as const,
            meta: { sourceFormat: 'yappy-canvas' },
            layout: { strategy: 'manual' as const },
            nodes,
            edges,
        };

        return rocketExport(diagram, options);
    },

    /**
     * Import a Rocket Backend schema as a visual diagram.
     * Converts entities to UML Class shapes and relations to connectors.
     *
     * @param schema - Rocket Backend import/export JSON
     * @param options - Render options
     * @returns RenderResult or null on error
     */
    importRocketSchema(schema: any, options?: RenderOptions): RenderResult | null {
        const diagram = rocketToDSL(schema);
        return renderDiagram(diagram, options);
    },

    // ─── AI Drawing ────────────────────────────────────────
    /**
     * Generate a diagram using AI from a natural language prompt.
     * Requires API keys configured in AI Settings.
     *
     * @param options.rocketMode - Enable Rocket Backend mode (extended prompt for entities, state machines, workflows)
     * @param options.mode - 'quick' (default, single LLM call) or 'deep' (2-stage: research agent → diagram composer — richer output for complex technical topics)
     * @param options.style3D - Render in the 3D concept-diagram style (pastel palette, solidBlock/perspectiveBlock containers, isometric cubes). Ignored when rocketMode is true.
     */
    async generateDiagram(prompt: string, options?: { clearCanvas?: boolean; provider?: string; model?: string; rocketMode?: boolean; mode?: 'quick' | 'deep'; style3D?: boolean }) {
        const { generateDiagram: gen } = await import('./ai/drawing-engine');
        return gen(prompt, options as any);
    },

    /**
     * Generate a diagram from an uploaded sketch image using AI vision.
     * Requires a vision-capable model and API key configured in AI Settings.
     *
     * @param imageFile - The sketch image (File or Blob)
     * @param options.additionalPrompt - Optional text to guide the conversion
     * @param options.style3D - Render in the 3D concept-diagram style.
     */
    async generateDiagramFromSketch(imageFile: File | Blob, options?: { clearCanvas?: boolean; provider?: string; model?: string; additionalPrompt?: string; mode?: 'quick' | 'deep'; style3D?: boolean }) {
        const { generateDiagramFromSketch: gen } = await import('./ai/drawing-engine');
        return gen(imageFile, options as any);
    },

    /**
     * Generate a full slide deck from a text prompt using AI.
     * Requires an API key configured in AI Settings.
     *
     * Slide types generated: title, content, bullets, two-column, quote, section-break,
     * closing, image-text, metrics, timeline, card-grid, comparison.
     * All slides include gradients, shadows, and decorative shapes for rich visuals.
     *
     * @param prompt - Topic or description for the presentation
     * @param options.style - Color palette: 'auto' | 'corporate' | 'forest' | 'royal' | 'sunset' | 'dark' | 'minimalist'
     * @param options.slideCount - Number of slides (0 = auto, or 6-50)
     * @param options.mode - 'quick' (single LLM call, fast) or 'deep' (2-stage agentic, richer content)
     */
    async generatePresentation(prompt: string, options?: { style?: string; slideCount?: number; mode?: 'quick' | 'deep' }) {
        const { generatePresentation: gen } = await import('./ai/slide-generator');
        return gen(prompt, { ...options, clearCanvas: true });
    },

    /**
     * Import markdown text as a slide deck.
     * Headings become slide titles, bullets become content, `---` creates slide breaks.
     *
     * @param markdown - Markdown-formatted text
     * @param palette - Optional color palette name
     */
    async importMarkdownSlides(markdown: string, palette?: string) {
        const { parseMarkdownToSlides } = await import('./utils/markdown-to-slides');
        const { loadDocument } = await import('./store/app-store');
        const doc = parseMarkdownToSlides(markdown, palette);
        loadDocument(doc);
        return { success: true, slideCount: doc.slides?.length || 0 };
    },

    // ─── Deploy to Rocket ──────────────────────────────────
    /**
     * Deploy the current diagram to a Rocket Backend instance.
     * Exports the schema, logs in, ensures the app exists, and imports.
     */
    async deployToRocket() {
        const { loadRocketConfig, hasRocketConfig, rocketLogin, rocketEnsureApp, rocketImportSchema } = await import('./ai/rocket-settings');
        if (!hasRocketConfig()) {
            throw new Error('Rocket Backend not configured. Open Rocket Settings first.');
        }
        const exportResult = this.exportToRocket();
        if (!exportResult.success) {
            throw new Error(exportResult.errors?.map(e => e.message).join(', ') || 'Export failed');
        }
        const config = loadRocketConfig();
        const loginResult = await rocketLogin(config);
        if (!loginResult.success || !loginResult.accessToken) {
            throw new Error(`Login failed: ${loginResult.error}`);
        }
        const token = loginResult.accessToken;
        await rocketEnsureApp(config, token);
        const importResult = await rocketImportSchema(config, token, exportResult.schema!);
        if (!importResult.success) {
            throw new Error(`Import failed: ${importResult.error}`);
        }
        return { success: true, appName: config.appName };
    },
};

declare global {
    interface Window {
        Yappy: typeof YappyAPI;
    }
}

export const initAPI = () => {
    window.Yappy = YappyAPI;
    console.log("Yappy API initialized. Use window.Yappy to interact.");
};
