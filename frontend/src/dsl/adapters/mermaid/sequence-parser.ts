/**
 * Mermaid Sequence Diagram Parser
 * Parses `sequenceDiagram` syntax into DSL IR with a full `sequence` timeline.
 *
 * Supported:
 *   participant A as Alice / actor B as Bob
 *   autonumber
 *   A->>B: msg        solid filled arrow (synchronous call)
 *   A-->>B: msg       dashed filled arrow (reply / return)
 *   A->B / A-->B      solid / dashed open line
 *   A-)B / A--)B      async (open) arrow
 *   A-xB / A--xB      lost message
 *   A->>+B: msg       activate target B
 *   B-->>-A: msg       deactivate source B
 *   activate A / deactivate A
 *   Note over A: text / Note over A,B: text / Note left of A / Note right of A
 *   loop / alt / opt / par / critical / break / rect … else / and / option … end
 */

import type {
    DSLDiagram, DSLNode, DSLEdge, DSLSequenceEvent, ParseError,
} from '../../types';
import type { ArrowHead, StrokeStyle } from '../../../types';
import type { AdapterResult } from '../adapter-interface';
import { stripQuotes } from './mermaid-utils';

// from  arrow  [+/-]  to  :  label  — the arrow token always carries a head
// char (>>, >, x or ) ) so a hyphen inside a participant id stays unambiguous.
const MESSAGE_RE = /^([^\s:]+?)\s*(--?(?:>>|>|x|\)))\s*([+-]?)\s*([^\s:]+?)\s*:\s*(.*)$/;
const PARTICIPANT_RE = /^(participant|actor)\s+(\S+?)(?:\s+as\s+(.+))?$/i;
const NOTE_RE = /^Note\s+(over|left of|right of)\s+([^:]+):\s*(.+)$/i;
const FRAGMENT_START_RE = /^(loop|alt|opt|par|critical|break|rect)\b\s*(.*)$/i;
const FRAGMENT_SECTION_RE = /^(else|and|option)\b\s*(.*)$/i;

interface ArrowSpec {
    endArrowhead: ArrowHead;
    strokeStyle: StrokeStyle;
    type: 'arrow' | 'line';
}

/** Map a Mermaid arrow token (e.g. `-->>`, `-x`, `-)`) to edge styling. */
function decodeArrow(token: string): ArrowSpec {
    const dashed = token.startsWith('--');
    const head = token.replace(/^--?/, '');
    const strokeStyle: StrokeStyle = dashed ? 'dashed' : 'solid';
    switch (head) {
        case '>>':  return { endArrowhead: 'triangle', strokeStyle, type: 'arrow' }; // sync filled
        case ')':   return { endArrowhead: 'arrow', strokeStyle, type: 'arrow' };     // async open
        case 'x':   return { endArrowhead: 'arrow', strokeStyle, type: 'arrow' };     // lost
        case '>':
        default:    return { endArrowhead: 'arrow', strokeStyle, type: 'arrow' };     // open line
    }
}

