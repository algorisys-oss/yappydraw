# Canvas Refactoring Plan

## Goal
Refactor the monolithic `src/components/canvas.tsx` (4300+ lines) into a modular, maintainable structure by extracting event handling, rendering logic, and state management into custom hooks and utility functions.
**NO FUNCTIONAL CHANGES**. The goal is purely structural refactoring to improve maintainability and readability.

## User Review Required
> [!NOTE]
> This refactoring is extensive involved moving large blocks of code. While no logic changes are intended, the risk of regression is non-zero.
> Please verify that all canvas interactions (drawing, selecting, moving, resizing, collecting, context menus) work as expected after the refactor.

## Proposed Changes

### 1. Create Directory Structure
Create a new directory `src/components/canvas/` to house the refactored components and hooks.

### 2. Extract Event Handling Hooks
Move the massive event handlers (`onPointerDown`, `onPointerMove`, `onPointerUp`) into a custom hook `useCanvasEvents`.
-   **File**: `src/components/canvas/use-canvas-events.ts`
-   **Logic**:
    -   `handlePointerDown` (Creation, Selection init, Connection init)
    -   `handlePointerMove` (Dragging, Resizing, Drawing, Hover effects)
    -   `handlePointerUp` (Commit action, cleanup)
    -   `handleWheel` (Zoom/Pan) - maybe separate `useCanvasNavigation`?

### 3. Extract Rendering Logic
Break down the `draw()` function into composable render functions.
-   **File**: `src/components/canvas/render-utils.ts` (or a `renderers/` folder)
    -   `renderBackground(ctx, ...)`
    -   `renderGrid(ctx, ...)`
    -   `renderElements(ctx, rc, ...)`
    -   `renderSelectionHandles(ctx, ...)`
    -   `renderGuides(ctx, ...)`
    -   `renderLaserTrail(ctx, ...)`
-   **File**: `src/components/canvas/use-canvas-render.ts`
    -   The main `draw` loop that calls the above helpers.
    -   Manages `requestAnimationFrame` loop and subscription to store changes.

### 4. Extract Interaction Logic
Move complex interaction logic out of the event handlers.
-   **File**: `src/components/canvas/interaction-utils.ts`
    -   `hitTestElement`
    -   `getHandleAtPosition`
    -   `checkBinding`
    -   `refreshBoundLine` / `refreshLinePoints`
    -   `calculateSmartElbowRoute` wrapper

### 5. Extract UI Overlay Logic
Separate the UI elements that sit on top of the canvas.
-   **File**: `src/components/canvas/CanvasContextMenu.tsx` (Wrapper for `ContextMenu` with `getContextMenuItems` logic)
-   **File**: `src/components/canvas/CanvasTextEditor.tsx` (The textarea logic)

### 6. Refactor `canvas.tsx`
The main `Canvas` component should essentially become a composition of these hooks and components:

```tsx
const Canvas = () => {
  const { canvasRef } = useCanvasRender();
  const { handlePointerDown, ... } = useCanvasEvents();
  
  return (
    <>
      <canvas ref={canvasRef} {...events} />
      <CanvasTextEditor />
      <CanvasContextMenu />
      <Minimap />
    </>
  )
}
```

## Verification Plan

### Automated Tests
Since this is a refactor of a UI-heavy component involving html5 canvas, unit tests for the extracted logic (like `hitTestElement` or `renderGrid`) would be ideal but might require significant setup if not already present.
-   **Action**: Run existing build/test commands to ensure no transpilation errors.
    -   `npm run type-check` (if available) or `csc` check.

### Manual Verification
The user must manually verify the following interactions:
1.  **Drawing**: Draw rectangles, circles, lines, arrows.
2.  **Selection**: Select single, select multiple (box select), move, resize.
3.  **Connections**: Connect two shapes with an arrow, move the shapes, verify line updates.
4.  **Text**: Double click to edit text, verify auto-resize.
5.  **Context Menu**: Right click, check options (colors, layer order).
6.  **Zoom/Pan**: Mouse wheel zoom, panning.
