import type { DrawingElement } from "../types";

export interface MindmapNode {
    id: string;
    element: DrawingElement;
    children: MindmapNode[];
    width: number;
    height: number;
    x: number;
    y: number;
    totalHeight?: number; // Used for vertical layout
    totalWidth?: number;  // Used for horizontal layout
    leafCount?: number;   // Used for radial layout (leaf-proportional wedges)
    styleUpdates?: Partial<DrawingElement>; // Style properties to update
}

export type LayoutDirection = 'horizontal-right' | 'horizontal-left' | 'vertical-down' | 'vertical-up' | 'radial' | 'balanced';

/** A node in a parsed text outline (for smart-paste → mindmap subtree). */
export interface OutlineNode {
    text: string;
    children: OutlineNode[];
}

/**
 * Parse an indented / bulleted plain-text outline into a tree. Indentation is
 * measured in leading whitespace (a tab counts as one level; spaces are bucketed
 * by the smallest non-zero indent seen, so 2- or 4-space outlines both work).
 * Leading bullet markers (-, *, •, –, or "1." / "1)") are stripped. Blank lines
 * are ignored. Returns the top-level nodes; an empty array if there's nothing
 * meaningful (e.g. a single line — that's a normal paste, not an outline).
 */
export function parseOutline(raw: string): OutlineNode[] {
    const rawLines = raw.replace(/\r\n?/g, '\n').split('\n');
    type Parsed = { indent: number; text: string };
    const lines: Parsed[] = [];

    for (const line of rawLines) {
        if (!line.trim()) continue;
        // Measure indent: tabs as 1 "unit" each, spaces counted raw (bucketed later).
        const m = line.match(/^([ \t]*)(.*)$/);
        const ws = m![1];
        let body = m![2];
        // Tab-based indent → unit count; otherwise raw space count (bucketed below).
        const tabCount = (ws.match(/\t/g) || []).length;
        const spaceCount = ws.replace(/\t/g, '').length;
        const indent = tabCount > 0 ? tabCount : spaceCount;
        // Strip a leading bullet / numbering marker.
        body = body.replace(/^\s*([-*•–]|\d+[.)])\s+/, '').trim();
        if (!body) continue;
        lines.push({ indent, text: body });
    }

    if (lines.length < 2 && (lines.length === 0 || lines[0].indent === 0)) {
        // 0 lines, or a single top-level line → not a meaningful outline.
        return [];
    }

    // Bucket raw space indents into levels by the smallest indent step observed.
    const step = lines
        .map(l => l.indent)
        .filter(i => i > 0)
        .reduce((min, i) => (min === 0 ? i : Math.min(min, i)), 0) || 1;

    const roots: OutlineNode[] = [];
    // stack[level] = last node created at that depth
    const stack: { level: number; node: OutlineNode }[] = [];

    for (const l of lines) {
        const level = l.indent === 0 ? 0 : Math.round(l.indent / step);
        const node: OutlineNode = { text: l.text, children: [] };
        // Pop deeper-or-equal levels off the stack.
        while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
        if (stack.length === 0) {
            roots.push(node);
        } else {
            stack[stack.length - 1].node.children.push(node);
        }
        stack.push({ level, node });
    }

    return roots;
}

export const PALETTE = [
    '#e03131', // Red
    '#1971c2', // Blue
    '#2f9e44', // Green
    '#f08c00', // Orange
    '#9c36b5', // Purple
    '#0b7285', // Teal
    '#748ffc', // Indigo
    '#f76707', // Deep Orange
    '#099268', // Green-Teal
];

/**
 * Element types that are branches/edges, never tree nodes.
 *
 * One list, exported, because there were five copies of it and they had drifted: the layout's
 * omitted `polyline` while navigation's and the store's included it, so a polyline carrying a
 * `parentId` counted as a child when laying out and as a connector when navigating. A node that
 * exists for one subsystem and not another is the kind of disagreement that shows up as an
 * unreproducible layout glitch.
 */
