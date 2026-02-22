/**
 * Mermaid Flowchart Parser
 * Parses Mermaid `graph` / `flowchart` syntax into DSL IR.
 *
 * Supported:
 *   graph TD / graph LR / flowchart TB / flowchart LR ...
 *   Node definitions: A[text], B(text), C{text}, D[(text)], etc.
 *   Edge definitions: A --> B, A -->|label| B, A -- text --> B
 *   Subgraphs: subgraph title ... end
 *   Style classes (classDef, class) — parsed but mapped to DSL styles
 */

import type { DSLDiagram, DSLNode, DSLEdge, DSLGroup, DSLLayoutStrategy, ParseError } from '../../types';
import type { AdapterResult } from '../adapter-interface';
import { mapMermaidShape, cleanNodeId, stripQuotes } from './mermaid-utils';

/** Direction mapping from Mermaid to DSL layout */
const DIRECTION_MAP: Record<string, DSLLayoutStrategy> = {
    'TD': 'tree-down',
    'TB': 'tree-down',
    'BT': 'tree-up',
    'LR': 'tree-right',
    'RL': 'tree-left',
};

/**
 * Parse a Mermaid flowchart/graph block into DSL IR.
 */
export function parseMermaidFlowchart(input: string): AdapterResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];
    const lines = input.split('\n');

    const nodeMap = new Map<string, DSLNode>();
    const edges: DSLEdge[] = [];
    const groups: DSLGroup[] = [];
    const classDefs = new Map<string, Record<string, string>>();
    const classAssignments = new Map<string, string>();

    let direction: DSLLayoutStrategy = 'tree-down';
    let headerParsed = false;

    // Subgraph stack
    const subgraphStack: { id: string; label: string; nodeIds: string[] }[] = [];

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const raw = lines[i];
        const line = raw.trim();

        // Skip empty lines and comments
        if (!line || line.startsWith('%%')) continue;

        // Parse header: graph TD / flowchart LR
        if (!headerParsed && /^(graph|flowchart)\s+/i.test(line)) {
            const match = line.match(/^(?:graph|flowchart)\s+(\w+)/i);
            if (match) {
                const dir = match[1].toUpperCase();
                direction = DIRECTION_MAP[dir] || 'tree-down';
            }
            headerParsed = true;
            continue;
        }

        // classDef: classDef className fill:#f9f,stroke:#333
        if (line.startsWith('classDef ')) {
            const cdMatch = line.match(/^classDef\s+(\S+)\s+(.+)$/);
            if (cdMatch) {
                const [, className, styleStr] = cdMatch;
                classDefs.set(className, parseCssStyle(styleStr));
            }
            continue;
        }

        // class assignment: class nodeId className
        if (line.startsWith('class ')) {
            const clMatch = line.match(/^class\s+(\S+)\s+(\S+)$/);
            if (clMatch) {
                const nodeIds = clMatch[1].split(',');
                const className = clMatch[2];
                for (const nid of nodeIds) {
                    classAssignments.set(nid.trim(), className);
                }
            }
            continue;
        }

        // style directive: style nodeId fill:#f9f,stroke:#333
        if (line.startsWith('style ')) {
            const stMatch = line.match(/^style\s+(\S+)\s+(.+)$/);
            if (stMatch) {
                const nodeId = stMatch[1];
                const styles = parseCssStyle(stMatch[2]);
                // Store as a unique classDef for this node
                classDefs.set(`__style_${nodeId}`, styles);
                classAssignments.set(nodeId, `__style_${nodeId}`);
            }
            continue;
        }

        // subgraph
        if (line.startsWith('subgraph ')) {
            const sgMatch = line.match(/^subgraph\s+(\S+)(?:\s*\["?([^\]"]*)"?\])?(?:\s+(.*))?$/);
            if (sgMatch) {
                const id = sgMatch[1];
                const label = sgMatch[2] || sgMatch[3] || id;
                subgraphStack.push({ id, label: stripQuotes(label), nodeIds: [] });
            }
            continue;
        }

        // end (close subgraph)
        if (line === 'end' && subgraphStack.length > 0) {
            const sg = subgraphStack.pop()!;
            groups.push({
                id: sg.id,
                label: sg.label,
                nodeIds: sg.nodeIds,
            });
            continue;
        }

        // Try to parse as edge(s) — the main content
        const parsed = parseFlowchartLine(line, lineNum, nodeMap, edges, warnings);
        if (parsed) {
            // Track nodes in current subgraph
            if (subgraphStack.length > 0) {
                for (const nodeId of parsed.nodeIds) {
                    subgraphStack[subgraphStack.length - 1].nodeIds.push(nodeId);
                }
            }
            continue;
        }

        // Unrecognized line
        if (headerParsed) {
            warnings.push({ line: lineNum, message: `Unrecognized Mermaid syntax: "${line}"` });
        }
    }

    // Apply class styles to nodes
    for (const [nodeId, className] of classAssignments) {
        const styles = classDefs.get(className);
        const node = nodeMap.get(nodeId);
        if (styles && node) {
            node.style = { ...node.style, ...mapCssToNodeStyle(styles) };
        }
    }

    // Build diagram
    const nodes = Array.from(nodeMap.values());

    if (nodes.length === 0 && edges.length === 0) {
        errors.push({ line: 0, message: 'No nodes or edges found in Mermaid flowchart.' });
        return { success: false, errors, warnings };
    }

    const diagram: DSLDiagram = {
        version: 1,
        meta: { title: 'Mermaid Flowchart', sourceFormat: 'mermaid' },
        layout: { strategy: direction },
        nodes,
        edges,
        groups: groups.length > 0 ? groups : undefined,
    };

    return { success: true, diagram, errors: [], warnings };
}

