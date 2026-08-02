/**
 * Schema Validator — Lightweight IR validation for DSL diagrams.
 * Validates structure and reports errors with context.
 */

import type { DSLDiagram, DSLNode, ParseError } from '../types';
import { CELL_REF, spanLength } from '../layout/strategies/byte-grid-layout';

// Must stay in step with DSLLayoutStrategy in ../types. The mindmap-radial and
// mindmap-down-* strategies were reachable from the text parser and the layout
// manager but rejected here, so a JSON diagram could not ask for them.
const VALID_STRATEGIES = [
    'tree-down', 'tree-right', 'tree-up', 'tree-left',
    'grid', 'force', 'swimlane', 'sequence',
    'radial', 'mindmap-right', 'mindmap-radial',
    'mindmap-down-curved', 'mindmap-down-straight',
    'byte-grid', 'manual',
];

/** byte-grid nodes describe a SPAN of cells, not a shape; the strategy draws the cells. */
const SHAPELESS_STRATEGIES = ['byte-grid'];

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
        const shapeOptional = SHAPELESS_STRATEGIES.includes(diagram.layout?.strategy ?? '');
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
            if (!node.shape && !shapeOptional) {
                errors.push({ line: 0, message: `${ctx}: Missing required "shape" field.` });
            }
            validateNodeChildren(node, ctx, nodeIds, errors);
        });

        // edges — validate references
        if (diagram.edges && Array.isArray(diagram.edges)) {
            // byte-grid cells are generated during expansion, so an author names
            // one as `span#3`. Check it here, where the span sizes are still
            // visible: a reference to cell 40 of an 8-cell span should be an
            // error, not an arrow that silently goes nowhere.
            const cellProblem = (ref: string): string | null => {
                const match = CELL_REF.exec(ref);
                if (!match) return null;
                const [, spanId, index] = match;
                const span = diagram.nodes.find(n => n.id === spanId);
                if (!span) return `references unknown span "${spanId}"`;
                const size = spanLength(span);
                if (size === null) return `"${spanId}" is not a byte-grid span, so it has no cells`;
                if (Number(index) >= size) return `"${spanId}" has ${size} cells, so #${index} is out of range`;
                return null;
            };
            const known = (ref: string) => nodeIds.has(ref) || (CELL_REF.test(ref) && !cellProblem(ref));

            diagram.edges.forEach((edge, i) => {
                const ctx = `edges[${i}]`;
                if (!edge.from) {
                    errors.push({ line: 0, message: `${ctx}: Missing required "from" field.` });
                } else if (!known(edge.from)) {
                    const detail = cellProblem(edge.from);
                    errors.push({ line: 0, message: `${ctx}: "from" ${detail ?? `references unknown node "${edge.from}"`}.` });
                }
                if (!edge.to) {
                    errors.push({ line: 0, message: `${ctx}: Missing required "to" field.` });
                } else if (!known(edge.to)) {
                    const detail = cellProblem(edge.to);
                    errors.push({ line: 0, message: `${ctx}: "to" ${detail ?? `references unknown node "${edge.to}"`}.` });
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
