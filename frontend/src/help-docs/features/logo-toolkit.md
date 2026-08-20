---
id: logo-toolkit
name: Logo & Design Toolkit
icon: "✦"
category: Design
description: "Repeat & symmetry (radial / grid / mirror / mandala) and Text → Outlines for logo construction"
keywords: symmetry mirror axis vertical horizontal quadrant 4-way radial spokes sectors mandala kaleidoscope dihedral bilateral wedge petal rosette mandala generator generate mandala mandala tool preset simple lotus lace star rosette motif band bands rings concentric petal teardrop diamond dot arc scallop spike divider createMandala mandalaPresets colouring book coloring book colouring page live symmetry draw one wedge move axis Alt+Y Alt+Shift+Y angle tilt mirror across symmetry axis mirror selection ring guides rings ring gap concentric circles scaffold bands colouring book coloring book colouring page coloring page line art outline repeat radial grid step and repeat transform again mirror copy shape builder compound shape text to outlines setSymmetryMode setRadialCount setSymmetryRings setSymmetryRingSpacing setSymmetryCenter radialRepeat gridRepeat
---

# Logo & Design Toolkit

A set of construction tools for building logos, monograms, and symmetric marks — the moves you see in pro logo-design timelapses. Arrange copies in rings and grids, mirror artwork into symmetric pairs, and replay transforms to step-and-repeat. Pair these with the **Rulers & Guides** (Alt+R) and the **Vector Paths** tools (Pathfinder, Offset, Outline Stroke) for a full vector workflow.

## Shape Builder

The fastest way to build a custom silhouette from simple shapes. Overlap a few primitives (circles, rectangles, the pen tool…), select them all (≥2), then right-click → **Shape Builder**. **Drag a stroke across** the regions you want to fuse — they highlight and, on release, **merge into one path**. Hold **Alt** while dragging to **delete** the regions you cross instead. **Esc** exits.

It works at the **face level**, exactly like Illustrator: the selection is broken into its *atomic regions*. Two overlapping circles become *three* faces — the left crescent, the central lens, and the right crescent — and you can act on each independently. Paint across the lens with **Alt** to **punch it out** (carve a notch), or drag across one crescent + the lens to fuse just those. Every region you *don't* touch is kept as its own path. When the shapes don't overlap it falls back to merging whole shapes.

On a **tablet** (no Alt key), use the on-screen **Merge / Delete** toggle in the hint bar to switch modes, then drag; tap **Done** to exit. Results keep their original stacking order, and rotated shapes are handled correctly.

:::tip
It's built on the Pathfinder engine, so each result is a true boolean region producing an editable vector path. For precise set operations on exactly two shapes, the right-click **Pathfinder** (union / subtract / intersect / exclude) is also there. (`Yappy.toggleShapeBuilder()`.)
:::

### Compound Shapes — non-destructive booleans

**Pathfinder** flattens and consumes the source shapes. When you want to keep them editable, use **Compound Shapes** instead: right-click ≥2 shapes → **Make Compound Shape ▸ Unite / Minus Front / Intersect / Exclude**. The result is one object that *retains its sources*, so you can:

- **Change the operation** at any time — right-click the compound → **Compound Shape ▸ Op: …** (the result re-evaluates live).
- **Edit the sources in place** — double-click the compound (or Compound Shape ▸ Edit Contents) to explode it into its editable shapes; move/edit them and press <kbd>Esc</kbd> to rebuild the compound.
- **Release** it back into the original editable shapes.
- **Expand** it to flatten to a plain path (same as Pathfinder).

:::tip
Scripting: `Yappy.makeCompound(ids, 'union'|'subtract'|'intersect'|'exclude')`, ` setCompoundOp(id, op)`, `releaseCompound(id)`, `expandCompound(id)`, ` editCompound(id)` / `finishCompoundEdit(save)`.
:::

## Repeat & Symmetry

