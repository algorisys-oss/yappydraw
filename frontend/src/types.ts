import type { ElementAnimation } from './types/motion-types';
export type ElementType = 'rectangle' | 'circle' | 'line' | 'arrow' | 'text' | 'richtext' | 'fineliner' | 'inkbrush' | 'marker' | 'eraser' | 'pan' | 'selection' | 'image' | 'bezier' | 'diamond' | 'triangle' | 'hexagon' | 'octagon' | 'parallelogram' | 'star' | 'cloud' | 'heart' | 'cross' | 'checkmark' | 'arrowLeft' | 'arrowUp' | 'arrowDown' | 'arrowRight' | 'capsule' | 'stickyNote' | 'callout' | 'burst' | 'speechBubble' | 'ribbon' | 'bracketLeft' | 'bracketRight' | 'database' | 'document' | 'predefinedProcess' | 'internalStorage' | 'server' | 'loadBalancer' | 'firewall' | 'user' | 'messageQueue' | 'lambda' | 'router' | 'browser' | 'trapezoid' | 'rightTriangle' | 'pentagon' | 'septagon' | 'starPerson' | 'scroll' | 'wavyDivider' | 'doubleBanner' | 'lightbulb' | 'signpost' | 'burstBlob' | 'browserWindow' | 'mobilePhone' | 'ghostButton' | 'inputField' | 'organicBranch' | 'polygon' | 'dfdProcess' | 'dfdDataStore' | 'isometricCube' | 'cylinder' | 'stateStart' | 'stateEnd' | 'stateSync' | 'activationBar' | 'externalEntity' | 'ink' | 'laser' | 'umlClass' | 'umlInterface' | 'umlActor' | 'umlUseCase' | 'umlNote' | 'umlPackage' | 'solidBlock' | 'perspectiveBlock' | 'openBox' | 'umlComponent' | 'umlState' | 'umlLifeline' | 'umlFragment' | 'umlEnum' | 'umlSignalSend' | 'umlSignalReceive' | 'umlProvidedInterface' | 'umlRequiredInterface'
    | 'trophy' | 'clock' | 'gear' | 'target' | 'rocket' | 'flag'
    | 'key' | 'magnifyingGlass' | 'book' | 'megaphone' | 'eye' | 'thoughtBubble'
    | 'stickFigure' | 'sittingPerson' | 'presentingPerson' | 'handPointRight' | 'thumbsUp' | 'faceHappy' | 'faceSad' | 'faceConfused'
    | 'checkbox' | 'checkboxChecked' | 'numberedBadge' | 'questionMark' | 'exclamationMark' | 'tag' | 'pin' | 'stamp'
    | 'kubernetes' | 'container' | 'apiGateway' | 'cdn' | 'storageBlob' | 'eventBus' | 'microservice' | 'shield'
    | 'barChart' | 'pieChart' | 'trendUp' | 'trendDown' | 'funnel' | 'gauge' | 'ganttChart' | 'journeyDiagram' | 'quadrantChart' | 'xyChart' | 'table'
    | 'puzzlePiece' | 'chainLink' | 'bridge' | 'magnet' | 'scale' | 'seedling' | 'tree' | 'mountain'
    | 'polyline' | 'elbow' | 'codeBlock'
    | 'dsArray' | 'dsStack' | 'dsQueue' | 'dsLinkedList' | 'dsBinaryTree' | 'dsHashTable'
    | 'solidButton' | 'dropdown' | 'uiCheckbox' | 'radioButton' | 'toggleSwitch'
    | 'card' | 'searchBar' | 'progressBar' | 'avatar' | 'navbar'
    | 'tabBar' | 'badge' | 'tooltip' | 'slider'
    | 'bpmnStartEvent' | 'bpmnEndEvent' | 'bpmnIntermediateEvent'
    | 'bpmnExclusiveGateway' | 'bpmnParallelGateway' | 'bpmnInclusiveGateway'
    | 'bpmnTask' | 'bpmnSubProcess' | 'bpmnCallActivity'
    | 'bpmnDataObject' | 'bpmnAnnotation' | 'bpmnPool'
    | 'bpmnEventGateway' | 'bpmnDataStore' | 'bpmnGroup'
    | 'video';