export function parseMermaidSequence(input: string): AdapterResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];
    const lines = input.split('\n');

    const participantOrder: string[] = [];
    const participantLabels = new Map<string, string>();
    const participantShapes = new Map<string, string>();
    const edges: DSLEdge[] = [];
    const events: DSLSequenceEvent[] = [];

    let headerParsed = false;
    let autonumber = false;
    let fragmentCounter = 0;
    const fragmentStack: string[] = [];

    const ensureParticipant = (rawId: string, shape: 'lifeline' | 'actor' = 'lifeline'): string => {
        const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
        if (!id) return id;
        if (!participantOrder.includes(id)) {
            participantOrder.push(id);
            participantLabels.set(id, id);
            participantShapes.set(id, shape);
        }
        return id;
    };

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const line = lines[i].trim();
        if (!line || line.startsWith('%%')) continue;

        // Header
        if (!headerParsed && /^sequenceDiagram/i.test(line)) {
            headerParsed = true;
            continue;
        }

        // autonumber
        if (/^autonumber\b/i.test(line)) { autonumber = true; continue; }

        // Fragment end
        if (/^end\b/i.test(line)) {
            const id = fragmentStack.pop();
            if (id) events.push({ kind: 'fragment-end', id });
            continue;
        }

        // Fragment section (else / and / option)
        const sectionMatch = line.match(FRAGMENT_SECTION_RE);
        if (sectionMatch && fragmentStack.length > 0) {
            const [, , label] = sectionMatch;
            events.push({
                kind: 'fragment-section',
                id: fragmentStack[fragmentStack.length - 1],
                label: label?.trim() || undefined,
            });
            continue;
        }

        // Fragment start (loop / alt / opt / par / critical / break / rect)
        const fragMatch = line.match(FRAGMENT_START_RE);
        if (fragMatch) {
            const [, operator, label] = fragMatch;
            const id = `frag${++fragmentCounter}`;
            fragmentStack.push(id);
            events.push({
                kind: 'fragment-start',
                id,
                operator: operator.toLowerCase(),
                label: label?.trim() || undefined,
            });
            continue;
        }

        // activate / deactivate
        const actMatch = line.match(/^(activate|deactivate)\s+(\S+)/i);
        if (actMatch) {
            const [, verb, who] = actMatch;
            const id = ensureParticipant(who);
            events.push({ kind: verb.toLowerCase() === 'activate' ? 'activate' : 'deactivate', participant: id });
            continue;
        }

        // Participant / actor declaration
        const partMatch = line.match(PARTICIPANT_RE);
        if (partMatch) {
            const [, type, rawId, alias] = partMatch;
            const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
            if (!participantOrder.includes(id)) participantOrder.push(id);
            participantLabels.set(id, alias ? stripQuotes(alias.trim()) : id);
            participantShapes.set(id, type.toLowerCase() === 'actor' ? 'actor' : 'lifeline');
            continue;
        }

        // Note
        const noteMatch = line.match(NOTE_RE);
        if (noteMatch) {
            const [, placementRaw, who, text] = noteMatch;
            const placement = placementRaw.toLowerCase().startsWith('left') ? 'left'
                : placementRaw.toLowerCase().startsWith('right') ? 'right' : 'over';
            const ids = who.split(',').map(s => ensureParticipant(s.trim())).filter(Boolean);
            if (ids.length > 0) {
                events.push({ kind: 'note', placement, participants: ids, text: stripQuotes(text.trim()) });
            }
            continue;
        }

        // Message arrow
        const msgMatch = line.match(MESSAGE_RE);
        if (msgMatch) {
            const [, from, arrowToken, actMarker, to, label] = msgMatch;
            const fromId = ensureParticipant(from);
            const toId = ensureParticipant(to);
            const spec = decodeArrow(arrowToken);

            const edge: DSLEdge = {
                from: fromId,
                to: toId,
                label: label.trim(),
                type: spec.type,
                endArrowhead: spec.endArrowhead,
            };
            if (spec.strokeStyle !== 'solid') edge.style = { strokeStyle: spec.strokeStyle };
            edges.push(edge);

            events.push({
                kind: 'message',
                edge,
                activateTarget: actMarker === '+' || undefined,
                deactivateSource: actMarker === '-' || undefined,
            });
            continue;
        }

        if (headerParsed && line.length > 0) {
            warnings.push({ line: lineNum, message: `Unrecognized sequence syntax: "${line}"` });
        }
    }

    // Close any unbalanced fragments defensively.
    while (fragmentStack.length > 0) {
        const id = fragmentStack.pop()!;
        events.push({ kind: 'fragment-end', id });
        warnings.push({ line: 0, message: `Fragment "${id}" was not closed with "end"; auto-closed.` });
    }

    // Build nodes from participant order.
    // fontSize 16 keeps participant labels readable inside the 60 px lifeline
    // head-box even when the label wraps to 2 lines.
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
        sequence: { autonumber, events },
    };

    return { success: true, diagram, errors: [], warnings };
}
