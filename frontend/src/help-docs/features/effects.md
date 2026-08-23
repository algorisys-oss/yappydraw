---
id: effects
name: Effects & Colour Tools
icon: "✨"
category: Design
description: Convert to Shape, Split Into Grid, Convert to Guides, Feather, Outer Glow, Scribble, Smooth, crop marks & bleed, plus the Colour Guide (tints / harmonies / palette-from-image), swatch groups and the swatch info sheet — with API examples
keywords: effects convert to shape split into grid convert to guides feather outer glow inner glow scribble smooth path crop marks bleed registration colour guide color guide tints shades harmony complementary analogous triadic split complementary tetradic monochromatic palette from image colour theme picker recolor shuffle swatch groups swatch info sheet print
---

# Effects & Colour Tools

A toolbox of Illustrator-style **effects** and **colour helpers**: reshape objects, soften or glow their edges, scribble a fill, drop printer crop marks, build tint/harmony palettes, pull colours from an image, and add print bleed. Most are one click in the Command Palette (<kbd>Ctrl/⌘ + K</kbd>) or the right-click menu, and every one has a `window.Yappy` API.

## Convert to Shape

Replace any selected object with a **rectangle**, **rounded rectangle** or **ellipse** sized to its bounding box — handy to box a label or normalise a messy import. Command Palette → *Convert to Shape: …*

```
const Y = window.Yappy;
Y.convertToShape('ellipse');          // selection → ellipse
Y.convertToShape('rounded', 24);      // rounded rect, 24px corner radius
```

## Split Into Grid & Convert to Guides

**Split Into Grid** turns a rectangle into a tidy *rows × cols* grid of cells — the fast way to start a grid-based logo or layout. **Convert to Guides** then turns selected shapes into ruler guides at their edges (Illustrator’s <kbd>⌘5</kbd>) and removes the shapes, leaving a clean guide scaffold.

**UI:** select a rectangle → Command Palette (<kbd>Ctrl/⌘ + K</kbd>) → *Split Into Grid (4×4)*; then with the cells selected run *Convert Shapes to Guides*.

```
const id = Y.createRectangle(0, 0, 400, 400, { backgroundColor: 'transparent', strokeColor: '#000' });
Y.splitIntoGrid(4, 4, 0, id);         // 16 cells (rows, cols, gap, id)
Y.select(Y.getSelection());           // …select the cells, then:
Y.convertToGuides();                  // drop guides at every cell edge
```

## 3D Extrude

Give any shape or text depth — Illustrator's *Effect ▸ 3D ▸ Extrude & Bevel*, the classic "3D text" look. A **non-destructive** shaded back face + side walls draw behind the shape (their colour derives from the fill), and the flat front stays fully editable. Renders in both **Sketch** and **Architectural** styles.

**Property panel → 3D EXTRUDE**: *+ Add 3D Extrude*, then drag **Depth** (length), **Angle** (direction), **Tilt X/Y** (rotate the shape in 3D), **Bevel** (a lit chamfer on the front edge), and **Shade** (wall darkness). **Expand** bakes the result into editable face elements (front / side / back) — which also makes it SVG-exportable. Or right-click → **Repeat & Mirror ▸ 3D Extrude**.

```
Yappy.setExtrude({ depth: 40, angle: 135, rotX: 25, rotY: -20, shade: 0.4 });
Yappy.expandExtrude();   // bake to editable front/side/back face paths
Yappy.clearExtrude();
```

:::tip
**Blunt edges — the dice look.** The shape's own **corner radius** is part of its outline, so
it carries all the way through the 3D: round a rectangle's corners in the properties panel
(**Corner radius**, or the per-corner fields), then add a 3D Extrude and raise **Bevel**. The
back face, the side walls and the bevel facet all follow the rounded outline, and you get a
block with blunt edges rather than a sharp box. Bevel is a *chamfer* — a flat lit facet — so
a small Bevel on an already-rounded outline reads best; a large one on a sharp rectangle gives
a cut-edge gemstone look instead.

The same is true the other way round: rounding is now honoured by **Pathfinder**, the **Shape
Builder**, the **Knife**, **Distort** and **Live Paint** too, so combining rounded shapes keeps
the curves instead of squaring them off.
:::

:::tip
**3D text:** extrude works on a shape's *outline*, and a text element's outline is its bounding box — so for extruded *letters*, right-click → **Convert to Outlines** first, then apply 3D. (Real shapes — stars, circles, paths — extrude directly.)
:::

