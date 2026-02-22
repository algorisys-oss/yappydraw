/**
 * Text Parser — Parses the compact human-readable YappyDSL text format.
 *
 * Grammar:
 *   ---                              # frontmatter start
 *   title: My Diagram
 *   layout: tree-down
 *   hSpacing: 120
 *   ---                              # frontmatter end
 *
 *   # Comments (lines starting with #)
 *
 *   nodeId [shape] "label" { style }  # Node declaration
 *   fromId -> toId "label" { style }  # Edge: arrow
 *   fromId -- toId "label"            # Edge: line
 *   fromId ~> toId "label"            # Edge: bezier arrow
 *   fromId => toId "label"            # Edge: elbow arrow
 *
 *   pool poolId "Pool Label"          # Pool declaration
 *     lane laneId "Lane Label"        # Lane (indented under pool)
 *
 *   nodeId @poolId/laneId             # Pool assignment on node
 *
 *   # Indentation-based children (for mindmaps):
 *   root [rect] "Root"
 *     child1 [rect] "Child 1"
 *       grandchild [rect] "Grandchild"
 */

import type { DSLDiagram, DSLNode, DSLEdge, DSLPool, DSLLane, DSLLayoutConfig, ParseResult, ParseError, DSLNodeStyle } from '../types';

const EDGE_OPERATORS: Record<string, { type: 'arrow' | 'line'; curveType?: 'straight' | 'bezier' | 'elbow' }> = {
    '->': { type: 'arrow' },
    '--': { type: 'line' },
    '~>': { type: 'arrow', curveType: 'bezier' },
    '=>': { type: 'arrow', curveType: 'elbow' },
};

// Regex patterns
const FRONTMATTER_DELIM = /^---\s*$/;
const COMMENT_LINE = /^\s*#/;
const EMPTY_LINE = /^\s*$/;
const POOL_LINE = /^pool\s+(\S+)\s*(?:"([^"]*)")?\s*$/;
const LANE_LINE = /^\s+lane\s+(\S+)\s*(?:"([^"]*)")?\s*(?:\{(.+)\})?\s*$/;

// Node: id [shape] "label" { style } @pool/lane
const NODE_RE = /^(\s*)(\S+)\s*(?:\[([^\]]+)\])?\s*(?:"([^"]*)")?\s*(?:\{([^}]*)\})?\s*(?:@(\S+))?\s*$/;

// Edge: from OP to "label" { style }
const EDGE_RE = /^(\S+)\s*(->|--|~>|=>)\s*(\S+)\s*(?:"([^"]*)")?\s*(?:\{([^}]*)\})?\s*$/;

/**
 * Parse compact text DSL into a DSLDiagram IR.
 */
