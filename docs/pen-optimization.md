# Pen Tools: Types, Algorithms & Implementation

This document explains all pen/drawing tools in YappyDraw, their unique characteristics, rendering algorithms, and recent optimizations.

---

## 1. Overview: 4 Pen Types

| Tool | Type | Width | Rendering | Best For |
|------|------|-------|-----------|----------|
| **Fine Liner** | `fineliner` | Fixed | Quadratic Bezier curves | Clean, uniform lines |
| **Ink Brush** | `inkbrush` | Variable (velocity) | Filled polygon with smoothed edges | Artistic, calligraphy-style strokes |
| **Marker** | `marker` | Fixed (4x wider) | Fineliner + multiply blend | Highlighting, annotations |
| **Ink** | `ink` | Fixed | Fineliner (auto-fades after 3s) | Presentation-mode temporary drawings |

---

## 2. Toolbar: Grouped Pen Tools

The first three tools (fineliner, inkbrush, marker) are consolidated into a **single toolbar icon** with a dropdown:

- **Click** -> Selects the current pen type (default: Fine Liner)
- **Dropdown** -> Opens submenu to switch between pen types
- **Right-click** -> Opens property panel

The icon changes to reflect the currently selected pen type.

**Implementation**: `src/components/pen-tool-group.tsx`

---

## 3. Fine Liner

Ultra-smooth lines with consistent width.

### Algorithm: Quadratic Bezier with Midpoints

Each consecutive pair of points generates a quadratic Bezier curve where the control point is the current point and the endpoint is the midpoint to the next point. This creates C1-continuous curves.

```
for each point i from 1 to N-2:
    midpoint = average(point[i], point[i+1])
    quadraticCurveTo(point[i], midpoint)
```

### Properties
- `strokeWidth`: Line thickness (uniform)
- `smoothing`: Moving-average window (0-20) applied before rendering
- Round caps and joins for professional look

---

## 4. Ink Brush

Variable-width strokes that respond to drawing speed: slow = thick, fast = thin.

### Rendering Pipeline

The inkbrush builds a filled polygon with left/right edges offset from the centerline at variable widths. The pipeline has 8 stages:

#### Stage 1: Point Filtering
Removes jitter by discarding points closer than 2px apart. Keeps the last point regardless.

```
MIN_DIST = 2px
for each raw point:
    if distance_to_previous >= MIN_DIST or is_last_point:
        keep it
```

#### Stage 2: Velocity Calculation
Computes distance between consecutive filtered points as a proxy for drawing speed.

#### Stage 3: Bidirectional EMA Velocity Smoothing
Replaces the old 3-point moving average with a forward + backward exponential moving average (alpha=0.3). This eliminates the width "wobble" caused by noisy per-frame velocity readings.

```
Forward:  smoothed[i] = 0.3 * raw[i] + 0.7 * smoothed[i-1]
Backward: smoothed[i] = 0.3 * smoothed[i] + 0.7 * smoothed[i+1]
```

The bidirectional pass ensures width transitions are symmetric — a speed change at point N affects nearby points equally in both directions.

#### Stage 4: Width Calculation
Maps smoothed velocity to width. Slower drawing produces thicker strokes:

```
velocityFactor = smoothedVelocity / maxVelocity    (0 = slow, 1 = fast)
width = maxWidth - (maxWidth - minWidth) * velocityFactor
```

Width range is controlled by `velocitySensitivity` (0-1):
- `minWidth = baseWidth * (1 - sensitivity * 0.7)`
- `maxWidth = baseWidth * (1 + sensitivity * 0.5)`

Taper is applied at stroke start/end: width scales from 10% to 100% over `taperLength` points.

#### Stage 5: Bidirectional EMA Width Smoothing
Applies another forward+backward EMA pass (alpha=0.4) on the calculated widths. This prevents abrupt thick-to-thin transitions even after velocity smoothing.

#### Stage 6: Edge Construction with Perpendicular Smoothing
For each point, computes the perpendicular direction to the stroke path, then offsets left/right by half the width to build polygon edges.

**Corner artifact prevention**: At sharp corners, the perpendicular can flip 180 degrees causing spike artifacts. Two mitigations:
1. **Flip detection**: If `dot(currentPerp, prevPerp) < 0`, negate the perpendicular
2. **Direction blending**: Each perpendicular is blended 60/40 with the previous, then re-normalized

