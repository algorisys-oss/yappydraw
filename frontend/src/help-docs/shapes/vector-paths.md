---
id: vector-paths
name: Vector Paths
icon: "✒️"
category: Drawing
description: Pen tool, the Node tool (Direct Selection), Convert to Path, Pathfinder booleans, Outline Stroke, Offset Path, and holes
keywords: "direct selection direct select white arrow node tool nodes anchor anchors anchor point control point handle handles bezier bézier edit points edit path reshape path marquee select nodes N key pen tool P corner smooth convert anchor insert point delete point subpath compound path hole donut pathfinder boolean unite subtract intersect exclude divide trim merge crop outline stroke offset path simplify convert to path switch shape while editing shift click add path straight line straight lines constrain segment 15 degrees fixed angle horizontal vertical 45 clock method noderef toggleNodeTool setNodeSelection allNodesOfSelection getPathNodes getNodeHandles moveSelectedNodes setSelectedNodesKind deleteSelectedNodes scripting api pause pen resume pen continue path continue from last anchor reopen path pick up where I left off unfinished path open path end anchor endpoint extend path close the shape later"
seoTitle: "Vector path editing online — pen tool, nodes and pathfinder"
seoDescription: "Edit vector paths in the browser: pen tool, node editing, convert to path, pathfinder booleans, outline stroke and offset path."
---

# Vector Paths

Draw and edit fully-editable Bézier paths — the same foundation Illustrator-class vector work is built on. Create paths with the Pen tool, reshape them node-by-node, convert any shape into a path, combine paths with boolean (Pathfinder) operations, and derive new paths with Outline Stroke and Offset Path. Every path renders in both the **Sketch** and **Architectural** drawing styles.

## The Pen Tool

Pick the **Pen / Vector Path** tool (the pen-nib icon) from the toolbar, then build a path point by point. Click to drop corner points; click-and-drag to drop a smooth point with curve handles that follow your drag.

| Gesture | Result |
| --- | --- |
| **Click** | Add a *corner* anchor (straight segment) |
| **Click + drag** | Add a *smooth* anchor; the drag sets the Bézier handles (curved segment) |
| **Click the first anchor** | Close the path into a filled shape |
| <kbd>Shift</kbd> + click (between points) | Constrain the **segment** to 15° increments — perfectly horizontal, vertical or 45° lines |
| <kbd>Shift</kbd> + drag (while curving) | **Clock Method** — constrain the Bézier handles to 90°/45° for clean, easily-edited curves |
| <kbd>Enter</kbd> / <kbd>Esc</kbd> / **double-click** | Finish the path open (not closed) — you can pick it up again later |
| <kbd>Backspace</kbd> | Remove the last anchor while still drawing |
| **Click an end anchor of an open path** | **Continue that path** from where you stopped |

:::tip
**Pause a path and come back to it.** You do not have to finish a path in one sitting. Press <kbd>Esc</kbd> or <kbd>Enter</kbd> (or just switch tools) and the path stays on the canvas, open, as an ordinary object — style it, move it, save the drawing, close the app. To carry on, pick the **Pen** again and hover over either *end* of the path: a blue ring appears on the anchor the next click will continue from. Click it and you are back in drawing mode, rubber-band and all, with that anchor as the live end. Clicking the *other* end then **closes the shape**.
:::

:::tip
Either end works. Click the *start* anchor and the path is continued backwards — Yappy reverses the point order behind the scenes (handles and all, so the curve does not change) so that new points still extend the end you clicked. Rotated paths and compound paths (ones with holes) are not resumable this way; edit those with the **Node tool** (<kbd>N</kbd>) instead.
:::

:::tip
**Shift does two jobs**, and which one you get depends on whether you are dragging. **Between clicks** it aims the next *segment*: the point snaps to the nearest **15°** from the previous anchor, so straight horizontals, verticals and 45° diagonals come out exact (the same increment the Line and Arrow tools use, and it overrides Snap to Grid for that click). **Mid-drag** it shapes the *handles* instead — see the Clock Method below. Clicking the first anchor still closes the path with <kbd>Shift</kbd> held.
:::

:::tip
**The Clock Method (90°/45°).** Holding <kbd>Shift</kbd> while you drag a handle snaps it straight to 12/3/6/9 o'clock (or the diagonals) — the trick pro illustrators use to keep curves smooth and predictable. No keyboard? Switch on the **90°/45°** button in the floating **Pen options bar**, or rest a **second finger** on the canvas while dragging with the stylus (the same Procreate-style constrain modifier used for proportional resize). The **90°/45°** toggle and the second finger constrain segments too, so tablet users get the straight-line behaviour without a keyboard.
:::

