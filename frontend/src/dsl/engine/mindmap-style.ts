/**
 * Mind-map styling pass.
 *
 * When a diagram uses a `mindmap-*` layout, give it the Miro-style look without the
 * author having to hand-style every node/edge: rounded "pill" nodes, an emphasised
 * central node, and per-branch colour — each top-level branch gets a palette colour
 * that its whole subtree (nodes + connecting links) inherits. Connectors become
 * curved (or straight, for `mindmap-down-straight`) branch links with no arrowheads.
 *
 * Runs before auto-sizing/layout and mutates the diagram in place, so it stays the
 * single source of truth: the visual style follows from `layout: mindmap-*` alone.
 */
import type { DSLDiagram, DSLNode } from '../types';

const MINDMAP_STRATEGIES = new Set([
    'mindmap-radial', 'mindmap-down-curved', 'mindmap-down-straight', 'mindmap-right',
]);

/** Distinct, readable branch colours (cycled if there are more branches than colours). */
const BRANCH_COLORS = [
    '#1971c2', '#e8590c', '#2f9e44', '#c2255c',
    '#6741d9', '#0c8599', '#f08c00', '#ae3ec9',
];
const CENTRAL_FILL = '#5f3dc4';   // emphasised centre (violet)
const CENTRAL_STROKE = '#3b2a99';
const PILL_RADIUS = 22;           // large corner radius → pill / stadium look

export function isMindmapStrategy(strategy?: string): boolean {
    return !!strategy && MINDMAP_STRATEGIES.has(strategy);
}

export function applyMindmapStyling(diagram: DSLDiagram): void {
    const strategy = diagram.layout?.strategy;
    if (!isMindmapStrategy(strategy)) return;

    const curved = strategy !== 'mindmap-down-straight';

    // 1. Per-branch colour: each top-level branch (a root's direct child) seeds a
    //    colour that its entire subtree inherits.
    const nodeColor = new Map<string, string>();
    const rootIds = new Set<string>();
    for (const root of diagram.nodes) {
        rootIds.add(root.id);
        const branches = root.children ?? [];
        branches.forEach((branch, i) => {
            const color = BRANCH_COLORS[i % BRANCH_COLORS.length];
            paintSubtree(branch, color, nodeColor);
        });
    }

    // 2. Style nodes — central emphasised, branch nodes as coloured pills.
    walkNodes(diagram.nodes, (node) => {
        if (rootIds.has(node.id)) {
            styleCentral(node);
        } else {
            stylePill(node, nodeColor.get(node.id) ?? '#868e96');
        }
    });

    // 3. Style connectors — curved/straight branch links, no arrowheads, coloured to
    //    match the child's branch. (Auto-generated child edges have from=parent, to=child.)
    for (const edge of diagram.edges ?? []) {
        edge.type = 'line';
        edge.curveType = curved ? 'bezier' : 'straight';
        edge.startArrowhead = null;
        edge.endArrowhead = null;
        const color = nodeColor.get(edge.to) ?? '#adb5bd';
        edge.style = { ...(edge.style ?? {}), strokeColor: color, strokeWidth: 2.5 };
    }
}

function paintSubtree(node: DSLNode, color: string, out: Map<string, string>): void {
    out.set(node.id, color);
    for (const child of node.children ?? []) paintSubtree(child, color, out);
}

function walkNodes(nodes: DSLNode[], fn: (n: DSLNode) => void): void {
    for (const n of nodes) {
        fn(n);
        if (n.children) walkNodes(n.children, fn);
    }
}

function styleCentral(node: DSLNode): void {
    node.style = {
        ...(node.style ?? {}),
        backgroundColor: node.style?.backgroundColor ?? CENTRAL_FILL,
        strokeColor: node.style?.strokeColor ?? CENTRAL_STROKE,
        textColor: node.style?.textColor ?? '#ffffff',
        fillStyle: 'solid',
        strokeWidth: node.style?.strokeWidth ?? 2,
        borderRadius: node.style?.borderRadius ?? PILL_RADIUS,
        fontWeight: node.style?.fontWeight ?? true,
    };
}

function stylePill(node: DSLNode, color: string): void {
    node.style = {
        ...(node.style ?? {}),
        backgroundColor: node.style?.backgroundColor ?? color,
        strokeColor: node.style?.strokeColor ?? color,
        textColor: node.style?.textColor ?? '#ffffff',
        fillStyle: 'solid',
        strokeWidth: node.style?.strokeWidth ?? 1.5,
        borderRadius: node.style?.borderRadius ?? PILL_RADIUS,
    };
}
