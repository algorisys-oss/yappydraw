/**
 * Mermaid Adapter
 * Top-level adapter that detects the Mermaid diagram type and dispatches
 * to the appropriate sub-parser.
 */

import type { DSLAdapter, AdapterResult } from '../adapter-interface';
import { parseMermaidFlowchart } from './flowchart-parser';
import { parseMermaidSequence } from './sequence-parser';
import { parseMermaidClass } from './class-parser';
import { parseMermaidState } from './state-parser';
import { parseMermaidPie } from './pie-parser';
import { parseMermaidMindmap } from './mindmap-parser';
import { parseMermaidER } from './er-parser';
import { parseMermaidGantt } from './gantt-parser';
import { parseMermaidGitGraph } from './gitgraph-parser';
import { parseMermaidJourney } from './journey-parser';
import { parseMermaidQuadrant } from './quadrant-parser';
import { parseMermaidXYChart } from './xychart-parser';
import { parseMermaidBlock } from './block-parser';

/** Detect the Mermaid diagram type from the first non-empty, non-comment line. */
function detectDiagramType(input: string): string | null {
    const lines = input.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('%%')) continue;

        if (/^(graph|flowchart)\s/i.test(trimmed)) return 'flowchart';
        if (/^sequenceDiagram/i.test(trimmed)) return 'sequence';
        if (/^classDiagram/i.test(trimmed)) return 'class';
        if (/^stateDiagram/i.test(trimmed)) return 'state';
        if (/^erDiagram/i.test(trimmed)) return 'er';
        if (/^gantt/i.test(trimmed)) return 'gantt';
        if (/^pie/i.test(trimmed)) return 'pie';
        if (/^mindmap/i.test(trimmed)) return 'mindmap';
        if (/^gitGraph/i.test(trimmed)) return 'gitgraph';
        if (/^journey/i.test(trimmed)) return 'journey';
        if (/^quadrantChart/i.test(trimmed)) return 'quadrant';
        if (/^xychart-beta/i.test(trimmed)) return 'xychart';
        if (/^block-beta/i.test(trimmed)) return 'block';

        // First meaningful line didn't match any known type
        return null;
    }
    return null;
}

export class MermaidAdapter implements DSLAdapter {
    name = 'mermaid';

    canParse(input: string): boolean {
        return detectDiagramType(input) !== null;
    }

    parse(input: string): AdapterResult {
        const diagramType = detectDiagramType(input);

        switch (diagramType) {
            case 'flowchart':
                return parseMermaidFlowchart(input);

            case 'sequence':
                return parseMermaidSequence(input);

            case 'class':
                return parseMermaidClass(input);

            case 'state':
                return parseMermaidState(input);

            case 'pie':
                return parseMermaidPie(input);

            case 'mindmap':
                return parseMermaidMindmap(input);

            case 'er':
                return parseMermaidER(input);

            case 'gantt':
                return parseMermaidGantt(input);

            case 'gitgraph':
                return parseMermaidGitGraph(input);

            case 'journey':
                return parseMermaidJourney(input);

            case 'quadrant':
                return parseMermaidQuadrant(input);

            case 'xychart':
                return parseMermaidXYChart(input);

            case 'block':
                return parseMermaidBlock(input);

            default:
                return {
                    success: false,
                    errors: [{
                        line: 1,
                        message: `Unsupported Mermaid diagram type. Supported: flowchart, sequence, class, state, pie, mindmap, erDiagram, gantt, gitGraph, journey, quadrantChart, xychart-beta, block-beta.`,
                    }],
                    warnings: [],
                };
        }
    }
}