Select one or more elements (or a group), then open **Repeat & Mirror** from the right-click menu, or run any of the commands from the Command Palette (<kbd>Ctrl</kbd>+<kbd>K</kbd>). Every operation works on the whole selection as one rigid unit and keeps copies grouped with each other.

| Command | Shortcut | What it does |
| --- | --- | --- |
| **Repeat → Radial** | — | Arranges *N* copies evenly around the selection centre. Set the *Count*, a *Radius* to push them out into a ring (0 = rotate in place), and *Face center* to orient each copy outward. Radius 0 with Count 2 makes a 180° rotational mark (e.g. a yin-yang leaf). |
| **Repeat → Grid** | — | Tiles the selection into *Rows × Columns* with an adjustable *Gap*. |
| **Mirror Copy →** | — | Duplicates the selection reflected across its *right* edge, so the mirror sits adjacent and forms a horizontally-symmetric pair. |
| **Mirror Copy ↓** | — | Same, reflected across the *bottom* edge (vertical symmetry). |
| **Transform Again** | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> | Clones the selection and replays your last move or duplicate. Duplicate (<kbd>Ctrl</kbd>+<kbd>D</kbd>) once, nudge it, then press Transform Again repeatedly to step-and-repeat in the same direction. |

:::tip
**Build a symmetric mark fast:** draw one half, run *Mirror Copy →*, then select both halves and use *Pathfinder → Unite* (in the Vector Paths tools) to weld them into a single clean shape.
:::

:::tip
**Build a radial/mandala mark:** draw one petal/element, run *Repeat → Radial* with a count of 6–12 and *Face center* on. Increase the radius to spread the instances into a ring.
:::

## Text → Outlines

Turn a text element into a fully-editable vector **path** of its glyph shapes — the Illustrator "Create Outlines" move, and the foundation of wordmark and monogram design. Select a text element and run **Create Outlines** from the right-click *Path* submenu, the Command Palette, or press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>O</kbd>.

The result is a real vector path: the counters (the holes in *o, e, a, g, D…*) become separate subpaths punched out with the even-odd fill rule, and every contour is node-editable. Because it's now a path, the whole vector toolkit applies — reshape nodes, combine letters with **Pathfinder** booleans, add **Offset Path** borders, and weld with **Outline Stroke**.

| Note | Detail |
| --- | --- |
| Editable | Press <kbd>N</kbd> (or double-click the path) for the Node tool, then drag anchors and Bézier handles; counters stay as holes. |
| Style | The outline always renders **clean**, even in a sketch-style document. Text is drawn by the font renderer, which sketch never roughens — so a roughened outline would hand back visibly different letterforms than the text you converted. Switch the path to *Sketch* in the Style control if you want a hand-drawn wordmark. |
| Colour | The path inherits the text colour as a solid fill (no stroke). |
| Fonts | Works with the bundled families **and any font you add from a file** (*＋ Add font…*, .ttf / .otf / .woff). |
| Italics | Outlined from the family's real italic face where there is one (Inter, Poppins, Merriweather, Source Code Pro, JetBrains Mono) — a true italic is a different design, not a sloped roman. Families with no italic face (Virgil, Marker, Caveat) are slanted by the same amount the browser uses, so the vector matches the text it replaced. |
| Layout | Honours font size, weight, alignment, and hard line breaks. (No soft-wrap — break lines yourself for multi-line marks.) |

:::tip
**Google fonts can't be outlined.** A font added by name from the Google Fonts browser arrives as a web font — the browser renders it, but hands us nothing we can read the glyph shapes out of (it's WOFF2, which is Brotli-compressed and can't be parsed client-side). To outline a Google font, download the family from *fonts.google.com* and add the .ttf with **＋ Add font…**; the outline then comes from the real typeface. Earlier versions quietly substituted a default sans-serif here, which produced the right letters in the wrong face — it now tells you instead and leaves your text alone.
:::

