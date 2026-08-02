/**
 * YappyDraw DSL - Intermediate Representation Types
 *
 * The DSL IR is the central data structure that all adapters produce
 * and the DSL engine consumes. It describes diagrams declaratively
 * using logical node IDs and edge relationships, with layout handled
 * separately by the layout engine.
 */

import type { FillStyle, StrokeStyle, FontFamily, TextAlign, VerticalAlign, ArrowHead, GradientStop, GradientType, BlendMode } from '../types';

// ─── Diagram ─────────────────────────────────────────────────────

export interface DSLDiagram {
    version: 1;
    meta?: DSLDiagramMeta;
    layout: DSLLayoutConfig;
    nodes: DSLNode[];
    edges: DSLEdge[];
    groups?: DSLGroup[];
    pools?: DSLPool[];
    defaults?: DSLStyleDefaults;
    /**
     * Named colour roles for this diagram. Declare a colour once, then refer to
     * it from any style as `@name`:
     *
     *     palette: { danger: '#ef4444', live: { light: '#2563eb', dark: '#60a5fa' } }
     *     nodes:   [{ id: 'a', shape: 'rectangle', style: { backgroundColor: '@danger' } }]
     *
     * Each role becomes a document swatch, so elements that use it are linked to
     * it: recolour the role and they all follow. The themeable SVG export emits
     * one CSS variable per role, which is what makes a light/dark export work.
     */
    palette?: DSLPalette;
    /**
     * Sequence-diagram timeline. Present only when `layout.strategy === 'sequence'`
     * and the source described richer structure than bare messages (notes,
     * combined fragments, activations, autonumber). When set, the engine renders
     * the ordered `events` timeline; when absent, sequence layout falls back to
     * laying `edges` out as flat cascading arrows (legacy/simple path).
     */
    sequence?: DSLSequenceMeta;
}

export interface DSLDiagramMeta {
    title?: string;
    description?: string;
    sourceFormat?: 'mermaid' | 'plantuml' | 'yappy-dsl' | string;
    /**
     * Makes the render reproducible. Each element's rough.js seed becomes a pure
     * function of this value and the element's DSL id, so the same source yields
     * the same geometry every time. Leave unset for the interactive behaviour of
     * a fresh random seed per element. A node's own `style.seed` still wins.
     */
    seed?: number;
}

// ─── Palette ─────────────────────────────────────────────────────

/**
 * One colour role. The string form is a single colour; the object form carries a
 * dark-theme counterpart used by the themeable SVG export.
 */
export type DSLPaletteRole = string | { light: string; dark?: string };

export type DSLPalette = Record<string, DSLPaletteRole>;

// ─── Layout ──────────────────────────────────────────────────────

export type DSLLayoutStrategy =
    | 'tree-down'
    | 'tree-right'
    | 'tree-up'
    | 'tree-left'
    | 'grid'
    | 'force'
    | 'swimlane'
    | 'sequence'
    | 'radial'
    | 'mindmap-right'
    | 'mindmap-radial'          // dual-side: children alternate left/right of a central node
    | 'mindmap-down-curved'     // top-down tree, curved branch connectors
    | 'mindmap-down-straight'   // top-down tree, straight connectors
    | 'byte-grid'               // linear run of bit/byte cells, grouped into named spans
    | 'manual';

export interface DSLLayoutConfig {
    strategy: DSLLayoutStrategy;
    hSpacing?: number;
    vSpacing?: number;
    columns?: number;
    origin?: { x: number; y: number };
    /**
     * Lay out to fit this many px wide (e.g. 375 for a phone). Reflows — fewer
     * columns, more rows — rather than scaling anything down, and is a budget
     * rather than a promise: content that cannot fit stays wide. Honoured by
     * `byte-grid` and `grid`; other strategies render at natural width.
     * A `targetWidth` render option overrides this, so one source renders at
     * several breakpoints unedited.
     */
    targetWidth?: number;

