# Gradient & Visual Effects System

This document details the robust visual effects system implemented in Yappy, covering Advanced Gradients, Drop Shadows, and Global Textures.

## 1. Advanced Gradients

The gradient system supports Linear, Radial, and Conic gradients with a comprehensive editor and multi-stop support.

### Data Model
The `DrawingElement` type has been expanded with the following properties:

```typescript
interface DrawingElement {
    // ...
    fillStyle: 'solid' | 'linear' | 'radial' | 'conic' | ...;
    
    // Gradient Core
    gradientType: 'linear' | 'radial' | 'conic';
    
    // Legacy support (2-stop)
    gradientStart?: string;
    gradientEnd?: string;
    gradientDirection?: number; // approx angle in degrees
    
    // Advanced support (Multi-stop)
    gradientStops?: Array<{
        offset: number; // 0.0 to 1.0
        color: string;
    }>;
    
    // Interactive Handles (Future)
    gradientHandlePositions?: {
        start: { x: number, y: number };
        end: { x: number, y: number };
    };
}
```

### Rendering Logic (`renderElement.ts`)
Gradients are rendered using HTML5 Canvas `createLinearGradient`, `createRadialGradient`, or `createConicGradient`.

1.  **Coordinate System**: A local transformation matrix translates the context to the element's center (`cx`, `cy`).
    *   **Linear**: Calculated based on `gradientDirection` (angle). The start/end points are projected onto the bounding box circle to ensure full coverage at any angle.
    *   **Radial**: From center `(0,0)` to radius `Math.max(w, h)/2`.
    *   **Conic**: Centered at `(0,0)` with start angle based on `gradientDirection`.

2.  **Stop Sorting**: `gradientStops` are automatically sorted by offset (0 to 1) before rendering to ensure correct color transitions regardless of insertion order.

3.  **Fallback**: If `gradientStops` is missing/empty, the system falls back to `gradientStart` and `gradientEnd` (Legacy mode).

### UI Component (`GradientEditor`)
A custom visual editor replaces standard color inputs:
*   **Visual Bar**: Displays the live gradient preview.
*   **Interactive Stops**: Click bar to add stop, drag thumbs to move.
*   **Contextual Controls**: Select a stop to edit color or delete.
*   **Undo/Redo**: Drag operations push to history on `mouseup`.

## 2. Drop Shadows

Shadows provide depth and are supported in both "Sketch" (RoughJS) and "Architectural" (Clean) render styles.

### Data Model
```typescript
interface DrawingElement {
    shadowEnabled: boolean;
    shadowColor: string;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
}
```

### Rendering
*   **Architectural**: Uses standard Canvas shadow properties (`shadowColor`, `shadowBlur`, `shadowOffsetX/Y`).
*   **Sketch**: RoughJS doesn't inherently support native canvas shadows on paths efficiently. We currently use the native canvas shadow context for the shape primitive.

## 3. Fill Density & Textures

RoughJS fills (Hachure, Zigzag, Dot, etc.) are procedural.

*   `fillDensity`: Controls the spacing/weight of the fill.
    *   For `hachure`/`zigzag`: Maps to `hachureGap`.
    *   For `dots`: Controls dot spacing/size.
*   **Global Texture**: A global CSS overlay (in `index.css`) provides a noise/paper texture effect on the canvas container, adding organic grit to the entire drawing.

## 4. Persistence & Migration

### Migration (`migration.ts`)
The `normalizeElement` function acts as a whitelist for loading files.
**Crucial Update**: New properties (`gradientStops`, `blendMode`, `shadow*`, `fillDensity`) MUST be included in this whitelist. If missing, they are stripped on load.

### History
All property changes (including dragging a gradient stop) hook into `updateElement` using `pushToHistory` to ensure robust Undo/Redo support.
