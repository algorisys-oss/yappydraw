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
 *
 *   # UML class members — attributes / methods compartments (`;`-separated):
 *   Subject [class] "Subject" { attributes: "count: int", methods: "subscribe(o); notify(data)" }
 *
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

import type { DSLDiagram, DSLNode, DSLEdge, DSLPool, DSLLane, DSLLayoutConfig, ParseResult, ParseError, DSLNodeStyle, DSLSequenceEvent } from '../types';
import type { ArrowHead, StrokeStyle } from '../../types';

interface EdgeOpDef {
    type: 'arrow' | 'line';
    curveType?: 'straight' | 'bezier' | 'elbow';
    /** Sequence message styling: filled head + dashed for replies. */
    endArrowhead?: ArrowHead;
    strokeStyle?: StrokeStyle;
}

const EDGE_OPERATORS: Record<string, EdgeOpDef> = {
    '-->>': { type: 'arrow', endArrowhead: 'triangle', strokeStyle: 'dashed' }, // reply (filled, dashed)
    '->>': { type: 'arrow', endArrowhead: 'triangle' },                          // sync call (filled)
    '-->': { type: 'arrow', strokeStyle: 'dashed' },                             // dashed open
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

// Edge: from OP to "label" { style }  (longest operators first so `-->>` wins over `->`)
const EDGE_RE = /^(\S+)\s*(-->>|->>|-->|->|--|~>|=>)\s*(\S+)\s*(?:"([^"]*)")?\s*(?:\{([^}]*)\})?\s*$/;

