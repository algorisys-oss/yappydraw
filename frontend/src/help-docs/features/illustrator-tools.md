---
id: illustrator-tools
name: Illustrator-class Tools
icon: "🪄"
category: Design
description: Combine shapes (Unite/Subtract/Intersect/Exclude), Shape Builder, Magic Wand, Liquify, Knife & Scissors, generative shapes, and the Symbol Sprayer — with API examples
keywords: unite union subtract minus front intersect exclude boolean combine merge shapes pathfinder compound shape non-destructive keep editable contextual toolbar pathfinder strip show hide pathfinder strip turn off pathfinder toolbar in the way obstructing floating panel appears on selection pin open lens flare spiral arc rectangular grid polar grid magic wand select similar distort transform pucker bloat twirl zigzag crystallize roughen liquify knife scissors curvature reshape blob brush path eraser puppet warp perspective grid vanishing point horizon 1-point 2-point 3-point soft snap to perspective lines snap tolerance snap strength grid density touch type vertical type slice graph chart symbolism sprayer width tool width profile width profiles stroke profile variable width uniform bulge waist taper out taper in chisel oval leaf calligraphic nib brush stroke expressive line setWidthProfile widthProfiles live paint shape builder pathfinder offset stroke outline type on path warp preset make with warp arc arch flag wave rise bulge bend slider how much it bends curve amount bend text arc text properties panel bake warp remove warp vector tools palette google fonts font picker add font custom font ttf otf woff letter spacing preview applied
---

# Illustrator-class Tools

A toolkit of vector-illustration tools mapped from Adobe Illustrator: select-similar (Magic Wand), the Distort & Transform / Liquify family, Knife & Scissors cutting, generative shapes (spiral, arc, grids), Vertical Type, and the Symbol Sprayer. Every tool has a right-click / panel entry *and* a scripting API on the global ` Yappy` object — paste the examples into the browser console to try them.

:::tip
**Where are these tools?** Open the **Vector Tools palette** — click the **shapes button** in the **top bar** (next to the <kbd>⌘</kbd> Commands button, left of Settings) for a one-tap floating palette grouped by Build / Path / Paint / Warp / Symbol; the active tool highlights. **Shape Builder** sits right beside it. On a phone the same three are under *Menu → View*. Everything is also in the **Command Palette** (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>K</kbd> → type a name). The right-click menu works too, but only when you click directly on a filled shape — so for unfilled outlines (common with Live Paint) use the palette.
:::

## ⬤ Combining shapes — Unite, Subtract, Intersect, Exclude

Building a logo or icon is mostly *combining* shapes, so these can live where your hands already are rather than behind a menu. Turn on the **Pathfinder strip** and a small toolbar appears **right above the selection** whenever two or more shapes are selected:

| Operation | Shortcut | What it does |
| --- | --- | --- |
| **Unite** | <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>U</kbd> | Merge everything into one shape |
| **Subtract** | <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>D</kbd> | Minus front — cut the top shape out of the one below |
| **Intersect** | <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>I</kbd> | Keep only the overlap |
| **Exclude** | <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>X</kbd> | Keep everything *except* the overlap |

Inkscape users: the familiar <kbd>Ctrl</kbd>+<kbd>+</kbd>/<kbd>−</kbd>/<kbd>*</kbd>/<kbd>^</kbd> can’t be used here — the browser reserves those for page zoom — so the same four operations are on <kbd>Ctrl</kbd>+<kbd>Alt</kbd> instead.

### ❖ Keep editable — non-destructive combining (the default)

Combining is **non-destructive by default**. The result is a **compound shape**: a real shape you can move and style, that also remembers the shapes it was made from. So you can change the operation later (Subtract → Intersect), *release* it back into the original shapes when you want one of them again, or *expand* it to a plain path — instead of undoing back through your work.

The **❖** toggle at the end of the strip turns that off if you want the old flattening behaviour, and your choice is remembered between sessions. Fully destructive Pathfinder is also always there on right-click → *Pathfinder*. Illustrator hides the non-destructive version behind Alt-clicking a Pathfinder button, which nobody discovers; here it’s simply what happens.

Right-click → *Pathfinder* still has the region operations — **Divide, Trim, Merge, Crop, Outline** — which are occasional, deliberate choices rather than inner-loop ones. They’re also on the strip’s second row.

### Turning the strip on and off

The strip is **off by default**, because selecting two objects is something you do constantly — to move them, align them, group them, recolour them, or because a rubber-band grabbed one more than you meant. Popping a floating panel of destructive operations over your artwork every time you did that was more often in the way than useful.

Switch it on with the **Pathfinder** button in the top bar (next to Shape Builder), *View → Pathfinder Strip*, right-click → *Show Pathfinder Strip*, or the Command Palette (<kbd>Ctrl</kbd>+<kbd>K</kbd> → “Pathfinder Strip”). It stays pinned across selections and across sessions, so if you’re doing a run of boolean work you turn it on once. Also in *Settings → Canvas → Pathfinder Strip*.

:::tip
**The four shortcuts work whether or not the strip is showing.** <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>U</kbd>/<kbd>D</kbd>/<kbd>I</kbd>/<kbd>X</kbd> act on the current selection with no panel at all — which is the point of having them — and right-click → *Pathfinder* has every operation either way.
:::

### ⬣ Shape Builder — combine by hand

For anything beyond a single operation, **Shape Builder** (<kbd>Shift</kbd>+<kbd>M</kbd>, or the icon in the main toolbar) is usually faster than picking operations one at a time: select your shapes, then **drag across regions to merge them**, or <kbd>Alt</kbd>+drag across a region to delete it. It’s the quickest way to carve a finished silhouette out of a pile of overlapping circles and rectangles.

