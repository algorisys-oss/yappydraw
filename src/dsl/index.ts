/**
 * YappyDraw DSL — Public API
 */

// Types
export type {
    DSLDiagram, DSLNode, DSLEdge, DSLGroup, DSLPool, DSLLane,
    DSLLayoutConfig, DSLLayoutStrategy,
    DSLNodeStyle, DSLEdgeStyle, DSLStyleDefaults,
    DSLDiagramMeta,
    ParseResult, ParseError, RenderOptions, RenderResult,
} from './types';

// Parser
export { parseDSL, parseJsonDSL, parseTextDSL, validateDiagram } from './parser';

// Engine
export { renderDiagram } from './engine/dsl-engine';

// Adapters
export { adapterRegistry } from './adapters/adapter-registry';
export { MermaidAdapter } from './adapters/mermaid/mermaid-adapter';
export { parseMermaidFlowchart } from './adapters/mermaid/flowchart-parser';
export { parseMermaidSequence } from './adapters/mermaid/sequence-parser';
export { parseMermaidClass } from './adapters/mermaid/class-parser';
export { parseMermaidState } from './adapters/mermaid/state-parser';
export type { DSLAdapter, AdapterResult } from './adapters/adapter-interface';

// Utilities
export { resolveShapeType, SHAPE_ALIASES } from './shape-aliases';
export { getShapeDefaults } from './shape-defaults';
