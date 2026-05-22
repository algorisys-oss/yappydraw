/**
 * Sequence Layout Strategy
 * Lays out nodes as a UML sequence diagram:
 * - Participants (lifelines) placed horizontally across the top, all
 *   sharing a uniform total height so their dashed bodies line up.
 * - Messages (edges) are rendered separately by the DSL engine as
 *   horizontal arrows at cascading Y positions — see
 *   `dsl-engine.ts → renderSequenceEdge`. This layout only needs to
 *   reserve enough vertical room.
 *
 * Header-area sizing must stay in lockstep with `umlLifeline` in
 * `uml-general-renderer.ts`, which clamps its head-box to
 * `clamp(h * 0.2, 30, SEQUENCE_HEADER_HEIGHT)`.
 */

import type { DSLNode, DSLEdge } from '../../types';
import type { LayoutPositionMap, LayoutConfig } from '../types';
import type { ElementType } from '../../../types';
import { resolveShapeType } from '../../shape-aliases';
import { getShapeDefaults } from '../../shape-defaults';

/** Maximum header-box height for a lifeline (matches umlLifeline shape cap). */
export const SEQUENCE_HEADER_HEIGHT = 60;
/** Vertical gap between the header bottom and the first message. */
export const SEQUENCE_MESSAGE_TOP_PADDING = 40;
/** Vertical room reserved below the last message. */
export const SEQUENCE_MESSAGE_BOTTOM_PADDING = 40;

/**
 * Compute sequence diagram layout positions.
 */
export function computeSequenceLayout(
    nodes: DSLNode[],
    edges: DSLEdge[],
    config: LayoutConfig
): LayoutPositionMap {
    const positions: LayoutPositionMap = new Map();
    if (nodes.length === 0) return positions;

    const hSpacing = config.hSpacing;
    const vSpacing = config.vSpacing;
    const originX = config.origin.x;
    const originY = config.origin.y;

    // All lifelines share the same total height so the dashed bodies align.
    const totalLifelineHeight = SEQUENCE_HEADER_HEIGHT
        + SEQUENCE_MESSAGE_TOP_PADDING
        + Math.max(1, edges.length) * vSpacing
        + SEQUENCE_MESSAGE_BOTTOM_PADDING;

    // Place participants (lifelines) horizontally
    let currentX = originX;
    for (const node of nodes) {
        const type = resolveShapeType(node.shape) as ElementType;
        const defaults = getShapeDefaults(type);
        const w = node.width ?? defaults.width;
        const explicitH = node.height ?? defaults.height;

        // For lifelines, use the shared tall height; other shapes keep their own.
        const isLifeline = type === 'umlLifeline';
        const h = isLifeline ? Math.max(totalLifelineHeight, explicitH) : explicitH;

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
