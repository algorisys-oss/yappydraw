/**
 * Mermaid XY Chart Parser
 * Parses `xychart-beta` syntax into DSL IR with data-driven rendering.
 *
 * Supported:
 *   xychart-beta
 *       title "Sales Revenue"
 *       x-axis [jan, feb, mar, apr, may]
 *       y-axis "Revenue (in $)" 4000 --> 11000
 *       bar [5000, 6000, 7500, 8200, 9500]
 *       line [5000, 6000, 7500, 8200, 9500]
 */

import type { DSLDiagram, DSLNode, ParseError } from '../../types';
import type { AdapterResult } from '../adapter-interface';
import { stripQuotes } from './mermaid-utils';

const BRACKET_LIST_RE = /\[([^\]]+)\]/;

export function parseMermaidXYChart(input: string): AdapterResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];
    const lines = input.split('\n');

    let title = 'XY Chart';
    let headerParsed = false;
    const xAxis: { labels?: string[]; label?: string } = {};
    const yAxis: { label?: string; min?: number; max?: number } = {};
    let bars: number[] | undefined;
    const linesSeries: number[][] = [];

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const line = lines[i].trim();

        if (!line || line.startsWith('%%')) continue;

        if (!headerParsed && /^xychart-beta/i.test(line)) {
            headerParsed = true;
            continue;
        }

        if (/^title\s+/i.test(line)) {
            title = stripQuotes(line.replace(/^title\s+/i, '').trim());
            continue;
        }

        // x-axis [jan, feb, mar] or x-axis "Label"
        if (/^x-axis\s+/i.test(line)) {
            const rest = line.replace(/^x-axis\s+/i, '').trim();
            const bracketMatch = rest.match(BRACKET_LIST_RE);
            if (bracketMatch) {
                xAxis.labels = bracketMatch[1].split(',').map(s => stripQuotes(s.trim()));
            } else {
                xAxis.label = stripQuotes(rest);
            }
            continue;
        }

        // y-axis "Label" min --> max  or  y-axis "Label"
        if (/^y-axis\s+/i.test(line)) {
            const rest = line.replace(/^y-axis\s+/i, '').trim();
            const rangeMatch = rest.match(/^(.+?)\s+([\d.]+)\s*-->\s*([\d.]+)$/);
            if (rangeMatch) {
                yAxis.label = stripQuotes(rangeMatch[1].trim());
                yAxis.min = parseFloat(rangeMatch[2]);
                yAxis.max = parseFloat(rangeMatch[3]);
            } else {
                yAxis.label = stripQuotes(rest);
            }
            continue;
        }

        // bar [values]
        if (/^bar\s+/i.test(line)) {
            const bracketMatch = line.match(BRACKET_LIST_RE);
            if (bracketMatch) {
                bars = bracketMatch[1].split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
            }
            continue;
        }

        // line [values]
        if (/^line\s+/i.test(line)) {
            const bracketMatch = line.match(BRACKET_LIST_RE);
            if (bracketMatch) {
                const vals = bracketMatch[1].split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
                linesSeries.push(vals);
            }
            continue;
        }

        if (headerParsed && line.length > 0) {
            warnings.push({ line: lineNum, message: `Unrecognized xychart syntax: "${line}"` });
        }
    }

    if (!bars && linesSeries.length === 0) {
        errors.push({ line: 0, message: 'No bar or line data found in xychart.' });
        return { success: false, errors, warnings };
    }

    const nodes: DSLNode[] = [{
        id: 'xychart',
        shape: 'xyChart',
        label: title,
        width: 500,
        height: 350,
        properties: {
            xyChartData: {
                title,
                xAxis,
                yAxis,
                bars,
                lines: linesSeries.length > 0 ? linesSeries : undefined,
            },
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
