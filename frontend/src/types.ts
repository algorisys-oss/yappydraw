import type { ElementAnimation } from './types/motion-types';
export type ElementType = 'rectangle' | 'circle' | 'line' | 'arrow' | 'text' | 'richtext' | 'fineliner' | 'inkbrush' | 'marker' | 'eraser' | 'pan' | 'selection' | 'image' | 'bezier' | 'diamond' | 'triangle' | 'hexagon' | 'octagon' | 'parallelogram' | 'star' | 'cloud' | 'heart' | 'cross' | 'checkmark' | 'arrowLeft' | 'arrowUp' | 'arrowDown' | 'arrowRight' | 'capsule' | 'stickyNote' | 'callout' | 'burst' | 'speechBubble' | 'ribbon' | 'bracketLeft' | 'bracketRight' | 'database' | 'document' | 'predefinedProcess' | 'internalStorage' | 'server' | 'loadBalancer' | 'firewall' | 'user' | 'messageQueue' | 'lambda' | 'router' | 'browser' | 'trapezoid' | 'rightTriangle' | 'pentagon' | 'septagon' | 'starPerson' | 'scroll' | 'wavyDivider' | 'doubleBanner' | 'lightbulb' | 'signpost' | 'burstBlob' | 'browserWindow' | 'mobilePhone' | 'ghostButton' | 'inputField' | 'organicBranch' | 'polygon' | 'dfdProcess' | 'dfdDataStore' | 'isometricCube' | 'cylinder' | 'stateStart' | 'stateEnd' | 'stateSync' | 'activationBar' | 'externalEntity' | 'ink' | 'laser' | 'umlClass' | 'umlInterface' | 'umlActor' | 'umlUseCase' | 'umlNote' | 'umlPackage' | 'solidBlock' | 'perspectiveBlock' | 'openBox' | 'umlComponent' | 'umlState' | 'umlLifeline' | 'umlFragment' | 'umlEnum' | 'umlSignalSend' | 'umlSignalReceive' | 'umlProvidedInterface' | 'umlRequiredInterface' | 'umlNode' | 'umlArtifact' | 'umlObject' | 'umlPort' | 'umlHistory' | 'umlAction'
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
    | 'path'
    | 'stickRig'
    | 'video' | 'symbolInstance';

/** A reusable symbol definition: a normalized (origin-0) snapshot of elements.
 *  `kind` absent = 'graphic' (a static symbol, the original behavior). A 'movieclip'
 *  carries its own frame `timeline` (Animation mode) whose keyframes reference ids
 *  inside `elements`; instances play it independently of the document timeline. */
export interface SymbolDef { id: string; name: string; width: number; height: number; elements: DrawingElement[]; kind?: 'graphic' | 'movieclip'; timeline?: import('./types/anim-types').AnimTimeline; }

/** A named rectangular export region on the infinite canvas. */
export interface Artboard { id: string; name: string; x: number; y: number; width: number; height: number; background?: string; }

/** A reusable named appearance (fill/stroke/gradient/mesh/appearance/effects)
 *  applied to objects in one click. `style` is a subset of DrawingElement props. */
export interface GraphicStyle { id: string; name: string; style: Partial<DrawingElement>; }

/** A document-level named colour. Objects that link to it (via fillSwatchId /
 *  strokeSwatchId) update automatically when the swatch's colour changes. */
export interface Swatch { id: string; name: string; color: string; group?: string; }

/** A reusable, document-level pattern swatch — a named `PatternFill` that can be
 *  applied to any shape from the Patterns panel. */
export interface PatternSwatch { id: string; name: string; fill: PatternFill; }

export type ToolType = ElementType | 'lasso' | 'crop';

/**
 * An anchor on an editable vector path. Position is relative to the element origin
 * (top-left, same convention as `points`). Bézier handles (`in`/`out`) are stored
 * relative to the anchor; absent = no handle (a straight segment on that side).
 * `kind: 'smooth'` keeps the two handles collinear; `'corner'` lets them move freely.
 */
