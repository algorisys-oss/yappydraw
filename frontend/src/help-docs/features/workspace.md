---
id: workspace
name: Workspace & Productivity
icon: "🛠"
category: Features
description: Smart toolbar, align & distribute, rulers & guides, blend, measure tool, history panel, and vector SVG export
keywords: "fill stroke fill and stroke swatch pair no fill no stroke remove stroke remove fill none transparent eyedropper pipette pick colour from image sample colour from reference reference image swap fill stroke Shift+X X key active paint channel colour palette palette popup illustrator fill stroke icon ruler rulers guide guides show rulers hide rulers turn on rulers Alt+R alt r toggle rulers and guides drag guide from ruler delete guide double-click clear all guides convert shapes to guides snap to grid tick marks measurement units origin zero canvas coordinates x y precision layout alignment toolbar dock position dock right dock bottom flyout submenu off screen cut off cannot see expanded tools move panel drag panel movable panel layers panel fixed stuck P3 wide gamut picker does not update properties panel smart toolbar align distribute key object spacing gap transform x y width height rotation stroke dash measure tool blend morph spine history panel undo redo save my drawings settings pen input default tool pointer export png jpg svg pdf excalidraw grid style square lines dots diagonal 45 degree isometric 30 degree angled grid lattice snap to grid grid size construction angle move to layer move object between layers reorder layers layer order Alt+[ Alt+] setGridStyle gridStyles support donate donation contribute sponsor razorpay upi github sponsors pay payment tip buy me a coffee showSupport"
---

# Workspace & Productivity

The everyday helpers: the floating **smart toolbar**, **align & distribute**, **rulers & guides**, a scrubbing **history** panel, and **export** (including true-vector SVG).

## Where the toolbar lives

The tool column is docked to the **left edge** by default, and the canvas starts after it rather than underneath. The button at the top of the column moves it: each click steps to the next position — **left → top → right → bottom → floating** — and its icon shows where the bar currently sits. A docked bar reserves its edge; **floating** puts it back to a draggable overlay you can park anywhere (drag the grip, or drag its resize grip to wrap the icons into a compact grid).

A tool group's **flyout** (the submenu under Shapes, Pen, UML, BPMN and the rest) follows the bar: it opens *below* the button on a left- or top-docked bar, *beside* it on a right-docked one, and *above* it on a bottom-docked one — always fully on screen and never covering the button you pressed.

:::tip
The position sticks between sessions. Scripted: `Yappy.getState().globalSettings.toolbarDock` reports it.
:::

### The top bar's view controls

The tool column holds things you *draw* with. Everything else lives in the cluster at the right of the top bar: **Pan** (<kbd>H</kbd>), **Commands & Tools** (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>K</kbd>), the **Vector Tools** palette, **Shape Builder** (<kbd>Shift</kbd>+<kbd>M</kbd>), **Settings**, **Properties** (<kbd>Alt</kbd>+<kbd>Enter</kbd>), **Show Dimensions**, and **Help** — then the colour palette and the theme toggle. Buttons that are toggles light up while they're on; Pan is a tool, so clicking it again returns you to Select.

The full row needs about **700px** of width. Below that it collapses into the hamburger menu, where the same entries sit beside *Rulers & Guides*. Every iPad — mini through Pro, portrait or landscape — gets the full bar.

### On a phone

Below **600px** wide the position control is hidden and the tools become a single **full-width strip** pinned just above the status bar, with larger touch targets. Swipe the strip **sideways** to reach the tools that don't fit. There is no docking, dragging or wrapping at this size — an edge is too much of the screen to give away — but the strip, the header and the status bar all *reserve* their space, so the canvas between them is entirely yours to draw on. **Undo** and **redo** float just above the strip.

Between **601px** and roughly a tablet width you get the normal docked column plus the compact header — the toolbar keeps its edge and the canvas still starts after it.

## Fill & Stroke

At the **foot of the tool column** sits the Illustrator swatch pair: a solid square for the **fill**, a ring behind it for the **stroke**. They show what the selection is painted with — or, with nothing selected, what the **next shape you draw** will be painted with. A red slash across a square means that channel is empty.

**Click either square** to open the paint panel for it:

- **A palette of swatches**, with the palette dropdown at the top — the same palettes the top-bar colour popup offers.
- **None** — takes the fill or stroke away entirely. This is the one-click "no outline" that used to mean scrolling the Properties panel.
- **Pick** — the **eyedropper**. Click anything on the canvas and its colour lands in the channel. It reads the colour out of the *document*, so what you pick is exactly what is there; over an image (a **reference photo** you pasted in, say) it samples the pixel under the cursor, which is what makes matching a palette from a reference straightforward.
- **Swap** and **Reset** — swap fill ⇄ stroke, or go back to a black stroke with no fill.
- A full **colour picker** with a hex field and recents. It **follows the swatch you pick** — choose a colour from any palette and the saturation square, the hue slider and the hex field all move to it, so the picker is always a live readout of the current channel rather than a separate control. That includes the wide-gamut **P3** palette: those swatches are stored as `color(display-p3 …)`, and the picker shows the closest sRGB equivalent while the object keeps the true P3 colour.

| Key | Does |
| --- | --- |
| <kbd>X</kbd> | Switch which channel you are setting (fill ⇄ stroke) |
| <kbd>Shift</kbd>+<kbd>X</kbd> | Swap the two colours over |

<kbd>Shift</kbd>+<kbd>X</kbd> works with **nothing selected** too — there it swaps the colours the next shape will use.

