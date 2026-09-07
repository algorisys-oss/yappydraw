# Draw-In / Draw-Out Animation Algorithm

The `drawIn` and `drawOut` animations provide a natural, hand-drawn look for elements as they enter or exit the canvas. Instead of simple fades or scales, these effects simulate the progressive drawing of the element's stroke, followed by fill and text reveal.

## Algorithm Overview

The animation is controlled by the `drawProgress` property (0 to 100). The rendering logic in `ShapeRenderer.renderDrawProgress` divides this progress into three overlapping phases to create an organic reveal:

### 1. Phased Rendering

| Phase | Progress Range | Effect | Technical Implementation |
| :--- | :--- | :--- | :--- |
| **Stroke** | 0% – 70% | Traces the outline | `ctx.setLineDash([drawLen, pathLength])` |
| **Fill** | 65% – 90% | Fades in the background | `ctx.globalAlpha` applied to fill color/gradient |
| **Text** | 85% – 100% | Reveals element text | `ctx.globalAlpha` applied to text rendering |

### 2. Path Length Estimation

To simulate progressive drawing using `setLineDash`, the system accurately estimates the total perimeter or path length of each shape.

#### Circle / Ellipse
Uses **Ramanujan's approximation** for ellipse perimeter:
$$P \approx \pi(a+b)\left(1 + \frac{3h}{10 + \sqrt{4-3h}}\right)$$
where $h = \frac{(a-b)^2}{(a+b)^2}$ and $a, b$ are semi-axes.

#### Connectors (Bezier Curves)
Estimates the length as the average of the **chord length** (direct distance) and the **control polygon length** (length of lines between control points). This provides a fast, sufficiently accurate estimation for most curves.

#### Freehand / Ink
Calculates the sum of Euclidean distances between all consecutive points in the path.

#### Polygons & Basic Shapes
Calculates the sum of distances between all vertices (including closing the path back to the first vertex).

## Integration

### Element Animator
The `drawIn` preset sets `drawProgress` to 0 and `opacity` to 0 (to hide the normal render), then animates `drawProgress` to 100. On completion, it restores the original opacity and clears `drawProgress`.

### Shape Renderer
The `render` loop checks for an active `drawProgress`. If present, it bypasses the normal rendering pipeline and calls `renderDrawProgress`, which handles the phased drawing described above.

```typescript
// Example: Manual use of drawIn animation
Yappy.animateElement(id, { drawProgress: 100 }, { 
  duration: 1500, 
  easing: 'easeInOutQuad' 
});
```