#### Stage 7: Two-Pass Edge Smoothing
Applies a 1:2:1 weighted average kernel twice on both polygon edges. This is equivalent to a binomial (Gaussian approximation) filter that removes high-frequency jaggedness from the polygon outline.

```
smoothed[i] = 0.25 * edge[i-1] + 0.50 * edge[i] + 0.25 * edge[i+1]
(applied twice)
```

#### Stage 8: Final Rendering
Draws the polygon as a closed filled path:
1. Left edge forward (quadratic Bezier through midpoints)
2. End cap (arc)
3. Right edge backward (quadratic Bezier through midpoints)
4. Start cap (arc)

### Properties
- `strokeWidth`: Base width (actual varies with velocity)
- `smoothing`: Point smoothing before rendering (0-20)
- `taperAmount`: Start/end taper strength (0-1, default 0.15)
- `velocitySensitivity`: How much speed affects width (0-1, default 0.5)

---

## 5. Marker

Semi-transparent highlighting tool. Reuses the fineliner algorithm with:
- 4x stroke width multiplier
- 50% opacity
- `multiply` composite operation (darkens underlying content naturally)

---

## 6. Ink (Presentation Mode)

Temporary drawing that auto-fades after 3 seconds. Uses fineliner rendering. Created via the presentation toolbar during slide playback.

---

## 7. Point Capture

### Data Format
Points are stored as a flat `number[]` array: `[x, y, x, y, ...]` where coordinates are relative to the element's origin `(el.x, el.y)`.

### Coalesced Pointer Events
The pen handler uses `PointerEvent.getCoalescedEvents()` to capture all intermediate pointer positions that the browser coalesced between frames. This provides significantly higher point density during fast strokes, resulting in smoother curves.

```typescript
const coalescedEvents = e.getCoalescedEvents?.() ?? [];
const events = coalescedEvents.length > 0 ? coalescedEvents : [e];

for (const ce of events) {
    // buffer each point
}
```

Without coalesced events, fast strokes at 60fps capture ~60 points/sec. With coalesced events, this can increase to 200+ points/sec depending on the input device, filling in gaps that would otherwise produce angular strokes.

### Throttled Store Updates
Points are buffered locally in `pState.penPointsBuffer` and flushed to the store at 16ms intervals (~60fps) to avoid excessive reactive updates. A `requestAnimationFrame` fallback ensures no points are lost between throttle windows.

---

## 8. Point Smoothing

Applied before rendering for all pen types (when `smoothing > 0`):

```
windowSize = floor(smoothing / 2) or 1
for each point (excluding first and last):
    average all points within [i - windowSize, i + windowSize]
```

This is a simple moving-average filter. Higher smoothing values create smoother but less precise strokes. The default value is 3.

---

## 9. Implementation Files

| File | Purpose |
|------|---------|
| `src/components/pen-tool-group.tsx` | Grouped toolbar dropdown component |
| `src/shapes/renderers/freehand-renderer.ts` | All rendering algorithms (fineliner, inkbrush, marker) |
| `src/utils/tool-handlers/pen-handler.ts` | Point capture, coalesced events, buffering |
| `src/utils/pointer-state.ts` | `penPointsBuffer`, throttle state |
| `src/config/properties.ts` | Smoothing, tapering, velocity sensitivity config |
| `src/store/app-store.ts` | `selectedPenType` state |
| `src/types.ts` | ElementType includes all pen types |

---

## 10. Optimization History

| Change | Impact |
|--------|--------|
| Coalesced pointer events | 3-4x more points during fast strokes |
| Min-distance point filtering (2px) | Removes jitter from slow drawing |
| Bidirectional EMA velocity smoothing | Eliminates width wobble in inkbrush |
| Bidirectional EMA width smoothing | Gradual thick-to-thin transitions |
| Perpendicular flip prevention + blending | Removes spike artifacts at sharp corners |
| Two-pass edge smoothing (1:2:1 kernel) | Cleaner polygon outlines |
| Throttled store updates (16ms) | Smooth drawing without reactive overhead |
| Viewport culling bypass for active stroke | Ensures visibility during drawing |

---

## 11. Future Improvements

- [ ] Pen pressure support (`PointerEvent.pressure`) for tablet/stylus width variation
- [ ] Adaptive point sampling based on curvature (fewer points on straight sections)
- [ ] Pressure curve customization (soft/hard/linear response curves)