:::tip
**Monogram recipe:** type the letters → *Create Outlines* → reposition / overlap the glyphs → select all → *Pathfinder → Unite* for a single welded mark, or *Offset Path* for an outlined badge.
:::

## Symmetry

**Live symmetry: whatever you draw is mirrored as you draw it.** The copies track your stroke while the pointer is still down, so you see the whole mark forming rather than half of it. Every drawing tool is covered — freehand, pen and polyline as well as rectangles, ellipses, connectors and the rest.

Turn it on from the **footer buttons** (mirror left/right, mirror up/down, and a crosshair to move the axis), with <kbd>Alt</kbd>+<kbd>Y</kbd>, from the Command Palette, or in the *Symmetry* section of the Canvas panel. Dashed axes appear at the centre of your view.

### Modes

| Mode | What you get |
| --- | --- |
| **Vertical** | Mirrors left ↔ right across a vertical axis. 2 copies. |
| **Horizontal** | Mirrors up ↕ down across a horizontal axis. 2 copies. |
| **Both** | 4-way quadrant — vertical + horizontal + 180°. 4 copies. |
| **Radial** | Mandala: 2–36 spokes evenly around the centre. Rotations only, so a wedge repeats but isn't mirrored within itself. |
| **Kaleidoscope** | Mandala with every wedge *also* mirrored: 2–36 sectors, **twice** that many copies. This is the bilateral symmetry traditional mandalas have — draw half a petal and the other half draws itself. |

Radial vs. Kaleidoscope is the difference between a rotated doodle and a mandala. Radial spins your wedge around the centre; kaleidoscope reflects it across each spoke on the way round, so both edges of every petal match. Sector count is the same slider for both — kaleidoscope just emits 2× the copies, and the panel shows the total.

### Setting the axis / centre point

Press <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>Y</kbd> (or *Move axis* in the Canvas panel) to show the centre handle, then drag it wherever you want the mirror line or mandala centre. Replication is suspended while you're moving the axis, so you can reposition without leaving stray copies. Press it again when you're done.

**Angle** tilts the mirror lines (−90°…90°) or offsets the radial spokes, so symmetry doesn't have to be screen-aligned. **Spokes** sets the mandala count.

### Working with the result

Every instance of a mark is **grouped with the original**, so it moves, styles and undoes as one object. To un-link them, ungroup as normal.

