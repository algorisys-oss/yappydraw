/**
 * Sequence Layout Strategy
 * Lays out nodes as a UML sequence diagram:
 * - Participants (lifelines) placed horizontally across the top
 * - Messages (edges) rendered as horizontal arrows at increasing vertical offsets
 *
 * Nodes become lifelines; edges become messages between lifelines.
 */

import type { DSLNode, DSLEdge } from '../../types';
import type { LayoutPositionMap, LayoutConfig } from '../types';
import type { ElementType } from '../../../types';
import { resolveShapeType } from '../../shape-aliases';
import { getShapeDefaults } from '../../shape-defaults';

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

    // Place participants (lifelines) horizontally
    let currentX = originX;
    for (const node of nodes) {
        const type = resolveShapeType(node.shape) as ElementType;
        const defaults = getShapeDefaults(type);
        const w = node.width ?? defaults.width;
        const h = node.height ?? defaults.height;

        positions.set(node.id, {
            x: currentX,
            y: originY,
            width: w,
            height: h,
        });

        currentX += w + hSpacing;
    }

    // Extend lifeline heights based on number of messages
    // Each message takes up vSpacing vertical space
    const messageCount = edges.length;
    const lifelineExtension = (messageCount + 2) * vSpacing;

    for (const node of nodes) {
        const pos = positions.get(node.id);
        if (pos) {
            // For UML lifelines, extend height to cover all messages
            const type = resolveShapeType(node.shape) as ElementType;
            if (type === 'umlLifeline') {
                positions.set(node.id, {
                    ...pos,
                    height: Math.max(pos.height, lifelineExtension),
                });
            }
        }
    }

    return positions;
}