// ─── Line Parser ────────────────────────────────────────────────

interface LineParseResult {
    nodeIds: string[];
}

/**
 * Parse a single flowchart line that may contain node definitions and/or edges.
 * Mermaid allows chaining: A --> B --> C
 * And inline node definitions: A[Label] --> B{Decision}
 */
function parseFlowchartLine(
    line: string,
    _lineNum: number,
    nodeMap: Map<string, DSLNode>,
    edges: DSLEdge[],
    _warnings: ParseError[]
): LineParseResult | null {
    // Tokenize by finding nodes and edges
    const tokens = tokenizeFlowchartLine(line);
    if (!tokens || tokens.length === 0) return null;

    const nodeIds: string[] = [];

    // Process tokens: alternating nodes and edges
    for (const token of tokens) {
        if (token.type === 'node') {
            const node = ensureNode(token.id, token.shapeText, nodeMap);
            nodeIds.push(node.id);
        } else if (token.type === 'edge') {
            // Edge connects the previous node to the next node
            // Handled after all tokens are collected
        }
    }

    // Build edges from token sequence: node, edge, node, edge, node, ...
    let prevNodeId: string | null = null;
    for (const token of tokens) {
        if (token.type === 'node') {
            if (prevNodeId && token.edgeInfo) {
                edges.push({
                    from: prevNodeId,
                    to: token.id,
                    type: token.edgeInfo.type,
                    label: token.edgeInfo.label,
                    style: token.edgeInfo.strokeStyle ? { strokeStyle: token.edgeInfo.strokeStyle as any } : undefined,
                });
            }
            prevNodeId = token.id;
        }
    }

    return nodeIds.length > 0 ? { nodeIds } : null;
}

// ─── Tokenizer ──────────────────────────────────────────────────

interface NodeToken {
    type: 'node';
    id: string;
    shapeText: string | null;
    edgeInfo?: { type: 'arrow' | 'line'; label?: string; strokeStyle?: string };
}

interface EdgeToken {
    type: 'edge';
    op: string;
    label?: string;
}

type FlowchartToken = NodeToken | EdgeToken;

/**
 * Tokenize a Mermaid flowchart line into node and edge tokens.
 * Handles patterns like: A[Label] -->|text| B{Decision} --> C
 */
