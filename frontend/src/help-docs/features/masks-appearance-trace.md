---
id: masks-appearance-trace
name: Masks, Appearance & Trace
icon: "✂"
category: Design
description: Clipping/opacity masks, appearance stack, gradient mesh, graphic styles, eyedropper, and image trace
---

# Masks, Appearance & Image Trace

Three Illustrator-class tools: **clipping masks** (show artwork through a shape), the **appearance stack** (extra fills/strokes on one object), and **image trace** (turn a bitmap into editable vectors).

## Clipping Masks

A clipping mask uses the **top** shape as a “window”: only the parts of the object(s) underneath that fall *inside* that shape’s outline stay visible — everything outside is hidden. The mask shape stops drawing its own fill and instead just defines the visible region. It’s fully **non-destructive**: nothing is deleted, so you can *Release* it any time to get the original objects back.

### How to use it

| Step | Action |
| --- | --- |
| 1 | Place your content (image / shape / group), then draw the mask shape **on top** of it. |
| 2 | Select **both** (marquee-drag, or click one and <kbd>Shift</kbd>-click the other). The status bar shows “2 selected”. |
| 3 | Right-click → **Make Clipping Mask** (<kbd>Ctrl</kbd>+<kbd>7</kbd>). The topmost object becomes the mask. |
| 4 | To undo it: select the result → right-click → **Release Clipping Mask** (<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>7</kbd>). |

:::tip
The menu item only appears when **2 or more objects are selected**. The mask and its content are **grouped**, so they move together as one unit. Drag the photo *behind* the mask anytime to re-frame it — like a live, adjustable crop.
:::

### Opacity masks (soft fades)

A **clipping mask** is a hard cut — inside the shape or out. An **opacity mask** is soft: the *brightness* of the mask becomes the content’s transparency — **white = fully visible, black = invisible, grays = partial**. Put a **white→black gradient** on top and choose right-click → **Make Opacity Mask** to fade artwork out, feather an edge, or blend two images.

```
const Y = window.Yappy; Y.clear();
const art  = Y.createRectangle(150, 160, 300, 180, { backgroundColor:'#2563eb', fillStyle:'solid' });
const fade = Y.createRectangle(150, 160, 300, 180,   // white→black gradient = the mask
  { fillStyle:'linear', gradientType:'linear', gradientStart:'#fff', gradientEnd:'#000', gradientAngle:0 });
Y.setSelected([art, fade]);
Y.makeOpacityMask();                 // → the blue fades from solid (left) to clear (right)
```

### Clipping mask vs. eraser / crop

|  | Clipping mask | Eraser / crop |
| --- | --- | --- |
| Reversible | ✅ fully (Release) | ❌ destructive |
| Re-editable | ✅ move/resize mask & content independently | ❌ |
| Works on | shapes, images, groups, traced paths, warped art | raster-focused |

### What it’s for

- **Photo in a shape** — avatars (photo in a circle), hexagon photo grids, pictures inside device mockups.
- **Image-filled text / logos** — place a texture or photo under big text-outlines and clip → letters painted with that image (chrome / watercolor type).
- **Frame to an edge** — draw freely past your card/poster boundary, then clip everything to a rectangle so nothing spills — without erasing the overflow.
- **Reveal / spotlight effects** — show just a slice of a busy illustration through a shape.
- **Adjustable crops** — because it’s live, reframe or resize anytime.

### Examples

Run these in the browser console (the `Yappy` API). Each builds a small scene you can then tweak on the canvas.

**1 — Blue rectangle clipped to a star (the basic idea):**

```
const Y = window.Yappy; Y.clear();
const rect = Y.createRectangle(150, 150, 260, 200,
  { backgroundColor: '#1d4ed8', fillStyle: 'solid' });
const star = Y.createStar(180, 160, 200, 200, 5,
  { backgroundColor: '#000' });   // top object = the mask
Y.setSelected([rect, star]);
Y.makeClippingMask();              // → a blue star (rect shows only through the star)
// later, to undo it non-destructively (right-click → Release, or Ctrl+Alt+7):
Y.setSelected([star]); Y.releaseClippingMask();   // both original objects come back
```

**2 — Circular avatar (photo clipped to a circle):**

