/**
 * Mermaid State Diagram Parser
 * Parses `stateDiagram-v2` / `stateDiagram` syntax into DSL IR.
 *
 * Supported:
 *   [*] --> State1              (start transition)
 *   State1 --> State2 : label   (transition)
 *   State2 --> [*]              (end transition)
 *   state "Description" as s1   (state with alias)
 *   state fork_state <<fork>>   (fork/join/choice)
 *   state CompositeState {      (nested — flattened for now)
 *     s1 --> s2
 *   }
 */

import type { DSLDiagram, DSLNode, DSLEdge, ParseError } from '../../types';
import type { AdapterResult } from '../adapter-interface';
import { stripQuotes } from './mermaid-utils';

const TRANSITION_RE = /^(\[?\*?\]?|\S+)\s*-->\s*(\[?\*?\]?|\S+)\s*(?::\s*(.+))?$/;
const STATE_ALIAS_RE = /^state\s+"([^"]+)"\s+as\s+(\S+)$/i;
const STATE_STEREO_RE = /^state\s+(\S+)\s+<<(\w+)>>$/i;
const STATE_BLOCK_RE = /^state\s+(\S+)\s*\{$/i;

let startCounter = 0;
let endCounter = 0;

export function parseMermaidState(input: string): AdapterResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];
    const lines = input.split('\n');

    const stateMap = new Map<string, { label: string; shape: string }>();
    const edges: DSLEdge[] = [];
    const aliases = new Map<string, string>(); // alias → label

    let headerParsed = false;
    let nestingDepth = 0;
    startCounter = 0;
    endCounter = 0;

    function ensureState(id: string, label?: string) {
        if (id === '[*]') return; // Handled separately at transition time
        const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
        if (!stateMap.has(cleanId)) {
            const displayLabel = label || aliases.get(id) || id;
            stateMap.set(cleanId, { label: displayLabel, shape: 'state' });
        } else if (label) {
            stateMap.get(cleanId)!.label = label;
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const line = lines[i].trim();

        if (!line || line.startsWith('%%')) continue;

        // Header
        if (!headerParsed && /^stateDiagram(-v2)?/i.test(line)) {
            headerParsed = true;
            continue;
        }

        // Skip direction
        if (/^direction\s/i.test(line)) continue;

        // Closing brace (composite state)
        if (line === '}') {
            if (nestingDepth > 0) nestingDepth--;
            continue;
        }

        // State alias: state "Description" as s1
        const aliasMatch = line.match(STATE_ALIAS_RE);
        if (aliasMatch) {
            const [, label, id] = aliasMatch;
            aliases.set(id, stripQuotes(label));
            ensureState(id, stripQuotes(label));
            continue;
        }

        // State stereotype: state fork_state <<fork>>
        const stereoMatch = line.match(STATE_STEREO_RE);
        if (stereoMatch) {
            const [, id, stereo] = stereoMatch;
            ensureState(id);
            const s = stateMap.get(id.replace(/[^a-zA-Z0-9_-]/g, '_'));
            if (s) {
                if (stereo === 'fork' || stereo === 'join') {
                    s.shape = 'rect';
                    s.label = stereo;
                } else if (stereo === 'choice') {
                    s.shape = 'decision';
                }
            }
            continue;
        }

        // Composite state block: state CompositeState {
        const blockMatch = line.match(STATE_BLOCK_RE);
        if (blockMatch) {
            const [, id] = blockMatch;
            ensureState(id);
            nestingDepth++;
            continue;
        }

        // Transition: State1 --> State2 : label
        const transMatch = line.match(TRANSITION_RE);
        if (transMatch) {
            const [, rawFrom, rawTo, label] = transMatch;

            let fromId: string;
            let toId: string;

            // Handle [*] as start or end
            if (rawFrom === '[*]') {
                fromId = `__start_${startCounter++}`;
                stateMap.set(fromId, { label: '', shape: 'circle' });
            } else {
                fromId = rawFrom.replace(/[^a-zA-Z0-9_-]/g, '_');
                ensureState(rawFrom);
            }

            if (rawTo === '[*]') {
                toId = `__end_${endCounter++}`;
                stateMap.set(toId, { label: '', shape: 'circle' });
            } else {
                toId = rawTo.replace(/[^a-zA-Z0-9_-]/g, '_');
                ensureState(rawTo);
            }

            const edge: DSLEdge = {
                from: fromId,
                to: toId,
                type: 'arrow',
            };
            if (label) edge.label = label.trim();
            edges.push(edge);
            continue;
        }

        // Plain state declaration: StateName (just an identifier on a line by itself)
        if (/^[a-zA-Z_]\w*$/.test(line)) {
            ensureState(line);
            continue;
        }

        // note directives
        if (/^note\s/i.test(line)) continue;

        if (headerParsed && line.length > 0) {
            warnings.push({ line: lineNum, message: `Unrecognized state diagram syntax: "${line}"` });
        }
    }

    // Build nodes
    const nodes: DSLNode[] = [];
    for (const [id, s] of stateMap) {
        const node: DSLNode = {
            id,
            shape: s.shape,
            label: s.label,
        };
        // Start/end circles get a smaller size
        if (id.startsWith('__start_') || id.startsWith('__end_')) {
            node.width = 30;
            node.height = 30;
            node.style = { backgroundColor: id.startsWith('__start_') ? '#1f2937' : '#1f2937' };
        }
        nodes.push(node);
    }

    if (nodes.length === 0) {
        errors.push({ line: 0, message: 'No states found in state diagram.' });
        return { success: false, errors, warnings };
    }

    const diagram: DSLDiagram = {
        version: 1,
        meta: { title: 'Mermaid State Diagram', sourceFormat: 'mermaid' },
        layout: { strategy: 'tree-down', hSpacing: 120, vSpacing: 80 },
        nodes,
        edges,
    };

    return { success: true, diagram, errors: [], warnings };
}