function tokenizeFlowchartLine(line: string): FlowchartToken[] | null {
    const tokens: FlowchartToken[] = [];
    let remaining = line.trim();

    // Must start with a node ID
    if (!remaining || /^(graph|flowchart|classDef|class|style|subgraph|end)\b/.test(remaining)) {
        return null;
    }

    let pendingEdge: { type: 'arrow' | 'line'; label?: string; strokeStyle?: string } | null = null;

    while (remaining.length > 0) {
        remaining = remaining.trimStart();
        if (!remaining) break;

        // Try to match an edge operator
        const edgeMatch = matchEdgeOperator(remaining);
        if (edgeMatch && tokens.length > 0) {
            pendingEdge = {
                type: edgeMatch.edgeType,
                label: edgeMatch.label,
                strokeStyle: edgeMatch.strokeStyle,
            };
            remaining = remaining.slice(edgeMatch.consumed).trimStart();
            continue;
        }

        // Try to match a node (id + optional shape)
        const nodeMatch = matchNode(remaining);
        if (nodeMatch) {
            const token: NodeToken = {
                type: 'node',
                id: nodeMatch.id,
                shapeText: nodeMatch.shapeText,
            };
            if (pendingEdge) {
                token.edgeInfo = pendingEdge;
                pendingEdge = null;
            }
            tokens.push(token);
            remaining = remaining.slice(nodeMatch.consumed).trimStart();

            // Check for ::: class syntax after node
            const classMatch = remaining.match(/^:::(\S+)/);
            if (classMatch) {
                remaining = remaining.slice(classMatch[0].length);
            }
            continue;
        }

        // Can't parse further
        break;
    }

    return tokens.length > 0 ? tokens : null;
}

// ─── Edge Operator Matching ─────────────────────────────────────

interface EdgeMatch {
    edgeType: 'arrow' | 'line';
    label?: string;
    strokeStyle?: string;
    consumed: number;
}

function matchEdgeOperator(s: string): EdgeMatch | null {
    // Thick arrow with label: ==>|label|
    let m = s.match(/^==>\|([^|]*)\|\s*/);
    if (m) return { edgeType: 'arrow', label: m[1].trim(), consumed: m[0].length };

    // Arrow with pipe label: -->|label|
    m = s.match(/^-->\|([^|]*)\|\s*/);
    if (m) return { edgeType: 'arrow', label: m[1].trim(), consumed: m[0].length };

    // Arrow with text label: -- text -->
    m = s.match(/^--\s+(.+?)\s*-->\s*/);
    if (m) return { edgeType: 'arrow', label: stripQuotes(m[1].trim()), consumed: m[0].length };

    // Line with text label: -- text ---
    m = s.match(/^--\s+(.+?)\s*---\s*/);
    if (m) return { edgeType: 'line', label: stripQuotes(m[1].trim()), consumed: m[0].length };

    // Dashed arrow: -.->
    m = s.match(/^-\.->\s*/);
    if (m) return { edgeType: 'arrow', strokeStyle: 'dashed', consumed: m[0].length };

    // Dashed arrow with label: -.->|label| or -. text .->
    m = s.match(/^-\.->\|([^|]*)\|\s*/);
    if (m) return { edgeType: 'arrow', label: m[1].trim(), strokeStyle: 'dashed', consumed: m[0].length };

    m = s.match(/^-\.\s+(.+?)\s*\.->\s*/);
    if (m) return { edgeType: 'arrow', label: stripQuotes(m[1].trim()), strokeStyle: 'dashed', consumed: m[0].length };

    // Bidirectional: <-->
    m = s.match(/^<-->\s*/);
    if (m) return { edgeType: 'arrow', consumed: m[0].length };

    // Thick arrow: ==>
    m = s.match(/^==>\s*/);
    if (m) return { edgeType: 'arrow', consumed: m[0].length };

    // Standard arrow: -->
    m = s.match(/^-->\s*/);
    if (m) return { edgeType: 'arrow', consumed: m[0].length };

    // Standard line: ---
    m = s.match(/^---\s*/);
    if (m) return { edgeType: 'line', consumed: m[0].length };

    return null;
}

// ─── Node Matching ──────────────────────────────────────────────

interface NodeMatch {
    id: string;
    shapeText: string | null;
    consumed: number;
}