A **badge follows the cursor** so you always know which one you are about to do: a blue **+** for merge, a red **−** for delete. It updates the moment you press or release <kbd>Alt</kbd> — before you start the stroke, not after — and the region highlight and the drag line take the same colour.

**<kbd>Shift</kbd>+drag draws a box** instead of a stroke, and takes every region the box touches — quicker than threading a line through a dozen small pieces. <kbd>Shift</kbd>+<kbd>Alt</kbd>+drag does the same in delete mode. The box also catches a region *larger* than itself, so you can rubber-band a small detail sitting inside a big background shape. Whether it is a box or a stroke is decided when you press: letting go of <kbd>Shift</kbd> mid-drag won't switch you.

```
                    // the same operations from the API
Yappy.pathfinder([idA, idB], 'union');        // 'subtract' | 'intersect' | 'exclude'
Yappy.pathfinderRegion([idA, idB], 'divide'); // 'trim' | 'merge' | 'crop' | 'outline'

// non-destructive: sources survive, operation can change later
Yappy.makeCompound([idA, idB], 'subtract');
Yappy.setCompoundOp(id, 'intersect');
Yappy.releaseCompound(id);
```

## 📱 On a tablet (iPad / touch)

All of these tools are built on pointer events, so they work with a finger or stylus. A few touch-specific notes:

- **Open the toolset** with the **⌘ Command** button in the toolbar (top-left). The right-click menu and <kbd>Ctrl</kbd>+<kbd>K</kbd> aren't available without a mouse/keyboard, so this button is your gateway to every tool — tap it, then tap the tool you want.
- **Shape Builder** has an on-screen **Merge / Delete** toggle (no <kbd>Alt</kbd> key needed) — tap it to switch modes, then drag across regions. Tap **Done** to exit.
- **Every tool overlay** (Knife, Width, Live Paint, Sprayer…) has a **Done** button or exits when you tap another tool — you're never stuck.
- While a tool is active it captures the canvas, so pinch-zoom/pan pauses; tap **Done** or another tool to get gestures back.

## 🪄 Magic Wand — Select Similar

Select one object, then right-click → **Select Similar (Magic Wand)** to grab every other object that shares its **fill colour**. Great for recolouring or restyling all the “same” pieces of a drawing at once. Locked objects and objects on hidden layers are skipped.

```
// select everything that shares the first selected object's fill
Yappy.selectSimilar();

// match by stroke colour instead, from a specific object
Yappy.selectSimilar('rect-3', 'stroke');

// match BOTH fill and stroke
Yappy.selectSimilar(undefined, 'both');
```

:::tip
Combine it with **Recolor Artwork** (right-click → Recolor Artwork…): Magic Wand to grab all the blue shapes, then shift their hue together.
:::

## 🔒 Locking objects — and getting them back

Select something and press <kbd>Ctrl+Shift+L</kbd> (or right-click → **Lock**) to pin it in place. A locked object still draws, but the canvas stops seeing it: you can't click it, drag it, resize it, or catch it in a marquee. That's the point — it's how you stop a background photo or a finished layout element from getting nudged while you work on top of it.

Which raises the obvious question: if you can't select it, how do you unlock it? Three ways:

| Way in | How | When |
| --- | --- | --- |
| **Right-click the object** | Right-click straight on it → *Unlock “…”* | You can see it and want just that one. The right-click menu works from the point under your cursor rather than from the selection, so it can reach a locked object even though nothing can select one. Several locked objects stacked up? They're listed individually, topmost first. |
| **Unlock All** | <kbd>Ctrl+Alt+2</kbd>, or right-click → *Unlock All (n)* | You've lost track of what's locked, or it's scrolled off-screen. The count in the menu tells you how many are out there. |
| **Layer lock** | The padlock in the Layers panel (<kbd>Alt+L</kbd>) | Locking a whole *layer* is separate from locking individual objects, and is undone from the same padlock you locked it with. |

Unlocking always **selects** what it freed, so you can get straight on with whatever you unlocked it for.

```
Yappy.setLocked([bgId], true);   // pin a background out of the way
Yappy.getLocked();               // → ['img-2']  (ids of everything locked)
Yappy.unlockAll();               // → 1          (frees them and selects them)
```

:::tip
**Note:** <kbd>Ctrl+Shift+L</kbd> toggles lock on the *selection*, so it can lock but never unlock — a locked object isn't in any selection. Use <kbd>Ctrl+Alt+2</kbd> or the right-click menu instead.
:::

## 〰️ Distort & Transform (Liquify)

Select one or more shapes, then right-click → **Distort & Transform** and pick an effect. Each one replaces the shape with a distorted, editable **path**, so you can keep stacking effects or node-edit the result. These cover Illustrator's Effect → Distort & Transform menu and the intent of the Liquify brushes as predictable, one-click filters.

| Effect | What it does | Good for |
| --- | --- | --- |
| **Pucker** | Pulls edge midpoints inward (spiky star). | Stars, sparkles, sea-urchins. |
| **Bloat** | Pushes edge midpoints outward (balloon). | Blobs, petals, puffy badges. |
| **Twirl** | Rotates points around the centre, stronger near it. | Swirls, spiral motifs. |
| **Zig-Zag** | Ridges the outline in/out (a.k.a. Scallop). | Stamps, tickets, gears. |
| **Crystallize** | Pushes alternating points outward into spikes. | Bursts, shattered looks. |
| **Roughen** | Randomly jitters the outline (a.k.a. Wrinkle). | Hand-torn paper, grunge. |

```
// turn a circle into a spiky star
const c = Yappy.createCircle(200, 200, 160, 160, { backgroundColor: '#f59e0b' });
Yappy.setSelected([c]);
Yappy.distort('pucker', 0.4);

// a puffy badge from a rectangle
const r = Yappy.createRectangle(120, 120, 160, 120, { backgroundColor: '#10b981' });
Yappy.setSelected([r]);
Yappy.distort('bloat', 0.3);

// amount is 0..1 relative to the shape's size
Yappy.distort('zigzag', 0.12);   // subtle ridges
Yappy.distort('roughen', 0.08);  // light grunge
```

