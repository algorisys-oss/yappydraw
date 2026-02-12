/**
 * DSL Engine — Renders a DSLDiagram IR to canvas elements via YappyAPI.
 *
 * Delegates layout computation to the LayoutManager, then creates
 * canvas elements (nodes, edges, pools) via the YappyAPI.
 */

import type { DSLDiagram, DSLNode, DSLEdge, DSLPool, RenderOptions, RenderResult } from '../types';
import type { ElementType } from '../../types';
import type { NodePosition } from '../layout/types';
import { resolveShapeType } from '../shape-aliases';
import { getShapeDefaults } from '../shape-defaults';
import { mergeNodeStyle, mergeEdgeStyle, mapStyleToOptions } from './render-helpers';
import { computeLayout } from '../layout/layout-manager';
import { YappyAPI } from '../../api';
import { store, pushToHistory, deleteElements } from '../../store/app-store';

/**
 * Render a DSLDiagram to the canvas.
 */
export function renderDiagram(diagram: DSLDiagram, options?: RenderOptions): RenderResult {
    const nodeIdMap = new Map<string, string>();   // DSL id → canvas element id
    const edgeIdMap = new Map<string, string>();
    const poolIdMap = new Map<string, string>();
    let elementCount = 0;

    pushToHistory();

    // ─── Clear canvas if requested ────────────────────────
    if (options?.clearCanvas) {
        const allIds = store.elements.map(e => e.id);
        if (allIds.length > 0) {
            deleteElements(allIds);
        }
    }

    const allNodes = flattenNodes(diagram.nodes);
    const hasPools = diagram.pools && diagram.pools.length > 0;

    if (hasPools) {
        // ─── Pool-aware rendering ─────────────────────────
        const poolNodes = allNodes.filter(n => n.pool);
        const freeNodes = allNodes.filter(n => !n.pool);

        // Compute pool layout: sizes, positions, and node placement within lanes
        const poolLayout = computePoolLayout(diagram, poolNodes, options);

        // Render pools
        for (const pool of diagram.pools!) {
            const pl = poolLayout.pools.get(pool.id);
            if (!pl) continue;
            const poolElementId = renderPoolSized(pool, pl.x, pl.y, pl.width, pl.height, diagram);
            if (poolElementId) {
                poolIdMap.set(pool.id, poolElementId);
                elementCount++;
            }
        }

        // Render pool-assigned nodes at their lane positions
        for (const node of poolNodes) {
            const pos = poolLayout.nodePositions.get(node.id);
            const elementId = renderNode(node, pos, diagram, options);
            if (elementId) {
                nodeIdMap.set(node.id, elementId);
                elementCount++;

                // Assign containment
                if (node.pool) {
                    const poolCanvasId = poolIdMap.get(node.pool.poolId);
                    if (poolCanvasId) {
                        const laneIndex = typeof node.pool.lane === 'number'
                            ? node.pool.lane
                            : findLaneIndex(diagram, node.pool.poolId, node.pool.lane);
                        if (laneIndex >= 0) {
                            YappyAPI.assignToPoolLane(elementId, poolCanvasId, laneIndex);
                        }
                    }
                }
            }
        }

        // Render free nodes (no pool) using regular layout
        if (freeNodes.length > 0) {
            const positions = computeLayout(diagram);
            for (const node of freeNodes) {
                const pos = positions.get(node.id);
                const elementId = renderNode(node, pos, diagram, options);
                if (elementId) {
                    nodeIdMap.set(node.id, elementId);
                    elementCount++;
                }
            }
        }
    } else {
        // ─── Regular rendering (no pools) ─────────────────
        const positions = computeLayout(diagram);
        for (const node of allNodes) {
            const pos = positions.get(node.id);
            const elementId = renderNode(node, pos, diagram, options);
            if (elementId) {
                nodeIdMap.set(node.id, elementId);
                elementCount++;
            }
        }
    }

    // ─── Render edges ────────────────────────────────────
    if (diagram.edges) {
        for (const edge of diagram.edges) {
            const sourceCanvasId = nodeIdMap.get(edge.from);
            const targetCanvasId = nodeIdMap.get(edge.to);
            if (!sourceCanvasId || !targetCanvasId) continue;

            const edgeElementId = renderEdge(edge, sourceCanvasId, targetCanvasId, diagram);
            if (edgeElementId) {
                const edgeKey = edge.id ?? `${edge.from}->${edge.to}`;
                edgeIdMap.set(edgeKey, edgeElementId);
                elementCount++;
            }
        }
    }

    // ─── Establish parent-child hierarchy (for mindmap toggle icons) ──
    setParentChildRelationships(diagram.nodes, nodeIdMap);

    // ─── Zoom to fit ─────────────────────────────────────
    if (options?.zoomToFit !== false) {
        requestAnimationFrame(() => YappyAPI.zoomToFit());
    }

    return { nodeIdMap, edgeIdMap, poolIdMap, elementCount };
}

// ─── Node Rendering ──────────────────────────────────────

