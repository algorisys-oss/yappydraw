# Layer System Technical Documentation

Yappy implements a robust, hierarchical layering system similar to professional design tools like Figma or Procreate. This document outlines the technical architecture, rendering pipeline, and interaction model of the layer system.

## 1. Data Architecture

Layers are defined as a flat array in the global state (`AppState.layers`), but can represent a hierarchy through parent-child relationships.

### The `Layer` Interface
```typescript
export interface Layer {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    opacity: number;    // 0-1 (multiplicative)
    order: number;      // Z-index (lower numbers in background)
    backgroundColor?: string; // Optional full-canvas color for the layer
    expanded?: boolean;    // For groups: whether child layers are visible in panel
    isMaster?: boolean;    // Master layer content repeats on every slide
}
```

### Master Layers
When `isMaster` is set to `true`, the layer behaves as a template for all slides in the document.
- **Auto-Projection**: Elements on a Master layer are rendered relative to the spatial origin of the currently active slide.
- **Universal Visibility**: Master elements appear on every slide without needing duplication.
- **Dynamic Variable Support**: Text elements on Master layers support variable substitution (e.g., `${slideNumber}`).

### Element Association
Each `DrawingElement` stores a `layerId` property. This creates a loosely coupled relationship where elements belong to exactly one layer.

## 2. Rendering Pipeline

The rendering process in `Canvas.tsx` follows a strict "Painter's Algorithm" approach.

### Step-by-Step Render
1.  **Sorting**: The application sorts the `layers` array by the `order` property (`sortedLayers`).
2.  **Layer Iteration**: The canvas iterates through each sorted layer.
3.  **Visibility Check**: If a layer is marked `visible: false`, it and all its elements are skipped completely.
4.  **Background Rendering**: If a layer has a `backgroundColor`, a full-canvas rectangle is drawn first.
5.  **Multiplicative Opacity**: The layer's `opacity` (0-1) is passed to the `renderElement` utility (which delegates to the specific `ShapeRenderer`). The final element opacity is `element.opacity * layer.opacity`.
6.  **Element Filtering**: The loop filters `store.elements` for those where `el.layerId === layer.id`.
7.  **Z-Order within Layer**: Elements within the same layer are rendered in the order they were added to the `store.elements` array.

## 3. Interaction & Selection

### Target Layer
There is always an `activeLayerId`. All new elements created via drawing tools are automatically assigned to this layer.

### Hit Testing
When a user clicks the canvas, hit testing (`hitTestElement`) respects layer state:
- **Locked Layers**: If a layer is `locked: true`, elements on that layer are ignored by the selection logic.
- **Top-Down Priority**: Selection logic typically iterates through elements in reverse order (top to bottom) so the visually topmost element is picked first.

### Layer Operations
- **Moving Elements**: Changing an element's layer simply involves updating its `layerId` property.
- **Reordering**: Dragging layers in the UI changes their `order` value. High values appear "on top" of low values.
- **Transparency**: Because each layer can have its own opacity, complex overlays and "tracing paper" effects can be achieved by lowering the opacity of a top layer.

## 4. Performance Optimizations

- **Culling**: Even within layers, viewport culling is applied to individual elements to ensure the renderer doesn't process objects far outside the screen.
- **Batching**: RoughJS instances are created once per layer during the render loop to reduce overhead compared to per-element initialization.
- **Minimap Fidelity**: The Minimap tracks the `order` and `visibility` of layers to ensure the navigation overview perfectly matches the main workspace.

## 5. Logical vs. Physical Isolation

A common question is how Yappy provides sketch isolation while using only a **single HTML5 `<canvas>` element**. In many traditional apps, layers are implemented as a stack of separate canvas elements. Yappy uses a **Single-Canvas Logical Isolation** model.

### How it Works:
1.  **State Separation**: Elements are never "merged" into the canvas pixels permanently. They remain distinct objects in the `store.elements` array. Because each object has a `layerId`, they are logically grouped regardless of when they were drawn.
2.  **Sequential Redraws**: Every time a change occurs, the **entire canvas is cleared** and redrawn from scratch. By iterating through the sorted layer list, we recreate the "depth" of the scene.
3.  **Input Filtering (The "Active" Shield)**: Isolation is primarily enforced during the input phase. The `activeLayerId` acts as a write-filter: 
    - The drawing tool *only* creates elements for the active layer.
    - The hit-test logic *ignores* elements on locked or hidden layers.
4.  **Render-Time Context Modification**: Instead of physically separate canvases, we modify the single `CanvasRenderingContext2D` state (like `globalAlpha` or `fillStyle`) for each layer "chunk" during the render loop. This provides the visual benefit of layers (transparency, background fills) without the memory overhead of multiple HD canvas buffers.

### Benefits of this Approach:
- **Memory Efficiency**: Transparent layers in a multi-canvas setup consume massive amounts of GPU memory on large displays. Single-canvas rendering scales much better for infinite diagrams.
- **Atomic History**: Because all layers exist in a single unified state store, undo/redo operations can span multiple layers effortlessly (e.g., deleting elements from two different layers in one action).
- **Infinite Scalability**: Adding a new layer doesn't create a new DOM element or buffer; it simply adds one iteration to a highly optimized loop.