export const MINDMAP_CONNECTOR_TYPES: readonly string[] =
    ['organicBranch', 'arrow', 'line', 'bezier', 'polyline'];

/** True when an element can be a tree node (i.e. isn't a branch/edge). */
export const isMindmapNodeType = (type: string): boolean => !MINDMAP_CONNECTOR_TYPES.includes(type);

/**
 * A node's children, in the order the layout lays them out — store-array order. Single source
 * of truth for both the ordering and the connector filtering, so layout, navigation and the
 * outline export can never disagree about what a branch contains or what sequence it reads in.
 */
export const mindmapChildren = (
    parentId: string,
    elements: readonly DrawingElement[],
): DrawingElement[] => elements.filter(e => e.parentId === parentId && isMindmapNodeType(e.type));

/** target node id → the connector that ends on it (the branch feeding that node). */
function indexIncomingConnectors(elements: readonly DrawingElement[]): Map<string, DrawingElement> {
    const byTarget = new Map<string, DrawingElement>();
    for (const e of elements) {
        const target = e.endBinding?.elementId;
        if (!target || byTarget.has(target)) continue;
        if (MINDMAP_CONNECTOR_TYPES.includes(e.type)) byTarget.set(target, e);
    }
    return byTarget;
}

export class MindmapLayoutEngine {
    private hSpacing: number;
    private vSpacing: number;
    private leafGap: number;

    constructor(spacing?: { hSpacing?: number; vSpacing?: number; leafGap?: number }) {
        this.hSpacing = spacing?.hSpacing ?? 100;
        this.vSpacing = spacing?.vSpacing ?? 40;
        // Two leaf siblings only need room not to touch — the full `hSpacing` is meant to
        // separate whole SUBTREES. Charging every leaf pair the subtree gap is what spread a
        // 66-node vertical tree across ~9800px (45 leaves × 120px of box, 44 × 100px of air).
        this.leafGap = spacing?.leafGap ?? 30;
    }

    /** Gap between two adjacent siblings: tight between leaves, full width between subtrees. */
    private siblingGap(a: MindmapNode, b: MindmapNode): number {
        return a.children.length === 0 && b.children.length === 0 ? this.leafGap : this.hSpacing;
    }

    /** Total of the pairwise gaps across a sibling row (0 for a single child). */
    private rowGaps(children: MindmapNode[]): number {
        let total = 0;
        for (let i = 1; i < children.length; i++) total += this.siblingGap(children[i - 1], children[i]);
        return total;
    }

    /**
     * Builds a tree structure starting from the root element.
     */
    buildTree(rootId: string, elements: readonly DrawingElement[], visited?: Set<string>, skipCollapsed = false): MindmapNode | null {
        const _visited = visited || new Set<string>();
        if (_visited.has(rootId)) return null;
        _visited.add(rootId);

        const rootElement = elements.find(e => e.id === rootId);
        if (!rootElement) return null;

        const node: MindmapNode = {
            id: rootElement.id,
            element: rootElement,
            children: [],
            width: rootElement.width,
            height: rootElement.height,
            x: rootElement.x,
            y: rootElement.y
        };

        // When skipCollapsed is set, a collapsed node is treated as a leaf so its
        // (hidden) subtree reserves no space and siblings pack tighter. Its hidden
        // descendants keep their positions until the node is expanded and re-laid-out.
        if (skipCollapsed && rootElement.isCollapsed) return node;

        // Connectors are filtered out — they can inherit parentId from a SolidJS proxy spread.
        for (const childEl of mindmapChildren(rootId, elements)) {
            const childNode = this.buildTree(childEl.id, elements, _visited, skipCollapsed);
            if (childNode) {
                node.children.push(childNode);
            }
        }

        return node;
    }

    /**
     * Calculates positions for a horizontal layout.
     */
    layoutHorizontal(root: MindmapNode, direction: 'right' | 'left' = 'right') {
        this.calculateSubtreeHeights(root);
        this.assignHorizontalPositions(root, root.x, root.y, direction);
    }

