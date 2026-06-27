import { type Component, onMount, createEffect, onCleanup, createSignal, Show, untrack, batch } from "solid-js";
import { calculateAllAnimatedStates } from "../utils/animation-utils";
import { projectMasterPosition } from "../utils/slide-utils";
import { animationEngine } from "../utils/animation/animation-engine";
import rough from 'roughjs'; // Hand-drawn style
import { store, updateElement, setActiveLayer, zoomToFitSlide, isLayerLocked, setCursorPosition, pushToHistory, setSelectedTool, enterCropMode, exitCropMode, updateCropRect, toggleVideoPlayback, startInkCleanupIfNeeded, setViewState, setStore, undo, redo, zoomToFit, toggleZenMode, normalizeRotation, resetRotation, enterSymbolEdit, applyEyedropperFrom, cancelEyedropper } from "../store/app-store";
import { copyToClipboard } from "../utils/object-context-actions";
import { normalizePoints } from "../utils/render-element";
import { screenToWorld } from "../utils/viewport-transforms";
import { recognizeStrokeShape } from "../utils/shape-recognition";
import type { DrawingElement } from "../types";
import ContextMenu from "./context-menu";
import { setImageLoadCallback } from "../utils/image-cache";
import type { SnappingGuide } from "../utils/object-snapping";
import type { SpacingGuide } from "../utils/spacing";
import { createPointerState } from "../utils/pointer-state";
import {
    presentationOnDown, presentationOnMove, presentationOnUp,
    panOnDown, panOnMove, panOnUp,
    laserOnDown, laserOnMove, laserOnUp,
    textOnDown, textOnMove, textOnUp,
    richTextOnDown, richTextOnMove, richTextOnUp,
    inkOnDown,
    eraserOnDown, eraserOnMove, eraserOnUp,
    connectorHandleOnUp,
    handleAutoScroll
} from "../utils/tool-handlers/minor-handlers";
import { drawOnDown, drawOnMove, drawOnUp } from "../utils/tool-handlers/draw-handler";
import { penOnMove } from "../utils/tool-handlers/pen-handler";
import { polylineOnDown, polylineOnMove, polylineOnUp, polylineFinalize, polylineUndo } from "../utils/tool-handlers/polyline-handler";
import { penOnDown as penPathDown, penOnMove as penPathMove, penOnUp as penPathUp, penFinalize as penPathFinalize, penUndo as penPathUndo } from "../utils/tool-handlers/pen-path-handler";
import { selectionOnDown, selectionOnMove, selectionOnUp } from "../utils/tool-handlers/selection-handler";
import { checkBinding as checkBindingUtil, refreshLinePoints as refreshLinePointsUtil, refreshBoundLine as refreshBoundLineUtil } from "../utils/binding-logic";
import {
    computeViewportBounds, cullElementsForAnimation, decayLaserTrail,
    renderWorkspaceBackground, renderSlideBoundaries, renderCanvasTexture,
    renderGrid, renderLayersAndElements, renderSelectionOverlays,
    renderConnectionAnchors, renderLaserTrail
} from "../utils/canvas-renderer";
import { Minimap } from "./minimap";
import { getContextMenuItems } from "../utils/context-menu-builder";
import PathEditorOverlay from "./path-editor-overlay";
import { commitText as commitTextHandler, commitRichText as commitRichTextHandler, handleDoubleClick as handleDoubleClickHandler, type TextEditingContext } from "../utils/tool-handlers/text-editing-handler";
import { computeCellRects, defaultColWidths, defaultRowHeights, defaultTableData, hitTestColEdge, measureColumnOptimalWidth, getNextCell } from "../utils/table-utils";
import { handleDragOver, handleDrop as handleDropHandler, handleWheel, applyAssetAtClientPoint, type CanvasEventContext, type WheelContext } from "../utils/tool-handlers/canvas-event-handlers";
import { registerColorDropCommit } from "../utils/color-drop";
import { pushStabilizedSample } from "../utils/stroke-stabilizer";
import { showToast } from "./toast";
import { hitTestElement } from "../utils/hit-testing";
import { renderCropOverlay, hitTestCropHandle, applyCropDrag, getCropHandleCursor, finalizeCropRect, type CropHandle } from "../utils/image-crop-utils";
import { perfMonitor } from "../utils/performance-monitor";
import { fitShapeToText, fitUmlClassToContent } from "../utils/text-utils";
import { plainTextToSpans } from "../utils/rich-text-utils";
import { CanvasRenderer } from "../rendering/CanvasRenderer";
import { effectiveTime } from "../utils/animation/animation-engine";
import RecordingOverlay from "./recording-overlay";
import TimelapseOverlay from "./timelapse-overlay";
import TimelapsePlayer from "./timelapse-player";
import VideoOverlay from "./video-overlay";
import { setupRecording } from "../utils/recording-manager";
import { setupTimelapse } from "../utils/timelapse-manager";
export { requestRecording, setRequestRecording } from "../utils/recording-manager";
import ScrollBackButton from "./scroll-back-button";
import TextEditingOverlay from "./text-editing-overlay";
import RichTextEditingOverlay from "./rich-text-editing-overlay";
import TextEditorModal from "./text-editor-modal";
import type { RichTextSpan } from "../types";

