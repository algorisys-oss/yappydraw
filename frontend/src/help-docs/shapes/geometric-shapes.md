---
id: geometric-shapes
name: Geometric Shapes
icon: "⬡"
category: Shapes
description: Hexagon, star, polygon, and other geometric shapes
seoTitle: "Hexagon, star, polygon — geometric shapes for diagrams"
seoDescription: "Regular polygons, stars with adjustable inner radius, hexagons for honeycomb layouts, tapered cylinders for columns and pots, and the parameters behind each one."
---

# Geometric Shapes

Extended geometric shapes for creating visually interesting diagrams, technical illustrations, and decorative elements.

## Available Shapes

| Shape | Description | Common Uses |
| --- | --- | --- |
| **Pentagon** | 5-sided polygon | Security badges, home icons |
| **Hexagon** | 6-sided polygon | Honeycomb patterns, tech diagrams, microservices |
| **Septagon** | 7-sided polygon (heptagon) | Decorative elements |
| **Octagon** | 8-sided polygon | Stop signs, attention indicators |
| **Star** | Configurable star shape | Ratings, highlights, favorites |
| **Polygon** | N-sided regular polygon | Custom geometric patterns |
| **Parallelogram** | Slanted rectangle | Data input/output in flowcharts |
| **Trapezoid** | 4-sided with parallel top/bottom | Manual operations, funnels |
| **Cross** | Plus or X shape | Add buttons, close icons, markers |
| **Heart** | Heart shape | Favorites, likes, love indicators |
| **Cloud** | Cloud shape | Cloud services, thoughts, storage |
| **Capsule** | Pill/rounded rectangle | Tags, buttons, node containers |

## Star Shape

Stars are highly configurable - adjust the number of points and inner radius to create different star styles.

### Properties

| Property | Range | Description |
| --- | --- | --- |
| **Points** | 3-12 | Number of star points |
| **Inner Radius** | 0.1-0.9 | Depth of points (lower = sharper) |

:::tip Star Variations
**5 points, 0.4 inner** - Classic star<br /> **6 points, 0.5 inner** - Star of David<br /> **4 points, 0.2 inner** - Sparkle/twinkle
:::

## Custom Polygon

Create regular polygons with any number of sides. Great for creating consistent geometric patterns.

### Properties

| Property | Description |
| --- | --- |
| **Sides** | Number of polygon sides (3-20) |
| **Rotation** | Rotate the polygon orientation |

## Hexagons

Hexagons are popular in modern design, especially for representing interconnected systems, microservices, and modular architectures.

### Use Cases

- **Architecture diagrams** - Microservices, modules
- **Honeycomb patterns** - Visual groupings
- **Tech iconography** - Modern tech stack representations
- **Game design** - Hex-based maps and grids

:::tip Tip: Hexagon Grids
Enable grid snapping to align hexagons perfectly when creating honeycomb patterns or hex-based layouts.
:::

## 3D Shapes

Yappy includes several pseudo-3D shapes for creating depth in diagrams:

| Shape | Description |
| --- | --- |
| **Isometric Cube** | 3D cube in isometric projection |
| **Solid Block** | 3D rectangular block with depth |
| **Perspective Block** | Box with perspective vanishing point |
| **Cylinder** | 3D cylinder — pillars, cans, tanks, databases |

### Cylinder

The cylinder is a tube drawn inside its bounding box: the **width is the diameter**
and the **height is the whole solid**, caps included. Drag the bottom handle down and
you get a taller pillar — the end circles keep their shape.

Two extra controls appear in the property panel under **Dimensions**:

| Control | What it does |
| --- | --- |
| **Cap Perspective** | How open **both** end circles are, from 2 (almost edge-on) to 100 (a full circle seen face-on). 25 is a natural three-quarter view. |
| **Axis Angle** | Which way the tube runs. **90°** (the default) is upright; **0°** lays the can on its side; anything between gives a tilted tube. |
| **Taper** | Narrows **one** end into a truncated cone, −0.95 to 0.95. Negative narrows the **near** cap (the top, on an upright cylinder) for a column; positive narrows the **far** cap (the bottom) for a pot or a tumbler. **0** is a plain tube. |

