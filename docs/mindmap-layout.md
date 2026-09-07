# Mindmap Layout Engine

The Mindmap Layout Engine provides automated tree organization for hierarchical diagrams. It supports multiple directional strategies to keep complex mindmaps structured and readable.

## 1. Core Architecture

The engine operates in three distinct phases:

1.  **Tree Building**: The flat element array is converted into a recursive `MindmapNode` tree structure starting from a selected root.
2.  **Layout Calculation**: Position coordinates (X, Y) are calculated based on the selected strategy, ensuring consistent spacing and zero overlap.
3.  **Batch Update**: Calculated updates are applied to the application store in a single operation to preserve history and performance.

### Data Structures
```typescript
interface MindmapNode {
    id: string;
    element: DrawingElement;
    children: MindmapNode[];
    width: number;
    height: number;
    x: number;
    y: number;
    totalHeight?: number; // Internal: Subtree bounds
    totalWidth?: number;  // Internal: Subtree bounds
}
```

## 2. Layout Strategies

### Horizontal (Right/Left)
Organizes nodes as a horizontal tree branching away from the root.
- **Logic**: Calculates the total height of subtrees recursively. Children are distributed vertically centered relative to their parent's Y-position.
- **Spacing**: Default 150px horizontal gap between levels.

### Vertical (Down/Up)
Organizes nodes as a vertical hierarchy (Top-Down or Bottom-Up).
- **Logic**: Calculates the total width of subtrees. Children are distributed horizontally centered relative to their parent's X-position.
- **Spacing**: Default 100px vertical gap between levels.

### Radial (Neuron)
Distributes nodes in a $360^\circ$ circular pattern around a central hub.
- **Logic**: Uses polar coordinates to place children. Sub-children are constrained to narrow angular "wedges" to prevent branch overlap.
- **Visuals**: Creates a "burst" or "neuron" structure from any selected node.

### Semantic Branch Styling
Automatically applies visual hierarchy to a subtree.
- **Auto-Coloring**: Primary branches (Level 1) are assigned a unique color from a harmonious palette. All descendants inherit their branch color.
- **Tapering**: Line thickness decreases as nodes get deeper in the hierarchy (starting from ~4px down to 1px).
- **Fading**: Opacity subtly decreases at deeper levels to maintain focus on the root and primary nodes.

## 3. Integration & Usage

### Context Menu
Auto Layout options are available via **Hierarchy > Auto Layout** when a single node is selected. The selected node becomes the "temporary root" for that layout operation.

### Store Integration
The `reorderMindmap(rootId, direction)` action in `src/store/app-store.ts` handles the execution. It:
1.  Invokes `MindmapLayoutEngine`.
2.  Creates a single undo/redo snapshot.
3.  Performs a performant batch update of all affected elements.

## 4. Implementation Details
**File**: `src/utils/mindmap-layout.ts`

### Collision Prevention
The engine uses **Subtree Bound Calculation**. Before assigning positions, it recursively determines the maximum "footprint" (height or width) of every node's entire descendant tree. This footprint is used as the spacing buffer, effectively preventing branches from crashing into each other.

### Coordinate Origin
Positioning is calculated based on **Node Centers**. This ensures that nodes of different sizes (e.g. a wide rectangle vs a tall circle) stay perfectly centered relative to their connections.