const Canvas: Component = () => {

    // Auto-switch Active Layer based on Selection
    createEffect(() => {
        const selection = store.selection;
        if (selection.length > 0) {
            // Find element with highest layer order
            let topLayerId: string | null = null;
            let maxOrder = -Infinity;

            selection.forEach(id => {
                const el = store.elements.find(e => e.id === id);
                if (el) {
                    const layer = store.layers.find(l => l.id === el.layerId);
                    if (layer && layer.order > maxOrder) {
                        maxOrder = layer.order;
                        topLayerId = layer.id;
                    }
                }
            });

            if (topLayerId && topLayerId !== untrack(() => store.activeLayerId)) {
                setActiveLayer(topLayerId);
            }
        }
    });

    // Reactive Auto-Resize for property changes (fontSize, fontFamily, etc)
    createEffect(() => {
        if (!canvasRef) return;
        const ctx = canvasRef.getContext("2d");
        if (!ctx) return;
        const renderer = new CanvasRenderer(ctx);

        // We track font properties and text of selected elements
        store.elements.forEach(el => {
            const isLine = el.type === 'line' || el.type === 'arrow';

            // UML class: auto-grow only when NOT in fixed-size mode (no persisted section heights)
            if (el.type === 'umlClass' && store.selection.includes(el.id)) {
                el.fontSize; el.fontFamily; el.fontWeight; el.fontStyle;
                el.containerText; el.attributesText; el.methodsText;

                if (el.umlHeaderHeight === undefined && el.umlAttrHeight === undefined) {
                    const dims = fitUmlClassToContent(renderer, el);
                    if (dims.height > el.height + 2) {
                        untrack(() => updateElement(el.id, { height: dims.height }));
                    }
                }
            }
            // Regular shapes with autoResize
            else if (store.selection.includes(el.id) && el.autoResize && el.containerText && !isLine) {
                // Tracking these properties
                el.fontSize;
                el.fontFamily;
                el.fontWeight;
                el.fontStyle;
                el.containerText;

                const dims = fitShapeToText(renderer, el, el.containerText);
                if (Math.abs(dims.width - el.width) > 2 || Math.abs(dims.height - el.height) > 2) {
                    untrack(() => updateElement(el.id, {
                        width: dims.width,
                        height: dims.height
                    }));
                }
            }

            // NOTE: Auto-resize for standalone text elements is disabled
            // Text elements should have complete manual control like Excalidraw
            // Auto-height adjustment happens only via left/right middle handles in selection-handler.ts
        });
    });

    // Monitor Presentation Mode to force animation ticker
    createEffect(() => {
        if (store.appMode === 'presentation') {
            animationEngine.setForceTicker(true);
        } else {
            // Only disable if no flow animations (handled by store usually, but explicit here is safe)
            const hasFlow = store.elements.some(el => el.flowAnimation);
            animationEngine.setForceTicker(hasFlow);
        }
    });

    let canvasRef: HTMLCanvasElement | undefined;
    let rcInstance: ReturnType<typeof rough.canvas> | null = null;

    // Recording & thumbnail capture (effects created within this component's reactive scope)
    const { handleStopRecording } = setupRecording(() => canvasRef);

    // Time-lapse (process) recording — captures one frame per committed edit
    setupTimelapse();


    // Pointer handler shared mutable state
    const pState = createPointerState();

    // Text Editing State
    const [editingId, setEditingIdRaw] = createSignal<string | null>(null);
    // Text-editing DOM overlays (rich-text, UML section bounds, table-cell grids)
    // assume an axis-aligned layout and aren't rotation-correct yet, so block
    // *entering* edit while the canvas is rotated — clears (null) always pass.
    // One Shift+0 returns to upright. This is the deliberate scoped-mode boundary
    // (see docs/canvas-rotation-research.md).
    const setEditingId = (v: string | null) => {
        if (v && store.viewState.rotation) {
            showToast('Reset canvas rotation (Shift+0) to edit text', 'info', 1800);
            return;
        }
        setEditingIdRaw(v);
    };
    const [editingProperty, setEditingProperty] = createSignal<import("../utils/tool-handlers/text-editing-handler").EditingPropertyType>('containerText');
    const [editText, setEditText] = createSignal("");
    const [tableEditingCell, setTableEditingCell] = createSignal<import("../utils/tool-handlers/text-editing-handler").TableEditingCell | null>(null);
    const [tableCellSelectionSignal, setTableCellSelection] = createSignal<import("../types").TableCellSelection | null>(null);
    const [richTextSpans, setRichTextSpans] = createSignal<RichTextSpan[]>([]);
    const [expandedEditorOpen, setExpandedEditorOpen] = createSignal(false);
    let textInputRef: HTMLTextAreaElement | undefined;

    // Selection/Move State
    const [selectionBox, setSelectionBox] = createSignal<{ x: number, y: number, w: number, h: number } | null>(null);
    const [lassoPoints, setLassoPoints] = createSignal<{ x: number; y: number }[] | null>(null);
    const [suggestedBinding, setSuggestedBinding] = createSignal<{ elementId: string; px: number; py: number; position?: string } | null>(null);
    const [snappingGuides, setSnappingGuides] = createSignal<SnappingGuide[]>([]);
    const [spacingGuides, setSpacingGuides] = createSignal<SpacingGuide[]>([]);
    const [reparentDropTarget, setReparentDropTarget] = createSignal<string | null>(null);
    const [poolLaneDropTarget, setPoolLaneDropTarget] = createSignal<{ poolId: string; laneIndex: number } | null>(null);

    // Crop mode drag state (mutable, not reactive — same pattern as pState)
    let cropDragHandle: CropHandle = null;
    let cropDragStartX = 0;
    let cropDragStartY = 0;
    let cropDragStartRect: { x: number; y: number; width: number; height: number } | null = null;

    // Heuristic: PointerEvent.width/height on iPad Safari report the contact
    // area in CSS pixels. Apple Pencil's tip is ~1-2 px; finger ~25-40 px;
    // palm 50+ px. iPad sometimes reports a quick consecutive Pencil tap as
    // pointerType='touch' with the small Pencil-tip area — this distinguishes
    // a misclassified pen from real palm contact.
    const isPencilSizedTouch = (e: PointerEvent): boolean => {
        const w = (e as any).width;
        const h = (e as any).height;
        if (w == null || h == null) return false;
        return w > 0 && w <= 5 && h > 0 && h <= 5;
    };

    // Throttle constants
    const SNAPPING_THROTTLE_MS = 16; // ~60 FPS
    const LASER_THROTTLE_MS = 8; // ~120fps for smooth trail
    const LASER_DECAY_MS = 800;
    const LASER_MAX_POINTS = 100;
    const PEN_UPDATE_THROTTLE_MS = 16; // ~60fps store updates
    // Palm-rejection recency window: ignore palm-sized touch for this long after
    // the pen was last seen (covers the gap between fast strokes where iPadOS
    // hasn't yet re-suppressed the resting palm). Pencil-sized touches are
    // exempt so a misclassified Pencil tap still draws.
    const PEN_RECENT_MS = 500;

    const flushPenPoints = () => {
        if (!pState.currentId || pState.penPointsBuffer.length === 0) return;
        const el = store.elements.find(e => e.id === pState.currentId);
        if (el && el.points) {
            const existingPoints = el.points as number[];
            const newPoints = [...existingPoints, ...pState.penPointsBuffer];
            const updates: Partial<DrawingElement> = { points: newPoints };
            // Persist per-point pressure aligned 1:1 with points. Pad any
            // pre-existing points (e.g. the initial [0,0]) with a neutral value
            // so element.pressures stays the same length as the point list.
            if (pState.penPressureBuffer.length > 0) {
                const existingCount = existingPoints.length / 2;
                const prev = (el.pressures as number[] | undefined) ?? [];
                const padded = prev.length >= existingCount
                    ? prev.slice(0, existingCount)
                    : [...prev, ...Array(existingCount - prev.length).fill(0.5)];
                updates.pressures = [...padded, ...pState.penPressureBuffer];
            }
            // For ink tool, also update ttl
            if (el.type === 'ink') {
                updates.ttl = Date.now() + 3000;
                startInkCleanupIfNeeded();
            }
            updateElement(pState.currentId, updates, false);
            pState.penPointsBuffer = [];
            pState.penPressureBuffer = [];
        }
    };

    const handleResize = () => {
        if (canvasRef) {
            canvasRef.width = window.innerWidth;
            canvasRef.height = window.innerHeight;

            // Re-fit the slide to the new window size
            // (important after entering/exiting fullscreen and window resizes)
            if (store.docType === 'slides') {
                zoomToFitSlide();
                // Sometimes browsers need a tiny extra moment for layout to settle
                // after fullscreen or URL bar shifts
                setTimeout(zoomToFitSlide, 50);
            }

            draw();
        }
    };

    // Cursor Management
    const [cursor, setCursor] = createSignal<string>('default');

    // Context Menu State
    const [contextMenuOpen, setContextMenuOpen] = createSignal(false);
    const [contextMenuPos, setContextMenuPos] = createSignal({ x: 0, y: 0 });

    function draw() {
        if (!canvasRef) return;
        const ctx = canvasRef.getContext("2d");
        if (!ctx) return;

        const startTime = performance.now();
        const currentTime = effectiveTime();
        (window as any).yappyGlobalTime = currentTime;

        const { scale, panX, panY } = store.viewState;
        const isDarkMode = store.resolvedTheme === 'dark' || store.resolvedTheme === 'focus';
        if (!rcInstance) rcInstance = rough.canvas(canvasRef);
        const rc = rcInstance;
        const shouldAnimate = store.appMode === 'presentation' || store.isPreviewing;

        // 1. Compute viewport & animated states
        const vp = computeViewportBounds(canvasRef, scale, panX, panY);
        const elementsToAnimate = cullElementsForAnimation(store.elements, store.slides, store.layers, store.docType, store.activeSlideIndex, vp);
        const animatedStates = calculateAllAnimatedStates(elementsToAnimate, currentTime, shouldAnimate);

        // 2. Clear canvas & decay laser
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
        decayLaserTrail(pState.laserTrailData, LASER_DECAY_MS);

        // 3. Render backgrounds & grids
        renderWorkspaceBackground(ctx, canvasRef, store.resolvedTheme, store.docType, store.canvasBackgroundColor);
        renderSlideBoundaries(ctx, rc, store.slides, store.docType, store.activeSlideIndex, scale, panX, panY, store.resolvedTheme);
        renderCanvasTexture(ctx, canvasRef, store.canvasTexture, scale, panX, panY, isDarkMode);

        // 4. Enter world-space for elements
        ctx.save();
        // Canvas (view) rotation: spin everything in world-space about the
        // viewport centre. Applied OUTERMOST (before pan/scale) so the CTM is
        // Rot(θ,C)·translate(pan)·scale — matching the Rot(θ,C)·(world·scale+pan)
        // model that utils/viewport-transforms.ts inverts for hit-testing. Pivot
        // must stay in sync with viewportTransform()'s centreX/centreY.
        const viewRotation = store.viewState.rotation || 0;
        if (viewRotation) {
            const cx = canvasRef.width / 2;
            const cy = canvasRef.height / 2;
            ctx.translate(cx, cy);
            ctx.rotate(viewRotation);
            ctx.translate(-cx, -cy);
        }
        ctx.translate(panX, panY);
        ctx.scale(scale, scale);

        renderGrid(ctx, canvasRef, store.gridSettings, scale, panX, panY, isDarkMode);

        // 5. Compute focus branch set (for Focus Mode dimming)
        let focusBranchIds: Set<string> | null = null;
        if (store.focusBranchId) {
            const fSet = new Set<string>();
            // Add focused node
            fSet.add(store.focusBranchId);
            // Add all ancestors up to root
            let cur = store.elements.find(e => e.id === store.focusBranchId);
            while (cur?.parentId) {
                fSet.add(cur.parentId);
                cur = store.elements.find(e => e.id === cur!.parentId);
            }
            // Add all descendants (BFS)
            const queue = [store.focusBranchId];
            while (queue.length > 0) {
                const pid = queue.shift()!;
                for (const el of store.elements) {
                    if (el.parentId === pid && !fSet.has(el.id)) {
                        fSet.add(el.id);
                        queue.push(el.id);
                    }
                }
            }
            // Add connectors between focused nodes
            for (const el of store.elements) {
                if ((el.type === 'organicBranch' || el.type === 'arrow' || el.type === 'line' || el.type === 'bezier') &&
                    el.startBinding && el.endBinding &&
                    fSet.has(el.startBinding.elementId) && fSet.has(el.endBinding.elementId)) {
                    fSet.add(el.id);
                }
            }
            focusBranchIds = fSet;
        }

        // Render layers & elements
        const totalRendered = renderLayersAndElements(ctx, rc, {
            elements: store.elements, layers: store.layers, slides: store.slides,
            docType: store.docType, activeSlideIndex: store.activeSlideIndex,
            selection: store.selection, selectedTool: store.selectedTool,
            activeLayerId: store.activeLayerId,
            animatedStates, viewportBounds: vp, scale, isDarkMode,
            currentDrawingId: pState.currentId,
            hoveredConnector: pState.hoveredConnector,
            editingId: editingId(),
            canInteractWithElement,
            appMode: store.appMode,
            focusBranchIds,
        });

        // 6. Overlays
        renderSelectionOverlays(ctx, {
            elements: store.elements, selection: store.selection, scale,
            selectionBox: selectionBox(), lassoPoints: lassoPoints(),
            suggestedBinding: suggestedBinding(),
            snappingGuides: snappingGuides(), spacingGuides: spacingGuides(),
            tableCellSelection: tableCellSelectionSignal(),
            isDarkMode, appMode: store.appMode,
            reparentDropTarget: reparentDropTarget(),
            poolLaneDropTarget: poolLaneDropTarget(),
        });

        renderConnectionAnchors(ctx, {
            elements: store.elements, selectedTool: store.selectedTool,
            currentDrawingId: pState.currentId, isDrawing: pState.isDrawing,
            activeLayerId: store.activeLayerId, scale,
            canInteractWithElement,
        });

        renderLaserTrail(ctx, pState.laserTrailData, scale, LASER_DECAY_MS);

        // 7. Crop mode overlay
        if (store.cropModeElementId && store.cropRect) {
            const cropEl = store.elements.find(e => e.id === store.cropModeElementId);
            if (cropEl) {
                renderCropOverlay(ctx, cropEl, store.cropRect, scale);
            }
        }

        ctx.restore();

        perfMonitor.measureFrame(performance.now() - startTime, store.elements.length, totalRendered);
    }

    createEffect(() => {
        effectiveTime(); // Track global animation clock
        store.appMode; // Track mode changes explicitly
        store.isPreviewing; // Track preview state
        store.theme; // Track theme changes
        store.elements.length;
        // Coarse "something on an element changed" counter, bumped by
        // updateElement / addElement / deleteElements / etc. Replaces the
        // previous 80+ per-element property reads that ran on every store
        // mutation — at Apple Pencil's ~120 Hz, that iteration dominated
        // per-frame cost on iPad and produced visible stroke lag. A single
        // counter dep is O(1) and gives the same redraw triggering.
        store.dirtyRevision;
        // Track slide background changes for real-time updates
        store.slides.forEach(s => {
            s.backgroundColor; s.fillStyle; s.gradientStops; s.gradientDirection;
            s.backgroundImage; s.backgroundOpacity;
        });
        store.viewState.scale;
        store.viewState.panX;
        store.viewState.panY;
        store.viewState.rotation;
        store.selection.length;
        selectionBox();
        lassoPoints();
        tableCellSelectionSignal();
        // Note: pState.laserTrailData is mutable (not reactive) for performance
        // Track layer changes
        store.layers.length;
        store.layers.forEach(l => {
            l.visible; l.order; l.opacity; l.backgroundColor;
        });
        // Track artboard frames + the doc type and view modes that change how the
        // scene renders. These were previously only redrawn via bumpDirtyRevision,
        // so e.g. setDocType (which doesn't bump) left a stale canvas.
        store.docType;
        store.artboards.length;
        store.artboards.forEach(a => { a.x; a.y; a.width; a.height; a.background; });
        store.outlineView;
        store.trimView;
        store.globalSettings.bleed;
        // Track grid settings changes
        store.gridSettings.enabled;
        store.gridSettings.gridSize;
        store.gridSettings.gridColor;
        store.gridSettings.gridOpacity;
        store.gridSettings.style;
        store.canvasBackgroundColor;
        store.canvasTexture;
        store.theme;
        store.activeSlideIndex; // Track slide switches for redraw (e.g., after duplicateSlide)
        store.focusBranchId;
        // Crop mode
        store.cropModeElementId;
        store.cropRect;
        snappingGuides();
        // Redraw on reactive changes
        requestAnimationFrame(draw);
    });

    // Auto-refresh bound lines if bound elements move or hierarchy changes
    createEffect(() => {
        store.elements.forEach(el => {
            if (el.boundElements && el.boundElements.length > 0) {
                // Reactive trigger: track moving node's geometry
                el.x; el.y; el.width; el.height;
                untrack(() => {
                    el.boundElements?.forEach(b => refreshBoundLine(b.id));
                });
            }
        });
    });

    // The viewport transform for screen↔world conversions, including the
    // rotation pivot (viewport centre, in canvas-local px). Rotation is read
    // from store.viewState; when 0/undefined the helpers reduce to plain
    // pan/zoom math. Keep the pivot in sync with the render block below.
    const viewportTransform = () => ({
        scale: store.viewState.scale,
        panX: store.viewState.panX,
        panY: store.viewState.panY,
        rotation: store.viewState.rotation,
        centerX: canvasRef ? canvasRef.width / 2 : 0,
        centerY: canvasRef ? canvasRef.height / 2 : 0,
    });

    const getWorldCoordinates = (clientX: number, clientY: number) => {
        if (!canvasRef) return { x: 0, y: 0 };
        const rect = canvasRef.getBoundingClientRect();
        return screenToWorld(clientX - rect.left, clientY - rect.top, viewportTransform());
    };

    // Lazily-initialized wheel context for UML section scroll
    let _wheelMeasureCanvas: HTMLCanvasElement | null = null;
    const getWheelCtx = (): WheelContext => {
        if (!_wheelMeasureCanvas) _wheelMeasureCanvas = document.createElement('canvas');
        const ctx2d = _wheelMeasureCanvas.getContext('2d')!;
        return { getWorldCoordinates, renderer: new CanvasRenderer(ctx2d) };
    };

    const onWheel = (e: WheelEvent) => handleWheel(e, getWheelCtx());

    // Helper: Normalize pencil points to be relative to bounding box
    const normalizePencil = (el: DrawingElement) => {
        if (!el.points || el.points.length === 0) return null;

        const pts = normalizePoints(el.points);
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        pts.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });

        const newWidth = maxX - minX;
        const newHeight = maxY - minY;

        // Pad slightly? No, exact bounds.
        const newPoints = pts.map(p => ({ x: p.x - minX, y: p.y - minY }));

        return {
            x: el.x + minX,
            y: el.y + minY,
            width: newWidth,
            height: newHeight,
            points: newPoints,
            // newPoints is an {x,y} object array — clear the stale 'flat' flag so
            // resize / SVG export / clone (which branch on pointsEncoding) don't
            // treat these objects as a flat number[] (→ NaN coords → invisible).
            pointsEncoding: undefined,
        };
    };


    /**
     * Return element with projected position if it's on a master layer in slides mode.
     * Used to make hit testing match the rendered (projected) position.
     */
    const applyMasterProjection = (el: DrawingElement): DrawingElement => {
        if (store.docType !== 'slides') return el;
        const layer = store.layers.find(l => l.id === el.layerId);
        if (!layer?.isMaster) return el;
        const activeSlide = store.slides[store.activeSlideIndex];
        if (!activeSlide) return el;
        const projected = projectMasterPosition(el, activeSlide, store.slides);
        return { ...el, x: projected.x, y: projected.y };
    };

    const canInteractWithElement = (el: DrawingElement): boolean => {
        if (el.locked) return false;
        return !isLayerLocked(el.layerId);
    };

    // Binding helpers — thin wrappers closing over store
    const checkBinding = (x: number, y: number, excludeId: string) =>
        checkBindingUtil(x, y, excludeId, store.elements, store.viewState.scale, store.activeLayerId, canInteractWithElement);

    const refreshLinePoints = (line: DrawingElement, overrideStartX?: number, overrideStartY?: number, overrideEndX?: number, overrideEndY?: number) =>
        refreshLinePointsUtil(line, store.elements, overrideStartX, overrideStartY, overrideEndX, overrideEndY);

    const refreshBoundLine = (lineId: string) =>
        refreshBoundLineUtil(lineId, () => store.elements, updateElement);

    // Helpers & signals bundles for extracted handler modules
    const textEditCtx: TextEditingContext = {
        editingId, setEditingId, editingProperty, setEditingProperty,
        editText, setEditText,
        richTextSpans, setRichTextSpans,
        tableEditingCell, setTableEditingCell,
        get textInputRef() { return textInputRef; },
        get canvasRef() { return canvasRef; },
        getWorldCoordinates, canInteractWithElement, applyMasterProjection,
        redrawFn: draw
    };

    const canvasEventCtx: CanvasEventContext = {
        getWorldCoordinates, canInteractWithElement, applyMasterProjection
    };

    const commitText = () => {
        // Route to rich text commit when rich text editing is active
        if (richTextSpans().length > 0) {
            commitRichTextHandler(textEditCtx);
        } else {
            commitTextHandler(textEditCtx);
        }
    };
    const commitRichText = () => commitRichTextHandler(textEditCtx);

    const pHelpers: import("../utils/pointer-helpers").PointerHelpers = {
        getWorldCoordinates, canInteractWithElement, checkBinding,
        refreshLinePoints, refreshBoundLine, flushPenPoints,
        applyMasterProjection, normalizePencil, commitText,
        draw, setCursor, setTableCellSelection
    };
    const pSignals: import("../utils/pointer-helpers").PointerSignals = {
        editingId, setEditingId, setEditText, setRichTextSpans,
        selectionBox, setSelectionBox,
        lassoPoints, setLassoPoints,
        suggestedBinding, setSuggestedBinding,
        snappingGuides, setSnappingGuides,
        spacingGuides, setSpacingGuides,
        reparentDropTarget, setReparentDropTarget,
        poolLaneDropTarget, setPoolLaneDropTarget,
        get textInputRef() { return textInputRef; }
    };

    // True while a TouchEvent is driving a pen-tool stroke. iPad Safari's
    // PointerEvent delivery for Apple Pencil is unreliable on rapid lift +
    // recontact (alternate strokes get dropped); TouchEvents are reliable.
    // For pen-drawing tools we bind both event families and let TouchEvents
    // win when both fire — this flag lets pointer handlers skip cleanly.
    let touchDrivingPenStroke = false;
    let activeTouchIdentifier = -1; // identifier of the Touch we're tracking
    const isPenDrawingTool = (): boolean => {
        const t = store.selectedTool;
        return t === 'fineliner' || t === 'inkbrush' || t === 'marker' || t === 'ink';
    };

    // When palm + pen are both on the screen, `e.touches` has length 2. We need
    // to pick the stylus touch specifically — Apple Pencil reports
    // `touchType: 'stylus'`, finger reports `'direct'`. If `touchType` isn't
    // set (older devices/contexts), fall back to the first changedTouch.
    const pickStylusTouch = (e: TouchEvent): Touch | null => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if ((t as any).touchType === 'stylus') return t;
        }
        return e.changedTouches[0] ?? null;
    };

    const findTouchById = (e: TouchEvent, id: number): Touch | null => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === id) return e.changedTouches[i];
        }
        return null;
    };

    // Force-finalize the current touch-driven stroke. Always safe to call.
    const finalizeTouchStroke = () => {
        cancelShapeHold();
        if (!touchDrivingPenStroke && !pState.isDrawing) return;
        try {
            flushPenPoints();
            drawOnUp(pState, pHelpers, pSignals);
        } catch { /* noop */ }
        touchDrivingPenStroke = false;
        activeTouchIdentifier = -1;
        // drawOnUp already clears these, but be defensive — a stuck flag is
        // exactly what blocks the next stroke from starting.
        pState.isDrawing = false;
        pState.currentId = null;
    };

    // ─── Smart shape (hold-to-correct) ──────────────────────────────────
    // While drawing with a pen tool, dwelling (holding the tip nearly still)
    // for HOLD_MS snaps the freehand stroke to a clean primitive — like
    // happypaint's quick-shape. The recognizer is JS-only and runs once per
    // dwell, not on the per-point path.
    const SHAPE_HOLD_MS = 600;
    const SHAPE_MOVE_EPS = 4; // CSS px dead-zone for pen jitter while holding
    let shapeHoldTimer: ReturnType<typeof setTimeout> | null = null;
    let shapeHoldId: string | null = null;
    let shapeLastClient: { x: number; y: number } | null = null;
    // After a successful snap the pen is usually still in contact; this blocks
    // the heal-on-move paths from immediately opening a fresh stroke until the
    // pen actually lifts (touchend / pointerup).
    let smartShapeSuppress = false;

    const smartShapeEnabled = () =>
        store.globalSettings.smartShape !== false &&
        (store.selectedTool === 'fineliner' || store.selectedTool === 'inkbrush' || store.selectedTool === 'marker');

    const cancelShapeHold = () => {
        if (shapeHoldTimer !== null) { clearTimeout(shapeHoldTimer); shapeHoldTimer = null; }
        shapeHoldId = null;
        shapeLastClient = null;
    };

    // Reset all stroke state without re-running pen normalization (used after a
    // smart-shape conversion, which has already set the element's geometry).
    const resetActiveStroke = () => {
        touchDrivingPenStroke = false;
        activeTouchIdentifier = -1;
        pState.isDrawing = false;
        pState.currentId = null;
        pState.penPointsBuffer = [];
        pState.penPressureBuffer = [];
        pState.penUpdatePending = false;
        pState.stabilizer = null;
    };

    const fireShapeHold = () => {
        shapeHoldTimer = null;
        const id = shapeHoldId;
        cancelShapeHold();
        if (!id || pState.currentId !== id || !pState.isDrawing) return;
        if (!smartShapeEnabled()) return;
        flushPenPoints();
        const el = store.elements.find(e => e.id === id);
        if (!el || !el.points || el.points.length < 6) return;
        const pts = normalizePoints(el.points);
        const shape = recognizeStrokeShape(pts);
        if (!shape) return; // ambiguous — keep the freehand ink

        const clearStroke = {
            points: undefined, pointsEncoding: undefined,
            pressures: undefined, smoothing: undefined,
        } as Partial<DrawingElement>;

        if (shape.kind === 'line') {
            const minX = Math.min(shape.a.x, shape.b.x);
            const minY = Math.min(shape.a.y, shape.b.y);
            const maxX = Math.max(shape.a.x, shape.b.x);
            const maxY = Math.max(shape.a.y, shape.b.y);
            updateElement(id, {
                type: 'line', curveType: 'straight',
                x: el.x + minX, y: el.y + minY,
                width: maxX - minX, height: maxY - minY,
                points: [{ x: shape.a.x - minX, y: shape.a.y - minY }, { x: shape.b.x - minX, y: shape.b.y - minY }],
                pointsEncoding: undefined, pressures: undefined, smoothing: undefined,
            });
        } else {
            const typeMap = { rect: 'rectangle', ellipse: 'circle', triangle: 'triangle', diamond: 'diamond' } as const;
            updateElement(id, {
                type: typeMap[shape.kind],
                x: el.x + shape.minX, y: el.y + shape.minY,
                width: shape.maxX - shape.minX, height: shape.maxY - shape.minY,
                strokeStyle: 'solid',
                ...clearStroke,
            });
        }

        // End the stroke and present the corrected shape selected for editing.
        if (touchDrivingPenStroke) smartShapeSuppress = true;
        resetActiveStroke();
        setStore('selection', [id]);
        setSelectedTool('selection');
        draw();
    };

    const armShapeHold = (id: string | null) => {
        cancelShapeHold();
        if (!id || !smartShapeEnabled()) return;
        shapeHoldId = id;
        shapeLastClient = null;
        shapeHoldTimer = setTimeout(fireShapeHold, SHAPE_HOLD_MS);
    };

    const noteShapeMove = (clientX: number, clientY: number) => {
        if (shapeHoldId === null) return;
        if (shapeLastClient === null) { shapeLastClient = { x: clientX, y: clientY }; return; }
        if (Math.hypot(clientX - shapeLastClient.x, clientY - shapeLastClient.y) < SHAPE_MOVE_EPS) return;
        // Moved beyond jitter — restart the dwell timer from here.
        shapeLastClient = { x: clientX, y: clientY };
        if (shapeHoldTimer !== null) clearTimeout(shapeHoldTimer);
        shapeHoldTimer = setTimeout(fireShapeHold, SHAPE_HOLD_MS);
    };

    const smartShape = { arm: armShapeHold, note: noteShapeMove, cancel: cancelShapeHold };

    // Begin a touch-driven pen stroke for the given stylus Touch. Returns true
    // if a stroke actually started (false if the active layer is hidden/locked).
    // Shared by handleTouchStart and the heal-on-move path so both set up the
    // stroke identically.
    const beginTouchPenStroke = (t: Touch): boolean => {
        activeTouchIdentifier = t.identifier;
        touchDrivingPenStroke = true;
        pState.penUpdatePending = false;
        pState.penPointsBuffer = [];
        pState.penPressureBuffer = [];
        const { x, y } = getWorldCoordinates(t.clientX, t.clientY);
        // Layer-visibility / lock checks mirror handlePointerDown's guards.
        const activeLayer = store.layers.find(l => l.id === store.activeLayerId);
        if (!activeLayer?.visible || activeLayer?.locked) {
            touchDrivingPenStroke = false;
            activeTouchIdentifier = -1;
            return false;
        }
        drawOnDown(x, y, pState, pHelpers);
        smartShape.arm(pState.currentId);
        draw();
        return true;
    };

    const handleTouchStart = (e: TouchEvent) => {
        if (store.appMode === 'embed') return;
        // 2-finger gesture owns the canvas; pen stroke must not start.
        if (gestureActive || gestureCooldown) return;
        if (pickFingerTouches(e).length >= 2) return;
        if (!isPenDrawingTool()) return;
        // Palm rejection: a finger/palm landing while the Apple Pencil is mid
        // stroke arrives as a touchstart with no 'stylus' touch. Ignore it
        // rather than finalizing — otherwise resting your hand cuts the stroke
        // short. (iPadOS also rejects palm at the system level when a Pencil is
        // paired; this is the in-app safety net for unpaired / edge cases.)
        const hasStylus = Array.from(e.changedTouches).some(
            t => (t as { touchType?: string }).touchType === 'stylus'
        );
        if (touchDrivingPenStroke && !hasStylus) { e.preventDefault(); return; }
        // Self-heal: if a previous stroke is somehow still in flight (touchend
        // was missed, fired out of order, or its changedTouches didn't carry
        // our tracked identifier on iPad), finalize it before starting the
        // new one. Without this, a stuck `pState.isDrawing=true` blocks every
        // subsequent stroke — exactly the alternate-empty-stroke pattern the
        // user kept seeing.
        if (touchDrivingPenStroke || pState.isDrawing) {
            finalizeTouchStroke();
        }
        const t = pickStylusTouch(e);
        if (!t) return;
        smartShapeSuppress = false; // fresh deliberate stroke
        e.preventDefault();
        beginTouchPenStroke(t);
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (gestureActive) return;
        if (!touchDrivingPenStroke) {
            // A smart-shape snap just ended this stroke while the pen is still
            // on the glass — swallow moves until the pen lifts so we don't
            // immediately heal a brand-new stroke out of the trailing contact.
            if (smartShapeSuppress) { e.preventDefault(); return; }
            // Heal a DROPPED touchstart: iPadOS Safari drops touchstart (and
            // pointerdown) on fast Apple Pencil taps, so the first event we see
            // for a stroke can be a move. Without this, that whole stroke is
            // lost — the "alternate strokes go missing" pattern. Begin the
            // stroke here from the stylus's current position instead.
            //
            // Guards mirror handleTouchStart so we never start a phantom
            // stroke: no active/cooling gesture, a pen-drawing tool, not a
            // 2-finger contact, and a REAL stylus touch (touchType 'stylus') —
            // the fallback-to-finger of pickStylusTouch is intentionally
            // excluded here so a resting finger jiggling after a legit touchend
            // can't re-open a stroke.
            if (gestureCooldown) return;
            if (!isPenDrawingTool()) return;
            if (pickFingerTouches(e).length >= 2) return;
            const st = pickStylusTouch(e);
            if (!st || (st as { touchType?: string }).touchType !== 'stylus') return;
            if (pState.isDrawing) finalizeTouchStroke();
            e.preventDefault();
            beginTouchPenStroke(st);
            return; // stroke started at this point; subsequent moves extend it
        }
        // Only react to the move of OUR tracked touch — palm shifting fires
        // touchmove events too, and we don't want them adding points.
        const t = findTouchById(e, activeTouchIdentifier);
        if (!t) return;
        e.preventDefault();
        const { x: ex, y: ey } = getWorldCoordinates(t.clientX, t.clientY);
        // Apple Pencil reports tip force in touch.force (0–1). Capture it when
        // pressure mode is on so inkbrush width can follow it. Finger touches
        // report 0 → neutral 0.5 (constant width). Route through the stabilizer
        // so the pulled-string lazy-brush applies on the iPad touch path too.
        let pressure: number | null = null;
        if (store.globalSettings.penPressure !== false) {
            const f = (t as Touch & { force?: number }).force;
            pressure = f && f > 0 ? f : 0.5;
        }
        pushStabilizedSample(pState, ex - pState.startX, ey - pState.startY, pressure);
        smartShape.note(t.clientX, t.clientY);
        // Sync flush + sync draw — match the reference demo's latency profile.
        // With v0.27.12's O(1) reactive cascade this fits inside a frame at
        // typical doc sizes; the compositor picks up the canvas at next vsync.
        flushPenPoints();
        draw();
    };

    const handleTouchEnd = (e: TouchEvent) => {
        if (gestureActive) return;
        // Pen lifted — clear the post-snap suppression regardless of stroke state.
        smartShapeSuppress = false;
        if (!touchDrivingPenStroke) { cancelShapeHold(); return; }
        // Always finalize on touchend when we're driving a stroke. The
        // previous "find tracked touch in changedTouches" gate was dropping
        // legitimate ends on iPad when the changedTouches list didn't carry
        // our identifier, leaving the stroke stuck and blocking the next one.
        // System-level palm rejection means non-pen touches don't reach us
        // when an Apple Pencil is paired, so this is safe.
        e.preventDefault();
        finalizeTouchStroke();
        draw();
    };

    // ─── Two-finger pan + pinch-zoom (iPad / touch) ──────────────────────
    // When two fingers land on the canvas, we take over for the duration of
    // the gesture: pan by the centroid delta, zoom by the pinch distance
    // ratio (centered on the centroid). Coexists with single-finger pen
    // drawing by hard-cancelling any in-flight stroke or pointer drag the
    // moment a 2nd finger touches down.
    let gestureActive = false;
    let gestureLastDist = 0;
    let gestureLastCx = 0;
    let gestureLastCy = 0;
    let gestureLastAngle = 0;       // finger-vector angle (rad) at the last frame
    let gRotActive = false;         // canvas rotation broke past the deadzone
    let gRotAccum = 0;              // cumulative raw finger rotation (for deadzone)
    // After a gesture ends with fingers still down, block any
    // single-finger interaction (pen stroke, pointer drag) until ALL
    // fingers lift. Otherwise the leftover finger immediately starts a
    // stray stroke at gesture-release.
    let gestureCooldown = false;

    // ─── Procreate-style multi-finger gesture vocabulary ─────────────────
    // Layered on top of the 2-finger pan/zoom above. We DON'T commit to
    // panning until a finger crosses TAP_SLOP, so a quick multi-finger tap
    // (which moves <slop) is recognised as a discrete command instead of
    // nudging the canvas. Mapping (matches HappyPaint / Procreate):
    //   two-finger tap          → undo  (hold still → repeat undo)
    //   three-finger tap        → redo
    //   four-finger tap         → toggle zen mode (hide chrome)
    //   three-finger swipe ↓    → copy selection
    //   quick pinch-in flick    → zoom to fit
    const TAP_MAX_MS = 350;
    const TAP_SLOP = 14;            // px of finger travel that disqualifies a tap
    const SWIPE_DOWN_DIST = 60;     // px downward for a 3-finger swipe
    const QUICK_PINCH_MS = 320;     // a pinch-in faster than this …
    const QUICK_PINCH_SCALE = 0.6;  // … and below this cumulative scale = fit
    const ROT_DEADZONE_RAD = (5 * Math.PI) / 180; // twist past 5° to start rotating
    const ROT_END_SNAP_RAD = (3 * Math.PI) / 180; // settle to upright within ±3°
    const UNDO_REPEAT_DELAY_MS = 600;
    const UNDO_REPEAT_MS = 150;

    let gStartT = 0;                // gesture start time (ms, event timeStamp)
    let gMaxFingers = 0;            // most simultaneous fingers seen this gesture
    let gFingerCount = 0;           // fingers as of the last move
    let gMoved = false;             // travelled past TAP_SLOP → not a tap
    let gCommitted = false;         // committed to pan/zoom transform
    let gSwipeFired = false;        // 3-finger swipe already triggered
    let gCumScale = 1;              // cumulative pinch scale while committed
    const gStarts = new Map<number, { x: number; y: number }>(); // touch id → start
    let gUndoRepeatTimer: number | null = null;
    let gUndoRepeatInterval: number | null = null;

    const clearUndoRepeat = () => {
        if (gUndoRepeatTimer !== null) { clearTimeout(gUndoRepeatTimer); gUndoRepeatTimer = null; }
        if (gUndoRepeatInterval !== null) { clearInterval(gUndoRepeatInterval); gUndoRepeatInterval = null; }
    };

    // All current finger contacts (stylus excluded), uncapped — the 2-finger
    // pickFingerTouches() above stops at 2, but tap/swipe need 3–4.
    const allFingerTouches = (e: TouchEvent): Touch[] => {
        const fingers: Touch[] = [];
        for (let i = 0; i < e.touches.length; i++) {
            const t = e.touches[i];
            if ((t as { touchType?: string }).touchType !== 'stylus') fingers.push(t);
        }
        return fingers;
    };

    const fitView = () => { store.docType === 'slides' ? zoomToFitSlide() : zoomToFit(); };

    // Two fingers held stationary keep undoing (Procreate). Armed on a 2-finger
    // start; fires only if the gesture stays a still, uncommitted 2-finger hold.
    const armUndoRepeat = () => {
        clearUndoRepeat();
        gUndoRepeatTimer = window.setTimeout(() => {
            gUndoRepeatTimer = null;
            if (!gestureActive || gMoved || gCommitted || gMaxFingers !== 2) return;
            gMoved = true; // the release must not fire another tap-undo
            undo();
            gUndoRepeatInterval = window.setInterval(() => {
                if (!gestureActive || gMaxFingers !== 2) { clearUndoRepeat(); return; }
                undo();
            }, UNDO_REPEAT_MS);
        }, UNDO_REPEAT_DELAY_MS);
    };

    // Count contacts that are fingers (not stylus). Used so an Apple Pencil
    // contact + palm rest doesn't get mistaken for a 2-finger gesture.
    const pickFingerTouches = (e: TouchEvent): Touch[] => {
        const fingers: Touch[] = [];
        for (let i = 0; i < e.touches.length; i++) {
            const t = e.touches[i];
            if ((t as any).touchType !== 'stylus') {
                fingers.push(t);
                if (fingers.length === 2) break;
            }
        }
        return fingers;
    };

    const twoFingerMetrics = (e: TouchEvent) => {
        const f = pickFingerTouches(e);
        if (f.length < 2) return null;
        const t0 = f[0];
        const t1 = f[1];
        const cx = (t0.clientX + t1.clientX) / 2;
        const cy = (t0.clientY + t1.clientY) / 2;
        const dx = t0.clientX - t1.clientX;
        const dy = t0.clientY - t1.clientY;
        return { cx, cy, dist: Math.hypot(dx, dy), angle: Math.atan2(dy, dx) };
    };

    // Hard-cancel any in-flight pointer/touch interaction so it doesn't
    // leak through into the gesture. Discards the in-progress draft
    // element (typical case with a pen-drawing tool active: 1st finger's
    // touchstart already created a stroke element via drawOnDown; 2nd
    // finger lands ~50ms later and we want that stroke gone). Does NOT
    // undo moves of pre-existing elements being dragged — leaving them
    // at the current cursor position is acceptable.
    const cancelInflightForGesture = () => {
        // Capture the draft id BEFORE any finalize call clears it.
        const draftId = pState.currentId;
        const wasDrawing = pState.isDrawing || touchDrivingPenStroke;
        const wasDragging = pState.isDragging;

        if (touchDrivingPenStroke || pState.isDrawing) {
            try { finalizeTouchStroke(); } catch { /* noop */ }
        }
        // Delete the just-created draft element (drawing only — not drag).
        // No pushToHistory: the user never intended to draw.
        if (draftId && wasDrawing && !wasDragging) {
            setStore("elements", arr => arr.filter(el => el.id !== draftId));
        }

        pState.isDrawing = false;
        pState.isDragging = false;
        pState.isSelecting = false;
        pState.currentId = null;
        pState.draggingHandle = null;
        pState.draggingFromConnector = null;
        pState.hoveredConnector = null;
        pState.initialPositions.clear();
        pState.stabilizer = null;
    };

    const beginGesture = (e: TouchEvent) => {
        const m = twoFingerMetrics(e);
        if (!m) return;
        cancelInflightForGesture();
        gestureLastDist = m.dist;
        gestureLastCx = m.cx;
        gestureLastCy = m.cy;
        gestureLastAngle = m.angle;
        gRotActive = false;
        gRotAccum = 0;
        gestureActive = true;
        // Reset multi-finger recognition state for this gesture.
        const fingers = allFingerTouches(e);
        gStartT = e.timeStamp;
        gMaxFingers = fingers.length;
        gFingerCount = fingers.length;
        gMoved = false;
        gCommitted = false;
        gSwipeFired = false;
        gCumScale = 1;
        gStarts.clear();
        for (const t of fingers) gStarts.set(t.identifier, { x: t.clientX, y: t.clientY });
        if (fingers.length === 2) armUndoRepeat();
    };

    const updateGesture = (e: TouchEvent) => {
        if (!canvasRef) return;
        const m = twoFingerMetrics(e);
        if (!m) return;
        const rect = canvasRef.getBoundingClientRect();
        const vp = viewportTransform();
        const cx = vp.centerX;
        const cy = vp.centerY;

        // Pinch: scale ratio per-frame. Guard against zero/near-zero start dist.
        const ratio = gestureLastDist > 1 ? m.dist / gestureLastDist : 1;
        gCumScale *= ratio;
        const newScale = Math.min(Math.max(vp.scale * ratio, 0.1), 10);

        // Twist → canvas rotation. Accumulate the raw finger-vector rotation and
        // only engage past a deadzone, so a pure pinch/pan doesn't drift. Once
        // engaged, apply 1:1 from the break point (no sudden jump).
        gRotAccum += normalizeRotation(m.angle - gestureLastAngle);
        let newRot = vp.rotation || 0;
        if (!gRotActive && Math.abs(gRotAccum) > ROT_DEADZONE_RAD) {
            gRotActive = true;
            newRot += gRotAccum - Math.sign(gRotAccum) * ROT_DEADZONE_RAD;
        } else if (gRotActive) {
            newRot += normalizeRotation(m.angle - gestureLastAngle);
        }
        newRot = normalizeRotation(newRot);

        // Keep the world point under the previous centroid pinned under the
        // current centroid, across the new scale AND rotation. Solve pan from
        // the inverse render transform: screen = Rot(θ,C)·(world·scale + pan),
        // so pan = Rot(θ,C)⁻¹(centroidNow) − world·scale.
        const prevX = gestureLastCx - rect.left;
        const prevY = gestureLastCy - rect.top;
        const { x: worldX, y: worldY } = screenToWorld(prevX, prevY, vp);
        const curX = (m.cx - rect.left) - cx;
        const curY = (m.cy - rect.top) - cy;
        const cos = Math.cos(-newRot);
        const sin = Math.sin(-newRot);
        const unrotX = cx + (curX * cos - curY * sin);
        const unrotY = cy + (curX * sin + curY * cos);
        const newPanX = unrotX - worldX * newScale;
        const newPanY = unrotY - worldY * newScale;

        setViewState({ scale: newScale, panX: newPanX, panY: newPanY, rotation: newRot });

        gestureLastDist = m.dist;
        gestureLastCx = m.cx;
        gestureLastCy = m.cy;
        gestureLastAngle = m.angle;
    };

    const endGesture = () => {
        gestureActive = false;
        gFingerCount = 0;
        clearUndoRepeat();
    };

    // Fire a discrete multi-finger tap command (no canvas movement).
    const fireTap = (fingers: number) => {
        if (fingers === 2) { undo(); showToast('Undo', 'info', 900); }
        else if (fingers === 3) { redo(); showToast('Redo', 'info', 900); }
        else if (fingers >= 4) { toggleZenMode(); }
    };

    const handleTouchStartGesture = (e: TouchEvent) => {
        // Fires before the pen-drawing touchstart handler (registered
        // first). When 2+ FINGERS are on the canvas (stylus contacts
        // excluded), we own the gesture — even if finger 1's touchstart
        // already started a pen stroke a moment ago. cancelInflightForGesture
        // (via beginGesture) discards the stray stroke.
        if (store.appMode === 'embed') return;
        const fingers = allFingerTouches(e);
        if (fingers.length >= 2) {
            e.preventDefault();
            if (!gestureActive) {
                beginGesture(e);
            } else {
                // Another finger joined an active gesture (e.g. 2→3 for redo).
                // Track the higher count and the new finger's start position; a
                // 3rd/4th finger also cancels the held-undo repeat.
                if (fingers.length > gMaxFingers) gMaxFingers = fingers.length;
                if (gMaxFingers !== 2) clearUndoRepeat();
                for (const t of fingers) {
                    if (!gStarts.has(t.identifier)) gStarts.set(t.identifier, { x: t.clientX, y: t.clientY });
                }
            }
        }
    };

    const handleTouchMoveGesture = (e: TouchEvent) => {
        if (!gestureActive) return;
        const fingers = allFingerTouches(e);
        const count = fingers.length;
        if (count < 2) return; // a single leftover finger: wait for it to lift
        e.preventDefault();

        // How far has any finger drifted from where it landed?
        let maxMove = 0;
        for (const t of fingers) {
            const s = gStarts.get(t.identifier);
            if (s) maxMove = Math.max(maxMove, Math.hypot(t.clientX - s.x, t.clientY - s.y));
        }
        if (maxMove > TAP_SLOP && !gMoved) { gMoved = true; clearUndoRepeat(); }

        // Three-finger swipe down → copy. Detected before we commit to panning.
        if (count >= 3 && !gSwipeFired && !gCommitted) {
            const allDown = fingers.every(t => {
                const s = gStarts.get(t.identifier);
                return !!s && (t.clientY - s.y) > SWIPE_DOWN_DIST && Math.abs(t.clientX - s.x) < SWIPE_DOWN_DIST;
            });
            if (allDown) {
                gSwipeFired = true;
                gMoved = true; // disqualify the tap
                clearUndoRepeat();
                void copyToClipboard();
                showToast('Copied', 'info', 900);
                return;
            }
        }

        // Pan/zoom only with exactly two fingers — 3+ fingers are reserved for
        // discrete commands (Procreate: 2 = navigate, 3+ = actions).
        if (count !== 2) { gFingerCount = count; return; }

        // Re-baseline when transitioning back to two fingers so the pan doesn't
        // jump by the centroid shift that happened while a 3rd finger was down.
        if (gFingerCount !== 2) {
            const m = twoFingerMetrics(e);
            if (m) { gestureLastDist = m.dist; gestureLastCx = m.cx; gestureLastCy = m.cy; gestureLastAngle = m.angle; }
            gFingerCount = 2;
            return;
        }
        gFingerCount = 2;

        if (!gCommitted) {
            if (maxMove <= TAP_SLOP) return; // still could be a tap — don't move
            // Commit to navigation; re-baseline to avoid a jump on first frame.
            gCommitted = true;
            const m = twoFingerMetrics(e);
            if (m) { gestureLastDist = m.dist; gestureLastCx = m.cx; gestureLastCy = m.cy; gestureLastAngle = m.angle; }
            return;
        }
        updateGesture(e);
    };

    const handleTouchEndGesture = (e: TouchEvent) => {
        if (!gestureActive) {
            if (e.touches.length === 0) gestureCooldown = false;
            return;
        }
        // Drop the lifted touches from our start tracking.
        for (let i = 0; i < e.changedTouches.length; i++) {
            gStarts.delete(e.changedTouches[i].identifier);
        }

        if (e.touches.length === 0) {
            // All contacts gone — finalize. A still, quick gesture is a tap;
            // otherwise a fast pinch-in becomes zoom-to-fit.
            e.preventDefault();
            const dur = e.timeStamp - gStartT;
            const cancelled = e.type === 'touchcancel';
            if (cancelled) {
                // System aborted the gesture — don't fire any command.
            } else if (!gMoved && !gSwipeFired && dur <= TAP_MAX_MS + 120) {
                fireTap(gMaxFingers);
            } else if (gCommitted && dur < QUICK_PINCH_MS && gCumScale < QUICK_PINCH_SCALE) {
                fitView();
                showToast('Fit to screen', 'info', 900);
            }
            // Settle a barely-twisted canvas back to upright so a near-zero
            // rotation doesn't linger after the fingers lift.
            if (gRotActive && Math.abs(store.viewState.rotation || 0) < ROT_END_SNAP_RAD) {
                resetRotation();
            }
            endGesture();
            gestureCooldown = false;
        } else {
            // Some contacts remain. Keep the gesture alive (so the final tap can
            // still be decided and a leftover finger can't start a stroke), but
            // block single-finger drawing until everything lifts.
            e.preventDefault();
            gestureCooldown = true;
        }
    };

    const handlePointerDown = (e: PointerEvent) => {
        if (store.appMode === 'embed') return;
        // TouchEvent path is handling this stroke — skip pointer duplicate.
        if (touchDrivingPenStroke) return;
        // 2-finger gesture in progress (or cooling down with a finger still
        // resting on the canvas) — don't let synthetic touch-pointers drive
        // the tool. Only touch-derived pointers are blocked; mouse + pen
        // continue to work (e.g. user palms while pinching with stylus).
        if ((gestureActive || gestureCooldown) && e.pointerType === 'touch') return;

        // Eyedropper armed: the next click copies the clicked object's style to
        // the armed targets (then disarms). Consumes the click.
        if (store.eyedropper.active) {
            e.preventDefault();
            const { x: wx, y: wy } = getWorldCoordinates(e.clientX, e.clientY);
            const threshold = 6 / store.viewState.scale;
            const emap = new Map<string, DrawingElement>();
            for (const el of store.elements) emap.set(el.id, el);
            let hit: DrawingElement | null = null;
            for (let i = store.elements.length - 1; i >= 0; i--) {
                const el = store.elements[i];
                if (hitTestElement(el, wx, wy, threshold, store.elements, emap)) { hit = el; break; }
            }
            if (hit) applyEyedropperFrom(hit.id, e.shiftKey); else cancelEyedropper();
            requestAnimationFrame(draw);
            return;
        }

        // Palm rejection (iPad / Apple Pencil): only block touch while a pen is
        // CURRENTLY in contact. The previous "pen recent (700ms)" window was
        // dropping legitimate Apple Pencil pointerdowns between fast strokes —
        // iPad Safari sometimes ships the next stroke's down as a misclassified
        // touch event, and the 700ms window blocked it. Without the window,
        // every Pencil-down between strokes lands; only palm contact during an
        // ongoing pen stroke is filtered. iPadOS also does its own system-level
        // palm rejection when Apple Pencil is paired, so this is a safety net,
        // not the primary defense.
        if (e.pointerType === 'pen') {
            pState.activePenPointerId = e.pointerId;
            pState.lastPenInputAt = Date.now();
            smartShapeSuppress = false; // a fresh pen-down starts a new stroke
        } else if (e.pointerType === 'touch') {
            const penActive = pState.activePenPointerId !== null
                || (Date.now() - pState.lastPenInputAt) < PEN_RECENT_MS;
            if (penActive && !isPencilSizedTouch(e)) return;
        }
        pState.lastPointerType = (e.pointerType as 'mouse' | 'pen' | 'touch') || null;

        // Reset RAF flush flag in case a previous stroke's RAF didn't fire by
        // the time this stroke starts. Prevents the new stroke's pointermoves
        // from skipping their flush schedule.
        pState.penUpdatePending = false;
        pState.penPointsBuffer = [];

        if (presentationOnDown(e, pState, pHelpers)) return;
        // setPointerCapture can throw InvalidStateError on iPad when the
        // previous pointer hasn't been fully released. Don't let that abort
        // the rest of handlePointerDown — drawOnDown still needs to run.
        try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* noop */ }
        const { x, y } = getWorldCoordinates(e.clientX, e.clientY);

        // Crop mode interception
        if (store.cropModeElementId && store.cropRect) {
            const cropEl = store.elements.find(el => el.id === store.cropModeElementId);
            if (cropEl) {
                const handle = hitTestCropHandle(x, y, cropEl, store.cropRect, store.viewState.scale);
                if (handle) {
                    cropDragHandle = handle;
                    cropDragStartX = x;
                    cropDragStartY = y;
                    cropDragStartRect = { ...store.cropRect };
                    return;
                }
                // Clicked outside crop area — apply and exit
                const finalCrop = finalizeCropRect(store.cropRect, cropEl);
                exitCropMode(false);
                if (finalCrop) {
                    pushToHistory();
                    updateElement(cropEl.id, { crop: finalCrop });
                }
                requestAnimationFrame(draw);
                return;
            }
        }

        if (editingId()) {
            commitText();
            // Switch back to selection if text tool was active (blur handler won't fire in time)
            if (store.selectedTool === 'text') {
                setSelectedTool('selection');
            }
            return;
        }



        // Crop tool: click on image → enter crop mode
        if (store.selectedTool === 'crop') {
            const threshold = 10 / store.viewState.scale;
            const elementMap = new Map<string, DrawingElement>();
            for (const el of store.elements) elementMap.set(el.id, el);

            // Find top-most element under cursor
            let hitEl: DrawingElement | null = null;
            for (let i = store.elements.length - 1; i >= 0; i--) {
                const el = store.elements[i];
                if (hitTestElement(el, x, y, threshold, store.elements, elementMap)) {
                    hitEl = el;
                    break;
                }
            }

            if (hitEl && hitEl.type === 'image' && hitEl.dataURL) {
                enterCropMode(hitEl.id);
                requestAnimationFrame(draw);
            } else if (hitEl) {
                showToast('Crop only works on image elements', 'info');
            }
            return;
        }

        if (store.selectedTool === 'selection' || store.selectedTool === 'lasso') {
            selectionOnDown(e, x, y, pState, pHelpers, pSignals);
            return;
        }

        // ... existing creation logic for text/shapes ...
        // Check if active layer is visible and unlocked
        const activeLayer = store.layers.find(l => l.id === store.activeLayerId);
        if (!activeLayer?.visible) {
            showToast('Cannot draw on a hidden layer. Please show the layer first or select a visible layer.', 'error');
            return;
        }
        if (activeLayer?.locked) {
            showToast('Cannot draw on a locked layer. Please unlock the layer first or select an unlocked layer.', 'error');
            return;
        }

        if (store.selectedTool === 'text') { textOnDown(x, y, pState, pSignals); return; }
        if (store.selectedTool === 'richtext') { richTextOnDown(x, y, pState, pSignals); return; }
        if (store.selectedTool === 'laser') { laserOnDown(x, y, pState); return; }
        if (store.selectedTool === 'ink') { inkOnDown(x, y, pState); return; }
        if (store.selectedTool === 'eraser') { eraserOnDown(x, y, pState, pHelpers); return; }
        if (store.selectedTool === 'pan') { panOnDown(pState, pHelpers); return; }
        if (store.selectedTool === 'polyline' || pState.isPolylineBuilding) { polylineOnDown(x, y, pState, pHelpers); return; }
        if (store.selectedTool === 'path' || pState.isPenBuilding) { penPathDown(x, y, pState, pHelpers); requestAnimationFrame(draw); return; }

        drawOnDown(x, y, pState, pHelpers);
        smartShape.arm(pState.currentId); // no-op unless a pen tool + enabled
    };

    const handlePointerMove = (e: PointerEvent) => {
        if (touchDrivingPenStroke) return;
        if ((gestureActive || gestureCooldown) && e.pointerType === 'touch') return;
        // Palm rejection on move: only block palm-sized touch while a pen is
        // currently in contact. Misclassified pencil-tip touches pass through.
        if (e.pointerType === 'pen') {
            pState.lastPenInputAt = Date.now();
        } else if (e.pointerType === 'touch') {
            const penActive = pState.activePenPointerId !== null
                || (Date.now() - pState.lastPenInputAt) < PEN_RECENT_MS;
            if (penActive && !isPencilSizedTouch(e)) return;
        }

        if (presentationOnMove(e, pState)) return;
        let { x, y } = getWorldCoordinates(e.clientX, e.clientY);
        setCursorPosition({ x: Math.round(x), y: Math.round(y) });

        // Crop mode drag
        if (store.cropModeElementId && store.cropRect) {
            const cropEl = store.elements.find(el => el.id === store.cropModeElementId);
            if (cropEl) {
                if (cropDragHandle && cropDragStartRect) {
                    const dx = x - cropDragStartX;
                    const dy = y - cropDragStartY;
                    const newRect = applyCropDrag(cropDragHandle, cropDragStartRect, dx, dy, cropEl.width, cropEl.height);
                    updateCropRect(newRect);
                    requestAnimationFrame(draw);
                    return;
                }
                // Update cursor based on hovered handle
                const handle = hitTestCropHandle(x, y, cropEl, store.cropRect, store.viewState.scale);
                if (canvasRef) canvasRef.style.cursor = getCropHandleCursor(handle);
                return;
            }
        }

        if (store.selectedTool === 'pan') { panOnMove(e, pState, pHelpers); return; }

        if ((store.selectedTool === 'selection' || store.selectedTool === 'lasso') && !pState.draggingFromConnector) {
            selectionOnMove(e, x, y, pState, pHelpers, pSignals, SNAPPING_THROTTLE_MS);
            return;
        }


        if (store.selectedTool === 'laser') {
            laserOnMove(e, pState, pHelpers, LASER_THROTTLE_MS, LASER_MAX_POINTS);
        }

        if (store.selectedTool === 'text' && pState.isDrawing) {
            textOnMove(x, y, pState);
            requestAnimationFrame(draw);
            return;
        }

        if (store.selectedTool === 'richtext' && pState.isDrawing) {
            richTextOnMove(x, y, pState);
            requestAnimationFrame(draw);
            return;
        }

        if (pState.isPolylineBuilding) {
            polylineOnMove(x, y, pState, pHelpers, pSignals);
            requestAnimationFrame(draw);
            return;
        }

        if (pState.isPenBuilding) {
            penPathMove(x, y, pState, pHelpers, pSignals);
            requestAnimationFrame(draw);
            return;
        }

        // Heal a dropped pointerdown for genuine pointer-driven pens (Surface,
        // Wacom, Chromebook styli). iPad pen tools run on the TouchEvent path —
        // touchDrivingPenStroke short-circuits this handler at the top — so this
        // only fires for real pointer pens. !smartShapeSuppress stops a trailing
        // post-snap contact from re-opening a stroke.
        if (!pState.isDrawing && !smartShapeSuppress && e.pointerType === 'pen'
            && isPenDrawingTool() && ((e.buttons & 1) !== 0 || e.pressure > 0)) {
            const layer = store.layers.find(l => l.id === store.activeLayerId);
            if (layer?.visible && !layer?.locked) {
                drawOnDown(x, y, pState, pHelpers);
                smartShape.arm(pState.currentId);
            }
        }

        if (!pState.isDrawing || !pState.currentId) {
            if (pState.isDrawing && store.selectedTool === 'eraser') {
                eraserOnMove(x, y, pHelpers);
            }
            return;
        }

        if (store.selectedTool === 'fineliner' || store.selectedTool === 'marker' || store.selectedTool === 'inkbrush' || store.selectedTool === 'ink') {
            penOnMove(e, pState, pHelpers, PEN_UPDATE_THROTTLE_MS);
            smartShape.note(e.clientX, e.clientY);
        } else {
            drawOnMove(x, y, pState, pHelpers, pSignals);
        }

        // Auto-Scroll Check
        handleAutoScroll(e, pState);

        if (pState.isDrawing || pState.isDragging) {
            requestAnimationFrame(draw);
        }
    };

    const handlePointerUp = (e: PointerEvent) => {
        if (touchDrivingPenStroke) return;
        // Gesture path consumed this — but DO let the touch pointerup
        // through if we're still mid-gesture's cooldown, so the OS-level
        // pointer capture is released cleanly.
        if (gestureActive && e.pointerType === 'touch') {
            try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* noop */ }
            return;
        }
        // Palm rejection: drop palm-sized touch up if a pen is currently in
        // control. Pencil-sized touch ups pass through.
        if (e.pointerType === 'pen') {
            if (pState.activePenPointerId === e.pointerId) {
                pState.activePenPointerId = null;
            }
            pState.lastPenInputAt = Date.now();
            cancelShapeHold();      // pen lifted — drop any pending dwell
            smartShapeSuppress = false;
        } else if (e.pointerType === 'touch') {
            const penActive = (pState.activePenPointerId !== null && pState.activePenPointerId !== e.pointerId)
                || (Date.now() - pState.lastPenInputAt) < PEN_RECENT_MS;
            if (penActive && !isPencilSizedTouch(e)) {
                try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* noop */ }
                return;
            }
            if (pState.activePenPointerId === e.pointerId) {
                pState.activePenPointerId = null;
                pState.lastPenInputAt = Date.now();
            }
        }

        try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* noop */ }

        // Crop mode: finish drag
        if (cropDragHandle) {
            cropDragHandle = null;
            cropDragStartRect = null;
            return;
        }

        if (presentationOnUp(e, pState)) return;
        if (store.selectedTool === 'pan') { panOnUp(pState, pHelpers); return; }
        if (store.selectedTool === 'laser') { laserOnUp(pState, pHelpers); return; }
        if (store.selectedTool === 'eraser') { eraserOnUp(pState); return; }

        // Handle connector drawing first (before selection tool handling)
        if (pState.draggingFromConnector && pState.isDrawing && pState.currentId) {
            connectorHandleOnUp(pState, pSignals, pHelpers);
            return;
        }

        if (pState.isPolylineBuilding) {
            polylineOnUp(pState);
            return;
        }

        if (pState.isPenBuilding) {
            penPathUp(pState);
            requestAnimationFrame(draw);
            return;
        }

        if (store.selectedTool === 'selection' || store.selectedTool === 'lasso') {
            const { x: upX, y: upY } = getWorldCoordinates(e.clientX, e.clientY);
            selectionOnUp(e, upX, upY, pState, pHelpers, pSignals);
            return;
        }

        if (store.selectedTool === 'text') {
            textOnUp(pState, pSignals);
            return;
        }

        if (store.selectedTool === 'richtext') {
            richTextOnUp(pState, pSignals);
            return;
        }

        drawOnUp(pState, pHelpers, pSignals);
    };

    const handleDoubleClick = (e: MouseEvent) => {
        if (pState.isPolylineBuilding) {
            polylineFinalize(pState, pHelpers, pSignals);
            requestAnimationFrame(draw);
            return;
        }

        if (pState.isPenBuilding) {
            penPathFinalize(pState);
            requestAnimationFrame(draw);
            return;
        }

        // Double-click a symbol instance → edit its master in place. Hit-test the
        // point so a cold double-click (no prior selection) works too.
        if (store.selectedTool === 'selection') {
            const { x: wx, y: wy } = getWorldCoordinates(e.clientX, e.clientY);
            const threshold = 8 / store.viewState.scale;
            const elementMap = new Map<string, DrawingElement>();
            for (const el of store.elements) elementMap.set(el.id, el);
            for (let i = store.elements.length - 1; i >= 0; i--) {
                const el = store.elements[i];
                if (el.type === 'symbolInstance' && el.symbolId && hitTestElement(el, wx, wy, threshold, store.elements, elementMap)) {
                    e.preventDefault();
                    enterSymbolEdit(el.id);
                    requestAnimationFrame(draw);
                    return;
                }
            }
        }

        // Check for table column edge double-click (auto-fit column width)
        if (store.selection.length === 1 && store.selectedTool === 'selection') {
            const selEl = store.elements.find(el => el.id === store.selection[0]);
            if (selEl && selEl.type === 'table' && canvasRef) {
                const { x, y } = getWorldCoordinates(e.clientX, e.clientY);
                const cols = selEl.tableCols ?? 3;
                const rows = selEl.tableRows ?? 3;
                const hasHeader = selEl.tableHeaders !== false;
                const totalVisualRows = hasHeader ? rows + 1 : rows;
                const colWidths = selEl.tableColWidths ?? defaultColWidths(cols);
                const rowHeights = selEl.tableRowHeights ?? defaultRowHeights(totalVisualRows);
                const cellRects = computeCellRects(selEl.x, selEl.y, selEl.width, selEl.height, colWidths, rowHeights, selEl.tableColOrder, hasHeader);
                const edgeThreshold = 6 / store.viewState.scale;

                const colEdge = hitTestColEdge(x, y, cellRects, edgeThreshold);
                if (colEdge) {
                    // Auto-fit the column to the right of the edge (colIndex is the left column)
                    const targetCol = colEdge.colIndex;
                    const rawCtx = canvasRef.getContext('2d');
                    if (rawCtx && selEl.tableData) {
                        const renderer = new CanvasRenderer(rawCtx);
                        const fontSize = selEl.fontSize ?? 14;
                        const optimalWidth = measureColumnOptimalWidth(
                            renderer,
                            selEl.tableData,
                            targetCol,
                            fontSize,
                            selEl.width,
                            12,
                            hasHeader
                        );

                        // Update column widths, redistributing remaining space
                        const newWidths = [...colWidths];
                        const oldWidth = newWidths[targetCol];

                        // Distribute the difference proportionally among other columns
                        const otherColsTotal = 1 - oldWidth;
                        if (otherColsTotal > 0) {
                            newWidths[targetCol] = optimalWidth;
                            for (let c = 0; c < cols; c++) {
                                if (c !== targetCol) {
                                    newWidths[c] = newWidths[c] * (1 - optimalWidth) / otherColsTotal;
                                }
                            }
                        }

                        pushToHistory();
                        updateElement(selEl.id, { tableColWidths: newWidths }, false);
                        requestAnimationFrame(draw);
                        return;
                    }
                }
            }
        }

        // Video element double-click → play video
        if (store.selection.length === 1) {
            const selEl = store.elements.find(el => el.id === store.selection[0]);
            if (selEl?.type === 'video' && selEl.videoURL) {
                toggleVideoPlayback(selEl.id);
                return;
            }
        }

        handleDoubleClickHandler(e, textEditCtx);
    };

    onMount(() => {
        // Register callback to trigger redraw when images load
        setImageLoadCallback(() => {
            draw();
        });

        // TouchEvent listeners for pen-drawing tools. iPad Safari's PointerEvent
        // delivery for Apple Pencil drops alternate strokes on rapid lift +
        // recontact (gesture-detection windows swallow the next pointerdown).
        // TouchEvents are reliable on iPad — the Apple Pencil Safari API exposes
        // pen data through TouchEvents (force, touchType: 'stylus', altitudeAngle,
        // azimuthAngle). We bind both event families and let TouchEvents win for
        // pen-drawing tools via the `touchDrivingPenStroke` flag.
        // Use addEventListener with `passive: false` so preventDefault() works.
        if (canvasRef) {
            // Register gesture handlers FIRST so they observe 2-finger
            // touchstarts before the pen-stroke handler short-circuits on
            // touches.length >= 2.
            canvasRef.addEventListener('touchstart', handleTouchStartGesture, { passive: false });
            canvasRef.addEventListener('touchmove', handleTouchMoveGesture, { passive: false });
            canvasRef.addEventListener('touchend', handleTouchEndGesture, { passive: false });
            canvasRef.addEventListener('touchcancel', handleTouchEndGesture, { passive: false });

            canvasRef.addEventListener('touchstart', handleTouchStart, { passive: false });
            canvasRef.addEventListener('touchmove', handleTouchMove, { passive: false });
            canvasRef.addEventListener('touchend', handleTouchEnd, { passive: false });
            canvasRef.addEventListener('touchcancel', handleTouchEnd, { passive: false });
        }

        // Crop mode keyboard shortcuts (Enter to apply, Escape to cancel)
        const handleCropKeys = (e: KeyboardEvent) => {
            if (!store.cropModeElementId) return;
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                const cropEl = store.elements.find(el => el.id === store.cropModeElementId);
                if (cropEl && store.cropRect) {
                    const finalCrop = finalizeCropRect(store.cropRect, cropEl);
                    exitCropMode(false);
                    if (finalCrop) {
                        pushToHistory();
                        updateElement(cropEl.id, { crop: finalCrop });
                    }
                }
                requestAnimationFrame(draw);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                exitCropMode(false);
                requestAnimationFrame(draw);
            }
        };
        window.addEventListener('keydown', handleCropKeys, true);

        // Polyline keyboard shortcuts (Escape to finish, Backspace to undo last point)
        const handlePolylineKeys = (e: KeyboardEvent) => {
            if (!pState.isPolylineBuilding) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                polylineFinalize(pState, pHelpers, pSignals);
                requestAnimationFrame(draw);
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                e.stopPropagation();
                polylineUndo(pState);
                requestAnimationFrame(draw);
            }
        };
        window.addEventListener('keydown', handlePolylineKeys, true);

        // Pen (vector path) keyboard shortcuts: Enter/Escape to finish, Backspace to undo last anchor.
        const handlePenKeys = (e: KeyboardEvent) => {
            if (!pState.isPenBuilding) return;
            if (e.key === 'Escape' || e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                penPathFinalize(pState);
                requestAnimationFrame(draw);
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                e.stopPropagation();
                penPathUndo(pState);
                requestAnimationFrame(draw);
            }
        };
        window.addEventListener('keydown', handlePenKeys, true);

        // Drag-and-drop for color/URL drops on canvas elements (image file drops handled globally in app.tsx)
        // Attach to parent wrapper div instead of canvas directly — canvas is a weak drop target on Linux/Wayland
        const dropHandler = (e: DragEvent) => handleDropHandler(e, canvasEventCtx);
        const dropZone = canvasRef!.parentElement!;
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('drop', dropHandler);

        // Touch/pen ColorDrop: the palette swatch drives the drag and calls this
        // on release to fill the shape under the finger (HTML5 DnD doesn't fire
        // on touch, so this is the mobile-friendly path to the same fill logic).
        registerColorDropCommit((cx, cy, color) => {
            applyAssetAtClientPoint(cx, cy, color, canvasEventCtx);
            requestAnimationFrame(draw);
        });

        window.addEventListener("resize", handleResize);
        document.addEventListener("fullscreenchange", handleResize);
        handleResize();

        // Expose table cell navigation interface for global keyboard handler (app.tsx)
        (window as any).__tableCellNav = {
            getCellSelection: () => tableCellSelectionSignal(),
            setCellSelection: (sel: import("../types").TableCellSelection | null) => {
                pState.tableCellSelection = sel;
                pState.tableCellSelectionElementId = sel ? store.selection[0] : null;
                setTableCellSelection(sel);
                requestAnimationFrame(draw);
            },
            startEditingCell: (elementId: string, visualRow: number, visualCol: number, initialText?: string) => {
                const el = store.elements.find(e => e.id === elementId);
                if (!el || el.type !== 'table') return;

                const cols = el.tableCols ?? 3;
                const rows = el.tableRows ?? 3;
                const hasHeader = el.tableHeaders !== false;
                const totalVisualRows = hasHeader ? rows + 1 : rows;
                const colWidths = el.tableColWidths ?? defaultColWidths(cols);
                const rowHeights = el.tableRowHeights ?? defaultRowHeights(totalVisualRows);
                const data = el.tableData ?? defaultTableData(rows, cols);
                const cellRects = computeCellRects(
                    el.x, el.y, el.width, el.height,
                    colWidths, rowHeights, el.tableColOrder, hasHeader
                );

                const cellRect = cellRects.find(r => r.row === visualRow && r.col === visualCol);
                if (!cellRect) return;

                const tableDataRow = hasHeader
                    ? (cellRect.dataRow === -1 ? 0 : cellRect.dataRow + 1)
                    : cellRect.dataRow;

                const currentText = data[tableDataRow]?.[cellRect.dataCol] ?? '';

                batch(() => {
                    setEditingProperty('tableCell');
                    setEditText(initialText !== undefined ? initialText : currentText);
                    setTableEditingCell({
                        dataRow: tableDataRow,
                        dataCol: cellRect.dataCol,
                        cellX: cellRect.x,
                        cellY: cellRect.y,
                        cellW: cellRect.w,
                        cellH: cellRect.h,
                    });
                    setEditingId(el.id);
                });

                setTimeout(() => {
                    textInputRef?.focus();
                    if (initialText !== undefined) {
                        textInputRef?.setSelectionRange(initialText.length, initialText.length);
                    } else {
                        textInputRef?.select();
                    }
                }, 0);
            },
            isEditingTableCell: () => editingId() !== null && editingProperty() === 'tableCell',
            getEditingId: () => editingId(),
        };

        // Expose node text editing for the global keyboard handler (app.tsx).
        // Backs F2 ("edit node text") and auto-edit-on-create for mindmap nodes,
        // mirroring the containerText/text branch of handleDoubleClick so a node
        // can be labelled without the mouse. Returns false if editing couldn't
        // start (missing element, or blocked by the canvas-rotation guard).
        (window as any).__nodeTextEdit = {
            startEditing: (elementId: string, opts?: { selectAll?: boolean }) => {
                const el = store.elements.find(e => e.id === elementId);
                if (!el) return false;
                // Bare connectors aren't node-text editable.
                if (el.type === 'line' || el.type === 'arrow' || el.type === 'bezier'
                    || el.type === 'polyline' || el.type === 'organicBranch') return false;

                const useTextProp = el.type === 'text' || el.type === 'richtext' || el.type === 'codeBlock'
                    || el.type === 'dsArray' || el.type === 'dsStack' || el.type === 'dsQueue'
                    || el.type === 'dsLinkedList' || el.type === 'dsBinaryTree' || el.type === 'dsHashTable';
                const prop: 'text' | 'containerText' = useTextProp ? 'text' : 'containerText';
                const text = useTextProp ? (el.text || '') : (el.containerText || '');

                const existingSpans = useTextProp ? el.richText : el.richContainerText;
                let spans: RichTextSpan[] = existingSpans && existingSpans.length > 0 ? existingSpans : [];
                if (el.type === 'richtext' && spans.length === 0 && text) {
                    spans = plainTextToSpans(text);
                }

                batch(() => {
                    setEditingProperty(prop);
                    setEditText(text);
                    setRichTextSpans(spans);
                    setEditingId(el.id); // last — triggers overlay render; respects the rotation guard
                });

                // Rotation guard (or any block) leaves editingId unchanged — don't focus a stale overlay.
                if (editingId() !== el.id) return false;

                setTimeout(() => {
                    textInputRef?.focus();
                    if (opts?.selectAll) textInputRef?.select();
                    else textInputRef?.setSelectionRange(text.length, text.length);
                }, 0);
                return true;
            },
            getEditingId: () => editingId(),
        };

        onCleanup(() => {
            delete (window as any).__tableCellNav;
            delete (window as any).__nodeTextEdit;
            clearUndoRepeat();
            registerColorDropCommit(null);
            dropZone.removeEventListener('dragover', handleDragOver);
            dropZone.removeEventListener('drop', dropHandler);
            window.removeEventListener('keydown', handleCropKeys, true);
            window.removeEventListener('keydown', handlePolylineKeys, true);
            window.removeEventListener('keydown', handlePenKeys, true);
            window.removeEventListener("resize", handleResize);
            document.removeEventListener("fullscreenchange", handleResize);
            if (canvasRef) {
                canvasRef.removeEventListener('touchstart', handleTouchStartGesture);
                canvasRef.removeEventListener('touchmove', handleTouchMoveGesture);
                canvasRef.removeEventListener('touchend', handleTouchEndGesture);
                canvasRef.removeEventListener('touchcancel', handleTouchEndGesture);
                canvasRef.removeEventListener('touchstart', handleTouchStart);
                canvasRef.removeEventListener('touchmove', handleTouchMove);
                canvasRef.removeEventListener('touchend', handleTouchEnd);
                canvasRef.removeEventListener('touchcancel', handleTouchEnd);
            }
        });
    });




    return (
        <>
            <div class="canvas-drop-zone" style={{ position: "relative", width: "100%", height: "100%" }}>
                <canvas
                    ref={canvasRef}
                    onWheel={onWheel}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onDblClick={handleDoubleClick}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        // Suppress context menu when triggered by touch/pen long-press
                        // (e.g. iPad palm rest). Only show on real mouse right-click.
                        // contextmenu MouseEvents from a real right-click report button=2;
                        // touch/pen long-press synthesize button=0.
                        const isMouseRightClick = e.button === 2 && pState.lastPointerType !== 'touch' && pState.lastPointerType !== 'pen';
                        if (!isMouseRightClick) return;
                        setContextMenuPos({ x: e.clientX, y: e.clientY });
                        setContextMenuOpen(true);
                    }}
                    style={{
                        display: "block",
                        "touch-action": "none",
                        cursor: store.eyedropper.active ? 'crosshair' : cursor(),
                        "user-select": "none",
                        "-webkit-user-select": "none",
                        "-webkit-touch-callout": "none",
                        // Dark mode is now done per-colour at render time (RenderPipeline.adjustColor,
                        // see docs/design/dark-mode.md) so saturated colours stay true — no global
                        // canvas invert filter. Images therefore render true-colour too.
                        filter: 'none',
                    }}
                />
            </div>

            {/* Global Texture Overlay */}
            <Show when={store.canvasTexture !== 'none' && store.canvasTexture !== 'grid' && store.canvasTexture !== 'graph' && store.canvasTexture !== 'notebook'}>
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        "pointer-events": "none",
                        "z-index": 0,
                        opacity: 0.4,
                        "background-image": store.canvasTexture === 'paper'
                            ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opactiy='0.5'/%3E%3C/svg%3E")`
                            : store.canvasTexture === 'dots'
                                ? `radial-gradient(#000000 1px, transparent 1px)`
                                : 'none',
                        "background-size": store.canvasTexture === 'dots' ? '20px 20px' : 'auto',
                        // Match the canvas filter so the texture overlay reads
                        // correctly against the inverted canvas in dark/focus.
                        filter: (store.resolvedTheme === 'dark' || store.resolvedTheme === 'focus')
                            ? 'invert(93%) hue-rotate(180deg)'
                            : 'none',
                    }}
                />
            </Show>

            <ScrollBackButton canvasRef={canvasRef} />
            <RichTextEditingOverlay
                editingId={() => {
                    if (expandedEditorOpen()) return null;
                    const id = editingId();
                    if (!id) return null;
                    const el = store.elements.find(e => e.id === id);
                    // Show for richtext elements or when rich text spans are present
                    return (el?.type === 'richtext' || richTextSpans().length > 0) ? id : null;
                }}
                setEditingId={setEditingId}
                editingProperty={() => editingProperty() as 'text' | 'containerText'}
                richTextSpans={richTextSpans}
                setRichTextSpans={setRichTextSpans}
                setEditText={setEditText}
                onCommitRichText={commitRichText}
                onExpand={() => setExpandedEditorOpen(true)}
            />
            <TextEditingOverlay
                editingId={() => {
                    if (expandedEditorOpen()) return null;
                    const id = editingId();
                    if (!id) return null;
                    const el = store.elements.find(e => e.id === id);
                    // Only show for plain text elements (not richtext) when no rich spans
                    return (el?.type !== 'richtext' && richTextSpans().length === 0) ? id : null;
                }}
                setEditingId={setEditingId}
                editText={editText}
                setEditText={setEditText}
                editingProperty={editingProperty}
                tableEditingCell={tableEditingCell}
                canvasRef={canvasRef}
                onCommitText={commitText}
                onTextInputRef={(ref) => { textInputRef = ref; }}
                onExpand={() => setExpandedEditorOpen(true)}
                onTableCellNavigate={(direction) => {
                    const sel = pState.tableCellSelection;
                    const elId = pState.tableCellSelectionElementId;
                    if (!sel || !elId) return;

                    const el = store.elements.find(e => e.id === elId);
                    if (!el || el.type !== 'table') return;

                    const cols = el.tableCols ?? 3;
                    const rows = el.tableRows ?? 3;
                    const hasHeader = el.tableHeaders !== false;
                    const totalVisualRows = hasHeader ? rows + 1 : rows;
                    const wrap = direction === 'right' || direction === 'left';

                    const nextCell = getNextCell(
                        sel.startRow, sel.startCol, direction,
                        totalVisualRows, cols, el.tableMergedCells, wrap
                    );

                    if (nextCell) {
                        const newSel = { startRow: nextCell.row, startCol: nextCell.col, endRow: nextCell.row, endCol: nextCell.col };
                        pState.tableCellSelection = newSel;
                        pState.tableCellSelectionElementId = elId;
                        setTableCellSelection(newSel);
                        (window as any).__tableCellNav?.startEditingCell(elId, nextCell.row, nextCell.col);
                    }
                }}
            />
            <TextEditorModal
                isOpen={expandedEditorOpen}
                onClose={() => setExpandedEditorOpen(false)}
                isRichText={() => richTextSpans().length > 0}
                richTextSpans={richTextSpans}
                setRichTextSpans={setRichTextSpans}
                editText={editText}
                setEditText={setEditText}
                onCommit={() => { richTextSpans().length > 0 ? commitRichText() : commitText(); }}
                element={() => store.elements.find(e => e.id === editingId()) || null}
            />

            {/* Context Menu */}
            <Show when={contextMenuOpen()}>
                <ContextMenu
                    x={contextMenuPos().x}
                    y={contextMenuPos().y}
                    items={(() => { const w = getWorldCoordinates(contextMenuPos().x, contextMenuPos().y); return getContextMenuItems(draw, w.x, w.y, tableCellSelectionSignal(), () => setTableCellSelection(null)); })()}
                    onClose={() => setContextMenuOpen(false)}
                />
            </Show>

            {/* Recording Overlay */}
            <Show when={store.isRecording}>
                <RecordingOverlay onStop={handleStopRecording} />
            </Show>

            {/* Time-lapse capture indicator + replay player */}
            <Show when={store.timelapseRecording}>
                <TimelapseOverlay />
            </Show>
            <TimelapsePlayer />

            {/* Video Playback Overlay */}
            <VideoOverlay />

            {/* Path Editor Overlay */}
            <Show when={store.pathEditState.isActive}>
                <PathEditorOverlay
                    elementId={store.pathEditState.elementId}
                    animationId={store.pathEditState.animationId}
                    scale={store.viewState.scale}
                    panX={store.viewState.panX}
                    panY={store.viewState.panY}
                />
            </Show>

            {/* Minimap */}
            <Show when={store.minimapVisible}>
                <Minimap
                    canvasWidth={canvasRef?.width || window.innerWidth}
                    canvasHeight={canvasRef?.height || window.innerHeight}
                />
            </Show>
        </>
    );
};

export default Canvas;