:::tip
A path carries the usual **stroke** (color / width / style), **fill** (solid or gradient), and **text** properties — set them in the property panel like any other shape.
:::

## Editing Nodes

Nodes belong to the **Node tool**, not the Select tool — the same split every other vector editor makes (Illustrator <kbd>V</kbd> vs <kbd>A</kbd>, Inkscape <kbd>S</kbd> vs <kbd>N</kbd>). Press <kbd>N</kbd>, or simply **double-click the path**, to reveal its anchors (squares) and Bézier handles (circles). Drag to reshape; use the modifiers below to restructure.

:::tip
**Why the Select tool shows no anchors.** It used to. On a four-point curve that was handy; on an outlined word or an imported icon it buried the artwork under hundreds of squares you had no intention of touching — and the anchors sitting on the bounding box quietly stole the corner-resize drag. Select is now purely a move / resize / rotate tool. You can still **right-click (or long-press) a path** without leaving it to reach *Make Smooth / Corner*, *Delete Anchor* and *Insert Point Here*.
:::

| Gesture | Result |
| --- | --- |
| **Drag an anchor** | Move the point (its handles travel with it) |
| **Drag a handle** | Reshape the curve (smooth = mirrored, corner = independent) |
| <kbd>Shift</kbd> + drag a handle | Constrain the handle to 90°/45° (Clock Method) |
| <kbd>Alt</kbd> + click an anchor | Convert *corner ↔ smooth* |
| <kbd>Alt</kbd> + click a segment | Insert a new anchor on the segment |
| <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + click an anchor | Delete that anchor |

### On a tablet (no keyboard)

Every node-editing action above has a touch equivalent, so you never need a modifier key on an iPad or touch device:

| Touch gesture | Result | Desktop equivalent |
| --- | --- | --- |
| **Tap an anchor** | Toggle *smooth ↔ corner* | <kbd>Alt</kbd>-click |
| **Long-press an anchor** | Menu: *Make Smooth/Corner*, *Delete Anchor* | <kbd>Alt</kbd> / <kbd>Ctrl</kbd>-click |
| **Long-press the outline** | Menu: *Insert Point Here* | <kbd>Alt</kbd>-click a segment |
| **90°/45° toggle** or **second finger** | Constrain handles (Clock Method) | Hold <kbd>Shift</kbd> |

:::tip
Tapping an anchor toggles its type; *dragging* it moves it — a small movement threshold keeps the two apart, so a deliberate drag never accidentally flips the point.
:::

### The Node tool (Illustrator's “Direct Selection”)

Everything above edits *one* anchor at a time. Press <kbd>N</kbd> — double-click a path, or Command Palette (<kbd>Ctrl</kbd>+<kbd>K</kbd>) → *Node Tool / Direct Selection*, or the Vector Tools palette → **Nodes** — to switch into the dedicated **Node tool**, which edits **many anchors at once**. It's the same thing Illustrator calls *Direct Selection* (the white arrow) and Inkscape calls the *Node tool*; Yappy uses Inkscape's <kbd>N</kbd> because <kbd>A</kbd> is already the Arrow tool.

Select a path first — the tool draws anchors for the **selected** path, so with nothing selected there's nothing to edit. You don't have to leave the tool to move on: **click another shape** and it becomes the one you're editing, **Shift-click** to edit several paths at once, and with nothing selected a **drag picks shapes** rather than anchors. Clicking empty space lets go in two stages — the first click drops the selected anchors, a second drops the path — so missing an anchor by a few pixels doesn't cost you your place.

| Gesture | Result |
| --- | --- |
| **Click another shape** | Switch to editing that path — no need to leave the tool |
| <kbd>Shift</kbd> + click a shape | Add it, so several paths edit at once |
| **Drag on empty space** | Marquee-select every anchor inside the box (or shapes, if no path is loaded) |
| **Click empty space** | Drop the selected anchors; click again to drop the path |
| <kbd>Shift</kbd> + marquee | Add those anchors to the selection |
| **Drag a selected anchor** | Move *all* selected anchors together |
| **Drag a handle** | Reshape that one anchor's curvature |
| <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>A</kbd> | Select every node of the selected path (as in Inkscape) |
| <kbd>Del</kbd> / <kbd>Backspace</kbd> | Delete the selected nodes (not the whole shape) |
| <kbd>Esc</kbd> | Clear the node selection; press again to leave the tool |

