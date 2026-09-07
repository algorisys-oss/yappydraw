# Lasso Selection Tool — Technical Documentation

## Overview

The lasso selection tool allows freeform polygon-based element selection, complementing the existing rectangular marquee. It is a **separate tool** (not a sub-mode of selection) that shares the entire selection handler infrastructure — clicking elements, dragging, resizing, and handle manipulation all work identically. Only the `isSelecting` code paths diverge: freeform polygon instead of axis-aligned rectangle.

Lasso is a **non-drawable tool** — it creates no elements. To avoid polluting `ElementType`, it lives in the `ToolType` alias:

```ts
// src/types.ts:12
export type ToolType = ElementType | 'lasso';
```

---

## Architecture & Data Flow

```
User Pointer Events
    |
Canvas Event Handlers (canvas.tsx)
    |
selectionOnDown / selectionOnMove / selectionOnUp  (selection-handler.ts)
    |--- Accumulate lassoPoints in PointerState (mutable)
    |--- Update setLassoPoints signal (reactive, triggers redraw)
    '--- On mouseup: isPointInPolygon test per element center
    |
Render Pipeline (canvas-renderer.ts)
    |--- renderSelectionOverlays()
    '--- renderLassoPath()  (selection-renderer.ts)
```

### Key Interfaces

| Interface | Location | Lasso Fields |
|-----------|----------|--------------|
| `PointerState` | `src/utils/pointer-state.ts:32` | `lassoPoints: { x: number; y: number }[]` |
| `PointerSignals` | `src/utils/pointer-helpers.ts:38-39` | `lassoPoints()` / `setLassoPoints()` |
| `SelectionOverlayParams` | `src/utils/canvas-renderer.ts:56` | `lassoPoints: { x: number; y: number }[] \| null` |

---

## Core Algorithms

### 1. Point Accumulation (Distance-Threshold Sampling)

During `selectionOnMove`, new points are appended only when the cursor moves more than a minimum distance from the last recorded point:

```ts
// src/utils/tool-handlers/selection-handler.ts (onMove, lasso branch)
const pts = pState.lassoPoints;
const last = pts[pts.length - 1];
if (Math.hypot(x - last.x, y - last.y) > 3 / store.viewState.scale) {
    pts.push({ x, y });
    signals.setLassoPoints([...pts]);
}
```

**Threshold:** `3 / scale` world-space units. At 100% zoom this is 3 CSS pixels; at 200% it is 1.5 CSS pixels — keeping visual density consistent regardless of zoom level. This prevents excessive point counts during fast movement while preserving fidelity during slow, detailed tracing.

### 2. Ray-Casting Point-in-Polygon (Odd-Even Rule)

Element selection is determined by testing each element's bounding-box center against the lasso polygon using the classic ray-casting algorithm:

```ts
// src/utils/geometry.ts:3-14
export const isPointInPolygon = (p: Point, polygon: Point[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        if (((yi > p.y) !== (yj > p.y)) &&
            (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
};
```

**How it works:**

1. Cast a horizontal ray from the test point toward positive infinity.
2. For each edge of the polygon, check if the ray crosses it.
3. Each crossing toggles the `inside` boolean.
4. After processing all edges, `inside === true` means the point is enclosed.

**Complexity:** O(n) per point, where n = number of polygon vertices.
**Total selection pass:** O(n * m) where m = number of canvas elements.

### 3. Selection Containment Criterion

An element is selected if its **bounding-box center** lies inside the lasso polygon:

```ts
const cx = el.x + el.width / 2;
const cy = el.y + el.height / 2;
if (isPointInPolygon({ x: cx, y: cy }, pts)) {
    selectedIds.push(el.id);
}
```

This is a deliberate simplification over full polygon-polygon intersection. Center-point testing is fast, predictable, and matches user intuition for most element sizes. Very large elements touching but not centered inside the lasso will not be selected — consistent with many professional drawing applications.

---

## Selection Handler Integration

The lasso reuses the existing `selectionOnDown` / `selectionOnMove` / `selectionOnUp` functions. Three branching points gate on `store.selectedTool === 'lasso'`:

### selectionOnDown

```ts
// ~line 299
if (store.selectedTool === 'lasso') {
    pState.lassoPoints = [{ x, y }];
    signals.setLassoPoints([{ x, y }]);
} else {
    signals.setSelectionBox({ x, y, w: 0, h: 0 });
}
```

Initializes a new lasso path with the click position. The `pState` mutation is for the mutable handler state; the signal update triggers reactive rendering.

### selectionOnMove

```ts
// ~line 359
if (store.selectedTool === 'lasso') {
    // distance-threshold sampling (see algorithm above)
} else {
    // existing rectangular selection box update
}
```

### selectionOnUp

```ts
// ~line 896
if (store.selectedTool === 'lasso') {
    const pts = pState.lassoPoints;
    if (pts.length >= 3) {
        // point-in-polygon test per element
        // Shift/Ctrl/Meta: additive selection
        // Otherwise: replace selection
    }
    pState.lassoPoints = [];
    signals.setLassoPoints(null);
} else {
    // existing AABB intersection selection
}
```

