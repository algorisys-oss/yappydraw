/**
 * Layout Manager — Dispatches layout strategies for DSL diagrams.
 */

import type { DSLDiagram, DSLNode } from '../types';
import type { LayoutPositionMap, LayoutConfig } from './types';
import type { ElementType } from '../../types';
import { resolveShapeType } from '../shape-aliases';
import { getShapeDefaults } from '../shape-defaults';
import { computeTreeLayout } from './strategies/tree-layout';
import { computeSequenceLayout } from './strategies/sequence-layout';

/**
 * Flatten nested children into a single node list.
 */
function flattenNodes(nodes: DSLNode[]): DSLNode[] {
    const result: DSLNode[] = [];
    for (const node of nodes) {
        result.push(node);
        if (node.children && node.children.length > 0) {
            result.push(...flattenNodes(node.children));
        }
    }
    return result;
}

/**
 * Compute positions for all nodes in a diagram.
 */
export function computeLayout(diagram: DSLDiagram): LayoutPositionMap {
    const strategy = diagram.layout?.strategy ?? 'manual';
    const allNodes = flattenNodes(diagram.nodes);
    const edges = diagram.edges ?? [];

    const config: LayoutConfig = {
        hSpacing: diagram.layout?.hSpacing ?? 100,
        vSpacing: diagram.layout?.vSpacing ?? 80,
        columns: diagram.layout?.columns,
        origin: diagram.layout?.origin ?? { x: 100, y: 100 },
    };

    switch (strategy) {
        case 'tree-down':
        case 'tree-up':
        case 'tree-right':
        case 'tree-left':
        case 'radial':
        case 'mindmap-right':
        case 'mindmap-radial':
        case 'mindmap-down-curved':
        case 'mindmap-down-straight':
            return computeTreeLayout(allNodes, edges, strategy, config, diagram.nodes);

        case 'grid':
            return computeGridLayout(allNodes, config);

        case 'sequence':
            return computeSequenceLayout(allNodes, edges, config, diagram.sequence);

        case 'manual':
        default:
            return computeManualLayout(allNodes, config);
    }
}

/**
 * Manual layout: use explicit positions, auto-grid fallback for unpositioned nodes.
 */
function computeManualLayout(nodes: DSLNode[], config: LayoutConfig): LayoutPositionMap {
    const positions: LayoutPositionMap = new Map();
    const unpositioned: DSLNode[] = [];

    for (const node of nodes) {
        const type = resolveShapeType(node.shape) as ElementType;
        const defaults = getShapeDefaults(type);
        const w = node.width ?? defaults.width;
        const h = node.height ?? defaults.height;
        if (node.x !== undefined && node.y !== undefined) {
            positions.set(node.id, { x: node.x, y: node.y, width: w, height: h });
        } else {
            unpositioned.push(node);
        }
    }

    if (unpositioned.length > 0) {
        const gridPositions = computeGridLayout(unpositioned, config);
        for (const [id, pos] of gridPositions) {
            positions.set(id, pos);
        }
    }

    return positions;
}

/**
 * Grid layout: row-major placement.
 */
function computeGridLayout(nodes: DSLNode[], config: LayoutConfig): LayoutPositionMap {
    const positions: LayoutPositionMap = new Map();
    const cols = config.columns ?? Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
    let col = 0;
    let colX = config.origin.x;
    let rowY = config.origin.y;
    let maxRowHeight = 0;

    for (const node of nodes) {
        const type = resolveShapeType(node.shape) as ElementType;
        const defaults = getShapeDefaults(type);
        const w = node.width ?? defaults.width;
        const h = node.height ?? defaults.height;
        positions.set(node.id, { x: colX, y: rowY, width: w, height: h });
        maxRowHeight = Math.max(maxRowHeight, h);
        col++;
        colX += w + config.hSpacing;
        if (col >= cols) {
            col = 0;
            colX = config.origin.x;
            rowY += maxRowHeight + config.vSpacing;
            maxRowHeight = 0;
        }
    }

    return positions;
}