For marks drawn *before* you switched symmetry on, select them and run **Mirror Across Symmetry Axis** (Command Palette, or right-click → *Repeat & Mirror*). Unlike *Mirror Copy* (which reflects across the selection's own edge), this reflects across the shared axis — so every half lines up.

:::tip
A stroke you abandon takes its mirror copies with it — a stray click that produces no shape doesn't leave mirrored copies of nothing behind.
:::

### Ring guides

**Rings** in the Canvas panel's Symmetry section draws concentric dashed circles around the symmetry centre, spaced by **Ring gap**. They're the scaffold that stops a mandala's bands from drifting: keep each round of motifs between two circles and the finished piece reads as even.

Rings are guides, not elements — they never select, never print and never appear in an export. They also stay visible when you switch symmetry off, so the scaffold is still there while you finish detail work by hand. Set Rings to 0 to hide them.

### The Mandala generator — a whole design at once

Drawing every band by hand is the fun way; sometimes you just need a page. **Vector Tools → Insert → Mandala…** (also right-click → *Insert*, or the Command Palette → “Mandala Generator”) builds a complete mandala from parameters, with an outline preview on the canvas while you adjust it. Start from a preset — *Simple 8*, *Lotus 12*, *Lace 24*, *Star 16*, *Rosette 6* — then change *Size*, *Line weight*, or open *Edit bands* to work band by band.

A mandala is a stack of concentric **bands**, each repeating one motif around the centre. Per band you set the motif (Petal, Lotus, Teardrop, Diamond, Dot, Arc, Scallop, Spike, or a plain Ring divider), how many copies, its inner and outer radius, a rotation to offset it against its neighbours, and how fat the motif sits inside its wedge. Every motif is mirror-symmetric about its own spoke — the same property Kaleidoscope gives hand-drawn work — so generated bands and anything you draw on top agree.

**Apply** commits it as ordinary grouped paths in your current drawing style, selected and ready to move or restyle, and it undoes in a *single* step no matter how many shapes it contains. Nothing is left behind if you Cancel. Leave *Arm symmetry after* ticked and Kaleidoscope symmetry is pointed at the new mandala's centre and spoke count, so you can carry straight on by hand.

:::tip
**The preview draws clean outlines even in sketch style.** It is an overlay rather than real shapes — which is what keeps a slider drag from filling your undo history with scaffolding — so in *sketch* style the committed mandala gains rough.js wobble the preview didn't show. Sizes, counts and radii are exact; only the line quality differs.
:::

```
                    // same generator from the API
Yappy.createMandala(400, 400, { preset: 'lotus', radius: 220 });
Yappy.createMandala(400, 400, { preset: 'lace', radius: 300, armSymmetry: true });

// or spell the bands out
Yappy.createMandala(400, 400, { rings: [
  { motif: 'dot',   count: 1,  rInner: 0,   rOuter: 30, phase: 0, width: 1 },
  { motif: 'petal', count: 12, rInner: 32,  rOuter: 120, phase: 0, width: 0.8 },
  { motif: 'ring',  count: 1,  rInner: 120, rOuter: 128, phase: 0, width: 1 },
]}, { strokeWidth: 3 });

Yappy.mandalaPresets;   // the built-in designs
Yappy.mandalaMotifs;    // the motif vocabulary
```

### Drawing a mandala for a colouring page

By hand, if you want the design to be yours rather than generated (or want to add to something the generator made):

1. Pick a drawing tool, set **Symmetry → Kaleidoscope** and a sector count (12 and 16 are good starting points; 24–36 for dense lace).
2. Press <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>Y</kbd> and drag the centre where you want it.
3. Turn on **Rings** — say 5 rings at a 70–90 gap — to mark the bands.
4. Draw one wedge, band by band, working outward. Every other sector fills in live.
5. Use no fill and a heavier stroke so the shapes are big enough to colour inside.
6. Export with `exportSVG()` for a print layout, or ` exportPageToPng(0, 4)` for a print-resolution raster.

## Editing Nodes

Open **Vector Tools → Path → Nodes** to edit a path's points directly. Every anchor appears on the selected path: **squares are corners, circles are smooth nodes**, so you can read a path's shape at a glance.

Selected a rectangle or an ellipse instead of a path? The bar offers **Convert to Path** — one click and it becomes curve-editable.

### Selecting nodes

Click a node to select it, <kbd>Shift</kbd>-click to add or remove one, or **drag a box** across the canvas to rubber-band several at once. <kbd>Ctrl</kbd>+<kbd>A</kbd> selects them all; <kbd>Esc</kbd> clears the selection, and pressing it again leaves the mode.

### Editing

| Do this | Get that |
| --- | --- |
| Drag any selected node | moves *every* selected node together |
| **Corner** / **Smooth** | changes the node type across the whole selection |
| **Delete** (or <kbd>Del</kbd>) | removes every selected node |
| <kbd>Alt</kbd>-click a segment | inserts a node at that point |
| Drag a segment between two nodes | bends it into a curve |
| Drag a smooth node's **handle** | bends the curve; the opposite handle mirrors |
| <kbd>Alt</kbd>-drag a handle | breaks the mirror — gives a smooth node a cusp |

:::tip
Turning a rectangle into a curvy blob is: Convert to Path → <kbd>Ctrl</kbd>+ <kbd>A</kbd> → **Smooth**. A path is never reduced below two nodes, so Delete can't leave you with nothing.
:::

A whole multi-node drag is a single undo step. **Nodes** sits alongside *Curvature* (draw a curve through points you click) and *Reshape* (bend a path without touching individual nodes) — three different jobs.

## Fill Mode

The **paint-bucket button in the footer** toggles fill mode (also on the tool options bar as **Fill**). With it on, a freehand stroke (Pencil, Ink Brush, Marker) draws as a **solid filled silhouette** in its own colour instead of a line — the Alchemy-style way of blocking in shapes fast, where you scribble a rough outline and get a filled mass.

The fill appears **as you draw**, not when you let go: the silhouette closes itself across the gap between where you started and where the pointer is now, so you can see the mass you are making and adjust mid-stroke. With symmetry on, every mirrored copy fills live too — the quick route to a symmetrical silhouette or a mandala of solid petals.

The stroke is still drawn on top of the fill, so thin necks and the brush's taper stay readable.

### Changing the colour afterwards

A filled stroke has *two* colours: the **Background** is the filled body, and the **Stroke** is the outline drawn on top. Select the mark and change either one in the Properties panel — they are independent, so you can keep a dark outline around a light fill, or recolour the mass without touching its edge.

:::tip
The fill starts out matching the stroke colour you drew with, because that is what a silhouette should look like the moment it lands. That is only a starting value — it is a normal Background colour from then on, and nothing re-derives it from the stroke. (Before v0.8.191 the Background control was not offered for freehand marks at all, so a filled stroke was stuck on the colour it was drawn in.)
:::

The setting persists across sessions and is saved with the document, alongside the symmetry mode, axis position, spoke count, tilt and the move-axis state — reopen a drawing and it comes back set up the way you left it. Turn fill mode off to go back to normal line strokes; existing marks are unaffected.

## Free Transform

**Rotation-aware resize.** Rotate a shape, then drag any corner or edge handle — it now scales along the shape's *own* axes (not the screen's), and the handle opposite the one you drag stays pinned. Hold <kbd>Shift</kbd> to keep the aspect ratio. This makes adjusting a tilted wordmark or emblem feel natural instead of skewing off-axis.