```
const Y = window.Yappy; Y.clear();
// (use any image data URL; here a quick gradient stands in for a photo)
const c = document.createElement('canvas'); c.width = c.height = 240;
const g = c.getContext('2d');
const grad = g.createLinearGradient(0,0,240,240);
grad.addColorStop(0,'#f59e0b'); grad.addColorStop(1,'#db2777');
g.fillStyle = grad; g.fillRect(0,0,240,240);
const photo = Y.createImage(160, 140, c.toDataURL(), 240, 240, {});
const circle = Y.createCircle(180, 160, 200, 200, { backgroundColor:'#000' });
Y.setSelected([photo, circle]);
Y.makeClippingMask();              // → the photo inside a circle; drag to re-frame
```

**3 — Confine artwork to a frame:**

```
const Y = window.Yappy; Y.clear();
// a few shapes that overflow a frame
const a = Y.createCircle(80, 120, 160, 160, { backgroundColor:'#22c55e', fillStyle:'solid' });
const b = Y.createCircle(260, 220, 160, 160, { backgroundColor:'#3b82f6', fillStyle:'solid' });
const frame = Y.createRectangle(120, 140, 220, 160, { backgroundColor:'#000' }); // top = mask
Y.setSelected([a, b, frame]);
Y.makeClippingMask();              // → only what's inside the rectangle shows
```

:::tip
**Pro combo:** clip a *warped* image, art that has an *appearance stack*, or the output of *Image Trace* — masks compose with everything else.
:::

## Appearance Stack

Give one object **multiple fills and strokes**, drawn over its base shape from bottom to top. Great for outline / neon / double-border effects and translucent overlays — on a single object, no duplicating. Works in both **Sketch** and **Architectural** styles.

Right-click → **Appearance** → *Add Fill* / *Add Stroke* / *Clear Appearance*. For exact control use the API.

### Examples

**Neon double-stroke (architectural):**

```
const Y = window.Yappy; Y.clear();
const r = Y.createRectangle(140, 150, 220, 150,
  { renderStyle:'architectural', backgroundColor:'#0f172a', fillStyle:'solid' });
Y.setAppearance({
  strokes: [ { color:'#22d3ee', width:14, opacity:0.9 },   // wide glow
             { color:'#a5f3fc', width:5 } ],               // bright core
  fills:   [ { color:'#22d3ee', opacity:0.12 } ]           // faint inner tint
}, [r]);
```

**Dashed accent over a sketch shape:**

```
const id = Y.createCircle(420, 150, 180, 140,
  { renderStyle:'sketch', backgroundColor:'#fef9c3', strokeColor:'#854d0e', fillStyle:'solid' });
Y.setSelected([id]);
Y.addAppearanceStroke({ color:'#dc2626', width:8, dash:'dashed' });
Y.addAppearanceFill({ color:'#16a34a', opacity:0.25 });
```

:::tip
Each fill/stroke takes `color`, `opacity` (0–1) and, for strokes, `width` and `dash` (`solid`/`dashed`/`dotted`). `Y.clearAppearance()` removes the stack; the base fill/stroke always remain.
:::

### Pattern fills in the stack

A stacked fill can be a **pattern**, not just a solid colour. In the **APPEARANCE** section of the Properties panel, each fill row has a type dropdown: pick a built-in motif (Stripes, Grid, Dots, Checker, Crosshatch) or a saved **★ library pattern** to paint that fill with a clipped, tiling pattern. Layer a pattern over a base gradient, or stack two patterns, for richer textures — on a single object. The fill's colour doubles as the pattern's foreground. Pattern stack-fills render on canvas in both styles and export to SVG as real tiling `<pattern>`s in Architectural style (Sketch SVG approximates them with the foreground colour).

### Graphic Styles

Save an object's whole look — fill, stroke, gradient/mesh, appearance stack, shadow, opacity — as a named **graphic style**, then apply it to other objects in one click. Open the panel with **Alt+G** (or View → **Graphic Styles**): the **+** saves the selection's style; click a card (or its 🎨) to apply it to the current selection; ↻ redefines it from the selection; 🗑 deletes it. Styles are stored in the document, so they travel with the file. (Right-click → **Save as Graphic Style**; API `createGraphicStyle`/`applyGraphicStyle`.)

### Global swatches

