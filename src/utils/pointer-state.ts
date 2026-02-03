/**
 * Pointer State
 * Consolidates all mutable state shared across pointer event handlers
 * (handlePointerDown, handlePointerMove, handlePointerUp).
 */

export interface PointerState {
    isDrawing: boolean;
    currentId: string | null;
    startX: number;
    startY: number;
    isDragging: boolean;
    isSelecting: boolean;
    draggingHandle: string | null;
    initialPositions: Map<string, any>;
    draggingFromConnector: { elementId: string; anchorPosition: string; startX: number; startY: number } | null;
    hoveredConnector: { elementId: string; handle: string } | null;
    initialElementX: number;
    initialElementY: number;
    initialElementWidth: number;
    initialElementHeight: number;
    initialElementFontSize: number;
    lastSnappingTime: number;
    laserTrailData: Array<{ x: number; y: number; timestamp: number }>;
    laserRafPending: boolean;
    lastLaserUpdateTime: number;
    penPointsBuffer: number[];
    lastPenUpdateTime: number;
    penUpdatePending: boolean;
    isPolylineBuilding: boolean;
    polylinePoints: { x: number; y: number }[];
    lassoPoints: { x: number; y: number }[];

    // Table interaction state
    tableResizeCol: number;       // column index being resized (-1 = none)
    tableResizeRow: number;       // row index being resized (-1 = none)
    tableResizeElementId: string | null;
    tableResizeStartX: number;
    tableResizeStartY: number;
    tableResizeInitialWidths: number[] | null;
    tableResizeInitialHeights: number[] | null;
    tableDragCol: number;         // column being dragged for reorder (-1 = none)
    tableDragElementId: string | null;
    // Cell selection for merge operations
    tableCellSelection: { startRow: number; startCol: number; endRow: number; endCol: number } | null;
    tableCellSelectionElementId: string | null;
    tableCellSelectionDragging: boolean;  // true when drag-selecting cells
}

export function createPointerState(): PointerState {
    return {
        isDrawing: false,
        currentId: null,
        startX: 0,
        startY: 0,
        isDragging: false,
        isSelecting: false,
        draggingHandle: null,
        initialPositions: new Map(),
        draggingFromConnector: null,
        hoveredConnector: null,
        initialElementX: 0,
        initialElementY: 0,
        initialElementWidth: 0,
        initialElementHeight: 0,
        initialElementFontSize: 20,
        lastSnappingTime: 0,
        laserTrailData: [],
        laserRafPending: false,
        lastLaserUpdateTime: 0,
        penPointsBuffer: [],
        lastPenUpdateTime: 0,
        penUpdatePending: false,
        isPolylineBuilding: false,
        polylinePoints: [],
        lassoPoints: [],
        tableResizeCol: -1,
        tableResizeRow: -1,
        tableResizeElementId: null,
        tableResizeStartX: 0,
        tableResizeStartY: 0,
        tableResizeInitialWidths: null,
        tableResizeInitialHeights: null,
        tableDragCol: -1,
        tableDragElementId: null,
        tableCellSelection: null,
        tableCellSelectionElementId: null,
        tableCellSelectionDragging: false,
    };
}
