/**
 * Mermaid Sequence Diagram Parser
 * Parses `sequenceDiagram` syntax into DSL IR with `sequence` layout.
 *
 * Supported:
 *   participant A as Alice
 *   actor B as Bob
 *   A->>B: Message
 *   A-->>B: Dashed message
 *   A-xB: Lost message
 *   Note over A: text
 *   Note over A,B: text
 *   loop/alt/opt/par/rect blocks (treated as warnings, nodes still parsed)
 */

import type { DSLDiagram, DSLNode, DSLEdge, ParseError } from '../../types';
import type { AdapterResult } from '../adapter-interface';
import { stripQuotes } from './mermaid-utils';

// Message arrow patterns: ->> -->> -x --x -> -->
const MESSAGE_RE = /^(\S+?)\s*(--?>>|--?x|--?>|--?)\s*(\S+?)\s*:\s*(.+)$/;
const PARTICIPANT_RE = /^(participant|actor)\s+(\S+?)(?:\s+as\s+(.+))?$/i;
const NOTE_RE = /^Note\s+(over|left of|right of)\s+([^:]+):\s*(.+)$/i;

export function parseMermaidSequence(input: string): AdapterResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];
    const lines = input.split('\n');

    const participantOrder: string[] = [];
    const participantLabels = new Map<string, string>();
    const participantShapes = new Map<string, string>();
    const edges: DSLEdge[] = [];

    let headerParsed = false;

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const line = lines[i].trim();

        if (!line || line.startsWith('%%')) continue;

        // Header
        if (!headerParsed && /^sequenceDiagram/i.test(line)) {
            headerParsed = true;
            continue;
        }

        // Skip block keywords (loop, alt, opt, par, rect, end, else)
        if (/^(loop|alt|opt|par|rect|critical|break|end|else)\b/i.test(line)) {
            continue;
        }

        // autonumber
        if (/^autonumber/i.test(line)) continue;

        // activate/deactivate
        if (/^(activate|deactivate)\s/i.test(line)) continue;

        // Participant/actor declaration
        const partMatch = line.match(PARTICIPANT_RE);
        if (partMatch) {
            const [, type, id, alias] = partMatch;
            const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, '');
            if (!participantOrder.includes(cleanId)) {
                participantOrder.push(cleanId);
            }
            participantLabels.set(cleanId, alias ? stripQuotes(alias.trim()) : cleanId);
            participantShapes.set(cleanId, type.toLowerCase() === 'actor' ? 'actor' : 'lifeline');
            continue;
        }

        // Note
        const noteMatch = line.match(NOTE_RE);
        if (noteMatch) {
            // Notes are informational — skip for now
            continue;
        }

        // Message arrow
        const msgMatch = line.match(MESSAGE_RE);
        if (msgMatch) {
            const [, from, arrow, to, label] = msgMatch;
            const fromId = from.replace(/[^a-zA-Z0-9_-]/g, '');
            const toId = to.replace(/[^a-zA-Z0-9_-]/g, '');

            // Auto-register participants from messages
            if (!participantOrder.includes(fromId)) {
                participantOrder.push(fromId);
                participantLabels.set(fromId, fromId);
                participantShapes.set(fromId, 'lifeline');
            }
            if (!participantOrder.includes(toId)) {
                participantOrder.push(toId);
                participantLabels.set(toId, toId);
                participantShapes.set(toId, 'lifeline');
            }

            const isDashed = arrow.startsWith('--');
            const isLost = arrow.includes('x');

            const edge: DSLEdge = {
                from: fromId,
                to: toId,
                label: label.trim(),
                type: isLost ? 'line' : 'arrow',
            };

            if (isDashed) {
                edge.style = { strokeStyle: 'dashed' };
            }

            edges.push(edge);
            continue;
        }

        if (headerParsed && line.length > 0) {
            warnings.push({ line: lineNum, message: `Unrecognized sequence syntax: "${line}"` });
        }
    }

    // Build nodes from participant order.
    // fontSize 16 keeps participant labels readable inside the 60 px lifeline
    // head-box even when the label wraps to 2 lines (2 × 16 × 1.2 ≈ 38 px fits).
    // The shape default of 28 px would overflow the head-box bottom.
    const nodes: DSLNode[] = participantOrder.map(id => ({
        id,
        shape: participantShapes.get(id) ?? 'lifeline',
        label: participantLabels.get(id) ?? id,
        style: { fontSize: 16 },
    }));

    if (nodes.length === 0) {
        errors.push({ line: 0, message: 'No participants found in sequence diagram.' });
        return { success: false, errors, warnings };
    }

    const diagram: DSLDiagram = {
        version: 1,
        meta: { title: 'Mermaid Sequence Diagram', sourceFormat: 'mermaid' },
        layout: { strategy: 'sequence', hSpacing: 200, vSpacing: 60 },
        nodes,
        edges,
    };

    return { success: true, diagram, errors: [], warnings };
}
