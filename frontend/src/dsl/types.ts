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
}

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
    | 'manual';

export interface DSLLayoutConfig {
    strategy: DSLLayoutStrategy;
    hSpacing?: number;
    vSpacing?: number;
    columns?: number;
    origin?: { x: number; y: number };
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
}

export interface RenderResult {
    nodeIdMap: Map<string, string>;
    edgeIdMap: Map<string, string>;
    poolIdMap: Map<string, string>;
    elementCount: number;
}