**Custom rotation point.** By default a shape rotates about its centre. To rotate about a different point, right-click (or long-press on a tablet) and choose *Set Rotation Point Here* — a crosshair (⊕) appears at that spot. Drag the crosshair to fine-tune it, then drag the rotate handle and the shape orbits that point. Right-click → *Reset Rotation Point* returns it to the centre.

:::tip
The rotation point is per-selection and resets automatically when you select something else. It's perfect for swinging a motif around a shared hub — place the point at the hub, then rotate-and-duplicate to build a radial mark by hand.
:::

**Numeric position & size.** The Properties panel's *Dimensions* group has editable **X / Y / W / H** fields (alongside Angle). Type exact values for pixel-perfect placement and sizing — and W/H scale a shape's vector geometry (pen points, path anchors) right along with it, so paths stay crisp.

**Reflect across the rotation point.** With a rotation point set, right-click → *Reflect Across Point →* (or *↓*) mirrors the selection to the other side of it — a precise mirror-about-a-point, distinct from *Flip Horizontal/Vertical* (<kbd>Shift</kbd>+<kbd>H</kbd> / <kbd>Shift</kbd>+<kbd>V</kbd>).

**What Flip mirrors about.** One object flips about *its own centre*, so it turns in place. Flip *several* at once and they mirror about the centre of the whole selection — so the objects swap sides as a group rather than each spinning where it sits. Flip the group again to get back exactly where you started.

:::note
**Vector geometry flips with the shape.** On a pen path or pencil stroke, Flip mirrors the stored anchors and their Bézier handles — so the anchor squares stay on the outline and the path is immediately editable (and exports) in its new orientation. Curved connectors take their control points along too. Nothing needs baking or re-drawing after a flip.
:::

