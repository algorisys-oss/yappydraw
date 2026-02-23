/**
 * Rocket State Parser
 *
 * Parses UML State diagram nodes and edges into Rocket state machine definitions.
 *
 * UML State shape data model:
 *   containerText = state name (header)
 *   attributesText = actions: "entry / action\ndo / activity\nexit / cleanup"
 *
 * UML Transition label convention:
 *   "trigger [guard] / effect1, effect2"
 *
 * Examples:
 *   "submit"                              → event: "submit"
 *   "submit [isValid]"                    → event: "submit", guard: "isValid"
 *   "approve [hasPermission] / sendEmail" → event: "approve", guard: "hasPermission", effects: ["sendEmail"]
 */

import type { DSLNode, DSLEdge } from '../../types';
import type {
    ParsedState,
    ParsedTransition,
    ParsedStateMachine,
    RocketStateMachine,
    RocketTransition,
    RocketEntity,
} from './types';

// ─── Transition Label Parsing ──────────────────────────────────

/**
 * Parse a UML transition label: "event [guard] / effect1, effect2"
 */
export function parseTransitionLabel(label: string): Omit<ParsedTransition, 'from' | 'to'> {
    if (!label || !label.trim()) return {};

    let rest = label.trim();
    let event: string | undefined;
    let guard: string | undefined;
    let effects: string[] | undefined;

    // Extract guard: [condition]
    const guardMatch = rest.match(/\[([^\]]+)\]/);
    if (guardMatch) {
        guard = guardMatch[1].trim();
        rest = rest.replace(/\[([^\]]+)\]/, '').trim();
    }

    // Extract effects: / effect1, effect2
    const slashIdx = rest.indexOf('/');
    if (slashIdx >= 0) {
        const effectStr = rest.slice(slashIdx + 1).trim();
        effects = effectStr.split(',').map(e => e.trim()).filter(Boolean);
        rest = rest.slice(0, slashIdx).trim();
    }

    // What remains is the event/trigger name
    if (rest) event = rest;

    return { event, guard, effects };
}

// ─── State Actions Parsing ─────────────────────────────────────

/**
 * Parse state actions from attributesText.
 * Expected format: "entry / action\ndo / activity\nexit / cleanup"
 */
export function parseStateActions(text: string): ParsedState['actions'] | undefined {
    if (!text) return undefined;

    const actions: NonNullable<ParsedState['actions']> = {};
    const lines = text.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        const match = trimmed.match(/^(entry|do|exit)\s*\/\s*(.+)$/i);
        if (match) {
            const keyword = match[1].toLowerCase();
            const action = match[2].trim();
            if (keyword === 'entry') actions.entry = action;
            else if (keyword === 'do') actions.doActivity = action;
            else if (keyword === 'exit') actions.exit = action;
        }
    }

    return Object.keys(actions).length > 0 ? actions : undefined;
}

// ─── State Name Utilities ──────────────────────────────────────

function toSnakeCase(str: string): string {
    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s\-]+/g, '_')
        .toLowerCase();
}

// ─── State Diagram Parsing ─────────────────────────────────────

const STATE_SHAPES = new Set(['state', 'umlstate']);
const PSEUDO_SHAPES = new Set(['statestart', 'stateend', 'statesync']);

export function isStateNode(node: DSLNode): boolean {
    return STATE_SHAPES.has(node.shape.toLowerCase());
}

export function isPseudoStateNode(node: DSLNode): boolean {
    return PSEUDO_SHAPES.has(node.shape.toLowerCase());
}

/**
 * Parse UML State diagram nodes and edges into ParsedStateMachine(s).
 * Groups connected states into separate state machines.
 */