    // ── byte-grid only ──────────────────────────────────────────
    /** Cell edge length in px (default 44). Cells are square. */
    cellSize?: number;
    /** Vertical room between cell rows, where span labels sit (default 34). */
    rowGap?: number;
    /** Offset column down the left: 'none' (default), 'hex', or 'dec'. */
    gutter?: 'none' | 'hex' | 'dec';
    /** Width of that offset column in px (default 76). */
    gutterWidth?: number;
    /** What one cell represents. Inferred from whether spans use `bits` or `bytes`. */
    unit?: 'bit' | 'byte';
    /** Font size for span labels and gutter offsets (default 15). */
    labelFontSize?: number;
    /** Font size for cell face values (default: scales with cellSize). */
    cellFontSize?: number;
    /** Ink for span labels and gutter offsets (default #1e293b). */
    labelColor?: string;
}

// ─── Nodes ───────────────────────────────────────────────────────

export interface DSLNode {
    id: string;
    shape: string;
    label?: string;
    sections?: {
        attributes?: string;
        methods?: string;
    };
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    style?: DSLNodeStyle;
    properties?: Record<string, any>;
    pool?: { poolId: string; lane: number | string };
    tag?: string;
    children?: DSLNode[];
}

export interface DSLNodeStyle {
    // Core fill & stroke
    strokeColor?: string;
    backgroundColor?: string;
    fillStyle?: FillStyle;
    strokeWidth?: number;
    strokeStyle?: StrokeStyle;
    opacity?: number;
    roughness?: number;
    borderRadius?: number;
    renderStyle?: 'sketch' | 'architectural';
    /** Pin this element's sketch geometry. Overrides any seed derived from `meta.seed`. */
    seed?: number;

    // Text
    fontFamily?: FontFamily;
    fontSize?: number;
    fontWeight?: boolean | string;
    fontStyle?: boolean | string;
    textAlign?: TextAlign;
    verticalAlign?: VerticalAlign;
    textColor?: string;

    // Text highlight
    textHighlightEnabled?: boolean;
    textHighlightColor?: string;
    textHighlightPadding?: number;
    textHighlightRadius?: number;

    // Gradient
    gradientStops?: GradientStop[];
    gradientDirection?: number;
    gradientType?: GradientType;
    gradientPreset?: string;

    // Shadow
    shadowEnabled?: boolean;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;

    // Inner border (double border)
    drawInnerBorder?: boolean;
    innerBorderColor?: string;
    innerBorderDistance?: number;

    // Stroke & fill options
    strokeLineJoin?: 'round' | 'bevel' | 'miter';
    fillDensity?: number;

    // Effects
    blendMode?: BlendMode;
    flipX?: boolean;
    flipY?: boolean;
    angle?: number;
}

// ─── Edges ───────────────────────────────────────────────────────

export interface DSLEdge {
    id?: string;
    from: string;
    to: string;
    label?: string;
    type?: 'arrow' | 'line' | 'organicBranch';
    curveType?: 'straight' | 'bezier' | 'elbow';
    startArrowhead?: ArrowHead;
    endArrowhead?: ArrowHead;
    style?: DSLEdgeStyle;
    properties?: Record<string, any>;
}

export interface DSLEdgeStyle {
    strokeColor?: string;
    strokeWidth?: number;
    strokeStyle?: StrokeStyle;
    opacity?: number;
    /** Pin this edge's sketch geometry. Overrides any seed derived from `meta.seed`. */
    seed?: number;
}

// ─── Sequence Timeline ──────────────────────────────────────────
//
// A sequence diagram is an *ordered* stream of events that each consume
// vertical room: messages, notes, the open/else/close of a combined
// fragment (loop / alt / opt / par / critical / break), and lifeline
// activation spans. Modelling it as a flat edge list (the legacy path)
// cannot express fragments, notes or activations, so richer adapters emit
// this timeline instead. The engine walks it top-to-bottom.