:::tip
Every palette now leads with a **checkerboard swatch** — that is `transparent`. Clicking it removes the colour, so you can clear a fill or a stroke from the top-bar palette popup as well, whichever palette you are on.
:::

```js
Yappy.setPaintColor('stroke', 'transparent');   // remove the outline
Yappy.setPaintColor('fill', '#e03131');         // and paint the fill red
Yappy.getPaintColor('fill');                    // → '#e03131'
Yappy.swapFillStroke();                         // Shift+X
Yappy.resetPaint();                             // black stroke, no fill
```

## Guided tour

On your **first visit** a short **spotlight tour** highlights the main areas — toolbar, canvas, Properties panel, and the settings/help cluster. Step through with **Next**/**Back** (or **→**/**←**), or **Skip** (**Esc**) anytime. It only auto-runs once.

:::tip
Replay it whenever you like from **Help (?) → “Take the tour”**, or from a script with `window.Yappy.startTour()`.
:::

## What's new

Click the **version number** in the bottom-right status bar to open the **What's new** popup — a running list of recent updates in plain language. A small dot appears on the version when there are changes since you last looked. The popup also has a **Reload latest** button that clears the cache and reloads the newest build (handy on iPad/iOS). Open it from a script with `window.Yappy.showWhatsNew()`.

:::note
**If a page says it can't load and asks you to reload**, use the button it offers. It does the same full clear as **Reload latest** — dropping the cached copy of the old build and fetching the current one. A plain browser refresh (F5) is *not* enough: Yappy keeps a copy of itself for offline use, and that copy is only replaced once the app is fully closed, which is why refreshing sometimes appeared to do nothing while closing the tab and returning fixed it. Your drawings are never affected either way — they live in local storage, not in the cached build.
:::

## Properties panel

Press **Alt+Enter** (or the sliders button in the top bar) to toggle the **Properties** panel, which docks to the right edge. It shows the controls for whatever is selected — fill, stroke, size, text, effects, animation — or, when nothing is selected, **the defaults for the drawing tool you have picked**, filtered to what that tool can actually draw. Choose the Polygon tool and *Polygon Sides* is there before you draw anything; choose Star and you get *Star Points* instead. Tools that select rather than draw — Select, Pan, Lasso, Crop — show the slide or canvas properties instead, since they create nothing to set defaults for.

:::tip
With **nothing selected** and the Select tool active, Alt+Enter opens **Canvas properties** (background, grid, texture, page size) — the same thing you get from *right-click → Canvas Settings*. Clicking an empty spot on the canvas dismisses it.
:::

The panel **never opens by itself**. Picking a drawing tool leaves it exactly as you left it, so a long brainstorming session isn't interrupted by a panel sliding in on every tool switch. Open it deliberately with Alt+Enter, the sliders button, or by **right-clicking a tool group** in the toolbar (which opens the panel on that tool's defaults) — and once it's open it stays docked while you work.

Properties is a **dockable panel** like Layers, History or Swatches, so it is not stuck on the right. **The title bar is the handle** — it carries a grip (⣿) next to the panel's name, and dragging it moves the whole panel, with a finger or pen as well as a mouse. Drag it to the left or right edge to dock it there, drop it anywhere else to float it, drag the zone's inner edge to resize, and use the title-bar buttons to dock left / dock right / float / collapse to the title bar / close. Your arrangement is saved and comes back next time. The resize edge carries a small **grip** — a short vertical bar on the inner edge of the docked column; grab it and drag sideways to set the width (200–560px). The animation timeline has the matching grip on its *top* edge for height. *Duplicate* and *Delete* sit just below the title bar, with the object's properties, because they act on the selection rather than on the panel.

## Smart toolbar

Select an object and a compact **quick-properties toolbar** floats next to it with the controls that matter for that object type — fill & stroke colour, opacity, stroke style, and (for anything that can hold text) **font & font size**, alignment, and bold/italic. It's the fastest way to restyle without opening the full Properties panel.

:::tip
The toolbar adapts to what's selected: shapes show fill/stroke/roundness + text controls; connectors show line width, type and arrowheads; text shows font, size and weight; images show filter presets. Collapse it to a tiny chip with the slider icon; toggle it in Settings.
:::

**Type an exact value on any mini-slider.** Drag the little sliders (font size, opacity, …) for a quick nudge, or **tap/click the number** beside a slider to type a precise value — press **Enter** to apply, **Esc** to cancel. Values clamp to the slider's range automatically.

## Align & distribute

Select two or more objects → the **Alignment** group in the Properties panel. Align left/centre/right and top/middle/bottom; distribute spreads three or more objects evenly.

### Groups align as one object

A group counts as a *single* object for both align and distribute: the group's bounding box is what lines up, and its members keep their internal arrangement. Selecting one group on its own therefore does nothing — there's nothing to align it against.

To align objects *inside* a group, **double-click into the group** (see below) and select the members there. Clicking a group and dragging a selection box around one both pick up the *whole* group, as in Illustrator and Figma; a partial selection — which does align its members individually — comes from shift-clicking members inside the group, or from the API.

### Align to a key object

Toggle the **crosshair** button (Properties panel, or the **Align** dock panel) to align *to the key object* — one object stays put and everything else lines up to it, instead of to the selection's bounding box. Great for snapping a row of items to one anchor.

The key object is drawn with a **thicker blue outline and a corner pip**. By default it's the last object you added to the selection; with the mode on, **click any already-selected object** to make it the key (Illustrator's gesture). Scripts can name one explicitly instead:

```
Yappy.toggleAlignToKey(true);
Yappy.alignSelectedElements('left', keyId);   // keyId stays put
```

