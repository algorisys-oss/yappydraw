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
    // Per-point pressure captured alongside penPointsBuffer (1 value per point).
    // Flushed into element.pressures so width can follow Apple Pencil force.
    penPressureBuffer: number[];
    lastPenUpdateTime: number;
    penUpdatePending: boolean;
    // Opt-in pulled-string stabilizer for the current freehand stroke (null when
    // stabilization is off). Set in drawOnDown, cleared at stroke end.
    stabilizer: import('./stroke-stabilizer').StrokeStabilizer | null;

    // iPad / Apple Pencil palm rejection
    // Last timestamp (ms) we observed a 'pen' pointer event. While this is recent,
    // touch (= palm) events are ignored.
    lastPenInputAt: number;
    // Track active 'pen' pointer ids — when any pen is currently down, ignore touch.
    activePenPointerId: number | null;
    // Last pointerType seen on pointerdown — used to filter contextmenu so iOS
    // long-press from palm/finger doesn't open the canvas/property context menu.
    lastPointerType: 'mouse' | 'pen' | 'touch' | null;
    isPolylineBuilding: boolean;
    polylinePoints: { x: number; y: number }[];
    // Pen tool (editable vector path) build state.
    isPenBuilding: boolean;
    penAnchors: import('../types').PathAnchor[]; // committed anchors, relative to startX/startY
    penActiveIdx: number;                         // index of the anchor being dragged (curving), or -1
    penDragging: boolean;                         // pointer is down on the active anchor
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
    pendingCellClick: { row: number; col: number; elementId: string } | null; // deferred until mouseUp

    // BPMN Pool lane divider resize
    poolLaneResizeIndex: number;          // lane divider index being resized (-1 = none)
    poolLaneResizeElementId: string | null;
    poolLaneResizeStartPos: number;       // start Y (horizontal) or X (vertical)
    poolLaneResizeInitialHeights: number[] | null;

    // BPMN Pool header/lane-label column divider resize
    poolHeaderResizeType: 'pool' | 'lane' | null;  // which header divider is being resized
    poolHeaderResizeElementId: string | null;
    poolHeaderResizeStartPos: number;               // start X (horizontal) or Y (vertical)
    poolHeaderResizeInitialSize: number;             // initial size in px

    // UML Class section divider resize
    umlDividerType: 'header' | 'attr' | null;
    umlDividerElementId: string | null;
    umlDividerStartPos: number;
    umlDividerInitialHeaderHeight: number;
    umlDividerInitialAttrHeight: number;

    // 3D shape view angle control (Alt+drag)
    initial3DViewAngle: number | undefined;
    initial3DDepth: number | undefined;
    initial3DStartX: number | undefined;
    initial3DStartY: number | undefined;

    // Elbow multi-bend drawing state
    elbowCommittedPoints: { x: number; y: number }[];
    elbowDirection: 'h' | 'v' | null;

    // Raw mouse position for connector endpoint (before anchor snapping)
    lastRawEndX: number;
    lastRawEndY: number;
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
        penPressureBuffer: [],
        stabilizer: null,
        lastPenUpdateTime: 0,
        penUpdatePending: false,
        lastPenInputAt: 0,
        activePenPointerId: null,
        lastPointerType: null,
        isPenBuilding: false,
        penAnchors: [],
        penActiveIdx: -1,
        penDragging: false,
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
        pendingCellClick: null,
        poolLaneResizeIndex: -1,
        poolLaneResizeElementId: null,
        poolLaneResizeStartPos: 0,
        poolLaneResizeInitialHeights: null,
        poolHeaderResizeType: null,
        poolHeaderResizeElementId: null,
        poolHeaderResizeStartPos: 0,
        poolHeaderResizeInitialSize: 0,
        umlDividerType: null,
        umlDividerElementId: null,
        umlDividerStartPos: 0,
        umlDividerInitialHeaderHeight: 0,
        umlDividerInitialAttrHeight: 0,
        initial3DViewAngle: undefined,
        initial3DDepth: undefined,
        initial3DStartX: undefined,
        initial3DStartY: undefined,
        elbowCommittedPoints: [],
        elbowDirection: null,
        lastRawEndX: 0,
        lastRawEndY: 0,
    };
}
