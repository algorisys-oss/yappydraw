---
id: geometric-shapes
name: Geometric Shapes
icon: "⬡"
category: Shapes
description: Hexagon, star, polygon, and other geometric shapes
seoTitle: "Hexagon, star, polygon — geometric shapes for diagrams"
seoDescription: "Regular polygons, stars with adjustable inner radius, hexagons for honeycomb layouts, and the parameters behind each one."
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
| **Cylinder** | 3D cylinder (databases, storage) |

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
Yappy.createElement('cylinder', 80, 240, 120, 150);   // pseudo-3D
Yappy.createElement('isometricCube', 240, 240, 120, 120);

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
| 3D blocks / Cylinder | `'isometricCube'`, `'solidBlock'`, `'perspectiveBlock'`, `'cylinder'` |

:::tip
Tune a star with `opts.starPoints`, and restyle any shape afterwards with ` Yappy.updateElement(id, { backgroundColor, strokeColor, fillStyle, opacity })`.
:::