:::tip
Effects are *deterministic* — the same shape + amount always gives the same result, so they're safe to script and reproduce. Distort is destructive (it bakes a new path); duplicate first (<kbd>Ctrl</kbd>+<kbd>D</kbd>) if you want to keep the original.
:::

## 〜 Warp Presets — Make with Warp

Bend a shape or text along a named envelope — Illustrator's *Object → Envelope Distort → Make with Warp*. Select an object, right-click → **Path → Warp Preset**, and pick a style. That first click applies a **50% bend**; how much it bends is then yours to set, live, from the Properties panel (below). Renders in both **Sketch** and **Architectural** styles.

### Controlling how much it bends

With the warped object selected, open the **Properties** panel (<kbd>Alt</kbd>+<kbd>Enter</kbd>, the sliders button in the top bar, or *Menu → Panels → Properties Panel*) — it grows a **WARP PRESET** section. This is where the bend lives; the right-click menu only starts the warp. Everything stays editable from here for as long as you haven't baked it:

| Control | What it does |
| --- | --- |
| **Style** | Switch between Arc / Arch / Flag / Wave / Rise / Bulge *after* the fact — the object re-warps from its original outline, so swapping styles never compounds. |
| **Bend** | Drag from **−100%** to **+100%**. The shape re-warps as you drag. **0%** is flat (undeformed); **negative** bends the other way — a Wave inverts its humps, an Arc becomes a frown instead of a rainbow. |
| **Bake** | Freeze the warp into permanent geometry. The anchors move to where the bend put them and the WARP PRESET section disappears — after this, the bend is no longer adjustable. |
| **Remove** | Drop the warp and go back to the unbent outline. |

:::tip
**Drag, don't re-apply.** Re-picking a preset from the right-click menu always resets the bend to 50% — it's the "start a warp" action. Once a warp exists, use the **Bend** slider: it re-warps live as you drag, is the only way to get the values in between, and a whole drag counts as **one** undo step, so <kbd>Ctrl</kbd>+<kbd>Z</kbd> returns you to the bend you started the drag from rather than unwinding it a notch at a time.
:::