**Envelope distort.** Right-click → *Path → Envelope Distort* to wrap a shape in a 4-corner cage — drag the **orange corner handles** to bend it into a perspective or free-distort quad (great for ribbons, badges, and faux-3D wordmarks). Non-path shapes are converted to an editable path automatically; choose *Remove Envelope Distort* to clear the cage. Works in both render styles and exports to SVG.

**Mesh warp.** For finer control, right-click → *Path → Mesh Warp* and pick a grid (2×2 up to 5×5). Dragging the **interior** control points bulges and waves the middle of the shape — distortions a 4-corner cage can't make (think flowing ribbons, fish-eye badges, organic blobs). Hit-testing and SVG export follow the mesh. Toggle *Mesh: Smooth* for flowing bicubic curves (vs sharp straight cells). **Images** warp too — the bitmap is texture-mapped through the mesh (great for mockups on curved surfaces).

**Remove vs. Apply.** The warp is non-destructive: *Remove Envelope Distort* drops the cage and reverts to the original shape. To keep the distortion instead, use *Apply / Bake Warp* — it commits the warp (a path's outline becomes new anchors; an image rasterizes to a new bitmap) and removes the cage. Warped images also export to SVG now (baked to a bitmap, since SVG can't express a freeform image warp).

**Shear (slant).** Hold <kbd>Ctrl</kbd> (or <kbd>Cmd</kbd>) and drag a **side** handle to slant the shape — drag the top/bottom handle sideways for horizontal shear, the left/right handle up/down for vertical shear. For exact values, type into the **Shear X / Shear Y** fields in the Dimensions panel. Shear renders in both Sketch and Architectural styles and exports to SVG as a true matrix transform — great for italic/oblique wordmarks and isometric-looking marks.

## Hands-on Examples (console)

Paste these into the browser DevTools console (the `Yappy` API) to build a scene, then tweak it on the canvas. Most transform/warp features are also on the right-click menu.

**Numeric transform & reflect across a pivot:**

```
const Y = window.Yappy; Y.clear();
const id = Y.createRectangle(200, 160, 180, 120, { backgroundColor:'#3b82f6', fillStyle:'solid' });
Y.setSelected([id]);
Y.setElementTransform(id, { x: 240, y: 180, width: 220, height: 100 }); // exact position/size
Y.setRotationPivot(240, 240);          // drop a custom rotation pivot (⊕)
Y.flipSelection('horizontal', 240);    // reflect across x = 240 (the pivot)
```

**Shear (slant) for an oblique wordmark:**

```
const r = Y.createRectangle(180, 160, 220, 120,
  { renderStyle:'architectural', backgroundColor:'#f59e0b', fillStyle:'solid' });
Y.updateElement(r, { shearX: 0.4 });   // horizontal slant; shearY slants vertically
// (or: Ctrl/Cmd + drag a side handle on the canvas)
```

**Envelope distort (4-corner) — wrap a shape in a draggable cage:**

```
const p = Y.createPath(
  [{x:0,y:0},{x:200,y:0},{x:200,y:150},{x:0,y:150}],
  { x:200, y:170, closed:true, renderStyle:'architectural', backgroundColor:'#22c55e', fillStyle:'solid' });
Y.setSelected([p]);
Y.toggleEnvelopeWarp();                 // 2×2 cage; corners are centred-local [-w/2..w/2]
const g = structuredClone(Y.getElement(p).warp);  // ⚠ clone — warp is a read-only proxy
g.points[1] = { x: 150, y: -120 };      // pull the top-right corner out
Y.updateElement(p, { warp: g });        // drag the orange corner handles to fine-tune
```

**Mesh warp (3×3) with bicubic smoothing — a flowing bulge:**

```
Y.setSelected([p]);
Y.applyMeshWarp(3, 3);                   // 9 control points
const m = structuredClone(Y.getElement(p).warp);
m.points[4] = { x: 40, y: -40 };         // bulge the CENTRE point (a 4-corner cage can't)
m.smooth = true;                         // Catmull-Rom curves instead of straight cells
Y.updateElement(p, { warp: m });
// Apply / Bake Warp to commit it: Y.bakeWarp([p])  (Remove instead reverts)
```