:::tip
Pressing <kbd>N</kbd> again leaves the tool, as does the **✕** in the tool-options bar. Scripted: `Yappy.toggleNodeTool(true)` / ` Yappy.toggleNodeTool(false)`.
:::

:::tip
Move, resize, rotate, align, snapping, and undo/redo all work on paths exactly as they do for other shapes.
:::

## Convert to Path

Turn any shape into an editable vector path **in place** — same position, z-order, style, and connections. Select one or more shapes, right-click, and choose **Path → Convert to Path**.

- Rectangles → 4 corner anchors
- Circles / ellipses → 4 smooth Bézier anchors
- Polygons & stars → exact corner anchors
- Complex shapes → outline sampled and simplified into anchors

Once converted, every node is editable with the gestures above.

## Pathfinder (Boolean Operations)

Combine two or more overlapping shapes into a new path. Select the shapes, right-click, and open the **Pathfinder** submenu. Order matters for Subtract — the back-most (lowest) shape is the base that the others are removed from.

| Operation | Result |
| --- | --- |
| **Unite** | Merge all shapes into one outline |
| **Subtract** | Remove the front shapes from the back-most shape |
| **Intersect** | Keep only the overlapping region |
| **Exclude** | Keep everything *except* the overlap |

## Outline Stroke & Offset Path

Both live in the right-click **Path** submenu.

### Outline Stroke

Converts a stroked line or path into a *filled* shape of the stroke itself (thickness = the current stroke width). The original element is replaced; the new path is filled with the old stroke color. Great for giving a brush-like outline real, editable geometry you can then recolor or combine.

### Offset Path

Creates a parallel copy of the path, expanded or contracted by a fixed distance, while keeping the original. **Offset Path (+10)** grows the outline outward by 10px; **Offset Path (−10)** shrinks it inward. Handy for concentric outlines, padding, and inset/outset effects.

## Stroke Alignment, Corners & End Caps

Three controls in the **Properties panel** decide how a stroke is actually painted around its outline. They apply to shapes *and* Pen tool paths, in both the sketch and architectural draw styles.

### Stroke Align — Center / Inside / Outside

By default a stroke **straddles** the outline: half its width falls inside the shape, half outside. That's *Center*. Switch to:

- **Inside** — the whole stroke sits *within* the outline, so the shape never grows past the box you drew. A border stops eating into the space around it.
- **Outside** — the whole stroke sits *outside* the outline, so a thick border never covers the artwork or fill it frames.

This is what you want when a region has to line up *exactly* with a grid or a neighbouring shape — a 12px map border on Center silently overhangs its region by 6px.

:::tip
**Closed outlines only.** Inside/Outside need an interior to be meaningful, so the control is offered for closed shapes and closed Pen paths. Open paths, lines, arrows and freehand strokes stay centred.
:::

### Corner Style — Sharp / Round / Bevel

How the stroke turns a corner. **Miter (Sharp)** extends both edges to a crisp point; **Round** arcs them; **Bevel (Flat)** cuts the corner off square. Sharp suits technical and architectural work, Round softens icons and routes, Bevel keeps very thick strokes from growing long spikes at tight angles.

### End Cap — Butt / Round / Square

How an **open** path ends — Pen paths, lines and freehand strokes. **Butt (Flat)** stops the line dead at its last point; **Round** finishes with a half-circle; **Square** with a flat extension. Round and Square both push the line *past* its final point by half the stroke width, so Butt is the one to use when a route must terminate exactly on a coordinate.

```
const Y = window.Yappy;

// A region whose 12px border stays entirely inside its bounds
Y.createRectangle(100, 100, 200, 140, {
  strokeColor: '#1d4ed8', strokeWidth: 12,
  backgroundColor: '#bfdbfe', fillStyle: 'solid',
  strokeAlign: 'inside',        // 'center' (default) | 'inside' | 'outside'
  strokeLineJoin: 'miter',      // 'round' (default) | 'miter' | 'bevel'
});

// A map route that terminates exactly on its end points
Y.createPath([{ x: 100, y: 300 }, { x: 260, y: 340 }, { x: 400, y: 300 }], {
  strokeColor: '#0f766e', strokeWidth: 14,
  strokeLineCap: 'butt',        // 'round' (default) | 'butt' | 'square'
  strokeLineJoin: 'bevel',
});
```