function renderNode(
    node: DSLNode,
    pos: NodePosition | undefined,
    diagram: DSLDiagram,
    options?: RenderOptions
): string | null {
    const resolvedType = resolveShapeType(node.shape) as ElementType;
    const defaults = getShapeDefaults(resolvedType);
    const x = (pos?.x ?? node.x ?? 0) + (options?.offsetX ?? 0);
    const y = (pos?.y ?? node.y ?? 0) + (options?.offsetY ?? 0);
    const w = pos?.width ?? node.width ?? defaults.width;
    const h = pos?.height ?? node.height ?? defaults.height;

    // Merge styles
    const mergedStyle = mergeNodeStyle(node.style, node.shape, diagram.defaults);
    const styleOpts = mapStyleToOptions(mergedStyle);

    // Build element options
    const isDataStructure = resolvedType.startsWith('ds');
    const elementOpts: Record<string, any> = {
        ...styleOpts,
        ...(node.label ? { containerText: node.label } : {}),
        ...(node.tag ? { tag: node.tag } : {}),
    };

    // UML class sections
    if (node.sections) {
        if (node.sections.attributes !== undefined) elementOpts.umlAttributes = node.sections.attributes;
        if (node.sections.methods !== undefined) elementOpts.umlMethods = node.sections.methods;
    }

    // Domain-specific properties (BPMN types, DS values, etc.)
    if (node.properties) {
        for (const [key, val] of Object.entries(node.properties)) {
            // Data structure shapes: dsValues maps to `text` property
            if (key === 'dsValues' && isDataStructure) {
                elementOpts.text = val;
            } else {
                elementOpts[key] = val;
            }
        }
    }

    // BPMN shapes use createBpmnShape for proper defaults
    if (resolvedType.startsWith('bpmn')) {
        return YappyAPI.createBpmnShape(
            resolvedType as any,
            x, y, w, h,
            elementOpts
        );
    }

    // Text elements
    if (resolvedType === 'text' && node.label) {
        return YappyAPI.createText(x, y, node.label, elementOpts);
    }

    return YappyAPI.createElement(resolvedType, x, y, w, h, elementOpts);
}

// ─── Edge Rendering ──────────────────────────────────────

function renderEdge(
    edge: DSLEdge,
    sourceCanvasId: string,
    targetCanvasId: string,
    diagram: DSLDiagram
): string | null {
    const mergedStyle = mergeEdgeStyle(edge.style, diagram.defaults);
    const styleOpts = mapStyleToOptions(mergedStyle);

    const connectOpts: Record<string, any> = {
        ...styleOpts,
        type: edge.type ?? 'arrow',
        curveType: edge.curveType ?? 'bezier',
    };

    if (edge.startArrowhead !== undefined) connectOpts.startArrowhead = edge.startArrowhead;
    if (edge.endArrowhead !== undefined) connectOpts.endArrowhead = edge.endArrowhead;

    const connectorId = YappyAPI.connect(sourceCanvasId, targetCanvasId, connectOpts);

    // Add label if present
    if (connectorId && edge.label) {
        YappyAPI.updateElement(connectorId, { containerText: edge.label });
    }

    return connectorId;
}

// ─── Pool Layout Computation ────────────────────────────

interface PoolLayoutResult {
    pools: Map<string, { x: number; y: number; width: number; height: number }>;
    nodePositions: Map<string, NodePosition>;
}

const POOL_LABEL_WIDTH = 40;   // Space for rotated pool label
const LANE_LABEL_WIDTH = 30;   // Space for rotated lane label
const LANE_PADDING = 20;       // Padding inside lanes
const NODE_H_SPACING = 30;     // Horizontal spacing between nodes in a lane
const NODE_V_PADDING = 20;     // Vertical padding within a lane

/**
 * Compute pool sizes, lane sizes, and node positions within lanes.
 * Horizontal pools: lanes stacked vertically, nodes flow left-to-right within each lane.
 */
