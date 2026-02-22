/**
 * Mermaid Mindmap Parser
 * Parses `mindmap` syntax into DSL IR with mindmap-right layout.
 * Builds nested children hierarchy for expand/collapse support.
 *
 * Supported:
 *   mindmap
 *     root((Central Topic))
 *       Branch A
 *         Leaf A1
 *         Leaf A2
 *       Branch B
 *         Leaf B1
 *
 * Shape brackets (same as flowchart):
 *   ((text)) — circle
 *   (text)   — rounded/capsule
 *   [text]   — rectangle
 *   {{text}} — hexagon
 *   )text(   — bang (cloud)
 *   plain text — rectangle (default)
 */

import type { DSLDiagram, DSLNode, DSLEdge, ParseError } from '../../types';
import type { AdapterResult } from '../adapter-interface';

interface MindmapEntry {
    indent: number;
    node: DSLNode;
}

export function parseMermaidMindmap(input: string): AdapterResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];
    const lines = input.split('\n');

    let headerParsed = false;
    const entries: MindmapEntry[] = [];
    let nodeCounter = 0;

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const trimmed = raw.trim();

        if (!trimmed || trimmed.startsWith('%%')) continue;

        // Header
        if (!headerParsed && /^mindmap\b/i.test(trimmed)) {
            headerParsed = true;
            continue;
        }

        if (!headerParsed) continue;

        // Compute indentation (number of leading spaces)
        const indent = raw.search(/\S/);
        if (indent < 0) continue;

        // Parse node shape + label
        const { shape, label } = parseMindmapNode(trimmed);
        const id = `mm_${nodeCounter++}`;

        entries.push({
            indent,
            node: { id, shape, label, children: [] },
        });
    }

    if (entries.length === 0) {
        errors.push({ line: 0, message: 'No nodes found in mindmap.' });
        return { success: false, errors, warnings };
    }

    // Build nested hierarchy from indentation
    // Root nodes are top-level, stack tracks parent chain
    const roots: DSLNode[] = [];
    const stack: MindmapEntry[] = [];

    for (const entry of entries) {
        // Pop stack until we find a parent with smaller indent
        while (stack.length > 0 && stack[stack.length - 1].indent >= entry.indent) {
            stack.pop();
        }

        if (stack.length > 0) {
            // Add as child of current parent
            const parent = stack[stack.length - 1];
            if (!parent.node.children) parent.node.children = [];
            parent.node.children.push(entry.node);
        } else {
            // Root level node
            roots.push(entry.node);
        }

        stack.push(entry);
    }

    // Generate edges from children hierarchy
    const edges: DSLEdge[] = [];
    generateEdges(roots, edges);

    const diagram: DSLDiagram = {
        version: 1,
        meta: { title: 'Mermaid Mindmap', sourceFormat: 'mermaid' },
        layout: { strategy: 'mindmap-right', hSpacing: 120, vSpacing: 40 },
        nodes: roots,
        edges,
    };

    return { success: true, diagram, errors: [], warnings };
}

/** Walk children hierarchy and generate edges */
function generateEdges(nodes: DSLNode[], edges: DSLEdge[]) {
    for (const node of nodes) {
        if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                edges.push({
                    from: node.id,
                    to: child.id,
                    type: 'line',
                    curveType: 'bezier',
                });
            }
            generateEdges(node.children, edges);
        }
    }
}

/** Parse a mindmap node line into shape + label */
function parseMindmapNode(text: string): { shape: string; label: string } {
    const t = text.trim();

    // ((text)) — circle
    let m = t.match(/^\(\((.+)\)\)$/);
    if (m) return { shape: 'circle', label: m[1].trim() };

    // {{text}} — hexagon
    m = t.match(/^\{\{(.+)\}\}$/);
    if (m) return { shape: 'hexagon', label: m[1].trim() };

    // )text( — cloud/bang
    m = t.match(/^\)(.+)\($/);
    if (m) return { shape: 'cloud', label: m[1].trim() };

    // (text) — capsule/rounded
    m = t.match(/^\((.+)\)$/);
    if (m) return { shape: 'capsule', label: m[1].trim() };

    // [text] — rectangle
    m = t.match(/^\[(.+)\]$/);
    if (m) return { shape: 'rect', label: m[1].trim() };

    // Plain text — rectangle
    return { shape: 'rect', label: t };
}
