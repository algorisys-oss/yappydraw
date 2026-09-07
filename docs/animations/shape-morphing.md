# Shape Morphing Animation

## Overview

Shape morphing is an animation technique that smoothly transforms one shape into another by interpolating between their point representations. This document describes the technical implementation of shape morphing in Yappy.

## Architecture

### Core Components

1. **Morph Utilities** (`src/utils/math/morph-utils.ts`)
   - Point normalization and resampling
   - Point correspondence algorithms
   - Linear interpolation between point arrays

2. **Element Animator** (`src/utils/animation/element-animator.ts`)
   - Morph animation orchestration
   - Frame-by-frame point interpolation
   - Store updates for reactive rendering

3. **Shape Renderer** (`src/shapes/base/shape-renderer.ts`)
   - Custom points rendering path
   - Coordinate transformation (local → absolute)
   - Bypasses normal shape geometry during morph

4. **Shape Geometry** (`src/utils/shape-geometry.ts`)
   - Generates point arrays for all shape types
   - Provides consistent point representation

## Algorithm

### 1. Point Generation

Each shape type generates a point array representing its outline:

```typescript
getShapeGeometry(element, numPoints) → Point[]
```

- **Rectangle**: 4 corners + interpolated points along edges
- **Ellipse**: Points sampled around circumference
- **Star**: Alternating outer and inner radius points
- **Custom**: Direct point array

Points are in **local coordinates** (relative to element center).

### 2. Point Correspondence

To morph between shapes with different point counts, we use **resampling**:

```typescript
resamplePoints(points, targetCount) → Point[]
```

**Algorithm:**
1. Calculate total path length
2. Distribute `targetCount` points evenly along path
3. Interpolate positions using linear segments

This ensures smooth morphing regardless of original point counts.

### 3. Interpolation

For each animation frame:

```typescript
interpolatedPoints[i] = lerp(startPoints[i], endPoints[i], progress)
```

Where:
- `progress`: 0.0 (start) → 1.0 (end)
- `lerp(a, b, t) = a + (b - a) * t`

### 4. Rendering

Custom points rendering path:

1. **Check for custom points**: If `element.points` exists, use custom renderer
2. **Transform coordinates**: Convert from local (relative to center) to absolute canvas coordinates
3. **Render path**: Draw fill and stroke using interpolated points

```typescript
// Coordinate transformation
const cx = el.x + el.width / 2;
const cy = el.y + el.height / 2;
absolutePoint = { x: localPoint.x + cx, y: localPoint.y + cy };
```

## Key Design Decisions

### 1. Point Count Normalization

**Problem**: Different shapes have different natural point counts (rectangle: 4, star: 10, etc.)

**Solution**: Resample both shapes to a common point count (default: 120 points)

**Rationale**: 
- Ensures smooth interpolation
- Higher point count = smoother curves
- 120 provides good balance between smoothness and performance

### 2. Coordinate Systems

**Problem**: Shape geometry uses local coordinates, but rendering needs absolute coordinates

**Solution**: Two-stage transformation:
1. Generate points in local space (relative to element center)
2. Transform to absolute space during rendering

**Rationale**:
- Separates geometry logic from rendering
- Allows reuse of shape geometry functions
- Simplifies rotation and scaling

### 3. Reactive Rendering

**Problem**: Need to update canvas on every animation frame

**Solution**: Store custom points in SolidJS store, trigger reactivity

```typescript
produce((draft) => {
  draft.elements[index].points = interpolatedPoints;
});
```

**Rationale**:
- Leverages existing reactive rendering pipeline
- No special animation loop needed
- Automatic cleanup when animation completes

### 4. Renderer Integration

**Problem**: Shape renderers don't know about custom points

**Solution**: Add custom points check in base `ShapeRenderer.render()`

```typescript
if (element.points && element.points.length > 0) {
  this.renderCustomPoints(context);
  return; // Skip normal rendering
}
```

**Rationale**:
- Minimal changes to existing renderers
- Centralized in base class
- Easy to extend to all shape types

## Performance Considerations

### Point Count

- **Default: 120 points** - Good balance for most shapes
- **Lower (60-80)**: Faster, but may show angular artifacts
- **Higher (200+)**: Smoother, but slower interpolation

### Resampling Cost

Resampling is O(n*m) where:
- n = original point count
- m = target point count

**Optimization**: Cache resampled points when possible

### Rendering Cost

Each frame renders:
- 1 fill operation (if background color set)
- 1 stroke operation
- Both use `lineTo()` for each point

**Cost**: O(n) per frame where n = point count

## Common Pitfalls

### 1. Coordinate Confusion

❌ **Wrong**: Rendering local coordinates directly
```typescript
ctx.lineTo(point.x, point.y); // Points are relative to center!
```

✅ **Correct**: Transform to absolute coordinates
```typescript
ctx.lineTo(point.x + cx, point.y + cy);
```

### 2. Point Count Mismatch

❌ **Wrong**: Interpolating arrays of different lengths
```typescript
// startPoints.length = 4, endPoints.length = 10
interpolate(startPoints[i], endPoints[i]); // Undefined for i > 3!
```

✅ **Correct**: Resample to same count first
```typescript
const start = resamplePoints(startPoints, 120);
const end = resamplePoints(endPoints, 120);
```

### 3. Reactivity Issues

❌ **Wrong**: Mutating points array directly
```typescript
element.points[i] = newPoint; // Won't trigger re-render
```

✅ **Correct**: Create new array reference
```typescript
element.points = [...newPoints]; // Triggers reactivity
```

## Usage Example

```typescript
// Start morph animation
animateMorph({
  elementId: 'rect-1',
  targetShape: 'star',
  duration: 2500,
  easing: 'easeInOutCubic'
});
```

**What happens:**
1. Get current shape points (rectangle, 4 corners)
2. Generate target shape points (star, 10 points)
3. Resample both to 120 points
4. Interpolate over 2500ms
5. Update `element.points` each frame
6. Renderer draws custom points
7. Clean up: remove `element.points` when done

## Future Enhancements

1. **Path-based morphing**: Use SVG path commands for more control
2. **Smart correspondence**: Match similar features (corners to corners)
3. **Rotation handling**: Minimize rotation during morph
4. **Caching**: Pre-compute resampled points
5. **GPU acceleration**: Use WebGL for large point counts

## References

- [Shape-tweening algorithms](https://en.wikipedia.org/wiki/Shape_tweening)
- [Point correspondence in morphing](https://www.cs.princeton.edu/courses/archive/fall00/cs426/papers/beier92.pdf)
- [Canvas path rendering](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