    /**
     * Balanced layout: top-level branches are split left/right of the root so the
     * map stays compact and symmetric (the classic mind-map look). Each side's
     * subtrees are stacked vertically and centred on the root; the root stays put.
     */
    layoutBalanced(root: MindmapNode) {
        this.calculateSubtreeHeights(root);
        const kids = root.children;
        if (kids.length === 0) return;
        const mid = Math.ceil(kids.length / 2);
        this.placeBalancedSide(root, kids.slice(0, mid), 'right');
        this.placeBalancedSide(root, kids.slice(mid), 'left');
    }

    private placeBalancedSide(root: MindmapNode, kids: MindmapNode[], dir: 'right' | 'left') {
        if (kids.length === 0) return;
        const totalH = kids.reduce((a, c) => a + c.totalHeight!, 0) + (kids.length - 1) * this.vSpacing;
        let currentY = root.y + (root.height / 2) - (totalH / 2);
        const startX = dir === 'right' ? root.x + root.width + this.hSpacing : root.x - this.hSpacing;
        for (const child of kids) {
            const childX = dir === 'right' ? startX : startX - child.width;
            const childY = currentY + (child.totalHeight! / 2) - (child.height / 2);
            // Each branch (and its whole subtree) flows outward in its side's direction.
            this.assignHorizontalPositions(child, childX, childY, dir);
            currentY += child.totalHeight! + this.vSpacing;
        }
    }

    /**
     * Calculates positions for a vertical layout.
     */
    layoutVertical(root: MindmapNode, direction: 'down' | 'up' = 'down') {
        this.calculateSubtreeWidths(root);
        this.assignVerticalPositions(root, root.x, root.y, direction);
    }

    private calculateSubtreeHeights(node: MindmapNode): number {
        if (node.children.length === 0) {
            node.totalHeight = node.height;
            return node.totalHeight;
        }

        const childrenHeight = node.children.reduce((acc, child) => acc + this.calculateSubtreeHeights(child), 0);
        const totalSpacing = (node.children.length - 1) * this.vSpacing;
        node.totalHeight = Math.max(node.height, childrenHeight + totalSpacing);
        return node.totalHeight;
    }

    private assignHorizontalPositions(node: MindmapNode, x: number, y: number, direction: 'right' | 'left') {
        node.x = x;
        node.y = y;

        if (node.children.length === 0) return;

        // Right: children sit a gap to the right of the parent's right edge.
        // Left:  children sit a gap to the left, so each child's RIGHT edge is the
        // anchor (childX = anchor - child.width, computed in the loop).
        const startX = direction === 'right' ? x + node.width + this.hSpacing : x - this.hSpacing;

        // Vertically center the children block against the parent.
        const totalChildrenHeight = node.children.reduce((acc, c) => acc + c.totalHeight!, 0) + (node.children.length - 1) * this.vSpacing;
        let currentY = y + (node.height / 2) - (totalChildrenHeight / 2);

        for (const child of node.children) {
            const childX = direction === 'right' ? startX : startX - child.width;
            const childY = currentY + (child.totalHeight! / 2) - (child.height / 2);
            this.assignHorizontalPositions(child, childX, childY, direction);
            currentY += child.totalHeight! + this.vSpacing;
        }
    }

    private calculateSubtreeWidths(node: MindmapNode): number {
        if (node.children.length === 0) {
            node.totalWidth = node.width;
            return node.totalWidth;
        }

        const childrenWidth = node.children.reduce((acc, child) => acc + this.calculateSubtreeWidths(child), 0);
        node.totalWidth = Math.max(node.width, childrenWidth + this.rowGaps(node.children));
        return node.totalWidth;
    }

