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
}

export interface DSLEdgeStyle {
    strokeColor?: string;
    strokeWidth?: number;
    strokeStyle?: StrokeStyle;
    opacity?: number;
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