:::tip
**Images:** extruding a photo keeps its pixels — the bitmap is painted onto the (foreshortened) front face when you **Tilt** or **Bevel** it, and **Expand** emits a real image element for the front (plus the shaded side/back face paths), so the picture is never flattened to a solid colour.
:::

## Turntable (rotate in 3D)

Spin a flat vector shape around as if it were a 3D object — Adobe's *Project Turntable* idea. Unlike 3D Extrude (which adds depth *behind* the shape), Turntable rotates the artwork *itself* about a vertical or horizontal axis, and at every angle the result stays a **clean, editable path**. It's **non-destructive** and renders in both **Sketch** and **Architectural** styles.

**Property panel → TURNTABLE (3D SPIN)** (shown only for shapes that can become a path): *+ Add Turntable* (a non-path shape is converted to a path first), then drag **Yaw** (spin about the vertical axis), **Pitch** (tilt), and **Persp**. The **Volume** model chooses how depth is faked: *Flat* just foreshortens the sheet (always correct); *Symmetry* gives it a rounded, cylinder-like bulge — the mirror axis is **auto-detected** — so a turned figure or logo reads as solid. With Symmetry you also get a **Depth** slider and a **Reveal back face** toggle that draws the mirrored far side, so a strong turn shows the occluded back (a closed 3D volume). **Bake** commits the current angle into a real editable path (single undo); **Remove** restores the flat shape.

**Group turntable:** select *two or more* shapes and the panel switches to **TURNTABLE — GROUP**. The whole selection spins as one rig about a shared axis (the selection centre), so members *orbit* together (position + shape) rather than each spinning in place. Bake tightens each member's bounds to its new position.

```
Yappy.turntable({ yaw: 35, pitch: 10, depthModel: 'symmetry', depthScale: 0.6, reveal: true });
Yappy.turntable({ yaw: 40 }, [id1, id2, id3]);   // group rig: spin several together
Yappy.bakeTurntable();   // freeze this viewpoint as editable path(s)
Yappy.clearTurntable();
```

**Animate the spin:** click **↻ Spin 360°** in the panel to auto-keyframe a full rotation across the timeline (one click — no manual keyframing). For finer control, **Turntable Yaw** and **Pitch** are also keyframable channels in the animation / dope-sheet panel. Either way it scrubs, plays, and exports to video/HTML like any other keyframed property. `Yappy.spinTurntable360()`.

**AI reconstruction (experimental):** for a true "redraw from this angle" result, set the Yaw/Pitch to the viewpoint you want, then use one of two buttons (single shape; needs an API key set in *AI Settings* — same browser-direct, bring-your-own-key model as every other Yappy AI feature). Both *invent* the newly-visible parts and insert the result as a **new element** beside the original (nothing is overwritten):

- **✨ AI Redraw** — a vision model (Claude / OpenAI / Gemini) redraws the shape as clean editable **vector paths**. Cleaner and cheaper; best on simple/symmetric art. `Yappy.reconstructTurntableAI({ yaw: 40 })`.
- **✨ AI Reimagine** — an OpenAI image model repaints the shape at the new angle (better at inventing hidden detail), then it's **auto-traced** to colour vector paths. More faithful, but messier vectors and OpenAI-only. `Yappy.reconstructTurntableAI({ yaw: 40, mode: 'image' })`.

Results vary run to run; with no key either button just reports and you fall back to the deterministic **Bake**.

:::tip
**Best on symmetric art:** the deterministic rounded look and back-face reveal are inferred from a vertical mirror axis, so characters, bottles, and logos turn most convincingly. The reveal is a mirror of what's already there; the AI reconstruction above is the tier that actually re-imagines hidden detail from the new viewpoint.
:::

## Transform Effect (live copies)

A **non-destructive** effect that draws many accumulating copies of an object — Illustrator’s *Effect ▸ Distort & Transform ▸ Transform*. Each copy applies the same per-step **move / rotate / scale / reflect** one more time, so a small rotation builds a radial fan or rosette, and rotate-plus-shrink-plus-move builds a spiral. The original stays a single editable object — change the base and every copy updates. Renders in both **Sketch** and **Architectural** styles.

Right-click a selection → **Repeat & Mirror ▸ Transform Effect (live)** for presets (Radial Fan, Rosette, Spiral, Echo), then **Expand to Elements** to bake the copies into real, editable objects, or **Remove Effect** to clear it.

