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

export type LayoutDirection = 'horizontal-right' | 'horizontal-left' | 'vertical-down' | 'vertical-up' | 'radial';

const PALETTE = [
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
    private hSpacing = 100;
    private vSpacing = 40;

    /**
     * Builds a tree structure starting from the root element.
     */
    buildTree(rootId: string, elements: readonly DrawingElement[]): MindmapNode | null {
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

        const childrenElements = elements.filter(e => e.parentId === rootId);
        for (const childEl of childrenElements) {
            const childNode = this.buildTree(childEl.id, elements);
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

        const startX = direction === 'right' ? x + node.width + this.hSpacing : x - this.hSpacing; // simplified for left
        // For left we need to adjust by child width, handled below

        let currentY = y - (node.totalHeight! / 2) + (node.children[0].totalHeight! / 2);

        // Center the middle child with parent if possible, or just stack
        const totalChildrenHeight = node.children.reduce((acc, c) => acc + c.totalHeight!, 0) + (node.children.length - 1) * this.vSpacing;
        currentY = y + (node.height / 2) - (totalChildrenHeight / 2);

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
        this.assignRadialPositions(root, root.x, root.y, 0, Math.PI * 2, 250);
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

            // Sub-children get a smaller wedge of the parent's angle to prevent overlap
            const wedge = Math.min(Math.PI / 2, anglePerChild * 0.9);
            this.assignRadialPositions(child, childX, childY, angle - wedge / 2, angle + wedge / 2, radius * 0.8);
        }
    }

    /**
     * Collects all updated positions into a flat map.
     */
    /**
     * Applies semantic styling (colors, thickness, opacity) based on depth.
     */
    applySemanticStyling(root: MindmapNode, elements: readonly DrawingElement[]) {
        // Root remains neutral or user-defined, but let's ensure it has styleUpdates initialized
        root.styleUpdates = {};

        root.children.forEach((branchRoot, index) => {
            const branchColor = PALETTE[index % PALETTE.length];
            this.styleSubtree(branchRoot, branchColor, 1, elements);
        });
    }

    private styleSubtree(node: MindmapNode, color: string, depth: number, elements: readonly DrawingElement[]) {
        const strokeWidth = Math.max(1, 4 - depth * 0.5);
        const opacity = Math.max(40, 100 - depth * 10);

        node.styleUpdates = {
            strokeColor: color,
            strokeWidth,
            opacity
        };

        // Also style the connector leading TO this node
        const connector = elements.find(e =>
            (e.type === 'arrow' || e.type === 'line' || e.type === 'bezier') &&
            e.endBinding?.elementId === node.id
        );

        if (connector) {
            // Store connector update in a separate map if we don't want to add connectors to nodes
            // But for simplicity, we can let node.styleUpdates track its incoming connector too?
            // Actually, better to have a generic updates map.
        }

        for (const child of node.children) {
            this.styleSubtree(child, color, depth + 1, elements);
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
            (e.type === 'arrow' || e.type === 'line' || e.type === 'bezier') &&
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
