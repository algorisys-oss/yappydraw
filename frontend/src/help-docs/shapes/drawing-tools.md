---
id: drawing-tools
name: Drawing Tools
icon: "✏️"
category: Drawing
description: Pencil, fineliner, marker, and ink brush for freehand drawing
seoTitle: "Free online drawing tools — pencil, fineliner, marker and ink brush"
seoDescription: "Draw freehand in the browser with pressure-aware brushes, stroke stabilisation and a real eraser. Free, no signup, nothing uploaded."
---

# Drawing Tools

Freehand drawing tools for sketching, annotating, and adding personal touches to your diagrams. Each tool has unique characteristics for different drawing styles.

## Available Tools

| Tool | Shortcut | Characteristics |
| --- | --- | --- |
| **Pencil** | <kbd>P</kbd> or <kbd>8</kbd> | Basic freehand drawing with consistent width |
| **Fineliner** | Toolbar | Precise, thin strokes for detailed work |
| **Marker** | Toolbar | Wide, bold strokes for highlighting |
| **Ink Brush** | Toolbar | Pressure-sensitive, calligraphic strokes |

## Pencil

The default freehand drawing tool. Creates smooth, consistent-width strokes perfect for quick sketches and annotations.

### Properties

| Property | Description |
| --- | --- |
| **Stroke Width** | Line thickness (1-20px) |
| **Color** | Stroke color |
| **Opacity** | Transparency level |

:::tip Tip: Smooth Lines
Draw slowly for smoother lines. The pencil tool applies automatic smoothing to reduce jagged edges.
:::

## Fineliner

A precision drawing tool that produces thin, consistent strokes. Ideal for detailed illustrations, signatures, and fine annotations.

### Best For

- Technical sketches
- Handwritten labels
- Fine detail work
- Signatures

## Marker

A bold, wide-stroke tool perfect for highlighting, emphasis, and creating impactful visual elements.

### Properties

| Property | Description |
| --- | --- |
| **Stroke Width** | Marker thickness (typically 10-30px) |
| **Opacity** | Semi-transparent for highlighter effect |

:::tip Highlighter Effect
Set opacity to 40-60% and use bright yellow or green for a realistic highlighter effect over text and shapes.
:::

## Ink Brush

A calligraphic brush that varies stroke width based on drawing speed. Creates elegant, expressive strokes with an organic feel.

### Characteristics

- **Speed Sensitivity** - Fast strokes are thinner, slow strokes are thicker
- **Tapered Ends** - Natural stroke start/end tapering
- **Smooth Curves** - Optimized for flowing, continuous lines

### Best For

- Calligraphy and lettering
- Artistic flourishes
- Expressive illustrations
- Asian-style brush strokes

## Eraser

Remove parts of freehand drawings or delete entire elements.

### Modes

| Mode | Description |
| --- | --- |
| **Element Eraser** | Click to delete entire shapes/elements |
| **Stroke Eraser** | Erase portions of freehand strokes |

:::tip Quick Access
Press <kbd>E</kbd> or <kbd>7</kbd> to quickly switch to the eraser tool.
:::

## Laser Pointer

A temporary drawing tool for presentations. Strokes fade away after a few seconds, perfect for pointing out elements during screen sharing or presentations.

### Usage

- Activate with <kbd>Shift</kbd>+<kbd>P</kbd>
- Draw attention to specific areas
- Strokes automatically fade after ~2 seconds
- Great for presentations and demos

## Tool options (top bar)

The middle of the top bar shows the options for whichever tool is active, and changes as you switch tools. What you set there applies to the **next** thing you draw — it is the tool's own setting, not an edit to anything already on the canvas. To restyle something you have already drawn, select it and use the floating quick toolbar or the Properties panel.

| Tool | Options |
| --- | --- |
| **Shapes** | Stroke colour, fill colour, stroke style, opacity, corner roundness (on shapes that have corners), and the font, size and alignment used for text typed inside the shape. |
| **Connectors**<br />(line, arrow) | Stroke colour, line width, stroke style, line type (straight / curved / elbow) and the arrowhead at each end. |
| **Text** | Colour, font, size, bold, italic and alignment. |
| **Brushes**<br />(Fineliner, Ink Brush, Marker) | Stroke colour and width, plus Fill mode and Symmetry. |
| **Node tool** | Takes over the bar entirely with its node operations, and hands it back to the active tool on exit. |

Each tool remembers its own settings, so a red brush and a black rectangle stay that way as you switch between them. The Bezier, Elbow, Polyline and Organic Branch tools do not show a line type — those tools *are* a line type, and the setting would be ignored. A tool with nothing to offer (Selection, Pan, Eraser) leaves the bar empty rather than showing placeholders.

## Keyboard Shortcuts

:::shortcuts
P or 8 | Pencil tool
E or 7 | Eraser tool
Shift+P | Laser pointer
[ / ] | Decrease/increase brush size
Shift+Q | Toggle Smart Shapes
:::

## Smart Shapes (hold to correct)

Draw a shape freehand with any pen tool (Pencil, Fineliner, Ink Brush, Marker) and **hold the pen still for about half a second** before lifting. The freehand stroke instantly snaps to a clean geometric shape.

Your **pen tool stays active** and nothing is left selected, so you can carry straight on drawing without a trip back to the toolbar or a set of selection handles sitting on top of your work. Switch to **Select** (<kbd>V</kbd>) and click the shape when you want to move, resize, fill or connect it.

- A roughly straight stroke becomes a **line**.
- A closed round stroke becomes an **ellipse / circle**.
- A four-cornered stroke becomes a **rectangle** (or a **diamond** when drawn on its points).
- A three-cornered stroke becomes a **triangle**.

