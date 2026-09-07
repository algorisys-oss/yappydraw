# Mindmap Technical Documentation

This document outlines the architecture, algorithms, and data structures powering the Mindmap features in the application.

## 1. Data Model

The mindmap functionality relies on specific properties within the `DrawingElement` type to establish hierarchy and state.

### Core Properties
- **`parentId`** (`string | null`): The ID of the parent node. This establishes the hierarchical relationship. Roots have `null`.
- **`isCollapsed`** (`boolean`): Indicates whether the node's children (and their descendants) should be hidden.
- **`boundElements`** (`{ id: string, type: 'arrow' }[]`): A list of connectors attached to the node. This allows the system to update lines when nodes move.
- **`startBinding` / `endBinding`**: Properties on the connector (arrow) elements that link them to specific node IDs.

### Serialization & Persistence
To ensure these properties survive save/load cycles (JSON serialization), the `normalizeElement` function in `src/utils/migration.ts` explicitly preserves them.

```typescript
// src/utils/migration.ts
export const normalizeElement = (element: any): DrawingElement => {
    // ...
    return {
        // ...
        parentId: element.parentId || null,
        isCollapsed: !!element.isCollapsed,
        // ...
    };
};
```

## 2. Algorithms & Logic

### Hierarchical Movement
When a user drags a node, the system determines if it should move just that node or the entire subtree.

*   **Logic**: `handlePointerDown` in `Canvas.tsx`.
*   **Behavior**: 
    1.  If `Alt` key is held: Move ONLY the selected node (Isolated move).
    2.  Default: Identify all descendants using `getDescendants(id, elements)` (BFS traversal).
    3.  Add all descendants to the `initialPositions` map.
    4.  Update positions of all identified interaction elements during `handlePointerMove`.

### Smart Connection Routing (Dynamic Anchoring)
Connectors automatically adjust their start/end points to prevent visual intersections with node bodies.

*   **Implementation**: `refreshBoundLine` in `Canvas.tsx`.
*   **Algorithm**:
    1.  Calculate the difference vector (`dx`, `dy`) between the centers of the source and target nodes.
    2.  Determine dominance:
        *   If `Math.abs(dx) > Math.abs(dy)`: Horizontal dominance (use Left/Right anchors).
        *   If `Math.abs(dy) >= Math.abs(dx)`: Vertical dominance (use Top/Bottom anchors).
    3.  Assign specific sides:
        *   Right: `dx > 0`
        *   Left: `dx < 0`
        *   Bottom: `dy > 0`
        *   Top: `dy < 0`
    4.  Update `startBinding.position` and `endBinding.position` on the connector element.

```typescript
// Pseudocode for anchor selection
if (Math.abs(dx) > Math.abs(dy)) {
    startBinding.position = dx > 0 ? 'right' : 'left';
    endBinding.position = dx > 0 ? 'left' : 'right';
} else {
    startBinding.position = dy > 0 ? 'bottom' : 'top';
    endBinding.position = dy > 0 ? 'top' : 'bottom';
}
```

### Dynamic Spacing
When adding sibling nodes, the system calculates vertical offsets based on the actual geometry of existing elements to prevent overlap.

*   **Function**: `addSiblingNode` in `src/store/appStore.ts`.
*   **Logic**:
    1.  Retrieve the reference sibling element.
    2.  Calculate `vOffset`: `sibling.height + padding` (e.g., 40px).
    3.  Position the new node at `sibling.y + vOffset`.

### Reactive Redraws
The UI must update immediately when hierarchy states change (e.g., expanding/collapsing).

*   **Implementation**: `Canvas.tsx` uses a SolidJS `createEffect`.
*   **Tracking**: The effect monitors `el.isCollapsed` and `el.parentId`.
*   **Action**: Triggers a canvas redraw whenever these specific properties change on any element.

## 3. Interaction Design

### Context Menu Integration
Mindmap actions are exposed via the Context Menu for discoverability.

*   **Menu Items**: "Add Child", "Add Sibling", "Hierarchy" submenu.
*   **Availability**:
    *   "Add Child": Available for any single selected element.
    *   "Add Sibling": Available if the selected element has a `parentId`.

### Style Inheritance
To maintain visual consistency within a branch, new nodes inherit specific style properties from their source.

*   **Properties Inherited**:
    *   `strokeColor`
    *   `backgroundColor`
    *   `fillStyle`
    *   `strokeWidth`
    *   `roughness`
    *   `renderStyle` (e.g., Sketch vs Architectural)
    *   `opacity`
    *   `strokeStyle` (Solid/Dashed)

### Keyboard Shortcuts
*   **`Tab`**: Triggers `addChildNode` for the selected element.
*   **`Enter`**: Triggers `addSiblingNode` for the selected element.
*   **`Space`**: Toggles `isCollapsed` state (Expand/Collapse subtree).

## 4. Helper Utilities (`src/utils/hierarchy.ts`)

*   **`isElementHiddenByHierarchy(el, elements)`**: traverse up the parent chain; if any ancestor `isCollapsed`, return `true`.
*   **`getDescendants(parentId, elements)`**: Returns a flat array of all recursive children for a given parent ID.
*   **`isDescendantOf(targetId, ancestorId, elements)`**: Boolean check for ancestry.

## 5. Transform Shape Feature

The Transform Shape feature allows users to convert elements between different types while preserving their properties (position, size, text, styles).

### Implementation

*   **Location**: `src/utils/elementTransforms.ts`
*   **Core Function**: `changeElementType(elementId, newType)`
*   **Menu Integration**: Context menu "Transform Shape" submenu (appears below Hierarchy)

### Type Families

Transformations are restricted to "like-for-like" families to prevent data loss:

*   **Connectors**: `line`, `arrow`, `bezier`, `organicBranch`
*   **Shapes**: All shape types (rectangle, circle, diamond, etc.)

### Curve Style Options

For `line` and `arrow` connectors, a separate "Change Curve Style" submenu allows switching between routing algorithms:

*   **Straight** (`curveType: 'straight'`): Direct line between points
*   **Bezier** (`curveType: 'bezier'`): Smooth curved path with control points
*   **Elbow** (`curveType: 'elbow'`): Right-angle orthogonal routing

### Icon-Based Menu

The Transform Shape menu uses visual icons for better UX:

*   **3-column grid layout**: Compact display, especially on mobile
*   **Unicode/emoji icons**: → (arrow), ─ (line), ⤴ (bezier), 🌿 (organic), └─ (elbow), □ (rectangle), ○ (circle), etc.
*   **Tooltips**: Hover to see full shape names
*   **Scrollable**: Menu supports vertical scrolling when many options are present

### Control Point Initialization

When transforming to `bezier` or `organicBranch`, the system automatically initializes control points:

```typescript
const dx = endX - startX;
const dy = endY - startY;
const cp1 = { x: startX + dx * 0.25, y: startY + dy * 0.1 };
const cp2 = { x: endX - dx * 0.25, y: endY - dy * 0.1 };
```

This creates a default S-curve that can be adjusted by dragging the control point handles.