The green control handle sits at the centre of the far cap. Swing it around the shape
to set the axis angle, and pull it out or push it in to flatten or open the caps.

To tip a whole cylinder over at an arbitrary angle, rotate the element (drag the
rotation handle) rather than changing the axis angle — rotation turns the caps with it.

:::tip
For a pillar or a column, keep the width fixed and drag the height; for a coin or a
puck, use a wide box with a low **Cap Perspective**.
:::

:::tip
**A column, a plant pot or a drinking glass are all one slider away.** Set **Taper** to
about **−0.3** and the cylinder narrows toward the top — a stone column. Push it the other
way, to **+0.4**, and it narrows toward the base — a pot or a tumbler. The wide end keeps
the bounding box, so the shape still fills the width you drew, and the whole thing stays a
live cylinder: the taper, the axis angle and the cap perspective all remain editable, and
both draw styles (sketch and architectural) follow. You do **not** need to convert anything
to a path to get a tapered tube.
:::

:::note
Only the visible half of the far cap is drawn, so an unfilled cylinder reads as a solid
rather than as two crossed ellipses.
:::

## Styling Options

All geometric shapes support these styling options:

- **Fill Color** - Background fill color
- **Stroke Color** - Border/outline color
- **Fill Style** - Solid, hachure, cross-hatch, or none
- **Stroke Style** - Solid, dashed, or dotted
- **Stroke Width** - Border thickness
- **Roughness** - Hand-drawn appearance intensity
- **Opacity** - Transparency level

## Keyboard Shortcuts

:::shortcuts
Shift + Drag | Constrain proportions
S | Cycle stroke style
F | Cycle fill style
:::

## Scripting (API)

Geometric shapes are created through the global `window.Yappy` (usable as ` Yappy`). Most use the generic ` Yappy.createElement(type, x, y, w, h, opts)` with the shape's type string; stars have a dedicated helper.

```
// Polygons & badges (type string = the shape name)
Yappy.createElement('hexagon', 80, 80, 120, 120);
Yappy.createElement('pentagon', 220, 80, 120, 120);
Yappy.createElement('octagon', 360, 80, 120, 120, { backgroundColor: '#ffc9c9' });
Yappy.createElement('isometricCube', 240, 240, 120, 120);

// Cylinder: width = diameter, height = the whole solid
Yappy.createCylinder(80, 240, 120, 320);                       // upright pillar
Yappy.createCylinder(240, 240, 120, 320, { capRatio: 10 });    // near edge-on caps
Yappy.createCylinder(400, 240, 300, 110, { viewAngle: 0 });    // can on its side
Yappy.createCylinder(560, 240, 130, 340, { capRatio: 18, taper: -0.3 }); // column, slim at the top
Yappy.createCylinder(720, 240, 150, 220, { capRatio: 22, taper: 0.4 });  // pot, slim at the base

// Star: dedicated helper takes a point count
const star = Yappy.createStar(400, 240, 120, 120, 5, { starPoints: 5 });
```

| Shape | Type string |
| --- | --- |
| Pentagon / Hexagon / Septagon / Octagon | `'pentagon'`, `'hexagon'`, `'septagon'`, `'octagon'` |
| Star | `'star'` (or `createStar(...)`) |
| Polygon | `'polygon'` |
| Parallelogram / Trapezoid | `'parallelogram'`, `'trapezoid'` |
| Cross / Heart / Cloud / Capsule | `'cross'`, `'heart'`, `'cloud'`, `'capsule'` |
| 3D blocks | `'isometricCube'`, `'solidBlock'`, `'perspectiveBlock'` |
| Cylinder | `'cylinder'` (or `createCylinder(...)`), with `capRatio`, `viewAngle` and `taper` |

:::tip
Tune a star with `opts.starPoints`, and restyle any shape afterwards with ` Yappy.updateElement(id, { backgroundColor, strokeColor, fillStyle, opacity })`.
:::