    private assignVerticalPositions(node: MindmapNode, x: number, y: number, direction: 'down' | 'up') {
        node.x = x;
        node.y = y;

        if (node.children.length === 0) return;

        const startY = direction === 'down' ? y + node.height + this.vSpacing : y - this.vSpacing;

        const totalChildrenWidth = node.children.reduce((acc, c) => acc + c.totalWidth!, 0) + this.rowGaps(node.children);
        let currentX = x + (node.width / 2) - (totalChildrenWidth / 2);

        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            if (i > 0) currentX += this.siblingGap(node.children[i - 1], child);
            const childY = direction === 'down' ? startY : startY - child.height;
            const childX = currentX + (child.totalWidth! / 2) - (child.width / 2);
            this.assignVerticalPositions(child, childX, childY, direction);
            currentX += child.totalWidth!;
        }
    }

    /**
     * Radial ("neuron") layout: concentric rings around the central topic.
     *
     * Overlap-free by construction, which the previous version was not — it split each
     * parent's wedge EVENLY among its children regardless of how much subtree each had to
     * hold, measured rings from the parent's centre rather than the root's, and shrank the
     * radius by 0.8 per level while the node count per ring grew. A 66-node tree came out
     * with 46 overlapping pairs.
     *
     * Two invariants replace that guesswork:
     *   • Angular — a node's wedge is its share of the tree's LEAVES, so the whole 2π is
     *     divided in proportion to how much each subtree actually needs. Composed down the
     *     tree, every node's span is `(its leaves / total leaves) × 2π`, and the first ring
     *     is sized so even a one-leaf node gets an arc wider than a node box.
     *   • Radial — rings are concentric about the root and step out by more than a node's
     *     extent, so neighbouring rings cannot touch either.
     */
    layoutRadial(root: MindmapNode) {
        this.countLeaves(root);
        if (root.children.length === 0) return;

        // Size everything off the largest node, so the tightest spot in the map still fits.
        const extent = this.maxNodeExtent(root);
        const ringGap = extent + this.vSpacing;
        // Arc each leaf must be able to claim; the first ring's circumference has to supply
        // one of these per leaf, which is what makes the angular invariant hold everywhere.
        const leafArc = extent + this.vSpacing;
        const firstRing = Math.max(
            extent + this.hSpacing,
            (root.leafCount! * leafArc) / (2 * Math.PI),
        );

        const cx = root.x + root.width / 2;
        const cy = root.y + root.height / 2;
        // Start at 12 o'clock so the first branch reads as "top" rather than "right".
        this.assignRadialPositions(root, cx, cy, -Math.PI / 2, Math.PI * 2, firstRing, ringGap);
    }

    /** Leaves under each node (a collapsed node counts as one), memoised onto the tree. */
    private countLeaves(node: MindmapNode): number {
        node.leafCount = node.children.length === 0
            ? 1
            : node.children.reduce((sum, c) => sum + this.countLeaves(c), 0);
        return node.leafCount;
    }

    /** The largest width-or-height in the tree — the box every gap has to clear. */
    private maxNodeExtent(node: MindmapNode): number {
        return node.children.reduce(
            (max, c) => Math.max(max, this.maxNodeExtent(c)),
            Math.max(node.width, node.height),
        );
    }

    /**
     * Place `node`'s children on the ring at `radius` (measured from the root centre
     * cx/cy), splitting `span` radians starting at `startAngle` in proportion to leaf count.
     */
    private assignRadialPositions(
        node: MindmapNode, cx: number, cy: number,
        startAngle: number, span: number, radius: number, ringGap: number,
    ) {
        if (node.children.length === 0) return;

        let angle = startAngle;
        for (const child of node.children) {
            const childSpan = span * (child.leafCount! / node.leafCount!);
            const mid = angle + childSpan / 2;
            child.x = cx + Math.cos(mid) * radius - child.width / 2;
            child.y = cy + Math.sin(mid) * radius - child.height / 2;
            this.assignRadialPositions(child, cx, cy, angle, childSpan, radius + ringGap, ringGap);
            angle += childSpan;
        }
    }

    /**
     * Collects all updated positions into a flat map.
     */
    /**
     * Applies semantic styling (colors, thickness, opacity) based on depth.
     */
    applySemanticStyling(root: MindmapNode) {
        // Root remains neutral or user-defined, but let's ensure it has styleUpdates initialized
        root.styleUpdates = {};

        // Curated typography: deeper nodes get a slightly smaller font so the
        // hierarchy reads visually. Floored so labels never overflow fixed-size
        // nodes (we only ever shrink relative to the root, never grow).
        const baseFont = root.element.fontSize || 20;

        root.children.forEach((branchRoot, index) => {
            const branchColor = PALETTE[index % PALETTE.length];
            this.styleSubtree(branchRoot, branchColor, 1, baseFont);
        });
    }

    private styleSubtree(node: MindmapNode, color: string, depth: number, baseFont: number) {
        const strokeWidth = Math.max(1.5, 4 - depth * 1);
        const opacity = Math.max(40, 100 - depth * 10);
        const fontSize = Math.max(14, Math.round(baseFont - depth * 2));

        node.styleUpdates = {
            strokeColor: color,
            strokeWidth,
            opacity,
            fontSize
        };

        for (const child of node.children) {
            this.styleSubtree(child, color, depth + 1, baseFont);
        }
    }

    /**
     * Collects all updated properties (position and style) into a flat map.
     */
    getUpdates(
        node: MindmapNode,
        elements: readonly DrawingElement[],
        updates: Map<string, Partial<DrawingElement>> = new Map(),
        // Built once at the top of the walk, not re-scanned per node: this used to do a
        // linear `elements.find` for every node in the tree, which is O(n²) over the whole
        // document and runs on every reflow.
        incoming?: Map<string, DrawingElement>,
    ) {
        const byTarget = incoming ?? indexIncomingConnectors(elements);
        updates.set(node.id, {
            x: node.x,
            y: node.y,
            ...node.styleUpdates
        });

        // Styling the incoming connector
        const connector = byTarget.get(node.id);
        if (connector && node.styleUpdates) {
            updates.set(connector.id, {
                strokeColor: node.styleUpdates.strokeColor,
                strokeWidth: node.styleUpdates.strokeWidth,
                opacity: node.styleUpdates.opacity
            });
        }

        for (const child of node.children) {
            this.getUpdates(child, elements, updates, byTarget);
        }
        return updates;
    }
}

