import { type Component, onMount, createEffect, onCleanup, createSignal, Show, untrack, batch } from "solid-js";
import { calculateAllAnimatedStates } from "../utils/animation-utils";
import { projectMasterPosition } from "../utils/slide-utils";
import { animationEngine } from "../utils/animation/animation-engine";
import rough from 'roughjs'; // Hand-drawn style
import { store, updateElement, setActiveLayer, zoomToFitSlide, isLayerLocked, setCursorPosition, pushToHistory, setSelectedTool, enterCropMode, exitCropMode, updateCropRect } from "../store/app-store";
import { normalizePoints } from "../utils/render-element";
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
    textOnDown, textOnMove, textOnUp, inkOnDown,
    eraserOnDown, eraserOnMove,
    connectorHandleOnUp,
    handleAutoScroll
} from "../utils/tool-handlers/minor-handlers";
import { drawOnDown, drawOnMove, drawOnUp } from "../utils/tool-handlers/draw-handler";
import { penOnMove } from "../utils/tool-handlers/pen-handler";
import { polylineOnDown, polylineOnMove, polylineOnUp, polylineFinalize, polylineUndo } from "../utils/tool-handlers/polyline-handler";
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
import { commitText as commitTextHandler, handleDoubleClick as handleDoubleClickHandler, type TextEditingContext } from "../utils/tool-handlers/text-editing-handler";
import { computeCellRects, defaultColWidths, defaultRowHeights, defaultTableData, hitTestColEdge, measureColumnOptimalWidth, getNextCell } from "../utils/table-utils";
import { handleDragOver, handleDrop as handleDropHandler, handleWheel, type CanvasEventContext } from "../utils/tool-handlers/canvas-event-handlers";
import { showToast } from "./toast";
import { hitTestElement } from "../utils/hit-testing";
import { renderCropOverlay, hitTestCropHandle, applyCropDrag, getCropHandleCursor, finalizeCropRect, type CropHandle } from "../utils/image-crop-utils";
import { perfMonitor } from "../utils/performance-monitor";
import { fitShapeToText, measureWrappedTextHeight } from "../utils/text-utils";
import { effectiveTime } from "../utils/animation/animation-engine";
import RecordingOverlay from "./recording-overlay";
import { setupRecording } from "../utils/recording-manager";
export { requestRecording, setRequestRecording } from "../utils/recording-manager";
import ScrollBackButton from "./scroll-back-button";
import TextEditingOverlay from "./text-editing-overlay";

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

        // We track font properties and text of selected elements
        store.elements.forEach(el => {
            const isLine = el.type === 'line' || el.type === 'arrow';
            if (el.isSelected && el.autoResize && el.containerText && !isLine) {
                // Tracking these properties
                el.fontSize;
                el.fontFamily;
                el.fontWeight;
                el.fontStyle;
                el.containerText;

                const dims = fitShapeToText(ctx, el, el.containerText);
                if (Math.abs(dims.width - el.width) > 2 || Math.abs(dims.height - el.height) > 2) {
                    untrack(() => updateElement(el.id, {
                        width: dims.width,
                        height: dims.height
                    }));
                }
            }

            // Standalone text elements: recalculate width+height when font properties change
            if (el.isSelected && el.type === 'text' && el.text) {
                // Track font properties to trigger reactive recalculation
                const fontSize = el.fontSize || 28;
                const fontFamily = el.fontFamily || 'hand-drawn';
                const fontWeight = el.fontWeight === 'bold' ? 'bold ' : '';
                const fontStyle = el.fontStyle === 'italic' ? 'italic ' : '';
                const padding = 4; // matches text-renderer.ts

                ctx.font = `${fontStyle}${fontWeight}${fontSize}px ${fontFamily}`;

                // Ensure width fits the widest word at current font size
                const words = el.text.split(/\s+/).filter((w: string) => w.length > 0);
                let maxWordWidth = 0;
                for (const word of words) {
                    maxWordWidth = Math.max(maxWordWidth, ctx.measureText(word).width);
                }
                const minWidth = maxWordWidth + padding * 2 + 8;
                const newWidth = Math.max(el.width || 200, minWidth);

                const calculatedHeight = measureWrappedTextHeight(el.text, newWidth, fontSize, fontFamily);
                const newHeight = Math.max(calculatedHeight, fontSize * 1.2);

                const updates: Record<string, number> = {};
                if (Math.abs(newWidth - el.width) > 2) updates.width = newWidth;
                if (Math.abs(newHeight - el.height) > 2) updates.height = newHeight;

                if (Object.keys(updates).length > 0) {
                    untrack(() => updateElement(el.id, updates));
                }
            }
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


    // Pointer handler shared mutable state
    const pState = createPointerState();

    // Text Editing State
    const [editingId, setEditingId] = createSignal<string | null>(null);
    const [editingProperty, setEditingProperty] = createSignal<import("../utils/tool-handlers/text-editing-handler").EditingPropertyType>('containerText');
    const [editText, setEditText] = createSignal("");
    const [tableEditingCell, setTableEditingCell] = createSignal<import("../utils/tool-handlers/text-editing-handler").TableEditingCell | null>(null);
    const [tableCellSelectionSignal, setTableCellSelection] = createSignal<import("../types").TableCellSelection | null>(null);
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

    // Throttle constants
    const SNAPPING_THROTTLE_MS = 16; // ~60 FPS
    const LASER_THROTTLE_MS = 8; // ~120fps for smooth trail
    const LASER_DECAY_MS = 800;
    const LASER_MAX_POINTS = 100;
    const PEN_UPDATE_THROTTLE_MS = 16; // ~60fps store updates

    const flushPenPoints = () => {
        if (!pState.currentId || pState.penPointsBuffer.length === 0) return;
        const el = store.elements.find(e => e.id === pState.currentId);
        if (el && el.points) {
            const existingPoints = el.points as number[];
            const newPoints = [...existingPoints, ...pState.penPointsBuffer];
            const updates: Partial<DrawingElement> = { points: newPoints };
            // For ink tool, also update ttl
            if (el.type === 'ink') {
                updates.ttl = Date.now() + 3000;
            }
            updateElement(pState.currentId, updates, false);
            pState.penPointsBuffer = [];
        }
    };

    const handleResize = () => {
        if (canvasRef) {
            canvasRef.width = window.innerWidth;
            canvasRef.height = window.innerHeight;

            // In presentation mode, ensure the slide is re-fitted to the new window size
            // (especially important after entering fullscreen)
            if (store.appMode === 'presentation') {
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
        const isDarkMode = store.theme !== 'light';
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
        renderWorkspaceBackground(ctx, canvasRef, store.theme, store.docType, store.canvasBackgroundColor);
        renderSlideBoundaries(ctx, rc, store.slides, store.docType, store.activeSlideIndex, scale, panX, panY, store.theme);
        renderCanvasTexture(ctx, canvasRef, store.canvasTexture, scale, panX, panY, isDarkMode);

        // 4. Enter world-space for elements
        ctx.save();
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
        store.elements.forEach(e => {
            e.x; e.y; e.width; e.height;
            if (e.points) e.points.length;
            e.angle; e.opacity; e.flipX; e.flipY;
            e.strokeColor; e.backgroundColor; e.lidColor; e.fillStyle; e.strokeWidth; e.strokeStyle;
            e.roughness; e.roundness;
            e.text; e.fontSize; e.fontFamily; e.textAlign;
            e.fontWeight; e.fontStyle;
            e.textColor; e.textHighlightEnabled; e.textHighlightColor; e.textHighlightPadding; e.textHighlightRadius;
            e.startArrowhead; e.endArrowhead;
            e.containerText; e.labelPosition; // Track label properties for immediate updates
            e.isCollapsed; e.parentId; // Track hierarchy state for immediate updates
            e.starPoints; // Track star points for parametric stars
            e.polygonSides; // Track polygon sides for parametric polygons
            e.borderRadius; // Track border radius
            e.burstPoints; // Track burst points for parametric burst
            e.tailPosition; // Track tail position for speech bubble
            e.shapeRatio; // Track shape ratio (sharpness)
            e.sideRatio; // Track side ratio (perspective)
            e.depth; // Track depth for 3D shapes
            e.viewAngle; // Track viewing angle for 3D shapes
            e.openAmount; // Track lid open state for 3D boxes
            e.lidPosition; e.lidStyle; e.showLidHinge; e.lidStrokeColor; // Track lid configuration for openBox
            e.taper; e.skewX; e.skewY;
            e.frontTaper; e.frontSkewX; e.frontSkewY;
            e.drawInnerBorder; // Track double border toggle
            e.innerBorderDistance; // Track double border distance
            e.strokeStyle; // Track stroke style (solid/dashed/dotted)
            e.renderStyle; // Track drawing style (Sketch/Architectural)
            e.startArrowhead; e.endArrowhead;
            e.startArrowheadSize; e.endArrowheadSize;
            e.fillDensity; // Track fill density
            // Track gradient properties
            e.gradientStart; e.gradientEnd; e.gradientDirection;
            e.gradientStops; e.gradientType;
            // Track shadow properties
            e.shadowEnabled; e.shadowColor; e.shadowBlur; e.shadowOffsetX; e.shadowOffsetY;
            // Effects
            e.blendMode;
            // Image filter properties
            e.filterBrightness; e.filterContrast; e.filterSaturate;
            e.filterBlur; e.filterHueRotate; e.filterInvert; e.filterSepia;
            e.filterPreset;
            e.crop; // Image crop
            // Table properties
            e.tableRows; e.tableCols; e.tableHeaders; e.tableData;
            e.tableColWidths; e.tableRowHeights; e.tableColOrder;
            e.tableSortCol; e.tableSortDir;
            e.tableHeaderColor; e.tableHeaderTextColor; e.tableRowColor; e.tableAltRowColor;
            e.tableColAlignments; e.tableMergedCells; e.tableCellFormats; e.tableCellBorders;
            // Data Structure properties
            e.dsShowIndices; e.dsDirection; e.dsItemColor; e.dsCapacity;
            e.dsHighlightIndex; e.dsHighlightIndex2; e.dsHighlightColor; e.dsHighlightColor2;
            e.dsSortedBoundary; e.dsSortedBoundaryEnd;
            e.dsAnimProgress; e.dsAnimStyle; e.dsPersistChanges;
            // BPMN properties
            e.bpmnEventType; e.bpmnTaskType; e.bpmnLoopType;
            e.bpmnIconScale; e.bpmnIconColor; e.bpmnIconFilled;
            e.bpmnNonInterrupting; e.bpmnLaneCount;
            e.bpmnLaneLabels; e.bpmnLaneHeights; e.bpmnOrientation;
            e.bpmnLaneColors; e.bpmnLaneTextColors;
            e.bpmnPoolLabelSize; e.bpmnLaneLabelSize;
            e.bpmnLaneCollapsed;
            e.poolContainerId; e.poolLaneIndex;
            // Animations
            e.spinEnabled; e.spinSpeed;
            e.orbitEnabled; e.orbitCenterId; e.orbitRadius; e.orbitSpeed; e.orbitDirection;
        });
        // Track slide background changes for real-time updates
        store.slides.forEach(s => {
            s.backgroundColor; s.fillStyle; s.gradientStops; s.gradientDirection;
            s.backgroundImage; s.backgroundOpacity;
        });
        store.viewState.scale;
        store.viewState.panX;
        store.viewState.panY;
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
        // Track grid settings changes
        store.gridSettings.enabled;
        store.gridSettings.gridSize;
        store.gridSettings.gridColor;
        store.gridSettings.gridOpacity;
        store.gridSettings.style;
        store.canvasBackgroundColor;
        store.canvasTexture;
        store.theme;
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

    const getWorldCoordinates = (clientX: number, clientY: number) => {
        if (!canvasRef) return { x: 0, y: 0 };
        const { scale, panX, panY } = store.viewState;
        const rect = canvasRef.getBoundingClientRect();
        return {
            x: (clientX - rect.left - panX) / scale,
            y: (clientY - rect.top - panY) / scale
        };
    };


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
            points: newPoints
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
        tableEditingCell, setTableEditingCell,
        get textInputRef() { return textInputRef; },
        get canvasRef() { return canvasRef; },
        getWorldCoordinates, canInteractWithElement, applyMasterProjection,
        redrawFn: draw
    };

    const canvasEventCtx: CanvasEventContext = {
        getWorldCoordinates, canInteractWithElement, applyMasterProjection
    };

    const commitText = () => commitTextHandler(textEditCtx);

    const pHelpers: import("../utils/pointer-helpers").PointerHelpers = {
        getWorldCoordinates, canInteractWithElement, checkBinding,
        refreshLinePoints, refreshBoundLine, flushPenPoints,
        applyMasterProjection, normalizePencil, commitText,
        draw, setCursor, setTableCellSelection
    };
    const pSignals: import("../utils/pointer-helpers").PointerSignals = {
        editingId, setEditingId, setEditText,
        selectionBox, setSelectionBox,
        lassoPoints, setLassoPoints,
        suggestedBinding, setSuggestedBinding,
        snappingGuides, setSnappingGuides,
        spacingGuides, setSpacingGuides,
        reparentDropTarget, setReparentDropTarget,
        poolLaneDropTarget, setPoolLaneDropTarget,
        get textInputRef() { return textInputRef; }
    };

    const handlePointerDown = (e: PointerEvent) => {
        if (store.appMode === 'embed') return;
        if (presentationOnDown(e, pState, pHelpers)) return;
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
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
        if (store.selectedTool === 'laser') { laserOnDown(x, y, pState); return; }
        if (store.selectedTool === 'ink') { inkOnDown(x, y, pState); return; }
        if (store.selectedTool === 'eraser') { eraserOnDown(x, y, pState, pHelpers); return; }
        if (store.selectedTool === 'pan') { panOnDown(pState, pHelpers); return; }
        if (store.selectedTool === 'polyline' || pState.isPolylineBuilding) { polylineOnDown(x, y, pState, pHelpers); return; }

        drawOnDown(x, y, pState, pHelpers);
    };

    const handlePointerMove = (e: PointerEvent) => {
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

        if (pState.isPolylineBuilding) {
            polylineOnMove(x, y, pState, pHelpers, pSignals);
            requestAnimationFrame(draw);
            return;
        }

        if (!pState.isDrawing || !pState.currentId) {
            if (pState.isDrawing && store.selectedTool === 'eraser') {
                eraserOnMove(x, y, pHelpers);
            }
            return;
        }

        if (store.selectedTool === 'fineliner' || store.selectedTool === 'marker' || store.selectedTool === 'inkbrush' || store.selectedTool === 'ink') {
            penOnMove(e, pState, pHelpers, PEN_UPDATE_THROTTLE_MS);
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
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);

        // Crop mode: finish drag
        if (cropDragHandle) {
            cropDragHandle = null;
            cropDragStartRect = null;
            return;
        }

        if (presentationOnUp(e, pState)) return;
        if (store.selectedTool === 'pan') { panOnUp(pState, pHelpers); return; }
        if (store.selectedTool === 'laser') { laserOnUp(pState, pHelpers); return; }

        // Handle connector drawing first (before selection tool handling)
        if (pState.draggingFromConnector && pState.isDrawing && pState.currentId) {
            connectorHandleOnUp(pState, pSignals, pHelpers);
            return;
        }

        if (pState.isPolylineBuilding) {
            polylineOnUp(pState);
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

        drawOnUp(pState, pHelpers, pSignals);
    };

    const handleDoubleClick = (e: MouseEvent) => {
        if (pState.isPolylineBuilding) {
            polylineFinalize(pState, pHelpers, pSignals);
            requestAnimationFrame(draw);
            return;
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
                    const ctx = canvasRef.getContext('2d');
                    if (ctx && selEl.tableData) {
                        const fontSize = selEl.fontSize ?? 14;
                        const optimalWidth = measureColumnOptimalWidth(
                            ctx,
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

        handleDoubleClickHandler(e, textEditCtx);
    };

    onMount(() => {
        // Register callback to trigger redraw when images load
        setImageLoadCallback(() => {
            draw();
        });

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

        onCleanup(() => {
            delete (window as any).__tableCellNav;
            window.removeEventListener('keydown', handleCropKeys, true);
            window.removeEventListener('keydown', handlePolylineKeys, true);
            window.removeEventListener("resize", handleResize);
            document.removeEventListener("fullscreenchange", handleResize);
        });
    });




    return (
        <>
            <canvas
                ref={canvasRef}
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onDblClick={handleDoubleClick}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropHandler(e, canvasEventCtx)}
                onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenuPos({ x: e.clientX, y: e.clientY });
                    setContextMenuOpen(true);
                }}
                style={{ display: "block", "touch-action": "none", cursor: cursor(), "user-select": "none" }}
            />

            {/* Global Texture Overlay */}
            <Show when={store.canvasTexture !== 'none' && store.canvasTexture !== 'grid' && store.canvasTexture !== 'graph'}>
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
                        "background-size": store.canvasTexture === 'dots' ? '20px 20px' : 'auto'
                    }}
                />
            </Show>

            <ScrollBackButton canvasRef={canvasRef} />
            <TextEditingOverlay
                editingId={editingId}
                setEditingId={setEditingId}
                editText={editText}
                setEditText={setEditText}
                editingProperty={editingProperty}
                tableEditingCell={tableEditingCell}
                canvasRef={canvasRef}
                onCommitText={commitText}
                onTextInputRef={(ref) => { textInputRef = ref; }}
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