function matchNode(s: string): NodeMatch | null {
    // Match node ID (alphanumeric, underscore, hyphen)
    const idMatch = s.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)/);
    if (!idMatch) return null;

    const id = idMatch[1];
    let consumed = id.length;
    let shapeText: string | null = null;

    const afterId = s.slice(consumed);

    // Try to match shape brackets after the ID
    // Order matters: longest/most specific first
    const shapeMatch = matchShapeBrackets(afterId);
    if (shapeMatch) {
        shapeText = shapeMatch.text;
        consumed += shapeMatch.consumed;
    }

    return { id: cleanNodeId(id), shapeText, consumed };
}

interface ShapeMatch {
    text: string;
    consumed: number;
}

function matchShapeBrackets(s: string): ShapeMatch | null {
    // {{text}} — hexagon
    let m = s.match(/^(\{\{[^}]*\}\})/);
    if (m) return { text: m[1], consumed: m[0].length };

    // ((text)) — double circle
    m = s.match(/^(\(\([^)]*\)\))/);
    if (m) return { text: m[1], consumed: m[0].length };

    // [(text)] — cylinder/database
    m = s.match(/^(\[\([^\]]*\)\])/);
    if (m) return { text: m[1], consumed: m[0].length };

    // [[text]] — subroutine
    m = s.match(/^(\[\[[^\]]*\]\])/);
    if (m) return { text: m[1], consumed: m[0].length };

    // [/text/] — parallelogram
    m = s.match(/^(\[\/[^\]]*\/\])/);
    if (m) return { text: m[1], consumed: m[0].length };

    // [\text\] — parallelogram reverse
    m = s.match(/^(\[\\[^\]]*\\\])/);
    if (m) return { text: m[1], consumed: m[0].length };

    // >text] — asymmetric
    m = s.match(/^(>[^\]]*\])/);
    if (m) return { text: m[1], consumed: m[0].length };

    // {text} — diamond (rhombus)
    m = s.match(/^(\{[^}]*\})/);
    if (m) return { text: m[1], consumed: m[0].length };

    // (text) — rounded / stadium
    m = s.match(/^(\([^)]*\))/);
    if (m) return { text: m[1], consumed: m[0].length };

    // [text] — rectangle
    m = s.match(/^(\[[^\]]*\])/);
    if (m) return { text: m[1], consumed: m[0].length };

    return null;
}

// ─── Node Creation ──────────────────────────────────────────────

function ensureNode(id: string, shapeText: string | null, nodeMap: Map<string, DSLNode>): DSLNode {
    const existing = nodeMap.get(id);
    if (existing) {
        // Update shape/label if first time we see the shape definition
        if (shapeText && !existing.label) {
            const { shape, label } = mapMermaidShape(shapeText);
            existing.shape = shape;
            existing.label = label || id;
        }
        return existing;
    }

    let shape = 'rect';
    let label = id;

    if (shapeText) {
        const mapped = mapMermaidShape(shapeText);
        shape = mapped.shape;
        label = mapped.label || id;
    }

    const node: DSLNode = { id, shape, label };
    nodeMap.set(id, node);
    return node;
}

// ─── CSS Style Parsing ──────────────────────────────────────────

function parseCssStyle(styleStr: string): Record<string, string> {
    const result: Record<string, string> = {};
    const pairs = styleStr.split(',');
    for (const pair of pairs) {
        const colonIdx = pair.indexOf(':');
        if (colonIdx === -1) continue;
        const key = pair.substring(0, colonIdx).trim();
        const value = pair.substring(colonIdx + 1).trim();
        result[key] = value;
    }
    return result;
}

function mapCssToNodeStyle(css: Record<string, string>): Record<string, any> {
    const style: Record<string, any> = {};
    if (css.fill) style.backgroundColor = css.fill;
    if (css.stroke) style.strokeColor = css.stroke;
    if (css['stroke-width']) style.strokeWidth = parseInt(css['stroke-width'], 10);
    if (css.color) style.textColor = css.color;
    if (css['font-size']) style.fontSize = parseInt(css['font-size'], 10);
    if (css['stroke-dasharray']) style.strokeStyle = 'dashed';
    return style;
}
