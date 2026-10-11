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

### Arrowhead size

An arrowhead is sized from the line it sits on: **6px plus 5× the stroke width, kept between 10px and 28px**. A 1.5px line in an architecture diagram gets a 14px head, the default 2px line a 16px head, and a 4.4px or heavier line the full 28px. Several connectors meeting one side of a box therefore no longer run their heads into each other.

To fix a size yourself, set **Start Size** / **End Size** in the Properties panel (or `startArrowheadSize` / `endArrowheadSize` from a script, 1–100px). A size you set wins over the rule, and stays when you change the stroke width.

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

### Elbow routing

An elbow (orthogonal) connector finds its own way between two shapes. Whether you drew it with the Elbow tool, dragged it from a connection handle, or created it with `Yappy.connect(a, b, { curveType: 'elbow' })` or the `=>` edge in the text DSL, the same rules apply:

- **It leaves and arrives square to the side it is attached to.** A connector on the bottom of a box goes *down* first, one on the right goes *right* first, and it enters the target the same way. It never slides along a shape's own border, and when a port moves to another side — because you dragged the other shape round to that side, or several connectors share the side — the exit direction moves with it.
- **It goes round other shapes, with room to spare.** Boxes between the two ends are detoured, and the route keeps at least 10px clear of every shape it is not attached to, so it never runs along a border. Containers don't count: a frame, pool, cluster or any box that *encloses* one of the two shapes (a VPC around your services, a swimlane) is treated as the space the route lives in, not as something to route around, so connectors inside a container still steer round their neighbours.
- **It stays off other connectors.** Elbows take separate lanes rather than running along each other, including several connectors fanning out of or into the same shape. Lines still cross where a diagram needs them to.
- **It re-routes when a shape lands on it.** Move or resize a shape onto an elbow's path — by dragging, with the arrow keys, from a script, or by undo — and that elbow re-routes, even though the shape isn't connected to it. Connectors that then find themselves sharing a lane with the re-routed one move too.
- **Dense diagrams route too.** A long hop across a grid of 40–50 services finds a clear path rather than giving up and cutting straight through; a full re-route of ~100 elbows takes well under 100ms.

### Adjusting an elbow by hand

Select an elbow and drag any of its segments sideways, or drag a bend point, to put a run exactly where you want it. The elbow stays orthogonal: dragging a bend slides the two segments it joins, and dragging the first or last segment leaves a short stub at the shape so the connector still leaves it square.

Once you have done that, the elbow is **yours**: when either shape moves, the ends follow the shapes but your bends stay where you put them, instead of being re-routed. To hand it back to automatic routing, right-click it and choose **Re-route automatically**; changing its curve style, or re-attaching an end to a different shape, does the same. Scripts read and set this as the `manualRoute` property.

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