export type ToolType = ElementType | 'lasso' | 'crop';

export type AppMode = 'design' | 'presentation' | 'prototype' | 'embed';
export type FillStyle = 'hachure' | 'solid' | 'cross-hatch' | 'zigzag' | 'dots' | 'dashed' | 'zigzag-line' | 'linear' | 'radial' | 'conic' | 'image';
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type FontFamily = 'hand-drawn' | 'sans-serif' | 'monospace' | 'caveat' | 'poppins' | 'serif' | 'marker' | 'code';
export type TextAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';
export type ArrowHead = 'arrow' | 'triangle' | 'dot' | 'circle' | 'bar' | 'diamond' | 'diamondFilled' | 'crowsfoot' | null;

export interface RichTextSpan {
    text: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    color?: string;
    fontSize?: number;
    fontFamily?: FontFamily;
    // List properties
    listType?: 'bullet' | 'ordered' | 'none';  // Type of list item
    listLevel?: number;                         // Indent level (0-based, 0 = no indent)
    listIndex?: number;                         // For ordered lists, the item number
}

export interface GradientStop {
    offset: number; // 0 to 1
    color: string;
}

export type GradientType = 'linear' | 'radial' | 'conic';

export type BlendMode =
    | 'normal'
    | 'multiply'
    | 'screen'
    | 'overlay'
    | 'darken'
    | 'lighten'
    | 'color-dodge'
    | 'color-burn'
    | 'hard-light'
    | 'soft-light'
    | 'difference'
    | 'exclusion'
    | 'hue'
    | 'saturation'
    | 'color'
    | 'luminosity'
    | 'source-over'
    | 'destination-over'; // standard composite ops



export type Point = {
    x: number;
    y: number;
    p?: number; // pressure (0-1)
    t?: number; // timestamp for velocity calculation
};

export type EntranceAnimation = 'none' |
    // Attention seekers
    'bounce' | 'flash' | 'pulse' | 'rubberBand' | 'shakeX' | 'shakeY' | 'headShake' | 'swing' | 'tada' | 'wobble' | 'jello' | 'heartBeat' |
    // Back entrances
    'backInDown' | 'backInLeft' | 'backInRight' | 'backInUp' |
    // Bouncing entrances
    'bounceIn' | 'bounceInDown' | 'bounceInLeft' | 'bounceInRight' | 'bounceInUp' |
    // Fading entrances
    'fadeIn' | 'fadeInDown' | 'fadeInDownBig' | 'fadeInLeft' | 'fadeInLeftBig' | 'fadeInRight' | 'fadeInRightBig' | 'fadeInUp' | 'fadeInUpBig' | 'fadeInTopLeft' | 'fadeInTopRight' | 'fadeInBottomLeft' | 'fadeInBottomRight' |
    // Flippers
    'flip' | 'flipInX' | 'flipInY' |
    // Lightspeed
    'lightSpeedInRight' | 'lightSpeedInLeft' |
    // Rotating entrances
    'rotateIn' | 'rotateInDownLeft' | 'rotateInDownRight' | 'rotateInUpLeft' | 'rotateInUpRight' |
    // Specials
    'rollIn' | 'jackInTheBox' |
    'scaleIn' | // Added for compatibility
    // Draw effect
    'drawIn' |
    // Zooming entrances
    'zoomIn' | 'zoomInDown' | 'zoomInLeft' | 'zoomInRight' | 'zoomInUp' |
    // Sliding entrances
    'slideInDown' | 'slideInLeft' | 'slideInRight' | 'slideInUp' |
    // Text animations (for text elements only)
    'typewriter' | 'typewriterCursor' | 'wordByWord' | 'textScramble' | 'lineByLine' | 'charByChar' |
    // Table animations (for table elements only)
    'tableRowReveal' | 'tableColReveal' | 'tableCellFill' | 'tableHeatmapFadeIn' |
    'tableRowHighlight' | 'tableColPulse' | 'tableGridDraw' | 'tableHeaderSlam' |
    'tableCountUp' | 'tableAccordion' |
    'tableCellsAssemble' | 'tableLightningSplit' |
    // Code Block animations
    'codeLineHighlight' |
    // Data Structure animations
    'dsItemReveal' | 'dsHighlightSweep' | 'dsPointerWalk';

