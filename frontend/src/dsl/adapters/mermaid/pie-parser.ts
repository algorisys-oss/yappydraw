/**
 * Mermaid Pie Chart Parser
 * Parses `pie` syntax into DSL IR with data-driven slice rendering.
 *
 * Supported:
 *   pie title "My Chart"
 *       "Slice A" : 40
 *       "Slice B" : 30
 *       "Slice C" : 30
 *   pie showData
 */

import type { DSLDiagram, DSLNode, ParseError } from '../../types';
import type { AdapterResult } from '../adapter-interface';
import { stripQuotes } from './mermaid-utils';

const SLICE_RE = /^\s*"([^"]+)"\s*:\s*(\d+(?:\.\d+)?)\s*$/;

/** Standard chart color palette — 8 colors cycling. */
const PIE_COLORS = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#22c55e', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#ec4899', // pink
];

export function parseMermaidPie(input: string): AdapterResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];
    const lines = input.split('\n');

    let title = 'Pie Chart';
    let headerParsed = false;
    const slices: { label: string; value: number }[] = [];

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const line = lines[i].trim();

        if (!line || line.startsWith('%%')) continue;

        // Header: pie [showData] [title "..."]
        if (!headerParsed && /^pie\b/i.test(line)) {
            headerParsed = true;
            // Extract inline title: "pie title Browser Market Share" or "pie showData title ..."
            const titleMatch = line.match(/\btitle\s+(.+)$/i);
            if (titleMatch) {
                title = stripQuotes(titleMatch[1].trim());
            }
            continue;
        }

        // Standalone title line: title "My Chart"
        if (/^title\s+/i.test(line)) {
            title = stripQuotes(line.replace(/^title\s+/i, '').trim());
            continue;
        }

        // showData directive — skip
        if (/^showData/i.test(line)) continue;

        // Slice: "Label" : value
        const sliceMatch = line.match(SLICE_RE);
        if (sliceMatch) {
            slices.push({ label: sliceMatch[1], value: parseFloat(sliceMatch[2]) });
            continue;
        }

        if (headerParsed && line.length > 0) {
            warnings.push({ line: lineNum, message: `Unrecognized pie syntax: "${line}"` });
        }
    }

    if (slices.length === 0) {
        errors.push({ line: 0, message: 'No data slices found in pie chart.' });
        return { success: false, errors, warnings };
    }

    // Assign colors to slices
    const coloredSlices = slices.map((s, i) => ({
        label: s.label,
        value: s.value,
        color: PIE_COLORS[i % PIE_COLORS.length],
    }));

    // Single pieChart node with slice data attached via properties
    const nodes: DSLNode[] = [{
        id: 'pie',
        shape: 'pieChart',
        label: title,
        width: 350,
        height: 300,
        properties: {
            pieSlices: coloredSlices,
        },
    }];

    const diagram: DSLDiagram = {
        version: 1,
        meta: { title, sourceFormat: 'mermaid' },
        layout: { strategy: 'grid', columns: 1 },
        nodes,
        edges: [],
    };

    return { success: true, diagram, errors: [], warnings };
}