export interface PathAnchor {
    x: number;
    y: number;
    inX?: number;
    inY?: number;
    outX?: number;
    outY?: number;
    kind: 'corner' | 'smooth';
}

/**
 * One subpath of a multi-subpath `path` element — its own ordered anchor list (relative
 * to the element origin) plus a closed flag. Multiple subpaths let a single `path` hold
 * holes (a donut, the counter of an 'O') and disjoint islands; fill uses the even-odd
 * rule so overlapping closed subpaths punch holes. When `pathSubpaths` is present it is
 * the source of truth; the legacy single-subpath `pathAnchors`/`pathClosed` is the
 * fallback for older paths and for node-editable results.
 */
export interface PathSubpath {
    anchors: PathAnchor[];
    closed: boolean;
}

export type AppMode = 'design' | 'presentation' | 'prototype' | 'embed';
export type FillStyle = 'hachure' | 'solid' | 'cross-hatch' | 'zigzag' | 'dots' | 'dashed' | 'zigzag-line' | 'linear' | 'radial' | 'conic' | 'image' | 'mesh' | 'pattern';

/** Pattern-fill motifs (active when fillStyle === 'pattern'). The built-ins are
 *  procedural; 'custom' tiles a captured raster of selected artwork (see `tile`). */
export type PatternType = 'stripes' | 'grid' | 'dots' | 'checker' | 'crosshatch' | 'noise' | 'grunge' | 'custom';

/**
 * Vector pattern fill (active when fillStyle === 'pattern') — a parameterised,
 * seamless repeating motif painted in `color` over an optional `background`.
 * Rasterized + tiled into a shape-clipped buffer at render time (see
 * `utils/pattern-fill.ts`); exports as a real SVG `<pattern>` (`utils/svg-paint.ts`).
 */
export interface PatternFill {
    type: PatternType;
    color: string;          // foreground colour (#rrggbb)
    background?: string;    // tile background; 'transparent' (default) shows the canvas through
    scale?: number;         // overall motif zoom, 0.1–8 (default 1)
    spacing?: number;       // base motif spacing in px (default 12)
    strokeWidth?: number;   // line thickness / dot radius in px (default 2)
    angle?: number;         // rotation of the whole pattern in degrees (default 0)
    /** Seed for the procedural 'noise'/'grunge' motifs. Stored so a texture looks
     *  identical on every redraw, reload and export; vary it for a different grain. */
    seed?: number;

    // Custom pattern (type === 'custom') — a tile captured from selected artwork.
    tile?: string;          // data-URL raster of the source artwork (one tile)
    tileWidth?: number;     // intrinsic tile width in px (before scale)
    tileHeight?: number;    // intrinsic tile height in px (before scale)
}

/**
 * Gradient mesh fill (active when fillStyle === 'mesh'). An `rows × cols` grid
 * of coloured nodes (rows/cols are node counts, each ≥ 2); colours interpolate
 * bilinearly across each cell. Nodes sit on an even grid over the element's
 * bounding box, so only colours are stored (positions are derived).
 */
export interface MeshGradient {
    rows: number;       // node rows (≥ 2)
    cols: number;       // node columns (≥ 2)
    colors: string[];   // row-major node colours, length rows*cols (#rrggbb)
    /** Optional normalized (0..1) node positions, row-major, length rows*cols.
     *  Absent → an even grid. Boundary nodes stay on the 0/1 edges so the mesh
     *  always covers the element; interior nodes may move freely (warped mesh). */
    points?: { x: number; y: number }[];
    /** Smooth (bicubic Catmull-Rom) colour interpolation instead of per-cell
     *  bilinear — removes the soft creases at cell borders (C1). Even grid only. */
    smooth?: boolean;
}
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
// Built-in font keys, plus any custom-font key (e.g. "custom-1") added at runtime.
// The `(string & {})` keeps literal autocomplete for the built-ins while allowing
// arbitrary custom-font keys (see utils/custom-fonts.ts).
export type FontFamily = 'hand-drawn' | 'sans-serif' | 'monospace' | 'caveat' | 'poppins' | 'serif' | 'marker' | 'code' | (string & {});
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