function computePoolLayout(
    diagram: DSLDiagram,
    poolNodes: DSLNode[],
    options?: RenderOptions
): PoolLayoutResult {
    const pools = new Map<string, { x: number; y: number; width: number; height: number }>();
    const nodePositions = new Map<string, NodePosition>();

    const originX = (options?.offsetX ?? 0) + 100;
    let currentY = (options?.offsetY ?? 0) + 100;
    const poolGap = 30;

    // Group nodes by pool and lane
    const poolLaneNodes = new Map<string, Map<string, DSLNode[]>>();
    for (const node of poolNodes) {
        if (!node.pool) continue;
        const { poolId, lane } = node.pool;
        const laneId = String(lane);
        if (!poolLaneNodes.has(poolId)) poolLaneNodes.set(poolId, new Map());
        const laneMap = poolLaneNodes.get(poolId)!;
        if (!laneMap.has(laneId)) laneMap.set(laneId, []);
        laneMap.get(laneId)!.push(node);
    }

    for (const pool of diagram.pools ?? []) {
        const laneMap = poolLaneNodes.get(pool.id) ?? new Map();
        const laneCount = pool.lanes.length;
        const hasLaneLabels = laneCount > 1;
        const contentOffsetX = POOL_LABEL_WIDTH + (hasLaneLabels ? LANE_LABEL_WIDTH : 0);

        // Compute required width and per-lane height
        let maxContentWidth = 0;
        const laneHeights: number[] = [];

        for (let li = 0; li < laneCount; li++) {
            const laneId = pool.lanes[li].id;
            const nodes = laneMap.get(laneId) ?? [];

            // Calculate total width needed for nodes in this lane
            let totalNodeWidth = 0;
            let maxNodeHeight = 0;
            for (const node of nodes) {
                const type = resolveShapeType(node.shape) as ElementType;
                const defaults = getShapeDefaults(type);
                const w = node.width ?? defaults.width;
                const h = node.height ?? defaults.height;
                totalNodeWidth += w + NODE_H_SPACING;
                maxNodeHeight = Math.max(maxNodeHeight, h);
            }
            totalNodeWidth = Math.max(totalNodeWidth - NODE_H_SPACING, 0); // Remove trailing spacing

            maxContentWidth = Math.max(maxContentWidth, totalNodeWidth + LANE_PADDING * 2);
            laneHeights.push(Math.max(maxNodeHeight + NODE_V_PADDING * 2, 80));
        }

        const poolWidth = contentOffsetX + Math.max(maxContentWidth, 300);
        const poolHeight = laneHeights.reduce((sum, h) => sum + h, 0);

        pools.set(pool.id, { x: originX, y: currentY, width: poolWidth, height: poolHeight });

        // Position nodes within each lane
        let laneY = currentY;
        for (let li = 0; li < laneCount; li++) {
            const laneId = pool.lanes[li].id;
            const nodes = laneMap.get(laneId) ?? [];
            const laneH = laneHeights[li];

            let nodeX = originX + contentOffsetX + LANE_PADDING;
            for (const node of nodes) {
                const type = resolveShapeType(node.shape) as ElementType;
                const defaults = getShapeDefaults(type);
                const w = node.width ?? defaults.width;
                const h = node.height ?? defaults.height;

                // Center node vertically within lane
                const nodeY = laneY + (laneH - h) / 2;
                nodePositions.set(node.id, { x: nodeX, y: nodeY, width: w, height: h });
                nodeX += w + NODE_H_SPACING;
            }

            laneY += laneH;
        }

        currentY += poolHeight + poolGap;
    }

    return { pools, nodePositions };
}

// ─── Pool Rendering ──────────────────────────────────────

function renderPoolSized(
    pool: DSLPool,
    x: number, y: number, width: number, height: number,
    diagram: DSLDiagram
): string | null {
    const poolOpts: Record<string, any> = {
        containerText: pool.label ?? pool.id,
        bpmnLaneCount: pool.lanes.length,
        bpmnLaneLabels: pool.lanes.map(l => l.label),
    };

    if (pool.orientation) {
        poolOpts.bpmnOrientation = pool.orientation;
    }

    // Lane colors
    const laneColors = pool.lanes.map(l => l.color).filter(Boolean);
    if (laneColors.length > 0) {
        poolOpts.bpmnLaneColors = pool.lanes.map(l => l.color ?? '');
    }
    const laneTextColors = pool.lanes.map(l => l.textColor).filter(Boolean);
    if (laneTextColors.length > 0) {
        poolOpts.bpmnLaneTextColors = pool.lanes.map(l => l.textColor ?? '');
    }

    // Merge pool style
    if (pool.style) {
        const mergedStyle = mergeNodeStyle(pool.style, 'bpmnPool', diagram.defaults);
        Object.assign(poolOpts, mapStyleToOptions(mergedStyle));
    }

    return YappyAPI.createBpmnShape('bpmnPool', x, y, width, height, poolOpts);
}

// ─── Helpers ─────────────────────────────────────────────

/**
 * Flatten nested node children into a single list.
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
 * Walk DSLNode children hierarchy and set parentId on canvas elements.
 * This enables toggle (expand/collapse) icons on mindmap/tree nodes.
 */
function setParentChildRelationships(nodes: DSLNode[], nodeIdMap: Map<string, string>) {
    function walk(parentNodes: DSLNode[]) {
        for (const node of parentNodes) {
            if (node.children && node.children.length > 0) {
                const parentCanvasId = nodeIdMap.get(node.id);
                if (!parentCanvasId) continue;

                for (const child of node.children) {
                    const childCanvasId = nodeIdMap.get(child.id);
                    if (childCanvasId) {
                        YappyAPI.setParent(childCanvasId, parentCanvasId);
                    }
                }
                walk(node.children);
            }
        }
    }
    walk(nodes);
}

/**
 * Find lane index by lane id in a pool definition.
 */
function findLaneIndex(diagram: DSLDiagram, poolId: string, laneId: string): number {
    const pool = diagram.pools?.find(p => p.id === poolId);
    if (!pool) return -1;
    return pool.lanes.findIndex(l => l.id === laneId);
}
