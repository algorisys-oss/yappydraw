/**
 * Mermaid Journey Diagram Parser
 * Parses `journey` syntax into DSL IR with data-driven rendering.
 *
 * Supported:
 *   journey
 *       title My working day
 *       section Go to work
 *       Make tea: 5: Me
 *       Go upstairs: 3: Me, Cat
 *       Do work: 1: Me, Cat, Dog
 *       section Go home
 *       Go downstairs: 5: Me
 */

import type { DSLDiagram, DSLNode, ParseError } from '../../types';
import type { AdapterResult } from '../adapter-interface';
import { stripQuotes } from './mermaid-utils';

const TASK_RE = /^\s*(.+?):\s*(\d)\s*:\s*(.+)$/;

const SECTION_COLORS = [
    '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
];

interface JourneyTask {
    label: string;
    score: number;
    actors: string[];
    section: string;
    color?: string;
}

export function parseMermaidJourney(input: string): AdapterResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];
    const lines = input.split('\n');

    let title = 'User Journey';
    let headerParsed = false;
    let currentSection = '';
    let sectionIndex = 0;
    const sectionColors = new Map<string, string>();
    const tasks: JourneyTask[] = [];

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const line = lines[i].trim();

        if (!line || line.startsWith('%%')) continue;

        if (!headerParsed && /^journey/i.test(line)) {
            headerParsed = true;
            continue;
        }

        if (/^title\s+/i.test(line)) {
            title = stripQuotes(line.replace(/^title\s+/i, '').trim());
            continue;
        }

        if (/^section\s+/i.test(line)) {
            currentSection = line.replace(/^section\s+/i, '').trim();
            if (!sectionColors.has(currentSection)) {
                sectionColors.set(currentSection, SECTION_COLORS[sectionIndex % SECTION_COLORS.length]);
                sectionIndex++;
            }
            continue;
        }

        const taskMatch = line.match(TASK_RE);
        if (taskMatch) {
            const score = parseInt(taskMatch[2]);
            if (score < 1 || score > 5) {
                warnings.push({ line: lineNum, message: `Score should be 1-5, got ${score}` });
            }

            if (!sectionColors.has(currentSection)) {
                sectionColors.set(currentSection, SECTION_COLORS[sectionIndex % SECTION_COLORS.length]);
                sectionIndex++;
            }

            tasks.push({
                label: taskMatch[1].trim(),
                score: Math.max(1, Math.min(5, score)),
                actors: taskMatch[3].split(',').map(s => s.trim()),
                section: currentSection,
                color: sectionColors.get(currentSection),
            });
            continue;
        }

        if (headerParsed && line.length > 0) {
            warnings.push({ line: lineNum, message: `Unrecognized journey syntax: "${line}"` });
        }
    }

    if (tasks.length === 0) {
        errors.push({ line: 0, message: 'No tasks found in journey diagram.' });
        return { success: false, errors, warnings };
    }

    // Scale width based on task count
    const chartWidth = Math.max(400, 80 + tasks.length * 80);

    const nodes: DSLNode[] = [{
        id: 'journey',
        shape: 'journeyDiagram',
        label: title,
        width: chartWidth,
        height: 350,
        properties: {
            journeyTasks: tasks,
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