// Sequence directives (only honoured when layout === 'sequence')
const SEQ_NOTE_RE = /^note\s+(over|left(?:\s+of)?|right(?:\s+of)?)\s+([^"]+?)\s*"([^"]*)"\s*$/i;
const SEQ_FRAGMENT_RE = /^(loop|alt|opt|par|critical|break|rect)\b\s*(?:"([^"]*)"|(.*))$/i;
const SEQ_SECTION_RE = /^(else|and|option)\b\s*(?:"([^"]*)"|(.*))$/i;
const SEQ_ACTIVATE_RE = /^(activate|deactivate)\s+(\S+)\s*$/i;

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

    // Sequence-diagram timeline (only assembled when layout === 'sequence').
    const seqEvents: DSLSequenceEvent[] = [];
    let seqAutonumber = false;
    let seqFragCounter = 0;
    const seqFragStack: string[] = [];
    const isSequence = () => (layoutConfig as any).strategy === 'sequence';

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

        // ─── Sequence directives (only inside a sequence diagram) ──────
        if (isSequence()) {
            const trimmed = line.trim();

            if (/^autonumber\b/i.test(trimmed)) { seqAutonumber = true; continue; }

            if (/^end\b/i.test(trimmed)) {
                const id = seqFragStack.pop();
                if (id) seqEvents.push({ kind: 'fragment-end', id });
                continue;
            }

            const sectionMatch = trimmed.match(SEQ_SECTION_RE);
            if (sectionMatch && seqFragStack.length > 0) {
                const label = (sectionMatch[2] ?? sectionMatch[3] ?? '').trim();
                seqEvents.push({
                    kind: 'fragment-section',
                    id: seqFragStack[seqFragStack.length - 1],
                    label: label || undefined,
                });
                continue;
            }

            const fragMatch = trimmed.match(SEQ_FRAGMENT_RE);
            if (fragMatch) {
                const id = `frag${++seqFragCounter}`;
                seqFragStack.push(id);
                const label = (fragMatch[2] ?? fragMatch[3] ?? '').trim();
                seqEvents.push({
                    kind: 'fragment-start',
                    id,
                    operator: fragMatch[1].toLowerCase(),
                    label: label || undefined,
                });
                continue;
            }

            const actMatch = trimmed.match(SEQ_ACTIVATE_RE);
            if (actMatch) {
                seqEvents.push({
                    kind: actMatch[1].toLowerCase() === 'activate' ? 'activate' : 'deactivate',
                    participant: actMatch[2],
                });
                continue;
            }

            const noteMatch = trimmed.match(SEQ_NOTE_RE);
            if (noteMatch) {
                const placement = noteMatch[1].toLowerCase().startsWith('left') ? 'left'
                    : noteMatch[1].toLowerCase().startsWith('right') ? 'right' : 'over';
                const ids = noteMatch[2].split(',').map(s => s.trim()).filter(Boolean);
                if (ids.length > 0) {
                    seqEvents.push({ kind: 'note', placement, participants: ids, text: noteMatch[3] });
                }
                continue;
            }
        }

        // Edge declaration (check before node since node regex is more permissive).
        // Sequence messages are commonly indented inside fragments, and sequence
        // layout has no node hierarchy, so match against the trimmed line there.
        const edgeMatch = (isSequence() ? line.trim() : line).match(EDGE_RE);
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
            if (edgeDef.endArrowhead) edge.endArrowhead = edgeDef.endArrowhead;
            if (label) edge.label = label;
            if (styleStr) {
                const parsed = parseInlineStyle(styleStr, lineNum, warnings);
                // Arrowheads are edge-level props (the engine reads edge.startArrowhead /
                // edge.endArrowhead), not style props — hoist them out of the { } block so
                // a UML relation like `sub -> base { endArrowhead: triangle }` actually
                // decorates the head. `none`/`null` mean "no head" (e.g. a diamond-only end).
                for (const key of ['startArrowhead', 'endArrowhead'] as const) {
                    if (key in parsed) {
                        const v = parsed[key];
                        edge[key] = (v === 'none' || v === 'null' || v === null) ? null : v;
                        delete parsed[key];
                    }
                }
                if (Object.keys(parsed).length > 0) edge.style = parsed as any;
            }
            if (edgeDef.strokeStyle) {
                edge.style = { ...(edge.style as any), strokeStyle: edgeDef.strokeStyle };
            }
            edges.push(edge);
            if (isSequence()) seqEvents.push({ kind: 'message', edge });
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
                    const { style, dimensions, properties, sections } = splitInlineProps(parsed);
                    if (Object.keys(style).length > 0) node.style = style as DSLNodeStyle;
                    if (dimensions.width !== undefined) node.width = dimensions.width;
                    if (dimensions.height !== undefined) node.height = dimensions.height;
                    if (Object.keys(properties).length > 0) node.properties = properties;
                    if (sections.attributes !== undefined || sections.methods !== undefined) node.sections = sections;
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

    // Close any unbalanced sequence fragments defensively.
    while (seqFragStack.length > 0) {
        seqEvents.push({ kind: 'fragment-end', id: seqFragStack.pop()! });
    }

    const diagram: DSLDiagram = {
        version: 1,
        meta: Object.keys(meta).length > 0 ? { ...meta, sourceFormat: 'yappy-dsl' } : undefined,
        layout,
        nodes,
        edges,
        pools: pools.length > 0 ? pools : undefined,
        sequence: layout.strategy === 'sequence' && seqEvents.length > 0
            ? { autonumber: seqAutonumber, events: seqEvents }
            : undefined,
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
 * Normalise a UML member list into the newline-separated string the renderers
 * expect (`attributesText` / `methodsText`). Members are separated by `;` (or an
 * explicit newline); each is trimmed and blanks are dropped, e.g.
 *   "count: int; +active: bool"  →  "count: int\n+active: bool"
 */
function parseMemberList(value: any): string {
    return String(value)
        .split(/[;\n]/)
        .map(s => s.trim())
        .filter(Boolean)
        .join('\n');
}

/**
 * Split parsed inline key-value pairs into style, dimensions, domain properties,
 * and UML class sections (`attributes` / `methods`).
 */
function splitInlineProps(parsed: Record<string, any>): {
    style: Record<string, any>;
    dimensions: { width?: number; height?: number };
    properties: Record<string, any>;
    sections: { attributes?: string; methods?: string };
} {
    const style: Record<string, any> = {};
    const dimensions: { width?: number; height?: number } = {};
    const properties: Record<string, any> = {};
    const sections: { attributes?: string; methods?: string } = {};

    for (const [key, value] of Object.entries(parsed)) {
        if (key === 'width') {
            dimensions.width = typeof value === 'number' ? value : parseInt(value, 10);
        } else if (key === 'height') {
            dimensions.height = typeof value === 'number' ? value : parseInt(value, 10);
        } else if (key === 'attributes' || key === 'methods') {
            sections[key] = parseMemberList(value);
        } else if (PROPERTY_PREFIXES.some(p => key.startsWith(p))) {
            properties[key] = value;
        } else {
            style[key] = value;
        }
    }

    return { style, dimensions, properties, sections };
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
