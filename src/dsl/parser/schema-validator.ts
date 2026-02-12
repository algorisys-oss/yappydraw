/**
 * Schema Validator — Lightweight IR validation for DSL diagrams.
 * Validates structure and reports errors with context.
 */

import type { DSLDiagram, DSLNode, ParseError } from '../types';

const VALID_STRATEGIES = [
    'tree-down', 'tree-right', 'tree-up', 'tree-left',
    'grid', 'force', 'swimlane', 'sequence',
    'radial', 'mindmap-right', 'manual',
];

const VALID_EDGE_TYPES = ['arrow', 'line', 'organicBranch'];
const VALID_CURVE_TYPES = ['straight', 'bezier', 'elbow'];

export function validateDiagram(diagram: DSLDiagram): ParseError[] {
    const errors: ParseError[] = [];

    // version
    if (diagram.version !== 1) {
        errors.push({ line: 0, message: `Unsupported version: ${diagram.version}. Expected 1.` });
    }

    // layout
    if (!diagram.layout) {
        errors.push({ line: 0, message: 'Missing required "layout" field.' });
    } else if (!diagram.layout.strategy) {
        errors.push({ line: 0, message: 'Missing required "layout.strategy" field.' });
    } else if (!VALID_STRATEGIES.includes(diagram.layout.strategy)) {
        errors.push({ line: 0, message: `Invalid layout strategy: "${diagram.layout.strategy}". Valid: ${VALID_STRATEGIES.join(', ')}` });
    }

    // nodes
    if (!diagram.nodes || !Array.isArray(diagram.nodes)) {
        errors.push({ line: 0, message: 'Missing or invalid "nodes" array.' });
    } else {
        const nodeIds = new Set<string>();
        diagram.nodes.forEach((node, i) => {
            const ctx = `nodes[${i}]`;
            if (!node.id) {
                errors.push({ line: 0, message: `${ctx}: Missing required "id" field.` });
            } else if (nodeIds.has(node.id)) {
                errors.push({ line: 0, message: `${ctx}: Duplicate node id "${node.id}".` });
            } else {
                nodeIds.add(node.id);
            }
            if (!node.shape) {
                errors.push({ line: 0, message: `${ctx}: Missing required "shape" field.` });
            }
            validateNodeChildren(node, ctx, nodeIds, errors);
        });

        // edges — validate references
        if (diagram.edges && Array.isArray(diagram.edges)) {
            diagram.edges.forEach((edge, i) => {
                const ctx = `edges[${i}]`;
                if (!edge.from) {
                    errors.push({ line: 0, message: `${ctx}: Missing required "from" field.` });
                } else if (!nodeIds.has(edge.from)) {
                    errors.push({ line: 0, message: `${ctx}: "from" references unknown node "${edge.from}".` });
                }
                if (!edge.to) {
                    errors.push({ line: 0, message: `${ctx}: Missing required "to" field.` });
                } else if (!nodeIds.has(edge.to)) {
                    errors.push({ line: 0, message: `${ctx}: "to" references unknown node "${edge.to}".` });
                }
                if (edge.type && !VALID_EDGE_TYPES.includes(edge.type)) {
                    errors.push({ line: 0, message: `${ctx}: Invalid edge type "${edge.type}". Valid: ${VALID_EDGE_TYPES.join(', ')}` });
                }
                if (edge.curveType && !VALID_CURVE_TYPES.includes(edge.curveType)) {
                    errors.push({ line: 0, message: `${ctx}: Invalid curveType "${edge.curveType}". Valid: ${VALID_CURVE_TYPES.join(', ')}` });
                }
            });
        }

        // groups — validate node references
        if (diagram.groups && Array.isArray(diagram.groups)) {
            diagram.groups.forEach((group, i) => {
                const ctx = `groups[${i}]`;
                if (!group.id) {
                    errors.push({ line: 0, message: `${ctx}: Missing required "id" field.` });
                }
                if (!group.nodeIds || !Array.isArray(group.nodeIds)) {
                    errors.push({ line: 0, message: `${ctx}: Missing or invalid "nodeIds" array.` });
                } else {
                    group.nodeIds.forEach(nid => {
                        if (!nodeIds.has(nid)) {
                            errors.push({ line: 0, message: `${ctx}: "nodeIds" references unknown node "${nid}".` });
                        }
                    });
                }
            });
        }

        // pools — validate structure
        if (diagram.pools && Array.isArray(diagram.pools)) {
            diagram.pools.forEach((pool, i) => {
                const ctx = `pools[${i}]`;
                if (!pool.id) {
                    errors.push({ line: 0, message: `${ctx}: Missing required "id" field.` });
                }
                if (!pool.lanes || !Array.isArray(pool.lanes) || pool.lanes.length === 0) {
                    errors.push({ line: 0, message: `${ctx}: Missing or empty "lanes" array.` });
                } else {
                    pool.lanes.forEach((lane, j) => {
                        if (!lane.id) {
                            errors.push({ line: 0, message: `${ctx}.lanes[${j}]: Missing required "id" field.` });
                        }
                        if (!lane.label) {
                            errors.push({ line: 0, message: `${ctx}.lanes[${j}]: Missing required "label" field.` });
                        }
                    });
                }
            });
        }
    }

    return errors;
}

function validateNodeChildren(node: DSLNode, parentCtx: string, nodeIds: Set<string>, errors: ParseError[]): void {
    if (!node.children || !Array.isArray(node.children)) return;
    node.children.forEach((child, i) => {
        const ctx = `${parentCtx}.children[${i}]`;
        if (!child.id) {
            errors.push({ line: 0, message: `${ctx}: Missing required "id" field.` });
        } else if (nodeIds.has(child.id)) {
            errors.push({ line: 0, message: `${ctx}: Duplicate node id "${child.id}".` });
        } else {
            nodeIds.add(child.id);
        }
        if (!child.shape) {
            errors.push({ line: 0, message: `${ctx}: Missing required "shape" field.` });
        }
        validateNodeChildren(child, ctx, nodeIds, errors);
    });
}
