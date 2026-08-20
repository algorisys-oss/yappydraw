---
id: basic-shapes
name: Basic Shapes
icon: "⬜"
category: Shapes
description: Rectangle, circle, diamond, triangle - the fundamental building blocks
seoTitle: "Rectangle, circle, diamond, triangle — the basic diagram shapes"
seoDescription: "The four shapes every diagram is built from, with independent corner rounding, fill styles and the scripting API for each."
---

# Basic Shapes

The fundamental building blocks for any diagram. These shapes form the foundation
for flowcharts, wireframes, architecture diagrams, and general-purpose illustrations.

## Quick Reference

| Shape | Shortcut | Common Uses |
| --- | --- | --- |
| **Rectangle** | <kbd>R</kbd> or <kbd>2</kbd> | Process steps, containers, buttons, cards |
| **Circle** | <kbd>O</kbd> or <kbd>3</kbd> | Start/end points, nodes, avatars, bullets |
| **Diamond** | <kbd>D</kbd> | Decision points, conditions, data flow |
| **Triangle** | Toolbar | Warnings, hierarchy, directional indicators |

## Rectangle

The most versatile shape in any diagramming tool. Use rectangles as containers,
process steps, UI components, or any bounded element.

### Properties

| Property | Description |
| --- | --- |
| **Roundness** | Round all four corners at once (0 = sharp, higher = more rounded) |
| **Corner ↖ ↗ ↘ ↙** | Round each corner *independently* — one corner at 40 and the rest sharp, or any mix. See below. |
| **Fill Style** | Solid, hachure, cross-hatch, or none |
| **Stroke Style** | Solid, dashed, or dotted border |
| **Roughness** | Hand-drawn appearance (0 = clean, higher = sketchy) |

### Independent corners

Below **Roundness** sit four per-corner sliders —
**Corner ↖**, **↗**, **↘**, **↙** — for
the shapes packaging, UI cards and logo work actually need: one rounded corner and three
sharp, a rounded diagonal pair, a tab with only its top edge softened.

- A corner you never touch **follows Roundness**, so setting one corner does
  not square the other three. Set a corner to **0** to make it explicitly
  sharp while the rest stay round.
- Values are a **percent of the shorter side**, the same unit Roundness uses —
  so the corners keep their proportions when you resize the rectangle, and 50 is a
  half-round end.
- Each corner is capped at half the shorter side, which is the point where the arcs would
  start crossing each other.

It is the real outline, not a decoration: the fill, gradient and image clipping follow it,
both **Sketch** and **Architectural** styles draw it, SVG export
writes one arc per rounded corner, and *Convert to Path* / Knife / Warp keep the
corners you set.

```
Yappy.createRectangle(40, 40, 240, 140, { radiusTL: 40 });               // one rounded corner
Yappy.createRectangle(40, 40, 240, 140, { radiusTL: 40, radiusBR: 40 }); // rounded diagonal
Yappy.createRectangle(40, 40, 240, 140, { borderRadius: 25, radiusTR: 0 });  // all but one
```

:::tip Tip: Quick Squares
Hold <kbd>Shift</kbd> while drawing to constrain to a perfect square.
:::

## Circle / Ellipse

Draw circles for nodes, avatars, and state indicators. By default, circles maintain
their aspect ratio, but you can create ellipses by adjusting width and height independently.

### Properties

| Property | Description |
| --- | --- |
| **Fill Style** | Solid, hachure, cross-hatch, or none |
| **Stroke Width** | Border thickness |
| **Opacity** | Transparency level (0-100%) |

:::tip Tip: Perfect Circles
Hold <kbd>Shift</kbd> while drawing to maintain a 1:1 aspect ratio.
:::

## Diamond

The classic decision shape in flowcharts. Diamonds typically represent yes/no questions
or conditional branching points in process flows.

### Common Uses

