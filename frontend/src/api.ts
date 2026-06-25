import {
    store, addElement, updateElement, deleteElements, setViewState, rotateView, resetRotation, pushToHistory, setStore, zoomToFit,
    undo, redo, groupSelected, ungroupSelected, duplicateElement, toggleTheme, setTheme, type Theme,
    addLayer, deleteLayer, setActiveLayer, mergeLayerDown, flattenLayers, isolateLayer, showAllLayers,
    updateLayer, duplicateLayer, reorderLayers, moveElementsToLayer, createLayerGroup, toggleLayerGroupExpansion,
    isLayerVisible, isLayerLocked,
    toggleGrid, toggleSnapToGrid, toggleCommandPalette, togglePropertyPanel, togglePresentationMode,
    toggleLayerPanel, toggleMinimap, toggleRulers, addGuide, updateGuide, removeGuide, clearGuides, toggleZenMode, toggleSlideNavigator,
    addDisplayState, updateDisplayState, deleteDisplayState, applyDisplayState, toggleStatePanel,
    applyNextState, applyPreviousState,
    addChildNode, addSiblingNode, toggleCollapseSelection, toggleCollapse,
    setParent, reorderMindmap, applyMindmapStyling, pasteMindmapOutline, applyPathfinder, convertToPath, convertTextToOutlines, outlineStroke, offsetPath, simplifyPath, makeCompoundPath, releaseCompoundPath, joinPaths,
    radialRepeat, gridRepeat, mirrorCopy, transformAgain, toggleEnvelopeWarp, applyMeshWarp,
    toggleSymmetryGuide, setSymmetryAxis, setSymmetryPos, mirrorAcrossSymmetry,
    addSlide, deleteSlide, duplicateSlide, setActiveSlide, reorderSlides,
    updateSlideTransition, updateSlideBackground, setDocType, loadDocument, resetToNewDocument,
    advancePresentation, retreatPresentation,
    bringToFront, sendToBack, moveElementZIndex,
    alignSelectedElements, distributeSelectedElements,
    setCanvasBackgroundColor, setCanvasTexture, zoomToFitSlide,
    setSelectedTool, loadTemplate, moveSelectedElements,
    toggleMainToolbar, toggleUtilityToolbar, toggleSlideToolbar, setSlideToolbarPosition,
    saveActiveSlide, updateGlobalSettings, togglePenStabilization, bumpDirtyRevision, setElementTransform
} from "./store/app-store";
import { setTransformPivot, clearTransformPivot, getCustomPivot } from "./utils/transform-pivot";
import { exportToSvg } from "./utils/export";
import type { ElementType, DrawingElement, FillStyle, StrokeStyle, FontFamily, TextAlign, ArrowHead, VerticalAlign, Point, GradientStop, GradientType, Layer, RichTextSpan, PathAnchor, PathSubpath } from "./types";
import type { Slide, SlideTransition, SlideDocument } from "./types/slide-types";
import type { AlignmentType, DistributionType } from "./utils/alignment";
import type { LayoutDirection } from "./utils/mindmap-layout";
import { parseOutline } from "./utils/mindmap-layout";
import {
    animateElement,
    animateElements,
    createTimeline,
    fadeIn,
    fadeOut,
    scaleIn,
    bounce,
    pulse,
    shakeX,
    stopElementAnimation,
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
            renderStyle: 'sketch',
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
     * Free Transform: set an element's position and/or size numerically. width/height
     * scale the element's relative geometry (pen points, path anchors) like a handle drag.
     */
    setElementTransform(id: string, patch: { x?: number; y?: number; width?: number; height?: number }) {
        setElementTransform(id, patch);
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

        const startP = intersect(sx, sy, tx, ty, source);
        const endP = intersect(tx, ty, sx, sy, target);

        // Compute anchor fractions for stable bindings (endpoint position relative to shape bbox)
        const startFx = source.width ? (startP.x - source.x) / source.width : 0.5;
        const startFy = source.height ? (startP.y - source.y) / source.height : 0.5;
        const endFx = target.width ? (endP.x - target.x) / target.width : 0.5;
        const endFy = target.height ? (endP.y - target.y) / target.height : 0.5;

        const id = this.createElement(type as ElementType, startP.x, startP.y, endP.x - startP.x, endP.y - startP.y, {
            ...options,
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
    /** Build a mindmap subtree under `parentId` from an indented/bulleted text outline. Returns the new node ids. */
    mindmapFromOutline(parentId: string, outline: string) { return pasteMindmapOutline(parentId, parseOutline(outline)); },
    /** Pathfinder boolean over ≥2 element ids: 'union' | 'subtract' | 'intersect' | 'exclude'. Returns new path ids. */
    pathfinder(ids: string[], op: 'union' | 'subtract' | 'intersect' | 'exclude') { return applyPathfinder(ids, op); },
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
    setDocType(type: 'infinite' | 'slides') { setDocType(type); },
    loadDocument(doc: any) { loadDocument(doc); },
    resetToNewDocument(docType: 'infinite' | 'slides' = 'slides') { resetToNewDocument(docType); },

    // Z-Order
    bringToFront(ids: string[]) { bringToFront(ids); },
    sendToBack(ids: string[]) { sendToBack(ids); },
    moveElementZIndex(id: string, direction: 'front' | 'back' | 'forward' | 'backward') { moveElementZIndex(id, direction); },

    // Alignment & Distribution
    alignSelectedElements(type: AlignmentType) { alignSelectedElements(type); },
    distributeSelectedElements(type: DistributionType) { distributeSelectedElements(type); },

    // Canvas
    setCanvasBackgroundColor(color: string) { setCanvasBackgroundColor(color); },
    setCanvasTexture(texture: 'none' | 'dots' | 'grid' | 'graph' | 'paper' | 'notebook') { setCanvasTexture(texture); },
    zoomToFitSlide() { zoomToFitSlide(); },

    // Tool Selection
    setSelectedTool(tool: ElementType | 'selection') { setSelectedTool(tool); },
    moveSelectedElements(dx: number, dy: number) { moveSelectedElements(dx, dy, true); },

    // Template
    loadTemplate(templateData: any) { loadTemplate(templateData); },

    // Animation
    animateElement,
    animateElements,
    createTimeline,
    fadeIn,
    fadeOut,
    scaleIn,
    bounce,
    pulse,
    shakeX,
    stopElementAnimation,
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