:::note
**Text and non-path shapes convert to a path** when you warp them. That is what lets the outline bend — but it means a warped headline is no longer editable text (you can't retype it), and a warped rectangle is no longer a rectangle (its corner-radius and shape properties are gone). Warp last, after the wording and styling are settled, or keep an unwarped copy on a hidden layer.
:::

| Preset | Shape |
| --- | --- |
| **Arc** | Whole object bows into a rainbow. |
| **Arch** | Top edge arcs up, base held. |
| **Flag** | Single S-wave across the width. |
| **Wave** | Double wave (two humps). |
| **Rise** | Linear slope — one side rises. |
| **Bulge** | Fattens the middle (top up, bottom down). |

```
const t = Yappy.createElement('text', 200, 200, 360, 120, { containerText: 'WARP', fontSize: 96 });
Yappy.setSelected([t]);
Yappy.applyWarpPreset('arc', 0.6);   // bend -1..1 (the slider's -100%..100%)
Yappy.applyWarpPreset('arc', 0.15);  // same preset, gentler — what dragging Bend does
Yappy.applyWarpPreset('flag', -0.5); // negative bends the other way
Yappy.bakeWarp();                    // make it permanent geometry
```

:::tip
For a fully custom envelope, use **Mesh Warp** (drag the orange control points) or **Envelope Distort** (4-corner) in the same Path menu.
:::

### Make with Top Object

Select some **artwork plus a shape on top**, then right-click → **Envelope: Make with Top Object**. The top shape becomes the envelope (consumed), and the artwork is squeezed into its *silhouette* — text into a heart, a logo into a circle, etc. `Yappy.envelopeWithTopObject()`. Bake with **Apply / Bake Warp** to make it permanent.

## ✂️ Knife & Scissors

Right-click → **Knife / Scissors** to enter the cut tool. It does two things depending on your gesture:

- **Knife** — *drag a line* across one or more objects. With nothing selected it cuts everything the line crosses; with a selection it only cuts those. <br />**Filled shapes** are sliced into separate, fully-closed pieces. **Lines and open paths keep their nature**: they're split at each crossing into shorter lines rather than being turned into filled shapes, so cutting a drawn stroke gives you two strokes. One knife drag across the same wavy line several times cuts it at every crossing, and the whole drag is a single undo step.
- **Scissors** — *click once on a path*, and it cuts **exactly where you clicked**, including in the middle of a curve. A closed shape opens there into a single open path; an open path splits into two. Non-path shapes are converted to a path first, and cutting one ring of a compound path (the counter of an *o*, the hole in a donut) leaves the other rings alone.

Press <kbd>Esc</kbd> to exit the tool.

:::note
**Rounded corners survive the cut.** Cutting converts the shape to a path first, and that conversion now carries the corner radius across as real arcs — so slicing a rounded rectangle (a packaging panel, a UI card) leaves the uncut corners as round as they were instead of squaring them off. The same applies anywhere else a shape becomes a path: Warp presets, Pathfinder, Convert to Path.
:::

:::tip
**Cutting doesn't move the shape, and the pieces are still curves.** The Scissors subdivides the curve at the cut point rather than approximating it, so the two halves trace exactly the outline the original did — cut a circle anywhere and the pieces still sit on a perfect circle. The Knife has to work on polygons internally, so its pieces are re-fitted to curves on the way out: cut a circle in half and you get two corner points at the ends of the straight cut and a handful of *smooth* points along the arc, rather than the dozens of corner points the overlap maths produced. Real corners — the shape's own, and the cut edge itself — stay sharp, so a knifed rectangle keeps square corners and flat sides. Shapes with holes keep their holes.
:::

```
// slice a rectangle in half with a vertical knife line
const r = Yappy.createRectangle(100, 100, 200, 120, { backgroundColor: '#3b82f6' });
Yappy.knife({ x: 200, y: 60 }, { x: 200, y: 260 }, [r]);  // → two pieces

// cut a circle open at its 45° point — not at whichever anchor happens to be nearest
const circle = Yappy.createPath(circleAnchors, { closed: true });
Yappy.splitPath(circle, { x: 370.7, y: 229.3 });   // opens exactly there
```

## ➕ Generative Shapes — Spiral, Arc, Grids

Right-click on empty canvas → **Insert** to drop a spiral, arc, rectangular grid, or polar grid at the cursor. Each is a real, editable path/line set you can restyle or node-edit. They're also fully parameterised in the API:

```
// Archimedean spiral: centre, radius, turns, decay(0..1 tightens turns)
Yappy.createSpiral(300, 300, 120, 4, 0.15);

// circular arc: centre, radius, start°, end° (clockwise from +x)
Yappy.createArc(300, 300, 120, 0, 270);

// rectangular grid: x, y, w, h, rows, cols  (a grouped set of lines)
Yappy.createRectGrid(100, 100, 240, 180, 4, 6);

// polar grid: centre, radius, rings, spokes
Yappy.createPolarGrid(300, 300, 140, 4, 12);

// full-composition texture overlay: 'noise' (film grain) or 'grunge' (soft blotches)
Yappy.addTextureOverlay('noise');
Yappy.addTextureOverlay('grunge', { opacity: 20, color: '#2b1d14', scale: 1.5 });
```

:::tip
Grids return one **group** so they move as a unit — double-click to enter the group and edit individual lines, or ungroup (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>G</kbd>). A spiral pairs nicely with **Width**-style tapering via the inkbrush, and an arc is the basis for **Type on a Path**.
:::

:::tip
**Noise Texture** / **Grunge Texture** (Vector Tools → Insert) cover the active artboard — else the page, else your artwork’s bounding box — with a procedural grain rectangle already set to *Multiply* at 14% opacity. It’s the one-click version of importing a grungy photo, stretching it over the picture and dialling the opacity down, and it keeps large flat colour areas from reading as dead. See **Masks, Appearance & Trace → Pattern Fills** for the per-shape controls.
:::

## ↕ Vertical Type

Select a text object, then right-click → **Vertical Type** to stack its characters top-to-bottom. Each line you type (each `\n`) becomes its own column, and columns advance **right→left** — the classic vertical-signage / CJK orientation. The text box **resizes to fit** the columns, so the selection bounds and hit-area match exactly; editing the text re-flows and re-sizes it, and **Vertical Align** (top / middle / bottom) positions the columns. Toggle it off to re-flow back to a normal horizontal box.

```
const t = Yappy.createText(160, 120, 'SALE\\nNOW', { fontSize: 40 });
Yappy.setTextVertical(t, true);   // stack vertically
Yappy.setTextVertical(t);         // toggle back to horizontal
```

## 🫧 Symbol Sprayer

Make a **Symbol** first (select artwork → Symbols panel → *＋*, or ` Yappy.createSymbol()`). Then in the Symbols panel click the **spray-can** button on that symbol and **drag on the canvas** — instances scatter along your stroke, spaced by the brush radius (drag slower for denser coverage) with random size variation. Press <kbd>Esc</kbd> to stop.

Because every dab is an ordinary symbol *instance*, redefining the symbol updates them all at once, and you can move, rotate, or recolour any of them with the normal tools.

```
// build a symbol from a shape
const dot = Yappy.createCircle(0, 0, 24, 24, { backgroundColor: '#8b5cf6' });
const sym = Yappy.createSymbol('confetti', [dot]);

// arm the sprayer (then drag on canvas), or spray programmatically:
Yappy.toggleSymbolSprayer(sym);
Yappy.spraySymbols(sym, [
  { x: 200, y: 200 }, { x: 240, y: 215 }, { x: 285, y: 235 }, { x: 330, y: 250 },
], { scaleJitter: 0.3 });
```

## 🪣 Live Paint Bucket

Draw overlapping shapes (even unfilled outlines), select them all (≥2), then right-click → **Live Paint Bucket**. The shapes become a **Live Paint group** and the cursor turns into a bucket — **click any enclosed region** to flood it with the active fill colour, just like colouring a line drawing. Two overlapping circles give three paintable regions (two crescents + the central lens); three give seven.

The fills are **live**: drag, scale, or rotate any source outline and every region recolours and reshapes to follow — the colour stays pinned to “the lens”, “that crescent”, and so on. The region fills sit beneath the outlines and are inert (you always grab the source shapes), so you can keep tweaking the artwork and the colouring keeps up.

```
// outline art → live paint group → flood regions
const a = Yappy.createCircle(120, 160, 140, 140, { backgroundColor: 'transparent', strokeColor: '#111' });
const b = Yappy.createCircle(210, 160, 140, 140, { backgroundColor: 'transparent', strokeColor: '#111' });
Yappy.makeLivePaint([a, b]);
Yappy.livePaintFill({ x: 215, y: 230 }, '#22c55e');  // the overlap lens
Yappy.livePaintFill({ x: 160, y: 230 }, '#3b82f6');  // left crescent

// move a source — the fills follow automatically
Yappy.updateElement(b, { x: 230 });

// bake it back to plain shapes when you're happy
Yappy.releaseLivePaint(/* groupId */);
```

:::tip
Live Paint shares the same atomic-region engine as the **Shape Builder** — Shape Builder *merges/deletes* regions into new geometry, Live Paint *colours* them while keeping the originals editable. Bounded to 8 source shapes per group.
:::

## 🖊 Width Tool — variable-width strokes

Select an open path, then right-click → **Width Tool**. Press on the path and **drag away from it** — the drag distance becomes the stroke width at that point, so the line swells and tapers like a calligraphic nib or a brush stroke. Add as many width points as you like; the thickness interpolates smoothly between them. Press <kbd>Esc</kbd> to exit, and right-click → **Reset Width** to go back to a uniform stroke.

```
// a calligraphic stroke: thin → thick → thin
const s = Yappy.createPath([
  { x: 80, y: 240, kind: 'smooth' },
  { x: 240, y: 120, kind: 'smooth' },
  { x: 400, y: 240, kind: 'smooth' },
], { strokeColor: '#0f172a', strokeWidth: 3 });
Yappy.setWidthPoint(s, 0.0, 2);    // t (0..1 along the path), width
Yappy.setWidthPoint(s, 0.5, 44);
Yappy.setWidthPoint(s, 1.0, 2);

Yappy.clearWidthProfile([s]);      // back to a uniform stroke
```

### Width profiles — one-click stroke shapes

Dragging width points by hand is the precise route; most of the time you want a named shape. Select a stroke and the Properties panel shows a **Width Profile** row of small drawn ribbons — click one and the stroke takes that shape. They’re also on the Command Palette (“Width Profile: …”).

| Profile | Shape |
| --- | --- |
| **Uniform** | A plain, even stroke (removes the profile). |
| **Bulge** | Pointed at both ends, widest in the middle — a leaf. |
| **Waist** | Full at both ends, pinched in the middle. |
| **Taper out** | Full weight at the start, tapering to a point. |
| **Taper in** | Starts at a point, growing to full weight. |
| **Chisel** | Holds full weight, then tapers away at the end. |
| **Oval** | Nearly even, rounded off at both ends. |

A profile **shapes** a stroke without making it heavier: the widest point is the stroke weight you already set, so switching profiles never changes how heavy the artwork reads. On a mixed selection each stroke is shaped relative to *its own* weight, so a thin line and a thick one stay thin and thick. Once you nudge width points by hand the row reports **Custom** rather than pretending a preset is still applied.

```
Yappy.setWidthProfile('bulge');           // the selection
Yappy.setWidthProfile('taper-out', [id]); // specific ids
Yappy.setWidthProfile('uniform', [id]);   // back to a plain stroke
Yappy.getWidthProfile();                  // 'bulge' | null (null = custom / mixed)
Yappy.widthProfiles;                      // the list, with labels
```

:::tip
The variable stroke renders as a filled ribbon, so it exports as true vector and prints crisply — and it appears in both drawing styles, since it’s a fill. Width applies to **open paths** (the calligraphy use-case); closed shapes keep their uniform stroke, and picking a profile for one says so rather than storing something invisible. A line or arrow is converted to a path first.
:::

:::note
**Width points are absolute.** A profile is fitted to the stroke weight at the moment you pick it, so changing *Stroke width* afterwards won’t rescale it — click the profile again to re-fit. (Cutting a path also drops its profile: the positions along the path no longer mean the same thing on a shorter piece.)
:::

## ✒️ Curvature & Reshape

**Curvature** (Command Palette → “Curvature”) lets you click a series of points and fits a smooth curve *through* them, updating live — click the first point to close, Enter/double-click to finish, Backspace to undo a point. **Reshape** grabs the nearest point on a path and bends it (neighbours follow with a falloff) while the path's endpoints stay pinned.

```
Yappy.createCurvature([{x:80,y:200},{x:200,y:120},{x:320,y:200}]);  // smooth path through points
Yappy.toggleReshapeTool(true);   // then drag a path to bend it
```

## 🖌 Blob Brush & Path Eraser

**Blob Brush** paints filled shapes — drag to lay down a stroke and it becomes a filled path; overlapping strokes of the *same colour* merge into one organic blob. **Path Eraser** is the destructive counterpart: drag to carve a swath out of shapes by boolean difference (splitting or notching real geometry). <kbd>[</kbd> <kbd>]</kbd> resize either brush.

## 📌 Puppet Warp

Select a shape and turn on **Puppet Warp**: click it to drop pins, then drag a pin to bend the mesh around it while the other pins anchor their regions. Alt-click a pin to remove it. It drives the same smooth mesh-warp the Envelope tool uses, so the deformation is fluid.

```
const r = Yappy.createRectangle(120,120,200,140,{ backgroundColor:'#c4b5fd' });
Yappy.togglePuppetWarp(true);
Yappy.addPuppetPin(r,120,120); Yappy.addPuppetPin(r,320,120);     // anchors
const c = Yappy.addPuppetPin(r,220,190); Yappy.movePuppetPin(r,c,300,110); // pull
```

## 📐 Perspective Grid

Turn on the **Perspective Grid** (Vector Tools palette, or the command palette) for a perspective drawing aid — a horizon with its vanishing points and converging guides. Drag a vanishing point or the horizon to set up the scene; the grid is anchored to the drawing, so it pans and zooms with your artwork. With a shape selected, the **Left / Floor / Right** buttons project it onto that plane (foreshortened toward the vanishing points). <kbd>Esc</kbd> or **Done ✕** exits.

### Settings (the ⚙ button)

- **Mode** — **1-pt** (one vanishing point, plus free horizontals and verticals), **2-pt** (left + right vanishing points, verticals stay vertical) or **3-pt** (a third vanishing point below the horizon, so verticals converge too). The **3rd VP** slider sets how far below the horizon that point sits — drag its handle directly when it is on screen.
- **Density** — how many guides are drawn per fan (4–40). Display only; snapping does not care how many lines you can see.
- **Snap to perspective lines** — on by default, with a **Tolerance** (how far off a ray you can be and still be captured) and a **Strength**.
- **Reset grid** — puts the vanishing points back on the current view.

Everything here is remembered between sessions, so you set the scene up once.

### Soft snap

While the grid is on, the **line**, **arrow**, **curve** and **pen** tools are pulled toward the nearest perspective ray — including the pen's Bézier *handles*, which is what lets a curve leave an anchor in perspective. The pull is deliberately *soft*: at **100%** strength a segment locks onto the ray, and below that it is only biased toward it, so freehand-feeling curves stay drawable. Rectangles and other box shapes are left alone (a box has no single direction to aim), and freehand pen/brush strokes are never snapped.

:::note
**Precedence.** A connector snapping to a shape wins over the grid; <kbd>Shift</kbd> gives you the plain 15° constraint instead; the grid beats grid-snap (which would otherwise drag the endpoint straight back off the ray); and <kbd>Alt</kbd> ignores the grid entirely for that stroke.
:::

```
Yappy.togglePerspectiveGrid(true);
Yappy.setPerspectiveGrid({ mode: 3, density: 20, snapAngle: 10, snapStrength: 1 });
Yappy.getPerspectiveGrid();     // current config
Yappy.projectToPlane('right');  // foreshorten the selection onto the right wall
Yappy.resetPerspectiveGrid();
```

## ✦ Lens Flare, Touch Type & Slice

- **Lens Flare** (right-click canvas → Insert → Lens Flare): a glow + rays + halo rings + ghost reflections, grouped.
- **Touch Type** — per-letter styling on a single-line text element *or* a **shape's label** (right-click → Touch Type, or the command palette). **Select several letters at once**: <kbd>Shift</kbd>-click to extend a range, or **drag a box** across glyphs (<kbd>Ctrl/Cmd</kbd>+<kbd>A</kbd> selects all). Then drag to move, <kbd>[</kbd><kbd>]</kbd> scale, <kbd>,</kbd><kbd>.</kbd> rotate, or use the floating **A−/A+/↺/↻** buttons, **colour swatch** and **font dropdown** — all applied to every selected glyph. <kbd>Ctrl/⌘</kbd>-click adds any individual letter (discontiguous). On tablets, **pinch to scale** and **two-finger twist** work too. **Exit** by clicking outside the element, pressing <kbd>Esc</kbd>, or **Done ✕**.
- **Custom & Google fonts**: the **Font** dropdown (property panel and the Touch Type controls) is searchable — type to filter, <kbd>↑</kbd>/<kbd>↓</kbd> + <kbd>Enter</kbd> to apply, each row previewed in its own face — and it stays on screen no matter how many fonts you've added. From it choose **＋ Add font…** to upload a `.ttf/.otf/.woff/.woff2`, or **🔍 Google Fonts…** to search a curated list of popular Google Fonts. The picker docks to the right with the canvas still visible: each click — or <kbd>↑</kbd>/<kbd>↓</kbd> + <kbd>Enter</kbd> from the search box — applies the font to your selection live (marked *✓ applied*), so you can try fonts back-to-back and close with **Done**, <kbd>Esc</kbd>, or ✕ when happy. Added fonts load immediately, persist across reloads, and work like any built-in font.
- **Font Family and Font Style are two dropdowns**, as in Illustrator. Font files are named `Family-Weight` (`Montserrat-Light`, `Montserrat-SemiBoldItalic`), so adding a whole family used to fill the list with entries that looked like unrelated typefaces. They are now grouped: **Font** lists each family once, and **Style** beneath it lists that family's weights and italics (*Light, Regular, SemiBold, Bold Italic…*). Switching family keeps the style you were in wherever the new family has it — Montserrat SemiBold → a family whose heaviest is Bold lands on Bold rather than resetting to Regular. The **Style** row only appears when the family actually has more than one style. The **Bold** and **Italic** buttons still work and are a two-state view of the same thing: Bold lights up for anything SemiBold or heavier.
- **Weight is the full 100–900 axis** (`fontWeight: 300` for Light, `600` for SemiBold, …), not just on/off bold, so Light and Black are reachable from the API as well as the Style dropdown. The old `fontWeight: true` and `'bold'` still work and mean 700 — documents made before this keep rendering exactly as they did.
- **Letter spacing**: the **Letter Spacing** property (Text group) tightens or loosens tracking on text elements, **shape labels** and **connector labels** alike, applied through measurement, wrapping, in-place editing and drawing (`Yappy.createElement(type, x, y, w, h, { letterSpacing: 2 })`).
- **Line spacing (leading)**: the **Line Spacing** property (Text group) sets how far apart the lines sit, as a *multiple of the font size* like CSS `line-height` — **1.2** unless you change it, `1` for solid setting, `2` for double-spaced. A multiple rather than a pixel value, so resizing the text keeps the spacing proportional and it still means something when rich-text runs on the same line have different sizes. Applies to text elements, shape labels and rich text, and follows through wrapping, auto-height, in-place editing and SVG/PNG/PDF export (`Yappy.createElement(type, x, y, w, h, { lineHeight: 1.6 })`).
- **Slice** (Command Palette → Slice): drag a rectangle to export exactly that region as a PNG (`Yappy.exportRegion(x,y,w,h)`). Artboards remain for persistent named export regions.

## 📊 Graph data · 🫧 Symbolism brush · 🪣 Live Paint Selection

- **Graph tool**: bar & pie charts are data-driven — right-click a chart → “Edit Chart Data…”, or `Yappy.setChartData(id, [10,80,45,95])`.
- **Symbolism brush** (the symbol sub-tools): brush over sprayed symbol instances to *Sizer* (scale), *Spinner* (rotate), *Shifter* (nudge), *Screener* (fade), *Stainer* (tint) or *Styler* — pick a mode in the hint bar, <kbd>[</kbd><kbd>]</kbd> resize, Alt reverses.
- **Live Paint Selection**: in the Live Paint tool the face under the cursor highlights; click to fill it, or **Alt-click to clear** that face's colour.

## ✒️ Pen / Vector Path — anchors, curves & the Clock Method

Grab the **Pen** (<kbd>P</kbd>): *click* drops a corner anchor, *click-drag* drops a smooth anchor and pulls out its Bézier handles, and clicking the first anchor closes the path. <kbd>Enter</kbd>/<kbd>Esc</kbd> (or double-click) finishes; <kbd>Backspace</kbd> removes the last anchor.

**Straight segments (15° constrain).** Hold <kbd>Shift</kbd> *between* clicks and the next point snaps to the nearest **15°** from the previous anchor, so perfectly horizontal, vertical and 45° segments are one click rather than a steady hand. It's the same increment the Line and Arrow tools use, and it takes precedence over Snap to Grid for that click (the grid would pull the point back off the angle). The rubber-band preview shows the constrained position, so what you see is where the anchor lands — and clicking the first anchor still closes the path with <kbd>Shift</kbd> held.

**Clock Method (90°/45° constrain).** Hold <kbd>Shift</kbd> while dragging a handle to snap it to the nearest 45° — straight to 12/3/6/9 o'clock for clean, editable curves. Don't have a keyboard? Toggle the **90°/45°** button in the floating Pen bar, or rest a **second finger** on the canvas while you drag with the stylus (the Procreate-style constrain modifier). Both constrain modes share that toggle, so tablet users get straight segments as well as clean handles.

:::note
**Shift means two things.** Which one you get depends on whether the button is down: *between* clicks it aims the segment (15°), *during* a drag it aims the handles (45°). They never apply at once, so there is nothing to switch between.
:::

**Breaking a handle (cusps).** A smooth anchor keeps its two handles in line with each other — move one and the other swings to stay opposite. Hold <kbd>Alt</kbd> while dragging a handle to **break that pairing**: the handle you are dragging moves on its own and the other stays put, so one side of the anchor can curve while the other runs straight into it. That's how you get a teardrop, a petal tip, or the sharp join in a script letterform.

It works in both places you touch a handle — while *drawing* with the Pen (hold <kbd>Alt</kbd> partway through the drag that pulls the handles out), and when *editing* an existing anchor with the Node tool (<kbd>N</kbd>, or double-click the path). The break is permanent, not just for that drag: the anchor becomes a *corner*, so letting go of <kbd>Alt</kbd> won't snap the two sides back into line. To pair them up again, <kbd>Alt</kbd>-click the anchor to convert it back to smooth.

**Editing anchors** (**Node tool** — press <kbd>N</kbd> or double-click the path; the Select tool moves and resizes, it no longer shows anchors):

| Action | Desktop | Tablet / touch |
| --- | --- | --- |
| Smooth ↔ Corner | <kbd>Alt</kbd>-click the anchor | **Tap** the anchor, or long-press → *Make Smooth/Corner* |
| Break the handle pair (cusp) | <kbd>Alt</kbd>-drag the *handle* | Long-press the anchor → *Make Corner*, then drag each handle |
| Delete anchor | <kbd>Ctrl/⌘</kbd>-click the anchor | Long-press the anchor → *Delete Anchor* |
| Insert anchor | <kbd>Alt</kbd>-click the path outline | Long-press the outline → *Insert Point Here* |
| Constrain handles 90°/45° | Hold <kbd>Shift</kbd> while dragging | **90°/45°** toggle, or second-finger contact |
| Constrain segment to 15° (Pen, while drawing) | Hold <kbd>Shift</kbd> between clicks | **90°/45°** toggle, or second-finger contact |

:::note
**Alt on an anchor vs. Alt on a handle.** They do different things, and which one you get depends on what is under the cursor: on the *anchor dot*, <kbd>Alt</kbd>-click converts smooth ↔ corner; on the *handle* at the end of a control arm, <kbd>Alt</kbd>-drag breaks the pair.
:::

### ◜ Live Corners — round the corners of any path

Rectangles have their own **Roundness** and four independent **Corner** sliders. Everything else with corners — pen paths, polygons, stars, triangles, traced artwork, anything you converted to a path — rounds through **Vector Tools → Corners**. Drag the **Radius** slider and the corners fillet live.

- **It is non-destructive.** The radius is stored on the anchor and the rounded outline is rebuilt every time the path is drawn — so the anchor you edit is still the original sharp corner. Move it, and the rounding follows. Set the radius back to 0 (or hit **Reset corners**) and the corner returns exactly.
- **Some corners or all of them.** With nothing but the object selected, every corner rounds. Select individual anchors with the **Nodes** tool first and only those round — the panel header tells you which scope you are in.
- **Radius is in pixels**, not a percentage. A rectangle's roundness is a percent of its shorter side so it survives resizing; an open path has no “shorter side”, so paths use real units.
- **It clamps itself.** A corner can never eat more than half of either neighbouring segment, so two rounded corners on a short edge shrink together instead of crossing over. Drag past the limit and it simply maxes out.
- **Corners between curves** round too. The trim distance comes from the angle, so an obtuse elbow and a sharp spike with the same radius look like the same amount of rounding.
- Applying it to a non-path shape **converts it to a path first** (the same thing Illustrator does to a live shape). Rectangles and diamonds are left alone — they'd lose their own corner controls.

```
                    // Live Corners from the API
Yappy.setPathCornerRadius(12);              // all corners of the selection
Yappy.setPathCornerRadius(12, [pathId]);    // a specific path
Yappy.setPathCornerRadius(0);               // un-round

// only certain anchors: {id, sub, i} — sub = subpath index, i = anchor index
Yappy.setPathCornerRadius(20, [pathId], [{ id: pathId, sub: 0, i: 1 }]);

// read it back: value is null when the scoped corners disagree
const { value, max, count } = Yappy.getPathCornerRadius();
```

## 📐 On-canvas measurement

**Transform HUD.** Select anything and a small badge rides just below it showing its live **W × H** and position **X, Y** — plus the **rotation ∠** when a single object is turned. It updates as you drag, resize, or rotate, so you always know the exact size and placement without opening a panel. A multi-selection reports its combined bounding box. (The badge is passive — it never blocks the canvas — and hides in Presentation mode.)

**Measure tool** (View menu → *Measure*): drag a line across the canvas to read its **distance** and **angle**. For a diagonal drag it also draws the **right triangle** with its **Δx** and **Δy** legs labelled, so you can read the horizontal and vertical spans at a glance. If you *select a single shape first*, the tool shows a card with that shape's **W/H, area, and perimeter** (circles/ellipses use true πab area and circumference; lines report their length). Pair it with **Rulers & Guides** (<kbd>Alt</kbd>+<kbd>R</kbd>), **Snap to Grid** (<kbd>Shift</kbd>+<kbd>;</kbd>), and the alignment/equal-spacing guides that appear while you drag for precise layout. Scripting: `Yappy.measureShape(id)` returns `{ width, height, area, perimeter }`. <kbd>Esc</kbd> exits.

**Snap to point.** With object snapping on, dragging an element makes its corners, edge midpoints, centre — and the anchor points of vector paths — **snap onto another element's matching points** when they line up on both axes. A small magenta diamond marks where it locked, so you can butt shapes corner-to-corner (or onto a path anchor) exactly, not just align a single edge. It also snaps to **path intersections** — the points where two other objects' outlines cross — so you can drop a corner right where two lines or edges meet. Hold <kbd>Shift</kbd> while dragging to suspend snapping.

**Fixed-angle constraint** (<kbd>Shift</kbd>). Hold <kbd>Shift</kbd> to lock to clean **15° increments** while you **draw a line/arrow**, **rotate** an element, or drag the **Measure** line — perfect horizontals, verticals, and 45° diagonals without guessing. The drag keeps its length; only the angle snaps. The rotation angle shows live in the transform badge, and the Measure line reports the locked angle.

**Measure to a neighbour** (<kbd>Alt</kbd>-hover). With one or more objects selected, hold <kbd>Alt</kbd> and hover another object: red dimension lines show the exact **pixel gaps** between your selection and that object, plus the distance from the selection to each edge of its **artboard** (or page). It's a read-only inspection — nothing moves — and the lines vanish the moment you release <kbd>Alt</kbd> or move off. This is the Illustrator/Figma "measure-the-gap" gesture. Scripting: `Yappy.measureBetween(idA, idB, includeArtboardEdges?)` returns the same gap segments (distance, orientation, kind). *(v1: axis-aligned bounding boxes.)*

**Dimension annotations.** Right-click a shape → **Dimensions ▸ Add Width** or **Add Height** to attach a persistent, CAD-style dimension line (extension lines, arrowheads, and a px label). Unlike the Measure tool (a transient readout), a dimension *stays on the drawing* and **auto-updates** as you move, resize, or animate the shape — width dimensions sit below, height dimensions to the right. Remove them via **Dimensions ▸ Remove Dimensions**. Dimensions are now **rotation-aware** (they follow a rotated element's edges), and beyond width/height you can add **Radius** / **Diameter** (on circles/ellipses) and an **Angle** dimension that draws the element's rotation as an arc. Scripting: `Yappy.addDimension(id, 'width'|'height'|'radius'|'diameter'|'angle')`. They're saved with the document. Turn on **Settings → Include Dimensions in Exports** (opt-in) to bake them into exported **PNG / JPG / SVG / PDF** — SVG keeps them as real vector lines and text. Scripting: `Yappy.setExportIncludeDimensions(true)`.

**Measurement units.** Settings → *Measurement Units* switches every readout — the transform badge, the Measure tool, gap measuring, and dimension annotations — between **px**, **mm**, and **in** (96 px = 1 in). Scripting: `Yappy.setMeasurementUnit('px'|'mm'|'in')`.

## Where these map in Illustrator

| Illustrator tool | In Yappy |
| --- | --- |
| Pen / Vector Path (P) | Toolbar pen-nib (P) — click anchors, drag for Bézier handles; anchors & handles show live, click first anchor to close |
| Shape Builder (Shift+M) | Right-click → Shape Builder (face-level) |
| Magic Wand (Y) | Right-click → Select Similar |
| Live Paint Bucket (K) | Right-click → Live Paint Bucket (click regions) |
| Effect → Distort & Transform / Liquify | Right-click → Distort & Transform |
| Knife | Cut tool — drag a line |
| Scissors (C) | Cut tool — click a path |
| Spiral / Arc / Rectangular & Polar Grid | Right-click empty canvas → Insert |
| Vertical Type | Right-click text → Vertical Type |
| Symbol Sprayer (Shift+S) | Symbols panel → spray-can |
| Width Tool (Shift+W) | Right-click path → Width Tool |
| Curvature (Shift+~) | Command Palette → Curvature |
| Reshape | Command Palette → Reshape |
| Blob Brush (Shift+B) | Command Palette → Blob Brush |
| Eraser / Path Eraser | Command Palette → Path Eraser (destructive) |
| Puppet Warp | Command Palette → Puppet Warp |
| Perspective Grid | Vector Tools → Warp → Perspective Grid, or Command Palette |
| Flare | Insert → Lens Flare |
| Grain / texture overlay | Vector Tools → Insert → Noise Texture / Grunge Texture |
| Touch Type (Shift+T) | Right-click text → Touch Type |
| Slice (Shift+K) | Command Palette → Slice |
| Graph tools (J) | Chart shapes → Edit Chart Data… |
| Symbolism sub-tools (Shift+S) | Command Palette → Symbolism Brush |
| Live Paint Selection (Shift+L) | Live Paint → hover/Alt-click faces |