/**
 * Resolve branch color and depth for a node in the mindmap tree.
 * Walks up the parentId chain to find the depth-1 ancestor (subtree root)
 * and returns its strokeColor as the branch color.
 * If the node IS a root (no parentId), assigns a new color from PALETTE.
 */
export function getBranchInfo(
    parentId: string,
    elements: readonly DrawingElement[]
): { color: string; depth: number; strokeWidth: number; opacity: number } {
    const parent = elements.find(e => e.id === parentId);
    if (!parent) return { color: '#000000', depth: 1, strokeWidth: 2, opacity: 90 };

    // Walk up the tree to find root and compute depth
    let current = parent;
    let depth = 1;
    const chain: DrawingElement[] = [current];

    while (current.parentId) {
        const p = elements.find(e => e.id === current.parentId);
        if (!p) break;
        chain.push(p);
        current = p;
        depth++;
    }

    // current is now the root node
    const root = current;

    if (depth === 1) {
        // Parent is the root — we're adding a depth-1 child (subtree root)
        // Auto-assign a color based on how many children the root already has
        const colorIndex = mindmapChildren(root.id, elements).length;
        const color = PALETTE[colorIndex % PALETTE.length];
        const sw = Math.max(1.5, 4 - depth * 1);
        const op = Math.max(40, 100 - depth * 10);
        return { color, depth, strokeWidth: sw, opacity: op };
    }

    // Depth >= 2: Find the depth-1 ancestor (subtree root) and use its color
    // chain = [parent, grandparent, ..., root]
    // The depth-1 node is chain[chain.length - 2] (one below root)
    const subtreeRoot = chain[chain.length - 2];
    const color = subtreeRoot.strokeColor || '#000000';
    const sw = Math.max(1.5, 4 - depth * 1);
    const op = Math.max(40, 100 - depth * 10);
    return { color, depth, strokeWidth: sw, opacity: op };
}