export function parseStateDiagram(
    stateNodes: DSLNode[],
    pseudoNodes: DSLNode[],
    edges: DSLEdge[]
): ParsedStateMachine[] {
    if (stateNodes.length === 0) return [];

    // Build ID lookup for all nodes (state + pseudo)
    const allNodeIds = new Set([
        ...stateNodes.map(n => n.id),
        ...pseudoNodes.map(n => n.id),
    ]);
    const pseudoNodeMap = new Map(pseudoNodes.map(n => [n.id, n]));
    // Filter edges to only those connecting state/pseudo nodes
    const stateEdges = edges.filter(e => allNodeIds.has(e.from) && allNodeIds.has(e.to));

    // Build parsed states
    const parsedStates = new Map<string, ParsedState>();
    for (const node of stateNodes) {
        const name = toSnakeCase(node.label || node.id);
        parsedStates.set(node.id, {
            id: node.id,
            name,
            actions: parseStateActions(node.sections?.attributes || ''),
        });
    }

    // Build transitions, handling pseudo-nodes
    const transitions: ParsedTransition[] = [];
    const initialStateIds = new Set<string>();
    const finalStateIds = new Set<string>();

    for (const edge of stateEdges) {
        const fromPseudo = pseudoNodeMap.get(edge.from);
        const toPseudo = pseudoNodeMap.get(edge.to);
        const fromState = parsedStates.get(edge.from);
        const toState = parsedStates.get(edge.to);

        if (fromPseudo) {
            const shape = fromPseudo.shape.toLowerCase();
            if (shape === 'statestart' && toState) {
                // stateStart → state: marks target as initial
                initialStateIds.add(edge.to);
            } else if (shape === 'statesync' && toState) {
                // Fork: stateSync → multiple states (handled per-edge)
                // Find the incoming edge to this stateSync to get the "from" state
                const incomingEdges = stateEdges.filter(e => e.to === fromPseudo.id && parsedStates.has(e.from));
                for (const incoming of incomingEdges) {
                    const srcState = parsedStates.get(incoming.from);
                    if (srcState) {
                        const parsed = parseTransitionLabel(edge.label || incoming.label || '');
                        transitions.push({
                            from: srcState.name,
                            to: toState.name,
                            ...parsed,
                        });
                    }
                }
            }
            continue;
        }

        if (toPseudo) {
            const shape = toPseudo.shape.toLowerCase();
            if (shape === 'stateend' && fromState) {
                // state → stateEnd: marks source as final
                finalStateIds.add(edge.from);
            } else if (shape === 'statesync' && fromState) {
                // Join: multiple states → stateSync (handled per-edge on outgoing side)
                const outgoingEdges = stateEdges.filter(e => e.from === toPseudo.id && parsedStates.has(e.to));
                for (const outgoing of outgoingEdges) {
                    const tgtState = parsedStates.get(outgoing.to);
                    if (tgtState) {
                        const parsed = parseTransitionLabel(edge.label || outgoing.label || '');
                        transitions.push({
                            from: fromState.name,
                            to: tgtState.name,
                            ...parsed,
                        });
                    }
                }
            }
            continue;
        }

        // Normal state → state transition
        if (fromState && toState) {
            const parsed = parseTransitionLabel(edge.label || '');
            transitions.push({
                from: fromState.name,
                to: toState.name,
                ...parsed,
            });
        }
    }

    // Mark initial/final states
    for (const id of initialStateIds) {
        const state = parsedStates.get(id);
        if (state) state.isInitial = true;
    }
    for (const id of finalStateIds) {
        const state = parsedStates.get(id);
        if (state) state.isFinal = true;
    }

    // Group into connected components
    const components = findConnectedComponents(
        Array.from(parsedStates.keys()),
        stateEdges.filter(e => parsedStates.has(e.from) && parsedStates.has(e.to))
    );

    // Build one ParsedStateMachine per component
    const machines: ParsedStateMachine[] = [];

    for (const componentIds of components) {
        const states = componentIds.map(id => parsedStates.get(id)!).filter(Boolean);
        const stateNames = new Set(states.map(s => s.name));

        const componentTransitions = transitions.filter(
            t => stateNames.has(t.from) || stateNames.has(t.to)
        );

        // Determine initial state
        const initialState = states.find(s => s.isInitial);
        // Fallback: state with no incoming transitions
        let initial = initialState?.name;
        if (!initial) {
            const hasIncoming = new Set(componentTransitions.map(t => t.to));
            const noIncoming = states.find(s => !hasIncoming.has(s.name));
            initial = noIncoming?.name || states[0]?.name;
        }

        machines.push({
            states,
            transitions: componentTransitions,
            initial,
        });
    }

    return machines;
}

/**
 * Find connected components in a graph of state nodes.
 */
function findConnectedComponents(nodeIds: string[], edges: DSLEdge[]): string[][] {
    const parent = new Map<string, string>();
    for (const id of nodeIds) parent.set(id, id);

    function find(x: string): string {
        while (parent.get(x) !== x) {
            parent.set(x, parent.get(parent.get(x)!)!);
            x = parent.get(x)!;
        }
        return x;
    }

    function union(a: string, b: string) {
        const ra = find(a);
        const rb = find(b);
        if (ra !== rb) parent.set(ra, rb);
    }

    for (const edge of edges) {
        if (parent.has(edge.from) && parent.has(edge.to)) {
            union(edge.from, edge.to);
        }
    }

    const groups = new Map<string, string[]>();
    for (const id of nodeIds) {
        const root = find(id);
        if (!groups.has(root)) groups.set(root, []);
        groups.get(root)!.push(id);
    }

    return Array.from(groups.values());
}

// ─── Entity Association ────────────────────────────────────────

/**
 * Try to associate a state machine with an entity by matching
 * state names against entity enum field values.
 */
export function associateWithEntity(
    machine: ParsedStateMachine,
    entities: RocketEntity[]
): { entity: string; field: string } | null {
    if (entities.length === 0) return null;

    const stateNames = new Set(machine.states.map(s => s.name));
    let bestMatch: { entity: string; field: string; score: number } | null = null;

    for (const entity of entities) {
        for (const field of entity.fields) {
            if (!field.enum || field.enum.length < 2) continue;

            // Score: how many enum values match state names
            const enumSet = new Set(field.enum.map((v: string) => toSnakeCase(v)));
            let matches = 0;
            for (const name of stateNames) {
                if (enumSet.has(name)) matches++;
            }

            const score = matches / Math.max(stateNames.size, enumSet.size);

            if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
                bestMatch = { entity: entity.name, field: field.name, score };
            }
        }
    }

    return bestMatch ? { entity: bestMatch.entity, field: bestMatch.field } : null;
}

// ─── Conversion to Rocket Type ─────────────────────────────────

/**
 * Convert a ParsedStateMachine into a RocketStateMachine.
 */
export function convertToRocketStateMachine(
    parsed: ParsedStateMachine,
    entityName: string,
    fieldName: string
): RocketStateMachine {
    const transitions: RocketTransition[] = parsed.transitions.map(t => {
        const rt: RocketTransition = {
            from: t.from,
            to: t.to,
        };
        if (t.event) rt.event = t.event;
        if (t.guard) rt.guard = t.guard;
        if (t.effects && t.effects.length > 0) {
            rt.actions = t.effects.map(e => ({
                type: 'webhook' as const,
                value: e,
            }));
        }
        return rt;
    });

    return {
        entity: entityName,
        field: fieldName,
        definition: {
            initial: parsed.initial || parsed.states[0]?.name || '',
            transitions,
        },
        active: true,
    };
}