export type ExitAnimation = 'none' |
    // Back exits
    'backOutDown' | 'backOutLeft' | 'backOutRight' | 'backOutUp' |
    // Bouncing exits
    'bounceOut' | 'bounceOutDown' | 'bounceOutLeft' | 'bounceOutRight' | 'bounceOutUp' |
    // Fading exits
    'fadeOut' | 'fadeOutDown' | 'fadeOutDownBig' | 'fadeOutLeft' | 'fadeOutLeftBig' | 'fadeOutRight' | 'fadeOutRightBig' | 'fadeOutUp' | 'fadeOutUpBig' | 'fadeOutTopLeft' | 'fadeOutTopRight' | 'fadeOutBottomRight' | 'fadeOutBottomLeft' |
    // Flippers
    'flipOutX' | 'flipOutY' |
    // Lightspeed
    'lightSpeedOutRight' | 'lightSpeedOutLeft' |
    // Rotating exits
    'rotateOut' | 'rotateOutDownLeft' | 'rotateOutDownRight' | 'rotateOutUpLeft' | 'rotateOutUpRight' |
    // Specials
    'rollOut' | 'hinge' |
    'scaleOut' | // Added for compatibility
    // Draw effect
    'drawOut' |
    // Zooming exits
    'zoomOut' | 'zoomOutDown' | 'zoomOutLeft' | 'zoomOutRight' | 'zoomOutUp' |
    // Sliding exits
    'slideOutDown' | 'slideOutLeft' | 'slideOutRight' | 'slideOutUp' |
    // Text exit animations (for text elements only)
    'textDelete';

export interface DrawingElement {
    id: string;
    type: ElementType;
    x: number;
    y: number;
    width: number;
    height: number;

    // Common Styles
    strokeColor: string;
    backgroundColor: string;
    lidColor?: string; // Optional lid fill color for openBox shape
    lidStrokeColor?: string; // Optional lid stroke color for openBox shape
    backfaceStrokeColor?: string; // Optional stroke color for back-facing surfaces (facing away from viewer)
    fillStyle: FillStyle;
    strokeWidth: number;
    strokeStyle: StrokeStyle;
    roughness: number;
    opacity: number; // 0-100
    angle: number; // radians
    renderStyle: 'sketch' | 'architectural';
    seed: number;
    roundness: null | { type: number };
    locked: boolean;
    link: string | null;
    tag?: string | null;

    // Specific to Linear (Line, Arrow, Pencil)
    points?: Point[] | number[];
    pointsEncoding?: 'packed' | 'flat'; // flat is [x, y, x, y...], packed could be delta encoded in future

    // Non-destructive partial erase ("erase mask"). Each stroke punches holes into
    // the rendered shape at render time via destination-out compositing — the shape
    // keeps its type/identity and stays fully editable. Points are element-local
    // (relative to x/y, in the unrotated/unscaled frame), flat-encoded [x, y, x, y...].
    // radius is in world units (eraser threshold + half stroke width).
    eraseStrokes?: { points: number[]; radius: number }[];
    // Control points for bezier curves and smart elbow routing
    // For bezier: [ { x, y } ] (absolute coordinates ideally, or relative to start/center?)
    // Let's use absolute coordinates for simplicity in hit testing, but they must move with shape
    controlPoints?: { x: number; y: number }[];
    startArrowhead?: ArrowHead;
    endArrowhead?: ArrowHead;
    startArrowheadSize?: number;
    endArrowheadSize?: number;

    // Specific to Text
    text?: string;
    rawText?: string;
    fontSize?: number;
    fontFamily?: FontFamily;
    fontWeight?: boolean | string;
    fontStyle?: boolean | string;
    textAlign?: TextAlign;
    verticalAlign?: VerticalAlign;
    containerId?: string | null;
    textColor?: string;
    textHighlightEnabled?: boolean;
    textHighlightColor?: string;
    textHighlightPadding?: number;
    textHighlightRadius?: number;

    // Rich text: per-span formatting (when present, takes priority over plain text)
    richText?: RichTextSpan[];
    richContainerText?: RichTextSpan[];

