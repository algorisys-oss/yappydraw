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
    /** Draggable in-shape label: the element being repositioned + its start offset. */
    textMoveId: string | null;
    textOffsetStartX: number;
    textOffsetStartY: number;
    initialPositions: Map<string, any>;
    draggingFromConnector: { elementId: string; anchorPosition: string; startX: number; startY: number } | null;
    hoveredConnector: { elementId: string; handle: string } | null;
    initialElementX: number;
    initialElementY: number;
    initialElementWidth: number;
    initialElementHeight: number;
    initialElementFontSize: number;
    // Free Transform shear (Ctrl/Cmd + drag side handle). Captured at drag start.
    shearing: boolean;
    shearInitialX: number;
    shearInitialY: number;
    lastSnappingTime: number;
    /** Cached path-intersection snap targets for the current drag (static elements
        don't move mid-drag, so compute once). Undefined = not yet computed. */
    intersectionSnapPoints?: { x: number; y: number }[];
    /** Ids a modifier-click (Shift/Ctrl/Cmd) on an already-selected element WILL toggle
        out of the selection — but only on pointer-up if it was a click, not a drag. Kept
        selected during the press so a Shift+drag moves them (axis-constrained) instead. */
    pendingShiftDeselect?: string[];
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
    // Procreate-style "second finger" modifier: while a pen/stylus owns a
    // selection drag/resize, a finger contact sets this to act like Shift
    // (proportional resize). Set/cleared by the canvas touch handlers; read by
    // the selection handler's constrain logic.
    secondaryContact: boolean;
    isPolylineBuilding: boolean;
    polylinePoints: { x: number; y: number }[];
    // Pen tool (editable vector path) build state.
    isPenBuilding: boolean;
    penAnchors: import('../types').PathAnchor[]; // committed anchors, relative to startX/startY
    penActiveIdx: number;                         // index of the anchor being dragged (curving), or -1
    penDragging: boolean;                         // pointer is down on the active anchor
    /**
     * Alt was held at some point while curving the active anchor, so its two handles are
     * broken apart. Sticky for the rest of the drag: releasing Alt mid-gesture must not
     * re-mirror and undo the cusp you were shaping (Illustrator behaves the same way).
     */
    penHandleBroken: boolean;
    // Touch/pen tap-to-toggle: an anchor pressed (no modifier) by finger/stylus.
    // A pure tap (lift without dragging past slop) toggles smooth↔corner; a real
    // drag clears this and moves the node. History is deferred until the first
    // real move so a tap yields one clean undo step. null when not tapping.
    penTapAnchor: { id: string; sub: number; i: number } | null;
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
        textMoveId: null,
        textOffsetStartX: 0,
        textOffsetStartY: 0,
        initialPositions: new Map(),
        draggingFromConnector: null,
        hoveredConnector: null,
        initialElementX: 0,
        initialElementY: 0,
        initialElementWidth: 0,
        initialElementHeight: 0,
        initialElementFontSize: 20,
        shearing: false,
        shearInitialX: 0,
        shearInitialY: 0,
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
        secondaryContact: false,
        isPenBuilding: false,
        penTapAnchor: null,
        penAnchors: [],
        penActiveIdx: -1,
        penDragging: false,
        penHandleBroken: false,
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
