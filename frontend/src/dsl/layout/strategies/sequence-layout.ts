/**
 * Sequence Layout Strategy
 * Lays out nodes as a UML sequence diagram:
 * - Participants (lifelines / actors) placed horizontally across the top, all
 *   sharing a uniform total height so their dashed bodies line up.
 * - The vertical timeline (messages, notes, combined fragments, activations)
 *   is computed by `computeSequenceTimeline` and rendered by the DSL engine —
 *   see `dsl-engine.ts → renderSequenceTimeline`. This layout only needs the
 *   timeline's total height to reserve enough vertical room.
 *
 * Header-area sizing must stay in lockstep with `umlLifeline` in
 * `uml-general-renderer.ts`, which clamps its head-box to
 * `clamp(h * 0.2, 30, SEQUENCE_HEADER_HEIGHT)`.
 */

import type { DSLNode, DSLEdge, DSLSequenceMeta, DSLSequenceEvent } from '../../types';
import type { LayoutPositionMap, LayoutConfig } from '../types';
import type { ElementType } from '../../../types';
import { resolveShapeType } from '../../shape-aliases';
import { getShapeDefaults } from '../../shape-defaults';

/** Maximum header-box height for a lifeline (matches umlLifeline shape cap). */
export const SEQUENCE_HEADER_HEIGHT = 60;
/** Vertical gap between the header bottom and the first timeline event. */
export const SEQUENCE_MESSAGE_TOP_PADDING = 40;
/** Vertical room reserved below the last timeline event. */
export const SEQUENCE_MESSAGE_BOTTOM_PADDING = 40;

/** Room below a fragment's operator tab before its first inner event. */
export const FRAGMENT_HEADER_INSET = 36;
/** Room reserved for an `else` / `and` divider label inside a fragment. */
export const FRAGMENT_SECTION_INSET = 30;
/** Room below the last inner event before a fragment's bottom border. */
export const FRAGMENT_BOTTOM_INSET = 18;
/** Vertical gap after a note box. */
export const NOTE_GAP = 16;
/** Minimum note-box height. */
export const NOTE_MIN_HEIGHT = 40;

// ─── Sequence Timeline ───────────────────────────────────────────

export interface SeqPlacement {
    event: DSLSequenceEvent;
    /** Y offset from the lifeline top (i.e. participant element's `y`). */
    y: number;
    /** Box height (notes only). */
    height?: number;
}

export interface SeqFragmentBox {
    id: string;
    operator: string;
    label?: string;
    top: number;
    bottom: number;
    /** Participant ids touched by events nested inside this fragment. */
    participants: Set<string>;
    /** `else` / `and` dividers, in order. */
    sections: { y: number; label?: string }[];
}

export interface SeqActivation {
    participant: string;
    top: number;
    bottom: number;
    /** Nesting depth (0 = innermost-first open) for side-by-side stacking. */
    depth: number;
}

export interface SequenceTimeline {
    /** Total lifeline height (header + padding + timeline + padding). */
    totalHeight: number;
    placements: SeqPlacement[];
    fragments: SeqFragmentBox[];
    activations: SeqActivation[];
    autonumber: boolean;
}

/**
 * Resolve the ordered event list for a sequence diagram. When the source only
 * provided bare messages (legacy text/YSL path), synthesise one message event
 * per edge so the engine always has a single timeline to walk.
 */
export function getSequenceEvents(
    sequence: DSLSequenceMeta | undefined,
    edges: DSLEdge[],
): DSLSequenceEvent[] {
    if (sequence?.events && sequence.events.length > 0) return sequence.events;
    return edges.map(edge => ({ kind: 'message', edge } as DSLSequenceEvent));
}

/** Rough note-box height from its text (no renderer available in layout). */
function estimateNoteHeight(text: string): number {
    const explicitLines = text.split('\n').length;
    const wrapLines = Math.ceil(text.length / 26);
    const lines = Math.max(explicitLines, wrapLines, 1);
    return Math.max(NOTE_MIN_HEIGHT, lines * 18 + 16);
}

/**
 * Walk the ordered timeline assigning each event a Y offset and computing
 * fragment extents + activation spans. Pure and deterministic so both the
 * layout (height) and the engine (placement) get identical geometry.
 */
