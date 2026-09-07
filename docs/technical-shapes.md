# Technical Shapes Architecture

This document records the technical implementation details for specialized diagramming and 3D-simulated shapes in Yappy.

## Overview

The Technical Shapes feature introduces a set of specialized elements designed for Data Flow Diagrams (DFD), basic 3D representations, State Machine diagrams, and Sequence diagrams. These shapes are integrated into the core rendering pipeline and properties system.

## Shape Definitions

New element types were added to `ElementType` in `src/types.ts`:

### DFD & Infrastructure
- `dfdProcess`
- `dfdDataStore`
- `isometricCube`
- `cylinder`

### State Machine & Sequence Diagrams
- `stateStart` - Initial state marker (filled circle)
- `stateEnd` - Final state marker (bullseye/double circle)
- `stateSync` - Fork/Join synchronization bar
- `activationBar` - Sequence diagram lifeline activation
- `externalEntity` - External actor/system with 3D shadow

### Geometry Logic (`src/utils/shape-geometry.ts`)

These shapes utilize advanced geometry types to support internal dividers and simulated 3D faces while remaining compatible with both "Sketch" and "Architectural" rendering styles.

#### DFD & Infrastructure
- **DFD Process**: Implemented as a `multi` shape containing a `rect` for the enclosure and an open `points` path for the top internal divider.
- **DFD Data Store**: Implemented as a `multi` shape with two open `points` paths to prevent unwanted diagonal connections between the outer frame and the vertical label divider.
- **Isometric Cube**: A `multi` shape consisting of three distinct `points` paths representing the top, left, and right faces of a cube.
- **Cylinder**: A `multi` shape combining two `ellipse` paths (top/bottom) and two open `points` paths for the vertical edges.

#### State Machine & Sequence Diagrams
- **State Start**: Simple `ellipse` geometry representing the initial state as a filled circle.
- **State End**: `multi` shape with two concentric `ellipse` paths creating a bullseye effect for final states.
- **Sync Bar**: Basic `rect` geometry with minimal rounding, typically used as a thick horizontal or vertical bar.
- **Activation Bar**: Simple `rect` with sharp corners, designed to be narrow and tall for sequence diagram lifelines.
- **External Entity**: `multi` shape combining two `rect` paths with an offset to simulate a 3D drop shadow effect.

### UML Expansion (Phase 70)
- **umlComponent**: Implemented in `UmlGeneralRenderer`. Extends the base rectangle with two small tab rectangles ("ears") on the left edge, providing the standard UML 2.0 component representation.
- **umlState**: A specialized `UmlStateRenderer` that provides a two-section rounded rectangle. The top section contains the state name (`containerText`), and the bottom section contains state actions (`attributesText`).
- **umlLifeline**: Implemented in `UmlGeneralRenderer`. Renders an object box at the top (containing `containerText`) and a dashed vertical line extending to the full height of the element.
- **umlFragment**: Implemented in `UmlGeneralRenderer`. A container rectangle with a polygonal "operator" tab in the top-left corner (e.g., for `alt`, `opt`, `loop`). Double-clicking the tab edits the operator, while the main body edits the guard condition.
- **UML Signals & Interfaces**:
  - `umlSignalSend`: A pentagon pointing right (chevron shape).
  - `umlSignalReceive`: A concave pentagon (notched on the left).
  - `umlProvidedInterface`: A circle (lollipop) representation.
  - `umlRequiredInterface`: A semicircle arc (socket) representation.

## UI & State Management

### Tool Grouping
A new `TechnicalToolGroup` component (`src/components/technical-tool-group.tsx`) and `UmlToolGroup` (`src/components/uml-tool-group.tsx`) were created to house these tools. They follow the project's pattern of collapsible toolbar menus.

### Store Integration (`src/store/app-store.ts`)
- **State**: Added `selectedTechnicalType` and `selectedUmlType` to `AppState` to track the last used tools.
- **Actions**: Implemented corresponding setter functions to manage tool selection.

### Property Configuration (`src/config/properties.ts`)
The new shapes were added to the `applicableTo` list for all standard style properties, ensuring they support:
- Drawing Style (Sketch/Architectural)
- Fills (Hachure, Solid, Gradients)
- Borders (Rounded, Double, etc.)
- Typography (Labels and multi-section text for States/Fragments)

## Rendering Pipeline

Technical shapes are registered in `src/shapes/register-shapes.ts`. Simple geometric shapes use the `SpecialtyShapeRenderer`, while more complex structured shapes use `UmlStateRenderer` or `UmlGeneralRenderer`. This architecture ensures that even complex multi-part shapes correctly follow the "Rough" sketch style and architectural style toggles.
落控制