All three survive SVG export: corners and caps map straight onto ` stroke-linejoin` / `stroke-linecap`, and alignment is reproduced with a ` clipPath` (SVG has no `stroke-alignment` attribute of its own).

:::tip
**Sketch style is approximate.** In the hand-drawn style rough.js paints its own wobbly multi-pass strokes, so alignment is honoured to within the sketchiness rather than to the pixel. Use the architectural style when the edge has to be exact.
:::

## Simplify & Compound Paths

In the right-click **Path** submenu:

| Op | What it does |
| --- | --- |
| **Simplify** <kbd>Ctrl</kbd>+<kbd>L</kbd> | Reduces a path's anchor count while preserving its shape (great after Pathfinder/Outline produce dense corners) |
| **Smooth** | Rounds off janky corners without dropping anchors — the counterpart to Simplify |
| **Join Paths** | Connects 2+ open paths into one by chaining nearest endpoints; auto-closes if the free ends meet |
| **Make Compound Path** | Combines 2+ selected shapes into one path; overlapping areas become *holes* (even-odd) — the way a donut or the letter “O” is built |
| **Release Compound Path** | Splits a compound path back into separate, individually editable paths |

:::tip
**Simplify and Smooth work straight off a freehand stroke.** If what you selected isn’t a path yet — a pencil/fineliner stroke, a star, a cloud — it is converted to an editable path first, as part of the same action. That means one <kbd>Ctrl</kbd>+ <kbd>Z</kbd> undoes the whole thing, not just half of it. So the natural loop is: scribble a hill with the freehand tool, press <kbd>Ctrl</kbd>+<kbd>L</kbd>, and you get a clean, node-editable curve that keeps the hand-drawn wobble.
:::

```
const Y = window.Yappy;
Y.simplifyPath();          // selection; auto-converts non-paths first
Y.smoothPath();            // same, but rounds corners instead of dropping anchors
```

## Exporting as Vector

Export to **SVG** (Export dialog → SVG) writes every shape and path as a real, scalable *&lt;path>* — including compound holes (even-odd), rotation, and flips. Sketch-style shapes export as vector rough strokes; architectural shapes export as clean paths. The result opens losslessly in Illustrator, Inkscape, or any browser, with no pixelation.

## Holes & Compound Paths

A single path can hold **multiple subpaths** — letting it have holes (a donut, the counter of an “O”) or several disjoint islands. Holes are produced automatically:

- **Subtract** a shape from the middle of another → the result keeps the hole.
- **Outline Stroke** on a closed loop → keeps the inner edge as a hole.

Compound paths fill with the **even-odd** rule, so overlapping closed subpaths punch holes. Clicking *inside a hole* clicks through it (it selects whatever is behind, not the path) — matching what you see. Resize, rotate, and both drawing styles work on compound paths just like simple ones.

:::tip
Compound paths are **fully node-editable** — select one and every subpath's anchors (including the hole's) can be dragged, converted (Alt-click), deleted (Ctrl/⌘-click), and have new anchors inserted (Alt-click a segment), just like a simple path.
:::

## Scripting (API)

Everything the Pen tool and the right-click **Path** menu do is also available programmatically. The global entry point is `window.Yappy` (usable as `Yappy` in the console or a script block). Anchors use the ` PathAnchor` shape `{ x, y, kind?: 'corner' | 'smooth', inX?, inY?, outX?, outY? }`, where the handle offsets are relative to the anchor.

### Create & read paths

```
// A closed triangle from three corner anchors
const tri = Yappy.createPath([
  { x: 100, y: 100, kind: 'corner' },
  { x: 260, y: 140, kind: 'corner' },
  { x: 140, y: 260, kind: 'corner' },
], { closed: true, strokeColor: '#1e1e1e', strokeWidth: 2 });

// A smooth curve (Bezier handles via out/in offsets)
Yappy.createPath([
  { x: 100, y: 300, kind: 'smooth', outX: 60, outY: -60 },
  { x: 300, y: 300, kind: 'smooth', inX: -60, inY: -60 },
], { closed: false });

// Read an editable path back
const data = Yappy.getPath(tri); // { anchors, closed } or { subpaths }
```

### Holes & compound paths