Minimum 3 points required for a valid polygon. After selection, lasso state is always cleared.

**Modifier keys:**

| Modifier | Behavior |
|----------|----------|
| None | Replace current selection |
| Shift | Add to current selection |
| Ctrl / Cmd | Add to current selection |

---

## Rendering

### renderLassoPath

```ts
// src/utils/selection-renderer.ts:496-517
export function renderLassoPath(
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number }[],
    scale: number
): void {
    if (points.length < 2) return;
    ctx.save();
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5 / scale;
    ctx.setLineDash([4 / scale, 4 / scale]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}
```

| Property | Value | Rationale |
|----------|-------|-----------|
| Fill | `rgba(59, 130, 246, 0.1)` | Tailwind blue-500 at 10% — subtle interior shading |
| Stroke | `#3b82f6` | Matches `renderSelectionBox` color scheme |
| Line width | `1.5 / scale` | Constant visual thickness regardless of zoom |
| Dash pattern | `[4/scale, 4/scale]` | Distinguishes lasso from selection box (which is solid) |
| Close path | `ctx.closePath()` | Connects last point to first, completing the polygon |

### Overlay Pipeline Integration

```ts
// src/utils/canvas-renderer.ts (renderSelectionOverlays)
if (params.lassoPoints && params.lassoPoints.length >= 2) {
    renderLassoPath(ctx, params.lassoPoints, scale);
}
```

Rendered after the selection box and before snapping guides — sits in the same overlay coordinate space.

---

## Signal & Reactive System

The lasso uses SolidJS signals for reactive canvas redraws:

```ts
// src/components/canvas.tsx:133
const [lassoPoints, setLassoPoints] = createSignal<{ x: number; y: number }[] | null>(null);
```

Tracked in the main render effect alongside `selectionBox()`:

```ts
// canvas.tsx:315
lassoPoints();  // Dependency tracking — triggers redraw on change
```

Passed to the overlay renderer:

```ts
// canvas.tsx:239
lassoPoints: lassoPoints(),
```

---

## UI Integration

### Toolbar

```ts
// src/components/toolbar.tsx:26
{ type: 'lasso', icon: Lasso, label: 'Lasso Select (Shift+L)' }
```

Positioned between Selection and Rectangle in the toolbar. Uses the `Lasso` icon from `lucide-solid`.

### Status Bar

```ts
// src/components/status-bar.tsx:9
lasso: 'Lasso',
```

Displays "Lasso" in the bottom status bar when the tool is active.

### Keyboard Shortcut

```ts
// src/app.tsx:345-347
} else if (e.shiftKey && key === 'l') {
    e.preventDefault();
    setSelectedTool('lasso');
}
```

**Shortcut:** `Shift+L`

### Command Palette

```ts
// src/utils/command-registry.ts:31
{ id: 'tool-lasso', label: 'Lasso Selection Tool', category: 'Tools',
  action: () => setSelectedTool('lasso'), shortcut: 'Shift+L' }
```

### Quick Toolbar

```ts
// src/config/quick-toolbar-config.ts:34
const TOOL_TYPES: (ElementType | 'lasso')[] = ['eraser', 'pan', 'selection', 'laser', 'ink', 'lasso'];
```

Registered as a tool type — `getElementFamily` returns `null` (no quick properties shown).

---

## Store Behavior

Lasso is treated like the selection tool for state management:

- **Selection preservation:** Switching to lasso does not clear the current selection (same as selection tool).
- **Style save/restore:** Lasso is excluded from the tool-style save/restore mechanism since it has no drawing properties.

```ts
// src/store/app-store.ts (setSelectedTool)
if (currentTool !== 'selection' && currentTool !== 'lasso') {
    // save styles for previous tool
}
if (tool !== 'selection' && tool !== 'lasso' && tool !== 'pan' && tool !== 'eraser') {
    setStore('selection', []);
}
```

---

## File Reference

| File | Lines | Purpose |
|------|-------|---------|
| `src/types.ts` | 12 | `ToolType` definition |
| `src/utils/pointer-state.ts` | 32, 60 | `lassoPoints` field + initialization |
| `src/utils/pointer-helpers.ts` | 38-39 | Signal interface |
| `src/utils/geometry.ts` | 3-14 | `isPointInPolygon` ray-casting |
| `src/utils/tool-handlers/selection-handler.ts` | 299-301, 359-365, 896-915 | Core lasso logic |
| `src/utils/selection-renderer.ts` | 496-517 | `renderLassoPath()` |
| `src/utils/canvas-renderer.ts` | 56, 668-670 | Overlay params + render call |
| `src/components/canvas.tsx` | 133, 239, 315, 442, 461, 495, 550 | Signal + routing |
| `src/store/app-store.ts` | 3, ~551-566 | `ToolType` usage + behavior exceptions |
| `src/components/toolbar.tsx` | 26 | Toolbar button |
| `src/components/status-bar.tsx` | 9 | Label |
| `src/config/quick-toolbar-config.ts` | 34 | Tool registration |
| `src/app.tsx` | 345-347 | Keyboard shortcut |
| `src/utils/command-registry.ts` | 31 | Command palette |
