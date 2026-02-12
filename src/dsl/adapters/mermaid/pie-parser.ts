/**
 * Mermaid Pie Chart Parser
 * Parses `pie` syntax into DSL IR.
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

    // Create a pieChart node with the title, plus a legend of text nodes
    const nodes: DSLNode[] = [];

    // Main pie chart shape
    nodes.push({
        id: 'pie',
        shape: 'pieChart',
        label: title,
        width: 240,
        height: 240,
    });

    // Create text labels as a legend below
    const total = slices.reduce((s, sl) => s + sl.value, 0);
    for (let i = 0; i < slices.length; i++) {
        const pct = total > 0 ? ((slices[i].value / total) * 100).toFixed(1) : '0';
        nodes.push({
            id: `legend_${i}`,
            shape: 'text',
            label: `${slices[i].label}: ${slices[i].value} (${pct}%)`,
            width: 200,
            height: 30,
        });
    }

    const diagram: DSLDiagram = {
        version: 1,
        meta: { title, sourceFormat: 'mermaid' },
        layout: { strategy: 'grid', columns: 1, vSpacing: 10 },
        nodes,
        edges: [],
    };

    return { success: true, diagram, errors: [], warnings };
}