```
Y.setTransformEffect({ copies: 11, rotate: 30, originX: 0, originY: 0.5 }); // radial fan
Y.setTransformEffect({ copies: 14, rotate: 22, scaleX: 0.86, scaleY: 0.86, moveX: 8, moveY: -6 }); // spiral
Y.expandTransformEffect();  // bake copies 1..N into real elements
Y.clearTransformEffect();   // remove the effect
```

:::tip
**Pivot:** `originX/originY` are bbox fractions (0–1, default centre 0.5). Set `originX:0` to rotate about the left edge for a fan that opens outward. **Known limits (first cut):** scale is uniform, and *Expand* bakes cleanly for move + rotate + uniform-scale + reflect (non-uniform-scale-with-rotation baking is a follow-up).
:::

## Feather & Outer Glow

**Feather** softly blurs an object’s edges to transparent — great for soft shadows, vignettes or a dreamy halo. **Outer Glow** adds a coloured halo around the object (a shadow with zero offset). Both are non-destructive element properties; set the radius to `0` / pass `enabled:false` to remove.

**How to reach it:** the property panel has a **GLOW & FEATHER** section with live sliders — **Feather** radius, and an **Outer Glow** toggle with **colour** + **radius**. They’re also in the right-click **Effects ✨** menu (presets) and the command palette (⌘/Ctrl-K). Scribble is in the Effects menu / palette too. Or script them:

```
Y.setFeather(8);                          // 8px soft edge on the selection
Y.setGlow({ color: '#00e5ff', blur: 18 }); // cyan outer glow
Y.setGlow({ enabled: false });            // remove the glow
```

:::tip
A canvas has a single shadow slot, so an object shows *either* a drop shadow *or* an outer glow — the drop shadow wins if both are set.
:::

## Scribble

Turn a fill into a hand-drawn **scribble** of back-and-forth strokes in the fill colour — instant sketch energy. Control the line *spacing*, *angle* and stroke width.

```
Y.scribble({ spacing: 8, angle: 0, strokeWidth: 2 });
```

Right-click a path → **Smooth** also relaxes janky curves (Laplacian smoothing, keeping the anchor count) — the counterpart to **Simplify**, which reduces points.

```
Y.smoothPath(undefined, 0.5, 2);   // strength 0..1, iterations
```

## Crop marks & print bleed

Toggle **crop marks** on an object to draw printer registration marks at its corners. For documents, set a **bleed** margin (Settings → Print Bleed) — a dashed bleed boundary plus crop marks are drawn around every artboard so artwork can run off the trim edge.

```
Y.toggleObjectCropMarks(true);   // crop marks on the selection
Y.setBleed(20);                  // 20px bleed + artboard crop marks
```

## Colour Guide — tints, harmonies & palette-from-image

Build palettes the way a designer does. **Tints** gives a light→dark ramp around a base colour; **harmonies** derive complementary / analogous / triadic / split-complementary / tetradic / monochromatic sets. The **colour theme picker** extracts the dominant colours from any image, and you can recolour the selection onto any palette.

```
Y.generateTints('#3366cc');                       // [light … #3366cc … dark]
Y.generateHarmony('#ff0000', 'triadic');          // 3 evenly-spaced hues
Y.applyHarmonyToSelection('#ff0000', 'complementary');
const pal = await Y.extractImagePalette(imageId, 6); // dominant colours
Y.applyPaletteToSelection(pal);                   // recolour onto them
Y.shuffleSelectionColors();                       // randomise the order
```

## Swatch groups & swatch info sheet

Organise global swatches into named **groups**, and generate a labelled **swatch info sheet** (colour chip + name + hex + RGB) for brand guidelines. **UI:** open the **Swatches** panel (<kbd>Alt + W</kbd>, or View → Swatches) to add, group and apply swatches; the info sheet drops onto the canvas.

```
Y.createSwatch('#112233', 'navy', 'Brand');   // colour, name, group
Y.createSwatchGroupFromSelection('Palette');  // selection colours → group
Y.createSwatchInfoSheet({ columns: 4 });      // labelled chips on the canvas
```

## See also

Stroke gradients, the Appearance editor, Recolor Artwork and tracing live under **Masks, Appearance & Trace**. Pucker/Bloat, Twirl, Roughen, ZigZag and the other distort effects live under **Illustrator-class Tools**.
