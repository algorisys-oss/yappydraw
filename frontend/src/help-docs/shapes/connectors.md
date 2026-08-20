---
id: connectors
name: Connectors
icon: "↗️"
category: Drawing
description: Lines, arrows, bezier curves, and smart connectors
seoTitle: "Connectors and arrows — how to connect shapes in a diagram"
seoDescription: "Lines, arrows, bezier curves and smart connectors that stay attached when you move a shape. Arrow heads, routing and labels."
---

# Connectors

Connect shapes and create relationships with lines, arrows, and curves. Connectors automatically maintain their connections when shapes are moved.

## Connector Types

| Type | Shortcut | Description |
| --- | --- | --- |
| **Line** | <kbd>L</kbd> or <kbd>4</kbd> | Simple straight line between two points |
| **Arrow** | <kbd>A</kbd> or <kbd>5</kbd> | Line with arrowhead(s) showing direction |
| **Bezier Curve** | <kbd>B</kbd> or <kbd>0</kbd> | Smooth curve with control points |
| **Polyline** | Toolbar | Multi-segment line with corners |

## Smart Binding

Connectors can bind to shapes, automatically maintaining their connection when shapes are moved, resized, or rotated.

### How to Bind

1. Select a connector tool (Line or Arrow)
2. Hover over a shape until you see binding points
3. Click and drag from the binding point
4. Drag to another shape's binding point
5. Release to complete the connection

:::tip Binding Points
Shapes have multiple binding points: center, top, bottom, left, and right edges. The connector will snap to the nearest point when you hover.
:::

## Arrow Styles

Customize arrow appearance with different head and tail styles:

### Arrowhead Types

| Type | Description |
| --- | --- |
| **Arrow** | Standard triangular arrowhead |
| **Triangle** | Filled triangle head |
| **Circle** | Circular endpoint |
| **Diamond** | Diamond-shaped endpoint |
| **None** | No arrowhead (plain line end) |

### Bidirectional Arrows

Enable arrowheads on both ends for bidirectional relationships. Set both start and end styles to create two-way arrows.

## Bezier Curves

Create smooth, flowing curves with precise control over the path shape.

### Editing Bezier Curves

1. Draw the initial curve by clicking start and end points
2. Select the curve to reveal control handles
3. Drag control points to adjust the curve shape
4. Control handles affect the curve's direction and steepness

:::tip Tip: Symmetric Curves
Hold <kbd>Shift</kbd> while dragging a control point to constrain movement to horizontal or vertical.
:::

## Line Routing

Choose how connectors navigate between shapes:

| Routing | Description |
| --- | --- |
| **Straight** | Direct line between points |
| **Curved** | Smooth S-curve or C-curve |
| **Orthogonal** | Right-angle turns only (elbow connectors) |

### Automatic spacing & avoidance

Connectors space themselves out automatically — there is nothing to turn on:

- **Fan-in spreads into ports.** When several connectors meet the same side of a shape, they land on evenly spaced points along that edge instead of stacking on one spot, ordered so the lines don't cross.
- **Bundles separate.** Two connectors between the same pair of shapes — or one in each direction — get their own lanes, so both arrowheads stay visible.
- **Ports follow your shapes.** Move a shape to the other side and the endpoints hop to the edge facing it. On circles, diamonds and other non-rectangular shapes the points sit on the real outline.
- **Elbow connectors avoid each other.** An orthogonal connector steers onto a neighbouring lane rather than running along the top of another connector. Lines still cross where a diagram needs them to — only overlapping *along* each other is avoided.

:::note
Spacing is applied while drawing and while dragging; it never changes your saved anchor points, so nothing is baked into the file. A lone connector is unaffected and attaches at the usual anchor.
:::

## Styling Options

| Property | Description |
| --- | --- |
| **Stroke Color** | Line color |
| **Stroke Width** | Line thickness (1-10px typically) |
| **Stroke Style** | Solid, dashed, or dotted |
| **Roughness** | Hand-drawn appearance |
| **Opacity** | Transparency level |

## Common Use Cases

### Flowcharts

Use arrows to show process flow direction. Dashed lines indicate alternate paths.

### Architecture Diagrams

Use different arrowhead styles to indicate data flow direction. Bidirectional arrows for two-way communication.

### Mind Maps

Curved lines create organic, flowing connections between nodes. No arrowheads needed for hierarchical relationships.

### Sequence Diagrams

Solid arrows for synchronous calls, dashed arrows for responses. Use orthogonal routing for clean, professional diagrams.

## Keyboard Shortcuts

:::shortcuts
L or 4 | Line tool
A or 5 | Arrow tool
B or 0 | Bezier curve
Shift+Drag | Constrain to 45° angles
:::

## Scripting (API)

Connectors are created through the global `window.Yappy` (usable as ` Yappy`). Line-like helpers take the two endpoints ` (x1, y1, x2, y2)` rather than a bounding box:

```
// Straight line, arrow, and bezier curve
Yappy.createLine(80, 80, 320, 80, { strokeColor: '#1e1e1e', strokeWidth: 2 });
Yappy.createArrow(80, 140, 320, 140);
Yappy.createBezier(80, 220, 320, 220);

// Arrowheads: startArrowhead / endArrowhead
// 'arrow' | 'triangle' | 'dot' | 'circle' | 'bar' | 'diamond' | 'diamondFilled' | 'crowsfoot' | null
Yappy.createArrow(80, 300, 320, 300, {
  startArrowhead: 'dot',
  endArrowhead: 'triangle',
  strokeStyle: 'dashed',
});
```

| Method / type | Purpose |
| --- | --- |
| `createLine(x1, y1, x2, y2, opts?)` | Plain line (type `'line'`) |
| `createArrow(x1, y1, x2, y2, opts?)` | Arrow (type `'arrow'`, default end arrowhead) |
| `createBezier(x1, y1, x2, y2, opts?)` | Smooth curve (type `'bezier'`) |
| `createElement('polyline', …)` / `'elbow'` | Multi-segment / right-angle connectors |

:::tip
Set `startArrowhead` / `endArrowhead` to any of the arrowhead names above (or `null` for none) to build one-way or bidirectional arrows. Restyle later with `Yappy.updateElement(id, { ... })`.
:::

### Connecting two shapes, and the shape of the line

`Yappy.connect(sourceId, targetId, opts?)` binds a connector between two elements so it follows them when they move. It defaults to **`curveType: 'bezier'`** — a gentle S-curve that leaves and arrives square to the boxes. For UML and org-chart style diagrams, where a straight line is the conventional form, ask for one explicitly:

```
const a = Yappy.createRectangle(400, 100, 160, 60);
const b = Yappy.createRectangle(150, 400, 160, 60);

Yappy.connect(a, b);                                  // bezier (the default)
Yappy.connect(a, b, { curveType: 'straight' });        // straight line
Yappy.connect(a, b, { curveType: 'elbow' });           // right-angle jog

// UML relationships read from the arrowhead
Yappy.connect(a, b, { curveType: 'straight', endArrowhead: 'triangle' });      // generalization
Yappy.connect(a, b, { curveType: 'straight', startArrowhead: 'diamond' });     // aggregation
```

In the text DSL the same choice is `a -> b { curveType: straight }`; plain `->` and `--` use the bezier default, and ` ~>` asks for a curve explicitly.

:::tip
Arrowheads follow the **tangent of the line they sit on**, not the straight line between its endpoints — so on a curved connector the head stays square to the curve where it meets the shape, in every drawing style and in exported SVG.
:::