/** One extra fill in the appearance stack. */
export interface PaintFill { color: string; opacity?: number; visible?: boolean; pattern?: PatternFill; }
/** One extra stroke in the appearance stack. */
export interface PaintStroke { color: string; width: number; opacity?: number; dash?: 'solid' | 'dashed' | 'dotted'; dashArray?: number[]; visible?: boolean; }

/**
 * Live "Transform effect" (Illustrator's Effect ▸ Distort & Transform ▸ Transform):
 * a non-destructive modifier that renders `copies` accumulating ghost copies of the
 * element at draw time. Copy k (1..copies) has the transform applied k times, so a
 * per-step rotate/move/scale builds spirals, echoes, and radial fans. `expandTransformEffect`
 * bakes the ghosts into real elements. Rotate/scale pivot about `origin` (bbox fraction,
 * default centre). Absent = no effect (fully back-compatible).
 */
export interface TransformEffect {
    copies: number;        // additional copies beyond the original (0 = no-op)
    moveX?: number;        // per-step translation (element-local px, pre-rotation)
    moveY?: number;
    scaleX?: number;       // per-step scale multiplier (1 = none)
    scaleY?: number;
    rotate?: number;       // per-step rotation, degrees
    reflectX?: boolean;    // reflect each copy horizontally about the origin
    reflectY?: boolean;    // reflect each copy vertically about the origin
    originX?: number;      // rotate/scale pivot, bbox fraction 0..1 (default 0.5)
    originY?: number;
}

/**
 * Live 3D Extrude effect (Illustrator's Effect ▸ 3D ▸ Extrude & Bevel, "3D text" look):
 * a non-destructive modifier that draws an extruded back face + shaded side walls behind
 * the shape at render time, giving it depth. `angle` is the extrusion direction (degrees,
 * 0=right, 90=down), `depth` the length in px, `shade` the wall darkening (0..1). Absent =
 * flat shape (fully back-compatible). Bake with `expandExtrude`.
 */
export interface Extrude3D {
    depth: number;
    angle: number;
    shade?: number;
    rotX?: number;   // tilt about the horizontal axis (deg) — foreshortens vertically
    rotY?: number;   // tilt about the vertical axis (deg) — foreshortens horizontally
    bevel?: number;  // bevel/chamfer size in px on the front edge (0 = flat front)
}

/**
 * Live "Turntable" effect (Adobe Project Turntable / Illustrator Mar-2026): spin a flat
 * 2D vector path around a vertical (or horizontal) axis as if it were a 3D object, keeping
 * the result a clean editable path at every angle. Non-destructive: a per-anchor depth `z`
 * is derived from `depthModel`, each point is rotated by `yaw`/`pitch` and projected back
 * to 2D at render time. `Bake` (`bakeTurntable`) commits the rotated path into `pathAnchors`
 * /`pathSubpaths` and drops this field. Absent = untouched flat path (fully back-compatible).
 * See `docs/turntable-plan.md`.
 */
