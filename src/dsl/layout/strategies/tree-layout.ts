/**
 * Tree Layout Strategy
 * Computes tree positions from DSL IR nodes + edges.
 * Supports 4 directions (down, up, right, left) and radial.
 * Algorithm adapted from MindmapLayoutEngine.
 */

import type { DSLNode, DSLEdge, DSLLayoutStrategy } from '../../types';
import type { LayoutPositionMap, LayoutConfig } from '../types';
import type { ElementType } from '../../../types';
import { resolveShapeType } from '../../shape-aliases';
import { getShapeDefaults } from '../../shape-defaults';

interface TreeNode {
    id: string;
    width: number;
    height: number;
    x: number;
    y: number;
    children: TreeNode[];
    totalHeight?: number;
    totalWidth?: number;
}

type TreeDirection = 'down' | 'up' | 'right' | 'left';

/**
 * Compute tree layout positions for DSL nodes.
 * @param originalNodes — optional non-flattened nodes with children hierarchy (for mindmaps)
 */
export function computeTreeLayout(
    nodes: DSLNode[],
    edges: DSLEdge[],
    strategy: DSLLayoutStrategy,
    config: LayoutConfig,
    originalNodes?: DSLNode[]
): LayoutPositionMap {
    const positions: LayoutPositionMap = new Map();
    if (nodes.length === 0) return positions;

    // Check if we have a children-based hierarchy (mindmaps, org charts)
    const hasChildrenHierarchy = originalNodes?.some(n => n.children && n.children.length > 0);

    // Build adjacency (from → to[])
    const adjacency = new Map<string, string[]>();
    const hasIncoming = new Set<string>();

    if (hasChildrenHierarchy) {
        // Build adjacency from DSLNode.children hierarchy
        buildAdjacencyFromChildren(originalNodes!, adjacency, hasIncoming);
    } else {
        // Build adjacency from edges
        for (const edge of edges) {
            if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
            adjacency.get(edge.from)!.push(edge.to);
            hasIncoming.add(edge.to);
        }
    }

    // Find roots (nodes with no incoming edges)
    const roots = nodes.filter(n => !hasIncoming.has(n.id));

    // If no roots found (cyclic graph), pick the first node
    if (roots.length === 0) roots.push(nodes[0]);

    // Build node dimension lookup
    const nodeDims = new Map<string, { w: number; h: number }>();
    for (const node of nodes) {
        const type = resolveShapeType(node.shape) as ElementType;
        const defaults = getShapeDefaults(type);
        nodeDims.set(node.id, {
            w: node.width ?? defaults.width,
            h: node.height ?? defaults.height,
        });
    }

    // Determine direction from strategy
    const direction = getDirection(strategy);
    const hSpacing = config.hSpacing;
    const vSpacing = config.vSpacing;

    // Build trees from each root and lay them out
    const visited = new Set<string>();
    let offsetX = config.origin.x;
    let offsetY = config.origin.y;

    for (const root of roots) {
        const tree = buildTree(root.id, adjacency, nodeDims, visited);
        if (!tree) continue;

        if (direction === 'radial') {
            layoutRadial(tree, offsetX, offsetY, hSpacing);
        } else if (direction === 'right' || direction === 'left') {
            calculateSubtreeHeights(tree, vSpacing);
            assignHorizontalPositions(tree, offsetX, offsetY, direction, hSpacing, vSpacing);
        } else {
            calculateSubtreeWidths(tree, hSpacing);
            assignVerticalPositions(tree, offsetX, offsetY, direction, hSpacing, vSpacing);
        }

        // Collect positions
        collectPositions(tree, positions, nodeDims);

        // Offset next root's tree to avoid overlap
        if (roots.length > 1) {
            if (direction === 'down' || direction === 'up') {
                // Place next tree to the right
                const bounds = getTreeBounds(tree);
                offsetX = bounds.maxX + hSpacing * 2;
            } else {
                // Place next tree below
                const bounds = getTreeBounds(tree);
                offsetY = bounds.maxY + vSpacing * 2;
            }
        }
    }

    // Handle orphan nodes (not connected by any edge)
    const placedNodes = new Set(positions.keys());
    const orphans = nodes.filter(n => !placedNodes.has(n.id));
    if (orphans.length > 0) {
        // Find max Y of placed nodes for positioning orphans below
        let maxY = config.origin.y;
        for (const pos of positions.values()) {
            maxY = Math.max(maxY, pos.y + pos.height);
        }
        let orphanX = config.origin.x;
        const orphanY = maxY + vSpacing * 2;
        for (const node of orphans) {
            const dims = nodeDims.get(node.id) ?? { w: 150, h: 80 };
            positions.set(node.id, { x: orphanX, y: orphanY, width: dims.w, height: dims.h });
            orphanX += dims.w + hSpacing;
        }
    }

    return positions;
}

// ─── Tree Building ───────────────────────────────────────

function buildTree(
    nodeId: string,
    adjacency: Map<string, string[]>,
    nodeDims: Map<string, { w: number; h: number }>,
    visited: Set<string>
): TreeNode | null {
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);

    const dims = nodeDims.get(nodeId) ?? { w: 150, h: 80 };
    const node: TreeNode = {
        id: nodeId,
        width: dims.w,
        height: dims.h,
        x: 0,
        y: 0,
        children: [],
    };

    const childIds = adjacency.get(nodeId) ?? [];
    for (const childId of childIds) {
        const child = buildTree(childId, adjacency, nodeDims, visited);
        if (child) node.children.push(child);
    }

    return node;
}

/**
 * Build adjacency map from DSLNode.children hierarchy (for mindmaps/org charts).
 */