**Warp an image (texture-mapped) then bake to a bitmap:**

```
const c = document.createElement('canvas'); c.width=c.height=200;
const x=c.getContext('2d');
for (let j=0;j<8;j++) for (let i=0;i<8;i++){ x.fillStyle=(i+j)%2?'#1d4ed8':'#fde68a'; x.fillRect(i*25,j*25,25,25); }
const im = Y.createImage(420, 170, c.toDataURL(), 200, 200, {});
setTimeout(() => {                       // let the image load first
  Y.setSelected([im]); Y.applyMeshWarp(3,3);
  const w = structuredClone(Y.getElement(im).warp);
  w.points[1] = { x:0, y:-70 }; w.points[4] = { x:25, y:15 }; w.smooth = true;
  Y.updateElement(im, { warp: w });
  // Y.bakeWarp([im]);                    // rasterize the distortion into a new bitmap
}, 400);
```

:::tip
**Two gotchas when scripting warps:** (1) clone the warp with ` structuredClone` before editing it — `getElement(...).warp` is a read-only reactive proxy and mutating it in place silently no-ops. (2) For images, wait for the bitmap to load (it’s async) before warping/baking.
:::

## Worked Recipes

| Goal | Steps |
| --- | --- |
| Rotational 2-up mark | Select the element → *Repeat → Radial*, Count 2, Radius 0. |
| Flower / mandala | Select one petal → *Repeat → Radial*, Count 8, Radius ~120, Face center on. |
| Pattern swatch | Select a motif → *Repeat → Grid*, e.g. 4 × 6, Gap 16. |
| Symmetric emblem | Draw the left half → *Mirror Copy →* → select both → Pathfinder Unite. |
| Linear array | Duplicate (<kbd>Ctrl</kbd>+<kbd>D</kbd>) → drag/nudge the copy → <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> a few times. |

## Scripting (API)

Every toolkit move is also on the global `window.Yappy` object — paste these into the browser DevTools console to build marks programmatically (or drive them from a script). All calls act on the current selection unless an id list is passed.

**Repeat & symmetry** — rings, grids, mirrors and step-and-repeat:

```
const Y = window.Yappy; Y.clear();
const petal = Y.createStar(300, 180, 60, 120, 3, { backgroundColor:'#8b5cf6' });
Y.setSelected([petal]);
Y.radialRepeat(8, { radius: 120, faceCenter: true }); // 8 copies in a ring, facing out
Y.gridRepeat(3, 4, { gapX: 16, gapY: 16 });           // tile as rows × cols
Y.mirrorCopy('horizontal');                           // reflect across the right edge
Y.transformAgain();                                   // replay the last move/duplicate
```

**Symmetry guide** — a shared reflection axis to mirror halves onto:

```
Y.toggleSymmetryGuide(true);      // show the axis (optional 2nd arg = position)
Y.setSymmetryAxis('vertical');    // 'vertical' (left↔right) or 'horizontal'
Y.setSelected([petal]);
Y.mirrorAcrossSymmetry();         // drop a reflected copy across the guide
```

**Text → Outlines** and **Shape Builder**:

```
const t = Y.createText(160, 200, 'AB', { fontSize: 96 });
const [outline] = Y.convertTextToOutlines([t]);   // glyphs → editable vector path (counters as holes)
Y.toggleShapeBuilder(true);                       // arm Shape Builder, then drag across regions on canvas
```

:::tip
Warp / envelope / mesh / shear scripting lives in **Hands-on Examples** above (`setElementTransform`, `toggleEnvelopeWarp`, `applyMeshWarp`, ` bakeWarp`). Pathfinder booleans and Offset/Outline Stroke are in the **Vector Paths** doc.
:::
