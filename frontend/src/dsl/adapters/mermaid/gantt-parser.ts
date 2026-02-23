/**
 * Mermaid Gantt Chart Parser
 * Parses `gantt` syntax into DSL IR with data-driven rendering.
 *
 * Supported:
 *   gantt
 *       title A Gantt Diagram
 *       dateFormat YYYY-MM-DD
 *       section Section A
 *       Task one        :a1, 2024-01-01, 30d
 *       Task two        :after a1, 20d
 *       section Section B
 *       Another task    :2024-01-12, 12d
 *       Critical task   :crit, 2024-02-01, 5d
 *       Done task       :done, 2024-01-01, 10d
 */

import type { DSLDiagram, DSLNode, ParseError } from '../../types';
import type { AdapterResult } from '../adapter-interface';
import { stripQuotes } from './mermaid-utils';

interface GanttTask {
    id: string;
    label: string;
    section: string;
    startDate: string;
    endDate: string;
    duration: number;
    isCritical?: boolean;
    status?: 'done' | 'active' | 'default';
    color?: string;
}

const SECTION_COLORS = [
    '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
];

function addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

function parseDuration(dur: string): number {
    const match = dur.trim().match(/^(\d+)\s*(d|w|h)?$/);
    if (!match) return 1;
    const val = parseInt(match[1]);
    const unit = match[2] || 'd';
    if (unit === 'w') return val * 7;
    return val;
}

export function parseMermaidGantt(input: string): AdapterResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];
    const lines = input.split('\n');

    let title = 'Gantt Chart';
    let headerParsed = false;
    let currentSection = 'Default';
    let sectionIndex = 0;
    const sectionColors = new Map<string, string>();
    const tasks: GanttTask[] = [];
    const taskEndDates = new Map<string, string>();
    let autoId = 0;

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const line = lines[i].trim();

        if (!line || line.startsWith('%%')) continue;

        if (!headerParsed && /^gantt/i.test(line)) {
            headerParsed = true;
            continue;
        }

        if (/^title\s+/i.test(line)) {
            title = stripQuotes(line.replace(/^title\s+/i, '').trim());
            continue;
        }

        // dateFormat, axisFormat, tickInterval, excludes — skip
        if (/^(dateFormat|axisFormat|tickInterval|excludes|todayMarker)\s/i.test(line)) continue;

        if (/^section\s+/i.test(line)) {
            currentSection = line.replace(/^section\s+/i, '').trim();
            if (!sectionColors.has(currentSection)) {
                sectionColors.set(currentSection, SECTION_COLORS[sectionIndex % SECTION_COLORS.length]);
                sectionIndex++;
            }
            continue;
        }

        // Task line: "Task Name :modifiers, id, start, duration"
        // or: "Task Name :after id, duration"
        // or: "Task Name :id, start, duration"
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
            const label = line.slice(0, colonIdx).trim();
            const parts = line.slice(colonIdx + 1).split(',').map(s => s.trim());

            let isCritical = false;
            let status: 'done' | 'active' | 'default' = 'default';
            let taskId = `task-${++autoId}`;
            let startDate = '';
            let duration = 0;

            // Filter out modifiers
            const cleanParts: string[] = [];
            for (const p of parts) {
                if (p === 'crit') { isCritical = true; continue; }
                if (p === 'done') { status = 'done'; continue; }
                if (p === 'active') { status = 'active'; continue; }
                cleanParts.push(p);
            }

            if (cleanParts.length === 3) {
                // id, startDate, duration
                taskId = cleanParts[0];
                startDate = cleanParts[1];
                duration = parseDuration(cleanParts[2]);
            } else if (cleanParts.length === 2) {
                const first = cleanParts[0];
                if (first.startsWith('after ')) {
                    // after ref, duration
                    const refId = first.replace('after ', '').trim();
                    startDate = taskEndDates.get(refId) || new Date().toISOString().slice(0, 10);
                    duration = parseDuration(cleanParts[1]);
                } else if (/^\d{4}-\d{2}-\d{2}$/.test(first)) {
                    // startDate, duration
                    startDate = first;
                    duration = parseDuration(cleanParts[1]);
                } else {
                    // id, duration (start = end of last task or today)
                    taskId = first;
                    startDate = tasks.length > 0 ? tasks[tasks.length - 1].endDate : new Date().toISOString().slice(0, 10);
                    duration = parseDuration(cleanParts[1]);
                }
            } else if (cleanParts.length === 1) {
                // Just duration, auto-chain from last task
                startDate = tasks.length > 0 ? tasks[tasks.length - 1].endDate : new Date().toISOString().slice(0, 10);
                duration = parseDuration(cleanParts[0]);
            } else {
                warnings.push({ line: lineNum, message: `Cannot parse gantt task: "${line}"` });
                continue;
            }

            // Validate/default the start date
            if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
                startDate = tasks.length > 0 ? tasks[tasks.length - 1].endDate : '2024-01-01';
            }

            const endDate = addDays(startDate, duration);

            if (!sectionColors.has(currentSection)) {
                sectionColors.set(currentSection, SECTION_COLORS[sectionIndex % SECTION_COLORS.length]);
                sectionIndex++;
            }

            const task: GanttTask = {
                id: taskId,
                label,
                section: currentSection,
                startDate,
                endDate,
                duration,
                isCritical,
                status,
                color: sectionColors.get(currentSection),
            };

            tasks.push(task);
            taskEndDates.set(taskId, endDate);
            continue;
        }

        if (headerParsed && line.length > 0) {
            warnings.push({ line: lineNum, message: `Unrecognized gantt syntax: "${line}"` });
        }
    }

    if (tasks.length === 0) {
        errors.push({ line: 0, message: 'No tasks found in gantt chart.' });
        return { success: false, errors, warnings };
    }

    // Scale height based on task count
    const chartHeight = Math.max(300, 60 + tasks.length * 32);

    const nodes: DSLNode[] = [{
        id: 'gantt',
        shape: 'ganttChart',
        label: title,
        width: 600,
        height: chartHeight,
        properties: {
            ganttTasks: tasks,
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