function buildAdjacencyFromChildren(
    nodes: DSLNode[],
    adjacency: Map<string, string[]>,
    hasIncoming: Set<string>
) {
    for (const node of nodes) {
        if (node.children && node.children.length > 0) {
            const childIds = node.children.map(c => c.id);
            adjacency.set(node.id, childIds);
            for (const childId of childIds) {
                hasIncoming.add(childId);
            }
            // Recurse into children
            buildAdjacencyFromChildren(node.children, adjacency, hasIncoming);
        }
    }
}

// ─── Vertical Layout (down/up) ───────────────────────────

function calculateSubtreeWidths(node: TreeNode, hSpacing: number): number {
    if (node.children.length === 0) {
        node.totalWidth = node.width;
        return node.totalWidth;
    }
    const childrenWidth = node.children.reduce((acc, c) => acc + calculateSubtreeWidths(c, hSpacing), 0);
    const totalSpacing = (node.children.length - 1) * hSpacing;
    node.totalWidth = Math.max(node.width, childrenWidth + totalSpacing);
    return node.totalWidth;
}

function assignVerticalPositions(
    node: TreeNode, x: number, y: number,
    direction: 'down' | 'up',
    hSpacing: number, vSpacing: number
) {
    node.x = x;
    node.y = y;
    if (node.children.length === 0) return;

    const startY = direction === 'down'
        ? y + node.height + vSpacing
        : y - vSpacing;

    const totalChildrenWidth = node.children.reduce((acc, c) => acc + c.totalWidth!, 0)
        + (node.children.length - 1) * hSpacing;
    let currentX = x + (node.width / 2) - (totalChildrenWidth / 2);

    for (const child of node.children) {
        const childY = direction === 'down' ? startY : startY - child.height;
        const childX = currentX + (child.totalWidth! / 2) - (child.width / 2);
        assignVerticalPositions(child, childX, childY, direction, hSpacing, vSpacing);
        currentX += child.totalWidth! + hSpacing;
    }
}

// ─── Horizontal Layout (right/left) ─────────────────────

function calculateSubtreeHeights(node: TreeNode, vSpacing: number): number {
    if (node.children.length === 0) {
        node.totalHeight = node.height;
        return node.totalHeight;
    }
    const childrenHeight = node.children.reduce((acc, c) => acc + calculateSubtreeHeights(c, vSpacing), 0);
    const totalSpacing = (node.children.length - 1) * vSpacing;
    node.totalHeight = Math.max(node.height, childrenHeight + totalSpacing);
    return node.totalHeight;
}

function assignHorizontalPositions(
    node: TreeNode, x: number, y: number,
    direction: 'right' | 'left',
    hSpacing: number, vSpacing: number
) {
    node.x = x;
    node.y = y;
    if (node.children.length === 0) return;

    const startX = direction === 'right'
        ? x + node.width + hSpacing
        : x - hSpacing;

    const totalChildrenHeight = node.children.reduce((acc, c) => acc + c.totalHeight!, 0)
        + (node.children.length - 1) * vSpacing;
    let currentY = y + (node.height / 2) - (totalChildrenHeight / 2);

    for (const child of node.children) {
        const childX = direction === 'right' ? startX : startX - child.width;
        const childY = currentY + (child.totalHeight! / 2) - (child.height / 2);
        assignHorizontalPositions(child, childX, childY, direction, hSpacing, vSpacing);
        currentY += child.totalHeight! + vSpacing;
    }
}

// ─── Radial Layout ───────────────────────────────────────

function layoutRadial(root: TreeNode, originX: number, originY: number, spacing: number) {
    const radius = spacing * 2.5;
    assignRadialPositions(root, originX, originY, 0, Math.PI * 2, radius);
}

function assignRadialPositions(
    node: TreeNode, x: number, y: number,
    startAngle: number, endAngle: number, radius: number
) {
    node.x = x;
    node.y = y;
    if (node.children.length === 0) return;

    const centerX = x + node.width / 2;
    const centerY = y + node.height / 2;
    const totalAngle = endAngle - startAngle;
    const anglePerChild = totalAngle / node.children.length;

    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const angle = startAngle + (i + 0.5) * anglePerChild;
        const childCenterX = centerX + Math.cos(angle) * radius;
        const childCenterY = centerY + Math.sin(angle) * radius;
        const childX = childCenterX - child.width / 2;
        const childY = childCenterY - child.height / 2;

        const wedge = Math.min(Math.PI / 2, anglePerChild * 0.9);
        assignRadialPositions(child, childX, childY, angle - wedge / 2, angle + wedge / 2, radius * 0.7);
    }
}

// ─── Helpers ─────────────────────────────────────────────

function getDirection(strategy: DSLLayoutStrategy): TreeDirection | 'radial' {
    switch (strategy) {
        case 'tree-down': return 'down';
        case 'tree-up': return 'up';
        case 'tree-right': return 'right';
        case 'tree-left': return 'left';
        case 'radial': return 'radial';
        case 'mindmap-right': return 'right';
        default: return 'down';
    }
}

function collectPositions(node: TreeNode, positions: LayoutPositionMap, nodeDims: Map<string, { w: number; h: number }>) {
    const dims = nodeDims.get(node.id) ?? { w: node.width, h: node.height };
    positions.set(node.id, { x: node.x, y: node.y, width: dims.w, height: dims.h });
    for (const child of node.children) {
        collectPositions(child, positions, nodeDims);
    }
}

function getTreeBounds(node: TreeNode): { maxX: number; maxY: number } {
    let maxX = node.x + node.width;
    let maxY = node.y + node.height;
    for (const child of node.children) {
        const childBounds = getTreeBounds(child);
        maxX = Math.max(maxX, childBounds.maxX);
        maxY = Math.max(maxY, childBounds.maxY);
    }
    return { maxX, maxY };
}