    // Text inside shapes (for labels on rectangles, circles, etc.)
    containerText?: string;
    labelPosition?: 'start' | 'middle' | 'end'; // For line/arrow labels

    // UML Specific (Multi-section text)
    attributesText?: string;
    methodsText?: string;

    // UML Class section layout (persisted when user drags dividers)
    umlHeaderHeight?: number;
    umlAttrHeight?: number;
    umlAttrScrollY?: number;
    umlMethodsScrollY?: number;

    // Specific to Image
    fileId?: string | null;
    scale?: [number, number]; // [x, y]
    crop?: { x: number; y: number; width: number; height: number } | null;
    status?: 'pending' | 'loaded' | 'error';
    dataURL?: string;
    mimeType?: string;

    // Image Filter Properties
    filterBrightness?: number;   // 0-200, default 100 (CSS brightness %)
    filterContrast?: number;     // 0-200, default 100 (CSS contrast %)
    filterSaturate?: number;     // 0-200, default 100 (CSS saturate %)
    filterBlur?: number;         // 0-20, default 0 (CSS blur in px)
    filterHueRotate?: number;    // 0-360, default 0 (CSS hue-rotate in degrees)
    filterInvert?: number;       // 0-100, default 0 (CSS invert %)
    filterSepia?: number;        // 0-100, default 0 (CSS sepia %)
    filterPreset?: string;       // Preset ID or 'custom'

    // Image Pixel Effect Properties (animated reveal/transform)
    pixelEffect?: 'sequential-ltr' | 'sequential-rtl' | 'sequential-ttb' | 'sequential-btt' |
    'random-pixels' | 'wave-center' | 'wave-corner' | 'scan-lines' |
    'block-reveal' | 'spiral' | 'glitch' | 'curtain-vertical' |
    'curtain-horizontal' | 'dissolve' | 'pixel-rain';
    pixelEffectProgress?: number; // 0-1, current progress of pixel effect animation
    pixelEffectDuration?: number; // Duration in ms for pixel effect animation
    pixelEffectParams?: {         // Effect-specific parameters
        lineHeight?: number;      // For scan-lines
        blockSize?: number;       // For block-reveal
        glitchIntensity?: number; // For glitch (0-1)
        waveCount?: number;       // For wave effects
        columnCount?: number;     // For pixel-rain: number of columns
        columnWidth?: number;     // For pixel-rain: width of each column
        trailLength?: number;     // For pixel-rain: trail length
    };

    // Specific to Video
    videoURL?: string;              // Source URL (MP4, WebM, YouTube, Vimeo)
    videoEmbedURL?: string;         // Computed embed URL for YouTube/Vimeo iframe
    videoPosterURL?: string;        // Poster/thumbnail image URL
    videoPosterDataURL?: string;    // Poster cached as data URL for canvas rendering
    videoAutoplay?: boolean;        // Auto-play in presentation mode
    videoLoop?: boolean;            // Loop playback
    videoMuted?: boolean;           // Muted by default
    videoLocked?: boolean;          // Lock position while playing
    videoProvider?: 'direct' | 'youtube' | 'vimeo' | 'unknown';