export function parseTextDSL(input: string): ParseResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];
    const lines = input.split('\n');

    let meta: { title?: string; description?: string } = {};
    let layoutConfig: Partial<DSLLayoutConfig> = {};
    const nodes: DSLNode[] = [];
    const edges: DSLEdge[] = [];
    const pools: DSLPool[] = [];

    let inFrontmatter = false;
    let frontmatterSeen = false;
    let currentPool: DSLPool | null = null;

    // Track indentation for hierarchy
    const indentStack: { indent: number; node: DSLNode }[] = [];

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const rawLine = lines[i];
        const line = rawLine.trimEnd();

        // Frontmatter handling
        if (FRONTMATTER_DELIM.test(line)) {
            if (!frontmatterSeen) {
                inFrontmatter = true;
                frontmatterSeen = true;
                continue;
            } else if (inFrontmatter) {
                inFrontmatter = false;
                continue;
            }
        }

        if (inFrontmatter) {
            parseFrontmatterLine(line, lineNum, meta, layoutConfig, warnings);
            continue;
        }

        // Skip comments and empty lines
        if (COMMENT_LINE.test(line) || EMPTY_LINE.test(line)) {
            currentPool = null; // Reset pool context on blank line
            continue;
        }

        // Pool declaration
        const poolMatch = line.match(POOL_LINE);
        if (poolMatch) {
            currentPool = {
                id: poolMatch[1],
                label: poolMatch[2] || poolMatch[1],
                lanes: [],
            };
            pools.push(currentPool);
            continue;
        }

        // Lane declaration (must be inside pool)
        const laneMatch = line.match(LANE_LINE);
        if (laneMatch) {
            if (!currentPool) {
                errors.push({ line: lineNum, message: 'Lane declaration outside of a pool block.' });
                continue;
            }
            const lane: DSLLane = {
                id: laneMatch[1],
                label: laneMatch[2] || laneMatch[1],
            };
            if (laneMatch[3]) {
                const laneStyle = parseInlineStyle(laneMatch[3], lineNum, warnings);
                if (laneStyle.color) lane.color = laneStyle.color as string;
                if (laneStyle.textColor) lane.textColor = laneStyle.textColor as string;
            }
            currentPool.lanes.push(lane);
            continue;
        }

        // Edge declaration (check before node since node regex is more permissive)
        const edgeMatch = line.match(EDGE_RE);
        if (edgeMatch) {
            currentPool = null;
            const [, from, op, to, label, styleStr] = edgeMatch;
            const edgeDef = EDGE_OPERATORS[op];
            const edge: DSLEdge = {
                from,
                to,
                type: edgeDef.type,
            };
            if (edgeDef.curveType) edge.curveType = edgeDef.curveType;
            if (label) edge.label = label;
            if (styleStr) {
                const parsed = parseInlineStyle(styleStr, lineNum, warnings);
                if (Object.keys(parsed).length > 0) edge.style = parsed as any;
            }
            edges.push(edge);
            continue;
        }

        // Node declaration
        const nodeMatch = line.match(NODE_RE);
        if (nodeMatch) {
            const [, indent, id, shape, label, styleStr, poolRef] = nodeMatch;
            const indentLevel = indent.length;

            // Skip if id looks like a keyword we missed
            if (id === 'pool' || id === 'lane') continue;

            const node: DSLNode = {
                id,
                shape: shape || 'rect',
            };
            if (label) node.label = label;
            if (styleStr) {
                const parsed = parseInlineStyle(styleStr, lineNum, warnings);
                if (Object.keys(parsed).length > 0) {
                    const { style, dimensions, properties } = splitInlineProps(parsed);
                    if (Object.keys(style).length > 0) node.style = style as DSLNodeStyle;
                    if (dimensions.width !== undefined) node.width = dimensions.width;
                    if (dimensions.height !== undefined) node.height = dimensions.height;
                    if (Object.keys(properties).length > 0) node.properties = properties;
                }
            }
            if (poolRef) {
                const parts = poolRef.split('/');
                if (parts.length === 2) {
                    node.pool = { poolId: parts[0], lane: parts[1] };
                } else {
                    warnings.push({ line: lineNum, message: `Invalid pool reference "${poolRef}". Expected format: poolId/laneId.` });
                }
            }

            // Handle indentation hierarchy
            if (indentLevel === 0) {
                nodes.push(node);
                indentStack.length = 0;
                indentStack.push({ indent: 0, node });
            } else {
                // Find parent: walk back up stack to find last node with smaller indent
                while (indentStack.length > 0 && indentStack[indentStack.length - 1].indent >= indentLevel) {
                    indentStack.pop();
                }
                if (indentStack.length > 0) {
                    const parent = indentStack[indentStack.length - 1].node;
                    if (!parent.children) parent.children = [];
                    parent.children.push(node);
                } else {
                    // No parent found, treat as top-level
                    nodes.push(node);
                }
                indentStack.push({ indent: indentLevel, node });
            }

            currentPool = null;
            continue;
        }

        // Unrecognized line
        warnings.push({ line: lineNum, message: `Unrecognized syntax: "${line.trim()}"` });
    }

    // If still in frontmatter, it wasn't closed
    if (inFrontmatter) {
        errors.push({ line: lines.length, message: 'Unclosed frontmatter (missing closing ---). ' });
    }

    // Auto-generate edges from children hierarchy (for mindmaps/org charts)
    generateEdgesFromChildren(nodes, edges);

    // Build diagram
    // Default to 'tree-down' for automatic layout; 'manual' requires explicit x/y
    const layout: DSLLayoutConfig = {
        strategy: (layoutConfig as any).strategy || 'tree-down',
        ...layoutConfig,
    };

    const diagram: DSLDiagram = {
        version: 1,
        meta: Object.keys(meta).length > 0 ? { ...meta, sourceFormat: 'yappy-dsl' } : undefined,
        layout,
        nodes,
        edges,
        pools: pools.length > 0 ? pools : undefined,
    };

    if (errors.length > 0) {
        return { success: false, errors, warnings };
    }

    return { success: true, diagram, errors: [], warnings };
}

// ─── Frontmatter Parsing ─────────────────────────────────

