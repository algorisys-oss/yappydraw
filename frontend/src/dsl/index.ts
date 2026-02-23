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

// Parser — imports trigger MermaidAdapter registration as side effect
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
export { parseMermaidGantt } from './adapters/mermaid/gantt-parser';
export { parseMermaidGitGraph } from './adapters/mermaid/gitgraph-parser';
export { parseMermaidJourney } from './adapters/mermaid/journey-parser';
export { parseMermaidQuadrant } from './adapters/mermaid/quadrant-parser';
export { parseMermaidXYChart } from './adapters/mermaid/xychart-parser';
export { parseMermaidBlock } from './adapters/mermaid/block-parser';
export type { DSLAdapter, AdapterResult } from './adapters/adapter-interface';

// Rocket Backend Exporter
export { exportToRocket, rocketSchemaToDSL } from './adapters/rocket/rocket-exporter';
export type { RocketExportResult, RocketImportSchema, RocketEntity, RocketField, RocketRelation } from './adapters/rocket/types';

// YSL Scripting Language
export { parseYSL, isYSLScript } from './ysl';

// Utilities
export { resolveShapeType, SHAPE_ALIASES } from './shape-aliases';
export { getShapeDefaults } from './shape-defaults';

// ─── Initialization Guard ─────────────────────────────────────────
// Ensure adapters are registered even if tree-shaking affects imports.
// This runs immediately when this module is loaded.
import { adapterRegistry as _registry } from './adapters/adapter-registry';
import { MermaidAdapter as _MermaidAdapter } from './adapters/mermaid/mermaid-adapter';

if (!_registry.get('mermaid')) {
    _registry.register(new _MermaidAdapter());
}