    // Meta
    groupIds?: string[];
    boundElements?: { id: string; type: 'arrow' | 'text' | 'organicBranch' }[] | null;
    isSelected?: boolean;
    layerId: string; // Reference to parent layer
    startBinding?: { elementId: string; focus: number; gap: number; position?: string; anchorFractionX?: number; anchorFractionY?: number } | null;
    endBinding?: { elementId: string; focus: number; gap: number; position?: string; anchorFractionX?: number; anchorFractionY?: number } | null;
    arrowAnchorAlign?: 'top' | 'middle' | 'bottom'; // Bias left/right arrow anchors vertically
    curveType?: 'straight' | 'bezier' | 'elbow';
    constrained?: boolean; // Keep proportions
    autoResize?: boolean; // Auto-resize based on text
    flipX?: boolean; // Mirror horizontally
    flipY?: boolean; // Mirror vertically
    renderScale?: number; // Canvas-level scale for zoom animations (default: 1)
    parentId?: string | null;
    isCollapsed?: boolean;
    poolContainerId?: string | null;   // ID of containing bpmnPool element
    poolLaneIndex?: number;            // 0-based lane index within the pool
    starPoints?: number; // Number of points for star shapes (3-12, default: 5)
    polygonSides?: number; // Number of sides for polygon shapes (3-20, default: 6)
    borderRadius?: number; // Corner radius percentage (0-50, default: 0)
    burstPoints?: number; // Number of points for burst shapes (8-32, default: 16)
    shapeRatio?: number; // 0-100 (Vertical ratio for cube, inner radius for star)
    sideRatio?: number; // 0-100 (Horizontal rotation for isometricCube)
    depth?: number; // 0-200 (Extrusion depth for solidBlock/perspectiveBlock/cylinder)
    viewAngle?: number; // 0-360 (View angle for solidBlock/perspectiveBlock/cylinder)
    openAmount?: number; // 0-100 (How open the box lid is - lid lifts up and tilts back)
    lidPosition?: 'back' | 'front' | 'left' | 'right'; // Which edge the lid hinges on
    lidStyle?: 'single' | 'split' | 'double' | 'quad' | 'flaps'; // Single lid, split (French doors), double (opposite sides), quad (4 quarters), or flaps (2 half-lids meeting at center)
    openBoxPreset?: string; // Predefined openBox style preset ID
    showLidHinge?: boolean; // Show the hinge edge face of the lid for complete 3D appearance
    // OpenBox interaction properties
    enableClickToOpen?: boolean; // Enable click-to-open animation in presentation mode
    revealElementId?: string; // ID of element to reveal when box opens
    openAnimationDuration?: number; // Duration of open animation in ms
    revealAnimationType?: 'fadeIn' | 'slideUp' | 'scaleUp' | 'pop'; // Type of reveal animation
    restoreAfterReveal?: boolean; // Restore box and reveal element to initial state after animation
    taper?: number; // 0-1 (Scaling of back face for perspectiveBlock)