### Distribute spacing

The two **space-around** buttons distribute by *gap*, not centre: they make the edge-to-edge spacing between objects equal (first/last stay put). Type a number in the **gap** box to pack the objects with that exact pixel gap instead.

:::tip
Centre distribution equalizes object *centres*; spacing distribution equalizes the *gaps* — use spacing when objects are different sizes and you want even whitespace.
:::

## Working inside a group

Clicking any member of a group selects the whole group — right up until you need to touch one thing inside it. **Double-click** a grouped object to step *into* the group: a bar appears at the top of the canvas, and from then on clicks select individual members, which you can move, restyle, restack and align on their own.

- **Double-click again** to go one level deeper into a nested group.
- **Esc** (or **Up one** in the bar) steps back out one level and re-selects the group.
- Clicking **outside** the group — on other artwork or empty canvas — leaves isolation entirely.
- While inside, marquee-select and <kbd>Ctrl</kbd>+<kbd>A</kbd> are confined to that group's members.

:::tip
Text inside a group needs two double-clicks: the first enters the group, the second starts editing the text — the same as Illustrator.
:::

```
Yappy.enterGroup(elementId);   // step into the group containing this element
Yappy.isolatedGroups;          // ['group-…'] — outermost → innermost
Yappy.exitGroup();             // up one level
Yappy.exitAllGroups();         // leave entirely
```

## The object tree — every object on a layer

The Layers panel is **movable**, like every other dock panel: grab its title bar (the grip ⣿ beside the word *Layers*) and drag. Drop it near the left or right edge to dock it into that column, or anywhere else to leave it floating over the canvas; the title-bar buttons do the same thing in one click. Wherever you leave it is remembered, and a floating panel is always pulled back into view if the window gets smaller, so it can never end up somewhere you cannot reach it.

Open the **Layers** panel and click the **box icon** on a layer row to list the objects on it. The list reads top-of-stack first, exactly like the artwork, and groups appear as one row you can expand.

- **Click a row** to select that object — including one object inside a group, without entering the group. Shift/Ctrl-click adds to the selection.
- **Eye** hides an object. A hidden object isn't drawn, can't be clicked or marquee-selected, and is left out of *every* export (PNG, SVG, PDF, PPTX, the HTML player) and the minimap.
- **Padlock** locks it against selection and editing, the same as Object ▸ Lock.
- **Double-click the name** to rename it. Objects start with a derived label — their own text, or their type ("Rectangle", "Path") — so most never need naming.
- **Groups rename the same way.** Double-click a group row and give it a real name — "Front panel", "Logo lockup" — instead of the default *Group (4)*. Nested groups are named independently, so an inner "Cap" can sit inside an outer "Bottle". Clear the name (empty it) and the row goes back to showing the member count.
- **Drag a row** to restack it; drop on the upper half of a row to go in front of it, the lower half to go behind. Dragging a group moves the whole group.

:::note
**Where a group's name lives.** A group isn't an object — it's an id its members share — so its name is stored on the members themselves. In practice that means the name travels with the artwork: it survives saving, undo, duplicating the group, and copy-pasting it into another drawing. **Ungrouping discards it** (there is no longer a group to name), so re-grouping gives you a fresh *Group (n)* to name again.
:::

:::tip
A renamed object keeps its *id*. The name is a label for you; the id is what scripts address (`Yappy.renameElement` changes that instead). Hiding is not deleting — hidden objects are saved with the document, and `Yappy.showAllElements()` brings everything back.
:::

```
Yappy.setElementsVisible([id], false);  // hide (accepts group ids too)
Yappy.toggleElementVisible(id);
Yappy.showAllElements();
Yappy.setElementName(id, 'Hero banner');   // '' clears it
Yappy.elementLabel(id);                    // what the tree shows
Yappy.moveElementsNextTo([id], targetId, 'above');

const gid = Yappy.getElement(id).groupIds.at(-1);  // outermost group of an object
Yappy.setGroupName(gid, 'Front panel');    // '' clears it → back to "Group (n)"
Yappy.getGroupName(gid);
```

## Arrange — stacking order

Right-click → **Arrange**, the arrow buttons in the Properties panel, or the keyboard:

