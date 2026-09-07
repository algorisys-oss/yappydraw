# Canvas Component Review

## Overview
**File:** `src/components/canvas.tsx`
**Size:** ~5000 lines
**Purpose:** The core rendering engine and interaction handler for the Yappy application. It manages the HTML5 Canvas, processes user input (mouse/touch/pen), handles element manipulation, and coordinates with the SolidJS store.

## Architecture & Responsibilities
The component is currently a "God Object" handling mixed concerns:
1.  **Rendering Engine:**
    -   Implements a custom rendering loop using `requestAnimationFrame`.
    -   Handles distinct rendering modes: `Infinite Canvas` vs `Slide Presentation`.
    -   Integrates with `RoughJS` for sketch-style rendering.
    -   Manages view transformations (Pan/Zoom) and coordinate systems (Screen vs World).

2.  **Event Handling Systems:**
    -   **Pointer Events:** A complex state machine handling `down`, `move`, `up` for tools like Selection, Pen, Laser, and Shapes.
    -   **Drag & Drop:** Handling external assets (images, colors).
    -   **Context Menu:** Embedded logic for generating valid actions based on selection state.
    -   **Hotkeys:** Some keyboard shortcuts are handled directly or inferred.

3.  **State Management Logic:**
    -   Directly mutates the global SolidJS store (`app-store.ts`).
    -   Implements local logic for specific features:
        -   **Mindmaps:** Collapsing/expanding subtrees.
        -   **Connectors:** Binding logic (snapping to anchors/edges), dynamic routing.
        -   **Selection:** Multi-select, group selection, bounding box calculations.
        -   **History:** Pushing undo/redo states on specific actions.

## Key Subsystems Analysis

### 1. Rendering Loop
-   **Mechanism:** Reactive `createEffect` tracks store changes (elements, transform, settings) and triggers `draw()`.
-   **Optimization:** Uses `requestAnimationFrame` to batch renders. Performance metrics are tracked via `perfMonitor`.
-   **Complexity:** The `draw` function is massive, branching for every element type, rendering handles, guides, grids, and overlays in a single imperative flow.

### 2. Interaction & Hit Testing
-   **Hit Testing:** Implements custom geometry checks (`hitTestElement`) for various shapes, including rotated bounding boxes and specific polygon logic.
-   **Bindings:** The `checkBinding` and `refreshBoundLine` functions implement a complex graph constraint system for connecting lines/arrows to shapes, maintaining these relationships during moves.
-   **Tool Logic:**
    -   **Pen/Ink:** Uses a throttled buffer system (`penPointsBuffer`) to handle high-frequency input without blocking the UI thread.
    -   **Laser:** Uses a mutable array (`laserTrailData`) bypassing the reactive store for transient animations to ensure 60fps performance.

### 3. Advanced Features
-   **Parametric Shapes:** Handles custom "control points" for shapes like `isometricCube`, `star`, and `perspectiveBlock`, allowing users to manipulate internal geometry (depth, ratio, angle) via on-canvas handles.
-   **Slide Mode:** Includes logic for viewport culling and "projecting" Master Layer elements onto individual slides.

## Critical Observations

### Strengths
-   **Performance-Aware:** Explicit optimizations for high-frequency events (pen, laser) show a good understanding of browser limitations.
-   **Feature-Rich:** Supports a vast array of interactions (snapping, binding, grouping, parametric adjustment) natively.
-   **Reactive Integration:** Tightly coupled with SolidJS for fine-grained reactivity, avoiding unnecessary React-style VDOM overhead.

### Weaknesses (Refactoring Opportunities)
1.  **Monolithic Scale:** At ~5000 lines, the file is difficult to maintain. Adding a new tool or event handler risks regression in unrelated areas.
2.  **Mixed Concerns:** Rendering logic is interleaved with event handling and business logic.
    -   *Recommendation:* Extract renderers into `src/renderers/` (e.g., `ShapeRenderer`, `ConnectorRenderer`, `HandleRenderer`).
3.  **Complex Event Handlers:** `handlePointerDown/Move/Up` are massive functions with nested if/else chains for every tool.
    -   *Recommendation:* Implement the `State Pattern` or `Strategy Pattern` for tools (e.g., `SelectionTool`, `PenTool`, `ShapeTool` classes that handle their own events).
4.  **Business Logic in View:** Logic for "what happens when I drag this" (e.g., Mindmap reordering, Binding updates) lives inside the UI component.
    -   *Recommendation:* Move complex operations (like `reorderMindmap` or `refreshBoundLine`) to the Store actions or a dedicated `InteractionManager`.

## Conclusion
The `canvas.tsx` component is a robust engine powering the app's core value. However, its current size suggests it has outgrown its initial structure. Refactoring into specialized Renderers and Tool handlers is recommended to maintain velocity as new features are added.