export interface DSLSequenceMeta {
    /** Prefix each message label with an auto-incrementing number. */
    autonumber?: boolean;
    /** Ordered timeline of everything that happens between the lifelines. */
    events: DSLSequenceEvent[];
}

export type DSLSequenceEvent =
    | DSLSeqMessageEvent
    | DSLSeqNoteEvent
    | DSLSeqFragmentStartEvent
    | DSLSeqFragmentSectionEvent
    | DSLSeqFragmentEndEvent
    | DSLSeqActivateEvent
    | DSLSeqDeactivateEvent;

/** A message arrow between two participants. */
export interface DSLSeqMessageEvent {
    kind: 'message';
    edge: DSLEdge;
    /** Activate the *target* lifeline starting at this message (Mermaid `+`). */
    activateTarget?: boolean;
    /** Deactivate the *source* lifeline at this message (Mermaid `-`). */
    deactivateSource?: boolean;
}

/** A free-floating note box anchored over / beside one or more participants. */
export interface DSLSeqNoteEvent {
    kind: 'note';
    placement: 'over' | 'left' | 'right';
    /** Participant ids the note spans (1 for left/right, 1..n for over). */
    participants: string[];
    text: string;
}

/** Opens a combined fragment (loop / alt / opt / par / critical / break / rect). */
export interface DSLSeqFragmentStartEvent {
    kind: 'fragment-start';
    /** Unique id linking start → sections → end. */
    id: string;
    /** Operator keyword shown in the corner tab (loop, alt, opt, par, …). */
    operator: string;
    /** Guard/condition text shown beside the operator. */
    label?: string;
}

/** A divider inside a fragment (alt `else`, par `and`, opt sub-section). */
export interface DSLSeqFragmentSectionEvent {
    kind: 'fragment-section';
    id: string;
    label?: string;
}

/** Closes the most recently opened fragment with this id. */
export interface DSLSeqFragmentEndEvent {
    kind: 'fragment-end';
    id: string;
}

/** Explicit activation (`activate A`). */
export interface DSLSeqActivateEvent {
    kind: 'activate';
    participant: string;
}

/** Explicit deactivation (`deactivate A`). */
export interface DSLSeqDeactivateEvent {
    kind: 'deactivate';
    participant: string;
}

// ─── Groups ──────────────────────────────────────────────────────

export interface DSLGroup {
    id: string;
    label?: string;
    nodeIds: string[];
    style?: DSLNodeStyle;
}

// ─── Pools (BPMN Swimlanes) ─────────────────────────────────────

export interface DSLPool {
    id: string;
    label?: string;
    orientation?: 'horizontal' | 'vertical';
    lanes: DSLLane[];
    style?: DSLNodeStyle;
}

export interface DSLLane {
    id: string;
    label: string;
    color?: string;
    textColor?: string;
}

// ─── Style Defaults ──────────────────────────────────────────────

export interface DSLStyleDefaults {
    node?: DSLNodeStyle;
    edge?: DSLEdgeStyle;
    shapes?: Record<string, DSLNodeStyle>;
}

// ─── Parse/Render Results ────────────────────────────────────────

export interface ParseError {
    line: number;
    column?: number;
    message: string;
}

export interface ParseResult {
    success: boolean;
    diagram?: DSLDiagram;
    errors: ParseError[];
    warnings: ParseError[];
}

export interface RenderOptions {
    clearCanvas?: boolean;
    offsetX?: number;
    offsetY?: number;
    zoomToFit?: boolean;
    /** Lay out for this width in px, overriding `layout.targetWidth`. See DSLLayoutConfig. */
    targetWidth?: number;
}

export interface RenderResult {
    nodeIdMap: Map<string, string>;
    edgeIdMap: Map<string, string>;
    poolIdMap: Map<string, string>;
    elementCount: number;
}
