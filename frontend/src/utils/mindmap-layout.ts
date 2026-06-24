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

export class MindmapLayoutEngine {
    private hSpacing: number;
    private vSpacing: number;

    constructor(spacing?: { hSpacing?: number; vSpacing?: number }) {
        this.hSpacing = spacing?.hSpacing ?? 100;
        this.vSpacing = spacing?.vSpacing ?? 40;
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

        // Filter out connector types — they can inherit parentId from SolidJS proxy spread
        const CONNECTOR_TYPES = ['organicBranch', 'arrow', 'line', 'bezier'];
        const childrenElements = elements.filter(e =>
            e.parentId === rootId && !CONNECTOR_TYPES.includes(e.type)
        );
        for (const childEl of childrenElements) {
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
        const totalSpacing = (node.children.length - 1) * this.hSpacing;
        node.totalWidth = Math.max(node.width, childrenWidth + totalSpacing);
        return node.totalWidth;
    }

    private assignVerticalPositions(node: MindmapNode, x: number, y: number, direction: 'down' | 'up') {
        node.x = x;
        node.y = y;

        if (node.children.length === 0) return;

        const startY = direction === 'down' ? y + node.height + this.vSpacing : y - this.vSpacing;

        const totalChildrenWidth = node.children.reduce((acc, c) => acc + c.totalWidth!, 0) + (node.children.length - 1) * this.hSpacing;
        let currentX = x + (node.width / 2) - (totalChildrenWidth / 2);

        for (const child of node.children) {
            const childY = direction === 'down' ? startY : startY - child.height;
            const childX = currentX + (child.totalWidth! / 2) - (child.width / 2);
            this.assignVerticalPositions(child, childX, childY, direction);
            currentX += child.totalWidth! + this.hSpacing;
        }
    }

    /**
     * Calculates positions for a radial (neuron) layout.
     */
    layoutRadial(root: MindmapNode) {
        // Scale the first ring with fan-out so many top-level branches don't crowd
        // (circumference grows with child count, keeping arc-spacing roughly constant).
        const childCount = root.children.length;
        const radius = Math.max(250, Math.round((childCount * 90) / (2 * Math.PI)) + 180);
        this.assignRadialPositions(root, root.x, root.y, 0, Math.PI * 2, radius);
    }

    private assignRadialPositions(node: MindmapNode, x: number, y: number, startAngle: number, endAngle: number, radius: number) {
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

            // Calculate child center relative to parent center
            const childCenterX = centerX + Math.cos(angle) * (radius + node.width / 2);
            const childCenterY = centerY + Math.sin(angle) * (radius + node.height / 2);

            const childX = childCenterX - child.width / 2;
            const childY = childCenterY - child.height / 2;

            // Sub-children get a smaller wedge of the parent's angle to prevent overlap.
            // Keep a radius floor so deep branches don't collapse into the centre.
            const wedge = Math.min(Math.PI / 2, anglePerChild * 0.9);
            this.assignRadialPositions(child, childX, childY, angle - wedge / 2, angle + wedge / 2, Math.max(160, radius * 0.8));
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
    getUpdates(node: MindmapNode, elements: readonly DrawingElement[], updates: Map<string, Partial<DrawingElement>> = new Map()) {
        const currentUpdates: Partial<DrawingElement> = {
            x: node.x,
            y: node.y,
            ...node.styleUpdates
        };
        updates.set(node.id, currentUpdates);

        // Styling the incoming connector
        const connector = elements.find(e =>
            (e.type === 'arrow' || e.type === 'line' || e.type === 'bezier' || e.type === 'organicBranch') &&
            e.endBinding?.elementId === node.id
        );

        if (connector && node.styleUpdates) {
            updates.set(connector.id, {
                strokeColor: node.styleUpdates.strokeColor,
                strokeWidth: node.styleUpdates.strokeWidth,
                opacity: node.styleUpdates.opacity
            });
        }

        for (const child of node.children) {
            this.getUpdates(child, elements, updates);
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
        const CONNECTOR_TYPES = ['organicBranch', 'arrow', 'line', 'bezier'];
        const existingChildren = elements.filter(e => e.parentId === root.id && !CONNECTOR_TYPES.includes(e.type));
        const colorIndex = existingChildren.length;
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
