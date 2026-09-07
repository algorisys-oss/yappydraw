# Batch Transform Implementation

This document details the implementation of the Batch Transform feature, which allows users to convert multiple selected elements to a different type simultaneously.

## Core Logic

### 1. Mixed Selection Handling (`Canvas.tsx`)
The Context Menu logic in `Canvas.tsx` has been enhanced to handle selections containing multiple element types. Instead of treating the selection as a monolith, it splits the selection into two families:
- **Shapes**: `rectangle`, `circle`, `diamond`, etc.
- **Connectors**: `line`, `arrow`, `bezier`, `organicBranch`.

When a user opens the context menu with a mixed selection:
- The system checks `shapesInSelection` and `connectorsInSelection`.
- If shapes are present, a **"Transform Shapes"** submenu is generated, populated with shape options (e.g., Rectangle, Cloud). This action affects *only* the shape elements in the selection.
- If connectors are present, a **"Transform Connectors"** submenu is generated, populated with connector options (e.g., Line, Bezier). This action affects *only* the connector elements.
- This decoupling allows "Select All" operations to remain functional for batch updates without invalidating the menu.

### 2. Type Transformation (`elementTransforms.ts`)
The `changeElementType` function manages the atomic transformation of a single element.
- **Validation**: It enforces "like-for-like" transformations (Connector ↔ Connector, Shape ↔ Shape) to prevent data corruption.
- **Curve Synchronization**: A critical fix was implemented to ensure visual consistency:
    - When transforming to `bezier` or `organicBranch` types, the function explicitly sets `curveType` to `bezier`. This ensures the element renders as a curve immediately, rather than retaining a `straight` style from its previous state.
    - Conversely, transforming from a curved type to a linear type (Line/Arrow) resets `curveType` to `straight` to align with user expectations.

### 3. Batch History Management
To ensure a smooth Undo/Redo experience, batch operations are grouped into a single history step.
- The `pushToHistory()` function is called *once* before iterating through the selection.
- The individual `updateElement` or `changeElementType` calls within the loop are invoked with a `pushHistory: false` flag to suppress intermediate history states.

## Files Modified
- `src/components/Canvas.tsx`: UI logic for Context Menu generation and batch iteration.
- `src/utils/elementTransforms.ts`: Core transformation logic and property synchronization.
- `src/types.ts`: (Reference) Element type definitions.