function parseFrontmatterLine(
    line: string,
    lineNum: number,
    meta: Record<string, any>,
    layoutConfig: Record<string, any>,
    warnings: ParseError[]
) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
        if (line.trim()) warnings.push({ line: lineNum, message: `Invalid frontmatter line: "${line.trim()}"` });
        return;
    }

    const key = line.substring(0, colonIndex).trim().toLowerCase();
    const value = line.substring(colonIndex + 1).trim();

    switch (key) {
        case 'title':
            meta.title = value;
            break;
        case 'description':
            meta.description = value;
            break;
        case 'layout':
            layoutConfig.strategy = value;
            break;
        case 'hspacing':
            layoutConfig.hSpacing = parseInt(value, 10);
            break;
        case 'vspacing':
            layoutConfig.vSpacing = parseInt(value, 10);
            break;
        case 'columns':
            layoutConfig.columns = parseInt(value, 10);
            break;
        default:
            warnings.push({ line: lineNum, message: `Unknown frontmatter key: "${key}"` });
    }
}

// ─── Inline Style Parsing ────────────────────────────────

function parseInlineStyle(styleStr: string, _lineNum: number, _warnings: ParseError[]): Record<string, any> {
    // Parse key: value pairs, respecting quoted strings that may contain commas
    // e.g.: backgroundColor: "#fecaca", dsValues: "10, 20, 30", strokeWidth: 2
    const result: Record<string, any> = {};
    const pairs = splitRespectingQuotes(styleStr);

    for (const pair of pairs) {
        const colonIdx = pair.indexOf(':');
        if (colonIdx === -1) continue;

        const key = pair.substring(0, colonIdx).trim();
        let value: string | number | boolean = pair.substring(colonIdx + 1).trim();

        // Strip quotes
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        // Parse booleans
        if (value === 'true') { result[key] = true; continue; }
        if (value === 'false') { result[key] = false; continue; }

        // Try parsing as number
        const num = Number(value);
        if (!isNaN(num) && value !== '') {
            result[key] = num;
        } else {
            result[key] = value;
        }
    }

    return result;
}

/**
 * Split a string by commas, but respect quoted strings (double or single quotes).
 * Commas inside quotes are preserved as part of the value.
 */
function splitRespectingQuotes(str: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuote: string | null = null;

    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (inQuote) {
            current += ch;
            if (ch === inQuote) inQuote = null;
        } else if (ch === '"' || ch === "'") {
            current += ch;
            inQuote = ch;
        } else if (ch === ',') {
            parts.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    if (current.trim()) parts.push(current);

    return parts;
}

// ─── Inline Property Splitting ───────────────────────────

/** Property prefixes that go to node.properties (domain-specific) */
const PROPERTY_PREFIXES = ['ds', 'bpmn', 'code', 'starPoints', 'polygonSides', 'shapeRatio', 'sideRatio', 'depth', 'viewAngle'];

/**
 * Split parsed inline key-value pairs into style, dimensions, and domain properties.
 */
function splitInlineProps(parsed: Record<string, any>): {
    style: Record<string, any>;
    dimensions: { width?: number; height?: number };
    properties: Record<string, any>;
} {
    const style: Record<string, any> = {};
    const dimensions: { width?: number; height?: number } = {};
    const properties: Record<string, any> = {};

    for (const [key, value] of Object.entries(parsed)) {
        if (key === 'width') {
            dimensions.width = typeof value === 'number' ? value : parseInt(value, 10);
        } else if (key === 'height') {
            dimensions.height = typeof value === 'number' ? value : parseInt(value, 10);
        } else if (PROPERTY_PREFIXES.some(p => key.startsWith(p))) {
            properties[key] = value;
        } else {
            style[key] = value;
        }
    }

    return { style, dimensions, properties };
}

// ─── Children → Edges Generation ────────────────────────

/**
 * Walk children hierarchy and generate edges for each parent→child relationship.
 * Only adds edges that don't already exist.
 */
function generateEdgesFromChildren(nodes: DSLNode[], edges: DSLEdge[]) {
    const existingEdges = new Set(edges.map(e => `${e.from}->${e.to}`));

    function walk(parentNodes: DSLNode[]) {
        for (const node of parentNodes) {
            if (node.children && node.children.length > 0) {
                for (const child of node.children) {
                    const key = `${node.id}->${child.id}`;
                    if (!existingEdges.has(key)) {
                        edges.push({
                            from: node.id,
                            to: child.id,
                            type: 'arrow',
                        });
                        existingEdges.add(key);
                    }
                }
                walk(node.children);
            }
        }
    }

    walk(nodes);
}