    // Code block properties
    codeShowLineNumbers?: boolean; // Show line numbers in gutter (default true)
    codeStartLineNumber?: number;  // First line number (default 1)
    codeHighlightLine?: number;    // Currently highlighted line (for animation, -1 = none)
    codeScrollOffset?: number;     // Vertical scroll offset in px (for animation auto-scroll)
    // Data Structure visualization properties
    dsShowIndices?: boolean;       // Show index/position labels
    dsDirection?: 'horizontal' | 'vertical';  // Layout direction
    dsItemColor?: string;          // Cell/node fill color
    dsHighlightIndex?: number;     // Highlighted item index (-1 = none)
    dsPointerIndex?: number;       // Pointer/cursor position (for animations)
    dsCapacity?: number;           // Max visible cells / buckets
    dsAnimProgress?: number;       // Animation progress 0-100
    dsAnimStyle?: string;          // Active animation type name
    dsPersistChanges?: boolean;    // Keep CRUD changes after presentation (default false = reset)
    // BPMN properties
    bpmnEventType?: 'none' | 'message' | 'timer' | 'error' | 'signal' | 'conditional' | 'escalation' | 'compensation' | 'link' | 'terminate' | 'cancel';
    bpmnTaskType?: 'none' | 'user' | 'service' | 'script' | 'manual' | 'send' | 'receive' | 'businessRule';
    bpmnLoopType?: 'none' | 'standard' | 'parallel' | 'sequential' | 'compensation';
    bpmnNonInterrupting?: boolean;  // Non-interrupting event (dashed border)
    bpmnLaneCount?: number;         // Number of lanes inside a pool (1–6)
    bpmnLaneLabels?: string[];      // Per-lane label text array
    bpmnLaneHeights?: number[];     // Per-lane height ratios (fractions summing to 1.0)
    bpmnOrientation?: 'horizontal' | 'vertical';  // Pool orientation (default: horizontal)
    bpmnLaneColors?: string[];      // Per-lane background colors
    bpmnLaneTextColors?: string[];  // Per-lane text/label colors
    bpmnLaneCollapsed?: boolean[];  // Per-lane collapsed state
    bpmnPoolLabelSize?: number;     // Pool header column width (horizontal) or row height (vertical), in px
    bpmnLaneLabelSize?: number;     // Lane label column width (horizontal) or row height (vertical), in px
    bpmnIconScale?: number;      // Scale factor for BPMN icons/markers (0.5–2.0, default 1.0)
    bpmnIconColor?: string;      // Override color for BPMN icons (defaults to strokeColor)
    bpmnIconFilled?: boolean;    // Fill event/gateway icons instead of outline only
    dsHighlightIndex2?: number;    // Second highlighted item (for sort comparison/swap)
    dsHighlightColor?: string;     // Color token: 'comparing' | 'swapping' | 'sorted' | 'searching' | 'found' | 'notfound'
    dsHighlightColor2?: string;    // Color token for second highlight
    dsSortedBoundary?: number;     // Items with index < this are sorted (green tint, from left)
    dsSortedBoundaryEnd?: number;  // Items with index >= this are sorted (green tint, from right)
    // Pie Chart data (from Mermaid pie DSL)
    pieSlices?: Array<{ label: string; value: number; color?: string }>;
    // Gantt Chart data (from Mermaid gantt DSL)
    ganttTasks?: Array<{ id: string; label: string; section: string; startDate: string; endDate: string; duration: number; isCritical?: boolean; status?: 'done' | 'active' | 'default'; color?: string }>;
    // Journey Diagram data (from Mermaid journey DSL)
    journeyTasks?: Array<{ label: string; score: number; actors: string[]; section: string; color?: string }>;
    // Quadrant Chart data (from Mermaid quadrantChart DSL)
    quadrantData?: { title?: string; xAxisLabel?: [string, string]; yAxisLabel?: [string, string]; quadrantLabels: [string, string, string, string]; points: Array<{ label: string; x: number; y: number; color?: string }> };
    // XY Chart data (from Mermaid xychart DSL)
    xyChartData?: { title?: string; xAxis: { labels?: string[]; label?: string }; yAxis: { label?: string; min?: number; max?: number }; bars?: number[]; lines?: number[][] };
    skewX?: number; // -1 to 1 (X offset of back face)
    skewY?: number; // -1 to 1 (Y offset of back face)
    frontTaper?: number; // 0-1 (Scaling of front face)
    frontSkewX?: number; // -1 to 1 (X offset of front face)
    frontSkewY?: number; // -1 to 1 (Y offset of front face)
    tailX?: number;
    tailY?: number;
    innerRadius?: number;
    tailPosition?: number; // Tail position percentage (0-100, default: 20)
    drawInnerBorder?: boolean; // Toggle for double border
    innerBorderColor?: string; // Optional color (defaults to strokeColor if null)
    innerBorderDistance?: number; // Distance from outer border (padding)
    strokeLineJoin?: 'round' | 'bevel' | 'miter'; // Corner style (default: 'round')
    fillDensity?: number;
    // Shadow Properties
    shadowEnabled?: boolean;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    // Gradient Properties
    gradientStart?: string; // Deprecated in favor of gradientStops
    gradientEnd?: string;   // Deprecated in favor of gradientStops
    gradientDirection?: number; // Angle in degrees (0-360)
    gradientStops?: GradientStop[];
    gradientType?: GradientType;
    gradientPreset?: string; // Predefined gradient preset ID
    gradientHandlePositions?: { start: Point; end: Point };

    // Image Fill (active when fillStyle === 'image') — paints an image clipped to the shape outline
    backgroundImage?: string;          // Image URL or data URL used as the fill
    backgroundImageFit?: 'cover' | 'contain' | 'fill' | 'tile'; // How the image maps into the shape bounds (default 'cover')
    backgroundOpacity?: number;        // 0-1, opacity of the fill image (default 1)

    // Effects
    blendMode?: BlendMode;
    filter?: string; // CSS filter string (e.g. "blur(5px)")
    isEditing?: boolean;

    // Draw-in animation progress (0-100, undefined = not animating)
    drawProgress?: number;


    // NEW: Robust Animation System
    /** @deprecated Use animations array instead */
    entranceAnimation?: EntranceAnimation;
    animations?: ElementAnimation[];
    isMotionPath?: boolean; // Can this element act as a path for others?

    // Text rendering on paths
    curvedText?: boolean;

    // Motion Graphics
    flowAnimation?: boolean;
    flowSpeed?: number;          // 0 to 10
    flowStyle?: 'dashes' | 'dots' | 'pulse';
    flowColor?: string;
    flowDensity?: number;        // 1 to 10
    flowReverse?: boolean;       // Reverse flow direction