- **Flowcharts** - Decision points with yes/no branches
- **Data Flow Diagrams** - Data transformation nodes
- **State Machines** - Conditional transitions

:::tip Best Practice
Label diamond shapes with questions that have clear yes/no answers.
Connect "Yes" and "No" branches to different paths.
:::

## Triangle

Triangles serve multiple purposes: warning indicators, hierarchy visualization,
directional markers, and decorative elements.

### Variants

| Type | Description |
| --- | --- |
| **Equilateral Triangle** | All sides equal - balanced, symmetrical look |
| **Right Triangle** | Has a 90° angle - useful for corners and technical diagrams |

## Common Styling Options

All basic shapes share these styling options:

### Fill Styles

| Style | Description |
| --- | --- |
| **Solid** | Completely filled with background color |
| **Hachure** | Diagonal line pattern (hand-drawn feel) |
| **Cross-Hatch** | Crossed diagonal lines |
| **None** | Transparent fill, outline only |

### Stroke Styles

| Style | Shortcut |
| --- | --- |
| **Solid** | Press <kbd>S</kbd> to cycle |
| **Dashed** | Press <kbd>S</kbd> to cycle |
| **Dotted** | Press <kbd>S</kbd> to cycle |

### Text labels

Double-click a shape (or select it and start typing) to give it a label. Text is
**centred by default** — both horizontally and vertically — which is what you want for
almost every diagram box. Change it per shape with the alignment buttons in the Properties panel or
the smart toolbar, or set `textAlign` to `'left'` / `'right'` from
the API. Code blocks and UML attribute/method sections stay left-aligned, and table cells keep their
own per-cell alignment.

While you type, the editor sits exactly where the label is drawn — same position, same line breaks,
same vertical alignment — so nothing shifts when you start or finish editing. Shapes that can't use
their full width for text (a circle, a diamond, a banner) wrap inside their inscribed area, and the
editor wraps there too. Press <kbd>Esc</kbd> or <kbd>Ctrl</kbd> +
<kbd>Enter</kbd> to commit, <kbd>Enter</kbd> for a new line.

## Keyboard Shortcuts

:::shortcuts
Shift + Drag | Constrain proportions
Alt + Drag | Draw from center
S | Cycle stroke style
F | Cycle fill style
:::

## Scripting (API)

Create basic shapes from the console or a script via the global
`window.Yappy` (usable as `Yappy`). Each returns the new
element's `id`. Positions are canvas coordinates:
`(x, y)` is the top-left corner, then `width`, `height`.

```
// Dedicated helpers
Yappy.createRectangle(80, 80, 160, 90, { borderRadius: 12, backgroundColor: '#a5d8ff' });
Yappy.createCircle(300, 80, 100, 100, { fillStyle: 'hachure' });
Yappy.createDiamond(80, 240, 140, 100);
Yappy.createTriangle(300, 240, 120, 120, { strokeColor: '#e03131' });

// Generic form (type strings: 'rectangle' | 'circle' | 'diamond' | 'triangle')
const id = Yappy.createElement('rectangle', 0, 0, 200, 120, { roughness: 1.5 });

// Restyle afterwards
Yappy.updateElement(id, { backgroundColor: '#ffd43b', strokeWidth: 3 });
```

| Method | Type string |
| --- | --- |
| `createRectangle(x, y, w, h, opts?)` | `'rectangle'` |
| `createCircle(x, y, w, h, opts?)` | `'circle'` |
| `createDiamond(x, y, w, h, opts?)` | `'diamond'` |
| `createTriangle(x, y, w, h, opts?)` | `'triangle'` |

:::tip
Common `opts`: `backgroundColor`, `strokeColor`,
`strokeWidth`, `fillStyle` (`'solid' | 'hachure' | 'cross-hatch'`),
`strokeStyle` (`'solid' | 'dashed' | 'dotted'`),
`roughness`, `opacity`, `borderRadius`.
:::