It is built to cope with a **mouse or trackpad**, not just a stylus: wobbly edges, a corner you didn't quite close, and running past your own starting point are all recognised normally. Draw roughly — you don't need a steady hand.

If the stroke is genuinely ambiguous it is left as freehand ink, so holding still never forces a wrong shape. Open strokes are only ever turned into a line: an arc or a half-drawn box stays as ink rather than being closed up for you. Toggle the feature with <kbd>Shift</kbd>+<kbd>Q</kbd>, from the Command Palette, or in **Settings → Pen & Input**.

## Pressure Sensitivity

With an Apple Pencil or other pressure-capable stylus, the **Ink Brush** varies its width with how hard you press — light for fast, fine lines and heavy for bold strokes. Input without pressure (mouse, finger) falls back to velocity-based width. Turn pressure on or off in **Settings → Pen & Input**.

## Stroke Stabilization (lazy brush)

For confident, clean inking, turn on **stroke stabilization**. The brush trails your cursor on a "pulled string" — small jitter inside the string's length is absorbed, and the line is dragged along only once you pull past it. Higher strength means a longer string: smoother and heavier, with a little more lag. The same Procreate/Krita inking feel, and it works with mouse, finger, and Apple Pencil.

Because you'll flip it on and off as you work, it's available several ways: a quick toggle with <kbd>Shift</kbd>+<kbd>S</kbd>, the **stabilization button** in the toolbar (shown while a pen tool is active), the **brush properties panel** (a 0–100% strength slider), the Command Palette, and **Settings → Pen & Input**. The toggle remembers your last strength. It stacks on top of the always-on light smoothing.

## Touch Gestures (iPad & touch)

On a touchscreen, multi-finger gestures give you quick, keyboard-free shortcuts while you draw — inspired by Procreate. One finger draws (with palm rejection when an Apple Pencil is paired); extra fingers act as commands.

- **Two-finger drag / pinch** — pan and zoom the canvas.
- **Two-finger tap** — undo. Hold two fingers still to keep undoing.
- **Three-finger tap** — redo.
- **Three-finger swipe down** — copy the current selection.
- **Four-finger tap** — toggle Zen mode (hide the UI chrome).
- **Quick pinch-in flick** — zoom to fit.

A quick two-finger tap no longer nudges the canvas — panning only begins once your fingers actually move, so taps stay crisp commands.

## ColorDrop — drag a colour onto a shape

Open the colour palette and **drag a swatch onto any shape** to set its fill — a colour chip follows your finger and the shape under it is filled on release. A plain tap on a swatch still sets the stroke colour (<kbd>Shift</kbd>+click for fill on desktop). On desktop you can also drag a swatch onto a shape with the mouse.

## Text sizing — auto width vs fixed width

A text box has two sizing modes, shown as the **Auto Resize** toggle in the Properties panel (Text group):

- **Auto Resize on — auto width.** The box hugs the text and never wraps; it grows and shrinks as you type. Only your own line breaks split lines. This is what you get when you **click** with the Text tool.
- **Auto Resize off — fixed width.** The width you set is held, the text wraps inside it, and the height re-flows to fit. This is what you get when you **drag out a box** with the Text tool.

:::tip
**Dragging the left or right handle switches an auto-width box to fixed width** — the width you drag to is the width you keep, and the text wraps into it (as in Figma). Use the Auto Resize toggle to go back: the box snaps in to hug the text again. Corner and top/bottom handles resize the box freely and never change the font size.
:::

## Text on Path (Curved Text)

Any path-like element can carry a text label that follows its shape. Double-click the element to type, then toggle **Curved Text** in the quick toolbar to make the text flow along the path.

- **Pen strokes** (Fineliner, Ink Brush, Marker) — text follows the stroke you drew.
- **Connectors** — lines, arrows, bezier curves, elbows, and polylines.
- **Closed shapes** — rectangle, circle, diamond, triangle, polygons, etc.; the text wraps around the outline.

With Curved Text off, the label stays a normal centered caption. On closed shapes you can nudge where the text starts and whether it sits on or just outside the outline.

## Scripting (API)

The freehand tools (Pencil, Fineliner, Marker, Ink Brush) are primarily *interactive* — you draw with a pointer or stylus. For programmatic strokes, the global `window.Yappy` (usable as `Yappy`) exposes a few ways to commit ink from a list of world points.

```
// Blob brush: filled stroke from world points (radius = half-thickness).
// Same-colour overlaps merge into one shape.
Yappy.blobStroke([
  { x: 100, y: 100 }, { x: 160, y: 130 }, { x: 220, y: 100 },
], 14);

// A vector "pen" stroke as an open path (crisp, fully editable)
Yappy.createPath([
  { x: 100, y: 220, kind: 'smooth', outX: 40, outY: -40 },
  { x: 240, y: 220, kind: 'smooth', inX: -40, inY: -40 },
], { closed: false, strokeColor: '#1e1e1e', strokeWidth: 3 });
```

| Method | Purpose |
| --- | --- |
| `blobStroke(points, radius?)` | Commit a filled brush stroke (default radius 14) |
| `createPath(anchors, opts?)` | A crisp, editable vector stroke as a path |
| `toggleBlobBrush(active?)` | Turn the blob brush tool on/off |
| `togglePathEraser(active?)` | Turn the path eraser on/off |
| `pathErase(points, radius?)` | Carve an eraser swath out of overlapping shapes |

:::tip
For the full vector-path scripting surface (smoothing, simplifying, outlining a stroke into a filled shape), see the **Vector Paths** help page.
:::
