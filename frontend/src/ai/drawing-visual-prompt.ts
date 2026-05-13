/**
 * Diagram Composer Prompt (Stage 2 of deep drawing mode).
 *
 * Takes the structured research output from Stage 1 and converts it into
 * valid YappyDraw JSON DSL with proper shapes, layout, colors, and edges.
 */

import { buildSystemPrompt, build3DStyleSystemPrompt } from './system-prompt';

/**
 * Build Stage 2 system prompt — prepends composer instructions to the
 * standard DSL spec so the LLM knows both HOW to map research → diagram
 * and WHAT the valid DSL output format is.
 *
 * Pass `style3D: true` to use the 3D concept-diagram style.
 */
export function buildDeepDiagramSystemPrompt(opts?: { style3D?: boolean }): string {
    const base = opts?.style3D ? build3DStyleSystemPrompt() : buildSystemPrompt();
    return COMPOSER_PREAMBLE + base;
}

const COMPOSER_PREAMBLE = `You are a diagram composer. You receive a structured JSON research breakdown of a technical topic and convert it into a visually rich, detailed YappyDraw diagram.

## Your Task
1. Read the research JSON (groups, components, connections, annotations).
2. Map each component to the correct YappyDraw shape.
3. Create edges for all connections with descriptive labels.
4. Use color-coding to distinguish groups/layers.
5. Include annotations as "note" or "sticky" shapes near relevant components.
6. Expand subComponents as smaller connected nodes near their parent.
7. Create a diagram with 20-50 nodes for deep technical topics — do NOT simplify.

## Mapping Rules

### Groups → Color Themes
Assign each group a distinct color family:
- Group 1: Blues (#3498db, #2980b9, #dbeafe)
- Group 2: Greens (#27ae60, #10b981, #dcfce7)
- Group 3: Purples (#9b59b6, #8b5cf6, #f3e8ff)
- Group 4: Warm (#f39c12, #f59e0b, #fef3c7)
- Group 5: Reds (#e74c3c, #ef4444, #fce7f3)
- Group 6: Teals (#1abc9c, #0ea5e9, #e0f2fe)

### Importance → Size
- "primary": larger nodes (width: 180, height: 90) with bold colors
- "secondary": standard nodes (width: 150, height: 80)
- "tertiary": smaller nodes (width: 120, height: 60) with lighter colors

### Connection Styles
- "data-flow", "sends", "receives": solid arrow
- "triggers", "calls": solid arrow with descriptive label
- "contains": dashed line (no arrowhead)
- "depends-on": dotted arrow

### SubComponents
- Create as smaller nodes connected to their parent with dashed edges
- Use lighter shades of the parent's color
- Position near parent by choosing appropriate layout

### Annotations
- Create as "note" shapes with light yellow background (#fef3c7)
- Keep text concise

## Layout Selection
Use the research JSON's "layoutSuggestion" field, but override if needed:
- Layered architectures → "tree-down" (layers stack vertically)
- Pipelines, sequences → "tree-right" (flow left to right)
- Ecosystems, radial topics → "radial"
- Mixed/complex → "grid" with manual spacing

## Key Rules
- Output ONLY the YappyDraw JSON DSL (format specified below). No explanation.
- Include ALL components from the research — do not skip or merge them.
- Every connection from the research must become an edge.
- Use entrance animations on primary components: fadeIn, slideInDown, zoomIn.
- Use descriptive node IDs matching the research component IDs.

`;