A document **colour palette** with live links. Open it with **Alt+W** (or View → **Swatches**): **+** adds a swatch (from the selection's fill); click a chip to fill the selection and make it the active drawing colour — both the fill and the brush/stroke colour, so the next shape or pen stroke uses it (the little corner dot recolours the swatch itself); the **S** button applies it as a stroke. Objects you apply a swatch to are **linked** — recolour the swatch and every linked object updates at once. Editing an object's colour directly breaks its link. Swatches are saved in the document.

### Recolor Artwork

Select several objects, then right-click → **Recolor Artwork…**. The panel shows the **palette** actually used by the selection (each colour with its usage count). Click a swatch to **remap** that colour everywhere in the selection at once — great for trying palette variants. The **Adjust all** controls shift the whole palette's **hue / lightness / saturation** together. Every step is undoable.

### Eyedropper

Select the object(s) you want to restyle, press <kbd>Shift</kbd>+<kbd>I</kbd> (or right-click → **Eyedropper — pick style from…**) and click any other object: its full look (fill, stroke, gradient/mesh, appearance, shadow) is copied onto your selection. **Esc** cancels, and <kbd>Shift</kbd>+<kbd>I</kbd> again toggles it off. It's a quick one-shot copy — for a look you'll reuse repeatedly, save a **graphic style** instead.

:::note
Illustrator puts the eyedropper on plain <kbd>I</kbd>; here that key already inserts an image, so it joins the <kbd>Shift</kbd>+letter block with the other Illustrator-class tools (Shape Builder <kbd>Shift</kbd>+<kbd>M</kbd>, Width <kbd>Shift</kbd>+<kbd>W</kbd>, Blob Brush <kbd>Shift</kbd>+<kbd>B</kbd>).
:::

### Picking a single colour

To copy just a *colour* rather than a whole style, open any colour control's **Custom Color** picker and click the **pipette**. Then click anywhere on the canvas: the colour lands in whichever control you opened the picker from (Stroke, Background, Text). Hold <kbd>Alt</kbd> as you click to take the shape's **outline** colour instead of its fill.

The pick is **exact**. It reads the colour the shape is actually set to, rather than measuring the pixel on your screen, so what you get back is identical to the source — no drift. That holds even when the drawing doesn't look flat: a shape filled with a sketch **hachure** pattern is mostly white gaps up close, and you still get its fill colour, not the gap.

Where there is no single set colour, it reads the **rendered pixel you clicked** instead — photos, pattern and mesh fills, bare canvas, and **gradients**. A gradient is a different colour at every point, so the point you aimed at is the answer: click the pale end of a gradient and you get that pale shade, click the deep end and you get the deep one. (Up to v0.8.191 every click on a gradient returned its first stop, which is why picking off a gradient seemed to hand back a slightly different, duller shade.)

:::tip
**Picking from outside the app.** The second button next to the pipette (a small monitor, on Chrome and Edge) samples anywhere on your screen — another window, a reference photo, a browser tab. That one goes through the browser and reads the screen, so on a wide-gamut (P3) display the value can come back slightly off. Use the pipette for anything already on your canvas; use the monitor button only when the colour you want isn't.
:::

## Gradient Mesh

Fill a shape with a smooth multi-colour **mesh** — a grid of coloured nodes that blend bilinearly across the shape. Unlike a linear/radial gradient (one axis), a mesh lets colour vary in **both** directions, so you can model soft shading, sheens and multi-point colour blends. The fill is clipped to the shape outline and renders identically in both **Sketch** and **Architectural** styles.

### How to use it

Select a shape and set **Fill → Gradient Mesh** in the Properties panel (or right-click → **Appearance** → *Gradient Mesh Fill*). A **GRADIENT MESH** editor appears: bump the *Rows*/*Cols* steppers to add nodes, then click any swatch to recolour that node. *Remove mesh* reverts to a solid fill.

For direct editing, click **Edit on canvas** (in the mesh editor) — the node grid appears right on the shape as colour dots. **Drag** a dot to reshape the mesh (warp the colour flow); **click** a dot (without dragging) to recolour it. Boundary nodes slide along the edge and interior nodes move freely, so the fill always covers the shape. *Reset nodes* returns the grid to even spacing; double-click the background to exit. (`Yappy.toggleMeshEdit()`, `setMeshNodePosition(r,c,x,y)`.)

### Example

```
const Y = window.Yappy; Y.clear();
const id = Y.createCircle(180, 150, 300, 230, { backgroundColor:'#8b5cf6', fillStyle:'solid' });
Y.applyMeshGradient(3, 3, [id]);              // 3×3 node grid, seeded from the fill colour
// recolour the four corners + a bright centre
Y.setMeshNodeColor(0,0,'#ef4444',[id]); Y.setMeshNodeColor(0,2,'#f59e0b',[id]);
Y.setMeshNodeColor(2,0,'#3b82f6',[id]); Y.setMeshNodeColor(2,2,'#10b981',[id]);
Y.setMeshNodeColor(1,1,'#ffffff',[id]);
Y.setMeshSize(4, 4, [id]);                    // grow the grid (colours preserved)
```

:::tip
Nodes are laid out on an even grid over the shape's bounding box (positions are derived, so only colours are stored — they survive save/load). `applyMeshGradient(rows, cols)`, ` setMeshSize(rows, cols)`, `setMeshNodeColor(row, col, color)` and ` clearMeshGradient()` all default to the current selection.
:::

## Pattern Fills

Fill a shape with a **seamless repeating motif** — stripes, grid, dots, checker, crosshatch, or the two procedural textures **noise** and **grunge** — painted in a foreground colour over an optional background. The pattern tiles in place and is clipped to the shape outline, rendering identically in both **Sketch** and **Architectural** styles. SVG export emits a real `<pattern>` so it stays vector.

### How to use it

Select a shape and set **Fill → Pattern** in the Properties panel. A **PATTERN** editor appears: pick the *Motif*, set the foreground *Color* and tile *Back*ground (or *None* for transparent), and tune *Scale*, *Spacing*, *Thick*ness and *Angle*. *Remove pattern* reverts to a solid fill.

### Example

```
const Y = window.Yappy; Y.clear();
const id = Y.createRectangle(160, 140, 280, 200, { strokeColor:'#222', backgroundColor:'#fff' });
Y.applyPatternFill('crosshatch', [id]);   // stripes | grid | dots | checker | crosshatch | noise | grunge
Y.setPatternFill({ color:'#1d4ed8', scale:1.4, angle:30 }, [id]);
```

:::tip
`applyPatternFill(type)`, `setPatternFill({ type, color, background, scale, spacing, strokeWidth, angle, seed })` and `clearPatternFill()` all default to the current selection. Patterns are stored on the element (`patternFill`) and survive save/load.
:::

### Texture overlays (noise & grunge)

Large flat colour areas can read as flat and lifeless. The two procedural texture motifs break them up: **Noise** is fine film grain, **Grunge** is softer, blotchier fBm noise. They ignore *Spacing* and read *Thick*ness as the **grain size**; *Scale* zooms the whole tile. Each texture is seeded once when you create it, so the grain is identical on every redraw, reload and export — never a shimmer between frames.

For the usual "lay a texture over the whole picture" move, use **Vector Tools → Insert → Noise Texture** (or **Grunge Texture**). That drops a rectangle over the entire composition — the active artboard, else the page, else the bounding box of your artwork — already set to **Multiply** blend at **14% opacity**, which is roughly where texture stops looking like an object and starts looking like paper. Tune *Opacity* and *Blend Mode* in Properties; delete the rectangle to remove it.

```
const Y = window.Yappy;
Y.addTextureOverlay('noise');                       // full-bleed grain, multiply @ 14%
Y.addTextureOverlay('grunge', { opacity: 22, color: '#3b2a1f', scale: 1.6 });

// or texture one shape only:
const id = Y.createRectangle(0, 0, 400, 300, { backgroundColor:'#c8663c', fillStyle:'solid' });
Y.applyPatternFill('grunge', [id]);
Y.setPatternFill({ strokeWidth: 3, seed: 42 }, [id]);   // grain size + a different grain
```

:::tip
Because the texture is a normal shape, everything else still applies: clip it with a mask, put it inside a group, animate its opacity, or stack noise over grunge for a rougher paper feel.
:::

### Make Pattern from Selection

Turn your own artwork into a repeating tile: select one or more objects, then right-click → **Make Pattern from Selection**. The selection is captured into a tile and a new rectangle appears beside it, filled with that *custom* pattern so the repeat is visible. Tune *Scale* and *Angle* in the PATTERN editor; the tile thumbnail shows the source.

```
const Y = window.Yappy; Y.clear();
const a = Y.createCircle(60, 60, 70, 70, { backgroundColor:'#2563eb', fillStyle:'solid' });
const b = Y.createRectangle(95, 95, 70, 70, { backgroundColor:'#ef4444', fillStyle:'solid' });
Y.setSelected([a, b]);
Y.createPatternFromSelection([a, b]);   // → a new rectangle tiled with the circle+square motif
```

### Patterns library (reusable swatches)

Build a palette of patterns once and reuse them across the document. Open the **Patterns** panel (menu → Patterns, or <kbd>Alt</kbd>+ <kbd>P</kbd>):

| Action | How |
| --- | --- |
| **Capture artwork** | Select shapes → click the **＋** in the panel header → the selection becomes a reusable pattern tile. |
| **Save a built-in pattern** | Give a shape a Pattern fill, tune it, then click **Save to Library** in the PATTERN editor. |
| **Apply** | Select one or more shapes, then click a swatch (or its apply button) to fill them with that pattern. |
| **Redefine** | Select a shape whose pattern you like, then click a swatch's **refresh** button to overwrite it. |
| **Rename / Delete** | Double-click a swatch name to rename; the trash button removes it. |

:::tip
Pattern swatches are stored with the document (they save/load and undo/redo). API: ` addPatternSwatchFromSelection(name?)`, `savePatternSwatchFromElement(name?)`, ` applyPatternSwatch(id)`, `updatePatternSwatch(id)`, ` renamePatternSwatch(id, name)`, `deletePatternSwatch(id)`, ` listPatternSwatches()`.
:::

**Live link:** applying a swatch *links* the shape to it. **Redefine** a swatch (select a shape with the look you want → the swatch's refresh button) and *every* linked shape updates at once. Editing a shape's pattern directly in the PATTERN editor breaks its link (so your tweak isn't overwritten next time the swatch changes); deleting a swatch leaves linked shapes with their current pattern.

## Image Trace

Turn a bitmap (logo, silhouette, line art, scanned sketch) into an **editable vector path** you can recolor, reshape, boolean, or warp. Yappy thresholds the image and traces its contours; **holes** (like the middle of an “O” or a donut) come out as real holes via the even-odd fill rule.

Right-click an image → **Image Trace**. **B&W** traces a single silhouette path (with holes); **Colour — 6 / 12 / 16** quantizes the image into that many colours and traces *one filled path per colour* (stacked, grouped). **Centre-line** is for line art — it finds the *skeleton* (centre) of strokes and emits thin *open* paths instead of filled outlines (ideal for hand-drawn lines, signatures, maps). The new paths are placed over the image; **delete the image** to keep just the vectors.

### Example

```
const Y = window.Yappy; Y.clear();
// make a black ring (donut) bitmap so the trace has a hole
const c = document.createElement('canvas'); c.width = c.height = 200;
const x = c.getContext('2d');
x.fillStyle = '#fff'; x.fillRect(0,0,200,200);
x.fillStyle = '#000'; x.beginPath(); x.arc(100,100,80,0,7); x.fill();
x.fillStyle = '#fff'; x.beginPath(); x.arc(100,100,40,0,7); x.fill();
const img = Y.createImage(160, 140, c.toDataURL(), 200, 200, {});
setTimeout(() => {                 // let the image load first
  const [path] = Y.traceImage();   // → a vector path with a hole
  Y.updateElement(path, { backgroundColor: '#dc2626' }); // recolor to see it
}, 400);
```

| Option | Effect |
| --- | --- |
| `threshold` (0–255, default 128) | Lower = trace lighter areas too; higher = only the darkest. Adjust for contrast. |
| `simplify` (default 1.0) | Lower (e.g. 0.4) = more anchors / higher fidelity; higher = smoother, fewer points. |

:::tip
Best on high-contrast art (logos, silhouettes, B&W line work). For photos, threshold-trace gives a stylized silhouette. After tracing, edit the path with the node tools, run Pathfinder booleans, apply an appearance stack, or clip it as a mask.
:::