    // NEW: Persistent Animations
    spinEnabled?: boolean;
    spinSpeed?: number;          // Degrees per frame or similar

    orbitEnabled?: boolean;
    orbitCenterId?: string;      // ID of element to orbit
    orbitRadius?: number;
    orbitSpeed?: number;
    orbitDirection?: 'cw' | 'ccw';
    ttl?: number; // Expiry timestamp (ms)
    presentationDrawn?: boolean; // Element created during presentation mode (erasable in presentation)

    // Pen Specific
    smoothing?: number;
    taperAmount?: number;
    velocitySensitivity?: number;

    // Table Specific
    tableRows?: number;           // number of data rows (default 3)
    tableCols?: number;           // number of columns (default 3)
    tableHeaders?: boolean;       // whether header row is shown (default true)
    tableData?: string[][];       // row-major cell data [row][col]
    tableColWidths?: number[];    // fractional widths per column (sum ≈ 1.0)
    tableRowHeights?: number[];   // fractional heights per row (sum ≈ 1.0, includes header)
    tableColOrder?: number[];     // column display order
    tableSortCol?: number;        // column index currently sorted (-1 = none)
    tableSortDir?: 'asc' | 'desc'; // sort direction
    tableHeaderColor?: string;    // header row background
    tableHeaderTextColor?: string; // header text color
    tableRowColor?: string;       // body row base color (even rows, or all if no alt)
    tableAltRowColor?: string;    // alternating (odd) row color
    tableColAlignments?: ('left' | 'center' | 'right')[]; // text alignment per column
    tableMergedCells?: { startRow: number; startCol: number; endRow: number; endCol: number }[]; // merged cell regions
    tableCellFormats?: TableCellFormat[][];  // per-cell format settings [row][col]
    tableCellBorders?: TableCellBorders[][]; // per-cell border settings [row][col]

    // Table animation
    tableAnimProgress?: number;   // 0-100, animated by animateElement()
    tableAnimStyle?: string;      // which table animation is active (e.g. 'rowReveal', 'colReveal')
}

// Helper type for table cell selection
export interface TableCellSelection {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
}

// Table cell formatting
export type TableCellFormatType = 'text' | 'number' | 'currency' | 'percentage' | 'date';

export interface TableCellFormat {
    type: TableCellFormatType;
    // Number options
    decimalPlaces?: number;           // 0-10, default 2
    thousandsSeparator?: boolean;     // default true for number/currency
    // Currency options
    currencySymbol?: string;          // '$', '€', '£', '₹', '¥', etc.
    currencyPosition?: 'before' | 'after'; // default 'before'
    // Date options
    datePattern?: string;             // 'MM/DD/YYYY', 'DD-MMM-YYYY', 'YYYY-MM-DD', etc.
}

// Table cell border styling
export type TableBorderStyle = 'none' | 'thin' | 'medium' | 'thick';

export interface TableCellBorder {
    style: TableBorderStyle;
    color: string;
}

export interface TableCellBorders {
    top?: TableCellBorder;
    bottom?: TableCellBorder;
    left?: TableCellBorder;
    right?: TableCellBorder;
}

export interface Layer {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    opacity: number;    // 0-1
    order: number;      // Z-index for layer ordering (lower = background)
    backgroundColor?: string; // HEX or transparent
    colorTag?: string;     // Color name or hex for organizational tagging
    parentId?: string;     // ID of parent group layer
    isGroup?: boolean;     // Whether this layer is a container/group
    expanded?: boolean;    // For groups: whether child layers are visible in panel
    isMaster?: boolean;    // Master layer content repeats on every slide
}

export interface GridSettings {
    enabled: boolean;       // Show grid
    snapToGrid: boolean;    // Snap to grid
    objectSnapping: boolean; // Snap to other elements
    gridSize: number;       // Grid spacing in pixels (default 20)
    gridColor: string;      // Grid line color
    gridOpacity: number;    // Grid opacity (0-1)
    style: 'lines' | 'dots'; // Grid style
}

export interface ViewState {
    scale: number;
    panX: number;
    panY: number;
}
