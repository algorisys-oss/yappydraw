/**
 * Mermaid Quadrant Chart Parser
 * Parses `quadrantChart` syntax into DSL IR with data-driven rendering.
 *
 * Supported:
 *   quadrantChart
 *       title Reach and engagement
 *       x-axis Low Reach --> High Reach
 *       y-axis Low Engagement --> High Engagement
 *       quadrant-1 We should expand
 *       quadrant-2 Need to promote
 *       quadrant-3 Re-evaluate
 *       quadrant-4 May be improved
 *       Campaign A: [0.3, 0.6]
 *       Campaign B: [0.45, 0.23]
 */

import type { DSLDiagram, DSLNode, ParseError } from '../../types';
import type { AdapterResult } from '../adapter-interface';
import { stripQuotes } from './mermaid-utils';

const POINT_RE = /^\s*(.+?):\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]\s*$/;
const AXIS_RE = /^(x-axis|y-axis)\s+(.+?)\s*-->\s*(.+)$/i;
const QUADRANT_RE = /^quadrant-([1-4])\s+(.+)$/i;

const POINT_COLORS = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b',
    '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
];

export function parseMermaidQuadrant(input: string): AdapterResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];
    const lines = input.split('\n');

    let title = 'Quadrant Chart';
    let headerParsed = false;
    let xAxisLabel: [string, string] = ['Low', 'High'];
    let yAxisLabel: [string, string] = ['Low', 'High'];
    const quadrantLabels: [string, string, string, string] = ['', '', '', ''];
    const points: Array<{ label: string; x: number; y: number; color: string }> = [];

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const line = lines[i].trim();

        if (!line || line.startsWith('%%')) continue;

        if (!headerParsed && /^quadrantChart/i.test(line)) {
            headerParsed = true;
            continue;
        }

        if (/^title\s+/i.test(line)) {
            title = stripQuotes(line.replace(/^title\s+/i, '').trim());
            continue;
        }

        const axisMatch = line.match(AXIS_RE);
        if (axisMatch) {
            const labels: [string, string] = [axisMatch[2].trim(), axisMatch[3].trim()];
            if (axisMatch[1].toLowerCase() === 'x-axis') xAxisLabel = labels;
            else yAxisLabel = labels;
            continue;
        }

        const qMatch = line.match(QUADRANT_RE);
        if (qMatch) {
            quadrantLabels[parseInt(qMatch[1]) - 1] = qMatch[2].trim();
            continue;
        }

        const pMatch = line.match(POINT_RE);
        if (pMatch) {
            const x = parseFloat(pMatch[2]);
            const y = parseFloat(pMatch[3]);
            if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
                points.push({
                    label: stripQuotes(pMatch[1].trim()),
                    x, y,
                    color: POINT_COLORS[points.length % POINT_COLORS.length],
                });
            } else {
                warnings.push({ line: lineNum, message: `Point coordinates must be between 0 and 1: "${line}"` });
            }
            continue;
        }

        if (headerParsed && line.length > 0) {
            warnings.push({ line: lineNum, message: `Unrecognized quadrant syntax: "${line}"` });
        }
    }

    if (points.length === 0 && quadrantLabels.every(l => !l)) {
        errors.push({ line: 0, message: 'No data points or quadrant labels found.' });
        return { success: false, errors, warnings };
    }

    const nodes: DSLNode[] = [{
        id: 'quadrant',
        shape: 'quadrantChart',
        label: title,
        width: 450,
        height: 450,
        properties: {
            quadrantData: { title, xAxisLabel, yAxisLabel, quadrantLabels, points },
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