export function computeSequenceTimeline(
    events: DSLSequenceEvent[],
    vSpacing: number,
    autonumber = false,
): SequenceTimeline {
    const placements: SeqPlacement[] = [];
    const fragments: SeqFragmentBox[] = [];
    const activations: SeqActivation[] = [];
    const openFragments: SeqFragmentBox[] = [];
    const openActivations = new Map<string, SeqActivation[]>();

    let cursor = SEQUENCE_HEADER_HEIGHT + SEQUENCE_MESSAGE_TOP_PADDING;

    const touch = (...ids: string[]) => {
        for (const frag of openFragments) for (const id of ids) frag.participants.add(id);
    };
    const openActivation = (participant: string, y: number) => {
        const stack = openActivations.get(participant) ?? [];
        const act: SeqActivation = { participant, top: y, bottom: y, depth: stack.length };
        stack.push(act);
        openActivations.set(participant, stack);
        activations.push(act);
    };
    const closeActivation = (participant: string, y: number) => {
        const stack = openActivations.get(participant);
        const act = stack?.pop();
        if (act) act.bottom = y;
    };

    for (const event of events) {
        switch (event.kind) {
            case 'message': {
                placements.push({ event, y: cursor });
                touch(event.edge.from, event.edge.to);
                if (event.activateTarget) openActivation(event.edge.to, cursor);
                if (event.deactivateSource) closeActivation(event.edge.from, cursor + vSpacing * 0.5);
                cursor += vSpacing;
                break;
            }
            case 'note': {
                const height = estimateNoteHeight(event.text);
                placements.push({ event, y: cursor, height });
                touch(...event.participants);
                cursor += height + NOTE_GAP;
                break;
            }
            case 'fragment-start': {
                const box: SeqFragmentBox = {
                    id: event.id,
                    operator: event.operator,
                    label: event.label,
                    top: cursor,
                    bottom: cursor,
                    participants: new Set<string>(),
                    sections: [],
                };
                fragments.push(box);
                openFragments.push(box);
                placements.push({ event, y: cursor });
                cursor += FRAGMENT_HEADER_INSET;
                break;
            }
            case 'fragment-section': {
                const box = [...openFragments].reverse().find(f => f.id === event.id)
                    ?? openFragments[openFragments.length - 1];
                box?.sections.push({ y: cursor, label: event.label });
                placements.push({ event, y: cursor });
                cursor += FRAGMENT_SECTION_INSET;
                break;
            }
            case 'fragment-end': {
                cursor += FRAGMENT_BOTTOM_INSET;
                const idx = [...openFragments].map(f => f.id).lastIndexOf(event.id);
                const box = idx >= 0 ? openFragments[idx] : openFragments[openFragments.length - 1];
                if (box) {
                    box.bottom = cursor;
                    const realIdx = openFragments.indexOf(box);
                    if (realIdx >= 0) openFragments.splice(realIdx, 1);
                }
                placements.push({ event, y: cursor });
                break;
            }
            case 'activate':
                openActivation(event.participant, cursor);
                break;
            case 'deactivate':
                closeActivation(event.participant, cursor);
                break;
        }
    }

    // Close anything left dangling at the bottom of the timeline.
    for (const frag of openFragments) frag.bottom = cursor + FRAGMENT_BOTTOM_INSET;
    for (const stack of openActivations.values()) for (const act of stack) act.bottom = cursor;
    if (openFragments.length > 0) cursor += FRAGMENT_BOTTOM_INSET;

    return {
        totalHeight: cursor + SEQUENCE_MESSAGE_BOTTOM_PADDING,
        placements,
        fragments,
        activations,
        autonumber,
    };
}

/**
 * Compute sequence diagram layout positions.
 */
export function computeSequenceLayout(
    nodes: DSLNode[],
    edges: DSLEdge[],
    config: LayoutConfig,
    sequence?: DSLSequenceMeta,
): LayoutPositionMap {
    const positions: LayoutPositionMap = new Map();
    if (nodes.length === 0) return positions;

    const hSpacing = config.hSpacing;
    const vSpacing = config.vSpacing;
    const originX = config.origin.x;
    const originY = config.origin.y;

    // All lifelines share the same total height so the dashed bodies align.
    const timeline = computeSequenceTimeline(
        getSequenceEvents(sequence, edges),
        vSpacing,
        sequence?.autonumber,
    );
    const totalLifelineHeight = timeline.totalHeight;

    // Place participants (lifelines / actors) horizontally.
    let currentX = originX;
    for (const node of nodes) {
        const type = resolveShapeType(node.shape) as ElementType;
        const defaults = getShapeDefaults(type);
        const w = node.width ?? defaults.width;
        const explicitH = node.height ?? defaults.height;

        // Lifelines stretch to the shared height; actors keep their natural
        // head size (the engine draws a dashed lifeline beneath them down to
        // the shared bottom). Other shapes keep their own height.
        const isLifeline = type === 'umlLifeline';
        const h = isLifeline ? totalLifelineHeight : explicitH;

        positions.set(node.id, {
            x: currentX,
            y: originY,
            width: w,
            height: h,
        });

        currentX += w + hSpacing;
    }

    return positions;
}
