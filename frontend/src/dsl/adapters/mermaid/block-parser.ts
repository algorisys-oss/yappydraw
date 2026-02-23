/**
 * Mermaid Block Diagram Parser
 * Parses `block-beta` syntax into DSL IR using individual elements.
 *
 * Supported:
 *   block-beta
 *       columns 3
 *       a["Frontend"] b["Backend"] c["Database"]
 *       d["Cache"]:2 e["Queue"]
 *       space
 *       a --> b
 *       b --> c
 */

import type { DSLDiagram, DSLNode, DSLEdge, ParseError } from '../../types';
import type { AdapterResult } from '../adapter-interface';
import { stripQuotes, mapMermaidShape } from './mermaid-utils';

const EDGE_RE = /^(\S+)\s*(-->|---)\s*(\S+)(?:\s*(?::\s*|\|)(.+?)(?:\|)?)?$/;
const BLOCK_RE = /^([a-zA-Z_][\w-]*)(?:\s*(\[".+?"\]|\(".+?"\)|\{".+?"\}|\[\[".+?"\]\]|\(".+?"\)|\(\(".+?"\)\)))?(?::(\d+))?$/;

const BLOCK_COLORS = [
    { stroke: '#3b82f6', bg: '#eff6ff' },
    { stroke: '#059669', bg: '#ecfdf5' },
    { stroke: '#f59e0b', bg: '#fffbeb' },
    { stroke: '#ef4444', bg: '#fef2f2' },
    { stroke: '#8b5cf6', bg: '#f5f3ff' },
    { stroke: '#06b6d4', bg: '#ecfeff' },
];

export function parseMermaidBlock(input: string): AdapterResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];
    const lines = input.split('\n');

    let headerParsed = false;
    let columns = 3;
    const nodes: DSLNode[] = [];
    const edges: DSLEdge[] = [];
    const nodeMap = new Map<string, DSLNode>();

    // Grid cursor
    let row = 0;
    let col = 0;
    const cellW = 160;
    const cellH = 80;
    const gapX = 20;
    const gapY = 20;

    function advanceCursor(colspan: number) {
        col += colspan;
        if (col >= columns) {
            row++;
            col = 0;
        }
    }

    function currentX() { return col * (cellW + gapX); }
    function currentY() { return row * (cellH + gapY); }

    // First pass: separate block defs from edge defs
    const blockLines: { line: string; lineNum: number }[] = [];
    const edgeLines: { line: string; lineNum: number }[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('%%')) continue;

        if (!headerParsed && /^block-beta/i.test(line)) {
            headerParsed = true;
            continue;
        }

        if (/^columns\s+/i.test(line)) {
            columns = parseInt(line.replace(/^columns\s+/i, '').trim()) || 3;
            continue;
        }

        if (EDGE_RE.test(line)) {
            edgeLines.push({ line, lineNum: i + 1 });
        } else {
            blockLines.push({ line, lineNum: i + 1 });
        }
    }

    // Process block definitions
    for (const { line, lineNum } of blockLines) {
        // A line may contain multiple block definitions separated by spaces
        // But blocks with labels like id["Label"] need careful tokenizing
        const tokens = tokenizeBlockLine(line);

        for (const token of tokens) {
            if (token === 'space' || /^space:(\d+)$/.test(token)) {
                const spanMatch = token.match(/^space:(\d+)$/);
                const span = spanMatch ? parseInt(spanMatch[1]) : 1;
                advanceCursor(span);
                continue;
            }

            const blockMatch = token.match(BLOCK_RE);
            if (blockMatch) {
                const id = blockMatch[1];
                const shapeText = blockMatch[2] || '';
                const colspan = blockMatch[3] ? parseInt(blockMatch[3]) : 1;

                let label = id;
                let shape = 'rectangle';

                if (shapeText) {
                    const mapped = mapMermaidShape(shapeText);
                    shape = mapped.shape;
                    label = stripQuotes(mapped.label);
                }

                const colorIdx = nodes.length % BLOCK_COLORS.length;
                const node: DSLNode = {
                    id,
                    shape,
                    label,
                    x: currentX(),
                    y: currentY(),
                    width: colspan * cellW + (colspan - 1) * gapX,
                    height: cellH,
                    style: {
                        strokeColor: BLOCK_COLORS[colorIdx].stroke,
                        backgroundColor: BLOCK_COLORS[colorIdx].bg,
                        fillStyle: 'solid',
                        strokeWidth: 2,
                        roughness: 0,
                        renderStyle: 'architectural',
                        borderRadius: 8,
                    },
                };

                nodes.push(node);
                nodeMap.set(id, node);
                advanceCursor(colspan);
                continue;
            }

            if (token.length > 0) {
                warnings.push({ line: lineNum, message: `Unrecognized block token: "${token}"` });
            }
        }
    }

    // Process edges
    for (const { line, lineNum } of edgeLines) {
        const edgeMatch = line.match(EDGE_RE);
        if (edgeMatch) {
            const from = edgeMatch[1];
            const edgeType = edgeMatch[2];
            const to = edgeMatch[3];
            const label = edgeMatch[4]?.trim();

            if (!nodeMap.has(from)) {
                warnings.push({ line: lineNum, message: `Unknown source node: "${from}"` });
                continue;
            }
            if (!nodeMap.has(to)) {
                warnings.push({ line: lineNum, message: `Unknown target node: "${to}"` });
                continue;
            }

            edges.push({
                from, to, label,
                type: edgeType === '-->' ? 'arrow' : 'line',
                endArrowhead: edgeType === '-->' ? 'arrow' : null,
            });
        }
    }

    if (nodes.length === 0) {
        errors.push({ line: 0, message: 'No blocks found in block diagram.' });
        return { success: false, errors, warnings };
    }

    const diagram: DSLDiagram = {
        version: 1,
        meta: { title: 'Block Diagram', sourceFormat: 'mermaid' },
        layout: { strategy: 'manual' },
        nodes,
        edges,
    };

    return { success: true, diagram, errors: [], warnings };
}

/** Tokenize a block line, respecting bracket groups. */
function tokenizeBlockLine(line: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let depth = 0;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '[' || ch === '(' || ch === '{') depth++;
        if (ch === ']' || ch === ')' || ch === '}') depth--;

        if (ch === ' ' && depth === 0) {
            if (current.trim()) tokens.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    if (current.trim()) tokens.push(current.trim());
    return tokens;
}