```
// A donut: outer ring + inner hole (even-odd fill)
Yappy.createMultiPath([
  { closed: true, anchors: [
    { x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 200 }, { x: 0, y: 200 },
  ] },
  { closed: true, anchors: [
    { x: 60, y: 60 }, { x: 140, y: 60 }, { x: 140, y: 140 }, { x: 60, y: 140 },
  ] },
], { backgroundColor: '#4dabf7' });

// Or build/release a compound from existing selected shapes
Yappy.makeCompoundPath([idA, idB]);
Yappy.releaseCompoundPath([compoundId]);
```

### Convert, combine & derive

```
// Any shape -> editable path (in place)
Yappy.convertToPath([shapeId]);

// Boolean (Pathfinder) ops on 2+ ids
Yappy.pathfinder([a, b], 'union');    // 'union' | 'subtract' | 'intersect' | 'exclude'
Yappy.pathfinderRegion([a, b], 'divide'); // 'divide' | 'trim' | 'merge' | 'crop' | 'outline'

// Stroke -> filled outline shape
Yappy.outlineStroke([lineId]);

// Parallel copy, +grows / -shrinks
Yappy.offsetPath([pathId], 10);

// Chain open paths into one (auto-closes if ends meet)
Yappy.joinPaths([p1, p2]);
```

### Tidy up

```
// Reduce anchor count while keeping the shape
Yappy.simplifyPath([pathId]);

// Smooth anchors (strength 0..1, iterations). No ids -> current selection.
Yappy.smoothPath([pathId], 0.5, 2);
```

### Node editing

The Node tool is scriptable as well as clickable. An anchor is addressed by a **NodeRef** — `{ id, sub, i }`: the element id, which subpath (0 for a simple path), and the anchor's index within it. Operations act on the current *anchor* selection, which is separate from the element selection.

```
const Y = window.Yappy;

Y.select(pathId);
Y.toggleNodeTool(true);              // show the anchors

// Take every anchor of the selected path(s), then round them all off.
Y.setNodeSelection(Y.allNodesOfSelection());
Y.setSelectedNodesKind('smooth');

// Nudge just the anchors you pick (element-origin units).
Y.setNodeSelection([{ id: pathId, sub: 0, i: 2 }]);
Y.moveSelectedNodes(0, -20);

// Read positions in WORLD space, e.g. to drive your own layout.
Y.getPathNodes();    // [{ ref, x, y, kind }, ...]
Y.getNodeHandles();  // [{ h, x, y, ax, ay }, ...] for the selected anchors

Y.deleteSelectedNodes();             // a subpath is never taken below 2 anchors
Y.toggleNodeTool(false);
```

| Method | Purpose |
| --- | --- |
| `toggleNodeTool(active?)` | Show/hide the anchors of the selected path(s) |
| `setNodeSelection(refs)` | Replace the anchor selection; refs are `{ id, sub, i }` |
| `allNodesOfSelection()` | Every anchor of every path in the element selection |
| `getPathNodes()` | Selected paths' anchors in world space — `{ ref, x, y, kind }` |
| `getNodeHandles()` | Bézier handles of the selected anchors — `{ h, x, y, ax, ay }` |
| `moveSelectedNodes(dx, dy)` | Move every selected anchor by the same delta |
| `setSelectedNodesKind(kind)` | `'corner'` or `'smooth'` for the selection |
| `deleteSelectedNodes()` | Delete the selected anchors |
| `createPath(anchors, opts?)` | New single-subpath path; `opts.closed` fills it |
| `createMultiPath(subpaths, opts?)` | Multi-subpath path (holes / islands, even-odd) |
| `getPath(id)` | Read anchors + `closed`, or `subpaths` |
| `convertToPath(ids)` | Turn shapes into editable paths in place |
| `pathfinder(ids, op)` | Boolean: union / subtract / intersect / exclude |
| `pathfinderRegion(ids, op)` | Region: divide / trim / merge / crop / outline |
| `outlineStroke(ids)` | Convert a stroke into a filled outline path |
| `offsetPath(ids, distance)` | Parallel copy (+out / −in) |
| `simplifyPath(ids)` | Reduce anchor count, keep shape |
| `smoothPath(ids?, strength?, iterations?)` | Smooth anchors (defaults 0.5, 2) |
| `makeCompoundPath(ids)` | Combine shapes into one compound path |
| `releaseCompoundPath(ids)` | Split a compound back into separate paths |
| `joinPaths(ids)` | Chain open paths by nearest endpoints |

:::tip
Need a shape with no dedicated helper? The generics ` Yappy.createElement('path', x, y, w, h, opts)` and ` Yappy.updateElement(id, { ... })` always work.
:::