export interface Turntable {
    axis: 'y' | 'x' | 'free';      // spin about the vertical (default), horizontal, or both
    yaw: number;                    // degrees about the vertical axis (the main slider)
    pitch?: number;                 // degrees of tilt about the horizontal axis
    depthModel: 'flat' | 'symmetry'; // how per-anchor z is derived (flat | symmetry bulge)
    depthScale?: number;            // symmetry bulge strength, px per unit half-width (default 0.6)
    axisX?: number;                 // symmetry mirror axis, element-local x (default: auto-detected)
    perspective?: number;           // 0 = orthographic (default); >0 = perspective divide strength
    baked?: boolean;                // once committed, anchors are replaced and this is cleared
    // ── Phase 2 ──
    reveal?: boolean;               // symmetry back-face: draw a mirrored back layer so the turn
                                    //   reveals occluded parts (reads as a closed 3D volume)
    cx?: number;                    // rotation-centre x, element-local (default: axisX ?? width/2).
    cy?: number;                    // rotation-centre y, element-local (default: height/2).
                                    //   For a GROUP turntable these hold the shared rig centre
                                    //   expressed in each member's own frame, so members orbit
                                    //   the common axis (position + shape) — not just spin in place.
    group?: boolean;                // this element is one member of a multi-element turntable rig
}

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
    /** Custom dash pattern (on/off pixel lengths, e.g. [12,4,3,4]). Overrides `strokeStyle`'s
     *  preset dash when present & non-empty. Empty/undefined → use the `strokeStyle` preset. */
    strokeDashArray?: number[];
    roughness: number;
    opacity: number; // 0-100
    angle: number; // radians
    renderStyle: 'sketch' | 'architectural';
    seed: number;
    roundness: null | { type: number };
    locked: boolean;
    link: string | null;
    tag?: string | null;
    /** Semantic part role for stick-figure-library imports:
     *  'body' | 'head' | 'accent' | 'prop' | 'face' | 'hair'.
     *  Enables one-click per-part recolour (outline vs accent vs hair) of a dropped figure. */
    sfRole?: string;
    /** On a `head` part: the face/hair it currently wears, so it can be restyled
     *  later from the Properties panel (the face is regenerated from the head's bbox). */
    sfFace?: { face: string; hair: string; hairColor: string; headFill: boolean };
    /** On a `face` / `hair` part: the id of the head part it belongs to. Lets a
     *  restyle replace exactly the right marks in a multi-figure scene. */
    sfHeadId?: string;
    /** Finer-grained stick-figure part tag, currently `'leg'` on the leg bones. Garments
     *  are derived from the leg polylines, so this is how a flattened figure gets its
     *  trousers restyled. */
    sfPart?: string;
    /** Which symbol of a typeset equation this path came from (e.g. `'\\pi'`, `'='`, `'2'`).
     *  Set by `Yappy.tex`, which stamps `data-tex-part` on MathJax's token groups before
     *  import; `Yappy.texPart(id, token)` looks elements up by it so a single symbol can be
     *  recoloured, highlighted or morphed on its own. */
    texPart?: string;
    /** Group id of the equation a `texPart` belongs to, so parts of two equations on the
     *  same canvas stay distinguishable. */
    texGroupId?: string;
    /** Animated stick-figure rig payload (element type 'stickRig'). The figure is drawn
     *  procedurally from a motion clip + the global clock; stroke/width come from this element. */
    stickRig?: {
        clip: string;
        speed?: number;
        facing?: 1 | -1;
        playing?: boolean;
        previewPhase?: number;
        /** TRANSIENT (render-override only, set by the frame-timeline evaluator during a
         *  pose tween): blend this pose toward another clip's pose by fraction `f`. */
        blendTo?: { clip: string; phase: number; f: number };
        /** Walk-along-a-path: the figure traverses element `pathId` over `dur` seconds. */
        path?: { pathId: string; dur: number; loop?: boolean; autoFace?: boolean };
        /** Timed action sequence (loops): each step plays `clip` for `dur` seconds. Overrides `clip`. */
        sequence?: { clip: string; dur: number }[];
        /** Expression drawn on the head each frame (see library/stick-figures/face.ts). */
        face?: string;
        /** Hair style drawn on the head each frame. */
        hair?: string;
        /** Fill for solid hair styles. */
        hairColor?: string;
        /** Fill the head white so the face reads over busy artwork. */
        headFill?: boolean;
        /** Trousers drawn under the leg bones (see library/stick-figures/garments.ts). */
        trousers?: string;
        trouserColor?: string;
        shoes?: string;
        shoeColor?: string;
        top?: string;
        topColor?: string;
        neck?: string;
        neckColor?: string;
    };

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
    /** Extra spacing between characters, in px (tracking). Can be negative to tighten. */
    letterSpacing?: number;
    /** Vertical Type: stack characters top→bottom, paragraphs as left→right columns. */
    verticalText?: boolean;
    /** Touch Type: per-character transforms (single-line text). dx/dy in px, scale (1=none), rot in radians.
     *  Optional `color` overrides the element's text colour for that one glyph. */
    charTransforms?: { dx: number; dy: number; scale: number; rot: number; color?: string; font?: string }[];
    /** Arcade visual builder: WHEN→DO game rules attached to this sprite. */
    behaviors?: import('./game/behavior-types').Behavior[];
    /** Width tool: per-point stroke widths along an open path (t in 0..1). */
    widthProfile?: { t: number; width: number }[];
    /** Live Paint: this element is a source outline of the named live-paint group. */
    livePaintGroupId?: string;
    /** Live Paint: this element is a generated region fill for the named group… */
    livePaintFillFor?: string;
    /** …filling the atomic face with this key (subset bitmask). */
    livePaintFaceKey?: string;
    containerId?: string | null;
    textColor?: string;
    textHighlightEnabled?: boolean;
    textHighlightColor?: string;
    textHighlightPadding?: number;
    textHighlightRadius?: number;
    // Text outline (Hollow/Splice text effects): stroke drawn around each glyph
    textStrokeEnabled?: boolean;
    textStrokeColor?: string;
    textStrokeWidth?: number;
    /** Active text-effect preset id (see config/text-effect-presets.ts) */
    textEffect?: string;

    // Rich text: per-span formatting (when present, takes priority over plain text)
    richText?: RichTextSpan[];
    richContainerText?: RichTextSpan[];

    // Text inside shapes (for labels on rectangles, circles, etc.)
    containerText?: string;
    /** Draggable in-shape label offset from its aligned position, in the element's
     *  unrotated local frame (px). Lets the user reposition the text within the shape. */
    textOffsetX?: number;
    textOffsetY?: number;
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
    // Clipping / opacity mask. The mask shape has isClipMask=true (not drawn on its own);
    // each clipped element points at it via clipMaskId. maskType 'clip' = hard vector clip,
    // 'opacity' = the mask's luminance becomes the clipped content's alpha (soft fade).
    isClipMask?: boolean;
    clipMaskId?: string | null;
    maskType?: 'clip' | 'opacity';
    symbolId?: string; // for type 'symbolInstance' — id of the SymbolDef it instances
    /** Animation mode, movieclip instances only: how the clip's own timeline plays
     *  relative to the document playhead. 'loop' (default) wraps, 'once' clamps at
     *  the last frame, 'single' shows only `firstFrame`. */
    loopMode?: 'loop' | 'once' | 'single';
    /** Animation mode, movieclip instances only: the clip-local frame playback starts at (default 0). */
    firstFrame?: number;
    /** Animation mode: stable identity ACROSS keyframes of the same timeline row.
     *  F6 (Insert Keyframe) duplicates elements with fresh ids but copies contentId,
     *  so a motion tween knows which element in the next keyframe continues this one. */
    contentId?: string;
    // Appearance stack — extra fills/strokes drawn OVER the base shape, bottom-to-top.
    // Absent = just the base backgroundColor/strokeColor (fully back-compatible).
    appearance?: { fills?: PaintFill[]; strokes?: PaintStroke[] };
    // Live Transform effect — non-destructive accumulating copies (see TransformEffect).
    // Absent = no effect. Bakeable via expandTransformEffect.
    transformEffect?: TransformEffect;
    // Live 3D Extrude effect — shaded depth behind the shape (see Extrude3D). Bakeable via expandExtrude.
    extrude?: Extrude3D;
    // Live 3D Revolve (lathe) effect — spins the silhouette around its vertical axis into a solid.
    revolve3d?: { on?: boolean };
    // Live Turntable effect — rotate this vector path in pseudo-3D, staying editable (see Turntable).
    // Absent = flat path. Bakeable via bakeTurntable.
    turntable?: Turntable;
    // General Free-Transform shear factors (NOT the perspectiveBlock-specific skewX/skewY
    // below, which warp that shape's 3D back face). Applied about the element centre as the
    // matrix [[1, shearX],[shearY, 1]] — shearX shifts x by shearX·y, shearY shifts y by shearY·x.
    shearX?: number; // Horizontal shear factor (default: 0)
    shearY?: number; // Vertical shear factor (default: 0)
    // Envelope / mesh warp — non-affine free-distort by an R×C control-point grid (row-major
    // `points`, in the centred-local frame). `corners` [TL,TR,BR,BL] is the legacy 2×2 form,
    // still read for back-compat. Absent = no warp. See utils/envelope-warp.ts.
    warp?: { corners?: { x: number; y: number }[]; rows?: number; cols?: number; points?: { x: number; y: number }[]; smooth?: boolean;
        // Named warp preset (Arc/Arch/Flag/Wave/Rise/Bulge) + its bend amount [-1..1]. When set,
        // the control `points` are regenerated from the preset, so a bend slider stays live.
        preset?: string; bend?: number };
    /** Puppet Warp pins (centred-local coords): `base` = rest position, current = {x,y}. The
     *  warp grid is recomputed from pin displacements via RBF interpolation. */
    puppetPins?: { baseX: number; baseY: number; x: number; y: number }[];
    renderScale?: number; // Canvas-level scale for zoom animations (default: 1)
    parentId?: string | null;
    /** After-Effects transform parent: this element inherits the animated
     *  position/rotation/scale of `transformParentId` (composed at render time by the
     *  composition evaluator). Distinct from `parentId` (mindmap tree). See
     *  `docs/after-effects-plan.md` §12. */
    transformParentId?: string | null;
    /** Null object: an invisible transform holder used purely as an animation parent
     *  (renders as a small crosshair gizmo, excluded from export). */
    isNullObject?: boolean;
    /** Non-destructive compound shape (Illustrator "Compound Shapes"). A `path` element
     *  whose `pathSubpaths` are the live boolean result of these RETAINED source elements —
     *  the sources stay editable (release to get them back) and the operation can be changed
     *  after the fact. See `docs/compound-shapes-plan.md` / `makeCompoundShape`. */
    compoundOperands?: DrawingElement[];
    /** The boolean operation combining `compoundOperands` (default 'union'). */
    compoundOp?: 'union' | 'subtract' | 'intersect' | 'exclude';
    /** Adjustment layer: applies its CSS filter (blur/brightness/contrast/…) to everything
     *  rendered BENEATH it, within its bounds. Renders as a dashed gizmo while editing;
     *  the filter effect shows in presentation. See `createAdjustmentLayer`. */
    isAdjustmentLayer?: boolean;
    isCollapsed?: boolean;
    // Editable vector path ('path' element): ordered anchors (relative to origin) +
    // closed flag. The SVG `d` for rendering/hit-test is derived from these.
    pathAnchors?: PathAnchor[];
    pathClosed?: boolean;
    // Multiple subpaths (holes / disjoint islands). When set, supersedes pathAnchors;
    // rendered + hit-tested with the even-odd fill rule. See PathSubpath.
    pathSubpaths?: PathSubpath[];
    // Per-tree mindmap layout direction (set on the root node); drives auto-reflow.
    mindmapDir?: 'horizontal-right' | 'horizontal-left' | 'vertical-down' | 'vertical-up' | 'radial' | 'balanced';
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
    // Bar Chart data (interactive Graph tool) — values normalised to the tallest bar.
    barValues?: number[];
    barLabels?: string[];
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
    // Effects — Feather (soft blurred edges) and Outer Glow (coloured halo, 0 offset)
    featherRadius?: number;            // px; >0 blurs the element's edges
    glowEnabled?: boolean;
    glowColor?: string;
    glowBlur?: number;                 // halo radius (px)
    objectCropMarks?: boolean;         // draw printer crop marks at this element's corners
    // Gradient Properties
    gradientStart?: string; // Deprecated in favor of gradientStops
    gradientEnd?: string;   // Deprecated in favor of gradientStops
    gradientDirection?: number; // Angle in degrees (0-360)
    gradientStops?: GradientStop[];
    gradientType?: GradientType;
    gradientPreset?: string; // Predefined gradient preset ID
    gradientHandlePositions?: { start: Point; end: Point };
    // Stroke gradient (Illustrator "gradient on stroke"). When present, the
    // architectural/SVG stroke is painted with this gradient; sketch strokes stay
    // solid (rough.js can't gradient a hand-drawn stroke) and fall back to strokeColor.
    strokeGradient?: {
        type?: 'linear' | 'radial';
        angle?: number;                // degrees, linear only (default 0 = left→right)
        stops: GradientStop[];         // need ≥2 to render a gradient
    };

    // Image Fill (active when fillStyle === 'image') — paints an image clipped to the shape outline
    backgroundImage?: string;          // Image URL or data URL used as the fill
    backgroundImageFit?: 'cover' | 'contain' | 'fill' | 'tile'; // How the image maps into the shape bounds (default 'cover')
    backgroundOpacity?: number;        // 0-1, opacity of the fill image (default 1)

    // Gradient mesh fill (active when fillStyle === 'mesh') — see MeshGradient
    meshGradient?: MeshGradient;

    // Vector pattern fill (active when fillStyle === 'pattern') — see PatternFill
    patternFill?: PatternFill;

    // Global swatch links — when set, the colour follows the swatch's colour.
    // Cleared automatically if the fill/stroke colour is edited directly.
    fillSwatchId?: string;
    strokeSwatchId?: string;
    // Pattern-swatch link — when set, the pattern fill follows the library swatch
    // (redefining the swatch updates this element). Cleared on any direct pattern edit.
    patternSwatchId?: string;

    // Effects
    blendMode?: BlendMode;
    filter?: string; // CSS filter string (e.g. "blur(5px)")
    isEditing?: boolean;

    // Draw-in animation progress (0-100, undefined = not animating)
    drawProgress?: number;
    /** Fill mode (Alchemy-style): this freehand stroke renders as a filled silhouette.
     *  An explicit flag, NOT inferred from backgroundColor — freehand inherits a
     *  background from defaultElementStyles, so keying off that filled every stroke. */
    fillSilhouette?: boolean;


    // NEW: Robust Animation System
    /** @deprecated Use animations array instead */
    entranceAnimation?: EntranceAnimation;
    animations?: ElementAnimation[];
    isMotionPath?: boolean; // Can this element act as a path for others?

    // Text rendering on paths
    curvedText?: boolean;
    textPathOffset?: number;          // 0..1 start position along the path (default 0 = start / top of a loop)
    textPathSpacing?: number;         // extra px between glyphs for curved text (default 0)
    textPathSide?: 'on' | 'outside';  // baseline placement relative to the path (default 'on')

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
    pressures?: number[];  // Per-point input pressure (0-1), aligned 1:1 with points. Apple Pencil force / pointer pressure. Drives variable width on inkbrush.

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

/**
 * A persistent ruler guide line. `axis: 'h'` is a horizontal guide at world y=`pos`;
 * `axis: 'v'` is a vertical guide at world x=`pos`. Created by dragging off a ruler.
 */
export interface Guide {
    id: string;
    axis: 'h' | 'v';
    pos: number;
}

export interface ViewState {
    scale: number;
    panX: number;
    panY: number;
    /**
     * Canvas (view) rotation in radians, about the viewport center. Default 0.
     * Rotates the whole canvas Procreate-style for comfortable freehand sketching
     * on large illustrations — orthogonal to pan/zoom. Optional so existing
     * persisted/serialized view states (which omit it) load as un-rotated.
     */
    rotation?: number;
}
