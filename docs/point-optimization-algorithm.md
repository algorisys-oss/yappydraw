# Point Optimization Algorithm

## Overview
This document details the algorithm and data structures used to optimize line and stroke storage in Yappy. The goal is to reduce file size and network payload for freehand drawings (Fineliner, InkBrush, Marker) by moving from an array of objects to a flat number array.

## Data Formats

### 1. Legacy Format (Version 1)
Points were stored as an array of objects. This is verbose due to repeated key names in JSON.

```typescript
// Overhead: "x": and "y": keys repeated for every single point
points: [
    { x: 100, y: 100 },
    { x: 105, y: 102 },
    { x: 110, y: 105 }
]
```

### 2. Compact Format (Version 2)
Points are stored as a flat array of numbers. This eliminates key overhead.

```typescript
// Encoding: [x1, y1, x2, y2, x3, y3, ...]
points: [100, 100, 105, 102, 110, 105]
pointsEncoding: 'flat'
```

---

## The "Smart Loader" Algorithm (Read Path)
To maintain 100% backward compatibility, the renderer and export tools use a **Hybrid Normalization Strategy**. We do NOT eagerly convert data upon load; instead, we normalize it on-the-fly during render or export.

### `normalizePoints(points)`
This helper function is the core of the read strategy.

**Logic:**
1.  **Input Check**: Recieve `points` array (could be `Point[]` or `number[]`).
2.  **Type Detection**: Check the type of the *first element*.
    *   If `number`: It's the **New Compact Format**.
    *   If `object`: It's the **Legacy Format**.
3.  **Normalization**:
    *   **Legacy**: Return as-is (or clone).
    *   **Compact**: Iterate stride-2 (`i+=2`). Create `{ x, y }` objects for the consumer.

**Code:**
```typescript
const normalizePoints = (points: any[] | number[] | undefined): { x: number; y: number }[] => {
    if (!points || points.length === 0) return [];
    
    // Fast Path: Check first element type
    if (typeof points[0] === 'number') {
        const result: { x: number; y: number }[] = [];
        for (let i = 0; i < points.length; i += 2) {
            result.push({ x: points[i] as number, y: points[i + 1] as number });
        }
        return result;
    }
    
    // Legacy Path
    return points as { x: number; y: number }[];
};
```

---

## The "Auto-Upgrade" Algorithm (Write Path)
We enforce optimization when **Writing** (Saving) data. This progressively migrates old documents to the new format without explicit user action.

### 1. New Drawings
*   **Canvas.tsx**: When using Pen tools, we initialize `points: [x, y]` and `pointsEncoding: 'flat'`.
*   **PointerMove**: We push `x` and `y` directly to the array: `points.push(newX, newY)`.

### 2. Saving & Migration
*   **FileSystemStorage.ts**: In `saveDrawing`, we inspect every element before serialization.
*   **Detection**: If an element has `points` that are objects (`typeof points[0] !== 'number'`).
*   **Conversion**: We map the object array to a flat number array.
    ```typescript
    const flatPoints = [];
    legacyPoints.forEach(p => flatPoints.push(p.x, p.y));
    element.points = flatPoints;
    element.pointsEncoding = 'flat';
    ```
*   **Versioning**: We set the document `version` to `2`.

## Benefits
*   **Size**: ~50% reduction in JSON size for heavy drawings.
*   **Speed**: Faster JSON parsing/stringification.
*   **Safety**: Zero data loss; old files open perfectly, new files are efficient.