| Action | Shortcut |
| --- | --- |
| Bring Forward (one step) | <kbd>Ctrl</kbd>+<kbd>]</kbd> |
| Send Backward (one step) | <kbd>Ctrl</kbd>+<kbd>[</kbd> |
| Bring to Front | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>]</kbd> |
| Send to Back | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>[</kbd> |

These match Illustrator and Figma. A multi-selection moves as one **block** — the selected objects keep their order relative to each other and the whole move is a single undo. One press also steps over an entire **group** rather than one member at a time.

:::tip
Stacking is per **layer**: paint order is layer order first, then position within the layer. Stepping forward moves an object past its neighbours *on its own layer* — to put it above artwork on a higher layer, move the object to that layer (or reorder the layers with <kbd>Alt</kbd>+<kbd>[</kbd> / <kbd>]</kbd>).
:::

### Grid styles — including diagonal and isometric

The grid has four styles, in *Settings → Canvas → Grid Style* or from the Command Palette (“Grid Style: …”):

| Style | What you get |
| --- | --- |
| **Lines** | The square grid. |
| **Dots** | The same square grid, marked at the intersections only. |
| **Diagonal** | A 45° cross-hatch, for laying out angled construction. |
| **Isometric** | 30° lines both ways plus verticals — boxes, 3/4 views, and character construction. |

**Snap follows the lines you can see.** On the angled styles, **Snap to Grid** (<kbd>Shift</kbd>+<kbd>;</kbd>) puts points on the *intersections of the slanted lines*, not on square coordinates — a slanted grid that still snapped to squares would drop every point between the lines. *Grid size* sets the spacing between parallel lines, measured across them.

:::tip
Zoom out far enough and an angled grid draws every second line, then every fourth, so it stays a grid instead of turning into a grey wash. That is only what’s *drawn* — snapping always uses the full grid size, so a point placed while zoomed out is still exactly on the lattice at 100%.
:::

```
Y.setGridStyle('isometric');   // 'lines' | 'dots' | 'diagonal' | 'isometric'
Y.updateGridSettings({ enabled: true, snapToGrid: true, gridSize: 40 });
Y.gridStyles;                  // the list, with labels
```

### Moving objects between layers

Select the artwork, then right-click → **Move to Layer** and pick the destination. It works on a whole selection at once, and a tick marks the layer the selection is already on (or every such layer, when a mixed selection spans several). Group layers are containers rather than places artwork lives, so they aren’t offered, and neither are locked layers — for the same reason you can’t draw into one. The entry is hidden entirely when there is nowhere else to move to.

To move a **layer itself** up or down the stack, drag it by the grip (<b>⋮⋮</b>) at the left of its row in the Layers panel, or press <kbd>Alt</kbd>+<kbd>[</kbd> / <kbd>Alt</kbd>+<kbd>]</kbd> to move the active layer. Only the grip starts a reorder — dragging the row body sideways is the swipe gesture that reveals the lock/duplicate/delete tray instead.

While you drag, a preview of the layer follows your pointer so you can see what you picked up, and a line shows where it will land: drop on the **upper half** of a row to insert above it, the **lower half** to insert below. With **Groups** enabled, a group row has a third zone — its outer quarters insert beside the group, while holding over its middle drops the layer *inside* it, shown as a dashed outline instead of a line. Release anywhere that isn't a row and the drag is simply cancelled.

Layer order decides what covers what on the canvas, which shape you select when several overlap, and the order layers are drawn in exports, animation and slide builds — all of which follow the panel.

## Rasterize — vector to bitmap

Right-click → **Rasterize** (or the command palette) converts the selected artwork into a single image element. The bitmap takes the selection's place: same layer, same slot in the stacking order, so nothing jumps in front of or behind its neighbours. Rotation, opacity and effects are baked into the pixels.

- **1× / 2× / 4×** — pixels per canvas unit. 2× is the retina-friendly default; 4× is for print-scale zoom.
- **Rasterize on White** — flattens onto an opaque white backdrop instead of keeping transparency.
- **Rasterize a Copy** — keeps the vectors and drops the bitmap directly on top, so you can go back.

Only the selected objects are drawn — overlapping neighbours are never baked in. Rasterizing a whole group produces one ungrouped image; rasterizing *part* of a group leaves the image inside that group.

```
const id = await Yappy.rasterize();                      // selection, 2x, transparent
await Yappy.rasterize([a, b], { scale: 4 });             // print-scale
await Yappy.rasterize(undefined, { keepSource: true });  // keep the vectors
```

:::tip
Rasterizing is one-way — the vectors are gone once you convert (undo aside), so use **Rasterize a Copy** if you might still need to edit the original. Very large selections are capped at 16384px on the longest edge.
:::

## Transform — numeric position, size & rotation

Select a single object → the **Transform** group in the Properties panel shows editable **X**/**Y** (position), **W**/**H** (size), and **∠** (rotation, in degrees). Type a value and press **Enter** (or click away) to apply — each edit is a single undo step, and the fields track the object live as you drag or rotate it on canvas. Resizing rescales the object's geometry (pen points, path anchors, text size) exactly like a handle drag.

```
Yappy.setElementTransform(id, { x: 120, y: 80 });      // move
Yappy.setElementTransform(id, { width: 240, height: 160 }); // resize
Yappy.setElementTransform(id, { angle: Math.PI / 4 });      // rotate 45° (radians)
```

### Size while you drag

Drag any of the eight resize handles and a **W × H chip** appears just under the object, updating live and reading in your chosen measurement unit. It follows a rotated object's own frame, and it exists only for the duration of the drag — so there is nothing to turn on and nothing sitting on your artwork the rest of the time.

### The dimension badge

If you want those numbers *permanently* while something is selected — plus position and rotation, which the drag chip doesn't show — there is also a badge that follows the selection and reads its live **W × H**, position and rotation. It is handy while resizing but in the way the rest of the time, since it sits right under the object on top of your artwork, so it is **off by default** (and it replaces the drag chip when on, rather than stacking with it). Turn it on with the **Proportions** button in the top bar (next to Settings and Properties), or from *Menu → View → Show Dimensions* on a phone. The choice sticks between sessions. It reads in your chosen measurement unit, and hides itself in presentation mode and while the Measure tool is active.

```
Yappy.setShowDimensions(true);    // show the badge
Yappy.toggleShowDimensions();     // flip it, returns the new state
Yappy.getShowDimensions();        // -> boolean
```

:::tip
Not the same as **Measure**/`addDimension()`, which places a *permanent* annotation on the canvas, or `setExportIncludeDimensions()`, which bakes those annotations into an export.
:::

## Custom stroke dashes

Beyond the **Stroke Style** preset (solid / dashed / dotted), the **Stroke Dash** group lets you type *any* dash pattern — a comma- or space-separated list of on/off pixel lengths. `12, 4` is a simple dash; ` 12, 5, 2, 5` is a dash-dot. A live preview shows exactly what renders, and quick chips (Dash / Dot / Dash-dot / Long) fill common patterns. **Clear** reverts to the Stroke Style preset. Custom dashes render in both draw styles and export to SVG as ` stroke-dasharray`.

```
Yappy.setStrokeDash([12, 4, 3, 4]);   // dash-dot on the selection
Yappy.setStrokeDash([], ids);         // clear (revert to the Stroke Style preset)
```

:::tip
Appearance-stack strokes (Appearance panel) have their own compact *dash* field, so each stacked stroke can carry a different custom pattern.
:::

## Rulers & guides

**Show them with <kbd>Alt</kbd>+<kbd>R</kbd>** — or ☰ → **View** → **Rulers & Guides** (a tick shows when they're on), or the Command Palette (<kbd>Ctrl</kbd>+<kbd>K</kbd>) → *Toggle Rulers & Guides*. Two strips appear along the **top** and **left** edges of the canvas, plus a small corner box. The setting is remembered per browser, so they come back next time you open Yappy.

### Reading the rulers

The top strip measures **X**, the left strip measures **Y**, both in canvas units. Tick spacing follows the zoom automatically — it picks a round **1 / 2 / 5 × 10ⁿ** step so major ticks stay roughly evenly spaced and the labels stay readable whether you're at 10% or 800%. The strips start at the *canvas* origin (not the window), so zero on the ruler is zero on the canvas no matter which edge the toolbar is docked to. Rulers read the **un-rotated** grid — they're always axis-aligned.

### Pulling out guides

**Drag down off the top ruler** to pull out a **horizontal** guide; **drag right off the left ruler** for a **vertical** one. The guide follows your pointer and drops where you release. Afterwards, **drag any guide** to move it — hovering one shows a move cursor, and its tooltip reports its exact position (`X = …` / `Y = …`).

To remove a guide, **double-click it**, or **drag it back onto the ruler** it came from. To clear the lot at once, use the Command Palette (<kbd>Ctrl</kbd>+<kbd>K</kbd>) → *Clear All Guides*.

### Selecting several guides at once

**Click a guide** to select it — it turns pink and thickens. **Shift** (or <kbd>Ctrl</kbd>/<kbd>⌘</kbd>) **+click** adds or removes guides from that selection, and <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>A</kbd> selects *every* guide. Clicking anywhere else clears the selection, as does <kbd>Esc</kbd>.

With a selection live you can manage the whole set together:

- **Drag** any selected guide and the entire selection moves with it. Guides slide along their *own* axis, so a mixed horizontal/vertical set keeps its shape.
- **Arrow keys** nudge the selection by 1px — hold <kbd>Shift</kbd> for 10px.
- <kbd>Delete</kbd> / <kbd>Backspace</kbd> removes every selected guide at once.

Finished with a layout? *Lock / Unlock Guides* in the Command Palette freezes them — locked guides still draw, but they can't be dragged, selected, or deleted by accident.

### Turning shapes into guides

Select one or more shapes → Command Palette (<kbd>Ctrl</kbd>+<kbd>K</kbd>) → *Convert Shapes to Guides*. Each shape drops a horizontal *and* a vertical guide at every edge of its bounding box, then the shape itself is removed — so a rectangle becomes a four-line frame you can lay out against. This is Illustrator's <kbd>⌘5</kbd>; pair it with *Split Into Grid* to build a whole guide scaffold in two commands (see the Effects doc).

:::tip
**Two things to know.** Guides are *visual references* — nothing snaps to them yet. For snapping, use **Snap to Grid** (<kbd>Shift</kbd>+<kbd>;</kbd>) and the automatic alignment guides that appear while you drag. And guides live for the *session*: they aren't saved into the document, so they're gone after a reload (the rulers themselves do stay on).
:::

```
const Y = window.Yappy;

Y.toggleRulers();            // flip the rulers + guide system
Y.toggleRulers(true);        // force them on

const id = Y.addGuide('h', 200);  // horizontal guide at world y = 200
Y.addGuide('v', 120);             // vertical guide at world x = 120
Y.updateGuide(id, 260);           // move it
Y.removeGuide(id);                // drop that one
Y.clearGuides();                  // drop them all

// Working with several guides at once
Y.listGuides();                   // [{ id, axis, pos }, …]
Y.selectGuides([id1, id2]);       // replace the selection
Y.selectGuide(id3, true);         // Shift+click: toggle into the selection
Y.selectAllGuides();              // Ctrl/Cmd+Shift+A
Y.getSelectedGuides();            // ids of the selected guides
Y.moveSelectedGuides(40, 0);      // v-guides take dx, h-guides take dy
Y.removeSelectedGuides();         // delete them; returns how many went
Y.clearGuideSelection();          // Esc
Y.toggleGuidesLocked(true);       // freeze them in place
```

## Measure tool

Turn it on from ☰ → View → **Measure Tool** (or `Yappy.toggleMeasure()`), then **drag** anywhere on the canvas to lay down a measuring line. A readout shows the **length** (in canvas units) and the **angle** from horizontal. The line stays until your next drag; press **Esc** to exit.

## Blend

Select exactly **two** objects, then right-click → **Blend** → choose a step count (2–16). Yappy creates that many in-between copies, smoothly interpolating **position, size, rotation, colour, opacity and stroke width** from the first object to the second — a graduated chain (e.g. a small red circle blending into a large blue one).

:::tip
The blend uses the first object's shape for the steps (it grows/recolours toward the second), so it's ideal for graduated copies along a line. `Yappy.blend(steps)`.
:::

### Smooth Morph blend

Right-click two shapes → **Blend ▸ Smooth Morph** to interpolate their *outlines* point-for-point — so a circle actually **morphs into a star** (not just grows/recolours). Each step is a new editable **path**; colours blend too. `Yappy.blendMorph(steps)`. Great for shape-transition sequences and logo/letter morphs.

### Blend along a spine

Select **two objects plus a path or line** (the spine), then right-click → **Blend Along Spine** → step count. The in-between copies are distributed *along the path* (evenly by arc length) and auto-rotated to follow its tangent — Illustrator's *Blend + Replace Spine*. Great for beads-on-a-string, ribbons, and text/shape trails that curve. `Yappy.blendAlongPath(steps, orient)`.

:::tip
The steps interpolate size / colour / rotation / opacity between the two ends (using the first object's shape). Draw the spine with the Pen, Line, or Pencil, then select all three.
:::

## Teaching mode

For running a session in front of a room. The **graduation-cap button** in the top bar (or
*Menu → View → Teaching Mode*) strips the app back to the tools people actually draw with —
select, pen, line, arrow, rectangle, diamond, circle, text, image, eraser — and takes the
professional vector surface off the screen:

- **Vector Tools**, **Shape Builder** and the **Pathfinder** strip disappear from the top bar
  and the menu, and their right-click entries go with them.
- The **Pen / path tool** and the **dimension badge** are hidden.
- The shape libraries (UML, BPMN, wireframe, cloud) are off, so the toolbar stays one short row.

The tools are genuinely switched off, not just hidden — their keyboard shortcuts (<kbd>P</kbd>
for the Pen, <kbd>Shift</kbd>+<kbd>M</kbd> for Shape Builder) do nothing while the mode is on
and say so, rather than dropping you into a tool with no visible way back out.

:::tip
It's safe to flip mid-session. Turning the mode off restores your Dimensions and Pathfinder
settings exactly as they were, and the mode survives a reload — so a browser refresh in front
of the class doesn't dump you back into the full tool set.
:::

Scripting: `Yappy.setTeachingMode(true)`, `Yappy.getTeachingMode()`, `Yappy.toggleTeachingMode()`.

## Dev Mode

**Settings ▸ General ▸ Dev Mode** shows the parts of Yappy that are still being built. It is
**off by default**, so an unfinished tool never sits in the menu getting in the way of everyday
drawing — and on by choice, if you want to try things early.

Today it reveals:

- **Menu → Game** — the whole Arcade group: *New Game*, *My Games*, *Build*, *Node Graph*,
  *Blueprint*, *Play* and *Code* (see the **Arcade** doc).
- **Edit Behaviors (Game)…** in the right-click menu of a single selected object.

More work-in-progress features will appear behind this switch as they are built, so it is worth
checking after an update.

:::tip
Only the *entry points* are hidden. A document that already contains a game still holds its
behaviors and script with Dev Mode off, exports normally, and the `Yappy.*` game APIs keep
working — turning the switch back on shows the builder again with nothing lost.
:::

Like Teaching mode it is a **per-browser preference**: remembered across reloads, and never read
from a document, so opening a file someone sent you cannot turn unfinished features on for you.

Scripting: `Yappy.setDevMode(true)`, `Yappy.getDevMode()`, `Yappy.toggleDevMode()`.

## Paste & drop

<kbd>Ctrl</kbd>+<kbd>V</kbd> pastes whatever the clipboard holds — copied Yappy objects,
an image, or plain text (which becomes a text element). Dragging image or **SVG** files
onto the canvas drops them where the pointer is; SVGs come in as editable vector paths
rather than a picture.

Anything that arrives this way lands **selected, with the Select tool armed** — even if you
were mid-sketch with a brush or shape tool. A pasted object is something to place, so you get
its handles straight away and can drag, resize or restyle it without reaching for the toolbar.
The Lasso keeps its place, since it already selects.

## History panel

Open it with **Alt+H** (or View → **History Panel**) to see the document's timeline — past states, the current state, and any redoable future states. **Click any row** to jump straight to that point (it undoes/redoes the difference for you). Each row shows its object count; the current state is highlighted and future states are dimmed.

:::tip
A faster way to scrub than tapping Undo/Redo repeatedly — jump back several steps, inspect, and jump forward again in one click.
:::

### How many steps are kept

**50** by default. Change it in **Settings → Pen & Input → Undo History Depth**, anywhere from
**10 to 500** steps.

Each step holds a complete snapshot of the drawing, so the ceiling is about memory rather than
anything else — a long session on a large document with 500 steps retained is a lot to keep in
the browser. Raise it if you work in long stretches and want deeper cover; lower it if you are
on a modest machine and the document is heavy.

The change takes effect **immediately**, not at the next reload: the history is trimmed to the
new limit on your next action, so lowering it discards the oldest steps straight away. The
setting is remembered per browser and is not stored in the drawing — opening someone else's
file will not change it.

Scripting: `Yappy.setHistoryDepth(200)` and `Yappy.getHistoryDepth()`. Values outside 10–500 are
clamped to the nearest end rather than rejected.

## Saving to My Drawings

<kbd>Ctrl</kbd>+<kbd>S</kbd> saves the current drawing to **My Drawings**, the local library in your browser. The first time you save an untitled drawing you're asked for a **name**; after that the same shortcut saves silently over that name, so you can hit it as often as you like while you work.

Each drawing keeps its own entry. **File → New** starts a fresh document, so the next save creates a new entry rather than replacing the one you just made — but re-saving a drawing you have open updates it in place instead of piling up copies. Open, rename and delete entries from **File → My Drawings…**.

:::tip
My Drawings lives in this browser's storage — convenient, but not a backup. For anything you care about keeping, also use **Export / Save…** (<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>S</kbd>) to write a ` .yappy` file, or save to the cloud.
:::

## Settings — Pen & Input

Open **Settings** from the gear button in the top bar (next to the Properties toggle and Help) or from the menu. It is organised into categories — **General**, **Pen & Input**, **Defaults** (text and shape), **Mindmap**, **Time-lapse** and **Cloud Storage** — pick one on the left to see just its settings. If you know what you want but not where it lives, type in the **search box** at the top: it looks across every category at once and shows only the matching controls.

:::tip
The **Help** dialog (**?**) searches too — its box filters the keyboard shortcuts by name *or* by keys, so “duplicate” and “ctrl+d” both find the same row.
:::

Two options control how the canvas greets you:

- **Default Tool** — which tool is active when Yappy opens, and when you start a new drawing: **Select** (the default, so your first click on the canvas picks things up rather than drawing on them), **Ink Brush** or **Fineliner**. Changing it switches you to that tool right away, so the toolbar matches, and it sticks for next time.
- **Canvas Pointer** — the cursor shown over the canvas while a drawing tool is active: **Crosshair (+)** (the default, easiest to aim), **Concentric circle**, or **Arrow**. Select and Pan keep their own cursors, and hovering a resize or rotate handle always shows that handle's cursor.

Both are per-browser preferences, remembered across sessions, and scriptable: ` Yappy.setDefaultTool('fineliner')` and ` Yappy.setPointerStyle('circle')`.

## Language

**Settings ▸ General ▸ Language** switches the interface. Yappy ships in **English**, **Deutsch**, **Español**, **Français** and **日本語**, and picks one on first run from your browser's language preferences — so a French browser opens in French without you setting anything. Your choice overrides that and is remembered per browser.

**Only the interface is translated. Text inside your drawings is never touched** — not on switching language, not on export. Neither are keyboard shortcuts: they are bound to physical keys, so <kbd>Ctrl</kbd>+<kbd>Z</kbd> is <kbd>Ctrl</kbd>+<kbd>Z</kbd> in every language.

Two things worth knowing:

- **The command palette searches in your language, and in English.** Accents and apostrophes are ignored while matching, so on a French keyboard `elements` finds *Éléments* and `d'exportation` finds *Zone d’exportation* — you do not have to type the typographic apostrophe the label uses. Command names in English keep working too, so you can follow an English tutorial in a French interface.
- **Anything not yet translated stays in English** rather than going blank, string by string. Some panels — Layers among them — are still English in every language while their text is being extracted.

A language is only offered once it is complete, so you will never get a half-translated interface. Translations are our own work rather than a native speaker's review; if a word is wrong in your language, [tell us](https://github.com/rajeshpillai/yappy/issues) — that is the fastest way for it to get fixed.

## Export

From the menu (or right-click → Export) save your work as **PNG**, **JPG**, **SVG**, **PDF** or copy it to the clipboard — the whole canvas or just the selection. **Artboards** export their region to a fixed-size PNG (see the Artboards doc).

### What ends up in the file

On the infinite canvas the export is a **tight crop of your artwork** — the box is the visual
bounds of everything exported (rotation, stroke width, shadows, glow and 3D depth included),
with 2px of padding, so the drawing fills the image rather than sitting in a corner of it.
Paged documents (Design, Slides, Game, Animation) export at their page bounds instead.

What is *excluded* is what the canvas is not showing you:

- objects hidden with the eye toggle in the object tree, **and**
- everything on a **hidden layer**.

That second one matters for framing, not just for content: anything included stretches the
crop box. If an export comes out much larger than your drawing, with the artwork pushed into
one corner, look for an object sitting far out on the canvas — turning its layer's eye off is
now enough to keep it out of both the pixels *and* the box.

### True-vector SVG

SVG export is real **vector**: shapes become `<path>`s, text becomes ` <text>`, and gradients & gradient-mesh fills export as proper ` <linearGradient>`/`<radialGradient>`/`<pattern>` definitions — so the file stays crisp at any size and is editable in Illustrator, Inkscape or the browser. Sketch-style strokes export as vector too (via rough.js). A few highly decorative shapes fall back to an embedded raster image.

:::tip
Choose **SVG** for logos, icons and anything you'll scale or re-edit; **PNG** (2×) for crisp raster output; **PDF** for print.
:::

### Excalidraw import & export

Yappy round-trips with **Excalidraw**. **Export to Excalidraw** (in the Save/Export panel) writes a `.excalidraw` file you can open in Excalidraw — rectangles, ellipses, diamonds, lines, arrows, text, images and pen strokes map across directly; Yappy-only shapes (UML, BPMN, icons, …) are exported as their outline so they still look right. To **import**, just open a `.excalidraw` file from the menu — its elements are added to your current drawing. From a script: `window.Yappy.exportExcalidraw()` and ` window.Yappy.importExcalidraw(json)`.

The native Yappy document format is an open, documented JSON (see ` docs/yappy-format-spec.md`) so other tools can read and write Yappy files too.

## Supporting YappyDraw

YappyDraw is free, open source (AGPL-3.0) and works without an account. Nothing is behind
a payment and nothing is planned to be. If you'd like to chip in anyway, **Menu ▸ ⋮ ▸ Support
YappyDraw**, or `Support` in the command palette (<kbd>Ctrl</kbd>+<kbd>K</kbd>), opens a
small dialog with the ways to do it.

| Route | Good for |
|---|---|
| **Founding Supporter** | A one-off payment for the founding cohort. Founder badge, early access, a vote on the roadmap, the private founder community, and hosted collaboration free for a year once it launches. See [/founders/](/founders/). |
| **Razorpay** | Cards, UPI and net banking, with an amount you choose. Best from India. |
| **GitHub Sponsors** | One-off or monthly, in your own currency. Works worldwide. |

All three are ordinary links that open their own page in a new tab.

:::note
**Founding Supporter is not a paid tier.** There is no Pro version of YappyDraw and no
feature behind a payment. The project is AGPL-3.0, so anyone can read the source, fork it
and run it without paying anyone. What a founder funds is the work continuing; what they
get back is recognition, early access and a say in what gets built.
:::

:::note
**Collaboration, when it arrives, does not change that.** It is being built and is not
available yet. Every feature in the app stays free for everyone — collaboration included —
and anyone can point it at a server of their own and use it without paying anything. What
costs money is the server *we* run, because hosting real-time collaboration bills every
month for every active person on it. Founders get that hosting free for a year from launch,
then at a founder discount; nobody is promised free hosting forever, because one payment
cannot honestly fund a cost that recurs forever.
:::

:::note
**No payment code runs inside YappyDraw.** There is no payment SDK in the bundle, no
third-party script on the canvas page, and nothing about your drawing is sent anywhere when
you open the dialog. It is a list of links until you click one, and the payment then happens
entirely on the provider's site. This is also why the feature needs no server: YappyDraw is a
static site, and hosted payment pages are the only way to take a payment without one.
:::

If the **Support YappyDraw** item isn't in your menu, no support link is configured in that
build. The entry, the command and the API call all hide themselves rather than offer a dead
link. Self-hosters can set their own with the `VITE_SUPPORT_RAZORPAY_URL` and
`VITE_SUPPORT_GITHUB_URL` build variables, or leave them empty to switch the feature off.

From a script:

```
window.Yappy.showSupport();   // opens the dialog; no-ops if nothing is configured
```

## Scripting (API)

Every workspace helper is scriptable from the global `window.Yappy` object — paste these into the browser console. History, view-fit, blends and repeat/transform commands act on the current selection unless you pass explicit ids.

```
const Y = window.Yappy;

// History
Y.undo();                 // step back
Y.redo();                 // step forward

// Fit the whole drawing to the viewport
await Y.zoomToFit();
```

### Blends

```
// select exactly two objects first, then:
Y.blend(6);               // 6 graduated in-between copies
Y.blendMorph(8);          // 8 outline-morph steps (editable paths)

// two objects + a path/line (the spine) selected:
Y.blendAlongPath(10, true); // 10 copies along the spine, orient to tangent
```

### Repeat & transform

```
// operate on the current selection
Y.radialRepeat(8, { radius: 160, faceCenter: true }); // 8 around a ring
Y.gridRepeat(3, 4, { gapX: 20, gapY: 20 });           // 3×4 grid of copies
Y.mirrorCopy('horizontal');                           // mirrored duplicate
Y.transformAgain();                                   // repeat the last move/scale/rotate
```

| Method | What it does |
| --- | --- |
| `undo()` / `redo()` | Step through the history timeline. |
| `zoomToFit()` | Fit all artwork to the viewport (async). |
| `blend(steps?, ids?)` | Graduated blend between two objects. |
| `blendMorph(steps?, ids?)` | Outline-morph blend (new editable paths). |
| `blendAlongPath(steps?, orient?, ids?)` | Distribute the blend along a selected spine. |
| `radialRepeat(count, opts?)` | Copies arranged around a ring. |
| `gridRepeat(rows, cols, opts?)` | Copies in a grid. |
| `mirrorCopy(axis)` | Mirrored duplicate (`'horizontal'`/`'vertical'`). |
| `transformAgain()` | Re-apply the last transform. |
| `setElementTransform(id, {x,y,width,height,angle})` | Numeric position / size / rotation (angle in radians). |
| `setStrokeDash(pattern?, ids?)` | Custom dash pattern (on/off px array); empty/omitted clears it. |
| `toggleRulers(visible?)` | Show/hide the edge rulers + guide system (Alt+R). |
| `addGuide(axis, pos)` | Add a guide — `'h'` at world y, `'v'` at world x. Returns its id. |
| `updateGuide(id, pos)` | Move a guide to a new world coordinate. |
| `removeGuide(id)` | Remove one guide. |
| `clearGuides()` | Remove every guide. |
| `listGuides()` | Every guide as `{ id, axis, pos }`. |
| `selectGuides(ids)` | Replace the guide selection. |
| `selectGuide(id, additive?)` | Select one guide; `additive` toggles it in (Shift+click). |
| `selectAllGuides()` | Select every guide (Ctrl/Cmd+Shift+A). |
| `getSelectedGuides()` | Ids of the selected guides. |
| `clearGuideSelection()` | Clear the guide selection (Esc). |
| `moveSelectedGuides(dx, dy)` | Move the selection — vertical guides take `dx`, horizontal take `dy`. |
| `removeSelectedGuides()` | Delete every selected guide; returns the count. |
| `toggleGuidesLocked(locked?)` | Lock/unlock guides against pointer edits. |
| `loadDocument(doc)` | Replace the document with a saved JSON snapshot. |

:::tip
Save/restore the whole document as JSON: grab it with a snapshot and reload it later with ` Y.loadDocument(json)` — handy for programmatic scene resets.
:::
